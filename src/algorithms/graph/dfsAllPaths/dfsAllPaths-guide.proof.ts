/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/dfsAllPaths/dfsAllPaths-guide.md
 *
 * **기록을 덧붙인 사본이 있다**(`traced` · `후보만들어거르기`). 정본은 몇 번 진입했는지, 언제 표시를
 * 지웠는지를 내보내지 않으므로, 기록만 덧붙인 사본이 아니면 그 값을 낼 방법이 없다. **답이 맞는지는
 * 사본이 아니라 정본이 진다** — `traced` 는 부를 때마다 자기 답을 정본과 맞대고, 다르면 던진다. 그림
 * 사이드카(`-guide.fig.tsx`)와 걸음 재생 패널도 여기의 `traced` 가 낸 기록을 쓴다.
 * `전역표시` · `표시없음` · `경로안뺌` 은 **다른 절차**라 정본과 맞대지 않는다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  cases as ALT_CASES,
  grid,
  K,
  M,
  trap,
} from "./dfsAllPaths-guide.alt.ts";
import { dfsAllPaths } from "./dfsAllPaths-guide.ref.ts";

export type Edge = [number, number];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 정점 0 에서 두 갈래가 갈리고, 정점 2 에서 출발 정점으로 되돌아가는
 * 간선이 있으며, 정점 5 는 도착 정점으로 가는 간선이 없는 막다른 자리다. 자기 루프 `[5,5]` 와
 * 「`[0,2]` 가 `[0,1]` 보다 먼저 적혀 있는 것」도 함께 들어 있다.
 */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 2],
  [0, 1],
  [1, 2],
  [1, 4],
  [2, 0],
  [2, 4],
  [2, 5],
  [5, 5],
];
export const WALK_S = 0;
export const WALK_T = 4;

/** 다이아몬드. 정점 3 이 두 경로에 함께 들어 있어 표시를 지우는가가 여기서 갈린다. */
export const DIA_N = 4;
export const DIA_EDGES: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
];

/* ────────────────────────── 표기 ────────────────────────── */

/** `[0, 1, 2, 4]` 꼴 — 본문 표기와 같다. */
export const show = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

/** `[[0,1,4], [0,2,4]]` 꼴 — 경로 목록은 안쪽 쉼표 뒤 공백을 뺀다. */
export const showAll = (xss: readonly (readonly number[])[]): string =>
  `[${xss.map((p) => `[${p.join(",")}]`).join(", ")}]`;

/** `{0, 1, 2}` 꼴 — 켜진 표시의 모임. */
export const showSet = (xs: readonly number[]): string =>
  xs.length === 0 ? "{}" : `{${xs.join(", ")}}`;

/** `39,999,600,002` 꼴 — 본문 표기와 같다. */
export const comma = (n: number | bigint): string => n.toLocaleString("en-US");

const edgeList = (edges: readonly Edge[]): string =>
  `[${edges.map(([u, v]) => `[${u},${v}]`).join(",")}]`;

/** 조사를 고를 때 읽는 앞말 — 닫는 괄호는 소리가 없으니 떼고 마지막 수를 읽는다. */
const said = (s: string): string => s.replace(/[\]})]+$/, "");

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

const same = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/** 경로 목록을 사전식으로 정렬한 사본. 「모임이 같은가」를 보는 데 쓴다. */
const sortPaths = (xss: readonly (readonly number[])[]): number[][] =>
  xss
    .map((p) => [...p])
    .sort((a, b) => {
      for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] !== b[i]) return (a[i] as number) - (b[i] as number);
      }
      return a.length - b.length;
    });

/* ────────────────────────── 입력 ────────────────────────── */

/** 간선 목록에서 이웃 목록을 만든다 — 자기 루프를 빼고 같은 이웃은 한 번만. `sorted` 면 오름차순. */
export function adjacency(
  n: number,
  edges: readonly Edge[],
  sorted = true,
): number[][] {
  const sets: Set<number>[] = Array.from(
    { length: n },
    () => new Set<number>(),
  );
  for (const [u, v] of edges) {
    if (u === v) continue;
    (sets[u] as Set<number>).add(v);
  }
  return sets.map((s) => (sorted ? [...s].sort((a, b) => a - b) : [...s]));
}

/** 정점 `v` 개를 한 줄로 이은 방향 그래프. 경로가 정확히 하나이고 길이가 `v` 다. */
export function chain(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < v - 1; i++) edges.push([i, i + 1]);
  return edges;
}

/** 서로 다른 두 정점 사이에 양쪽 방향 간선이 전부 있는 그래프. */
function complete(n: number): Edge[] {
  const edges: Edge[] = [];
  for (let a = 0; a < n; a++)
    for (let b = 0; b < n; b++) if (a !== b) edges.push([a, b]);
  return edges;
}

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

/** 정점 `n` 개에 간선 `m` 개를 시드로 뽑은 방향 그래프 — 자기 루프와 중복 간선이 섞인다. */
function randomGraph(n: number, m: number, seed: number): Edge[] {
  const r = rng(seed);
  const edges: Edge[] = [];
  for (let i = 0; i < m; i++)
    edges.push([Math.floor(r() * n), Math.floor(r() * n)]);
  return edges;
}

/* ────────────────── 정본과 같은 절차에 기록만 덧붙인 사본 ────────────────── */

/** 기록 한 줄 — 진입 · 이웃 건너뛰기 · 되돌아가기. 값은 그 일을 마친 직후의 상태다. */
type Event =
  | {
      readonly kind: "enter";
      readonly u: number;
      readonly from: number;
      readonly hit: boolean;
      readonly path: readonly number[];
      readonly marks: readonly number[];
    }
  | {
      readonly kind: "skip";
      readonly u: number;
      readonly v: number;
      readonly path: readonly number[];
      readonly marks: readonly number[];
    }
  | {
      readonly kind: "leave";
      readonly u: number;
      readonly path: readonly number[];
      readonly marks: readonly number[];
    };

/** 걸음 하나 — 진입 하나, 건너뛰기 하나, 또는 잇달아 일어난 되돌아가기 한 묶음. */
export interface Step {
  readonly id: string;
  readonly kind: "enter" | "skip" | "leave";
  /** 진입이면 들어간 정점, 건너뛰기면 지금 정점, 되돌아가기면 처음 뺀 정점. */
  readonly u: number;
  /** 진입이면 부모(출발 정점은 −1), 건너뛰기면 건너뛴 이웃, 되돌아가기면 −1. */
  readonly v: number;
  readonly hit: boolean;
  /** 되돌아가기에서 뺀 정점들(뺀 차례). */
  readonly popped: readonly number[];
  /** 그 걸음을 마친 직후의 path. */
  readonly path: readonly number[];
  /** 그 걸음을 마친 직후 `onPath` 가 참인 정점들(번호 차례). */
  readonly marks: readonly number[];
  /** 그 걸음을 마친 직후의 result. */
  readonly results: readonly (readonly number[])[];
  /** 이 걸음까지의 진입 횟수. */
  readonly enters: number;
}

export interface Run {
  readonly adj: number[][];
  readonly steps: readonly Step[];
  readonly result: number[][];
  readonly enters: number;
  readonly checks: number;
  /** 진입 차례대로 — 마디 하나가 곧 진입 하나다(상태 공간 트리). `parent` 는 부모 마디의 차례. */
  readonly nodes: readonly {
    readonly path: readonly number[];
    readonly marks: readonly number[];
    readonly parent: number;
  }[];
}

