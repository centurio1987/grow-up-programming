import { test, expect, describe } from "bun:test";
import { bellmanFord } from "./bellmanFord";

describe("bellmanFord", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("단일 정점", () => {
      const r = bellmanFord(1, [], 0);
      expect(r.dist).toEqual([0]);
      expect(r.hasNegativeCycle).toBe(false);
    });

    test("양수 가중치만 - Dijkstra와 같은 결과", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 2, 2],
        [0, 2, 10],
      ];
      const r = bellmanFord(3, edges, 0);
      expect(r.dist).toEqual([0, 1, 3]);
      expect(r.hasNegativeCycle).toBe(false);
    });

    test("음수 간선 포함 (사이클 없음)", () => {
      // 0→1(4), 0→2(5), 1→2(-3): 0→2의 최단은 0→1→2 = 1
      const edges: [number, number, number][] = [
        [0, 1, 4],
        [0, 2, 5],
        [1, 2, -3],
      ];
      const r = bellmanFord(3, edges, 0);
      expect(r.dist).toEqual([0, 4, 1]);
      expect(r.hasNegativeCycle).toBe(false);
    });
  });

  // 음수 사이클 검출 (필수)
  describe("음수 사이클 검출", () => {
    test("간단한 음수 사이클 (0→1→0)", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 0, -3],
      ];
      const r = bellmanFord(2, edges, 0);
      expect(r.hasNegativeCycle).toBe(true);
    });

    test("3-노드 음수 사이클 0→1→2→0", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 2, 1],
        [2, 0, -5],
      ];
      const r = bellmanFord(3, edges, 0);
      expect(r.hasNegativeCycle).toBe(true);
    });

    test("도달 불가능한 음수 사이클은 false (시작점에서 도달 가능해야만 true)", () => {
      // 0은 고립, 1→2→1은 음수 사이클이지만 src=0
      const edges: [number, number, number][] = [
        [1, 2, 1],
        [2, 1, -5],
      ];
      const r = bellmanFord(3, edges, 0);
      expect(r.hasNegativeCycle).toBe(false);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("도달 불가능한 정점은 Infinity", () => {
      const edges: [number, number, number][] = [[0, 1, 5]];
      const r = bellmanFord(3, edges, 0);
      expect(r.dist).toEqual([0, 5, Infinity]);
      expect(r.hasNegativeCycle).toBe(false);
    });

    test("간선이 없는 그래프", () => {
      const r = bellmanFord(3, [], 1);
      expect(r.dist).toEqual([Infinity, 0, Infinity]);
      expect(r.hasNegativeCycle).toBe(false);
    });

    test("가중치 0 간선", () => {
      const edges: [number, number, number][] = [
        [0, 1, 0],
        [1, 2, 0],
      ];
      const r = bellmanFord(3, edges, 0);
      expect(r.dist).toEqual([0, 0, 0]);
      expect(r.hasNegativeCycle).toBe(false);
    });

    test("음수 셀프 루프 (시작점 자신)는 음수 사이클", () => {
      const edges: [number, number, number][] = [
        [0, 0, -1],
        [0, 1, 1],
      ];
      const r = bellmanFord(2, edges, 0);
      expect(r.hasNegativeCycle).toBe(true);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("V=1, 간선 없음", () => {
      const r = bellmanFord(1, [], 0);
      expect(r.dist).toEqual([0]);
      expect(r.hasNegativeCycle).toBe(false);
    });

    test("큰 양수 가중치", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1_000_000_000],
        [1, 2, 1_000_000_000],
      ];
      const r = bellmanFord(3, edges, 0);
      expect(r.dist).toEqual([0, 1_000_000_000, 2_000_000_000]);
    });

    test("음수 가중치(-10^9) 처리", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1_000_000_000],
        [0, 2, 1_000_000_000],
        [1, 2, -1_000_000_000],
      ];
      const r = bellmanFord(3, edges, 0);
      expect(r.dist[2]).toBe(0);
      expect(r.hasNegativeCycle).toBe(false);
    });
  });

  // 성능 테스트
  describe("성능 테스트", () => {
    test("V=200, E≈400 그래프 성능 (음수 사이클 없음)", () => {
      const V = 200;
      const edges: [number, number, number][] = [];
      for (let i = 0; i + 1 < V; i++) {
        edges.push([i, i + 1, 1]);
      }
      // 무작위 비음수 간선 추가
      let seed = 42;
      const rand = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed;
      };
      for (let i = 0; i < V * 2; i++) {
        const u = rand() % V;
        const v = rand() % V;
        edges.push([u, v, (rand() % 100) + 1]);
      }

      const start = performance.now();
      const r = bellmanFord(V, edges, 0);
      const elapsed = performance.now() - start;

      expect(r.hasNegativeCycle).toBe(false);
      expect(r.dist[0]).toBe(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
