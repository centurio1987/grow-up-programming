/**
 * 결함 fixture — 담을 수 있는 수를 무시하고 계속 담는 버퍼.
 *
 * **이 저장소에서 축1이 혼자 잡는 첫 결함 fixture 다.** `_fixtures/` 의 다른 것들은 전부
 * 동작상 옳고 축3만이 잡는데, 이쪽은 반대다 — **여섯 행의 시간 상한을 전부 지키면서**
 * (`write`·`read`·`peek` 이 모두 호출 하나당 상수다) 계약을 어긴다. 어기는 자리는 비용이
 * 아니라 **경계의 의미**다.
 *
 * 용량을 아예 모르는 구현이 아니다. 생성자가 받은 값을 들고 있고 `isFull()` 도 그 값으로
 * 답한다. 빠진 것은 하나뿐이다 — **`isFull()` 이 참인 뒤의 `write` 가 아무것도 밀어내지
 * 않는다.** 그래서 용량을 넘긴 순간부터 `size()` 가 용량 위로 자라고, `read()` 가 이미
 * 밀려났어야 할 원소를 돌려준다. 담는 자리도 원소 수만큼 끝없이 는다.
 *
 * `linear/queue` 정본이 바로 이 모양이다(`../../linear/queue/_reference/queue.ts` — 앞으로
 * 당기는 압축만 뺐다). **시간 상한을 하나도 쓰지 않고 두 계약이 갈린다**는 판정의 실물이 이
 * 파일이고, 「공간이 존재 이유」로 분류된 구조들에 물을 것이 「공간을 아끼는가」가 아니라
 * **「그 제약을 관측하는 연산이 계약에 있는가」**인 이유가 여기 있다 — 관측 연산이 있으면
 * 그 제약은 공간 조건을 거치지 않고 연산의 의미로 계약에 들어오고, 그때부터 축1이 잡는다.
 */

export class UnboundedRingBuffer<T> {
  readonly #capacity: number;
  /** 들어온 순서대로 담는다. **길이에 상한이 없다.** */
  #items: (T | undefined)[] = [];
  /** 다음에 읽을 자리. 이 앞은 이미 나갔고 되돌려 쓰지 않는다. */
  #head = 0;

  __cost = 0;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(
        `용량은 1 이상의 정수여야 한다 — 받은 값은 ${capacity} 이다`,
      );
    }
    this.#capacity = capacity;
  }

  write(item: T): void {
    // 경계를 보지 않는다. 이 한 줄이 계약을 어기는 전부이고, 비용은 여전히 상수다.
    this.__cost += 1;
    this.#items.push(item);
  }

  read(): T | null {
    if (this.#head >= this.#items.length) return null;
    this.__cost += 1;
    const item = this.#items[this.#head] as T;
    this.#items[this.#head] = undefined;
    this.#head += 1;
    return item;
  }

  peek(): T | null {
    if (this.#head >= this.#items.length) return null;
    this.__cost += 1;
    return this.#items[this.#head] as T;
  }

  isFull(): boolean {
    this.__cost += 1;
    return this.#items.length - this.#head >= this.#capacity;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length - this.#head;
  }
}
