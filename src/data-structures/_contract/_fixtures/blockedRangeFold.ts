/**
 * 결함 fixture — 자리를 $\sqrt n$ 개씩 묶고 묶음마다 접은 값을 하나씩 드는 표.
 *
 * `range-query/segmentTree` 계약이 **상한을 `O(log n)` 으로 고르면서 배제한 계열**이다.
 * `O(sqrt n)` 으로 적었다면 이 구현이 계약을 지킨다 — 배제가 실제로 일어나는지를 축3에서
 * 보이는 것이 이 파일의 일이다.
 *
 * **답은 전부 옳다.** 머리 조각·통째 묶음·꼬리 조각을 왼쪽에서 오른쪽 순서로 접으므로
 * 교환적이지 않은 결합에서도 맞다. 갈리는 것은 비용뿐이고, **갱신과 질의가 함께** 묶음
 * 크기에 비례한다 — 갱신은 자리가 든 묶음을 다시 접어야 하고 질의는 통째 묶음을 훑는다.
 *
 * `range-query/fenwickTree` 의 `blockedPrefixSums` 와 같은 계열이지만 다른 파일이다 —
 * 저쪽은 앞구간만 답하고 이쪽은 임의 구간을 답하며 결합을 주입받는다.
 *
 * 세는 단위는 정본과 같다 — **칸·묶음 하나를 지나갈 때마다 1**, **주입된 결합 호출마다 1**
 * (§규약2 계측 단위).
 */

export class BlockedRangeFold {
  readonly #values: number[];
  readonly #blocks: number[];
  readonly #span: number;
  readonly #combine: (a: number, b: number) => number;
  readonly #identity: number;

  __cost = 0;

  constructor(
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
  ) {
    this.#values = [...values];
    this.#combine = combine;
    this.#identity = identity;
    this.#span = Math.max(1, Math.ceil(Math.sqrt(values.length)));
    this.#blocks = new Array<number>(
      Math.ceil(values.length / this.#span),
    ).fill(identity);
    for (let block = 0; block < this.#blocks.length; block++) {
      this.#refold(block);
    }
  }

  update(i: number, value: number): void {
    if (!Number.isInteger(i) || i < 0 || i >= this.#values.length) {
      throw new RangeError(
        `자리 번호는 [0, ${this.#values.length}) 안이어야 한다 — 받은 값은 ${i} 다`,
      );
    }
    this.__cost += 1;
    this.#values[i] = value;
    this.#refold(Math.floor(i / this.#span));
  }

  query(from: number, to: number): number {
    if (
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from < 0 ||
      to > this.#values.length ||
      from > to
    ) {
      throw new RangeError(
        `구간은 0 <= from <= to <= ${this.#values.length} 이어야 한다 — 받은 값은 [${from}, ${to}) 다`,
      );
    }

    let acc = this.#identity;
    let at = from;
    while (at < to) {
      const block = Math.floor(at / this.#span);
      const start = block * this.#span;
      if (at === start && at + this.#span <= to) {
        this.__cost += 2;
        acc = this.#combine(acc, this.#blocks[block] as number);
        at += this.#span;
        continue;
      }
      this.__cost += 2;
      acc = this.#combine(acc, this.#values[at] as number);
      at += 1;
    }
    return acc;
  }

  /** 묶음 하나를 왼쪽부터 다시 접는다. 자리 하나를 고쳐도 묶음 전체가 다시 접힌다. */
  #refold(block: number): void {
    const start = block * this.#span;
    const end = Math.min(start + this.#span, this.#values.length);
    let acc = this.#identity;
    for (let at = start; at < end; at++) {
      this.__cost += 2;
      acc = this.#combine(acc, this.#values[at] as number);
    }
    this.#blocks[block] = acc;
  }
}
