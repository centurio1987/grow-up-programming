/**
 * 결함 fixture — 자리를 $\sqrt n$ 크기의 묶음으로 나눈 표.
 *
 * 앞의 셋(`scanningRangeSums`·`eagerPrefixSums`·`mirroredPrefixSums`)과 성격이 다르다.
 * 저 셋은 **자명한 구현**이고 이것은 설계다 — 묶음마다 합을 하나씩 들고 있어 갱신도
 * 질의도 자리 수에 비례하지 않는다. 그런데도 걸린다.
 *
 * **걸리는 이유가 이 fixture 의 요점이다.** 계약이 상한을 `O(sqrt n)` 으로 적었다면 이
 * 구현이 정본이 될 수 있었고, `O(log n)` 으로 적었기 때문에 두 질의에서 성장률이 2 쪽으로
 * 간다. 계약 헤더의 「상한을 `O(log n)` 으로 적은 것은 고른 것이다」 문단이 배제한 계열이
 * 바로 이것이고, 그 배제가 축3에 실제로 보이는지를 이 파일이 잰다.
 *
 * 갱신은 상수라 `update` 두 시나리오를 **통과한다** — 자리 하나와 그 묶음의 합 하나만
 * 고치면 끝나기 때문이다. 걸리는 것은 `prefixSum`·`rangeSum` 이다.
 *
 * 세는 단위는 정본과 같다 — **칸 하나를 지나갈 때마다 1**(§규약2 계측 단위). 묶음 합도
 * 칸 하나로 센다.
 */

export class BlockedPrefixSums {
  readonly #size: number;
  /** 묶음 하나에 든 자리 수. */
  readonly #span: number;
  readonly #values: number[];
  /** `#blocks[b]` 는 `b` 번째 묶음에 든 자리들의 합. */
  readonly #blocks: number[];

  __cost = 0;

  constructor(n: number) {
    this.#size = n;
    this.#span = Math.max(1, Math.ceil(Math.sqrt(n)));
    this.#values = new Array<number>(n).fill(0);
    this.#blocks = new Array<number>(Math.ceil(n / this.#span)).fill(0);
  }

  update(i: number, delta: number): void {
    this.#bounds(i, 0, this.#size - 1);
    this.__cost += 2;
    this.#values[i] = (this.#values[i] as number) + delta;
    const block = Math.floor(i / this.#span);
    this.#blocks[block] = (this.#blocks[block] as number) + delta;
  }

  prefixSum(i: number): number {
    this.#bounds(i, 0, this.#size);
    return this.#prefix(i);
  }

  rangeSum(from: number, to: number): number {
    this.#bounds(from, 0, to);
    this.#bounds(to, from, this.#size);
    return this.#prefix(to) - this.#prefix(from);
  }

  /** 완성된 묶음을 통째로 세고 남은 자리만 하나씩 밟는다. 둘 다 $\sqrt n$ 을 넘지 않는다. */
  #prefix(i: number): number {
    const whole = Math.floor(i / this.#span);
    let sum = 0;
    for (let block = 0; block < whole; block++) {
      this.__cost += 1;
      sum += this.#blocks[block] as number;
    }
    for (let at = whole * this.#span; at < i; at++) {
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
