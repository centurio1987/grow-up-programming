import { test, expect, describe } from "bun:test";
import { primMst } from "./primMst";

describe("primMst", () => {
  describe("기본 동작", () => {
    test("CLRS 예시 그래프 → MST 가중치 합 37", () => {
      const edges: [number, number, number][] = [
        [0, 1, 4],
        [0, 7, 8],
        [1, 2, 8],
        [1, 7, 11],
        [2, 3, 7],
        [2, 5, 4],
        [2, 8, 2],
        [3, 4, 9],
        [3, 5, 14],
        [4, 5, 10],
        [5, 6, 2],
        [6, 7, 1],
        [6, 8, 6],
        [7, 8, 7],
      ];
      expect(primMst(9, edges)).toBe(37);
    });

    test("삼각형 그래프 → 가장 가벼운 두 간선의 합", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 2, 2],
        [0, 2, 3],
      ];
      expect(primMst(3, edges)).toBe(3);
    });

    test("완전 그래프 K4 — MST 합 검증", () => {
      // K4 with weights designed so MST = 1+2+3 = 6
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [0, 2, 4],
        [0, 3, 5],
        [1, 2, 2],
        [1, 3, 6],
        [2, 3, 3],
      ];
      expect(primMst(4, edges)).toBe(6);
    });
  });

  describe("엣지 케이스", () => {
    test("정점 1개, 간선 없음 → 0", () => {
      expect(primMst(1, [])).toBe(0);
    });

    test("연결되지 않은 그래프 → -1", () => {
      const edges: [number, number, number][] = [[0, 1, 5]];
      expect(primMst(3, edges)).toBe(-1);
    });

    test("간선 없음에 정점 다수 → -1", () => {
      expect(primMst(4, [])).toBe(-1);
    });

    test("중복 간선 (멀티 엣지) 중 가벼운 것을 선택", () => {
      const edges: [number, number, number][] = [
        [0, 1, 100],
        [0, 1, 1],
      ];
      expect(primMst(2, edges)).toBe(1);
    });

    test("자기 루프 간선 무시 (또는 트리에 포함되지 않음)", () => {
      const edges: [number, number, number][] = [
        [0, 0, 100],
        [0, 1, 5],
      ];
      expect(primMst(2, edges)).toBe(5);
    });

    test("가중치 0인 간선 포함", () => {
      const edges: [number, number, number][] = [
        [0, 1, 0],
        [1, 2, 5],
      ];
      expect(primMst(3, edges)).toBe(5);
    });
  });

  describe("바운더리", () => {
    test("정점 2개, 간선 1개", () => {
      expect(primMst(2, [[0, 1, 7]])).toBe(7);
    });

    test("최대 가중치 1e9", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1_000_000_000],
        [1, 2, 1_000_000_000],
      ];
      expect(primMst(3, edges)).toBe(2_000_000_000);
    });
  });

  describe("성능", () => {
    test("밀집 그래프 V=300, E≈V*(V-1)/2 ≈ 45000 을 100ms 이내", () => {
      const V = 300;
      const edges: [number, number, number][] = [];
      for (let i = 0; i < V; i++) {
        for (let j = i + 1; j < V; j++) {
          edges.push([i, j, ((i * 7919 + j * 1009) % 1000) + 1]);
        }
      }
      const start = performance.now();
      primMst(V, edges);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
