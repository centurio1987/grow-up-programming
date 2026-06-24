import { test, expect, describe } from "bun:test";
import { spfa } from "./spfa";

describe("spfa", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("단일 정점", () => {
      expect(spfa(1, [], 0)).toEqual([0]);
    });

    test("선형 그래프 양수 가중치", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
      ];
      expect(spfa(4, edges, 0)).toEqual([0, 1, 2, 3]);
    });

    test("음수 간선 (사이클 없음)", () => {
      // 0→1(4), 0→2(5), 1→2(-3): 0→2 최단 = 0→1→2 = 1
      const edges: [number, number, number][] = [
        [0, 1, 4],
        [0, 2, 5],
        [1, 2, -3],
      ];
      expect(spfa(3, edges, 0)).toEqual([0, 4, 1]);
    });

    test("재완화 - 늦게 발견된 더 짧은 경로", () => {
      // 0→1(10), 0→2(1), 2→1(1): 0→1 최단 = 2
      const edges: [number, number, number][] = [
        [0, 1, 10],
        [0, 2, 1],
        [2, 1, 1],
      ];
      expect(spfa(3, edges, 0)).toEqual([0, 2, 1]);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("도달 불가능한 정점은 Infinity", () => {
      const edges: [number, number, number][] = [[0, 1, 2]];
      expect(spfa(3, edges, 0)).toEqual([0, 2, Infinity]);
    });

    test("간선이 없는 그래프", () => {
      expect(spfa(3, [], 2)).toEqual([Infinity, Infinity, 0]);
    });

    test("다중 간선 - 더 작은 가중치 채택", () => {
      const edges: [number, number, number][] = [
        [0, 1, 5],
        [0, 1, -2],
        [0, 1, 3],
      ];
      expect(spfa(2, edges, 0)).toEqual([0, -2]);
    });

    test("가중치 0 처리", () => {
      const edges: [number, number, number][] = [
        [0, 1, 0],
        [1, 2, 0],
      ];
      expect(spfa(3, edges, 0)).toEqual([0, 0, 0]);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("V=1", () => {
      expect(spfa(1, [], 0)).toEqual([0]);
    });

    test("큰 양수 가중치 (10^9)", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1_000_000_000],
        [1, 2, 1_000_000_000],
      ];
      expect(spfa(3, edges, 0)).toEqual([0, 1_000_000_000, 2_000_000_000]);
    });

    test("음수 가중치(-10^9) 처리", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1_000_000_000],
        [1, 2, -1_000_000_000],
      ];
      expect(spfa(3, edges, 0)).toEqual([0, 1_000_000_000, 0]);
    });

    test("시작점이 중간 정점", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
      ];
      // src=1: 0 unreachable
      expect(spfa(4, edges, 1)).toEqual([Infinity, 0, 1, 2]);
    });
  });

  // 성능 테스트
  describe("성능 테스트", () => {
    test("V=10^4, E≈5*10^4 희소 그래프 성능", () => {
      const V = 10_000;
      const edges: [number, number, number][] = [];
      for (let i = 0; i + 1 < V; i++) {
        edges.push([i, i + 1, 1]);
      }
      let seed = 987654321;
      const rand = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed;
      };
      for (let i = 0; i < V * 4; i++) {
        const u = rand() % V;
        const v = rand() % V;
        // 음수 사이클이 생기지 않도록 음수도 작은 범위에서만
        const w = (rand() % 200) - 50;
        if (u < v) edges.push([u, v, w]); // forward edges only로 음수 사이클 방지
      }

      const start = performance.now();
      const dist = spfa(V, edges, 0);
      const elapsed = performance.now() - start;

      expect(dist[0]).toBe(0);
      expect(dist.length).toBe(V);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
