import { test, expect, describe } from "bun:test";
import { PairingHeap } from "./pairingHeap";

describe("PairingHeap", () => {
  const cmp = (a: number, b: number) => a - b;

  describe("기본", () => {
    test("insert 후 extractMin은 최솟값을 반환한다", () => {
      const heap = new PairingHeap(cmp);
      heap.insert(3);
      heap.insert(1);
      heap.insert(2);
      expect(heap.extractMin()).toBe(1);
    });

    test("여러 값 삽입 후 오름차순으로 추출된다", () => {
      const heap = new PairingHeap(cmp);
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
      const heap = new PairingHeap(cmp);
      heap.insert(10);
      heap.insert(5);
      heap.insert(15);
      expect(heap.peek()).toBe(5);
      expect(heap.size()).toBe(3);
    });

    test("size는 삽입/삭제에 따라 정확히 갱신된다", () => {
      const heap = new PairingHeap(cmp);
      expect(heap.size()).toBe(0);
      heap.insert(1);
      heap.insert(2);
      heap.insert(3);
      expect(heap.size()).toBe(3);
      heap.extractMin();
      expect(heap.size()).toBe(2);
      heap.extractMin();
      expect(heap.size()).toBe(1);
    });

    test("isEmpty는 빈 힙에서 true, 원소 추가 후 false", () => {
      const heap = new PairingHeap(cmp);
      expect(heap.isEmpty()).toBe(true);
      heap.insert(1);
      expect(heap.isEmpty()).toBe(false);
    });

    test("단일 원소 힙에서 extractMin 후 isEmpty는 true", () => {
      const heap = new PairingHeap(cmp);
      heap.insert(42);
      heap.extractMin();
      expect(heap.isEmpty()).toBe(true);
    });

    test("중복 값 삽입 시 모두 추출된다", () => {
      const heap = new PairingHeap(cmp);
      heap.insert(5);
      heap.insert(5);
      heap.insert(5);
      expect(heap.size()).toBe(3);
      expect(heap.extractMin()).toBe(5);
      expect(heap.extractMin()).toBe(5);
      expect(heap.extractMin()).toBe(5);
      expect(heap.isEmpty()).toBe(true);
    });

    test("문자열 비교자로 동작한다", () => {
      const strHeap = new PairingHeap<string>((a, b) => a.localeCompare(b));
      strHeap.insert("cherry");
      strHeap.insert("apple");
      strHeap.insert("banana");
      expect(strHeap.extractMin()).toBe("apple");
    });

    test("대량 삽입 후 오름차순 추출이 정확하다", () => {
      const heap = new PairingHeap(cmp);
      const n = 100;
      for (let i = n; i >= 1; i--) heap.insert(i);
      for (let i = 1; i <= n; i++) {
        expect(heap.extractMin()).toBe(i);
      }
      expect(heap.isEmpty()).toBe(true);
    });
  });

  describe("병합", () => {
    test("두 힙을 merge한 결과가 올바른 순서로 추출된다", () => {
      const h1 = new PairingHeap(cmp);
      const h2 = new PairingHeap(cmp);
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
      const h1 = new PairingHeap(cmp);
      const h2 = new PairingHeap(cmp);
      [5, 2, 9].forEach((v) => h1.insert(v));
      const merged = h1.merge(h2);
      expect(merged.size()).toBe(3);
      expect(merged.extractMin()).toBe(2);
    });

    test("두 빈 힙의 merge 결과는 빈 힙이다", () => {
      const h1 = new PairingHeap(cmp);
      const h2 = new PairingHeap(cmp);
      const merged = h1.merge(h2);
      expect(merged.isEmpty()).toBe(true);
    });

    test("merge 후 size가 합산된다", () => {
      const h1 = new PairingHeap(cmp);
      const h2 = new PairingHeap(cmp);
      for (let i = 0; i < 50; i++) h1.insert(i);
      for (let i = 50; i < 100; i++) h2.insert(i);
      const merged = h1.merge(h2);
      expect(merged.size()).toBe(100);
    });

    test("merge는 O(1): 두 힙 연결만 한다", () => {
      const h1 = new PairingHeap(cmp);
      const h2 = new PairingHeap(cmp);
      for (let i = 0; i < 1000; i++) h1.insert(i);
      for (let i = 1000; i < 2000; i++) h2.insert(i);
      const start = Date.now();
      const merged = h1.merge(h2);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5); // O(1)이므로 거의 즉시
      expect(merged.extractMin()).toBe(0);
    });

    test("연쇄 merge가 올바르다", () => {
      const h1 = new PairingHeap(cmp);
      const h2 = new PairingHeap(cmp);
      const h3 = new PairingHeap(cmp);
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
      const heap = new PairingHeap(cmp);
      expect(heap.extractMin()).toBeUndefined();
    });

    test("빈 힙에서 peek은 undefined를 반환한다", () => {
      const heap = new PairingHeap(cmp);
      expect(heap.peek()).toBeUndefined();
    });

    test("음수 포함 삽입 시 올바르게 추출된다", () => {
      const heap = new PairingHeap(cmp);
      [-5, 0, 3, -1, 7].forEach((v) => heap.insert(v));
      expect(heap.extractMin()).toBe(-5);
      expect(heap.extractMin()).toBe(-1);
      expect(heap.extractMin()).toBe(0);
    });

    test("정렬된 순서로 삽입해도 올바르다", () => {
      const heap = new PairingHeap(cmp);
      [1, 2, 3, 4, 5].forEach((v) => heap.insert(v));
      expect(heap.extractMin()).toBe(1);
    });

    test("역순으로 삽입해도 올바르다", () => {
      const heap = new PairingHeap(cmp);
      [5, 4, 3, 2, 1].forEach((v) => heap.insert(v));
      expect(heap.extractMin()).toBe(1);
    });

    test("교대 insert/extract가 올바른 순서를 유지한다", () => {
      const heap = new PairingHeap(cmp);
      heap.insert(10);
      heap.insert(5);
      expect(heap.extractMin()).toBe(5);
      heap.insert(3);
      expect(heap.extractMin()).toBe(3);
      heap.insert(20);
      heap.insert(1);
      expect(heap.extractMin()).toBe(1);
    });
  });

  describe("성능", () => {
    test("10^4 insert/extract 100ms 이내", () => {
      const heap = new PairingHeap(cmp);
      const n = 10_000;
      const start = Date.now();
      for (let i = n; i > 0; i--) heap.insert(i);
      for (let i = 0; i < n; i++) heap.extractMin();
      const elapsed = Date.now() - start;
      expect(heap.isEmpty()).toBe(true);
      expect(elapsed).toBeLessThan(100);
    });

    test("insert O(1): 10^4 insert가 빠르다", () => {
      const heap = new PairingHeap(cmp);
      const start = Date.now();
      for (let i = 0; i < 10_000; i++) heap.insert(i);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(20);
    });

    test("랜덤 10^4 insert 후 오름차순 추출이 정확하다", () => {
      const heap = new PairingHeap(cmp);
      const arr: number[] = [];
      for (let i = 0; i < 10_000; i++) {
        const v = Math.floor(Math.random() * 1_000_000);
        arr.push(v);
        heap.insert(v);
      }
      arr.sort((a, b) => a - b);
      for (const expected of arr) {
        expect(heap.extractMin()).toBe(expected);
      }
    });
  });
});
