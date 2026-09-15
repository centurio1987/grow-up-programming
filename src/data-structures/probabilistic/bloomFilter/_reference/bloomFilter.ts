/**
 * `probabilistic/bloomFilter` 정본(규약2).
 *
 * 계약은 `../bloomFilter.ts` 헤더 한 곳이다(규약1). 이 파일은 그 계약을 지키는 구현 **하나**이고 계약이
 * 허용하는 유일한 구현이 아니다 — 헤더가 적었듯 넣은 원소를 빠짐없이 담는 정확한 집합도 이 계약을 지킨다.
 *
 * **이 정본은 원소 하나를 비트 배열의 자리 k 개로 보내 그 자리를 켠다.** 자리 수와 k 는 계약이 아니라 이
 * 정본의 선택이고, 헤더의 두 매개변수(용량 n · 목표 거짓 양성률 ε)에서 이렇게 고른다.
 *
 * - k = ⌈log₂(1/ε)⌉ — 켜진 자리의 몫이 절반이면 넣지 않은 원소의 자리 k 개가 전부 켜져 있을 몫이 2^−k ≤ ε 다.
 * - 자리 수 m 은 k·n / (ln 2 · 0.9) 이상인 가장 작은 32 의 배수다. 원소 n 개가 자리 k·n 번을 켠 뒤의 켜진 몫을
 *   절반보다 조금 아래에 둔다. 0.9 는 **이 정본이 둔 여유**다 — 켜진 몫의 근사 1 − e^{−kn/m} 은 실제 몫보다
 *   조금 작고(`(1 − 1/m)^{kn} ≤ e^{−kn/m}`), 근사 그대로 두면 ε 이 2 의 거듭제곱에 가까울 때(ε = 0.001 에서
 *   2^−10 ≈ 0.000977) 계약의 「ε 이하」가 근사의 오차 안에 든다. 이 여유로 잰 거짓 양성의 몫은
 *   `docs/ORD-006-conventions.md` 「A군 확률 필터 둘」에 있다.
 *
 * **해시는 생성 때 뽑는 무작위에 기댄다 — 계약이 확률의 출처를 「구현이 뽑는 무작위」로 정했기 때문이다**
 * (헤더 「연산 계약」 뒤 「오차 보장」). 원소를 자리로 보내는 함수를 고정하면 그 함수에 대해 전부 켜진 자리로
 * 가는 원소가 **실재하고**, 그 원소를 미리 골라 둔 호출자에게 거짓 양성률은 1 이다
 * (`src/data-structures/_contract/_fixtures/fixedSeedBloomFilter.ts` 가 그것을 실행으로 보인다). 무작위를 씨앗으로
 * 주입받지 않는 것도 같은 이유다(`docs/ORD-006-conventions.md` 「무작위를 쓰는 정본과 재현성」 규칙 1 · 2). 그래서
 * 이 정본이 내는 거짓 양성의 수는 **실행마다 다르다** — 주석 · 문서에 절대 수치로 적지 않고 여러 번 돌린
 * 범위로 적는다(같은 절 규칙 3).
 *
 * 문자열 하나를 32비트 값 t 개로 접는다. 줄마다 글자에 `(h ⊕ c) × M` 을 돌리고(M 은 줄마다 뽑은 무작위 홀수라
 * 곱셈이 2^32 를 법으로 일대일이다) 끝에 길이를 섞어 한 번 더 섞는다. t = 3 + ⌊k / 32⌋ 이다 — 서로 다른 두 원소가
 * 모든 줄에서 겹치면 어떤 자리 수로도 못 가르므로, 겹칠 몫(줄 하나가 고르게 흩는다고 볼 때 2^−32t)을 ε 보다
 * 충분히 작게 누른다. 자리 i 는 첫 두 줄의 `a + i·b` 에 나머지 줄 하나를 섞어 m 으로 나눈 나머지다. 이 조합이 서로
 * 다른 원소를 독립에 가깝게 흩는다는 것은 **증명이 아니라 실측이다.**
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"지나간 수"* 다(§규약2 계측 단위) — 줄 하나가 원소 문자열의 글자 하나를
 * 지나갈 때마다 1, 비트 배열의 자리 하나에 닿을 때마다 1 이고 읽기와 쓰기를 따로 세지 않는다. `add` 는
 * 글자 수 × t + k, `has` 는 글자 수 × t + (처음 꺼진 자리까지 닿은 수)다. 생성자는 워드 수 + 1 을 한 번에 더한다
 * — 축3이 생성자 행을 재지 않는다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **상태를 `Uint32Array` 에 둔다.** 메모리 직접 사용 목록에 이 구조를 넣지 않는다는 판정(불변 사실 206)은 「TS
 * 안에서 절약이 실제 저장으로 보인다」였고, 그것은 정본이 상태를 고정 폭 typed array 에 둘 때만 옮겨진다.
 * `boolean[]` · `Set` 으로 바꾸면 그 판정을 다시 연다.
 */

