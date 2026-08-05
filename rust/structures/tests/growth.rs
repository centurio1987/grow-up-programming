//! 축3 성장률 실측 — $r = C(4n)/C(n)$.
//!
//! **이 자리가 왜 Rust 에 있는지부터 적는다.** 성장률을 판정하는 하네스는 TypeScript 에
//! 있는데(`src/data-structures/_contract/judge.ts`) 이 구조는 규약4 (가) 등급이라 정본이
//! Rust 에 있다. 잴 대상과 재는 자가 다른 언어에 있으므로 TS 스위트가 이 계약의 상한을
//! 판정하지 못하고, 그래서 여기서 잰다.
//!
//! 규격은 그쪽을 그대로 쓴다 — 크기 사다리 $\{2^{10}, 2^{12}, 2^{14}\}$, 허용치 ±30%,
//! `expected` 한정자는 seed 다섯의 평균을 중앙값으로 모은다(§규약2 「축3 — 성장률 판정」).
//! 상수를 여기 다시 적은 것이 규격의 표류 지점이므로, 값을 고칠 일이 생기면 §규약2 를
//! 먼저 고치고 여기로 옮긴다.
//!
//! **벽시계를 쓰지 않는다**(불변 사실 7). 재는 것은 정본이 보고하는 「지나간 노드 수」다.

#![cfg(not(loom))]

use ds_contract::linearize::RetryGuard;
use ds_structures::concurrent_skip_list::ConcurrentSkipList;
use ds_structures::fixtures::RacySortedSet;

/// 크기 사다리. 이웃한 값이 4배여야 한다 — 판정이 $C(4n)/C(n)$ 이기 때문이다.
const SIZES: [usize; 3] = [1 << 10, 1 << 12, 1 << 14];
/// `discriminating` 엄격도의 허용치.
const TOLERANCE: f64 = 0.3;
/// `expected` 한정자의 seed 수.
const SEEDS: [u64; 5] = [1, 2, 3, 4, 5];
/// 크기 n 에서 재는 연산 횟수. n 에 견주어 작아야 재는 동안 n 이 바뀌지 않는다.
const SAMPLES: usize = 64;
const RETRY_LIMIT: usize = 8;

/// 결정적 난수원. seed 를 고정해야 실패를 재현할 수 있다.
fn rng_from(seed: u64) -> impl FnMut() -> i64 {
    let mut state = seed.wrapping_mul(0x9e37_79b9_7f4a_7c15);
    move || {
        state = state.wrapping_add(0x9e37_79b9_7f4a_7c15);
        let mut z = state;
        z = (z ^ (z >> 30)).wrapping_mul(0xbf58_476d_1ce4_e5b9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94d0_49bb_1331_11eb);
        ((z ^ (z >> 31)) >> 1) as i64
    }
}

fn filled(n: usize, seed: u64) -> (ConcurrentSkipList<i64>, Vec<i64>) {
    let list = ConcurrentSkipList::new();
    let mut next = rng_from(seed);
    let mut progress = RetryGuard::new("build", RETRY_LIMIT);
    let mut values = Vec::with_capacity(n);
    while values.len() < n {
        let value = next();
        if list.insert(value, &mut progress) {
            values.push(value);
        }
    }
    (list, values)
}

/// 연산 하나의 평균 비용. 준비 작업은 재지 않는다 — 재는 구간만 계측 차이로 뽑는다.
fn per_op(n: usize, seed: u64, op: &'static str) -> f64 {
    let (list, values) = filled(n, seed);
    let mut next = rng_from(seed ^ 0xabcd);
    let mut progress = RetryGuard::new(op, RETRY_LIMIT);

    let before = list.cost();
    match op {
        "insert" => {
            for _ in 0..SAMPLES {
                list.insert(next(), &mut progress);
            }
        }
        "delete" => {
            for index in 0..SAMPLES {
                let victim = values[index * (n / SAMPLES)];
                list.delete(&victim, &mut progress);
            }
        }
        "has" => {
            for index in 0..SAMPLES {
                list.has(&values[index * (n / SAMPLES)]);
            }
        }
        "min" => {
            for _ in 0..SAMPLES {
                list.min(&mut progress);
            }
        }
        "max" => {
            for _ in 0..SAMPLES {
                list.max(&mut progress);
            }
        }
        _ => panic!("모르는 연산: {op}"),
    }
    (list.cost() - before) as f64 / SAMPLES as f64
}

fn median(mut values: Vec<f64>) -> f64 {
    values.sort_by(|a, b| a.partial_cmp(b).expect("계측값에 NaN 이 없다"));
    let mid = values.len() / 2;
    if values.len() % 2 == 1 {
        values[mid]
    } else {
        (values[mid - 1] + values[mid]) / 2.0
    }
}

/// `expected` 한정자의 대표 통계 — seed 별 평균의 중앙값.
fn statistic(n: usize, op: &'static str) -> f64 {
    median(SEEDS.iter().map(|&seed| per_op(n, seed, op)).collect())
}

/// `O(log n)` 의 기대 비율. $\log(4n)/\log(n)$ 이다.
fn expected_ratio(n: usize) -> f64 {
    ((4 * n) as f64).log2() / (n as f64).log2()
}

