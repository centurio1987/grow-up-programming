import { test, expect, describe } from "bun:test";
import { longestCommonSubsequence } from "./longestCommonSubsequence";

describe("longestCommonSubsequence", () => {
  describe("기본", () => {
    test("'abcde', 'ace' → 3 ('ace')", () => {
      expect(longestCommonSubsequence("abcde", "ace")).toBe(3);
    });

    test("'abc', 'abc' → 3", () => {
      expect(longestCommonSubsequence("abc", "abc")).toBe(3);
    });

    test("'abc', 'def' → 0", () => {
      expect(longestCommonSubsequence("abc", "def")).toBe(0);
    });

    test("'AGGTAB', 'GXTXAYB' → 4 ('GTAB')", () => {
      expect(longestCommonSubsequence("AGGTAB", "GXTXAYB")).toBe(4);
    });
  });

  describe("엣지", () => {
    test("한쪽이 빈 문자열 → 0", () => {
      expect(longestCommonSubsequence("", "abc")).toBe(0);
      expect(longestCommonSubsequence("abc", "")).toBe(0);
    });

    test("둘 다 빈 문자열 → 0", () => {
      expect(longestCommonSubsequence("", "")).toBe(0);
    });

    test("한 글자 일치 'a', 'a' → 1", () => {
      expect(longestCommonSubsequence("a", "a")).toBe(1);
    });

    test("한 글자 불일치 'a', 'b' → 0", () => {
      expect(longestCommonSubsequence("a", "b")).toBe(0);
    });

    test("부분 수열 'abc', 'aabbcc' → 3", () => {
      expect(longestCommonSubsequence("abc", "aabbcc")).toBe(3);
    });
  });

  describe("바운더리", () => {
    test("최소 N=1, M=1 일치", () => {
      expect(longestCommonSubsequence("z", "z")).toBe(1);
    });

    test("N=1000, M=1000 동일 문자열 → 1000", () => {
      const s = "a".repeat(1000);
      expect(longestCommonSubsequence(s, s)).toBe(1000);
    });
  });

  describe("성능", () => {
    test("N=M=1000을 100ms 이내에 처리한다", () => {
      const s = "a".repeat(1000);
      const t = "b".repeat(1000);

      const start = performance.now();
      const result = longestCommonSubsequence(s, t);
      const elapsed = performance.now() - start;

      expect(result).toBe(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
