/**
 * `disjoint-set/disjointSetRollback` 정본(규약2).
 *
 * 계약은 `../disjointSetRollback.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다. 계약의 어느 문장도 부모를 가리키는 배열이나
 * 되돌리기 기록을 말하지 않는다 — 지난 길을 줄이고 그 줄인 것까지 기록해 되돌리는 구현도 다섯 행을
 * 전부 지킨다(`_contract/_fixtures/loggingForest.ts` 의 `bySize` · 줄이기 켬).
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — *"구조의 단위 하나(여기서는
 * 원소 하나)를 지나갈 때마다 1"* 이고 읽기와 쓰기를 따로 세지 않는다. 공개 연산 한 번에 1, 뿌리를
 * 찾아 올라가며 지나는 원소 하나에 1 이다. 되돌리기가 기록 한 칸을 꺼내 되쓰는 일은 그 연산의 1 에
 * 든다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **이 구현이 하는 일은 넷이다.** 원소마다 부모 하나를 가리키고 부모가 자기 자신이면 그 집합의
 * 뿌리다. ① 합칠 때 원소가 적은 쪽의 뿌리를 많은 쪽 뿌리 아래에 건다 — 나무의 높이가 원소 수의
 * 로그에 묶이고, 그래서 찾기 한 번이 **호출마다** 로그 안이다. ② 지난 길을 줄이지 않는다 — 합치기
 * 하나가 바꾸는 칸이 뿌리 쪽 셋(부모 · 크기 · 가장 작은 원소)뿐이라 되돌리기가 그 셋만 되쓰면 된다.
 * ③ 뿌리마다 그 집합의 **가장 작은 원소**를 든다(`../../unionFind/_reference/unionFind.ts` 와 같다).
 * ④ 합치기 **호출마다** 기록 한 칸을 쌓는다 — 이미 같은 집합이라 아무것도 안 바꾼 호출도 빈 칸 하나를
 * 쌓는다. 계약의 `rollback` 이 되돌리는 것이 합친 일이 아니라 합치기 호출이기 때문이다.
 *
 * **②는 계약이 아니라 이 구현의 선택이다.** 줄이면 찾기가 여러 칸을 바꾸고, 그 칸들을 기록해
 * 되돌리면 되돌리기 한 번이 원소 수에 비례할 수 있다 — 그 계열도 계약을 지킨다(헤더 「연산 계약」의
 * `rollback` 이 `amortized` 인 이유). 줄이는 일의 상각 이득은 되돌리기가 그 줄인 것을 되돌려 **다시
 * 사게 만들 수 있어서** 이 계약에서는 서지 않는다 — ①이 없으면 그렇다(헤더 「검증 등급」).
 */

// #region guide:core/class
/** 합치기 호출 하나가 바꾼 것. 아무것도 안 바꾼 호출은 `null` 로 쌓는다. */
interface Merge {
  /** 다른 뿌리 아래에 걸린 뿌리. */
  child: number;
  /** 그 아래에 건 뿌리. */
  parent: number;
  /** 걸기 전 `parent` 가 들던 가장 작은 원소. */
  smallest: number;
}

export class DisjointSetRollback {
  /** 원소마다 부모. 자기 자신을 가리키면 뿌리다. */
  readonly #parent: number[] = [];
  /** 뿌리에서만 뜻이 있다 — 그 집합의 원소 수. */
  readonly #size: number[] = [];
  /** 뿌리에서만 뜻이 있다 — 그 집합의 가장 작은 원소. */
  readonly #smallest: number[] = [];
  /** 합치기 호출마다 한 칸. 마지막 칸이 다음에 되돌릴 호출이다. */
  readonly #history: (Merge | null)[] = [];

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(n: number) {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(
        `원소 수는 0 이상의 정수여야 한다 — 받은 값은 ${n} 이다`,
      );
    }
    for (let element = 0; element < n; element++) {
      this.#parent.push(element);
      this.#size.push(1);
      this.#smallest.push(element);
    }
  }

  find(x: number): number {
    this.__cost += 1;
    return this.#smallest[this.#root(x)] as number;
  }

  union(x: number, y: number): void {
    this.__cost += 1;
    const left = this.#root(x);
    const right = this.#root(y);
    if (left === right) {
      this.#history.push(null);
      return;
    }

    const [child, parent] =
      (this.#size[left] as number) < (this.#size[right] as number)
        ? [left, right]
        : [right, left];
    this.#history.push({
      child,
      parent,
      smallest: this.#smallest[parent] as number,
    });
    this.#parent[child] = parent;
    this.#size[parent] =
      (this.#size[parent] as number) + (this.#size[child] as number);
    this.#smallest[parent] = Math.min(
      this.#smallest[parent] as number,
      this.#smallest[child] as number,
    );
  }

  connected(x: number, y: number): boolean {
    this.__cost += 1;
    return this.#root(x) === this.#root(y);
  }

  rollback(): boolean {
    this.__cost += 1;
    if (this.#history.length === 0) return false;
    const merge = this.#history.pop();
    if (merge) {
      this.#parent[merge.child] = merge.child;
      this.#size[merge.parent] =
        (this.#size[merge.parent] as number) -
        (this.#size[merge.child] as number);
      this.#smallest[merge.parent] = merge.smallest;
    }
    return true;
  }

  /** 뿌리까지 올라간다. 지난 길을 줄이지 않는다(파일 헤더 ②). */
  #root(x: number): number {
    if (!Number.isInteger(x) || x < 0 || x >= this.#parent.length) {
      throw new RangeError(
        `원소는 0 이상 ${this.#parent.length} 미만의 정수여야 한다 — 받은 값은 ${x} 이다`,
      );
    }
    let root = x;
    while (this.#parent[root] !== root) {
      this.__cost += 1;
      root = this.#parent[root] as number;
    }
    return root;
  }
}
// #endregion
