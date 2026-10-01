/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/connectedComponents/connectedComponents-guide.md
 *
 * **세는 자리를 덧붙인 사본이 몇 있다**(`traced` · `restartCounts` · `shareCounts` · `boolRun` ·
 * `stats` · `tracedNoSkip`). 정본은 몇 번 셌는지를 내보내지 않으므로, 세는 자리만 덧붙인 사본이
 * 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** — 사본은 부를 때마다
 * 자기 답을 정본(또는 정본에서 기계로 만든 변이)의 답과 맞대고, 다르면 던진다.
 *
 * `discoveryOrder` 만 예외다 — 오해를 그대로 구현한 것이라 정본과 다른 답을 내는 것이 그 일이다.
 * 그 자리에서 옳은 답은 정본이 낸다. 그림 사이드카(`-guide.fig.tsx`)와 걸음 재생 패널도 여기의
 * `traced` 가 낸 기록을 쓴다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  cases as ALT_CASES,
  RING_EDGES,
  RING_N,
  RING_SIZE,
} from "./connectedComponents-guide.alt.ts";
import { connectedComponents } from "./connectedComponents-guide.ref.ts";

export type Edge = [number, number];

/** 본문 전개가 쓰는 고정 입력 — 삼각형 {0, 4, 2} · 간선 하나 {1, 3} · 외딴 정점 {5}. */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 4],
  [4, 2],
  [2, 0],
  [1, 3],
];

/** 같은 그래프에 자기 루프 `[1, 1]` 과 중복 간선 `[0, 4]` 를 더한 것. */
const DIRTY_EDGES: Edge[] = [...WALK_EDGES, [1, 1], [0, 4]];

/** 같은 그래프의 간선 순서만 바꾼 것 — 만나는 순서가 간선 순서를 따른다는 것을 보인다. */
const REORDERED_EDGES: Edge[] = [
  [2, 0],
  [0, 4],
  [4, 2],
  [1, 3],
];

/** 사슬 0-1-2-3. 변이가 **답을 안 바꾸는** 입력이라 함께 싣는다. */
const CHAIN4: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
];

/* ────────────────────────── 표기 ────────────────────────── */

/** `[0, 1, 0, 1, 0, 2]` 꼴. */
export const show = (xs: readonly (number | boolean)[]): string =>
  `[${xs.join(", ")}]`;

/** `[[0, 2, 4], [1, 3], [5]]` 꼴 — 본문 표기와 같다. */
export const showGroups = (xs: readonly (readonly number[])[]): string =>
  `[${xs.map((c) => show(c)).join(", ")}]`;

/** `19,999,800,000` 꼴. */
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

/** 한글은 고정폭 화면에서 두 칸을 먹는다 — 등폭 블록의 칸 맞춤. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 등폭 블록 — 열마다 가장 넓은 칸에 맞춰 세 칸씩 띄운다. */
function columns(rows: string[][]): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const widths = Array.from({ length: cols }, (_, c) =>
    Math.max(...rows.map((r) => width(r[c] ?? ""))),
  );
  return rows
    .map((r) =>
      r
        .map((cell, c) => pad(cell, widths[c] ?? 0))
        .join("   ")
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

/** 원문자의 읽는 값 — 조사를 고를 때 쓴다(① 은 · ② 는). */
const CIRCLED: Record<string, string> = {
  "①": "1",
  "②": "2",
  "③": "3",
  "④": "4",
};

/** 「이라 / 라」 — 값의 받침에 따라. */
const josaIra = (v: number): string =>
  이가(String(v)) === " 이" ? " 이라" : "라";

const sameGroups = (
  a: readonly (readonly number[])[],
  b: readonly (readonly number[])[],
): boolean => showGroups(a) === showGroups(b);

/* ────────────────────── 그래프 만들기 ────────────────────── */

export function adjacency(n: number, edges: readonly Edge[]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  return adj;
}

/** 정점 `v` 개를 한 줄로 이은 사슬. 성분 하나, 간선 `v − 1` 개. */
function chain(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < v - 1; i++) edges.push([i, i + 1]);
  return edges;
}

/** 정점 `v` 개를 크기가 같은 성분 `k` 개로 가른다. 각 성분은 사슬이다. */
function chains(v: number, k: number): Edge[] {
  const size = v / k;
  const edges: Edge[] = [];
  for (let c = 0; c < k; c++) {
    for (let j = 0; j < size - 1; j++) {
      edges.push([c * size + j, c * size + j + 1]);
    }
  }
  return edges;
}

/** 정점 0 이 나머지 전부와 이어진 별 모양. 간선 `v − 1` 개. */
export function star(v: number): Edge[] {
  return Array.from({ length: v - 1 }, (_, i) => [0, i + 1] as Edge);
}

/** 정점 `v` 개를 고리 하나로 이은 것. 간선 `v` 개. */
export function ring(v: number): Edge[] {
  return Array.from({ length: v }, (_, i) => [i, (i + 1) % v] as Edge);
}

/** 시드가 정해진 선형 합동 생성기 — 실행마다 같은 그래프가 나온다. */
function randomGraph(v: number, e: number, seed: number): Edge[] {
  let x = seed >>> 0;
  const next = (): number => {
    x = (Math.imul(x, 1_103_515_245) + 12_345) >>> 0;
    return x;
  };
  return Array.from({ length: e }, () => [next() % v, next() % v] as Edge);
}

/* ───────────────────── 정본과 같은 절차의 기록 ───────────────────── */

/** 걸음 하나에서 일어난 일. */
export type Event =
  | { readonly kind: "init" }
  /** ① 새 성분의 시작점. */
  | { readonly kind: "start"; readonly s: number }
  /** ② 이미 성분 번호가 있는 시작점. */
  | { readonly kind: "skip"; readonly s: number }
  /** 이웃 검사 — `fresh` 면 ③ 처음 만나는 이웃, 아니면 ④ 이미 번호가 있는 이웃. */
  | {
      readonly kind: "check";
      readonly s: number;
      readonly node: number;
      readonly next: number;
      readonly fresh: boolean;
    }
  | { readonly kind: "collect" };

/** 걸음 하나 — 그 걸음이 끝난 뒤의 상태. */
export interface Step {
  readonly event: Event;
  readonly comp: readonly number[];
  /** 지금 성분의 큐 배열 전체(이미 꺼낸 칸 포함). 탐색 밖이면 빈 배열. */
  readonly queue: readonly number[];
  /** 큐에서 다음에 읽을 자리. 꺼낸 정점 바로 다음이다. */
  readonly head: number;
  /** 이 걸음이 끝난 뒤의 `count`(지금 번호를 붙이는 성분의 번호, 또는 지금까지 만든 성분 수). */
  readonly count: number;
}

export interface Run {
  readonly adj: readonly (readonly number[])[];
  readonly steps: readonly Step[];
  readonly comp: readonly number[];
  readonly out: readonly (readonly number[])[];
  /** 정점마다 번호가 적힌 걸음의 차례(0 부터). */
  readonly writtenAt: readonly (number | null)[];
  /** 정점마다 큐에 들어간 걸음의 차례. */
  readonly pushedAt: readonly (number | null)[];
  /** 정점마다 큐에 들어간 횟수. */
  readonly pushes: readonly number[];
}

/**
 * 정본과 같은 절차에 기록만 덧붙인 사본. 부를 때마다 답을 정본과 맞댄다 — 다르면 이 기록은
 * 다른 절차의 것이다.
 */
