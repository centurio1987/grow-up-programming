import { test, expect, describe } from "bun:test";
import { Quadtree } from "./quadtree";
import type { Point2D, Rect } from "./quadtree";

const boundary: Rect = { x: 0, y: 0, width: 100, height: 100 };

describe("Quadtree", () => {
  describe("기본", () => {
    test("빈 쿼드트리를 생성할 수 있다", () => {
      const qt = new Quadtree(boundary);
      expect(qt.size()).toBe(0);
    });

    test("경계 내 점 삽입이 성공하고 true를 반환한다", () => {
      const qt = new Quadtree(boundary);
      const result = qt.insert([10, 20]);
      expect(result).toBe(true);
      expect(qt.size()).toBe(1);
    });

    test("경계 밖 점 삽입은 false를 반환하고 크기가 변하지 않는다", () => {
      const qt = new Quadtree(boundary);
      const result = qt.insert([150, 150]);
      expect(result).toBe(false);
      expect(qt.size()).toBe(0);
    });

    test("capacity 초과 시 자동으로 4분할(subdivide)된다", () => {
      const qt = new Quadtree(boundary, 2);
      qt.insert([10, 10]);
      qt.insert([20, 20]);
      // 3번째 삽입 시 분할 발생
      qt.insert([30, 30]);
      expect(qt.size()).toBe(3);
    });

    test("여러 점을 삽입한 후 size가 정확하다", () => {
      const qt = new Quadtree(boundary);
      for (let i = 0; i < 20; i++) {
        qt.insert([i * 4, i * 4]);
      }
      expect(qt.size()).toBe(20);
    });
  });

  describe("query (범위 검색)", () => {
    test("범위 내 모든 점을 반환한다", () => {
      const qt = new Quadtree(boundary);
      qt.insert([10, 10]);
      qt.insert([50, 50]);
      qt.insert([90, 90]);

      const range: Rect = { x: 0, y: 0, width: 60, height: 60 };
      const result = qt.query(range);
      expect(result.length).toBe(2);
      expect(result).toContainEqual([10, 10]);
      expect(result).toContainEqual([50, 50]);
    });

    test("범위 경계에 있는 점을 포함한다", () => {
      const qt = new Quadtree(boundary);
      qt.insert([0, 0]);
      qt.insert([50, 50]);

      const range: Rect = { x: 0, y: 0, width: 50, height: 50 };
      const result = qt.query(range);
      expect(result).toContainEqual([0, 0]);
      expect(result).toContainEqual([50, 50]);
    });

    test("범위 밖의 점은 포함하지 않는다", () => {
      const qt = new Quadtree(boundary);
      qt.insert([80, 80]);

      const range: Rect = { x: 0, y: 0, width: 50, height: 50 };
      const result = qt.query(range);
      expect(result).not.toContainEqual([80, 80]);
    });

    test("범위 내 점이 없으면 빈 배열을 반환한다", () => {
      const qt = new Quadtree(boundary);
      qt.insert([80, 80]);

      const range: Rect = { x: 0, y: 0, width: 10, height: 10 };
      const result = qt.query(range);
      expect(result).toEqual([]);
    });

    test("빈 쿼드트리에서 query는 빈 배열을 반환한다", () => {
      const qt = new Quadtree(boundary);
      const result = qt.query({ x: 0, y: 0, width: 100, height: 100 });
      expect(result).toEqual([]);
    });

    test("전체 경계로 query하면 모든 점을 반환한다", () => {
      const qt = new Quadtree(boundary);
      const points: Point2D[] = [[10, 10], [30, 30], [70, 70], [90, 90]];
      for (const p of points) {
        qt.insert(p);
      }
      const result = qt.query(boundary);
      expect(result.length).toBe(4);
    });

    test("분할 후에도 범위 검색이 정확하다", () => {
      const qt = new Quadtree(boundary, 2);
      // 분할을 유도
      qt.insert([10, 10]);
      qt.insert([20, 20]);
      qt.insert([30, 30]);
      qt.insert([70, 70]);
      qt.insert([80, 80]);

      const range: Rect = { x: 0, y: 0, width: 40, height: 40 };
      const result = qt.query(range);
      expect(result.length).toBe(3);
      expect(result).toContainEqual([10, 10]);
      expect(result).toContainEqual([20, 20]);
      expect(result).toContainEqual([30, 30]);
    });
  });

  describe("엣지", () => {
    test("경계 꼭짓점에 있는 점을 삽입할 수 있다", () => {
      const qt = new Quadtree(boundary);
      expect(qt.insert([0, 0])).toBe(true);
      expect(qt.size()).toBe(1);
    });

    test("capacity=1로 설정하면 점마다 분할이 발생한다", () => {
      const qt = new Quadtree(boundary, 1);
      qt.insert([25, 25]);
      qt.insert([75, 25]);
      qt.insert([25, 75]);
      qt.insert([75, 75]);
      expect(qt.size()).toBe(4);

      const result = qt.query(boundary);
      expect(result.length).toBe(4);
    });

    test("같은 위치의 점을 여러 번 삽입할 수 있다", () => {
      const qt = new Quadtree(boundary);
      qt.insert([50, 50]);
      qt.insert([50, 50]);
      qt.insert([50, 50]);
      expect(qt.size()).toBe(3);
    });

    test("중앙 경계선 위의 점을 삽입할 수 있다", () => {
      const qt = new Quadtree(boundary, 2);
      // 분할 후 중앙선(x=50, y=50)에 위치한 점
      qt.insert([50, 50]);
      qt.insert([10, 10]);
      qt.insert([70, 70]); // 분할 발생
      expect(qt.size()).toBe(3);
    });

    test("음수 좌표 경계에서도 동작한다", () => {
      const negBoundary: Rect = { x: -100, y: -100, width: 200, height: 200 };
      const qt = new Quadtree(negBoundary);
      expect(qt.insert([-50, -50])).toBe(true);
      expect(qt.insert([50, 50])).toBe(true);
      expect(qt.size()).toBe(2);
    });
  });

  describe("성능", () => {
    test("n=10^4 insert + query 100ms 이내", () => {
      const qt = new Quadtree({ x: 0, y: 0, width: 10000, height: 10000 }, 4);
      const N = 10000;

      const start = performance.now();
      for (let i = 0; i < N; i++) {
        qt.insert([Math.random() * 10000, Math.random() * 10000]);
      }
      for (let i = 0; i < 100; i++) {
        qt.query({ x: 2000, y: 2000, width: 2000, height: 2000 });
      }
      const elapsed = performance.now() - start;

      expect(qt.size()).toBe(N);
      expect(elapsed).toBeLessThan(100);
    });

    test("대규모 삽입 후 query 결과가 정확하다", () => {
      const qt = new Quadtree({ x: 0, y: 0, width: 1000, height: 1000 }, 4);
      let countInRange = 0;
      const range: Rect = { x: 0, y: 0, width: 500, height: 500 };

      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 1000;
        const y = Math.random() * 1000;
        qt.insert([x, y]);
        if (x >= 0 && x <= 500 && y >= 0 && y <= 500) {
          countInRange++;
        }
      }

      const result = qt.query(range);
      expect(result.length).toBe(countInRange);
    });
  });
});
