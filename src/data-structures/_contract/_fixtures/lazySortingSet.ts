/**
 * 결함 fixture — 순서를 유지하지 않고 물어볼 때마다 만드는 집합.
 *
 * `tree/binarySearchTree` 계약(정렬 집합 · 여덟 행 전부 `worst O(n)`)에 대한 결함이고,
 * **네 축이 전부 통과시킨다.** 결함 fixture 가 전부 걸리기를 기대하지 않는다는 것의
 * 실물이다(불변 사실 62).
 *
 * **계약의 어느 문장을 어기는가.** 필요충분조건의 비용 조건이다 — *"어느 한 행이라도
 * 원소 수에 비례하는 비용을 넘으면 이 구조가 아니다"*. 넣기와 관측을 번갈아 부르면 관측
 * 하나가 $n \log n$ 에 비례하므로 그 조건을 어긴다. 계약이 그 계열을 지목해서 배제하고
 * 있는데도 어느 축도 잡지 못한다.
 *
 * **왜 안 잡히는가.** 로그 인수 하나는 축3의 해상도 아래에 있다(불변 사실 53). 사다리가
 * 4배 간격이라 $n\log n$ 의 기대 비율이 4.8 이고 `O(n)` 의 허용 구간이 회귀 수준에서
 * [1.6, 6.4] 이므로, 이 fixture 의 실측이 그 안에 들어앉는다. 시나리오를 다시 지어도
 * 마찬가지다 — **막는 것이 입력이 아니라 판정 규격이라 Rust 에서도 똑같이 안 보인다**
 * (불변 사실 45 의 셋 중 「아무것도 안 막으므로 가이드」).
 *
 * 축1·축2가 통과시키는 이유는 더 단순하다 — **답이 맞다.** 정렬을 미뤄 두었을 뿐이고,
 * 관측하는 시점에는 늘 정렬해 두므로 두 관측 경로가 갈릴 일도 없다.
 */
export class LazySortingSet<T> {
  #items: T[] = [];
  #sorted = true;
  readonly #compare: (a: T, b: T) => number;

  __cost = 0;

  constructor(comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  /** 뒤에 붙이기만 한다. 중복 검사는 훑어서 하므로 그 자체는 계약 안이다. */
  insert(item: T): void {
    for (let at = 0; at < this.#items.length; at++) {
      this.__cost += 1;
      if (this.#compare(this.#items[at] as T, item) === 0) return;
    }
    this.#items.push(item);
    this.#sorted = false;
  }

  delete(item: T): boolean {
    for (let at = 0; at < this.#items.length; at++) {
      this.__cost += 1;
      if (this.#compare(this.#items[at] as T, item) === 0) {
        this.#items.splice(at, 1);
        return true;
      }
    }
    return false;
  }

  has(item: T): boolean {
    this.#ensureSorted();
    for (let at = 0; at < this.#items.length; at++) {
      this.__cost += 1;
      if (this.#compare(this.#items[at] as T, item) === 0) return true;
    }
    return false;
  }

  min(): T | null {
    this.#ensureSorted();
    this.__cost += 1;
    return this.#items.length === 0 ? null : (this.#items[0] as T);
  }

  max(): T | null {
    this.#ensureSorted();
    this.__cost += 1;
    return this.#items.length === 0
      ? null
      : (this.#items[this.#items.length - 1] as T);
  }

  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.#compare(low, high) > 0) return out;
    this.#ensureSorted();
    for (const value of this.#items) {
      this.__cost += 1;
      if (this.#compare(value, low) >= 0 && this.#compare(value, high) <= 0)
        out.push(value);
    }
    return out;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }

  toArray(): T[] {
    this.#ensureSorted();
    this.__cost += this.#items.length;
    return [...this.#items];
  }

  /** 여기가 결함이다 — 순서를 유지하는 대신 관측 시점에 만든다. */
  #ensureSorted(): void {
    if (this.#sorted) return;
    const n = this.#items.length;
    if (n > 1) this.__cost += Math.ceil(n * Math.log2(n));
    this.#items.sort(this.#compare);
    this.#sorted = true;
  }
}
