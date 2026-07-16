// E3 자기검증 스크래치 — 가이드 본문 코드 실측용 (학습자 실습 파일과 무관)

// ── 원형: 전수 탐색 ──────────────────────────────────────────
function subsetSumNaive(nums: number[], target: number): boolean {
  const n = nums.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    let s = 0;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) s += nums[i]!;
    }
    if (s === target) return true;
  }
  return false;
}

// ── 개선: 절반으로 나눈 뒤 중첩 루프로 짝 확인 ──────────────────
function enumerateSums(arr: number[]): number[] {
  const m = arr.length;
  const sums: number[] = [];
  for (let mask = 0; mask < 1 << m; mask++) {
    let s = 0;
    for (let i = 0; i < m; i++) {
      if ((mask >> i) & 1) s += arr[i]!;
    }
    sums.push(s);
  }
  return sums;
}

function subsetSumSplitNestedLoop(nums: number[], target: number): boolean {
  const n = nums.length;
  const mid = Math.floor(n / 2);
  const L = nums.slice(0, mid);
  const R = nums.slice(mid);
  const leftSums = enumerateSums(L);
  const rightSums = enumerateSums(R);
  for (const sL of leftSums) {
    for (const sR of rightSums) {
      if (sL + sR === target) return true;
    }
  }
  return false;
}

// ── 최종: 절반 + 정렬 + 이진 탐색 ────────────────────────────
function binarySearchExists(sortedArr: number[], value: number): boolean {
  let lo = 0;
  let hi = sortedArr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const v = sortedArr[mid]!;
    if (v === value) return true;
    if (v < value) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}

function meetInTheMiddleSubsetSum(nums: number[], target: number): boolean {
  const n = nums.length;
  const mid = Math.floor(n / 2);
  const L = nums.slice(0, mid);
  const R = nums.slice(mid);

  const leftSums = enumerateSums(L);
  const rightSums = enumerateSums(R);
  rightSums.sort((a, b) => a - b);

  for (const sL of leftSums) {
    const need = target - sL;
    if (binarySearchExists(rightSums, need)) return true;
  }
  return false;
}

// ── 검증 1: 대표 예시 (nums=[3,5,1,2], target=8) ─────────────
console.log("=== 대표 예시 nums=[3,5,1,2], target=8 ===");
{
  const nums = [3, 5, 1, 2];
  const target = 8;
  const mid = Math.floor(nums.length / 2);
  const L = nums.slice(0, mid);
  const R = nums.slice(mid);
  const leftSums = enumerateSums(L);
  const rightSums = enumerateSums(R).sort((a, b) => a - b);
  console.log("L/R:", L, R);
  console.log("leftSums:", leftSums);
  console.log("rightSums(sorted):", rightSums);
  for (const sL of leftSums) {
    const need = target - sL;
    console.log(`sL=${sL} need=${need} found=${binarySearchExists(rightSums, need)}`);
  }
  console.log("naive:", subsetSumNaive(nums, target));
  console.log("splitNestedLoop:", subsetSumSplitNestedLoop(nums, target));
  console.log("final:", meetInTheMiddleSubsetSum(nums, target));
}

// ── 검증 2: problem.md 예시 전수 ──────────────────────────────
console.log("\n=== problem.md 예시 ===");
const cases: [number[], number, boolean][] = [
  [[1, 2, 3], 5, true],
  [[1, 2, 3], 7, false],
  [[1, 2, 3], 0, true],
  [[-3, -1, 2, 5], 4, true],
  [[], 0, true],
  [[], 5, false],
  [[7], 7, true],
  [[7], 5, false],
  [[-5, 3, 1], -4, true],
];
for (const [nums, target, expected] of cases) {
  const naive = subsetSumNaive(nums, target);
  const nested = subsetSumSplitNestedLoop(nums, target);
  const final = meetInTheMiddleSubsetSum(nums, target);
  const ok = naive === expected && nested === expected && final === expected;
  console.log(
    `nums=${JSON.stringify(nums)} target=${target} expected=${expected} naive=${naive} nested=${nested} final=${final} ${ok ? "OK" : "MISMATCH"}`,
  );
}

