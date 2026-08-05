//! 축1 — `rust/vectors/ConcurrentSkipList.json` 재생.
//!
//! 이 구조에서 vector 의 쓰임이 다른 구조와 다르다. 나머지는 TS 하네스가 이미 축1을 돌고
//! vector 는 Rust 포트를 위한 파생물인데, `concurrency` 등급은 TS 스위트가 돌지 않으므로
//! **여기가 축1의 유일한 경로다**(§규약2 「축4 — 동시성」).
//!
//! 재생하는 대상이 둘인 것도 그래서다 — 정본과 **순차 모델**을 함께 넣는다. 모델은 축4가
//! 대조할 상대이고, 검사받지 않은 모델 위에서 선형화를 판정하면 그 판정이 무엇을 뜻하는지
//! 말할 수 없다(`rust/structures/src/model.rs`).

use ds_contract::linearize::RetryGuard;
use ds_contract::vector::{Subject, Vector, load, replay};
use ds_structures::concurrent_skip_list::ConcurrentSkipList;
use ds_structures::fixtures::RacySortedSet;
use ds_structures::model::ModelSet;
use serde_json::{Value, json};

/// 홀로 실행에서는 재시도가 나지 않는다. 상한은 그 사실을 지키는 자리이지 성능 여유가 아니다.
const RETRY_LIMIT: usize = 8;

fn vector() -> Vector {
    let path = format!(
        "{}/../vectors/ConcurrentSkipList.json",
        env!("CARGO_MANIFEST_DIR")
    );
    load(&path).expect("ConcurrentSkipList.json 을 읽는다")
}

/// 정본을 vector 하네스에 물리는 껍데기.
struct ListSubject {
    list: ConcurrentSkipList<i64>,
}

impl Default for ListSubject {
    fn default() -> Self {
        Self {
            list: ConcurrentSkipList::new(),
        }
    }
}

impl Subject for ListSubject {
    fn apply(&mut self, op: &str, arg: Option<&Value>) -> Option<Value> {
        let mut progress = RetryGuard::new("vector", RETRY_LIMIT);
        let value = || arg.and_then(Value::as_i64).expect("값 인자가 있어야 한다");
        match op {
            "insert" => Some(json!(self.list.insert(value(), &mut progress))),
            "delete" => Some(json!(self.list.delete(&value(), &mut progress))),
            "has" => Some(json!(self.list.has(&value()))),
            "min" => Some(
                self.list
                    .min(&mut progress)
                    .map_or(Value::Null, |v| json!(v)),
            ),
            "max" => Some(
                self.list
                    .max(&mut progress)
                    .map_or(Value::Null, |v| json!(v)),
            ),
            _ => panic!("모르는 연산: {op}"),
        }
    }

    fn reset(&mut self) {
        self.list = ConcurrentSkipList::new();
    }
}

#[test]
fn vector_는_비어_있지_않다() {
    let vector = vector();
    assert_eq!(vector.structure, "ConcurrentSkipList");
    assert_eq!(vector.grade, "concurrency");
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
    let vector = vector();
    let mut subject = ListSubject::default();
    match replay(&mut subject, &vector) {
        Ok(steps) => assert!(steps > 0),
        Err(mismatch) => panic!("정본이 vector 와 어긋났다: {mismatch}"),
    }
}

#[test]
fn 순차_모델도_같은_vector_를_통과한다() {
    // 축4가 이 모델과 대조한다. TS 참조 모델이 뽑은 vector 를 이 모델이 통과하지 못하면
    // 두 언어의 모델이 갈린 것이고, 그 위에서 내린 선형화 판정은 아무것도 뜻하지 않는다.
    let vector = vector();
    let mut model = ModelSet::default();
    match replay(&mut model, &vector) {
        Ok(steps) => assert!(steps > 0),
        Err(mismatch) => panic!("순차 모델이 TS 참조 모델과 갈렸다: {mismatch}"),
    }
}

#[test]
fn 결함_fixture_는_축1을_그대로_통과한다() {
    // 축4가 따로 서야 하는 근거가 이 통과다. 읽고 나서 쓰는 구현은 **단일 스레드에서
    // 정본과 구별되지 않는다** — 벡터를 아무리 늘려도 여기서는 안 걸린다.
    let vector = vector();
    let mut subject = RacySortedSet::new();
    replay(&mut subject, &vector).expect("읽고 나서 쓰기는 순차 실행에서 정본과 같다");
}

#[test]
fn 케이스마다_상태를_되돌린다() {
    let vector = vector();
    let mut subject = ListSubject::default();
    subject.apply("insert", Some(&json!(999)));
    replay(&mut subject, &vector).expect("reset 이 앞선 상태를 지운다");
}
