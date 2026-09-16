/**
 * 결함 fixture — `range-query/segmentTreeLazy` 정본에서 **차례 하나를 뒤집은** 변이 둘.
 *
 * 대상 계약: `range-query/segmentTreeLazy`.
 *
 * 정본(`../../range-query/segmentTreeLazy/_reference/segmentTreeLazy.ts`)의 `#region guide:core` 를 그대로 옮기고
 * 한 줄씩만 바꿨다(불변 사실 72 — 정본의 변이가 걸리는지 본다). **걸리는 축이 축1 하나다** — 계측값은 정본과
 * 한 자리도 다르지 않다.
 *
 * | `policy` | 바꾼 줄 | 교환적인 대수에서 | 계약에 대해 |
 * |---|---|---|---|
 * | `fold` | 질의가 덮는 마디를 만나는 대로 통 하나에 접는다 | 답이 같다 | **어긴다** — 계약이 자리 순서를 고정한다 |
 * | `compose` | 쌓인 갱신과 새 갱신을 `compose(있던 것, 새것)` 으로 합성한다 | 답이 같다 | **어긴다** — 계약이 나중 갱신을 바깥에 두는 합성 차례를 고정한다 |
 *
 * 스위트가 교환적이지 않은 결합과 교환적이지 않은 합성으로 도는 이유가 이 둘이다
 * (`range-query/segmentTreeLazy/segmentTreeLazy.contract.ts` 머리말).
 *
 * 세는 단위는 정본과 같다(§규약2 계측 단위).
 */

export type MisorderPolicy = "fold" | "compose";

export class MisorderedLazyRangeFold {
  readonly #policy: MisorderPolicy;

  /** 생성자가 고정한 자리 수. */
  readonly #size: number;
  /** 잎의 수. `#size` 이상인 가장 작은 2의 거듭제곱. */
  readonly #width: number;
  /** `#width` 의 밑 2 로그 — 뿌리에서 잎까지의 층 수. */
  readonly #levels: number;

  readonly #combine: (a: number, b: number) => number;
  readonly #identity: number;
  readonly #act: (update: number, value: number, count: number) => number;
  readonly #compose: (later: number, earlier: number) => number;

  /** 마디 `k` 가 덮는 자리들을 왼쪽부터 접은 값. 자식은 `2k`·`2k+1`, 잎은 `[#width, 2·#width)`. */
  readonly #folded: number[];
  /** 마디 `k` 가 덮는 실제 자리의 수. 채운 잎은 0 이다. */
  readonly #count: number[];
  /** 마디 `k` 에 쌓여 아직 자식에게 내려보내지 않은 갱신. 잎에는 쌓지 않는다. */
  readonly #pending: (number | undefined)[];

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
    act: (update: number, value: number, count: number) => number,
    compose: (later: number, earlier: number) => number,
    policy: MisorderPolicy,
  ) {
    this.#policy = policy;
    this.#combine = combine;
    this.#identity = identity;
    this.#act = act;
    this.#compose = compose;
    this.#size = values.length;

    let width = 1;
    let levels = 0;
    while (width < this.#size) {
      width *= 2;
      levels += 1;
    }
    this.#width = width;
    this.#levels = levels;
    this.#folded = new Array<number>(2 * width).fill(identity);
    this.#count = new Array<number>(2 * width).fill(0);
    this.#pending = new Array<number | undefined>(width).fill(undefined);

    for (let i = 0; i < this.#size; i++) {
      this.__cost += 1;
      this.#folded[width + i] = values[i] as number;
      this.#count[width + i] = 1;
    }
    for (let at = width - 1; at >= 1; at--) {
      this.__cost += 1;
      this.#count[at] =
        (this.#count[2 * at] as number) + (this.#count[2 * at + 1] as number);
      this.#pull(at);
    }
  }

  apply(from: number, to: number, update: number): void {
    this.#checkSpan(from, to);
    if (from === to) return;
    const l = this.#width + from;
    const r = this.#width + to;
    this.#pushPaths(l, r);

    let left = l;
    let right = r;
    while (left < right) {
      this.__cost += 2;
      if ((left & 1) === 1) this.#applyAt(left++, update);
      if ((right & 1) === 1) this.#applyAt(--right, update);
      left >>= 1;
      right >>= 1;
    }

    for (let level = 1; level <= this.#levels; level++) {
      if ((l >> level) << level !== l) this.#pull(l >> level);
      if ((r >> level) << level !== r) this.#pull((r - 1) >> level);
    }
  }

  query(from: number, to: number): number {
    this.#checkSpan(from, to);
    if (from === to) return this.#identity;
    let left = this.#width + from;
    let right = this.#width + to;
    this.#pushPaths(left, right);

    let leftFold = this.#identity;
    let rightFold = this.#identity;
    while (left < right) {
      this.__cost += 2;
      if ((left & 1) === 1) {
        leftFold = this.#fold(leftFold, this.#folded[left++] as number);
      }
      if ((right & 1) === 1) {
        // `fold` 은 만나는 대로 통 하나에 접는다 — 정본과 갈리는 첫째 줄.
        if (this.#policy === "fold") {
          leftFold = this.#fold(leftFold, this.#folded[--right] as number);
        } else {
          rightFold = this.#fold(this.#folded[--right] as number, rightFold);
        }
      }
      left >>= 1;
      right >>= 1;
    }
    return this.#fold(leftFold, rightFold);
  }

  #checkSpan(from: number, to: number): void {
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
  }

  /** 잎 `l`·`r` 에서 뿌리까지의 길 위 마디 중 구간이 일부만 걸치는 것에 쌓인 갱신을 위에서부터 내려보낸다. */
  #pushPaths(l: number, r: number): void {
    for (let level = this.#levels; level >= 1; level--) {
      if ((l >> level) << level !== l) this.#push(l >> level);
      if ((r >> level) << level !== r) this.#push((r - 1) >> level);
    }
  }

  #push(at: number): void {
    this.__cost += 1;
    const update = this.#pending[at];
    if (update === undefined) return;
    this.#applyAt(2 * at, update);
    this.#applyAt(2 * at + 1, update);
    this.#pending[at] = undefined;
  }

  /** 마디 하나에 갱신을 적용한다 — 접은 값에 바로, 아래로는 쌓아 둔다. */
  #applyAt(at: number, update: number): void {
    this.__cost += 1;
    this.#folded[at] = this.#call(() =>
      this.#act(update, this.#folded[at] as number, this.#count[at] as number),
    );
    if (at < this.#width) {
      const earlier = this.#pending[at];
      this.#pending[at] =
        earlier === undefined
          ? update
          : // `compose` 는 합성 차례를 뒤집는다 — 정본과 갈리는 둘째 줄.
            this.#policy === "compose"
            ? this.#call(() => this.#compose(earlier, update))
            : this.#call(() => this.#compose(update, earlier));
    }
  }

  /** 두 자식을 접어 마디의 값을 다시 정한다. */
  #pull(at: number): void {
    this.#folded[at] = this.#fold(
      this.#folded[2 * at] as number,
      this.#folded[2 * at + 1] as number,
    );
  }

  #fold(a: number, b: number): number {
    return this.#call(() => this.#combine(a, b));
  }

  /** 주입된 함수를 부르는 자리를 하나로 모아 계측이 새지 않게 한다. */
  #call(invoke: () => number): number {
    this.__cost += 1;
    return invoke();
  }
}
