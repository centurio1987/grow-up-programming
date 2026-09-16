/**
 * 결함 fixture — 원소마다 **집합 번호표**를 적어 두고, 합칠 때 한쪽 집합의 번호표를 전부 다시 적으며,
 * 되돌릴 때 **옮긴 원소를 전부 되돌려 적는** 분리 집합. 어느 쪽을 다시 적는가(`policy`)를 고른다.
 *
 * 대상 계약: `disjoint-set/disjointSetRollback`.
 *
 * **동작은 옳다.** 축1을 전부 통과한다. `_contract/_fixtures/relabelingPartition.ts`(대상 `unionFind`)에
 * 되돌리기 하나를 붙인 것이다 — 합치기 호출마다 「어느 번호표에서 어느 번호표로 몇 개를 옮겼는가」를
 * 쌓고(아무것도 안 옮긴 호출은 빈 칸), 되돌리기가 옮겨 간 쪽 목록의 끝에서 그만큼을 떼어 되돌린다.
 * 뒤에서부터 되돌리므로 그 원소들은 언제나 목록의 끝에 있다.
 *
 * | `policy` | 합칠 때 다시 적는 쪽 | 계약에 대해 |
 * |---|---|---|
 * | `first` | 앞 인자의 집합 | **어긴다.** 큰 집합을 앞 인자로 넘기며 하나씩 붙이면 호출마다 그 집합 전부를 다시 적는다. 자명한 구현이다 |
 * | `smaller` | 원소가 적은 쪽 | **어긴다 — 되돌리기가 든 시나리오에서만 걸린다.** 되돌리기가 없으면 한 원소가 다시 적힐 때마다 그 원소의 집합이 두 배 이상이 되어 원소마다 로그 번이다. 되돌리기가 그 두 배를 되물리므로, 크기가 같은 두 집합을 합치고 되돌리기를 거듭하면 호출마다 절반을 다시 적는다 |
 *
 * `smaller` 는 `unionFind` 계약에서 **로그 인수만큼 어기고 스위트를 통과하던** 설계다(그쪽 fixture 헤더).
 * 이 계약에서는 되돌리기가 상각의 근거(「다시 적힌 원소의 집합은 두 배가 된다」)를 무르므로 다항 계급으로
 * 걸린다.
 *
 * 축3 계측 단위는 정본과 같다 — *"원소 하나를 지나갈 때마다 1"*(§규약2 계측 단위). 공개 연산 한 번에
 * 1, 다시 적는 번호표 하나에 1, 되돌리며 되돌려 적는 번호표 하나에 1 이다.
 */

export type RelabelingUndoPolicy = "first" | "smaller";

/** 합치기 호출 하나가 옮긴 것. 아무것도 안 옮긴 호출은 `null`. */
interface Move {
  from: number;
  into: number;
  count: number;
  /** 옮기기 전 `into` 의 가장 작은 원소. */
  smallest: number;
}

export class RelabelingUndoPartition {
  readonly #policy: RelabelingUndoPolicy;
  readonly #label: number[] = [];
  readonly #members: number[][] = [];
  readonly #smallest: number[] = [];
  readonly #history: (Move | null)[] = [];

  __cost = 0;

  constructor(n: number, policy: RelabelingUndoPolicy) {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(
        `원소 수는 0 이상의 정수여야 한다 — 받은 값은 ${n} 이다`,
      );
    }
    this.#policy = policy;
    for (let element = 0; element < n; element++) {
      this.#label.push(element);
      this.#members.push([element]);
      this.#smallest.push(element);
    }
  }

  find(x: number): number {
    this.__cost += 1;
    return this.#smallest[this.#labelOf(x)] as number;
  }

  union(x: number, y: number): void {
    this.__cost += 1;
    const left = this.#labelOf(x);
    const right = this.#labelOf(y);
    if (left === right) {
      this.#history.push(null);
      return;
    }

    const leftMembers = this.#members[left] as number[];
    const rightMembers = this.#members[right] as number[];
    const [from, into] =
      this.#policy === "first" || leftMembers.length < rightMembers.length
        ? [left, right]
        : [right, left];

    const moving = this.#members[from] as number[];
    const staying = this.#members[into] as number[];
    this.#history.push({
      from,
      into,
      count: moving.length,
      smallest: this.#smallest[into] as number,
    });
    for (const element of moving) {
      this.__cost += 1;
      this.#label[element] = into;
      staying.push(element);
    }
    this.#members[from] = [];
    this.#smallest[into] = Math.min(
      this.#smallest[into] as number,
      this.#smallest[from] as number,
    );
  }

  connected(x: number, y: number): boolean {
    this.__cost += 1;
    return this.#labelOf(x) === this.#labelOf(y);
  }

  rollback(): boolean {
    this.__cost += 1;
    if (this.#history.length === 0) return false;
    const move = this.#history.pop();
    if (move) {
      const staying = this.#members[move.into] as number[];
      const back = staying.splice(staying.length - move.count, move.count);
      for (const element of back) {
        this.__cost += 1;
        this.#label[element] = move.from;
      }
      this.#members[move.from] = back;
      this.#smallest[move.into] = move.smallest;
    }
    return true;
  }

  #labelOf(x: number): number {
    if (!Number.isInteger(x) || x < 0 || x >= this.#label.length) {
      throw new RangeError(
        `원소는 0 이상 ${this.#label.length} 미만의 정수여야 한다 — 받은 값은 ${x} 이다`,
      );
    }
    return this.#label[x] as number;
  }
}
