import { test, expect, describe } from "bun:test";
import { floydWarshall } from "./floydWarshall";

describe("floydWarshall", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("단일 정점", () => {
      expect(floydWarshall(1, [])).toEqual([[0]]);
    });

    test("대각선은 모두 0", () => {
      const m = floydWarshall(3, [
        [0, 1, 1],
        [1, 2, 1],
      ]);
      expect(m[0]![0]).toBe(0);
      expect(m[1]![1]).toBe(0);
      expect(m[2]![2]).toBe(0);
    });

    test("선형 그래프", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
      ];
      const m = floydWarshall(4, edges);
      expect(m[0]).toEqual([0, 1, 2, 3]);
      expect(m[1]).toEqual([Infinity, 0, 1, 2]);
      expect(m[2]).toEqual([Infinity, Infinity, 0, 1]);
      expect(m[3]).toEqual([Infinity, Infinity, Infinity, 0]);
    });

    test("간접 경로가 직접 간선보다 짧은 경우 (음수 포함)", () => {
      // 0→1(4), 0→2(5), 1→2(-3): 0→2 최단 = 0→1→2 = 1
      const edges: [number, number, number][] = [
        [0, 1, 4],
        [0, 2, 5],
        [1, 2, -3],
      ];
      const m = floydWarshall(3, edges);
      expect(m[0]![2]).toBe(1);
    });

    test("방향성 - 역방향 간선은 별도", () => {
      const edges: [number, number, number][] = [
        [0, 1, 3],
        [1, 0, 7],
      ];
      const m = floydWarshall(2, edges);
      expect(m[0]![1]).toBe(3);
      expect(m[1]![0]).toBe(7);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("간선이 없는 그래프 - 대각선만 0, 나머지 Infinity", () => {
      const m = floydWarshall(3, []);
      expect(m).toEqual([
        [0, Infinity, Infinity],
        [Infinity, 0, Infinity],
        [Infinity, Infinity, 0],
      ]);
    });

    test("다중 간선 - 작은 가중치 채택", () => {
      const edges: [number, number, number][] = [
        [0, 1, 10],
        [0, 1, 3],
        [0, 1, 7],
      ];
      const m = floydWarshall(2, edges);
      expect(m[0]![1]).toBe(3);
    });

    test("도달 불가능한 정점은 Infinity", () => {
      const edges: [number, number, number][] = [[0, 1, 5]];
      const m = floydWarshall(3, edges);
      expect(m[0]![2]).toBe(Infinity);
      expect(m[2]![0]).toBe(Infinity);
    });

    test("가중치 0 처리", () => {
      const edges: [number, number, number][] = [
        [0, 1, 0],
        [1, 2, 0],
      ];
      const m = floydWarshall(3, edges);
      expect(m[0]![2]).toBe(0);
    });

    test("음수 간선이지만 사이클 없음", () => {
      const edges: [number, number, number][] = [
        [0, 1, -1],
        [1, 2, -2],
      ];
      const m = floydWarshall(3, edges);
      expect(m[0]![2]).toBe(-3);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("V=1", () => {
      expect(floydWarshall(1, [])).toEqual([[0]]);
    });

    test("큰 양수 가중치 (10^6)", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1_000_000],
        [1, 2, 1_000_000],
      ];
      const m = floydWarshall(3, edges);
      expect(m[0]![2]).toBe(2_000_000);
    });

    test("V=2 완전 그래프", () => {
      const edges: [number, number, number][] = [
        [0, 1, 5],
        [1, 0, 3],
      ];
      const m = floydWarshall(2, edges);
      expect(m).toEqual([
        [0, 5],
        [3, 0],
      ]);
    });
  });

  // 성능 테스트 - V=200
  describe("성능 테스트", () => {
    test("V=200 완전 그래프 (E≈40000) 처리 - O(V^3)이지만 100ms 이내", () => {
      const V = 200;
      const edges: [number, number, number][] = [];
      let seed = 12345;
      const rand = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed;
      };
      for (let u = 0; u < V; u++) {
        for (let v = 0; v < V; v++) {
          if (u !== v) edges.push([u, v, (rand() % 1000) + 1]);
        }
      }

      const start = performance.now();
      const m = floydWarshall(V, edges);
      const elapsed = performance.now() - start;

      expect(m.length).toBe(V);
      expect(m[0]!.length).toBe(V);
      expect(m[0]![0]).toBe(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
