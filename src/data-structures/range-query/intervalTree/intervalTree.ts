/**
 * IntervalTree (구간 트리)
 *
 * 구간 집합을 관리하고 특정 점 또는 구간과 겹치는 구간을 효율적으로 검색한다.
 * 내부적으로 Augmented BST(증강 BST)를 사용하며, 각 노드는 서브트리 내
 * 모든 구간의 최대 high 값(maxHigh)을 추가로 저장한다.
 *
 * [스토리] 회의실 예약 충돌 감지
 * [start, end] 시간대로 예약을 관리하고, 새 예약이 기존 예약과
 * 겹치는지 O(log n)에 확인하며, 충돌하는 모든 예약을 O(k + log n)에 반환한다.
 *
 * 요구사항:
 * - insert(low, high, data?): 구간 삽입, O(log n)
 * - delete(low, high): 구간 삭제, O(log n)
 * - stabQuery(point): 점을 포함하는 모든 구간 반환, O(k + log n)
 * - overlapQuery(low, high): 겹치는 모든 구간 반환, O(k + log n)
 * - size(): 현재 저장된 구간 수, O(1)
 *
 * 시간복잡도:
 * - insert: O(log n) (균형 유지 시)
 * - delete: O(log n)
 * - stabQuery: O(k + log n), k = 결과 구간 수
 * - overlapQuery: O(k + log n)
 *
 * 공간복잡도: O(n)
 */
export class IntervalTree {
  private _size: number;

  constructor() {
    throw new Error("Not implemented");
  }

  /**
   * [low, high] 구간을 삽입한다. 선택적으로 임의 데이터를 연결할 수 있다.
   * @param low 구간 왼쪽 경계 (inclusive)
   * @param high 구간 오른쪽 경계 (inclusive)
   * @param data 구간에 연결할 임의 데이터 (optional)
   */
  insert(low: number, high: number, data?: unknown): void {
    throw new Error("Not implemented");
  }

  /**
   * [low, high] 구간을 삭제한다.
   * @param low 구간 왼쪽 경계
   * @param high 구간 오른쪽 경계
   * @returns 삭제 성공 여부
   */
  delete(low: number, high: number): boolean {
    throw new Error("Not implemented");
  }

  /**
   * 주어진 점(point)을 포함하는 모든 구간을 반환한다.
   * 포함 조건: low <= point <= high
   * @param point 질의할 점
   * @returns 조건을 만족하는 구간의 배열 [[low, high], ...]
   */
  stabQuery(point: number): Array<[number, number]> {
    throw new Error("Not implemented");
  }

  /**
   * [low, high]와 겹치는 모든 구간을 반환한다.
   * 겹침 조건: !(high < storedLow || storedHigh < low)
   * 즉, 두 구간이 완전히 분리되지 않으면 겹침으로 판정.
   * @param low 질의 구간 왼쪽 경계
   * @param high 질의 구간 오른쪽 경계
   * @returns 겹치는 구간의 배열 [[low, high], ...]
   */
  overlapQuery(low: number, high: number): Array<[number, number]> {
    throw new Error("Not implemented");
  }

  /**
   * 현재 저장된 구간의 수를 반환한다.
   */
  size(): number {
    throw new Error("Not implemented");
  }
}
