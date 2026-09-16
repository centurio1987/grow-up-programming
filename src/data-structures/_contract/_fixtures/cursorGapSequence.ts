/**
 * 결함 fixture — `linear/gapBuffer` 의 설계(빈 구간 하나를 편집 자리로 옮겨 다니기)를 자리를 인자로
 * 받는 표면에 얹었다.
 *
 * 넣기와 지우기가 **빈 구간을 그 자리까지 옮기는 일**로 시작한다. 옮기는 칸 수가 지난 편집 자리와
 * 이번 자리의 거리이고, 지우기는 빈 구간을 넓히기만 하므로 지우는 수에 기대지 않는다. 한 자리
 * 언저리를 고치면 싸고 멀리 뛰면 담긴 수에 비례한다 — `gapBuffer` 계약이 약속하는 바로 그 모양이다.
 *
 * **축1은 전부 통과한다.** 걸리는 자리는 「넣기 · 편집 적게」와 「지우기 · 편집 적게」 둘 — 두 시나리오가
 * 앞과 끝을 번갈아 고친다. 이 fixture 가 `linear/pieceTable` 계약과 `linear/gapBuffer` 계약이 **다르다**는
 * 한쪽 반례다 — 커서 계약이 허용하는 설계가 편집 수에 묶이는 계약을 못 지킨다.
 * `_contract/runContract.pieceTable.test.ts` 가 고정한다.
 *
 * `gapBuffer` 정본을 껍데기로 감싸 쓰지 않은 이유는 그 정본이 **빈 구간이 비었을 때 커서를 옮기면 원소를
 * 지운다**는 것을 이 유닛이 찾았기 때문이다(칸이 꼭 차 있을 때 `moveCursor` — `docs/ORD-006-runbook.md` 불변 사실 93). 그 결함이
 * 축1 을 먼저 떨어뜨려 비용 반례가 가려지므로 같은 설계를 새로 지었다.
 */

export class CursorGapSequence<T> {
  #slots: (T | undefined)[] = new Array<T | undefined>(8).fill(undefined);
  /** 빈 구간의 왼쪽 끝 = 마지막 편집 자리. */
  #gapStart = 0;
  /** 빈 구간의 오른쪽 끝(exclusive). */
  #gapEnd = 8;

  __cost = 0;

  insert(offset: number, items: readonly T[]): void {
    if (!Number.isInteger(offset) || offset < 0 || offset > this.#size()) {
      throw new RangeError("넣을 자리가 범위 밖이다");
    }
    this.__cost += 1;
    this.#moveGap(offset);
    for (const item of items) {
      if (this.#gapStart === this.#gapEnd) this.#grow();
      this.#slots[this.#gapStart++] = item;
      this.__cost += 1;
    }
  }

  delete(offset: number, count: number): void {
    if (
      !Number.isInteger(offset) ||
      !Number.isInteger(count) ||
      offset < 0 ||
      count < 0 ||
      offset + count > this.#size()
    ) {
      throw new RangeError("지울 구간이 범위 밖이다");
    }
    this.__cost += 1;
    this.#moveGap(offset);
    // 빈 구간을 뒤로 넓힌다 — 지운 칸의 참조를 놓아 주는 일만 지우는 수에 비례한다.
    for (let i = 0; i < count; i++) this.#slots[this.#gapEnd + i] = undefined;
    this.#gapEnd += count;
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

  /** 빈 구간의 왼쪽 끝을 `offset` 으로 옮긴다. 옮긴 칸 수가 곧 거리다. */
  #moveGap(offset: number): void {
    while (offset < this.#gapStart) {
      this.#gapStart -= 1;
      this.#gapEnd -= 1;
      this.#slots[this.#gapEnd] = this.#slots[this.#gapStart];
      this.__cost += 1;
    }
    while (offset > this.#gapStart) {
      this.#slots[this.#gapStart] = this.#slots[this.#gapEnd];
      this.#gapStart += 1;
      this.#gapEnd += 1;
      this.__cost += 1;
    }
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