/** 정본과 같은 절차. 기록 자리만 덧붙였고, 부를 때마다 자기 답을 정본과 맞댄다. */
export function traced(
  n: number,
  edges: readonly Edge[],
  s: number,
  t: number,
): Run {
  const adj = adjacency(n, edges);
  const onPath: boolean[] = Array.from({ length: n }, () => false);
  const path: number[] = [];
  const result: number[][] = [];
  const events: Event[] = [];
  const nodes: {
    path: readonly number[];
    marks: readonly number[];
    parent: number;
  }[] = [];
  const open: number[] = [];
  const marks = () => onPath.flatMap((b, i) => (b ? [i] : []));
  let enters = 0;
  let checks = 0;
  const walk = (u: number, from: number): void => {
    enters++;
    onPath[u] = true;
    path.push(u);
    nodes.push({ path: [...path], marks: marks(), parent: open.at(-1) ?? -1 });
    open.push(nodes.length - 1);
    if (u === t) result.push(path.slice());
    events.push({
      kind: "enter",
      u,
      from,
      hit: u === t,
      path: [...path],
      marks: marks(),
    });
    if (u !== t) {
      for (const v of adj[u] as number[]) {
        checks++;
        if (onPath[v] === true) {
          events.push({ kind: "skip", u, v, path: [...path], marks: marks() });
          continue;
        }
        walk(v, u);
      }
    }
    onPath[u] = false;
    path.pop();
    open.pop();
    events.push({ kind: "leave", u, path: [...path], marks: marks() });
  };
  walk(s, -1);
  const want = dfsAllPaths(n, edges as Edge[], s, t);
  if (!same(result, want)) {
    throw new Error(
      `기록 사본의 답 ${showAll(result)} 이 정본의 답 ${showAll(want)} 과 다르다`,
    );
  }
  // 걸음으로 묶는다 — 잇달아 일어난 되돌아가기는 한 걸음이다.
  const steps: Step[] = [];
  const got: number[][] = [];
  let seen = 0;
  const id = () => `T${steps.length + 1}`;
  for (let i = 0; i < events.length; i++) {
    const e = events[i] as Event;
    if (e.kind === "enter") {
      seen++;
      if (e.hit) got.push([...e.path]);
      steps.push({
        id: id(),
        kind: "enter",
        u: e.u,
        v: e.from,
        hit: e.hit,
        popped: [],
        path: e.path,
        marks: e.marks,
        results: got.map((p) => [...p]),
        enters: seen,
      });
    } else if (e.kind === "skip") {
      steps.push({
        id: id(),
        kind: "skip",
        u: e.u,
        v: e.v,
        hit: false,
        popped: [],
        path: e.path,
        marks: e.marks,
        results: got.map((p) => [...p]),
        enters: seen,
      });
    } else {
      const popped: number[] = [e.u];
      let lastPath = e.path;
      let lastMarks = e.marks;
      while (events[i + 1]?.kind === "leave") {
        i++;
        const next = events[i] as Event;
        popped.push(next.u);
        lastPath = next.path;
        lastMarks = next.marks;
      }
      steps.push({
        id: id(),
        kind: "leave",
        u: e.u,
        v: -1,
        hit: false,
        popped,
        path: lastPath,
        marks: lastMarks,
        results: got.map((p) => [...p]),
        enters: seen,
      });
    }
  }
  return { adj, steps, result, enters, checks, nodes };
}

/** 전개의 기록 — 걸음 재생 패널과 그림이 함께 쓴다. */
export const WALK: Run = traced(WALK_N, WALK_EDGES, WALK_S, WALK_T);

/** 걸음을 마친 직후 켜진 표시의 모임 — 기록 사본의 `onPath` 에서 읽은 값이다. */
export const marksOf = (st: Step): readonly number[] => st.marks;

/** 켜진 표시가 path 안의 정점과 같은가 — 표에 싣는 문장이 이 판정을 쓴다. */
const marksMatch = (st: Step): boolean =>
  same(
    st.marks,
    [...st.path].sort((a, b) => a - b),
  );

/** 걸음 하나를 본문 표의 「한 일」 칸으로. */
export function didText(st: Step): string {
  if (st.kind === "enter")
    return `walk(${st.u}) 진입${st.hit ? " · 경로를 담는다" : ""}`;
  if (st.kind === "skip") return `이웃 ${st.v} 건너뛴다`;
  const last = String(st.popped.at(-1));
  return `${st.popped.join(" · ")}${을를(last)} 뺀다`;
}

/* ────────────────────── 다른 절차들 ────────────────────── */

interface Logged {
  readonly did: string;
  readonly marks: number[];
  readonly path: number[];
  readonly results: number;
}

/** **다른 절차** — 순회의 **전역 표시**를 그대로 가져온 것. 한 번 켠 표시를 끝까지 지우지 않는다. */
function 전역표시(
  n: number,
  edges: readonly Edge[],
  s: number,
  t: number,
): { result: number[][]; log: Logged[]; enters: number; blocked: number[] } {
  const adj = adjacency(n, edges);
  const marked: boolean[] = Array.from({ length: n }, () => false);
  const path: number[] = [];
  const result: number[][] = [];
  const log: Logged[] = [];
  const blocked: number[] = [];
  let enters = 0;
  const snap = (did: string) =>
    log.push({
      did,
      marks: marked.flatMap((m, i) => (m ? [i] : [])),
      path: [...path],
      results: result.length,
    });
  const walk = (u: number): void => {
    enters++;
    marked[u] = true;
    path.push(u);
    if (u === t) result.push(path.slice());
    snap(`${u}${을를(u)} 담는다`);
    if (u !== t) {
      for (const v of adj[u] as number[]) {
        if (marked[v] === true) {
          blocked.push(v);
          snap(`이웃 ${v}${이가(v)} 표시돼 있어 막힌다`);
          continue;
        }
        walk(v);
      }
    }
    path.pop();
    snap(`${u} 에서 되돌아간다`);
  };
  walk(s);
  return { result, log, enters, blocked };
}

/** **다른 절차** — 표시를 아예 하지 않는다. 사이클이 있으면 재귀가 끝나지 않는다. */
function 표시없음(
  n: number,
  edges: readonly Edge[],
  s: number,
  t: number,
  limit = Number.POSITIVE_INFINITY,
): { result: number[][]; entered: number[][] } {
  const adj = adjacency(n, edges);
  const path: number[] = [];
  const result: number[][] = [];
  const entered: number[][] = [];
  const walk = (u: number): void => {
    if (entered.length >= limit) return;
    path.push(u);
    entered.push([...path]);
    if (u === t) result.push(path.slice());
    else for (const v of adj[u] as number[]) walk(v);
    path.pop();
  };
  walk(s);
  return { result, entered };
}

/** **다른 절차** — 표시는 지우는데 경로에서 빼는 것을 잊었다. */
function 경로안뺌(
  n: number,
  edges: readonly Edge[],
  s: number,
  t: number,
): {
  result: number[][];
  log: { did: string; path: number[]; results: number }[];
} {
  const adj = adjacency(n, edges);
  const onPath: boolean[] = Array.from({ length: n }, () => false);
  const path: number[] = [];
  const result: number[][] = [];
  const log: { did: string; path: number[]; results: number }[] = [];
  const walk = (u: number): void => {
    onPath[u] = true;
    path.push(u);
    if (u === t) result.push(path.slice());
    log.push({
      did: `walk(${u}) 진입${u === t ? " · 경로를 담는다" : ""}`,
      path: [...path],
      results: result.length,
    });
    if (u !== t) {
      for (const v of adj[u] as number[]) {
        if (onPath[v] === true) continue;
        walk(v);
      }
    }
    onPath[u] = false;
  };
  walk(s);
  return { result, log };
}

/** 절차 실행 — 예외가 나면 그 예외의 이름을 적는다. */
function tryShow(run: () => number[][]): string {
  try {
    return showAll(run());
  } catch (err) {
    return (err as Error).constructor.name;
  }
}

/**
 * **가장 단순한 방법** — 간선을 따라가지 않고, 중간 정점의 나열을 **가능한 순서대로 전부 만들어
 * 놓고** 그 나열이 실제로 간선으로 이어지는지 하나씩 확인한다.
 */
function 후보만들어거르기(
  n: number,
  edges: readonly Edge[],
  s: number,
  t: number,
): { result: number[][]; 후보: number; 검사: number; 후보목록: number[][] } {
  const has = new Set(
    edges.filter(([u, v]) => u !== v).map(([u, v]) => `${u}>${v}`),
  );
  const others = Array.from({ length: n }, (_, i) => i).filter(
    (v) => v !== s && v !== t,
  );
  const used: boolean[] = Array.from({ length: n }, () => false);
  const seq: number[] = [];
  const result: number[][] = [];
  const 후보목록: number[][] = [];
  let 후보 = 0;
  let 검사 = 0;
  const rec = (): void => {
    후보++;
    const full = [s, ...seq, t];
    if (n <= 6) 후보목록.push(full);
    let ok = true;
    for (let i = 0; i + 1 < full.length; i++) {
      검사++;
      if (!has.has(`${full[i]}>${full[i + 1]}`)) {
        ok = false;
        break;
      }
    }
    if (ok) result.push(full);
    for (const v of others) {
      if (used[v] === true) continue;
      used[v] = true;
      seq.push(v);
      rec();
      seq.pop();
      used[v] = false;
    }
  };
  rec();
  return { result, 후보, 검사, 후보목록 };
}

