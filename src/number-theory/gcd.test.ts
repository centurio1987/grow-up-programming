import { test, expect, describe } from "bun:test";
import { gcd } from "./gcd";

describe("gcd", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("gcd(12, 18) = 6", () => {
      expect(gcd(12n, 18n)).toBe(6n);
    });

    test("gcd(100, 75) = 25", () => {
      expect(gcd(100n, 75n)).toBe(25n);
    });

    test("서로소인 두 수의 gcd는 1 (gcd(7, 13) = 1)", () => {
      expect(gcd(7n, 13n)).toBe(1n);
    });

    test("한쪽이 다른 쪽의 배수일 때 (gcd(15, 45) = 15)", () => {
      expect(gcd(15n, 45n)).toBe(15n);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("gcd(0, 0) = 0", () => {
      expect(gcd(0n, 0n)).toBe(0n);
    });

    test("gcd(a, 0) = a (gcd(7, 0) = 7)", () => {
      expect(gcd(7n, 0n)).toBe(7n);
    });

    test("gcd(0, b) = b (gcd(0, 9) = 9)", () => {
      expect(gcd(0n, 9n)).toBe(9n);
    });

    test("두 값이 같을 때 gcd(7, 7) = 7", () => {
      expect(gcd(7n, 7n)).toBe(7n);
    });

    test("음수 입력 - gcd(-12, 18) = 6", () => {
      expect(gcd(-12n, 18n)).toBe(6n);
    });

    test("음수 입력 - gcd(-12, -18) = 6", () => {
      expect(gcd(-12n, -18n)).toBe(6n);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("큰 bigint - gcd(2^60, 2^30) = 2^30", () => {
      expect(gcd(1n << 60n, 1n << 30n)).toBe(1n << 30n);
    });

    test("소수와 그 배수 - gcd(1000003, 2000006) = 1000003", () => {
      expect(gcd(1000003n, 2000006n)).toBe(1000003n);
    });
  });

  // 성능
  describe("성능", () => {
    test("매우 큰 bigint(피보나치-유사) 1000회 호출 100ms 이내", () => {
      // 피보나치 수는 유클리드 호제법 최악 케이스에 해당한다.
      const a = 12200160415121876738n; // Fib(94) 부근
      const b = 7540113804746346429n; // Fib(93) 부근

      const start = performance.now();
      let g = 0n;
      for (let i = 0; i < 1000; i++) {
        g = gcd(a, b);
      }
      const elapsed = performance.now() - start;

      expect(g).toBe(1n);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
