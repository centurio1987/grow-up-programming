/**
 * 결함 fixture — 칸을 **펴기 값의 나머지**로 정하는 LRU 캐시.
 *
 * 대상 계약: `hash/lruCache`.
 *
 * **동작은 옳다.** 축1을 전부 통과한다. 정본과 같은 두 겹(키로 찾는 표 · 사용 순서의 줄)을 들고,
 * 다른 것은 칸을 정하는 한 줄뿐이다 — 무작위를 하나도 뽑지 않고 펴기 값을 칸 수로 나눈 나머지를
 * 쓴다. 그래서 담는 칸이 **키의 함수로만** 정해지고, 그 함수를 역산한 키 묶음(`i * 65536`)이 전부
 * 한 칸으로 몰린다. 그 키 묶음은 주입 정책이 요구하는 것을 전부 지킨다(`hash/hashMapChaining` 의
 * `_fixtures/remainderSlotDictionary.ts` 와 같은 자리 · 불변 사실 104·143).
 *
 * 무작위 키 시나리오 둘은 **통과하고** 적대적 시나리오 둘에서만 걸린다. 사용 순서의 줄은 정본과
 * 같으므로 걸리는 자리는 찾기이지 순서 고치기가 아니다.
 *
 * 축3 계측 단위는 정본과 같다 — *"단위 하나를 지나갈 때마다 1"*(§규약2 계측 단위). 칸 하나, 칸에
 * 매달린 항목 하나, 줄에서 떼거나 붙이는 항목 하나가 각각 1 이고 주입된 펴기 호출도 따로 1 을 센다.
 */

interface Entry<K, V> {
  key: K;
  value: V;
  newer: Entry<K, V> | Ring<K, V>;
  older: Entry<K, V> | Ring<K, V>;
}

interface Ring<K, V> {
  newer: Entry<K, V> | Ring<K, V>;
  older: Entry<K, V> | Ring<K, V>;
}

const GROW_ABOVE = 0.75;
const MIN_SLOTS = 16;

export class RemainderSlotCache<K, V> {
  readonly #capacity: number;
  readonly #spread: (key: K) => number;
  #slots: Entry<K, V>[][] = emptySlots(MIN_SLOTS);
  #count = 0;
  readonly #ring: Ring<K, V>;

  __cost = 0;

  constructor(capacity: number, spread: (key: K) => number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(
        `용량은 1 이상의 정수여야 한다 — 받은 값은 ${capacity} 이다`,
      );
    }
    this.#capacity = capacity;
    this.#spread = spread;
    const ring = {} as Ring<K, V>;
    ring.newer = ring;
    ring.older = ring;
    this.#ring = ring;
  }

  get(key: K): V | null {
    const chain = this.#chainOf(key);
    for (const entry of chain) {
      this.__cost += 1;
      if (Object.is(entry.key, key)) {
        this.#touch(entry);
        return entry.value;
      }
    }
    return null;
  }

  put(key: K, value: V): void {
    const chain = this.#chainOf(key);
    for (const entry of chain) {
      this.__cost += 1;
      if (Object.is(entry.key, key)) {
        entry.value = value;
        this.#touch(entry);
        return;
      }
    }
    if (this.#count === this.#capacity) this.#evictOldest();
    const entry: Entry<K, V> = {
      key,
      value,
      newer: this.#ring,
      older: this.#ring.older,
    };
    this.__cost += 1;
    entry.older.newer = entry;
    this.#ring.older = entry;
    chain.push(entry);
    this.#count += 1;
    if (this.#count > this.#slots.length * GROW_ABOVE) {
      this.#rebuild(this.#slots.length * 2);
    }
  }

  #touch(entry: Entry<K, V>): void {
    this.__cost += 1;
    if (this.#ring.older === entry) return;
    entry.newer.older = entry.older;
    entry.older.newer = entry.newer;
    entry.newer = this.#ring;
    entry.older = this.#ring.older;
    entry.older.newer = entry;
    this.#ring.older = entry;
  }

  #evictOldest(): void {
    const oldest = this.#ring.newer as Entry<K, V>;
    this.__cost += 1;
    this.#ring.newer = oldest.newer;
    oldest.newer.older = this.#ring;
    const chain = this.#chainOf(oldest.key);
    for (let at = 0; at < chain.length; at++) {
      this.__cost += 1;
      if (chain[at] !== oldest) continue;
      chain[at] = chain[chain.length - 1] as Entry<K, V>;
      chain.pop();
      break;
    }
    this.#count -= 1;
  }

  /** 이 한 줄이 결함의 전부다. 무작위가 없으므로 칸이 키의 함수로만 정해진다. */
  #slotOf(key: K): number {
    this.__cost += 1;
    return (this.#spread(key) >>> 0) % this.#slots.length;
  }

  #chainOf(key: K): Entry<K, V>[] {
    const chain = this.#slots[this.#slotOf(key)] as Entry<K, V>[];
    this.__cost += 1;
    return chain;
  }

  #rebuild(slots: number): void {
    const previous = this.#slots;
    this.#slots = emptySlots(slots);
    for (const chain of previous) {
      this.__cost += 1;
      for (const entry of chain) {
        this.__cost += 1;
        (this.#slots[this.#slotOf(entry.key)] as Entry<K, V>[]).push(entry);
      }
    }
  }
}

function emptySlots<K, V>(count: number): Entry<K, V>[][] {
  const made: Entry<K, V>[][] = [];
  for (let at = 0; at < count; at++) made.push([]);
  return made;
}
