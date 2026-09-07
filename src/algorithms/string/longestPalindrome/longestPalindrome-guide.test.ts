/**
 * L9 — 가이드가 싣는 코드가 **기존 시험의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/string/longestPalindrome/longestPalindrome.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본(`longestPalindrome-guide.ref.ts`)에
 * 다시 건다. 벽시계를 재는 케이스(`n = 100,000` 을 100ms 안에)는 옮기지 않았다 — 실행마다
 * 값이 달라 판정이 안 된다. 같은 규모를 **글자 견주기 횟수**로 재는 자리는 「최악을 만드는
 * 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { longestPalindrome } from "./longestPalindrome-guide.ref.ts";

/** 정의를 그대로 옮긴 판정. 값이 커지지 않는 입력에만 쓴다. */
function isPalindrome(s: string): boolean {
  for (let i = 0, j = s.length - 1; i < j; i++, j--) {
    if (s[i] !== s[j]) return false;
  }
  return true;
}

/** 정의를 그대로 옮긴 답. 부분 문자열을 전부 잘라 본다. */
function bruteBest(s: string): string {
  let best = "";
  for (let i = 0; i < s.length; i++) {
    for (let j = i; j < s.length; j++) {
      const w = s.slice(i, j + 1);
      if (isPalindrome(w) && w.length > best.length) best = w;
    }
  }
  return best;
}

/** 견주기 횟수까지 세는 사본. 정본과 같은 절차다. */
function comparisons(s: string): number {
  if (s.length === 0) return 0;
  const t = `#${[...s].join("#")}#`;
  const m = t.length;
  const p = new Array<number>(m).fill(0);
  let c = 0;
  let r = 0;
  let cmp = 0;
  for (let i = 0; i < m; i++) {
    let k = i < r ? Math.min(r - i, p[2 * c - i] as number) : 0;
    while (i - k - 1 >= 0 && i + k + 1 < m) {
      cmp++;
      if (t[i - k - 1] !== t[i + k + 1]) break;
      k++;
    }
    p[i] = k;
    if (i + k > r) {
      c = i;
      r = i + k;
    }
  }
  return cmp;
}

/* ────────────────────────── 기본 동작 ────────────────────────── */

const LENGTH_CASES: [string, string, number][] = [
  ["문제 예시 — 'babad' 는 길이 3 의 회문을 낸다", "babad", 3],
  ["짝수 길이 회문 — 'cbbd'", "cbbd", 2],
  ["회문이 가운데 — 'abacdfgdcaba'", "abacdfgdcaba", 3],
  ["모든 글자가 다르면 길이 1", "abcde", 1],
  ["두 글자가 다르면 길이 1", "ab", 1],
];

for (const [name, s, want] of LENGTH_CASES) {
  test(`정본 — ${name}`, () => {
    const got = longestPalindrome(s);
    expect(got.length).toBe(want);
    expect(isPalindrome(got)).toBe(true);
    expect(s.includes(got)).toBe(true);
  });
}

const EXACT_CASES: [string, string, string][] = [
  ["전체가 회문 — 'racecar'", "racecar", "racecar"],
  ["짝수 길이 전체 회문 — 'abba'", "abba", "abba"],
  ["모든 글자가 같다 — 'aaaaa'", "aaaaa", "aaaaa"],
  ["두 글자가 같다 — 'aa'", "aa", "aa"],
  ["빈 문자열", "", ""],
  ["길이 1", "a", "a"],
  ["문제 예시 — 'forgeeksskeegfor'", "forgeeksskeegfor", "geeksskeeg"],
  ["전개가 쓰는 고정 입력", "ababbaa", "abba"],
];

for (const [name, s, want] of EXACT_CASES) {
  test(`정본 — ${name}`, () => {
    expect(longestPalindrome(s)).toBe(want);
  });
}

/* ────────────────────── 정의를 옮긴 판정과의 대조 ────────────────────── */

test("두 글자 알파벳의 길이 12 문자열 전부에서 정의와 같은 길이를 낸다", () => {
  const n = 12;
  for (let mask = 0; mask < 1 << n; mask++) {
    let s = "";
    for (let b = 0; b < n; b++) s += (mask >> b) & 1 ? "b" : "a";
    const got = longestPalindrome(s);
    expect(got.length).toBe(bruteBest(s).length);
    expect(isPalindrome(got)).toBe(true);
    expect(s.includes(got)).toBe(true);
  }
});

test("세 글자 알파벳의 길이 7 문자열 전부에서 정의와 같은 길이를 낸다", () => {
  const n = 7;
  const total = 3 ** n;
  for (let code = 0; code < total; code++) {
    let s = "";
    let x = code;
    for (let d = 0; d < n; d++) {
      s += "abc"[x % 3] as string;
      x = Math.floor(x / 3);
    }
    expect(longestPalindrome(s).length).toBe(bruteBest(s).length);
  }
});

test("구분자로 쓰는 글자가 입력에 있어도 정의와 같은 길이를 낸다", () => {
  const alphabet = ["a", "#", "b"];
  for (let n = 1; n <= 8; n++) {
    const total = alphabet.length ** n;
    for (let code = 0; code < total; code++) {
      let s = "";
      let x = code;
      for (let d = 0; d < n; d++) {
        s += alphabet[x % alphabet.length] as string;
        x = Math.floor(x / alphabet.length);
      }
      expect(longestPalindrome(s).length).toBe(bruteBest(s).length);
    }
  }
});

/* ────────────────────────── 제약 규모 ────────────────────────── */

test("n = 100,000 이 전부 같은 글자면 전체가 답이다", () => {
  const n = 100_000;
  const s = "a".repeat(n);
  const got = longestPalindrome(s);
  expect(got.length).toBe(n);
  expect(got).toBe(s);
});

test("글자 견주기가 제약 규모에서도 4n − 6 을 넘지 않는다", () => {
  for (const n of [1_000, 10_000, 100_000]) {
    const worst = `a${"b".repeat(n - 2)}a`;
    expect(comparisons(worst)).toBe(4 * n - 6);
    expect(comparisons("a".repeat(n))).toBeLessThanOrEqual(4 * n - 6);
    expect(comparisons("ab".repeat(n / 2))).toBeLessThanOrEqual(4 * n - 6);
  }
});
