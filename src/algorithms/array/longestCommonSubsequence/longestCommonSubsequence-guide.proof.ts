/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts longestCommonSubsequence-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { longestCommonSubsequence } from "./longestCommonSubsequence-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 *
 * **원문자(①)와 모호폭 기호는 마지막 열에만 쓴다.** 마지막 열은 오른쪽 여백을 잘라내므로
 * 폭 계산이 자리를 안 바꾼다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** 자릿수. 제약 규모의 값이 화면에 안 들어갈 때 쓴다. */
const digits = (n: bigint): number => n.toString().length;

/** 이항계수. 기억 없는 재귀의 호출 수를 닫힌 형태로 낼 때 쓴다. */
function binom(a: number, b: number): bigint {
  let out = 1n;
  for (let k = 0; k < b; k++) {
    out = (out * BigInt(a - k)) / BigInt(k + 1);
  }
  return out;
}

/**
 * 열 폭을 값에서 계산해 표를 그린다. 폭을 리터럴로 박으면 값이 바뀌어도 표가 그대로라
 * 어긋난 자리를 아무도 못 본다.
 */
function table(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const cols = head.length;
  const w = Array.from({ length: cols }, (_, c) =>
    Math.max(width(head[c] ?? ""), ...rows.map((r) => width(r[c] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((cell, c) =>
        align[c] === "r" ? padLeft(cell, w[c] ?? 0) : padRight(cell, w[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 *
 * 마지막 글자가 같은 칸(③)과 다른 칸(④)이 둘 다 여러 번 나오고, `t` 에 아예 없는 글자
 * (`b`·`d`)가 있어 **줄 전체가 윗줄을 그대로 이어받는 경우**까지 실행된다. 답 3 이 오른쪽
 * 아래 칸에서 만들어지는 것도 이 입력에서 확인된다.
 */
const S = "abcde";
const T = "ace";

/** 제약의 최댓값. 두 문자열 다 이 길이까지 온다. */
const LIMIT = 1000;

/** 최악의 모양을 고르는 자리에서 쓰는 규모. */
const SHAPE_N = 1000;

/* ────────────────────────── 계측기 ────────────────────────── */

interface Counted {
  answer: number;
  /** 문자 비교 횟수. 칸 하나마다 한 번이다. */
  chars: number;
  /** 값을 정하는 연산(덧셈 또는 값 비교) 횟수. 칸 하나마다 한 번이다. */
  picks: number;
}

/** 정본과 같은 절차에 계수만 덧붙인 것. */
function byTable(s: string, t: string): Counted {
  const n = s.length;
  const m = t.length;
  let chars = 0;
  let picks = 0;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 1; i <= n; i++) {
    const prev = dp[i - 1] as number[];
    const cur = dp[i] as number[];
    for (let j = 1; j <= m; j++) {
      chars++;
      if (s[i - 1] === t[j - 1]) {
        picks++;
        cur[j] = (prev[j - 1] as number) + 1;
      } else {
        picks++;
        cur[j] = Math.max(prev[j] as number, cur[j - 1] as number);
      }
    }
  }
  return { answer: (dp[n] as number[])[m] as number, chars, picks };
}

/** 정본이 채우는 표 전체. 전개와 불변식이 이 표를 인용한다. */
function fullTable(s: string, t: string): number[][] {
  const n = s.length;
  const m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 1; i <= n; i++) {
    const prev = dp[i - 1] as number[];
    const cur = dp[i] as number[];
    for (let j = 1; j <= m; j++) {
      cur[j] =
        s[i - 1] === t[j - 1]
          ? (prev[j - 1] as number) + 1
          : Math.max(prev[j] as number, cur[j - 1] as number);
    }
  }
  return dp;
}

/**
 * 가장 단순한 방법 — **`s` 의 부분 수열을 전부 만들어 `t` 의 부분 수열인지 확인한다.**
 * 정의를 그대로 옮긴 것이라 답의 기준이 되고, 만든 후보 수와 읽은 글자 수를 함께 센다.
 */
function byEnumeration(
  s: string,
  t: string,
): { answer: number; made: number; reads: number } {
  let best = 0;
  let made = 0;
  let reads = 0;
  for (let mask = 0; mask < 1 << s.length; mask++) {
    made++;
    const picked: string[] = [];
    for (let k = 0; k < s.length; k++) {
      if ((mask >> k) & 1) picked.push(s[k] as string);
    }
    const w = picked.join("");
    let at = 0;
    for (const ch of t) {
      reads++;
      if (at < w.length && w[at] === ch) at++;
    }
    if (at === w.length && w.length > best) best = w.length;
  }
  return { answer: best, made, reads };
}

/** 기억 없이 그대로 부르는 재귀. 호출 횟수를 센다. */
function byPlainRecursion(
  s: string,
  t: string,
): { answer: number; calls: number } {
  let calls = 0;
  const f = (i: number, j: number): number => {
    calls++;
    if (i === 0 || j === 0) return 0;
    if (s[i - 1] === t[j - 1]) return f(i - 1, j - 1) + 1;
    return Math.max(f(i - 1, j), f(i, j - 1));
  };
  const answer = f(s.length, t.length);
  return { answer, calls };
}

/** 후보 — **글자 개수만 세어 겹치는 만큼 더한다.** 순서를 아예 안 본다. */
function byFrequency(s: string, t: string): number {
  const count = (x: string): Map<string, number> => {
    const out = new Map<string, number>();
    for (const ch of x) out.set(ch, (out.get(ch) ?? 0) + 1);
    return out;
  };
  const a = count(s);
  const b = count(t);
  let sum = 0;
  for (const [ch, k] of a) sum += Math.min(k, b.get(ch) ?? 0);
  return sum;
}

/** 후보 — **왼쪽부터 붙일 수 있는 대로 붙인다.** 한 번 붙이면 되돌아가지 않는다. */
function byGreedyLeft(s: string, t: string): number {
  let at = 0;
  let taken = 0;
  for (const ch of s) {
    const found = t.indexOf(ch, at);
    if (found < 0) continue;
    taken++;
    at = found + 1;
  }
  return taken;
}

/** 연속 부분 문자열의 최장 공통 길이. 불일치 칸에 0 을 적으면 이 값이 나온다. */
function bySubstring(s: string, t: string): { answer: number; last: number } {
  const n = s.length;
  const m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  let best = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cur = dp[i] as number[];
      cur[j] =
        s[i - 1] === t[j - 1]
          ? ((dp[i - 1] as number[])[j - 1] as number) + 1
          : 0;
      best = Math.max(best, cur[j] as number);
    }
  }
  return { answer: best, last: (dp[n] as number[])[m] as number };
}

/**
 * 표를 줄 하나로 줄이면서 **대각선 대신 방금 덮어쓴 왼쪽 칸을 쓴 사본.** 두 줄이 함께
 * 바뀌는 구조 변경이라 `loadMutant`(한 줄 치환)로는 만들 수 없어 여기 따로 적는다.
 */
function byRollingWrong(
  s: string,
  t: string,
): { answer: number; row: number[] } {
  const m = t.length;
  const dp = new Array<number>(m + 1).fill(0);
  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= m; j++) {
      dp[j] =
        s[i - 1] === t[j - 1]
          ? (dp[j - 1] as number) + 1
          : Math.max(dp[j] as number, dp[j - 1] as number);
    }
  }
  return { answer: dp[m] as number, row: [...dp] };
}

/** 같은 줄 하나를 쓰되 **덮어쓰기 직전 값을 따로 챙긴** 사본. 답이 정본과 같아야 한다. */
function byRollingRight(s: string, t: string): number {
  const m = t.length;
  const dp = new Array<number>(m + 1).fill(0);
  for (let i = 1; i <= s.length; i++) {
    let diag = 0;
    for (let j = 1; j <= m; j++) {
      const keep = dp[j] as number;
      dp[j] =
        s[i - 1] === t[j - 1]
          ? diag + 1
          : Math.max(dp[j] as number, dp[j - 1] as number);
      diag = keep;
    }
  }
  return dp[m] as number;
}

/** 공통 부분 수열 전부를 사전순으로. `deep.math` 의 검산이 쓴다. */
function commonSubsequences(s: string, t: string): string[] {
  const out = new Set<string>();
  for (let mask = 0; mask < 1 << s.length; mask++) {
    let w = "";
    for (let k = 0; k < s.length; k++) {
      if ((mask >> k) & 1) w += s[k] as string;
    }
    let at = 0;
    for (const ch of t) if (at < w.length && w[at] === ch) at++;
    if (at === w.length) out.add(w);
  }
  return [...out].sort((a, b) => a.length - b.length || (a < b ? -1 : 1));
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  longestCommonSubsequence(s: string, t: string): number;
}

const REF = new URL("./longestCommonSubsequence-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * 마지막 글자가 **다를 때 대각선 칸을 그대로 쓰는** 사본. 불변식을 지키던 바로 그 줄이다.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const diagonalOnMismatch = await loadMutant<Impl>(REF, {
  swap: [
    /cur\[j\] = Math\.max\(prev\[j\] as number, cur\[j - 1\] as number\);/,
    "cur[j] = prev[j - 1] as number;",
  ],
});

/** 마지막 글자가 같을 때도 **후보 셋 중 최댓값**을 고르는 사본. */
const maxOfThree = await loadMutant<Impl>(REF, {
  swap: [
    /cur\[j\] = \(prev\[j - 1\] as number\) \+ 1;/,
    "cur[j] = Math.max((prev[j - 1] as number) + 1, prev[j] as number, cur[j - 1] as number);",
  ],
});

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  name: string;
  s: string;
  t: string;
}

