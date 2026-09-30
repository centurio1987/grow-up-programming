/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/string/findAllOccurrences/findAllOccurrences-guide.md
 *
 * 블록은 두 모양이다. 마크다운 표로 된 블록은 표와 그 아래 문장을 함께 내고(본문은 `<!--/proof-->`
 * 로 닫는다), 등폭 글자가 자연스러운 짧은 실행 결과는 펜스 안의 글자를 낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases as altCases } from "./findAllOccurrences-guide.alt.ts";
import { findAllOccurrences } from "./findAllOccurrences-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 한글·가나·한자 구간을 두 칸으로 센다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** 시작 자리의 나열. 비면 「없음」 이다. */
const show = (xs: readonly number[]): string =>
  xs.length === 0 ? "없음" : `[${xs.join(", ")}]`;

/** `show` 뒤에 붙일 조사의 앞말 — 나열의 마지막 수(비면 「없음」). */
const tail = (xs: readonly number[]): string | number =>
  xs.length === 0 ? "없음" : (xs.at(-1) as number);

/** 마크다운 표. 오른쪽 정렬 열은 `r`. */
function md(
  head: readonly string[],
  rows: readonly (readonly string[])[],
  align: readonly ("l" | "r")[],
): string {
  const line = (cells: readonly string[]): string => `| ${cells.join(" | ")} |`;
  return [
    line(head),
    line(align.map((a) => (a === "r" ? "---:" : "---"))),
    ...rows.map(line),
  ].join("\n");
}

