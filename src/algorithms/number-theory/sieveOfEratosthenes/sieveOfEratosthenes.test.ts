import { test, expect, describe } from "bun:test";
import { sieveOfEratosthenes } from "./sieveOfEratosthenes";

describe("sieveOfEratosthenes", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("n=10 → [2,3,5,7]", () => {
      expect(sieveOfEratosthenes(10)).toEqual([2, 3, 5, 7]);
    });

    test("n=20 → [2,3,5,7,11,13,17,19]", () => {
      expect(sieveOfEratosthenes(20)).toEqual([2, 3, 5, 7, 11, 13, 17, 19]);
    });

    test("n=30 → 10개 소수", () => {
      expect(sieveOfEratosthenes(30)).toEqual([
        2, 3, 5, 7, 11, 13, 17, 19, 23, 29,
      ]);
    });

    test("n=100 일 때 소수 개수는 25", () => {
      expect(sieveOfEratosthenes(100).length).toBe(25);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("n=0 → []", () => {
      expect(sieveOfEratosthenes(0)).toEqual([]);
    });

    test("n=1 → []", () => {
      expect(sieveOfEratosthenes(1)).toEqual([]);
    });

    test("n=2 → [2]", () => {
      expect(sieveOfEratosthenes(2)).toEqual([2]);
    });

    test("n=3 → [2,3]", () => {
      expect(sieveOfEratosthenes(3)).toEqual([2, 3]);
    });

    test("정확히 소수가 상한인 경우 (n=7) → [2,3,5,7]", () => {
      expect(sieveOfEratosthenes(7)).toEqual([2, 3, 5, 7]);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("n=1000 일 때 소수 개수는 168", () => {
      expect(sieveOfEratosthenes(1000).length).toBe(168);
    });

    test("n=10000 일 때 소수 개수는 1229", () => {
      expect(sieveOfEratosthenes(10000).length).toBe(1229);
    });

    test("n=100000 일 때 마지막 소수는 99991", () => {
      const primes = sieveOfEratosthenes(100000);
      expect(primes[primes.length - 1]).toBe(99991);
    });
  });

  // 성능
  describe("성능", () => {
    test("n=10^6 을 100ms 이내", () => {
      const start = performance.now();
      const primes = sieveOfEratosthenes(1_000_000);
      const elapsed = performance.now() - start;

      // pi(10^6) = 78498
      expect(primes.length).toBe(78498);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
