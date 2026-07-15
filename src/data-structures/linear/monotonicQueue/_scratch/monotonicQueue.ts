// E3 자기검증 스크래치 — 가이드 본문에 실릴 코드를 그대로 추출해 실행/검증한다.
// 실행: bun src/data-structures/linear/monotonicQueue/_scratch/monotonicQueue.ts

// ── 1. 원형 (brute force) ───────────────────────────────────────────
function bruteMax(nums: number[], k: number): number[] {
  const result: number[] = [];
  for (let i = 0; i <= nums.length - k; i++) {
    result.push(Math.max(...nums.slice(i, i + k)));
  }
  return result;
}

// ── 2. 개선: shift() 기반 배열 덱 ──────────────────────────────────
function shiftBasedMax(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque: number[] = []; // 인덱스 저장, 앞→뒤 단조 감소

  for (let j = 0; j < nums.length; j++) {
    while (deque.length > 0 && deque[0]! <= j - k) {
      deque.shift(); // 앞에서 제거 — 내부적으로 전체 재배치 O(size)
    }
    while (deque.length > 0 && nums[deque[deque.length - 1]!]! < nums[j]!) {
      deque.pop();
    }
    deque.push(j);
    if (j >= k - 1) {
      result.push(nums[deque[0]!]!);
    }
  }
  return result;
}

// 버그 버전: 만료 조건을 <= 대신 < 로 잘못 쓴 경우 (off-by-one)
function buggyExpiryMax(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque: number[] = [];
  for (let j = 0; j < nums.length; j++) {
    while (deque.length > 0 && deque[0]! < j - k) {
      // 버그: <= 이어야 하는데 < 를 씀
      deque.shift();
    }
    while (deque.length > 0 && nums[deque[deque.length - 1]!]! < nums[j]!) {
      deque.pop();
    }
    deque.push(j);
    if (j >= k - 1) {
      result.push(nums[deque[0]!]!);
    }
  }
  return result;
}

// ── 3. 최종: 포인터 기반 덱 (진짜 O(1) 상환) ────────────────────────
class IndexDeque {
  private buf: number[] = [];
  private head = 0; // buf[head..] 가 유효 구간

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
    // 앞쪽 낭비 공간이 절반을 넘으면 압축 — 물리적 shift 없이 상환 O(1) 유지
    if (this.head > 8 && this.head * 2 > this.buf.length) {
      this.buf = this.buf.slice(this.head);
      this.head = 0;
    }
  }
}

export class MonotonicQueue {
  slidingWindowMax(nums: number[], k: number): number[] {
    const result: number[] = [];
    const deque = new IndexDeque();

    for (let j = 0; j < nums.length; j++) {
      if (deque.size > 0 && deque.frontIndex() <= j - k) {
        deque.popFront();
      }
      while (deque.size > 0 && nums[deque.backIndex()]! < nums[j]!) {
        deque.popBack();
      }
      deque.pushBack(j);
      if (j >= k - 1) {
        result.push(nums[deque.frontIndex()]!);
      }
    }
    return result;
  }