export function traced(n: number, edges: readonly Edge[]): Run {
  const adj = adjacency(n, edges);
  const comp: number[] = Array.from({ length: n }, () => -1);
  let count = 0;
  const steps: Step[] = [];
  const writtenAt: (number | null)[] = Array.from({ length: n }, () => null);
  const pushedAt: (number | null)[] = Array.from({ length: n }, () => null);
  const pushes: number[] = Array.from({ length: n }, () => 0);
  const record = (event: Event, queue: number[], head: number) =>
    steps.push({
      event,
      comp: comp.slice(),
      queue: queue.slice(),
      head,
      count,
    });
  record({ kind: "init" }, [], 0);
  for (let s = 0; s < n; s++) {
    if (comp[s] !== -1) {
      record({ kind: "skip", s }, [], 0);
      continue;
    }
    comp[s] = count;
    const queue: number[] = [s];
    let head = 0;
    writtenAt[s] = steps.length;
    pushedAt[s] = steps.length;
    pushes[s] = (pushes[s] as number) + 1;
    record({ kind: "start", s }, queue, head);
    while (head < queue.length) {
      const node = queue[head++] as number;
      for (const next of adj[node] as number[]) {
        const fresh = (comp[next] as number) === -1;
        if (fresh) {
          comp[next] = count;
          queue.push(next);
          writtenAt[next] = steps.length;
          pushedAt[next] = steps.length;
          pushes[next] = (pushes[next] as number) + 1;
        }
        record({ kind: "check", s, node, next, fresh }, queue, head);
      }
    }
    count++;
  }
  const out: number[][] = Array.from({ length: count }, () => []);
  for (let v = 0; v < n; v++) (out[comp[v] as number] as number[]).push(v);
  record({ kind: "collect" }, [], 0);
  const want = connectedComponents(n, edges as Edge[]);
  if (!sameGroups(out, want)) {
    throw new Error(
      `기록 사본이 정본과 다른 답을 냈다 — ${showGroups(out)} ≠ ${showGroups(want)}`,
    );
  }
  return { adj, steps, comp, out, writtenAt, pushedAt, pushes };
}

/** 본문 전개의 기록. 걸음 번호는 T1 = 시작, 그 뒤 사건 하나가 걸음 하나, 마지막 = 담기다. */
export const WALK = traced(WALK_N, WALK_EDGES);
/** 걸음 차례 i(0 부터)의 걸음 번호. */
export const stepOf = (i: number): string => `T${i + 1}`;

/** 걸음의 큐에서 아직 안 꺼낸 부분. */
export const pending = (st: Step): number[] => st.queue.slice(st.head);

/** 갈래 라벨 — 정본 주석의 원문자와 같다. */
export function branchOf(e: Event): string {
  if (e.kind === "start") return "①";
  if (e.kind === "skip") return "②";
  if (e.kind === "check") return e.fresh ? "③" : "④";
  return "—";
}

/** 시작점 `s` 의 탐색에 속한 걸음 차례들(시작 걸음과 그 탐색의 이웃 검사). */
export function searchSteps(s: number): number[] {
  return WALK.steps.flatMap((st, i) =>
    (st.event.kind === "start" || st.event.kind === "check") && st.event.s === s
      ? [i]
      : [],
  );
}

/** 바깥 반복의 걸음들 — 시작점 s 마다 그 시작점을 본 걸음과, ① 이면 그 탐색이 번호를 적은 정점. */
export interface Outer {
  readonly s: number;
  /** 바깥 반복이 s 를 볼 때 읽은 `comp[s]`. */
  readonly read: number;
  readonly at: number;
  readonly branch: string;
  /** ① 이면 이 탐색이 번호를 적은 정점(적은 차례대로). */
  readonly joined: readonly number[];
  /** 이 시작점의 일이 끝난 뒤의 `comp`. */
  readonly compAfter: readonly number[];
}

export const OUTER: Outer[] = WALK.steps.flatMap((st, i) => {
  const e = st.event;
  if (e.kind !== "start" && e.kind !== "skip") return [];
  const before = (WALK.steps[i - 1] as Step).comp;
  const mine = e.kind === "start" ? searchSteps(e.s) : [i];
  const joined =
    e.kind === "start"
      ? mine.flatMap((j) => {
          const x = (WALK.steps[j] as Step).event;
          if (x.kind === "start") return [x.s];
          if (x.kind === "check" && x.fresh) return [x.next];
          return [];
        })
      : [];
  return [
    {
      s: e.s,
      read: before[e.s] as number,
      at: i,
      branch: branchOf(e),
      joined,
      compAfter: (WALK.steps[mine.at(-1) as number] as Step).comp,
    },
  ];
});

/** 탐색이 만든 숲 — ③ 에서 쓴 간선들. */
export const FOREST: Edge[] = WALK.steps.flatMap((st) =>
  st.event.kind === "check" && st.event.fresh
    ? [[st.event.node, st.event.next] as Edge]
    : [],
);

/* ───────────────────── 비교할 절차들 — 세는 사본 ───────────────────── */

/**
 * 가장 단순한 방법 — **정점마다** 도달 가능한 정점을 새로 모으고, 방문 표시를 그때마다 새로
 * 만든다. 같은 모임이 성분 크기만큼 중복으로 나오므로 마지막에 중복을 지운다.
 */
function restartCounts(n: number, edges: readonly Edge[]) {
  const adj = adjacency(n, edges);
  let initCells = 0;
  let touches = 0;
  const bags: number[][] = [];
  for (let s = 0; s < n; s++) {
    const seen = Array.from({ length: n }, () => false);
    initCells += n;
    seen[s] = true;
    const queue = [s];
    let head = 0;
    while (head < queue.length) {
      const node = queue[head++] as number;
      for (const next of adj[node] as number[]) {
        touches++;
        if (seen[next] === true) continue;
        seen[next] = true;
        queue.push(next);
      }
    }
    bags.push(queue);
  }
  const keys = bags.map((b) =>
    b
      .slice()
      .sort((a, c) => a - c)
      .join(","),
  );
  const unique = [...new Set(keys)];
  const groups = unique
    .map((k) => k.split(",").map(Number))
    .sort((a, b) => (a[0] as number) - (b[0] as number));
  const want = connectedComponents(n, edges as Edge[]);
  if (!sameGroups(groups, want)) {
    throw new Error("정점마다 새로 탐색하는 방법이 정본과 다른 답을 냈다");
  }
  return { initCells, touches, bags, keys, groups: unique.length };
}

/** 정본과 같은 절차. 세는 것만 덧붙였다. */
function shareCounts(n: number, edges: readonly Edge[]) {
  const adj = adjacency(n, edges);
  const comp = Array.from({ length: n }, () => -1);
  let count = 0;
  let scans = 0;
  let touches = 0;
  let pushes = 0;
  for (let s = 0; s < n; s++) {
    scans++;
    if (comp[s] !== -1) continue;
    comp[s] = count;
    const queue = [s];
    pushes++;
    let head = 0;
    while (head < queue.length) {
      const node = queue[head++] as number;
      for (const next of adj[node] as number[]) {
        touches++;
        if ((comp[next] as number) !== -1) continue;
        comp[next] = count;
        queue.push(next);
        pushes++;
      }
    }
    count++;
  }
  if (count !== connectedComponents(n, edges as Edge[]).length) {
    throw new Error("세는 사본의 성분 수가 정본과 다르다");
  }
  return { initCells: n, scans, touches, pushes, groups: count };
}

/**
 * 방문 표시를 **참·거짓 한 벌**로 성분 사이에 유지한 사본. 무리는 탐색마다 만난 순서로 모은
 * 목록으로만 남는다.
 */
