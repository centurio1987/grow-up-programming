//! 계약의 **순차 투영**. 축1과 축4가 함께 쓴다.
//!
//! 축4의 선형화 판정은 「이 히스토리를 설명하는 순차 순서가 있는가」를 묻고, 그 순차 순서가
//! 만족해야 할 모델이 필요하다(`rust/contract/src/linearize.rs`). 그런데 계약의 정본은
//! TypeScript 쪽 헤더이고 참조 모델도 거기 있다 — 같은 모델을 Rust 에 다시 적으면 **그 둘이
//! 갈라진다.** 이 프로젝트가 고치려는 결함이 그 형태다.
//!
//! 그래서 여기 적은 모델도 **검사를 받는다.** 축1의 언어 중립 vector 는 TS 참조 모델을 실제로
//! 돌려 뽑은 것이므로, 이 모델을 그 vector 에 넣어 재생시키면 두 모델이 어긋난 자리에서
//! 걸린다(`rust/structures/tests/vector.rs`). 정본만 vector 를 통과시키고 모델은 안 시키면
//! 축4가 검사받지 않은 모델 위에서 판정하게 된다.

use std::collections::BTreeSet;

use ds_contract::linearize::SeqModel;
use ds_contract::vector::Subject;
use serde_json::{Value, json};

/// 자명한 정렬 집합. 축1은 의미만 보고 비용은 보지 않으므로 이것으로 충분하다.
#[derive(Debug, Clone, Default)]
pub struct ModelSet {
    items: BTreeSet<i64>,
}

impl ModelSet {
    fn run(&mut self, op: &str, arg: Option<&Value>) -> Option<Value> {
        let value = || arg.and_then(Value::as_i64).expect("값 인자가 있어야 한다");
        match op {
            "insert" => Some(json!(self.items.insert(value()))),
            "delete" => Some(json!(self.items.remove(&value()))),
            "has" => Some(json!(self.items.contains(&value()))),
            "min" => Some(self.items.first().map_or(Value::Null, |v| json!(v))),
            "max" => Some(self.items.last().map_or(Value::Null, |v| json!(v))),
            _ => panic!("모델이 모르는 연산: {op}"),
        }
    }
}

impl SeqModel for ModelSet {
    fn apply(&mut self, op: &str, arg: Option<&Value>) -> Option<Value> {
        self.run(op, arg)
    }
}

impl Subject for ModelSet {
    fn apply(&mut self, op: &str, arg: Option<&Value>) -> Option<Value> {
        self.run(op, arg)
    }

    fn reset(&mut self) {
        self.items.clear();
    }
}
