/**
 * 결함 fixture — 앞에 넣고 뒤에서 빼는 큐.
 *
 * 위 fixture(`shiftQueue.ts`)와 **반대쪽에서 걸린다.** 방향만 뒤집었을 뿐이라 먼저 들어온
 * 것이 먼저 나가는 것은 그대로이고(축1·축2 통과), 무너지는 자리가 `dequeue` 가 아니라
 * `enqueue` 다 — 앞에 끼워 넣으면 이미 있던 원소가 전부 한 칸씩 밀린다.
 *
 * 이 fixture 가 있어야 하는 이유는 명세의 비용 조건이 **양방향**이기 때문이다. *"`dequeue`
 * 가 원소 수에 비례하면 배열의 앞을 지우는 것"* 만 검사하면 방향을 뒤집은 같은 결함이
 * 그대로 통과한다.
 */

export class UnshiftQueue<T> {
  /** 앞이 가장 나중에 들어온 것, 뒤가 가장 먼저 들어온 것. */
  #items: T[] = [];

  __cost = 0;

  enqueue(item: T): void {
    // `unshift` 가 이미 있던 원소를 전부 민다. 그 비용이 여기서 세어진다.
    this.__cost += this.#items.length + 1;
    this.#items.unshift(item);
  }

  dequeue(): T | null {
    if (this.#items.length === 0) return null;
    this.__cost += 1;
    return this.#items.pop() as T;
  }

  front(): T | null {
    if (this.#items.length === 0) return null;
    this.__cost += 1;
    return this.#items[this.#items.length - 1] as T;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }
}