/** `⌊e·m!⌋` — 서로 다른 정점 `m` 개로 만들 수 있는 나열의 총수. */
function 나열수(m: number): bigint {
  let 항 = 1n;
  let 합 = 1n;
  for (let k = 1; k <= m; k++) {
    항 *= BigInt(m - k + 1);
    합 += 항;
  }
  return 합;
}

/** 나열마다 간선을 끝까지 확인할 때의 총 확인 횟수. */
function 확인수(m: number): bigint {
  let 항 = 1n;
  let 합 = 1n;
  for (let k = 1; k <= m; k++) {
    항 *= BigInt(m - k + 1);
    합 += 항 * BigInt(k + 1);
  }
  return 합;
}

/** 이항계수 `C(a, b)`. */
function 이항(a: number, b: number): bigint {
  let r = 1n;
  for (let i = 0; i < b; i++) r = (r * BigInt(a - i)) / BigInt(i + 1);
  return r;
}

/** 본문 「수식 정의와 유도」가 싣는 코드 그대로 — 완전 방향 그래프의 경로 수. */
function pathCount(n: number): bigint {
  let term = 1n;
  let sum = 1n;
  for (let k = 1; k <= n - 2; k++) {
    term *= BigInt(n - 1 - k);
    sum += term;
  }
  return sum;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Mod = {
  dfsAllPaths(
    n: number,
    edges: Edge[],
    source: number,
    target: number,
  ): number[][];
};
const REF = new URL("./dfsAllPaths-guide.ref.ts", import.meta.url).pathname;

/**
 * **되돌아가는 자리에서 표시를 지우던 줄** 하나를 지운 사본. **정본 소스에서 기계로 만든다** —
 * 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const noUnmark = await loadMutant<Mod>(REF, {
  drop: /^\s*onPath\[u\] = false;/,
});

/** 경로를 **복사해서** 담던 줄 하나를 그대로 담도록 바꾼 사본. */
const noCopy = await loadMutant<Mod>(REF, {
  swap: [/result\.push\(path\.slice\(\)\)/, "result.push(path)"],
});

/** 이웃 목록을 **번호 오름차순으로 정렬하던 줄** 하나에서 정렬만 뺀 사본. */
const unsorted = await loadMutant<Mod>(REF, {
  swap: [
    /const adj: number\[\]\[\] = sets\.map\(\(s\) => \[\.\.\.s\]\.sort\(\(a, b\) => a - b\)\);/,
    "const adj: number[][] = sets.map((s) => [...s]);",
  ],
});

/**
 * 중화 실행(`check-proof` 가 변이를 만들되 적용하지 않는 실행)에서는 세 사본이 정본 그 자체다.
 * 「변이가 답을 바꿨다」 자기검사는 그때 건너뛴다 — 값에서 알아낸다(SPEC §0).
 */
const live = (m: Mod): boolean => m.dfsAllPaths !== dfsAllPaths;

const 전개 = () => dfsAllPaths(WALK_N, WALK_EDGES, WALK_S, WALK_T);
const 다이아 = () => dfsAllPaths(DIA_N, DIA_EDGES, 0, 3);

for (const [이름, m] of [
  ["표시를 안 지운다", noUnmark],
  ["복사하지 않는다", noCopy],
  ["정렬하지 않는다", unsorted],
] as const) {
  if (
    live(m) &&
    same(m.dfsAllPaths(WALK_N, WALK_EDGES, WALK_S, WALK_T), 전개())
  ) {
    throw new Error(`변이 「${이름}」 이 전개 입력에서 결과를 바꾸지 못했다`);
  }
}

// 「표시를 안 지운다」 변이는 순회의 전역 표시와 같은 절차다 — 불변식 절이 그 기록을 그 변이의 자취로 쓴다.
if (
  live(noUnmark) &&
  !same(
    noUnmark.dfsAllPaths(WALK_N, WALK_EDGES, WALK_S, WALK_T),
    전역표시(WALK_N, WALK_EDGES, WALK_S, WALK_T).result,
  )
) {
  throw new Error("표시를 안 지우는 변이와 전역 표시 절차의 답이 다르다");
}

/* ─────────────────── 「전체 컨셉」 ─────────────────── */

function conceptPaths(): string {
  const got = 전개();
  const rows = got.map((p, i) => [
    `경로 ${i + 1}`,
    p.join(" → "),
    String(p.length - 1),
  ]);
  // 간선으로는 이어지지만 정점 0 을 두 번 담는 나열 — 목록에 없어야 한다.
  const bad = [0, 2, 0, 1, 4];
  const has = new Set(WALK_EDGES.map(([u, v]) => `${u}>${v}`));
  const linked = bad.every((x, i) => i === 0 || has.has(`${bad[i - 1]}>${x}`));
  const simple = new Set(bad).size === bad.length;
  const listed = got.some((p) => same(p, bad));
  return withSentence(
    md(["경로", "지나는 정점", "간선 수"], rows, [2]),
    `정점 ${WALK_S} 에서 ${WALK_T} 까지의 단순 경로는 ${got.length} 개입니다. ${bad.join(" → ")} 는 간선으로 ${linked ? "이어지지만" : "이어지지 않고"} 정점 0 을 두 번 담아 ${simple ? "단순 경로이고" : "단순 경로가 아니고"}, 목록에 ${listed ? "있습니다" : "없습니다"}.`,
  );
}

function conceptLex(): string {
  const [a, b] = 전개() as [number[], number[]];
  const rows: string[][] = [];
  let decided = -1;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const x = a[i] as number;
    const y = b[i] as number;
    rows.push([
      `${i + 1} 번째`,
      String(x),
      String(y),
      x === y ? "같다" : x < y ? "앞 경로가 작다" : "뒤 경로가 작다",
    ]);
    if (x !== y) {
      decided = i;
      break;
    }
  }
  return withSentence(
    md(["자리", show(a), show(b), "비교"], rows),
    `${decided + 1} 번째 자리에서 처음 갈리고, 거기서 번호가 작은 ${show(a)} 가 앞섭니다.`,
  );
}

function conceptUnmark(): string {
  const keep = 전개();
  const lose = 전역표시(WALK_N, WALK_EDGES, WALK_S, WALK_T).result;
  return withSentence(
    md(
      ["되돌아갈 때", "결과", "경로 수"],
      [
        ["표시를 지운다", showAll(keep), String(keep.length)],
        ["표시를 지우지 않는다", showAll(lose), String(lose.length)],
      ],
      [2],
    ),
    `표시를 지우지 않으면 경로 ${keep.length - lose.length} 개를 잃습니다.`,
  );
}

/* ─────────────────── 「아이디어를 떠올리는 과정」 ─────────────────── */

function naiveSmall(): string {
  const r = 후보만들어거르기(4, complete(4), 0, 3);
  const rows = r.후보목록.map((p) => {
    const need: string[] = [];
    for (let i = 0; i + 1 < p.length; i++) need.push(`${p[i]} → ${p[i + 1]}`);
    return [String(p.length - 2), show(p), need.join(" · ")];
  });
  return withSentence(
    md(["중간 정점 수", "후보", "있어야 하는 간선"], rows, [0]),
    `정점 4 개에서 두 끝을 뺀 정점 2 개로 만든 후보는 ${r.후보} 개입니다.`,
  );
}

function naiveScale(): string {
  const rows: string[][] = [];
  let ran = 0;
  for (const n of [6, 8, 10, 12, 14]) {
    let 후보 = 나열수(n - 2);
    let 확인 = 확인수(n - 2);
    let how = "식";
    if (n <= 10) {
      const r = 후보만들어거르기(n, complete(n), 0, n - 1);
      if (BigInt(r.후보) !== 후보 || BigInt(r.검사) !== 확인) {
        throw new Error(
          `정점 ${n} 에서 실행 ${r.후보}·${r.검사} 과 식이 다르다`,
        );
      }
      후보 = BigInt(r.후보);
      확인 = BigInt(r.검사);
      how = "실행";
      ran++;
    }
    rows.push([
      comma(n),
      comma(후보),
      comma(확인),
      `${(Number(확인) / 1e8).toFixed(3)} 초`,
      how,
    ]);
  }
  return withSentence(
    md(
      ["정점 n", "정점 나열 후보", "간선 확인", "초당 1 억 번 기준", "센 방법"],
      rows,
      [0, 1, 2, 3],
    ),
    `모든 간선이 있는 그래프에서 센 값입니다. 실행한 ${ran} 줄이 모두 식과 일치했고, 나머지 줄은 그 식으로 낸 값입니다.`,
  );
}

