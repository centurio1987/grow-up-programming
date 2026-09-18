/**
 * `linear/gapBuffer` 정본(규약2).
 *
 * 계약은 `../gapBuffer.ts` 헤더 한 곳이다(규약1). 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다. 칸 배열 하나에 빈 구간을 두고 커서를
 * 그 구간의 왼쪽 끝에 붙여 두는 것이 여기 쓴 방식이지만, **커서 앞의 것과 뒤의 것을 배열
 * 둘에 나눠 담는 구현**도 여섯 행을 전부 지키고(§규약1 「검증 등급」이 그 구현으로 등급을
 * 판정한다), 마디를 양방향으로 이어 두고 커서 마디를 들고 다니는 구현도 지킨다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"칸 하나를 지나갈 때마다 1"* 이다 — **읽기와 쓰기를
 * 따로 세지 않고**, 언어 런타임이 배열을 잡는 비용도 세지 않는다(§규약2 계측 단위). 축3은
 * 절대 카운트가 아니라 성장률을 보므로 상수 배수가 판정에 들어오지 않기 때문이다. `__cost`
 * 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * 칸을 하나도 지나가지 않는 연산(`cursor`·`length`)도 1 을 더한다. 판정이 계측값 0 을
 * 성장률로 나누지 못하기 때문이고(`_contract/judge.ts` 의 `judgeGrowth`), 상수 배수는 판정에
 * 안 들어오므로 이 선택이 어느 행의 판정도 바꾸지 않는다.
 *
 * **빈 구간의 처음 크기와 늘리는 배수는 계약이 정하지 않는다.** 생성자가 인자를 받지 않는
 * 것이 계약이고(`../gapBuffer.ts` 의 주입 정책), 여기 적힌 8 과 2 배는 이 구현이 고른
 * 값이다. 계약이 `insert` 를 `amortized` 로 적어 둔 덕에 이 늘리기가 허용된다 — `worst` 로
 * 적혀 있었다면 이 정본이 계약 위반이다.
 *
 * **빈 칸 표시로 `undefined` 를 쓰지만 그것이 「비어 있음」의 판정 근거는 아니다.** 판정은
 * `#gapStart`·`#gapEnd` 가 한다. 그래서 `T` 가 `undefined` 를 담을 수 있는 타입이어도 이
 * 구현은 계약을 지킨다.
 */

// #region guide:core
export class GapBuffer<T> {
  /** 칸. 길이가 곧 지금 잡아 둔 자리 수이고, 원소 수보다 크거나 같다. */
  #slots: (T | undefined)[];
  /** 빈 구간의 왼쪽 끝. **이 값이 곧 커서 자리**이고 앞쪽 원소 수와 같다. */
  #gapStart = 0;
  /** 빈 구간의 오른쪽 끝(exclusive). 여기부터 배열 끝까지가 커서 뒤 원소다. */
  #gapEnd: number;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  constructor() {
    this.#slots = new Array<T | undefined>(INITIAL_SLOTS).fill(undefined);
    this.#gapEnd = INITIAL_SLOTS;
  }

  insert(item: T): void {
    // 빈 구간이 없으면 자리를 늘린다. 이 호출만 원소 수에 비례하고, 늘린 뒤 다음 늘리기까지
    // 최소 그만큼의 `insert` 가 지나가므로 시퀀스 평균은 상수로 남는다.
    if (this.#gapStart === this.#gapEnd) this.#grow();
    this.__cost += 1;
    this.#slots[this.#gapStart] = item;
    // 커서가 새 원소 뒤로 간다 — 이어서 부르면 넣은 순서대로 늘어선다.
    this.#gapStart += 1;
  }

  deleteBefore(): T | null {
    if (this.#gapStart === 0) return null;
    this.__cost += 1;
    this.#gapStart -= 1;
    const item = this.#slots[this.#gapStart] as T;
    // 나간 값의 참조를 놓아 준다. 칸이 원소를 붙들고 있으면 구조에서 나간 값이 살아 있다.
    this.#slots[this.#gapStart] = undefined;
    return item;
  }

  moveCursor(position: number): void {
    const size = this.#size();
    if (!Number.isInteger(position) || position < 0 || position > size) {
      throw new RangeError(
        `커서 자리는 0 이상 ${size} 이하의 정수여야 한다 — 받은 값은 ${position} 이다`,
      );
    }

    this.__cost += 1;
    // 빈 구간을 커서가 갈 자리까지 옮긴다. 옮기는 칸 수가 곧 커서가 지나갈 거리다.
    // 빈 구간이 비어 있으면(칸이 꼭 찼으면) 두 경계가 같은 칸이다. 그때는 옮긴 칸이 곧 원소가
    // 남을 칸이라 비우지 않는다 — 비우면 방금 옮긴 원소가 사라진다.
    while (position < this.#gapStart) {
      this.#gapStart -= 1;
      this.#gapEnd -= 1;
      this.#slots[this.#gapEnd] = this.#slots[this.#gapStart];
      if (this.#gapStart !== this.#gapEnd)
        this.#slots[this.#gapStart] = undefined;
      this.__cost += 1;
    }
    while (position > this.#gapStart) {
      this.#slots[this.#gapStart] = this.#slots[this.#gapEnd];
      if (this.#gapStart !== this.#gapEnd)
        this.#slots[this.#gapEnd] = undefined;
      this.#gapStart += 1;
      this.#gapEnd += 1;
      this.__cost += 1;
    }
  }

  cursor(): number {
    this.__cost += 1;
    return this.#gapStart;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (let at = 0; at < this.#gapStart; at++) out.push(this.#slots[at] as T);
    for (let at = this.#gapEnd; at < this.#slots.length; at++) {
      out.push(this.#slots[at] as T);
    }
    this.__cost += out.length + 1;
    return out;
  }

  /** 담긴 원소 수. 빈 구간을 뺀 나머지라 세어 두지 않아도 상수 시간이다. */
  #size(): number {
    return this.#gapStart + (this.#slots.length - this.#gapEnd);
  }

  /**
   * 자리를 두 배로 늘리고 빈 구간을 커서 자리에 다시 연다.
   *
   * 커서 앞은 앞에 그대로, 커서 뒤는 **새 배열의 끝에 붙여** 옮긴다. 그렇게 두면 늘어난
   * 만큼이 전부 커서 자리의 빈 구간이 되어 다음 `insert` 들이 옮기지 않고 들어간다.
   */
  #grow(): void {
    const tail = this.#slots.length - this.#gapEnd;
    const next = new Array<T | undefined>(this.#slots.length * 2).fill(
      undefined,
    );
    for (let at = 0; at < this.#gapStart; at++) next[at] = this.#slots[at];
    for (let at = 0; at < tail; at++) {
      next[next.length - tail + at] = this.#slots[this.#gapEnd + at];
    }
    this.__cost += this.#gapStart + tail;
    this.#gapEnd = next.length - tail;
    this.#slots = next;
  }
}

/** 처음 잡는 칸 수. 계약이 정하지 않는 값이라 정본이 고른다. */
const INITIAL_SLOTS = 8;
// #endregion
