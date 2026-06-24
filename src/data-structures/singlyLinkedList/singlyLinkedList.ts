/**
 * SinglyLinkedList (단방향 연결 리스트)
 *
 * 브라우저 방문 히스토리처럼 뒤로 가기만 필요하고 양방향 순회가 불필요한 경우,
 * 메모리 효율을 위해 단방향 연결 리스트를 사용한다.
 * 각 노드는 값(value)과 다음 노드(next)만 가지며, tail 포인터를 유지해 O(1) append를 보장한다.
 *
 * 요구사항:
 * - prepend(value): 리스트 맨 앞에 노드를 삽입한다. O(1)
 * - append(value): 리스트 맨 뒤에 노드를 삽입한다. O(1) (tail 포인터 이용)
 * - removeFirst(): 맨 앞 노드를 제거하고 그 값을 반환한다. O(1)
 * - find(value): 값이 일치하는 첫 번째 노드를 반환한다. O(n)
 * - toArray(): 리스트의 모든 값을 배열로 반환한다. O(n)
 * - size(): 리스트의 노드 개수를 반환한다. O(1)
 *
 * 시간복잡도:
 * - prepend: O(1)
 * - append: O(1)
 * - removeFirst: O(1)
 * - find: O(n)
 * - toArray: O(n)
 * - size: O(1)
 */

export class ListNode<T> {
  value: T;
  next: ListNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

export class SinglyLinkedList<T> {
  private head: ListNode<T> | null = null;
  private tail: ListNode<T> | null = null;
  private _size: number = 0;

  /**
   * 리스트 맨 앞에 노드를 삽입한다.
   * @returns 삽입된 새 노드
   */
  prepend(value: T): ListNode<T> {
    throw new Error("Not implemented");
  }

  /**
   * 리스트 맨 뒤에 노드를 삽입한다.
   * @returns 삽입된 새 노드
   */
  append(value: T): ListNode<T> {
    throw new Error("Not implemented");
  }

  /**
   * 맨 앞 노드를 제거하고 그 값을 반환한다.
   * 리스트가 비어있으면 undefined를 반환한다.
   */
  removeFirst(): T | undefined {
    throw new Error("Not implemented");
  }

  /**
   * 값이 일치하는 첫 번째 노드를 반환한다.
   * 없으면 null을 반환한다.
   */
  find(value: T): ListNode<T> | null {
    throw new Error("Not implemented");
  }

  /**
   * 리스트의 모든 값을 head → tail 순서의 배열로 반환한다.
   */
  toArray(): T[] {
    throw new Error("Not implemented");
  }

  /**
   * 리스트의 노드 개수를 반환한다.
   */
  size(): number {
    throw new Error("Not implemented");
  }
}
