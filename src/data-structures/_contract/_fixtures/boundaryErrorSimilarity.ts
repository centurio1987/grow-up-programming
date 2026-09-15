/**
 * 판정 도구 fixture — **결함이 아니다.** `probabilistic/minHash` 계약의 확률 문장을 **경계에서** 지키는 구현.
 *
 * 들어온 원소를 언어 `Set` 에 빠짐없이 담는다. 닮음은 두 집합이 같으면 1 이고, 다르면 두 집합을 해시한 값의 짝(작은 쪽 · 큰
 * 쪽으로 줄 세워 섞은 것 — 부르는 방향 · 넣은 순서 · 중복과 무관하다)이 **확률 δ** 쪽에 떨어질 때 참 닮음에서 ε 를 딱 넘게
 * 벗어난 값(참 닮음 + ε + 10^−6, 1 을 넘으면 참 닮음 − ε − 10^−6), 아니면 정확한 자카드 닮음이다. 서로 다른 짝마다 벗어날
 * 확률이 목표 δ 와 같은 구현이라, 여유를 작게 잡은 판정이면 이 구현을 떨어뜨린다. 스위트가 한 판정에 기대하는 벗어남 16 개 ·
 * 여유 3 을 고른 근거를 실행으로 보이는 자리다(`boundaryErrorSketch.ts` 와 같은 자리). 같은 집합의 짝은 결정적 쪽이 1 을
 * 요구해 벗어날 수 없으므로, 판정에서 이 구현이 벗어나는 몫은 δ 보다 조금 작다.
 *
 * 해시의 무작위는 **이 모듈이 처음 읽힐 때 한 번** 뽑는다 — 결정적 쪽을 지키려면 인스턴스끼리 해시가 같아야 한다. 정본과 같은
 * 이유다. 짝마다의 답이 서로 독립이라는 것은 해시가 고르게 흩는다는 가정 위에 서 있다 — 증명이 아니라 실측이다. 축1 전용이라
 * 계측기를 두지 않는다.
 */

const START = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
const MULT = (Math.floor(Math.random() * 0x1_0000_0000) | 1) >>> 0;
const SALT = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;

/** 벗어난 값이 판정의 ε 비교(10^−9 여유)를 확실히 넘도록 더하는 몫. */
const OVERSHOOT = 1e-6;

export class BoundaryErrorSimilarity {
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

  similarity(other: BoundaryErrorSimilarity): number {
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
    const unlucky =
      finish(finish(low ^ SALT) ^ high) < this.#delta * 0x1_0000_0000;
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
