// ORD-003 가이드 자기검증 스크래치. 가이드 본문 코드를 그대로 옮겨 실행/트레이스한다.
// sibling ../priorityQueue.ts(학습자 실습 스텁)와는 무관하며, 이 파일이 가이드의 oracle이다.

// ============================================================
// 원형(naive): 정렬 없는 배열 + dequeue 시 선형 탐색
// ============================================================
class NaivePriorityQueue<T> {
  private arr: T[] = [];
  constructor(private compare: (a: T, b: T) => number) {}

  enqueue(item: T): void {
    this.arr.push(item); // O(1)
  }

  dequeue(): T | undefined {
    if (this.arr.length === 0) return undefined;
    let bestIdx = 0;
    for (let i = 1; i < this.arr.length; i++) {
      if (this.compare(this.arr[i]!, this.arr[bestIdx]!) < 0) bestIdx = i;
    }
    const [min] = this.arr.splice(bestIdx, 1); // O(n)
    return min;
  }
}

// ============================================================
// 개선(첫 시도, 버그 있음): siftDown에서 오른쪽 자식을 비교하지 않는다
// 본문 "아이디어를 코드로 옮기기" 절의 D6 함정 예시(concrete)와 동일 코드
// ============================================================
class BuggySiftDownLeftOnly<T> {
  heap: T[] = [];
  constructor(private compare: (a: T, b: T) => number) {}
  enqueue(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }
  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last !== undefined) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return min;
  }
  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      const cur = this.heap[i];
      const par = this.heap[parent];
      if (cur === undefined || par === undefined) break;
      if (this.compare(cur, par) < 0) {
        this.swap(i, parent);
        i = parent;
      } else break;
    }
  }
  private siftDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      const left = 2 * i + 1;
      let best = i;
      // 버그: right(2*i+2)를 비교하지 않는다
      if (left < n && this.compare(this.heap[left]!, this.heap[best]!) < 0) best = left;
      if (best !== i) {
        this.swap(i, best);
        i = best;
      } else break;
    }
  }
  private swap(i: number, j: number): void {
    const tmp = this.heap[i]!;
    this.heap[i] = this.heap[j]!;
    this.heap[j] = tmp;
  }
}

// ============================================================
// 개선 단계의 또 다른 버그(본문 "헷갈리기 쉬운 포인트" 예시): 부모 인덱스 공식이
// 틀렸다 — Math.floor(i / 2). 올바른 공식은 Math.floor((i - 1) / 2)
// ============================================================
class BuggyPriorityQueue<T> {
  private heap: T[] = [];
  constructor(private compare: (a: T, b: T) => number) {}

  enqueue(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last !== undefined) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return min;
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor(i / 2); // 버그: (i - 1) / 2 여야 함
      const cur = this.heap[i];
      const par = this.heap[parent];
      if (cur === undefined || par === undefined) break;
      if (this.compare(cur, par) < 0) {
        this.swap(i, parent);
        i = parent;
      } else break;
    }
  }

  private siftDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let best = i;
      if (left < n && this.compare(this.heap[left]!, this.heap[best]!) < 0) best = left;
      if (right < n && this.compare(this.heap[right]!, this.heap[best]!) < 0) best = right;
      if (best !== i) {
        this.swap(i, best);
        i = best;
      } else break;
    }
  }

  private swap(i: number, j: number): void {
    const tmp = this.heap[i]!;
    this.heap[i] = this.heap[j]!;
    this.heap[j] = tmp;
  }

  snapshot(): T[] {
    return [...this.heap];
  }
}

// ============================================================
// 최종: 올바른 배열 기반 min-heap
// ============================================================
class PriorityQueue<T> {
  private heap: T[] = [];
  constructor(private compare: (a: T, b: T) => number) {}

  enqueue(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last !== undefined) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return min;
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      const cur = this.heap[i];
      const par = this.heap[parent];
      if (cur === undefined || par === undefined) break;
      if (this.compare(cur, par) < 0) {
        this.swap(i, parent);
        i = parent;
      } else break;
    }
  }

  private siftDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let best = i;
      if (left < n && this.compare(this.heap[left]!, this.heap[best]!) < 0) best = left;
      if (right < n && this.compare(this.heap[right]!, this.heap[best]!) < 0) best = right;
      if (best !== i) {
        this.swap(i, best);
        i = best;
      } else break;
    }
  }

  private swap(i: number, j: number): void {
    const tmp = this.heap[i]!;
    this.heap[i] = this.heap[j]!;
    this.heap[j] = tmp;
  }

  snapshot(): T[] {
    return [...this.heap];
  }
}

