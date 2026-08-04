/**
 * 결함 fixture — **두 배열(앞 스택 + 뒤 스택) 덱.**
 *
 * 진단이 `linear/deque` 에 건 지적이 이 구현을 문제 문서가 **처방했다**는 것이다
 * (`ORDER.md:46`). 처방 자체가 결함인 이유를 축3이 보이게 하는 것이 이 fixture 의 일이다.
 *
 * **동작은 옳다.** 축1·축2를 전부 통과한다. 그리고 **큐 패턴에서는 상각도 옳다** — 뒤로
 * 넣고 앞으로 빼면 원소마다 한 번씩만 옮겨지므로 연산당 상수다. 무너지는 자리는 하나뿐이다.
 *
 * 한쪽이 비었을 때 **반대쪽 전부를 옮기므로**, 앞뒤를 번갈아 빼면 매번 남은 전부가 옮겨진다.
 * n 회에 대해 총 $n^2/2$ 에 가까워지고 연산당 O(n) 이 된다.
 */

export class TwoArrayDeque<T> {
  /** 앞쪽 절반을 **역순**으로 담는다. 끝(top)이 곧 덱의 앞 끝이다. */
  #front: T[] = [];
  /** 뒤쪽 절반을 정순으로 담는다. 끝(top)이 곧 덱의 뒤 끝이다. */
  #back: T[] = [];

  __cost = 0;

  pushFront(item: T): void {
    this.__cost += 1;
    this.#front.push(item);
  }

  pushBack(item: T): void {
    this.__cost += 1;
    this.#back.push(item);
  }

  popFront(): T | null {
    if (this.#front.length === 0) this.#refill(this.#back, this.#front);
    if (this.#front.length === 0) return null;
    this.__cost += 1;
    return this.#front.pop() as T;
  }

  popBack(): T | null {
    if (this.#back.length === 0) this.#refill(this.#front, this.#back);
    if (this.#back.length === 0) return null;
    this.__cost += 1;
    return this.#back.pop() as T;
  }

  peekFront(): T | null {
    this.__cost += 1;
    if (this.#front.length > 0) return this.#front[this.#front.length - 1] as T;
    return this.#back.length > 0 ? (this.#back[0] as T) : null;
  }

  peekBack(): T | null {
    this.__cost += 1;
    if (this.#back.length > 0) return this.#back[this.#back.length - 1] as T;
    return this.#front.length > 0 ? (this.#front[0] as T) : null;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#front.length + this.#back.length === 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#front.length + this.#back.length;
  }

  /** 준 쪽을 통째로 비워 받는 쪽에 역순으로 쌓는다. **여기가 결함의 자리다.** */
  #refill(from: T[], to: T[]): void {
    while (from.length > 0) {
      this.__cost += 1;
      to.push(from.pop() as T);
    }
  }
}
