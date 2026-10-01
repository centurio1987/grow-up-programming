/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/string/suffixAutomaton/suffixAutomaton-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 상태를 밖으로 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 걸음도 계수도 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이
 * 진다** — 아래 표의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은
 * 걸음과 계수만 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때
 * 확인한다.
 *
 * **큰 입력에는 걸음 기록을 남기지 않는다**(`built(s, false)`). 걸음마다 상태 전체를 베끼는
 * 기록은 글자 수의 제곱만큼 메모리를 먹어, 10 만 글자에서 출력 없이 죽는다.
 *
 * **자리는 0 부터 센다.** 이웃한 문자열 편(아호–코라식 자동자 · 접미사 배열)과 그림의 인덱스 줄이
 * 0 부터다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 생성자가 정본과 **같은 객체인가**로 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import { SuffixAutomaton } from "./suffixAutomaton-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 문자열. 다섯 글자다.
 *
 * 세 갈래를 한 입력에서 전부 실행한다 — 접미사 링크를 끝까지 거슬러 올라가 뿌리로 잇는 갈래(자리
 * 0·2), 길이가 이어져 그대로 잇는 갈래(자리 1·3), 길이가 어긋나 복제 상태를 만드는 갈래(자리 4)다.
 * 복제가 마지막 글자에서 한 번만 일어나므로 그 앞뒤를 나란히 볼 수 있다.
 */
export const WALK = "aabab";

/** 전개가 던지는 검색 문자열 — 하나는 부분 문자열이고 하나는 아니다. */
export const WALK_QUERIES = ["aba", "bb"];

/**
 * 전이 표를 복사하지 않고 함께 쓴 판이 답을 바꾸는 **가장 짧은** 문자열.
 *
 * 알파벳 `{a, b}` 의 길이 1~6 문자열을 전수로 검사해 얻었다(길이 5 까지는 한 자리도 없다).
 * 값이 맞는지는 `pause-share-next` 블록이 전수 검사를 다시 돌려 확인한다.
 */
export const SHARE_BREAKS = "abbaba";

/** 과제 규모의 최댓값. */
export const N_LIMIT = 100_000;

/** 초당 단순 연산 수 — 흔한 채점 환경의 예산을 시간으로 옮길 때 쓴다. */
export const OPS_PER_SEC = 100_000_000;

/* ────────────────────── 문자열 가족 ────────────────────── */

/** 같은 글자만 되풀이한다 — 상태가 가장 적게 생기는 모양이다. */
export const sameChar = (n: number): string => "a".repeat(n);

/** 첫 글자만 다르고 나머지가 같다 — 상태 수가 상한을 정확히 친다. */
export const onePrefix = (n: number): string => `a${"b".repeat(n - 1)}`;

/** 앞뒤가 다르고 가운데가 같다 — 전이 수가 상한을 정확히 친다. */
export const twoEnds = (n: number): string =>
  n >= 3 ? `a${"b".repeat(n - 2)}c` : "ab";

/** 두 글자를 번갈아 쓴다. */
export const alternating = (n: number): string => "ab".repeat(n).slice(0, n);

/** 알파벳 스물여섯 글자를 차례로 되풀이한다. */
export const cycle26 = (n: number): string =>
  Array.from({ length: n }, (_, i) => String.fromCharCode(97 + (i % 26))).join(
    "",
  );

/**
 * 무작위 26 글자 — 결정론적 난수(mulberry32, 씨앗 `0x9e3779b9`)로 스물여섯 글자에서 고른다.
 * 씨앗이 고정이라 실행마다 같은 문자열이다. 접미사 배열 · 카사이 LCP 편과 같은 생성식이다.
 */
export function varied(n: number): string {
  let a = 0x9e3779b9;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    out.push(String.fromCharCode(97 + (((t ^ (t >>> 14)) >>> 0) % 26)));
  }
  return out.join("");
}

/* ────────────────────── 표를 그리는 도구 ────────────────────── */

/** 고정폭 화면에서 한글은 두 칸을 먹는다. 글자 수로 맞추면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** `1,024` 꼴 — 본문 표기와 같다. */
export const num = (n: number): string => n.toLocaleString("en-US");

/** 초당 1 억 번 기준 시간. */
export const secondsOf = (ops: number): string => {
  const s = ops / OPS_PER_SEC;
  if (s >= 1000) return `${num(Math.round(s))} 초`;
  if (s < 0.001) return "0.001 초 미만";
  return `${s.toFixed(s < 1 ? 3 : 1)} 초`;
};

/** `2,771.5` 꼴 — 소수 첫째 자리까지 남기고 천 단위를 끊는다. */
const ratio = (a: number, b: number): string =>
  (Math.round((a / b) * 10) / 10).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

/** `0 2 4` 꼴 — 집합의 원소를 자리 사이에 하나씩 띄워 적는다. */
export const spaced = (a: readonly number[]): string =>
  a.length === 0 ? "없음" : a.join(" ");

/** 문자열 여럿 — 빈 문자열은 그렇게 적는다. */
export const words = (a: readonly string[]): string =>
  a.map((w) => (w === "" ? "빈 문자열" : w)).join(" · ");

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

/** 표 아래에 문장을 붙인 블록. 원고는 `<!--/proof-->` 로 닫아 문장까지 대조한다. */
const block = (...parts: string[]): string => parts.join("\n\n");

/** 펜스 안에 싣는 짧은 결과 — 열 폭을 값에서 잰다. */
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

/* ────────────────── 세는 사본 — 이 글이 세우는 절차 ────────────────── */

/** 글자 하나를 붙이는 동안 일어난 일. */
export interface CharStep {
  /** 글자 자리. 0 부터 센다. */
  pos: number;
  c: string;
  /** 이 글자를 받기 전의 `last`. */
  last: number;
  cur: number;
  /** ③ 이 `c` 전이를 새로 적은 상태들. */
  filled: number[];
  /** ③ 이 멈춘 자리. `-1` 이면 뿌리를 지나쳤다. */
  stopAt: number;
  kind: "뿌리로 잇는다" | "길이가 이어진다" | "복제한다";
  q: number | null;
  clone: number | null;
  /** ⑦ 이 `c` 전이를 복제 상태로 바꾼 상태들. */
  rewired: number[];
  /** 이 글자를 끝낸 뒤의 상태 전체. */
  len: number[];
  link: number[];
  next: Map<string, number>[];
}

export interface Built {
  len: number[];
  link: number[];
  next: Map<string, number>[];
  steps: CharStep[];
  /** 자료 접근 — 배열 칸이나 전이 표 항목을 읽거나 쓴 것과 문자열 글자를 읽은 것. */
  ops: number;
  states: number;
  trans: number;
  fillSteps: number;
  rewireSteps: number;
  clones: number;
  /** 복제가 물려받으며 복사한 전이 항목 수. */
  copied: number;
}

/**
 * 정본과 같은 절차에 걸음 기록과 계수만 덧붙인 사본.
 *
 * `keepSteps` 가 `false` 면 걸음 기록을 남기지 않는다 — 큰 입력에서는 반드시 그렇게 부른다.
 */
export function built(s: string, keepSteps = true): Built {
  const len = [0];
  const link = [-1];
  const next: Map<string, number>[] = [new Map()];
  const steps: CharStep[] = [];
  let ops = 3;
  let fillSteps = 0;
  let rewireSteps = 0;
  let clones = 0;
  let copied = 0;
  let last = 0;

  for (const [i, c] of [...s].entries()) {
    ops += 1;
    const lastBefore = last;
    len.push((len[last] as number) + 1);
    link.push(-1);
    next.push(new Map());
    ops += 4;
    const cur = len.length - 1;
    let p = last;
    const filled: number[] = [];
    while (p !== -1) {
      ops++;
      if ((next[p] as Map<string, number>).has(c)) break;
      (next[p] as Map<string, number>).set(c, cur);
      filled.push(p);
      p = link[p] as number;
      ops += 2;
      fillSteps++;
    }
    const stopAt = p;
    let kind: CharStep["kind"] = "뿌리로 잇는다";
    let q: number | null = null;
    let clone: number | null = null;
    const rewired: number[] = [];
    if (p === -1) {
      link[cur] = 0;
      ops++;
    } else {
      q = (next[p] as Map<string, number>).get(c) as number;
      ops += 3;
      if ((len[p] as number) + 1 === (len[q] as number)) {
        kind = "길이가 이어진다";
        link[cur] = q;
        ops++;
      } else {
        kind = "복제한다";
        clone = len.length;
        len.push((len[p] as number) + 1);
        link.push(link[q] as number);
        const copiedNext = new Map<string, number>();
        for (const [k, v] of next[q] as Map<string, number>) {
          copiedNext.set(k, v);
          ops += 2;
          copied++;
        }
        next.push(copiedNext);
        ops += 5;
        clones++;
        while (p !== -1) {
          ops++;
          if ((next[p] as Map<string, number>).get(c) !== q) break;
          (next[p] as Map<string, number>).set(c, clone);
          rewired.push(p);
          p = link[p] as number;
          ops += 2;
          rewireSteps++;
        }
        link[q] = clone;
        link[cur] = clone;
        ops += 2;
      }
    }
    last = cur;
    if (keepSteps) {
      steps.push({
        pos: i,
        c,
        last: lastBefore,
        cur,
        filled,
        stopAt,
        kind,
        q,
        clone,
        rewired,
        len: len.slice(),
        link: link.slice(),
        next: next.map((m) => new Map(m)),
      });
    }
  }

  const trans = next.reduce((a, m) => a + m.size, 0);
  return {
    len,
    link,
    next,
    steps,
    ops,
    states: len.length,
    trans,
    fillSteps,
    rewireSteps,
    clones,
    copied,
  };
}

/** 만든 자동자로 세기와 찾기를 실행하고 그때의 자료 접근을 함께 낸다. */
export function runOn(
  b: Built,
  queries: readonly string[],
): { total: number; answers: boolean[]; countOps: number; queryOps: number } {
  let total = 0;
  let countOps = 0;
  for (let v = 1; v < b.len.length; v++) {
    const parent = b.link[v] as number;
    total += (b.len[v] as number) - (b.len[parent] as number);
    countOps += 3;
  }
  let queryOps = 0;
  const answers: boolean[] = [];
  for (const t of queries) {
    let v = 0;
    let ok = true;
    for (const c of t) {
      queryOps += 2;
      const to = (b.next[v] as Map<string, number>).get(c);
      if (to === undefined) {
        ok = false;
        break;
      }
      v = to;
    }
    answers.push(ok);
  }
  return { total, answers, countOps, queryOps };
}

