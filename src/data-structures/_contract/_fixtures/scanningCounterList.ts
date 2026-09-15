/**
 * 결함 fixture — `probabilistic/countMinSketch` 계약의 비용 행을 어기는 **정확한** 구현.
 *
 * 원소마다 `[원소, 빈도]` 한 쌍을 배열에 늘어놓고, 증분과 추정 때마다 앞에서부터 훑어 그 원소를 찾는다. 추정이 늘 실제
 * 빈도라 과대 추정이 0 이고 오차 판정을 전부 통과한다 — 계약이 공간을 말하지 않으므로 **정확하게 세는 것 자체는 계약
 * 안이다**(헤더 「목적」). 어기는 것은 비용이다 — 서로 다른 원소 수 n 에 비례해 훑으므로 `update` · `estimate` 가 `O(1)`
 * 시나리오에서 걸린다. 헤더 필요충분조건의 비용 문장 「담긴 종류 수에 비례하면 목록이다」가 이것이다.
 *
 * 계측 단위는 정본과 같다(§규약2 계측 단위) — 원소 쌍 하나를 지날 때마다 1.
 */

export class ScanningCounterList {
  __cost = 0;
  readonly #pairs: [string, number][] = [];
  #total = 0;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.__cost += 1;
  }

  update(item: string, count: number): void {
    if (!Number.isSafeInteger(count) || count < 0)
      throw new RangeError(`증분 ${count}`);
    if (count > Number.MAX_SAFE_INTEGER - this.#total)
      throw new RangeError(`총증분 ${this.#total} + ${count}`);
    this.#total += count;
    const pair = this.#find(item);
    if (pair === undefined) {
      this.__cost += 1;
      this.#pairs.push([item, count]);
    } else {
      pair[1] += count;
    }
  }

  estimate(item: string): number {
    return this.#find(item)?.[1] ?? 0;
  }

  #find(item: string): [string, number] | undefined {
    for (const pair of this.#pairs) {
      this.__cost += 1;
      if (pair[0] === item) return pair;
    }
    this.__cost += 1;
    return undefined;
  }
}
