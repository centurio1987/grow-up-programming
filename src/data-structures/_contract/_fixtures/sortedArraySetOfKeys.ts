/**
 * 결함 fixture — 원소를 **정렬해 두고 이분 탐색**하는 집합. 세 집합 연산은 **병합**이다.
 *
 * 대상 계약: `hash/hashSet`.
 *
 * **동작은 옳다.** 축1·축2를 전부 통과한다. 이 fixture 가 이 계약에서 특별한 이유는 세
 * 집합 연산을 **정본과 같은 계급에 낸다**는 것이다 — 정렬된 두 배열을 병합하면 합집합·
 * 교집합·차집합이 전부 `O(n + m)` 이다. 그래서 필요충분조건의 비용 조건이 말하는 반례가
 * 정확히 이 설계다: 교집합·차집합의 상한에 인자의 크기를 넣어 주면 이 구조가 계약을 전부
 * 만족하고, 그 순간 소속 판정을 상수에 하기로 한 약속이 집합 연산에서 아무 일도 하지 않는다.
 *
 * 걸리는 자리가 셋으로 갈린다.
 *
 * - **담기·지우기**는 자리를 밀어야 해서 담긴 수에 비례한다. 걸린다.
 * - **찾기**는 담긴 수의 로그라 계약의 `O(1)` 을 **어기는데 축3이 그 위반을 못 본다** —
 *   사다리가 4배 간격이면 로그 인수 하나가 비율을 1.2 배밖에 못 바꾼다(불변 사실 62).
 * - **담기가 적대적 시나리오에서는 통과한다.** 겨눈 원소 묶음(`i * 65536`)이 오름차순이라
 *   끼워 넣을 자리가 언제나 맨 뒤이고, 그러면 밀 것이 없어 이분 탐색 비용만 남는다.
 *   무작위 순서로 넣으면 걸린다 — **적대적인 쪽이 늘 더 많이 잡는 것이 아니다**(불변 사실
 *   147 이 사전에서 낸 것과 같은 모양이 집합에서 한 번 더 나온 자리다).
 *
 * 원소를 견줄 수 있어야 성립하는 설계라 `number` 원소 위에서만 돈다. 계약은 그런 요구를
 * 하지 않으므로(주입 정책이 요구하는 것은 펴기 하나다) 이것도 이 설계의 한계이지 계약의
 * 것이 아니다.
 *
 * 축3 계측 단위는 정본과 같다 — *"자리 하나를 지나갈 때마다 1"*(§규약2 계측 단위). 이분
 * 탐색이 자리를 하나 들여다볼 때마다 1 이고, 끼워 넣으며 밀린 자리도 하나에 1 이며, 병합이
 * 한 걸음 나아갈 때마다 1 이다.
 */

function asNumber<T>(item: T): number {
  return item as unknown as number;
}

export class SortedArraySetOfKeys<T> {
  #items: T[] = [];

  __cost = 0;

  constructor(_spread: (item: T) => number) {}

  add(item: T): void {
    const at = this.#lowerBound(item);
    if (at < this.#items.length && Object.is(this.#items[at] as T, item))
      return;
    this.__cost += this.#items.length - at;
    this.#items.splice(at, 0, item);
  }

  has(item: T): boolean {
    const at = this.#lowerBound(item);
    return at < this.#items.length && Object.is(this.#items[at] as T, item);
  }

  delete(item: T): boolean {
    const at = this.#lowerBound(item);
    if (at >= this.#items.length || !Object.is(this.#items[at] as T, item)) {
      return false;
    }
    this.__cost += this.#items.length - at;
    this.#items.splice(at, 1);
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

  union(other: SortedArraySetOfKeys<T>): SortedArraySetOfKeys<T> {
    return this.#merge(other, "union");
  }

  intersection(other: SortedArraySetOfKeys<T>): SortedArraySetOfKeys<T> {
    return this.#merge(other, "intersection");
  }

  difference(other: SortedArraySetOfKeys<T>): SortedArraySetOfKeys<T> {
    return this.#merge(other, "difference");
  }

  /**
   * 정렬된 두 배열을 나란히 밟는다. 세 연산이 갈리는 곳은 **어느 쪽 걸음에서 답에 담는가**
   * 하나뿐이고, 비용은 셋 다 `n + m` 이다.
   */
  #merge(
    other: SortedArraySetOfKeys<T>,
    kind: "union" | "intersection" | "difference",
  ): SortedArraySetOfKeys<T> {
    const mine = this.values();
    const theirs = other.values();
    const made = new SortedArraySetOfKeys<T>(() => 0);

    let left = 0;
    let right = 0;
    while (left < mine.length || right < theirs.length) {
      this.__cost += 1;
      const hasLeft = left < mine.length;
      const hasRight = right < theirs.length;
      const takeLeft =
        hasLeft &&
        (!hasRight ||
          asNumber(mine[left] as T) <= asNumber(theirs[right] as T));
      const takeRight =
        hasRight &&
        (!hasLeft || asNumber(theirs[right] as T) <= asNumber(mine[left] as T));

      if (takeLeft && takeRight) {
        if (kind !== "difference") made.#items.push(mine[left] as T);
        left += 1;
        right += 1;
        continue;
      }
      if (takeLeft) {
        if (kind !== "intersection") made.#items.push(mine[left] as T);
        left += 1;
        continue;
      }
      if (kind === "union") made.#items.push(theirs[right] as T);
      right += 1;
    }
    return made;
  }

  /** 처음으로 `item` 이상이 나오는 자리. */
  #lowerBound(item: T): number {
    let low = 0;
    let high = this.#items.length;
    while (low < high) {
      this.__cost += 1;
      const mid = (low + high) >> 1;
      if (asNumber(this.#items[mid] as T) < asNumber(item)) low = mid + 1;
      else high = mid;
    }
    return low;
  }
}
