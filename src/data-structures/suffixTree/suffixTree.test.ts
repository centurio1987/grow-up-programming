import { test, expect, describe } from "bun:test";
import { SuffixTree } from "./suffixTree";

describe("SuffixTree", () => {
  describe("기본", () => {
    test("문자열에 포함된 패턴은 search가 true를 반환한다", () => {
      const tree = new SuffixTree("banana");
      expect(tree.search("ban")).toBe(true);
      expect(tree.search("ana")).toBe(true);
      expect(tree.search("nana")).toBe(true);
      expect(tree.search("banana")).toBe(true);
    });

    test("포함되지 않은 패턴은 search가 false를 반환한다", () => {
      const tree = new SuffixTree("banana");
      expect(tree.search("bana2")).toBe(false);
      expect(tree.search("xyz")).toBe(false);
      expect(tree.search("bananas")).toBe(false);
    });

    test("빈 패턴 search는 true를 반환한다", () => {
      const tree = new SuffixTree("hello");
      expect(tree.search("")).toBe(true);
    });

    test("findAll이 패턴의 모든 시작 인덱스를 반환한다", () => {
      const tree = new SuffixTree("banana");
      // "ana"는 인덱스 1, 3에서 시작
      const result = tree.findAll("ana").sort((a, b) => a - b);
      expect(result).toEqual([1, 3]);
    });

    test("findAll이 단일 등장 패턴의 인덱스를 반환한다", () => {
      const tree = new SuffixTree("banana");
      expect(tree.findAll("ban")).toEqual([0]);
    });

    test("findAll이 없는 패턴에 빈 배열을 반환한다", () => {
      const tree = new SuffixTree("banana");
      expect(tree.findAll("xyz")).toEqual([]);
    });

    test("longestRepeatedSubstring이 두 번 이상 반복되는 가장 긴 부분 문자열을 반환한다", () => {
      const tree = new SuffixTree("banana");
      // "ana"가 인덱스 1, 3에서 반복 — 길이 3
      const lrs = tree.longestRepeatedSubstring();
      expect(lrs.length).toBeGreaterThanOrEqual(2);
      // 반환된 문자열이 실제로 두 번 이상 등장하는지 검증
      const s = "banana";
      let count = 0;
      let idx = 0;
      while ((idx = s.indexOf(lrs, idx)) !== -1) { count++; idx++; }
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test("모든 문자가 다른 문자열의 longestRepeatedSubstring은 빈 문자열이다", () => {
      const tree = new SuffixTree("abcde");
      expect(tree.longestRepeatedSubstring()).toBe("");
    });

    test("모든 문자가 같은 문자열의 longestRepeatedSubstring이 올바르다", () => {
      // "aaaa" → "aaa" (3번 반복 등장)
      const tree = new SuffixTree("aaaa");
      const lrs = tree.longestRepeatedSubstring();
      expect(lrs).toBe("aaa");
    });

    test("단일 문자 문자열 처리", () => {
      const tree = new SuffixTree("a");
      expect(tree.search("a")).toBe(true);
      expect(tree.search("b")).toBe(false);
      expect(tree.findAll("a")).toEqual([0]);
      expect(tree.longestRepeatedSubstring()).toBe("");
    });

    test("패턴 전체가 원본과 같아도 search가 true를 반환한다", () => {
      const tree = new SuffixTree("hello");
      expect(tree.search("hello")).toBe(true);
    });
  });

  describe("엣지", () => {
    test("단일 문자 반복 패턴 findAll", () => {
      const tree = new SuffixTree("aaaa");
      // "a"는 인덱스 0,1,2,3에서 시작
      const result = tree.findAll("a").sort((a, b) => a - b);
      expect(result).toEqual([0, 1, 2, 3]);
    });

    test("패턴이 원본보다 길면 search가 false를 반환한다", () => {
      const tree = new SuffixTree("ab");
      expect(tree.search("abc")).toBe(false);
    });

    test("중복되지 않는 두 문자 문자열의 longestRepeatedSubstring은 빈 문자열", () => {
      const tree = new SuffixTree("ab");
      expect(tree.longestRepeatedSubstring()).toBe("");
    });

    test("findAll이 반환하는 인덱스가 실제로 유효한 시작 위치다", () => {
      const s = "mississippi";
      const tree = new SuffixTree(s);
      const pattern = "issi";
      const indices = tree.findAll(pattern);
      for (const idx of indices) {
        expect(s.slice(idx, idx + pattern.length)).toBe(pattern);
      }
    });

    test("mississippi의 longestRepeatedSubstring 검증", () => {
      // "issi" 또는 "iss" 등 반복되는 부분 문자열 확인
      const tree = new SuffixTree("mississippi");
      const lrs = tree.longestRepeatedSubstring();
      const s = "mississippi";
      let count = 0;
      let idx = 0;
      while ((idx = s.indexOf(lrs, idx)) !== -1) { count++; idx++; }
      expect(count).toBeGreaterThanOrEqual(2);
      expect(lrs.length).toBeGreaterThan(0);
    });
  });

  describe("성능", () => {
    test("길이 1000 문자열 구성 및 100회 검색이 200ms 이내에 완료된다", () => {
      const s = "abcde".repeat(200);
      const start = Date.now();
      const tree = new SuffixTree(s);
      for (let i = 0; i < 100; i++) {
        tree.search("abcde");
        tree.search("xyz");
      }
      expect(Date.now() - start).toBeLessThan(200);
    });

    test("길이 500 문자열의 longestRepeatedSubstring이 100ms 이내에 완료된다", () => {
      const s = "abcabc".repeat(83).slice(0, 500);
      const start = Date.now();
      const tree = new SuffixTree(s);
      const lrs = tree.longestRepeatedSubstring();
      expect(Date.now() - start).toBeLessThan(100);
      expect(typeof lrs).toBe("string");
    });
  });
});
