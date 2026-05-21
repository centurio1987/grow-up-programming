export function twoSum(nums: number[], target: number): [number, number] {
  if (nums.length < 2) throw Error();

  //<target - nums[i], i>
  const matchingTable = new Map<number, number>();

  for (let idx = 0; idx < nums.length; idx++) {
    const Xi = target - nums[idx]!;

    if (matchingTable.has(Xi)) {
      return [matchingTable.get(Xi)!, idx];
    } else {
      matchingTable.set(nums[idx]!, idx);
    }
  }

  throw Error();
}
