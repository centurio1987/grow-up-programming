/**
 * 결함 fixture — `linear/dynamicArray` 계약을 **마디 사슬로 담고 첨자를 앞에서부터 세는** 구현.
 *
 * 답은 전부 옳다. 뒤 끝 마디를 들고 있어 넣기는 상수이고, 수 세기 · 늘어놓기도 정본과 같은 계급이다.
 * 무너지는 자리는 셋이다 — `get` · `set` 은 첨자만큼 마디를 걷고, `pop` 은 한 방향으로만 이어진 사슬이라
 * 새 뒤 끝(뒤에서 둘째 마디)을 앞에서부터 찾는다. 그래서 계약의 `get`(`worst O(1)`) · `set` · `pop`
 * (`amortized O(1)`) 행을 **어긴다.**
 *
 * `linear/singlyLinkedList` 계약은 이 모양이 지키는 계약이다(첨자 접근이 없다). 두 계약이 서로 담지
 * 않는다는 반례의 한쪽이 이것이다(`linear/dynamicArray/dynamicArray.ts` 헤더 반례 표).
 *
 * 계측 단위는 §규약2 계측 단위를 따른다 — 마디 하나를 지나갈 때마다 1.
 */

interface IndexLink {
  value: number;
  next: IndexLink | null;
}

export class WalkingIndexList {
  #first: IndexLink | null = null;
  #last: IndexLink | null = null;
  #count = 0;

  __cost = 0;

  push(item: number): void {
    this.__cost += 1;
    const link: IndexLink = { value: item, next: null };
    if (this.#last === null) this.#first = link;
    else this.#last.next = link;
    this.#last = link;
    this.#count += 1;
  }

  pop(): number | null {
    const last = this.#last;
    if (last === null) return null;
    this.__cost += 1;
    this.#count -= 1;
    if (this.#count === 0) {
      this.#first = null;
      this.#last = null;
      return last.value;
    }
    // 새 뒤 끝을 앞에서부터 찾는다. 여기가 결함이 사는 자리 하나다.
    let before = this.#first as IndexLink;
    this.__cost += 1;
    while (before.next !== last) {
      before = before.next as IndexLink;
      this.__cost += 1;
    }
    before.next = null;
    this.#last = before;
    return last.value;
  }

  get(index: number): number | null {
    this.__cost += 1;
    if (!this.#holds(index)) return null;
    return this.#walk(index).value;
  }

  set(index: number, item: number): void {
    this.__cost += 1;
    if (!this.#holds(index)) throw new RangeError(`첨자 ${index}`);
    this.#walk(index).value = item;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  toArray(): number[] {
    const out: number[] = [];
    for (let link = this.#first; link !== null; link = link.next) {
      this.__cost += 1;
      out.push(link.value);
    }
    return out;
  }

  #holds(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < this.#count;
  }

  /** 첨자만큼 앞에서부터 걷는다. 여기가 결함이 사는 자리 둘이다. */
  #walk(index: number): IndexLink {
    let link = this.#first as IndexLink;
    for (let at = 0; at < index; at++) {
      this.__cost += 1;
      link = link.next as IndexLink;
    }
    return link;
  }
}
