import { test, expect, describe } from "bun:test";
import { dijkstra } from "./dijkstra";

describe("dijkstra", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("단일 정점, 자기 자신까지의 거리는 0", () => {
      expect(dijkstra(1, [], 0)).toEqual([0]);
    });

    test("선형 그래프 0→1→2→3, 가중치 1", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
      ];
      expect(dijkstra(4, edges, 0)).toEqual([0, 1, 2, 3]);
    });

    test("여러 경로 중 최단 경로를 선택한다", () => {
      // 0→1(1), 0→2(4), 1→2(2): 0→2의 최단은 0→1→2 = 3
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [0, 2, 4],
        [1, 2, 2],
      ];
      expect(dijkstra(3, edges, 0)).toEqual([0, 1, 3]);
    });

    test("방향 그래프: 역방향 간선은 사용 불가", () => {
      const edges: [number, number, number][] = [
        [0, 1, 5],
        [1, 0, 2],
      ];
      expect(dijkstra(2, edges, 0)).toEqual([0, 5]);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("도달 불가능한 정점은 Infinity", () => {
      const edges: [number, number, number][] = [[0, 1, 3]];
      expect(dijkstra(3, edges, 0)).toEqual([0, 3, Infinity]);
    });

    test("간선이 전혀 없을 때 시작점만 0, 나머지 Infinity", () => {
      expect(dijkstra(3, [], 1)).toEqual([Infinity, 0, Infinity]);
    });

    test("동일한 두 정점 사이 다중 간선 - 더 작은 가중치 채택", () => {
      const edges: [number, number, number][] = [
        [0, 1, 10],
        [0, 1, 3],
        [0, 1, 7],
      ];
      expect(dijkstra(2, edges, 0)).toEqual([0, 3]);
    });

    test("가중치 0인 간선 처리", () => {
      const edges: [number, number, number][] = [
        [0, 1, 0],
        [1, 2, 0],
      ];
      expect(dijkstra(3, edges, 0)).toEqual([0, 0, 0]);
    });

    test("자기 자신을 가리키는 간선 (셀프 루프)", () => {
      const edges: [number, number, number][] = [
        [0, 0, 5],
        [0, 1, 2],
      ];
      expect(dijkstra(2, edges, 0)).toEqual([0, 2]);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("큰 가중치(10^9)도 정상 처리", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1_000_000_000],
        [1, 2, 1_000_000_000],
      ];
      expect(dijkstra(3, edges, 0)).toEqual([0, 1_000_000_000, 2_000_000_000]);
    });

    test("시작점이 마지막 정점", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 2, 1],
        [2, 0, 1],
      ];
      // src=2 → 0(1), 1(2), 2(0)
      expect(dijkstra(3, edges, 2)).toEqual([1, 2, 0]);
    });

    test("완전 그래프 (V=5)", () => {
      const edges: [number, number, number][] = [];
      const n = 5;
      for (let u = 0; u < n; u++) {
        for (let v = 0; v < n; v++) {
          if (u !== v) edges.push([u, v, 1]);
        }
      }
      expect(dijkstra(n, edges, 0)).toEqual([0, 1, 1, 1, 1]);
    });
  });

  // 성능 테스트
  describe("성능 테스트", () => {
    test("V=10^4, E≈5*10^4 그래프를 100ms 이내 처리", () => {
      const V = 10_000;
      const edges: [number, number, number][] = [];

      // 선형 체인 + 무작위 간선
      for (let i = 0; i + 1 < V; i++) {
        edges.push([i, i + 1, 1]);
      }
      // 추가로 V*4 개의 무작위 간선
      let seed = 123456789;
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

      const start = performance.now();
      const dist = dijkstra(V, edges, 0);
      const elapsed = performance.now() - start;

      expect(dist[0]).toBe(0);
      expect(dist.length).toBe(V);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
