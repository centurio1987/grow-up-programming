/**
 * `hash/hashSet` 정본(규약2).
 *
 * 계약은 `../hashSet.ts` 헤더 한 곳이다. 이 파일은 그 계약을 지키는 구현 **하나**이고
 * 계약이 허용하는 유일한 구현이 아니다. 계약이 처방하지 않는 것이 둘이다 — 충돌을 어떻게
 * 처리하는가(자리에 매다는가 다음 자리로 미는가)와, 집합 연산을 **어느 쪽에서 짓는가**.
 * 뒤엣것이 이 계약의 고유한 자리다: 상한이 수신자의 크기로 적혀 있으므로 수신자를 훑고
 * 인자에 묻는 쪽만 계급이 맞고, 인자를 훑는 구현은 계약을 어기며 **작은 쪽을 골라 훑는
 * 구현은 계약을 지키는데 계급이 아래다**(축3이 그것을 걸러 낸다. 불변 사실 49).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"자리 하나를 지나갈 때마다 1"* 이다 — 표의 칸 하나를
 * 들여다보는 것과 그 칸에 매달린 항목 하나를 견주는 것이 각각 1 이고, 읽기와 쓰기를 따로
 * 세지 않는다(§규약2 계측 단위). 주입된 펴기 호출은 그 자체로 한 단위라 따로 1 을 센다.
 * `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **집합 연산의 비용은 세 군데에 나뉘어 쌓인다.** 수신자를 훑는 몫은 이 객체에, 인자에 묻는
 * 몫은 인자 객체에, 새 집합에 담는 몫은 그 새 집합에 쌓인다. 셋째 몫은 호출이 끝나기 전에
 * `this.__cost` 로 옮긴다 — 호출 하나가 한 일을 수신자가 보고해야 한 호출의 비용이 된다.
 * 인자 쪽 몫을 옮기지 않는 이유는 그것이 **인자가 자기 계약을 지키느라 쓴 걸음**이라서다.
 * 계약 스위트의 껍데기가 두 집합의 `__cost` 를 더해 읽는다(`../hashSet.contract.ts`).
 *
 * **무작위 곱수 둘이 이 계약을 지탱한다.** 자리를 펴기 값의 함수로만 정하면 — 나머지를 쓰든
 * 비트를 섞든 — 그 함수를 역산해 한 자리로 몰리는 원소 묶음이 **실재한다.** 계약이
 * `expected` 를 적었고 그 기댓값이 *구현이 뽑는 무작위성*에 대한 것이므로, 결정론적 구현은
 * 「호출자가 어떤 원소를 주든」을 지키지 못한다(불변 사실 104·143). 실측으로 갈린다 —
 * 원소를 `i * 65536` 으로 주면 나머지로 자리를 정하는 구현
 * (`../../../_contract/_fixtures/remainderSlotSetOfKeys.ts`)은 담기 비용이 519.97 · 2,055.99
 * · 8,200.00 으로 자라고($r$ = 3.95 · 3.99) 이 정본은 7.51 · 7.52 · 7.53 으로 움직이지
 * 않는다.
 *
 * **곱셈이 두 번인 근거는 T3-01 이 이미 냈다**(불변 사실 144 — 곱수 200 벌에서 한 번 곱하는
 * 쪽이 연속 키 4.15 · 낮은 비트가 0 인 키 4.10, 두 번 곱하는 쪽이 셋 다 최대 1.28). 여기서
 * 다시 재지 않고, 대신 **이 정본으로 스위트를 30회 돌려 판정이 흔들리지 않는 것**을 확인했다
 * (§규약2 「`expected` 통계는 기댓값이 아니라 중앙값이다」의 절차 — 30회 × 14 시나리오 = 420
 * 판정에서 실패 0건).
 *
 * **약속의 범위를 정확히 적어 둔다.** 여기서 말하는 기댓값은 **곱수를 뽑기 전에 정해진**
 * 원소 묶음에 대한 것이다. 응답을 관측해 곱수를 되짚는 상대는 이 논증이 덮지 않는다.
 *
 * **줄이는 문턱을 둔 것은 `values` 행 때문이다.** 계약이 열거를 `O(n)` 으로 적으므로 표가
 * 담긴 수보다 훨씬 커진 채로 남으면 그 행을 어긴다. 크게 채웠다 크게 지운 뒤에만 드러나는
 * 성질이라 축3은 이 자리를 못 본다(불변 사실 50) — 계약을 지키는 쪽을 코드에 남기고 그
 * 사실을 여기 적는다.
 */

