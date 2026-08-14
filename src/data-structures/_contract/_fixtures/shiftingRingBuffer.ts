/**
 * 결함 fixture — 자리를 돌려 쓰지 않고 담긴 것을 배열 앞부터 순서대로 드는 버퍼.
 *
 * **경계는 지킨다.** 꽉 찬 뒤에 쓰면 가장 오래된 것을 실제로 밀어내고 `size()` 도 용량 위로
 * 자라지 않는다. 그래서 **축1을 전부 통과한다** — 값이 하나도 틀리지 않는다. 어기는 것은
 * 비용 조건이다: 앞 끝 원소를 지우는 방법이 「뒤 원소를 전부 한 칸씩 당기기」뿐이라
 * `read` 와 **꽉 찬 뒤의 `write`** 가 담긴 수에 비례한다.
 *
 * 계약 헤더의 검증 등급 항목이 든 반례가 이것이다 — 자명한 구현인데 상한을 넘는다. 등급이
 * 그래도 `basic` 인 이유는 판정이 *달성하는 자명한 구현이 있는가*를 묻기 때문이다
 * (불변 사실 55).
 *
 * **네 시나리오 중 둘에서만 걸린다.** 채워지기 전의 쓰기는 뒤에 붙이기만 하면 되므로 상수고
 * (`write` 비적대 통과), 조회 넷은 길이를 읽는 것뿐이라 상수다(`peek`·`isFull`·`isEmpty`
 * ·`size` 통과). 같은 행(`write`)을 겨눈 시나리오를 둘 둔 근거가 여기 있다 — **하나만
 * 두었다면 어느 쪽을 골랐느냐에 따라 이 구현이 통과한다.**
 */

export class ShiftingRingBuffer<T> {
  readonly #capacity: number;
  /** 담긴 것을 순서대로 든다. 앞이 가장 오래된 것이고 길이가 곧 담긴 수다. */
  #items: T[] = [];

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
    if (this.#items.length === this.#capacity) {
      // 밀어내려면 뒤 원소를 전부 한 칸씩 당겨야 한다. 그 비용이 여기서 세어진다.
      this.__cost += this.#items.length;
      this.#items.shift();
    }
    this.__cost += 1;
    this.#items.push(item);
  }

  read(): T | null {
    if (this.#items.length === 0) return null;
    // `shift` 가 뒤 원소를 전부 당긴다.
    this.__cost += this.#items.length;
    return this.#items.shift() as T;
  }

  peek(): T | null {
    if (this.#items.length === 0) return null;
    this.__cost += 1;
    return this.#items[0] as T;
  }

  isFull(): boolean {
    this.__cost += 1;
    return this.#items.length === this.#capacity;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }
}
