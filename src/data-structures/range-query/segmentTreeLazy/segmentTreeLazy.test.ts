/**
 * `range-query/segmentTreeLazy` 계약 스위트 실행부(규약2).
 *
 * `runContract` 호출과, 계약 스위트가 담지 못하는 **주입 정책**만 둔다. 무엇을 검사하는지는
 * `./segmentTreeLazy.contract.ts` 에 있고, 계약 자체는 `./segmentTreeLazy.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다. 축3은 계측기가 붙은
 * 정본에만 돈다.
 *
 * **계측 경로가 `injected` 다**(`range-query/segmentTree` 와 같다). 주입점이 셋(`combine`·`act`·`compose`)이라
 * 하네스가 세 함수의 호출 횟수를 밖에서 함께 세고, 자기 보고 `__cost` 가 그보다 작으면 실패한다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 시험의 「10^5 연산 100ms 이내」가 재는 것은 그 기계의
 * 상수다. 자리는 축3이다.
 */

import { describe, expect, test } from "bun:test";
import { runContract } from "../../_contract/runContract";
import { SegmentTreeLazy as Reference } from "./_reference/segmentTreeLazy";
import { SegmentTreeLazy } from "./segmentTreeLazy";
import {
  type Act,
  type Combine,
  type Compose,
  coverAct,
  coverCompose,
  firstNonZero,
  IDENTITY,
  LazySized,
  type SegmentTreeLazyContract,
  segmentTreeLazyContract,
} from "./segmentTreeLazy.contract";

runContract(
  () =>
    new LazySized(
      (values) =>
        new SegmentTreeLazy(
          values,
          firstNonZero,
          IDENTITY,
          coverAct,
          coverCompose,
        ),
    ),
  segmentTreeLazyContract,
  { label: "스텁" },
);

runContract(
  () =>
    new LazySized(
      (values) =>
        new Reference(values, firstNonZero, IDENTITY, coverAct, coverCompose),
    ),
  segmentTreeLazyContract,
  {
    label: "정본",
    cost: {
      kind: "injected",
      make: (tick) =>
        new LazySized(
          (values) =>
            new Reference(
              values,
              (a, b) => {
                tick();
                return firstNonZero(a, b);
              },
              IDENTITY,
              (update, value, count) => {
                tick();
                return coverAct(update, value, count);
              },
              (later, earlier) => {
                tick();
                return coverCompose(later, earlier);
              },
            ),
        ),
    },
  },
);

/**
 * 주입 정책은 계약의 일부다(규약1). 계약 스위트는 대수 **하나**로 도는데 계약이 요구하는 것은 세 법칙을
 * 지키는 **임의의** 대수이므로, 같은 구현이 다른 대수에서도 서는지는 여기서 본다. 첫째가 **덮는 자리 수를
 * 쓰는 대수**(구간 더하기 · 구간 합)다 — 스위트의 대수에서는 그 인자가 0 과 그 밖만 가른다.
 */
function checkInjectionPolicy(
  label: string,
  make: (
    values: number[],
    combine: Combine,
    identity: number,
    act: Act,
    compose: Compose,
  ) => SegmentTreeLazyContract,
): void {
  describe(`SegmentTreeLazy 주입 정책 [${label}]`, () => {
    test("덮는 자리 수를 쓰는 갱신 — 구간 더하기 · 구간 합", () => {
      const tree = make(
        [0, 0, 0, 0, 0, 0],
        (a, b) => a + b,
        0,
        (update, value, count) => value + update * count,
        (later, earlier) => later + earlier,
      );
      tree.apply(0, 3, 3);
      expect(tree.query(0, 6)).toBe(9);
      expect(tree.query(2, 4)).toBe(3);
      tree.apply(1, 6, 2);
      expect(tree.query(0, 6)).toBe(19);
      expect(tree.query(3, 4)).toBe(2);
      tree.apply(2, 3, -10);
      expect(tree.query(0, 3)).toBe(3);
      expect(tree.query(1, 5)).toBe(4);
    });

    test("되돌리는 값이 없는 결합 — 구간 더하기 · 구간 최솟값", () => {
      const tree = make(
        [5, 3, 9, 1, 7, 2],
        (a, b) => Math.min(a, b),
        Number.POSITIVE_INFINITY,
        (update, value) => value + update,
        (later, earlier) => later + earlier,
      );
      expect(tree.query(0, 6)).toBe(1);
      tree.apply(2, 5, 10);
      expect(tree.query(0, 6)).toBe(2);
      expect(tree.query(2, 5)).toBe(11);
      tree.apply(0, 6, -1);
      expect(tree.query(3, 4)).toBe(10);
      expect(tree.query(0, 0)).toBe(Number.POSITIVE_INFINITY);
    });

    test("나중 갱신이 이기는 합성 — 구간 덮기 · 구간 합", () => {
      const tree = make(
        [1, 2, 3, 4, 5, 6, 7, 8],
        (a, b) => a + b,
        0,
        (update, _value, count) => update * count,
        (later) => later,
      );
      tree.apply(0, 8, 1);
      tree.apply(2, 6, 3);
      expect(tree.query(0, 8)).toBe(16);
      tree.apply(3, 4, 0);
      expect(tree.query(2, 6)).toBe(9);
      expect(tree.query(6, 8)).toBe(2);
    });

    test("자리가 없는 수열은 빈 구간 하나만 묻고 답은 항등원이다", () => {
      const tree = make(
        [],
        (a, b) => a + b,
        0,
        (update, value, count) => value + update * count,
        (later, earlier) => later + earlier,
      );
      tree.apply(0, 0, 5);
      expect(tree.query(0, 0)).toBe(0);
      expect(() => tree.query(0, 1)).toThrow(RangeError);
    });
  });
}

checkInjectionPolicy(
  "스텁",
  (values, combine, identity, act, compose) =>
    new SegmentTreeLazy(values, combine, identity, act, compose),
);
checkInjectionPolicy(
  "정본",
  (values, combine, identity, act, compose) =>
    new Reference(values, combine, identity, act, compose),
);
