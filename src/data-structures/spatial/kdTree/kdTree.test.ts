/**
 * `spatial/kdTree` 계약 스위트 실행부(규약2).
 *
 * `runContract` 호출과, 계약 스위트가 담지 못하는 **주입 정책**만 둔다. 무엇을 검사하는지는 `./kdTree.contract.ts` 에 있고,
 * 계약 자체는 `./kdTree.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다. 축3은 계측기가 붙은 정본에만 돈다.
 * 주입점(비교자 · 거리)이 없는 구조라 계측 경로는 `self-reported` 다 — 무엇을 세는지는 정본 머리말이 밝힌다(§규약2 「계측 —
 * `__cost` 는 계약이 아니다」).
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 시험의 「1000개 점 삽입 후 최근접 탐색이 합리적인 시간 내에 완료」가 재는
 * 것은 그 기계의 상수다. 자리는 축3이다.
 */

import { describe, expect, test } from "bun:test";
import { runContract } from "../../_contract/runContract";
import { KDTree as Reference } from "./_reference/kdTree";
import { KDTree, type Point2D } from "./kdTree";
import { type KDTreeSurface, kdTreeContract } from "./kdTree.contract";

runContract(() => new KDTree(), kdTreeContract, { label: "스텁" });

runContract(() => new Reference(), kdTreeContract, {
  label: "정본",
  cost: { kind: "self-reported", make: () => new Reference() },
});

/**
 * 주입 정책은 계약의 일부다(규약1). 경계 케이스가 vector 로도 나가므로 JSON 에 못 담는 값(무한 · NaN)과 배열을 붙들지 않는다는
 * 약속은 여기서 본다.
 */
function checkInjectionPolicy(label: string, make: () => KDTreeSurface): void {
  describe(`KDTree 주입 정책 [${label}]`, () => {
    test("사각형 모서리는 무한이어도 되고 NaN 이면 RangeError 다", () => {
      const index = make();
      index.insert([3, -4]);
      index.insert([-2, 7]);
      expect(index.rangeSearch([-Infinity, -Infinity], [Infinity, 0])).toEqual([
        [3, -4],
      ]);
      expect(() => index.rangeSearch([Number.NaN, 0], [1, 1])).toThrow(
        RangeError,
      );
    });

    test("점 좌표가 NaN · 무한이면 RangeError 이고 상태가 안 바뀐다", () => {
      const index = make();
      expect(() => index.insert([Number.NaN, 0])).toThrow(RangeError);
      expect(() => index.insert([0, Infinity])).toThrow(RangeError);
      expect(() => index.nearestNeighbor([Number.NaN, 0])).toThrow(RangeError);
      expect(index.nearestNeighbor([0, 0])).toBeNull();
      expect(index.rangeSearch([-10, -10], [10, 10])).toEqual([]);
    });

    test("넘긴 배열 · 돌려받은 배열을 고쳐도 담긴 점은 그대로다", () => {
      const index = make();
      const given: Point2D = [1, 2];
      index.insert(given);
      given[0] = 100;
      const found = index.rangeSearch([0, 0], [5, 5]);
      expect(found).toEqual([[1, 2]]);
      (found[0] as Point2D)[1] = 50;
      const nearest = index.nearestNeighbor([0, 0]);
      expect(nearest).toEqual([1, 2]);
      (nearest as Point2D)[0] = -9;
      expect(index.rangeSearch([0, 0], [5, 5])).toEqual([[1, 2]]);
      expect(index.nearestNeighbor([100, 2])).toEqual([1, 2]);
    });
  });
}

checkInjectionPolicy("스텁", () => new KDTree());
checkInjectionPolicy("정본", () => new Reference());