// ============================================================
// 검증 1: 가이드 시뮬레이션 프레임과 1:1 대조 (enqueue 5,1,3,2 → dequeue x2)
// ============================================================
console.log("=== 검증 1: 시뮬레이션 트레이스 (correct heap) ===");
{
  const pq = new PriorityQueue<number>((a, b) => a - b);
  const trace: { op: string; heap: number[]; ret?: number | undefined }[] = [];
  trace.push({ op: "init", heap: (pq as any).heap.slice() });
  for (const v of [5, 1, 3, 2]) {
    pq.enqueue(v);
    trace.push({ op: `enqueue(${v})`, heap: (pq as any).heap.slice() });
  }
  for (let i = 0; i < 2; i++) {
    const ret = pq.dequeue();
    trace.push({ op: `dequeue()`, heap: (pq as any).heap.slice(), ret });
  }
  for (const t of trace) console.log(JSON.stringify(t));
}

// ============================================================
// 검증 2: 버그 있는 힙(잘못된 부모 공식)이 같은 입력에서 다른 결과를 내는지 확인 → D6 함정 근거
// ============================================================
console.log("\n=== 검증 2: 버그 있는 힙 vs 올바른 힙 (동일 입력) ===");
{
  const buggy = new BuggyPriorityQueue<number>((a, b) => a - b);
  const correct = new PriorityQueue<number>((a, b) => a - b);
  const input = [5, 1, 3, 2];
  for (const v of input) {
    buggy.enqueue(v);
    correct.enqueue(v);
  }
  console.log("input:", input);
  console.log("buggy heap array  :", buggy.snapshot());
  console.log("correct heap array:", (correct as any).heap.slice());

  const buggyOut: (number | undefined)[] = [];
  const correctOut: (number | undefined)[] = [];
  const buggy2 = new BuggyPriorityQueue<number>((a, b) => a - b);
  const correct2 = new PriorityQueue<number>((a, b) => a - b);
  for (const v of input) {
    buggy2.enqueue(v);
    correct2.enqueue(v);
  }
  for (let i = 0; i < input.length; i++) {
    buggyOut.push(buggy2.dequeue());
    correctOut.push(correct2.dequeue());
  }
  console.log("buggy dequeue order  :", buggyOut);
  console.log("correct dequeue order:", correctOut);
}

// ============================================================
// 검증 2b: "왜 모순 없이 작동하는가" 절의 부모 공식 반례(본문 인용 수치)
// ============================================================
console.log("\n=== 검증 2b: 틀린 부모 공식 반례 (본문 인용) ===");
{
  const input = [2, 7, 1, 0, 14, 11, 5, 12, 7, 14];
  const buggy = new BuggyPriorityQueue<number>((a, b) => a - b);
  const correct = new PriorityQueue<number>((a, b) => a - b);
  for (const v of input) {
    buggy.enqueue(v);
    correct.enqueue(v);
  }
  const buggyOut: number[] = [];
  const correctOut: number[] = [];
  let bv: number | undefined;
  let cv: number | undefined;
  while ((bv = buggy.dequeue()) !== undefined) buggyOut.push(bv);
  while ((cv = correct.dequeue()) !== undefined) correctOut.push(cv);
  console.log("input:", input);
  console.log("buggy dequeue 순서  :", buggyOut);
  console.log("correct dequeue 순서:", correctOut);
}

// ============================================================
// 검증 2c: "아이디어를 코드로 옮기기" 절의 D6 함정 트레이스(본문 인용 수치)
// enqueue(1,3,2,4) 후 dequeue() 2회 — 버그 있는 siftDown(왼쪽만 비교)
// ============================================================
console.log("\n=== 검증 2c: siftDown 왼쪽만 비교하는 버그의 트레이스 (본문 인용) ===");
{
  const buggy = new BuggySiftDownLeftOnly<number>((a, b) => a - b);
  const correct = new PriorityQueue<number>((a, b) => a - b);
  for (const v of [1, 3, 2, 4]) {
    buggy.enqueue(v);
    correct.enqueue(v);
  }
  console.log("enqueue(1,3,2,4) 후 buggy heap  :", buggy.heap);
  console.log("enqueue(1,3,2,4) 후 correct heap:", (correct as any).heap.slice());
  const b1 = buggy.dequeue();
  console.log("buggy dequeue() 1회차 →", b1, "heap:", buggy.heap);
  const b2 = buggy.dequeue();
  console.log("buggy dequeue() 2회차 →", b2, "heap:", buggy.heap);
  const c1 = correct.dequeue();
  console.log("correct dequeue() 1회차 →", c1);
  const c2 = correct.dequeue();
  console.log("correct dequeue() 2회차 →", c2);
}

