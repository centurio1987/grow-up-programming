import { test, expect, describe } from "bun:test";
import { isBipartite } from "./isBipartite";

describe("isBipartite", () => {
  describe("기본 동작", () => {
    test("짝수 길이 사이클 C4 → 이분", () => {
      // 0-1-2-3-0
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
      ];
      expect(isBipartite(4, edges)).toBe(true);
    });

    test("홀수 길이 사이클 C3 → 이분 아님", () => {
      // 0-1-2-0 (삼각형)
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 0],
      ];
      expect(isBipartite(3, edges)).toBe(false);
    });

    test("완전 이분 그래프 K_{2,3} → 이분", () => {
      // 왼쪽 {0,1}, 오른쪽 {2,3,4}
      const edges: [number, number][] = [
        [0, 2],
        [0, 3],
        [0, 4],
        [1, 2],
        [1, 3],
        [1, 4],
      ];
      expect(isBipartite(5, edges)).toBe(true);
    });

    test("트리 → 항상 이분", () => {
      const edges: [number, number][] = [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
        [2, 5],
      ];
      expect(isBipartite(6, edges)).toBe(true);
    });
  });

  describe("엣지 케이스", () => {
    test("정점 1개, 간선 없음 → 이분 (자명)", () => {
      expect(isBipartite(1, [])).toBe(true);
    });

    test("간선 없음, 정점 다수 → 이분", () => {
      expect(isBipartite(10, [])).toBe(true);
    });

    test("분리된 컴포넌트: 하나는 짝수 사이클, 다른 하나는 홀수 사이클 → 이분 아님", () => {
      // 컴포넌트 1: 0-1-2-3-0 (짝수)
      // 컴포넌트 2: 4-5-6-4 (홀수)
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [4, 5],
        [5, 6],
        [6, 4],
      ];
      expect(isBipartite(7, edges)).toBe(false);
    });

    test("분리된 컴포넌트가 모두 이분 → 이분", () => {
      const edges: [number, number][] = [
        [0, 1],
        [2, 3],
        [4, 5],
      ];
      expect(isBipartite(6, edges)).toBe(true);
    });

    test("자기 루프 → 홀수 길이 사이클이므로 이분 아님", () => {
      const edges: [number, number][] = [[0, 0]];
      expect(isBipartite(1, edges)).toBe(false);
    });

    test("중복 간선이 있어도 이분 판정에는 영향 없음", () => {
      const edges: [number, number][] = [
        [0, 1],
        [0, 1],
        [1, 2],
      ];
      expect(isBipartite(3, edges)).toBe(true);
    });
  });

  describe("바운더리", () => {
    test("정점 2개, 간선 1개 → 이분", () => {
      expect(isBipartite(2, [[0, 1]])).toBe(true);
    });

    test("C5 (5-cycle) → 홀수 사이클이라 이분 아님", () => {
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 0],
      ];
      expect(isBipartite(5, edges)).toBe(false);
    });
  });

  describe("성능", () => {
    test("V=1e5, E=2e5 입력을 100ms 이내에 처리한다", () => {
      const V = 100_000;
      const edges: [number, number][] = [];
      // 짝수 길이 사이클이 되도록 일자 경로 (이분 그래프)
      for (let i = 0; i < V - 1; i++) {
        edges.push([i, i + 1]);
      }
      // 추가로 매칭 형태 간선 (홀수 사이클 안 만들도록 거리 2)
      for (let i = 0; i + 3 < V && edges.length < 200_000; i += 4) {
        edges.push([i, i + 3]);
      }

      const start = performance.now();
      const result = isBipartite(V, edges);
      const elapsed = performance.now() - start;
      expect(result).toBe(true);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
