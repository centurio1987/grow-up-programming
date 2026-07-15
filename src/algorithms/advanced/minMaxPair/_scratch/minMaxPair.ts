// E3 자기검증 스크래치 — 가이드 본문 코드 그대로 추출 + 계측(comparison count) 버전

// ── 출발점: naive 두 번 스캔 ──────────────────────────────
function minMaxPairNaive(arr: number[]): { min: number; max: number } {
  let minVal = arr[0]!;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i]! < minVal) minVal = arr[i]!;
  }
  let maxVal = arr[0]!;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i]! > maxVal) maxVal = arr[i]!;
  }
  return { min: minVal, max: maxVal };
}

// 계측판: naive 비교 횟수 세기
function minMaxPairNaiveCounted(arr: number[]): {
  min: number;
  max: number;
  comparisons: number;
} {
  let comparisons = 0;
  let minVal = arr[0]!;
  for (let i = 1; i < arr.length; i++) {
    comparisons++;
    if (arr[i]! < minVal) minVal = arr[i]!;
  }
  let maxVal = arr[0]!;
  for (let i = 1; i < arr.length; i++) {
    comparisons++;
    if (arr[i]! > maxVal) maxVal = arr[i]!;
  }
  return { min: minVal, max: maxVal, comparisons };
}

// ── 아이디어를 코드로 옮기기: 분할 정복 재귀 버전(기본 구현) ──
function minMaxPairRecursive(arr: number[]): { min: number; max: number } {
  function solve(lo: number, hi: number): { min: number; max: number } {
    if (lo === hi) {
      return { min: arr[lo]!, max: arr[lo]! };
    }
    if (lo + 1 === hi) {
      return arr[lo]! <= arr[hi]!
        ? { min: arr[lo]!, max: arr[hi]! }
        : { min: arr[hi]!, max: arr[lo]! };
    }
    const mid = Math.floor((lo + hi) / 2);
    const left = solve(lo, mid);
    const right = solve(mid + 1, hi);
    return {
      min: Math.min(left.min, right.min),
      max: Math.max(left.max, right.max),
    };
  }
  return solve(0, arr.length - 1);
}

// 계측판: 분할 정복 비교 횟수 세기
function minMaxPairRecursiveCounted(arr: number[]): {
  min: number;
  max: number;
  comparisons: number;
} {
  let comparisons = 0;
  function solve(lo: number, hi: number): { min: number; max: number } {
    if (lo === hi) {
      return { min: arr[lo]!, max: arr[lo]! };
    }
    if (lo + 1 === hi) {
      comparisons++;
      return arr[lo]! <= arr[hi]!
        ? { min: arr[lo]!, max: arr[hi]! }
        : { min: arr[hi]!, max: arr[lo]! };
    }
    const mid = Math.floor((lo + hi) / 2);
    const left = solve(lo, mid);
    const right = solve(mid + 1, hi);
    comparisons += 2;
    return {
      min: Math.min(left.min, right.min),
      max: Math.max(left.max, right.max),
    };
  }
  const result = solve(0, arr.length - 1);
  return { ...result, comparisons };
}

// ── 최적화 코드: 반복문 pairwise 버전(최종) ──────────────
function minMaxPair(arr: number[]): { min: number; max: number } {
  const n = arr.length;
  let i = 0;
  let min: number;
  let max: number;

  if (n % 2 === 1) {
    min = max = arr[0]!;
    i = 1;
  } else {
    if (arr[0]! <= arr[1]!) {
      min = arr[0]!;
      max = arr[1]!;
    } else {
      min = arr[1]!;
      max = arr[0]!;
    }
    i = 2;
  }

  while (i < n) {
    const a = arr[i]!;
    const b = arr[i + 1]!;
    if (a <= b) {
      if (a < min) min = a;
      if (b > max) max = b;
    } else {
      if (b < min) min = b;
      if (a > max) max = a;
    }
    i += 2;
  }

  return { min, max };
}

// 계측판: 반복문 비교 횟수 세기
function minMaxPairCounted(arr: number[]): {
  min: number;
  max: number;
  comparisons: number;
} {
  let comparisons = 0;
  const n = arr.length;
  let i = 0;
  let min: number;
  let max: number;

  if (n % 2 === 1) {
    min = max = arr[0]!;
    i = 1;
  } else {
    comparisons++;
    if (arr[0]! <= arr[1]!) {
      min = arr[0]!;
      max = arr[1]!;
    } else {
      min = arr[1]!;
      max = arr[0]!;
    }
    i = 2;
  }

  while (i < n) {
    const a = arr[i]!;
    const b = arr[i + 1]!;
    comparisons++;
    if (a <= b) {
      comparisons++;
      if (a < min) min = a;
      comparisons++;
      if (b > max) max = b;
    } else {
      comparisons++;
      if (b < min) min = b;
      comparisons++;
      if (a > max) max = a;
    }
    i += 2;
  }

  return { min, max, comparisons };
}

