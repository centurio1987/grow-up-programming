/**
 * `linear/singlyLinkedList` 정본(규약2).
 *
 * 계약은 `../singlyLinkedList.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고,
 * 계약이 허용하는 유일한 구현이 아니다. 자리를 돌려 쓰는 순환 버퍼도, 넣는 자리를 둘로 나눠 드는
 * 구현도 이 계약을 지킨다.
 *
 * **이 정본은 헤더가 검증 등급 근거로 든 자명한 구현 그 자체다** — 원소마다 마디(값 · 다음 마디)를 두고
 * 앞 끝 마디 · 뒤 끝 마디 · 원소 수를 든다. 넣기 둘과 빼기가 호출마다 상수이므로 계약이 `amortized` 로
 * 적은 세 행을 **호출 하나하나로도** 지킨다. 계약보다 센 것을 하는 자리이고, 축3은 그것을 벌하지
 * 않는다 — 상각 평균도 상수이기 때문이다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"마디 하나를 지나갈 때마다 1"* 이다 — **읽기와 쓰기를 따로 세지
 * 않고**, 언어 런타임이 마디 객체를 잡는 비용도 세지 않는다(§규약2 계측 단위). 넣기 · 빼기는 끝 마디
 * 하나를 건드려 1, `toArray` 는 마디마다 1 이다. 빈 수열의 `removeFirst`
 * 는 지나갈 마디가 없어 0 이다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 */

// #region guide:core
interface Link<T> {
  value: T;
  next: Link<T> | null;
}

export class SinglyLinkedList<T> {
  /** 앞 끝 마디. 비어 있으면 `null`. */
  #first: Link<T> | null = null;
  /** 뒤 끝 마디. 비어 있으면 `null` 이고, 원소가 하나면 `#first` 와 같은 마디다. */
  #last: Link<T> | null = null;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  prepend(value: T): void {
    this.__cost += 1;
    const link: Link<T> = { value, next: this.#first };
    this.#first = link;
    // 빈 수열에 넣은 원소는 뒤 끝이기도 하다.
    if (this.#last === null) this.#last = link;
  }

  append(value: T): void {
    this.__cost += 1;
    const link: Link<T> = { value, next: null };
    if (this.#last === null) this.#first = link;
    else this.#last.next = link;
    this.#last = link;
  }

  removeFirst(): T | null {
    const first = this.#first;
    if (first === null) return null;
    this.__cost += 1;
    this.#first = first.next;
    // 하나 남은 원소를 뺐으면 뒤 끝도 함께 비운다. 안 비우면 다음 append 가 빠진 마디 뒤에 붙는다.
    if (this.#first === null) this.#last = null;
    return first.value;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (let link = this.#first; link !== null; link = link.next) {
      this.__cost += 1;
      out.push(link.value);
    }
    return out;
  }
}
// #endregion
