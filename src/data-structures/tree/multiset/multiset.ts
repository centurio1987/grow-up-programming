/**
 * Multiset — 같은 값을 여러 벌 담으면서 전순서를 유지하는 컨테이너.
 *
 * **목적.** 원소의 중복 다중도(multiplicity)와 정렬 순서를 동시에 유지하면서, 삽입·삭제·
 * 다중도 조회를 원소 수의 로그 비용으로 제공하는 것.
 * 위치 기반 접근(k 번째 원소·순위 조회)은 이 계약에 없다.
 *
 * **불변식.** 셋이다. 셋 다 **관측 경로가 둘**이라서 성립한다 — 구현이 두 경로를 따로
 * 유지할 수 있고, 따로 유지하는 순간 갈린다. 어떤 연산 뒤에도 성립해야 한다.
 * 1. `toArray().length === size()`. 원소 수를 읽는 길이 둘이다.
 * 2. 임의의 `x`에 대해 `count(x)`는 `toArray()` 안에서 `x`와 동등한(비교자가 0) 원소의
 *    개수와 같다. 다중도를 읽는 길이 둘이다.
 * 3. 비어 있지 않으면 `min()`은 `toArray()`의 첫 원소와, `max()`는 마지막 원소와 동등하다.
 *    최소·최대를 읽는 길이 둘이다. `같다`가 아니라 `동등하다`인 것은 동등 원소끼리의 상대
 *    순서를 이 계약이 약속하지 않기 때문이다.
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
 *   주입이 **필수다.** 주입 없이 객체를 넣으면 `toArray()`가 비내림차순을 잃는다.
 * - 없는 원소의 `delete`는 예외가 아니라 `false`이고, 빈 컨테이너의 `min`·`max`는 `null`이다.
 *   `T`에 `null`이 섞이면 "비어 있음"과 구분되지 않는다.
 *
 * **검증 등급.** `complexity`.
 * O(log n) 삽입·삭제 상한이 자명한 구현으로 달성되지 않는다 — 정렬 배열은 삽입이 O(n)이고,
 * 해시는 `toArray()`의 비내림차순을 주지 못한다. 상한을 지키려면 비자명한 설계가 필요하다.
 *
 * **필요충분조건.**
 * - 의미: 순서와 다중도 중 하나라도 버리면 multiset 이 아니다. 순서를 버리면 값→개수 맵이고,
 *   다중도를 버리면 정렬 집합이다.
 * - 비용: 둘 다 지키더라도 `add`·`delete`가 n 에 비례하면 multiset 이 아니라 정렬 배열이다.
 *
 * **검사 못 하는 의무**(`docs/ORD-006-conventions.md` 「원칙 B」 B7).
 *
 * | 의무 | 왜 안 재지나 · 통과하는 알려진 구현 | 보완 작업(무엇 · 누가 · 언제) |
 * |---|---|---|
 * | `add` · `delete` · `deleteAll` · `has` · `count` · `min` · `max` 의 「기대」 | **이 계약의 정본이 무작위를 아예 안 뽑는다** — `./_reference/multiset.ts` 의 `#nextPrio` 는 삽입 순번을 murmur3 로 섞어 우선순위를 만들고, 그 까닭은 재현성이다(§「무작위를 쓰는 정본과 재현성」). 그래서 축3의 시행 축(같은 입력에서 인스턴스를 새로 세워 구현 무작위만 다시 뽑는 축)이 **헛돈다** — 시행을 64 번 돌려도 네 시나리오 × 크기 셋 열두 자리에서 값이 소수점까지 한 자리도 안 갈린다(`KAN-041` `S2` 실측). 그 정본 자신이 통과하는 구현이고, 규약은 「우선순위를 입력의 함수로만 정하는 구현은 이 계약을 어긴다」고 이미 적었다 | **넘긴다 — 정본을 고치는 일이다.** 처분은 둘 중 하나다: 정본이 무작위를 실제로 뽑게 하거나(그러면 재현성 규칙 3 · 5 가 함께 걸린다), 계약의 한정자 읽기를 바꾸거나. 이 카드(`KAN-041`)는 **드러난 사실을 재서 적는 데까지**다 — 정본 수정은 범위 밖이고 **받는 카드는 `KAN-052-RZD45M`** 다(결정론 정본 둘의 처분 · 백로그). 다시 여는 조건은 없다(이미 열려 있다 — §「무작위를 쓰는 정본과 재현성」 「미결 — `tree/multiset` 이 같은 자리에 있다」) |
 * | 드문 큰 비용 | `expected` 통계가 반복 단위 평균의 **중앙값**이라 열 단위 중 다섯까지 튀는 구현이 통과한다 | **하지 않는다** — `tree/treap` 헤더 끝 같은 행과 같은 처분(`KAN-041`). 시행 수로는 안 없어지고, 다시 여는 조건은 「통계를 중앙값이 아닌 것으로 바꾸기로 하면」 |
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
