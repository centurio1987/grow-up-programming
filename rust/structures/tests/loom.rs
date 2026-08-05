//! 축4 — `probabilistic/concurrentSkipList` 의 선형화·진행 보장.
//!
//! ```bash
//! RUSTFLAGS="--cfg loom" cargo test --test loom --release
//! ```
//!
//! `--cfg loom` 없이는 이 파일이 통째로 비어 있다. 원자 연산이 `loom` 의 것으로 바뀌어야
//! 스케줄을 훑을 수 있고, 그 전환은 정본과 fixture 의 `cfg(loom)` 이 한다.
//!
//! **히스토리를 어떻게 짓는가가 이 파일의 전부다.** 판정기는 스레드 사이의 실시간 순서를
//! 강제하지 않는다(`rust/contract/src/linearize.rs`) — 스레드 안의 프로그램 순서만 지킨다.
//! 그래서 「내가 넣은 뒤에 상대의 것을 묻는다」를 **한 스레드 안에** 넣어야 결함이 드러난다.
//! 두 스레드가 각각 넣기만 하고 확인을 밖에서 하면, 판정기는 확인을 두 삽입보다 앞에 놓는
//! 순서를 찾아내고 아무것도 걸리지 않는다.

#![cfg(loom)]

use std::sync::atomic::{AtomicBool, Ordering as StdOrdering};

use ds_contract::linearize::{Call, RetryGuard, linearizable};
use ds_structures::concurrent_skip_list::ConcurrentSkipList;
use ds_structures::fixtures::RacySortedSet;
use ds_structures::model::ModelSet;
use loom::sync::Arc;
use loom::thread;
use serde_json::json;

/// CAS 재시도 상한. 스레드 둘이 각각 몇 걸음을 걷는 규모에서 넉넉하고, **상한이 있다는
/// 사실 자체**가 진행 보장 계측이다. 넘으면 그 스케줄에서 진행이 막혔다는 뜻이다.
const RETRY_LIMIT: usize = 16;

fn model() -> ModelSet {
    ModelSet::default()
}

/// 선점 경계를 걸지 않는다 — **이 규모의 스케줄을 전부 훑는다.**
///
/// 경계를 걸어 보고 그만두었다. 경계가 있으면 loom 의 부분 순서 축약이 덜 걸려서 오히려
/// 실행 수가 늘었다(경계 5에서 1,093개, 경계 없이 531개). 어느 쪽도 1초를 넘지 않으므로
/// 약한 주장을 더 비싸게 살 이유가 없다. 남는 한계는 규모다 — 스레드 수와 연산 수를 늘리는
/// 것으로만 좁혀진다(`rust/README.md`).
fn builder() -> loom::model::Builder {
    let mut builder = loom::model::Builder::new();
    builder.preemption_bound = None;
    builder
}

/// 「넣고 나서 상대 것을 묻는다」 두 벌. 스레드 안의 순서가 곧 판정기가 지킬 순서다.
fn crossing_history(
    inserted: (i64, bool),
    seen: (i64, bool),
    other_inserted: (i64, bool),
    other_seen: (i64, bool),
) -> Vec<Call> {
    vec![
        Call::new(
            0,
            "insert",
            Some(json!(inserted.0)),
            Some(json!(inserted.1)),
        ),
        Call::new(0, "has", Some(json!(seen.0)), Some(json!(seen.1))),
        Call::new(
            1,
            "insert",
            Some(json!(other_inserted.0)),
            Some(json!(other_inserted.1)),
        ),
        Call::new(
            1,
            "has",
            Some(json!(other_seen.0)),
            Some(json!(other_seen.1)),
        ),
    ]
}

/// 실제로 훑은 실행 수. **초록이 무엇을 뜻하는지 이 수가 정한다** — 탐색이 한 갈래로
/// 주저앉아도 통과는 통과이기 때문이다.
static EXPLORED: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);

