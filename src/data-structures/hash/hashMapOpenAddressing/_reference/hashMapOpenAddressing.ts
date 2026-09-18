/**
 * `hash/hashMapOpenAddressing` 정본(규약2).
 *
 * 계약은 `../hashMapOpenAddressing.ts` 헤더 한 곳이고, 그 계약은 `hash/hashMapChaining` 의
 * 계약과 **같다.** 이 파일이 있는 이유가 그것이다 — 같은 계약을 전혀 다른 기법으로 지키는
 * 구현을 나란히 두는 것(성격 전환. §규약1 「성격 전환은 이렇게 적는다」).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"자리 하나를 지나갈 때마다 1"* 이다 — 표의 칸 하나를
 * 들여다볼 때마다 1 이고, 읽기와 쓰기를 따로 세지 않는다(§규약2 계측 단위). 주입된 펴기
 * 호출은 그 자체로 한 단위라 따로 1 을 센다. 사슬로 잇는 정본과 **같은 단위**를 쓴다 —
 * 갈리면 두 정본의 실측을 나란히 읽을 수 없다. `__cost` 는 계약이 아니라 정본의 의무다
 * (불변 사실 23).
 *
 * **무작위 곱수 둘이 여기서도 계약을 지탱한다.** 사슬로 잇는 정본과 같은
 * 이유다(불변 사실 104). 기법이 갈려도 그 줄은 안 갈린다.
 *
 * **묘비(tombstone)를 세는 칸이 따로 있다.** 지운 자리를 비었다고 표시하면 그 자리를
 * 지나가야 닿는 키를 못 찾는다. 그래서 「지나가되 앉을 수는 있는」 상태를 하나 더 두고,
 * **살아 있는 수와 쓰인 수를 따로 센다.** 다시 짓는 문턱을 쓰인 수로 보는 것이 요점이다 —
 * 살아 있는 수로만 보면 넣고 지우기를 되풀이할 때 묘비가 표를 가득 채우고 탐사가 끝나지
 * 않는다.
 *
 * **자리를 절반 아래로 두는 것은 계약이 요구하지 않는다.** 이 기법에서 자리가 꽉 찰수록
 * 한 번의 탐사가 길어지므로 문턱을 낮게 잡았을 뿐이고, 문턱 값 자체는 계약의 문장이 아니다.
 * 실제로 0.5·0.75·0.9 로 바꿔 돌려 보면 절대 비용이 갈리는데 셋이 같은 스위트를 전부
 * 통과한다(가이드 3단계의 표 — 불변 사실 80).
 */

// #region guide:core/types
/** 자리 하나의 상태. */
const EMPTY = 0;
const LIVE = 1;
/** 지워진 자리. 앉을 수는 있고, 탐사는 여기서 멈추지 않는다. */
const GONE = 2;

/** 쓰인 자리(살아 있는 것 + 묘비)가 이 비율을 넘으면 표를 다시 짓는다. */
const REBUILD_ABOVE = 0.5;

/** 살아 있는 수가 자리 수의 이 비율 아래로 내려가면 줄인다. */
const SHRINK_BELOW = 0.125;

/** 자리 수의 최솟값. 자리 수는 언제나 2의 거듭제곱이다. */
const MIN_SLOTS = 16;

/**
 * 자리를 정하는 데 쓰는 무작위 홀수. 홀수여야 `Math.imul` 곱셈이 $2^{32}$ 를 법으로
 * 일대일이다. JS 수 전체에 대한 말이 아니라 32비트 안에서의 말이다.
 */
function randomOddMultiplier(): number {
  return ((Math.random() * 0x1_0000_0000) | 1) >>> 0;
}

/**
 * 펴진 값을 32비트 안에서 흩는다. 사슬로 잇는 정본과 **같은 함수**다 — 기법이 갈리는 것은
 * 자리를 정한 뒤의 일이고, 자리를 정하는 방식까지 갈리면 두 정본의 실측을 나란히 읽을 때
 * 무엇이 기법의 몫인지 알 수 없다. 곱셈이 두 번인 근거는 그 파일 헤더에 실측으로 적혀 있다.
 */
function scatter(spread: number, first: number, second: number): number {
  let mixed = Math.imul(spread ^ (spread >>> 16), first) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 15), second) >>> 0;
  return mixed;
}

/**
 * 자리 수가 `2 ** m` 일 때 위쪽 `m` 비트를 남기는 시프트 값. 사슬로 잇는 정본과 같은 이유로
 * `Math.log2` 대신 정수 연산을 쓰고, 같은 이유로 **자리 수가 2 이상**이라고 전제한다
 * (`slots === 1` 이면 32 를 돌려주는데 JS 의 `>>>` 가 32 를 0 으로 접는다).
 */
function shiftFor(slots: number): number {
  return Math.clz32(slots) + 1;
}
// #endregion