  slidingWindowMin(nums: number[], k: number): number[] {
    const result: number[] = [];
    const deque = new IndexDeque();

    for (let j = 0; j < nums.length; j++) {
      if (deque.size > 0 && deque.frontIndex() <= j - k) {
        deque.popFront();
      }
      while (deque.size > 0 && nums[deque.backIndex()]! > nums[j]!) {
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

// ══════════════════════════════════════════════════════════════════
// 실행/검증
// ══════════════════════════════════════════════════════════════════

function assertEqual(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const ok = a === e;
  console.log(`${ok ? "OK " : "FAIL"} ${label}: got ${a}${ok ? "" : `, expected ${e}`}`);
  if (!ok) process.exitCode = 1;
}

const mq = new MonotonicQueue();

console.log("=== 대표 예시: [1,3,-1,-3,5,3,6,7], k=3 ===");
const rep = mq.slidingWindowMax([1, 3, -1, -3, 5, 3, 6, 7], 3);
assertEqual("slidingWindowMax", rep, [3, 3, 5, 5, 6, 7]);
assertEqual("brute와 일치", rep, bruteMax([1, 3, -1, -3, 5, 3, 6, 7], 3));
assertEqual(
  "shiftBasedMax와 일치",
  rep,
  shiftBasedMax([1, 3, -1, -3, 5, 3, 6, 7], 3),
);
const repMin = mq.slidingWindowMin([1, 3, -1, -3, 5, 3, 6, 7], 3);
assertEqual("slidingWindowMin", repMin, [-1, -3, -3, -3, 3, 3]);

console.log("\n=== 엣지: k=1 ===");
assertEqual("k=1 그대로", mq.slidingWindowMax([4, 2, 7, 1, 5], 1), [4, 2, 7, 1, 5]);

console.log("\n=== 엣지: k=n ===");
assertEqual("k=n 전체 최댓값", mq.slidingWindowMax([4, 2, 7, 1, 5], 5), [7]);
assertEqual("k=n 전체 최솟값", mq.slidingWindowMin([4, 2, 7, 1, 5], 5), [1]);

console.log("\n=== 엣지: 동일값 ===");
assertEqual("동일값 유지", mq.slidingWindowMax([7, 7, 7, 7], 2), [7, 7, 7]);

console.log("\n=== 엣지: 단조 증가/감소 ===");
assertEqual("증가 배열 max", mq.slidingWindowMax([1, 2, 3, 4, 5], 3), [3, 4, 5]);
assertEqual("감소 배열 min", mq.slidingWindowMin([5, 4, 3, 2, 1], 3), [3, 2, 1]);

console.log("\n=== D6 함정: buggyExpiryMax vs 정답 (nums=[9,1,1,1,1], k=2) ===");
const trapNums = [9, 1, 1, 1, 1];
const correct = mq.slidingWindowMax(trapNums, 2);
const buggy = buggyExpiryMax(trapNums, 2);
console.log(`정답(<=):  ${JSON.stringify(correct)}`);
console.log(`버그(<):   ${JSON.stringify(buggy)}`);
assertEqual("정답은 [9,1,1,1]", correct, [9, 1, 1, 1]);
assertEqual("버그는 [9,9,1,1]", buggy, [9, 9, 1, 1]);

console.log("\n=== 무작위 교차검증 (brute vs 최종 구현, 200회) ===");
let randomFails = 0;
for (let t = 0; t < 200; t++) {
  const n = 1 + Math.floor(Math.random() * 30);
  const nums = Array.from({ length: n }, () => Math.floor(Math.random() * 21) - 10);
  const k = 1 + Math.floor(Math.random() * n);
  const a = JSON.stringify(mq.slidingWindowMax(nums, k));
  const b = JSON.stringify(bruteMax(nums, k));
  if (a !== b) {
    randomFails++;
    console.log(`FAIL nums=${JSON.stringify(nums)} k=${k} got=${a} want=${b}`);
  }
}
console.log(randomFails === 0 ? "OK  무작위 200케이스 전부 일치" : `FAIL ${randomFails}건 불일치`);
if (randomFails > 0) process.exitCode = 1;

console.log("\n=== 벤치마크: shift() 기반 vs 포인터 기반 (단조 감소 배열, n=1,000,000, k=400,000) ===");
{
  const n = 1_000_000;
  const k = 400_000;
  const worstCase = Array.from({ length: n }, (_, i) => n - i); // 단조 감소 → back-pop 없음, popFront만 반복

  const t0 = performance.now();
  shiftBasedMax(worstCase, k);
  const t1 = performance.now();
  mq.slidingWindowMax(worstCase, k);
  const t2 = performance.now();

  console.log(`shift() 기반:   ${(t1 - t0).toFixed(1)}ms`);
  console.log(`포인터 기반:    ${(t2 - t1).toFixed(1)}ms`);
  console.log(`비율:           ${((t1 - t0) / (t2 - t1)).toFixed(2)}배`);
}

console.log("\n=== 시뮬레이션 프레임 실측 대조 ===");
{
  const nums = [1, 3, -1, -3, 5, 3, 6, 7];
  const k = 3;
  const deque = new IndexDeque();
  const trace: { j: number; deque: number[]; resultLen: number; lastResult?: number }[] = [];
  const result: number[] = [];
  for (let j = 0; j < nums.length; j++) {
    if (deque.size > 0 && deque.frontIndex() <= j - k) deque.popFront();
    while (deque.size > 0 && nums[deque.backIndex()]! < nums[j]!) deque.popBack();
    deque.pushBack(j);
    if (j >= k - 1) result.push(nums[deque.frontIndex()]!);
    const cur: number[] = [];
    for (let p = 0; p < deque.size; p++) cur.push(deque["buf"][deque["head"] + p]);
    trace.push({ j, deque: cur, resultLen: result.length, lastResult: result[result.length - 1] });
  }
  for (const t of trace) {
    console.log(`j=${t.j} deque=${JSON.stringify(t.deque)} result=${JSON.stringify(result.slice(0, t.resultLen))}`);
  }
  console.log(`최종 result = ${JSON.stringify(result)}`);
}
