/**
 * 결함 fixture — 정렬 배열로 만든 집합.
 *
 * `tree/redBlackTree` 계약(정렬 집합 · 여덟 행 전부 `worst O(log n)`)에 대한 결함이다.
 * **동작은 옳다** — 축1·축2는 전부 통과하고 축3만이 잡는다.
 *
 * 자리를 이진 탐색으로 찾으므로 **비교 횟수는** 로그이지만, 넣고 지울 때 뒤쪽을 통째로
 * 미는 비용이 원소 수에 비례한다. 조회 쪽(`has`·`min`·`max`·`range`·`size`·`toArray`)은
 * 전부 계약 안이라 **갈리는 자리가 갱신 둘뿐이다.**
 *
 * **오름차순 넣기에서는 통과한다.** 늘 뒤에 붙이므로 밀 것이 없기 때문이다. 같은 입력이
 * 균형 잡지 않는 트리에는 최악이었다 — 시나리오를 하나만 두면 둘 중 하나를 놓친다
 * (불변 사실 24·57).
 */
export class SortedArraySet<T> {
  #items: T[] = [];
  readonly #compare: (a: T, b: T) => number;

  __cost = 0;

  constructor(comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  insert(item: T): void {
    const at = this.#lowerBound(item);
    if (
      at < this.#items.length &&
      this.#compare(this.#items[at] as T, item) === 0
    )
      return;
    // 뒤쪽을 한 칸씩 민다. 이 자리가 계약을 어긴다.
    this.__cost += this.#items.length - at;
    this.#items.splice(at, 0, item);
  }

  delete(item: T): boolean {
    const at = this.#lowerBound(item);
    if (
      at >= this.#items.length ||
      this.#compare(this.#items[at] as T, item) !== 0
    )
      return false;
    this.__cost += this.#items.length - at;
    this.#items.splice(at, 1);
    return true;
  }

  has(item: T): boolean {
    const at = this.#lowerBound(item);
    return (
      at < this.#items.length && this.#compare(this.#items[at] as T, item) === 0
    );
  }

  min(): T | null {
    this.__cost += 1;
    return this.#items.length === 0 ? null : (this.#items[0] as T);
  }

  max(): T | null {
    this.__cost += 1;
    return this.#items.length === 0
      ? null
      : (this.#items[this.#items.length - 1] as T);
  }

  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.#compare(low, high) > 0) return out;
    let at = this.#lowerBound(low);
    while (at < this.#items.length) {
      const value = this.#items[at] as T;
      if (this.#compare(value, high) > 0) break;
      this.__cost += 1;
      out.push(value);
      at += 1;
    }
    return out;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }

  toArray(): T[] {
    this.__cost += this.#items.length;
    return [...this.#items];
  }

  /** `item` 이하가 끝나는 자리. 비교 횟수는 로그다. */
  #lowerBound(item: T): number {
    let low = 0;
    let high = this.#items.length;
    while (low < high) {
      this.__cost += 1;
      const mid = (low + high) >>> 1;
      if (this.#compare(this.#items[mid] as T, item) < 0) low = mid + 1;
      else high = mid;
    }
    return low;
  }
}
