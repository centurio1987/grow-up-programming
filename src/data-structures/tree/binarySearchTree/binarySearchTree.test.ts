import { test, expect, describe } from "bun:test";
import { BinarySearchTree } from "./binarySearchTree";

describe("BinarySearchTree", () => {
  describe("기본", () => {
    test("insert 후 search는 true를 반환한다", () => {
      const bst = new BinarySearchTree();
      bst.insert(5);
      bst.insert(3);
      bst.insert(7);
      expect(bst.search(5)).toBe(true);
      expect(bst.search(3)).toBe(true);
      expect(bst.search(7)).toBe(true);
    });

    test("없는 키에 대해 search는 false를 반환한다", () => {
      const bst = new BinarySearchTree();
      bst.insert(5);
      expect(bst.search(99)).toBe(false);
    });

    test("inorder는 삽입 순서와 무관하게 오름차순으로 반환한다", () => {
      const bst = new BinarySearchTree();
      [5, 3, 7, 1, 4, 6, 8].forEach((k) => bst.insert(k));
      expect(bst.inorder()).toEqual([1, 3, 4, 5, 6, 7, 8]);
    });

    test("min / max는 가장 작은 / 큰 키를 반환한다", () => {
      const bst = new BinarySearchTree();
      [5, 3, 7, 1, 9].forEach((k) => bst.insert(k));
      expect(bst.min()).toBe(1);
      expect(bst.max()).toBe(9);
    });
  });

  describe("delete", () => {
    test("리프 노드 삭제", () => {
      const bst = new BinarySearchTree();
      [5, 3, 7].forEach((k) => bst.insert(k));
      bst.delete(3);
      expect(bst.search(3)).toBe(false);
      expect(bst.inorder()).toEqual([5, 7]);
    });

    test("자식 하나짜리 노드 삭제", () => {
      const bst = new BinarySearchTree();
      [5, 3, 7, 6].forEach((k) => bst.insert(k));
      bst.delete(7);
      expect(bst.search(7)).toBe(false);
      expect(bst.inorder()).toEqual([3, 5, 6]);
    });

    test("자식 둘짜리 노드 삭제 (in-order successor)", () => {
      const bst = new BinarySearchTree();
      [5, 3, 7, 6, 8].forEach((k) => bst.insert(k));
      bst.delete(7); // in-order successor = 8
      expect(bst.search(7)).toBe(false);
      expect(bst.inorder()).toEqual([3, 5, 6, 8]);
    });

    test("루트 삭제", () => {
      const bst = new BinarySearchTree();
      [5, 3, 7].forEach((k) => bst.insert(k));
      bst.delete(5);
      expect(bst.search(5)).toBe(false);
      expect(bst.inorder()).toEqual([3, 7]);
    });

    test("없는 키 삭제는 에러 없이 무시한다", () => {
      const bst = new BinarySearchTree();
      bst.insert(5);
      expect(() => bst.delete(99)).not.toThrow();
      expect(bst.inorder()).toEqual([5]);
    });
  });

  describe("엣지", () => {
    test("빈 트리에서 min / max는 undefined를 반환한다", () => {
      const bst = new BinarySearchTree();
      expect(bst.min()).toBeUndefined();
      expect(bst.max()).toBeUndefined();
    });

    test("중복 삽입은 무시된다", () => {
      const bst = new BinarySearchTree();
      bst.insert(5);
      bst.insert(5);
      bst.insert(5);
      expect(bst.inorder()).toEqual([5]);
    });

    test("빈 트리의 inorder는 빈 배열을 반환한다", () => {
      const bst = new BinarySearchTree();
      expect(bst.inorder()).toEqual([]);
    });

    test("오름차순으로 삽입해도 search/inorder가 올바르다", () => {
      const bst = new BinarySearchTree();
      for (let i = 1; i <= 5; i++) bst.insert(i);
      expect(bst.inorder()).toEqual([1, 2, 3, 4, 5]);
      expect(bst.search(3)).toBe(true);
    });
  });

  describe("성능", () => {
    test("무작위 순서 10^4 insert/search를 100ms 이내에 처리한다", () => {
      const bst = new BinarySearchTree();
      const N = 10_000;
      const keys = Array.from({ length: N }, (_, i) => i + 1).sort(
        () => Math.random() - 0.5
      );
      const start = performance.now();
      for (const k of keys) bst.insert(k);
      for (const k of keys) expect(bst.search(k)).toBe(true);
      expect(performance.now() - start).toBeLessThan(100);
    });
  });
});