// #region guide:core/class
export class HashMapOpenAddressing<K, V> {
  readonly #spread: (key: K) => number;
  #state: Uint8Array;
  #keys: (K | undefined)[];
  #values: (V | undefined)[];
  /** 살아 있는 항목 수. */
  #count = 0;
  /** 살아 있는 것 + 묘비. 다시 짓는 문턱은 이쪽으로 본다. */
  #used = 0;
  #firstMultiplier = randomOddMultiplier();
  #secondMultiplier = randomOddMultiplier();
  #shift = shiftFor(MIN_SLOTS);

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(spread: (key: K) => number) {
    this.#spread = spread;
    this.#state = new Uint8Array(MIN_SLOTS);
    this.#keys = new Array<K | undefined>(MIN_SLOTS);
    this.#values = new Array<V | undefined>(MIN_SLOTS);
  }

  set(key: K, value: V): void {
    const mask = this.#state.length - 1;
    let at = this.#slotOf(key);
    let vacated = -1;

    for (;;) {
      this.__cost += 1;
      const state = this.#state[at];
      if (state === EMPTY) break;
      if (state === GONE) {
        if (vacated < 0) vacated = at;
      } else if (Object.is(this.#keys[at], key)) {
        this.#values[at] = value;
        return;
      }
      at = (at + 1) & mask;
    }

    // 빈 자리까지 왔다. 오는 길에 묘비를 지났으면 거기 앉는다 — 탐사열이 짧아지고,
    // 그 자리는 이미 쓰인 것으로 세어져 있으므로 쓰인 수가 늘지 않는다.
    const put = vacated < 0 ? at : vacated;
    if (vacated < 0) this.#used += 1;
    this.#state[put] = LIVE;
    this.#keys[put] = key;
    this.#values[put] = value;
    this.#count += 1;

    if (this.#used > this.#state.length * REBUILD_ABOVE) this.#rebuild();
  }

  get(key: K): V | null {
    const at = this.#seek(key);
    return at < 0 ? null : (this.#values[at] as V);
  }

  has(key: K): boolean {
    return this.#seek(key) >= 0;
  }

  delete(key: K): boolean {
    const at = this.#seek(key);
    if (at < 0) return false;

    this.#state[at] = GONE;
    this.#keys[at] = undefined;
    this.#values[at] = undefined;
    this.#count -= 1;

    if (
      this.#state.length > MIN_SLOTS &&
      this.#count < this.#state.length * SHRINK_BELOW
    ) {
      this.#rebuild();
    }
    return true;
  }

  keys(): K[] {
    const found: K[] = [];
    for (let at = 0; at < this.#state.length; at++) {
      this.__cost += 1;
      if (this.#state[at] === LIVE) found.push(this.#keys[at] as K);
    }
    return found;
  }

  values(): V[] {
    const found: V[] = [];
    for (let at = 0; at < this.#state.length; at++) {
      this.__cost += 1;
      if (this.#state[at] === LIVE) found.push(this.#values[at] as V);
    }
    return found;
  }

  /**
   * 키가 처음 닿는 자리.
   *
   * 주입된 펴기가 키를 정수로 펴고, **자리를 정하는 일은 여기서 한다.** 계약의 주입 정책
   * 그대로다 — 호출자는 정보를 지우지 않을 의무만 지고, 흩는 일은 구현의 몫이다.
   */
  #slotOf(key: K): number {
    this.__cost += 1;
    const spread = this.#spread(key) >>> 0;
    return (
      scatter(spread, this.#firstMultiplier, this.#secondMultiplier) >>>
      this.#shift
    );
  }

  /** 담겨 있으면 그 자리, 아니면 `-1`. */
  #seek(key: K): number {
    const mask = this.#state.length - 1;
    let at = this.#slotOf(key);
    for (;;) {
      this.__cost += 1;
      const state = this.#state[at];
      if (state === EMPTY) return -1;
      if (state === LIVE && Object.is(this.#keys[at], key)) return at;
      at = (at + 1) & mask;
    }
  }

  /**
   * 표를 다시 짓는다. 묘비가 여기서 사라진다.
   *
   * 새 자리 수는 **살아 있는 수**로 정한다 — 쓰인 수로 정하면 묘비만 많은 표가 이유 없이
   * 두 배로 커진다. 같은 크기로 다시 짓는 일이 정당한 결과이고, 그것이 묘비 청소다.
   */
  #rebuild(): void {
    let slots = MIN_SLOTS;
    while (this.#count >= slots * REBUILD_ABOVE) slots *= 2;

    const previousState = this.#state;
    const previousKeys = this.#keys;
    const previousValues = this.#values;

    this.#state = new Uint8Array(slots);
    this.#keys = new Array<K | undefined>(slots);
    this.#values = new Array<V | undefined>(slots);
    this.#shift = shiftFor(slots);
    this.#firstMultiplier = randomOddMultiplier();
    this.#secondMultiplier = randomOddMultiplier();
    this.#used = this.#count;

    const mask = slots - 1;
    for (let from = 0; from < previousState.length; from++) {
      this.__cost += 1;
      if (previousState[from] !== LIVE) continue;
      const key = previousKeys[from] as K;
      let at = this.#slotOf(key);
      while (this.#state[at] === LIVE) {
        this.__cost += 1;
        at = (at + 1) & mask;
      }
      this.__cost += 1;
      this.#state[at] = LIVE;
      this.#keys[at] = key;
      this.#values[at] = previousValues[from] as V;
    }
  }
}
// #endregion
