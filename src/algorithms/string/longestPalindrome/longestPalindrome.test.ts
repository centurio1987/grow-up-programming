import { test, expect, describe } from "bun:test";
import { longestPalindrome } from "./longestPalindrome";

function isPalindrome(s: string): boolean {
  for (let i = 0, j = s.length - 1; i < j; i++, j--) {
    if (s[i] !== s[j]) return false;
  }
  return true;
}

describe("longestPalindrome", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("문제 예시 — 'babad' → 길이 3의 회문 ('bab' 또는 'aba')", () => {
      const result = longestPalindrome("babad");
      expect(result.length).toBe(3);
      expect(isPalindrome(result)).toBe(true);
      expect("babad".includes(result)).toBe(true);
    });

    test("짝수 길이 회문 — 'cbbd' → 'bb'", () => {
      const result = longestPalindrome("cbbd");
      expect(result.length).toBe(2);
      expect(isPalindrome(result)).toBe(true);
      expect("cbbd".includes(result)).toBe(true);
    });

    test("전체 문자열이 회문 — 'racecar'", () => {
      expect(longestPalindrome("racecar")).toBe("racecar");
    });

    test("회문이 가운데 위치 — 'abacdfgdcaba' (앞 'aba', 뒤 'aba')", () => {
      const result = longestPalindrome("abacdfgdcaba");
      expect(result.length).toBe(3);
      expect(isPalindrome(result)).toBe(true);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("빈 문자열은 빈 문자열을 반환한다", () => {
      expect(longestPalindrome("")).toBe("");
    });

    test("길이 1 문자열은 그 자신을 반환한다", () => {
      expect(longestPalindrome("a")).toBe("a");
    });

    test("모든 문자가 다르면 길이 1의 회문이 반환된다", () => {
      const result = longestPalindrome("abcde");
      expect(result.length).toBe(1);
      expect("abcde".includes(result)).toBe(true);
    });

    test("모든 문자가 같으면 전체 문자열이 회문", () => {
      expect(longestPalindrome("aaaaa")).toBe("aaaaa");
    });

    test("짝수 길이 전체 회문 — 'abba'", () => {
      expect(longestPalindrome("abba")).toBe("abba");
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("두 문자 동일 — 'aa' → 'aa'", () => {
      expect(longestPalindrome("aa")).toBe("aa");
    });

    test("두 문자 다름 — 'ab' → 길이 1", () => {
      const result = longestPalindrome("ab");
      expect(result.length).toBe(1);
    });

    test("n = 100,000, 전체가 동일 문자 → 전체 회문", () => {
      const s = "a".repeat(100_000);
      const result = longestPalindrome(s);
      expect(result.length).toBe(100_000);
      expect(isPalindrome(result)).toBe(true);
    });
  });

  // 성능 테스트 (Manacher: O(n))
  describe("성능 테스트", () => {
    test("n=100,000, 동일 문자 입력을 100ms 이내에 처리한다", () => {
      const s = "a".repeat(100_000);
      const start = performance.now();
      const result = longestPalindrome(s);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(100_000);
      expect(elapsed).toBeLessThan(100);
    });

    test("n=100,000, 랜덤 입력을 100ms 이내에 처리한다", () => {
      const chars = "abcdefghij";
      let s = "";
      for (let i = 0; i < 100_000; i++) {
        s += chars[i % chars.length];
      }
      const start = performance.now();
      const result = longestPalindrome(s);
      const elapsed = performance.now() - start;

      expect(isPalindrome(result)).toBe(true);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
