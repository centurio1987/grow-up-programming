import { test, expect, describe } from "bun:test";
import { suffixArray } from "./suffixArray";

function bruteSuffixArray(s: string): number[] {
  const n = s.length;
  const idx = Array.from({ length: n }, (_, i) => i);
  idx.sort((a, b) => {
    const sa = s.slice(a);
    const sb = s.slice(b);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  });
  return idx;
}

describe("suffixArray", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("문제 예시 — 'banana' → [5,3,1,0,4,2]", () => {
      expect(suffixArray("banana")).toEqual([5, 3, 1, 0, 4, 2]);
    });

    test("'abc' → [0,1,2]", () => {
      expect(suffixArray("abc")).toEqual([0, 1, 2]);
    });

    test("'cba' → [2,1,0]", () => {
      expect(suffixArray("cba")).toEqual([2, 1, 0]);
    });

    test("'mississippi' → brute-force와 일치", () => {
      const s = "mississippi";
      expect(suffixArray(s)).toEqual(bruteSuffixArray(s));
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("길이 1 문자열 → [0]", () => {
      expect(suffixArray("a")).toEqual([0]);
    });

    test("모든 문자가 동일 — 'aaaa' → [3,2,1,0]", () => {
      expect(suffixArray("aaaa")).toEqual([3, 2, 1, 0]);
    });

    test("두 문자 동일 — 'aa' → [1,0]", () => {
      expect(suffixArray("aa")).toEqual([1, 0]);
    });

    test("반복 패턴 — 'abab' → brute-force와 일치", () => {
      const s = "abab";
      expect(suffixArray(s)).toEqual(bruteSuffixArray(s));
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("두 문자 다름 — 'ab' → [0,1]", () => {
      expect(suffixArray("ab")).toEqual([0, 1]);
    });

    test("두 문자 다름 — 'ba' → [1,0]", () => {
      expect(suffixArray("ba")).toEqual([1, 0]);
    });

    test("길이 50 랜덤 문자열 → brute-force와 일치", () => {
      let s = "";
      const chars = "abcde";
      for (let i = 0; i < 50; i++) s += chars[i % chars.length];
      expect(suffixArray(s)).toEqual(bruteSuffixArray(s));
    });
  });

  // 성능 테스트 (O(n log n))
  describe("성능 테스트", () => {
    test("n=100,000, 동일 문자 입력을 100ms 이내에 처리한다", () => {
      const s = "a".repeat(100_000);
      const start = performance.now();
      const result = suffixArray(s);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(100_000);
      // 동일 문자열에서는 접미사가 짧을수록 사전순 앞 → 역순
      expect(result[0]).toBe(99_999);
      expect(elapsed).toBeLessThan(100);
    });

    test("n=100,000, 반복 패턴 입력을 100ms 이내에 처리한다", () => {
      const s = "abcde".repeat(20_000);
      const start = performance.now();
      const result = suffixArray(s);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(100_000);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
