/**
 * RedBlackTree (레드-블랙 트리)
 *
 * 각 노드를 Red 또는 Black으로 채색하고, 5가지 속성을 유지하여
 * 트리 높이를 O(log n)으로 보장하는 자기 균형 이진 탐색 트리.
 * AVL 트리보다 삽입·삭제 회전 횟수가 적어 실무에서 널리 사용된다.
 * C++ STL의 map/set, Java의 TreeMap이 이 구조를 기반으로 한다.
 *
 * 레드-블랙 속성:
 * 1. 모든 노드는 Red 또는 Black이다.
 * 2. 루트는 Black이다.
 * 3. 모든 리프(NIL)는 Black이다.
 * 4. Red 노드의 자식은 모두 Black이다 (Red가 연속될 수 없다).
 * 5. 임의 노드에서 리프까지의 모든 경로의 Black 노드 수는 동일하다.
 *
 * 요구사항:
 * - insert(value): 삽입 후 채색 규칙 복구
 * - delete(value): 삭제 후 채색 규칙 복구
 * - has(value): 값 포함 여부 반환
 * - min(): 최솟값 반환
 * - max(): 최댓값 반환
 * - inOrder(): 중위 순회 결과 배열 반환
 * - size(): 현재 노드 수 반환
 *
 * 시간복잡도:
 * - insert: O(log n)
 * - delete: O(log n)
 * - has: O(log n)
 * - min/max: O(log n)
 * - inOrder: O(n)
 * - size: O(1)
 */

type RBColor = "RED" | "BLACK";

class RBNode<T> {
  value: T;
  left: RBNode<T> | undefined = undefined;
  right: RBNode<T> | undefined = undefined;
  parent: RBNode<T> | undefined = undefined;
  color: RBColor = "RED";

  constructor(value: T) {
    this.value = value;
    throw new Error("Not implemented");
  }
}

export class RedBlackTree<T> {
  private root: RBNode<T> | undefined = undefined;
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
