/**
 * 결함 fixture — `probabilistic/minHash` 계약의 **확률 문장을 어기는** 경계 밖 구현. 서로 다른 짝의 닮음이 벗어날 확률이 δ 가 아니라
 * min(0.3, 8 · δ) 다. 통계 판정이 δ 를 의미 있게 넘는 구현을 잡는지 보는 자리다.
 *
 * `boundaryErrorSimilarity.ts`(서로 다른 짝마다 확률 δ 로 한계를 딱 넘는 정확한 닮음)와 모양이 같고 확률만 다르다 — 두 집합을 해시한
 * 값의 짝(작은 쪽 · 큰 쪽으로 줄 세워 섞은 것 — 방향 · 순서 · 중복과 무관)이 확률 r = min(0.3, 8 · δ) 쪽에 떨어지면 참 닮음에서 ε 를
 * 딱 넘게 벗어난 값, 아니면 정확한 자카드 닮음이다. 같은 집합의 짝은 1 이다. 해시의 무작위는 이 모듈이 처음 읽힐 때 뽑는다(결정적
 * 쪽을 지키려고). 짝마다의 답이 서로 독립이라는 것은 해시가 고르게 흩는다는 가정이다.
 *
 * **왜 8 배 · 위 끝 0.3 인가.** 통계 판정의 해상도는 모양마다 한계 ÷ 시행 수(k/T)다 — (0.1, 0.05) 는 20/96 ≈ 0.208, (0.1, 0.1) 은
 * 13/24 ≈ 0.54. 8 · 0.05 = 0.4 는 앞 모양의 해상도를 넘어 잡혀야 하고, 위 끝 0.3 은 (0.1, 0.1) 모양을 해상도 아래에 두어 **δ 가
 * 작은 모양이 잡는다**는 것을 가르게 한다. 몇 배부터 잡히는지는 `docs/ORD-006-conventions.md` 의 `S24` 절.
 *
 * 축1 전용이라 계측기를 두지 않는다.
 */

const START = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
const MULT = (Math.floor(Math.random() * 0x1_0000_0000) | 1) >>> 0;
const SALT = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;

/** 벗어날 확률의 배수와 위 끝. 머리말 참고. */
const MULTIPLIER = 8;
const CAP = 0.3;

/** 벗어난 값이 판정의 ε 비교(10^−9 여유)를 확실히 넘도록 더하는 몫. */
const OVERSHOOT = 1e-6;

export class OverRateErrorSimilarity {
  readonly #items = new Set<string>();
  readonly #epsilon: number;
  readonly #delta: number;
  #mix = 0;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.#epsilon = epsilon;
    this.#delta = delta;
  }

  add(item: string): void {
    if (this.#items.has(item)) return;
    this.#items.add(item);
    this.#mix = (this.#mix ^ hash(item)) >>> 0;
  }

  similarity(other: OverRateErrorSimilarity): number {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    const [small, large] =
      this.#items.size <= other.#items.size
        ? [this.#items, other.#items]
        : [other.#items, this.#items];
    let common = 0;
    for (const item of small) if (large.has(item)) common++;
    const union = this.#items.size + other.#items.size - common;
    if (common === union) return 1;
    const truth = common / union;
    const mine = finish(this.#mix ^ this.#items.size);
    const theirs = finish(other.#mix ^ other.#items.size);
    const low = Math.min(mine, theirs);
    const high = Math.max(mine, theirs);
    const rate = Math.min(CAP, MULTIPLIER * this.#delta);
    const unlucky = finish(finish(low ^ SALT) ^ high) < rate * 0x1_0000_0000;
    if (!unlucky) return truth;
    const bump = this.#epsilon + OVERSHOOT;
    if (truth + bump <= 1) return truth + bump;
    if (truth - bump >= 0) return truth - bump;
    return truth;
  }
}

function hash(item: string): number {
  let h = START;
  for (let i = 0; i < item.length; i++)
    h = Math.imul(h ^ item.charCodeAt(i), MULT);
  return finish(h ^ item.length);
}

function finish(value: number): number {
  let x = value | 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
