/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/directedCycleDetection/directedCycleDetection-guide.md
 *
 * **걸음을 적는 사본이 하나 있다**(`traced`). 정본은 몇 번째 간선에서 무엇을 했는지 내보내지 않으므로,
 * 같은 절차에 기록만 덧붙인 사본이 아니면 걸음 표와 삼색 표시의 모양을 낼 수 없다. 그 사본은 기본
 * 선택지로 부를 때마다 자기 답을 정본과 맞댄다 — **답이 맞는지는 사본이 아니라 정본이 진다.** 계수만
 * 세는 사본(`walkAllPaths`·`twoColor`·`countCells` 등)도 같은 이유로 두고, 저마다 답을 정본과 맞댄다.
 *
 * 경쟁 설계의 계수는 `.alt.ts` 가 낸 것을 그대로 가져온다 — 같은 값을 두 파일이 각자 재면 둘이 갈라진다.
 * 걸음 재생 패널과 그림은 `-guide.fig.tsx` 가 여기의 `traced` 로 만든다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases as ALT_CASES } from "./directedCycleDetection-guide.alt.ts";
import { directedCycleDetection } from "./directedCycleDetection-guide.ref.ts";

export type Edge = [number, number];

/**
 * 본문 전개가 쓰는 고정 입력. 간선 여덟 개가 네 갈래를 모두 실행하고, 마지막 간선 `5 → 0` 에서
 * 사이클이 판정된다.
 */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 3],
  [3, 4],
  [0, 4],
  [0, 2],
  [2, 3],
  [2, 5],
  [5, 0],
];

/** 마름모. 두 갈래가 같은 정점에서 만나므로 「본 적 있는 정점」과 사이클이 갈린다. */
const DIAMOND_N = 4;
const DIAMOND_EDGES: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
];

/** 가로지르는 간선 하나짜리 그래프 — `0 → 2` 가 이미 끝난 정점으로 간다. */
const CROSS_N = 3;
const CROSS_EDGES: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 2],
];

/** 다이아몬드 `k` 개를 이은 그래프 — 정점 `3k+1` 개 · 간선 `4k` 개 · 경로 `2^k` 개. */
export function diamondChain(k: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (let i = 0; i < k; i++) {
    const a = 3 * i;
    edges.push([a, a + 1], [a, a + 2], [a + 1, a + 3], [a + 2, a + 3]);
  }
  return { n: 3 * k + 1, edges };
}

/** `0 → 1 → … → v-1` 사슬. */
export function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1]);
  return out;
}

/** 정점 0 이 나머지 전부를 가리키는 그래프. */
export function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i]);
  return out;
}

const adjacency = (n: number, edges: readonly Edge[]): number[][] => {
  const next: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) (next[u] as number[]).push(v);
  return next;
};

/** 시드가 같으면 같은 수열을 내는 난수(mulberry32). 무작위 입력을 다시 만들 수 있게 한다. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 무작위 유향 그래프 — `acyclic` 이면 간선을 작은 번호에서 큰 번호로만 두어 사이클이 없다. */
function randomGraph(
  n: number,
  e: number,
  seed: number,
  acyclic: boolean,
): Edge[] {
  const r = rng(seed);
  const out: Edge[] = [];
  while (out.length < e) {
    const a = Math.floor(r() * n);
    const b = Math.floor(r() * n);
    if (acyclic) {
      if (a === b) continue;
      out.push(a < b ? [a, b] : [b, a]);
    } else out.push([a, b]);
  }
  return out;
}

export const RANDOM_SEED = 20260930;

/* ────────────────────────── 표기 ────────────────────────── */

/** `[0, 1, 3]` 꼴 — 본문 표기와 같다. */
export const show = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

/** `1,299,994` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

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

/** 표 아래 문장까지 한 블록으로 — 본문은 `<!--/proof-->` 로 닫는다. */
const withSentence = (table: string, sentence: string): string =>
  [table, "", sentence].join("\n");

/** 한글은 고정폭 화면에서 두 칸을 먹는다 — 등폭 블록의 칸 맞춤. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 등폭 블록의 열 맞춤 — 열마다 가장 넓은 칸에 맞춘다. */
function columns(rows: string[][], gap = "   "): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const w = Array.from({ length: cols }, (_, c) =>
    Math.max(...rows.map((r) => width(r[c] ?? ""))),
  );
  return rows
    .map((r) =>
      r
        .map((cell, c) => pad(cell, w[c] ?? 0))
        .join(gap)
        .trimEnd(),
    )
    .join("\n");
}

export const edgeList = (edges: readonly Edge[]): string =>
  `[${edges.map(([u, v]) => `[${u},${v}]`).join(",")}]`;

export const arrow = ([u, v]: Edge): string => `${u} → ${v}`;

/** `T2 · T3 · T4` 꼴. */
const stepList = (ids: readonly string[]): string => ids.join(" · ");

/** 원문자 갈래 번호의 읽기 — 조사를 고를 때 쓴다. */
const CIRCLED: Record<string, number> = { "①": 1, "②": 2, "③": 3, "④": 4 };

/** 조사 앞의 공백을 뗀 것 — 「4 가 검은색」처럼 값 바로 뒤가 아닌 자리에 쓴다. */
const ga = (v: number): string => 이가(v).trim();

/* ────────────────────── 걸음을 적는 사본 ────────────────────── */

export const WHITE = 0;
export const GRAY = 1;
export const BLACK = 2;
export type Color = 0 | 1 | 2;

export const COLOR_NAME = ["흰색", "회색", "검은색"] as const;

/** 간선 종류 — 확인할 때 도착 정점의 색과 발견 차례로 정한다. */
export type EdgeKind =
  | "나무 간선"
  | "역방향 간선"
  | "순방향 간선"
  | "교차 간선";

export interface Step {
  /**
   * `start` 바깥 반복이 흰색 정점을 회색으로 칠해 시작 · `descend` 흰색으로 내려간다(②) ·
   * `skip` 검은색이라 넘어간다(③) · `back` 회색이라 사이클이다(①) · `finish` 목록을 다 봐서 뺀다(④)
   */
  readonly kind: "start" | "descend" | "skip" | "back" | "finish";
  /** 스택 꼭대기(시작이면 시작 정점). */
  readonly u: number;
  /** 확인한 간선의 도착 정점. 간선을 확인하지 않은 걸음이면 −1. */
  readonly v: number;
  /** 확인한 간선이 입력 `edges` 의 몇 번째인가. 없으면 −1. */
  readonly edge: number;
  /** 확인할 때 도착 정점의 색(걸음 전). 없으면 −1. */
  readonly seen: number;
  /** 확인한 간선의 종류. 간선을 확인하지 않은 걸음이면 없다. */
  readonly edgeKind?: EdgeKind;
  /** 걸음이 끝난 뒤의 상태. */
  readonly color: readonly Color[];
  readonly cursor: readonly number[];
  readonly stack: readonly number[];
  /** 간선을 확인한 누적 횟수. */
  readonly checked: number;
}

export interface Trace {
  readonly next: readonly (readonly number[])[];
  readonly steps: readonly Step[];
  readonly answer: boolean;
  /** 바깥 반복이 본 정점과 그때의 색 — 반환하기 전까지. */
  readonly outer: readonly { readonly s: number; readonly color: Color }[];
}

interface TraceOptions {
  /** 역방향 간선을 만나도 멈추지 않고 끝까지 간선을 가른다(간선 분류용). */
  readonly full?: boolean;
  /** 정점 0 에서 한 번만 시작한다(바깥 반복을 지운 사본). */
  readonly onlyZero?: boolean;
  /** 사이클 판정 조건 — 회색만(정본) 또는 흰색이 아니면(두 색 사본). */
  readonly test?: "gray" | "notWhite";
  /** 목록을 다 본 정점에 칠하는 색 — 검은색(정본) 또는 회색 그대로(변이 사본). */
  readonly finishColor?: Color;
}

/**
 * 정본과 같은 절차에 기록만 덧붙인 사본. 기본 선택지로 부르면 답을 정본과 맞대고, 다르면 던진다.
 * 선택지를 바꾼 사본의 답은 부르는 쪽이 변이의 답과 맞댄다.
 */
