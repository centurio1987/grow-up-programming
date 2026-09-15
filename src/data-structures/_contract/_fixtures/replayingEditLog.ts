/**
 * 결함 fixture — 편집을 적어 두기만 하고, 열거할 때 빈 배열에서부터 되풀이한다.
 *
 * 넣기는 넘겨받은 원소의 사본을 기록에 덧붙이고 길이만 고치므로 한 번의 편집이 k 에 묶인다 —
 * 편집 행 둘을 **계약보다 싸게** 지킨다. 대가는 `toArray` 에 있다. 기록한 편집 m 개를 배열 하나에
 * 차례로 다시 적용하므로 편집마다 그 뒤를 밀어, 열거 한 번이 $O(m \cdot n)$ 이다.
 *
 * **축1은 전부 통과한다.** 걸리는 자리는 「열거 · 편집 많이」 하나다 — 편집이 적으면 되풀이가 상수
 * 번이라 「열거 · 편집 적게」를 통과한다. 계약의 `toArray` 행이 m 을 **더하기로** 적고(`O(n + m)`)
 * 곱하지 않는 것, 그리고 그 행을 m 쪽 끝에서도 재는 것이 이 계열 때문이다. 수치는
 * `_contract/runContract.pieceTable.test.ts` 가 고정한다.
 */

type Edit<T> =
  | {
      readonly kind: "insert";
      readonly offset: number;
      readonly items: readonly T[];
    }
  | {
      readonly kind: "delete";
      readonly offset: number;
      readonly count: number;
    };

export class ReplayingEditLog<T> {
  #log: Edit<T>[] = [];
  #length = 0;

  __cost = 0;

  insert(offset: number, items: readonly T[]): void {
    if (!Number.isInteger(offset) || offset < 0 || offset > this.#length) {
      throw new RangeError("넣을 자리가 범위 밖이다");
    }
    this.__cost += items.length + 1;
    this.#log.push({ kind: "insert", offset, items: items.slice() });
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
    this.#log.push({ kind: "delete", offset, count });
    this.#length -= count;
  }

  length(): number {
    this.__cost += 1;
    return this.#length;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (const edit of this.#log) {
      // 편집 자리 뒤를 밀거나 당긴다 — 되풀이 한 번이 그때 담긴 수에 비례한다.
      this.__cost += out.length - edit.offset + 1;
      if (edit.kind === "insert") {
        out.splice(edit.offset, 0, ...edit.items);
        this.__cost += edit.items.length;
      } else {
        out.splice(edit.offset, edit.count);
      }
    }
    return out;
  }
}
