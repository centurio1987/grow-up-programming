/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 칸 하나를 정한 자리의 기록은 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서
 * 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/longestCommonSubsequence/longestCommonSubsequence-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  cases as altCases,
  matchPairs,
  pair,
} from "./longestCommonSubsequence-guide.alt.ts";
import {
  BRANCH_MARK,
  binom,
  byFrequency,
  byGreedyLeft,
  byPlainRecursion,
  type Cell,
  digits,
  FREQ_CASE,
  GREEDY_CASE,
  LIMIT,
  ROLL_S,
  ROLL_T,
  rollingWrong,
  S,
  T,
  trace,
  traceBack,
  walkSteps,
} from "./longestCommonSubsequence-guide.fig.tsx";
import { longestCommonSubsequence } from "./longestCommonSubsequence-guide.ref.ts";

const REF = new URL("./longestCommonSubsequence-guide.ref.ts", import.meta.url)
  .pathname;

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `1002001` → `1,002,001`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
const comma = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 열 폭을 내용에서 잰 뒤 글자 표를 만든다. `left` 에 든 열은 왼쪽, 나머지는 오른쪽 정렬이다. */
function table(
  head: string[],
  rows: string[][],
  left: readonly number[] = [0],
): string {
  const w = head.map((h, i) =>
    Math.max(width(h), ...rows.map((r) => width(r[i] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((c, i) =>
        left.includes(i) ? pad(c, w[i] as number) : padL(c, w[i] as number),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 표 아래에 실행이 낸 문장을 붙인다 — 본문은 이 블록을 `<!--/proof-->` 로 닫는다. */
const withNote = (tbl: string, note: string): string =>
  [tbl, "", note].join("\n");

const q = (x: string): string => `"${x}"`;
const pairName = (s: string, t: string): string => `${q(s)} 와 ${q(t)}`;

/* ────────────────────────── 기준 구현 ────────────────────────── */

/** `w` 가 `x` 의 부분 수열인가 — 왼쪽부터 차례로 맞춰 본다. */
function isSub(w: string, x: string): boolean {
  let at = 0;
  for (const ch of x) if (at < w.length && w[at] === ch) at++;
  return at === w.length;
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
    let w = "";
    for (let k = 0; k < s.length; k++) if ((mask >> k) & 1) w += s[k] as string;
    let at = 0;
    for (const ch of t) {
      reads++;
      if (at < w.length && w[at] === ch) at++;
    }
    if (at === w.length && w.length > best) best = w.length;
  }
  return { answer: best, made, reads };
}

/** 공통 부분 수열 전부 — 길이 순, 같은 길이는 사전순. */
function commonSubsequences(s: string, t: string): string[] {
  const out = new Set<string>();
  for (let mask = 0; mask < 1 << s.length; mask++) {
    let w = "";
    for (let k = 0; k < s.length; k++) if ((mask >> k) & 1) w += s[k] as string;
    if (isSub(w, t)) out.add(w);
  }
  return [...out].sort((a, b) => a.length - b.length || (a < b ? -1 : 1));
}

/** 정본과 같은 절차에 계수만 덧붙인 것 — 문자 비교와 값 결정을 센다. */
function byTable(
  s: string,
  t: string,
): { answer: number; chars: number; picks: number } {
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
      picks++;
      cur[j] =
        s[i - 1] === t[j - 1]
          ? (prev[j - 1] as number) + 1
          : Math.max(prev[j] as number, cur[j - 1] as number);
    }
  }
  const answer = (dp[n] as number[])[m] as number;
  return { answer: assertSame(s, t, answer), chars, picks };
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
    const cur = dp[i] as number[];
    for (let j = 1; j <= m; j++) {
      cur[j] =
        s[i - 1] === t[j - 1]
          ? ((dp[i - 1] as number[])[j - 1] as number) + 1
          : 0;
      best = Math.max(best, cur[j] as number);
    }
  }
  return { answer: best, last: (dp[n] as number[])[m] as number };
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

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 계측이 다른 절차를 잰 것이다. */
function assertSame(s: string, t: string, got: number): number {
  const want = longestCommonSubsequence(s, t);
  if (got !== want) {
    throw new Error(`계측기와 정본의 답이 다르다 — 계측 ${got} ≠ 정본 ${want}`);
  }
  return got;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  longestCommonSubsequence(s: string, t: string): number;
}

/**
 * 마지막 글자가 **다를 때 왼쪽 위 칸을 그대로 쓰는** 사본. 불변식을 지키던 바로 그 줄이다.
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

/**
 * 중화 실행인가 — `check-proof` 가 변이를 끈 채 이 파일을 한 번 더 부를 때는 변이 모듈이 정본
 * 모듈 그 자체다. 그때는 「변이가 답을 바꿨다」는 자기검사만 건너뛴다(SPEC §0 「증명 블록 규격」).
 */
const neutral = (impl: Impl): boolean =>
  impl.longestCommonSubsequence === longestCommonSubsequence;

/** 답이 갈리는 자리가 하나라도 있어야 「깨진다」가 참이다. */
function assertBreaks(impl: Impl, gaps: number[]): void {
  if (neutral(impl)) return;
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

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  name: string;
  s: string;
  t: string;
}

const NAMED = (s: string, t: string): Case => ({ name: pairName(s, t), s, t });

const WALK_CASE: Case = { name: `전개 입력 ${pairName(S, T)}`, s: S, t: T };

/** 두 방식을 나란히 실행해 사례 표의 줄을 만든다. */
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

/** `concept` — 후보 셋이 양쪽의 부분 수열인가. */
function conceptAnswer(): string {
  const cands = ["ace", "ade", "ec"];
  const yes = (b: boolean) => (b ? "예" : "아니요");
  const rows = cands.map((w) => [
    q(w),
    yes(isSub(w, S)),
    yes(isSub(w, T)),
    String(w.length),
  ]);
  const both = cands.filter((w) => isSub(w, S) && isSub(w, T));
  const ans = longestCommonSubsequence(S, T);
  const top = both[0] ?? "";
  if (both.length !== 1 || top.length !== ans) {
    throw new Error("양쪽의 부분 수열인 후보가 답과 맞지 않는다");
  }
  return withNote(
    md(["후보", "s 의 부분 수열", "t 의 부분 수열", "길이"], rows, [3]),
    `양쪽 모두의 부분 수열인 후보는 ${q(top)} 하나이고 길이는 ${top.length} 입니다. 정본이 longestCommonSubsequence(${q(S)}, ${q(T)}) 로 낸 값도 ${ans} 입니다.`,
  );
}

/** `concept` — DP 테이블의 칸 수. */
function conceptSize(): string {
  const rows = [
    [S.length, T.length],
    [LIMIT, LIMIT],
  ].map(([n, m]) => [
    comma(n as number),
    comma(m as number),
    comma(((n as number) + 1) * ((m as number) + 1)),
  ]);
  return table(["s 의 길이 n", "t 의 길이 m", "칸 (n+1)(m+1)"], rows, []);
}

/** `deep.origin` ② — 부분 수열을 전부 만드는 방법이 몇 번의 일이 되는가. */
function originEnumerate(): string {
  const rows = [3, 4, 5].map((len) => {
    const s = S.slice(0, len);
    const e = byEnumeration(s, T);
    assertSame(s, T, e.answer);
    return [q(s), q(T), comma(e.made), comma(e.reads), comma(e.made + e.reads)];
  });
  const big = 2n ** BigInt(LIMIT);
  return [
    table(
      ["s", "t", "만든 후보 수", "읽은 t 의 글자 수", "기본 연산 합"],
      rows,
      [0, 1],
    ),
    "",
    `과제 규모 n = m = ${comma(LIMIT)} 이면`,
    table(
      ["  만든 후보 수", `${comma(digits(big))} 자리 수`],
      [["  기본 연산 합", `${comma(digits(big * BigInt(LIMIT + 1)))} 자리 수`]],
      [0],
    ),
    `  └ 후보 하나마다 t 를 한 번씩 읽으므로 기본 연산은 후보 수에 ${comma(LIMIT + 1)}${을를(comma(LIMIT + 1))} 곱한 값이다`,
  ].join("\n");
}

/** `deep.origin` ⑤ — 순서를 안 보는 후보가 어디서 어긋나는가. */
function originFrequency(): string {
  const cases = [
    WALK_CASE,
    NAMED(...FREQ_CASE),
    NAMED("cab", "abc"),
    NAMED("abc", "cba"),
  ];
  const { rows } = contrast(cases, byFrequency);
  return table(CONTRAST_HEAD("겹치는 글자 개수"), rows, [0, 3]);
}

/** `deep.origin` ⑤ — 왼쪽부터 붙이는 후보가 어디서 어긋나고, 무엇을 붙였는가. */
function originGreedy(): string {
  const cases = [WALK_CASE, NAMED(...GREEDY_CASE), NAMED("aba", "ba")];
  const { rows } = contrast(cases, byGreedyLeft);
  const [gs, gt] = GREEDY_CASE;
  let at = 0;
  const walk: string[][] = [];
  for (const ch of gs) {
    const found = gt.indexOf(ch, at);
    walk.push([
      `'${ch}'`,
      found < 0 ? "붙일 자리가 없다" : `t[${found}] 에 붙인다`,
      found < 0 ? `다음 자리 ${at} 부터 찾았다` : `다음은 ${found + 1} 부터`,
    ]);
    if (found >= 0) at = found + 1;
  }
  const got = byGreedyLeft(gs, gt);
  const right = longestCommonSubsequence(gs, gt);
  const skipFirst = byGreedyLeft(gs.slice(1), gt);
  if (skipFirst !== right) throw new Error("첫 글자를 버린 답이 정본과 다르다");
  return [
    table(CONTRAST_HEAD("왼쪽부터 붙인 답"), rows, [0, 3]),
    "",
    `${pairName(gs, gt)} 에서 왼쪽부터 붙이면`,
    table(
      ["  s 의 글자", "한 일", "찾는 자리"],
      walk.map(([a, ...rest]) => [`  ${a}`, ...rest]),
      [0, 1, 2],
    ),
    `  └ 붙인 글자는 ${got} 개다. 첫 글자 '${gs[0]}' 하나를 버리고 나머지를 붙이면 ${skipFirst} 개로 정본의 답과 같다`,
  ].join("\n");
}

/** `deep.origin` ③④ — 마지막 글자로 줄이는 재귀를 기억 없이 부를 때와 칸에 적어 둘 때. */
function originRecursion(): string {
  const pairs: [string, string][] = [
    [S, T],
    [S, "vwx"],
    ["abcdefghij", "klmnopqrst"],
  ];
  const rows = pairs.map(([s, t]) => {
    const plain = byPlainRecursion(s, t);
    assertSame(s, t, plain.answer);
    return [
      pairName(s, t),
      `${s.length} x ${t.length}`,
      comma(plain.calls),
      comma(plain.perState.size),
      comma((s.length + 1) * (t.length + 1)),
    ];
  });
  const near = byPlainRecursion(S, T).calls;
  const far = byPlainRecursion(S, "vwx").calls;
  return [
    table(
      [
        "입력",
        "두 길이",
        "기억 없이 부른 횟수",
        "서로 다른 (i, j)",
        "DP 테이블 칸",
      ],
      rows,
      [0, 1],
    ),
    "",
    `└ 첫 두 줄은 두 길이가 같은데 부른 횟수가 ${(far / near).toFixed(1)} 배로 갈린다`,
    "└ 서로 다른 (i, j) 는 DP 테이블 칸 수를 넘지 않는다. 그 칸 수는 글자를 안 보고 두 길이로 정해진다",
  ].join("\n");
}

/** `deep.build` 1단계 — DP 테이블의 크기. */
function buildSize(): string {
  const tr = trace(S, T);
  const rows = [
    [S.length, T.length],
    [LIMIT, LIMIT],
  ].map(([n, m]) => {
    const a = n as number;
    const b = m as number;
    return [
      comma(a),
      comma(b),
      comma(a + 1),
      comma(b + 1),
      comma((a + 1) * (b + 1)),
    ];
  });
  const r = tr.rows.length;
  const c = tr.rows[0]?.length ?? 0;
  return withNote(
    md(
      ["n", "m", "줄 수 n+1", "줄마다 칸 수 m+1", "모든 칸"],
      rows,
      [0, 1, 2, 3, 4],
    ),
    `전개 입력에서 정본이 깐 DP 테이블은 ${r} 줄 × ${c} 칸, 모두 ${r * c} 칸입니다.`,
  );
}

/** `deep.build` 1단계 — dp[3][2] 를 이름에서 공통 부분 수열까지. */
function buildReadOne(): string {
  const i = 3;
  const j = 2;
  const all = commonSubsequences(S.slice(0, i), T.slice(0, j));
  const rows = all.map((w) => [q(w), String(w.length)]);
  const top = all.at(-1) ?? "";
  const cell = trace(S, T).rows[i]?.[j];
  if (cell !== top.length)
    throw new Error("dp[3][2] 가 가장 긴 공통 부분 수열과 다르다");
  return withNote(
    md(["공통 부분 수열", "길이"], rows, [1]),
    `${q(S.slice(0, i))} 와 ${q(T.slice(0, j))} 의 공통 부분 수열은 ${all.length} 개이고, 가장 긴 것은 ${q(top)} 의 ${top.length} 입니다. DP 테이블의 dp[${i}][${j}] 도 ${cell} 입니다.`,
  );
}

/** 칸 하나가 읽은 값 — 본문 표가 쓰는 한 줄. */
function readText(c: Cell): string {
  return c.branch === "same"
    ? `dp[${c.i - 1}][${c.j - 1}] + 1 = ${c.diag} + 1`
    : `max(dp[${c.i - 1}][${c.j}], dp[${c.i}][${c.j - 1}]) = max(${c.up}, ${c.left})`;
}

/** `deep.build` 2단계 — i=3 줄을 왼쪽부터 채우며 읽은 칸. */
function buildFillRow(): string {
  const i = 3;
  const cells = trace(S, T).cells.filter((c) => c.i === i);
  const rows = cells.map((c) => [
    String(c.j),
    `'${c.a}' · '${c.b}'`,
    BRANCH_MARK[c.branch],
    readText(c),
    String(c.value),
  ]);
  const reads = cells.flatMap((c) => c.reads.map((at) => ({ at, by: c.j })));
  const up = reads.filter(({ at: [r] }) => r === i - 1).length;
  const same = reads.filter(({ at: [r] }) => r === i);
  // 같은 줄에서 읽은 칸이 모두 읽은 칸보다 왼쪽인가 — 아니면 아직 안 정한 칸을 읽은 것이다.
  if (same.some(({ at: [, k], by }) => k >= by)) {
    throw new Error("같은 줄에서 아직 안 정한 칸을 읽었다");
  }
  const border = same.filter(({ at: [, k] }) => k === 0).length;
  return withNote(
    md(["j", "두 글자", "갈래", "읽은 값", `dp[${i}][j]`], rows, [0, 4]),
    `이 줄에서 읽은 칸 ${reads.length} 개 가운데 ${up} 개가 윗 줄 i=${i - 1} 이고, 나머지 ${same.length} 개는 같은 줄의 왼쪽 칸입니다. 그중 ${border} 개는 테두리이고 ${same.length - border} 개는 이 줄에서 앞서 정한 칸입니다.`,
  );
}

/** `deep.build` 2단계 — 마지막 글자가 같은 칸에서 세 후보. */
function buildSameBound(): string {
  const cells = trace(S, T).cells.filter((c) => c.branch === "same");
  const rows = cells.map((c) => [
    `dp[${c.i}][${c.j}]`,
    `'${c.a}' · '${c.b}'`,
    String(c.diag + 1),
    String(c.up),
    String(c.left),
  ]);
  const ok = cells.filter((c) => c.diag + 1 >= c.up && c.diag + 1 >= c.left);
  return withNote(
    md(["칸", "두 글자", "왼쪽 위 + 1", "위", "왼쪽"], rows, [2, 3, 4]),
    `마지막 글자가 같은 칸 ${cells.length} 개 가운데 ${ok.length} 개에서 왼쪽 위 + 1 이 위와 왼쪽보다 작지 않습니다.`,
  );
}

/** `deep.build` 3단계 — 마지막 줄의 칸이 t 의 앞부분마다의 답이다. */
function buildAnswer(): string {
  const tr = trace(S, T);
  const last = tr.rows[S.length] as readonly number[];
  let same = 0;
  const rows = last.map((v, j) => {
    const call = longestCommonSubsequence(S, T.slice(0, j));
    if (call === v) same++;
    return [String(j), q(T.slice(0, j)), String(v), String(call)];
  });
  return withNote(
    md(
      [
        "j",
        "t 의 앞 j 글자",
        `dp[${S.length}][j]`,
        `longestCommonSubsequence(${q(S)}, t 의 앞 j 글자)`,
      ],
      rows,
      [0, 2, 3],
    ),
    `${last.length} 열 가운데 ${same} 열에서 두 값이 같습니다. 정본이 돌려주는 것은 오른쪽 끝 dp[${S.length}][${T.length}] = ${tr.result} 하나입니다.`,
  );
}

const MOVE_NAME = {
  diag: "왼쪽 위로 (글자를 고른다)",
  up: "위로",
  left: "왼쪽으로",
  end: "끝",
} as const;

/** `deep.build` 3단계 — 오른쪽 아래에서 거슬러 간 길. */
function buildTraceBackPath(): string {
  const tr = trace(S, T);
  const path = traceBack(S, T);
  const rows = path.map((p, k) => [
    String(k + 1),
    `dp[${p.i}][${p.j}] = ${tr.rows[p.i]?.[p.j]}`,
    p.move === "end" ? "테두리" : `'${S[p.i - 1]}' · '${T[p.j - 1]}'`,
    MOVE_NAME[p.move],
    q(p.move === "diag" ? (S[p.i - 1] as string) + p.picked : p.picked),
  ]);
  const word = path.at(-1)?.picked ?? "";
  const diag = path.filter((p) => p.move === "diag").length;
  return withNote(
    md(["걸음", "선 칸", "두 글자", "가는 쪽", "모은 글자"], rows, [0]),
    `테두리에 이르기까지 지나온 칸은 ${path.length - 1} 개이고, 왼쪽 위로 간 칸 ${diag} 개의 글자를 이으면 ${q(word)} 입니다. 길이 ${word.length}${이가(String(word.length))} dp[${S.length}][${T.length}] = ${tr.result}${과와(String(tr.result))} 같습니다.`,
  );
}

/** `deep.walk` 도입 — 전개 입력과 끝에 나와야 할 값. */
function walkInput(): string {
  return [
    `const s = ${q(S)};`,
    `const t = ${q(T)};`,
    `// 이 절이 끝나면 ${longestCommonSubsequence(S, T)}${이가(String(longestCommonSubsequence(S, T)))} 나와야 한다`,
  ].join("\n");
}

/** DP 테이블 한 장을 글자로 — 줄 머리는 i 와 s 의 글자, 열 머리는 j 와 t 의 글자. */
function gridText(
  s: string,
  t: string,
  rows: readonly (readonly number[])[],
  mark: (i: number) => string = () => "",
): string {
  const head = [
    "",
    ...Array.from({ length: t.length + 1 }, (_, j) =>
      j === 0 ? "j=0" : `j=${j} ${t[j - 1]}`,
    ),
  ];
  const body = rows.map((r, i) => [
    i === 0 ? "i=0 -" : `i=${i} ${s[i - 1]}`,
    ...r.map(String),
  ]);
  return table(head, body, [0])
    .split("\n")
    .map((l, k) => (k === 0 ? l : `${l}${mark(k - 1)}`))
    .join("\n");
}

/** `deep.walk` 1 — DP 테이블을 깐 직후 · 한쪽이 빈 입력. */
function walkInit(): string {
  const tr = trace(S, T);
  const edge = (s: string, t: string) => {
    const e = trace(s, t);
    return `${pad(`s = ${q(s)}, t = ${q(t)}`, 22)}→  ${e.init.length} 줄 × ${e.init[0]?.length} 칸, 칸을 ${e.cells.length} 개 정하고 dp[${s.length}][${t.length}] = ${e.result} 반환`;
  };
  return [
    gridText(S, T, tr.init, (i) =>
      i === 0 ? "" : "     ← 테두리 밖은 아직 안 정한 칸",
    ),
    "",
    edge("", "abc"),
    edge("abc", ""),
  ].join("\n");
}

/** `deep.walk` 2 — 칸을 정하는 차례. */
function walkOrder(): string {
  const tr = trace(S, T);
  const lines: string[] = [];
  for (let i = 1; i <= S.length; i++) {
    const js = tr.cells.filter((c) => c.i === i).map((c) => c.j);
    lines.push(`i=${i} ('${S[i - 1]}')   j = ${js.join(" → ")}`);
  }
  return [
    ...lines,
    "  └ 한 줄을 왼쪽 끝부터 오른쪽 끝까지 다 정한 뒤 다음 줄로 간다",
  ].join("\n");
}

/** 걸음 번호로 줄 하나가 덮는 범위 — `T2~T4`. */
function stepRange(i: number): string {
  const ids = walkSteps()
    .filter(
      (s) =>
        s.step.write?.length === 1 &&
        s.step.write.some(([r, c]) => r === i && c > 0),
    )
    .map((s) => s.id);
  return `${ids[0]}~${ids.at(-1)}`;
}

/** `deep.walk` 3 — 앞 세 줄만 실행한 결과. */
function walkThreeRows(): string {
  const tr = trace(S, T);
  const rows: string[][] = [];
  for (let i = 1; i <= 3; i++) {
    const marks = tr.cells
      .filter((c) => c.i === i)
      .map((c) => BRANCH_MARK[c.branch])
      .join("");
    rows.push([
      stepRange(i),
      `i=${i}`,
      S[i - 1] as string,
      ...(tr.rows[i] as number[]).map(String),
      marks,
    ]);
  }
  const head = [
    "걸음",
    "줄",
    "s 의 글자",
    ...Array.from({ length: T.length + 1 }, (_, j) =>
      j === 0 ? "j=0" : `j=${j} ${T[j - 1]}`,
    ),
    "갈래",
  ];
  return [
    table(head, rows, [0, 1, 2, head.length - 1]),
    "",
    `② j <= m 은 j = 1 … ${T.length} 에서 참이고 j = ${T.length + 1} 에서 처음 거짓이 되어 줄이 끝난다`,
  ].join("\n");
}

/** `deep.walk.pause` — 불일치 칸에 0 을 적으면 어느 과제를 푸는가. */
function pauseSubstring(): string {
  const cases = [
    WALK_CASE,
    NAMED("abc", "abc"),
    NAMED("AGGTAB", "GXTXAYB"),
    NAMED("abc", "aabbcc"),
  ];
  const rows = cases.map((c) => {
    const bare = longestCommonSubsequence(c.s, c.t);
    const sub = bySubstring(c.s, c.t);
    return [
      c.name,
      String(bare),
      String(sub.last),
      String(sub.answer),
      bare === sub.answer ? "같다" : "틀리다",
    ];
  });
  return [
    table(
      [
        "입력",
        "정본이 낸 답",
        "0 을 적은 DP 테이블의 오른쪽 아래",
        "그 DP 테이블의 최댓값",
        "판정",
      ],
      rows,
      [0, 4],
    ),
    "",
    "└ 불일치에 0 을 적으면 고른 자리가 연속이어야 하는 다른 과제가 된다. 답도 오른쪽 아래가 아니라 최댓값이다",
  ].join("\n");
}

/** `deep.walk` 4 — 열일곱 걸음. */
function walkTrace(): string {
  const steps = walkSteps();
  const tr = trace(S, T);
  const byCell = new Map(tr.cells.map((c) => [`${c.i},${c.j}`, c]));
  const rows = steps.map((s) => {
    const w = s.step.write ?? [];
    if (w.length > 1) {
      return [
        s.id,
        "테두리",
        "—",
        "빈 접두어 → 0 으로 깐다",
        "—",
        String(s.step.calc?.result),
      ];
    }
    const at = w[0];
    if (!at) {
      return [
        s.id,
        `dp[${S.length}][${T.length}]`,
        "—",
        "읽기",
        "—",
        String(tr.result),
      ];
    }
    const c = byCell.get(`${at[0]},${at[1]}`) as Cell;
    const same = c.branch === "same";
    return [
      s.id,
      `dp[${c.i}][${c.j}]`,
      `'${c.a}' · '${c.b}'`,
      `\`'${c.a}' === '${c.b}'\` **${same ? "참" : "거짓"}** → ${BRANCH_MARK[c.branch]}`,
      same ? `왼쪽 위 ${c.diag}` : `위 ${c.up} · 왼쪽 ${c.left}`,
      String(c.value),
    ];
  });
  const nSame = tr.cells.filter((c) => c.branch === "same").length;
  const nDiff = tr.cells.length - nSame;
  return withNote(
    md(["단계", "칸", "두 글자", "조건 판정", "읽은 값", "정한 값"], rows, [5]),
    `③ 이 ${nSame} 칸, ④ 가 ${nDiff} 칸이고, 반환값은 ${tr.result} 입니다.`,
  );
}

/** `deep.walk.pause` — 일치 칸에서도 후보 셋을 다 보면 무엇이 달라지는가. */
function pauseMaxThree(): string {
  const cases = [
    WALK_CASE,
    NAMED("ab", "ba"),
    NAMED("AGGTAB", "GXTXAYB"),
    NAMED("abc", "aabbcc"),
    NAMED("aaa", "aaa"),
  ];
  const { rows, gaps } = contrast(cases, (s, t) =>
    maxOfThree.longestCommonSubsequence(s, t),
  );
  assertNeverBreaks(gaps);
  return table(CONTRAST_HEAD("후보 셋을 다 본 답"), rows, [0, 3]);
}

/** `deep.walk.pause` — 줄 하나로 줄이면서 왼쪽 칸을 왼쪽 위로 쓰면 무엇이 달라지는가. */
function pauseRolling(): string {
  const cases = [
    WALK_CASE,
    NAMED(ROLL_S, ROLL_T),
    NAMED("abc", "abc"),
    NAMED("ab", "ba"),
    NAMED("aab", "aaab"),
  ];
  const rows = cases.map((c) => {
    const bare = longestCommonSubsequence(c.s, c.t);
    const wrong = rollingWrong(c.s, c.t).answer;
    const right = assertSame(c.s, c.t, byRollingRight(c.s, c.t));
    return [
      c.name,
      String(bare),
      String(wrong),
      String(right),
      bare === wrong ? "같다" : "틀리다",
    ];
  });
  const bad = rollingWrong(ROLL_S, ROLL_T);
  return [
    table(
      [
        "입력",
        "정본이 낸 답",
        "왼쪽 칸을 왼쪽 위로 쓴 답",
        "직전 값을 챙긴 답",
        "판정",
      ],
      rows,
      [0, 4],
    ),
    "",
    `└ ${pairName(ROLL_S, ROLL_T)} 에서 줄이 [${bad.row.join(" ")}] 로 끝난다`,
  ].join("\n");
}

/** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
function finalRun(): string {
  const inputs: [string, string][] = [
    [S, T],
    ["AGGTAB", "GXTXAYB"],
    ["abc", "def"],
    ["", "abc"],
    ["a", "a"],
  ];
  const calls = inputs.map(
    ([s, t]) => `longestCommonSubsequence(${q(s)}, ${q(t)})`,
  );
  const w = Math.max(...calls.map((c) => c.length));
  return calls
    .map((c, k) => {
      const [s, t] = inputs[k] as [string, string];
      return `${pad(c, w)}  →  ${longestCommonSubsequence(s, t)}`;
    })
    .join("\n");
}

/** `related` — 같은 상태를 몇 번 부르는가. */
function relatedRepeat(): string {
  const t = "vwx";
  const r = byPlainRecursion(S, t);
  const top = [...r.perState.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, 5);
  const rows = top.map(([k, v]) => [`(${k.replace(",", ", ")})`, comma(v)]);
  const [firstKey, firstCount] = top[0] ?? ["", 0];
  const big = 2n * binom(2 * LIMIT, LIMIT) - 1n;
  return withNote(
    md(["상태 (i, j)", "불린 횟수"], rows, [1]),
    `${pairName(S, t)} 에서 기억 없이 부르면 모두 ${comma(r.calls)} 번 부르지만 서로 다른 상태는 ${comma(r.perState.size)} 개뿐이고, 가장 많이 불린 상태 (${firstKey.replace(",", ", ")}) 는 ${comma(firstCount)} 번 불렸습니다. 길이가 둘 다 ${comma(LIMIT)} 이고 공통 글자가 없으면 부르는 횟수가 ${comma(digits(big))} 자리 수, 상태는 ${comma((LIMIT + 1) * (LIMIT + 1))} 개입니다.`,
  );
}

/** `purpose.fit` — 두 길이의 곱이 정하는 칸 수와 메모리. */
function fitScale(): string {
  const rows = [LIMIT, 100_000].map((n) => {
    const cells = (n + 1) * (n + 1);
    const bytes = cells * 4;
    const size =
      bytes >= 1e9
        ? `약 ${(bytes / 1e9).toFixed(0)} GB`
        : `약 ${(bytes / 1e6).toFixed(0)} MB`;
    return [comma(n), comma(n), comma(cells), size];
  });
  return table(["n", "m", "칸 (n+1)(m+1)", "칸마다 4 바이트"], rows, []);
}

/** `purpose.alt` — 두 설계의 기본 연산 수. */
function altBench(): string {
  const mine = altCases["DP 테이블 채우기"]?.() as Record<string, number>;
  const other = altCases["일치 쌍 따라가기"]?.() as Record<string, number>;
  const rows: string[][] = [];
  let flip = "";
  let prevWinner = "";
  for (const a of [2, 3, 4, 8, 26, 64]) {
    const key = `알파벳 ${a} · 기본 연산`;
    const tab = mine[key] as number;
    const hs = other[key] as number;
    const r = mine[`알파벳 ${a} · 일치 쌍`] as number;
    if (r !== matchPairs(...pair(a))) throw new Error("일치 쌍 수가 다르다");
    const winner = tab <= hs ? "DP 테이블 채우기" : "일치 쌍 따라가기";
    if (prevWinner !== "" && winner !== prevWinner && flip === "") {
      flip = `알파벳 ${a}`;
    }
    prevWinner = winner;
    const ratio = tab <= hs ? (hs / tab).toFixed(1) : (tab / hs).toFixed(1);
    rows.push([
      String(a),
      comma(r),
      tab <= hs ? `**${comma(tab)}**` : comma(tab),
      tab <= hs ? comma(hs) : `**${comma(hs)}**`,
      `${winner} 쪽이 ${ratio} 배 적다`,
    ]);
  }
  const sameTab = mine["전부 같은 글자 · 기본 연산"] as number;
  const sameHs = other["전부 같은 글자 · 기본 연산"] as number;
  rows.push([
    "전부 같은 글자",
    comma(mine["전부 같은 글자 · 일치 쌍"] as number),
    `**${comma(sameTab)}**`,
    comma(sameHs),
    `DP 테이블 채우기 쪽이 ${(sameHs / sameTab).toFixed(1)} 배 적다`,
  ]);
  return withNote(
    md(
      [
        "알파벳 크기 A",
        "일치 쌍 r",
        "DP 테이블 채우기",
        "일치 쌍 따라가기",
        "적은 쪽",
      ],
      rows,
      [1, 2, 3],
    ),
    `DP 테이블 채우기는 모든 줄에서 ${comma(sameTab)} 이고, 적은 쪽은 ${flip} 에서 처음 바뀝니다.`,
  );
}

/** `purpose.alt` — 내주는 것과 얻는 것. */
function altTrade(): string {
  const mine = altCases["DP 테이블 채우기"]?.() as Record<string, number>;
  const other = altCases["일치 쌍 따라가기"]?.() as Record<string, number>;
  const a64 =
    (mine["알파벳 64 · 기본 연산"] as number) /
    (other["알파벳 64 · 기본 연산"] as number);
  return table(
    ["", "", ""],
    [
      [
        "내주는 것",
        "저장 칸",
        `${comma(mine["저장 칸"] as number)} 대 ${comma(other["저장 칸"] as number)}. DP 테이블을 통째로 들고 있다`,
      ],
      [
        "내주는 것",
        "드문 일치",
        `알파벳 64 에서 연산 수가 ${a64.toFixed(1)} 배 많다`,
      ],
      [
        "얻는 것",
        "최악 보장",
        `입력이 무엇이든 2nm 이다. 상대는 전부 같은 글자에서 ${comma(other["전부 같은 글자 · 기본 연산"] as number)} 까지 커진다`,
      ],
      [
        "얻는 것",
        "구현",
        "루프 둘로 끝난다. 상대는 위치 목록 · 문턱 배열 · 이분 탐색이 필요하다",
      ],
      [
        "얻는 것",
        "확장",
        "DP 테이블이 남아 있어 고른 글자를 거슬러 찾을 수 있다",
      ],
    ],
    [0, 1, 2],
  )
    .split("\n")
    .slice(1)
    .join("\n");
}

/** `deep.math` ② — 정의를 작은 값에 넣어 확인한다. */
function mathCheck(): string {
  const s = "ab";
  const t = "ba";
  const rowsDp = trace(s, t).rows;
  const rows: string[][] = [];
  let same = 0;
  for (let i = 0; i <= s.length; i++) {
    for (let j = 0; j <= t.length; j++) {
      const all = commonSubsequences(s.slice(0, i), t.slice(0, j));
      const longest = all.at(-1)?.length ?? 0;
      const v = rowsDp[i]?.[j] as number;
      if (v === longest) same++;
      rows.push([
        String(i),
        String(j),
        q(s.slice(0, i)),
        q(t.slice(0, j)),
        all.map(q).join(" "),
        String(longest),
        String(v),
      ]);
    }
  }
  return [
    table(
      [
        "i",
        "j",
        "s 의 앞 i 글자",
        "t 의 앞 j 글자",
        "공통 부분 수열 전부",
        "가장 긴 길이",
        "dp[i][j]",
      ],
      rows,
      [2, 3, 4],
    ),
    "",
    `└ 오른쪽 두 열이 ${rows.length} 줄 가운데 ${same} 줄에서 같다`,
  ].join("\n");
}

/** `deep.math` — 점화식 K 를 작은 값에 넣은 값과 실측. */
function mathKSmall(): string {
  const K = (i: number, j: number): number =>
    i === 0 || j === 0 ? 1 : 1 + K(i - 1, j) + K(i, j - 1);
  const pairs: [number, number][] = [
    [1, 1],
    [1, 2],
    [2, 2],
  ];
  const rows = pairs.map(([i, j]) => {
    const a = K(i - 1, j);
    const b = K(i, j - 1);
    const got = byPlainRecursion("a".repeat(i), "b".repeat(j)).calls;
    if (got !== K(i, j)) throw new Error("점화식이 실측과 다르다");
    return [
      `K(${i},${j})`,
      `1 + K(${i - 1},${j}) + K(${i},${j - 1})`,
      `= 1 + ${a} + ${b}`,
      `= ${K(i, j)}`,
      `실측 ${got}`,
    ];
  });
  return table(["", "", "", "", ""], rows, [0, 1, 2, 3, 4])
    .split("\n")
    .slice(1)
    .join("\n");
}

/** `deep.math` ③④ — 호출 수의 닫힌 형태를 실측과 대조하고 과제 규모를 넣는다. */
function mathCallCount(): string {
  const rows = [1, 2, 3, 4, 5, 6].map((k) => {
    const got = byPlainRecursion("a".repeat(k), "b".repeat(k));
    assertSame("a".repeat(k), "b".repeat(k), got.answer);
    const closed = 2n * binom(2 * k, k) - 1n;
    if (BigInt(got.calls) !== closed) {
      throw new Error(
        `닫힌 형태가 실측과 다르다 — k=${k} 실측 ${got.calls} ≠ 식 ${closed}`,
      );
    }
    return [String(k), comma(got.calls), comma(closed)];
  });
  const calls = 2n * binom(2 * LIMIT, LIMIT) - 1n;
  return [
    table(["i = j", "부른 횟수(실측)", "2 * binom(i+j, i) - 1"], rows, []),
    "",
    `과제 규모 i = j = ${comma(LIMIT)} 을 두 식에 넣으면`,
    table(
      ["  2 * binom(i+j, i) - 1", `${comma(digits(calls))} 자리 수`],
      [["  (i+1)(j+1)", comma((LIMIT + 1) * (LIMIT + 1))]],
      [0],
    ),
  ].join("\n");
}

/** `invariant` ② — 모든 칸을 정의대로 구한 값과 맞댄다. */
function invariantCells(): string {
  const tr = trace(S, T);
  let total = 0;
  let bad = 0;
  const rows = tr.rows.map((row, i) => {
    const def = row.map(
      (_, j) => byEnumeration(S.slice(0, i), T.slice(0, j)).answer,
    );
    const off = row.filter((v, j) => v !== def[j]).length;
    total += row.length;
    bad += off;
    return [`i=${i}`, `[${row.join(" ")}]`, `[${def.join(" ")}]`, String(off)];
  });
  return withNote(
    md(
      ["줄", "DP 테이블의 값", "정의대로 직접 구한 값", "어긋난 칸"],
      rows,
      [3],
    ),
    `정의대로 직접 구한 값과 DP 테이블의 값을 ${total} 칸에서 대조했고, 어긋난 칸은 ${bad} 개입니다.`,
  );
}

/** `invariant` ② — 경계에 있는 입력. */
function invariantEdges(): string {
  const inputs: [string, string][] = [
    ["", ""],
    ["", "abc"],
    ["abc", ""],
    ["a", "a"],
    ["a", "b"],
    ["abc", "def"],
    ["abc", "abc"],
  ];
  const rows = inputs.map(([s, t]) => {
    const e = trace(s, t);
    const same = e.cells.filter((c) => c.branch === "same").length;
    return [
      pairName(s, t),
      `${e.init.length} × ${e.init[0]?.length}`,
      String(same),
      String(e.cells.length - same),
      String(e.result),
    ];
  });
  return withNote(
    md(
      ["입력", "줄 × 칸", "같은 글자 칸", "다른 글자 칸", "반환"],
      rows,
      [2, 3, 4],
    ),
    `${inputs.length} 입력 모두 칸을 두 갈래 가운데 하나로만 정했습니다.`,
  );
}

/** `invariant` ③ — 마지막 글자가 다를 때 왼쪽 위를 쓰면 무엇이 나오는가. */
function mutantDiagonal(): string {
  const cases = [
    WALK_CASE,
    NAMED("abc", "abc"),
    NAMED("AGGTAB", "GXTXAYB"),
    NAMED("abc", "aabbcc"),
    NAMED("ab", "ba"),
  ];
  const run = (s: string, t: string) =>
    diagonalOnMismatch.longestCommonSubsequence(s, t);
  const { rows, gaps } = contrast(cases, run);
  assertBreaks(diagonalOnMismatch, gaps);
  // 마지막 줄의 j 번째 칸은 t 의 앞 j 글자만 준 호출의 답과 같다 — j 번째 열까지는 t 의 나머지를 안 읽는다.
  const lastRow = (f: (s: string, t: string) => number) =>
    Array.from({ length: T.length + 1 }, (_, j) => f(S, T.slice(0, j))).join(
      " ",
    );
  return [
    table(CONTRAST_HEAD("불일치에도 왼쪽 위를 쓴 답"), rows, [0, 3]),
    "",
    `전개 입력의 마지막 줄  정본 [${lastRow(longestCommonSubsequence)}]  변이 [${lastRow(run)}]`,
  ].join("\n");
}

/** `perf.derive` — 걸음의 무리마다 몇 번의 문자 비교와 값 결정이 드는가. */
function perfCount(): string {
  const c = byTable(S, T);
  const steps = walkSteps();
  const first = steps[0]?.id ?? "";
  const cellsFrom = steps[1]?.id ?? "";
  const cellsTo = steps.at(-2)?.id ?? "";
  const last = steps.at(-1)?.id ?? "";
  const rows = [
    ["DP 테이블 깔기", first, "0", "0", "0"],
    [
      "칸 채우기",
      `${cellsFrom}~${cellsTo}`,
      String(c.chars),
      String(c.picks),
      String(c.chars + c.picks),
    ],
    ["읽기", last, "0", "0", "0"],
    ["합계", "", String(c.chars), String(c.picks), String(c.chars + c.picks)],
  ];
  const n = S.length;
  const m = T.length;
  const big = byTable("a".repeat(LIMIT), "b".repeat(LIMIT));
  return [
    table(["무리", "걸음", "문자 비교", "값 결정", "기본 연산"], rows, [0, 1]),
    "",
    `└ 채운 칸이 ${n} x ${m} = ${n * m} 개이고 칸마다 문자 비교 하나와 값 결정 하나다. 2nm = ${2 * n * m}`,
    `└ 과제 규모 n = m = ${comma(LIMIT)} 이면 기본 연산이 ${comma(big.chars + big.picks)} 번, DP 테이블의 칸이 ${comma((LIMIT + 1) * (LIMIT + 1))} 개다`,
  ].join("\n");
}

/** `perf.worst` — 입력의 모양을 바꿔도 기본 연산 수가 그대로인가. */
function worstShape(): string {
  const n = LIMIT;
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
    return [
      name,
      comma(c.chars),
      comma(c.picks),
      comma(c.chars + c.picks),
      comma(c.answer),
    ];
  });
  return [
    table(
      [
        `입력의 모양 (n = m = ${comma(n)})`,
        "문자 비교",
        "값 결정",
        "기본 연산",
        "답",
      ],
      rows,
      [0],
    ),
    "",
    "└ 가운데 세 열이 네 줄 다 같고 오른쪽 열만 다르다",
  ].join("\n");
}

/** `selfcheck` — i=1 줄과 i=2 줄. */
function selfcheckRow(): string {
  const tr = trace(S, T);
  const rows = [1, 2].map((i) => [
    stepRange(i),
    `i=${i}`,
    `'${S[i - 1]}'`,
    `[${(tr.rows[i] as number[]).join(" ")}]`,
    S[i - 1] !== undefined && T.includes(S[i - 1] as string)
      ? "t 에 있다"
      : "t 에 없다",
  ]);
  return table(
    ["걸음", "줄", "s 의 글자", "다 채운 줄", "그 글자"],
    rows,
    [0, 1, 2, 3, 4],
  );
}

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 후보 셋. */
  "concept-answer": conceptAnswer,
  /** `concept` — 칸 수. */
  "concept-size": conceptSize,
  /** `deep.origin` ② — 부분 수열을 전부 만드는 비용. */
  "origin-enumerate": originEnumerate,
  /** `deep.origin` ⑤ — 겹치는 글자 개수. */
  "origin-frequency": originFrequency,
  /** `deep.origin` ⑤ — 왼쪽부터 붙이기. */
  "origin-greedy": originGreedy,
  /** `deep.origin` ③④ — 기억 없는 재귀와 DP 테이블. */
  "origin-recursion": originRecursion,
  /** `deep.build` 1단계 — DP 테이블의 크기. */
  "build-size": buildSize,
  /** `deep.build` 1단계 — dp[3][2] 하나를 읽는다. */
  "build-read-one": buildReadOne,
  /** `deep.build` 2단계 — i=3 줄을 채우며 읽은 칸. */
  "build-fill-row": buildFillRow,
  /** `deep.build` 2단계 — 같은 글자 칸의 세 후보. */
  "build-same-bound": buildSameBound,
  /** `deep.build` 3단계 — 마지막 줄의 뜻. */
  "build-answer": buildAnswer,
  /** `deep.build` 3단계 — 거슬러 간 길. */
  "build-trace-back-path": buildTraceBackPath,
  /** `deep.walk` 도입. */
  "walk-input": walkInput,
  /** `deep.walk` 1 — 깐 직후. */
  "walk-init": walkInit,
  /** `deep.walk` 2 — 칸을 정하는 차례. */
  "walk-order": walkOrder,
  /** `deep.walk` 3 — 앞 세 줄. */
  "walk-three-rows": walkThreeRows,
  /** `deep.walk.pause` — 불일치에 0. */
  "pause-substring": pauseSubstring,
  /** `deep.walk` 4 — 열일곱 걸음. */
  "walk-trace": walkTrace,
  /** `deep.walk.pause` — 후보 셋. */
  "pause-max-three": pauseMaxThree,
  /** `deep.walk.pause` — 줄 하나로 줄이기. */
  "pause-rolling": pauseRolling,
  /** `deep.walk.final` — 전체 코드의 실행. */
  "final-run": finalRun,
  /** `related` — 같은 상태를 거듭 부른다. */
  "related-repeat": relatedRepeat,
  /** `purpose.fit` — 두 길이의 곱. */
  "fit-scale": fitScale,
  /** `purpose.alt` — 두 설계의 기본 연산. */
  "alt-bench": altBench,
  /** `purpose.alt` — 내주는 것과 얻는 것. */
  "alt-trade": altTrade,
  /** `deep.math` ② — 정의 검산. */
  "math-check": mathCheck,
  /** `deep.math` — 점화식 K 의 작은 값. */
  "math-k-small": mathKSmall,
  /** `deep.math` ③④ — 닫힌 형태와 과제 규모. */
  "math-call-count": mathCallCount,
  /** `invariant` ② — 모든 칸. */
  "invariant-cells": invariantCells,
  /** `invariant` ② — 경계 입력. */
  "invariant-edges": invariantEdges,
  /** `invariant` ③ — 불일치에 왼쪽 위. */
  "mutant-diagonal": mutantDiagonal,
  /** `perf.derive` — 걸음의 무리. */
  "perf-count": perfCount,
  /** `perf.worst` — 입력의 모양. */
  "worst-shape": worstShape,
  /** `selfcheck` — 물음. */
  "selfcheck-row": selfcheckRow,
};
