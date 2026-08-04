//! 축1 실증 — 언어 중립 vector 가 두 언어를 실제로 묶는가.
//!
//! 보는 것은 정본이 통과하는가가 아니라 **결함이 걸리는가**다. 통과만 확인하면 vector 가
//! 비어 있어도 초록이 뜬다.

use ds_contract::fixtures::{FifoStack, VecStack};
use ds_contract::vector::{Subject, load, replay};

fn vectors_dir() -> String {
    format!("{}/../vectors", env!("CARGO_MANIFEST_DIR"))
}

fn stack_vector() -> ds_contract::vector::Vector {
    load(&format!("{}/Stack.json", vectors_dir())).expect("Stack.json 을 읽는다")
}

#[test]
fn vector_는_비어_있지_않다() {
    let vector = stack_vector();
    assert_eq!(vector.structure, "Stack");
    assert_eq!(vector.element, "number");
    assert!(vector.cases.len() >= 2, "케이스가 너무 적다");

    let steps: usize = vector.cases.iter().map(|c| c.steps.len()).sum();
    assert!(steps >= 100, "단계 {steps}개로는 축1을 판정하지 못한다");
    assert!(
        vector.cases.iter().any(|c| c.kind == "random"),
        "무작위 시퀀스가 없으면 경계만 보게 된다"
    );
}

#[test]
fn 정본은_vector_를_통과한다() {
    let vector = stack_vector();
    let mut subject = VecStack::default();
    match replay(&mut subject, &vector) {
        Ok(steps) => assert!(steps > 0),
        Err(mismatch) => panic!("정본이 vector 와 어긋났다: {mismatch}"),
    }
}

#[test]
fn 결함_fixture_는_vector_에_걸린다() {
    let vector = stack_vector();
    let mut subject = FifoStack::default();
    let result = replay(&mut subject, &vector);
    let mismatch = result.expect_err("FIFO 로 꺼내는 구현이 LIFO 계약을 통과하면 안 된다");
    assert_eq!(mismatch.op, "pop", "가장 먼저 갈리는 자리는 pop 이다");
}

#[test]
fn 케이스마다_상태를_되돌린다() {
    // 되돌리지 않으면 앞 케이스가 남긴 원소가 뒤 케이스의 기대값을 어긋나게 한다.
    let vector = stack_vector();
    let mut subject = VecStack::default();
    subject.apply("push", Some(&serde_json::json!(999.0)));
    replay(&mut subject, &vector).expect("reset 이 앞선 상태를 지운다");
}

#[test]
fn 알_수_없는_schema_는_거부한다() {
    let path = format!("{}/../target/bad-schema.json", env!("CARGO_MANIFEST_DIR"));
    std::fs::create_dir_all(format!("{}/../target", env!("CARGO_MANIFEST_DIR"))).ok();
    std::fs::write(
        &path,
        r#"{"schema":"other@9","structure":"X","grade":"basic","element":"number","cases":[]}"#,
    )
    .expect("임시 vector 를 쓴다");
    let error = load(&path).expect_err("모르는 schema 는 통과하면 안 된다");
    assert!(error.contains("schema"), "{error}");
    std::fs::remove_file(&path).ok();
}
