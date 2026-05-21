import { test, expect, describe } from "bun:test";
import { UnionFind } from "./unionFind";

describe("UnionFind", () => {
  describe("기본", () => {
    test("초기엔 모두 분리된 집합", () => {
      const uf = new UnionFind(5);
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
          expect(uf.connected(i, j)).toBe(false);
        }
      }
    });

    test("union 후 connected", () => {
      const uf = new UnionFind(5);
      uf.union(0, 1);
      uf.union(2, 3);
      expect(uf.connected(0, 1)).toBe(true);
      expect(uf.connected(2, 3)).toBe(true);
      expect(uf.connected(0, 2)).toBe(false);
    });

    test("연쇄적 union", () => {
      const uf = new UnionFind(5);
      uf.union(0, 1);
      uf.union(1, 2);
      uf.union(2, 3);
      uf.union(3, 4);
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
          expect(uf.connected(i, j)).toBe(true);
        }
      }
    });
  });

  describe("엣지", () => {
    test("자기 자신과 connected", () => {
      const uf = new UnionFind(3);
      expect(uf.connected(0, 0)).toBe(true);
    });

    test("같은 집합을 다시 union 해도 문제 없음", () => {
      const uf = new UnionFind(3);
      uf.union(0, 1);
      uf.union(0, 1);
      uf.union(1, 0);
      expect(uf.connected(0, 1)).toBe(true);
    });

    test("find의 결과는 같은 집합 내에서 동일", () => {
      const uf = new UnionFind(4);
      uf.union(0, 1);
      uf.union(1, 2);
      expect(uf.find(0)).toBe(uf.find(2));
      expect(uf.find(3)).not.toBe(uf.find(0));
    });
  });

  describe("바운더리", () => {
    test("n=1, 단일 원소", () => {
      const uf = new UnionFind(1);
      expect(uf.find(0)).toBe(0);
      expect(uf.connected(0, 0)).toBe(true);
    });

    test("n=10^5, 모두 union 후 connected", () => {
      const n = 100_000;
      const uf = new UnionFind(n);
      for (let i = 1; i < n; i++) uf.union(0, i);
      expect(uf.connected(0, n - 1)).toBe(true);
      expect(uf.connected(1, n - 2)).toBe(true);
    });
  });

  describe("성능", () => {
    test("n=10^5, q=10^5 union/find를 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const uf = new UnionFind(n);

      const start = performance.now();
      for (let i = 0; i < n - 1; i++) uf.union(i, i + 1);
      let cnt = 0;
      for (let i = 0; i < 100_000; i++) {
        if (uf.connected(i % n, (i * 7 + 3) % n)) cnt++;
      }
      const elapsed = performance.now() - start;

      expect(cnt).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
