/**
 * LeftistHeap (좌향 힙)
 *
 * 왼쪽 경로(leftmost path)를 최대한 짧게 유지하는 이진 트리 기반 힙.
 * 'rank'(또는 s-value) 속성으로 오른쪽 경로 길이가 항상 최솟값이 되도록 유지한다.
 * 두 힙의 병합이 O(log n)에 가능하며, 삽입/추출도 병합으로 구현된다.
 *
 * 요구사항:
 * - insert(item): 새 원소를 삽입한다. O(log n)
 * - extractMin(): 최솟값을 꺼내어 반환한다. O(log n)
 * - merge(other): 다른 힙과 병합한 새 힙을 반환한다. O(log n)
 * - peek(): 최솟값을 제거하지 않고 반환한다. O(1)
 * - size(): 원소 개수를 반환한다. O(1)
 * - isEmpty(): 힙이 비어있으면 true를 반환한다. O(1)
 *
 * 시간복잡도:
 * - insert: O(log n)
 * - extractMin: O(log n)
 * - merge: O(log n)
 * - peek: O(1)
 * - size: O(1)
 * - isEmpty: O(1)
 */

export class LeftistNode<T> {
  item: T;
  rank: number;
  left: LeftistNode<T> | null;
  right: LeftistNode<T> | null;

  constructor(item: T) {
    this.item = item;
    this.rank = 1;
    this.left = null;
    this.right = null;
  }
}

export class LeftistHeap<T> {
  private root: LeftistNode<T> | null;
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

  merge(other: LeftistHeap<T>): LeftistHeap<T> {
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
