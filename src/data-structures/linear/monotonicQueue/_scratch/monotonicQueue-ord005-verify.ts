// MonotonicQueue 가이드 ORD-005 재집필용 실측 검증 스크래치
//
// 본문에 실을 코드를 그대로 두고, 본문에 쓸 모든 수치를 실행으로 확인한다.
// 실행: bun src/data-structures/linear/monotonicQueue/_scratch/monotonicQueue-ord005-verify.ts

let compares = 0;
function resetCompares(): void {
  compares = 0;
}

// ---------------------------------------------------------------------------
// 사다리 0단 — 브루트포스: 윈도우마다 통째로 훑는다
// ---------------------------------------------------------------------------
function bruteMax(nums: number[], k: number): number[] {
  const result: number[] = [];
  for (let l = 0; l + k <= nums.length; l++) {
    let best = nums[l]!;
    for (let i = l + 1; i < l + k; i++) {
      compares++;
      if (nums[i]! > best) best = nums[i]!;
    }
    result.push(best);
  }
  return result;
}

function bruteMin(nums: number[], k: number): number[] {
  const result: number[] = [];
  for (let l = 0; l + k <= nums.length; l++) {
    let best = nums[l]!;
    for (let i = l + 1; i < l + k; i++) {
      if (nums[i]! < best) best = nums[i]!;
    }
    result.push(best);
  }
  return result;
}

// ---------------------------------------------------------------------------
// 사다리 1단 — 직전 최댓값 재활용
//   나가는 값이 최댓값이 아니면 O(1), 최댓값이면 창 전체 재스캔 O(k)
// ---------------------------------------------------------------------------
function reuseMax(nums: number[], k: number): number[] {
  const n = nums.length;
  const result: number[] = [];
  let bestIdx = 0;
  for (let i = 1; i < k; i++) {
    compares++;
    if (nums[i]! > nums[bestIdx]!) bestIdx = i;
  }
  result.push(nums[bestIdx]!);

  for (let j = k; j < n; j++) {
    const leaving = j - k;
    if (bestIdx === leaving) {
      // 최댓값이 창을 빠져나갔다 — 새 창 전체를 다시 훑어야 한다
      bestIdx = j - k + 1;
      for (let i = j - k + 2; i <= j; i++) {
        compares++;
        if (nums[i]! > nums[bestIdx]!) bestIdx = i;
      }
    } else {
      compares++;
      if (nums[j]! >= nums[bestIdx]!) bestIdx = j;
    }
    result.push(nums[bestIdx]!);
  }
  return result;
}

// ---------------------------------------------------------------------------
// 사다리 2단 — 최대 힙 + 지연 삭제(lazy deletion)
// ---------------------------------------------------------------------------
class MaxHeap {
  private a: Array<[number, number]> = []; // [값, 인덱스]

  get size(): number {
    return this.a.length;
  }
  push(value: number, index: number): void {
    this.a.push([value, index]);
    let i = this.a.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      compares++;
      if (this.a[parent]![0] >= this.a[i]![0]) break;
      [this.a[parent], this.a[i]] = [this.a[i]!, this.a[parent]!];
      i = parent;
    }
  }
  peek(): [number, number] {
    return this.a[0]!;
  }
  pop(): void {
    const last = this.a.pop()!;
    if (this.a.length === 0) return;
    this.a[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let big = i;
      if (l < this.a.length) {
        compares++;
        if (this.a[l]![0] > this.a[big]![0]) big = l;
      }
      if (r < this.a.length) {
        compares++;
        if (this.a[r]![0] > this.a[big]![0]) big = r;
      }
      if (big === i) break;
      [this.a[big], this.a[i]] = [this.a[i]!, this.a[big]!];
      i = big;
    }
  }
}

