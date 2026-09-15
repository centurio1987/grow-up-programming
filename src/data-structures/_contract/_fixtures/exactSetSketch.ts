/**
 * 결함 fixture — `probabilistic/hyperLogLog` 계약의 비용 행 하나(`merge`)만 어기는 **정확한** 구현.
 *
 * 들어온 원소를 언어 `Set` 에 담고 추정으로 그 크기를 돌려준다. 추정이 늘 정확해 오차 판정을 전부 통과하고, 결정적인 쪽도
 * 지킨다(크기는 집합의 함수다). `add` 는 해시 한 번이라 상수, `count` 는 세어 둔 크기라 상수다. **합치기가 두 쪽의 원소를 새
 * 집합으로 옮기므로** 들어온 원소 수 n 에 비례해 `merge` 시나리오에서 걸린다. 헤더가 `merge` 의 상한을 원소 수와 무관하게 적은
 * 까닭 — 합치기가 없거나 원소 수에 비례해도 되면 정확한 집합이 계약을 지키고 이름의 목적(본 원소 수와 무관하게 합친다)이 남지
 * 않는다 — 을 실행으로 보이는 자리다.
 *
 * 계측 단위는 정본과 같다(§규약2 계측 단위) — 원소 하나를 지날 때마다 1.
 */

export class ExactSetSketch {
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

  count(): number {
    this.__cost += 1;
    return this.#items.size;
  }

  merge(other: ExactSetSketch): ExactSetSketch {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    const merged = new ExactSetSketch(this.#epsilon, this.#delta);
    for (const item of this.#items) merged.#items.add(item);
    for (const item of other.#items) merged.#items.add(item);
    this.__cost += this.#items.size + other.#items.size + 1;
    return merged;
  }
}
