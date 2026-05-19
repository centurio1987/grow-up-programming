import { test, expect, describe } from "bun:test";
import { OrderStatisticTree } from "./orderStatisticTree";

describe("OrderStatisticTree", () => {
  describe("기본", () => {
    test("insert 후 kth가 정렬 순서를 따른다", () => {
      const t = new OrderStatisticTree();
      [5, 2, 8, 1, 4].forEach((v) => t.insert(v));
      expect(t.kth(1)).toBe(1);
      expect(t.kth(2)).toBe(2);
      expect(t.kth(3)).toBe(4);
      expect(t.kth(4)).toBe(5);
      expect(t.kth(5)).toBe(8);
    });

    test("rank(x)는 x보다 작은 원소의 개수", () => {
      const t = new OrderStatisticTree();
      [10, 20, 30, 40].forEach((v) => t.insert(v));
      expect(t.rank(10)).toBe(0);
      expect(t.rank(25)).toBe(2);
      expect(t.rank(40)).toBe(3);
      expect(t.rank(100)).toBe(4);
    });

    test("delete 후 kth 갱신", () => {
      const t = new OrderStatisticTree();
      [1, 2, 3, 4, 5].forEach((v) => t.insert(v));
      t.delete(3);
      expect(t.kth(3)).toBe(4);
      expect(t.kth(4)).toBe(5);
    });
  });

  describe("엣지", () => {
    test("중복 원소를 허용", () => {
      const t = new OrderStatisticTree();
      [5, 5, 5].forEach((v) => t.insert(v));
      expect(t.kth(1)).toBe(5);
      expect(t.kth(2)).toBe(5);
      expect(t.kth(3)).toBe(5);
      expect(t.rank(5)).toBe(0);
      expect(t.rank(6)).toBe(3);
    });

    test("delete는 한 개만 제거", () => {
      const t = new OrderStatisticTree();
      [7, 7, 7].forEach((v) => t.insert(v));
      t.delete(7);
      expect(t.rank(8)).toBe(2);
    });

    test("존재하지 않는 값 삭제는 무시", () => {
      const t = new OrderStatisticTree();
      t.insert(1);
      t.delete(999);
      expect(t.kth(1)).toBe(1);
    });

    test("음수 / 0 / 양수 혼합", () => {
      const t = new OrderStatisticTree();
      [-5, 0, 5, -1].forEach((v) => t.insert(v));
      expect(t.kth(1)).toBe(-5);
      expect(t.kth(2)).toBe(-1);
      expect(t.kth(3)).toBe(0);
      expect(t.kth(4)).toBe(5);
    });
  });

  describe("바운더리", () => {
    test("단일 원소", () => {
      const t = new OrderStatisticTree();
      t.insert(42);
      expect(t.kth(1)).toBe(42);
      expect(t.rank(42)).toBe(0);
      expect(t.rank(43)).toBe(1);
    });

    test("n=10^5 삽입 후 kth", () => {
      const n = 100_000;
      const t = new OrderStatisticTree();
      for (let i = 1; i <= n; i++) t.insert(i);
      expect(t.kth(1)).toBe(1);
      expect(t.kth(n)).toBe(n);
      expect(t.kth(n / 2)).toBe(n / 2);
    });
  });

  describe("성능", () => {
    test("n=10^5 insert + 질의를 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const t = new OrderStatisticTree();

      const start = performance.now();
      for (let i = 0; i < n; i++) t.insert((i * 2654435761) % n);
      let acc = 0;
      for (let i = 1; i <= 1000; i++) acc += t.kth(i);
      const elapsed = performance.now() - start;

      expect(acc).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
