import { test, expect, describe } from "bun:test";
import { knapsack01 } from "./knapsack01";

describe("knapsack01", () => {
  describe("기본", () => {
    test("고전 예제: w=[1,3,4,5], v=[1,4,5,7], W=7 → 9", () => {
      // (3+4) 무게로 (4+5)=9
      expect(knapsack01([1, 3, 4, 5], [1, 4, 5, 7], 7)).toBe(9);
    });

    test("두 물건 중 가치 큰 하나만 담음", () => {
      // W=4 → 무게 3 가치 4 하나만 담을 수 있음
      expect(knapsack01([3, 4], [4, 5], 4)).toBe(5);
    });

    test("모든 물건을 담을 수 있는 경우", () => {
      expect(knapsack01([1, 2, 3], [10, 20, 30], 10)).toBe(60);
    });
  });

  describe("엣지", () => {
    test("빈 입력 → 0", () => {
      expect(knapsack01([], [], 10)).toBe(0);
    });

    test("W=0 → 아무것도 담을 수 없어 0", () => {
      expect(knapsack01([1, 2, 3], [10, 20, 30], 0)).toBe(0);
    });

    test("모든 물건이 W보다 무거움 → 0", () => {
      expect(knapsack01([10, 20, 30], [100, 200, 300], 5)).toBe(0);
    });

    test("물건 하나만 정확히 W에 맞음", () => {
      expect(knapsack01([5], [42], 5)).toBe(42);
    });

    test("동일 무게 다른 가치 — 큰 가치 선택", () => {
      expect(knapsack01([3, 3, 3], [1, 5, 3], 3)).toBe(5);
    });
  });

  describe("바운더리", () => {
    test("N=1, 무게가 W를 초과 → 0", () => {
      expect(knapsack01([10], [100], 5)).toBe(0);
    });

    test("N=1, 무게=W → 가치 그대로", () => {
      expect(knapsack01([10000], [10000], 10000)).toBe(10000);
    });

    test("W=10000, 무게 1짜리 100개 → 100개 모두 담음", () => {
      const w = new Array(100).fill(1);
      const v = new Array(100).fill(7);
      expect(knapsack01(w, v, 10000)).toBe(700);
    });
  });

  describe("성능", () => {
    test("n=100, W=10000을 100ms 이내에 처리한다", () => {
      const n = 100;
      const W = 10_000;
      const weights = Array.from({ length: n }, (_, i) => (i % 100) + 1);
      const values = Array.from({ length: n }, (_, i) => (i % 100) + 1);

      const start = performance.now();
      const result = knapsack01(weights, values, W);
      const elapsed = performance.now() - start;

      expect(result).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
