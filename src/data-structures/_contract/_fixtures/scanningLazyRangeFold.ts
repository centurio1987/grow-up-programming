/**
 * 결함 fixture — 값을 배열에 그대로 적어 두고, **구간 갱신은 덮는 자리를 하나씩 고치고 질의는 구간을
 * 왼쪽부터 훑어 접는** 구현.
 *
 * 대상 계약: `range-query/segmentTreeLazy`.
 *
 * **자명한 구현이다**(헤더 「검증 등급」). 답은 전부 옳다 — 축1의 참조 모델과 같은 모양이다. 갱신도 질의도
 * 구간 폭에 비례하므로 두 시나리오에서 다 걸린다.
 *
 * 세는 단위는 정본과 같다 — **자리 하나를 지나갈 때마다 1**, **주입된 함수 호출마다 1**(§규약2 계측 단위).
 * 갱신은 자리마다 `act(update, 값, 1)` 을 부른다.
 */

export class ScanningLazyRangeFold {
  readonly #values: number[];
  readonly #combine: (a: number, b: number) => number;
  readonly #identity: number;
  readonly #act: (update: number, value: number, count: number) => number;

  __cost = 0;

  constructor(
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
    act: (update: number, value: number, count: number) => number,
    _compose: (later: number, earlier: number) => number,
  ) {
    this.#values = [...values];
    this.#combine = combine;
    this.#identity = identity;
    this.#act = act;
    this.__cost += values.length;
  }

  apply(from: number, to: number, update: number): void {
    this.#checkSpan(from, to);
    for (let at = from; at < to; at++) {
      this.__cost += 2;
      this.#values[at] = this.#act(update, this.#values[at] as number, 1);
    }
  }

  query(from: number, to: number): number {
    this.#checkSpan(from, to);
    let acc = this.#identity;
    for (let at = from; at < to; at++) {
      this.__cost += 2;
      acc = this.#combine(acc, this.#values[at] as number);
    }
    return acc;
  }

  #checkSpan(from: number, to: number): void {
    if (
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from < 0 ||
      to > this.#values.length ||
      from > to
    ) {
      throw new RangeError(`구간 [${from}, ${to})`);
    }
  }
}
