import { test, expect, describe } from "bun:test";
import { subsetSum } from "./subsetSum";

describe("subsetSum", () => {
  describe("기본", () => {
    test("nums=[3,34,4,12,5,2], target=9 → true (4+5)", () => {
      expect(subsetSum([3, 34, 4, 12, 5, 2], 9)).toBe(true);
    });

    test("nums=[3,34,4,12,5,2], target=30 → false", () => {
      expect(subsetSum([3, 34, 4, 12, 5, 2], 30)).toBe(false);
    });

    test("nums=[1,2,3,4], target=7 → true (3+4)", () => {
      expect(subsetSum([1, 2, 3, 4], 7)).toBe(true);
    });
  });

  describe("엣지", () => {
    test("target=0 → 공집합으로 true", () => {
      expect(subsetSum([1, 2, 3], 0)).toBe(true);
    });

    test("빈 배열 + target=0 → true", () => {
      expect(subsetSum([], 0)).toBe(true);
    });

    test("빈 배열 + target>0 → false", () => {
      expect(subsetSum([], 5)).toBe(false);
    });

    test("0이 포함된 배열 — target=0 → true", () => {
      expect(subsetSum([0, 1, 2], 0)).toBe(true);
    });

    test("단일 원소 매칭", () => {
      expect(subsetSum([7], 7)).toBe(true);
      expect(subsetSum([7], 8)).toBe(false);
    });

    test("전체 합 매칭", () => {
      expect(subsetSum([1, 2, 3, 4], 10)).toBe(true);
    });
  });

  describe("바운더리", () => {
    test("nums에 target 초과 원소만 → false", () => {
      expect(subsetSum([100, 200], 50)).toBe(false);
    });

    test("nums=[10000], target=10000 → true", () => {
      expect(subsetSum([10000], 10000)).toBe(true);
    });

    test("n=1000 모두 1, target=500 → true", () => {
      const nums = new Array(1000).fill(1);
      expect(subsetSum(nums, 500)).toBe(true);
    });
  });

  describe("성능", () => {
    test("n=1000, target=10000을 100ms 이내에 처리한다", () => {
      const n = 1000;
      const nums = Array.from({ length: n }, (_, i) => (i % 100) + 1);

      const start = performance.now();
      const result = subsetSum(nums, 10_000);
      const elapsed = performance.now() - start;

      expect(typeof result).toBe("boolean");
      expect(elapsed).toBeLessThan(100);
    });
  });
});
