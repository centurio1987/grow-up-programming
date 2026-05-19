/**
 * Dijkstra 최단 경로
 *
 * 가중치가 음수가 아닌 방향 그래프 $G = (V, E)$가 주어진다.
 * 시작 정점 $s$로부터 모든 정점 $v$까지의 최단 거리 $d(s, v)$를 구한다.
 *
 * 거리 함수의 정의:
 *
 * $$d(s, v) = \min_{P \in \mathcal{P}(s, v)} \sum_{(u, w) \in P} w(u, w)$$
 *
 * 여기서 $\mathcal{P}(s, v)$는 $s \to v$ 경로의 집합이며,
 * $v$에 도달할 수 없는 경우 $d(s, v) = \infty$ 이다.
 *
 * 알고리즘은 이진 힙을 사용한 우선순위 큐로 $O((V + E) \log V)$ 시간에 동작한다.
 *
 * 제약:
 * - $1 \leq V \leq 10^5$
 * - $0 \leq E \leq 2 \cdot 10^5$
 * - $0 \leq w(u, v) \leq 10^9$
 * - $0 \leq s < V$
 *
 * @param n - 정점의 개수 $V$
 * @param edges - 간선 목록 $[u, v, w]$ (방향 간선, $u \to v$, 가중치 $w \geq 0$)
 * @param src - 시작 정점 $s$
 * @returns 길이 $V$의 배열 $d$, 도달 불가능한 정점은 `Infinity`
 */
export function dijkstra(
  _n: number,
  _edges: [number, number, number][],
  _src: number,
): number[] {
  throw new Error("Not implemented");
}
