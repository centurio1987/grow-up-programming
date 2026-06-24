/**
 * PairingHeap (쌍 힙)
 *
 * 각 노드가 첫 번째 자식(leftChild)과 다음 형제(nextSibling)를 가리키는
 * 단순한 트리 기반 힙. Fibonacci Heap보다 구현이 간단하면서 실용적으로
 * 유사한 상각 성능을 보인다.
 *
 * 요구사항:
 * - insert(item): 새 원소를 삽입한다. O(1)
 * - extractMin(): 최솟값을 꺼내어 반환한다. O(log n) 상각
 * - merge(other): 다른 힙과 병합한 새 힙을 반환한다. O(1)
 * - peek(): 최솟값을 제거하지 않고 반환한다. O(1)
 * - size(): 원소 개수를 반환한다. O(1)
 * - isEmpty(): 힙이 비어있으면 true를 반환한다. O(1)
 *
 * 시간복잡도:
 * - insert: O(1)
 * - extractMin: O(log n) 상각
 * - merge: O(1)
 * - peek: O(1)
 * - size: O(1)
 * - isEmpty: O(1)
 */

export class PairingNode<T> {
  item: T;
  leftChild: PairingNode<T> | null;
  nextSibling: PairingNode<T> | null;
  parent: PairingNode<T> | null;

  constructor(item: T) {
    this.item = item;
    this.leftChild = null;
    this.nextSibling = null;
    this.parent = null;
  }
}

export class PairingHeap<T> {
  private root: PairingNode<T> | null;
  private _size: number;
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    throw new Error("Not implemented");
  }

  insert(item: T): void {
    throw new Error("Not implemented");
  }

  extractMin(): T | undefined {
    throw new Error("Not implemented");
  }

  merge(other: PairingHeap<T>): PairingHeap<T> {
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
