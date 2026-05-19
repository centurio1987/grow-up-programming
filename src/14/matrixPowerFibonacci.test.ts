import { test, expect, describe } from "bun:test";
import { matrixPowerFibonacci } from "./matrixPowerFibonacci";

describe("matrixPowerFibonacci", () => {
  // 기본 동작 — 작은 값들
  test("F(0) = 0", () => {
    expect(matrixPowerFibonacci(0n)).toBe(0n);
  });

  test("F(1) = 1", () => {
    expect(matrixPowerFibonacci(1n)).toBe(1n);
  });

  test("F(2) = 1", () => {
    expect(matrixPowerFibonacci(2n)).toBe(1n);
  });

  test("F(3) = 2", () => {
    expect(matrixPowerFibonacci(3n)).toBe(2n);
  });

  test("F(10) = 55", () => {
    expect(matrixPowerFibonacci(10n)).toBe(55n);
  });

  test("F(20) = 6765", () => {
    expect(matrixPowerFibonacci(20n)).toBe(6765n);
  });

  test("F(50) = 12586269025", () => {
    expect(matrixPowerFibonacci(50n)).toBe(12586269025n);
  });

  // 점화식 검증 — F(n) = F(n-1) + F(n-2)
  test("점화식 F(n) = F(n-1) + F(n-2) 가 성립한다 (n=2..30)", () => {
    let a = 0n;
    let b = 1n;
    for (let n = 2; n <= 30; n++) {
      const expected = a + b;
      expect(matrixPowerFibonacci(BigInt(n))).toBe(expected);
      a = b;
      b = expected;
    }
  });

  // 큰 값
  test("F(100) = 354224848179261915075", () => {
    expect(matrixPowerFibonacci(100n)).toBe(354224848179261915075n);
  });

  test("F(200) = 280571172992510140037611932413038677189525n", () => {
    expect(matrixPowerFibonacci(200n)).toBe(
      280571172992510140037611932413038677189525n,
    );
  });

  // 엣지 케이스
  test("F(0) 은 0이며 항등 행렬을 의미한다", () => {
    expect(matrixPowerFibonacci(0n)).toBe(0n);
  });

  test("결과는 bigint 타입이다", () => {
    expect(typeof matrixPowerFibonacci(10n)).toBe("bigint");
  });

  // 바운더리 — n = 10^18
  test("n=10^18 은 양의 bigint 값을 반환한다", () => {
    const result = matrixPowerFibonacci(10n ** 18n);
    expect(typeof result).toBe("bigint");
    expect(result > 0n).toBe(true);
  });

  // 성능 테스트 — n=10^18 을 100ms 이내 (O(log n) 검증)
  test("n=10^18 입력을 100ms 이내에 처리한다", () => {
    const n = 10n ** 18n;

    const start = performance.now();
    const result = matrixPowerFibonacci(n);
    const elapsed = performance.now() - start;

    expect(typeof result).toBe("bigint");
    expect(elapsed).toBeLessThan(100);
  });
});