export function traced(
  n: number,
  edges: readonly Edge[],
  opts: TraceOptions = {},
): Trace {
  const next: number[][] = Array.from({ length: n }, () => []);
  const nextEdge: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], k) => {
    (next[u] as number[]).push(v);
    (nextEdge[u] as number[]).push(k);
  });
  const color: Color[] = Array.from({ length: n }, () => WHITE as Color);
  const cursor: number[] = Array.from({ length: n }, () => 0);
  const disc: number[] = Array.from({ length: n }, () => -1);
  const stack: number[] = [];
  const steps: Step[] = [];
  const outer: { s: number; color: Color }[] = [];
  let clock = 0;
  let checked = 0;
  let answer = false;
  const test = opts.test ?? "gray";
  const finishColor = opts.finishColor ?? BLACK;

  const record = (s: Omit<Step, "color" | "cursor" | "stack" | "checked">) =>
    steps.push({
      ...s,
      color: [...color],
      cursor: [...cursor],
      stack: [...stack],
      checked,
    });

  const last = opts.onlyZero ? Math.min(n, 1) : n;
  scan: for (let s = 0; s < last; s++) {
    outer.push({ s, color: color[s] as Color });
    if (color[s] !== WHITE) continue;
    color[s] = GRAY;
    disc[s] = clock++;
    stack.push(s);
    record({ kind: "start", u: s, v: -1, edge: -1, seen: -1 });
    while (stack.length > 0) {
      const u = stack[stack.length - 1] as number;
      const list = next[u] as number[];
      const i = cursor[u] as number;
      if (i === list.length) {
        color[u] = finishColor;
        stack.pop();
        record({ kind: "finish", u, v: -1, edge: -1, seen: -1 });
        continue;
      }
      cursor[u] = i + 1;
      checked++;
      const v = list[i] as number;
      const edge = (nextEdge[u] as number[])[i] as number;
      const seen = color[v] as Color;
      let edgeKind: EdgeKind;
      if (seen === WHITE) edgeKind = "나무 간선";
      else if (seen === GRAY) edgeKind = "역방향 간선";
      else
        edgeKind =
          (disc[u] as number) < (disc[v] as number)
            ? "순방향 간선"
            : "교차 간선";
      const cycle = test === "gray" ? seen === GRAY : seen !== WHITE;
      if (cycle) {
        record({ kind: "back", u, v, edge, seen, edgeKind });
        answer = true;
        if (!opts.full) break scan;
        continue;
      }
      if (seen === WHITE) {
        color[v] = GRAY;
        disc[v] = clock++;
        stack.push(v);
        record({ kind: "descend", u, v, edge, seen, edgeKind });
      } else record({ kind: "skip", u, v, edge, seen, edgeKind });
    }
  }
  const plain =
    !opts.full && !opts.onlyZero && test === "gray" && finishColor === BLACK;
  if (plain && answer !== directedCycleDetection(n, [...edges])) {
    throw new Error(`사본의 답 ${answer} 이 정본과 다르다`);
  }
  return { next, steps, answer, outer };
}

/** 전개 입력의 기록 — 걸음 재생 패널 · 그림 · 증명 블록이 모두 이것을 쓴다. */
export const WALK: Trace = traced(WALK_N, WALK_EDGES);

/** 기록의 `k` 번째 걸음의 번호 — T1 이 첫 걸음이다. */
export const stepOf = (k: number): string => `T${k + 1}`;

/** 회색 정점 · 흰색이 아닌 정점. */
export const grayOf = (s: Step): number[] =>
  s.color.flatMap((c, v) => (c === GRAY ? [v] : []));
const seenOf = (s: Step): number[] =>
  s.color.flatMap((c, v) => (c !== WHITE ? [v] : []));

/** 정점이 처음 회색이 된 걸음, 처음 검은색이 된 걸음. */
function paintedAt(t: Trace, v: number): { gray: number; black: number } {
  let gray = -1;
  let black = -1;
  t.steps.forEach((s, k) => {
    if (gray < 0 && s.color[v] === GRAY) gray = k;
    if (black < 0 && s.color[v] === BLACK) black = k;
  });
  return { gray, black };
}

/** 걸음의 갈래 이름 — 걸음 표 · 패널 제목이 같은 말을 쓴다. */
export function branchLabel(s: Step): string {
  switch (s.kind) {
    case "start":
      return "시작";
    case "descend":
      return "② 내려간다";
    case "skip":
      return "③ 넘어간다";
    case "back":
      return "① 사이클이다";
    case "finish":
      return "④ 검은색으로 뺀다";
  }
}

/** 갈래 이름에서 원문자를 뗀 것 — 원문자 라벨을 쓰지 않는 절(불변식)이 쓴다. */
const plainLabel = (s: Step): string => branchLabel(s).replace(/^[①②③④] /, "");

/** 걸음 하나를 짧게 — 사본끼리 나란히 놓는 표가 쓴다. `plain` 이면 원문자를 뗀다. */
function sayStep(s: Step | undefined, plain = false): string {
  if (s === undefined) return "—";
  if (s.kind === "start") return `${s.u} 에서 시작`;
  if (s.kind === "finish") return `${s.u}${을를(s.u)} 뺀다`;
  return `${arrow([s.u, s.v])} · ${COLOR_NAME[s.seen as Color]} · ${plain ? plainLabel(s) : branchLabel(s)}`;
}

/* ────────────────────── 세는 사본과 다른 절차 ────────────────────── */

/**
 * 가장 단순한 방법 — 표시를 **지금 따라가는 경로에만** 둔다. 끝난 정점을 기억하지 않으므로
 * 같은 정점을 다른 경로로 몇 번이고 다시 내려간다. 답은 맞는다.
 */
function walkAllPaths(
  n: number,
  edges: Edge[],
): { steps: number; found: boolean } {
  const next = adjacency(n, edges);
  const onPath: boolean[] = Array.from({ length: n }, () => false);
  let steps = 0;
  let found = false;
  const go = (u: number): void => {
    onPath[u] = true;
    for (const v of next[u] as number[]) {
      steps++;
      if (onPath[v] === true) {
        found = true;
        break;
      }
      go(v);
      if (found) break;
    }
    onPath[u] = false;
  };
  for (let s = 0; s < n && !found; s++) go(s);
  if (found !== directedCycleDetection(n, edges)) {
    throw new Error("경로를 전부 따라간 답이 정본과 다르다");
  }
  return { steps, found };
}

/** 색을 **둘**로 둔 절차 — 「본 적 있음」이면 전부 사이클로 본다. 따라간 간선 수도 센다. */
function twoColor(n: number, edges: Edge[]): { steps: number; found: boolean } {
  const next = adjacency(n, edges);
  const seen: boolean[] = Array.from({ length: n }, () => false);
  let found = false;
  let steps = 0;
  const go = (u: number): void => {
    seen[u] = true;
    for (const v of next[u] as number[]) {
      steps++;
      if (seen[v] === true) {
        found = true;
        return;
      }
      go(v);
      if (found) return;
    }
  };
  for (let s = 0; s < n && !found; s++) if (seen[s] === false) go(s);
  return { steps, found };
}

/**
 * 정본과 같은 절차. 읽고 쓴 배열 칸을 덧붙여 센다 — `deep.math` 의 닫힌 형태와 맞춘다. 스택이
 * 가장 깊었을 때의 길이와 가장 긴 목록의 길이도 함께 낸다(큰 입력에서 `traced` 는 걸음마다 배열을
 * 베끼므로 쓰지 않는다).
 */
function countCells(
  n: number,
  edges: Edge[],
): { cells: number; answer: boolean; peak: number; longest: number } {
  let cells = 0;
  let peak = 0;
  const next: number[][] = Array.from({ length: n }, () => []);
  cells += n;
  for (const [u, v] of edges) {
    cells += 2;
    (next[u] as number[]).push(v);
  }
  const longest = next.reduce((m, l) => Math.max(m, l.length), 0);
  const color: number[] = Array.from({ length: n }, () => 0);
  cells += n;
  const cursor: number[] = Array.from({ length: n }, () => 0);
  cells += n;
  const stack: number[] = [];
  const done = (answer: boolean) => {
    if (answer !== directedCycleDetection(n, edges)) {
      throw new Error("세는 사본의 답이 정본과 다르다");
    }
    return { cells, answer, peak, longest };
  };

  for (let s = 0; s < n; s++) {
    cells++;
    if (color[s] !== 0) continue;
    cells += 2;
    color[s] = 1;
    stack.push(s);
    peak = Math.max(peak, stack.length);
    while (stack.length > 0) {
      cells += 3;
      const u = stack[stack.length - 1] as number;
      const list = next[u] as number[];
      const i = cursor[u] as number;
      if (i === list.length) {
        cells += 2;
        color[u] = 2;
        stack.pop();
        continue;
      }
      cells += 3;
      cursor[u] = i + 1;
      const v = list[i] as number;
      if (color[v] === 1) return done(true);
      if (color[v] === 0) {
        cells += 2;
        color[v] = 1;
        stack.push(v);
        peak = Math.max(peak, stack.length);
      }
    }
  }
  return done(false);
}

/**
 * `cursor` 를 두지 않고 스택 꼭대기를 볼 때마다 `next[u]` 를 **처음부터** 확인하는 사본. 읽은 목록
 * 원소 수를 세고, 정점 0 이 꼭대기에 올 때마다 읽은 수를 따로 적는다. 답은 정본과 같아야 한다.
 */
