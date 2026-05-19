/**
 * Insertion Sort (거의 정렬된 배열)
 *
 * N개의 정수로 이루어진 배열 $A$가 주어질 때, 삽입 정렬을 이용해 오름차순 정렬한다.
 * 삽입 정렬의 시간 복잡도는 입력의 역순쌍(inversion) 수 $I(A)$에 비례한다:
 *
 * $$I(A) = \left| \{ (i, j) \mid i < j,\ A[i] > A[j] \} \right|$$
 *
 * $$T(n) = O(n + I(A))$$
 *
 * 따라서 거의 정렬된 입력에서 매우 효율적이다. 입력이 정렬된 경우 $O(n)$,
 * 역순일 경우 최악 $O(n^2)$이다.
 *
 * @param A - 정수 배열 ($1 \leq N \leq 10{,}000$, $-10^9 \leq A[i] \leq 10^9$)
 * @returns 오름차순으로 정렬된 새 배열
 */
export function insertionSort(_A: number[]): number[] {
  throw new Error("Not implemented");
}
