/**
 * `probabilistic/countMinSketch` 정본(규약2).
 *
 * 계약은 `../countMinSketch.ts` 헤더 한 곳이다(규약1). 이 파일은 그 계약을 지키는 구현 **하나**이고 계약이
 * 허용하는 유일한 구현이 아니다 — 헤더가 적었듯 원소마다 증분을 빠짐없이 세는 정확한 사전도 이 계약을 지킨다.
 *
 * **이 정본은 수를 담는 줄 d 개를 두고, 원소 하나를 줄마다 칸 하나로 보내 그 칸에 증분을 더한다.** 추정은 원소가
 * 가는 칸 d 개 중 가장 작은 값이다. 줄 수 d 와 줄마다 칸 수 w 는 계약이 아니라 이 정본의 선택이고, 헤더의 두
 * 매개변수(목표 오차 ε · 실패 확률 δ)에서 이렇게 고른다.
 *
 * - w = ⌈e / ε⌉ — 한 줄에서 원소 x 가 가는 칸에 **다른 원소**가 더한 양의 기댓값이 총증분 N 의 1/w 이하이고(칸이
 *   고르게 흩어진다고 볼 때), 마르코프 부등식으로 그 양이 ε·N 을 넘을 확률이 1/e 이하다.
 * - d = ⌈ln(1/δ)⌉ — 줄마다 칸을 따로 고르면 d 줄이 모두 넘을 확률이 e^{−d} ≤ δ 다.
 *
 * 줄마다 칸을 고르는 함수가 서로 독립이고 고르게 흩는다는 것은 **증명이 아니라 실측이다** — 실측은
 * `docs/ORD-006-conventions.md` 「A군 스케치 둘」.
 *
 * **해시는 생성 때 뽑는 무작위에 기댄다 — 계약이 확률의 출처를 「구현이 뽑는 무작위」로 정했기 때문이다**
 * (헤더 「오차 보장」). 원소를 칸으로 보내는 함수를 고정하면 그 함수에 대해 줄마다 무거운 원소와 같은 칸으로 가는
 * 원소가 실재하고, 그 원소를 미리 골라 둔 호출자에게 실패 확률은 1 이다. 그래서 이 정본이 내는 과대 추정은
 * **실행마다 다르다** — 주석 · 문서에 절대 수치로 적지 않고 여러 번 돌린 범위로 적는다
 * (「무작위를 쓰는 정본과 재현성」 규칙 3).
 *
 * 문자열 하나를 줄마다 32비트 값 하나로 접는다. 줄 j 는 글자마다 `(h ⊕ c) × M_j` 를 돌리고(M_j 는 줄마다 뽑은
 * 무작위 홀수라 곱셈이 2^32 를 법으로 일대일이다) 끝에 길이를 섞어 한 번 더 섞은 뒤 w 로 나눈 나머지를 칸으로
 * 쓴다. 줄마다 글자를 따로 지나가므로 한 호출이 L · d 에 비례한다 — 헤더 상한 `O(L · log(1/δ))` 의 계급 그대로다.
 *
 * **칸은 `Float64Array` 다.** 증분은 안전한 정수이고 총증분이 `Number.MAX_SAFE_INTEGER` 이하라는 것을 헤더가 요구하므로
 * 칸의 값은 늘 정확한 정수다 — 칸끼리 더한 순서가 참 빈도와 달라도 반올림이 끼지 않아 「추정 ≥ 실제 빈도」가
 * 부동소수점에서도 선다. 메모리 직접 사용 목록에 이 구조를 넣지 않는다는 판정(불변 사실 206)은 정본이 상태를 고정
 * 폭 typed array 에 둘 때만 옮겨진다. `number[][]` 로 바꾸면 그 판정을 다시 연다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"지나간 수"* 다(§규약2 계측 단위) — 줄 하나가 원소 문자열의 글자 하나를
 * 지나갈 때마다 1, 칸 하나에 닿을 때마다 1 이고 읽기와 쓰기를 따로 세지 않는다. `update` · `estimate` 는 둘 다
 * `(글자 수 + 1) × d` 다. 증분이 범위 밖이라 던지는 호출은 세지 않는다. 생성자는 칸 수 + 1 을 한 번에 더한다 — 축3이
 * 생성자 행을 재지 않는다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **이 정본이 세우지 못하는 매개변수가 있다.** ε 가 아주 작으면 칸 w · d 개를 한 배열에 담지 못해 생성자가 언어의
 * `RangeError`(배열 길이)를 던진다. 계약의 매개변수 범위 (0, 1) 전부를 이 정본이 받지는 못한다는 뜻이고, 스위트는
 * 그 자리에 가지 않는다.
 */

// #region guide:core
export class CountMinSketch {
  /** 줄 j 의 칸 i 는 `#cells[j · w + i]` 다. 새로 잡은 칸은 0 이다. */
  readonly #cells: Float64Array;
  /** 줄마다 칸 수 w. */
  readonly #width: number;
  /** 줄 수 d. */
  readonly #depth: number;
  /** 줄마다 생성 때 뽑은 시작값과 곱수. */
  readonly #starts: Uint32Array;
  readonly #mults: Uint32Array;
  /** 지금까지 받은 증분의 합. 넘치는 증분을 거절하는 데만 쓴다. */
  #total = 0;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) {
      throw new RangeError(
        `목표 오차 ε 는 0 과 1 사이여야 한다 — 받은 값은 ${epsilon} 이다`,
      );
    }
    if (!(delta > 0 && delta < 1)) {
      throw new RangeError(
        `실패 확률 δ 는 0 과 1 사이여야 한다 — 받은 값은 ${delta} 이다`,
      );
    }
    this.#width = Math.ceil(Math.E / epsilon);
    this.#depth = Math.max(1, Math.ceil(Math.log(1 / delta)));
    this.#cells = new Float64Array(this.#width * this.#depth);
    this.#starts = new Uint32Array(this.#depth);
    this.#mults = new Uint32Array(this.#depth);
    for (let j = 0; j < this.#depth; j++) {
      this.#starts[j] = randomWord();
      this.#mults[j] = randomWord() | 1;
    }
    this.__cost += this.#cells.length + 1;
  }

  update(item: string, count: number): void {
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new RangeError(
        `증분은 0 이상의 안전한 정수여야 한다 — 받은 값은 ${count} 이다`,
      );
    }
    if (count > Number.MAX_SAFE_INTEGER - this.#total) {
      throw new RangeError(
        `총증분이 ${Number.MAX_SAFE_INTEGER} 를 넘는다 — 지금 ${this.#total} 에 ${count} 를 더하려 했다`,
      );
    }
    this.#total += count;
    for (let j = 0; j < this.#depth; j++) {
      const at = j * this.#width + this.#slotOf(j, item);
      this.__cost += 1;
      this.#cells[at] = (this.#cells[at] as number) + count;
    }
  }

  estimate(item: string): number {
    let least = Number.POSITIVE_INFINITY;
    for (let j = 0; j < this.#depth; j++) {
      const value = this.#cells[j * this.#width + this.#slotOf(j, item)];
      this.__cost += 1;
      if ((value as number) < least) least = value as number;
    }
    return least;
  }

  /** 줄 j 에서 원소가 가는 칸. 줄 하나가 글자 하나를 지날 때마다 1 을 센다. */
  #slotOf(j: number, item: string): number {
    const mult = this.#mults[j] as number;
    let h = this.#starts[j] as number;
    for (let i = 0; i < item.length; i++)
      h = Math.imul(h ^ item.charCodeAt(i), mult);
    this.__cost += item.length;
    return finish(h ^ item.length) % this.#width;
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
