import { test, expect, describe } from "bun:test";
import { babyStepGiantStep } from "./babyStepGiantStep";

describe("babyStepGiantStep", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("2^x ≡ 3 (mod 5) → x=3 (2^3 = 8 ≡ 3)", () => {
      expect(babyStepGiantStep(2n, 3n, 5n)).toBe(3n);
    });

    test("3^x ≡ 13 (mod 17) → x=4 (3^4 = 81 = 4*17 + 13)", () => {
      expect(babyStepGiantStep(3n, 13n, 17n)).toBe(4n);
    });

    test("5^x ≡ 33 (mod 58)", () => {
      // 5^1=5, 5^2=25, 5^3=125≡9, 5^4=45, 5^5=225≡51, 5^6=255≡23, 5^7=115≡57, 5^8=285≡53, 5^9=33
      expect(babyStepGiantStep(5n, 33n, 58n)).toBe(9n);
    });

    test("가장 작은 x를 반환 - 2^x ≡ 1 (mod 7) → x=0 (a^0=1)", () => {
      expect(babyStepGiantStep(2n, 1n, 7n)).toBe(0n);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("b=1 일 때 → x=0", () => {
      expect(babyStepGiantStep(7n, 1n, 13n)).toBe(0n);
    });

    test("해가 존재하지 않는 경우 - 2^x ≡ 3 (mod 4)", () => {
      // 2^0=1, 2^1=2, 2^2=0, 2^3=0, ... → 3은 없음
      expect(babyStepGiantStep(2n, 3n, 4n)).toBe(-1n);
    });

    test("a^1 = b 인 단순 케이스 (3^1 ≡ 3 mod 7)", () => {
      expect(babyStepGiantStep(3n, 3n, 7n)).toBe(1n);
    });

    test("m이 소수이고 a가 m의 원시근인 경우 - 2^x ≡ 5 (mod 13)", () => {
      // 2의 13에서의 거듭제곱: 2,4,8,3,6,12,11,9,5,10,7,1 (x=9)
      expect(babyStepGiantStep(2n, 5n, 13n)).toBe(9n);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("큰 소수 모듈러 - 큰 m=10^9+7", () => {
      const p = 1000000007n;
      // a^k ≡ b 가 되도록 b를 a^k로 구성
      const a = 5n;
      const k = 12345n;
      // 직접 거듭제곱 계산
      let b = 1n;
      for (let i = 0n; i < k; i++) b = (b * a) % p;

      const x = babyStepGiantStep(a, b, p);
      expect(x >= 0n).toBe(true);
      // x가 진짜 해인지 검증
      let lhs = 1n;
      for (let i = 0n; i < x; i++) lhs = (lhs * a) % p;
      expect(lhs).toBe(b);
    });

    test("a, b가 m으로 정규화 - a=15, b=3, m=12 (a mod m = 3)", () => {
      // 15 ≡ 3 (mod 12) → 3^x ≡ 3 (mod 12) → x=1
      const x = babyStepGiantStep(15n, 3n, 12n);
      expect(x).toBe(1n);
    });
  });

  // 성능
  describe("성능", () => {
    test("m=10^9+7 에서 1초 이내", () => {
      const p = 1000000007n;
      const a = 3n;
      const b = 999999n;

      const start = performance.now();
      const x = babyStepGiantStep(a, b, p);
      const elapsed = performance.now() - start;

      // 결과가 -1 이거나 유효해야 함
      expect(x === -1n || x >= 0n).toBe(true);
      expect(elapsed).toBeLessThan(1000);
    });
  });
});