/** `contains` 가 지나간 상태를 차례로 남긴다. */
export function walkPath(
  b: Pick<Built, "next">,
  t: string,
): { path: number[]; stuckAt: number | null } {
  const path = [0];
  let v = 0;
  for (const [i, c] of [...t].entries()) {
    const to = (b.next[v] as Map<string, number>).get(c);
    if (to === undefined) return { path, stuckAt: i };
    v = to;
    path.push(v);
  }
  return { path, stuckAt: null };
}

/* ────────────────── 세는 사본 — 정의를 그대로 옮긴 방법 ────────────────── */

/** 모든 부분 문자열을 집합에 담는 방법. `n` 이 작을 때만 실행할 수 있다. */
export function bySet(s: string): {
  distinct: number;
  made: number;
  charSum: number;
  ops: number;
} {
  const seen = new Set<string>();
  let made = 0;
  let charSum = 0;
  let ops = 0;
  const n = s.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j <= n; j++) {
      let w = "";
      for (let k = i; k < j; k++) {
        w += s[k];
        ops++;
        charSum++;
      }
      seen.add(w);
      made++;
      ops++;
    }
  }
  return { distinct: seen.size, made, charSum, ops };
}

/** 위 방법의 자료 접근을 식으로 낸다. 만든 개수 `n(n+1)/2` 와 읽은 글자 수 합의 합이다. */
export const bySetFormula = (n: number): number =>
  (n * (n + 1) * (n + 2)) / 6 + (n * (n + 1)) / 2;

/** 접미사 트라이의 마디 하나 — 뿌리에서 그 마디까지 읽은 문자열이 이름이다. */
export interface TrieNode {
  path: string;
  parent: string | null;
}

/** 모든 접미사를 트라이에 담았을 때의 마디(뿌리 포함, 만든 차례). */
export function suffixTrie(s: string): TrieNode[] {
  const seen = new Set<string>([""]);
  const out: TrieNode[] = [{ path: "", parent: null }];
  for (let i = 0; i < s.length; i++) {
    for (let j = i + 1; j <= s.length; j++) {
      const w = s.slice(i, j);
      if (seen.has(w)) continue;
      seen.add(w);
      out.push({ path: w, parent: w.slice(0, -1) });
    }
  }
  return out;
}

/** 모든 접미사를 트라이에 담았을 때의 마디 수(뿌리 포함). */
export function suffixTrieNodes(s: string): number {
  interface Node {
    kids: Map<string, Node>;
  }
  const root: Node = { kids: new Map() };
  let count = 1;
  for (let i = 0; i < s.length; i++) {
    let cur = root;
    for (let j = i; j < s.length; j++) {
      const c = s[j] as string;
      let nx = cur.kids.get(c);
      if (nx === undefined) {
        nx = { kids: new Map() };
        cur.kids.set(c, nx);
        count++;
      }
      cur = nx;
    }
  }
  return count;
}

/* ────────────────── 부분 문자열과 끝나는 자리 ────────────────── */

/** `s` 의 서로 다른 부분 문자열마다 끝나는 자리를 모은다. 자리는 0 부터 센다. */
export function endpos(s: string): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (let i = 0; i < s.length; i++) {
    for (let j = i + 1; j <= s.length; j++) {
      const w = s.slice(i, j);
      const at = out.get(w);
      if (at === undefined) out.set(w, [j - 1]);
      else if (!at.includes(j - 1)) at.push(j - 1);
    }
  }
  for (const at of out.values()) at.sort((a, b) => a - b);
  return out;
}

/** `w` 의 끝나는 자리. 빈 문자열은 모든 자리에서 끝나는 것으로 본다(글자 사이 자리까지 −1 포함). */
export function endposOf(s: string, w: string): number[] {
  if (w === "") return Array.from({ length: s.length + 1 }, (_, i) => i - 1);
  return endpos(s).get(w) ?? [];
}

/** 무리 하나 — 끝나는 자리가 같은 부분 문자열들. 안은 길이 오름차순이다. */
export interface Group {
  key: string;
  at: number[];
  words: string[];
}

/** 끝나는 자리 집합이 같은 것끼리 묶는다. 가장 짧은 것의 길이 · 사전순으로 늘어놓는다. */
export function endposGroups(s: string): Group[] {
  const groups = new Map<string, { at: number[]; words: string[] }>();
  for (const [w, at] of endpos(s)) {
    const key = at.join(" ");
    const bag = groups.get(key);
    if (bag === undefined) groups.set(key, { at, words: [w] });
    else bag.words.push(w);
  }
  return [...groups.entries()]
    .map(([key, g]) => ({
      key,
      at: g.at,
      words: g.words.sort((a, b) => a.length - b.length),
    }))
    .sort((a, b) => {
      const x = a.words[0] as string;
      const y = b.words[0] as string;
      return x.length - y.length || (x < y ? -1 : 1);
    });
}

/** 문자열 하나가 어느 상태에 담기는가. 전이를 따라간 끝자리다. */
export function stateOf(b: Pick<Built, "next">, w: string): number {
  let v = 0;
  for (const c of w) {
    const to = (b.next[v] as Map<string, number>).get(c);
    if (to === undefined) return -1;
    v = to;
  }
  return v;
}

/** 상태 `v` 가 담는 문자열 — 길이 `len[link[v]] + 1` 부터 `len[v]` 까지, 짧은 것부터. */
export function wordsOfState(
  b: Pick<Built, "len" | "link" | "next">,
  s: string,
  v: number,
): string[] {
  if (v === 0) return [""];
  const out: string[] = [];
  for (const w of endpos(s).keys()) if (stateOf(b, w) === v) out.push(w);
  return out.sort((x, y) => x.length - y.length);
}

/** `w` 뒤에 붙였을 때 여전히 `s` 의 부분 문자열인 글자들. 없으면 빈 문자열이다. */
export function followSet(s: string, w: string): string {
  const out: string[] = [];
  for (let code = 97; code < 123; code++) {
    const c = String.fromCharCode(code);
    if (s.includes(w + c)) out.push(c);
  }
  return out.join(" ");
}

/** `a->1 b->6` 꼴. 비어 있으면 그렇게 적는다. */
export function nextText(m: Map<string, number>): string {
  if (m.size === 0) return "비어 있음";
  return [...m.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => `${k}→${v}`)
    .join(" ");
}

/* ────────────────── 걸음 재생 — 전개의 열한 걸음 ────────────────── */

/** 간선 하나의 이름 — 전이는 `t:출발:글자:도착`, 접미사 링크는 `l:출발:도착`. */
export type EdgeKey = string;
export const transKey = (from: number, c: string, to: number): EdgeKey =>
  `t:${from}:${c}:${to}`;
export const linkKey = (from: number, to: number): EdgeKey => `l:${from}:${to}`;

/** 그 걸음이 끝난 뒤의 자동자 한 벌. */
export interface Snapshot {
  len: number[];
  link: number[];
  next: Map<string, number>[];
}

/** 전개의 걸음 하나. */
export interface WalkStep {
  t: number;
  kind: "root" | "char" | "fill" | "clone" | "rewire" | "query" | "count";
  /** 그 걸음이 끝난 뒤의 자동자. */
  snap: Snapshot;
  /** 새로 쓴 상태 · 간선. */
  wroteNodes: number[];
  wroteEdges: EdgeKey[];
  /** 읽은 상태 · 간선. */
  readNodes: number[];
  readEdges: EdgeKey[];
  /** 글자를 받는 걸음이면 그 글자의 기록. */
  char?: CharStep;
  /** 찾는 걸음이면 검색 문자열과 지나간 길. */
  query?: { t: string; path: number[]; stuckAt: number | null; ok: boolean };
  /** 세는 걸음이면 상태마다 더한 값. */
  adds?: number[];
  total?: number;
}

const snapOf = (x: Snapshot): Snapshot => ({
  len: x.len.slice(),
  link: x.link.slice(),
  next: x.next.map((m) => new Map(m)),
});

/**
 * 전개의 걸음 — 뿌리 하나(T1), 글자마다 한 걸음, 복제하는 글자는 셋(멈춤 · 복제 · 전이 옮기기),
 * 검색 문자열마다 한 걸음, 세기 한 걸음. 값은 세는 사본(`built`)의 걸음 기록에서 받는다.
 */
export function walkSteps(
  s: string = WALK,
  queries: readonly string[] = WALK_QUERIES,
): WalkStep[] {
  const b = built(s);
  const out: WalkStep[] = [];
  let t = 1;
  let prev: Snapshot = { len: [0], link: [-1], next: [new Map()] };
  out.push({
    t: t++,
    kind: "root",
    snap: snapOf(prev),
    wroteNodes: [0],
    wroteEdges: [],
    readNodes: [],
    readEdges: [],
  });
  for (const st of b.steps) {
    const climbed: EdgeKey[] = [];
    // ③ 이 올라간 접미사 링크 — 전이를 적은 상태에서 그 링크로 올라갔다.
    for (const p of st.filled) {
      const up = prev.link[p] as number;
      if (up !== -1) climbed.push(linkKey(p, up));
    }
    const wroteFill = st.filled.map((p) => transKey(p, st.c, st.cur));
    if (st.kind !== "복제한다") {
      const read: number[] = [];
      const readE: EdgeKey[] = [...climbed];
      const linkTo = st.link[st.cur] as number;
      if (st.stopAt !== -1) {
        read.push(st.stopAt, st.q as number);
        readE.push(transKey(st.stopAt, st.c, st.q as number));
      }
      out.push({
        t: t++,
        kind: "char",
        snap: { len: st.len, link: st.link, next: st.next },
        wroteNodes: [st.cur],
        wroteEdges: [...wroteFill, linkKey(st.cur, linkTo)],
        readNodes: read,
        readEdges: readE,
        char: st,
      });
      prev = { len: st.len, link: st.link, next: st.next };
      continue;
    }
    // 복제하는 글자 — 세 걸음으로 가른다.
    const p = st.stopAt;
    const q = st.q as number;
    const clone = st.clone as number;
    const fill: Snapshot = snapOf(prev);
    fill.len.push(st.len[st.cur] as number);
    fill.link.push(-1);
    fill.next.push(new Map());
    for (const f of st.filled)
      (fill.next[f] as Map<string, number>).set(st.c, st.cur);
    out.push({
      t: t++,
      kind: "fill",
      snap: fill,
      wroteNodes: [st.cur],
      wroteEdges: wroteFill,
      readNodes: [p, q],
      readEdges: [...climbed, transKey(p, st.c, q)],
      char: st,
    });
    const made: Snapshot = snapOf(fill);
    made.len.push(st.len[clone] as number);
    made.link.push(prev.link[q] as number);
    made.next.push(new Map(prev.next[q] as Map<string, number>));
    out.push({
      t: t++,
      kind: "clone",
      snap: made,
      wroteNodes: [clone],
      wroteEdges: [
        ...[...(prev.next[q] as Map<string, number>)].map(([k, v]) =>
          transKey(clone, k, v),
        ),
        linkKey(clone, prev.link[q] as number),
      ],
      readNodes: [q],
      readEdges: [
        ...[...(prev.next[q] as Map<string, number>)].map(([k, v]) =>
          transKey(q, k, v),
        ),
        linkKey(q, prev.link[q] as number),
      ],
      char: st,
    });
    const rewiredClimb: EdgeKey[] = [];
    for (const r of st.rewired) {
      const up = prev.link[r] as number;
      if (up !== -1) rewiredClimb.push(linkKey(r, up));
    }
    out.push({
      t: t++,
      kind: "rewire",
      snap: { len: st.len, link: st.link, next: st.next },
      wroteNodes: [],
      wroteEdges: [
        ...st.rewired.map((r) => transKey(r, st.c, clone)),
        linkKey(q, clone),
        linkKey(st.cur, clone),
      ],
      readNodes: [...st.rewired],
      readEdges: rewiredClimb,
      char: st,
    });
    prev = { len: st.len, link: st.link, next: st.next };
  }
  for (const qt of queries) {
    const w = walkPath(prev, qt);
    const edges: EdgeKey[] = [];
    for (let i = 1; i < w.path.length; i++) {
      edges.push(
        transKey(
          w.path[i - 1] as number,
          qt[i - 1] as string,
          w.path[i] as number,
        ),
      );
    }
    out.push({
      t: t++,
      kind: "query",
      snap: prev,
      wroteNodes: [],
      wroteEdges: [],
      readNodes: w.path,
      readEdges: edges,
      query: {
        t: qt,
        path: w.path,
        stuckAt: w.stuckAt,
        ok: w.stuckAt === null,
      },
    });
  }
  const adds: number[] = [];
  let total = 0;
  for (let v = 1; v < prev.len.length; v++) {
    const add =
      (prev.len[v] as number) - (prev.len[prev.link[v] as number] as number);
    adds.push(add);
    total += add;
  }
  out.push({
    t: t++,
    kind: "count",
    snap: prev,
    wroteNodes: [],
    wroteEdges: [],
    readNodes: Array.from({ length: prev.len.length - 1 }, (_, i) => i + 1),
    readEdges: Array.from({ length: prev.len.length - 1 }, (_, i) =>
      linkKey(i + 1, prev.link[i + 1] as number),
    ),
    adds,
    total,
  });
  return out;
}

