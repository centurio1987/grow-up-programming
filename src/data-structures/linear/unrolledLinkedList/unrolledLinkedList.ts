/**
 * UnrolledLinkedList (펼침 연결 리스트)
 *
 * 각 노드가 최대 CHUNK_SIZE개 원소를 배열로 보관하는 연결 리스트.
 * 단순 연결 리스트에 비해 캐시 지역성이 높고 포인터 오버헤드가 적다.
 * 대용량 텍스트 문서를 줄 단위로 청크에 저장할 때 유리하다.
 *
 * 요구사항:
 * - push(item): 맨 끝에 원소 추가
 * - pop(): 맨 끝 원소 제거 후 반환
 * - get(index): index 번째 원소 반환 (0-based)
 * - size(): 전체 원소 개수 반환
 * - toArray(): 전체 원소를 배열로 반환
 *
 * 시간복잡도:
 * - push: O(1) amortized
 * - pop: O(1) amortized
 * - get: O(√n) (청크 수 순회 후 청크 내 인덱스 접근)
 * - size: O(1)
 * - toArray: O(n)
 */

interface Chunk<T> {
  items: T[];
  next: Chunk<T> | null;
}

export class UnrolledLinkedList<T> {
  private head: Chunk<T> | null = null;
  private tail: Chunk<T> | null = null;
  private _size: number = 0;
  private readonly chunkSize: number;

  constructor(chunkSize: number = 16) {
    throw new Error("Not implemented");
  }

  /**
   * 맨 끝에 원소를 추가한다.
   * tail 청크에 여유가 있으면 바로 삽입, 없으면 새 청크를 생성한다.
   * amortized O(1)
   */
  push(item: T): void {
    throw new Error("Not implemented");
  }

  /**
   * 맨 끝 원소를 제거하고 반환한다.
   * tail 청크가 비면 이전 청크를 찾아 tail을 업데이트한다.
   * amortized O(1)
   */
  pop(): T | undefined {
    throw new Error("Not implemented");
  }

  /**
   * 0-based index에 해당하는 원소를 반환한다.
   * 청크를 순회하며 누적 인덱스를 계산해 위치를 찾는다.
   * O(√n) — 청크 수 ≈ n/chunkSize
   */
  get(index: number): T | undefined {
    throw new Error("Not implemented");
  }

  /**
   * 전체 원소 개수를 반환한다. O(1)
   */
  size(): number {
    throw new Error("Not implemented");
  }

  /**
   * 전체 원소를 순서대로 담은 배열을 반환한다. O(n)
   */
  toArray(): T[] {
    throw new Error("Not implemented");
  }
}
