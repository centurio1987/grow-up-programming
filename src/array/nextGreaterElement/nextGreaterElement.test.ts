import { test, expect, describe } from "bun:test";
import { nextGreaterElement } from "./nextGreaterElement";

describe("nextGreaterElement", () => {
  describe("기본", () => {
    test("[2,1,2,4,3] → [4,2,4,-1,-1]", () => {
      expect(nextGreaterElement([2, 1, 2, 4, 3])).toEqual([4, 2, 4, -1, -1]);
    });

    test("[1,3,2,4] → [3,4,4,-1]", () => {
      expect(nextGreaterElement([1, 3, 2, 4])).toEqual([3, 4, 4, -1]);
    });

    test("[1,2,3,4] → [2,3,4,-1]", () => {
      expect(nextGreaterElement([1, 2, 3, 4])).toEqual([2, 3, 4, -1]);
    });
  });

  describe("엣지", () => {
    test("감소 수열 [4,3,2,1] → [-1,-1,-1,-1]", () => {
      expect(nextGreaterElement([4, 3, 2, 1])).toEqual([-1, -1, -1, -1]);
    });

    test("모두 같은 값 [5,5,5] → [-1,-1,-1] (엄격 큰 수)", () => {
      expect(nextGreaterElement([5, 5, 5])).toEqual([-1, -1, -1]);
    });

    test("음수 포함 [-1,-2,-3] → [-1,-1,-1] (감소)", () => {
      expect(nextGreaterElement([-1, -2, -3])).toEqual([-1, -1, -1]);
    });

    test("음수 포함 증가 [-3,-2,-1] → [-2,-1,-1]", () => {
      expect(nextGreaterElement([-3, -2, -1])).toEqual([-2, -1, -1]);
    });
  });

  describe("바운더리", () => {
    test("N=1 → [-1]", () => {
      expect(nextGreaterElement([5])).toEqual([-1]);
    });

    test("N=2 증가 → [두번째, -1]", () => {
      expect(nextGreaterElement([1, 2])).toEqual([2, -1]);
    });

    test("N=2 감소 → [-1, -1]", () => {
      expect(nextGreaterElement([2, 1])).toEqual([-1, -1]);
    });
  });

  describe("성능", () => {
    test("N=100,000을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      // 최악(전부 증가)에도 O(N)이어야 함
      const nums = Array.from({ length: N }, (_, i) => i);

      const start = performance.now();
      const result = nextGreaterElement(nums);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(N);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
