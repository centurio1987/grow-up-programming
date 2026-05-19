/**
 * Prim 최소 신장 트리 (밀집 그래프)
 *
 * 가중치 무방향 연결 그래프 $G = (V, E, w)$가 주어졌을 때,
 * 최소 신장 트리 $T$ 의 가중치 합을 구한다.
 *
 * $$W(T) = \sum_{(u, v) \in T} w(u, v), \quad
 *   \text{primMst}(G) = \min_{T \in \mathcal{T}(G)} W(T)$$
 *
 * Prim 알고리즘은 임의의 시작 정점에서 시작하여, 현재 트리에 인접한
 * 간선 중 가중치가 최소인 간선을 하나씩 추가한다.
 * 이진 힙(우선순위 큐)을 사용하면 시간 복잡도는 $O((V + E) \log V)$.
 *
 * 그래프가 연결되지 않아 신장 트리를 구성할 수 없으면 $-1$ 을 반환한다.
 *
 * 제약:
 * - $1 \leq V \leq 10^4$
 * - $0 \leq E \leq V \cdot (V-1) / 2$
 * - $0 \leq w(u, v) \leq 10^9$
 *
 * @param n - 정점의 개수 $V$ (정점은 $0 \ldots n-1$)
 * @param edges - 간선 목록 $[u, v, w]$ (무방향)
 * @returns 최소 신장 트리의 가중치 합. 연결되지 않으면 $-1$
 */
export function primMst(
  _n: number,
  _edges: [number, number, number][],
): number {
  throw new Error("Not implemented");
}
