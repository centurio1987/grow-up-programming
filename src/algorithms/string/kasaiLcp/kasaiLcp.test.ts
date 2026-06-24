import { test, expect, describe } from "bun:test";
import { kasaiLcp } from "./kasaiLcp";

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

function bruteLcp(s: string, sa: number[]): number[] {
  const n = s.length;
  const lcp = new Array<number>(n).fill(0);
  for (let i = 0; i < n - 1; i++) {
    const a = sa[i]!;
    const b = sa[i + 1]!;
    let k = 0;
    while (a + k < n && b + k < n && s[a + k] === s[b + k]) k++;
    lcp[i] = k;
  }
  lcp[n - 1] = 0;
  return lcp;
}

describe("kasaiLcp", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("문제 예시 — 'banana', sa=[5,3,1,0,4,2] → [1,3,0,0,2,0]", () => {
      expect(kasaiLcp("banana", [5, 3, 1, 0, 4, 2])).toEqual([1, 3, 0, 0, 2, 0]);
    });

    test("'abc', sa=[0,1,2] → [0,0,0] (공통 접두사 없음)", () => {
      expect(kasaiLcp("abc", [0, 1, 2])).toEqual([0, 0, 0]);
    });

    test("'mississippi' → brute-force와 일치", () => {
      const s = "mississippi";
      const sa = bruteSuffixArray(s);
      expect(kasaiLcp(s, sa)).toEqual(bruteLcp(s, sa));
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("길이 1 문자열 — 'a', sa=[0] → [0]", () => {
      expect(kasaiLcp("a", [0])).toEqual([0]);
    });

    test("모든 문자가 동일 — 'aaaa', sa=[3,2,1,0] → [1,2,3,0]", () => {
      // suffix lengths: 1,2,3,4 → lcps: 1, 2, 3, 마지막=0
      expect(kasaiLcp("aaaa", [3, 2, 1, 0])).toEqual([1, 2, 3, 0]);
    });

    test("'aa' — sa=[1,0] → [1,0]", () => {
      expect(kasaiLcp("aa", [1, 0])).toEqual([1, 0]);
    });

    test("'abab' → brute-force와 일치", () => {
      const s = "abab";
      const sa = bruteSuffixArray(s);
      expect(kasaiLcp(s, sa)).toEqual(bruteLcp(s, sa));
    });

    test("마지막 원소는 항상 0 (Kasai 규약)", () => {
      const s = "complicated";
      const sa = bruteSuffixArray(s);
      const lcp = kasaiLcp(s, sa);
      expect(lcp[lcp.length - 1]).toBe(0);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("두 문자 동일 — 'aa', sa=[1,0]", () => {
      expect(kasaiLcp("aa", [1, 0])).toEqual([1, 0]);
    });

    test("길이 50 반복 패턴 → brute-force와 일치", () => {
      const s = "ababab".repeat(8) + "ab";
      const sa = bruteSuffixArray(s);
      expect(kasaiLcp(s, sa)).toEqual(bruteLcp(s, sa));
    });
  });

  // 성능 테스트 (O(n))
  describe("성능 테스트", () => {
    test("n=100,000, 동일 문자 입력을 100ms 이내에 처리한다", () => {
      const n = 100_000;
      const s = "a".repeat(n);
      const sa = Array.from({ length: n }, (_, i) => n - 1 - i);

      const start = performance.now();
      const result = kasaiLcp(s, sa);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(n);
      expect(result[n - 1]).toBe(0);
      // 동일 문자열에서 인접 접미사의 lcp는 짧은 쪽 길이
      expect(result[0]).toBe(1);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
