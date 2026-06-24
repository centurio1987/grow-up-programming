/**
 * TwoThreeTree (2-3 트리)
 *
 * B-Tree의 특수 케이스 (최소 차수 t=2).
 * 각 내부 노드는 1~2개의 키와 2~3개의 자식을 가진다.
 * 항상 완전 균형 트리를 유지하며, 모든 리프는 같은 깊이에 위치한다.
 *
 * 요구사항:
 * - insert(value): 값을 삽입하고 트리 균형을 유지한다
 * - delete(value): 값을 삭제하고 트리 균형을 유지한다. 성공 시 true 반환
 * - has(value): 값이 트리에 존재하면 true 반환
 * - size(): 현재 원소 개수 반환
 * - inOrder(): 정렬된 순서로 모든 원소 배열 반환
 *
 * 시간복잡도:
 * - insert: O(log n)
 * - delete: O(log n)
 * - has: O(log n)
 * - inOrder: O(n)
 */

class TwoThreeNode<T> {
  keys: T[] = [];
  children: TwoThreeNode<T>[] = [];

  get isLeaf(): boolean {
    return this.children.length === 0;
  }

  get keyCount(): number {
    return this.keys.length;
  }
}

export class TwoThreeTree<T> {
  private root: TwoThreeNode<T> | undefined = undefined;
  private _size = 0;
  private compare: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    throw new Error("Not implemented");
  }

  /**
   * 값을 삽입한다.
   * 노드가 3개의 키를 가지면 분할(split)하여 균형을 유지한다.
   */
  insert(value: T): void {
    throw new Error("Not implemented");
  }

  /**
   * 값을 삭제한다.
   * 삭제 후 언더플로우가 발생하면 형제에서 빌리거나 병합(merge)한다.
   * 값이 존재하여 삭제에 성공하면 true, 없으면 false 반환.
   */
  delete(value: T): boolean {
    throw new Error("Not implemented");
  }

  /**
   * 값이 트리에 존재하는지 확인한다.
   */
  has(value: T): boolean {
    throw new Error("Not implemented");
  }

  /**
   * 현재 원소 개수를 반환한다.
   */
  size(): number {
    throw new Error("Not implemented");
  }

  /**
   * 중위 순회(in-order traversal)로 정렬된 배열을 반환한다.
   */
  inOrder(): T[] {
    throw new Error("Not implemented");
  }
}
