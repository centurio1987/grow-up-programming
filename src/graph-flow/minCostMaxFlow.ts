/**
 * 최소 비용 최대 유량 (Min-Cost Max-Flow, MCMF)
 *
 * 비용을 가진 유량 네트워크 $G = (V, E, c, a)$ 와 소스 $s$, 싱크 $t$ 가 주어진다.
 * 여기서 $c(u, v)$ 는 용량, $a(u, v)$ 는 단위 유량당 비용이다.
 *
 * 최대 유량 $|f^*|$ 을 흘리는 유량 함수 $f$ 들 중에서 총 비용이 최소인 $f$ 를 찾는다.
 *
 * 유량의 총 비용:
 *
 * $$\text{cost}(f) = \sum_{(u, v) \in E} a(u, v) \cdot f(u, v)$$
 *
 * 목적:
 *
 * $$\text{minCostMaxFlow}(G, s, t) =
 *   \min_{\substack{f \text{ feasible}\\ |f| = |f^*|}} \text{cost}(f)$$
 *
 * SSP(Successive Shortest Path) 알고리즘:
 * 잔여 네트워크에서 비용을 가중치로 한 최단 경로(SPFA / Bellman-Ford / Johnson + Dijkstra)
 * 를 따라 증가 가능한 만큼 유량을 흘리며, 더 이상 증가 경로가 없을 때까지 반복한다.
 * 시간 복잡도는 일반적으로 $O(|f^*| \cdot \text{SP}(V, E))$.
 *
 * 제약:
 * - $2 \leq V \leq 200$
 * - $0 \leq E \leq 2 \cdot 10^3$
 * - $0 \leq c(u, v) \leq 10^4$
 * - $0 \leq a(u, v) \leq 10^4$
 * - $0 \leq s, t < V,\; s \neq t$
 *
 * @param n - 정점의 개수 $V$ (정점은 $0 \ldots n-1$)
 * @param edges - 방향 간선 목록 $[u, v, c, a]$
 * @param source - 소스 $s$
 * @param sink - 싱크 $t$
 * @returns `{ flow, cost }`: 최대 유량 값과 그때의 최소 비용
 */
export function minCostMaxFlow(
  n: number,
  edges: [number, number, number, number][],
  source: number,
  sink: number,
): { flow: number; cost: number } {
  throw new Error("Not implemented");
}
