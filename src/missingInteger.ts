/**
 * This is a demo task.

Write a function:

class Solution { public int solution(int[] A); }
that, given an array A of N integers, returns the smallest positive integer (greater than 0) that does not occur in A.

For example, given A = [1, 3, 6, 4, 1, 2], the function should return 5.

Given A = [1, 2, 3], the function should return 4.

Given A = [−1, −3], the function should return 1.

Write an efficient algorithm for the following assumptions:

N is an integer within the range [1..100,000];
each element of array A is an integer within the range [−1,000,000..1,000,000].
 */

/**
 * Missing Integer
 *
 * N개의 정수로 이루어진 배열 $A$가 주어질 때,
 * $A$에 존재하지 않는 가장 작은 양의 정수를 반환한다.
 *
 * 양의 정수 집합을 $S = \{ x \in A \mid x > 0 \}$ 으로 정의하면:
 *
 * $$\text{missingInteger}(A) = \min\left( \mathbb{Z}^{+} \setminus S \right)$$
 *
 * 즉, $1, 2, 3, \ldots$ 순으로 탐색하여 $S$에 없는 첫 번째 값을 반환한다.
 *
 * @param A - 정수 배열 ($1 \leq N \leq 100{,}000$, $-1{,}000{,}000 \leq A[i] \leq 1{,}000{,}000$)
 * @returns $A$에 존재하지 않는 가장 작은 양의 정수 ($\geq 1$)
 */
export function missingInteger(_A: number[]): number {
  const pool = new Set(_A);
  for (let i = 1; i <= 1_000_000; i++) {
    if (pool.has(i) == false) {
      return i;
    }
  }

  return 1000000;
}
