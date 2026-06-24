/**
 * MaxHeap (최대 힙)
 *
 * 최댓값 우선 힙. 사용자 정의 비교 함수로 임의의 "최댓값" 기준을 지정할 수 있다.
 * MinHeap과 구조는 동일하지만 비교 방향이 반전된다.
 *
 * 스토리: 실시간 Top-K 스트림 처리 — 무한 데이터 스트림에서
 * 항상 K번째로 큰 값을 O(log K)에 유지.
 *
 * 요구사항:
 * - constructor(compare): 비교 함수 주입 (compare(a, b) > 0 이면 a가 b보다 크다)
 * - push(item): 원소 삽입 O(log n)
 * - pop(): 최댓값 원소 꺼내기 O(log n)
 * - peek(): 최댓값 원소 조회 O(1)
 * - size(): 현재 크기 O(1)
 * - isEmpty(): 비어있는지 여부 O(1)
 *
 * 시간복잡도:
 * - push: O(log n)
 * - pop: O(log n)
 * - peek: O(1)
 * - size: O(1)
 * - isEmpty: O(1)
 *
 * 공간복잡도: O(n)
 */
export class MaxHeap<T> {
  /**
   * @param compare - 비교 함수. compare(a, b) > 0이면 a가 b보다 크다 (최댓값 우선)
   */
  constructor(compare: (a: T, b: T) => number) {
    throw new Error("Not implemented");
  }

  /**
   * 원소를 힙에 삽입한다.
   * @param item - 삽입할 원소
   */
  push(item: T): void {
    throw new Error("Not implemented");
  }

  /**
   * 힙에서 최댓값 원소를 꺼내 반환한다.
   * 힙이 비어있으면 undefined를 반환한다.
   */
  pop(): T | undefined {
    throw new Error("Not implemented");
  }

  /**
   * 힙에서 최댓값 원소를 꺼내지 않고 조회한다.
   * 힙이 비어있으면 undefined를 반환한다.
   */
  peek(): T | undefined {
    throw new Error("Not implemented");
  }

  /**
   * 현재 힙에 있는 원소 수를 반환한다.
   */
  size(): number {
    throw new Error("Not implemented");
  }

  /**
   * 힙이 비어있으면 true, 아니면 false를 반환한다.
   */
  isEmpty(): boolean {
    throw new Error("Not implemented");
  }
}