function boolRun(n: number, edges: readonly Edge[]) {
  const adj = adjacency(n, edges);
  const seen = Array.from({ length: n }, () => false);
  const lists: number[][] = [];
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    seen[s] = true;
    const queue = [s];
    let head = 0;
    while (head < queue.length) {
      const node = queue[head++] as number;
      for (const next of adj[node] as number[]) {
        if (seen[next]) continue;
        seen[next] = true;
        queue.push(next);
      }
    }
    lists.push(queue);
  }
  const sorted = lists.map((l) => l.slice().sort((a, b) => a - b));
  const want = connectedComponents(n, edges as Edge[]);
  if (!sameGroups(sorted, want)) {
    throw new Error("참·거짓 표 사본이 정렬한 뒤에도 정본과 다르다");
  }
  return { seen, lists, sorted };
}

/**
 * 오해를 그대로 구현한 사본 — 성분 안의 정점을 **만나는 순서대로** 담는다. 정본은 마지막에
 * 정점 번호 오름차순으로 한 번 더 통과하는데, 그 통과를 빼면 이 모양이 된다.
 */
function discoveryOrder(n: number, edges: readonly Edge[]): number[][] {
  const adj = adjacency(n, edges);
  const comp = Array.from({ length: n }, () => -1);
  const out: number[][] = [];
  for (let s = 0; s < n; s++) {
    if (comp[s] !== -1) continue;
    comp[s] = out.length;
    const queue = [s];
    let head = 0;
    while (head < queue.length) {
      const node = queue[head++] as number;
      for (const next of adj[node] as number[]) {
        if ((comp[next] as number) !== -1) continue;
        comp[next] = out.length;
        queue.push(next);
      }
    }
    out.push(queue);
  }
  return out;
}

/** 실행 통계 — 새 탐색 · 건너뛰기 · 이웃 검사 · 큐에서 안 꺼낸 정점 수의 최대. 성분 수는 정본과 맞댄다. */
export function stats(n: number, edges: readonly Edge[]) {
  const adj = adjacency(n, edges);
  const comp = Array.from({ length: n }, () => -1);
  let count = 0;
  let touches = 0;
  let peak = 0;
  let skips = 0;
  for (let s = 0; s < n; s++) {
    if (comp[s] !== -1) {
      skips++;
      continue;
    }
    comp[s] = count;
    const queue = [s];
    let head = 0;
    peak = Math.max(peak, 1);
    while (head < queue.length) {
      const node = queue[head++] as number;
      for (const next of adj[node] as number[]) {
        touches++;
        if ((comp[next] as number) !== -1) continue;
        comp[next] = count;
        queue.push(next);
        peak = Math.max(peak, queue.length - head);
      }
    }
    count++;
  }
  if (connectedComponents(n, edges as Edge[]).length !== count) {
    throw new Error("통계 사본의 성분 수가 정본과 다르다");
  }
  return { searches: count, touches, peak, skips, k: count };
}

/** 방향을 지켜 따라가는 도달 가능 정점 — 전제가 깨지는 자리를 보이려고 쓴다. */
function reachDirected(n: number, directed: readonly Edge[], s: number) {
  const out: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of directed) (out[u] as number[]).push(v);
  const seen = new Set([s]);
  const stack = [s];
  while (stack.length > 0) {
    const x = stack.pop() as number;
    for (const y of out[x] as number[]) {
      if (!seen.has(y)) {
        seen.add(y);
        stack.push(y);
      }
    }
  }
  return seen;
}

/** 방향을 지켜 「서로 오갈 수 있는가」로 묶은 것. */
function mutualGroups(n: number, directed: readonly Edge[]): number[][] {
  const sets = Array.from({ length: n }, (_, v) =>
    reachDirected(n, directed, v),
  );
  const done = new Set<number>();
  const groups: number[][] = [];
  for (let u = 0; u < n; u++) {
    if (done.has(u)) continue;
    const g: number[] = [];
    for (let v = 0; v < n; v++) {
      if (sets[u]?.has(v) && sets[v]?.has(u)) {
        g.push(v);
        done.add(v);
      }
    }
    groups.push(g);
  }
  return groups;
}

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 바깥 반복의 **건너뛰기 한 줄**을 지운 사본. **정본 소스에서 기계로 만든다** — 맞는 줄이
 * 정확히 하나가 아니면 `loadMutant` 가 던진다. 손으로 베낀 사본이면 「한 곳만 바꿨다」가
 * 검사되지 않는다.
 */
const noSkip = await loadMutant<{
  connectedComponents(n: number, edges: Edge[]): number[][];
}>(new URL("./connectedComponents-guide.ref.ts", import.meta.url).pathname, {
  drop: /if \(comp\[s\] !== -1\) continue;/,
});

/** 중화 실행이면 `loadMutant` 가 정본을 그대로 돌려준다 — 그때는 변이의 자기검사를 건너뛴다. */
const NEUTRAL = noSkip.connectedComponents === connectedComponents;

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "삼각형 + 간선 하나 + 외딴 정점", n: WALK_N, edges: WALK_EDGES },
  { label: "사슬 0-1-2-3", n: 4, edges: CHAIN4 },
  { label: "간선 없음 (정점 4)", n: 4, edges: [] },
];

const mutantRows = MUTANT_CASES.map((c) => {
  const correct = showGroups(connectedComponents(c.n, c.edges));
  const broken = showGroups(noSkip.connectedComponents(c.n, c.edges));
  return { label: c.label, correct, broken, same: correct === broken };
});

// 하나도 안 깨지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다(중화 실행은 건너뛴다).
if (!NEUTRAL && mutantRows.every((r) => r.same)) {
  throw new Error(
    "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「성분이 쪼개진다」가 거짓이다",
  );
}

/**
 * 건너뛰기를 지운 절차의 걸음 기록 — 시작점마다 그 탐색이 끝난 뒤의 `comp`. 기록을 남기려고 손으로
 * 쓴 사본이라, 변이 실행에서는 최종 답을 기계로 만든 변이의 답과 맞댄다.
 */
function tracedNoSkip(n: number, edges: readonly Edge[]) {
  const adj = adjacency(n, edges);
  const comp: number[] = Array.from({ length: n }, () => -1);
  let count = 0;
  const rows: {
    s: number;
    before: number;
    comp: number[];
    joined: number[];
  }[] = [];
  for (let s = 0; s < n; s++) {
    const before = comp[s] as number;
    comp[s] = count;
    const queue: number[] = [s];
    let head = 0;
    while (head < queue.length) {
      const node = queue[head++] as number;
      for (const next of adj[node] as number[]) {
        if ((comp[next] as number) !== -1) continue;
        comp[next] = count;
        queue.push(next);
      }
    }
    rows.push({ s, before, comp: comp.slice(), joined: queue.slice(1) });
    count++;
  }
  const out: number[][] = Array.from({ length: count }, () => []);
  for (let v = 0; v < n; v++) (out[comp[v] as number] as number[]).push(v);
  const cleaned = out.filter((c) => c.length > 0);
  if (
    !NEUTRAL &&
    !sameGroups(cleaned, noSkip.connectedComponents(n, edges as Edge[]))
  ) {
    throw new Error("건너뛰기를 지운 기록 사본이 기계로 만든 변이와 다르다");
  }
  return { rows, out: cleaned };
}

/* ─────────────────── 규모 표의 닫힌 식을 실행으로 검산 ─────────────────── */

/** 사슬에서 가장 단순한 방법의 계수 — 방문 표시 `V²` 칸, 이웃 검사 `V × 2(V − 1)` 번. */
const naiveCells = (v: number): number => v * v;
const naiveTouches = (v: number): number => v * 2 * (v - 1);

