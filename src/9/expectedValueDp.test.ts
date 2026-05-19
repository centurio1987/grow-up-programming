import { test, expect, describe } from "bun:test";
import { expectedValueDp } from "./expectedValueDp";

describe("expectedValueDp", () => {
  describe("기본", () => {
    test("N=1, K=1 → 모든 면이 >=1 → 1", () => {
      expect(expectedValueDp(1, 1)).toBeCloseTo(1, 10);
    });

    test("N=1, K=6 → P(주사위=6) = 1/6", () => {
      expect(expectedValueDp(1, 6)).toBeCloseTo(1 / 6, 10);
    });

    test("N=1, K=4 → P(>=4) = 3/6 = 0.5", () => {
      expect(expectedValueDp(1, 4)).toBeCloseTo(0.5, 10);
    });

    test("N=2, K=12 → P(2개 모두 6) = 1/36", () => {
      expect(expectedValueDp(2, 12)).toBeCloseTo(1 / 36, 10);
    });

    test("N=2, K=7 → P(합>=7) = 21/36", () => {
      // 합>=7인 경우: 6+1..6,5+2..6,4+3..6,3+4..6,2+5..6,1+6 = 6+5+4+3+2+1 = 21
      expect(expectedValueDp(2, 7)).toBeCloseTo(21 / 36, 10);
    });
  });

  describe("엣지", () => {
    test("K=0 → 항상 합>=0 → 확률 1", () => {
      expect(expectedValueDp(5, 0)).toBeCloseTo(1, 10);
    });

    test("K=1 → 항상 합>=1 (N>=1) → 1", () => {
      expect(expectedValueDp(3, 1)).toBeCloseTo(1, 10);
    });

    test("K가 6N과 같음 → (1/6)^N", () => {
      // N=3, K=18 → (1/6)^3
      expect(expectedValueDp(3, 18)).toBeCloseTo(1 / 216, 10);
    });

    test("K가 6N보다 큼 → 0", () => {
      expect(expectedValueDp(2, 13)).toBeCloseTo(0, 10);
    });

    test("K가 N보다 작거나 같음 → 1 (최소 합은 N)", () => {
      // 최소 합 = N
      expect(expectedValueDp(4, 4)).toBeCloseTo(1, 10);
    });
  });

  describe("바운더리", () => {
    test("N=1, K=0 → 1", () => {
      expect(expectedValueDp(1, 0)).toBeCloseTo(1, 10);
    });

    test("N=1, K=7 → 0", () => {
      expect(expectedValueDp(1, 7)).toBeCloseTo(0, 10);
    });

    test("확률은 [0,1] 범위 내", () => {
      for (let k = 0; k <= 30; k++) {
        const p = expectedValueDp(5, k);
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }
    });

    test("K가 1 증가하면 확률은 단조 감소", () => {
      let prev = expectedValueDp(4, 0);
      for (let k = 1; k <= 24; k++) {
        const cur = expectedValueDp(4, k);
        expect(cur).toBeLessThanOrEqual(prev + 1e-12);
        prev = cur;
      }
    });
  });

  describe("성능", () => {
    test("N=1000, K=3500을 100ms 이내에 처리한다", () => {
      const N = 1000;
      const K = 3500;

      const start = performance.now();
      const result = expectedValueDp(N, K);
      const elapsed = performance.now() - start;

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
