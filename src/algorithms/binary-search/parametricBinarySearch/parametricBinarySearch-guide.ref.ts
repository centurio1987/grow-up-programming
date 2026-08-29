/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch.ts` 와
 * **같은 절차**다 — 답이 될 수 있는 값의 폐구간 `[lo, hi]` 를 후보로 두고, 후보값 하나를
 * 탐욕 순회로 판정해 한쪽을 후보에서 뺀다. 두 자리만 다르다.
 *
 * 1. `Math.max(...A)` 와 `reduce` 대신 순회 한 번으로 `lo`·`hi` 를 함께 구한다.
 *    `Math.max(...A)` 는 인자를 `N` 개 펼치므로 `N = 10^5` 에서 호출 인자 한계에 걸릴 수 있다.
 * 2. `feasible` 을 내보낸다 — 가이드가 판정 함수만 따로 실행해 보이는 자리가 있다.
 *
 * 이름은 가이드 기호표에 맞췄다(`mid` 의 뜻은 「이번에 판정할 후보값」이고 배열 인덱스가
 * 아니다). 가이드 본문의 코드는 이 파일에서 옮긴다.
 */

/**
 * `A` 를 `K` 개의 비어 있지 않은 연속 묶음으로 나눌 때, 묶음 합의 최댓값이 될 수 있는 가장
 * 작은 값을 돌려준다.
 */
export function parametricBinarySearch(A: number[], K: number): number {
  // 후보 구간의 아래 끝은 max(A), 위 끝은 ΣA 다. 순회 한 번으로 둘을 함께 구한다.
  let lo = 0;
  let hi = 0;
  for (const x of A) {
    if (x > lo) lo = x;
    hi += x;
  }

  while (lo <= hi) {
    // 후보 구간의 한가운데 값을 이번 판정 대상으로 삼는다.
    const mid = lo + Math.floor((hi - lo) / 2);

    if (feasible(A, K, mid)) {
      // ① 판정이 참 — mid 로 나눌 수 있다. mid 보다 큰 값은 답이 아니다.
      hi = mid - 1;
    } else {
      // ② 판정이 거짓 — 답은 mid 보다 크다.
      lo = mid + 1;
    }
  }

  // 후보 구간이 비었다. lo 가 판정이 참이 되는 가장 작은 값이다.
  return lo;
}

/** 묶음 합이 `m` 이하가 되도록 왼쪽부터 이어 붙였을 때, 묶음이 `K` 개 이하로 끝나는가. */
export function feasible(A: number[], K: number, m: number): boolean {
  let count = 1;
  let accSum = 0;

  for (const x of A) {
    if (accSum + x > m) {
      // ③ 지금 묶음에 x 를 더 넣으면 m 을 넘는다. 여기서 새 묶음을 시작한다.
      count++;
      accSum = 0;
    }
    accSum += x;
  }

  return count <= K;
}
