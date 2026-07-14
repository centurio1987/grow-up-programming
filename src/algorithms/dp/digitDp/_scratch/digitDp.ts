// 자기검증용 스크래치. 가이드 본문에 싣는 코드를 그대로 옮겨 실행/대조한다.
// 실행: bun src/algorithms/dp/digitDp/_scratch/digitDp.ts

// ---------- naive (출발점, 가이드 본문 그대로 추출) ----------
function digitDpNaive(N: number, K: number): number {
  let count = 0;
  for (let x = 1; x <= N; x++) {
    let s = 0;
    let v = x;
    while (v > 0) {
      s += v % 10; // 마지막 자리를 떼어내 더한다
      v = Math.floor(v / 10);
    }
    if (s === K) count++;
  }
  return count;
}

// ---------- 기본 구현 (4단계, 가이드 본문 그대로 추출): tight true/false 모두 메모이제이션 ----------
function digitDpBasic(N: number, K: number): number {
  const digits = N.toString().split("").map(Number);
  const L = digits.length;
  // memo[pos][sum][tight ? 1 : 0], -1 = 미계산
  const memo: number[][][] = Array.from({ length: L }, () =>
    Array.from({ length: K + 1 }, () => [-1, -1]),
  );

  function f(pos: number, sum: number, tight: boolean): number {
    if (sum > K) return 0;                       // 가지치기: 합이 이미 K를 넘었다
    if (pos === L) return sum === K ? 1 : 0;      // 기저: 모든 자리를 다 정했다

    const key = tight ? 1 : 0;
    const cached = memo[pos]![sum]![key];
    if (cached !== -1) return cached;

    const limit = tight ? digits[pos]! : 9;
    let result = 0;
    for (let x = 0; x <= limit; x++) {
      const newTight = tight && x === digits[pos];
      result += f(pos + 1, sum + x, newTight);
    }

    memo[pos]![sum]![key] = result;
    return result;
  }

  const total = f(0, 0, true);
  return K === 0 ? total - 1 : total; // 수 0 제외
}

// ---------- 최적화 구현 (7단계, 가이드 본문 그대로 추출): tight=false 상태만 메모이제이션 ----------
function digitDp(N: number, K: number): number {
  const digits = N.toString().split("").map(Number);
  const L = digits.length;
  // memo[pos][sum]: tight=false 상태 전용, -1 = 미계산
  const memo: number[][] = Array.from({ length: L }, () =>
    new Array(K + 1).fill(-1),
  );

  function f(pos: number, sum: number, tight: boolean): number {
    if (sum > K) return 0;
    if (pos === L) return sum === K ? 1 : 0;

    if (!tight) {
      const cached = memo[pos]![sum]!;
      if (cached !== -1) return cached; // tight=false일 때만 캐시 조회
    }

    const limit = tight ? digits[pos]! : 9;
    let result = 0;
    for (let x = 0; x <= limit; x++) {
      const newTight = tight && x === digits[pos];
      result += f(pos + 1, sum + x, newTight);
    }

    if (!tight) memo[pos]![sum] = result; // tight=false일 때만 캐시 저장
    return result;
  }

  const total = f(0, 0, true);
  return K === 0 ? total - 1 : total;
}

// ---------- 검증 ----------
function assertEq(label: string, actual: number, expected: number) {
  const ok = actual === expected;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: actual=${actual} expected=${expected}`);
  if (!ok) process.exitCode = 1;
}

console.log("=== 문제/구 가이드 예시 ===");
assertEq("digitDp(9,5)", digitDp(9, 5), 1);
assertEq("digitDp(100,1)", digitDp(100, 1), 3);
assertEq("digitDp(20,2)", digitDp(20, 2), 3);
assertEq("digitDp(99,18)", digitDp(99, 18), 1);
assertEq("digitDp(100,0)", digitDp(100, 0), 0);
assertEq("digitDp(9,9)", digitDp(9, 9), 1);
assertEq("digitDp(999,28)", digitDp(999, 28), 0);
assertEq("digitDp(1000000000000000,1)", digitDp(1_000_000_000_000_000, 1), 16);
assertEq("digitDp(99,10)", digitDp(99, 10), 9);

console.log("=== basic vs optimized vs naive 교차검증 (소규모 전수) ===");
for (let N = 1; N <= 200; N += 7) {
  for (let K = 0; K <= 30; K += 3) {
    const a = digitDpNaive(N, K);
    const b = digitDpBasic(N, K);
    const c = digitDp(N, K);
    if (a !== b || b !== c) {
      console.log(`FAIL cross N=${N} K=${K}: naive=${a} basic=${b} opt=${c}`);
      process.exitCode = 1;
    }
  }
}
console.log("OK   교차검증 루프 통과");

console.log("=== 무작위 교차검증 ===");
function rand(a: number, b: number) {
  return a + Math.floor(Math.random() * (b - a + 1));
}
let randFails = 0;
for (let i = 0; i < 300; i++) {
  const N = rand(1, 999999);
  const K = rand(0, 60);
  const a = digitDpNaive(N, K);
  const b = digitDpBasic(N, K);
  const c = digitDp(N, K);
  if (a !== b || b !== c) {
    console.log(`FAIL random N=${N} K=${K}: naive=${a} basic=${b} opt=${c}`);
    randFails++;
  }
}
console.log(randFails === 0 ? "OK   무작위 300건 통과" : `FAIL ${randFails}건 불일치`);

console.log("=== 큰 N (naive 불가 영역) basic vs optimized ===");
const bigCases: [number, number][] = [
  [1_000_000_000_000_000, 1],
  [1_000_000_000_000_000, 135],
  [999_999_999_999_999, 100],
  [123_456_789_012_345, 50],
];
for (const [N, K] of bigCases) {
  const b = digitDpBasic(N, K);
  const c = digitDp(N, K);
  assertEq(`big N=${N} K=${K}`, c, b);
}

console.log("=== 시뮬레이션 프레임 재현: N=99, K=10 (자리별 손 추적) ===");
{
  const N = 99;
  const K = 10;
  const digits = N.toString().split("").map(Number); // [9,9]
  console.log("digits =", digits);
  // pos=1 (마지막 자리, tight=false) memo: sum=0..10 각각 f(2,sum,false)
  const memoLast: number[] = [];
  for (let sum = 0; sum <= 10; sum++) {
    let cnt = 0;
    for (let x = 0; x <= 9; x++) {
      if (sum + x === K) cnt++;
    }
    memoLast.push(cnt);
  }
  console.log("memo[pos=1][sum=0..10] (tight=false) =", memoLast);
  // memoLast[sum]은 "첫 자리에서 이미 쌓인 합이 sum일 때, 마지막 자리로 K에 도달하는 방법 수".

  // 첫 자리 x=9 (tight 유지) -> 첫 자리 후 누적 합 = 9
  const contribX9 = memoLast[9]!;
  console.log("x=9 (tight) 기여 =", contribX9);

  // 첫 자리 x=1..8 (tight 해제) -> 첫 자리 후 누적 합 = x
  let sumFree = 0;
  for (let x = 1; x <= 8; x++) {
    sumFree += memoLast[x]!;
  }
  console.log("x=1..8 (free) 합산 기여 =", sumFree);

  // 첫 자리 x=0 -> 첫 자리 후 누적 합 = 0
  const contribX0 = memoLast[0]!;
  console.log("x=0 기여 =", contribX0);

  const total = contribX9 + sumFree + contribX0;
  console.log("총합 (K!=0이므로 -1 없음) =", total);
  assertEq("digitDp(99,10) 최종", digitDp(99, 10), total);
}
