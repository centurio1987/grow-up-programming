/**
 * 결함 fixture — `probabilistic/minHash` 계약의 비용 행 하나(`similarity`)만 어기는 **정확한** 구현.
 *
 * 들어온 원소를 언어 `Set` 에 담고 닮음으로 정확한 자카드 닮음 |A ∩ B| / |A ∪ B| 를 돌려준다(두 쪽이 다 비었으면 1). 닮음이 늘
 * 정확해 오차 판정을 전부 통과하고, 결정적인 쪽도 지킨다(두 집합의 함수이고 같은 집합이면 1). `add` 는 해시 한 번이라 상수다.
 * **닮음이 작은 쪽 집합의 원소를 훑어 교집합을 세므로** 들어온 원소 수 n 에 비례해 `similarity` 시나리오에서 걸린다. 헤더가
 * `similarity` 의 상한을 원소 수와 무관하게 적은 까닭 — 원소 수에 비례해도 되면 정확한 집합이 계약을 지키고 이름의 목적(본
 * 원소 수와 무관하게 견준다)이 남지 않는다 — 을 실행으로 보이는 자리다(`exactSetSketch.ts` 와 같은 자리).
 *
 * 계측 단위는 정본과 같다(§규약2 계측 단위) — 원소 하나를 지날 때마다 1.
 */

export class ExactSetSimilarity {
  __cost = 0;
  readonly #items = new Set<string>();
  readonly #epsilon: number;
  readonly #delta: number;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.#epsilon = epsilon;
    this.#delta = delta;
    this.__cost += 1;
  }

  add(item: string): void {
    this.__cost += 1;
    this.#items.add(item);
  }

  similarity(other: ExactSetSimilarity): number {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    const [small, large] =
      this.#items.size <= other.#items.size
        ? [this.#items, other.#items]
        : [other.#items, this.#items];
    let common = 0;
    for (const item of small) if (large.has(item)) common++;
    this.__cost += small.size + 1;
    const union = this.#items.size + other.#items.size - common;
    return union === 0 ? 1 : common / union;
  }
}
