import { test, expect, describe } from "bun:test";
import { RadixTree } from "./radixTree";

describe("RadixTree", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("삽입한 단어는 search에서 true를 반환한다", () => {
      const tree = new RadixTree();
      tree.insert("apple");
      expect(tree.search("apple")).toBe(true);
    });

    test("삽입하지 않은 단어는 false", () => {
      const tree = new RadixTree();
      tree.insert("apple");
      expect(tree.search("banana")).toBe(false);
    });

    test("접두사는 search에서 false, startsWith에서 true", () => {
      const tree = new RadixTree();
      tree.insert("apple");
      expect(tree.search("app")).toBe(false);
      expect(tree.startsWith("app")).toBe(true);
    });

    test("엣지 분할이 일어나는 경우 — 'apple' 후 'app' 삽입", () => {
      const tree = new RadixTree();
      tree.insert("apple");
      tree.insert("app");
      expect(tree.search("apple")).toBe(true);
      expect(tree.search("app")).toBe(true);
      expect(tree.search("appl")).toBe(false);
      expect(tree.startsWith("appl")).toBe(true);
    });

    test("공통 접두사로 분기 — 'apple', 'application' 모두 검색 가능", () => {
      const tree = new RadixTree();
      tree.insert("apple");
      tree.insert("application");
      expect(tree.search("apple")).toBe(true);
      expect(tree.search("application")).toBe(true);
      expect(tree.search("app")).toBe(false);
      expect(tree.startsWith("appli")).toBe(true);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("동일 단어 중복 삽입 — search는 여전히 true", () => {
      const tree = new RadixTree();
      tree.insert("hello");
      tree.insert("hello");
      expect(tree.search("hello")).toBe(true);
    });

    test("빈 tree에서 검색은 false", () => {
      const tree = new RadixTree();
      expect(tree.search("any")).toBe(false);
      expect(tree.startsWith("a")).toBe(false);
    });

    test("긴 단어보다 더 긴 검색어 — false", () => {
      const tree = new RadixTree();
      tree.insert("ab");
      expect(tree.search("abc")).toBe(false);
      expect(tree.startsWith("abc")).toBe(false);
    });

    test("startsWith은 존재하지 않는 접두사에 false", () => {
      const tree = new RadixTree();
      tree.insert("apple");
      expect(tree.startsWith("apx")).toBe(false);
    });

    test("접두사가 단어와 완전히 동일한 경우 — startsWith true", () => {
      const tree = new RadixTree();
      tree.insert("hello");
      expect(tree.startsWith("hello")).toBe(true);
    });

    test("Trie와의 차이: 'tester', 'test' 삽입 후 search/startsWith", () => {
      const tree = new RadixTree();
      tree.insert("tester");
      tree.insert("test");
      expect(tree.search("tester")).toBe(true);
      expect(tree.search("test")).toBe(true);
      expect(tree.search("teste")).toBe(false);
      expect(tree.startsWith("teste")).toBe(true);
      expect(tree.startsWith("testers")).toBe(false);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("길이 1 단어 삽입/검색", () => {
      const tree = new RadixTree();
      tree.insert("a");
      expect(tree.search("a")).toBe(true);
      expect(tree.search("b")).toBe(false);
      expect(tree.startsWith("a")).toBe(true);
    });

    test("긴 단어 (길이 1000) 삽입/검색", () => {
      const tree = new RadixTree();
      const word = "a".repeat(1000);
      tree.insert(word);
      expect(tree.search(word)).toBe(true);
      expect(tree.search("a".repeat(999))).toBe(false);
      expect(tree.startsWith("a".repeat(500))).toBe(true);
    });

    test("다수의 분기 시나리오 — 'romane','romanus','romulus','rubens','ruber','rubicon','rubicundus'", () => {
      const tree = new RadixTree();
      const words = [
        "romane",
        "romanus",
        "romulus",
        "rubens",
        "ruber",
        "rubicon",
        "rubicundus",
      ];
      for (const w of words) tree.insert(w);
      for (const w of words) expect(tree.search(w)).toBe(true);
      expect(tree.search("rom")).toBe(false);
      expect(tree.startsWith("rom")).toBe(true);
      expect(tree.startsWith("rubic")).toBe(true);
      expect(tree.startsWith("rz")).toBe(false);
    });
  });

  // 성능 테스트 (각 연산 O(L))
  describe("성능 테스트", () => {
    test("총 10^5 문자 삽입을 100ms 이내에 처리한다", () => {
      const tree = new RadixTree();
      const words: string[] = [];
      // 1000개 단어 * 평균 길이 100 ~= 10^5
      for (let i = 0; i < 1000; i++) {
        words.push("word" + i.toString().padStart(96, "0"));
      }

      const start = performance.now();
      for (const w of words) tree.insert(w);
      const elapsed = performance.now() - start;

      expect(tree.search(words[0]!)).toBe(true);
      expect(elapsed).toBeLessThan(100);
    });

    test("10^5 개 검색 호출을 100ms 이내에 처리한다", () => {
      const tree = new RadixTree();
      tree.insert("performance");

      const start = performance.now();
      for (let i = 0; i < 100_000; i++) {
        tree.search("performance");
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });
});
