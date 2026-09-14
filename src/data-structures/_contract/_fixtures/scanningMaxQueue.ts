/**
 * 결함 fixture — `linear/monotonicQueue` 계약을 **최댓값을 물을 때마다 담긴 것을 전부 훑어** 답하는 구현.
 *
 * `linear/queue` 의 자명한 구현(배열 하나 + 읽을 자리 정수 하나)에 최댓값 질의를 그대로 붙인 모양이다. 값은
 * 늘 옳고 큐 다섯 행은 상수이지만 `max` 한 번이 담긴 원소 수에 비례한다 — `worst O(1)` 행을 어긴다.
 *
 * 계측 단위는 §규약2 계측 단위를 따른다 — 칸 하나를 지나갈 때마다 1, 비교자 호출도 1.
 */
export class ScanningMaxQueue {
  readonly #compare: (a: number, b: number) => number;
  #items: number[] = [];
  #head = 0;

  __cost = 0;

  constructor(comparator: (a: number, b: number) => number) {
    this.#compare = comparator;
  }

  enqueue(item: number): void {
    this.__cost += 1;
    this.#items.push(item);
  }

  dequeue(): number | null {
    if (this.#head >= this.#items.length) return null;
    this.__cost += 1;
    const item = this.#items[this.#head] as number;
    this.#head += 1;
    return item;
  }

  front(): number | null {
    this.__cost += 1;
    return this.#head >= this.#items.length
      ? null
      : (this.#items[this.#head] as number);
  }

  max(): number | null {
    if (this.#head >= this.#items.length) return null;
    let best = this.#items[this.#head] as number;
    for (let at = this.#head; at < this.#items.length; at++) {
      this.__cost += 2;
      const value = this.#items[at] as number;
      if (this.#compare(value, best) > 0) best = value;
    }
    return best;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length - this.#head;
  }
}
