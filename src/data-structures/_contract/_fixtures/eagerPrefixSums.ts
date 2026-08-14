/**
 * 결함 fixture — 앞구간 합을 미리 다 적어 두는 표.
 *
 * `range-query/fenwickTree` 계약의 반례 넷 중 둘째이고 `scanningRangeSums` 의 반대쪽이다.
 * 배열 하나에 *"앞의 k 개의 합"* 을 그대로 적어 두므로 **두 질의가 상수**이고, 대신 자리
 * 하나를 고치면 그 뒤의 앞구간 합이 전부 달라져 **갱신이 뒤 자리 수에 비례한다.**
 *
 * 답은 전부 옳다 — 축1·축2를 통과한다. 걸리는 자리는 `update` 두 시나리오이고 두 질의는
 * 통과한다(상수라서 통과하는 것이지 계약을 어기지 않아서가 아니다 — 계급 아래도 통과하는
 * 구간이 있다는 것은 §규약2 「축3은 상한이 아니라 성장 계급을 판정한다」에 적혀 있다).
 *
 * `mirroredPrefixSums` 와 짝이다. 그쪽은 같은 설계를 **뒤에서부터** 접어 두었고, 그래서
 * 이 파일이 최악을 맞는 자리(앞자리 갱신)에서 통과한다.
 *
 * 세는 단위는 정본과 같다 — **칸 하나를 지나갈 때마다 1**(§규약2 계측 단위).
 */

export class EagerPrefixSums {
  /** `#sums[k]` 는 앞의 `k` 개 자리의 합. 길이가 `n + 1` 이고 `#sums[0]` 은 늘 `0` 이다. */
  readonly #sums: number[];

  __cost = 0;

  constructor(n: number) {
    this.#sums = new Array<number>(n + 1).fill(0);
  }

  update(i: number, delta: number): void {
    const size = this.#sums.length - 1;
    this.#bounds(i, 0, size - 1);
    // 자리 `i` 를 포함하는 앞구간은 길이 `i + 1` 부터다. 그 뒤가 전부 달라진다.
    for (let at = i + 1; at <= size; at++) {
      this.__cost += 1;
      this.#sums[at] = (this.#sums[at] as number) + delta;
    }
  }

  prefixSum(i: number): number {
    this.#bounds(i, 0, this.#sums.length - 1);
    this.__cost += 1;
    return this.#sums[i] as number;
  }

  rangeSum(from: number, to: number): number {
    this.#bounds(from, 0, to);
    this.#bounds(to, from, this.#sums.length - 1);
    this.__cost += 2;
    return (this.#sums[to] as number) - (this.#sums[from] as number);
  }

  #bounds(value: number, low: number, high: number): void {
    if (!Number.isInteger(value) || value < low || value > high) {
      throw new RangeError(
        `[${low}, ${high}] 안이어야 한다 — 받은 값은 ${value} 다`,
      );
    }
  }
}
