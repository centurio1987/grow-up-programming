/**
 * 결함 fixture — 조각 목록인데 원소 수를 세어 두지 않고, `length()` 가 조각마다 길이를 더한다.
 *
 * 정본(`linear/pieceTable/_reference/pieceTable.ts`)과 같은 조각 목록이다. 물려받은 스텁이 담긴 수를
 * 필드로 들고 있었는데(`_length`), 그것을 빼고 「조각에 이미 적혀 있으니 더하면 된다」로 간 모양이다.
 * 조각 수는 편집 수의 두 배를 넘지 않으므로 이 `length()` 도 **편집 수 m 에는 묶인다** — 그래서
 * 편집이 적으면 상수이고, 계약의 `length` 행이 `O(1)` 로 m 을 적지 않는 것이 이 계열을 배제한다.
 *
 * **축1은 전부 통과한다.** 걸리는 자리는 「길이 · 편집 많이」 하나다. 수치는
 * `_contract/runContract.pieceTable.test.ts` 가 고정한다.
 */

interface Piece<T> {
  readonly source: readonly T[];
  readonly start: number;
  readonly length: number;
}

export class SummingLengthPieceTable<T> {
  #pieces: Piece<T>[] = [];

  __cost = 0;

  insert(offset: number, items: readonly T[]): void {
    const size = this.#size();
    if (!Number.isInteger(offset) || offset < 0 || offset > size) {
      throw new RangeError("넣을 자리가 범위 밖이다");
    }
    this.__cost += 1;
    if (items.length === 0) return;
    const source = items.slice();
    this.__cost += source.length;
    const piece: Piece<T> = { source, start: 0, length: source.length };
    if (offset === size) {
      this.#pieces.push(piece);
      return;
    }
    const at = this.#cut(offset);
    this.__cost += this.#pieces.length - at;
    this.#pieces.splice(at, 0, piece);
  }

  delete(offset: number, count: number): void {
    const size = this.#size();
    if (
      !Number.isInteger(offset) ||
      !Number.isInteger(count) ||
      offset < 0 ||
      count < 0 ||
      offset + count > size
    ) {
      throw new RangeError("지울 구간이 범위 밖이다");
    }
    this.__cost += 1;
    if (count === 0) return;
    const from = this.#cut(offset);
    const to = this.#cut(offset + count);
    this.__cost += this.#pieces.length - from;
    this.#pieces.splice(from, to - from);
  }

  length(): number {
    this.__cost += 1;
    return this.#size();
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

  /** 조각마다 길이를 더한다 — 지나간 조각 수만큼 센다. */
  #size(): number {
    let total = 0;
    for (const piece of this.#pieces) total += piece.length;
    this.__cost += this.#pieces.length;
    return total;
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
