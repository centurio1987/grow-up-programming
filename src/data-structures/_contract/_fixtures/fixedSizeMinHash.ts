/**
 * 결함 fixture — `probabilistic/minHash` 계약에서 **목표 ε · δ 를 읽지 않고 크기를 정하는** 구현.
 *
 * 정본을 그대로 쓰되 받은 매개변수와 무관하게 늘 서명 칸 8 개(정본을 `(0.35, 0.3)` 으로 세우면 k = ⌈ln(2/0.3)/(2 · 0.35²)⌉ = 8
 * 이다)로 견준다. 받은 매개변수는 거절에만 쓴다. 결정적인 쪽은 정본이 지키는 그대로 지키고, 축3도 통과한다(칸 8 개를 훑는
 * 상수). 닮음 0.5 에서 표준 편차가 약 0.18 로 고정이라 ε 를 낮추면 벗어나는 몫이 줄지 않는다 — 오차 판정이 목표를 읽는다는 것,
 * 판정 모양이 목표를 여럿 두어야 하는 이유를 보이는 자리다(`fixedPrecisionSketch.ts` 와 같은 자리). 어느 목표부터 걸리는지는
 * 자기시험 머리말.
 *
 * 계측은 안에 든 정본의 것을 그대로 보고한다(§규약2 계측 단위).
 */

import { MinHash } from "../../probabilistic/minHash/_reference/minHash";

/** 정본이 서명 칸 8 개를 고르는 매개변수. */
const FIXED_EPSILON = 0.35;
const FIXED_DELTA = 0.3;

export class FixedSizeMinHash {
  readonly #inner = new MinHash(FIXED_EPSILON, FIXED_DELTA);
  readonly #epsilon: number;
  readonly #delta: number;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.#epsilon = epsilon;
    this.#delta = delta;
  }

  get __cost(): number {
    return this.#inner.__cost;
  }

  add(item: string): void {
    this.#inner.add(item);
  }

  similarity(other: FixedSizeMinHash): number {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    return this.#inner.similarity(other.#inner);
  }
}
