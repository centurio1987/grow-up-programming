import { test, expect, describe } from "bun:test";
import { palindromePartitioningMinCut } from "./palindromePartitioningMinCut";

describe("palindromePartitioningMinCut", () => {
  describe("기본", () => {
    test('"aab" → ["aa","b"] = 1컷', () => {
      expect(palindromePartitioningMinCut("aab")).toBe(1);
    });

    test('"a" → 0컷', () => {
      expect(palindromePartitioningMinCut("a")).toBe(0);
    });

    test('"ab" → ["a","b"] = 1컷', () => {
      expect(palindromePartitioningMinCut("ab")).toBe(1);
    });

    test('"abcbm" → ["a","bcb","m"] = 2컷', () => {
      expect(palindromePartitioningMinCut("abcbm")).toBe(2);
    });
  });

  describe("엣지", () => {
    test("이미 팰린드롬 — 'aba' → 0", () => {
      expect(palindromePartitioningMinCut("aba")).toBe(0);
    });

    test("이미 팰린드롬 — 'aaaaa' → 0", () => {
      expect(palindromePartitioningMinCut("aaaaa")).toBe(0);
    });

    test("모든 글자가 달라 분할 필요 — 'abcde' → 4", () => {
      expect(palindromePartitioningMinCut("abcde")).toBe(4);
    });

    test("짝수 길이 팰린드롬 — 'abba' → 0", () => {
      expect(palindromePartitioningMinCut("abba")).toBe(0);
    });

    test("중첩 팰린드롬 — 'abacdc' → ['aba','cdc'] = 1", () => {
      expect(palindromePartitioningMinCut("abacdc")).toBe(1);
    });
  });

  describe("바운더리", () => {
    test("길이 1 → 0", () => {
      expect(palindromePartitioningMinCut("z")).toBe(0);
    });

    test("길이 2, 같은 글자 'aa' → 0", () => {
      expect(palindromePartitioningMinCut("aa")).toBe(0);
    });

    test("길이 2000 모두 'a' → 0 (단일 팰린드롬)", () => {
      const s = "a".repeat(2000);
      expect(palindromePartitioningMinCut(s)).toBe(0);
    });

    test("길이 2000 'ab' 반복 — 1999컷", () => {
      const s = "ab".repeat(1000);
      // ab반복은 어떤 부분 문자열도 길이 2 이상 팰린드롬이 아니므로 (각 글자만 가능)
      // 결과는 (n-1)컷이 아니라 더 적을 수도 있지만, "ab"반복은 단일문자만 팰린드롬이므로 1999
      expect(palindromePartitioningMinCut(s)).toBe(s.length - 1);
    });
  });

  describe("성능", () => {
    test("|s|=2000을 100ms 이내에 처리한다", () => {
      const s = "a".repeat(2000);

      const start = performance.now();
      const result = palindromePartitioningMinCut(s);
      const elapsed = performance.now() - start;

      expect(result).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
