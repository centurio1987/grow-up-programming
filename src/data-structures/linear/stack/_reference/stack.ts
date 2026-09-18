/**
 * `linear/stack` 정본 구현.
 *
 * **계약은 여기 적지 않는다.** 계약은 `../stack.ts` 헤더 한 곳이다(규약1). 이 파일이 지는
 * 의무는 둘이다 — 그 계약을 실제로 지키는 것, 그리고 축3이 읽을 `__cost` 를 노출하는 것.
 *
 * `__cost` 가 세는 것: **칸 하나를 지나갈 때마다 1** — **읽기와 쓰기를 따로 세지 않는다**
 * (§규약2 계측 단위).
 * 스택 연산은 배열의 끝 하나만
 * 건드리므로 연산당 1이다. 이 구조에는 주입점이 없어 밖에서 셀 수 있는 양이 없다 —
 * 그래서 자기 보고이고, 무엇을 세는지를 여기 적는 것이 §규약2가 요구하는 전부다.
 */
// #region guide:core
export class Stack<T> {
  #items: T[] = [];

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  push(item: T): void {
    this.__cost += 1;
    this.#items.push(item);
  }

  pop(): T | null {
    this.__cost += 1;
    if (this.#items.length === 0) return null;
    return this.#items.pop() as T;
  }

  peek(): T | null {
    this.__cost += 1;
    if (this.#items.length === 0) return null;
    return this.#items[this.#items.length - 1] as T;
  }
}
// #endregion
