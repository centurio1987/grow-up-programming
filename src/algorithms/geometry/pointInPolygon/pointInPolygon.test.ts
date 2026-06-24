import { test, expect, describe } from "bun:test";
import { pointInPolygon, type Point } from "./pointInPolygon";

describe("pointInPolygon", () => {
  // 기본 동작
  describe("기본 동작", () => {
    const square: Point[] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];

    test("정사각형 중심 — 내부", () => {
      expect(pointInPolygon([5, 5], square)).toBe(true);
    });

    test("정사각형 바깥 — 외부", () => {
      expect(pointInPolygon([15, 5], square)).toBe(false);
    });

    test("정사각형 바로 위쪽 — 외부", () => {
      expect(pointInPolygon([5, 11], square)).toBe(false);
    });

    test("정사각형 바로 아래쪽 — 외부", () => {
      expect(pointInPolygon([5, -1], square)).toBe(false);
    });
  });

  // 오목 다각형
  describe("오목 다각형", () => {
    // 화살표 모양 (오목)
    const arrow: Point[] = [
      [0, 0],
      [6, 0],
      [6, 4],
      [10, 4],
      [5, 9],
      [0, 4],
      [6, 4], // 동일점 회피 위해 다른 구조
    ];
    // 더 단순한 오목 — L자
    const lShape: Point[] = [
      [0, 0],
      [4, 0],
      [4, 2],
      [2, 2],
      [2, 4],
      [0, 4],
    ];

    test("L자 — 좌하단 내부", () => {
      expect(pointInPolygon([1, 1], lShape)).toBe(true);
    });

    test("L자 — 오목 부분(파인 공간)은 외부", () => {
      expect(pointInPolygon([3, 3], lShape)).toBe(false);
    });

    test("L자 — 위쪽 좁은 부분 내부", () => {
      expect(pointInPolygon([1, 3], lShape)).toBe(true);
    });
  });

  // 엣지 케이스 — 경계
  describe("경계 케이스", () => {
    const square: Point[] = [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ];

    test("변 위 — 내부로 간주", () => {
      expect(pointInPolygon([2, 0], square)).toBe(true);
    });

    test("정점 위 — 내부로 간주", () => {
      expect(pointInPolygon([0, 0], square)).toBe(true);
    });

    test("정점 위(반대 코너) — 내부로 간주", () => {
      expect(pointInPolygon([4, 4], square)).toBe(true);
    });

    test("변 위 (위쪽 변) — 내부로 간주", () => {
      expect(pointInPolygon([2, 4], square)).toBe(true);
    });
  });

  // 삼각형 케이스
  describe("삼각형", () => {
    const tri: Point[] = [
      [0, 0],
      [6, 0],
      [3, 6],
    ];

    test("삼각형 무게중심 — 내부", () => {
      expect(pointInPolygon([3, 2], tri)).toBe(true);
    });

    test("삼각형 외부 (오른쪽) — 외부", () => {
      expect(pointInPolygon([5, 5], tri)).toBe(false);
    });

    test("삼각형 변 위 — 내부", () => {
      expect(pointInPolygon([3, 0], tri)).toBe(true);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("최소 다각형 (n=3) 작동", () => {
      const tri: Point[] = [
        [0, 0],
        [2, 0],
        [1, 2],
      ];
      expect(pointInPolygon([1, 1], tri)).toBe(true);
      expect(pointInPolygon([5, 5], tri)).toBe(false);
    });

    test("큰 좌표 ±10^9 정상 동작", () => {
      const big: Point[] = [
        [-1_000_000_000, -1_000_000_000],
        [1_000_000_000, -1_000_000_000],
        [1_000_000_000, 1_000_000_000],
        [-1_000_000_000, 1_000_000_000],
      ];
      expect(pointInPolygon([0, 0], big)).toBe(true);
      expect(pointInPolygon([2_000_000_000, 0], big)).toBe(false);
    });
  });

  // 성능
  describe("성능", () => {
    test("n=100,000 정점의 원형 다각형 판정을 100ms 이내", () => {
      const N = 100_000;
      const polygon: Point[] = new Array(N);
      for (let i = 0; i < N; i++) {
        const t = (2 * Math.PI * i) / N;
        polygon[i] = [Math.cos(t) * 1_000_000, Math.sin(t) * 1_000_000];
      }

      const start = performance.now();
      const inside = pointInPolygon([0, 0], polygon);
      const outside = pointInPolygon([2_000_000, 0], polygon);
      const elapsed = performance.now() - start;

      expect(inside).toBe(true);
      expect(outside).toBe(false);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
