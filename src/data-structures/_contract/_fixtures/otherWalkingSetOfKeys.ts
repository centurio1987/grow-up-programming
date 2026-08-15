/**
 * 결함 fixture — 교집합과 차집합을 **인자 쪽에서 짓는** 집합.
 *
 * 대상 계약: `hash/hashSet`.
 *
 * **동작은 옳다.** 축1·축2를 전부 통과한다. 담는 모양은 정본 그대로이고(같은 파일을 안에
 * 들고 있다) 갈리는 것은 **두 메서드뿐**이다.
 *
 * - `intersection` — 인자를 훑고 수신자에 묻는다. 답은 같다(교집합은 대칭이다).
 * - `difference` — 수신자를 통째로 베낀 뒤 인자의 원소를 하나씩 지운다. 답은 같다.
 *
 * **어기는 것은 상한이고, 어기는 자리가 인자의 크기다.** 계약은 두 행의 `n` 을 **수신자의
 * 크기**로 적었으므로 인자를 키워도 비용이 자라면 안 된다. 이 구현은 자란다 — 그래서 인자를
 * 키우는 시나리오 둘에서 걸린다. 수신자를 키우는 쪽에서는 `difference` 가 통과하고
 * (베끼는 몫이 이미 수신자에 비례한다) `intersection` 이 **계급 아래로 걸린다** — 인자가
 * 상수 크기라 비용이 상수로 남기 때문이고, 그 실패는 계약 위반이 아니다(불변 사실 49).
 *
 * **합집합은 정본 그대로 둔다.** 그 행은 인자의 크기를 상한에 이미 담고 있어서 어느 쪽에서
 * 짓든 계급이 같고, 갈리지 않는 자리를 함께 바꾸면 「무엇이 무엇을 걸었는가」가 흐려진다.
 *
 * 축3 계측 단위는 정본과 같다 — *"자리 하나를 지나갈 때마다 1"*(§규약2 계측 단위). 안에 든
 * 정본이 세는 값에 **새 집합을 짓는 몫**을 더해 보고한다.
 */

import { HashSet } from "../../hash/hashSet/_reference/hashSet";

export class OtherWalkingSetOfKeys<T> {
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

  union(other: OtherWalkingSetOfKeys<T>): OtherWalkingSetOfKeys<T> {
    const made = new OtherWalkingSetOfKeys<T>(this.#spread);
    for (const item of this.values()) made.add(item);
    for (const item of other.values()) made.add(item);
    this.#extra += made.__cost;
    return made;
  }

  /** 인자를 훑고 수신자에 묻는다. 답은 정본과 같고 비용의 `n` 이 반대쪽이다. */
  intersection(other: OtherWalkingSetOfKeys<T>): OtherWalkingSetOfKeys<T> {
    const made = new OtherWalkingSetOfKeys<T>(this.#spread);
    for (const item of other.values()) {
      if (this.has(item)) made.add(item);
    }
    this.#extra += made.__cost;
    return made;
  }

  /** 수신자를 베낀 뒤 인자의 원소를 지운다. 답은 정본과 같고 비용에 인자의 크기가 붙는다. */
  difference(other: OtherWalkingSetOfKeys<T>): OtherWalkingSetOfKeys<T> {
    const made = new OtherWalkingSetOfKeys<T>(this.#spread);
    for (const item of this.values()) made.add(item);
    for (const item of other.values()) made.delete(item);
    this.#extra += made.__cost;
    return made;
  }
}
