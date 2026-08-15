/**
 * 결함 fixture — 구간의 답을 **두 앞구간의 차**로 내는 구현.
 *
 * `range-query/fenwickTree` 헤더가 *"이 계약과 `range-query/segmentTree` 를 가르는 반례"*
 * 로 적은 구현을 **반대쪽에서** 세운 것이다(불변 사실 162). 저쪽 계약은 이 구현을 허용하고
 * 이쪽 계약은 허용하지 않는다 — 그 비대칭이 두 계약이 다르다는 것의 증거이고, 이 파일은
 * 그 증거를 실행 가능한 형태로 고정한다.
 *
 * **주입받은 결합을 쓰지 않는다.** 생성자에서 받기는 하지만 접는 일은 덧셈으로 하고, 구간은
 * 앞구간 둘의 뺄셈으로 낸다. 그래서 **주입된 결합이 `(a, b) => a + b` 이고 항등원이 `0` 일
 * 때만 답이 맞는다.** 계약은 임의의 결합을 요구하므로 이 구현은 계약을 어기고, 어기는 자리가
 * 비용이 아니라 **답**이다.
 *
 * 걸리는 축이 **축1 하나**다. 축3은 갱신도 질의도 자리 수의 로그 안이라 네 시나리오를 전부
 * 통과한다 — `linear/circularBuffer` 의 `unboundedRingBuffer`(불변 사실 182) 다음으로 나온
 * 「축1이 잡는 fixture」이고, 이쪽은 축3이 정본과 **계급까지 같다.**
 *
 * 세는 단위는 정본과 같다 — **칸 하나를 지나갈 때마다 1**(§규약2 계측 단위). 주입 호출을
 * 따로 세는 항이 없는 것은 이 구현이 주입된 결합을 한 번도 부르지 않기 때문이다.
 */

export class PrefixDifferenceRangeFold {
  readonly #size: number;
  /** 자리의 현재 값. 갱신이 「바꾼다」이므로 차이를 내려면 옛 값을 들고 있어야 한다. */
  readonly #values: number[];
  /** 앞구간 합을 겹쳐 접어 둔 칸. `1` 부터 `#size` 까지를 쓴다. */
  readonly #folded: number[];

  __cost = 0;

  constructor(
    values: number[],
    _combine: (a: number, b: number) => number,
    _identity: number,
  ) {
    this.#size = values.length;
    this.#values = [...values];
    this.#folded = new Array<number>(values.length + 1).fill(0);
    for (let i = 0; i < values.length; i++) {
      this.#add(i, values[i] as number);
    }
  }

  update(i: number, value: number): void {
    if (!Number.isInteger(i) || i < 0 || i >= this.#size) {
      throw new RangeError(
        `자리 번호는 [0, ${this.#size}) 안이어야 한다 — 받은 값은 ${i} 다`,
      );
    }
    const delta = value - (this.#values[i] as number);
    this.#values[i] = value;
    this.#add(i, delta);
  }

  query(from: number, to: number): number {
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
    return this.#prefix(to) - this.#prefix(from);
  }

  #add(i: number, delta: number): void {
    for (let at = i + 1; at <= this.#size; at += at & -at) {
      this.__cost += 1;
      this.#folded[at] = (this.#folded[at] as number) + delta;
    }
  }

  #prefix(i: number): number {
    let sum = 0;
    for (let at = i; at > 0; at -= at & -at) {
      this.__cost += 1;
      sum += this.#folded[at] as number;
    }
    return sum;
  }
}
