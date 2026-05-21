/**
 * 구간 합 질의 (동적 갱신)
 *
 * 정수 배열 $A$와 일련의 연산이 주어진다.
 * 연산은 두 종류이다:
 *
 * - update $(i, v)$: $A[i] \leftarrow v$ 로 갱신
 * - query  $(l, r)$: $A[l] + A[l+1] + \ldots + A[r]$ 반환
 *
 * 모든 query 연산의 결과를 순서대로 담은 배열을 반환한다.
 *
 * 알고리즘: Fenwick Tree (Binary Indexed Tree), 갱신·질의 모두 $O(\log N)$
 *
 * - $N$은 배열 길이 ($1 \leq N \leq 100{,}000$)
 * - $Q$는 연산 개수 ($1 \leq Q \leq 100{,}000$)
 * - $A[i],\, v$는 정수 ($-10^4 \leq A[i], v \leq 10^4$)
 */

export type FenwickOp =
  | { type: "update"; i: number; v: number }
  | { type: "query"; l: number; r: number };

/**
 * Fenwick Tree Range Sum
 *
 * BIT에 점 갱신을 지원하며, 구간 합은 두 접두 합의 차이로 계산한다.
 *
 * $$\text{sum}(l, r) = \text{prefix}(r+1) - \text{prefix}(l)$$
 *
 * 각 연산의 시간복잡도:
 *
 * $$T_{\text{update}} = T_{\text{query}} = O(\log N)$$
 *
 * @param A - 초기 정수 배열 ($1 \leq N \leq 100{,}000$)
 * @param ops - 연산 순서대로의 배열 ($1 \leq Q \leq 100{,}000$)
 * @returns 모든 query 연산 결과 배열
 */
export function fenwickRangeSum(A: number[], ops: FenwickOp[]): number[] {
  throw new Error("Not implemented");
}
