/**
 * 결함 fixture — `linear/dynamicArray` 계약을 **칸을 일정한 수씩만 늘리며 매번 옮기는 배열**로 지키려는 구현.
 *
 * 답은 전부 옳다. 읽기 · 쓰기 · 빼기는 정본과 같은 계급이다. 무너지는 자리는 넣기다 — 칸이 모자랄 때
 * 두 배가 아니라 `STEP` 칸만 늘리므로, 옮기는 일이 `STEP` 번 넣을 때마다 한 번씩 담긴 수만큼 든다.
 * n 번 넣는 총비용이 n² / (2 · STEP) 이라 상각 평균이 담긴 수를 따라가고, 계약의 `push` 행
 * (`amortized O(1)`)을 **어긴다.** `STEP` 을 얼마로 잡아도 상수인 한 계급이 같다.
 *
 * 줄이지는 않는다 — 빼기 쪽 결함은 `_fixtures/halfShrinkArray.ts` 가 따로 본다.
 *
 * 계측 단위는 정본과 같다 — 칸 하나를 지나갈 때마다 1, 옮긴 원소마다 1(§규약2 계측 단위).
 */

const STEP = 16;

export class StepGrowthArray {
  #slots: (number | undefined)[] = new Array(STEP);
  #count = 0;

  __cost = 0;

  push(item: number): void {
    if (this.#count === this.#slots.length) {
      // 일정한 수만 늘린다. 여기가 결함이 사는 자리다.
      const next = new Array<number | undefined>(this.#slots.length + STEP);
      for (let at = 0; at < this.#count; at++) {
        this.__cost += 1;
        next[at] = this.#slots[at];
      }
      this.#slots = next;
    }
    this.__cost += 1;
    this.#slots[this.#count] = item;
    this.#count += 1;
  }

  pop(): number | null {
    if (this.#count === 0) return null;
    this.__cost += 1;
    this.#count -= 1;
    const item = this.#slots[this.#count] as number;
    this.#slots[this.#count] = undefined;
    return item;
  }

  get(index: number): number | null {
    this.__cost += 1;
    if (!this.#holds(index)) return null;
    return this.#slots[index] as number;
  }

  set(index: number, item: number): void {
    this.__cost += 1;
    if (!this.#holds(index)) throw new RangeError(`첨자 ${index}`);
    this.#slots[index] = item;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  toArray(): number[] {
    const out: number[] = [];
    for (let at = 0; at < this.#count; at++) {
      this.__cost += 1;
      out.push(this.#slots[at] as number);
    }
    return out;
  }

  #holds(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < this.#count;
  }
}
