// 가이드 본문에 실린 코드를 **그대로** 옮겨 실행하는 검증 파일.
// 본문을 고치면 이 파일도 같이 고치고 다시 돌린다.
//
// 실행: bun src/data-structures/linear/monotonicQueue/_scratch/monotonicQueue-ord005-guidecode.ts

// ===== 본문 「아이디어를 코드로 옮기기」 =====
function slidingWindowMaxBasic(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque: number[] = []; // 인덱스 저장. 앞→뒤로 nums 값이 단조 비증가

  for (let j = 0; j < nums.length; j++) {
    // [1] 만료: 창을 벗어난 맨 앞 인덱스를 버린다 (많아야 하나)
    if (deque.length > 0 && deque[0]! <= j - k) {
      deque.shift();
    }
    // [2] 후단 청소: 새 값에 지배당하는 뒤쪽 후보를 버린다
    while (deque.length > 0 && nums[deque[deque.length - 1]!]! < nums[j]!) {
      deque.pop();
    }
    // [3] 나 자신을 후보로 등록
    deque.push(j);
    // [4] 창이 완성된 시점부터 답을 기록
    if (j >= k - 1) {
      result.push(nums[deque[0]!]!);
    }
  }
  return result;
}

// ===== 본문 「최적화 코드」 =====
/** 이 문제에 필요한 연산만 남긴 인덱스 전용 덱 (pushFront 는 쓰지 않는다). */
class IndexDeque {
  private buf: number[] = [];
  private head = 0; // buf[head..] 가 유효 구간

  get size(): number {
    return this.buf.length - this.head;
  }
  /** 전제: size > 0. 빈 덱에서 부르면 undefined 를 흘린다. */
  frontIndex(): number {
    return this.buf[this.head]!;
  }
  /** 전제: size > 0. */
  backIndex(): number {
    return this.buf[this.buf.length - 1]!;
  }
  pushBack(i: number): void {
    this.buf.push(i);
  }
  popBack(): void {
    this.buf.pop();
  }
  popFront(): void {
    this.head++;
    // 죽은 앞 공간이 절반을 넘으면 한 번에 압축 — 상각하면 원소당 O(1)
    if (this.head > 8 && this.head * 2 > this.buf.length) {
      this.buf = this.buf.slice(this.head);
      this.head = 0;
    }
  }
}

export class MonotonicQueue {
  slidingWindowMax(nums: number[], k: number): number[] {
    return this.sweep(nums, k, (a, b) => a < b);
  }

  slidingWindowMin(nums: number[], k: number): number[] {
    return this.sweep(nums, k, (a, b) => a > b);
  }

  /**
   * 창을 왼쪽부터 훑으며 후보 덱을 유지한다.
   * dominated(뒤쪽 후보의 값, 새 값) 가 true 면 뒤쪽 후보를 버린다.
   */
  private sweep(
    nums: number[],
    k: number,
    dominated: (backValue: number, incoming: number) => boolean,
  ): number[] {
    const result: number[] = [];
    const deque = new IndexDeque();

    for (let j = 0; j < nums.length; j++) {
      if (deque.size > 0 && deque.frontIndex() <= j - k) {
        deque.popFront();
      }
      while (deque.size > 0 && dominated(nums[deque.backIndex()]!, nums[j]!)) {
        deque.popBack();
      }
      deque.pushBack(j);
      if (j >= k - 1) {
        result.push(nums[deque.frontIndex()]!);
      }
    }
    return result;
  }
}

// ===== 대조군 =====
function bruteMax(nums: number[], k: number): number[] {
  const result: number[] = [];
  for (let l = 0; l + k <= nums.length; l++) {
    let best = nums[l]!;
    for (let i = l + 1; i < l + k; i++) if (nums[i]! > best) best = nums[i]!;
    result.push(best);
  }
  return result;
}
function bruteMin(nums: number[], k: number): number[] {
  const result: number[] = [];
  for (let l = 0; l + k <= nums.length; l++) {
    let best = nums[l]!;
    for (let i = l + 1; i < l + k; i++) if (nums[i]! < best) best = nums[i]!;
    result.push(best);
  }
  return result;
}

