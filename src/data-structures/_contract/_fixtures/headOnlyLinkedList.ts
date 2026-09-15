/**
 * 결함 fixture — `linear/singlyLinkedList` 계약을 **앞 끝 마디만 기억하는 사슬**로 지키려는 구현.
 *
 * 답은 전부 옳다. 앞에 넣기 · 앞에서 빼기 · 늘어놓기 · 수 세기는 정본과 걸음이 같다. 다른 자리는
 * 뒤에 넣기 하나다 — 뒤 끝 마디를 들고 있지 않으므로 붙일 때마다 앞 끝에서 마지막 마디까지 걸어간다.
 * 그래서 계약의 `append` 행(`amortized O(1)`)을 **어긴다.**
 *
 * `linear/xorLinkedList` 의 `tailScanList.ts` 와 같은 실수를 이 계약의 표면으로 옮긴 것이다. 그
 * fixture 를 고치지 않고 새로 둔 이유는 두 계약의 표면이 달라서다(`_fixtures/` 는 읽기만 한다 —
 * `docs/ORD-006-wbs.md` §4).
 *
 * 계측 단위는 정본과 같다 — 마디 하나를 지나갈 때마다 1(§규약2 계측 단위).
 */

interface HeadLink {
  value: number;
  next: HeadLink | null;
}

export class HeadOnlyLinkedList {
  #first: HeadLink | null = null;
  #count = 0;

  __cost = 0;

  prepend(value: number): void {
    this.__cost += 1;
    this.#first = { value, next: this.#first };
    this.#count += 1;
  }

  append(value: number): void {
    const link: HeadLink = { value, next: null };
    this.#count += 1;
    if (this.#first === null) {
      this.__cost += 1;
      this.#first = link;
      return;
    }
    // 뒤 끝을 모르므로 앞에서부터 걷는다. 여기가 결함이 사는 자리다.
    let last = this.#first;
    this.__cost += 1;
    while (last.next !== null) {
      last = last.next;
      this.__cost += 1;
    }
    last.next = link;
  }

  removeFirst(): number | null {
    const first = this.#first;
    if (first === null) return null;
    this.__cost += 1;
    this.#first = first.next;
    this.#count -= 1;
    return first.value;
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
}
