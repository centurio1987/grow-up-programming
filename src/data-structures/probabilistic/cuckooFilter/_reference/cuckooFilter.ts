/**
 * `probabilistic/cuckooFilter` 정본(규약2).
 *
 * 계약은 `../cuckooFilter.ts` 헤더 한 곳이다(규약1). 이 파일은 그 계약을 지키는 구현 **하나**이고 계약이 허용하는
 * 유일한 구현이 아니다 — 헤더의 검증 등급이 든 자명한 구현(칸마다 수를 세는 블룸 필터,
 * `src/data-structures/_contract/_fixtures/countingBloomFilter.ts`)도 이 계약을 지키고, 스위트에 넣어 확인했다.
 *
 * **이 정본은 원소마다 지문 하나를 칸 네 개짜리 자리 둘 중 하나에 담는다.** 자리가 둘 다 차 있으면 한 칸의 지문을
 * 밀어내 그 지문의 다른 자리로 옮기기를 되풀이한다. 다른 자리는 지금 자리와 지문만으로 계산된다(`i ⊕ h(지문)`) — 원소를
 * 담지 않으므로 옮길 때 원소를 다시 볼 수 없어서다. 자리 수 · 지문 폭 · 칸 수는 계약이 아니라 이 정본의 선택이고, 헤더의
 * 두 매개변수(용량 n · 목표 ε)에서 이렇게 고른다.
 *
 * - **자리 수 B** 는 칸 수(B × 4)가 용량의 두 배 이상인 가장 작은 2 의 거듭제곱이다 — 다 채워도 칸의 절반 이하만 찬다.
 *   2 의 거듭제곱이어야 `i ⊕ h` 가 자리 번호 안에 머문다.
 * - **지문 폭 f** 는 2^f − 1 ≥ 8/ε 인 가장 작은 비트 수다. 넣지 않은 원소가 헷갈리는 것은 제 두 자리에 든 지문이 제
 *   지문과 같을 때이고, 칸의 절반 이하가 찬 동안 두 자리에 든 지문은 기대로 4 개 이하 · 하나가 같을 확률은
 *   1/(2^f − 1) 이라 거짓 양성의 몫이 ε/2 이하다(해시가 고르게 흩는다고 볼 때 — 증명이 아니라 실측이다). ε 가 2^−29
 *   보다 작으면 f 가 32 를 넘으므로 지문을 워드 w = ⌈f/32⌉ 개로 담는다.
 *
 * **밀어내기가 500 번 안에 빈 칸을 못 찾으면 그때 들고 있던 지문을 곁 목록(stash)에 둔다 — 넣기를 거절하지 않는다.**
 * 계약은 「담긴 사본이 용량 미만이고 `has(x)` 가 거짓인 원소의 `add` 는 참」을 결정적으로 요구한다(헤더 「연산 계약」).
 * 밀어내기에 상한을 두고 실패를 돌려주는 흔한 뻐꾸기 필터는 칸이 절반 차 있어도 **드물게** 거절하므로 그 문장을 어긴다.
 * 곁 목록은 드물게만 차므로 `has` · `delete` 가 그것을 훑는 몫은 기대로 상수다. 반대로 **제 자리 둘이 다 차 있고 이미
 * `has(x)` 가 참이면 거절한다** — 같은 지문의 사본을 곁 목록에 끝없이 쌓으면 같은 원소를 거듭 넣는 호출자에게 비용이
 * 사본 수에 비례한다. 계약이 그 거절을 허용한다(헷갈렸거나 사본이 이미 있는 원소).
 *
 * **해시 · 밀어낼 칸은 무작위에 기댄다.** 계약이 확률의 출처를 「구현이 뽑는 무작위」로 정했다(`probabilistic/bloomFilter`
 * 헤더와 같은 판정). 그래서 이 정본의 거짓 양성 수는 **실행마다 다르다** — 절대 수치로 적지 않는다
 * (`docs/ORD-006-conventions.md` 「무작위를 쓰는 정본과 재현성」 규칙 1 · 3).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"지나간 수"* 다(§규약2 계측 단위) — 줄 하나가 원소 문자열의 글자 하나를 지날 때마다
 * 1, 칸 하나 · 곁 목록 항목 하나를 볼 때마다 1, 지문 하나를 밀어낼 때마다 1 이다. 지문을 워드 여럿으로 담아도 칸 하나로
 * 센다. 생성자는 워드 수 + 1 을 한 번에 더한다 — 축3이 생성자 행을 재지 않는다. `__cost` 는 계약이 아니라 정본의
 * 의무다(불변 사실 23).
 *
 * **칸을 `Uint32Array` 에 둔다.** 메모리 직접 사용 목록에 넣지 않는다는 판정(불변 사실 206)이 정본이 상태를 typed array 에
 * 둘 때만 옮겨진다. 곁 목록은 언어 배열이다 — 기대로 비어 있고, 판정이 기대는 저장은 칸 쪽이다.
 */

