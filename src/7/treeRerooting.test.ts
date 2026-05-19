import { test, expect, describe } from "bun:test";
import { treeRerooting } from "./treeRerooting";

describe("treeRerooting", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("단일 노드: 거리 합은 0", () => {
      expect(treeRerooting(1, [])).toEqual([0]);
    });

    test("두 노드: 각 정점은 다른 한 정점까지 거리 1", () => {
      expect(treeRerooting(2, [[0, 1]])).toEqual([1, 1]);
    });

    test("세 정점 경로 0-1-2", () => {
      // S(0) = 1 + 2 = 3
      // S(1) = 1 + 1 = 2
      // S(2) = 2 + 1 = 3
      expect(
        treeRerooting(3, [
          [0, 1],
          [1, 2],
        ])
      ).toEqual([3, 2, 3]);
    });

    test("작은 분기 트리", () => {
      //      0
      //     / \
      //    1   2
      //   /
      //  3
      // S(0)=1+1+2=4, S(1)=1+2+1=4, S(2)=2+1+3=6, S(3)=2+1+3=6
      expect(
        treeRerooting(4, [
          [0, 1],
          [0, 2],
          [1, 3],
        ])
      ).toEqual([4, 4, 6, 6]);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("체인 트리 (n=5)", () => {
      // 0-1-2-3-4
      // S(0) = 1+2+3+4 = 10
      // S(1) = 1+1+2+3 = 7
      // S(2) = 2+1+1+2 = 6
      // S(3) = 3+2+1+1 = 7
      // S(4) = 4+3+2+1 = 10
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
      ];
      expect(treeRerooting(5, edges)).toEqual([10, 7, 6, 7, 10]);
    });

    test("스타 트리 (n=5)", () => {
      // 중심 0, 잎 1..4
      // S(0) = 4 (모든 잎까지 거리 1)
      // S(잎) = 1(중심) + 3*2(다른 잎까지 거리 2) = 7
      const edges: [number, number][] = [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
      ];
      expect(treeRerooting(5, edges)).toEqual([4, 7, 7, 7, 7]);
    });

    test("균형 이진 트리 깊이 2", () => {
      //         0
      //       /   \
      //      1     2
      //     / \   / \
      //    3   4 5   6
      // S(0) = 1+1+2+2+2+2 = 10
      // S(1) = 1+2+1+1+3+3 = 11
      // S(3) = 2+1+3+2+4+4 = 16
      const edges: [number, number][] = [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
        [2, 5],
        [2, 6],
      ];
      const result = treeRerooting(7, edges);
      expect(result[0]).toBe(10);
      expect(result[1]).toBe(11);
      expect(result[2]).toBe(11);
      expect(result[3]).toBe(16);
      expect(result[4]).toBe(16);
      expect(result[5]).toBe(16);
      expect(result[6]).toBe(16);
    });

    test("정점 순서가 뒤섞인 간선 입력에도 정확히 계산", () => {
      // 0-1-2, 입력은 [2,1],[1,0]
      const edges: [number, number][] = [
        [2, 1],
        [1, 0],
      ];
      expect(treeRerooting(3, edges)).toEqual([3, 2, 3]);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("n=1", () => {
      expect(treeRerooting(1, [])).toEqual([0]);
    });

    test("n=2", () => {
      expect(treeRerooting(2, [[1, 0]])).toEqual([1, 1]);
    });
  });

  // 성능 테스트
  describe("성능 테스트", () => {
    test("체인 트리 n=100,000을 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const edges: [number, number][] = [];
      for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);

      const start = performance.now();
      const result = treeRerooting(n, edges);
      const elapsed = performance.now() - start;

      expect(result).toHaveLength(n);
      // 양 끝점의 거리 합 = 0+1+...+(n-1) = n*(n-1)/2
      expect(result[0]).toBe((n * (n - 1)) / 2);
      expect(result[n - 1]).toBe((n * (n - 1)) / 2);
      expect(elapsed).toBeLessThan(100);
    });

    test("스타 트리 n=100,000을 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const edges: [number, number][] = [];
      for (let i = 1; i < n; i++) edges.push([0, i]);

      const start = performance.now();
      const result = treeRerooting(n, edges);
      const elapsed = performance.now() - start;

      expect(result).toHaveLength(n);
      expect(result[0]).toBe(n - 1);
      // 잎: 중심까지 1 + (n-2)*2
      expect(result[1]).toBe(1 + (n - 2) * 2);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
