// E3 자기검증용 스크래치. 가이드 본문 코드를 그대로 옮겨 실행/검증한다.

// --- 1. naive 재귀 (출발점 절) ---
function subsetSumNaive(nums: number[], target: number): boolean {
  function solve(index: number, remaining: number): boolean {
    if (remaining === 0) return true;
    if (index === nums.length || remaining < 0) return false;
    if (solve(index + 1, remaining - nums[index]!)) return true;
    return solve(index + 1, remaining);
  }
  return solve(0, target);
}

// --- 2. 2D 바텀업 DP (아이디어를 코드로 옮기기 절) ---
function subsetSum2D(nums: number[], target: number): boolean {
  const n = nums.length;
  const dp: boolean[][] = Array.from({ length: n + 1 }, () =>
    new Array<boolean>(target + 1).fill(false),
  );
  dp[0]![0] = true; // 원소를 하나도 안 쓴 빈 부분집합의 합은 0

  for (let i = 1; i <= n; i++) {
    const v = nums[i - 1]!;
    for (let x = 0; x <= target; x++) {
      dp[i]![x] = dp[i - 1]![x]! || (x >= v && dp[i - 1]![x - v]!);
    }
  }
  return dp[n]![target]!;
}

// --- 2D 트레이스 출력용 (표 채우기 검증) ---
function subsetSum2DTrace(nums: number[], target: number): boolean[][] {
  const n = nums.length;
  const dp: boolean[][] = Array.from({ length: n + 1 }, () =>
    new Array<boolean>(target + 1).fill(false),
  );
  dp[0]![0] = true;
  for (let i = 1; i <= n; i++) {
    const v = nums[i - 1]!;
    for (let x = 0; x <= target; x++) {
      dp[i]![x] = dp[i - 1]![x]! || (x >= v && dp[i - 1]![x - v]!);
    }
  }
  return dp;
}

// --- 3. 오름차순으로 잘못 구현한 1D (함정 시연용) ---
function subsetSumWrongAscending(nums: number[], target: number): boolean {
  const dp = new Array<boolean>(target + 1).fill(false);
  dp[0] = true;
  for (const v of nums) {
    if (v > target) continue;
    for (let x = v; x <= target; x++) {
      // 오름차순 — 같은 원소를 여러 번 쓰는 효과가 생긴다
      dp[x] = dp[x] || dp[x - v]!;
    }
  }
  return dp[target]!;
}

// --- 4. 최종 1D 롤링 DP (최적화 코드 절) ---
function subsetSum(nums: number[], target: number): boolean {
  const dp = new Array<boolean>(target + 1).fill(false);
  dp[0] = true;

  for (const v of nums) {
    if (v > target) continue; // 기여 불가능한 원소는 건너뜀
    for (let x = target; x >= v; x--) {
      dp[x] = dp[x] || dp[x - v]!;
    }
    if (dp[target]) return true; // 조기 종료
  }
  return dp[target]!;
}

// ================= 검증 =================
let fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    fail++;
    console.log(`FAIL ${name}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
  } else {
    console.log(`ok   ${name}: ${JSON.stringify(actual)}`);
  }
}

console.log("--- 대표 예시: nums=[3,1,4], target=4 (시뮬 트레이스) ---");
const trace = subsetSum2DTrace([3, 1, 4], 4);
for (let i = 0; i < trace.length; i++) {
  console.log(`row ${i}:`, trace[i]!.map((b) => (b ? "T" : "F")).join(","));
}
check("subsetSum([3,1,4],4)", subsetSum([3, 1, 4], 4), true);
check("subsetSum2D([3,1,4],4)", subsetSum2D([3, 1, 4], 4), true);
check("subsetSumNaive([3,1,4],4)", subsetSumNaive([3, 1, 4], 4), true);

console.log("\n--- 문제 예시 ---");
check("subsetSum([1,2,3],5)", subsetSum([1, 2, 3], 5), true);
check("subsetSum([1,2,3],7)", subsetSum([1, 2, 3], 7), false);
check("subsetSum([3,34,4,12,5,2],9)", subsetSum([3, 34, 4, 12, 5, 2], 9), true);
check("subsetSum([1,2,3],0)", subsetSum([1, 2, 3], 0), true);
check("subsetSum([5],4)", subsetSum([5], 4), false);
check("subsetSum([],0)", subsetSum([], 0), true);

console.log("\n--- 엣지 케이스 ---");
check("subsetSum([2,4,6],5)", subsetSum([2, 4, 6], 5), false);
check("subsetSum([10000],10000)", subsetSum([10000], 10000), true);
check("subsetSum([0,0,0],0)", subsetSum([0, 0, 0], 0), true);
check("subsetSum([],5)", subsetSum([], 5), false);
check("subsetSum([5],5)", subsetSum([5], 5), true);

console.log("\n--- 함정 시연: 오름차순 갱신의 오류 ---");
// nums=[3], target=6: 3을 한 번만 쓸 수 있으므로 합 6은 불가능해야 한다.
check("정답(1D 내림차순) subsetSum([3],6)", subsetSum([3], 6), false);
check("오답(오름차순) subsetSumWrongAscending([3],6)", subsetSumWrongAscending([3], 6), true);
// 트레이스도 출력
{
  const dp = new Array<boolean>(7).fill(false);
  dp[0] = true;
  console.log("오름차순 갱신 진행(v=3, x=3..6):", dp.map((b) => (b ? "T" : "F")).join(","));
  const v = 3;
  for (let x = v; x <= 6; x++) {
    dp[x] = dp[x] || dp[x - v]!;
    console.log(`  x=${x}: dp[${x}] = dp[${x}] || dp[${x - v}] -> ${dp.map((b) => (b ? "T" : "F")).join(",")}`);
  }
}

console.log("\n--- 무작위 교차검증 (naive vs 2D vs 1D) ---");
function randInt(max: number) {
  return Math.floor(Math.random() * max);
}
let randFail = 0;
for (let t = 0; t < 300; t++) {
  const n = randInt(8) + 1;
  const nums = Array.from({ length: n }, () => randInt(8));
  const target = randInt(20);
  const a = subsetSumNaive(nums, target);
  const b = subsetSum2D(nums, target);
  const c = subsetSum(nums, target);
  if (a !== b || b !== c) {
    randFail++;
    console.log(`MISMATCH nums=${JSON.stringify(nums)} target=${target} naive=${a} 2D=${b} 1D=${c}`);
  }
}
console.log(randFail === 0 ? "무작위 300케이스 전부 일치" : `무작위 불일치 ${randFail}건`);

console.log(fail === 0 ? "\n=== 전체 검증 통과 ===" : `\n=== FAIL ${fail}건 ===`);
