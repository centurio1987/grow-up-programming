/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/string/ahoCorasick/ahoCorasick-guide.md
 *
 * 블록은 두 모양이다. 마크다운 표로 된 블록은 표와 그 아래 문장을 함께 내고(본문은 `<!--/proof-->`
 * 로 닫는다), 등폭 글자가 자연스러운 짧은 실행 결과는 펜스 안의 글자를 낸다.
 *
 * **비용은 원고 전체에서 「자료 접근」 하나로 센다.** 계수기는 경쟁 설계 사이드카(`-guide.alt.ts`)에
 * 한 벌만 두고 여기서 부른다 — 배열 칸을 읽거나 쓴 횟수와 문자열 글자를 읽은 횟수의 합이다.
 *
 * 그림 사이드카(`-guide.fig.tsx`)도 이 파일의 기록(트라이의 모양 · 걸음 기록)에서 그림을 그린다. 그
 * 기록이 정본과 같은 자동자를 가리키는지는 이 파일이 읽힐 때 스스로 확인한다(맨 아래).
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 은는, 이가 } from "../../../../tools/josa.ts";
import {
  type AhoCount,
  TEXT as ALT_TEXT,
  cases as altCases,
  countAho,
  countKmpEach,
  makePatterns,
  PATTERN_COUNTS,
  PATTERN_TOTAL,
  TEXT_LENGTH,
} from "./ahoCorasick-guide.alt.ts";
import {
  type Automaton,
  ahoCorasick,
  buildAutomaton,
  type Match,
} from "./ahoCorasick-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 한글·가나·한자 구간을 두 칸으로 센다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 천 단위 구분. 본문 표기와 같다. */
export const num = (n: number): string => n.toLocaleString("en-US");

/** 초당 1 억 번 기준 시간. */
export const secondsOf = (access: number): string =>
  `${(access / 1e8).toFixed(access < 1e8 ? 3 : 1)} 초`;

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

/** 매칭 목록을 `패턴 번호@시작 자리` 로 적는다. */
export const showMatches = (ms: readonly Match[]): string =>
  ms.length === 0
    ? "없음"
    : ms.map((m) => `${m.patternIndex}@${m.position}`).join(" ");

/** 노드 이름 — 경로 문자열. 뿌리만 「뿌리」다. */
export const nodeName = (path: string): string => (path === "" ? "뿌리" : path);

/** 「뿌리의」·「he 의」 — 한글 낱말에는 붙이고 값에는 띄운다(이 저장소의 표기). */
const of = (name: string): string =>
  name === "뿌리" ? "뿌리의" : `${name} 의`;

