/**
 * Fenwick Tree (Binary Indexed Tree, BIT)
 *
 * 크기 $n$의 배열에 대해 점 갱신 (point update)과
 * 접두사 합 (prefix sum) 질의를 모두 $O(\log n)$에 처리하는 자료구조이다.
 *
 * 내부 트리 배열 $T$에서 인덱스 $i$의 책임 구간은:
 *
 * $$\text{range}(i) = \bigl[\, i - \mathrm{lowbit}(i) + 1,\; i \,\bigr],
 * \quad \mathrm{lowbit}(i) = i \;\&\; (-i)$$
 *
 * 점 갱신 시 $i \leftarrow i + \mathrm{lowbit}(i)$ 로 부모를 갱신하고,
 * 접두사 합 질의 시 $i \leftarrow i - \mathrm{lowbit}(i)$ 로 합을 누적한다.
 *
 * 구간 합 $[l, r]$은 다음과 같이 계산한다:
 *
 * $$\mathrm{rangeSum}(l, r) = \mathrm{prefixSum}(r) - \mathrm{prefixSum}(l - 1)$$
 *
 * - $1 \leq n \leq 10^5$
 * - 질의 수 $q \leq 10^5$
 * - 인덱스는 $1$-기반: $1 \leq i \leq n$
 */
export class FenwickTree {
  /**
   * 크기 $n$의 Fenwick Tree를 초기값 $0$으로 생성한다.
   *
   * @param n - 배열의 크기 ($1 \leq n \leq 10^5$)
   */
  constructor(_n: number) {
    throw new Error("Not implemented");
  }

  /**
   * 인덱스 $i$의 값에 $\Delta$를 더한다 (점 갱신).
   *
   * $$A[i] \leftarrow A[i] + \Delta$$
   *
   * @param i - 갱신할 인덱스 ($1 \leq i \leq n$)
   * @param delta - 더할 값 ($\Delta \in \mathbb{Z}$)
   */
  update(_i: number, _delta: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 접두사 합을 반환한다:
   *
   * $$\mathrm{prefixSum}(i) = \sum_{k=1}^{i} A[k]$$
   *
   * @param i - 합산할 마지막 인덱스 ($0 \leq i \leq n$, $i = 0$이면 $0$)
   * @returns 접두사 합
   */
  prefixSum(_i: number): number {
    throw new Error("Not implemented");
  }

  /**
   * 구간 합을 반환한다:
   *
   * $$\mathrm{rangeSum}(l, r) = \sum_{k=l}^{r} A[k]$$
   *
   * @param l - 구간 시작 ($1 \leq l \leq r \leq n$)
   * @param r - 구간 끝
   * @returns 구간 합
   */
  rangeSum(_l: number, _r: number): number {
    throw new Error("Not implemented");
  }
}
