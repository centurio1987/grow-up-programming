/**
 * Floyd-Warshall 모든 쌍 최단 경로
 *
 * 가중치 방향 그래프 $G = (V, E)$가 주어진다.
 * 모든 정점 쌍 $(u, v)$에 대한 최단 거리 $d(u, v)$를 구한다.
 *
 * 동적 계획법을 사용한다. $d^{(k)}(u, v)$는 중간 정점이 $\{0, 1, \ldots, k\}$에
 * 속하는 경로의 최단 거리이며, 다음 점화식으로 갱신한다:
 *
 * $$d^{(k)}(u, v) = \min\bigl(d^{(k-1)}(u, v),\; d^{(k-1)}(u, k) + d^{(k-1)}(k, v)\bigr)$$
 *
 * 초기값:
 *
 * $$d^{(-1)}(u, v) = \begin{cases} 0 & u = v \\ w(u, v) & (u, v) \in E \\ \infty & \text{otherwise} \end{cases}$$
 *
 * 시간 복잡도는 $O(V^3)$ 이다.
 * 동일한 정점 쌍에 다중 간선이 있으면 더 작은 가중치를 사용한다.
 * 음수 사이클은 없다고 가정한다.
 *
 * 제약:
 * - $1 \leq V \leq 500$
 * - $0 \leq E \leq V \cdot (V - 1)$
 * - $-10^6 \leq w(u, v) \leq 10^6$
 *
 * @param n - 정점의 개수 $V$
 * @param edges - 간선 목록 $[u, v, w]$ (방향 간선, 가중치 음수 허용)
 * @returns 길이 $V \times V$의 거리 행렬, 도달 불가능한 경로는 `Infinity`
 */
export function floydWarshall(
  _n: number,
  _edges: [number, number, number][],
): number[][] {
  throw new Error("Not implemented");
}
