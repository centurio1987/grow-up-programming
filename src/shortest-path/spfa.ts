/**
 * SPFA (Shortest Path Faster Algorithm)
 *
 * Bellman-Ford의 큐 기반 최적화 알고리즘이다.
 * 음수 간선을 포함할 수 있는 방향 그래프 $G = (V, E)$에 대해,
 * 시작 정점 $s$로부터 모든 정점 $v$까지의 최단 거리 $d(s, v)$를 구한다.
 *
 * 완화에 성공한 정점만 큐에 넣어 다시 처리하므로 희소 그래프에서 효율적이다:
 *
 * $$d(v) \leftarrow d(u) + w(u, v) \quad \text{if } d(u) + w(u, v) < d(v)$$
 *
 * 평균적으로 $O(k \cdot E)$ (작은 상수 $k$), 최악의 경우 $O(V \cdot E)$ 이다.
 *
 * 음수 사이클이 존재하지 않는다고 가정한다.
 * (검출이 필요하면 `bellmanFord`를 사용한다.)
 *
 * 제약:
 * - $1 \leq V \leq 10^5$
 * - $0 \leq E \leq 2 \cdot 10^5$
 * - $-10^9 \leq w(u, v) \leq 10^9$
 * - $0 \leq s < V$
 * - $s$에서 도달 가능한 음수 사이클이 없다.
 *
 * @param n - 정점의 개수 $V$
 * @param edges - 간선 목록 $[u, v, w]$ (방향 간선, 가중치 음수 허용)
 * @param src - 시작 정점 $s$
 * @returns 길이 $V$의 배열 $d$, 도달 불가능한 정점은 `Infinity`
 */
export function spfa(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
  throw new Error("Not implemented");
}
