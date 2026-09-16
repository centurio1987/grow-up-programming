/**
 * `spatial/quadtree` 계약 스위트 실행부(규약2).
 *
 * `runContract` 호출과, 계약 스위트가 담지 못하는 **주입 정책**만 둔다. 무엇을 검사하는지는 `./quadtree.contract.ts` 에 있고,
 * 계약 자체는 `./quadtree.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다. 축3은 계측기가 붙은 정본에만 돈다. 주입점이 없는
 * 구조라 계측 경로는 `self-reported` 다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 시험의 「10000개 점 삽입 후 쿼리가 합리적인 시간 내」가 재는 것은 그 기계의
 * 상수다. 자리는 축3이다.
 */

import { describe, expect, test } from "bun:test";
import { runContract } from "../../_contract/runContract";
import { Quadtree as Reference } from "./_reference/quadtree";
import { type Point2D, Quadtree } from "./quadtree";
import { type QuadtreeSurface, quadtreeContract } from "./quadtree.contract";

runContract(() => new Quadtree(), quadtreeContract, { label: "스텁" });

runContract(() => new Reference(), quadtreeContract, {
  label: "정본",
  cost: { kind: "self-reported", make: () => new Reference() },
});

/** 주입 정책은 계약의 일부다(규약1). NaN · 무한은 JSON 에 못 담겨 경계 케이스(vector)로 못 나가므로 여기서 본다. */
function checkInjectionPolicy(
  label: string,
  make: () => QuadtreeSurface,
): void {
  describe(`Quadtree 주입 정책 [${label}]`, () => {
    test("점 좌표가 NaN · 무한이면 RangeError 이고 상태가 안 바뀐다", () => {
      const index = make();
      expect(() => index.insert([Number.NaN, 0])).toThrow(RangeError);
      expect(() => index.insert([0, -Infinity])).toThrow(RangeError);
      expect(index.rangeSearch([-1e300, -1e300], [1e300, 1e300])).toEqual([]);
    });

    test("사각형 모서리는 무한이어도 되고 NaN 이면 RangeError 다", () => {
      const index = make();
      index.insert([1e-9, -2.5]);
      index.insert([-7, 1e12]);
      expect(index.rangeSearch([0, -Infinity], [Infinity, Infinity])).toEqual([
        [1e-9, -2.5],
      ]);
      expect(() => index.rangeSearch([0, 0], [Number.NaN, 1])).toThrow(
        RangeError,
      );
    });

    test("넘긴 배열 · 돌려받은 배열을 고쳐도 담긴 점은 그대로다", () => {
      const index = make();
      const given: Point2D = [0.5, 0.25];
      index.insert(given);
      given[1] = 100;
      const found = index.rangeSearch([0, 0], [1, 1]);
      expect(found).toEqual([[0.5, 0.25]]);
      (found[0] as Point2D)[0] = -3;
      expect(index.rangeSearch([0, 0], [1, 1])).toEqual([[0.5, 0.25]]);
    });
  });
}

checkInjectionPolicy("스텁", () => new Quadtree());
checkInjectionPolicy("정본", () => new Reference());
