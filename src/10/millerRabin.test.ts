import { test, expect, describe } from "bun:test";
import { millerRabin } from "./millerRabin";

describe("millerRabin", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("작은 소수를 모두 판별한다", () => {
      const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n];
      for (const p of primes) {
        expect(millerRabin(p)).toBe(true);
      }
    });

    test("작은 합성수를 모두 판별한다", () => {
      const composites = [4n, 6n, 8n, 9n, 15n, 21n, 25n, 27n, 33n, 35n];
      for (const c of composites) {
        expect(millerRabin(c)).toBe(false);
      }
    });

    test("큰 소수 - 10^9 + 7", () => {
      expect(millerRabin(1000000007n)).toBe(true);
    });

    test("큰 소수 - 998244353 (NTT 소수)", () => {
      expect(millerRabin(998244353n)).toBe(true);
    });

    test("큰 합성수 - 10^9 + 9 인근 합성수", () => {
      // 10^9 = 2^9 * 1953125 인근 명확한 합성수
      expect(millerRabin(1_000_000_000n)).toBe(false);
    });
  });

  // 엣지 케이스 - 카마이클 수 등 까다로운 케이스
  describe("엣지 케이스 - 카마이클 수 (강한 의사 소수)", () => {
    test("561 (가장 작은 카마이클 수)는 합성수", () => {
      expect(millerRabin(561n)).toBe(false);
    });

    test("1105 (카마이클 수)는 합성수", () => {
      expect(millerRabin(1105n)).toBe(false);
    });

    test("0은 소수가 아님", () => {
      expect(millerRabin(0n)).toBe(false);
    });

    test("1은 소수가 아님", () => {
      expect(millerRabin(1n)).toBe(false);
    });

    test("2는 소수", () => {
      expect(millerRabin(2n)).toBe(true);
    });
  });

  // 바운더리 - 큰 수
  describe("바운더리", () => {
    test("메르센 소수 2^31-1 = 2147483647는 소수", () => {
      expect(millerRabin((1n << 31n) - 1n)).toBe(true);
    });

    test("2^31은 합성수", () => {
      expect(millerRabin(1n << 31n)).toBe(false);
    });

    test("매우 큰 소수 (64비트 근방) - 18446744073709551557", () => {
      expect(millerRabin(18446744073709551557n)).toBe(true);
    });

    test("64비트 한계 인근 합성수 18446744073709551615 = 2^64-1", () => {
      expect(millerRabin((1n << 64n) - 1n)).toBe(false);
    });
  });

  // 성능
  describe("성능", () => {
    test("메르센 소수 2^61-1 판정을 50ms 이내", () => {
      const mersenne = (1n << 61n) - 1n;

      const start = performance.now();
      const result = millerRabin(mersenne);
      const elapsed = performance.now() - start;

      expect(result).toBe(true);
      expect(elapsed).toBeLessThan(50);
    });
  });
});
