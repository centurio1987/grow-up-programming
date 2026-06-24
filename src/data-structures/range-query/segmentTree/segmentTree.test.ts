import { test, expect, describe } from "bun:test";
import { SegmentTree } from "./segmentTree";

describe("SegmentTree", () => {
  describe("기본 — 구간 합", () => {
    test("구간 합 전체 질의", () => {
      const arr = [1, 2, 3, 4, 5];
      const st = new SegmentTree(arr, (a, b) => a + b);
      expect(st.query(0, 4)).toBe(15);
    });

    test("구간 합 부분 질의", () => {
      const arr = [1, 2, 3, 4, 5];
      const st = new SegmentTree(arr, (a, b) => a + b);
      expect(st.query(1, 3)).toBe(9); // 2+3+4
    });

    test("구간 합 단일 원소", () => {
      const arr = [10, 20, 30];
      const st = new SegmentTree(arr, (a, b) => a + b);
      expect(st.query(1, 1)).toBe(20);
    });
  });

  describe("기본 — 구간 최솟값 (주식 최저가)", () => {
    test("구간 최솟값 전체 질의", () => {
      const prices = [100, 45, 78, 23, 56];
      const st = new SegmentTree(prices, Math.min);
      expect(st.query(0, 4)).toBe(23);
    });

    test("구간 최솟값 부분 질의", () => {
      const prices = [100, 45, 78, 23, 56];
      const st = new SegmentTree(prices, Math.min);
      expect(st.query(0, 2)).toBe(45); // min(100,45,78)
      expect(st.query(2, 4)).toBe(23); // min(78,23,56)
    });

    test("구간 최댓값 질의", () => {
      const arr = [3, 1, 4, 1, 5, 9, 2, 6];
      const st = new SegmentTree(arr, Math.max);
      expect(st.query(0, 7)).toBe(9);
      expect(st.query(0, 4)).toBe(5);
    });
  });

  describe("업데이트", () => {
    test("Point Update 후 구간 합 재계산", () => {
      const arr = [1, 2, 3, 4, 5];
      const st = new SegmentTree(arr, (a, b) => a + b);
      st.update(2, 10); // arr[2]: 3 -> 10
      expect(st.query(0, 4)).toBe(22); // 1+2+10+4+5
      expect(st.query(1, 3)).toBe(16); // 2+10+4
    });

    test("Point Update 후 최솟값 재계산", () => {
      const prices = [100, 45, 78, 23, 56];
      const st = new SegmentTree(prices, Math.min);
      st.update(3, 200); // 최솟값이었던 인덱스 3을 200으로
      expect(st.query(0, 4)).toBe(45); // 이제 최솟값은 45
    });

    test("연속 업데이트", () => {
      const arr = [1, 1, 1, 1, 1];
      const st = new SegmentTree(arr, (a, b) => a + b);
      st.update(0, 5);
      st.update(4, 5);
      expect(st.query(0, 4)).toBe(13); // 5+1+1+1+5
    });

    test("첫 원소 업데이트", () => {
      const arr = [0, 1, 2];
      const st = new SegmentTree(arr, (a, b) => a + b);
      st.update(0, 10);
      expect(st.query(0, 2)).toBe(13);
    });

    test("마지막 원소 업데이트", () => {
      const arr = [0, 1, 2];
      const st = new SegmentTree(arr, (a, b) => a + b);
      st.update(2, 10);
      expect(st.query(0, 2)).toBe(11);
    });
  });

  describe("엣지", () => {
    test("단일 원소 배열", () => {
      const st = new SegmentTree([42], (a, b) => a + b);
      expect(st.query(0, 0)).toBe(42);
      st.update(0, 100);
      expect(st.query(0, 0)).toBe(100);
    });

    test("크기 2 배열", () => {
      const st = new SegmentTree([3, 7], Math.min);
      expect(st.query(0, 1)).toBe(3);
      expect(st.query(0, 0)).toBe(3);
      expect(st.query(1, 1)).toBe(7);
    });

    test("size() 반환값", () => {
      const arr = [1, 2, 3, 4, 5];
      const st = new SegmentTree(arr, (a, b) => a + b);
      expect(st.size()).toBe(5);
    });

    test("음수 포함 배열", () => {
      const arr = [-3, -1, -4, -1, -5];
      const st = new SegmentTree(arr, (a, b) => a + b);
      expect(st.query(0, 4)).toBe(-14);
      const stMin = new SegmentTree(arr, Math.min);
      expect(stMin.query(0, 4)).toBe(-5);
    });

    test("동일 값 배열", () => {
      const arr = [7, 7, 7, 7];
      const st = new SegmentTree(arr, (a, b) => a + b);
      expect(st.query(0, 3)).toBe(28);
      expect(st.query(1, 2)).toBe(14);
    });
  });

  describe("성능", () => {
    test("n=10^5 빌드 + 10^4 query + 10^4 update 100ms 이내", () => {
      const n = 100_000;
      const arr = Array.from({ length: n }, (_, i) => i + 1);
      const start = performance.now();
      const st = new SegmentTree(arr, (a, b) => a + b);
      for (let i = 0; i < 10_000; i++) {
        st.query(0, n - 1);
      }
      for (let i = 0; i < 10_000; i++) {
        st.update(i % n, i * 2);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test("n=10^5 구간 최솟값 10^4회 쿼리 100ms 이내", () => {
      const n = 100_000;
      const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 1_000_000));
      const start = performance.now();
      const st = new SegmentTree(arr, Math.min);
      for (let i = 0; i < 10_000; i++) {
        const l = Math.floor(Math.random() * n);
        const r = l + Math.floor(Math.random() * (n - l));
        st.query(l, r);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
