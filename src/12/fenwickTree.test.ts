import { test, expect, describe } from "bun:test";
import { FenwickTree } from "./fenwickTree";

describe("FenwickTree", () => {
  describe("기본", () => {
    test("단일 update 후 prefixSum 확인", () => {
      const bit = new FenwickTree(5);
      bit.update(3, 7);
      expect(bit.prefixSum(2)).toBe(0);
      expect(bit.prefixSum(3)).toBe(7);
      expect(bit.prefixSum(5)).toBe(7);
    });

    test("여러 update 후 rangeSum 확인", () => {
      const bit = new FenwickTree(6);
      bit.update(1, 1);
      bit.update(2, 2);
      bit.update(3, 3);
      bit.update(4, 4);
      bit.update(5, 5);
      bit.update(6, 6);
      expect(bit.rangeSum(1, 6)).toBe(21);
      expect(bit.rangeSum(2, 4)).toBe(9);
      expect(bit.rangeSum(3, 3)).toBe(3);
    });

    test("음수 delta로 감산", () => {
      const bit = new FenwickTree(4);
      bit.update(1, 10);
      bit.update(2, 20);
      bit.update(2, -5);
      expect(bit.rangeSum(1, 2)).toBe(25);
    });
  });

  describe("엣지", () => {
    test("전혀 update 하지 않은 BIT의 합은 0", () => {
      const bit = new FenwickTree(10);
      expect(bit.prefixSum(10)).toBe(0);
      expect(bit.rangeSum(1, 10)).toBe(0);
    });

    test("prefixSum(0) === 0", () => {
      const bit = new FenwickTree(5);
      bit.update(1, 100);
      expect(bit.prefixSum(0)).toBe(0);
    });

    test("rangeSum(l, l) === A[l]", () => {
      const bit = new FenwickTree(5);
      bit.update(3, 42);
      expect(bit.rangeSum(3, 3)).toBe(42);
    });

    test("같은 인덱스를 여러 번 update", () => {
      const bit = new FenwickTree(3);
      bit.update(2, 1);
      bit.update(2, 1);
      bit.update(2, 1);
      expect(bit.prefixSum(2)).toBe(3);
    });
  });

  describe("바운더리", () => {
    test("n=1, 단일 원소", () => {
      const bit = new FenwickTree(1);
      bit.update(1, 999);
      expect(bit.prefixSum(1)).toBe(999);
      expect(bit.rangeSum(1, 1)).toBe(999);
    });

    test("n=100000, 마지막 인덱스 update", () => {
      const n = 100_000;
      const bit = new FenwickTree(n);
      bit.update(n, 7);
      expect(bit.prefixSum(n)).toBe(7);
      expect(bit.prefixSum(n - 1)).toBe(0);
    });
  });

  describe("성능", () => {
    test("n=10^5, q=10^5 update + rangeSum을 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const bit = new FenwickTree(n);

      const start = performance.now();
      for (let i = 1; i <= n; i++) bit.update(i, 1);
      let total = 0;
      for (let i = 0; i < 100_000; i++) {
        const l = (i % n) + 1;
        const r = Math.min(n, l + 100);
        total += bit.rangeSum(l, r);
      }
      const elapsed = performance.now() - start;

      expect(total).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
