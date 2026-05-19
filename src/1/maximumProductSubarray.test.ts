import { test, expect, describe } from "bun:test";
import { maximumProductSubarray } from "./maximumProductSubarray";

describe("maximumProductSubarray", () => {
  describe("기본", () => {
    test("[2,3,-2,4] → [2,3] = 6", () => {
      expect(maximumProductSubarray([2, 3, -2, 4])).toBe(6);
    });

    test("[-2,3,-4] → 전체 곱 24", () => {
      // (-2)*3*(-4) = 24
      expect(maximumProductSubarray([-2, 3, -4])).toBe(24);
    });

    test("[2,3,4] → 24", () => {
      expect(maximumProductSubarray([2, 3, 4])).toBe(24);
    });
  });

  describe("엣지", () => {
    test("[-2,0,-1] → 0", () => {
      expect(maximumProductSubarray([-2, 0, -1])).toBe(0);
    });

    test("[0,2] → 2", () => {
      expect(maximumProductSubarray([0, 2])).toBe(2);
    });

    test("[-2,-3,7] → 42", () => {
      expect(maximumProductSubarray([-2, -3, 7])).toBe(42);
    });

    test("음수 한 개 [-2] → -2", () => {
      expect(maximumProductSubarray([-2])).toBe(-2);
    });

    test("[2,-5,-2,-4,3] → (-5)*(-2)*(-4)*3=-120, [2]=2, [-5,-2]=10, [-2,-4]=8, [-2,-4,3]=24, [-5,-2,-4]=-40, 최대 24", () => {
      // 2 | -5 | -2 | -4 | 3
      // [2] = 2
      // [-2,-4,3] = 24
      // [2,-5,-2,-4] = -80, no
      // [-2,-4] = 8
      // [-5,-2,-4] = -40
      // [-5,-2] = 10
      // [-2,-4,3]=24 wins
      expect(maximumProductSubarray([2, -5, -2, -4, 3])).toBe(24);
    });
  });

  describe("바운더리", () => {
    test("N=1, 양수", () => {
      expect(maximumProductSubarray([5])).toBe(5);
    });

    test("N=1, 0", () => {
      expect(maximumProductSubarray([0])).toBe(0);
    });

    test("최댓값 절댓값 10 두 개 곱", () => {
      expect(maximumProductSubarray([-10, -10])).toBe(100);
    });
  });

  describe("성능", () => {
    test("N=100,000을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const nums = new Array<number>(N).fill(1);

      const start = performance.now();
      const result = maximumProductSubarray(nums);
      const elapsed = performance.now() - start;

      expect(result).toBe(1);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
