/**
 * 결함 fixture — `probabilistic/cuckooFilter` 계약을 **넣은 사본을 목록에 늘어놓고 훑어** 지키려는 구현.
 *
 * 답이 정확하다 — 거짓 양성도 헷갈린 지우기도 없어 오차 판정과 축1 전부를 통과한다(정확한 다중집합도 이 계약의 의미를
 * 지킨다). 걸리는 것은 **비용 행 둘**이다 — `has` · `delete` 가 담긴 수에 비례한다. `add` 는 뒤에 붙이기라 상수로
 * 통과한다(행 단위 — 불변 사실 84).
 *
 * 계측 단위는 정본과 같다(§규약2 계측 단위) — 목록의 칸 하나를 지날 때마다 1. 원소를 견주는 비용은 L 이 상수로 눌려
 * 칸마다 1 이다.
 */

export class ScanningMultisetFilter {
  readonly #items: string[] = [];

  __cost = 0;

  constructor(capacity: number, falsePositiveRate: number) {
    if (!Number.isInteger(capacity) || capacity < 0)
      throw new RangeError(`용량 ${capacity}`);
    if (!(falsePositiveRate > 0 && falsePositiveRate < 1))
      throw new RangeError(`목표 오차 ${falsePositiveRate}`);
    this.__cost += 1;
  }

  add(item: string): boolean {
    this.__cost += 1;
    this.#items.push(item);
    return true;
  }

  has(item: string): boolean {
    return this.#find(item) >= 0;
  }

  delete(item: string): boolean {
    const at = this.#find(item);
    if (at < 0) return false;
    const last = this.#items.pop() as string;
    if (at < this.#items.length) this.#items[at] = last;
    return true;
  }

  #find(item: string): number {
    for (let i = 0; i < this.#items.length; i++) {
      this.__cost += 1;
      if (this.#items[i] === item) return i;
    }
    this.__cost += 1;
    return -1;
  }
}