fn judge(op: &'static str, expected_of: fn(usize) -> f64, label: &str) {
    let points: Vec<(usize, f64)> = SIZES.iter().map(|&n| (n, statistic(n, op))).collect();
    for pair in points.windows(2) {
        let (from, low) = pair[0];
        let (to, high) = pair[1];
        let r = high / low;
        let expected = expected_of(from);
        let lo = expected * (1.0 - TOLERANCE);
        let hi = expected * (1.0 + TOLERANCE);
        println!(
            "{op} {from}->{to}: C={low:.2}->{high:.2} r={r:.2} ({label} 기대 {expected:.2}, 허용 {lo:.2}~{hi:.2})"
        );
        assert!(
            r >= lo && r <= hi,
            "{op} 의 성장률이 {label} 계급을 벗어났다 — {from}->{to} 에서 r={r:.2}"
        );
    }
}

#[test]
fn 넣고_지우고_묻는_셋은_로그_계급으로_자란다() {
    for op in ["insert", "delete", "has"] {
        judge(op, expected_ratio, "O(log n)");
    }
}

/// **정본이 계약보다 빠른 자리가 여기다.** 계약은 `min` 을 `expected O(log n)` 으로 적는데
/// 이 정본은 머리의 다음 하나만 읽으므로 상수다(실측 $C = 1.00$ 으로 세 크기 모두 같다).
///
/// 계약을 정본에 맞춰 `O(1)` 로 내려 적지 않았다. 내려 적으면 **최소를 찾으려고 내려가야 하는
/// 정렬 구조**가 통째로 나가는데, 그 배제를 요구하는 것이 목적에 없기 때문이다(§규약1 「상한이
/// 목적에서 유일하게 따라 나오지 않는 계약이 있다」). 그래서 이 자리는 불변 사실 49 가 말한
/// 조합 — 계약보다 빠른 정본 — 이고, 성장률은 **정본의 계급**으로 판정한다. 계약 위반이 아니다.
#[test]
fn 최소는_정본에서_상수_계급이다() {
    judge("min", |_| 1.0, "O(1)");
}

/// `max` 는 **이웃 비율로 판정할 수 없다.** 실측이 그 이유를 그대로 보인다.
///
/// 세 크기의 $C$ 가 10.00 · 18.00 · 11.00 이다. 담긴 수가 16배가 되는 동안 값이 오르내린다 —
/// 이 연산의 비용은 레벨 사다리를 한 번 내려오는 걸음 수라 **10 안팎의 작은 수**이고, 그 수를
/// 정하는 것은 담긴 수가 아니라 가장 큰 값들이 어느 레벨에 섰는가다. 크기를 4배 늘려도 걸음
/// 하나가 붙거나 빠지는 정도이므로, 이웃 비율($18/10 = 1.80$)은 계급이 아니라 그 흔들림을
/// 재게 된다.
///
/// 그래서 거는 것은 사다리 **양 끝**이다. 16배 크기에서 선형이면 비율이 16.00 이어야 하고,
/// 실측은 $11/10 = 1.10$ 이다. 로그 계급의 기대값($14/10 = 1.40$)과도 붙어 있지만 그 둘을
/// 이 사다리에서 가르지는 못한다 — 가르지 못하는 것을 가른다고 적지 않는다.
#[test]
fn 최대는_선형_계급이_아니다() {
    let points: Vec<(usize, f64)> = SIZES.iter().map(|&n| (n, statistic(n, "max"))).collect();
    for (n, cost) in &points {
        println!("max n={n}: C={cost:.2}");
    }
    let (first, last) = (points[0], points[points.len() - 1]);
    let r = last.1 / first.1;
    let sizes = last.0 as f64 / first.0 as f64;
    println!(
        "max {}->{}: r={r:.2} (선형이면 {sizes:.2})",
        first.0, last.0
    );
    assert!(
        r < sizes / 4.0,
        "max 가 선형 계급으로 자란다 — {}->{} 에서 r={r:.2}",
        first.0,
        last.0
    );
}

#[test]
fn 통째로_사본을_뜨는_설계는_같은_사다리에서_선형으로_자란다() {
    // `naive` 대조군. 읽고 나서 쓰는 설계는 선형화만 깨뜨리는 것이 아니라 비용도 다른
    // 계급에 선다 — 바꿀 때마다 담긴 원소 전부를 지나가기 때문이다.
    let mut measured = Vec::new();
    for &n in &SIZES {
        let set = RacySortedSet::new();
        let mut next = rng_from(1);
        for _ in 0..n {
            set.insert(next());
        }
        let before = set.cost();
        for _ in 0..SAMPLES {
            set.insert(next());
        }
        measured.push((n, (set.cost() - before) as f64 / SAMPLES as f64));
    }

    for pair in measured.windows(2) {
        let (from, low) = pair[0];
        let (to, high) = pair[1];
        let r = high / low;
        println!("통째 사본 insert {from}->{to}: C={low:.2}->{high:.2} r={r:.2} (O(n) 기대 4.00)");
        assert!(
            (2.8..=5.2).contains(&r),
            "대조군이 선형으로 자라지 않으면 대조가 되지 않는다 — r={r:.2}"
        );
    }
}
