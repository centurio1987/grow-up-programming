//! 축4 — 선형화(linearizability)와 진행 보장(lock-freedom).
//!
//! **축4는 `__cost` 를 쓰지 않는다.** 축1~3은 누적 카운터 기반이라 "각 연산이 어느
//! 시점에 일어난 것으로 볼 수 있는가"를 담지 못한다. 담게 만드는 것이 아니라 축을 따로
//! 세우는 것이 답이라는 것이 규약2의 판정이다.
//!
//! 여기서 보는 것은 **히스토리**다. 동시 실행이 남긴 (스레드·연산·인자·반환) 기록에
//! 대해, 그것을 설명하는 순차 순서가 존재하는지 찾는다. 그 순차 순서가 만족해야 할
//! 모델은 축1의 참조 모델과 같은 것이다.

use serde_json::Value;

use crate::vector::same;

/// 히스토리의 한 칸. 실행이 끝난 뒤에 모은다.
#[derive(Debug, Clone)]
pub struct Call {
    pub thread: usize,
    pub op: String,
    pub arg: Option<Value>,
    /// 반환이 없는 연산은 `None`.
    pub ret: Option<Value>,
}

impl Call {
    pub fn new(thread: usize, op: &str, arg: Option<Value>, ret: Option<Value>) -> Self {
        Self {
            thread,
            op: op.to_string(),
            arg,
            ret,
        }
    }
}

/// 선형화가 만족해야 할 순차 모델. 축1의 참조 모델과 같은 역할이다.
pub trait SeqModel: Clone {
    fn apply(&mut self, op: &str, arg: Option<&Value>) -> Option<Value>;
}

fn same_opt(a: &Option<Value>, b: &Option<Value>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(a), Some(b)) => same(a, b),
        _ => false,
    }
}

/// 히스토리를 설명하는 순차 순서가 있는가.
///
/// 두 제약을 건다.
///
/// 1. **스레드 안에서는 프로그램 순서를 지킨다.** 한 스레드가 낸 연산끼리는 순서가 이미
///    정해져 있다.
/// 2. **스레드 사이는 자유롭다.** 여기 모으는 히스토리는 전부 겹쳐 실행된 것이라
///    실시간 순서가 강제하는 바가 없다 — 그래서 이 설정에서는 이것이 가장 강한 요구다.
///
/// 겹치지 않은 연산이 섞인 히스토리를 다루게 되면 실시간 순서 제약을 여기 더해야 한다.
/// 지금 하네스는 겹치는 것만 모으므로 그 자리를 비워 둔다.
pub fn linearizable<M: SeqModel>(history: &[Call], initial: &M) -> bool {
    let threads = history.iter().map(|c| c.thread).max().map_or(0, |m| m + 1);
    let mut per_thread: Vec<Vec<&Call>> = vec![Vec::new(); threads];
    for call in history {
        per_thread[call.thread].push(call);
    }
    let mut cursor = vec![0usize; threads];
    search(&per_thread, &mut cursor, initial)
}

fn search<M: SeqModel>(per_thread: &[Vec<&Call>], cursor: &mut [usize], model: &M) -> bool {
    if cursor
        .iter()
        .zip(per_thread)
        .all(|(taken, calls)| *taken == calls.len())
    {
        return true;
    }

    for thread in 0..per_thread.len() {
        let taken = cursor[thread];
        let Some(call) = per_thread[thread].get(taken) else {
            continue;
        };
        let mut next = model.clone();
        let ret = next.apply(&call.op, call.arg.as_ref());
        if !same_opt(&ret, &call.ret) {
            continue;
        }
        cursor[thread] = taken + 1;
        if search(per_thread, cursor, &next) {
            return true;
        }
        cursor[thread] = taken;
    }
    false
}

/// 진행 보장 계측. CAS 재시도를 세고 상한을 넘으면 그 자리에서 실패시킨다.
///
/// **이 검사가 무엇을 보이고 무엇을 못 보이는지 적어 둔다.** loom 이 탐색 가능한 전
/// 스케줄을 훑으므로, 상한을 넘는 스케줄이 없다는 것은 **그 스레드 수·그 연산 수의
/// 범위 안에서** 굶는 스레드가 없다는 뜻이다. 임의의 스레드 수에 대한 lock-freedom 증명이
/// 아니다. 모델 검사기의 한계이지 이 계측의 한계가 아니며, 규모를 늘리는 것으로 좁혀진다.
pub struct RetryGuard {
    what: &'static str,
    limit: usize,
    count: usize,
}

impl RetryGuard {
    pub fn new(what: &'static str, limit: usize) -> Self {
        Self {
            what,
            limit,
            count: 0,
        }
    }

    /// 재시도 1회. 상한을 넘으면 패닉이다 — loom 모델 안에서 이것이 실패 신호다.
    pub fn tick(&mut self) {
        self.count += 1;
        assert!(
            self.count <= self.limit,
            "{} 가 재시도 {}회를 넘겼다(상한 {}). 이 스케줄에서 진행이 막힌다",
            self.what,
            self.limit,
            self.limit
        );
    }

    pub fn count(&self) -> usize {
        self.count
    }
}
