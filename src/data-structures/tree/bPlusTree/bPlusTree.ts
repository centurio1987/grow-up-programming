/**
 * BPlusTree (B+ 트리)
 *
 * B-트리의 변형으로, 실제 데이터는 오직 리프 노드에만 저장된다.
 * 내부 노드는 라우팅 키만 보유하며 자식을 가리키는 포인터 역할만 한다.
 * 리프 노드끼리 연결 리스트로 이어져 있어 범위 질의를 효율적으로 처리한다.
 *
 * MySQL InnoDB 클러스터드 인덱스가 이 구조를 사용한다.
 * 범위 스캔 시 리프 연결 리스트를 순회하므로 B-트리보다 효율적이다.
 *
 * 요구사항:
 * - insert(value): 값을 삽입하고 트리 균형을 유지한다
 * - delete(value): 값을 삭제하고 트리 균형을 유지한다. 성공 시 true 반환
 * - has(value): 값이 트리에 존재하면 true 반환
 * - range(low, high): low <= v <= high인 모든 값을 정렬된 순서로 반환
 * - size(): 현재 원소 개수 반환
 * - inOrder(): 정렬된 순서로 모든 원소 배열 반환 (리프 순회)
 *
 * 시간복잡도:
 * - insert: O(log_t n)
 * - delete: O(log_t n)
 * - has: O(log_t n)
 * - range(low, high): O(k + log_t n) — k는 결과 원소 수
 * - inOrder: O(n)
 */

class BPlusLeafNode<T> {
  keys: T[] = [];
  next: BPlusLeafNode<T> | undefined = undefined;
  readonly isLeaf = true;
}

class BPlusInternalNode<T> {
  keys: T[] = [];
  children: (BPlusInternalNode<T> | BPlusLeafNode<T>)[] = [];
  readonly isLeaf = false;
}

type BPlusNode<T> = BPlusInternalNode<T> | BPlusLeafNode<T>;

export class BPlusTree<T> {
  private root: BPlusNode<T> | undefined = undefined;
  private _size = 0;
  private t: number; // 최소 차수
  private compare: (a: T, b: T) => number;

  /**
   * @param t 최소 차수 (기본값 3). 각 비루트 노드는 t-1 ~ 2t-1개의 키를 가진다.
   * @param comparator 비교 함수
   */
  constructor(t: number = 3, comparator?: (a: T, b: T) => number) {
    throw new Error("Not implemented");
  }

  /**
   * 값을 삽입한다.
   * 리프 노드에 값을 삽입하고, 오버플로우 시 분할한다.
   */
  insert(value: T): void {
    throw new Error("Not implemented");
  }

  /**
   * 값을 삭제한다.
   * 리프 노드에서 값을 제거하고, 언더플로우 시 재분배 또는 병합한다.
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
   * low 이상 high 이하인 모든 값을 정렬된 순서로 반환한다.
   * 리프 연결 리스트를 순회하므로 범위 질의에 최적화되어 있다.
   */
  range(low: T, high: T): T[] {
    throw new Error("Not implemented");
  }

  /**
   * 현재 원소 개수를 반환한다.
   */
  size(): number {
    throw new Error("Not implemented");
  }

  /**
   * 리프 연결 리스트를 순회하여 정렬된 배열을 반환한다.
   */
  inOrder(): T[] {
    throw new Error("Not implemented");
  }
}
