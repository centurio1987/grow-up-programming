import { test, expect, describe } from "bun:test";
import { subarraySumEqualsK } from "./subarraySumEqualsK";

describe("subarraySumEqualsK", () => {
  describe("기본", () => {
    test("[1,1,1], k=2 → 2", () => {
      expect(subarraySumEqualsK([1, 1, 1], 2)).toBe(2);
    });

    test("[1,2,3], k=3 → 2 ([1,2], [3])", () => {
      expect(subarraySumEqualsK([1, 2, 3], 3)).toBe(2);
    });

    test("[3,4,7,2,-3,1,4,2], k=7 → 4", () => {
      // [3,4], [7], [7,2,-3,1], [1,4,2]
      expect(subarraySumEqualsK([3, 4, 7, 2, -3, 1, 4, 2], 7)).toBe(4);
    });
  });

  describe("엣지", () => {
    test("k=0이고 음수 포함 [1,-1,1,-1] → 4 ([1,-1] at 0-1, [1,-1] at 2-3, [-1,1] at 1-2, [1,-1,1,-1] 전체)", () => {
      // 누적합: 0,1,0,1,0
      // k=0 → 같은 누적합 쌍 개수: P[0]=0 with P[2]=0,P[4]=0 (2), P[2]=0 with P[4]=0 (1), P[1]=1 with P[3]=1 (1)
      // 총 4개
      expect(subarraySumEqualsK([1, -1, 1, -1], 0)).toBe(4);
    });

    test("k=0이고 [0,0,0] → 6 ([0],[0],[0],[0,0],[0,0],[0,0,0])", () => {
      expect(subarraySumEqualsK([0, 0, 0], 0)).toBe(6);
    });

    test("결과 없음 [1,2,3], k=100 → 0", () => {
      expect(subarraySumEqualsK([1, 2, 3], 100)).toBe(0);
    });

    test("음수 k [-1,-1,1], k=-2 → 1 ([-1,-1])", () => {
      expect(subarraySumEqualsK([-1, -1, 1], -2)).toBe(1);
    });
  });

  describe("바운더리", () => {
    test("N=1, 일치", () => {
      expect(subarraySumEqualsK([5], 5)).toBe(1);
    });

    test("N=1, 불일치", () => {
      expect(subarraySumEqualsK([5], 1)).toBe(0);
    });

    test("N=1, k=0이고 원소도 0 → 1", () => {
      expect(subarraySumEqualsK([0], 0)).toBe(1);
    });
  });

  describe("성능", () => {
    test("N=100,000을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const nums = new Array<number>(N).fill(1);
      // 합 5인 부분배열 개수: N-4 = 99996
      const start = performance.now();
      const result = subarraySumEqualsK(nums, 5);
      const elapsed = performance.now() - start;

      expect(result).toBe(N - 4);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
