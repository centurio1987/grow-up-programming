/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/sorting/kthSmallest/kthSmallest.ts` 와 **같은 절차**다 — 구간을 기준값으로
 * 갈라 기준값의 자리 하나를 확정하고, 목표 자리가 속한 쪽만 남긴다. 기준값을 고르는 자리만
 * 다르다: 원본 스텁은 난수를 쓰고 이 정본은 **구간의 중앙**을 쓴다. 난수를 쓰면 같은 입력에서
 * 계수가 실행마다 달라져 `bench-alt.ts`(L13)와 `check-proof.ts` 가 판정할 것이 없어진다.
 *
 * 가이드 본문의 코드는 이 파일에서 옮긴다.
 */

/**
 * `A` 를 오름차순으로 정렬했을 때 앞에서 `k` 번째(1부터 셈)에 오는 값.
 *
 * 입력 배열을 **제자리에서** 고친다 — 호출이 끝난 뒤 `A` 의 원소 순서는 보장하지 않는다.
 */
export function kthSmallest(A: number[], k: number): number {
  // 1부터 세는 순번 k 를 0부터 세는 자리 target 으로 한 번만 옮긴다.
  const target = k - 1;

  let lo = 0;
  let hi = A.length - 1;

  while (lo < hi) {
    // 중앙을 기준값으로 골라 끝으로 옮긴다. 그래야 분할 루프가 끝 한 칸만 비켜 두면 된다.
    const m = lo + Math.floor((hi - lo) / 2);
    [A[m], A[hi]] = [A[hi] as number, A[m] as number];
    const pivot = A[hi] as number;

    // i 는 "기준값보다 작은 값이 놓일 다음 자리". j 는 읽는 자리.
    let i = lo;
    for (let j = lo; j < hi; j++) {
      if ((A[j] as number) < pivot) {
        // ① 기준값보다 작다 — 작은 쪽 구역으로 보내고 그 구역을 한 칸 넓힌다.
        [A[i], A[j]] = [A[j] as number, A[i] as number];
        i++;
      }
      // ② 기준값보다 크거나 같다 — 그대로 둔다. j 만 나아간다.
    }

    // 기준값을 두 구역 사이(i)에 놓는다. 이 자리가 기준값의 최종 위치다.
    [A[i], A[hi]] = [A[hi] as number, A[i] as number];

    // ③ 확정된 자리가 곧 목표 자리다.
    if (i === target) return A[i] as number;
    // ④ 목표가 더 앞이다 — 왼쪽만 남긴다.
    if (i > target) hi = i - 1;
    // ⑤ 목표가 더 뒤다 — 오른쪽만 남긴다.
    else lo = i + 1;
  }

  // 구간에 칸이 하나 남았다 — 그 칸이 목표 자리다.
  return A[lo] as number;
}
