/**
 * Counting Sort (작은 정수 키 정렬)
 *
 * N개의 비음 정수로 이루어진 배열 $A$가 주어지고, 모든 원소가
 * $0 \leq A[i] \leq k$ 범위에 있을 때, 오름차순 정렬된 결과를 반환한다.
 *
 * 각 키 $v$의 빈도수 $C[v] = |\{ i \mid A[i] = v \}|$를 계산한 뒤,
 * 누적합으로 출력 위치를 정한다. 시간 복잡도:
 *
 * $$T(n, k) = O(n + k)$$
 *
 * 작은 정수 범위에서 비교 기반 정렬의 $\Omega(n \log n)$ 하한을 회피한다.
 *
 * @param A - 비음 정수 배열 ($1 \leq N \leq 100{,}000$, $0 \leq A[i] \leq 1{,}000$)
 * @returns 오름차순으로 정렬된 새 배열
 */
export function countingSort(_A: number[]): number[] {
  throw new Error("Not implemented");
}
