import { describe, expect, test } from "bun:test";
import { largestRectangleInHistogram } from "./largestRectangleInHistogram";

describe("largestRectangleInHistogram", () => {
  describe("기본", () => {
    test("[2,1,5,6,2,3] → 10 (5와 6, 너비 2 × 높이 5)", () => {
      expect(largestRectangleInHistogram([2, 1, 5, 6, 2, 3])).toBe(10);
    });

    test("[2,4] → 4", () => {
      // [2,4]: max(2*2, 4*1) = 4
      expect(largestRectangleInHistogram([2, 4])).toBe(4);
    });

    test("[6,7,5,2,4,5,9,3] → 16", () => {
      // 막대 여덟이 모두 높이 2 이상이라 전체 폭 8 × 높이 2 = 16 이 선다.
      // 그다음 후보는 idx 0~2 (6,7,5) 의 폭 3 × 높이 5 = 15 다.
      expect(largestRectangleInHistogram([6, 7, 5, 2, 4, 5, 9, 3])).toBe(16);
    });
  });

  describe("엣지", () => {
    test("모두 같은 높이 [3,3,3,3] → 12", () => {
      expect(largestRectangleInHistogram([3, 3, 3, 3])).toBe(12);
    });

    test("0 포함 [2,0,2] → 2 (양옆 막대 따로)", () => {
      expect(largestRectangleInHistogram([2, 0, 2])).toBe(2);
    });

    test("모두 0 [0,0,0] → 0", () => {
      expect(largestRectangleInHistogram([0, 0, 0])).toBe(0);
    });

    test("증가 [1,2,3,4,5] → 9 (3,4,5 → 3*3) 아니 (4,5 → 4*2=8, 5*1=5, 3,4,5→3*3=9, 2,3,4,5→2*4=8, 전체→1*5=5)", () => {
      expect(largestRectangleInHistogram([1, 2, 3, 4, 5])).toBe(9);
    });

    test("감소 [5,4,3,2,1] → 9", () => {
      // 5*1, 4*2=8, 3*3=9, 2*4=8, 1*5=5
      expect(largestRectangleInHistogram([5, 4, 3, 2, 1])).toBe(9);
    });
  });

  describe("바운더리", () => {
    test("N=1, 단일 높이", () => {
      expect(largestRectangleInHistogram([7])).toBe(7);
    });

    test("N=1, 0", () => {
      expect(largestRectangleInHistogram([0])).toBe(0);
    });

    test("최대 높이 단일", () => {
      expect(largestRectangleInHistogram([10000])).toBe(10000);
    });
  });

  describe("성능", () => {
    test("N=100,000을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      // 모두 동일 높이일 때 최대 직사각형 = N * h
      const heights = new Array<number>(N).fill(1);

      const start = performance.now();
      const result = largestRectangleInHistogram(heights);
      const elapsed = performance.now() - start;

      expect(result).toBe(N);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
