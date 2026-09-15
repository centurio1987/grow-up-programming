/**
 * 결함 fixture — `probabilistic/countMinSketch` 계약의 **퇴화 구현**. 어느 원소를 묻든 지금까지 받은 증분 전체의 합을
 * 돌려준다.
 *
 * 결정적인 쪽(추정 ≥ 실제 빈도)을 **공짜로** 지킨다 — 한 원소의 빈도는 전체 합을 넘지 못한다. 한 번의 추정은 계약상 크게
 * 틀려도 되므로 축1 경계 케이스와 무작위 교차검증의 `estimate` 도 전부 통과하고, 비용이 호출마다 1 이라 축3도 통과한다.
 * 이 구현을 잡는 것은 **오차 판정 연산(`overestimateCheck`) 하나뿐이다** — 넣지 않은 원소의 추정이 전부 총증분 N 이라
 * ε·N 을 넘는다. `docs/ORD-006-conventions.md` 「A군 17종 판정」 ④ 의 퇴화 구현 표 셋째 줄이 이것이고, 오차 보장을 계약
 * 밖으로 옮기면 이 구현이 계약을 지킨 것이 된다는 판정(불변 사실 202)을 실행으로 보이는 자리다.
 *
 * 증분 · 생성 인자의 거절은 헤더 「주입 정책」대로 한다 — 결정적인 쪽을 전부 지키는 구현이어야 판정 하나가 잡는다는 것이
 * 보인다. 계측 단위는 정본과 같다(§규약2 계측 단위) — 호출마다 1.
 */

export class TotalSumSketch {
  __cost = 0;
  #total = 0;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.__cost += 1;
  }

  update(_item: string, count: number): void {
    if (!Number.isSafeInteger(count) || count < 0)
      throw new RangeError(`증분 ${count}`);
    if (count > Number.MAX_SAFE_INTEGER - this.#total)
      throw new RangeError(`총증분 ${this.#total} + ${count}`);
    this.__cost += 1;
    this.#total += count;
  }

  estimate(_item: string): number {
    this.__cost += 1;
    return this.#total;
  }
}
