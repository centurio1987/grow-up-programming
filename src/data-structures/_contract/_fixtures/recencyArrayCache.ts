/**
 * 결함 fixture — 사용 순서를 **배열 한 줄**에 두는 LRU 캐시.
 *
 * 대상 계약: `hash/lruCache`.
 *
 * **동작은 옳다.** 축1을 전부 통과한다. 키로 값을 찾는 일은 언어의 `Map` 에 맡기고, 사용 순서는
 * 키를 가장 오래 안 쓴 것부터 늘어놓은 배열 하나에 둔다. 맞은 `get` 과 덮어쓰기는 그 키를 배열에서
 * 찾아 빼고 뒤에 붙이며, 밀어내기는 배열 맨 앞을 지운다. 배열·객체의 기본 연산만 쓰는 **자명한
 * 구현**이다(헤더 「검증 등급」의 첫 길).
 *
 * 어기는 것은 두 행이다 — 옮길 키를 찾는 일과 빈자리를 당기는 일이 담긴 수에 비례하므로 맞은
 * `get` 이 선형이고, 맨 앞을 지우면 뒤가 전부 당겨지므로 밀어내는 `put` 도 선형이다. 무작위 키와
 * 적대적 키를 가리지 않는다.
 *
 * 축3 계측 단위는 정본과 같다 — *"단위 하나를 지나갈 때마다 1"*(§규약2 계측 단위). 여기서 단위는
 * 배열의 칸 하나다. 찾기는 찾은 자리까지, 당기기는 뒤에 남은 칸 수만큼 센다. `Map` 조회와 주입된
 * 펴기 호출은 각각 1 이다(이 fixture 는 펴기를 부르지 않는다 — `Map` 이 키 자체로 찾는다).
 */

export class RecencyArrayCache<K, V> {
  readonly #capacity: number;
  readonly #values = new Map<K, V>();
  /** 가장 오래 안 쓴 키가 맨 앞이다. */
  readonly #order: K[] = [];

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
    if (!this.#values.has(key)) return null;
    this.#moveToBack(key);
    return this.#values.get(key) as V;
  }

  put(key: K, value: V): void {
    this.__cost += 1;
    if (this.#values.has(key)) {
      this.#values.set(key, value);
      this.#moveToBack(key);
      return;
    }
    if (this.#values.size === this.#capacity) {
      // 맨 앞을 지우면 뒤가 전부 한 칸씩 당겨진다.
      this.__cost += this.#order.length;
      const oldest = this.#order.shift() as K;
      this.#values.delete(oldest);
    }
    this.#order.push(key);
    this.#values.set(key, value);
  }

  #moveToBack(key: K): void {
    const at = this.#order.indexOf(key);
    // 찾은 자리까지 지나가고, 빼낸 자리 뒤를 당긴다. 합치면 배열 길이만큼이다.
    this.__cost += this.#order.length;
    this.#order.splice(at, 1);
    this.#order.push(key);
  }
}
