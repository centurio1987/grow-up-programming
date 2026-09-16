/**
 * `range-query/segmentTreeLazy` 정본(규약2).
 *
 * 계약은 `../segmentTreeLazy.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다 — 자리들을 위에서부터 반씩 갈라 되돌이로
 * 내려가는 구현도 두 행을 전부 지킨다. 이 파일이 정본인 것은 계약이 고른 계급을 대표하기 때문이지
 * 계약이 이 기법을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — **마디 하나를 지나갈 때마다 1**,
 * 그리고 **주입된 함수(`combine`·`act`·`compose`)를 한 번 부를 때마다 1**. 읽기와 쓰기를 따로 세지
 * 않고 배열을 잡는 런타임 비용도 세지 않는다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **자리를 잎에 놓고, 마디마다 두 값을 든다.** ① 그 아래 자리들을 왼쪽부터 접은 값 ② **아직 아래로
 * 내려보내지 않은 갱신 하나**(없으면 비어 있다). 구간 갱신은 그 구간을 덮는 마디 몇 개의 ①에 갱신을 바로
 * 적용하고 ②에 합성해 두는 것으로 끝나고, 아래 자리들은 그 마디를 **지나갈 일이 생길 때** 받는다.
 * 덮는 마디 수와 지나가는 마디 수가 둘 다 자리 수의 로그를 넘지 않는다.
 *
 * **이 구현이 주입자의 세 의무를 쓰는 자리가 셋이다**(헤더 「주입 정책」).
 *
 * - **결합법칙** — 덮는 마디들을 묶어 접는다. 왼쪽 통과 오른쪽 통을 따로 모아 자리 순서를 지키는 것은
 *   `range-query/segmentTree` 정본과 같다(교환법칙은 요구하지 않는다).
 * - **분배** — 마디의 ①에 갱신을 적용할 때 `act(update, 접은 값, 그 마디가 덮는 자리 수)` 한 번으로 끝낸다.
 *   자리마다 적용한 뒤 접은 값과 같다는 것이 분배 법칙이다.
 * - **합성** — 이미 내려보내지 않은 갱신이 있는 마디에 새 갱신이 오면 `compose(새것, 있던 것)` 하나로 줄인다.
 *
 * **잎 수를 2의 거듭제곱으로 채운다.** 채운 잎은 항등원이고 덮는 자리 수가 0 이다 — 그 잎에 갱신이 내려와도
 * `act(update, identity, 0) === identity` 라는 주입자의 의무 덕에 답이 안 바뀐다.
 *
 * **내려보내기의 차례가 이 구현의 까다로운 줄이다.** 갱신이든 질의든 구간의 양 끝에서 뿌리까지 오르는
 * 길 위의 마디들은, 그 마디의 일부만 건드리기 전에 **위에서부터** 쌓인 갱신을 두 자식에게 내려보낸다.
 * 거꾸로 하면 먼저 온 갱신이 나중 갱신보다 늦게 자식에 닿아 합성 차례가 뒤집힌다. 갱신 뒤에는 그 길의
 * 마디들을 **아래에서부터** 다시 접는다.
 */

// #region guide:core/class
export class SegmentTreeLazy {
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
  ) {
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
// #endregion
