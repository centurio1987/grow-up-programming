/**
 * Treap (Tree + Heap)
 *
 * 각 노드가 키 $\mathrm{key}$와 무작위 우선순위 $\mathrm{priority}$를 갖고,
 * 키에 대해 BST 조건, 우선순위에 대해 (최대) 힙 조건을 동시에 만족하는 자료구조.
 * 무작위 우선순위 덕분에 기대 깊이가 $O(\log n)$이 되어, 다음 연산을 모두
 * 기대 $O(\log n)$에 처리한다.
 *
 * 1. $\mathrm{insert}(x)$: 키 $x$를 삽입
 * 2. $\mathrm{delete}(x)$: 키 $x$를 삭제 (한 개)
 * 3. $\mathrm{findKth}(k)$: 정렬 순서에서 $1$-기반 $k$번째 키
 *
 * 핵심 연산 $\mathrm{split}$과 $\mathrm{merge}$:
 *
 * $$\mathrm{split}(T, x) = (T_{< x},\; T_{\geq x}),
 * \qquad \mathrm{merge}(L, R) \text{ where } \max(L) < \min(R)$$
 *
 * - $1 \leq n \leq 10^5$
 * - 질의 수 $q \leq 10^5$
 * - 키 값은 $|x| \leq 10^9$
 */
export class Treap {
  /**
   * 비어있는 Treap을 생성한다.
   */
  constructor() {
    throw new Error("Not implemented");
  }

  /**
   * 키 $x$를 삽입한다. 중복을 허용한다.
   *
   * @param x - 삽입할 키
   */
  insert(_x: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 키 $x$를 한 개 삭제한다. 존재하지 않으면 아무 일도 하지 않는다.
   *
   * @param x - 삭제할 키
   */
  delete(_x: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 정렬 순서에서 $k$번째 ($1$-기반) 키를 반환한다.
   *
   * @param k - 순위 ($1 \leq k \leq |T|$)
   * @returns $k$번째 키
   */
  findKth(_k: number): number {
    throw new Error("Not implemented");
  }
}
