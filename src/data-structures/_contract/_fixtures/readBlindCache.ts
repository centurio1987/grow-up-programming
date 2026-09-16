/**
 * 결함 fixture — **맞은 `get` 을 사용으로 치지 않는** 캐시.
 *
 * 대상 계약: `hash/lruCache`.
 *
 * **축1이 잡는다.** 넣기와 덮어쓰기는 그 키를 가장 최근으로 올리고 가득 차면 가장 오래된 것을
 * 밀어내지만, `get` 은 값만 읽고 순서를 두고 간다. 그래서 무엇이 밀려나는지가 **마지막으로 쓴
 * 순서**로 정해진다. 헤더 「연산 계약」이 「최근에 쓴」에 맞은 `get` 을 넣은 것이 관측되는 약속이라는
 * 것(불변 사실 69 ③)의 실물이다 — 순서를 읽는 연산이 계약에 없는데도 다음 밀어내기가 그 갈림을
 * 드러낸다.
 *
 * 비용은 재지 않는다 — 이 fixture 가 겨누는 것은 의미이고 축3 자기시험에 넣지 않는다. 사용 순서는
 * 언어의 `Map` 이 넣은 순서를 기억하는 성질에 맡긴다.
 */

export class ReadBlindCache<K, V> {
  readonly #capacity: number;
  /** 넣은 순서가 곧 밀어낼 순서다. 맨 앞이 가장 오래된 것이다. */
  readonly #entries = new Map<K, V>();

  constructor(capacity: number, _spread: (key: K) => number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(
        `용량은 1 이상의 정수여야 한다 — 받은 값은 ${capacity} 이다`,
      );
    }
    this.#capacity = capacity;
  }

  get(key: K): V | null {
    // 이 한 줄이 결함의 전부다. 맞아도 순서를 옮기지 않는다.
    return this.#entries.has(key) ? (this.#entries.get(key) as V) : null;
  }

  put(key: K, value: V): void {
    if (this.#entries.has(key)) {
      this.#entries.delete(key);
    } else if (this.#entries.size === this.#capacity) {
      const oldest = this.#entries.keys().next().value as K;
      this.#entries.delete(oldest);
    }
    this.#entries.set(key, value);
  }
}