/** 걸음 기록에서 그 걸음이 끝난 뒤에 있는 간선들. */
export function edgesOf(snap: Snapshot): EdgeKey[] {
  const out: EdgeKey[] = [];
  for (const [v, m] of snap.next.entries()) {
    for (const [c, to] of [...m].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
      out.push(transKey(v, c, to));
    }
  }
  for (const [v, to] of snap.link.entries()) {
    if (to !== -1) out.push(linkKey(v, to));
  }
  return out;
}

/* ────────────────────────── 자기대조 ────────────────────────── */

const 자기대조_입력 = [
  WALK,
  SHARE_BREAKS,
  "a",
  "aa",
  "ab",
  "abc",
  "aaa",
  "abab",
  "abcbc",
  "banana",
  "mississippi",
  onePrefix(17),
  twoEnds(17),
  sameChar(17),
  cycle26(30),
  varied(40),
];

const 같은가 = <T>(a: T[], b: T[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/** 세는 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  for (const s of 자기대조_입력) {
    const ref = new SuffixAutomaton(s);
    const b = built(s, false);
    const queries = [...WALK_QUERIES, s, s.slice(1), `${s}z`, "", "zz"];
    const used = runOn(b, queries);
    if (used.total !== ref.countDistinctSubstrings()) {
      throw new Error(`세는 사본이 정본과 다른 개수를 낸다 — ${s}`);
    }
    if (
      !같은가(
        used.answers,
        queries.map((t) => ref.contains(t)),
      )
    ) {
      throw new Error(`세는 사본이 정본과 다른 판정을 낸다 — ${s}`);
    }
    const set = bySet(s);
    if (set.distinct !== ref.countDistinctSubstrings()) {
      throw new Error(`집합에 담는 사본이 정본과 다른 개수를 낸다 — ${s}`);
    }
    if (set.ops !== bySetFormula(s.length)) {
      throw new Error(`집합에 담는 방법의 식이 실행과 다르다 — ${s}`);
    }
    if (endposGroups(s).length !== b.states - 1) {
      throw new Error(`끝나는 자리 무리 수가 상태 수와 다르다 — ${s}`);
    }
    if (suffixTrieNodes(s) !== ref.countDistinctSubstrings() + 1) {
      throw new Error(`트라이 마디 수가 부분 문자열 수 + 1 과 다르다 — ${s}`);
    }
    if (suffixTrie(s).length !== suffixTrieNodes(s)) {
      throw new Error(`트라이 마디 목록이 마디 수와 다르다 — ${s}`);
    }
  }
  // 걸음 기록의 마지막 자동자가 세는 사본의 결과와 같은가.
  const steps = walkSteps();
  const last = steps.at(-1) as WalkStep;
  const W0 = built(WALK, false);
  if (
    !같은가(last.snap.len, W0.len) ||
    !같은가(last.snap.link, W0.link) ||
    last.total !== new SuffixAutomaton(WALK).countDistinctSubstrings()
  ) {
    throw new Error("걸음 기록이 세는 사본과 다른 자동자를 가리킨다");
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./suffixAutomaton-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  SuffixAutomaton: new (
    s: string,
  ) => {
    countDistinctSubstrings(): number;
    contains(t: string): boolean;
  };
}

/** ③ 의 반복 조건에서 「전이가 비어 있는가」를 뺀 사본 — 있는 전이를 덮어쓴다. */
const overwrite = await loadMutant<Impl>(REF, {
  swap: [/!\(this\.next\[p\] as Map<string, number>\)\.has\(c\)/, "true"],
});

/** ⑤ 의 길이 검사를 뺀 사본 — 복제 상태를 한 번도 만들지 않는다. */
const noClone = await loadMutant<Impl>(REF, {
  swap: [
    /\(this\.len\[p\] as number\) \+ 1 === \(this\.len\[q\] as number\)/,
    "true",
  ],
});

/** ⑥ 이 전이 표를 복사하지 않고 같은 객체를 함께 쓰는 사본. */
const shareNext = await loadMutant<Impl>(REF, {
  swap: [
    /new Map\(this\.next\[q\] as Map<string, number>\)/,
    "(this.next[q] as Map<string, number>)",
  ],
});

/** **불변식을 지키던 줄** — 복제 상태의 길이를 `q` 의 길이로 둔 사본. */
const cloneLen = await loadMutant<Impl>(REF, {
  swap: [
    /const cloneLen = \(this\.len\[p\] as number\) \+ 1;/,
    "const cloneLen = this.len[q] as number;",
  ],
});

/** ⑧ 에서 접미사 링크가 이미 담은 몫을 안 빼는 사본. */
const countAll = await loadMutant<Impl>(REF, {
  swap: [/ - \(this\.len\[parent\] as number\)/, " - 0"],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 생성자가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = overwrite.SuffixAutomaton === SuffixAutomaton;

/** 변이 하나를 문자열 하나에 건다. 던지면 `null`. */
function mutantCount(impl: Impl, s: string): number | null {
  try {
    return new impl.SuffixAutomaton(s).countDistinctSubstrings();
  } catch {
    return null;
  }
}

const 갈리는_변이: { label: string; impl: Impl; cases: string[] }[] = [
  { label: "있는 전이를 덮어쓴 판", impl: overwrite, cases: [WALK] },
  { label: "복제를 안 만든 판", impl: noClone, cases: [WALK] },
  { label: "전이 표를 함께 쓴 판", impl: shareNext, cases: [SHARE_BREAKS] },
  { label: "복제 길이를 q 로 둔 판", impl: cloneLen, cases: [WALK] },
  { label: "링크 몫을 안 뺀 판", impl: countAll, cases: [WALK] },
];

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  for (const { label, impl, cases } of 갈리는_변이) {
    if (
      cases.every(
        (s) =>
          mutantCount(impl, s) ===
          new SuffixAutomaton(s).countDistinctSubstrings(),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/** 변이 하나를 문자열 여럿에 걸어 개수를 나란히 놓는다. 판정 열은 「같다 / 어긋난다」다. */
function mutantRows(impl: Impl, cases: readonly string[]): string[][] {
  return cases.map((s) => {
    const a = new SuffixAutomaton(s).countDistinctSubstrings();
    const b = mutantCount(impl, s);
    const shown = b === null ? "실행이 끝나지 않는다" : String(b);
    return [`"${s}"`, String(a), shown, a === b ? "같다" : "어긋난다"];
  });
}

/** 변이 표의 「어긋난」 행 수 — 문장에 싣는다. */
const offCount = (rows: readonly string[][]): number =>
  rows.filter((r) => r[3] !== "같다").length;

/**
 * 복제 갈래를 지나는 문자열 중 복제 길이를 `q` 의 길이로 둬도 답이 같은 것이 있는가.
 *
 * 「같다」 행이 「그 줄을 지나가지 않아서 같다」인지 「지나가는데도 같다」인지를 실행이 가른다.
 */
let cloneScanCache: { withClone: number; same: number } | null = null;

function cloneScan(): { withClone: number; same: number } {
  if (cloneScanCache !== null) return cloneScanCache;
  let withClone = 0;
  let same = 0;
  const alphabets: [string, number][] = [
    ["ab", 12],
    ["abc", 8],
  ];
  for (const [alpha, maxLen] of alphabets) {
    const walk = (w: string): void => {
      if (w.length > 0 && built(w, false).clones > 0) {
        withClone++;
        const want = new SuffixAutomaton(w).countDistinctSubstrings();
        if (mutantCount(cloneLen, w) === want) same++;
      }
      if (w.length === maxLen) return;
      for (const c of alpha) walk(w + c);
    };
    walk("");
  }
  cloneScanCache = { withClone, same };
  return cloneScanCache;
}

/**
 * 전이 표를 함께 쓴 판이 답을 바꾸는 가장 짧은 문자열을 전수로 찾는다.
 *
 * 알파벳 두 글자로 만든 길이 1~6 문자열을 짧은 것부터 전부 걸어 본다. 「가장 짧다」를 손으로
 * 적지 않고 실행이 내게 하는 자리다.
 */
function shortestShareBreak(): {
  checked: number;
  diverged: number;
  shortest: number;
  first: string;
} {
  let checked = 0;
  let diverged = 0;
  let shortest = 0;
  let first = "";
  for (let len = 1; len <= 6; len++) {
    for (let mask = 0; mask < 1 << len; mask++) {
      let w = "";
      for (let i = 0; i < len; i++) w += (mask >> i) & 1 ? "b" : "a";
      checked++;
      const want = new SuffixAutomaton(w).countDistinctSubstrings();
      if (mutantCount(shareNext, w) === want) continue;
      diverged++;
      if (shortest === 0) {
        shortest = len;
        first = w;
      }
    }
  }
  return { checked, diverged, shortest, first };
}

/* ────────────────────────── 블록 ────────────────────────── */

const W = built(WALK);
const WU = runOn(W, WALK_QUERIES);
const GROUPS = endposGroups(WALK);
const STEPS = walkSteps();

/** 상태마다 담는 문자열(전개 입력). 뿌리는 빈 문자열이다. */
export const MEMBERS: string[][] = Array.from({ length: W.states }, (_, v) =>
  wordsOfState(W, WALK, v),
);

/** 끝나는 자리 집합 — 상태 `v` 의 가장 긴 문자열에서 잰다. 뿌리는 모든 자리다. */
const atOf = (v: number): number[] =>
  v === 0
    ? Array.from({ length: WALK.length }, (_, i) => i)
    : (endpos(WALK).get(MEMBERS[v]?.at(-1) as string) as number[]);

/** 자리 목록을 집합 꼴로. */
const setText = (a: readonly number[]): string => `{${a.join(", ")}}`;

export const PROOFS: Record<string, () => string> = {
  /* ─────────────── concept ─────────────── */

  /** 상태마다 담는 문자열과 개수 — 개수의 합이 서로 다른 부분 문자열 수다. */
  "concept-count": () => {
    const rows: string[][] = [];
    let sum = 0;
    for (let v = 1; v < W.states; v++) {
      const m = MEMBERS[v] as string[];
      sum += m.length;
      rows.push([
        `상태 ${v}`,
        words(m),
        setText(atOf(v)),
        String(W.len[v]),
        String(m.length),
      ]);
    }
    return block(
      md(
        [
          "상태",
          "담는 문자열",
          "끝나는 자리",
          "가장 긴 것의 길이",
          "담는 개수",
        ],
        rows,
        ["l", "l", "l", "r", "r"],
      ),
      `뿌리를 뺀 상태 ${W.states - 1} 개가 담는 개수를 더하면 ${sum} 이고, "${WALK}" 의 서로 다른 부분 문자열도 ${bySet(WALK).distinct} 개입니다.`,
    );
  },

  /* ─────────────── deep.origin ─────────────── */

  /** ② 부분 문자열을 전부 집합에 담는 방법을 규모별로 잰다. */
  "origin-cost": () => {
    const rows = [8, 64, 512].map((n) => {
      const str = varied(n);
      const set = bySet(str);
      const b = built(str, false);
      const sam = b.ops + runOn(b, []).countOps;
      return [
        num(n),
        num(set.distinct),
        num(set.ops),
        secondsOf(set.ops),
        num(sam),
        secondsOf(sam),
      ];
    });
    const bigS = varied(N_LIMIT);
    const big = built(bigS, false);
    const bigSam = big.ops + runOn(big, []).countOps;
    const bigSet = bySetFormula(N_LIMIT);
    rows.push([
      num(N_LIMIT),
      num(new SuffixAutomaton(bigS).countDistinctSubstrings()),
      num(bigSet),
      secondsOf(bigSet),
      num(bigSam),
      secondsOf(bigSam),
    ]);
    const small = [8, 64, 512].every(
      (n) => bySet(varied(n)).ops === bySetFormula(n),
    );
    return block(
      md(
        [
          "n",
          "서로 다른 부분 문자열",
          "집합에 전부 담기",
          "시간",
          "접미사 자동자",
          "시간",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      `문자열은 mulberry32(씨앗 0x9e3779b9)로 스물여섯 글자에서 고른 무작위 문자열입니다. 시간은 자료 접근을 초당 1 억 번으로 나눈 값입니다. 집합에 전부 담기의 n = ${num(N_LIMIT)} 줄은 식 n(n+1)(n+2)/6 + n(n+1)/2 로 낸 값이고, 그 식은 위 세 규모에서 실행한 값과 ${small ? "같습니다" : "다릅니다"}.`,
    );
  },

  /** ③ 같은 부분 문자열이 몇 번씩 다시 만들어지는가. */
  "origin-repeat": () => {
    const set = bySet(WALK);
    const rows: string[][] = [];
    for (let i = 0; i < WALK.length; i++) {
      const made: string[] = [];
      for (let j = i + 1; j <= WALK.length; j++) made.push(WALK.slice(i, j));
      rows.push([String(i), made.join(" · "), String(made.length)]);
    }
    return block(
      md(["시작 자리", "거기서 만든 부분 문자열", "개수"], rows, [
        "r",
        "l",
        "r",
      ]),
      `모두 ${set.made} 개를 만들었고 그중 서로 다른 것은 ${set.distinct} 개라, 같은 것을 ${set.made - set.distinct} 번 다시 만들었습니다.`,
    );
  },

  /** ⑤ 가장 단순한 후보 — 모든 접미사를 트라이에 담는다. */
  "origin-trie": () => {
    const rows: string[][] = [];
    for (const n of [8, 16, 32, 64]) {
      for (const [label, mk] of [
        ["무작위 26 글자", varied],
        ["첫 글자만 다르다", onePrefix],
      ] as const) {
        const s = mk(n);
        rows.push([
          num(n),
          label,
          num(suffixTrieNodes(s)),
          num(built(s, false).states),
        ]);
      }
    }
    const bigS = varied(N_LIMIT);
    const bigNodes = new SuffixAutomaton(bigS).countDistinctSubstrings() + 1;
    const bigStates = built(bigS, false).states;
    rows.push([num(N_LIMIT), "무작위 26 글자", num(bigNodes), num(bigStates)]);
    const gb = (bigNodes * 4) / 1e9;
    return block(
      md(
        ["n", "문자열 모양", "접미사 트라이의 마디", "접미사 자동자의 상태"],
        rows,
        ["r", "l", "r", "r"],
      ),
      `트라이의 마디는 서로 다른 부분 문자열마다 하나에 뿌리 하나를 더한 수이고, 위 여덟 줄에서 그 수가 직접 만든 트라이의 마디 수와 같습니다. 그래서 n = ${num(N_LIMIT)} 줄의 마디 수는 트라이를 만들지 않고 정본이 센 부분 문자열 수에 1 을 더해 냈습니다. 마디 하나를 4 바이트로만 어림해도 ${gb.toFixed(1)} GB 입니다.`,
    );
  },

  /** ⑤ 접미사 트라이에서 끝나는 자리가 같은 마디를 합치면. */
  "origin-merge": () => {
    const trie = suffixTrie(WALK);
    const rows = trie.map((node) => {
      const v = stateOf(W, node.path);
      const at = node.path === "" ? "모든 자리" : setText(atOf(v));
      return [node.path === "" ? "뿌리" : node.path, at, `상태 ${v}`];
    });
    const merged = new Set(trie.map((n) => stateOf(W, n.path)));
    // 끝나는 자리가 같은 마디끼리가 곧 같은 상태인가 — 두 가름이 같은지 쌍마다 본다.
    let pairs = 0;
    let agree = 0;
    for (let i = 0; i < trie.length; i++) {
      for (let j = i + 1; j < trie.length; j++) {
        const a = trie[i] as TrieNode;
        const b = trie[j] as TrieNode;
        const sameAt =
          endposOf(WALK, a.path).join(",") === endposOf(WALK, b.path).join(",");
        const sameState = stateOf(W, a.path) === stateOf(W, b.path);
        pairs++;
        if (sameAt === sameState) agree++;
      }
    }
    return block(
      md(["트라이 마디", "끝나는 자리", "합친 뒤의 상태"], rows, [
        "l",
        "l",
        "l",
      ]),
      `마디 ${trie.length} 개가 상태 ${merged.size} 개로 합쳐집니다. 마디 ${pairs} 쌍 가운데 「끝나는 자리가 같다」와 「같은 상태로 합쳐진다」가 일치하는 쌍이 ${agree} 쌍입니다.`,
    );
  },

  /* ─────────────── deep.build — 끝나는 자리 집합 ─────────────── */

  /** (c) 무리 하나를 읽는 법 — 가장 긴 것의 접미사를 짧아지는 차례로. */
  "build-endpos-read": () => {
    const v = stateOf(W, "aaba");
    const longest = MEMBERS[v]?.at(-1) as string;
    const rows: string[][] = [];
    for (let L = longest.length; L >= 0; L--) {
      const w = longest.slice(longest.length - L);
      const u = stateOf(W, w);
      rows.push([
        String(L),
        w === "" ? "빈 문자열" : w,
        w === "" ? "모든 자리" : setText(endposOf(WALK, w)),
        `상태 ${u}`,
      ]);
    }
    const m = MEMBERS[v] as string[];
    return block(
      md(["길이", "접미사", "끝나는 자리", "담긴 상태"], rows, [
        "r",
        "l",
        "l",
        "l",
      ]),
      `끝나는 자리가 ${setText(atOf(v))} 인 것은 길이 ${(m[0] as string).length} 부터 ${longest.length} 까지 ${m.length} 개이고, 길이 ${(m[0] as string).length - 1} 에서 끝나는 자리가 늘어나 다른 상태로 넘어갑니다.`,
    );
  },

  /** (d) 무리끼리의 관계 — 끝나는 자리 집합은 포함되거나 겹치지 않는다. */
  "build-endpos-relations": () => {
    const sets = Array.from({ length: W.states }, (_, v) => atOf(v));
    let nested = 0;
    let apart = 0;
    let partial = 0;
    for (let a = 0; a < W.states; a++) {
      for (let b = a + 1; b < W.states; b++) {
        const A = sets[a] as number[];
        const B = sets[b] as number[];
        const inter = A.filter((x) => B.includes(x)).length;
        if (inter === 0) apart++;
        else if (inter === A.length || inter === B.length) nested++;
        else partial++;
      }
    }
    const rows: string[][] = [];
    for (let v = 1; v < W.states; v++) {
      const shortest = (MEMBERS[v] as string[])[0] as string;
      const cut = shortest.slice(1);
      const u = stateOf(W, cut);
      rows.push([
        `상태 ${v}`,
        setText(sets[v] as number[]),
        shortest,
        cut === "" ? "빈 문자열" : cut,
        `상태 ${u}`,
        u === 0 ? "모든 자리" : setText(sets[u] as number[]),
      ]);
    }
    return block(
      md(
        [
          "상태",
          "끝나는 자리",
          "가장 짧은 것",
          "앞 글자를 뗀 것",
          "그것이 든 상태",
          "그 상태의 끝나는 자리",
        ],
        rows,
        ["l", "l", "l", "l", "l", "l"],
      ),
      `뿌리를 포함한 상태 ${W.states} 개에서 두 상태를 고르는 ${nested + apart + partial} 쌍 가운데 한쪽이 다른 쪽을 품는 쌍이 ${nested} 쌍, 겹치는 자리가 없는 쌍이 ${apart} 쌍, 일부만 겹치는 쌍이 ${partial} 쌍입니다.`,
    );
  },

  /** (e) 끝나는 자리 **개수**로 묶은 것과의 차이. */
  "build-endpos-count": () => {
    const byCount = new Map<number, string[]>();
    for (const [w, at] of endpos(WALK)) {
      byCount.set(at.length, [...(byCount.get(at.length) ?? []), w]);
    }
    const keys = [...byCount.keys()].sort((a, b) => b - a);
    let broken = 0;
    const rows = keys.map((k) => {
      const ws = (byCount.get(k) as string[]).sort(
        (a, b) => a.length - b.length || (a < b ? -1 : 1),
      );
      const longest = ws.at(-1) as string;
      const allSuffix = ws.every((w) => longest.endsWith(w));
      const lens = [...new Set(ws.map((w) => w.length))];
      const oneEach = lens.length === ws.length;
      const ok = allSuffix && oneEach;
      if (!ok) broken++;
      return [
        String(k),
        ws.join(" · "),
        String(ws.length),
        ok ? "이어진다" : "안 이어진다",
      ];
    });
    return block(
      md(["끝나는 자리 수", "묶인 문자열", "개수", "길이 구간"], rows, [
        "r",
        "l",
        "r",
        "l",
      ]),
      `끝나는 자리 수로 묶으면 무리가 ${keys.length} 개이고, 그중 길이 구간 하나로 적을 수 없는 무리가 ${broken} 개입니다. 끝나는 자리 집합으로 묶으면 무리가 ${GROUPS.length} 개이고 그런 무리가 없습니다.`,
    );
  },

  /** (f) 한 무리의 문자열 뒤에 같은 글자를 붙이면 한 무리로 옮겨 간다. */
  "build-endpos-move": () => {
    const rows: string[][] = [];
    let moves = 0;
    let oneState = 0;
    for (let v = 1; v < W.states; v++) {
      const m = MEMBERS[v] as string[];
      for (const c of ["a", "b"]) {
        const got = m.map((w) => stateOf(W, w + c));
        if (got.every((g) => g === -1)) continue;
        moves++;
        const one = got.every((g) => g === got[0]);
        if (one) oneState++;
        rows.push([
          `상태 ${v}`,
          c,
          m.map((w) => `${w}${c}`).join(" · "),
          got.map((g) => (g === -1 ? "없음" : `상태 ${g}`)).join(" · "),
        ]);
      }
    }
    return block(
      md(["상태", "붙인 글자", "붙인 문자열", "그것이 든 상태"], rows, [
        "l",
        "l",
        "l",
        "l",
      ]),
      `글자를 붙여 부분 문자열이 되는 ${moves} 가지 모두에서, 한 상태의 문자열이 전부 같은 상태로 옮겨 가는 것이 ${oneState} 가지입니다.`,
    );
  },

  /* ─────────────── deep.build — 접미사 링크 ─────────────── */

  /** (c) 접미사 링크 하나를 읽는 법. */
  "build-link-read": () => {
    const v = stateOf(W, "aaba");
    const m = MEMBERS[v] as string[];
    const shortest = m[0] as string;
    const cut = shortest.slice(1);
    const u = W.link[v] as number;
    const rows = [
      ["상태", `상태 ${v}`],
      ["담는 문자열", words(m)],
      ["가장 짧은 것", shortest],
      ["앞 글자 하나를 뗀 것", cut],
      ["그것이 든 상태", `상태 ${stateOf(W, cut)}`],
      [`link[${v}]`, String(u)],
      [`len[${u}] + 1`, String((W.len[u] as number) + 1)],
      ["가장 짧은 것의 길이", String(shortest.length)],
    ];
    return block(
      md(["읽을 것", `상태 ${v}`], rows, ["l", "l"]),
      `접미사 링크가 가리키는 상태 ${u} 의 가장 긴 것에 한 글자를 더한 길이가 상태 ${v} 의 가장 짧은 것의 길이 ${shortest.length}${과와(shortest.length)} 같습니다.`,
    );
  },

  /** (d) 접미사 링크끼리의 관계. */
  "build-link-relations": () => {
    const rows: string[][] = [];
    let shorter = 0;
    let superset = 0;
    for (let v = 1; v < W.states; v++) {
      const u = W.link[v] as number;
      const A = atOf(v);
      const B = atOf(u);
      if ((W.len[u] as number) < (W.len[v] as number)) shorter++;
      if (A.every((x) => B.includes(x)) && B.length > A.length) superset++;
      rows.push([
        `상태 ${v}`,
        String(W.len[v]),
        `상태 ${u}`,
        String(W.len[u]),
        setText(A),
        u === 0 ? "모든 자리" : setText(B),
      ]);
    }
    const chain: number[] = [];
    for (
      let v = W.steps.at(-1)?.cur as number;
      v !== -1;
      v = W.link[v] as number
    ) {
      chain.push(v);
    }
    const covered = chain.flatMap((v) => MEMBERS[v] as string[]);
    const suffixes = Array.from({ length: WALK.length + 1 }, (_, k) =>
      WALK.slice(k),
    );
    const allCovered =
      covered.length === suffixes.length &&
      suffixes.every((x) => covered.includes(x));
    return block(
      md(
        [
          "상태",
          "len",
          "접미사 링크",
          "링크의 len",
          "끝나는 자리",
          "링크의 끝나는 자리",
        ],
        rows,
        ["l", "r", "l", "r", "l", "l"],
      ),
      `상태 ${W.states - 1} 개 가운데 ${shorter} 개에서 링크의 len 이 더 작고, ${superset} 개에서 링크의 끝나는 자리가 자기 것을 품으며 더 큽니다. 마지막 상태 ${chain[0]} 에서 링크를 따라가면 ${chain.map((v) => `상태 ${v}`).join(" → ")} 이고, 그 상태들이 담은 문자열 ${covered.length} 개가 "${WALK}" 의 접미사 ${suffixes.length} 개(빈 문자열 포함)와 ${allCovered ? "하나도 빠짐없이 맞습니다" : "맞지 않습니다"}.`,
    );
  },

  /** (e) 가장 긴 것에서 앞 글자를 뗀 것을 가리키면. */
  "build-link-longest": () => {
    const rows: string[][] = [];
    let self = 0;
    for (let v = 1; v < W.states; v++) {
      const m = MEMBERS[v] as string[];
      const longest = m.at(-1) as string;
      const cut = longest.slice(1);
      const u = stateOf(W, cut);
      if (u === v) self++;
      rows.push([
        `상태 ${v}`,
        longest,
        cut === "" ? "빈 문자열" : cut,
        `상태 ${u}`,
        `상태 ${W.link[v]}`,
      ]);
    }
    return block(
      md(
        [
          "상태",
          "가장 긴 것",
          "앞 글자를 뗀 것",
          "그것이 든 상태",
          "접미사 링크",
        ],
        rows,
        ["l", "l", "l", "l", "l"],
      ),
      `가장 긴 것에서 떼면 상태 ${W.states - 1} 개 가운데 ${self} 개가 자기 자신을 가리킵니다.`,
    );
  },

  /* ─────────────── deep.build — 실현 단계 ─────────────── */

  /** 1단계 — 글자마다 접두사 전체를 담는 상태. */
  "build-cur": () => {
    const rows = W.steps.map((st) => [
      String(st.pos),
      st.c,
      `"${WALK.slice(0, st.pos + 1)}"`,
      `상태 ${st.last}`,
      String(st.len[st.last]),
      `상태 ${st.cur}`,
      String(st.len[st.cur]),
    ]);
    return block(
      md(
        [
          "글자 자리",
          "글자",
          "읽은 접두사",
          "last",
          "len[last]",
          "cur",
          "len[cur]",
        ],
        rows,
        ["r", "l", "l", "l", "r", "l", "r"],
      ),
      `다섯 글자 모두에서 len[cur] 가 읽은 접두사의 길이와 같습니다.`,
    );
  },

  /** 2단계 — 접미사 링크를 거슬러 올라가며 빈 전이를 채운다. */
  "build-fill": () => {
    const rows = W.steps.map((st) => {
      const climbed: number[] = [...st.filled];
      if (st.stopAt !== -1) climbed.push(st.stopAt);
      return [
        String(st.pos),
        st.c,
        climbed.map((v) => `상태 ${v}`).join(" → "),
        st.filled.length === 0
          ? "없음"
          : st.filled.map((v) => `상태 ${v}`).join(" · "),
        st.stopAt === -1 ? "-1 (뿌리를 지났다)" : `상태 ${st.stopAt}`,
      ];
    });
    return block(
      md(
        ["글자 자리", "글자", "올라간 상태", "전이를 적은 상태", "멈춘 자리"],
        rows,
        ["r", "l", "l", "l", "l"],
      ),
      `다섯 글자가 적은 전이는 모두 ${W.fillSteps} 개이고, 멈춘 자리가 -1 인 글자는 ${W.steps.filter((s) => s.stopAt === -1).length} 개입니다.`,
    );
  },

  /** 3단계 — 멈춘 자리에서 cur 의 접미사 링크를 정한다. */
  "build-link-set": () => {
    const rows = W.steps.map((st) => {
      if (st.stopAt === -1) {
        return [
          String(st.pos),
          st.c,
          "-1",
          "-",
          "-",
          "뿌리로 잇는다",
          `link[${st.cur}] = 0`,
        ];
      }
      const p = st.stopAt;
      const q = st.q as number;
      const before = (W.steps[st.pos - 1] as CharStep).len;
      return [
        String(st.pos),
        st.c,
        `상태 ${p}`,
        `상태 ${q}`,
        `${(before[p] as number) + 1} · ${before[q]}`,
        st.kind,
        `link[${st.cur}] = ${st.link[st.cur]}`,
      ];
    });
    return block(
      md(
        [
          "글자 자리",
          "글자",
          "멈춘 p",
          "q",
          "len[p]+1 · len[q]",
          "갈래",
          "정한 링크",
        ],
        rows,
        ["r", "l", "l", "l", "l", "l", "l"],
      ),
      `다섯 글자가 세 갈래를 모두 지납니다. 뿌리로 잇는 글자가 ${W.steps.filter((s) => s.kind === "뿌리로 잇는다").length} 개, 길이가 이어지는 글자가 ${W.steps.filter((s) => s.kind === "길이가 이어진다").length} 개, 복제하는 글자가 ${W.clones} 개입니다.`,
    );
  },

  /** 4단계 — 복제하는 글자를 한 걸음씩. */
  "build-clone": () => {
    const st = W.steps.find((x) => x.kind === "복제한다") as CharStep;
    const q = st.q as number;
    const clone = st.clone as number;
    const phases = STEPS.filter((x) => x.char?.pos === st.pos);
    const rows = phases.map((ph) => {
      const s = ph.snap;
      const show = (v: number): string =>
        v < s.len.length
          ? `len ${s.len[v]} · 링크 ${s.link[v] === -1 ? "없음" : s.link[v]} · ${nextText(s.next[v] as Map<string, number>)}`
          : "아직 없음";
      const what =
        ph.kind === "fill"
          ? "전이를 채우고 멈춘다"
          : ph.kind === "clone"
            ? "복제 상태를 만든다"
            : "전이와 링크를 옮긴다";
      return [
        `T${ph.t}`,
        what,
        show(q),
        show(clone),
        show(st.cur),
        `${nextText(s.next[0] as Map<string, number>)} / ${nextText(s.next[1] as Map<string, number>)}`,
      ];
    });
    const qBefore = (W.steps[st.pos - 1] as CharStep).len;
    return block(
      md(
        [
          "걸음",
          "하는 일",
          `상태 ${q} (q)`,
          `상태 ${clone} (복제)`,
          `상태 ${st.cur} (cur)`,
          "상태 0 / 상태 1 의 전이",
        ],
        rows,
        ["l", "l", "l", "l", "l", "l"],
      ),
      `멈춘 p 는 상태 ${st.stopAt} 이고 len[p] + 1 = ${(qBefore[st.stopAt] as number) + 1}${이가((qBefore[st.stopAt] as number) + 1)} len[q] = ${qBefore[q]} 보다 작습니다. 다 만든 뒤 복제 상태 ${clone}${이가(clone)} 담는 문자열은 ${words(MEMBERS[clone] as string[])} 이고, 상태 ${q}${이가(q)} 담는 문자열은 ${words(MEMBERS[q] as string[])} 하나입니다. 전이를 옮긴 상태는 ${st.rewired.map((r) => `상태 ${r}`).join(" · ")} 입니다.`,
    );
  },

  /** 4단계 끝 — 상태 수와 전이 수의 크기. */
  "build-state-scale": () => {
    const rows = [8, 64, 512, 4096].map((n) => {
      const a = built(onePrefix(n), false);
      const c = built(twoEnds(n), false);
      const d = built(sameChar(n), false);
      return [
        num(n),
        num(d.states),
        num(a.states),
        num(2 * n - 1),
        num(c.trans),
        num(3 * n - 4),
      ];
    });
    const big = built(onePrefix(N_LIMIT), false);
    const bigT = built(twoEnds(N_LIMIT), false);
    const bigS = built(sameChar(N_LIMIT), false);
    rows.push([
      num(N_LIMIT),
      num(bigS.states),
      num(big.states),
      num(2 * N_LIMIT - 1),
      num(bigT.trans),
      num(3 * N_LIMIT - 4),
    ]);
    return block(
      md(
        [
          "n",
          "같은 글자만 쓴 것의 상태",
          "첫 글자만 다른 것의 상태",
          "2n-1",
          "앞뒤가 다른 것의 전이",
          "3n-4",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      `다섯 규모 모두에서 첫 글자만 다른 문자열의 상태가 2n-1 과 같고, 앞뒤가 다른 문자열의 전이가 3n-4 와 같습니다. 같은 글자만 쓴 문자열의 상태는 n+1 입니다.`,
    );
  },

  /** 5단계 — 세기와 찾기. */
  "build-query": () => {
    const rows: string[][] = [];
    for (const t of ["", "a", "aba", "bb", WALK, `${WALK}a`]) {
      const w = walkPath(W, t);
      rows.push([
        t === "" ? "빈 문자열" : `"${t}"`,
        w.path.map((v) => `상태 ${v}`).join(" → "),
        w.stuckAt === null
          ? "끝까지 갔다"
          : `자리 ${w.stuckAt} 의 ${t[w.stuckAt]} 전이가 없다`,
        String(new SuffixAutomaton(WALK).contains(t)),
      ]);
    }
    return block(
      md(["찾는 문자열", "지나간 상태", "멈춘 까닭", "contains"], rows, [
        "l",
        "l",
        "l",
        "l",
      ]),
      `같은 접미사 자동자로 센 서로 다른 부분 문자열은 ${new SuffixAutomaton(WALK).countDistinctSubstrings()} 개입니다.`,
    );
  },

  /** 전제 — 뒤에 붙이면 옛 상태의 len 이 그대로이고, 앞에 붙이면 아니다. */
  "build-premise-append": () => {
    const base = built(WALK, false);
    const rows: string[][] = [];
    for (const [how, s] of [
      ["뒤에 a 를 붙인다", `${WALK}a`],
      ["뒤에 b 를 붙인다", `${WALK}b`],
      ["앞에 a 를 붙인다", `a${WALK}`],
      ["앞에 b 를 붙인다", `b${WALK}`],
    ] as const) {
      const b = built(s, false);
      let kept = 0;
      for (let v = 1; v < base.states; v++) {
        // 옛 상태가 담던 가장 긴 문자열이 새 자동자에서도 같은 len 의 상태에 가장 긴 것으로 남는가.
        const longest = MEMBERS[v]?.at(-1) as string;
        const u = stateOf(b, longest);
        const newMembers = wordsOfState(b, s, u);
        if (
          u === v &&
          b.len[u] === base.len[v] &&
          newMembers.at(-1) === longest
        ) {
          kept++;
        }
      }
      rows.push([how, `"${s}"`, `${kept} / ${base.states - 1}`, num(b.states)]);
    }
    return block(
      md(
        ["바꾼 방식", "문자열", "번호와 len 이 그대로인 옛 상태", "새 상태 수"],
        rows,
        ["l", "l", "r", "r"],
      ),
      `뒤에 붙이면 옛 상태가 번호와 가장 긴 문자열을 그대로 지니고, 앞에 붙이면 그렇지 않은 옛 상태가 생깁니다.`,
    );
  },

  /** 설계 선택 — 전이 표를 맵으로 두는가, 글자마다 칸을 두는가. */
  "build-map": () => {
    const rows: string[][] = [];
    for (const [label, mk] of [
      ["무작위 26 글자", varied],
      ["앞뒤가 다르다", twoEnds],
    ] as const) {
      const b = built(mk(N_LIMIT), false);
      for (const sigma of [26, 256, 65_536]) {
        const slots = sigma * b.states;
        rows.push([
          label,
          num(sigma),
          num(b.states),
          num(slots),
          `${num(Math.round((slots * 4) / 1e6))} MB`,
          num(b.trans),
        ]);
      }
    }
    return block(
      md(
        [
          "문자열 모양",
          "문자 집합 크기",
          "상태",
          "글자마다 칸을 둔 칸 수",
          "칸마다 4 바이트",
          "맵에 든 전이",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      `n = ${num(N_LIMIT)} 에서 상태와 전이는 정본과 같은 절차의 사본이 센 값이고, 칸 수와 바이트는 그 상태 수에 문자 집합 크기를 곱한 식의 값입니다.`,
    );
  },

  /* ─────────────── deep.walk ─────────────── */

  /** T1 — 뿌리 상태 하나. */
  "walk-init": () => {
    const b = built("");
    return columns([
      ["상태 수", String(b.states)],
      ["len", `[${b.len.join(", ")}]`],
      ["link", `[${b.link.join(", ")}]`],
      ["전이 수", String(b.trans)],
    ]);
  },

  /** T2~T5 — 글자 넷을 붙인 뒤. */
  "walk-fill": () => {
    const rows: string[][] = [
      ["걸음", "글자", "cur", "전이를 적은 상태", "멈춘 p", "link[cur]"],
    ];
    for (const ph of STEPS.filter((x) => x.kind === "char")) {
      const st = ph.char as CharStep;
      rows.push([
        `T${ph.t}`,
        `${st.pos}:${st.c}`,
        String(st.cur),
        spaced(st.filled),
        String(st.stopAt),
        String(st.link[st.cur]),
      ]);
    }
    return columns(rows);
  },

  /** 짚고 가기 — 있는 전이를 덮어쓰면. */
  "pause-overwrite": () => {
    const rows = mutantRows(overwrite, [WALK, "abab", "aaa", "banana"]);
    return block(
      md(["문자열", "정본", "있는 전이를 덮어쓴 판", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      `문자열 ${rows.length} 개 가운데 ${offCount(rows)} 개에서 개수가 정본과 갈립니다. 네 문자열 모두 둘째 글자부터 그 반복을 지나갑니다.`,
    );
  },

  /** T3·T5 — 전이가 이미 있는 자리에서 멈춰 길이를 비교하는 갈래. */
  "walk-equal": () => {
    const rows: string[][] = [
      ["걸음", "p", "q", "len[p]+1", "len[q]", "link[cur]"],
    ];
    for (const ph of STEPS.filter(
      (x) => x.kind === "char" && x.char?.kind === "길이가 이어진다",
    )) {
      const st = ph.char as CharStep;
      rows.push([
        `T${ph.t}`,
        String(st.stopAt),
        String(st.q),
        String((st.len[st.stopAt] as number) + 1),
        String(st.len[st.q as number]),
        String(st.link[st.cur]),
      ]);
    }
    return columns(rows);
  },

  /** 짚고 가기 — 길이가 어긋나는데 복제를 안 만들면. */
  "pause-no-clone": () => {
    const cases = [WALK, "abcbc", "banana", "abab"];
    const rows = mutantRows(noClone, cases);
    const noCloneCase = cases.filter((s) => built(s, false).clones === 0);
    return block(
      md(["문자열", "정본", "복제를 안 만든 판", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      `복제를 한 번도 안 하는 문자열은 ${noCloneCase.map((s) => `"${s}"`).join(" · ")} 이고, 문자열 ${rows.length} 개 가운데 ${offCount(rows)} 개에서 개수가 정본보다 작습니다.`,
    );
  },

  /** T6~T8 — 길이가 어긋나 복제 상태를 만드는 갈래. */
  "walk-clone": () => {
    const st = W.steps.find((x) => x.kind === "복제한다") as CharStep;
    const q = st.q as number;
    const clone = st.clone as number;
    const lines: string[][] = [];
    for (let v = 0; v < W.states; v++) {
      lines.push([
        `상태 ${v}`,
        `len ${st.len[v]}`,
        `link ${st.link[v]}`,
        nextText(st.next[v] as Map<string, number>),
      ]);
    }
    return columns([
      ["cloneLen", String(st.len[clone])],
      ["clone", String(clone)],
      [`link[${clone}]`, String(st.link[clone])],
      ["⑦ 이 옮긴 상태", spaced(st.rewired)],
      [`link[${q}] · link[${st.cur}]`, `${st.link[q]} · ${st.link[st.cur]}`],
      ["", ""],
      ...lines,
    ]);
  },

  /** 짚고 가기 — 전이 표를 복사하지 않고 함께 쓰면. */
  "pause-share-next": () => {
    const cases = [WALK, "abcbc", "banana", SHARE_BREAKS, "abbabb"];
    const rows = mutantRows(shareNext, cases);
    const scan = shortestShareBreak();
    const withClone = cases.filter((s) => built(s, false).clones > 0).length;
    return block(
      md(["문자열", "정본", "전이 표를 함께 쓴 판", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      `문자열 ${rows.length} 개 가운데 ${withClone} 개가 복제를 한 번 이상 하고, 개수가 정본과 갈리는 것은 ${offCount(rows)} 개입니다. 알파벳 두 글자로 만든 길이 1~6 문자열 ${num(scan.checked)} 개를 전수로 걸면 갈리는 것이 ${scan.diverged} 개이고, 가장 짧은 것은 길이 ${scan.shortest} 의 "${scan.first}" 입니다.`,
    );
  },

  /** T9·T10 — 전이를 따라가 부분 문자열인지 답한다. */
  "walk-contains": () => {
    const rows: string[][] = [["걸음", "t", "지나간 상태", "반환"]];
    for (const ph of STEPS.filter((x) => x.kind === "query")) {
      const qq = ph.query as NonNullable<WalkStep["query"]>;
      rows.push([
        `T${ph.t}`,
        `"${qq.t}"`,
        qq.path.join(" → ") +
          (qq.stuckAt === null ? "" : ` (자리 ${qq.stuckAt} 에서 멈춤)`),
        String(new SuffixAutomaton(WALK).contains(qq.t)),
      ]);
    }
    return columns(rows);
  },

  /** T11 — 길이 차의 합으로 센다. */
  "walk-count": () => {
    const ph = STEPS.find((x) => x.kind === "count") as WalkStep;
    return columns([
      ["더한 값", (ph.adds as number[]).join(" + ")],
      ["반환", String(new SuffixAutomaton(WALK).countDistinctSubstrings())],
      ["집합에 담아 센 값", String(bySet(WALK).distinct)],
    ]);
  },

  /** 열한 걸음 전체. */
  "walk-trace": () => {
    const rows = STEPS.map((ph) => {
      const s = ph.snap;
      if (ph.kind === "root") {
        return [`T${ph.t}`, "뿌리 상태 하나", "-", "-", "상태 1 개"];
      }
      if (ph.kind === "query") {
        const qq = ph.query as NonNullable<WalkStep["query"]>;
        return [
          `T${ph.t}`,
          `contains("${qq.t}")`,
          qq.path.join(" → "),
          qq.ok ? "끝까지 갔다" : `자리 ${qq.stuckAt} 에서 전이가 없다`,
          String(qq.ok),
        ];
      }
      if (ph.kind === "count") {
        return [
          `T${ph.t}`,
          "countDistinctSubstrings()",
          (ph.adds as number[]).join(" + "),
          "-",
          String(ph.total),
        ];
      }
      const st = ph.char as CharStep;
      const where = `자리 ${st.pos} 의 ${st.c}`;
      if (ph.kind === "char") {
        return [
          `T${ph.t}`,
          where,
          `cur ${st.cur} · 전이를 적은 상태 ${spaced(st.filled)}`,
          st.kind,
          `link[${st.cur}] = ${st.link[st.cur]}`,
        ];
      }
      if (ph.kind === "fill") {
        return [
          `T${ph.t}`,
          where,
          `cur ${st.cur} · 전이를 적은 상태 ${spaced(st.filled)}`,
          `p ${st.stopAt} · q ${st.q} · len[p]+1 < len[q]`,
          `상태 ${s.len.length} 개`,
        ];
      }
      if (ph.kind === "clone") {
        const c = st.clone as number;
        return [
          `T${ph.t}`,
          `복제 상태 ${c}`,
          `len ${s.len[c]} · link ${s.link[c]}`,
          `전이 ${nextText(s.next[c] as Map<string, number>)}${을를(nextText(s.next[c] as Map<string, number>))} 물려받는다`,
          `상태 ${s.len.length} 개`,
        ];
      }
      return [
        `T${ph.t}`,
        "전이와 링크를 옮긴다",
        `상태 ${spaced(st.rewired)} 의 ${st.c} 전이를 ${st.clone}${으로(st.clone as number)}`,
        `link[${st.q}] = link[${st.cur}] = ${st.clone}`,
        `전이 ${s.next.reduce((a, m) => a + m.size, 0)} 개`,
      ];
    });
    return block(
      md(["걸음", "하는 일", "값", "갈래 · 까닭", "결과"], rows, [
        "l",
        "l",
        "l",
        "l",
        "l",
      ]),
      `T1 부터 T${STEPS.filter((x) => x.kind !== "query" && x.kind !== "count").length} 까지가 문자열을 한 번 읽는 만들기이고, 뒤의 ${STEPS.filter((x) => x.kind === "query" || x.kind === "count").length} 걸음은 문자열을 다시 읽지 않습니다.`,
    );
  },

  /** 갈래마다 실행된 걸음. */
  "branch-coverage": () => {
    const at = (pred: (x: WalkStep) => boolean): string =>
      STEPS.filter(pred)
        .map((x) => `T${x.t}`)
        .join(" · ");
    const isChar = (x: WalkStep) => x.kind === "char" || x.kind === "fill";
    const rows = [
      ["①", "상태 하나를 만든다", at((x) => isChar(x) || x.kind === "clone")],
      ["②", "글자마다 새 상태 cur", at(isChar)],
      [
        "③",
        "빈 전이만 채운다",
        at((x) => isChar(x) && (x.char as CharStep).filled.length > 0),
      ],
      [
        "④",
        "뿌리로 잇는다",
        at((x) => x.kind === "char" && x.char?.kind === "뿌리로 잇는다"),
      ],
      [
        "⑤",
        "q 를 그대로 잇는다",
        at((x) => x.kind === "char" && x.char?.kind === "길이가 이어진다"),
      ],
      ["⑥", "복제 상태를 만든다", at((x) => x.kind === "clone")],
      ["⑦", "전이를 복제 상태로 옮긴다", at((x) => x.kind === "rewire")],
      ["⑧", "길이 차를 더한다", at((x) => x.kind === "count")],
      ["⑨", "전이를 따라간다", at((x) => x.kind === "query")],
    ];
    return block(
      md(["라벨", "하는 일", "실행된 걸음"], rows, ["l", "l", "l"]),
      `라벨 ${rows.length} 개가 모두 한 번 이상 실행됐습니다.`,
    );
  },

  /** 전체 코드를 여러 입력에 건다. */
  "final-run": () => {
    const cases: [string, string[]][] = [
      [WALK, ["aba", "bb"]],
      ["abcbc", ["bcb", "abc", "bca", ""]],
      ["aaa", ["aaa", "aaaa"]],
      ["banana", ["ana", "nb"]],
      ["a", ["a", "b"]],
    ];
    const rows = cases.map(([s, ts]) => {
      const sam = new SuffixAutomaton(s);
      return [
        `new SuffixAutomaton("${s}")`,
        `개수 ${sam.countDistinctSubstrings()}`,
        ts.map((t) => `"${t}" ${sam.contains(t)}`).join(" · "),
      ];
    });
    return columns(rows);
  },

  /* ─────────────── related ─────────────── */

  /** 한 무리 안의 문자열은 뒤에 붙일 수 있는 글자가 같다. */
  "related-nerode": () => {
    const rows = GROUPS.map((g) => {
      const v = stateOf(W, g.words.at(-1) as string);
      const sets = g.words.map((w) => followSet(WALK, w));
      const same = sets.every((x) => x === sets[0]);
      const keys = [...(W.next[v] as Map<string, number>).keys()]
        .sort()
        .join(" ");
      return [
        `상태 ${v}`,
        words(g.words),
        setText(g.at),
        sets[0] === "" ? "없음" : (sets[0] as string),
        keys === "" ? "없음" : keys,
        same ? "하나로 같음" : "갈림",
      ];
    });
    const all = new Set(rows.map((r) => r[3] as string));
    return block(
      md(
        [
          "상태",
          "그 무리의 문자열",
          "끝나는 자리",
          "뒤에 붙일 수 있는 글자",
          "전이 표의 글자",
          "무리 안의 문자열끼리",
        ],
        rows,
        ["l", "l", "l", "l", "l", "l"],
      ),
      `무리 ${GROUPS.length} 개에서 「뒤에 붙일 수 있는 글자」는 ${all.size} 가지이고, 전이 표의 글자와 갈리는 무리는 ${rows.filter((r) => r[3] !== r[4]).length} 개입니다.`,
    );
  },

  /* ─────────────── deep.math ─────────────── */

  /** ① 정의 — endpos 를 전개 입력의 세 문자열에 넣는다. */
  "math-define": () => {
    const rows = ["b", "ab", "aab"].map((w) => {
      const at = endposOf(WALK, w);
      const spans = at.map((e) => `[${e - w.length + 1},${e}]`).join(" · ");
      return [w, spans, setText(at), `상태 ${stateOf(W, w)}`];
    });
    return block(
      md(["w", "w 가 놓인 구간", "endpos(w)", "담긴 상태"], rows, [
        "l",
        "l",
        "l",
        "l",
      ]),
      `b 와 ab 는 endpos 가 같아 한 상태에 들고, aab 는 endpos 가 달라 다른 상태에 듭니다.`,
    );
  },

  /** ② 검산 — 끝나는 자리 무리와 상태가 하나씩 맞물리는가. */
  "math-check": () => {
    let agree = 0;
    const rows = GROUPS.map((g) => {
      const longest = g.words.at(-1) as string;
      const v = stateOf(W, longest);
      const parent = W.link[v] as number;
      const diff = (W.len[v] as number) - (W.len[parent] as number);
      if (diff === g.words.length) agree++;
      return [
        setText(g.at),
        words(g.words),
        `상태 ${v}`,
        String(W.len[v]),
        String((W.len[parent] as number) + 1),
        String(g.words.length),
        String(diff),
      ];
    });
    return block(
      md(
        [
          "끝나는 자리",
          "그 무리의 문자열",
          "상태",
          "len(v)",
          "len(link(v)) + 1",
          "무리 크기",
          "len(v) − len(link(v))",
        ],
        rows,
        ["l", "l", "l", "r", "r", "r", "r"],
      ),
      `무리 ${GROUPS.length} 개 가운데 ${agree} 개에서 무리 크기와 두 len 의 차가 같고, 뿌리를 뺀 상태도 ${W.states - 1} 개입니다.`,
    );
  },

  /** ③ 유도의 바탕 — 글자 자리마다 상태가 몇 개 늘 수 있는가를 전수로 잰다. */
  "math-growth": () => {
    const maxLen = 8;
    const most = Array.from({ length: maxLen }, () => 0);
    let checked = 0;
    const walk = (w: string): void => {
      if (w.length > 0) {
        checked++;
        const b = built(w);
        let before = 1;
        for (const st of b.steps) {
          const after = st.len.length;
          most[st.pos] = Math.max(most[st.pos] as number, after - before);
          before = after;
        }
      }
      if (w.length === maxLen) return;
      for (const c of "abc") walk(w + c);
    };
    walk("");
    const rows = most.map((m, i) => [String(i), `+${m}`]);
    return block(
      md(["글자 자리", "상태가 가장 많이 는 수"], rows, ["r", "r"]),
      `알파벳 세 글자로 만든 길이 1~${maxLen} 문자열 ${num(checked)} 개를 전수로 만들었습니다. 자리 0 과 자리 1 에서는 늘 1 개씩 늘고, 자리 2 부터는 가장 많을 때 2 개씩 늡니다.`,
    );
  },

  /** ④ 계수 — 식에 과제 규모를 넣는다. */
  "math-scale": () => {
    const rows = [8, 64, 512, 4096].map((n) => {
      const most = built(onePrefix(n), false);
      const least = built(sameChar(n), false);
      const mixed = built(varied(n), false);
      return [
        num(n),
        num(2 * n - 1),
        num(most.states),
        num(mixed.states),
        num(least.states),
        num((n * (n + 1)) / 2),
      ];
    });
    const maxDistinct = (N_LIMIT * (N_LIMIT + 1)) / 2;
    return block(
      md(
        [
          "n",
          "상한 2n-1",
          "첫 글자만 다른 것",
          "무작위 26 글자",
          "같은 글자만 쓴 것",
          "부분 문자열 상한 n(n+1)/2",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      `가운데 세 열이 상태 수이고 어느 줄에서도 2n-1 을 넘지 않습니다. n = ${num(N_LIMIT)} 이면 상태 수의 상한은 ${num(2 * N_LIMIT - 1)} 개이고 서로 다른 부분 문자열의 상한은 ${num(maxDistinct)} 개입니다.`,
    );
  },

  /* ─────────────── invariant ─────────────── */

  /** 상태를 바꾸는 세 갈래가 길이 구간을 어떻게 두는가. */
  "invariant-hold": () => {
    let kept = 0;
    const rows = W.steps.map((st) => {
      const v = st.cur;
      const parent = st.link[v] as number;
      const lo = (st.len[parent] as number) + 1;
      const hi = st.len[v] as number;
      const prefix = WALK.slice(0, st.pos + 1);
      const at = endpos(prefix);
      const ws = Array.from({ length: hi - lo + 1 }, (_, k) =>
        prefix.slice(prefix.length - (lo + k)),
      );
      const keys = ws.map((w) => (at.get(w) as number[]).join(" "));
      const same = keys.every((k) => k === keys[0]);
      if (same) kept++;
      return [
        `자리 ${st.pos}`,
        st.kind,
        `상태 ${v}`,
        `${lo} 부터 ${hi} 까지`,
        words(ws),
        setText(at.get(ws[0] as string) as number[]),
      ];
    });
    return block(
      md(
        [
          "글자",
          "지난 갈래",
          "새 상태",
          "담는 길이",
          "그 문자열",
          "끝나는 자리",
        ],
        rows,
        ["l", "l", "l", "l", "l", "l"],
      ),
      `끝나는 자리는 그 글자까지 읽은 접두사 안에서 센 것입니다. 다섯 글자 가운데 ${kept} 글자에서, 새 상태가 담은 문자열의 끝나는 자리 집합이 서로 모두 같습니다.`,
    );
  },

  /** 경계에 가까운 입력들. */
  "invariant-edge": () => {
    const rows = [
      ["빈 문자열", ""],
      ["한 글자", "a"],
      ["같은 글자 둘", "aa"],
      ["다른 글자 둘", "ab"],
      ["같은 글자 다섯", "aaaaa"],
      ["첫 글자만 다른 다섯", "abbbb"],
    ].map(([label, s]) => {
      const str = s as string;
      const ref = new SuffixAutomaton(str);
      const b = built(str, false);
      return [
        label as string,
        `"${str}"`,
        String(str.length),
        String(b.states),
        String(b.trans),
        String(ref.countDistinctSubstrings()),
        String(ref.contains("")),
        String(ref.contains("b")),
      ];
    });
    return md(
      [
        "입력",
        "문자열",
        "n",
        "상태",
        "전이",
        "서로 다른 부분 문자열",
        'contains("")',
        'contains("b")',
      ],
      rows,
      ["l", "l", "r", "r", "r", "r", "l", "l"],
    );
  },

  /** 변이 — 복제 상태의 길이를 q 의 길이로 두면. */
  "mutant-clone-len": () => {
    const rows = mutantRows(cloneLen, [WALK, "abcbc", "banana", "abab"]);
    const scan = cloneScan();
    return block(
      md(["문자열", "정본", "복제 길이를 q 로 둔 판", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      `복제를 한 번 이상 하는 문자열을 알파벳 두 글자로 만든 길이 12 이하 · 세 글자로 만든 길이 8 이하에서 전수로 모으면 ${num(scan.withClone)} 개이고, 그중 복제 길이를 q 로 둔 판의 개수가 정본과 같은 것은 ${scan.same} 개입니다.`,
    );
  },

  /** 변이 — 접미사 링크가 담은 몫을 안 빼면. */
  "mutant-count-all": () => {
    const rows = mutantRows(countAll, [WALK, "abab", "aaa", "abcbc"]);
    return block(
      md(["문자열", "정본", "링크 몫을 안 뺀 판", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      `문자열 ${rows.length} 개 가운데 ${offCount(rows)} 개에서 개수가 정본보다 큽니다.`,
    );
  },

  /* ─────────────── perf ─────────────── */

  /** 전개의 걸음을 그대로 센다. */
  "perf-derive": () => {
    const rows = [
      ["글자를 받은 횟수", String(W.steps.length), "T2 ~ T8"],
      ["새 상태를 만든 횟수", String(W.states - 1), "T2 ~ T7"],
      ["③ 이 전이를 적은 횟수", String(W.fillSteps), "T2 ~ T6"],
      ["⑦ 이 전이를 옮긴 횟수", String(W.rewireSteps), "T8"],
      ["복제한 횟수", String(W.clones), "T7"],
      ["복제가 복사한 전이 항목", String(W.copied), "T7"],
      ["세기의 자료 접근", String(WU.countOps), "T11"],
      ["찾기의 자료 접근", String(WU.queryOps), "T9 · T10"],
      ["만들기의 자료 접근", String(W.ops), "T1 ~ T8"],
    ];
    return block(
      md(["센 것", "횟수", "걸음"], rows, ["l", "r", "l"]),
      `③ 이 적은 전이 ${W.fillSteps} 개와 복제가 복사한 항목 ${W.copied} 개를 더하면 ${W.fillSteps + W.copied} 이고, 다 만든 접미사 자동자의 전이 수도 ${W.trans} 개입니다.`,
    );
  },

  /** 케이스별 계수. */
  "perf-bounds": () => {
    const n = 4096;
    const shapes: [string, (m: number) => string][] = [
      ["같은 글자만", sameChar],
      ["두 글자를 번갈아", alternating],
      ["첫 글자만 다르다", onePrefix],
      ["앞뒤가 다르다", twoEnds],
      ["무작위 26 글자", varied],
    ];
    let identity = 0;
    const body = shapes.map(([label, mk]) => {
      const b = built(mk(n), false);
      if (b.fillSteps + b.copied === b.trans) identity++;
      return [
        label,
        num(b.states),
        num(b.trans),
        num(b.fillSteps),
        num(b.rewireSteps),
        num(b.copied),
        num(b.ops + runOn(b, []).countOps),
      ];
    });
    const ops = shapes.map(([, mk]) => {
      const b = built(mk(n), false);
      return b.ops + runOn(b, []).countOps;
    });
    return block(
      md(
        [
          "문자열 모양",
          "상태",
          "전이",
          "③ 적은 전이",
          "⑦ 옮긴 전이",
          "복사 항목",
          "자료 접근",
        ],
        body,
        ["l", "r", "r", "r", "r", "r", "r"],
      ),
      `n 은 ${num(n)} 입니다. 다섯 모양 모두 ${identity === shapes.length ? "「③ 적은 전이 + 복사 항목 = 전이」가 성립하고" : "항등식이 깨지고"}, 자료 접근의 가장 큰 값과 가장 작은 값의 비는 ${ratio(Math.max(...ops), Math.min(...ops))} 배입니다.`,
    );
  },

  /** 최악을 만드는 입력. */
  "perf-worst": () => {
    const rows = [64, 512, 4096, N_LIMIT].map((n) => {
      const a = built(onePrefix(n), false);
      const c = built(twoEnds(n), false);
      return [
        num(n),
        num(a.states),
        num(2 * n - 1),
        num(c.trans),
        num(3 * n - 4),
        num(c.ops + runOn(c, []).countOps),
      ];
    });
    const big = built(twoEnds(N_LIMIT), false);
    const bigOps = big.ops + runOn(big, []).countOps;
    return block(
      md(
        [
          "n",
          "첫 글자만 다른 것의 상태",
          "2n-1",
          "앞뒤가 다른 것의 전이",
          "3n-4",
          "앞뒤가 다른 것의 자료 접근",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      `n = ${num(N_LIMIT)} 에서 앞뒤가 다른 문자열의 자료 접근은 ${num(bigOps)} 번이고 초당 1 억 번으로 나누면 ${secondsOf(bigOps)}입니다. 같은 규모에서 집합에 전부 담기는 식으로 ${num(bySetFormula(N_LIMIT))} 번입니다.`,
    );
  },

  /* ─────────────── selfcheck ─────────────── */

  /** 예측 문제의 답. */
  "selfcheck-answer": () => {
    const s = `${WALK}a`;
    const b = built(s);
    const last = b.steps.at(-1) as CharStep;
    const used = runOn(b, []);
    const before = b.steps.at(-2) as CharStep;
    const p = last.stopAt;
    const q = last.q as number;
    const rows = [
      ["문자열", `"${s}"`],
      ["글자 자리", String(last.pos)],
      ["새 상태 cur", String(last.cur)],
      ["③ 이 전이를 적은 상태", spaced(last.filled)],
      ["③ 이 멈춘 p", String(p)],
      ["q", String(q)],
      [
        "len[p] + 1 · len[q]",
        `${(before.len[p] as number) + 1} · ${before.len[q]}`,
      ],
      ["지난 갈래", last.kind],
      ["복제 상태", last.clone === null ? "없음" : String(last.clone)],
      ["상태 수", String(b.states)],
      ["서로 다른 부분 문자열", String(used.total)],
    ];
    return block(
      md(["살펴볼 것", `"${s}"`], rows, ["l", "l"]),
      `"${WALK}" 의 ${WU.total} 개에서 ${used.total - WU.total} 개가 늘었습니다.`,
    );
  },
};
