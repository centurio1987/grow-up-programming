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
  function sort(left: number, right: number) {
    if (left >= right) return;

    const pivotIndex = partition(left, right);
    sort(left, pivotIndex - 1);
    sort(pivotIndex + 1, right);
  }

  function partition(left: number, right: number): number {
    // 중간 위치의 요소를 피벗으로 선택하여 이미 정렬된 배열 등에서의 최악의 경우를 방지합니다.
    const mid = left + Math.floor((right - left) / 2);
    swap(mid, right);

    const pivot = nums[right];
    let i = left;

    for (let j = left; j < right; j++) {
      if (nums[j] < pivot) {
        swap(i, j);
        i++;
      }
    }
    swap(i, right);
    return i;
  }

  function swap(i: number, j: number) {
    const temp = nums[i];
    nums[i] = nums[j];
    nums[j] = temp;
  }

  sort(0, nums.length - 1);
  return nums;
}
