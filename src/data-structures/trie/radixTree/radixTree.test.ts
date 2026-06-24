import { test, expect, describe } from "bun:test";
import { RadixTree } from "./radixTree";

describe("RadixTree", () => {
  describe("기본", () => {
    test("insert 후 search가 true를 반환한다", () => {
      const tree = new RadixTree();
      tree.insert("romane");
      expect(tree.search("romane")).toBe(true);
    });

    test("삽입하지 않은 단어는 false를 반환한다", () => {
      const tree = new RadixTree();
      tree.insert("romane");
      expect(tree.search("roman")).toBe(false);
      expect(tree.search("romani")).toBe(false);
    });

    test("공통 접두사를 공유하는 단어들을 올바르게 삽입한다", () => {
      const tree = new RadixTree();
      const words = ["romane", "romanus", "romulus", "rubens", "ruber", "rubicon", "rubicundus"];
      words.forEach(w => tree.insert(w));
      words.forEach(w => expect(tree.search(w)).toBe(true));
    });

    test("startsWith는 접두사 경로가 있으면 true를 반환한다", () => {
      const tree = new RadixTree();
      tree.insert("application");
      tree.insert("apple");
      expect(tree.startsWith("app")).toBe(true);
      expect(tree.startsWith("appl")).toBe(true);
    });

    test("존재하지 않는 접두사는 startsWith가 false를 반환한다", () => {
      const tree = new RadixTree();
      tree.insert("apple");
      expect(tree.startsWith("banana")).toBe(false);
    });

    test("delete 후 해당 단어의 search가 false를 반환한다", () => {
      const tree = new RadixTree();
      tree.insert("apple");
      tree.insert("application");
      expect(tree.delete("apple")).toBe(true);
      expect(tree.search("apple")).toBe(false);
      expect(tree.search("application")).toBe(true);
    });

    test("없는 단어 delete는 false를 반환한다", () => {
      const tree = new RadixTree();
      tree.insert("apple");
      expect(tree.delete("banana")).toBe(false);
    });

    test("wordsWithPrefix로 접두사 일치 단어를 조회한다", () => {
      const tree = new RadixTree();
      ["apple", "application", "apt", "banana"].forEach(w => tree.insert(w));
      const result = tree.wordsWithPrefix("app").sort();
      expect(result).toEqual(["apple", "application"].sort());
    });

    test("wordsWithPrefix에 빈 문자열은 전체 단어를 반환한다", () => {
      const tree = new RadixTree();
      const words = ["cat", "car", "card", "care", "bat"];
      words.forEach(w => tree.insert(w));
      expect(tree.wordsWithPrefix("").sort()).toEqual([...words].sort());
    });

    test("size가 삽입된 단어 수를 올바르게 반환한다", () => {
      const tree = new RadixTree();
      expect(tree.size()).toBe(0);
      tree.insert("hello");
      expect(tree.size()).toBe(1);
      tree.insert("world");
      expect(tree.size()).toBe(2);
      tree.insert("hello"); // 중복 무시
      expect(tree.size()).toBe(2);
    });

    test("delete 후 size가 감소한다", () => {
      const tree = new RadixTree();
      tree.insert("cat");
      tree.insert("car");
      tree.delete("cat");
      expect(tree.size()).toBe(1);
    });

    test("에지 분할(split) 후 기존 단어들이 유지된다", () => {
      const tree = new RadixTree();
      tree.insert("test");
      tree.insert("testing");
      tree.insert("tester");
      expect(tree.search("test")).toBe(true);
      expect(tree.search("testing")).toBe(true);
      expect(tree.search("tester")).toBe(true);
    });
  });

  describe("엣지", () => {
    test("빈 문자열 삽입 및 검색", () => {
      const tree = new RadixTree();
      tree.insert("");
      expect(tree.search("")).toBe(true);
      expect(tree.startsWith("")).toBe(true);
    });

    test("같은 단어 중복 삽입해도 size는 1이다", () => {
      const tree = new RadixTree();
      tree.insert("duplicate");
      tree.insert("duplicate");
      expect(tree.size()).toBe(1);
    });

    test("한 단어가 다른 단어의 접두사인 경우 독립적으로 동작한다", () => {
      const tree = new RadixTree();
      tree.insert("a");
      tree.insert("ab");
      tree.insert("abc");
      expect(tree.search("a")).toBe(true);
      tree.delete("a");
      expect(tree.search("a")).toBe(false);
      expect(tree.search("ab")).toBe(true);
      expect(tree.search("abc")).toBe(true);
    });

    test("완전히 다른 단어들을 삽입하면 각각 독립된 에지를 가진다", () => {
      const tree = new RadixTree();
      tree.insert("xyz");
      tree.insert("abc");
      expect(tree.search("xyz")).toBe(true);
      expect(tree.search("abc")).toBe(true);
      expect(tree.search("xya")).toBe(false);
    });

    test("delete 후 병합으로 불필요한 중간 노드가 제거된다", () => {
      const tree = new RadixTree();
      tree.insert("test");
      tree.insert("testing");
      tree.delete("test");
      // "testing"은 여전히 존재해야 함
      expect(tree.search("testing")).toBe(true);
      expect(tree.search("test")).toBe(false);
    });
  });

  describe("성능", () => {
    test("10000개 단어 삽입 및 검색이 100ms 이내에 완료된다", () => {
      const tree = new RadixTree();
      const words = Array.from({ length: 10000 }, (_, i) => `word${i}`);
      const start = Date.now();
      words.forEach(w => tree.insert(w));
      words.forEach(w => expect(tree.search(w)).toBe(true));
      expect(Date.now() - start).toBeLessThan(100);
    });

    test("wordsWithPrefix가 1000개 결과를 50ms 이내에 반환한다", () => {
      const tree = new RadixTree();
      for (let i = 0; i < 1000; i++) tree.insert(`prefix_item_${i}`);
      const start = Date.now();
      const result = tree.wordsWithPrefix("prefix_");
      expect(result.length).toBe(1000);
      expect(Date.now() - start).toBeLessThan(50);
    });
  });
});
