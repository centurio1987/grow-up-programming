/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/string/findAllOccurrences/findAllOccurrences.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를
 * 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의
 * **입출력**(n=100,000 에서의 반환값)은 아래에 시작 자리를 전부 대조하는 방식과 견주어
 * 따로 확인한다.
 */
import { expect, test } from "bun:test";
import { findAllOccurrences } from "./findAllOccurrences-guide.ref.ts";

const CASES: [string, string, number[]][] = [
  // 기본 동작
  ["hello world", "world", [6]],
  ["ababab", "ab", [0, 2, 4]],
  ["abc", "abc", [0]],
  ["aaaa", "aa", [0, 1, 2]],
  // 엣지 케이스
  ["abcdef", "xyz", []],
  ["ab", "abcd", []],
  ["hello", "", []],
  ["", "a", []],
  ["aaaaa", "aaa", [0, 1, 2]],
  ["abababab", "abab", [0, 2, 4]],
  // 바운더리
  ["a", "a", [0]],
  ["a", "b", []],
  ["abcabc", "abc", [0, 3]],
  // 문제 문서의 예시
  ["ababcababab", "abab", [0, 5, 7]],
  ["abc", "d", []],
];

for (const [text, pattern, want] of CASES) {
  test(`정본 — "${text}" 에서 "${pattern}"`, () => {
    expect(findAllOccurrences(text, pattern)).toEqual(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(findAllOccurrences("abacabababab", "abab")).toEqual([4, 6, 8]);
});

/** 시작 자리를 하나씩 다 대조하는 방식. 느리지만 정의를 그대로 옮긴 것이라 기준이 된다. */
function byEveryStart(text: string, pattern: string): number[] {
  const n = text.length;
  const m = pattern.length;
  const out: number[] = [];
  if (m === 0) return out;
  for (let i = 0; i + m <= n; i++) {
    let ok = true;
    for (let j = 0; j < m; j++) {
      if (text[i + j] !== pattern[j]) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(i);
  }
  return out;
}

test("작은 입력 전수에서 시작 자리를 다 대조하는 방식과 같은 답을 낸다", () => {
  // 알파벳 셋(a·b·c)으로 만든 길이 1~8 의 텍스트 전수 × 길이 1~3 의 패턴 전수.
  const alphabet = ["a", "b", "c"];
  const words = (length: number): string[] => {
    const out: string[] = [];
    const total = alphabet.length ** length;
    for (let code = 0; code < total; code++) {
      let rest = code;
      let word = "";
      for (let k = 0; k < length; k++) {
        word += alphabet[rest % alphabet.length];
        rest = Math.floor(rest / alphabet.length);
      }
      out.push(word);
    }
    return out;
  };
  for (let n = 1; n <= 6; n++) {
    for (const text of words(n)) {
      for (let m = 1; m <= 3; m++) {
        for (const pattern of words(m)) {
          expect(findAllOccurrences(text, pattern)).toEqual(
            byEveryStart(text, pattern),
          );
        }
      }
    }
  }
});

test("제약 최댓값에서 시작 자리를 다 대조하는 방식과 같은 답을 낸다", () => {
  const n = 100_000;
  const alphabet = "abcdefghij";
  let text = "";
  for (let i = 0; i < n; i++) text += alphabet[(i * 7919) % alphabet.length];
  const pattern = text.slice(30_000, 30_008);
  expect(findAllOccurrences(text, pattern)).toEqual(
    byEveryStart(text, pattern),
  );
});

test("제약 최댓값의 성능 케이스가 같은 값을 낸다", () => {
  // 원본 테스트의 「성능」 케이스와 같은 입력이다. 벽시계 대신 반환값만 본다.
  const n = 100_000;
  const allSame = "a".repeat(n);
  expect(findAllOccurrences(allSame, "a".repeat(100)).length).toBe(n - 100 + 1);

  const tail = `${"a".repeat(n - 1)}b`;
  expect(findAllOccurrences(tail, `${"a".repeat(999)}b`)).toEqual([n - 1000]);

  const single = `${"a".repeat(99_995)}bcdef`;
  expect(findAllOccurrences(single, "bcdef")).toEqual([99_995]);
});

test("겹치는 등장을 하나도 빠뜨리지 않는다", () => {
  // 같은 글자만 있는 텍스트에서는 시작 자리가 n − m + 1 개 전부다.
  const text = "a".repeat(20);
  for (let m = 1; m <= 20; m++) {
    const want = Array.from({ length: 20 - m + 1 }, (_, i) => i);
    expect(findAllOccurrences(text, "a".repeat(m))).toEqual(want);
  }
});
