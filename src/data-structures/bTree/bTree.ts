/**
 * BTree (B-트리)
 *
 * 최소 차수 t를 매개변수로 받는 일반화된 B-트리.
 * 각 비루트 노드는 t-1 ~ 2t-1개의 키를 가진다.
 * 루트 노드는 1 ~ 2t-1개의 키를 가진다.
 * 모든 리프는 같은 깊이에 위치하며, 키가 정렬되어 있다.
 *
 * 파일 시스템과 데이터베이스 인덱스에서 디스크 I/O를 최소화하기 위해 사용된다.
 * HDD/SSD의 페이지 크기에 맞춰 t를 선택하면 한 번의 I/O로 많은 키를 읽을 수 있다.
 *
 * 요구사항:
 * - insert(value): 값을 삽입하고 트리 균형을 유지한다
 * - delete(value): 값을 삭제하고 트리 균형을 유지한다. 성공 시 true 반환
 * - has(value): 값이 트리에 존재하면 true 반환
 * - size(): 현재 원소 개수 반환
 * - inOrder(): 정렬된 순서로 모든 원소 배열 반환
 *
 * 시간복잡도:
 * - insert: O(log_t n)
 * - delete: O(log_t n)
 * - has: O(log_t n)
 * - inOrder: O(n)
 */

class BTreeNode<T> {
  keys: T[] = [];
  children: BTreeNode<T>[] = [];
  isLeaf: boolean = true;
}

export class BTree<T> {
  private root: BTreeNode<T> | undefined = undefined;
  private _size = 0;
  private t: number; // 최소 차수
  private compare: (a: T, b: T) => number;

  /**
   * @param t 최소 차수 (기본값 3). 각 비루트 노드는 t-1 ~ 2t-1개의 키를 가진다.
   * @param comparator 비교 함수 (기본값: 숫자/문자열 기본 정렬)
   */
  constructor(t: number = 3, comparator?: (a: T, b: T) => number) {
    throw new Error("Not implemented");
  }

  /**
   * 값을 삽입한다.
   * 노드가 가득 차면 분할(split)하여 균형을 유지한다.
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
