/**
 * 결함 fixture — `linear/singlyLinkedList` 계약을 **앞 끝을 첫 칸에 둔 언어 배열 하나**로 지키려는 구현.
 *
 * 답은 전부 옳다. 뒤에 넣기는 배열 끝에 붙여 상수이고 늘어놓기 · 수 세기도 정본과 같은 계급이다.
 * 무너지는 자리는 앞 끝이다 — 앞에 넣으면 나머지를 한 칸씩 뒤로 밀고, 앞에서 빼면 한 칸씩 앞으로
 * 당긴다. 그래서 계약의 `prepend` · `removeFirst` 행(`amortized O(1)`)을 **어긴다.**
 *
 * `_fixtures/headOnlyLinkedList.ts` 와 **반대쪽에서 걸린다** — 그쪽은 뒤에 넣기만, 이쪽은 앞 끝 둘만
 * 어긴다. 시나리오를 행마다 둔 이유가 이 둘이다(불변 사실 24).
 *
 * 계측 단위는 §규약2 계측 단위를 따른다 — 밀거나 당긴 칸마다 1. 언어 배열의 `unshift` · `shift` 가
 * 실제로 하는 일을 센 것이다.
 */
export class FrontShiftingList {
  #items: number[] = [];

  __cost = 0;

  prepend(value: number): void {
    // 담긴 칸을 전부 한 칸씩 민다.
    this.__cost += this.#items.length + 1;
    this.#items.unshift(value);
  }

  append(value: number): void {
    this.__cost += 1;
    this.#items.push(value);
  }

  removeFirst(): number | null {
    if (this.#items.length === 0) return null;
    // 남는 칸을 전부 한 칸씩 당긴다.
    this.__cost += this.#items.length;
    return this.#items.shift() as number;
  }

  toArray(): number[] {
    this.__cost += this.#items.length;
    return [...this.#items];
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }
}
