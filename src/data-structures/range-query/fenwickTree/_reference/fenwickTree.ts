/**
 * `range-query/fenwickTree` 정본(규약2).
 *
 * 계약은 `../fenwickTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다 — 자리들을 이진 트리의 잎에 놓고
 * 마디마다 부분합을 들고 있는 구현도 네 행을 전부 로그 안에 한다. 이 파일이 정본인 것은
 * 계약이 고른 계급을 대표하기 때문이지 계약이 이 기법을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"접힌 합 칸 하나를 지나갈 때마다 1"* 이다 — **읽기와
 * 쓰기를 따로 세지 않고**, 색인을 옮기는 셈은 따로 세지 않는다. 축3은 절대 카운트가 아니라
 * 성장률을 보므로 상수 배수가 판정에 들어오지 않기 때문이다(§규약2 계측 단위).
 * `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **자리 하나를 여러 칸에 겹쳐 두는 것이 이 구현의 전부다.** 칸 `k` 하나가 자리 하나가 아니라
 * **구간 하나**의 합을 들고 있고, 그 구간의 길이는 `k` 의 이진 표기 끝에 붙은 0 의 개수로
 * 정해진다. 그래서 자리 하나는 서로 다른 길이의 칸 여러 개에 동시에 들어가고, 그 개수가
 * 자리 수의 로그를 넘지 않는다.
 *
 * **`#lowBit` 하나가 두 방향을 다 정한다.** 갱신은 자기를 덮는 더 긴 칸으로 올라가고
 * (`at += lowBit(at)`), 질의는 덮은 만큼을 떼어 내며 앞으로 내려간다(`at -= lowBit(at)`).
 * 두 걸음이 같은 값을 더하고 빼는 것이 우연이 아니다 — 칸 `k` 가 덮는 구간의 왼쪽 끝이
 * `k - lowBit(k)` 라서, 빼기는 「덮은 구간을 지나 그 앞으로」가 된다.
 *
 * **`rangeSum` 이 두 앞구간의 차인 것은 이 계약이 덧셈에 고정돼 있어서 가능한 일이다.**
 * 뺄 수 없는 결합(최솟값 등)에서는 이 줄이 성립하지 않고, 그 계약은 다른 구조가 받는다
 * (`range-query/segmentTree`). 계약 헤더의 「`segmentTree` 와 갈리는 자리」가 그 문단이다.
 *
 * **정본이 드는 내부 성질 둘은 계약에 없다.** 계약이 그것을 관측하지 못하므로 어느 축도
 * 이름으로 검사하지 않는다 — 어긋나면 답이 틀리므로 축1이 값에서 잡는다.
 * ① 칸 `k` 는 자리 `k - lowBit(k)` 이상 `k` 미만의 합을 들고 있다.
 * ② 갱신이 오르는 칸들과 질의가 내려가는 칸들은 각 자리에 대해 **정확히 한 번** 만난다.
 */

// #region guide:core/class
export class FenwickTree {
  /** 생성자가 고정한 자리 수. 구조가 사는 동안 바뀌지 않는다. */
  readonly #size: number;

  /**
   * 접힌 합. `1` 부터 `#size` 까지를 쓰고 `0` 번 칸은 비워 둔다.
   *
   * 0 번을 비우는 것은 `lowBit(0) === 0` 이라 내려가는 걸음이 그 자리에서 멈추기 때문이다.
   * 「앞이 하나도 없다」를 색인 하나로 표현하는 자리이고, 그래서 바깥 자리 번호 `i` 는
   * 안쪽 칸 번호 `i + 1` 이 된다.
   */
  readonly #folded: number[];

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(n: number) {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(
        `자리 수는 0 이상의 정수여야 한다 — 받은 값은 ${n} 이다`,
      );
    }
    this.#size = n;
    this.#folded = new Array<number>(n + 1).fill(0);
  }

  update(i: number, delta: number): void {
    if (!Number.isInteger(i) || i < 0 || i >= this.#size) {
      throw new RangeError(
        `자리 번호는 [0, ${this.#size}) 안이어야 한다 — 받은 값은 ${i} 다`,
      );
    }
    if (!Number.isInteger(delta)) {
      throw new RangeError(`더할 값은 정수여야 한다 — 받은 값은 ${delta} 다`);
    }

    // 바깥 자리 `i` 를 덮는 가장 짧은 칸이 `i + 1` 이고, 거기서부터 자기를 덮는 더 긴
    // 칸으로 올라간다. 표 밖으로 나가면 더 덮을 칸이 없다.
    for (let at = i + 1; at <= this.#size; at += this.#lowBit(at)) {
      this.__cost += 1;
      this.#folded[at] = (this.#folded[at] as number) + delta;
    }
  }

  prefixSum(i: number): number {
    if (!Number.isInteger(i) || i < 0 || i > this.#size) {
      throw new RangeError(
        `앞구간 길이는 [0, ${this.#size}] 안이어야 한다 — 받은 값은 ${i} 다`,
      );
    }

    // 칸 `at` 이 덮는 구간을 떼어 내고 그 왼쪽 끝(`at - lowBit(at)`)으로 옮긴다.
    // `at` 이 0 이 되면 앞이 하나도 남지 않은 것이다.
    let sum = 0;
    for (let at = i; at > 0; at -= this.#lowBit(at)) {
      this.__cost += 1;
      sum += this.#folded[at] as number;
    }
    return sum;
  }

  rangeSum(from: number, to: number): number {
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
    return this.prefixSum(to) - this.prefixSum(from);
  }

  /**
   * 이진 표기에서 가장 낮은 1 비트만 남긴 값. 칸 `k` 가 덮는 구간의 길이다.
   *
   * 2의 보수 표기에서 `-k` 는 `k` 의 비트를 뒤집고 1 을 더한 값이라, 가장 낮은 1 비트
   * 아래는 전부 0 이고 그 자리만 `k` 와 같다. 그래서 `k & -k` 가 그 비트 하나로 남는다.
   */
  #lowBit(k: number): number {
    return k & -k;
  }
}
// #endregion
