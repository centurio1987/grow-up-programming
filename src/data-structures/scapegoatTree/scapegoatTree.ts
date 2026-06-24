/**
 * ScapegoatTree (스케이프고트 트리)
 *
 * 회전 없이 alpha 균형 인수 위반 시 해당 서브트리를 통째로 재구성(rebuild)하여
 * 균형을 유지하는 자기 균형 이진 탐색 트리.
 * 삽입/삭제 시 균형이 깨진 "스케이프고트" 조상을 찾아 그 서브트리를 배열로
 * 정렬 후 완전 이진 트리로 재구성한다.
 *
 * alpha 균형 조건:
 * - 모든 노드 v에 대해: size(v.left) <= alpha * size(v)
 *   AND size(v.right) <= alpha * size(v)
 * - alpha = 0.5: 완벽한 균형 (재구성이 잦음)
 * - alpha = 0.75: 느슨한 균형 (재구성이 드뭄)
 * - 기본값: alpha = 0.65
 *
 * 요구사항:
 * - insert(value): 삽입 후 균형 위반 시 서브트리 재구성
 * - delete(value): 논리 삭제 후 일정 조건에서 전체 재구성
 * - has(value): 일반 BST 탐색
 * - size(): 현재 논리 노드 수 반환
 * - inOrder(): 중위 순회 결과 배열 반환
 *
 * 시간복잡도 (상각):
 * - insert: O(log n)
 * - delete: O(log n)
 * - has: O(log n)
 * - inOrder: O(n)
 * - size: O(1)
 */

class ScapegoatNode<T> {
  value: T;
  left: ScapegoatNode<T> | undefined = undefined;
  right: ScapegoatNode<T> | undefined = undefined;
  deleted: boolean = false; // 논리 삭제 마킹

  constructor(value: T) {
    this.value = value;
    throw new Error("Not implemented");
  }
}

export class ScapegoatTree<T> {
  private root: ScapegoatNode<T> | undefined = undefined;
  private _size = 0;        // 논리 노드 수 (deleted 제외)
  private _maxSize = 0;     // 재구성 임계값 추적용
  private alpha: number;
  private comparator: (a: T, b: T) => number;

  constructor(alpha = 0.65, comparator?: (a: T, b: T) => number) {
    this.alpha = alpha;
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

  size(): number {
    throw new Error("Not implemented");
  }

  inOrder(): T[] {
    throw new Error("Not implemented");
  }
}
