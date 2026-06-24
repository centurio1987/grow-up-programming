import { test, expect, describe } from "bun:test";
import { maxFlow } from "./maxFlow";

describe("maxFlow", () => {
  describe("기본 동작", () => {
    test("CLRS Fig. 26.1 예시 → 최대 유량 23", () => {
      // 정점: s=0, v1=1, v2=2, v3=3, v4=4, t=5
      // 간선: s→v1=16, s→v2=13, v1→v3=12, v2→v1=4, v2→v4=14, v3→v2=9, v3→t=20, v4→v3=7, v4→t=4
      const edges: [number, number, number][] = [
        [0, 1, 16],
        [0, 2, 13],
        [1, 3, 12],
        [2, 1, 4],
        [2, 4, 14],
        [3, 2, 9],
        [3, 5, 20],
        [4, 3, 7],
        [4, 5, 4],
      ];
      expect(maxFlow(6, edges, 0, 5)).toEqual({ flow: 23 });
    });

    test("단순 직렬 그래프 — 병목이 정답", () => {
      // 0 →(10)→ 1 →(5)→ 2  →  max flow = 5
      const edges: [number, number, number][] = [
        [0, 1, 10],
        [1, 2, 5],
      ];
      expect(maxFlow(3, edges, 0, 2)).toEqual({ flow: 5 });
    });

    test("병렬 두 경로 — 용량 합", () => {
      // 0→1→3 (3), 0→2→3 (4) → 7
      const edges: [number, number, number][] = [
        [0, 1, 3],
        [1, 3, 3],
        [0, 2, 4],
        [2, 3, 4],
      ];
      expect(maxFlow(4, edges, 0, 3)).toEqual({ flow: 7 });
    });

    test("역방향 간선 활용이 필요한 케이스 (Ford-Fulkerson)", () => {
      // 고전 예시: 0→1=3, 0→2=3, 1→2=2, 1→3=3, 2→3=3 → max flow = 6
      const edges: [number, number, number][] = [
        [0, 1, 3],
        [0, 2, 3],
        [1, 2, 2],
        [1, 3, 3],
        [2, 3, 3],
      ];
      expect(maxFlow(4, edges, 0, 3)).toEqual({ flow: 6 });
    });
  });

  describe("엣지 케이스", () => {
    test("소스와 싱크 사이 경로 없음 → 0", () => {
      // 0과 1만 연결되어 있고, 싱크 2는 고립
      const edges: [number, number, number][] = [[0, 1, 10]];
      expect(maxFlow(3, edges, 0, 2)).toEqual({ flow: 0 });
    });

    test("간선 없음 → 0", () => {
      expect(maxFlow(2, [], 0, 1)).toEqual({ flow: 0 });
    });

    test("소스와 싱크가 직접 연결 → 그 용량", () => {
      const edges: [number, number, number][] = [[0, 1, 100]];
      expect(maxFlow(2, edges, 0, 1)).toEqual({ flow: 100 });
    });

    test("용량 0인 간선 → 유량 0 기여", () => {
      const edges: [number, number, number][] = [
        [0, 1, 0],
        [0, 2, 5],
        [2, 1, 5],
      ];
      expect(maxFlow(3, edges, 0, 1)).toEqual({ flow: 5 });
    });

    test("중복 평행 간선 → 용량 합산 효과", () => {
      // 0→1을 5와 7 → max flow = 12
      const edges: [number, number, number][] = [
        [0, 1, 5],
        [0, 1, 7],
      ];
      expect(maxFlow(2, edges, 0, 1)).toEqual({ flow: 12 });
    });

    test("자기 루프 — 영향 없음", () => {
      const edges: [number, number, number][] = [
        [0, 0, 100],
        [0, 1, 5],
      ];
      expect(maxFlow(2, edges, 0, 1)).toEqual({ flow: 5 });
    });
  });

  describe("바운더리", () => {
    test("V=2 최소 케이스", () => {
      expect(maxFlow(2, [[0, 1, 1]], 0, 1)).toEqual({ flow: 1 });
    });

    test("큰 용량 값 (1e6)", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1_000_000],
        [1, 2, 1_000_000],
      ];
      expect(maxFlow(3, edges, 0, 2)).toEqual({ flow: 1_000_000 });
    });
  });

  describe("성능", () => {
    test("V=200, E≈4000 격자형 네트워크를 100ms 이내", () => {
      // 20x10 격자형 네트워크: 행 별 좌→우 흐름
      const W = 20;
      const H = 10;
      const idx = (r: number, c: number) => r * W + c + 2; // 0=src, 1=sink
      const V = H * W + 2;
      const edges: [number, number, number][] = [];
      for (let r = 0; r < H; r++) {
        edges.push([0, idx(r, 0), 100]);
        edges.push([idx(r, W - 1), 1, 100]);
      }
      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W - 1; c++) {
          edges.push([idx(r, c), idx(r, c + 1), 10]);
        }
      }
      for (let r = 0; r < H - 1; r++) {
        for (let c = 0; c < W; c++) {
          edges.push([idx(r, c), idx(r + 1, c), 5]);
          edges.push([idx(r + 1, c), idx(r, c), 5]);
        }
      }

      const start = performance.now();
      maxFlow(V, edges, 0, 1);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
