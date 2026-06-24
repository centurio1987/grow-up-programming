import { test, expect, describe } from "bun:test";
import { treeDiameter } from "./treeDiameter";

describe("treeDiameter", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("단일 노드 트리 → 지름 0", () => {
      expect(treeDiameter(1, [])).toBe(0);
    });

    test("두 노드, 가중치 5 → 지름 5", () => {
      expect(treeDiameter(2, [[0, 1, 5]])).toBe(5);
    });

    test("작은 트리에서 가장 긴 경로를 반환한다", () => {
      // 0 - 1 (w=1), 1 - 2 (w=2), 1 - 3 (w=3)
      // 가장 긴 경로: 2 - 1 - 3 = 5
      expect(
        treeDiameter(4, [
          [0, 1, 1],
          [1, 2, 2],
          [1, 3, 3],
        ])
      ).toBe(5);
    });

    test("Y자 모양 트리", () => {
      // 0-1(2), 1-2(3), 1-3(4), 3-4(1)
      // 2-1-3-4 = 3+4+1 = 8
      expect(
        treeDiameter(5, [
          [0, 1, 2],
          [1, 2, 3],
          [1, 3, 4],
          [3, 4, 1],
        ])
      ).toBe(8);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("체인 트리 (선형) → 양 끝점 간 거리", () => {
      // 0-1-2-3-4, 각 가중치 2 → 지름 8
      const edges: [number, number, number][] = [];
      for (let i = 0; i < 4; i++) edges.push([i, i + 1, 2]);
      expect(treeDiameter(5, edges)).toBe(8);
    });

    test("스타 트리 → 잎-중심-잎 = 두 잎 가중치 중 최대 두 개의 합", () => {
      // 0이 중심, 1,2,3,4가 잎. 가중치 1,2,3,4
      // 최댓값 두 개: 4 + 3 = 7
      expect(
        treeDiameter(5, [
          [0, 1, 1],
          [0, 2, 2],
          [0, 3, 3],
          [0, 4, 4],
        ])
      ).toBe(7);
    });

    test("가중치가 0인 간선", () => {
      expect(
        treeDiameter(3, [
          [0, 1, 0],
          [1, 2, 0],
        ])
      ).toBe(0);
    });

    test("이진 트리 균형 형태", () => {
      // 0
      // ├ 1 ─ 3, 4
      // └ 2 ─ 5, 6
      // 3-1-0-2-5 = 1+1+1+1 = 4
      expect(
        treeDiameter(7, [
          [0, 1, 1],
          [0, 2, 1],
          [1, 3, 1],
          [1, 4, 1],
          [2, 5, 1],
          [2, 6, 1],
        ])
      ).toBe(4);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("n=1, 간선 없음", () => {
      expect(treeDiameter(1, [])).toBe(0);
    });

    test("n=2 (최소 간선)", () => {
      expect(treeDiameter(2, [[0, 1, 1000]])).toBe(1000);
    });

    test("큰 가중치 간선", () => {
      expect(
        treeDiameter(3, [
          [0, 1, 1_000_000],
          [1, 2, 1_000_000],
        ])
      ).toBe(2_000_000);
    });
  });

  // 성능 테스트
  describe("성능 테스트", () => {
    test("체인 트리 n=100,000을 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const edges: [number, number, number][] = [];
      for (let i = 0; i < n - 1; i++) edges.push([i, i + 1, 1]);

      const start = performance.now();
      const result = treeDiameter(n, edges);
      const elapsed = performance.now() - start;

      expect(result).toBe(n - 1);
      expect(elapsed).toBeLessThan(100);
    });

    test("스타 트리 n=100,000을 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const edges: [number, number, number][] = [];
      for (let i = 1; i < n; i++) edges.push([0, i, 1]);

      const start = performance.now();
      const result = treeDiameter(n, edges);
      const elapsed = performance.now() - start;

      expect(result).toBe(2);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
