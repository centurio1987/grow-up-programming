/**
 * `linear/circularBuffer` 정본(규약2).
 *
 * 계약은 `../circularBuffer.ts` 헤더 한 곳이다(규약1). 이 파일은 그 계약을 실제로 지키는
 * 구현 **하나**이고, 계약이 허용하는 유일한 구현이 아니다. 자리를 용량만큼 잡고 「가장
 * 오래된 것이 놓인 칸」을 정수로 기억하는 것이 여기 쓴 방식이지만, 마디를 고리로 이어 두고
 * 머리와 꼬리를 옮기는 구현도, 용량의 열 배를 잡아 두고 절반을 넘으면 앞으로 당기는 구현도
 * 여섯 행을 전부 지킨다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"칸 하나를 지나갈 때마다 1"* 이다 — **읽기와 쓰기를
 * 따로 세지 않고**, 언어 런타임이 배열을 잡는 비용도 세지 않는다(§규약2 계측 단위). 축3은
 * 절대 카운트가 아니라 성장률을 보므로 상수 배수가 판정에 들어오지 않기 때문이다. `__cost`
 * 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * 자리를 세는 값만 읽고 칸을 하나도 지나가지 않는 연산(`isFull`·`size`)도 1 을 더한다.
 * 판정이 계측값 0 을 성장률로 나누지 못하기 때문이고(`_contract/judge.ts` 의 `judgeGrowth`),
 * 상수 배수는 판정에 안 들어오므로 이 선택이 어느 행의 판정도 바꾸지 않는다.
 *
 * **생성자가 용량만큼 칸을 미리 잡는다.** 계약이 그 준비를 `O(n)` 으로 허용하고 있고
 * (`constructor` 행), 그렇게 잡아 두면 그 뒤로 자리를 늘릴 일이 없어 여섯 행이 전부 `worst`
 * 안에 든다. 계약이 `write` 를 `worst` 로 적을 수 있는 근거가 이 준비다.
 *
 * `.fill(undefined)` 는 **계약이 요구해서 하는 일이 아니다.** `new Array(capacity)` 만 하면
 * 구멍 난 배열이 되고, 그 상태에서 칸을 쓰면 엔진이 표현을 바꾼다 — 계약과 무관한 런타임의
 * 사정이라 계약에 적을 수 없고(불변 사실 38) 정본이 알아서 피한다. 상한이 `O(n)` 이므로
 * 이 채우기가 허용된다.
 *
 * **빈 칸 표시로 `undefined` 를 쓰지만 그것이 「비어 있음」의 판정 근거는 아니다.** 판정은
 * `#count` 가 한다. 그래서 `T` 가 `undefined` 를 담을 수 있는 타입이어도 이 구현은 계약을
 * 지킨다 — 담긴 `undefined` 와 빈 칸을 값으로 구분할 필요가 없기 때문이다.
 */

// #region guide:core
export class CircularBuffer<T> {
  /** 용량만큼 미리 잡아 두는 칸. 길이가 곧 용량이고 살아 있는 동안 바뀌지 않는다. */
  readonly #slots: (T | undefined)[];
  /** 가장 오래된 원소가 놓인 칸. 비어 있을 때는 다음 `write` 가 쓸 칸이다. */
  #head = 0;
  #count = 0;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
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
    // 쓸 칸은 언제나 「가장 오래된 칸 + 담긴 수」다. 꽉 찼을 때 이 값은 `#head` 와 같아지고,
    // 그 자리에 덮어쓰는 것이 곧 가장 오래된 원소를 밀어내는 일이다.
    const at = this.#wrap(this.#head + this.#count);
    this.__cost += 1;
    this.#slots[at] = item;

    if (this.#count === this.#slots.length) {
      // 밀어냈으므로 담긴 수는 그대로고 가장 오래된 칸만 한 칸 앞선다.
      this.#head = this.#wrap(this.#head + 1);
    } else {
      this.#count += 1;
    }
  }

  read(): T | null {
    if (this.#count === 0) return null;
    this.__cost += 1;
    const item = this.#slots[this.#head] as T;
    // 나간 값의 참조를 놓아 준다. 칸이 원소를 붙들고 있으면 버퍼에서 나간 값이 살아 있다.
    this.#slots[this.#head] = undefined;
    this.#head = this.#wrap(this.#head + 1);
    this.#count -= 1;
    return item;
  }

  peek(): T | null {
    if (this.#count === 0) return null;
    this.__cost += 1;
    return this.#slots[this.#head] as T;
  }

  isFull(): boolean {
    this.__cost += 1;
    return this.#count === this.#slots.length;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  /**
   * 칸 번호를 용량 안으로 되돌린다.
   *
   * 들어오는 값이 `#head + #count` 이거나 `#head + 1` 이라 **음수가 될 자리가 없다.** 그것이
   * 나머지 한 번으로 끝나는 이유다 — 음수 인자에 필요한 되감기(`(i % n + n) % n`)를 두지
   * 않는다. 값이 `2 * 용량` 미만이라는 것은 따로 딸린 사실이고(`#head < 용량` ·
   * `#count <= 용량`), 나머지 대신 **한 번 빼기**로 바꿔도 되는 근거가 그쪽이다.
   */
  #wrap(index: number): number {
    return index % this.#slots.length;
  }
}
// #endregion
