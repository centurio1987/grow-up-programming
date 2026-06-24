import { test, expect, describe } from "bun:test";
import { segmentsIntersect, type Segment } from "./segmentsIntersect";

describe("segmentsIntersect", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("교차하는 X자 — true", () => {
      const s1: Segment = [
        [0, 0],
        [2, 2],
      ];
      const s2: Segment = [
        [0, 2],
        [2, 0],
      ];
      expect(segmentsIntersect(s1, s2)).toBe(true);
    });

    test("평행하고 분리됨 — false", () => {
      const s1: Segment = [
        [0, 0],
        [2, 0],
      ];
      const s2: Segment = [
        [0, 1],
        [2, 1],
      ];
      expect(segmentsIntersect(s1, s2)).toBe(false);
    });

    test("교차하지 않음 (분리) — false", () => {
      const s1: Segment = [
        [0, 0],
        [1, 1],
      ];
      const s2: Segment = [
        [2, 2],
        [3, 3],
      ];
      // 공선이지만 서로 떨어져 있음
      expect(segmentsIntersect(s1, s2)).toBe(false);
    });

    test("교차 — 사선과 수직선", () => {
      const s1: Segment = [
        [0, 0],
        [4, 4],
      ];
      const s2: Segment = [
        [2, 0],
        [2, 4],
      ];
      expect(segmentsIntersect(s1, s2)).toBe(true);
    });
  });

  // 엣지 케이스 — 끝점 접촉, 공선
  describe("엣지 케이스", () => {
    test("끝점끼리 닿는 경우 — true (L자)", () => {
      const s1: Segment = [
        [0, 0],
        [1, 0],
      ];
      const s2: Segment = [
        [1, 0],
        [1, 1],
      ];
      expect(segmentsIntersect(s1, s2)).toBe(true);
    });

    test("한 선분의 끝점이 다른 선분 위 — true (T자)", () => {
      const s1: Segment = [
        [0, 0],
        [4, 0],
      ];
      const s2: Segment = [
        [2, 0],
        [2, 3],
      ];
      expect(segmentsIntersect(s1, s2)).toBe(true);
    });

    test("공선이면서 겹치는 경우 — true", () => {
      const s1: Segment = [
        [0, 0],
        [3, 0],
      ];
      const s2: Segment = [
        [2, 0],
        [5, 0],
      ];
      expect(segmentsIntersect(s1, s2)).toBe(true);
    });

    test("공선이면서 끝점만 닿는 경우 — true", () => {
      const s1: Segment = [
        [0, 0],
        [2, 0],
      ];
      const s2: Segment = [
        [2, 0],
        [4, 0],
      ];
      expect(segmentsIntersect(s1, s2)).toBe(true);
    });

    test("공선이지만 분리됨 — false", () => {
      const s1: Segment = [
        [0, 0],
        [1, 0],
      ];
      const s2: Segment = [
        [2, 0],
        [3, 0],
      ];
      expect(segmentsIntersect(s1, s2)).toBe(false);
    });

    test("교차할 것 같지만 한쪽이 짧아 닿지 않음 — false", () => {
      const s1: Segment = [
        [0, 0],
        [10, 10],
      ];
      const s2: Segment = [
        [5, 0],
        [5, 4],
      ];
      // s2의 y 범위 [0,4]는 s1이 x=5일 때 y=5인 지점에 못 닿음
      expect(segmentsIntersect(s1, s2)).toBe(false);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("길이 0 선분(점)이 다른 선분 위에 있는 경우 — true", () => {
      const s1: Segment = [
        [0, 0],
        [4, 0],
      ];
      const s2: Segment = [
        [2, 0],
        [2, 0],
      ];
      expect(segmentsIntersect(s1, s2)).toBe(true);
    });

    test("두 점(길이 0 선분)이 같은 위치 — true", () => {
      const s1: Segment = [
        [3, 3],
        [3, 3],
      ];
      const s2: Segment = [
        [3, 3],
        [3, 3],
      ];
      expect(segmentsIntersect(s1, s2)).toBe(true);
    });

    test("두 점(길이 0 선분)이 다른 위치 — false", () => {
      const s1: Segment = [
        [0, 0],
        [0, 0],
      ];
      const s2: Segment = [
        [1, 1],
        [1, 1],
      ];
      expect(segmentsIntersect(s1, s2)).toBe(false);
    });

    test("큰 좌표 ±10^9 — overflow 없이 정확", () => {
      const s1: Segment = [
        [-1_000_000_000, -1_000_000_000],
        [1_000_000_000, 1_000_000_000],
      ];
      const s2: Segment = [
        [-1_000_000_000, 1_000_000_000],
        [1_000_000_000, -1_000_000_000],
      ];
      expect(segmentsIntersect(s1, s2)).toBe(true);
    });
  });

  // 성능 — O(1) 함수이므로 100,000회 반복 호출이 100ms 이내
  describe("성능", () => {
    test("100,000회 호출을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const s1: Segment = [
        [0, 0],
        [10, 10],
      ];
      const s2: Segment = [
        [0, 10],
        [10, 0],
      ];

      const start = performance.now();
      for (let i = 0; i < N; i++) {
        segmentsIntersect(s1, s2);
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });
});
