import { test, expect, describe } from "bun:test";
import { TernarySearchTree } from "./ternarySearchTree";

describe("TernarySearchTree", () => {
  describe("기본", () => {
    test("단어 삽입 후 검색 성공", () => {
      const tst = new TernarySearchTree();
      tst.insert("apple");
      expect(tst.search("apple")).toBe(true);
    });

    test("삽입하지 않은 단어 검색 실패", () => {
      const tst = new TernarySearchTree();
      tst.insert("apple");
      expect(tst.search("app")).toBe(false);
      expect(tst.search("apples")).toBe(false);
      expect(tst.search("banana")).toBe(false);
    });

    test("여러 단어 삽입 후 각각 검색", () => {
      const tst = new TernarySearchTree();
      const words = ["cat", "car", "card", "care", "bat", "ball"];
      for (const w of words) tst.insert(w);
      for (const w of words) expect(tst.search(w)).toBe(true);
      expect(tst.search("ca")).toBe(false);
      expect(tst.search("cats")).toBe(false);
    });

    test("size()는 삽입한 단어 수를 반환", () => {
      const tst = new TernarySearchTree();
      expect(tst.size()).toBe(0);
      tst.insert("hello");
      expect(tst.size()).toBe(1);
      tst.insert("world");
      expect(tst.size()).toBe(2);
      tst.insert("hello"); // 중복 삽입 — size 증가 없음
      expect(tst.size()).toBe(2);
    });
  });

  describe("접두사 검색", () => {
    test("startsWith: 존재하는 접두사 확인", () => {
      const tst = new TernarySearchTree();
      tst.insert("apple");
      tst.insert("application");
      tst.insert("apply");
      expect(tst.startsWith("app")).toBe(true);
      expect(tst.startsWith("appl")).toBe(true);
      expect(tst.startsWith("apple")).toBe(true);
    });

    test("startsWith: 존재하지 않는 접두사 반환 false", () => {
      const tst = new TernarySearchTree();
      tst.insert("apple");
      expect(tst.startsWith("b")).toBe(false);
      expect(tst.startsWith("apples")).toBe(false);
    });

    test("wordsWithPrefix: 접두사에 해당하는 모든 단어 반환", () => {
      const tst = new TernarySearchTree();
      tst.insert("cat");
      tst.insert("car");
      tst.insert("card");
      tst.insert("care");
      tst.insert("bat");
      const result = tst.wordsWithPrefix("car").sort();
      expect(result).toEqual(["car", "card", "care"]);
    });

    test("wordsWithPrefix: 일치하는 단어가 없으면 빈 배열", () => {
      const tst = new TernarySearchTree();
      tst.insert("apple");
      expect(tst.wordsWithPrefix("xyz")).toEqual([]);
    });

    test("wordsWithPrefix: 접두사가 단어 자체일 때도 포함", () => {
      const tst = new TernarySearchTree();
      tst.insert("app");
      tst.insert("apple");
      tst.insert("application");
      const result = tst.wordsWithPrefix("app").sort();
      expect(result).toEqual(["app", "apple", "application"]);
    });
  });

  describe("삭제", () => {
    test("존재하는 단어 삭제 후 검색 실패", () => {
      const tst = new TernarySearchTree();
      tst.insert("apple");
      tst.insert("app");
      expect(tst.delete("apple")).toBe(true);
      expect(tst.search("apple")).toBe(false);
      expect(tst.search("app")).toBe(true); // 공유 노드 유지
    });

    test("삭제 후 size 감소", () => {
      const tst = new TernarySearchTree();
      tst.insert("hello");
      tst.insert("world");
      expect(tst.size()).toBe(2);
      tst.delete("hello");
      expect(tst.size()).toBe(1);
    });

    test("존재하지 않는 단어 삭제 시 false 반환", () => {
      const tst = new TernarySearchTree();
      tst.insert("apple");
      expect(tst.delete("banana")).toBe(false);
      expect(tst.delete("app")).toBe(false);
    });

    test("같은 단어를 두 번 삭제하면 두 번째는 false", () => {
      const tst = new TernarySearchTree();
      tst.insert("hello");
      expect(tst.delete("hello")).toBe(true);
      expect(tst.delete("hello")).toBe(false);
    });
  });

  describe("엣지", () => {
    test("빈 문자열 삽입 및 검색", () => {
      const tst = new TernarySearchTree();
      tst.insert("");
      expect(tst.search("")).toBe(true);
    });

    test("단일 문자 단어", () => {
      const tst = new TernarySearchTree();
      tst.insert("a");
      tst.insert("b");
      tst.insert("c");
      expect(tst.search("a")).toBe(true);
      expect(tst.search("b")).toBe(true);
      expect(tst.search("ab")).toBe(false);
    });

    test("동일한 단어 중복 삽입 — 단 한 번만 저장됨", () => {
      const tst = new TernarySearchTree();
      tst.insert("duplicate");
      tst.insert("duplicate");
      tst.insert("duplicate");
      expect(tst.size()).toBe(1);
      expect(tst.wordsWithPrefix("duplicate")).toEqual(["duplicate"]);
    });

    test("접두사-단어 관계: 접두사가 먼저 삽입된 경우", () => {
      const tst = new TernarySearchTree();
      tst.insert("app");
      tst.insert("apple");
      expect(tst.search("app")).toBe(true);
      expect(tst.search("apple")).toBe(true);
      expect(tst.startsWith("app")).toBe(true);
    });
  });

  describe("성능", () => {
    test("단어 10,000개 삽입 및 검색 100ms 이내", () => {
      const tst = new TernarySearchTree();
      const words: string[] = [];
      for (let i = 0; i < 10_000; i++) {
        words.push("word" + i);
      }

      const start = performance.now();
      for (const w of words) tst.insert(w);
      for (const w of words) {
        expect(tst.search(w)).toBe(true);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test("wordsWithPrefix 대용량 — 공통 접두사를 공유하는 1,000개 단어", () => {
      const tst = new TernarySearchTree();
      for (let i = 0; i < 1_000; i++) {
        tst.insert("prefix" + i);
      }
      const start = performance.now();
      const result = tst.wordsWithPrefix("prefix");
      const elapsed = performance.now() - start;
      expect(result.length).toBe(1_000);
      expect(elapsed).toBeLessThan(50);
    });
  });
});
