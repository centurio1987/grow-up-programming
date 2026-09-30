/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 칸을 읽었는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 표의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수만 낸다.
 * 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **큰 입력은 기록 없는 판으로 잰다.** `counted` 의 기록(`record`)은 걸음마다 배열 전체를 베끼므로,
 * 정점 수천 개 이상에서는 `record = false` 로 값만 센다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 *
 * 걸음 재생 패널과 그림(`-guide.fig.tsx`)이 쓰는 걸음 기록(`WALK`)도 여기서 만든다 — 원고의 걸음
 * 표 · 패널 · 그림이 한 기록에서 나와야 셋이 같은 걸음을 말한다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { SubtreeSumQuery } from "./subtreeSumQuery-guide.ref.ts";

export type Edge = [number, number];

/** 작업 목록 한 줄. */
export type Op =
  | { kind: "update"; node: number; value: number }
  | { kind: "query"; node: number };

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 트리. 정점 여섯 · 간선 다섯 · 뿌리 0.
 *
 * 갈래를 한 입력에서 전부 실행한다. 뿌리에 자식이 둘이라 스택에 정점이 셋 쌓이는 자리가
 * 나오고, 한쪽은 잎 둘을 단 깊이 2 이며 다른 쪽은 자식 하나만 달아 부분트리 크기가
 * 1 · 2 · 3 · 6 으로 갈린다. 이웃 목록에 부모가 먼저 오는 자리(정점 1 의 이웃 0)가 있어
 * 「이미 자리를 받았다」 갈래도 실행된다.
 */
export const WALK_N = 6;
export const WALK_ROOT = 0;
export const WALK_EDGES: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
];
export const WALK_VALUES = [1, 2, 3, 4, 5, 6];

/** 전개가 처리하는 작업 목록 — 질의 하나, 갱신 하나, 다시 질의 둘. */
export const WALK_OPS: Op[] = [
  { kind: "query", node: 1 },
  { kind: "update", node: 4, value: 10 },
  { kind: "query", node: 1 },
  { kind: "query", node: 0 },
];

/** 정점 하나. */
export const ONE_N = 1;
export const ONE_EDGES: Edge[] = [];

/** 정점 둘. */
export const TWO_N = 2;
export const TWO_EDGES: Edge[] = [[0, 1]];

/** 사슬 — 정점을 한 줄로 이은 모양이다. */
export function chain(n: number): Edge[] {
  const out: Edge[] = [];
  for (let v = 1; v < n; v++) out.push([v - 1, v]);
  return out;
}

/** 별 — 뿌리 하나에 잎이 전부 매달린 모양이다. */
export function star(n: number): Edge[] {
  const out: Edge[] = [];
  for (let v = 1; v < n; v++) out.push([0, v]);
  return out;
}

/** 완전 이진 트리. */
export function binary(n: number): Edge[] {
  const out: Edge[] = [];
  for (let v = 1; v < n; v++) out.push([(v - 1) >> 1, v]);
  return out;
}

/** 무작위 트리 — 정점 `v` 의 부모를 `0 … v−1` 에서 고른다. 시드를 고정해 결정론이다. */
export function randomTree(n: number, seed: number): Edge[] {
  let s = seed;
  const next = (): number => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s;
  };
  const out: Edge[] = [];
  for (let v = 1; v < n; v++) out.push([next() % v, v]);
  return out;
}

/** 값 생성식 — 부호가 섞이게 둔다. */
export function vals(n: number): number[] {
  return Array.from({ length: n }, (_, v) => ((v * 37) % 101) - 50);
}

/** 작업 목록 생성식 — 갱신 자리도 질의 자리도 정점 전체를 고르게 지난다. */
export function mixedOps(n: number, rounds: number): Op[] {
  const out: Op[] = [];
  for (let t = 0; t < rounds; t++) {
    out.push({
      kind: "update",
      node: (t * 401) % n,
      value: ((t * 53) % 199) - 99,
    });
    out.push({ kind: "query", node: (t * 613) % n });
  }
  return out;
}

/** 갱신만 하는 작업 목록 — `mixedOps` 의 갱신 줄만 뽑는다. */
export function updatesOnly(n: number, rounds: number): Op[] {
  return mixedOps(n, rounds).filter((o) => o.kind === "update");
}

/** 질의만 하는 작업 목록 — `mixedOps` 의 질의 줄만 뽑는다. */
export function queriesOnly(n: number, rounds: number): Op[] {
  return mixedOps(n, rounds).filter((o) => o.kind === "query");
}

/* ────────────────────── 글자 맞춤 ────────────────────── */

/** 고정폭 화면에서 한글은 두 칸을 먹는다. 글자 수로 맞추면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** `1,024` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** `[0, 1, 3]` 꼴 — 본문 표기와 같다. */
export const list = (a: readonly (number | string)[]): string =>
  `[${a.join(", ")}]`;

/** `1 · 3 · 4` 꼴 — 정점 모음을 적는다. */
const dots = (a: readonly number[]): string => a.join(" · ");

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

/** 구간 표기 `[a,b]` — 본문 전체가 이 한 표기를 쓴다(`L25`). */
export const span = (a: number, b: number): string => `[${a},${b}]`;

/** 원문자 갈래 뒤의 「은/는」 — 원문자를 숫자로 읽는다(① 일 · ② 이 · … · ⑨ 구). */
const 은는갈래 = (m: string): string => 은는("①②③④⑤⑥⑦⑧⑨".indexOf(m) + 1);

/* ────────────────────── 세는 사본 — 이 글의 절차 ────────────────────── */

/** 순회가 한 걸음에 한 일. */
export interface WalkEvent {
  kind: "자리" | "건너뜀" | "구간 끝";
  v: number;
  w: number | null;
  tin: number[];
  tout: number[];
  stack: number[];
  timer: number;
}

/** 펜윅 트리를 만드는 한 걸음. */
export interface BuildStep {
  from: number;
  to: number;
  inRange: boolean;
  tree: number[];
}

/** 작업 하나를 처리한 기록. */
export interface OpStep {
  kind: "update" | "query";
  node: number;
  /** 갱신이면 새 값, 질의면 `null`. */
  value: number | null;
  /** 갱신이면 바뀌기 전 값. */
  before: number | null;
  span: [number, number];
  /** 갱신이 고친 칸, 또는 구간 끝까지의 앞에서부터의 합이 읽은 칸. */
  hiPath: number[];
  /** 구간 시작 앞까지의 앞에서부터의 합이 읽은 칸. 갱신이면 빈 목록이다. */
  loPath: number[];
  hiSum: number;
  loSum: number;
  delta: number;
  answer: number | null;
  tree: number[];
  values: number[];
}

export interface Counted {
  tin: number[];
  tout: number[];
  tree: number[];
  /** 펜윅 트리를 쌓기 전, 칸에 기저 배열 값만 옮겨 적은 상태. */
  seeded: number[];
  walk: WalkEvent[];
  builds: BuildStep[];
  logs: OpStep[];
  answers: number[];
  /** 만들 때 배열 칸에 접근한 횟수. */
  build: number;
  /** 작업 목록을 처리하며 배열 칸에 접근한 횟수. */
  ops: number;
  /** 들고 있는 배열 칸 수. */
  cells: number;
}

/**
 * 정본과 같은 절차에 세는 자리와 기록만 덧붙인 사본.
 *
 * 배열 칸 접근은 **읽기 하나와 쓰기 하나를 각각 한 번**으로 센다 — 이 글이 끝까지 쓰는 단위다.
 */
export function counted(
  n: number,
  edges: Edge[],
  root: number,
  values: number[],
  ops: Op[],
  record = true,
): Counted {
  let build = 0;
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
    build += 2;
  }

  const tin: number[] = Array.from({ length: n }, () => -1);
  const tout: number[] = Array.from({ length: n }, () => -1);
  const value = values.slice();
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const cursor: number[] = Array.from({ length: n }, () => 0);
  const stack = [root];
  const walk: WalkEvent[] = [];
  let timer = 0;
  seen[root] = true;
  tin[root] = timer;
  timer++;
  build += 2;
  const note = (kind: WalkEvent["kind"], v: number, w: number | null) => {
    if (!record) return;
    walk.push({
      kind,
      v,
      w,
      tin: tin.slice(),
      tout: tout.slice(),
      stack: stack.slice(),
      timer,
    });
  };
  note("자리", root, null);

  while (stack.length > 0) {
    const v = stack[stack.length - 1] as number;
    const nbrs = near[v] as number[];
    const i = cursor[v] as number;
    build += 2;
    if (i < nbrs.length) {
      cursor[v] = i + 1;
      const w = nbrs[i] as number;
      build += 3;
      if (seen[w] !== true) {
        seen[w] = true;
        tin[w] = timer;
        timer++;
        build += 2;
        stack.push(w);
        note("자리", v, w);
      } else {
        note("건너뜀", v, w);
      }
      continue;
    }
    tout[v] = timer - 1;
    build++;
    stack.pop();
    note("구간 끝", v, null);
  }

  const tree: number[] = Array.from({ length: n + 1 }, () => 0);
  for (let v = 0; v < n; v++) {
    tree[(tin[v] as number) + 1] = values[v] as number;
    build += 3;
  }
  const seeded = record ? tree.slice() : [];
  const builds: BuildStep[] = [];
  for (let i = 1; i <= n; i++) {
    const up = i + (i & -i);
    const inRange = up <= n;
    if (inRange) {
      tree[up] = (tree[up] as number) + (tree[i] as number);
      build += 3;
    }
    if (record) {
      builds.push({ from: i, to: up, inRange, tree: tree.slice() });
    }
  }

  let cost = 0;
  const logs: OpStep[] = [];
  const answers: number[] = [];
  const prefix = (last: number): { sum: number; path: number[] } => {
    let sum = 0;
    const path: number[] = [];
    for (let i = last + 1; i > 0; i -= i & -i) {
      sum += tree[i] as number;
      if (record) path.push(i);
      cost++;
    }
    return { sum, path };
  };

  for (const op of ops) {
    if (op.kind === "update") {
      const before = value[op.node] as number;
      const delta = op.value - before;
      value[op.node] = op.value;
      cost += 3;
      const touched: number[] = [];
      for (let i = (tin[op.node] as number) + 1; i <= n; i += i & -i) {
        tree[i] = (tree[i] as number) + delta;
        if (record) touched.push(i);
        cost += 2;
      }
      if (record) {
        logs.push({
          kind: "update",
          node: op.node,
          value: op.value,
          before,
          span: [tin[op.node] as number, tout[op.node] as number],
          hiPath: touched,
          loPath: [],
          hiSum: 0,
          loSum: 0,
          delta,
          answer: null,
          tree: tree.slice(),
          values: value.slice(),
        });
      }
      continue;
    }
    cost += 2;
    const hi = prefix(tout[op.node] as number);
    const lo = prefix((tin[op.node] as number) - 1);
    answers.push(hi.sum - lo.sum);
    if (record) {
      logs.push({
        kind: "query",
        node: op.node,
        value: null,
        before: null,
        span: [tin[op.node] as number, tout[op.node] as number],
        hiPath: hi.path,
        loPath: lo.path,
        hiSum: hi.sum,
        loSum: lo.sum,
        delta: 0,
        answer: hi.sum - lo.sum,
        tree: tree.slice(),
        values: value.slice(),
      });
    }
  }

  return {
    tin,
    tout,
    tree,
    seeded,
    walk,
    builds,
    logs,
    answers,
    build,
    ops: cost,
    cells: 3 * n + (n + 1),
  };
}

