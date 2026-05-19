/**
 * An array A consisting of N integers is given. It contains daily prices of a stock share for a period of N consecutive days. If a single share was bought on day P and sold on day Q, where 0 ≤ P ≤ Q < N, then the profit of such transaction is equal to A[Q] − A[P], provided that A[Q] ≥ A[P]. Otherwise, the transaction brings loss of A[P] − A[Q].

For example, consider the following array A consisting of six elements such that:
  A[0] = 23171
  A[1] = 21011
  A[2] = 21123
  A[3] = 21366
  A[4] = 21013
  A[5] = 21367

If a share was bought on day 0 and sold on day 2, a loss of 2048 would occur because A[2] − A[0] = 21123 − 23171 = −2048. If a share was bought on day 4 and sold on day 5, a profit of 354 would occur because A[5] − A[4] = 21367 − 21013 = 354. Maximum possible profit was 356. It would occur if a share was bought on day 1 and sold on day 5.

Write a function,

    function solution(A: number[]): number;

that, given an array A consisting of N integers containing daily prices of a stock share for a period of N consecutive days, returns the maximum possible profit from one transaction during this period. The function should return 0 if it was impossible to gain any profit.

For example, given array A consisting of six elements such that:
  A[0] = 23171
  A[1] = 21011
  A[2] = 21123
  A[3] = 21366
  A[4] = 21013
  A[5] = 21367

the function should return 356, as explained above.

Write an efficient algorithm for the following assumptions:

        N is an integer within the range [0..400,000];
        each element of array A is an integer within the range [0..200,000].
 */

/**
 * Max Profit
 *
 * $N$개의 정수로 이루어진 배열 $A$가 주어진다. $A[i]$는 $i$번째 날의 주식 가격이다.
 * 하루 $P$에 매수하고 하루 $Q$에 매도할 때 ($0 \leq P \leq Q < N$),
 * 거래의 이익은 $A[Q] - A[P]$이다.
 *
 * 한 번의 거래로 얻을 수 있는 최대 이익을 반환한다.
 * 이익을 낼 수 없다면 $0$을 반환한다.
 *
 * $$\text{maxProfit}(A) = \max\left(0,\; \max_{0 \leq P \leq Q < N}\, \big(A[Q] - A[P]\big)\right)$$
 *
 * 등가 표현 — 각 $Q$에 대해 그때까지의 최솟값과의 차이를 최대화:
 *
 * $$\text{maxProfit}(A) = \max\left(0,\; \max_{0 \leq Q < N}\, \Big(A[Q] - \min_{0 \leq P \leq Q} A[P]\Big)\right)$$
 *
 * @param A - 일별 주식 가격 배열 ($0 \leq N \leq 400{,}000$, $0 \leq A[i] \leq 200{,}000$)
 * @returns 최대 가능 이익 ($\geq 0$). 배열이 비어있거나 이익을 낼 수 없으면 $0$.
 */
export function maxProfit(A: number[]): number {
  // if (A.length === 0) {
  //   return 0;
  // }

  // let maxDiff = 0;

  // for (let l = A.length; l > 1; l = Math.floor(l / 2)) {
  //   for (let i = 0; i < A.length; i = i + l) {
  //     const mid = Math.floor(l / 2) + i;
  //     let leftMin = Number.MAX_SAFE_INTEGER;
  //     let rightMax = 0;
  //     for (let leftIdx = i; leftIdx < mid; leftIdx++) {
  //       if (leftMin > A[leftIdx]!) {
  //         leftMin = A[leftIdx]!;
  //       }
  //     }
  //     for (let rightIdx = mid; rightIdx < i + l; rightIdx++) {
  //       if (rightMax < A[rightIdx]!) {
  //         rightMax = A[rightIdx]!;
  //       }
  //     }
  //     maxDiff = Math.max(maxDiff, rightMax - leftMin);
  //   }
  // }

  // if (maxDiff > 0) {
  //   return maxDiff;
  // }

  // return 0;

  if (A.length === 0) {
    return 0;
  }

  let minSoFar = A[0]!;
  let maxProfit = 0;

  for (let i = 1; i < A.length; i++) {
    const price = A[i]!;
    if (price < minSoFar) {
      minSoFar = price;
    } else if (price - minSoFar > maxProfit) {
      maxProfit = price - minSoFar;
    }
  }

  return maxProfit;
}
