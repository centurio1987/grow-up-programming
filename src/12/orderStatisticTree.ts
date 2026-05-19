/**
 * Order Statistic Tree (순위 통계 트리)
 *
 * 동적 다중 집합 $S \subset \mathbb{Z}$에 대해 다음 연산을 모두 $O(\log n)$에
 * 처리하는 자료구조이다 (균형 BST 또는 Indexed Skiplist 기반).
 *
 * 1. 삽입: $S \leftarrow S \cup \{x\}$
 * 2. 삭제: $S \leftarrow S \setminus \{x\}$ (한 개)
 * 3. $k$번째 원소: 정렬된 $S$에서 $1$-기반 $k$번째 값
 * 4. 순위: $\mathrm{rank}(x) = |\{ y \in S \mid y < x \}|$
 *
 * 각 노드에 서브트리 크기 $\mathrm{size}$를 유지하여 $k$번째 / 순위 질의를
 * 트리 깊이만큼의 시간에 수행한다.
 *
 * - $1 \leq n \leq 10^5$
 * - 질의 수 $q \leq 10^5$
 * - 원소 값은 $|x| \leq 10^9$
 */
export class OrderStatisticTree {
  /**
   * 비어있는 순위 통계 트리를 생성한다.
   */
  constructor() {
    throw new Error("Not implemented");
  }

  /**
   * 원소 $x$를 삽입한다. 중복 삽입을 허용한다.
   *
   * @param x - 삽입할 값
   */
  insert(_x: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 원소 $x$를 한 개 삭제한다. 존재하지 않으면 아무 일도 하지 않는다.
   *
   * @param x - 삭제할 값
   */
  delete(_x: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 정렬된 $S$에서 $k$번째 ($1$-기반) 원소를 반환한다.
   *
   * $$\mathrm{kth}(k) = x \text{ s.t. } |\{ y \in S \mid y < x \}| < k \leq |\{ y \in S \mid y \leq x \}|$$
   *
   * @param k - 순위 ($1 \leq k \leq |S|$)
   * @returns $k$번째 원소
   */
  kth(_k: number): number {
    throw new Error("Not implemented");
  }

  /**
   * 값 $x$의 순위를 반환한다 ($x$보다 작은 원소의 개수):
   *
   * $$\mathrm{rank}(x) = |\{ y \in S \mid y < x \}|$$
   *
   * @param x - 순위를 구할 값
   * @returns $x$보다 작은 원소의 개수 ($\geq 0$)
   */
  rank(_x: number): number {
    throw new Error("Not implemented");
  }
}
