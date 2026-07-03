export function houseRobber(nums: number[]): number {
  return houseRobberDp1(nums);
}

export function houseRobberNaive(nums: number[]): number {
  return recursive(nums.length - 1, nums);
}

function recursive(i: number, nums: number[]): number {
  if (i < 0) return 0;

  const skip = recursive(i - 1, nums);
  const applied = recursive(i - 2, nums) + nums[i]!;

  return Math.max(skip, applied);
}

export function houseRobberDp2(nums: number[]): number {
  if (nums.length === 0) return 0;
  const dp = Array.from({ length: nums.length }, () => 0);

  dp[0] = nums[0]!;
  dp[1] = Math.max(dp[0]!, nums[1] !== undefined ? nums[1] : dp[0]);

  for (let i = 2; i < nums.length; i++) {
    dp[i] = Math.max(dp[i - 1]!, dp[i - 2]! + nums[i]!);
  }

  return dp[nums.length - 1]!;
}

export function houseRobberDp1(nums: number[]): number {
  if (nums.length === 0) return 0;

  let prev = nums[0]!;
  let cur = Math.max(prev, nums[1] !== undefined ? nums[1] : prev);

  for (let i = 2; i < nums.length; i++) {
    const tmpPrev = cur;
    cur = Math.max(cur, prev + nums[i]!);
    prev = tmpPrev;
  }

  return cur;
}
