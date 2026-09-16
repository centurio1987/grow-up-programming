/**
 * 결함 fixture — `probabilistic/cuckooFilter` 계약의 **확률 문장 둘을 어기는** 경계 밖 구현. 사본이 없는 원소의 `has` · `delete` 가
 * 참일 확률이 ε 가 아니라 min(0.5, 48 · ε) 다. 통계 판정이 ε 를 의미 있게 넘는 구현을 잡는지 보는 자리다.
 *
 * 사본을 언어 `Map` 에 원소마다 센다(넣기는 거절하지 않는다). 사본이 없는 원소는 생성 때 뽑은 무작위로 원소를 해시해 확률
 * r = min(0.5, 48 · ε) 로 `has` 참을 내고, 따로 섞은 해시로 확률 r 로 지우기 참을 낸다 — 지우기가 참이면 담긴 사본 중 가장 먼저
 * 들어온 원소의 사본 하나를 뺀다. 사본이 있는 원소는 정확하다. 원소마다의 답이 서로 독립이라는 것은 해시가 고르게 흩는다는 가정이다.
 *
 * **왜 48 배 · 위 끝 0.5 인가.** 통계 판정의 해상도는 모양마다 한계 ÷ 시행 수(k/T)다 — ε 0.01 은 6/16 = 0.375, ε 0.1 은 11/16 ≈
 * 0.69. 48 · 0.01 = 0.48 은 앞 모양의 해상도를 넘어 잡혀야 하고, 위 끝 0.5 는 ε 0.1 모양을 해상도 아래에 두어 **ε 가 작은 모양이
 * 잡는다**는 것을 가르게 한다. 몇 배부터 잡히는지는 `docs/ORD-006-conventions.md` 의 `S24` 절.
 *
 * 축1 전용이라 계측기를 두지 않는다.
 */

/** 참일 확률의 배수와 위 끝. 머리말 참고. */
const MULTIPLIER = 48;
const CAP = 0.5;

export class OverRateCuckooFilter {
  readonly #copies = new Map<string, number>();
  readonly #threshold: number;
  readonly #start = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
  readonly #mult = (Math.floor(Math.random() * 0x1_0000_0000) | 1) >>> 0;
  readonly #hasSalt = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
  readonly #deleteSalt = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;

  constructor(capacity: number, falsePositiveRate: number) {
    if (!Number.isInteger(capacity) || capacity < 0)
      throw new RangeError(`용량 ${capacity}`);
    if (!(falsePositiveRate > 0 && falsePositiveRate < 1))
      throw new RangeError(`목표 오차 ${falsePositiveRate}`);
    this.#threshold =
      Math.min(CAP, MULTIPLIER * falsePositiveRate) * 0x1_0000_0000;
  }

  add(item: string): boolean {
    this.#copies.set(item, (this.#copies.get(item) ?? 0) + 1);
    return true;
  }

  has(item: string): boolean {
    if ((this.#copies.get(item) ?? 0) > 0) return true;
    return this.#unlucky(item, this.#hasSalt);
  }

  delete(item: string): boolean {
    const held = this.#copies.get(item) ?? 0;
    if (held > 0) {
      this.#take(item, held);
      return true;
    }
    if (!this.#unlucky(item, this.#deleteSalt)) return false;
    for (const [other, count] of this.#copies) {
      this.#take(other, count);
      return true;
    }
    return false;
  }

  #take(item: string, held: number): void {
    if (held === 1) this.#copies.delete(item);
    else this.#copies.set(item, held - 1);
  }

  #unlucky(item: string, salt: number): boolean {
    let h = this.#start;
    for (let i = 0; i < item.length; i++)
      h = Math.imul(h ^ item.charCodeAt(i), this.#mult);
    return finish(finish(h ^ item.length) ^ salt) < this.#threshold;
  }
}

function finish(value: number): number {
  let x = value | 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
