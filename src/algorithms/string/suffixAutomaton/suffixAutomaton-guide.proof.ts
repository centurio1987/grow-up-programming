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
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 생성자가 정본과 **같은 객체인가**로 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa } from "../../../../tools/josa.ts";
import { SuffixAutomaton } from "./suffixAutomaton-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 문자열. 다섯 글자다.
 *
 * 세 갈래를 한 입력에서 전부 실행한다 — 링크를 끝까지 거슬러 올라가 뿌리로 잇는 갈래(글자
 * 1·3), 길이가 이어져 그대로 잇는 갈래(글자 2·4), 길이가 어긋나 복제 상태를 만드는 갈래
 * (글자 5)다. 복제가 마지막 글자에서 한 번만 일어나므로 그 앞뒤를 나란히 볼 수 있다.
 */
export const WALK = "aabab";

/** 전개가 던지는 검색 문자열 — 하나는 부분 문자열이고 하나는 아니다. */
export const WALK_QUERIES = ["aba", "bb"];

/**
 * 전이 표를 복사하지 않고 함께 쓴 판이 답을 바꾸는 **가장 짧은** 문자열.
 *
 * 알파벳 `{a, b}` 의 길이 1~6 문자열을 전수로 검사해 얻었다(길이 5 까지는 한 자리도 없다).
 */
export const SHARE_BREAKS = "abbaba";

/** 제약의 최댓값. */
export const N_LIMIT = 100_000;

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
 * 겹침이 적은 문자열 — 결정론적 난수(mulberry32, 씨앗 `0x9e3779b9`)로 스물여섯 글자에서
 * 고른다. 난수를 쓰지만 씨앗이 고정이라 실행마다 같은 문자열이다.
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

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `1,024` 꼴 — 본문 표기와 같다. */
const comma = (n: number): string => n.toLocaleString("en-US");

/** `1 2 4` 꼴 — 집합의 원소를 자리 사이에 하나씩 띄워 적는다. */
const spaced = (a: number[]): string => (a.length === 0 ? "없음" : a.join(" "));

/** `2,771.5` 꼴 — 소수 첫째 자리까지 남기고 천 단위를 끊는다. */
const ratio = (a: number, b: number): string =>
  (Math.round((a / b) * 10) / 10).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

