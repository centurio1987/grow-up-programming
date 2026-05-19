/**
 * 최소 공통 조상 (Lowest Common Ancestor, LCA)
 *
 * $n$개의 정점과 $n-1$개의 간선으로 이루어진 루트 트리가 주어진다.
 * 루트 정점을 $r$이라 하자. 두 정점 $u, v$의 최소 공통 조상이란
 * 두 정점을 모두 자손으로 갖는 정점 중 가장 깊은(루트로부터 가장 먼) 정점이다.
 *
 * 정점 $x$의 조상 집합을 $\text{anc}(x)$라 하면:
 *
 * $$\text{lca}(u, v) = \arg\max_{x \in \text{anc}(u) \cap \text{anc}(v)} \text{depth}(x)$$
 *
 * Binary Lifting을 사용하면 전처리 $O(n \log n)$ 후 질의당 $O(\log n)$에 해결한다.
 *
 * @param n - 정점의 수 ($1 \leq n \leq 10^5$)
 * @param edges - 간선 목록 $[u, v]$, $0 \leq u, v < n$
 * @param root - 트리의 루트 정점 ($0 \leq \text{root} < n$)
 * @param queries - 질의 목록 $[u, v]$
 * @returns 각 질의에 대한 LCA 결과 배열
 */
export function lowestCommonAncestor(
  _n: number,
  _edges: [number, number][],
  _root: number,
  _queries: [number, number][]
): number[] {
  throw new Error("Not implemented");
}
