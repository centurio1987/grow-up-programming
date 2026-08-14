/**
 * 결함 fixture — 자리를 **펴기 값의 나머지**로 정하는 사전.
 *
 * 대상 계약: `hash/hashMapChaining`(= `hash/hashMapOpenAddressing`).
 *
 * **동작은 옳다.** 축1·축2를 전부 통과한다. 어기는 것은 한정자다 — 계약의 `expected` 는
 * *구현이 뽑는 무작위성*에 대한 기댓값이고 「호출자가 어떤 키를 주든」을 말하는데, 이 구현은
 * 무작위를 하나도 뽑지 않는다. 담는 자리가 **키의 함수로만** 정해지면 그 함수를 역산한 키
 * 묶음이 실재하고, 실재하면 「어떤 키를 주든」이 거짓이 된다(불변 사실 104 의 논증이 해시로
 * 그대로 옮겨 온 자리다).
 *
 * 역산이 쉬운 것도 아니다 — **자리 수의 배수를 고르면 끝난다.** 계약 스위트의 적대적
 * 시나리오가 쓰는 `i * 65536` 이 그것이고, 그 키 묶음은 주입 정책이 요구하는 것을 전부
 * 지킨다. 그래서 이 fixture 는 무작위 키 시나리오를 **전부 통과하고** 적대적 시나리오
 * 네 곳에서만 걸린다.
 *
 * 잘 섞는 것으로는 안 된다는 점을 함께 적어 둔다. 나머지 대신 곱해서 위쪽 비트를 쓰든
 * 비트를 접든, **곱수가 고정이면** 그 곱수에 맞춘 키 묶음이 다시 생긴다. 갈리는 것은 섞기의
 * 질이 아니라 무작위를 뽑는가다.
 *
 * 축3 계측 단위는 정본과 같다 — *"자리 하나를 지나갈 때마다 1"*(§규약2 계측 단위).
 * 주입된 펴기 호출도 따로 1 을 센다.
 */

const GROW_ABOVE = 0.75;
const MIN_SLOTS = 16;

export class RemainderSlotDictionary<K, V> {
  readonly #spread: (key: K) => number;
  #keys: K[][];
  #values: V[][];
  #count = 0;

  __cost = 0;

  constructor(spread: (key: K) => number) {
    this.#spread = spread;
    this.#keys = emptyChains<K>(MIN_SLOTS);
    this.#values = emptyChains<V>(MIN_SLOTS);
  }

  set(key: K, value: V): void {
    const slot = this.#slotOf(key);
    const chain = this.#keys[slot] as K[];
    const at = this.#scan(chain, key);
    if (at >= 0) {
      (this.#values[slot] as V[])[at] = value;
      return;
    }
    chain.push(key);
    (this.#values[slot] as V[]).push(value);
    this.#count += 1;
    if (this.#count > this.#keys.length * GROW_ABOVE) {
      this.#rebuild(this.#keys.length * 2);
    }
  }

  get(key: K): V | null {
    const slot = this.#slotOf(key);
    const at = this.#scan(this.#keys[slot] as K[], key);
    return at < 0 ? null : ((this.#values[slot] as V[])[at] as V);
  }

  has(key: K): boolean {
    return this.#scan(this.#keys[this.#slotOf(key)] as K[], key) >= 0;
  }

  delete(key: K): boolean {
    const slot = this.#slotOf(key);
    const chain = this.#keys[slot] as K[];
    const at = this.#scan(chain, key);
    if (at < 0) return false;
    const values = this.#values[slot] as V[];
    chain[at] = chain[chain.length - 1] as K;
    values[at] = values[values.length - 1] as V;
    chain.pop();
    values.pop();
    this.#count -= 1;
    // 정본과 같은 줄이는 문턱. 이 fixture 가 겨누는 결함은 자리를 정하는 방식 하나이므로,
    // 열거 행에 다른 결함이 섞이지 않게 해 둔다.
    if (
      this.#keys.length > MIN_SLOTS &&
      this.#count < this.#keys.length * 0.25
    ) {
      this.#rebuild(this.#keys.length / 2);
    }
    return true;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  keys(): K[] {
    const found: K[] = [];
    for (const chain of this.#keys) {
      this.__cost += 1 + chain.length;
      found.push(...chain);
    }
    return found;
  }

  values(): V[] {
    const found: V[] = [];
    for (const chain of this.#values) {
      this.__cost += 1 + chain.length;
      found.push(...chain);
    }
    return found;
  }

  /** 이 한 줄이 결함의 전부다. 무작위가 없으므로 자리가 키의 함수로만 정해진다. */
  #slotOf(key: K): number {
    this.__cost += 1;
    return (this.#spread(key) >>> 0) % this.#keys.length;
  }

  #scan(chain: readonly K[], key: K): number {
    const at = chain.indexOf(key);
    this.__cost += 1 + (at < 0 ? chain.length : at + 1);
    return at;
  }

  #rebuild(slots: number): void {
    const previousKeys = this.#keys;
    const previousValues = this.#values;
    this.#keys = emptyChains<K>(slots);
    this.#values = emptyChains<V>(slots);
    for (let slot = 0; slot < previousKeys.length; slot++) {
      this.__cost += 1;
      const chain = previousKeys[slot] as K[];
      const values = previousValues[slot] as V[];
      for (let at = 0; at < chain.length; at++) {
        this.__cost += 1;
        const moved = this.#slotOf(chain[at] as K);
        (this.#keys[moved] as K[]).push(chain[at] as K);
        (this.#values[moved] as V[]).push(values[at] as V);
      }
    }
  }
}

function emptyChains<T>(count: number): T[][] {
  const made: T[][] = [];
  for (let at = 0; at < count; at++) made.push([]);
  return made;
}
