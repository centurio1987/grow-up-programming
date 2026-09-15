/**
 * 결함 fixture — `probabilistic/minHash` 계약의 **퇴화 구현**. 무엇이 들어오든 닮음이 늘 1 이다.
 *
 * 결정적인 쪽(같은 실행 · 같은 매개변수에서 닮음은 두 쪽에 들어온 원소 집합의 짝만으로 정해지고, 두 집합이 같으면 1)을
 * **공짜로** 지킨다 — 상수는 어느 짝의 함수이기도 하고, 같은 집합에서 요구하는 값이 바로 그 상수다. 한 번의 닮음은 계약상
 * 크게 틀려도 되므로 축1 경계 케이스와 무작위 교차검증의 결정적 판정도 전부 통과하고, 비용이 호출마다 1 이라 축3도 통과한다.
 * 이 구현을 잡는 것은 **오차 판정 연산(`errorCheck`) 하나뿐이다** — 참 닮음이 1 − ε 보다 작은 짝마다 벗어난다.
 * `docs/ORD-006-conventions.md` 「A군 17종 판정」 ④ 의 퇴화 구현 표 다섯째 줄이 이것이고, 오차 보장을 계약 밖으로 옮기면 이
 * 구현이 계약을 지킨 것이 된다는 판정(불변 사실 202)을 실행으로 보이는 자리다.
 *
 * 매개변수 거절과 매개변수가 다른 인스턴스와의 닮음 거절은 헤더 「주입 정책」대로 한다. 계측 단위는 정본과 같다(§규약2 계측
 * 단위) — 호출마다 1.
 */

export class AlwaysOneSimilarity {
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

  similarity(other: AlwaysOneSimilarity): number {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    this.__cost += 1;
    return 1;
  }
}
