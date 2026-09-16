/**
 * 결함 fixture — `linear/bitArray` 계약을 **켜진 자리의 번호를 순서 없이 늘어놓은 배열**로 지키려는 구현.
 *
 * 답은 전부 옳다. 켜진 자리가 드물면 담는 것도 드물다 — 자리 수가 아니라 켜진 수만큼만 담는 표현이다.
 * 무너지는 자리는 세 행 전부다. `get` 은 번호를 목록에서 찾느라 켜진 수에 비례하고, `set` 은 이미 켜져
 * 있는지 보느라, `clear` 는 지울 번호를 찾느라 같은 비례를 치른다. 켜진 수는 n 까지 자라므로 세 행
 * (`O(1)`)을 **어긴다.** 지울 때는 찾은 자리에 마지막 번호를 옮겨 채워 옮기는 비용을 상수로 둔다 —
 * 찾는 비용만 남긴 것이다.
 *
 * 계측 단위는 정본과 같다 — 목록의 번호 하나를 지나갈 때마다 1(§규약2 계측 단위).
 */

export class PositionListBits {
  readonly #size: number;
  /** 켜진 자리의 번호. 순서가 없다. */
  readonly #on: number[] = [];

  __cost = 0;

  constructor(n: number) {
    if (!Number.isInteger(n) || n < 0) throw new RangeError(`자리 수 ${n}`);
    this.#size = n;
    this.__cost += 1;
  }

  set(index: number): void {
    this.#check(index);
    if (this.#find(index) >= 0) return;
    this.__cost += 1;
    this.#on.push(index);
  }

  clear(index: number): void {
    this.#check(index);
    const at = this.#find(index);
    if (at < 0) return;
    this.__cost += 1;
    const last = this.#on.pop() as number;
    if (at < this.#on.length) this.#on[at] = last;
  }

  get(index: number): boolean {
    this.#check(index);
    return this.#find(index) >= 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#size;
  }

  #check(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.#size)
      throw new RangeError(`첨자 ${index}`);
  }

  /** 목록을 앞에서부터 훑는다. 여기가 결함이 사는 자리다. */
  #find(index: number): number {
    for (let at = 0; at < this.#on.length; at++) {
      this.__cost += 1;
      if (this.#on[at] === index) return at;
    }
    return -1;
  }
}
