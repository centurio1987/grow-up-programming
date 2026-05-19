/**
 * We draw N discs on a plane. The discs are numbered from 0 to N − 1. An array A of N non-negative integers, specifying the radiuses of the discs, is given. The J-th disc is drawn with its center at (J, 0) and radius A[J].

We say that the J-th disc and K-th disc intersect if J ≠ K and the J-th and K-th discs have at least one common point (assuming that the discs contain their borders).

The figure below shows discs drawn for N = 6 and A as follows:

  A[0] = 1
  A[1] = 5
  A[2] = 2
  A[3] = 1
  A[4] = 4
  A[5] = 0


There are eleven (unordered) pairs of discs that intersect, namely:

discs 1 and 4 intersect, and both intersect with all the other discs;
disc 2 also intersects with discs 0 and 3.
Write a function:

class Solution { public int solution(int[] A); }
that, given an array A describing N discs as explained above, returns the number of (unordered) pairs of intersecting discs. The function should return −1 if the number of intersecting pairs exceeds 10,000,000.

Given array A shown above, the function should return 11, as explained above.

Write an efficient algorithm for the following assumptions:

N is an integer within the range [0..100,000];
each element of array A is an integer within the range [0..2,147,483,647].
 */

/**
 * Number of Disc Intersections
 *
 * $N$개의 원판이 평면 위에 그려진다. $J$번 원판의 중심은 $(J,\, 0)$이고 반지름은 $A[J]$이다.
 * 두 원판 $J$, $K$ ($J \neq K$)가 **교차**한다는 것은 두 원판이 적어도 한 점을 공유함을 의미한다:
 *
 * $$\text{intersect}(J, K) \iff |J - K| \leq A[J] + A[K]$$
 *
 * 각 원판은 수직선 위의 구간으로 표현할 수 있다:
 *
 * $$I_J = [J - A[J],\; J + A[J]]$$
 *
 * 두 구간이 겹치는 경우가 곧 두 원판이 교차하는 경우와 동치이므로,
 * 구간 교차 쌍의 수를 세는 문제로 환원된다.
 *
 * 교차하는 (순서 없는) 원판 쌍의 수를 반환한다.
 * 교차 쌍의 수가 $10{,}000{,}000$을 초과하면 $-1$을 반환한다.
 *
 * @param A - 반지름 배열 ($0 \leq N \leq 100{,}000$, $0 \leq A[J] \leq 2{,}147{,}483{,}647$)
 * @returns 교차하는 원판 쌍의 수, 또는 $-1$ (쌍의 수 $> 10{,}000{,}000$)
 */
export function solution(A: number[]): number {
  // TODO: implement
  // let count = 0;
  // const aRange: number[][] = [];
  // for (let i = 0; i < A.length; i++) {
  //   aRange.push([i - A[i]!, i + A[i]!]);
  // }

  // for (let i = 0; i < aRange.length - 1; i++) {
  //   for (let j = i + 1; j < aRange.length; j++) {
  //     if (aRange[i]![1]! >= aRange[j]![0]!) {
  //       count++;
  //     }
  //   }
  // }

  // return count;

  //Optimized

  const lefts = A.map((r, i) => i - r).sort((a, b) => a - b);
  const rights = A.map((r, i) => i + r).sort((a, b) => a - b);

  let counts = 0;

  let rightIdx = 0;
  for (let leftIdx = 0; leftIdx < lefts.length; leftIdx++) {
    while (rightIdx < rights.length) {
      if (lefts[leftIdx]! <= rights[rightIdx]!) {
        counts = counts + rights.length - rightIdx - 1 - leftIdx;
        break;
      } else {
        rightIdx++;
      }
    }
  }

  if (counts > 10_000_000) return -1;
  return counts;
}
