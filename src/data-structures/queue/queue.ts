/**
 * Queue (큐)
 *
 * 제네릭 FIFO 큐를 구현하라.
 *
 * 요구사항:
 * - enqueue(item): 큐 뒤에 아이템을 추가한다.
 * - dequeue(): 큐 앞에서 아이템을 제거하고 반환한다. 비어있으면 undefined를 반환한다.
 * - front(): 큐 앞 아이템을 제거 없이 반환한다. 비어있으면 undefined를 반환한다.
 * - isEmpty(): 큐가 비어있으면 true를 반환한다.
 * - size(): 현재 아이템 개수를 반환한다.
 *
 * 시간복잡도:
 * - enqueue / dequeue / front: amortized O(1)
 */
export class Queue<T> {
  enqueue(item: T): void {
    throw new Error("Not implemented");
  }

  dequeue(): T | undefined {
    throw new Error("Not implemented");
  }

  front(): T | undefined {
    throw new Error("Not implemented");
  }

  isEmpty(): boolean {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }
}
