/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/sorting/quicksort/quicksort.ts` 와 **같은 절차**다 — 중앙을 기준값으로 골라
 * 끝으로 옮기고 Lomuto 로 분할한다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 */

/** 오름차순 정렬. 입력 배열을 **제자리에서** 고치고 같은 배열을 돌려준다. */
export function quickSort(nums: number[]): number[] {
  sort(nums, 0, nums.length - 1);
  return nums;
}

function sort(arr: number[], lo: number, hi: number): void {
  // 원소가 0개 또는 1개면 이미 정렬이다.
  if (hi - lo < 1) return;

  // 중앙을 기준값으로 고르고 끝으로 옮긴다. 그래야 분할 루프가 끝 한 칸만 비켜 두면 된다.
  const pivotIdx = lo + Math.floor((hi - lo) / 2);
  [arr[pivotIdx], arr[hi]] = [arr[hi] as number, arr[pivotIdx] as number];
  const pivot = arr[hi] as number;

  // i 는 "작은 값이 놓일 다음 자리". j 는 읽는 자리.
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if ((arr[j] as number) < pivot) {
      // ① 기준값보다 작다 — 작은 쪽 구역으로 보내고 그 구역을 한 칸 넓힌다.
      [arr[i], arr[j]] = [arr[j] as number, arr[i] as number];
      i++;
    }
    // ② 기준값보다 크거나 같다 — 그대로 둔다. j 만 나아간다.
  }

  // 기준값을 두 구역 사이(i)에 놓는다. 이 자리가 기준값의 최종 위치다.
  [arr[i], arr[hi]] = [arr[hi] as number, arr[i] as number];

  sort(arr, lo, i - 1);
  sort(arr, i + 1, hi);
}