/* ────────────────────── 세는 사본 — 비교하는 방법들 ────────────────────── */

/** 뿌리를 정해 부모 배열을 낸다. 아래 사본들이 함께 쓴다. */
export function parents(
  n: number,
  edges: Edge[],
  root: number,
): { parent: number[]; near: number[][]; order: number[]; reads: number } {
  let reads = 0;
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
    reads += 2;
  }
  const parent: number[] = Array.from({ length: n }, () => -1);
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  const stack = [root];
  seen[root] = true;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    order.push(u);
    reads++;
    for (const w of near[u] as number[]) {
      reads++;
      if (seen[w] === true) continue;
      seen[w] = true;
      parent[w] = u;
      reads += 2;
      stack.push(w);
    }
  }
  return { parent, near, order, reads };
}

export interface Design {
  build: number;
  ops: number;
  cells: number;
  answers: number[];
}

/**
 * 정의를 그대로 옮긴 방법 — 질의를 받을 때마다 그 부분트리를 처음부터 돌며 더한다.
 * 갱신은 값 배열의 칸 하나를 교체하는 것으로 끝난다. 정점마다 값 한 칸 · 부모 한 칸을 읽고
 * 이웃 항목마다 한 칸을 읽는다고 센다.
 */
export function byWalking(
  n: number,
  edges: Edge[],
  root: number,
  values: number[],
  ops: Op[],
): Design {
  const p = parents(n, edges, root);
  const value = values.slice();
  let cost = 0;
  const answers: number[] = [];
  for (const op of ops) {
    if (op.kind === "update") {
      value[op.node] = op.value;
      cost++;
      continue;
    }
    let sum = 0;
    const stack = [op.node];
    while (stack.length > 0) {
      const u = stack.pop() as number;
      sum += value[u] as number;
      cost += 2; // value 읽기 · parent 읽기
      const parentOfU = p.parent[u] as number;
      for (const w of p.near[u] as number[]) {
        cost++;
        if (w === parentOfU) continue;
        stack.push(w);
      }
    }
    answers.push(sum);
  }
  return { build: p.reads, ops: cost, cells: 2 * n, answers };
}

/**
 * 기저 배열 위에 **앞에서부터의 합 배열**을 두는 방법 — 질의는 칸 둘을 읽어 빼면 끝이지만,
 * 갱신 하나가 그 자리 뒤의 합을 전부 고쳐야 한다.
 */
export function byPrefixArray(
  n: number,
  edges: Edge[],
  root: number,
  values: number[],
  ops: Op[],
): Design {
  const c = counted(n, edges, root, values, [], false);
  const at: number[] = Array.from({ length: n }, () => 0);
  for (let v = 0; v < n; v++) at[c.tin[v] as number] = v;
  const line = at.map((v) => values[v] as number);
  const pre: number[] = Array.from({ length: n + 1 }, () => 0);
  for (let i = 0; i < n; i++) {
    pre[i + 1] = (pre[i] as number) + (line[i] as number);
  }
  const value = values.slice();

  let cost = 0;
  const answers: number[] = [];
  for (const op of ops) {
    if (op.kind === "update") {
      const delta = op.value - (value[op.node] as number);
      value[op.node] = op.value;
      cost += 3;
      for (let i = (c.tin[op.node] as number) + 1; i <= n; i++) {
        pre[i] = (pre[i] as number) + delta;
        cost += 2;
      }
      continue;
    }
    cost += 4; // tout 읽기 · tin 읽기 · 합 두 칸 읽기
    answers.push(
      (pre[(c.tout[op.node] as number) + 1] as number) -
        (pre[c.tin[op.node] as number] as number),
    );
  }
  return { build: c.build + 2 * n, ops: cost, cells: 3 * n + (n + 1), answers };
}

/** 기저 배열 위에서 **구간을 매번 처음부터 더하는** 방법. 갱신은 칸 하나 교체다. */
export function byLineSum(
  n: number,
  edges: Edge[],
  root: number,
  values: number[],
  ops: Op[],
): Design {
  const c = counted(n, edges, root, values, [], false);
  const at: number[] = Array.from({ length: n }, () => 0);
  for (let v = 0; v < n; v++) at[c.tin[v] as number] = v;
  const line = at.map((v) => values[v] as number);

  let cost = 0;
  const answers: number[] = [];
  for (const op of ops) {
    if (op.kind === "update") {
      line[c.tin[op.node] as number] = op.value;
      cost += 2;
      continue;
    }
    let sum = 0;
    cost += 2;
    for (
      let i = c.tin[op.node] as number;
      i <= (c.tout[op.node] as number);
      i++
    ) {
      sum += line[i] as number;
      cost++;
    }
    answers.push(sum);
  }
  return { build: c.build, ops: cost, cells: 3 * n, answers };
}

/** 이 글의 절차를 `Design` 모양으로 — 표에서 다른 방법과 나란히 놓는다. */
export function byEulerFenwick(
  n: number,
  edges: Edge[],
  root: number,
  values: number[],
  ops: Op[],
): Design {
  const c = counted(n, edges, root, values, ops, false);
  return { build: c.build, ops: c.ops, cells: c.cells, answers: c.answers };
}

/** 자리를 **너비 우선**으로 매기는 사본. 자리 배열만 낸다. */
export function breadthPositions(
  n: number,
  edges: Edge[],
  root: number,
): number[] {
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
  }
  const pos: number[] = Array.from({ length: n }, () => -1);
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const queue = [root];
  seen[root] = true;
  pos[root] = 0;
  let timer = 1;
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head] as number;
    for (const w of near[u] as number[]) {
      if (seen[w] === true) continue;
      seen[w] = true;
      pos[w] = timer;
      timer++;
      queue.push(w);
    }
  }
  return pos;
}

/** 뿌리에서 본 정점마다의 부분트리 — 부모 사슬을 거슬러 올라가며 정의 그대로 모은다. */
export function allSubtrees(
  n: number,
  edges: Edge[],
  root: number,
): number[][] {
  const p = parents(n, edges, root);
  const out: number[][] = Array.from({ length: n }, () => []);
  for (let x = 0; x < n; x++) {
    let c = x;
    while (c !== -1) {
      (out[c] as number[]).push(x);
      c = p.parent[c] as number;
    }
  }
  return out;
}

/** 정의 그대로 — 뿌리 `root` 에서 봤을 때 정점 `v` 의 부분트리에 든 정점 번호. */
export function subtreeOf(
  n: number,
  edges: Edge[],
  root: number,
  v: number,
): number[] {
  return allSubtrees(n, edges, root)[v] as number[];
}

/** 자리 배열이 이 정점 모음을 끊기지 않는 구간으로 담는가. */
export function isContiguous(pos: number[], members: number[]): boolean {
  const spots = members.map((x) => pos[x] as number);
  const lo = Math.min(...spots);
  const hi = Math.max(...spots);
  return hi - lo + 1 === spots.length;
}

/** 재귀로 적은 사본 — 자리 매기기만 한다. 깊은 사슬에서 호출 스택이 먼저 끝난다. */
export function recursivePositions(
  n: number,
  edges: Edge[],
  root: number,
): { tin: number[]; tout: number[] } {
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
  }
  const tin: number[] = Array.from({ length: n }, () => -1);
  const tout: number[] = Array.from({ length: n }, () => -1);
  let timer = 0;
  const go = (v: number, parent: number): void => {
    tin[v] = timer;
    timer++;
    for (const w of near[v] as number[]) {
      if (w === parent) continue;
      go(w, v);
    }
    tout[v] = timer - 1;
  };
  go(root, -1);
  return { tin, tout };
}

/* ────────────────────────── 자기대조 ────────────────────────── */

const 자기대조_입력: [string, number, Edge[], number][] = [
  ["전개 입력", WALK_N, WALK_EDGES, WALK_ROOT],
  ["정점 하나", ONE_N, ONE_EDGES, 0],
  ["정점 둘", TWO_N, TWO_EDGES, 0],
  ["사슬 17", 17, chain(17), 0],
  ["별 17", 17, star(17), 0],
  ["완전 이진 31", 31, binary(31), 0],
  ["사슬 17 · 뿌리 8", 17, chain(17), 8],
  ["완전 이진 63 · 뿌리 5", 63, binary(63), 5],
  ["무작위 40", 40, randomTree(40, 7), 0],
];

/** 정본을 그대로 실행해 작업 목록의 답을 낸다. */
export function 정본답(
  n: number,
  edges: Edge[],
  root: number,
  values: number[],
  ops: Op[],
): number[] {
  const sst = new SubtreeSumQuery(n, edges, root, values);
  const out: number[] = [];
  for (const op of ops) {
    if (op.kind === "update") sst.update(op.node, op.value);
    else out.push(sst.querySubtree(op.node));
  }
  return out;
}

