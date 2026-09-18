/**
 * `linear/pieceTable` 정본(규약2).
 *
 * 계약은 `../pieceTable.ts` 헤더 한 곳이다(규약1). 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다. 여기 쓴 방식은 **조각 목록**이다 — 넣은
 * 원소를 넣은 호출마다 제 배열 하나에 사본으로 두고, 수열은 「어느 배열의 몇째부터 몇 개」를
 * 적은 조각을 차례로 이은 것이다. 조각을 균형 트리에 두는 구현도, 커서 가까운 조각을 기억해
 * 두는 구현도 계약을 지킨다.
 *
 * **넣은 원소를 넣기마다 따로 둔 것이 이 정본의 선택이다.** 이 이름이 보통 가리키는 설계는
 * 원본 하나와 **덧붙이기만 하는 추가 버퍼 하나**를 두는데, 그 버퍼를 한 줄로 두 배씩 늘리면
 * 늘리는 호출 하나가 지금까지 넣은 원소 전부를 옮긴다. 계약의 `insert` 행이 `worst` 라 그
 * 호출이 상한 $O(m + k)$ 를 넘는다(`_contract/_fixtures/doublingBufferPieceTable.ts`). 따로 두면
 * 넣기 한 번의 일이 그 호출이 받은 원소 수 k 에 묶인다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"조각 하나나 원소 하나를 지나갈 때마다 1"* 이다 —
 * **읽기와 쓰기를 따로 세지 않고**, 언어 런타임이 배열을 잡는 비용도 세지 않는다
 * (§규약2 계측 단위). 조각 배열의 가운데에 끼우거나 빼면 그 뒤 조각이 한 칸씩 밀리므로 **민 조각 수를
 * 함께 센다** — 그 일이 조각 수에 비례하는 것이 이 정본의 비용 계급이기 때문이다. `__cost` 는
 * 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * 조각을 하나도 지나가지 않는 호출(`length`, 빈 배열 넣기, 0 개 지우기)도 1 을 더한다. 판정이
 * 계측값 0 을 성장률로 나누지 못하기 때문이고(`_contract/judge.ts` 의 `judgeGrowth`), 상수
 * 배수는 판정에 안 들어온다.
 *
 * **조각 수는 편집 수의 두 배를 넘지 않는다.** 넣기는 조각 하나를 둘로 가르고 하나를 더하며,
 * 지우기는 조각 하나를 둘로 가를 수 있을 뿐이다(양 끝이 한 조각 안이면 가른 뒤 가운데를
 * 뺀다). 빈 조각은 남기지 않는다. 그래서 조각을 훑는 일이 계약의 m 에 묶인다.
 */

// #region guide:core
/** 조각 하나 — `source` 의 `start` 째부터 `length` 개. `length` 는 늘 1 이상이다. */
interface Piece<T> {
  readonly source: readonly T[];
  readonly start: number;
  readonly length: number;
}

export class PieceTable<T> {
  /** 수열을 이루는 조각을 앞에서부터 차례로 든다. */
  #pieces: Piece<T>[] = [];
  /** 담긴 원소 수. 조각을 더해 세지 않도록 따로 든다. */
  #length = 0;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  insert(offset: number, items: readonly T[]): void {
    if (!Number.isInteger(offset) || offset < 0 || offset > this.#length) {
      throw new RangeError(
        `넣을 자리는 0 이상 ${this.#length} 이하의 정수여야 한다 — 받은 값은 ${offset} 이다`,
      );
    }
    this.__cost += 1;
    if (items.length === 0) return;

    // 호출자가 넘긴 배열을 붙들지 않는다 — 넘긴 뒤 고쳐도 담긴 것이 바뀌면 안 된다.
    const source = items.slice();
    this.__cost += source.length;
    const piece: Piece<T> = { source, start: 0, length: source.length };

    if (offset === this.#length) {
      // 끝에 붙이는 넣기는 조각을 훑을 필요가 없다.
      this.#pieces.push(piece);
    } else {
      const at = this.#cut(offset);
      this.__cost += this.#pieces.length - at;
      this.#pieces.splice(at, 0, piece);
    }
    this.#length += source.length;
  }

  delete(offset: number, count: number): void {
    if (
      !Number.isInteger(offset) ||
      !Number.isInteger(count) ||
      offset < 0 ||
      count < 0 ||
      offset + count > this.#length
    ) {
      throw new RangeError(
        `지울 구간은 0 이상 ${this.#length} 이하 안에 있어야 한다 — 받은 값은 (${offset}, ${count}) 이다`,
      );
    }
    this.__cost += 1;
    if (count === 0) return;

    // 두 끝에서 조각을 갈라 두면 사이의 조각을 통째로 뺄 수 있다. 지우는 원소 수가 아니라
    // 빼는 조각 수만큼만 일한다.
    const from = this.#cut(offset);
    const to = this.#cut(offset + count);
    this.__cost += this.#pieces.length - from;
    this.#pieces.splice(from, to - from);
    this.#length -= count;
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

  /**
   * `offset` 자리에서 조각을 갈라, 그 자리에서 **시작하는** 조각의 번호를 돌려준다.
   * `offset` 이 끝이면 조각 수를 돌려준다. 앞에서부터 훑으므로 지나간 조각 수만큼 든다.
   */
  #cut(offset: number): number {
    let before = 0;
    for (let index = 0; index < this.#pieces.length; index++) {
      this.__cost += 1;
      const piece = this.#pieces[index] as Piece<T>;
      if (offset === before) return index;
      if (offset < before + piece.length) {
        const inside = offset - before;
        const left: Piece<T> = {
          source: piece.source,
          start: piece.start,
          length: inside,
        };
        const right: Piece<T> = {
          source: piece.source,
          start: piece.start + inside,
          length: piece.length - inside,
        };
        this.__cost += this.#pieces.length - index;
        this.#pieces.splice(index, 1, left, right);
        return index + 1;
      }
      before += piece.length;
    }
    return this.#pieces.length;
  }
}
// #endregion
