import { test, expect, describe } from "bun:test";
import { aStarSearch } from "./aStarSearch";

describe("aStarSearch", () => {
  const zeroH = (_v: number) => 0;

  // 기본 동작
  describe("기본 동작", () => {
    test("src === goal 이면 비용은 0", () => {
      expect(aStarSearch(3, [], 0, 0, zeroH)).toBe(0);
    });

    test("선형 그래프, h=0 (Dijkstra와 동일)", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 2, 2],
        [2, 3, 3],
      ];
      expect(aStarSearch(4, edges, 0, 3, zeroH)).toBe(6);
    });

    test("간접 경로가 더 짧은 경우", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 2, 1],
        [0, 2, 5],
      ];
      expect(aStarSearch(3, edges, 0, 2, zeroH)).toBe(2);
    });

    test("admissible 휴리스틱 (목표에 가까울수록 작음)", () => {
      // 0→1→2→3 선형. h는 goal까지 남은 정점 수
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
        [0, 2, 10],
      ];
      const h = (v: number) => Math.max(0, 3 - v);
      expect(aStarSearch(4, edges, 0, 3, h)).toBe(3);
    });

    test("격자 그래프 - 휴리스틱이 탐색을 가속해도 최단 비용은 동일", () => {
      // 3x3 격자: (r,c) = r*3+c
      const idx = (r: number, c: number) => r * 3 + c;
      const edges: [number, number, number][] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (r + 1 < 3) {
            edges.push([idx(r, c), idx(r + 1, c), 1]);
            edges.push([idx(r + 1, c), idx(r, c), 1]);
          }
          if (c + 1 < 3) {
            edges.push([idx(r, c), idx(r, c + 1), 1]);
            edges.push([idx(r, c + 1), idx(r, c), 1]);
          }
        }
      }
      // 맨해튼 거리 휴리스틱 (admissible)
      const goal = idx(2, 2);
      const h = (v: number) => {
        const r = Math.floor(v / 3);
        const c = v % 3;
        return Math.abs(2 - r) + Math.abs(2 - c);
      };
      expect(aStarSearch(9, edges, idx(0, 0), goal, h)).toBe(4);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("도달 불가능한 goal은 Infinity", () => {
      const edges: [number, number, number][] = [[0, 1, 1]];
      expect(aStarSearch(3, edges, 0, 2, zeroH)).toBe(Infinity);
    });

    test("간선이 없고 src !== goal", () => {
      expect(aStarSearch(2, [], 0, 1, zeroH)).toBe(Infinity);
    });

    test("다중 간선 - 작은 가중치 채택", () => {
      const edges: [number, number, number][] = [
        [0, 1, 10],
        [0, 1, 3],
      ];
      expect(aStarSearch(2, edges, 0, 1, zeroH)).toBe(3);
    });

    test("가중치 0 처리", () => {
      const edges: [number, number, number][] = [
        [0, 1, 0],
        [1, 2, 0],
      ];
      expect(aStarSearch(3, edges, 0, 2, zeroH)).toBe(0);
    });

    test("방향성 - 역방향 간선 없으면 도달 불가능", () => {
      const edges: [number, number, number][] = [[0, 1, 5]];
      expect(aStarSearch(2, edges, 1, 0, zeroH)).toBe(Infinity);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("V=1, src=goal=0", () => {
      expect(aStarSearch(1, [], 0, 0, zeroH)).toBe(0);
    });

    test("큰 가중치 (10^9)", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1_000_000_000],
        [1, 2, 1_000_000_000],
      ];
      expect(aStarSearch(3, edges, 0, 2, zeroH)).toBe(2_000_000_000);
    });

    test("zero 휴리스틱은 Dijkstra와 같은 결과", () => {
      const edges: [number, number, number][] = [
        [0, 1, 4],
        [0, 2, 2],
        [2, 1, 1],
      ];
      expect(aStarSearch(3, edges, 0, 1, zeroH)).toBe(3);
    });
  });

  // 성능 테스트
  describe("성능 테스트", () => {
    test("V=10^4, E≈5*10^4 그래프에서 100ms 이내 처리", () => {
      const V = 10_000;
      const edges: [number, number, number][] = [];
      for (let i = 0; i + 1 < V; i++) {
        edges.push([i, i + 1, 1]);
      }
      let seed = 654321;
      const rand = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed;
      };
      for (let i = 0; i < V * 4; i++) {
        const u = rand() % V;
        const v = rand() % V;
        const w = (rand() % 1000) + 1;
        edges.push([u, v, w]);
      }

      const goal = V - 1;
      // admissible: 0 항상 OK
      const h = (_v: number) => 0;

      const start = performance.now();
      const cost = aStarSearch(V, edges, 0, goal, h);
      const elapsed = performance.now() - start;

      expect(cost).toBeLessThanOrEqual(V - 1);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
