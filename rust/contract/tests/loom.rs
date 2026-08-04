//! 축4 실증 — `loom` 모델 검사기 아래에서 선형화·진행 보장을 판정한다.
//!
//! ```bash
//! RUSTFLAGS="--cfg loom" cargo test --test loom --release
//! ```
//!
//! `--cfg loom` 없이는 이 파일이 통째로 비어 있다. 원자 연산이 `loom` 의 것으로 바뀌어야
//! 스케줄을 훑을 수 있고, 그 전환은 `fixtures.rs` 의 `cfg(loom)` 이 한다.
//!
//! 보는 것은 정본이 통과하는가가 아니라 **결함이 걸리는가**다. 결함 fixture 는 단일
//! 스레드에서 정본과 구별되지 않아 축1을 그대로 통과한다 — 축4만이 잡는다.

#![cfg(loom)]

use std::sync::atomic::{AtomicBool, Ordering as StdOrdering};

use ds_contract::fixtures::{CasCounter, CounterModel, RacyCounter};
use ds_contract::linearize::{Call, RetryGuard, linearizable};
use loom::sync::Arc;
use loom::thread;
use serde_json::json;

/// CAS 재시도 상한. 스레드 둘이 각각 한 번 더하므로 진는 쪽이 최대 한 번 다시 돈다.
/// 넉넉히 잡아도 상한이 있다는 사실 자체가 진행 보장 계측이다.
const RETRY_LIMIT: usize = 8;

fn history(r0: usize, r1: usize) -> Vec<Call> {
    vec![
        Call::new(0, "add", Some(json!(1)), Some(json!(r0))),
        Call::new(1, "add", Some(json!(1)), Some(json!(r1))),
    ]
}

#[test]
fn 정본은_모든_스케줄에서_선형화되고_재시도가_유한하다() {
    loom::model(|| {
        let counter = Arc::new(CasCounter::new());

        let a = counter.clone();
        let left = thread::spawn(move || {
            let mut guard = RetryGuard::new("add", RETRY_LIMIT);
            a.add(1, &mut guard)
        });
        let b = counter.clone();
        let right = thread::spawn(move || {
            let mut guard = RetryGuard::new("add", RETRY_LIMIT);
            b.add(1, &mut guard)
        });

        let r0 = left.join().expect("왼쪽 스레드");
        let r1 = right.join().expect("오른쪽 스레드");

        assert!(
            linearizable(&history(r0, r1), &CounterModel::default()),
            "이 스케줄의 반환 ({r0}, {r1}) 을 설명하는 순차 순서가 없다"
        );
        assert_eq!(counter.read(), 2, "최종 상태도 순차 실행과 같아야 한다");
    });
}

/// 결함이 걸리는 것을 보이려면 "어떤 스케줄에서 실패한다"를 확인해야 한다. `loom::model`
/// 은 클로저를 여러 번 돌리므로, 그 밖에서 세는 표시가 필요하다. `loom` 이 계측하지 않는
/// std 원자를 쓰는 이유가 이것이다.
static CAUGHT: AtomicBool = AtomicBool::new(false);

#[test]
fn 결함_카운터는_어떤_스케줄에서_선형화_판정에_걸린다() {
    loom::model(|| {
        let counter = Arc::new(RacyCounter::new());

        let a = counter.clone();
        let left = thread::spawn(move || a.add(1));
        let b = counter.clone();
        let right = thread::spawn(move || b.add(1));

        let r0 = left.join().expect("왼쪽 스레드");
        let r1 = right.join().expect("오른쪽 스레드");

        if !linearizable(&history(r0, r1), &CounterModel::default()) {
            CAUGHT.store(true, StdOrdering::SeqCst);
        }
    });

    assert!(
        CAUGHT.load(StdOrdering::SeqCst),
        "읽고 나서 쓰는 구현이 전 스케줄에서 선형화됐다 — 판정기가 아무것도 잡지 못한다"
    );
}
