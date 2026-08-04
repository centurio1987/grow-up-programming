/**
 * 결함 fixture — 정렬 배열로 만든 multiset.
 *
 * 진단된 A급 결함의 형태 그 자체다. `add` 가 이진 탐색으로 위치를 찾으므로 **비교 횟수는**
 * O(log n) 이지만, 배열 이동이 O(n) 이라 실제 작업량은 O(n) 이다. 계약은
 * `expected O(log n)` 을 요구한다.
 *
 * 이 fixture 가 두 모드를 갖는 이유는 계측 경로 둘을 각각 시험하기 위해서다.
 *
 * - `honest: true` — 이동량을 정직하게 보고한다. **성장률 판정**이 잡는다.
 * - `honest: false` — 연산당 1 만 보고한다. 성장률로는 안 잡히고, 하네스가 밖에서 센
 *   비교자 호출 횟수와의 **하한 검증**이 잡는다.
 *
 * 두 번째 모드가 있는 이유는 자기 보고 계측의 구멍이 실재하기 때문이다. 주입점이 있는
 * 구조에서는 하한 검증이 그 구멍을 좁힌다 — 닫지는 못한다(§규약2).
 */
export class SortedArrayMultiset<T> {
  #items: T[] = [];
  #compareWith: (a: T, b: T) => number;
  #honest: boolean;

  __cost = 0;

  constructor(
    comparator?: (a: T, b: T) => number,
    options: { honest?: boolean } = {},
  ) {
    this.#compareWith = comparator ?? defaultComparator;
    this.#honest = options.honest ?? true;
  }

  add(item: T): void {
    const at = this.#lowerBound(item);
    this.#charge(this.#items.length - at + 1);
    this.#items.splice(at, 0, item);
  }

  delete(item: T): boolean {
    const at = this.#lowerBound(item);
    const found =
      at < this.#items.length &&
      this.#compare(this.#items[at] as T, item) === 0;
    if (!found) return false;
    this.#charge(this.#items.length - at);
    this.#items.splice(at, 1);
    return true;
  }

  deleteAll(item: T): number {
    const from = this.#lowerBound(item);
    const to = this.#upperBound(item);
    if (from === to) return 0;
    this.#charge(this.#items.length - from);
    this.#items.splice(from, to - from);
    return to - from;
  }

  has(item: T): boolean {
    return this.count(item) > 0;
  }

  count(item: T): number {
    return this.#upperBound(item) - this.#lowerBound(item);
  }

  min(): T | null {
    this.#charge(1);
    return this.#items.length === 0 ? null : (this.#items[0] as T);
  }

  max(): T | null {
    this.#charge(1);
    return this.#items.length === 0
      ? null
      : (this.#items[this.#items.length - 1] as T);
  }

  size(): number {
    this.#charge(1);
    return this.#items.length;
  }

  toArray(): T[] {
    this.#charge(this.#items.length);
    return [...this.#items];
  }

  #charge(work: number): void {
    this.__cost += this.#honest ? work : 1;
  }

  /**
   * 비교자를 호출한다. 정직 모드에서만 `__cost` 에 반영한다 — 부정직 모드는 비교를
   * 세지 않으므로, 하네스가 밖에서 센 호출 횟수보다 자기 보고가 작아진다.
   */
  #compare(a: T, b: T): number {
    if (this.#honest) this.__cost += 1;
    return this.#compareWith(a, b);
  }

  #lowerBound(item: T): number {
    let lo = 0;
    let hi = this.#items.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.#compare(this.#items[mid] as T, item) < 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  #upperBound(item: T): number {
    let lo = 0;
    let hi = this.#items.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.#compare(this.#items[mid] as T, item) <= 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
}

function defaultComparator<T>(a: T, b: T): number {
  const left = a as unknown as number;
  const right = b as unknown as number;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
