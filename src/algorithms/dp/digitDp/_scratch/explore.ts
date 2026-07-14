// 탐색용 스크래치 — 실측 수치(호출 횟수 등)를 얻기 위한 계측 버전.
// 가이드 본문에는 이 파일의 로직을 그대로 옮기되 계측 코드는 뺀 버전을 싣는다.

function digitDpNaive(N: number, K: number): number {
  let count = 0;
  for (let x = 1; x <= N; x++) {
    let s = 0;
    let v = x;
    while (v > 0) {
      s += v % 10;
      v = Math.floor(v / 10);
    }
    if (s === K) count++;
  }
  return count;
}

function digitDpBasicInstrumented(N: number, K: number): { result: number; calls: number } {
  const digits = String(N).split("").map(Number);
  const L = digits.length;
  let calls = 0;

  function f(pos: number, sum: number, tight: boolean): number {
    calls++;
    if (sum > K) return 0;
    if (pos === L) return sum === K ? 1 : 0;

    const limit = tight ? digits[pos]! : 9;
    let result = 0;
    for (let x = 0; x <= limit; x++) {
      const newTight = tight && x === digits[pos]!;
      result += f(pos + 1, sum + x, newTight);
    }
    return result;
  }

  const total = f(0, 0, true);
  return { result: K === 0 ? total - 1 : total, calls };
}

function digitDpMemoInstrumented(N: number, K: number): { result: number; calls: number } {
  const digits = String(N).split("").map(Number);
  const L = digits.length;
  const memo: number[][][] = Array.from({ length: L }, () =>
    Array.from({ length: K + 1 }, () => [-1, -1]),
  );
  let calls = 0;

  function f(pos: number, sum: number, tight: boolean): number {
    calls++;
    if (sum > K) return 0;
    if (pos === L) return sum === K ? 1 : 0;

    const key = tight ? 1 : 0;
    if (memo[pos]![sum]![key] !== -1) return memo[pos]![sum]![key]!;

    const limit = tight ? digits[pos]! : 9;
    let result = 0;
    for (let x = 0; x <= limit; x++) {
      const newTight = tight && x === digits[pos]!;
      result += f(pos + 1, sum + x, newTight);
    }
    memo[pos]![sum]![key] = result;
    return result;
  }

  const total = f(0, 0, true);
  return { result: K === 0 ? total - 1 : total, calls };
}

// --- N=99, K=10 시뮬레이션 검증 ---
console.log("N=99,K=10 naive:", digitDpNaive(99, 10));
console.log("N=99,K=10 basic:", digitDpBasicInstrumented(99, 10));
console.log("N=99,K=10 memo :", digitDpMemoInstrumented(99, 10));

// --- N=999, K=15 (3자리) 호출 수 비교 ---
console.log("N=999,K=15 naive:", digitDpNaive(999, 15));
console.log("N=999,K=15 basic:", digitDpBasicInstrumented(999, 15));
console.log("N=999,K=15 memo :", digitDpMemoInstrumented(999, 15));

// --- N=9999, K=20 (4자리) 호출 수 비교 ---
console.log("N=9999,K=20 naive:", digitDpNaive(9999, 20));
console.log("N=9999,K=20 basic:", digitDpBasicInstrumented(9999, 20));
console.log("N=9999,K=20 memo :", digitDpMemoInstrumented(9999, 20));

// --- 예시 카탈로그 ---
console.log("digitDp(9,5) naive =", digitDpNaive(9, 5));
console.log("digitDp(100,1) naive =", digitDpNaive(100, 1));
console.log("digitDp(20,2) naive =", digitDpNaive(20, 2));
console.log("digitDp(99,18) naive =", digitDpNaive(99, 18));
console.log("digitDp(100,0) naive =", digitDpNaive(100, 0));
console.log("digitDp(9,9) naive =", digitDpNaive(9, 9));
console.log("digitDp(999,28) memo =", digitDpMemoInstrumented(999, 28));
console.log("digitDp(20,2) basic =", digitDpBasicInstrumented(20, 2));
console.log("digitDp(20,2) memo =", digitDpMemoInstrumented(20, 2));

// --- 큰 N: 10^15 은 naive/basic로 못 돌리므로 memo만 ---
console.log("digitDp(1e15,1) memo =", digitDpMemoInstrumented(1_000_000_000_000_000, 1));

// --- 무작위 교차검증 (naive vs memo), 작은 N만 ---
function randInt(max: number) {
  return Math.floor(Math.random() * max) + 1;
}
let mismatches = 0;
for (let i = 0; i < 200; i++) {
  const N = randInt(2000);
  const K = randInt(40);
  const a = digitDpNaive(N, K);
  const b = digitDpMemoInstrumented(N, K).result;
  if (a !== b) {
    mismatches++;
    console.log("MISMATCH", N, K, a, b);
  }
}
console.log("random cross-check mismatches:", mismatches);

// --- 고유 상태 수(메모 채움 횟수) 측정: N=999,K=15 ---
function digitDpMemoUniqueStates(N: number, K: number) {
  const digits = String(N).split("").map(Number);
  const L = digits.length;
  const memo: number[][][] = Array.from({ length: L }, () =>
    Array.from({ length: K + 1 }, () => [-1, -1]),
  );
  let filled = 0;
  function f(pos: number, sum: number, tight: boolean): number {
    if (sum > K) return 0;
    if (pos === L) return sum === K ? 1 : 0;
    const key = tight ? 1 : 0;
    if (memo[pos]![sum]![key] !== -1) return memo[pos]![sum]![key]!;
    const limit = tight ? digits[pos]! : 9;
    let result = 0;
    for (let x = 0; x <= limit; x++) {
      const newTight = tight && x === digits[pos]!;
      result += f(pos + 1, sum + x, newTight);
    }
    memo[pos]![sum]![key] = result;
    filled++;
    return result;
  }
  const total = f(0, 0, true);
  return { result: K === 0 ? total - 1 : total, filled, bound: L * (K + 1) * 2 };
}
console.log("N=999,K=15 unique states:", digitDpMemoUniqueStates(999, 15));
console.log("N=9999,K=20 unique states:", digitDpMemoUniqueStates(9999, 20));
