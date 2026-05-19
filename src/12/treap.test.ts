import { test, expect, describe } from "bun:test";
import { Treap } from "./treap";

describe("Treap", () => {
  describe("기본", () => {
    test("insert 후 findKth가 정렬 순서를 따른다", () => {
      const t = new Treap();
      [5, 2, 8, 1, 4].forEach((v) => t.insert(v));
      expect(t.findKth(1)).toBe(1);
      expect(t.findKth(2)).toBe(2);
      expect(t.findKth(3)).toBe(4);
      expect(t.findKth(4)).toBe(5);
      expect(t.findKth(5)).toBe(8);
    });

    test("delete 후 findKth 갱신", () => {
      const t = new Treap();
      [1, 2, 3, 4, 5].forEach((v) => t.insert(v));
      t.delete(3);
      expect(t.findKth(1)).toBe(1);
      expect(t.findKth(3)).toBe(4);
      expect(t.findKth(4)).toBe(5);
    });

    test("역순 insert에도 정렬됨", () => {
      const t = new Treap();
      [10, 9, 8, 7, 6, 5].forEach((v) => t.insert(v));
      for (let i = 1; i <= 6; i++) expect(t.findKth(i)).toBe(i + 4);
    });
  });

  describe("엣지", () => {
    test("중복 허용", () => {
      const t = new Treap();
      [7, 7, 7].forEach((v) => t.insert(v));
      expect(t.findKth(1)).toBe(7);
      expect(t.findKth(2)).toBe(7);
      expect(t.findKth(3)).toBe(7);
    });

    test("중복 중 한 개만 delete", () => {
      const t = new Treap();
      [3, 3, 3].forEach((v) => t.insert(v));
      t.delete(3);
      expect(t.findKth(1)).toBe(3);
      expect(t.findKth(2)).toBe(3);
    });

    test("존재하지 않는 값 delete는 무시", () => {
      const t = new Treap();
      t.insert(1);
      t.delete(999);
      expect(t.findKth(1)).toBe(1);
    });

    test("음수 및 0", () => {
      const t = new Treap();
      [-3, 0, -1, 2].forEach((v) => t.insert(v));
      expect(t.findKth(1)).toBe(-3);
      expect(t.findKth(2)).toBe(-1);
      expect(t.findKth(3)).toBe(0);
      expect(t.findKth(4)).toBe(2);
    });
  });

  describe("바운더리", () => {
    test("단일 원소", () => {
      const t = new Treap();
      t.insert(42);
      expect(t.findKth(1)).toBe(42);
    });

    test("n=10^5 정렬", () => {
      const n = 100_000;
      const t = new Treap();
      for (let i = n; i >= 1; i--) t.insert(i);
      expect(t.findKth(1)).toBe(1);
      expect(t.findKth(n)).toBe(n);
      expect(t.findKth(n / 2)).toBe(n / 2);
    });
  });

  describe("성능", () => {
    test("n=10^5 insert + findKth를 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const t = new Treap();

      const start = performance.now();
      for (let i = 0; i < n; i++) t.insert((i * 2654435761) % n);
      let acc = 0;
      for (let k = 1; k <= 1000; k++) acc += t.findKth(k);
      const elapsed = performance.now() - start;

      expect(acc).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
