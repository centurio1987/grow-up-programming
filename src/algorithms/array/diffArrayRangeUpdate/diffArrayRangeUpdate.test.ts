import { test, expect, describe } from "bun:test";
import { diffArrayRangeUpdate } from "./diffArrayRangeUpdate";

describe("diffArrayRangeUpdate", () => {
  describe("기본", () => {
    test("N=5, [(0,2,1),(1,3,2),(2,4,3)] → [1,3,6,5,3]", () => {
      // (0,2,1): [1,1,1,0,0]
      // (1,3,2): [1,3,3,2,0]
      // (2,4,3): [1,3,6,5,3]
      expect(
        diffArrayRangeUpdate(5, [
          [0, 2, 1],
          [1, 3, 2],
          [2, 4, 3],
        ]),
      ).toEqual([1, 3, 6, 5, 3]);
    });

    test("단일 구간 전체 갱신", () => {
      expect(diffArrayRangeUpdate(4, [[0, 3, 5]])).toEqual([5, 5, 5, 5]);
    });
  });

  describe("엣지", () => {
    test("갱신 없으면 모두 0", () => {
      expect(diffArrayRangeUpdate(3, [])).toEqual([0, 0, 0]);
    });

    test("음수 v 포함", () => {
      // (0,2,5):[5,5,5,0], (1,3,-3):[5,2,2,-3]
      expect(
        diffArrayRangeUpdate(4, [
          [0, 2, 5],
          [1, 3, -3],
        ]),
      ).toEqual([5, 2, 2, -3]);
    });

    test("단일 인덱스 갱신 (l=r)", () => {
      // (2,2,7): [0,0,7,0,0]
      expect(diffArrayRangeUpdate(5, [[2, 2, 7]])).toEqual([0, 0, 7, 0, 0]);
    });

    test("같은 구간 여러 번", () => {
      expect(
        diffArrayRangeUpdate(3, [
          [0, 2, 1],
          [0, 2, 1],
          [0, 2, 1],
        ]),
      ).toEqual([3, 3, 3]);
    });
  });

  describe("바운더리", () => {
    test("N=1 단일 원소", () => {
      expect(diffArrayRangeUpdate(1, [[0, 0, 5]])).toEqual([5]);
    });

    test("l=0 첫 인덱스 갱신", () => {
      expect(diffArrayRangeUpdate(3, [[0, 0, 9]])).toEqual([9, 0, 0]);
    });

    test("r=N-1 마지막 인덱스 갱신", () => {
      expect(diffArrayRangeUpdate(3, [[2, 2, 9]])).toEqual([0, 0, 9]);
    });
  });

  describe("성능", () => {
    test("N=100,000, Q=100,000을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const Q = 100_000;
      const updates: Array<[number, number, number]> = Array.from({ length: Q }, (_, i) => [
        i % N,
        Math.min(N - 1, (i % N) + (i % 1000)),
        (i % 20) - 10,
      ]);

      const start = performance.now();
      const result = diffArrayRangeUpdate(N, updates);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(N);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
