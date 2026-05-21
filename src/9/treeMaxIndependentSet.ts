/**
 * 트리 최대 가중 독립집합 (Tree Maximum Weighted Independent Set)
 *
 * 노드 개수 $n$, 간선 목록 $edges$, 노드 가중치 $weights$로 표현된 트리가 주어진다.
 * 어떤 두 인접 노드도 동시에 선택하지 않는 부분집합 중,
 * 가중치 합이 최대인 집합의 합을 구한다.
 *
 * 알고리즘: 후위 순회 트리 DP — 각 노드 $v$에 대해
 * - $dp[v][0]$: $v$를 선택하지 않을 때 서브트리 최댓값
 * - $dp[v][1]$: $v$를 선택할 때 서브트리 최댓값
 *
 * - $1 \leq n \leq 10^5$
 * - $-10^4 \leq weights[i] \leq 10^4$
 * - $edges$의 길이는 $n - 1$, 트리(연결·무방향)
 */

/**
 * Tree DP — Max Weighted Independent Set
 *
 * 점화식 ($v$의 자식 집합 $C(v)$):
 *
 * $$dp[v][0] = \sum_{u \in C(v)} \max\bigl(dp[u][0],\; dp[u][1]\bigr)$$
 *
 * $$dp[v][1] = weights[v] + \sum_{u \in C(v)} dp[u][0]$$
 *
 * 결과 (루트를 0으로 두면):
 *
 * $$\text{treeMaxIndependentSet}(n, edges, weights) = \max\bigl(dp[0][0],\; dp[0][1]\bigr)$$
 *
 * 시간복잡도: $O(n)$, 공간복잡도: $O(n)$
 *
 * @param n - 노드 개수 ($1 \leq n \leq 10^5$)
 * @param edges - 간선 목록 (길이 $n - 1$)
 * @param weights - 노드 가중치 (길이 $n$)
 * @returns 최대 가중치 합
 */
export function treeMaxIndependentSet(
  n: number,
  edges: [number, number][],
  weights: number[],
): number {
  throw new Error("Not implemented");
}
