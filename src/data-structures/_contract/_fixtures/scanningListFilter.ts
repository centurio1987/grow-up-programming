/**
 * 결함 fixture — `probabilistic/bloomFilter` 계약을 **넣은 원소를 목록에 늘어놓고 훑어** 지키려는 구현.
 *
 * 답은 정확하다 — 거짓 양성이 0 이라 오차 판정을 통과하고 축1 전부를 통과한다. 헤더가 적은 대로 정확한 집합도 이
 * 계약의 의미를 지킨다. 걸리는 것은 **비용 행**이다 — `has` 가 담긴 수에 비례한다. `add` 는 뒤에 붙이기만 해서 상수라
 * 통과한다(행 단위로 걸린다 — 불변 사실 84). 헤더 필요충분조건의 비용 문장 「담긴 수에 비례하면 목록이다」가 이것이다.
 *
 * 계측 단위는 정본과 같다(§규약2 계측 단위) — 목록의 칸 하나를 지나갈 때마다 1. 원소 문자열을 견주는 비용은 L 이
 * 상수로 눌려 있어 칸마다 1 로 센다.
 */

export class ScanningListFilter {
  readonly #items: string[] = [];

  __cost = 0;

  constructor(capacity: number, falsePositiveRate: number) {
    if (!Number.isInteger(capacity) || capacity < 0)
      throw new RangeError(`용량 ${capacity}`);
    if (!(falsePositiveRate > 0 && falsePositiveRate < 1))
      throw new RangeError(`목표 오차 ${falsePositiveRate}`);
    this.__cost += 1;
  }

  add(item: string): void {
    this.__cost += 1;
    this.#items.push(item);
  }

  has(item: string): boolean {
    for (const stored of this.#items) {
      this.__cost += 1;
      if (stored === item) return true;
    }
    this.__cost += 1;
    return false;
  }
}
