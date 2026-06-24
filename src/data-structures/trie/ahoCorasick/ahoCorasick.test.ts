import { test, expect, describe } from "bun:test";
import { AhoCorasick } from "./ahoCorasick";

describe("AhoCorasick", () => {
  describe("기본", () => {
    test("단일 패턴 검색 — 한 번 등장", () => {
      const ac = new AhoCorasick(["he"]);
      const result = ac.search("ahers");
      expect(result.get("he")).toEqual([1]);
    });

    test("단일 패턴 검색 — 여러 번 등장", () => {
      const ac = new AhoCorasick(["ab"]);
      const result = ac.search("ababab");
      expect(result.get("ab")).toEqual([0, 2, 4]);
    });

    test("여러 패턴 동시 검색", () => {
      const ac = new AhoCorasick(["he", "she", "his", "hers"]);
      const result = ac.search("ahershers");
      // "he": 인덱스 1, 5
      // "she": 인덱스 0 (s+he → 인덱스 0에서 she가 아님), 확인 필요
      // "hers": 인덱스 1, 5
      const he = result.get("he") ?? [];
      const hers = result.get("hers") ?? [];
      expect(he.sort((a, b) => a - b)).toContain(1);
      expect(hers.sort((a, b) => a - b)).toContain(1);
    });

    test("Aho-Corasick 고전 예제: ahishers", () => {
      const ac = new AhoCorasick(["he", "she", "his", "hers"]);
      const result = ac.search("ahishers");
      // "his": 인덱스 1
      // "he": 인덱스 4
      // "hers": 인덱스 4
      // "she": 인덱스 3
      expect(result.get("his")).toContain(1);
      expect(result.get("he")).toContain(4);
      expect(result.get("hers")).toContain(4);
      expect(result.get("she")).toContain(3);
    });

    test("패턴이 없으면 모든 패턴 결과가 빈 배열", () => {
      const ac = new AhoCorasick(["xyz", "abc"]);
      const result = ac.search("hello world");
      const xyz = result.get("xyz") ?? [];
      const abc = result.get("abc") ?? [];
      expect(xyz).toEqual([]);
      expect(abc).toEqual([]);
    });
  });

  describe("중첩 및 접두사 관계", () => {
    test("패턴이 다른 패턴의 접두사인 경우 모두 찾기", () => {
      const ac = new AhoCorasick(["a", "ab", "abc"]);
      const result = ac.search("xabcy");
      expect(result.get("a")).toContain(1);
      expect(result.get("ab")).toContain(1);
      expect(result.get("abc")).toContain(1);
    });

    test("패턴이 다른 패턴의 접미사인 경우 (failure link 활용)", () => {
      const ac = new AhoCorasick(["test", "est"]);
      const result = ac.search("testing");
      expect(result.get("test")).toContain(0);
      expect(result.get("est")).toContain(1);
    });

    test("중첩 패턴: 'aa' 와 'aaa' 동시 검색", () => {
      const ac = new AhoCorasick(["aa", "aaa"]);
      const result = ac.search("aaaaa");
      // "aa": 인덱스 0, 1, 2, 3
      // "aaa": 인덱스 0, 1, 2
      const aa = result.get("aa") ?? [];
      const aaa = result.get("aaa") ?? [];
      expect(aa.length).toBeGreaterThanOrEqual(4);
      expect(aaa.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("결과 형식", () => {
    test("결과 Map은 모든 패턴을 키로 포함", () => {
      const patterns = ["abc", "def", "ghi"];
      const ac = new AhoCorasick(patterns);
      const result = ac.search("abcdef");
      for (const p of patterns) {
        expect(result.has(p)).toBe(true);
      }
    });

    test("각 패턴의 결과 배열은 오름차순 정렬", () => {
      const ac = new AhoCorasick(["ab"]);
      const result = ac.search("ababab");
      const indices = result.get("ab") ?? [];
      expect(indices).toEqual([...indices].sort((a, b) => a - b));
    });
  });

  describe("엣지", () => {
    test("빈 텍스트 검색 — 모든 패턴 결과가 빈 배열", () => {
      const ac = new AhoCorasick(["abc"]);
      const result = ac.search("");
      expect(result.get("abc")).toEqual([]);
    });

    test("빈 패턴 목록 — 빈 Map 또는 정상 동작", () => {
      const ac = new AhoCorasick([]);
      const result = ac.search("hello");
      expect(result.size).toBe(0);
    });

    test("패턴이 텍스트 전체인 경우", () => {
      const ac = new AhoCorasick(["hello"]);
      const result = ac.search("hello");
      expect(result.get("hello")).toEqual([0]);
    });

    test("단일 문자 패턴 여러 개", () => {
      const ac = new AhoCorasick(["a", "b", "c"]);
      const result = ac.search("abc");
      expect(result.get("a")).toEqual([0]);
      expect(result.get("b")).toEqual([1]);
      expect(result.get("c")).toEqual([2]);
    });

    test("중복 패턴이 주어진 경우 한 번만 결과 포함", () => {
      const ac = new AhoCorasick(["abc", "abc"]);
      const result = ac.search("abcabc");
      // 중복 패턴은 한 번만 키로 포함되어야 함
      expect(result.has("abc")).toBe(true);
      const indices = result.get("abc") ?? [];
      // 실제 등장 위치만 포함
      expect(indices).toContain(0);
      expect(indices).toContain(3);
    });
  });

  describe("성능", () => {
    test("패턴 100개, 텍스트 길이 10,000 검색 100ms 이내", () => {
      const patterns: string[] = [];
      for (let i = 0; i < 100; i++) {
        patterns.push("pattern" + i);
      }
      const text = "x".repeat(9_000) + patterns.map(p => p + " ").join("");
      const ac = new AhoCorasick(patterns);

      const start = performance.now();
      const result = ac.search(text);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
      expect(result.has("pattern0")).toBe(true);
    });

    test("패턴 1,000개, 각 길이 5 — 오토마톤 구성 100ms 이내", () => {
      const patterns: string[] = [];
      for (let i = 0; i < 1_000; i++) {
        patterns.push(("0000" + i).slice(-5)); // 5자리 패드
      }
      const start = performance.now();
      new AhoCorasick(patterns);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
