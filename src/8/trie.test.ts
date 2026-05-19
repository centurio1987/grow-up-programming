import { test, expect, describe } from "bun:test";
import { Trie } from "./trie";

describe("Trie", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("삽입한 단어는 search에서 true를 반환한다", () => {
      const trie = new Trie();
      trie.insert("apple");
      expect(trie.search("apple")).toBe(true);
    });

    test("삽입하지 않은 단어는 false", () => {
      const trie = new Trie();
      trie.insert("apple");
      expect(trie.search("banana")).toBe(false);
    });

    test("접두사는 search에서 false, startsWith에서 true", () => {
      const trie = new Trie();
      trie.insert("apple");
      expect(trie.search("app")).toBe(false);
      expect(trie.startsWith("app")).toBe(true);
    });

    test("여러 단어 삽입 및 검색", () => {
      const trie = new Trie();
      trie.insert("apple");
      trie.insert("app");
      trie.insert("application");
      expect(trie.search("apple")).toBe(true);
      expect(trie.search("app")).toBe(true);
      expect(trie.search("application")).toBe(true);
      expect(trie.search("ap")).toBe(false);
      expect(trie.startsWith("ap")).toBe(true);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("동일 단어 중복 삽입 — search는 여전히 true", () => {
      const trie = new Trie();
      trie.insert("hello");
      trie.insert("hello");
      expect(trie.search("hello")).toBe(true);
    });

    test("startsWith은 존재하지 않는 접두사에 false", () => {
      const trie = new Trie();
      trie.insert("apple");
      expect(trie.startsWith("apx")).toBe(false);
    });

    test("빈 trie에서 검색은 false", () => {
      const trie = new Trie();
      expect(trie.search("anything")).toBe(false);
      expect(trie.startsWith("any")).toBe(false);
    });

    test("긴 단어보다 더 긴 검색어 — false", () => {
      const trie = new Trie();
      trie.insert("ab");
      expect(trie.search("abc")).toBe(false);
      expect(trie.startsWith("abc")).toBe(false);
    });

    test("접두사가 단어와 완전히 동일한 경우 — startsWith true", () => {
      const trie = new Trie();
      trie.insert("hello");
      expect(trie.startsWith("hello")).toBe(true);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("길이 1 단어 삽입/검색", () => {
      const trie = new Trie();
      trie.insert("a");
      expect(trie.search("a")).toBe(true);
      expect(trie.search("b")).toBe(false);
      expect(trie.startsWith("a")).toBe(true);
    });

    test("긴 단어 (길이 1000) 삽입/검색", () => {
      const trie = new Trie();
      const word = "a".repeat(1000);
      trie.insert(word);
      expect(trie.search(word)).toBe(true);
      expect(trie.search("a".repeat(999))).toBe(false);
      expect(trie.startsWith("a".repeat(500))).toBe(true);
    });

    test("LeetCode 시나리오 — 같은 접두사를 가진 여러 단어", () => {
      const trie = new Trie();
      trie.insert("apple");
      expect(trie.search("apple")).toBe(true);
      expect(trie.search("app")).toBe(false);
      expect(trie.startsWith("app")).toBe(true);
      trie.insert("app");
      expect(trie.search("app")).toBe(true);
    });
  });

  // 성능 테스트 (각 연산 O(L))
  describe("성능 테스트", () => {
    test("총 10^5 문자 삽입을 100ms 이내에 처리한다", () => {
      const trie = new Trie();
      const words: string[] = [];
      // 1000개 단어 * 평균 길이 100 ~= 10^5
      for (let i = 0; i < 1000; i++) {
        words.push("word" + i.toString().padStart(96, "0"));
      }

      const start = performance.now();
      for (const w of words) trie.insert(w);
      const elapsed = performance.now() - start;

      expect(trie.search(words[0]!)).toBe(true);
      expect(elapsed).toBeLessThan(100);
    });

    test("10^5 개 검색 호출을 100ms 이내에 처리한다", () => {
      const trie = new Trie();
      trie.insert("performance");

      const start = performance.now();
      for (let i = 0; i < 100_000; i++) {
        trie.search("performance");
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });
});
