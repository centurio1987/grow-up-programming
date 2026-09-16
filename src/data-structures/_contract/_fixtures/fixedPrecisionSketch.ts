/**
 * 결함 fixture — `probabilistic/hyperLogLog` 계약에서 **목표 ε · δ 를 읽지 않고 크기를 정하는** 구현.
 *
 * 정본을 그대로 쓰되 받은 매개변수와 무관하게 늘 자리 16 개(정본을 `(0.99, 0.99)` 로 세우면 p 가 아래 한계 4 로 떨어진다)로
 * 센다. 물려받은 문서의 `precision` 아래 끝(4)과 같은 크기다. 받은 매개변수는 합치기의 거절에만 쓴다. 결정적인 쪽은 정본이
 * 지키는 그대로 지키고, 축3도 통과한다(자리 16 개를 훑는 상수). 상대 표준 오차가 약 26 % 로 고정이라 ε · δ 를 낮추면 벗어나는
 * 몫이 줄지 않는다 — 오차 판정이 목표를 읽는다는 것, 판정 모양이 목표를 여럿 두어야 하는 이유를 보이는 자리다
 * (`fixedWidthBloomFilter.ts` 와 같은 자리). 어느 목표부터 걸리는지는 자기시험 머리말.
 *
 * 계측은 안에 든 정본의 것을 그대로 보고한다(§규약2 계측 단위).
 */

import { HyperLogLog } from "../../probabilistic/hyperLogLog/_reference/hyperLogLog";

/** 정본이 자리 16 개를 고르는 매개변수. */
const SMALLEST = 0.99;

export class FixedPrecisionSketch {
  readonly #inner: HyperLogLog;
  readonly #epsilon: number;
  readonly #delta: number;

  constructor(epsilon: number, delta: number, inner?: HyperLogLog) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.#epsilon = epsilon;
    this.#delta = delta;
    this.#inner = inner ?? new HyperLogLog(SMALLEST, SMALLEST);
  }

  get __cost(): number {
    return this.#inner.__cost;
  }

  add(item: string): void {
    this.#inner.add(item);
  }

  count(): number {
    return this.#inner.count();
  }

  merge(other: FixedPrecisionSketch): FixedPrecisionSketch {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    return new FixedPrecisionSketch(
      this.#epsilon,
      this.#delta,
      this.#inner.merge(other.#inner),
    );
  }
}
