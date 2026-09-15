/**
 * 결함 fixture — 이 이름이 보통 가리키는 설계. 넣은 원소를 **덧붙이기만 하는 추가 버퍼 하나**에
 * 두고, 자리가 모자라면 그 버퍼를 두 배로 늘리며 **옮긴 칸을 센다.**
 *
 * 조각 목록은 정본(`linear/pieceTable/_reference/pieceTable.ts`)과 같다. 다른 것은 넣은 원소를 둘
 * 자리 하나다 — 정본은 넣기마다 제 배열을 짓고, 이쪽은 한 줄에 이어 쓴다. 한 줄이 가득 차면 늘리는
 * 호출 하나가 **지금까지 넣은 원소 전부**를 옮기므로, 긴 수열을 한 번에 넣은 뒤의 한 원소 넣기가
 * 담긴 수에 비례한다.
 *
 * **계약의 `insert` 행을 어긴다 — `worst` 이기 때문이다.** 늘리는 호출은 이따금이고 다음 늘리기까지
 * 그만큼의 원소가 들어오므로 **호출열 전체로 재면** 상한 안에 든다(§「상각 행의 약속은 호출열 전체로
 * 적는다」). 그 두 읽기가 갈리는 수치를 `_contract/runContract.pieceTable.test.ts` 가 고정한다 —
 * `worst` 가 약한 읽기보다 **추가로** 배제하는 계열이 이것이다(불변 사실 183).
 *
 * **런타임이 배열을 늘리는 일은 세지 않는다**(§규약2 계측 단위). 그래서 버퍼를 언어 배열의 `push`
 * 로 쓰면 이 결함이 계측에 안 보인다 — 여기서는 칸 배열을 손으로 늘려 옮긴 칸을 세는 것으로 **세는
 * 언어의 모양**을 옮겼다. 걸리는 자리는 「넣기 · 편집 적게」 하나다.
 */

interface Piece {
  readonly start: number;
  readonly length: number;
}

export class DoublingBufferPieceTable<T> {
  #slots: (T | undefined)[] = new Array<T | undefined>(8).fill(undefined);
  #used = 0;
  #pieces: Piece[] = [];
  #length = 0;

  __cost = 0;

  insert(offset: number, items: readonly T[]): void {
    if (!Number.isInteger(offset) || offset < 0 || offset > this.#length) {
      throw new RangeError("넣을 자리가 범위 밖이다");
    }
    this.__cost += 1;
    if (items.length === 0) return;

    while (this.#used + items.length > this.#slots.length) this.#grow();
    const piece: Piece = { start: this.#used, length: items.length };
    for (const item of items) this.#slots[this.#used++] = item;
    this.__cost += items.length;

    if (offset === this.#length) {
      this.#pieces.push(piece);
    } else {
      const at = this.#cut(offset);
      this.__cost += this.#pieces.length - at;
      this.#pieces.splice(at, 0, piece);
    }
    this.#length += items.length;
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
    if (count === 0) return;
    const from = this.#cut(offset);
    const to = this.#cut(offset + count);
    this.__cost += this.#pieces.length - from;
    this.#pieces.splice(from, to - from);
    this.#length -= count;
  }

  length(): number {
    this.__cost += 1;
    return this.#length;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (const piece of this.#pieces) {
      for (let at = 0; at < piece.length; at++) {
        out.push(this.#slots[piece.start + at] as T);
      }
    }
    this.__cost += this.#pieces.length + out.length + 1;
    return out;
  }

  /** 버퍼를 두 배로 늘리고 쓴 칸을 옮긴다. 옮긴 칸 수가 곧 이 호출의 비용이다. */
  #grow(): void {
    const next = new Array<T | undefined>(this.#slots.length * 2).fill(
      undefined,
    );
    for (let at = 0; at < this.#used; at++) next[at] = this.#slots[at];
    this.__cost += this.#used;
    this.#slots = next;
  }

  #cut(offset: number): number {
    let before = 0;
    for (let index = 0; index < this.#pieces.length; index++) {
      this.__cost += 1;
      const piece = this.#pieces[index] as Piece;
      if (offset === before) return index;
      if (offset < before + piece.length) {
        const inside = offset - before;
        this.__cost += this.#pieces.length - index;
        this.#pieces.splice(
          index,
          1,
          { start: piece.start, length: inside },
          { start: piece.start + inside, length: piece.length - inside },
        );
        return index + 1;
      }
      before += piece.length;
    }
    return this.#pieces.length;
  }
}
