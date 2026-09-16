/**
 * `hash/lruCache` 정본(규약2).
 *
 * 계약은 `../lruCache.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고,
 * 계약이 허용하는 유일한 구현이 아니다. 계약의 어느 문장도 사슬이나 잇는 목록을 말하지 않는다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — *"구조의 단위 하나를 지나갈
 * 때마다 1"* 이고 읽기와 쓰기를 따로 세지 않는다. 여기서 단위는 셋이다: 표의 칸 하나를 들여다보는
 * 것, 그 칸에 매달린 항목 하나를 견주는 것, 사용 순서의 줄에서 항목 하나를 떼거나 붙이는 것.
 * 주입된 펴기 호출은 그 자체로 한 단위라 따로 1 을 센다. `__cost` 는 계약이 아니라 정본의
 * 의무다(불변 사실 23).
 *
 * **이 구현이 하는 일은 둘을 겹쳐 드는 것이다.** 키로 항목을 찾는 표 하나와, 항목을 쓴 순서대로
 * 잇는 줄 하나. 항목 하나가 두 곳에 동시에 걸려 있으므로 찾은 항목을 줄에서 떼어 맨 앞에 붙이는
 * 일이 상수이고, 줄의 맨 끝이 곧 가장 오래 안 쓴 키다. 표를 찾는 쪽이 `expected`, 줄을 고치는
 * 쪽은 호출마다 상수다.
 *
 * **자리를 정하는 무작위 곱수 둘은 `hash/hashMapChaining` 정본과 같은 이유로 둔다.** 자리를 펴기
 * 값의 함수로만 정하면 그 함수를 역산해 한 자리로 몰리는 키 묶음이 실재하고, 그러면 계약이 말하는
 * 「호출자가 어떤 키를 주든」이 거짓이 된다. 섞는 방식(곱셈 두 번 · 사이에 위쪽 비트 접기)과 그
 * 방식을 고른 실측은 저쪽 정본의 `scatter` 주석에 있고 여기서 다시 재지 않았다.
 *
 * **표를 줄이는 문턱이 없다.** 담긴 수가 줄어드는 연산이 없다 — 밀어내기는 새 키를 담기 직전에만
 * 일어나므로 담긴 수는 용량에 닿은 뒤 그대로 머문다. 그래서 늘리는 쪽만 두었고, 늘리기는 담긴 수가
 * 용량에 닿을 때까지만 일어난다.
 *
 * **생성자는 용량만큼 자리를 미리 잡지 않는다.** 계약의 생성자 행이 `O(n)` 이라 미리 잡는 구현도
 * 들어오지만 이 정본은 칸 16 개로 연다. 그 행은 축3이 재지 않으므로(§규약2 시나리오 규칙 2 — 면제)
 * 계약의 상한과 정본의 계급이 같아야 한다는 요구(불변 사실 49)가 걸리지 않는다.
 */

// #region guide:core/types
/** 표의 칸에 매달리면서 사용 순서의 줄에도 걸려 있는 항목. */
interface Entry<K, V> {
  key: K;
  value: V;
  /** 줄에서 이 항목보다 한 칸 더 최근인 쪽. */
  newer: Entry<K, V> | Ring<K, V>;
  /** 줄에서 이 항목보다 한 칸 더 오래된 쪽. */
  older: Entry<K, V> | Ring<K, V>;
}

/** 줄의 양 끝을 잇는 표지. `newer` 가 가장 오래된 항목, `older` 가 가장 최근 항목을 가리킨다. */
interface Ring<K, V> {
  newer: Entry<K, V> | Ring<K, V>;
  older: Entry<K, V> | Ring<K, V>;
}

/** 담긴 키 수가 칸 수의 이 비율을 넘으면 칸을 두 배로 늘린다. */
const GROW_ABOVE = 0.75;

/** 칸 수의 최솟값. 칸 수는 언제나 2의 거듭제곱이다. */
const MIN_SLOTS = 16;

/** 자리를 정하는 데 쓰는 무작위 홀수. `hash/hashMapChaining` 정본과 같다. */
function randomOddMultiplier(): number {
  return ((Math.random() * 0x1_0000_0000) | 1) >>> 0;
}

/** 펴진 값을 32비트 안에서 흩는다. 곱셈 두 번이고 사이마다 위쪽 비트를 아래로 접는다. */
function scatter(spread: number, first: number, second: number): number {
  let mixed = Math.imul(spread ^ (spread >>> 16), first) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 15), second) >>> 0;
  return mixed;
}

/** 칸 수가 `2 ** m` 일 때 위쪽 `m` 비트를 남기는 시프트 값, 곧 `32 - m`. 칸 수가 2 이상이라고 전제한다. */
function shiftFor(slots: number): number {
  return Math.clz32(slots) + 1;
}

function emptySlots<K, V>(count: number): Entry<K, V>[][] {
  const made: Entry<K, V>[][] = [];
  for (let at = 0; at < count; at++) made.push([]);
  return made;
}
// #endregion

// #region guide:core/class
export class LRUCache<K, V> {
  readonly #capacity: number;
  readonly #spread: (key: K) => number;
  #slots: Entry<K, V>[][] = emptySlots(MIN_SLOTS);
  #count = 0;
  #firstMultiplier = randomOddMultiplier();
  #secondMultiplier = randomOddMultiplier();
  #shift = shiftFor(MIN_SLOTS);
  readonly #ring: Ring<K, V>;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
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
    const entry = this.#find(key);
    if (entry === null) return null;
    this.#touch(entry);
    return entry.value;
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

    // 새 키다. 담긴 수가 용량에 닿아 있으면 가장 오래 안 쓴 것을 먼저 뺀다 — 넣은 뒤에 빼면
    // 새 키 자신이 한순간 용량을 넘기고, 용량 1 에서는 방금 넣은 것을 빼게 된다.
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

  /** 줄에서 떼어 가장 최근 자리에 다시 붙인다. 떼기와 붙이기를 합쳐 항목 하나를 지나간다. */
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

    // 칸의 사슬에서도 뺀다. 사슬 안의 순서는 계약이 정하지 않으므로 마지막 항목을 옮겨 담는다.
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

  /** 키가 앉을 칸. 펴는 일은 주입된 함수가, 흩는 일은 여기서 한다 — 계약의 주입 정책 그대로다. */
  #slotOf(key: K): number {
    this.__cost += 1;
    const spread = this.#spread(key) >>> 0;
    return (
      scatter(spread, this.#firstMultiplier, this.#secondMultiplier) >>>
      this.#shift
    );
  }

  #chainOf(key: K): Entry<K, V>[] {
    const chain = this.#slots[this.#slotOf(key)] as Entry<K, V>[];
    this.__cost += 1;
    return chain;
  }

  #find(key: K): Entry<K, V> | null {
    for (const entry of this.#chainOf(key)) {
      this.__cost += 1;
      if (Object.is(entry.key, key)) return entry;
    }
    return null;
  }

  /** 칸을 늘리고 곱수를 다시 뽑는다. 줄은 그대로다 — 사용 순서는 칸과 무관하다. */
  #rebuild(slots: number): void {
    const previous = this.#slots;
    this.#slots = emptySlots(slots);
    this.#shift = shiftFor(slots);
    this.#firstMultiplier = randomOddMultiplier();
    this.#secondMultiplier = randomOddMultiplier();
    for (const chain of previous) {
      this.__cost += 1;
      for (const entry of chain) {
        this.__cost += 1;
        (this.#slots[this.#slotOf(entry.key)] as Entry<K, V>[]).push(entry);
      }
    }
  }
}
// #endregion
