/**
 * XOR 누적 트릭 (Single Number)
 *
 * $N$개의 정수로 이루어진 배열 $\text{nums}$가 주어진다.
 * 정확히 하나의 원소만 홀수 번 등장하고, 나머지는 모두 짝수 번(보통 2회) 등장한다.
 * 홀수 번 등장하는 그 원소를 $O(N)$ 시간, $O(1)$ 공간으로 찾는다.
 *
 * 핵심 트릭 — XOR 의 성질:
 *
 * $$a \oplus a = 0, \qquad a \oplus 0 = a, \qquad a \oplus b = b \oplus a$$
 *
 * 모든 원소를 XOR로 누적하면:
 *
 * $$\text{singleNumberXor}(\text{nums}) = \bigoplus_{i=0}^{N-1} \text{nums}[i]$$
 *
 * 짝수 번 등장한 값들은 서로 상쇄되어 0이 되고, 홀수 번 등장한 값만 남는다.
 *
 * 예시:
 *
 * - $\text{singleNumberXor}([4,1,2,1,2]) = 4$
 * - $\text{singleNumberXor}([7]) = 7$
 *
 * @param nums - 32비트 정수 배열 ($1 \leq N \leq 10^6$, $|nums[i]| < 2^{31}$)
 * @returns 홀수 번 등장하는 유일한 원소
 */
export function singleNumberXor(_nums: number[]): number {
  throw new Error("Not implemented");
}
