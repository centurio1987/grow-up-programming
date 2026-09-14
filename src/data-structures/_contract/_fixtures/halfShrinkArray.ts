/**
 * 결함 fixture — `linear/dynamicArray` 계약을 **꽉 차면 두 배로 늘리고 절반 이하면 곧바로 절반으로 줄이는
 * 배열**로 지키려는 구현.
 *
 * 답은 전부 옳다. 넣기만 하거나 빼기만 하는 호출열에서는 정본과 같은 계급이다. 무너지는 자리는 **칸이
 * 꽉 찬 크기에서 넣기 · 빼기를 번갈아 할 때**다 — 넣으면 두 배로 늘리며 옮기고, 빼면 담긴 수가 새 칸의
 * 절반이라 곧바로 절반으로 줄이며 또 옮긴다. 호출마다 담긴 수만큼 옮기므로 계약의 `push` · `pop` 행
 * (`amortized O(1)`)을 **어긴다.** 물려받은 문서가 「4분의 1 이하에서 줄인다」로 막으려던 되풀이가 이것이다.
 *
 * 정본(`linear/dynamicArray/_reference/dynamicArray.ts`)과 **줄이는 문턱 하나만** 다르다 — 정본은 4분의 1,
 * 이것은 2분의 1. 늘리기 쪽은 같다.
 *
 * 계측 단위는 정본과 같다 — 칸 하나를 지나갈 때마다 1, 옮긴 원소마다 1(§규약2 계측 단위).
 */

const MIN_SLOTS = 4;

export class HalfShrinkArray {
  #slots: (number | undefined)[] = new Array(MIN_SLOTS);
  #count = 0;

  __cost = 0;

  push(item: number): void {
    if (this.#count === this.#slots.length)
      this.#moveTo(this.#slots.length * 2);
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
    const slots = this.#slots.length;
    // 절반 이하면 곧바로 줄인다. 여기가 결함이 사는 자리다.
    if (slots > MIN_SLOTS && this.#count * 2 <= slots) this.#moveTo(slots / 2);
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

  #moveTo(slots: number): void {
    const next = new Array<number | undefined>(slots);
    for (let at = 0; at < this.#count; at++) {
      this.__cost += 1;
      next[at] = this.#slots[at];
    }
    this.#slots = next;
  }
}