// ── 검증 3: 무작위 교차검증 (naive vs final vs nested) ─────────
console.log("\n=== 무작위 교차검증 (n<=14) ===");
function randInt(lo: number, hi: number) {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}
let mismatches = 0;
for (let t = 0; t < 300; t++) {
  const n = randInt(0, 14);
  const nums = Array.from({ length: n }, () => randInt(-8, 8));
  // target: 무작위 부분집합 합 근처로 샘플링해 true/false 케이스를 골고루 만든다
  const target = randInt(-8 * n, 8 * n);
  const a = subsetSumNaive(nums, target);
  const b = subsetSumSplitNestedLoop(nums, target);
  const c = meetInTheMiddleSubsetSum(nums, target);
  if (a !== b || b !== c) {
    mismatches++;
    console.log("MISMATCH", { nums, target, a, b, c });
  }
}
console.log(`무작위 ${300}건 중 불일치 ${mismatches}건`);

// ── 검증 4: 엣지 케이스 ────────────────────────────────────────
console.log("\n=== 엣지 케이스 ===");
console.log("빈 배열, target=0:", meetInTheMiddleSubsetSum([], 0)); // true
console.log("빈 배열, target=5:", meetInTheMiddleSubsetSum([], 5)); // false
console.log("전부 양수, target 음수:", meetInTheMiddleSubsetSum([1, 2, 3], -1)); // false
console.log("n=1, 정확히 일치:", meetInTheMiddleSubsetSum([9], 9)); // true
console.log("n=1, 불일치:", meetInTheMiddleSubsetSum([9], 3)); // false

// ── 검증 5: 정렬을 빠뜨리면 이진 탐색이 조용히 틀리는 예 ────────
console.log("\n=== 함정: 정렬 없이 이진 탐색 ===");
{
  const R = [5, -3];
  const rightSumsUnsorted = enumerateSums(R); // mask 순서 그대로, 정렬 X
  console.log("rightSums (정렬 전, mask 순서):", rightSumsUnsorted);
  console.log("binarySearchExists(unsorted, -3):", binarySearchExists(rightSumsUnsorted, -3), "← 실제로는 -3이 배열 안에 있는데도");
  const rightSumsSorted = [...rightSumsUnsorted].sort((a, b) => a - b);
  console.log("rightSums (정렬 후):", rightSumsSorted);
  console.log("binarySearchExists(sorted, -3):", binarySearchExists(rightSumsSorted, -3));
}

// ── 검증 6: mask=0(공집합)을 빠뜨리면 생기는 오답 ────────────────
console.log("\n=== 함정: 공집합 열거 누락 ===");
{
  const nums = [5];
  const target = 0;
  // 정상: mask 0..2^1-1 = 0,1 모두 순회 (공집합 포함)
  console.log("정상(공집합 포함):", meetInTheMiddleSubsetSum(nums, target)); // true
  // 결함 버전: mask를 1부터 시작 (공집합 누락)
  function buggyEnumerateSums(arr: number[]): number[] {
    const m = arr.length;
    const sums: number[] = [];
    for (let mask = 1; mask < 1 << m; mask++) { // ← 0 대신 1부터 시작
      let s = 0;
      for (let i = 0; i < m; i++) {
        if ((mask >> i) & 1) s += arr[i]!;
      }
      sums.push(s);
    }
    return sums;
  }
  const mid = Math.floor(nums.length / 2);
  const L = nums.slice(0, mid);
  const Rr = nums.slice(mid);
  const buggyLeft = mid === 0 ? [0] : buggyEnumerateSums(L); // L이 비어있으면 그대로 [0]
  const buggyRight = buggyEnumerateSums(Rr).sort((a, b) => a - b);
  console.log("buggyLeft:", buggyLeft, "buggyRight:", buggyRight);
  let buggyResult = false;
  for (const sL of buggyLeft) {
    if (binarySearchExists(buggyRight, target - sL)) buggyResult = true;
  }
  console.log("결함 버전 결과 (기대값 true인데):", buggyResult);
}

// ── 성능 목표 예측에 쓰인 수치 재확인 ──────────────────────────
console.log("\n=== 복잡도 수치 재확인 (n=40) ===");
const n = 40;
const naiveOps = n * 2 ** n;
const nestedOps = 2 ** n;
const finalOps = 2 ** (n / 2) * (n / 2);
console.log("naive n*2^n =", naiveOps.toExponential(3));
console.log("nested 2^n =", nestedOps.toExponential(3));
console.log("final 2^(n/2)*(n/2) =", finalOps.toExponential(3));
