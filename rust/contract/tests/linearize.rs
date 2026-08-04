//! 선형화 판정 자체의 자기시험. 스레드를 쓰지 않으므로 보통 `cargo test` 로 돈다.
//!
//! 판정기가 무엇이든 통과시키면 축4는 장식이다. 그래서 **통과해서는 안 되는 히스토리**를
//! 손으로 만들어 실제로 거절하는지 본다.

use ds_contract::fixtures::CounterModel;
use ds_contract::linearize::{Call, RetryGuard, linearizable};
use serde_json::json;

fn add(thread: usize, by: u64, ret: u64) -> Call {
    Call::new(thread, "add", Some(json!(by)), Some(json!(ret)))
}

#[test]
fn 겹친_두_증가는_순서만_맞으면_선형화된다() {
    let history = vec![add(0, 1, 1), add(1, 1, 2)];
    assert!(linearizable(&history, &CounterModel::default()));

    let flipped = vec![add(0, 1, 2), add(1, 1, 1)];
    assert!(
        linearizable(&flipped, &CounterModel::default()),
        "두 스레드 사이 순서는 자유이므로 반대 순서도 설명된다"
    );
}

#[test]
fn 갱신을_잃은_히스토리는_거절한다() {
    // 둘 다 1을 돌려줬다 — 순차 실행으로는 나올 수 없는 기록이다.
    let history = vec![add(0, 1, 1), add(1, 1, 1)];
    assert!(!linearizable(&history, &CounterModel::default()));
}

#[test]
fn 스레드_안의_프로그램_순서는_지킨다() {
    // 한 스레드가 낸 두 연산의 순서는 이미 정해져 있다. 1 다음에 2 여야 한다.
    let ordered = vec![add(0, 1, 1), add(0, 1, 2)];
    assert!(linearizable(&ordered, &CounterModel::default()));

    let reversed = vec![add(0, 1, 2), add(0, 1, 1)];
    assert!(
        !linearizable(&reversed, &CounterModel::default()),
        "같은 스레드가 2를 먼저 보고 1을 나중에 볼 수는 없다"
    );
}

#[test]
fn 읽기가_섞여도_판정한다() {
    let history = vec![
        add(0, 2, 2),
        Call::new(1, "read", None, Some(json!(2))),
        Call::new(1, "read", None, Some(json!(2))),
    ];
    assert!(linearizable(&history, &CounterModel::default()));

    let impossible = vec![
        add(0, 2, 2),
        Call::new(1, "read", None, Some(json!(2))),
        Call::new(1, "read", None, Some(json!(0))),
    ];
    assert!(
        !linearizable(&impossible, &CounterModel::default()),
        "값이 2로 읽힌 뒤 0으로 돌아갈 수는 없다"
    );
}

#[test]
fn 빈_히스토리는_선형화된다() {
    assert!(linearizable(&[], &CounterModel::default()));
}

#[test]
#[should_panic(expected = "재시도")]
fn 재시도_상한을_넘으면_실패시킨다() {
    let mut guard = RetryGuard::new("add", 2);
    guard.tick();
    guard.tick();
    guard.tick();
}

#[test]
fn 상한_안의_재시도는_통과한다() {
    let mut guard = RetryGuard::new("add", 2);
    guard.tick();
    guard.tick();
    assert_eq!(guard.count(), 2);
}
