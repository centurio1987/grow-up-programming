/**
 * 결함 fixture — 값을 그대로 적어 두고 물을 때마다 훑는 표.
 *
 * `range-query/fenwickTree` 계약이 「자명한 구현으로 상한이 달성되지 않는다」의 반례로 든
 * 넷 중 첫째다. 언어가 내주는 배열 하나로 지을 수 있고, **답은 전부 옳다** — 축1과 축2를
 * 통과한다. 갈리는 것은 비용뿐이다.
 *
 * 갱신은 상수다. 자리 하나에 더하고 끝이므로 `update` 시나리오 둘을 **통과한다.** 대신
 * 두 질의가 앞자리 수에 비례한다. 계약의 필요충분조건이 *"갱신을 상수로 두고 질의를
 * 선형으로 두면 값 배열"* 이라고 적은 것의 실물이 이 파일이다.
 *
 * 반대쪽 반은 `eagerPrefixSums` 다.
 *
 * 세는 단위는 정본과 같다 — **칸 하나를 지나갈 때마다 1**(§규약2 계측 단위).
 */

export class ScanningRangeSums {
  readonly #values: number[];

  __cost = 0;

  constructor(n: number) {
    this.#values = new Array<number>(n).fill(0);
  }

  update(i: number, delta: number): void {
    this.#bounds(i, 0, this.#values.length - 1);
    this.__cost += 1;
    this.#values[i] = (this.#values[i] as number) + delta;
  }

  prefixSum(i: number): number {
    this.#bounds(i, 0, this.#values.length);
    return this.#sumOver(0, i);
  }

  rangeSum(from: number, to: number): number {
    this.#bounds(from, 0, to);
    this.#bounds(to, from, this.#values.length);
    return this.#sumOver(from, to);
  }

  /** 자리를 하나씩 밟아 더한다. 밟은 칸마다 1 을 센다. */
  #sumOver(from: number, to: number): number {
    let sum = 0;
    for (let at = from; at < to; at++) {
      this.__cost += 1;
      sum += this.#values[at] as number;
    }
    return sum;
  }

  #bounds(value: number, low: number, high: number): void {
    if (!Number.isInteger(value) || value < low || value > high) {
      throw new RangeError(
        `[${low}, ${high}] 안이어야 한다 — 받은 값은 ${value} 다`,
      );
    }
  }
}
