/**
 * You are given N counters, initially set to 0, and you have two possible operations on them:

increase(X) − counter X is increased by 1,
max counter − all counters are set to the maximum value of any counter.
A non-empty array A of M integers is given. This array represents consecutive operations:

if A[K] = X, such that 1 ≤ X ≤ N, then operation K is increase(X),
if A[K] = N + 1 then operation K is max counter.
For example, given integer N = 5 and array A such that:

    A[0] = 3
    A[1] = 4
    A[2] = 4
    A[3] = 6
    A[4] = 1
    A[5] = 4
    A[6] = 4
the values of the counters after each consecutive operation will be:

    (0, 0, 1, 0, 0)
    (0, 0, 1, 1, 0)
    (0, 0, 1, 2, 0)
    (2, 2, 2, 2, 2)
    (3, 2, 2, 2, 2)
    (3, 2, 2, 3, 2)
    (3, 2, 2, 4, 2)
The goal is to calculate the value of every counter after all operations.

Write a function:

function solution(N: number, A: number[]): number[];

that, given an integer N and a non-empty array A consisting of M integers, returns a sequence of integers representing the values of the counters.

Result array should be returned as an array of integers.

For example, given:

    A[0] = 3
    A[1] = 4
    A[2] = 4
    A[3] = 6
    A[4] = 1
    A[5] = 4
    A[6] = 4
the function should return [3, 2, 2, 4, 2], as explained above.

Write an efficient algorithm for the following assumptions:

N and M are integers within the range [1..100,000];
each element of array A is an integer within the range [1..N + 1].
 */

/**
 * Max Counters
 *
 * N개의 카운터 $C = [c_1, c_2, \ldots, c_N]$ 가 초기값 0으로 주어진다.
 * M개의 연산 배열 $A$에 대해 두 가지 연산을 순서대로 수행한다:
 *
 * $$\text{op}(K) = \begin{cases}
 *   c_{A[K]} \leftarrow c_{A[K]} + 1 & \text{if } 1 \leq A[K] \leq N \\
 *   c_i \leftarrow \max(C) \quad \forall i & \text{if } A[K] = N + 1
 * \end{cases}$$
 *
 * 모든 연산 후 카운터 배열을 반환한다.
 *
 * 효율적 구현을 위해 두 개의 보조값을 유지한다:
 * - $\text{curMax}$: 현재까지의 최댓값
 * - $\text{floorVal}$: 마지막 max counter 연산이 설정한 하한값
 *
 * @param N - 카운터 수 ($1 \leq N \leq 100{,}000$)
 * @param A - 연산 배열 ($1 \leq M \leq 100{,}000$, $1 \leq A[K] \leq N+1$)
 * @returns 모든 연산 후 카운터 배열 (길이 N)
 */
export function maxCounters(N: number, A: number[]): number[] {
  // TODO: implement
  // const counters = Array.from({ length: N }, () => 0);

  // let max = 0;
  // for (let elem of A) {
  //   if (1 <= elem && elem <= N) {
  //     counters[elem - 1] = counters[elem - 1]! + 1;
  //     if (max < counters[elem - 1]!) {
  //       max = counters[elem - 1]!;
  //     }
  //   } else if (elem === N + 1) {
  //     for (let i = 0; i < counters.length; i++) {
  //       counters[i] = max;
  //     }
  //   }
  // }

  // return counters;

  //Optimized
  let trackedMax = 0;
  let max = 0;
  const counter = Array.from({ length: N }, () => 0);

  for (let elem of A) {
    if (1 <= elem && elem <= N) {
      if (counter[elem - 1]! < max) {
        counter[elem - 1]! = max;
      }
      counter[elem - 1]!++;
      if (counter[elem - 1]! > trackedMax) {
        trackedMax = counter[elem - 1]!;
      }
    } else if (elem === N + 1) {
      max = trackedMax;
    } else {
      throw new Error();
    }
  }

  for (let idx in counter) {
    if (counter[idx]! < max) {
      counter[idx] = max;
    }
  }

  return counter;
}
