/**
 * DAG 최단 경로 (위상 정렬 + 완화)
 *
 * 사이클이 없는 방향 그래프(DAG) $G = (V, E)$가 주어진다.
 * 시작 정점 $s$로부터 모든 정점 $v$까지의 최단 거리 $d(s, v)$를 구한다.
 *
 * DAG에서는 위상 정렬을 한 뒤 정렬 순서대로 각 정점을 한 번씩만 완화하면 충분하다.
 *
 * $$d(v) \leftarrow \min\bigl(d(v),\; d(u) + w(u, v)\bigr),\quad u \prec v \text{ (위상 순서)}$$
 *
 * 가중치는 음수도 허용된다 (DAG이므로 음수 사이클이 존재하지 않는다).
 * 시간 복잡도는 $O(V + E)$ 이다.
 *
 * 제약:
 * - $1 \leq V \leq 10^5$
 * - $0 \leq E \leq 2 \cdot 10^5$
 * - $-10^9 \leq w(u, v) \leq 10^9$
 * - $0 \leq s < V$
 * - 입력 그래프는 DAG (사이클 없음)
 *
 * @param n - 정점의 개수 $V$
 * @param edges - 간선 목록 $[u, v, w]$ (방향 간선, $u \to v$, 가중치 음수 허용)
 * @param src - 시작 정점 $s$
 * @returns 길이 $V$의 배열 $d$, 도달 불가능한 정점은 `Infinity`
 */
export function dagShortestPath(
  _n: number,
  _edges: [number, number, number][],
  _src: number,
): number[] {
  throw new Error("Not implemented");
}