/**
 * 사례 이름. **모호폭 기호를 쓰지 않는다** — 표의 첫 열이라 한 글자만 어긋나도 뒤 열이
 * 통째로 밀린다. 한글은 `width` 가 두 칸으로 세므로 안전하다.
 */
const NAMED = (s: string, t: string): Case => ({
  name: `"${s}" 와 "${t}"`,
  s,
  t,
});

const WALK_CASE: Case = { name: `전개 입력 "${S}" 와 "${T}"`, s: S, t: T };

/** 순서를 안 보는 후보가 갈리는 자리를 담은 목록. */
const ORDER_CASES: Case[] = [
  WALK_CASE,
  NAMED("ab", "ba"),
  NAMED("cab", "abc"),
  NAMED("abc", "cba"),
];

/** 상태를 무엇으로 잡는지가 갈리는 자리를 담은 목록. */
const STATE_CASES: Case[] = [
  WALK_CASE,
  NAMED("ab", "ba"),
  NAMED("aba", "ba"),
  NAMED("cab", "abc"),
  NAMED("abc", "cba"),
];

/** 연속 조건이 답을 가르는 자리를 담은 목록. */
const SUBSTRING_CASES: Case[] = [
  WALK_CASE,
  NAMED("abc", "abc"),
  NAMED("AGGTAB", "GXTXAYB"),
  NAMED("abc", "aabbcc"),
];

