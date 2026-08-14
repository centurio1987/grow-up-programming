/**
 * 결함 fixture — 뒤에서부터 접어 둔 표. `eagerPrefixSums` 를 좌우로 뒤집은 것이다.
 *
 * `#tails[k]` 가 *"자리 `k` 부터 끝까지의 합"* 이므로 앞구간은 `#tails[0] - #tails[i]` 로
 * 상수에 나오고, 구간도 `#tails[from] - #tails[to]` 로 상수다. 대신 자리 하나를 고치면
 * **그 앞의 꼬리합이 전부 달라져** 갱신이 앞자리 수에 비례한다.
 *
 * **이 fixture 를 둔 이유는 적대성이 (계약, 구현) 쌍에 대해 정의된다는 것을 재기 위해서다**
 * (불변 사실 57). `update` 의 적대적 시나리오(앞자리 `0` 만 되풀이해 고치기)는
 * `eagerPrefixSums` 에는 최악이고 이 파일에는 **최선**이다 — 자리 `0` 앞에는 고칠 꼬리합이
 * 하나뿐이다. 그래서 이 fixture 는 **적대적 시나리오를 통과하고 비적대 시나리오에서
 * 걸린다**(불변 사실 85 와 같은 모양).
 *
 * 세는 단위는 정본과 같다 — **칸 하나를 지나갈 때마다 1**(§규약2 계측 단위).
 */

export class MirroredPrefixSums {
  /** `#tails[k]` 는 자리 `k` 이상 끝까지의 합. 길이가 `n + 1` 이고 `#tails[n]` 은 늘 `0` 이다. */
  readonly #tails: number[];

  __cost = 0;

  constructor(n: number) {
    this.#tails = new Array<number>(n + 1).fill(0);
  }

  update(i: number, delta: number): void {
    const size = this.#tails.length - 1;
    this.#bounds(i, 0, size - 1);
    // 자리 `i` 를 포함하는 꼬리는 `0` 부터 `i` 까지다.
    for (let at = 0; at <= i; at++) {
      this.__cost += 1;
      this.#tails[at] = (this.#tails[at] as number) + delta;
    }
  }

  prefixSum(i: number): number {
    this.#bounds(i, 0, this.#tails.length - 1);
    this.__cost += 2;
    return (this.#tails[0] as number) - (this.#tails[i] as number);
  }

  rangeSum(from: number, to: number): number {
    this.#bounds(from, 0, to);
    this.#bounds(to, from, this.#tails.length - 1);
    this.__cost += 2;
    return (this.#tails[from] as number) - (this.#tails[to] as number);
  }

  #bounds(value: number, low: number, high: number): void {
    if (!Number.isInteger(value) || value < low || value > high) {
      throw new RangeError(
        `[${low}, ${high}] 안이어야 한다 — 받은 값은 ${value} 다`,
      );
    }
  }
}
