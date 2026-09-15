/**
 * `probabilistic/hyperLogLog` 정본(규약2).
 *
 * 계약은 `../hyperLogLog.ts` 헤더 한 곳이다(규약1). 이 파일은 그 계약을 지키는 구현 **하나**이고 계약이 허용하는
 * 유일한 구현이 아니다.
 *
 * **이 정본은 자리 m 개에 작은 수를 하나씩 둔다.** 원소 하나를 해시해 자리 하나를 고르고, 둘째 해시의 앞쪽 0 비트 수 + 1
 * 을 그 자리의 값과 견줘 큰 쪽을 남긴다. 추정은 자리 값들의 조화 평균에서 나온다 — E = α_m · m² / Σ 2^{−M[j]}. E 가 2.5 m
 * 이하이고 빈 자리 V 가 있으면 빈 자리의 몫으로 센 값 m · ln(m / V) 를 대신 쓴다. α_m 은 m = 16 · 32 · 64 에서 0.673 ·
 * 0.697 · 0.709, 그 위에서 0.7213 / (1 + 1.079 / m) 이다 — 원 논문(Flajolet 외 2007)의 상수를 옮겼고 유도하지 않았다.
 *
 * **m 은 계약이 아니라 이 정본의 선택이다.** 헤더의 두 매개변수(상대 오차 ε · 실패 확률 δ)에서 m = 2^p 를 이렇게 고른다.
 *
 * - p = ⌈log₂(2 / (ε² · δ))⌉, 4 이상. 추정의 상대 표준 오차를 1.04 / √m 으로 보면 체비쇼프 부등식으로 상대 오차가 ε 를 넘을
 *   확률이 1.04² / (m · ε²) ≤ 0.55 δ 다. 1.04 / √m 은 원소가 많을 때의 근사이고 m 이 작을수록 조금 크다(m = 16 에서 1.106)
 *   — 그래서 체비쇼프 식이 요구하는 1.08 / (ε² · δ) 보다 두 배 가까이 크게 잡았다. **이것은 증명이 아니라 근사 위의
 *   논증이고**, 원소 수 전 구간(빈 자리로 세는 구간 · 조화 평균으로 넘어가는 자리 · 그 위)에서 실패 몫이 δ 아래라는 것은
 *   실측이다 — `docs/ORD-006-conventions.md` 「A군 스케치 둘」.
 * - p 는 30 에서 멈춘다. 그 너머는 자리 2^30 을 넘는 배열이라 이 정본이 세우지 못한다 — ε · δ 가 아주 작은 매개변수에서
 *   이 정본은 계약의 보장을 지키지 못한다는 뜻이고, 스위트는 그 자리에 가지 않는다.
 *
 * **해시의 무작위를 인스턴스가 아니라 실행이 뽑는다 — 계약의 결정적 쪽이 요구한다.** 헤더는 같은 실행 안에서 같은
 * 매개변수로 세운 인스턴스에 같은 원소 집합이 들어가면 추정이 같기를 요구하고, 합치기가 따로 세운 두 인스턴스를 받는다.
 * 인스턴스마다 해시를 따로 뽑으면 같은 원소가 두 인스턴스에서 다른 자리로 가 합칠 수 없다. 그래서 줄 둘의 시작값 · 곱수를
 * 이 모듈이 처음 읽힐 때 한 번 뽑는다(`Math.random`). 해시를 고정하지 않는 이유는 블룸 필터 정본과 같다 — 고정하면 그
 * 해시에 대해 한 자리로 몰리는 원소 집합이 실재하고, 그 집합을 미리 고른 호출자에게 실패 확률이 1 이다. 이 정본의 추정은
 * **실행마다 다르다** — 주석 · 문서에 절대 수치로 적지 않는다(「무작위를 쓰는 정본과 재현성」 규칙 3).
 *
 * 문자열 하나를 줄마다 32비트 값 하나로 접는다. 줄은 글자마다 `(h ⊕ c) × M` 을 돌리고(M 은 뽑은 무작위 홀수) 끝에 길이를
 * 섞어 한 번 더 섞는다. 첫 줄의 위쪽 p 비트가 자리이고, 둘째 줄의 앞쪽 0 비트 수 + 1(1 ~ 33)이 자리에 견줄 값이다. 두 줄이
 * 따로 뽑은 무작위라 자리와 값이 서로 독립에 가깝다 — 증명이 아니라 실측이다. 값의 32비트가 원 논문의 「32비트 해시에서
 * 큰 쪽 보정」을 없앤다(자리와 값을 합쳐 32 + p 비트를 쓴다).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"지나간 수"* 다(§규약2 계측 단위) — 줄 하나가 원소 문자열의 글자 하나를 지나갈
 * 때마다 1, 자리 하나에 닿을 때마다 1 이고 읽기와 쓰기를 따로 세지 않는다. `add` 는 글자 수 × 2 + 1, `count` 는 m,
 * `merge` 는 m 이다(합친 새 인스턴스를 여는 몫 m + 1 은 그 새 인스턴스의 `__cost` 에 들어간다). 생성자는 m + 1 을 한 번에
 * 더한다 — 축3이 생성자 행을 재지 않는다. 매개변수가 달라 던지는 `merge` 는 세지 않는다. `__cost` 는 계약이 아니라 정본의
 * 의무다(불변 사실 23).
 *
 * **자리를 `Uint8Array` 에 둔다.** 메모리 직접 사용 목록에 이 구조를 넣지 않는다는 판정(불변 사실 206)은 정본이 상태를 고정
 * 폭 typed array 에 둘 때만 옮겨진다. `number[]` · `Map` 으로 바꾸면 그 판정을 다시 연다.
 */

