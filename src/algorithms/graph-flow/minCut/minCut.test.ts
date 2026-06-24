import { test, expect, describe } from "bun:test";
import { minCut } from "./minCut";

describe("minCut", () => {
  describe("기본 동작", () => {
    test("CLRS Fig. 26.1 예시 → 최소 컷 23 (= 최대 유량)", () => {
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
      expect(minCut(6, edges, 0, 5)).toEqual({ cut: 23 });
    });

    test("직렬 그래프 — 병목 간선이 최소 컷", () => {
      // 0 →(10)→ 1 →(5)→ 2 → min cut = 5
      const edges: [number, number, number][] = [
        [0, 1, 10],
        [1, 2, 5],
      ];
      expect(minCut(3, edges, 0, 2)).toEqual({ cut: 5 });
    });

    test("병렬 두 경로 — 컷은 두 경로 용량 합", () => {
      const edges: [number, number, number][] = [
        [0, 1, 3],
        [1, 3, 3],
        [0, 2, 4],
        [2, 3, 4],
      ];
      expect(minCut(4, edges, 0, 3)).toEqual({ cut: 7 });
    });

    test("Max-Flow Min-Cut 정리 검증 (Ford-Fulkerson 예시)", () => {
      // max flow = 6 → min cut = 6
      const edges: [number, number, number][] = [
        [0, 1, 3],
        [0, 2, 3],
        [1, 2, 2],
        [1, 3, 3],
        [2, 3, 3],
      ];
      expect(minCut(4, edges, 0, 3)).toEqual({ cut: 6 });
    });
  });

  describe("엣지 케이스", () => {
    test("경로 없음 → 0", () => {
      const edges: [number, number, number][] = [[0, 1, 10]];
      expect(minCut(3, edges, 0, 2)).toEqual({ cut: 0 });
    });

    test("간선 없음 → 0", () => {
      expect(minCut(2, [], 0, 1)).toEqual({ cut: 0 });
    });

    test("소스와 싱크 직접 연결 — 그 용량이 컷", () => {
      expect(minCut(2, [[0, 1, 100]], 0, 1)).toEqual({ cut: 100 });
    });

    test("용량 0 간선만 → 0", () => {
      const edges: [number, number, number][] = [[0, 1, 0]];
      expect(minCut(2, edges, 0, 1)).toEqual({ cut: 0 });
    });

    test("평행 간선 합산", () => {
      const edges: [number, number, number][] = [
        [0, 1, 5],
        [0, 1, 7],
      ];
      expect(minCut(2, edges, 0, 1)).toEqual({ cut: 12 });
    });

    test("싱크 측 컷이 더 작은 케이스", () => {
      // 0 → 1 → 2 → 3
      // 용량 (0→1)=100, (1→2)=100, (2→3)=1 → 컷 = 1
      const edges: [number, number, number][] = [
        [0, 1, 100],
        [1, 2, 100],
        [2, 3, 1],
      ];
      expect(minCut(4, edges, 0, 3)).toEqual({ cut: 1 });
    });
  });

  describe("바운더리", () => {
    test("V=2 최소 케이스", () => {
      expect(minCut(2, [[0, 1, 1]], 0, 1)).toEqual({ cut: 1 });
    });

    test("큰 용량 (1e6)", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1_000_000],
        [1, 2, 1_000_000],
      ];
      expect(minCut(3, edges, 0, 2)).toEqual({ cut: 1_000_000 });
    });
  });

  describe("성능", () => {
    test("V=200, E≈4000 격자형 네트워크를 100ms 이내", () => {
      const W = 20;
      const H = 10;
      const idx = (r: number, c: number) => r * W + c + 2;
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
      minCut(V, edges, 0, 1);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
