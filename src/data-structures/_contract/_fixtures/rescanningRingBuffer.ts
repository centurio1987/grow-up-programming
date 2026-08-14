/**
 * 결함 fixture — 자리는 제대로 돌려 쓰는데 담긴 수를 세어 두지 않고 매번 훑는 버퍼.
 *
 * 앞의 둘과 **다른 행에서** 걸린다. 경계도 지키고(축1 통과) 쓰기·읽기도 칸 하나만
 * 건드리는데(`write`·`read` 시나리오 통과), `size()` 가 용량만큼의 칸을 전부 훑는다.
 * 담긴 수를 정수 하나로 들지 않고 「비어 있지 않은 칸이 몇인가」로 다시 세기 때문이다.
 *
 * 이 계열이 있어야 조회 행의 상한이 실제로 검사된다. `peek`·`isFull`·`isEmpty`·`size` 를
 * 한 걸음에 묶은 시나리오가 겨누는 것이 이 fixture 이고, 앞의 둘은 그 시나리오를 통과한다
 * (불변 사실 118 — 같은 축에서 무엇이 더 잡히는지는 fixture 를 계열별로 나눠야 보인다).
 *
 * **꽉 찼는지를 따로 든 표시로 답하는 것이 이 구현이 서는 방식이다.** `#full` 이 없으면
 * 「머리와 꼬리가 같은 칸」이 빈 상태와 꽉 찬 상태를 동시에 뜻해 둘을 가르지 못한다.
 * 그 표시 덕에 `isFull` 은 상수이고, 훑는 것은 `size()` 하나다.
 *
 * **`size()` 의 훑기는 `T` 가 `undefined` 를 담지 않는다는 전제 위에 선다.** 계약 스위트가
 * 도는 원소 타입은 `number` 하나이므로(§규약2) 이 fixture 안에서는 그 전제가 성립한다.
 * 전제를 깨는 타입에서는 이 구현이 축1에서도 걸리고, 그 실패는 이 fixture 가 겨눈 결함이
 * 아니다 — 겨눈 것은 조회 행의 성장률 하나다.
 */

export class RescanningRingBuffer<T> {
  readonly #slots: (T | undefined)[];
  /** 가장 오래된 원소가 놓인 칸. */
  #head = 0;
  /** 다음 쓰기가 놓을 칸. */
  #tail = 0;
  /** 머리와 꼬리가 같은 칸일 때 빈 상태와 꽉 찬 상태를 가른다. */
  #full = false;

  __cost = 0;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(
        `용량은 1 이상의 정수여야 한다 — 받은 값은 ${capacity} 이다`,
      );
    }
    this.#slots = new Array<T | undefined>(capacity).fill(undefined);
    this.__cost += capacity;
  }

  write(item: T): void {
    this.__cost += 1;
    this.#slots[this.#tail] = item;
    this.#tail = (this.#tail + 1) % this.#slots.length;
    if (this.#full) this.#head = this.#tail;
    else if (this.#tail === this.#head) this.#full = true;
  }

  read(): T | null {
    if (!this.#full && this.#head === this.#tail) return null;
    this.__cost += 1;
    const item = this.#slots[this.#head] as T;
    this.#slots[this.#head] = undefined;
    this.#head = (this.#head + 1) % this.#slots.length;
    this.#full = false;
    return item;
  }

  peek(): T | null {
    if (!this.#full && this.#head === this.#tail) return null;
    this.__cost += 1;
    return this.#slots[this.#head] as T;
  }

  isFull(): boolean {
    this.__cost += 1;
    return this.#full;
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return !this.#full && this.#head === this.#tail;
  }

  /** 담긴 수를 들지 않고 칸을 전부 훑어 센다. 여기 하나가 상한을 넘는 자리다. */
  size(): number {
    let found = 0;
    for (let at = 0; at < this.#slots.length; at++) {
      this.__cost += 1;
      if (this.#slots[at] !== undefined) found += 1;
    }
    return found;
  }
}