/** 일치 칸에서 후보 셋을 다 보는 사본이 갈리는지 보는 목록. */
const MAX_THREE_CASES: Case[] = [
  WALK_CASE,
  NAMED("ab", "ba"),
  NAMED("AGGTAB", "GXTXAYB"),
  NAMED("abc", "aabbcc"),
  NAMED("aaa", "aaa"),
];

/** 줄 하나로 줄인 사본이 갈리는 자리를 담은 목록. */
const ROLLING_CASES: Case[] = [
  WALK_CASE,
  NAMED("bab", "aaaa"),
  NAMED("abc", "abc"),
  NAMED("ab", "ba"),
  NAMED("aab", "aaab"),
];

/** 불일치에서 대각선을 쓰는 변이가 갈리는 자리를 담은 목록. */
const MISMATCH_CASES: Case[] = [
  WALK_CASE,
  NAMED("abc", "abc"),
  NAMED("AGGTAB", "GXTXAYB"),
  NAMED("abc", "aabbcc"),
  NAMED("ab", "ba"),
];

/** 검산 규모. 두 방식을 **실제로 실행해** 센다. */
const SCALE = [1, 2, 3, 4, 5, 6];

/** 답이 갈리는 자리가 하나라도 있어야 「깨진다」가 참이다. */
function assertBreaks(gaps: number[]): void {
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 어느 입력에서도 답이 안 바뀐 것을 확인한다. 하나라도 바뀌면 「같다」가 거짓이다. */
function assertNeverBreaks(gaps: number[]): void {
  if (gaps.some((g) => g !== 0)) {
    throw new Error(
      "답이 갈리는 입력이 있다 — 「한 번도 안 갈린다」가 거짓이다",
    );
  }
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 계측이 다른 절차를 잰 것이다. */
function assertSame(s: string, t: string, got: number): number {
  const want = longestCommonSubsequence(s, t);
  if (got !== want) {
    throw new Error(`계측기와 정본의 답이 다르다 — 계측 ${got} ≠ 정본 ${want}`);
  }
  return got;
}

/** 두 방식을 나란히 실행해 사례 표를 만든다. */
function contrast(
  cases: Case[],
  other: (s: string, t: string) => number,
): { rows: string[][]; gaps: number[] } {
  const rows: string[][] = [];
  const gaps: number[] = [];
  for (const c of cases) {
    const bare = longestCommonSubsequence(c.s, c.t);
    const got = other(c.s, c.t);
    gaps.push(bare === got ? 0 : 1);
    rows.push([
      c.name,
      String(bare),
      String(got),
      bare === got ? "같다" : "틀리다",
    ]);
  }
  return { rows, gaps };
}

const CONTRAST_HEAD = (otherHead: string): string[] => [
  "입력",
  "정본이 낸 답",
  otherHead,
  "판정",
];

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 부분 수열을 전부 만드는 방법이 몇 번의 일이 되는가. */
  costEnumerate: () => {
    const rows = [3, 4, 5].map((len) => {
      const s = S.slice(0, len);
      const e = byEnumeration(s, T);
      assertSame(s, T, e.answer);
      return [
        `"${s}"`,
        `"${T}"`,
        num(e.made),
        num(e.reads),
        num(e.made + e.reads),
      ];
    });
    const big = 2n ** BigInt(LIMIT);
    return [
      table(
        ["s", "t", "만든 후보 수", "읽은 t 의 글자 수", "기본 연산 합"],
        rows,
        ["l", "l", "r", "r", "r"],
      ),
      "",
      `제약 규모 |s| = |t| = ${num(LIMIT)} 이면`,
      table(
        ["  만든 후보 수", `${num(digits(big))} 자리`],
        [["  기본 연산 합", `${num(digits(big * BigInt(LIMIT + 1)))} 자리`]],
        ["l", "r"],
      ),
      `  └ 후보 하나마다 t 를 한 번씩 읽으므로 기본 연산은 후보 수에 ${num(LIMIT + 1)} 을 곱한 값이다`,
      "  └ 후보 수가 s 의 길이를 지수로 올린다. 1 초 안에 다 만들어 볼 수 없다",
    ].join("\n");
  },

  /**
   * `deep.build` ④ — 비용이 무엇에 달렸는지를 두 경우로 잰다.
   *
   * **길이는 같고 글자만 다른 두 입력**을 나란히 둔다. 기억 없이 부르는 쪽은 글자가 겹치는
   * 정도에 따라 뛰고, 표에 적어 두는 쪽은 두 길이의 곱으로 고정이다.
   */
  costTwoWays: () => {
    const pairs: [string, string][] = [
      [S, T],
      [S, "vwx"],
      ["abcdefghij", "klmnopqrst"],
    ];
    const rows = pairs.map(([s, t]) => {
      const plain = byPlainRecursion(s, t);
      const tab = byTable(s, t);
      assertSame(s, t, plain.answer);
      assertSame(s, t, tab.answer);
      return [
        `"${s}" 와 "${t}"`,
        `${s.length} x ${t.length}`,
        num(plain.calls),
        num(s.length * t.length),
      ];
    });
    const near = byPlainRecursion(S, T).calls;
    const far = byPlainRecursion(S, "vwx").calls;
    return [
      table(
        ["입력", "두 길이", "기억 없이 부른 횟수", "표에서 채운 칸"],
        rows,
        ["l", "l", "r", "r"],
      ),
      "",
      `└ 첫 두 줄은 길이가 같고 글자만 다른데 왼쪽 열이 ${(far / near).toFixed(1)} 배로 갈린다`,
      "└ 오른쪽 열은 글자를 안 보고 두 길이의 곱으로 정해진다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 순서를 안 보는 후보가 어디서 어긋나는가. */
  costFrequency: () => {
    const { rows, gaps } = contrast(ORDER_CASES, byFrequency);
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("겹치는 글자 개수"), rows, ["l", "r", "r", "l"]),
      "",
      "└ 양쪽에 다 있는 글자라도 나오는 순서가 반대면 함께 고를 수 없다. 그 자리에서 값이 커진다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 상태를 무엇으로 잡는지를 네 가지로 두고 답을 대조한다. */
  stateChoice: () => {
    const heads = [
      "글자 개수만",
      "왼쪽부터 붙이기",
      "접두어 쌍 (i, j)",
      "고른 글자 목록까지",
    ];
    const impls: ((s: string, t: string) => number)[] = [
      byFrequency,
      byGreedyLeft,
      longestCommonSubsequence,
      (s, t) => byEnumeration(s, t).answer,
    ];
    const wrong = [0, 0, 0, 0];
    const rows = STATE_CASES.map((c) => {
      const bare = longestCommonSubsequence(c.s, c.t);
      const cells = impls.map((f, k) => {
        const got = f(c.s, c.t);
        if (got !== bare) wrong[k] = (wrong[k] as number) + 1;
        return String(got);
      });
      return [c.name, String(bare), ...cells];
    });
    rows.push(["어긋난 입력 수", "", ...wrong.map(String)]);
    rows.push([
      `|s| = |t| = ${num(LIMIT)} 에서 쓰는 칸`,
      "",
      "256",
      "2",
      num((LIMIT + 1) * (LIMIT + 1)),
      `${num(digits(2n ** BigInt(LIMIT)))} 자리`,
    ]);
    return [
      table(["입력", "정답", ...heads], rows, ["l", "r", "r", "r", "r", "r"]),
      "",
      "└ 어긋나지 않는 것 중 칸이 가장 적은 상태가 넷째 열이다. 다섯째 열은 답은 맞지만 칸이 지수로 늘어난다",
    ].join("\n");
  },

  /** `deep.walk.step` — 고정 입력의 표를 끝까지 채운 결과와 칸마다의 갈래. */
  walkTrace: () => {
    const dp = fullTable(S, T);
    const rows: string[][] = [];
    for (let i = 0; i <= S.length; i++) {
      const marks: string[] = [];
      for (let j = 1; j <= T.length; j++) {
        marks.push(i === 0 ? "-" : S[i - 1] === T[j - 1] ? "③" : "④");
      }
      rows.push([
        `T${i + 1}`,
        `i=${i}`,
        i === 0 ? "-" : (S[i - 1] as string),
        ...(dp[i] as number[]).map(String),
        marks.join(""),
      ]);
    }
    const answer = (dp[S.length] as number[])[T.length] as number;
    assertSame(S, T, answer);
    return [
      table(
        [
          "걸음",
          "줄",
          "s 의 글자",
          "j=0",
          `j=1 ${T[0]}`,
          `j=2 ${T[1]}`,
          `j=3 ${T[2]}`,
          "갈래",
        ],
        rows,
        ["l", "l", "l", "r", "r", "r", "r", "l"],
      ),
      "",
      `└ 오른쪽 아래 칸이 답 ${answer} 이다. ③ 이 세 번 나오고 그때마다 값이 1 씩 커진다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 불일치 칸에 0 을 적으면 어느 문제를 푸는가. */
  pauseSubstring: () => {
    const rows: string[][] = [];
    const gaps: number[] = [];
    for (const c of SUBSTRING_CASES) {
      const bare = longestCommonSubsequence(c.s, c.t);
      const sub = bySubstring(c.s, c.t);
      gaps.push(bare === sub.answer ? 0 : 1);
      rows.push([
        c.name,
        String(bare),
        String(sub.last),
        String(sub.answer),
        bare === sub.answer ? "같다" : "틀리다",
      ]);
    }
    assertBreaks(gaps);
    return [
      table(
        [
          "입력",
          "정본이 낸 답",
          "0 을 적은 표의 오른쪽 아래",
          "그 표의 최댓값",
          "판정",
        ],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      "└ 불일치에 0 을 적으면 고른 자리가 연속이어야 하는 다른 문제가 된다. 답도 오른쪽 아래가 아니라 표 전체의 최댓값이다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 일치 칸에서도 후보 셋을 다 보면 무엇이 달라지는가. */
  pauseMaxThree: () => {
    const { rows, gaps } = contrast(MAX_THREE_CASES, (s, t) =>
      maxOfThree.longestCommonSubsequence(s, t),
    );
    assertNeverBreaks(gaps);
    const dp = fullTable(S, T);
    const extra: string[][] = [];
    for (let i = 1; i <= S.length; i++) {
      for (let j = 1; j <= T.length; j++) {
        if (S[i - 1] !== T[j - 1]) continue;
        extra.push([
          `(${i}, ${j})`,
          String((dp[i - 1] as number[])[j - 1] as number),
          String(((dp[i - 1] as number[])[j - 1] as number) + 1),
          String((dp[i - 1] as number[])[j] as number),
          String((dp[i] as number[])[j - 1] as number),
        ]);
      }
    }
    return [
      table(CONTRAST_HEAD("후보 셋을 다 본 답"), rows, ["l", "r", "r", "l"]),
      "",
      "전개 입력에서 마지막 글자가 같은 칸 셋의 세 후보",
      table(["칸", "대각선", "대각선 + 1", "윗칸", "왼쪽 칸"], extra, [
        "l",
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 셋 다 대각선 + 1 이 나머지 둘보다 작지 않다. 그래서 답이 안 갈리고, 비교만 두 번씩 늘어난다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 줄 하나로 줄이면서 왼쪽 칸을 대각선으로 쓰면 무엇이 달라지는가. */
  pauseRolling: () => {
    const rows: string[][] = [];
    const gaps: number[] = [];
    for (const c of ROLLING_CASES) {
      const bare = longestCommonSubsequence(c.s, c.t);
      const wrong = byRollingWrong(c.s, c.t).answer;
      const right = byRollingRight(c.s, c.t);
      assertSame(c.s, c.t, right);
      gaps.push(bare === wrong ? 0 : 1);
      rows.push([
        c.name,
        String(bare),
        String(wrong),
        String(right),
        bare === wrong ? "같다" : "틀리다",
      ]);
    }
    assertBreaks(gaps);
    const bad = byRollingWrong("bab", "aaaa");
    return [
      table(
        [
          "입력",
          "정본이 낸 답",
          "왼쪽 칸을 대각선으로 쓴 답",
          "직전 값을 챙긴 답",
          "판정",
        ],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      `└ "bab" 와 "aaaa" 에서 줄이 [${bad.row.join(" ")}] 로 끝난다. 같은 글자 하나를 네 번 쓴 값이다`,
    ].join("\n");
  },

  /** `invariant` ③ — 마지막 글자가 다를 때 대각선을 쓰면 무엇이 나오는가. */
  mutantDiagonalOnMismatch: () => {
    const { rows, gaps } = contrast(MISMATCH_CASES, (s, t) =>
      diagonalOnMismatch.longestCommonSubsequence(s, t),
    );
    assertBreaks(gaps);
    const right = (fullTable(S, T)[S.length] as number[]).join(" ");
    const wrongDp: number[][] = Array.from({ length: S.length + 1 }, () =>
      new Array<number>(T.length + 1).fill(0),
    );
    for (let i = 1; i <= S.length; i++) {
      for (let j = 1; j <= T.length; j++) {
        const prev = wrongDp[i - 1] as number[];
        (wrongDp[i] as number[])[j] =
          S[i - 1] === T[j - 1]
            ? (prev[j - 1] as number) + 1
            : (prev[j - 1] as number);
      }
    }
    return [
      table(CONTRAST_HEAD("불일치에도 대각선을 쓴 답"), rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `전개 입력에서 마지막 줄이 [${right}] 에서 [${(wrongDp[S.length] as number[]).join(" ")}] 로 바뀐다`,
      "└ 대각선은 양쪽에서 한 글자씩 버린 값이라, 한쪽만 버리면 되는 자리에서 이미 얻은 것까지 함께 버린다",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 확인한다. */
  mathCheck: () => {
    const s = "ab";
    const t = "ba";
    const dp = fullTable(s, t);
    const rows: string[][] = [];
    for (let i = 0; i <= s.length; i++) {
      for (let j = 0; j <= t.length; j++) {
        const all = commonSubsequences(s.slice(0, i), t.slice(0, j));
        rows.push([
          String(i),
          String(j),
          `"${s.slice(0, i)}"`,
          `"${t.slice(0, j)}"`,
          all.map((w) => `"${w}"`).join(" "),
          String(all[all.length - 1]?.length ?? 0),
          String((dp[i] as number[])[j]),
        ]);
      }
    }
    assertSame(s, t, (dp[s.length] as number[])[t.length] as number);
    return [
      table(
        [
          "i",
          "j",
          "s 의 앞 i 글자",
          "t 의 앞 j 글자",
          "공통 부분 수열 전부",
          "그중 가장 긴 것의 길이",
          "dp[i][j]",
        ],
        rows,
        ["r", "r", "l", "l", "l", "r", "r"],
      ),
      "",
      "└ 오른쪽 두 열이 아홉 줄 다 같다. 정의대로 센 값과 표의 값이 같다는 뜻이다",
    ].join("\n");
  },

  /** `deep.math` ③④ — 호출 수의 닫힌 형태를 실측과 대조하고 제약 규모를 넣는다. */
  mathCallCount: () => {
    const rows = SCALE.map((k) => {
      const s = "a".repeat(k);
      const t = "b".repeat(k);
      const got = byPlainRecursion(s, t);
      assertSame(s, t, got.answer);
      const closed = 2n * binom(2 * k, k) - 1n;
      if (BigInt(got.calls) !== closed) {
        throw new Error(
          `닫힌 형태가 실측과 다르다 — k=${k} 실측 ${got.calls} ≠ 식 ${closed}`,
        );
      }
      return [String(k), num(got.calls), num(Number(closed))];
    });
    const calls = 2n * binom(2 * LIMIT, LIMIT) - 1n;
    return [
      table(["i = j", "부른 횟수(실측)", "2 * binom(i+j, i) - 1"], rows, [
        "r",
        "r",
        "r",
      ]),
      "",
      `제약 규모 i = j = ${num(LIMIT)} 을 두 식에 넣으면`,
      table(
        ["  2 * binom(i+j, i) - 1", `${num(digits(calls))} 자리`],
        [["  (i+1)(j+1)", num((LIMIT + 1) * (LIMIT + 1))]],
        ["l", "r"],
      ),
    ].join("\n");
  },

  /** `perf.derive` — 걸음의 무리마다 몇 번의 문자 비교와 값 결정이 드는가. */
  perfCount: () => {
    const c = byTable(S, T);
    assertSame(S, T, c.answer);
    const n = S.length;
    const m = T.length;
    const rows = [
      ["표 깔기", "T1", "0", "0", "0"],
      [
        "칸 채우기",
        `T2 부터 T${n + 1} 까지`,
        String(c.chars),
        String(c.picks),
        String(c.chars + c.picks),
      ],
      ["읽기", `T${n + 2}`, "0", "0", "0"],
      ["합계", "", String(c.chars), String(c.picks), String(c.chars + c.picks)],
    ];
    return [
      table(
        ["무리", "어느 걸음인가", "문자 비교", "값 결정", "기본 연산"],
        rows,
        ["l", "l", "r", "r", "r"],
      ),
      "",
      `└ 채운 칸이 ${n} x ${m} = ${num(n * m)} 개이고 칸마다 문자 비교 하나와 값 결정 하나다`,
      `└ 제약 규모 |s| = |t| = ${num(LIMIT)} 이면 기본 연산이 ${num(2 * LIMIT * LIMIT)} 번, 표의 칸이 ${num((LIMIT + 1) * (LIMIT + 1))} 개다`,
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양을 바꿔도 기본 연산 수가 그대로인가. */
  worstShape: () => {
    const n = SHAPE_N;
    const shapes: [string, string, string][] = [
      ["두 문자열이 같다", "a".repeat(n), "a".repeat(n)],
      ["공통 글자가 하나도 없다", "a".repeat(n), "b".repeat(n)],
      [
        "글자가 둘씩 번갈아 나온다",
        Array.from({ length: n }, (_, k) => (k % 2 === 0 ? "a" : "b")).join(""),
        Array.from({ length: n }, (_, k) => (k % 2 === 0 ? "b" : "a")).join(""),
      ],
      [
        "한쪽 글자가 하나 걸러 하나씩 겹친다",
        Array.from({ length: n }, (_, k) => "abcd"[k % 4] as string).join(""),
        Array.from({ length: n }, (_, k) =>
          k % 2 === 0 ? ("abcd"[(k / 2) % 4] as string) : "z",
        ).join(""),
      ],
    ];
    const rows = shapes.map(([name, s, t]) => {
      const c = byTable(s, t);
      assertSame(s, t, c.answer);
      return [
        name,
        num(c.chars),
        num(c.picks),
        num(c.chars + c.picks),
        num(c.answer),
      ];
    });
    return [
      table(
        [
          `입력의 모양 (|s| = |t| = ${num(n)})`,
          "문자 비교",
          "값 결정",
          "기본 연산",
          "답",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "가운데 세 열이 네 줄 다 같고 오른쪽 열만 다르다",
      `└ 답이 가장 커지는 입력은 두 문자열이 같은 것이고, 그때 답은 짧은 쪽의 길이 ${num(n)} 이다`,
    ].join("\n");
  },
};
