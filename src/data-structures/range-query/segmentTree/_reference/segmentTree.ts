/**
 * `range-query/segmentTree` 정본(규약2).
 *
 * 계약은 `../segmentTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다 — 자리들을 위에서부터 반씩 갈라
 * 되돌이로 내려가는 구현도, 잎을 채워 넣지 않고 경계를 그때그때 셈하는 구현도 세 행을
 * 전부 지킨다. 이 파일이 정본인 것은 계약이 고른 계급을 대표하기 때문이지 계약이 이
 * 기법을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위가 둘이다 — **마디 하나를 지나갈 때마다 1**, 그리고
 * **주입된 결합을 한 번 부를 때마다 1**(§규약2 계측 단위가 주입 호출을 따로 세라고 적는다).
 * 읽기와 쓰기를 따로 세지 않고, 배열을 다시 잡는 런타임 비용도 세지 않는다. 축3은 절대
 * 카운트가 아니라 성장률을 보므로 상수 배수가 판정에 들어오지 않기 때문이다.
 * `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **자리를 잎에 놓고 마디마다 그 아래를 접어 둔 값을 든다.** 마디 `k` 는 자기 아래 잎들을
 * **왼쪽부터** 접은 값 하나를 들고 있고, 그래서 구간 하나의 답이 그 구간을 덮는 마디
 * 몇 개를 접는 일로 줄어든다. 덮는 마디의 수가 자리 수의 로그를 넘지 않는다.
 *
 * **잎 수를 2의 거듭제곱으로 채운다.** 남는 잎에는 주입받은 항등원을 넣는다 — 마디 `k` 의
 * 자식이 언제나 `2k`·`2k+1` 이 되어 층을 오르내리는 셈이 자리 수와 무관해지고, 채운 잎이
 * 답을 바꾸지 않는 것은 **항등원이 실제로 항등원이라는 주입자의 의무**에서 나온다. 이것은
 * 계약이 요구하는 바가 아니라 이 구현이 그 의무를 쓰는 자리다.
 *
 * **왼쪽 몫과 오른쪽 몫을 따로 모으는 것이 이 구현의 유일한 까다로운 줄이다.** 아래에서
 * 위로 오르면 덮는 마디를 만나는 순서가 자리 순서와 다르다 — 왼쪽 끝에서 하나, 오른쪽
 * 끝에서 하나씩 번갈아 나온다. 하나의 통에 만나는 대로 접으면 **교환적인 결합에서는 답이
 * 같고 아닌 결합에서는 갈린다.** 계약이 자리의 순서를 고정하므로(헤더 「주입 정책」) 통을
 * 둘로 나눠 마지막에 한 번 접는다. 그 한 줄을 되돌린 변이가
 * `_contract/_fixtures/unorderedRangeFold.ts` 이고 축1에서 걸린다.
 *
 * **이 정본이 드는 내부 성질 둘은 계약에 없다.** 계약이 그것을 관측하지 못하므로 어느 축도
 * 이름으로 검사하지 않는다 — 어긋나면 답이 틀리므로 축1이 값에서 잡는다.
 * ① 마디 `k` 는 자기 아래 잎들을 왼쪽부터 접은 값과 같다.
 * ② 질의가 모으는 마디들은 구간의 자리를 **빠짐없이 한 번씩** 덮고, 왼쪽 통과 오른쪽 통을
 *    이어 붙인 순서가 자리 순서와 같다.
 */

// #region guide:core/class
export class SegmentTree {
  /** 생성자가 고정한 자리 수. 구조가 사는 동안 바뀌지 않는다. */
  readonly #size: number;

  /** 잎의 수. `#size` 이상인 가장 작은 2의 거듭제곱이다. */
  readonly #width: number;

  /** 주입받은 결합. 계약은 결합법칙만 요구하고 교환법칙은 요구하지 않는다. */
  readonly #combine: (a: number, b: number) => number;

  /** 주입받은 항등원. 빈 구간의 답이자 채운 잎의 값이다. */
  readonly #identity: number;

  /**
   * 접어 둔 값. 잎은 `[#width, #width + #size)` 에 놓이고 마디 `k` 의 자식이 `2k`·`2k+1`
   * 이다. `0` 번 칸은 쓰지 않는다 — 뿌리를 `1` 에 두어야 자리 `i` 의 잎이 `#width + i` 로
   * 곧장 적힌다.
   */
  readonly #tree: number[];

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

    let width = 1;
    while (width < this.#size) width *= 2;
    this.#width = width;
    this.#tree = new Array<number>(2 * width).fill(identity);

    for (let i = 0; i < this.#size; i++) {
      this.__cost += 1;
      this.#tree[width + i] = values[i] as number;
    }
    // 잎 바로 위 층부터 뿌리까지 한 번씩 접는다. 아래가 이미 다 정해져 있으므로 마디마다
    // 결합 한 번이면 되고, 그래서 짓는 일이 자리 수에 비례한다.
    for (let at = width - 1; at >= 1; at--) {
      this.__cost += 1;
      this.#tree[at] = this.#fold(
        this.#tree[2 * at] as number,
        this.#tree[2 * at + 1] as number,
      );
    }
  }

  update(i: number, value: number): void {
    if (!Number.isInteger(i) || i < 0 || i >= this.#size) {
      throw new RangeError(
        `자리 번호는 [0, ${this.#size}) 안이어야 한다 — 받은 값은 ${i} 다`,
      );
    }

    let at = this.#width + i;
    this.__cost += 1;
    this.#tree[at] = value;
    // 바뀐 잎을 덮는 마디는 그 조상뿐이다. 뿌리까지 오르며 자식 둘을 다시 접는다.
    for (at >>= 1; at >= 1; at >>= 1) {
      this.__cost += 1;
      this.#tree[at] = this.#fold(
        this.#tree[2 * at] as number,
        this.#tree[2 * at + 1] as number,
      );
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

    // 왼쪽 끝과 오른쪽 끝을 한 층씩 올리면서, 그 층에서 구간 밖으로 삐져나가지 않는 마디만
    // 떼어 낸다. 왼쪽에서 뗀 것과 오른쪽에서 뗀 것을 **다른 통**에 모으는 이유는 파일
    // 헤더에 적었다.
    let left = this.#identity;
    let right = this.#identity;
    let l = this.#width + from;
    let r = this.#width + to;
    while (l < r) {
      this.__cost += 2;
      if ((l & 1) === 1) {
        left = this.#fold(left, this.#tree[l] as number);
        l += 1;
      }
      if ((r & 1) === 1) {
        r -= 1;
        right = this.#fold(this.#tree[r] as number, right);
      }
      l >>= 1;
      r >>= 1;
    }
    return this.#fold(left, right);
  }

  /** 주입받은 결합을 한 번 부른다. 부르는 자리를 하나로 모아 두면 계측이 새지 않는다. */
  #fold(a: number, b: number): number {
    this.__cost += 1;
    return this.#combine(a, b);
  }
}
// #endregion
