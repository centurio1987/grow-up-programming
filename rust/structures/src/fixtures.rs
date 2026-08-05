//! 결함 fixture. **하네스가 결함을 실제로 잡는지** 보기 위한 것이지 계약을 담은 구조가 아니다.
//!
//! 이 자리가 필요한 이유는 축4의 판정 방식이다. 정본이 통과하는 것만 확인하면, 히스토리를
//! 아무것도 구별하지 못하게 지어 놓아도 초록이 뜬다. 결함 하나가 실제로 걸리는 것을 함께
//! 보여야 그 초록이 뜻을 가진다(B5 가 카운터 fixture 로 세운 규약).
//!
//! 고른 결함은 **읽고 나서 쓰기**다. 정렬 집합을 통째로 상자에 넣고, 바꿀 때 읽어서 사본을
//! 고친 뒤 되돌려 놓는다. 단일 스레드에서는 정본과 구별되지 않아 **축1을 그대로 통과하고**,
//! 두 스레드가 겹치면 나중에 쓰는 쪽이 앞의 변경을 덮는다. 축4만이 잡는다.

use serde_json::{Value, json};

use ds_contract::vector::Subject;

#[cfg(loom)]
use loom::sync::atomic::{AtomicPtr, Ordering};
#[cfg(not(loom))]
use std::sync::atomic::{AtomicPtr, Ordering};

/// 정렬 집합을 통째로 바꿔 끼우는 구현. **원자적으로 바꾸지 않는다.**
pub struct RacySortedSet {
    items: AtomicPtr<Vec<i64>>,
    /// 계측. 단위는 정본과 같다(§규약2 계측 단위) — 원소 하나를 지나갈 때마다 1.
    /// 사본을 뜨면 원소 수만큼 지나가므로 그 값이 여기 그대로 쌓인다.
    __cost: std::sync::atomic::AtomicUsize,
}

impl Default for RacySortedSet {
    fn default() -> Self {
        Self::new()
    }
}

impl RacySortedSet {
    pub fn new() -> Self {
        Self {
            items: AtomicPtr::new(Box::into_raw(Box::new(Vec::new()))),
            __cost: std::sync::atomic::AtomicUsize::new(0),
        }
    }

    /// 지금까지 지나간 원소 수.
    pub fn cost(&self) -> usize {
        self.__cost.load(std::sync::atomic::Ordering::Relaxed)
    }

    /// # Safety
    ///
    /// 갈아 끼운 옛 상자를 회수하지 않으므로 여기서 얻은 참조는 늘 살아 있다. fixture 는
    /// 짧게 돌고 끝나므로 그대로 둔다.
    fn read(&self) -> &Vec<i64> {
        unsafe { &*self.items.load(Ordering::Acquire) }
    }

    /// 읽고 → 사본을 고치고 → 되돌려 놓는다. 이 셋 사이가 결함이 사는 자리다.
    fn replace(&self, next: Vec<i64>) {
        self.__cost
            .fetch_add(next.len(), std::sync::atomic::Ordering::Relaxed);
        self.items
            .store(Box::into_raw(Box::new(next)), Ordering::Release);
    }

    pub fn insert(&self, value: i64) -> bool {
        let current = self.read();
        match current.binary_search(&value) {
            Ok(_) => false,
            Err(at) => {
                let mut next = current.clone();
                next.insert(at, value);
                self.replace(next);
                true
            }
        }
    }

    pub fn delete(&self, value: i64) -> bool {
        let current = self.read();
        match current.binary_search(&value) {
            Err(_) => false,
            Ok(at) => {
                let mut next = current.clone();
                next.remove(at);
                self.replace(next);
                true
            }
        }
    }

    pub fn has(&self, value: i64) -> bool {
        self.read().binary_search(&value).is_ok()
    }

    pub fn min(&self) -> Option<i64> {
        self.read().first().copied()
    }

    pub fn max(&self) -> Option<i64> {
        self.read().last().copied()
    }
}

impl Subject for RacySortedSet {
    fn apply(&mut self, op: &str, arg: Option<&Value>) -> Option<Value> {
        let value = || arg.and_then(Value::as_i64).expect("값 인자가 있어야 한다");
        match op {
            "insert" => Some(json!(self.insert(value()))),
            "delete" => Some(json!(self.delete(value()))),
            "has" => Some(json!(self.has(value()))),
            "min" => Some(self.min().map_or(Value::Null, |v| json!(v))),
            "max" => Some(self.max().map_or(Value::Null, |v| json!(v))),
            _ => panic!("모르는 연산: {op}"),
        }
    }

    fn reset(&mut self) {
        self.replace(Vec::new());
    }
}
