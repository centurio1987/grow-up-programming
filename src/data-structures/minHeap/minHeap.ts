/**
 * MinHeap (최소 힙)
 *
 * 비교 함수를 받아 커스텀 정렬 순서를 지원하는 제네릭 최소 힙을 구현하라.
 *
 * 요구사항:
 * - constructor(compare): (a, b) => number 형태의 비교 함수를 인자로 받는다.
 *   반환값이 음수이면 a가 b보다 높은 우선순위를 갖는다.
 * - push(item): 아이템을 힙에 삽입한다.
 * - pop(): 최상위(최소) 아이템을 제거하고 반환한다. 비어있으면 undefined를 반환한다.
 * - peek(): 최상위 아이템을 제거 없이 반환한다. 비어있으면 undefined를 반환한다.
 * - size(): 현재 아이템 개수를 반환한다.
 * - isEmpty(): 힙이 비어있으면 true를 반환한다.
 *
 * 시간복잡도:
 * - push: O(log n)
 * - pop: O(log n)
 * - peek: O(1)
 */
export class MinHeap<T> {
  constructor(compare: (a: T, b: T) => number) {
    throw new Error("Not implemented");
  }

  push(item: T): void {
    throw new Error("Not implemented");
  }

  pop(): T | undefined {
    throw new Error("Not implemented");
  }

  peek(): T | undefined {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }

  isEmpty(): boolean {
    throw new Error("Not implemented");
  }
}
