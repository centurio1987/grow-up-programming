/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/binary-search/binarySearch/binarySearch.ts` 와 **같은 절차**다 — 닫힌
 * 구간 `[lo, hi]` 를 후보로 두고 가운데를 읽어 한쪽을 후보에서 뺀다. 이름만 가이드 기호표에
 * 맞췄고(`left`·`right` → `lo`·`hi`), 원본의 빈 배열 가드는 두지 않았다 — `hi = -1` 이라
 * 반복 조건이 처음부터 거짓이 되므로 같은 값을 돌려준다. 가이드 본문의 코드는 이 파일에서
 * 옮긴다.
 */

/** 오름차순으로 정렬된 `A` 에서 `target` 의 인덱스를 찾는다. 없으면 `-1`. */
export function binarySearch(A: number[], target: number): number {
  // 후보 구간은 닫힌 구간 [lo, hi] 다. 빈 배열이면 hi = -1 이라 아래 반복에 들어가지 않는다.
  let lo = 0;
  let hi = A.length - 1;

  while (lo <= hi) {
    // (lo + hi) / 2 가 아니라 lo 를 기준으로 더한다. 두 인덱스의 합이 표현 범위를 넘지 않는다.
    const mid = lo + Math.floor((hi - lo) / 2);

    if (A[mid] === target) {
      // ① 같다 — 이 인덱스가 답이다.
      return mid;
    }
    if (target < (A[mid] as number)) {
      // ② target 이 더 작다 — mid 부터 오른쪽 전부를 후보에서 뺀다.
      hi = mid - 1;
    } else {
      // ③ target 이 더 크다 — mid 까지 왼쪽 전부를 후보에서 뺀다.
      lo = mid + 1;
    }
  }

  // 후보 구간이 비었다. target 은 A 안에 없다.
  return -1;
}
