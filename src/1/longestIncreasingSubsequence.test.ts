import { test, expect, describe } from "bun:test";
import { longestIncreasingSubsequence } from "./longestIncreasingSubsequence";

describe("longestIncreasingSubsequence", () => {
  describe("기본", () => {
    test("[10,9,2,5,3,7,101,18] → 4 (예: 2,3,7,18 또는 2,5,7,101)", () => {
      expect(longestIncreasingSubsequence([10, 9, 2, 5, 3, 7, 101, 18])).toBe(4);
    });

    test("[0,1,0,3,2,3] → 4 (0,1,2,3)", () => {
      expect(longestIncreasingSubsequence([0, 1, 0, 3, 2, 3])).toBe(4);
    });

    test("[1,3,6,7,9,4,10,5,6] → 6 (1,3,6,7,9,10)", () => {
      expect(longestIncreasingSubsequence([1, 3, 6, 7, 9, 4, 10, 5, 6])).toBe(6);
    });
  });

  describe("엣지", () => {
    test("엄격 감소 [5,4,3,2,1] → 1", () => {
      expect(longestIncreasingSubsequence([5, 4, 3, 2, 1])).toBe(1);
    });

    test("엄격 증가 [1,2,3,4,5] → 5", () => {
      expect(longestIncreasingSubsequence([1, 2, 3, 4, 5])).toBe(5);
    });

    test("모두 같음 [7,7,7,7] → 1 (엄격 증가)", () => {
      expect(longestIncreasingSubsequence([7, 7, 7, 7])).toBe(1);
    });

    test("음수 포함 [-3,-2,-1,0] → 4", () => {
      expect(longestIncreasingSubsequence([-3, -2, -1, 0])).toBe(4);
    });
  });

  describe("바운더리", () => {
    test("N=1 → 1", () => {
      expect(longestIncreasingSubsequence([42])).toBe(1);
    });

    test("N=2 증가 → 2", () => {
      expect(longestIncreasingSubsequence([1, 2])).toBe(2);
    });

    test("N=2 감소 → 1", () => {
      expect(longestIncreasingSubsequence([2, 1])).toBe(1);
    });
  });

  describe("성능", () => {
    test("N=100,000을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const A = Array.from({ length: N }, (_, i) => i);

      const start = performance.now();
      const result = longestIncreasingSubsequence(A);
      const elapsed = performance.now() - start;

      expect(result).toBe(N);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
