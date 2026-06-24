import { test, expect, describe } from "bun:test";
import { CartesianTree } from "./cartesianTree";

describe("CartesianTree", () => {
  describe("기본", () => {
    test("fromArray 후 value()는 루트(최솟값) 반환", () => {
      const tree = CartesianTree.fromArray([5, 10, 40, 10, 20]);
      expect(tree.value()).toBe(5);
    });

    test("inOrder()는 원래 배열 순서 복원", () => {
      const arr = [5, 10, 40, 10, 20];
      const tree = CartesianTree.fromArray(arr);
      expect(tree.inOrder()).toEqual(arr);
    });

    test("size()는 배열 길이와 동일", () => {
      const arr = [3, 1, 4, 1, 5, 9, 2, 6];
      const tree = CartesianTree.fromArray(arr);
      expect(tree.size()).toBe(arr.length);
    });

    test("루트 값이 배열 전체 최솟값", () => {
      const arr = [8, 3, 6, 1, 7, 5, 2, 4];
      const tree = CartesianTree.fromArray(arr);
      expect(tree.value()).toBe(Math.min(...arr));
    });

    test("left()와 right()의 루트가 각 서브배열 최솟값", () => {
      // [5, 10, 40, 10, 20] → 루트=5(인덱스0), left=undefined, right=[10,40,10,20]
      const tree = CartesianTree.fromArray([5, 10, 40, 10, 20]);
      expect(tree.left()).toBeUndefined();
      const right = tree.right();
      expect(right).toBeDefined();
      expect(right?.value()).toBe(10);
    });

    test("중간 최솟값 — left/right 모두 존재", () => {
      // [3, 1, 2] → 루트=1(인덱스1), left=[3], right=[2]
      const tree = CartesianTree.fromArray([3, 1, 2]);
      expect(tree.value()).toBe(1);
      expect(tree.left()?.value()).toBe(3);
      expect(tree.right()?.value()).toBe(2);
    });

    test("커스텀 comparator — max-heap 기준", () => {
      // max-heap: 더 큰 값이 부모
      const tree = CartesianTree.fromArray(
        [5, 10, 40, 10, 20],
        (a, b) => b - a
      );
      // 루트는 최댓값 40
      expect(tree.value()).toBe(40);
      // inOrder는 여전히 원래 배열 복원
      expect(tree.inOrder()).toEqual([5, 10, 40, 10, 20]);
    });
  });

  describe("구조 검증", () => {
    test("BST 성질: inOrder가 원래 배열과 일치", () => {
      const arr = [9, 3, 7, 1, 8, 12, 10, 20, 15, 18];
      const tree = CartesianTree.fromArray(arr);
      expect(tree.inOrder()).toEqual(arr);
    });

    test("힙 성질: 재귀적으로 모든 노드의 값 <= 자식 값", () => {
      function checkHeap(tree: CartesianTree<number> | undefined): boolean {
        if (tree === undefined) return true;
        const v = tree.value();
        if (v === undefined) return true;
        const l = tree.left();
        const r = tree.right();
        if (l !== undefined && (l.value() ?? Infinity) < v) return false;
        if (r !== undefined && (r.value() ?? Infinity) < v) return false;
        return checkHeap(l) && checkHeap(r);
      }
      const arr = [5, 10, 40, 10, 20, 3, 15];
      const tree = CartesianTree.fromArray(arr);
      expect(checkHeap(tree)).toBe(true);
    });

    test("left().size() + right().size() + 1 == size()", () => {
      const arr = [5, 10, 40, 10, 20];
      const tree = CartesianTree.fromArray(arr);
      const leftSize = tree.left()?.size() ?? 0;
      const rightSize = tree.right()?.size() ?? 0;
      expect(leftSize + rightSize + 1).toBe(tree.size());
    });

    test("정렬된 배열 — 선형 트리 (오른쪽으로만)", () => {
      // [1, 2, 3, 4, 5]: 루트=1, right=[2,3,4,5]
      const arr = [1, 2, 3, 4, 5];
      const tree = CartesianTree.fromArray(arr);
      expect(tree.value()).toBe(1);
      expect(tree.left()).toBeUndefined();
      expect(tree.right()?.value()).toBe(2);
      expect(tree.inOrder()).toEqual(arr);
    });

    test("역순 배열 — 선형 트리 (왼쪽으로만)", () => {
      // [5, 4, 3, 2, 1]: 루트=1(인덱스4), 오른쪽 없음
      const arr = [5, 4, 3, 2, 1];
      const tree = CartesianTree.fromArray(arr);
      expect(tree.value()).toBe(1);
      expect(tree.right()).toBeUndefined();
      expect(tree.inOrder()).toEqual(arr);
    });

    test("중복 값 포함 배열 처리", () => {
      const arr = [3, 1, 4, 1, 5, 9, 2, 6];
      const tree = CartesianTree.fromArray(arr);
      expect(tree.inOrder()).toEqual(arr);
      expect(tree.size()).toBe(arr.length);
    });
  });

  describe("엣지", () => {
    test("빈 배열 — value() undefined", () => {
      const tree = CartesianTree.fromArray<number>([]);
      expect(tree.value()).toBeUndefined();
      expect(tree.size()).toBe(0);
      expect(tree.inOrder()).toEqual([]);
    });

    test("단일 원소 배열", () => {
      const tree = CartesianTree.fromArray([42]);
      expect(tree.value()).toBe(42);
      expect(tree.left()).toBeUndefined();
      expect(tree.right()).toBeUndefined();
      expect(tree.inOrder()).toEqual([42]);
    });

    test("두 원소 배열 [2, 1]", () => {
      const tree = CartesianTree.fromArray([2, 1]);
      expect(tree.value()).toBe(1);
      expect(tree.left()?.value()).toBe(2);
      expect(tree.right()).toBeUndefined();
      expect(tree.inOrder()).toEqual([2, 1]);
    });

    test("두 원소 배열 [1, 2]", () => {
      const tree = CartesianTree.fromArray([1, 2]);
      expect(tree.value()).toBe(1);
      expect(tree.left()).toBeUndefined();
      expect(tree.right()?.value()).toBe(2);
      expect(tree.inOrder()).toEqual([1, 2]);
    });
  });

  describe("성능", () => {
    test("n=10^4 fromArray O(n) — 100ms 이내", () => {
      const n = 10_000;
      const arr = Array.from({ length: n }, () => Math.floor(Math.random() * n));
      const start = performance.now();
      const tree = CartesianTree.fromArray(arr);
      const elapsed = performance.now() - start;
      expect(tree.size()).toBe(n);
      expect(elapsed).toBeLessThan(100);
    });

    test("n=10^4 inOrder 배열 복원 — 100ms 이내", () => {
      const n = 10_000;
      const arr = Array.from({ length: n }, (_, i) => i);
      const tree = CartesianTree.fromArray(arr);
      const start = performance.now();
      const result = tree.inOrder();
      const elapsed = performance.now() - start;
      expect(result).toEqual(arr);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
