/**
 * 결함 fixture — `probabilistic/cuckooFilter` 계약의 **퇴화 구현**. 넣기 · 묻기 · 지우기가 늘 참이다.
 *
 * 결정적인 문장 셋(사본이 있는 원소의 `has` 참 · `delete` 참, 용량 미만 새 원소의 `add` 참)을 공짜로 지키고 호출마다 상수라
 * 축1 경계 케이스 · 무작위 시퀀스의 결정적 관측과 축3을 전부 통과한다. **오차 판정의 「찬 필터 거짓 양성」에서만 걸린다.**
 * `docs/ORD-006-conventions.md` 「A군 17종 판정」 ④ 의 퇴화 구현 표 둘째 줄이다.
 *
 * 계측 단위는 정본과 같다(§규약2 계측 단위) — 호출마다 1.
 */

export class AlwaysYesCuckooFilter {
  __cost = 0;

  constructor(capacity: number, falsePositiveRate: number) {
    if (!Number.isInteger(capacity) || capacity < 0)
      throw new RangeError(`용량 ${capacity}`);
    if (!(falsePositiveRate > 0 && falsePositiveRate < 1))
      throw new RangeError(`목표 오차 ${falsePositiveRate}`);
    this.__cost += 1;
  }

  add(_item: string): boolean {
    this.__cost += 1;
    return true;
  }

  has(_item: string): boolean {
    this.__cost += 1;
    return true;
  }

  delete(_item: string): boolean {
    this.__cost += 1;
    return true;
  }
}
