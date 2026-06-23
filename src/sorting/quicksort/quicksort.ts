/**
 * 주어진 정수 배열을 퀵 정렬(Quick Sort)을 사용하여 오름차순으로 정렬하세요.
 *
 * 제약 조건:
 * - 1 <= nums.length <= 50,000
 * - -50,000 <= nums[i] <= 50,000
 *
 * 예시 1:
 * 입력: nums = [5,2,3,1]
 * 출력: [1,2,3,5]
 *
 * 예시 2:
 * 입력: nums = [5,1,1,2,0,0]
 * 출력: [0,0,1,1,2,5]
 */
export function quickSort(nums: number[]): number[] {
  //초기화
  const lo = 0;
  const hi = nums.length - 1;
  //핵심 로직
  sort(nums, lo, hi);
  //리턴

  return nums;
}

function sort(arr: number[], lo: number, hi: number) {
  if (hi - lo < 1) return;

  const pivotIdx = lo + Math.floor((hi - lo) / 2);

  const swap = arr[pivotIdx]!;
  arr[pivotIdx] = arr[hi]!;
  arr[hi] = swap;

  const pivot = arr[hi]!;

  let i = lo;
  for (let j = lo; j < hi; j++) {
    const tgtItm = arr[j]!;
    if (tgtItm < pivot) {
      const swap = arr[i]!;
      arr[i] = arr[j]!;
      arr[j] = swap;
      i++;
    }
  }

  const swap2 = arr[i]!;
  arr[i] = pivot;
  arr[hi] = swap2;

  sort(arr, lo, i - 1);
  sort(arr, i + 1, hi);
}
