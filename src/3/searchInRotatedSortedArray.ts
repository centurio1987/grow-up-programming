/**
 * Search in Rotated Sorted Array
 *
 * 서로 다른 값으로 이루어진 오름차순 정렬 배열이 알 수 없는 위치에서 회전된 상태로 주어진다.
 * 예: $[0, 1, 2, 4, 5, 6, 7]$ 이 회전되어 $[4, 5, 6, 7, 0, 1, 2]$ 가 될 수 있다.
 *
 * 회전된 배열 $A$와 목표값 $\text{target}$이 주어질 때,
 * $A[i] = \text{target}$인 인덱스 $i$를 반환하고, 없으면 $-1$을 반환한다.
 *
 * $$\text{searchInRotatedSortedArray}(A, \text{target}) = \begin{cases}
 *   i & \text{if } \exists\, i \in [0, N) \text{ s.t. } A[i] = \text{target} \\
 *   -1 & \text{otherwise}
 * \end{cases}$$
 *
 * 핵심 아이디어 — **변형 이분 탐색**.
 *
 * 임의의 구간 $[\text{lo}, \text{hi}]$를 중간점 $\text{mid}$로 나누면,
 * $A[\text{lo} \ldots \text{mid}]$ 또는 $A[\text{mid} \ldots \text{hi}]$ 둘 중 적어도 하나는 정렬되어 있다.
 * 정렬된 쪽에서 $\text{target}$의 존재 여부를 판정하여 탐색 구간을 절반으로 줄인다.
 *
 * 시간 복잡도: $O(\log N)$, 공간 복잡도: $O(1)$.
 *
 * 제약 조건:
 * - $1 \leq N \leq 10^{6}$
 * - $A$의 모든 원소는 서로 다르다.
 * - $A$는 어떤 인덱스 $k$ ($0 \leq k < N$) 에서 회전된 오름차순 배열이다.
 * - $-10^{4} \leq A[i], \text{target} \leq 10^{4}$
 *
 * @param A - 회전된 오름차순 정렬 배열
 * @param target - 찾을 목표값
 * @returns $A[i] = \text{target}$을 만족하는 인덱스, 없으면 $-1$
 */
export function searchInRotatedSortedArray(_A: number[], _target: number): number {
  throw new Error("Not implemented");
}