function withoutCursor(
  n: number,
  edges: Edge[],
): { reads: number; answer: boolean; zeroReads: number[] } {
  const next = adjacency(n, edges);
  const color: number[] = Array.from({ length: n }, () => 0);
  const stack: number[] = [];
  const zeroReads: number[] = [];
  let reads = 0;
  const done = (answer: boolean) => {
    if (answer !== directedCycleDetection(n, edges)) {
      throw new Error("cursor 없는 사본의 답이 정본과 다르다");
    }
    return { reads, answer, zeroReads };
  };

  for (let s = 0; s < n; s++) {
    if (color[s] !== 0) continue;
    color[s] = 1;
    stack.push(s);
    while (stack.length > 0) {
      const u = stack[stack.length - 1] as number;
      const list = next[u] as number[];
      let descended = false;
      let here = 0;
      for (const v of list) {
        reads++;
        here++;
        if (color[v] === 1) return done(true);
        if (color[v] === 0) {
          color[v] = 1;
          stack.push(v);
          descended = true;
          break;
        }
      }
      if (u === 0) zeroReads.push(here);
      if (!descended) {
        color[u] = 2;
        stack.pop();
      }
    }
  }
  return done(false);
}

/** 정본을 재귀로 적은 사본. 호출 깊이가 한도를 넘으면 그 오류 이름을 돌려준다. */
function recursive(n: number, edges: Edge[]): string {
  const next = adjacency(n, edges);
  const color: number[] = Array.from({ length: n }, () => 0);
  let found = false;
  const go = (u: number): void => {
    color[u] = 1;
    for (const v of next[u] as number[]) {
      if (color[v] === 1) {
        found = true;
        return;
      }
      if (color[v] === 0) go(v);
      if (found) return;
    }
    color[u] = 2;
  };
  try {
    for (let s = 0; s < n && !found; s++) if (color[s] === 0) go(s);
  } catch (e) {
    return `${(e as Error).name} 로 멈춘다`;
  }
  if (found !== directedCycleDetection(n, edges)) {
    throw new Error("재귀 사본의 답이 정본과 다르다");
  }
  return String(found);
}

/** 무향 그래프에 사이클이 있는가 — 이미 이어진 두 정점을 잇는 간선이 있으면 있다. */
function undirectedHasCycle(n: number, edges: readonly Edge[]): boolean {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    let r = x;
    while (parent[r] !== r) r = parent[r] as number;
    return r;
  };
  for (const [a, b] of edges) {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return true;
    parent[ra] = rb;
  }
  return false;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Ref {
  directedCycleDetection(n: number, edges: Edge[]): boolean;
}

const REF_PATH = new URL(
  "./directedCycleDetection-guide.ref.ts",
  import.meta.url,
).pathname;

/**
 * 회색인지 보던 조건을 **「흰색이 아니면」** 으로 바꾼 사본. 색이 셋에서 사실상 둘로 줄어, 이미 끝난
 * 정점(검은색)으로 가는 간선까지 사이클로 판정한다.
 */
const twoColorMutant = await loadMutant<Ref>(REF_PATH, {
  swap: [
    /^\s+if \(color\[v\] === GRAY\) return true;/,
    "      if (color[v] !== WHITE) return true;",
  ],
});

/**
 * 경로에서 뺄 때 **검은색으로 칠하지 않는** 사본. 끝난 정점이 회색으로 남아 「회색 = 지금 경로 위」가
 * 거짓이 된다.
 */
const stayGrayMutant = await loadMutant<Ref>(REF_PATH, {
  swap: [/^\s+color\[u\] = BLACK;/, "        color[u] = GRAY;"],
});

/**
 * 중화 실행(`check-proof` 가 변이를 만들되 적용하지 않는 실행)에서는 두 사본이 정본 그 자체다.
 * 「변이가 답을 바꿨다」 자기검사와 사본끼리의 맞대기는 그때 건너뛴다 — 값에서 알아낸다(SPEC §0).
 */
const live = (m: Ref): boolean =>
  m.directedCycleDetection !== directedCycleDetection;

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
  { label: "마름모 네 정점", n: DIAMOND_N, edges: DIAMOND_EDGES },
  {
    label: "가로지르는 간선 0→1 · 0→2 · 1→2",
    n: CROSS_N,
    edges: CROSS_EDGES,
  },
  { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
  { label: "간선이 없는 네 정점", n: 4, edges: [] },
];

function mutantRows(m: Ref, name: string) {
  const rows = MUTANT_CASES.map((c) => ({
    label: c.label,
    correct: directedCycleDetection(c.n, c.edges),
    broken: m.directedCycleDetection(c.n, c.edges),
  }));
  // 변이가 어느 입력에서도 결과를 안 바꾸면 「어긋난다」가 거짓이다. 실행이 그것을 판정한다.
  if (live(m) && rows.every((r) => r.correct === r.broken)) {
    throw new Error(`${name}가 어느 입력에서도 결과를 바꾸지 못했다`);
  }
  return rows;
}

const twoColorRows = mutantRows(twoColorMutant, "색을 둘로 줄인 변이");
const stayGrayRows = mutantRows(stayGrayMutant, "검은색으로 안 칠하는 변이");

/** 변이 표 — 줄마다 두 답이 같은지 어긋나는지를 적는다(`check-proof` 가 그 줄을 중화 실행과 맞댄다). */
function mutantTable(
  rows: { label: string; correct: boolean; broken: boolean }[],
  heads: [string, string],
): string {
  return md(
    ["입력", ...heads, "두 답"],
    rows.map((r) => [
      r.label,
      String(r.correct),
      String(r.broken),
      r.correct === r.broken ? "같다" : "어긋난다",
    ]),
  );
}

/* ─────────────────── 「전체 컨셉」 ─────────────────── */

/** 전개 입력이 찾는 사이클 — 마지막 걸음의 스택에서 사이클을 닫은 정점부터 끝까지. */
export function walkCycle(): number[] {
  const last = WALK.steps.at(-1) as Step;
  if (last.kind !== "back") {
    throw new Error("전개 입력의 마지막 걸음이 사이클 판정이 아니다");
  }
  return [...last.stack.slice(last.stack.indexOf(last.v))];
}

/** 같은 그래프의 경로 둘 — 끝 정점에서 출발점으로 가는 간선이 있는가. */
function conceptPaths(): string {
  const next = adjacency(WALK_N, WALK_EDGES);
  const other = [0, 2, 3, 4];
  const rows = [walkCycle(), other].map((path) => {
    const ok = path.every(
      (x, i) =>
        i === 0 || (next[path[i - 1] as number] as number[]).includes(x),
    );
    if (!ok) throw new Error(`${show(path)} 는 간선을 따라가는 경로가 아니다`);
    const tail = path.at(-1) as number;
    const back = (next[tail] as number[]).includes(path[0] as number);
    return [
      path.join(" → "),
      `${(next[tail] as number[]).length} 개`,
      back ? `있다 (${tail} → ${path[0]})` : "없다",
      back ? "사이클이다" : "사이클이 아니다",
    ];
  });
  return md(
    ["경로", "끝 정점에서 나가는 간선", "출발점으로 가는 간선", "판정"],
    rows,
  );
}

/* ─────────────────── 「아이디어를 떠올리는 과정」 ─────────────────── */

/** `2^k` 의 자릿수. 로그를 더해서 낸다 — 큰 정수를 실제로 만들지 않는다. */
const powerDigits = (k: number): number => Math.floor(k * Math.log10(2)) + 1;

/** 규모 상한 안에서 이을 수 있는 다이아몬드 수 — 간선 `4k ≤ 100,000`. */
export const MAX_DIAMONDS = 25_000;

/** 경로를 전부 따라가면 다이아몬드를 이을수록 얼마가 되는가. */
function naiveScale(): string {
  const rows: string[][] = [];
  for (const k of [1, 2, 4, 8, 12, 16]) {
    const { n, edges } = diamondChain(k);
    const run = walkAllPaths(n, edges);
    rows.push([
      comma(k),
      comma(n),
      comma(edges.length),
      comma(2 ** k),
      comma(run.steps),
    ]);
  }
  const big = diamondChain(MAX_DIAMONDS);
  return withSentence(
    md(
      ["다이아몬드 k", "정점 V", "간선 E", "경로 수 2^k", "따라간 간선 수"],
      rows,
      [0, 1, 2, 3, 4],
    ),
    `규모 안에서 k 는 ${comma(MAX_DIAMONDS)} 까지 늘릴 수 있고(정점 ${comma(big.n)} · 간선 ${comma(big.edges.length)}), 그때 경로 수 2^k 는 ${comma(powerDigits(MAX_DIAMONDS))} 자리 수입니다.`,
  );
}

const ORIGIN_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
  { label: "마름모 네 정점", n: DIAMOND_N, edges: DIAMOND_EDGES },
  {
    label: "가로지르는 간선 0→1 · 0→2 · 1→2",
    n: CROSS_N,
    edges: CROSS_EDGES,
  },
  { label: "다이아몬드 16 개", ...diamondChain(16) },
  { label: "사슬 1,000", n: 1_000, edges: chain(1_000) },
];

