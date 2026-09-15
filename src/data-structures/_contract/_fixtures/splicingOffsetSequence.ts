/**
 * 결함 fixture — 원소를 배열 하나에 순서대로 들고, 넣고 지울 때마다 그 뒤를 민다.
 *
 * `linear/pieceTable` 계약의 **자명한 첫 시도**이자 축1 참조 모델과 같은 모양이다. 값은 하나도
 * 틀리지 않는다 — **축1은 전부 통과한다.** 어기는 것은 편집 행의 비용 조건이고, 계약이 배제하려는
 * 것이 정확히 이 계열이다(`pieceTable.ts` 헤더의 필요충분조건 비용 줄 — 한 번의 편집이 담긴 수에
 * 비례하면 배열이다).
 *
 * **걸리는 자리** — 「넣기 · 편집 적게」와 「지우기 · 편집 적게」 둘. 나머지 넷(크게 넣기 · 길이 ·
 * 열거 둘)은 통과한다. 수치는 `_contract/runContract.pieceTable.test.ts` 가 고정한다.
 */

export class SplicingOffsetSequence<T> {
  #items: T[] = [];

  __cost = 0;

  insert(offset: number, items: readonly T[]): void {
    if (
      !Number.isInteger(offset) ||
      offset < 0 ||
      offset > this.#items.length
    ) {
      throw new RangeError("넣을 자리가 범위 밖이다");
    }
    // 끼운 자리 뒤가 전부 넣은 수만큼 밀린다. 그 비용이 여기서 세어진다.
    this.__cost += this.#items.length - offset + items.length + 1;
    this.#items.splice(offset, 0, ...items);
  }

  delete(offset: number, count: number): void {
    if (
      !Number.isInteger(offset) ||
      !Number.isInteger(count) ||
      offset < 0 ||
      count < 0 ||
      offset + count > this.#items.length
    ) {
      throw new RangeError("지울 구간이 범위 밖이다");
    }
    // 지운 자리 뒤가 전부 당겨진다.
    this.__cost += this.#items.length - offset + 1;
    this.#items.splice(offset, count);
  }

  length(): number {
    this.__cost += 1;
    return this.#items.length;
  }

  toArray(): T[] {
    this.__cost += this.#items.length + 1;
    return [...this.#items];
  }
}
