// E3 자기검증용 스크래치 — expectedValueDp-guide.new.mdx 본문 코드를 그대로 추출.
// 실행: bun src/algorithms/dp/expectedValueDp/_scratch/expectedValueDp.ts

// --- 출발점: 브루트포스 ---
function expectedValueDpBruteForce(N: number, K: number): number {
  let count = 0;
  const total = 6 ** N;
  function go(i: number, sum: number) {
    if (i === N) {
      if (sum >= K) count++;
      return;
    }
    for (let d = 1; d <= 6; d++) go(i + 1, sum + d);
  }
  go(0, 0);
  return count / total;
}

// --- 아이디어를 코드로 옮기기: 기본 2D DP ---
function expectedValueDpBasic(N: number, K: number): number {
  const maxSum = 6 * N;
  const p: number[][] = Array.from({ length: N + 1 }, () => new Array(maxSum + 1).fill(0));
  p[0][0] = 1;

  for (let i = 1; i <= N; i++) {
    for (let s = 1; s <= maxSum; s++) {
      let sum = 0;
      for (let d = 1; d <= 6; d++) {
        if (s - d >= 0) sum += p[i - 1][s - d];
      }
      p[i][s] = sum / 6;
    }
  }

  let result = 0;
  for (let s = K; s <= maxSum; s++) result += p[N][s];
  return result;
}

// --- 최적화 코드: 롤링 배열 ---
function expectedValueDp(N: number, K: number): number {
  const maxSum = 6 * N;
  let prev = new Array(maxSum + 1).fill(0);
  prev[0] = 1;

  for (let i = 1; i <= N; i++) {
    const curr = new Array(maxSum + 1).fill(0);
    for (let s = 1; s <= maxSum; s++) {
      let sum = 0;
      for (let d = 1; d <= 6; d++) {
        if (s - d >= 0) sum += prev[s - d];
      }
      curr[s] = sum / 6;
    }
    prev = curr;
  }

  let result = 0;
  for (let s = K; s <= maxSum; s++) result += prev[s];
  return result;
}

// --- 헷갈리기 쉬운 포인트 재현: 제자리(in-place) 갱신 버그 ---
function expectedValueDpBuggyInPlace(N: number, K: number): number {
  const maxSum = 6 * N;
  const p = new Array(maxSum + 1).fill(0);
  p[0] = 1;
  for (let i = 1; i <= N; i++) {
    for (let s = 1; s <= maxSum; s++) {
      let sum = 0;
      for (let d = 1; d <= 6; d++) {
        if (s - d >= 0) sum += p[s - d]; // 버그: 같은 배열을 읽고 쓴다
      }
      p[s] = sum / 6;
    }
  }
  let result = 0;
  for (let s = K; s <= maxSum; s++) result += p[s];
  return result;
}

function approxEqual(a: number, b: number, eps = 1e-9): boolean {
  return Math.abs(a - b) < eps;
}

let failures = 0;
function check(label: string, actual: number, expected: number, eps = 1e-6) {
  const ok = approxEqual(actual, expected, eps);
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: actual=${actual} expected≈${expected}`);
  if (!ok) failures++;
}

console.log("=== 본문 명시 수치 검증 ===");
check("brute(2,10)", expectedValueDpBruteForce(2, 10), 0.166667, 1e-5);
check("basic(1,1)", expectedValueDpBasic(1, 1), 1.0);
check("basic(1,4)>=0.5", expectedValueDpBasic(1, 4), 0.5);
check("optimized(2,10)", expectedValueDp(2, 10), 6 / 36);
check("optimized(2,12)", expectedValueDp(2, 12), 1 / 36);
check("optimized(2,7)", expectedValueDp(2, 7), 21 / 36);
check("optimized(1,1)", expectedValueDp(1, 1), 1.0);
check("optimized(1,7)", expectedValueDp(1, 7), 0.0);
check("optimized(1,4)", expectedValueDp(1, 4), 0.5);
check("optimized(2,5) 점검문제1", expectedValueDp(2, 5), 30 / 36);

console.log("\n=== 버그 재현 (본문 서술과 일치해야 함) ===");
const buggy11 = expectedValueDpBuggyInPlace(1, 1);
console.log(`buggy(1,1) = ${buggy11} (본문 서술: 1.521626)`);
if (!approxEqual(buggy11, 1.521626, 1e-5)) { console.error("FAIL: 버그 수치 불일치"); failures++; }

const buggy210 = expectedValueDpBuggyInPlace(2, 10);
console.log(`buggy(2,10) = ${buggy210} (본문 서술: 0.873512)`);
if (!approxEqual(buggy210, 0.873512, 1e-5)) { console.error("FAIL: 버그 수치 불일치"); failures++; }

console.log("\n=== 대표 + 엣지 ===");
check("N=1000,K=0 (≈1.0)", expectedValueDp(1000, 0), 1.0, 1e-6);
check("N=1000,K=1 (≈1.0)", expectedValueDp(1000, 1), 1.0, 1e-6);
console.log(`N=1000,K=6000 (부동소수점 하한 아래로 0) = ${expectedValueDp(1000, 6000)}`);

console.log("\n=== 무작위 교차검증 (brute vs optimized, N<=5) ===");
for (let t = 0; t < 30; t++) {
  const N = 1 + Math.floor(Math.random() * 5);
  const K = Math.floor(Math.random() * (6 * N + 2));
  const b = expectedValueDpBruteForce(N, K);
  const r = expectedValueDp(N, K);
  const ok = approxEqual(b, r, 1e-9);
  if (!ok) {
    console.error(`MISMATCH N=${N} K=${K} brute=${b} optimized=${r}`);
    failures++;
  }
}
console.log("무작위 교차검증 30회 완료.");

console.log("\n=== basic vs optimized 일치 (N<=8) ===");
for (let N = 1; N <= 8; N++) {
  for (let K = 0; K <= 6 * N; K += 3) {
    const a = expectedValueDpBasic(N, K);
    const b = expectedValueDp(N, K);
    if (!approxEqual(a, b, 1e-9)) {
      console.error(`MISMATCH basic/optimized N=${N} K=${K} basic=${a} optimized=${b}`);
      failures++;
    }
  }
}
console.log("basic/optimized 일치 검증 완료.");

console.log(failures === 0 ? "\n✅ 모든 검증 통과" : `\n❌ ${failures}건 실패`);
process.exit(failures === 0 ? 0 : 1);
