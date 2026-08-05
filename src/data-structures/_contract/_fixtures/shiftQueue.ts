/**
 * 결함 fixture — 배열의 앞을 실제로 지우는 큐.
 *
 * 명세의 필요충분조건이 든 반례 그 자체다. 꺼낼 때 `shift` 를 쓰면 앞자리를 비우려고 뒤
 * 원소를 전부 한 칸씩 당긴다. **순서는 옳다** — 그래서 축1·축2를 전부 통과하고 축3만이
 * 잡는다.
 *
 * 이 구현도 자명하다(배열 하나 + 언어 내장 연산). 등급 판정이 *"달성하는 자명한 구현이
 * 있는가"* 를 묻지 *"전부 달성하는가"* 를 묻지 않는 이유가 이 fixture 다 — 자명한 구현
 * 중에 상한을 넘는 것이 있어도 등급은 `basic` 이고, 그 넘는 구현을 잡는 것이 축3의 일이다.
 */

export class ShiftQueue<T> {
  #items: T[] = [];

  __cost = 0;

  enqueue(item: T): void {
    this.__cost += 1;
    this.#items.push(item);
  }

  dequeue(): T | null {
    if (this.#items.length === 0) return null;
    // `shift` 가 뒤 원소를 전부 당긴다. 그 비용이 여기서 세어진다.
    this.__cost += this.#items.length;
    return this.#items.shift() as T;
  }

  front(): T | null {
    if (this.#items.length === 0) return null;
    this.__cost += 1;
    return this.#items[0] as T;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }
}
