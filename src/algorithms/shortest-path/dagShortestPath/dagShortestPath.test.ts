import { test, expect, describe } from "bun:test";
import { dagShortestPath } from "./dagShortestPath";

describe("dagShortestPath", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("단일 정점", () => {
      expect(dagShortestPath(1, [], 0)).toEqual([0]);
    });

    test("선형 DAG", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 2, 2],
        [2, 3, 3],
      ];
      expect(dagShortestPath(4, edges, 0)).toEqual([0, 1, 3, 6]);
    });

    test("음수 간선 포함 DAG", () => {
      const edges: [number, number, number][] = [
        [0, 1, 5],
        [0, 2, 3],
        [1, 3, -2],
        [2, 3, 1],
      ];
      // 0→3 최단: 0→1→3 = 3, 0→2→3 = 4 → 3
      expect(dagShortestPath(4, edges, 0)).toEqual([0, 5, 3, 3]);
    });

    test("위상 순서가 입력 순서와 다른 경우", () => {
      // 간선을 역순으로 줘도 위상 정렬해서 처리해야 함
      const edges: [number, number, number][] = [
        [2, 3, 1],
        [1, 2, 1],
        [0, 1, 1],
      ];
      expect(dagShortestPath(4, edges, 0)).toEqual([0, 1, 2, 3]);
    });

    test("여러 진입 경로 - 더 짧은 경로 선택", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [0, 2, 100],
        [1, 2, 1],
      ];
      expect(dagShortestPath(3, edges, 0)).toEqual([0, 1, 2]);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("도달 불가능한 정점은 Infinity", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [2, 3, 1],
      ];
      expect(dagShortestPath(4, edges, 0)).toEqual([0, 1, Infinity, Infinity]);
    });

    test("간선 없는 그래프", () => {
      expect(dagShortestPath(3, [], 1)).toEqual([Infinity, 0, Infinity]);
    });

    test("시작점이 sink (나가는 간선 없음)", () => {
      const edges: [number, number, number][] = [
        [0, 2, 1],
        [1, 2, 1],
      ];
      // src=2 → 어디로도 갈 수 없음
      expect(dagShortestPath(3, edges, 2)).toEqual([Infinity, Infinity, 0]);
    });

    test("가중치 0 처리", () => {
      const edges: [number, number, number][] = [
        [0, 1, 0],
        [1, 2, 0],
      ];
      expect(dagShortestPath(3, edges, 0)).toEqual([0, 0, 0]);
    });

    test("다중 간선 - 작은 가중치 채택", () => {
      const edges: [number, number, number][] = [
        [0, 1, 10],
        [0, 1, -3],
      ];
      expect(dagShortestPath(2, edges, 0)).toEqual([0, -3]);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("V=1", () => {
      expect(dagShortestPath(1, [], 0)).toEqual([0]);
    });

    test("큰 양수 가중치 (10^9)", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1_000_000_000],
        [1, 2, 1_000_000_000],
      ];
      expect(dagShortestPath(3, edges, 0)).toEqual([
        0,
        1_000_000_000,
        2_000_000_000,
      ]);
    });

    test("음수 가중치(-10^9) 처리", () => {
      const edges: [number, number, number][] = [
        [0, 1, -1_000_000_000],
        [1, 2, -1_000_000_000],
      ];
      expect(dagShortestPath(3, edges, 0)).toEqual([
        0,
        -1_000_000_000,
        -2_000_000_000,
      ]);
    });
  });

  // 성능 테스트
  describe("성능 테스트", () => {
    test("V=10^4, E≈5*10^4 DAG 성능 (O(V+E)이므로 100ms 이내)", () => {
      const V = 10_000;
      const edges: [number, number, number][] = [];

      // u < v로만 간선 추가 → 자연스럽게 DAG
      for (let i = 0; i + 1 < V; i++) {
        edges.push([i, i + 1, 1]);
      }
      let seed = 246810;
      const rand = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed;
      };
      for (let i = 0; i < V * 4; i++) {
        const a = rand() % V;
        const b = rand() % V;
        if (a < b) {
          edges.push([a, b, (rand() % 1000) + 1]);
        }
      }

      const start = performance.now();
      const dist = dagShortestPath(V, edges, 0);
      const elapsed = performance.now() - start;

      expect(dist[0]).toBe(0);
      expect(dist.length).toBe(V);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
