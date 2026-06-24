/**
 * HashSet (해시 셋)
 *
 * HashMapChaining을 기반으로 구현하는 집합(Set) 자료구조.
 * 중복 없이 고유한 요소를 O(1) 평균으로 삽입·조회·삭제하며,
 * 집합 연산(합집합, 교집합, 차집합)을 지원한다.
 *
 * 스토리: 소셜 네트워크 팔로우 시스템 — 팔로우 여부 O(1) 확인,
 * 두 사용자의 공통 팔로우(교집합) 계산, 한 사용자만 팔로우하는
 * 계정(차집합) 추출.
 *
 * 요구사항:
 * - add(item): 항목을 집합에 추가한다.
 * - has(item): 항목 존재 여부를 반환한다.
 * - delete(item): 항목을 삭제하고 성공 여부를 반환한다.
 * - size(): 현재 저장된 항목 수를 반환한다.
 * - values(): 모든 항목 배열을 반환한다.
 * - union(other): 두 집합의 합집합을 새 HashSet으로 반환한다.
 * - intersection(other): 두 집합의 교집합을 새 HashSet으로 반환한다.
 * - difference(other): this에는 있고 other에는 없는 차집합을 반환한다.
 *
 * 시간복잡도:
 * - add: O(1) 평균
 * - has: O(1) 평균
 * - delete: O(1) 평균
 * - values: O(n)
 * - union: O(n + m)
 * - intersection: O(n)
 * - difference: O(n)
 */
export class HashSet<T> {
  constructor(initialCapacity: number = 16) {
    throw new Error("Not implemented");
  }

  add(item: T): void {
    throw new Error("Not implemented");
  }

  has(item: T): boolean {
    throw new Error("Not implemented");
  }

  delete(item: T): boolean {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }

  values(): T[] {
    throw new Error("Not implemented");
  }

  /** 합집합: this ∪ other — O(n + m) */
  union(other: HashSet<T>): HashSet<T> {
    throw new Error("Not implemented");
  }

  /** 교집합: this ∩ other — O(n) */
  intersection(other: HashSet<T>): HashSet<T> {
    throw new Error("Not implemented");
  }

  /** 차집합: this \ other — O(n) */
  difference(other: HashSet<T>): HashSet<T> {
    throw new Error("Not implemented");
  }
}
