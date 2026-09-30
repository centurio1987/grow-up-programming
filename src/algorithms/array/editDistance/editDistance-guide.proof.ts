/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 칸 하나를 정한 자리의 기록은 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서
 * 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/editDistance/editDistance-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  N as ALT_N,
  cases as altCases,
  flipPoint,
} from "./editDistance-guide.alt.ts";
import {
  type Applied,
  applyScript,
  BRANCH_MARK,
  backtrack,
  byBreadthFirst,
  byPlainRecursion,
  bySlot,
  type Cell,
  callsWithoutCommon,
  cellName,
  digits,
  editText,
  LIMIT,
  oneEditCount,
  PICK_NAME,
  S,
  SLOT_CASE,
  type Stepped,
  scriptResult,
  T,
  trace,
  walkSteps,
} from "./editDistance-guide.fig.tsx";
import { editDistance } from "./editDistance-guide.ref.ts";

const REF = new URL("./editDistance-guide.ref.ts", import.meta.url).pathname;

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

/** 머리줄 없는 글자 표 — 줄마다 이름과 값을 나란히 적는다. */
const plain = (rows: string[][], left: readonly number[]): string =>
  table(rows[0]?.map(() => "") ?? [], rows, left)
    .split("\n")
    .slice(1)
    .join("\n");

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
const pairName = (s: string, t: string): string =>
  `${q(s)}${과와(s.at(-1) ?? "")} ${q(t)}`;

/* ────────────────────────── 기준 구현 ────────────────────────── */

/**
 * 정의대로 센 최소 편집 횟수 — **편집을 한 번씩 해 보며 양쪽에서 만나는 곳을 찾는다.** 세 편집의
 * 비용이 같고 서로를 되돌리므로(삽입 ↔ 삭제, 교체 ↔ 교체) 두 문자열에서 동시에 넓혀 가도 된다.
 * 한쪽으로만 넓히면 `"horse"` 를 빈 문자열로 만드는 데도 문자열이 수천만 개가 되어서, 불변식처럼
 * 칸마다 정의를 다시 셀 때는 이것을 쓴다. 알파벳은 두 문자열에 나오는 글자로 제한한다.
 */
function byMeeting(s: string, t: string): number {
  if (s === t) return 0;
  const alphabet = [...new Set([...s, ...t])];
  const next = (x: string): string[] => {
    const out: string[] = [];
    for (let k = 0; k < x.length; k++) {
      out.push(x.slice(0, k) + x.slice(k + 1));
      for (const ch of alphabet) {
        if (ch !== x[k]) out.push(x.slice(0, k) + ch + x.slice(k + 1));
      }
    }
    for (let k = 0; k <= x.length; k++) {
      for (const ch of alphabet) out.push(x.slice(0, k) + ch + x.slice(k));
    }
    return out;
  };
  const from = new Map([[s, 0]]);
  const to = new Map([[t, 0]]);
  let a = [s];
  let b = [t];
  for (let round = 0; round < 40; round++) {
    // 작은 쪽을 한 겹 넓히고, 새로 닿은 문자열이 다른 쪽에 이미 있으면 그중 가장 짧은 합이 답이다.
    const grow = a.length <= b.length;
    const [mine, other, layer] = grow ? [from, to, a] : [to, from, b];
    const fresh: string[] = [];
    let best = Number.POSITIVE_INFINITY;
    for (const x of layer) {
      const d = (mine.get(x) as number) + 1;
      for (const y of next(x)) {
        if (mine.has(y)) continue;
        mine.set(y, d);
        fresh.push(y);
        const o = other.get(y);
        if (o !== undefined) best = Math.min(best, d + o);
      }
    }
    if (best < Number.POSITIVE_INFINITY) return best;
    if (grow) a = fresh;
    else b = fresh;
  }
  throw new Error(`${pairName(s, t)} 에서 만나지 못했다`);
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 계측이 다른 절차를 잰 것이다. */
function assertSame(s: string, t: string, got: number): number {
  const want = editDistance(s, t);
  if (got !== want) {
    throw new Error(`계측기와 정본의 답이 다르다 — 계측 ${got} ≠ 정본 ${want}`);
  }
  return got;
}

/** 정본과 같은 절차에 계수만 덧붙인 것 — 문자 비교와 값 비교를 센다. */
function byTable(
  s: string,
  t: string,
): { answer: number; chars: number; picks: number; same: number } {
  const n = s.length;
  const m = t.length;
  let chars = 0;
  let picks = 0;
  let same = 0;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 0; i <= n; i++) (dp[i] as number[])[0] = i;
  for (let j = 0; j <= m; j++) (dp[0] as number[])[j] = j;
  for (let i = 1; i <= n; i++) {
    const prev = dp[i - 1] as number[];
    const cur = dp[i] as number[];
    for (let j = 1; j <= m; j++) {
      chars++;
      if (s[i - 1] === t[j - 1]) {
        same++;
        cur[j] = prev[j - 1] as number;
      } else {
        picks += 2;
        cur[j] =
          Math.min(
            prev[j - 1] as number,
            prev[j] as number,
            cur[j - 1] as number,
          ) + 1;
      }
    }
  }
  const answer = (dp[n] as number[])[m] as number;
  return { answer: assertSame(s, t, answer), chars, picks, same };
}

/** 최장 공통 부분 수열 길이. 교체를 뺀 거리가 이 값으로 나오는지 확인하는 데 쓴다. */
function lcsLength(s: string, t: string): number {
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
  return (dp[n] as number[])[m] as number;
}

/** 세 연산의 비용을 따로 주고 같은 DP 테이블을 채운다. 비용이 같지 않을 때를 보는 자리다. */
function weighted(
  s: string,
  t: string,
  cost: { sub: number; del: number; ins: number },
): number {
  const n = s.length;
  const m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 0; i <= n; i++) (dp[i] as number[])[0] = i * cost.del;
  for (let j = 0; j <= m; j++) (dp[0] as number[])[j] = j * cost.ins;
  for (let i = 1; i <= n; i++) {
    const prev = dp[i - 1] as number[];
    const cur = dp[i] as number[];
    for (let j = 1; j <= m; j++) {
      cur[j] =
        s[i - 1] === t[j - 1]
          ? (prev[j - 1] as number)
          : Math.min(
              (prev[j - 1] as number) + cost.sub,
              (prev[j] as number) + cost.del,
              (cur[j - 1] as number) + cost.ins,
            );
    }
  }
  return (dp[n] as number[])[m] as number;
}

