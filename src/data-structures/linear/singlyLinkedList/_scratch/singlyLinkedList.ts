// E3 자기검증용 스크래치 — 가이드 본문 코드를 그대로 추출해 실행한다.

class ListNode<T> {
  value: T;
  next: ListNode<T> | null = null;
  constructor(value: T) {
    this.value = value;
  }
}

// 원형(naive) — head만 유지, append가 매번 끝까지 순회
class NaiveList<T> {
  head: ListNode<T> | null = null;

  append(value: T): ListNode<T> {
    const node = new ListNode(value);
    if (this.head === null) {
      this.head = node;
      return node;
    }
    let cur = this.head;
    let hops = 0;
    while (cur.next !== null) {
      cur = cur.next;
      hops++;
    }
    cur.next = node;
    return node;
  }

  toArray(): T[] {
    const result: T[] = [];
    let cur = this.head;
    while (cur !== null) {
      result.push(cur.value);
      cur = cur.next;
    }
    return result;
  }
}

// 최종 — head + tail 유지
class SinglyLinkedList<T> {
  private head: ListNode<T> | null = null;
  private tail: ListNode<T> | null = null;
  private count = 0;

  prepend(value: T): ListNode<T> {
    const node = new ListNode(value);
    node.next = this.head;
    this.head = node;
    if (this.tail === null) this.tail = node;
    this.count++;
    return node;
  }

  append(value: T): ListNode<T> {
    const node = new ListNode(value);
    if (this.tail === null) {
      this.head = node;
    } else {
      this.tail.next = node;
    }
    this.tail = node;
    this.count++;
    return node;
  }

  removeFirst(): T | undefined {
    if (this.head === null) return undefined;
    const value = this.head.value;
    this.head = this.head.next;
    if (this.head === null) this.tail = null;
    this.count--;
    return value;
  }

  find(value: T): ListNode<T> | null {
    let cur = this.head;
    while (cur !== null) {
      if (cur.value === value) return cur;
      cur = cur.next;
    }
    return null;
  }

  toArray(): T[] {
    const result: T[] = [];
    let cur = this.head;
    while (cur !== null) {
      result.push(cur.value);
      cur = cur.next;
    }
    return result;
  }

  size(): number {
    return this.count;
  }

  // 검증 편의용 — head/tail 값 노출
  debugState() {
    return {
      head: this.head?.value ?? null,
      tail: this.tail?.value ?? null,
      size: this.count,
    };
  }
}

console.log("=== naive append 비용 (n=10^5) ===");
{
  const n = 100_000;
  const naive = new NaiveList<number>();
  let totalHops = 0;
  // hops 계측을 위해 별도 카운팅 버전
  let head: ListNode<number> | null = null;
  for (let i = 0; i < n; i++) {
    const node = new ListNode(i);
    if (head === null) {
      head = node;
    } else {
      let cur = head;
      let hops = 1;
      while (cur.next !== null) {
        cur = cur.next;
        hops++;
      }
      cur.next = node;
      totalHops += hops;
    }
  }
  console.log("총 포인터 추적 횟수:", totalHops, "≈", (totalHops / 1e9).toFixed(2), "* 10^9");
}

console.log("\n=== 문제 예시 트레이스 (singlyLinkedList-problem.md) ===");
{
  const list = new SinglyLinkedList<number>();
  list.append(1);
  console.log("append(1) →", list.toArray());
  list.append(2);
  console.log("append(2) →", list.toArray());
  list.append(3);
  console.log("append(3) →", list.toArray());
  list.prepend(0);
  console.log("prepend(0) →", list.toArray());
  console.log("toArray():", list.toArray());
  console.log("size():", list.size());
  const found2 = list.find(2);
  console.log("find(2):", found2 ? { value: found2.value, nextValue: found2.next?.value } : found2);
  console.log("find(99):", list.find(99));
  const removed = list.removeFirst();
  console.log("removeFirst():", removed);
  console.log("toArray() after removeFirst:", list.toArray());
  console.log("size() after removeFirst:", list.size());
}

console.log("\n=== 시뮬레이션 steps 트레이스 (가이드 실행 시각화) ===");
{
  const list = new SinglyLinkedList<number>();
  console.log("초기:", list.debugState());
  list.append(10);
  console.log("append(10):", list.toArray(), list.debugState());
  list.append(20);
  console.log("append(20):", list.toArray(), list.debugState());
  list.prepend(5);
  console.log("prepend(5):", list.toArray(), list.debugState());
  const removed = list.removeFirst();
  console.log("removeFirst():", removed, "→", list.toArray(), list.debugState());
  console.log("최종 상태:", list.debugState());
}

console.log("\n=== 엣지 케이스 ===");
{
  const empty = new SinglyLinkedList<number>();
  console.log("빈 리스트 removeFirst():", empty.removeFirst());
  console.log("빈 리스트 toArray():", empty.toArray());
  console.log("빈 리스트 size():", empty.size());
  console.log("빈 리스트 find(1):", empty.find(1));

  const single = new SinglyLinkedList<number>();
  single.append(42);
  console.log("단일 노드 상태:", single.debugState());
  const val = single.removeFirst();
  console.log("단일 노드 removeFirst():", val, "→ 상태:", single.debugState());

  // prepend 직후 append: tail이 prepend로 설정된 단일 노드를 가리키는 상태에서 append
  const mix = new SinglyLinkedList<number>();
  mix.prepend(100);
  console.log("prepend(100) 직후 상태:", mix.debugState());
  mix.append(200);
  console.log("append(200) 후 상태:", mix.debugState(), mix.toArray());
}

console.log("\n=== 무작위 교차검증 (SinglyLinkedList vs Array 참조 구현) ===");
{
  function randomCheck(seed: number) {
    let s = seed;
    const rand = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s;
    };
    const list = new SinglyLinkedList<number>();
    let ref: number[] = [];
    const ops = 500;
    for (let i = 0; i < ops; i++) {
      const op = rand() % 5;
      const v = rand() % 1000;
      if (op === 0) {
        list.prepend(v);
        ref = [v, ...ref];
      } else if (op === 1) {
        list.append(v);
        ref = [...ref, v];
      } else if (op === 2) {
        const r1 = list.removeFirst();
        const r2 = ref.length > 0 ? ref.shift() : undefined;
        if (r1 !== r2) throw new Error(`removeFirst mismatch at op ${i}: ${r1} vs ${r2}`);
      } else if (op === 3) {
        const node = list.find(v);
        const idx = ref.indexOf(v);
        const expected = idx === -1 ? null : "found";
        const actual = node === null ? null : "found";
        if (expected !== actual) throw new Error(`find mismatch at op ${i}: value=${v}`);
      } else {
        if (list.size() !== ref.length) {
          throw new Error(`size mismatch at op ${i}: ${list.size()} vs ${ref.length}`);
        }
      }
      const arr = list.toArray();
      if (JSON.stringify(arr) !== JSON.stringify(ref)) {
        throw new Error(`toArray mismatch at op ${i}: ${JSON.stringify(arr)} vs ${JSON.stringify(ref)}`);
      }
    }
    return ops;
  }
  const totalOps = randomCheck(12345) + randomCheck(67890) + randomCheck(999);
  console.log(`무작위 ${totalOps}회 연산 교차검증 통과 (prepend/append/removeFirst/find/toArray/size 전부 참조 배열과 일치)`);
}
