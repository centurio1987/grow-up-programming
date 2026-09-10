/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray.ts`
 * 는 학습자가 채우는 스텁이라 그쪽을 가져오지 않는다. 절차는 폐구간 `[lo, hi]` 를 후보로 두고,
 * 가운데 칸을 읽은 뒤 **어느 절반에 끊긴 자리가 없는지**를 먼저 정하고, 그 정렬된 조각의 양 끝
 * 값으로 `target` 의 자리를 정하는 것이다. 이름은 가이드 기호표와 같다(`lo`·`hi`·`mid`).
 * 가이드 본문의 코드는 이 파일에서 옮긴다.
 */

/**
 * 오름차순 배열을 한 지점에서 회전시킨 `A` 에서 `target` 의 인덱스를 찾는다. 없으면 `-1`.
 * `A` 의 원소는 서로 다르다.
 */
export function searchInRotatedSortedArray(
  A: number[],
  target: number,
): number {
  // 후보 구간은 폐구간 [lo, hi] 다. 길이가 0 이면 hi = -1 이라 아래 반복에 들어가지 않는다.
  let lo = 0;
  let hi = A.length - 1;

  while (lo <= hi) {
    // (lo + hi) / 2 가 아니라 lo 를 기준으로 더한다. 두 인덱스의 합이 표현 범위를 넘지 않는다.
    const mid = lo + Math.floor((hi - lo) / 2);
    const vMid = A[mid] as number;

    if (vMid === target) {
      // ① 읽은 칸이 답이다.
      return mid;
    }

    const vLo = A[lo] as number;
    if (vLo <= vMid) {
      // 왼쪽 조각 [lo, mid] 에 끊긴 자리가 없다 — 그 조각은 오름차순이다.
      if (vLo <= target && target < vMid) {
        // ② target 이 정렬된 왼쪽 조각의 값 범위 안이다.
        hi = mid - 1;
      } else {
        // ③ 왼쪽 조각의 값 범위 밖이다 — A 안에 있다면 오른쪽이다.
        lo = mid + 1;
      }
    } else {
      // 오른쪽 조각 [mid, hi] 에 끊긴 자리가 없다 — 그 조각은 오름차순이다.
      const vHi = A[hi] as number;
      if (vMid < target && target <= vHi) {
        // ④ target 이 정렬된 오른쪽 조각의 값 범위 안이다.
        lo = mid + 1;
      } else {
        // ⑤ 오른쪽 조각의 값 범위 밖이다 — A 안에 있다면 왼쪽이다.
        hi = mid - 1;
      }
    }
  }

  // 후보 구간이 비었다. target 은 A 안에 없다.
  return -1;
}