function followVsGenerate(): string {
  const g = 후보만들어거르기(WALK_N, WALK_EDGES, WALK_S, WALK_T);
  if (!same(sortPaths(g.result), WALK.result))
    throw new Error("두 방법의 경로 모임이 다르다");
  return withSentence(
    md(
      ["방법", "만든 것", "간선 확인", "결과"],
      [
        [
          "후보를 전부 만들어 거른다",
          `나열 ${g.후보} 개`,
          comma(g.검사),
          showAll(sortPaths(g.result)),
        ],
        [
          "간선을 따라가며 만든다",
          `진입 ${WALK.enters} 번`,
          comma(WALK.checks),
          showAll(WALK.result),
        ],
      ],
      [2],
    ),
    `두 결과가 일치합니다. 후보 ${g.후보} 개 가운데 경로가 된 것은 ${g.result.length} 개이고, 나머지 ${g.후보 - g.result.length} 개는 간선으로 이어지지 않는다는 것을 확인하는 데만 쓰였습니다.`,
  );
}

function growNoMark(): string {
  const limit = 6;
  const r = 표시없음(WALK_N, WALK_EDGES, WALK_S, WALK_T, limit);
  const adj = adjacency(WALK_N, WALK_EDGES);
  const rows = r.entered.map((p, i) => {
    const list = adj[p.at(-1) as number] as number[];
    return [String(i + 1), show(p), show(list), String(list[0] ?? "없음")];
  });
  const lastPath = r.entered.at(-1) as number[];
  const half = lastPath.length / 2;
  const repeats = same(lastPath.slice(0, half), lastPath.slice(half));
  return withSentence(
    md(
      ["진입", "path", "끝 정점의 이웃 목록", "다음에 들어가는 이웃"],
      rows,
      [0],
    ),
    `${limit} 번째 진입에서 path 가 ${show(lastPath)} 이고, ${repeats ? `앞의 ${half} 칸이 그대로 되풀이됩니다` : "아직 되풀이가 안 보입니다"}.`,
  );
}

function globalMark(): string {
  const rows: [string, number[][], number[][]][] = [
    ["다이아몬드", 다이아(), 전역표시(DIA_N, DIA_EDGES, 0, 3).result],
    [
      "전개가 쓰는 여섯 정점",
      전개(),
      전역표시(WALK_N, WALK_EDGES, WALK_S, WALK_T).result,
    ],
  ];
  return withSentence(
    md(
      ["입력", "표시를 지우는 절차", "표시를 끝까지 두는 절차"],
      rows.map(([k, a, b]) => [k, showAll(a), showAll(b)]),
    ),
    rows
      .map(
        ([k, a, b]) =>
          `${k}에서 경로 ${a.length} 개 가운데 ${b.length} 개만 남습니다.`,
      )
      .join(" "),
  );
}

function globalMarkTrace(): string {
  const r = 전역표시(DIA_N, DIA_EDGES, 0, 3);
  const rows = r.log.map((e) => [
    e.did,
    showSet(e.marks),
    show(e.path),
    String(e.results),
  ]);
  const blocked = r.log.find((e) => e.did.includes("막힌다"));
  return withSentence(
    md(["한 일", "켜진 표시", "path", "담은 경로 수"], rows, [3]),
    blocked
      ? `정점 3 은 첫 경로에 한 번 담겼을 뿐인데 표시가 남아, 「${blocked.did}」 자리에서 두 번째 경로가 없어집니다.`
      : "막히는 자리가 없습니다.",
  );
}

function unmarkPlacement(): string {
  const run = (
    f: (n: number, e: Edge[], s: number, t: number) => number[][],
  ) => [
    tryShow(() => f(DIA_N, DIA_EDGES, 0, 3)),
    tryShow(() => f(WALK_N, WALK_EDGES, WALK_S, WALK_T)),
  ];
  const want = [showAll(다이아()), showAll(전개())];
  const rows: [string, string[]][] = [
    [
      "한 번 켠 표시를 끝까지 둔다",
      run((n, e, s, t) => 전역표시(n, e, s, t).result),
    ],
    [
      "표시를 아예 하지 않는다",
      run((n, e, s, t) => 표시없음(n, e, s, t).result),
    ],
    [
      "표시는 지우지만 경로에서 안 뺀다",
      run((n, e, s, t) => 경로안뺌(n, e, s, t).result),
    ],
    ["표시를 지우고 경로에서도 뺀다", run(dfsAllPaths)],
  ];
  const right = rows.filter(([, v]) => same(v, want)).map(([k]) => k);
  return withSentence(
    md(
      ["되돌아갈 때 하는 일", "다이아몬드", "전개가 쓰는 여섯 정점"],
      rows.map(([k, v]) => [k, ...v]),
    ),
    `두 입력에서 모두 정본의 답과 같은 줄은 ${right.length} 개(${right.join(" · ")})입니다.`,
  );
}

/** 「아이디어를 떠올리는 과정」 사다리의 수 — 그림 사이드카가 쓴다. */
export function ladderNumbers() {
  const big = 14;
  const checks = 확인수(big - 2);
  return {
    big,
    naiveChecks: comma(checks),
    naiveSeconds: `${(Number(checks) / 1e8).toFixed(0)} 초`,
    noMark: tryShow(() => 표시없음(WALK_N, WALK_EDGES, WALK_S, WALK_T).result),
    globalGot: 전역표시(WALK_N, WALK_EDGES, WALK_S, WALK_T).result.length,
    noPopGot: showAll(경로안뺌(DIA_N, DIA_EDGES, 0, 3).result),
    want: WALK.result.length,
    enters: WALK.enters,
  };
}

/* ─────────────────── 「아이디어 상세」 ─────────────────── */

/** 상태 공간 트리의 마디 하나를 읽는다 — 마디의 path 와 켜진 표시, 자식이 되는 이웃. */
function treeRead(): string {
  const pick = WALK.nodes.filter((x) => x.path.at(-1) === 2);
  const rows = pick.map((x) => {
    const list = WALK.adj[2] as number[];
    const on = new Set(x.path);
    const kids = list.filter((v) => !on.has(v));
    const skip = list.filter((v) => on.has(v));
    return [
      x.path.join(" → "),
      showSet(x.marks),
      show(list),
      kids.length ? kids.join(" · ") : "없음",
      skip.length ? skip.join(" · ") : "없음",
    ];
  });
  return withSentence(
    md(
      ["마디", "켜진 표시", "adj[2]", "자식이 되는 이웃", "건너뛰는 이웃"],
      rows,
    ),
    `끝 정점이 2 인 마디는 ${pick.length} 개이고, 켜진 표시가 뿌리에서 그 마디까지 지나온 정점과 같은 마디는 ${
      pick.filter((x) =>
        same(
          x.marks,
          [...x.path].sort((a, b) => a - b),
        ),
      ).length
    } 개입니다.`,
  );
}

function treeNodes(): string {
  const rows = WALK.nodes.map((x, i) => {
    const kids = WALK.nodes.filter((y) => y.parent === i).length;
    const last = x.path.at(-1) as number;
    const kind =
      last === WALK_T ? "답" : kids === 0 ? "막다른 마디" : "가운데 마디";
    return [
      String(i + 1),
      x.path.join(" → "),
      x.parent < 0 ? "없음" : `${x.parent + 1} 번`,
      String(kids),
      kind,
    ];
  });
  const hits = rows.filter((r) => r[4] === "답").length;
  const deads = rows.filter((r) => r[4] === "막다른 마디").length;
  return withSentence(
    md(["마디 번호", "마디", "부모", "자식 수", "마디의 종류"], rows, [0, 3]),
    `마디 ${WALK.nodes.length} 개 가운데 답이 된 것이 ${hits} 개, 막다른 마디가 ${deads} 개입니다. 정점 ${WALK_T} 로 끝나는 마디가 ${hits} 개라, 그래프에서 하나인 정점이 나무에서는 여러 번 나옵니다.`,
  );
}

