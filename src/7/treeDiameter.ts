/**
 * 트리 지름 (Tree Diameter)
 *
 * $n$개의 정점과 $n-1$개의 가중치 간선으로 이루어진 트리가 주어진다.
 * 트리의 지름(diameter)은 두 정점 사이를 잇는 경로의 가중치 합 중 최댓값이다.
 *
 * 정점 집합을 $V = \{0, 1, \ldots, n-1\}$, 간선 집합을 $E$라 하고,
 * 두 정점 $u, v$ 사이의 경로 거리를 $\text{dist}(u, v)$라 정의하면:
 *
 * $$\text{treeDiameter}(T) = \max_{u, v \in V} \text{dist}(u, v)$$
 *
 * 일반적으로 DFS/BFS를 2회 수행하거나(임의 정점에서 가장 먼 정점 $x$를 구한 뒤,
 * $x$에서 가장 먼 정점까지의 거리를 측정) 트리 DP를 이용해 $O(n)$ 시간에 해결한다.
 *
 * @param n - 정점의 수 ($1 \leq n \leq 10^5$)
 * @param edges - 간선 목록 $[u, v, w]$, $0 \leq u, v < n$, $w \geq 0$
 * @returns 트리의 지름 (가중치 합)
 */
export function treeDiameter(n: number, edges: [number, number, number][]): number {
  throw new Error("Not implemented");
}
