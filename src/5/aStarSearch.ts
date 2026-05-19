/**
 * A* 탐색 (Dijkstra + 휴리스틱)
 *
 * 가중치가 음수가 아닌 방향 그래프 $G = (V, E)$가 주어진다.
 * 시작 정점 $s$로부터 목표 정점 $t$까지의 최단 경로 비용을 구한다.
 *
 * 각 정점 $v$에 대해 추정 함수 $f(v) = g(v) + h(v)$ 를 사용한다:
 * - $g(v)$ : 현재까지 발견한 $s \to v$의 실제 거리
 * - $h(v)$ : $v \to t$의 휴리스틱 추정 비용
 *
 * 우선순위 큐에서 $f$가 가장 작은 정점을 꺼내며 다음과 같이 완화한다:
 *
 * $$g(v) \leftarrow g(u) + w(u, v),\quad f(v) \leftarrow g(v) + h(v)$$
 *
 * 휴리스틱 $h$가 admissible (절대 실제 최단 거리를 초과하지 않음)일 때
 * 최단 경로가 보장된다. 또한 $h$가 consistent(단조)이면 한 번 확장한 정점은
 * 다시 확장하지 않는다.
 *
 * $h \equiv 0$이면 일반 Dijkstra와 동일하다.
 *
 * 제약:
 * - $1 \leq V \leq 10^5$
 * - $0 \leq E \leq 2 \cdot 10^5$
 * - $0 \leq w(u, v) \leq 10^9$
 * - $0 \leq h(v) \leq d(v, t)$ (admissible)
 * - $0 \leq s, t < V$
 *
 * @param n - 정점의 개수 $V$
 * @param edges - 간선 목록 $[u, v, w]$ (방향 간선, 가중치 비음수)
 * @param src - 시작 정점 $s$
 * @param goal - 목표 정점 $t$
 * @param h - 휴리스틱 함수 $h(v)$, admissible 가정
 * @returns 최단 경로 비용. 도달 불가능하면 `Infinity`
 */
export function aStarSearch(
  _n: number,
  _edges: [number, number, number][],
  _src: number,
  _goal: number,
  _h: (v: number) => number,
): number {
  throw new Error("Not implemented");
}
