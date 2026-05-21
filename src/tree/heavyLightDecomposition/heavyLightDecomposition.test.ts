import { test, expect, describe } from "bun:test";
import { HeavyLightDecomposition } from "./heavyLightDecomposition";

describe("HeavyLightDecomposition", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("단일 노드 트리에서 경로 합 = 자기 자신", () => {
      const hld = new HeavyLightDecomposition(1, [], 0, [7]);
      expect(hld.queryPath(0, 0)).toBe(7);
    });

    test("두 노드 트리에서 경로 합", () => {
      const hld = new HeavyLightDecomposition(2, [[0, 1]], 0, [3, 4]);
      expect(hld.queryPath(0, 1)).toBe(7);
      expect(hld.queryPath(0, 0)).toBe(3);
    });

    test("작은 트리에서 경로 합", () => {
      //        0(1)
      //       /    \
      //      1(2)   2(3)
      //     / \      \
      //    3(4) 4(5)  5(6)
      const hld = new HeavyLightDecomposition(
        6,
        [
          [0, 1],
          [0, 2],
          [1, 3],
          [1, 4],
          [2, 5],
        ],
        0,
        [1, 2, 3, 4, 5, 6]
      );
      expect(hld.queryPath(3, 4)).toBe(4 + 2 + 5); // 3-1-4
      expect(hld.queryPath(3, 5)).toBe(4 + 2 + 1 + 3 + 6); // 3-1-0-2-5
      expect(hld.queryPath(0, 5)).toBe(1 + 3 + 6);
    });

    test("update 후 경로 합이 갱신된다", () => {
      const hld = new HeavyLightDecomposition(
        3,
        [
          [0, 1],
          [1, 2],
        ],
        0,
        [1, 2, 3]
      );
      expect(hld.queryPath(0, 2)).toBe(6);
      hld.update(1, 10);
      expect(hld.queryPath(0, 2)).toBe(14);
    });

    test("같은 정점 두 번 입력 시 해당 정점 값만 반환", () => {
      const hld = new HeavyLightDecomposition(
        3,
        [
          [0, 1],
          [1, 2],
        ],
        0,
        [5, 10, 15]
      );
      expect(hld.queryPath(1, 1)).toBe(10);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("체인 트리에서 양 끝점 경로 합 = 전체 합", () => {
      const n = 5;
      const edges: [number, number][] = [];
      for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);
      const values = [1, 2, 3, 4, 5];
      const hld = new HeavyLightDecomposition(n, edges, 0, values);
      expect(hld.queryPath(0, n - 1)).toBe(15);
      expect(hld.queryPath(1, 3)).toBe(2 + 3 + 4);
    });

    test("스타 트리에서 잎-잎 경로는 중심을 거친다", () => {
      const hld = new HeavyLightDecomposition(
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
      expect(hld.queryPath(1, 2)).toBe(1 + 10 + 2);
      expect(hld.queryPath(3, 4)).toBe(3 + 10 + 4);
    });

    test("음수 값이 포함된 경로", () => {
      const hld = new HeavyLightDecomposition(
        3,
        [
          [0, 1],
          [1, 2],
        ],
        0,
        [-1, -2, -3]
      );
      expect(hld.queryPath(0, 2)).toBe(-6);
    });

    test("update로 같은 정점 여러 번 갱신", () => {
      const hld = new HeavyLightDecomposition(2, [[0, 1]], 0, [0, 0]);
      hld.update(0, 5);
      hld.update(0, 7);
      expect(hld.queryPath(0, 1)).toBe(7);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("n=1, 자기 자신 경로", () => {
      const hld = new HeavyLightDecomposition(1, [], 0, [100]);
      expect(hld.queryPath(0, 0)).toBe(100);
      hld.update(0, 200);
      expect(hld.queryPath(0, 0)).toBe(200);
    });

    test("n=2 최소 트리 경로", () => {
      const hld = new HeavyLightDecomposition(2, [[0, 1]], 0, [1, 1]);
      expect(hld.queryPath(1, 0)).toBe(2);
    });
  });

  // 성능 테스트
  describe("성능 테스트", () => {
    test("체인 트리 n=10,000, 연산 5,000회를 100ms 이내에 처리한다", () => {
      const n = 10_000;
      const edges: [number, number][] = [];
      for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);
      const values = new Array(n).fill(1);

      const start = performance.now();
      const hld = new HeavyLightDecomposition(n, edges, 0, values);
      for (let i = 0; i < 2500; i++) {
        hld.update(i % n, 2);
        hld.queryPath(i % n, (i * 7) % n);
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
      const hld = new HeavyLightDecomposition(n, edges, 0, values);
      for (let i = 0; i < 500; i++) {
        hld.update(1 + (i % (n - 1)), 3);
        hld.queryPath(1 + (i % (n - 1)), 1 + ((i * 11) % (n - 1)));
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });
});
