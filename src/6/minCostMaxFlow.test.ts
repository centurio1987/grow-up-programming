import { test, expect, describe } from "bun:test";
import { minCostMaxFlow } from "./minCostMaxFlow";

describe("minCostMaxFlow", () => {
  describe("기본 동작", () => {
    test("두 경로, 싸지만 좁은 vs 비싸지만 넓은 — 합쳐서 최대 유량과 그 최소 비용", () => {
      // s=0, t=3
      // 0→1 cap=1 cost=1, 1→3 cap=1 cost=1   (싼 경로, 비용 2)
      // 0→2 cap=2 cost=5, 2→3 cap=2 cost=5   (비싼 경로, 비용 10)
      // max flow = 3, min cost = 1*(1+1) + 2*(5+5) = 2 + 20 = 22
      const edges: [number, number, number, number][] = [
        [0, 1, 1, 1],
        [1, 3, 1, 1],
        [0, 2, 2, 5],
        [2, 3, 2, 5],
      ];
      expect(minCostMaxFlow(4, edges, 0, 3)).toEqual({ flow: 3, cost: 22 });
    });

    test("직렬 경로 — 단순 비용·용량", () => {
      // 0→1 cap=5 cost=2, 1→2 cap=5 cost=3 → flow 5, cost 5*(2+3)=25
      const edges: [number, number, number, number][] = [
        [0, 1, 5, 2],
        [1, 2, 5, 3],
      ];
      expect(minCostMaxFlow(3, edges, 0, 2)).toEqual({ flow: 5, cost: 25 });
    });

    test("CLRS 26 스타일 — 두 정점 경유 비교 후 합치기", () => {
      // s=0, t=3
      // 0→1 cap=2 cost=1,   1→3 cap=2 cost=1   → 경로비용 2, 용량 2
      // 0→2 cap=3 cost=10,  2→3 cap=3 cost=10  → 경로비용 20, 용량 3
      // 가능한 max flow = 2 + 3 = 5, min cost = 2*2 + 3*20 = 4 + 60 = 64
      const edges: [number, number, number, number][] = [
        [0, 1, 2, 1],
        [1, 3, 2, 1],
        [0, 2, 3, 10],
        [2, 3, 3, 10],
      ];
      expect(minCostMaxFlow(4, edges, 0, 3)).toEqual({ flow: 5, cost: 64 });
    });
  });

  describe("엣지 케이스", () => {
    test("경로 없음 → flow=0, cost=0", () => {
      const edges: [number, number, number, number][] = [[0, 1, 10, 5]];
      expect(minCostMaxFlow(3, edges, 0, 2)).toEqual({ flow: 0, cost: 0 });
    });

    test("간선 없음 → flow=0, cost=0", () => {
      expect(minCostMaxFlow(2, [], 0, 1)).toEqual({ flow: 0, cost: 0 });
    });

    test("직접 연결, 단일 간선", () => {
      const edges: [number, number, number, number][] = [[0, 1, 7, 3]];
      expect(minCostMaxFlow(2, edges, 0, 1)).toEqual({ flow: 7, cost: 21 });
    });

    test("비용 0 — 최대 유량만큼 흘리되 비용 0", () => {
      const edges: [number, number, number, number][] = [
        [0, 1, 5, 0],
        [1, 2, 5, 0],
      ];
      expect(minCostMaxFlow(3, edges, 0, 2)).toEqual({ flow: 5, cost: 0 });
    });

    test("용량 0 간선은 사용 불가", () => {
      const edges: [number, number, number, number][] = [
        [0, 1, 0, 100],
        [0, 2, 3, 1],
        [2, 1, 3, 1],
      ];
      // 0→1 직접은 cap=0이라 못 씀. 0→2→1로 3만큼 흐름, 비용 3*(1+1)=6
      expect(minCostMaxFlow(3, edges, 0, 1)).toEqual({ flow: 3, cost: 6 });
    });

    test("싼 경로를 먼저 모두 소진한 뒤 비싼 경로 사용 (SSP 원칙)", () => {
      // 0→1 cap=1 cost=1, 1→2 cap=1 cost=1  (싼 경로, 비용 2)
      // 0→2 cap=10 cost=100                  (비싼 직통)
      // max flow = 1 + 10 = 11, cost = 1*2 + 10*100 = 1002
      const edges: [number, number, number, number][] = [
        [0, 1, 1, 1],
        [1, 2, 1, 1],
        [0, 2, 10, 100],
      ];
      expect(minCostMaxFlow(3, edges, 0, 2)).toEqual({ flow: 11, cost: 1002 });
    });
  });

  describe("바운더리", () => {
    test("V=2 최소 케이스, cost=0", () => {
      expect(minCostMaxFlow(2, [[0, 1, 1, 0]], 0, 1)).toEqual({
        flow: 1,
        cost: 0,
      });
    });

    test("최대 단가·용량 조합", () => {
      const edges: [number, number, number, number][] = [
        [0, 1, 10_000, 10_000],
        [1, 2, 10_000, 10_000],
      ];
      // flow 10000, cost 10000 * (10000 + 10000) = 2e8
      expect(minCostMaxFlow(3, edges, 0, 2)).toEqual({
        flow: 10_000,
        cost: 200_000_000,
      });
    });
  });

  describe("성능", () => {
    test("V=100, E≈600 의 이분 매칭 형태 네트워크를 500ms 이내", () => {
      // 이분 매칭 with weights:
      // 0=src, 1=sink, 2..51=left (50), 52..101=right (50)
      const L = 50;
      const R = 50;
      const V = 2 + L + R;
      const left = (i: number) => 2 + i;
      const right = (j: number) => 2 + L + j;
      const edges: [number, number, number, number][] = [];
      for (let i = 0; i < L; i++) edges.push([0, left(i), 1, 0]);
      for (let j = 0; j < R; j++) edges.push([right(j), 1, 1, 0]);
      let seed = 12345;
      for (let i = 0; i < L; i++) {
        for (let k = 0; k < 10; k++) {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff;
          const j = seed % R;
          edges.push([left(i), right(j), 1, (seed % 100) + 1]);
        }
      }

      const start = performance.now();
      minCostMaxFlow(V, edges, 0, 1);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(500);
    });
  });
});
