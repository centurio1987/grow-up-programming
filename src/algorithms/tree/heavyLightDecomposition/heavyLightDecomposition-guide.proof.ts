/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/tree/heavyLightDecomposition/heavyLightDecomposition-guide.md
 *
 * **세는 사본은 두 곳에 있다.** 정본은 칸을 몇 번 읽었는지도, 걸음마다의 상태도 내보내지
 * 않으므로 그 자리를 덧붙인 사본이 아니면 계수와 걸음을 낼 방법이 없다.
 *
 * - `traced`(이 파일) — 정본과 같은 절차에 걸음 기록을 덧붙인 판. 걸음마다 배열 여섯 개를 통째로
 *   베끼므로 **전개 입력처럼 작은 입력에만** 쓴다. 큰 입력에 쓰면 메모리가 모자란다.
 * - `decompose` · `hldCounted` · `naiveWalk`(`-guide.alt.ts`) — 사슬만 만들거나 칸 접근만 세는
 *   가벼운 판. 정점 20,000 개 · 100,000 개 같은 큰 입력은 이것만 쓴다. 대조 하네스와 같은 계수
 *   모델을 한 벌로 쓴다.
 *
 * **답이 맞는지는 사본이 아니라 정본이 진다** — `traced` 는 부를 때마다 자기 답을 정본과 맞대고,
 * 어긋나면 던진다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 을를, 이가 } from "../../../../tools/josa.ts";
import {
  binary,
  branchCounts,
  caterpillar,
  chain,
  type Decomposition,
  decompose,
  type Edge,
  heightTrap,
  hldCounted,
  leafFirstCaterpillar,
  lightEdges,
  measure,
  naiveWalk,
  pathVertices,
  plainPos,
  runCount,
  segmentCount,
  star,
} from "./heavyLightDecomposition-guide.alt.ts";
import { HeavyLightDecomposition } from "./heavyLightDecomposition-guide.ref.ts";

const REF = new URL("./heavyLightDecomposition-guide.ref.ts", import.meta.url)
  .pathname;

/* ────────────────────────── 전개가 쓰는 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 갈래가 둘인 정점(0 과 2)이 있어 무거운 자식을 고르는 비교가
 * 실제로 실행되고, 질의 셋이 사슬 조각 1 · 3 · 2 개를 각각 한 번씩 낸다.
 */
export const WALK_N = 9;
export const WALK_EDGES: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 5],
  [5, 6],
  [2, 3],
  [2, 4],
  [4, 7],
  [7, 8],
];
export const WALK_ROOT = 0;
export const WALK_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** 전개가 쓰는 연산 — 질의 또는 갱신. */
export type Op =
  | { readonly kind: "query"; readonly u: number; readonly v: number }
  | { readonly kind: "update"; readonly node: number; readonly value: number };

/** 전개가 쓰는 연산 넷 — 질의 · 질의 · 갱신 · 질의. */
export const WALK_OPS: readonly Op[] = [
  { kind: "query", u: 0, v: 7 },
  { kind: "query", u: 3, v: 6 },
  { kind: "update", node: 4, value: 100 },
  { kind: "query", u: 8, v: 6 },
];

interface Structure {
  update(node: number, value: number): void;
  queryPath(u: number, v: number): number;
}

type Ctor = new (
  n: number,
  edges: Edge[],
  root: number,
  values: number[],
) => Structure;

const REFCLASS: Ctor = HeavyLightDecomposition;

/** 전개가 쓰는 작업 목록 — 질의가 낸 답만 차례로 모은다. */
function walkAnswers(Cls: Ctor): number[] {
  const h = new Cls(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES.slice());
  const out: number[] = [];
  for (const op of WALK_OPS) {
    if (op.kind === "query") out.push(h.queryPath(op.u, op.v));
    else h.update(op.node, op.value);
  }
  return out;
}

/** 어떤 트리에도 걸 수 있는 작업 목록. 질의 넷과 갱신 하나다. */
function probe(Cls: Ctor, v: number, edges: Edge[]): number[] {
  const values = Array.from({ length: v }, (_, i) => (i % 97) + 1);
  const h = new Cls(v, edges, 0, values);
  const pick = (i: number): [number, number] => [i % v, (37 * i) % v];
  const out: number[] = [];
  for (const i of [1, 2, 3]) {
    const [a, b] = pick(i);
    out.push(h.queryPath(a, b));
  }
  h.update(v - 1, 1000);
  const [a, b] = pick(4);
  out.push(h.queryPath(a, b));
  return out;
}

/* ────────────────────────── 글자 맞춤 ────────────────────────── */

const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

export const comma = (n: number): string => n.toLocaleString("en-US");

