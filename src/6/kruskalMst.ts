/**
 * Kruskal 최소 신장 트리 (희소 그래프)
 *
 * 가중치 무방향 연결 그래프 $G = (V, E, w)$가 주어졌을 때,
 * 모든 정점을 포함하면서 간선 가중치 합이 최소인 트리 $T \subseteq E$ 를 구한다.
 *
 * 최소 신장 트리의 가중치 합 정의:
 *
 * $$W(T) = \sum_{(u, v) \in T} w(u, v)$$
 *
 * $$\text{kruskalMst}(G) = \min_{T \in \mathcal{T}(G)} W(T)$$
 *
 * 여기서 $\mathcal{T}(G)$ 는 $G$ 의 모든 신장 트리의 집합이다.
 *
 * Kruskal 알고리즘은 간선을 가중치 오름차순으로 정렬한 뒤,
 * Union-Find 자료구조로 사이클을 피하며 간선을 하나씩 추가한다.
 * 시간 복잡도는 $O(E \log E)$.
 *
 * 그래프가 연결되지 않아 신장 트리를 구성할 수 없으면 $-1$ 을 반환한다.
 *
 * 제약:
 * - $1 \leq V \leq 10^5$
 * - $0 \leq E \leq 2 \cdot 10^5$
 * - $0 \leq w(u, v) \leq 10^9$
 *
 * @param n - 정점의 개수 $V$ (정점은 $0 \ldots n-1$)
 * @param edges - 간선 목록 $[u, v, w]$ (무방향)
 * @returns 최소 신장 트리의 가중치 합. 연결되지 않으면 $-1$
 */
export function kruskalMst(
  n: number,
  edges: [number, number, number][],
): number {
  throw new Error("Not implemented");
}
