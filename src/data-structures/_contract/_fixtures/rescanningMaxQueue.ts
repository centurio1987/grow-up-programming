/**
 * 결함 fixture — `linear/monotonicQueue` 계약을 **가장 큰 원소 하나만 들고 있다가 그것이 앞 끝으로 나가면 남은
 * 것을 다시 훑는** 구현.
 *
 * 매번 훑는 구현(`scanningMaxQueue.ts`)을 고치려는 자연스러운 다음 시도다. `max` 는 들고 있는 값을 읽어
 * 상수가 되지만, 나가는 원소가 그때의 최댓값이면 다음 최댓값을 알 방법이 없어 전부 다시 훑는다. 내림차순으로
 * 채우고 차례로 빼면 **빼기마다** 그 자리를 만나므로 상각으로도 담긴 수에 비례한다 — `dequeue` 행을 어긴다.
 * 오름차순으로 채우면 최댓값이 맨 뒤에 있어 끝까지 드러나지 않는다(불변 사실 24).
 *
 * 크기가 같은 원소가 나가도 다시 훑는다 — 같은 크기가 남아 있는지 들고 있는 값만으로는 모른다. 그래서 값은
 * 늘 옳다.
 *
 * 계측 단위는 §규약2 계측 단위를 따른다 — 칸 하나를 지나갈 때마다 1, 비교자 호출도 1.
 */
export class RescanningMaxQueue {
  readonly #compare: (a: number, b: number) => number;
  #items: number[] = [];
  #head = 0;
  #max: number | null = null;

  __cost = 0;

  constructor(comparator: (a: number, b: number) => number) {
    this.#compare = comparator;
  }

  enqueue(item: number): void {
    this.__cost += 2;
    this.#items.push(item);
    if (this.#max === null || this.#compare(item, this.#max) > 0) {
      this.#max = item;
    }
  }

  dequeue(): number | null {
    if (this.#head >= this.#items.length) return null;
    this.__cost += 2;
    const item = this.#items[this.#head] as number;
    this.#head += 1;
    if (this.#compare(item, this.#max as number) === 0) this.#rescan();
    return item;
  }

  front(): number | null {
    this.__cost += 1;
    return this.#head >= this.#items.length
      ? null
      : (this.#items[this.#head] as number);
  }

  max(): number | null {
    this.__cost += 1;
    return this.#max;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length - this.#head;
  }

  /** 들고 있던 최댓값이 나갔을 수 있다. 남은 것을 전부 훑어 다시 정한다. */
  #rescan(): void {
    let best: number | null = null;
    for (let at = this.#head; at < this.#items.length; at++) {
      this.__cost += 2;
      const value = this.#items[at] as number;
      if (best === null || this.#compare(value, best) > 0) best = value;
    }
    this.#max = best;
  }
}