function treeVsGraph(): string {
  const g = 전역표시(WALK_N, WALK_EDGES, WALK_S, WALK_T);
  const count4 = WALK.nodes.filter((x) => x.path.at(-1) === WALK_T).length;
  const rows = [
    ["그래프", `정점 ${WALK_N} 개`, "1 번", "—"],
    [
      "순회의 방문 나무(한 번 켠 표시를 끝까지 둔다)",
      `마디 ${g.enters} 개`,
      "1 번",
      `${g.result.length} 개`,
    ],
    [
      "상태 공간 트리",
      `마디 ${WALK.nodes.length} 개`,
      `${count4} 번`,
      `${WALK.result.length} 개`,
    ],
  ];
  return withSentence(
    md(["모양", "크기", `정점 ${WALK_T} 가 나오는 횟수`, "찾은 경로"], rows),
    `같은 그래프에서 순회는 정점마다 많아야 한 번 들어가 ${g.enters} 번으로 끝나고, 상태 공간 트리는 ${WALK.nodes.length} 번 들어갑니다.`,
  );
}

function buildAdj(): string {
  const raw: number[][] = Array.from({ length: WALK_N }, () => []);
  for (const [u, v] of WALK_EDGES) (raw[u] as number[]).push(v);
  const dedup = adjacency(WALK_N, WALK_EDGES, false);
  const sorted = adjacency(WALK_N, WALK_EDGES, true);
  const rows = raw.map((r, v) => [
    String(v),
    show(r),
    show(dedup[v] as number[]),
    show(sorted[v] as number[]),
    String((sorted[v] as number[]).length),
  ]);
  const total = sorted.reduce((a, l) => a + l.length, 0);
  const loops = WALK_EDGES.filter(([u, v]) => u === v).length;
  const changed = dedup.filter((l, v) => !same(l, sorted[v])).length;
  return withSentence(
    md(
      [
        "정점 v",
        "간선에서 모은 이웃",
        "자기 루프·중복을 뺀 뒤",
        "정렬 뒤",
        "길이",
      ],
      rows,
      [0, 4],
    ),
    `길이를 모두 더하면 ${total} 이고, 간선 ${WALK_EDGES.length} 개에서 자기 루프 ${loops} 개를 뺀 수입니다. 정렬로 차례가 바뀐 목록은 ${changed} 개입니다.`,
  );
}

function buildEnter(): string {
  const until = WALK.steps.findIndex((st) => st.hit);
  const shown = WALK.steps.slice(0, until + 1);
  const rows = shown.map((st) => [
    st.id,
    didText(st),
    show(st.path),
    showSet(marksOf(st)),
  ]);
  return withSentence(
    md(["걸음", "한 일", "path", "켜진 표시"], rows),
    `첫 경로를 담을 때까지 ${until + 1} 걸음이고, 켜진 표시가 path 안의 정점과 같은 걸음은 ${shown.filter(marksMatch).length} 개입니다.`,
  );
}

function buildLeave(): string {
  const a = WALK.steps.findIndex((st) => st.hit);
  const b = WALK.steps.map((st) => st.hit).lastIndexOf(true) + 1;
  const rows = WALK.steps
    .slice(a, b + 1)
    .map((st) => [
      st.id,
      didText(st),
      show(st.path),
      showSet(marksOf(st)),
      String(st.results.length),
    ]);
  const put = WALK.steps.filter(
    (st) => st.kind === "enter" && st.u === WALK_T,
  ).length;
  const off = WALK.steps.filter(
    (st) => st.kind === "leave" && st.popped.includes(WALK_T),
  ).length;
  return withSentence(
    md(["걸음", "한 일", "path", "켜진 표시", "담은 경로 수"], rows, [4]),
    `정점 ${WALK_T} 의 표시를 켠 것이 ${put} 번, 지운 것이 ${off} 번입니다.`,
  );
}

function buildHit(): string {
  const rows = WALK.steps
    .filter((st) => st.hit)
    .map((st) => [st.id, show(st.path), String(st.results.length)]);
  return withSentence(
    md(["걸음", "담은 순간의 path", "result 길이"], rows, [2]),
    `도착 정점에 ${rows.length} 번 들어갔고, 그때마다 이웃 목록을 읽지 않고 되돌아갔습니다.`,
  );
}

function premiseNoMark(): string {
  const dia = tryShow(() => 표시없음(DIA_N, DIA_EDGES, 0, 3).result);
  const walk = tryShow(
    () => 표시없음(WALK_N, WALK_EDGES, WALK_S, WALK_T).result,
  );
  const say = (k: string, got: string, want: string) =>
    got === want
      ? `${k}에서는 정본과 같은 답이 나옵니다.`
      : `${k}에서는 ${got} 로 멈춥니다.`;
  return withSentence(
    md(
      ["입력", "사이클", "표시 없이 따라가기", "정본"],
      [
        ["다이아몬드", "없다", dia, showAll(다이아())],
        ["전개가 쓰는 여섯 정점", "0 → 1 → 2 → 0", walk, showAll(전개())],
      ],
    ),
    `${say("다이아몬드", dia, showAll(다이아()))} ${say("전개가 쓰는 여섯 정점", walk, showAll(전개()))}`,
  );
}

function designRecursion(): string {
  const rows: string[][] = [];
  for (const v of [1_000, 100_000]) {
    try {
      const got = dfsAllPaths(v, chain(v), 0, v - 1);
      rows.push([
        comma(v),
        `경로 ${got.length} 개 · 길이 ${comma((got[0] as number[]).length)}`,
      ]);
    } catch (e) {
      rows.push([comma(v), `${(e as Error).constructor.name} 로 멈춘다`]);
    }
  }
  return md(["사슬의 정점 수", "재귀로 적은 정본"], rows, [0]);
}

/* ─────────────────── 「수행으로 알아보는 알고리즘」 ─────────────────── */

function walkInput(): string {
  return [
    `const n = ${WALK_N};`,
    "const edges: [number, number][] = [",
    `  ${WALK_EDGES.map(([u, v]) => `[${u}, ${v}]`).join(", ")},`,
    "];",
    `const source = ${WALK_S};`,
    `const target = ${WALK_T};`,
    `// 이 절이 끝나면 ${showAll(전개())} 가 나와야 한다`,
  ].join("\n");
}

function walkAdj(): string {
  const before = adjacency(WALK_N, WALK_EDGES, false);
  const after = adjacency(WALK_N, WALK_EDGES, true);
  const rows: string[][] = [["", "정렬 전", "정렬 후"]];
  for (let v = 0; v < WALK_N; v++)
    rows.push([
      `adj[${v}]`,
      show(before[v] as number[]),
      show(after[v] as number[]),
    ]);
  return columns(rows);
}

function unsortedOrder(): string {
  const a = 전개();
  const b = unsorted.dfsAllPaths(WALK_N, WALK_EDGES, WALK_S, WALK_T);
  return withSentence(
    md(
      ["이웃 목록", "결과", "사전식으로 다시 정렬한 목록"],
      [
        ["정렬한다", showAll(a), showAll(sortPaths(a))],
        ["정렬하지 않는다", showAll(b), showAll(sortPaths(b))],
      ],
    ),
    `두 결과는 ${same(a, b) ? "차례까지 같고" : "차례가 다르고"}, 사전식으로 다시 정렬한 두 목록은 ${same(sortPaths(a), sortPaths(b)) ? "같습니다" : "다릅니다"}.`,
  );
}

function unsortedTrace(): string {
  const before = adjacency(WALK_N, WALK_EDGES, false)[WALK_S] as number[];
  const after = adjacency(WALK_N, WALK_EDGES, true)[WALK_S] as number[];
  const a = 전개();
  const b = unsorted.dfsAllPaths(WALK_N, WALK_EDGES, WALK_S, WALK_T);
  return [
    columns([
      [
        "정렬하지 않는다",
        `adj[0] = ${show(before)}`,
        `먼저 ${before[0]} 로 내려간다`,
        `처음 담는 경로 ${show(b[0] ?? [])}`,
      ],
      [
        "정렬한다",
        `adj[0] = ${show(after)}`,
        `먼저 ${after[0]} 로 내려간다`,
        `처음 담는 경로 ${show(a[0] ?? [])}`,
      ],
    ]),
  ].join("\n");
}

function walkInit(): string {
  return [
    `onPath = [${Array.from({ length: WALK_N }, () => "false").join(", ")}]`,
    "path   = []",
    "result = []",
  ].join("\n");
}

