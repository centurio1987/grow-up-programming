/**
 * 결함 fixture — **배열 하나에 `unshift`·`shift` 를 쓰는 덱.**
 *
 * `linear/deque` 명세가 검증 등급을 `complexity` 로 판정하며 든 **반례 그 자체**다.
 * 자명한 구현으로는 양쪽 끝을 다 상수 비용으로 둘 수 없다는 것을 실물로 보인다.
 *
 * **동작은 옳다.** 축1·축2를 전부 통과한다. 앞쪽을 건드릴 때마다 뒤 원소 전부가 밀리므로
 * 축3만이 잡는다.
 */

export class UnshiftDeque<T> {
  #items: T[] = [];

  __cost = 0;

  pushFront(item: T): void {
    // 앞에 끼우면 뒤 원소가 전부 한 칸씩 밀린다.
    this.__cost += this.#items.length + 1;
    this.#items.unshift(item);
  }

  pushBack(item: T): void {
    this.__cost += 1;
    this.#items.push(item);
  }

  popFront(): T | null {
    if (this.#items.length === 0) return null;
    this.__cost += this.#items.length;
    return this.#items.shift() as T;
  }

  popBack(): T | null {
    if (this.#items.length === 0) return null;
    this.__cost += 1;
    return this.#items.pop() as T;
  }

  peekFront(): T | null {
    this.__cost += 1;
    return this.#items.length === 0 ? null : (this.#items[0] as T);
  }

  peekBack(): T | null {
    this.__cost += 1;
    if (this.#items.length === 0) return null;
    return this.#items[this.#items.length - 1] as T;
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