/** 표시를 경로에만 두는 방법 · 「본 적 있음」 하나 · 삼색 표시의 걸음 수와 답. */
function originCompare(): string {
  const rows = ORIGIN_CASES.map((c) => {
    const a = walkAllPaths(c.n, c.edges);
    const b = twoColor(c.n, c.edges);
    const t = traced(c.n, c.edges);
    return [
      c.label,
      comma(c.edges.length),
      `${comma(a.steps)} · ${a.found}`,
      `${comma(b.steps)} · ${b.found}`,
      `${comma(t.steps.at(-1)?.checked ?? 0)} · ${t.answer}`,
    ];
  });
  const wrong = ORIGIN_CASES.filter(
    (c) =>
      twoColor(c.n, c.edges).found !== directedCycleDetection(c.n, c.edges),
  ).map((c) => c.label);
  return withSentence(
    md(
      [
        "입력",
        "간선 E",
        "경로에만 표시 — 따라간 간선 · 답",
        "본 적 있음 하나 — 따라간 간선 · 답",
        "두 표시를 가른다 — 확인한 간선 · 답",
      ],
      rows,
      [1],
    ),
    `정본의 답은 모든 줄에서 두 표시를 가른 방법의 답과 같습니다. 「본 적 있음」 하나로 표시한 방법은 ${wrong.length} 개 입력(${wrong.join(", ")})에서 답이 정본과 다릅니다.`,
  );
}

/** 사다리 그림이 쓰는 수 — 위 블록과 같은 실행에서 받는다. */
export function ladderNumbers() {
  const d16 = diamondChain(16);
  return {
    d16Vertices: d16.n,
    d16Steps: walkAllPaths(d16.n, d16.edges).steps,
    d16Checks: traced(d16.n, d16.edges).steps.at(-1)?.checked ?? 0,
    maxDiamonds: MAX_DIAMONDS,
    maxDigits: powerDigits(MAX_DIAMONDS),
    diamondTwo: twoColor(DIAMOND_N, DIAMOND_EDGES).found,
    diamondRef: directedCycleDetection(DIAMOND_N, DIAMOND_EDGES),
  };
}

/** 마름모에서 정점 3 을 두 번 만나는 자리 — 그때의 지금 경로와 「본 적 있음」. */
function diamondMeet(): string {
  const t = traced(DIAMOND_N, DIAMOND_EDGES);
  const rows = t.steps.flatMap((s, k) => {
    if (s.v !== 3) return [];
    const path = s.kind === "descend" ? s.stack.slice(0, -1) : s.stack;
    const before = t.steps[k - 1] as Step;
    return [
      [
        stepOf(k),
        arrow([s.u, s.v]),
        show(path),
        path.includes(3) ? "있다" : "없다",
        seenOf(before).includes(3) ? "있다" : "없다",
      ],
    ];
  });
  return md(
    [
      "걸음",
      "확인한 간선",
      "그 순간의 경로 정점",
      "지금 경로에 3",
      "본 적 있는 정점에 3",
    ],
    rows,
  );
}

/* ─────────────────── 「아이디어 상세」 ─────────────────── */

/** 「먼저 알아 둘 개념」이 그림과 표로 읽는 순간 — 세 색이 다 있는 걸음(T10). */
export const MOMENT = 9;

/** 1단계 — 간선 목록을 나가는 목록으로. */
function buildNext(): string {
  const rows = WALK.next.map((list, u) => [
    String(u),
    show(list),
    String(list.length),
  ]);
  const total = WALK.next.reduce((a, l) => a + l.length, 0);
  return withSentence(
    md(["정점 u", "next[u]", "길이"], rows, [0, 2]),
    `길이를 모두 더하면 ${total} 이고, 간선 수 ${WALK_EDGES.length}${과와(WALK_EDGES.length)} 같습니다.`,
  );
}

/** (c) 한 순간의 정점마다 — 색 · 칠한 걸음 · cursor · 뜻. */
function colorsRead(): string {
  const s = WALK.steps[MOMENT] as Step;
  const rows = s.color.map((c, v) => {
    const at = paintedAt(WALK, v);
    const len = (WALK.next[v] as number[]).length;
    const when = [
      at.gray >= 0 && at.gray <= MOMENT ? `회색 ${stepOf(at.gray)}` : "",
      at.black >= 0 && at.black <= MOMENT ? `검은색 ${stepOf(at.black)}` : "",
    ]
      .filter((x) => x !== "")
      .join(" · ");
    const meaning =
      c === WHITE
        ? "아직 한 번도 확인하지 않았다"
        : c === GRAY
          ? `지금 경로의 ${s.stack.indexOf(v) + 1} 번째 정점이다`
          : "나가는 간선을 다 확인하고 끝났다";
    return [
      String(v),
      COLOR_NAME[c],
      when === "" ? "—" : when,
      `${s.cursor[v]} / ${len}`,
      meaning,
    ];
  });
  return withSentence(
    md(["정점", "색", "칠한 걸음", "cursor / 목록 길이", "뜻"], rows),
    `${stepOf(MOMENT)} 직후의 스택은 ${show(s.stack)} 입니다.`,
  );
}

/** 삼색 표시가 지키는 세 관계를 한 기록의 모든 걸음에서 잰다. */
function relationCounts(t: Trace): {
  steps: number;
  graySet: number;
  linked: number;
  blackWhite: number;
} {
  let graySet = 0;
  let linked = 0;
  let blackWhite = 0;
  for (const s of t.steps) {
    const onStack = [...s.stack].sort((a, b) => a - b);
    if (grayOf(s).join() !== onStack.join()) graySet++;
    for (let i = 0; i + 1 < s.stack.length; i++) {
      const a = s.stack[i] as number;
      const b = s.stack[i + 1] as number;
      if (!(t.next[a] as number[]).includes(b)) {
        linked++;
        break;
      }
    }
    const bad = s.color.some(
      (c, u) =>
        c === BLACK &&
        (t.next[u] as number[]).some((w) => s.color[w] === WHITE),
    );
    if (bad) blackWhite++;
  }
  return { steps: t.steps.length, graySet, linked, blackWhite };
}

/** (d) 낱낱끼리의 관계 — 전개 입력의 걸음마다 세 관계를 잰다. */
function colorsRelation(): string {
  const r = relationCounts(WALK);
  const rows: string[][] = [
    [
      "회색인 정점의 모임이 스택의 정점 모임과 같다",
      comma(r.steps),
      comma(r.graySet),
    ],
    [
      "스택에서 이웃한 두 정점 사이에 간선이 있다",
      comma(r.steps),
      comma(r.linked),
    ],
    [
      "검은색 정점에서 흰색 정점으로 가는 간선이 없다",
      comma(r.steps),
      comma(r.blackWhite),
    ],
  ];
  const broken = r.graySet + r.linked + r.blackWhite;
  return withSentence(
    md(["관계", "확인한 걸음", "어긋난 걸음"], rows, [1, 2]),
    `${stepOf(0)} 부터 ${stepOf(r.steps - 1)} 까지 ${r.steps} 걸음마다 세 관계를 쟀고, 어긋난 자리는 ${broken} 개입니다.`,
  );
}

/** (e) 「본 적 있는 정점」과 「회색 정점」 — 마름모의 걸음마다 두 모임. */
function colorsVsSeen(): string {
  const t = traced(DIAMOND_N, DIAMOND_EDGES);
  let differ = 0;
  const rows = t.steps.map((s, k) => {
    const seen = seenOf(s);
    const gray = grayOf(s);
    if (seen.join() !== gray.join()) differ++;
    return [stepOf(k), sayStep(s), show(seen), show(gray)];
  });
  return withSentence(
    md(["걸음", "한 일", "본 적 있는 정점", "회색 정점"], rows),
    `${t.steps.length} 걸음 가운데 두 모임이 다른 걸음은 ${differ} 개입니다. 반환값은 ${t.answer} 입니다.`,
  );
}

/** 2단계 — 흰색 정점으로 내려간 걸음마다. */
function buildDescend(): string {
  const rows = WALK.steps.flatMap((s, k) =>
    s.kind === "start" || s.kind === "descend"
      ? [
          [
            stepOf(k),
            s.kind === "start" ? `바깥 반복 s = ${s.u}` : arrow([s.u, s.v]),
            String(s.kind === "start" ? s.u : s.v),
            show(s.stack),
            show(s.cursor),
          ],
        ]
      : [],
  );
  return md(
    ["걸음", "내려간 자리", "회색으로 칠한 정점", "스택(아래 → 위)", "cursor"],
    rows,
  );
}

/** 3단계 — 간선을 확인한 걸음마다 도착 정점의 색과 갈래. */
function buildBranches(): string {
  const checks = WALK.steps
    .map((s, k) => ({ s, k }))
    .filter(({ s }) => s.v >= 0);
  const rows = checks.map(({ s, k }) => [
    stepOf(k),
    arrow([s.u, s.v]),
    COLOR_NAME[s.seen as Color],
    branchLabel(s),
  ]);
  const count = (kind: Step["kind"]) =>
    checks.filter(({ s }) => s.kind === kind).length;
  return withSentence(
    md(["걸음", "확인한 간선", "도착 정점의 색", "갈래"], rows),
    `간선을 확인한 걸음은 ${checks.length} 개이고, 흰색이라 내려간 것이 ${count("descend")} 번, 검은색이라 넘어간 것이 ${count("skip")} 번, 회색이라 사이클로 판정한 것이 ${count("back")} 번입니다.`,
  );
}

