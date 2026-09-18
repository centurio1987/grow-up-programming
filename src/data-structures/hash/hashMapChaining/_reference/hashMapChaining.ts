/**
 * `hash/hashMapChaining` 정본(규약2).
 *
 * 계약은 `../hashMapChaining.ts` 헤더 한 곳이다. 이 파일은 그 계약을 지키는 구현 **하나**이고
 * 계약이 허용하는 유일한 구현이 아니다 — `hash/hashMapOpenAddressing` 정본이 같은 계약을
 * 같은 스위트로 지킨다(성격 전환. §규약1 「성격 전환은 이렇게 적는다」).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"자리 하나를 지나갈 때마다 1"* 이다 — 표의 칸 하나를
 * 들여다보는 것과 그 칸에 매달린 항목 하나를 견주는 것이 각각 1 이고, 읽기와 쓰기를 따로
 * 세지 않는다(§규약2 계측 단위). 주입된 펴기 호출은 그 자체로 한 단위라 따로 1 을 센다.
 * `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **무작위 곱수 둘이 이 계약을 지탱한다.** 자리를 펴기 값의 함수로만 정하면 — 나머지를 쓰든
 * 비트를 섞든 — 그 함수를 역산해 한 자리로 몰리는 키 묶음이 **실재한다.** 계약이 `expected`
 * 를 적었고 그 기댓값이 *구현이 뽑는 무작위성*에 대한 것이므로, 결정론적 구현은 「호출자가
 * 어떤 키를 주든」을 지키지 못한다(불변 사실 104 · §규약2 「무작위를 쓰는 정본과 재현성」).
 * 실측으로 갈린다 — 키를 `i * 65536` 으로 주면 나머지로 자리를 정하는 구현
 * (`_contract/_fixtures/remainderSlotDictionary.ts`)은 담기 비용이 1,024·4,096·16,384 에서
 * 518.5 · 2,054.5 · 8,198.5 로 자라고($r$ = 3.96 · 3.99) 이 정본은 7.52 · 7.52 · 7.52 로
 * 움직이지 않는다.
 *
 * **약속의 범위를 정확히 적어 둔다.** 여기서 말하는 기댓값은 **곱수를 뽑기 전에 정해진** 키
 * 묶음에 대한 것이다. 응답 시간이나 사슬 길이를 관측해 곱수를 되짚는 상대는 이 논증이 덮지
 * 않는다 — `scatter` 는 암호학적 함수가 아니고 그런 상대를 막는 것은 이 계약의 목적에도 없다.
 * 그리고 아래 `scatter` 주석의 실측은 **두 후보 중 하나를 고른 근거**이지 점근 보장의 증명이
 * 아니다. 보장을 세우는 것은 곱수가 무작위라는 사실이고, 실측은 「한 번 곱하기」가 그 무작위를
 * 충분히 쓰지 못한다는 것을 보인다.
 *
 * 무작위의 대가는 재현성이다 — seed 를 고정하는 쪽은 하네스이고 이 난수는 그 고정 밖에 있다.
 * 재 보니 판정이 흔들리지 않는다: 계약 스위트의 열한 시나리오를 30회 돌려 전부 통과했다.
 *
 * **자리 수를 바꿀 때마다 곱수를 다시 뽑는다.** 한 번 뽑은 곱수를 끝까지 쓰면 그 곱수를
 * 알아낸 호출자가 다음 자리 수에 맞춘 키를 고를 수 있다. 다시 뽑는 비용은 자리를 다시
 * 정하는 일에 이미 들어 있다.
 *
 * **줄이는 문턱을 둔 것은 열거 행 때문이다.** 계약의 `keys`·`values` 가 `O(n)` 이므로 표가
 * 담긴 수보다 훨씬 커진 채로 남으면 그 행을 어긴다. 크게 채웠다 크게 지운 뒤에만 드러나는
 * 성질이라 축3은 이 자리를 못 본다(불변 사실 50) — 그래서 계약을 지키는 쪽을 코드에 남기고
 * 그 사실을 여기 적는다.
 */

// #region guide:core/types
/** 자리 하나에 매달리는 항목. */
interface Entry<K, V> {
  key: K;
  value: V;
}

/** 담긴 키 수가 자리 수의 이 비율을 넘으면 자리를 두 배로 늘린다. */
const GROW_ABOVE = 0.75;

/**
 * 이 비율 아래로 내려가면 자리를 절반으로 줄인다.
 *
 * 늘리는 문턱과 벌려 둔 것이 요점이다. 둘이 붙어 있으면 하나 넣고 하나 빼는 것만으로
 * 자리를 다시 정하는 일이 되풀이되고, 그 순간 담기·지우기의 총비용이 호출 수에 비례하지
 * 않는다.
 */
const SHRINK_BELOW = 0.25;

/** 자리 수의 최솟값. 자리 수는 언제나 2의 거듭제곱이다. */
const MIN_SLOTS = 16;

/**
 * 자리를 정하는 데 쓰는 무작위 홀수.
 *
 * 홀수여야 `Math.imul` 곱셈이 $2^{32}$ 를 법으로 일대일이 된다. 짝수를 곱하면 아래쪽
 * 비트가 0 으로 밀려 서로 다른 키가 곱셈 단계에서 이미 겹친다. JS 수 전체에 대한 말이
 * 아니라 32비트 안에서의 말이다.
 */
function randomOddMultiplier(): number {
  return ((Math.random() * 0x1_0000_0000) | 1) >>> 0;
}