function heapMax(nums: number[], k: number): number[] {
  const result: number[] = [];
  const heap = new MaxHeap();
  for (let j = 0; j < nums.length; j++) {
    heap.push(nums[j]!, j);
    if (j >= k - 1) {
      while (heap.peek()[1] <= j - k) heap.pop(); // 창을 벗어난 꼭대기는 버린다
      result.push(heap.peek()[0]);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// 사다리 3단 — 단조 덱 (배열 shift 사용판 / 포인터판)
// ---------------------------------------------------------------------------
let pushCount = 0;
let popBackCount = 0;
let popFrontCount = 0;
function resetCounters(): void {
  pushCount = 0;
  popBackCount = 0;
  popFrontCount = 0;
}

function shiftBasedMax(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque: number[] = [];
  for (let j = 0; j < nums.length; j++) {
    if (deque.length > 0 && deque[0]! <= j - k) deque.shift();
    while (deque.length > 0 && nums[deque[deque.length - 1]!]! < nums[j]!) deque.pop();
    deque.push(j);
    if (j >= k - 1) result.push(nums[deque[0]!]!);
  }
  return result;
}

class IndexDeque {
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
      this.buf = this.buf.slice(this.head);
      this.head = 0;
    }
  }
  values(): number[] {
    return this.buf.slice(this.head);
  }
}

function monotonicMax(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque = new IndexDeque();
  for (let j = 0; j < nums.length; j++) {
    if (deque.size > 0 && deque.frontIndex() <= j - k) {
      deque.popFront();
      popFrontCount++;
    }
    while (deque.size > 0 && nums[deque.backIndex()]! < nums[j]!) {
      deque.popBack();
      popBackCount++;
    }
    deque.pushBack(j);
    pushCount++;
    if (j >= k - 1) result.push(nums[deque.frontIndex()]!);
  }
  return result;
}

function monotonicMin(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque = new IndexDeque();
  for (let j = 0; j < nums.length; j++) {
    if (deque.size > 0 && deque.frontIndex() <= j - k) deque.popFront();
    while (deque.size > 0 && nums[deque.backIndex()]! > nums[j]!) deque.popBack();
    deque.pushBack(j);
    if (j >= k - 1) result.push(nums[deque.frontIndex()]!);
  }
  return result;
}

// 만료 조건을 `<` 로 잘못 쓴 버그 버전
function buggyExpiryMax(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque = new IndexDeque();
  for (let j = 0; j < nums.length; j++) {
    if (deque.size > 0 && deque.frontIndex() < j - k) deque.popFront();
    while (deque.size > 0 && nums[deque.backIndex()]! < nums[j]!) deque.popBack();
    deque.pushBack(j);
    if (j >= k - 1) result.push(nums[deque.frontIndex()]!);
  }
  return result;
}

// 만료 제거를 while 이 아니라 if 로 쓰면? (한 스텝에 한 개만 만료되는지 확인)
function ifVsWhileMax(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque = new IndexDeque();
  for (let j = 0; j < nums.length; j++) {
    while (deque.size > 0 && deque.frontIndex() <= j - k) deque.popFront();
    while (deque.size > 0 && nums[deque.backIndex()]! < nums[j]!) deque.popBack();
    deque.pushBack(j);
    if (j >= k - 1) result.push(nums[deque.frontIndex()]!);
  }
  return result;
}

// 후단 청소를 `<=` 로 (동일값도 밀어내는) 버전 — 정답이 같은지 확인
function popEqualMax(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque = new IndexDeque();
  for (let j = 0; j < nums.length; j++) {
    if (deque.size > 0 && deque.frontIndex() <= j - k) deque.popFront();
    while (deque.size > 0 && nums[deque.backIndex()]! <= nums[j]!) deque.popBack();
    deque.pushBack(j);
    if (j >= k - 1) result.push(nums[deque.frontIndex()]!);
  }
  return result;
}

// ---------------------------------------------------------------------------
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

console.log("=".repeat(74));
console.log("[1] 문제 예시 재현");
console.log("=".repeat(74));
{
  const a = monotonicMax([1, 3, -1, -3, 5, 3, 6, 7], 3);
  const b = monotonicMin([1, 3, -1, -3, 5, 3, 6, 7], 3);
  const c = monotonicMax([20, 22, 18, 25, 24, 21, 23, 19], 3);
  console.log(`   slidingWindowMax([1,3,-1,-3,5,3,6,7], 3) = [${a}]   (기대 [3,3,5,5,6,7]) ${eq(a, [3, 3, 5, 5, 6, 7]) ? "ok" : "FAIL"}`);
  console.log(`   slidingWindowMin([1,3,-1,-3,5,3,6,7], 3) = [${b}]   (기대 [-1,-3,-3,-3,3,3]) ${eq(b, [-1, -3, -3, -3, 3, 3]) ? "ok" : "FAIL"}`);
  console.log(`   slidingWindowMax([20,22,18,25,24,21,23,19], 3) = [${c}]   (기대 [22,25,25,25,24,23]) ${eq(c, [22, 25, 25, 25, 24, 23]) ? "ok" : "FAIL"}`);
}

console.log("\n" + "=".repeat(74));
console.log("[2] 비교 횟수 실측 — 세 가지 입력 패턴 (n = 20,000, k = 1,000)");
console.log("=".repeat(74));
{
  const n = 20_000;
  const k = 1_000;
  const rng = makeRng(20260731);
  const patterns: Array<[string, number[]]> = [
    ["무작위", Array.from({ length: n }, () => Math.floor(rng() * 20001) - 10000)],
    ["단조 증가 (1..n)", Array.from({ length: n }, (_, i) => i)],
    ["단조 감소 (n..1)", Array.from({ length: n }, (_, i) => n - i)],
  ];
  console.log("   패턴              브루트포스 비교     직전값 재활용 비교     단조 덱 push/popBack/popFront");
  for (const [name, nums] of patterns) {
    resetCompares();
    const brute = bruteMax(nums, k);
    const bruteC = compares;
    resetCompares();
    const reuse = reuseMax(nums, k);
    const reuseC = compares;
    resetCounters();
    const mono = monotonicMax(nums, k);
    const okR = eq(brute, reuse) ? "" : " (재활용 결과 불일치!)";
    const okM = eq(brute, mono) ? "" : " (단조 덱 결과 불일치!)";
    console.log(
      `   ${name.padEnd(16)} ${bruteC.toLocaleString().padStart(12)} ${reuseC.toLocaleString().padStart(18)} ${`${pushCount}/${popBackCount}/${popFrontCount}`.padStart(28)}${okR}${okM}`,
    );
  }
  console.log(`\n   (n=${n}, k=${k} → 브루트포스 이론값 (n-k+1)(k-1) = ${((n - k + 1) * (k - 1)).toLocaleString()})`);
  console.log(`   (단조 덱 이론 상한: push n회, pop 합계 ≤ n회 → 총 연산 ≤ 2n = ${2 * n})`);
}

console.log("\n" + "=".repeat(74));
console.log("[3] 실제 소요 시간 — n = 100,000");
console.log("=".repeat(74));
{
  const n = 100_000;
  const rng = makeRng(7);
  const random = Array.from({ length: n }, () => Math.floor(rng() * 20001) - 10000);
  const decreasing = Array.from({ length: n }, (_, i) => n - i);

  function time(label: string, fn: () => number[], expect?: number[]): number[] {
    const t0 = performance.now();
    const out = fn();
    const t1 = performance.now();
    const mark = expect ? (eq(out, expect) ? " ok" : " MISMATCH") : "";
    console.log(`   ${label.padEnd(34)} ${(t1 - t0).toFixed(1).padStart(9)} ms${mark}`);
    return out;
  }

  for (const [pname, nums] of [
    ["무작위", random],
    ["단조 감소", decreasing],
  ] as const) {
    for (const k of [1_000, 10_000]) {
      console.log(`\n   -- ${pname} 입력, k = ${k.toLocaleString()}`);
      const ref = time("① 브루트포스 O(nk)", () => bruteMax(nums, k));
      time("② 직전 최댓값 재활용", () => reuseMax(nums, k), ref);
      time("③ 최대 힙 + 지연 삭제 O(n log n)", () => heapMax(nums, k), ref);
      time("④ 단조 덱 (배열 shift)", () => shiftBasedMax(nums, k), ref);
      time("⑤ 단조 덱 (head 포인터)", () => monotonicMax(nums, k), ref);
    }
  }
}

console.log("\n" + "=".repeat(74));
console.log("[4] 상각 분석 검증 — 각 인덱스는 정말 최대 1번 push, 1번 pop인가");
console.log("=".repeat(74));
{
  const rng = makeRng(99);
  let worstOps = 0;
  let worstDesc = "";
  for (let trial = 0; trial < 200; trial++) {
    const n = 1 + Math.floor(rng() * 300);
    const k = 1 + Math.floor(rng() * n);
    const nums = Array.from({ length: n }, () => Math.floor(rng() * 21) - 10);
    resetCounters();
    monotonicMax(nums, k);
    const total = pushCount + popBackCount + popFrontCount;
    if (pushCount !== n) throw new Error(`push 횟수가 n이 아님: ${pushCount} != ${n}`);
    if (popBackCount + popFrontCount > n) throw new Error("pop 횟수가 n을 초과");
    if (total / n > worstOps) {
      worstOps = total / n;
      worstDesc = `n=${n}, k=${k}, push=${pushCount}, popBack=${popBackCount}, popFront=${popFrontCount}`;
    }
  }
  console.log(`   200회 무작위 시행: push는 항상 정확히 n회, pop 합계는 항상 n회 이하 — 위반 0건`);
  console.log(`   원소당 총 연산 최댓값 = ${worstOps.toFixed(3)} (이론 상한 2)  ← ${worstDesc}`);

  // 덱 크기 상한
  const nums = Array.from({ length: 1000 }, (_, i) => 1000 - i); // 단조 감소 = 최악
  const dq = new IndexDeque();
  let maxSize = 0;
  const k = 137;
  for (let j = 0; j < nums.length; j++) {
    if (dq.size > 0 && dq.frontIndex() <= j - k) dq.popFront();
    while (dq.size > 0 && nums[dq.backIndex()]! < nums[j]!) dq.popBack();
    dq.pushBack(j);
    maxSize = Math.max(maxSize, dq.size);
  }
  console.log(`   단조 감소 입력(n=1000, k=${k})에서 덱 최대 크기 = ${maxSize} (상한 k=${k})`);
}

console.log("\n" + "=".repeat(74));
console.log("[5] 지배 관계(dominance) 실증 — 뒤에서 버린 인덱스가 나중에 답이 되는 일이 있는가");
console.log("=".repeat(74));
{
  const rng = makeRng(4242);
  let discarded = 0;
  let violation = 0;
  for (let trial = 0; trial < 300; trial++) {
    const n = 5 + Math.floor(rng() * 60);
    const k = 1 + Math.floor(rng() * n);
    const nums = Array.from({ length: n }, () => Math.floor(rng() * 15));

    // 각 윈도우의 "가장 오른쪽 최댓값 인덱스"를 브루트포스로 구한다
    const argmax: number[] = [];
    for (let l = 0; l + k <= n; l++) {
      let bi = l;
      for (let i = l + 1; i < l + k; i++) if (nums[i]! >= nums[bi]!) bi = i;
      argmax.push(bi);
    }

    // 단조 덱을 돌리면서 popBack 으로 버려지는 인덱스를 기록
    const deque: number[] = [];
    for (let j = 0; j < n; j++) {
      if (deque.length > 0 && deque[0]! <= j - k) deque.shift();
      while (deque.length > 0 && nums[deque[deque.length - 1]!]! < nums[j]!) {
        const dropped = deque.pop()!;
        discarded++;
        // dropped 가 j 이후(오른쪽 끝 >= j)의 어떤 윈도우에서 "가장 오른쪽 최댓값"인가?
        for (let l = Math.max(0, j - k + 1); l + k <= n; l++) {
          if (argmax[l] === dropped) violation++;
        }
      }
      deque.push(j);
    }
  }
  console.log(`   300회 시행 — popBack으로 버린 인덱스 ${discarded}개`);
  console.log(`   그중 "버린 시점 이후의 어떤 윈도우에서 최댓값 대표(가장 오른쪽 최댓값)"였던 경우: ${violation}건`);
}

console.log("\n" + "=".repeat(74));
console.log("[6] 무작위 교차검증 — 브루트포스와 대조 (max / min)");
console.log("=".repeat(74));
{
  const rng = makeRng(31337);
  let cases = 0;
  let mismatch = 0;
  for (let trial = 0; trial < 500; trial++) {
    const n = 1 + Math.floor(rng() * 120);
    const k = 1 + Math.floor(rng() * n);
    const nums = Array.from({ length: n }, () => Math.floor(rng() * 41) - 20);
    cases++;
    if (!eq(monotonicMax(nums, k), bruteMax(nums, k))) {
      mismatch++;
      console.log(`   MAX MISMATCH n=${n} k=${k} nums=[${nums}]`);
    }
    if (!eq(monotonicMin(nums, k), bruteMin(nums, k))) {
      mismatch++;
      console.log(`   MIN MISMATCH n=${n} k=${k}`);
    }
    if (!eq(popEqualMax(nums, k), bruteMax(nums, k))) {
      mismatch++;
      console.log(`   POP-EQUAL MISMATCH n=${n} k=${k}`);
    }
    if (!eq(ifVsWhileMax(nums, k), bruteMax(nums, k))) {
      mismatch++;
      console.log(`   IF-VS-WHILE MISMATCH n=${n} k=${k}`);
    }
  }
  console.log(`   ${cases}개 무작위 케이스 × (max/min/동일값도 밀어내는 판/만료를 while로 쓴 판) — 불일치 ${mismatch}건`);
}

console.log("\n" + "=".repeat(74));
console.log("[7] 만료 조건 등호 버그 — `<=` 대신 `<` 를 쓰면");
console.log("=".repeat(74));
{
  const nums = [9, 1, 1, 1, 1];
  const k = 2;
  console.log(`   nums = [${nums}], k = ${k}`);
  console.log(`   정답(브루트포스) = [${bruteMax(nums, k)}]`);
  console.log(`   <= 사용 (정상)   = [${monotonicMax(nums, k)}]`);
  console.log(`   <  사용 (버그)   = [${buggyExpiryMax(nums, k)}]`);

  // 무작위로 처음 어긋나는 지점
  const rng = makeRng(5);
  let found = "";
  for (let t = 0; t < 200 && !found; t++) {
    const n = 3 + Math.floor(rng() * 12);
    const k2 = 1 + Math.floor(rng() * n);
    const arr = Array.from({ length: n }, () => Math.floor(rng() * 10));
    if (!eq(buggyExpiryMax(arr, k2), bruteMax(arr, k2))) {
      found = `nums=[${arr}], k=${k2} → 버그 [${buggyExpiryMax(arr, k2)}] vs 정답 [${bruteMax(arr, k2)}]`;
    }
  }
  console.log(`   무작위 탐색으로 찾은 또 다른 실패: ${found || "없음"}`);
}

console.log("\n" + "=".repeat(74));
console.log("[8] 엣지 케이스");
console.log("=".repeat(74));
{
  const nums = [4, -2, 7, 7, 0];
  console.log(`   nums = [${nums}]`);
  console.log(`   k=1        max=[${monotonicMax(nums, 1)}]  (입력 그대로) min=[${monotonicMin(nums, 1)}]`);
  console.log(`   k=n(5)     max=[${monotonicMax(nums, 5)}]  min=[${monotonicMin(nums, 5)}]`);
  console.log(`   전부 동일값 [7,7,7,7], k=2  max=[${monotonicMax([7, 7, 7, 7], 2)}]`);
  console.log(`   전부 음수 [-5,-1,-9], k=2   max=[${monotonicMax([-5, -1, -9], 2)}] min=[${monotonicMin([-5, -1, -9], 2)}]`);
  console.log(`   길이 1 [42], k=1            max=[${monotonicMax([42], 1)}]`);
}

console.log("\n" + "=".repeat(74));
console.log("[9] 시뮬레이션 프레임 실측 — nums=[1,3,-1,-3,5,3,6,7], k=3");
console.log("=".repeat(74));
{
  const nums = [1, 3, -1, -3, 5, 3, 6, 7];
  const k = 3;
  const deque = new IndexDeque();
  const result: number[] = [];
  for (let j = 0; j < nums.length; j++) {
    const log: string[] = [];
    if (deque.size > 0 && deque.frontIndex() <= j - k) {
      log.push(`만료 popFront(${deque.frontIndex()})`);
      deque.popFront();
    }
    while (deque.size > 0 && nums[deque.backIndex()]! < nums[j]!) {
      log.push(`후단청소 popBack(${deque.backIndex()})`);
      deque.popBack();
    }
    deque.pushBack(j);
    let rec = "";
    if (j >= k - 1) {
      result.push(nums[deque.frontIndex()]!);
      rec = ` → result.push(nums[${deque.frontIndex()}]=${nums[deque.frontIndex()]}) result=[${result}]`;
    }
    console.log(
      `   j=${j} nums[j]=${String(nums[j]).padStart(2)} | ${log.join(", ").padEnd(38)} | 덱=[${deque.values()}]${rec}`,
    );
  }
  console.log(`   최종 result = [${result}]`);
}

console.log("\n" + "=".repeat(74));
console.log("[10] 하한 확인 — 원소 하나를 안 읽으면 답이 바뀔 수 있는가");
console.log("=".repeat(74));
{
  // 어떤 인덱스 i를 안 읽고도 정답을 낼 수 있다면, nums[i]를 아주 크게 바꿔도
  // 답이 그대로여야 한다. 실제로는 i를 포함하는 윈도우의 답이 바뀐다.
  const nums = [3, 1, 4, 1, 5];
  const k = 2;
  const base = bruteMax(nums, k);
  let changedAll = true;
  for (let i = 0; i < nums.length; i++) {
    const alt = [...nums];
    alt[i] = 100;
    const changed = !eq(bruteMax(alt, k), base);
    if (!changed) changedAll = false;
    console.log(`   nums[${i}]를 100으로 바꾸면 결과 [${bruteMax(alt, k)}] — 변화 ${changed ? "있음" : "없음"}`);
  }
  console.log(`   모든 위치에서 답이 바뀐다: ${changedAll} → 어떤 원소도 건너뛸 수 없다(Ω(n))`);
}
