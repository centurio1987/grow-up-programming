import { test, expect, describe } from "bun:test";
import { minMaxPair } from "./minMaxPair";

describe("minMaxPair", () => {
  // 기본 동작
  test("[3,1,4,1,5,9,2,6] → {min:1, max:9}", () => {
    expect(minMaxPair([3, 1, 4, 1, 5, 9, 2, 6])).toEqual({ min: 1, max: 9 });
  });

  test("오름차순 [1,2,3,4,5] → {min:1, max:5}", () => {
    expect(minMaxPair([1, 2, 3, 4, 5])).toEqual({ min: 1, max: 5 });
  });

  test("내림차순 [5,4,3,2,1] → {min:1, max:5}", () => {
    expect(minMaxPair([5, 4, 3, 2, 1])).toEqual({ min: 1, max: 5 });
  });

  // 엣지 케이스
  test("길이 1 → min과 max가 같다", () => {
    expect(minMaxPair([7])).toEqual({ min: 7, max: 7 });
  });

  test("길이 2 — 오름차순", () => {
    expect(minMaxPair([1, 2])).toEqual({ min: 1, max: 2 });
  });

  test("길이 2 — 내림차순", () => {
    expect(minMaxPair([2, 1])).toEqual({ min: 1, max: 2 });
  });

  test("모두 같은 값 [5,5,5,5]", () => {
    expect(minMaxPair([5, 5, 5, 5])).toEqual({ min: 5, max: 5 });
  });

  test("음수 포함 [-3,-1,-4,-1,-5]", () => {
    expect(minMaxPair([-3, -1, -4, -1, -5])).toEqual({ min: -5, max: -1 });
  });

  test("음수·양수 혼합 [-10, 0, 10]", () => {
    expect(minMaxPair([-10, 0, 10])).toEqual({ min: -10, max: 10 });
  });

  test("0 포함 [0, 0, 0]", () => {
    expect(minMaxPair([0, 0, 0])).toEqual({ min: 0, max: 0 });
  });

  // 바운더리 테스트
  test("홀수 길이 N=3", () => {
    expect(minMaxPair([2, 9, 5])).toEqual({ min: 2, max: 9 });
  });

  test("짝수 길이 N=4 — 첫·마지막이 극값", () => {
    expect(minMaxPair([100, 50, 70, -10])).toEqual({ min: -10, max: 100 });
  });

  // 성능 테스트 — O(n)이면 n=10^5에서 100ms 이내 충분
  test("N=100,000 입력을 100ms 이내에 처리한다", () => {
    const N = 100_000;
    const arr = Array.from({ length: N }, (_, i) => (i * 37) % 9973);
    const start = performance.now();
    const result = minMaxPair(arr);
    const elapsed = performance.now() - start;
    expect(result.min).toBeLessThanOrEqual(result.max);
    expect(elapsed).toBeLessThan(100);
  });
});