// ── 검증 ────────────────────────────────────────────────

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${label}: got ${a}, expected ${e}`);
    process.exitCode = 1;
  } else {
    console.log(`ok   ${label}: ${a}`);
  }
}

console.log("=== 대표 예시: sim 입력 [3,1,4,2] ===");
assertEqual(minMaxPair([3, 1, 4, 2]), { min: 1, max: 4 }, "iterative [3,1,4,2]");
assertEqual(minMaxPairRecursive([3, 1, 4, 2]), { min: 1, max: 4 }, "recursive [3,1,4,2]");
assertEqual(minMaxPairNaive([3, 1, 4, 2]), { min: 1, max: 4 }, "naive [3,1,4,2]");

console.log("\n=== 문제 예시 (minMaxPair-problem.md) ===");
assertEqual(minMaxPair([3, 1, 4, 1, 5, 9, 2, 6]), { min: 1, max: 9 }, "iterative ex1");
assertEqual(minMaxPair([1, 2, 3, 4, 5]), { min: 1, max: 5 }, "iterative ex2");
assertEqual(minMaxPair([5, 4, 3, 2, 1]), { min: 1, max: 5 }, "iterative ex3");
assertEqual(minMaxPair([7]), { min: 7, max: 7 }, "iterative n=1");
assertEqual(minMaxPair([5, 5, 5, 5]), { min: 5, max: 5 }, "iterative all-equal");
assertEqual(minMaxPair([-3, -1, -4, -1, -5]), { min: -5, max: -1 }, "iterative negatives");
assertEqual(minMaxPair([-10, 0, 10]), { min: -10, max: 10 }, "iterative mixed");

console.log("\n=== 엣지: n=2 ===");
assertEqual(minMaxPair([9, 2]), { min: 2, max: 9 }, "iterative n=2 desc");
assertEqual(minMaxPairRecursive([9, 2]), { min: 2, max: 9 }, "recursive n=2 desc");
assertEqual(minMaxPair([2, 9]), { min: 2, max: 9 }, "iterative n=2 asc");

console.log("\n=== 비교 횟수 계측 (naive vs 분할정복 vs 반복문) ===");
for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 10, 16, 17]) {
  const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 100) - 50);
  const naive = minMaxPairNaiveCounted(arr);
  const rec = minMaxPairRecursiveCounted(arr);
  const iter = minMaxPairCounted(arr);
  const lowerBound = Math.ceil((3 * n) / 2) - 2;
  const naiveExpected = n === 1 ? 0 : 2 * (n - 1);
  console.log(
    `n=${n.toString().padStart(2)}  naive=${naive.comparisons.toString().padStart(3)} (기대 ${naiveExpected})  ` +
      `recursive=${rec.comparisons.toString().padStart(3)}  iterative=${iter.comparisons.toString().padStart(3)}  ` +
      `lowerBound(⌈3n/2⌉-2)=${lowerBound}`,
  );
  if (naive.comparisons !== naiveExpected) {
    console.error(`  FAIL naive comparisons mismatch at n=${n}`);
    process.exitCode = 1;
  }
  if (rec.comparisons > lowerBound) {
    console.log(`  참고: 균등분할 재귀는 n=${n}에서 하한보다 ${rec.comparisons - lowerBound}회 더 비교함(의도된 관찰, 실패 아님)`);
  }
  if (iter.comparisons !== lowerBound && n > 1) {
    console.error(`  FAIL iterative comparisons != lowerBound at n=${n} (got ${iter.comparisons})`);
    process.exitCode = 1;
  }
  // 정확성도 함께 확인
  const expected = { min: Math.min(...arr), max: Math.max(...arr) };
  assertEqual({ min: naive.min, max: naive.max }, expected, `naive n=${n}`);
  assertEqual({ min: rec.min, max: rec.max }, expected, `recursive n=${n}`);
  assertEqual({ min: iter.min, max: iter.max }, expected, `iterative n=${n}`);
}

console.log("\n=== 무작위 교차검증 (n=1..200, 30회) ===");
for (let t = 0; t < 30; t++) {
  const n = 1 + Math.floor(Math.random() * 200);
  const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 2000) - 1000);
  const expected = { min: Math.min(...arr), max: Math.max(...arr) };
  assertEqual(minMaxPair(arr), expected, `random iterative n=${n}`);
  assertEqual(minMaxPairRecursive(arr), expected, `random recursive n=${n}`);
  assertEqual(minMaxPairNaive(arr), expected, `random naive n=${n}`);
}

console.log("\n=== n=4 상세 (시뮬레이션 [3,1,4,2] 프레임 교차검증) ===");
{
  const arr = [3, 1, 4, 2];
  const left = arr[0]! <= arr[1]! ? { min: arr[0]!, max: arr[1]! } : { min: arr[1]!, max: arr[0]! };
  const right = arr[2]! <= arr[3]! ? { min: arr[2]!, max: arr[3]! } : { min: arr[3]!, max: arr[2]! };
  console.log(`left(=[3,1])  = ${JSON.stringify(left)}`);
  console.log(`right(=[4,2]) = ${JSON.stringify(right)}`);
  const merged = { min: Math.min(left.min, right.min), max: Math.max(left.max, right.max) };
  console.log(`merge min(${left.min},${right.min})=${merged.min}, max(${left.max},${right.max})=${merged.max}`);
  assertEqual(left, { min: 1, max: 3 }, "sim left frame");
  assertEqual(right, { min: 2, max: 4 }, "sim right frame");
  assertEqual(merged, { min: 1, max: 4 }, "sim final frame");
}

console.log("\n=== 기저 케이스(size 2) 생략 시 비교 횟수 = naive와 정확히 동일(2n-2) ===");
function solveNoBase2(arr: number[], lo: number, hi: number, cnt: { c: number }): { min: number; max: number } {
  if (lo === hi) return { min: arr[lo]!, max: arr[lo]! };
  const mid = Math.floor((lo + hi) / 2);
  const left = solveNoBase2(arr, lo, mid, cnt);
  const right = solveNoBase2(arr, mid + 1, hi, cnt);
  cnt.c += 2;
  return { min: Math.min(left.min, right.min), max: Math.max(left.max, right.max) };
}
for (const n of [2, 4, 6, 8, 16, 100]) {
  const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 100));
  const cnt = { c: 0 };
  solveNoBase2(arr, 0, n - 1, cnt);
  const naiveExpected = 2 * n - 2;
  console.log(`n=${n}: base2 생략 시 비교=${cnt.c}회, naive(2n-2)=${naiveExpected}회`);
  if (cnt.c !== naiveExpected) {
    console.error(`  FAIL base2 생략 비교 횟수가 naive와 다름 at n=${n}`);
    process.exitCode = 1;
  }
}

console.log("\n=== 스스로 점검하기 1번: arr=[7,2,9,4,1,6] 반복문 버전 손 검산 ===");
{
  const arr = [7, 2, 9, 4, 1, 6];
  const result = minMaxPair(arr);
  console.log(`minMaxPair([7,2,9,4,1,6]) = ${JSON.stringify(result)}`);
  assertEqual(result, { min: 1, max: 9 }, "점검문제 1번 답");
}

console.log("\n=== 3.2 절 예시: arr=[3,1,4,2] 재귀 비교 횟수 = 4 (이론적 하한과 일치) ===");
{
  const arr = [3, 1, 4, 2];
  const cnt = { c: 0 };
  function solveCounted(lo: number, hi: number): { min: number; max: number } {
    if (lo === hi) return { min: arr[lo]!, max: arr[lo]! };
    if (lo + 1 === hi) {
      cnt.c++;
      return arr[lo]! <= arr[hi]! ? { min: arr[lo]!, max: arr[hi]! } : { min: arr[hi]!, max: arr[lo]! };
    }
    const mid = Math.floor((lo + hi) / 2);
    const left = solveCounted(lo, mid);
    const right = solveCounted(mid + 1, hi);
    cnt.c += 2;
    return { min: Math.min(left.min, right.min), max: Math.max(left.max, right.max) };
  }
  const r = solveCounted(0, 3);
  console.log(`solve([3,1,4,2]) 비교 횟수=${cnt.c}, 결과=${JSON.stringify(r)}`);
  if (cnt.c !== 4) {
    console.error("  FAIL [3,1,4,2] 비교 횟수가 4가 아님");
    process.exitCode = 1;
  }
}

console.log(process.exitCode ? "\n일부 검증 실패" : "\n모든 검증 통과");
