import { test, expect, describe } from "bun:test";
import { prefixSumRangeQuery } from "./prefixSumRangeQuery";

describe("prefixSumRangeQuery", () => {
  describe("기본", () => {
    test("[1,2,3,4,5], 질의 [(0,4),(1,3),(2,2)] → [15,9,3]", () => {
      expect(
        prefixSumRangeQuery(
          [1, 2, 3, 4, 5],
          [
            [0, 4],
            [1, 3],
            [2, 2],
          ],
        ),
      ).toEqual([15, 9, 3]);
    });

    test("단일 질의 [(0,0)] → [A[0]]", () => {
      expect(prefixSumRangeQuery([7], [[0, 0]])).toEqual([7]);
    });
  });

  describe("엣지", () => {
    test("음수 포함 [-1,-2,-3], (0,2) → -6", () => {
      expect(prefixSumRangeQuery([-1, -2, -3], [[0, 2]])).toEqual([-6]);
    });

    test("0 포함 [0,0,0,0], (1,3) → 0", () => {
      expect(prefixSumRangeQuery([0, 0, 0, 0], [[1, 3]])).toEqual([0]);
    });

    test("질의가 빈 배열 → []", () => {
      expect(prefixSumRangeQuery([1, 2, 3], [])).toEqual([]);
    });

    test("동일한 질의 반복", () => {
      expect(
        prefixSumRangeQuery(
          [1, 2, 3],
          [
            [0, 2],
            [0, 2],
            [0, 2],
          ],
        ),
      ).toEqual([6, 6, 6]);
    });
  });

  describe("바운더리", () => {
    test("l=r 경계, 첫 원소", () => {
      expect(prefixSumRangeQuery([10, 20, 30], [[0, 0]])).toEqual([10]);
    });

    test("l=r 경계, 마지막 원소", () => {
      expect(prefixSumRangeQuery([10, 20, 30], [[2, 2]])).toEqual([30]);
    });

    test("전체 범위", () => {
      expect(prefixSumRangeQuery([10, 20, 30], [[0, 2]])).toEqual([60]);
    });
  });

  describe("성능", () => {
    test("N=100,000, Q=100,000을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const Q = 100_000;
      const A = new Array<number>(N).fill(1);
      const queries: Array<[number, number]> = Array.from({ length: Q }, (_, i) => [0, (i % N)]);

      const start = performance.now();
      const result = prefixSumRangeQuery(A, queries);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(Q);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
