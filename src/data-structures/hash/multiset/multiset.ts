/**
 * Multiset (멀티셋 — 중복 허용 정렬 집합)
 *
 * 중복된 원소를 허용하면서 정렬 순서를 유지하는 자료구조입니다.
 * C++의 std::multiset과 유사하게 동작하며, 내부적으로 AVL 트리 대신
 * 정렬된 배열 기반의 이진 탐색으로 O(log n) 접근을 제공합니다.
 *
 * 주요 활용: 슬라이딩 윈도우 중앙값
 * - 스트리밍 데이터의 현재 윈도우에서 중앙값을 O(log n)에 유지
 * - lower(작은 절반)와 upper(큰 절반) 두 Multiset으로 관리
 *
 * 요구사항:
 * - add(item): 원소 삽입, 정렬 순서 유지
 * - delete(item): 해당 원소 하나만 제거
 * - deleteAll(item): 해당 원소 모두 제거, 제거된 수 반환
 * - has(item): 원소 존재 여부
 * - count(item): 특정 원소 개수
 * - min(): 최솟값
 * - max(): 최댓값
 * - size(): 총 원소 수 (중복 포함)
 * - toArray(): 정렬된 배열 반환
 *
 * 시간복잡도:
 * - add: O(log n) 탐색 + O(n) 삽입 (배열 기반)
 * - delete / has / count: O(log n)
 * - min / max: O(1)
 * - toArray: O(n)
 */
export class Multiset<T> {
  private _data: T[];
  private _comparator: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    throw new Error("Not implemented");
  }

  /** 원소를 정렬 위치에 삽입합니다. O(n) */
  add(item: T): void {
    throw new Error("Not implemented");
  }

  /** 해당 원소를 하나만 제거합니다. 없으면 false 반환. O(n) */
  delete(item: T): boolean {
    throw new Error("Not implemented");
  }

  /** 해당 원소를 모두 제거하고 제거된 수를 반환합니다. O(n) */
  deleteAll(item: T): number {
    throw new Error("Not implemented");
  }

  /** 원소의 존재 여부를 반환합니다. O(log n) */
  has(item: T): boolean {
    throw new Error("Not implemented");
  }

  /** 특정 원소의 개수를 반환합니다. O(log n) */
  count(item: T): number {
    throw new Error("Not implemented");
  }

  /** 최솟값을 반환합니다. 비어있으면 undefined. O(1) */
  min(): T | undefined {
    throw new Error("Not implemented");
  }

  /** 최댓값을 반환합니다. 비어있으면 undefined. O(1) */
  max(): T | undefined {
    throw new Error("Not implemented");
  }

  /** 총 원소 수(중복 포함)를 반환합니다. O(1) */
  size(): number {
    throw new Error("Not implemented");
  }

  /** 정렬된 배열을 반환합니다. O(n) */
  toArray(): T[] {
    throw new Error("Not implemented");
  }

  /** 이진 탐색으로 삽입 위치(leftmost)를 찾습니다. O(log n) */
  private lowerBound(item: T): number {
    throw new Error("Not implemented");
  }

  /** 이진 탐색으로 upper bound를 찾습니다. O(log n) */
  private upperBound(item: T): number {
    throw new Error("Not implemented");
  }
}
