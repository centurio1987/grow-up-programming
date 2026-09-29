/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/longestCommonSubsequence/longestCommonSubsequence.test.ts` 는
 * 학습자가 채우는 파일을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시
 * 건다. 벽시계를 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 * 그 케이스의 **입출력**(N=M=1,000 에서의 반환값)은 아래에서 그대로 확인한다.
 */
import { expect, test } from "bun:test";
import { longestCommonSubsequence } from "./longestCommonSubsequence-guide.ref.ts";

const CASES: [string, string, number][] = [
  // 기본
  ["abcde", "ace", 3],
  ["abc", "abc", 3],
  ["abc", "def", 0],
  ["AGGTAB", "GXTXAYB", 4],
  // 엣지
  ["", "abc", 0],
  ["abc", "", 0],
  ["", "", 0],
  ["a", "a", 1],
  ["a", "b", 0],
  ["abc", "aabbcc", 3],
  // 바운더리
  ["z", "z", 1],
];

for (const [s, t, want] of CASES) {
  test(`정본 — "${s}" · "${t}"`, () => {
    expect(longestCommonSubsequence(s, t)).toBe(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(longestCommonSubsequence("abcde", "ace")).toBe(3);
});

/** 순서가 반대인 두 글자는 하나만 고를 수 있다. */
test("순서가 뒤집히면 한 글자만 고른다", () => {
  expect(longestCommonSubsequence("ab", "ba")).toBe(1);
  expect(longestCommonSubsequence("cab", "abc")).toBe(2);
});

test("N=1,000 · M=1,000 동일 문자열", () => {
  const s = "a".repeat(1000);
  expect(longestCommonSubsequence(s, s)).toBe(1000);
});

test("N=1,000 · M=1,000 공통 글자 없음", () => {
  // 원본 테스트의 「성능」 케이스와 같은 입력이다. 벽시계 대신 반환값만 본다.
  expect(longestCommonSubsequence("a".repeat(1000), "b".repeat(1000))).toBe(0);
});

/** 모든 부분 수열을 만들어 대조하는 기준 구현. 정의를 그대로 옮긴 것이라 기준이 된다. */
function byEnumeration(s: string, t: string): number {
  let best = 0;
  for (let mask = 0; mask < 1 << s.length; mask++) {
    const picked: string[] = [];
    for (let k = 0; k < s.length; k++) {
      if ((mask >> k) & 1) picked.push(s[k] as string);
    }
    const w = picked.join("");
    // `w` 가 `t` 의 부분 수열인가 — 왼쪽부터 차례로 맞춰 본다.
    let at = 0;
    for (const ch of t) {
      if (at < w.length && w[at] === ch) at++;
    }
    if (at === w.length && w.length > best) best = w.length;
  }
  return best;
}

test("작은 입력 전수에서 모든 부분 수열을 만드는 방식과 같은 답을 낸다", () => {
  // 알파벳 {a,b,c} 위의 길이 0~4 문자열 쌍 전부(121 × 121 = 14,641 쌍).
  const words: string[] = [];
  for (let len = 0; len <= 4; len++) {
    for (let code = 0; code < 3 ** len; code++) {
      let w = "";
      let rest = code;
      for (let k = 0; k < len; k++) {
        w += "abc"[rest % 3] as string;
        rest = Math.floor(rest / 3);
      }
      words.push(w);
    }
  }
  for (const s of words) {
    for (const t of words) {
      expect(longestCommonSubsequence(s, t)).toBe(byEnumeration(s, t));
    }
  }
});

test("답은 두 길이의 작은 쪽을 넘지 않는다", () => {
  for (let seed = 0; seed < 200; seed++) {
    const s = Array.from(
      { length: (seed % 9) + 1 },
      (_, k) => "abcd"[((seed + 1) * (k + 3) * 7) % 4] as string,
    ).join("");
    const t = Array.from(
      { length: (seed % 7) + 1 },
      (_, k) => "abcd"[((seed + 2) * (k + 5) * 11) % 4] as string,
    ).join("");
    const got = longestCommonSubsequence(s, t);
    expect(got).toBeLessThanOrEqual(Math.min(s.length, t.length));
    expect(got).toBe(byEnumeration(s, t));
  }
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본을 실행해 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./longestCommonSubsequence-guide.sim.ts");
  const { simStepsFromRef, trace, TABLE_OPTIONS, S, T } = await import(
    "./longestCommonSubsequence-guide.fig.tsx"
  );
  const want = simStepsFromRef();
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.row12.steps)).toEqual(plain(want.row12));
  expect(plain(sim.row34.steps)).toEqual(plain(want.row34));
  expect(plain(sim.row5.steps)).toEqual(plain(want.row5));
  for (const part of [sim.row12, sim.row34, sim.row5]) {
    expect(plain(part.rowHeads)).toEqual(plain(TABLE_OPTIONS.rowHeads));
    expect(plain(part.colHeads)).toEqual(plain(TABLE_OPTIONS.colHeads));
  }
  // 패널이 내미는 값이 정본의 DP 테이블 · 답과 같은지 — 정본에 직접 다시 묻는다.
  const rows = trace(S, T).rows;
  expect(sim.row12.result).toBe(`[${rows[2]?.join(", ")}]`);
  expect(sim.row34.result).toBe(`[${rows[4]?.join(", ")}]`);
  expect(sim.row5.result).toBe(String(longestCommonSubsequence(S, T)));
});
