/**
 * 결함 fixture — `probabilistic/bloomFilter` 계약의 **퇴화 구현**. 무엇을 넣든 묻든 `has` 가 늘 참이다.
 *
 * 결정적인 쪽(넣은 원소는 참)을 **공짜로** 지킨다. 넣지 않은 원소의 한 번의 답은 계약상 참이어도 되므로 축1 경계
 * 케이스와 무작위 교차검증의 `has` 도 전부 통과하고, 비용이 호출마다 1 이라 축3도 통과한다. 이 구현을 잡는 것은
 * **오차 판정 연산(`falsePositiveCheck`) 하나뿐이다** — 넣지 않은 원소 N 개가 전부 참이라 한계 128 을 넘는다.
 * `docs/ORD-006-conventions.md` 「A군 17종 판정」 ④ 의 퇴화 구현 표 첫 줄이 이것이고, 오차 보장을 계약 밖(가이드)으로
 * 옮기면 이 구현이 계약을 지킨 것이 된다는 판정(불변 사실 202)을 실행으로 보이는 자리다.
 *
 * 계측 단위는 정본과 같다(§규약2 계측 단위) — 호출마다 1.
 */

export class AlwaysYesFilter {
  __cost = 0;

  constructor(capacity: number, falsePositiveRate: number) {
    if (!Number.isInteger(capacity) || capacity < 0)
      throw new RangeError(`용량 ${capacity}`);
    if (!(falsePositiveRate > 0 && falsePositiveRate < 1))
      throw new RangeError(`목표 오차 ${falsePositiveRate}`);
    this.__cost += 1;
  }

  add(_item: string): void {
    this.__cost += 1;
  }

  has(_item: string): boolean {
    this.__cost += 1;
    return true;
  }
}
