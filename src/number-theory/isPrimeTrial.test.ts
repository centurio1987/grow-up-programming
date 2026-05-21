import { test, expect, describe } from "bun:test";
import { isPrimeTrial } from "./isPrimeTrial";

describe("isPrimeTrial", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("2는 소수", () => {
      expect(isPrimeTrial(2)).toBe(true);
    });

    test("3는 소수", () => {
      expect(isPrimeTrial(3)).toBe(true);
    });

    test("17은 소수", () => {
      expect(isPrimeTrial(17)).toBe(true);
    });

    test("100은 소수가 아님", () => {
      expect(isPrimeTrial(100)).toBe(false);
    });

    test("작은 소수 목록을 모두 판별한다", () => {
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
      for (const p of primes) {
        expect(isPrimeTrial(p)).toBe(true);
      }
    });

    test("작은 합성수 목록을 모두 판별한다", () => {
      const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25];
      for (const c of composites) {
        expect(isPrimeTrial(c)).toBe(false);
      }
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("0은 소수가 아님", () => {
      expect(isPrimeTrial(0)).toBe(false);
    });

    test("1은 소수가 아님", () => {
      expect(isPrimeTrial(1)).toBe(false);
    });

    test("음수는 소수가 아님 (-7)", () => {
      expect(isPrimeTrial(-7)).toBe(false);
    });

    test("9 = 3*3는 합성수 (제곱수 케이스)", () => {
      expect(isPrimeTrial(9)).toBe(false);
    });

    test("49 = 7*7는 합성수", () => {
      expect(isPrimeTrial(49)).toBe(false);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("큰 소수 - 999983", () => {
      expect(isPrimeTrial(999983)).toBe(true);
    });

    test("큰 합성수 - 999999", () => {
      expect(isPrimeTrial(999999)).toBe(false);
    });

    test("1000003은 소수", () => {
      expect(isPrimeTrial(1000003)).toBe(true);
    });
  });

  // 성능
  describe("성능", () => {
    test("n = 10^9 + 7 (소수) 판정을 100ms 이내", () => {
      const start = performance.now();
      const result = isPrimeTrial(1_000_000_007);
      const elapsed = performance.now() - start;

      expect(result).toBe(true);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
