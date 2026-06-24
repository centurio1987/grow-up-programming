/**
 * Deque (덱, Double-Ended Queue)
 *
 * 양쪽 끝에서 삽입/삭제가 가능한 제네릭 덱을 구현하라.
 *
 * 요구사항:
 * - pushFront(item): 덱 앞에 아이템을 추가한다.
 * - pushBack(item): 덱 뒤에 아이템을 추가한다.
 * - popFront(): 앞 아이템을 제거하고 반환한다. 비어있으면 undefined를 반환한다.
 * - popBack(): 뒤 아이템을 제거하고 반환한다. 비어있으면 undefined를 반환한다.
 * - peekFront(): 앞 아이템을 제거 없이 반환한다. 비어있으면 undefined를 반환한다.
 * - peekBack(): 뒤 아이템을 제거 없이 반환한다. 비어있으면 undefined를 반환한다.
 * - isEmpty(): 덱이 비어있으면 true를 반환한다.
 * - size(): 현재 아이템 개수를 반환한다.
 *
 * 시간복잡도:
 * - 모든 연산: amortized O(1)
 */
export class Deque<T> {
  pushFront(item: T): void {
    throw new Error("Not implemented");
  }

  pushBack(item: T): void {
    throw new Error("Not implemented");
  }

  popFront(): T | undefined {
    throw new Error("Not implemented");
  }

  popBack(): T | undefined {
    throw new Error("Not implemented");
  }

  peekFront(): T | undefined {
    throw new Error("Not implemented");
  }

  peekBack(): T | undefined {
    throw new Error("Not implemented");
  }

  isEmpty(): boolean {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }
}
