import { test, expect, describe } from "bun:test";
import { unboundedKnapsack } from "./unboundedKnapsack";

describe("unboundedKnapsack", () => {
  describe("기본", () => {
    test("coins=[1,2,5], amount=11 → 5+5+1 = 3개", () => {
      expect(unboundedKnapsack([1, 2, 5], 11)).toBe(3);
    });

    test("coins=[2], amount=3 → 만들 수 없음 → -1", () => {
      expect(unboundedKnapsack([2], 3)).toBe(-1);
    });

    test("coins=[1], amount=0 → 0개", () => {
      expect(unboundedKnapsack([1], 0)).toBe(0);
    });

    test("coins=[1,3,4], amount=6 → 3+3 = 2개", () => {
      expect(unboundedKnapsack([1, 3, 4], 6)).toBe(2);
    });
  });

  describe("엣지", () => {
    test("amount=0 → 항상 0개", () => {
      expect(unboundedKnapsack([2, 5], 0)).toBe(0);
    });

    test("coins=[]일 때 amount=0 → 0", () => {
      expect(unboundedKnapsack([], 0)).toBe(0);
    });

    test("coins=[]일 때 amount>0 → -1", () => {
      expect(unboundedKnapsack([], 5)).toBe(-1);
    });

    test("동일 액면가 동전 다수 → 1개로 정답", () => {
      expect(unboundedKnapsack([7, 7, 7], 7)).toBe(1);
    });

    test("그리디로 실패하는 케이스 coins=[1,3,4], amount=6 → 2(3+3) 아닌 그리디(4+1+1=3) 아님", () => {
      expect(unboundedKnapsack([1, 3, 4], 6)).toBe(2);
    });
  });

  describe("바운더리", () => {
    test("amount=1, coins에 1 포함 → 1", () => {
      expect(unboundedKnapsack([1, 2, 5], 1)).toBe(1);
    });

    test("amount=10000 모두 1로 만들기 → 10000", () => {
      expect(unboundedKnapsack([1], 10000)).toBe(10000);
    });

    test("amount=10000, coins=[10000] → 1", () => {
      expect(unboundedKnapsack([10000], 10000)).toBe(1);
    });

    test("coins에 amount보다 큰 동전만 있음 → -1", () => {
      expect(unboundedKnapsack([5, 10], 3)).toBe(-1);
    });
  });

  describe("성능", () => {
    test("n=100, amount=10000을 100ms 이내에 처리한다", () => {
      const n = 100;
      const coins = Array.from({ length: n }, (_, i) => i + 1);
      const amount = 10_000;

      const start = performance.now();
      const result = unboundedKnapsack(coins, amount);
      const elapsed = performance.now() - start;

      expect(result).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
