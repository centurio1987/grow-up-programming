import { test, expect, describe } from "bun:test";
import { BTree } from "./bTree";

describe("BTree", () => {
  describe("기본 삽입 및 탐색", () => {
    test("insert 후 has는 true를 반환한다", () => {
      const tree = new BTree<number>();
      tree.insert(10);
      expect(tree.has(10)).toBe(true);
    });

    test("존재하지 않는 값에 has는 false를 반환한다", () => {
      const tree = new BTree<number>();
      tree.insert(10);
      expect(tree.has(99)).toBe(false);
    });

    test("빈 트리에서 has는 false를 반환한다", () => {
      const tree = new BTree<number>();
      expect(tree.has(1)).toBe(false);
    });

    test("여러 값을 삽입한 후 모두 탐색 가능하다", () => {
      const tree = new BTree<number>();
      const values = [10, 20, 5, 6, 12, 30, 7, 17];
      for (const v of values) tree.insert(v);
      for (const v of values) expect(tree.has(v)).toBe(true);
    });

    test("최소 차수 t=2로 동작한다", () => {
      const tree = new BTree<number>(2);
      for (const v of [3, 1, 4, 5, 9, 2, 6]) tree.insert(v);
      expect(tree.has(3)).toBe(true);
      expect(tree.has(9)).toBe(true);
      expect(tree.has(99)).toBe(false);
    });

    test("최소 차수 t=5로 동작한다", () => {
      const tree = new BTree<number>(5);
      for (let i = 1; i <= 20; i++) tree.insert(i);
      for (let i = 1; i <= 20; i++) expect(tree.has(i)).toBe(true);
    });

    test("커스텀 비교 함수를 사용할 수 있다", () => {
      const tree = new BTree<string>(3, (a, b) => a.localeCompare(b));
      tree.insert("cherry");
      tree.insert("apple");
      tree.insert("banana");
      expect(tree.has("apple")).toBe(true);
      expect(tree.has("mango")).toBe(false);
    });
  });

  describe("inOrder 순회", () => {
    test("inOrder는 정렬된 배열을 반환한다", () => {
      const tree = new BTree<number>();
      for (const v of [10, 20, 5, 6, 12, 30, 7, 17]) tree.insert(v);
      expect(tree.inOrder()).toEqual([5, 6, 7, 10, 12, 17, 20, 30]);
    });

    test("빈 트리의 inOrder는 빈 배열을 반환한다", () => {
      const tree = new BTree<number>();
      expect(tree.inOrder()).toEqual([]);
    });

    test("역순 삽입 후 inOrder는 오름차순이다", () => {
      const tree = new BTree<number>();
      for (let i = 20; i >= 1; i--) tree.insert(i);
      expect(tree.inOrder()).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    });

    test("t=2일 때 inOrder가 올바르다", () => {
      const tree = new BTree<number>(2);
      for (const v of [5, 3, 7, 1, 4, 6, 8]) tree.insert(v);
      expect(tree.inOrder()).toEqual([1, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe("size", () => {
    test("빈 트리의 size는 0이다", () => {
      const tree = new BTree<number>();
      expect(tree.size()).toBe(0);
    });

    test("insert 후 size가 증가한다", () => {
      const tree = new BTree<number>();
      tree.insert(1);
      tree.insert(2);
      tree.insert(3);
      expect(tree.size()).toBe(3);
    });

    test("n개 삽입 후 size는 n이다", () => {
      const tree = new BTree<number>();
      for (let i = 0; i < 100; i++) tree.insert(i);
      expect(tree.size()).toBe(100);
    });
  });

  describe("delete", () => {
    test("존재하는 값 삭제 시 true를 반환한다", () => {
      const tree = new BTree<number>();
      tree.insert(10);
      expect(tree.delete(10)).toBe(true);
    });

    test("존재하지 않는 값 삭제 시 false를 반환한다", () => {
      const tree = new BTree<number>();
      tree.insert(10);
      expect(tree.delete(99)).toBe(false);
    });

    test("삭제 후 has는 false를 반환한다", () => {
      const tree = new BTree<number>();
      tree.insert(10);
      tree.delete(10);
      expect(tree.has(10)).toBe(false);
    });

    test("삭제 후 size가 감소한다", () => {
      const tree = new BTree<number>();
      for (const v of [1, 2, 3, 4, 5]) tree.insert(v);
      tree.delete(3);
      expect(tree.size()).toBe(4);
    });

    test("삭제 후 inOrder가 올바르다", () => {
      const tree = new BTree<number>();
      for (const v of [10, 20, 5, 6, 12, 30, 7, 17]) tree.insert(v);
      tree.delete(6);
      tree.delete(12);
      expect(tree.inOrder()).toEqual([5, 7, 10, 17, 20, 30]);
    });

    test("내부 노드 키 삭제 후 트리가 유효하다 (in-order successor 대체)", () => {
      const tree = new BTree<number>(2);
      for (const v of [1, 2, 3, 4, 5, 6, 7, 8]) tree.insert(v);
      tree.delete(4);
      expect(tree.has(4)).toBe(false);
      expect(tree.inOrder()).toEqual([1, 2, 3, 5, 6, 7, 8]);
    });

    test("모든 원소 삭제 후 트리는 비어있다", () => {
      const tree = new BTree<number>();
      const values = [10, 5, 15, 3, 7, 12, 20];
      for (const v of values) tree.insert(v);
      for (const v of values) tree.delete(v);
      expect(tree.size()).toBe(0);
      expect(tree.inOrder()).toEqual([]);
    });
  });

  describe("노드 분할 (split)", () => {
    test("t=3일 때 노드 분할 후 트리가 유효하다", () => {
      const tree = new BTree<number>(3);
      for (let i = 1; i <= 10; i++) tree.insert(i);
      expect(tree.inOrder()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    test("루트 분할 후 트리 높이가 증가해도 inOrder가 올바르다", () => {
      const tree = new BTree<number>(2);
      for (let i = 1; i <= 15; i++) tree.insert(i);
      expect(tree.size()).toBe(15);
      expect(tree.inOrder()).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    });
  });

  describe("언더플로우 처리 (병합/재분배)", () => {
    test("삭제 시 형제에서 키를 빌린다 (재분배)", () => {
      const tree = new BTree<number>(2);
      for (const v of [10, 5, 15, 3, 7, 12, 20]) tree.insert(v);
      tree.delete(3);
      expect(tree.has(5)).toBe(true);
      expect(tree.inOrder()).toContain(5);
    });

    test("삭제 시 형제와 병합한다", () => {
      const tree = new BTree<number>(2);
      for (const v of [1, 2, 3, 4, 5, 6, 7]) tree.insert(v);
      tree.delete(1);
      tree.delete(2);
      expect(tree.inOrder()).toEqual([3, 4, 5, 6, 7]);
    });

    test("연속 삭제 후 트리가 유효하다", () => {
      const tree = new BTree<number>(3);
      const n = 50;
      for (let i = 0; i < n; i++) tree.insert(i);
      for (let i = 0; i < n; i += 2) tree.delete(i);
      const expected = Array.from({ length: n / 2 }, (_, i) => i * 2 + 1);
      expect(tree.inOrder()).toEqual(expected);
    });
  });

  describe("엣지", () => {
    test("중복 삽입 시 size가 1만 증가한다", () => {
      const tree = new BTree<number>();
      tree.insert(5);
      tree.insert(5);
      expect(tree.size()).toBe(1);
    });

    test("중복 삽입 후 inOrder에는 한 번만 나타난다", () => {
      const tree = new BTree<number>();
      tree.insert(3);
      tree.insert(1);
      tree.insert(3);
      expect(tree.inOrder()).toEqual([1, 3]);
    });

    test("빈 트리에서 delete는 false를 반환한다", () => {
      const tree = new BTree<number>();
      expect(tree.delete(1)).toBe(false);
    });
  });

  describe("성능", () => {
    test("n=10^4 insert + has가 1초 이내에 완료된다", () => {
      const tree = new BTree<number>(10);
      const n = 10_000;
      const start = Date.now();
      for (let i = 0; i < n; i++) tree.insert(i);
      for (let i = 0; i < n; i++) expect(tree.has(i)).toBe(true);
      expect(Date.now() - start).toBeLessThan(1000);
    });

    test("n=10^4 insert + delete가 1초 이내에 완료된다", () => {
      const tree = new BTree<number>(10);
      const n = 10_000;
      for (let i = 0; i < n; i++) tree.insert(i);
      const start = Date.now();
      for (let i = 0; i < n; i++) tree.delete(i);
      expect(Date.now() - start).toBeLessThan(1000);
      expect(tree.size()).toBe(0);
    });
  });
});
