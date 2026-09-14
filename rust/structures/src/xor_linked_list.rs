//! `linear/xorLinkedList` 의 Rust 구현 — **노드 주소를 직접 XOR 한다.**
//!
//! **계약은 이 파일에 없다.** 계약이 사는 자리는
//! `src/data-structures/linear/xorLinkedList/xorLinkedList.ts` 헤더 한 곳이다(§규약1).
//! TS 정본(`_reference/xorLinkedList.ts`)도 그 계약을 지키지만, TS 에는 주소를 정수로 꺼낼
//! 방법이 없어서 노드 번호와 번호 → 노드 표로 대신한다. 그 표가 원소마다 자리를 더 잡으므로
//! 이 구조가 아끼려던 메모리가 TS 에서는 오히려 는다.
//!
//! 이 파일은 그 이득이 실제로 생기는 표현을 보인다. 노드는 값과 `이전 주소 ^ 다음 주소`
//! 정수 하나만 들고, 번호 표가 없다. 요청 바이트는 `tests/xor_linked_list.rs` 가 할당기를
//! 감싸 센다.
//!
//! **정수에서 포인터를 되찾는 데 Exposed Provenance 를 쓴다.** 노드마다 따로 할당하면 다음
//! 노드의 할당을 가리키는 포인터가 어디에도 남지 않으므로, 주소를 만들 때마다
//! `expose_provenance` 로 드러내고 계산한 정수를 `with_exposed_provenance_mut` 로 포인터로
//! 바꾼다. `std::ptr` 문서가 이 방식을 Strict Provenance 보다 약한 규칙으로 적고 Miri·CHERI
//! 와 잘 맞지 않는다고 적는다 — 그 대가는 가이드의 에스컬레이션 절이 다룬다.
//!
//! 규약4 등급은 (나)다(`tools/ord006-escalation.ts`). (나)는 Rust 산출물을 강제하지 않지만,
//! 이 구조는 이득이 메모리를 직접 다룰 때만 생기므로 가이드가 Rust 구현을 싣는다
//! (`sandbox/ds-guide-v2/SPEC.md` `L47`).

use std::ptr;

// #region guide:core
/// 노드 하나. 값과 이웃 주소 두 개를 XOR 한 정수 하나만 둔다.
struct Node {
    value: i64,
    /// 이전 노드 주소 ^ 다음 노드 주소. 이웃이 없는 쪽은 주소 0 으로 센다.
    xor_addr: usize,
}

pub struct XorLinkedList {
    head: *mut Node,
    tail: *mut Node,
    count: usize,
}

impl XorLinkedList {
    pub fn new() -> Self {
        Self {
            head: ptr::null_mut(),
            tail: ptr::null_mut(),
            count: 0,
        }
    }

    pub fn append(&mut self, value: i64) {
        // 새 노드의 다음 노드는 아직 없다 — 기존 마지막 노드의 주소가 그대로 XOR 값이다.
        let xor_addr = self.tail.expose_provenance();
        let node = Box::into_raw(Box::new(Node { value, xor_addr }));
        let addr = node.expose_provenance();

        if self.tail.is_null() {
            self.head = node;
        } else {
            // 기존 마지막 노드의 다음 주소는 0 이었다. 새 주소를 한 번 XOR 하면 0 이 새 주소로 바뀐다.
            // SAFETY: tail 은 이 리스트가 할당하고 아직 해제하지 않은 노드다.
            unsafe { (*self.tail).xor_addr ^= addr };
        }

        self.tail = node;
        self.count += 1;
    }

    pub fn to_array(&self) -> Vec<i64> {
        self.walk(self.head)
    }

    pub fn to_array_reverse(&self) -> Vec<i64> {
        self.walk(self.tail)
    }

    pub fn size(&self) -> usize {
        self.count
    }

    /// 한쪽 끝에서 반대쪽 끝까지 읽는다. 두 방향이 같은 코드이고 출발 노드만 다르다.
    fn walk(&self, start: *mut Node) -> Vec<i64> {
        let mut values = Vec::with_capacity(self.count);
        let mut prev = 0usize;
        let mut curr = start;

        while !curr.is_null() {
            // SAFETY: curr 는 head·tail 이거나 이웃 노드의 xor_addr 에서 계산한 주소이고,
            // 리스트가 살아 있는 동안 어느 노드도 해제하지 않는다.
            let node = unsafe { &*curr };
            values.push(node.value);
            let next = node.xor_addr ^ prev;
            prev = curr.addr();
            curr = ptr::with_exposed_provenance_mut(next);
        }

        values
    }
}

impl Default for XorLinkedList {
    fn default() -> Self {
        Self::new()
    }
}

impl Drop for XorLinkedList {
    /// 앞에서부터 읽는 순서대로 노드를 하나씩 해제한다. 다음 주소는 해제하기 전에 계산한다.
    fn drop(&mut self) {
        let mut prev = 0usize;
        let mut curr = self.head;

        while !curr.is_null() {
            // SAFETY: curr 는 `Box::into_raw` 로 만든 노드이고, 이 반복에서 한 번만 되돌린다.
            let node = unsafe { Box::from_raw(curr) };
            let next = node.xor_addr ^ prev;
            prev = curr.addr();
            curr = ptr::with_exposed_provenance_mut(next);
        }
    }
}
// #endregion
