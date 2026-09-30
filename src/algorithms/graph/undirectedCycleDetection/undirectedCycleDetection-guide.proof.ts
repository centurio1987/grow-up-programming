/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection-guide.md
 *
 * **걸음을 적는 사본이 하나 있다**(`traced`). 정본은 몇 번째 이웃 항목에서 무엇을 했는지 내보내지
 * 않으므로, 같은 절차에 기록만 덧붙인 사본이 아니면 걸음 표와 탐색 트리의 모양을 낼 수 없다. 그 사본은
 * 기본 선택지로 부를 때마다 자기 답을 정본과 맞댄다 — **답이 맞는지는 사본이 아니라 정본이 진다.**
 * 기록은 걸음마다 배열을 베끼므로 정점 1,000 개 이하의 입력에만 쓴다. 정점 10 만 개짜리 입력은 값만
 * 세는 가벼운 사본(`scanOnce`·`countCells`)이 재고, 그것들도 답을 정본과 맞댄다.
 *
 * 경쟁 설계의 계수는 `.alt.ts` 가 낸 것을 그대로 가져온다 — 같은 값을 두 파일이 각자 재면 둘이 갈라진다.
 * 걸음 재생 패널과 그림은 `-guide.fig.tsx` 가 여기의 `traced` 로 만든다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases as ALT_CASES } from "./undirectedCycleDetection-guide.alt.ts";
import { undirectedCycleDetection } from "./undirectedCycleDetection-guide.ref.ts";

export type Edge = [number, number];

/**
 * 본문 전개가 쓰는 고정 입력. 정점 0 · 1 · 2 는 한 줄이고 3 · 4 · 5 는 삼각형이라, 세 갈래와
 * 바깥 반복의 다시 시작하기가 한 입력에서 모두 실행된다.
 */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [3, 4],
  [4, 5],
  [5, 3],
];

/** `0-1-…-(v-1)` 한 줄. 간선 `v-1` 개이고 사이클이 없다. */
export function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1]);
  return out;
}

/** 정점 0 이 나머지 전부와 이어진 별 모양. 간선 `v-1` 개이고 사이클이 없다. */
export function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i]);
  return out;
}

/** 한 줄의 양 끝을 이어 붙인 고리. 간선 `v` 개이고 사이클이 하나다. */
export function ring(v: number): Edge[] {
  return [...chain(v), [v - 1, 0]];
}

/** 정점 `v` 개를 크기 `size` 짜리 한 줄 여럿으로 가른 숲. */
function forest(v: number, size: number): Edge[] {
  const out: Edge[] = [];
  for (let base = 0; base < v; base += size) {
    for (let i = base; i + 1 < Math.min(base + size, v); i++)
      out.push([i, i + 1]);
  }
  return out;
}

/** 정점 `v` 개를 모두 서로 이은 그래프. */
function complete(v: number): Edge[] {
  const out: Edge[] = [];
  for (let a = 0; a < v; a++) for (let b = a + 1; b < v; b++) out.push([a, b]);
  return out;
}

const adjacency = (n: number, edges: readonly Edge[]): number[][] => {
  const nbr: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (nbr[u] as number[]).push(v);
    (nbr[v] as number[]).push(u);
  }
  return nbr;
};

/* ────────────────────────── 표기 ────────────────────────── */

/** `[0, 1, 3]` 꼴 — 본문 표기와 같다. */
export const show = (xs: readonly (number | string)[]): string =>
  `[${xs.join(", ")}]`;

/** `1,599,993` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** `[[0,1],[1,2]]` 꼴 — 호출 표기와 같다. */
export const edgeList = (edges: readonly Edge[]): string =>
  `[${edges.map(([u, v]) => `[${u},${v}]`).join(",")}]`;

/** 간선 하나 — 입력에 적힌 차례 그대로. */
export const edgeName = ([u, v]: Edge): string => `[${u},${v}]`;

const yn = (b: boolean): string => (b ? "true" : "false");

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

/** `T2 · T4 · T7` 꼴. */
const idsOf = (ks: readonly number[]): string => ks.map(stepOf).join(" · ");

/* ────────────────────── 걸음을 적는 사본 ────────────────────── */

/** 시작 정점의 부모 자리 — 정본의 `NO_PARENT` 와 같은 값이다. */
export const NO_PARENT = -1;

/**
 * 걸음 하나. 바깥 반복이 정점을 잡는 일과, 꺼낸 정점의 이웃 항목 하나를 확인하는 일이 각각 걸음
 * 하나다.
 *
 * `start` 바깥 반복이 표시 없는 정점을 표시해 시작 · `skip` 부모라 건너뛴다(①) ·
 * `found` 이미 표시돼 있어 사이클이다(②) · `mark` 표시가 없어 표시하고 넣는다(③)
 */
export type Kind = "start" | "skip" | "found" | "mark";

export interface Step {
  readonly kind: Kind;
  /** 꺼낸 정점. 시작 걸음이면 시작 정점. */
  readonly u: number;
  /** 꺼낸 정점과 짝지어 꺼낸 from 값 — 그 정점의 부모. 시작 걸음이면 −1. */
  readonly parent: number;
  /** 확인한 이웃. 시작 걸음이면 −1. */
  readonly v: number;
  /** 확인한 이웃 항목이 `nbr[u]` 의 몇 번째인가(0 부터). 시작 걸음이면 −1. */
  readonly slot: number;
  /** 확인한 이웃 항목이 입력 `edges` 의 몇 번째 간선에서 왔는가. 없으면 −1. */
  readonly edge: number;
  /** 확인할 때 이웃이 표시돼 있었는가(걸음 전). 시작 걸음이면 false. */
  readonly seen: boolean;
  /** 걸음이 끝난 뒤의 상태. */
  readonly visited: readonly boolean[];
  /** 정점마다 부모 — 시작 정점은 −1, 아직 표시하지 않은 정점은 null. */
  readonly par: readonly (number | null)[];
  /** 정점마다 나무 간선의 번호 — 시작 정점과 표시하지 않은 정점은 −1. */
  readonly treeEdge: readonly number[];
  /** 정점마다 표시한 걸음의 차례 — 아직이면 −1. */
  readonly markedAt: readonly number[];
  /** 정점마다 스택에서 꺼냈는가. */
  readonly popped: readonly boolean[];
  readonly stack: readonly number[];
  readonly from: readonly number[];
  /** 이웃 항목을 확인한 누적 횟수. */
  readonly checked: number;
  /** 바깥 반복이 시작한 누적 횟수. */
  readonly starts: number;
}

export interface Trace {
  readonly nbr: readonly (readonly number[])[];
  /** 이웃 항목마다 그 항목이 온 간선 번호 — `nbr` 과 같은 자리. */
  readonly nbrEdge: readonly (readonly number[])[];
  readonly steps: readonly Step[];
  readonly answer: boolean;
  /** 바깥 반복이 본 정점과 그때의 표시 — 반환하기 전까지. */
  readonly outer: readonly { readonly s: number; readonly seen: boolean }[];
}

interface TraceOptions {
  /** 부모를 건너뛴다(정본). false 면 건너뛰기 줄을 지운 사본이다. */
  readonly skipParent?: boolean;
  /** 정점 0 에서 한 번만 시작한다(바깥 반복을 지운 사본). */
  readonly onlyZero?: boolean;
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
  const nbr: number[][] = Array.from({ length: n }, () => []);
  const nbrEdge: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], k) => {
    (nbr[u] as number[]).push(v);
    (nbrEdge[u] as number[]).push(k);
    (nbr[v] as number[]).push(u);
    (nbrEdge[v] as number[]).push(k);
  });
  const skipParent = opts.skipParent ?? true;
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const par: (number | null)[] = Array.from({ length: n }, () => null);
  const treeEdge: number[] = Array.from({ length: n }, () => -1);
  const markedAt: number[] = Array.from({ length: n }, () => -1);
  const popped: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [];
  const from: number[] = [];
  const steps: Step[] = [];
  const outer: { s: number; seen: boolean }[] = [];
  let checked = 0;
  let starts = 0;
  let answer = false;

  const record = (
    s: Pick<Step, "kind" | "u" | "parent" | "v" | "slot" | "edge" | "seen">,
  ) =>
    steps.push({
      ...s,
      visited: [...visited],
      par: [...par],
      treeEdge: [...treeEdge],
      markedAt: [...markedAt],
      popped: [...popped],
      stack: [...stack],
      from: [...from],
      checked,
      starts,
    });

  const last = opts.onlyZero ? Math.min(n, 1) : n;
  scan: for (let s = 0; s < last; s++) {
    outer.push({ s, seen: visited[s] as boolean });
    if (visited[s]) continue;
    visited[s] = true;
    par[s] = NO_PARENT;
    markedAt[s] = steps.length;
    stack.push(s);
    from.push(NO_PARENT);
    starts++;
    record({
      kind: "start",
      u: s,
      parent: NO_PARENT,
      v: -1,
      slot: -1,
      edge: -1,
      seen: false,
    });
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const parent = from.pop() as number;
      popped[u] = true;
      const list = nbr[u] as number[];
      const ids = nbrEdge[u] as number[];
      for (let slot = 0; slot < list.length; slot++) {
        const v = list[slot] as number;
        const edge = ids[slot] as number;
        checked++;
        const seen = visited[v] as boolean;
        const at = { u, parent, v, slot, edge, seen };
        if (skipParent && v === parent) {
          record({ kind: "skip", ...at });
          continue;
        }
        if (seen) {
          answer = true;
          record({ kind: "found", ...at });
          break scan;
        }
        visited[v] = true;
        par[v] = u;
        treeEdge[v] = edge;
        markedAt[v] = steps.length;
        stack.push(v);
        from.push(u);
        record({ kind: "mark", ...at });
      }
    }
  }
  const plain = skipParent && !opts.onlyZero;
  if (plain && answer !== undirectedCycleDetection(n, [...edges])) {
    throw new Error(`사본의 답 ${answer} 이 정본과 다르다`);
  }
  return { nbr, nbrEdge, steps, answer, outer };
}

/** 전개 입력의 기록 — 걸음 재생 패널 · 그림 · 증명 블록이 모두 이것을 쓴다. */
export const WALK: Trace = traced(WALK_N, WALK_EDGES);

/** 기록의 `k` 번째 걸음의 번호 — T1 이 첫 걸음이다. */
export function stepOf(k: number): string {
  return `T${k + 1}`;
}

/** 걸음의 갈래 이름 — 걸음 표 · 패널 제목이 같은 말을 쓴다. */
export function branchLabel(s: Step): string {
  switch (s.kind) {
    case "start":
      return "시작";
    case "skip":
      return "① 부모라 건너뛴다";
    case "found":
      return "② 사이클이다";
    case "mark":
      return "③ 표시하고 넣는다";
  }
}

