/**
 * 결함 fixture — `probabilistic/hyperLogLog` 계약의 **퇴화 구현**. 추정이 `add` 를 부른 횟수다(합치면 두 쪽 횟수의 합).
 *
 * 같은 원소를 거듭 넣지 않는 호출자에게는 정확한 답이라 오차 보장만 보면 그럴듯하다. 걸리는 자리가 둘이다 — ① 결정적인
 * 쪽: 이미 들어온 원소를 다시 넣으면 추정이 1 늘고, 두 쪽에 같은 원소가 있으면 합친 추정이 합집합의 크기를 넘는다. ② 오차
 * 판정: 판정이 둘에 한 번 앞서 넣은 원소를 다시 넣으므로 추정이 약 1.5 n 이 되어 상대 오차가 약 0.5 다.
 * `docs/ORD-006-conventions.md` 「A군 17종 판정」 ④ 가 「결정적 쪽은 중복에 무감」이라 적은 까닭이 이 구현이다.
 *
 * 매개변수 거절은 헤더 「주입 정책」대로 한다. 계측 단위는 정본과 같다(§규약2 계측 단위) — 호출마다 1.
 */

export class CallCountSketch {
  __cost = 0;
  readonly #epsilon: number;
  readonly #delta: number;
  #calls = 0;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.#epsilon = epsilon;
    this.#delta = delta;
    this.__cost += 1;
  }

  add(_item: string): void {
    this.__cost += 1;
    this.#calls += 1;
  }

  count(): number {
    this.__cost += 1;
    return this.#calls;
  }

  merge(other: CallCountSketch): CallCountSketch {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    this.__cost += 1;
    const merged = new CallCountSketch(this.#epsilon, this.#delta);
    merged.#calls = this.#calls + other.#calls;
    return merged;
  }
}
