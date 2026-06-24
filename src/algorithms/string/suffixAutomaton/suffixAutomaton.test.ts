import { test, expect, describe } from "bun:test";
import { SuffixAutomaton } from "./suffixAutomaton";

function bruteDistinctSubstrings(s: string): number {
  const set = new Set<string>();
  const n = s.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j <= n; j++) {
      set.add(s.slice(i, j));
    }
  }
  return set.size;
}

describe("SuffixAutomaton", () => {
  // 기본 동작
  describe("countDistinctSubstrings — 기본 동작", () => {
    test("'abc' → {a,b,c,ab,bc,abc} = 6", () => {
      expect(new SuffixAutomaton("abc").countDistinctSubstrings()).toBe(6);
    });

    test("'aaa' → {a,aa,aaa} = 3", () => {
      expect(new SuffixAutomaton("aaa").countDistinctSubstrings()).toBe(3);
    });

    test("'abab' → {a,b,ab,ba,aba,bab,abab} = 7", () => {
      expect(new SuffixAutomaton("abab").countDistinctSubstrings()).toBe(7);
    });

    test("'banana' → brute-force와 일치", () => {
      expect(new SuffixAutomaton("banana").countDistinctSubstrings()).toBe(
        bruteDistinctSubstrings("banana"),
      );
    });

    test("'mississippi' → brute-force와 일치", () => {
      expect(new SuffixAutomaton("mississippi").countDistinctSubstrings()).toBe(
        bruteDistinctSubstrings("mississippi"),
      );
    });
  });

  describe("contains — 기본 동작", () => {
    test("부분 문자열이면 true", () => {
      const sam = new SuffixAutomaton("banana");
      expect(sam.contains("ana")).toBe(true);
      expect(sam.contains("ban")).toBe(true);
      expect(sam.contains("banana")).toBe(true);
      expect(sam.contains("a")).toBe(true);
    });

    test("부분 문자열이 아니면 false", () => {
      const sam = new SuffixAutomaton("banana");
      expect(sam.contains("bb")).toBe(false);
      expect(sam.contains("nb")).toBe(false);
      expect(sam.contains("bananas")).toBe(false);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("길이 1 문자열 — 'a' → 1개", () => {
      expect(new SuffixAutomaton("a").countDistinctSubstrings()).toBe(1);
    });

    test("길이 1 contains — 'a'에서 'a' true, 'b' false", () => {
      const sam = new SuffixAutomaton("a");
      expect(sam.contains("a")).toBe(true);
      expect(sam.contains("b")).toBe(false);
    });

    test("빈 문자열 검색 — 'banana'에서 '' true", () => {
      // 빈 문자열은 모든 문자열의 부분 문자열
      expect(new SuffixAutomaton("banana").contains("")).toBe(true);
    });

    test("자기 자신보다 긴 검색어 → false", () => {
      expect(new SuffixAutomaton("abc").contains("abcd")).toBe(false);
    });

    test("동일 문자 반복 — 'aaaaa' → 5개의 서로 다른 부분 문자열", () => {
      expect(new SuffixAutomaton("aaaaa").countDistinctSubstrings()).toBe(5);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("두 문자 다름 — 'ab' → {a,b,ab} = 3", () => {
      expect(new SuffixAutomaton("ab").countDistinctSubstrings()).toBe(3);
    });

    test("두 문자 동일 — 'aa' → {a,aa} = 2", () => {
      expect(new SuffixAutomaton("aa").countDistinctSubstrings()).toBe(2);
    });

    test("길이 30 랜덤 문자열 → brute-force와 일치", () => {
      const chars = "abc";
      let s = "";
      for (let i = 0; i < 30; i++) s += chars[i % chars.length];
      expect(new SuffixAutomaton(s).countDistinctSubstrings()).toBe(bruteDistinctSubstrings(s));
    });
  });

  // 성능 테스트 (O(n))
  describe("성능 테스트", () => {
    test("n=100,000, 구축 + countDistinctSubstrings를 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const chars = "abcdefghij";
      let s = "";
      for (let i = 0; i < n; i++) s += chars[i % chars.length];

      const start = performance.now();
      const sam = new SuffixAutomaton(s);
      const count = sam.countDistinctSubstrings();
      const elapsed = performance.now() - start;

      expect(count).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(100);
    });

    test("n=100,000, contains 호출이 빠르다", () => {
      const n = 100_000;
      const s = "a".repeat(n);
      const sam = new SuffixAutomaton(s);

      const start = performance.now();
      expect(sam.contains("a".repeat(1000))).toBe(true);
      expect(sam.contains("b")).toBe(false);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });
});
