/**
 * 결함 fixture — 커서 앞뒤를 배열 둘에 나눠 담되, **커서를 옮길 때마다 둘을 처음부터 다시
 * 짓는** 수열.
 *
 * **이 fixture 가 「편집 지역성」이 계약의 문장이라는 것을 재는 자리다.** 끼워 넣기와
 * 지우기는 배열 끝을 만지는 것뿐이라 상수이고(계약의 두 행을 지킨다), 커서를 옮기는 값이
 * **거리가 아니라 담긴 수에 비례한다.** 계약이 `moveCursor` 를 「지나갈 거리 $d$ 에
 * 비례한다」로 적지 않고 「$O(n)$」으로 적었다면 이 구현이 계약을 만족하고, 그러면 커서를
 * 한 칸 옮기는 일과 끝에서 끝으로 뛰는 일의 값이 같아져 계약이 지역성을 하나도 약속하지
 * 못한다.
 *
 * **축1은 전부 통과한다** — 값이 하나도 틀리지 않는다. 축3의 여섯 시나리오 중에서도
 * **가까운 이동 하나에서만** 걸린다.
 *
 * - 가까운 이동(`moveCursor` · `worst O(1)`) — 한 칸 옮기는 데 담긴 수만큼 든다. 걸린다.
 * - 먼 뜀(`moveCursor` · `worst O(n)`) — 정본과 같은 계급이다. **통과한다.**
 * - `insert` · `deleteBefore` · `cursor`·`length` · `toArray` — 전부 정본과 같은 계급이다.
 *   통과한다.
 *
 * 하나에서만 걸리는 것이 이 fixture 의 값이다. 시나리오를 「먼 뜀」만 두었다면 이 구현이
 * 통과하고, 그것이 곧 계약에서 지역성 줄이 빠진 상태다.
 */

export class RebuildingEditableSequence<T> {
  /** 커서 앞의 것들. 앞에서부터 순서대로 든다. */
  #before: T[] = [];
  /** 커서 뒤의 것들을 **뒤집어** 든다 — 마지막 칸이 커서 바로 뒤 원소다. */
  #after: T[] = [];

  __cost = 0;

  insert(item: T): void {
    this.__cost += 1;
    this.#before.push(item);
  }

  deleteBefore(): T | null {
    if (this.#before.length === 0) return null;
    this.__cost += 1;
    return this.#before.pop() as T;
  }

  moveCursor(position: number): void {
    const size = this.#before.length + this.#after.length;
    if (!Number.isInteger(position) || position < 0 || position > size) {
      throw new RangeError(
        `커서 자리는 0 이상 ${size} 이하의 정수여야 한다 — 받은 값은 ${position} 이다`,
      );
    }
    // 거리를 보지 않고 통째로 다시 짓는다. 한 칸을 옮겨도 담긴 수만큼 든다.
    const all = this.toSequence();
    this.__cost += all.length + 1;
    this.#before = all.slice(0, position);
    this.#after = all.slice(position).reverse();
  }

  cursor(): number {
    this.__cost += 1;
    return this.#before.length;
  }

  length(): number {
    this.__cost += 1;
    return this.#before.length + this.#after.length;
  }

  toArray(): T[] {
    const all = this.toSequence();
    this.__cost += all.length + 1;
    return all;
  }

  /** 두 배열을 하나로 편다. `__cost` 를 세지 않는다 — 부르는 쪽이 센다. */
  private toSequence(): T[] {
    const out = [...this.#before];
    for (let at = this.#after.length - 1; at >= 0; at--) {
      out.push(this.#after[at] as T);
    }
    return out;
  }
}
