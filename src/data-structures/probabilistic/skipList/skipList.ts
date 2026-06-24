/**
 * Skip List (스킵 리스트)
 *
 * 정수 키를 저장하는 확률적 스킵 리스트를 구현하라.
 *
 * 요구사항:
 * - insert(key): 키를 스킵 리스트에 삽입한다. 이미 존재하면 무시한다.
 * - search(key): 키가 존재하면 true, 없으면 false를 반환한다.
 * - delete(key): 키를 스킵 리스트에서 제거한다. 없으면 무시한다.
 * - toArray(): 저장된 모든 키를 오름차순 배열로 반환한다.
 *
 * 구현 세부사항:
 * - 최대 레벨(MAX_LEVEL)은 16으로 고정한다.
 * - 각 레벨의 승격 확률(p)은 0.5로 고정한다.
 * - 레벨은 랜덤하게 결정한다.
 *
 * 시간복잡도 (기대값):
 * - insert / search / delete: O(log n)
 */
export class SkipList {
  insert(key: number): void {
    throw new Error("Not implemented");
  }

  search(key: number): boolean {
    throw new Error("Not implemented");
  }

  delete(key: number): void {
    throw new Error("Not implemented");
  }

  toArray(): number[] {
    throw new Error("Not implemented");
  }
}