// ============================================================
// 검증 4: "왜 모순 없이 작동하는가"의 확인 질문 — heap=[1,2,3,5]에 enqueue(0)
// ============================================================
console.log("\n=== 검증 4: 확인 질문 (본문 인용 수치) ===");
{
  const pq = new PriorityQueue<number>((a, b) => a - b);
  (pq as any).heap = [1, 2, 3, 5];
  let swapCount = 0;
  const origSwap = (pq as any).swap.bind(pq);
  (pq as any).swap = (i: number, j: number) => {
    swapCount++;
    origSwap(i, j);
  };
  pq.enqueue(0);
  console.log("heap=[1,2,3,5]에 enqueue(0) → 최종:", (pq as any).heap.slice(), "swap 횟수:", swapCount);
}

// ============================================================
// 검증 5: "스스로 점검하기" 1번 문제의 입력(9,4,6,1,7) — 정답 검증용
// ============================================================
console.log("\n=== 검증 5: 점검 문제 1번 입력 트레이스 ===");
{
  const pq = new PriorityQueue<number>((a, b) => a - b);
  for (const v of [9, 4, 6, 1, 7]) {
    pq.enqueue(v);
    console.log(`enqueue(${v}) 후:`, (pq as any).heap.slice());
  }
}

// ============================================================
// 검증 3: 대표 + 엣지 + 무작위 교차검증 (정렬 결과와 비교)
// ============================================================
console.log("\n=== 검증 3: 대표/엣지/무작위 교차검증 ===");
function heapSortViaPQ(arr: number[]): number[] {
  const pq = new PriorityQueue<number>((a, b) => a - b);
  for (const v of arr) pq.enqueue(v);
  const out: number[] = [];
  let v: number | undefined;
  while ((v = pq.dequeue()) !== undefined) out.push(v);
  return out;
}

// 대표 케이스
{
  const arr = [5, 1, 3, 2];
  const got = heapSortViaPQ(arr);
  const want = [...arr].sort((a, b) => a - b);
  console.log("대표", arr, "→", got, got.join(",") === want.join(",") ? "OK" : "FAIL");
}

// 엣지: 빈 큐
{
  const pq = new PriorityQueue<number>((a, b) => a - b);
  console.log("빈 큐 dequeue():", pq.dequeue(), "peek():", pq.peek(), "isEmpty():", pq.isEmpty());
}

// 엣지: 단일 원소
{
  const pq = new PriorityQueue<number>((a, b) => a - b);
  pq.enqueue(42);
  console.log(
    "단일 원소: size=",
    pq.size(),
    "peek=",
    pq.peek(),
    "dequeue=",
    pq.dequeue(),
    "isEmpty이후=",
    pq.isEmpty(),
  );
}

// 엣지: 동일 우선순위(중복값)
{
  const pq = new PriorityQueue<number>((a, b) => a - b);
  [3, 3, 3, 1].forEach((v) => pq.enqueue(v));
  const out: number[] = [];
  let v: number | undefined;
  while ((v = pq.dequeue()) !== undefined) out.push(v);
  console.log("중복값 [3,3,3,1] → dequeue 순서:", out);
}

// 엣지: 객체 + 최댓값 비교 함수(compare 반전)
{
  type Node = { id: number; dist: number };
  const pq = new PriorityQueue<Node>((a, b) => b.dist - a.dist); // max-heap
  [
    { id: 1, dist: 2 },
    { id: 2, dist: 10 },
    { id: 3, dist: 5 },
  ].forEach((n) => pq.enqueue(n));
  console.log("max-heap dequeue 순서:", [pq.dequeue(), pq.dequeue(), pq.dequeue()]);
}

// 무작위 교차검증
{
  let allOk = true;
  for (let trial = 0; trial < 200; trial++) {
    const n = Math.floor(Math.random() * 30);
    const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 100) - 50);
    const got = heapSortViaPQ(arr);
    const want = [...arr].sort((a, b) => a - b);
    if (got.join(",") !== want.join(",")) {
      allOk = false;
      console.log("FAIL", arr, got, want);
    }
  }
  console.log("무작위 200회 교차검증:", allOk ? "OK" : "FAIL 있음");
}
