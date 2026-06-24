import { test, expect, describe } from "bun:test";
import { MinHeap } from "./minHeap";

describe("MinHeap", () => {
  describe("기본 — 숫자 최소 힙", () => {
    const cmp = (a: number, b: number) => a - b;

    test("push 후 pop은 오름차순으로 반환한다", () => {
      const h = new MinHeap<number>(cmp);
      h.push(5);
      h.push(1);
      h.push(3);
      expect(h.pop()).toBe(1);
      expect(h.pop()).toBe(3);
      expect(h.pop()).toBe(5);
    });

    test("peek은 최솟값을 제거 없이 반환한다", () => {
      const h = new MinHeap<number>(cmp);
      h.push(10);
      h.push(2);
      h.push(7);
      expect(h.peek()).toBe(2);
      expect(h.size()).toBe(3);
    });

    test("size는 현재 원소 개수를 반환한다", () => {
      const h = new MinHeap<number>(cmp);
      expect(h.size()).toBe(0);
      h.push(1);
      h.push(2);
      expect(h.size()).toBe(2);
      h.pop();
      expect(h.size()).toBe(1);
    });
  });

  describe("기본 — 커스텀 비교 (최대 힙)", () => {
    test("비교 함수를 반전하면 최댓값부터 반환한다", () => {
      const h = new MinHeap<number>((a, b) => b - a);
      h.push(3);
      h.push(1);
      h.push(5);
      expect(h.pop()).toBe(5);
      expect(h.pop()).toBe(3);
      expect(h.pop()).toBe(1);
    });
  });

  describe("기본 — 객체 힙", () => {
    test("객체의 특정 필드 기준으로 정렬된다", () => {
      const h = new MinHeap<{ priority: number; name: string }>(
        (a, b) => a.priority - b.priority
      );
      h.push({ priority: 3, name: "C" });
      h.push({ priority: 1, name: "A" });
      h.push({ priority: 2, name: "B" });
      expect(h.pop()?.name).toBe("A");
      expect(h.pop()?.name).toBe("B");
      expect(h.pop()?.name).toBe("C");
    });
  });

  describe("엣지", () => {
    test("빈 힙에서 pop은 undefined를 반환한다", () => {
      const h = new MinHeap<number>((a, b) => a - b);
      expect(h.pop()).toBeUndefined();
    });

    test("빈 힙에서 peek은 undefined를 반환한다", () => {
      const h = new MinHeap<number>((a, b) => a - b);
      expect(h.peek()).toBeUndefined();
    });

    test("isEmpty는 상태에 따라 정확히 동작한다", () => {
      const h = new MinHeap<number>((a, b) => a - b);
      expect(h.isEmpty()).toBe(true);
      h.push(1);
      expect(h.isEmpty()).toBe(false);
      h.pop();
      expect(h.isEmpty()).toBe(true);
    });

    test("중복 값 처리", () => {
      const h = new MinHeap<number>((a, b) => a - b);
      h.push(3);
      h.push(3);
      h.push(3);
      expect(h.pop()).toBe(3);
      expect(h.pop()).toBe(3);
      expect(h.size()).toBe(1);
    });
  });

  describe("바운더리", () => {
    test("단일 원소 push/pop", () => {
      const h = new MinHeap<number>((a, b) => a - b);
      h.push(100);
      expect(h.peek()).toBe(100);
      expect(h.pop()).toBe(100);
      expect(h.isEmpty()).toBe(true);
    });
  });

  describe("성능", () => {
    test("10^5 push/pop을 100ms 이내에 처리한다", () => {
      const h = new MinHeap<number>((a, b) => a - b);
      const N = 100_000;
      const start = performance.now();
      for (let i = N; i > 0; i--) h.push(i);
      let prev = -Infinity;
      for (let i = 0; i < N; i++) {
        const val = h.pop()!;
        expect(val).toBeGreaterThanOrEqual(prev);
        prev = val;
      }
      expect(performance.now() - start).toBeLessThan(100);
    });
  });
});
