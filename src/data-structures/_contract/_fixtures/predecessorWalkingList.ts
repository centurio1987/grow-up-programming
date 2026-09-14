/**
 * 결함 fixture — `linear/doublyLinkedList` 계약을 **앞 원소를 모르는 단방향 마디**로 지키려는 구현.
 *
 * 답은 전부 옳다. 마디마다 값 · 다음 마디 · 속한 수열을 두고 앞 끝 · 뒤 끝 마디와 원소 수를 든다. 앞에
 * 넣기 · 뒤에 넣기 · 핸들 뒤에 끼우기는 다음 이음 하나를 고쳐 상수이고, 산 핸들인지는 마디가 기억한
 * 수열로 가려 상수다. 무너지는 자리는 빼기 하나다 — 뺄 마디를 앞 마디에서 떼어야 하는데 앞 마디를 들고
 * 있지 않으므로 앞 끝에서부터 걸어 찾는다. 그래서 계약의 `remove` 행(`amortized O(1)`)을 **어긴다.**
 *
 * **`linear/singlyLinkedList` 와 이 계약을 가르는 반례 그 자체다**(두 헤더의 반례 표 첫 행). 같은 마디
 * 사슬이 저쪽 계약의 다섯 행은 전부 지킨다 — 저쪽에는 핸들 자리에서 빼는 행이 없다.
 *
 * 계측 단위는 정본과 같다 — 마디 하나를 지나갈 때마다 1(§규약2 계측 단위). 앞 마디를 찾아 걸은 마디도
 * 센다.
 */

class WalkLink {
  next: WalkLink | null = null;

  constructor(
    public value: number,
    public owner: PredecessorWalkingList | null,
  ) {}
}

export class PredecessorWalkingList {
  #first: WalkLink | null = null;
  #last: WalkLink | null = null;
  #count = 0;

  __cost = 0;

  prepend(value: number): object {
    this.__cost += 1;
    const link = new WalkLink(value, this);
    link.next = this.#first;
    if (this.#first === null) this.#last = link;
    this.#first = link;
    this.#count += 1;
    return link;
  }

  append(value: number): object {
    this.__cost += 1;
    const link = new WalkLink(value, this);
    if (this.#last === null) this.#first = link;
    else this.#last.next = link;
    this.#last = link;
    this.#count += 1;
    return link;
  }

  insertAfter(handle: object, value: number): object | null {
    const at = this.#live(handle);
    if (at === null) return null;
    this.__cost += 1;
    const link = new WalkLink(value, this);
    link.next = at.next;
    at.next = link;
    if (this.#last === at) this.#last = link;
    this.#count += 1;
    return link;
  }

  remove(handle: object): boolean {
    const link = this.#live(handle);
    if (link === null) return false;
    // 앞 마디를 모르므로 앞 끝에서부터 걸어 찾는다. 여기가 결함이 사는 자리다.
    let before: WalkLink | null = null;
    let cursor = this.#first;
    this.__cost += 1;
    while (cursor !== link && cursor !== null) {
      before = cursor;
      cursor = cursor.next;
      this.__cost += 1;
    }
    if (before === null) this.#first = link.next;
    else before.next = link.next;
    if (this.#last === link) this.#last = before;
    link.next = null;
    link.owner = null;
    this.#count -= 1;
    return true;
  }

  toArray(): number[] {
    const out: number[] = [];
    for (let link = this.#first; link !== null; link = link.next) {
      this.__cost += 1;
      out.push(link.value);
    }
    return out;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  #live(handle: object): WalkLink | null {
    return handle instanceof WalkLink && handle.owner === this ? handle : null;
  }
}
