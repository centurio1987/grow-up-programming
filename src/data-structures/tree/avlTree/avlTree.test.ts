import { test, expect, describe } from "bun:test";
import { AVLTree } from "./avlTree";

describe("AVLTree", () => {
  describe("기본", () => {
    test("insert 후 has true 반환", () => {
      const tree = new AVLTree<number>();
      tree.insert(5);
      tree.insert(3);
      tree.insert(7);
      expect(tree.has(5)).toBe(true);
      expect(tree.has(3)).toBe(true);
      expect(tree.has(7)).toBe(true);
    });

    test("없는 값은 has false 반환", () => {
      const tree = new AVLTree<number>();
      tree.insert(10);
      expect(tree.has(99)).toBe(false);
    });

    test("inOrder는 정렬된 배열 반환", () => {
      const tree = new AVLTree<number>();
      [5, 3, 7, 1, 4, 6, 8].forEach((v) => tree.insert(v));
      expect(tree.inOrder()).toEqual([1, 3, 4, 5, 6, 7, 8]);
    });

    test("delete 후 has false 반환", () => {
      const tree = new AVLTree<number>();
      tree.insert(5);
      tree.insert(3);
      tree.insert(7);
      expect(tree.delete(3)).toBe(true);
      expect(tree.has(3)).toBe(false);
      expect(tree.has(5)).toBe(true);
    });

    test("delete 없는 값은 false 반환", () => {
      const tree = new AVLTree<number>();
      tree.insert(5);
      expect(tree.delete(99)).toBe(false);
    });

    test("min/max 반환", () => {
      const tree = new AVLTree<number>();
      [5, 3, 7, 1, 9, 4].forEach((v) => tree.insert(v));
      expect(tree.min()).toBe(1);
      expect(tree.max()).toBe(9);
    });

    test("size 정확히 반환", () => {
      const tree = new AVLTree<number>();
      expect(tree.size()).toBe(0);
      tree.insert(1);
      tree.insert(2);
      tree.insert(3);
      expect(tree.size()).toBe(3);
      tree.delete(2);
      expect(tree.size()).toBe(2);
    });

    test("커스텀 comparator로 문자열 정렬", () => {
      const tree = new AVLTree<string>((a, b) => a.localeCompare(b));
      ["banana", "apple", "cherry", "date"].forEach((v) => tree.insert(v));
      expect(tree.inOrder()).toEqual(["apple", "banana", "cherry", "date"]);
      expect(tree.min()).toBe("apple");
      expect(tree.max()).toBe("date");
    });
  });

  describe("균형 유지", () => {
    test("역순 삽입 후 높이가 O(log n) 이내", () => {
      const tree = new AVLTree<number>();
      const n = 1024;
      for (let i = n; i >= 1; i--) {
        tree.insert(i);
      }
      // AVL 트리 높이 상한: 1.44 * log2(n+2) - 0.33
      const maxExpected = Math.ceil(1.5 * Math.log2(n + 2));
      expect(tree.height()).toBeLessThanOrEqual(maxExpected);
    });

    test("순차 삽입 후 높이가 O(log n) 이내", () => {
      const tree = new AVLTree<number>();
      const n = 1024;
      for (let i = 1; i <= n; i++) {
        tree.insert(i);
      }
      const maxExpected = Math.ceil(1.5 * Math.log2(n + 2));
      expect(tree.height()).toBeLessThanOrEqual(maxExpected);
    });

    test("삽입 삭제 반복 후 inOrder 정렬 유지", () => {
      const tree = new AVLTree<number>();
      [10, 5, 15, 3, 7, 12, 20].forEach((v) => tree.insert(v));
      tree.delete(5);
      tree.delete(15);
      tree.insert(6);
      tree.insert(18);
      const result = tree.inOrder();
      for (let i = 1; i < result.length; i++) {
        expect((result[i] as number) > (result[i - 1] as number)).toBe(true);
      }
    });

    test("LL 회전: 왼쪽 단방향 삽입 후 균형", () => {
      const tree = new AVLTree<number>();
      tree.insert(30);
      tree.insert(20);
      tree.insert(10);
      expect(tree.inOrder()).toEqual([10, 20, 30]);
      expect(tree.height()).toBeLessThanOrEqual(2);
    });

    test("RR 회전: 오른쪽 단방향 삽입 후 균형", () => {
      const tree = new AVLTree<number>();
      tree.insert(10);
      tree.insert(20);
      tree.insert(30);
      expect(tree.inOrder()).toEqual([10, 20, 30]);
      expect(tree.height()).toBeLessThanOrEqual(2);
    });

    test("LR 회전: 왼쪽-오른쪽 삽입 후 균형", () => {
      const tree = new AVLTree<number>();
      tree.insert(30);
      tree.insert(10);
      tree.insert(20);
      expect(tree.inOrder()).toEqual([10, 20, 30]);
      expect(tree.height()).toBeLessThanOrEqual(2);
    });

    test("RL 회전: 오른쪽-왼쪽 삽입 후 균형", () => {
      const tree = new AVLTree<number>();
      tree.insert(10);
      tree.insert(30);
      tree.insert(20);
      expect(tree.inOrder()).toEqual([10, 20, 30]);
      expect(tree.height()).toBeLessThanOrEqual(2);
    });
  });

  describe("엣지", () => {
    test("빈 트리 min/max는 undefined", () => {
      const tree = new AVLTree<number>();
      expect(tree.min()).toBeUndefined();
      expect(tree.max()).toBeUndefined();
    });

    test("빈 트리 inOrder는 빈 배열", () => {
      const tree = new AVLTree<number>();
      expect(tree.inOrder()).toEqual([]);
    });

    test("빈 트리 height는 0", () => {
      const tree = new AVLTree<number>();
      expect(tree.height()).toBe(0);
    });

    test("단일 노드 height는 1", () => {
      const tree = new AVLTree<number>();
      tree.insert(42);
      expect(tree.height()).toBe(1);
    });

    test("중복 값 삽입 — 크기 변화 없음", () => {
      const tree = new AVLTree<number>();
      tree.insert(5);
      tree.insert(5);
      tree.insert(5);
      expect(tree.size()).toBe(1);
      expect(tree.inOrder()).toEqual([5]);
    });

    test("루트 삭제 후 트리 유지", () => {
      const tree = new AVLTree<number>();
      [5, 3, 7].forEach((v) => tree.insert(v));
      tree.delete(5);
      expect(tree.has(5)).toBe(false);
      expect(tree.inOrder()).toEqual([3, 7]);
    });

    test("두 자식 있는 노드 삭제", () => {
      const tree = new AVLTree<number>();
      [10, 5, 15, 3, 7, 12, 20].forEach((v) => tree.insert(v));
      tree.delete(10);
      expect(tree.has(10)).toBe(false);
      expect(tree.inOrder()).toEqual([3, 5, 7, 12, 15, 20]);
    });
  });

  describe("성능", () => {
    test("n=10^4 insert + has 100ms 이내", () => {
      const tree = new AVLTree<number>();
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

    test("n=10^4 insert + delete 200ms 이내", () => {
      const tree = new AVLTree<number>();
      const n = 10_000;
      const values: number[] = [];
      for (let i = 0; i < n; i++) {
        const v = i;
        values.push(v);
        tree.insert(v);
      }
      const start = performance.now();
      for (const v of values) {
        tree.delete(v);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(200);
      expect(tree.size()).toBe(0);
    });
  });
});
