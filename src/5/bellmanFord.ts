/**
 * Bellman-Ford 최단 경로 (음수 사이클 검출 포함)
 *
 * 가중치가 음수일 수 있는 방향 그래프 $G = (V, E)$가 주어진다.
 * 시작 정점 $s$로부터 모든 정점 $v$까지의 최단 거리 $d(s, v)$를 구하며,
 * $s$에서 도달 가능한 음수 사이클의 존재 여부를 함께 반환한다.
 *
 * 완화(relaxation) 연산을 $V - 1$번 반복한다:
 *
 * $$d(v) \leftarrow \min\bigl(d(v),\; d(u) + w(u, v)\bigr) \quad \forall (u, v) \in E$$
 *
 * $V$번째 반복에서 완화가 가능하면 음수 사이클이 존재한다.
 * 음수 사이클이 검출되면 `hasNegativeCycle = true`를 반환한다.
 *
 * 시간 복잡도는 $O(V \cdot E)$ 이다.
 *
 * 제약:
 * - $1 \leq V \leq 500$
 * - $0 \leq E \leq V \cdot (V - 1)$
 * - $-10^9 \leq w(u, v) \leq 10^9$
 * - $0 \leq s < V$
 *
 * @param n - 정점의 개수 $V$
 * @param edges - 간선 목록 $[u, v, w]$ (방향 간선, 가중치 음수 허용)
 * @param src - 시작 정점 $s$
 * @returns `{ dist, hasNegativeCycle }` — `dist[v]`는 최단 거리(`Infinity` if 도달 불가),
 *          $s$에서 도달 가능한 음수 사이클이 있으면 `hasNegativeCycle = true`
 */
export function bellmanFord(
  n: number,
  edges: [number, number, number][],
  src: number,
): { dist: number[]; hasNegativeCycle: boolean } {
  throw new Error("Not implemented");
}
