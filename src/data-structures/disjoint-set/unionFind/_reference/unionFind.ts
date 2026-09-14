/**
 * `disjoint-set/unionFind` 정본(규약2).
 *
 * 계약은 `../unionFind.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고,
 * 계약이 허용하는 유일한 구현이 아니다. 계약의 어느 문장도 부모를 가리키는 배열이나 길 줄이기를
 * 말하지 않는다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — *"구조의 단위 하나(여기서는
 * 원소 하나)를 지나갈 때마다 1"* 이고 읽기와 쓰기를 따로 세지 않는다. 공개 연산 한 번에 1, 뿌리를
 * 찾아 올라가며 지나는 원소 하나에 1 이다. 올라간 길을 뿌리에 바로 거는 두 번째 걸음은 첫 걸음이
 * 지난 원소를 다시 쓰는 것이라 따로 세지 않는다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **이 구현이 하는 일은 셋이다.** 원소마다 부모 하나를 가리키고 부모가 자기 자신이면 그 집합의
 * 뿌리다. ① 합칠 때 원소가 적은 쪽의 뿌리를 많은 쪽 뿌리 아래에 건다 — 나무의 높이가 원소 수의
 * 로그에 묶인다. ② 뿌리를 찾으며 지난 원소를 전부 뿌리에 바로 건다 — 다음 찾기가 짧아진다.
 * ③ 뿌리마다 그 집합의 **가장 작은 원소**를 따로 든다 — 계약의 `find` 가 돌려주는 것이 뿌리가 아니라
 * 그 값이다. ①과 ②를 함께 쓴 호출열의 총비용이 역아커만 함수에 묶인다는 것은 문헌의 결과이고 이
 * 파일은 그 증명을 옮기지 않는다(확인 안 함).
 *
 * **③이 없으면 계약을 어긴다.** 뿌리는 합친 순서와 크기가 정하므로 가장 작은 원소와 다를 수 있다.
 * 가장 작은 값을 드는 일은 합칠 때 둘 중 작은 쪽을 고르는 상수 한 번이라 ①·②의 비용 계급을
 * 바꾸지 않는다.
 */

// #region guide:core/class
export class UnionFind {
  /** 원소마다 부모. 자기 자신을 가리키면 뿌리다. */
  readonly #parent: number[] = [];
  /** 뿌리에서만 뜻이 있다 — 그 집합의 원소 수. */
  readonly #size: number[] = [];
  /** 뿌리에서만 뜻이 있다 — 그 집합의 가장 작은 원소. */
  readonly #smallest: number[] = [];

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
    if (left === right) return;

    const [small, large] =
      (this.#size[left] as number) < (this.#size[right] as number)
        ? [left, right]
        : [right, left];
    this.#parent[small] = large;
    this.#size[large] =
      (this.#size[large] as number) + (this.#size[small] as number);
    this.#smallest[large] = Math.min(
      this.#smallest[large] as number,
      this.#smallest[small] as number,
    );
  }

  connected(x: number, y: number): boolean {
    this.__cost += 1;
    return this.#root(x) === this.#root(y);
  }

  /** 뿌리를 찾고, 지나온 원소를 전부 뿌리에 바로 건다. */
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
    let at = x;
    while (at !== root) {
      const next = this.#parent[at] as number;
      this.#parent[at] = root;
      at = next;
    }
    return root;
  }
}
// #endregion
