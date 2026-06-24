/**
 * CartesianTree (카르테시안 트리)
 *
 * 배열에서 구성하는 특수한 BST:
 * - BST 성질: 중위 순회 시 원래 배열 순서를 복원
 * - 힙 성질: 부모의 값 <= 자식의 값 (min-heap 기준)
 * - 루트는 배열의 최솟값
 *
 * 이 두 성질을 동시에 만족하는 유일한 트리 구조가 존재한다.
 * 배열 [5, 10, 40, 10, 20]에서:
 * - 루트 = 5 (최솟값, 인덱스 0)
 * - 오른쪽 서브트리 = [10, 40, 10, 20]의 카르테시안 트리
 * - 왼쪽 서브트리 = [] (5 왼쪽에 원소 없음)
 *
 * 응용:
 * - RMQ (Range Minimum Query): 카르테시안 트리 구성 후 LCA = 구간 최솟값
 * - Treap: 랜덤 우선순위를 힙 키로 사용하는 결정론적 변형
 *
 * 요구사항:
 * - fromArray(arr, comparator?): 배열에서 O(n) 카르테시안 트리 구성 (정적 메서드)
 * - value(): 루트 값 반환
 * - left(): 왼쪽 서브트리
 * - right(): 오른쪽 서브트리
 * - inOrder(): 중위 순회 → 원래 배열 복원
 * - size(): 전체 노드 수
 *
 * 시간복잡도:
 * - fromArray: O(n) (스택 기반)
 * - inOrder: O(n)
 * - value/left/right: O(1)
 * - size: O(1)
 */

class CartesianNode<T> {
  value: T;
  left: CartesianNode<T> | undefined = undefined;
  right: CartesianNode<T> | undefined = undefined;

  constructor(value: T) {
    this.value = value;
    throw new Error("Not implemented");
  }
}

export class CartesianTree<T> {
  private _root: CartesianNode<T> | undefined = undefined;
  private _size = 0;
  private comparator: (a: T, b: T) => number;

  private constructor(
    root: CartesianNode<T> | undefined,
    size: number,
    comparator: (a: T, b: T) => number
  ) {
    this._root = root;
    this._size = size;
    this.comparator = comparator;
    throw new Error("Not implemented");
  }

  /**
   * 배열에서 카르테시안 트리를 O(n)에 구성한다.
   * comparator는 힙 기준 비교자: comparator(a, b) < 0 이면 a가 부모가 된다 (기본: min-heap).
   */
  static fromArray<T>(
    arr: T[],
    comparator?: (a: T, b: T) => number
  ): CartesianTree<T> {
    throw new Error("Not implemented");
  }

  value(): T | undefined {
    throw new Error("Not implemented");
  }

  left(): CartesianTree<T> | undefined {
    throw new Error("Not implemented");
  }

  right(): CartesianTree<T> | undefined {
    throw new Error("Not implemented");
  }

  inOrder(): T[] {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }
}
