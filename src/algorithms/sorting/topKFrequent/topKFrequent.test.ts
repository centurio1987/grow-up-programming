import { test, expect, describe } from "bun:test";
import { topKFrequent } from "./topKFrequent";

describe("topKFrequent", () => {
  // 기본 동작
  test("[1,1,1,2,2,3], k=2 → [1,2]", () => {
    expect(topKFrequent([1, 1, 1, 2, 2, 3], 2)).toEqual([1, 2]);
  });

  test("k=1 — 단일 최빈값", () => {
    expect(topKFrequent([1], 1)).toEqual([1]);
  });

  test("빈도 내림차순 정렬을 검증한다", () => {
    // 4: 4번, 2: 3번, 1: 2번, 3: 1번
    const result = topKFrequent([4, 4, 4, 4, 2, 2, 2, 1, 1, 3], 3);
    expect(result).toEqual([4, 2, 1]);
  });

  // 엣지 케이스
  test("모든 원소가 같은 빈도일 때 (k=고유값 개수)", () => {
    // 1, 2, 3 모두 빈도 1 → 셋 다 포함
    const result = topKFrequent([1, 2, 3], 3);
    expect(result.slice().sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  test("음수가 섞인 배열", () => {
    // -1: 3번, 2: 2번, 0: 1번
    expect(topKFrequent([-1, -1, -1, 2, 2, 0], 2)).toEqual([-1, 2]);
  });

  test("모든 원소가 같은 경우 — k=1", () => {
    expect(topKFrequent([7, 7, 7, 7], 1)).toEqual([7]);
  });

  // 바운더리 테스트
  test("최소 길이 배열 (N=1, k=1)", () => {
    expect(topKFrequent([42], 1)).toEqual([42]);
  });

  test("k = 고유값 개수", () => {
    // 1:2, 2:1, 3:1 → 빈도 순서 [1, (2 or 3), (3 or 2)]
    const result = topKFrequent([1, 1, 2, 3], 3);
    expect(result[0]).toBe(1);
    expect(result.slice(1).sort((a, b) => a - b)).toEqual([2, 3]);
  });

  test("최댓값/최솟값 경계 포함", () => {
    // 1e9: 2번, -1e9: 1번
    expect(topKFrequent([1_000_000_000, 1_000_000_000, -1_000_000_000], 1)).toEqual([
      1_000_000_000,
    ]);
  });

  // 성능 테스트 — O(N log k) 기준 N=100,000을 100ms 이내
  test("N=100,000 입력을 100ms 이내에 처리한다", () => {
    const N = 100_000;
    const A: number[] = new Array(N);
    for (let i = 0; i < N; i++) A[i] = Math.floor(Math.random() * 1000);

    const start = performance.now();
    const result = topKFrequent(A, 10);
    const elapsed = performance.now() - start;

    expect(result.length).toBe(10);
    expect(elapsed).toBeLessThan(100);
  });
});
