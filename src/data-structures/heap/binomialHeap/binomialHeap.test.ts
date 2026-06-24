import { test, expect, describe } from "bun:test";
import { BinomialHeap } from "./binomialHeap";

describe("BinomialHeap", () => {
  const cmp = (a: number, b: number) => a - b;

  describe("기본", () => {
    test("insert 후 extractMin은 최솟값을 반환한다", () => {
      const heap = new BinomialHeap(cmp);
      heap.insert(3);
      heap.insert(1);
      heap.insert(2);
      expect(heap.extractMin()).toBe(1);
    });

    test("여러 값 삽입 후 오름차순으로 추출된다", () => {
      const heap = new BinomialHeap(cmp);
      const values = [5, 3, 8, 1, 4, 2, 7, 6];
      for (const v of values) heap.insert(v);
      const result: number[] = [];
      while (!heap.isEmpty()) {
        const min = heap.extractMin();
        if (min !== undefined) result.push(min);
      }
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    test("peek은 최솟값을 제거하지 않는다", () => {
      const heap = new BinomialHeap(cmp);
      heap.insert(10);
      heap.insert(5);
      heap.insert(15);
      expect(heap.peek()).toBe(5);
      expect(heap.size()).toBe(3);
    });

    test("size는 삽입/삭제에 따라 정확히 갱신된다", () => {
      const heap = new BinomialHeap(cmp);
      expect(heap.size()).toBe(0);
      heap.insert(1);
      heap.insert(2);
      expect(heap.size()).toBe(2);
      heap.extractMin();
      expect(heap.size()).toBe(1);
    });

    test("isEmpty는 빈 힙에서 true, 원소 추가 후 false", () => {
      const heap = new BinomialHeap(cmp);
      expect(heap.isEmpty()).toBe(true);
      heap.insert(42);
      expect(heap.isEmpty()).toBe(false);
    });

    test("단일 원소 힙에서 extractMin 후 isEmpty는 true", () => {
      const heap = new BinomialHeap(cmp);
      heap.insert(99);
      heap.extractMin();
      expect(heap.isEmpty()).toBe(true);
    });

    test("문자열 비교자로 동작한다", () => {
      const strHeap = new BinomialHeap<string>((a, b) => a.localeCompare(b));
      strHeap.insert("banana");
      strHeap.insert("apple");
      strHeap.insert("cherry");
      expect(strHeap.extractMin()).toBe("apple");
    });

    test("중복 값 삽입 시 모두 추출된다", () => {
      const heap = new BinomialHeap(cmp);
      heap.insert(3);
      heap.insert(3);
      heap.insert(3);
      expect(heap.size()).toBe(3);
      expect(heap.extractMin()).toBe(3);
      expect(heap.extractMin()).toBe(3);
      expect(heap.extractMin()).toBe(3);
      expect(heap.isEmpty()).toBe(true);
    });
  });

  describe("병합", () => {
    test("두 힙을 merge한 결과가 올바른 순서로 추출된다", () => {
      const h1 = new BinomialHeap(cmp);
      const h2 = new BinomialHeap(cmp);
      [3, 7, 1].forEach((v) => h1.insert(v));
      [6, 2, 8].forEach((v) => h2.insert(v));
      const merged = h1.merge(h2);
      const result: number[] = [];
      while (!merged.isEmpty()) {
        const min = merged.extractMin();
        if (min !== undefined) result.push(min);
      }
      expect(result).toEqual([1, 2, 3, 6, 7, 8]);
    });

    test("빈 힙과 merge하면 원래 힙과 동일한 결과", () => {
      const h1 = new BinomialHeap(cmp);
      const h2 = new BinomialHeap(cmp);
      [5, 2, 9].forEach((v) => h1.insert(v));
      const merged = h1.merge(h2);
      expect(merged.size()).toBe(3);
      expect(merged.extractMin()).toBe(2);
    });

    test("두 빈 힙의 merge 결과는 빈 힙이다", () => {
      const h1 = new BinomialHeap(cmp);
      const h2 = new BinomialHeap(cmp);
      const merged = h1.merge(h2);
      expect(merged.isEmpty()).toBe(true);
      expect(merged.size()).toBe(0);
    });

    test("merge 후 원본 힙 상태는 독립적이다", () => {
      const h1 = new BinomialHeap(cmp);
      const h2 = new BinomialHeap(cmp);
      [1, 3].forEach((v) => h1.insert(v));
      [2, 4].forEach((v) => h2.insert(v));
      const merged = h1.merge(h2);
      expect(merged.size()).toBe(4);
    });

    test("여러 번 merge를 연쇄 적용할 수 있다", () => {
      const h1 = new BinomialHeap(cmp);
      const h2 = new BinomialHeap(cmp);
      const h3 = new BinomialHeap(cmp);
      [9, 6].forEach((v) => h1.insert(v));
      [5, 3].forEach((v) => h2.insert(v));
      [1, 7].forEach((v) => h3.insert(v));
      const merged = h1.merge(h2).merge(h3);
      expect(merged.extractMin()).toBe(1);
      expect(merged.size()).toBe(5);
    });
  });

  describe("엣지", () => {
    test("빈 힙에서 extractMin은 undefined를 반환한다", () => {
      const heap = new BinomialHeap(cmp);
      expect(heap.extractMin()).toBeUndefined();
    });

    test("빈 힙에서 peek은 undefined를 반환한다", () => {
      const heap = new BinomialHeap(cmp);
      expect(heap.peek()).toBeUndefined();
    });

    test("단 하나의 원소만 있을 때 peek이 올바르다", () => {
      const heap = new BinomialHeap(cmp);
      heap.insert(42);
      expect(heap.peek()).toBe(42);
    });

    test("음수 포함 삽입 시 올바르게 추출된다", () => {
      const heap = new BinomialHeap(cmp);
      [-5, 0, 3, -1, 7].forEach((v) => heap.insert(v));
      expect(heap.extractMin()).toBe(-5);
      expect(heap.extractMin()).toBe(-1);
      expect(heap.extractMin()).toBe(0);
    });

    test("정렬된 순서로 삽입해도 올바르다", () => {
      const heap = new BinomialHeap(cmp);
      [1, 2, 3, 4, 5].forEach((v) => heap.insert(v));
      expect(heap.extractMin()).toBe(1);
    });

    test("역순으로 삽입해도 올바르다", () => {
      const heap = new BinomialHeap(cmp);
      [5, 4, 3, 2, 1].forEach((v) => heap.insert(v));
      expect(heap.extractMin()).toBe(1);
    });
  });

  describe("성능", () => {
    test("10^4 insert/extract 100ms 이내", () => {
      const heap = new BinomialHeap(cmp);
      const n = 10_000;
      const start = Date.now();
      for (let i = n; i > 0; i--) heap.insert(i);
      for (let i = 0; i < n; i++) heap.extractMin();
      const elapsed = Date.now() - start;
      expect(heap.isEmpty()).toBe(true);
      expect(elapsed).toBeLessThan(100);
    });

    test("교대로 insert/extractMin 10^4회가 올바르다", () => {
      const heap = new BinomialHeap(cmp);
      let last = -Infinity;
      for (let i = 0; i < 5_000; i++) {
        heap.insert(Math.floor(Math.random() * 100_000));
      }
      for (let i = 0; i < 5_000; i++) {
        heap.insert(Math.floor(Math.random() * 100_000));
        const min = heap.extractMin();
        if (min !== undefined) {
          expect(min).toBeGreaterThanOrEqual(last);
          last = min;
        }
      }
    });
  });
});
