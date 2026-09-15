/**
 * 결함 fixture — 조각 목록인데 넘겨받은 원소를 **하나씩 따로** 넣고, 지울 때도 하나씩 지운다.
 *
 * 정본(`linear/pieceTable/_reference/pieceTable.ts`)과 같은 조각 목록을 쓰되, `insert(offset, items)`
 * 를 한 원소짜리 넣기 k 번으로, `delete(offset, count)` 를 한 원소짜리 지우기 count 번으로 푼다.
 * 원소마다 조각을 앞에서부터 훑으므로 **한 번의 편집이 넣거나 지우는 원소 수에 비례해 조각을 훑는다.**
 * 한 원소짜리 조각이 원소 수만큼 쌓이는 것도 같은 결함의 다른 쪽이다.
 *
 * **축1은 전부 통과한다.** 걸리는 자리는 「넣기 · 크게 넣기」(k = n)와 「지우기 · 편집 적게」(지우는
 * 수 = n)다 — 계약의 `insert` 행이 k 를 **더하고**, `delete` 행이 지우는 수를 **아예 적지 않는** 이유가
 * 이 계열이다. 「넣기 · 편집 적게」에서도 걸리는데 **이유가 다르다** — 그 시나리오의 준비(n 개 한 번에
 * 넣기)가 이 구현에서는 한 원소짜리 조각 n 개를 만들어, 뒤이은 한 개 넣기가 조각 n 개를 훑는다. 수치는
 * `_contract/runContract.pieceTable.test.ts` 가 고정한다.
 */

interface Piece<T> {
  readonly source: readonly T[];
  readonly start: number;
  readonly length: number;
}

export class ItemwisePieceTable<T> {
  #pieces: Piece<T>[] = [];
  #length = 0;

  __cost = 0;

  insert(offset: number, items: readonly T[]): void {
    if (!Number.isInteger(offset) || offset < 0 || offset > this.#length) {
      throw new RangeError("넣을 자리가 범위 밖이다");
    }
    this.__cost += 1;
    for (const [i, item] of items.entries()) this.#insertOne(offset + i, item);
  }

  delete(offset: number, count: number): void {
    if (
      !Number.isInteger(offset) ||
      !Number.isInteger(count) ||
      offset < 0 ||
      count < 0 ||
      offset + count > this.#length
    ) {
      throw new RangeError("지울 구간이 범위 밖이다");
    }
    this.__cost += 1;
    for (let i = 0; i < count; i++) this.#deleteOne(offset);
  }

  length(): number {
    this.__cost += 1;
    return this.#length;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (const piece of this.#pieces) {
      for (let at = 0; at < piece.length; at++) {
        out.push(piece.source[piece.start + at] as T);
      }
    }
    this.__cost += this.#pieces.length + out.length + 1;
    return out;
  }

  #insertOne(offset: number, item: T): void {
    const at = this.#cut(offset);
    this.__cost += this.#pieces.length - at + 1;
    this.#pieces.splice(at, 0, { source: [item], start: 0, length: 1 });
    this.#length += 1;
  }

  #deleteOne(offset: number): void {
    const from = this.#cut(offset);
    const to = this.#cut(offset + 1);
    this.__cost += this.#pieces.length - from;
    this.#pieces.splice(from, to - from);
    this.#length -= 1;
  }

  #cut(offset: number): number {
    let before = 0;
    for (let index = 0; index < this.#pieces.length; index++) {
      this.__cost += 1;
      const piece = this.#pieces[index] as Piece<T>;
      if (offset === before) return index;
      if (offset < before + piece.length) {
        const inside = offset - before;
        this.__cost += this.#pieces.length - index;
        this.#pieces.splice(
          index,
          1,
          { source: piece.source, start: piece.start, length: inside },
          {
            source: piece.source,
            start: piece.start + inside,
            length: piece.length - inside,
          },
        );
        return index + 1;
      }
      before += piece.length;
    }
    return this.#pieces.length;
  }
}