// #region guide:core
/** 자리 하나의 칸 수. 계약이 아니라 이 정본의 선택이다. */
const SLOTS_PER_BUCKET = 4;
/** 용량을 다 채웠을 때 찬 칸의 몫의 상한. */
const MAX_LOAD = 0.5;
/** 밀어내기를 이만큼 되풀이하고도 빈 칸이 없으면 곁 목록에 둔다. */
const MAX_KICKS = 500;
const WORD_BITS = 32;

export class CuckooFilter {
  readonly #capacity: number;
  /** 자리 수 − 1. 자리 수가 2 의 거듭제곱이라 자리 번호를 이것과 AND 해서 자른다. */
  readonly #bucketMask: number;
  /** 지문 하나의 워드 수 w. */
  readonly #width: number;
  /** 지문 마지막 워드에 남길 비트. */
  readonly #topMask: number;
  /** 칸 `(자리 × 4 + 칸) × w` 부터 w 워드가 지문 하나다. 전부 0 이면 빈 칸이다(지문은 0 이 아니게 만든다). */
  readonly #table: Uint32Array;
  /** 곁 목록. 항목 하나가 `[자리, 지문 워드 w 개]` 로 이어 붙어 있다. */
  readonly #stash: number[] = [];
  /** 줄마다 생성 때 뽑은 시작값 · 곱수. 줄 0 이 첫 자리, 줄 1 ~ w 가 지문이다. */
  readonly #starts: Uint32Array;
  readonly #mults: Uint32Array;
  /** 다른 자리를 계산할 때 지문에 섞는 무작위 값. */
  readonly #altSalt: number;
  readonly #folded: Uint32Array;
  /** 지금 다루는 원소의 지문 · 밀려난 지문을 담는 자리. */
  readonly #print: Uint32Array;
  readonly #carry: Uint32Array;
  #count = 0;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  constructor(capacity: number, falsePositiveRate: number) {
    if (!Number.isInteger(capacity) || capacity < 0) {
      throw new RangeError(
        `용량은 0 이상의 정수여야 한다 — 받은 값은 ${capacity} 이다`,
      );
    }
    if (!(falsePositiveRate > 0 && falsePositiveRate < 1)) {
      throw new RangeError(
        `목표 거짓 양성률은 0 과 1 사이여야 한다 — 받은 값은 ${falsePositiveRate} 이다`,
      );
    }
    this.#capacity = capacity;
    const bits = Math.ceil(Math.log2(8 / falsePositiveRate + 1));
    this.#width = Math.ceil(bits / WORD_BITS);
    const topBits = bits - WORD_BITS * (this.#width - 1);
    this.#topMask =
      topBits === WORD_BITS ? 0xffff_ffff : ((1 << topBits) >>> 0) - 1;

    const wanted = Math.max(
      1,
      Math.ceil(capacity / (SLOTS_PER_BUCKET * MAX_LOAD)),
    );
    let buckets = 1;
    while (buckets < wanted) buckets *= 2;
    this.#bucketMask = buckets - 1;
    this.#table = new Uint32Array(buckets * SLOTS_PER_BUCKET * this.#width);

    const lines = this.#width + 1;
    this.#starts = new Uint32Array(lines);
    this.#mults = new Uint32Array(lines);
    this.#folded = new Uint32Array(lines);
    for (let j = 0; j < lines; j++) {
      this.#starts[j] = randomWord();
      this.#mults[j] = randomWord() | 1;
    }
    this.#altSalt = randomWord();
    this.#print = new Uint32Array(this.#width);
    this.#carry = new Uint32Array(this.#width);
    this.__cost += this.#table.length + 1;
  }

