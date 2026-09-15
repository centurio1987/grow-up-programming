/**
 * 판정 도구 fixture — **결함이 아니다.** `probabilistic/bloomFilter` 계약의 확률 문장을 **경계에서** 지키는 구현.
 *
 * 넣은 원소는 언어 `Set` 에 빠짐없이 담아 참으로 답하고, 넣지 않은 원소에는 생성 때 뽑은 무작위로 원소를 해시해 **확률
 * ε 로** 참을 낸다(같은 원소에는 같은 답). 거짓 양성의 몫이 목표 오차와 같은 구현이라, 여유를 작게 잡은 판정이면 이 구현을
 * 떨어뜨린다. 스위트가 여유 2 · 한 판정에 기대하는 참 64 개를 고른 근거를 실행으로 보이는 자리다 — 체르노프 상한으로 한
 * 판정에서 떨어질 확률이 e^{−64/3} 이하이고, 자기시험이 이 구현으로 축1 전부를 돌려 통과를 단정한다. 흔들림의 실측은
 * 자기시험 머리말에 있다.
 *
 * 원소마다의 답이 서로 독립이라는 것은 해시가 고르게 흩는다는 가정 위에 서 있다 — 증명이 아니라 실측이다. 축1 전용이라
 * 계측기를 두지 않는다.
 */

export class BoundaryRateFilter {
  readonly #items = new Set<string>();
  readonly #threshold: number;
  readonly #start = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
  readonly #mult = (Math.floor(Math.random() * 0x1_0000_0000) | 1) >>> 0;
  readonly #salt = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;

  constructor(capacity: number, falsePositiveRate: number) {
    if (!Number.isInteger(capacity) || capacity < 0)
      throw new RangeError(`용량 ${capacity}`);
    if (!(falsePositiveRate > 0 && falsePositiveRate < 1))
      throw new RangeError(`목표 오차 ${falsePositiveRate}`);
    this.#threshold = falsePositiveRate * 0x1_0000_0000;
  }

  add(item: string): void {
    this.#items.add(item);
  }

  has(item: string): boolean {
    if (this.#items.has(item)) return true;
    let h = this.#start;
    for (let i = 0; i < item.length; i++)
      h = Math.imul(h ^ item.charCodeAt(i), this.#mult);
    return finish(finish(h ^ item.length) ^ this.#salt) < this.#threshold;
  }
}

function finish(value: number): number {
  let x = value;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
