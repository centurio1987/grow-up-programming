/**
 * HashMapOpenAddressing (개방 주소 해시맵)
 *
 * 충돌 해결 전략으로 선형 탐사(linear probing)를 사용하는 해시맵.
 * 체이닝과 달리 포인터(연결 리스트) 없이 배열 내에서 빈 슬롯을 탐사하며,
 * 캐시 지역성이 우수하다. 삭제 시 tombstone 마커를 사용해 탐사 체인을 유지한다.
 *
 * 요구사항:
 * - set(key, value): 키-값 쌍을 삽입하거나 값을 갱신한다.
 * - get(key): 키에 해당하는 값을 반환하거나 undefined를 반환한다.
 * - has(key): 키 존재 여부를 반환한다.
 * - delete(key): tombstone 마커로 키를 삭제하고 성공 여부를 반환한다.
 * - size(): 현재 살아있는 항목 수를 반환한다.
 * - load factor > 0.5 시 버킷을 2배 확장하고 재해시한다 (개방 주소는 낮은 임계값).
 *
 * 시간복잡도:
 * - set: O(1) 평균, O(n) 최악
 * - get: O(1) 평균, O(n) 최악
 * - has: O(1) 평균, O(n) 최악
 * - delete: O(1) 평균, O(n) 최악
 */

/** 슬롯 상태를 나타내는 타입 */
type Slot<K, V> =
  | { state: "empty" }
  | { state: "occupied"; key: K; value: V }
  | { state: "tombstone" };

export class HashMapOpenAddressing<K, V> {
  private slots: Array<Slot<K, V>>;
  private capacity: number;
  private count: number;   // 살아있는 항목 수
  private readonly LOAD_FACTOR = 0.5;

  constructor(initialCapacity: number = 16) {
    throw new Error("Not implemented");
  }

  private hash(key: K): number {
    throw new Error("Not implemented");
  }

  private resize(): void {
    throw new Error("Not implemented");
  }

  set(key: K, value: V): void {
    throw new Error("Not implemented");
  }

  get(key: K): V | undefined {
    throw new Error("Not implemented");
  }

  has(key: K): boolean {
    throw new Error("Not implemented");
  }

  delete(key: K): boolean {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }
}