/** 등폭 글자 줄 — 열마다 가장 긴 칸에 맞춘다. */
function columnsText(rows: string[][], gap = "   "): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows
    .map((r) =>
      r
        .map((cell, c) => pad(cell, widths[c] ?? 0))
        .join(gap)
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

/** 마크다운 표. `right` 에 든 열은 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

export const list = (xs: readonly (number | string)[]): string =>
  `[${xs.join(", ")}]`;

const floorLog2 = (v: number): number => Math.floor(Math.log2(v));

const popcount = (x: number): number => {
  let n = x;
  let c = 0;
  while (n > 0) {
    c += n & 1;
    n >>>= 1;
  }
  return c;
};

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 무거운 자식을 크기가 아니라 **처음 만난 자식**으로 고른다. `best[p]` 가 0 인 것은 그 부모의
 * 자식을 아직 하나도 안 본 자리뿐이라, 조건을 이렇게 바꾸면 첫 자식만 뽑힌다.
 */
const FIRST_CHILD = (
  await loadMutant<{ HeavyLightDecomposition: Ctor }>(REF, {
    swap: [
      /if \(sw > \(best\[p\] as number\)\) \{/,
      "if ((best[p] as number) === 0) {",
    ],
  })
).HeavyLightDecomposition;

/** 사슬 머리의 깊이 대신 **정점 자신의 깊이**로 올릴 쪽을 고른다. */
const VERTEX_DEPTH = (
  await loadMutant<{ HeavyLightDecomposition: Ctor }>(REF, {
    swap: [
      /return this\.depth\[this\.head\[x\] as number\] as number;/,
      "return this.depth[x] as number;",
    ],
  })
).HeavyLightDecomposition;

/* ────────────────────────── 되풀이 쓰는 계산 ────────────────────────── */

/** 정점 쌍 전부에서 사슬 조각 수의 최댓값. 작은 트리에만 쓴다. */
export function maxSegments(
  v: number,
  edges: Edge[],
  rule: "first" | "deep" | "size",
): number {
  const d = decompose(v, edges, 0, rule);
  let best = 0;
  for (let a = 0; a < v; a++) {
    for (let b = a; b < v; b++) best = Math.max(best, segmentCount(d, a, b));
  }
  return best;
}

/** 뿌리에서 어느 정점까지 가는 가벼운 간선 수의 최댓값. */
function maxLight(v: number, edges: Edge[]): number {
  const d = decompose(v, edges, 0, "size");
  let best = 0;
  for (let a = 0; a < v; a++) best = Math.max(best, lightEdges(d, a));
  return best;
}

/** 정점 쌍 전부에서, 번호 `pos` 로 늘어놓았을 때 경로가 갈리는 이어진 덩어리 수의 최댓값. */
export function maxRuns(d: Decomposition, pos: number[], v: number): number {
  let best = 0;
  for (let a = 0; a < v; a++) {
    for (let b = a; b < v; b++) best = Math.max(best, runCount(d, pos, a, b));
  }
  return best;
}

/** 부분트리가 번호 `pos` 에서 이어진 자리를 차지하는 정점 수. */
function contiguousSubtrees(
  d: Decomposition,
  pos: number[],
  v: number,
): number {
  let ok = 0;
  for (let r = 0; r < v; r++) {
    const marks: number[] = [];
    for (let x = 0; x < v; x++) {
      let y = x;
      while (true) {
        if (y === r) {
          marks.push(pos[x] as number);
          break;
        }
        const p = d.parent[y] as number;
        if (p === y) break;
        y = p;
      }
    }
    marks.sort((a, b) => a - b);
    const span = (marks.at(-1) as number) - (marks[0] as number) + 1;
    if (span === marks.length) ok += 1;
  }
  return ok;
}

const TRAP = heightTrap(15);

/* ─────────────────── 정본과 같은 절차 — 걸음 기록 ─────────────────── */

export interface Pop {
  readonly u: number;
  readonly near: readonly number[];
  readonly skipped: readonly number[];
  readonly set: readonly number[];
  readonly stackAfter: readonly number[];
}

export interface SizeAdd {
  readonly w: number;
  readonly p: number;
  readonly before: number;
  readonly after: number;
}

export interface HeavyPick {
  readonly p: number;
  readonly children: readonly { readonly c: number; readonly size: number }[];
  readonly heavy: number;
}

export interface ChainRun {
  readonly top: number;
  readonly members: readonly number[];
  readonly pushed: readonly number[];
  readonly topsAfter: readonly number[];
}

/** 질의 하나가 더한 사슬 조각 하나. */
export interface Piece {
  readonly l: number;
  readonly r: number;
  readonly vertices: readonly number[];
  readonly sum: number;
}

export interface WalkStep {
  readonly kind:
    | "lists"
    | "dfs"
    | "size"
    | "heavy"
    | "chains"
    | "fenwick"
    | "round"
    | "last"
    | "update";
  /** 걸음이 끝난 뒤의 배열들. 아직 안 정했으면 `null`. */
  readonly depth: readonly (number | null)[];
  readonly parent: readonly (number | null)[];
  readonly size: readonly (number | null)[];
  readonly heavy: readonly (number | null)[];
  readonly head: readonly (number | null)[];
  readonly pos: readonly (number | null)[];
  /** 기저 배열 — 자리 `p` 에 앉은 정점의 값. 아직 안 만들었으면 `null`. */
  readonly base: readonly number[] | null;
  /** 정점마다의 지금 값. */
  readonly values: readonly number[];
  readonly answers: readonly number[];
  readonly pops?: readonly Pop[];
  readonly adds?: readonly SizeAdd[];
  readonly picks?: readonly HeavyPick[];
  readonly runs?: readonly ChainRun[];
  /** 연산 차례(0 부터). */
  readonly op?: number;
  /** 질의 걸음 — 들어갈 때의 두 정점과 나올 때의 두 정점. */
  readonly uIn?: number;
  readonly vIn?: number;
  readonly u?: number;
  readonly v?: number;
  readonly swapped?: boolean;
  readonly headU?: number;
  readonly headV?: number;
  readonly piece?: Piece;
  /** 이 연산에서 지금까지 더한 조각(이번 걸음 것 포함). */
  readonly pieces?: readonly Piece[];
  readonly total?: number;
  readonly answer?: number;
  /** 갱신 걸음. */
  readonly node?: number;
  readonly from?: number;
  readonly to?: number;
  readonly bitNodes?: readonly number[];
}

export interface Trace {
  readonly steps: readonly WalkStep[];
  readonly answers: readonly number[];
  readonly near: readonly (readonly number[])[];
  readonly order: readonly number[];
}

interface Arrays {
  depth?: number[];
  parent?: number[];
  size?: number[];
  heavy?: number[];
  head?: number[];
  pos?: number[];
  base?: number[];
}

/**
 * 정본과 같은 절차를 걸음마다 기록한다. 걸음은 이웃 목록 · 부모와 깊이 · 부분트리 크기 · 무거운
 * 자식 · 사슬과 자리 번호 · 펜윅 트리가 하나씩이고, 연산마다 질의는 더하는 사슬 조각 하나가 걸음
 * 하나, 갱신은 걸음 하나다. 부를 때마다 답을 정본과 맞댄다.
 */
export function traced(
  n: number,
  edges: Edge[],
  root: number,
  values0: readonly number[],
  ops: readonly Op[],
): Trace {
  const steps: WalkStep[] = [];
  const nul = (): (number | null)[] => Array.from({ length: n }, () => null);
  const values = values0.slice();

  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }
  const snap = (
    over: Partial<WalkStep> & Pick<WalkStep, "kind">,
    arrays: Arrays,
    answers: readonly number[],
  ): WalkStep => ({
    depth: arrays.depth ? [...arrays.depth] : nul(),
    parent: arrays.parent ? [...arrays.parent] : nul(),
    size: arrays.size ? [...arrays.size] : nul(),
    heavy: arrays.heavy ? [...arrays.heavy] : nul(),
    head: arrays.head ? [...arrays.head] : nul(),
    pos: arrays.pos ? [...arrays.pos] : nul(),
    base: arrays.base ? [...arrays.base] : null,
    values: [...values],
    answers: [...answers],
    ...over,
  });

  steps.push(snap({ kind: "lists" }, {}, []));

  const parent: number[] = Array.from({ length: n }, () => root);
  const depth: number[] = Array.from({ length: n }, () => 0);
  const order: number[] = [];
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [root];
  seen[root] = true;
  const pops: Pop[] = [];
  while (stack.length > 0) {
    const u = stack.pop() as number;
    order.push(u);
    const skipped: number[] = [];
    const set: number[] = [];
    for (const w of near[u] as number[]) {
      if (seen[w]) {
        skipped.push(w);
        continue;
      }
      seen[w] = true;
      parent[w] = u;
      depth[w] = (depth[u] as number) + 1;
      set.push(w);
      stack.push(w);
    }
    pops.push({
      u,
      near: [...(near[u] as number[])],
      skipped,
      set,
      stackAfter: [...stack],
    });
  }
  steps.push(snap({ kind: "dfs", pops }, { depth, parent }, []));

  const size: number[] = Array.from({ length: n }, () => 1);
  const adds: SizeAdd[] = [];
  for (let i = order.length - 1; i >= 1; i--) {
    const w = order[i] as number;
    const p = parent[w] as number;
    const before = size[p] as number;
    size[p] = before + (size[w] as number);
    adds.push({ w, p, before, after: size[p] as number });
  }
  steps.push(snap({ kind: "size", adds }, { depth, parent, size }, []));

  const heavy: number[] = Array.from({ length: n }, () => -1);
  const best: number[] = Array.from({ length: n }, () => 0);
  const kids = new Map<number, { c: number; size: number }[]>();
  for (const w of order) {
    if (w === root) continue;
    const p = parent[w] as number;
    kids.set(p, [...(kids.get(p) ?? []), { c: w, size: size[w] as number }]);
    if ((size[w] as number) > (best[p] as number)) {
      best[p] = size[w] as number;
      heavy[p] = w;
    }
  }
  const picks: HeavyPick[] = [...kids.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([p, children]) => ({ p, children, heavy: heavy[p] as number }));
  steps.push(
    snap({ kind: "heavy", picks }, { depth, parent, size, heavy }, []),
  );

  const head: number[] = Array.from({ length: n }, () => root);
  const pos: number[] = Array.from({ length: n }, () => 0);
  let timer = 0;
  const tops: number[] = [root];
  const runs: ChainRun[] = [];
  while (tops.length > 0) {
    const top = tops.pop() as number;
    const members: number[] = [];
    const pushed: number[] = [];
    let w = top;
    while (w !== -1) {
      head[w] = top;
      pos[w] = timer;
      timer += 1;
      members.push(w);
      const pw = parent[w] as number;
      const hw = heavy[w] as number;
      for (const c of near[w] as number[]) {
        if (c === pw || c === hw) continue;
        tops.push(c);
        pushed.push(c);
      }
      w = hw;
    }
    runs.push({ top, members, pushed, topsAfter: [...tops] });
  }
  steps.push(
    snap(
      { kind: "chains", runs },
      { depth, parent, size, heavy, head, pos },
      [],
    ),
  );

  const base: number[] = Array.from({ length: n }, () => 0);
  for (let x = 0; x < n; x++) base[pos[x] as number] = values[x] as number;
  const all: Arrays = { depth, parent, size, heavy, head, pos, base };
  steps.push(snap({ kind: "fenwick" }, all, []));

  const bitNodesOf = (x: number): number[] => {
    const out: number[] = [];
    for (let i = (pos[x] as number) + 1; i <= n; i += i & -i) out.push(i);
    return out;
  };
  const rangeSum = (l: number, r: number): number => {
    let s = 0;
    for (let i = l; i <= r; i++) s += base[i] as number;
    return s;
  };
  const vertsAt = (l: number, r: number): number[] => {
    const out: number[] = [];
    for (let i = l; i <= r; i++) out.push(pos.indexOf(i));
    return out;
  };

  const answers: number[] = [];
  for (const [opIndex, op] of ops.entries()) {
    if (op.kind === "update") {
      const from = values[op.node] as number;
      values[op.node] = op.value;
      base[pos[op.node] as number] = op.value;
      steps.push(
        snap(
          {
            kind: "update",
            op: opIndex,
            node: op.node,
            from,
            to: op.value,
            bitNodes: bitNodesOf(op.node),
          },
          all,
          answers,
        ),
      );
      continue;
    }
    let u = op.u;
    let v = op.v;
    let total = 0;
    const pieces: Piece[] = [];
    while ((head[u] as number) !== (head[v] as number)) {
      const uIn = u;
      const vIn = v;
      let swapped = false;
      if (
        (depth[head[u] as number] as number) <
        (depth[head[v] as number] as number)
      ) {
        const t = u;
        u = v;
        v = t;
        swapped = true;
      }
      const h = head[u] as number;
      const l = pos[h] as number;
      const r = pos[u] as number;
      const piece: Piece = {
        l,
        r,
        vertices: vertsAt(l, r),
        sum: rangeSum(l, r),
      };
      total += piece.sum;
      pieces.push(piece);
      u = parent[h] as number;
      steps.push(
        snap(
          {
            kind: "round",
            op: opIndex,
            uIn,
            vIn,
            u,
            v,
            swapped,
            headU: head[uIn] as number,
            headV: head[vIn] as number,
            piece,
            pieces: [...pieces],
            total,
          },
          all,
          answers,
        ),
      );
    }
    const lo = Math.min(pos[u] as number, pos[v] as number);
    const hi = Math.max(pos[u] as number, pos[v] as number);
    const piece: Piece = {
      l: lo,
      r: hi,
      vertices: vertsAt(lo, hi),
      sum: rangeSum(lo, hi),
    };
    total += piece.sum;
    pieces.push(piece);
    answers.push(total);
    steps.push(
      snap(
        {
          kind: "last",
          op: opIndex,
          uIn: u,
          vIn: v,
          u,
          v,
          headU: head[u] as number,
          headV: head[v] as number,
          piece,
          pieces: [...pieces],
          total,
          answer: total,
        },
        all,
        answers,
      ),
    );
  }

  const h = new HeavyLightDecomposition(n, edges, root, values0.slice());
  const want: number[] = [];
  for (const op of ops) {
    if (op.kind === "query") want.push(h.queryPath(op.u, op.v));
    else h.update(op.node, op.value);
  }
  if (list(want) !== list(answers)) {
    throw new Error(
      `걸음 기록의 답 ${list(answers)} 이 정본의 답 ${list(want)} 과 다르다`,
    );
  }
  return { steps, answers, near, order };
}

/** 전개 입력의 걸음 기록 — 본문 · 그림 · 패널이 같은 한 벌을 쓴다. */
export const WALK = traced(
  WALK_N,
  WALK_EDGES,
  WALK_ROOT,
  WALK_VALUES,
  WALK_OPS,
);

/** 준비가 끝난 뒤의 걸음 — 사슬 · 자리 번호 · 기저 배열이 다 정해진 자리. */
export const READY = WALK.steps[5] as WalkStep;

/** 연산 하나를 글로 — 「queryPath(3, 6)」 · 「update(4, 100)」. */
export const opText = (op: Op): string =>
  op.kind === "query"
    ? `queryPath(${op.u}, ${op.v})`
    : `update(${op.node}, ${op.value})`;

export const stepOf = (i: number): string => `T${i + 1}`;

/** 걸음이 실행한 원문자 분기. 정본 주석의 번호와 같다. */
export function stepMarks(i: number): string[] {
  const s = WALK.steps[i] as WalkStep;
  if (s.kind === "dfs") return ["①"];
  if (s.kind === "heavy") return ["②"];
  if (s.kind === "chains") return ["③"];
  if (s.kind === "round") return ["④"];
  if (s.kind === "last") return ["⑤"];
  if (s.kind === "update") return ["⑥"];
  return [];
}

export const pieceText = (p: Piece): string =>
  p.l === p.r ? `자리 ${p.l}` : `자리 ${p.l}~${p.r}`;

/** 걸음이 하는 일 — 패널 제목과 원고 표가 같은 말을 쓴다. */
export function stepDoing(i: number): string {
  const s = WALK.steps[i] as WalkStep;
  if (s.kind === "lists") return "간선 목록을 이웃 목록으로 옮긴다";
  if (s.kind === "dfs") return "뿌리에서 따라가 부모와 깊이를 정한다";
  if (s.kind === "size") return "꺼낸 차례의 뒤에서부터 부분트리 크기를 더한다";
  if (s.kind === "heavy")
    return "자식 중 부분트리가 가장 큰 쪽을 무거운 자식으로 고른다";
  if (s.kind === "chains") return "사슬마다 머리와 이어진 자리 번호를 붙인다";
  if (s.kind === "fenwick") return "기저 배열을 만들고 펜윅 트리를 세운다";
  const op = WALK_OPS[s.op as number] as Op;
  if (s.kind === "update") return `${opText(op)} — 자리 하나의 값을 바꾼다`;
  const piece = s.piece as Piece;
  if (s.kind === "round") {
    return `${opText(op)} — 머리가 더 깊은 쪽의 ${pieceText(piece)}${을를(piece.r)} 더한다`;
  }
  return `${opText(op)} — 머리가 같아 남은 ${pieceText(piece)}${을를(piece.r)} 더한다`;
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

/** `concept` — 연산 셋이 무엇을 돌려주는가. */
function conceptOps(): string {
  const d = decompose(WALK_N, WALK_EDGES, WALK_ROOT, "size");
  const h = new HeavyLightDecomposition(
    WALK_N,
    WALK_EDGES,
    WALK_ROOT,
    WALK_VALUES.slice(),
  );
  const cur = WALK_VALUES.slice();
  const rows: string[][] = [];
  const pickOps = WALK_OPS.slice(1);
  for (const op of pickOps) {
    if (op.kind === "update") {
      const before = cur[op.node] as number;
      h.update(op.node, op.value);
      cur[op.node] = op.value;
      rows.push([
        opText(op),
        `정점 ${op.node}`,
        `${before} → ${op.value}`,
        "없음",
      ]);
      continue;
    }
    const path = pathVertices(d, op.u, op.v);
    rows.push([
      opText(op),
      path.join(" → "),
      path.map((x) => cur[x] as number).join(" + "),
      String(h.queryPath(op.u, op.v)),
    ]);
  }
  const up = WALK_OPS[2] as Extract<Op, { kind: "update" }>;
  return [
    md(["연산", "지나는 정점", "더하는 값", "돌려주는 값"], rows, [3]),
    "",
    `갱신한 정점 ${up.node}${이가(up.node)} 셋째 줄의 경로 위에 있어서, 그 질의의 합에 새 값 ${up.value}${이가(up.value)} 들어갑니다.`,
  ].join("\n");
}

/** `deep.origin` ② — 경로를 걷는 방법의 비용. */
function naiveScale(): string {
  const rows: string[][] = [];
  let top = { per: 0, all: 0 };
  for (const v of [9, 100, 1_000, 10_000, 100_000]) {
    const ones = Array.from({ length: v }, () => 1);
    const total = naiveWalk(v, chain(v), 0, ones, [[0, v - 1]]).cells;
    const pre = 3 * v + 2 * (v - 1);
    const per = total - pre;
    const all = per * v;
    top = { per, all };
    rows.push([
      comma(v),
      comma(v),
      comma(per),
      comma(all),
      `${(all / 1e8).toFixed(1)} 초`,
    ]);
  }
  return [
    md(
      [
        "사슬 정점 V",
        "경로 위 정점",
        "질의 하나의 칸 접근",
        "질의 V 개의 칸 접근",
        "그 시간(초당 1 억 번)",
      ],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    `질의는 사슬의 두 끝 (0, V − 1) 이고, 준비에 드는 칸은 뺀 값입니다. 규모 상한 줄에서 질의 하나가 ${comma(top.per)} 칸이고 질의 V 개가 ${comma(top.all)} 칸입니다.`,
  ].join("\n");
}

/** `deep.origin` ③ — 한 줄짜리 트리에서는 경로가 이어진 자리 하나다. */
function chainInterval(): string {
  const v = 8;
  const values = Array.from({ length: v }, (_, i) => (i + 1) * 10);
  const d = decompose(v, chain(v), 0, "size");
  const base: number[] = Array.from({ length: v }, () => 0);
  for (let x = 0; x < v; x++) base[d.pos[x] as number] = values[x] as number;
  const prefix: number[] = [];
  let run = 0;
  for (const x of base) {
    run += x;
    prefix.push(run);
  }
  const [a, b] = [2, 5];
  const path = pathVertices(d, a, b);
  const l = Math.min(...path.map((x) => d.pos[x] as number));
  const r = Math.max(...path.map((x) => d.pos[x] as number));
  const ids = [...Array(v).keys()];
  const want = new HeavyLightDecomposition(
    v,
    chain(v),
    0,
    values.slice(),
  ).queryPath(a, b);
  const diff = (prefix[r] as number) - (prefix[l - 1] as number);
  if (diff !== want) throw new Error("앞에서부터의 합의 차가 정본과 다르다");
  return [
    md(
      ["자리", ...ids.map(String)],
      [
        ["정점", ...ids.map((p) => String(d.pos.indexOf(p)))],
        ["값", ...base.map(String)],
        ["앞에서부터의 합", ...prefix.map(String)],
        [`경로 ${a}~${b}`, ...ids.map((p) => (p >= l && p <= r ? "■" : ""))],
      ],
      ids.map((i) => i + 1),
    ),
    "",
    `경로 ${path.join(" → ")} 가 자리 [${l},${r}] 하나에 앉았습니다. 자리 ${r} 까지의 합 ${prefix[r]} 에서 자리 ${l - 1} 까지의 합 ${prefix[l - 1]}${을를(prefix[l - 1] as number)} 빼면 ${diff} 이고, 네 값을 하나씩 더한 ${path.map((x) => values[x]).join(" + ")} = ${want} 과 같습니다.`,
  ].join("\n");
}

/** `deep.origin` ③ — 앞에서부터의 합과 펜윅 트리의 비용. */
function prefixVsFenwick(): string {
  const v = 100_000;
  const lg = floorLog2(v);
  return [
    md(
      ["배열의 합을 들고 있는 방식", "구간 합 하나의 칸", "한 칸 갱신의 칸"],
      [
        ["칸마다 앞에서부터의 합을 적는다", "2", `많아야 ${comma(v)}`],
        [
          "펜윅 트리",
          `많아야 2(⌊log₂ V⌋ + 1) = ${2 * (lg + 1)}`,
          `많아야 ⌊log₂ V⌋ + 1 = ${lg + 1}`,
        ],
      ],
    ),
    "",
    `배열 길이 V = ${comma(v)} 기준이고 ⌊log₂ V⌋ = ${lg} 입니다.`,
  ].join("\n");
}

/** `deep.origin` ④ — 자리 번호를 매기는 두 방식에서 경로가 갈리는 덩어리 수. */
function numberingRuns(): string {
  const rows: string[][] = [];
  let top = { v: 0, mp: 0, mh: 0 };
  for (const v of [16, 32, 64, 256]) {
    const edges = caterpillar(v);
    const d = decompose(v, edges, 0, "size");
    const plain = plainPos(v, edges, 0);
    const mp = maxRuns(d, plain, v);
    const mh = maxRuns(d, d.pos, v);
    const end = v % 2 === 0 ? v - 2 : v - 1;
    top = { v, mp, mh };
    rows.push([
      comma(v),
      comma(mp),
      comma(mh),
      `${runCount(d, plain, 0, end)} · ${runCount(d, d.pos, 0, end)}`,
    ]);
  }
  return [
    md(
      [
        "애벌레 정점 V",
        "최대 덩어리 · 번호순",
        "최대 덩어리 · 크기순",
        "줄 양 끝 경로 · 번호순 · 크기순",
      ],
      rows,
      [0, 1, 2],
    ),
    "",
    `가운데 두 열은 정점 쌍 전부에서 잰 최댓값이고, 오른쪽 열은 줄의 양 끝을 잇는 경로 하나에서 잰 값입니다. 정점 ${comma(top.v)} 개에서 번호순이 ${comma(top.mp)} 덩어리, 크기순이 ${comma(top.mh)} 덩어리입니다.`,
  ].join("\n");
}

/** `deep.origin` ④ — 정점 16 개 애벌레에서 두 방식이 매긴 자리. */
function numbering16(): string {
  const v = 16;
  const edges = caterpillar(v);
  const d = decompose(v, edges, 0, "size");
  const plain = plainPos(v, edges, 0);
  const end = v - 2;
  const onPath = new Set(pathVertices(d, 0, end));
  const ids = [...Array(v).keys()];
  const seat = (pos: number[]) =>
    [...onPath].map((x) => pos[x] as number).sort((a, b) => a - b);
  return [
    md(
      ["정점", ...ids.map(String)],
      [
        ["번호순 자리", ...ids.map((x) => String(plain[x]))],
        ["크기순 자리", ...ids.map((x) => String(d.pos[x]))],
        [`경로 0~${end}`, ...ids.map((x) => (onPath.has(x) ? "■" : ""))],
      ],
      ids.map((i) => i + 1),
    ),
    "",
    `경로 위 정점 ${onPath.size} 개가 번호순에서는 자리 ${seat(plain).join(" ")} 에, 크기순에서는 자리 ${seat(d.pos).join(" ")} 에 앉습니다. 앞은 ${runCount(d, plain, 0, end)} 덩어리이고 뒤는 ${runCount(d, d.pos, 0, end)} 덩어리입니다.`,
  ].join("\n");
}

/** `deep.origin` ⑤ — 자식을 고르는 규칙 셋을 모양 다섯에 걸어 최대 조각 수를 잰다. */
function ruleSweep(): string {
  const shapes: [string, number, Edge[]][] = [
    ["한 줄로 이은 트리", 255, chain(255)],
    ["별 모양", 255, star(255)],
    ["잎이 먼저 나오는 애벌레", 255, leafFirstCaterpillar(255)],
    ["꽉 찬 이진 트리", 255, binary(255)],
    ["높이 덫", TRAP.v, TRAP.edges],
  ];
  const rows: string[][] = [];
  let inside = 0;
  for (const [name, v, edges] of shapes) {
    const s = maxSegments(v, edges, "size");
    const bound = 2 * floorLog2(v) + 1;
    if (s <= bound) inside += 1;
    rows.push([
      name,
      comma(v),
      comma(maxSegments(v, edges, "first")),
      comma(maxSegments(v, edges, "deep")),
      comma(s),
      comma(bound),
    ]);
  }
  return [
    md(
      [
        "트리 모양",
        "정점 V",
        "처음 만난 자식",
        "가장 깊은 자식",
        "가장 큰 부분트리",
        "2⌊log₂ V⌋ + 1",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    `칸마다 정점 쌍 전부에서 잰 최대 사슬 조각 수입니다. 오른쪽 끝 열은 파트 2 에서 유도하는 상한이고, 가장 큰 부분트리 규칙은 모양 ${shapes.length} 개 가운데 ${inside} 개에서 그 안쪽입니다.`,
  ].join("\n");
}

/** `deep.build` (c) — 사슬 하나를 이름에서 자리와 값까지 읽는다. */
function chainRead(): string {
  const head = READY.head as number[];
  const pos = READY.pos as number[];
  const base = READY.base as number[];
  const rows: string[][] = [];
  let ok = 0;
  const picks = [5, 3, 8];
  for (const x of picks) {
    const h = head[x] as number;
    const members = [...Array(WALK_N).keys()]
      .filter((y) => head[y] === h)
      .sort((a, b) => (pos[a] as number) - (pos[b] as number));
    const seats = members.map((y) => pos[y] as number);
    if (base[pos[x] as number] === WALK_VALUES[x]) ok += 1;
    rows.push([
      `정점 ${x}`,
      `head[${x}] = ${h}`,
      members.join(" · "),
      `[${Math.min(...seats)},${Math.max(...seats)}]`,
      `pos[${x}] = ${pos[x]}`,
      String(base[pos[x] as number]),
    ]);
  }
  return [
    md(
      [
        "고른 정점",
        "사슬 머리",
        "그 사슬의 정점",
        "사슬이 앉은 자리",
        "자리 번호",
        "기저 배열의 값",
      ],
      rows,
      [5],
    ),
    "",
    `정점 ${picks.length} 개 가운데 기저 배열의 그 자리에 자기 값이 앉아 있는 것은 ${ok} 개입니다.`,
  ].join("\n");
}

/** `deep.build` (d) — 사슬끼리 · 사슬 안의 관계. */
function chainRelation(): string {
  const cases: [number, Edge[]][] = [
    [WALK_N, WALK_EDGES],
    [1_023, binary(1_023)],
    [255, leafFirstCaterpillar(255)],
  ];
  const checked = [0, 0, 0, 0];
  const bad = [0, 0, 0, 0];
  const tick = (k: number, fail: boolean) => {
    checked[k] = (checked[k] as number) + 1;
    if (fail) bad[k] = (bad[k] as number) + 1;
  };
  for (const [v, edges] of cases) {
    const d = decompose(v, edges, 0, "size");
    for (let x = 0; x < v; x++) {
      const p = d.parent[x] as number;
      const isRoot = p === x;
      const h = d.heavy[x] as number;
      if (h !== -1) {
        tick(
          0,
          d.head[h] !== d.head[x] || d.pos[h] !== (d.pos[x] as number) + 1,
        );
      }
      if (!isRoot && d.head[x] !== x) tick(1, d.heavy[p] !== x);
      if (!isRoot && d.head[x] === x) {
        tick(2, d.head[p] === d.head[x] || d.heavy[p] === x);
      }
    }
    const byHead = new Map<number, number[]>();
    for (let x = 0; x < v; x++) {
      const h = d.head[x] as number;
      byHead.set(h, [...(byHead.get(h) ?? []), d.pos[x] as number]);
    }
    for (const seats of byHead.values()) {
      seats.sort((a, b) => a - b);
      tick(
        3,
        (seats.at(-1) as number) - (seats[0] as number) + 1 !== seats.length,
      );
    }
  }
  const names: [string, string][] = [
    [
      "무거운 자식은 부모와 같은 사슬이고 자리가 부모 바로 다음이다",
      "무거운 자식을 둔 정점",
    ],
    ["사슬 머리가 아닌 정점은 부모의 무거운 자식이다", "머리가 아닌 정점"],
    [
      "뿌리가 아닌 사슬 머리는 부모와 다른 사슬이다 — 그 사이가 가벼운 간선이다",
      "뿌리가 아닌 머리",
    ],
    ["사슬 하나가 기저 배열에서 이어진 자리를 차지한다", "사슬"],
  ];
  const rows = names.map(([a, b], i) => [
    a,
    b,
    comma(checked[i] as number),
    comma(bad[i] as number),
  ]);
  return [
    md(["관계", "재는 자리", "확인한 수", "어긋난 수"], rows, [2, 3]),
    "",
    `전개 입력 · 꽉 찬 이진 트리 정점 1,023 개 · 잎이 먼저 나오는 애벌레 정점 255 개에서 관계 ${rows.length} 개를 쟀고, 어긋난 수는 모두 ${bad.reduce((a, b) => a + b, 0)} 입니다.`,
  ].join("\n");
}

/** `deep.build` (e) — 자리 번호를 매기는 두 방식. */
function chainVsPreorder(): string {
  const shapes: [number, Edge[]][] = [
    [WALK_N, WALK_EDGES],
    [256, caterpillar(256)],
  ];
  const kinds: [string, (v: number, e: Edge[]) => number[]][] = [
    ["이웃 번호순 진입 순서", (v, e) => plainPos(v, e, 0)],
    ["사슬을 하나씩 붙인 순서", (v, e) => decompose(v, e, 0, "size").pos],
  ];
  const rows = kinds.map(([name, f]) => {
    const cells: string[] = [name];
    for (const [v, e] of shapes) {
      const d = decompose(v, e, 0, "size");
      cells.push(comma(maxRuns(d, f(v, e), v)));
    }
    for (const [v, e] of shapes) {
      const d = decompose(v, e, 0, "size");
      cells.push(`${comma(contiguousSubtrees(d, f(v, e), v))} / ${comma(v)}`);
    }
    return cells;
  });
  return [
    md(
      [
        "자리 번호를 매기는 방식",
        "경로의 최대 덩어리 · 전개 입력",
        "경로의 최대 덩어리 · 애벌레 256",
        "부분트리가 이어진 정점 · 전개 입력",
        "부분트리가 이어진 정점 · 애벌레 256",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    "앞의 두 열은 정점 쌍 전부에서 잰 최댓값이고, 뒤의 두 열은 부분트리 전체가 기저 배열에서 이어진 자리를 차지하는 정점의 수입니다.",
  ].join("\n");
}

/** `deep.build` 1단계 — 꺼낸 차례대로. */
function buildDfs(): string {
  const s = WALK.steps[1] as WalkStep;
  const pops = s.pops as Pop[];
  const rows = pops.map((p) => [
    String(p.u),
    list(p.near),
    p.skipped.length ? p.skipped.join(" · ") : "—",
    p.set.length
      ? p.set
          .map((w) => `parent[${w}] = ${p.u} · depth[${w}] = ${s.depth[w]}`)
          .join(" / ")
      : "—",
    list(p.stackAfter),
  ]);
  const skipped = pops.reduce((n, p) => n + p.skipped.length, 0);
  const parentSkips = pops.reduce(
    (n, p) => n + p.skipped.filter((w) => s.parent[p.u] === w).length,
    0,
  );
  const items = WALK.near.reduce((n, l) => n + l.length, 0);
  return [
    md(
      ["꺼낸 정점 u", "near[u]", "건너뛴 이웃", "새로 정한 것", "그 뒤 stack"],
      rows,
    ),
    "",
    `정점 ${pops.length} 개를 한 번씩 꺼냈고, 이웃 항목 ${items} 개 가운데 건너뛴 것이 ${skipped} 개입니다. 건너뛴 ${skipped} 개 가운데 꺼낸 정점의 부모인 것은 ${parentSkips} 개입니다. 꺼낸 차례는 ${WALK.order.join(" ")} 입니다.`,
  ].join("\n");
}

/** `deep.build` 2단계 — 꺼낸 차례의 뒤에서부터 크기를 더한다. */
function buildSize(): string {
  const s = WALK.steps[2] as WalkStep;
  const adds = s.adds as SizeAdd[];
  const rows = adds.map((a, i) => [
    String(i + 1),
    String(a.w),
    String(a.p),
    `size[${a.p}] = ${a.before} + ${s.size[a.w]} = ${a.after}`,
  ]);
  let late = 0;
  for (const [i, a] of adds.entries()) {
    if (adds.some((b, j) => b.p === a.w && j > i)) late += 1;
  }
  return [
    md(["차례", "더하는 정점 w", "부모 p", "부모의 크기"], rows, [0]),
    "",
    `뿌리를 뺀 정점 ${adds.length} 개를 한 번씩 더했고, 더하는 순간 제 크기가 아직 덜 모인 정점은 ${late} 개입니다. 끝난 뒤 size 는 ${list(s.size as number[])} 입니다.`,
  ].join("\n");
}

/** `deep.build` 3단계 — 자식이 있는 정점마다 무거운 자식을 고른다. */
function buildHeavy(): string {
  const s = WALK.steps[3] as WalkStep;
  const picks = s.picks as HeavyPick[];
  const rows = picks.map((p) => [
    String(p.p),
    p.children.map((c) => `${c.c}(크기 ${c.size})`).join(" · "),
    String(p.heavy),
    p.children
      .filter((c) => c.c !== p.heavy)
      .map((c) => c.c)
      .join(" · ") || "—",
  ]);
  const branching = picks.filter((p) => p.children.length > 1).map((p) => p.p);
  return [
    md(["부모", "자식과 부분트리 크기", "무거운 자식", "가벼운 자식"], rows),
    "",
    `자식이 둘 이상이라 크기를 실제로 비교한 정점은 ${branching.join(" · ")} 입니다. 나머지 ${picks.length - branching.length} 개는 자식이 하나라 그 자식이 곧 무거운 자식입니다.`,
  ].join("\n");
}

/** `deep.build` 3단계 — 가벼운 간선 아래의 크기는 부모의 절반 아래다. */
function lightHalf(): string {
  const cases: [string, number, Edge[]][] = [
    ["전개 입력", WALK_N, WALK_EDGES],
    ["꽉 찬 이진 트리 15", 15, binary(15)],
  ];
  const rows: string[][] = [];
  let all = 0;
  let ok = 0;
  for (const [name, v, edges] of cases) {
    const d = decompose(v, edges, 0, "size");
    let shown = 0;
    for (let c = 0; c < v; c++) {
      const p = d.parent[c] as number;
      if (p === c || d.heavy[p] === c) continue;
      all += 1;
      const sc = d.size[c] as number;
      const sh = d.size[d.heavy[p] as number] as number;
      const sp = d.size[p] as number;
      if (2 * sc < sp) ok += 1;
      if (shown < 3) {
        shown += 1;
        rows.push([
          name,
          `(${p}, ${c})`,
          String(sc),
          `size[${d.heavy[p]}] = ${sh}`,
          String(sp),
          `${sc} + ${sh} = ${sc + sh} ≤ ${sp} − 1`,
          `${sc} < ${sp / 2}`,
        ]);
      }
    }
  }
  return [
    md(
      [
        "트리",
        "가벼운 간선 (p, c)",
        "size[c]",
        "무거운 형제의 크기",
        "size[p]",
        "두 자식의 합",
        "size[c] 와 size[p] / 2",
      ],
      rows,
      [2, 4],
    ),
    "",
    `트리마다 앞의 셋까지만 적었습니다. 두 트리의 가벼운 간선 ${all} 개를 모두 재면 size[c] 가 size[p] 의 절반보다 작은 것이 ${ok} 개입니다.`,
  ].join("\n");
}

/** `deep.build` 3단계 — 가벼운 간선을 지날 때마다 크기가 절반 아래로 준다. */
function sizeHalving(): string {
  const bv = 1_023;
  const d = decompose(bv, binary(bv), 0, "size");
  let deep = 0;
  for (let a = 0; a < bv; a++) {
    if (lightEdges(d, a) > lightEdges(d, deep)) deep = a;
  }
  const down: number[] = [];
  let w = deep;
  while (true) {
    down.push(w);
    const p = d.parent[w] as number;
    if (p === w) break;
    w = p;
  }
  down.reverse();
  const rows: string[][] = [];
  let seen = 0;
  let prev = -1;
  for (const x of down) {
    const isRoot = (d.parent[x] as number) === x;
    const isLight = !isRoot && (d.head[x] as number) === x;
    if (!isRoot && !isLight) continue;
    if (isLight) seen += 1;
    rows.push([
      String(seen),
      comma(x),
      comma(d.size[x] as number),
      prev === -1 ? "—" : String(prev / 2),
    ]);
    prev = d.size[x] as number;
  }
  return [
    md(
      [
        "지난 가벼운 간선 수",
        "그때의 정점",
        "그 부분트리 크기",
        "직전 크기의 절반",
      ],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `꽉 찬 이진 트리 정점 ${comma(bv)} 개에서 가벼운 간선을 가장 많이 지나는 정점 ${comma(deep)} 까지 따라갔습니다. 가벼운 간선 ${seen} 개를 지났고, ⌊log₂ ${comma(bv)}⌋ = ${floorLog2(bv)} 입니다.`,
  ].join("\n");
}

/** `deep.build` 4단계 — 사슬 머리를 꺼낸 차례대로. */
function buildChains(): string {
  const s = WALK.steps[4] as WalkStep;
  const runs = s.runs as ChainRun[];
  const span = (r: ChainRun): string => {
    const seats = r.members.map((x) => s.pos[x] as number);
    return seats.length === 1
      ? `${seats[0]}`
      : `${seats[0]}~${seats.at(-1) as number}`;
  };
  const rows = runs.map((r) => [
    String(r.top),
    r.members.join(" → "),
    r.members.map((x) => s.pos[x] as number).join(" "),
    r.pushed.length ? r.pushed.join(" · ") : "—",
    list(r.topsAfter),
  ]);
  const spans = runs.map(span).join(" · ");
  const lastSeat = s.pos[(runs.at(-1) as ChainRun).members.at(-1) as number];
  return [
    md(
      [
        "꺼낸 머리",
        "무거운 자식을 따라간 사슬",
        "붙인 자리",
        "모아 둔 가벼운 자식",
        "그 뒤 tops",
      ],
      rows,
    ),
    "",
    `사슬 ${runs.length} 개가 차례로 자리 ${spans}${을를(lastSeat as number)} 받았습니다. 자리 번호는 모두 ${WALK_N} 개이고 두 정점이 같은 자리를 받은 경우는 ${WALK_N - new Set(s.pos as number[]).size} 번입니다.`,
  ].join("\n");
}

/** `deep.build` 5단계 — 기저 배열. */
function buildBase(): string {
  const pos = READY.pos as number[];
  const head = READY.head as number[];
  const base = READY.base as number[];
  const ids = [...Array(WALK_N).keys()];
  const at = (p: number) => pos.indexOf(p);
  return [
    md(
      ["자리 p", ...ids.map(String)],
      [
        ["그 자리의 정점", ...ids.map((p) => String(at(p)))],
        ["사슬 머리", ...ids.map((p) => String(head[at(p)]))],
        ["기저 배열", ...ids.map((p) => String(base[p]))],
      ],
      ids.map((i) => i + 1),
    ),
    "",
    `정점 값을 자리 번호 차례로 옮긴 기저 배열은 ${list(base)} 입니다.`,
  ].join("\n");
}

/** 질의 하나가 조각을 더하는 회차 — 걸음 기록에서 표의 줄로. */
function roundRows(tr: Trace, opIndex: number, label: string): string[][] {
  const steps = tr.steps.filter((s) => s.op === opIndex);
  return steps.map((s, i) => {
    const dep = (x: number) => s.depth[x] as number;
    const piece = s.piece as Piece;
    return [
      label,
      s.kind === "last" ? "끝" : `바퀴 ${i + 1}`,
      s.kind === "last"
        ? `head[${s.u}] = head[${s.v}] = ${s.headU}`
        : `head[${s.uIn}] = ${s.headU}(깊이 ${dep(s.headU as number)}) · head[${s.vIn}] = ${s.headV}(깊이 ${dep(s.headV as number)})`,
      s.kind === "last" ? "남은 한 조각" : `${s.swapped ? s.vIn : s.uIn} 쪽`,
      `${pieceText(piece)} · 정점 ${piece.vertices.join(" ")}`,
      String(piece.sum),
      String(s.total),
    ];
  });
}

/** `deep.build` 6단계 — 경로를 사슬 조각으로 나눠 더한다. */
function buildQuery(): string {
  const q2 = WALK.steps.filter((s) => s.op === 1);
  const q4 = WALK.steps.filter((s) => s.op === 3);
  const t2 = q2.at(-1)?.total as number;
  const t4 = q4.at(-1)?.total as number;
  return [
    md(
      [
        "질의",
        "회차",
        "두 사슬 머리",
        "고른 쪽",
        "더한 조각",
        "조각의 합",
        "total",
      ],
      [
        ...roundRows(WALK, 1, opText(WALK_OPS[1] as Op)),
        ...roundRows(WALK, 3, opText(WALK_OPS[3] as Op)),
      ],
      [5, 6],
    ),
    "",
    `${opText(WALK_OPS[1] as Op)} 는 조각 ${q2.length} 개로 ${t2}${을를(t2)}, 갱신 뒤의 ${opText(WALK_OPS[3] as Op)} 는 조각 ${q4.length} 개로 ${t4}${을를(t4)} 냅니다. 정본이 세 질의에 낸 답은 ${list(WALK.answers)} 입니다.`,
  ].join("\n");
}

/** 두 사슬 머리의 깊이가 같은 회차가 나오는 첫 질의 — 꽉 찬 이진 트리 15. */
function tieQuery(): { a: number; b: number } {
  const v = 15;
  const d = decompose(v, binary(v), 0, "size");
  for (let a = 0; a < v; a++) {
    for (let b = 0; b < v; b++) {
      let u = a;
      let w = b;
      while (d.head[u] !== d.head[w]) {
        const hu = d.depth[d.head[u] as number] as number;
        const hw = d.depth[d.head[w] as number] as number;
        if (hu === hw) return { a, b };
        if (hu < hw) {
          const t = u;
          u = w;
          w = t;
        }
        u = d.parent[d.head[u] as number] as number;
      }
    }
  }
  throw new Error("머리 깊이가 같은 회차가 없다");
}

/** `deep.build` 6단계 — 두 머리의 깊이가 같을 때. */
function buildTie(): string {
  const v = 15;
  const edges = binary(v);
  const values = Array.from({ length: v }, (_, i) => i + 1);
  const { a, b } = tieQuery();
  const tr = traced(v, edges, 0, values, [{ kind: "query", u: a, v: b }]);
  const rows = roundRows(tr, 0, `queryPath(${a}, ${b})`).map((r) => [
    ...r.slice(1, 5),
    r[6] as string,
  ]);
  const want = new HeavyLightDecomposition(v, edges, 0, values).queryPath(a, b);
  const d = decompose(v, edges, 0, "size");
  const walked = pathVertices(d, a, b).reduce(
    (n, x) => n + (values[x] as number),
    0,
  );
  return [
    md(["회차", "두 사슬 머리", "고른 쪽", "더한 조각", "total"], rows, [4]),
    "",
    `꽉 찬 이진 트리 정점 ${v} 개(정점 i 의 값 i + 1)에서 queryPath(${a}, ${b}) 입니다. 정본의 답은 ${want} 이고, 경로를 한 정점씩 걸어 더한 값도 ${walked} 입니다.`,
  ].join("\n");
}

/** `deep.build` 7단계 — 갱신이 고치는 것. */
function buildUpdate(): string {
  const s = WALK.steps.find((x) => x.kind === "update") as WalkStep;
  const node = s.node as number;
  const nodes = s.bitNodes as number[];
  const same =
    list(s.head as number[]) === list(READY.head as number[]) &&
    list(s.pos as number[]) === list(READY.pos as number[]);
  return [
    md(
      ["고치는 자리", "갱신 전", "갱신 뒤"],
      [
        [`values[${node}]`, String(s.from), String(s.to)],
        [
          `기저 배열의 자리 pos[${node}] = ${s.pos[node]}`,
          String(s.from),
          String(s.to),
        ],
        ["펜윅 트리의 칸", "—", nodes.map((i) => `bit[${i}]`).join(" · ")],
        ["head · pos", "—", same ? "그대로" : "바뀜"],
      ],
    ),
    "",
    `늘어난 값은 ${(s.to as number) - (s.from as number)} 이고, 펜윅 트리의 칸 ${nodes.length} 개에 그만큼을 더했습니다.`,
  ].join("\n");
}

/** `deep.build` 전제 — 전제가 깨지는 입력. */
function premise(): string {
  const rows: string[][] = [];
  const cut: Edge[] = [
    [0, 1],
    [2, 3],
  ];
  const vals = [1, 2, 3, 4];
  const hc = new HeavyLightDecomposition(4, cut, 0, vals.slice());
  rows.push([
    "간선 [0,1] · [2,3] — 둘로 떨어진 그래프",
    "0",
    "queryPath(2, 3)",
    String(hc.queryPath(2, 3)),
    "—",
    "없음 — 뿌리 0 에서 이어지지 않는다",
  ]);
  const four = chain(4);
  for (const root of [0, 2]) {
    const h = new HeavyLightDecomposition(4, four, root, vals.slice());
    const d = decompose(4, four, root, "size");
    rows.push([
      "한 줄로 이은 네 정점",
      String(root),
      "queryPath(0, 3)",
      String(h.queryPath(0, 3)),
      String(segmentCount(d, 0, 3)),
      String(vals.reduce((a, b) => a + b, 0)),
    ]);
  }
  return md(
    ["입력", "뿌리", "질의", "정본의 답", "사슬 조각", "경로를 걸어 더한 값"],
    rows,
    [3, 4],
  );
}

/** `deep.walk` 도입 — 전개 입력. */
function walkInput(): string {
  const ops = WALK_OPS.map(opText).join(" · ");
  return [
    `const n = ${WALK_N};`,
    "const edges: [number, number][] = [",
    `  ${WALK_EDGES.map(([a, b]) => `[${a}, ${b}]`).join(", ")},`,
    "];",
    `const root = ${WALK_ROOT};`,
    `const values = ${list(WALK_VALUES)};`,
    `// ${ops}`,
    `// 이 절이 끝나면 세 질의의 답이 ${list(WALK.answers)} 이어야 한다`,
  ].join("\n");
}

/** `deep.walk` 1 — T1 · T2. */
function walkT1T2(): string {
  const s = WALK.steps[1] as WalkStep;
  const lines: string[][] = WALK.near.map((l, u) => [
    u === 0 ? "T1" : "",
    `near[${u}] = ${list(l)}`,
  ]);
  const items = WALK.near.reduce((n, l) => n + l.length, 0);
  lines.push([
    "",
    `목록 길이의 합 ${items} = 간선 ${WALK_EDGES.length} 개 × 2`,
  ]);
  lines.push(["T2", `꺼낸 차례   ${WALK.order.join(" ")}`]);
  lines.push(["", `depth[·]    ${(s.depth as number[]).join(" ")}`]);
  lines.push(["", `parent[·]   ${(s.parent as number[]).join(" ")}`]);
  return columnsText(lines);
}

/** `deep.walk` 2 — T3 · T4. */
function walkT3T4(): string {
  const s3 = WALK.steps[2] as WalkStep;
  const s4 = WALK.steps[3] as WalkStep;
  const heavy = (s4.heavy as number[]).map((h) => (h === -1 ? "-" : String(h)));
  return columnsText([
    ["T3", "size[·] ", (s3.size as number[]).join(" ")],
    ["T4", "heavy[·]", heavy.join(" ")],
  ]);
}

/** `deep.walk` 3 — T5. */
function walkT5(): string {
  const s = WALK.steps[4] as WalkStep;
  const runs = s.runs as ChainRun[];
  const rows: string[][] = runs.map((r, i) => [
    i === 0 ? "T5" : "",
    `머리 ${r.top}`,
    r.members.join(" → "),
    `자리 ${r.members.map((x) => s.pos[x]).join(" ")}`,
  ]);
  rows.push(["", "head[·]", (s.head as number[]).join(" "), ""]);
  rows.push(["", "pos[·]", (s.pos as number[]).join(" "), ""]);
  return columnsText(rows);
}

/** `deep.walk.pause` — 무거운 자식을 처음 만난 자식으로 골라도 답이 같다. */
function mutantFirstChild(): string {
  const Mut = FIRST_CHILD;
  const rows: string[][] = [];
  const add = (
    name: string,
    ref: number[],
    mut: number[],
    v: number,
    edges: Edge[],
  ) => {
    rows.push([
      name,
      list(ref),
      list(mut),
      list(ref) === list(mut) ? "같다" : "어긋난다",
      String(maxSegments(v, edges, "size")),
      String(maxSegments(v, edges, "first")),
    ]);
  };
  add(
    "전개 입력(정점 아홉)",
    walkAnswers(REFCLASS),
    walkAnswers(Mut),
    WALK_N,
    WALK_EDGES,
  );
  const cases: [string, number, Edge[]][] = [
    ["잎이 먼저 나오는 애벌레 255", 255, leafFirstCaterpillar(255)],
    ["꽉 찬 이진 트리 255", 255, binary(255)],
    ["정점 하나", 1, []],
  ];
  for (const [name, v, edges] of cases) {
    add(name, probe(REFCLASS, v, edges), probe(Mut, v, edges), v, edges);
  }
  return md(
    [
      "입력",
      "정본의 답",
      "처음 만난 자식으로 고른 답",
      "두 답",
      "정본의 최대 조각 수",
      "바꾼 뒤 최대 조각 수",
    ],
    rows,
    [4, 5],
  );
}

/** `deep.walk` 4 — T6. */
function walkT6(): string {
  const base = READY.base as number[];
  const bit: number[] = Array.from({ length: WALK_N + 1 }, () => 0);
  for (let p = 0; p < WALK_N; p++) bit[p + 1] = base[p] as number;
  for (let i = 1; i <= WALK_N; i++) {
    const j = i + (i & -i);
    if (j <= WALK_N) bit[j] = (bit[j] as number) + (bit[i] as number);
  }
  const ids = [...Array(WALK_N).keys()];
  return columnsText([
    ["T6", "자리 p", ...ids.map(String)],
    ["", "기저 배열", ...base.map(String)],
    ["", "bit[p + 1]", ...ids.map((p) => String(bit[p + 1]))],
  ]);
}

/** 질의 걸음을 등폭 줄로. */
function queryLines(opIndex: number): string[][] {
  const out: string[][] = [];
  for (const [i, s] of WALK.steps.entries()) {
    if (s.op !== opIndex) continue;
    const piece = s.piece as Piece;
    const dep = (x: number) => s.depth[x] as number;
    if (s.kind === "round") {
      out.push([
        stepOf(i),
        `head[${s.uIn}] = ${s.headU} · head[${s.vIn}] = ${s.headV}`,
        `깊이 ${dep(s.headU as number)} · ${dep(s.headV as number)} → ${s.swapped ? `맞바꿔 u = ${s.vIn}` : `u = ${s.uIn}`}`,
        `${pieceText(piece)} 합 ${piece.sum}`,
        `u ← parent[${piece.vertices[0]}] = ${s.u}`,
        `total = ${s.total}`,
      ]);
    } else if (s.kind === "last") {
      out.push([
        stepOf(i),
        `head[${s.u}] = head[${s.v}] = ${s.headU}`,
        "같다 → 반복을 나온다",
        `${pieceText(piece)} 합 ${piece.sum}`,
        "",
        `답 ${s.total}`,
      ]);
    }
  }
  return out;
}

/** `deep.walk` 5 — T7. */
const walkT7 = (): string => columnsText(queryLines(0));

/** `deep.walk` 6 — T8 ~ T10. */
const walkT8 = (): string => columnsText(queryLines(1));

/** `deep.walk.pause` — 반복 횟수는 경로 길이를 따라가지 않는다. */
function loopVsLength(): string {
  const cv = 100_000;
  const dc = decompose(cv, chain(cv), 0, "size");
  const cc = hldCounted(
    cv,
    chain(cv),
    0,
    Array.from({ length: cv }, () => 1),
  );
  const bv = 131_071;
  const db = decompose(bv, binary(bv), 0, "size");
  const cb = hldCounted(
    bv,
    binary(bv),
    0,
    Array.from({ length: bv }, () => 1),
  );
  const a = bv - 1;
  const b = Math.floor(bv / 2);
  const lenC = pathVertices(dc, 0, cv - 1).length;
  const lenB = pathVertices(db, a, b).length;
  const cellsC = cc.query(0, cv - 1).cells;
  const cellsB = cb.query(a, b).cells;
  const segC = segmentCount(dc, 0, cv - 1);
  const segB = segmentCount(db, a, b);
  return [
    md(
      [
        "트리 모양",
        "정점 V",
        "물어본 두 정점",
        "경로 위 정점",
        "사슬 조각",
        "반복 바퀴",
        "칸 접근",
      ],
      [
        [
          "한 줄로 이은 트리",
          comma(cv),
          `0 · ${comma(cv - 1)}`,
          comma(lenC),
          String(segC),
          String(segC - 1),
          String(cellsC),
        ],
        [
          "꽉 찬 이진 트리",
          comma(bv),
          `${comma(a)} · ${comma(b)}`,
          comma(lenB),
          String(segB),
          String(segB - 1),
          String(cellsB),
        ],
      ],
      [1, 3, 4, 5, 6],
    ),
    "",
    `위 줄이 아래 줄보다 경로 위 정점이 ${comma(Math.round(lenC / lenB))} 배쯤 많은데, 칸 접근은 ${comma(Math.round(cellsB / cellsC))} 분의 1 쯤입니다.`,
  ].join("\n");
}

/** `deep.walk` 7 — T11 ~ T13. */
function walkT11(): string {
  const i = WALK.steps.findIndex((s) => s.kind === "update");
  const s = WALK.steps[i] as WalkStep;
  const node = s.node as number;
  const delta = (s.to as number) - (s.from as number);
  const lines: string[][] = [
    [
      stepOf(i),
      `values[${node}] ${s.from} → ${s.to} · delta = ${delta}`,
      `pos[${node}] = ${s.pos[node]} 이라 i = ${(s.pos[node] as number) + 1} 부터`,
      "",
      "",
      "",
    ],
  ];
  const nodes = s.bitNodes as number[];
  for (const [k, x] of nodes.entries()) {
    const next = x + (x & -x);
    lines.push([
      "",
      `i = ${x} · bit[${x}] += ${delta}`,
      `다음 i = ${x} + (${x} & -${x}) = ${next}${k === nodes.length - 1 ? ` > ${WALK_N} 이라 끝` : ""}`,
      "",
      "",
      "",
    ]);
  }
  lines.push(...queryLines(3));
  return columnsText(lines);
}

/** `deep.walk` 8 — 열세 걸음을 한 장의 표로. */
function walkTrace(): string {
  const rows = WALK.steps.map((s, i) => {
    let judge = "—";
    if (s.kind === "dfs") {
      const skipped = (s.pops ?? []).reduce((n, p) => n + p.skipped.length, 0);
      judge = `이미 본 이웃 ${skipped} 번 건너뜀`;
    } else if (s.kind === "size") {
      judge = `더하기 ${(s.adds ?? []).length} 번`;
    } else if (s.kind === "heavy") {
      judge = `무거운 자식 ${(s.picks ?? []).length} 개를 적음`;
    } else if (s.kind === "chains") {
      judge = `사슬 ${(s.runs ?? []).length} 개 · 자리 ${WALK_N} 개`;
    } else if (s.kind === "fenwick") {
      judge = `기저 배열 ${list(s.base as number[])}`;
    } else if (s.kind === "round") {
      const hu = s.depth[s.headU as number] as number;
      const hv = s.depth[s.headV as number] as number;
      judge = `head ${s.headU} ≠ ${s.headV} · 머리 깊이 ${hu} ${hu < hv ? "<" : "≥"} ${hv}`;
    } else if (s.kind === "last") {
      judge = `head ${s.headU} = ${s.headV}`;
    } else if (s.kind === "update") {
      judge = `bit ${(s.bitNodes ?? []).join(" · ")} 에 ${(s.to as number) - (s.from as number)} 더함`;
    }
    const marks = stepMarks(i);
    return [
      stepOf(i),
      stepDoing(i),
      judge,
      marks.length ? marks.join(" ") : "—",
      s.piece ? String(s.total) : "—",
      list(s.answers),
    ];
  });
  const seen = new Map<string, string[]>();
  for (const [i] of WALK.steps.entries()) {
    for (const m of stepMarks(i)) {
      seen.set(m, [...(seen.get(m) ?? []), stepOf(i)]);
    }
  }
  const cover = [...seen.entries()]
    .sort((a, b) => (a[0].codePointAt(0) ?? 0) - (b[0].codePointAt(0) ?? 0))
    .map(([m, ts]) => `${m} 은 ${ts.join(" · ")}`)
    .join(", ");
  return [
    md(["걸음", "하는 일", "조건 판정", "갈래", "total", "답 목록"], rows),
    "",
    `${cover} 에서 실행됐습니다. 걸음은 모두 ${WALK.steps.length} 개이고 세 질의의 답은 ${list(WALK.answers)} 입니다.`,
  ].join("\n");
}

/** `deep.walk` 8 — 분기마다 몇 번 실행됐는가. */
function branchCover(): string {
  const qs = WALK_OPS.flatMap((op) =>
    op.kind === "query" ? [[op.u, op.v] as [number, number]] : [],
  );
  const up = WALK_OPS.find((op) => op.kind === "update") as Extract<
    Op,
    { kind: "update" }
  >;
  const b = branchCounts(WALK_N, WALK_EDGES, WALK_ROOT, qs, up.node);
  const rows: string[][] = [
    ["①", "이미 지나온 정점을 건너뛴다", String(b.skip)],
    ["②", "무거운 자식 자리를 새로 쓴다", String(b.record)],
    ["③", "사슬 머리와 자리 번호를 붙인다", String(b.place)],
    ["④", "더 깊은 머리 쪽 조각을 잘라 낸다", b.deeper.join(" · ")],
    ["⑤", "남은 한 조각을 더한다", b.last.join(" · ")],
    ["⑥", "펜윅 트리의 칸을 고친다", String(b.fenwick)],
  ];
  return [
    md(["분기", "하는 일", "실행 횟수"], rows, [2]),
    "",
    `④ 와 ⑤ 는 질의 셋의 값을 차례로 적은 것이고, ⑥ 이 고친 칸은 bit[${b.fenwickNodes.join("] · bit[")}] 입니다.`,
  ].join("\n");
}

/** `deep.walk` 8 — 네 연산의 칸 접근. */
function walkOps(): string {
  const d = decompose(WALK_N, WALK_EDGES, WALK_ROOT, "size");
  const c = hldCounted(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES.slice());
  const rows: string[][] = [];
  let sum = 0;
  for (const op of WALK_OPS) {
    if (op.kind === "update") {
      const cells = c.update(op.node, op.value);
      sum += cells;
      rows.push([
        opText(op),
        `정점 ${op.node} 한 자리`,
        "—",
        "—",
        String(cells),
      ]);
      continue;
    }
    const r = c.query(op.u, op.v);
    sum += r.cells;
    rows.push([
      opText(op),
      pathVertices(d, op.u, op.v).join(" → "),
      String(segmentCount(d, op.u, op.v)),
      String(r.sum),
      String(r.cells),
    ]);
  }
  return [
    md(["연산", "경로", "사슬 조각", "답", "칸 접근"], rows, [2, 3, 4]),
    "",
    `준비가 칸 접근 ${c.pre} 번이고 네 연산이 ${sum} 번입니다.`,
  ].join("\n");
}

/** `deep.walk.final` — 정본에 전개 입력을 그대로 넣은 결과. */
function walkResult(): string {
  const answers = walkAnswers(REFCLASS);
  const d = decompose(WALK_N, WALK_EDGES, WALK_ROOT, "size");
  const qs = WALK_OPS.filter((op) => op.kind === "query") as Extract<
    Op,
    { kind: "query" }
  >[];
  return [
    md(
      ["연산", "답", "사슬 조각"],
      qs.map((op, i) => [
        opText(op),
        String(answers[i]),
        String(segmentCount(d, op.u, op.v)),
      ]),
      [1, 2],
    ),
    "",
    `세 답을 차례로 모으면 ${list(answers)} 입니다.`,
  ].join("\n");
}

/** `deep.math` ② — 정의를 전개 입력에 넣어 확인한다. */
function sizeCheck(): string {
  const d = decompose(WALK_N, WALK_EDGES, WALK_ROOT, "size");
  const rows: string[][] = [];
  let same = 0;
  for (let v = 0; v < WALK_N; v++) {
    const under: number[] = [];
    for (let x = 0; x < WALK_N; x++) {
      let y = x;
      while (true) {
        if (y === v) {
          under.push(x);
          break;
        }
        const p = d.parent[y] as number;
        if (p === y) break;
        y = p;
      }
    }
    if (under.length === d.size[v]) same += 1;
    rows.push([
      String(v),
      under.join(" "),
      String(d.size[v]),
      (d.heavy[v] as number) === -1 ? "—" : String(d.heavy[v]),
      String(lightEdges(d, v)),
    ]);
  }
  return [
    md(
      ["정점 v", "그 아래 정점 전부", "sz(v)", "hv(v)", "ℓ(v)"],
      rows,
      [0, 2, 3, 4],
    ),
    "",
    `아래 정점을 직접 센 수와 sz(v) 가 ${WALK_N} 줄 가운데 ${same} 줄에서 같습니다.`,
  ].join("\n");
}

/** `deep.math` ③ — 첫째 유도를 전개 입력의 간선 전부에 넣는다. */
function mathHalfCheck(): string {
  const d = decompose(WALK_N, WALK_EDGES, WALK_ROOT, "size");
  const rows: string[][] = [];
  for (let c = 0; c < WALK_N; c++) {
    const p = d.parent[c] as number;
    if (p === c) continue;
    const sc = d.size[c] as number;
    const sp = d.size[p] as number;
    rows.push([
      `(${p}, ${c})`,
      d.heavy[p] !== c ? "가벼운 간선" : "무거운 간선",
      String(sc),
      String(sp / 2),
      2 * sc < sp ? "참" : "거짓",
    ]);
  }
  const light = rows.filter((r) => r[1] === "가벼운 간선");
  const heavyFalse = rows.filter(
    (r) => r[1] === "무거운 간선" && r[4] === "거짓",
  );
  return [
    md(
      ["간선 (p, c)", "종류", "sz(c)", "sz(p) / 2", "sz(c) < sz(p) / 2"],
      rows,
      [2, 3],
    ),
    "",
    `가벼운 간선 ${light.length} 개 가운데 참인 것은 ${light.filter((r) => r[4] === "참").length} 개이고, 무거운 간선 ${rows.length - light.length} 개 가운데 거짓인 것은 ${heavyFalse.length} 개입니다.`,
  ].join("\n");
}

/** `deep.math` ③ — 셋째 유도를 전개 입력의 질의에 넣는다. */
function mathSegments(): string {
  const d = decompose(WALK_N, WALK_EDGES, WALK_ROOT, "size");
  const qs = WALK_OPS.filter((op) => op.kind === "query") as Extract<
    Op,
    { kind: "query" }
  >[];
  const rows = qs.map((op) => {
    const lu = lightEdges(d, op.u);
    const lv = lightEdges(d, op.v);
    return [
      `s(${op.u}, ${op.v})`,
      String(lu),
      String(lv),
      String(lu + lv + 1),
      String(segmentCount(d, op.u, op.v)),
    ];
  });
  return [
    md(
      ["질의", "ℓ(u)", "ℓ(v)", "ℓ(u) + ℓ(v) + 1", "실제 s(u, v)"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `V = ${WALK_N} 의 2⌊log₂ V⌋ + 1 은 ${2 * floorLog2(WALK_N) + 1} 입니다.`,
  ].join("\n");
}

/** `deep.math` ④ — 유도한 상한을 실측과 나란히 놓는다. */
function lightBound(): string {
  const cases: [string, number, Edge[], boolean][] = [
    ["전개 입력", WALK_N, WALK_EDGES, true],
    ["꽉 찬 이진 트리 255", 255, binary(255), true],
    ["꽉 찬 이진 트리 1,023", 1_023, binary(1_023), true],
    ["꽉 찬 이진 트리 131,071", 131_071, binary(131_071), false],
    [
      "잎이 먼저 나오는 애벌레 100,000",
      100_000,
      leafFirstCaterpillar(100_000),
      false,
    ],
  ];
  const rows = cases.map(([name, v, edges, exact]) => [
    name,
    comma(v),
    String(maxLight(v, edges)),
    String(floorLog2(v)),
    exact ? String(maxSegments(v, edges, "size")) : "—",
    String(2 * floorLog2(v) + 1),
  ]);
  return [
    md(
      [
        "트리",
        "정점 V",
        "실측 최대 ℓ",
        "상한 ⌊log₂ V⌋",
        "실측 최대 s",
        "상한 2⌊log₂ V⌋ + 1",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    "ℓ 은 정점 전부에서 잰 최댓값이고 s 는 정점 쌍 전부에서 잰 최댓값입니다. 아래 두 줄은 정점 쌍이 너무 많아 s 를 전수로 재지 않았습니다.",
  ].join("\n");
}

/** `deep.math` ④ — 규모 상한에서 질의 하나의 상한. */
function queryBound(): string {
  const v = 100_000;
  const lg = floorLog2(v);
  const s = 2 * lg + 1;
  const move = 8 * s - 4;
  const fen = s * 2 * (lg + 1);
  const ones = Array.from({ length: v }, () => 1);
  const naive =
    naiveWalk(v, chain(v), 0, ones, [[0, v - 1]]).cells - (3 * v + 2 * (v - 1));
  return [
    md(
      ["항", "식", `V = ${comma(v)} 에서`],
      [
        ["사슬 조각 수 s", "2⌊log₂ V⌋ + 1", String(s)],
        ["조각을 옮겨 가며 읽는 칸", "8s − 4", comma(move)],
        ["조각마다 펜윅 트리를 읽는 칸", "s × 2(⌊log₂ V⌋ + 1)", comma(fen)],
        ["질의 하나의 상한", "둘의 합", comma(move + fen)],
      ],
      [2],
    ),
    "",
    `경로를 걷는 방법이 같은 규모의 사슬 두 끝에서 질의 하나에 ${comma(naive)} 칸이었으니, 그 ${comma(Math.round(naive / (move + fen)))} 분의 1 쯤입니다.`,
  ].join("\n");
}

/** `invariant` ② — 전개 입력에서 회차마다의 상태. */
function invStates(): string {
  const opIndex = 1;
  const op = WALK_OPS[opIndex] as Extract<Op, { kind: "query" }>;
  const d = decompose(WALK_N, WALK_EDGES, WALK_ROOT, "size");
  const path = pathVertices(d, op.u, op.v);
  const rows: string[][] = [];
  let u = op.u;
  let v = op.v;
  let added: number[] = [];
  let total = 0;
  let ok = 0;
  const check = (label: string, restPath: number[]) => {
    const rest = new Set(restPath);
    const union = new Set([...restPath, ...added]);
    const disjoint = added.every((x) => !rest.has(x));
    const whole = union.size === path.length && path.every((x) => union.has(x));
    const sumOk =
      total === added.reduce((n, x) => n + (WALK_VALUES[x] as number), 0);
    if (disjoint && whole && sumOk) ok += 1;
    rows.push([
      label,
      restPath.length ? String(u) : "—",
      restPath.length ? String(v) : "—",
      restPath.length ? restPath.join(" ") : "없음",
      String(total),
      added.length ? added.join(" ") : "없음",
    ]);
  };
  const steps = WALK.steps.filter((s) => s.op === opIndex);
  check("첫 바퀴에 들어갈 때", pathVertices(d, u, v));
  for (const [k, s] of steps.entries()) {
    added = [...added, ...(s.piece as Piece).vertices];
    total = s.total as number;
    if (s.kind === "round") {
      u = s.u as number;
      v = s.v as number;
      check(
        k === steps.length - 2
          ? "반복을 나올 때"
          : `바퀴 ${k + 2} 에 들어갈 때`,
        pathVertices(d, u, v),
      );
    } else {
      check("마지막 조각을 더한 뒤", []);
    }
  }
  return [
    md(
      ["시점", "u", "v", "아직 안 더한 정점(u–v 경로)", "total", "더한 정점"],
      rows,
      [4],
    ),
    "",
    `원래 경로는 ${path.join(" ")} 입니다. ${rows.length} 줄 가운데 두 목록이 겹치지 않고 합치면 원래 경로이며 total 이 더한 정점의 값 합과 같은 줄은 ${ok} 줄입니다.`,
  ].join("\n");
}

/** `invariant` ② — 엣지 케이스. */
function invEdges(): string {
  const rows: string[][] = [];
  const run = (
    name: string,
    n: number,
    edges: Edge[],
    root: number,
    values: number[],
    q: [number, number],
  ) => {
    const h = new HeavyLightDecomposition(n, edges, root, values.slice());
    const d = decompose(n, edges, root, "size");
    const walked = pathVertices(d, q[0], q[1]).reduce(
      (s, x) => s + (values[x] as number),
      0,
    );
    rows.push([
      name,
      `queryPath(${q[0]}, ${q[1]})`,
      String(segmentCount(d, q[0], q[1])),
      String(h.queryPath(q[0], q[1])),
      String(walked),
    ]);
  };
  run("정점 하나", 1, [], 0, [42], [0, 0]);
  run("정점 둘", 2, [[0, 1]], 0, [3, 4], [1, 0]);
  run("전개 입력 · 같은 정점 둘", WALK_N, WALK_EDGES, 0, WALK_VALUES, [5, 5]);
  run("값이 전부 음수", 3, chain(3), 0, [-1, -2, -3], [0, 2]);
  run("전개 입력 · 뿌리 0", WALK_N, WALK_EDGES, 0, WALK_VALUES, [3, 6]);
  run("전개 입력 · 뿌리 8", WALK_N, WALK_EDGES, 8, WALK_VALUES, [3, 6]);
  return md(
    ["입력", "질의", "사슬 조각", "정본의 답", "경로를 걸어 더한 값"],
    rows,
    [2, 3, 4],
  );
}

/** `invariant` ③ — 사슬 머리의 깊이 대신 정점의 깊이로 고르면. */
function mutantVertexDepth(): string {
  const Mut = VERTEX_DEPTH;
  const rows: string[][] = [];
  const add = (name: string, a: number[], b: number[]) =>
    rows.push([
      name,
      list(a),
      list(b),
      list(a) === list(b) ? "같다" : "어긋난다",
    ]);
  add("전개 입력(정점 아홉)", walkAnswers(REFCLASS), walkAnswers(Mut));
  const cases: [string, number, Edge[]][] = [
    ["꽉 찬 이진 트리 15", 15, binary(15)],
    ["한 줄로 이은 8", 8, chain(8)],
    ["잎이 먼저 나오는 애벌레 31", 31, leafFirstCaterpillar(31)],
    ["정점 하나", 1, []],
  ];
  for (const [name, v, edges] of cases) {
    add(name, probe(REFCLASS, v, edges), probe(Mut, v, edges));
  }
  return md(["입력", "정본", "정점 자신의 깊이로 고른 판", "두 답"], rows);
}

/** `invariant` ③ — 바꾼 판이 전개 입력의 셋째 질의에서 하는 일. */
function vertexDepthTrace(): string {
  const d = decompose(WALK_N, WALK_EDGES, WALK_ROOT, "size");
  const values = WALK_VALUES.slice();
  const up = WALK_OPS[2] as Extract<Op, { kind: "update" }>;
  values[up.node] = up.value;
  const base: number[] = Array.from({ length: WALK_N }, () => 0);
  for (let x = 0; x < WALK_N; x++)
    base[d.pos[x] as number] = values[x] as number;
  const sum = (l: number, r: number) => {
    let s = 0;
    for (let i = l; i <= r; i++) s += base[i] as number;
    return s;
  };
  const q = WALK_OPS[3] as Extract<Op, { kind: "query" }>;
  const lines: string[][] = [];
  const run = (label: string, depthOf: (x: number) => number): number => {
    let u = q.u;
    let v = q.v;
    let total = 0;
    let first = true;
    while (d.head[u] !== d.head[v]) {
      const du = depthOf(u);
      const dv = depthOf(v);
      if (du < dv) {
        const t = u;
        u = v;
        v = t;
      }
      const h = d.head[u] as number;
      const l = d.pos[h] as number;
      const r = d.pos[u] as number;
      total += sum(l, r);
      lines.push([
        first ? label : "",
        `비교 ${du} · ${dv} → ${u} 쪽`,
        `자리 ${l}~${r} 합 ${sum(l, r)}`,
        `u ← parent[${h}] = ${d.parent[h]}`,
        `total = ${total}`,
      ]);
      first = false;
      u = d.parent[h] as number;
    }
    const lo = Math.min(d.pos[u] as number, d.pos[v] as number);
    const hi = Math.max(d.pos[u] as number, d.pos[v] as number);
    total += sum(lo, hi);
    lines.push([
      first ? label : "",
      `머리가 같다 · u = ${u} · v = ${v}`,
      `${lo === hi ? `자리 ${lo}` : `자리 ${lo}~${hi}`} 합 ${sum(lo, hi)}`,
      "",
      `답 ${total}`,
    ]);
    return total;
  };
  const refAns = run("정본", (x) => d.depth[d.head[x] as number] as number);
  const mutAns = run("바꾼 판", (x) => d.depth[x] as number);
  const want = walkAnswers(REFCLASS).at(-1);
  const got = walkAnswers(VERTEX_DEPTH).at(-1);
  if (refAns !== want) throw new Error("정본 따라가기가 정본의 답과 다르다");
  // 중화 실행에서는 변이가 정본과 같으므로 이 대조를 건너뛴다.
  if (got !== want && mutAns !== got) {
    throw new Error("바꾼 판 따라가기가 변이의 답과 다르다");
  }
  return columnsText(lines);
}

/** `perf.derive` — 전개 입력의 준비를 걸음마다. */
function costRows(): string {
  const c = hldCounted(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES.slice());
  const V = WALK_N;
  const E = WALK_EDGES.length;
  const R = c.records;
  const C = c.chains;
  const s2 = popcount(V);
  const items: [string, string, string, number][] = [
    [
      "배열 만들기",
      "11V + 1",
      "길이 V 짜리 배열 열 개와 길이 V + 1 짜리 bit",
      11 * V + 1,
    ],
    ["이웃 목록 채우기", "2E", "간선 하나를 양쪽 목록에 넣는다", 2 * E],
    ["시작점 표시", "2", "뿌리를 스택에 넣고 seen[root] 를 쓴다", 2],
    ["정점 꺼내기", "2V", "꺼내기와 order 에 적기", 2 * V],
    ["이웃 항목 보기", "4E", "항목 2E 개마다 목록 한 칸과 seen 한 칸", 4 * E],
    [
      "자식 확정",
      "5(V − 1)",
      "뿌리를 뺀 정점마다 seen · parent · depth 두 칸 · 스택",
      5 * (V - 1),
    ],
    ["크기 더하기", "5(V − 1)", "뿌리를 뺀 정점마다 다섯 칸", 5 * (V - 1)],
    [
      "무거운 자식 고르기",
      "V + 3(V − 1) + 2R",
      "order 한 번 · 정점마다 세 칸 · 새로 쓴 자리마다 두 칸",
      V + 3 * (V - 1) + 2 * R,
    ],
    [
      "사슬과 자리 번호",
      "5V + 2E + 2C",
      "정점마다 다섯 칸 · 이웃 항목마다 한 칸 · 사슬마다 넣기와 꺼내기",
      5 * V + 2 * E + 2 * C,
    ],
    [
      "기저 배열과 펜윅 트리",
      "4V + 3(V − s₂(V))",
      "값 넣기가 정점마다 네 칸 · 칸 합치기가 V − s₂(V) 곳에서 세 칸",
      4 * V + 3 * (V - s2),
    ],
  ];
  const sum = items.reduce((n, [, , , x]) => n + x, 0);
  if (sum !== c.pre) {
    throw new Error(`항별 합 ${sum} 이 실측 ${c.pre} 과 다르다`);
  }
  return [
    md(
      ["걸음", "식", "근거", "전개 입력의 칸"],
      items.map(([a, b, why, x]) => [a, b, why, String(x)]),
      [3],
    ),
    "",
    `전개 입력은 V = ${V} · E = ${E} · R = ${R} · C = ${C} · s₂(V) = ${s2} 이고, ${items.length} 줄의 합 ${sum} 이 계수 사본이 센 준비 칸 ${c.pre} 과 같습니다.`,
  ].join("\n");
}

/** `perf.derive` — 전처리 닫힌 형태와 실측. */
function costClosedForm(): string {
  const cases: [string, number, Edge[]][] = [
    ["전개 입력", WALK_N, WALK_EDGES],
    ["한 줄로 이은 100", 100, chain(100)],
    ["별 모양 100", 100, star(100)],
    ["꽉 찬 이진 트리 1,000", 1_000, binary(1_000)],
    ["꽉 찬 이진 트리 100,000", 100_000, binary(100_000)],
  ];
  const rows: string[][] = [];
  let zero = 0;
  for (const [name, v, edges] of cases) {
    const values = Array.from({ length: v }, (_, i) => (i % 97) + 1);
    const c = hldCounted(v, edges, 0, values);
    const closed = 47 * v + 2 * c.records + 2 * c.chains - 3 * popcount(v) - 18;
    if (c.pre === closed) zero += 1;
    rows.push([
      name,
      comma(v),
      comma(c.records),
      comma(c.chains),
      comma(c.pre),
      comma(closed),
      String(c.pre - closed),
    ]);
  }
  return [
    md(
      [
        "입력",
        "V",
        "R",
        "C",
        "실측 준비 칸",
        "47V + 2R + 2C − 3·s₂(V) − 18",
        "차이",
      ],
      rows,
      [1, 2, 3, 4, 5, 6],
    ),
    "",
    `입력 ${cases.length} 개 가운데 차이가 0 인 것은 ${zero} 개입니다.`,
  ].join("\n");
}

/** `perf.bounds` — 질의 하나의 최선과 최악. */
function boundsCoef(): string {
  const v = 100_000;
  const lg = floorLog2(v);
  const cost = (s: number) => 8 * s - 4 + s * 2 * (lg + 1);
  const cc = hldCounted(
    v,
    chain(v),
    0,
    Array.from({ length: v }, () => 1),
  );
  const measuredCells = cc.query(0, v - 1).cells;
  const worstS = 2 * lg + 1;
  return [
    md(
      ["경우", "사슬 조각 s", "질의 하나의 칸 상한", "실측"],
      [
        [
          "최선 — 사슬이 하나",
          "1",
          String(cost(1)),
          `한 줄로 이은 트리의 두 끝 ${measuredCells}`,
        ],
        ["최악 — 조각이 가장 많다", String(worstS), comma(cost(worstS)), "—"],
      ],
      [1, 2],
    ),
    "",
    `V = ${comma(v)} 기준입니다. 두 상한의 비는 ${Math.round(cost(worstS) / cost(1))} 배쯤입니다.`,
  ].join("\n");
}

/** `perf.worst` — 모양 넷의 생김새. */
function shapeList(): string {
  const v = 20_000;
  const shapes: [string, string, Edge[]][] = [
    ["한 줄로 이은 트리", "0 — 1 — 2 — … 로 한 줄", chain(v)],
    ["별 모양", "정점 0 이 나머지 전부와 이어진다", star(v)],
    ["애벌레", "줄 하나에 잎을 하나씩 매단다", caterpillar(v)],
    ["꽉 찬 이진 트리", "정점 i 의 부모가 (i − 1) >> 1", binary(v)],
  ];
  const rows = shapes.map(([name, how, edges]) => {
    const d = decompose(v, edges, 0, "size");
    return [
      name,
      how,
      comma(edges.length),
      comma(new Set(d.head).size),
      comma(Math.max(...d.depth)),
    ];
  });
  return md(
    ["모양", "만드는 법", "간선", "사슬", "가장 큰 깊이"],
    rows,
    [2, 3, 4],
  );
}

/** `perf.worst` — 모양만 바꿔 같은 작업 목록을 건다. */
function shapeValues(): string {
  const v = 20_000;
  const shapes: [string, Edge[]][] = [
    ["한 줄로 이은 트리", chain(v)],
    ["별 모양", star(v)],
    ["애벌레", caterpillar(v)],
    ["꽉 찬 이진 트리", binary(v)],
  ];
  const values = Array.from({ length: v }, (_, i) => (i % 97) + 1);
  const rows: string[][] = [];
  let spread = 0;
  for (const [name, edges] of shapes) {
    const c = hldCounted(v, edges, 0, values.slice());
    let sum = 0;
    let mx = 0;
    for (let i = 0; i < v; i++) {
      const r = c.query(i % v, (37 * i) % v);
      sum += r.cells;
      mx = Math.max(mx, r.cells);
    }
    spread = sum;
    rows.push([
      name,
      "골고루",
      comma(c.pre),
      comma(sum),
      comma(c.pre + sum),
      comma(mx),
    ]);
  }
  const edges = binary(v);
  const c = hldCounted(v, edges, 0, values.slice());
  const d = decompose(v, edges, 0, "size");
  let deepA = 1;
  let deepB = 2;
  for (let a = 1; a < v; a++) {
    let top = a;
    while ((d.parent[top] as number) !== 0) top = d.parent[top] as number;
    if (top === 1 && (d.depth[a] as number) > (d.depth[deepA] as number))
      deepA = a;
    if (top === 2 && (d.depth[a] as number) > (d.depth[deepB] as number))
      deepB = a;
  }
  let sum2 = 0;
  let mx2 = 0;
  for (let i = 0; i < v; i++) {
    const r = c.query(deepA, deepB);
    sum2 += r.cells;
    mx2 = Math.max(mx2, r.cells);
  }
  rows.push([
    "꽉 찬 이진 트리",
    `${comma(deepA)} · ${comma(deepB)} 되풀이`,
    comma(c.pre),
    comma(sum2),
    comma(c.pre + sum2),
    comma(mx2),
  ]);
  return [
    md(
      ["입력 모양", "질의", "준비 칸", "질의 칸", "합", "질의 하나 최대"],
      rows,
      [2, 3, 4, 5],
    ),
    "",
    `정점 ${comma(v)} 개 · 질의 ${comma(v)} 개입니다. 골고루는 i 번째 질의가 (i mod V, 37i mod V) 이고, 마지막 줄은 서로 다른 절반에서 가장 깊은 잎 둘을 골라 같은 질의를 되풀이한 것입니다. 그 줄의 질의 칸이 넷째 줄 골고루 질의의 ${(sum2 / spread).toFixed(1)} 배입니다.`,
  ].join("\n");
}

/** `purpose.alt` — 한 번만 잰다. 정점 100,000 개에 질의 100,000 개를 두 설계에 거는 일이라 무겁다. */
let MEASURED: ReturnType<typeof measure> | null = null;
const measured = (): ReturnType<typeof measure> => {
  MEASURED ??= measure();
  return MEASURED;
};

/** `purpose.alt` — 두 설계를 같은 작업 목록에 걸어 잰 값. */
function altFlip(): string {
  const m = measured();
  const points = [0, 10_000, 27_610, 27_611, 100_000];
  const rows = points.map((q) => {
    const a = m.hld[q] as number;
    const b = m.euler[q] as number;
    return [
      comma(q),
      comma(a),
      comma(b),
      a <= b ? "무거운 경로 분할" : "오일러 구간 갱신과 조상 표",
    ];
  });
  const firstFlip = points.find(
    (q) => (m.hld[q] as number) > (m.euler[q] as number),
  ) as number;
  return [
    md(
      ["질의 수", "무거운 경로 분할", "오일러 구간 갱신과 조상 표", "적은 쪽"],
      rows,
      [0, 1, 2],
    ),
    "",
    `꽉 찬 이진 트리 정점 100,000 개 · 정점 i 의 값 (i mod 97) + 1 · i 번째 질의 (i mod V, 37i mod V) 입니다. 접근 수는 준비와 그 수까지의 질의를 합친 것이고, 질의를 한 개 단위로 늘려 재면 순서가 뒤집히는 첫 자리가 ${comma(firstFlip)} 입니다.`,
  ].join("\n");
}

/** `purpose.alt` — 배수와 추가 칸. */
function altTable(): string {
  const m = measured();
  const ratio = (a: number, b: number) =>
    (Math.max(a, b) / Math.min(a, b)).toFixed(1);
  const row = (label: string, a: number, b: number): string[] => [
    label,
    comma(a),
    comma(b),
    a < b
      ? `무거운 경로 분할 · ${ratio(a, b)} 배 적다`
      : `오일러 구간 갱신 · ${ratio(a, b)} 배 적다`,
  ];
  return md(
    ["재는 것", "무거운 경로 분할", "오일러 구간 갱신과 조상 표", "적은 쪽"],
    [
      row("준비 · 칸 접근", m.hld[0] as number, m.euler[0] as number),
      row(
        "질의 10,000 개까지 · 칸 접근",
        m.hld[10_000] as number,
        m.euler[10_000] as number,
      ),
      row(
        "질의 100,000 개까지 · 칸 접근",
        m.hld[100_000] as number,
        m.euler[100_000] as number,
      ),
      row("추가 칸", m.hldStore, m.eulerStore),
    ],
    [1, 2],
  );
}

/** `selfcheck` — queryPath(6, 8) 을 따라간다. */
function checkSixEight(): string {
  const tr = traced(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, [
    { kind: "query", u: 6, v: 8 },
  ]);
  const lines: string[][] = [];
  const steps = tr.steps.filter((s) => s.op === 0);
  for (const [i, s] of steps.entries()) {
    const piece = s.piece as Piece;
    const vals = piece.vertices.map((x) => WALK_VALUES[x] as number);
    if (s.kind === "round") {
      const dep = (x: number) => s.depth[x] as number;
      lines.push([
        `바퀴 ${i + 1}`,
        `head[${s.uIn}] = ${s.headU} · head[${s.vIn}] = ${s.headV}`,
        `머리 깊이 ${dep(s.headU as number)} · ${dep(s.headV as number)}`,
        `${pieceText(piece)} = ${vals.join(" + ")} = ${piece.sum}`,
        `u ← ${s.u}`,
      ]);
    } else {
      lines.push([
        "끝",
        `head[${s.u}] = head[${s.v}] = ${s.headU}`,
        "같다",
        `${pieceText(piece)} = ${vals.join(" + ")} = ${piece.sum}`,
        "",
      ]);
    }
  }
  const d = decompose(WALK_N, WALK_EDGES, WALK_ROOT, "size");
  const path = pathVertices(d, 6, 8);
  lines.push([
    "답",
    `${steps.map((s) => (s.piece as Piece).sum).join(" + ")} = ${tr.answers[0]}`,
    "",
    `경로 ${path.join("→")} 의 값 합 ${path.reduce((n, x) => n + (WALK_VALUES[x] as number), 0)}`,
    "",
  ]);
  return columnsText(lines);
}

/* ────────────────────────── 증명 블록 목록 ────────────────────────── */

const BLOCKS: Record<string, () => string> = {
  "concept-ops": conceptOps,
  "naive-walk": naiveScale,
  "chain-interval": chainInterval,
  "prefix-vs-fenwick": prefixVsFenwick,
  "numbering-runs": numberingRuns,
  "numbering-16": numbering16,
  "rule-sweep": ruleSweep,
  "chain-read": chainRead,
  "chain-relation": chainRelation,
  "chain-vs-preorder": chainVsPreorder,
  "build-dfs": buildDfs,
  "build-size": buildSize,
  "build-heavy": buildHeavy,
  "light-half": lightHalf,
  "size-halving": sizeHalving,
  "build-chains": buildChains,
  "build-base": buildBase,
  "build-query": buildQuery,
  "build-tie": buildTie,
  "build-update": buildUpdate,
  premise,
  "walk-input": walkInput,
  "walk-t1t2": walkT1T2,
  "walk-t3t4": walkT3T4,
  "walk-t5": walkT5,
  "mutant-first-child": mutantFirstChild,
  "walk-t6": walkT6,
  "walk-t7": walkT7,
  "walk-t8": walkT8,
  "loop-vs-length": loopVsLength,
  "walk-t11": walkT11,
  "walk-trace": walkTrace,
  "branch-cover": branchCover,
  "walk-ops": walkOps,
  "walk-result": walkResult,
  "size-check": sizeCheck,
  "math-half-check": mathHalfCheck,
  "math-segments": mathSegments,
  "light-bound": lightBound,
  "query-bound": queryBound,
  "inv-states": invStates,
  "inv-edges": invEdges,
  "mutant-vertex-depth": mutantVertexDepth,
  "vertex-depth-trace": vertexDepthTrace,
  "cost-rows": costRows,
  "cost-closed-form": costClosedForm,
  "bounds-coef": boundsCoef,
  "shape-list": shapeList,
  "shape-values": shapeValues,
  "alt-flip": altFlip,
  "alt-table": altTable,
  "check-six-eight": checkSixEight,
};

/** 펜스로 싣는 블록 — 등폭 글자라 물결표를 그대로 둔다. */
const FENCED = new Set([
  "walk-input",
  "walk-t1t2",
  "walk-t3t4",
  "walk-t5",
  "walk-t6",
  "walk-t7",
  "walk-t8",
  "walk-t11",
  "vertex-depth-trace",
  "check-six-eight",
]);

/**
 * 표와 문장으로 싣는 블록은 범위의 물결표를 `\~` 로 적는다. 한 문단에 홑물결이 둘이면 GFM 이 그
 * 사이를 취소선으로 읽기 때문이다(`build-html` 이 잡는다).
 */
export const PROOFS: Record<string, () => string> = Object.fromEntries(
  Object.entries(BLOCKS).map(([k, f]) => [
    k,
    FENCED.has(k) ? f : () => f().replaceAll("~", "\\~"),
  ]),
);
