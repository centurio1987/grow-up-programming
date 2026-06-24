import { test, expect, describe } from "bun:test";
import { kthSmallest } from "./kthSmallest";

describe("kthSmallest", () => {
  // 기본 동작
  test("k=3인 경우 — 정렬했을 때 3번째 원소", () => {
    // sorted: [1, 2, 3, 4, 5, 6] → k=3 → 3
    expect(kthSmallest([3, 1, 4, 1, 5, 9, 2, 6], 3)).toBe(2);
  });

  test("k=1인 경우 — 최솟값", () => {
    expect(kthSmallest([7, 10, 4, 3, 20, 15], 1)).toBe(3);
  });

  test("k=N인 경우 — 최댓값", () => {
    expect(kthSmallest([7, 10, 4, 3, 20, 15], 6)).toBe(20);
  });

  // 엣지 케이스
  test("중복이 많은 배열", () => {
    // sorted: [1,1,1,2,2,3] → k=4 → 2
    expect(kthSmallest([2, 1, 2, 1, 3, 1], 4)).toBe(2);
  });

  test("음수가 섞인 배열", () => {
    // sorted: [-5,-3,-1,2,4] → k=2 → -3
    expect(kthSmallest([4, -1, -5, 2, -3], 2)).toBe(-3);
  });

  test("모든 원소가 같은 배열", () => {
    expect(kthSmallest([5, 5, 5, 5], 3)).toBe(5);
  });

  // 바운더리 테스트
  test("최소 길이 배열 (N=1, k=1)", () => {
    expect(kthSmallest([42], 1)).toBe(42);
  });

  test("길이 2 — 작은 쪽", () => {
    expect(kthSmallest([10, 5], 1)).toBe(5);
  });

  test("길이 2 — 큰 쪽", () => {
    expect(kthSmallest([10, 5], 2)).toBe(10);
  });

  test("최댓값/최솟값 경계 포함", () => {
    // sorted: [-1e9, 0, 1e9] → k=2 → 0
    expect(kthSmallest([1_000_000_000, -1_000_000_000, 0], 2)).toBe(0);
  });

  // 성능 테스트 — Quickselect 기준 N=100,000을 100ms 이내
  test("N=100,000 입력을 100ms 이내에 처리한다", () => {
    const N = 100_000;
    const A: number[] = new Array(N);
    for (let i = 0; i < N; i++) A[i] = Math.floor(Math.random() * 2_000_000_001) - 1_000_000_000;
    const k = Math.floor(N / 2) + 1;

    const start = performance.now();
    const result = kthSmallest(A, k);
    const elapsed = performance.now() - start;

    // 정답 검증 (정렬해서 비교)
    const expected = [...A].sort((a, b) => a - b)[k - 1]!;
    expect(result).toBe(expected);
    expect(elapsed).toBeLessThan(100);
  });
});