/** 갈래 이름에서 원문자를 뗀 것 — 원문자 라벨을 쓰지 않는 절(불변식)이 쓴다. */
const plainLabel = (s: Step): string => branchLabel(s).replace(/^[①②③] /, "");

/** 부모 값의 읽기 — 시작 정점은 「없음」, 표시 전은 「·」. */
export const parentText = (p: number | null): string =>
  p === null ? "·" : p === NO_PARENT ? "없음" : String(p);

/** 표시 배열 — `0:✓ 1:· 2:·` 꼴. */
const marks = (visited: readonly boolean[]): string =>
  visited.map((b, v) => `${v}:${b ? "✓" : "·"}`).join(" ");

/** 사이클을 닫은 걸음 — 없으면 −1. */
export const foundStep = (t: Trace): number =>
  t.steps.findIndex((s) => s.kind === "found");

/** 부모를 따라 시작 정점까지 올라간 길. */
function rootPath(s: Step, v: number): number[] {
  const out = [v];
  let cur = v;
  while ((s.par[cur] ?? NO_PARENT) !== NO_PARENT) {
    cur = s.par[cur] as number;
    out.push(cur);
  }
  return out;
}

/* ────────────────────── 세는 사본과 다른 절차 ────────────────────── */

interface Round {
  readonly removed: number;
  readonly reach: number[];
  readonly hit: boolean;
  readonly scans: number;
}

/**
 * 가장 단순한 방법 — **간선을 하나씩 지워 보고 두 끝이 아직 이어져 있는지 확인한다.**
 * 이어져 있으면 그 간선 없이도 가는 길이 있다는 뜻이라 사이클이다. 답은 맞는다.
 *
 * 세는 것은 **이웃 목록에서 읽은 이웃 수**다. 이웃 목록을 한 번 만드는 비용은 두 방식이
 * 같으므로 세지 않는다. 정점 1,000 개 이하면 지운 간선마다 갈 수 있던 정점과 읽은 수를 함께 낸다.
 */
function removeEachEdge(
  n: number,
  edges: readonly Edge[],
): { scans: number; answer: boolean; rounds: Round[] } {
  // 이웃 목록에 간선 번호를 함께 담는다 — 지운 간선 하나를 가려내야 한다.
  const nbr: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], i) => {
    (nbr[u] as number[]).push(v, i);
    (nbr[v] as number[]).push(u, i);
  });

  let scans = 0;
  const rounds: Round[] = [];
  const finish = (answer: boolean) => {
    if (answer !== undirectedCycleDetection(n, [...edges])) {
      throw new Error("간선을 지워 본 답이 정본과 다르다");
    }
    return { scans, answer, rounds };
  };
  for (let removed = 0; removed < edges.length; removed++) {
    const [u, v] = edges[removed] as Edge;
    if (u === v) return finish(true);
    const before = scans;
    const seen: boolean[] = Array.from({ length: n }, () => false);
    seen[u] = true;
    const queue: number[] = [u];
    while (queue.length > 0) {
      const x = queue.pop() as number;
      const list = nbr[x] as number[];
      for (let i = 0; i < list.length; i += 2) {
        scans++;
        if ((list[i + 1] as number) === removed) continue;
        const y = list[i] as number;
        if (seen[y]) continue;
        seen[y] = true;
        queue.push(y);
      }
    }
    const hit = seen[v] === true;
    if (n <= 1_000) {
      rounds.push({
        removed,
        reach: seen.flatMap((b, x) => (b ? [x] : [])),
        hit,
        scans: scans - before,
      });
    }
    if (hit) return finish(true);
  }
  return finish(false);
}

/**
 * 표시를 한 벌 두고 **한 번 순회만** 하는 사본 — 사이클 판정을 하지 않고 표시 없는 이웃만 따라간다.
 * 읽은 이웃 수만 센다. 무엇을 판정할지 정하기 전에 「한 번 순회하는 비용」을 재는 자리에 쓴다.
 */
function sweepOnce(n: number, edges: readonly Edge[]): number {
  const nbr = adjacency(n, edges);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  let scans = 0;
  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;
    visited[s] = true;
    const stack: number[] = [s];
    while (stack.length > 0) {
      const u = stack.pop() as number;
      for (const v of nbr[u] as number[]) {
        scans++;
        if (visited[v]) continue;
        visited[v] = true;
        stack.push(v);
      }
    }
  }
  return scans;
}

/**
 * 이 가이드의 절차에 **읽은 이웃 항목 수와 스택에 넣은 횟수**만 덧붙여 센 가벼운 사본. 배열을 베끼지
 * 않으므로 정점 10 만 개짜리 입력에도 쓴다. 답을 정본과 맞댄다.
 */
function scanOnce(
  n: number,
  edges: readonly Edge[],
): { scans: number; pushes: number; answer: boolean } {
  const nbr = adjacency(n, edges);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [];
  const from: number[] = [];
  let scans = 0;
  let pushes = 0;
  let answer = false;
  scan: for (let s = 0; s < n; s++) {
    if (visited[s]) continue;
    visited[s] = true;
    stack.push(s);
    from.push(NO_PARENT);
    pushes++;
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const parent = from.pop() as number;
      for (const v of nbr[u] as number[]) {
        scans++;
        if (v === parent) continue;
        if (visited[v]) {
          answer = true;
          break scan;
        }
        visited[v] = true;
        stack.push(v);
        from.push(u);
        pushes++;
      }
    }
  }
  if (answer !== undirectedCycleDetection(n, [...edges])) {
    throw new Error("가벼운 셈의 답이 정본과 다르다");
  }
  return { scans, pushes, answer };
}

/**
 * 같은 절차에 **배열 칸 접근 수**를 덧붙여 센 가벼운 사본. 칸을 한 번 읽으면 1, 한 번 쓰면 1이다.
 * `.alt.ts` 의 세는 사본과 같은 규칙을 쓴다. 답을 정본과 맞댄다.
 */
function countCells(
  n: number,
  edges: readonly Edge[],
): { cells: number; answer: boolean } {
  let cells = 0;
  const nbr: number[][] = Array.from({ length: n }, () => []);
  cells += n;
  for (const [u, v] of edges) {
    cells += 4;
    (nbr[u] as number[]).push(v);
    (nbr[v] as number[]).push(u);
  }
  const visited: boolean[] = Array.from({ length: n }, () => false);
  cells += n;
  const stack: number[] = [];
  const from: number[] = [];
  let answer = false;
  scan: for (let s = 0; s < n; s++) {
    cells++;
    if (visited[s]) continue;
    cells += 3;
    visited[s] = true;
    stack.push(s);
    from.push(NO_PARENT);
    while (stack.length > 0) {
      cells += 3;
      const u = stack.pop() as number;
      const parent = from.pop() as number;
      for (const v of nbr[u] as number[]) {
        cells++;
        if (v === parent) continue;
        cells++;
        if (visited[v]) {
          answer = true;
          break scan;
        }
        cells += 3;
        visited[v] = true;
        stack.push(v);
        from.push(u);
      }
    }
  }
  if (answer !== undirectedCycleDetection(n, [...edges])) {
    throw new Error("칸 접근 셈의 답이 정본과 다르다");
  }
  return { cells, answer };
}

/**
 * 끝까지 확인하며 간선을 **나무 간선과 여분 간선으로 가른다.** 사이클을 만나도 멈추지 않는
 * 사본이라 여분 간선의 개수를 셀 수 있다 — 정본은 첫 여분 간선에서 반환하므로 셀 수 없다.
 * 여분 간선이 있는가를 정본의 답과 맞댄다.
 */
function classifyEdges(
  n: number,
  edges: readonly Edge[],
): { tree: number; extra: number; parts: number; isTree: boolean[] } {
  const nbr: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], i) => {
    (nbr[u] as number[]).push(v, i);
    (nbr[v] as number[]).push(u, i);
  });
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const isTree: boolean[] = Array.from({ length: edges.length }, () => false);
  let parts = 0;
  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;
    parts++;
    visited[s] = true;
    const stack: number[] = [s];
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const list = nbr[u] as number[];
      for (let i = 0; i < list.length; i += 2) {
        const v = list[i] as number;
        if (visited[v]) continue;
        visited[v] = true;
        isTree[list[i + 1] as number] = true;
        stack.push(v);
      }
    }
  }
  const tree = isTree.filter(Boolean).length;
  const extra = edges.length - tree;
  if (extra > 0 !== undirectedCycleDetection(n, [...edges])) {
    throw new Error("여분 간선의 유무가 정본의 답과 다르다");
  }
  return { tree, extra, parts, isTree };
}

/** 표시된 이웃을 **전부** 건너뛰는 후보. 사이클을 하나도 못 찾는다. */
function skipAllVisited(n: number, edges: readonly Edge[]): boolean {
  const nbr = adjacency(n, edges);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;
    visited[s] = true;
    const stack: number[] = [s];
    while (stack.length > 0) {
      const u = stack.pop() as number;
      for (const v of nbr[u] as number[]) {
        if (visited[v]) continue;
        visited[v] = true;
        stack.push(v);
      }
    }
  }
  return false;
}

/**
 * 지나온 **간선 번호** 하나를 건너뛰는 후보. 정본은 부모의 **정점 번호**를 건너뛴다.
 * 둘이 갈리는 자리는 같은 정점 쌍을 두 번 이은 간선인데, 실제로 갈리는지는 값이 답한다.
 */
function skipByEdgeId(n: number, edges: readonly Edge[]): boolean {
  const nbr: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], i) => {
    (nbr[u] as number[]).push(v, i);
    (nbr[v] as number[]).push(u, i);
  });
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [];
  const via: number[] = [];
  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;
    visited[s] = true;
    stack.push(s);
    via.push(-1);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const entered = via.pop() as number;
      const list = nbr[u] as number[];
      for (let i = 0; i < list.length; i += 2) {
        const v = list[i] as number;
        const id = list[i + 1] as number;
        if (id === entered) continue;
        if (visited[v]) return true;
        visited[v] = true;
        stack.push(v);
        via.push(id);
      }
    }
  }
  return false;
}

/**
 * 표시를 **꺼낼 때** 하는 판. 넣을 때는 표시하지 않으므로, 스택 안에서 기다리는 정점을 다른 이웃이
 * 표시 없는 정점으로 보고 한 번 더 넣을 수 있다. 넣은 횟수를 센다.
 */
