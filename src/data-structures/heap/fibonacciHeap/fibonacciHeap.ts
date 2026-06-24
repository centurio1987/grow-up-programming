/**
 * FibonacciHeap (피보나치 힙)
 *
 * 루트 리스트(이중 원형 연결 리스트)와 마킹(mark) 메커니즘을 사용하는 병합 가능한 힙.
 * decrease-key가 O(1) 상각이므로 다익스트라 알고리즘의 복잡도를
 * O((V + E) log V) → O(E + V log V)로 개선할 수 있다.
 *
 * 요구사항:
 * - insert(item): 새 원소를 삽입하고 FibNode를 반환한다. O(1) 상각
 * - extractMin(): 최솟값을 꺼내어 반환한다. O(log n) 상각
 * - decreaseKey(node, newItem): 노드의 키를 감소시킨다. O(1) 상각
 * - merge(other): 다른 힙과 병합한 새 힙을 반환한다. O(1)
 * - peek(): 최솟값을 제거하지 않고 반환한다. O(1)
 * - size(): 원소 개수를 반환한다. O(1)
 * - isEmpty(): 힙이 비어있으면 true를 반환한다. O(1)
 *
 * 시간복잡도 (상각):
 * - insert: O(1)
 * - extractMin: O(log n)
 * - decreaseKey: O(1)
 * - merge: O(1)
 * - peek: O(1)
 * - size: O(1)
 * - isEmpty: O(1)
 */

export class FibNode<T> {
  item: T;
  degree: number;
  marked: boolean;
  parent: FibNode<T> | null;
  child: FibNode<T> | null;
  left: FibNode<T>;
  right: FibNode<T>;

  constructor(item: T) {
    this.item = item;
    this.degree = 0;
    this.marked = false;
    this.parent = null;
    this.child = null;
    this.left = this;
    this.right = this;
  }
}

export class FibonacciHeap<T> {
  private min: FibNode<T> | null;
  private _size: number;
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    throw new Error("Not implemented");
  }

  insert(item: T): FibNode<T> {
    throw new Error("Not implemented");
  }

  extractMin(): T | undefined {
    throw new Error("Not implemented");
  }

  decreaseKey(node: FibNode<T>, newItem: T): void {
    throw new Error("Not implemented");
  }

  merge(other: FibonacciHeap<T>): FibonacciHeap<T> {
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