#[test]
fn 정본은_모든_스케줄에서_선형화되고_재시도가_유한하다() {
    builder().check(|| {
        EXPLORED.fetch_add(1, StdOrdering::SeqCst);
        let list = Arc::new(ConcurrentSkipList::<i64>::new());

        let left = {
            let list = list.clone();
            thread::spawn(move || {
                let mut progress = RetryGuard::new("insert", RETRY_LIMIT);
                let inserted = list.insert(1, &mut progress);
                (inserted, list.has(&2))
            })
        };
        let right = {
            let list = list.clone();
            thread::spawn(move || {
                let mut progress = RetryGuard::new("insert", RETRY_LIMIT);
                let inserted = list.insert(2, &mut progress);
                (inserted, list.has(&1))
            })
        };

        let (l_inserted, l_seen) = left.join().expect("왼쪽 스레드");
        let (r_inserted, r_seen) = right.join().expect("오른쪽 스레드");

        let history = crossing_history((1, l_inserted), (2, l_seen), (2, r_inserted), (1, r_seen));
        assert!(
            linearizable(&history, &model()),
            "이 스케줄의 반환 ({l_inserted},{l_seen} / {r_inserted},{r_seen}) 을 설명하는 순차 순서가 없다"
        );

        let mut progress = RetryGuard::new("min", RETRY_LIMIT);
        assert_eq!(list.min(&mut progress), Some(1), "최종 상태의 최소");
        assert_eq!(list.max(&mut progress), Some(2), "최종 상태의 최대");
    });

    let explored = EXPLORED.load(StdOrdering::SeqCst);
    println!("훑은 실행 {explored}개(선점 경계 없음)");
    assert!(
        explored >= 100,
        "실행 {explored}개는 탐색이 아니다 — 통과가 무엇의 부재를 뜻하는지 말할 수 없다"
    );
}

#[test]
fn 같은_값을_동시에_넣으면_true_는_하나다() {
    // 계약의 문장을 그대로 건다 — 「`true` 를 받는 쪽이 정확히 하나」.
    builder().check(|| {
        let list = Arc::new(ConcurrentSkipList::<i64>::new());

        let left = {
            let list = list.clone();
            thread::spawn(move || {
                let mut progress = RetryGuard::new("insert", RETRY_LIMIT);
                list.insert(7, &mut progress)
            })
        };
        let right = {
            let list = list.clone();
            thread::spawn(move || {
                let mut progress = RetryGuard::new("insert", RETRY_LIMIT);
                list.insert(7, &mut progress)
            })
        };

        let l = left.join().expect("왼쪽 스레드");
        let r = right.join().expect("오른쪽 스레드");

        assert!(
            l ^ r,
            "같은 값의 동시 삽입에서 성공은 하나여야 한다 ({l}, {r})"
        );
        let history = vec![
            Call::new(0, "insert", Some(json!(7)), Some(json!(l))),
            Call::new(1, "insert", Some(json!(7)), Some(json!(r))),
        ];
        assert!(
            linearizable(&history, &model()),
            "({l}, {r}) 를 설명하는 순차 순서가 없다"
        );
    });
}

/// 결함이 걸리는 것을 보이려면 「어떤 스케줄에서 실패한다」를 확인해야 한다. `loom` 은
/// 클로저를 여러 번 돌리므로 그 밖에서 세는 표시가 필요하다. `loom` 이 계측하지 않는 std
/// 원자를 쓰는 이유가 이것이다.
static CAUGHT: AtomicBool = AtomicBool::new(false);
/// 그중 몇 개가 걸렸는지. **몇 개가 걸리는가가 결함의 성격을 말해 준다** — 한 개만 걸리면
/// 드문 스케줄이라는 뜻이고, 그 드묾이 곧 무작위 탐색으로는 못 찾는 이유다.
static RACY_TOTAL: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
static RACY_CAUGHT: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);

#[test]
fn 읽고_나서_쓰는_집합은_어떤_스케줄에서_선형화_판정에_걸린다() {
    builder().check(|| {
        let set = Arc::new(RacySortedSet::new());

        let left = {
            let set = set.clone();
            thread::spawn(move || (set.insert(1), set.has(2)))
        };
        let right = {
            let set = set.clone();
            thread::spawn(move || (set.insert(2), set.has(1)))
        };

        let (l_inserted, l_seen) = left.join().expect("왼쪽 스레드");
        let (r_inserted, r_seen) = right.join().expect("오른쪽 스레드");

        let history = crossing_history((1, l_inserted), (2, l_seen), (2, r_inserted), (1, r_seen));
        RACY_TOTAL.fetch_add(1, StdOrdering::SeqCst);
        if !linearizable(&history, &model()) {
            CAUGHT.store(true, StdOrdering::SeqCst);
            RACY_CAUGHT.fetch_add(1, StdOrdering::SeqCst);
        }
    });

    println!(
        "읽고 나서 쓰기 — 실행 {}개 중 {}개가 선형화 불가",
        RACY_TOTAL.load(StdOrdering::SeqCst),
        RACY_CAUGHT.load(StdOrdering::SeqCst)
    );
    assert!(
        CAUGHT.load(StdOrdering::SeqCst),
        "읽고 나서 쓰는 집합이 전 스케줄에서 선형화됐다 — 이 히스토리는 아무것도 가르지 못한다"
    );
}
