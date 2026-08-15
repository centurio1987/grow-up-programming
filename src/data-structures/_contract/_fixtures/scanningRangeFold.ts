/**
 * 결함 fixture — 값을 그대로 적어 두고 물을 때마다 자리를 훑는 표.
 *
 * `range-query/segmentTree` 계약이 「자명한 구현으로 상한이 달성되지 않는다」의 반례로 든
 * 셋 중 첫째다. 언어가 내주는 배열 하나로 지을 수 있고, **답은 전부 옳다** — 자리를 왼쪽
 * 에서 오른쪽으로 접으므로 교환적이지 않은 결합에서도 맞다. 갈리는 것은 비용뿐이다.
 *
 * 갱신은 상수다. 자리 하나를 덮어쓰고 끝이므로 `update` 시나리오를 **통과한다.** 대신
 * 질의가 구간 폭에 비례한다. 계약의 필요충분조건이 *"갱신을 상수로 두고 질의를 선형으로
 * 두면 값 배열"* 이라고 적은 것의 실물이 이 파일이다.
 *
 * `range-query/fenwickTree` 의 `scanningRangeSums` 와 같은 계열이지만 **다른 파일이다** —
 * 저쪽은 덧셈에 고정돼 있고 이쪽은 결합을 주입받는다. fixture 를 공유하면 남의 계약
 * 자기시험 기대값이 말없이 바뀐다(`docs/ORD-006-wbs.md` §4).
 *
 * 세는 단위는 정본과 같다 — **칸 하나를 지나갈 때마다 1**, **주입된 결합 호출마다 1**
 * (§규약2 계측 단위).
 */

export class ScanningRangeFold {
  readonly #values: number[];
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
  }

  update(i: number, value: number): void {
    if (!Number.isInteger(i) || i < 0 || i >= this.#values.length) {
      throw new RangeError(
        `자리 번호는 [0, ${this.#values.length}) 안이어야 한다 — 받은 값은 ${i} 다`,
      );
    }
    this.__cost += 1;
    this.#values[i] = value;
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
    for (let at = from; at < to; at++) {
      this.__cost += 2;
      acc = this.#combine(acc, this.#values[at] as number);
    }
    return acc;
  }
}
