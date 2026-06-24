import { test, expect, describe } from "bun:test";
import { LinkCutTree } from "./linkCutTree";

describe("LinkCutTree", () => {
  describe("기본", () => {
    test("link 후 connected", () => {
      const lct = new LinkCutTree(4);
      lct.link(0, 1);
      lct.link(1, 2);
      expect(lct.connected(0, 2)).toBe(true);
      expect(lct.connected(0, 3)).toBe(false);
    });

    test("cut 후 분리", () => {
      const lct = new LinkCutTree(4);
      lct.link(0, 1);
      lct.link(1, 2);
      lct.link(2, 3);
      lct.cut(1, 2);
      expect(lct.connected(0, 1)).toBe(true);
      expect(lct.connected(2, 3)).toBe(true);
      expect(lct.connected(0, 3)).toBe(false);
    });

    test("link → cut → link 다시 연결", () => {
      const lct = new LinkCutTree(3);
      lct.link(0, 1);
      lct.cut(0, 1);
      expect(lct.connected(0, 1)).toBe(false);
      lct.link(0, 1);
      expect(lct.connected(0, 1)).toBe(true);
    });
  });

  describe("엣지", () => {
    test("자기 자신과 connected", () => {
      const lct = new LinkCutTree(3);
      expect(lct.connected(0, 0)).toBe(true);
    });

    test("초기엔 모든 노드가 분리", () => {
      const lct = new LinkCutTree(5);
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
          expect(lct.connected(i, j)).toBe(false);
        }
      }
    });

    test("체인을 만들고 중간을 잘라 두 컴포넌트로", () => {
      const lct = new LinkCutTree(5);
      lct.link(0, 1);
      lct.link(1, 2);
      lct.link(2, 3);
      lct.link(3, 4);
      lct.cut(2, 3);
      expect(lct.connected(0, 2)).toBe(true);
      expect(lct.connected(3, 4)).toBe(true);
      expect(lct.connected(1, 4)).toBe(false);
    });
  });

  describe("바운더리", () => {
    test("n=1, 단일 노드", () => {
      const lct = new LinkCutTree(1);
      expect(lct.connected(0, 0)).toBe(true);
    });

    test("n=10^4, 체인 형태로 모두 link", () => {
      const n = 10_000;
      const lct = new LinkCutTree(n);
      for (let i = 0; i < n - 1; i++) lct.link(i, i + 1);
      expect(lct.connected(0, n - 1)).toBe(true);
      expect(lct.connected(123, n - 234)).toBe(true);
    });
  });

  describe("성능", () => {
    test("n=10^4, q=10^4 link/cut/connected를 100ms 이내에 처리한다", () => {
      const n = 10_000;
      const lct = new LinkCutTree(n);

      const start = performance.now();
      for (let i = 0; i < n - 1; i++) lct.link(i, i + 1);
      let cnt = 0;
      for (let i = 0; i < 10_000; i++) {
        if (lct.connected(i % n, (i * 7 + 3) % n)) cnt++;
      }
      const elapsed = performance.now() - start;

      expect(cnt).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
