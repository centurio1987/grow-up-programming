/**
 * 판정 도구 fixture — **결함이 아니다.** `probabilistic/hyperLogLog` 계약의 확률 문장을 **경계에서** 지키는 구현.
 *
 * 들어온 원소를 언어 `Set` 에 빠짐없이 담는다. 추정은 들어온 원소 집합을 해시한 값(원소 해시의 배타적 논리합에 원소 수를
 * 섞은 것 — 넣은 순서 · 중복과 무관하다)이 **확률 δ** 쪽에 떨어지면 n + ⌊ε·n⌋ + 1(상대 오차 한계를 딱 넘는다), 아니면 정확한
 * n 이다. 집합마다 벗어날 확률이 목표 δ 와 같은 구현이라, 여유를 작게 잡은 판정이면 이 구현을 떨어뜨린다. 스위트가 한 판정에
 * 기대하는 벗어남 16 개 · 여유 3 을 고른 근거를 실행으로 보이는 자리다(`boundaryRateFilter.ts` 와 같은 자리).
 *
 * 해시의 무작위는 **이 모듈이 처음 읽힐 때 한 번** 뽑는다 — 계약의 결정적 쪽(같은 실행 · 같은 매개변수에서 추정은 들어온
 * 원소 집합의 함수)을 지키려면 인스턴스끼리 해시가 같아야 한다. 정본과 같은 이유다. 집합마다의 답이 서로 독립이라는 것은
 * 해시가 고르게 흩는다는 가정 위에 서 있다 — 증명이 아니라 실측이다. 축1 전용이라 계측기를 두지 않는다.
 */

const START = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
const MULT = (Math.floor(Math.random() * 0x1_0000_0000) | 1) >>> 0;
const SALT = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;

export class BoundaryErrorSketch {
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

  count(): number {
    const n = this.#items.size;
    const unlucky =
      finish((this.#mix ^ SALT) + n) < this.#delta * 0x1_0000_0000;
    return unlucky ? n + Math.floor(this.#epsilon * n) + 1 : n;
  }

  merge(other: BoundaryErrorSketch): BoundaryErrorSketch {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    const merged = new BoundaryErrorSketch(this.#epsilon, this.#delta);
    for (const item of this.#items) merged.add(item);
    for (const item of other.#items) merged.add(item);
    return merged;
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
