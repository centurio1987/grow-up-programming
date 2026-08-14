/**
 * 결함 fixture — 마디마다 부모를 하나 들고, 지나간 길을 **고쳐 쓰지 않는** 숲.
 *
 * 앞의 둘(`ScanningForest`·`RelabelingForest`)과 다른 계열이다. 저 둘은 갱신과 질의 중
 * 한쪽을 통째로 선형에 두는 자명한 구현이고, 이쪽은 **담는 모양이 이미 나무**라 무작위
 * 입력에서는 계약을 지키는 것처럼 보인다. 마디 수만큼 깊은 나무가 들어오면 그때 걸린다.
 *
 * 빠진 것은 하나다 — 뿌리를 찾으러 걸어 올라간 길을 **그대로 두고 돌아온다.** 접어 두면
 * 다음 호출이 싸지지만 접지 않으므로 같은 길을 매번 다시 걷는다. 상각 보장이
 * 「접근한 자리는 반드시 고쳐 쓴다」에서만 나온다는 것의 반대편 실물이다(불변 사실 101).
 *
 * **그래서 이 fixture 는 시나리오를 가른다.** 무작위로 이어 붙인 숲에서는 깊이가 얕아
 * 통과하고, 사슬에서만 걸린다. 같은 행을 겨눈 시나리오를 적대·비적대로 둘 두는 것이
 * 무엇을 사는지가 이 fixture 하나로 보인다(불변 사실 118).
 */

export class UnsplayedForest {
  readonly #n: number;
  readonly #parent: (number | null)[];

  __cost = 0;

  constructor(n: number) {
    this.#n = n;
    this.#parent = Array.from({ length: n }, () => null as number | null);
  }

  link(u: number, v: number): boolean {
    this.#bounds(u);
    this.#bounds(v);
    if (u === v) return false;
    if (this.#rootOf(u) === this.#rootOf(v)) return false;
    this.#makeRoot(u);
    this.#parent[u] = v;
    return true;
  }

  cut(u: number, v: number): boolean {
    this.#bounds(u);
    this.#bounds(v);
    if (u === v) return false;
    this.__cost += 1;
    if (this.#parent[u] === v) {
      this.#parent[u] = null;
      return true;
    }
    if (this.#parent[v] === u) {
      this.#parent[v] = null;
      return true;
    }
    return false;
  }

  connected(u: number, v: number): boolean {
    this.#bounds(u);
    this.#bounds(v);
    if (u === v) return true;
    return this.#rootOf(u) === this.#rootOf(v);
  }

  #bounds(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.#n) {
      throw new RangeError(
        `마디 번호는 [0, ${this.#n}) 안이어야 한다 — 받은 값은 ${index} 다`,
      );
    }
  }

  /** 부모를 따라 끝까지 올라간다. 밟은 자리를 고치지 않는 것이 이 fixture 의 결함이다. */
  #rootOf(node: number): number {
    let at = node;
    for (;;) {
      this.__cost += 1;
      const above = this.#parent[at];
      if (above === null || above === undefined) return at;
      at = above;
    }
  }

  /** 뿌리까지의 부모 방향을 뒤집어 `node` 를 뿌리로 세운다. */
  #makeRoot(node: number): void {
    let previous: number | null = null;
    let at: number | null = node;
    while (at !== null) {
      this.__cost += 1;
      const above: number | null = this.#parent[at] ?? null;
      this.#parent[at] = previous;
      previous = at;
      at = above;
    }
  }
}
