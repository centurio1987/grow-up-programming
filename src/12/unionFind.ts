/**
 * Union-Find (Disjoint Set Union, DSU)
 *
 * 서로소 집합들의 집합 $\mathcal{F} = \{ S_1, S_2, \ldots, S_k \}$ 에 대해
 * 다음 두 연산을 평균 $O(\alpha(n))$ (역 아커만 함수, 사실상 상수)에 처리한다:
 *
 * 1. $\mathrm{find}(x)$: $x$가 속한 집합의 대표 원소를 반환
 * 2. $\mathrm{union}(x, y)$: $x$와 $y$가 속한 집합을 병합
 *
 * 최적화로 경로 압축(path compression)과 랭크/크기 기준 합치기(union by rank/size)를
 * 함께 사용한다.
 *
 * - $1 \leq n \leq 10^5$
 * - 질의 수 $q \leq 10^5$
 * - 원소는 $0$-기반 정수: $0 \leq x < n$
 */
export class UnionFind {
  /**
   * 크기 $n$의 Union-Find를 생성한다. 각 원소는 자기 자신을 대표 원소로 갖는다:
   *
   * $$\forall\, i \in [0, n),\; \mathrm{parent}[i] = i$$
   *
   * @param n - 원소의 개수 ($1 \leq n \leq 10^5$)
   */
  constructor(_n: number) {
    throw new Error("Not implemented");
  }

  /**
   * 원소 $x$가 속한 집합의 대표 원소를 반환한다.
   *
   * @param x - 원소 ($0 \leq x < n$)
   * @returns 대표 원소
   */
  find(_x: number): number {
    throw new Error("Not implemented");
  }

  /**
   * 원소 $x$와 $y$가 속한 집합을 병합한다.
   *
   * @param x - 원소 ($0 \leq x < n$)
   * @param y - 원소 ($0 \leq y < n$)
   */
  union(_x: number, _y: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 원소 $x$와 $y$가 같은 집합에 속하는지 확인한다.
   *
   * $$\mathrm{connected}(x, y) \iff \mathrm{find}(x) = \mathrm{find}(y)$$
   *
   * @param x - 원소
   * @param y - 원소
   * @returns 같은 집합이면 `true`
   */
  connected(_x: number, _y: number): boolean {
    throw new Error("Not implemented");
  }
}
