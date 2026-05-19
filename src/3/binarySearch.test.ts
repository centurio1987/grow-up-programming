import { test, expect, describe } from "bun:test";
import { binarySearch } from "./binarySearch";

describe("binarySearch", () => {
  // 기본 동작
  test("배열 중간에 존재하는 값을 찾는다", () => {
    // [1,3,5,7,9,11] 에서 7 → 인덱스 3
    expect(binarySearch([1, 3, 5, 7, 9, 11], 7)).toBe(3);
  });

  test("배열 맨 앞에 존재하는 값을 찾는다", () => {
    expect(binarySearch([1, 3, 5, 7, 9, 11], 1)).toBe(0);
  });

  test("배열 맨 뒤에 존재하는 값을 찾는다", () => {
    expect(binarySearch([1, 3, 5, 7, 9, 11], 11)).toBe(5);
  });

  test("존재하지 않는 값은 -1을 반환한다", () => {
    expect(binarySearch([1, 3, 5, 7, 9, 11], 4)).toBe(-1);
  });

  test("최솟값보다 작은 값은 -1을 반환한다", () => {
    expect(binarySearch([1, 3, 5, 7, 9, 11], -10)).toBe(-1);
  });

  test("최댓값보다 큰 값은 -1을 반환한다", () => {
    expect(binarySearch([1, 3, 5, 7, 9, 11], 100)).toBe(-1);
  });

  // 엣지 케이스
  test("빈 배열은 항상 -1을 반환한다", () => {
    expect(binarySearch([], 1)).toBe(-1);
  });

  test("원소가 하나인 배열 — 일치", () => {
    expect(binarySearch([42], 42)).toBe(0);
  });

  test("원소가 하나인 배열 — 불일치", () => {
    expect(binarySearch([42], 7)).toBe(-1);
  });

  test("음수가 포함된 배열에서 찾는다", () => {
    expect(binarySearch([-10, -5, 0, 5, 10], -5)).toBe(1);
  });

  test("0을 찾는다", () => {
    expect(binarySearch([-10, -5, 0, 5, 10], 0)).toBe(2);
  });

  // 바운더리 테스트
  test("원소가 두 개인 배열 — 첫 번째", () => {
    expect(binarySearch([1, 2], 1)).toBe(0);
  });

  test("원소가 두 개인 배열 — 두 번째", () => {
    expect(binarySearch([1, 2], 2)).toBe(1);
  });

  test("원소가 두 개인 배열 — 없는 값", () => {
    expect(binarySearch([1, 2], 3)).toBe(-1);
  });

  test("INT32 경계값을 찾는다", () => {
    const A = [-2147483648, -1, 0, 1, 2147483647];
    expect(binarySearch(A, -2147483648)).toBe(0);
    expect(binarySearch(A, 2147483647)).toBe(4);
  });

  // 성능 테스트 — O(log N) 이라 N=10^6 도 매우 빠르게 처리
  test("N=1,000,000 배열에서 100ms 이내에 처리한다", () => {
    const N = 1_000_000;
    const A = new Array<number>(N);
    for (let i = 0; i < N; i++) A[i] = i * 2;

    const start = performance.now();
    // 여러 번 호출해도 충분히 빠르다
    let acc = 0;
    for (let i = 0; i < 1000; i++) {
      acc += binarySearch(A, i * 2);
    }
    const elapsed = performance.now() - start;

    expect(acc).toBeGreaterThanOrEqual(0);
    expect(elapsed).toBeLessThan(100);
  });
});
