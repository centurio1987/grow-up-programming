/**
 * 결함 fixture — `linear/doublyLinkedList` 계약의 빼기를 **다음 원소의 값을 끌어와 제 마디에 덮는** 우회로
 * 상수에 맞추려는 구현.
 *
 * 앞 원소를 모르는 단방향 마디는 빼기에서 앞 마디를 찾아 걷는다(`predecessorWalkingList.ts`). 그 걸음을
 * 없애는 잘 알려진 우회가 있다 — 뺄 마디에 다음 마디의 값과 이음을 옮겨 덮고 **다음 마디를** 떼어 내면
 * 앞 마디를 몰라도 된다. 뒤 끝 마디에는 다음 마디가 없으므로 뒤 끝에 값 없는 끝 표지 마디를 늘 하나 달아
 * 둔다(뒤에 넣기는 그 표지에 값을 적고 새 표지를 뒤에 단다).
 *
 * 비용은 전부 상수라 계약 스위트의 축3 여섯 시나리오를 **전부 통과한다.** 무너지는 것은 의미다 — 떼어 낸
 * 마디는 **다음 원소의 핸들**이라 그 핸들이 죽고, 뺐다던 핸들은 다음 원소를 가리킨 채 산다. 계약의
 * `remove` 행 「그 핸들은 죽고 다른 핸들은 그대로다」를 **어기고, 축1이 값에서 잡는다.** 헤더 반례 표의
 * 「「다른 핸들은 그대로 유효하다」가 행에 있어서 반례가 선다」가 가리키는 구현이 이것이다 — 그 문장이
 * 없으면 이 구현이 계약을 지키고, `linear/singlyLinkedList` 와의 반례가 첫 번째(걷는 빼기) 하나만 남는다.
 *
 * 계측 단위는 정본과 같다 — 마디 하나를 지나갈 때마다 1(§규약2 계측 단위). 끝 표지 마디는 늘어놓을 때
 * 지나가지 않는다.
 */

class PullLink {
  next: PullLink | null = null;

  constructor(
    public value: number,
    /** 이 마디가 값을 담고 있는 수열. 끝 표지와 떼어 낸 마디는 `null`. */
    public owner: SuccessorPullingList | null,
  ) {}
}

export class SuccessorPullingList {
  /** 값 없는 끝 표지. 비어 있으면 `#first` 도 이 마디다. */
  #end = new PullLink(0, null);
  #first: PullLink = this.#end;
  #count = 0;

  __cost = 0;

  prepend(value: number): object {
    this.__cost += 1;
    const link = new PullLink(value, this);
    link.next = this.#first;
    this.#first = link;
    this.#count += 1;
    return link;
  }

  append(value: number): object {
    this.__cost += 1;
    // 끝 표지에 값을 적어 원소로 만들고, 새 끝 표지를 그 뒤에 단다.
    const link = this.#end;
    link.value = value;
    link.owner = this;
    const end = new PullLink(0, null);
    link.next = end;
    this.#end = end;
    this.#count += 1;
    return link;
  }

  insertAfter(handle: object, value: number): object | null {
    const at = this.#live(handle);
    if (at === null) return null;
    this.__cost += 1;
    const link = new PullLink(value, this);
    link.next = at.next;
    at.next = link;
    this.#count += 1;
    return link;
  }

  remove(handle: object): boolean {
    const link = this.#live(handle);
    if (link === null) return false;
    this.__cost += 1;
    // 끝 표지가 늘 뒤에 달려 있어 산 마디의 다음 마디는 비지 않는다.
    const successor = link.next as PullLink;
    // 다음 마디의 값 · 이음 · 소속을 제 마디에 덮고 다음 마디를 떼어 낸다. 여기가 결함이 사는 자리다 —
    // 떼어 낸 마디는 다음 원소의 핸들이고, 제 마디는 다음 원소를 담은 채 살아 있다.
    link.value = successor.value;
    link.next = successor.next;
    link.owner = successor.owner;
    if (successor === this.#end) this.#end = link;
    successor.next = null;
    successor.owner = null;
    this.#count -= 1;
    return true;
  }

  toArray(): number[] {
    const out: number[] = [];
    for (
      let link = this.#first;
      link !== this.#end;
      link = link.next as PullLink
    ) {
      this.__cost += 1;
      out.push(link.value);
    }
    return out;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  #live(handle: object): PullLink | null {
    return handle instanceof PullLink && handle.owner === this ? handle : null;
  }
}