// #region guide:core/types
/** 담긴 원소가 자리 수의 이 비율을 넘으면 자리를 두 배로 늘린다. */
const GROW_ABOVE = 0.75;

/**
 * 이 비율 아래로 내려가면 자리를 절반으로 줄인다.
 *
 * 늘리는 문턱과 벌려 둔 것이 요점이다. 둘이 붙어 있으면 하나 넣고 하나 빼는 것만으로 자리를
 * 다시 정하는 일이 되풀이되고, 그 순간 담기·지우기의 총비용이 호출 수에 비례하지 않는다.
 */
const SHRINK_BELOW = 0.25;

/** 자리 수의 최솟값. 자리 수는 언제나 2의 거듭제곱이다. */
const MIN_SLOTS = 16;

/**
 * 자리를 정하는 데 쓰는 무작위 홀수.
 *
 * 홀수여야 `Math.imul` 곱셈이 $2^{32}$ 를 법으로 일대일이 된다. 짝수를 곱하면 아래쪽 비트가
 * 0 으로 밀려 서로 다른 원소가 곱셈 단계에서 이미 겹친다.
 */
function randomOddMultiplier(): number {
  return ((Math.random() * 0x1_0000_0000) | 1) >>> 0;
}

/**
 * 펴진 값을 32비트 안에서 흩는다. 곱셈 **두 번**이고 사이마다 위쪽 비트를 아래로 접는다.
 *
 * 접는 방향이 위에서 아래인 것에 이유가 있다. 자리를 정할 때 쓰는 것이 **위쪽 비트**라서,
 * 아래쪽에만 정보가 있는 원소를 위로 올려 놓아야 한다. 접는 자리 16 과 15 는 유도한 값이
 * 아니라 murmur3 계열의 마무리 섞기에서 가져온 값이다.
 */
function scatter(spread: number, first: number, second: number): number {
  let mixed = Math.imul(spread ^ (spread >>> 16), first) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 15), second) >>> 0;
  return mixed;
}

/**
 * 자리 수가 `2 ** m` 일 때 위쪽 `m` 비트를 남기는 시프트 값, 곧 `32 - m`.
 *
 * 값이 맞는 것은 셈으로 확인된다 — 자리 수가 `2 ** m` 이면 앞선 0 이 `31 - m` 개이므로
 * `Math.clz32(slots) + 1` 이 `32 - m` 이다.
 *
 * `32 - Math.log2(slots)` 로 적지 않는다. `Math.log2` 는 부동소수점을 돌려주고 표준이 2의
 * 거듭제곱에서 정확한 값을 내도록 요구하지 않으므로, 미세한 오차 하나가 시프트 비트를 통째로
 * 어긋나게 할 수 있다. `Math.clz32` 는 정수 연산이라 그 자리가 없다.
 *
 * **자리 수가 2 이상이라고 전제한다.** `slots === 1` 이면 32 를 돌려주는데 JS 의 `>>>` 는
 * 32 를 0 으로 접으므로 위쪽 한 비트가 아니라 32 비트 전부가 남는다. 이 파일에서 자리 수는
 * 언제나 `MIN_SLOTS` 이상이라 그 자리에 닿지 않는다.
 */
function shiftFor(slots: number): number {
  return Math.clz32(slots) + 1;
}

function emptySlots<T>(count: number): T[][] {
  const made: T[][] = [];
  for (let at = 0; at < count; at++) made.push([]);
  return made;
}
// #endregion

// #region guide:core/class
export class HashSet<T> {
  readonly #spread: (item: T) => number;
  #slots: T[][];
  #count = 0;
  #firstMultiplier = randomOddMultiplier();
  #secondMultiplier = randomOddMultiplier();
  /** 흩은 값에서 위쪽 몇 비트를 쓸지. 자리 수가 `2 ** m` 이면 `32 - m` 이다. */
  #shift = shiftFor(MIN_SLOTS);

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(spread: (item: T) => number) {
    this.#spread = spread;
    this.#slots = emptySlots(MIN_SLOTS);
  }

  add(item: T): void {
    const chain = this.#chainOf(item);
    for (const held of chain) {
      this.__cost += 1;
      if (Object.is(held, item)) return;
    }
    chain.push(item);
    this.#count += 1;
    if (this.#count > this.#slots.length * GROW_ABOVE) {
      this.#rebuild(this.#slots.length * 2);
    }
  }