function sharedArray(): string {
  const rows: [string, number[][], number[][]][] = [
    ["다이아몬드", 다이아(), noCopy.dfsAllPaths(DIA_N, DIA_EDGES, 0, 3)],
    [
      "전개가 쓰는 여섯 정점",
      전개(),
      noCopy.dfsAllPaths(WALK_N, WALK_EDGES, WALK_S, WALK_T),
    ],
  ];
  return withSentence(
    md(
      ["입력", "복사본 담기", "path 그대로 담기", "두 답"],
      rows.map(([k, a, b]) => [
        k,
        showAll(a),
        showAll(b),
        same(a, b) ? "같다" : "어긋난다",
      ]),
    ),
    rows
      .map(
        ([k, a, b]) =>
          `${k}에서 두 결과의 길이는 ${a.length}${과와(a.length)} ${b.length} 입니다.`,
      )
      .join(" "),
  );
}

/** 걸음 표의 「조건 판정」 칸. */
export function condText(st: Step): string {
  if (st.kind === "enter") {
    if (st.v < 0)
      return `walk(source) 를 부른다 · \`${st.u} === target\` 이 **거짓**`;
    return st.hit
      ? `\`onPath[${st.u}]\`${이가(st.u)} **거짓** → ③ · \`${st.u} === target\` 이 **참** → ①`
      : `\`onPath[${st.u}]\`${이가(st.u)} **거짓** → ③`;
  }
  if (st.kind === "skip") return `\`onPath[${st.v}]\`${이가(st.v)} **참** → ②`;
  const last = st.popped.at(-1) as number;
  return st.popped.length === 1
    ? `\`walk(${st.u})\`${이가(st.u)} 끝났다 → 되돌아간다`
    : `${st.popped.map((x) => `\`walk(${x})\``).join(" · ")}${이가(last)} 잇달아 끝났다 → 되돌아간다`;
}

function walkTrace(): string {
  const rows = WALK.steps.map((st) => [
    st.id,
    didText(st),
    condText(st),
    show(st.path),
    String(st.results.length),
  ]);
  const ids = (f: (st: Step) => boolean) =>
    WALK.steps.filter(f).map((st) => st.id);
  const one = ids((st) => st.hit);
  const two = ids((st) => st.kind === "skip");
  const three = ids((st) => st.kind === "enter" && st.v >= 0);
  const back = ids((st) => st.kind === "leave");
  return withSentence(
    md(["걸음", "한 일", "조건 판정", "path", "담은 경로 수"], rows, [4]),
    `① 은 ${one.join(" · ")} 에서 ${one.length} 번, ② 는 ${two.join(" · ")} 에서 ${two.length} 번, ③ 은 ${three.join(" · ")} 에서 ${three.length} 번 실행됐습니다. 되돌아간 걸음은 ${back.join(" · ")} 의 ${back.length} 개이고, walk 에 들어간 것은 출발 1 번에 ③ ${three.length} 번을 더한 ${WALK.enters} 번입니다. 반환값은 ${showAll(WALK.result)} 입니다.`,
  );
}

function walkResult(): string {
  const more: [number, Edge[], number, number][] = [
    [
      4,
      [
        [0, 1],
        [0, 2],
        [1, 2],
        [1, 3],
        [2, 3],
      ],
      0,
      3,
    ],
    [
      3,
      [
        [0, 1],
        [1, 2],
        [2, 0],
        [0, 2],
      ],
      0,
      2,
    ],
    [3, [[0, 1]], 0, 2],
    [
      3,
      [
        [0, 1],
        [1, 2],
      ],
      1,
      1,
    ],
    [1, [], 0, 0],
  ];
  const cases: { call: string; got: number[][] }[] = [
    {
      call: `dfsAllPaths(${WALK_N}, ${edgeList(WALK_EDGES)}, ${WALK_S}, ${WALK_T})`,
      got: 전개(),
    },
    {
      call: `dfsAllPaths(${DIA_N}, ${edgeList(DIA_EDGES)}, 0, 3)`,
      got: 다이아(),
    },
    ...more.map(([n, e, s, t]) => ({
      call: `dfsAllPaths(${n}, ${edgeList(e)}, ${s}, ${t})`,
      got: dfsAllPaths(n, e, s, t),
    })),
  ];
  return [columns(cases.map((c) => [c.call, "→", showAll(c.got)]))].join("\n");
}

/* ─────────────────── 「알아 두면 좋은 개념」 ─────────────────── */

function relatedOutput(): string {
  const inputs: [string, number, Edge[], number, number][] = [
    ["전개가 쓰는 그래프", WALK_N, WALK_EDGES, WALK_S, WALK_T],
    ...[3, 7].map((m): [string, number, Edge[], number, number] => {
      const g = grid(m);
      return [`${m}×${m} 격자`, g.n, g.edges, 0, g.t];
    }),
  ];
  const rows = inputs.map(([k, n, e, s, t]) => {
    const r = dfsAllPaths(n, e, s, t);
    const L = r.reduce((a, p) => a + p.length, 0);
    return [k, comma(n), comma(e.length), comma(r.length), comma(L)];
  });
  return md(
    ["그래프", "정점 수", "간선 수", "경로 수 N", "출력에 적는 정점 번호 수"],
    rows,
    [1, 2, 3, 4],
  );
}

/* ─────────────────── 파트 2 ─────────────────── */

function fitShortest(): string {
  const g = grid(7);
  const r = dfsAllPaths(g.n, g.edges, 0, g.t);
  const lens = r.map((p) => p.length);
  const L = lens.reduce((a, b) => a + b, 0);
  const min = Math.min(...lens);
  const max = Math.max(...lens);
  return withSentence(
    md(
      ["질문", "답의 줄 수", "적는 정점 번호 수"],
      [
        ["모든 단순 경로", comma(r.length), comma(L)],
        ["가장 짧은 경로 하나", "1", comma(min)],
      ],
      [1, 2],
    ),
    `7×7 격자에서 가장 짧은 경로와 가장 긴 경로가 ${min === max ? `모두 정점 ${min} 개라, 모든 단순 경로가 가장 짧은 경로이기도 합니다` : `정점 ${min} 개와 ${max} 개입니다`}.`,
  );
}

function altTable(): string {
  const a = ALT_CASES["이 가이드의 절차"]();
  const b = ALT_CASES["도달 가능성 가지치기"]();
  const cols = [
    "격자 · 방문 노드",
    "격자 · 이웃 검사",
    "덫 · 방문 노드",
    "덫 · 이웃 검사",
    "격자 · 할당 칸",
  ];
  const row = (k: string, r: Record<string, number>) => [
    k,
    ...cols.map((c) => comma(r[c] as number)),
  ];
  const g = grid(M);
  const p = trap(K);
  return withSentence(
    md(
      ["설계", ...cols],
      [row("이 가이드의 절차", a), row("도달 가능성 가지치기", b)],
      [1, 2, 3, 4, 5],
    ),
    `격자는 ${M}×${M}(정점 ${g.n} 개 · 간선 ${g.edges.length} 개), 덫 그래프는 막다른 무리 k = ${K}(정점 ${p.n} 개 · 간선 ${p.edges.length} 개)입니다. 전개 입력에서는 방문 노드가 ${a["전개 입력 · 방문 노드"]} 대 ${b["전개 입력 · 방문 노드"]} 입니다.`,
  );
}

function mathVerify(): string {
  const L = WALK.result.reduce((a, p) => a + p.length, 0);
  return withSentence(
    md(
      ["이름", "정의", "전개 입력에서"],
      [
        ["N", "단순 경로의 수", String(WALK.result.length)],
        [
          "L",
          "경로 길이의 합, 곧 출력에 적는 정점 번호의 개수",
          `${WALK.result.map((p) => p.length).join(" + ")} = ${L}`,
        ],
        ["R", "walk 에 진입한 횟수", String(WALK.enters)],
      ],
    ),
    `R 에서 N 을 뺀 ${WALK.enters - WALK.result.length} 번은 답이 되지 못한 부분 경로에 들어간 횟수입니다.`,
  );
}

function mathN5(): string {
  const n = 5;
  const r = dfsAllPaths(n, complete(n), 0, n - 1);
  const shown = [
    [0, 4],
    [0, 2, 4],
    [0, 1, 3, 4],
    [0, 3, 1, 4],
  ];
  for (const p of shown)
    if (!r.some((q) => same(q, p))) throw new Error(`${show(p)} 가 답에 없다`);
  const rows = shown.map((p) => [
    p.join(" → "),
    p.length === 2 ? "( )" : `(${p.slice(1, -1).join(", ")})`,
  ]);
  return withSentence(
    md(["경로", "가운데 정점의 나열"], rows),
    `정점 ${n} 개 완전 방향 그래프에서 정본이 낸 경로는 ${r.length} 개이고, 위 넷은 그중 일부입니다.`,
  );
}

function mathN6(): string {
  const m = 4;
  const fact = (x: number): number => (x <= 1 ? 1 : x * fact(x - 1));
  const rows: string[][] = [];
  let total = 0;
  for (let k = 0; k <= m; k++) {
    const term = fact(m) / fact(m - k);
    total += term;
    rows.push([String(k), `${m}!/${m - k}!`, String(term)]);
  }
  const run = dfsAllPaths(6, complete(6), 0, 5).length;
  return withSentence(
    md(["중간 정점 수 k", "항", "값"], rows, [0, 2]),
    `합은 ${total} 이고, 정점 6 개 완전 방향 그래프에 정본을 실행한 경로 수 ${run}${과와(run)} ${total === run ? "같습니다" : "다릅니다"}.`,
  );
}

function mathFloor(): string {
  const rows = [3, 4, 5, 6, 7, 8].map((n) => {
    const count = Number(pathCount(n));
    let fact = 1;
    for (let i = 2; i <= n - 2; i++) fact *= i;
    const real = Math.E * fact;
    return [
      String(n),
      comma(count),
      real.toFixed(3),
      (real - count).toFixed(3),
    ];
  });
  return md(["n", "N(n)", "e·(n−2)!", "차이"], rows, [0, 1, 2, 3]);
}

function mathTail(): string {
  const rows = [2, 3, 4, 6].map((n) => {
    const v = n / ((n - 1) * (n - 1));
    return [
      String(n),
      `${n} / ${(n - 1) * (n - 1)}`,
      v.toFixed(3),
      v <= 1 ? "그렇다" : "아니다",
    ];
  });
  return md(["n", "n/(n−1)²", "값", "1 이하 여부"], rows, [0, 2]);
}

function mathCode(): string {
  const rows = [4, 5, 6, 7, 8].map((n) => {
    const f = pathCount(n);
    const run = dfsAllPaths(n, complete(n), 0, n - 1).length;
    if (BigInt(run) !== f)
      throw new Error(`n=${n} 에서 식 ${f} 과 실행 ${run} 이 다르다`);
    return [`pathCount(${n})`, "→", `${f}n`, `정본 실행 ${comma(run)} 개`];
  });
  return columns(rows);
}

function mathComplete(): string {
  return md(
    ["정점 n", "⌊e·(n−2)!⌋", "경로 수 10⁴ 이하 여부"],
    [4, 5, 6, 7, 8, 9, 10].map((n) => {
      const v = 나열수(n - 2);
      return [comma(n), comma(v), v <= 10_000n ? "그렇다" : "아니다"];
    }),
    [0, 1],
  );
}

function mathGridSeq(): string {
  const m = 2;
  const g = grid(m);
  const r = dfsAllPaths(g.n, g.edges, 0, g.t);
  const seqs = r.map((p) =>
    p
      .slice(1)
      .map((x, i) => (x - (p[i] as number) === 1 ? "R" : "D"))
      .join(""),
  );
  const c = 이항(4, 2);
  return withSentence(
    md(
      ["경로", "이동의 나열"],
      r.map((p, i) => [p.join(" → "), seqs[i] as string]),
    ),
    `정본이 낸 경로는 ${r.length} 개이고, C(4, 2) = ${c}${과와(c)} ${BigInt(r.length) === c ? "같습니다" : "다릅니다"}. R 은 오른쪽으로, D 는 아래로 한 칸입니다.`,
  );
}

function mathGrid(): string {
  return md(
    ["격자 m", "정점 수 (m+1)²", "C(2m, m)", "경로 수 10⁴ 이하 여부"],
    [1, 2, 3, 4, 5, 6, 7, 8].map((m) => {
      const v = 이항(2 * m, m);
      if (m <= 5) {
        const g = grid(m);
        const run = dfsAllPaths(g.n, g.edges, 0, g.t).length;
        if (BigInt(run) !== v)
          throw new Error(`m=${m} 에서 식과 실행이 다르다`);
      }
      return [
        comma(m),
        comma((m + 1) * (m + 1)),
        comma(v),
        v <= 10_000n ? "그렇다" : "아니다",
      ];
    }),
    [0, 1, 2],
  );
}

/* ─────────────────── 「불변식」 ─────────────────── */

function invariantT5T6(): string {
  const i = WALK.steps.findIndex((st) => st.hit);
  const pick = [i - 2, i, i + 1, i + 2].map((k) => WALK.steps[k] as Step);
  const rows = pick.map((st) => [
    st.id,
    didText(st),
    show(st.path),
    showSet(marksOf(st)),
  ]);
  const before = WALK.steps[i - 1] as Step;
  const hit = WALK.steps[i] as Step;
  const after = WALK.steps[i + 1] as Step;
  return withSentence(
    md(["걸음", "한 일", "path", "켜진 표시"], rows),
    `${hit.id} 에 들어가기 직전(${before.id} 직후)의 path 는 ${show(before.path)} 이고, ${after.id} 에서 되돌아온 직후의 path 도 ${show(after.path)} 로 ${same(before.path, after.path) ? "같습니다" : "다릅니다"}.`,
  );
}

/**
 * 불변식 확인에 쓰는 무작위 입력. 출발 정점은 첫 간선의 시작 정점, 도착 정점은 마지막 간선의 끝 정점이다.
 */
const RAND = { n: 8, m: 32, seed: 20260930 } as const;
const RAND_EDGES = randomGraph(RAND.n, RAND.m, RAND.seed);

/** 모든 반환 지점에서 두 문장이 참인지 여러 입력으로 확인한다. */
function invariantCheck(): string {
  const t5 = trap(5);
  const inputs: [string, number, Edge[], number, number][] = [
    ["전개가 쓰는 여섯 정점", WALK_N, WALK_EDGES, WALK_S, WALK_T],
    ["다이아몬드", DIA_N, DIA_EDGES, 0, 3],
    ["덫 그래프 k = 5", t5.n, t5.edges, 0, t5.t],
    [
      `무작위 V = ${RAND.n} · E = ${RAND.m} (시드 ${RAND.seed})`,
      RAND.n,
      RAND_EDGES,
      (RAND_EDGES[0] as Edge)[0],
      (RAND_EDGES.at(-1) as Edge)[1],
    ],
  ];
  let total = 0;
  const rows = inputs.map(([k, n, e, s, t]) => {
    const adj = adjacency(n, e);
    const onPath: boolean[] = Array.from({ length: n }, () => false);
    const path: number[] = [];
    const result: number[][] = [];
    let returns = 0;
    let badReturn = 0;
    let badSet = 0;
    const setOk = () =>
      same(
        onPath.flatMap((b, i) => (b ? [i] : [])),
        [...path].sort((a, b) => a - b),
      );
    const state = () => JSON.stringify([path, onPath]);
    const walk = (u: number): void => {
      onPath[u] = true;
      path.push(u);
      if (!setOk()) badSet++;
      if (u === t) result.push(path.slice());
      else
        for (const v of adj[u] as number[]) {
          if (onPath[v] === true) continue;
          const before = state();
          walk(v);
          returns++;
          if (state() !== before) badReturn++;
          if (!setOk()) badSet++;
        }
      onPath[u] = false;
      path.pop();
    };
    const before = state();
    walk(s);
    returns++;
    if (state() !== before) badReturn++;
    if (!same(result, dfsAllPaths(n, e, s, t)))
      throw new Error(`${k} 에서 답이 정본과 다르다`);
    total += returns;
    return [
      k,
      comma(returns),
      String(badReturn),
      String(badSet),
      comma(result.length),
    ];
  });
  return withSentence(
    md(
      [
        "입력",
        "확인한 반환",
        "직전과 다른 반환",
        "표시와 path 가 다른 시점",
        "경로 수",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    `네 입력의 반환 ${comma(total)} 번에서 두 문장이 깨진 시점은 0 개입니다.`,
  );
}

function invariantEdges(): string {
  const cases: [string, number, Edge[], number, number, string][] = [
    ["최소 입력", 1, [], 0, 0, "진입하자마자 도착 정점이라 복사 하나로 끝난다"],
    [
      "출발과 도착이 같다",
      3,
      [
        [0, 1],
        [1, 2],
      ],
      1,
      1,
      "이웃 목록을 한 번도 읽지 않는다",
    ],
    [
      "경로가 없다",
      3,
      [[0, 1]],
      0,
      2,
      "도착 정점에서 담는 갈래가 한 번도 실행되지 않는다",
    ],
    [
      "간선 방향이 반대다",
      2,
      [[1, 0]],
      0,
      1,
      "adj[0] 이 비어 있어 바로 되돌아간다",
    ],
    [
      "자기 루프",
      2,
      [
        [0, 0],
        [0, 1],
      ],
      0,
      1,
      "이웃 목록을 만들 때 u === v 로 빠진다",
    ],
    [
      "중복 간선",
      3,
      [
        [0, 1],
        [0, 1],
        [1, 2],
      ],
      0,
      2,
      "같은 이웃이 모임에 한 번만 들어간다",
    ],
    [
      "사이클",
      3,
      [
        [0, 1],
        [1, 2],
        [2, 0],
        [0, 2],
      ],
      0,
      2,
      "경로 안 이웃을 건너뛰는 갈래가 2 → 0 을 막는다",
    ],
  ];
  const rows = cases.map(([k, n, e, s, t, where]) => {
    const r = traced(n, e, s, t);
    return [
      k,
      `\`dfsAllPaths(${n}, ${edgeList(e)}, ${s}, ${t})\``,
      where,
      showAll(r.result),
      String(r.enters),
    ];
  });
  return md(["입력", "호출", "처리되는 자리", "결과", "진입 횟수"], rows, [4]);
}

