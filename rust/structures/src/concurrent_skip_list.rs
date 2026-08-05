//! `probabilistic/concurrentSkipList` 의 정본.
//!
//! **계약은 이 파일에 없다.** 계약이 사는 자리는
//! `src/data-structures/probabilistic/concurrentSkipList/concurrentSkipList.ts` 헤더 한 곳이고
//! (§규약1), 여기 있는 것은 그 계약을 실제로 지키는 구현 하나다. 레벨을 어떻게 배정하는지,
//! 지운 노드를 어떻게 표시하는지, 언제 떼어 내는지는 전부 이 파일의 선택이지 계약이 아니다.
//!
//! 계약이 요구하는 것 둘을 이 구현이 어떻게 얻는지만 적는다.
//!
//! - **선형화.** 연산마다 「이 시점에 일어난 것으로 본다」고 지목할 수 있는 원자 연산이
//!   하나씩 있다. 각 연산의 문서에 그 자리를 적었다.
//! - **진행 보장(lock-free).** 잠금이 없고, 재시도는 **다른 스레드가 무언가를 끝냈을 때만**
//!   일어난다. 그래서 어떤 스레드를 멈춰도 나머지 중 하나는 끝난다. 재시도 횟수는
//!   `RetryGuard` 가 세고, 상한을 넘으면 그 자리에서 실패한다(§규약2 「축4 — 동시성」).
//!
//! **지운 노드의 메모리를 연산 중에 되돌려주지 않는다.** 떼어 낸 노드를 읽고 있는 스레드가
//! 남아 있을 수 있기 때문이다. 실제 구현은 epoch 기반 회수나 hazard pointer 로 그 시점을
//! 정하는데, 계약이 시간만 말하고 공간을 말하지 않으므로(§규약1 「공간은 어느 계약에도
//! 없다」) 그 장치는 계약의 문장이 되지 못한다. 여기서는 **소유자가 사라질 때 살아 있는
//! 사슬만 회수**하고, 떼어 낸 노드는 그대로 둔다. 그 선택이 무엇을 뜻하는지는 가이드가 센다.

use std::hash::{DefaultHasher, Hash, Hasher};
use std::ptr;
use std::sync::atomic::AtomicUsize;
/// 계측 전용 메모리 순서. `loom` 이 훑지 않는 std 원자를 쓰므로 std 의 것을 그대로 쓴다.
use std::sync::atomic::Ordering as CostOrdering;

use ds_contract::linearize::RetryGuard;

#[cfg(loom)]
use loom::sync::atomic::{AtomicPtr, Ordering};
#[cfg(not(loom))]
use std::sync::atomic::{AtomicPtr, Ordering};

/// 레벨 수. **계약이 아니라 표현의 선택이다.**
///
/// `loom` 아래에서 작게 잡는 이유는 판정의 성격이다 — 모델 검사기는 스케줄을 전부 훑으므로
/// 레벨 하나가 늘면 연산 하나가 내는 원자 접근이 늘고 탐색 공간이 그만큼 커진다. 레벨 수는
/// 계약에 없으므로 이렇게 갈라도 계약이 달라지지 않는다.
#[cfg(loom)]
const MAX_LEVEL: usize = 2;
#[cfg(not(loom))]
const MAX_LEVEL: usize = 16;

/// 다음 노드 포인터의 낮은 비트. 서 있으면 **이 노드가 논리적으로 지워졌다**는 뜻이다.
///
/// 값이 아니라 포인터에 표시를 다는 이유는 원자성이다. 「지워졌다」와 「다음은 저것이다」를
/// 따로 두면 둘을 한 번에 바꾸지 못하고, 그 사이에 낀 스레드가 지워진 노드를 살아 있는 것으로
/// 읽는다. 노드 정렬이 2바이트 이상이므로 이 비트는 늘 0 이다.
const MARK: usize = 1;

