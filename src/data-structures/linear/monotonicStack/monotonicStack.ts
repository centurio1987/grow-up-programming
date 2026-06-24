/**
 * MonotonicStack (단조 스택)
 *
 * 배열에서 각 원소에 대해 "다음 더 큰 원소", "이전 더 큰 원소",
 * "다음 더 작은 원소"의 인덱스를 O(n)에 구하는 유틸리티 클래스.
 *
 * 스토리: 주식 가격 분석 — 오늘 이후 처음으로 오늘보다 비싼 날이
 * 언제인지 O(n)에 한 번에 구하기.
 *
 * 요구사항:
 * - nextGreater(arr): 각 인덱스에 대해 오른쪽의 다음 더 큰 원소 인덱스 반환, 없으면 -1
 * - prevGreater(arr): 각 인덱스에 대해 왼쪽의 이전 더 큰 원소 인덱스 반환, 없으면 -1
 * - nextSmaller(arr): 각 인덱스에 대해 오른쪽의 다음 더 작은 원소 인덱스 반환, 없으면 -1
 *
 * 시간복잡도:
 * - nextGreater: O(n)
 * - prevGreater: O(n)
 * - nextSmaller: O(n)
 *
 * 공간복잡도:
 * - 모든 메서드: O(n) (스택 + 결과 배열)
 */
export class MonotonicStack {
  /**
   * 각 인덱스에 대해 오른쪽의 다음 더 큰 원소 인덱스를 반환한다.
   * 없으면 -1.
   *
   * @param arr - 입력 배열
   * @returns 각 인덱스 i에 대한 nextGreater 인덱스 배열
   */
  nextGreater(arr: number[]): number[] {
    throw new Error("Not implemented");
  }

  /**
   * 각 인덱스에 대해 왼쪽의 이전 더 큰 원소 인덱스를 반환한다.
   * 없으면 -1.
   *
   * @param arr - 입력 배열
   * @returns 각 인덱스 i에 대한 prevGreater 인덱스 배열
   */
  prevGreater(arr: number[]): number[] {
    throw new Error("Not implemented");
  }

  /**
   * 각 인덱스에 대해 오른쪽의 다음 더 작은 원소 인덱스를 반환한다.
   * 없으면 -1.
   *
   * @param arr - 입력 배열
   * @returns 각 인덱스 i에 대한 nextSmaller 인덱스 배열
   */
  nextSmaller(arr: number[]): number[] {
    throw new Error("Not implemented");
  }
}
