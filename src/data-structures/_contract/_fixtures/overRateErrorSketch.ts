/**
 * 결함 fixture — `probabilistic/hyperLogLog` 계약의 **확률 문장을 어기는** 경계 밖 구현. 벗어날 확률이 δ 가 아니라
 * min(0.5, 6 · δ) 다. 통계 판정이 δ 를 의미 있게 넘는 구현을 잡는지 보는 자리다.
 *
 * `boundaryErrorSketch.ts`(집합마다 확률 δ 로 한계를 딱 넘는 정확한 집합)와 모양이 같고 확률만 다르다 — 들어온 원소 집합을
 * 해시한 값이 확률 r = min(0.5, 6 · δ) 쪽에 떨어지면 n + ⌊ε·n⌋ + 1, 아니면 n. 해시의 무작위는 이 모듈이 처음 읽힐 때 뽑는다
 * (결정적인 쪽 — 같은 실행 · 같은 매개변수에서 집합의 함수 — 을 지키려고). 집합마다의 답이 서로 독립이라는 것은 해시가 고르게
 * 흩는다는 가정이다.
 *
 * **왜 6 배 · 위 끝 0.5 인가.** 통계 판정의 해상도는 모양마다 한계 ÷ 시행 수(k/T)다 — (0.1, 0.1) 은 21/56 = 0.375, (0.3, 0.3) 은
 * 15/16. 6 · 0.1 = 0.6 은 앞 모양의 해상도를 넘어 잡혀야 하고, 위 끝 0.5 는 (0.3, 0.3) 모양을 해상도 아래에 두어 **δ 가 작은
 * 모양이 잡는다**는 것을 가르게 한다. 몇 배부터 잡히는지는 `docs/ORD-006-conventions.md` 의 `S24` 절.
 *
 * 축1 전용이라 계측기를 두지 않는다.
 */

const START = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
const MULT = (Math.floor(Math.random() * 0x1_0000_0000) | 1) >>> 0;
const SALT = Math.floor(Math.random() * 0x1_0000_0000) >>> 0;

/** 벗어날 확률의 배수와 위 끝. 머리말 참고. */
const MULTIPLIER = 6;
const CAP = 0.5;

export class OverRateErrorSketch {
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
    const rate = Math.min(CAP, MULTIPLIER * this.#delta);
    const unlucky = finish((this.#mix ^ SALT) + n) < rate * 0x1_0000_0000;
    return unlucky ? n + Math.floor(this.#epsilon * n) + 1 : n;
  }

  merge(other: OverRateErrorSketch): OverRateErrorSketch {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    const merged = new OverRateErrorSketch(this.#epsilon, this.#delta);
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
