import { test, expect, describe } from "bun:test";
import { Deque } from "./deque";

describe("Deque", () => {
  describe("기본", () => {
    test("pushBack 후 popFront는 FIFO로 반환한다", () => {
      const d = new Deque<number>();
      d.pushBack(1);
      d.pushBack(2);
      d.pushBack(3);
      expect(d.popFront()).toBe(1);
      expect(d.popFront()).toBe(2);
      expect(d.popFront()).toBe(3);
    });

    test("pushFront 후 popFront는 LIFO로 반환한다", () => {
      const d = new Deque<number>();
      d.pushFront(1);
      d.pushFront(2);
      d.pushFront(3);
      expect(d.popFront()).toBe(3);
      expect(d.popFront()).toBe(2);
      expect(d.popFront()).toBe(1);
    });

    test("pushBack 후 popBack은 LIFO로 반환한다", () => {
      const d = new Deque<number>();
      d.pushBack(1);
      d.pushBack(2);
      d.pushBack(3);
      expect(d.popBack()).toBe(3);
      expect(d.popBack()).toBe(2);
      expect(d.popBack()).toBe(1);
    });

    test("혼합 — 앞/뒤 번갈아 삽입 후 순서 검증", () => {
      const d = new Deque<number>();
      d.pushBack(2);
      d.pushFront(1);
      d.pushBack(3);
      // 순서: 1, 2, 3
      expect(d.popFront()).toBe(1);
      expect(d.popFront()).toBe(2);
      expect(d.popFront()).toBe(3);
    });
  });

  describe("엣지", () => {
    test("빈 덱에서 popFront는 undefined를 반환한다", () => {
      const d = new Deque<number>();
      expect(d.popFront()).toBeUndefined();
    });

    test("빈 덱에서 popBack은 undefined를 반환한다", () => {
      const d = new Deque<number>();
      expect(d.popBack()).toBeUndefined();
    });

    test("peekFront / peekBack은 원소를 제거하지 않는다", () => {
      const d = new Deque<number>();
      d.pushBack(10);
      d.pushBack(20);
      expect(d.peekFront()).toBe(10);
      expect(d.peekBack()).toBe(20);
      expect(d.size()).toBe(2);
    });

    test("isEmpty — 삽입/삭제 후 정확히 동작한다", () => {
      const d = new Deque<number>();
      expect(d.isEmpty()).toBe(true);
      d.pushBack(1);
      expect(d.isEmpty()).toBe(false);
      d.popFront();
      expect(d.isEmpty()).toBe(true);
    });
  });

  describe("바운더리", () => {
    test("단일 원소 — pushFront/popBack", () => {
      const d = new Deque<number>();
      d.pushFront(7);
      expect(d.popBack()).toBe(7);
      expect(d.isEmpty()).toBe(true);
    });

    test("peekFront / peekBack이 같은 경우 — 원소 1개", () => {
      const d = new Deque<number>();
      d.pushBack(42);
      expect(d.peekFront()).toBe(42);
      expect(d.peekBack()).toBe(42);
    });
  });

  describe("성능", () => {
    test("10^6 push/pop을 200ms 이내에 처리한다", () => {
      const d = new Deque<number>();
      const N = 1_000_000;
      const start = performance.now();
      for (let i = 0; i < N; i++) {
        if (i % 2 === 0) d.pushBack(i);
        else d.pushFront(i);
      }
      for (let i = 0; i < N; i++) {
        if (i % 2 === 0) d.popFront();
        else d.popBack();
      }
      expect(performance.now() - start).toBeLessThan(200);
      expect(d.isEmpty()).toBe(true);
    });
  });
});
