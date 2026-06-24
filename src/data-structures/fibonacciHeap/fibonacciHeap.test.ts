import { test, expect, describe } from "bun:test";
import { FibonacciHeap, FibNode } from "./fibonacciHeap";

describe("FibonacciHeap", () => {
  const cmp = (a: number, b: number) => a - b;

  describe("기본", () => {
    test("insert 후 extractMin은 최솟값을 반환한다", () => {
      const heap = new FibonacciHeap(cmp);
      heap.insert(3);
      heap.insert(1);
      heap.insert(2);
      expect(heap.extractMin()).toBe(1);
    });

    test("여러 값 삽입 후 오름차순으로 추출된다", () => {
      const heap = new FibonacciHeap(cmp);
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
      const heap = new FibonacciHeap(cmp);
      heap.insert(10);
      heap.insert(5);
      heap.insert(15);
      expect(heap.peek()).toBe(5);
      expect(heap.size()).toBe(3);
    });

    test("insert는 FibNode를 반환한다", () => {
      const heap = new FibonacciHeap(cmp);
      const node = heap.insert(42);
      expect(node).toBeInstanceOf(FibNode);
      expect(node.item).toBe(42);
    });

    test("size는 삽입/삭제에 따라 정확히 갱신된다", () => {
      const heap = new FibonacciHeap(cmp);
      expect(heap.size()).toBe(0);
      heap.insert(1);
      heap.insert(2);
      expect(heap.size()).toBe(2);
      heap.extractMin();
      expect(heap.size()).toBe(1);
    });

    test("isEmpty는 빈 힙에서 true, 원소 추가 후 false", () => {
      const heap = new FibonacciHeap(cmp);
      expect(heap.isEmpty()).toBe(true);
      heap.insert(1);
      expect(heap.isEmpty()).toBe(false);
    });

    test("중복 값 삽입 시 모두 추출된다", () => {
      const heap = new FibonacciHeap(cmp);
      heap.insert(5);
      heap.insert(5);
      heap.insert(5);
      expect(heap.size()).toBe(3);
      expect(heap.extractMin()).toBe(5);
      expect(heap.extractMin()).toBe(5);
      expect(heap.extractMin()).toBe(5);
      expect(heap.isEmpty()).toBe(true);
    });
  });

  describe("decreaseKey", () => {
    test("decreaseKey 후 최솟값이 갱신된다", () => {
      const heap = new FibonacciHeap(cmp);
      heap.insert(10);
      heap.insert(20);
      const node = heap.insert(30);
      heap.decreaseKey(node, 1);
      expect(heap.peek()).toBe(1);
    });

    test("extractMin 후 decreaseKey가 올바른 순서를 유지한다", () => {
      const heap = new FibonacciHeap(cmp);
      heap.insert(5);
      heap.insert(15);
      const node = heap.insert(25);
      heap.insert(10);
      heap.extractMin(); // 5 제거 → 내부 통합 발생
      heap.decreaseKey(node, 3);
      expect(heap.extractMin()).toBe(3);
      expect(heap.extractMin()).toBe(10);
    });

    test("decreaseKey로 최솟값 포인터가 갱신된다", () => {
      const heap = new FibonacciHeap(cmp);
      const n1 = heap.insert(100);
      heap.insert(200);
      heap.insert(300);
      heap.decreaseKey(n1, 50);
      expect(heap.peek()).toBe(50);
    });

    test("cascading cut이 발생해도 올바른 결과를 반환한다", () => {
      const heap = new FibonacciHeap(cmp);
      for (let i = 10; i >= 1; i--) heap.insert(i);
      heap.extractMin(); // consolidate 유발
      const nodes: FibNode<number>[] = [];
      for (let i = 5; i <= 8; i++) {
        const node = heap.insert(i * 10);
        nodes.push(node);
      }
      for (const node of nodes) {
        heap.decreaseKey(node, node.item - 9 * 10);
      }
      const results: number[] = [];
      while (!heap.isEmpty()) {
        const v = heap.extractMin();
        if (v !== undefined) results.push(v);
      }
      // 오름차순인지 확인
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBeGreaterThanOrEqual(results[i - 1]!);
      }
    });
  });

  describe("병합", () => {
    test("두 힙을 merge한 결과가 올바른 순서로 추출된다", () => {
      const h1 = new FibonacciHeap(cmp);
      const h2 = new FibonacciHeap(cmp);
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
      const h1 = new FibonacciHeap(cmp);
      const h2 = new FibonacciHeap(cmp);
      [5, 2, 9].forEach((v) => h1.insert(v));
      const merged = h1.merge(h2);
      expect(merged.size()).toBe(3);
      expect(merged.extractMin()).toBe(2);
    });

    test("두 빈 힙의 merge 결과는 빈 힙이다", () => {
      const h1 = new FibonacciHeap(cmp);
      const h2 = new FibonacciHeap(cmp);
      const merged = h1.merge(h2);
      expect(merged.isEmpty()).toBe(true);
    });
  });

  describe("엣지", () => {
    test("빈 힙에서 extractMin은 undefined를 반환한다", () => {
      const heap = new FibonacciHeap(cmp);
      expect(heap.extractMin()).toBeUndefined();
    });

    test("빈 힙에서 peek은 undefined를 반환한다", () => {
      const heap = new FibonacciHeap(cmp);
      expect(heap.peek()).toBeUndefined();
    });

    test("음수 포함 삽입 시 올바르게 추출된다", () => {
      const heap = new FibonacciHeap(cmp);
      [-5, 0, 3, -1, 7].forEach((v) => heap.insert(v));
      expect(heap.extractMin()).toBe(-5);
      expect(heap.extractMin()).toBe(-1);
    });

    test("정렬된 순서로 삽입해도 올바르다", () => {
      const heap = new FibonacciHeap(cmp);
      [1, 2, 3, 4, 5].forEach((v) => heap.insert(v));
      expect(heap.extractMin()).toBe(1);
    });

    test("역순으로 삽입해도 올바르다", () => {
      const heap = new FibonacciHeap(cmp);
      [5, 4, 3, 2, 1].forEach((v) => heap.insert(v));
      expect(heap.extractMin()).toBe(1);
    });
  });

  describe("성능", () => {
    test("10^4 insert/extract 100ms 이내", () => {
      const heap = new FibonacciHeap(cmp);
      const n = 10_000;
      const start = Date.now();
      for (let i = n; i > 0; i--) heap.insert(i);
      for (let i = 0; i < n; i++) heap.extractMin();
      const elapsed = Date.now() - start;
      expect(heap.isEmpty()).toBe(true);
      expect(elapsed).toBeLessThan(100);
    });

    test("insert O(1) 상각: 10^4 insert가 빠르다", () => {
      const heap = new FibonacciHeap(cmp);
      const n = 10_000;
      const start = Date.now();
      for (let i = 0; i < n; i++) heap.insert(i);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(30);
    });

    test("10^3 decreaseKey 연산이 올바르고 빠르다", () => {
      const heap = new FibonacciHeap(cmp);
      const nodes: FibNode<number>[] = [];
      for (let i = 1000; i > 0; i--) {
        nodes.push(heap.insert(i));
      }
      heap.extractMin(); // consolidate 유발
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        const node = nodes[i];
        if (node !== undefined && node.item > 0) {
          heap.decreaseKey(node, -i);
        }
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(50);
      const first = heap.extractMin();
      expect(first).toBeLessThanOrEqual(0);
    });
  });
});
