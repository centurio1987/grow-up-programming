/**
 * BinomialHeap (이항 힙)
 *
 * 이항 트리(Binomial Tree)들의 리스트로 구성된 병합 가능한 힙.
 * 각 이항 트리 B_k는 2^k 개의 노드를 가지며 힙 속성을 만족한다.
 * 두 이항 힙의 병합이 O(log n)에 가능하며, 이는 분산 작업 큐 합산 등에 유리하다.
 *
 * 요구사항:
 * - insert(item): 새 원소를 삽입한다. O(log n) 상각
 * - extractMin(): 최솟값을 꺼내어 반환한다. O(log n)
 * - peek(): 최솟값을 제거하지 않고 반환한다. O(log n)
 * - merge(other): 다른 힙과 병합한 새 힙을 반환한다. O(log n)
 * - size(): 원소 개수를 반환한다. O(1)
 * - isEmpty(): 힙이 비어있으면 true를 반환한다. O(1)
 *
 * 시간복잡도:
 * - insert: O(log n) 상각
 * - extractMin: O(log n)
 * - peek: O(log n)
 * - merge: O(log n)
 * - size: O(1)
 * - isEmpty: O(1)
 */

export class BinomialNode<T> {
  item: T;
  degree: number;
  children: BinomialNode<T>[];
  parent: BinomialNode<T> | null;

  constructor(item: T) {
    this.item = item;
    this.degree = 0;
    this.children = [];
    this.parent = null;
  }
}

export class BinomialHeap<T> {
  private roots: BinomialNode<T>[];
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

  peek(): T | undefined {
    throw new Error("Not implemented");
  }

  merge(other: BinomialHeap<T>): BinomialHeap<T> {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }

  isEmpty(): boolean {
    throw new Error("Not implemented");
  }
}
