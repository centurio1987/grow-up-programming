/**
 * 결함 fixture — 키마다 **마지막으로 쓴 시각**을 적어 두고, 밀어낼 때 담긴 것 전부를 훑어 가장
 * 오래된 시각을 찾는 LRU 캐시.
 *
 * 대상 계약: `hash/lruCache`.
 *
 * **동작은 옳다.** 축1을 전부 통과한다. 키로 값을 찾는 일은 언어의 `Map` 에 맡기고, 쓸 때마다
 * 1 씩 오르는 시각을 그 항목에 적는다. 그래서 맞은 `get` 과 덮어쓰기는 시각 하나를 고치는 상수이고,
 * **어기는 것은 밀어내는 `put` 한 행뿐이다** — 가장 오래된 시각을 찾으려고 담긴 것 전부를 훑는다.
 * 배열·객체의 기본 연산만 쓰는 **자명한 구현**이다(헤더 「검증 등급」의 둘째 길).
 *
 * `_fixtures/recencyArrayCache.ts` 와 걸리는 행이 갈린다 — 저쪽은 `get` 과 `put` 둘 다, 이쪽은
 * `put` 하나다. 자명한 구현이 전 행에서 걸리지 않는다는 것(불변 사실 84)의 이 계약판이다.
 *
 * 축3 계측 단위는 정본과 같다 — *"단위 하나를 지나갈 때마다 1"*(§규약2 계측 단위). 여기서 단위는
 * 항목 하나다. `Map` 조회는 1, 훑기는 훑은 항목 수만큼 센다.
 */

interface Stamped<V> {
  value: V;
  usedAt: number;
}

export class StampScanningCache<K, V> {
  readonly #capacity: number;
  readonly #entries = new Map<K, Stamped<V>>();
  #clock = 0;

  __cost = 0;

  constructor(capacity: number, _spread: (key: K) => number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(
        `용량은 1 이상의 정수여야 한다 — 받은 값은 ${capacity} 이다`,
      );
    }
    this.#capacity = capacity;
  }

  get(key: K): V | null {
    this.__cost += 1;
    const found = this.#entries.get(key);
    if (found === undefined) return null;
    found.usedAt = ++this.#clock;
    return found.value;
  }

  put(key: K, value: V): void {
    this.__cost += 1;
    const found = this.#entries.get(key);
    if (found !== undefined) {
      found.value = value;
      found.usedAt = ++this.#clock;
      return;
    }
    if (this.#entries.size === this.#capacity) this.#evictOldest();
    this.#entries.set(key, { value, usedAt: ++this.#clock });
  }

  /** 이 훑기가 결함의 전부다. 가장 오래된 시각을 담긴 것 전부에서 찾는다. */
  #evictOldest(): void {
    let oldestKey: K | undefined;
    let oldestAt = Number.POSITIVE_INFINITY;
    for (const [key, entry] of this.#entries) {
      this.__cost += 1;
      if (entry.usedAt < oldestAt) {
        oldestAt = entry.usedAt;
        oldestKey = key;
      }
    }
    this.#entries.delete(oldestKey as K);
  }
}
