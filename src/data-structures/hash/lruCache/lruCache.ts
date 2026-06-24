/**
 * LRU Cache (LRU 캐시)
 *
 * 용량 제한이 있는 LRU(Least Recently Used) 캐시를 구현하라.
 *
 * 요구사항:
 * - constructor(capacity): 캐시 최대 용량을 설정한다. capacity >= 1이 보장된다.
 * - get(key): key에 해당하는 값을 반환한다. 없으면 -1을 반환한다.
 *   이 호출은 해당 항목을 "가장 최근 사용"으로 갱신한다.
 * - put(key, value): key-value 쌍을 캐시에 저장한다.
 *   이미 존재하면 값을 업데이트하고 "가장 최근 사용"으로 갱신한다.
 *   용량 초과 시 가장 오래된 항목(LRU)을 제거한 후 삽입한다.
 *
 * 시간복잡도:
 * - get / put: O(1)
 */
export class LRUCache {
  constructor(capacity: number) {
    throw new Error("Not implemented");
  }

  get(key: number): number {
    throw new Error("Not implemented");
  }

  put(key: number, value: number): void {
    throw new Error("Not implemented");
  }
}
