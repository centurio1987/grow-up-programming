import { test, expect, describe } from "bun:test";
import { missingInteger } from "./missingInteger";

describe("missingInteger", () => {
  // 기본 동작 — 문제 예시
  test("[1,3,6,4,1,2] → 5", () => {
    expect(missingInteger([1, 3, 6, 4, 1, 2])).toBe(5);
  });

  test("[1,2,3] → 4 (1~3 연속, 다음 값)", () => {
    expect(missingInteger([1, 2, 3])).toBe(4);
  });

  test("[-1,-3] → 1 (양수 없음)", () => {
    expect(missingInteger([-1, -3])).toBe(1);
  });

  // 1이 없는 경우
  test("[2,3,4] → 1 (1이 누락)", () => {
    expect(missingInteger([2, 3, 4])).toBe(1);
  });

  // 중복 포함
  test("[1,1,1,1] → 2 (중복된 1만 존재)", () => {
    expect(missingInteger([1, 1, 1, 1])).toBe(2);
  });

  test("[1,2,2,3,3] → 4 (중복 포함 연속)", () => {
    expect(missingInteger([1, 2, 2, 3, 3])).toBe(4);
  });

  // 음수·0 혼합
  test("[0,-1,1,2] → 3 (0과 음수 무시)", () => {
    expect(missingInteger([0, -1, 1, 2])).toBe(3);
  });

  test("[-1000000,1000000] → 1 (범위 극단값, 1 누락)", () => {
    expect(missingInteger([-1_000_000, 1_000_000])).toBe(1);
  });

  // 엣지 케이스 — N=1
  test("N=1, [1] → 2", () => {
    expect(missingInteger([1])).toBe(2);
  });

  test("N=1, [2] → 1 (1이 없음)", () => {
    expect(missingInteger([2])).toBe(1);
  });

  test("N=1, [-5] → 1 (양수 전혀 없음)", () => {
    expect(missingInteger([-5])).toBe(1);
  });

  // 바운더리 — 1~N 완전 집합
  test("1~100,000 완전 집합 → 100,001", () => {
    const A = Array.from({ length: 100_000 }, (_, i) => i + 1);
    expect(missingInteger(A)).toBe(100_001);
  });

  // 성능 테스트 — O(N) 기준 N=100,000을 100ms 이내
  test("N=100,000 배열을 100ms 이내에 처리한다", () => {
    const A = Array.from({ length: 100_000 }, (_, i) => (i % 2 === 0 ? i + 1 : -(i + 1)));
    const start = performance.now();
    missingInteger(A);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
