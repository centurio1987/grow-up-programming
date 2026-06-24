import { test, expect, describe } from "bun:test";
import { segmentTreeRangeMin, type SegOp } from "./segmentTreeRangeMin";

describe("segmentTreeRangeMin", () => {
  describe("기본", () => {
    test("초기 최솟값 질의", () => {
      const ops: SegOp[] = [{ type: "query", l: 0, r: 4 }];
      expect(segmentTreeRangeMin([5, 3, 7, 1, 9], ops)).toEqual([1]);
    });

    test("갱신 후 최솟값 변화", () => {
      const ops: SegOp[] = [
        { type: "query", l: 0, r: 4 }, // 1
        { type: "update", i: 3, v: 100 }, // [5,3,7,100,9]
        { type: "query", l: 0, r: 4 }, // 3
      ];
      expect(segmentTreeRangeMin([5, 3, 7, 1, 9], ops)).toEqual([1, 3]);
    });

    test("부분 구간 질의", () => {
      const ops: SegOp[] = [
        { type: "query", l: 2, r: 4 }, // min(7,1,9)=1
        { type: "update", i: 3, v: 100 },
        { type: "query", l: 2, r: 4 }, // min(7,100,9)=7
      ];
      expect(segmentTreeRangeMin([5, 3, 7, 1, 9], ops)).toEqual([1, 7]);
    });
  });

  describe("엣지", () => {
    test("ops가 비어있음", () => {
      expect(segmentTreeRangeMin([1, 2, 3], [])).toEqual([]);
    });

    test("update만 있는 경우", () => {
      const ops: SegOp[] = [{ type: "update", i: 0, v: 999 }];
      expect(segmentTreeRangeMin([1, 2, 3], ops)).toEqual([]);
    });

    test("음수 값", () => {
      const ops: SegOp[] = [
        { type: "update", i: 1, v: -1000 },
        { type: "query", l: 0, r: 2 },
      ];
      expect(segmentTreeRangeMin([1, 2, 3], ops)).toEqual([-1000]);
    });

    test("모두 같은 값 갱신 후", () => {
      const ops: SegOp[] = [
        { type: "update", i: 0, v: 7 },
        { type: "update", i: 1, v: 7 },
        { type: "update", i: 2, v: 7 },
        { type: "query", l: 0, r: 2 },
      ];
      expect(segmentTreeRangeMin([10, 20, 30], ops)).toEqual([7]);
    });
  });

  describe("바운더리", () => {
    test("N=1 단일 원소", () => {
      const ops: SegOp[] = [
        { type: "query", l: 0, r: 0 },
        { type: "update", i: 0, v: 99 },
        { type: "query", l: 0, r: 0 },
      ];
      expect(segmentTreeRangeMin([5], ops)).toEqual([5, 99]);
    });

    test("l=r 단일 인덱스 질의", () => {
      const ops: SegOp[] = [{ type: "query", l: 2, r: 2 }];
      expect(segmentTreeRangeMin([5, 3, 7, 1, 9], ops)).toEqual([7]);
    });

    test("전체 범위 질의", () => {
      const ops: SegOp[] = [{ type: "query", l: 0, r: 4 }];
      expect(segmentTreeRangeMin([5, 3, 7, 1, 9], ops)).toEqual([1]);
    });
  });

  describe("성능", () => {
    test("N=100,000, Q=100,000을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const Q = 100_000;
      const A = Array.from({ length: N }, (_, i) => (i * 17) % 1009);
      const ops: SegOp[] = Array.from({ length: Q }, (_, i) =>
        i % 2 === 0
          ? { type: "update", i: i % N, v: (i % 50) - 25 }
          : { type: "query", l: 0, r: N - 1 },
      );

      const start = performance.now();
      const result = segmentTreeRangeMin(A, ops);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(Q / 2);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
