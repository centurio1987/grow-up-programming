import { test, expect, describe } from "bun:test";
import { radixSort } from "./radixSort";

describe("radixSort", () => {
  // 기본 동작
  test("여러 자릿수의 정수를 정렬한다", () => {
    expect(radixSort([170, 45, 75, 90, 802, 24, 2, 66])).toEqual([
      2, 24, 45, 66, 75, 90, 170, 802,
    ]);
  });

  test("이미 정렬된 배열은 그대로 유지된다", () => {
    expect(radixSort([1, 10, 100, 1000])).toEqual([1, 10, 100, 1000]);
  });

  test("역순 배열을 정렬한다", () => {
    expect(radixSort([5, 4, 3, 2, 1])).toEqual([1, 2, 3, 4, 5]);
  });

  // 엣지 케이스
  test("중복이 많은 배열", () => {
    expect(radixSort([12, 12, 1, 1, 100, 100])).toEqual([1, 1, 12, 12, 100, 100]);
  });

  test("0을 포함하는 배열", () => {
    expect(radixSort([0, 10, 0, 1])).toEqual([0, 0, 1, 10]);
  });

  test("자릿수가 동일한 모든 원소", () => {
    expect(radixSort([321, 213, 132, 123])).toEqual([123, 132, 213, 321]);
  });

  // 바운더리 테스트
  test("최소 길이 배열 (N=1)", () => {
    expect(radixSort([12345])).toEqual([12345]);
  });

  test("최댓값 (10^9)이 포함된 배열", () => {
    expect(radixSort([1_000_000_000, 0, 999_999_999, 1])).toEqual([
      0, 1, 999_999_999, 1_000_000_000,
    ]);
  });

  // 성능 테스트 — O(d(N+k)) 기준 N=100,000, d=10을 100ms 이내
  test("N=100,000 입력을 100ms 이내에 처리한다", () => {
    const N = 100_000;
    const A: number[] = new Array(N);
    for (let i = 0; i < N; i++) A[i] = Math.floor(Math.random() * 1_000_000_001);

    const start = performance.now();
    const result = radixSort(A);
    const elapsed = performance.now() - start;

    expect(result.length).toBe(N);
    for (let i = 1; i < N; i++) expect(result[i]!).toBeGreaterThanOrEqual(result[i - 1]!);
    expect(elapsed).toBeLessThan(100);
  });
});