/** 4단계 — 목록을 다 본 정점을 검은색으로 뺀 걸음마다. */
function buildFinish(): string {
  const rows = WALK.steps.flatMap((s, k) =>
    s.kind === "finish"
      ? [
          [
            stepOf(k),
            String(s.u),
            `${s.cursor[s.u]} / ${(WALK.next[s.u] as number[]).length}`,
            show(s.stack),
          ],
        ]
      : [],
  );
  return md(
    ["걸음", "검은색으로 칠한 정점", "cursor / 목록 길이", "뺀 뒤의 스택"],
    rows,
  );
}

/** 5단계 — 바깥 반복이 흰색 정점을 다시 잡는 자리. 조각이 둘인 입력이다. */
export const SPLIT_N = 5;
export const SPLIT_EDGES: Edge[] = [
  [0, 1],
  [2, 3],
  [3, 4],
  [4, 2],
];

function buildRestart(): string {
  const t = traced(SPLIT_N, SPLIT_EDGES);
  const rows = t.outer.map(({ s, color }) => {
    if (color !== WHITE) return [`s = ${s}`, COLOR_NAME[color], "넘어간다"];
    const at = t.steps.findIndex((x) => x.kind === "start" && x.u === s);
    const end = t.steps.findIndex(
      (x, k) => k > at && (x.stack.length === 0 || x.kind === "back"),
    );
    const e = t.steps[end] as Step;
    return [
      `s = ${s}`,
      COLOR_NAME[color],
      e.kind === "back"
        ? `회색으로 칠해 시작한다 — ${stepOf(end)} 에 ${arrow([e.u, e.v])} 가 회색을 만난다`
        : `회색으로 칠해 시작한다 — ${stepOf(end)} 에 스택이 빈다`,
    ];
  });
  return withSentence(
    md(["바깥 반복", "그때의 색", "한 일"], rows),
    `간선 목록은 ${edgeList(SPLIT_EDGES)} 이고, 반환값은 ${t.answer} 입니다.`,
  );
}

/** 전제 — 간선에 방향이 없는 그래프를 두 방향 간선으로 적어 넣으면. */
function premiseUndirected(): string {
  const cases: { label: string; n: number; edges: Edge[] }[] = [
    { label: "간선 하나 0-1", n: 2, edges: [[0, 1]] },
    { label: "경로 0-1-2", n: 3, edges: chain(3) },
    {
      label: "삼각형 0-1-2-0",
      n: 3,
      edges: [
        [0, 1],
        [1, 2],
        [2, 0],
      ],
    },
  ];
  let wrong = 0;
  const rows = cases.map((c) => {
    const both: Edge[] = c.edges.flatMap(([a, b]) => [
      [a, b] as Edge,
      [b, a] as Edge,
    ]);
    const got = directedCycleDetection(c.n, both);
    const want = undirectedHasCycle(c.n, c.edges);
    if (got !== want) wrong++;
    return [c.label, edgeList(both), String(got), want ? "있다" : "없다"];
  });
  return withSentence(
    md(
      ["무향 그래프", "두 방향으로 적은 간선 목록", "정본의 답", "무향 사이클"],
      rows,
    ),
    `입력 ${cases.length} 개 가운데 정본의 답이 무향 사이클의 유무와 어긋나는 입력은 ${wrong} 개입니다.`,
  );
}

/** 재귀로 적은 사본과 정본을 사슬에 넣는다. */
function designRecursion(): string {
  const rows = [1_000, 100_000].map((v) => [
    comma(v),
    recursive(v, chain(v)),
    String(directedCycleDetection(v, chain(v))),
  ]);
  return md(["사슬 길이", "재귀로 적은 사본", "스택 배열(정본)"], rows, [0]);
}

/* ─────────────────── 「수행으로 알아보는 알고리즘」 ─────────────────── */

/** 도입 — 끝까지 쓸 고정 입력과 그 답. */
function walkInput(): string {
  return [
    `const n = ${WALK_N};`,
    `const edges: [number, number][] = [${WALK_EDGES.map(([u, v]) => `[${u}, ${v}]`).join(", ")}];`,
    `// 이 절이 끝나면 ${WALK.answer} 가 나와야 한다`,
  ].join("\n");
}

/** 1. 조각 — 나가는 목록과 색 · cursor 의 첫 모습. */
function walkNext(): string {
  const lines = WALK.next.map((list, u) => [
    `next[${u}] = ${show(list)}`,
    list.length === 0
      ? "나가는 간선이 없다"
      : list.map((v) => arrow([u, v])).join(" · "),
  ]);
  return columns([
    ...lines,
    [""],
    [`color = ${show(WALK.next.map(() => WHITE))}`, "전부 흰색"],
    [`cursor = ${show(WALK.next.map(() => 0))}`, "아직 확인한 간선이 없다"],
    ["stack = []", "비어 있다"],
  ]);
}

/** 2. 조각 — 정점 0 을 꼭대기에 둘 때 next[0] 을 차례로 확인한다. */
function walkTopZero(): string {
  const rows = WALK.steps.flatMap((s, k) =>
    s.u === 0 && s.v >= 0
      ? [
          [
            stepOf(k),
            `cursor[0] = ${(s.cursor[0] as number) - 1}`,
            `v = ${s.v}`,
            `${s.v} ${ga(s.v)} ${COLOR_NAME[s.seen as Color]}`,
            branchLabel(s),
          ],
        ]
      : [],
  );
  return columns(rows);
}

/** 짚고 가기 — 두 색 사본이 가로지르는 간선에서 무엇을 하는가. */
function mutantTwoColorTrace(): string {
  const good = traced(CROSS_N, CROSS_EDGES);
  const bad = traced(CROSS_N, CROSS_EDGES, { test: "notWhite" });
  if (live(twoColorMutant)) {
    const want = twoColorMutant.directedCycleDetection(CROSS_N, [
      ...CROSS_EDGES,
    ]);
    if (bad.answer !== want) throw new Error("두 색 사본의 답이 변이와 다르다");
  }
  const n = Math.max(good.steps.length, bad.steps.length);
  const rows = Array.from({ length: n }, (_, k) => [
    stepOf(k),
    sayStep(good.steps[k]),
    sayStep(bad.steps[k]),
  ]);
  return withSentence(
    md(["걸음", "회색만 사이클 (정본)", "흰색이 아니면 사이클"], rows),
    `반환값은 앞이 ${good.answer}, 뒤가 ${bad.answer} 입니다.`,
  );
}

/** 3. 끝까지 — 걸음마다 조건 판정. */
function walkTrace(): string {
  const cond = (s: Step): string => {
    switch (s.kind) {
      case "start":
        return `\`color[${s.u}]\` 흰색 → 시작한다`;
      case "descend":
        return `\`color[${s.v}] === GRAY\` 거짓 · \`=== WHITE\` 참 → ②`;
      case "skip":
        return `\`color[${s.v}] === GRAY\` 거짓 · \`=== WHITE\` 거짓 → ③`;
      case "back":
        return `\`color[${s.v}] === GRAY\` 참 → ①`;
      case "finish":
        return `\`cursor[${s.u}] === next[${s.u}].length\` 참 → ④`;
    }
  };
  const rows = WALK.steps.map((s, k) => [
    stepOf(k),
    s.v >= 0 ? arrow([s.u, s.v]) : "—",
    s.v >= 0 ? COLOR_NAME[s.seen as Color] : "—",
    cond(s),
    show(s.cursor),
    show(s.stack),
  ]);
  const ids = (kind: Step["kind"]) =>
    WALK.steps.flatMap((s, k) => (s.kind === kind ? [stepOf(k)] : []));
  const checks = WALK.steps.filter((s) => s.v >= 0).length;
  const branch = (label: string, kind: Step["kind"]) => {
    const got = ids(kind);
    return `${label}${은는(CIRCLED[label] ?? label)} ${stepList(got)} 에서 ${got.length} 번`;
  };
  return withSentence(
    md(
      ["걸음", "확인한 간선", "도착 정점의 색", "조건 판정", "cursor", "stack"],
      rows,
    ),
    `${branch("②", "descend")}, ${branch("③", "skip")}, ${branch("④", "finish")}, ${branch("①", "back")} 실행됐습니다. 간선 확인은 ${checks} 번이고 간선 수 ${WALK_EDGES.length}${과와(WALK_EDGES.length)} 같습니다. 반환값은 ${WALK.answer} 입니다.`,
  );
}

