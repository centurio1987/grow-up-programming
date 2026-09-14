//! `linear/xorLinkedList` Rust 구현 — 축1 vector 재생과 요청 바이트 계측.
//!
//! **이 구조는 축1만 Rust 에서 재생한다.** 축2(불변식)·축3(성장률)은 TS 하네스가 정본을
//! 이미 판정하고, Rust 구현을 둔 이유는 계약이 아니라 메모리 이득을 실제 바이트로 보이는
//! 데 있다(`rust/structures/src/xor_linked_list.rs` 모듈 문서).
//!
//! **바이트는 할당기를 감싸 센다.** `size_of` 는 타입의 크기일 뿐이고 노드가 실제로 몇 번,
//! 몇 바이트씩 요청되는지는 말하지 않는다. 할당기가 요청을 올림하거나 관리 정보를 덧붙이는
//! 몫은 세지 않으므로 아래 값은 요청한 바이트다.

#![cfg(not(loom))]

use std::alloc::{GlobalAlloc, Layout, System};
use std::cell::Cell;
use std::ptr;

use ds_contract::vector::{Subject, Vector, load, replay};
use ds_structures::xor_linked_list::XorLinkedList;
use serde_json::{Value, json};

/// 스레드마다 따로 센다. 테스트는 스레드 여럿에서 동시에 돌기 때문이다.
struct CountingAlloc;

thread_local! {
    static REQUESTS: Cell<(usize, usize)> = const { Cell::new((0, 0)) };
}

unsafe impl GlobalAlloc for CountingAlloc {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        let _ = REQUESTS.try_with(|r| {
            let (calls, bytes) = r.get();
            r.set((calls + 1, bytes + layout.size()));
        });
        // SAFETY: 받은 layout 을 그대로 System 에 넘긴다.
        unsafe { System.alloc(layout) }
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        // SAFETY: 같은 layout 으로 System 에서 받은 포인터다.
        unsafe { System.dealloc(ptr, layout) }
    }
}

#[global_allocator]
static ALLOC: CountingAlloc = CountingAlloc;

/// `build` 가 요청한 할당 횟수와 바이트. 결과는 센 뒤에 해제한다.
fn measure<T>(build: impl FnOnce() -> T) -> (usize, usize) {
    REQUESTS.with(|r| r.set((0, 0)));
    let kept = build();
    let counted = REQUESTS.with(Cell::get);
    drop(kept);
    counted
}

/// 대조용 이중 연결 리스트. 노드가 이전·다음 주소를 따로 든다.
struct DoublyNode {
    _value: i64,
    _prev: *mut DoublyNode,
    next: *mut DoublyNode,
}

struct DoublyLinkedList {
    head: *mut DoublyNode,
    tail: *mut DoublyNode,
}

impl DoublyLinkedList {
    fn new() -> Self {
        Self {
            head: ptr::null_mut(),
            tail: ptr::null_mut(),
        }
    }

    fn append(&mut self, value: i64) {
        let node = Box::into_raw(Box::new(DoublyNode {
            _value: value,
            _prev: self.tail,
            next: ptr::null_mut(),
        }));
        if self.tail.is_null() {
            self.head = node;
        } else {
            // SAFETY: tail 은 이 리스트가 할당하고 아직 해제하지 않은 노드다.
            unsafe { (*self.tail).next = node };
        }
        self.tail = node;
    }
}

impl Drop for DoublyLinkedList {
    fn drop(&mut self) {
        let mut curr = self.head;
        while !curr.is_null() {
            // SAFETY: `Box::into_raw` 로 만든 노드를 한 번씩만 되돌린다.
            let node = unsafe { Box::from_raw(curr) };
            curr = node.next;
        }
    }
}

const APPENDS: i64 = 1024;

#[test]
fn 붙이기_1024번이_요청한_바이트() {
    // 워드가 8바이트인 대상에서 잰 값이다. 다른 폭에서는 수가 달라지므로 먼저 확인한다.
    assert_eq!(size_of::<usize>(), 8);

    let xor = measure(|| {
        let mut list = XorLinkedList::new();
        for v in 0..APPENDS {
            list.append(v);
        }
        list
    });
    let doubly = measure(|| {
        let mut list = DoublyLinkedList::new();
        for v in 0..APPENDS {
            list.append(v);
        }
        list
    });

    // 노드 하나가 할당 한 번이다. XOR 노드는 값 + 정수 하나, 이중 연결 노드는 값 + 주소 둘.
    assert_eq!(xor, (1024, 16_384));
    assert_eq!(doubly, (1024, 24_576));
}

#[test]
fn 붙이기_한_번이_요청한_바이트() {
    let mut xor = XorLinkedList::new();
    xor.append(10);
    let one = measure(|| xor.append(20));
    assert_eq!(one, (1, 16));

    let mut doubly = DoublyLinkedList::new();
    doubly.append(10);
    let one = measure(|| doubly.append(20));
    assert_eq!(one, (1, 24));
}

#[test]
fn 값_0과_두_방향_읽기() {
    let mut list = XorLinkedList::new();
    assert_eq!(list.to_array(), Vec::<i64>::new());
    for v in [10, 0, 30] {
        list.append(v);
    }
    assert_eq!(list.to_array(), vec![10, 0, 30]);
    assert_eq!(list.to_array_reverse(), vec![30, 0, 10]);
    assert_eq!(list.size(), 3);
}

fn vector() -> Vector {
    let path = format!(
        "{}/../vectors/XorLinkedList.json",
        env!("CARGO_MANIFEST_DIR")
    );
    load(&path).expect("XorLinkedList.json 을 읽는다")
}

#[derive(Default)]
struct ListSubject {
    list: XorLinkedList,
}

impl Subject for ListSubject {
    fn apply(&mut self, op: &str, arg: Option<&Value>) -> Option<Value> {
        match op {
            "append" => {
                let value = arg.and_then(Value::as_i64).expect("값 인자가 있어야 한다");
                self.list.append(value);
                None
            }
            "toArray" => Some(json!(self.list.to_array())),
            "toArrayReverse" => Some(json!(self.list.to_array_reverse())),
            "size" => Some(json!(self.list.size())),
            _ => panic!("모르는 연산: {op}"),
        }
    }

    fn reset(&mut self) {
        self.list = XorLinkedList::new();
    }
}

#[test]
fn rust_구현은_vector_를_통과한다() {
    let vector = vector();
    assert_eq!(vector.structure, "XorLinkedList");
    let mut subject = ListSubject::default();
    match replay(&mut subject, &vector) {
        Ok(steps) => assert!(steps > 0),
        Err(mismatch) => panic!("Rust 구현이 vector 와 어긋났다: {mismatch}"),
    }
}