/** 표 한 벌을 값에서 잰 폭에 맞춰 낸다. 첫 행이 머리줄이다. */
function table(rows: string[][], alignRight: number[] = []): string[] {
  const cols = rows[0]?.length ?? 0;
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((cell, c) =>
        alignRight.includes(c)
          ? padLeft(cell, widths[c] ?? 0)
          : padRight(cell, widths[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, ""),
  );
}

/** 캡션 줄 여럿을 이름 칸에 맞춰 낸다. */
function captions(rows: [string, string][], indent = ""): string[] {
  const w = Math.max(...rows.map(([k]) => width(k)));
  return rows.map(([k, v]) =>
    `${indent}${padRight(k, w)}  ${v}`.replace(/\s+$/, ""),
  );
}

/* ────────────────── 세는 사본 — 이 글이 세우는 절차 ────────────────── */

/** 글자 하나를 붙이는 동안 일어난 일. */
export interface CharStep {
  /** 몇 번째 글자인가. 1 부터 센다. */
  index: number;
  c: string;
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
  len: number[];
  link: number[];
  next: Map<string, number>[];
}

export interface Built {
  len: number[];
  link: number[];
  next: Map<string, number>[];
  steps: CharStep[];
  /** 자료 접근 — 배열 칸 하나 또는 전이 표 항목 하나를 읽거나 쓴 것. */
  ops: number;
  states: number;
  trans: number;
  fillSteps: number;
  rewireSteps: number;
  clones: number;
  /** 복제가 물려받으며 복사한 전이 항목 수. */
  copied: number;
}

/** 정본과 같은 절차에 걸음 기록과 계수만 덧붙인 사본. */
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
        index: i + 1,
        c,
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

/** 만든 오토마톤으로 세기와 찾기를 실행하고 그때의 자료 접근을 함께 낸다. */
export function runOn(
  b: Built,
  queries: string[],
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
  b: Built,
  t: string,
): { path: number[]; stuckAt: string | null } {
  const path = [0];
  let v = 0;
  for (const c of t) {
    const to = (b.next[v] as Map<string, number>).get(c);
    if (to === undefined) return { path, stuckAt: c };
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

/** `s` 의 서로 다른 부분 문자열마다 끝나는 자리를 모은다. 자리는 1 부터 센다. */
export function endpos(s: string): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (let i = 0; i < s.length; i++) {
    for (let j = i + 1; j <= s.length; j++) {
      const w = s.slice(i, j);
      const at = out.get(w);
      if (at === undefined) out.set(w, [j]);
      else if (at[at.length - 1] !== j) at.push(j);
    }
  }
  return out;
}

/** 끝나는 자리 집합이 같은 것끼리 묶는다. 무리 안은 길이 오름차순이다. */
export function endposGroups(s: string): { key: string; words: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const [w, at] of endpos(s)) {
    const key = at.join(" ");
    const bag = groups.get(key);
    if (bag === undefined) groups.set(key, [w]);
    else bag.push(w);
  }
  return [...groups.entries()]
    .map(([key, words]) => ({
      key,
      words: words.sort((a, b) => a.length - b.length),
    }))
    .sort((a, b) => {
      const x = a.words[0] as string;
      const y = b.words[0] as string;
      return x.length - y.length || (x < y ? -1 : 1);
    });
}

/** 상태 `v` 가 담는 문자열 — 길이 `len[link[v]] + 1` 부터 `len[v]` 까지의 접미사들. */
export function wordsOfState(b: Built, s: string, v: number): string[] {
  const longest = b.len[v] as number;
  const shortest = (b.len[b.link[v] as number] as number) + 1;
  // 상태 `v` 가 담는 가장 긴 문자열을 찾아 그 접미사를 길이별로 자른다.
  for (const [w, _at] of endpos(s)) {
    if (w.length !== longest) continue;
    if (stateOf(b, w) !== v) continue;
    const out: string[] = [];
    for (let L = shortest; L <= longest; L++) out.push(w.slice(w.length - L));
    return out;
  }
  return [];
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

/** 문자열 하나가 어느 상태에 담기는가. 전이를 따라간 끝자리다. */
export function stateOf(b: Built, w: string): number {
  let v = 0;
  for (const c of w) {
    const to = (b.next[v] as Map<string, number>).get(c);
    if (to === undefined) return -1;
    v = to;
  }
  return v;
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
  "banana",
  "mississippi",
  onePrefix(17),
  twoEnds(17),
  sameChar(17),
  cycle26(30),
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

/** ⑧ 에서 링크가 이미 담은 몫을 안 빼는 사본. */
const countAll = await loadMutant<Impl>(REF, {
  swap: [/ - \(this\.len\[parent\] as number\)/, " - 0"],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 생성자가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = overwrite.SuffixAutomaton === SuffixAutomaton;

/** 변이 하나를 문자열 여럿에 걸어 정본과 나란히 놓는다. */
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

/** 변이 하나를 문자열 여럿에 걸어 개수를 나란히 놓는다. */
function mutantTable(impl: Impl, name: string, cases: string[]): string {
  const rows = cases.map((s) => {
    const a = new SuffixAutomaton(s).countDistinctSubstrings();
    const b = mutantCount(impl, s);
    const shown = b === null ? "실행이 끝나지 않는다" : String(b);
    return [`"${s}"`, String(a), shown, a === b ? "같다" : "다르다"];
  });
  return table([["문자열", "정본", name, "판정"], ...rows], [1, 2]).join("\n");
}

/* ────────────────────────── 블록 ────────────────────────── */

const W = built(WALK);
const WU = runOn(W, WALK_QUERIES);

export const PROOFS: Record<string, () => string> = {
  /* ─────────────── deep.build ─────────────── */

  /** ② 부분 문자열을 전부 집합에 담는 방법을 규모별로 잰다. */
  naiveScale: () => {
    const rows = [8, 64, 512].map((n) => {
      const s = cycle26(n);
      const set = bySet(s);
      const b = built(s, false);
      const used = runOn(b, []);
      return [
        comma(n),
        comma(set.distinct),
        comma(set.ops),
        comma(bySetFormula(n)),
        comma(b.ops + used.countOps),
        `${ratio(set.ops, b.ops + used.countOps)} 배`,
      ];
    });
    const big = built(cycle26(N_LIMIT), false);
    const bigUsed = runOn(big, []);
    return [
      ...table(
        [
          [
            "n",
            "서로 다른 부분 문자열",
            "집합에 전부 담기",
            "식으로 낸 같은 값",
            "접미사 오토마톤",
            "몇 배",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      "문자열은 알파벳 스물여섯 글자를 차례로 되풀이한 것이다. 만든 부분 문자열이 n(n+1)/2",
      "개이고 읽은 글자 수 합이 n(n+1)(n+2)/6 이라 둘의 합이 집합에 담는 방법의 자료 접근이고,",
      "세 규모에서 실행값과 식이 같다",
      `제약 규모 n = ${comma(N_LIMIT)}${josa(comma(N_LIMIT), "이면", "면")}`,
      ...captions(
        [
          [
            "집합에 전부 담기",
            `${comma(bySetFormula(N_LIMIT))} 번 — 식으로 낸 값이고 실행하지 않았다`,
          ],
          ["접미사 오토마톤", `${comma(big.ops + bigUsed.countOps)} 번`],
        ],
        "  ",
      ),
    ].join("\n");
  },

  /** ② 같은 부분 문자열이 몇 번씩 다시 만들어지는가. */
  naiveRepeat: () => {
    const set = bySet(WALK);
    const rows: string[][] = [];
    for (let i = 0; i < WALK.length; i++) {
      const made: string[] = [];
      for (let j = i + 1; j <= WALK.length; j++) made.push(WALK.slice(i, j));
      rows.push([String(i + 1), made.join(" "), String(made.length)]);
    }
    return [
      ...table(
        [["시작 자리", "거기서 만든 부분 문자열", "개수"], ...rows],
        [0, 2],
      ),
      "",
      ...captions([
        ["만든 부분 문자열", `${set.made} 개`],
        ["그중 서로 다른 것", `${set.distinct} 개`],
        ["같은 것을 다시 만든 횟수", `${set.made - set.distinct} 번`],
      ]),
    ].join("\n");
  },

  /** ③ 끝나는 자리로 묶으면 무리가 몇 개인가. */
  endposGroups: () => {
    const groups = endposGroups(WALK);
    const rows: string[][] = [];
    for (const [i, g] of groups.entries()) {
      for (const [j, w] of g.words.entries()) {
        rows.push([
          j === 0 ? String(i + 1) : "",
          w,
          j === 0 ? g.key : "",
          String(w.length),
        ]);
      }
    }
    const total = [...endpos(WALK).keys()].length;
    return [
      ...table(
        [["무리", "부분 문자열", "끝나는 자리", "길이"], ...rows],
        [0, 3],
      ),
      "",
      ...captions([
        ["서로 다른 부분 문자열", `${total} 개`],
        ["끝나는 자리가 같은 무리", `${groups.length} 개`],
        [
          "가장 큰 무리가 담은 문자열",
          `${Math.max(...groups.map((g) => g.words.length))} 개`,
        ],
        [
          "한 무리 안에서 길이가 이어지지 않는 자리",
          `${groups.filter((g) => g.words.some((w, i) => i > 0 && w.length !== (g.words[i - 1] as string).length + 1)).length} 개`,
        ],
      ]),
    ].join("\n");
  },

  /** ④ 접미사를 트라이에 그대로 담는 방법과 무리로 묶는 방법을 나란히 잰다. */
  twoWays: () => {
    const shapes: [string, (n: number) => string][] = [
      ["글자가 겹치지 않는다", varied],
      ["첫 글자만 다르다", onePrefix],
    ];
    const rows: string[][] = [];
    for (const n of [8, 16, 32, 64]) {
      for (const [label, mk] of shapes) {
        const s = mk(n);
        const b = built(s, false);
        const nodes = suffixTrieNodes(s);
        rows.push([
          comma(n),
          label,
          comma(nodes),
          comma(b.states),
          `${ratio(nodes, b.states)} 배`,
        ]);
      }
    }
    return [
      ...table(
        [
          [
            "n",
            "문자열 모양",
            "접미사 트라이의 마디",
            "무리로 묶은 상태",
            "몇 배",
          ],
          ...rows,
        ],
        [0, 2, 3, 4],
      ),
      "",
      "트라이의 마디는 뿌리 하나에 서로 다른 부분 문자열 하나씩이라 겹침이 적을수록 늘고,",
      "무리로 묶은 상태는 겹침과 상관없이 n 에 비례한다",
      ...captions([
        [`전개 입력 "${WALK}" 의 트라이 마디`, `${suffixTrieNodes(WALK)} 개`],
        [`전개 입력 "${WALK}" 의 상태`, `${W.states} 개`],
      ]),
    ].join("\n");
  },

  /** ⑤ 상태마다 담는 길이 구간과 그 안의 문자열. */
  lenRange: () => {
    const rows: string[][] = [];
    let sum = 0;
    for (let v = 1; v < W.states; v++) {
      const parent = W.link[v] as number;
      const lo = (W.len[parent] as number) + 1;
      const hi = W.len[v] as number;
      sum += hi - lo + 1;
      rows.push([
        String(v),
        String(hi),
        String(parent),
        String(W.len[parent]),
        `${lo} 부터 ${hi} 까지`,
        String(hi - lo + 1),
        wordsOfState(W, WALK, v).join(" "),
      ]);
    }
    return [
      ...table(
        [
          [
            "상태",
            "len",
            "link",
            "len[link]",
            "담는 길이",
            "개수",
            "그 문자열",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 5],
      ),
      "",
      ...captions([
        ["개수의 합", `${sum} 개`],
        [`"${WALK}" 의 서로 다른 부분 문자열`, `${WU.total} 개`],
      ]),
    ].join("\n");
  },

  /** ⑥ 규모를 바꿔 가며 상태 수와 전이 수를 센다. */
  stateScale: () => {
    const rows = [8, 64, 512, 4096].map((n) => {
      const a = built(onePrefix(n), false);
      const c = built(twoEnds(n), false);
      const d = built(sameChar(n), false);
      return [
        comma(n),
        comma(a.states),
        comma(2 * n - 1),
        comma(c.trans),
        comma(3 * n - 4),
        comma(d.states),
      ];
    });
    const big = built(onePrefix(N_LIMIT), false);
    const bigT = built(twoEnds(N_LIMIT), false);
    return [
      ...table(
        [
          [
            "n",
            "첫 글자만 다른 것의 상태",
            "2n-1",
            "앞뒤가 다른 것의 전이",
            "3n-4",
            "같은 글자만 쓴 것의 상태",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      "가운데가 같고 앞뒤가 다른 문자열이 전이를 가장 많이 만들고, 첫 글자만 다른 문자열이",
      "상태를 가장 많이 만든다. 같은 글자만 되풀이하면 상태가 n+1 개로 가장 적다",
      `제약 규모 n = ${comma(N_LIMIT)}${josa(comma(N_LIMIT), "이면", "면")}`,
      ...captions(
        [
          ["상태 수의 최댓값", `${comma(big.states)} 개 = 2n-1`],
          [
            "상태 수의 최솟값",
            `${comma(built(sameChar(N_LIMIT), false).states)} 개 = n+1`,
          ],
          ["전이 수의 최댓값", `${comma(bigT.trans)} 개 = 3n-4`],
        ],
        "  ",
      ),
    ].join("\n");
  },

  /* ─────────────── deep.walk ─────────────── */

  /** T1 — 뿌리 상태 하나. */
  walkInit: () => {
    return [
      ...table([
        ["상태", "len", "link", "전이 표"],
        ["0", "0", "-1", "비어 있다"],
      ]),
      "",
      ...captions([
        ["상태 수", "1 개"],
        ["전이 수", "0 개"],
        ["담는 부분 문자열", "빈 문자열 하나"],
      ]),
    ].join("\n");
  },

  /** T2·T4 — 링크를 거슬러 올라가며 빈 전이를 채우는 갈래. */
  walkFill: () => {
    const rows = W.steps
      .filter((st) => st.kind === "뿌리로 잇는다")
      .map((st) => [
        `T${st.index + 1}`,
        String(st.index),
        st.c,
        String(st.cur),
        String(st.len[st.cur]),
        spaced(st.filled),
        String(st.filled.length),
        `link[${st.cur}] = 0`,
      ]);
    return [
      ...table(
        [
          [
            "걸음",
            "글자 자리",
            "글자",
            "cur",
            "len[cur]",
            "전이를 적은 상태",
            "걸음 수",
            "링크",
          ],
          ...rows,
        ],
        [1, 3, 4, 6],
      ),
      "",
      ...captions([
        [
          "두 걸음이 적은 전이 수",
          `${W.steps.filter((st) => st.kind === "뿌리로 잇는다").reduce((a, st) => a + st.filled.length, 0)} 개`,
        ],
        ["멈춘 자리", "둘 다 -1 — 뿌리를 지나쳤다"],
      ]),
    ].join("\n");
  },

  /** T3·T5 — 전이가 이미 있는 자리에서 멈춰 길이를 견주는 갈래. */
  walkEqual: () => {
    const rows = W.steps
      .filter((st) => st.kind === "길이가 이어진다")
      .map((st) => {
        const p = st.stopAt;
        const q = st.q as number;
        return [
          `T${st.index + 1}`,
          st.c,
          String(st.cur),
          String(p),
          String((st.len[p] as number) + 1),
          String(q),
          String(st.len[q]),
          "같다",
          `link[${st.cur}] = ${q}`,
        ];
      });
    return [
      ...table(
        [
          [
            "걸음",
            "글자",
            "cur",
            "멈춘 p",
            "len[p]+1",
            "q",
            "len[q]",
            "판정",
            "링크",
          ],
          ...rows,
        ],
        [2, 3, 4, 5, 6],
      ),
      "",
      ...captions([
        ["두 걸음이 새 상태를 만든 횟수", "0 번"],
        ["두 걸음이 지난 갈래", "길이가 이어진다"],
      ]),
    ].join("\n");
  },

  /** 멈춤 — 있는 전이를 덮어쓰면. */
  pauseOverwrite: () => {
    const cases = [WALK, "abab", "aaa", "banana"];
    return [
      mutantTable(overwrite, "있는 전이를 덮어쓴 판", cases),
      "",
      "네 문자열이 모두 그 줄을 지나간다 — 글자마다 반드시 한 번은 실행하는 반복이다",
    ].join("\n");
  },

  /** 멈춤 — 길이가 어긋나는데 복제를 안 만들면. */
  pauseNoClone: () => {
    const cases = [WALK, "abcbc", "banana", "abab"];
    return [
      mutantTable(noClone, "복제를 안 만든 판", cases),
      "",
      '복제가 한 번도 일어나지 않는 "abab" 에서만 답이 같다',
    ].join("\n");
  },

  /** T6~T8 — 길이가 어긋나 복제 상태를 만드는 갈래. */
  walkClone: () => {
    const st = W.steps.find((x) => x.kind === "복제한다") as CharStep;
    const p = st.stopAt;
    const q = st.q as number;
    const clone = st.clone as number;
    const before = W.steps[st.index - 2] as CharStep;
    return [
      ...table([
        ["무엇", "값"],
        ["글자 자리", String(st.index)],
        ["글자", st.c],
        ["새 상태 cur", String(st.cur)],
        ["③ 이 전이를 적은 상태", spaced(st.filled)],
        ["③ 이 멈춘 p", String(p)],
        ["p 의 전이가 가리키는 q", String(q)],
        ["len[p]+1", String((st.len[p] as number) + 1)],
        ["len[q]", String(before.len[q])],
        ["판정", "어긋난다"],
        ["복제 상태", String(clone)],
        ["len[복제]", String(st.len[clone])],
        ["link[복제]", String(st.link[clone])],
        [
          "복제가 물려받은 전이",
          nextText(st.next[clone] as Map<string, number>),
        ],
        ["⑦ 이 전이를 바꾼 상태", spaced(st.rewired)],
        [`link[${q}]`, String(st.link[q])],
        [`link[${st.cur}]`, String(st.link[st.cur])],
      ]),
      "",
      ...table(
        [
          ["상태", "len", "link", "전이 표"],
          ...Array.from({ length: W.states }, (_, v) => [
            String(v),
            String(st.len[v]),
            String(st.link[v]),
            nextText(st.next[v] as Map<string, number>),
          ]),
        ],
        [0, 1, 2],
      ),
    ].join("\n");
  },

  /** 멈춤 — 전이 표를 복사하지 않고 함께 쓰면. */
  pauseShareNext: () => {
    const cases = [WALK, "abcbc", "banana", SHARE_BREAKS, "abbabb"];
    const scan = shortestShareBreak();
    return [
      mutantTable(shareNext, "전이 표를 함께 쓴 판", cases),
      "",
      "다섯 문자열이 모두 복제를 한 번 이상 실행한다 — 그중 넷은 공유가 개수를 바꾸는 자리",
      "까지 가지 않는다",
      ...captions([
        [
          "전수로 검사한 문자열",
          `${comma(scan.checked)} 개 (알파벳 두 글자 · 길이 1~6)`,
        ],
        ["답이 갈린 문자열", `${comma(scan.diverged)} 개`],
        ["갈리는 가장 짧은 길이", `${scan.shortest} 글자`],
        ["그 길이에서 처음 갈린 것", `"${scan.first}"`],
      ]),
    ].join("\n");
  },

  /** T9·T10 — 전이를 따라가 부분 문자열인지 답한다. */
  walkContains: () => {
    const rows = WALK_QUERIES.map((t, i) => {
      const w = walkPath(W, t);
      return [
        `T${W.steps.length + 4 + i}`,
        `"${t}"`,
        w.path.join(" -> "),
        w.stuckAt === null ? "끝까지 갔다" : `'${w.stuckAt}' 전이가 없다`,
        String(WU.answers[i]),
      ];
    });
    return [
      ...table([
        ["걸음", "검색 문자열", "지나간 상태", "멈춘 이유", "반환"],
        ...rows,
      ]),
      "",
      ...captions([
        ["읽은 전이 표 항목", `${WU.queryOps / 2} 개`],
        [
          "그때의 자료 접근",
          `${WU.queryOps} 번 — 항목마다 찾기 하나에 값 하나`,
        ],
        ["검색 문자열 길이의 합", `${WALK_QUERIES.join("").length} 글자`],
      ]),
    ].join("\n");
  },

  /** T11 — 길이 차의 합으로 센다. */
  walkCount: () => {
    const rows: string[][] = [];
    let acc = 0;
    for (let v = 1; v < W.states; v++) {
      const parent = W.link[v] as number;
      const add = (W.len[v] as number) - (W.len[parent] as number);
      acc += add;
      rows.push([
        String(v),
        String(W.len[v]),
        String(parent),
        String(W.len[parent]),
        String(add),
        String(acc),
      ]);
    }
    return [
      ...table(
        [["상태", "len", "link", "len[link]", "더한 값", "누적"], ...rows],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      ...captions([
        ["반환", String(WU.total)],
        ["집합에 전부 담아 센 값", String(bySet(WALK).distinct)],
      ]),
    ].join("\n");
  },

  /* ─────────────── related ─────────────── */

  /** 한 무리 안의 문자열은 뒤에 붙일 수 있는 글자가 같다. */
  relatedNerode: () => {
    const groups = endposGroups(WALK);
    const rows = groups.map((g) => {
      const v = stateOf(W, g.words[g.words.length - 1] as string);
      const sets = g.words.map((w) => followSet(WALK, w));
      const same = sets.every((x) => x === sets[0]);
      const keys = [...(W.next[v] as Map<string, number>).keys()]
        .sort()
        .join(" ");
      return [
        String(v),
        g.words.join(" "),
        g.key,
        sets[0] === "" ? "없다" : (sets[0] as string),
        keys === "" ? "없다" : keys,
        same ? "같다" : "다르다",
      ];
    });
    const all = new Set(rows.map((r) => r[3] as string));
    return [
      ...table(
        [
          [
            "상태",
            "그 무리의 문자열",
            "끝나는 자리",
            "뒤에 붙일 수 있는 글자",
            "next 의 키",
            "무리 안이 서로",
          ],
          ...rows,
        ],
        [0],
      ),
      "",
      ...captions([
        ["무리 수", `${groups.length} 개`],
        ["서로 다른 「뒤에 붙일 수 있는 글자」", `${all.size} 가지`],
        [
          "next 의 키와 다른 무리",
          `${rows.filter((r) => r[3] !== r[4]).length} 개`,
        ],
      ]),
    ].join("\n");
  },

  /* ─────────────── deep.math ─────────────── */

  /** 검산 — 끝나는 자리 무리와 상태가 하나씩 맞물리는가. */
  mathCheck: () => {
    const groups = endposGroups(WALK);
    const rows = groups.map((g) => {
      const longest = g.words[g.words.length - 1] as string;
      const v = stateOf(W, longest);
      const parent = W.link[v] as number;
      return [
        g.key,
        g.words.join(" "),
        String(v),
        String(W.len[v]),
        String((W.len[parent] as number) + 1),
        String(g.words.length),
        String((W.len[v] as number) - (W.len[parent] as number)),
        "같다",
      ];
    });
    return [
      ...table(
        [
          [
            "끝나는 자리",
            "그 무리의 문자열",
            "상태",
            "len",
            "len[link]+1",
            "무리 크기",
            "len - len[link]",
            "판정",
          ],
          ...rows,
        ],
        [2, 3, 4, 5, 6],
      ),
      "",
      ...captions([
        ["무리 수", `${groups.length} 개`],
        ["뿌리를 뺀 상태 수", `${W.states - 1} 개`],
      ]),
    ].join("\n");
  },

  /** 계수 — 식에 제약 규모를 넣는다. */
  mathScale: () => {
    const rows = [8, 64, 512, 4096].map((n) => {
      const most = built(onePrefix(n), false);
      const least = built(sameChar(n), false);
      const mixed = built(varied(n), false);
      return [
        comma(n),
        comma(2 * n - 1),
        comma(most.states),
        comma(mixed.states),
        comma(least.states),
        comma((n * (n + 1)) / 2),
      ];
    });
    const maxDistinct = (N_LIMIT * (N_LIMIT + 1)) / 2;
    return [
      ...table(
        [
          [
            "n",
            "상한 2n-1",
            "첫 글자만 다르다",
            "겹침이 적다",
            "같은 글자만",
            "부분 문자열 상한 n(n+1)/2",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      "가운데 세 열이 상태 수다. 어느 모양에서도 2n-1 을 넘지 않고, 부분 문자열 수는",
      "n 이 커질수록 상태 수와 자릿수가 갈린다",
      `제약 규모 n = ${comma(N_LIMIT)}${josa(comma(N_LIMIT), "이면", "면")}`,
      ...captions(
        [
          ["상태 수의 상한", `${comma(2 * N_LIMIT - 1)} 개`],
          ["서로 다른 부분 문자열의 상한", `${comma(maxDistinct)} 개`],
          [
            "그 전부를 글자로 적으면",
            `${comma((N_LIMIT * (N_LIMIT + 1) * (N_LIMIT + 2)) / 6)} 글자`,
          ],
        ],
        "  ",
      ),
    ].join("\n");
  },

  /* ─────────────── invariant ─────────────── */

  /** 상태를 바꾸는 세 갈래가 길이 구간을 어떻게 두는가. */
  invariantHold: () => {
    const rows = W.steps.map((st) => {
      const v = st.cur;
      const parent = st.link[v] as number;
      const lo = (st.len[parent] as number) + 1;
      const hi = st.len[v] as number;
      const prefix = WALK.slice(0, st.index);
      const at = endpos(prefix);
      const words = Array.from({ length: hi - lo + 1 }, (_, k) =>
        prefix.slice(prefix.length - (lo + k)),
      );
      const keys = words.map((w) => (at.get(w) as number[]).join(" "));
      const same = keys.every((k) => k === keys[0]);
      return [
        `T${st.index + 1}`,
        st.kind,
        String(v),
        `${lo} 부터 ${hi} 까지`,
        words.join(" "),
        keys[0] as string,
        same ? "지켜진다" : "깨진다",
      ];
    });
    return [
      ...table(
        [
          [
            "걸음",
            "지난 갈래",
            "새 상태",
            "담는 길이",
            "그 문자열",
            "끝나는 자리",
            "판정",
          ],
          ...rows,
        ],
        [2],
      ),
      "",
      "끝나는 자리는 그 걸음까지 읽은 접두사 안에서 센 것이다. 판정은 한 상태가 담은",
      "문자열들의 끝나는 자리 집합이 서로 같은지를 본다",
    ].join("\n");
  },

  /** 경계에 가까운 입력들. */
  invariantEdge: () => {
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
    return table(
      [
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
        ...rows,
      ],
      [2, 3, 4, 5],
    ).join("\n");
  },

  /** 변이 — 복제 상태의 길이를 q 의 길이로 두면. */
  mutantCloneLen: () => {
    const cases = [WALK, "abcbc", "banana", "abab"];
    return [
      mutantTable(cloneLen, "복제 길이를 q 로 둔 판", cases),
      "",
      ...captions([
        [
          "복제를 지나는 문자열 전수 검사",
          `${comma(cloneScan().withClone)} 개 (알파벳 두 글자 길이 1~12 · 세 글자 길이 1~8)`,
        ],
        ["그중 답이 같은 것", `${cloneScan().same} 개`],
        ["표의 「같다」 행", '복제를 한 번도 안 지나는 "abab" 하나'],
      ]),
    ].join("\n");
  },

  /** 변이 — 링크가 담은 몫을 안 빼면. */
  mutantCountAll: () => {
    const cases = [WALK, "abab", "aaa", "abcbc"];
    return [
      mutantTable(countAll, "링크 몫을 안 뺀 판", cases),
      "",
      "네 문자열이 모두 그 줄을 지나간다 — 뿌리를 뺀 상태마다 한 번씩 실행하는 줄이다",
    ].join("\n");
  },

  /* ─────────────── perf ─────────────── */

  /** 전개의 걸음을 그대로 센다. */
  perfDerive: () => {
    const fill = W.steps.reduce((a, st) => a + st.filled.length, 0);
    const rewire = W.steps.reduce((a, st) => a + st.rewired.length, 0);
    return [
      ...table(
        [
          ["무엇", "몇 번", "왜 그 수인가"],
          ["글자를 받은 걸음", String(W.steps.length), "글자마다 한 번"],
          [
            "새 상태를 만든 횟수",
            String(W.states - 1),
            "글자마다 하나에 복제 하나",
          ],
          [
            "③ 이 전이를 적은 걸음",
            String(fill),
            "적을 때마다 전이가 하나 는다",
          ],
          [
            "⑦ 이 전이를 바꾼 걸음",
            String(rewire),
            "복제 한 번에 이어지는 반복",
          ],
          ["복제한 횟수", String(W.clones), "길이가 어긋난 걸음 수"],
          [
            "복제가 복사한 전이 항목",
            String(W.copied),
            "복제마다 q 의 전이 표 크기",
          ],
          ["세기가 읽은 칸", String(WU.countOps), "뿌리를 뺀 상태마다 세 칸"],
          ["찾기의 자료 접근", String(WU.queryOps), "검색 글자마다 두 번"],
        ],
        [1],
      ),
      "",
      ...captions([
        ["만들 때의 자료 접근", `${W.ops} 번`],
        ["세기의 자료 접근", `${WU.countOps} 번`],
        ["찾기의 자료 접근", `${WU.queryOps} 번`],
        ["③ 걸음 + 복사 항목", `${fill} + ${W.copied} = ${fill + W.copied} 개`],
        ["전이 수", `${W.trans} 개 — 위 합과 같다`],
      ]),
    ].join("\n");
  },

  /** 케이스별 계수. */
  perfBounds: () => {
    const n = 4096;
    const rows: [string, (m: number) => string][] = [
      ["같은 글자만", sameChar],
      ["두 글자를 번갈아", alternating],
      ["첫 글자만 다르다", onePrefix],
      ["앞뒤가 다르다", twoEnds],
      ["스물여섯 글자 순환", cycle26],
    ];
    const body = rows.map(([label, mk]) => {
      const b = built(mk(n), false);
      const used = runOn(b, []);
      return [
        label,
        comma(b.states),
        comma(b.trans),
        comma(b.fillSteps),
        comma(b.rewireSteps),
        comma(b.copied),
        comma(b.ops + used.countOps),
      ];
    });
    return [
      ...table(
        [
          [
            "문자열 모양",
            "상태",
            "전이",
            "③ 걸음",
            "⑦ 걸음",
            "복사 항목",
            "자료 접근",
          ],
          ...body,
        ],
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      ...captions([
        ["n", comma(n)],
        ["상태 수의 상한 2n-1", comma(2 * n - 1)],
        [
          "전이 수의 실측 최댓값",
          comma(
            Math.max(
              ...body.map((r) => Number((r[2] as string).replaceAll(",", ""))),
            ),
          ),
        ],
        ["3n-4", comma(3 * n - 4)],
      ]),
    ].join("\n");
  },

  /** 최악을 만드는 입력. */
  perfWorst: () => {
    const rows = [64, 512, 4096, N_LIMIT].map((n) => {
      const a = built(onePrefix(n), false);
      const c = built(twoEnds(n), false);
      return [
        comma(n),
        comma(a.states),
        comma(2 * n - 1),
        a.states === 2 * n - 1 ? "달성한다" : "못 미친다",
        comma(c.trans),
        comma(3 * n - 4),
        c.trans === 3 * n - 4 ? "달성한다" : "못 미친다",
      ];
    });
    const big = built(twoEnds(N_LIMIT), false);
    const bigUsed = runOn(big, []);
    return [
      ...table(
        [
          [
            "n",
            "첫 글자만 다른 문자열의 상태",
            "2n-1",
            "판정",
            "앞뒤가 다른 문자열의 전이",
            "3n-4",
            "판정",
          ],
          ...rows,
        ],
        [0, 1, 2, 4, 5],
      ),
      "",
      ...captions([
        [
          "자료 접근이 가장 많은 입력",
          `"a" 뒤에 b 를 ${comma(N_LIMIT - 2)} 번 적고 "c" 로 끝낸 문자열`,
        ],
        ["그 입력의 자료 접근", `${comma(big.ops + bigUsed.countOps)} 번`],
        ["그 입력의 상태", `${comma(big.states)} 개`],
        ["그 입력의 전이", `${comma(big.trans)} 개`],
        [
          "같은 규모에서 집합에 전부 담기",
          `${comma(bySetFormula(N_LIMIT))} 번 — 식으로 낸 값이다`,
        ],
      ]),
    ].join("\n");
  },

  /* ─────────────── selfcheck ─────────────── */

  /** 예측 문제의 답. */
  selfcheckAnswer: () => {
    const s = `${WALK}a`;
    const b = built(s);
    const last = b.steps[b.steps.length - 1] as CharStep;
    const used = runOn(b, ["baba", "aabab"]);
    return [
      ...table([
        ["무엇", "값"],
        ["문자열", `"${s}"`],
        ["글자 자리", String(last.index)],
        ["새 상태 cur", String(last.cur)],
        ["③ 이 전이를 적은 상태", spaced(last.filled)],
        ["③ 이 멈춘 p", String(last.stopAt)],
        ["지난 갈래", last.kind],
        ["q", String(last.q)],
        ["복제 상태", last.clone === null ? "없다" : String(last.clone)],
        ["상태 수", String(b.states)],
        ["서로 다른 부분 문자열", String(used.total)],
      ]),
      "",
      ...captions([
        [`"${WALK}" 의 서로 다른 부분 문자열`, `${WU.total} 개`],
        ["늘어난 개수", `${used.total - WU.total} 개`],
      ]),
    ].join("\n");
  },
};

/**
 * 복제 갈래를 지나는 문자열 중 복제 길이를 `q` 의 길이로 둬도 답이 같은 것이 있는가.
 *
 * 「같다」 행이 「그 줄을 지나가지 않아서 같다」인지 「지나가는데도 같다」인지를 실행이 가른다.
 * 앞이면 그 행은 변이의 근거가 되지 못하므로, 지나가는 입력 전수에서 답이 같은 것이 몇 개인지
 * 를 함께 낸다.
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

/** `a->1 b->6` 꼴. 비어 있으면 그렇게 적는다. */
function nextText(m: Map<string, number>): string {
  if (m.size === 0) return "비어 있다";
  return [...m.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => `${k}->${v}`)
    .join(" ");
}
