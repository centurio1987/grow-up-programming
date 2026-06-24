import { test, expect, describe } from "bun:test";
import { SplayTree } from "./splayTree";

describe("SplayTree", () => {
  describe("기본", () => {
    test("insert 후 has true 반환", () => {
      const tree = new SplayTree<number>();
      tree.insert(5);
      tree.insert(3);
      tree.insert(7);
      expect(tree.has(5)).toBe(true);
      expect(tree.has(3)).toBe(true);
      expect(tree.has(7)).toBe(true);
    });

    test("없는 값은 has false 반환", () => {
      const tree = new SplayTree<number>();
      tree.insert(10);
      expect(tree.has(99)).toBe(false);
    });

    test("inOrder는 정렬된 배열 반환", () => {
      const tree = new SplayTree<number>();
      [5, 3, 7, 1, 4, 6, 8].forEach((v) => tree.insert(v));
      expect(tree.inOrder()).toEqual([1, 3, 4, 5, 6, 7, 8]);
    });

    test("delete 후 has false 반환", () => {
      const tree = new SplayTree<number>();
      tree.insert(5);
      tree.insert(3);
      tree.insert(7);
      expect(tree.delete(3)).toBe(true);
      expect(tree.has(3)).toBe(false);
      expect(tree.has(5)).toBe(true);
    });

    test("delete 없는 값은 false 반환", () => {
      const tree = new SplayTree<number>();
      tree.insert(10);
      expect(tree.delete(99)).toBe(false);
    });

    test("min/max 반환", () => {
      const tree = new SplayTree<number>();
      [5, 3, 7, 1, 9, 4].forEach((v) => tree.insert(v));
      expect(tree.min()).toBe(1);
      expect(tree.max()).toBe(9);
    });

    test("size 정확히 반환", () => {
      const tree = new SplayTree<number>();
      expect(tree.size()).toBe(0);
      tree.insert(1);
      tree.insert(2);
      tree.insert(3);
      expect(tree.size()).toBe(3);
      tree.delete(2);
      expect(tree.size()).toBe(2);
    });

    test("커스텀 comparator로 문자열 정렬", () => {
      const tree = new SplayTree<string>((a, b) => a.localeCompare(b));
      ["zebra", "apple", "mango"].forEach((v) => tree.insert(v));
      expect(tree.inOrder()).toEqual(["apple", "mango", "zebra"]);
    });
  });

  describe("스플레이 지역성", () => {
    test("has 후 동일 값 재접근이 빠름 — inOrder 유지", () => {
      const tree = new SplayTree<number>();
      [10, 5, 15, 3, 7, 12, 20].forEach((v) => tree.insert(v));
      tree.has(7);
      // 스플레이 후에도 inOrder가 동일해야 한다
      expect(tree.inOrder()).toEqual([3, 5, 7, 10, 12, 15, 20]);
    });

    test("insert 후 inOrder 정렬 유지", () => {
      const tree = new SplayTree<number>();
      for (let i = 50; i >= 1; i--) {
        tree.insert(i);
      }
      const result = tree.inOrder();
      for (let i = 1; i < result.length; i++) {
        expect((result[i] as number) > (result[i - 1] as number)).toBe(true);
      }
    });

    test("delete 후 inOrder 정렬 유지", () => {
      const tree = new SplayTree<number>();
      [10, 5, 15, 3, 7, 12, 20].forEach((v) => tree.insert(v));
      tree.delete(5);
      tree.delete(15);
      const result = tree.inOrder();
      for (let i = 1; i < result.length; i++) {
        expect((result[i] as number) > (result[i - 1] as number)).toBe(true);
      }
    });

    test("has 여러 번 호출 후 size 변하지 않음", () => {
      const tree = new SplayTree<number>();
      [1, 2, 3, 4, 5].forEach((v) => tree.insert(v));
      const sizeBefore = tree.size();
      tree.has(3);
      tree.has(1);
      tree.has(5);
      expect(tree.size()).toBe(sizeBefore);
    });
  });

  describe("엣지", () => {
    test("빈 트리 min/max는 undefined", () => {
      const tree = new SplayTree<number>();
      expect(tree.min()).toBeUndefined();
      expect(tree.max()).toBeUndefined();
    });

    test("빈 트리 inOrder는 빈 배열", () => {
      const tree = new SplayTree<number>();
      expect(tree.inOrder()).toEqual([]);
    });

    test("중복 값 삽입 — 크기 변화 없음", () => {
      const tree = new SplayTree<number>();
      tree.insert(5);
      tree.insert(5);
      tree.insert(5);
      expect(tree.size()).toBe(1);
    });

    test("루트 삭제 후 트리 유지", () => {
      const tree = new SplayTree<number>();
      [5, 3, 7].forEach((v) => tree.insert(v));
      tree.delete(5);
      expect(tree.has(5)).toBe(false);
      expect(tree.inOrder()).toEqual([3, 7]);
    });

    test("단일 노드 삭제 후 빈 트리", () => {
      const tree = new SplayTree<number>();
      tree.insert(42);
      tree.delete(42);
      expect(tree.size()).toBe(0);
      expect(tree.min()).toBeUndefined();
    });

    test("두 자식 있는 노드 삭제 후 정렬 유지", () => {
      const tree = new SplayTree<number>();
      [10, 5, 15, 3, 7, 12, 20].forEach((v) => tree.insert(v));
      tree.delete(10);
      expect(tree.has(10)).toBe(false);
      expect(tree.inOrder()).toEqual([3, 5, 7, 12, 15, 20]);
    });
  });

  describe("성능", () => {
    test("n=10^4 insert + has 100ms 이내", () => {
      const tree = new SplayTree<number>();
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

    test("최근 접근 패턴 — 같은 값 반복 has가 빠름", () => {
      const tree = new SplayTree<number>();
      const n = 10_000;
      for (let i = 0; i < n; i++) {
        tree.insert(i);
      }
      const start = performance.now();
      // 동일한 소수 집합을 반복 접근 → locality 효과
      for (let i = 0; i < 10_000; i++) {
        tree.has(i % 10);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(50);
    });
  });
});