/** 짚고 가기 — 정점 0 에서 한 번만 시작하면. */
const COMPONENT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "0→1 과 사이클 2→3→4→2", n: SPLIT_N, edges: SPLIT_EDGES },
  {
    label: "자기 루프가 정점 3 에 있다",
    n: 4,
    edges: [
      [0, 1],
      [1, 2],
      [3, 3],
    ],
  },
  {
    label: "사이클이 0 에서 이어진다 0→1→2→0",
    n: 3,
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
  },
  { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
];

function componentValues(): string {
  const rows = COMPONENT_CASES.map((c) => {
    const a = traced(c.n, c.edges, { onlyZero: true }).answer;
    const b = directedCycleDetection(c.n, c.edges);
    return [c.label, String(a), String(b), a === b ? "같다" : "어긋난다"];
  });
  return md(
    ["입력", "정점 0 에서만 시작", "흰색 정점마다 시작 (정본)", "두 답"],
    rows,
  );
}

function componentTrace(): string {
  const only = traced(SPLIT_N, SPLIT_EDGES, { onlyZero: true });
  const full = traced(SPLIT_N, SPLIT_EDGES);
  const whites = (s: Step) =>
    s.color.flatMap((c, v) => (c === WHITE ? [v] : []));
  const lastOnly = only.steps.at(-1) as Step;
  const restart = full.steps.find((s) => s.kind === "start" && s.u !== 0);
  const tail = full.steps.at(-1) as Step;
  if (!restart) throw new Error("바깥 반복이 다시 잡은 정점이 없다");
  return columns([
    [
      "0 에서만 시작",
      `걸음 ${only.steps.length} 개 뒤 스택이 빈다`,
      `흰색으로 남은 정점 ${whites(lastOnly).join(" · ")}`,
      String(only.answer),
    ],
    [
      `s = ${restart.u} 에서 다시`,
      `${arrow([tail.u, tail.v])}${을를(tail.v)} 확인할 때 ${tail.v} ${ga(tail.v)} ${COLOR_NAME[tail.seen as Color]}`,
      "바깥 for 문이 흰색 정점을 다시 잡았다",
      String(full.answer),
    ],
  ]);
}

/** 짚고 가기 — cursor 를 두는 것과 매번 처음부터 확인하는 것. */
function cursorValues(): string {
  const cases: { label: string; n: number; edges: Edge[] }[] = [
    { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
    { label: "마름모 네 정점", n: DIAMOND_N, edges: DIAMOND_EDGES },
    { label: "별 모양 1,000", n: 1_000, edges: star(1_000) },
    { label: "별 모양 10,000", n: 10_000, edges: star(10_000) },
    { label: "사슬 10,000", n: 10_000, edges: chain(10_000) },
  ];
  const rows = cases.map((c) => {
    const withCur = traced(c.n, c.edges);
    const reads = withCur.steps.at(-1)?.checked ?? 0;
    const b = withoutCursor(c.n, c.edges);
    return [
      c.label,
      comma(c.edges.length),
      comma(reads),
      comma(b.reads),
      withCur.answer === b.answer ? `같다 (${b.answer})` : "다르다",
    ];
  });
  return md(
    ["입력", "E", "cursor 있음", "매번 처음부터", "두 답"],
    rows,
    [1, 2, 3],
  );
}

function cursorStar(): string {
  const v = 1_000;
  const r = withoutCursor(v, star(v));
  const z = r.zeroReads;
  const sum = z.reduce((a, x) => a + x, 0);
  const tri = ((v - 1) * v) / 2;
  if (sum !== tri + (v - 1) || sum !== r.reads) {
    throw new Error("별 모양의 읽은 수가 식과 다르다");
  }
  const rows = [0, 1, 2, z.length - 2, z.length - 1].map((i) => [
    `${comma(i + 1)} 번째`,
    `next[0] 에서 ${comma(z[i] as number)} 개 읽는다`,
  ]);
  return [
    `정점 0 이 꼭대기에 오는 횟수 ${comma(z.length)} 번`,
    "",
    columns(rows),
    "",
    `합 = (1 + 2 + … + ${comma(v - 1)}) + ${comma(v - 1)} = ${comma(tri)} + ${comma(v - 1)} = ${comma(sum)}`,
  ].join("\n");
}

/** 전체 코드를 여러 입력에 실행한 결과. */
function walkResult(): string {
  const cases: [number, Edge[]][] = [
    [WALK_N, WALK_EDGES],
    [DIAMOND_N, DIAMOND_EDGES],
    [CROSS_N, CROSS_EDGES],
    [
      4,
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 1],
      ],
    ],
    [
      2,
      [
        [0, 1],
        [1, 0],
      ],
    ],
    [1, [[0, 0]]],
    [5, []],
  ];
  return columns(
    cases.map(([n, edges]) => [
      `directedCycleDetection(${n}, ${edgeList(edges)})`,
      "→",
      String(directedCycleDetection(n, edges)),
    ]),
  );
}

/* ─────────────────── 「알아 두면 좋은 개념」 ─────────────────── */

/** 역방향 간선에서 멈추지 않고 끝까지 가른 기록 — 간선 번호마다 종류 하나. */
export function classify(
  n: number,
  edges: readonly Edge[],
): Map<number, EdgeKind> {
  const t = traced(n, edges, { full: true });
  const out = new Map<number, EdgeKind>();
  for (const s of t.steps) if (s.edgeKind) out.set(s.edge, s.edgeKind);
  return out;
}

function edgeClasses(): string {
  const kinds = classify(WALK_N, WALK_EDGES);
  const same = WALK.steps.every(
    (s) => !s.edgeKind || kinds.get(s.edge) === s.edgeKind,
  );
  const rows = WALK.steps.flatMap((s, k) =>
    s.v >= 0
      ? [
          [
            stepOf(k),
            arrow([s.u, s.v]),
            COLOR_NAME[s.seen as Color],
            kinds.get(s.edge) as string,
            kinds.get(s.edge) === "역방향 간선" ? "닫는다" : "아니다",
          ],
        ]
      : [],
  );
  return withSentence(
    md(["걸음", "간선", "확인할 때 도착 정점의 색", "종류", "사이클"], rows),
    `간선 ${kinds.size} 개를 모두 갈랐고, 정본이 멈추는 자리까지의 분류는 끝까지 간 분류와 ${same ? "같습니다" : "다릅니다"}.`,
  );
}

/* ─────────────────── 파트 2 ─────────────────── */

/** 최적인 문제의 모양 — 있는가와 몇 개인가의 비용. */
function fitCount(): string {
  const k = 16;
  const d = diamondChain(k);
  const t = traced(d.n, d.edges);
  return md(
    ["질문", "하는 일", "다이아몬드 16 개에서 센 값"],
    [
      [
        "사이클이 있는가",
        "간선을 한 번씩 확인한다",
        `확인한 간선 ${comma(t.steps.at(-1)?.checked ?? 0)} 개 · 답 ${t.answer}`,
      ],
      [
        "서로 다른 경로가 몇 개인가",
        "경로를 하나씩 센다",
        `정점 0 에서 끝까지 가는 경로 ${comma(2 ** k)} 개`,
      ],
    ],
  );
}

/** 경쟁 설계와 나란히 잰 값. `.alt.ts` 가 낸 것을 그대로 옮긴다. */
const ALT_METRICS = [
  "전개가 쓰는 여섯 정점에서 배열 칸 접근",
  "사이클이 정점 0 에서 두 걸음일 때 배열 칸 접근",
  "사이클이 정점 0 에서 99,992 걸음일 때 배열 칸 접근",
  "사이클이 정점 0 에서 99,993 걸음일 때 배열 칸 접근",
  "사이클이 씨앗을 전부 막을 때 배열 칸 접근",
  "사이클이 없는 사슬에서 배열 칸 접근",
  "사이클이 없는 사슬에서 새로 잡는 칸",
];

function altRow(m: string, label = m): string[] {
  const three: Record<string, number> = ALT_CASES["삼색 표시"]();
  const indeg: Record<string, number> = ALT_CASES["진입차수 세기"]();
  const a = three[m] as number;
  const b = indeg[m] as number;
  return [label, comma(a), comma(b), a < b ? "삼색 표시" : "진입차수 세기"];
}

function altFlip(): string {
  return md(
    ["재는 것", "삼색 표시", "진입차수 세기", "적은 쪽"],
    ALT_METRICS.map((m) => altRow(m)),
    [1, 2],
  );
}

function altBoundary(): string {
  return md(
    ["사이클까지 확인하는 거리", "삼색 표시", "진입차수 세기", "적은 쪽"],
    ALT_METRICS.slice(2, 4).map((m) =>
      altRow(m, (/(\d[\d,]*) 걸음/.exec(m)?.[0] ?? m) as string),
    ),
    [1, 2],
  );
}

