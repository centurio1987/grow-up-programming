import { test, expect, describe } from "bun:test";
import { extendedEuclidean } from "./extendedEuclidean";

describe("extendedEuclidean", () => {
  // 기본 동작 - 반환된 (x, y)가 a*x + b*y = g를 만족하는지 검증
  describe("기본 동작", () => {
    test("extGcd(30, 18) → g=6, 30x + 18y = 6", () => {
      const { g, x, y } = extendedEuclidean(30n, 18n);
      expect(g).toBe(6n);
      expect(30n * x + 18n * y).toBe(6n);
    });

    test("extGcd(35, 15) → g=5, 35x + 15y = 5", () => {
      const { g, x, y } = extendedEuclidean(35n, 15n);
      expect(g).toBe(5n);
      expect(35n * x + 15n * y).toBe(5n);
    });

    test("서로소 - extGcd(17, 5) → g=1, 17x + 5y = 1", () => {
      const { g, x, y } = extendedEuclidean(17n, 5n);
      expect(g).toBe(1n);
      expect(17n * x + 5n * y).toBe(1n);
    });

    test("모듈러 역원 계산 - 3^{-1} mod 11 = 4 (3*4 = 12 ≡ 1)", () => {
      const { g, x } = extendedEuclidean(3n, 11n);
      expect(g).toBe(1n);
      const inv = ((x % 11n) + 11n) % 11n;
      expect(inv).toBe(4n);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("extGcd(0, 0) → g=0", () => {
      const { g } = extendedEuclidean(0n, 0n);
      expect(g).toBe(0n);
    });

    test("extGcd(a, 0) → g=a, x=1, y=0", () => {
      const { g, x, y } = extendedEuclidean(7n, 0n);
      expect(g).toBe(7n);
      expect(7n * x + 0n * y).toBe(7n);
    });

    test("extGcd(0, b) → g=b, x=0, y=1", () => {
      const { g, x, y } = extendedEuclidean(0n, 9n);
      expect(g).toBe(9n);
      expect(0n * x + 9n * y).toBe(9n);
    });

    test("음수 입력 - extGcd(-30, 18) - g=6, 식 성립", () => {
      const { g, x, y } = extendedEuclidean(-30n, 18n);
      expect(g === 6n || g === -6n).toBe(true);
      expect(-30n * x + 18n * y).toBe(g);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("큰 소수 쌍 - extGcd(1000000007, 998244353), g=1", () => {
      const a = 1000000007n;
      const b = 998244353n;
      const { g, x, y } = extendedEuclidean(a, b);
      expect(g).toBe(1n);
      expect(a * x + b * y).toBe(1n);
    });

    test("같은 두 수 - extGcd(13, 13) → g=13", () => {
      const { g, x, y } = extendedEuclidean(13n, 13n);
      expect(g).toBe(13n);
      expect(13n * x + 13n * y).toBe(13n);
    });
  });

  // 성능
  describe("성능", () => {
    test("큰 bigint 1000회 호출을 100ms 이내", () => {
      const a = 12200160415121876738n;
      const b = 7540113804746346429n;

      const start = performance.now();
      let result = { g: 0n, x: 0n, y: 0n };
      for (let i = 0; i < 1000; i++) {
        result = extendedEuclidean(a, b);
      }
      const elapsed = performance.now() - start;

      expect(a * result.x + b * result.y).toBe(result.g);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
