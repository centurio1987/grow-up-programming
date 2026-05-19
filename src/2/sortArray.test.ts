import { test, expect, describe } from "bun:test";
import { sortArray } from "./sortArray";

describe("sortArray", () => {
  // 기본 동작
  test("무작위 배열을 오름차순으로 정렬한다", () => {
    expect(sortArray([3, 1, 4, 1, 5, 9, 2, 6])).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
  });

  test("이미 정렬된 배열은 그대로 유지된다", () => {
    expect(sortArray([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
  });

  test("역순으로 정렬된 배열도 올바르게 정렬한다", () => {
    expect(sortArray([5, 4, 3, 2, 1])).toEqual([1, 2, 3, 4, 5]);
  });

  // 엣지 케이스
  test("음수가 섞인 배열도 정렬한다", () => {
    expect(sortArray([-3, 1, -4, 1, -5, 9, -2, 6])).toEqual([-5, -4, -3, -2, 1, 1, 6, 9]);
  });

  test("중복이 많은 배열도 정렬한다", () => {
    expect(sortArray([2, 2, 2, 1, 1, 1, 3, 3])).toEqual([1, 1, 1, 2, 2, 2, 3, 3]);
  });

  test("모든 원소가 같은 배열", () => {
    expect(sortArray([7, 7, 7, 7])).toEqual([7, 7, 7, 7]);
  });

  // 바운더리 테스트
  test("최소 길이 배열 (N=1)", () => {
    expect(sortArray([42])).toEqual([42]);
  });

  test("최댓값/최솟값이 포함된 경우", () => {
    expect(sortArray([1_000_000_000, -1_000_000_000, 0])).toEqual([
      -1_000_000_000,
      0,
      1_000_000_000,
    ]);
  });

  // 성능 테스트 — O(N log N) 기준 N=100,000을 100ms 이내
  test("N=100,000 입력을 100ms 이내에 처리한다", () => {
    const N = 100_000;
    const A: number[] = new Array(N);
    for (let i = 0; i < N; i++) A[i] = Math.floor(Math.random() * 2_000_000_001) - 1_000_000_000;

    const start = performance.now();
    const result = sortArray(A);
    const elapsed = performance.now() - start;

    expect(result.length).toBe(N);
    for (let i = 1; i < N; i++) expect(result[i]!).toBeGreaterThanOrEqual(result[i - 1]!);
    expect(elapsed).toBeLessThan(100);
  });
});
