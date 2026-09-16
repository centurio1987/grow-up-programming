/**
 * 결함 fixture — `linear/bitArray` 계약을 **켜진 자리의 번호를 오름차순으로 늘어놓은 배열 + 이분 탐색**으로
 * 지키려는 구현.
 *
 * 답은 전부 옳다. `_fixtures/positionListBits.ts` 와 같이 켜진 수만큼만 담되 번호를 정렬해 든다. 그래서
 * `get` 은 이분 탐색이라 켜진 수의 로그에 비례하고, `set` · `clear` 는 찾은 자리 뒤의 번호를 한 칸씩 밀거나
 * 당기느라 켜진 수에 비례한다. 켜진 수는 n 까지 자라므로 세 행(`O(1)`)을 전부 **어긴다.**
 *
 * **그런데 축3이 잡는 것은 둘뿐이다.** `get` 의 로그 인수는 사다리의 해상도 아래라(불변 사실 53 · 62)
 * `get` 시나리오를 통과한다 — **통과하는 계약 위반**이고, 자기시험이 그 사실을 이름으로 적는다.
 *
 * 계측 단위는 정본과 같다 — 목록의 번호 하나를 지나갈 때마다 1(§규약2 계측 단위). 이분 탐색은 들여다본
 * 번호마다, 밀기 · 당기기는 옮긴 번호마다 센다.
 */

export class SortedPositionBits {
  readonly #size: number;
  /** 켜진 자리의 번호. 오름차순이다. */
  readonly #on: number[] = [];

  __cost = 0;

  constructor(n: number) {
    if (!Number.isInteger(n) || n < 0) throw new RangeError(`자리 수 ${n}`);
    this.#size = n;
    this.__cost += 1;
  }

  set(index: number): void {
    this.#check(index);
    const at = this.#lowerBound(index);
    if (this.#holdsAt(at, index)) return;
    // 뒤의 번호를 한 칸씩 민다. 여기가 결함이 사는 자리다.
    this.#on.push(index);
    for (let from = this.#on.length - 1; from > at; from--) {
      this.__cost += 1;
      this.#on[from] = this.#on[from - 1] as number;
    }
    this.__cost += 1;
    this.#on[at] = index;
  }

  clear(index: number): void {
    this.#check(index);
    const at = this.#lowerBound(index);
    if (!this.#holdsAt(at, index)) return;
    // 뒤의 번호를 한 칸씩 당긴다.
    for (let to = at; to < this.#on.length - 1; to++) {
      this.__cost += 1;
      this.#on[to] = this.#on[to + 1] as number;
    }
    this.__cost += 1;
    this.#on.pop();
  }

  get(index: number): boolean {
    this.#check(index);
    return this.#holdsAt(this.#lowerBound(index), index);
  }

  size(): number {
    this.__cost += 1;
    return this.#size;
  }

  #check(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.#size)
      throw new RangeError(`첨자 ${index}`);
  }

  /** `index` 이상인 첫 번호의 자리. 들여다본 번호마다 1 을 센다. */
  #lowerBound(index: number): number {
    let low = 0;
    let high = this.#on.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      this.__cost += 1;
      if ((this.#on[middle] as number) < index) low = middle + 1;
      else high = middle;
    }
    return low;
  }

  #holdsAt(at: number, index: number): boolean {
    this.__cost += 1;
    return this.#on[at] === index;
  }
}
