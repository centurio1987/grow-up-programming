/**
 * Circular Buffer (원형 버퍼, Ring Buffer)
 *
 * 고정 용량의 원형 버퍼를 구현하라.
 *
 * 요구사항:
 * - constructor(capacity): 버퍼 최대 용량을 설정한다. capacity >= 1이 보장된다.
 * - write(item): 버퍼 뒤에 아이템을 추가한다.
 *   버퍼가 꽉 찬 경우 가장 오래된 항목을 덮어쓴다.
 * - read(): 가장 오래된 아이템을 제거하고 반환한다. 비어있으면 undefined를 반환한다.
 * - peek(): 가장 오래된 아이템을 제거 없이 반환한다. 비어있으면 undefined를 반환한다.
 * - isFull(): 버퍼가 꽉 찼으면 true를 반환한다.
 * - isEmpty(): 버퍼가 비어있으면 true를 반환한다.
 * - size(): 현재 아이템 개수를 반환한다.
 *
 * 시간복잡도:
 * - write / read / peek: O(1)
 * - 내부 배열은 고정 크기(capacity)를 사용해야 한다.
 */
export class CircularBuffer<T> {
  constructor(capacity: number) {
    throw new Error("Not implemented");
  }

  write(item: T): void {
    throw new Error("Not implemented");
  }

  read(): T | undefined {
    throw new Error("Not implemented");
  }

  peek(): T | undefined {
    throw new Error("Not implemented");
  }

  isFull(): boolean {
    throw new Error("Not implemented");
  }

  isEmpty(): boolean {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }
}
