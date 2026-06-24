import { test, expect, describe } from "bun:test";
import { parametricBinarySearch } from "./parametricBinarySearch";

describe("parametricBinarySearch (Split Array Largest Sum)", () => {
  // 기본 동작 — 문제 예시
  test("[7,2,5,10,8], K=2 → 18 ([7,2,5,10] | [8] 또는 [7,2,5 | 10,8] 중 최적은 [7,2,5,10]vs[8]→18)", () => {
    // 최적 분할: [7,2,5] | [10,8] → max(14, 18) = 18
    expect(parametricBinarySearch([7, 2, 5, 10, 8], 2)).toBe(18);
  });

  test("[1,2,3,4,5], K=2 → 9 ([1,2,3,4]|[5]→max(10,5)=10, [1,2,3]|[4,5]→max(6,9)=9)", () => {
    expect(parametricBinarySearch([1, 2, 3, 4, 5], 2)).toBe(9);
  });

  test("[1,4,4], K=3 → 4 (각 원소가 자기 묶음)", () => {
    expect(parametricBinarySearch([1, 4, 4], 3)).toBe(4);
  });

  test("[1,2,3,4,5], K=1 → 전체 합 15", () => {
    expect(parametricBinarySearch([1, 2, 3, 4, 5], 1)).toBe(15);
  });

  test("[1,2,3,4,5], K=5 → 최댓값 5", () => {
    expect(parametricBinarySearch([1, 2, 3, 4, 5], 5)).toBe(5);
  });

  // 엣지 케이스
  test("원소가 하나인 배열, K=1", () => {
    expect(parametricBinarySearch([7], 1)).toBe(7);
  });

  test("0이 포함된 배열", () => {
    // [0,0,0,0], K=2 → 0
    expect(parametricBinarySearch([0, 0, 0, 0], 2)).toBe(0);
  });

  test("모두 같은 값 [5,5,5,5,5], K=5 → 5", () => {
    expect(parametricBinarySearch([5, 5, 5, 5, 5], 5)).toBe(5);
  });

  test("모두 같은 값 [5,5,5,5,5], K=1 → 25", () => {
    expect(parametricBinarySearch([5, 5, 5, 5, 5], 1)).toBe(25);
  });

  test("단조 증가 배열 [1,2,3,4,5,6,7,8,9,10], K=3 → 21", () => {
    // 최적: [1..6]|[7,8]|[9,10] = max(21,15,19)=21
    // 또는 [1..5,6]|[7,8]|[9,10] 같이 다양하나 최적값 21
    expect(parametricBinarySearch([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3)).toBe(21);
  });

  // 바운더리 테스트
  test("K=N (각 원소가 한 묶음)일 때 배열의 최댓값을 반환한다", () => {
    expect(parametricBinarySearch([3, 1, 4, 1, 5, 9, 2, 6], 8)).toBe(9);
  });

  test("K=1 일 때 전체 합을 반환한다", () => {
    expect(parametricBinarySearch([3, 1, 4, 1, 5, 9, 2, 6], 1)).toBe(31);
  });

  test("최댓값이 매우 큰 단일 원소 — 그 값이 곧 lower bound", () => {
    // [1,1,1,1000000], K=2 → max(3, 1000000) = 1000000
    expect(parametricBinarySearch([1, 1, 1, 1_000_000], 2)).toBe(1_000_000);
  });

  test("N=K=2 최소 케이스", () => {
    expect(parametricBinarySearch([3, 5], 2)).toBe(5);
  });

  // 성능 테스트 — O(N log(sumA)) 기준, N=10^5 면 약 10^5 * 30 ≈ 3*10^6
  test("N=100,000 입력을 100ms 이내에 처리한다", () => {
    const N = 100_000;
    const A = new Array<number>(N);
    for (let i = 0; i < N; i++) A[i] = (i * 37) % 1_000_000;

    const start = performance.now();
    const result = parametricBinarySearch(A, 100);
    const elapsed = performance.now() - start;

    expect(result).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(100);
  });
});
