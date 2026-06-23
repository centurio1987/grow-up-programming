import { test, expect, describe } from "bun:test";
import { Queue } from "./queue";

describe("Queue", () => {
  describe("기본", () => {
    test("enqueue 후 front는 첫 번째 원소를 반환한다", () => {
      const q = new Queue<number>();
      q.enqueue(1);
      q.enqueue(2);
      expect(q.front()).toBe(1);
    });

    test("dequeue는 FIFO 순서로 반환한다", () => {
      const q = new Queue<number>();
      q.enqueue(1);
      q.enqueue(2);
      q.enqueue(3);
      expect(q.dequeue()).toBe(1);
      expect(q.dequeue()).toBe(2);
      expect(q.dequeue()).toBe(3);
    });

    test("size는 현재 원소 개수를 반환한다", () => {
      const q = new Queue<string>();
      expect(q.size()).toBe(0);
      q.enqueue("a");
      q.enqueue("b");
      expect(q.size()).toBe(2);
      q.dequeue();
      expect(q.size()).toBe(1);
    });
  });

  describe("엣지", () => {
    test("빈 큐에서 dequeue는 undefined를 반환한다", () => {
      const q = new Queue<number>();
      expect(q.dequeue()).toBeUndefined();
    });

    test("빈 큐에서 front는 undefined를 반환한다", () => {
      const q = new Queue<number>();
      expect(q.front()).toBeUndefined();
    });

    test("isEmpty — enqueue/dequeue 후 정확히 동작한다", () => {
      const q = new Queue<number>();
      expect(q.isEmpty()).toBe(true);
      q.enqueue(1);
      expect(q.isEmpty()).toBe(false);
      q.dequeue();
      expect(q.isEmpty()).toBe(true);
    });

    test("모든 원소를 dequeue한 뒤 다시 enqueue 가능하다", () => {
      const q = new Queue<number>();
      q.enqueue(1);
      q.dequeue();
      q.enqueue(2);
      expect(q.front()).toBe(2);
      expect(q.size()).toBe(1);
    });
  });

  describe("바운더리", () => {
    test("단일 원소 enqueue/dequeue", () => {
      const q = new Queue<number>();
      q.enqueue(99);
      expect(q.size()).toBe(1);
      expect(q.dequeue()).toBe(99);
      expect(q.isEmpty()).toBe(true);
    });

    test("제네릭 타입 — 객체 큐", () => {
      const q = new Queue<{ id: number }>();
      q.enqueue({ id: 1 });
      q.enqueue({ id: 2 });
      expect(q.dequeue()?.id).toBe(1);
    });
  });

  describe("성능", () => {
    test("10^6 enqueue/dequeue를 200ms 이내에 처리한다", () => {
      const q = new Queue<number>();
      const N = 1_000_000;
      const start = performance.now();
      for (let i = 0; i < N; i++) q.enqueue(i);
      for (let i = 0; i < N; i++) q.dequeue();
      expect(performance.now() - start).toBeLessThan(200);
      expect(q.isEmpty()).toBe(true);
    });
  });
});
