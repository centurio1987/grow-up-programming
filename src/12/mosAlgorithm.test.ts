import { test, expect, describe } from "bun:test";
import { mosAlgorithm } from "./mosAlgorithm";

describe("mosAlgorithm", () => {
  describe("기본", () => {
    test("[1,1,2,1,3]의 다양한 구간", () => {
      const arr = [1, 1, 2, 1, 3];
      const queries: [number, number][] = [
        [0, 4],
        [0, 2],
        [2, 4],
        [1, 3],
      ];
      expect(mosAlgorithm(arr, queries)).toEqual([3, 2, 3, 2]);
    });

    test("모든 원소가 다름", () => {
      const arr = [1, 2, 3, 4, 5];
      const queries: [number, number][] = [
        [0, 4],
        [1, 3],
        [2, 2],
      ];
      expect(mosAlgorithm(arr, queries)).toEqual([5, 3, 1]);
    });

    test("결과는 입력 순서를 유지", () => {
      const arr = [1, 2, 1, 2, 1];
      const queries: [number, number][] = [
        [4, 4],
        [0, 4],
        [0, 1],
      ];
      expect(mosAlgorithm(arr, queries)).toEqual([1, 2, 2]);
    });
  });

  describe("엣지", () => {
    test("모든 원소가 같음", () => {
      const arr = [7, 7, 7, 7];
      const queries: [number, number][] = [
        [0, 3],
        [1, 2],
        [0, 0],
      ];
      expect(mosAlgorithm(arr, queries)).toEqual([1, 1, 1]);
    });

    test("질의가 없는 경우", () => {
      expect(mosAlgorithm([1, 2, 3], [])).toEqual([]);
    });

    test("단일 원소 구간 l=r", () => {
      const arr = [9, 8, 7];
      expect(
        mosAlgorithm(arr, [
          [0, 0],
          [1, 1],
          [2, 2],
        ]),
      ).toEqual([1, 1, 1]);
    });

    test("음수 / 0 / 양수 혼합", () => {
      const arr = [-1, 0, -1, 2, 0];
      const queries: [number, number][] = [
        [0, 4],
        [0, 2],
      ];
      expect(mosAlgorithm(arr, queries)).toEqual([3, 2]);
    });
  });

  describe("바운더리", () => {
    test("n=1", () => {
      expect(mosAlgorithm([42], [[0, 0]])).toEqual([1]);
    });

    test("n=10^4, 같은 값이면 모두 1", () => {
      const n = 10_000;
      const arr = new Array(n).fill(5);
      const queries: [number, number][] = [
        [0, n - 1],
        [100, 200],
      ];
      expect(mosAlgorithm(arr, queries)).toEqual([1, 1]);
    });
  });

  describe("성능", () => {
    test("n=10^4, q=10^4을 100ms 이내에 처리한다", () => {
      const n = 10_000;
      const q = 10_000;
      const arr = Array.from({ length: n }, (_, i) => i % 100);
      const queries: [number, number][] = Array.from({ length: q }, (_, i) => {
        const a = i % n;
        const b = (i * 13 + 7) % n;
        return [Math.min(a, b), Math.max(a, b)];
      });

      const start = performance.now();
      const result = mosAlgorithm(arr, queries);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(q);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
