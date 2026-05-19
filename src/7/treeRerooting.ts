/**
 * Rerooting Technique — 모든 노드까지의 거리 합
 *
 * $n$개의 정점과 $n-1$개의 간선으로 이루어진 트리가 주어진다.
 * 각 간선의 가중치는 1이라 가정한다. 모든 정점 $v$에 대해
 * 다른 모든 정점까지의 거리 합 $S(v)$를 구한다.
 *
 * 두 정점 $u, v$ 사이의 경로 거리를 $d(u, v)$라 하면:
 *
 * $$S(v) = \sum_{u \in V} d(v, u)$$
 *
 * 임의의 루트 $r$에서 한 번의 DFS로 $S(r)$과 각 부분 트리 크기를 구한 뒤,
 * 루트를 인접 정점으로 옮길 때마다 $S$가 어떻게 변하는지 점화식으로 갱신한다.
 * 자식 $c$로 루트를 옮길 경우:
 *
 * $$S(c) = S(\text{parent}) + (n - 2 \cdot \text{size}(c))$$
 *
 * 전체 시간 복잡도는 $O(n)$이다.
 *
 * @param n - 정점의 수 ($1 \leq n \leq 10^5$)
 * @param edges - 간선 목록 $[u, v]$, $0 \leq u, v < n$
 * @returns 각 정점 $v$에 대한 거리 합 $S(v)$ (길이 $n$)
 */
export function treeRerooting(_n: number, _edges: [number, number][]): number[] {
  throw new Error("Not implemented");
}
