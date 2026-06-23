/**
 * Stack (스택)
 *
 * 제네릭 스택을 구현하라.
 *
 * 요구사항:
 * - push(item): 아이템을 스택 맨 위에 추가한다.
 * - pop(): 맨 위 아이템을 제거하고 반환한다. 비어있으면 undefined를 반환한다.
 * - peek(): 맨 위 아이템을 제거하지 않고 반환한다. 비어있으면 undefined를 반환한다.
 * - isEmpty(): 스택이 비어있으면 true를 반환한다.
 * - size(): 현재 아이템 개수를 반환한다.
 *
 * 시간복잡도:
 * - push / pop / peek: O(1)
 */
export class Stack<T> {
  push(item: T): void {
    throw new Error("Not implemented");
  }

  pop(): T | undefined {
    throw new Error("Not implemented");
  }

  peek(): T | undefined {
    throw new Error("Not implemented");
  }

  isEmpty(): boolean {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }
}
