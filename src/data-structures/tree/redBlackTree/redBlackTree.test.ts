import { test, expect, describe } from "bun:test";
import { RedBlackTree } from "./redBlackTree";

describe("RedBlackTree", () => {
  describe("기본", () => {
    test("insert 후 has true 반환", () => {
      const tree = new RedBlackTree<number>();
      tree.insert(10);
      tree.insert(5);
      tree.insert(15);
      expect(tree.has(10)).toBe(true);
      expect(tree.has(5)).toBe(true);
      expect(tree.has(15)).toBe(true);
    });

    test("없는 값은 has false 반환", () => {
      const tree = new RedBlackTree<number>();
      tree.insert(10);
      expect(tree.has(99)).toBe(false);
    });

    test("inOrder는 정렬된 배열 반환", () => {
      const tree = new RedBlackTree<number>();
      [7, 3, 18, 10, 22, 8, 11, 26].forEach((v) => tree.insert(v));
      expect(tree.inOrder()).toEqual([3, 7, 8, 10, 11, 18, 22, 26]);
    });

    test("delete 후 has false 반환", () => {
      const tree = new RedBlackTree<number>();
      tree.insert(10);
      tree.insert(5);
      tree.insert(15);
      expect(tree.delete(5)).toBe(true);
      expect(tree.has(5)).toBe(false);
      expect(tree.has(10)).toBe(true);
    });

    test("delete 없는 값은 false 반환", () => {
      const tree = new RedBlackTree<number>();
      tree.insert(10);
      expect(tree.delete(99)).toBe(false);
    });

    test("min/max 반환", () => {
      const tree = new RedBlackTree<number>();
      [10, 3, 18, 1, 5, 15, 20].forEach((v) => tree.insert(v));
      expect(tree.min()).toBe(1);
      expect(tree.max()).toBe(20);
    });

    test("size 정확히 반환", () => {
      const tree = new RedBlackTree<number>();
      expect(tree.size()).toBe(0);
      tree.insert(1);
      tree.insert(2);
      tree.insert(3);
      expect(tree.size()).toBe(3);
      tree.delete(2);
      expect(tree.size()).toBe(2);
    });

    test("커스텀 comparator로 문자열 정렬", () => {
      const tree = new RedBlackTree<string>((a, b) => a.localeCompare(b));
      ["mango", "apple", "kiwi", "banana"].forEach((v) => tree.insert(v));
      expect(tree.inOrder()).toEqual(["apple", "banana", "kiwi", "mango"]);
    });
  });

  describe("레드-블랙 속성 유지", () => {
    test("역순 삽입 후 inOrder 정렬 유지", () => {
      const tree = new RedBlackTree<number>();
      for (let i = 100; i >= 1; i--) {
        tree.insert(i);
      }
      const result = tree.inOrder();
      for (let i = 1; i < result.length; i++) {
        expect((result[i] as number) > (result[i - 1] as number)).toBe(true);
      }
    });

    test("순차 삽입 후에도 정렬 유지", () => {
      const tree = new RedBlackTree<number>();
      for (let i = 1; i <= 100; i++) {
        tree.insert(i);
      }
      const result = tree.inOrder();
      expect(result.length).toBe(100);
      for (let i = 1; i < result.length; i++) {
        expect((result[i] as number) > (result[i - 1] as number)).toBe(true);
      }
    });

    test("삽입 삭제 반복 후 정렬 유지", () => {
      const tree = new RedBlackTree<number>();
      [10, 5, 15, 3, 7, 12, 20, 1, 4, 6, 8].forEach((v) => tree.insert(v));
      [5, 15, 3].forEach((v) => tree.delete(v));
      tree.insert(9);
      const result = tree.inOrder();
      for (let i = 1; i < result.length; i++) {
        expect((result[i] as number) > (result[i - 1] as number)).toBe(true);
      }
    });

    test("삽입 후 루트는 항상 존재", () => {
      const tree = new RedBlackTree<number>();
      tree.insert(42);
      expect(tree.has(42)).toBe(true);
    });
  });

  describe("엣지", () => {
    test("빈 트리 min/max는 undefined", () => {
      const tree = new RedBlackTree<number>();
      expect(tree.min()).toBeUndefined();
      expect(tree.max()).toBeUndefined();
    });

    test("빈 트리 inOrder는 빈 배열", () => {
      const tree = new RedBlackTree<number>();
      expect(tree.inOrder()).toEqual([]);
    });

    test("중복 값 삽입 — 크기 변화 없음", () => {
      const tree = new RedBlackTree<number>();
      tree.insert(7);
      tree.insert(7);
      tree.insert(7);
      expect(tree.size()).toBe(1);
    });

    test("루트 삭제 후 트리 유지", () => {
      const tree = new RedBlackTree<number>();
      [10, 5, 15].forEach((v) => tree.insert(v));
      tree.delete(10);
      expect(tree.has(10)).toBe(false);
      expect(tree.inOrder()).toEqual([5, 15]);
    });

    test("두 자식 있는 노드 삭제", () => {
      const tree = new RedBlackTree<number>();
      [10, 5, 15, 3, 7, 12, 20].forEach((v) => tree.insert(v));
      tree.delete(5);
      expect(tree.has(5)).toBe(false);
      expect(tree.inOrder()).toEqual([3, 7, 10, 12, 15, 20]);
    });

    test("단일 노드 삭제 후 빈 트리", () => {
      const tree = new RedBlackTree<number>();
      tree.insert(42);
      tree.delete(42);
      expect(tree.size()).toBe(0);
      expect(tree.inOrder()).toEqual([]);
    });
  });

  describe("성능", () => {
    test("n=10^4 insert + has 100ms 이내", () => {
      const tree = new RedBlackTree<number>();
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

    test("n=10^4 순차 insert 후 inOrder 200ms 이내", () => {
      const tree = new RedBlackTree<number>();
      const n = 10_000;
      for (let i = 0; i < n; i++) {
        tree.insert(i);
      }
      const start = performance.now();
      const result = tree.inOrder();
      const elapsed = performance.now() - start;
      expect(result.length).toBe(n);
      expect(elapsed).toBeLessThan(200);
    });
  });
});
