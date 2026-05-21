import { test, expect, describe } from "bun:test";
import { polygonArea, type Point } from "./polygonArea";

describe("polygonArea", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("단위 정사각형 — 면적 1", () => {
      const sq: Point[] = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ];
      expect(polygonArea(sq)).toBeCloseTo(1, 9);
    });

    test("4x6 직사각형 — 면적 24", () => {
      const rect: Point[] = [
        [0, 0],
        [4, 0],
        [4, 6],
        [0, 6],
      ];
      expect(polygonArea(rect)).toBeCloseTo(24, 9);
    });

    test("직각삼각형 (밑변 4, 높이 3) — 면적 6", () => {
      const tri: Point[] = [
        [0, 0],
        [4, 0],
        [0, 3],
      ];
      expect(polygonArea(tri)).toBeCloseTo(6, 9);
    });

    test("오목 다각형 (L자) — 면적 12", () => {
      // 4x4 정사각형(16)에서 2x2 사각형(4) 잘라낸 모양
      const l: Point[] = [
        [0, 0],
        [4, 0],
        [4, 2],
        [2, 2],
        [2, 4],
        [0, 4],
      ];
      expect(polygonArea(l)).toBeCloseTo(12, 9);
    });
  });

  // 엣지 케이스 — 방향 무관
  describe("엣지 케이스", () => {
    test("시계 방향 입력 — 동일한 양의 면적", () => {
      const cw: Point[] = [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
      ];
      expect(polygonArea(cw)).toBeCloseTo(1, 9);
    });

    test("반시계 방향 입력 — 동일한 양의 면적", () => {
      const ccw: Point[] = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ];
      expect(polygonArea(ccw)).toBeCloseTo(1, 9);
    });

    test("음의 좌표 다각형 — 동일한 면적", () => {
      const shifted: Point[] = [
        [-5, -5],
        [-4, -5],
        [-4, -4],
        [-5, -4],
      ];
      expect(polygonArea(shifted)).toBeCloseTo(1, 9);
    });

    test("공선 정점이 포함된 경우 — 면적 동일", () => {
      const sq: Point[] = [
        [0, 0],
        [2, 0],
        [4, 0], // 공선
        [4, 4],
        [0, 4],
      ];
      expect(polygonArea(sq)).toBeCloseTo(16, 9);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("최소 다각형 (n=3) — 정확한 면적", () => {
      const tri: Point[] = [
        [0, 0],
        [1, 0],
        [0, 1],
      ];
      expect(polygonArea(tri)).toBeCloseTo(0.5, 9);
    });

    test("정점 모두 일직선상 — 면적 0", () => {
      const line: Point[] = [
        [0, 0],
        [1, 0],
        [2, 0],
      ];
      expect(polygonArea(line)).toBeCloseTo(0, 9);
    });

    test("큰 좌표 ±10^9 — overflow 없이 정확", () => {
      const big: Point[] = [
        [-1_000_000_000, -1_000_000_000],
        [1_000_000_000, -1_000_000_000],
        [1_000_000_000, 1_000_000_000],
        [-1_000_000_000, 1_000_000_000],
      ];
      // 변 길이 2e9, 면적 4e18
      expect(polygonArea(big)).toBeCloseTo(4e18, -9);
    });
  });

  // 성능
  describe("성능", () => {
    test("n=100,000 정점 다각형을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const polygon: Point[] = new Array(N);
      for (let i = 0; i < N; i++) {
        const t = (2 * Math.PI * i) / N;
        polygon[i] = [Math.cos(t) * 1000, Math.sin(t) * 1000];
      }
      const start = performance.now();
      const area = polygonArea(polygon);
      const elapsed = performance.now() - start;

      // 반지름 1000 원의 면적 근사 = π·10^6 ≈ 3.14e6
      expect(area).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
