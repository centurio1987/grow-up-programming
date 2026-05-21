import { test, expect, describe } from "bun:test";
import { kadane } from "./kadane";

describe("kadane", () => {
  describe("기본", () => {
    test("연속된 부분 배열의 최대 합을 반환한다", () => {
      // [-2,1,-3,4,-1,2,1,-5,4] → [4,-1,2,1] = 6
      expect(kadane([-2, 1, -3, 4, -1, 2, 1, -5, 4])).toBe(6);
    });

    test("전체가 양수일 때 전체 합 반환", () => {
      expect(kadane([1, 2, 3, 4, 5])).toBe(15);
    });

    test("양수·음수 혼합", () => {
      expect(kadane([5, -3, 5])).toBe(7);
    });
  });

  describe("엣지", () => {
    test("모두 음수 — 가장 큰 단일 원소 반환", () => {
      expect(kadane([-3, -1, -4, -2])).toBe(-1);
    });

    test("0이 포함된 경우", () => {
      expect(kadane([-1, 0, -2])).toBe(0);
    });

    test("정답이 앞부분에 있는 경우", () => {
      expect(kadane([10, -1, -1, -100])).toBe(10);
    });

    test("정답이 뒷부분에 있는 경우", () => {
      expect(kadane([-100, -1, -1, 10])).toBe(10);
    });
  });

  describe("바운더리", () => {
    test("N=1, 양수", () => {
      expect(kadane([7])).toBe(7);
    });

    test("N=1, 음수", () => {
      expect(kadane([-7])).toBe(-7);
    });

    test("N=1, 0", () => {
      expect(kadane([0])).toBe(0);
    });

    test("최댓값 원소", () => {
      expect(kadane([10000, -1, 10000])).toBe(19999);
    });
  });

  describe("성능", () => {
    test("N=100,000을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const nums = new Array<number>(N).fill(1);

      const start = performance.now();
      const result = kadane(nums);
      const elapsed = performance.now() - start;

      expect(result).toBe(N);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
