export function slidingWindowMaximum(nums: number[], k: number): number[] {
  let sldMax = Number.MIN_SAFE_INTEGER;
  let secMax = Number.MIN_SAFE_INTEGER;
  const res: number[] = [];

  for (let i = 0; i < k; i++) {
    if (sldMax < nums[i]!) {
      secMax = sldMax;
      sldMax = nums[i]!;
    }
  }

  res.push(sldMax);

  let i = k;
  while (i < nums.length) {
    if (sldMax === nums[i - k]) {
      sldMax = secMax;
    }
  }
}
