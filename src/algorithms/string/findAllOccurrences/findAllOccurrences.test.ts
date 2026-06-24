import { test, expect, describe } from "bun:test";
import { findAllOccurrences } from "./findAllOccurrences";

describe("findAllOccurrences", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("단일 등장 위치를 찾는다", () => {
      expect(findAllOccurrences("hello world", "world")).toEqual([6]);
    });

    test("여러 등장 위치를 찾는다", () => {
      expect(findAllOccurrences("ababab", "ab")).toEqual([0, 2, 4]);
    });

    test("패턴이 텍스트와 동일한 경우", () => {
      expect(findAllOccurrences("abc", "abc")).toEqual([0]);
    });

    test("문제 예시 — 'aaaa'에서 'aa' 검색 → [0,1,2]", () => {
      expect(findAllOccurrences("aaaa", "aa")).toEqual([0, 1, 2]);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("패턴이 등장하지 않으면 빈 배열을 반환한다", () => {
      expect(findAllOccurrences("abcdef", "xyz")).toEqual([]);
    });

    test("패턴이 텍스트보다 길면 빈 배열", () => {
      expect(findAllOccurrences("ab", "abcd")).toEqual([]);
    });

    test("빈 패턴은 빈 배열을 반환한다 (구현 규약)", () => {
      expect(findAllOccurrences("hello", "")).toEqual([]);
    });

    test("빈 텍스트는 빈 배열을 반환한다", () => {
      expect(findAllOccurrences("", "a")).toEqual([]);
    });

    test("겹치는 패턴 — 'aaaaa'에서 'aaa' 검색 → [0,1,2]", () => {
      expect(findAllOccurrences("aaaaa", "aaa")).toEqual([0, 1, 2]);
    });

    test("KMP failure function 동작 검증 — 'abababab'에서 'abab' 검색", () => {
      expect(findAllOccurrences("abababab", "abab")).toEqual([0, 2, 4]);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("길이 1의 텍스트, 길이 1의 패턴 (일치)", () => {
      expect(findAllOccurrences("a", "a")).toEqual([0]);
    });

    test("길이 1의 텍스트, 길이 1의 패턴 (불일치)", () => {
      expect(findAllOccurrences("a", "b")).toEqual([]);
    });

    test("패턴이 텍스트의 맨 끝에 등장하는 경우", () => {
      expect(findAllOccurrences("abcabc", "abc")).toEqual([0, 3]);
    });

    test("n = 100,000, 단일 패턴 등장", () => {
      const text = "a".repeat(99_995) + "bcdef";
      const result = findAllOccurrences(text, "bcdef");
      expect(result).toEqual([99_995]);
    });
  });

  // 성능 테스트 (O(n+m), n=10^5)
  describe("성능 테스트", () => {
    test("n=100,000, m=100 입력을 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const text = "a".repeat(n);
      const pattern = "a".repeat(100);

      const start = performance.now();
      const result = findAllOccurrences(text, pattern);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(n - 100 + 1);
      expect(elapsed).toBeLessThan(100);
    });

    test("n=100,000, m=1000 worst-case 입력을 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const text = "a".repeat(n - 1) + "b";
      const pattern = "a".repeat(999) + "b";

      const start = performance.now();
      const result = findAllOccurrences(text, pattern);
      const elapsed = performance.now() - start;

      expect(result).toEqual([n - 1000]);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
