/**
 * 결함 fixture — 덮는 마디를 **만나는 순서대로** 접는 구현.
 *
 * `range-query/segmentTree` 정본의 `query` 에서 통 둘(`left`·`right`)을 하나로 합친 것이
 * 전부다. 나머지는 한 글자도 다르지 않다 — 정본의 변이가 걸리는지 보는 자리이고
 * (불변 사실 72), **걸리는 축이 축1 하나다.**
 *
 * 아래에서 위로 오르면 덮는 마디가 왼쪽 끝에서 하나, 오른쪽 끝에서 하나씩 번갈아 나온다.
 * 그 순서는 자리 순서가 아니다. 통 하나에 만나는 대로 접으면
 *
 * - **교환적인 결합**(합·최솟값·최댓값·최대공약수)에서는 답이 같고,
 * - **교환적이지 않은 결합**에서는 갈린다.
 *
 * 계약이 자리의 순서를 고정하고 교환법칙을 요구하지 않으므로(헤더 「주입 정책」) 이 구현은
 * 계약을 어긴다. **스위트가 교환적이지 않은 결합으로 도는 이유가 이 fixture 다** — 최솟값
 * 하나로 돌았다면 이 결함이 어느 축에도 보이지 않는다.
 *
 * 축3은 정본과 **계측값이 한 자리도 다르지 않다.** 접는 횟수도 지나는 마디 수도 같고
 * 갈리는 것은 접는 차례뿐이기 때문이다.
 *
 * 세는 단위는 정본과 같다 — **마디 하나를 지나갈 때마다 1**, **주입된 결합 호출마다 1**
 * (§규약2 계측 단위).
 */

export class UnorderedRangeFold {
  readonly #size: number;
  readonly #width: number;
  readonly #combine: (a: number, b: number) => number;
  readonly #identity: number;
  readonly #tree: number[];

  __cost = 0;

  constructor(
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
  ) {
    this.#combine = combine;
    this.#identity = identity;
    this.#size = values.length;

    let width = 1;
    while (width < this.#size) width *= 2;
    this.#width = width;
    this.#tree = new Array<number>(2 * width).fill(identity);

    for (let i = 0; i < this.#size; i++) {
      this.__cost += 1;
      this.#tree[width + i] = values[i] as number;
    }
    for (let at = width - 1; at >= 1; at--) {
      this.__cost += 1;
      this.#tree[at] = this.#fold(
        this.#tree[2 * at] as number,
        this.#tree[2 * at + 1] as number,
      );
    }
  }

  update(i: number, value: number): void {
    if (!Number.isInteger(i) || i < 0 || i >= this.#size) {
      throw new RangeError(
        `자리 번호는 [0, ${this.#size}) 안이어야 한다 — 받은 값은 ${i} 다`,
      );
    }
    let at = this.#width + i;
    this.__cost += 1;
    this.#tree[at] = value;
    for (at >>= 1; at >= 1; at >>= 1) {
      this.__cost += 1;
      this.#tree[at] = this.#fold(
        this.#tree[2 * at] as number,
        this.#tree[2 * at + 1] as number,
      );
    }
  }

  query(from: number, to: number): number {
    if (
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from < 0 ||
      to > this.#size ||
      from > to
    ) {
      throw new RangeError(
        `구간은 0 <= from <= to <= ${this.#size} 이어야 한다 — 받은 값은 [${from}, ${to}) 다`,
      );
    }

    // 정본과 갈리는 유일한 자리. 통이 하나뿐이라 오른쪽 끝에서 뗀 마디가 왼쪽 끝의 뒤에
    // 남은 마디보다 먼저 접힌다.
    let acc = this.#identity;
    let l = this.#width + from;
    let r = this.#width + to;
    while (l < r) {
      this.__cost += 2;
      if ((l & 1) === 1) {
        acc = this.#fold(acc, this.#tree[l] as number);
        l += 1;
      }
      if ((r & 1) === 1) {
        r -= 1;
        acc = this.#fold(acc, this.#tree[r] as number);
      }
      l >>= 1;
      r >>= 1;
    }
    return this.#fold(acc, this.#identity);
  }

  #fold(a: number, b: number): number {
    this.__cost += 1;
    return this.#combine(a, b);
  }
}
