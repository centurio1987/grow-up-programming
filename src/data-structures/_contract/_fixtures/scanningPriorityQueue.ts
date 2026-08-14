/**
 * 결함 fixture — 순서 없이 쌓아 두고 최우선 원소를 매번 훑어 찾는 우선순위 큐.
 *
 * `heap/priorityQueue` 계약이 검증 등급 항목에 든 반례 둘 중 첫째다. 언어가 내주는
 * 배열 하나로 지을 수 있고, **답은 전부 옳다** — 축1을 통과한다. 갈리는 것은 비용뿐이다.
 *
 * 넣기는 상수다. 끝에 붙이면 끝이니까. 대신 **최우선 원소를 읽는 일과 빼는 일이 담긴
 * 원소 수에 비례한다.** 그래서 걸리는 자리는 `dequeue` 두 시나리오와 `peek`·`size`·
 * `isEmpty` 시나리오이고, `enqueue` 두 시나리오는 통과한다 — 그 통과에는 계약 위반이
 * 숨어 있지 않다(넣기가 실제로 상수다).
 *
 * 계약의 필요충분조건이 「정렬해 두면 넣기가, 안 하면 빼기가 원소 수에 비례한다」라고
 * 적은 것의 뒤쪽 반이다. 앞쪽 반은 `sortedArrayPriorityQueue` 다.
 */

export class ScanningPriorityQueue<T> {
  readonly #compare: (a: T, b: T) => number;
  readonly #items: T[] = [];

  __cost = 0;

  constructor(compare: (a: T, b: T) => number) {
    this.#compare = compare;
  }

  enqueue(item: T): void {
    this.#items.push(item);
    this.__cost += 1;
  }

  dequeue(): T | null {
    const at = this.#topIndex();
    if (at < 0) return null;
    const top = this.#items[at] as T;
    const last = this.#items.pop() as T;
    this.__cost += 1;
    if (at < this.#items.length) this.#items[at] = last;
    return top;
  }

  peek(): T | null {
    const at = this.#topIndex();
    return at < 0 ? null : (this.#items[at] as T);
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#items.length === 0;
  }

  /** 비교자가 가장 앞세우는 자리. 비어 있으면 -1. 지나간 자리마다 1 을 센다. */
  #topIndex(): number {
    this.__cost += 1;
    if (this.#items.length === 0) return -1;
    let best = 0;
    for (let at = 1; at < this.#items.length; at++) {
      this.__cost += 1;
      if (this.#compare(this.#items[at] as T, this.#items[best] as T) < 0) {
        best = at;
      }
    }
    return best;
  }
}
