/**
 * Binary Search Tree (이진 탐색 트리)
 *
 * 정수 키를 저장하는 BST를 구현하라.
 *
 * 요구사항:
 * - insert(key): 키를 BST에 삽입한다. 이미 존재하면 무시한다.
 * - search(key): 키가 존재하면 true, 없으면 false를 반환한다.
 * - delete(key): 키를 BST에서 제거한다. 없으면 무시한다.
 *   자식이 둘인 경우 오른쪽 서브트리의 최솟값(in-order successor)으로 대체한다.
 * - inorder(): 중위 순회 결과를 오름차순 배열로 반환한다.
 * - min(): BST의 최솟값을 반환한다. 비어있으면 undefined를 반환한다.
 * - max(): BST의 최댓값을 반환한다. 비어있으면 undefined를 반환한다.
 *
 * 시간복잡도 (균형 트리 기준):
 * - insert / search / delete: O(log n) 평균, O(n) 최악
 * - inorder: O(n)
 */
export class BinarySearchTree {
  insert(key: number): void {
    throw new Error("Not implemented");
  }

  search(key: number): boolean {
    throw new Error("Not implemented");
  }

  delete(key: number): void {
    throw new Error("Not implemented");
  }

  inorder(): number[] {
    throw new Error("Not implemented");
  }

  min(): number | undefined {
    throw new Error("Not implemented");
  }

  max(): number | undefined {
    throw new Error("Not implemented");
  }
}
