/**
 * Binary Search
 *
 * 정렬된 정수 배열 $A$와 목표값 $\text{target}$이 주어진다.
 * $A[i] = \text{target}$인 인덱스 $i$를 반환하고, 존재하지 않으면 $-1$을 반환한다.
 *
 * 배열이 오름차순으로 정렬되어 있다는 단조성을 이용해 매 단계마다 탐색 구간을 절반으로 줄인다.
 *
 * $$\text{binarySearch}(A, \text{target}) = \begin{cases}
 *   i & \text{if } \exists\, i \in [0, N) \text{ s.t. } A[i] = \text{target} \\
 *   -1 & \text{otherwise}
 * \end{cases}$$
 *
 * 반복 불변식 (loop invariant):
 *
 * $$\text{target} \in A \Rightarrow \text{target} \in A[\text{lo} \ldots \text{hi}]$$
 *
 * 시간 복잡도: $O(\log N)$, 공간 복잡도: $O(1)$.
 *
 * 제약 조건:
 * - $0 \leq N \leq 10^{6}$
 * - $A$는 오름차순으로 정렬되어 있다 ($A[i] \leq A[i+1]$).
 * - $-2^{31} \leq A[i], \text{target} \leq 2^{31} - 1$
 *
 * @param A - 오름차순 정렬된 정수 배열
 * @param target - 찾을 목표값
 * @returns $A[i] = \text{target}$을 만족하는 인덱스, 없으면 $-1$
 */
export function binarySearch(A: number[], target: number): number {
  //가정
  if (A.length < 1) {
    return -1;
  }

  //초기화
  let left = 0;
  let right = A.length - 1;

  //종료 조건 및 핵심 로직
  while (left <= right) {
    let mid = left + Math.floor((right - left) / 2);

    if (target === A[mid]!) {
      return mid;
    } else if (target < A[mid]!) {
      right = mid - 1;
    } else if (target >= A[mid]!) {
      left = mid + 1;
    }
  }

  //리턴
  return -1;
}
