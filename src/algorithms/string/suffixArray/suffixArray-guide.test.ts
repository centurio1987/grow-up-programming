/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/string/suffixArray/suffixArray.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는 「성능」 케이스는
 * 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의 **입출력**(n=100,000 에서의
 * 반환값)은 아래에서 따로 확인한다.
 */
import { expect, test } from "bun:test";
import { suffixArray } from "./suffixArray-guide.ref.ts";

/** 접미사를 문자열로 잘라 직접 견주는 정렬. 정의를 그대로 옮긴 것이라 기준이 된다. */
function bySlicing(s: string): number[] {
  const n = s.length;
  const idx = Array.from({ length: n }, (_, i) => i);
  idx.sort((a, b) => {
    const x = s.slice(a);
    const y = s.slice(b);
    return x < y ? -1 : x > y ? 1 : 0;
  });
  return idx;
}

const CASES: [string, number[]][] = [
  // 기본 동작 — 문제 문서의 예시
  ["banana", [5, 3, 1, 0, 4, 2]],
  ["abc", [0, 1, 2]],
  ["aaaa", [3, 2, 1, 0]],
  ["a", [0]],
  ["cba", [2, 1, 0]],
  // 엣지 케이스
  ["aa", [1, 0]],
  ["ab", [0, 1]],
  ["ba", [1, 0]],
  // 본문이 쓰는 그 밖의 입력
  ["abab", [2, 0, 3, 1]],
  ["aab", [0, 1, 2]],
];

for (const [s, want] of CASES) {
  test(`정본 — "${s}"`, () => {
    expect(suffixArray(s)).toEqual(want);
  });
}

test("문제 문서의 mississippi 가 직접 견주기와 같다", () => {
  const s = "mississippi";
  expect(suffixArray(s)).toEqual(bySlicing(s));
});

test("반복 패턴 — 직접 견주기와 같다", () => {
  for (const s of ["abab", "abcabcabc", "aabaabaab", "abacaba"]) {
    expect(suffixArray(s)).toEqual(bySlicing(s));
  }
});

test("길이 50 의 되풀이 문자열이 직접 견주기와 같다", () => {
  // 원본 테스트의 「바운더리」 케이스와 같은 생성식이다.
  const chars = "abcde";
  let s = "";
  for (let i = 0; i < 50; i++) s += chars[i % chars.length];
  expect(suffixArray(s)).toEqual(bySlicing(s));
});

test("작은 입력 전수에서 직접 견주기와 같은 답을 낸다", () => {
  // 알파벳 셋(a·b·c)으로 만든 길이 1~8 의 문자열 전수 — 9,840 벌이다.
  const alphabet = ["a", "b", "c"];
  const words = (length: number): string[] => {
    if (length === 0) return [""];
    const out: string[] = [];
    for (const head of words(length - 1)) {
      for (const c of alphabet) out.push(head + c);
    }
    return out;
  };
  let checked = 0;
  for (let n = 1; n <= 8; n++) {
    for (const s of words(n)) {
      expect(suffixArray(s)).toEqual(bySlicing(s));
      checked++;
    }
  }
  expect(checked).toBe(9840);
});

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(suffixArray("banana")).toEqual([5, 3, 1, 0, 4, 2]);
});

test("제약 최댓값의 성능 케이스가 같은 값을 낸다", () => {
  // 원본 테스트의 「성능」 케이스와 같은 입력이다. 벽시계 대신 반환값만 본다.
  const n = 100_000;

  const allSame = "a".repeat(n);
  const same = suffixArray(allSame);
  expect(same.length).toBe(n);
  // 같은 글자만 있으면 짧은 접미사가 언제나 앞이다 — 자리 번호의 역순이다.
  expect(same).toEqual(Array.from({ length: n }, (_, k) => n - 1 - k));

  const repeated = "abcde".repeat(20_000);
  const rep = suffixArray(repeated);
  expect(rep.length).toBe(n);
  // 되풀이 문자열에서는 시작 글자가 `a` 인 자리가 앞쪽 20,000 개를 채운다.
  expect(rep.slice(0, 20_000).every((i) => repeated[i] === "a")).toBe(true);
  // 첫 자리는 가장 짧은 `a` 로 시작하는 접미사다.
  expect(rep[0]).toBe(99_995);
});

test("제약 최댓값에서 답이 순열이고 사전순으로 늘어서 있다", () => {
  const n = 100_000;
  let x = 0x9e3779b9;
  const chars: string[] = [];
  for (let i = 0; i < n; i++) {
    x = (x + 0x6d2b79f5) | 0;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    chars.push(String.fromCharCode(97 + (((t ^ (t >>> 14)) >>> 0) % 26)));
  }
  const s = chars.join("");
  const sa = suffixArray(s);

  // ① 답은 0..n-1 의 순열이다.
  const seen = new Uint8Array(n);
  for (const i of sa) seen[i] = 1;
  expect(sa.length).toBe(n);
  expect(seen.every((v) => v === 1)).toBe(true);

  // ② 이웃한 두 접미사가 사전순으로 늘어서 있다. 공통 접두사를 지나 처음 갈리는 글자로 본다.
  for (let k = 0; k + 1 < n; k++) {
    const a = sa[k] as number;
    const b = sa[k + 1] as number;
    let d = 0;
    while (a + d < n && b + d < n && s[a + d] === s[b + d]) d++;
    const ordered =
      a + d >= n
        ? true
        : b + d >= n
          ? false
          : (s[a + d] as string) < (s[b + d] as string);
    expect(ordered).toBe(true);
  }
});
