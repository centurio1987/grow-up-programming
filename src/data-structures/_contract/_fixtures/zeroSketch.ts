/**
 * 결함 fixture — `probabilistic/hyperLogLog` 계약의 **퇴화 구현**. 무엇이 들어오든 추정이 늘 0 이다.
 *
 * 결정적인 쪽(같은 실행 · 같은 매개변수에서 추정은 들어온 원소 집합의 함수 — 따라서 중복에 무감하고 합친 결과가 한 곳에 넣은
 * 것과 같다)을 **공짜로** 지킨다 — 상수는 어느 집합의 함수이기도 하다. 한 번의 추정은 계약상 크게 틀려도 되므로 축1 경계
 * 케이스와 무작위 교차검증의 결정적 판정도 전부 통과하고, 비용이 호출마다 1 이라 축3도 통과한다. 이 구현을 잡는 것은
 * **오차 판정 연산(`errorCheck`) 하나뿐이다** — 원소가 하나 이상인 인스턴스마다 상대 오차가 1 이다.
 * `docs/ORD-006-conventions.md` 「A군 17종 판정」 ④ 의 퇴화 구현 표 넷째 줄이 이것이고, 오차 보장을 계약 밖으로 옮기면 이
 * 구현이 계약을 지킨 것이 된다는 판정(불변 사실 202)을 실행으로 보이는 자리다.
 *
 * 매개변수 거절과 다른 매개변수와의 합치기 거절은 헤더 「주입 정책」대로 한다. 계측 단위는 정본과 같다(§규약2 계측 단위) —
 * 호출마다 1.
 */

export class ZeroSketch {
  __cost = 0;
  readonly #epsilon: number;
  readonly #delta: number;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.#epsilon = epsilon;
    this.#delta = delta;
    this.__cost += 1;
  }

  add(_item: string): void {
    this.__cost += 1;
  }

  count(): number {
    this.__cost += 1;
    return 0;
  }

  merge(other: ZeroSketch): ZeroSketch {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    this.__cost += 1;
    return new ZeroSketch(this.#epsilon, this.#delta);
  }
}
