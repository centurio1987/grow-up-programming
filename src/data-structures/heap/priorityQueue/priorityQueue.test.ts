import { test, expect, describe } from "bun:test";
import { PriorityQueue } from "./priorityQueue";

// 숫자 최솟값 우선 비교 함수
const minCompare = (a: number, b: number) => a - b;
// 숫자 최댓값 우선 비교 함수
const maxCompare = (a: number, b: number) => b - a;

describe("PriorityQueue", () => {
  describe("기본 — 최솟값 우선 (MinHeap)", () => {
    test("enqueue 후 dequeue는 최솟값부터 반환", () => {
      const pq = new PriorityQueue<number>(minCompare);
      pq.enqueue(5);
      pq.enqueue(1);
      pq.enqueue(3);
      expect(pq.dequeue()).toBe(1);
      expect(pq.dequeue()).toBe(3);
      expect(pq.dequeue()).toBe(5);
    });

    test("peek은 최솟값을 반환하되 제거하지 않음", () => {
      const pq = new PriorityQueue<number>(minCompare);
      pq.enqueue(10);
      pq.enqueue(2);
      pq.enqueue(7);
      expect(pq.peek()).toBe(2);
      expect(pq.size()).toBe(3); // peek 후 크기 변화 없음
      expect(pq.peek()).toBe(2); // 반복 호출도 동일
    });

    test("size와 isEmpty 정확성", () => {
      const pq = new PriorityQueue<number>(minCompare);
      expect(pq.isEmpty()).toBe(true);
      expect(pq.size()).toBe(0);
      pq.enqueue(1);
      expect(pq.isEmpty()).toBe(false);
      expect(pq.size()).toBe(1);
      pq.enqueue(2);
      expect(pq.size()).toBe(2);
      pq.dequeue();
      expect(pq.size()).toBe(1);
      pq.dequeue();
      expect(pq.isEmpty()).toBe(true);
    });

    test("정렬된 순서로 enqueue해도 정렬 결과 동일", () => {
      const pq = new PriorityQueue<number>(minCompare);
      [1, 2, 3, 4, 5].forEach((n) => pq.enqueue(n));
      const result: number[] = [];
      while (!pq.isEmpty()) {
        const val = pq.dequeue();
        if (val !== undefined) result.push(val);
      }
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    test("역순으로 enqueue해도 정렬 결과 동일", () => {
      const pq = new PriorityQueue<number>(minCompare);
      [5, 4, 3, 2, 1].forEach((n) => pq.enqueue(n));
      const result: number[] = [];
      while (!pq.isEmpty()) {
        const val = pq.dequeue();
        if (val !== undefined) result.push(val);
      }
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("기본 — 최댓값 우선 (MaxHeap 모드)", () => {
    test("최댓값 우선으로 dequeue", () => {
      const pq = new PriorityQueue<number>(maxCompare);
      pq.enqueue(3);
      pq.enqueue(9);
      pq.enqueue(1);
      pq.enqueue(7);
      expect(pq.dequeue()).toBe(9);
      expect(pq.dequeue()).toBe(7);
      expect(pq.dequeue()).toBe(3);
      expect(pq.dequeue()).toBe(1);
    });
  });

  describe("기본 — 객체 타입 우선순위", () => {
    type Task = { name: string; priority: number };
    const taskCompare = (a: Task, b: Task) => a.priority - b.priority;

    test("태스크 스케줄러: 낮은 priority 숫자 = 높은 우선순위", () => {
      const pq = new PriorityQueue<Task>(taskCompare);
      pq.enqueue({ name: "low", priority: 10 });
      pq.enqueue({ name: "high", priority: 1 });
      pq.enqueue({ name: "mid", priority: 5 });

      expect(pq.dequeue()?.name).toBe("high");
      expect(pq.dequeue()?.name).toBe("mid");
      expect(pq.dequeue()?.name).toBe("low");
    });

    test("다익스트라 노드: 거리 기준 최솟값 우선", () => {
      type Node = { id: number; dist: number };
      const pq = new PriorityQueue<Node>((a, b) => a.dist - b.dist);

      pq.enqueue({ id: 3, dist: 10 });
      pq.enqueue({ id: 1, dist: 2 });
      pq.enqueue({ id: 2, dist: 5 });
      pq.enqueue({ id: 4, dist: 1 });

      expect(pq.dequeue()?.id).toBe(4); // dist=1
      expect(pq.dequeue()?.id).toBe(1); // dist=2
      expect(pq.dequeue()?.id).toBe(2); // dist=5
      expect(pq.dequeue()?.id).toBe(3); // dist=10
    });
  });

  describe("엣지 케이스", () => {
    test("빈 큐에서 dequeue하면 undefined", () => {
      const pq = new PriorityQueue<number>(minCompare);
      expect(pq.dequeue()).toBeUndefined();
    });

    test("빈 큐에서 peek하면 undefined", () => {
      const pq = new PriorityQueue<number>(minCompare);
      expect(pq.peek()).toBeUndefined();
    });

    test("단일 원소 enqueue/dequeue", () => {
      const pq = new PriorityQueue<number>(minCompare);
      pq.enqueue(42);
      expect(pq.peek()).toBe(42);
      expect(pq.dequeue()).toBe(42);
      expect(pq.isEmpty()).toBe(true);
    });

    test("같은 우선순위 원소 여러 개 처리", () => {
      const pq = new PriorityQueue<number>(minCompare);
      pq.enqueue(3);
      pq.enqueue(3);
      pq.enqueue(3);
      expect(pq.size()).toBe(3);
      expect(pq.dequeue()).toBe(3);
      expect(pq.dequeue()).toBe(3);
      expect(pq.dequeue()).toBe(3);
      expect(pq.isEmpty()).toBe(true);
    });

    test("dequeue 후 re-enqueue", () => {
      const pq = new PriorityQueue<number>(minCompare);
      pq.enqueue(5);
      pq.enqueue(2);
      pq.dequeue(); // 2 제거
      pq.enqueue(1); // 새로 1 삽입
      expect(pq.peek()).toBe(1);
    });

    test("음수 값 포함 최솟값 우선", () => {
      const pq = new PriorityQueue<number>(minCompare);
      [-5, 3, -10, 0, 7].forEach((n) => pq.enqueue(n));
      expect(pq.dequeue()).toBe(-10);
      expect(pq.dequeue()).toBe(-5);
    });
  });

  describe("바운더리", () => {
    test("enqueue/dequeue 교차 연산", () => {
      const pq = new PriorityQueue<number>(minCompare);
      pq.enqueue(10);
      pq.enqueue(5);
      expect(pq.dequeue()).toBe(5); // 5 제거
      pq.enqueue(3);
      expect(pq.dequeue()).toBe(3); // 3 제거
      pq.enqueue(8);
      pq.enqueue(1);
      expect(pq.dequeue()).toBe(1); // 1 제거
      expect(pq.dequeue()).toBe(8); // 8 제거
      expect(pq.dequeue()).toBe(10); // 10 제거
      expect(pq.isEmpty()).toBe(true);
    });

    test("string 타입: 알파벳 사전순 우선", () => {
      const pq = new PriorityQueue<string>((a, b) => a.localeCompare(b));
      pq.enqueue("banana");
      pq.enqueue("apple");
      pq.enqueue("cherry");
      expect(pq.dequeue()).toBe("apple");
      expect(pq.dequeue()).toBe("banana");
      expect(pq.dequeue()).toBe("cherry");
    });
  });

  describe("성능", () => {
    test("10^5번 enqueue/dequeue 100ms 이내", () => {
      const pq = new PriorityQueue<number>(minCompare);
      const n = 100_000;
      const start = performance.now();
      for (let i = n; i >= 1; i--) {
        pq.enqueue(i);
      }
      const results: number[] = [];
      while (!pq.isEmpty()) {
        const val = pq.dequeue();
        if (val !== undefined) results.push(val);
      }
      const elapsed = performance.now() - start;
      // 결과가 정렬되어야 함
      expect(results[0]).toBe(1);
      expect(results[n - 1]).toBe(n);
      expect(elapsed).toBeLessThan(100);
    });

    test("10^5 원소 중 최솟값 peek이 항상 정확", () => {
      const pq = new PriorityQueue<number>(minCompare);
      const values = Array.from({ length: 1000 }, () =>
        Math.floor(Math.random() * 10_000)
      );
      let minSoFar = Infinity;
      values.forEach((v) => {
        pq.enqueue(v);
        minSoFar = Math.min(minSoFar, v);
        expect(pq.peek()).toBe(minSoFar);
      });
    });
  });
});