/**
 * 펴진 값을 32비트 안에서 흩는다. 곱셈 **두 번**이고 사이마다 위쪽 비트를 아래로 접는다.
 *
 * 곱셈 한 번으로는 부족하다 — 실측이 그렇게 말한다. 곱수 200 벌을 뽑아 키 4,096 개를
 * 자리 8,192 개에 넣고 「하나를 찾을 때 견주는 평균 개수」를 재면, 한 번 곱하는 쪽은
 * 무작위 키에서 평균 1.251(최대 1.27)로 안정적인데 **연속한 키에서 최대 4.15, 낮은 비트가
 * 0 인 키에서 최대 4.10** 까지 튄다. 곱수를 뽑는 일이 나쁜 것이 아니라, 나쁜 곱수가 뽑힐
 * 확률이 무시할 만하지 않다는 뜻이다. 두 번 곱하는 쪽은 세 묶음 전부 평균 1.250 · 최대
 * 1.28 이다.
 *
 * 접는 방향이 위에서 아래인 것도 이유가 있다. 자리를 정할 때 쓰는 것이 **위쪽 비트**라서,
 * 아래쪽에만 정보가 있는 키(낮은 비트가 0 인 키의 반대쪽)를 위로 올려 놓아야 한다.
 *
 * **접는 자리 16 과 15 는 유도한 값이 아니다.** murmur3 계열의 마무리 섞기가 쓰는 값을
 * 가져와 위 방식으로 재 본 것이고, 다른 값이 더 나은지는 재지 않았다. 이 함수가 보편 해시
 * 족을 이룬다는 증명도 여기 없다 — 계약을 세우는 것은 **곱수를 호출자가 모른다**는 사실이고,
 * 위 실측은 후보 둘 중 하나를 고른 근거다.
 */
function scatter(spread: number, first: number, second: number): number {
  let mixed = Math.imul(spread ^ (spread >>> 16), first) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 15), second) >>> 0;
  return mixed;
}

/**
 * 자리 수가 `2 ** m` 일 때 위쪽 `m` 비트를 남기는 시프트 값, 곧 `32 - m`.
 *
 * `32 - Math.log2(slots)` 로 적지 않는다. `Math.log2` 는 부동소수점을 돌려주고 표준이
 * 2의 거듭제곱에서 정확한 값을 내도록 요구하지 않으므로, 미세한 오차 하나가 시프트 비트를
 * 통째로 어긋나게 할 수 있다. `Math.clz32` 는 정수 연산이라 그 자리가 없다. *
 * **자리 수가 2 이상이라고 전제한다.** `slots === 1` 이면 32 를 돌려주는데 JS 의 `>>>` 는
 * 32 를 0 으로 접으므로 위쪽 한 비트가 아니라 32 비트 전부가 남는다. 이 파일에서 자리 수는
 * 언제나 `MIN_SLOTS` 이상이라 그 자리에 닿지 않는다.
 */
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
export class HashMapChaining<K, V> {
  readonly #spread: (key: K) => number;
  #slots: Entry<K, V>[][];
  #count = 0;
  #firstMultiplier = randomOddMultiplier();
  #secondMultiplier = randomOddMultiplier();
  /** 흩은 값에서 위쪽 몇 비트를 쓸지. 자리 수가 `2 ** m` 이면 `32 - m` 이다. */
  #shift = shiftFor(MIN_SLOTS);

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(spread: (key: K) => number) {
    this.#spread = spread;
    this.#slots = emptySlots(MIN_SLOTS);
  }

  set(key: K, value: V): void {
    const chain = this.#chainOf(key);
    for (const entry of chain) {
      this.__cost += 1;
      if (Object.is(entry.key, key)) {
        entry.value = value;
        return;
      }
    }
    chain.push({ key, value });
    this.#count += 1;
    if (this.#count > this.#slots.length * GROW_ABOVE) {
      this.#rebuild(this.#slots.length * 2);
    }
  }

  get(key: K): V | null {
    const found = this.#find(key);
    return found === null ? null : found.value;
  }

  has(key: K): boolean {
    return this.#find(key) !== null;
  }

  delete(key: K): boolean {
    const chain = this.#chainOf(key);
    for (let at = 0; at < chain.length; at++) {
      this.__cost += 1;
      if (!Object.is((chain[at] as Entry<K, V>).key, key)) continue;

      // 지울 자리에 마지막 항목을 옮겨 담고 꼬리를 뗀다. 사슬의 순서는 계약이 정하지
      // 않으므로 앞으로 당길 이유가 없다 — 당기면 그 한 번이 사슬 길이에 비례한다.
      chain[at] = chain[chain.length - 1] as Entry<K, V>;
      chain.pop();
      this.#count -= 1;
      if (
        this.#slots.length > MIN_SLOTS &&
        this.#count < this.#slots.length * SHRINK_BELOW
      ) {
        this.#rebuild(this.#slots.length / 2);
      }
      return true;
    }
    return false;
  }

  keys(): K[] {
    const found: K[] = [];
    for (const chain of this.#slots) {
      this.__cost += 1;
      for (const entry of chain) {
        this.__cost += 1;
        found.push(entry.key);
      }
    }
    return found;
  }

  values(): V[] {
    const found: V[] = [];
    for (const chain of this.#slots) {
      this.__cost += 1;
      for (const entry of chain) {
        this.__cost += 1;
        found.push(entry.value);
      }
    }
    return found;
  }

  /**
   * 키가 앉을 자리.
   *
   * 주입된 펴기가 키를 정수로 펴고, **자리를 정하는 일은 여기서 한다.** 둘을 가른 것이
   * 계약의 주입 정책 그대로다 — 호출자는 정보를 지우지 않을 의무만 지고, 흩는 일은
   * 구현의 몫이다.
   */
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
