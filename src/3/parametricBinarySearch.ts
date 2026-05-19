/**
 * Parametric Binary Search — Split Array Largest Sum
 *
 * 음이 아닌 정수 배열 $A$와 정수 $K$가 주어진다.
 * $A$를 $K$개의 비어있지 않은 연속 부분 배열로 분할할 때,
 * 각 부분 배열 합의 최댓값을 최소화하는 값을 반환한다.
 *
 * 분할 $\pi = (S_1, S_2, \ldots, S_K)$를 $A$의 $K$개 연속 분할이라 하면:
 *
 * $$\text{parametricBinarySearch}(A, K) = \min_{\pi} \max_{1 \leq j \leq K} \sum_{i \in S_j} A[i]$$
 *
 * 핵심 아이디어 — **답을 이분 탐색**한다.
 *
 * 후보 답 $m$에 대해 판정 함수 $\text{feasible}(m)$ 을 정의한다:
 *
 * $$\text{feasible}(m) = \text{Greedy하게 부분 합이 } m \text{을 넘지 않도록 묶었을 때 묶음 수} \leq K$$
 *
 * $\text{feasible}(m)$ 은 $m$에 대해 단조 증가하므로, 다음 범위에서 이분 탐색한다:
 *
 * $$\text{lo} = \max_i A[i], \quad \text{hi} = \sum_i A[i]$$
 *
 * 반복 불변식: 정답은 항상 $[\text{lo}, \text{hi}]$ 구간에 존재한다.
 *
 * 시간 복잡도: $O(N \log(\sum A))$, 공간 복잡도: $O(1)$.
 *
 * 제약 조건:
 * - $1 \leq N \leq 10^{5}$
 * - $1 \leq K \leq N$
 * - $0 \leq A[i] \leq 10^{6}$
 *
 * @param A - 음이 아닌 정수 배열
 * @param K - 분할할 부분 배열 개수 ($1 \leq K \leq N$)
 * @returns 가능한 분할들 중 부분 합 최댓값의 최솟값
 */
export function parametricBinarySearch(_A: number[], _K: number): number {
  throw new Error("Not implemented");
}
