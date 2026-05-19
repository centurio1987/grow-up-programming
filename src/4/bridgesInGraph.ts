/**
 * Bridges in Graph (다리 검출)
 *
 * 무향 그래프에서 다리(bridge, cut edge)를 모두 찾는다.
 * Tarjan's Bridge-finding Algorithm으로 $O(V + E)$ 시간에 해결한다.
 *
 * 간선 $(u, v)$가 다리라는 것은, 해당 간선을 제거했을 때 연결 성분의 개수가 증가한다는 의미이다.
 *
 * DFS 트리상에서 각 정점에 발견 시각(disc)과 low-link 값을 계산한다:
 *
 * $$\text{low}(v) = \min\!\left(\text{disc}(v),\;
 *   \min_{(v, w) \text{ back edge}} \text{disc}(w),\;
 *   \min_{(v, c) \text{ tree edge}} \text{low}(c)\right)$$
 *
 * 트리 간선 $(u, c)$ (단, $u$가 $c$의 부모)에 대해 다음이 성립하면 $(u, c)$는 다리이다:
 *
 * $$\text{low}(c) > \text{disc}(u)$$
 *
 * 즉, $c$의 서브트리에서 $u$ 또는 그 조상으로 돌아가는 back edge가 없으면 다리이다.
 *
 * 반환 형식: 각 다리 $[u, v]$는 $u < v$가 되도록 정규화하며,
 * 전체 배열은 사전순(첫 원소 → 둘째 원소)으로 정렬한다.
 *
 * @param n - 정점의 수 ($1 \leq V \leq 10^{5}$, 정점은 $0 \ldots n-1$)
 * @param edges - 무향 간선 목록 $[u, v]$ ($0 \leq E \leq 10^{5}$)
 * @returns 다리 간선들의 정렬된 배열 (각 원소는 $[u, v]$, $u < v$)
 */
export function bridgesInGraph(
  _n: number,
  _edges: [number, number][],
): [number, number][] {
  throw new Error("Not implemented");
}
