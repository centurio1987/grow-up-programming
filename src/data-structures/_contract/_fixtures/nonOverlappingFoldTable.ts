/**
 * 비교용 구현(결함 fixture 가 아니다) — 구간을 **겹치지 않게** 접어 두는 불변 표.
 *
 * 대상 계약: `range-query/sparseTable`. **계약을 지킨다** — 두 행을 전부 상한 안에 두고 답이 옳다. 이 파일이 `_fixtures/` 에
 * 있는 이유는 헤더 「필요충분조건」의 판정 근거이기 때문이다(`loggingForest` 의 비교용 모드와 같은 자리).
 *
 * **멱등은 상수 질의의 필요조건이 아니다 — 이 구현이 그 반례다.** 자리 수를 2의 거듭제곱 `P` 로 채우고(채운 자리는 항등원),
 * 층 `h`(묶음 크기 `2^h`)마다 묶음의 가운데에서 왼쪽으로 접은 값과 오른쪽으로 접은 값을 자리마다 적어 둔다. 구간 `[l, r]`
 * (닫힌 끝 `r = to - 1`)의 두 끝이 처음 갈라지는 층은 `l XOR r` 의 가장 높은 비트가 정하고, 그 층에서 `l` 은 가운데 왼쪽,
 * `r` 은 가운데 오른쪽에 있으므로 답이 **겹치지 않는 두 칸의 결합 한 번**이다. 결합법칙만 쓴다 — 합처럼 멱등이 아닌 결합에서도
 * 답이 옳다(하네스 자기시험이 고정한다).
 *
 * 짓는 일은 층 수 × `P` 칸이라 정본과 같은 계급이고, 질의는 비트 연산 한 번 · 칸 둘 · 결합 한 번이다.
 *
 * 세는 단위는 §규약2 계측 단위 그대로다 — 칸 하나를 지나갈 때마다 1, 주입된 결합 한 번에 1.
 */

export class NonOverlappingFoldTable {
  readonly #size: number;
  readonly #combine: (a: number, b: number) => number;
  readonly #identity: number;
  /** 자리 값. 길이 `P`, 채운 자리는 항등원. */
  readonly #values: number[];
  /** 층 `h` 의 칸 `i` — `i` 가 묶음 가운데 왼쪽이면 `[i, 가운데)` 를, 오른쪽이면 `[가운데, i]` 를 접은 값. `h >= 1`. */
  readonly #levels: number[][] = [[]];

  __cost = 0;

  constructor(
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
  ) {
    this.#combine = combine;
    this.#identity = identity;
    this.#size = values.length;
    let width = 1;
    while (width < this.#size) width *= 2;
    this.#values = new Array<number>(width).fill(identity);
    for (let i = 0; i < this.#size; i++) {
      this.__cost += 1;
      this.#values[i] = values[i] as number;
    }
    for (let h = 1; 1 << h <= width; h++) {
      const block = 1 << h;
      const half = block >> 1;
      const row = new Array<number>(width);
      for (let start = 0; start < width; start += block) {
        const mid = start + half;
        let acc = this.#identity;
        for (let i = mid - 1; i >= start; i--) {
          this.__cost += 1;
          acc = this.#fold(this.#values[i] as number, acc);
          row[i] = acc;
        }
        acc = this.#identity;
        for (let i = mid; i < start + block; i++) {
          this.__cost += 1;
          acc = this.#fold(acc, this.#values[i] as number);
          row[i] = acc;
        }
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
    const last = to - 1;
    this.__cost += 1;
    if (from === last) return this.#values[from] as number;
    const h = 32 - Math.clz32(from ^ last);
    const row = this.#levels[h] as number[];
    this.__cost += 2;
    return this.#fold(row[from] as number, row[last] as number);
  }

  #fold(a: number, b: number): number {
    this.__cost += 1;
    return this.#combine(a, b);
  }
}
