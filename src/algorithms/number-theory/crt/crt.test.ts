import { test, expect, describe } from "bun:test";
import { crt } from "./crt";

describe("crt", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("x≡2 (mod 3), x≡3 (mod 5), x≡2 (mod 7) → x=23, M=105", () => {
      const result = crt([2n, 3n, 2n], [3n, 5n, 7n]);
      expect(result).not.toBeNull();
      expect(result!.x).toBe(23n);
      expect(result!.M).toBe(105n);
    });

    test("x≡1 (mod 2), x≡2 (mod 3) → x=5, M=6", () => {
      const result = crt([1n, 2n], [2n, 3n]);
      expect(result).not.toBeNull();
      expect(result!.x).toBe(5n);
      expect(result!.M).toBe(6n);
    });

    test("x≡0 (mod 4), x≡3 (mod 5) → x=8, M=20", () => {
      const result = crt([0n, 3n], [4n, 5n]);
      expect(result).not.toBeNull();
      expect(result!.x).toBe(8n);
      expect(result!.M).toBe(20n);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("단일 합동식 - x≡5 (mod 7) → x=5, M=7", () => {
      const result = crt([5n], [7n]);
      expect(result).not.toBeNull();
      expect(result!.x).toBe(5n);
      expect(result!.M).toBe(7n);
    });

    test("모듈러가 서로소가 아닌데 호환되는 경우 - x≡2 (mod 6), x≡2 (mod 4)", () => {
      // gcd(6,4)=2, r_i mod 2 = 0 동일 → 호환
      // lcm(6,4)=12, x=2 mod 12
      const result = crt([2n, 2n], [6n, 4n]);
      expect(result).not.toBeNull();
      expect(result!.x).toBe(2n);
      expect(result!.M).toBe(12n);
    });

    test("호환되지 않는 경우 - x≡1 (mod 2), x≡0 (mod 2) → null", () => {
      const result = crt([1n, 0n], [2n, 2n]);
      expect(result).toBeNull();
    });

    test("호환되지 않는 경우 - x≡1 (mod 6), x≡2 (mod 4) → null", () => {
      // gcd(6,4)=2, 1 mod 2 = 1, 2 mod 2 = 0 → 불일치
      const result = crt([1n, 2n], [6n, 4n]);
      expect(result).toBeNull();
    });

    test("모듈러 1 - 모든 입력 정규화", () => {
      // mod 1에서는 모두 0이며 항상 호환
      const result = crt([0n, 3n], [1n, 5n]);
      expect(result).not.toBeNull();
      expect(result!.x).toBe(3n);
      expect(result!.M).toBe(5n);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("큰 모듈러 - 두 큰 소수", () => {
      const m1 = 1000000007n;
      const m2 = 998244353n;
      const r1 = 12345n;
      const r2 = 67890n;
      const result = crt([r1, r2], [m1, m2]);
      expect(result).not.toBeNull();
      expect(result!.x % m1).toBe(r1);
      expect(result!.x % m2).toBe(r2);
      expect(result!.M).toBe(m1 * m2);
    });

    test("여러 모듈러 (5개) 연쇄", () => {
      // 처음 5개 소수
      const moduli = [2n, 3n, 5n, 7n, 11n];
      const remainders = [1n, 2n, 3n, 4n, 5n];
      const result = crt(remainders, moduli);
      expect(result).not.toBeNull();
      expect(result!.M).toBe(2n * 3n * 5n * 7n * 11n);
      for (let i = 0; i < moduli.length; i++) {
        expect(result!.x % moduli[i]!).toBe(remainders[i]!);
      }
    });
  });

  // 성능
  describe("성능", () => {
    test("100개 모듈러를 100ms 이내", () => {
      // 작은 소수들로 구성
      const small = [
        2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n,
        53n, 59n, 61n, 67n, 71n, 73n, 79n, 83n, 89n, 97n,
      ];
      const moduli: bigint[] = [];
      const remainders: bigint[] = [];
      for (let i = 0; i < 100; i++) {
        const m = small[i % small.length]!;
        moduli.push(m);
        remainders.push(BigInt(i) % m);
      }

      const start = performance.now();
      const result = crt(remainders, moduli);
      const elapsed = performance.now() - start;

      // 결과가 null이 아니거나 null이거나 모두 정상
      expect(result === null || result.M > 0n).toBe(true);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