const SCALE_RUN = [10, 100, 1_000];
export const SCALE_BIG = 100_000;

const scaleRows = SCALE_RUN.map((v) => {
  const got = restartCounts(v, chain(v));
  if (got.initCells !== naiveCells(v) || got.touches !== naiveTouches(v)) {
    throw new Error(`규모 표의 식이 실행과 다르다 — V=${v}`);
  }
  return { v, cells: got.initCells, touches: got.touches, how: "실행" };
});

export const seconds = (ops: number): string => `${(ops / 1e8).toFixed(3)} 초`;

/** 시도 사다리(그림)가 쓰는 수 — 위 식과 실행에서 받는다. */
export function ladderNumbers() {
  const bool = boolRun(WALK_N, WALK_EDGES);
  const firstUnsorted = bool.lists.find(
    (l, i) => l.join(",") !== (bool.sorted[i] as number[]).join(","),
  ) as number[];
  const big = SCALE_BIG;
  return {
    big,
    naiveOps: naiveCells(big) + naiveTouches(big),
    shareOps: 2 * big + 2 * (big - 1),
    firstUnsorted,
    firstSorted: firstUnsorted.slice().sort((a, b) => a - b),
  };
}

/* ────────────────────────── 블록 ────────────────────────── */

const SPLITS: number[] = [1, 2, 3, 4, 6, 12];

/** 수학 절 — 두 정점 사이의 간선 수가 가장 적은 정점 열(없으면 null). */
function pathBetween(
  n: number,
  edges: readonly Edge[],
  from: number,
  to: number,
): number[] | null {
  const adj = adjacency(n, edges);
  const prev = Array.from({ length: n }, () => -2);
  prev[from] = -1;
  const queue = [from];
  let head = 0;
  while (head < queue.length) {
    const x = queue[head++] as number;
    for (const y of adj[x] as number[]) {
      if (prev[y] !== -2) continue;
      prev[y] = x;
      queue.push(y);
    }
  }
  if (prev[to] === -2) return null;
  const path = [to];
  while ((path[0] as number) !== from) {
    path.unshift(prev[path[0] as number] as number);
  }
  return path;
}

/** 불변식 확인 — 바깥 반복이 시작점을 볼 때마다 번호가 적힌 칸이 최종 번호와 같은가. */
function watchInvariant(n: number, edges: readonly Edge[]) {
  const final = traced(n, edges).comp;
  const adj = adjacency(n, edges);
  const comp = Array.from({ length: n }, () => -1);
  let count = 0;
  let visits = 0;
  let seenCells = 0;
  let wrong = 0;
  let open = 0;
  for (let s = 0; s < n; s++) {
    visits++;
    comp.forEach((c, v) => {
      if (c === -1) return;
      seenCells++;
      if (c !== final[v]) wrong++;
      for (const w of adj[v] as number[]) if (comp[w] === -1) open++;
    });
    if (comp[s] !== -1) continue;
    comp[s] = count;
    const queue = [s];
    let head = 0;
    while (head < queue.length) {
      const node = queue[head++] as number;
      for (const next of adj[node] as number[]) {
        if ((comp[next] as number) !== -1) continue;
        comp[next] = count;
        queue.push(next);
      }
    }
    count++;
  }
  return { visits, seenCells, wrong, open };
}

