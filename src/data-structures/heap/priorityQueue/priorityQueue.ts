/**
 * PriorityQueue (우선순위 큐)
 *
 * MinHeap 기반의 제네릭 우선순위 큐.
 * 사용자 정의 비교 함수로 임의의 우선순위 순서를 지정할 수 있다.
 *
 * 스토리: 다익스트라 최단 경로 — 방문할 노드를 거리 기준 우선순위 큐로
 * 효율적으로 선택하여 O((V+E) log V) 달성.
 *
 * 요구사항:
 * - constructor(compare): 비교 함수 주입 (compare(a, b) < 0 이면 a가 더 높은 우선순위)
 * - enqueue(item): 원소 삽입 O(log n)
 * - dequeue(): 최우선 원소 꺼내기 O(log n)
 * - peek(): 최우선 원소 조회 O(1)
 * - size(): 현재 크기 O(1)
 * - isEmpty(): 비어있는지 여부 O(1)
 *
 * 시간복잡도:
 * - enqueue: O(log n)
 * - dequeue: O(log n)
 * - peek: O(1)
 * - size: O(1)
 * - isEmpty: O(1)
 *
 * 공간복잡도: O(n)
 */
export class PriorityQueue<T> {
  /**
   * @param compare - 비교 함수. compare(a, b) < 0이면 a가 더 높은 우선순위
   */
  constructor(compare: (a: T, b: T) => number) {
    throw new Error("Not implemented");
  }

  /**
   * 원소를 우선순위 큐에 삽입한다.
   * @param item - 삽입할 원소
   */
  enqueue(item: T): void {
    throw new Error("Not implemented");
  }

  /**
   * 가장 높은 우선순위의 원소를 꺼내 반환한다.
   * 큐가 비어있으면 undefined를 반환한다.
   */
  dequeue(): T | undefined {
    throw new Error("Not implemented");
  }

  /**
   * 가장 높은 우선순위의 원소를 꺼내지 않고 조회한다.
   * 큐가 비어있으면 undefined를 반환한다.
   */
  peek(): T | undefined {
    throw new Error("Not implemented");
  }

  /**
   * 현재 큐에 있는 원소 수를 반환한다.
   */
  size(): number {
    throw new Error("Not implemented");
  }

  /**
   * 큐가 비어있으면 true, 아니면 false를 반환한다.
   */
  isEmpty(): boolean {
    throw new Error("Not implemented");
  }
}
