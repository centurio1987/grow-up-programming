import { test, expect, describe } from "bun:test";
import { sparseTableRangeMin } from "./sparseTableRangeMin";

describe("sparseTableRangeMin", () => {
  describe("기본", () => {
    test("[3,1,4,1,5,9,2,6], (0,3)→1, (2,5)→1, (4,7)→2", () => {
      expect(
        sparseTableRangeMin(
          [3, 1, 4, 1, 5, 9, 2, 6],
          [
            [0, 3],
            [2, 5],
            [4, 7],
          ],
        ),
      ).toEqual([1, 1, 2]);
    });

    test("정렬된 배열 [1,2,3,4,5], (0,4)→1, (3,4)→4", () => {
      expect(
        sparseTableRangeMin(
          [1, 2, 3, 4, 5],
          [
            [0, 4],
            [3, 4],
          ],
        ),
      ).toEqual([1, 4]);
    });
  });

  describe("엣지", () => {
    test("음수 포함 [-3,-1,-5,2], (0,3)→-5", () => {
      expect(sparseTableRangeMin([-3, -1, -5, 2], [[0, 3]])).toEqual([-5]);
    });

    test("모두 같은 값 [5,5,5,5], (1,2)→5", () => {
      expect(sparseTableRangeMin([5, 5, 5, 5], [[1, 2]])).toEqual([5]);
    });

    test("빈 질의 → []", () => {
      expect(sparseTableRangeMin([1, 2, 3], [])).toEqual([]);
    });

    test("l=r 단일 인덱스", () => {
      expect(sparseTableRangeMin([3, 1, 4], [[1, 1]])).toEqual([1]);
    });
  });

  describe("바운더리", () => {
    test("N=1, (0,0)", () => {
      expect(sparseTableRangeMin([42], [[0, 0]])).toEqual([42]);
    });

    test("전체 범위", () => {
      expect(sparseTableRangeMin([5, 3, 7, 1, 9], [[0, 4]])).toEqual([1]);
    });

    test("2의 거듭제곱이 아닌 구간 (0,2)와 (1,3)", () => {
      expect(
        sparseTableRangeMin(
          [3, 1, 4, 1, 5],
          [
            [0, 2],
            [1, 3],
          ],
        ),
      ).toEqual([1, 1]);
    });
  });

  describe("성능", () => {
    test("N=100,000, Q=100,000을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const Q = 100_000;
      const A = Array.from({ length: N }, (_, i) => (i * 31) % 997);
      const queries: Array<[number, number]> = Array.from({ length: Q }, (_, i) => [
        i % N,
        Math.min(N - 1, (i % N) + 100),
      ]);

      const start = performance.now();
      const result = sparseTableRangeMin(A, queries);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(Q);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
