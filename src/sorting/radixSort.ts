/**
 * Radix Sort (고정 길이 문자열·정수 정렬)
 *
 * N개의 비음 정수 배열 $A$를 자릿수 단위로 안정 정렬(보통 Counting Sort)을
 * 반복 적용하여 정렬한다. 자릿수 개수를 $d$, 자릿수 진법을 $k$라 할 때:
 *
 * $$T(n, d, k) = O(d \cdot (n + k))$$
 *
 * 정수 범위가 $[0, U]$이고 진법 $k$라면 $d = \lceil \log_k(U+1) \rceil$.
 * LSD(Least Significant Digit) 방식에서는 자릿수별 정렬이 안정해야 한다.
 *
 * @param A - 비음 정수 배열 ($1 \leq N \leq 100{,}000$, $0 \leq A[i] \leq 10^9$)
 * @returns 오름차순으로 정렬된 새 배열
 */
export function radixSort(A: number[]): number[] {
  throw new Error("Not implemented");
}