function mutantNoUnmark(): string {
  const inputs: [string, number, Edge[], number][] = [
    ["전개가 쓰는 여섯 정점", WALK_N, WALK_EDGES, WALK_T],
    ["다이아몬드", DIA_N, DIA_EDGES, 3],
    ["한 줄로 이은 네 정점", 4, chain(4), 3],
  ];
  return md(
    ["입력", "표시 지움(정본)", "표시 남김", "두 답"],
    inputs.map(([k, n, e, t]) => {
      const a = dfsAllPaths(n, e, 0, t);
      const b = noUnmark.dfsAllPaths(n, e, 0, t);
      return [k, showAll(a), showAll(b), same(a, b) ? "같다" : "어긋난다"];
    }),
  );
}

function mutantNoUnmarkTrace(): string {
  const r = 전역표시(WALK_N, WALK_EDGES, WALK_S, WALK_T);
  const rows = r.log.map((e) => [
    e.did,
    showSet(e.marks),
    show(e.path),
    String(e.results),
  ]);
  return withSentence(
    md(["한 일", "켜진 표시", "path", "담은 경로 수"], rows, [3]),
    `표시가 막은 이웃은 차례대로 ${r.blocked.join(" · ")} 이고, 진입은 ${r.enters} 번으로 끝납니다. 정본은 같은 입력에서 ${WALK.enters} 번 진입합니다.`,
  );
}

