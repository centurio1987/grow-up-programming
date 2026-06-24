/**
 * MonotonicQueue (단조 큐)
 *
 * 슬라이딩 윈도우 내의 최댓값/최솟값을 O(1)에 갱신하고
 * 전체 배열에 대해 O(n)에 결과를 구하는 자료구조.
 *
 * 스토리: 실시간 기온 모니터링 — 최근 k분 동안의 최고/최저 기온을
 * 매 분마다 O(1)에 갱신.
 *
 * 요구사항:
 * - slidingWindowMax(nums, k): 크기 k인 슬라이딩 윈도우의 최댓값 배열 반환
 * - slidingWindowMin(nums, k): 크기 k인 슬라이딩 윈도우의 최솟값 배열 반환
 *
 * 시간복잡도:
 * - slidingWindowMax: O(n) — 각 원소 최대 한 번 push/pop
 * - slidingWindowMin: O(n) — 각 원소 최대 한 번 push/pop
 *
 * 공간복잡도:
 * - 모든 메서드: O(k) (덱 크기는 최대 k)
 */
export class MonotonicQueue {
  /**
   * nums 배열에서 크기 k인 슬라이딩 윈도우의 최댓값 배열을 반환한다.
   * 결과 배열 길이: nums.length - k + 1
   *
   * @param nums - 입력 배열
   * @param k - 윈도우 크기 (1 <= k <= nums.length)
   * @returns 각 윈도우의 최댓값 배열
   */
  slidingWindowMax(nums: number[], k: number): number[] {
    throw new Error("Not implemented");
  }

  /**
   * nums 배열에서 크기 k인 슬라이딩 윈도우의 최솟값 배열을 반환한다.
   * 결과 배열 길이: nums.length - k + 1
   *
   * @param nums - 입력 배열
   * @param k - 윈도우 크기 (1 <= k <= nums.length)
   * @returns 각 윈도우의 최솟값 배열
   */
  slidingWindowMin(nums: number[], k: number): number[] {
    throw new Error("Not implemented");
  }
}
