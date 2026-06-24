import { test, expect, describe } from "bun:test";
import { SuffixArray } from "./suffixArray";

describe("SuffixArray", () => {
  describe("기본", () => {
    test("suffixes()는 정렬된 접미사를 반환", () => {
      const sa = new SuffixArray("banana");
      // 접미사: banana(0), anana(1), nana(2), ana(3), na(4), a(5)
      // 정렬:   a(5), ana(3), anana(1), banana(0), na(4), nana(2)
      expect(sa.suffixes()).toEqual(["a", "ana", "anana", "banana", "na", "nana"]);
    });

    test("단일 문자 문자열", () => {
      const sa = new SuffixArray("a");
      expect(sa.suffixes()).toEqual(["a"]);
    });

    test("모든 문자가 같은 문자열", () => {
      const sa = new SuffixArray("aaa");
      // 접미사: aaa(0), aa(1), a(2) → 정렬: a, aa, aaa
      expect(sa.suffixes()).toEqual(["a", "aa", "aaa"]);
    });
  });

  describe("패턴 검색", () => {
    test("단일 패턴 등장 위치 반환", () => {
      const sa = new SuffixArray("banana");
      const result = sa.search("ana");
      result.sort((a, b) => a - b);
      expect(result).toEqual([1, 3]); // "banana"에서 "ana"는 인덱스 1, 3
    });

    test("패턴이 없으면 빈 배열", () => {
      const sa = new SuffixArray("banana");
      expect(sa.search("xyz")).toEqual([]);
    });

    test("패턴이 문자열 전체인 경우", () => {
      const sa = new SuffixArray("hello");
      expect(sa.search("hello")).toEqual([0]);
    });

    test("단일 문자 패턴 — 여러 등장", () => {
      const sa = new SuffixArray("banana");
      const result = sa.search("a");
      result.sort((a, b) => a - b);
      expect(result).toEqual([1, 3, 5]);
    });

    test("패턴이 문자열보다 긴 경우 빈 배열", () => {
      const sa = new SuffixArray("ab");
      expect(sa.search("abc")).toEqual([]);
    });

    test("결과가 정렬된 상태로 반환", () => {
      const sa = new SuffixArray("ababab");
      const result = sa.search("ab");
      expect(result).toEqual([...result].sort((a, b) => a - b));
    });
  });

  describe("LCP", () => {
    test("lcp: 같은 인덱스 — 접미사 자체의 길이", () => {
      // lcp(i, i)는 suffixArray[i] 접미사와 자기 자신의 공통 접두사 길이
      const sa = new SuffixArray("banana");
      // lcp(0, 0): suffixes()[0] = "a" → 길이 1
      expect(sa.lcp(0, 0)).toBe(1);
    });

    test("lcp: 인접한 두 접미사의 공통 접두사 길이", () => {
      const sa = new SuffixArray("banana");
      // suffixes(): ["a", "ana", "anana", "banana", "na", "nana"]
      // lcp(1, 2): "ana"와 "anana" → 공통 접두사 "ana" → 길이 3
      expect(sa.lcp(1, 2)).toBe(3);
    });

    test("lcp: 공통 접두사가 없는 경우 0 반환", () => {
      const sa = new SuffixArray("banana");
      // "a"(0번)와 "banana"(3번) → 공통 접두사 없음
      expect(sa.lcp(0, 3)).toBe(0);
    });
  });

  describe("최장 반복 부분 문자열", () => {
    test("banana의 최장 반복 부분 문자열은 'ana'", () => {
      const sa = new SuffixArray("banana");
      expect(sa.longestRepeatedSubstring()).toBe("ana");
    });

    test("모든 문자가 다르면 빈 문자열", () => {
      const sa = new SuffixArray("abcde");
      expect(sa.longestRepeatedSubstring()).toBe("");
    });

    test("모든 문자가 같으면 n-1 길이의 문자열", () => {
      const sa = new SuffixArray("aaaa");
      expect(sa.longestRepeatedSubstring()).toBe("aaa");
    });

    test("단일 문자는 빈 문자열 반환", () => {
      const sa = new SuffixArray("a");
      expect(sa.longestRepeatedSubstring()).toBe("");
    });
  });

  describe("엣지", () => {
    test("빈 문자열 처리", () => {
      const sa = new SuffixArray("");
      expect(sa.suffixes()).toEqual([]);
      expect(sa.search("a")).toEqual([]);
      expect(sa.longestRepeatedSubstring()).toBe("");
    });

    test("길이 1 문자열", () => {
      const sa = new SuffixArray("z");
      expect(sa.search("z")).toEqual([0]);
      expect(sa.search("a")).toEqual([]);
      expect(sa.longestRepeatedSubstring()).toBe("");
    });

    test("패턴 검색: 중첩 패턴 — 'aa' in 'aaaa'", () => {
      const sa = new SuffixArray("aaaa");
      const result = sa.search("aa");
      result.sort((a, b) => a - b);
      expect(result).toEqual([0, 1, 2]);
    });
  });

  describe("성능", () => {
    test("길이 1,000 문자열 구성 및 검색 100ms 이내", () => {
      const s = "abcdefghij".repeat(100); // 길이 1000
      const start = performance.now();
      const sa = new SuffixArray(s);
      const result = sa.search("abcde");
      const elapsed = performance.now() - start;
      expect(result.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(100);
    });

    test("longestRepeatedSubstring 길이 500 문자열 1초 이내", () => {
      const s = "abcabc".repeat(83); // ~498자
      const start = performance.now();
      const sa = new SuffixArray(s);
      const lrs = sa.longestRepeatedSubstring();
      const elapsed = performance.now() - start;
      expect(lrs.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(1000);
    });
  });
});