  has(item: T): boolean {
    for (const held of this.#chainOf(item)) {
      this.__cost += 1;
      if (Object.is(held, item)) return true;
    }
    return false;
  }

  delete(item: T): boolean {
    const chain = this.#chainOf(item);
    for (let at = 0; at < chain.length; at++) {
      this.__cost += 1;
      if (!Object.is(chain[at] as T, item)) continue;

      // 지울 자리에 마지막 항목을 옮겨 담고 꼬리를 뗀다. 매달린 순서는 계약이 정하지
      // 않으므로 앞으로 당길 이유가 없다 — 당기면 그 한 번이 사슬 길이에 비례한다.
      chain[at] = chain[chain.length - 1] as T;
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

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  values(): T[] {
    const found: T[] = [];
    for (const chain of this.#slots) {
      this.__cost += 1;
      for (const held of chain) {
        this.__cost += 1;
        found.push(held);
      }
    }
    return found;
  }

  /**
   * 합집합. **양쪽을 다 훑는다** — 답에 둘의 원소가 전부 들어가므로 다른 길이 없다.
   *
   * 인자에서 원소를 얻는 길로 인자의 `values()` 를 쓴다. 인자가 같은 클래스라 내부를 바로
   * 읽을 수도 있지만 그러면 **두 집합이 같은 펴기를 쓴다고 가정**하게 되고, 계약은 그것을
   * 요구하지 않는다(`../hashSet.ts` 주입 정책).
   */
  union(other: HashSet<T>): HashSet<T> {
    const made = new HashSet<T>(this.#spread);
    for (const item of this.values()) made.add(item);
    for (const item of other.values()) made.add(item);
    this.__cost += made.__cost;
    return made;
  }

  /**
   * 교집합. **수신자만 훑고 인자에는 묻는다.**
   *
   * 답은 대칭인데 비용은 대칭이 아니다. 작은 쪽을 골라 훑으면 호출 하나는 싸지지만 그것은
   * 계약이 적은 계급이 아니고(계약의 n 은 수신자의 크기다), 축3이 그 구현을 걸러 낸다.
   * 어느 쪽이 나은지는 계약이 정하지 않는다 — 고르는 자리라는 사실을 헤더가 적는다.
   */
  intersection(other: HashSet<T>): HashSet<T> {
    const made = new HashSet<T>(this.#spread);
    for (const item of this.values()) {
      if (other.has(item)) made.add(item);
    }
    this.__cost += made.__cost;
    return made;
  }

  /** 차집합. 교집합과 갈리는 곳은 물음의 방향 하나뿐이다. */
  difference(other: HashSet<T>): HashSet<T> {
    const made = new HashSet<T>(this.#spread);
    for (const item of this.values()) {
      if (!other.has(item)) made.add(item);
    }
    this.__cost += made.__cost;
    return made;
  }

  /**
   * 원소가 앉을 자리.
   *
   * 주입된 펴기가 원소를 정수로 펴고, **자리를 정하는 일은 여기서 한다.** 둘을 가른 것이
   * 계약의 주입 정책 그대로다 — 호출자는 정보를 지우지 않을 의무만 지고, 흩는 일은 구현의
   * 몫이다.
   */
  #slotOf(item: T): number {
    this.__cost += 1;
    const spread = this.#spread(item) >>> 0;
    return (
      scatter(spread, this.#firstMultiplier, this.#secondMultiplier) >>>
      this.#shift
    );
  }

  #chainOf(item: T): T[] {
    const chain = this.#slots[this.#slotOf(item)] as T[];
    this.__cost += 1;
    return chain;
  }

  /** 자리 수를 바꾸면 곱수를 다시 뽑는다. 한 번 뽑은 곱수를 끝까지 쓰면 그것을 알아낸
   * 호출자가 다음 자리 수에 맞춘 원소를 고를 수 있다. */
  #rebuild(slots: number): void {
    const previous = this.#slots;
    this.#slots = emptySlots(slots);
    this.#shift = shiftFor(slots);
    this.#firstMultiplier = randomOddMultiplier();
    this.#secondMultiplier = randomOddMultiplier();
    for (const chain of previous) {
      this.__cost += 1;
      for (const held of chain) {
        this.__cost += 1;
        (this.#slots[this.#slotOf(held)] as T[]).push(held);
      }
    }
  }
}
// #endregion
