/**
 * A binary gap within a positive integer N is any maximal sequence of consecutive zeros that is surrounded by ones at both ends in the binary representation of N.

For example, number 9 has binary representation 1001 and contains a binary gap of length 2. The number 529 has binary representation 1000010001 and contains two binary gaps: one of length 4 and one of length 3. The number 20 has binary representation 10100 and contains one binary gap of length 1. The number 15 has binary representation 1111 and has no binary gaps. The number 32 has binary representation 100000 and has no binary gaps.

Write a function:

class Solution { public int solution(int N); }
that, given a positive integer N, returns the length of its longest binary gap. The function should return 0 if N doesn't contain a binary gap.

For example, given N = 1041 the function should return 5, because N has binary representation 10000010001 and so its longest binary gap is of length 5. Given N = 32 the function should return 0, because N has binary representation '100000' and thus no binary gaps.

Write an efficient algorithm for the following assumptions:

N is an integer within the range [1..2,147,483,647].
 */

/**
 * Binary Gap
 *
 * 양의 정수 $N$ 의 이진 표현에서, 양쪽이 1로 둘러싸인 연속된 0의 부분열을 **binary gap** 이라 한다.
 *
 * 이진 표현 $b_{k} b_{k-1} \cdots b_1 b_0$ 에서 1의 위치 집합을
 * $P = \{ i \mid b_i = 1 \}$ 로 정의하고,
 * $P$ 를 오름차순으로 정렬한 수열을 $p_0 < p_1 < \cdots < p_{m-1}$ 이라 하면,
 * 인접한 두 1 사이의 gap 길이는:
 *
 * $$g_j = p_{j+1} - p_j - 1, \quad j = 0, 1, \ldots, m-2$$
 *
 * 반환값:
 *
 * $$\text{binaryGap}(N) = \begin{cases} \max\{g_j\} & \text{if } m \geq 2 \\ 0 & \text{if } m < 2 \end{cases}$$
 *
 * @param n - 양의 정수 ($1 \leq n \leq 2{,}147{,}483{,}647$)
 * @returns 가장 긴 binary gap의 길이, 없으면 0
 */
export function binaryGap(n: number): number {
  let max = 0;
  let count = 0;
  let x_ = n;

  while (x_ > 0) {
    const moded = x_ % 2;
    if (moded === 1) {
      if (count > max) {
        max = count;
      }
      count = 0;
    } else {
      count++;
    }
    x_ = Math.floor(x_ / 2);
  }

  return max;
}
