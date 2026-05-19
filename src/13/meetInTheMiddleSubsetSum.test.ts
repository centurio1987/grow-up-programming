import { test, expect, describe } from "bun:test";
import { meetInTheMiddleSubsetSum } from "./meetInTheMiddleSubsetSum";

describe("meetInTheMiddleSubsetSum", () => {
  // 기본 동작
  test("[1,2,3,4,5], target=9 → true (4+5 또는 2+3+4)", () => {
    expect(meetInTheMiddleSubsetSum([1, 2, 3, 4, 5], 9)).toBe(true);
  });

  test("[1,2,3,4,5], target=20 → false (전체 합 15)", () => {
    expect(meetInTheMiddleSubsetSum([1, 2, 3, 4, 5], 20)).toBe(false);
  });

  test("[3,34,4,12,5,2], target=9 → true (4+5 또는 3+4+2)", () => {
    expect(meetInTheMiddleSubsetSum([3, 34, 4, 12, 5, 2], 9)).toBe(true);
  });

  test("[3,34,4,12,5,2], target=30 → false", () => {
    expect(meetInTheMiddleSubsetSum([3, 34, 4, 12, 5, 2], 30)).toBe(false);
  });

  // 엣지 케이스
  test("target=0 → 공집합으로 항상 true", () => {
    expect(meetInTheMiddleSubsetSum([1, 2, 3], 0)).toBe(true);
  });

  test("길이 1, 원소와 target 일치", () => {
    expect(meetInTheMiddleSubsetSum([7], 7)).toBe(true);
  });

  test("길이 1, target=0 → 공집합으로 true", () => {
    expect(meetInTheMiddleSubsetSum([7], 0)).toBe(true);
  });

  test("길이 1, target≠원소이고 target≠0 → false", () => {
    expect(meetInTheMiddleSubsetSum([7], 5)).toBe(false);
  });

  test("전체 합과 일치", () => {
    expect(meetInTheMiddleSubsetSum([1, 2, 3, 4], 10)).toBe(true);
  });

  test("음수 포함 [-3,-1,2,5], target=4 → true (-1+5 또는 -3-1+2+5+1...)", () => {
    // -1+5=4, true
    expect(meetInTheMiddleSubsetSum([-3, -1, 2, 5], 4)).toBe(true);
  });

  test("음수 포함, target=음수 [-5,3,1], target=-4 → true (-5+1)", () => {
    expect(meetInTheMiddleSubsetSum([-5, 3, 1], -4)).toBe(true);
  });

  // 바운더리 테스트
  test("빈 배열, target=0 → true", () => {
    expect(meetInTheMiddleSubsetSum([], 0)).toBe(true);
  });

  test("빈 배열, target≠0 → false", () => {
    expect(meetInTheMiddleSubsetSum([], 5)).toBe(false);
  });

  test("모두 0인 배열, target=0 → true", () => {
    expect(meetInTheMiddleSubsetSum([0, 0, 0], 0)).toBe(true);
  });

  // 성능 테스트 — n=40에서 100ms 이내
  test("n=40, 해가 존재하는 경우를 100ms 이내에 처리한다", () => {
    const N = 40;
    // 1..40 배열, target = 1+2+...+40 = 820 (전체 합) → true
    const nums = Array.from({ length: N }, (_, i) => i + 1);
    const target = (N * (N + 1)) / 2;

    const start = performance.now();
    const result = meetInTheMiddleSubsetSum(nums, target);
    const elapsed = performance.now() - start;

    expect(result).toBe(true);
    expect(elapsed).toBeLessThan(100);
  });

  test("n=40, 해가 없는 경우를 100ms 이내에 처리한다", () => {
    const N = 40;
    const nums = Array.from({ length: N }, (_, i) => (i + 1) * 2); // 모두 짝수
    const target = 1; // 짝수만으로 1 만들 수 없음

    const start = performance.now();
    const result = meetInTheMiddleSubsetSum(nums, target);
    const elapsed = performance.now() - start;

    expect(result).toBe(false);
    expect(elapsed).toBeLessThan(100);
  });
});