export const PROOFS: Record<string, () => string> = {
  /** 전체 컨셉 — 시작점마다 한 일. */
  "concept-starts": () =>
    md(
      ["시작점 s", "그때의 comp[s]", "한 일", "나온 성분"],
      OUTER.map((r) => [
        String(r.s),
        String(r.read),
        r.branch === "①" ? "탐색을 시작한다" : "건너뛴다",
        r.branch === "①" ? show(r.joined.slice().sort((a, b) => a - b)) : "—",
      ]),
      [0, 1],
    ),

  /** 출력 계약 — 같은 무리라도 순서가 다르면 다른 답이다. */
  "task-order": () => {
    const good = connectedComponents(WALK_N, WALK_EDGES);
    const met = discoveryOrder(WALK_N, WALK_EDGES);
    const inner = (g: readonly (readonly number[])[]) =>
      g.every((c) => c.every((x, i) => i === 0 || (c[i - 1] as number) < x));
    const outer = (g: readonly (readonly number[])[]) =>
      g.every(
        (c, i) =>
          i === 0 ||
          Math.min(...(g[i - 1] as number[])) < Math.min(...(c as number[])),
      );
    const yes = (b: boolean) => (b ? "그렇다" : "아니다");
    return md(
      ["출력", "성분 안이 오름차순", "성분끼리 최소 정점 오름차순", "계약"],
      [good, met].map((g) => [
        showGroups(g),
        yes(inner(g)),
        yes(outer(g)),
        inner(g) && outer(g) ? "맞는다" : "어긋난다",
      ]),
    );
  },

  /** 가장 단순한 방법이 제약 규모에서 몇 번을 세는가 — 수치 반박의 근거. */
  "naive-scale": () => {
    const rows = [
      ...scaleRows,
      {
        v: SCALE_BIG,
        cells: naiveCells(SCALE_BIG),
        touches: naiveTouches(SCALE_BIG),
        how: "식",
      },
    ].map((r) => [
      comma(r.v),
      comma(r.v - 1),
      comma(r.cells),
      comma(r.touches),
      seconds(r.cells + r.touches),
      r.how,
    ]);
    return [
      md(
        [
          "정점 V",
          "간선 E",
          "방문 표시 칸",
          "이웃 검사",
          "초당 1 억 번 기준",
          "센 방법",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `실행한 ${scaleRows.length} 줄이 모두 식 V² 과 V × 2(V − 1) 에 일치했고, 정점 ${comma(SCALE_BIG)} 개 줄은 그 식으로 낸 값입니다.`,
    ].join("\n");
  },

  /** 정점마다 새로 탐색할 때 시작점마다 무슨 일이 있었나. */
  "naive-trace": () => {
    const r = restartCounts(WALK_N, WALK_EDGES);
    const seenKeys = new Set<string>();
    let repeats = 0;
    const rows = r.bags.map((bag, s) => {
      const key = r.keys[s] as string;
      const fresh = !seenKeys.has(key);
      seenKeys.add(key);
      if (!fresh) repeats++;
      const first = r.keys.indexOf(key);
      return [
        String(s),
        `${WALK_N} 칸`,
        bag.join(", "),
        fresh
          ? `성분 ${show(key.split(",").map(Number))}`
          : `없다 — 시작점 ${first} 에서 이미 나왔다`,
      ];
    });
    return [
      md(
        ["시작점", "새로 만든 방문 표시", "탐색이 만난 정점", "새로 알아낸 것"],
        rows,
        [0],
      ),
      "",
      `탐색 ${r.bags.length} 번 가운데 앞서 나온 성분을 다시 모은 것이 ${repeats} 번입니다.`,
    ].join("\n");
  },

  /** 같은 그래프에 두 방식을 걸어 계수를 나란히 센다. */
  "restart-vs-share": () => {
    const r = restartCounts(WALK_N, WALK_EDGES);
    const s = shareCounts(WALK_N, WALK_EDGES);
    const answer = showGroups(connectedComponents(WALK_N, WALK_EDGES));
    return [
      md(
        ["방법", "방문 표시 칸", "이웃 검사", "만든 모임", "결과"],
        [
          [
            "정점마다 새로 탐색한다",
            String(r.initCells),
            String(r.touches),
            `${r.bags.length} → ${r.groups}`,
            answer,
          ],
          [
            "방문 표시를 지우지 않는다",
            String(s.initCells),
            String(s.touches),
            String(s.groups),
            answer,
          ],
        ],
        [1, 2],
      ),
      "",
      `두 결과가 일치하고, 방문 표시를 지우지 않으면 이웃 검사가 ${s.touches} 번입니다. 간선이 ${WALK_EDGES.length} 개라 2E 는 ${2 * WALK_EDGES.length} 입니다.`,
    ].join("\n");
  },

  /** 참·거짓 한 벌로 유지하면 무리가 만난 순서의 목록으로만 남는다. */
  "bool-candidate": () => {
    const b = boolRun(WALK_N, WALK_EDGES);
    const unsorted = b.lists.filter(
      (l, i) => l.join(",") !== (b.sorted[i] as number[]).join(","),
    ).length;
    return [
      md(
        [
          "탐색을 시작한 정점",
          "만난 순서로 모은 목록",
          "오름차순으로 정렬한 목록",
        ],
        b.lists.map((l, i) => [
          String(l[0]),
          show(l),
          show(b.sorted[i] as number[]),
        ]),
        [0],
      ),
      "",
      `탐색이 끝난 뒤 seen 은 ${show(b.seen)} 이고, 목록 ${b.lists.length} 개 가운데 만난 순서가 오름차순이 아닌 것은 ${unsorted} 개입니다.`,
    ].join("\n");
  },

  /** 성분 번호를 담으면 번호별로 한 번 통과해 담는 것으로 답이 된다. */
  "label-run": () =>
    columns([
      ["탐색이 끝난 뒤 comp", show(WALK.comp)],
      ["정점 번호 오름차순으로 담은 것", showGroups(WALK.out)],
      ["정본의 답", showGroups(connectedComponents(WALK_N, WALK_EDGES))],
    ]),

  /** 1단계 — 이웃 목록. */
  "build-adj": () => {
    const total = WALK.adj.reduce((a, l) => a + l.length, 0);
    return [
      md(
        ["정점 v", "adj[v]", "길이"],
        WALK.adj.map((l, v) => [String(v), show(l), String(l.length)]),
        [0, 2],
      ),
      "",
      `길이를 모두 더하면 ${total} 이고, 간선 ${WALK_EDGES.length} 개의 두 배입니다.`,
    ].join("\n");
  },

  /** 2단계 — 번호가 적히는 걸음과 큐에 들어가는 걸음이 같다. */
  "build-mark": () => {
    const once = WALK.pushes.every((p) => p === 1);
    const sameStep = WALK.writtenAt.every((w, v) => w === WALK.pushedAt[v]);
    if (!once || !sameStep) throw new Error("번호와 큐의 시점이 갈렸다");
    return [
      md(
        [
          "정점",
          "최종 comp",
          "번호가 적힌 걸음",
          "큐에 들어간 걸음",
          "큐에 들어간 횟수",
        ],
        WALK.comp.map((c, v) => [
          String(v),
          String(c),
          stepOf(WALK.writtenAt[v] as number),
          stepOf(WALK.pushedAt[v] as number),
          String(WALK.pushes[v]),
        ]),
        [0, 1, 4],
      ),
      "",
      `정점 ${WALK_N} 개가 모두 큐에 정확히 한 번 들어갔고, 번호가 적힌 걸음과 큐에 들어간 걸음이 정점마다 일치합니다.`,
    ].join("\n");
  },

  /** 3단계 — 한 성분 안에서 이어 탐색하는 쉬운 경우. */
  "build-within": () =>
    md(
      ["걸음", "하는 일", "comp", "큐에서 안 꺼낸 부분"],
      searchSteps(0).map((i) => {
        const st = WALK.steps[i] as Step;
        const e = st.event;
        const what =
          e.kind === "start"
            ? `시작점 ${e.s} 에 번호 ${st.count}${을를(String(st.count))} 적는다`
            : e.kind === "check"
              ? `${e.node} 의 이웃 ${e.next} — ${e.fresh ? "번호를 적고 큐에 넣는다" : "이미 번호가 있다"}`
              : "";
        return [stepOf(i), what, show(st.comp), show(pending(st))];
      }),
    ),

  /** 3단계 — 성분이 바뀌는 불안한 경우. comp 가 한 칸도 지워지지 않는다. */
  "build-switch": () => {
    const from = (searchSteps(0).at(-1) as number) + 0;
    const until = WALK.steps.findIndex(
      (s) => s.event.kind === "skip" && s.event.s === 2,
    );
    const rows: string[][] = [];
    for (let i = from; i <= until; i++) {
      const st = WALK.steps[i] as Step;
      const e = st.event;
      const what =
        e.kind === "start"
          ? `s = ${e.s} — comp[${e.s}]${이가(String(e.s))} -1 이라 새 성분 ${st.count}${을를(String(st.count))} 시작한다`
          : e.kind === "skip"
            ? `s = ${e.s} — comp[${e.s}]${이가(String(e.s))} ${st.comp[e.s]}${josaIra(st.comp[e.s] as number)} 건너뛴다`
            : e.kind === "check"
              ? `${e.node} 의 이웃 ${e.next} — ${e.fresh ? "번호를 적는다" : "이미 번호가 있다"}`
              : "";
      rows.push([stepOf(i), what, show(st.comp), show(pending(st))]);
    }
    let erased = 0;
    WALK.steps.forEach((st, i) => {
      if (i === 0) return;
      const prev = (WALK.steps[i - 1] as Step).comp;
      prev.forEach((c, v) => {
        if (c !== -1 && st.comp[v] !== c) erased++;
      });
    });
    return [
      md(["걸음", "하는 일", "comp", "큐에서 안 꺼낸 부분"], rows),
      "",
      `전개의 ${WALK.steps.length} 걸음 전체에서 -1 이 아니던 칸이 다른 값으로 바뀐 것은 ${erased} 번입니다.`,
    ].join("\n");
  },

  /** 크기 — 정점 수를 12 로 고정하고 성분 수만 바꿔 두 방식의 계수를 낸다. */
  "split-sweep": () => {
    const v = 12;
    let allMatch = true;
    let floor = Number.POSITIVE_INFINITY;
    const rows = SPLITS.map((k) => {
      const edges = chains(v, k);
      const r = restartCounts(v, edges);
      const s = shareCounts(v, edges);
      const sum = s.scans + s.touches + s.pushes;
      if (sum !== 2 * v + 2 * edges.length) allMatch = false;
      floor = Math.min(floor, r.initCells + r.touches);
      return [
        String(k),
        String(edges.length),
        String(s.scans),
        String(s.touches),
        String(s.pushes),
        String(sum),
        String(r.initCells + r.touches),
      ];
    });
    if (!allMatch) throw new Error("번호를 유지하는 쪽이 2V + 2E 와 다르다");
    return [
      md(
        [
          "성분 수 k",
          "간선 E",
          "시작점 확인",
          "이웃 검사",
          "큐 삽입",
          "번호를 유지하는 쪽의 합",
          "정점마다 새로 탐색하는 쪽",
        ],
        rows,
        [0, 1, 2, 3, 4, 5, 6],
      ),
      "",
      `${SPLITS.length} 줄 모두 번호를 유지하는 쪽의 합이 2V + 2E 와 같습니다. 정점마다 새로 탐색하는 쪽은 가장 작을 때도 ${floor} 이고, V² = ${v * v} 입니다.`,
    ].join("\n");
  },

  /** 4단계 — 번호를 붙인 시작점이 그 성분의 최소 정점이다. */
  "build-order": () => {
    const starts = OUTER.filter((r) => r.branch === "①");
    let all = true;
    const rows = WALK.out.map((c, i) => {
      const s = (starts[i] as Outer).s;
      const min = Math.min(...(c as number[]));
      if (s !== min) all = false;
      return [String(i), String(s), show(c), String(min)];
    });
    if (!all) throw new Error("시작점이 최소 정점이 아니다");
    return [
      md(
        ["성분 번호", "번호를 붙인 시작점", "성분의 정점", "성분의 최소 정점"],
        rows,
        [0, 1, 3],
      ),
      "",
      `성분 ${WALK.out.length} 개 모두 번호를 붙인 시작점이 그 성분의 최소 정점과 같습니다.`,
    ].join("\n");
  },

  /** 전제 — 간선에 방향이 있으면 이 절차가 다른 답을 낸다. */
  "premise-directed": () => {
    const directed: Edge[] = [[0, 1]];
    const go = (a: number, b: number) =>
      reachDirected(2, directed, a).has(b) ? "된다" : "안 된다";
    return md(
      ["간선 0 → 1 을 읽는 법", "0 → 1 도달", "1 → 0 도달", "묶음"],
      [
        [
          "무향으로 읽는다(이 절차)",
          "된다",
          "된다",
          showGroups(connectedComponents(2, directed)),
        ],
        [
          "방향을 지킨다",
          go(0, 1),
          go(1, 0),
          showGroups(mutualGroups(2, directed)),
        ],
      ],
    );
  },

  /** 전개 입력. */
  "walk-input": () =>
    [
      `const n = ${WALK_N};`,
      `const edges: [number, number][] = [${WALK_EDGES.map((e) => `[${e.join(", ")}]`).join(", ")}];`,
      `// 이 절이 끝나면 ${showGroups(connectedComponents(WALK_N, WALK_EDGES))} 가 나와야 한다`,
    ].join("\n"),

  /** 전개 1 — 이웃 목록만 만든 결과. */
  "walk-adj": () => {
    const half = Math.ceil(WALK_N / 2);
    const line = (v: number) => `adj[${v}] = ${show(WALK.adj[v] as number[])}`;
    return columns(
      Array.from({ length: half }, (_, i) =>
        i + half < WALK_N ? [line(i), line(i + half)] : [line(i)],
      ),
    );
  },

  /** 짚고 가기 — 자기 루프와 중복 간선을 거르든 안 거르든 답이 같다. */
  "dup-loop": () => {
    const clean = shareCounts(WALK_N, WALK_EDGES);
    const dirty = shareCounts(WALK_N, DIRTY_EDGES);
    const a = connectedComponents(WALK_N, WALK_EDGES);
    const b = connectedComponents(WALK_N, DIRTY_EDGES);
    return [
      md(
        ["입력", "간선 E", "이웃 목록 칸", "이웃 검사", "결과"],
        [
          [
            "자기 루프·중복 간선을 지운 것",
            String(WALK_EDGES.length),
            String(2 * WALK_EDGES.length),
            String(clean.touches),
            showGroups(a),
          ],
          [
            "그대로 둔 것",
            String(DIRTY_EDGES.length),
            String(2 * DIRTY_EDGES.length),
            String(dirty.touches),
            showGroups(b),
          ],
        ],
        [1, 2, 3],
      ),
      "",
      `두 결과가 ${sameGroups(a, b) ? "일치하고" : "갈리고"}, 이웃 검사는 ${clean.touches} 번과 ${dirty.touches} 번입니다.`,
    ].join("\n");
  },

  /** 전개 2 — 초기 상태. */
  "walk-init": () =>
    [
      `comp  = ${show((WALK.steps[0] as Step).comp)}`,
      `count = ${(WALK.steps[0] as Step).count}`,
    ].join("\n"),

  /** 전개 3 — 바깥 반복이 시작점마다 한 일. */
  "walk-outer": () =>
    columns(
      OUTER.map((r) => [
        `s = ${r.s}`,
        r.branch === "①"
          ? `① 새 성분 ${WALK.comp[r.s]}`
          : `② comp[${r.s}] = ${r.read}, 건너뛴다`,
        r.branch === "①" ? `번호를 적은 정점 ${r.joined.join(", ")}` : "",
        `comp = ${show(r.compAfter)}`,
      ]),
    ),

  /** 전개 4 — 정점 번호 오름차순으로 담기. */
  "walk-collect": () => {
    const out: number[][] = WALK.out.map(() => []);
    const rows = WALK.comp.map((c, v) => {
      (out[c] as number[]).push(v);
      return [
        `v = ${v}`,
        `comp[${v}] = ${c}`,
        `out[${c}] = ${show(out[c] as number[])}`,
      ];
    });
    return [columns(rows), "", `out = ${showGroups(out)}`].join("\n");
  },

  /** 짚고 가기 — 만난 순서대로 담으면 간선 순서에 따라 결과가 갈린다. */
  "discovery-order": () => {
    const cases = [
      { name: "원래 순서", edges: WALK_EDGES },
      { name: "[2, 0] 을 맨 앞으로", edges: REORDERED_EDGES },
    ];
    const met = cases.map((c) => showGroups(discoveryOrder(WALK_N, c.edges)));
    const ours = cases.map((c) =>
      showGroups(connectedComponents(WALK_N, c.edges)),
    );
    const rows = cases.flatMap((c, i) => [
      ["만나는 순서대로 담는다", c.name, met[i] as string],
      ["정점 번호 오름차순으로 담는다", c.name, ours[i] as string],
    ]);
    return [
      md(["담는 법", "간선 순서", "결과"], rows),
      "",
      `만나는 순서대로 담으면 두 간선 순서의 결과가 ${met[0] === met[1] ? "같고" : "갈리고"}, 정점 번호 오름차순으로 담으면 ${ours[0] === ours[1] ? "같습니다" : "갈립니다"}.`,
    ].join("\n");
  },

  /** 전개 5 — 걸음마다 조건 판정. */
  "walk-trace": () => {
    const rows = WALK.steps.map((st, i) => {
      const e = st.event;
      let who = "—";
      let cond = "comp 를 -1 로 채운다";
      if (e.kind === "start" || e.kind === "skip") {
        who = `시작점 ${e.s}`;
        cond = `\`comp[${e.s}] !== -1\` 이 **${e.kind === "skip" ? "참" : "거짓"}** → ${branchOf(e)}`;
      }
      if (e.kind === "check") {
        who = `${e.node} → 이웃 ${e.next}`;
        cond = `\`comp[${e.next}] !== -1\` 이 **${e.fresh ? "거짓" : "참"}** → ${branchOf(e)}`;
      }
      if (e.kind === "collect") {
        who = "정점 0 ~ 5";
        cond = `\`s < n\` 이 **거짓** (${WALK_N} < ${WALK_N}) → 담기`;
      }
      return [stepOf(i), who, cond, show(st.comp), show(pending(st))];
    });
    const where = (b: string) =>
      WALK.steps.flatMap((st, i) =>
        branchOf(st.event) === b ? [stepOf(i)] : [],
      );
    const line = (b: string) =>
      `${b}${은는(CIRCLED[b] ?? b)} ${where(b).join(" · ")} 에서 ${where(b).length} 번`;
    const checks = WALK.steps.filter((s) => s.event.kind === "check").length;
    return [
      md(["걸음", "보는 것", "조건 판정", "comp", "큐에서 안 꺼낸 부분"], rows),
      "",
      `${["①", "②", "③", "④"].map(line).join(", ")} 실행됐습니다. 이웃 검사는 모두 ${checks} 번이고 반환값은 ${showGroups(WALK.out)} 입니다.`,
    ].join("\n");
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "final-cases": () => {
    const cases: { call: string; n: number; edges: Edge[] }[] = [
      {
        call: "connectedComponents(6, [[0,4],[4,2],[2,0],[1,3]])",
        n: 6,
        edges: WALK_EDGES,
      },
      {
        call: "connectedComponents(5, [[0,1],[1,2],[3,4]])",
        n: 5,
        edges: [
          [0, 1],
          [1, 2],
          [3, 4],
        ],
      },
      {
        call: "connectedComponents(4, [[0,1],[1,2],[2,3],[3,0]])",
        n: 4,
        edges: [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 0],
        ],
      },
      { call: "connectedComponents(4, [])", n: 4, edges: [] },
      { call: "connectedComponents(3, [[1,1]])", n: 3, edges: [[1, 1]] },
      { call: "connectedComponents(1, [])", n: 1, edges: [] },
    ];
    return columns(
      cases.map((c) => [
        c.call,
        "→",
        showGroups(connectedComponents(c.n, c.edges)),
      ]),
    );
  },

  /** 알아 두면 좋은 개념 — 탐색이 만든 숲. */
  "related-forest": () => {
    let total = 0;
    const rows = WALK.out.map((c, i) => {
      const used = FOREST.filter(([u]) => WALK.comp[u] === i);
      total += used.length;
      return [
        String(i),
        show(c),
        used.length === 0
          ? "없음"
          : used.map(([u, v]) => `${u}-${v}`).join(" · "),
        String(used.length),
        String(c.length - 1),
      ];
    });
    const k = WALK.out.length;
    if (total !== WALK_N - k) throw new Error("숲의 간선 수가 V − k 가 아니다");
    return [
      md(
        ["성분", "정점", "③ 이 쓴 간선", "간선 수", "정점 수 − 1"],
        rows,
        [0, 3, 4],
      ),
      "",
      `③ 이 쓴 간선은 모두 ${total} 개이고, V − k = ${WALK_N} − ${k} = ${WALK_N - k}${과와(String(WALK_N - k))} 같습니다. 원래 그래프의 간선은 ${WALK_EDGES.length} 개입니다.`,
    ].join("\n");
  },

  /**
   * 경쟁 설계와의 대조 — `.alt.ts` 가 세는 결정론적 계수를 그대로 싣는다(`bench-alt --check` 와 같은 값).
   * 고리 입력의 모양과 성분 수는 정본이 낸다.
   */
  "alt-table": () => {
    const a = ALT_CASES.탐색();
    const b = ALT_CASES["서로소 집합"]();
    const keys = [
      "전개 입력 칸 접근",
      "고리 입력 칸 접근",
      "추가 칸",
      "온라인 칸 접근",
    ] as const;
    const rings = RING_N / RING_SIZE;
    const k = connectedComponents(RING_N, RING_EDGES).length;
    const ratio = Math.floor(a["온라인 칸 접근"] / b["온라인 칸 접근"]);
    return [
      `고리 입력은 정점 ${comma(RING_N)} 개를 크기 ${RING_SIZE} 짜리 고리 ${rings} 개로 가른 것입니다. \`c\` 번째 고리의 \`j\` 번 정점은 \`${RING_SIZE}c + j\` 이고 \`${RING_SIZE}c + ((j + 1) mod ${RING_SIZE})\` 과 이어집니다. 간선은 ${comma(RING_EDGES.length)} 개이고, 정본이 낸 성분은 ${comma(k)} 개입니다.`,
      "",
      md(
        ["설계", ...keys],
        [
          ["탐색 (이 글)", ...keys.map((x) => comma(a[x]))],
          ["서로소 집합", ...keys.map((x) => comma(b[x]))],
        ],
        [1, 2, 3, 4],
      ),
      "",
      `간선을 한 번에 다 받으면 고리 입력에서 탐색이 ${comma(a["고리 입력 칸 접근"])} 번, 서로소 집합이 ${comma(b["고리 입력 칸 접근"])} 번입니다. 간선 ${comma(RING_EDGES.length)} 개를 하나씩 받으며 받을 때마다 성분 수를 물으면 탐색이 ${comma(a["온라인 칸 접근"])} 번, 서로소 집합이 ${comma(b["온라인 칸 접근"])} 번으로 ${comma(ratio)} 배가 넘게 갈립니다.`,
    ].join("\n");
  },

  /** 수식 — 관계 ~ 를 작은 값에 넣어 본다. */
  "math-check": () => {
    const pairs: [number, number][] = [
      [0, 4],
      [4, 2],
      [0, 2],
      [1, 3],
      [0, 1],
      [0, 5],
    ];
    return md(
      ["물음", "간선이 가장 적은 정점 열", "m", "판정"],
      pairs.map(([u, v]) => {
        const p = pathBetween(WALK_N, WALK_EDGES, u, v);
        return [
          `${u} ~ ${v}`,
          p ? p.join(" → ") : "없다",
          p ? String(p.length - 1) : "—",
          p ? "참" : "거짓",
        ];
      }),
      [2],
    );
  },

  /** 수식 — 전개 입력의 모임 C_i 와 그 크기 c_i. */
  "math-partition": () => {
    const rows = WALK.out.map((c, i) => [
      `C_${i} = {${c.join(", ")}}`,
      `c_${i} = ${c.length}`,
    ]);
    const total = WALK.out.reduce((a, c) => a + c.length, 0);
    return [
      columns(rows),
      "",
      `${WALK.out.map((c) => c.length).join(" + ")} = ${total}, 정점 수 V 는 ${WALK_N}`,
    ].join("\n");
  },

  /** 수식 — 모임의 크기 합과 간선 하한을 전개 입력에 넣는다. */
  "math-bound": () => {
    const sizes = WALK.out.map((c) => c.length);
    const k = sizes.length;
    const e = WALK_EDGES.length;
    return columns([
      ["왼쪽", `E = ${e}`],
      ["오른쪽", `V − k = ${WALK_N} − ${k} = ${WALK_N - k}`],
      ["차이", `E − (V − k) = ${e - (WALK_N - k)}`],
    ]);
  },

  /** 수식 — 제약 규모에서 하한이 말해 주는 것과 말해 주지 않는 것. */
  "math-scale": () => {
    const V = SCALE_BIG;
    const rows = [0, 10_000, 99_999, 100_000].map((e) => {
      const spread: Edge[] =
        e <= V - 1 ? chain(e + 1) : [...chain(V), [V - 1, 0] as Edge];
      const packed: Edge[] = Array.from({ length: e }, () => [0, 1] as Edge);
      return [
        comma(V),
        comma(e),
        comma(V - e),
        comma(connectedComponents(V, spread).length),
        comma(connectedComponents(V, packed).length),
      ];
    });
    return md(
      [
        "V",
        "E",
        "V − E",
        "간선을 한 줄로 이어 붙인 k",
        "간선을 정점 0 · 1 사이에 몰아 준 k",
      ],
      rows,
      [0, 1, 2, 3, 4],
    );
  },

  /** 불변식 — 바깥 반복이 시작점을 볼 때마다 확인한다. */
  "invariant-check": () => {
    const cases: { name: string; n: number; edges: Edge[] }[] = [
      { name: "전개 입력", n: WALK_N, edges: WALK_EDGES },
      { name: "사슬 넷 V = 12", n: 12, edges: chains(12, 4) },
      { name: "별 모양 V = 30", n: 30, edges: star(30) },
      {
        name: "무작위 V = 40 · E = 30 (시드 20260930)",
        n: 40,
        edges: randomGraph(40, 30, 20_260_930),
      },
    ];
    let visits = 0;
    let bad = 0;
    const rows = cases.map((c) => {
      const w = watchInvariant(c.n, c.edges);
      visits += w.visits;
      bad += w.wrong + w.open;
      return [
        c.name,
        String(w.visits),
        String(w.seenCells),
        String(w.wrong),
        String(w.open),
      ];
    });
    return [
      md(
        [
          "입력",
          "확인한 시점",
          "번호가 적힌 칸을 본 횟수",
          "최종 번호와 다른 칸",
          "번호 없는 이웃을 둔 번호 있는 정점",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `입력 ${cases.length} 개의 ${visits} 개 시점에서 불변식이 깨진 자리는 ${bad} 개입니다.`,
    ].join("\n");
  },

  /** 불변식 — 경계 입력. */
  "invariant-edges": () => {
    const cases: { name: string; call: string; n: number; edges: Edge[] }[] = [
      {
        name: "정점 하나",
        call: "connectedComponents(1, [])",
        n: 1,
        edges: [],
      },
      {
        name: "간선 없음",
        call: "connectedComponents(4, [])",
        n: 4,
        edges: [],
      },
      {
        name: "자기 루프",
        call: "connectedComponents(3, [[1,1]])",
        n: 3,
        edges: [[1, 1]],
      },
      {
        name: "중복 간선",
        call: "connectedComponents(3, [[0,1],[0,1],[1,0]])",
        n: 3,
        edges: [
          [0, 1],
          [0, 1],
          [1, 0],
        ],
      },
      {
        name: "전부 이어짐",
        call: "connectedComponents(4, [[0,1],[1,2],[2,3],[3,0]])",
        n: 4,
        edges: [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 0],
        ],
      },
    ];
    return md(
      ["입력", "호출", "결과", "새 탐색", "건너뛴 시작점", "이웃 검사"],
      cases.map((c) => {
        const s = stats(c.n, c.edges);
        return [
          c.name,
          `\`${c.call}\``,
          showGroups(connectedComponents(c.n, c.edges)),
          String(s.searches),
          String(s.skips),
          String(s.touches),
        ];
      }),
      [3, 4, 5],
    );
  },

  /**
   * 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다 — 변이를 정본 소스에서 기계로
   * 만들어, 건너뛰기 한 줄만 지웠을 때의 답을 낸다.
   */
  "mutant-skip": () =>
    md(
      ["입력", "건너뛰기가 있는 코드", "그 줄을 지운 코드", "두 답"],
      mutantRows.map((r) => [
        r.label,
        r.correct,
        r.broken,
        r.same ? "같다" : "어긋난다",
      ]),
    ),

  /** 변이의 자취 — 삼각형 입력에서 시작점마다 comp 가 어떻게 덮어써지는가. */
  "mutant-skip-trace": () =>
    columns(
      tracedNoSkip(WALK_N, WALK_EDGES).rows.map((r) => [
        `s = ${r.s}`,
        r.before === -1
          ? `comp[${r.s}]${이가(String(r.s))} -1 — 새 성분 ${r.s}`
          : `comp[${r.s}]${이가(String(r.s))} ${r.before} 에서 ${r.s}${으로(String(r.s))} 덮어써진다`,
        r.joined.length === 0
          ? "따라온 정점 없음"
          : `따라온 정점 ${r.joined.join(", ")}`,
        `comp = ${show(r.comp)}`,
      ]),
    ),

  /** 비용 — 바깥 반복. */
  "perf-outer": () => {
    const rows = OUTER.map((r) => {
      const mine = r.branch === "①" ? searchSteps(r.s) : [r.at];
      const first = mine[0] as number;
      const last = mine.at(-1) as number;
      return [
        String(r.s),
        "1",
        r.branch === "①" ? `새 탐색 — 정점 ${r.joined.length} 개` : "건너뛰기",
        first === last ? stepOf(first) : `${stepOf(first)}~${stepOf(last)}`,
      ];
    });
    const k = OUTER.filter((r) => r.branch === "①").length;
    return [
      md(["시작점 s", "comp 읽기", "한 일", "걸음"], rows, [0, 1]),
      "",
      `comp 읽기는 모두 ${OUTER.length} 번으로 V 와 같고, 탐색을 실제로 시작한 것은 ${k} 번으로 성분 수 k 와 같습니다.`,
    ].join("\n");
  },

  /** 비용 — 안쪽 반복. */
  "perf-inner": () => {
    const order = WALK.steps.flatMap((st) =>
      st.event.kind === "start"
        ? [st.event.s]
        : st.event.kind === "check" && st.event.fresh
          ? [st.event.next]
          : [],
    );
    let total = 0;
    const rows = order.map((v) => {
      const at = WALK.steps.flatMap((st, i) =>
        st.event.kind === "check" && st.event.node === v ? [stepOf(i)] : [],
      );
      const len = (WALK.adj[v] as number[]).length;
      total += len;
      return [
        String(v),
        String(len),
        at.length === 0 ? "이웃이 없어 아무것도 안 본다" : at.join(" · "),
      ];
    });
    return [
      md(["꺼낸 정점", "이웃 목록 길이", "그 목록을 읽은 걸음"], rows, [0, 1]),
      "",
      `꺼낸 정점 ${order.length} 개의 이웃 목록 길이를 더하면 ${total} 이고, 간선 ${WALK_EDGES.length} 개의 두 배와 같습니다.`,
    ].join("\n");
  },

  /** 최악을 만드는 입력 — 정점 10 만 개짜리 세 극단. */
  "perf-worst": () => {
    const V = SCALE_BIG;
    const cases: { name: string; edges: Edge[] }[] = [
      { name: "별 모양", edges: star(V) },
      { name: "고리 하나", edges: ring(V) },
      { name: "간선 없음", edges: [] },
    ];
    return [
      md(
        [
          "입력",
          "간선 E",
          "성분 수 k",
          "이웃 검사",
          "큐에 한꺼번에 남은 정점의 최대",
          "새 탐색 횟수",
        ],
        cases.map((c) => {
          const s = stats(V, c.edges);
          return [
            c.name,
            comma(c.edges.length),
            comma(s.k),
            comma(s.touches),
            comma(s.peak),
            comma(s.searches),
          ];
        }),
        [1, 2, 3, 4, 5],
      ),
      "",
      `세 입력 모두 정점이 ${comma(V)} 개입니다.`,
    ].join("\n");
  },

  /** 스스로 점검하기 — 건너뛰기를 안 했다면. */
  "selfcheck-skip": () => {
    const t = tracedNoSkip(WALK_N, WALK_EDGES);
    const target = OUTER.filter((r) => r.branch === "②").map((r) => r.s);
    const rows = t.rows
      .filter((r) => target.includes(r.s))
      .map((r) => [
        `s = ${r.s} 에서 새로 시작하면`,
        `comp[${r.s}]${이가(String(r.s))} ${r.before} 에서 ${r.s}${으로(String(r.s))} 덮어써진다`,
        r.joined.length === 0
          ? "따라온 정점 없음"
          : `따라온 정점 ${r.joined.join(", ")}`,
      ]);
    const last = t.rows.at(-1) as { comp: number[] };
    return [
      columns(rows),
      "",
      `최종 comp = ${show(last.comp)}`,
      `반환값     ${showGroups(t.out)}`,
    ].join("\n");
  },
};