// 본문 점검문제 3 — 만료 제거를 후단 청소 뒤로 옮긴 판
function swappedOrderMax(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque = new IndexDeque();
  for (let j = 0; j < nums.length; j++) {
    while (deque.size > 0 && nums[deque.backIndex()]! < nums[j]!) deque.popBack();
    if (deque.size > 0 && deque.frontIndex() <= j - k) deque.popFront();
    deque.pushBack(j);
    if (j >= k - 1) result.push(nums[deque.frontIndex()]!);
  }
  return result;
}

// 본문 점검문제 2 — 후단 청소에 등호를 포함한 판 + 덱 내용 비교
function traceDeque(nums: number[], k: number, popEqual: boolean): string[] {
  const snapshots: string[] = [];
  const deque: number[] = [];
  for (let j = 0; j < nums.length; j++) {
    if (deque.length > 0 && deque[0]! <= j - k) deque.shift();
    while (
      deque.length > 0 &&
      (popEqual
        ? nums[deque[deque.length - 1]!]! <= nums[j]!
        : nums[deque[deque.length - 1]!]! < nums[j]!)
    ) {
      deque.pop();
    }
    deque.push(j);
    snapshots.push(`j=${j}: [${deque}]`);
  }
  return snapshots;
}

function eq(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mq = new MonotonicQueue();

console.log("== 본문에 적은 예시 값 대조");
{
  const a = mq.slidingWindowMax([1, 3, -1, -3, 5, 3, 6, 7], 3);
  const b = mq.slidingWindowMin([1, 3, -1, -3, 5, 3, 6, 7], 3);
  console.log(`   최적화 코드 max = [${a}]  ${eq(a, [3, 3, 5, 5, 6, 7]) ? "ok" : "FAIL"}`);
  console.log(`   최적화 코드 min = [${b}]  ${eq(b, [-1, -3, -3, -3, 3, 3]) ? "ok" : "FAIL"}`);
  const c = slidingWindowMaxBasic([1, 3, -1, -3, 5, 3, 6, 7], 3);
  console.log(`   기본 구현  max = [${c}]  ${eq(c, [3, 3, 5, 5, 6, 7]) ? "ok" : "FAIL"}`);
}

console.log("\n== 엣지 케이스 (본문 표와 대조)");
{
  const e = [4, -2, 7, 7, 0];
  console.log(`   k=1  max=[${mq.slidingWindowMax(e, 1)}] min=[${mq.slidingWindowMin(e, 1)}]`);
  console.log(`   k=5  max=[${mq.slidingWindowMax(e, 5)}] min=[${mq.slidingWindowMin(e, 5)}]`);
  console.log(`   [7,7,7,7] k=2 max=[${mq.slidingWindowMax([7, 7, 7, 7], 2)}]`);
  console.log(`   [-5,-1,-9] k=2 max=[${mq.slidingWindowMax([-5, -1, -9], 2)}] min=[${mq.slidingWindowMin([-5, -1, -9], 2)}]`);
  console.log(`   [42] k=1 max=[${mq.slidingWindowMax([42], 1)}]`);
}

console.log("\n== 무작위 교차검증 (최적화 코드 vs 브루트포스, max/min/순서 바꾼 판)");
{
  const rng = makeRng(20260731);
  let mismatch = 0;
  let cases = 0;
  for (let t = 0; t < 800; t++) {
    const n = 1 + Math.floor(rng() * 150);
    const k = 1 + Math.floor(rng() * n);
    const nums = Array.from({ length: n }, () => Math.floor(rng() * 41) - 20);
    cases++;
    if (!eq(mq.slidingWindowMax(nums, k), bruteMax(nums, k))) {
      mismatch++;
      console.log(`   MAX MISMATCH n=${n} k=${k}`);
    }
    if (!eq(mq.slidingWindowMin(nums, k), bruteMin(nums, k))) {
      mismatch++;
      console.log(`   MIN MISMATCH n=${n} k=${k}`);
    }
    if (!eq(slidingWindowMaxBasic(nums, k), bruteMax(nums, k))) {
      mismatch++;
      console.log(`   BASIC MISMATCH n=${n} k=${k}`);
    }
    if (!eq(swappedOrderMax(nums, k), bruteMax(nums, k))) {
      mismatch++;
      console.log(`   SWAPPED-ORDER MISMATCH n=${n} k=${k}  nums=[${nums}]`);
    }
  }
  console.log(`   ${cases}케이스 × 4판본 — 불일치 ${mismatch}건`);
}

console.log("\n== 결과 길이 계약 (n - k + 1)");
{
  const rng = makeRng(5);
  let bad = 0;
  for (let t = 0; t < 200; t++) {
    const n = 1 + Math.floor(rng() * 200);
    const k = 1 + Math.floor(rng() * n);
    const nums = Array.from({ length: n }, () => Math.floor(rng() * 100));
    if (mq.slidingWindowMax(nums, k).length !== n - k + 1) bad++;
    if (mq.slidingWindowMin(nums, k).length !== n - k + 1) bad++;
  }
  console.log(`   200케이스 × 2메서드 — 길이 계약 위반 ${bad}건`);
}

console.log("\n== 점검문제 2 — [7,7,7,7], k=2 에서 두 판본의 덱 내용");
{
  console.log(`   강부등호(<)  : ${traceDeque([7, 7, 7, 7], 2, false).join("  ")}`);
  console.log(`   등호포함(<=) : ${traceDeque([7, 7, 7, 7], 2, true).join("  ")}`);
  console.log(`   결과는 둘 다 [${mq.slidingWindowMax([7, 7, 7, 7], 2)}]`);
}

console.log("\n== 압축(popFront) 이 상각을 깨지 않는지 — 최악 패턴에서 총 복사량");
{
  // 내림차순 입력 = 후단 청소가 없어 덱이 최대, popFront 가 매 스텝 발생
  const n = 200_000;
  const k = 50_000;
  const nums = Array.from({ length: n }, (_, i) => n - i);
  let copies = 0;
  class CountingDeque {
    private buf: number[] = [];
    private head = 0;
    get size(): number {
      return this.buf.length - this.head;
    }
    frontIndex(): number {
      return this.buf[this.head]!;
    }
    backIndex(): number {
      return this.buf[this.buf.length - 1]!;
    }
    pushBack(i: number): void {
      this.buf.push(i);
    }
    popBack(): void {
      this.buf.pop();
    }
    popFront(): void {
      this.head++;
      if (this.head > 8 && this.head * 2 > this.buf.length) {
        copies += this.buf.length - this.head;
        this.buf = this.buf.slice(this.head);
        this.head = 0;
      }
    }
  }
  const dq = new CountingDeque();
  let popFronts = 0;
  for (let j = 0; j < n; j++) {
    if (dq.size > 0 && dq.frontIndex() <= j - k) {
      dq.popFront();
      popFronts++;
    }
    while (dq.size > 0 && nums[dq.backIndex()]! < nums[j]!) dq.popBack();
    dq.pushBack(j);
  }
  console.log(`   n=${n.toLocaleString()}, k=${k.toLocaleString()}: popFront ${popFronts.toLocaleString()}회, 압축이 실제로 복사한 원소 ${copies.toLocaleString()}개`);
  console.log(`   → 복사량 / popFront 횟수 = ${(copies / popFronts).toFixed(3)} (상각 상수임을 확인)`);
}

console.log("\n== 최적화 전/후 시간 (내림차순 입력, n = 100,000)");
{
  const n = 100_000;
  const nums = Array.from({ length: n }, (_, i) => n - i);
  function shiftBasedMax(a: number[], k: number): number[] {
    const result: number[] = [];
    const deque: number[] = [];
    for (let j = 0; j < a.length; j++) {
      if (deque.length > 0 && deque[0]! <= j - k) deque.shift();
      while (deque.length > 0 && a[deque[deque.length - 1]!]! < a[j]!) deque.pop();
      deque.push(j);
      if (j >= k - 1) result.push(a[deque[0]!]!);
    }
    return result;
  }
  for (const k of [1_000, 10_000]) {
    let t0 = performance.now();
    const s = shiftBasedMax(nums, k);
    const ts = performance.now() - t0;
    t0 = performance.now();
    const p = mq.slidingWindowMax(nums, k);
    const tp = performance.now() - t0;
    console.log(`   k=${k.toLocaleString().padStart(6)}  shift 기반 ${ts.toFixed(1).padStart(6)} ms   포인터 기반 ${tp.toFixed(1).padStart(6)} ms   ${eq(s, p) ? "결과 일치" : "MISMATCH"}`);
  }
}

console.log("\n== 외부 검토 반영: 추가 확인");
{
  // (1) j >= k-1 조건을 j > k-1 로 잘못 쓰면
  function wrongRecord(nums: number[], k: number): number[] {
    const result: number[] = [];
    const deque: number[] = [];
    for (let j = 0; j < nums.length; j++) {
      if (deque.length > 0 && deque[0]! <= j - k) deque.shift();
      while (deque.length > 0 && nums[deque[deque.length - 1]!]! < nums[j]!) deque.pop();
      deque.push(j);
      if (j > k - 1) result.push(nums[deque[0]!]!);
    }
    return result;
  }
  // 조건 자체를 빼면
  function noGuard(nums: number[], k: number): number[] {
    const result: number[] = [];
    const deque: number[] = [];
    for (let j = 0; j < nums.length; j++) {
      if (deque.length > 0 && deque[0]! <= j - k) deque.shift();
      while (deque.length > 0 && nums[deque[deque.length - 1]!]! < nums[j]!) deque.pop();
      deque.push(j);
      result.push(nums[deque[0]!]!);
    }
    return result;
  }
  const nums = [1, 3, -1, -3, 5, 3, 6, 7];
  console.log(`   정답            : [${mq.slidingWindowMax(nums, 3)}] (길이 ${mq.slidingWindowMax(nums, 3).length})`);
  console.log(`   j > k-1 로 쓰면 : [${wrongRecord(nums, 3)}] (길이 ${wrongRecord(nums, 3).length}) — 첫 창이 통째로 빠진다`);
  console.log(`   조건을 빼면     : [${noGuard(nums, 3)}] (길이 ${noGuard(nums, 3).length}) — 미완성 창까지 보고`);

  // (2) min 인데 max 비교자를 그대로 쓰면
  const wrongMin = mq.slidingWindowMax(nums, 3);
  console.log(`   min 자리에 max 비교자를 쓰면: [${wrongMin}]  정답 min: [${mq.slidingWindowMin(nums, 3)}]`);

  // (3) 지연 삭제 힙의 최대 크기 (오름차순 입력이 최악)
  class MaxHeap {
    private a: Array<[number, number]> = [];
    get size(): number { return this.a.length; }
    push(value: number, index: number): void {
      this.a.push([value, index]);
      let i = this.a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (this.a[p]![0] >= this.a[i]![0]) break;
        [this.a[p], this.a[i]] = [this.a[i]!, this.a[p]!];
        i = p;
      }
    }
    peek(): [number, number] { return this.a[0]!; }
    pop(): void {
      const last = this.a.pop()!;
      if (this.a.length === 0) return;
      this.a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let big = i;
        if (l < this.a.length && this.a[l]![0] > this.a[big]![0]) big = l;
        if (r < this.a.length && this.a[r]![0] > this.a[big]![0]) big = r;
        if (big === i) break;
        [this.a[big], this.a[i]] = [this.a[i]!, this.a[big]!];
        i = big;
      }
    }
  }
  for (const [name, gen] of [
    ["오름차순", (i: number, n: number) => i],
    ["내림차순", (i: number, n: number) => n - i],
  ] as const) {
    const n = 10_000, k = 100;
    const arr = Array.from({ length: n }, (_, i) => gen(i, n));
    const heap = new MaxHeap();
    let maxHeapSize = 0, maxDequeSize = 0;
    const deque: number[] = [];
    for (let j = 0; j < n; j++) {
      heap.push(arr[j]!, j);
      if (j >= k - 1) { while (heap.peek()[1] <= j - k) heap.pop(); }
      maxHeapSize = Math.max(maxHeapSize, heap.size);
      if (deque.length > 0 && deque[0]! <= j - k) deque.shift();
      while (deque.length > 0 && arr[deque[deque.length - 1]!]! < arr[j]!) deque.pop();
      deque.push(j);
      maxDequeSize = Math.max(maxDequeSize, deque.length);
    }
    console.log(`   ${name} 입력 n=${n}, k=${k}: 힙 최대 크기 ${maxHeapSize} (n의 ${((maxHeapSize / n) * 100).toFixed(0)}%), 단조 덱 최대 크기 ${maxDequeSize} (k=${k})`);
  }
}
