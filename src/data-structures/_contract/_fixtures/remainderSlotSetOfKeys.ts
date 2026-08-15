/**
 * 결함 fixture — 자리를 **펴기 값의 나머지**로 정하는 집합.
 *
 * 대상 계약: `hash/hashSet`.
 *
 * **동작은 옳다.** 축1·축2를 전부 통과한다. 어기는 것은 한정자다 — 계약의 `expected` 는
 * *구현이 뽑는 무작위성*에 대한 기댓값이고 「호출자가 어떤 원소를 주든」을 말하는데, 이
 * 구현은 무작위를 하나도 뽑지 않는다. 담는 자리가 **원소의 함수로만** 정해지면 그 함수를
 * 역산한 원소 묶음이 실재하고, 실재하면 「어떤 원소를 주든」이 거짓이 된다.
 *
 * 역산이 쉬운 것도 아니다 — **자리 수의 배수를 고르면 끝난다.** 계약 스위트의 적대적
 * 시나리오가 쓰는 `i * 65536` 이 그것이고, 그 원소 묶음은 주입 정책이 요구하는 것을 전부
 * 지킨다. 그래서 이 fixture 는 무작위 시나리오를 **전부 통과하고** 적대적 시나리오에서만
 * 걸린다 — **적대적 시나리오를 두는 근거가 이 fixture 하나다**(다른 넷은 무작위 쪽에서도
 * 걸리거나 양쪽 다 통과한다).
 *
 * 집합 연산 셋은 정본과 같은 모양이다(수신자를 훑고 인자에 묻는다). 자리가 몰리면 그 셋도
 * 함께 무너지지만, 인자를 키우는 시나리오에서는 수신자가 상수 크기라 몰릴 자리가 없다.
 *
 * 잘 섞는 것으로는 안 된다는 점을 함께 적어 둔다. 나머지 대신 곱해서 위쪽 비트를 쓰든 비트를
 * 접든, **곱수가 고정이면** 그 곱수에 맞춘 원소 묶음이 다시 생긴다. 갈리는 것은 섞기의
 * 질이 아니라 무작위를 뽑는가다.
 *
 * 축3 계측 단위는 정본과 같다 — *"자리 하나를 지나갈 때마다 1"*(§규약2 계측 단위).
 * 주입된 펴기 호출도 따로 1 을 센다.
 */

const GROW_ABOVE = 0.75;
const MIN_SLOTS = 16;

export class RemainderSlotSetOfKeys<T> {
  readonly #spread: (item: T) => number;
  #slots: T[][];
  #count = 0;

  __cost = 0;

  constructor(spread: (item: T) => number) {
    this.#spread = spread;
    this.#slots = emptyChains<T>(MIN_SLOTS);
  }

  add(item: T): void {
    const chain = this.#chainOf(item);
    if (this.#scan(chain, item) >= 0) return;
    chain.push(item);
    this.#count += 1;
    if (this.#count > this.#slots.length * GROW_ABOVE) {
      this.#rebuild(this.#slots.length * 2);
    }
  }

  has(item: T): boolean {
    return this.#scan(this.#chainOf(item), item) >= 0;
  }

  delete(item: T): boolean {
    const chain = this.#chainOf(item);
    const at = this.#scan(chain, item);
    if (at < 0) return false;
    chain[at] = chain[chain.length - 1] as T;
    chain.pop();
    this.#count -= 1;
    return true;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  values(): T[] {
    const found: T[] = [];
    for (const chain of this.#slots) {
      this.__cost += 1;
      for (const item of chain) {
        this.__cost += 1;
        found.push(item);
      }
    }
    return found;
  }

  union(other: RemainderSlotSetOfKeys<T>): RemainderSlotSetOfKeys<T> {
    const made = new RemainderSlotSetOfKeys<T>(this.#spread);
    for (const item of this.values()) made.add(item);
    for (const item of other.values()) made.add(item);
    this.__cost += made.__cost;
    return made;
  }

  intersection(other: RemainderSlotSetOfKeys<T>): RemainderSlotSetOfKeys<T> {
    const made = new RemainderSlotSetOfKeys<T>(this.#spread);
    for (const item of this.values()) {
      if (other.has(item)) made.add(item);
    }
    this.__cost += made.__cost;
    return made;
  }

  difference(other: RemainderSlotSetOfKeys<T>): RemainderSlotSetOfKeys<T> {
    const made = new RemainderSlotSetOfKeys<T>(this.#spread);
    for (const item of this.values()) {
      if (!other.has(item)) made.add(item);
    }
    this.__cost += made.__cost;
    return made;
  }

  /** 흩지 않는다. 펴기 값을 자리 수로 나눈 나머지가 그대로 자리다. */
  #chainOf(item: T): T[] {
    this.__cost += 1;
    const spread = this.#spread(item) >>> 0;
    const chain = this.#slots[spread % this.#slots.length] as T[];
    this.__cost += 1;
    return chain;
  }

  #scan(chain: readonly T[], item: T): number {
    for (let at = 0; at < chain.length; at++) {
      this.__cost += 1;
      if (Object.is(chain[at] as T, item)) return at;
    }
    return -1;
  }

  #rebuild(slots: number): void {
    const previous = this.#slots;
    this.#slots = emptyChains<T>(slots);
    for (const chain of previous) {
      this.__cost += 1;
      for (const item of chain) {
        this.__cost += 1;
        this.#chainOf(item).push(item);
      }
    }
  }
}

function emptyChains<T>(count: number): T[][] {
  const made: T[][] = [];
  for (let at = 0; at < count; at++) made.push([]);
  return made;
}
