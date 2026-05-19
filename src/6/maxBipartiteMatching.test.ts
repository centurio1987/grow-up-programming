import { test, expect, describe } from "bun:test";
import { maxBipartiteMatching } from "./maxBipartiteMatching";

describe("maxBipartiteMatching", () => {
  describe("기본 동작", () => {
    test("완전 매칭이 존재하는 K_{3,3} 부분 그래프 → 3", () => {
      // L={0,1,2}, R={0,1,2}
      // 0-0, 1-1, 2-2 가능
      const edges: [number, number][] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 2],
      ];
      expect(maxBipartiteMatching(3, 3, edges)).toBe(3);
    });

    test("매칭 크기 2 (3x3 일부) — 교대 경로로 개선 필요", () => {
      // 0-{0,1}, 1-{0}, 2-{0}
      // 그리디 0-0이면 1,2 매칭 실패. 0-1, 1-0, 2-? → 2
      const edges: [number, number][] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [2, 0],
      ];
      expect(maxBipartiteMatching(3, 3, edges)).toBe(2);
    });

    test("Hall's marriage theorem 예시", () => {
      // 4명의 사람, 4개의 일자리
      // p0: j0,j1
      // p1: j0,j2
      // p2: j1,j3
      // p3: j2,j3
      // 완전 매칭 가능 → 4
      const edges: [number, number][] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 2],
        [2, 1],
        [2, 3],
        [3, 2],
        [3, 3],
      ];
      expect(maxBipartiteMatching(4, 4, edges)).toBe(4);
    });
  });

  describe("엣지 케이스", () => {
    test("간선 없음 → 0", () => {
      expect(maxBipartiteMatching(5, 5, [])).toBe(0);
    });

    test("L=1, R=1, 간선 1개 → 1", () => {
      expect(maxBipartiteMatching(1, 1, [[0, 0]])).toBe(1);
    });

    test("L=1, R=1, 간선 없음 → 0", () => {
      expect(maxBipartiteMatching(1, 1, [])).toBe(0);
    });

    test("모든 왼쪽이 같은 오른쪽 정점 1개에 연결 → 1", () => {
      const edges: [number, number][] = [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ];
      expect(maxBipartiteMatching(4, 1, edges)).toBe(1);
    });

    test("중복 간선 무시", () => {
      const edges: [number, number][] = [
        [0, 0],
        [0, 0],
        [1, 1],
      ];
      expect(maxBipartiteMatching(2, 2, edges)).toBe(2);
    });

    test("L > R: 매칭 크기는 min(L, R) 이하", () => {
      // L=5, R=2, 모든 L이 모든 R에 연결 → 2
      const edges: [number, number][] = [];
      for (let l = 0; l < 5; l++) {
        for (let r = 0; r < 2; r++) edges.push([l, r]);
      }
      expect(maxBipartiteMatching(5, 2, edges)).toBe(2);
    });

    test("불완전 매칭 — 일부만 매칭 가능", () => {
      // L=3, R=3, 0-0, 1-0, 2-0 → 최대 1
      const edges: [number, number][] = [
        [0, 0],
        [1, 0],
        [2, 0],
      ];
      expect(maxBipartiteMatching(3, 3, edges)).toBe(1);
    });
  });

  describe("바운더리", () => {
    test("L=R=0, 간선 없음 → 0", () => {
      expect(maxBipartiteMatching(0, 0, [])).toBe(0);
    });

    test("증가 경로가 길게 필요한 케이스 — 4단 교대 경로", () => {
      // L=3, R=3
      // 0-0, 0-1
      // 1-0
      // 2-1, 2-2
      // 그리디(0->0, 1->?, 2->1) = 2 이지만, 증가경로로 3 가능
      const edges: [number, number][] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [2, 1],
        [2, 2],
      ];
      expect(maxBipartiteMatching(3, 3, edges)).toBe(3);
    });
  });

  describe("성능", () => {
    test("L=R=500, E≈10000 입력을 100ms 이내에 처리한다", () => {
      const L = 500;
      const R = 500;
      const edges: [number, number][] = [];
      // 각 L 정점에 임의의 R 정점 ~20개 연결
      let seed = 42;
      for (let l = 0; l < L; l++) {
        for (let k = 0; k < 20; k++) {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff;
          edges.push([l, seed % R]);
        }
      }
      const start = performance.now();
      maxBipartiteMatching(L, R, edges);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
