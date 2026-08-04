//! 축1 — 언어 중립 test vector 재생.
//!
//! vector 는 사람이 적지 않는다. `tools/emit-vectors.ts` 가 TS 의 `ContractSpec` 과 그
//! 참조 모델을 실제로 돌려 뽑는다. 그래서 이 파일이 하는 일은 **비교뿐**이고, 계약을
//! 다시 적지 않는다 — 두 언어가 어긋날 자리를 만들지 않기 위해서다.

use serde::Deserialize;
use serde_json::Value;

pub const SCHEMA: &str = "ord006/contract-vector@1";

#[derive(Debug, Deserialize)]
pub struct Vector {
    pub schema: String,
    pub structure: String,
    pub grade: String,
    pub element: String,
    pub cases: Vec<Case>,
}

#[derive(Debug, Deserialize)]
pub struct Case {
    pub name: String,
    pub kind: String,
    pub steps: Vec<Step>,
}

#[derive(Debug, Deserialize)]
pub struct Step {
    pub op: String,
    /// 인자가 없는 연산은 열쇠가 없다.
    #[serde(default, deserialize_with = "present")]
    pub arg: Option<Value>,
    /// **반환이 없는 연산은 열쇠가 없다.** `null` 을 돌려주는 연산(빈 스택의 `pop`)과
    /// 구분해야 하므로 `Option<Value>` 의 기본 동작(`null` → `None`)에 맡기지 않는다.
    #[serde(default, deserialize_with = "present")]
    pub expect: Option<Value>,
}

/// 열쇠가 있으면 `Some`(값이 `null` 이어도), 없으면 `None`.
fn present<'de, D>(deserializer: D) -> Result<Option<Value>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    Ok(Some(Value::deserialize(deserializer)?))
}

/// vector 를 받는 쪽. 구현이든 결함 fixture 든 이 하나만 만족하면 재생된다.
pub trait Subject {
    /// 반환이 없는 연산은 `None` 을 돌려준다.
    fn apply(&mut self, op: &str, arg: Option<&Value>) -> Option<Value>;
    /// 케이스마다 빈 상태로 되돌린다.
    fn reset(&mut self);
}

#[derive(Debug)]
pub struct Mismatch {
    pub case: String,
    pub index: usize,
    pub op: String,
    pub observed: Option<Value>,
    pub expected: Option<Value>,
}

impl std::fmt::Display for Mismatch {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let show = |v: &Option<Value>| match v {
            None => "(반환 없음)".to_string(),
            Some(v) => v.to_string(),
        };
        write!(
            f,
            "[{}] {}번째 {} — 관측 {} / vector {}",
            self.case,
            self.index,
            self.op,
            show(&self.observed),
            show(&self.expected)
        )
    }
}

pub fn load(path: &str) -> Result<Vector, String> {
    let text = std::fs::read_to_string(path).map_err(|e| format!("{path}: {e}"))?;
    let vector: Vector = serde_json::from_str(&text).map_err(|e| format!("{path}: {e}"))?;
    if vector.schema != SCHEMA {
        return Err(format!(
            "{path}: 알 수 없는 schema {} (아는 것은 {SCHEMA})",
            vector.schema
        ));
    }
    Ok(vector)
}

/// 숫자를 f64 로 눕혀 비교한다. JSON 의 `3` 과 `3.0` 은 같은 값이지만 `serde_json` 에서는
/// 서로 다른 변종이라, 언어를 넘나드는 비교에서 이것을 맞추지 않으면 전부 어긋난다.
pub fn same(a: &Value, b: &Value) -> bool {
    match (a, b) {
        (Value::Number(x), Value::Number(y)) => match (x.as_f64(), y.as_f64()) {
            (Some(x), Some(y)) => x == y,
            _ => x == y,
        },
        (Value::Array(x), Value::Array(y)) => {
            x.len() == y.len() && x.iter().zip(y).all(|(x, y)| same(x, y))
        }
        _ => a == b,
    }
}

fn same_opt(a: &Option<Value>, b: &Option<Value>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(a), Some(b)) => same(a, b),
        _ => false,
    }
}

/// vector 전체를 재생한다. 첫 어긋남에서 멈춘다 — 이후 상태가 이미 오염됐기 때문이다.
pub fn replay(subject: &mut dyn Subject, vector: &Vector) -> Result<usize, Mismatch> {
    let mut steps = 0;
    for case in &vector.cases {
        subject.reset();
        for (index, step) in case.steps.iter().enumerate() {
            let observed = subject.apply(&step.op, step.arg.as_ref());
            if !same_opt(&observed, &step.expect) {
                return Err(Mismatch {
                    case: case.name.clone(),
                    index,
                    op: step.op.clone(),
                    observed,
                    expected: step.expect.clone(),
                });
            }
            steps += 1;
        }
    }
    Ok(steps)
}
