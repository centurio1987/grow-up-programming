/**
 * 결함 fixture — 커서 앞뒤를 배열 둘에 나눠 담되, **커서 자리와 원소 수를 세어 두지 않고
 * 물을 때마다 훑는** 수열.
 *
 * 편집도 커서 이동도 계약대로다 — 넣고 지우기가 상수이고, 커서를 옮기는 값이 지나갈 거리에
 * 비례한다. 어기는 것은 **묻기만 하는 두 행**이다. `cursor()` 는 앞쪽을 하나씩 세고
 * `length()` 는 앞뒤를 하나씩 세므로 둘 다 담긴 수에 비례한다.
 *
 * **축1은 전부 통과한다** — 값이 하나도 틀리지 않는다. 걸리는 자리는 `cursor`·`length` 를
 * 묶은 시나리오 하나뿐이고, 나머지 다섯을 전부 통과한다.
 *
 * 이 fixture 가 없으면 그 시나리오가 아무것도 가르지 못한다(불변 사실 57). 정본은 두 값을
 * 자리 번호에서 바로 읽으므로 상수이고, 세는 구현과 읽는 구현의 차이는 **이 시나리오에서만**
 * 드러난다.
 */

export class RecountingEditableSequence<T> {
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
    // 지나갈 거리만큼만 옮긴다. 이 행은 계약대로다.
    while (position < this.#before.length) {
      this.#after.push(this.#before.pop() as T);
      this.__cost += 1;
    }
    while (position > this.#before.length) {
      this.#before.push(this.#after.pop() as T);
      this.__cost += 1;
    }
    this.__cost += 1;
  }

  cursor(): number {
    // 앞쪽을 하나씩 센다. 세어 둔 값을 읽는 것과 값은 같고 비용이 다르다.
    let count = 0;
    for (const _ of this.#before) count += 1;
    this.__cost += count + 1;
    return count;
  }

  length(): number {
    let count = 0;
    for (const _ of this.#before) count += 1;
    for (const _ of this.#after) count += 1;
    this.__cost += count + 1;
    return count;
  }

  toArray(): T[] {
    const out = [...this.#before];
    for (let at = this.#after.length - 1; at >= 0; at--) {
      out.push(this.#after[at] as T);
    }
    this.__cost += out.length + 1;
    return out;
  }
}
