/**
 * 결함 fixture — `probabilistic/bloomFilter` 계약의 **확률 문장을 어기는** 경계 밖 구현. 넣지 않은 원소에 참일 확률이 ε 가
 * 아니라 min(0.5, 32 · ε) 다. 통계 판정이 ε 를 의미 있게 넘는 구현을 잡는지 보는 자리다.
 *
 * `boundaryRateFilter.ts`(넣지 않은 원소마다 확률 ε 로 참)와 모양이 같고 확률만 다르다 — 넣은 원소는 언어 `Set` 에 담아 참으로
 * 답하고, 넣지 않은 원소는 생성 때 뽑은 무작위로 원소를 해시해 확률 r = min(0.5, 32 · ε) 로 참을 낸다(같은 원소에는 같은 답).
 * 원소마다의 답이 서로 독립이라는 것은 해시가 고르게 흩는다는 가정이다.
 *
 * **왜 32 배 · 위 끝 0.5 인가.** 통계 판정의 해상도는 모양마다 한계 ÷ 시행 수(k/T)다 — ε 0.001 은 7/312 ≈ 0.0224, ε 0.1 은
 * 11/16 ≈ 0.69. 32 · 0.001 = 0.032 는 앞 모양의 해상도를 넘어 잡혀야 하고, 위 끝 0.5 는 ε 0.1 모양을 해상도 아래에 두어 **ε 가
 * 작은 모양이 잡는다**는 것을 가르게 한다. 몇 배부터 잡히는지는 `docs/ORD-006-conventions.md` 의 `S24` 절.
 *
 * 축1 전용이라 계측기를 두지 않는다.
 */

/** 참일 확률의 배수와 위 끝. 머리말 참고. */
const MULTIPLIER = 32;
const CAP = 0.5;

export class OverRateFilter {
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
    this.#threshold =
      Math.min(CAP, MULTIPLIER * falsePositiveRate) * 0x1_0000_0000;
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
  let x = value | 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
