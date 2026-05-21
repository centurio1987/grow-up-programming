import { test, expect, describe } from "bun:test";
import { tspBitmask } from "./tspBitmask";

describe("tspBitmask", () => {
  describe("기본", () => {
    test("n=4 고전 예제", () => {
      // 0→1→3→2→0 = 10+25+30+15 = 80
      // 0→2→3→1→0 = 15+30+25+10 = 80
      const dist = [
        [0, 10, 15, 20],
        [10, 0, 35, 25],
        [15, 35, 0, 30],
        [20, 25, 30, 0],
      ];
      expect(tspBitmask(dist)).toBe(80);
    });

    test("n=3 삼각형", () => {
      const dist = [
        [0, 1, 2],
        [1, 0, 3],
        [2, 3, 0],
      ];
      // 0→1→2→0 = 1+3+2 = 6
      // 0→2→1→0 = 2+3+1 = 6
      expect(tspBitmask(dist)).toBe(6);
    });
  });

  describe("엣지", () => {
    test("n=1 — 자기 자신만 방문 → 0", () => {
      expect(tspBitmask([[0]])).toBe(0);
    });

    test("n=2 — 0↔1 왕복", () => {
      const dist = [
        [0, 5],
        [5, 0],
      ];
      expect(tspBitmask(dist)).toBe(10);
    });

    test("대칭이 아닌 비대칭 거리", () => {
      const dist = [
        [0, 1, 10],
        [10, 0, 1],
        [1, 10, 0],
      ];
      // 0→1→2→0 = 1+1+1 = 3
      // 0→2→1→0 = 10+10+10 = 30
      expect(tspBitmask(dist)).toBe(3);
    });

    test("모든 거리 동일", () => {
      const n = 4;
      const dist = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? 0 : 7)),
      );
      // 어떤 투어든 n * 7
      expect(tspBitmask(dist)).toBe(n * 7);
    });
  });

  describe("바운더리", () => {
    test("n=20 단일 사이클 거리 (모두 1)", () => {
      const n = 20;
      const dist = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? 0 : 1)),
      );
      // 어떤 투어든 n * 1
      expect(tspBitmask(dist)).toBe(n);
    });

    test("n=5 0 비용 사이클이 존재", () => {
      const n = 5;
      const dist = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => {
          if (i === j) return 0;
          if ((i + 1) % n === j || (j + 1) % n === i) return 0;
          return 100;
        }),
      );
      expect(tspBitmask(dist)).toBe(0);
    });
  });

  describe("성능", () => {
    test("n=15을 200ms 이내에 처리한다", () => {
      const n = 15;
      const dist = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) =>
          i === j ? 0 : (((i + 1) * (j + 1)) % 97) + 1,
        ),
      );

      const start = performance.now();
      const result = tspBitmask(dist);
      const elapsed = performance.now() - start;

      expect(result).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(200);
    });
  });
});