// #region guide:core
/** 워드 하나에 담는 자리 수. 계약이 아니라 이 정본의 선택이다. */
const WORD_BITS = 32;

/** 켜진 몫을 절반 아래에 두려고 자리 수를 늘리는 여유. 머리말 참고. */
const FILL_SLACK = 0.9;

export class BloomFilter {
  /** 자리 `p` 는 워드 `⌊p / 32⌋` 의 `p mod 32` 번째 비트다. 새로 잡은 워드는 0 이라 모든 자리가 꺼져 있다. */
  readonly #words: Uint32Array;
  /** 자리 수 m. 늘 32 의 배수다. */
  readonly #slots: number;
  /** 원소 하나가 켜는 자리 수 k. */
  readonly #probes: number;
  /** 줄마다 생성 때 뽑은 시작값과 곱수. 줄 수가 t 다. */
  readonly #starts: Uint32Array;
  readonly #mults: Uint32Array;
  /** 원소를 접은 값 t 개를 담는 자리. 호출마다 새로 잡지 않으려고 둔다. */
  readonly #folded: Uint32Array;

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
    this.#probes = Math.max(1, Math.ceil(Math.log2(1 / falsePositiveRate)));
    const wanted =
      (this.#probes * Math.max(capacity, 1)) / (Math.LN2 * FILL_SLACK);
    this.#words = new Uint32Array(Math.ceil(wanted / WORD_BITS));
    this.#slots = this.#words.length * WORD_BITS;

    const lines = 3 + Math.floor(this.#probes / WORD_BITS);
    this.#starts = new Uint32Array(lines);
    this.#mults = new Uint32Array(lines);
    this.#folded = new Uint32Array(lines);
    for (let j = 0; j < lines; j++) {
      this.#starts[j] = randomWord();
      this.#mults[j] = randomWord() | 1;
    }
    this.__cost += this.#words.length + 1;
  }

  add(item: string): void {
    this.#fold(item);
    for (let i = 0; i < this.#probes; i++) {
      const slot = this.#slotOf(i);
      const word = slot >>> 5;
      this.__cost += 1;
      this.#words[word] = (this.#words[word] as number) | (1 << (slot & 31));
    }
  }

  has(item: string): boolean {
    this.#fold(item);
    for (let i = 0; i < this.#probes; i++) {
      const slot = this.#slotOf(i);
      this.__cost += 1;
      if (((this.#words[slot >>> 5] as number) & (1 << (slot & 31))) === 0)
        return false;
    }
    return true;
  }

  /** 문자열을 줄마다 32비트 값 하나로 접어 `#folded` 에 둔다. 줄 하나가 글자 하나를 지날 때마다 1 을 센다. */
  #fold(item: string): void {
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
    for (let j = 0; j < lines; j++)
      this.#folded[j] = finish((this.#folded[j] as number) ^ item.length);
    this.__cost += item.length * lines;
  }

  /** i 번째 자리. 첫 두 줄의 `a + i·b` 에 나머지 줄 하나를 섞고 다시 섞어 자리 수로 나눈 나머지다. */
  #slotOf(i: number): number {
    const folded = this.#folded;
    const extra = folded[2 + (i % (folded.length - 2))] as number;
    const mixed =
      ((folded[0] as number) + Math.imul(i, folded[1] as number)) ^ extra;
    return finish(mixed) % this.#slots;
  }
}

/** 32비트 무작위 값 하나. */
function randomWord(): number {
  return Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
}

/**
 * 32비트 값을 한 번 섞는다. 곱셈 두 번 사이마다 위쪽 비트를 아래로 접는다 — murmur3 계열의 마무리 섞기에서
 * 가져온 상수이고 유도한 값이 아니다. 부호 없는 값을 돌려준다.
 */
function finish(value: number): number {
  let x = value;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
// #endregion
