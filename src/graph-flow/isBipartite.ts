/**
 * 이분 그래프 판정 (Bipartite Check)
 *
 * 무방향 그래프 $G = (V, E)$ 가 이분 그래프인지 판정한다.
 * 이분 그래프란, 정점 집합을 서로소인 두 부분 $A, B$ 로 분할하여
 * 모든 간선이 $A$ 와 $B$ 사이를 잇도록 만들 수 있는 그래프이다:
 *
 * $$\exists\, (A, B): V = A \cup B,\; A \cap B = \emptyset,
 *   \;\forall (u, v) \in E,\; (u \in A \land v \in B) \lor (u \in B \land v \in A)$$
 *
 * 동치 조건: $G$ 가 홀수 길이의 사이클을 포함하지 않는다.
 *
 * BFS 또는 DFS로 정점을 두 가지 색으로 칠하며, 인접한 두 정점이
 * 같은 색이 되는 경우가 발생하면 이분 그래프가 아니다.
 * 시간 복잡도는 $O(V + E)$.
 *
 * 제약:
 * - $1 \leq V \leq 10^5$
 * - $0 \leq E \leq 2 \cdot 10^5$
 * - 그래프가 연결되어 있지 않을 수 있다 (모든 컴포넌트에 대해 판정).
 *
 * @param n - 정점의 개수 $V$ (정점은 $0 \ldots n-1$)
 * @param edges - 간선 목록 $[u, v]$ (무방향)
 * @returns 이분 그래프이면 `true`, 아니면 `false`
 */
export function isBipartite(
  n: number,
  edges: [number, number][],
): boolean {
  throw new Error("Not implemented");
}
