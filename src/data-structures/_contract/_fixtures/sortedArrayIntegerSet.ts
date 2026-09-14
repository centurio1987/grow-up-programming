/**
 * 결함 fixture — 담긴 키를 크기 순 배열 한 줄에 두고, 자리를 **앞에서부터 한 칸씩 훑어** 찾는
 * 정수 집합.
 *
 * `heap/vanEmdeBoasTree` 계약(`../../heap/vanEmdeBoasTree/vanEmdeBoasTree.ts`)의 자명한 구현이다.
 * **답은 전부 옳다**(축1 통과). 우주 크기를 전혀 쓰지 않는다 — 생성자가 받은 u 는 범위 검사에만
 * 쓰인다.
 *
 * 걸리는 것은 **원소 수를 키우는 시나리오 셋**이다. 넣기·지우기는 자리 뒤를 전부 밀거나 당기고,
 * 찾기·이웃 찾기는 자리까지 훑는다 — 호출 하나가 담긴 수에 비례한다. 계약의 상한에는 원소 수가
 * 없다.
 *
 * **우주를 키우는 시나리오 둘은 통과한다.** 그 시나리오들은 키를 두 개만 담는다. 원소 수에만
 * 기대는 계열에는 우주가 보이지 않는다 — 두 파라미터를 갈라 키우는 이유가 이 fixture 와
 * `scanningBitSet` 이 서로 반대쪽에서만 걸린다는 것이다.
 *
 * 계측 단위는 §규약2 그대로 — 공개 연산 한 번에 1, 훑으며 지나간 칸 하나에 1, 밀거나 당긴 칸
 * 하나에 1 이다.
 */

export class SortedArrayIntegerSet {
  readonly #universe: number;
  readonly #items: number[] = [];

  __cost = 0;

  constructor(universe: number) {
    if (!Number.isSafeInteger(universe) || universe < 1) {
      throw new RangeError(`우주 크기가 잘못됐다 — ${universe}`);
    }
    this.#universe = universe;
  }

  insert(x: number): void {
    this.#check(x);
    this.__cost += 1;
    const at = this.#firstAtLeast(x);
    if (this.#items[at] === x) return;
    this.__cost += this.#items.length - at;
    this.#items.splice(at, 0, x);
  }

  delete(x: number): boolean {
    this.#check(x);
    this.__cost += 1;
    const at = this.#firstAtLeast(x);
    if (this.#items[at] !== x) return false;
    this.__cost += this.#items.length - at;
    this.#items.splice(at, 1);
    return true;
  }

  has(x: number): boolean {
    this.#check(x);
    this.__cost += 1;
    return this.#items[this.#firstAtLeast(x)] === x;
  }

  min(): number | null {
    this.__cost += 1;
    return this.#items[0] ?? null;
  }

  max(): number | null {
    this.__cost += 1;
    return this.#items[this.#items.length - 1] ?? null;
  }

  successor(x: number): number | null {
    this.#check(x);
    this.__cost += 1;
    return this.#items[this.#firstAtLeast(x + 1)] ?? null;
  }

  predecessor(x: number): number | null {
    this.#check(x);
    this.__cost += 1;
    const at = this.#firstAtLeast(x);
    return at === 0 ? null : (this.#items[at - 1] ?? null);
  }

  #check(x: number): void {
    if (!Number.isInteger(x) || x < 0 || x >= this.#universe) {
      throw new RangeError(`우주 밖 키 — ${x}`);
    }
  }

  /** `x` 이상인 첫 자리. 앞에서부터 한 칸씩 훑는다. */
  #firstAtLeast(x: number): number {
    let at = 0;
    while (at < this.#items.length && (this.#items[at] as number) < x) {
      this.__cost += 1;
      at += 1;
    }
    return at;
  }
}