/** 위 칸에서 온 걸음을 삽입으로 잘못 읽은 목록. 왼쪽 위와 왼쪽은 그대로 둔다. */
function misread(s: string, t: string): Stepped[] {
  return backtrack(s, t).map((step) =>
    step.move === "삭제"
      ? { ...step, move: "삽입", letter: t[step.cell[1] - 1] as string }
      : step,
  );
}

/** 격자 경로 수 — 오른쪽 · 아래 · 대각선 세 걸음으로 (0,0) 에서 (i,j) 까지 가는 방법. */
function paths(i: number, j: number): bigint {
  const dp: bigint[][] = Array.from({ length: i + 1 }, () =>
    new Array<bigint>(j + 1).fill(0n),
  );
  for (let a = 0; a <= i; a++) (dp[a] as bigint[])[0] = 1n;
  for (let b = 0; b <= j; b++) (dp[0] as bigint[])[b] = 1n;
  for (let a = 1; a <= i; a++) {
    for (let b = 1; b <= j; b++) {
      (dp[a] as bigint[])[b] =
        ((dp[a - 1] as bigint[])[b] as bigint) +
        ((dp[a] as bigint[])[b - 1] as bigint) +
        ((dp[a - 1] as bigint[])[b - 1] as bigint);
    }
  }
  return (dp[i] as bigint[])[j] as bigint;
}

/** 계승. 닫힌 형태가 걸음을 늘어놓는 방법의 수를 셀 때 쓴다. */
function factorial(n: number): bigint {
  let out = 1n;
  for (let k = 2; k <= n; k++) out *= BigInt(k);
  return out;
}

/** 대각선 걸음 수 `p` 하나의 항 — `(i+j-p)! / (p! (i-p)! (j-p)!)`. */
const term = (i: number, j: number, p: number): bigint =>
  factorial(i + j - p) / (factorial(p) * factorial(i - p) * factorial(j - p));

/** 경로 수의 닫힌 형태 — 대각선 걸음 수 `p` 로 갈라 더한다. */
function pathsClosed(i: number, j: number): bigint {
  let out = 0n;
  for (let p = 0; p <= Math.min(i, j); p++) out += term(i, j, p);
  return out;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  editDistance(s: string, t: string): number;
}

/**
 * **첫 열을 전부 `0` 으로 둔** 사본. 불변식의 출발점을 지키던 바로 그 줄이다.
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const zeroFirstColumn = await loadMutant<Impl>(REF, {
  swap: [/\(dp\[i\] as number\[\]\)\[0\] = i;/, "(dp[i] as number[])[0] = 0;"],
});

/** **교체 후보를 뺀** 사본. 삭제와 삽입 둘로만 세 갈래를 대신한다. */
const withoutSub = await loadMutant<Impl>(REF, {
  swap: [
    /cur\[j\] = Math\.min\(sub, del, ins\) \+ 1;/,
    "cur[j] = Math.min(del, ins) + 1;",
  ],
});

/**
 * 중화 실행인가 — `check-proof` 가 변이를 끈 채 이 파일을 한 번 더 부를 때는 변이 모듈이 정본
 * 모듈 그 자체다. 그때는 변이에 기대는 자기검사만 건너뛴다(SPEC §0 「증명 블록 규격」).
 */
const neutral = (impl: Impl): boolean => impl.editDistance === editDistance;

