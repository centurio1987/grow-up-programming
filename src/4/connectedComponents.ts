/**
 * Connected Components (연결 성분)
 *
 * 무향 그래프에서 서로 연결된 정점들의 집합(연결 성분)을 모두 찾는다.
 * BFS 또는 DFS를 사용하여 $O(V + E)$ 시간에 해결한다.
 *
 * 그래프 $G = (V, E)$에서 두 정점 $u, v$가 같은 연결 성분에 속한다는 것은,
 * $u$와 $v$를 연결하는 경로가 존재한다는 것과 동치이다.
 *
 * 연결 성분은 동치류(equivalence class)로 정의된다:
 *
 * $$u \sim v \iff \exists \text{ path from } u \text{ to } v \text{ in } G$$
 *
 * 반환되는 각 성분의 정점들은 오름차순으로 정렬되고,
 * 성분 자체는 각 성분의 첫 원소를 기준으로 오름차순 정렬된다.
 *
 * @param n - 정점의 수 ($1 \leq V \leq 10^{5}$, 정점은 $0 \ldots n-1$)
 * @param edges - 간선 목록 $[u, v]$ ($0 \leq E \leq 10^{5}$, 무향)
 * @returns 연결 성분들의 배열 (각 성분은 정렬된 정점 번호 배열)
 */
export function connectedComponents(
  n: number,
  edges: [number, number][],
): number[][] {
  throw new Error("Not implemented");
}
