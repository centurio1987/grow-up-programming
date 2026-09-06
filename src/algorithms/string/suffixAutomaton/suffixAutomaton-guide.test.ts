/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/string/suffixAutomaton/suffixAutomaton.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본(`suffixAutomaton-guide.ref.ts`)에
 * 다시 건다.
 *
 * 벽시계를 재는 케이스(글자 100,000 개를 100ms 안에)는 옮기지 않았다 — 실행마다 값이 달라
 * 판정이 안 된다. 같은 규모를 **자료 접근 수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 * 대신 그 규모에서 **답이 맞는지**와 **상태 수가 상한 안에 있는지**는 여기서 본다.
 */
import { expect, test } from "bun:test";
import { SuffixAutomaton } from "./suffixAutomaton-guide.ref.ts";

/** 부분 문자열을 전부 집합에 담아 세는 방법. 작은 입력에서만 쓴다. */
function bruteDistinctSubstrings(s: string): number {
  const set = new Set<string>();
  const n = s.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j <= n; j++) {
      set.add(s.slice(i, j));
    }
  }
  return set.size;
}

/* ────────────────── countDistinctSubstrings — 기본 동작 ────────────────── */

const COUNT_CASES: [string, string, number][] = [
  ["'abc' → {a,b,c,ab,bc,abc} = 6", "abc", 6],
  ["'aaa' → {a,aa,aaa} = 3", "aaa", 3],
  ["'abab' → {a,b,ab,ba,aba,bab,abab} = 7", "abab", 7],
];

for (const [name, s, want] of COUNT_CASES) {
  test(`countDistinctSubstrings — ${name}`, () => {
    expect(new SuffixAutomaton(s).countDistinctSubstrings()).toBe(want);
  });
}

for (const s of ["banana", "mississippi"]) {
  test(`countDistinctSubstrings — '${s}' 는 집합에 담아 센 값과 같다`, () => {
    expect(new SuffixAutomaton(s).countDistinctSubstrings()).toBe(
      bruteDistinctSubstrings(s),
    );
  });
}

/* ────────────────────────── contains — 기본 동작 ────────────────────────── */

test("contains — 부분 문자열이면 true", () => {
  const sam = new SuffixAutomaton("banana");
  expect(sam.contains("ana")).toBe(true);
  expect(sam.contains("ban")).toBe(true);
  expect(sam.contains("banana")).toBe(true);
  expect(sam.contains("a")).toBe(true);
});

test("contains — 부분 문자열이 아니면 false", () => {
  const sam = new SuffixAutomaton("banana");
  expect(sam.contains("bb")).toBe(false);
  expect(sam.contains("nb")).toBe(false);
  expect(sam.contains("bananas")).toBe(false);
});

/* ────────────────────────── 엣지 케이스 ────────────────────────── */

test("길이 1 문자열 — 'a' 는 1 개", () => {
  expect(new SuffixAutomaton("a").countDistinctSubstrings()).toBe(1);
});

test("길이 1 contains — 'a' 에서 'a' 는 true, 'b' 는 false", () => {
  const sam = new SuffixAutomaton("a");
  expect(sam.contains("a")).toBe(true);
  expect(sam.contains("b")).toBe(false);
});

test("빈 문자열 검색 — 'banana' 에서 '' 는 true", () => {
  // 빈 문자열은 모든 문자열의 부분 문자열이다.
  expect(new SuffixAutomaton("banana").contains("")).toBe(true);
});

test("자기 자신보다 긴 검색어는 false", () => {
  expect(new SuffixAutomaton("abc").contains("abcd")).toBe(false);
});

test("같은 글자 되풀이 — 'aaaaa' 는 5 개", () => {
  expect(new SuffixAutomaton("aaaaa").countDistinctSubstrings()).toBe(5);
});

/* ────────────────────────── 바운더리 ────────────────────────── */

test("두 글자가 다르다 — 'ab' 는 {a,b,ab} = 3", () => {
  expect(new SuffixAutomaton("ab").countDistinctSubstrings()).toBe(3);
});

test("두 글자가 같다 — 'aa' 는 {a,aa} = 2", () => {
  expect(new SuffixAutomaton("aa").countDistinctSubstrings()).toBe(2);
});

test("길이 30 문자열은 집합에 담아 센 값과 같다", () => {
  const chars = "abc";
  let s = "";
  for (let i = 0; i < 30; i++) s += chars[i % chars.length];
  expect(new SuffixAutomaton(s).countDistinctSubstrings()).toBe(
    bruteDistinctSubstrings(s),
  );
});

/* ────────────── 전개와 문제 예시가 내미는 값 ────────────── */

test("전개 입력 'aabab' 은 11 개이고 두 질의의 답이 갈린다", () => {
  const sam = new SuffixAutomaton("aabab");
  expect(sam.countDistinctSubstrings()).toBe(11);
  expect(sam.contains("aba")).toBe(true);
  expect(sam.contains("bb")).toBe(false);
});

test("문제 예시 'abcbc' 는 12 개다", () => {
  const sam = new SuffixAutomaton("abcbc");
  expect(sam.countDistinctSubstrings()).toBe(12);
  expect(sam.contains("bcb")).toBe(true);
  expect(sam.contains("abc")).toBe(true);
  expect(sam.contains("bca")).toBe(false);
  expect(sam.contains("")).toBe(true);
});

/* ────────────── 제약 상한 — 답과 상태 수를 본다 ────────────── */

test("제약 상한 규모에서 개수가 맞고 호출 스택이 안 끝난다", () => {
  const n = 100_000;
  const chars = "abcdefghij";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[i % chars.length] as string;

  const sam = new SuffixAutomaton(s);
  // 열 글자가 되풀이되므로 길이 L 인 부분 문자열은 시작 자리의 나머지 열 가지로 갈린다.
  // L 이 n-9 를 넘으면 그 나머지 중 일부만 남아 개수가 하나씩 줄어든다.
  expect(sam.countDistinctSubstrings()).toBe(10 * (n - 9) + 45);
  expect(sam.contains(s.slice(50_000, 50_100))).toBe(true);
  expect(sam.contains("aa")).toBe(false);
});

test("같은 글자만 100,000 개여도 상태 수가 상한 안이다", () => {
  const s = "a".repeat(100_000);
  const sam = new SuffixAutomaton(s);
  expect(sam.countDistinctSubstrings()).toBe(100_000);
  expect(sam.contains("a".repeat(1000))).toBe(true);
  expect(sam.contains("b")).toBe(false);
});

test("첫 글자만 다른 100,000 글자에서도 답이 맞다", () => {
  const s = `a${"b".repeat(99_999)}`;
  const sam = new SuffixAutomaton(s);
  // b 만으로 된 부분 문자열이 길이 1~99,999 로 99,999 개이고, a 로 시작하는 것이
  // 길이 1~100,000 으로 100,000 개다. 합이 2n-1 과 같다.
  expect(sam.countDistinctSubstrings()).toBe(99_999 + 100_000);
  expect(sam.countDistinctSubstrings()).toBe(2 * 100_000 - 1);
  expect(sam.contains(s)).toBe(true);
  expect(sam.contains("ba")).toBe(false);
});
