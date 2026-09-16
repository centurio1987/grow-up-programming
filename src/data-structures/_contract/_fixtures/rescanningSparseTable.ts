/**
 * 결함 fixture — `range-query/sparseTable` 정본과 같은 표를 짓되 **칸마다 그 구간을 처음부터 훑어** 접는 구현.
 *
 * 대상 계약: `range-query/sparseTable`.
 *
 * 정본(`../../range-query/sparseTable/_reference/sparseTable.ts`)은 층 `k` 의 칸을 한 층 아래 두 칸의 결합 한 번으로 얻는다.
 * 이 구현은 같은 칸을 자리 `2^k` 개를 왼쪽부터 접어 얻는다 — 칸의 값과 질의가 정본과 한 글자도 다르지 않아 **답은 전부 옳고**
 * 질의는 상수다. 짓는 일이 칸마다 그 칸의 폭이라 모두 더하면 자리 수의 제곱에 비례한다.
 *
 * 걸리는 것은 구성 시나리오 하나다 — 헤더 「검증 등급」의 「모든 구간을 미리 접어 두면 구성이 제곱」과 같은 계급을 표 크기
 * `n log n` 칸으로 낸다.
 *
 * 세는 단위는 정본과 같다(§규약2 계측 단위).
 */

export class RescanningSparseTable {
  readonly #size: number;
  readonly #combine: (a: number, b: number) => number;
  readonly #identity: number;
  readonly #levels: number[][] = [];

  __cost = 0;

  constructor(
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
  ) {
    this.#combine = combine;
    this.#identity = identity;
    this.#size = values.length;
    const base = new Array<number>(this.#size);
    for (let i = 0; i < this.#size; i++) {
      this.__cost += 1;
      base[i] = values[i] as number;
    }
    this.#levels.push(base);
    for (let k = 1; 1 << k <= this.#size; k++) {
      const span = 1 << k;
      const row = new Array<number>(this.#size - span + 1);
      for (let i = 0; i < row.length; i++) {
        let acc = this.#identity;
        for (let at = i; at < i + span; at++) {
          this.__cost += 1;
          acc = this.#fold(acc, base[at] as number);
        }
        row[i] = acc;
      }
      this.#levels.push(row);
    }
  }

  query(from: number, to: number): number {
    if (
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from < 0 ||
      to > this.#size ||
      from > to
    ) {
      throw new RangeError(`범위 밖 구간 [${from}, ${to})`);
    }
    if (from === to) return this.#identity;
    const k = 31 - Math.clz32(to - from);
    const row = this.#levels[k] as number[];
    this.__cost += 2;
    return this.#fold(row[from] as number, row[to - (1 << k)] as number);
  }

  #fold(a: number, b: number): number {
    this.__cost += 1;
    return this.#combine(a, b);
  }
}
