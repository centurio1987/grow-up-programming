import { test, expect, describe } from "bun:test";
import { Trie } from "./trie";

describe("Trie", () => {
  describe("기본", () => {
    test("insert 후 search가 true를 반환한다", () => {
      const trie = new Trie();
      trie.insert("apple");
      expect(trie.search("apple")).toBe(true);
    });

    test("삽입하지 않은 단어는 search가 false를 반환한다", () => {
      const trie = new Trie();
      trie.insert("apple");
      expect(trie.search("app")).toBe(false);
      expect(trie.search("apples")).toBe(false);
    });

    test("startsWith는 접두사가 있으면 true를 반환한다", () => {
      const trie = new Trie();
      trie.insert("application");
      expect(trie.startsWith("app")).toBe(true);
      expect(trie.startsWith("appl")).toBe(true);
      expect(trie.startsWith("application")).toBe(true);
    });

    test("존재하지 않는 접두사는 startsWith가 false를 반환한다", () => {
      const trie = new Trie();
      trie.insert("apple");
      expect(trie.startsWith("banana")).toBe(false);
      expect(trie.startsWith("apples")).toBe(false);
    });

    test("delete 후 search가 false를 반환한다", () => {
      const trie = new Trie();
      trie.insert("apple");
      trie.insert("app");
      expect(trie.delete("apple")).toBe(true);
      expect(trie.search("apple")).toBe(false);
      expect(trie.search("app")).toBe(true); // 공유 경로 유지
    });

    test("없는 단어 delete는 false를 반환한다", () => {
      const trie = new Trie();
      trie.insert("apple");
      expect(trie.delete("banana")).toBe(false);
    });

    test("wordsWithPrefix로 접두사 단어 목록을 조회한다", () => {
      const trie = new Trie();
      ["apple", "application", "apt", "banana"].forEach(w => trie.insert(w));
      const result = trie.wordsWithPrefix("app");
      expect(result.sort()).toEqual(["apple", "application"].sort());
    });

    test("wordsWithPrefix에 빈 문자열을 넣으면 전체 단어를 반환한다", () => {
      const trie = new Trie();
      const words = ["cat", "car", "card", "care", "bat"];
      words.forEach(w => trie.insert(w));
      const result = trie.wordsWithPrefix("").sort();
      expect(result).toEqual([...words].sort());
    });

    test("size가 삽입된 단어 수를 반환한다", () => {
      const trie = new Trie();
      expect(trie.size()).toBe(0);
      trie.insert("hello");
      expect(trie.size()).toBe(1);
      trie.insert("world");
      expect(trie.size()).toBe(2);
      trie.insert("hello"); // 중복 무시
      expect(trie.size()).toBe(2);
    });

    test("delete 후 size가 감소한다", () => {
      const trie = new Trie();
      trie.insert("cat");
      trie.insert("car");
      trie.delete("cat");
      expect(trie.size()).toBe(1);
    });

    test("여러 단어가 공유 경로를 올바르게 유지한다", () => {
      const trie = new Trie();
      trie.insert("cat");
      trie.insert("car");
      trie.insert("card");
      trie.delete("car");
      expect(trie.search("car")).toBe(false);
      expect(trie.search("cat")).toBe(true);
      expect(trie.search("card")).toBe(true);
    });
  });

  describe("엣지", () => {
    test("빈 문자열 삽입 및 검색", () => {
      const trie = new Trie();
      trie.insert("");
      expect(trie.search("")).toBe(true);
    });

    test("같은 단어 중복 삽입해도 size는 1이다", () => {
      const trie = new Trie();
      trie.insert("duplicate");
      trie.insert("duplicate");
      expect(trie.size()).toBe(1);
    });

    test("한 단어가 다른 단어의 접두사인 경우 독립적으로 동작한다", () => {
      const trie = new Trie();
      trie.insert("a");
      trie.insert("ab");
      trie.insert("abc");
      expect(trie.search("a")).toBe(true);
      trie.delete("a");
      expect(trie.search("a")).toBe(false);
      expect(trie.search("ab")).toBe(true);
      expect(trie.search("abc")).toBe(true);
    });

    test("wordsWithPrefix에 일치하는 단어가 없으면 빈 배열을 반환한다", () => {
      const trie = new Trie();
      trie.insert("apple");
      expect(trie.wordsWithPrefix("xyz")).toEqual([]);
    });

    test("단일 문자 단어들을 정상 처리한다", () => {
      const trie = new Trie();
      ["a", "b", "c"].forEach(w => trie.insert(w));
      expect(trie.search("a")).toBe(true);
      expect(trie.startsWith("a")).toBe(true);
      expect(trie.size()).toBe(3);
    });
  });

  describe("성능", () => {
    test("10000개 단어 삽입 및 검색이 100ms 이내에 완료된다", () => {
      const trie = new Trie();
      const words = Array.from({ length: 10000 }, (_, i) => `word${i}`);
      const start = Date.now();
      words.forEach(w => trie.insert(w));
      words.forEach(w => expect(trie.search(w)).toBe(true));
      expect(Date.now() - start).toBeLessThan(100);
    });

    test("wordsWithPrefix가 1000개 결과를 50ms 이내에 반환한다", () => {
      const trie = new Trie();
      for (let i = 0; i < 1000; i++) trie.insert(`prefix_item_${i}`);
      const start = Date.now();
      const result = trie.wordsWithPrefix("prefix_");
      expect(result.length).toBe(1000);
      expect(Date.now() - start).toBeLessThan(50);
    });
  });
});
