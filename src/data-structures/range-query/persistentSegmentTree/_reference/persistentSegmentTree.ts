/**
 * `range-query/persistentSegmentTree` 정본(규약2).
 *
 * 계약은 `../persistentSegmentTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다 — 계약의 어느 문장도 마디를 나눠 쓰라고 적지
 * 않는다. 이 파일이 정본인 것은 계약이 고른 계급을 대표하기 때문이지 계약이 이 기법을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — **마디 하나를 지나갈 때마다 1**,
 * 그리고 **주입된 결합을 한 번 부를 때마다 1**. 새 마디를 만드는 일은 그 마디를 지나가는 일에 들어
 * 있어 따로 세지 않고, 배열을 다시 잡는 런타임 비용도 세지 않는다. `__cost` 는 계약이 아니라 정본의
 * 의무다(불변 사실 23).
 *
 * **자리를 반씩 갈라 마디를 짓고, 갱신은 바뀐 자리로 가는 길의 마디만 새로 짓는다.** 마디는 자기 아래
 * 자리들을 왼쪽부터 접은 값 하나와 두 자식을 든다. 갱신 한 번이 새로 짓는 마디는 뿌리에서 그 자리의 잎까지
 * 한 줄이고, 그 줄에서 벗어난 자식은 **고치지 않고 가리키기만 한다** — 그래서 옛 버전의 마디는 한 번 지어진 뒤
 * 누구도 고치지 않고, 버전마다 뿌리 하나를 들고 있으면 옛 버전이 그대로 남는다.
 *
 * **이 구현이 주입자의 의무를 쓰는 자리는 결합법칙 하나다** — 질의가 덮는 마디들을 묶어 접는다. 되돌이가
 * 왼쪽 자식을 먼저 내려가므로 덮는 마디를 자리 순서대로 만나고, 교환법칙은 쓰지 않는다.
 *
 * **이 정본이 드는 내부 성질 둘은 계약에 없다.** ① 한 번 지은 마디의 값과 자식은 바뀌지 않는다. ② 버전
 * 하나의 뿌리에서 닿는 잎들이 그 버전의 자리 값이다. 어긋나면 답이 틀리므로 축1이 값에서 잡는다.
 */

// #region guide:core/class
export class PersistentSegmentTree {
  /** 생성자가 고정한 자리 수. 버전이 늘어도 바뀌지 않는다. */
  readonly #size: number;

  readonly #combine: (a: number, b: number) => number;
  readonly #identity: number;

  /** 마디 `k` 의 왼쪽 자식. 잎이면 -1. */
  readonly #left: number[] = [];
  /** 마디 `k` 의 오른쪽 자식. 잎이면 -1. */
  readonly #right: number[] = [];
  /** 마디 `k` 가 덮는 자리들을 왼쪽부터 접은 값. */
  readonly #folded: number[] = [];

  /** 버전 번호 → 그 버전의 뿌리 마디. 자리가 없는 수열의 뿌리는 -1 이다. */
  readonly #roots: number[] = [];

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
    // 받은 배열을 여기서 다 읽고 들고 있지 않는다 — 돌아온 뒤 호출자가 고쳐도 버전 0 은 그대로다.
    this.#roots.push(
      this.#size === 0 ? -1 : this.#build(values, 0, this.#size),
    );
  }

  update(version: number, i: number, value: number): number {
    this.#checkVersion(version);
    if (!Number.isInteger(i) || i < 0 || i >= this.#size) {
      throw new RangeError(
        `자리 번호는 [0, ${this.#size}) 안이어야 한다 — 받은 값은 ${i} 다`,
      );
    }
    const root = this.#roots[version] as number;
    this.#roots.push(this.#copyPath(root, 0, this.#size, i, value));
    return this.#roots.length - 1;
  }

  query(version: number, from: number, to: number): number {
    this.#checkVersion(version);
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
    const root = this.#roots[version] as number;
    return this.#collect(root, 0, this.#size, from, to, this.#identity);
  }

  #checkVersion(version: number): void {
    if (
      !Number.isInteger(version) ||
      version < 0 ||
      version >= this.#roots.length
    ) {
      throw new RangeError(
        `버전 번호는 [0, ${this.#roots.length}) 안이어야 한다 — 받은 값은 ${version} 다`,
      );
    }
  }

  /** 자리 `[lo, hi)` 를 덮는 마디를 짓고 그 번호를 돌려준다. */
  #build(values: number[], lo: number, hi: number): number {
    this.__cost += 1;
    if (hi - lo === 1) return this.#leaf(values[lo] as number);
    const mid = (lo + hi) >> 1;
    const left = this.#build(values, lo, mid);
    const right = this.#build(values, mid, hi);
    return this.#branch(left, right);
  }

  /** 마디 `node`(자리 `[lo, hi)`)에서 자리 `i` 로 가는 길만 새로 지은 마디의 번호. 길 밖 자식은 가리키기만 한다. */
  #copyPath(
    node: number,
    lo: number,
    hi: number,
    i: number,
    value: number,
  ): number {
    this.__cost += 1;
    if (hi - lo === 1) return this.#leaf(value);
    const mid = (lo + hi) >> 1;
    let left = this.#left[node] as number;
    let right = this.#right[node] as number;
    if (i < mid) left = this.#copyPath(left, lo, mid, i, value);
    else right = this.#copyPath(right, mid, hi, i, value);
    return this.#branch(left, right);
  }

  /** 마디 `node`(자리 `[lo, hi)`) 아래에서 `[from, to)` 에 드는 자리를 왼쪽부터 `acc` 뒤에 접는다. */
  #collect(
    node: number,
    lo: number,
    hi: number,
    from: number,
    to: number,
    acc: number,
  ): number {
    this.__cost += 1;
    if (from <= lo && hi <= to) {
      return this.#fold(acc, this.#folded[node] as number);
    }
    const mid = (lo + hi) >> 1;
    let result = acc;
    if (from < mid) {
      result = this.#collect(
        this.#left[node] as number,
        lo,
        mid,
        from,
        to,
        result,
      );
    }
    if (to > mid) {
      result = this.#collect(
        this.#right[node] as number,
        mid,
        hi,
        from,
        to,
        result,
      );
    }
    return result;
  }

  #leaf(value: number): number {
    this.#left.push(-1);
    this.#right.push(-1);
    this.#folded.push(value);
    return this.#folded.length - 1;
  }

  #branch(left: number, right: number): number {
    this.#left.push(left);
    this.#right.push(right);
    this.#folded.push(
      this.#fold(this.#folded[left] as number, this.#folded[right] as number),
    );
    return this.#folded.length - 1;
  }

  /** 주입받은 결합을 한 번 부른다. 부르는 자리를 하나로 모아 계측이 새지 않게 한다. */
  #fold(a: number, b: number): number {
    this.__cost += 1;
    return this.#combine(a, b);
  }
}
// #endregion
