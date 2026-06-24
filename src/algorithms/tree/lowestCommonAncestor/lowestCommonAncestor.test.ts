import { test, expect, describe } from "bun:test";
import { lowestCommonAncestor } from "./lowestCommonAncestor";

describe("lowestCommonAncestor", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("단일 노드 트리에서 (0,0) LCA는 0", () => {
      expect(lowestCommonAncestor(1, [], 0, [[0, 0]])).toEqual([0]);
    });

    test("두 노드 트리에서 LCA는 루트", () => {
      // 0 - 1, root=0 → LCA(0,1)=0, LCA(1,1)=1
      expect(
        lowestCommonAncestor(
          2,
          [[0, 1]],
          0,
          [
            [0, 1],
            [1, 1],
          ]
        )
      ).toEqual([0, 1]);
    });

    test("간단한 트리에서 LCA를 반환한다", () => {
      //        0
      //       / \
      //      1   2
      //     / \   \
      //    3   4   5
      const edges: [number, number][] = [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
        [2, 5],
      ];
      const queries: [number, number][] = [
        [3, 4], // LCA = 1
        [3, 5], // LCA = 0
        [4, 5], // LCA = 0
        [3, 1], // LCA = 1
        [5, 0], // LCA = 0
      ];
      expect(lowestCommonAncestor(6, edges, 0, queries)).toEqual([1, 0, 0, 1, 0]);
    });

    test("자기 자신의 LCA는 자기 자신", () => {
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
      ];
      expect(lowestCommonAncestor(3, edges, 0, [[2, 2]])).toEqual([2]);
    });

    test("조상-자손 관계의 LCA는 조상", () => {
      // 0 → 1 → 2 → 3
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
      ];
      expect(
        lowestCommonAncestor(
          4,
          edges,
          0,
          [
            [0, 3],
            [1, 3],
          ]
        )
      ).toEqual([0, 1]);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("체인 트리에서 LCA는 더 얕은 노드", () => {
      const n = 6;
      const edges: [number, number][] = [];
      for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);
      // root=0, chain 0→1→2→3→4→5
      expect(
        lowestCommonAncestor(
          n,
          edges,
          0,
          [
            [2, 5],
            [1, 4],
            [3, 3],
          ]
        )
      ).toEqual([2, 1, 3]);
    });

    test("스타 트리에서 잎 두 개의 LCA는 중심", () => {
      // 중심 0, 잎 1..4
      const edges: [number, number][] = [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
      ];
      expect(
        lowestCommonAncestor(
          5,
          edges,
          0,
          [
            [1, 2],
            [3, 4],
            [1, 4],
          ]
        )
      ).toEqual([0, 0, 0]);
    });

    test("질의가 비어있을 때 빈 배열을 반환한다", () => {
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
      ];
      expect(lowestCommonAncestor(3, edges, 0, [])).toEqual([]);
    });

    test("루트를 0이 아닌 다른 정점으로 지정", () => {
      // 트리 구조: 0-1, 1-2, 2-3, root=2
      // root=2 기준: 2의 자식은 1과 3, 1의 자식은 0
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
      ];
      // LCA(0, 3) with root=2 → 2
      // LCA(0, 1) with root=2 → 1
      expect(
        lowestCommonAncestor(
          4,
          edges,
          2,
          [
            [0, 3],
            [0, 1],
          ]
        )
      ).toEqual([2, 1]);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("n=1, 자기 자신 질의", () => {
      expect(lowestCommonAncestor(1, [], 0, [[0, 0]])).toEqual([0]);
    });

    test("n=2 최소 트리", () => {
      expect(lowestCommonAncestor(2, [[0, 1]], 0, [[1, 0]])).toEqual([0]);
    });
  });

  // 성능 테스트
  describe("성능 테스트", () => {
    test("체인 트리 n=10,000, 질의 10,000개를 100ms 이내에 처리한다", () => {
      const n = 10_000;
      const edges: [number, number][] = [];
      for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);
      const queries: [number, number][] = [];
      for (let i = 0; i < 10_000; i++) {
        queries.push([i % n, (i * 7) % n]);
      }

      const start = performance.now();
      const result = lowestCommonAncestor(n, edges, 0, queries);
      const elapsed = performance.now() - start;

      expect(result).toHaveLength(queries.length);
      expect(elapsed).toBeLessThan(100);
    });

    test("스타 트리 n=100,000, 질의 1,000개를 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const edges: [number, number][] = [];
      for (let i = 1; i < n; i++) edges.push([0, i]);
      const queries: [number, number][] = [];
      for (let i = 0; i < 1000; i++) {
        queries.push([1 + (i % (n - 1)), 1 + ((i * 13) % (n - 1))]);
      }

      const start = performance.now();
      const result = lowestCommonAncestor(n, edges, 0, queries);
      const elapsed = performance.now() - start;

      expect(result).toHaveLength(queries.length);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
