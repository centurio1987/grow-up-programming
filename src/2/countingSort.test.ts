import { test, expect, describe } from "bun:test";
import { countingSort } from "./countingSort";

describe("countingSort", () => {
  // 기본 동작
  test("작은 정수 키 배열을 정렬한다", () => {
    expect(countingSort([4, 2, 2, 8, 3, 3, 1])).toEqual([1, 2, 2, 3, 3, 4, 8]);
  });

  test("이미 정렬된 배열은 그대로 유지된다", () => {
    expect(countingSort([0, 1, 2, 3, 4, 5])).toEqual([0, 1, 2, 3, 4, 5]);
  });

  test("역순 배열을 정렬한다", () => {
    expect(countingSort([5, 4, 3, 2, 1, 0])).toEqual([0, 1, 2, 3, 4, 5]);
  });

  // 엣지 케이스
  test("중복이 많은 배열", () => {
    expect(countingSort([3, 3, 3, 1, 1, 2])).toEqual([1, 1, 2, 3, 3, 3]);
  });

  test("모든 원소가 같은 배열", () => {
    expect(countingSort([7, 7, 7])).toEqual([7, 7, 7]);
  });

  test("0을 포함하는 배열", () => {
    expect(countingSort([0, 0, 1, 0])).toEqual([0, 0, 0, 1]);
  });

  // 바운더리 테스트
  test("최소 길이 배열 (N=1)", () => {
    expect(countingSort([5])).toEqual([5]);
  });

  test("키 최솟값/최댓값 (0과 1000)", () => {
    expect(countingSort([1000, 0, 500, 1000, 0])).toEqual([0, 0, 500, 1000, 1000]);
  });

  // 성능 테스트 — O(N+K) 기준 N=100,000, K=1000을 100ms 이내
  test("N=100,000 입력을 100ms 이내에 처리한다", () => {
    const N = 100_000;
    const A: number[] = new Array(N);
    for (let i = 0; i < N; i++) A[i] = Math.floor(Math.random() * 1001);

    const start = performance.now();
    const result = countingSort(A);
    const elapsed = performance.now() - start;

    expect(result.length).toBe(N);
    for (let i = 1; i < N; i++) expect(result[i]!).toBeGreaterThanOrEqual(result[i - 1]!);
    expect(elapsed).toBeLessThan(100);
  });
});
