/**
 * SplayTree (스플레이 트리)
 *
 * 삽입·삭제·탐색 시 접근한 노드를 루트로 이동시키는(splay) 연산으로
 * 지역성(locality)을 활용하는 자기 조정(self-adjusting) BST.
 * 최근에 접근한 원소는 루트 근처에 있어 재접근이 빠르다.
 * 상각(amortized) O(log n)을 보장하며, 개별 연산은 O(n) 최악이 발생할 수 있다.
 *
 * 스플레이 연산 3종:
 * - Zig: 노드의 부모가 루트일 때 단일 회전
 * - Zig-Zig: 노드와 부모가 같은 방향 자식일 때 이중 회전 (부모 먼저)
 * - Zig-Zag: 노드와 부모가 다른 방향 자식일 때 이중 회전 (노드 먼저)
 *
 * 요구사항:
 * - insert(value): 삽입 후 해당 노드를 루트로 스플레이
 * - delete(value): 스플레이 후 루트 제거, 두 서브트리 합병
 * - has(value): 탐색 후 해당(또는 가장 가까운) 노드를 스플레이
 * - min(): 최솟값 반환
 * - max(): 최댓값 반환
 * - inOrder(): 중위 순회 결과 배열 반환
 * - size(): 현재 노드 수 반환
 *
 * 시간복잡도 (상각):
 * - insert: O(log n)
 * - delete: O(log n)
 * - has: O(log n)
 * - min/max: O(log n)
 * - inOrder: O(n)
 * - size: O(1)
 */

class SplayNode<T> {
  value: T;
  left: SplayNode<T> | undefined = undefined;
  right: SplayNode<T> | undefined = undefined;
  parent: SplayNode<T> | undefined = undefined;

  constructor(value: T) {
    this.value = value;
    throw new Error("Not implemented");
  }
}

export class SplayTree<T> {
  private root: SplayNode<T> | undefined = undefined;
  private _size = 0;
  private comparator: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.comparator = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    throw new Error("Not implemented");
  }

  insert(value: T): void {
    throw new Error("Not implemented");
  }

  delete(value: T): boolean {
    throw new Error("Not implemented");
  }

  has(value: T): boolean {
    throw new Error("Not implemented");
  }

  min(): T | undefined {
    throw new Error("Not implemented");
  }

  max(): T | undefined {
    throw new Error("Not implemented");
  }

  inOrder(): T[] {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }
}
