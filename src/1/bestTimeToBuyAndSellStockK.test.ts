import { test, expect, describe } from "bun:test";
import { bestTimeToBuyAndSellStockK } from "./bestTimeToBuyAndSellStockK";

describe("bestTimeToBuyAndSellStockK", () => {
  describe("기본", () => {
    test("k=2, [2,4,1,5] → (4-2)+(5-1)=6", () => {
      expect(bestTimeToBuyAndSellStockK(2, [2, 4, 1, 5])).toBe(6);
    });

    test("k=2, [3,2,6,5,0,3] → (6-2)+(3-0)=7", () => {
      expect(bestTimeToBuyAndSellStockK(2, [3, 2, 6, 5, 0, 3])).toBe(7);
    });

    test("k=1, [7,1,5,3,6,4] → 5", () => {
      expect(bestTimeToBuyAndSellStockK(1, [7, 1, 5, 3, 6, 4])).toBe(5);
    });
  });

  describe("엣지", () => {
    test("k=0 → 거래 불가 → 0", () => {
      expect(bestTimeToBuyAndSellStockK(0, [1, 2, 3])).toBe(0);
    });

    test("내림차순 → 0", () => {
      expect(bestTimeToBuyAndSellStockK(2, [5, 4, 3, 2, 1])).toBe(0);
    });

    test("k가 충분히 크면 모든 상승분 합 [1,2,3,4,5] → 4", () => {
      // k=100, 1→2→3→4→5: (2-1)+(3-2)+(4-3)+(5-4)=4
      expect(bestTimeToBuyAndSellStockK(100, [1, 2, 3, 4, 5])).toBe(4);
    });

    test("동일 가격 배열 → 0", () => {
      expect(bestTimeToBuyAndSellStockK(3, [5, 5, 5, 5])).toBe(0);
    });
  });

  describe("바운더리", () => {
    test("N=1 → 0", () => {
      expect(bestTimeToBuyAndSellStockK(2, [5])).toBe(0);
    });

    test("k=1, N=2 상승 [1,10] → 9", () => {
      expect(bestTimeToBuyAndSellStockK(1, [1, 10])).toBe(9);
    });

    test("k=100, 최대 차이 [0,10000] → 10000", () => {
      expect(bestTimeToBuyAndSellStockK(100, [0, 10000])).toBe(10000);
    });
  });

  describe("성능", () => {
    test("N=1000, k=100을 100ms 이내에 처리한다", () => {
      const N = 1000;
      const prices = Array.from({ length: N }, (_, i) => (i * 7) % 100);

      const start = performance.now();
      bestTimeToBuyAndSellStockK(100, prices);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });
});
