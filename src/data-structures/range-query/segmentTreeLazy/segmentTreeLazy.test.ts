import { test, expect, describe } from "bun:test";
import { SegmentTreeLazy } from "./segmentTreeLazy";

describe("SegmentTreeLazy", () => {
  describe("기본", () => {
    test("단일 구간 가산 + 전체 합", () => {
      const st = new SegmentTreeLazy(5);
      st.rangeAdd(0, 4, 3);
      expect(st.rangeSum(0, 4)).toBe(15);
    });

    test("부분 구간 가산 후 부분 합", () => {
      const st = new SegmentTreeLazy(6);
      st.rangeAdd(1, 3, 5); // A = [0,5,5,5,0,0]
      expect(st.rangeSum(0, 5)).toBe(15);
      expect(st.rangeSum(1, 3)).toBe(15);
      expect(st.rangeSum(0, 0)).toBe(0);
      expect(st.rangeSum(4, 5)).toBe(0);
    });

    test("겹치는 구간을 여러 번 가산", () => {
      const st = new SegmentTreeLazy(5);
      st.rangeAdd(0, 2, 1); // [1,1,1,0,0]
      st.rangeAdd(1, 3, 2); // [1,3,3,2,0]
      st.rangeAdd(2, 4, 3); // [1,3,6,5,3]
      expect(st.rangeSum(0, 4)).toBe(18);
      expect(st.rangeSum(2, 2)).toBe(6);
    });
  });

  describe("엣지", () => {
    test("초기 상태 합은 0", () => {
      const st = new SegmentTreeLazy(10);
      expect(st.rangeSum(0, 9)).toBe(0);
    });

    test("단일 원소 구간", () => {
      const st = new SegmentTreeLazy(5);
      st.rangeAdd(2, 2, 7);
      expect(st.rangeSum(2, 2)).toBe(7);
      expect(st.rangeSum(0, 4)).toBe(7);
    });

    test("음수 가산", () => {
      const st = new SegmentTreeLazy(4);
      st.rangeAdd(0, 3, 5);
      st.rangeAdd(1, 2, -3);
      // [5,2,2,5]
      expect(st.rangeSum(0, 3)).toBe(14);
      expect(st.rangeSum(1, 2)).toBe(4);
    });
  });

  describe("바운더리", () => {
    test("n=1, 단일 원소", () => {
      const st = new SegmentTreeLazy(1);
      st.rangeAdd(0, 0, 42);
      expect(st.rangeSum(0, 0)).toBe(42);
    });

    test("n=100000, 전체 구간 가산", () => {
      const n = 100_000;
      const st = new SegmentTreeLazy(n);
      st.rangeAdd(0, n - 1, 1);
      expect(st.rangeSum(0, n - 1)).toBe(n);
    });
  });

  describe("성능", () => {
    test("n=10^5, q=10^5 rangeAdd + rangeSum을 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const q = 100_000;
      const st = new SegmentTreeLazy(n);

      const start = performance.now();
      for (let i = 0; i < q; i++) {
        const l = i % n;
        const r = Math.min(n - 1, l + 50);
        if ((i & 1) === 0) st.rangeAdd(l, r, 1);
        else st.rangeSum(l, r);
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });
});
