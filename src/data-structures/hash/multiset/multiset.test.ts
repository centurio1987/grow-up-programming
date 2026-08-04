/**
 * `hash/multiset` 계약 스위트 실행부(규약2).
 *
 * 동작 계약은 `multiset.contract.ts` 가 덮는다. 여기 남은 손으로 쓴 테스트는 **주입 정책**
 * 뿐이다 — 계약 스위트는 원소 타입 하나(`number`)로 돌기 때문에 "비교자를 갈면 순서가
 * 갈리는가", "`number` 밖의 `T` 에 비교자 주입이 실제로 필수인가"를 담지 못한다.
 *
 * 없앤 것 둘.
 * - **벽시계 성능 테스트.** 고정 n 의 `performance.now()` 임계값은 복잡도 등급이 아니라
 *   그 기계의 상수를 잰다(불변 사실 7). 자리는 축3이 가져갔다.
 * - **슬라이딩 윈도우 중앙값 시뮬레이션.** 활용 사례의 자리는 가이드다(규약1 금지 5번).
 *   단정 내용 자체는 축1의 무작위 교차검증에 포함된다.
 */

import { describe, expect, test } from "bun:test";
import { runContract } from "../../_contract/runContract";
import { Multiset as Reference } from "./_reference/multiset";
import { Multiset } from "./multiset";
import { type MultisetContract, multisetContract } from "./multiset.contract";

/** 학습자 구현. 계측기가 없으므로 축1·축2만 돈다. */
runContract(() => new Multiset<number>(), multisetContract, { label: "스텁" });

/** 정본. 비교자를 주입받는 구조라 하네스가 비교 횟수를 밖에서 셀 수 있다. */
runContract(() => new Reference<number>(), multisetContract, {
  label: "정본",
  cost: {
    kind: "injected",
    make: (tick) =>
      new Reference<number>((a, b) => {
        tick();
        return a - b;
      }),
  },
});

/**
 * 주입 정책은 계약의 일부다(규약1). 계약 스위트가 원소 타입 하나로 도는 동안은 여기서 본다.
 */
function checkInjectionPolicy(
  label: string,
  make: <T>(comparator?: (a: T, b: T) => number) => MultisetContract<T>,
): void {
  describe(`Multiset 주입 정책 [${label}]`, () => {
    test("비교자를 갈면 순서가 갈린다 — 순서는 주입자가 정한다", () => {
      const descending = make<number>((a, b) => b - a);
      for (const value of [1, 3, 2]) descending.add(value);
      expect(descending.toArray()).toEqual([3, 2, 1]);
    });

    test("number 밖의 T 도 비교자를 주면 정렬 순서가 성립한다", () => {
      const byLength = make<string>(
        (a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0),
      );
      for (const value of ["banana", "apple", "fig", "apple"])
        byLength.add(value);
      expect(byLength.toArray()).toEqual(["fig", "apple", "apple", "banana"]);
      expect(byLength.count("apple")).toBe(2);
    });
  });
}

checkInjectionPolicy("스텁", (comparator) => new Multiset(comparator));
checkInjectionPolicy("정본", (comparator) => new Reference(comparator));
