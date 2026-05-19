import { test, expect, describe } from "bun:test";
import { slidingWindowMaximum } from "./slidingWindowMaximum";

describe("slidingWindowMaximum", () => {
  describe("기본", () => {
    test("[1,3,-1,-3,5,3,6,7], k=3 → [3,3,5,5,6,7]", () => {
      expect(slidingWindowMaximum([1, 3, -1, -3, 5, 3, 6, 7], 3)).toEqual([3, 3, 5, 5, 6, 7]);
    });

    test("[9,8,7,6,5], k=2 → [9,8,7,6]", () => {
      expect(slidingWindowMaximum([9, 8, 7, 6, 5], 2)).toEqual([9, 8, 7, 6]);
    });

    test("[1,2,3,4,5], k=3 → [3,4,5]", () => {
      expect(slidingWindowMaximum([1, 2, 3, 4, 5], 3)).toEqual([3, 4, 5]);
    });
  });

  describe("엣지", () => {
    test("모두 같은 값 [5,5,5,5], k=2 → [5,5,5]", () => {
      expect(slidingWindowMaximum([5, 5, 5, 5], 2)).toEqual([5, 5, 5]);
    });

    test("음수만 [-3,-1,-4,-2], k=2 → [-1,-1,-2]", () => {
      expect(slidingWindowMaximum([-3, -1, -4, -2], 2)).toEqual([-1, -1, -2]);
    });

    test("k=N → 전체 최댓값 한 개", () => {
      expect(slidingWindowMaximum([3, 1, 5, 2], 4)).toEqual([5]);
    });

    test("k=1 → 원본 그대로", () => {
      expect(slidingWindowMaximum([3, 1, 5, 2], 1)).toEqual([3, 1, 5, 2]);
    });
  });

  describe("바운더리", () => {
    test("N=1, k=1", () => {
      expect(slidingWindowMaximum([7], 1)).toEqual([7]);
    });

    test("최댓값이 첫 윈도우에만", () => {
      expect(slidingWindowMaximum([10, 1, 1, 1], 2)).toEqual([10, 1, 1]);
    });

    test("최댓값이 마지막 윈도우에만", () => {
      expect(slidingWindowMaximum([1, 1, 1, 10], 2)).toEqual([1, 1, 10]);
    });
  });

  describe("성능", () => {
    test("N=100,000, k=1000을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const k = 1000;
      const nums = Array.from({ length: N }, (_, i) => (i * 31) % 10000);

      const start = performance.now();
      const result = slidingWindowMaximum(nums, k);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(N - k + 1);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
