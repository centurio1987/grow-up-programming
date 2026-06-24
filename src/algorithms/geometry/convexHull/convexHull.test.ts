import { test, expect, describe } from "bun:test";
import { convexHull, type Point } from "./convexHull";

describe("convexHull", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("사각형 4개의 점 — 반시계 방향으로 4개 꼭짓점 반환", () => {
      const pts: Point[] = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ];
      const hull = convexHull(pts);
      expect(hull.length).toBe(4);
      // 반시계 방향: (0,0) → (1,0) → (1,1) → (0,1) 순환 중 어느 시작점이든 가능
      const set = new Set(hull.map((p) => `${p[0]},${p[1]}`));
      expect(set).toEqual(new Set(["0,0", "1,0", "1,1", "0,1"]));
    });

    test("삼각형 내부에 점이 포함된 경우 — 외곽 3점만 반환", () => {
      const pts: Point[] = [
        [0, 0],
        [4, 0],
        [2, 3],
        [2, 1], // 내부
      ];
      const hull = convexHull(pts);
      expect(hull.length).toBe(3);
      const set = new Set(hull.map((p) => `${p[0]},${p[1]}`));
      expect(set).toEqual(new Set(["0,0", "4,0", "2,3"]));
    });

    test("반시계 방향(CCW) 순서를 유지한다", () => {
      const pts: Point[] = [
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
      ];
      const hull = convexHull(pts);
      // signed area > 0 이면 CCW
      let area = 0;
      for (let i = 0; i < hull.length; i++) {
        const a = hull[i]!;
        const b = hull[(i + 1) % hull.length]!;
        area += a[0]! * b[1]! - a[1]! * b[0]!;
      }
      expect(area).toBeGreaterThan(0);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("공선상의 점들 — 양 끝점만 반환 (공선 중간 점 제외)", () => {
      const pts: Point[] = [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ];
      const hull = convexHull(pts);
      // 모두 일직선이면 양 끝점만 남는다
      expect(hull.length).toBe(2);
      const set = new Set(hull.map((p) => `${p[0]},${p[1]}`));
      expect(set).toEqual(new Set(["0,0", "3,0"]));
    });

    test("중복된 점이 섞인 경우 — 유효한 hull 반환", () => {
      const pts: Point[] = [
        [0, 0],
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ];
      const hull = convexHull(pts);
      expect(hull.length).toBe(4);
    });

    test("hull 변 위에 공선인 점이 있어도 그 점은 제외된다", () => {
      const pts: Point[] = [
        [0, 0],
        [2, 0],
        [4, 0], // (0,0)-(4,0) 변 위 중간점
        [4, 4],
        [0, 4],
      ];
      const hull = convexHull(pts);
      expect(hull.length).toBe(4);
      const set = new Set(hull.map((p) => `${p[0]},${p[1]}`));
      expect(set).toEqual(new Set(["0,0", "4,0", "4,4", "0,4"]));
    });
  });

  // 바운더리 테스트
  describe("바운더리", () => {
    test("점이 1개 — 그 점 하나만 반환", () => {
      const hull = convexHull([[3, 7]]);
      expect(hull.length).toBe(1);
      expect(hull[0]).toEqual([3, 7]);
    });

    test("점이 2개 — 두 점 모두 반환", () => {
      const hull = convexHull([
        [0, 0],
        [1, 1],
      ]);
      expect(hull.length).toBe(2);
    });

    test("좌표 범위 ±10^9 — overflow 없이 처리", () => {
      const pts: Point[] = [
        [-1_000_000_000, -1_000_000_000],
        [1_000_000_000, -1_000_000_000],
        [1_000_000_000, 1_000_000_000],
        [-1_000_000_000, 1_000_000_000],
        [0, 0],
      ];
      const hull = convexHull(pts);
      expect(hull.length).toBe(4);
    });
  });

  // 성능 테스트 (O(n log n), n=10^5 이면 100ms 충분히 여유)
  describe("성능", () => {
    test("n=100,000 무작위 점을 100ms 이내에 처리한다", () => {
      const N = 100_000;
      const pts: Point[] = new Array(N);
      // 결정적 의사난수
      let seed = 1;
      const rnd = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed;
      };
      for (let i = 0; i < N; i++) {
        pts[i] = [rnd() % 200_000, rnd() % 200_000];
      }

      const start = performance.now();
      const hull = convexHull(pts);
      const elapsed = performance.now() - start;

      expect(hull.length).toBeGreaterThanOrEqual(3);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