  add(item: string): boolean {
    if (this.#count >= this.#capacity) return false;
    const first = this.#fold(item);
    const second = this.#alternate(first, this.#print);
    if (this.#placeIn(first, this.#print) || this.#placeIn(second, this.#print))
      return this.#accepted();
    // 제 자리 둘이 다 찼다. 이미 헷갈리거나 사본이 있으면 거절한다 — 계약이 허용한 자리다(머리말).
    if (this.#holds(first, second, this.#print)) return false;

    this.#carry.set(this.#print);
    let bucket = Math.random() < 0.5 ? first : second;
    for (let kick = 0; kick < MAX_KICKS; kick++) {
      const slot = Math.floor(Math.random() * SLOTS_PER_BUCKET);
      this.#swap(bucket, slot, this.#carry);
      bucket = this.#alternate(bucket, this.#carry);
      if (this.#placeIn(bucket, this.#carry)) return this.#accepted();
    }
    this.#stash.push(bucket, ...this.#carry);
    return this.#accepted();
  }

  has(item: string): boolean {
    const first = this.#fold(item);
    const second = this.#alternate(first, this.#print);
    return this.#holds(first, second, this.#print);
  }

  delete(item: string): boolean {
    const first = this.#fold(item);
    const second = this.#alternate(first, this.#print);
    for (const bucket of first === second ? [first] : [first, second]) {
      for (let slot = 0; slot < SLOTS_PER_BUCKET; slot++) {
        this.__cost += 1;
        const at = this.#offset(bucket, slot);
        if (this.#matches(at, this.#print)) {
          this.#table.fill(0, at, at + this.#width);
          this.#count -= 1;
          return true;
        }
      }
    }
    const step = this.#width + 1;
    for (let at = 0; at < this.#stash.length; at += step) {
      this.__cost += 1;
      if (this.#stashMatches(at, first, second, this.#print)) {
        this.#stash.splice(at, step);
        this.#count -= 1;
        return true;
      }
    }
    return false;
  }

  #accepted(): true {
    this.#count += 1;
    return true;
  }

  /** 원소를 접어 지문을 `#print` 에 두고 첫 자리를 돌려준다. 줄 하나가 글자 하나를 지날 때마다 1 을 센다. */
  #fold(item: string): number {
    const lines = this.#folded.length;
    for (let j = 0; j < lines; j++) this.#folded[j] = this.#starts[j] as number;
    for (let i = 0; i < item.length; i++) {
      const code = item.charCodeAt(i);
      for (let j = 0; j < lines; j++) {
        this.#folded[j] = Math.imul(
          (this.#folded[j] as number) ^ code,
          this.#mults[j] as number,
        );
      }
    }
    this.__cost += item.length * lines;
    let nonzero = 0;
    for (let j = 0; j < this.#width; j++) {
      let word = finish((this.#folded[j + 1] as number) ^ item.length);
      if (j === this.#width - 1) word = (word & this.#topMask) >>> 0;
      this.#print[j] = word;
      nonzero |= word;
    }
    if (nonzero === 0) this.#print[0] = 1;
    return finish((this.#folded[0] as number) ^ item.length) & this.#bucketMask;
  }

  /** 지문이 `bucket` 에 있을 때의 다른 자리. 두 번 부르면 제자리로 돌아온다. */
  #alternate(bucket: number, print: Uint32Array): number {
    return (
      (bucket ^ finish((print[0] as number) ^ this.#altSalt)) & this.#bucketMask
    );
  }

  #offset(bucket: number, slot: number): number {
    return (bucket * SLOTS_PER_BUCKET + slot) * this.#width;
  }

  #matches(at: number, print: Uint32Array): boolean {
    for (let j = 0; j < this.#width; j++)
      if (this.#table[at + j] !== print[j]) return false;
    return true;
  }

  /** `bucket` 의 빈 칸에 지문을 둔다. 빈 칸이 없으면 거짓. */
  #placeIn(bucket: number, print: Uint32Array): boolean {
    for (let slot = 0; slot < SLOTS_PER_BUCKET; slot++) {
      this.__cost += 1;
      const at = this.#offset(bucket, slot);
      if (this.#table[at] === 0 && this.#emptyAt(at)) {
        this.#table.set(print, at);
        return true;
      }
    }
    return false;
  }

  #emptyAt(at: number): boolean {
    for (let j = 0; j < this.#width; j++)
      if (this.#table[at + j] !== 0) return false;
    return true;
  }

  /** `bucket` 의 `slot` 칸 지문과 `carry` 를 맞바꾼다. */
  #swap(bucket: number, slot: number, carry: Uint32Array): void {
    this.__cost += 1;
    const at = this.#offset(bucket, slot);
    for (let j = 0; j < this.#width; j++) {
      const held = this.#table[at + j] as number;
      this.#table[at + j] = carry[j] as number;
      carry[j] = held;
    }
  }

  /** 두 자리의 칸이나 곁 목록에 같은 지문이 있는가. */
  #holds(first: number, second: number, print: Uint32Array): boolean {
    for (const bucket of first === second ? [first] : [first, second]) {
      for (let slot = 0; slot < SLOTS_PER_BUCKET; slot++) {
        this.__cost += 1;
        if (this.#matches(this.#offset(bucket, slot), print)) return true;
      }
    }
    const step = this.#width + 1;
    for (let at = 0; at < this.#stash.length; at += step) {
      this.__cost += 1;
      if (this.#stashMatches(at, first, second, print)) return true;
    }
    return false;
  }

  #stashMatches(
    at: number,
    first: number,
    second: number,
    print: Uint32Array,
  ): boolean {
    const bucket = this.#stash[at] as number;
    if (bucket !== first && bucket !== second) return false;
    for (let j = 0; j < this.#width; j++)
      if (this.#stash[at + 1 + j] !== print[j]) return false;
    return true;
  }
}

/** 32비트 무작위 값 하나. */
function randomWord(): number {
  return Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
}

/**
 * 32비트 값을 한 번 섞는다. 곱셈 두 번 사이마다 위쪽 비트를 아래로 접는다 — murmur3 계열의 마무리 섞기에서 가져온
 * 상수이고 유도한 값이 아니다. 부호 없는 값을 돌려준다.
 */
function finish(value: number): number {
  let x = value;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
// #endregion
