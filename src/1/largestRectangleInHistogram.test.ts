import { test, expect, describe } from "bun:test";
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

    test("[6,7,5,2,4,5,9,3] → 16 (4,5,9 → 너비 4 × 높이 4? 실제로는 [5,9] 또는 [4,5,9] = 12, [5,5] from idx2~5=4*4? 다시 계산)", () => {
      // heights = [6,7,5,2,4,5,9,3]
      // 가능한 후보:
      // idx 0~1 (6,7): min=6, w=2 → 12; 7*1=7
      // idx 0~2 (6,7,5): min=5, w=3 → 15
      // idx 4~6 (4,5,9): min=4, w=3 → 12; idx5~6: min=5,w=2→10; 9*1=9
      // idx 4~7 (4,5,9,3): min=3,w=4→12
      // idx 2~6 (5,2,4,5,9): min=2,w=5→10
      // 답: 15
      expect(largestRectangleInHistogram([6, 7, 5, 2, 4, 5, 9, 3])).toBe(15);
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
