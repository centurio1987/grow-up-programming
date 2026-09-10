/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/string/ahoCorasick/ahoCorasick.test.ts` 는 학습자가 채우는 파일을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는
 * 「성능」 케이스 둘은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스가 실제로
 * 확인하려던 것(패턴이 몇 개든 텍스트 한 번으로 끝난다)은 아래 「제약 최댓값」 셋과 「패턴을
 * 200 개로 늘려도」가 **결정론적인 입출력**으로 대신 확인한다.
 *
 * **원본의 케이스 둘을 고쳐 옮겼다.** 둘 다 실행으로 확인했다.
 *
 * 1. 원본 `ahoCorasick.test.ts:33` 이 `"ahishers"` 에서 `he` 가 자리 1 에 매칭된다고 적었는데,
 *    `"ahishers"` 의 자리 1 부터 두 글자는 `hi` 라 그런 매칭이 없다. 정의를 그대로 옮긴
 *    대조(`bruteForce`)도 매칭을 넷만 낸다. 아래 「문제의 예시」 케이스가 그 넷이고, 전수 대조
 *    케이스가 같은 판정을 작은 입력 전부에서 낸다.
 * 2. 원본 `ahoCorasick.test.ts:19` 의 텍스트 `"hello world"` 는 빈칸을 담고 있는데,
 *    `ahoCorasick-problem.md` 의 제약은 문자 집합을 소문자 영문 `a`–`z` 로 정한다. 정본은 그
 *    제약 안에서만 동작하므로 빈칸을 뺀 `"helloworld"` 로 옮겼다.
 */
import { expect, test } from "bun:test";
import { ahoCorasick, type Match } from "./ahoCorasick-guide.ref.ts";

/** 정의를 그대로 옮긴 것 — 패턴마다 모든 시작 자리에서 글자를 대조한다. 답의 기준이 된다. */
function bruteForce(text: string, patterns: string[]): Match[] {
  const out: Match[] = [];
  for (const [index, pattern] of patterns.entries()) {
    if (pattern.length === 0) continue;
    for (let j = 0; j + pattern.length <= text.length; j++) {
      if (text.slice(j, j + pattern.length) === pattern) {
        out.push({ patternIndex: index, position: j });
      }
    }
  }
  out.sort(
    (a, b) => a.position - b.position || a.patternIndex - b.patternIndex,
  );
  return out;
}

test("단일 패턴 단일 매칭", () => {
  expect(ahoCorasick("helloworld", ["world"])).toEqual([
    { patternIndex: 0, position: 5 },
  ]);
});

test("문제의 예시 — 여러 패턴 동시 매칭", () => {
  // "ahishers" = a h i s h e r s
  //   his  at 1 · she at 3 · he at 4 · hers at 4
  const result = ahoCorasick("ahishers", ["he", "she", "his", "hers"]);
  expect(result).toEqual([
    { patternIndex: 2, position: 1 },
    { patternIndex: 1, position: 3 },
    { patternIndex: 0, position: 4 },
    { patternIndex: 3, position: 4 },
  ]);
  expect(result).toEqual(bruteForce("ahishers", ["he", "she", "his", "hers"]));
});

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 텍스트와 이 패턴 셋을 쓴다.
  expect(ahoCorasick("ushers", ["he", "she", "hers"])).toEqual([
    { patternIndex: 1, position: 1 },
    { patternIndex: 0, position: 2 },
    { patternIndex: 2, position: 2 },
  ]);
});

test("패턴이 텍스트와 동일", () => {
  expect(ahoCorasick("abc", ["abc"])).toEqual([
    { patternIndex: 0, position: 0 },
  ]);
});

test("겹치는 매칭을 모두 찾는다", () => {
  expect(ahoCorasick("aaaa", ["aa"])).toEqual([
    { patternIndex: 0, position: 0 },
    { patternIndex: 0, position: 1 },
    { patternIndex: 0, position: 2 },
  ]);
});

test("어떤 패턴도 매칭되지 않으면 빈 배열을 돌려준다", () => {
  expect(ahoCorasick("abcdef", ["xyz", "qrs"])).toEqual([]);
});

test("한 패턴이 다른 패턴의 접미사인 경우", () => {
  expect(ahoCorasick("abc", ["abc", "bc"])).toEqual([
    { patternIndex: 0, position: 0 },
    { patternIndex: 1, position: 1 },
  ]);
});

test("같은 패턴이 여러 번 등장", () => {
  expect(ahoCorasick("abcabcabc", ["abc"])).toEqual([
    { patternIndex: 0, position: 0 },
    { patternIndex: 0, position: 3 },
    { patternIndex: 0, position: 6 },
  ]);
});

test("패턴이 텍스트보다 긴 경우", () => {
  expect(ahoCorasick("ab", ["abcdef"])).toEqual([]);
});

test("길이 1 의 패턴, 길이 1 의 텍스트", () => {
  expect(ahoCorasick("a", ["a"])).toEqual([{ patternIndex: 0, position: 0 }]);
});

test("패턴 하나", () => {
  expect(ahoCorasick("xxaxxbxxa", ["a"])).toEqual([
    { patternIndex: 0, position: 2 },
    { patternIndex: 0, position: 8 },
  ]);
});

test("같은 패턴을 두 벌 담으면 같은 자리가 두 번 나온다", () => {
  expect(ahoCorasick("ab", ["ab", "ab"])).toEqual([
    { patternIndex: 0, position: 0 },
    { patternIndex: 1, position: 0 },
  ]);
});

test("한 자리에서 패턴 셋이 함께 끝난다", () => {
  expect(ahoCorasick("aaa", ["a", "aa", "aaa"])).toEqual([
    { patternIndex: 0, position: 0 },
    { patternIndex: 1, position: 0 },
    { patternIndex: 2, position: 0 },
    { patternIndex: 0, position: 1 },
    { patternIndex: 1, position: 1 },
    { patternIndex: 0, position: 2 },
  ]);
});

test("작은 입력 전수에서 정의 그대로의 대조와 같은 답을 낸다", () => {
  const letters = "abc";
  const all: string[] = [];
  for (const a of letters) {
    all.push(a);
    for (const b of letters) {
      all.push(a + b);
      for (const c of letters) all.push(a + b + c);
    }
  }
  // 텍스트 39 벌 × 패턴 집합 64 벌.
  for (const text of all) {
    for (let mask = 1; mask < 64; mask++) {
      const patterns = all.filter((_, k) => ((mask >> (k % 6)) & 1) === 1);
      expect(ahoCorasick(text, patterns)).toEqual(bruteForce(text, patterns));
    }
  }
});

test("제약 최댓값 — 텍스트 100,000 글자에서 패턴 하나를 찾는다", () => {
  const text = `${"a".repeat(99_995)}bcdef`;
  expect(ahoCorasick(text, ["bcdef"])).toEqual([
    { patternIndex: 0, position: 99_995 },
  ]);
});

test("제약 최댓값 — 텍스트 100,000 글자에서 길이 1 짜리 패턴이 모든 자리에 맞는다", () => {
  const n = 100_000;
  expect(ahoCorasick("a".repeat(n), ["a"])).toHaveLength(n);
});

test("제약 최댓값 — 짧은 패턴 여섯을 한 번에 찾는다", () => {
  const n = 100_000;
  const text = "abcdef".repeat(Math.floor(n / 6));
  const patterns = ["abc", "bcd", "cde", "def", "efa", "fab"];
  const result = ahoCorasick(text, patterns);
  expect(result.length).toBeGreaterThan(0);
  // 자리 순서가 오름차순인지 확인한다 — 반환 규약의 절반이다.
  for (let i = 1; i < result.length; i++) {
    const before = result[i - 1] as Match;
    const here = result[i] as Match;
    expect(
      before.position < here.position ||
        (before.position === here.position &&
          before.patternIndex < here.patternIndex),
    ).toBe(true);
  }
});

test("제약 최댓값 — 패턴 길이의 합 100,000 을 담는다", () => {
  // 소문자 세 글자로 적은 i. 제약이 정한 문자 집합 안에서 1,000 개를 서로 다르게 만든다.
  const base26 = (i: number): string => {
    const a = "abcdefghijklmnopqrstuvwxyz";
    return `${a[Math.floor(i / 676) % 26]}${a[Math.floor(i / 26) % 26]}${a[i % 26]}`;
  };
  // 길이 100 짜리 패턴 1,000 개. 길이 합이 정확히 100,000 이다.
  const patterns = Array.from(
    { length: 1000 },
    (_, i) => `p${"q".repeat(93)}${base26(i)}zzz`,
  );
  const text = `xx${patterns[7] as string}yy${patterns[999] as string}`;
  expect(ahoCorasick(text, patterns)).toEqual([
    { patternIndex: 7, position: 2 },
    { patternIndex: 999, position: 104 },
  ]);
});

test("패턴을 200 개로 늘려도 답이 정의 그대로의 대조와 같다", () => {
  const text = "abcabcabcabc";
  const patterns = Array.from({ length: 200 }, (_, i) =>
    "abcab".slice(0, (i % 5) + 1),
  );
  expect(ahoCorasick(text, patterns)).toEqual(bruteForce(text, patterns));
});
