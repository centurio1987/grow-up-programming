import { test, expect, describe } from "bun:test";
import { ahoCorasick } from "./ahoCorasick";

type Match = { patternIndex: number; position: number };

function sortMatches(matches: Match[]): Match[] {
  return [...matches].sort((a, b) =>
    a.position !== b.position ? a.position - b.position : a.patternIndex - b.patternIndex,
  );
}

describe("ahoCorasick", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("단일 패턴 단일 매칭", () => {
      const result = ahoCorasick("hello world", ["world"]);
      expect(sortMatches(result)).toEqual([{ patternIndex: 0, position: 6 }]);
    });

    test("여러 패턴 동시 매칭", () => {
      // text = "ahishers", patterns = ["he","she","his","hers"]
      // - "he"   at 1, 4
      // - "she"  at 3
      // - "his"  at 1
      // - "hers" at 4
      const result = ahoCorasick("ahishers", ["he", "she", "his", "hers"]);
      expect(sortMatches(result)).toEqual([
        { patternIndex: 0, position: 1 },
        { patternIndex: 2, position: 1 },
        { patternIndex: 1, position: 3 },
        { patternIndex: 0, position: 4 },
        { patternIndex: 3, position: 4 },
      ]);
    });

    test("패턴이 텍스트와 동일", () => {
      const result = ahoCorasick("abc", ["abc"]);
      expect(sortMatches(result)).toEqual([{ patternIndex: 0, position: 0 }]);
    });

    test("겹치는 매칭을 모두 찾는다 — 'aaaa', ['aa']", () => {
      const result = ahoCorasick("aaaa", ["aa"]);
      expect(sortMatches(result)).toEqual([
        { patternIndex: 0, position: 0 },
        { patternIndex: 1 - 1, position: 1 },
        { patternIndex: 0, position: 2 },
      ]);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("어떤 패턴도 매칭되지 않으면 빈 배열을 반환한다", () => {
      expect(ahoCorasick("abcdef", ["xyz", "qrs"])).toEqual([]);
    });

    test("한 패턴이 다른 패턴의 접미사인 경우 (suffix link)", () => {
      // "abc"에서 "bc"는 "abc"의 접미사이므로 둘 다 매칭되어야 한다
      const result = ahoCorasick("abc", ["abc", "bc"]);
      expect(sortMatches(result)).toEqual([
        { patternIndex: 0, position: 0 },
        { patternIndex: 1, position: 1 },
      ]);
    });

    test("동일한 패턴이 여러 번 등장", () => {
      const result = ahoCorasick("abcabcabc", ["abc"]);
      expect(sortMatches(result)).toEqual([
        { patternIndex: 0, position: 0 },
        { patternIndex: 0, position: 3 },
        { patternIndex: 0, position: 6 },
      ]);
    });

    test("패턴이 텍스트보다 긴 경우", () => {
      expect(ahoCorasick("ab", ["abcdef"])).toEqual([]);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("길이 1의 패턴, 길이 1의 텍스트", () => {
      expect(ahoCorasick("a", ["a"])).toEqual([{ patternIndex: 0, position: 0 }]);
    });

    test("k = 1, 단일 패턴", () => {
      const result = ahoCorasick("xxaxxbxxa", ["a"]);
      expect(sortMatches(result)).toEqual([
        { patternIndex: 0, position: 2 },
        { patternIndex: 0, position: 8 },
      ]);
    });

    test("n = 100,000, 단일 매칭", () => {
      const text = "a".repeat(99_995) + "bcdef";
      const result = ahoCorasick(text, ["bcdef"]);
      expect(sortMatches(result)).toEqual([{ patternIndex: 0, position: 99_995 }]);
    });
  });

  // 성능 테스트 (O(n + sum|p_i| + z))
  describe("성능 테스트", () => {
    test("n=100,000, 단일 'a' 패턴을 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const text = "a".repeat(n);
      const start = performance.now();
      const result = ahoCorasick(text, ["a"]);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(n);
      expect(elapsed).toBeLessThan(100);
    });

    test("n=100,000, 여러 짧은 패턴을 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const text = "abcdef".repeat(Math.floor(n / 6));
      const patterns = ["abc", "bcd", "cde", "def", "efa", "fab"];

      const start = performance.now();
      const result = ahoCorasick(text, patterns);
      const elapsed = performance.now() - start;

      expect(result.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
