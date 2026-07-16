// E3 자기검증 스크래치 — 가이드 본문에 싣는 코드(원형 DP → tails+선형탐색 →
// tails+이분탐색)를 그대로 옮겨 실제 실행 값으로 본문의 모든 수치·트레이스를 검증한다.
// 실행: bun src/algorithms/array/longestIncreasingSubsequence/_scratch/longestIncreasingSubsequence.ts

// ── 1) 원형: O(N^2) DP (가이드 "출발점" 절의 코드와 동일) ─────────────
function longestIncreasingSubsequenceNaive(A: number[]): number {
  const n = A.length;
  const dp = new Array<number>(n).fill(1);
  let best = 1;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (A[j] < A[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
    best = Math.max(best, dp[i]);
  }
  return best;
}

// ── 2) 개선: tails 배열 + 선형 탐색 (가이드 "아이디어를 코드로 옮기기" 절과 동일) ──
function longestIncreasingSubsequenceLinear(A: number[]): number {
  const tails: number[] = [];
  for (const x of A) {
    let pos = 0;
    while (pos < tails.length && tails[pos] < x) pos++;
    if (pos === tails.length) tails.push(x);
    else tails[pos] = x;
  }
  return tails.length;
}

// ── 3) 최종: tails 배열 + 이분 탐색 (가이드 "최적화 코드" 절과 동일, O(N log N)) ──
function longestIncreasingSubsequence(A: number[]): number {
  const tails: number[] = [];
  for (const x of A) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) tails.push(x);
    else tails[lo] = x;
  }
  return tails.length;
}

// ── 트레이스 수집 (실행 시각화 steps와 대조용) ───────────────────────
function traceBinary(A: number[]) {
  const tails: number[] = [];
  const frames: { x: number; pos: number; pushed: boolean; tails: number[] }[] = [];
  for (const x of A) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    const pushed = lo === tails.length;
    if (pushed) tails.push(x);
    else tails[lo] = x;
    frames.push({ x, pos: lo, pushed, tails: [...tails] });
  }
  return frames;
}

// ── 비교 횟수 계측용(가이드 본문 코드는 아님 — "더 빠르게 만들 단서" 절의
//    수치 근거를 재기 위한 계측 래퍼일 뿐) ───────────────────────────
function countLinear(A: number[]): { length: number; comparisons: number } {
  const tails: number[] = [];
  let comparisons = 0;
  for (const x of A) {
    let pos = 0;
    while (pos < tails.length) {
      comparisons++;
      if (tails[pos] >= x) break;
      pos++;
    }
    if (pos === tails.length) tails.push(x);
    else tails[pos] = x;
  }
  return { length: tails.length, comparisons };
}
function countBinary(A: number[]): { length: number; comparisons: number } {
  const tails: number[] = [];
  let comparisons = 0;
  for (const x of A) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      comparisons++;
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) tails.push(x);
    else tails[lo] = x;
  }
  return { length: tails.length, comparisons };
}

// ============================ 검증 실행 ============================

console.log("=== 대표 예시: A=[10,9,2,5,3,7,101,18] ===");
const rep = [10, 9, 2, 5, 3, 7, 101, 18];
console.log("naive DP:", longestIncreasingSubsequenceNaive(rep));
console.log("tails linear:", longestIncreasingSubsequenceLinear(rep));
console.log("tails binary(최종):", longestIncreasingSubsequence(rep));
console.log("trace:");
for (const f of traceBinary(rep)) {
  console.log(`  x=${f.x} pos=${f.pos} ${f.pushed ? "push" : "replace"} tails=[${f.tails.join(",")}]`);
}

console.log("\n=== 확인 질문 검증: tails=[2,5] 상태에서 x=3 ===");
for (const f of traceBinary([2, 5, 3])) {
  console.log(`  x=${f.x} pos=${f.pos} ${f.pushed ? "push" : "replace"} tails=[${f.tails.join(",")}]`);
}

console.log("\n=== 문제 예시 전수 검증 ===");
const cases: [number[], number][] = [
  [[10, 9, 2, 5, 3, 7, 101, 18], 4],
  [[0, 1, 0, 3, 2, 3], 4],
  [[1, 3, 6, 7, 9, 4, 10, 5, 6], 6],
  [[7, 7, 7, 7], 1],
  [[5, 4, 3, 2, 1], 1],
  [[-3, -2, -1, 0], 4],
  [[42], 1],
];
for (const [A, expected] of cases) {
  const dp = longestIncreasingSubsequenceNaive(A);
  const lin = longestIncreasingSubsequenceLinear(A);
  const bin = longestIncreasingSubsequence(A);
  const ok = dp === expected && lin === expected && bin === expected;
  console.log(`A=${JSON.stringify(A)} expected=${expected} dp=${dp} linear=${lin} binary=${bin} ${ok ? "OK" : "MISMATCH!!"}`);
}

console.log("\n=== 엣지케이스 ===");
console.log("[5] ->", longestIncreasingSubsequence([5]), "(기대 1)");
console.log("[3,3,3] ->", longestIncreasingSubsequence([3, 3, 3]), "(기대 1, 엄격 증가라 중복 불가)");
console.log("[1,2,3,4,5] ->", longestIncreasingSubsequence([1, 2, 3, 4, 5]), "(기대 5)");
console.log("[5,4,3,2,1] ->", longestIncreasingSubsequence([5, 4, 3, 2, 1]), "(기대 1)");

