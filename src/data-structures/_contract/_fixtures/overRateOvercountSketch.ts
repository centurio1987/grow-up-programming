/**
 * 결함 fixture — `probabilistic/countMinSketch` 계약의 **확률 문장을 어기는** 경계 밖 구현. 추정이 한계를 넘을 확률이 δ 가 아니라
 * min(0.5, 8 · δ) 다. 통계 판정이 δ 를 의미 있게 넘는 구현을 잡는지 보는 자리다.
 *
 * `boundaryOvercountSketch.ts`(원소마다 확률 δ 로 한계를 딱 넘는 정확한 사전)와 모양이 같고 확률만 다르다 — 원소마다 받은 증분을
 * 언어 `Map` 에 세고, 생성 때 뽑은 무작위로 원소를 해시해 확률 r = min(0.5, 8 · δ) 로 실제 빈도에 ⌊ε·N⌋ + 1 을 더한다(같은 원소에는
 * 같은 쪽). 원소마다의 답이 서로 독립이라는 것은 해시가 고르게 흩는다는 가정이다.
 *
 * **왜 8 배 · 위 끝 0.5 인가.** 통계 판정의 해상도는 모양마다 한계 ÷ 시행 수(k/T)다 — (0.1, 0.01) 은 17/320 ≈ 0.053, (0.1, 0.1) 은
 * 11/16 ≈ 0.69. 8 · 0.01 = 0.08 은 앞 모양의 해상도를 넘어 잡혀야 하고, 위 끝 0.5 는 (0.1, 0.1) 모양을 해상도 아래에 두어 **δ 가
 * 작은 모양이 잡는다**는 것을 가르게 한다. 몇 배부터 잡히는지는 `docs/ORD-006-conventions.md` 의 `S24` 절.
 *
 * 축1 전용이라 계측기를 두지 않는다.
 */

/** 한계를 넘을 확률의 배수와 위 끝. 머리말 참고. */
const MULTIPLIER = 8;
const CAP = 0.5;

export class OverRateOvercountSketch {
  readonly #counts = new Map<string, number>();
  readonly #epsilon: number;
  readonly #threshold: number;
  readonly #start = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
  readonly #mult = (Math.floor(Math.random() * 0x1_0000_0000) | 1) >>> 0;
  readonly #salt = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
  #total = 0;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.#epsilon = epsilon;
    this.#threshold = Math.min(CAP, MULTIPLIER * delta) * 0x1_0000_0000;
  }

  update(item: string, count: number): void {
    if (!Number.isSafeInteger(count) || count < 0)
      throw new RangeError(`증분 ${count}`);
    if (count > Number.MAX_SAFE_INTEGER - this.#total)
      throw new RangeError(`총증분 ${this.#total} + ${count}`);
    this.#total += count;
    this.#counts.set(item, (this.#counts.get(item) ?? 0) + count);
  }

  estimate(item: string): number {
    const frequency = this.#counts.get(item) ?? 0;
    let h = this.#start;
    for (let i = 0; i < item.length; i++)
      h = Math.imul(h ^ item.charCodeAt(i), this.#mult);
    const unlucky =
      finish(finish(h ^ item.length) ^ this.#salt) < this.#threshold;
    return unlucky
      ? frequency + Math.floor(this.#epsilon * this.#total) + 1
      : frequency;
  }
}

function finish(value: number): number {
  let x = value | 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
