import { test, expect, describe } from "bun:test";
import { RollingHash } from "./rollingHash";

describe("RollingHash", () => {
  describe("기본", () => {
    test("hash(): 같은 문자열은 같은 해시값 반환", () => {
      const rh = new RollingHash();
      expect(rh.hash("hello")).toBe(rh.hash("hello"));
    });

    test("hash(): 다른 문자열은 다른 해시값 반환 (높은 확률)", () => {
      const rh = new RollingHash();
      expect(rh.hash("hello")).not.toBe(rh.hash("world"));
      expect(rh.hash("abc")).not.toBe(rh.hash("bca"));
      expect(rh.hash("abc")).not.toBe(rh.hash("cab"));
    });

    test("hash(): 빈 문자열은 0 반환", () => {
      const rh = new RollingHash();
      expect(rh.hash("")).toBe(0);
    });

    test("hash(): 단일 문자", () => {
      const rh = new RollingHash();
      const h = rh.hash("a");
      expect(typeof h).toBe("number");
      expect(h).toBeGreaterThanOrEqual(0);
    });
  });

  describe("패턴 매칭", () => {
    test("단순 패턴 검색 — 단일 등장", () => {
      const rh = new RollingHash();
      expect(rh.search("hello world", "world")).toEqual([6]);
    });

    test("패턴 여러 번 등장", () => {
      const rh = new RollingHash();
      const result = rh.search("ababab", "ab");
      expect(result).toEqual([0, 2, 4]);
    });

    test("패턴이 없는 경우 빈 배열", () => {
      const rh = new RollingHash();
      expect(rh.search("hello", "xyz")).toEqual([]);
    });

    test("패턴이 텍스트 전체", () => {
      const rh = new RollingHash();
      expect(rh.search("hello", "hello")).toEqual([0]);
    });

    test("패턴이 텍스트보다 긴 경우 빈 배열", () => {
      const rh = new RollingHash();
      expect(rh.search("ab", "abcd")).toEqual([]);
    });

    test("단일 문자 패턴 반복", () => {
      const rh = new RollingHash();
      const result = rh.search("banana", "a");
      expect(result).toEqual([1, 3, 5]);
    });

    test("중첩되는 패턴 — 'aa' in 'aaaa'", () => {
      const rh = new RollingHash();
      const result = rh.search("aaaa", "aa");
      expect(result).toEqual([0, 1, 2]);
    });

    test("결과는 오름차순으로 정렬됨", () => {
      const rh = new RollingHash();
      const result = rh.search("abcabc", "abc");
      expect(result).toEqual([0, 3]);
    });
  });

  describe("해시 일관성", () => {
    test("같은 base/mod로 생성한 두 인스턴스는 같은 해시", () => {
      const rh1 = new RollingHash(31, 1_000_000_007);
      const rh2 = new RollingHash(31, 1_000_000_007);
      expect(rh1.hash("test")).toBe(rh2.hash("test"));
    });

    test("다른 base로 생성하면 다른 해시 (높은 확률)", () => {
      const rh1 = new RollingHash(31, 1_000_000_007);
      const rh2 = new RollingHash(37, 1_000_000_007);
      // 일반적으로 다른 base는 다른 해시를 생성
      // 단, 충돌 가능성 있으므로 단 하나만으로 단언하지 않음
      const h1 = rh1.hash("abcdefghij");
      const h2 = rh2.hash("abcdefghij");
      // 충돌 없는 일반 케이스
      expect(h1).not.toBe(h2);
    });
  });

  describe("엣지", () => {
    test("빈 텍스트에서 패턴 검색 → 빈 배열", () => {
      const rh = new RollingHash();
      expect(rh.search("", "abc")).toEqual([]);
    });

    test("빈 패턴 검색 → 빈 배열 또는 모든 위치", () => {
      const rh = new RollingHash();
      // 빈 패턴은 정의에 따라 빈 배열 반환 허용
      const result = rh.search("hello", "");
      expect(Array.isArray(result)).toBe(true);
    });

    test("단일 문자 텍스트와 단일 문자 패턴", () => {
      const rh = new RollingHash();
      expect(rh.search("a", "a")).toEqual([0]);
      expect(rh.search("a", "b")).toEqual([]);
    });

    test("해시값은 mod 범위 내", () => {
      const mod = 1_000_000_007;
      const rh = new RollingHash(31, mod);
      const h = rh.hash("thisisaverylongstring");
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(mod);
    });
  });

  describe("성능", () => {
    test("길이 100,000 텍스트에서 패턴 검색 100ms 이내", () => {
      const rh = new RollingHash();
      const text = "a".repeat(99_997) + "abc";
      const start = performance.now();
      const result = rh.search(text, "abc");
      const elapsed = performance.now() - start;
      expect(result).toContain(99_997);
      expect(elapsed).toBeLessThan(100);
    });

    test("패턴이 1,000번 등장하는 경우 모두 찾기 100ms 이내", () => {
      const rh = new RollingHash();
      const text = "ab".repeat(1_000);
      const start = performance.now();
      const result = rh.search(text, "ab");
      const elapsed = performance.now() - start;
      expect(result.length).toBe(1_000);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
