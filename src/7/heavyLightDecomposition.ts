/**
 * Heavy-Light Decomposition (HLD) — 경로 합 질의
 *
 * $n$개의 정점과 $n-1$개의 간선으로 이루어진 루트 트리에서
 * 각 정점에 값 $v_i$가 부여된다. 다음 두 연산을 지원한다:
 *
 * 1. update(node, value): 정점 $u$의 값을 $\text{value}$로 갱신
 * 2. queryPath(u, v): 두 정점 $u, v$ 사이 경로 상 모든 정점 값의 합
 *
 * 경로 $u \leadsto v$ 상의 정점 집합을 $P(u, v)$라 하면:
 *
 * $$\text{queryPath}(u, v) = \sum_{x \in P(u, v)} v_x$$
 *
 * 각 정점에서 자식 부분 트리 크기가 가장 큰 자식을 heavy edge로 선택하면
 * 트리를 chain으로 분할할 수 있다. 임의의 경로는 $O(\log n)$개의 chain 구간으로
 * 분해되므로, chain들을 Segment Tree 위에 평탄화하면 각 연산을 $O(\log^2 n)$에 처리한다.
 *
 * 제약: $1 \leq n \leq 10^5$
 */
export class HeavyLightDecomposition {
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
   * 정점 $u$와 $v$ 사이 경로의 모든 정점 값 합을 반환한다.
   */
  queryPath(_u: number, _v: number): number {
    throw new Error("Not implemented");
  }
}