// #region guide:core
/** 자리 값 r 에 대한 2^{−r}. 값은 0 ~ 33 이다. */
const INVERSE_POWERS = Float64Array.from({ length: 34 }, (_, r) => 2 ** -r);

/** 줄 둘의 시작값과 곱수. 이 모듈이 처음 읽힐 때 한 번 뽑는다 — 머리말 참고. */
const STARTS = Uint32Array.of(randomWord(), randomWord());
const MULTS = Uint32Array.of(randomWord() | 1, randomWord() | 1);

export class HyperLogLog {
  /** 자리 j 의 값. 새로 잡은 자리는 0 이다. */
  readonly #registers: Uint8Array;
  /** 자리 수의 로그 p. 자리 수는 2^p 다. */
  readonly #bits: number;
  readonly #epsilon: number;
  readonly #delta: number;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) {
      throw new RangeError(
        `상대 오차 ε 는 0 과 1 사이여야 한다 — 받은 값은 ${epsilon} 이다`,
      );
    }
    if (!(delta > 0 && delta < 1)) {
      throw new RangeError(
        `실패 확률 δ 는 0 과 1 사이여야 한다 — 받은 값은 ${delta} 이다`,
      );
    }
    this.#epsilon = epsilon;
    this.#delta = delta;
    const wanted = Math.ceil(Math.log2(2 / (epsilon * epsilon * delta)));
    this.#bits = Math.min(30, Math.max(4, wanted));
    this.#registers = new Uint8Array(2 ** this.#bits);
    this.__cost += this.#registers.length + 1;
  }

  add(item: string): void {
    const slot = fold(0, item) >>> (32 - this.#bits);
    const rank = Math.clz32(fold(1, item)) + 1;
    this.__cost += item.length * 2 + 1;
    if (rank > (this.#registers[slot] as number)) this.#registers[slot] = rank;
  }

  count(): number {
    const m = this.#registers.length;
    let sum = 0;
    let empty = 0;
    for (let j = 0; j < m; j++) {
      const rank = this.#registers[j] as number;
      sum += INVERSE_POWERS[rank] as number;
      if (rank === 0) empty++;
    }
    this.__cost += m;
    const raw = (alpha(m) * m * m) / sum;
    if (raw <= 2.5 * m && empty > 0) return m * Math.log(m / empty);
    return raw;
  }

  merge(other: HyperLogLog): HyperLogLog {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta) {
      throw new RangeError(
        `매개변수가 다른 인스턴스는 합치지 않는다 — (${this.#epsilon}, ${this.#delta}) 와 (${other.#epsilon}, ${other.#delta})`,
      );
    }
    const merged = new HyperLogLog(this.#epsilon, this.#delta);
    const target = merged.#registers;
    const mine = this.#registers;
    const theirs = other.#registers;
    for (let j = 0; j < target.length; j++) {
      const a = mine[j] as number;
      const b = theirs[j] as number;
      target[j] = a > b ? a : b;
    }
    this.__cost += target.length;
    return merged;
  }
}

/** 조화 평균 보정 상수 α_m. 머리말 참고. */
function alpha(m: number): number {
  if (m === 16) return 0.673;
  if (m === 32) return 0.697;
  if (m === 64) return 0.709;
  return 0.7213 / (1 + 1.079 / m);
}

/** 줄 `line` 으로 문자열을 32비트 값 하나로 접는다. 부호 없는 값을 돌려준다. */
function fold(line: number, item: string): number {
  const mult = MULTS[line] as number;
  let h = STARTS[line] as number;
  for (let i = 0; i < item.length; i++)
    h = Math.imul(h ^ item.charCodeAt(i), mult);
  return finish(h ^ item.length);
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
