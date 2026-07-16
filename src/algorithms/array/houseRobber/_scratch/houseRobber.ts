// E3 자기 검증 스크래치 — 가이드 본문에서 추출한 세 버전을 실측 검증한다.
// (naive 완전탐색 bitmask, 기본 dp 배열, 최적화 롤링)

function houseRobberNaive(nums: number[]): number {
  const n = nums.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let valid = true;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) === 0) continue;
      if (i > 0 && mask & (1 << (i - 1))) {
        valid = false;
        break;
      }
      sum += nums[i]!;
    }
    if (valid) best = Math.max(best, sum);
  }
  return best;
}

function houseRobberDp(nums: number[]): number {
  const n = nums.length;
  if (n === 0) return 0;
  if (n === 1) return nums[0]!;

  const dp = new Array<number>(n);
  dp[0] = nums[0]!;
  dp[1] = Math.max(nums[0]!, nums[1]!);

  for (let i = 2; i < n; i++) {
    dp[i] = Math.max(dp[i - 1]!, dp[i - 2]! + nums[i]!);
  }

  return dp[n - 1]!;
}

function houseRobber(nums: number[]): number {
  const n = nums.length;
  if (n === 0) return 0;
  if (n === 1) return nums[0]!;

  let prev2 = nums[0]!;
  let prev1 = Math.max(nums[0]!, nums[1]!);

  for (let i = 2; i < n; i++) {
    const curr = Math.max(prev1, prev2 + nums[i]!);
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
}

// --- problem.md 예시 전수 검증 ---
const cases: [number[], number][] = [
  [[1, 2, 3, 1], 4],
  [[2, 7, 9, 3, 1], 12],
  [[2, 1, 1, 2], 4],
  [[], 0],
  [[0, 0, 0], 0],
  [[5], 5],
  [[2, 7], 7],
  [[10000, 1, 10000], 20000],
];

let allOk = true;
for (const [nums, expected] of cases) {
  const naive = nums.length <= 20 ? houseRobberNaive(nums) : NaN;
  const dp = houseRobberDp(nums);
  const rolling = houseRobber(nums);
  const ok = dp === expected && rolling === expected && (Number.isNaN(naive) || naive === expected);
  allOk = allOk && ok;
  console.log(
    `nums=${JSON.stringify(nums)} expected=${expected} naive=${naive} dp=${dp} rolling=${rolling} -> ${ok ? "OK" : "MISMATCH"}`,
  );
}

// --- 시뮬 입력 프레임 값 대조 ---
const simNums = [2, 7, 9, 3, 1];
{
  const n = simNums.length;
  let prev2 = simNums[0]!;
  let prev1 = Math.max(simNums[0]!, simNums[1]!);
  console.log(`sim frame1: prev2=${prev2} prev1=${prev1} (기대 2, 7)`);
  const frames: number[] = [];
  for (let i = 2; i < n; i++) {
    const curr = Math.max(prev1, prev2 + simNums[i]!);
    frames.push(curr);
    prev2 = prev1;
    prev1 = curr;
  }
  console.log(`sim curr frames (i=2,3,4): ${JSON.stringify(frames)} (기대 [11, 11, 12])`);
  console.log(`sim final prev1: ${prev1} (기대 12)`);
}

// --- 완전탐색 vs 롤링 무작위 교차검증 (N<=16) ---
let randomOk = true;
for (let t = 0; t < 200; t++) {
  const n = Math.floor(Math.random() * 12);
  const nums = Array.from({ length: n }, () => Math.floor(Math.random() * 50));
  const a = houseRobberNaive(nums);
  const b = houseRobberDp(nums);
  const c = houseRobber(nums);
  if (a !== b || b !== c) {
    randomOk = false;
    console.log(`MISMATCH random: nums=${JSON.stringify(nums)} naive=${a} dp=${b} rolling=${c}`);
  }
}
console.log(`random cross-check (200 trials, N<=11): ${randomOk ? "ALL OK" : "FAILED"}`);

// --- 버그 시나리오(순서 뒤바뀜) 재현: 최적화 코드 절 함정 포인팅용 수치 확인 ---
{
  const nums = [2, 7, 9, 3, 1];
  let prev2 = nums[0]!;
  let prev1 = Math.max(nums[0]!, nums[1]!);
  const buggyTrace: number[] = [];
  for (let i = 2; i < nums.length; i++) {
    const curr = Math.max(prev1, prev2 + nums[i]!);
    // 버그: prev1을 먼저 덮어쓴 뒤 prev2에 대입 (prev2가 dp[i-1]이 아니라 dp[i]가 됨)
    prev1 = curr;
    prev2 = prev1;
    buggyTrace.push(curr);
  }
  console.log(`buggy-order trace (curr values): ${JSON.stringify(buggyTrace)} final(=prev1)=${prev1}`);
}

console.log(allOk ? "\n=== ALL EXAMPLE CASES OK ===" : "\n=== EXAMPLE MISMATCH FOUND ===");
if (!allOk) process.exit(1);
