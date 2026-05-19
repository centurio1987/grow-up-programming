/**
 * 구간 최솟값 질의 (동적 갱신)
 *
 * 정수 배열 $A$와 일련의 연산이 주어진다.
 *
 * - update $(i, v)$: $A[i] \leftarrow v$ 로 갱신
 * - query  $(l, r)$: $\min(A[l], \ldots, A[r])$ 반환
 *
 * 모든 query 결과를 순서대로 담은 배열을 반환한다.
 *
 * 알고리즘: Segment Tree, 갱신·질의 모두 $O(\log N)$
 *
 * - $N$은 배열 길이 ($1 \leq N \leq 100{,}000$)
 * - $Q$는 연산 개수 ($1 \leq Q \leq 100{,}000$)
 * - $A[i],\, v$는 정수 ($-10^9 \leq A[i], v \leq 10^9$)
 */

export type SegOp =
  | { type: "update"; i: number; v: number }
  | { type: "query"; l: number; r: number };

/**
 * Segment Tree Range Min
 *
 * 노드 $node$가 구간 $[s, e]$를 담당한다고 할 때:
 *
 * $$tree[node] = \min(tree[2 \cdot node],\; tree[2 \cdot node + 1])$$
 *
 * 점 갱신 시 해당 리프부터 루트까지 갱신, 질의 시 분할 정복으로 $O(\log N)$.
 *
 * @param A - 초기 정수 배열 ($1 \leq N \leq 100{,}000$)
 * @param ops - 연산 순서 ($1 \leq Q \leq 100{,}000$)
 * @returns 모든 query 결과 배열
 */
export function segmentTreeRangeMin(_A: number[], _ops: SegOp[]): number[] {
  throw new Error("Not implemented");
}
