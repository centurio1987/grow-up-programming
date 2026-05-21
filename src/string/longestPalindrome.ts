/**
 * 최장 회문 부분 문자열 (Manacher's Algorithm)
 *
 * 문자열 $s$가 주어질 때, $s$의 부분 문자열 중 회문(Palindrome)인 가장 긴
 * 부분 문자열을 반환한다.
 *
 * 부분 문자열 $s[i \ldots j]$가 회문이라는 것은:
 *
 * $$\forall k \in [0, j - i],\; s[i + k] = s[j - k]$$
 *
 * Manacher's Algorithm은 문자 사이에 더미 문자를 삽입하여 홀수/짝수 길이를 통합한 뒤,
 * 각 중심에서의 최대 반지름을 $O(n)$에 계산한다.
 *
 * 답이 여러 개라면 그중 어느 하나를 반환해도 된다.
 *
 * @param s - 입력 문자열 ($0 \leq |s| \leq 10^{5}$)
 * @returns 가장 긴 회문 부분 문자열. 빈 문자열 입력 시 빈 문자열을 반환한다.
 */
export function longestPalindrome(s: string): string {
  throw new Error("Not implemented");
}
