/**
 * 결함 fixture — `linear/monotonicStack` 계약을 **최댓값을 물을 때마다 담긴 것을 전부 훑어** 답하는 구현.
 *
 * 스택 옆에 최댓값 질의를 붙일 때 가장 먼저 떠오르는 모양이다. 값은 늘 옳고 스택 다섯 행은 상수이지만
 * `max` 한 번이 담긴 원소 수에 비례한다 — 계약이 `worst O(1)` 로 적은 행을 어긴다.
 *
 * 계측 단위는 §규약2 계측 단위를 따른다 — 칸 하나를 지나갈 때마다 1, 비교자 호출도 1.
 */
export class ScanningMaxStack {
  readonly #compare: (a: number, b: number) => number;
  #items: number[] = [];

  __cost = 0;

  constructor(comparator: (a: number, b: number) => number) {
    this.#compare = comparator;
  }

  push(item: number): void {
    this.__cost += 1;
    this.#items.push(item);
  }

  pop(): number | null {
    if (this.#items.length === 0) return null;
    this.__cost += 1;
    return this.#items.pop() as number;
  }

  peek(): number | null {
    this.__cost += 1;
    const items = this.#items;
    return items.length === 0 ? null : (items[items.length - 1] as number);
  }

  max(): number | null {
    const items = this.#items;
    if (items.length === 0) return null;
    let best = items[0] as number;
    for (const value of items) {
      this.__cost += 2;
      if (this.#compare(value, best) > 0) best = value;
    }
    return best;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#items.length === 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }
}
