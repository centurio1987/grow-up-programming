/**
 * AVLTree (AVL 트리)
 *
 * 모든 노드에서 왼쪽/오른쪽 서브트리의 높이 차이가 1 이하가 되도록
 * 삽입/삭제 후 회전(rotation)으로 균형을 유지하는 이진 탐색 트리.
 * 최악의 경우에도 O(log n)을 보장하여 데이터베이스 인덱스에 적합하다.
 *
 * 요구사항:
 * - insert(value): 값 삽입 후 회전으로 균형 유지
 * - delete(value): 값 삭제 후 회전으로 균형 유지
 * - has(value): 값 포함 여부 반환
 * - min(): 최솟값 반환
 * - max(): 최댓값 반환
 * - inOrder(): 중위 순회 결과 배열 반환
 * - size(): 현재 노드 수 반환
 * - height(): 루트의 높이 반환
 *
 * 시간복잡도:
 * - insert: O(log n)
 * - delete: O(log n)
 * - has: O(log n)
 * - min/max: O(log n)
 * - inOrder: O(n)
 * - size: O(1)
 * - height: O(1)
 */

class AVLNode<T> {
  value: T;
  left: AVLNode<T> | undefined = undefined;
  right: AVLNode<T> | undefined = undefined;
  height: number = 1;

  constructor(value: T) {
    this.value = value;
    throw new Error("Not implemented");
  }
}

export class AVLTree<T> {
  private root: AVLNode<T> | undefined = undefined;
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

  height(): number {
    throw new Error("Not implemented");
  }
}