struct Node<T> {
    /// 머리 sentinel 은 `None`. 값이 없으므로 비교 대상이 아니다.
    value: Option<T>,
    /// 레벨별 다음 노드. 낮은 비트가 이 노드의 삭제 표시다.
    next: Box<[AtomicPtr<Node<T>>]>,
}

impl<T> Node<T> {
    fn new(value: Option<T>, top: usize) -> *mut Self {
        let mut next = Vec::with_capacity(top + 1);
        for _ in 0..=top {
            next.push(AtomicPtr::new(ptr::null_mut()));
        }
        Box::into_raw(Box::new(Self {
            value,
            next: next.into_boxed_slice(),
        }))
    }

    fn top(&self) -> usize {
        self.next.len() - 1
    }

    /// 값이 있는 노드에서만 부른다. 머리 sentinel 에 부르면 그것이 곧 구현의 결함이다.
    fn value(&self) -> &T {
        self.value.as_ref().expect("머리 sentinel 의 값을 읽었다")
    }
}

fn is_marked<T>(pointer: *mut Node<T>) -> bool {
    (pointer as usize) & MARK != 0
}

fn unmarked<T>(pointer: *mut Node<T>) -> *mut Node<T> {
    ((pointer as usize) & !MARK) as *mut Node<T>
}

fn marked<T>(pointer: *mut Node<T>) -> *mut Node<T> {
    ((pointer as usize) | MARK) as *mut Node<T>
}

/// 동시 정렬 집합. 계약은 `concurrentSkipList.ts` 헤더에 있다.
pub struct ConcurrentSkipList<T> {
    head: *mut Node<T>,
    /// 계측. **계약이 아니라 정본의 의무다**(불변 사실 23). 단위는 §규약2 계측 단위 —
    /// 노드 하나를 지나갈 때마다 1 이고, 읽기와 쓰기를 따로 세지 않는다.
    ///
    /// `loom` 이 훑지 않는 std 원자를 쓴다. 계측이 모델 검사의 탐색 공간에 들어오면 축4가
    /// 재는 것이 달라진다 — 세는 일이 세어지는 일을 바꾸면 안 된다.
    __cost: AtomicUsize,
}

// 노드는 원자 연산으로만 오가고, 값은 스레드를 건너 옮겨진다.
unsafe impl<T: Send> Send for ConcurrentSkipList<T> {}
unsafe impl<T: Send + Sync> Sync for ConcurrentSkipList<T> {}

impl<T: Ord + Clone + Hash> Default for ConcurrentSkipList<T> {
    fn default() -> Self {
        Self::new()
    }
}

impl<T: Ord + Clone + Hash> ConcurrentSkipList<T> {
    pub fn new() -> Self {
        Self {
            head: Node::new(None, MAX_LEVEL - 1),
            __cost: AtomicUsize::new(0),
        }
    }

    /// 지금까지 지나간 노드 수. 축3 성장률 실측이 읽는 값이다(§규약2 계측 단위).
    pub fn cost(&self) -> usize {
        self.__cost.load(CostOrdering::Relaxed)
    }

    /// 노드가 설 최상위 레벨. **계약이 정하지 않는 자리다.**
    ///
    /// 값에서 결정적으로 뽑는다. 난수를 쓰지 않는 이유는 `loom` 이 무작위성을 다루지 않기
    /// 때문이다 — 모델 검사기는 같은 프로그램을 스케줄만 바꿔 여러 번 돌리므로, 실행마다
    /// 모양이 달라지면 「전 스케줄을 훑었다」가 뜻을 잃는다. 해시의 뒤쪽 0 개수를 쓰므로
    /// 레벨 분포는 확률 $p = 0.5$ 로 뽑는 것과 같다.
    fn level_for(value: &T) -> usize {
        let mut hasher = DefaultHasher::new();
        value.hash(&mut hasher);
        (hasher.finish().trailing_zeros() as usize).min(MAX_LEVEL - 1)
    }

