/**
 * 정수 배열 nums와 목표값 target이 주어질 때, 합이 target이 되는 두 인덱스를 반환하라.
  N ≤ 10,000
*/
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
