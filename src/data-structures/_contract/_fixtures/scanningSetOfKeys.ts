/**
 * 결함 fixture — 원소를 **배열 하나에 차례로 담고 훑는** 집합.
 *
 * 대상 계약: `hash/hashSet`.
 *
 * **동작은 옳다.** 축1·축2를 전부 통과한다. 어기는 것은 상한이다 — 담기·찾기·지우기가 담긴
 * 수에 비례한다. 계약이 `expected O(1)` 을 적은 이유가 이 설계를 배제하는 것이므로, 이
 * fixture 는 **계약이 무엇을 배제하는지의 가장 단순한 표본**이다.
 *
 * **집합 연산 셋은 정본과 같은 모양으로 짓는다** — 수신자를 훑고 인자에 묻는다. 묻는 일이
 * 여기서는 훑기라서, 인자를 키우는 시나리오에서 교집합·차집합이 인자의 크기에 비례한다.
 * 모양이 아니라 **묻는 값이 상수가 아닌 것**이 그 행을 무너뜨린다는 뜻이고, 그래서 이
 * fixture 는 인자 쪽 시나리오 둘에서 걸린다. 합집합 둘은 통과한다 — 그 행은 인자의 크기를
 * 상한에 이미 담고 있기 때문이다.
 *
 * 원소를 견줄 수 있어야 성립하는 설계가 아니다(`Object.is` 만 쓴다). 펴기를 받기는 하지만
 * 한 번도 부르지 않는다 — 계약이 펴기를 요구하는 것은 상한 때문이지 의미 때문이 아니라는
 * 사실의 다른 쪽 면이다.
 *
 * 축3 계측 단위는 정본과 같다 — *"자리 하나를 지나갈 때마다 1"*(§규약2 계측 단위). 배열의
 * 칸 하나를 견주는 것이 1 이다.
 */

export class ScanningSetOfKeys<T> {
  #items: T[] = [];

  __cost = 0;

  constructor(_spread: (item: T) => number) {}

  add(item: T): void {
    if (this.#indexOf(item) >= 0) return;
    this.#items.push(item);
  }

  has(item: T): boolean {
    return this.#indexOf(item) >= 0;
  }

  delete(item: T): boolean {
    const at = this.#indexOf(item);
    if (at < 0) return false;
    this.#items[at] = this.#items[this.#items.length - 1] as T;
    this.#items.pop();
    return true;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }

  values(): T[] {
    const found: T[] = [];
    for (const item of this.#items) {
      this.__cost += 1;
      found.push(item);
    }
    return found;
  }

  union(other: ScanningSetOfKeys<T>): ScanningSetOfKeys<T> {
    const made = new ScanningSetOfKeys<T>(() => 0);
    for (const item of this.values()) made.#items.push(item);
    for (const item of other.values()) {
      if (!this.has(item)) made.#items.push(item);
    }
    this.__cost += made.__cost;
    return made;
  }

  intersection(other: ScanningSetOfKeys<T>): ScanningSetOfKeys<T> {
    const made = new ScanningSetOfKeys<T>(() => 0);
    for (const item of this.values()) {
      if (other.has(item)) made.#items.push(item);
    }
    this.__cost += made.__cost;
    return made;
  }

  difference(other: ScanningSetOfKeys<T>): ScanningSetOfKeys<T> {
    const made = new ScanningSetOfKeys<T>(() => 0);
    for (const item of this.values()) {
      if (!other.has(item)) made.#items.push(item);
    }
    this.__cost += made.__cost;
    return made;
  }

  #indexOf(item: T): number {
    for (let at = 0; at < this.#items.length; at++) {
      this.__cost += 1;
      if (Object.is(this.#items[at] as T, item)) return at;
    }
    return -1;
  }
}
