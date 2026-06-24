import { test, expect, describe } from "bun:test";
import { searchInRotatedSortedArray } from "./searchInRotatedSortedArray";

describe("searchInRotatedSortedArray", () => {
  // 기본 동작 — 회전된 배열에서 탐색
  test("[4,5,6,7,0,1,2]에서 0을 찾는다 → 인덱스 4", () => {
    expect(searchInRotatedSortedArray([4, 5, 6, 7, 0, 1, 2], 0)).toBe(4);
  });

  test("[4,5,6,7,0,1,2]에서 3을 찾는다 → -1", () => {
    expect(searchInRotatedSortedArray([4, 5, 6, 7, 0, 1, 2], 3)).toBe(-1);
  });

  test("[4,5,6,7,0,1,2]에서 4를 찾는다 → 인덱스 0", () => {
    expect(searchInRotatedSortedArray([4, 5, 6, 7, 0, 1, 2], 4)).toBe(0);
  });

  test("[4,5,6,7,0,1,2]에서 2를 찾는다 → 인덱스 6", () => {
    expect(searchInRotatedSortedArray([4, 5, 6, 7, 0, 1, 2], 2)).toBe(6);
  });

  test("[4,5,6,7,0,1,2]에서 7을 찾는다 → 인덱스 3", () => {
    expect(searchInRotatedSortedArray([4, 5, 6, 7, 0, 1, 2], 7)).toBe(3);
  });

  // 회전되지 않은 정렬 배열
  test("회전되지 않은 정렬 배열 [1,2,3,4,5] 에서 3을 찾는다 → 인덱스 2", () => {
    expect(searchInRotatedSortedArray([1, 2, 3, 4, 5], 3)).toBe(2);
  });

  test("회전되지 않은 정렬 배열에서 없는 값 → -1", () => {
    expect(searchInRotatedSortedArray([1, 2, 3, 4, 5], 6)).toBe(-1);
  });

  // 엣지 케이스
  test("원소가 하나인 배열 — 일치", () => {
    expect(searchInRotatedSortedArray([1], 1)).toBe(0);
  });

  test("원소가 하나인 배열 — 불일치", () => {
    expect(searchInRotatedSortedArray([1], 0)).toBe(-1);
  });

  test("원소가 두 개인 배열 — 회전된 경우 첫 번째 원소", () => {
    expect(searchInRotatedSortedArray([3, 1], 3)).toBe(0);
  });

  test("원소가 두 개인 배열 — 회전된 경우 두 번째 원소", () => {
    expect(searchInRotatedSortedArray([3, 1], 1)).toBe(1);
  });

  test("음수가 포함된 회전 배열", () => {
    // 정렬: [-5,-3,-1,2,4,6] 회전 → [2,4,6,-5,-3,-1]
    expect(searchInRotatedSortedArray([2, 4, 6, -5, -3, -1], -3)).toBe(4);
    expect(searchInRotatedSortedArray([2, 4, 6, -5, -3, -1], 6)).toBe(2);
  });

  // 바운더리 테스트 — 회전 지점 경계
  test("회전 지점 직전 원소 (pivot 의 직전)", () => {
    // [4,5,6,7,0,1,2] 에서 7 (회전 직전 원소) → 인덱스 3
    expect(searchInRotatedSortedArray([4, 5, 6, 7, 0, 1, 2], 7)).toBe(3);
  });

  test("회전 지점 원소 (pivot)", () => {
    // [4,5,6,7,0,1,2] 에서 0 (회전 지점) → 인덱스 4
    expect(searchInRotatedSortedArray([4, 5, 6, 7, 0, 1, 2], 0)).toBe(4);
  });

  test("거의 끝에서 회전된 배열 [2,3,4,5,6,7,1]", () => {
    expect(searchInRotatedSortedArray([2, 3, 4, 5, 6, 7, 1], 1)).toBe(6);
    expect(searchInRotatedSortedArray([2, 3, 4, 5, 6, 7, 1], 2)).toBe(0);
  });

  test("두 번째 위치에서 회전된 배열 [7,1,2,3,4,5,6]", () => {
    expect(searchInRotatedSortedArray([7, 1, 2, 3, 4, 5, 6], 7)).toBe(0);
    expect(searchInRotatedSortedArray([7, 1, 2, 3, 4, 5, 6], 5)).toBe(4);
  });

  // 성능 테스트 — O(log N) 이라 N=10^6 도 매우 빠르게 처리
  test("N=1,000,000 회전 배열에서 100ms 이내에 처리한다", () => {
    const N = 1_000_000;
    // 0..N-1 을 N/2 위치에서 회전
    const pivot = N / 2;
    const A = new Array<number>(N);
    for (let i = 0; i < N; i++) {
      A[i] = (i + pivot) % N;
    }

    const start = performance.now();
    let acc = 0;
    for (let i = 0; i < 1000; i++) {
      acc += searchInRotatedSortedArray(A, i);
    }
    const elapsed = performance.now() - start;

    expect(acc).toBeGreaterThanOrEqual(0);
    expect(elapsed).toBeLessThan(100);
  });
});
