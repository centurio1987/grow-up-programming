/**
 * HashMapChaining (체이닝 해시맵)
 *
 * 충돌 해결 전략으로 체이닝(chaining)을 사용하는 해시맵.
 * 각 버킷은 [key, value] 쌍의 배열(연결 리스트 시뮬레이션)을 가진다.
 * 언어 인터프리터의 심볼 테이블처럼 문자열 키와 임의 값을 O(1) 평균으로 저장·조회한다.
 *
 * 요구사항:
 * - set(key, value): 키-값 쌍을 삽입하거나 값을 갱신한다.
 * - get(key): 키에 해당하는 값을 반환하거나 undefined를 반환한다.
 * - has(key): 키 존재 여부를 반환한다.
 * - delete(key): 키를 삭제하고 성공 여부를 반환한다.
 * - size(): 현재 저장된 항목 수를 반환한다.
 * - keys(): 모든 키 배열을 반환한다.
 * - values(): 모든 값 배열을 반환한다.
 * - load factor > 0.75 시 버킷을 2배 확장하고 재해시한다.
 *
 * 시간복잡도:
 * - set: O(1) 평균, O(n) 최악
 * - get: O(1) 평균, O(n) 최악
 * - has: O(1) 평균, O(n) 최악
 * - delete: O(1) 평균, O(n) 최악
 * - keys/values: O(n)
 */
export class HashMapChaining<K, V> {
  private buckets: Array<Array<[K, V]>>;
  private capacity: number;
  private count: number;
  private readonly LOAD_FACTOR = 0.75;

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

  keys(): K[] {
    throw new Error("Not implemented");
  }

  values(): V[] {
    throw new Error("Not implemented");
  }
}
