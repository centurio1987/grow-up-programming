/**
 * `range-query/segmentTree` 계약 스위트 실행부(규약2).
 *
 * `runContract` 호출과, 계약 스위트가 담지 못하는 **주입 정책**만 둔다. 무엇을 검사하는지는
 * `./segmentTree.contract.ts` 에 있고, 계약 자체는 `./segmentTree.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 팩토리가 껍데기를 씌우는 것은 이 구조가 초기 수열을 생성자로 받기 때문이다
 * (`./segmentTree.contract.ts` 헤더의 껍데기 설명 — 불변 사실 83).
 *
 * **계측 경로가 `injected` 다.** 이 계약에는 주입점이 있으므로 하네스가 결합 호출 횟수를
 * 밖에서 셀 수 있고, 자기 보고 `__cost` 가 그 수보다 작으면 보고가 거짓이라 실패한다
 * (§규약2 「계측 — `__cost` 는 계약이 아니다」의 하한 검증). 같은 트랙의 `fenwickTree` 는
 * 주입점이 없어 이 검증이 성립하지 않는다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 고정 n 의 임계값이 재는 것은 복잡도 등급이
 * 아니라 그 기계의 상수다. 자리는 축3이다.
 */

import { describe, expect, test } from "bun:test";
import { runContract } from "../../_contract/runContract";
import { SegmentTree as Reference } from "./_reference/segmentTree";
import { SegmentTree } from "./segmentTree";
import {
  firstNonZero,
  IDENTITY,
  type SegmentTreeContract,
  Sized,
  segmentTreeContract,
} from "./segmentTree.contract";

runContract(
  () => new Sized((values) => new SegmentTree(values, firstNonZero, IDENTITY)),
  segmentTreeContract,
  { label: "스텁" },
);

runContract(
  () => new Sized((values) => new Reference(values, firstNonZero, IDENTITY)),
  segmentTreeContract,
  {
    label: "정본",
    cost: {
      kind: "injected",
      make: (tick) =>
        new Sized(
          (values) =>
            new Reference(
              values,
              (a, b) => {
                tick();
                return firstNonZero(a, b);
              },
              IDENTITY,
            ),
        ),
    },
  },
);

/**
 * 주입 정책은 계약의 일부다(규약1). 계약 스위트는 결합 **하나**로 도는데
 * (§규약2 「원소 타입이 하나다」) 계약이 요구하는 것은 **임의의** 결합이므로, 같은 구현이
 * 다른 결합에서도 서는지는 여기서 본다.
 */
function checkInjectionPolicy(
  label: string,
  make: (
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
  ) => SegmentTreeContract,
): void {
  describe(`SegmentTree 주입 정책 [${label}]`, () => {
    const values = [5, 3, 9, 1, 7, 2];

    test("되돌리는 값이 없는 결합 — 최솟값", () => {
      const tree = make(
        values,
        (a, b) => Math.min(a, b),
        Number.POSITIVE_INFINITY,
      );
      expect(tree.query(0, 6)).toBe(1);
      expect(tree.query(0, 3)).toBe(3);
      expect(tree.query(4, 6)).toBe(2);
      tree.update(3, 8);
      expect(tree.query(0, 6)).toBe(2);
      expect(tree.query(3, 4)).toBe(8);
    });

    test("되돌리는 값이 있는 결합 — 덧셈", () => {
      const tree = make(values, (a, b) => a + b, 0);
      expect(tree.query(0, 6)).toBe(27);
      expect(tree.query(1, 4)).toBe(13);
      tree.update(2, 0);
      expect(tree.query(1, 4)).toBe(4);
    });

    test("빈 구간의 답은 주입받은 항등원이다", () => {
      expect(
        make(values, (a, b) => Math.max(a, b), Number.NEGATIVE_INFINITY).query(
          2,
          2,
        ),
      ).toBe(Number.NEGATIVE_INFINITY);
      expect(make(values, (a, b) => a * b, 1).query(0, 0)).toBe(1);
      expect(make([], (a, b) => a + b, 0).query(0, 0)).toBe(0);
    });

    test("교환적이지 않은 결합에서 자리의 순서가 지켜진다", () => {
      // 왼쪽에서 처음 만나는 0 아닌 값. `1 ∘ 2 = 1` 인데 `2 ∘ 1 = 2` 다.
      const tree = make([0, 0, 0, 5, 0, 0, 9, 0], firstNonZero, IDENTITY);
      expect(tree.query(1, 7)).toBe(5);
      expect(tree.query(4, 8)).toBe(9);
      tree.update(3, 0);
      expect(tree.query(1, 7)).toBe(9);
    });
  });
}

checkInjectionPolicy(
  "스텁",
  (values, combine, identity) => new SegmentTree(values, combine, identity),
);
checkInjectionPolicy(
  "정본",
  (values, combine, identity) => new Reference(values, combine, identity),
);
