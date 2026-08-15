/**
 * 결함 fixture — **끝까지 닿는 구간만** 마디를 타고 답하고 나머지는 자리를 훑는 구현.
 *
 * 이 파일의 일은 결함 하나를 더 보이는 것이 아니라 **시나리오 하나가 왜 필요한지**를
 * 보이는 것이다. 불변 사실 160 이 *"`worst` 계약에서는 인자 공간을 다 지나는 시나리오가
 * 어느 구현의 최악 인자도 담는다"* 를 냈고, 적용 조건으로 **인자 공간이 유한하고 훑을 수
 * 있을 것**을 달았다. `range-query/segmentTree` 의 `query` 는 경계가 둘이라 인자 공간이
 * 쌍의 공간이고, 한 줄로 훑는 시나리오는 그 공간의 **선 하나**만 지난다.
 *
 * 이 구현은 그 선 위에서만 빠르다. `query(i, n)` 을 훑는 시나리오를 연산당 상수로
 * **통과하고**, 두 경계가 다 어긋난 구간을 묻는 시나리오에서 자리 수에 비례한다.
 * 갱신은 정본 그대로라 `update` 시나리오도 통과한다.
 *
 * **답은 전부 옳다.** 두 갈래 모두 자리를 왼쪽에서 오른쪽으로 접는다. 갈리는 것은 비용뿐
 * 이고, 그 비용이 **인자에 따라 갈린다**는 것이 이 fixture 의 내용이다.
 *
 * 세는 단위는 정본과 같다 — **마디·칸 하나를 지나갈 때마다 1**, **주입된 결합 호출마다 1**
 * (§규약2 계측 단위).
 */

export class SuffixOnlyRangeFold {
  readonly #size: number;
  readonly #width: number;
  readonly #values: number[];
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
    this.#values = [...values];

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
    this.#values[i] = value;
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

    if (to === this.#size) return this.#byTree(from, to);

    let acc = this.#identity;
    for (let at = from; at < to; at++) {
      this.__cost += 2;
      acc = this.#combine(acc, this.#values[at] as number);
    }
    return acc;
  }

  /** 정본과 같은 걸음. 오른쪽 끝이 자리 수와 같을 때만 쓴다. */
  #byTree(from: number, to: number): number {
    let left = this.#identity;
    let right = this.#identity;
    let l = this.#width + from;
    let r = this.#width + to;
    while (l < r) {
      this.__cost += 2;
      if ((l & 1) === 1) {
        left = this.#fold(left, this.#tree[l] as number);
        l += 1;
      }
      if ((r & 1) === 1) {
        r -= 1;
        right = this.#fold(this.#tree[r] as number, right);
      }
      l >>= 1;
      r >>= 1;
    }
    return this.#fold(left, right);
  }

  #fold(a: number, b: number): number {
    this.__cost += 1;
    return this.#combine(a, b);
  }
}
