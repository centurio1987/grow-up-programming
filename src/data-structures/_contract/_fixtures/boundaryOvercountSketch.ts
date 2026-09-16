/**
 * 판정 도구 fixture — **결함이 아니다.** `probabilistic/countMinSketch` 계약의 확률 문장을 **경계에서** 지키는 구현.
 *
 * 원소마다 받은 증분을 언어 `Map` 에 빠짐없이 센다. 추정은 생성 때 뽑은 무작위로 원소를 해시해 **확률 δ 로** 실제 빈도에
 * ⌊ε·N⌋ + 1 을 더하고(N 은 지금의 총증분 — 한계를 딱 넘는다), 나머지는 실제 빈도 그대로 돌려준다. 같은 원소에는 같은
 * 쪽이 나온다. 원소마다 한계를 넘을 확률이 목표 δ 와 같은 구현이라, 여유를 작게 잡은 판정이면 이 구현을 떨어뜨린다.
 * 스위트가 여유 2 · 한 판정에 기대하는 초과 64 개를 고른 근거를 실행으로 보이는 자리다(`boundaryRateFilter.ts` 와 같은
 * 모양). 흔들림의 실측은 자기시험 머리말에 있다.
 *
 * 원소마다의 답이 서로 독립이라는 것은 해시가 고르게 흩는다는 가정 위에 서 있다 — 증명이 아니라 실측이다. 축1 전용이라
 * 계측기를 두지 않는다.
 */

export class BoundaryOvercountSketch {
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
    this.#threshold = delta * 0x1_0000_0000;
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
  let x = value;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
