/**
 * Articulation Points (단절점)
 *
 * 무향 연결 그래프(또는 일반 무향 그래프)에서 단절점(articulation point, cut vertex)을 모두 찾는다.
 * Tarjan's Algorithm(low-link)을 사용하여 $O(V + E)$ 시간에 해결한다.
 *
 * 정점 $v$가 단절점이라는 것은, $v$를 그래프에서 제거했을 때 연결 성분의 개수가 증가한다는 의미이다.
 *
 * DFS 트리상에서 정점 $v$에 대해 발견 시각(disc)과 low-link 값을 계산한다:
 *
 * $$\text{low}(v) = \min\!\left(\text{disc}(v),\;
 *   \min_{(v, w) \text{ back edge}} \text{disc}(w),\;
 *   \min_{(v, c) \text{ tree edge}} \text{low}(c)\right)$$
 *
 * 단절점 판정:
 *   1. $v$가 DFS 트리의 루트인 경우 — 자식이 2개 이상이면 단절점.
 *   2. $v$가 루트가 아닌 경우 — 어떤 자식 $c$에 대해 $\text{low}(c) \geq \text{disc}(v)$이면 단절점.
 *
 * 반환 형식: 단절점 정점 번호를 오름차순 정렬한 배열.
 *
 * @param n - 정점의 수 ($1 \leq V \leq 10^{5}$, 정점은 $0 \ldots n-1$)
 * @param edges - 무향 간선 목록 $[u, v]$ ($0 \leq E \leq 10^{5}$)
 * @returns 단절점 정점 번호의 정렬된 배열
 */
export function articulationPoints(
  _n: number,
  _edges: [number, number][],
): number[] {
  throw new Error("Not implemented");
}
