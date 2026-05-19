/**
 * 트리 동형 판정 (Tree Isomorphism) — AHU 알고리즘
 *
 * 같은 정점 수 $n$을 가진 두 무방향 트리 $T_1, T_2$가 주어진다.
 * 두 트리가 동형(isomorphic)인지, 즉 정점 사이의 일대일 대응 $\phi$가 존재하여
 * 임의의 두 정점 $u, v$에 대해 $\{u, v\} \in E_1 \iff \{\phi(u), \phi(v)\} \in E_2$
 * 를 만족하는지를 판정한다.
 *
 * $$\exists \phi: V_1 \to V_2 \text{ bijection s.t. } \{u, v\} \in E_1 \Leftrightarrow \{\phi(u), \phi(v)\} \in E_2$$
 *
 * AHU(Aho-Hopcroft-Ullman) 알고리즘:
 * - 각 트리의 중심(center, 1개 또는 2개)을 찾는다.
 * - 중심에서 출발하여 부분 트리를 재귀적으로 정규화 문자열(canonical form)로 인코딩한다.
 * - 자식의 정규형들을 정렬하여 결합한 결과가 양 트리에서 일치하면 동형이다.
 *
 * 중심이 두 개인 경우 두 가지 루팅 모두를 시도한다. 시간 복잡도는 $O(n \log n)$.
 *
 * @param n - 각 트리의 정점 수 ($1 \leq n \leq 10^5$)
 * @param edges1 - 첫 번째 트리의 간선 목록
 * @param edges2 - 두 번째 트리의 간선 목록
 * @returns 두 트리가 동형이면 true, 아니면 false
 */
export function treeIsomorphism(
  _n: number,
  _edges1: [number, number][],
  _edges2: [number, number][]
): boolean {
  throw new Error("Not implemented");
}
