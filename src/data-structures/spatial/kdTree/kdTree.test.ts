import { test, expect, describe } from "bun:test";
import { KDTree } from "./kdTree";
import type { Point2D } from "./kdTree";

describe("KDTree", () => {
  describe("기본", () => {
    test("빈 생성자로 트리를 만들 수 있다", () => {
      const tree = new KDTree();
      expect(tree.size()).toBe(0);
    });

    test("points 배열로 초기 트리를 구성할 수 있다", () => {
      const points: Point2D[] = [[1, 2], [3, 4], [5, 6]];
      const tree = new KDTree(points);
      expect(tree.size()).toBe(3);
    });

    test("insert로 점을 하나씩 추가할 수 있다", () => {
      const tree = new KDTree();
      tree.insert([1, 1]);
      tree.insert([2, 2]);
      tree.insert([3, 3]);
      expect(tree.size()).toBe(3);
    });

    test("중복 좌표도 삽입할 수 있다", () => {
      const tree = new KDTree();
      tree.insert([1, 1]);
      tree.insert([1, 1]);
      expect(tree.size()).toBe(2);
    });
  });

  describe("nearestNeighbor", () => {
    test("단일 점에서 최근접 이웃은 그 점 자신이다", () => {
      const tree = new KDTree([[3, 4]]);
      expect(tree.nearestNeighbor([3, 4])).toEqual([3, 4]);
    });

    test("쿼리 점과 정확히 일치하는 점이 있으면 반환한다", () => {
      const points: Point2D[] = [[1, 2], [3, 4], [5, 6]];
      const tree = new KDTree(points);
      expect(tree.nearestNeighbor([3, 4])).toEqual([3, 4]);
    });

    test("가장 가까운 점을 올바르게 찾는다 (간단한 케이스)", () => {
      const points: Point2D[] = [[0, 0], [10, 10], [1, 1]];
      const tree = new KDTree(points);
      const result = tree.nearestNeighbor([2, 2]);
      expect(result).toEqual([1, 1]);
    });

    test("음수 좌표에서도 최근접 이웃을 찾는다", () => {
      const points: Point2D[] = [[-5, -5], [5, 5], [-1, -1]];
      const tree = new KDTree(points);
      const result = tree.nearestNeighbor([-2, -2]);
      expect(result).toEqual([-1, -1]);
    });

    test("여러 축에 걸쳐 가장 가까운 점을 선택한다", () => {
      // (3, 0)에서 가장 가까운 점: (3, 1) — 거리 1, (0, 0) — 거리 3
      const points: Point2D[] = [[0, 0], [3, 1], [6, 6]];
      const tree = new KDTree(points);
      const result = tree.nearestNeighbor([3, 0]);
      expect(result).toEqual([3, 1]);
    });

    test("insert 후 nearestNeighbor가 갱신된 결과를 반환한다", () => {
      const tree = new KDTree([[10, 10]]);
      tree.insert([1, 1]);
      const result = tree.nearestNeighbor([0, 0]);
      expect(result).toEqual([1, 1]);
    });

    test("빈 트리에서 nearestNeighbor는 undefined를 반환한다", () => {
      const tree = new KDTree();
      expect(tree.nearestNeighbor([0, 0])).toBeUndefined();
    });
  });

  describe("rangeSearch", () => {
    test("직사각형 범위 내 모든 점을 반환한다", () => {
      const points: Point2D[] = [[1, 1], [2, 2], [3, 3], [5, 5], [6, 6]];
      const tree = new KDTree(points);
      const result = tree.rangeSearch([0, 0], [4, 4]);
      expect(result.length).toBe(3);
      expect(result).toContainEqual([1, 1]);
      expect(result).toContainEqual([2, 2]);
      expect(result).toContainEqual([3, 3]);
    });

    test("경계에 있는 점도 포함한다", () => {
      const points: Point2D[] = [[0, 0], [5, 5], [10, 10]];
      const tree = new KDTree(points);
      const result = tree.rangeSearch([0, 0], [5, 5]);
      expect(result.length).toBe(2);
      expect(result).toContainEqual([0, 0]);
      expect(result).toContainEqual([5, 5]);
    });

    test("범위 밖의 점은 반환하지 않는다", () => {
      const points: Point2D[] = [[1, 1], [10, 10]];
      const tree = new KDTree(points);
      const result = tree.rangeSearch([0, 0], [5, 5]);
      expect(result).not.toContainEqual([10, 10]);
    });

    test("범위 내 점이 없으면 빈 배열을 반환한다", () => {
      const points: Point2D[] = [[10, 10], [20, 20]];
      const tree = new KDTree(points);
      const result = tree.rangeSearch([0, 0], [5, 5]);
      expect(result).toEqual([]);
    });

    test("빈 트리에서 rangeSearch는 빈 배열을 반환한다", () => {
      const tree = new KDTree();
      expect(tree.rangeSearch([0, 0], [10, 10])).toEqual([]);
    });

    test("음수 범위에서도 정상 동작한다", () => {
      const points: Point2D[] = [[-3, -3], [-1, -1], [1, 1]];
      const tree = new KDTree(points);
      const result = tree.rangeSearch([-4, -4], [-0.5, -0.5]);
      expect(result.length).toBe(2);
      expect(result).toContainEqual([-3, -3]);
      expect(result).toContainEqual([-1, -1]);
    });
  });

  describe("엣지", () => {
    test("단일 점 트리에서 rangeSearch가 올바르게 동작한다", () => {
      const tree = new KDTree([[5, 5]]);
      expect(tree.rangeSearch([0, 0], [10, 10])).toEqual([[5, 5]]);
      expect(tree.rangeSearch([6, 6], [10, 10])).toEqual([]);
    });

    test("동일 x좌표 점들에서 nearestNeighbor가 정확하다", () => {
      const points: Point2D[] = [[3, 1], [3, 5], [3, 10]];
      const tree = new KDTree(points);
      expect(tree.nearestNeighbor([3, 4])).toEqual([3, 5]);
    });

    test("동일 y좌표 점들에서 nearestNeighbor가 정확하다", () => {
      const points: Point2D[] = [[1, 3], [5, 3], [10, 3]];
      const tree = new KDTree(points);
      expect(tree.nearestNeighbor([4, 3])).toEqual([5, 3]);
    });

    test("대량 삽입 후 size가 정확하다", () => {
      const tree = new KDTree();
      for (let i = 0; i < 100; i++) {
        tree.insert([i, i * 2]);
      }
      expect(tree.size()).toBe(100);
    });
  });

  describe("성능", () => {
    test("n=10^4 insert + nearestNeighbor 100ms 이내", () => {
      const N = 10000;
      const points: Point2D[] = Array.from({ length: N }, (_, i) => [
        Math.random() * 1000,
        Math.random() * 1000,
      ] as Point2D);

      const tree = new KDTree();
      const start = performance.now();
      for (const p of points) {
        tree.insert(p);
      }
      for (let i = 0; i < 100; i++) {
        tree.nearestNeighbor([Math.random() * 1000, Math.random() * 1000]);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test("n=10^4 insert + rangeSearch 100ms 이내", () => {
      const N = 10000;
      const points: Point2D[] = Array.from({ length: N }, () => [
        Math.random() * 1000,
        Math.random() * 1000,
      ] as Point2D);

      const tree = new KDTree(points);
      const start = performance.now();
      for (let i = 0; i < 50; i++) {
        tree.rangeSearch([100, 100], [400, 400]);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