/** 답이 갈리는 자리가 하나라도 있어야 「깨진다」가 참이다. */
function assertBreaks(impl: Impl, gaps: number[]): void {
  if (neutral(impl)) return;
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「깨진다」가 거짓이다",
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
    const bare = editDistance(c.s, c.t);
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

/** 편집 목록을 본문 표의 줄로 — 그대로 둔 글자는 편집이 아니라 뺀다. */
function editRows(s: string, script: readonly Stepped[]): string[][] {
  return applyScript(s, script)
    .filter((a: Applied) => a.step.move !== "그대로")
    .map((a, k) => [String(k + 1), editText(a), q(a.before), q(a.after)]);
}

/* ────────────────────────── 블록 ────────────────────────── */

/** `concept` — "horse" 를 "ros" 로 바꾸는 편집 목록. */
function conceptEdits(): string {
  const script = backtrack(S, T);
  const rows = editRows(S, script);
  const made = scriptResult(S, script);
  if (made !== T) throw new Error(`편집 목록이 ${q(T)} 를 만들지 못했다`);
  const bfs = byBreadthFirst(S, T).answer;
  const ans = editDistance(S, T);
  if (bfs !== ans || rows.length !== ans) {
    throw new Error("편집 수 · 한 번씩 편집해 찾은 수 · 정본의 답이 다르다");
  }
  return withNote(
    md(["번째", "편집", "편집 전", "편집 후"], rows, [0]),
    `편집은 모두 ${rows.length} 번입니다. 편집을 한 번씩 해 보며 만들 수 있는 문자열을 전부 만들어 보면 ${bfs - 1} 번 안에는 ${q(T)}${이가(String(bfs - 1))} 나오지 않고, 정본이 editDistance(${q(S)}, ${q(T)}) 로 낸 값도 ${ans} 입니다.`,
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

/** `deep.origin` ② — 한 번씩 편집해 찾아가는 방법이 몇 개의 문자열을 만드는가. */
function originBreadthFirst(): string {
  const got = byBreadthFirst(S, T);
  assertSame(S, T, got.answer);
  let running = 0;
  const rows = got.perDepth.map((count, k) => {
    running += count;
    return [String(k + 1), comma(count), comma(running)];
  });
  const step = BigInt(oneEditCount(LIMIT, 26));
  return [
    table(["편집 횟수", "새로 만난 문자열 수", "누적"], rows, []),
    "",
    `└ ${got.answer} 번째에 ${q(T)}${이가(T.at(-1) ?? "")} 나온다`,
    "",
    `과제 규모 n = m = ${comma(LIMIT)} · 글자 종류 26 이면`,
    plain(
      [
        ["  편집 한 번으로 만드는 후보 수(겹침 포함)", comma(step)],
        [
          `  답이 ${comma(LIMIT)} 일 때 확인할 문자열 수의 상한`,
          `${comma(digits(step ** BigInt(LIMIT)))} 자리 수`,
        ],
      ],
      [0],
    ),
    "  └ 편집 한 번마다 가짓수가 그만큼 곱해지므로 답이 곧 지수가 된다",
  ].join("\n");
}

/** `deep.origin` ⑤ — 자리마다 비교하는 후보가 어디서 어긋나는가. */
function originSlot(): string {
  const cases = [
    WALK_CASE,
    NAMED(...SLOT_CASE),
    NAMED("flaw", "lawn"),
    NAMED("ab", "ba"),
    NAMED("horse", "house"),
  ];
  const { rows } = contrast(cases, bySlot);
  const [ss, st] = SLOT_CASE;
  const slotLine = [...ss].map((ch, k) => `${ch}-${st[k]}`).join("  ");
  const cut = ss.slice(1);
  const back = cut + (st.at(-1) as string);
  if (back !== st) throw new Error("앞을 지우고 끝에 넣은 결과가 t 가 아니다");
  return [
    table(CONTRAST_HEAD("자리마다 비교한 값"), rows, [0, 3]),
    "",
    `${pairName(ss, st)} 에서 두 방식이 갈리는 자리`,
    plain(
      [
        ["  자리마다 비교한다", slotLine, `다른 자리 ${bySlot(ss, st)}`],
        [
          "  앞 글자 하나를 지운다",
          `${q(cut)} 와 ${q(st)}`,
          "뒤가 한 칸씩 당겨진다",
        ],
        [
          "  끝에 글자 하나를 넣는다",
          `${q(back)} 와 ${q(st)}`,
          `편집 ${editDistance(ss, st)} 번에 같아진다`,
        ],
      ],
      [0, 1, 2],
    ),
  ].join("\n");
}

/** `deep.origin` ③④ — 마지막 편집으로 줄이는 재귀를 기억 없이 부를 때와 칸에 적어 둘 때. */
function originRecursion(): string {
  const pairs: [string, string][] = [
    [S, T],
    [S, "vwx"],
    ["abcdefgh", "ijklmnop"],
  ];
  const rows = pairs.map(([s, t]) => {
    const r = byPlainRecursion(s, t);
    assertSame(s, t, r.answer);
    return [
      pairName(s, t),
      `${s.length} x ${t.length}`,
      comma(r.calls),
      comma(r.perState.size),
      comma((s.length + 1) * (t.length + 1)),
    ];
  });
  const near = byPlainRecursion(S, T).calls;
  const far = byPlainRecursion(S, "vwx").calls;
  // 점화식으로 센 호출 수가 실제로 부른 횟수와 같은지 작은 규모에서 먼저 맞춘다.
  for (let k = 1; k <= 5; k++) {
    const walked = byPlainRecursion("a".repeat(k), "b".repeat(k)).calls;
    if (BigInt(walked) !== callsWithoutCommon(k)) {
      throw new Error(`호출 수 점화식이 실측과 다르다 — k=${k}`);
    }
  }
  const big = callsWithoutCommon(LIMIT);
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
    "",
    `과제 규모 n = m = ${comma(LIMIT)} 이고 공통 글자가 없으면`,
    plain(
      [
        ["  기억 없이 부르는 횟수", `${comma(digits(big))} 자리 수`],
        ["  DP 테이블 칸", comma((LIMIT + 1) * (LIMIT + 1))],
      ],
      [0],
    ),
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

/** `deep.build` 1단계 — 테두리의 칸이 정의대로 센 값과 같은가. */
function buildBorder(): string {
  const tr = trace(S, T);
  const picks: [number, number][] = [
    [0, 0],
    [3, 0],
    [S.length, 0],
    [0, 2],
    [0, T.length],
  ];
  const job = (i: number, j: number): string =>
    i === 0 && j === 0
      ? "할 일이 없다"
      : j === 0
        ? `${i} 글자를 지운다`
        : `${j} 글자를 넣는다`;
  const rows = picks.map(([i, j]) => [
    cellName([i, j]),
    q(S.slice(0, i)),
    q(T.slice(0, j)),
    job(i, j),
    String(tr.init[i]?.[j]),
  ]);
  let total = 0;
  let same = 0;
  tr.init.forEach((row, i) => {
    row.forEach((v, j) => {
      if (i !== 0 && j !== 0) return;
      total++;
      if (v === byMeeting(S.slice(0, i), T.slice(0, j))) same++;
    });
  });
  return withNote(
    md(["칸", "s 의 앞부분", "t 의 앞부분", "하는 일", "값"], rows, [4]),
    `테두리 ${total} 칸 가운데 ${same} 칸에서, 편집을 한 번씩 해 보며 센 최소 횟수가 적어 둔 값과 같습니다.`,
  );
}

/** `deep.build` 1단계 — dp[3][2] 가 무엇을 뜻하는가. */
function buildReadOne(): string {
  const i = 3;
  const j = 2;
  const x = S.slice(0, i);
  const y = T.slice(0, j);
  const script = backtrack(x, y);
  const rows = editRows(x, script);
  if (scriptResult(x, script) !== y) {
    throw new Error("편집 목록이 t 의 앞부분을 만들지 못했다");
  }
  const cell = trace(S, T).rows[i]?.[j] as number;
  const bfs = byBreadthFirst(x, y).answer;
  if (cell !== bfs || rows.length !== cell) {
    throw new Error("dp[3][2] 가 정의대로 센 값과 다르다");
  }
  return withNote(
    md(["번째", "편집", "편집 전", "편집 후"], rows, [0]),
    `${q(x)} 를 ${q(y)} 로 바꾸는 편집은 이 ${rows.length} 번이고, 편집을 한 번씩 해 보며 찾아가도 ${bfs} 번보다 적게는 안 됩니다. DP 테이블의 dp[${i}][${j}] 도 ${cell} 입니다.`,
  );
}

/** 칸 하나가 읽은 값 — 본문 표가 쓰는 한 줄. */
function readText(c: Cell): string {
  return c.branch === "same"
    ? `dp[${c.i - 1}][${c.j - 1}] = ${c.diag}`
    : `min(${c.diag}, ${c.up}, ${c.left}) + 1`;
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
    c.best.length > 0 ? c.best.map((p) => PICK_NAME[p]).join(" · ") : "—",
    String(c.value),
  ]);
  const reads = cells.flatMap((c) => c.reads.map((at) => ({ at, by: c.j })));
  const up = reads.filter(({ at: [r] }) => r === i - 1).length;
  const same = reads.filter(({ at: [r] }) => r === i);
  // 같은 줄에서 읽은 칸이 모두 읽은 칸보다 왼쪽인가 — 아니면 아직 안 정한 칸을 읽은 것이다.
  if (same.some(({ at: [, k], by }) => k >= by)) {
    throw new Error("같은 줄에서 아직 안 정한 칸을 읽었다");
  }
  const border = reads.filter(({ at: [r, k] }) => r === 0 || k === 0).length;
  return withNote(
    md(
      ["j", "두 글자", "갈래", "읽은 값", "가장 작은 후보", `dp[${i}][j]`],
      rows,
      [0, 5],
    ),
    `이 줄에서 읽은 칸 ${reads.length} 개 가운데 ${up} 개가 윗 줄 i=${i - 1} 이고, 나머지 ${same.length} 개는 같은 줄의 왼쪽 칸입니다. 읽은 칸 가운데 ${border} 개는 테두리입니다.`,
  );
}

/** `deep.build` 2단계 — 두 글자가 같은 칸에서 세 후보. */
function buildSameBound(): string {
  const cells = trace(S, T).cells.filter((c) => c.branch === "same");
  const rows = cells.map((c) => [
    `dp[${c.i}][${c.j}]`,
    `'${c.a}' · '${c.b}'`,
    String(c.diag),
    String(c.up + 1),
    String(c.left + 1),
  ]);
  const ok = cells.filter((c) => c.diag <= c.up + 1 && c.diag <= c.left + 1);
  return withNote(
    md(["칸", "두 글자", "왼쪽 위", "위 + 1", "왼쪽 + 1"], rows, [2, 3, 4]),
    `두 글자가 같은 칸 ${cells.length} 개 가운데 ${ok.length} 개에서 왼쪽 위가 위 + 1 과 왼쪽 + 1 보다 크지 않습니다.`,
  );
}

/** `deep.build` 3단계 — 마지막 줄의 칸이 t 의 앞부분마다의 답이다. */
function buildAnswer(): string {
  const tr = trace(S, T);
  const last = tr.rows[S.length] as readonly number[];
  let same = 0;
  const rows = last.map((v, j) => {
    const call = editDistance(S, T.slice(0, j));
    if (call === v) same++;
    return [String(j), q(T.slice(0, j)), String(v), String(call)];
  });
  return withNote(
    md(
      [
        "j",
        "t 의 앞 j 글자",
        `dp[${S.length}][j]`,
        `editDistance(${q(S)}, t 의 앞 j 글자)`,
      ],
      rows,
      [0, 2, 3],
    ),
    `${last.length} 열 가운데 ${same} 열에서 두 값이 같습니다. 정본이 돌려주는 것은 오른쪽 끝 dp[${S.length}][${T.length}] = ${tr.result} 하나입니다.`,
  );
}

const MOVE_WAY: Record<Stepped["move"], string> = {
  그대로: "왼쪽 위로",
  교체: "왼쪽 위로",
  삭제: "위로",
  삽입: "왼쪽으로",
};

/** `deep.build` 3단계 — 오른쪽 아래에서 거슬러 간 길. */
function buildTraceBackPath(): string {
  const tr = trace(S, T);
  const walk = [...backtrack(S, T)].reverse();
  let sum = 0;
  const rows = walk.map((x, k) => {
    sum += x.cost;
    return [
      String(k + 1),
      `${cellName(x.cell)} = ${tr.rows[x.cell[0]]?.[x.cell[1]]}`,
      `${MOVE_WAY[x.move]} → ${cellName(x.from)}`,
      `${x.move} ${x.letter}`,
      String(x.cost),
      String(sum),
    ];
  });
  const made = scriptResult(S, backtrack(S, T));
  if (made !== T) throw new Error("거슬러 찾은 편집이 t 를 만들지 못했다");
  return withNote(
    md(
      ["걸음", "선 칸", "가는 쪽", "편집", "비용", "지나온 비용"],
      rows,
      [0, 4, 5],
    ),
    `테두리의 dp[0][0] 에 이르기까지 ${walk.length} 걸음이고, 비용 합 ${sum}${이가(String(sum))} dp[${S.length}][${T.length}] = ${tr.result}${과와(String(tr.result))} 같습니다. 이 편집을 ${q(S)} 에 앞에서부터 적용하면 ${q(made)} 가 됩니다.`,
  );
}

/** `deep.walk` 도입 — 전개 입력과 끝에 나와야 할 값. */
function walkInput(): string {
  const ans = editDistance(S, T);
  return [
    `const s = ${q(S)};`,
    `const t = ${q(T)};`,
    `// 이 절이 끝나면 ${ans}${이가(String(ans))} 나와야 한다`,
  ].join("\n");
}

/** `deep.walk` 도입 — 이 입력이 어느 갈래를 실행하는가. */
function walkBranches(): string {
  const cells = trace(S, T).cells;
  const at = (c: Cell) => `(${c.i}, ${c.j})`;
  const only = (p: "sub" | "del" | "ins") =>
    cells
      .filter((c) => c.best.length === 1 && c.best[0] === p)
      .map(at)
      .join(" ");
  const same = cells
    .filter((c) => c.branch === "same")
    .map(at)
    .join(" ");
  return plain(
    [
      ["두 글자가 같은 칸", same, "④"],
      ["교체가 혼자 가장 작은 칸", only("sub"), "⑤ 의 왼쪽 위"],
      ["삭제가 혼자 가장 작은 칸", only("del"), "⑤ 의 위"],
      ["삽입이 혼자 가장 작은 칸", only("ins"), "⑤ 의 왼쪽"],
    ],
    [0, 1, 2],
  );
}

/** DP 테이블 한 장을 글자로 — 줄 머리는 i 와 s 의 글자, 열 머리는 j 와 t 의 글자. */
function gridText(
  s: string,
  t: string,
  rows: readonly (readonly (number | string)[])[],
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

/** `deep.walk` 1 — 테두리를 적은 직후 · 한쪽이 빈 입력. */
function walkInit(): string {
  const tr = trace(S, T);
  const edge = (s: string, t: string) => {
    const e = trace(s, t);
    return `${pad(`s = ${q(s)}, t = ${q(t)}`, 22)}→  ${e.init.length} 줄 × ${e.init[0]?.length} 칸, 칸을 ${e.cells.length} 개 정하고 dp[${s.length}][${t.length}] = ${e.result} 반환`;
  };
  const shown = tr.init.map((row, i) =>
    row.map((v, j) => (i === 0 || j === 0 ? v : "·")),
  );
  return [
    gridText(S, T, shown),
    "  └ · 은 fill(0) 이 둔 0 이다. 아직 안 정한 칸이라 값에 뜻이 없다",
    "",
    edge("", "abc"),
    edge("abc", ""),
    edge("", ""),
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

/** `deep.walk` 3 — 앞 두 줄만 실행한 결과. */
function walkTwoRows(): string {
  const tr = trace(S, T);
  const rows: string[][] = [];
  for (let i = 1; i <= 2; i++) {
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
    `③ j <= m 은 j = 1 … ${T.length} 에서 참이고 j = ${T.length + 1} 에서 처음 거짓이 되어 줄이 끝난다`,
  ].join("\n");
}

/** `deep.walk.pause` — 위 칸을 삽입으로 읽으면 편집 목록이 어떻게 되는가. */
function pauseDirection(): string {
  const right = backtrack(S, T);
  const wrong = misread(S, T);
  const made = scriptResult(S, right);
  const broken = scriptResult(S, wrong);
  if (made !== T) throw new Error(`거슬러 찾은 목록이 ${q(T)} 를 못 만들었다`);
  if (broken === T) throw new Error("뒤바꿔 읽은 목록도 t 를 만들었다");
  const rows = right.map((step, k) => [
    cellName(step.cell),
    `${step.move} ${step.letter}`,
    `${(wrong[k] as Stepped).move} ${(wrong[k] as Stepped).letter}`,
    String(step.cost),
  ]);
  const inserted = wrong.filter(
    (x, k) => x.move === "삽입" && right[k]?.move === "삭제",
  ).length;
  return [
    table(["칸", "옳게 읽으면", "뒤바꿔 읽으면", "비용"], rows, [0, 1, 2]),
    "",
    plain(
      [
        ["옳게 읽은 목록을 적용한 결과", q(made), `길이 ${made.length}`],
        ["뒤바꿔 읽은 목록을 적용한 결과", q(broken), `길이 ${broken.length}`],
      ],
      [0, 1, 2],
    ),
    `└ 뒤바꿔 읽으면 지울 글자 ${inserted} 개를 지우지 않고 오히려 ${inserted} 개를 넣어, 길이가 ${S.length} + ${broken.length - S.length} = ${broken.length}${이가(String(broken.length))} 된다`,
  ].join("\n");
}

/** `deep.walk.pause` — 교체 후보를 빼면 답이 어떻게 되는가. */
function pauseNoSub(): string {
  const cases = [
    WALK_CASE,
    NAMED("a", "b"),
    NAMED("kitten", "sitting"),
    NAMED("abcd", "bcda"),
    NAMED("flaw", "lawn"),
  ];
  const rows: string[][] = [];
  const gaps: number[] = [];
  let matched = 0;
  for (const c of cases) {
    const bare = editDistance(c.s, c.t);
    const got = withoutSub.editDistance(c.s, c.t);
    const byLcs = c.s.length + c.t.length - 2 * lcsLength(c.s, c.t);
    if (got === byLcs) matched++;
    gaps.push(bare === got ? 0 : 1);
    rows.push([
      c.name,
      String(bare),
      String(got),
      String(byLcs),
      bare === got ? "같다" : "틀리다",
    ]);
  }
  assertBreaks(withoutSub, gaps);
  if (!neutral(withoutSub) && matched !== cases.length) {
    throw new Error("교체를 뺀 답이 n + m - 2 x LCS 와 다른 입력이 있다");
  }
  return [
    table(
      ["입력", "정본이 낸 답", "교체를 뺀 답", "n + m - 2 x LCS", "판정"],
      rows,
      [0, 4],
    ),
    "",
    `└ 교체를 뺀 답이 ${cases.length} 줄 가운데 ${matched} 줄에서 n + m - 2 x LCS 와 같다`,
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
        "빈 접두어 → ① i · ② j 를 적는다",
        "—",
        `${w.length} 칸`,
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
      same
        ? `왼쪽 위 ${c.diag}`
        : `교체 ${c.diag} · 삭제 ${c.up} · 삽입 ${c.left}`,
      String(c.value),
    ];
  });
  const nSame = tr.cells.filter((c) => c.branch === "same").length;
  const nDiff = tr.cells.length - nSame;
  return withNote(
    md(["단계", "칸", "두 글자", "조건 판정", "읽은 값", "정한 값"], rows, [5]),
    `④ 가 ${nSame} 칸, ⑤ 가 ${nDiff} 칸이고, 반환값은 ${tr.result} 입니다.`,
  );
}

/** `deep.walk.pause` — 세 비용이 같지 않으면 무엇이 달라지는가. */
function pauseCost(): string {
  const pairs: [string, string][] = [
    ["ab", "abc"],
    ["abc", "ab"],
    [S, T],
    [T, S],
  ];
  const one = { sub: 1, del: 1, ins: 1 };
  const git = { sub: 2, del: 3, ins: 1 };
  const rows = pairs.map(([s, t]) => {
    const a = weighted(s, t, one);
    assertSame(s, t, a);
    return [`${q(s)} -> ${q(t)}`, String(a), String(weighted(s, t, git))];
  });
  const fw = weighted("abc", "ab", git);
  const bw = weighted("ab", "abc", git);
  return [
    table(
      ["바꾸는 방향", "비용이 셋 다 1", "교체 2 · 삭제 3 · 삽입 1"],
      rows,
      [0],
    ),
    "",
    `└ 가운데 열은 방향을 바꿔도 값이 같고, 오른쪽 열은 "abc" -> "ab" 가 ${fw}, "ab" -> "abc" 가 ${bw} 로 갈린다`,
  ].join("\n");
}

/** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
function finalRun(): string {
  const inputs: [string, string][] = [
    [S, T],
    ["intention", "execution"],
    ["kitten", "sitting"],
    ["", "abc"],
    ["abc", ""],
    ["", ""],
  ];
  const calls = inputs.map(([s, t]) => `editDistance(${q(s)}, ${q(t)})`);
  const w = Math.max(...calls.map((c) => c.length));
  return calls
    .map((c, k) => {
      const [s, t] = inputs[k] as [string, string];
      return `${pad(c, w)}  →  ${editDistance(s, t)}`;
    })
    .join("\n");
}

/** `related` — 고른 경로가 격자 위의 최단 경로다. */
function relatedPath(): string {
  const script = backtrack(S, T);
  const tr = trace(S, T);
  let sum = 0;
  let same = 0;
  const rows = script.map((x) => {
    sum += x.cost;
    const v = tr.rows[x.cell[0]]?.[x.cell[1]] as number;
    if (v === sum) same++;
    const way =
      x.move === "삽입" ? "오른쪽" : x.move === "삭제" ? "아래" : "대각선";
    return [
      `(${x.from[0]}, ${x.from[1]}) -> (${x.cell[0]}, ${x.cell[1]})`,
      way,
      `${x.move} ${x.letter}`,
      String(x.cost),
      String(sum),
      String(v),
    ];
  });
  return [
    table(
      ["걸음", "방향", "편집", "비용", "누적", "그 칸의 값"],
      rows,
      [0, 1, 2],
    ),
    "",
    `└ 누적과 칸의 값이 ${rows.length} 걸음 가운데 ${same} 걸음에서 같다. 경로의 비용 합 ${sum}${이가(String(sum))} 오른쪽 아래 칸의 값이다`,
  ].join("\n");
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

const ALT_MINE = "DP 테이블 채우기";
const ALT_OTHER = "띠 계산";

/** `purpose.alt` — 두 설계의 값을 정한 칸. */
function altBench(): string {
  const mine = altCases[ALT_MINE]?.() as Record<string, number>;
  const other = altCases[ALT_OTHER]?.() as Record<string, number>;
  const rows: string[][] = [];
  for (const c of [1, 2, 4, 8, 16, 32, 64, 128]) {
    const tab = mine[`바꾼 글자 ${c} · 값을 정한 칸`] as number;
    const band = other[`바꾼 글자 ${c} · 값을 정한 칸`] as number;
    const ans = mine[`바꾼 글자 ${c} · 답`] as number;
    const mineWins = tab <= band;
    const ratio = mineWins ? (band / tab).toFixed(1) : (tab / band).toFixed(1);
    rows.push([
      String(c),
      String(ans),
      mineWins ? `**${comma(tab)}**` : comma(tab),
      mineWins ? comma(band) : `**${comma(band)}**`,
      `${mineWins ? ALT_MINE : ALT_OTHER} 쪽이 ${ratio} 배 적다`,
    ]);
  }
  const walkTab = mine["전개 입력 · 값을 정한 칸"] as number;
  const walkBand = other["전개 입력 · 값을 정한 칸"] as number;
  return withNote(
    md(
      ["바꾼 글자 수", "답", ALT_MINE, ALT_OTHER, "적은 쪽"],
      rows,
      [0, 1, 2, 3],
    ),
    `${ALT_MINE}는 모든 줄에서 ${comma(mine["바꾼 글자 1 · 값을 정한 칸"] as number)} 칸입니다. 전개 입력 ${pairName(S, T)} 에서는 ${ALT_MINE} ${walkTab} 칸, ${ALT_OTHER} ${walkBand} 칸입니다.`,
  );
}

/** `purpose.alt` — 우열이 뒤집히는 자리. */
function altFlip(): string {
  const mine = altCases[ALT_MINE]?.() as Record<string, number>;
  const other = altCases[ALT_OTHER]?.() as Record<string, number>;
  const flip = flipPoint();
  // 뒤집히기 직전의 문턱과 그다음 문턱 — 문턱은 1 부터 두 배씩 늘어난다.
  let lo = 1;
  while (lo * 2 < flip) lo *= 2;
  const hi = lo * 2;
  const after = other["뒤집히는 자리 · 값을 정한 칸"] as number;
  const before = other[`바꾼 글자 ${lo} · 값을 정한 칸`];
  if (before === undefined) throw new Error(`바꾼 글자 ${lo} 의 실측이 없다`);
  const tab = other["뒤집히는 자리 · DP 테이블의 값을 정한 칸"] as number;
  if (tab !== (mine["바꾼 글자 1 · 값을 정한 칸"] as number)) {
    throw new Error("DP 테이블 채우기의 칸 수가 입력마다 다르다");
  }
  return plain(
    [
      [ALT_MINE, `(${ALT_N}+1)(${ALT_N}+1) = ${comma(tab)}`, "답을 안 본다"],
      [
        ALT_OTHER,
        "문턱을 1 · 2 · 4 · … 로 늘린다",
        `답이 ${lo}${josa(String(lo), "이면", "면")} ${lo} 에서 멈추고, ${flip}${josa(String(flip), "이면", "면")} ${hi} 까지 간다`,
      ],
      [
        "뒤집히는 답",
        String(flip),
        `${comma(before)} 에서 ${comma(after)}${으로(comma(after))} 뛰는 자리다`,
      ],
    ],
    [0, 1, 2],
  );
}

/** `purpose.alt` — 내주는 것과 얻는 것. */
function altTrade(): string {
  const mine = altCases[ALT_MINE]?.() as Record<string, number>;
  const other = altCases[ALT_OTHER]?.() as Record<string, number>;
  const small =
    (mine["바꾼 글자 1 · 값을 정한 칸"] as number) /
    (other["바꾼 글자 1 · 값을 정한 칸"] as number);
  return plain(
    [
      [
        "내주는 것",
        "추가 칸",
        `${comma(mine["추가 칸"] as number)} 대 ${comma(other["추가 칸"] as number)}. DP 테이블을 통째로 들고 있다`,
      ],
      [
        "내주는 것",
        "작은 답",
        `답이 1 이면 채우는 칸이 ${small.toFixed(1)} 배 많다`,
      ],
      [
        "얻는 것",
        "큰 답",
        `답이 ${mine["바꾼 글자 128 · 답"]} 이면 ${comma(other["바꾼 글자 128 · 값을 정한 칸"] as number)} 대 ${comma(mine["바꾼 글자 128 · 값을 정한 칸"] as number)} 로 이쪽이 적다`,
      ],
      [
        "얻는 것",
        "한 번에 끝남",
        "문턱을 몰라도 되고 같은 칸을 두 번 채우지 않는다",
      ],
      [
        "얻는 것",
        "편집 목록",
        "DP 테이블이 남아 있어 편집 목록을 거슬러 찾을 수 있다",
      ],
    ],
    [0, 1, 2],
  );
}

/** `deep.math` ② — 정의를 작은 값에 넣어 확인한다. */
function mathCheck(): string {
  const s = "ho";
  const t = "or";
  const rowsDp = trace(s, t).rows;
  const rows: string[][] = [];
  let same = 0;
  for (let i = 0; i <= s.length; i++) {
    for (let j = 0; j <= t.length; j++) {
      const x = s.slice(0, i);
      const y = t.slice(0, j);
      const got = byBreadthFirst(x, y).answer;
      const v = rowsDp[i]?.[j] as number;
      if (got === v) same++;
      rows.push([String(i), String(j), q(x), q(y), String(got), String(v)]);
    }
  }
  return [
    table(
      [
        "i",
        "j",
        "s 의 앞 i 글자",
        "t 의 앞 j 글자",
        "한 번씩 편집해 센 최소 횟수",
        "dp[i][j]",
      ],
      rows,
      [2, 3],
    ),
    "",
    `└ 오른쪽 두 열이 ${rows.length} 줄 가운데 ${same} 줄에서 같다`,
  ].join("\n");
}

/** `deep.math` — 점화식 P 를 작은 값에 넣은 값. */
function mathPSmall(): string {
  const pairs: [number, number][] = [
    [1, 1],
    [1, 2],
    [2, 2],
  ];
  const rows = pairs.map(([i, j]) => {
    const a = paths(i - 1, j);
    const b = paths(i, j - 1);
    const c = paths(i - 1, j - 1);
    const v = paths(i, j);
    if (a + b + c !== v) throw new Error("점화식이 경로 수와 다르다");
    return [
      `P(${i},${j})`,
      `P(${i - 1},${j}) + P(${i},${j - 1}) + P(${i - 1},${j - 1})`,
      `= ${a} + ${b} + ${c}`,
      `= ${v}`,
    ];
  });
  return plain(rows, [0, 1, 2, 3]);
}

/** `deep.math` — i = j = 2 를 대각선 걸음 수로 갈라 센 항. */
function mathPTerms(): string {
  const i = 2;
  const j = 2;
  const rows: string[][] = [];
  let sum = 0n;
  for (let p = 0; p <= Math.min(i, j); p++) {
    const v = term(i, j, p);
    sum += v;
    rows.push([
      `p = ${p}`,
      `대각선 ${p} 번 · 아래 ${i - p} 번 · 오른쪽 ${j - p} 번`,
      `${i + j - p}! / (${p}! ${i - p}! ${j - p}!)`,
      `= ${v}`,
    ]);
  }
  if (sum !== paths(i, j)) throw new Error("항의 합이 점화식과 다르다");
  rows.push(["합", "", "", `= ${sum}`]);
  return [
    plain(rows, [0, 1, 2, 3]),
    `└ 점화식으로 센 P(${i},${j}) 와 같다`,
  ].join("\n");
}

/** `deep.math` ③④ — 경로 수의 닫힌 형태를 실측과 대조하고 과제 규모를 넣는다. */
function mathPathCount(): string {
  const rows = [1, 2, 3, 4, 5, 6].map((k) => {
    const walked = paths(k, k);
    const closed = pathsClosed(k, k);
    if (walked !== closed) {
      throw new Error(`닫힌 형태가 실측과 다르다 — i=j=${k}`);
    }
    return [String(k), comma(walked), comma(closed)];
  });
  const big = pathsClosed(LIMIT, LIMIT);
  return [
    table(
      ["i = j", "경로 수(점화식)", "sum_p (i+j-p)! / (p! (i-p)! (j-p)!)"],
      rows,
      [],
    ),
    "",
    `과제 규모 i = j = ${comma(LIMIT)} 을 두 식에 넣으면`,
    plain(
      [
        ["  경로 수", `${comma(digits(big))} 자리 수`],
        ["  (i+1)(j+1)", comma((LIMIT + 1) * (LIMIT + 1))],
      ],
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
    const def = row.map((_, j) => byMeeting(S.slice(0, i), T.slice(0, j)));
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
    ["abc", "abc"],
    ["abc", "def"],
  ];
  let ok = 0;
  const rows = inputs.map(([s, t]) => {
    const e = trace(s, t);
    const same = e.cells.filter((c) => c.branch === "same").length;
    const def = byMeeting(s, t);
    if (def === e.result) ok++;
    return [
      pairName(s, t),
      `${e.init.length} × ${e.init[0]?.length}`,
      String(same),
      String(e.cells.length - same),
      String(e.result),
      String(def),
    ];
  });
  return withNote(
    md(
      [
        "입력",
        "줄 × 칸",
        "같은 글자 칸",
        "다른 글자 칸",
        "반환",
        "정의대로 센 값",
      ],
      rows,
      [2, 3, 4, 5],
    ),
    `${inputs.length} 입력 가운데 ${ok} 입력에서 반환값이 정의대로 센 값과 같습니다.`,
  );
}

/** `invariant` ③ — 첫 열을 0 으로 두면 무엇이 나오는가. */
function mutantFirstColumn(): string {
  const cases = [
    WALK_CASE,
    NAMED("abc", ""),
    NAMED("", "abc"),
    NAMED("kitten", "sitting"),
    NAMED("horse", "house"),
  ];
  const run = (s: string, t: string) => zeroFirstColumn.editDistance(s, t);
  const { rows, gaps } = contrast(cases, run);
  assertBreaks(zeroFirstColumn, gaps);
  // 마지막 줄의 j 번째 칸은 t 의 앞 j 글자만 준 호출의 답과 같다 — j 번째 열까지는 t 의 나머지를 안 읽는다.
  const lastRow = (f: (s: string, t: string) => number) =>
    Array.from({ length: T.length + 1 }, (_, j) => f(S, T.slice(0, j))).join(
      " ",
    );
  return [
    table(CONTRAST_HEAD("첫 열을 0 으로 둔 답"), rows, [0, 3]),
    "",
    `전개 입력의 마지막 줄  정본 [${lastRow(editDistance)}]  변이 [${lastRow(run)}]`,
  ].join("\n");
}

/** `perf.derive` — 걸음의 무리마다 몇 번의 문자 비교와 값 비교가 드는가. */
function perfCount(): string {
  const c = byTable(S, T);
  const steps = walkSteps();
  const first = steps[0]?.id ?? "";
  const cellsFrom = steps[1]?.id ?? "";
  const cellsTo = steps.at(-2)?.id ?? "";
  const last = steps.at(-1)?.id ?? "";
  const rows = [
    ["테두리 적기", first, "0", "0", "0"],
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
  return [
    table(["무리", "걸음", "문자 비교", "값 비교", "기본 연산"], rows, [0, 1]),
    "",
    `└ 채운 칸이 ${n} x ${m} = ${n * m} 개이고 그중 두 글자가 같은 칸이 ${c.same} 개다`,
    `└ 두 글자가 다른 칸 ${n * m - c.same} 개에서만 세 후보를 비교하느라 값 비교가 두 번씩 든다. ${n * m - c.same} x 2 = ${c.picks}`,
  ].join("\n");
}

/** `perf.derive` — 총식에 전개 입력과 과제 규모를 넣는다. */
function perfTotal(): string {
  const n = S.length;
  const m = T.length;
  const c = byTable(S, T);
  const formula = n * m + 2 * (n * m - c.same);
  if (formula !== c.chars + c.picks) throw new Error("총식이 실측과 다르다");
  const big = byTable("a".repeat(LIMIT), "b".repeat(LIMIT));
  const bigFormula = LIMIT * LIMIT + 2 * (LIMIT * LIMIT - big.same);
  if (bigFormula !== big.chars + big.picks) {
    throw new Error("총식이 과제 규모의 실측과 다르다");
  }
  return plain(
    [
      [
        `n = ${n} · m = ${m} · 같은 칸 ${c.same}`,
        `${n * m} + 2 x (${n * m} - ${c.same}) = ${formula}`,
        "위 표의 합계와 같다",
      ],
      [
        `n = m = ${comma(LIMIT)} · 같은 칸 ${big.same}`,
        `${comma(LIMIT * LIMIT)} + 2 x ${comma(LIMIT * LIMIT)} = ${comma(bigFormula)}`,
        "공통 글자가 없는 두 문자열의 실측과 같다",
      ],
    ],
    [0, 1, 2],
  );
}

/** `perf.worst` — 입력의 모양에 따라 기본 연산 수가 어디까지 갈리는가. */
function worstShape(): string {
  const n = LIMIT;
  const shapes: [string, string, string][] = [
    ["두 문자열이 같다", "a".repeat(n), "a".repeat(n)],
    [
      "글자가 둘씩 번갈아 나온다",
      Array.from({ length: n }, (_, k) => (k % 2 === 0 ? "a" : "b")).join(""),
      Array.from({ length: n }, (_, k) => (k % 2 === 0 ? "b" : "a")).join(""),
    ],
    [
      "알파벳 26 을 차례로 되풀이한다",
      Array.from({ length: n }, (_, k) =>
        String.fromCharCode(97 + (k % 26)),
      ).join(""),
      Array.from({ length: n }, (_, k) =>
        String.fromCharCode(97 + ((k + 1) % 26)),
      ).join(""),
    ],
    ["공통 글자가 하나도 없다", "a".repeat(n), "b".repeat(n)],
  ];
  const rows = shapes.map(([name, s, t]) => {
    const c = byTable(s, t);
    return [
      name,
      comma(c.same),
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
        "두 글자가 같은 칸",
        "문자 비교",
        "값 비교",
        "기본 연산",
        "답",
      ],
      rows,
      [0],
    ),
    "",
    `└ 문자 비교는 네 줄 다 ${comma(n * n)} 으로 같고, 값 비교만 0 에서 ${comma(2 * n * n)} 까지 갈린다`,
  ].join("\n");
}

/** `perf.worst` — 축마다 최악을 만드는 입력. */
function worstAxes(): string {
  const n = LIMIT;
  const none = byTable("a".repeat(n), "b".repeat(n));
  return withNote(
    md(
      ["최악으로 만들 축", "입력", "값"],
      [
        [
          "기본 연산",
          `n = m = ${comma(n)} · 공통 글자 없음`,
          comma(none.chars + none.picks),
        ],
        [
          "추가 칸",
          `n = m = ${comma(n)} · 글자는 무엇이든`,
          comma((n + 1) * (n + 1)),
        ],
        [
          "답의 크기",
          `공통 글자가 없는 길이 ${comma(n)} 짜리 둘`,
          comma(none.answer),
        ],
      ],
      [2],
    ),
    `공통 글자가 없는 길이 ${comma(n)} 짜리 두 문자열에서 기본 연산과 답이 함께 가장 커지고, 답 ${comma(none.answer)}${은는(comma(none.answer))} 긴 쪽의 길이 ${comma(n)}${과와(comma(n))} 같습니다.`,
  );
}

/** `selfcheck` — i=3 줄과 i=4 줄. */
function selfcheckRow(): string {
  const tr = trace(S, T);
  const rows = [3, 4].map((i) => [
    stepRange(i),
    `i=${i}`,
    `'${S[i - 1]}'`,
    `[${(tr.rows[i] as number[]).join(" ")}]`,
  ]);
  return table(["걸음", "줄", "s 의 글자", "다 채운 줄"], rows, [0, 1, 2, 3]);
}

/** `selfcheck` 답 — i=4 줄의 세 칸이 갈리는 자리. */
function selfcheckMix(): string {
  const cells = trace(S, T).cells.filter((c) => c.i === 4);
  const rows = cells.map((c) => [
    `j=${c.j}`,
    `'${c.a}'${과와(c.a)} '${c.b}'`,
    c.branch === "same" ? "같다" : "다르다",
    c.branch === "same"
      ? `dp[${c.i - 1}][${c.j - 1}] = ${c.diag}${을를(String(c.diag))} 그대로`
      : `min(${c.diag}, ${c.up}, ${c.left}) + 1 = ${c.value}`,
    `윗 줄 ${c.up} → ${c.value}`,
  ]);
  return table(["", "", "", "", ""], rows, [0, 1, 2, 3, 4])
    .split("\n")
    .slice(1)
    .join("\n");
}

export const PROOFS: Record<string, () => string> = {
  "concept-edits": conceptEdits,
  "concept-size": conceptSize,
  "origin-breadth-first": originBreadthFirst,
  "origin-slot": originSlot,
  "origin-recursion": originRecursion,
  "build-size": buildSize,
  "build-border": buildBorder,
  "build-read-one": buildReadOne,
  "build-fill-row": buildFillRow,
  "build-same-bound": buildSameBound,
  "build-answer": buildAnswer,
  "build-trace-back-path": buildTraceBackPath,
  "walk-input": walkInput,
  "walk-branches": walkBranches,
  "walk-init": walkInit,
  "walk-order": walkOrder,
  "walk-two-rows": walkTwoRows,
  "pause-direction": pauseDirection,
  "pause-no-sub": pauseNoSub,
  "walk-trace": walkTrace,
  "pause-cost": pauseCost,
  "final-run": finalRun,
  "related-path": relatedPath,
  "fit-scale": fitScale,
  "alt-bench": altBench,
  "alt-flip": altFlip,
  "alt-trade": altTrade,
  "math-check": mathCheck,
  "math-p-small": mathPSmall,
  "math-p-terms": mathPTerms,
  "math-path-count": mathPathCount,
  "invariant-cells": invariantCells,
  "invariant-edges": invariantEdges,
  "mutant-first-column": mutantFirstColumn,
  "perf-count": perfCount,
  "perf-total": perfTotal,
  "worst-shape": worstShape,
  "worst-axes": worstAxes,
  "selfcheck-row": selfcheckRow,
  "selfcheck-mix": selfcheckMix,
};
