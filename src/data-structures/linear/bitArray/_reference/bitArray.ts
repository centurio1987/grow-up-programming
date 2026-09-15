/**
 * `linear/bitArray` 정본(규약2).
 *
 * 계약은 `../bitArray.ts` 헤더 한 곳이다(규약1). 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고,
 * 계약이 허용하는 유일한 구현이 아니다. 헤더가 검증 등급 근거로 든 자명한 구현 — 자리마다 불리언
 * 하나를 담는 언어 배열 — 도 이 계약을 지키고, 그 구현을 스위트에 넣어 확인했다
 * (`src/data-structures/_contract/_fixtures/booleanSlotBits.ts`).
 *
 * **이 정본은 자리를 32 개씩 묶어 `Uint32Array` 한 칸에 담는다.** 자리 `i` 는 칸 `⌊i / 32⌋` 의
 * `i mod 32` 번째 비트다. 이것은 계약이 아니다 — 헤더가 공간을 계약 밖에 두었고, 자리의 폭은 어느
 * 연산으로도 관측되지 않는다. 그런데도 이 방식을 고른 이유는 **판정 하나가 여기에 기대기 때문이다.**
 * 메모리 직접 사용 목록(`tools/ord006-escalation.ts`)에 이 구조를 넣지 않는다는 판정(불변 사실 206)은
 * 「TS 안에서 절약이 실제 저장으로 보인다」였고, 그것은 **정본이 상태를 고정 폭 typed array 에 둘 때만**
 * 옮겨진다. 이 정본을 `boolean[]` · `Set` 으로 바꾸면 그 판정을 다시 연다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"칸 하나를 지나갈 때마다 1"* 이다 — **읽기와 쓰기를 따로 세지
 * 않고**, 언어 런타임이 칸 뭉치를 잡고 0 으로 채우는 비용도 세지 않는다(§규약2 계측 단위). 여기서 칸은
 * 비트 32 개를 담은 워드 하나다. `set` · `clear` · `get` 은 워드 하나를 지나 1, `size` 는 세어 둔 수를
 * 읽어 1 이다. 범위 밖 첨자는 워드에 닿기 전에 던지므로 0 이다. 생성자는 워드 수 + 1 을 한 번에 더한다 —
 * 계약이 모든 자리를 끈 채 여는 준비를 `O(n)` 으로 허용한 자리를 계측에도 남긴다(생성자 행은 축3이
 * 재지 않는다). **자리 수가 아니라 워드 수를 세는 것은 성장률을 바꾸지 않는다** — 둘은 32 배 상수로
 * 묶여 있고 축3은 상수 배수를 보지 않는다(불변 사실 6). `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 */

// #region guide:core
/** 워드 하나에 담는 자리 수. 계약이 아니라 이 정본의 선택이다. */
const WORD_BITS = 32;

export class BitArray {
  readonly #size: number;
  /** 자리 `i` 는 워드 `⌊i / 32⌋` 의 `i mod 32` 번째 비트다. 새로 잡은 워드는 0 이라 모든 자리가 꺼져 있다. */
  readonly #words: Uint32Array;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  constructor(n: number) {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(
        `자리 수는 0 이상의 정수여야 한다 — 받은 값은 ${n} 이다`,
      );
    }
    this.#size = n;
    this.#words = new Uint32Array(Math.ceil(n / WORD_BITS));
    this.__cost += this.#words.length + 1;
  }

  set(index: number): void {
    const word = this.#wordOf(index);
    this.__cost += 1;
    this.#words[word] = (this.#words[word] as number) | this.#maskOf(index);
  }

  clear(index: number): void {
    const word = this.#wordOf(index);
    this.__cost += 1;
    this.#words[word] = (this.#words[word] as number) & ~this.#maskOf(index);
  }

  get(index: number): boolean {
    const word = this.#wordOf(index);
    this.__cost += 1;
    return ((this.#words[word] as number) & this.#maskOf(index)) !== 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#size;
  }

  /** 첨자가 `[0, size())` 안의 정수인지 보고 그 자리가 든 워드의 번호를 돌려준다. */
  #wordOf(index: number): number {
    if (!Number.isInteger(index) || index < 0 || index >= this.#size) {
      throw new RangeError(
        `첨자 ${index} 는 [0, ${this.#size}) 안의 정수가 아니다`,
      );
    }
    return Math.floor(index / WORD_BITS);
  }

  /**
   * 워드 안에서 그 자리만 1 인 값. `1 << 31` 은 부호 있는 음수로 나오지만 비트 연산은 32 비트 패턴으로
   * 다루고 `Uint32Array` 에 쓸 때 부호 없는 값으로 바뀌므로 그대로 쓴다.
   */
  #maskOf(index: number): number {
    return 1 << (index % WORD_BITS);
  }
}
// #endregion
