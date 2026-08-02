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
  left: AVLNode<T> | null = null;
  right: AVLNode<T> | null = null;
  height: number = 1;

  constructor(value: T) {
    this.value = value;
    throw new Error("Not implemented");
  }
}

export class AVLTree<T> {
  private root: AVLNode<T> | null = null;
  private _size = 0;
  private comparator: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.comparator = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    throw new Error("Not implemented");
  }

  insert(value: T): void {
    if (this.root === null) {
      this.root = new AVLNode<T>(value);
      return;
    }

    let node: null | AVLNode<T> = this.root;
    const stack: AVLNode<T>[] = [];

    while (node !== null) {
      if (this.comparator(node.value, value) === 0) {
        return;
      } else if (this.comparator(node.value, value) === -1) {
        stack.push(node);
        if (node.right === null) {
          node.right = new AVLNode(value);
          while (node.left === null && stack.length !== 0) {
            node = stack.pop()!;
            node.height++;
          }
          return;
        }
        node = node.right;
      } else {
        stack.push(node);
        if (node.left === null) {
          node.left = new AVLNode(value);
          while (node.right === null && stack.length !== 0) {
            node = stack.pop()!;
            node.height++;
          }
          return;
        }

        node = node.left;
      }
    }
  }

  delete(value: T): boolean {
    throw new Error("Not implemented");
  }

  has(value: T): boolean {
    let node: null | AVLNode<T> = this.root;

    while (node !== null) {
      if (this.comparator(node.value, value) === 0) {
        return true;
      } else if (this.comparator(node.value, value) === -1) {
        node = node.right;
      } else {
        node = node.left;
      }
    }

    return false;
  }

  min(): T | null {
    if (this.root === null) return null;

    let node: null | AVLNode<T> = this.root;

    while (node.left !== null) {
      node = node.left;
    }

    return node.value;
  }

  max(): T | null {
    if (this.root === null) return null;

    let node: null | AVLNode<T> = this.root;

    while (node.right !== null) {
      node = node.right;
    }

    return node.value;
  }

  inOrder(): T[] {
    const arr: T[] = [];
    const stack: AVLNode<T>[] = [];

    if (this.root === null) return arr;

    let node: null | AVLNode<T> = this.root;
    stack.push(node);

    while (stack.length !== 0) {
      if (node !== null && node.left !== null) {
        node = node.left;
        stack.push(node);
      } else {
        node = stack.pop() as AVLNode<T>;
        arr.push(node.value);

        if (node.right !== null) {
          node = node.right;
          stack.push(node);
        } else {
          node = null;
        }
      }
    }

    return arr;
  }

  size(): number {
    return this._size;
  }

  height(): number {
    return this.root?.height ?? 0;
  }
}
