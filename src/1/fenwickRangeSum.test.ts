import { test, expect, describe } from "bun:test";
import { fenwickRangeSum, type FenwickOp } from "./fenwickRangeSum";

describe("fenwickRangeSum", () => {
  describe("기본", () => {
    test("초기 합 질의", () => {
      const ops: FenwickOp[] = [{ type: "query", l: 0, r: 4 }];
      expect(fenwickRangeSum([1, 2, 3, 4, 5], ops)).toEqual([15]);
    });

    test("갱신 후 구간 합", () => {
      // [1,2,3,4,5], update(2,10) → [1,2,10,4,5], query(0,4)=22
      const ops: FenwickOp[] = [
        { type: "update", i: 2, v: 10 },
        { type: "query", l: 0, r: 4 },
      ];
      expect(fenwickRangeSum([1, 2, 3, 4, 5], ops)).toEqual([22]);
    });

    test("여러 갱신과 여러 질의", () => {
      const ops: FenwickOp[] = [
        { type: "query", l: 1, r: 3 }, // 2+3+4=9
        { type: "update", i: 1, v: 10 }, // [1,10,3,4,5]
        { type: "query", l: 1, r: 3 }, // 10+3+4=17
        { type: "update", i: 3, v: 0 }, // [1,10,3,0,5]
        { type: "query", l: 0, r: 4 }, // 19
      ];
      expect(fenwickRangeSum([1, 2, 3, 4, 5], ops)).toEqual([9, 17, 19]);
    });
  });

  describe("엣지", () => {
    test("ops가 비어있으면 빈 배열", () => {
      expect(fenwickRangeSum([1, 2, 3], [])).toEqual([]);
    });

    test("update만 있고 query 없으면 빈 배열", () => {
      const ops: FenwickOp[] = [{ type: "update", i: 0, v: 99 }];
      expect(fenwickRangeSum([1, 2, 3], ops)).toEqual([]);
    });

    test("음수 값 갱신", () => {
      const ops: FenwickOp[] = [
        { type: "update", i: 0, v: -5 },
        { type: "query", l: 0, r: 2 },
      ];
      // [-5,2,3] → 0
      expect(fenwickRangeSum([1, 2, 3], ops)).toEqual([0]);
    });

    test("같은 인덱스 두 번 갱신", () => {
      const ops: FenwickOp[] = [
        { type: "update", i: 0, v: 5 },
        { type: "update", i: 0, v: 10 },
        { type: "query", l: 0, r: 0 },
      ];
      expect(fenwickRangeSum([1, 2, 3], ops)).toEqual([10]);
    });
  });

  describe("바운더리", () => {
    test("N=1 단일 원소 질의", () => {
      const ops: FenwickOp[] = [{ type: "query", l: 0, r: 0 }];
      expect(fenwickRangeSum([7], ops)).toEqual([7]);
    });

    test("l=r 단일 인덱스 질의", () => {
      const ops: FenwickOp[] = [{ type: "query", l: 2, r: 2 }];
      expect(fenwickRangeSum([1, 2, 3, 4, 5], ops)).toEqual([3]);
    });

    test("전체 범위 질의", () => {
      const ops: FenwickOp[] = [{ type: "query", l: 0, r: 4 }];
      expect(fenwickRangeSum([1, 2, 3, 4, 5], ops)).toEqual([15]);
    });
  });

  describe("성능", () => {
    test("N=100,000, Q=100,000 혼합 연산을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const Q = 100_000;
      const A = new Array<number>(N).fill(1);
      const ops: FenwickOp[] = Array.from({ length: Q }, (_, i) =>
        i % 2 === 0
          ? { type: "update", i: i % N, v: (i % 100) - 50 }
          : { type: "query", l: 0, r: N - 1 },
      );

      const start = performance.now();
      const result = fenwickRangeSum(A, ops);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(Q / 2);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
