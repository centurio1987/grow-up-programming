/**
 * `range-query/sparseTable` 정본(규약2).
 *
 * 계약은 `../sparseTable.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고, 계약이 허용하는 유일한
 * 구현이 아니다 — 구간을 겹치지 않게 접어 두는 구현(`src/data-structures/_contract/_fixtures/nonOverlappingFoldTable.ts`)도
 * 두 행을 전부 지킨다. 이 파일이 정본인 것은 계약이 고른 계급을 대표하기 때문이지 계약이 이 기법을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — **칸 하나를 지나갈 때마다 1**, 그리고 **주입된 결합을 한 번
 * 부를 때마다 1**. 배열을 잡는 런타임 비용은 세지 않는다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **길이가 2의 거듭제곱인 구간을 전부 접어 둔다.** 층 `k` 의 칸 `i` 는 자리 `i` 부터 `2^k` 개를 왼쪽부터 접은 값이고, 한 층
 * 아래의 두 칸을 접어 얻는다 — 그래서 짓는 일이 칸 수(자리 수 × 층 수)에 비례한다.
 *
 * **질의는 겹치는 두 칸을 접는다.** 폭이 `w` 인 구간은 `2^k <= w` 인 가장 큰 `k` 의 칸 둘 — 왼쪽 끝에서 시작하는 것과 오른쪽
 * 끝에서 끝나는 것 — 로 덮이고, 두 칸이 가운데를 **두 번** 덮는다. **이 구현이 주입자의 의무를 쓰는 자리가 여기다**(헤더
 * 「주입 정책」). 결합법칙이 두 칸을 자리 순서대로 이어 붙이고, 멱등이 두 번 덮인 가운데를 한 번으로 줄인다. 교환법칙은 쓰지
 * 않는다 — 왼쪽 칸이 늘 앞에 온다. 멱등이 아닌 결합(합)을 주면 가운데가 두 번 더해져 답이 틀린다(헤더 「주입 정책」의 수치).
 *
 * **생성자가 받은 배열을 다 읽고 들고 있지 않는다** — 헤더 「연산 계약」의 구성 시점 조항이 이 줄이다.
 */

// #region guide:core/class
export class SparseTable {
  /** 생성자가 고정한 자리 수. */
  readonly #size: number;

  readonly #combine: (a: number, b: number) => number;
  readonly #identity: number;

  /** 층 `k` 의 칸 `i` = 자리 `[i, i + 2^k)` 를 왼쪽부터 접은 값. 층 0 은 자리 값 그대로다. */
  readonly #levels: number[][] = [];

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
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
      const below = this.#levels[k - 1] as number[];
      const half = 1 << (k - 1);
      const row = new Array<number>(this.#size - (1 << k) + 1);
      for (let i = 0; i < row.length; i++) {
        this.__cost += 1;
        row[i] = this.#fold(below[i] as number, below[i + half] as number);
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
      throw new RangeError(
        `구간은 0 <= from <= to <= ${this.#size} 이어야 한다 — 받은 값은 [${from}, ${to}) 다`,
      );
    }
    if (from === to) return this.#identity;

    // 폭 이하인 가장 큰 2의 거듭제곱의 지수. 비트 연산 한 번이라 칸을 지나지 않는다.
    const k = 31 - Math.clz32(to - from);
    const row = this.#levels[k] as number[];
    this.__cost += 2;
    return this.#fold(row[from] as number, row[to - (1 << k)] as number);
  }

  /** 주입받은 결합을 한 번 부른다. 부르는 자리를 하나로 모아 계측이 새지 않게 한다. */
  #fold(a: number, b: number): number {
    this.__cost += 1;
    return this.#combine(a, b);
  }
}
// #endregion
