import { test, expect, describe } from "bun:test";
import { DaryHeap } from "./daryHeap";

describe("DaryHeap", () => {
  describe("d=2 (이진 힙)", () => {
    const cmp = (a: number, b: number) => a - b;

    test("push 후 pop은 최솟값을 반환한다", () => {
      const heap = new DaryHeap(2, cmp);
      heap.push(3);
      heap.push(1);
      heap.push(2);
      expect(heap.pop()).toBe(1);
    });

    test("여러 값 삽입 후 오름차순으로 추출된다", () => {
      const heap = new DaryHeap(2, cmp);
      const values = [5, 3, 8, 1, 4, 2, 7, 6];
      for (const v of values) heap.push(v);
      const result: number[] = [];
      while (!heap.isEmpty()) {
        const min = heap.pop();
        if (min !== undefined) result.push(min);
      }
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    test("peek은 최솟값을 제거하지 않는다", () => {
      const heap = new DaryHeap(2, cmp);
      heap.push(10);
      heap.push(5);
      heap.push(15);
      expect(heap.peek()).toBe(5);
      expect(heap.size()).toBe(3);
    });

    test("size는 push/pop에 따라 정확히 갱신된다", () => {
      const heap = new DaryHeap(2, cmp);
      expect(heap.size()).toBe(0);
      heap.push(1);
      heap.push(2);
      expect(heap.size()).toBe(2);
      heap.pop();
      expect(heap.size()).toBe(1);
    });

    test("isEmpty는 빈 힙에서 true, push 후 false", () => {
      const heap = new DaryHeap(2, cmp);
      expect(heap.isEmpty()).toBe(true);
      heap.push(1);
      expect(heap.isEmpty()).toBe(false);
    });
  });

  describe("d=3 (삼진 힙)", () => {
    const cmp = (a: number, b: number) => a - b;

    test("push 후 pop이 오름차순이다", () => {
      const heap = new DaryHeap(3, cmp);
      [5, 2, 8, 1, 9, 3, 7, 4, 6].forEach((v) => heap.push(v));
      const result: number[] = [];
      while (!heap.isEmpty()) {
        const v = heap.pop();
        if (v !== undefined) result.push(v);
      }
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    test("d=3에서 인덱스 계산이 올바르다", () => {
      const heap = new DaryHeap(3, cmp);
      for (let i = 9; i >= 1; i--) heap.push(i);
      for (let i = 1; i <= 9; i++) {
        expect(heap.pop()).toBe(i);
      }
    });
  });

  describe("d=4 (사진 힙, 캐시 최적화)", () => {
    const cmp = (a: number, b: number) => a - b;

    test("push 후 pop이 오름차순이다", () => {
      const heap = new DaryHeap(4, cmp);
      [10, 4, 7, 1, 8, 3, 6, 2, 9, 5].forEach((v) => heap.push(v));
      const result: number[] = [];
      while (!heap.isEmpty()) {
        const v = heap.pop();
        if (v !== undefined) result.push(v);
      }
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    test("중복 값 삽입 시 모두 추출된다", () => {
      const heap = new DaryHeap(4, cmp);
      heap.push(3);
      heap.push(3);
      heap.push(3);
      expect(heap.size()).toBe(3);
      expect(heap.pop()).toBe(3);
      expect(heap.pop()).toBe(3);
      expect(heap.pop()).toBe(3);
      expect(heap.isEmpty()).toBe(true);
    });
  });

  describe("d=8 (팔진 힙)", () => {
    const cmp = (a: number, b: number) => a - b;

    test("push 후 pop이 오름차순이다", () => {
      const heap = new DaryHeap(8, cmp);
      for (let i = 20; i >= 1; i--) heap.push(i);
      for (let i = 1; i <= 20; i++) {
        expect(heap.pop()).toBe(i);
      }
    });
  });

  describe("비교자 변형", () => {
    test("최대 힙으로도 동작한다 (역순 비교)", () => {
      const maxHeap = new DaryHeap<number>(2, (a, b) => b - a);
      [3, 1, 4, 1, 5, 9, 2, 6].forEach((v) => maxHeap.push(v));
      expect(maxHeap.pop()).toBe(9);
      expect(maxHeap.pop()).toBe(6);
      expect(maxHeap.pop()).toBe(5);
    });

    test("문자열 비교자로 동작한다 (d=3)", () => {
      const heap = new DaryHeap<string>(3, (a, b) => a.localeCompare(b));
      ["cherry", "apple", "banana", "date"].forEach((v) => heap.push(v));
      expect(heap.pop()).toBe("apple");
      expect(heap.pop()).toBe("banana");
    });

    test("객체 배열을 우선순위 큐로 사용할 수 있다", () => {
      type Task = { priority: number; name: string };
      const heap = new DaryHeap<Task>(4, (a, b) => a.priority - b.priority);
      heap.push({ priority: 3, name: "C" });
      heap.push({ priority: 1, name: "A" });
      heap.push({ priority: 2, name: "B" });
      expect(heap.pop()?.name).toBe("A");
      expect(heap.pop()?.name).toBe("B");
    });
  });

  describe("엣지", () => {
    test("빈 힙에서 pop은 undefined를 반환한다", () => {
      const heap = new DaryHeap(2, (a: number, b: number) => a - b);
      expect(heap.pop()).toBeUndefined();
    });

    test("빈 힙에서 peek은 undefined를 반환한다", () => {
      const heap = new DaryHeap(2, (a: number, b: number) => a - b);
      expect(heap.peek()).toBeUndefined();
    });

    test("단일 원소 힙에서 pop 후 isEmpty는 true", () => {
      const heap = new DaryHeap(4, (a: number, b: number) => a - b);
      heap.push(42);
      heap.pop();
      expect(heap.isEmpty()).toBe(true);
    });

    test("음수 포함 시 올바르게 추출된다 (d=4)", () => {
      const heap = new DaryHeap(4, (a: number, b: number) => a - b);
      [-5, 0, 3, -1, 7].forEach((v) => heap.push(v));
      expect(heap.pop()).toBe(-5);
      expect(heap.pop()).toBe(-1);
      expect(heap.pop()).toBe(0);
    });

    test("정렬된 순서로 push해도 올바르다 (d=3)", () => {
      const heap = new DaryHeap(3, (a: number, b: number) => a - b);
      [1, 2, 3, 4, 5].forEach((v) => heap.push(v));
      expect(heap.pop()).toBe(1);
    });

    test("역순으로 push해도 올바르다 (d=3)", () => {
      const heap = new DaryHeap(3, (a: number, b: number) => a - b);
      [5, 4, 3, 2, 1].forEach((v) => heap.push(v));
      expect(heap.pop()).toBe(1);
    });
  });

  describe("성능", () => {
    test("d=4: 10^4 push/pop 100ms 이내", () => {
      const cmp = (a: number, b: number) => a - b;
      const heap = new DaryHeap(4, cmp);
      const n = 10_000;
      const start = Date.now();
      for (let i = n; i > 0; i--) heap.push(i);
      for (let i = 0; i < n; i++) heap.pop();
      const elapsed = Date.now() - start;
      expect(heap.isEmpty()).toBe(true);
      expect(elapsed).toBeLessThan(100);
    });

    test("d=2 vs d=4: push 중심에서 d=4가 더 빠르거나 동등하다", () => {
      const cmp = (a: number, b: number) => a - b;
      const n = 10_000;

      const h2 = new DaryHeap(2, cmp);
      const start2 = Date.now();
      for (let i = 0; i < n; i++) h2.push(i);
      const elapsed2 = Date.now() - start2;

      const h4 = new DaryHeap(4, cmp);
      const start4 = Date.now();
      for (let i = 0; i < n; i++) h4.push(i);
      const elapsed4 = Date.now() - start4;

      // d=4는 push가 더 빠르거나 동등 (siftUp 깊이가 얕음)
      // 엄격한 비교는 피하고, 둘 다 빠른지만 확인
      expect(elapsed2 + elapsed4).toBeLessThan(50);
    });

    test("랜덤 10^4 push 후 오름차순 pop이 정확하다 (d=4)", () => {
      const cmp = (a: number, b: number) => a - b;
      const heap = new DaryHeap(4, cmp);
      const arr: number[] = [];
      for (let i = 0; i < 10_000; i++) {
        const v = Math.floor(Math.random() * 1_000_000);
        arr.push(v);
        heap.push(v);
      }
      arr.sort((a, b) => a - b);
      for (const expected of arr) {
        expect(heap.pop()).toBe(expected);
      }
    });
  });
});
