/**
 * `linear/deque` 정본 구현.
 *
 * **계약은 여기 적지 않는다.** 계약은 `../deque.ts` 헤더 한 곳이다(규약1). 이 파일이 지는
 * 의무는 둘이다 — 그 계약을 실제로 지키는 것, 그리고 축3이 읽을 `__cost` 를 노출하는 것.
 *
 * `__cost` 가 세는 것: **칸 하나를 지나갈 때마다 1** — **읽기와 쓰기를 따로 세지 않는다**
 * (§규약2 계측 단위).
 * 넣고 빼기는 칸 하나만 건드리므로
 * 연산당 1이고, 용량을 늘릴 때는 옮긴 원소 수만큼 더해진다. 이 구조에는 주입점이 없어
 * 밖에서 셀 수 있는 양이 없다 — 그래서 자기 보고이고, 무엇을 세는지를 여기 적는 것이
 * §규약2가 요구하는 전부다.
 *
 * 이 구현이 무엇인지는 계약의 일부가 아니다. 계약이 `amortized O(1)` 을 요구하므로 그것을
 * 만족하는 아무 구현이나 여기 올 수 있고, 바뀌어도 `../deque.ts` 는 그대로다.
 */

// #region guide:core
/** 처음 잡는 칸 수. 2의 거듭제곱일 필요는 없다 — 나머지 연산으로 감싸기 때문이다. */
const INITIAL_SLOTS = 8;

export class Deque<T> {
  #slots: (T | undefined)[] = new Array(INITIAL_SLOTS);
  /** 앞 끝 원소가 놓인 칸. 비어 있을 때는 다음 `pushBack` 이 쓸 칸이다. */
  #head = 0;
  #count = 0;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  pushFront(item: T): void {
    if (this.#count === this.#slots.length) this.#grow();
    this.#head = this.#wrap(this.#head - 1);
    this.__cost += 1;
    this.#slots[this.#head] = item;
    this.#count += 1;
  }

  pushBack(item: T): void {
    if (this.#count === this.#slots.length) this.#grow();
    const at = this.#wrap(this.#head + this.#count);
    this.__cost += 1;
    this.#slots[at] = item;
    this.#count += 1;
  }

  popFront(): T | null {
    if (this.#count === 0) return null;
    this.__cost += 1;
    const item = this.#slots[this.#head] as T;
    this.#slots[this.#head] = undefined;
    this.#head = this.#wrap(this.#head + 1);
    this.#count -= 1;
    return item;
  }

  popBack(): T | null {
    if (this.#count === 0) return null;
    const at = this.#wrap(this.#head + this.#count - 1);
    this.__cost += 1;
    const item = this.#slots[at] as T;
    this.#slots[at] = undefined;
    this.#count -= 1;
    return item;
  }

  peekFront(): T | null {
    this.__cost += 1;
    if (this.#count === 0) return null;
    return this.#slots[this.#head] as T;
  }

  peekBack(): T | null {
    this.__cost += 1;
    if (this.#count === 0) return null;
    return this.#slots[this.#wrap(this.#head + this.#count - 1)] as T;
  }

  /**
   * 논리 위치를 칸 번호로 감싼다. 음수도 받으므로 `pushFront` 가 따로 분기하지 않는다.
   */
  #wrap(index: number): number {
    const total = this.#slots.length;
    return ((index % total) + total) % total;
  }

  /**
   * 칸을 두 배로 늘리고 원소를 **앞에서부터 차례로** 새 칸에 옮긴다.
   *
   * 옮기고 나서 `#head` 를 0으로 되돌리는 것이 중요하다. 감긴 상태를 그대로 두고 칸만
   * 늘리면 앞 끝과 뒤 끝 사이에 빈 칸이 끼어 순서가 어긋난다.
   */
  #grow(): void {
    const grown: (T | undefined)[] = new Array(this.#slots.length * 2);
    for (let offset = 0; offset < this.#count; offset++) {
      this.__cost += 1;
      grown[offset] = this.#slots[this.#wrap(this.#head + offset)];
    }
    this.#slots = grown;
    this.#head = 0;
  }
}
// #endregion
