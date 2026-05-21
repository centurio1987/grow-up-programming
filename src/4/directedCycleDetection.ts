/**
 * Directed Cycle Detection (유향 그래프에서의 사이클 탐지)
 *
 * 유향 그래프 $G = (V, E)$에 사이클이 존재하는지 판별한다.
 * DFS 색칠 기법(white / gray / black)을 사용하여 $O(V + E)$ 시간에 해결한다.
 *
 * 각 정점에 세 가지 상태를 부여한다:
 *
 * $$\text{color}(v) \in \{\text{WHITE},\, \text{GRAY},\, \text{BLACK}\}$$
 *
 * - WHITE: 아직 방문하지 않음
 * - GRAY: 현재 DFS 스택(재귀 호출)에 들어있음
 * - BLACK: DFS가 완전히 종료됨
 *
 * DFS 진행 중 GRAY 상태인 정점으로 향하는 간선(back edge)을 발견하면 사이클이 존재한다:
 *
 * $$\exists\, (u, v) \in E \text{ s.t. } \text{color}(v) = \text{GRAY}
 *   \iff G \text{ contains a cycle}$$
 *
 * @param n - 정점의 수 ($1 \leq V \leq 10^{5}$, 정점은 $0 \ldots n-1$)
 * @param edges - 유향 간선 목록 $[u, v]$ ($u \to v$, $0 \leq E \leq 10^{5}$)
 * @returns 사이클 존재 여부
 */
export function directedCycleDetection(
  n: number,
  edges: [number, number][],
): boolean {
  throw new Error("Not implemented");
}
