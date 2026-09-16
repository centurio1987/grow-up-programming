/**
 * 결함 fixture — `linear/gapBuffer` 의 **옛 정본**(T5-02 산출, `S21` 에서 고치기 전)을 그대로 보존한 것.
 *
 * 칸이 꼭 찼을 때(빈 구간이 비어 `#gapStart === #gapEnd`) 커서를 옮기면 원소를 지운다. 두 경계가 같은
 * 칸을 가리키므로, 옮기는 루프가 원소를 제자리에 쓰고 곧바로 그 칸을 비운다. 새 수열 8 개를 넣고
 * `moveCursor(4)` 하면 `toArray()` 가 `[0, 1, 2, 3, undefined × 4]` 이고, 오른쪽 루프도 같은 이유로
 * 지운다(`docs/ORD-006-runbook.md` 불변 사실 93 · 240).
 *
 * **축3 은 정본과 한 자리도 다르지 않다.** 계측(`__cost`)은 값을 읽지 않고 루프를 도는 횟수만 세므로
 * 잃은 원소가 비용에 드러나지 않는다 — 여섯 시나리오 전부 고친 정본과 같은 수를 낸다. 걸리는 자리는
 * **축1 경계 케이스 「넣은 직후 크기마다 커서를 옮겼다 되돌려도 수열이 그대로다」** 하나이고, 무작위
 * 500 회는 담긴 수가 꼭 찬 크기에 닿지 않아 통과한다. `_contract/runContract.gapBuffer.test.ts` 가 고정한다.
 *
 * 고친 정본과 다른 곳은 `moveCursor` 루프 두 곳의 「옮긴 뒤 비우기」 줄뿐이다(고친 쪽은 두 경계가 같은
 * 칸이면 비우지 않는다). `_contract/_fixtures/` 는 읽기만 하는 자리라 정본 파일을 고치기 전에 새 파일로
 * 떠 두었다(`docs/ORD-006-wbs.md` §4).
 */

export class FullGapErasingBuffer<T> {
  #slots: (T | undefined)[];
  #gapStart = 0;
  #gapEnd: number;

  __cost = 0;

  constructor() {
    this.#slots = new Array<T | undefined>(INITIAL_SLOTS).fill(undefined);
    this.#gapEnd = INITIAL_SLOTS;
  }

  insert(item: T): void {
    if (this.#gapStart === this.#gapEnd) this.#grow();
    this.__cost += 1;
    this.#slots[this.#gapStart] = item;
    this.#gapStart += 1;
  }

  deleteBefore(): T | null {
    if (this.#gapStart === 0) return null;
    this.__cost += 1;
    this.#gapStart -= 1;
    const item = this.#slots[this.#gapStart] as T;
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
    while (position < this.#gapStart) {
      this.#gapStart -= 1;
      this.#gapEnd -= 1;
      this.#slots[this.#gapEnd] = this.#slots[this.#gapStart];
      // 결함 — 빈 구간이 비었으면 두 경계가 같은 칸이라 방금 옮긴 원소를 지운다.
      this.#slots[this.#gapStart] = undefined;
      this.__cost += 1;
    }
    while (position > this.#gapStart) {
      this.#slots[this.#gapStart] = this.#slots[this.#gapEnd];
      // 결함 — 같은 자리다.
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

  length(): number {
    this.__cost += 1;
    return this.#size();
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

  #size(): number {
    return this.#gapStart + (this.#slots.length - this.#gapEnd);
  }

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

const INITIAL_SLOTS = 8;
