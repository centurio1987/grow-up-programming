import { test, expect, describe } from "bun:test";
import { countInversions } from "./countInversions";

describe("countInversions", () => {
  // 기본 동작
  test("[2,4,1,3,5] → 역순쌍 3개", () => {
    // (2,1), (4,1), (4,3)
    expect(countInversions([2, 4, 1, 3, 5])).toBe(3);
  });

  test("이미 오름차순 정렬된 배열 → 0", () => {
    expect(countInversions([1, 2, 3, 4, 5])).toBe(0);
  });

  test("완전 역순 [5,4,3,2,1] → n(n-1)/2 = 10", () => {
    expect(countInversions([5, 4, 3, 2, 1])).toBe(10);
  });

  // 엣지 케이스
  test("길이 1 배열 → 0", () => {
    expect(countInversions([42])).toBe(0);
  });

  test("길이 2 — 오름차순 → 0", () => {
    expect(countInversions([1, 2])).toBe(0);
  });

  test("길이 2 — 역순 → 1", () => {
    expect(countInversions([2, 1])).toBe(1);
  });

  test("중복 원소 — 같은 값은 역순쌍이 아님 [2,2,2] → 0", () => {
    expect(countInversions([2, 2, 2])).toBe(0);
  });

  test("중복 원소 혼합 [3,1,2,3,1] 검증", () => {
    // (3,1)@0-1, (3,2)@0-2, (3,1)@0-4, (2,1)@2-4, (3,1)@3-4 = 5
    expect(countInversions([3, 1, 2, 3, 1])).toBe(5);
  });

  test("음수 포함 [-1,-3,0,-2] 검증", () => {
    // (-1,-3),(-1,-2),(-3,?)(없음),(0,-2) = 3
    expect(countInversions([-1, -3, 0, -2])).toBe(3);
  });

  // 바운더리 테스트
  test("빈 배열 → 0", () => {
    expect(countInversions([])).toBe(0);
  });

  test("N=10,000 완전 역순 → 49,995,000", () => {
    const N = 10_000;
    const arr = Array.from({ length: N }, (_, i) => N - i);
    expect(countInversions(arr)).toBe((N * (N - 1)) / 2);
  });

  // 성능 테스트 — O(n log n)이면 n=10^5에서 100ms 이내
  test("N=100,000 입력을 100ms 이내에 처리한다", () => {
    const N = 100_000;
    const arr = Array.from({ length: N }, (_, i) => N - i);
    const start = performance.now();
    const result = countInversions(arr);
    const elapsed = performance.now() - start;
    expect(result).toBe((N * (N - 1)) / 2);
    expect(elapsed).toBeLessThan(100);
  });
});
