/**
 * Doubly Linked List (이중 연결 리스트)
 *
 * 제네릭 이중 연결 리스트를 구현하라.
 *
 * 요구사항:
 * - prepend(value): 리스트 맨 앞에 노드를 추가한다.
 * - append(value): 리스트 맨 뒤에 노드를 추가한다.
 * - insertAfter(node, value): 주어진 노드 뒤에 새 노드를 삽입하고 새 노드를 반환한다.
 * - remove(node): 주어진 노드를 리스트에서 제거한다.
 * - toArray(): 리스트를 앞에서 뒤 순서로 배열로 반환한다.
 * - size(): 노드 개수를 반환한다.
 *
 * ListNode<T>:
 * - value: T
 * - prev: ListNode<T> | null
 * - next: ListNode<T> | null
 *
 * 시간복잡도:
 * - prepend / append: O(1)
 * - insertAfter / remove (노드 참조 기준): O(1)
 * - toArray: O(n)
 */
export class ListNode<T> {
  value: T;
  prev: ListNode<T> | null = null;
  next: ListNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

export class DoublyLinkedList<T> {
  prepend(value: T): ListNode<T> {
    throw new Error("Not implemented");
  }

  append(value: T): ListNode<T> {
    throw new Error("Not implemented");
  }

  insertAfter(node: ListNode<T>, value: T): ListNode<T> {
    throw new Error("Not implemented");
  }

  remove(node: ListNode<T>): void {
    throw new Error("Not implemented");
  }

  toArray(): T[] {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }
}
