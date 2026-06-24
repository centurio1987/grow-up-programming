import { test, expect, describe } from "bun:test";
import { longestSubarrayAtMostSum } from "./longestSubarrayAtMostSum";

describe("longestSubarrayAtMostSum", () => {
  describe("기본", () => {
    test("[1,2,3,4,5], S=8 → 3 ([1,2,3]=6 또는 [3,4]=7? 최장 → [1,2,3] 길이 3)", () => {
      // 부분배열:
      // [1,2,3]=6 length 3
      // [1,2,3,4]=10 > 8
      // [2,3]=5
      // [3,4]=7 length 2
      // [4]=4 length 1
      // 최대 길이: 3
      expect(longestSubarrayAtMostSum([1, 2, 3, 4, 5], 8)).toBe(3);
    });

    test("[1,1,1,1,1], S=3 → 3", () => {
      expect(longestSubarrayAtMostSum([1, 1, 1, 1, 1], 3)).toBe(3);
    });

    test("전체 합 ≤ S → N", () => {
      expect(longestSubarrayAtMostSum([1, 2, 3], 10)).toBe(3);
    });
  });

  describe("엣지", () => {
    test("모든 원소가 S보다 큼 → 0", () => {
      // nums=[10,20,30], S=5 → 어떤 길이≥1 부분배열도 합 ≥ 10 > 5
      expect(longestSubarrayAtMostSum([10, 20, 30], 5)).toBe(0);
    });

    test("S=0 일 때 0이 연속된 부분 배열", () => {
      // [0,0,0,1,0] S=0 → 처음 3개 0이 최대
      expect(longestSubarrayAtMostSum([0, 0, 0, 1, 0], 0)).toBe(3);
    });

    test("S=0이고 모든 원소 양수 → 0", () => {
      expect(longestSubarrayAtMostSum([1, 2, 3], 0)).toBe(0);
    });

    test("0 포함 [0,0,0,0], S=0 → 4", () => {
      expect(longestSubarrayAtMostSum([0, 0, 0, 0], 0)).toBe(4);
    });
  });

  describe("바운더리", () => {
    test("N=1, nums[0] ≤ S → 1", () => {
      expect(longestSubarrayAtMostSum([5], 10)).toBe(1);
    });

    test("N=1, nums[0] > S → 0", () => {
      expect(longestSubarrayAtMostSum([5], 1)).toBe(0);
    });

    test("S가 매우 크면 전체 길이", () => {
      const N = 100;
      const arr = new Array<number>(N).fill(100);
      expect(longestSubarrayAtMostSum(arr, 1_000_000_000)).toBe(N);
    });
  });

  describe("성능", () => {
    test("N=100,000을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const nums = new Array<number>(N).fill(1);
      // S=N이면 전체 길이가 답
      const start = performance.now();
      const result = longestSubarrayAtMostSum(nums, N);
      const elapsed = performance.now() - start;

      expect(result).toBe(N);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
