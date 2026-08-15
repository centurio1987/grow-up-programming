/**
 * 결함 fixture — 원소를 배열 한 줄에 접어 담고, 합치기를 **넘겨받은 원소를 하나씩 다시 넣는
 * 일**로 하는 우선순위 큐.
 *
 * 이 fixture 는 **기본 우선순위 큐(`heap/priorityQueue`) 계약을 지킨다.** 담는 모양이 그
 * 계약의 정본과 같고, 다섯 행의 상한도 그대로다. 걸리는 것은 합칠 수 있는 우선순위 큐
 * (`heap/leftistHeap`) 계약의 **`merge` 행 하나**뿐이다 — 배열 둘을 합치면 원소 수에
 * 비례하기 때문이다.
 *
 * **그래서 이 fixture 가 포섭의 반쪽을 잰다**(불변 사실 115). 담는 쪽 정본을 담기는 쪽
 * 계약에 넣는 방향은 정본 교차가 재지만, *"담기는 쪽만 만족하는 구현이 실재하는가"* 는
 * 정본으로 잴 수 없다 — 저장소의 정본은 둘 다 합치기를 로그에 한다. 그 자리를 이 구현이
 * 답한다.
 *
 * **답은 전부 옳다**(축1 통과). 합치기가 넘겨받은 큐를 비우는 것까지 계약대로다.
 */

export class MergeableArrayHeap<T> {
  readonly #compare: (a: T, b: T) => number;
  #items: T[] = [];

  __cost = 0;

  constructor(compare: (a: T, b: T) => number) {
    this.#compare = compare;
  }

  enqueue(item: T): void {
    this.#items.push(item);
    this.__cost += 1;
    this.#siftUp(this.#items.length - 1);
  }

  dequeue(): T | null {
    const items = this.#items;
    this.__cost += 1;
    if (items.length === 0) return null;

    const top = items[0] as T;
    const last = items.pop() as T;
    if (items.length > 0) {
      items[0] = last;
      this.#siftDown(0);
    }
    return top;
  }

  /** 넘겨받은 큐의 원소를 하나씩 다시 넣는다. 여기서 계약이 깨진다. */
  merge(other: MergeableArrayHeap<T>): void {
    if (other === this) throw new TypeError("자기 자신과 합칠 수 없다");
    for (const item of other.#items) {
      this.#items.push(item);
      this.__cost += 1;
      this.#siftUp(this.#items.length - 1);
    }
    other.#items = [];
  }

  peek(): T | null {
    this.__cost += 1;
    return this.#items.length === 0 ? null : (this.#items[0] as T);
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#items.length === 0;
  }

  #siftUp(at: number): void {
    const items = this.#items;
    const moving = items[at] as T;
    while (at > 0) {
      const parent = (at - 1) >> 1;
      this.__cost += 1;
      if (this.#compare(moving, items[parent] as T) >= 0) break;
      items[at] = items[parent] as T;
      at = parent;
    }
    items[at] = moving;
  }

  #siftDown(at: number): void {
    const items = this.#items;
    const size = items.length;
    const moving = items[at] as T;
    for (;;) {
      let child = at * 2 + 1;
      if (child >= size) break;

      const right = child + 1;
      this.__cost += right < size ? 2 : 1;
      if (
        right < size &&
        this.#compare(items[right] as T, items[child] as T) < 0
      ) {
        child = right;
      }

      if (this.#compare(items[child] as T, moving) >= 0) break;
      items[at] = items[child] as T;
      at = child;
    }
    items[at] = moving;
  }
}
