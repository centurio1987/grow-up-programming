import { test, expect, describe } from "bun:test";
import { bestTimeToBuyAndSellStock } from "./bestTimeToBuyAndSellStock";

describe("bestTimeToBuyAndSellStock", () => {
  describe("기본", () => {
    test("[7,1,5,3,6,4] → 1에 사서 6에 팔면 5", () => {
      expect(bestTimeToBuyAndSellStock([7, 1, 5, 3, 6, 4])).toBe(5);
    });

    test("[1,2,3,4,5] → 5-1=4", () => {
      expect(bestTimeToBuyAndSellStock([1, 2, 3, 4, 5])).toBe(4);
    });

    test("[2,4,1,7] → 1에 사서 7에 팔면 6", () => {
      expect(bestTimeToBuyAndSellStock([2, 4, 1, 7])).toBe(6);
    });
  });

  describe("엣지", () => {
    test("내림차순 [7,6,4,3,1] → 이익 불가능 → 0", () => {
      expect(bestTimeToBuyAndSellStock([7, 6, 4, 3, 1])).toBe(0);
    });

    test("모두 같음 [5,5,5,5] → 0", () => {
      expect(bestTimeToBuyAndSellStock([5, 5, 5, 5])).toBe(0);
    });

    test("최저가가 마지막인 경우 [5,4,3,2,1] → 0", () => {
      expect(bestTimeToBuyAndSellStock([5, 4, 3, 2, 1])).toBe(0);
    });

    test("0이 포함된 경우 [0,10] → 10", () => {
      expect(bestTimeToBuyAndSellStock([0, 10])).toBe(10);
    });
  });

  describe("바운더리", () => {
    test("N=1 → 거래 불가능 → 0", () => {
      expect(bestTimeToBuyAndSellStock([5])).toBe(0);
    });

    test("N=2 상승 [1,2] → 1", () => {
      expect(bestTimeToBuyAndSellStock([1, 2])).toBe(1);
    });

    test("N=2 하락 [2,1] → 0", () => {
      expect(bestTimeToBuyAndSellStock([2, 1])).toBe(0);
    });

    test("최댓값 차이 [0,10000] → 10000", () => {
      expect(bestTimeToBuyAndSellStock([0, 10000])).toBe(10000);
    });
  });

  describe("성능", () => {
    test("N=100,000을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const prices = Array.from({ length: N }, (_, i) => i);

      const start = performance.now();
      const result = bestTimeToBuyAndSellStock(prices);
      const elapsed = performance.now() - start;

      expect(result).toBe(N - 1);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
