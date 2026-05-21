/**
 * 최대 유량 (Maximum Flow)
 *
 * 유량 네트워크 $G = (V, E, c)$ 와 소스 $s$, 싱크 $t$ 가 주어졌을 때,
 * 다음 조건을 만족하는 유량 함수 $f: E \to \mathbb{R}_{\geq 0}$ 의 총 유량을 최대화한다.
 *
 * - 용량 제약: $\;0 \leq f(u, v) \leq c(u, v)$
 * - 유량 보존: $\;\forall v \in V \setminus \{s, t\},\;
 *   \sum_{u} f(u, v) = \sum_{w} f(v, w)$
 *
 * 총 유량의 정의:
 *
 * $$|f| = \sum_{v: (s, v) \in E} f(s, v) - \sum_{u: (u, s) \in E} f(u, s)$$
 *
 * $$\text{maxFlow}(G, s, t) = \max_{f \text{ feasible}} |f|$$
 *
 * Edmonds-Karp는 BFS로 최단 증가 경로를 반복적으로 찾아 $O(V \cdot E^2)$,
 * Dinic's는 레벨 그래프 + 차단 유량으로 $O(V^2 \cdot E)$ (단위 용량 시 $O(E\sqrt{V})$).
 *
 * 제약:
 * - $2 \leq V \leq 500$
 * - $0 \leq E \leq 10^4$
 * - $0 \leq c(u, v) \leq 10^6$
 * - $0 \leq s, t < V,\; s \neq t$
 *
 * @param n - 정점의 개수 $V$ (정점은 $0 \ldots n-1$)
 * @param edges - 방향 간선 목록 $[u, v, c]$
 * @param source - 소스 $s$
 * @param sink - 싱크 $t$
 * @returns `{ flow }`: 소스에서 싱크로의 최대 유량
 */
export function maxFlow(
  n: number,
  edges: [number, number, number][],
  source: number,
  sink: number,
): { flow: number } {
  throw new Error("Not implemented");
}
