import { test, expect, describe } from "bun:test";
import { coinChangeWays } from "./coinChangeWays";

describe("coinChangeWays", () => {
  describe("기본", () => {
    test("coins=[1,2,5], amount=5 → {5},{2+2+1},{2+1+1+1},{1*5} = 4가지", () => {
      expect(coinChangeWays([1, 2, 5], 5)).toBe(4);
    });

    test("coins=[2], amount=3 → 0가지", () => {
      expect(coinChangeWays([2], 3)).toBe(0);
    });

    test("coins=[1,2,3], amount=4 → {1*4},{1*2+2},{2+2},{1+3} = 4가지", () => {
      expect(coinChangeWays([1, 2, 3], 4)).toBe(4);
    });
  });

  describe("엣지", () => {
    test("amount=0 → 공집합 1가지", () => {
      expect(coinChangeWays([1, 2, 5], 0)).toBe(1);
    });

    test("coins=[]이고 amount=0 → 1", () => {
      expect(coinChangeWays([], 0)).toBe(1);
    });

    test("coins=[]이고 amount>0 → 0", () => {
      expect(coinChangeWays([], 5)).toBe(0);
    });

    test("순서는 구분하지 않음 — [1,2]/[2,1] 동일 결과", () => {
      expect(coinChangeWays([1, 2], 3)).toBe(coinChangeWays([2, 1], 3));
    });

    test("coins=[10], amount=10 → 1", () => {
      expect(coinChangeWays([10], 10)).toBe(1);
    });
  });

  describe("바운더리", () => {
    test("amount=1, coins에 1 포함 → 1", () => {
      expect(coinChangeWays([1, 5, 10], 1)).toBe(1);
    });

    test("amount=10000 모두 1로 만들기 → 1", () => {
      expect(coinChangeWays([1], 10000)).toBe(1);
    });

    test("coins에 amount보다 큰 동전만 → 0", () => {
      expect(coinChangeWays([5, 10], 3)).toBe(0);
    });
  });

  describe("성능", () => {
    test("n=100, amount=10000을 100ms 이내에 처리한다", () => {
      const n = 100;
      const coins = Array.from({ length: n }, (_, i) => i + 1);
      const amount = 10_000;

      const start = performance.now();
      const result = coinChangeWays(coins, amount);
      const elapsed = performance.now() - start;

      expect(result).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
