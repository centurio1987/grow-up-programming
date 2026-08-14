/**
 * `tree/orderStatisticTree` 계약 스위트 실행부(규약2).
 *
 * 동작 계약은 `./orderStatisticTree.contract.ts` 가 덮는다. 여기 손으로 쓴 테스트는 **주입
 * 정책**뿐이다 — 계약 스위트는 원소 타입 하나(`number`)로 돌기 때문에 "비교자를 갈면
 * 위치 좌표계가 함께 갈리는가", "`number` 밖의 `T` 에 비교자 주입이 실제로 필수인가"를
 * 담지 못한다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 고정 n 의 임계값이 재는 것은 복잡도 등급이
 * 아니라 그 기계의 상수다. 자리는 축3이다.
 */

import { describe, expect, test } from "bun:test";
import { runContract } from "../../_contract/runContract";
import { OrderStatisticTree as Reference } from "./_reference/orderStatisticTree";
import { OrderStatisticTree } from "./orderStatisticTree";
import {
  type OrderStatisticTreeContract,
  orderStatisticTreeContract,
} from "./orderStatisticTree.contract";

/** 학습자 구현. 계측기가 없으므로 축1·축2만 돈다. */
runContract(
  () => new OrderStatisticTree<number>(),
  orderStatisticTreeContract,
  { label: "스텁" },
);

/** 정본. 비교자를 주입받는 구조라 하네스가 비교 횟수를 밖에서 셀 수 있다. */
runContract(() => new Reference<number>(), orderStatisticTreeContract, {
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
  make: <T>(
    comparator?: (a: T, b: T) => number,
  ) => OrderStatisticTreeContract<T>,
): void {
  describe(`OrderStatisticTree 주입 정책 [${label}]`, () => {
    test("비교자를 갈면 위치 좌표계가 함께 갈린다 — 순서는 주입자가 정한다", () => {
      const descending = make<number>((a, b) => b - a);
      for (const value of [1, 3, 2]) descending.add(value);
      expect(descending.toArray()).toEqual([3, 2, 1]);
      // 순서를 뒤집으면 「앞선다」의 뜻도 뒤집힌다. 위치는 비교자가 정하는 것이지 값의
      // 크기가 정하는 것이 아니다.
      expect(descending.at(0)).toBe(3);
      expect(descending.rankOf(2)).toBe(1);
    });

    test("number 밖의 T 도 비교자를 주면 위치 질의가 성립한다", () => {
      const byLength = make<string>(
        (a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0),
      );
      for (const value of ["banana", "apple", "fig", "apple"])
        byLength.add(value);
      expect(byLength.toArray()).toEqual(["fig", "apple", "apple", "banana"]);
      expect(byLength.at(1)).toBe("apple");
      expect(byLength.rankOf("banana")).toBe(3);
      expect(byLength.count("apple")).toBe(2);
    });
  });
}

checkInjectionPolicy(
  "스텁",
  (comparator) => new OrderStatisticTree(comparator),
);
checkInjectionPolicy("정본", (comparator) => new Reference(comparator));
