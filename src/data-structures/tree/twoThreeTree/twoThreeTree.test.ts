import { test, expect, describe } from "bun:test";
import { TwoThreeTree } from "./twoThreeTree";

describe("TwoThreeTree", () => {
  describe("기본 삽입 및 탐색", () => {
    test("insert 후 has는 true를 반환한다", () => {
      const tree = new TwoThreeTree<number>();
      tree.insert(5);
      expect(tree.has(5)).toBe(true);
    });

    test("존재하지 않는 값에 has는 false를 반환한다", () => {
      const tree = new TwoThreeTree<number>();
      tree.insert(5);
      expect(tree.has(99)).toBe(false);
    });

    test("빈 트리에서 has는 false를 반환한다", () => {
      const tree = new TwoThreeTree<number>();
      expect(tree.has(1)).toBe(false);
    });

    test("여러 값을 삽입한 후 모두 탐색 가능하다", () => {
      const tree = new TwoThreeTree<number>();
      const values = [10, 5, 15, 3, 7, 12, 20];
      for (const v of values) tree.insert(v);
      for (const v of values) expect(tree.has(v)).toBe(true);
    });

    test("문자열 값도 저장 가능하다", () => {
      const tree = new TwoThreeTree<string>();
      tree.insert("banana");
      tree.insert("apple");
      tree.insert("cherry");
      expect(tree.has("apple")).toBe(true);
      expect(tree.has("banana")).toBe(true);
      expect(tree.has("cherry")).toBe(true);
      expect(tree.has("mango")).toBe(false);
    });

    test("커스텀 비교 함수를 사용할 수 있다", () => {
      const tree = new TwoThreeTree<{ id: number }>((a, b) => a.id - b.id);
      tree.insert({ id: 3 });
      tree.insert({ id: 1 });
      tree.insert({ id: 2 });
      expect(tree.has({ id: 1 })).toBe(true);
      expect(tree.has({ id: 4 })).toBe(false);
    });
  });

  describe("inOrder 순회", () => {
    test("inOrder는 정렬된 배열을 반환한다", () => {
      const tree = new TwoThreeTree<number>();
      const values = [5, 2, 8, 1, 3, 7, 9];
      for (const v of values) tree.insert(v);
      expect(tree.inOrder()).toEqual([1, 2, 3, 5, 7, 8, 9]);
    });

    test("빈 트리의 inOrder는 빈 배열을 반환한다", () => {
      const tree = new TwoThreeTree<number>();
      expect(tree.inOrder()).toEqual([]);
    });

    test("단일 원소 inOrder는 그 원소를 담은 배열을 반환한다", () => {
      const tree = new TwoThreeTree<number>();
      tree.insert(42);
      expect(tree.inOrder()).toEqual([42]);
    });

    test("역순으로 삽입해도 inOrder는 오름차순이다", () => {
      const tree = new TwoThreeTree<number>();
      for (let i = 10; i >= 1; i--) tree.insert(i);
      expect(tree.inOrder()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });

  describe("size", () => {
    test("빈 트리의 size는 0이다", () => {
      const tree = new TwoThreeTree<number>();
      expect(tree.size()).toBe(0);
    });

    test("insert 후 size가 증가한다", () => {
      const tree = new TwoThreeTree<number>();
      tree.insert(1);
      expect(tree.size()).toBe(1);
      tree.insert(2);
      expect(tree.size()).toBe(2);
      tree.insert(3);
      expect(tree.size()).toBe(3);
    });

    test("n개 삽입 후 size는 n이다", () => {
      const tree = new TwoThreeTree<number>();
      for (let i = 0; i < 50; i++) tree.insert(i);
      expect(tree.size()).toBe(50);
    });
  });

  describe("delete", () => {
    test("존재하는 값 삭제 시 true를 반환한다", () => {
      const tree = new TwoThreeTree<number>();
      tree.insert(5);
      expect(tree.delete(5)).toBe(true);
    });

    test("존재하지 않는 값 삭제 시 false를 반환한다", () => {
      const tree = new TwoThreeTree<number>();
      tree.insert(5);
      expect(tree.delete(99)).toBe(false);
    });

    test("삭제 후 has는 false를 반환한다", () => {
      const tree = new TwoThreeTree<number>();
      tree.insert(5);
      tree.delete(5);
      expect(tree.has(5)).toBe(false);
    });

    test("삭제 후 size가 감소한다", () => {
      const tree = new TwoThreeTree<number>();
      tree.insert(1);
      tree.insert(2);
      tree.insert(3);
      tree.delete(2);
      expect(tree.size()).toBe(2);
    });

    test("삭제 후 나머지 원소는 여전히 탐색 가능하다", () => {
      const tree = new TwoThreeTree<number>();
      const values = [10, 5, 15, 3, 7, 12, 20];
      for (const v of values) tree.insert(v);
      tree.delete(5);
      expect(tree.has(5)).toBe(false);
      for (const v of values.filter(v => v !== 5)) {
        expect(tree.has(v)).toBe(true);
      }
    });

    test("삭제 후 inOrder는 올바른 정렬 순서를 유지한다", () => {
      const tree = new TwoThreeTree<number>();
      for (const v of [5, 2, 8, 1, 3, 7, 9]) tree.insert(v);
      tree.delete(3);
      tree.delete(7);
      expect(tree.inOrder()).toEqual([1, 2, 5, 8, 9]);
    });

    test("루트 삭제 후 트리가 유효하다", () => {
      const tree = new TwoThreeTree<number>();
      tree.insert(5);
      tree.delete(5);
      expect(tree.size()).toBe(0);
      expect(tree.inOrder()).toEqual([]);
    });

    test("모든 원소 삭제 후 트리는 비어있다", () => {
      const tree = new TwoThreeTree<number>();
      const values = [1, 2, 3, 4, 5];
      for (const v of values) tree.insert(v);
      for (const v of values) tree.delete(v);
      expect(tree.size()).toBe(0);
      expect(tree.inOrder()).toEqual([]);
    });
  });

  describe("노드 분할 (split)", () => {
    test("분할 후에도 inOrder 결과가 정렬되어 있다", () => {
      const tree = new TwoThreeTree<number>();
      for (let i = 1; i <= 7; i++) tree.insert(i);
      expect(tree.inOrder()).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(tree.size()).toBe(7);
    });

    test("많은 삽입 후에도 inOrder 결과가 정렬되어 있다", () => {
      const tree = new TwoThreeTree<number>();
      const n = 100;
      const values = Array.from({ length: n }, (_, i) => i);
      const shuffled = [...values].sort(() => Math.random() - 0.5);
      for (const v of shuffled) tree.insert(v);
      expect(tree.inOrder()).toEqual(values);
    });
  });

  describe("병합 (merge) 및 재분배", () => {
    test("삭제 시 병합이 발생해도 트리 유효성이 유지된다", () => {
      const tree = new TwoThreeTree<number>();
      for (const v of [4, 2, 6, 1, 3, 5, 7]) tree.insert(v);
      tree.delete(1);
      tree.delete(3);
      tree.delete(5);
      expect(tree.inOrder()).toEqual([2, 4, 6, 7]);
    });

    test("형제에서 빌리는 재분배도 처리한다", () => {
      const tree = new TwoThreeTree<number>();
      for (const v of [10, 5, 20, 15, 25, 3, 7]) tree.insert(v);
      tree.delete(3);
      expect(tree.has(5)).toBe(true);
      expect(tree.has(7)).toBe(true);
    });
  });

  describe("엣지", () => {
    test("중복 삽입 시 size가 1만 증가한다", () => {
      const tree = new TwoThreeTree<number>();
      tree.insert(5);
      tree.insert(5);
      expect(tree.size()).toBe(1);
    });

    test("중복 삽입 후 inOrder에는 한 번만 나타난다", () => {
      const tree = new TwoThreeTree<number>();
      tree.insert(3);
      tree.insert(3);
      tree.insert(1);
      expect(tree.inOrder()).toEqual([1, 3]);
    });

    test("빈 트리에서 delete는 false를 반환한다", () => {
      const tree = new TwoThreeTree<number>();
      expect(tree.delete(1)).toBe(false);
    });
  });

  describe("성능", () => {
    test("n=10^4 insert + has가 1초 이내에 완료된다", () => {
      const tree = new TwoThreeTree<number>();
      const n = 10_000;
      const start = Date.now();
      for (let i = 0; i < n; i++) tree.insert(i);
      for (let i = 0; i < n; i++) expect(tree.has(i)).toBe(true);
      expect(Date.now() - start).toBeLessThan(1000);
    });

    test("n=10^4 insert + delete가 1초 이내에 완료된다", () => {
      const tree = new TwoThreeTree<number>();
      const n = 10_000;
      for (let i = 0; i < n; i++) tree.insert(i);
      const start = Date.now();
      for (let i = 0; i < n; i++) tree.delete(i);
      expect(Date.now() - start).toBeLessThan(1000);
      expect(tree.size()).toBe(0);
    });
  });
});
