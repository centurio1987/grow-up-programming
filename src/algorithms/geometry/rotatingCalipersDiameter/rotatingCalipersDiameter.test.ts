import { test, expect, describe } from "bun:test";
import { rotatingCalipersDiameter, type Point } from "./rotatingCalipersDiameter";

describe("rotatingCalipersDiameter", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("두 점만 — 그 사이 제곱 거리", () => {
      const pts: Point[] = [
        [0, 0],
        [3, 4],
      ];
      // 3^2 + 4^2 = 25
      expect(rotatingCalipersDiameter(pts)).toBeCloseTo(25, 9);
    });

    test("정사각형 — 대각선 제곱 거리", () => {
      const sq: Point[] = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ];
      // 대각선^2 = 2
      expect(rotatingCalipersDiameter(sq)).toBeCloseTo(2, 9);
    });

    test("4x6 직사각형 — 대각선^2 = 52", () => {
      const rect: Point[] = [
        [0, 0],
        [4, 0],
        [4, 6],
        [0, 6],
      ];
      // 4^2 + 6^2 = 52
      expect(rotatingCalipersDiameter(rect)).toBeCloseTo(52, 9);
    });

    test("삼각형 — 가장 긴 변의 제곱", () => {
      const tri: Point[] = [
        [0, 0],
        [6, 0],
        [3, 4],
      ];
      // 변: 6^2=36, (3,4)=25, (3,-4 vs (6,0)=9+16=25 → 36이 최대
      expect(rotatingCalipersDiameter(tri)).toBeCloseTo(36, 9);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("내부에 점이 많아도 외곽 두 점이 답", () => {
      const pts: Point[] = [
        [0, 0],
        [10, 0],
        [5, 5],
        [4, 3],
        [6, 2],
      ];
      // (0,0)-(10,0) = 100
      expect(rotatingCalipersDiameter(pts)).toBeCloseTo(100, 9);
    });

    test("공선 점들 — 양 끝점 사이", () => {
      const pts: Point[] = [
        [0, 0],
        [2, 0],
        [5, 0],
        [9, 0],
      ];
      // 9^2 = 81
      expect(rotatingCalipersDiameter(pts)).toBeCloseTo(81, 9);
    });

    test("중복 점 포함 — 정상 동작", () => {
      const pts: Point[] = [
        [0, 0],
        [0, 0],
        [3, 4],
      ];
      expect(rotatingCalipersDiameter(pts)).toBeCloseTo(25, 9);
    });

    test("동일 좌표 두 점 — 0", () => {
      const pts: Point[] = [
        [7, 7],
        [7, 7],
      ];
      expect(rotatingCalipersDiameter(pts)).toBeCloseTo(0, 9);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("최소 입력 n=2", () => {
      const pts: Point[] = [
        [0, 0],
        [1, 0],
      ];
      expect(rotatingCalipersDiameter(pts)).toBeCloseTo(1, 9);
    });

    test("큰 좌표 ±10^9 — 제곱 거리 정확", () => {
      const pts: Point[] = [
        [-1_000_000_000, 0],
        [1_000_000_000, 0],
        [0, 0],
      ];
      // (2e9)^2 = 4e18
      expect(rotatingCalipersDiameter(pts)).toBeCloseTo(4e18, -9);
    });
  });

  // 성능
  describe("성능", () => {
    test("n=100,000 무작위 점을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const pts: Point[] = new Array(N);
      let seed = 42;
      const rnd = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed;
      };
      for (let i = 0; i < N; i++) {
        pts[i] = [rnd() % 1_000_000, rnd() % 1_000_000];
      }

      const start = performance.now();
      const d2 = rotatingCalipersDiameter(pts);
      const elapsed = performance.now() - start;

      expect(d2).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
