//! 하네스 자기시험용 fixture.
//!
//! TS 쪽 `_contract/_fixtures/` 와 같은 자리다 — **하네스가 결함을 실제로 잡는지** 보기
//! 위한 것이지 계약을 담은 구조가 아니다. 진짜 구조(`concurrentSkipList`)는 KAN-024 가
//! `structures` crate 에 넣는다.
//!
//! 고른 fixture 는 CAS 카운터다. 축4가 보는 두 가지(선형화·진행 보장)를 가장 작은 코드로
//! 드러내기 때문이다 — 정본은 CAS 루프, 결함은 읽고 나서 쓰는 것 하나 차이다.

use serde_json::{Value, json};

use crate::linearize::{RetryGuard, SeqModel};
use crate::vector::Subject;

// ─── 축1 fixture ────────────────────────────────────────────────────────────

/// 축1 정본. `rust/vectors/Stack.json` 을 통과해야 한다.
#[derive(Debug, Default)]
pub struct VecStack {
    items: Vec<f64>,
}

impl Subject for VecStack {
    fn apply(&mut self, op: &str, arg: Option<&Value>) -> Option<Value> {
        match op {
            "push" => {
                self.items.push(arg.and_then(Value::as_f64).expect("push 인자"));
                None
            }
            "pop" => Some(self.items.pop().map_or(Value::Null, |v| json!(v))),
            "peek" => Some(self.items.last().map_or(Value::Null, |v| json!(*v))),
            "isEmpty" => Some(json!(self.items.is_empty())),
            "size" => Some(json!(self.items.len())),
            _ => panic!("모르는 연산: {op}"),
        }
    }

    fn reset(&mut self) {
        self.items.clear();
    }
}

/// 축1 결함 fixture. **앞에서 꺼낸다** — LIFO 가 아니라 FIFO 다.
///
/// 컴파일도 되고 패닉도 나지 않는다. vector 재생만이 잡는다.
#[derive(Debug, Default)]
pub struct FifoStack {
    items: Vec<f64>,
}

impl Subject for FifoStack {
    fn apply(&mut self, op: &str, arg: Option<&Value>) -> Option<Value> {
        match op {
            "push" => {
                self.items.push(arg.and_then(Value::as_f64).expect("push 인자"));
                None
            }
            "pop" => Some(if self.items.is_empty() {
                Value::Null
            } else {
                json!(self.items.remove(0))
            }),
            "peek" => Some(self.items.first().map_or(Value::Null, |v| json!(*v))),
            "isEmpty" => Some(json!(self.items.is_empty())),
            "size" => Some(json!(self.items.len())),
            _ => panic!("모르는 연산: {op}"),
        }
    }

    fn reset(&mut self) {
        self.items.clear();
    }
}

// ─── 축4 fixture ────────────────────────────────────────────────────────────

#[cfg(loom)]
pub(crate) use loom::sync::atomic::{AtomicUsize, Ordering};
#[cfg(not(loom))]
pub(crate) use std::sync::atomic::{AtomicUsize, Ordering};

/// 순차 모델. 선형화 판정이 이 모델과 대조한다.
#[derive(Debug, Clone, Default)]
pub struct CounterModel {
    value: usize,
}

impl SeqModel for CounterModel {
    fn apply(&mut self, op: &str, arg: Option<&Value>) -> Option<Value> {
        match op {
            "add" => {
                let by = arg.and_then(Value::as_u64).unwrap_or(0) as usize;
                self.value += by;
                Some(json!(self.value))
            }
            "read" => Some(json!(self.value)),
            _ => panic!("모델이 모르는 연산: {op}"),
        }
    }
}

/// 정본. CAS 루프이므로 진 스레드가 다시 읽고 다시 시도한다.
#[derive(Debug, Default)]
pub struct CasCounter {
    value: AtomicUsize,
}

impl CasCounter {
    pub fn new() -> Self {
        Self {
            value: AtomicUsize::new(0),
        }
    }

    /// 더한 뒤의 값을 돌려준다. `retries` 상한은 진행 보장 계측이다.
    pub fn add(&self, by: usize, retries: &mut RetryGuard) -> usize {
        loop {
            let current = self.value.load(Ordering::Acquire);
            let next = current + by;
            if self
                .value
                .compare_exchange(current, next, Ordering::AcqRel, Ordering::Acquire)
                .is_ok()
            {
                return next;
            }
            retries.tick();
        }
    }

    pub fn read(&self) -> usize {
        self.value.load(Ordering::Acquire)
    }
}

/// 결함 fixture. **읽고 나서 쓴다.** 단일 스레드에서는 정본과 구별되지 않으므로 축1을
/// 그대로 통과하고, 축4의 선형화 판정만이 잡는다.
#[derive(Debug, Default)]
pub struct RacyCounter {
    value: AtomicUsize,
}

impl RacyCounter {
    pub fn new() -> Self {
        Self {
            value: AtomicUsize::new(0),
        }
    }

    pub fn add(&self, by: usize) -> usize {
        let current = self.value.load(Ordering::Acquire);
        let next = current + by;
        self.value.store(next, Ordering::Release);
        next
    }

    pub fn read(&self) -> usize {
        self.value.load(Ordering::Acquire)
    }
}