/** 열 폭을 값에서 재는 등폭 줄. 펜스 안에 싣는 짧은 결과에만 쓴다. */
function columns(rows: readonly (readonly string[])[]): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const w = Array.from({ length: cols }, (_, c) =>
    Math.max(...rows.map((r) => (c < r.length - 1 ? width(r[c] ?? "") : 0))),
  );
  return rows
    .map((r) =>
      r
        .map((cell, c) =>
          c === r.length - 1 ? cell : padRight(cell, w[c] ?? 0),
        )
        .join("   ")
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts`·`.fig.tsx` 가 같은 것을 쓴다.
 * 세 갈래가 다 실행되고(맞음 · 한 걸음에 두 번 줄임 · 줄일 것이 없음), 시작 자리 셋이 서로 겹친다.
 */
export const WALK_TEXT = "abacabababab";
export const WALK_PATTERN = "abab";

/** 과제 규모의 최댓값. */
const LIMIT = 100_000;

/* ────────────────────────── 계측기 ────────────────────────── */

/** 실패 함수. 정본이 만드는 것과 같은 표다(계측기의 답을 정본의 답과 대조해 확인한다). */
export function failOf(pattern: string): number[] {
  const m = pattern.length;
  const fail = new Array<number>(m).fill(0);
  let k = 0;
  for (let i = 1; i < m; i++) {
    while (k > 0 && pattern[i] !== pattern[k]) k = fail[k - 1] as number;
    if (pattern[i] === pattern[k]) k++;
    fail[i] = k;
  }
  return fail;
}

interface Counted {
  found: number[];
  /** 실패 함수를 만들 때의 글자 비교 횟수. */
  build: number;
  /** 텍스트를 대조할 때의 글자 비교 횟수. */
  scan: number;
}

/** 정본과 같은 절차에 비교 횟수만 덧붙인 것. */
export function counted(text: string, pattern: string): Counted {
  const n = text.length;
  const m = pattern.length;
  const found: number[] = [];
  if (m === 0 || n < m) return { found, build: 0, scan: 0 };
  const fail = new Array<number>(m).fill(0);
  let k = 0;
  let build = 0;
  for (let i = 1; i < m; i++) {
    while (k > 0) {
      build++;
      if (pattern[i] === pattern[k]) break;
      k = fail[k - 1] as number;
    }
    build++;
    if (pattern[i] === pattern[k]) k++;
    fail[i] = k;
  }
  let j = 0;
  let scan = 0;
  for (let i = 0; i < n; i++) {
    while (j > 0) {
      scan++;
      if (text[i] === pattern[j]) break;
      j = fail[j - 1] as number;
    }
    scan++;
    if (text[i] === pattern[j]) j++;
    if (j === m) {
      found.push(i - m + 1);
      j = fail[j - 1] as number;
    }
  }
  return { found, build, scan };
}

/** 시작 자리를 하나씩 다 대조하는 방식. 정의를 그대로 옮긴 것이라 기준이 된다. */
function everyStart(
  text: string,
  pattern: string,
): { found: number[]; cmp: number } {
  const n = text.length;
  const m = pattern.length;
  const found: number[] = [];
  let cmp = 0;
  if (m === 0) return { found, cmp };
  for (let i = 0; i + m <= n; i++) {
    let ok = true;
    for (let j = 0; j < m; j++) {
      cmp++;
      if (text[i + j] !== pattern[j]) {
        ok = false;
        break;
      }
    }
    if (ok) found.push(i);
  }
  return { found, cmp };
}

/** 어긋났을 때 **맞은 길이만큼 시작 자리를 옮기는** 후보. */
export function skipByMatched(text: string, pattern: string): number[] {
  const n = text.length;
  const m = pattern.length;
  const found: number[] = [];
  if (m === 0 || n < m) return found;
  let i = 0;
  while (i + m <= n) {
    let j = 0;
    while (j < m && text[i + j] === pattern[j]) j++;
    if (j === m) {
      found.push(i);
      i += m;
    } else {
      i += Math.max(1, j);
    }
  }
  return found;
}

/** **진 조각 조건을 뺀** 표. 자기 자신도 세면 값이 언제나 `i + 1` 이 된다. */
function failWithoutProper(pattern: string): number[] {
  return Array.from({ length: pattern.length }, (_, i) => i + 1);
}

/** 앞뒤 조각이 **겹치지 않는 것만** 센 표. 헷갈리기 쉬운 모양이다. */
function failNoOverlap(pattern: string): number[] {
  return Array.from({ length: pattern.length }, (_, i) => {
    let best = 0;
    for (let b = 1; 2 * b <= i + 1; b++) {
      if (pattern.slice(0, b) === pattern.slice(i + 1 - b, i + 1)) best = b;
    }
    return best;
  });
}

/**
 * 실패 함수 표를 밖에서 받아 대조하는 절차. 표가 잘못되면 같은 자리에서 몇 번이나 되풀이되는지
 * 세려고 상한을 둔다 — 상한이 없으면 멈추지 않는 표가 있다.
 */
function matchWithTable(
  text: string,
  pattern: string,
  fail: number[],
  cap: number,
): { found: number[]; stalledAt: number; spins: number } {
  const n = text.length;
  const m = pattern.length;
  const found: number[] = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    let spins = 0;
    while (j > 0 && text[i] !== pattern[j]) {
      j = fail[j - 1] as number;
      spins++;
      if (spins >= cap) return { found, stalledAt: i, spins };
    }
    if (text[i] === pattern[j]) j++;
    if (j === m) {
      found.push(i - m + 1);
      j = fail[j - 1] as number;
    }
  }
  return { found, stalledAt: -1, spins: 0 };
}

/** 글자 같음을 바꿔 끼운 두 방식 — 패턴의 `?` 는 아무 글자와 같다. */
const wildEq = (t: string, p: string): boolean => p === "?" || t === p;

function wildByFail(text: string, pattern: string): number[] {
  const m = pattern.length;
  const at = (s: string, i: number): string => s[i] ?? "";
  const fail = new Array<number>(m).fill(0);
  let k = 0;
  for (let i = 1; i < m; i++) {
    while (k > 0 && !wildEq(at(pattern, i), at(pattern, k)))
      k = fail[k - 1] as number;
    if (wildEq(at(pattern, i), at(pattern, k))) k++;
    fail[i] = k;
  }
  const found: number[] = [];
  let j = 0;
  for (let i = 0; i < text.length; i++) {
    while (j > 0 && !wildEq(at(text, i), at(pattern, j)))
      j = fail[j - 1] as number;
    if (wildEq(at(text, i), at(pattern, j))) j++;
    if (j === m) {
      found.push(i - m + 1);
      j = fail[j - 1] as number;
    }
  }
  return found;
}

function wildEveryStart(text: string, pattern: string): number[] {
  const out: number[] = [];
  for (let i = 0; i + pattern.length <= text.length; i++) {
    let ok = true;
    for (let j = 0; j < pattern.length; j++) {
      if (!wildEq(text[i + j] ?? "", pattern[j] ?? "")) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(i);
  }
  return out;
}

/* ────────────────────────── 걸음 기록 ────────────────────────── */

/** 텍스트 자리 하나를 처리한 기록. 정본의 대조 루프를 그대로 따른다. */
export interface ScanStep {
  readonly i: number;
  readonly ch: string;
  /** 들어올 때의 맞은 길이. */
  readonly enter: number;
  /** 줄인 뒤의 값들 — `fail` 을 따라간 차례. */
  readonly chain: readonly number[];
  /** 마지막으로 비교한 패턴 자리. */
  readonly last: number;
  readonly matched: boolean;
  /** 이 걸음의 글자 비교 횟수. */
  readonly cmp: number;
  /** 다 맞아서 적은 시작 자리. */
  readonly hit: number | null;
  /** 나갈 때의 맞은 길이. */
  readonly exit: number;
}

export function scanSteps(text: string, pattern: string): ScanStep[] {
  const fail = failOf(pattern);
  const m = pattern.length;
  const steps: ScanStep[] = [];
  let j = 0;
  for (let i = 0; i < text.length; i++) {
    const enter = j;
    const chain: number[] = [];
    let cmp = 0;
    while (j > 0) {
      cmp++;
      if (text[i] === pattern[j]) break;
      j = fail[j - 1] as number;
      chain.push(j);
    }
    cmp++;
    const last = j;
    const matched = text[i] === pattern[j];
    if (matched) j++;
    let hit: number | null = null;
    if (j === m) {
      hit = i - m + 1;
      j = fail[j - 1] as number;
    }
    steps.push({
      i,
      ch: String(text[i]),
      enter,
      chain,
      last,
      matched,
      cmp,
      hit,
      exit: j,
    });
  }
  assertSame(
    text,
    pattern,
    steps.flatMap((s) => (s.hit === null ? [] : [s.hit])),
  );
  return steps;
}

/** 실패 함수를 채우는 걸음 기록. */
function buildSteps(pattern: string) {
  const fail = failOf(pattern);
  const rows: {
    i: number;
    ch: string;
    enter: number;
    chain: number[];
    matched: boolean;
    value: number;
  }[] = [];
  let k = 0;
  for (let i = 1; i < pattern.length; i++) {
    const enter = k;
    const chain: number[] = [];
    while (k > 0 && pattern[i] !== pattern[k]) {
      k = fail[k - 1] as number;
      chain.push(k);
    }
    const matched = pattern[i] === pattern[k];
    if (matched) k++;
    rows.push({ i, ch: String(pattern[i]), enter, chain, matched, value: k });
  }
  return rows;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  findAllOccurrences(text: string, pattern: string): number[];
}

const REF = new URL("./findAllOccurrences-guide.ref.ts", import.meta.url)
  .pathname;

/** 어긋났을 때 맞은 길이를 **하나씩만** 줄이는 사본. 불변식을 지키던 바로 그 줄이다. */
const stepBackOne = await loadMutant<Impl>(REF, {
  swap: [
    /while \(j > 0 && text\[i\] !== pattern\[j\]\) j = fail\[j - 1\] as number;/,
    "while (j > 0 && text[i] !== pattern[j]) j = j - 1;",
  ],
});

/** 어긋났을 때 맞은 길이를 통째로 버리는 사본. */
const restartAtZero = await loadMutant<Impl>(REF, {
  swap: [
    /while \(j > 0 && text\[i\] !== pattern\[j\]\) j = fail\[j - 1\] as number;/,
    "while (j > 0 && text[i] !== pattern[j]) j = 0;",
  ],
});

/** 패턴 전체가 맞은 뒤 맞은 길이를 `0` 으로 두는 사본. */
const matchResetsToZero = await loadMutant<Impl>(REF, {
  swap: [/^\s+j = fail\[j - 1\] as number;$/, "      j = 0;"],
});

/** 중화 실행이면 변이 모듈의 함수가 정본과 같은 객체다 — 그때는 「답을 바꿨다」 검사를 건너뛴다. */
const neutral = (impl: Impl): boolean =>
  impl.findAllOccurrences === findAllOccurrences;

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  name: string;
  text: string;
  pattern: string;
}

const NAMED = (text: string, pattern: string): Case => ({
  name: `"${text}" / "${pattern}"`,
  text,
  pattern,
});

const WALK_CASE: Case = {
  name: `전개 입력 "${WALK_TEXT}" / "${WALK_PATTERN}"`,
  text: WALK_TEXT,
  pattern: WALK_PATTERN,
};

/** 겹치는 등장을 가르는 목록. */
const OVERLAP_CASES: Case[] = [
  WALK_CASE,
  NAMED("aaaa", "aa"),
  NAMED("abcabc", "abc"),
  NAMED("ababcababab", "abab"),
];

/**
 * 「맞은 길이를 얼마로 줄이는가」를 가르는 목록. 둘째 줄은 0 으로 버리는 후보만, 셋째 줄은 하나씩
 * 줄이는 후보만 어긋나는 자리다. 둘 중 하나만 두면 나머지 후보가 통과해 버린다.
 */
const PULLBACK_CASES: Case[] = [
  WALK_CASE,
  NAMED("aaab", "aab"),
  NAMED("abba", "aba"),
  NAMED("aabaabaaa", "aabaa"),
  NAMED("aaaaa", "aaa"),
];

/** 입력의 모양을 네 가지로 놓고 두 방식의 계수를 나란히 세는 목록. 길이는 열둘로 같다. */
const SHAPE_CASES: [string, string, string][] = [
  ["전개 입력", WALK_TEXT, WALK_PATTERN],
  ["전부 같은 글자", "aaaaaaaaaaaa", "aaab"],
  ["패턴이 되풀이된다", "abababababab", "abab"],
  ["첫 글자부터 어긋난다", "cccccccccccc", "abab"],
];

/** 규모를 열 배씩 키우며 두 방식의 증가를 보는 자리. 패턴 길이는 텍스트의 절반이다. */
const SCALE = [12, 120, 1200, 12000];

function assertBreaks(gaps: number[], impl: Impl): void {
  if (neutral(impl)) return;
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
    );
  }
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 계측이 다른 절차를 잰 것이다. */
function assertSame(
  text: string,
  pattern: string,
  got: readonly number[],
): void {
  const want = findAllOccurrences(text, pattern);
  if (got.join(",") !== want.join(",")) {
    throw new Error(
      `계측기와 정본의 답이 다르다 — 계측 ${show(got)} ≠ 정본 ${show(want)}`,
    );
  }
}

/** 두 방식을 나란히 실행해 사례 표의 줄을 만든다. */
function contrast(
  cases: Case[],
  other: (text: string, pattern: string) => number[],
): { rows: string[][]; gaps: number[] } {
  const rows: string[][] = [];
  const gaps: number[] = [];
  for (const c of cases) {
    const bare = findAllOccurrences(c.text, c.pattern);
    const got = other(c.text, c.pattern);
    const same = bare.join(",") === got.join(",");
    gaps.push(same ? 0 : 1);
    rows.push([c.name, show(bare), show(got), same ? "같다" : "어긋난다"]);
  }
  return { rows, gaps };
}

const repeat = (unit: string, times: number): string => unit.repeat(times);

/** 비교한 두 글자 — 「T[3] = c 와 P[1] = b」. 홀로 선 글자는 글자 이름으로 읽는다(josa). */
const pair = (t: string, ti: number, p: string, pi: number): string =>
  `T[${ti}] = ${t}${과와(t)} P[${pi}] = ${p}`;

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 실패 함수의 값과 그 값이 뜻하는 조각. */
  "concept-fail": () => {
    const p = WALK_PATTERN;
    const fail = failOf(p);
    const rows = [...p].map((_, i) => [
      String(i),
      p.slice(0, i + 1),
      String(fail[i]),
      (fail[i] as number) === 0 ? "없음" : p.slice(0, fail[i] as number),
    ]);
    const i = p.length - 1;
    const b = fail[i] as number;
    return [
      md(
        ["자리 i", "P[0..i]", "fail[i]", "앞부분이자 뒷부분인 가장 긴 진 조각"],
        rows,
        ["r", "l", "r", "l"],
      ),
      "",
      `${p} 의 앞 ${b} 글자와 뒤 ${b} 글자가 둘 다 ${p.slice(0, b)} 라서 fail[${i}]${은는(i)} ${b} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 시작 자리를 다 대조하는 방식의 비용이 패턴 길이에 따라 어떻게 되는가. */
  "naive-cost": () => {
    const n = 12;
    const rows = [2, 3, 4, 6, 9, 11].map((m) => {
      const got = everyStart(repeat("a", n), repeat("a", m));
      return [
        String(m),
        num(n - m + 1),
        num(got.cmp),
        num((n - m + 1) * m),
        num(got.found.length),
      ];
    });
    let bestM = 0;
    let bestCost = 0;
    for (let m = 1; m <= LIMIT; m++) {
      const cost = (LIMIT - m + 1) * m;
      if (cost > bestCost) {
        bestCost = cost;
        bestM = m;
      }
    }
    return [
      md(
        [
          "패턴 길이 m",
          "시작 자리 수",
          "비교 횟수(실측)",
          "(n−m+1)m",
          "찾은 자리 수",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      `텍스트는 a ${n} 개, 패턴은 a m 개입니다. 과제 규모 n = ${num(LIMIT)} 에서 (n−m+1)m 이 가장 커지는 m 을 전수로 찾으면 m = ${num(bestM)} 이고, 그때 비교가 ${num(bestCost)} 번, 초당 1 억 번 기준 ${(bestCost / 100_000_000).toFixed(1)} 초입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 후보마다 처음부터 다시 읽는 칸. */
  "origin-reread": () => {
    const text = "aaaa";
    const pattern = "aab";
    const rows: string[][] = [];
    const seen = new Set<number>();
    let total = 0;
    let again = 0;
    for (let s = 0; s + pattern.length <= text.length; s++) {
      const read: number[] = [];
      let matched = 0;
      for (let j = 0; j < pattern.length; j++) {
        read.push(s + j);
        if (text[s + j] !== pattern[j]) break;
        matched++;
      }
      const repeated = read.filter((c) => seen.has(c));
      for (const c of read) seen.add(c);
      total += read.length;
      again += repeated.length;
      rows.push([
        String(s),
        read.map((c) => `T[${c}]`).join(" "),
        String(matched),
        String(read.length),
        repeated.length === 0
          ? "없음"
          : repeated.map((c) => `T[${c}]`).join(" "),
      ]);
    }
    assertSame(text, pattern, everyStart(text, pattern).found);
    return [
      md(
        [
          "시작 자리",
          "읽은 칸",
          "맞은 글자 수",
          "비교 횟수",
          "앞 자리가 이미 읽은 칸",
        ],
        rows,
        ["r", "l", "r", "r", "l"],
      ),
      "",
      `텍스트 "${text}" 에서 패턴 "${pattern}" 를 찾았습니다. 비교 ${total} 번 가운데 ${again} 번이 이미 읽은 칸을 다시 읽은 것입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리했을 때의 비교 횟수. */
  "cost-two-ways": () => {
    const rows = SHAPE_CASES.map(([name, text, pattern]) => {
      const naive = everyStart(text, pattern);
      const mine = counted(text, pattern);
      assertSame(text, pattern, naive.found);
      assertSame(text, pattern, mine.found);
      return [
        name,
        `"${text}" / "${pattern}"`,
        num(naive.cmp),
        num(mine.build),
        num(mine.scan),
        num(mine.build + mine.scan),
      ];
    });
    const scale = SCALE.map((n) => {
      const text = repeat("a", n);
      const pattern = repeat("a", n / 2);
      const naive = everyStart(text, pattern);
      const mine = counted(text, pattern);
      assertSame(text, pattern, mine.found);
      return { n, naive: naive.cmp, mine: mine.build + mine.scan };
    });
    const ratio = (xs: number[]): string =>
      xs
        .slice(1)
        .map((x, k) => (x / (xs[k] as number)).toFixed(1))
        .join(" · ");
    return [
      md(
        [
          "입력의 모양 (n = 12)",
          "텍스트 / 패턴",
          "전수 대조",
          "실패 함수 만들기",
          "텍스트 대조",
          "실패 함수 방식 합",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r"],
      ),
      "",
      "같은 모양(텍스트가 전부 a · 패턴은 그 절반 길이)에서 규모만 키우면 이렇습니다.",
      "",
      md(
        ["n", "m", "전수 대조", "실패 함수 방식"],
        scale.map((s) => [num(s.n), num(s.n / 2), num(s.naive), num(s.mine)]),
        ["r", "r", "r", "r"],
      ),
      "",
      `n 을 열 배 할 때마다 전수 대조는 ${ratio(scale.map((s) => s.naive))} 배가 되고, 실패 함수 방식은 ${ratio(scale.map((s) => s.mine))} 배가 됩니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 「맞은 길이만큼 시작 자리를 옮긴다」 후보가 어디서 어긋나는가. */
  "restart-candidates": () => {
    const { rows } = contrast(OVERLAP_CASES, skipByMatched);
    const same = rows.filter((r) => r[3] === "같다").map((r) => r[0]);
    return [
      md(["입력", "정본이 낸 답", "맞은 길이만큼 옮긴 답", "판정"], rows, [
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      `네 입력 가운데 답이 같은 것은 ${same.join(" · ")} 하나이고, 그 입력만 등장이 서로 겹치지 않습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 맞은 길이를 얼마로 줄일지 세 후보를 답으로 가른다. */
  "pullback-choice": () => {
    const impls: ((t: string, p: string) => number[])[] = [
      (t, p) => restartAtZero.findAllOccurrences(t, p),
      (t, p) => stepBackOne.findAllOccurrences(t, p),
      (t, p) => findAllOccurrences(t, p),
    ];
    const wrong = [0, 0, 0];
    const rows = PULLBACK_CASES.map((c) => {
      const bare = findAllOccurrences(c.text, c.pattern);
      const cells = impls.map((f, k) => {
        const got = f(c.text, c.pattern);
        if (got.join(",") !== bare.join(","))
          wrong[k] = (wrong[k] as number) + 1;
        return show(got);
      });
      return [c.name, show(bare), ...cells];
    });
    return [
      md(
        [
          "입력",
          "정답",
          "0 으로 버리기",
          "하나씩 줄이기",
          "실패 함수 값으로 줄이기",
        ],
        rows,
        ["l", "l", "l", "l", "l"],
      ),
      "",
      `다섯 입력 가운데 답이 틀린 입력은 0 으로 버리는 후보가 ${wrong[0]} 개, 하나씩 줄이는 후보가 ${wrong[1]} 개, 실패 함수 값으로 줄이는 후보가 ${wrong[2]} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 낯선 개념 (c) — 칸 하나를 읽는 법. */
  "build-read-one": () => {
    const p = WALK_PATTERN;
    const i = p.length - 1;
    const b = failOf(p)[i] as number;
    return columns([
      [`fail[${i}] = ${b}`, ""],
      ["  가리키는 조각", `P[0..${i}] = ${p}`],
      [`  앞 ${b} 글자`, `P[0..${b - 1}] = ${p.slice(0, b)}`],
      [`  뒤 ${b} 글자`, `P[${i - b + 1}..${i}] = ${p.slice(i - b + 1)}`],
      [
        "  뜻",
        `맞은 ${i + 1} 글자의 뒤 ${b} 글자는 그대로 P 의 앞 ${b} 글자다`,
      ],
    ]);
  },

  /** `deep.build` 낯선 개념 (d) — 이웃 칸끼리의 관계와 경계를 따라가는 차례. */
  "build-neighbors": () => {
    const p = "aabaa";
    const fail = failOf(p);
    if (fail.some((v, i) => i > 0 && v > (fail[i - 1] as number) + 1)) {
      throw new Error("fail[i] 가 fail[i−1] + 1 을 넘었다");
    }
    const rows = [...p].map((_, i) => {
      const v = fail[i] as number;
      const prev = i === 0 ? 0 : (fail[i - 1] as number);
      return [
        String(i),
        p.slice(0, i + 1),
        i === 0 ? "—" : String(prev + 1),
        String(v),
        i === 0
          ? "—"
          : v > prev
            ? "1 늘었다"
            : v === prev
              ? "그대로"
              : `${prev - v} 줄었다`,
      ];
    });
    const last = p.length - 1;
    const chain = [fail[last] as number];
    while ((chain.at(-1) as number) > 0) {
      chain.push(fail[(chain.at(-1) as number) - 1] as number);
    }
    const steps = chain
      .map((v, k) =>
        k === 0
          ? `fail[${last}] = ${v}`
          : `fail[${(chain[k - 1] as number) - 1}] = ${v}`,
      )
      .join(" → ");
    return [
      md(["i", "P[0..i]", "fail[i−1] + 1", "fail[i]", "앞 칸에서"], rows, [
        "r",
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `패턴 ${p} 에서 fail[i] 가 fail[i−1] + 1 을 넘는 자리는 없습니다. 자리 ${last} 의 경계를 긴 것부터 모두 얻으려면 ${steps}${으로(chain.at(-1) as number)} 따라갑니다.`,
    ].join("\n");
  },

  /** `deep.build` 낯선 개념 (e) — 앞뒤 조각이 겹치지 않는 것만 센 값과의 대조. */
  "build-no-overlap": () => {
    const p = "aaaa";
    const text = "aaaaa";
    const fail = failOf(p);
    const loose = failNoOverlap(p);
    const rows = [...p].map((_, i) => [
      String(i),
      p.slice(0, i + 1),
      String(fail[i]),
      String(loose[i]),
    ]);
    const good = matchWithTable(text, p, fail, 1000).found;
    const bad = matchWithTable(text, p, loose, 1000).found;
    assertSame(text, p, good);
    return [
      md(["i", "P[0..i]", "실패 함수", "겹치지 않게 센 값"], rows, [
        "r",
        "l",
        "r",
        "r",
      ]),
      "",
      `텍스트 "${text}" 에서 패턴 "${p}" 를 찾으면 실패 함수로는 ${show(good)}, 겹치지 않게 센 값으로는 ${show(bad)}${이가(tail(bad))} 나옵니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 실패 함수를 채우는 걸음별 값. 패턴 둘을 나란히 만든다. */
  "build-fill": () => {
    const table = (p: string): string =>
      md(
        ["i", "P[i]", "들어올 때 k", "줄인 차례", "P[i] 와 P[k]", "fail[i]"],
        buildSteps(p).map((r) => [
          String(r.i),
          r.ch,
          String(r.enter),
          r.chain.length === 0 ? "—" : r.chain.join(" → "),
          r.matched ? "같다" : "다르다",
          String(r.value),
        ]),
        ["r", "l", "r", "l", "l", "r"],
      );
    const shrink = buildSteps("aabaa").find((r) => r.chain.length > 0);
    if (!shrink) throw new Error("aabaa 에서 줄이는 자리가 없다");
    const to = shrink.chain.at(-1) as number;
    return [
      `패턴 ${WALK_PATTERN} 는 이렇습니다. fail[0] 은 늘 0 이라 i = 1 부터 채웁니다.`,
      "",
      table(WALK_PATTERN),
      "",
      "패턴 aabaa 는 이렇습니다.",
      "",
      table("aabaa"),
      "",
      `${WALK_PATTERN} 는 줄이는 자리가 한 번도 없고, aabaa 는 i = ${shrink.i} 에서 k 를 ${shrink.enter} 에서 ${to}${으로(to)} 줄입니다. 채운 표는 ${WALK_PATTERN} 가 [${failOf(WALK_PATTERN).join(", ")}], aabaa 가 [${failOf("aabaa").join(", ")}] 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 쉬운 경우와 여러 번 줄이는 경우. */
  "build-shrink": () => {
    const steps = scanSteps(WALK_TEXT, WALK_PATTERN);
    const hard = steps.find((s) => s.chain.length > 1) as ScanStep;
    const easy = steps[hard.i - 1] as ScanStep;
    const rows: string[][] = [];
    for (const s of [easy, hard]) {
      const seen = [s.enter, ...s.chain];
      for (const [k, pj] of seen.entries()) {
        const same = WALK_TEXT[s.i] === WALK_PATTERN[pj];
        const next = same
          ? `j = ${pj + 1}`
          : pj === 0
            ? "j 는 0 그대로"
            : `j = fail[${pj - 1}] = ${s.chain[k]}`;
        rows.push([
          k === 0 ? String(s.i) : "",
          k === 0 ? String(s.enter) : "",
          pair(s.ch, s.i, String(WALK_PATTERN[pj]), pj),
          same ? "같다" : "다르다",
          next,
        ]);
      }
    }
    return [
      md(
        ["텍스트 자리 i", "들어올 때 j", "비교한 글자", "결과", "다음 j"],
        rows,
        ["r", "r", "l", "l", "l"],
      ),
      "",
      `텍스트 자리 ${hard.i} 에서 비교는 ${hard.cmp} 번이고, i 는 ${hard.i} 에 머문 채 j 만 ${hard.enter} 에서 ${hard.exit}${으로(hard.exit)} 내려갔습니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — 다 맞은 뒤 fail[m−1] 로 이어 가는 자리. */
  "build-continue": () => {
    const steps = scanSteps(WALK_TEXT, WALK_PATTERN);
    const first = steps.findIndex((s) => s.hit !== null);
    const slice = steps.slice(first, first + 3);
    const rows = slice.map((s) => [
      String(s.i),
      String(s.enter),
      pair(s.ch, s.i, String(WALK_PATTERN[s.last]), s.last),
      s.hit === null ? "—" : String(s.hit),
      String(s.exit),
    ]);
    const m = WALK_PATTERN.length;
    const f = failOf(WALK_PATTERN)[m - 1] as number;
    const hits = slice.flatMap((s) => (s.hit === null ? [] : [s.hit]));
    const h0 = hits[0] as number;
    return [
      md(
        [
          "텍스트 자리 i",
          "들어올 때 j",
          "비교한 글자",
          "적은 시작 자리",
          "나갈 때 j",
        ],
        rows,
        ["r", "r", "l", "r", "r"],
      ),
      "",
      `자리 ${h0}${을를(h0)} 적은 뒤 j 가 fail[${m - 1}] = ${f}${으로(f)} 줄어서, 두 글자 뒤에 자리 ${hits[1]} 의 등장이 잡힙니다.`,
    ].join("\n");
  },

  /** `deep.build` 전제 — 글자 같음이 「같다/다르다」 둘로 갈리지 않으면 무엇이 깨지는가. */
  "build-premise-wildcard": () => {
    const rows = [
      ["aaab", "a?b"],
      ["aabb", "a?b"],
      ["abab", "a?b"],
    ].map(([t, p]) => {
      const a = wildByFail(t as string, p as string);
      const b = wildEveryStart(t as string, p as string);
      return [
        `"${t}"`,
        `"${p}"`,
        show(a),
        show(b),
        a.join(",") === b.join(",") ? "같다" : "어긋난다",
      ];
    });
    return [
      md(
        ["텍스트", "패턴", "실패 함수 방식", "시작 자리를 다 대조", "판정"],
        rows,
        ["l", "l", "l", "l", "l"],
      ),
      "",
      "패턴의 ? 는 아무 글자와 같다고 두고, 두 방식에서 글자 같음만 그렇게 바꿨습니다.",
    ].join("\n");
  },

  /** `deep.walk` 도입 — 고정 입력. */
  "walk-input": () => {
    const found = findAllOccurrences(WALK_TEXT, WALK_PATTERN);
    return [
      `const T = "${WALK_TEXT}";`,
      `const P = "${WALK_PATTERN}";`,
      `// 이 절이 끝나면 ${show(found)}${이가(tail(found))} 나와야 한다`,
    ].join("\n");
  },

  /** `deep.walk.step` 1 — ① 이 걸러 내는 입력. */
  "walk-guard": () => {
    const calls: [string, string, string][] = [
      ["abc", "", "m = 0 이라 참"],
      ["ab", "abcd", "n < m 이라 참"],
      [WALK_TEXT, WALK_PATTERN, "둘 다 거짓"],
    ];
    return columns(
      calls.map(([t, p, why]) => [
        `findAllOccurrences("${t}", "${p}")`,
        why,
        `→  ${JSON.stringify(findAllOccurrences(t, p)).replaceAll(",", ", ")}`,
      ]),
    );
  },

  /** `deep.walk.step` 1 — 채운 실패 함수. 계측기가 정본과 같은 답을 내는 것까지 확인한다. */
  "walk-fail-calls": () => {
    const pats = [WALK_PATTERN, "aabaa", "aaab"];
    for (const p of pats)
      assertSame(`${p}${p}`, p, counted(`${p}${p}`, p).found);
    return columns(
      pats.map((p) => [`"${p}"`, `→  fail = [${failOf(p).join(", ")}]`]),
    );
  },

  /** `deep.walk.pause` — 진 조각 조건을 빼면 무엇이 달라지는가. */
  "pause-proper": () => {
    const p = WALK_PATTERN;
    const proper = failOf(p);
    const loose = failWithoutProper(p);
    const rows = [...p].map((ch, i) => [
      String(i),
      ch,
      String(proper[i]),
      String(loose[i]),
    ]);
    const cap = 1000;
    const stuck = matchWithTable(WALK_TEXT, p, loose, cap);
    const good = matchWithTable(WALK_TEXT, p, proper, cap);
    assertSame(WALK_TEXT, p, good.found);
    const j = scanSteps(WALK_TEXT, p)[stuck.stalledAt]?.enter ?? 0;
    return [
      md(["i", "P[i]", "진 조각만 센 값", "자기 자신도 센 값"], rows, [
        "r",
        "l",
        "r",
        "r",
      ]),
      "",
      `전개 입력 "${WALK_TEXT}" 를 진 조각만 센 표로 대조하면 ${show(good.found)}${이가(tail(good.found))} 나옵니다. 자기 자신도 센 표로 대조하면 자리 ${stuck.stalledAt} 에서 j = ${j} 일 때 fail[${j - 1}] = ${loose[j - 1]} 이라 줄여도 j 가 ${j} 그대로이고, ${num(stuck.spins)} 번을 줄여도 그 자리를 벗어나지 못합니다.`,
    ].join("\n");
  },

  /** `deep.walk.step` 2 — 앞 네 걸음. */
  "walk-first-four": () => {
    const rows = scanSteps(WALK_TEXT, WALK_PATTERN)
      .slice(0, 4)
      .map((s) => [
        `T${s.i + 1}`,
        String(s.i),
        s.ch,
        String(s.enter),
        s.chain.length > 0 ? `④ 줄이기 ${s.chain.length} 번` : "⑤ 늘리기",
        String(s.exit),
      ]);
    return md(
      ["걸음", "i", "T[i]", "들어올 때 j", "실행한 갈래", "나갈 때 j"],
      rows,
      ["l", "r", "l", "r", "l", "r"],
    );
  },

  /** `deep.walk.pause` — 패턴 전체가 맞은 뒤 맞은 길이를 0 으로 두면 무엇이 달라지는가. */
  "pause-match-reset": () => {
    const { rows, gaps } = contrast(OVERLAP_CASES, (t, p) =>
      matchResetsToZero.findAllOccurrences(t, p),
    );
    assertBreaks(gaps, matchResetsToZero);
    return md(["입력", "정본이 낸 답", "0 으로 둔 답", "판정"], rows, [
      "l",
      "l",
      "l",
      "l",
    ]);
  },

  /** `deep.walk.step` 3 — 고정 입력을 끝까지 대조한 걸음별 상태값. */
  "walk-trace": () => {
    const steps = scanSteps(WALK_TEXT, WALK_PATTERN);
    const rows = steps.map((s) => [
      `T${s.i + 1}`,
      String(s.i),
      s.ch,
      String(s.enter),
      s.chain.length === 0 ? "—" : s.chain.join(" → "),
      `P[${s.last}] = ${WALK_PATTERN[s.last]} · ${s.matched ? "같다" : "다르다"}`,
      String(s.cmp),
      s.hit === null ? "—" : String(s.hit),
      String(s.exit),
    ]);
    const found = steps.flatMap((s) => (s.hit === null ? [] : [s.hit]));
    return [
      md(
        [
          "걸음",
          "i",
          "T[i]",
          "들어올 때 j",
          "줄인 차례",
          "마지막 비교",
          "비교 횟수",
          "적은 시작 자리",
          "나갈 때 j",
        ],
        rows,
        ["l", "r", "l", "r", "l", "l", "r", "r", "r"],
      ),
      "",
      `i 는 0 부터 ${steps.length - 1} 까지 한 칸씩만 올라갔고 한 번도 작아지지 않았습니다. 답은 ${show(found)} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk.step` 3 — 여섯 갈래가 실행된 자리. */
  "walk-branches": () => {
    const steps = scanSteps(WALK_TEXT, WALK_PATTERN);
    const label = (xs: ScanStep[]): string =>
      xs.map((s) => `T${s.i + 1}`).join(" ");
    const shrinkBuild = buildSteps("aabaa").filter((r) => r.chain.length > 0);
    const shrinkWalk = buildSteps(WALK_PATTERN).filter(
      (r) => r.chain.length > 0,
    );
    const growWalk = buildSteps(WALK_PATTERN).filter((r) => r.matched);
    const growOther = buildSteps("aabaa").filter((r) => r.matched);
    const shrink = steps.filter((s) => s.chain.length > 0);
    const grow = steps.filter((s) => s.matched);
    const hit = steps.filter((s) => s.hit !== null);
    if (
      findAllOccurrences("abc", "").length +
        findAllOccurrences("ab", "abcd").length >
      0
    ) {
      throw new Error("① 이 걸러 내지 않았다");
    }
    const rows = [
      ["① 답이 없는 두 경우", "빈 패턴과 긴 패턴에서 참 · 전개 입력에서 거짓"],
      [
        "② 표를 만들며 줄이기",
        `패턴 aabaa 의 i = ${shrinkBuild.map((r) => r.i).join(" · ")} · 패턴 ${WALK_PATTERN} 에서는 ${shrinkWalk.length} 번`,
      ],
      [
        "③ 표를 만들며 늘리기",
        `패턴 ${WALK_PATTERN} 의 i = ${growWalk.map((r) => r.i).join(" · ")} · 패턴 aabaa 의 i = ${growOther.map((r) => r.i).join(" · ")}`,
      ],
      [
        "④ 대조하며 줄이기",
        shrink.map((s) => `T${s.i + 1} 에서 ${s.chain.length} 번`).join(" · "),
      ],
      [
        "⑤ 대조하며 늘리기",
        `${label(grow)} · 실행 안 된 걸음은 ${label(steps.filter((s) => !s.matched))}`,
      ],
      ["⑥ 다 맞은 자리", label(hit)],
    ];
    return md(["갈래", "실행된 자리"], rows, ["l", "l"]);
  },

  /** `deep.walk.step` 3 — 적은 자리가 정말 그 자리의 등장인가. */
  "walk-verify": () => {
    const m = WALK_PATTERN.length;
    const rows = scanSteps(WALK_TEXT, WALK_PATTERN)
      .filter((s) => s.hit !== null)
      .map((s) => {
        const at = s.hit as number;
        const piece = WALK_TEXT.slice(at, at + m);
        return [
          `T${s.i + 1}`,
          String(at),
          `T[${at}..${at + m - 1}] = ${piece}`,
          piece === WALK_PATTERN ? "같다" : "어긋난다",
        ];
      });
    return md(["걸음", "적은 시작 자리", "그 자리부터 네 글자", "P 와"], rows, [
      "l",
      "r",
      "l",
      "l",
    ]);
  },

  /** `deep.walk.pause` — 텍스트 자리를 되짚지 않는 것과 비교가 n 번인 것은 다르다. */
  "pause-compare-count": () => {
    const rows = SHAPE_CASES.map(([name, text, pattern]) => {
      const mine = counted(text, pattern);
      assertSame(text, pattern, mine.found);
      return [
        name,
        num(text.length),
        num(mine.scan),
        num(3 * text.length),
        `${(mine.scan / text.length).toFixed(2)} 배`,
      ];
    });
    const big = repeat("a", LIMIT);
    const bigPattern = `${repeat("a", 999)}b`;
    const heavy = counted(big, bigPattern);
    assertSame(big, bigPattern, heavy.found);
    return [
      md(
        ["입력의 모양", "n", "텍스트 대조 비교 횟수", "3n", "n 에 대한 배수"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `텍스트가 a ${num(LIMIT)} 개이고 패턴이 a 999 개 뒤에 b 하나이면 텍스트 대조 비교 횟수가 ${num(heavy.scan)} 번으로, 3n = ${num(3 * LIMIT)} 의 ${((heavy.scan / (3 * LIMIT)) * 100).toFixed(1)} % 입니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 부른 결과. */
  "final-calls": () => {
    const calls: [string, string][] = [
      [WALK_TEXT, WALK_PATTERN],
      ["ababcababab", "abab"],
      ["aaaa", "aa"],
      ["abc", "d"],
      ["abc", ""],
      ["", "a"],
    ];
    return columns(
      calls.map(([t, p]) => [
        `findAllOccurrences("${t}", "${p}")`,
        `→  ${JSON.stringify(findAllOccurrences(t, p)).replaceAll(",", ", ")}`,
      ]),
    );
  },

  /** `related` — 상태 하나와 글자 하나로 다음 상태가 정해지는 표. 실패 함수로 계산한다. */
  "related-automaton": () => {
    const p = WALK_PATTERN;
    const fail = failOf(p);
    const m = p.length;
    const next = (state: number, c: string): { to: number; hit: boolean } => {
      let j = state;
      while (j > 0 && c !== p[j]) j = fail[j - 1] as number;
      if (c === p[j]) j++;
      if (j === m) return { to: fail[m - 1] as number, hit: true };
      return { to: j, hit: false };
    };
    const cell = (r: { to: number; hit: boolean }): string =>
      r.hit ? `${r.to} (자리를 적는다)` : String(r.to);
    const rows = Array.from({ length: m }, (_, s) => [
      String(s),
      cell(next(s, "a")),
      cell(next(s, "b")),
      cell(next(s, "c")),
    ]);
    // 표를 따라가면 정본과 같은 답이 나와야 한다.
    let s = 0;
    const found: number[] = [];
    for (let i = 0; i < WALK_TEXT.length; i++) {
      const r = next(s, String(WALK_TEXT[i]));
      if (r.hit) found.push(i - m + 1);
      s = r.to;
    }
    assertSame(WALK_TEXT, p, found);
    return [
      md(["지금 상태 j", "글자 a", "글자 b", "그 밖의 글자"], rows, [
        "r",
        "l",
        "l",
        "l",
      ]),
      "",
      `전개 입력 "${WALK_TEXT}" 를 이 표만 따라 읽어도 답 ${show(found)}${이가(tail(found))} 나옵니다.`,
    ].join("\n");
  },

  /** `purpose.alt` — 두 설계의 비교 횟수. 값은 `.alt.ts` 를 실행해 받는다(bench 와 같은 값). */
  "alt-compare": () => {
    const mine = altCases["실패 함수 방식"]();
    const theirs = altCases["호스풀 방식"]();
    const rows = [1, 3, 4, 26].map((sigma) => {
      const key = `알파벳 ${sigma} 비교 횟수` as keyof typeof mine;
      const a = mine[key] as number;
      const b = theirs[key] as number;
      const fewer =
        a < b
          ? `실패 함수 방식 · ${(b / a).toFixed(2)} 배`
          : `호스풀 방식 · ${(a / b).toFixed(2)} 배`;
      return [String(sigma), String(a), String(b), fewer];
    });
    return [
      md(["글자 가짓수 σ", "실패 함수 방식", "호스풀 방식", "적은 쪽"], rows, [
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `저장 칸은 실패 함수 방식이 ${mine["저장 칸"]} 개, 호스풀 방식이 ${theirs["저장 칸"]} 개입니다.`,
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 작은 패턴에 넣어 손으로 확인한다. */
  "math-check": () => {
    const rows: string[][] = [];
    for (const p of ["abab", "aabaa", "aaab"]) {
      const fail = failOf(p);
      for (let i = 0; i < p.length; i++) {
        const borders: string[] = [];
        for (let k = 1; k <= i; k++) {
          if (p.slice(0, k) === p.slice(i + 1 - k, i + 1))
            borders.push(p.slice(0, k));
        }
        rows.push([
          p,
          String(i),
          p.slice(0, i + 1),
          borders.length === 0 ? "없음" : borders.join(" · "),
          String(fail[i]),
        ]);
      }
    }
    return md(
      ["P", "i", "P[0..i]", "접두사이자 접미사인 진 조각", "fail[i]"],
      rows,
      ["l", "r", "l", "l", "r"],
    );
  },

  /** `deep.math` ③ — 경계의 경계를 따라가 경계를 전부 얻는 차례. */
  "math-chain": () => {
    const p = "aabaa";
    const fail = failOf(p);
    const lines: string[][] = [];
    let at = p.length - 1;
    let v = fail[at] as number;
    lines.push([`  fail(${at}) = ${v}`, v === 0 ? "빈 문자열" : p.slice(0, v)]);
    while (v > 0) {
      const from = v;
      at = v - 1;
      v = fail[at] as number;
      lines.push([
        `  fail(${from} − 1) = fail(${at}) = ${v}`,
        v === 0 ? "빈 문자열" : p.slice(0, v),
      ]);
    }
    return [
      `P = ${p} 에서 자리 ${p.length - 1} 의 경계를 전부 얻는 차례`,
      columns(lines),
    ].join("\n");
  },

  /** `deep.math` ③ — 전수 대조의 곱이 가장 커지는 자리. */
  "math-peak": () => {
    const n = LIMIT;
    const m = n / 2;
    return columns([
      ["두 항의 합", "(n − m + 1) + m = n + 1", "m 과 상관없이 고정이다"],
      [
        `n = ${num(n)} 이면`,
        `m = ${num(m)} 에서 ${num(n - m + 1)} × ${num(m)}`,
        `= ${num((n - m + 1) * m)}`,
      ],
    ]);
  },

  /** `deep.math` ④ — 닫힌 형태에 규모를 넣은 값과 실측값의 대조. */
  "math-scale": () => {
    const rows = SCALE.map((n) => {
      const m = n / 2;
      const naive = everyStart(repeat("a", n), repeat("a", m));
      const mine = counted(repeat("a", n), repeat("a", m));
      assertSame(repeat("a", n), repeat("a", m), mine.found);
      return [
        num(n),
        num(m),
        num(naive.cmp),
        num((n - m + 1) * m),
        num(mine.build + mine.scan),
        num(3 * (n + m)),
      ];
    });
    const n = LIMIT;
    const m = n / 2;
    const atLimit = counted(repeat("a", n), repeat("a", m));
    assertSame(repeat("a", n), repeat("a", m), atLimit.found);
    const mine = atLimit.build + atLimit.scan;
    return [
      md(
        [
          "n",
          "m",
          "전수 대조(실측)",
          "(n−m+1)m",
          "실패 함수 방식(실측)",
          "3(n+m)",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      `과제 규모 n = ${num(n)} · m = ${num(m)} 에서는 (n−m+1)m 이 ${num((n - m + 1) * m)} 이고, 실패 함수 방식의 실측 비교 횟수는 ${num(mine)} 번, 상한 3(n+m) 은 ${num(3 * (n + m))} 입니다. 두 방식의 비교 횟수 비는 ${num(Math.round(((n - m + 1) * m) / mine))} 배입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const cases: [string, string, string, string][] = [
      ["빈 패턴", "hello", "", "조기 반환 m === 0 이 참이다"],
      ["빈 텍스트", "", "a", "조기 반환 n < m 이 참이다"],
      ["패턴이 텍스트보다 길다", "ab", "abcd", "조기 반환 n < m 이 참이다"],
      ["텍스트와 패턴이 같다", "abc", "abc", "마지막 걸음에서 j = m 이 된다"],
      ["모두 같은 글자", "aaaaa", "aaa", "매 걸음 늘리기가 실행된다"],
      ["길이 1 · 같은 글자", "a", "a", "걸음이 하나뿐이다"],
      ["길이 1 · 다른 글자", "a", "b", "걸음이 하나뿐이다"],
    ];
    const rows = cases.map(([name, t, p, where]) => [
      name,
      `"${t}" / "${p}"`,
      where,
      show(findAllOccurrences(t, p)),
    ]);
    return md(["입력의 모양", "텍스트 / 패턴", "처리되는 자리", "답"], rows, [
      "l",
      "l",
      "l",
      "l",
    ]);
  },

  /** `invariant` ③ — 맞은 길이를 하나씩만 줄이면 무엇이 나오는가. */
  "mutant-step-back": () => {
    const { rows, gaps } = contrast(PULLBACK_CASES, (t, p) =>
      stepBackOne.findAllOccurrences(t, p),
    );
    assertBreaks(gaps, stepBackOne);
    return md(["입력", "정본이 낸 답", "하나씩 줄인 답", "판정"], rows, [
      "l",
      "l",
      "l",
      "l",
    ]);
  },

  /** `invariant` ③ — "abba" 에서 두 코드의 j 가 갈리는 자리. */
  "mutant-abba-trace": () => {
    const text = "abba";
    const p = "aba";
    const fail = failOf(p);
    const run = (shrink: (j: number) => number) => {
      const js: number[] = [];
      const found: number[] = [];
      let j = 0;
      for (let i = 0; i < text.length; i++) {
        while (j > 0 && text[i] !== p[j]) j = shrink(j);
        if (text[i] === p[j]) j++;
        if (j === p.length) {
          found.push(i - p.length + 1);
          j = fail[j - 1] as number;
        }
        js.push(j);
      }
      return { js, found };
    };
    const good = run((j) => fail[j - 1] as number);
    const bad = run((j) => j - 1);
    assertSame(text, p, good.found);
    if (!neutral(stepBackOne)) {
      const want = stepBackOne.findAllOccurrences(text, p);
      if (want.join(",") !== bad.found.join(",")) {
        throw new Error("하나씩 줄이는 자취가 변이의 답과 다르다");
      }
    }
    const rows = [...text].map((c, i) => [
      String(i),
      c,
      String(good.js[i]),
      String(bad.js[i]),
    ]);
    const at = bad.found[0] ?? -1;
    return [
      md(["자리 i", "T[i]", "정본의 j", "하나씩 줄인 쪽의 j"], rows, [
        "r",
        "l",
        "r",
        "r",
      ]),
      "",
      `하나씩 줄인 쪽은 자리 ${at}${을를(at)} 답으로 적는데, T[${at}..${at + p.length - 1}] = ${text.slice(at, at + p.length)} 라 패턴 ${p} 와 다릅니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 걸음의 무리마다 비교가 몇 번 드는가. */
  "perf-count": () => {
    const mine = counted(WALK_TEXT, WALK_PATTERN);
    assertSame(WALK_TEXT, WALK_PATTERN, mine.found);
    const steps = scanSteps(WALK_TEXT, WALK_PATTERN);
    const by = (f: (c: number) => boolean) =>
      steps.filter((s) => f(s.cmp)).map((s) => `T${s.i + 1}`);
    const rows = [
      [
        "실패 함수 만들기",
        `패턴 ${WALK_PATTERN.length} 글자`,
        String(WALK_PATTERN.length - 1),
        num(mine.build),
      ],
      [
        "텍스트 대조",
        `T1 부터 T${steps.length} 까지`,
        String(steps.length),
        num(mine.scan),
      ],
      ["합계", "", "", num(mine.build + mine.scan)],
    ];
    const once = by((c) => c === 1);
    const twice = by((c) => c === 2);
    const more = by((c) => c > 2);
    return [
      md(["무리", "걸음", "걸음 수", "비교 횟수"], rows, ["l", "l", "r", "r"]),
      "",
      `텍스트 대조의 걸음을 비교 횟수로 나누면 1 번인 걸음이 ${once.length} 개(${once.join(" · ")}), 2 번인 걸음이 ${twice.length} 개, 3 번 이상인 걸음이 ${more.length} 개(${more.join(" · ")})입니다. 걸음마다 한 번은 반드시 비교하므로 ${steps.length} 번은 늘 들고, 나머지 ${mine.scan - steps.length} 번이 줄이기 판정에서 나왔습니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 총식과 전개 입력의 값. */
  "perf-total": () => {
    const n = WALK_TEXT.length;
    const m = WALK_PATTERN.length;
    const mine = counted(WALK_TEXT, WALK_PATTERN);
    return columns([
      ["총식", "비교 횟수 = 표 만들기 + 텍스트 대조 ≤ 3m + 3n = 3(n + m)"],
      [
        `n = ${n} · m = ${m}`,
        `상한 ${3 * (n + m)} · 실측 ${mine.build + mine.scan}`,
      ],
      ["잡는 칸", `fail 표 ${m} 칸 + 찾은 자리 ${mine.found.length} 칸`],
    ]);
  },

  /** `perf.bounds` — 과제 규모에서의 총식 값. */
  "perf-scale": () => {
    const n = LIMIT;
    const m = n / 2;
    const got = counted(repeat("a", n), repeat("a", m));
    assertSame(repeat("a", n), repeat("a", m), got.found);
    return columns([
      [
        "총식",
        "Θ(n + m) 시간 + Θ(m + r) 추가 메모리 (r 은 찾은 자리 수, r ≤ n − m + 1)",
      ],
      [
        `n = ${num(n)} · m = ${num(m)}`,
        `비교 ${num(got.build + got.scan)} 번 · fail 표 ${num(m)} 칸 · 찾은 자리 ${num(got.found.length)} 칸`,
      ],
    ]);
  },

  /** `perf.worst` — 비교를 가장 크게 만드는 입력을 실제로 구성한다. */
  "worst-shape": () => {
    const n = LIMIT;
    const shapes: [string, string, string][] = [
      [
        "텍스트가 전부 a · 패턴 a 999 개 + b",
        repeat("a", n),
        `${repeat("a", 999)}b`,
      ],
      ["텍스트가 전부 a · 패턴 a 1,000 개", repeat("a", n), repeat("a", 1000)],
      ["텍스트가 전부 a · 패턴 aab", repeat("a", n), "aab"],
      [
        "a 999 개 + b 를 100 번 이은 텍스트 · 같은 패턴",
        repeat(`${repeat("a", 999)}b`, 100),
        `${repeat("a", 999)}b`,
      ],
      [
        "텍스트가 전부 c · 패턴 a 999 개 + b",
        repeat("c", n),
        `${repeat("a", 999)}b`,
      ],
    ];
    const rows = shapes.map(([name, text, pattern]) => {
      const mine = counted(text, pattern);
      assertSame(text, pattern, mine.found);
      return [
        name,
        num(mine.build),
        num(mine.scan),
        num(mine.build + mine.scan),
        num(mine.found.length),
      ];
    });
    let bestM = 0;
    let bestScan = 0;
    const sweep = 20_000;
    const sweepText = repeat("a", sweep);
    for (let m = 2; m <= 200; m++) {
      const got = counted(sweepText, `${repeat("a", m - 1)}b`);
      if (got.scan > bestScan) {
        bestScan = got.scan;
        bestM = m;
      }
    }
    return [
      md(
        [
          `입력의 모양 (n = ${num(n)})`,
          "실패 함수 만들기",
          "텍스트 대조",
          "합",
          "찾은 자리 수",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `텍스트를 a ${num(sweep)} 개로 고정하고 패턴을 a 여러 개 + b 로 두어 길이를 2 부터 200 까지 바꿔 가며 재면, 텍스트 대조가 가장 많은 패턴 길이는 ${bestM} 이고 그때 ${num(bestScan)} 번으로 3n = ${num(3 * sweep)} 에 ${num(3 * sweep - bestScan)} 모자랍니다.`,
    ].join("\n");
  },

  /** `selfcheck` — T8 이 끝난 시점과 T9 가 하는 일. */
  "selfcheck-t8": () => {
    const steps = scanSteps(WALK_TEXT, WALK_PATTERN);
    const t8 = steps.find((s) => s.hit !== null) as ScanStep;
    const t9 = steps[t8.i + 1] as ScanStep;
    const j = t8.exit;
    return columns([
      [
        `T${t8.i + 1}${이가(t8.i + 1)} 끝난 시점`,
        `j = ${j}`,
        `T[${t8.i - j + 1}..${t8.i}] = ${WALK_TEXT.slice(t8.i - j + 1, t8.i + 1)} 가 P[0..${j - 1}]${과와(j - 1)} 같다`,
      ],
      [
        `T${t9.i + 1}${이가(t9.i + 1)} 하는 일`,
        `T[${t9.i}]${을를(t9.i)} P[${t9.enter}]${과와(t9.enter)} 비교한다`,
        `앞 ${j} 글자는 이미 맞아 있다`,
      ],
    ]);
  },

  /** `selfcheck` 답 — 앞 글자들은 이미 맞아 있다. */
  "selfcheck-answer": () => {
    const steps = scanSteps(WALK_TEXT, WALK_PATTERN);
    const t8 = steps.find((s) => s.hit !== null) as ScanStep;
    const j = t8.exit;
    const from = t8.i - j + 1;
    const lines: string[][] = [];
    for (let k = 0; k < j; k++) {
      const c = String(WALK_TEXT[from + k]);
      const p = String(WALK_PATTERN[k]);
      if (c !== p) throw new Error("이미 맞아 있어야 할 글자가 다르다");
      lines.push([pair(c, from + k, p, k), `T${t8.i + 1} 까지 이미 확인했다`]);
    }
    lines.push([
      `T[${from + j}] 부터`,
      `아직 모른다 — 그래서 j = ${j} 에서 이어 간다`,
    ]);
    return columns(lines);
  },
};
