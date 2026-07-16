// ORD-003 E3 자기검증 스크래치 — 가이드 본문에 실을 코드를 그대로 옮겨 실행 검증한다.
// 실행: bun src/data-structures/hash/lruCache/_scratch/lruCache.ts

// ────────────────────────────────────────────────────────────
// Stage 0 (원형): Map + timestamp, 퇴출 시 전체 스캔 O(n)
// ────────────────────────────────────────────────────────────
class LRUCacheNaive {
  private capacity: number;
  private store = new Map<number, { value: number; time: number }>();
  private clock = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: number): number {
    const entry = this.store.get(key);
    if (entry === undefined) return -1;
    entry.time = this.clock++;
    return entry.value;
  }

  put(key: number, value: number): void {
    const existing = this.store.get(key);
    if (existing !== undefined) {
      existing.value = value;
      existing.time = this.clock++;
      return;
    }
    if (this.store.size >= this.capacity) {
      let lruKey = -1;
      let minTime = Infinity;
      for (const [k, e] of this.store) {
        if (e.time < minTime) {
          minTime = e.time;
          lruKey = k;
        }
      }
      this.store.delete(lruKey);
    }
    this.store.set(key, { value, time: this.clock++ });
  }
}

// ────────────────────────────────────────────────────────────
// Stage 1 (개선): Map + 순서 배열, touch에서 indexOf/splice O(n)
// ────────────────────────────────────────────────────────────
class LRUCacheOrdered {
  private capacity: number;
  private map = new Map<number, number>();
  private order: number[] = []; // 왼쪽=LRU, 오른쪽=MRU

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: number): number {
    if (!this.map.has(key)) return -1;
    this.touch(key);
    return this.map.get(key)!;
  }

  put(key: number, value: number): void {
    if (this.map.has(key)) {
      this.map.set(key, value);
      this.touch(key);
      return;
    }
    if (this.map.size >= this.capacity) {
      const lru = this.order.shift()!;
      this.map.delete(lru);
    }
    this.map.set(key, value);
    this.order.push(key);
  }

  private touch(key: number): void {
    const idx = this.order.indexOf(key); // O(n)
    this.order.splice(idx, 1);
    this.order.push(key);
  }
}

// ────────────────────────────────────────────────────────────
// Stage 2 (최종): HashMap + 이중 연결 리스트(더미 센티넬), O(1)
// ────────────────────────────────────────────────────────────
class ListNode {
  key: number;
  value: number;
  prev: ListNode;
  next: ListNode;

  constructor(key: number, value: number) {
    this.key = key;
    this.value = value;
    this.prev = this;
    this.next = this;
  }
}

class LRUCache {
  private capacity: number;
  private map = new Map<number, ListNode>();
  private head: ListNode; // 더미: head.next = MRU
  private tail: ListNode; // 더미: tail.prev = LRU

  constructor(capacity: number) {
    this.capacity = capacity;
    this.head = new ListNode(-1, -1);
    this.tail = new ListNode(-1, -1);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: number): number {
    const node = this.map.get(key);
    if (node === undefined) return -1;
    this.moveToFront(node);
    return node.value;
  }

  put(key: number, value: number): void {
    const existing = this.map.get(key);
    if (existing !== undefined) {
      existing.value = value;
      this.moveToFront(existing);
      return;
    }
    const node = new ListNode(key, value);
    this.map.set(key, node);
    this.insertAfterHead(node);
    if (this.map.size > this.capacity) {
      const lru = this.tail.prev;
      this.removeNode(lru);
      this.map.delete(lru.key);
    }
  }

  private moveToFront(node: ListNode): void {
    this.removeNode(node);
    this.insertAfterHead(node);
  }