/* ─────────────────── 「비용 계산」 ─────────────────── */

function perfCount(): string {
  const enters = WALK.steps.filter((st) => st.kind === "enter");
  const rows = enters.map((st) => [
    st.id,
    String(st.u),
    st.hit ? "①" : "이웃 목록을 읽는다",
    st.hit ? "0" : String((WALK.adj[st.u] as number[]).length),
  ]);
  const sum = enters
    .filter((st) => !st.hit)
    .reduce((a, st) => a + (WALK.adj[st.u] as number[]).length, 0);
  if (sum !== WALK.checks) throw new Error("이웃 검사 수가 기록과 다르다");
  return withSentence(
    md(["걸음", "진입한 정점", "한 일", "읽은 이웃 수"], rows, [3]),
    `진입 ${WALK.enters} 번에 이웃 목록에서 읽은 원소는 ${sum} 개입니다.`,
  );
}

function gridCount(): string {
  const rows = [2, 3, 4, 5].map((m) => {
    const g = grid(m);
    const r = traced(g.n, g.edges, 0, g.t);
    return [
      comma(m),
      comma(g.n),
      comma(r.result.length),
      comma(r.enters),
      comma(r.checks),
    ];
  });
  return md(
    ["격자 m", "정점 수", "경로 수", "방문 노드", "이웃 검사"],
    rows,
    [0, 1, 2, 3, 4],
  );
}

function perfSpread(): string {
  const g = grid(M);
  const p = trap(K);
  const a = traced(g.n, g.edges, 0, g.t);
  const b = traced(p.n, p.edges, 0, p.t);
  return withSentence(
    md(
      ["그래프", "정점 수", "간선 수", "경로 수", "방문 노드"],
      [
        [
          `${M}×${M} 격자`,
          comma(g.n),
          comma(g.edges.length),
          comma(a.result.length),
          comma(a.enters),
        ],
        [
          `덫 그래프 k = ${K}`,
          comma(p.n),
          comma(p.edges.length),
          comma(b.result.length),
          comma(b.enters),
        ],
      ],
      [1, 2, 3, 4],
    ),
    `간선 수는 ${g.edges.length}${과와(g.edges.length)} ${p.edges.length} 로 비슷한데 방문 노드는 ${(b.enters / a.enters).toFixed(1)} 배 갈립니다.`,
  );
}

function worstInput(): string {
  const rows = [6, 7, 8, 9].map((k) => {
    const g = trap(k);
    const r = traced(g.n, g.edges, 0, g.t);
    return [
      comma(k),
      comma(g.n),
      comma(g.edges.length),
      comma(r.result.length),
      comma(r.enters),
    ];
  });
  return md(
    ["막다른 무리 k", "정점 수", "간선 수", "경로 수", "방문 노드"],
    rows,
    [0, 1, 2, 3, 4],
  );
}

/* ─────────────────── 「스스로 점검하기」 ─────────────────── */

function selfcheckT6(): string {
  const st = WALK.steps[WALK.steps.findIndex((x) => x.hit) + 1] as Step;
  return [
    columns([
      [st.id, didText(st), `path ${show(st.path)}`],
      ["", "← 이 빼기를 안 하면?", ""],
    ]),
  ].join("\n");
}

function selfcheckNoPop(): string {
  const r = 경로안뺌(WALK_N, WALK_EDGES, WALK_S, WALK_T);
  const rows = r.log.map((e, i) => [
    String(i + 1),
    e.did,
    show(e.path),
    String(e.results),
  ]);
  const want = showAll(전개());
  return withSentence(
    md(["진입", "한 일", "path", "담은 경로 수"], rows, [0, 3]),
    `결과는 ${showAll(r.result)} 이고, 정본의 답 ${want}${과와(said(want))} ${same(r.result, 전개()) ? "같습니다" : "다릅니다"}.`,
  );
}

export const PROOFS: Record<string, () => string> = {
  "concept-paths": conceptPaths,
  "concept-lex": conceptLex,
  "concept-unmark": conceptUnmark,
  "naive-small": naiveSmall,
  "naive-scale": naiveScale,
  "follow-vs-generate": followVsGenerate,
  "grow-no-mark": growNoMark,
  "global-mark": globalMark,
  "global-mark-trace": globalMarkTrace,
  "unmark-placement": unmarkPlacement,
  "tree-read": treeRead,
  "tree-nodes": treeNodes,
  "tree-vs-graph": treeVsGraph,
  "build-adj": buildAdj,
  "build-enter": buildEnter,
  "build-leave": buildLeave,
  "build-hit": buildHit,
  "premise-no-mark": premiseNoMark,
  "design-recursion": designRecursion,
  "walk-input": walkInput,
  "walk-adj": walkAdj,
  "unsorted-order": unsortedOrder,
  "unsorted-trace": unsortedTrace,
  "walk-init": walkInit,
  "shared-array": sharedArray,
  "walk-trace": walkTrace,
  "walk-result": walkResult,
  "related-output": relatedOutput,
  "fit-shortest": fitShortest,
  "alt-table": altTable,
  "math-verify": mathVerify,
  "math-n5": mathN5,
  "math-n6": mathN6,
  "math-floor": mathFloor,
  "math-tail": mathTail,
  "math-code": mathCode,
  "math-complete": mathComplete,
  "math-grid-seq": mathGridSeq,
  "math-grid": mathGrid,
  "invariant-t5t6": invariantT5T6,
  "invariant-check": invariantCheck,
  "invariant-edges": invariantEdges,
  "mutant-no-unmark": mutantNoUnmark,
  "mutant-no-unmark-trace": mutantNoUnmarkTrace,
  "perf-count": perfCount,
  "grid-count": gridCount,
  "perf-spread": perfSpread,
  "worst-input": worstInput,
  "selfcheck-t6": selfcheckT6,
  "selfcheck-nopop": selfcheckNoPop,
};
