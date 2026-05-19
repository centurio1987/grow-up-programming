/**
 * Segment Tree with Lazy Propagation — 구간 가산 / 구간 합
 *
 * 크기 $n$의 배열에 대해 다음 두 연산을 모두 $O(\log n)$에 처리한다:
 *
 * 1. 구간 가산: $\forall\, i \in [l, r],\; A[i] \leftarrow A[i] + v$
 * 2. 구간 합 질의: $\displaystyle \sum_{i=l}^{r} A[i]$
 *
 * 내부적으로 완전 이진 트리에 각 노드의 책임 구간 $[lo, hi]$에 대한
 * 합 $S$를 저장한다. 갱신 시 자식 노드에 즉시 전파하지 않고, 노드별로
 * lazy 값 $L$을 보관해 두었다가 다음 방문 시 다음과 같이 전파한다:
 *
 * $$S \mathrel{+}= L \cdot (hi - lo + 1), \qquad
 * L_{\text{child}} \mathrel{+}= L, \qquad L \leftarrow 0$$
 *
 * - $1 \leq n \leq 10^5$
 * - 질의 수 $q \leq 10^5$
 * - 인덱스는 $0$-기반: $0 \leq l \leq r < n$
 */
export class SegmentTreeLazy {
  /**
   * 크기 $n$의 세그먼트 트리를 모든 원소 $0$으로 생성한다.
   *
   * @param n - 배열의 크기 ($1 \leq n \leq 10^5$)
   */
  constructor(_n: number) {
    throw new Error("Not implemented");
  }

  /**
   * 구간 $[l, r]$의 모든 원소에 $v$를 더한다 (구간 가산).
   *
   * $$\forall\, i \in [l, r],\; A[i] \leftarrow A[i] + v$$
   *
   * @param l - 구간 시작 ($0 \leq l \leq r < n$)
   * @param r - 구간 끝
   * @param val - 더할 값
   */
  rangeAdd(_l: number, _r: number, _val: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 구간 합을 반환한다:
   *
   * $$\mathrm{rangeSum}(l, r) = \sum_{i=l}^{r} A[i]$$
   *
   * @param l - 구간 시작 ($0 \leq l \leq r < n$)
   * @param r - 구간 끝
   * @returns 구간 합
   */
  rangeSum(_l: number, _r: number): number {
    throw new Error("Not implemented");
  }
}
