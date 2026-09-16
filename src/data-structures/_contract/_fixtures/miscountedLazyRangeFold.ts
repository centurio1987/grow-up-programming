/**
 * 결함 fixture — `range-query/segmentTreeLazy` 정본에서 **`act` 에 넘기는 자리 수 하나를 바꾼** 변이 둘.
 *
 * 대상 계약: `range-query/segmentTreeLazy`.
 *
 * 정본(`../../range-query/segmentTreeLazy/_reference/segmentTreeLazy.ts`)의 `#region guide:core` 를 그대로 옮기고
 * 자리 수를 정하는 한 곳만 바꿨다(불변 사실 72 — 정본의 변이가 걸리는지 본다). 주입된 함수를 부르는 횟수도 지나는 마디
 * 수도 정본과 같아 **걸리는 축이 축1 하나다.**
 *
 * | `policy` | 바꾼 줄 | 계약에 대해 |
 * |---|---|---|
 * | `one` | 마디에 갱신을 적용할 때 자리 수를 늘 `1` 로 넘긴다 | **어긴다** — 여러 자리를 접은 값에 한 번 적용한 답이 자리마다 적용한 답과 갈린다 |
 * | `parent` | 쌓인 갱신을 두 자식에게 내려보낼 때 **부모 마디의 자리 수**를 넘긴다 | **어긴다** — 내려보낸 뒤 자식을 읽는 구간의 답이 갈린다 |
 *
 * 첫째 벌의 대수(`coverAct` — 자리 수가 0 인지만 본다)에서는 둘 다 답이 정본과 같다: 넘기는 수가 0 이 아닌 자리 수를 0 이
 * 아닌 다른 수로 바꿀 뿐이다. 자리 수가 값을 바꾸는 둘째 벌(`segmentTreeLazyCountedContract` — 합 · 더하기)에서 둘 다
 * 경계 케이스로 걸린다. 수치는 하네스 자기시험(`../runContract.segmentTreeLazy.test.ts`)이 고정한다.
 *
 * **셋째 변이는 결함이 아니어서 두지 않았다.** 자리 수를 2의 거듭제곱으로 채울 때 채운 잎도 자리 하나로 세는 사본은
 * 두 벌을 전부 통과하고, 자리 수 3 · 5 · 6 · 7 · 9 · 11 · 13 · 100 에서 무작위 갱신·질의 2만 번씩을 돌려도 정본과 답이
 * 한 번도 갈리지 않았다 — 채운 잎을 담은 마디는 `[0, n]` 안의 어느 구간에도 통째로 들지 않아 답에 닿지 않는다(불변
 * 사실 79 의 「그 변화를 볼 연산이 계약에 있는가」).
 *
 * 세는 단위는 정본과 같다(§규약2 계측 단위).
 */

export type MiscountPolicy = "one" | "parent";

export class MiscountedLazyRangeFold {
  readonly #policy: MiscountPolicy;

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
    policy: MiscountPolicy,
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
        rightFold = this.#fold(this.#folded[--right] as number, rightFold);
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
    // `parent` — 두 자식에게 자기 자리 수가 아니라 부모 마디의 자리 수를 넘긴다.
    const count = this.#policy === "parent" ? this.#count[at] : undefined;
    this.#applyAt(2 * at, update, count);
    this.#applyAt(2 * at + 1, update, count);
    this.#pending[at] = undefined;
  }

  /** 마디 하나에 갱신을 적용한다 — 접은 값에 바로, 아래로는 쌓아 둔다. */
  #applyAt(at: number, update: number, count?: number): void {
    this.__cost += 1;
    this.#folded[at] = this.#call(() =>
      this.#act(
        update,
        this.#folded[at] as number,
        // `one` — 마디가 덮는 자리 수 대신 늘 1 을 넘긴다.
        this.#policy === "one" ? 1 : (count ?? (this.#count[at] as number)),
      ),
    );
    if (at < this.#width) {
      const earlier = this.#pending[at];
      this.#pending[at] =
        earlier === undefined
          ? update
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
