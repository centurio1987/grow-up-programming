/**
 * 결함 fixture — 배열 **앞쪽**으로 넣고 빼는 스택.
 *
 * 이것은 **동작상 옳다.** 넣은 순서의 역순으로 나오므로 LIFO 이고, 축1·축2를 전부 통과한다.
 * 틀린 것은 비용뿐이다 — `push`·`pop` 이 원소 수에 비례하니 `amortized O(1)` 계약을 어긴다.
 *
 * 이 fixture 가 존재하는 이유는 `basic` 등급이 축3을 도는지가 규약2의 결정 사항이었기
 * 때문이다. 축1만 도는 등급이라면 이 구현은 통과한다 — 계약에 적힌 상한이 아무에게도
 * 검사되지 않는 상태이고, 그것이 ORD-006 이 고치려는 결함 그 자체다.
 */
export class FrontPushStack<T> {
  #items: T[] = [];

  __cost = 0;

  push(item: T): void {
    this.#items.unshift(item);
    this.__cost += this.#items.length;
  }

  pop(): T | null {
    this.__cost += this.#items.length;
    if (this.#items.length === 0) return null;
    return this.#items.shift() as T;
  }

  peek(): T | null {
    this.__cost += 1;
    if (this.#items.length === 0) return null;
    return this.#items[0] as T;
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
