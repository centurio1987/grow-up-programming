/**
 * 최대 이분 매칭 (Maximum Bipartite Matching)
 *
 * 이분 그래프 $G = (L \cup R, E)$ 가 주어졌을 때,
 * 어떤 두 간선도 공통 정점을 공유하지 않는 간선 부분집합 $M \subseteq E$ 중
 * 크기가 최대인 매칭의 크기 $|M|$ 을 구한다.
 *
 * 매칭의 정의:
 *
 * $$M \subseteq E \text{ s.t. } \forall e_1, e_2 \in M,\; e_1 \neq e_2 \Rightarrow e_1 \cap e_2 = \emptyset$$
 *
 * $$\text{maxBipartiteMatching}(G) = \max_{M \text{ matching}} |M|$$
 *
 * Hopcroft-Karp 알고리즘은 BFS로 레이어를 나눈 뒤 DFS로 증가 경로를 동시에
 * 다수 찾아 시간 복잡도 $O(E \sqrt{V})$ 에 해결한다.
 * 헝가리안 알고리즘(증가 경로 반복)은 $O(V \cdot E)$.
 *
 * 제약:
 * - $1 \leq L, R \leq 10^3$
 * - $0 \leq E \leq L \cdot R$
 * - 간선의 첫 번째 원소 $u$ 는 왼쪽 정점($0 \leq u < L$),
 *   두 번째 원소 $v$ 는 오른쪽 정점($0 \leq v < R$).
 *
 * @param left - 왼쪽 정점의 개수 $L$
 * @param right - 오른쪽 정점의 개수 $R$
 * @param edges - 간선 목록 $[u, v]$
 * @returns 최대 매칭의 크기 $|M|$
 */
export function maxBipartiteMatching(
  _left: number,
  _right: number,
  _edges: [number, number][],
): number {
  throw new Error("Not implemented");
}
