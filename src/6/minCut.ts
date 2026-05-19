/**
 * 최소 컷 (Minimum s-t Cut)
 *
 * 유량 네트워크 $G = (V, E, c)$ 와 소스 $s$, 싱크 $t$ 가 주어졌을 때,
 * $s$ 와 $t$ 를 분리하는 정점 분할 $(S, T)$ 의 컷 용량을 최소화한다.
 *
 * 컷의 정의:
 *
 * $$S \cup T = V,\; S \cap T = \emptyset,\; s \in S,\; t \in T$$
 *
 * 컷 용량:
 *
 * $$c(S, T) = \sum_{(u, v) \in E,\; u \in S,\; v \in T} c(u, v)$$
 *
 * $$\text{minCut}(G, s, t) = \min_{(S, T) \text{ s-t cut}} c(S, T)$$
 *
 * 최대 유량 최소 컷 정리 (Max-Flow Min-Cut Theorem):
 *
 * $$\max_{f \text{ feasible}} |f| = \min_{(S, T) \text{ s-t cut}} c(S, T)$$
 *
 * 따라서 최대 유량 알고리즘(Edmonds-Karp / Dinic's)을 수행한 뒤,
 * 잔여 네트워크에서 $s$ 로부터 도달 가능한 정점 집합을 $S$, 나머지를 $T$ 로 두면 된다.
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
 * @returns `{ cut }`: 최소 컷 용량
 */
export function minCut(
  _n: number,
  _edges: [number, number, number][],
  _source: number,
  _sink: number,
): { cut: number } {
  throw new Error("Not implemented");
}
