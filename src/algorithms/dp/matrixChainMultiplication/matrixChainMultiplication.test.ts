import { test, expect, describe } from "bun:test";
import { matrixChainMultiplication } from "./matrixChainMultiplication";

describe("matrixChainMultiplication", () => {
  describe("기본", () => {
    test("dims=[10,20,30,40,30] → 30000", () => {
      // 고전 예제
      expect(matrixChainMultiplication([10, 20, 30, 40, 30])).toBe(30000);
    });

    test("dims=[40,20,30,10,30] → 26000", () => {
      expect(matrixChainMultiplication([40, 20, 30, 10, 30])).toBe(26000);
    });

    test("dims=[1,2,3,4] → 18 ((A*B)*C: 1*2*3+1*3*4=6+12=18)", () => {
      // 두 가지 결합: ((AB)C)=1*2*3 + 1*3*4 = 6+12=18, (A(BC))=2*3*4 + 1*2*4 = 24+8=32
      expect(matrixChainMultiplication([1, 2, 3, 4])).toBe(18);
    });
  });

  describe("엣지", () => {
    test("행렬 1개 (dims 길이 2) → 0 (곱셈 없음)", () => {
      expect(matrixChainMultiplication([10, 20])).toBe(0);
    });

    test("행렬 2개 (dims 길이 3) → dims[0]*dims[1]*dims[2]", () => {
      expect(matrixChainMultiplication([5, 10, 3])).toBe(150);
    });

    test("모든 차원이 동일 — dims=[5,5,5,5] → 250", () => {
      // (AB)C: 5*5*5 + 5*5*5 = 250
      expect(matrixChainMultiplication([5, 5, 5, 5])).toBe(250);
    });

    test("dims=[2,3,4,2,5] → 결합 최소값", () => {
      // (A(BC))D: 3*4*2 + 2*3*2 + 2*2*5 = 24+12+20 = 56
      // ((AB)C)D: 2*3*4 + 2*4*2 + 2*2*5 = 24+16+20 = 60
      // (A(B(CD))): 4*2*5 + 3*4*5 + 2*3*5 = 40+60+30 = 130
      // ((AB)(CD)): 2*3*4 + 4*2*5 + 2*4*5 = 24+40+40 = 104
      // (A((BC)D)): 3*4*2 + 3*2*5 + 2*3*5 = 24+30+30 = 84
      expect(matrixChainMultiplication([2, 3, 4, 2, 5])).toBe(56);
    });
  });

  describe("바운더리", () => {
    test("최소 입력 — dims 길이 1 (행렬 0개) → 0", () => {
      expect(matrixChainMultiplication([10])).toBe(0);
    });

    test("dims 모두 1 → 0", () => {
      expect(matrixChainMultiplication([1, 1, 1, 1, 1])).toBe(0);
    });

    test("차원이 큰 값", () => {
      // dims=[500,500,500] → 500*500*500 = 1.25e8
      expect(matrixChainMultiplication([500, 500, 500])).toBe(125_000_000);
    });
  });

  describe("성능", () => {
    test("n=100 (dims 길이 101)을 100ms 이내에 처리한다", () => {
      const n = 100;
      const dims = Array.from({ length: n + 1 }, (_, i) => ((i * 13) % 50) + 1);

      const start = performance.now();
      const result = matrixChainMultiplication(dims);
      const elapsed = performance.now() - start;

      expect(result).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
