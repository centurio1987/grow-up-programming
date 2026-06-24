import { test, expect, describe } from "bun:test";
import { ScapegoatTree } from "./scapegoatTree";

describe("ScapegoatTree", () => {
  describe("기본", () => {
    test("insert 후 has true 반환", () => {
      const tree = new ScapegoatTree<number>();
      tree.insert(5);
      tree.insert(3);
      tree.insert(7);
      expect(tree.has(5)).toBe(true);
      expect(tree.has(3)).toBe(true);
      expect(tree.has(7)).toBe(true);
    });

    test("없는 값은 has false 반환", () => {
      const tree = new ScapegoatTree<number>();
      tree.insert(10);
      expect(tree.has(99)).toBe(false);
    });

    test("inOrder는 정렬된 배열 반환", () => {
      const tree = new ScapegoatTree<number>();
      [5, 3, 7, 1, 4, 6, 8].forEach((v) => tree.insert(v));
      expect(tree.inOrder()).toEqual([1, 3, 4, 5, 6, 7, 8]);
    });

    test("delete 후 has false 반환", () => {
      const tree = new ScapegoatTree<number>();
      tree.insert(5);
      tree.insert(3);
      tree.insert(7);
      expect(tree.delete(3)).toBe(true);
      expect(tree.has(3)).toBe(false);
      expect(tree.has(5)).toBe(true);
    });

    test("delete 없는 값은 false 반환", () => {
      const tree = new ScapegoatTree<number>();
      tree.insert(10);
      expect(tree.delete(99)).toBe(false);
    });

    test("size 정확히 반환", () => {
      const tree = new ScapegoatTree<number>();
      expect(tree.size()).toBe(0);
      tree.insert(1);
      tree.insert(2);
      tree.insert(3);
      expect(tree.size()).toBe(3);
      tree.delete(2);
      expect(tree.size()).toBe(2);
    });

    test("커스텀 comparator로 문자열 정렬", () => {
      const tree = new ScapegoatTree<string>(0.65, (a, b) => a.localeCompare(b));
      ["grape", "apple", "fig", "cherry"].forEach((v) => tree.insert(v));
      expect(tree.inOrder()).toEqual(["apple", "cherry", "fig", "grape"]);
    });

    test("alpha 0.5 — 엄격한 균형", () => {
      const tree = new ScapegoatTree<number>(0.5);
      [10, 5, 15, 3, 7, 12, 20].forEach((v) => tree.insert(v));
      expect(tree.inOrder()).toEqual([3, 5, 7, 10, 12, 15, 20]);
    });

    test("alpha 0.75 — 느슨한 균형", () => {
      const tree = new ScapegoatTree<number>(0.75);
      [10, 5, 15, 3, 7, 12, 20].forEach((v) => tree.insert(v));
      expect(tree.inOrder()).toEqual([3, 5, 7, 10, 12, 15, 20]);
    });
  });

  describe("균형 유지", () => {
    test("역순 삽입 후 inOrder 정렬 유지", () => {
      const tree = new ScapegoatTree<number>();
      for (let i = 100; i >= 1; i--) {
        tree.insert(i);
      }
      const result = tree.inOrder();
      expect(result.length).toBe(100);
      for (let i = 1; i < result.length; i++) {
        expect((result[i] as number) > (result[i - 1] as number)).toBe(true);
      }
    });

    test("삽입 삭제 반복 후 inOrder 정렬 유지", () => {
      const tree = new ScapegoatTree<number>();
      [10, 5, 15, 3, 7, 12, 20].forEach((v) => tree.insert(v));
      [5, 15].forEach((v) => tree.delete(v));
      tree.insert(9);
      tree.insert(11);
      const result = tree.inOrder();
      for (let i = 1; i < result.length; i++) {
        expect((result[i] as number) > (result[i - 1] as number)).toBe(true);
      }
    });

    test("대량 삭제 후 size 일치", () => {
      const tree = new ScapegoatTree<number>();
      for (let i = 1; i <= 20; i++) {
        tree.insert(i);
      }
      for (let i = 1; i <= 10; i++) {
        tree.delete(i);
      }
      expect(tree.size()).toBe(10);
      expect(tree.has(11)).toBe(true);
      expect(tree.has(1)).toBe(false);
    });
  });

  describe("엣지", () => {
    test("빈 트리 inOrder는 빈 배열", () => {
      const tree = new ScapegoatTree<number>();
      expect(tree.inOrder()).toEqual([]);
    });

    test("중복 값 삽입 — 크기 변화 없음", () => {
      const tree = new ScapegoatTree<number>();
      tree.insert(5);
      tree.insert(5);
      tree.insert(5);
      expect(tree.size()).toBe(1);
    });

    test("단일 노드 삭제 후 빈 트리", () => {
      const tree = new ScapegoatTree<number>();
      tree.insert(42);
      tree.delete(42);
      expect(tree.size()).toBe(0);
      expect(tree.inOrder()).toEqual([]);
    });

    test("같은 값 삭제 후 재삽입 가능", () => {
      const tree = new ScapegoatTree<number>();
      tree.insert(5);
      tree.delete(5);
      tree.insert(5);
      expect(tree.has(5)).toBe(true);
      expect(tree.size()).toBe(1);
    });

    test("루트 삭제 후 트리 유지", () => {
      const tree = new ScapegoatTree<number>();
      [5, 3, 7].forEach((v) => tree.insert(v));
      tree.delete(5);
      expect(tree.has(5)).toBe(false);
      expect(tree.inOrder()).toEqual([3, 7]);
    });
  });

  describe("성능", () => {
    test("n=10^4 insert + has 100ms 이내", () => {
      const tree = new ScapegoatTree<number>();
      const n = 10_000;
      const start = performance.now();
      for (let i = 0; i < n; i++) {
        tree.insert(Math.floor(Math.random() * n * 10));
      }
      for (let i = 0; i < n; i++) {
        tree.has(Math.floor(Math.random() * n * 10));
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test("n=10^4 삽입 삭제 교차 200ms 이내", () => {
      const tree = new ScapegoatTree<number>();
      const n = 10_000;
      const start = performance.now();
      for (let i = 0; i < n; i++) {
        tree.insert(i);
        if (i % 2 === 0) tree.delete(i);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(200);
    });
  });
});
