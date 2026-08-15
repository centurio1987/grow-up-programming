/**
 * 결함 fixture — 교집합에서 **작은 쪽을 골라 훑는** 집합.
 *
 * 대상 계약: `hash/hashSet`.
 *
 * **이 fixture 는 계약을 어기지 않는다.** 담는 모양도 나머지 일곱 행도 정본 그대로이고,
 * 갈리는 것은 `intersection` 하나다 — 두 크기를 견주어 **작은 쪽을 훑고 큰 쪽에 묻는다.**
 * 그러면 호출 하나의 비용이 `min(n, m)` 이라 계약이 적은 `O(n)` 아래에 있다. 상한은 상한
 * 이므로 이것은 위반이 아니다.
 *
 * **그런데 축3이 걸러 낸다.** 축3이 판정하는 것은 「상한을 지키는가」가 아니라 「계약이 적어
 * 놓은 성장 계급인가」이기 때문이다(불변 사실 49 · §규약2 「축3은 상한이 아니라 성장 계급을
 * 판정한다」). 수신자를 키우는 교집합 시나리오에서 인자가 상수 크기이므로 이 구현의 비용이
 * 상수로 남고, `O(n)` 이 기대하는 4.00 대신 1.00 이 나온다. **인자를 키우는 쪽은 통과한다.**
 *
 * **이 fixture 가 지어낸 설계가 아니라는 것이 요점이다.** JS 가 내주는 `Set` 이 정확히
 * 이렇게 한다 — 크기 3 인 집합에 크기 100만짜리 집합 같은 것을 인자로 주면 인자의 `has` 를
 * 세 번 부르고, 반대로 주면 인자의 `keys()` 를 훑는다(둘 다 실행해 확인했다). 그래서 이
 * fixture 는 「계약의 `n` 을 수신자로 정한 결정이 무엇을 배제하는가」의 실물이고, 그 배제를
 * 정당화하는 근거는 계약 헤더가 적는다(`hash/hashSet/hashSet.ts`).
 *
 * 축3 계측 단위는 정본과 같다 — *"자리 하나를 지나갈 때마다 1"*(§규약2 계측 단위). 안에 든
 * 정본이 세는 값에 **새 집합을 짓는 몫**을 더해 보고한다.
 */

import { HashSet } from "../../hash/hashSet/_reference/hashSet";

export class SmallerSideSetOfKeys<T> {
  readonly #spread: (item: T) => number;
  readonly #inner: HashSet<T>;
  #extra = 0;

  constructor(spread: (item: T) => number) {
    this.#spread = spread;
    this.#inner = new HashSet<T>(spread);
  }

  get __cost(): number {
    return this.#inner.__cost + this.#extra;
  }

  add(item: T): void {
    this.#inner.add(item);
  }

  has(item: T): boolean {
    return this.#inner.has(item);
  }

  delete(item: T): boolean {
    return this.#inner.delete(item);
  }

  size(): number {
    return this.#inner.size();
  }

  values(): T[] {
    return this.#inner.values();
  }

  union(other: SmallerSideSetOfKeys<T>): SmallerSideSetOfKeys<T> {
    const made = new SmallerSideSetOfKeys<T>(this.#spread);
    for (const item of this.values()) made.add(item);
    for (const item of other.values()) made.add(item);
    this.#extra += made.__cost;
    return made;
  }

  /** 두 크기를 견주고 작은 쪽을 훑는다. 답은 정본과 같고 비용의 `n` 이 `min(n, m)` 이다. */
  intersection(other: SmallerSideSetOfKeys<T>): SmallerSideSetOfKeys<T> {
    const made = new SmallerSideSetOfKeys<T>(this.#spread);
    if (this.size() <= other.size()) {
      for (const item of this.values()) {
        if (other.has(item)) made.add(item);
      }
    } else {
      for (const item of other.values()) {
        if (this.has(item)) made.add(item);
      }
    }
    this.#extra += made.__cost;
    return made;
  }

  difference(other: SmallerSideSetOfKeys<T>): SmallerSideSetOfKeys<T> {
    const made = new SmallerSideSetOfKeys<T>(this.#spread);
    for (const item of this.values()) {
      if (!other.has(item)) made.add(item);
    }
    this.#extra += made.__cost;
    return made;
  }
}