/** 수식 — 간선을 확인한 직후마다 회색 정점의 열과 이웃 간선. */
function mathPathCheck(): string {
  let t = 0;
  let bad = 0;
  const rows: string[][] = [];
  for (const [k, s] of WALK.steps.entries()) {
    if (s.v < 0) continue;
    t++;
    const path = s.stack;
    const ok = path.every(
      (x, i) =>
        i === 0 || (WALK.next[path[i - 1] as number] as number[]).includes(x),
    );
    if (!ok) bad++;
    rows.push([
      String(t),
      stepOf(k),
      `(${path.join(", ")})`,
      ok ? "있다" : "없다",
    ]);
  }
  return withSentence(
    md(["t", "걸음", "P_t", "이웃한 두 정점 사이의 간선"], rows, [0]),
    `열 ${t} 개 가운데 이웃한 두 정점 사이에 간선이 없는 열은 ${bad} 개입니다.`,
  );
}

/** 수식 — 왼쪽에서 오른쪽. 전개가 회색을 만난 걸음에서 스택의 경로와 그 간선을 이어 붙인다. */
function mathBackEdge(): string {
  const last = WALK.steps.at(-1) as Step;
  const i = last.stack.indexOf(last.v);
  const path = last.stack.slice(i);
  const cyc = [...path, last.v];
  const ok = cyc.every(
    (x, j) =>
      j === 0 || (WALK.next[cyc[j - 1] as number] as number[]).includes(x),
  );
  return columns([
    [
      `${stepOf(WALK.steps.length - 1)} 에 확인한 간선`,
      `(u, v) = (${last.u}, ${last.v})`,
    ],
    ["그때의 스택", `P_${last.checked} = (${last.stack.join(", ")})`],
    ["v 의 자리", `i = ${i}`],
    ["x_i 부터 꼭대기까지", path.join(" → ")],
    ["간선 (u, v) 를 붙이면", cyc.join(" → ")],
    ["이어 붙인 간선이 다 있는가", ok ? "있다 — 사이클이다" : "없다"],
  ]);
}

/** 수식 — 오른쪽에서 왼쪽. 전개가 찾은 사이클을 가장 먼저 회색이 된 정점부터 따라간다. */
function mathCycleOrder(): string {
  const cyc = walkCycle();
  const grayAt = (v: number) => paintedAt(WALK, v).gray;
  const w = [...cyc].sort((a, b) => grayAt(a) - grayAt(b))[0] as number;
  const from = cyc.indexOf(w);
  const order = [...cyc.slice(from), ...cyc.slice(0, from)];
  const rows = order.map((x, i) => {
    const y = order[(i + 1) % order.length] as number;
    const k = WALK.steps.findIndex((s) => s.u === x && s.v === y);
    const at = WALK.steps[grayAt(x)] as Step;
    return [
      `w_${i} = ${x}`,
      stepOf(grayAt(x)),
      i === 0 ? "자기 자신" : at.stack.includes(w) ? "있다" : "없다",
      arrow([x, y]),
      stepOf(k),
      COLOR_NAME[(WALK.steps[k] as Step).seen as Color],
    ];
  });
  return withSentence(
    md(
      [
        "정점",
        "회색이 된 걸음",
        `그때 스택의 w = ${w}`,
        "다음 간선",
        "확인한 걸음",
        "그때 다음 정점의 색",
      ],
      rows,
    ),
    `사이클 위에서 가장 먼저 회색이 된 정점은 ${w} 이고, 마지막 간선을 확인할 때 ${w}${이가(w)} 회색이었습니다.`,
  );
}

/** 불변식 — 스택이 가장 깊었던 순간의 두 모임과 그 경로. */
function invariantDeepest(): string {
  let k = 0;
  WALK.steps.forEach((s, j) => {
    if (s.stack.length > (WALK.steps[k] as Step).stack.length) k = j;
  });
  const s = WALK.steps[k] as Step;
  return columns([
    [`${stepOf(k)} 직후`, "회색 정점", show(grayOf(s))],
    ["", "stack", show(s.stack)],
    ["", "경로", s.stack.join(" → ")],
  ]);
}

/** 닫힌 형태 `11V + 8E` 가 실제 계수와 같은지 대조한다 — 사이클이 없는 입력이다. */
function costClosedForm(): string {
  const cases: { label: string; n: number; edges: Edge[] }[] = [
    { label: "마름모 네 정점", n: DIAMOND_N, edges: DIAMOND_EDGES },
    { label: "다이아몬드 16 개", ...diamondChain(16) },
    { label: "사슬 1,000", n: 1_000, edges: chain(1_000) },
    { label: "별 모양 1,000", n: 1_000, edges: star(1_000) },
    { label: "사슬 100,000", n: 100_000, edges: chain(100_000) },
  ];
  let match = 0;
  const rows = cases.map((c) => {
    const got = countCells(c.n, c.edges).cells;
    const want = 11 * c.n + 8 * c.edges.length;
    if (got === want) match++;
    return [
      c.label,
      comma(c.n),
      comma(c.edges.length),
      comma(got),
      comma(want),
    ];
  });
  return withSentence(
    md(["입력", "V", "E", "실제 배열 칸 접근", "11V + 8E"], rows, [1, 2, 3, 4]),
    `${cases.length} 줄 가운데 두 값이 같은 줄은 ${match} 개입니다.`,
  );
}

function mathScale(): string {
  const V = 100_000;
  const E = 100_000;
  return md(
    ["항", "세는 것", "V = E = 100,000 에서"],
    [
      ["11V", "배열 셋 · 바깥 반복 · 꼭대기 확인 · 색 칠하기", comma(11 * V)],
      ["8E", "목록 만들기 · 간선 하나 확인하기", comma(8 * E)],
      ["A(V, E)", "두 항의 합", comma(11 * V + 8 * E)],
      [
        "경로를 하나씩 세기",
        `다이아몬드 ${comma(MAX_DIAMONDS)} 개의 경로 수 2^${comma(MAX_DIAMONDS)}`,
        `${comma(powerDigits(MAX_DIAMONDS))} 자리 수`,
      ],
    ],
    [2],
  );
}

/** 불변식 — 상태를 바꾸는 갈래 셋이 두 모임을 어떻게 함께 바꾸는가. 전개의 걸음에서 한 번씩. */
function invariantOps(): string {
  const kinds: Step["kind"][] = ["descend", "finish", "skip"];
  const rows = kinds.map((kind) => {
    const k = WALK.steps.findIndex((s) => s.kind === kind);
    const before = WALK.steps[k - 1] as Step;
    const after = WALK.steps[k] as Step;
    const sameSet = (s: Step) =>
      grayOf(s).join() === [...s.stack].sort((a, b) => a - b).join();
    return [
      stepOf(k),
      plainLabel(after),
      `${show(grayOf(before))} · ${show(before.stack)}`,
      `${show(grayOf(after))} · ${show(after.stack)}`,
      sameSet(before) && sameSet(after) ? "같다" : "다르다",
    ];
  });
  return md(
    [
      "걸음",
      "갈래",
      "전 — 회색 정점 · 스택",
      "뒤 — 회색 정점 · 스택",
      "두 모임",
    ],
    rows,
  );
}

