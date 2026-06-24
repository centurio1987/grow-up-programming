import { test, expect, describe } from "bun:test";
import { digitDp } from "./digitDp";

describe("digitDp", () => {
  describe("기본", () => {
    test("N=20, K=2 → {2,11,20} = 3", () => {
      expect(digitDp(20, 2)).toBe(3);
    });

    test("N=10, K=1 → {1,10} = 2", () => {
      expect(digitDp(10, 1)).toBe(2);
    });

    test("N=9, K=5 → {5} = 1", () => {
      expect(digitDp(9, 5)).toBe(1);
    });

    test("N=100, K=10 → 9 (19,28,37,46,55,64,73,82,91)", () => {
      expect(digitDp(100, 10)).toBe(9);
    });
  });

  describe("엣지", () => {
    test("K=0, N>=1 → 0 (1 이상에서 자릿수 합이 0인 수 없음)", () => {
      expect(digitDp(100, 0)).toBe(0);
    });

    test("K가 자리수×9를 초과 → 0", () => {
      // 두 자릿수의 자리합 최대=18, K=20이면 0
      expect(digitDp(99, 20)).toBe(0);
    });

    test("N=1, K=1 → 1", () => {
      expect(digitDp(1, 1)).toBe(1);
    });

    test("N=1, K=2 → 0", () => {
      expect(digitDp(1, 2)).toBe(0);
    });

    test("N=9, K=9 → {9} = 1", () => {
      expect(digitDp(9, 9)).toBe(1);
    });

    test("N=99, K=18 → {99} = 1", () => {
      expect(digitDp(99, 18)).toBe(1);
    });
  });

  describe("바운더리", () => {
    test("N=10, K=1 — 자리수 경계", () => {
      // {1, 10}
      expect(digitDp(10, 1)).toBe(2);
    });

    test("N=999, K=27 → {999} = 1", () => {
      expect(digitDp(999, 27)).toBe(1);
    });

    test("N=1000, K=1 → {1,10,100,1000} = 4", () => {
      expect(digitDp(1000, 1)).toBe(4);
    });
  });

  describe("성능", () => {
    test("N=10^15, K=50을 100ms 이내에 처리한다", () => {
      const N = 10 ** 15;
      const K = 50;

      const start = performance.now();
      const result = digitDp(N, K);
      const elapsed = performance.now() - start;

      expect(result).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
