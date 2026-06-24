import { test, expect, describe } from "bun:test";
import { MaxHeap } from "./maxHeap";

// 숫자 최댓값 우선 비교 함수 (a > b이면 양수)
const numCompare = (a: number, b: number) => a - b;

describe("MaxHeap", () => {
  describe("기본 — 숫자 최댓값 우선", () => {
    test("push 후 pop은 최댓값부터 반환", () => {
      const heap = new MaxHeap<number>(numCompare);
      heap.push(3);
      heap.push(9);
      heap.push(1);
      heap.push(7);
      heap.push(5);
      expect(heap.pop()).toBe(9);
      expect(heap.pop()).toBe(7);
      expect(heap.pop()).toBe(5);
      expect(heap.pop()).toBe(3);
      expect(heap.pop()).toBe(1);
    });

    test("peek은 최댓값을 반환하되 제거하지 않음", () => {
      const heap = new MaxHeap<number>(numCompare);
      heap.push(4);
      heap.push(10);
      heap.push(7);
      expect(heap.peek()).toBe(10);
      expect(heap.size()).toBe(3); // peek 후 크기 변화 없음
      expect(heap.peek()).toBe(10);
    });

    test("size와 isEmpty 정확성", () => {
      const heap = new MaxHeap<number>(numCompare);
      expect(heap.isEmpty()).toBe(true);
      expect(heap.size()).toBe(0);
      heap.push(1);
      expect(heap.isEmpty()).toBe(false);
      expect(heap.size()).toBe(1);
      heap.push(2);
      expect(heap.size()).toBe(2);
      heap.pop();
      expect(heap.size()).toBe(1);
      heap.pop();
      expect(heap.isEmpty()).toBe(true);
    });

    test("정렬된 순서로 push해도 내림차순 pop", () => {
      const heap = new MaxHeap<number>(numCompare);
      [1, 2, 3, 4, 5].forEach((n) => heap.push(n));
      const result: number[] = [];
      while (!heap.isEmpty()) {
        const val = heap.pop();
        if (val !== undefined) result.push(val);
      }
      expect(result).toEqual([5, 4, 3, 2, 1]);
    });

    test("역순으로 push해도 내림차순 pop", () => {
      const heap = new MaxHeap<number>(numCompare);
      [5, 4, 3, 2, 1].forEach((n) => heap.push(n));
      const result: number[] = [];
      while (!heap.isEmpty()) {
        const val = heap.pop();
        if (val !== undefined) result.push(val);
      }
      expect(result).toEqual([5, 4, 3, 2, 1]);
    });

    test("랜덤 순서 push 후 내림차순 pop", () => {
      const heap = new MaxHeap<number>(numCompare);
      [3, 1, 4, 1, 5, 9, 2, 6, 5, 3].forEach((n) => heap.push(n));
      const result: number[] = [];
      while (!heap.isEmpty()) {
        const val = heap.pop();
        if (val !== undefined) result.push(val);
      }
      // 내림차순 정렬 확인
      for (let i = 0; i < result.length - 1; i++) {
        expect((result[i] ?? 0) >= (result[i + 1] ?? 0)).toBe(true);
      }
    });
  });

  describe("기본 — Top-K 스트림 처리", () => {
    test("크기 K로 유지하며 K번째 최댓값 추적", () => {
      // K=3인 최솟값 힙으로 Top-3 스트림 유지 (MinHeap 활용 패턴)
      // MaxHeap은 push(all) 후 top-K를 pop으로 가져오는 용도
      const heap = new MaxHeap<number>(numCompare);
      const stream = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
      stream.forEach((n) => heap.push(n));

      // Top-3 추출
      const top3: number[] = [];
      for (let i = 0; i < 3; i++) {
        const val = heap.pop();
        if (val !== undefined) top3.push(val);
      }
      expect(top3).toEqual([9, 6, 5]);
    });

    test("실시간 순위권 유지: 최댓값 pop 반복", () => {
      const heap = new MaxHeap<number>(numCompare);
      [100, 50, 200, 75, 150].forEach((n) => heap.push(n));
      expect(heap.peek()).toBe(200); // 현재 최고값
      heap.pop(); // 200 제거
      expect(heap.peek()).toBe(150); // 다음 최고값
    });
  });

  describe("기본 — 객체 타입 최댓값 우선", () => {
    type Player = { name: string; score: number };
    const scoreCompare = (a: Player, b: Player) => a.score - b.score;

    test("게임 랭킹: 점수 높은 플레이어 우선 pop", () => {
      const heap = new MaxHeap<Player>(scoreCompare);
      heap.push({ name: "Alice", score: 80 });
      heap.push({ name: "Bob", score: 95 });
      heap.push({ name: "Charlie", score: 70 });

      expect(heap.pop()?.name).toBe("Bob");    // 95점
      expect(heap.pop()?.name).toBe("Alice");  // 80점
      expect(heap.pop()?.name).toBe("Charlie");// 70점
    });
  });

  describe("엣지 케이스", () => {
    test("빈 힙에서 pop하면 undefined", () => {
      const heap = new MaxHeap<number>(numCompare);
      expect(heap.pop()).toBeUndefined();
    });

    test("빈 힙에서 peek하면 undefined", () => {
      const heap = new MaxHeap<number>(numCompare);
      expect(heap.peek()).toBeUndefined();
    });

    test("단일 원소 push/pop", () => {
      const heap = new MaxHeap<number>(numCompare);
      heap.push(42);
      expect(heap.peek()).toBe(42);
      expect(heap.pop()).toBe(42);
      expect(heap.isEmpty()).toBe(true);
    });

    test("같은 값 원소 여러 개 처리", () => {
      const heap = new MaxHeap<number>(numCompare);
      heap.push(5);
      heap.push(5);
      heap.push(5);
      expect(heap.size()).toBe(3);
      expect(heap.pop()).toBe(5);
      expect(heap.pop()).toBe(5);
      expect(heap.pop()).toBe(5);
      expect(heap.isEmpty()).toBe(true);
    });

    test("pop 후 re-push", () => {
      const heap = new MaxHeap<number>(numCompare);
      heap.push(10);
      heap.push(3);
      heap.pop(); // 10 제거
      heap.push(15); // 새로 15 삽입
      expect(heap.peek()).toBe(15);
    });

    test("음수 포함 최댓값 우선", () => {
      const heap = new MaxHeap<number>(numCompare);
      [-5, -10, -1, -3].forEach((n) => heap.push(n));
      expect(heap.pop()).toBe(-1);
      expect(heap.pop()).toBe(-3);
    });

    test("두 원소만 있을 때 순서", () => {
      const heap = new MaxHeap<number>(numCompare);
      heap.push(1);
      heap.push(100);
      expect(heap.pop()).toBe(100);
      expect(heap.pop()).toBe(1);
    });
  });

  describe("바운더리", () => {
    test("push/pop 교차 연산으로 힙 속성 유지", () => {
      const heap = new MaxHeap<number>(numCompare);
      heap.push(5);
      heap.push(10);
      expect(heap.pop()).toBe(10); // 10 제거
      heap.push(8);
      expect(heap.pop()).toBe(8); // 8 제거
      heap.push(3);
      heap.push(12);
      expect(heap.pop()).toBe(12); // 12 제거
      expect(heap.pop()).toBe(5); // 5 제거
      expect(heap.pop()).toBe(3); // 3 제거
      expect(heap.isEmpty()).toBe(true);
    });

    test("pop 결과는 항상 내림차순", () => {
      const heap = new MaxHeap<number>(numCompare);
      const values = [7, 2, 9, 4, 1, 8, 3, 6, 5];
      values.forEach((v) => heap.push(v));
      const results: number[] = [];
      while (!heap.isEmpty()) {
        const val = heap.pop();
        if (val !== undefined) results.push(val);
      }
      // 인접 원소 비교로 내림차순 확인
      for (let i = 0; i < results.length - 1; i++) {
        expect((results[i] ?? 0) >= (results[i + 1] ?? 0)).toBe(true);
      }
      expect(results).toHaveLength(values.length);
    });
  });

  describe("성능", () => {
    test("10^5번 push/pop 100ms 이내", () => {
      const heap = new MaxHeap<number>(numCompare);
      const n = 100_000;
      const start = performance.now();
      for (let i = 1; i <= n; i++) {
        heap.push(i);
      }
      const results: number[] = [];
      while (!heap.isEmpty()) {
        const val = heap.pop();
        if (val !== undefined) results.push(val);
      }
      const elapsed = performance.now() - start;
      expect(results[0]).toBe(n);     // 최댓값 먼저
      expect(results[n - 1]).toBe(1); // 최솟값 마지막
      expect(elapsed).toBeLessThan(100);
    });

    test("push 후 peek이 항상 최댓값인지 1000회 검증", () => {
      const heap = new MaxHeap<number>(numCompare);
      let maxSoFar = -Infinity;
      for (let i = 0; i < 1000; i++) {
        const val = Math.floor(Math.random() * 10_000);
        heap.push(val);
        maxSoFar = Math.max(maxSoFar, val);
        expect(heap.peek()).toBe(maxSoFar);
      }
    });

    test("Top-K 추출 성능: 10^5 원소에서 K=100 추출 100ms 이내", () => {
      const heap = new MaxHeap<number>(numCompare);
      const n = 100_000;
      const k = 100;
      const arr = Array.from({ length: n }, () =>
        Math.floor(Math.random() * 1_000_000)
      );
      const start = performance.now();
      arr.forEach((v) => heap.push(v));
      const topK: number[] = [];
      for (let i = 0; i < k; i++) {
        const val = heap.pop();
        if (val !== undefined) topK.push(val);
      }
      const elapsed = performance.now() - start;
      expect(topK).toHaveLength(k);
      // topK는 내림차순이어야 함
      for (let i = 0; i < topK.length - 1; i++) {
        expect((topK[i] ?? 0) >= (topK[i + 1] ?? 0)).toBe(true);
      }
      expect(elapsed).toBeLessThan(100);
    });
  });
});