    /// `value` 가 들어갈 자리의 앞뒤 노드를 레벨마다 찾는다. 지워진 노드를 만나면 **떼어
    /// 내면서** 지나간다 — 그것이 이 구조에서 「돕는다」의 전부다.
    ///
    /// 돌려주는 값은 `succs[0]` 이 `value` 를 담은 살아 있는 노드인가다.
    ///
    /// # Safety
    ///
    /// 노드는 연산 중에 회수되지 않으므로(파일 머리) 여기서 따라가는 포인터는 전부 살아 있다.
    fn find(
        &self,
        value: &T,
        preds: &mut [*mut Node<T>; MAX_LEVEL],
        succs: &mut [*mut Node<T>; MAX_LEVEL],
        progress: &mut RetryGuard,
    ) -> bool {
        'retry: loop {
            let mut pred = self.head;

            for level in (0..MAX_LEVEL).rev() {
                let mut curr = unmarked(unsafe { &*pred }.next[level].load(Ordering::Acquire));

                loop {
                    if curr.is_null() {
                        break;
                    }
                    self.__cost.fetch_add(1, CostOrdering::Relaxed);
                    let raw = unsafe { &*curr }.next[level].load(Ordering::Acquire);
                    let succ = unmarked(raw);

                    if is_marked(raw) {
                        // `curr` 는 지워졌다. 앞 노드가 그 너머를 가리키게 만든다. 실패는
                        // 다른 스레드가 같은 자리를 이미 바꿨다는 뜻이므로 처음부터 다시 본다.
                        // #region guide:core/help
                        if unsafe { &*pred }.next[level]
                            .compare_exchange(curr, succ, Ordering::AcqRel, Ordering::Acquire)
                            .is_err()
                        {
                            progress.tick();
                            continue 'retry;
                        }
                        // #endregion
                        curr = succ;
                        continue;
                    }

                    if unsafe { &*curr }.value() < value {
                        pred = curr;
                        curr = succ;
                    } else {
                        break;
                    }
                }

                preds[level] = pred;
                succs[level] = curr;
            }

            let found = succs[0];
            return !found.is_null() && unsafe { &*found }.value() == value;
        }
    }

    /// 담고 `true`. 이미 있었으면 아무것도 하지 않고 `false`.
    ///
    /// **선형화 시점이 둘이다.** 이미 있어서 `false` 를 돌려줄 때는 `find` 가 살아 있는 노드를
    /// 본 그 읽기이고, 새로 담을 때는 **레벨 0 의 CAS 하나**다. 위 레벨은 그 뒤에 이어 붙으며,
    /// 그 사이에 다른 스레드가 이 값을 찾으면 이미 찾아진다 — 레벨 0 만으로 집합의 내용이
    /// 정해지기 때문이다. 같은 값을 동시에 넣는 두 스레드 중 이 CAS 에 성공하는 쪽이 하나뿐이고,
    /// 그것이 계약의 「`true` 를 받는 쪽이 정확히 하나」다.
    pub fn insert(&self, value: T, progress: &mut RetryGuard) -> bool {
        let top = Self::level_for(&value);
        let node = Node::new(Some(value), top);
        let mut preds = [ptr::null_mut(); MAX_LEVEL];
        let mut succs = [ptr::null_mut(); MAX_LEVEL];

        loop {
            let value = unsafe { &*node }.value();
            if self.find(value, &mut preds, &mut succs, progress) {
                // 이 노드는 아무 사슬에도 들어가지 않았으므로 여기서만 회수할 수 있다.
                drop(unsafe { Box::from_raw(node) });
                return false;
            }

            for level in 0..=top {
                unsafe { &*node }.next[level].store(succs[level], Ordering::Release);
            }

            // #region guide:core/insert
            if unsafe { &*preds[0] }.next[0]
                .compare_exchange(succs[0], node, Ordering::AcqRel, Ordering::Acquire)
                .is_err()
            {
                // 앞 노드가 바뀌었다 — 다른 스레드가 이 자리에 무언가를 했다는 뜻이다.
                // 그쪽이 끝났으므로 이 재시도는 계 전체의 진행을 막지 않는다.
                progress.tick();
                continue;
            }
            // #endregion

            for level in 1..=top {
                loop {
                    if unsafe { &*preds[level] }.next[level]
                        .compare_exchange(succs[level], node, Ordering::AcqRel, Ordering::Acquire)
                        .is_ok()
                    {
                        break;
                    }
                    progress.tick();
                    let value = unsafe { &*node }.value();
                    self.find(value, &mut preds, &mut succs, progress);
                }
            }
            return true;
        }
    }

    /// 지우고 `true`. 없었으면 `false`.
    ///
    /// **선형화 시점은 레벨 0 표시를 세우는 CAS 다.** 위 레벨을 먼저 표시하는 이유는 순서다 —
    /// 위에서부터 지우면 아래를 지나는 스레드가 이미 표시된 위층을 보고 도울 수 있다. 레벨 0
    /// 표시에 성공한 스레드가 하나뿐이므로 `true` 도 하나다.
    pub fn delete(&self, value: &T, progress: &mut RetryGuard) -> bool {
        let mut preds = [ptr::null_mut(); MAX_LEVEL];
        let mut succs = [ptr::null_mut(); MAX_LEVEL];

        if !self.find(value, &mut preds, &mut succs, progress) {
            return false;
        }
        let victim = succs[0];
        let top = unsafe { &*victim }.top();

        for level in (1..=top).rev() {
            loop {
                let raw = unsafe { &*victim }.next[level].load(Ordering::Acquire);
                if is_marked(raw) {
                    break;
                }
                if unsafe { &*victim }.next[level]
                    .compare_exchange(raw, marked(raw), Ordering::AcqRel, Ordering::Acquire)
                    .is_ok()
                {
                    break;
                }
                progress.tick();
            }
        }

        loop {
            // #region guide:core/delete
            let raw = unsafe { &*victim }.next[0].load(Ordering::Acquire);
            if is_marked(raw) {
                // 다른 스레드가 먼저 표시했다. 지운 것은 그쪽이므로 이쪽은 `false` 다.
                return false;
            }
            if unsafe { &*victim }.next[0]
                .compare_exchange(raw, marked(raw), Ordering::AcqRel, Ordering::Acquire)
                .is_ok()
            {
                // 표시가 곧 삭제다. 사슬에서 떼어 내는 것은 성능의 일이지 의미의 일이 아니다.
                self.find(value, &mut preds, &mut succs, progress);
                return true;
            }
            progress.tick();
            // #endregion
        }
    }

    /// 담겨 있는가.
    ///
    /// 재시도가 없다 — 표시된 노드를 도와 떼어 내지 않고 지나친다. **선형화 시점은 찾은 노드의
    /// 표시를 읽는 그 읽기**이고, 못 찾았으면 값의 자리를 지나친 읽기다. 그래서 이 연산은
    /// 다른 스레드가 무엇을 하든 유한 단계에 끝난다(wait-free).
    pub fn has(&self, value: &T) -> bool {
        let mut pred = self.head;
        let mut found: *mut Node<T> = ptr::null_mut();

        for level in (0..MAX_LEVEL).rev() {
            let mut curr = unmarked(unsafe { &*pred }.next[level].load(Ordering::Acquire));
            while !curr.is_null() {
                self.__cost.fetch_add(1, CostOrdering::Relaxed);
                let node = unsafe { &*curr };
                if node.value() < value {
                    pred = curr;
                    curr = unmarked(node.next[level].load(Ordering::Acquire));
                    continue;
                }
                if node.value() == value {
                    found = curr;
                }
                break;
            }
        }

        !found.is_null() && !is_marked(unsafe { &*found }.next[0].load(Ordering::Acquire))
    }

    /// 담긴 것 중 가장 작은 값. 비어 있으면 `None`.
    ///
    /// **선형화 시점은 머리의 다음을 읽는 그 읽기(`t`)다.** 그 자리에서 정렬 사슬의 첫 노드가
    /// `n` 이었다는 것은 `t` 에 `n` 보다 작은 원소가 사슬에 없었다는 뜻이고, 표시는 한 번
    /// 서면 내려가지 않으므로 뒤에 읽은 표시가 비어 있으면 `t` 에도 비어 있었다. 그래서
    /// `t` 시점에 `n` 은 담겨 있었고 가장 작았다.
    ///
    /// 첫 노드가 이미 지워져 있으면 `find` 로 떼어 내고 다시 본다. 그 재시도는 다른 스레드의
    /// 삭제가 끝났다는 뜻이므로 진행을 막지 않는다.
    pub fn min(&self, progress: &mut RetryGuard) -> Option<T> {
        // #region guide:core/min
        loop {
            self.__cost.fetch_add(1, CostOrdering::Relaxed);
            let first = unmarked(unsafe { &*self.head }.next[0].load(Ordering::Acquire));
            if first.is_null() {
                return None;
            }
            if !is_marked(unsafe { &*first }.next[0].load(Ordering::Acquire)) {
                return Some(unsafe { &*first }.value().clone());
            }
            // 표시가 서 있다 — 이 노드는 지워졌다. 언제 지워졌는지는 알 수 없으므로 답을
            // 내지 않고, 떼어 낸 뒤 다시 읽는다.
            progress.tick();
            let value = unsafe { &*first }.value().clone();
            let mut preds = [ptr::null_mut(); MAX_LEVEL];
            let mut succs = [ptr::null_mut(); MAX_LEVEL];
            self.find(&value, &mut preds, &mut succs, progress);
        }
        // #endregion
    }

    /// 담긴 것 중 가장 큰 값. 비어 있으면 `None`.
    ///
    /// **선형화 시점은 마지막 노드의 다음이 비었음을 읽는 그 읽기(`t`)다.** 그보다 큰 원소는
    /// 그 노드 뒤에 이어 붙는 수밖에 없으므로, `t` 에 다음이 비어 있었다면 `t` 에 그보다 큰
    /// 원소가 없었다. 표시는 내려가지 않으므로 뒤에 읽은 표시가 비어 있으면 `t` 에도 담겨
    /// 있었다.
    ///
    /// 위 레벨부터 끝까지 달려 내려오므로 걸음 수가 담긴 수에 비례하지 않는다.
    pub fn max(&self, progress: &mut RetryGuard) -> Option<T> {
        loop {
            let mut last = self.head;
            for level in (0..MAX_LEVEL).rev() {
                loop {
                    let next = unmarked(unsafe { &*last }.next[level].load(Ordering::Acquire));
                    if next.is_null() {
                        break;
                    }
                    self.__cost.fetch_add(1, CostOrdering::Relaxed);
                    last = next;
                }
            }
            if last == self.head {
                return None;
            }
            if !is_marked(unsafe { &*last }.next[0].load(Ordering::Acquire)) {
                return Some(unsafe { &*last }.value().clone());
            }
            progress.tick();
            let value = unsafe { &*last }.value().clone();
            let mut preds = [ptr::null_mut(); MAX_LEVEL];
            let mut succs = [ptr::null_mut(); MAX_LEVEL];
            self.find(&value, &mut preds, &mut succs, progress);
        }
    }
}

impl<T> Drop for ConcurrentSkipList<T> {
    /// 소유자가 사라질 때만 회수한다. 이 시점에는 다른 스레드가 이 구조를 잡고 있지 않다는
    /// 것을 `&mut self` 가 보장한다.
    ///
    /// **사슬에서 떼어 낸 노드는 여기 없다.** 그것을 회수하려면 「아무도 읽고 있지 않다」를
    /// 연산 중에 판정해야 하고, 그 판정이 epoch 기반 회수나 hazard pointer 다. 계약에 공간이
    /// 없으므로 그 장치는 계약의 요구가 아니다(파일 머리).
    fn drop(&mut self) {
        let mut current = self.head;
        while !current.is_null() {
            let node = unsafe { Box::from_raw(current) };
            current = unmarked(node.next[0].load(Ordering::Relaxed));
        }
    }
}
