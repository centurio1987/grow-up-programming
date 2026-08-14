/**
 * 결함 fixture — 늘 정렬된 배열 하나로 지은 우선순위 큐. 최우선 원소를 끝에 둔다.
 *
 * `heap/priorityQueue` 계약이 검증 등급 항목에 든 반례 둘 중 둘째다. 언어가 내주는 배열
 * 하나로 지을 수 있고, **답은 전부 옳다** — 축1을 통과한다.
 *
 * 빼기와 보기는 상수다. 최우선 원소가 늘 끝에 있으니까. 대신 **넣기가 자리를 찾아 뒤를
 * 밀어야 하고**, 그 일이 담긴 원소 수에 비례한다.
 *
 * **걸리는 자리가 `enqueue` 두 시나리오 중 하나뿐이다.** 내림차순으로 넣으면 새 원소가
 * 늘 끝에 붙어 밀 것이 없으므로 상수로 통과한다 — **정본에 최악인 입력이 이 구현에는
 * 최선이다**(불변 사실 57). 잡는 것은 무작위 넣기 하나이고, 그것이 같은 행에 시나리오를
 * 둘 둔 근거다.
 *
 * 통과하는 나머지 넷에는 계약 위반이 숨어 있지 않다 — 빼기도 보기도 실제로 상수다.
 */

export class SortedArrayPriorityQueue<T> {
  readonly #compare: (a: T, b: T) => number;
  /** 비교자 기준 **내림차순**. 최우선 원소가 끝에 온다. */
  readonly #items: T[] = [];

  __cost = 0;

  constructor(compare: (a: T, b: T) => number) {
    this.#compare = compare;
  }

  enqueue(item: T): void {
    const items = this.#items;

    // 들어갈 자리를 이분법으로 찾는다. 여기까지는 로그다.
    let low = 0;
    let high = items.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      this.__cost += 1;
      if (this.#compare(items[mid] as T, item) > 0) low = mid + 1;
      else high = mid;
    }

    // 찾은 자리부터 뒤를 한 칸씩 민다. **이 부분이 원소 수에 비례한다.**
    items.push(item);
    for (let at = items.length - 1; at > low; at--) {
      this.__cost += 1;
      items[at] = items[at - 1] as T;
    }
    items[low] = item;
    this.__cost += 1;
  }

  dequeue(): T | null {
    this.__cost += 1;
    if (this.#items.length === 0) return null;
    return this.#items.pop() as T;
  }

  peek(): T | null {
    this.__cost += 1;
    if (this.#items.length === 0) return null;
    return this.#items[this.#items.length - 1] as T;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#items.length === 0;
  }
}
