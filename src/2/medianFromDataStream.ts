/**
 * Find Median from Data Stream (스트림에서 중앙값)
 *
 * 실수가 하나씩 들어오는 스트림에서 매 순간 지금까지 들어온 수들의 중앙값을 구한다.
 *
 * - $N$개의 수가 있을 때 중앙값은
 *
 *   $$\text{median} = \begin{cases}
 *     \text{sort}(S)\left[\frac{N-1}{2}\right] & (N \text{이 홀수}) \\\\
 *     \dfrac{\text{sort}(S)\left[\frac{N}{2}-1\right] + \text{sort}(S)\left[\frac{N}{2}\right]}{2} & (N \text{이 짝수})
 *   \end{cases}$$
 *
 * 두 개의 힙으로 효율적으로 유지한다:
 *
 * - `lo`: max-heap, 하위 절반을 보관 (크기는 $\lceil N/2 \rceil$)
 * - `hi`: min-heap, 상위 절반을 보관 (크기는 $\lfloor N/2 \rfloor$)
 *
 * 삽입 $O(\log N)$, 중앙값 조회 $O(1)$.
 *
 * 제약: 호출 횟수 $1 \leq Q \leq 100{,}000$, $-10^9 \leq \text{num} \leq 10^9$.
 */
export class MedianFinder {
  /**
   * 스트림에 정수 `num`을 추가한다.
   *
   * @param num - 새로 들어온 정수
   */
  addNum(num: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 지금까지 추가된 모든 수들의 중앙값을 반환한다.
   *
   * @returns 중앙값 (짝수 개일 경우 두 중앙 원소의 평균)
   */
  findMedian(): number {
    throw new Error("Not implemented");
  }
}
