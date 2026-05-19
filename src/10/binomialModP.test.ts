import { test, expect, describe } from "bun:test";
import { binomialModP } from "./binomialModP";

describe("binomialModP", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("C(5, 2) = 10", () => {
      expect(binomialModP(5n, 2n, 1000000007n)).toBe(10n);
    });

    test("C(10, 3) = 120", () => {
      expect(binomialModP(10n, 3n, 1000000007n)).toBe(120n);
    });

    test("C(20, 10) = 184756", () => {
      expect(binomialModP(20n, 10n, 1000000007n)).toBe(184756n);
    });

    test("작은 소수 mod - C(6, 3) mod 7 = 20 mod 7 = 6", () => {
      expect(binomialModP(6n, 3n, 7n)).toBe(6n);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("C(n, 0) = 1", () => {
      expect(binomialModP(100n, 0n, 1000000007n)).toBe(1n);
    });

    test("C(n, n) = 1", () => {
      expect(binomialModP(100n, 100n, 1000000007n)).toBe(1n);
    });

    test("C(0, 0) = 1", () => {
      expect(binomialModP(0n, 0n, 7n)).toBe(1n);
    });

    test("k > n → 0", () => {
      expect(binomialModP(5n, 10n, 1000000007n)).toBe(0n);
    });

    test("C(n, 1) = n mod p", () => {
      expect(binomialModP(123456789n, 1n, 1000000007n)).toBe(123456789n);
    });

    test("대칭성 C(n, k) = C(n, n-k)", () => {
      const p = 1000000007n;
      expect(binomialModP(30n, 7n, p)).toBe(binomialModP(30n, 23n, p));
    });
  });

  // 바운더리 - Lucas 정리 케이스
  describe("바운더리 - Lucas 정리 (n ≥ p)", () => {
    test("작은 p에서 n이 큰 경우 - C(10, 3) mod 3", () => {
      // 10=101_3, 3=010_3 → C(1,0)*C(0,1)*C(1,0) = 1*0*1 = 0
      expect(binomialModP(10n, 3n, 3n)).toBe(0n);
    });

    test("Lucas 케이스 - C(7, 3) mod 5", () => {
      // 7=12_5, 3=03_5 → C(1,0)*C(2,3)=1*0=0
      expect(binomialModP(7n, 3n, 5n)).toBe(0n);
    });

    test("Lucas 케이스 - C(6, 2) mod 5", () => {
      // 6=11_5, 2=02_5 → C(1,0)*C(1,2)=1*0=0
      expect(binomialModP(6n, 2n, 5n)).toBe(0n);
    });

    test("p보다 작은 양 측면 - C(100, 50) mod 1000000007", () => {
      // pre-computed C(100, 50) = 100891344545564193334812497256
      // mod 10^9+7
      const expected = 100891344545564193334812497256n % 1000000007n;
      expect(binomialModP(100n, 50n, 1000000007n)).toBe(expected);
    });
  });

  // 성능
  describe("성능", () => {
    test("C(10^5, 10^5/2) mod 10^9+7 을 200ms 이내", () => {
      const N = 100_000n;
      const K = 50_000n;
      const p = 1_000_000_007n;

      const start = performance.now();
      const result = binomialModP(N, K, p);
      const elapsed = performance.now() - start;

      expect(result >= 0n && result < p).toBe(true);
      expect(elapsed).toBeLessThan(200);
    });
  });
});
