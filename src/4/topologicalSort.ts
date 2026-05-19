/**
 * Topological Sort (위상 정렬)
 *
 * 유향 비순환 그래프(DAG)의 정점들을 모든 간선 $(u, v)$에 대해
 * $u$가 $v$보다 앞에 오도록 일렬로 나열한다.
 * Kahn's Algorithm(BFS, 진입차수) 또는 DFS 후위 순회 역순으로 $O(V + E)$에 해결한다.
 *
 * 위상 정렬 $\sigma: V \to \{0, 1, \ldots, n-1\}$은 다음 조건을 만족하는 순열이다:
 *
 * $$\forall (u, v) \in E,\quad \sigma(u) < \sigma(v)$$
 *
 * 그래프에 사이클이 존재하면 위상 정렬은 존재하지 않으므로 `null`을 반환한다.
 *
 * Kahn's Algorithm 개요:
 *   1. 모든 정점의 진입차수(in-degree)를 계산한다.
 *   2. 진입차수 $0$인 정점을 큐에 넣는다.
 *   3. 큐에서 꺼낸 정점을 결과에 추가하고, 그 정점으로부터 나가는 간선들을 제거한다
 *      (이웃의 진입차수 감소, 0이 되면 큐에 추가).
 *
 * 다수의 유효한 위상 정렬이 존재할 수 있으므로, 테스트는 검증 함수(validity)를 사용한다.
 *
 * @param n - 정점의 수 ($1 \leq V \leq 10^{5}$, 정점은 $0 \ldots n-1$)
 * @param edges - 유향 간선 목록 $[u, v]$ ($u \to v$, $0 \leq E \leq 10^{5}$)
 * @returns 길이 $n$의 위상 정렬 결과 배열, 사이클이 존재하면 `null`
 */
export function topologicalSort(
  _n: number,
  _edges: [number, number][],
): number[] | null {
  throw new Error("Not implemented");
}