const 같은가 = (a: number[], b: number[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/** 세는 사본들이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  for (const [label, n, edges, root] of 자기대조_입력) {
    const values = n === WALK_N ? WALK_VALUES : vals(n);
    const ops = n === WALK_N ? WALK_OPS : mixedOps(n, 12);
    const want = 정본답(n, edges, root, values, ops);
    const designs: [string, typeof byWalking][] = [
      ["세는 사본", byEulerFenwick],
      ["정의를 옮긴 사본", byWalking],
      ["앞에서부터의 합 배열 사본", byPrefixArray],
      ["구간을 다 더하는 사본", byLineSum],
    ];
    for (const [name, run] of designs) {
      if (!같은가(run(n, edges, root, values, ops).answers, want)) {
        throw new Error(`${name}이 정본과 다른 답을 낸다 — ${label}`);
      }
    }
    const r = recursivePositions(n, edges, root);
    const c = counted(n, edges, root, values, [], false);
    if (!같은가(r.tin, c.tin) || !같은가(r.tout, c.tout)) {
      throw new Error(`재귀 사본이 다른 자리를 매긴다 — ${label}`);
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./subtreeSumQuery-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  SubtreeSumQuery: new (
    n: number,
    edges: Edge[],
    root: number,
    values: number[],
  ) => {
    update(node: number, value: number): void;
    querySubtree(node: number): number;
  };
}

/** **불변식을 지키던 줄** — 끝 자리를 마지막으로 나간 자리가 아니라 자기 자리로 둔 사본. */
const selfOnly = await loadMutant<Impl>(REF, {
  swap: [/this\.tout\[v\] = timer - 1;/, "this.tout[v] = this.tin[v];"],
});

/** 구간의 시작 앞에서 끊지 않고 시작 자리에서 끊은 사본 — 자기 값이 함께 빠진다. */
const dropSelf = await loadMutant<Impl>(REF, {
  swap: [
    /this\.prefix\(\(this\.tin\[node\] as number\) - 1\)/,
    "this.prefix(this.tin[node] as number)",
  ],
});

/** 값 교체를 누적으로 둔 사본 — 차이가 아니라 새 값을 그대로 더한다. */
const addNotSet = await loadMutant<Impl>(REF, {
  swap: [
    /const delta = value - \(this\.value\[node\] as number\);/,
    "const delta = value;",
  ],
});

/** 새 값을 적어 두지 않는 사본 — **한 정점을 두 번 갱신할 때만** 답이 갈린다. */
const keepOld = await loadMutant<Impl>(REF, {
  drop: /this\.value\[node\] = value;/,
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 생성자가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = selfOnly.SubtreeSumQuery === SubtreeSumQuery;

/** 변이 하나를 작업 목록에 걸어 정본과 나란히 놓는다. */
function 변이답(
  impl: Impl,
  n: number,
  edges: Edge[],
  root: number,
  values: number[],
  ops: Op[],
): number[] {
  const sst = new impl.SubtreeSumQuery(n, edges, root, values);
  const out: number[] = [];
  for (const op of ops) {
    if (op.kind === "update") sst.update(op.node, op.value);
    else out.push(sst.querySubtree(op.node));
  }
  return out;
}

/** 한 정점을 두 번 갱신하는 작업 목록 — `keepOld` 가 갈리는 자리다. */
export const TWICE_OPS: Op[] = [
  { kind: "update", node: 4, value: 10 },
  { kind: "update", node: 4, value: 20 },
  { kind: "query", node: 1 },
  { kind: "query", node: 0 },
];

/** 정점마다 한 번씩만 갱신하는 작업 목록 — `keepOld` 가 안 갈리는 자리다. */
export const ONCE_OPS: Op[] = [
  { kind: "update", node: 4, value: 10 },
  { kind: "update", node: 5, value: 20 },
  { kind: "query", node: 1 },
  { kind: "query", node: 0 },
];

const 갈리는_변이: {
  label: string;
  impl: Impl;
  cases: [number, Edge[], number, number[], Op[]][];
}[] = [
  {
    label: "끝 자리를 자기 자리로 둔 판",
    impl: selfOnly,
    cases: [[WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, WALK_OPS]],
  },
  {
    label: "시작 자리에서 끊은 판",
    impl: dropSelf,
    cases: [[WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, WALK_OPS]],
  },
  {
    label: "차이가 아니라 새 값을 더한 판",
    impl: addNotSet,
    cases: [[WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, WALK_OPS]],
  },
  {
    label: "새 값을 적어 두지 않은 판",
    impl: keepOld,
    cases: [[WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, TWICE_OPS]],
  },
];

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  for (const { label, impl, cases } of 갈리는_변이) {
    if (
      cases.every(([n, e, r, v, o]) =>
        같은가(정본답(n, e, r, v, o), 변이답(impl, n, e, r, v, o)),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/** 변이 하나를 작업 목록 여럿에 걸어 정본과 나란히 놓는다. */
function mutantTable(
  impl: Impl,
  name: string,
  cases: [string, number, Edge[], number, number[], Op[]][],
): string {
  const rows = cases.map(([label, n, e, r, v, o]) => {
    const a = list(정본답(n, e, r, v, o));
    const b = list(변이답(impl, n, e, r, v, o));
    return [label, a, b, a === b ? "같다" : "다르다"];
  });
  return md(["작업 목록", "정본", name, "두 답"], rows);
}

/* ────────────────────────── 전개 걸음 ────────────────────────── */

/** 전개 입력을 기록과 함께 한 번 실행한 것. */
export const RUN = counted(
  WALK_N,
  WALK_EDGES,
  WALK_ROOT,
  WALK_VALUES,
  WALK_OPS,
  true,
);

/** 자리 `p` 에 앉은 정점. */
export const AT: number[] = (() => {
  const at: number[] = Array.from({ length: WALK_N }, () => 0);
  for (let v = 0; v < WALK_N; v++) at[RUN.tin[v] as number] = v;
  return at;
})();

/** 기저 배열 — 자리 차례로 옮긴 정점 값. */
export const BASE: number[] = AT.map((v) => WALK_VALUES[v] as number);

/** 정점마다의 부분트리(전개 입력). */
export const SUBS: number[][] = allSubtrees(WALK_N, WALK_EDGES, WALK_ROOT);

/** 전개의 걸음 하나. 원고의 `T#` 표 · 걸음 재생 패널 · 그림이 이 기록을 함께 쓴다. */
export interface WalkStep {
  kind: "prep" | "enter" | "exit" | "build" | "query" | "update";
  /** 들어가거나 나온 정점, 또는 작업의 정점. */
  v: number;
  /** 들어간 정점의 부모. 뿌리면 `null`. */
  from: number | null;
  /** 이 걸음 직전에 이미 자리를 받아 건너뛴 이웃 `[정점, 이웃]`. */
  skipped: [number, number][];
  tin: number[];
  tout: number[];
  stack: number[];
  timer: number;
  /** 펜윅 트리의 칸. 아직 안 세웠으면 `null`. */
  tree: number[] | null;
  values: number[];
  answers: number[];
  /** 작업 걸음이면 작업 번호와 기록. */
  op?: number;
  log?: OpStep;
}

function walkSteps(): WalkStep[] {
  const out: WalkStep[] = [];
  const blank = Array.from({ length: WALK_N }, () => -1);
  out.push({
    kind: "prep",
    v: WALK_ROOT,
    from: null,
    skipped: [],
    tin: blank,
    tout: blank,
    stack: [],
    timer: 0,
    tree: null,
    values: WALK_VALUES.slice(),
    answers: [],
  });
  let skipped: [number, number][] = [];
  for (const e of RUN.walk) {
    if (e.kind === "건너뜀") {
      skipped.push([e.v, e.w as number]);
      continue;
    }
    const enter = e.kind === "자리";
    out.push({
      kind: enter ? "enter" : "exit",
      v: enter ? (e.w ?? e.v) : e.v,
      from: enter && e.w !== null ? e.v : null,
      skipped,
      tin: e.tin,
      tout: e.tout,
      stack: e.stack,
      timer: e.timer,
      tree: null,
      values: WALK_VALUES.slice(),
      answers: [],
    });
    skipped = [];
  }
  if (skipped.length > 0) throw new Error("뒤에 사건이 없는 건너뜀이 남았다");
  const last = out.at(-1) as WalkStep;
  out.push({
    ...last,
    kind: "build",
    v: WALK_ROOT,
    from: null,
    skipped: [],
    tree: RUN.builds.at(-1)?.tree ?? [],
  });
  const answers: number[] = [];
  RUN.logs.forEach((log, i) => {
    if (log.answer !== null) answers.push(log.answer);
    out.push({
      ...last,
      kind: log.kind,
      v: log.node,
      from: null,
      skipped: [],
      tree: log.tree,
      values: log.values,
      answers: answers.slice(),
      op: i,
      log,
    });
  });
  return out;
}

export const WALK: WalkStep[] = walkSteps();

export const stepOf = (i: number): string => `T${i + 1}`;

/** 작업 한 줄의 호출 모양. */
export const opText = (op: Op): string =>
  op.kind === "query"
    ? `querySubtree(${op.node})`
    : `update(${op.node}, ${op.value})`;

/** 걸음이 실행한 원문자 분기. 정본 주석의 번호와 같다. */
export function stepMarks(i: number): string[] {
  const s = WALK[i] as WalkStep;
  if (s.kind === "prep") return ["①", "②"];
  if (s.kind === "enter") return s.from === null ? ["③"] : ["④"];
  if (s.kind === "exit") return s.skipped.length > 0 ? ["④", "⑤"] : ["⑤"];
  if (s.kind === "build") return ["⑥"];
  if (s.kind === "update") return ["⑦", "⑧"];
  return ["⑨"];
}

/** 걸음이 하는 일 — 패널 제목과 원고 표가 같은 말을 쓴다. */
export function stepDoing(i: number): string {
  const s = WALK[i] as WalkStep;
  if (s.kind === "prep") return "이웃 목록을 만들고 정점마다의 칸을 준비한다";
  if (s.kind === "enter") {
    const p = s.tin[s.v] as number;
    return `${s.from === null ? "뿌리" : "정점"} ${s.v} 에 들어가 자리 ${p}${을를(p)} 준다`;
  }
  if (s.kind === "exit") {
    const q = s.tout[s.v] as number;
    return `정점 ${s.v} 에서 나오며 끝 자리 ${q}${을를(q)} 적는다`;
  }
  if (s.kind === "build")
    return "기저 배열 자리에 값을 담아 펜윅 트리를 세운다";
  const op = WALK_OPS[s.op as number] as Op;
  if (s.kind === "update") return `${opText(op)} — 차이를 칸에 더한다`;
  const log = s.log as OpStep;
  return `${opText(op)} — 구간 ${span(log.span[0], log.span[1])} 의 합을 낸다`;
}

/** 걸음의 조건 판정 — 원고 표와 패널이 같은 말을 쓴다. */
export function stepCheck(i: number): string {
  const s = WALK[i] as WalkStep;
  if (s.kind === "prep") return `간선 ${WALK_EDGES.length} 개를 양쪽에 넣음`;
  const skip =
    s.skipped.length > 0
      ? `${s.skipped
          .map(([v, w]) => `near[${v}] 의 ${w}${은는(w)} 이미 자리를 받음`)
          .join(" · ")} · `
      : "";
  if (s.kind === "enter") {
    if (s.from === null) return "뿌리";
    return `${skip}near[${s.from}] 의 ${s.v}${은는(s.v)} 아직 자리가 없음`;
  }
  if (s.kind === "exit") {
    return `${skip}cursor[${s.v}] = near[${s.v}] 의 길이`;
  }
  if (s.kind === "build") {
    const moved = RUN.builds.filter((b) => b.inRange).length;
    return `다음 칸이 범위 안인 칸 ${moved} 개`;
  }
  const log = s.log as OpStep;
  if (s.kind === "update") {
    return `delta = ${log.value} − ${log.before} = ${log.delta} · 칸 ${log.hiPath.join(" · ")}`;
  }
  return `prefix(${log.span[1]}) − prefix(${log.span[0] - 1}) = ${log.hiSum} − ${log.loSum}`;
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

/** `concept` — 연산 넷이 무엇을 돌려주는가. */
function conceptOps(): string {
  const answers = 정본답(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, WALK_OPS);
  const cur = WALK_VALUES.slice();
  const rows: string[][] = [];
  let k = 0;
  for (const op of WALK_OPS) {
    if (op.kind === "update") {
      rows.push([
        opText(op),
        `정점 ${op.node}`,
        `${cur[op.node]} → ${op.value}`,
        "없음",
      ]);
      cur[op.node] = op.value;
      continue;
    }
    const sub = [...(SUBS[op.node] as number[])].sort((a, b) => a - b);
    rows.push([
      opText(op),
      dots(sub),
      sub.map((x) => cur[x] as number).join(" + "),
      String(answers[k++]),
    ]);
  }
  const up = WALK_OPS[1] as Extract<Op, { kind: "update" }>;
  const a0 = answers[0] as number;
  const a1 = answers[1] as number;
  return [
    md(["연산", "부분트리의 정점", "더하는 값", "돌려주는 값"], rows, [3]),
    "",
    `갱신한 정점 ${up.node}${이가(up.node)} 정점 1 의 부분트리 안에 있어서, 셋째 줄의 답이 ${a0} 에서 ${a1}${으로(a1)} 바뀝니다.`,
  ].join("\n");
}

/** `concept` — 정점마다 부분트리가 기저 배열의 한 구간이다. */
function conceptIntervals(): string {
  let ok = 0;
  const rows = Array.from({ length: WALK_N }, (_, v) => {
    const sub = [...(SUBS[v] as number[])].sort((a, b) => a - b);
    const a = RUN.tin[v] as number;
    const b = RUN.tout[v] as number;
    const cut = BASE.slice(a, b + 1);
    const sum = cut.reduce((s, x) => s + x, 0);
    const want = sub.reduce((s, x) => s + (WALK_VALUES[x] as number), 0);
    if (isContiguous(RUN.tin, sub) && sum === want) ok++;
    return [`정점 ${v}`, dots(sub), span(a, b), cut.join(" "), String(sum)];
  });
  return [
    md(["정점", "부분트리", "구간", "그 구간의 기저 배열", "합"], rows, [4]),
    "",
    `정점 ${WALK_N} 개 가운데 부분트리가 구간 하나를 빈틈없이 차지하고 그 구간의 합이 부분트리 값의 합과 같은 정점이 ${ok} 개입니다.`,
  ].join("\n");
}

const N_LIMIT = 100_000;
const Q_LIMIT = 100_000;

/** `deep.origin` ② — 질의마다 부분트리를 다시 순회하는 방법의 비용. */
function originNaive(): string {
  const rows: string[][] = [];
  let top = { per: 0, all: 0 };
  for (const n of [1_000, 10_000, N_LIMIT]) {
    const per = byWalking(n, chain(n), 0, vals(n), [
      { kind: "query", node: 0 },
    ]).ops;
    const all = per * n;
    top = { per, all };
    rows.push([
      comma(n),
      comma(per),
      comma(all),
      `${(all / 1e8).toFixed(1)} 초`,
    ]);
  }
  return [
    md(
      [
        "사슬 정점 N",
        "질의 하나의 배열 칸",
        "질의 N 개의 배열 칸",
        "그 시간(초당 1 억 칸)",
      ],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `질의는 모두 뿌리의 부분트리를 묻는 querySubtree(0) 이라 질의 하나를 실제로 세어 N 을 곱했습니다. 규모 상한 줄에서 질의 하나가 ${comma(top.per)} 칸이고 질의 ${comma(Q_LIMIT)} 개가 ${comma(top.all)} 칸입니다.`,
  ].join("\n");
}

/** `deep.origin` ③ — 같은 부분트리를 되풀이해 물으면 같은 정점을 몇 번씩 지나가는가. */
function originRepeat(): string {
  const asks = [0, 1, 0, 1, 2];
  let total = 0;
  const rows = asks.map((v, i) => {
    const sub = [...(SUBS[v] as number[])].sort((a, b) => a - b);
    total += sub.length;
    return [
      `${i + 1}`,
      `querySubtree(${v})`,
      dots(sub),
      String(sub.length),
      String(total),
    ];
  });
  const hits = Array.from(
    { length: WALK_N },
    (_, x) => asks.filter((v) => (SUBS[v] as number[]).includes(x)).length,
  );
  return [
    md(
      ["질의 차례", "물은 것", "지나간 정점", "정점 수", "누적"],
      rows,
      [0, 3, 4],
    ),
    "",
    "정점마다 몇 번 지나갔는지 세면 이렇습니다.",
    "",
    md(
      ["정점", ...Array.from({ length: WALK_N }, (_, x) => String(x))],
      [["지나간 횟수", ...hits.map(String)]],
      Array.from({ length: WALK_N }, (_, x) => x + 1),
    ),
    "",
    `정점 ${WALK_N} 개짜리 트리에 질의 ${asks.length} 개를 실행해 정점을 ${total} 번 지나갔습니다. 가장 많이 지난 정점은 ${Math.max(...hits)} 번입니다.`,
  ].join("\n");
}

/** `deep.origin` ③ — 자리를 매기는 두 방식에서 부분트리가 이어진 자리를 받는가. */
function originNumbering(): string {
  const bfs = breadthPositions(WALK_N, WALK_EDGES, WALK_ROOT);
  const rows = Array.from({ length: WALK_N }, (_, v) => {
    const sub = [...(SUBS[v] as number[])].sort((a, b) => a - b);
    const a = sub.map((x) => bfs[x] as number).sort((p, q) => p - q);
    const b = sub.map((x) => RUN.tin[x] as number).sort((p, q) => p - q);
    return [
      `정점 ${v}`,
      dots(sub),
      dots(a),
      isContiguous(bfs, sub) ? "이어진다" : "끊긴다",
      dots(b),
      isContiguous(RUN.tin, sub) ? "이어진다" : "끊긴다",
    ];
  });
  const n = 1_023;
  const e = binary(n);
  const subs = allSubtrees(n, e, 0);
  const bfsBig = breadthPositions(n, e, 0);
  const dfsBig = counted(n, e, 0, vals(n), [], false).tin;
  const okB = subs.filter((s) => isContiguous(bfsBig, s)).length;
  const okD = subs.filter((s) => isContiguous(dfsBig, s)).length;
  return [
    md(
      [
        "정점",
        "부분트리",
        "너비 우선으로 매긴 자리",
        "너비 우선",
        "들어간 차례로 매긴 자리",
        "들어간 차례",
      ],
      rows,
    ),
    "",
    `완전 이진 트리 정점 ${comma(n)} 개에서도 세면, 부분트리가 이어진 자리를 받는 정점이 너비 우선에서 ${comma(okB)} 개, 들어간 차례에서 ${comma(okD)} 개입니다.`,
  ].join("\n");
}

/** 구간 길이의 평균 — 정점마다 `tout − tin + 1` 을 더해 정점 수로 나눈다. */
function meanSpan(n: number, e: Edge[]): number {
  const c = counted(n, e, 0, vals(n), [], false);
  let s = 0;
  for (let x = 0; x < n; x++) {
    s += (c.tout[x] as number) - (c.tin[x] as number) + 1;
  }
  return s / n;
}

export const SHAPE_N = 4_096;
export const SHAPE_ROUNDS = 1_024;

/** `deep.origin` ④ — 구간을 매번 다 더하는 비용이 무엇에 달렸는가. */
function originLineSum(): string {
  const shapes: [string, Edge[]][] = [
    ["사슬", chain(SHAPE_N)],
    ["완전 이진 트리", binary(SHAPE_N)],
    ["별", star(SHAPE_N)],
  ];
  const v = vals(SHAPE_N);
  const o = mixedOps(SHAPE_N, SHAPE_ROUNDS);
  const rows = shapes.map(([label, e]) => [
    label,
    meanSpan(SHAPE_N, e).toLocaleString("en-US", {
      maximumFractionDigits: 1,
    }),
    comma(byLineSum(SHAPE_N, e, 0, v, o).ops),
  ]);
  return [
    md(
      ["트리 모양", "구간 길이의 평균", "구간을 매번 다 더하기의 배열 칸"],
      rows,
      [1, 2],
    ),
    "",
    `정점 ${comma(SHAPE_N)} 개이고, 갱신 하나와 질의 하나를 한 바퀴로 ${comma(SHAPE_ROUNDS)} 바퀴 섞은 작업 목록입니다. 세 모양이 자리 매김 규칙 · 값 · 작업 목록을 함께 씁니다.`,
  ].join("\n");
}

/** 구간 합을 답하는 후보 셋 — 기저 배열 위에서 같은 작업 목록을 받는다. */
export const CANDIDATES: [string, typeof byLineSum][] = [
  ["구간을 매번 다 더하기", byLineSum],
  ["앞에서부터의 합 배열", byPrefixArray],
  ["펜윅 트리", byEulerFenwick],
];

/** 후보 하나를 사슬 기저 배열의 세 작업 목록에 건 배열 칸. */
export function candidateCells(run: typeof byLineSum): {
  updates: number;
  queries: number;
  mixed: number;
} {
  const e = chain(SHAPE_N);
  const v = vals(SHAPE_N);
  return {
    updates: run(SHAPE_N, e, 0, v, updatesOnly(SHAPE_N, SHAPE_ROUNDS)).ops,
    queries: run(SHAPE_N, e, 0, v, queriesOnly(SHAPE_N, SHAPE_ROUNDS)).ops,
    mixed: run(SHAPE_N, e, 0, v, mixedOps(SHAPE_N, SHAPE_ROUNDS)).ops,
  };
}

/** `deep.origin` ⑤ — 구간 합을 답하는 후보 셋을 갱신만 · 질의만 · 섞어서에 건다. */
function originPrefix(): string {
  const rows = CANDIDATES.map(([label, run]) => {
    const c = candidateCells(run);
    return [label, comma(c.updates), comma(c.queries), comma(c.mixed)];
  });
  return [
    md(
      [
        "구간 합을 답하는 방법",
        `갱신만 ${comma(SHAPE_ROUNDS)} 번`,
        `질의만 ${comma(SHAPE_ROUNDS)} 번`,
        "둘을 섞어서",
      ],
      rows,
      [1, 2, 3],
    ),
    "",
    `사슬 정점 ${comma(SHAPE_N)} 개의 기저 배열에서 잰 배열 칸입니다. 갱신만 · 질의만 목록은 섞은 목록에서 갱신 줄과 질의 줄을 따로 뽑은 것입니다.`,
  ].join("\n");
}

/** `deep.build` (c) — 정점 하나에서 구간과 값까지 읽는다. */
function eulerRead(): string {
  let ok = 0;
  const picks = [1, 2, 3, 0];
  const rows = picks.map((v) => {
    const a = RUN.tin[v] as number;
    const b = RUN.tout[v] as number;
    const seats = AT.slice(a, b + 1);
    const cut = BASE.slice(a, b + 1);
    const sum = cut.reduce((s, x) => s + x, 0);
    const sub = [...(SUBS[v] as number[])].sort((p, q) => p - q);
    const want = sub.reduce((s, x) => s + (WALK_VALUES[x] as number), 0);
    const same = [...seats].sort((p, q) => p - q).join() === sub.join();
    if (same && sum === want) ok++;
    return [
      `정점 ${v}`,
      `tin[${v}] = ${a} · tout[${v}] = ${b}`,
      span(a, b),
      dots(seats),
      cut.join(" + "),
      String(sum),
    ];
  });
  return [
    md(
      [
        "고른 정점",
        "두 번호",
        "구간",
        "그 자리의 정점",
        "기저 배열의 값",
        "합",
      ],
      rows,
      [5],
    ),
    "",
    `고른 정점 ${picks.length} 개 가운데 구간의 정점이 부분트리와 같고 합이 정의대로 더한 값과 같은 것이 ${ok} 개입니다.`,
  ].join("\n");
}

/** 정점마다 자식을 방문한 차례로 — 이웃 목록 차례에서 부모를 뺀 것이다. */
function childrenInOrder(n: number, e: Edge[], root: number): number[][] {
  const p = parents(n, e, root);
  return Array.from({ length: n }, (_, u) =>
    (p.near[u] as number[]).filter((w) => w !== root && p.parent[w] === u),
  );
}

/** `deep.build` (d) — 정점끼리의 관계 넷을 여러 트리에서 잰다. */
function eulerRelation(): string {
  const trees: [string, number, Edge[]][] = [
    ["전개 입력", WALK_N, WALK_EDGES],
    ["완전 이진 트리", 1_023, binary(1_023)],
    ["사슬", 1_000, chain(1_000)],
    ["별", 1_000, star(1_000)],
    ["무작위 트리", 1_000, randomTree(1_000, 20260930)],
  ];
  const tally: [number, number][] = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ];
  const hit = (k: number, good: boolean) => {
    const t = tally[k] as [number, number];
    t[0]++;
    if (!good) t[1]++;
  };
  for (const [, n, e] of trees) {
    const c = counted(n, e, 0, vals(n), [], false);
    const kids = childrenInOrder(n, e, 0);
    const subs = allSubtrees(n, e, 0);
    for (let u = 0; u < n; u++) {
      const ks = kids[u] as number[];
      for (const k of ks) {
        hit(
          0,
          (c.tin[u] as number) < (c.tin[k] as number) &&
            (c.tout[k] as number) <= (c.tout[u] as number),
        );
      }
      if (ks.length > 0) {
        hit(1, (c.tin[ks[0] as number] as number) === (c.tin[u] as number) + 1);
      }
      for (let j = 1; j < ks.length; j++) {
        hit(
          2,
          (c.tin[ks[j] as number] as number) ===
            (c.tout[ks[j - 1] as number] as number) + 1,
        );
      }
      hit(
        3,
        (c.tout[u] as number) - (c.tin[u] as number) + 1 ===
          (subs[u] as number[]).length,
      );
    }
  }
  const names: [string, string][] = [
    ["자식의 구간은 부모의 구간 안에 있다", "부모와 자식 쌍"],
    ["첫 자식의 tin 은 부모의 tin 보다 1 크다", "자식이 있는 정점"],
    ["다음 자식의 tin 은 앞 자식의 tout 보다 1 크다", "이웃한 두 자식"],
    ["tout − tin + 1 이 부분트리 크기다", "정점"],
  ];
  const rows = names.map(([a, b], k) => [
    a,
    b,
    comma((tally[k] as [number, number])[0]),
    comma((tally[k] as [number, number])[1]),
  ]);
  const bad = tally.reduce((s, t) => s + t[1], 0);
  return [
    md(["관계", "재는 자리", "확인한 수", "어긋난 수"], rows, [2, 3]),
    "",
    `${trees.map(([l, n]) => `${l} 정점 ${comma(n)} 개`).join(" · ")}에서 관계 ${names.length} 개를 쟀고, 어긋난 수를 모두 더하면 ${bad} 입니다.`,
  ].join("\n");
}

/** `deep.build` (e) — 끝 번호를 「나온 차례」로 적으면 구간이 부분트리가 아니다. */
function eulerExitOrder(): string {
  const exits = RUN.walk.filter((s) => s.kind === "구간 끝").map((s) => s.v);
  const seatsOf = (a: number, b: number): number[] =>
    a > b ? [] : AT.slice(a, b + 1);
  let okExit = 0;
  let okOut = 0;
  const rows = Array.from({ length: WALK_N }, (_, v) => {
    const a = RUN.tin[v] as number;
    const x = exits.indexOf(v);
    const b = RUN.tout[v] as number;
    const sub = [...(SUBS[v] as number[])].sort((p, q) => p - q);
    const byExit = seatsOf(a, x);
    const byOut = seatsOf(a, b);
    const sorted = (xs: number[]) => [...xs].sort((p, q) => p - q).join();
    if (sorted(byExit) === sub.join()) okExit++;
    if (sorted(byOut) === sub.join()) okOut++;
    return [
      `정점 ${v}`,
      String(a),
      String(x),
      String(b),
      byExit.length === 0 ? "없음" : dots(byExit),
      dots(byOut),
      dots(sub),
    ];
  });
  return [
    md(
      [
        "정점",
        "tin",
        "나온 차례",
        "tout",
        "[tin, 나온 차례] 의 정점",
        "[tin, tout] 의 정점",
        "부분트리",
      ],
      rows,
      [1, 2, 3],
    ),
    "",
    `나온 차례는 정점에서 나온 순서를 0 부터 센 것입니다. 부분트리와 같은 모음을 내는 정점이 [tin, 나온 차례] 에서 ${okExit} 개, [tin, tout] 에서 ${okOut} 개입니다.`,
  ].join("\n");
}

/** `deep.build` 1단계 — 들어감과 나옴을 차례로 적는다. */
function buildEvents(): string {
  let k = 0;
  let pending: number[] = [];
  let pendingFrom = -1;
  const rows: string[][] = [];
  let skippedAll = 0;
  let skippedParent = 0;
  const p = parents(WALK_N, WALK_EDGES, WALK_ROOT).parent;
  for (const e of RUN.walk) {
    if (e.kind === "건너뜀") {
      pending.push(e.w as number);
      pendingFrom = e.v;
      skippedAll++;
      if (p[e.v] === e.w) skippedParent++;
      continue;
    }
    k++;
    const enter = e.kind === "자리";
    const v = enter ? (e.w ?? e.v) : e.v;
    rows.push([
      String(k),
      enter ? "들어감" : "나옴",
      `정점 ${v}`,
      enter ? `tin[${v}] = ${e.tin[v]}` : `tout[${v}] = ${e.tout[v]}`,
      pending.length === 0
        ? "—"
        : `near[${pendingFrom}] 의 ${pending.join(" · ")}`,
      list(e.stack),
    ]);
    pending = [];
  }
  const enters = rows.filter((r) => r[1] === "들어감").length;
  return [
    md(
      ["차례", "한 일", "정점", "적은 값", "앞서 건너뛴 이웃", "그 뒤 스택"],
      rows,
      [0],
    ),
    "",
    `들어감이 ${enters} 번, 나옴이 ${rows.length - enters} 번입니다. 건너뛴 이웃 ${skippedAll} 개 가운데 그 정점의 부모인 것이 ${skippedParent} 개입니다. 끝난 뒤 tin 은 ${list(RUN.tin)}, tout 은 ${list(RUN.tout)} 입니다.`,
  ].join("\n");
}

/** `deep.build` 2단계 — 기저 배열. */
function buildBase(): string {
  const idx = Array.from({ length: WALK_N }, (_, p) => String(p));
  return [
    md(
      ["자리 p", ...idx],
      [
        ["그 자리의 정점", ...AT.map(String)],
        ["기저 배열", ...BASE.map(String)],
      ],
      idx.map((_, i) => i + 1),
    ),
    "",
    `기저 배열은 ${list(BASE)} 입니다.`,
  ].join("\n");
}

/** `deep.build` 3단계 — 펜윅 트리의 칸마다 맡는 자리와 값. */
function buildFenwick(): string {
  let ok = 0;
  const rows = Array.from({ length: WALK_N }, (_, i) => {
    const k = i + 1;
    const lo = k - (k & -k);
    const hi = k - 1;
    const cut = BASE.slice(lo, hi + 1);
    const sum = cut.reduce((s, x) => s + x, 0);
    if (sum === RUN.builds.at(-1)?.tree[k]) ok++;
    return [
      `칸 ${k}`,
      span(lo, hi),
      cut.join(" + "),
      String(RUN.builds.at(-1)?.tree[k]),
    ];
  });
  return [
    md(["칸 k", "맡는 자리", "그 자리의 값", "칸의 값"], rows, [3]),
    "",
    `칸 ${WALK_N} 개 가운데 맡는 자리의 값을 더한 것과 칸의 값이 같은 것이 ${ok} 개입니다.`,
  ].join("\n");
}

/** `deep.build` 4단계 — 질의를 앞에서부터의 합 둘의 차로 답한다. */
function buildQuery(): string {
  const picks = [0, 1, 2, 3, 5];
  const ops: Op[] = picks.map((node) => ({ kind: "query" as const, node }));
  const c = counted(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, ops, true);
  const answers = 정본답(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, ops);
  let ok = 0;
  const cells = (xs: number[]) =>
    xs.length === 0 ? "읽은 칸 없음" : xs.map((x) => `칸 ${x}`).join(" · ");
  const rows = c.logs.map((log, i) => {
    const want = (SUBS[log.node] as number[]).reduce(
      (s, x) => s + (WALK_VALUES[x] as number),
      0,
    );
    if (answers[i] === want) ok++;
    return [
      `querySubtree(${log.node})`,
      span(log.span[0], log.span[1]),
      `prefix(${log.span[1]}) = ${log.hiSum} · ${cells(log.hiPath)}`,
      `prefix(${log.span[0] - 1}) = ${log.loSum} · ${cells(log.loPath)}`,
      String(answers[i]),
      String(want),
    ];
  });
  return [
    md(
      [
        "질의",
        "구간",
        "끝까지의 합",
        "시작 앞까지의 합",
        "정본의 답",
        "정의대로 더한 값",
      ],
      rows,
      [4, 5],
    ),
    "",
    `질의 ${picks.length} 개 가운데 정본의 답이 정의대로 더한 값과 같은 것이 ${ok} 개입니다.`,
  ].join("\n");
}

/** `deep.build` 5단계 — 값 하나를 바꾸면 무엇이 바뀌는가. */
function buildUpdate(): string {
  const log = RUN.logs[1] as OpStep;
  const before = RUN.logs[0] as OpStep;
  const p = log.span[0];
  const after = RUN.logs[2] as OpStep;
  return [
    md(
      ["고치는 자리", "갱신 전", "갱신 뒤"],
      [
        [`value[${log.node}]`, String(log.before), String(log.value)],
        [
          `기저 배열의 자리 tin[${log.node}] = ${p}`,
          String(log.before),
          String(log.value),
        ],
        ...log.hiPath.map((k) => [
          `펜윅 트리 칸 ${k}`,
          String(before.tree[k]),
          String(log.tree[k]),
        ]),
        ["tin · tout", "—", "그대로"],
      ],
    ),
    "",
    `늘어난 값 ${log.delta}${을를(log.delta)} 펜윅 트리 칸 ${log.hiPath.length} 개에 더했습니다. 그 뒤 querySubtree(${after.node}) 는 ${after.answer} 입니다.`,
  ].join("\n");
}

/** `deep.build` 전제 — 전제가 깨지거나 뿌리만 바꾼 입력. */
function premise(): string {
  const split: Edge[] = [
    [0, 1],
    [2, 3],
  ];
  const splitAns = 정본답(
    4,
    split,
    0,
    [1, 2, 3, 4],
    [{ kind: "query", node: 2 }],
  );
  const defOf = (root: number, v: number): number =>
    subtreeOf(WALK_N, WALK_EDGES, root, v).reduce(
      (s, x) => s + (WALK_VALUES[x] as number),
      0,
    );
  const walkAt = (root: number, v: number) =>
    정본답(WALK_N, WALK_EDGES, root, WALK_VALUES, [{ kind: "query", node: v }]);
  return md(
    ["입력", "뿌리", "질의", "정본의 답", "정의대로 더한 값"],
    [
      [
        "간선 [0,1] · [2,3] — 둘로 떨어진 그래프, 값 1 2 3 4",
        "0",
        "querySubtree(2)",
        String(splitAns[0]),
        "없음 — 뿌리 0 에서 이어지지 않는다",
      ],
      [
        "전개 입력",
        "0",
        "querySubtree(1)",
        String(walkAt(0, 1)[0]),
        String(defOf(0, 1)),
      ],
      [
        "전개 입력",
        "3",
        "querySubtree(1)",
        String(walkAt(3, 1)[0]),
        String(defOf(3, 1)),
      ],
    ],
    [1, 3],
  );
}

/** `deep.build` 설계 선택 — 재귀로 적은 판과 배열 스택으로 적은 정본. */
function designRecursion(): string {
  const rows = [100, 1_000, 10_000, N_LIMIT].map((n) => {
    let rec: string;
    try {
      const r = recursivePositions(n, chain(n), 0);
      rec = `끝남 · tout[0] = ${comma(r.tout[0] as number)}`;
    } catch (error) {
      rec = `${(error as Error).name} — 호출 스택이 먼저 끝난다`;
    }
    const sst = new SubtreeSumQuery(
      n,
      chain(n),
      0,
      Array.from({ length: n }, () => 1),
    );
    return [
      comma(n),
      rec,
      `끝남 · querySubtree(0) = ${comma(sst.querySubtree(0))}`,
    ];
  });
  return md(
    ["사슬 정점 수", "재귀로 적은 판", "배열 스택으로 적은 정본"],
    rows,
    [0],
  );
}

/** `deep.walk` 도입 — 고정 입력. */
function walkInput(): string {
  const answers = 정본답(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, WALK_OPS);
  return [
    `const n = ${WALK_N};`,
    `const edges: [number, number][] = [${WALK_EDGES.map(([a, b]) => `[${a}, ${b}]`).join(", ")}];`,
    `const root = ${WALK_ROOT};`,
    `const values = ${list(WALK_VALUES)};`,
    `// ${WALK_OPS.map(opText).join(" · ")}`,
    `// 이 절이 끝나면 세 질의의 답이 ${list(answers)} 이어야 한다`,
  ].join("\n");
}

/** T1 — 이웃 목록과 칸. */
function walkT1(): string {
  const near: number[][] = Array.from({ length: WALK_N }, () => []);
  for (const [u, v] of WALK_EDGES) {
    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
  }
  const rows: string[][] = near.map((l, v) => [
    v === 0 ? "T1" : "",
    `near[${v}] = ${list(l)}`,
  ]);
  rows.push([
    "",
    `목록 길이의 합 ${near.reduce((s, l) => s + l.length, 0)} = 간선 ${WALK_EDGES.length} 개 × 2`,
  ]);
  rows.push(["", `value = ${list(WALK_VALUES)}`]);
  return columnsText(rows);
}

/** T2~T13 — 들어감과 나옴. */
function walkDfs(): string {
  const rows: string[][] = [];
  WALK.forEach((s, i) => {
    if (s.kind !== "enter" && s.kind !== "exit") return;
    const first = s.skipped[0];
    const skip =
      first === undefined
        ? ""
        : `near[${first[0]}] 의 ${s.skipped.map(([, w]) => w).join(" · ")} 건너뜀`;
    rows.push([
      stepOf(i),
      skip,
      s.kind === "enter" ? `들어감 ${s.v}` : `나옴 ${s.v}`,
      s.kind === "enter"
        ? `tin[${s.v}] = ${s.tin[s.v]}`
        : `tout[${s.v}] = ${s.tout[s.v]}`,
      `timer ${s.timer}`,
      `스택 ${list(s.stack)}`,
    ]);
  });
  return columnsText(rows);
}

/** T14 — 펜윅 트리 세우기. */
function walkBuild(): string {
  const i = WALK.findIndex((s) => s.kind === "build");
  const rows: string[][] = [
    [stepOf(i), "칸에 값만 적은 tree", list(RUN.seeded)],
  ];
  for (const b of RUN.builds) {
    rows.push([
      "",
      b.inRange
        ? `칸 ${b.from}${을를(b.from)} 칸 ${b.to} 에 더함`
        : `칸 ${b.from} 의 다음 칸 ${b.to}${은는(b.to)} 범위 밖`,
      list(b.tree),
    ]);
  }
  return columnsText(rows);
}

/** T15 — 질의 하나. */
function walkQuery(): string {
  const i = WALK.findIndex((s) => s.kind === "query");
  const log = (WALK[i] as WalkStep).log as OpStep;
  const cells = (xs: number[]) =>
    xs.length === 0 ? "읽은 칸 없음" : xs.map((x) => `tree[${x}]`).join(" + ");
  return columnsText([
    [
      stepOf(i),
      `querySubtree(${log.node})`,
      `구간 ${span(log.span[0], log.span[1])}`,
    ],
    ["", `prefix(${log.span[1]}) = ${cells(log.hiPath)}`, `= ${log.hiSum}`],
    ["", `prefix(${log.span[0] - 1}) = ${cells(log.loPath)}`, `= ${log.loSum}`],
    ["", "답", `${log.hiSum} − ${log.loSum} = ${log.answer}`],
  ]);
}

/** T16~T18 — 갱신과 그 뒤의 질의 둘. */
function walkUpdate(): string {
  const rows: string[][] = [];
  WALK.forEach((s, i) => {
    if (s.kind !== "update" && s.kind !== "query") return;
    if (s.op === 0) return;
    const log = s.log as OpStep;
    if (log.kind === "update") {
      rows.push([
        stepOf(i),
        `update(${log.node}, ${log.value})`,
        `delta = ${log.value} − ${log.before} = ${log.delta}`,
        `고친 칸 ${log.hiPath.map((k) => `tree[${k}]`).join(" · ")}`,
        `tree ${list(log.tree)}`,
      ]);
      return;
    }
    rows.push([
      stepOf(i),
      `querySubtree(${log.node})`,
      `구간 ${span(log.span[0], log.span[1])}`,
      `${log.hiSum} − ${log.loSum} = ${log.answer}`,
      `답 목록 ${list(s.answers)}`,
    ]);
  });
  return columnsText(rows);
}

/** 전개 전체 — 걸음마다 조건 판정과 갈래. */
function walkTrace(): string {
  const rows = WALK.map((s, i) => [
    stepOf(i),
    stepDoing(i),
    stepCheck(i),
    stepMarks(i).join(" "),
    list(s.answers),
  ]);
  const seen = new Map<string, string[]>();
  WALK.forEach((_, i) => {
    for (const m of stepMarks(i)) {
      seen.set(m, [...(seen.get(m) ?? []), stepOf(i)]);
    }
  });
  const marks = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];
  const where = marks
    .map((m) => {
      const at = seen.get(m) ?? [];
      return `${m}${은는갈래(m)} ${at.length === 0 ? "실행 안 됨" : at.join(" · ")}`;
    })
    .join(", ");
  return [
    md(["걸음", "하는 일", "조건 판정", "갈래", "답 목록"], rows),
    "",
    `${where} 에서 실행됐습니다. 걸음은 모두 ${WALK.length} 개이고 세 질의의 답은 ${list(RUN.answers)} 입니다.`,
  ].join("\n");
}

/** 갈래마다 실행 횟수 — 정본의 분기를 사본에서 센다. */
function branchCover(): string {
  const skips = RUN.walk.filter((e) => e.kind === "건너뜀").length;
  const enters = RUN.walk.filter(
    (e) => e.kind === "자리" && e.w !== null,
  ).length;
  const exits = RUN.walk.filter((e) => e.kind === "구간 끝").length;
  const moved = RUN.builds.filter((b) => b.inRange).length;
  const updates = RUN.logs.filter((l) => l.kind === "update");
  const queries = RUN.logs.filter((l) => l.kind === "query");
  return md(
    ["갈래", "하는 일", "실행 횟수"],
    [
      ["①", "간선을 양쪽 이웃 목록에 넣는다", String(WALK_EDGES.length)],
      ["②", "정점마다의 칸을 잡는다", "1"],
      ["③", "뿌리에 첫 자리를 준다", "1"],
      ["④ 새 이웃", "아직 자리가 없는 이웃에 다음 자리를 준다", String(enters)],
      ["④ 본 이웃", "이미 자리를 받은 이웃을 건너뛴다", String(skips)],
      ["⑤", "이웃을 다 본 정점의 끝 자리를 적는다", String(exits)],
      ["⑥", "칸을 다음 칸에 더한다", String(moved)],
      ["⑦", "지금 값과의 차이를 낸다", String(updates.length)],
      [
        "⑧",
        "차이를 칸에 더한다",
        String(updates.reduce((s, l) => s + l.hiPath.length, 0)),
      ],
      ["⑨", "앞에서부터의 합 둘을 뺀다", String(queries.length)],
    ],
    [2],
  );
}

/** `related` — 두 정점의 구간이 포개지거나 떨어져 있는가. */
function relatedNesting(): string {
  const trees: [string, number, Edge[]][] = [
    ["전개 입력", WALK_N, WALK_EDGES],
    ["완전 이진 트리", 1_023, binary(1_023)],
    ["무작위 트리", 1_000, randomTree(1_000, 20260930)],
  ];
  const rows = trees.map(([label, n, e]) => {
    const c = counted(n, e, 0, vals(n), [], false);
    let nest = 0;
    let apart = 0;
    let cross = 0;
    for (let u = 0; u < n; u++) {
      const a = c.tin[u] as number;
      const b = c.tout[u] as number;
      for (let v = u + 1; v < n; v++) {
        const x = c.tin[v] as number;
        const y = c.tout[v] as number;
        if (b < x || y < a) apart++;
        else if ((a <= x && y <= b) || (x <= a && b <= y)) nest++;
        else cross++;
      }
    }
    return [label, comma(n), comma(nest), comma(apart), comma(cross)];
  });
  return md(
    ["입력", "정점 수", "포개진 짝", "떨어진 짝", "절반만 걸친 짝"],
    rows,
    [1, 2, 3, 4],
  );
}

/** `deep.math` 검산 — 정의 그대로의 부분트리와 구간 조건. */
function mathCheck(): string {
  const rows = Array.from({ length: WALK_N }, (_, v) => {
    const sub = [...(SUBS[v] as number[])].sort((a, b) => a - b);
    const inSpan = Array.from({ length: WALK_N }, (_, x) => x).filter(
      (x) =>
        (RUN.tin[x] as number) >= (RUN.tin[v] as number) &&
        (RUN.tin[x] as number) <= (RUN.tout[v] as number),
    );
    return [
      `정점 ${v}`,
      dots(sub),
      dots(inSpan),
      sub.join() === inSpan.join() ? "같다" : "다르다",
      String((RUN.tout[v] as number) - (RUN.tin[v] as number) + 1),
      String(sub.length),
    ];
  });
  return md(
    [
      "정점 v",
      "정의 그대로의 sub(v)",
      "구간 조건을 만족하는 x",
      "두 모음",
      "구간 길이",
      "부분트리 크기",
    ],
    rows,
    [4, 5],
  );
}

/** 자리 `p` 에서 시작한 갱신이 고치는 칸 수. */
export const addSteps = (n: number, p: number): number => {
  let k = 0;
  for (let i = p + 1; i <= n; i += i & -i) k++;
  return k;
};

/** 자리 `p` 까지의 앞에서부터의 합이 읽는 칸 수. `p = -1` 이면 0 이다. */
export const askSteps = (p: number): number => {
  let k = 0;
  for (let i = p + 1; i > 0; i -= i & -i) k++;
  return k;
};

/**
 * 길이 `n` 인 기저 배열의 모든 구간 `[a,b]` 가운데 질의가 읽는 칸이 가장 많은 것.
 * `b` 를 왼쪽부터 늘려 가며 `a − 1 ≤ b − 1` 쪽 걸음의 최댓값을 함께 든다.
 */
export function worstInterval(n: number): {
  a: number;
  b: number;
  steps: number;
} {
  let best = { a: 0, b: 0, steps: -1 };
  let lowBest = { q: -1, steps: 0 };
  for (let b = 0; b < n; b++) {
    const s = askSteps(b) + lowBest.steps;
    if (s > best.steps) best = { a: lowBest.q + 1, b, steps: s };
    const next = askSteps(b);
    if (next > lowBest.steps) lowBest = { q: b, steps: next };
  }
  return best;
}

/** `deep.math` 계수 — 걸음 수의 닫힌 형태를 규모에 넣는다. */
function mathScale(): string {
  const rows = [8, 64, 512, 4_096, N_LIMIT].map((n) => {
    let addWorst = 0;
    for (let p = 0; p < n; p++) addWorst = Math.max(addWorst, addSteps(n, p));
    const ask = worstInterval(n).steps;
    const bound = Math.floor(Math.log2(n)) + 1;
    return [
      comma(n),
      String(bound),
      String(addWorst),
      String(3 + 2 * addWorst),
      String(ask),
      String(2 + ask),
      String(2 + 2 * bound),
    ];
  });
  const bound = Math.floor(Math.log2(N_LIMIT)) + 1;
  return [
    md(
      [
        "정점 N",
        "C(N)",
        "갱신의 최대 걸음",
        "갱신 한 번의 최대 칸",
        "질의의 최대 걸음",
        "질의 한 번의 최대 칸",
        "질의 상한 2 + 2C(N)",
      ],
      rows,
      [0, 1, 2, 3, 4, 5, 6],
    ),
    "",
    `갱신은 자리 전부를, 질의는 구간 [a,b] 전부를 넣어 걸음 수의 최댓값을 셌습니다. 규모 N = ${comma(N_LIMIT)} 에서 작업 ${comma(Q_LIMIT)} 번의 상한은 ${comma(Q_LIMIT * (3 + 2 * bound))} 칸이고, 질의마다 부분트리를 다시 순회하는 방법의 사슬 최악은 ${comma(Q_LIMIT * (4 * N_LIMIT - 2))} 칸입니다.`,
  ].join("\n");
}

/** `invariant` ② — 각 연산이 불변식을 지키는 것을 상태값으로 본다. */
function invariantHold(): string {
  const first = WALK.findIndex((s) => s.kind === "query");
  const rows = RUN.logs.map((log, i) => {
    const sub = [...(SUBS[log.node] as number[])].sort((a, b) => a - b);
    const bySum = sub.reduce((s, x) => s + (log.values[x] as number), 0);
    return [
      stepOf(first + i),
      log.kind === "update" ? "갱신" : "질의",
      `정점 ${log.node}`,
      dots(sub),
      `${list(RUN.tin)} · ${list(RUN.tout)}`,
      log.kind === "update" ? "—" : String(bySum),
      log.answer === null ? "—" : String(log.answer),
    ];
  });
  return md(
    [
      "걸음",
      "연산",
      "정점",
      "부분트리",
      "그 뒤 tin · tout",
      "정의대로 더한 값",
      "정본의 답",
    ],
    rows,
    [5, 6],
  );
}

/** `invariant` ② — 경계에 가까운 입력들. */
function invariantEdge(): string {
  const cases: [string, number, Edge[], number, number[], Op[]][] = [
    ["정점 하나", ONE_N, ONE_EDGES, 0, [42], [{ kind: "query", node: 0 }]],
    [
      "정점 하나 · 갱신 뒤",
      ONE_N,
      ONE_EDGES,
      0,
      [0],
      [
        { kind: "update", node: 0, value: 100 },
        { kind: "query", node: 0 },
      ],
    ],
    [
      "정점 둘",
      TWO_N,
      TWO_EDGES,
      0,
      [1, 2],
      [
        { kind: "query", node: 0 },
        { kind: "query", node: 1 },
      ],
    ],
    [
      "값이 전부 음수",
      3,
      [
        [0, 1],
        [0, 2],
      ],
      0,
      [-1, -2, -3],
      [{ kind: "query", node: 0 }],
    ],
    [
      "값이 전부 0",
      4,
      binary(4),
      0,
      [0, 0, 0, 0],
      [{ kind: "query", node: 0 }],
    ],
    [
      "뿌리가 잎",
      WALK_N,
      WALK_EDGES,
      3,
      WALK_VALUES,
      [
        { kind: "query", node: 3 },
        { kind: "query", node: 1 },
      ],
    ],
    [
      "잎을 물었을 때",
      WALK_N,
      WALK_EDGES,
      WALK_ROOT,
      WALK_VALUES,
      [{ kind: "query", node: 5 }],
    ],
  ];
  const rows = cases.map(([label, n, e, r, v, o]) => {
    const got = 정본답(n, e, r, v, o);
    const c = counted(n, e, r, v, [], false);
    const want = byWalking(n, e, r, v, o).answers;
    return [
      label,
      String(n),
      String(r),
      list(c.tin),
      list(c.tout),
      list(got),
      list(want),
    ];
  });
  return md(
    ["입력", "정점 수", "뿌리", "tin", "tout", "정본의 답", "정의대로 더한 값"],
    rows,
    [1, 2],
  );
}

/** 잎만 묻는 작업 목록. */
const LEAF_OPS: Op[] = [
  { kind: "query", node: 3 },
  { kind: "query", node: 5 },
];

/** `invariant` ③ — 불변식을 지키던 줄을 바꿔 본다. */
function mutantSelfOnly(): string {
  return mutantTable(selfOnly, "끝 자리를 자기 자리로 둔 판", [
    ["전개 작업 목록", WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, WALK_OPS],
    ["잎만 묻는다", WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, LEAF_OPS],
    [
      "사슬 다섯의 뿌리",
      5,
      chain(5),
      0,
      [1, 2, 3, 4, 5],
      [{ kind: "query", node: 0 }],
    ],
  ]);
}

/** `invariant` ③ — 구간의 시작을 한 칸 늦게 끊어 본다. */
function mutantDropSelf(): string {
  return mutantTable(dropSelf, "시작 자리에서 끊은 판", [
    ["전개 작업 목록", WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, WALK_OPS],
    [
      "뿌리만 묻는다",
      WALK_N,
      WALK_EDGES,
      WALK_ROOT,
      WALK_VALUES,
      [{ kind: "query", node: 0 }],
    ],
    ["잎만 묻는다", WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, LEAF_OPS],
  ]);
}

/** 짚고 가기 — 값 교체를 누적으로 두면 어디서 갈리는가. */
function pauseAddNotSet(): string {
  return mutantTable(addNotSet, "새 값을 그대로 더한 판", [
    ["전개 작업 목록", WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, WALK_OPS],
    [
      "한 정점을 두 번 갱신",
      WALK_N,
      WALK_EDGES,
      WALK_ROOT,
      WALK_VALUES,
      TWICE_OPS,
    ],
    [
      "다른 정점을 한 번씩 갱신",
      WALK_N,
      WALK_EDGES,
      WALK_ROOT,
      WALK_VALUES,
      ONCE_OPS,
    ],
  ]);
}

/** 짚고 가기 — 새 값을 적어 두지 않으면 두 번째 갱신에서만 갈린다. */
function pauseKeepOld(): string {
  return mutantTable(keepOld, "새 값을 안 적어 둔 판", [
    [
      "다른 정점을 한 번씩 갱신",
      WALK_N,
      WALK_EDGES,
      WALK_ROOT,
      WALK_VALUES,
      ONCE_OPS,
    ],
    ["전개 작업 목록", WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, WALK_OPS],
    [
      "한 정점을 두 번 갱신",
      WALK_N,
      WALK_EDGES,
      WALK_ROOT,
      WALK_VALUES,
      TWICE_OPS,
    ],
  ]);
}

/** `perf.derive` — 전개의 걸음을 세어 만들기와 작업 처리를 가른다. */
function perfDerive(): string {
  const skip = RUN.walk.filter((s) => s.kind === "건너뜀").length;
  const down = RUN.walk.filter((s) => s.kind === "자리").length;
  const close = RUN.walk.filter((s) => s.kind === "구간 끝").length;
  const updates = RUN.logs.filter((l) => l.kind === "update");
  const queries = RUN.logs.filter((l) => l.kind === "query");
  const addCells = updates.reduce((s, l) => s + l.hiPath.length, 0);
  const askCells = queries.reduce(
    (s, l) => s + l.hiPath.length + l.loPath.length,
    0,
  );
  const at = (k: WalkStep["kind"]) =>
    WALK.flatMap((s, i) => (s.kind === k ? [stepOf(i)] : []));
  const enters = at("enter");
  const exits = at("exit");
  const walked = [...enters, ...exits];
  const firstWalk = walked.sort(
    (a, b) => Number(a.slice(1)) - Number(b.slice(1)),
  );
  return [
    md(
      ["세는 것", "횟수", "걸음", "그 수가 나오는 까닭"],
      [
        [
          "자리를 준 사건",
          String(down),
          enters.join(" · "),
          "정점마다 정확히 한 번 들어간다",
        ],
        [
          "건너뛴 이웃",
          String(skip),
          `${firstWalk[0]}~${firstWalk.at(-1)} 에 딸림`,
          "이웃 목록에 든 부모 쪽 항목의 수",
        ],
        [
          "끝 자리를 적은 사건",
          String(close),
          exits.join(" · "),
          "정점마다 정확히 한 번 나온다",
        ],
        [
          "펜윅 트리에서 더한 칸",
          String(RUN.builds.filter((b) => b.inRange).length),
          at("build").join(" · "),
          `칸 ${WALK_N} 개 가운데 다음 칸이 범위 안인 것`,
        ],
        [
          "갱신이 고친 칸",
          String(addCells),
          at("update").join(" · "),
          `갱신 ${updates.length} 번`,
        ],
        [
          "질의가 읽은 칸",
          String(askCells),
          at("query").join(" · "),
          `질의 ${queries.length} 번`,
        ],
      ],
      [1],
    ),
    "",
    `만들 때의 배열 칸 접근은 ${comma(RUN.build)} 번, 작업 목록의 배열 칸 접근은 ${comma(RUN.ops)} 번이고, 들고 있는 칸은 3N + (N + 1) = ${RUN.cells} 칸입니다.`,
  ].join("\n");
}

/** `perf.bounds` — 모양을 바꿔도 작업 접근이 같은 자릿수인가. */
function perfBounds(): string {
  const shapes: [string, (n: number) => Edge[]][] = [
    ["사슬", chain],
    ["별", star],
    ["완전 이진 트리", binary],
  ];
  const rows = shapes.map(([label, make]) => {
    const e = make(SHAPE_N);
    const v = vals(SHAPE_N);
    const o = mixedOps(SHAPE_N, SHAPE_ROUNDS);
    const c = counted(SHAPE_N, e, 0, v, o, false);
    const w = byWalking(SHAPE_N, e, 0, v, o);
    return [label, comma(c.build), comma(c.ops), comma(w.ops)];
  });
  return [
    md(
      [
        "트리 모양",
        "오일러 투어와 펜윅 트리 · 만들기",
        "오일러 투어와 펜윅 트리 · 작업",
        "부분트리 다시 순회 · 작업",
      ],
      rows,
      [1, 2, 3],
    ),
    "",
    `정점 ${comma(SHAPE_N)} 개 · 섞은 작업 ${comma(SHAPE_ROUNDS)} 바퀴에서 잰 배열 칸 접근입니다.`,
  ].join("\n");
}

/** `perf.worst` — 모양마다 칸 접근이 가장 많은 질의와 갱신. */
function perfWorst(): string {
  const n = SHAPE_N;
  const shapes: [string, Edge[]][] = [
    ["사슬", chain(n)],
    ["별", star(n)],
    ["완전 이진 트리", binary(n)],
  ];
  const v = vals(n);
  const rows = shapes.map(([label, e]) => {
    const c = counted(n, e, 0, v, [], false);
    const p = parents(n, e, 0).parent;
    let deepest = 0;
    for (let x = 0; x < n; x++) {
      let d = 0;
      for (let cur = x; (p[cur] as number) !== -1; cur = p[cur] as number) d++;
      deepest = Math.max(deepest, d);
    }
    let ask = { x: 0, cells: -1 };
    let set = { x: 0, cells: -1 };
    for (let x = 0; x < n; x++) {
      const a =
        2 + askSteps(c.tout[x] as number) + askSteps((c.tin[x] as number) - 1);
      if (a > ask.cells) ask = { x, cells: a };
      const s = 3 + 2 * addSteps(n, c.tin[x] as number);
      if (s > set.cells) set = { x, cells: s };
    }
    // 걸음 식으로 센 값이 세는 사본과 같은지 두 자리에서 맞춘다.
    const one = counted(n, e, 0, v, [{ kind: "query", node: ask.x }], false);
    const two = counted(
      n,
      e,
      0,
      v,
      [{ kind: "update", node: set.x, value: 1 }],
      false,
    );
    if (one.ops !== ask.cells || two.ops !== set.cells) {
      throw new Error(`${label} — 걸음 식과 세는 사본이 다르다`);
    }
    return [
      label,
      comma(deepest),
      `정점 ${comma(ask.x)} · 구간 ${span(c.tin[ask.x] as number, c.tout[ask.x] as number)}`,
      String(ask.cells),
      `정점 ${comma(set.x)} · tin ${comma(c.tin[set.x] as number)}`,
      String(set.cells),
    ];
  });
  const bound = Math.floor(Math.log2(n)) + 1;
  return [
    md(
      [
        "트리 모양",
        "가장 깊은 정점의 깊이",
        "칸 접근이 가장 많은 질의",
        "그 칸 접근",
        "칸 접근이 가장 많은 갱신",
        "그 칸 접근",
      ],
      rows,
      [1, 3, 5],
    ),
    "",
    `정점 ${comma(n)} 개에서 정점마다 질의 하나와 갱신 하나를 따로 실행해 셌습니다. C(N) = ${bound} 이라 질의 상한 2 + 2C(N) 은 ${2 + 2 * bound}, 갱신 상한 3 + 2C(N) 은 ${3 + 2 * bound} 입니다. 규모 상한 사슬 정점 ${comma(N_LIMIT)} 개의 만들기 접근은 ${comma(counted(N_LIMIT, chain(N_LIMIT), 0, vals(N_LIMIT), [], false).build)} 번입니다.`,
  ].join("\n");
}

/** `selfcheck` — 예측 문제의 답. */
function selfcheckAnswer(): string {
  const ops: Op[] = [
    { kind: "update", node: 3, value: 100 },
    { kind: "query", node: 1 },
    { kind: "query", node: 2 },
  ];
  const c = counted(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, ops, true);
  const answers = 정본답(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, ops);
  let k = 0;
  const rows = c.logs.map((log) => [
    log.kind === "update"
      ? `update(${log.node}, ${log.value})`
      : `querySubtree(${log.node})`,
    span(log.span[0], log.span[1]),
    log.hiPath.map((x) => `칸 ${x}`).join(" · "),
    log.loPath.length === 0
      ? "—"
      : log.loPath.map((x) => `칸 ${x}`).join(" · "),
    log.answer === null
      ? `차이 ${log.delta}`
      : `${log.hiSum} − ${log.loSum} = ${answers[k++]}`,
  ]);
  return md(
    [
      "작업",
      "구간",
      "고친 칸 · 끝까지의 합이 읽은 칸",
      "시작 앞까지의 합이 읽은 칸",
      "결과",
    ],
    rows,
  );
}

export const PROOFS: Record<string, () => string> = {
  "concept-ops": conceptOps,
  "concept-intervals": conceptIntervals,
  "origin-naive": originNaive,
  "origin-repeat": originRepeat,
  "origin-numbering": originNumbering,
  "origin-line-sum": originLineSum,
  "origin-prefix": originPrefix,
  "euler-read": eulerRead,
  "euler-relation": eulerRelation,
  "euler-exit-order": eulerExitOrder,
  "build-events": buildEvents,
  "build-base": buildBase,
  "build-fenwick": buildFenwick,
  "build-query": buildQuery,
  "build-update": buildUpdate,
  premise,
  "design-recursion": designRecursion,
  "walk-input": walkInput,
  "walk-t1": walkT1,
  "walk-dfs": walkDfs,
  "walk-build": walkBuild,
  "walk-query": walkQuery,
  "walk-update": walkUpdate,
  "pause-add-not-set": pauseAddNotSet,
  "pause-keep-old": pauseKeepOld,
  "walk-trace": walkTrace,
  "branch-cover": branchCover,
  "related-nesting": relatedNesting,
  "math-check": mathCheck,
  "math-scale": mathScale,
  "invariant-hold": invariantHold,
  "invariant-edge": invariantEdge,
  "mutant-self-only": mutantSelfOnly,
  "mutant-drop-self": mutantDropSelf,
  "perf-derive": perfDerive,
  "perf-bounds": perfBounds,
  "perf-worst": perfWorst,
  "selfcheck-answer": selfcheckAnswer,
};
