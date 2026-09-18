/**
 * `linear/doublyLinkedList` 정본(규약2).
 *
 * 계약은 `../doublyLinkedList.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고,
 * 계약이 허용하는 유일한 구현이 아니다. 원소마다 앞뒤 자리를 칸 번호로 적어 두는 배열도 이 계약을
 * 지킨다.
 *
 * **이 정본은 헤더가 검증 등급 근거로 든 자명한 구현 그 자체다** — 원소마다 마디(값 · 앞 마디 · 다음
 * 마디 · 속한 수열)를 두고 앞 끝 마디 · 뒤 끝 마디 · 원소 수를 든다. 돌려주는 핸들은 마디 그 자체이고,
 * 산 핸들인지는 마디가 기억한 수열이 이 수열인지로 가린다. 빼면 그 기억을 지우므로 죽은 핸들이 다시
 * 살아날 길이 없고, 다른 수열의 마디는 기억한 수열이 달라 걸러진다. 넣기 셋과 빼기가 호출마다 상수라
 * 계약이 `amortized` 로 적은 네 행을 **호출 하나하나로도** 지킨다 — 축3은 그것을 벌하지 않는다.
 *
 * **다른 핸들을 건드리지 않는 것이 이 정본에서 가장 중요한 줄이다.** 빼기는 뺄 마디의 앞뒤 마디가 서로를
 * 가리키게 고칠 뿐 어느 마디의 값도 옮기지 않는다. 다음 마디의 값을 끌어와 덮으면 단방향 이음으로도
 * 상수에 되지만 다음 원소의 핸들이 죽는다(`_contract/_fixtures/successorPullingList.ts`).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"마디 하나를 지나갈 때마다 1"* 이다 — **읽기와 쓰기를 따로 세지
 * 않고**, 언어 런타임이 마디 객체를 잡는 비용도 세지 않는다(§규약2 계측 단위). 넣기 · 빼기는 새 마디나
 * 뺄 마디 하나를 건드려 1, `toArray` 는 마디마다 1 이다. 산 핸들이 아니면
 * 지나갈 마디가 없어 0 이다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 */

// #region guide:core
export type ListHandle = object;

class Link<T> {
  prev: Link<T> | null = null;
  next: Link<T> | null = null;

  constructor(
    public value: T,
    /** 이 마디가 담긴 수열. 빠지면 `null` 이 되고 다시 채워지지 않는다. */
    public owner: DoublyLinkedList<T> | null,
  ) {}
}

export class DoublyLinkedList<T> {
  /** 앞 끝 마디. 비어 있으면 `null`. */
  #first: Link<T> | null = null;
  /** 뒤 끝 마디. 비어 있으면 `null` 이고, 원소가 하나면 `#first` 와 같은 마디다. */
  #last: Link<T> | null = null;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  prepend(value: T): ListHandle {
    this.__cost += 1;
    const link = new Link(value, this);
    link.next = this.#first;
    if (this.#first === null) this.#last = link;
    else this.#first.prev = link;
    this.#first = link;
    return link;
  }

  append(value: T): ListHandle {
    this.__cost += 1;
    const link = new Link(value, this);
    link.prev = this.#last;
    if (this.#last === null) this.#first = link;
    else this.#last.next = link;
    this.#last = link;
    return link;
  }

  insertAfter(handle: ListHandle, value: T): ListHandle | null {
    const at = this.#live(handle);
    if (at === null) return null;
    this.__cost += 1;
    const link = new Link(value, this);
    link.prev = at;
    link.next = at.next;
    // 끼우는 자리가 뒤 끝이면 새 마디가 뒤 끝이다. 아니면 다음 마디의 앞 이음을 새 마디로 돌린다.
    if (at.next === null) this.#last = link;
    else at.next.prev = link;
    at.next = link;
    return link;
  }

  remove(handle: ListHandle): boolean {
    const link = this.#live(handle);
    if (link === null) return false;
    this.__cost += 1;
    // 앞뒤 마디가 서로를 가리키게 고친다. 어느 마디의 값도 옮기지 않으므로 다른 핸들은 그대로다.
    if (link.prev === null) this.#first = link.next;
    else link.prev.next = link.next;
    if (link.next === null) this.#last = link.prev;
    else link.next.prev = link.prev;
    link.prev = null;
    link.next = null;
    // 이 핸들을 죽인다. 같은 마디가 다시 수열에 들어올 길이 없으므로 다시 살아나지 않는다.
    link.owner = null;
    return true;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (let link = this.#first; link !== null; link = link.next) {
      this.__cost += 1;
      out.push(link.value);
    }
    return out;
  }

  /** 산 핸들이면 그 마디, 아니면 `null`. 이미 빠진 마디와 다른 수열의 마디를 함께 거른다. */
  #live(handle: ListHandle): Link<T> | null {
    return handle instanceof Link && handle.owner === this ? handle : null;
  }
}
// #endregion
