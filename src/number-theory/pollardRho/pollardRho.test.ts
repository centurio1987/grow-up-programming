import { test, expect, describe } from "bun:test";
import { pollardRho } from "./pollardRho";

describe("pollardRho", () => {
  // 기본 동작 - 반환값이 실제로 n의 약수인지 검증
  describe("기본 동작", () => {
    test("n=15 → 3 또는 5", () => {
      const d = pollardRho(15n);
      expect(15n % d).toBe(0n);
      expect(d > 1n && d < 15n).toBe(true);
    });

    test("n=21 → 3 또는 7", () => {
      const d = pollardRho(21n);
      expect(21n % d).toBe(0n);
      expect(d === 3n || d === 7n).toBe(true);
    });

    test("n=8051 = 83 * 97", () => {
      const d = pollardRho(8051n);
      expect(8051n % d).toBe(0n);
      expect(d === 83n || d === 97n).toBe(true);
    });

    test("n = 1000007 * 1000003 (두 큰 소수의 곱)", () => {
      const n = 1000007n * 1000003n;
      const d = pollardRho(n);
      expect(n % d).toBe(0n);
      expect(d > 1n && d < n).toBe(true);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("짝수 n=2*p → 2를 반환", () => {
      const d = pollardRho(2n * 1000003n);
      expect((2n * 1000003n) % d).toBe(0n);
      expect(d > 1n).toBe(true);
    });

    test("제곱수 n=49 = 7*7", () => {
      const d = pollardRho(49n);
      expect(49n % d).toBe(0n);
      expect(d).toBe(7n);
    });

    test("세제곱수 n=27 = 3^3", () => {
      const d = pollardRho(27n);
      expect(27n % d).toBe(0n);
      expect(d > 1n && d <= 27n).toBe(true);
    });

    test("작은 합성수 n=4", () => {
      const d = pollardRho(4n);
      expect(4n % d).toBe(0n);
      expect(d).toBe(2n);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("64비트 근방 합성수 (큰 소수 * 큰 소수)", () => {
      // 두 큰 소수 (10^9 근방) 의 곱
      const p = 1000000007n;
      const q = 1000000009n;
      const n = p * q;
      const d = pollardRho(n);
      expect(n % d).toBe(0n);
      expect(d === p || d === q).toBe(true);
    });

    test("작은 소수 인수를 포함한 합성수 (3 * 큰소수)", () => {
      const n = 3n * 1_000_000_007n;
      const d = pollardRho(n);
      expect(n % d).toBe(0n);
      expect(d > 1n && d < n).toBe(true);
    });
  });

  // 성능
  describe("성능", () => {
    test("두 큰 소수의 곱 (~10^18) 을 500ms 이내", () => {
      // p ≈ 10^9 인근 소수
      const p = 999999937n;
      const q = 1000000007n;
      const n = p * q;

      const start = performance.now();
      const d = pollardRho(n);
      const elapsed = performance.now() - start;

      expect(n % d).toBe(0n);
      expect(d > 1n && d < n).toBe(true);
      expect(elapsed).toBeLessThan(500);
    });
  });
});