function markOnPop(
  n: number,
  edges: readonly Edge[],
): { pushes: number; answer: boolean } {
  const nbr = adjacency(n, edges);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [];
  const from: number[] = [];
  let pushes = 0;
  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;
    stack.push(s);
    from.push(NO_PARENT);
    pushes++;
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const parent = from.pop() as number;
      visited[u] = true;
      for (const v of nbr[u] as number[]) {
        if (v === parent) continue;
        if (visited[v]) return { pushes, answer: true };
        stack.push(v);
        from.push(u);
        pushes++;
      }
    }
  }
  return { pushes, answer: false };
}

/** 유니온 파인드로 답만 낸다. 위 사본들의 답이 옳은지 정본과 따로 대조하는 자리에 쓴다. */
function unionFindAnswer(n: number, edges: readonly Edge[]): boolean {
  const rep = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    let cur = x;
    while ((rep[cur] as number) !== cur) {
      rep[cur] = rep[rep[cur] as number] as number;
      cur = rep[cur] as number;
    }
    return cur;
  };
  for (const [u, v] of edges) {
    const a = find(u);
    const b = find(v);
    if (a === b) return true;
    rep[a] = b;
  }
  return false;
}

/**
 * 서로 다른 사이클의 개수 — 간선 부분집합 가운데 쓰인 정점마다 차수가 정확히 2 이고 한 덩어리로
 * 이어진 것을 센다. 간선이 스무 개 이하인 작은 입력에만 쓴다.
 */
