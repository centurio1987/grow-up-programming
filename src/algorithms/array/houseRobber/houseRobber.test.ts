import { test, expect, describe } from "bun:test";
import { houseRobber } from "./houseRobber";

describe("houseRobber", () => {
  describe("기본", () => {
    test("[1,2,3,1] → 1+3=4", () => {
      expect(houseRobber([1, 2, 3, 1])).toBe(4);
    });

    test("[2,7,9,3,1] → 2+9+1=12", () => {
      expect(houseRobber([2, 7, 9, 3, 1])).toBe(12);
    });

    test("[2,1,1,2] → 2+2=4", () => {
      expect(houseRobber([2, 1, 1, 2])).toBe(4);
    });
  });

  describe("엣지", () => {
    test("빈 배열 → 0", () => {
      expect(houseRobber([])).toBe(0);
    });

    test("0만 있는 배열 → 0", () => {
      expect(houseRobber([0, 0, 0])).toBe(0);
    });

    test("모두 같은 값 [5,5,5,5,5] → 5+5+5=15", () => {
      expect(houseRobber([5, 5, 5, 5, 5])).toBe(15);
    });

    test("[1,3,1] → 3 (중간 하나만)", () => {
      expect(houseRobber([1, 3, 1])).toBe(3);
    });
  });

  describe("바운더리", () => {
    test("N=1 → nums[0]", () => {
      expect(houseRobber([5])).toBe(5);
    });

    test("N=2 → 둘 중 큰 값", () => {
      expect(houseRobber([2, 7])).toBe(7);
    });

    test("최댓값 원소", () => {
      expect(houseRobber([10000, 1, 10000])).toBe(20000);
    });
  });

  describe("성능", () => {
    test("N=100,000을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const nums = new Array<number>(N).fill(1);
      // 인접 불가이므로 floor(N/2) + (N%2) = 50000
      const expected = Math.ceil(N / 2);

      const start = performance.now();
      const result = houseRobber(nums);
      const elapsed = performance.now() - start;

      expect(result).toBe(expected);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