const quoted = (ps: readonly string[]): string =>
  ps.map((p) => `"${p}"`).join(" ");

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.origin`·`deep.build`·`deep.walk`·`.sim.ts`·`.fig.tsx` 가 같은 것을
 * 쓴다. 갈래가 전부 실행된다 — 뿌리에서 아무 데도 못 가는 글자(`u`), 자식을 그대로 따라가는 글자
 * (`s`·`h`·`e`), 자식이 없어 실패 링크가 물려준 칸으로 옮기는 글자(`r`), 그리고 **긴 패턴 안에 짧은
 * 패턴이 접미사로 숨어 있는 자리**(`she` 안의 `he`).
 */
export const WALK_TEXT = "ushers";
export const WALK_PATTERNS = ["he", "she", "hers"] as const;
const WALK_P: string[] = [...WALK_PATTERNS];

/** 과제 규모의 최댓값 둘. */
export const LIMIT_TEXT = 100_000;
export const LIMIT_TOTAL = 100_000;

const SIGMA = 26;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

/* ────────────────────── 자동자를 읽는 보조 ────────────────────── */

/**
 * 노드마다 경로 문자열을 낸다. 다 채운 전이표에서는 **깊이가 하나 늘어나는 칸만이 트리의 간선**이다 —
 * 물려받은 칸은 반드시 깊이가 같거나 얕은 노드를 가리킨다.
 */
export function pathsOf(auto: Automaton): string[] {
  const out = Array.from({ length: auto.size }, () => "");
  const queue = [0];
  for (let head = 0; head < queue.length; head++) {
    const s = queue[head] as number;
    for (let c = 0; c < SIGMA; c++) {
      const u = auto.next[s * SIGMA + c] as number;
      if ((auto.depth[u] as number) !== (auto.depth[s] as number) + 1) continue;
      out[u] = (out[s] as string) + (ALPHABET[c] as string);
      queue.push(u);
    }
  }
  return out;
}

/** 자동자의 노드 하나 — 그림 사이드카가 그림을 그리는 재료. */
export interface NodeInfo {
  readonly id: number;
  readonly path: string;
  readonly depth: number;
  /** 부모의 경로 문자열. 뿌리면 `null`. */
  readonly parent: string | null;
  readonly link: string;
  /** 출력 링크가 가리키는 노드의 경로 문자열. 없으면 `null`. */
  readonly out: string | null;
  readonly ends: readonly number[];
}

/** 정본이 만든 자동자를 노드 목록으로 — 만든 차례(노드 번호)대로. */
export function nodesOf(patterns: readonly string[]): NodeInfo[] {
  const auto = buildAutomaton(patterns);
  const path = pathsOf(auto);
  return Array.from({ length: auto.size }, (_, s) => {
    const p = path[s] as string;
    const o = auto.outLink[s] as number;
    return {
      id: s,
      path: p,
      depth: auto.depth[s] as number,
      parent: s === 0 ? null : p.slice(0, -1),
      link: path[auto.link[s] as number] as string,
      out: o === -1 ? null : (path[o] as string),
      ends: [...(auto.endOf[s] as number[])],
    };
  });
}

/** 정의 그대로 — `path` 의 진 접미사 중 `prefixes` 에 든 가장 긴 것. 없으면 빈 문자열. */
function longestProperSuffixIn(
  path: string,
  prefixes: ReadonlySet<string>,
): string {
  for (let k = 1; k < path.length; k++) {
    const tail = path.slice(k);
    if (prefixes.has(tail)) return tail;
  }
  return "";
}

/** 패턴들의 접두사 전부(빈 문자열 포함) — 트라이의 노드 집합과 같다. */
function prefixSet(patterns: readonly string[]): Set<string> {
  const out = new Set<string>([""]);
  for (const p of patterns)
    for (let k = 1; k <= p.length; k++) out.add(p.slice(0, k));
  return out;
}

/* ────────────────────── 계수기 — 떠올리는 과정의 후보들 ────────────────────── */

/** 패턴마다 모든 시작 자리에서 글자를 대조한다. 정의를 그대로 옮긴 것이다. */
export function countBrute(
  text: string,
  patterns: readonly string[],
): { access: number; matches: Match[]; reads: number[] } {
  let access = 0;
  const reads = Array.from({ length: text.length }, () => 0);
  const matches: Match[] = [];
  for (const [index, pattern] of patterns.entries()) {
    access += 1; // patterns[i]
    const m = pattern.length;
    for (let j = 0; j + m <= text.length; j++) {
      let t = 0;
      while (t < m) {
        access += 2; // text[j + t] · pattern[t]
        reads[j + t] = (reads[j + t] as number) + 1;
        if (text[j + t] !== pattern[t]) break;
        t += 1;
      }
      if (t === m) {
        access += 1; // 매칭 쓰기
        matches.push({ patternIndex: index, position: j });
      }
    }
  }
  matches.sort(
    (a, b) => a.position - b.position || a.patternIndex - b.patternIndex,
  );
  return { access, matches, reads };
}

/**
 * 패턴을 트라이에 담고, 텍스트의 **시작 자리마다** 뿌리에서 새로 내려간다. 담는 일은 자동자와 같은
 * 줄이고(같은 셈), 내려갈 때는 실패 링크 없이 트라이의 자식만 본다.
 */
export function countTrieRestart(
  text: string,
  patterns: readonly string[],
): {
  access: number;
  matches: Match[];
  walks: { start: number; nodes: string[]; found: Match[] }[];
} {
  let access = 0;
  let cap = 1;
  for (const p of patterns) cap += p.length;
  const next = new Int32Array(cap * SIGMA).fill(-1);
  const endOf: number[][] = Array.from({ length: cap }, () => [] as number[]);
  const path: string[] = [""];
  let size = 1;
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i] as string;
    access += 1;
    let s = 0;
    for (const ch of pattern) {
      access += 1;
      const c = ch.charCodeAt(0) - 97;
      access += 1;
      if (next[s * SIGMA + c] === -1) {
        next[s * SIGMA + c] = size;
        path[size] = (path[s] as string) + ch;
        size += 1;
        access += 3;
      }
      access += 1;
      s = next[s * SIGMA + c] as number;
    }
    access += 1;
    (endOf[s] as number[]).push(i);
  }
  const matches: Match[] = [];
  const walks: { start: number; nodes: string[]; found: Match[] }[] = [];
  const keep = text.length <= 64;
  for (let j = 0; j < text.length; j++) {
    let s = 0;
    const nodes: string[] = [];
    const found: Match[] = [];
    for (let t = j; t < text.length; t++) {
      access += 2; // text[t] · next[s][c]
      const u = next[s * SIGMA + text.charCodeAt(t) - 97] as number;
      if (u === -1) break;
      s = u;
      if (keep) nodes.push(path[s] as string);
      access += 1; // endOf[s]
      for (const i of endOf[s] as number[]) {
        access += 1; // 매칭 쓰기
        const m = { patternIndex: i, position: j };
        matches.push(m);
        found.push(m);
      }
    }
    if (keep) walks.push({ start: j, nodes, found });
  }
  matches.sort(
    (a, b) => a.position - b.position || a.patternIndex - b.patternIndex,
  );
  return { access, matches, walks };
}

/**
 * 텍스트 `a × n` 과 패턴 `a × m` 하나에서 시작 자리마다 내려가는 방법의 자료 접근 — 식으로 낸다.
 * 시작 자리에서 남은 글자가 `r` 이면 `min(r, m)` 칸을 내려가고(칸마다 3), 깊이 `m` 에 닿으면 매칭을
 * 하나 적고(1), 글자가 남아 있으면 없는 자식을 한 번 더 찾는다(2). 담는 일은 `6m + 2` 다. 작은 크기에서
 * 계수기와 같은지 이 파일이 읽힐 때 확인한다.
 */
export function restartFormula(n: number, m: number): number {
  const sumMin = (m * (m + 1)) / 2 + (n - m) * m;
  return 6 * m + 2 + 3 * sumMin + (n - m + 1) + 2 * (n - m);
}

/** 텍스트 `a × n` 과 패턴 `a × m` 하나에서 패턴마다 대조하는 방법의 자료 접근 — 식으로 낸다. */
export function bruteFormula(n: number, m: number): number {
  return 1 + (n - m + 1) * (2 * m + 1);
}

/** 두 식을 계수기와 맞대는 크기 셋. */
const FORMULA_CHECKS = [
  [300, 100],
  [1000, 400],
  [2000, 999],
] as const;

for (const [n, m] of FORMULA_CHECKS) {
  const text = "a".repeat(n);
  const pat = ["a".repeat(m)];
  if (countTrieRestart(text, pat).access !== restartFormula(n, m)) {
    throw new Error(
      `시작 자리마다 내려가기의 식이 n=${n}, m=${m} 에서 계수기와 다르다`,
    );
  }
  if (countBrute(text, pat).access !== bruteFormula(n, m)) {
    throw new Error(`패턴마다 대조의 식이 n=${n}, m=${m} 에서 계수기와 다르다`);
  }
}

/* ────────────── 떠올리는 과정의 입력 둘 — 모양을 정한 것이지 값을 고른 것이 아니다 ────────────── */

/** 뒤 세 글자 — `b`–`z` 스물다섯 글자로 적은 `i`. 셋 다 `a` 가 아니라 앞 97 글자 뒤에서 반드시 어긋난다. */
const code3 = (i: number): string => {
  const L = "bcdefghijklmnopqrstuvwxyz";
  return `${L[Math.floor(i / 625) % 25]}${L[Math.floor(i / 25) % 25]}${L[i % 25]}`;
};

/** 입력 가 — 텍스트 `a × 100,000`, 앞 97 글자가 `a` 인 길이 100 짜리 패턴 1,000 개(길이 합 100,000). */
export const SHARED_K = 1000;
export const SHARED_PATTERNS = Array.from(
  { length: SHARED_K },
  (_, i) => `${"a".repeat(97)}${code3(i)}`,
);

/** 입력 나 — 텍스트 `a × 100,000`, 패턴 `a × 50,000` 하나. */
export const LONG_M = 50_000;

/**
 * 입력 가의 패턴 1,000 개는 모두 같은 모양(앞 97 글자 `a` 뒤에 `a` 가 아닌 세 글자)이라 패턴마다
 * 대조하는 방법과 패턴마다 실패 함수를 쓰는 방법은 패턴 하나에 드는 자료 접근이 모두 같다. 그래서
 * 하나를 센 값에 1,000 을 곱한다. 앞 10 개를 직접 센 값이 하나의 10 배와 같은지 여기서 확인한다.
 */
function perPatternTimes(
  count: (text: string, ps: readonly string[]) => { access: number },
  text: string,
): number {
  const one = count(text, [SHARED_PATTERNS[0] as string]).access;
  const ten = count(text, SHARED_PATTERNS.slice(0, 10)).access;
  if (ten !== one * 10) {
    throw new Error("입력 가의 패턴 하나에 드는 자료 접근이 패턴마다 다르다");
  }
  return one * SHARED_K;
}

/** 떠올리는 과정의 네 방법이 두 입력에서 쓰는 자료 접근. 그림(방법 사다리)도 이 값을 쓴다. */
export function originCosts(): {
  brute: { a: number; b: number };
  restart: { a: number; b: number };
  kmp: { a: number; b: number };
  aho: { a: number; b: number };
} {
  const text = "a".repeat(LIMIT_TEXT);
  const long = ["a".repeat(LONG_M)];
  const ahoA = countAho(text, SHARED_PATTERNS);
  const ahoB = countAho(text, long);
  const restartA = countTrieRestart(text, SHARED_PATTERNS);
  const kmpB = countKmpEach(text, long);
  const want = ahoCorasick(text, long).length;
  if (ahoB.matches.length !== want || kmpB.matches.length !== want) {
    throw new Error("입력 나의 매칭 수가 정본과 다르다");
  }
  if (ahoA.matches.length !== 0 || restartA.matches.length !== 0) {
    throw new Error("입력 가에는 매칭이 없어야 한다");
  }
  return {
    brute: {
      a: perPatternTimes(countBrute, text),
      b: bruteFormula(LIMIT_TEXT, LONG_M),
    },
    restart: { a: restartA.access, b: restartFormula(LIMIT_TEXT, LONG_M) },
    kmp: { a: perPatternTimes(countKmpEach, text), b: kmpB.access },
    aho: { a: ahoA.access, b: ahoB.access },
  };
}

/* ────────────────── 계측기 — 표를 어디까지 펼치는가 ────────────────── */

/**
 * 깊이 `d` 이하의 노드만 전이표를 다 채우고, 그보다 깊은 노드는 실제 자식만 들고 있다가 없으면
 * 실패 링크로 옮겨 다시 찾는다. `d` 를 노드의 최대 깊이로 두면 정본과 같다. 읽는 무리의 자료 접근만
 * 센다 — 글자마다 텍스트 글자 1 · 깊이 1 · 표 칸 1, 실패 링크로 옮길 때마다 실패 링크 1 과 깊이 1 · 칸 1.
 */
function scanWithDepth(
  auto: Automaton,
  text: string,
  d: number,
): { access: number; worst: number; cells: number; matches: number } {
  const real = new Int32Array(auto.size * SIGMA).fill(-1);
  for (let s = 0; s < auto.size; s++) {
    for (let c = 0; c < SIGMA; c++) {
      const u = auto.next[s * SIGMA + c] as number;
      if ((auto.depth[u] as number) !== (auto.depth[s] as number) + 1) continue;
      real[s * SIGMA + c] = u;
    }
  }
  let expanded = 0;
  let deepEdges = 0;
  for (let s = 0; s < auto.size; s++) {
    if ((auto.depth[s] as number) <= d) {
      expanded += 1;
      continue;
    }
    for (let c = 0; c < SIGMA; c++)
      if ((real[s * SIGMA + c] as number) !== -1) deepEdges += 1;
  }
  let access = 0;
  let worst = 0;
  let matches = 0;
  let s = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0) - 97;
    let here = 1; // 텍스트 글자
    for (;;) {
      here += 2; // depth[s] · 표 칸 하나
      if ((auto.depth[s] as number) <= d) {
        s = auto.next[s * SIGMA + c] as number;
        break;
      }
      const u = real[s * SIGMA + c] as number;
      if (u !== -1) {
        s = u;
        break;
      }
      here += 1; // link[s]
      s = auto.link[s] as number;
    }
    for (let t = s; t !== -1; t = auto.outLink[t] as number) {
      matches += (auto.endOf[t] as number[]).length;
    }
    access += here;
    worst = Math.max(worst, here);
  }
  // 펼친 노드는 Σ 칸, 안 펼친 노드는 실제 자식 수만. 거기에 실패 링크 · 출력 링크 · 깊이가 각각 V.
  return {
    access,
    worst,
    cells: SIGMA * expanded + deepEdges + 3 * auto.size,
    matches,
  };
}

/* ────────────────── 계측기 — 출력 링크 대 실패 링크 ────────────────── */

/** 출력 링크를 따라 거둔다(정본의 방식). 사슬에서 들른 노드 수를 센다. */
function collectByOutLink(
  auto: Automaton,
  text: string,
): { visits: number; matches: Match[] } {
  let visits = 0;
  const matches: Match[] = [];
  let s = 0;
  for (let i = 0; i < text.length; i++) {
    s = auto.next[s * SIGMA + (text.charCodeAt(i) - 97)] as number;
    for (let t = s; t !== -1; t = auto.outLink[t] as number) {
      visits += 1;
      for (const p of auto.endOf[t] as number[]) {
        matches.push({
          patternIndex: p,
          position: i - (auto.depth[t] as number) + 1,
        });
      }
    }
  }
  matches.sort(
    (a, b) => a.position - b.position || a.patternIndex - b.patternIndex,
  );
  return { visits, matches };
}

/** 실패 링크를 뿌리까지 따라가며 거둔다. 답은 같고 들른 노드 수만 다르다. */
function collectByFailLink(
  auto: Automaton,
  text: string,
): { visits: number; matches: Match[] } {
  let visits = 0;
  const matches: Match[] = [];
  let s = 0;
  for (let i = 0; i < text.length; i++) {
    s = auto.next[s * SIGMA + (text.charCodeAt(i) - 97)] as number;
    let t = s;
    for (;;) {
      visits += 1;
      for (const p of auto.endOf[t] as number[]) {
        matches.push({
          patternIndex: p,
          position: i - (auto.depth[t] as number) + 1,
        });
      }
      if (t === 0) break;
      t = auto.link[t] as number;
    }
  }
  matches.sort(
    (a, b) => a.position - b.position || a.patternIndex - b.patternIndex,
  );
  return { visits, matches };
}

/* ────────────────── 한 패턴 안에서만 찾은 링크 — 헷갈리기 쉬운 모양 ────────────────── */

/**
 * 노드마다 링크를 **그 노드를 앞부분으로 가진 패턴 안에서만** 찾는다 — 패턴마다 실패 함수를 따로 만든
 * 것과 같다. 그 노드를 앞부분으로 가진 패턴이 여럿이면 답이 하나로 같은지 확인한다.
 */
export function inPatternLink(
  path: string,
  patterns: readonly string[],
): string {
  const owners = patterns.filter((p) => p.startsWith(path));
  const answers = new Set(
    owners.map((p) => {
      const own = new Set<string>([""]);
      for (let k = 1; k <= p.length; k++) own.add(p.slice(0, k));
      return longestProperSuffixIn(path, own);
    }),
  );
  if (answers.size !== 1) {
    throw new Error(`노드 ${path} 의 한 패턴 안 링크가 패턴마다 다르다`);
  }
  return [...answers][0] as string;
}

/**
 * 링크를 주어진 규칙으로 정하고 전이표 · 출력 링크를 정본과 같은 방식(얕은 노드부터 물려받기)으로 채운
 * 자동자로 텍스트를 읽는다. 정본의 코드는 바꾸지 않는다 — 링크를 정하는 규칙만 갈아 끼운 사본이다.
 */
function scanWithLinks(
  text: string,
  patterns: readonly string[],
  linkOf: (path: string) => string,
): Match[] {
  const ref = buildAutomaton(patterns);
  const path = pathsOf(ref);
  const idOf = new Map(path.map((p, s) => [p, s]));
  const V = ref.size;
  const child = new Int32Array(V * SIGMA).fill(-1);
  for (let s = 0; s < V; s++)
    for (let c = 0; c < SIGMA; c++) {
      const u = ref.next[s * SIGMA + c] as number;
      if ((ref.depth[u] as number) === (ref.depth[s] as number) + 1)
        child[s * SIGMA + c] = u;
    }
  const link = path.map((p) => idOf.get(linkOf(p)) as number);
  const next = new Int32Array(V * SIGMA);
  const outLink = new Int32Array(V).fill(-1);
  const order = [...path.keys()].sort(
    (a, b) => (ref.depth[a] as number) - (ref.depth[b] as number),
  );
  for (const v of order) {
    const f = link[v] as number;
    if (v !== 0)
      outLink[v] =
        (ref.endOf[f] as number[]).length > 0 ? f : (outLink[f] as number);
    for (let c = 0; c < SIGMA; c++) {
      const u = child[v * SIGMA + c] as number;
      next[v * SIGMA + c] =
        u !== -1 ? u : v === 0 ? 0 : (next[f * SIGMA + c] as number);
    }
  }
  const out: Match[] = [];
  let s = 0;
  for (let i = 0; i < text.length; i++) {
    s = next[s * SIGMA + (text.charCodeAt(i) - 97)] as number;
    for (let t = s; t !== -1; t = outLink[t] as number)
      for (const p of ref.endOf[t] as number[])
        out.push({
          patternIndex: p,
          position: i - (ref.depth[t] as number) + 1,
        });
  }
  out.sort(
    (a, b) => a.position - b.position || a.patternIndex - b.patternIndex,
  );
  return out;
}

/* ────────────────── 걸음 기록 — 전개 · 불변식 · 그림이 함께 쓴다 ────────────────── */

/** 전개의 걸음 하나. T1 · T2 는 만드는 걸음, T3~T8 은 글자 하나, T9 는 반환이다. */
export type WalkStep =
  | { readonly t: number; readonly kind: "build" }
  | { readonly t: number; readonly kind: "links" }
  | {
      readonly t: number;
      readonly kind: "char";
      readonly pos: number;
      readonly ch: string;
      readonly from: string;
      readonly to: string;
      /** 자식으로 내려갔는가 · 물려받은 칸으로 옮겼는가 · 뿌리로 돌아왔는가. */
      readonly how: "child" | "inherit" | "root";
      /** 물려받은 칸이면 그 값을 정한 길 — 실패 링크를 따라간 노드들. */
      readonly via: readonly string[];
      /** 출력 링크 사슬에서 들른 노드. 첫 칸은 옮겨 간 노드 자신이다. */
      readonly chain: readonly string[];
      readonly found: readonly Match[];
      /** 이 걸음까지 찾은 매칭(끝난 차례). */
      readonly sofar: readonly Match[];
    }
  | { readonly t: number; readonly kind: "sort"; readonly result: Match[] };

/** 전개 입력을 정본의 자동자로 읽으며 걸음을 적는다. */
export function walkSteps(
  text = WALK_TEXT,
  patterns: readonly string[] = WALK_P,
): WalkStep[] {
  const auto = buildAutomaton(patterns);
  const path = pathsOf(auto);
  const idOf = new Map(path.map((p, s) => [p, s]));
  const steps: WalkStep[] = [
    { t: 1, kind: "build" },
    { t: 2, kind: "links" },
  ];
  const sofar: Match[] = [];
  let s = 0;
  for (let pos = 0; pos < text.length; pos++) {
    const ch = text[pos] as string;
    const c = ch.charCodeAt(0) - 97;
    const from = path[s] as string;
    const to = auto.next[s * SIGMA + c] as number;
    const toPath = path[to] as string;
    let how: "child" | "inherit" | "root";
    const via: string[] = [];
    if (toPath === from + ch) how = "child";
    else {
      how = to === 0 ? "root" : "inherit";
      // 물려받은 값을 정한 길 — 실패 링크를 따라가 그 글자의 자식이 있는 첫 노드까지.
      let f = s;
      while (f !== 0) {
        f = auto.link[f] as number;
        via.push(path[f] as string);
        if (idOf.has((path[f] as string) + ch)) break;
      }
    }
    const chain: string[] = [];
    const found: Match[] = [];
    for (let t = to; t !== -1; t = auto.outLink[t] as number) {
      chain.push(path[t] as string);
      for (const p of auto.endOf[t] as number[]) {
        const m = {
          patternIndex: p,
          position: pos - (auto.depth[t] as number) + 1,
        };
        found.push(m);
        sofar.push(m);
      }
    }
    steps.push({
      t: pos + 3,
      kind: "char",
      pos,
      ch,
      from,
      to: toPath,
      how,
      via,
      chain,
      found,
      sofar: [...sofar],
    });
    s = to;
  }
  steps.push({
    t: text.length + 3,
    kind: "sort",
    result: ahoCorasick(text, [...patterns]),
  });
  return steps;
}

/** 정의 그대로 — `text[0..i]` 의 접미사이면서 어떤 패턴의 접두사인 것 중 가장 긴 것. */
function longestSuffixPrefix(
  text: string,
  i: number,
  patterns: readonly string[],
): string {
  const pre = prefixSet(patterns);
  for (let k = i + 1; k >= 0; k--) {
    const tail = text.slice(i + 1 - k, i + 1);
    if (pre.has(tail)) return tail;
  }
  return "";
}

/* ────────────────── 변이 — 정본 소스에서 기계로 만든다 ────────────────── */

/**
 * `PROOFS` 의 함수는 **동기**여야 한다(`check-proof.ts` 가 `make()` 를 그대로 부른다). 그래서 변이는
 * 여기서 최상위 `await` 로 한 번만 만들어 둔다.
 */
const REF = new URL("./ahoCorasick-guide.ref.ts", import.meta.url).pathname;
type Impl = {
  ahoCorasick: typeof ahoCorasick;
  buildAutomaton: typeof buildAutomaton;
};

/** 자식이 없는 칸을 물려받지 않고 뿌리로 둔다. */
const emptyCellToRoot = await loadMutant<Impl>(REF, {
  swap: [
    /next\[v \* SIGMA \+ c\] = next\[f \* SIGMA \+ c\] as number;/,
    "next[v * SIGMA + c] = 0;",
  ],
});

/** 실패 링크를 전부 뿌리로 둔다 — 「가장 긴 접미사」가 사라진다. */
const linkToRoot = await loadMutant<Impl>(REF, {
  swap: [/link\[u\] = next\[f \* SIGMA \+ c\] as number;/, "link[u] = 0;"],
});

/** 반환 직전의 순서 맞춤을 빼고 찾은 순서 그대로 돌려준다. */
const noSort = await loadMutant<Impl>(REF, {
  drop: /found\.sort\(byPosition\);/,
});

/** 변이 표 한 줄 — 정본과 변이의 답을 나란히 적고 판정한다. */
function mutantRows(
  impl: Impl,
  inputs: readonly (readonly [string, readonly string[]])[],
): string[][] {
  return inputs.map(([text, patterns]) => {
    const want = showMatches(ahoCorasick(text, [...patterns]));
    const got = showMatches(impl.ahoCorasick(text, [...patterns]));
    return [
      `"${text}"`,
      quoted(patterns),
      want,
      got,
      want === got ? "같다" : "어긋난다",
    ];
  });
}

const MUTANT_INPUTS: readonly (readonly [string, readonly string[]])[] = [
  [WALK_TEXT, WALK_P],
  ["ahishers", ["he", "she", "his", "hers"]],
  ["aaaa", ["aa"]],
];

/* ────────────────────────── 작은 예 둘 ────────────────────────── */

/** 실패 링크를 두 번 따라가야 정해지는 노드가 있는 패턴 셋. */
export const TWO_HOP = ["abcd", "bcx", "cd"] as const;

/** 출력 링크가 패턴이 안 끝나는 노드를 건너뛰는 패턴 셋. */
export const SKIP = ["a", "bax", "cba"] as const;
export const SKIP_TEXT = "cba";

/* ────────────────────────── 증명 블록 ────────────────────────── */

const autoWalk = buildAutomaton(WALK_P);
const nodesWalk = nodesOf(WALK_P);
const STEPS = walkSteps();
const byPath = new Map(nodesWalk.map((n) => [n.path, n]));

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 글자를 하나 읽을 때마다 서 있는 노드와 그 자리에서 끝나는 패턴. */
  "concept-states": () => {
    const rows = STEPS.flatMap((s) =>
      s.kind === "char"
        ? [
            [
              `"${WALK_TEXT.slice(0, s.pos + 1)}"`,
              nodeName(s.to),
              s.found.length === 0
                ? "없음"
                : s.found.map((m) => WALK_P[m.patternIndex]).join(" · "),
            ],
          ]
        : [],
    );
    const two = STEPS.filter((s) => s.kind === "char" && s.found.length > 1);
    const at = two[0] as Extract<WalkStep, { kind: "char" }>;
    return [
      md(["읽은 것", "서 있는 노드", "그 자리에서 끝나는 패턴"], rows, [
        "l",
        "l",
        "l",
      ]),
      "",
      `여섯 글자를 한 번씩 읽는 동안 되돌아가 다시 읽은 글자는 ${STEPS.filter((x) => x.kind === "char").length - WALK_TEXT.length} 개이고, 자리 ${at.pos} 에서는 패턴 ${at.found.length} 개가 함께 끝납니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 가장 단순한 방법을 수치로 반박한다. */
  "origin-cost": () => {
    const rows = [1_000, 10_000, LIMIT_TEXT].map((n) => {
      const text = "a".repeat(n);
      const brute = perPatternTimes(countBrute, text);
      const aho = countAho(text, SHARED_PATTERNS).access;
      return [num(n), num(brute), secondsOf(brute), num(aho), secondsOf(aho)];
    });
    return [
      md(
        [
          "텍스트 길이 n",
          "패턴마다 대조",
          "시간",
          "아호–코라식 자동자",
          "시간",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      `텍스트는 a 를 n 번 이어 붙인 것이고, 패턴은 앞 97 글자가 a 이고 뒤 세 글자가 a 가 아닌 길이 100 짜리 ${num(SHARED_K)} 개(길이 합 ${num(LIMIT_TOTAL)})입니다. 시간은 자료 접근을 초당 1 억 번으로 나눈 값입니다. 패턴 ${num(SHARED_K)} 개가 모양이 같아 패턴마다 대조는 패턴 하나를 센 값에 ${num(SHARED_K)} 을 곱했고, 앞 10 개를 직접 센 값이 하나를 센 값의 10 배와 같습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 전개 입력에서 같은 텍스트 글자를 몇 번 읽는가. */
  "origin-reread": () => {
    const brute = countBrute(WALK_TEXT, WALK_P);
    const rows = [...WALK_TEXT].map((ch, i) => [
      String(i),
      ch,
      String(brute.reads[i]),
      "1",
    ]);
    const total = brute.reads.reduce((a, b) => a + b, 0);
    return [
      md(
        ["자리", "글자", "패턴마다 대조가 읽은 횟수", "자동자가 읽은 횟수"],
        rows,
        ["r", "l", "r", "r"],
      ),
      "",
      `패턴마다 대조는 텍스트 글자를 모두 ${total} 번 읽었고, 자동자는 ${WALK_TEXT.length} 번 읽었습니다. 두 방법이 찾은 매칭은 ${showMatches(brute.matches)}${으로(showMatches(brute.matches))} 같습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 입력을 두 방법으로 처리하고 자료 접근을 나란히 센다. */
  "origin-two-ways": () => {
    const rows = [1, 10, 100, 1000].map((r) => {
      const text = WALK_TEXT.repeat(r);
      const b = countBrute(text, WALK_P);
      const a = countAho(text, WALK_P);
      if (showMatches(b.matches) !== showMatches(a.matches))
        throw new Error("두 방법의 답이 다르다");
      return [
        num(text.length),
        num(b.access),
        (b.access / text.length).toFixed(2),
        num(a.access),
        num(a.scan),
        (a.scan / text.length).toFixed(2),
      ];
    });
    const one = countAho(WALK_TEXT, WALK_P);
    return [
      md(
        [
          "텍스트 길이 n",
          "패턴마다 대조",
          "n 으로 나눈 값",
          "자동자 전체",
          "그중 읽는 몫",
          "n 으로 나눈 값",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      `텍스트는 "${WALK_TEXT}" 를 되풀이한 것이고 패턴은 ${WALK_P.join(" · ")} 셋입니다. 자동자 전체에서 읽는 몫을 뺀 ${num(one.access - one.scan)} 은 트라이를 만들고 링크를 채우는 몫이라 텍스트 길이와 상관없이 같습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 시작 자리마다 트라이를 다시 내려가면. */
  "origin-restart": () => {
    const r = countTrieRestart(WALK_TEXT, WALK_P);
    const rows = r.walks.map((w) => [
      String(w.start),
      w.nodes.length === 0 ? "없음" : w.nodes.join(" → "),
      String(Math.min(w.nodes.length + 1, WALK_TEXT.length - w.start)),
      w.found.length === 0 ? "없음" : showMatches(w.found),
    ]);
    const reads = r.walks.reduce(
      (a, w) => a + Math.min(w.nodes.length + 1, WALK_TEXT.length - w.start),
      0,
    );
    return [
      md(["시작 자리", "내려간 노드", "읽은 글자", "찾은 매칭"], rows, [
        "r",
        "l",
        "r",
        "l",
      ]),
      "",
      `시작 자리 여섯에서 텍스트 글자를 모두 ${reads} 번 읽었습니다. 찾은 매칭은 ${showMatches(r.matches)}${으로(showMatches(r.matches))} 정본과 같습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 네 방법을 두 입력에서 나란히 잰다. */
  "origin-candidates": () => {
    const c = originCosts();
    const row = (label: string, v: { a: number; b: number }) => [
      label,
      num(v.a),
      secondsOf(v.a),
      num(v.b),
      secondsOf(v.b),
    ];
    return [
      md(
        ["방법", "입력 가", "시간", "입력 나", "시간"],
        [
          row("패턴마다 대조", c.brute),
          row("시작 자리마다 트라이를 내려가기", c.restart),
          row("패턴마다 실패 함수", c.kmp),
          row("아호–코라식 자동자", c.aho),
        ],
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `입력 가는 앞 절의 것(텍스트 a × ${num(LIMIT_TEXT)} · 앞 97 글자가 같은 패턴 ${num(SHARED_K)} 개)이고, 입력 나는 텍스트 a × ${num(LIMIT_TEXT)} 에 패턴 a × ${num(LONG_M)} 하나입니다. 시작 자리마다 내려가기와 패턴마다 대조의 입력 나 값은 식으로 냈고, 그 식은 (n, m) = ${FORMULA_CHECKS.map(([n, m]) => `(${num(n)}, ${num(m)})`).join(" · ")} 의 ${FORMULA_CHECKS.length} 가지에서 직접 센 값과 같습니다.`,
    ].join("\n");
  },

  /** `deep.build` (c) — 노드 she 의 실패 링크를 정의대로 읽는다. */
  "build-read-one": () => {
    const pre = prefixSet(WALK_P);
    const node = "she";
    const rows: string[][] = [];
    let chosen = "";
    for (let k = 1; k <= node.length; k++) {
      const tail = node.slice(k);
      const has = pre.has(tail);
      if (has && chosen === "" && tail !== "") chosen = tail;
      rows.push([
        tail === "" ? "빈 문자열" : tail,
        String(tail.length),
        has ? "있다" : "없다",
      ]);
    }
    const link = byPath.get(node)?.link;
    if (link !== chosen) throw new Error("정의대로 고른 링크가 정본과 다르다");
    return [
      md(["진 접미사", "길이", "그 이름의 노드"], rows, ["l", "r", "l"]),
      "",
      `노드가 있는 진 접미사 가운데 가장 긴 것은 길이 ${chosen.length} 짜리 ${chosen} 입니다. 그래서 노드 ${node} 의 실패 링크는 ${chosen} 노드이고, 정본이 만든 자동자의 실패 링크도 ${link} 노드입니다.`,
    ].join("\n");
  },

  /** `deep.build` (d) — 여덟 노드의 부모 · 실패 링크 · 깊이. */
  "build-relations": () => {
    const rows = nodesWalk.map((n) => [
      nodeName(n.path),
      String(n.depth),
      n.parent === null ? "없음" : nodeName(n.parent),
      n.parent === null ? "-" : nodeName(byPath.get(n.parent)?.link ?? ""),
      n.parent === null ? "-" : nodeName(n.link),
      n.parent === null ? "-" : String(n.link.length),
    ]);
    const shallower = nodesWalk.filter(
      (n) => n.parent !== null && n.link.length < n.depth,
    ).length;
    const chain: string[] = [];
    for (let p = "she"; ; p = byPath.get(p)?.link ?? "") {
      chain.push(nodeName(p));
      if (p === "") break;
    }
    return [
      md(
        [
          "노드",
          "깊이",
          "부모",
          "부모의 실패 링크",
          "실패 링크",
          "실패 링크의 깊이",
        ],
        rows,
        ["l", "r", "l", "l", "l", "r"],
      ),
      "",
      `뿌리를 뺀 노드 ${nodesWalk.length - 1} 개 가운데 ${shallower} 개에서 실패 링크의 깊이가 자기 깊이보다 작습니다. she 에서 실패 링크를 거듭 따라가면 ${chain.join(" → ")} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` (e) — 한 패턴 안에서만 찾은 링크와 실패 링크. */
  "build-in-pattern": () => {
    const rows = nodesWalk
      .filter((n) => n.parent !== null)
      .map((n) => {
        const own = inPatternLink(n.path, WALK_P);
        return [
          nodeName(n.path),
          nodeName(own),
          nodeName(n.link),
          own === n.link ? "같다" : "다르다",
        ];
      });
    const diff = rows.filter((r) => r[3] === "다르다").map((r) => r[0]);
    const got = scanWithLinks(WALK_TEXT, WALK_P, (p) =>
      p === "" ? "" : inPatternLink(p, WALK_P),
    );
    return [
      md(["노드", "한 패턴 안에서만 찾은 링크", "실패 링크", "두 링크"], rows, [
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      `두 링크가 다른 노드는 ${diff.join(" · ")} ${diff.length} 개입니다. 한 패턴 안에서만 찾은 링크로 "${WALK_TEXT}" 를 읽으면 ${showMatches(got)} 만 나오고, 실패 링크로 읽으면 ${showMatches(ahoCorasick(WALK_TEXT, WALK_P))}${이가(showMatches(ahoCorasick(WALK_TEXT, WALK_P)))} 나옵니다.`,
    ].join("\n");
  },

  /** 1단계 — 패턴 셋을 담은 뒤의 노드 여덟. */
  "build-trie": () => {
    const rows = nodesWalk.map((n) => {
      const kids = nodesWalk
        .filter((m) => m.parent === n.path)
        .map((m) => `${m.path.at(-1)} → ${m.path}`);
      return [
        nodeName(n.path),
        String(n.depth),
        kids.length === 0 ? "없음" : kids.join(" · "),
        n.ends.length === 0
          ? "-"
          : n.ends.map((e) => `${e} 번 ${WALK_P[e]}`).join(" · "),
      ];
    });
    const total = WALK_P.reduce((a, p) => a + p.length, 0);
    return [
      md(["노드", "깊이", "자식", "여기서 끝나는 패턴"], rows, [
        "l",
        "r",
        "l",
        "l",
      ]),
      "",
      `패턴 길이의 합은 ${total} 이고 노드는 뿌리를 포함해 ${autoWalk.size} 개입니다. 패턴이 끝나는 노드는 ${nodesWalk.filter((n) => n.ends.length > 0).length} 개입니다.`,
    ].join("\n");
  },

  /** 2단계 — 얕은 노드부터 실패 링크를 정하는 차례. */
  "build-bfs": () => {
    const order = [...nodesWalk]
      .filter((n) => n.parent !== null)
      .sort((a, b) => a.depth - b.depth || a.id - b.id);
    const rows = order.map((n, i) => {
      const parent = n.parent as string;
      const ch = n.path.at(-1) as string;
      const tried: string[] = [];
      if (parent === "") tried.push("뿌리의 자식이라 뿌리");
      else {
        let f = byPath.get(parent)?.link ?? "";
        for (;;) {
          const hit = byPath.has(f + ch);
          tried.push(`${of(nodeName(f))} ${ch} 자식 ${hit ? "있다" : "없다"}`);
          if (hit || f === "") break;
          f = byPath.get(f)?.link ?? "";
        }
      }
      return [
        String(i + 1),
        String(n.depth),
        nodeName(n.path),
        nodeName(parent),
        ch,
        tried.join(" · "),
        nodeName(n.link),
      ];
    });
    return [
      md(
        [
          "차례",
          "깊이",
          "노드",
          "부모",
          "들어오는 글자",
          "부모의 실패 링크부터 찾은 자리",
          "실패 링크",
        ],
        rows,
        ["r", "r", "l", "l", "l", "l", "l"],
      ),
      "",
      `노드 ${order.length} 개를 깊이 ${order[0]?.depth} 부터 ${order.at(-1)?.depth} 까지 차례로 정했고, 어느 노드든 찾은 자리는 이미 정해진 얕은 노드입니다.`,
    ].join("\n");
  },

  /** 2단계 — 실패 링크를 두 번 따라가야 정해지는 노드. */
  "build-two-hop": () => {
    const nodes = nodesOf(TWO_HOP);
    const get = new Map(nodes.map((n) => [n.path, n]));
    const target = "abcd";
    const ch = target.at(-1) as string;
    const rows: string[][] = [];
    let f = get.get(target.slice(0, -1))?.link ?? "";
    for (let hop = 1; ; hop++) {
      const hit = get.has(f + ch);
      rows.push([String(hop), nodeName(f), `${f}${ch}`, hit ? "있다" : "없다"]);
      if (hit || f === "") break;
      f = get.get(f)?.link ?? "";
    }
    const link = get.get(target)?.link as string;
    return [
      md(["따라간 차례", "선 노드", "찾는 노드", "트라이에"], rows, [
        "r",
        "l",
        "l",
        "l",
      ]),
      "",
      `패턴이 ${TWO_HOP.join(" · ")} 일 때 노드 ${target} 의 부모 abc 의 실패 링크는 ${get.get("abc")?.link} 노드이고, 거기서 ${rows.length} 번째 자리에서 노드를 찾아 실패 링크가 ${link} 노드가 됩니다. 정의대로 고른 가장 긴 진 접미사도 ${longestProperSuffixIn(target, prefixSet(TWO_HOP))} 입니다.`,
    ].join("\n");
  },

  /** 3단계 — 여덟 노드의 전이표 가운데 글자 넷과 나머지. */
  "build-table": () => {
    const letters = ["e", "h", "r", "s"];
    let own = 0;
    let inherited = 0;
    const rows = nodesWalk.map((n) => {
      const cells = letters.map((ch) => {
        const to = autoWalk.next[n.id * SIGMA + (ch.charCodeAt(0) - 97)];
        const p = pathsOf(autoWalk)[to as number] as string;
        const child = p === n.path + ch;
        if (child) own += 1;
        else inherited += 1;
        return child ? `**${nodeName(p)}**` : nodeName(p);
      });
      let restRoot = true;
      for (let c = 0; c < SIGMA; c++) {
        if (letters.includes(ALPHABET[c] as string)) continue;
        if ((autoWalk.next[n.id * SIGMA + c] as number) !== 0) restRoot = false;
      }
      return [nodeName(n.path), ...cells, restRoot ? "뿌리" : "?"];
    });
    return [
      md(["노드", "e", "h", "r", "s", "그 밖의 22 글자"], rows, [
        "l",
        "l",
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      `굵게 적은 칸은 트라이의 자식이고, 나머지는 실패 링크가 가리키는 노드의 같은 칸을 물려받은 값입니다. 글자 넷의 칸 ${own + inherited} 개 가운데 자식이 ${own} 칸, 물려받은 칸이 ${inherited} 칸입니다.`,
    ].join("\n");
  },

  /** 4단계 — 여덟 노드의 출력 링크. */
  "build-outlink": () => {
    const rows = nodesWalk
      .filter((n) => n.parent !== null)
      .map((n) => {
        const f = byPath.get(n.link) as NodeInfo;
        return [
          nodeName(n.path),
          nodeName(n.link),
          f.ends.length > 0 ? "끝난다" : "안 끝난다",
          n.out === null ? "없음" : nodeName(n.out),
        ];
      });
    const has = rows.filter((r) => r[3] !== "없음").map((r) => r[0]);
    return [
      md(["노드", "실패 링크", "실패 링크에서 패턴이", "출력 링크"], rows, [
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      `출력 링크가 있는 노드는 ${has.join(" · ")} ${has.length} 개입니다.`,
    ].join("\n");
  },

  /** 4단계 — 출력 링크가 패턴이 안 끝나는 노드를 건너뛰는 예. */
  "build-outlink-skip": () => {
    const nodes = nodesOf(SKIP);
    const get = new Map(nodes.map((n) => [n.path, n]));
    const rows = nodes
      .filter((n) => n.parent !== null)
      .map((n) => {
        const f = get.get(n.link) as NodeInfo;
        return [
          nodeName(n.path),
          nodeName(n.link),
          f.ends.length > 0 ? "끝난다" : "안 끝난다",
          n.out === null ? "없음" : nodeName(n.out),
        ];
      });
    return [
      md(["노드", "실패 링크", "실패 링크에서 패턴이", "출력 링크"], rows, [
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      `패턴은 ${SKIP.join(" · ")} 입니다. 노드 cba 의 실패 링크 ba 에서는 패턴이 끝나지 않고, 출력 링크는 ba 를 건너뛰어 ${get.get("cba")?.out} 노드를 가리킵니다. 텍스트 "${SKIP_TEXT}" 를 읽으면 ${showMatches(ahoCorasick(SKIP_TEXT, [...SKIP]))}${이가(showMatches(ahoCorasick(SKIP_TEXT, [...SKIP])))} 나옵니다.`,
    ].join("\n");
  },

  /** 5단계 — 자리 3 에서 출력 링크 사슬을 따라 매칭을 거둔다. */
  "build-collect": () => {
    const s = STEPS.find(
      (x) => x.kind === "char" && x.chain.length > 1,
    ) as Extract<WalkStep, { kind: "char" }>;
    const rows = s.chain.map((p) => {
      const n = byPath.get(p) as NodeInfo;
      return [
        nodeName(p),
        String(n.depth),
        n.ends.length === 0 ? "없음" : n.ends.map((e) => `${e} 번`).join(" · "),
        n.ends.length === 0
          ? "-"
          : `${s.pos} − ${n.depth} + 1 = ${s.pos - n.depth + 1}`,
      ];
    });
    return [
      md(
        ["사슬의 노드", "깊이", "끝나는 패턴", "시작 자리 pos − 깊이 + 1"],
        rows,
        ["l", "r", "l", "l"],
      ),
      "",
      `자리 ${s.pos} 의 글자 ${s.ch} 를 읽고 ${s.to} 노드에 서면 사슬에 노드가 ${s.chain.length} 개 있고, 매칭 ${showMatches(s.found)}${이가(showMatches(s.found))} 나옵니다.`,
    ].join("\n");
  },

  /** 전제 — 문자 집합이 커지면 전이표가 얼마가 되는가. */
  "build-premise-sigma": () => {
    const cap = LIMIT_TOTAL + 1;
    const rows = [
      ["소문자 영문", 26],
      ["바이트", 256],
      ["유니코드 기본 평면", 65_536],
    ].map(([label, sigma]) => {
      const cells = (sigma as number) * cap;
      const mb = (cells * 4) / 1_000_000;
      return [
        label as string,
        num(sigma as number),
        num(cells),
        `${mb.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB`,
        mb <= 256 ? "든다" : "넘는다",
      ];
    });
    const real = buildAutomaton(["a".repeat(LIMIT_TOTAL)]);
    if (real.next.length !== SIGMA * cap)
      throw new Error("정본의 전이표 칸이 Σ(L+1) 이 아니다");
    return [
      md(
        [
          "문자 집합",
          "Σ",
          "전이표 칸 Σ(L + 1)",
          "칸마다 4 바이트",
          "256 MB 에",
        ],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      `L = ${num(LIMIT_TOTAL)} 에서 정본의 전이표는 ${num(real.next.length)} 칸이고, Σ 를 바꾼 두 줄은 같은 식 Σ(L + 1) 에 넣은 값입니다.`,
    ].join("\n");
  },

  /** 설계 선택 — 전이표를 어디까지 펼칠지 여덟 가지로 실제 시험한다. */
  "build-expand": () => {
    const m = 64;
    const auto = buildAutomaton(["a".repeat(m)]);
    const text = `${"a".repeat(m)}b`.repeat(4);
    const want = ahoCorasick(text, ["a".repeat(m)]).length;
    const rows = [0, 1, 2, 4, 8, 16, 32, 64].map((d) => {
      const r = scanWithDepth(auto, text, d);
      if (r.matches !== want) throw new Error("펼친 깊이를 바꾸니 답이 바뀐다");
      return [String(d), num(r.cells), num(r.access), num(r.worst)];
    });
    return [
      md(
        [
          "펼친 깊이 d",
          "저장 칸",
          "읽는 몫의 자료 접근",
          "한 글자에 든 가장 많은 자료 접근",
        ],
        rows,
        ["r", "r", "r", "r"],
      ),
      "",
      `패턴은 a 를 ${m} 번 이어 붙인 하나이고, 텍스트는 a × ${m} 다음 b 를 4 번 이어 붙인 ${num(text.length)} 글자입니다. 여덟 줄 모두 매칭 ${want} 개로 답이 같습니다.`,
    ].join("\n");
  },

  /** `deep.walk` 1 — 패턴 셋을 담은 결과. */
  "walk-trie": () =>
    columns([
      ["노드 수", `${autoWalk.size}`],
      ...nodesWalk
        .filter((n) => n.ends.length > 0)
        .map((n) => [
          `endOf[${n.id}]`,
          `[${n.ends.join(", ")}]   노드 ${n.path}`,
        ]),
    ]),

  /** `deep.walk` 2 — 큐에서 꺼낸 차례와 링크 둘. */
  "walk-links": () => {
    const order = [...nodesWalk]
      .filter((n) => n.parent !== null)
      .sort((a, b) => a.depth - b.depth || a.id - b.id);
    return columns([
      ["큐에서 꺼낸 차례", order.map((n) => n.path).join(" ")],
      [
        "실패 링크",
        order.map((n) => `${n.path}→${nodeName(n.link)}`).join(" "),
      ],
      [
        "출력 링크",
        order
          .filter((n) => n.out !== null)
          .map((n) => `${n.path}→${nodeName(n.out as string)}`)
          .join(" "),
      ],
    ]);
  },

  /** 짚고 가기 — 자식이 없는 칸을 뿌리로 두면. */
  pauseEmptyCell: () => {
    const rows = mutantRows(emptyCellToRoot, MUTANT_INPUTS);
    const bad = rows.filter((r) => r[4] === "어긋난다").length;
    return [
      md(
        ["텍스트", "패턴", "정본이 낸 매칭", "빈 칸을 뿌리로 둔 답", "판정"],
        rows,
        ["l", "l", "l", "l", "l"],
      ),
      "",
      `입력 ${rows.length} 개 가운데 ${bad} 개에서 답이 어긋납니다.`,
    ].join("\n");
  },

  /** `deep.walk` 3 — 읽기만 따로 실행한 결과(정렬 전). */
  "walk-scan": () => {
    const chars = STEPS.filter(
      (s): s is Extract<WalkStep, { kind: "char" }> => s.kind === "char",
    );
    return columns([
      ["pos", "글자", "옮긴 뒤의 노드", "거둔 매칭"],
      ...chars.map((s) => [
        String(s.pos),
        s.ch,
        nodeName(s.to),
        s.found.length === 0 ? "-" : showMatches(s.found),
      ]),
    ]);
  },

  /** 짚고 가기 — 출력 링크 대신 실패 링크를 따라가도 답은 같다. */
  pauseOutputLink: () => {
    const m = 64;
    const n = 1000;
    const inputs: [string, string, string[]][] = [
      [`"${WALK_TEXT}" · 패턴 ${WALK_P.length} 개`, WALK_TEXT, WALK_P],
      [`"${SKIP_TEXT}" · 패턴 ${SKIP.join(" · ")}`, SKIP_TEXT, [...SKIP]],
      [`a × ${num(n)} · 패턴 a × ${m} 하나`, "a".repeat(n), ["a".repeat(m)]],
    ];
    const rows = inputs.map(([label, text, patterns]) => {
      const auto = buildAutomaton(patterns);
      const o = collectByOutLink(auto, text);
      const f = collectByFailLink(auto, text);
      return [
        label,
        num(o.visits),
        num(f.visits),
        num(o.matches.length),
        showMatches(o.matches) === showMatches(f.matches) ? "같다" : "어긋난다",
      ];
    });
    const last = rows.at(-1) as string[];
    const ratio = (
      Number((last[2] as string).replaceAll(",", "")) /
      Number((last[1] as string).replaceAll(",", ""))
    ).toFixed(1);
    return [
      md(
        [
          "입력",
          "출력 링크로 들른 노드",
          "실패 링크로 들른 노드",
          "매칭 수",
          "답",
        ],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      `세 입력 모두 답이 같고, 들른 노드 수는 마지막 줄에서 ${ratio} 배 갈립니다.`,
    ].join("\n");
  },

  /** `deep.walk` 4 — 고정 입력을 끝까지 실행한다. */
  walkTrace: () => {
    const rows = STEPS.map((s) => {
      if (s.kind === "build")
        return [`T${s.t}`, "패턴 셋을 트라이에 담는다", "-", "뿌리", "-", "-"];
      if (s.kind === "links")
        return [
          `T${s.t}`,
          "실패 링크 · 전이표 · 출력 링크를 채운다",
          "-",
          "뿌리",
          "-",
          "-",
        ];
      if (s.kind === "sort")
        return [
          `T${s.t}`,
          "시작 자리 순서로 맞춰 돌려준다",
          "-",
          "-",
          "-",
          showMatches(s.result),
        ];
      const how =
        s.how === "child"
          ? `${of(nodeName(s.from))} ${s.ch} 자식`
          : s.how === "root"
            ? `${of(nodeName(s.from))} ${s.ch} 칸이 뿌리`
            : `${of(nodeName(s.from))} ${s.ch} 칸을 ${s.via.map(nodeName).join(" → ")} 에서 물려받음`;
      return [
        `T${s.t}`,
        `자리 ${s.pos} 의 글자 ${s.ch}`,
        how,
        nodeName(s.to),
        s.chain.map(nodeName).join(" → "),
        s.found.length === 0 ? "-" : showMatches(s.found),
      ];
    });
    const two = STEPS.find(
      (s) => s.kind === "char" && s.found.length > 1,
    ) as Extract<WalkStep, { kind: "char" }>;
    const inh = STEPS.find(
      (s) => s.kind === "char" && s.how === "inherit",
    ) as Extract<WalkStep, { kind: "char" }>;
    return [
      md(
        [
          "걸음",
          "하는 일",
          "옮긴 길",
          "옮긴 뒤의 노드",
          "출력 링크 사슬",
          "이 걸음의 매칭",
        ],
        rows,
        ["l", "l", "l", "l", "l", "l"],
      ),
      "",
      `매칭은 패턴 번호@시작 자리 입니다. T${two.t} 한 걸음이 매칭 ${two.found.length} 개를 내고, T${inh.t} 은 자식이 없어 물려받은 칸으로 옮긴 걸음입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 4 — 갈래마다 실행된 걸음. */
  branchCoverage: () => {
    const chars = STEPS.filter(
      (s): s is Extract<WalkStep, { kind: "char" }> => s.kind === "char",
    );
    const ts = (xs: readonly { t: number }[]) =>
      xs.length === 0 ? "없음" : xs.map((x) => `T${x.t}`).join(" · ");
    const rootEmpty = SIGMA - new Set(WALK_P.map((p) => p[0])).size;
    const inheritCells = nodesWalk
      .filter((n) => n.parent !== null)
      .reduce((a, n) => {
        let k = 0;
        for (let c = 0; c < SIGMA; c++) {
          const to = autoWalk.next[n.id * SIGMA + c] as number;
          if ((autoWalk.depth[to] as number) !== n.depth + 1) k += 1;
        }
        return a + k;
      }, 0);
    const rows = [
      [
        "①",
        "자식이 없을 때만 노드를 만든다",
        "T1",
        `노드 ${autoWalk.size - 1} 개를 만든다`,
      ],
      ["②", "패턴이 끝난 노드에 번호를 적는다", "T1", `${WALK_P.length} 번`],
      [
        "③",
        "뿌리에 없는 글자는 뿌리 자신으로",
        "T2",
        `${rootEmpty} 칸을 적는다`,
      ],
      [
        "④",
        "출력 링크를 실패 링크에서 물려받는다",
        "T2",
        `${nodesWalk.length - 1} 노드`,
      ],
      [
        "⑤",
        "자식 없는 칸을 실패 링크에서 물려받는다",
        "T2",
        `${inheritCells} 칸을 적는다`,
      ],
      ["⑥", "글자 하나에 표를 한 번 조회한다", ts(chars), `${chars.length} 번`],
      [
        "⑦",
        "출력 링크를 따라가며 거둔다",
        ts(chars.filter((s) => s.found.length > 0)),
        `매칭 ${chars.reduce((a, s) => a + s.found.length, 0)} 개`,
      ],
      ["⑧", "시작 자리 순서로 맞춘다", `T${STEPS.length}`, "1 번"],
    ];
    return [
      md(["라벨", "하는 일", "실행된 걸음", "횟수"], rows, [
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      `라벨 ${rows.length} 개가 모두 한 번 이상 실행됐습니다. 전이표에서 ③ 이 읽힌 걸음은 ${ts(chars.filter((s) => s.how === "root"))} 이고, ⑤ 가 읽힌 걸음은 ${ts(chars.filter((s) => s.how === "inherit"))} 입니다.`,
    ].join("\n");
  },

  /** 짚고 가기 — 찾은 순서는 끝난 자리의 순서다. */
  pauseSort: () => {
    const rows = mutantRows(noSort, [
      ["xaby", ["ab", "xaby"]],
      [WALK_TEXT, WALK_P],
    ]);
    return [
      md(
        ["텍스트", "패턴", "정본이 낸 순서", "순서를 안 맞춘 답", "판정"],
        rows,
        ["l", "l", "l", "l", "l"],
      ),
      "",
      `첫 줄은 담긴 매칭이 같고 순서만 다릅니다. 둘째 줄은 전개 입력이고 두 순서가 같습니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 전개 입력과 경계 입력에 실행한다. */
  finalRun: () => {
    const cases: [string, string[]][] = [
      [WALK_TEXT, WALK_P],
      ["ahishers", ["he", "she", "his", "hers"]],
      ["aaaa", ["aa"]],
      ["abc", ["abc", "bc"]],
      ["abcdef", ["xyz", "qrs"]],
      ["ab", ["abcdef"]],
      ["abab", ["ab", "ab"]],
      ["a", ["a"]],
    ];
    return columns(
      cases.map(([text, patterns]) => [
        `ahoCorasick("${text}", [${patterns.map((p) => `"${p}"`).join(", ")}])`,
        `→  ${showMatches(ahoCorasick(text, patterns))}`,
      ]),
    );
  },

  /** `related` — 값 하나가 기대는 값의 깊이. */
  "related-order": () => {
    const rows = nodesWalk
      .filter((n) => n.parent !== null && n.parent !== "")
      .sort((a, b) => a.depth - b.depth || a.id - b.id)
      .map((n) => {
        const f = byPath.get(n.parent as string)?.link ?? "";
        return [
          `link[${n.path}]`,
          `${nodeName(f)} 줄의 ${n.path.at(-1)} 칸`,
          String(n.depth),
          String(f.length),
        ];
      });
    return [
      md(
        [
          "정하려는 값",
          "먼저 정해져 있어야 하는 값",
          "노드의 깊이",
          "기대는 노드의 깊이",
        ],
        rows,
        ["l", "l", "r", "r"],
      ),
      "",
      `${rows.length} 줄 모두 기대는 노드가 더 얕고, 깊이 차는 가장 작은 것이 ${Math.min(...rows.map((r) => Number(r[2]) - Number(r[3])))} 입니다.`,
    ].join("\n");
  },

  /** `purpose.alt` — 두 설계를 같은 입력에 걸고 자료 접근을 나란히 센다. */
  altCounts: () => {
    const bench = {
      aho: altCases["아호–코라식 자동자"](),
      kmp: altCases["패턴마다 실패 함수"](),
    };
    const rows = PATTERN_COUNTS.map((k) => {
      const a = bench.aho[`패턴 ${k} 개 · 자료 접근`] as number;
      const b = bench.kmp[`패턴 ${k} 개 · 자료 접근`] as number;
      const len = (makePatterns(ALT_TEXT, k, PATTERN_TOTAL)[0] as string)
        .length;
      return [
        num(k),
        num(len),
        num(a),
        num(b),
        a < b ? "아호–코라식 자동자" : "패턴마다 실패 함수",
      ];
    });
    const first = PATTERN_COUNTS[0];
    const last = PATTERN_COUNTS[PATTERN_COUNTS.length - 1] as number;
    const firstA = bench.aho[`패턴 ${first} 개 · 자료 접근`] as number;
    const firstB = bench.kmp[`패턴 ${first} 개 · 자료 접근`] as number;
    const lastA = bench.aho[`패턴 ${last} 개 · 자료 접근`] as number;
    const lastB = bench.kmp[`패턴 ${last} 개 · 자료 접근`] as number;
    return [
      md(
        [
          "패턴 수 k",
          "패턴 하나의 길이",
          "아호–코라식 자동자",
          "패턴마다 실패 함수",
          "적은 쪽",
        ],
        rows,
        ["r", "r", "r", "r", "l"],
      ),
      "",
      `텍스트 ${num(TEXT_LENGTH)} 글자와 패턴 길이의 합 ${num(PATTERN_TOTAL)} 을 고정하고 패턴 수만 바꿨습니다. 네 줄 모두 두 설계의 답이 정본과 같습니다. 패턴 ${num(first)} 개에서는 패턴마다 실패 함수가 ${(firstA / firstB).toFixed(1)} 배 적고, ${num(last)} 개에서는 아호–코라식 자동자가 ${(lastB / lastA).toFixed(1)} 배 적습니다.`,
    ].join("\n");
  },

  /** `purpose.alt` — 저장 칸은 뒤집히지 않는다. */
  altCells: () => {
    const rows = [1, 1000].map((k) => {
      const patterns = makePatterns(ALT_TEXT, k, PATTERN_TOTAL);
      const a = countAho(ALT_TEXT, patterns).cells;
      const b = countKmpEach(ALT_TEXT, patterns).cells;
      return [
        num(k),
        num(a),
        num(b),
        a < b ? "아호–코라식 자동자" : "패턴마다 실패 함수",
      ];
    });
    return [
      md(
        ["패턴 수 k", "아호–코라식 자동자", "패턴마다 실패 함수", "적은 쪽"],
        rows,
        ["r", "r", "r", "l"],
      ),
      "",
      "두 줄 모두 패턴마다 실패 함수 쪽이 적습니다.",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 검산한다. */
  mathCheck: () => {
    const rows: string[][] = [];
    for (const [n, m] of [
      [20, 5],
      [50, 9],
      [200, 9],
      [200, 19],
    ] as [number, number][]) {
      const patterns = Array.from({ length: m }, (_, j) => "a".repeat(j + 1));
      const total = patterns.reduce((a, p) => a + p.length, 0);
      const got = ahoCorasick("a".repeat(n), patterns).length;
      const formula = m * (n + 1) - (m * (m + 1)) / 2;
      rows.push([
        num(n),
        num(m),
        num(total),
        num(formula),
        num(got),
        formula === got ? "같다" : "다르다",
      ]);
    }
    return [
      md(
        [
          "텍스트 길이 n",
          "길이 가짓수 m",
          "길이 합",
          "식이 낸 값",
          "실행이 낸 매칭 수",
          "두 값",
        ],
        rows,
        ["r", "r", "r", "r", "r", "l"],
      ),
      "",
      "패턴은 a · aa · aaa … 를 m 개까지이고, 텍스트는 a 를 n 번 이어 붙인 것입니다. 네 줄 모두 식과 실행이 같습니다.",
    ].join("\n");
  },

  /** `deep.math` ④ — 과제 규모를 식에 넣어 수치를 낸다. */
  mathBound: () => {
    let m = 0;
    while (((m + 1) * (m + 2)) / 2 <= LIMIT_TOTAL) m += 1;
    const zMax = m * (LIMIT_TEXT + 1) - (m * (m + 1)) / 2;
    const rows = [m - 1, m, m + 1].map((x) => [
      num(x),
      num((x * (x + 1)) / 2),
      (x * (x + 1)) / 2 <= LIMIT_TOTAL ? "든다" : "넘는다",
      num(x * (LIMIT_TEXT + 1) - (x * (x + 1)) / 2),
    ]);
    return [
      md(
        [
          "길이 가짓수 m",
          "길이 합 m(m+1)/2",
          `L = ${num(LIMIT_TOTAL)} 안에`,
          "매칭 수 상한",
        ],
        rows,
        ["r", "r", "l", "r"],
      ),
      "",
      `서로 다른 패턴만 담으면 매칭 수는 많아야 ${num(zMax)} 개입니다. 같은 패턴을 여러 벌 담을 수 있으면 길이 1 짜리 패턴 ${num(LIMIT_TOTAL)} 벌이 텍스트 ${num(LIMIT_TEXT)} 자리에서 모두 끝나 ${num(LIMIT_TEXT * LIMIT_TOTAL)} 개가 됩니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 걸음마다 노드가 정의와 같은지 값으로 확인한다. */
  invariantStates: () => {
    const chars = STEPS.filter(
      (s): s is Extract<WalkStep, { kind: "char" }> => s.kind === "char",
    );
    let same = 0;
    const rows = chars.map((s) => {
      const want = longestSuffixPrefix(WALK_TEXT, s.pos, WALK_P);
      if (want === s.to) same += 1;
      return [
        `T${s.t}`,
        String(s.pos),
        `"${WALK_TEXT.slice(0, s.pos + 1)}"`,
        nodeName(want),
        nodeName(s.to),
        want === s.to ? "같다" : "다르다",
      ];
    });
    return [
      md(
        [
          "걸음",
          "자리",
          "여기까지 읽은 것",
          "정의대로 고른 가장 긴 것",
          "서 있는 노드",
          "두 값",
        ],
        rows,
        ["l", "r", "l", "l", "l", "l"],
      ),
      "",
      `넷째 열은 읽은 것의 접미사를 긴 것부터 전부 만들어 패턴의 접두사인 첫 것을 고른 값이고, ${rows.length} 걸음 가운데 ${same} 걸음에서 서 있는 노드와 같습니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력들. */
  invariantEdges: () => {
    const cases: [string, string, string[]][] = [
      ["텍스트 한 글자", "a", ["a"]],
      ["패턴이 텍스트보다 길다", "ab", ["abcdef"]],
      ["패턴이 텍스트 그 자체", "abc", ["abc"]],
      ["첫 글자부터 어긋난다", "zzz", ["a", "b"]],
      ["한 자리에서 여럿이 끝난다", "aaaa", ["a", "aa", "aaa"]],
      ["같은 패턴 두 벌", "ab", ["ab", "ab"]],
    ];
    return [
      md(
        ["경우", "텍스트", "패턴", "매칭", "개수"],
        cases.map(([label, text, patterns]) => {
          const r = ahoCorasick(text, patterns);
          return [
            label,
            `"${text}"`,
            quoted(patterns),
            showMatches(r),
            String(r.length),
          ];
        }),
        ["l", "l", "l", "l", "r"],
      ),
      "",
      `${cases.length} 줄 가운데 ${cases.filter(([, text, patterns]) => showMatches(ahoCorasick(text, patterns)) === showMatches(countBrute(text, patterns).matches)).length} 줄이 패턴마다 모든 시작 자리에서 대조한 답과 같습니다.`,
    ].join("\n");
  },

  /** `invariant` ③ — 실패 링크를 전부 뿌리로 두면. */
  mutantLinkRoot: () => {
    const rows = mutantRows(linkToRoot, MUTANT_INPUTS);
    const broken = linkToRoot.buildAutomaton(WALK_P);
    const path = pathsOf(autoWalk);
    const moved = nodesWalk
      .filter((n) => n.parent !== null)
      .filter((n) => (autoWalk.link[n.id] as number) !== broken.link[n.id])
      .map(
        (n) =>
          `${n.path} (${nodeName(n.link)} → ${nodeName(path[broken.link[n.id] as number] as string)})`,
      );
    return [
      md(
        [
          "텍스트",
          "패턴",
          "정본이 낸 매칭",
          "실패 링크를 뿌리로 둔 답",
          "판정",
        ],
        rows,
        ["l", "l", "l", "l", "l"],
      ),
      "",
      `전개 입력의 자동자에서 실패 링크가 바뀐 노드는 ${moved.join(" · ")} ${moved.length} 개입니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 전개 입력의 자료 접근을 무리별로 센다. */
  perfCount: () => {
    const c = countAho(WALK_TEXT, WALK_P);
    const k = WALK_P.length;
    const L = WALK_P.reduce((a, p) => a + p.length, 0);
    const V = c.nodes;
    const n = WALK_TEXT.length;
    const z = c.matches.length;
    const insertF = 2 * k + 3 * L + 3 * (V - 1);
    const fillF = 2 * SIGMA + (3 * SIGMA + 5) * (V - 1) + c.inheritOut;
    const scanF = 2 * n + 2 * c.visits + 3 * z;
    if (insertF !== c.insert || fillF !== c.fill || scanF !== c.scan)
      throw new Error("무리별 식이 계수기와 다르다");
    return [
      md(
        ["무리", "걸음", "식", "식에 넣은 값", "센 값"],
        [
          [
            "패턴을 담는다",
            "T1",
            "2k + 3L + 3(V − 1)",
            `${2 * k} + ${3 * L} + ${3 * (V - 1)}`,
            num(c.insert),
          ],
          [
            "링크와 전이표를 채운다",
            "T2",
            "2Σ + (3Σ + 5)(V − 1) + e",
            `${2 * SIGMA} + ${(3 * SIGMA + 5) * (V - 1)} + ${c.inheritOut}`,
            num(c.fill),
          ],
          [
            "텍스트를 읽고 거둔다",
            "T3~T8",
            "2n + 2w + 3z",
            `${2 * n} + ${2 * c.visits} + ${3 * z}`,
            num(c.scan),
          ],
          ["합계", "-", "-", "-", num(c.access)],
        ],
        ["l", "l", "l", "l", "r"],
      ),
      "",
      `k = ${k} · L = ${L} · V = ${V} · n = ${n} · z = ${z} 이고, e = ${c.inheritOut} 은 실패 링크가 가리키는 노드에서 패턴이 안 끝나 그 노드의 출력 링크를 읽은 노드 수, w = ${c.visits}${은는(c.visits)} 출력 링크 사슬에서 들른 노드 수입니다. 세 무리 모두 식과 센 값이 같습니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 축마다 최악을 만드는 입력이 다르다. */
  worstShape: () => {
    const shapes: [string, string[]][] = [
      [
        "첫 글자부터 서로 다른 패턴 20 개",
        Array.from({ length: 20 }, (_, i) =>
          (ALPHABET[i] as string).repeat(50),
        ),
      ],
      [
        "앞 49 글자가 같은 패턴 20 개",
        Array.from(
          { length: 20 },
          (_, i) => "a".repeat(49) + (ALPHABET[i] as string),
        ),
      ],
      ["길이 1,000 짜리 패턴 하나", ["a".repeat(1000)]],
      [
        "a · aa · aaa … 44 개",
        Array.from({ length: 44 }, (_, j) => "a".repeat(j + 1)),
      ],
    ];
    const n = 1000;
    const text = "a".repeat(n);
    const rows = shapes.map(([label, patterns]) => {
      const c: AhoCount = countAho(text, patterns);
      return [
        label,
        num(patterns.reduce((a, p) => a + p.length, 0)),
        num(c.nodes),
        num(c.insert + c.fill),
        num(c.scan),
        num(c.matches.length),
      ];
    });
    return [
      md(
        [
          "패턴의 모양",
          "길이 합",
          "노드 수",
          "만드는 몫",
          "읽는 몫",
          "매칭 수",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `텍스트는 네 줄 모두 a 를 ${num(n)} 번 이어 붙인 것이고, 셋째 열부터 다섯째 열까지는 자료 접근입니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 과제 규모에서 축마다의 최악. */
  worstScale: () => {
    const one = countAho("a".repeat(LIMIT_TEXT), ["a".repeat(LIMIT_TOTAL)]);
    let m = 0;
    while (((m + 1) * (m + 2)) / 2 <= LIMIT_TOTAL) m += 1;
    const zMax = m * (LIMIT_TEXT + 1) - (m * (m + 1)) / 2;
    return [
      md(
        ["최악으로 만들 축", "입력", "과제 규모에서의 값"],
        [
          [
            "노드 수",
            `길이 ${num(LIMIT_TOTAL)} 짜리 패턴 하나`,
            num(one.nodes),
          ],
          ["만드는 몫의 자료 접근", "같은 입력", num(one.insert + one.fill)],
          ["저장 칸", "같은 입력", num(one.cells)],
          [
            "매칭 수(서로 다른 패턴)",
            `a 부터 a × ${m} 까지 ${m} 개 · 텍스트 a × ${num(LIMIT_TEXT)}`,
            num(zMax),
          ],
          [
            "읽는 몫에서 글자마다 표 조회",
            "어떤 입력이든",
            `글자마다 1 번, 모두 ${num(LIMIT_TEXT)} 번`,
          ],
        ],
        ["l", "l", "r"],
      ),
      "",
      `첫 세 줄은 텍스트 a × ${num(LIMIT_TEXT)} 에 실제로 실행한 값이고, 넷째 줄은 「수식 정의와 유도」의 상한 식에 넣은 값입니다.`,
    ].join("\n");
  },

  /** `selfcheck` — T7 한 줄. */
  "selfcheck-t7": () => {
    const s = STEPS.find(
      (x) => x.kind === "char" && x.how === "inherit",
    ) as Extract<WalkStep, { kind: "char" }>;
    const from = byPath.get(s.from) as NodeInfo;
    const to = byPath.get(s.to) as NodeInfo;
    return columns([
      [
        `T${s.t}`,
        `자리 ${s.pos} 의 글자 ${s.ch}`,
        `${s.from}(깊이 ${from.depth}) → ${s.to}(깊이 ${to.depth})`,
      ],
    ]);
  },
};

/* ────────── 걸음 기록이 정본과 같은 자동자를 가리키는가 — 읽힐 때 스스로 확인한다 ────────── */
{
  const want = showMatches(ahoCorasick(WALK_TEXT, WALK_P));
  const last = STEPS.at(-1);
  if (last?.kind !== "sort" || showMatches(last.result) !== want) {
    throw new Error("걸음 기록의 마지막 답이 정본과 다르다");
  }
  const pre = prefixSet(WALK_P);
  for (const n of nodesWalk) {
    if (!pre.has(n.path)) throw new Error(`노드 ${n.path} 가 접두사가 아니다`);
    if (n.parent !== null && n.link !== longestProperSuffixIn(n.path, pre)) {
      throw new Error(`노드 ${n.path} 의 실패 링크가 정의와 다르다`);
    }
  }
  if (nodesWalk.length !== pre.size)
    throw new Error("노드 수가 접두사 수와 다르다");
}
