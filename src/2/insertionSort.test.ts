import { test, expect, describe } from "bun:test";
import { insertionSort } from "./insertionSort";

describe("insertionSort", () => {
  // 기본 동작
  test("무작위 배열을 오름차순으로 정렬한다", () => {
    expect(insertionSort([5, 2, 4, 6, 1, 3])).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test("이미 정렬된 배열은 그대로 유지된다", () => {
    expect(insertionSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
  });

  test("거의 정렬된 배열을 정렬한다 (인접 한 쌍 스왑)", () => {
    expect(insertionSort([1, 3, 2, 4, 5])).toEqual([1, 2, 3, 4, 5]);
  });

  // 엣지 케이스
  test("역순 배열도 올바르게 정렬한다", () => {
    expect(insertionSort([5, 4, 3, 2, 1])).toEqual([1, 2, 3, 4, 5]);
  });

  test("음수와 중복이 섞인 경우", () => {
    expect(insertionSort([-1, 3, -1, 2, 0, 2])).toEqual([-1, -1, 0, 2, 2, 3]);
  });

  test("모든 원소가 같은 배열", () => {
    expect(insertionSort([4, 4, 4, 4])).toEqual([4, 4, 4, 4]);
  });

  // 바운더리 테스트
  test("최소 길이 배열 (N=1)", () => {
    expect(insertionSort([42])).toEqual([42]);
  });

  test("길이 2 — 정렬됨", () => {
    expect(insertionSort([1, 2])).toEqual([1, 2]);
  });

  test("길이 2 — 역순", () => {
    expect(insertionSort([2, 1])).toEqual([1, 2]);
  });

  // 성능 테스트 — 거의 정렬된 N=10,000을 100ms 이내 (역순쌍 ~N)
  test("N=10,000 거의 정렬된 입력을 100ms 이내에 처리한다", () => {
    const N = 10_000;
    const A: number[] = Array.from({ length: N }, (_, i) => i);
    // 약 N/100 개의 인접 스왑 발생 → 역순쌍 수 ≈ N/100
    for (let i = 0; i + 1 < N; i += 100) {
      const t = A[i]!;
      A[i] = A[i + 1]!;
      A[i + 1] = t;
    }

    const start = performance.now();
    const result = insertionSort(A);
    const elapsed = performance.now() - start;

    expect(result.length).toBe(N);
    for (let i = 1; i < N; i++) expect(result[i]!).toBeGreaterThanOrEqual(result[i - 1]!);
    expect(elapsed).toBeLessThan(100);
  });
});