/** 불변식을 여러 입력의 모든 걸음에서 잰다. */
function invariantCheck(): string {
  const cases: { label: string; n: number; edges: Edge[] }[] = [
    { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
    { label: "마름모 네 정점", n: DIAMOND_N, edges: DIAMOND_EDGES },
    { label: "다이아몬드 16 개", ...diamondChain(16) },
    {
      label: `사이클 없는 무작위 V = 60 · E = 120 (시드 ${RANDOM_SEED})`,
      n: 60,
      edges: randomGraph(60, 120, RANDOM_SEED, true),
    },
    {
      label: `무작위 V = 60 · E = 120 (시드 ${RANDOM_SEED})`,
      n: 60,
      edges: randomGraph(60, 120, RANDOM_SEED, false),
    },
  ];
  let total = 0;
  let broken = 0;
  const rows = cases.map((c) => {
    const t = traced(c.n, c.edges);
    const r = relationCounts(t);
    total += r.steps;
    broken += r.graySet + r.linked;
    return [
      c.label,
      comma(r.steps),
      comma(r.graySet),
      comma(r.linked),
      String(t.answer),
    ];
  });
  return withSentence(
    md(
      [
        "입력",
        "확인한 걸음",
        "회색 모임과 스택이 다른 걸음",
        "스택 이웃 사이에 간선이 없는 걸음",
        "반환값",
      ],
      rows,
      [1, 2, 3],
    ),
    `입력 ${cases.length} 개의 ${comma(total)} 걸음에서 불변식이 깨진 걸음은 ${broken} 개입니다.`,
  );
}

/** 불변식 — 경계에 있는 입력. */
function invariantEdges(): string {
  const cases: { label: string; n: number; edges: Edge[] }[] = [
    { label: "정점 하나", n: 1, edges: [] },
    { label: "간선 없음", n: 5, edges: [] },
    { label: "자기 루프", n: 1, edges: [[0, 0]] },
    {
      label: "크기 2 왕복",
      n: 2,
      edges: [
        [0, 1],
        [1, 0],
      ],
    },
    {
      label: "중복 간선",
      n: 2,
      edges: [
        [0, 1],
        [0, 1],
      ],
    },
    { label: "나뉜 조각", n: SPLIT_N, edges: SPLIT_EDGES },
  ];
  const rows = cases.map((c) => {
    const t = traced(c.n, c.edges);
    const last = t.steps.at(-1) as Step;
    const starts = t.steps.filter((s) => s.kind === "start").length;
    const how =
      last.kind === "back"
        ? `${arrow([last.u, last.v])}${을를(last.v)} 확인할 때 ${last.v} ${ga(last.v)} 회색`
        : `시작 ${starts} 번 · 정점 ${c.n} 개가 모두 검은색`;
    return [
      c.label,
      `\`directedCycleDetection(${c.n}, ${edgeList(c.edges)})\``,
      how,
      String(t.answer),
    ];
  });
  return md(["입력", "호출", "끝난 자리", "결과"], rows);
}

/** 변이 — 뺄 때 회색으로 두면 마름모에서 무엇을 하는가. */
function mutantStayGrayTrace(): string {
  const bad = traced(DIAMOND_N, DIAMOND_EDGES, { finishColor: GRAY });
  if (live(stayGrayMutant)) {
    const want = stayGrayMutant.directedCycleDetection(DIAMOND_N, [
      ...DIAMOND_EDGES,
    ]);
    if (bad.answer !== want) {
      throw new Error("회색으로 두는 사본의 답이 변이와 다르다");
    }
  }
  const rows = bad.steps.map((s, k) => [
    stepOf(k),
    sayStep(s, true),
    show(s.stack),
    show(grayOf(s)),
  ]);
  return withSentence(
    md(["걸음", "한 일", "스택", "회색 정점"], rows),
    `반환값은 ${bad.answer} 이고, 정본의 답은 ${directedCycleDetection(DIAMOND_N, DIAMOND_EDGES)} 입니다.`,
  );
}

/** 비용을 세는 과정 — 전개의 반복 한 바퀴마다. */
function perfDerive(): string {
  const loops = WALK.steps
    .map((s, k) => ({ s, k }))
    .filter(({ s }) => s.kind !== "start");
  const rows = loops.map(({ s, k }, i) => [
    String(i + 1),
    s.kind === "finish" ? "목록을 다 봐서 뺀다" : "간선 하나를 확인한다",
    s.kind === "finish" ? String(s.u) : "—",
    s.v >= 0 ? arrow([s.u, s.v]) : "—",
    stepOf(k),
  ]);
  const checks = loops.filter(({ s }) => s.v >= 0).length;
  const pops = loops.filter(({ s }) => s.kind === "finish").length;
  return withSentence(
    md(["바퀴", "한 일", "뺀 정점", "확인한 간선", "걸음"], rows, [0]),
    `반복은 ${loops.length} 바퀴이고, 간선 확인이 ${checks} 번으로 간선 수 ${WALK_EDGES.length}${과와(WALK_EDGES.length)} 같습니다. 빼기는 ${pops} 번으로 정점 수 ${WALK_N} 보다 적습니다.`,
  );
}

const BIG_V = 100_000;

/** 같은 V·E 에서 모양과 사이클 자리를 바꾸면 — 케이스별 비용과 최악을 만드는 입력이 함께 쓴다. */
const SHAPES: { label: string; edges: Edge[] }[] = [
  {
    // 사슬에 순방향 간선 0→2 를 더해 간선 수를 규모 상한까지 채운 것이다.
    label: "사슬 + 순방향 간선 하나 (사이클 없음)",
    edges: [...chain(BIG_V), [0, 2] as Edge],
  },
  {
    label: "별 모양 + 순방향 간선 하나 (사이클 없음)",
    edges: [...star(BIG_V), [1, 2] as Edge],
  },
  {
    label: "사슬이 닫힌다 99,999 → 0",
    edges: [...chain(BIG_V), [BIG_V - 1, 0] as Edge],
  },
  {
    label: "사이클이 정점 0 에서 두 걸음",
    edges: [[2, 1] as Edge, ...chain(BIG_V)],
  },
];

const shapeRuns = SHAPES.map((s) => ({
  ...s,
  run: countCells(BIG_V, s.edges),
}));

function perfCases(): string {
  const none = shapeRuns[0];
  const near = shapeRuns[3];
  if (!none || !near) throw new Error("모양 목록이 모자라다");
  return withSentence(
    md(
      ["케이스", "입력", "배열 칸 접근"],
      [
        ["사이클이 없다", none.label, comma(none.run.cells)],
        ["사이클이 두 걸음 앞에 있다", near.label, comma(near.run.cells)],
      ],
      [2],
    ),
    `두 입력 다 V = ${comma(BIG_V)} · E = ${comma(none.edges.length)} 이고, 배열 칸 접근은 ${(none.run.cells / near.run.cells).toFixed(1)} 배 차이가 납니다.`,
  );
}

function shapeValues(): string {
  return md(
    [
      "입력 모양",
      "V",
      "E",
      "스택의 최대 깊이",
      "가장 긴 목록",
      "배열 칸 접근",
      "반환값",
    ],
    shapeRuns.map((s) => [
      s.label,
      comma(BIG_V),
      comma(s.edges.length),
      comma(s.run.peak),
      comma(s.run.longest),
      comma(s.run.cells),
      String(s.run.answer),
    ]),
    [1, 2, 3, 4, 5],
  );
}

/** 스스로 점검하기 — 간선 `[0,4]` 를 목록 맨 앞으로 옮기면. */
export const SWAPPED_EDGES: Edge[] = [
  [0, 4],
  [0, 1],
  [1, 3],
  [3, 4],
  [0, 2],
  [2, 3],
  [2, 5],
  [5, 0],
];

function orderSwap(): string {
  const before = classify(WALK_N, WALK_EDGES);
  const after = classify(WALK_N, SWAPPED_EDGES);
  const key = ([u, v]: Edge) => arrow([u, v]);
  const beforeByName = new Map(
    WALK_EDGES.map((e, i) => [key(e), before.get(i) ?? "—"]),
  );
  let changed = 0;
  const rows = SWAPPED_EDGES.map((e, i) => {
    const a = beforeByName.get(key(e)) ?? "—";
    const b = after.get(i) ?? "—";
    if (a !== b) changed++;
    return [key(e), a, b, a === b ? "그대로" : "바뀐다"];
  });
  const r1 = directedCycleDetection(WALK_N, WALK_EDGES);
  const r2 = directedCycleDetection(WALK_N, SWAPPED_EDGES);
  rows.push([
    "반환값",
    String(r1),
    String(r2),
    r1 === r2 ? "그대로" : "바뀐다",
  ]);
  return withSentence(
    md(
      ["간선", "전개 입력의 순서에서", "[0,4] 를 맨 앞에 둔 순서", "변화"],
      rows,
    ),
    `종류가 바뀐 간선은 ${changed} 개이고, 반환값은 ${r1 === r2 ? "그대로입니다" : "바뀝니다"}.`,
  );
}

export const PROOFS: Record<string, () => string> = {
  "concept-paths": conceptPaths,
  "naive-scale": naiveScale,
  "origin-compare": originCompare,
  "diamond-meet": diamondMeet,
  "build-next": buildNext,
  "colors-read": colorsRead,
  "colors-relation": colorsRelation,
  "colors-vs-seen": colorsVsSeen,
  "build-descend": buildDescend,
  "build-branches": buildBranches,
  "build-finish": buildFinish,
  "build-restart": buildRestart,
  "premise-undirected": premiseUndirected,
  "design-recursion": designRecursion,
  "walk-input": walkInput,
  "walk-next": walkNext,
  "walk-top0": walkTopZero,
  "mutant-two-color": () =>
    mutantTable(twoColorRows, ["회색만 사이클 (정본)", "흰색이 아니면 사이클"]),
  "mutant-two-color-trace": mutantTwoColorTrace,
  "walk-trace": walkTrace,
  "component-values": componentValues,
  "component-trace": componentTrace,
  "cursor-values": cursorValues,
  "cursor-star": cursorStar,
  "walk-result": walkResult,
  "edge-classes": edgeClasses,
  "fit-count": fitCount,
  "alt-flip": altFlip,
  "alt-boundary": altBoundary,
  "math-path-check": mathPathCheck,
  "math-back-edge": mathBackEdge,
  "math-cycle-order": mathCycleOrder,
  "invariant-deepest": invariantDeepest,
  "cost-closed-form": costClosedForm,
  "math-scale": mathScale,
  "invariant-ops": invariantOps,
  "invariant-check": invariantCheck,
  "invariant-edges": invariantEdges,
  "mutant-stay-gray": () =>
    mutantTable(stayGrayRows, ["뺄 때 검은색 (정본)", "뺄 때도 회색"]),
  "mutant-stay-gray-trace": mutantStayGrayTrace,
  "perf-derive": perfDerive,
  "perf-cases": perfCases,
  "shape-values": shapeValues,
  "order-swap": orderSwap,
};
