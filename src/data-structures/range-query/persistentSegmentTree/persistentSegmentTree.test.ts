/**
 * `range-query/persistentSegmentTree` 계약 스위트 실행부(규약2).
 *
 * `runContract` 호출과, 계약 스위트가 담지 못하는 **주입 정책**만 둔다. 무엇을 검사하는지는
 * `./persistentSegmentTree.contract.ts` 에 있고, 계약 자체는 `./persistentSegmentTree.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다. 축3은 계측기가 붙은
 * 정본에만 돈다.
 *
 * **계측 경로가 `injected` 다**(`range-query/segmentTree` 와 같다). 하네스가 결합 호출 횟수를 밖에서 세고,
 * 자기 보고 `__cost` 가 그보다 작으면 실패한다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 시험의 「10^3 갱신 + 10^3 질의 100ms 이내」가 재는 것은 그
 * 기계의 상수다. 자리는 축3이다.
 */

import { describe, expect, test } from "bun:test";
import { runContract } from "../../_contract/runContract";
import { PersistentSegmentTree as Reference } from "./_reference/persistentSegmentTree";
import { PersistentSegmentTree } from "./persistentSegmentTree";
import {
  firstNonZero,
  IDENTITY,
  type PersistentSegmentTreeContract,
  persistentSegmentTreeContract,
  VersionedSized,
} from "./persistentSegmentTree.contract";

runContract(
  () =>
    new VersionedSized(
      (values) => new PersistentSegmentTree(values, firstNonZero, IDENTITY),
    ),
  persistentSegmentTreeContract,
  { label: "스텁" },
);

runContract(
  () =>
    new VersionedSized(
      (values) => new Reference(values, firstNonZero, IDENTITY),
    ),
  persistentSegmentTreeContract,
  {
    label: "정본",
    cost: {
      kind: "injected",
      make: (tick) =>
        new VersionedSized(
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
 * 주입 정책은 계약의 일부다(규약1). 계약 스위트는 결합 **하나**로 도는데 계약이 요구하는 것은 **임의의** 결합이므로,
 * 같은 구현이 다른 결합에서도 서는지와 호출자가 넘긴 배열을 고쳐도 첫 버전이 그대로인지는 여기서 본다.
 */
function checkInjectionPolicy(
  label: string,
  make: (
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
  ) => PersistentSegmentTreeContract,
): void {
  describe(`PersistentSegmentTree 주입 정책 [${label}]`, () => {
    test("되돌리는 값이 없는 결합 — 최솟값, 옛 버전의 최솟값이 남는다", () => {
      const tree = make(
        [5, 3, 9, 1, 7, 2],
        (a, b) => Math.min(a, b),
        Number.POSITIVE_INFINITY,
      );
      const raised = tree.update(0, 3, 8);
      expect(tree.query(0, 0, 6)).toBe(1);
      expect(tree.query(raised, 0, 6)).toBe(2);
      const lowered = tree.update(raised, 5, -4);
      expect(tree.query(lowered, 4, 6)).toBe(-4);
      expect(tree.query(raised, 4, 6)).toBe(2);
    });

    test("되돌리는 값이 있는 결합 — 덧셈, 한 버전에서 두 갈래로", () => {
      const tree = make([1, 2, 3, 4, 5], (a, b) => a + b, 0);
      const a = tree.update(0, 2, 100);
      const b = tree.update(0, 4, 99);
      expect(tree.query(a, 0, 5)).toBe(112);
      expect(tree.query(b, 3, 5)).toBe(103);
      expect(tree.query(0, 0, 5)).toBe(15);
    });

    test("자리가 없는 수열은 첫 버전의 빈 구간 하나만 묻고 갱신은 전부 거절된다", () => {
      const tree = make([], (a, b) => a + b, 0);
      expect(tree.query(0, 0, 0)).toBe(0);
      expect(() => tree.update(0, 0, 1)).toThrow(RangeError);
      expect(() => tree.query(1, 0, 0)).toThrow(RangeError);
    });

    test("생성자가 돌아온 뒤 호출자가 배열을 고쳐도 첫 버전은 그대로다", () => {
      const values = [4, 0, 6];
      const tree = make(values, (a, b) => a + b, 0);
      values[0] = 1000;
      values.push(7);
      expect(tree.query(0, 0, 3)).toBe(10);
      expect(() => tree.query(0, 0, 4)).toThrow(RangeError);
    });
  });
}

checkInjectionPolicy(
  "스텁",
  (values, combine, identity) =>
    new PersistentSegmentTree(values, combine, identity),
);
checkInjectionPolicy(
  "정본",
  (values, combine, identity) => new Reference(values, combine, identity),
);
