import { test, expect, describe } from "bun:test";
import { BPlusTree } from "./bPlusTree";

describe("BPlusTree", () => {
  describe("기본 삽입 및 탐색", () => {
    test("insert 후 has는 true를 반환한다", () => {
      const tree = new BPlusTree<number>();
      tree.insert(10);
      expect(tree.has(10)).toBe(true);
    });

    test("존재하지 않는 값에 has는 false를 반환한다", () => {
      const tree = new BPlusTree<number>();
      tree.insert(10);
      expect(tree.has(99)).toBe(false);
    });

    test("빈 트리에서 has는 false를 반환한다", () => {
      const tree = new BPlusTree<number>();
      expect(tree.has(1)).toBe(false);
    });

    test("여러 값을 삽입한 후 모두 탐색 가능하다", () => {
      const tree = new BPlusTree<number>();
      const values = [10, 20, 5, 6, 12, 30, 7, 17];
      for (const v of values) tree.insert(v);
      for (const v of values) expect(tree.has(v)).toBe(true);
    });

    test("커스텀 비교 함수로 문자열 B+ 트리를 만들 수 있다", () => {
      const tree = new BPlusTree<string>(3, (a, b) => a.localeCompare(b));
      tree.insert("zebra");
      tree.insert("apple");
      tree.insert("mango");
      expect(tree.has("apple")).toBe(true);
      expect(tree.has("banana")).toBe(false);
    });

    test("t=2일 때 동작한다", () => {
      const tree = new BPlusTree<number>(2);
      for (const v of [5, 3, 7, 1, 4, 6, 8]) tree.insert(v);
      for (const v of [1, 3, 4, 5, 6, 7, 8]) expect(tree.has(v)).toBe(true);
    });
  });

  describe("inOrder 순회 (리프 연결 리스트)", () => {
    test("inOrder는 정렬된 배열을 반환한다", () => {
      const tree = new BPlusTree<number>();
      for (const v of [10, 20, 5, 6, 12, 30, 7, 17]) tree.insert(v);
      expect(tree.inOrder()).toEqual([5, 6, 7, 10, 12, 17, 20, 30]);
    });

    test("빈 트리의 inOrder는 빈 배열을 반환한다", () => {
      const tree = new BPlusTree<number>();
      expect(tree.inOrder()).toEqual([]);
    });

    test("역순 삽입 후 inOrder는 오름차순이다", () => {
      const tree = new BPlusTree<number>();
      for (let i = 20; i >= 1; i--) tree.insert(i);
      expect(tree.inOrder()).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    });

    test("많은 삽입 후 inOrder 결과가 올바르다", () => {
      const tree = new BPlusTree<number>(4);
      const n = 100;
      const shuffled = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5);
      for (const v of shuffled) tree.insert(v);
      expect(tree.inOrder()).toEqual(Array.from({ length: n }, (_, i) => i));
    });
  });

  describe("range 질의", () => {
    test("범위 내 모든 값을 반환한다", () => {
      const tree = new BPlusTree<number>();
      for (const v of [1, 5, 10, 15, 20, 25, 30]) tree.insert(v);
      expect(tree.range(10, 25)).toEqual([10, 15, 20, 25]);
    });

    test("범위에 걸치는 값이 없으면 빈 배열을 반환한다", () => {
      const tree = new BPlusTree<number>();
      for (const v of [1, 5, 10]) tree.insert(v);
      expect(tree.range(20, 30)).toEqual([]);
    });

    test("low === high이면 해당 값만 반환한다", () => {
      const tree = new BPlusTree<number>();
      for (const v of [1, 5, 10, 15]) tree.insert(v);
      expect(tree.range(5, 5)).toEqual([5]);
    });

    test("low가 트리의 최솟값보다 작으면 최솟값부터 반환한다", () => {
      const tree = new BPlusTree<number>();
      for (const v of [10, 20, 30]) tree.insert(v);
      expect(tree.range(0, 20)).toEqual([10, 20]);
    });

    test("high가 트리의 최댓값보다 크면 최댓값까지 반환한다", () => {
      const tree = new BPlusTree<number>();
      for (const v of [10, 20, 30]) tree.insert(v);
      expect(tree.range(20, 100)).toEqual([20, 30]);
    });

    test("빈 트리에서 range는 빈 배열을 반환한다", () => {
      const tree = new BPlusTree<number>();
      expect(tree.range(0, 100)).toEqual([]);
    });

    test("전체 범위 질의는 inOrder와 동일하다", () => {
      const tree = new BPlusTree<number>();
      for (let i = 1; i <= 20; i++) tree.insert(i);
      expect(tree.range(1, 20)).toEqual(tree.inOrder());
    });

    test("range는 경계값 포함(inclusive)으로 반환한다", () => {
      const tree = new BPlusTree<number>();
      for (const v of [1, 2, 3, 4, 5]) tree.insert(v);
      expect(tree.range(2, 4)).toEqual([2, 3, 4]);
    });

    test("대규모 범위 질의가 올바르다", () => {
      const tree = new BPlusTree<number>(3);
      const n = 1000;
      for (let i = 0; i < n; i++) tree.insert(i);
      const result = tree.range(200, 300);
      expect(result.length).toBe(101);
      expect(result[0]).toBe(200);
      expect(result[result.length - 1]).toBe(300);
    });
  });

  describe("size", () => {
    test("빈 트리의 size는 0이다", () => {
      const tree = new BPlusTree<number>();
      expect(tree.size()).toBe(0);
    });

    test("insert 후 size가 증가한다", () => {
      const tree = new BPlusTree<number>();
      tree.insert(1);
      tree.insert(2);
      tree.insert(3);
      expect(tree.size()).toBe(3);
    });

    test("n개 삽입 후 size는 n이다", () => {
      const tree = new BPlusTree<number>();
      for (let i = 0; i < 100; i++) tree.insert(i);
      expect(tree.size()).toBe(100);
    });
  });

  describe("delete", () => {
    test("존재하는 값 삭제 시 true를 반환한다", () => {
      const tree = new BPlusTree<number>();
      tree.insert(10);
      expect(tree.delete(10)).toBe(true);
    });

    test("존재하지 않는 값 삭제 시 false를 반환한다", () => {
      const tree = new BPlusTree<number>();
      tree.insert(10);
      expect(tree.delete(99)).toBe(false);
    });

    test("삭제 후 has는 false를 반환한다", () => {
      const tree = new BPlusTree<number>();
      tree.insert(10);
      tree.delete(10);
      expect(tree.has(10)).toBe(false);
    });

    test("삭제 후 size가 감소한다", () => {
      const tree = new BPlusTree<number>();
      for (const v of [1, 2, 3, 4, 5]) tree.insert(v);
      tree.delete(3);
      expect(tree.size()).toBe(4);
    });

    test("삭제 후 inOrder가 올바르다", () => {
      const tree = new BPlusTree<number>();
      for (const v of [10, 20, 5, 6, 12, 30, 7, 17]) tree.insert(v);
      tree.delete(6);
      tree.delete(12);
      expect(tree.inOrder()).toEqual([5, 7, 10, 17, 20, 30]);
    });

    test("삭제 후 range 질의가 올바르다", () => {
      const tree = new BPlusTree<number>();
      for (let i = 1; i <= 20; i++) tree.insert(i);
      tree.delete(5);
      tree.delete(10);
      tree.delete(15);
      const result = tree.range(4, 16);
      expect(result).toEqual([4, 6, 7, 8, 9, 11, 12, 13, 14, 16]);
    });

    test("모든 원소 삭제 후 트리는 비어있다", () => {
      const tree = new BPlusTree<number>();
      const values = [10, 5, 15, 3, 7, 12, 20];
      for (const v of values) tree.insert(v);
      for (const v of values) tree.delete(v);
      expect(tree.size()).toBe(0);
      expect(tree.inOrder()).toEqual([]);
    });

    test("삭제 후 리프 연결 리스트가 올바르게 유지된다", () => {
      const tree = new BPlusTree<number>(2);
      for (const v of [1, 2, 3, 4, 5, 6, 7]) tree.insert(v);
      tree.delete(4);
      expect(tree.has(1)).toBe(true);
      expect(tree.has(7)).toBe(true);
      expect(tree.inOrder()).toEqual([1, 2, 3, 5, 6, 7]);
    });
  });

  describe("엣지", () => {
    test("중복 삽입 시 size가 1만 증가한다", () => {
      const tree = new BPlusTree<number>();
      tree.insert(5);
      tree.insert(5);
      expect(tree.size()).toBe(1);
    });

    test("중복 삽입 후 inOrder에는 한 번만 나타난다", () => {
      const tree = new BPlusTree<number>();
      tree.insert(3);
      tree.insert(1);
      tree.insert(3);
      expect(tree.inOrder()).toEqual([1, 3]);
    });

    test("빈 트리에서 delete는 false를 반환한다", () => {
      const tree = new BPlusTree<number>();
      expect(tree.delete(1)).toBe(false);
    });

    test("단일 원소 트리에서 range는 해당 값만 반환한다", () => {
      const tree = new BPlusTree<number>();
      tree.insert(5);
      expect(tree.range(5, 5)).toEqual([5]);
      expect(tree.range(0, 10)).toEqual([5]);
      expect(tree.range(6, 10)).toEqual([]);
    });
  });

  describe("성능", () => {
    test("n=10^4 insert + has가 1초 이내에 완료된다", () => {
      const tree = new BPlusTree<number>(10);
      const n = 10_000;
      const start = Date.now();
      for (let i = 0; i < n; i++) tree.insert(i);
      for (let i = 0; i < n; i++) expect(tree.has(i)).toBe(true);
      expect(Date.now() - start).toBeLessThan(1000);
    });

    test("n=10^4 range 질의가 100ms 이내에 완료된다", () => {
      const tree = new BPlusTree<number>(10);
      const n = 10_000;
      for (let i = 0; i < n; i++) tree.insert(i);
      const start = Date.now();
      const result = tree.range(0, n - 1);
      expect(Date.now() - start).toBeLessThan(100);
      expect(result.length).toBe(n);
    });
  });
});
