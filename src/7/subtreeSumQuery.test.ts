import { test, expect, describe } from "bun:test";
import { SubtreeSumQuery } from "./subtreeSumQuery";

describe("SubtreeSumQuery", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("단일 노드 트리: 루트의 부분 트리 합 = 루트 값", () => {
      const sst = new SubtreeSumQuery(1, [], 0, [42]);
      expect(sst.querySubtree(0)).toBe(42);
    });

    test("두 노드 트리에서 루트의 부분 트리 합 = 두 값의 합", () => {
      const sst = new SubtreeSumQuery(2, [[0, 1]], 0, [1, 2]);
      expect(sst.querySubtree(0)).toBe(3);
      expect(sst.querySubtree(1)).toBe(2);
    });

    test("작은 트리에서 부분 트리 합", () => {
      //        0(1)
      //       /    \
      //      1(2)   2(3)
      //     /
      //    3(4)
      const sst = new SubtreeSumQuery(
        4,
        [
          [0, 1],
          [0, 2],
          [1, 3],
        ],
        0,
        [1, 2, 3, 4]
      );
      expect(sst.querySubtree(0)).toBe(10);
      expect(sst.querySubtree(1)).toBe(6);
      expect(sst.querySubtree(2)).toBe(3);
      expect(sst.querySubtree(3)).toBe(4);
    });

    test("update 후 query 결과가 갱신된다", () => {
      const sst = new SubtreeSumQuery(
        3,
        [
          [0, 1],
          [0, 2],
        ],
        0,
        [1, 2, 3]
      );
      expect(sst.querySubtree(0)).toBe(6);
      sst.update(1, 10);
      expect(sst.querySubtree(0)).toBe(14);
      expect(sst.querySubtree(1)).toBe(10);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("체인 트리에서 각 정점의 부분 트리 합", () => {
      // 0-1-2-3-4, 값 1,2,3,4,5
      const n = 5;
      const edges: [number, number][] = [];
      for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);
      const sst = new SubtreeSumQuery(n, edges, 0, [1, 2, 3, 4, 5]);
      expect(sst.querySubtree(0)).toBe(15);
      expect(sst.querySubtree(1)).toBe(14);
      expect(sst.querySubtree(2)).toBe(12);
      expect(sst.querySubtree(3)).toBe(9);
      expect(sst.querySubtree(4)).toBe(5);
    });

    test("스타 트리에서 부분 트리 합", () => {
      // 중심 0, 잎 1..4. 값: 10, 1, 2, 3, 4
      const sst = new SubtreeSumQuery(
        5,
        [
          [0, 1],
          [0, 2],
          [0, 3],
          [0, 4],
        ],
        0,
        [10, 1, 2, 3, 4]
      );
      expect(sst.querySubtree(0)).toBe(20);
      expect(sst.querySubtree(1)).toBe(1);
      expect(sst.querySubtree(4)).toBe(4);
    });

    test("값이 음수인 경우", () => {
      const sst = new SubtreeSumQuery(
        3,
        [
          [0, 1],
          [0, 2],
        ],
        0,
        [-1, -2, -3]
      );
      expect(sst.querySubtree(0)).toBe(-6);
    });

    test("update로 음수 값을 설정", () => {
      const sst = new SubtreeSumQuery(2, [[0, 1]], 0, [5, 5]);
      sst.update(1, -10);
      expect(sst.querySubtree(0)).toBe(-5);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("n=1 단일 노드, update와 query", () => {
      const sst = new SubtreeSumQuery(1, [], 0, [0]);
      expect(sst.querySubtree(0)).toBe(0);
      sst.update(0, 100);
      expect(sst.querySubtree(0)).toBe(100);
    });

    test("동일 정점에 update 여러 번", () => {
      const sst = new SubtreeSumQuery(2, [[0, 1]], 0, [1, 1]);
      sst.update(1, 5);
      sst.update(1, 7);
      expect(sst.querySubtree(0)).toBe(8);
    });
  });

  // 성능 테스트
  describe("성능 테스트", () => {
    test("체인 트리 n=10,000, 연산 10,000회를 100ms 이내에 처리한다", () => {
      const n = 10_000;
      const edges: [number, number][] = [];
      for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);
      const values = new Array(n).fill(1);

      const start = performance.now();
      const sst = new SubtreeSumQuery(n, edges, 0, values);
      for (let i = 0; i < 5000; i++) {
        sst.update(i % n, i);
        sst.querySubtree((i * 3) % n);
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    test("스타 트리 n=100,000, 연산 1,000회를 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const edges: [number, number][] = [];
      for (let i = 1; i < n; i++) edges.push([0, i]);
      const values = new Array(n).fill(1);

      const start = performance.now();
      const sst = new SubtreeSumQuery(n, edges, 0, values);
      expect(sst.querySubtree(0)).toBe(n);
      for (let i = 0; i < 500; i++) {
        sst.update(1 + (i % (n - 1)), 2);
        sst.querySubtree(0);
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });
});