  private removeNode(node: ListNode): void {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  private insertAfterHead(node: ListNode): void {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  // 디버그 전용: MRU→LRU 순 key 배열 (가이드 시뮬 패널과 대조하기 위함)
  debugOrder(): number[] {
    const out: number[] = [];
    let cur = this.head.next;
    while (cur !== this.tail) {
      out.push(cur.key);
      cur = cur.next;
    }
    return out;
  }
}

// ────────────────────────────────────────────────────────────
// Stage 2 버그 변형: 퇴출 시 map.delete를 빠뜨린 경우 (D6 함정 재현)
// ────────────────────────────────────────────────────────────
class LRUCacheBuggy {
  private capacity: number;
  private map = new Map<number, ListNode>();
  private head: ListNode;
  private tail: ListNode;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.head = new ListNode(-1, -1);
    this.tail = new ListNode(-1, -1);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: number): number {
    const node = this.map.get(key);
    if (node === undefined) return -1;
    this.moveToFront(node);
    return node.value;
  }

  put(key: number, value: number): void {
    const existing = this.map.get(key);
    if (existing !== undefined) {
      existing.value = value;
      this.moveToFront(existing);
      return;
    }
    const node = new ListNode(key, value);
    this.map.set(key, node);
    this.insertAfterHead(node);
    if (this.map.size > this.capacity) {
      const lru = this.tail.prev;
      this.removeNode(lru);
      // 버그: this.map.delete(lru.key)를 빠뜨림 — map은 여전히 죽은 노드를 가리킨다
    }
  }

  private moveToFront(node: ListNode): void {
    this.removeNode(node);
    this.insertAfterHead(node);
  }

  private removeNode(node: ListNode): void {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  private insertAfterHead(node: ListNode): void {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }
}

// ────────────────────────────────────────────────────────────
// 검증 1: 가이드 시뮬레이션 고정 입력 트레이스 (capacity=3)
// ────────────────────────────────────────────────────────────
console.log("=== 검증 1: 시뮬레이션 고정 입력 트레이스 ===");
{
  const cache = new LRUCache(3);
  const trace: { op: string; result: number | void; order: number[] }[] = [];

  cache.put(1, 10);
  trace.push({ op: "put(1,10)", result: undefined, order: cache.debugOrder() });
  cache.put(2, 20);
  trace.push({ op: "put(2,20)", result: undefined, order: cache.debugOrder() });
  cache.put(3, 30);
  trace.push({ op: "put(3,30)", result: undefined, order: cache.debugOrder() });
  const g1 = cache.get(1);
  trace.push({ op: "get(1)", result: g1, order: cache.debugOrder() });
  cache.put(4, 40);
  trace.push({ op: "put(4,40)", result: undefined, order: cache.debugOrder() });
  const g2 = cache.get(2);
  trace.push({ op: "get(2)", result: g2, order: cache.debugOrder() });
  const g3 = cache.get(3);
  trace.push({ op: "get(3)", result: g3, order: cache.debugOrder() });

  for (const t of trace) {
    console.log(`  ${t.op} -> ${t.result === undefined ? "(no return)" : t.result} | order(MRU→LRU)=${JSON.stringify(t.order)}`);
  }

  console.assert(g1 === 10, "get(1) should be 10");
  console.assert(g2 === -1, "get(2) should be -1 (evicted)");
  console.assert(g3 === 30, "get(3) should be 30");
  console.assert(JSON.stringify(trace[3].order) === JSON.stringify([1, 3, 2]), "after get(1) order mismatch");
  console.assert(JSON.stringify(trace[4].order) === JSON.stringify([4, 1, 3]), "after put(4,40) order mismatch");
  console.assert(JSON.stringify(trace[6].order) === JSON.stringify([3, 4, 1]), "after get(3) order mismatch");
}

// ────────────────────────────────────────────────────────────
// 검증 2: 엣지 케이스 — capacity=1
// ────────────────────────────────────────────────────────────
console.log("\n=== 검증 2: capacity=1 ===");
{
  const cache = new LRUCache(1);
  cache.put(1, 100);
  const before = cache.get(1);
  cache.put(2, 200); // 1 퇴출
  const afterEvict1 = cache.get(1);
  const afterEvict2 = cache.get(2);
  console.log(`  put(1,100); get(1)=${before}; put(2,200); get(1)=${afterEvict1}; get(2)=${afterEvict2}`);
  console.assert(before === 100, "capacity=1 get(1) should be 100");
  console.assert(afterEvict1 === -1, "capacity=1 get(1) after put(2) should be -1");
  console.assert(afterEvict2 === 200, "capacity=1 get(2) should be 200");
}

// ────────────────────────────────────────────────────────────
// 검증 3: 존재하는 key put → 값 갱신 + MRU 이동, 퇴출 없음
// ────────────────────────────────────────────────────────────
console.log("\n=== 검증 3: 기존 key put (갱신) ===");
{
  const cache = new LRUCache(2);
  cache.put(1, 10);
  cache.put(2, 20);
  cache.put(1, 999); // 갱신, 퇴출 없어야 함
  const g1 = cache.get(1);
  const g2 = cache.get(2);
  const order = cache.debugOrder();
  console.log(`  put(1,10); put(2,20); put(1,999) -> get(1)=${g1}, get(2)=${g2}, order=${JSON.stringify(order)}`);
  console.assert(g1 === 999, "updated value should be 999");
  console.assert(g2 === 20, "key 2 should still exist (no eviction on update)");
}

// ────────────────────────────────────────────────────────────
// 검증 4: D6 함정 재현 — map.delete 누락 시 구체적 오답
// ────────────────────────────────────────────────────────────
console.log("\n=== 검증 4: 버그 변형 (map.delete 누락) 오답 재현 ===");
{
  const buggy = new LRUCacheBuggy(3);
  buggy.put(1, 10);
  buggy.put(2, 20);
  buggy.put(3, 30);
  buggy.get(1);
  buggy.put(4, 40); // 정상이라면 key=2가 리스트+map 모두에서 사라져야 함
  const wrongGet2 = buggy.get(2);
  console.log(`  버그 버전: get(2) = ${wrongGet2} (정상 구현이면 -1이어야 함)`);
  console.assert(wrongGet2 === 20, "버그 재현: map에 죽은 노드가 남아 20을 반환해야 함");
}

// ────────────────────────────────────────────────────────────
// 검증 5: 무작위 교차검증 — 최종 구현 vs Stage0(원형) vs Stage1(개선)
// ────────────────────────────────────────────────────────────
console.log("\n=== 검증 5: 무작위 교차검증 (Stage0 vs Stage1 vs Stage2, 500회) ===");
{
  function runRandom(seedBase: number) {
    const capacity = 1 + (seedBase % 5);
    const a = new LRUCacheNaive(capacity);
    const b = new LRUCacheOrdered(capacity);
    const c = new LRUCache(capacity);
    let mismatch = false;
    let rng = seedBase * 2654435761 % 2147483647;
    const next = () => (rng = (rng * 48271) % 2147483647);
    for (let i = 0; i < 500; i++) {
      const isGet = next() % 3 === 0;
      const key = next() % 6;
      if (isGet) {
        const ra = a.get(key);
        const rb = b.get(key);
        const rc = c.get(key);
        if (ra !== rb || rb !== rc) {
          console.log(`  MISMATCH seed=${seedBase} step=${i} get(${key}) naive=${ra} ordered=${rb} final=${rc}`);
          mismatch = true;
        }
      } else {
        const value = next() % 1000;
        a.put(key, value);
        b.put(key, value);
        c.put(key, value);
      }
    }
    return mismatch;
  }

  let anyMismatch = false;
  for (let seed = 1; seed <= 20; seed++) {
    if (runRandom(seed)) anyMismatch = true;
  }
  console.log(anyMismatch ? "  결과: 불일치 발견!" : "  결과: 20개 시드 × 500회 연산 모두 세 구현이 일치");
}

console.log("\n모든 검증 완료.");
