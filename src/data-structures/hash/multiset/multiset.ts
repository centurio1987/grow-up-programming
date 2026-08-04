/**
 * Multiset — 같은 값을 여러 벌 담으면서 전순서를 유지하는 컨테이너.
 *
 * **목적.** 원소의 중복 다중도(multiplicity)와 정렬 순서를 동시에 유지하면서, 삽입·삭제·
 * 다중도 조회를 원소 수의 로그 비용으로 제공하는 것.
 * 위치 기반 접근(k 번째 원소·순위 조회)은 이 계약에 없다.
 *
 * **불변식.** 공개 연산만으로 관측 가능하고, 각 연산이 국소적으로 옳아도 깨질 수 있는 성질
 * 셋이다. 어떤 연산 뒤에도 성립해야 한다.
 * 1. `toArray()`는 주입된 비교자 기준 비내림차순이다.
 * 2. `toArray().length === size()`.
 * 3. 임의의 `x`에 대해 `count(x)`는 `toArray()` 안에서 `x`와 동등한(비교자가 0) 원소의
 *    개수와 같고, `has(x) === (count(x) > 0)`이다.
 *
 * **연산 계약.** n 은 중복을 포함한 원소 수, k 는 그 연산이 건드리는 동등 원소의 수다.
 *
 * | 연산 | 의미 | 상한 | 한정자 |
 * |---|---|---|---|
 * | `constructor(comparator?)` | 비교자를 고정한다. 이후 교체할 수 없다 | O(1) | worst |
 * | `add(item)` | `item`의 다중도를 1 늘린다 | O(log n) | expected |
 * | `delete(item)` | 다중도를 1 줄이고 `true`. 없으면 `false`, 상태는 불변 | O(log n) | expected |
 * | `deleteAll(item)` | 동등 원소를 전부 지우고 지운 수를 돌려준다 | O(log n + k) | expected |
 * | `has(item)` | `count(item) > 0` 과 같다 | O(log n) | expected |
 * | `count(item)` | 동등 원소의 수 | O(log n) | expected |
 * | `min()` / `max()` | 비교자 기준 최소·최대. 비어 있으면 `null` | O(log n) | expected |
 * | `size()` | 중복을 포함한 총 원소 수 | O(1) | worst |
 * | `toArray()` | 비내림차순 배열의 사본. 반환값을 고쳐도 원본은 바뀌지 않는다 | O(n) | worst |
 *
 * `count`의 상한에 k 가 없는 것은 의도한 계약이다. 동등 원소를 하나씩 세어 답하는 구현은
 * 다중도에 비례하는 비용을 쓰므로 이 계약을 만족하지 않는다.
 *
 * **주입 정책.**
 * - `comparator(a, b)`는 음수·0·양수를 돌려주는 전순서여야 한다. 0 은 "동등"을 뜻하고,
 *   동등한 원소끼리의 상대 순서는 계약이 약속하지 않는다.
 * - 미제공 시 기본 비교자는 `<`·`>` 를 쓴다. 따라서 `number`·`string` 밖의 `T`에는 비교자
 *   주입이 **필수다.** 주입 없이 객체를 넣으면 1번 불변식이 깨진다.
 * - 없는 원소의 `delete`는 예외가 아니라 `false`이고, 빈 컨테이너의 `min`·`max`는 `null`이다.
 *   `T`에 `null`이 섞이면 "비어 있음"과 구분되지 않는다.
 *
 * **검증 등급.** `complexity`.
 * O(log n) 삽입·삭제 상한이 자명한 구현으로 달성되지 않는다 — 정렬 배열은 삽입이 O(n)이고,
 * 해시는 1번 불변식을 주지 못한다. 상한을 지키려면 비자명한 설계가 필요하다.
 *
 * **필요충분조건.**
 * - 의미: 순서와 다중도 중 하나라도 버리면 multiset 이 아니다. 순서를 버리면 값→개수 맵이고,
 *   다중도를 버리면 정렬 집합이다.
 * - 비용: 둘 다 지키더라도 `add`·`delete`가 n 에 비례하면 multiset 이 아니라 정렬 배열이다.
 */
export class Multiset<T> {
  constructor(comparator?: (a: T, b: T) => number) {
    throw new Error("Not implemented");
  }

  add(item: T): void {
    throw new Error("Not implemented");
  }

  delete(item: T): boolean {
    throw new Error("Not implemented");
  }

  deleteAll(item: T): number {
    throw new Error("Not implemented");
  }

  has(item: T): boolean {
    throw new Error("Not implemented");
  }

  count(item: T): number {
    throw new Error("Not implemented");
  }

  min(): T | null {
    throw new Error("Not implemented");
  }

  max(): T | null {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }

  toArray(): T[] {
    throw new Error("Not implemented");
  }
}
