import { test, expect, describe } from "bun:test";
import { treeMaxIndependentSet } from "./treeMaxIndependentSet";

describe("treeMaxIndependentSet", () => {
  describe("기본", () => {
    test("경로 그래프 0-1-2-3, weights=[10,1,1,10] → 0+3 = 20", () => {
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
      ];
      expect(treeMaxIndependentSet(4, edges, [10, 1, 1, 10])).toBe(20);
    });

    test("스타 그래프 — 중심 weight=10, 잎=1*4 → 중심 vs 잎합 → max(10,4)=10", () => {
      const edges: [number, number][] = [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
      ];
      expect(treeMaxIndependentSet(5, edges, [10, 1, 1, 1, 1])).toBe(10);
    });

    test("스타 그래프 — 중심=1, 잎 각 5 → 잎합 20", () => {
      const edges: [number, number][] = [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
      ];
      expect(treeMaxIndependentSet(5, edges, [1, 5, 5, 5, 5])).toBe(20);
    });
  });

  describe("엣지", () => {
    test("n=1 단일 노드, weight=양수 → weight", () => {
      expect(treeMaxIndependentSet(1, [], [42])).toBe(42);
    });

    test("n=1 단일 노드, weight=음수 → 0 (선택 안 함)", () => {
      // 빈 집합도 독립집합으로 인정
      expect(treeMaxIndependentSet(1, [], [-5])).toBe(0);
    });

    test("모두 음수 가중치 → 0 (빈 집합)", () => {
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
      ];
      expect(treeMaxIndependentSet(3, edges, [-1, -2, -3])).toBe(0);
    });

    test("n=2 단일 간선 — 큰 값 선택", () => {
      expect(treeMaxIndependentSet(2, [[0, 1]], [5, 7])).toBe(7);
    });

    test("경로 0-1-2 가중치 [3,10,3] → 중간만 = 10", () => {
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
      ];
      expect(treeMaxIndependentSet(3, edges, [3, 10, 3])).toBe(10);
    });
  });

  describe("바운더리", () => {
    test("경로 길이 5, 가중치 1*5 → ceil(5/2)=3", () => {
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
      ];
      expect(treeMaxIndependentSet(5, edges, [1, 1, 1, 1, 1])).toBe(3);
    });

    test("최댓값 가중치 — w[i]=10000 단일 노드", () => {
      expect(treeMaxIndependentSet(1, [], [10000])).toBe(10000);
    });
  });

  describe("성능", () => {
    test("n=100,000 경로 그래프를 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const edges: [number, number][] = [];
      for (let i = 1; i < n; i++) edges.push([i - 1, i]);
      const weights = new Array(n).fill(1);

      const start = performance.now();
      const result = treeMaxIndependentSet(n, edges, weights);
      const elapsed = performance.now() - start;

      expect(result).toBe(Math.ceil(n / 2));
      expect(elapsed).toBeLessThan(100);
    });
  });
});
