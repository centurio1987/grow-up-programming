/**
 * Strongly Connected Components (강한 연결 요소, SCC)
 *
 * 유향 그래프 $G = (V, E)$에서 강한 연결 요소(SCC)를 모두 찾는다.
 * Tarjan's Algorithm 또는 Kosaraju's Algorithm으로 $O(V + E)$ 시간에 해결한다.
 *
 * 두 정점 $u, v$가 같은 SCC에 속한다는 것은 $u \to v$ 경로와 $v \to u$ 경로가 모두 존재함과 동치이다:
 *
 * $$u \equiv v \iff (u \to^{*} v) \land (v \to^{*} u)$$
 *
 * 이는 $V$ 위에서의 동치 관계이며, 각 동치류가 하나의 SCC가 된다.
 *
 * Tarjan's Algorithm 개요:
 *   - DFS 진행 중 각 정점에 발견 시각(disc)과 low-link 값을 계산한다.
 *   - $\text{low}(v) = \min(\text{disc}(v),\, \min_{(v, w) \in E} \text{low}(w))$
 *   - $\text{low}(v) = \text{disc}(v)$인 정점을 루트로 하는 부분이 하나의 SCC가 된다.
 *
 * 반환 형식: 각 SCC의 정점은 오름차순 정렬, SCC 자체는 첫 원소 기준 오름차순 정렬.
 * (테스트에서는 SCC 분할이 동일한지를 검증 함수로 확인한다.)
 *
 * @param n - 정점의 수 ($1 \leq V \leq 10^{5}$, 정점은 $0 \ldots n-1$)
 * @param edges - 유향 간선 목록 $[u, v]$ ($u \to v$, $0 \leq E \leq 10^{5}$)
 * @returns SCC들의 배열 (각 SCC는 정렬된 정점 번호 배열)
 */
export function stronglyConnectedComponents(
  n: number,
  edges: [number, number][],
): number[][] {
  throw new Error("Not implemented");
}
