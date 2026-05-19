/**
 * 부분 트리 합 질의 (Subtree Sum Query)
 *
 * $n$개의 정점과 $n-1$개의 간선으로 이루어진 루트 트리가 주어지며,
 * 각 정점에는 초기 값 $v_i$가 부여된다.
 * 다음 두 종류의 연산을 지원한다:
 *
 * 1. update(node, value): 정점 $u$의 값을 $\text{value}$로 갱신
 * 2. querySubtree(node): 정점 $u$를 루트로 하는 부분 트리의 모든 정점 값의 합
 *
 * 정점 $u$의 부분 트리 정점 집합을 $T(u)$라 하면:
 *
 * $$\text{querySubtree}(u) = \sum_{x \in T(u)} v_x$$
 *
 * DFS의 오일러 진입/탈출 순서 $\text{in}[u], \text{out}[u]$를 사용하면
 * 부분 트리 질의는 구간 합 질의로 변환된다.
 * Fenwick 트리(BIT) 또는 Segment Tree 위에서 각 연산을 $O(\log n)$에 처리한다.
 *
 * 제약: $1 \leq n \leq 10^5$
 */
export class SubtreeSumQuery {
  /**
   * @param n - 정점의 수
   * @param edges - 간선 목록 $[u, v]$
   * @param root - 트리의 루트
   * @param values - 각 정점의 초기 값 (길이 $n$)
   */
  constructor(
    _n: number,
    _edges: [number, number][],
    _root: number,
    _values: number[]
  ) {
    throw new Error("Not implemented");
  }

  /**
   * 정점 $u$의 값을 $\text{value}$로 갱신한다.
   */
  update(_node: number, _value: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 정점 $u$를 루트로 하는 부분 트리의 정점 값 합을 반환한다.
   */
  querySubtree(_node: number): number {
    throw new Error("Not implemented");
  }
}
