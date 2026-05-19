import { test, expect, describe } from "bun:test";
import { editDistance } from "./editDistance";

describe("editDistance", () => {
  describe("기본", () => {
    test("'horse' → 'ros': 3", () => {
      // horse → rorse (h→r) → rose (r 삭제) → ros (e 삭제)
      expect(editDistance("horse", "ros")).toBe(3);
    });

    test("'intention' → 'execution': 5", () => {
      expect(editDistance("intention", "execution")).toBe(5);
    });

    test("동일 문자열 → 0", () => {
      expect(editDistance("abc", "abc")).toBe(0);
    });
  });

  describe("엣지", () => {
    test("빈 → 'abc': 3 (모두 삽입)", () => {
      expect(editDistance("", "abc")).toBe(3);
    });

    test("'abc' → 빈: 3 (모두 삭제)", () => {
      expect(editDistance("abc", "")).toBe(3);
    });

    test("둘 다 빈: 0", () => {
      expect(editDistance("", "")).toBe(0);
    });

    test("교체 한 번 'a' → 'b': 1", () => {
      expect(editDistance("a", "b")).toBe(1);
    });

    test("삽입 한 번 'a' → 'ab': 1", () => {
      expect(editDistance("a", "ab")).toBe(1);
    });

    test("삭제 한 번 'ab' → 'a': 1", () => {
      expect(editDistance("ab", "a")).toBe(1);
    });
  });

  describe("바운더리", () => {
    test("N=1, M=1 동일 → 0", () => {
      expect(editDistance("x", "x")).toBe(0);
    });

    test("N=1000 빈 문자열로 → 1000", () => {
      expect(editDistance("a".repeat(1000), "")).toBe(1000);
    });

    test("N=1000 동일 → 0", () => {
      const s = "a".repeat(1000);
      expect(editDistance(s, s)).toBe(0);
    });
  });

  describe("성능", () => {
    test("N=M=1000을 100ms 이내에 처리한다", () => {
      const s = "a".repeat(1000);
      const t = "b".repeat(1000);

      const start = performance.now();
      const result = editDistance(s, t);
      const elapsed = performance.now() - start;

      expect(result).toBe(1000);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