function countCycles(n: number, edges: readonly Edge[]): number {
  const m = edges.length;
  if (m > 20) throw new Error("사이클을 전수로 세기에는 간선이 많다");
  let count = 0;
  for (let mask = 1; mask < 1 << m; mask++) {
    const deg: number[] = Array.from({ length: n }, () => 0);
    const picked: Edge[] = [];
    for (let i = 0; i < m; i++) {
      if (((mask >> i) & 1) === 0) continue;
      const [u, v] = edges[i] as Edge;
      picked.push([u, v]);
      deg[u] = (deg[u] as number) + 1;
      deg[v] = (deg[v] as number) + 1;
    }
    if (deg.some((d) => d !== 0 && d !== 2)) continue;
    // 한 덩어리인가 — 쓰인 정점을 묶어 대표가 하나인지 본다.
    const rep = Array.from({ length: n }, (_, i) => i);
    const find = (x: number): number => {
      let cur = x;
      while ((rep[cur] as number) !== cur) cur = rep[cur] as number;
      return cur;
    };
    for (const [u, v] of picked) rep[find(u)] = find(v);
    const roots = new Set(deg.flatMap((d, v) => (d === 2 ? [find(v)] : [])));
    if (roots.size === 1) count++;
  }
  return count;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Ref {
  undirectedCycleDetection(n: number, edges: Edge[]): boolean;
}

const REF_PATH = new URL(
  "./undirectedCycleDetection-guide.ref.ts",
  import.meta.url,
).pathname;

/**
 * 부모를 건너뛰던 줄을 **지운** 사본. 무향 간선을 되돌아 걸어가는 것까지 사이클로 읽어, 간선
 * 하나짜리 그래프에도 `true` 를 답한다.
 */
const noSkipMutant = await loadMutant<Ref>(REF_PATH, {
  drop: /^\s+if \(v === parent\) continue;/,
});

/** 간선을 **한쪽 목록에만** 넣는 사본. 적힌 앞 끝에서만 걸어갈 수 있게 된다. */
const oneSidedMutant = await loadMutant<Ref>(REF_PATH, {
  drop: /^\s+\(nbr\[v\] as number\[\]\)\.push\(u\);/,
});

/** 바깥 반복이 정점 0 **한 번만** 시작하는 사본. */
const onlyZeroMutant = await loadMutant<Ref>(REF_PATH, {
  swap: [/s < n;/, "s < 1;"],
});

/* ────────────────────────── 입력 묶음 ────────────────────────── */

interface Case {
  readonly label: string;
  readonly n: number;
  readonly edges: Edge[];
}

const DOUBLE: Edge[] = [
  [0, 1],
  [0, 1],
];
const SELF: Edge[] = [[0, 0]];

const SMALL: Case[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
  { label: "별 모양 네 정점", n: 4, edges: star(4) },
  { label: "삼각형", n: 3, edges: ring(3) },
  { label: "같은 쌍을 두 번 이은 간선", n: 2, edges: DOUBLE },
  { label: "자기 자신을 잇는 간선", n: 2, edges: SELF },
];

/** 「아이디어 상세」가 걸음 하나를 멈춰 읽는 순간 — 정점 여섯이 모두 표시된 T8. */
export const MOMENT = 7;

const CAP = 100_000;

/* ─────────────────── 「전체 컨셉」 ─────────────────── */

/** 간선 번호 — 무향이라 두 끝을 어느 차례로 물어도 같은 간선이다. */
export const edgeIndex = (
  edges: readonly Edge[],
  a: number,
  b: number,
): number =>
  edges.findIndex(([u, v]) => (u === a && v === b) || (u === b && v === a));

/** 전개 입력의 사이클 — 여분 간선의 두 끝에서 부모를 따라 올라가 만나는 자리까지 잇는다. */
export function walkCycle(): number[] {
  const s = WALK.steps[foundStep(WALK)] as Step;
  const a = rootPath(s, s.u);
  const b = rootPath(s, s.v);
  const meet = a.find((x) => b.includes(x)) as number;
  const up = a.slice(0, a.indexOf(meet) + 1);
  const down = b.slice(0, b.indexOf(meet)).reverse();
  return [...up, ...down];
}

function conceptWalks(): string {
  const closed = (path: number[]) => {
    const used = path
      .slice(0, -1)
      .map((x, i) => edgeIndex(WALK_EDGES, x, path[i + 1] as number));
    const twice = used.filter((e, i) => used.indexOf(e) !== i);
    return [
      path.join(" → "),
      used.map((e) => edgeName(WALK_EDGES[e] as Edge)).join(" · "),
      twice.length === 0
        ? "없다"
        : twice.map((e) => edgeName(WALK_EDGES[e] as Edge)).join(" · "),
      twice.length === 0 ? "사이클이다" : "사이클이 아니다",
    ];
  };
  // 정점 번호가 가장 작은 정점에서 출발하도록 돌려 적는다 — 같은 사이클이다.
  const raw = walkCycle();
  const at = raw.indexOf(Math.min(...raw));
  const cyc = [...raw.slice(at), ...raw.slice(0, at)];
  return withSentence(
    md(
      ["닫힌 길", "쓴 간선", "두 번 쓴 간선", "판정"],
      [closed([...cyc, cyc[0] as number]), closed([0, 1, 0])],
    ),
    `전개 입력에 정본을 실행한 답은 ${yn(undirectedCycleDetection(WALK_N, WALK_EDGES))} 입니다.`,
  );
}

function conceptSpecial(): string {
  const cases: Case[] = [
    { label: "자기 자신을 잇는 간선", n: 2, edges: SELF },
    { label: "같은 쌍을 두 번 이은 간선", n: 2, edges: DOUBLE },
    { label: "간선 하나", n: 2, edges: [[0, 1]] },
  ];
  return md(
    ["입력", "간선 목록", "이웃 목록", "정본의 답"],
    cases.map((c) => {
      const nbr = adjacency(c.n, c.edges);
      return [
        c.label,
        edgeList(c.edges),
        nbr
          .flatMap((l, v) => (l.length > 0 ? [`nbr[${v}] = ${show(l)}`] : []))
          .join(" · "),
        yn(undirectedCycleDetection(c.n, c.edges)),
      ];
    }),
  );
}

/* ─────────────────── 「아이디어를 떠올리는 과정」 ─────────────────── */

function naiveScale(): string {
  const cases: Case[] = [
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
    { label: "한 줄로 이은 10 정점", n: 10, edges: chain(10) },
    { label: "한 줄로 이은 100 정점", n: 100, edges: chain(100) },
    { label: "한 줄로 이은 1,000 정점", n: 1_000, edges: chain(1_000) },
    { label: "한 줄로 이은 2,000 정점", n: 2_000, edges: chain(2_000) },
  ];
  const runs = cases.map((c) => ({ c, r: removeEachEdge(c.n, c.edges) }));
  const lines = runs.filter((x) => x.c.label.startsWith("한 줄"));
  const fits = lines.every(
    (x) => x.r.scans === x.c.edges.length * x.c.edges.length,
  );
  const e = CAP - 1;
  return withSentence(
    md(
      ["입력", "정점 V", "간선 E", "읽은 이웃 수"],
      runs.map(({ c, r }) => [
        c.label,
        comma(c.n),
        comma(c.edges.length),
        comma(r.scans),
      ]),
      [1, 2, 3],
    ),
    `한 줄 입력 ${lines.length} 줄은 읽은 이웃 수가 ${fits ? "모두" : "모두는 아니게"} E × E 와 같습니다. 규모 상한의 한 줄(간선 ${comma(e)} 개)을 그 식에 넣으면 ${comma(e * e)} 입니다.`,
  );
}

function naiveRepeat(): string {
  const edges = chain(4);
  const r = removeEachEdge(4, edges);
  const nested = r.rounds.every(
    (x, i) =>
      i === 0 ||
      (r.rounds[i - 1] as Round).reach.every((y) => x.reach.includes(y)),
  );
  const total = r.rounds.reduce((a, x) => a + x.scans, 0);
  return withSentence(
    md(
      ["지운 간선", "출발한 끝", "갈 수 있는 정점", "다른 끝", "읽은 이웃 수"],
      r.rounds.map((x) => {
        const [u, v] = edges[x.removed] as Edge;
        return [
          edgeName([u, v]),
          String(u),
          show(x.reach),
          x.hit ? `${v} 에 이른다` : `${v} 에 못 이른다`,
          String(x.scans),
        ];
      }),
      [4],
    ),
    `${nested ? "뒤 줄이 갈 수 있는 정점은 앞 줄이 갈 수 있는 정점을 모두 품고 있습니다" : "뒤 줄이 앞 줄을 품지 않는 자리가 있습니다"}. 읽은 이웃 수는 모두 합해 ${total} 이고, 정본의 답은 ${yn(undirectedCycleDetection(4, edges))} 입니다.`,
  );
}

function markValues(): string {
  const cases: Case[] = [
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
    { label: "한 줄로 이은 10 정점", n: 10, edges: chain(10) },
    { label: "별 모양 1,000 정점", n: 1_000, edges: star(1_000) },
    { label: "한 줄로 이은 1,000 정점", n: 1_000, edges: chain(1_000) },
    { label: "고리 1,000 정점", n: 1_000, edges: ring(1_000) },
  ];
  const runs = cases.map((c) => ({
    c,
    a: removeEachEdge(c.n, c.edges).scans,
    b: sweepOnce(c.n, c.edges),
  }));
  const allTwoE = runs.every((x) => x.b === 2 * x.c.edges.length);
  const line = runs[3] as (typeof runs)[number];
  return withSentence(
    md(
      ["입력", "E", "간선 지워 보기", "한 번 순회", "2E", "정본의 답"],
      runs.map(({ c, a, b }) => [
        c.label,
        comma(c.edges.length),
        comma(a),
        comma(b),
        comma(2 * c.edges.length),
        yn(undirectedCycleDetection(c.n, c.edges)),
      ]),
      [1, 2, 3, 4],
    ),
    `${runs.length} 줄 ${allTwoE ? "모두" : "가운데 일부에서만"} 한 번 순회할 때 읽은 이웃 수가 2E 와 같습니다. ${line.c.label}에서는 ${comma(line.a)}${과와(comma(line.a))} ${comma(line.b)}${으로(comma(line.b))} ${(line.a / line.b).toFixed(1)} 배 차이입니다.`,
  );
}

/** 한 번 순회하다가 표시된 이웃을 만나면 사이클이라고 답하는 후보 — 간선 하나짜리 그래프에서. */
function firstCandidate(): string {
  const edges: Edge[] = [[0, 1]];
  const t = traced(2, edges, { skipParent: false });
  const neutral =
    noSkipMutant.undirectedCycleDetection === undirectedCycleDetection;
  // 기록 사본의 답을 변이의 답과 맞댄다. 중화 실행에서는 변이가 정본이라 그 대조만 건너뛴다.
  if (
    !neutral &&
    t.answer !== noSkipMutant.undirectedCycleDetection(2, edges)
  ) {
    throw new Error("후보 사본의 답이 변이의 답과 다르다");
  }
  const rows = t.steps.map((s, k) =>
    s.kind === "start"
      ? [stepOf(k), "—", "—", "—", `정점 ${s.u}${을를(s.u)} 표시하고 넣는다`]
      : [
          stepOf(k),
          String(s.u),
          String(s.v),
          s.seen ? "있다" : "없다",
          s.kind === "found"
            ? "사이클이라고 답한다"
            : `${s.v}${을를(s.v)} 표시하고 넣는다`,
        ],
  );
  return withSentence(
    md(["걸음", "꺼낸 정점", "이웃", "그 이웃의 표시", "한 일"], rows),
    `이 후보의 답은 ${yn(t.answer)} 입니다. 간선이 하나뿐이라 사이클이 없고, 정본의 답은 ${yn(undirectedCycleDetection(2, edges))} 입니다.`,
  );
}

function skipChoice(): string {
  const rows = SMALL.map((c) => ({
    c,
    a: noSkipMutant.undirectedCycleDetection(c.n, c.edges),
    b: skipAllVisited(c.n, c.edges),
    p: traced(c.n, c.edges).answer,
    right: unionFindAnswer(c.n, c.edges),
  }));
  const miss = (pick: (x: (typeof rows)[number]) => boolean) =>
    rows.filter((x) => pick(x) !== x.right).length;
  return withSentence(
    md(
      [
        "입력",
        "아무것도 안 건너뛰기",
        "표시된 이웃 전부 건너뛰기",
        "부모 하나만 건너뛰기",
        "옳은 답",
      ],
      rows.map((x) => [x.c.label, yn(x.a), yn(x.b), yn(x.p), yn(x.right)]),
    ),
    `옳은 답은 유니온 파인드로 따로 낸 값입니다. 입력 ${rows.length} 개 가운데 옳은 답과 다른 줄은 아무것도 안 건너뛰는 후보가 ${miss((x) => x.a)} 개, 표시된 이웃을 전부 건너뛰는 후보가 ${miss((x) => x.b)} 개, 부모 하나만 건너뛰는 후보가 ${miss((x) => x.p)} 개입니다.`,
  );
}

/** 사다리 그림이 쓰는 수 — 위 블록과 같은 실행에서 받는다. */
export function ladderNumbers() {
  const line = chain(1_000);
  const e = CAP - 1;
  return {
    naiveLine: removeEachEdge(1_000, line).scans,
    naiveCap: e * e,
    sweepLine: sweepOnce(1_000, line),
    noSkipOne: traced(2, [[0, 1]], { skipParent: false }).answer,
    oneRef: undirectedCycleDetection(2, [[0, 1]]),
    skipAllTriangle: skipAllVisited(3, ring(3)),
    triangleRef: undirectedCycleDetection(3, ring(3)),
    walkChecked: WALK.steps.at(-1)?.checked ?? 0,
    walkTwoE: 2 * WALK_EDGES.length,
  };
}

/* ─────────────────── 「아이디어 상세」 ─────────────────── */

function treeRead(): string {
  const s = WALK.steps[MOMENT] as Step;
  const rows = s.visited.map((_, v) => {
    const e = s.treeEdge[v] as number;
    return [
      String(v),
      stepOf(s.markedAt[v] as number),
      parentText(s.par[v] ?? null),
      e < 0 ? "—" : edgeName(WALK_EDGES[e] as Edge),
      s.popped[v] ? "꺼냈다" : "스택에 있다",
    ];
  });
  return withSentence(
    md(
      ["정점", "표시한 걸음", "부모", "부모와 잇는 나무 간선", "꺼냈는가"],
      rows,
    ),
    `${stepOf(MOMENT)} 직후 스택은 ${show(s.stack)}, from 은 ${show(s.from)} 입니다.`,
  );
}

interface Relation {
  readonly label: string;
  readonly holds: (s: Step, edges: readonly Edge[]) => boolean;
}

const RELATIONS: Relation[] = [
  {
    label: "나무 간선 수 = 표시된 정점 수 − 시작한 횟수",
    holds: (s) =>
      s.treeEdge.filter((e) => e >= 0).length ===
      s.visited.filter(Boolean).length - s.starts,
  },
  {
    label:
      "시작 정점이 아닌 표시된 정점은 부모가 하나 있고, 그 부모도 표시돼 있다",
    holds: (s) =>
      s.visited.every((b, v) => {
        if (!b) return s.par[v] === null;
        const p = s.par[v] as number;
        return p === NO_PARENT || s.visited[p] === true;
      }),
  },
  {
    label: "나무 간선만 따라가면 사이클이 없다",
    holds: (s, edges) =>
      !unionFindAnswer(
        s.visited.length,
        s.treeEdge.filter((e) => e >= 0).map((e) => edges[e] as Edge),
      ),
  },
  {
    label: "stack 과 from 의 길이가 같다",
    holds: (s) => s.stack.length === s.from.length,
  },
];

function treeRelation(): string {
  const rows = RELATIONS.map((r) => {
    const bad = WALK.steps.filter((s) => !r.holds(s, WALK_EDGES)).length;
    return [r.label, String(WALK.steps.length), String(bad)];
  });
  const bad = rows.reduce((a, r) => a + Number(r[2]), 0);
  return withSentence(
    md(["관계", "확인한 걸음", "어긋난 걸음"], rows, [1, 2]),
    `${stepOf(0)} 부터 ${stepOf(WALK.steps.length - 1)} 까지 ${WALK.steps.length} 걸음마다 관계 ${RELATIONS.length} 개를 쟀고, 어긋난 자리는 ${bad} 개입니다.`,
  );
}

function treeVsStack(): string {
  const rows = WALK.steps.flatMap((s, k) => {
    if (s.stack.length === 0) return [];
    const parents = s.stack.map((v) => parentText(s.par[v] ?? null));
    const inside = s.stack.filter((v) => {
      const p = s.par[v] as number;
      return p !== NO_PARENT && s.stack.includes(p);
    });
    return [
      [
        stepOf(k),
        show(s.stack),
        show(parents),
        inside.length === 0 ? "없다" : show(inside),
      ],
    ];
  });
  const withParent = rows.filter((r) => r[3] !== "없다").length;
  return withSentence(
    md(
      ["걸음", "스택", "스택에 든 정점의 부모", "부모와 함께 스택에 든 정점"],
      rows,
    ),
    `스택이 비지 않은 걸음 ${rows.length} 개 가운데 부모와 자식이 스택에 함께 든 걸음은 ${withParent} 개입니다.`,
  );
}

function buildLists(): string {
  const total = WALK.nbr.reduce((a, l) => a + l.length, 0);
  return withSentence(
    md(
      ["정점 u", "nbr[u]", "길이"],
      WALK.nbr.map((l, u) => [String(u), show(l), String(l.length)]),
      [0, 2],
    ),
    `길이를 모두 더하면 ${total} 이고, 간선 ${WALK_EDGES.length} 개의 두 배입니다.`,
  );
}

function buildStarts(): string {
  const startAt = new Map<number, number>();
  WALK.steps.forEach((s, k) => {
    if (s.kind === "start") startAt.set(s.u, k);
  });
  const rows = WALK.outer.map(({ s, seen }) => [
    String(s),
    seen ? "참" : "거짓",
    seen ? "넘어간다" : "표시하고 스택에 넣는다",
    seen ? "—" : stepOf(startAt.get(s) as number),
  ]);
  const last = (WALK.outer.at(-1) as { s: number }).s;
  const unseen = WALK_N - 1 - last;
  return withSentence(
    md(["시작 후보 s", "그때의 visited[s]", "한 일", "걸음"], rows, [0]),
    `바깥 반복은 정점 ${WALK.outer.length} 개를 본 뒤 멈췄고, 그중 시작한 것은 ${startAt.size} 번입니다.${unseen > 0 ? ` 정점 ${last + 1} 부터 ${WALK_N - 1} 까지는 그 전에 답이 나와 보지 않았습니다.` : ""}`,
  );
}

function buildMark(): string {
  const picked = WALK.steps
    .map((s, k) => ({ s, k }))
    .filter(({ s }) => s.kind === "mark");
  const same = picked.every(({ s }) => s.from.at(-1) === s.u);
  return withSentence(
    md(
      [
        "걸음",
        "꺼낸 정점",
        "이웃",
        "그 이웃의 표시",
        "넣은 뒤 stack",
        "넣은 뒤 from",
      ],
      picked.map(({ s, k }) => [
        stepOf(k),
        String(s.u),
        String(s.v),
        s.seen ? "있다" : "없다",
        show(s.stack),
        show(s.from),
      ]),
    ),
    `③ 은 ${picked.length} 번 실행됐고, 매번 from 맨 뒤에 넣은 값이 그 걸음에 꺼낸 정점${same ? "과 같습니다" : "과 다른 자리가 있습니다"}.`,
  );
}

function edgeScanValues(): string {
  const cases: Case[] = [
    { label: "한 줄로 이은 10 정점", n: 10, edges: chain(10) },
    { label: "별 모양 10 정점", n: 10, edges: star(10) },
    { label: "정점 10 개를 둘씩 짝지은 숲", n: 10, edges: forest(10, 2) },
    { label: "한 줄로 이은 1,000 정점", n: 1_000, edges: chain(1_000) },
    { label: "별 모양 1,000 정점", n: 1_000, edges: star(1_000) },
  ];
  const runs = cases.map((c) => ({ c, r: scanOnce(c.n, c.edges) }));
  const ok = runs.every(
    ({ c, r }) => r.scans === 2 * c.edges.length && r.pushes === c.n,
  );
  return withSentence(
    md(
      [
        "입력",
        "V",
        "E",
        "확인한 이웃 항목",
        "2E",
        "스택에 넣은 횟수",
        "정본의 답",
      ],
      runs.map(({ c, r }) => [
        c.label,
        comma(c.n),
        comma(c.edges.length),
        comma(r.scans),
        comma(2 * c.edges.length),
        comma(r.pushes),
        yn(r.answer),
      ]),
      [1, 2, 3, 4, 5],
    ),
    `사이클이 없는 입력 ${runs.length} 개 ${ok ? "모두" : "가운데 일부만"} 확인한 이웃 항목이 2E 와, 스택에 넣은 횟수가 V 와 같습니다.`,
  );
}

function buildSkip(): string {
  const picked = WALK.steps
    .map((s, k) => ({ s, k }))
    .filter(({ s }) => s.kind === "skip");
  const rows = picked.map(({ s, k }) => ({
    row: [
      stepOf(k),
      String(s.u),
      String(s.parent),
      String(s.v),
      edgeName(WALK_EDGES[s.edge] as Edge),
      stepOf(s.markedAt[s.u] as number),
    ],
    sameEdge: s.treeEdge[s.u] === s.edge,
  }));
  const all = rows.every((r) => r.sameEdge);
  return withSentence(
    md(
      [
        "걸음",
        "꺼낸 정점",
        "부모",
        "이웃",
        "그 항목의 간선",
        "그 간선이 나무 간선이 된 걸음",
      ],
      rows.map((r) => r.row),
    ),
    `건너뛴 ${rows.length} 번 ${all ? "모두" : "가운데 일부만"} 꺼낸 정점을 표시할 때 쓴 나무 간선을 반대쪽 끝에서 읽은 것입니다.`,
  );
}

function buildSquare(): string {
  const t = traced(4, ring(4));
  const rows = t.steps.map((s, k) => [
    stepOf(k),
    s.kind === "start"
      ? `정점 ${s.u} 에서 시작`
      : `${s.u} 의 이웃 ${s.v} · ${branchLabel(s)}`,
    marks(s.visited),
    show(s.stack),
    show(s.from),
  ]);
  const k = foundStep(t);
  const s = t.steps[k] as Step;
  const waited = !s.popped[s.v] && s.stack.includes(s.v);
  return withSentence(
    md(["걸음", "한 일", "visited", "stack", "from"], rows),
    `${stepOf(k)} 에서 정점 ${s.v}${은는(s.v)} ${waited ? `스택 ${show(s.stack)} 에 든 채 아직 꺼내지 않았지만` : "이미 꺼낸 뒤였고"} ${stepOf(s.markedAt[s.v] as number)} 에 표시돼 있어, 정점 ${s.u}${이가(s.u)} 그 표시를 읽고 ${yn(t.answer)} 를 돌려줍니다.`,
  );
}

function buildClose(): string {
  const k = foundStep(WALK);
  const s = WALK.steps[k] as Step;
  const a = rootPath(s, s.u);
  const b = rootPath(s, s.v);
  const meet = a.find((x) => b.includes(x)) as number;
  const cyc = walkCycle();
  const closedPath = [...cyc, cyc[0] as number];
  const used = closedPath
    .slice(0, -1)
    .map((x, i) => edgeIndex(WALK_EDGES, x, closedPath[i + 1] as number));
  const distinct = new Set(used).size === used.length;
  return columns([
    [
      `${stepOf(k)} 에 확인한 이웃 항목`,
      `${s.u} 의 목록에서 ${s.v} — 간선 ${edgeName(WALK_EDGES[s.edge] as Edge)}`,
    ],
    [`${s.u} 에서 부모를 따라 오른 길`, a.join(" → ")],
    [`${s.v} 에서 부모를 따라 오른 길`, b.join(" → ")],
    ["두 길이 만나는 정점", String(meet)],
    ["이어 붙인 닫힌 길", closedPath.join(" → ")],
    [
      "같은 간선을 두 번 썼는가",
      distinct ? "아니다 — 사이클이다" : "그렇다 — 사이클이 아니다",
    ],
  ]);
}

const ONE_SIDED_CASES: Case[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  {
    label: "같은 쌍을 [0,1] 과 [1,0] 으로 적은 것",
    n: 2,
    edges: [
      [0, 1],
      [1, 0],
    ],
  },
  {
    label: "이어지지 않은 두 간선 [0,1] · [2,0]",
    n: 3,
    edges: [
      [0, 1],
      [2, 0],
    ],
  },
  {
    label: "이어지지 않은 두 간선 [0,1] · [2,1]",
    n: 3,
    edges: [
      [0, 1],
      [2, 1],
    ],
  },
  { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
];

function mutantOneSided(): string {
  return md(
    ["입력", "두 목록에 넣기 (정본)", "한쪽 목록에만 넣기", "두 답"],
    ONE_SIDED_CASES.map((c) => {
      const a = undirectedCycleDetection(c.n, c.edges);
      const b = oneSidedMutant.undirectedCycleDetection(c.n, c.edges);
      return [c.label, yn(a), yn(b), a === b ? "같다" : "어긋난다"];
    }),
  );
}

function oneSidedTrace(): string {
  // 한쪽 목록에만 넣은 사본이 [0,1] · [2,0] 에서 만드는 이웃 목록과 두 번째 시작.
  const c = ONE_SIDED_CASES[2] as Case;
  const one: number[][] = Array.from({ length: c.n }, () => []);
  for (const [u, v] of c.edges) (one[u] as number[]).push(v);
  return columns([
    [
      "한쪽 목록에만 넣으면",
      one.map((l, v) => `nbr[${v}] = ${show(l)}`).join("   "),
    ],
    [
      "정점 0 에서 시작",
      `0 을 꺼내 이웃 ${(one[0] as number[]).join(", ")}${을를((one[0] as number[]).at(-1) as number)} 표시한다`,
    ],
    ["정점 1", "이미 표시돼 있어 바깥 반복이 넘어간다"],
    [
      "정점 2 에서 시작",
      `이웃 0 은 부모가 아니고 표시돼 있다 → ${yn(oneSidedMutant.undirectedCycleDetection(c.n, c.edges))}`,
    ],
    ["정본의 답", yn(undirectedCycleDetection(c.n, c.edges))],
  ]);
}

function markWhen(): string {
  const cases: Case[] = [
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
    { label: "사각형", n: 4, edges: ring(4) },
    { label: "삼각형", n: 3, edges: ring(3) },
    { label: "정점 넷을 모두 이은 것", n: 4, edges: complete(4) },
    { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
    { label: "별 모양 네 정점", n: 4, edges: star(4) },
  ];
  const runs = cases.map((c) => ({
    c,
    push: scanOnce(c.n, c.edges),
    pop: markOnPop(c.n, c.edges),
  }));
  const differ = runs.filter((x) => x.push.answer !== x.pop.answer).length;
  const over = runs.filter((x) => x.pop.pushes > x.c.n).length;
  const pushOver = runs.filter((x) => x.push.pushes > x.c.n).length;
  return withSentence(
    md(
      [
        "입력",
        "V",
        "넣을 때 표시 — 넣은 횟수",
        "꺼낼 때 표시 — 넣은 횟수",
        "넣을 때 표시 — 답",
        "꺼낼 때 표시 — 답",
      ],
      runs.map(({ c, push, pop }) => [
        c.label,
        String(c.n),
        String(push.pushes),
        String(pop.pushes),
        yn(push.answer),
        yn(pop.answer),
      ]),
      [1, 2, 3],
    ),
    `답이 갈린 입력은 ${differ} 개입니다. 넣은 횟수가 V 를 넘은 입력은 넣을 때 표시하는 판에서 ${pushOver} 개, 꺼낼 때 표시하는 판에서 ${over} 개입니다.`,
  );
}

/* ─────────────────── 「수행으로 알아보는 알고리즘」 ─────────────────── */

function walkInput(): string {
  const list = WALK_EDGES.map(([u, v]) => `[${u}, ${v}]`).join(", ");
  return [
    `const n = ${WALK_N};`,
    `const edges: [number, number][] = [${list}];`,
    `// 이 절이 끝나면 ${yn(undirectedCycleDetection(WALK_N, WALK_EDGES))} 가 나와야 한다`,
  ].join("\n");
}

function walkLists(): string {
  const rows: string[][] = WALK.nbr.map((l, u) => {
    const src = (WALK.nbrEdge[u] as number[])
      .map((e) => edgeName(WALK_EDGES[e] as Edge))
      .join(" · ");
    return [
      `nbr[${u}] = ${show(l)}`,
      l.length === 0 ? "이웃이 없다" : `${src} 에서 넣었다`,
    ];
  });
  const total = WALK.nbr.reduce((a, l) => a + l.length, 0);
  return columns([
    ...rows,
    ["목록 길이의 합", `${total} = 2E`],
    [
      `visited = ${show(Array.from({ length: WALK_N }, () => "false"))}`,
      "아직 아무것도 표시하지 않았다",
    ],
    [`stack = ${show([])}`, `from = ${show([])}`],
  ]);
}

function walkPop3(): string {
  const picked = WALK.steps
    .map((s, k) => ({ s, k }))
    .filter(({ s }) => s.kind !== "start" && s.u === 3);
  return columns(
    picked.map(({ s, k }) => [
      stepOf(k),
      `v = ${s.v}`,
      s.kind === "skip"
        ? `${s.v} === ${s.parent} 참`
        : `${s.v} === ${s.parent} 거짓 · visited[${s.v}] ${s.seen ? "참" : "거짓"}`,
      branchLabel(s),
      `stack ${show(s.stack)}`,
      `from ${show(s.from)}`,
    ]),
  );
}

function parentVsEdge(): string {
  const cases: Case[] = [
    { label: "같은 쌍을 두 번 이은 간선", n: 2, edges: DOUBLE },
    {
      label: "가운데 쌍만 두 번 이은 한 줄",
      n: 4,
      edges: [
        [0, 1],
        [1, 2],
        [1, 2],
        [2, 3],
      ],
    },
    {
      label: "같은 쌍을 세 번 이은 간선",
      n: 2,
      edges: [
        [0, 1],
        [0, 1],
        [0, 1],
      ],
    },
    { label: "자기 자신을 잇는 간선", n: 2, edges: SELF },
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
    { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
  ];
  // 정점 넷 · 간선 넷 이하인 다중그래프를 전부 만들어 셋을 대조한다.
  const pairs: Edge[] = [];
  for (let u = 0; u < 4; u++) for (let v = u; v < 4; v++) pairs.push([u, v]);
  let checked = 0;
  let differ = 0;
  const walk = (depth: number, acc: Edge[]): void => {
    if (depth === 0) {
      checked++;
      const ref = undirectedCycleDetection(4, acc);
      if (ref !== skipByEdgeId(4, acc) || ref !== unionFindAnswer(4, acc)) {
        differ++;
      }
      return;
    }
    for (const p of pairs) {
      acc.push(p);
      walk(depth - 1, acc);
      acc.pop();
    }
  };
  for (let m = 0; m <= 4; m++) walk(m, []);
  return withSentence(
    md(
      [
        "입력",
        "부모의 정점 번호 건너뛰기 (정본)",
        "지나온 간선 번호 건너뛰기",
        "옳은 답",
      ],
      cases.map((c) => [
        c.label,
        yn(undirectedCycleDetection(c.n, c.edges)),
        yn(skipByEdgeId(c.n, c.edges)),
        yn(unionFindAnswer(c.n, c.edges)),
      ]),
    ),
    `옳은 답은 유니온 파인드로 따로 낸 값입니다. 정점이 넷이고 간선이 넷 이하인 그래프 ${comma(checked)} 개(같은 쌍을 여러 번 잇는 것과 자기 자신을 잇는 것을 포함한다)를 전부 만들어 세 값을 대조했고, 하나라도 다른 그래프는 ${comma(differ)} 개입니다.`,
  );
}

function parentVsEdgeTrace(): string {
  const t = traced(2, DOUBLE);
  const rows = t.steps.map((s, k) =>
    s.kind === "start"
      ? [
          stepOf(k),
          `정점 ${s.u} 에서 시작`,
          `nbr[0] = ${show(t.nbr[0] as number[])} · nbr[1] = ${show(t.nbr[1] as number[])}`,
        ]
      : [
          stepOf(k),
          `${s.u} 의 목록 ${s.slot + 1} 번째 이웃 ${s.v}`,
          `부모 ${s.parent} · 표시 ${s.seen ? "있다" : "없다"} → ${branchLabel(s)}`,
        ],
  );
  const s = t.steps[foundStep(t)] as Step;
  rows.push([
    "",
    `정점 ${s.v}${을를(s.v)} 꺼냈는가`,
    s.popped[s.v] ? "꺼냈다" : `아니다 — ${s.u} 의 목록에서 답이 먼저 나왔다`,
  ]);
  return columns(rows);
}

function walkTrace(): string {
  const rows = WALK.steps.map((s, k) => {
    if (s.kind === "start") {
      const skipped = WALK.outer
        .filter((o) => o.s < s.u && o.seen)
        .map((o) => `\`visited[${o.s}]\``);
      return [
        stepOf(k),
        "—",
        "—",
        "—",
        `${skipped.length > 0 ? `${skipped.join(" · ")} 참으로 넘어가고, ` : ""}\`visited[${s.u}]\` 거짓 → 시작한다`,
        "시작",
        show(s.stack),
        show(s.from),
      ];
    }
    const cond =
      s.kind === "skip"
        ? `\`${s.v} === ${s.parent}\` 참`
        : `\`${s.v} === ${s.parent}\` 거짓 · \`visited[${s.v}]\` ${s.seen ? "참" : "거짓"}`;
    return [
      stepOf(k),
      String(s.u),
      String(s.parent),
      String(s.v),
      cond,
      branchLabel(s).slice(0, 1),
      show(s.stack),
      show(s.from),
    ];
  });
  const of = (kind: Kind) =>
    WALK.steps.flatMap((s, k) => (s.kind === kind ? [k] : []));
  const last = WALK.steps.at(-1) as Step;
  return withSentence(
    md(
      [
        "걸음",
        "꺼낸 정점",
        "부모",
        "이웃",
        "조건 판정",
        "갈래",
        "stack",
        "from",
      ],
      rows,
    ),
    `③ 은 ${idsOf(of("mark"))} 에서 ${of("mark").length} 번, ① 은 ${idsOf(of("skip"))} 에서 ${of("skip").length} 번, ② 는 ${idsOf(of("found"))} 에서 ${of("found").length} 번 실행됐습니다. 이웃 항목 확인은 ${last.checked} 번이고 목록 길이의 합은 ${2 * WALK_EDGES.length} 입니다. 반환값은 ${yn(WALK.answer)} 입니다.`,
  );
}

const COMPONENT_CASES: Case[] = [
  {
    label: "0-1 과 삼각형 2-3-4",
    n: 5,
    edges: [
      [0, 1],
      [2, 3],
      [3, 4],
      [4, 2],
    ],
  },
  {
    label: "자기 자신을 잇는 간선이 정점 3 에",
    n: 4,
    edges: [
      [0, 1],
      [3, 3],
    ],
  },
  { label: "삼각형이 정점 0 에 붙어 있다", n: 4, edges: [...ring(3), [2, 3]] },
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
];

function componentValues(): string {
  return md(
    ["입력", "표시 없는 정점마다 시작 (정본)", "정점 0 에서만 시작", "두 답"],
    COMPONENT_CASES.map((c) => {
      const a = undirectedCycleDetection(c.n, c.edges);
      const b = onlyZeroMutant.undirectedCycleDetection(c.n, c.edges);
      return [c.label, yn(a), yn(b), a === b ? "같다" : "어긋난다"];
    }),
  );
}

function componentTrace(): string {
  const c = COMPONENT_CASES[0] as Case;
  const zero = traced(c.n, c.edges, { onlyZero: true });
  const full = traced(c.n, c.edges);
  const lastZero = zero.steps.at(-1) as Step;
  const unmarked = lastZero.visited.flatMap((b, v) => (b ? [] : [v]));
  const k = foundStep(full);
  const s = full.steps[k] as Step;
  const restart = full.steps.findIndex((x, i) => i > 0 && x.kind === "start");
  return columns([
    [
      "0 에서만 시작",
      `걸음 ${zero.steps.length} 개 뒤 스택이 빈다`,
      `표시 없이 남은 정점 ${unmarked.join(" · ")}`,
      yn(zero.answer),
    ],
    [
      `s = ${(full.steps[restart] as Step).u} 에서 다시`,
      `${stepOf(k)} 에 ${s.u} 의 이웃 ${s.v}${이가(s.v)} 표시돼 있다`,
      "바깥 반복이 표시 없는 정점을 다시 잡았다",
      yn(full.answer),
    ],
  ]);
}

function walkResult(): string {
  const cases: Case[] = [
    { label: "", n: WALK_N, edges: WALK_EDGES },
    { label: "", n: 3, edges: ring(3) },
    { label: "", n: 4, edges: chain(4) },
    { label: "", n: 6, edges: forest(6, 3) },
    { label: "", n: 2, edges: SELF },
    { label: "", n: 2, edges: DOUBLE },
    { label: "", n: 5, edges: [] },
    { label: "", n: 1, edges: [] },
  ];
  const calls = cases.map(
    (c) => `undirectedCycleDetection(${c.n}, ${edgeList(c.edges)})`,
  );
  const w = Math.max(...calls.map((x) => x.length));
  return cases
    .map(
      (c, i) =>
        `${(calls[i] as string).padEnd(w)}   →   ${yn(undirectedCycleDetection(c.n, c.edges))}`,
    )
    .join("\n");
}

/* ─────────────────── 「알아 두면 좋은 개념」 ─────────────────── */

function circuitRank(): string {
  const cases: Case[] = [
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
    { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
    { label: "삼각형", n: 3, edges: ring(3) },
    {
      label: "삼각형 둘을 나란히 둔 것",
      n: 6,
      edges: [...ring(3), [3, 4], [4, 5], [5, 3]],
    },
    {
      label: "사각형에 대각선 하나를 더한 것",
      n: 4,
      edges: [...ring(4), [0, 2]],
    },
    { label: "정점 넷을 모두 이은 것", n: 4, edges: complete(4) },
    { label: "별 모양 1,000 정점", n: 1_000, edges: star(1_000) },
  ];
  const runs = cases.map((c) => ({ c, r: classifyEdges(c.n, c.edges) }));
  const same = runs.every(
    ({ c, r }) => r.extra === c.edges.length - c.n + r.parts,
  );
  const overlap = runs.every(
    ({ c, r }) => r.extra > 0 === undirectedCycleDetection(c.n, c.edges),
  );
  return withSentence(
    md(
      ["입력", "V", "E", "연결 성분 k", "나무 간선", "여분 간선", "E − V + k"],
      runs.map(({ c, r }) => [
        c.label,
        comma(c.n),
        comma(c.edges.length),
        comma(r.parts),
        comma(r.tree),
        comma(r.extra),
        comma(c.edges.length - c.n + r.parts),
      ]),
      [1, 2, 3, 4, 5, 6],
    ),
    `${runs.length} 줄 ${same ? "모두" : "가운데 일부만"} 여분 간선 칸과 E − V + k 칸이 같습니다. 여분 간선이 1 이상인 줄과 정본의 답이 true 인 줄은 ${overlap ? "정확히 겹칩니다" : "겹치지 않는 자리가 있습니다"}.`,
  );
}

/** 알아 두면 좋은 개념의 그림 — 끝까지 가른 나무 간선. */
export function walkTreeEdges(): boolean[] {
  return classifyEdges(WALK_N, WALK_EDGES).isTree;
}

/* ─────────────────── 파트 2 ─────────────────── */

function fitCount(): string {
  const cases: Case[] = [
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
    {
      label: "사각형에 대각선 하나를 더한 것",
      n: 4,
      edges: [...ring(4), [0, 2]],
    },
    { label: "정점 넷을 모두 이은 것", n: 4, edges: complete(4) },
    { label: "정점 다섯을 모두 이은 것", n: 5, edges: complete(5) },
    { label: "정점 여섯을 모두 이은 것", n: 6, edges: complete(6) },
  ];
  const runs = cases.map((c) => {
    const extra = classifyEdges(c.n, c.edges).extra;
    return {
      c,
      extra,
      bound: 2 ** extra - 1,
      cycles: countCycles(c.n, c.edges),
      checked: scanOnce(c.n, c.edges).scans,
    };
  });
  const within = runs.every((x) => x.cycles <= x.bound);
  const big = runs.at(-1) as (typeof runs)[number];
  return withSentence(
    md(
      [
        "입력",
        "E",
        "여분 간선 r",
        "2^r − 1",
        "서로 다른 사이클 수",
        "있는지 답할 때 확인한 이웃 항목",
      ],
      runs.map((x) => [
        x.c.label,
        String(x.c.edges.length),
        String(x.extra),
        comma(x.bound),
        comma(x.cycles),
        String(x.checked),
      ]),
      [1, 2, 3, 4, 5],
    ),
    `${runs.length} 줄 ${within ? "모두" : "가운데 일부만"} 사이클 수가 2^r − 1 을 넘지 않습니다. ${big.c.label}에서는 사이클이 ${comma(big.cycles)} 개인데, 있는지 답하는 데는 이웃 항목 ${big.checked} 개를 확인했습니다.`,
  );
}

const MINE = "부모 건너뛰기 탐색";
const OTHER = "유니온 파인드";
const winner = (a: number, b: number): string =>
  a === b ? "같다" : a < b ? MINE : OTHER;

function altFlip(): string {
  const mine: Record<string, number> = ALT_CASES[MINE]();
  const other: Record<string, number> = ALT_CASES[OTHER]();
  const keys = Object.keys(mine);
  const front = keys.find((k) => k.includes("맨 앞")) as string;
  const back = keys.find((k) => k.includes("목록 맨 뒤")) as string;
  const ratio = (k: string) => {
    const a = mine[k] as number;
    const b = other[k] as number;
    return (Math.max(a, b) / Math.min(a, b)).toFixed(1);
  };
  return withSentence(
    md(
      ["재는 것", MINE, OTHER, "적은 쪽"],
      keys.map((k) => {
        const a = mine[k] as number;
        const b = other[k] as number;
        return [k, comma(a), comma(b), winner(a, b)];
      }),
      [1, 2],
    ),
    `삼각형 간선이 목록 맨 앞이면 ${winner(mine[front] as number, other[front] as number)} 쪽이 ${ratio(front)} 배 적고, 목록 맨 뒤면 ${winner(mine[back] as number, other[back] as number)} 쪽이 ${ratio(back)} 배 적습니다.`,
  );
}

function altBoundary(): string {
  const mine: Record<string, number> = ALT_CASES[MINE]();
  const other: Record<string, number> = ALT_CASES[OTHER]();
  const keys = Object.keys(mine).filter((k) => /번째일 때/.test(k));
  return md(
    ["삼각형 간선의 자리", MINE, OTHER, "적은 쪽"],
    keys.map((k) => {
      const a = mine[k] as number;
      const b = other[k] as number;
      return [
        k.replace(/^삼각형 간선이 /, "").replace(/일 때 배열 칸 접근$/, ""),
        comma(a),
        comma(b),
        winner(a, b),
      ];
    }),
    [1, 2],
  );
}

function mathForestCount(): string {
  const r = classifyEdges(WALK_N, WALK_EDGES);
  const starts = WALK.steps.filter((s) => s.kind === "start").map((s) => s.u);
  const marked = WALK.steps.filter((s) => s.kind === "mark").map((s) => s.v);
  return withSentence(
    md(
      ["표시한 자리", "정점", "수"],
      [
        ["바깥 반복", show(starts), String(starts.length)],
        ["③ 갈래", show(marked), String(marked.length)],
        [
          "모두",
          show([...starts, ...marked].sort((a, b) => a - b)),
          String(starts.length + marked.length),
        ],
      ],
      [2],
    ),
    `연결 성분은 ${r.parts} 개이고, |F| = ${WALK_N} − ${r.parts} = ${WALK_N - r.parts} 입니다. 끝까지 가른 나무 간선도 ${r.tree} 개입니다.`,
  );
}

function mathSmall(): string {
  const cases: Case[] = [
    { label: "삼각형", n: 3, edges: ring(3) },
    { label: "한 줄로 이은 세 정점", n: 3, edges: chain(3) },
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  ];
  const rows = cases.map((c) => {
    const k = classifyEdges(c.n, c.edges).parts;
    const e = c.edges.length;
    return {
      c,
      row: [
        c.label,
        String(c.n),
        String(e),
        String(k),
        `${e} − ${c.n} + ${k} = ${e - c.n + k}`,
        yn(undirectedCycleDetection(c.n, c.edges)),
      ],
    };
  });
  const under = rows.filter(
    (x) =>
      x.c.edges.length < x.c.n && undirectedCycleDetection(x.c.n, x.c.edges),
  );
  return withSentence(
    md(
      ["입력", "V", "E", "k", "E − V + k", "정본의 답"],
      rows.map((x) => x.row),
      [1, 2, 3],
    ),
    `E < V 인데도 정본의 답이 true 인 줄은 ${under.length} 개${under.length > 0 ? `(${under.map((x) => x.c.label).join(" · ")})` : ""}입니다.`,
  );
}

function costClosedForm(): string {
  // **사이클이 없는 입력만 담는다.** 사이클이 있으면 만나는 자리에서 반복이 끝나므로
  // 아래 식이 그대로 서지 않는다 — 그 차이는 「최악을 만드는 입력」이 값으로 보인다.
  const cases: Case[] = [
    {
      label: "전개 입력에서 간선 [5,3] 을 뺀 것",
      n: WALK_N,
      edges: WALK_EDGES.slice(0, 4),
    },
    { label: "간선이 없는 다섯 정점", n: 5, edges: [] },
    { label: "한 줄로 이은 1,000 정점", n: 1_000, edges: chain(1_000) },
    { label: "별 모양 1,000 정점", n: 1_000, edges: star(1_000) },
    { label: "1,000 정점을 넷씩 가른 숲", n: 1_000, edges: forest(1_000, 4) },
    { label: "한 줄로 이은 100,000 정점", n: CAP, edges: chain(CAP) },
  ];
  const rows = cases.map((c) => {
    const parts = classifyEdges(c.n, c.edges).parts;
    const got = countCells(c.n, c.edges).cells;
    const want = 10 * c.n + 6 * c.edges.length - parts;
    return {
      got,
      want,
      row: [
        c.label,
        comma(c.n),
        comma(c.edges.length),
        comma(parts),
        comma(got),
        comma(want),
      ],
    };
  });
  const same = rows.filter((r) => r.got === r.want).length;
  return withSentence(
    md(
      ["입력", "V", "E", "연결 성분 k", "실제 칸 접근", "10V + 6E − k"],
      rows.map((r) => r.row),
      [1, 2, 3, 4, 5],
    ),
    `${rows.length} 줄 가운데 두 값이 같은 줄은 ${same} 개입니다.`,
  );
}

function mathScale(): string {
  const V = CAP;
  const E = CAP - 1;
  const k = 1;
  const A = countCells(V, chain(V)).cells;
  return md(
    ["항", "세는 것", "V = 100,000 · E = 99,999 · k = 1 에서"],
    [
      ["10V", "배열 둘 · 바깥 반복 · 꺼내기 · 표시하기", comma(10 * V)],
      ["6E", "목록 만들기 · 이웃 확인하기", comma(6 * E)],
      ["−k", "연결 성분 하나", `−${comma(k)}`],
      ["A(V, E, k)", "한 줄에서 실제로 센 칸 접근", comma(A)],
      ["간선을 하나씩 지워 보기", "한 줄 입력에서 E × E", comma(E * E)],
    ],
    [2],
  );
}

function invariantSteps(): string {
  const rows = WALK.steps.map((s, k) => {
    const marked = s.visited.filter(Boolean).length;
    const tree = s.treeEdge.filter((e) => e >= 0).length;
    return {
      ok: marked === tree + s.starts,
      row: [
        stepOf(k),
        plainLabel(s),
        String(marked),
        String(tree),
        String(s.starts),
        `${marked} = ${tree} + ${s.starts}`,
      ],
    };
  });
  const bad = rows.filter((r) => !r.ok).length;
  return withSentence(
    md(
      ["걸음", "한 일", "표시된 정점", "나무 간선", "시작한 횟수", "식"],
      rows.map((r) => r.row),
      [2, 3, 4],
    ),
    `${rows.length} 걸음 가운데 식이 어긋난 걸음은 ${bad} 개입니다.`,
  );
}

function invariantCheck(): string {
  const cases: Case[] = [
    ...SMALL,
    { label: "사각형", n: 4, edges: ring(4) },
    { label: "정점 넷을 모두 이은 것", n: 4, edges: complete(4) },
    { label: "한 줄로 이은 1,000 정점", n: 1_000, edges: chain(1_000) },
    { label: "별 모양 1,000 정점", n: 1_000, edges: star(1_000) },
  ];
  const count = RELATIONS[0] as Relation;
  const noCycle = RELATIONS[2] as Relation;
  let steps = 0;
  let broken = 0;
  const rows = cases.map((c) => {
    const t = traced(c.n, c.edges);
    const a = t.steps.filter((s) => !count.holds(s, c.edges)).length;
    // 정점 1,000 개짜리는 걸음마다 나무 간선을 다시 묶으면 느리다 — 끝 걸음에서만 본다.
    const probe = c.n > 100 ? [t.steps.at(-1) as Step] : t.steps;
    const b = probe.filter((s) => !noCycle.holds(s, c.edges)).length;
    steps += t.steps.length;
    broken += a + b;
    return [c.label, comma(t.steps.length), String(a), String(b), yn(t.answer)];
  });
  return withSentence(
    md(
      [
        "입력",
        "확인한 걸음",
        "개수 식이 어긋난 걸음",
        "나무 간선에 사이클이 생긴 걸음",
        "반환값",
      ],
      rows,
      [1, 2, 3],
    ),
    `입력 ${cases.length} 개의 ${comma(steps)} 걸음에서 불변식이 깨진 자리는 ${broken} 개입니다. 정점 1,000 개짜리 두 입력은 나무 간선의 사이클을 마지막 걸음에서만 쟀습니다.`,
  );
}

function invariantEdges(): string {
  const cases: Case[] = [
    { label: "정점 하나", n: 1, edges: [] },
    { label: "간선 없음", n: 5, edges: [] },
    { label: "자기 자신을 잇는 간선", n: 2, edges: SELF },
    { label: "같은 쌍을 두 번", n: 2, edges: DOUBLE },
    {
      label: "나뉜 연결 성분",
      n: 5,
      edges: [
        [0, 1],
        [2, 3],
        [3, 4],
        [4, 2],
      ],
    },
  ];
  const rows = cases.map((c) => {
    const t = traced(c.n, c.edges);
    const k = foundStep(t);
    const f = t.steps[k];
    const where =
      f === undefined
        ? `시작 ${t.steps.filter((s) => s.kind === "start").length} 번 · 걸음 ${t.steps.length} 개 뒤 끝난다`
        : `${stepOf(k)} — ${f.u} 의 목록에서 표시된 ${f.v}${을를(f.v)} 만난다`;
    return [
      c.label,
      `\`undirectedCycleDetection(${c.n}, ${edgeList(c.edges)})\``,
      where,
      yn(t.answer),
    ];
  });
  const big = scanOnce(CAP, chain(CAP));
  rows.push([
    "한 줄 100,000 정점",
    "정점 0 부터 99,999 까지 한 줄",
    `스택에 ${comma(big.pushes)} 번 넣고 이웃 항목 ${comma(big.scans)} 개를 확인한다`,
    yn(big.answer),
  ]);
  return md(["입력", "호출", "끝난 자리", "결과"], rows);
}

function mutantNoSkip(): string {
  return md(
    ["입력", "부모 건너뛰기 (정본)", "건너뛰지 않기", "두 답"],
    SMALL.map((c) => {
      const a = undirectedCycleDetection(c.n, c.edges);
      const b = noSkipMutant.undirectedCycleDetection(c.n, c.edges);
      return [c.label, yn(a), yn(b), a === b ? "같다" : "어긋난다"];
    }),
  );
}

function mutantNoSkipTrace(): string {
  const edges = chain(4);
  const t = traced(4, edges, { skipParent: false });
  const neutral =
    noSkipMutant.undirectedCycleDetection === undirectedCycleDetection;
  if (
    !neutral &&
    t.answer !== noSkipMutant.undirectedCycleDetection(4, edges)
  ) {
    throw new Error("건너뛰지 않는 사본의 답이 변이의 답과 다르다");
  }
  const ref = traced(4, edges);
  const len = Math.max(t.steps.length, ref.steps.length);
  const say = (s: Step | undefined) =>
    s === undefined
      ? "—"
      : s.kind === "start"
        ? `${s.u} 에서 시작`
        : `${s.u} 의 이웃 ${s.v} · 부모 ${parentText(s.parent)} · ${plainLabel(s)}`;
  const rows = Array.from({ length: len }, (_, k) => [
    stepOf(k),
    say(ref.steps[k]),
    say(t.steps[k]),
  ]);
  const firstDiff = rows.findIndex((r) => r[1] !== r[2]);
  const d = t.steps[firstDiff] as Step;
  return withSentence(
    md(["걸음", "부모 건너뛰기 (정본)", "건너뛰지 않기"], rows),
    `${stepOf(firstDiff)} 에서 처음 갈립니다. 건너뛰지 않는 판은 ${d.v}${이가(d.v)} ${d.u} 의 부모인데도 표시만 보고 사이클이라고 답해, 반환값이 ${yn(t.answer)} 입니다. 정본의 답은 ${yn(ref.answer)} 입니다.`,
  );
}

function perfDerive(): string {
  interface Pop {
    readonly u: number;
    readonly parent: number;
    readonly vs: number[];
    readonly ks: number[];
  }
  const pops: Pop[] = [];
  WALK.steps.forEach((s, k) => {
    if (s.kind === "start") return;
    const cur = pops.at(-1);
    if (cur !== undefined && s.slot > 0 && cur.u === s.u) {
      cur.vs.push(s.v);
      cur.ks.push(k);
    } else pops.push({ u: s.u, parent: s.parent, vs: [s.v], ks: [k] });
  });
  const found = foundStep(WALK);
  const last = WALK.steps.at(-1) as Step;
  const marked = last.visited.filter(Boolean).length;
  const waiting = last.visited.flatMap((b, v) =>
    b && !last.popped[v] ? [v] : [],
  );
  return withSentence(
    md(
      ["바퀴", "꺼낸 정점", "부모", "확인한 이웃", "걸음"],
      pops.map((r, i) => [
        String(i + 1),
        String(r.u),
        parentText(r.parent),
        r.vs.join(" · "),
        `${idsOf(r.ks)}${r.ks.includes(found) ? " — 여기서 반환한다" : ""}`,
      ]),
      [0],
    ),
    `꺼낸 정점은 ${pops.length} 개로 표시된 정점 ${marked} 개보다 적고, 이웃 확인은 ${last.checked} 번으로 목록 길이의 합 ${2 * WALK_EDGES.length} 보다 적습니다. 표시됐지만 꺼내기 전에 반환한 정점은 ${show(waiting)} 입니다.`,
  );
}

/** 정점 0 · 1 · 2 를 삼각형으로 잇고 나머지를 한 줄로 이은 그래프 — 삼각형 간선이 목록 맨 앞. */
function triangleFront(v: number): Edge[] {
  const rest: Edge[] = [];
  for (let i = 3; i + 1 < v; i++) rest.push([i, i + 1]);
  return [...ring(3), ...rest];
}

function perfCases(): string {
  const a = countCells(CAP, chain(CAP));
  const tri = triangleFront(CAP);
  const b = countCells(CAP, tri);
  return withSentence(
    md(
      ["케이스", "입력", "E", "배열 칸 접근", "반환값"],
      [
        [
          "사이클이 없다",
          "한 줄로 이은 100,000 정점",
          comma(CAP - 1),
          comma(a.cells),
          yn(a.answer),
        ],
        [
          "사이클이 정점 0 에 있다",
          "정점 0 · 1 · 2 가 삼각형, 나머지는 한 줄",
          comma(tri.length),
          comma(b.cells),
          yn(b.answer),
        ],
      ],
      [2, 3],
    ),
    `두 입력 다 V = 100,000 이고, 배열 칸 접근은 ${(a.cells / b.cells).toFixed(1)} 배 차이가 납니다.`,
  );
}

function shapeValues(): string {
  const V = CAP;
  const cases: Case[] = [
    { label: "한 줄 (사이클 없음)", n: V, edges: chain(V) },
    { label: "별 모양 (사이클 없음)", n: V, edges: star(V) },
    { label: "둘씩 짝지은 숲 (사이클 없음)", n: V, edges: forest(V, 2) },
    { label: "한 줄의 양 끝을 이은 고리", n: V, edges: ring(V) },
    {
      label: "한 줄에 간선 [99999,99997] 을 더한 것",
      n: V,
      edges: [...chain(V), [V - 1, V - 3]],
    },
    {
      label: "별 모양에 간선 [1,2] 를 더한 것",
      n: V,
      edges: [...star(V), [1, 2]],
    },
  ];
  // 사이클을 어디에 두어야 가장 오래 걸리는가 — 한 줄에 간선 하나를 더하는 자리를 차례로 옮긴다.
  let sweepBest = 0;
  let sweepAt = 0;
  const base = chain(V);
  for (let i = 0; i + 2 < V; i += 997) {
    base.push([i, i + 2]);
    const cells = countCells(V, base).cells;
    base.pop();
    if (cells > sweepBest) {
      sweepBest = cells;
      sweepAt = i;
    }
  }
  const noCycle = countCells(V, chain(V)).cells;
  return withSentence(
    md(
      ["입력 모양", "V", "E", "배열 칸 접근", "반환값"],
      cases.map((c) => {
        const r = countCells(c.n, c.edges);
        return [
          c.label,
          comma(c.n),
          comma(c.edges.length),
          comma(r.cells),
          yn(r.answer),
        ];
      }),
      [1, 2, 3],
    ),
    `한 줄에 간선 [i, i+2] 를 더하고 i 를 997 칸씩 옮겨 가며 잰 최댓값은 i = ${comma(sweepAt)} 에서 ${comma(sweepBest)} 이고, 사이클이 없는 한 줄의 ${comma(noCycle)} 보다 ${sweepBest < noCycle ? "적습니다" : "많습니다"}.`,
  );
}

/** 스스로 점검하기 — 정점 번호를 바꿔 삼각형을 앞으로 옮긴 입력. */
export const SWAPPED_EDGES: Edge[] = [
  [3, 4],
  [4, 5],
  [0, 1],
  [1, 2],
  [2, 0],
];

function vertexSwap(): string {
  const a = scanOnce(WALK_N, WALK_EDGES);
  const b = scanOnce(WALK_N, SWAPPED_EDGES);
  return md(
    ["입력", "확인한 이웃 항목", "배열 칸 접근", "반환값"],
    [
      [
        "전개 입력 — 한 줄이 0 · 1 · 2, 삼각형이 3 · 4 · 5",
        String(a.scans),
        comma(countCells(WALK_N, WALK_EDGES).cells),
        yn(a.answer),
      ],
      [
        "번호를 바꾼 입력 — 삼각형이 0 · 1 · 2, 한 줄이 3 · 4 · 5",
        String(b.scans),
        comma(countCells(WALK_N, SWAPPED_EDGES).cells),
        yn(b.answer),
      ],
    ],
    [1, 2],
  );
}

export const PROOFS: Record<string, () => string> = {
  "concept-walks": conceptWalks,
  "concept-special": conceptSpecial,
  "naive-scale": naiveScale,
  "naive-repeat": naiveRepeat,
  "mark-values": markValues,
  "first-candidate": firstCandidate,
  "skip-choice": skipChoice,
  "tree-read": treeRead,
  "tree-relation": treeRelation,
  "tree-vs-stack": treeVsStack,
  "build-lists": buildLists,
  "build-starts": buildStarts,
  "build-mark": buildMark,
  "edge-scan-values": edgeScanValues,
  "build-skip": buildSkip,
  "build-square": buildSquare,
  "build-close": buildClose,
  "mutant-one-sided": mutantOneSided,
  "one-sided-trace": oneSidedTrace,
  "mark-when": markWhen,
  "walk-input": walkInput,
  "walk-lists": walkLists,
  "walk-pop3": walkPop3,
  "parent-vs-edge": parentVsEdge,
  "parent-vs-edge-trace": parentVsEdgeTrace,
  "walk-trace": walkTrace,
  "component-values": componentValues,
  "component-trace": componentTrace,
  "walk-result": walkResult,
  "circuit-rank": circuitRank,
  "fit-count": fitCount,
  "alt-flip": altFlip,
  "alt-boundary": altBoundary,
  "math-forest-count": mathForestCount,
  "math-small": mathSmall,
  "cost-closed-form": costClosedForm,
  "math-scale": mathScale,
  "invariant-steps": invariantSteps,
  "invariant-check": invariantCheck,
  "invariant-edges": invariantEdges,
  "mutant-no-skip": mutantNoSkip,
  "mutant-no-skip-trace": mutantNoSkipTrace,
  "perf-derive": perfDerive,
  "perf-cases": perfCases,
  "shape-values": shapeValues,
  "vertex-swap": vertexSwap,
};
