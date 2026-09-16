/**
 * 결함 fixture — `linear/monotonicStack` 계약을 **가장 큰 원소 하나만 기억하다가 그것이 빠지면 남은 것을
 * 다시 훑는** 구현.
 *
 * 매번 훑는 구현(`scanningMaxStack.ts`)을 고치려는 자연스러운 다음 시도다. `max` 는 기억한 값을 읽어
 * 상수가 되지만, 빼는 원소가 그때의 최댓값이면 다음 최댓값을 알 방법이 없어 전부 다시 훑는다. 오름차순으로
 * 채우고 차례로 빼면 **빼기마다** 그 자리를 만나므로 상각으로도 담긴 수에 비례한다 — `pop` 행을 어긴다.
 * 무작위로 채우면 최댓값이 빠지는 일이 드물어 드러나지 않는다(불변 사실 24).
 *
 * 계측 단위는 §규약2 계측 단위를 따른다 — 칸 하나를 지나갈 때마다 1, 비교자 호출도 1.
 */
export class RescanningMaxStack {
  readonly #compare: (a: number, b: number) => number;
  #items: number[] = [];
  #max: number | null = null;

  __cost = 0;

  constructor(comparator: (a: number, b: number) => number) {
    this.#compare = comparator;
  }

  push(item: number): void {
    this.__cost += 2;
    this.#items.push(item);
    if (this.#max === null || this.#compare(item, this.#max) > 0) {
      this.#max = item;
    }
  }

  pop(): number | null {
    if (this.#items.length === 0) return null;
    this.__cost += 2;
    const item = this.#items.pop() as number;
    if (this.#compare(item, this.#max as number) === 0) this.#rescan();
    return item;
  }

  peek(): number | null {
    this.__cost += 1;
    const items = this.#items;
    return items.length === 0 ? null : (items[items.length - 1] as number);
  }

  max(): number | null {
    this.__cost += 1;
    return this.#max;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#items.length === 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }

  /** 기억한 최댓값이 빠졌을 수 있다. 남은 것을 전부 훑어 다시 정한다. */
  #rescan(): void {
    let best: number | null = null;
    for (const value of this.#items) {
      this.__cost += 2;
      if (best === null || this.#compare(value, best) > 0) best = value;
    }
    this.#max = best;
  }
}
