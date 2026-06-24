import { test, expect, describe } from "bun:test";
import { fastPower } from "./fastPower";

describe("fastPower", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("2^10 mod 1000 = 24", () => {
      expect(fastPower(2n, 10n, 1000n)).toBe(24n);
    });

    test("3^5 mod 100 = 43 (243 mod 100)", () => {
      expect(fastPower(3n, 5n, 100n)).toBe(43n);
    });

    test("페르마의 소정리 - 2^{p-1} ≡ 1 (mod p), p=1000000007", () => {
      const p = 1000000007n;
      expect(fastPower(2n, p - 1n, p)).toBe(1n);
    });

    test("7^256 mod 13", () => {
      // 직접 계산 검증
      let expected = 1n;
      for (let i = 0; i < 256; i++) expected = (expected * 7n) % 13n;
      expect(fastPower(7n, 256n, 13n)).toBe(expected);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("base^0 = 1", () => {
      expect(fastPower(123n, 0n, 1000n)).toBe(1n);
    });

    test("0^0 정의 - 1", () => {
      expect(fastPower(0n, 0n, 7n)).toBe(1n);
    });

    test("0^n = 0 (n > 0)", () => {
      expect(fastPower(0n, 5n, 7n)).toBe(0n);
    });

    test("1^n = 1", () => {
      expect(fastPower(1n, 1_000_000n, 1000n)).toBe(1n);
    });

    test("mod = 1 인 경우 모든 결과는 0", () => {
      expect(fastPower(5n, 100n, 1n)).toBe(0n);
    });

    test("base가 mod보다 큰 경우 정규화", () => {
      expect(fastPower(1005n, 2n, 1000n)).toBe(25n);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("매우 큰 mod (mod = 10^18+9)", () => {
      const mod = 1000000000000000009n;
      expect(fastPower(2n, 60n, mod)).toBe(1152921504606846976n);
    });

    test("지수 = 1", () => {
      expect(fastPower(123456789n, 1n, 1000000007n)).toBe(123456789n);
    });
  });

  // 성능
  describe("성능", () => {
    test("exp=10^18 을 50ms 이내", () => {
      const exp = 1_000_000_000_000_000_000n;
      const mod = 1_000_000_007n;

      const start = performance.now();
      const result = fastPower(2n, exp, mod);
      const elapsed = performance.now() - start;

      expect(result >= 0n && result < mod).toBe(true);
      expect(elapsed).toBeLessThan(50);
    });
  });
});
