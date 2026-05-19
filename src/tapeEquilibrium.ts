/**
 * A non-empty array A consisting of N integers is given. Array A represents numbers on a tape.

Any integer P, such that 0 < P < N, splits this tape into two non-empty parts: A[0], A[1], ..., A[P − 1] and A[P], A[P + 1], ..., A[N − 1].

The difference between the two parts is the value of: |(A[0] + A[1] + ... + A[P − 1]) − (A[P] + A[P + 1] + ... + A[N − 1])|

In other words, it is the absolute difference between the sum of the first part and the sum of the second part.

For example, consider array A such that:

  A[0] = 3
  A[1] = 1
  A[2] = 2
  A[3] = 4
  A[4] = 3
We can split this tape in four places:

P = 1, difference = |3 − 10| = 7
P = 2, difference = |4 − 9| = 5
P = 3, difference = |6 − 7| = 1
P = 4, difference = |10 − 3| = 7
Write a function:

class Solution { public int solution(int[] A); }
that, given a non-empty array A of N integers, returns the minimal difference that can be achieved.

For example, given:

  A[0] = 3
  A[1] = 1
  A[2] = 2
  A[3] = 4
  A[4] = 3
the function should return 1, as explained above.

Write an efficient algorithm for the following assumptions:

N is an integer within the range [2..100,000];
each element of array A is an integer within the range [−1,000..1,000].
 */

/**
 * Tape Equilibrium
 *
 * N개의 정수로 이루어진 비어있지 않은 배열 $A$가 주어진다.
 * 정수 $P$ $(1 \leq P \leq N-1)$는 테이프를 두 개의 비어있지 않은 부분으로 나눈다:
 *
 * - 왼쪽 부분: $A[0],\, A[1],\, \ldots,\, A[P-1]$
 * - 오른쪽 부분: $A[P],\, A[P+1],\, \ldots,\, A[N-1]$
 *
 * 분할 지점 $P$에서의 차이값:
 *
 * $$D(P) = \left| \sum_{i=0}^{P-1} A[i] \;-\; \sum_{i=P}^{N-1} A[i] \right|$$
 *
 * 가능한 모든 $P$에 대해 최솟값을 반환한다:
 *
 * $$\text{tapeEquilibrium}(A) = \min_{1 \leq P \leq N-1} D(P)$$
 *
 * @param A - 정수 배열 ($2 \leq N \leq 100{,}000$, $-1{,}000 \leq A[i] \leq 1{,}000$)
 * @returns 가능한 최소 차이값 ($\geq 0$)
 */
export function tapeEquilibrium(_A: number[]): number {
  let D = _A[0]! * 2 - _A.reduce((acc, cur) => acc + cur);
  let min = Math.abs(D);

  for (let p = 1; p < _A.length - 1; p++) {
    const Dnext = D + 2 * _A[p]!;
    if (min > Math.abs(Dnext)) {
      min = Math.abs(Dnext);
    }

    D = Dnext;
  }

  return min;
}