console.log("\n=== 연습문제 검증: A=[3,10,2,1,20] ===");
for (const f of traceBinary([3, 10, 2, 1, 20])) {
  console.log(`  x=${f.x} pos=${f.pos} ${f.pushed ? "push" : "replace"} tails=[${f.tails.join(",")}]`);
}
console.log("LIS length =", longestIncreasingSubsequence([3, 10, 2, 1, 20]));

console.log("\n=== naive DP 비용 폭발 (목표 복잡도 절 근거) ===");
const n1 = 100_000;
console.log(`N=${n1} 일 때 O(N^2) = ${(n1 * n1).toLocaleString()} 연산 (10^10 규모)`);
console.log(`N=${n1} 일 때 O(N log2 N) ≈ ${Math.round(n1 * Math.log2(n1)).toLocaleString()} 연산`);

console.log("\n=== '더 빠르게 만들 단서' — 선형 탐색 vs 이분 탐색 비교 횟수 ===");
console.log("대표 예시 비교 횟수: linear =", countLinear(rep).comparisons, " binary =", countBinary(rep).comparisons);

const ascending = Array.from({ length: 16 }, (_, i) => i + 1); // [1..16]
const linAsc = countLinear(ascending);
const binAsc = countBinary(ascending);
console.log(`오름차순 A=[1..16] (N=16): tails 항상 끝에 추가되는 최악 패턴`);
console.log(`  선형 탐색 총 비교 횟수 = ${linAsc.comparisons} (0+1+2+...+15 = ${(15 * 16) / 2})`);
console.log(`  이분 탐색 총 비교 횟수 = ${binAsc.comparisons}`);
console.log(`  tails 최종 길이 = ${linAsc.length} / ${binAsc.length}`);

{
  const prefix = Array.from({ length: 15 }, (_, i) => i + 1); // [1..15]
  const linBefore = countLinear(prefix).comparisons;
  const linAfter = countLinear([...prefix, 16]).comparisons;
  const binBefore = countBinary(prefix).comparisons;
  const binAfter = countBinary([...prefix, 16]).comparisons;
  console.log(
    `  tails 길이 15에서 새 최댓값(16) 삽입 1회: 선형 비교=${linAfter - linBefore}, 이분 비교=${binAfter - binBefore}`,
  );
}

console.log("\n=== 함정 1: hi 초기화를 len(tails)-1로 하면? (구체 오답) ===");
function longestIncreasingSubsequenceBuggyHi(A: number[]): number {
  const tails: number[] = [];
  for (const x of A) {
    let lo = 0;
    let hi = Math.max(0, tails.length - 1); // 버그: len(tails)이 아니라 len(tails)-1
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    // hi가 애초에 tails.length-1로 묶여 있으므로 lo는 tails.length에 절대 도달하지 못한다.
    // → pos == len(tails) 케이스(새 최댓값 push)가 영영 발동하지 않는다.
    if (tails.length === 0) tails.push(x);
    else tails[lo] = x; // 항상 갱신만 하고, push는 일어나지 않음
  }
  return tails.length;
}
console.log(
  "오름차순 [1,2,3,4,5] 정상:",
  longestIncreasingSubsequence([1, 2, 3, 4, 5]),
  " / hi=len-1 버그:",
  longestIncreasingSubsequenceBuggyHi([1, 2, 3, 4, 5]),
);
console.log(
  "대표예시 정상:",
  longestIncreasingSubsequence(rep),
  " / hi=len-1 버그:",
  longestIncreasingSubsequenceBuggyHi(rep),
);

console.log("\n=== 함정 2: lower bound 대신 upper bound를 쓰면? (구체 오답) ===");
function nonDecreasingLIS(A: number[]): number {
  // upper bound(<=)를 쓰면 "같은 값도 이어붙임" → 비감소(non-decreasing) LIS가 된다
  const tails: number[] = [];
  for (const x of A) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] <= x) lo = mid + 1; // <= 로 바뀜: upper bound
      else hi = mid;
    }
    if (lo === tails.length) tails.push(x);
    else tails[lo] = x;
  }
  return tails.length;
}
console.log(
  "[3,3,3] 엄격 증가(lower bound, 정상):",
  longestIncreasingSubsequence([3, 3, 3]),
  " / upper bound 오적용(비감소로 새어버림):",
  nonDecreasingLIS([3, 3, 3]),
);

console.log("\n=== 무작위 교차검증 (dp vs linear vs binary, 500회) ===");
function randArr(n: number, lo: number, hi: number): number[] {
  return Array.from({ length: n }, () => lo + Math.floor(Math.random() * (hi - lo + 1)));
}
let allMatch = true;
for (let t = 0; t < 500; t++) {
  const n = 1 + Math.floor(Math.random() * 25);
  const A = randArr(n, -5, 5);
  const dp = longestIncreasingSubsequenceNaive(A);
  const lin = longestIncreasingSubsequenceLinear(A);
  const bin = longestIncreasingSubsequence(A);
  if (dp !== lin || dp !== bin) {
    allMatch = false;
    console.log("MISMATCH", JSON.stringify(A), { dp, lin, bin });
  }
}
console.log(allMatch ? "500회 무작위 교차검증 전부 일치 OK" : "불일치 발견!!");
