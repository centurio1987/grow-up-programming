import { test, expect, describe } from "bun:test";
import { closestPairOfPoints, type Point } from "./closestPairOfPoints";

describe("closestPairOfPoints", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("두 점만 있는 경우 — 그 거리 반환", () => {
      const pts: Point[] = [
        [0, 0],
        [3, 4],
      ];
      expect(closestPairOfPoints(pts)).toBeCloseTo(5, 9);
    });

    test("여러 점 중 가까운 쌍 발견", () => {
      const pts: Point[] = [
        [0, 0],
        [10, 10],
        [1, 1], // (0,0)과 가까움 √2
        [5, 5],
      ];
      expect(closestPairOfPoints(pts)).toBeCloseTo(Math.SQRT2, 9);
    });

    test("축에 정렬된 가까운 쌍", () => {
      const pts: Point[] = [
        [0, 0],
        [100, 0],
        [200, 0],
        [201, 0], // 1
      ];
      expect(closestPairOfPoints(pts)).toBeCloseTo(1, 9);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("동일 좌표의 점이 포함된 경우 — 거리 0", () => {
      const pts: Point[] = [
        [1, 2],
        [3, 4],
        [1, 2],
      ];
      expect(closestPairOfPoints(pts)).toBeCloseTo(0, 9);
    });

    test("y축 방향으로 가까운 쌍", () => {
      const pts: Point[] = [
        [0, 0],
        [10, 100],
        [10, 101],
        [50, 50],
      ];
      expect(closestPairOfPoints(pts)).toBeCloseTo(1, 9);
    });

    test("대각선으로 가까운 쌍", () => {
      const pts: Point[] = [
        [0, 0],
        [3, 3],
        [3, 4],
      ];
      // (3,3)-(3,4) = 1
      expect(closestPairOfPoints(pts)).toBeCloseTo(1, 9);
    });

    test("스트립을 가로지르는 쌍이 정답인 경우", () => {
      // 양쪽 절반에서 최소가 10이지만, 가운데를 가로지르는 쌍은 더 가까움
      const pts: Point[] = [
        [0, 0],
        [10, 0], // 왼쪽 절반
        [11, 0], // 오른쪽 절반 — (10,0)-(11,0)=1
        [21, 0],
      ];
      expect(closestPairOfPoints(pts)).toBeCloseTo(1, 9);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("최소 입력 n=2", () => {
      const pts: Point[] = [
        [0, 0],
        [1, 0],
      ];
      expect(closestPairOfPoints(pts)).toBeCloseTo(1, 9);
    });

    test("큰 좌표 ±10^9 — overflow 없이 정확", () => {
      const pts: Point[] = [
        [-1_000_000_000, -1_000_000_000],
        [1_000_000_000, 1_000_000_000],
        [999_999_999, 1_000_000_000], // 위 점과 거리 1
      ];
      expect(closestPairOfPoints(pts)).toBeCloseTo(1, 9);
    });
  });

  // 성능
  describe("성능", () => {
    test("n=50,000 무작위 점을 100ms 이내에 처리한다", () => {
      const N = 50_000;
      const pts: Point[] = new Array(N);
      let seed = 12345;
      const rnd = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed;
      };
      for (let i = 0; i < N; i++) {
        pts[i] = [rnd() % 1_000_000, rnd() % 1_000_000];
      }

      const start = performance.now();
      const d = closestPairOfPoints(pts);
      const elapsed = performance.now() - start;

      expect(d).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
