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
 * 아래 표의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수만
 * 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
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
 * 아홉 갈래를 한 입력에서 전부 실행한다. 뿌리에 자식이 둘이라 스택에 정점이 셋 쌓이는 자리가
 * 나오고, 한쪽은 잎 둘을 단 깊이 2 이며 다른 쪽은 자식 하나만 달아 부분 트리 크기가
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

/** 사슬 — 이 절차가 가장 깊게 내려가는 모양이다. */
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

/** 뿌리만 되풀이해 묻는 작업 목록 — 정의를 그대로 옮긴 방법의 최악이다. */
export function rootQueries(rounds: number): Op[] {
  return Array.from({ length: rounds }, () => ({
    kind: "query" as const,
    node: 0,
  }));
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

/** `[0, 1, 3]` 꼴 — 본문 표기와 같다. */
const show = (a: number[]): string => `[${a.join(", ")}]`;

/** `- 3 - 2` 꼴 — 아직 안 정해진 자리를 `-` 로 둔다. */
const dash = (a: number[]): string =>
  a.map((v) => (v < 0 ? "-" : String(v))).join(" ");

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

/* ────────────────────── 세는 사본 — 이 글의 절차 ────────────────────── */

/** 순회가 한 걸음에 한 일. */
export interface WalkStep {
  kind: "자리" | "건너뜀" | "구간 끝";
  v: number;
  w: number | null;
  tin: number[];
  tout: number[];
  stack: number[];
  note: string;
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
  span: [number, number];
  /** 갱신이 고친 칸, 또는 구간 끝까지의 접두사 합이 읽은 칸. */
  hiPath: number[];
  /** 구간 시작 앞까지의 접두사 합이 읽은 칸. 갱신이면 빈 목록이다. */
  loPath: number[];
  detail: string;
  answer: number | null;
  tree: number[];
}

export interface Counted {
  tin: number[];
  tout: number[];
  tree: number[];
  walk: WalkStep[];
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
  const walk: WalkStep[] = [];
  let timer = 0;
  seen[root] = true;
  tin[root] = timer;
  timer++;
  build += 2;
  if (record) {
    walk.push({
      kind: "자리",
      v: root,
      w: null,
      tin: tin.slice(),
      tout: tout.slice(),
      stack: stack.slice(),
      note: "순회를 시작하는 정점이라 첫 자리를 받는다",
    });
  }

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
        if (record) {
          walk.push({
            kind: "자리",
            v,
            w,
            tin: tin.slice(),
            tout: tout.slice(),
            stack: stack.slice(),
            note: "처음 보는 이웃이라 다음 자리를 준다",
          });
        }
      } else if (record) {
        walk.push({
          kind: "건너뜀",
          v,
          w,
          tin: tin.slice(),
          tout: tout.slice(),
          stack: stack.slice(),
          note: "이미 자리를 받은 이웃이라 아무것도 안 한다",
        });
      }
      continue;
    }
    tout[v] = timer - 1;
    build++;
    stack.pop();
    if (record) {
      walk.push({
        kind: "구간 끝",
        v,
        w: null,
        tin: tin.slice(),
        tout: tout.slice(),
        stack: stack.slice(),
        note: "이웃을 다 봤다 — 마지막으로 나간 자리가 구간 끝이다",
      });
    }
  }

  const tree: number[] = Array.from({ length: n + 1 }, () => 0);
  for (let v = 0; v < n; v++) {
    tree[(tin[v] as number) + 1] = values[v] as number;
    build += 3;
  }
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
      path.push(i);
      cost++;
    }
    return { sum, path };
  };

  for (const op of ops) {
    if (op.kind === "update") {
      const delta = op.value - (value[op.node] as number);
      value[op.node] = op.value;
      cost += 3;
      const touched: number[] = [];
      for (let i = (tin[op.node] as number) + 1; i <= n; i += i & -i) {
        tree[i] = (tree[i] as number) + delta;
        touched.push(i);
        cost += 2;
      }
      if (record) {
        logs.push({
          kind: "update",
          node: op.node,
          value: op.value,
          span: [tin[op.node] as number, tout[op.node] as number],
          hiPath: touched,
          loPath: [],
          detail: `차이 ${delta}`,
          answer: null,
          tree: tree.slice(),
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
        span: [tin[op.node] as number, tout[op.node] as number],
        hiPath: hi.path,
        loPath: lo.path,
        detail: `${hi.sum} − ${lo.sum}`,
        answer: hi.sum - lo.sum,
        tree: tree.slice(),
      });
    }
  }

  return {
    tin,
    tout,
    tree,
    walk,
    builds,
    logs,
    answers,
    build,
    ops: cost,
    cells: 3 * n + (n + 1),
  };
}

/* ────────────────────── 세는 사본 — 견주는 방법들 ────────────────────── */

/** 뿌리를 정해 부모 배열을 낸다. 아래 사본들이 함께 쓴다. */
function parents(
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
 * 정의를 그대로 옮긴 방법 — 질의를 받을 때마다 그 부분 트리를 처음부터 순회하며 더한다.
 * 갱신은 값 배열의 칸 하나를 교체하는 것으로 끝난다.
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
 * 자리로 편 배열 위에 **접두사 합 배열**을 두는 방법 — 질의는 칸 둘을 읽어 빼면 끝이지만,
 * 갱신 하나가 그 자리 뒤의 접두사 합을 전부 고쳐야 한다.
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
    cost += 4; // tout 읽기 · tin 읽기 · 접두사 합 두 칸 읽기
    answers.push(
      (pre[(c.tout[op.node] as number) + 1] as number) -
        (pre[c.tin[op.node] as number] as number),
    );
  }
  return { build: c.build + 2 * n, ops: cost, cells: 3 * n + (n + 1), answers };
}

/**
 * 자리로 편 배열 위에서 **구간을 매번 처음부터 더하는** 방법. 갱신은 칸 하나 교체다.
 * ④ 걸음이 「같은 자리 매김 위에서 무엇이 갈리는가」를 보이는 데 쓴다.
 */
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

/**
 * 자리를 **너비 우선**으로 매기는 사본. 부분 트리가 연속 구간이 되는지 확인하는 데 쓴다.
 * 답을 내지 않고 자리 배열만 낸다.
 */
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

/** 정의 그대로 — 뿌리 `root` 에서 봤을 때 정점 `v` 의 부분 트리에 든 정점 번호. */
export function subtreeOf(
  n: number,
  edges: Edge[],
  root: number,
  v: number,
): number[] {
  const p = parents(n, edges, root);
  const out: number[] = [];
  for (let x = 0; x < n; x++) {
    let c = x;
    while (c !== -1) {
      if (c === v) {
        out.push(x);
        break;
      }
      c = p.parent[c] as number;
    }
  }
  return out;
}

/** 자리 배열이 정점 `v` 의 부분 트리를 끊기지 않는 구간으로 담는가. */
export function isContiguous(
  pos: number[],
  members: number[],
): { lo: number; hi: number; ok: boolean } {
  const spots = members.map((x) => pos[x] as number).sort((a, b) => a - b);
  const lo = spots[0] as number;
  const hi = spots[spots.length - 1] as number;
  return { lo, hi, ok: hi - lo + 1 === spots.length };
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

/** 재귀 사본이 몇 개짜리 사슬에서 실패하는지 실행으로 본다. */
export function recursionLimit(sizes: number[]): [number, string][] {
  return sizes.map((n) => {
    try {
      const r = recursivePositions(n, chain(n), 0);
      return [n, `자리 매기기 끝 — 뿌리의 구간 끝 ${r.tout[0] as number}`];
    } catch (error) {
      return [n, `${(error as Error).name} — 호출 스택이 먼저 끝난다`];
    }
  });
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
];

/** 정본을 그대로 실행해 작업 목록의 답을 낸다. */
function 정본답(
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
    if (!같은가(counted(n, edges, root, values, ops).answers, want)) {
      throw new Error(`세는 사본이 정본과 다른 답을 낸다 — ${label}`);
    }
    if (!같은가(byWalking(n, edges, root, values, ops).answers, want)) {
      throw new Error(`정의를 옮긴 사본이 정본과 다른 답을 낸다 — ${label}`);
    }
    if (!같은가(byPrefixArray(n, edges, root, values, ops).answers, want)) {
      throw new Error(`접두사 합 배열 사본이 정본과 다른 답을 낸다 — ${label}`);
    }
    if (!같은가(byLineSum(n, edges, root, values, ops).answers, want)) {
      throw new Error(
        `구간을 다 더하는 사본이 정본과 다른 답을 낸다 — ${label}`,
      );
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

/** **불변식을 지키던 줄** — 구간 끝을 마지막으로 나간 자리가 아니라 자기 자리로 둔 사본. */
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
    label: "구간 끝을 자기 자리로 둔 판",
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
    const a = show(정본답(n, e, r, v, o));
    const b = show(변이답(impl, n, e, r, v, o));
    return [label, a, b, a === b ? "같다" : "다르다"];
  });
  return table([["작업 목록", "정본", name, "판정"], ...rows]).join("\n");
}

/* ────────────────────────── 수치 ────────────────────────── */

const N_LIMIT = 100_000;
const Q_LIMIT = 100_000;

/**
 * 정의를 그대로 옮긴 방법이 사슬에서 뿌리를 `q` 번 물었을 때의 작업 접근 수.
 *
 * 질의 하나가 정점 `n` 개를 전부 지나가고, 정점마다 값 한 칸과 부모 한 칸을 읽으며 이웃
 * 항목을 읽는다. 사슬은 이웃 항목이 `2(n-1)` 개이므로 질의 하나가 `2n + 2(n-1) = 4n - 2` 다.
 */
const walkingRootFormula = (n: number, q: number): number => q * (4 * n - 2);

export const PROOFS: Record<string, () => string> = {
  /* ─────────────── deep.build ─────────────── */

  /** ② 정의를 그대로 옮긴 방법을 규모별로 잰다. */
  naiveScale: () => {
    const rows = [8, 64, 512, 4096].map((n) => {
      const e = chain(n);
      const v = vals(n);
      const o = rootQueries(n);
      const w = byWalking(n, e, 0, v, o);
      const c = counted(n, e, 0, v, o, false);
      return [
        comma(n),
        comma(n),
        comma(w.ops),
        comma(walkingRootFormula(n, n)),
        comma(c.ops),
        `${Math.round((w.ops / c.ops) * 10) / 10} 배`,
      ];
    });
    return [
      ...table(
        [
          [
            "정점 N",
            "작업 q",
            "부분 트리를 다시 순회",
            "식 q(4N-2)",
            "이 글이 세울 절차",
            "몇 배",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      "작업 q 개가 전부 뿌리 질의다. 질의 하나가 사슬 전체를 지나가며 정점마다 값과 부모를",
      "한 칸씩 읽고(2N) 이웃 항목을 읽으므로(2(N-1)) 4N-2 가 된다",
      `제약 규모 N = ${comma(N_LIMIT)} · 질의 ${comma(Q_LIMIT)} 번이면`,
      ...captions(
        [
          [
            "부분 트리를 다시 순회",
            `${comma(walkingRootFormula(N_LIMIT, Q_LIMIT))} 번`,
          ],
          [
            "이 글이 세울 절차",
            `${comma(counted(N_LIMIT, chain(N_LIMIT), 0, vals(N_LIMIT), rootQueries(Q_LIMIT), false).ops)} 번`,
          ],
        ],
        "  ",
      ),
    ].join("\n");
  },

  /** ② 같은 부분 트리를 되풀이해 물으면 같은 정점을 몇 번씩 지나가는가. */
  naiveRepeat: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, [], false);
    const asks = [0, 1, 0, 1, 2];
    let total = 0;
    const rows = asks.map((v, i) => {
      const members = subtreeOf(WALK_N, WALK_EDGES, WALK_ROOT, v);
      total += members.length;
      return [
        `질의 ${i + 1}`,
        `querySubtree(${v})`,
        show(members),
        String(members.length),
        String(total),
      ];
    });
    const perVertex = Array.from({ length: WALK_N }, (_, x) => {
      const hit = asks.filter((v) =>
        subtreeOf(WALK_N, WALK_EDGES, WALK_ROOT, v).includes(x),
      ).length;
      return [String(x), String(hit)];
    });
    return [
      ...table(
        [["차례", "물은 것", "지나간 정점", "정점 수", "누적"], ...rows],
        [3, 4],
      ),
      "",
      ...table([
        ["정점", ...perVertex.map(([v]) => v as string)],
        ["지나간 횟수", ...perVertex.map(([, h]) => h as string)],
      ]),
      "",
      ...captions([
        ["정점 수", `${WALK_N} 개`],
        ["다섯 질의가 지나간 정점 수", `${total} 개`],
        ["트리 모양이 바뀐 횟수", "0 번"],
      ]),
      `자리 ${c.tin.length} 개짜리 트리를 다섯 번 물었을 뿐인데 정점을 ${total} 번 지나갔다`,
    ].join("\n");
  },

  /** ③ 진입 순서로 자리를 매기면 각 부분 트리가 연속 구간이 된다. */
  flatten: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, [], false);
    const at: number[] = Array.from({ length: WALK_N }, () => 0);
    for (let v = 0; v < WALK_N; v++) at[c.tin[v] as number] = v;
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const members = subtreeOf(WALK_N, WALK_EDGES, WALK_ROOT, v);
      const spots = members
        .map((x) => c.tin[x] as number)
        .sort((a, b) => a - b);
      const span = isContiguous(c.tin, members);
      return [
        String(v),
        String(c.tin[v] as number),
        String(c.tout[v] as number),
        show(members),
        show(spots),
        span.ok ? "끊기지 않는다" : "끊긴다",
      ];
    });
    return [
      ...table(
        [
          [
            "정점",
            "자리 tin",
            "구간 끝 tout",
            "부분 트리",
            "그 자리들",
            "판정",
          ],
          ...rows,
        ],
        [0, 1, 2],
      ),
      "",
      ...captions([
        ["자리별 정점", at.join(" ")],
        ["자리별 값", at.map((v) => WALK_VALUES[v] as number).join(" ")],
        [
          "구간 길이와 부분 트리 크기",
          Array.from(
            { length: WALK_N },
            (_, v) => (c.tout[v] as number) - (c.tin[v] as number) + 1,
          ).join(" "),
        ],
      ]),
    ].join("\n");
  },

  /**
   * ④ 같은 자리 매김 위에서 두 방식을 재고, 그 비용이 **무엇에 달렸는지**를 모양별로 본다.
   */
  twoWays: () => {
    const n = 4_096;
    const rounds = 1_024;
    const shapes: [string, Edge[]][] = [
      ["사슬", chain(n)],
      ["완전 이진", binary(n)],
      ["별", star(n)],
    ];
    const v = vals(n);
    const o = mixedOps(n, rounds);
    const rows = shapes.map(([label, e]) => {
      const c = counted(n, e, 0, v, [], false);
      let spanSum = 0;
      for (let x = 0; x < n; x++) {
        spanSum += (c.tout[x] as number) - (c.tin[x] as number) + 1;
      }
      const line = byLineSum(n, e, 0, v, o);
      const own = counted(n, e, 0, v, o, false);
      return [
        label,
        `${Math.round((spanSum / n) * 10) / 10}`,
        comma(line.ops),
        comma(own.ops),
        `${Math.round((line.ops / own.ops) * 100) / 100} 배`,
      ];
    });
    return [
      ...table(
        [
          [
            "트리 모양",
            "구간 길이의 평균",
            "구간을 매번 다 더한다",
            "칸 구조를 둔다",
            "앞이 몇 배",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      "",
      ...captions([
        ["정점 N", comma(n)],
        ["갱신·질의 바퀴", comma(rounds)],
        ["세 모양이 함께 쓰는 것", "자리 매김 · 값 생성식 · 작업 목록"],
      ]),
      "",
      "구간을 매번 다 더하는 쪽은 모양을 바꾸면 계수가 크게 움직이고 칸 구조를 둔 쪽은 같은",
      "자릿수에 머문다. 앞의 계수를 정하는 것이 구간 길이의 평균이다",
    ].join("\n");
  },

  /** ⑤ 가장 단순한 후보인 접두사 합 배열을 먼저 시험해 반박한다. */
  prefixArrayCost: () => {
    const n = 4_096;
    const e = binary(n);
    const v = vals(n);
    const rounds = 1_024;
    const updates: Op[] = Array.from({ length: rounds }, (_, t) => ({
      kind: "update" as const,
      node: (t * 401) % n,
      value: ((t * 53) % 199) - 99,
    }));
    const queries: Op[] = Array.from({ length: rounds }, (_, t) => ({
      kind: "query" as const,
      node: (t * 613) % n,
    }));
    const designs: [string, typeof byLineSum][] = [
      ["구간을 매번 다 더한다", byLineSum],
      ["접두사 합 배열을 둔다", byPrefixArray],
      [
        "칸 구조를 둔다",
        (nn, ee, rr, vv, oo) => {
          const c = counted(nn, ee, rr, vv, oo, false);
          return {
            build: c.build,
            ops: c.ops,
            cells: c.cells,
            answers: c.answers,
          };
        },
      ],
    ];
    const rows = designs.map(([label, run]) => [
      label,
      comma(run(n, e, 0, v, updates).ops),
      comma(run(n, e, 0, v, queries).ops),
      comma(run(n, e, 0, v, [...updates, ...queries]).ops),
      comma(run(n, e, 0, v, []).cells),
    ]);
    return [
      ...table(
        [
          [
            "방법",
            `갱신만 ${comma(rounds)} 번`,
            `질의만 ${comma(rounds)} 번`,
            "둘 다",
            "저장 칸",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      "",
      ...captions([
        ["정점 N", comma(n)],
        ["트리 모양", "완전 이진"],
      ]),
      "",
      "접두사 합 배열은 질의를 가장 적은 접근으로 답하는 대신 갱신 하나가 그 자리 뒤의 칸을",
      "전부 고친다. 셋 중 갱신과 질의가 **둘 다** 작은 것은 칸 구조를 둔 쪽뿐이다",
    ].join("\n");
  },

  /** ⑥ 칸 구조의 걸음 수를 규모별로 낸다. */
  fenwickSteps: () => {
    const rows = [8, 64, 512, 4096, 100_000].map((n) => {
      let addWorst = 0;
      let addSum = 0;
      for (let p = 1; p <= n; p++) {
        let k = 0;
        for (let i = p; i <= n; i += i & -i) k++;
        addSum += k;
        if (k > addWorst) addWorst = k;
      }
      let askWorst = 0;
      for (let p = 0; p <= n; p++) {
        let k = 0;
        for (let i = p; i > 0; i -= i & -i) k++;
        if (k > askWorst) askWorst = k;
      }
      return [
        comma(n),
        String(Math.floor(Math.log2(n)) + 1),
        String(addWorst),
        `${Math.round((addSum / n) * 100) / 100}`,
        String(askWorst),
        comma(n),
      ];
    });
    return [
      ...table(
        [
          [
            "정점 N",
            "⌊log₂ N⌋ + 1",
            "갱신의 최대 걸음",
            "갱신의 평균 걸음",
            "접두사 합의 최대 걸음",
            "구간을 다 더할 때의 최대 걸음",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      "걸음 수는 자리마다 다르지만 어느 자리에서도 ⌊log₂ N⌋ + 1 을 넘지 않는다. 구간을 다",
      "더하는 쪽은 구간이 배열 전체일 때 N 걸음이다",
    ].join("\n");
  },

  /* ─────────────── deep.walk ─────────────── */

  /** T1 — 이웃 목록. */
  walkNear: () => {
    const near: number[][] = Array.from({ length: WALK_N }, () => []);
    for (const [u, v] of WALK_EDGES) {
      (near[u] as number[]).push(v);
      (near[v] as number[]).push(u);
    }
    const rows = near.map((list, v) => [
      `near[${v}]`,
      show(list),
      String(list.length),
    ]);
    return [
      ...table([["이웃 목록", "이웃", "개수"], ...rows], [2]),
      "",
      ...captions([
        [
          "항목 수의 합",
          `${near.reduce((s, l) => s + l.length, 0)} = 간선 ${WALK_EDGES.length} × 2`,
        ],
        ["값 value", WALK_VALUES.join(" ")],
      ]),
    ].join("\n");
  },

  /** T2~T6 — 자리 매기기 전 걸음. */
  walkOrder: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, [], true);
    const rows = c.walk.map((s) => [
      s.kind,
      s.w === null ? String(s.v) : `${s.v} → ${s.w}`,
      dash(s.tin),
      dash(s.tout),
      show(s.stack),
      s.note,
    ]);
    const at: number[] = Array.from({ length: WALK_N }, () => 0);
    for (let v = 0; v < WALK_N; v++) at[c.tin[v] as number] = v;
    return [
      ...table([["한 일", "정점", "tin", "tout", "스택", "설명"], ...rows]),
      "",
      ...captions([
        ["자리 tin", c.tin.join(" ")],
        ["구간 끝 tout", c.tout.join(" ")],
        ["자리별 정점", at.join(" ")],
        ["자리별 값", at.map((v) => WALK_VALUES[v] as number).join(" ")],
      ]),
    ].join("\n");
  },

  /** T7 — 펜윅 트리 만들기. */
  walkBuild: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, [], true);
    const at: number[] = Array.from({ length: WALK_N }, () => 0);
    for (let v = 0; v < WALK_N; v++) at[c.tin[v] as number] = v;
    const first = Array.from({ length: WALK_N + 1 }, (_, i) =>
      i === 0 ? 0 : (WALK_VALUES[at[i - 1] as number] as number),
    );
    const rows = c.builds.map((b) => [
      `칸 ${b.from}`,
      `칸 ${b.to}`,
      b.inRange ? "더한다" : "범위 밖이라 건너뛴다",
      b.tree.join(" "),
    ]);
    const covers = Array.from({ length: WALK_N }, (_, i) => {
      const cell = i + 1;
      const lo = cell - (cell & -cell) + 1;
      return [
        `칸 ${cell}`,
        `자리 ${lo - 1} 부터 ${cell - 1} 까지`,
        String(cell & -cell),
      ];
    });
    return [
      ...captions([["칸에 값만 적은 tree", first.join(" ")]]),
      "",
      ...table([["읽은 칸", "더할 칸", "판정", "그 뒤의 tree"], ...rows]),
      "",
      ...table([["칸", "담는 자리", "칸 수"], ...covers], [2]),
      "",
      ...captions([["완성된 tree", c.tree.join(" ")]]),
    ].join("\n");
  },

  /** T8 — 질의 하나를 접두사 합 둘의 차로 답한다. */
  walkQuery: () => {
    const c = counted(
      WALK_N,
      WALK_EDGES,
      WALK_ROOT,
      WALK_VALUES,
      [{ kind: "query", node: 1 }],
      true,
    );
    const log = c.logs[0] as OpStep;
    const members = subtreeOf(WALK_N, WALK_EDGES, WALK_ROOT, 1);
    const hi = log.span[1];
    const lo = log.span[0];
    return [
      ...captions([
        ["정점 1 의 부분 트리", show(members)],
        ["구간", `자리 ${lo} 부터 ${hi} 까지`],
        [
          `구간 끝까지의 접두사 합 prefix(${hi})`,
          `${log.hiPath.map((i) => `칸 ${i}`).join(" · ")}`,
        ],
        [
          `구간 시작 앞까지의 접두사 합 prefix(${lo - 1})`,
          `${log.loPath.map((i) => `칸 ${i}`).join(" · ")}`,
        ],
        ["답", `${log.detail} = ${log.answer as number}`],
      ]),
      "",
      ...table(
        [
          ["자리", "0", "1", "2", "3", "4", "5"],
          [
            "값",
            ...Array.from({ length: WALK_N }, (_, i) => {
              const at = Array.from({ length: WALK_N }, () => 0);
              for (let v = 0; v < WALK_N; v++) at[c.tin[v] as number] = v;
              return String(WALK_VALUES[at[i] as number] as number);
            }),
          ],
          [
            "구간 안",
            ...Array.from({ length: WALK_N }, (_, i) =>
              i >= lo && i <= hi ? "○" : "·",
            ),
          ],
        ],
        [1, 2, 3, 4, 5, 6],
      ),
    ].join("\n");
  },

  /** T9~T11 — 갱신과 그 뒤의 질의 둘. */
  walkUpdate: () => {
    const c = counted(
      WALK_N,
      WALK_EDGES,
      WALK_ROOT,
      WALK_VALUES,
      WALK_OPS,
      true,
    );
    const rows = c.logs.map((log, i) => [
      `T${8 + i}`,
      log.kind === "update"
        ? `update(${log.node}, ${log.value as number})`
        : `querySubtree(${log.node})`,
      `자리 ${log.span[0]} 부터 ${log.span[1]} 까지`,
      log.hiPath.map((k) => `칸 ${k}`).join(" "),
      log.loPath.length === 0
        ? "-"
        : log.loPath.map((k) => `칸 ${k}`).join(" "),
      log.tree.join(" "),
      log.answer === null ? log.detail : `${log.detail} = ${log.answer}`,
    ]);
    return [
      ...table([
        [
          "걸음",
          "작업",
          "구간",
          "위쪽 칸",
          "아래쪽 칸",
          "그 뒤의 tree",
          "결과",
        ],
        ...rows,
      ]),
      "",
      ...captions([["반환", show(c.answers)]]),
    ].join("\n");
  },

  /** 멈춤 — 재귀로 적으면 깊은 사슬에서 실행이 끝나지 않는다. */
  pauseRecursion: () => {
    const rows = recursionLimit([100, 1_000, 10_000, 100_000]).map(
      ([n, note]) => [comma(n), note],
    );
    const c = counted(10_000, chain(10_000), 0, vals(10_000), [], false);
    return [
      ...table([["사슬 정점 수", "재귀로 적은 사본"], ...rows], [0]),
      "",
      ...captions([
        ["제약 상한", `${comma(N_LIMIT)} 개`],
        [
          "배열 스택으로 적은 정본 · 사슬 10,000",
          `자리 매기기 끝 — 뿌리의 구간 끝 ${c.tout[0] as number}`,
        ],
        [
          "배열 스택으로 적은 정본 · 사슬 100,000",
          `자리 매기기 끝 — 뿌리의 구간 끝 ${counted(N_LIMIT, chain(N_LIMIT), 0, vals(N_LIMIT), [], false).tout[0] as number}`,
        ],
      ]),
    ].join("\n");
  },

  /** 멈춤 — 자리를 너비 우선으로 매기면 부분 트리가 끊긴다. */
  pauseBreadth: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, [], false);
    const bfs = breadthPositions(WALK_N, WALK_EDGES, WALK_ROOT);
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const members = subtreeOf(WALK_N, WALK_EDGES, WALK_ROOT, v);
      const a = isContiguous(c.tin, members);
      const b = isContiguous(bfs, members);
      return [
        String(v),
        show(members),
        show(members.map((x) => c.tin[x] as number).sort((p, q) => p - q)),
        a.ok ? "끊기지 않는다" : "끊긴다",
        show(members.map((x) => bfs[x] as number).sort((p, q) => p - q)),
        b.ok ? "끊기지 않는다" : "끊긴다",
      ];
    });
    const broken = rows.filter((r) => r[5] === "끊긴다").length;
    return [
      ...table(
        [
          [
            "정점",
            "부분 트리",
            "진입 순서의 자리",
            "판정",
            "너비 우선의 자리",
            "판정",
          ],
          ...rows,
        ],
        [0],
      ),
      "",
      ...captions([
        ["진입 순서 자리", c.tin.join(" ")],
        ["너비 우선 자리", bfs.join(" ")],
        ["너비 우선에서 끊기는 정점 수", `${broken} 개`],
      ]),
    ].join("\n");
  },

  /** 멈춤 — 값 교체를 누적으로 두면 어디서 갈리는가. */
  pauseAddNotSet: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, WALK_OPS);
    void c;
    return mutantTable(addNotSet, "새 값을 그대로 더한 판", [
      [
        "질의·갱신·질의·질의",
        WALK_N,
        WALK_EDGES,
        WALK_ROOT,
        WALK_VALUES,
        WALK_OPS,
      ],
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
  },

  /** 멈춤 — 새 값을 적어 두지 않으면 두 번째 갱신에서만 갈린다. */
  pauseKeepOld: () => {
    return [
      mutantTable(keepOld, "새 값을 안 적어 둔 판", [
        [
          "다른 정점을 한 번씩 갱신",
          WALK_N,
          WALK_EDGES,
          WALK_ROOT,
          WALK_VALUES,
          ONCE_OPS,
        ],
        [
          "질의·갱신·질의·질의",
          WALK_N,
          WALK_EDGES,
          WALK_ROOT,
          WALK_VALUES,
          WALK_OPS,
        ],
        [
          "한 정점을 두 번 갱신",
          WALK_N,
          WALK_EDGES,
          WALK_ROOT,
          WALK_VALUES,
          TWICE_OPS,
        ],
      ]),
      "",
      "세 작업 목록이 모두 update 를 지나간다 — 앞의 둘은 정점마다 한 번씩이라 답이 같다",
    ].join("\n");
  },

  /* ─────────────── related ─────────────── */

  /** 자리 배열이 곧 진입 시각 순서열이다. */
  relatedEuler: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, [], true);
    const enters = c.walk
      .filter((s) => s.kind === "자리")
      .map((s) => (s.w === null ? s.v : s.w));
    const exits = c.walk.filter((s) => s.kind === "구간 끝").map((s) => s.v);
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      String(v),
      String(enters.indexOf(v) + 1),
      String(exits.indexOf(v) + 1),
      `자리 ${c.tin[v] as number} 부터 ${c.tout[v] as number} 까지`,
      String((c.tout[v] as number) - (c.tin[v] as number) + 1),
    ]);
    return [
      ...captions([
        ["들어간 차례로 늘어놓은 정점", show(enters)],
        ["나온 차례로 늘어놓은 정점", show(exits)],
      ]),
      "",
      ...table(
        [
          ["정점", "들어간 차례", "나온 차례", "구간", "부분 트리 크기"],
          ...rows,
        ],
        [0, 1, 2, 4],
      ),
      "",
      "들어간 차례가 그대로 자리 번호이고, 구간의 길이가 부분 트리 크기와 같다",
    ].join("\n");
  },

  /* ─────────────── purpose.alt 는 .alt.ts 가 진다 ─────────────── */

  /* ─────────────── deep.math ─────────────── */

  /** ② 검산 — 정의를 작은 값에 넣어 확인한다. */
  mathCheck: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_ROOT, WALK_VALUES, [], false);
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const members = subtreeOf(WALK_N, WALK_EDGES, WALK_ROOT, v);
      const inSpan = Array.from({ length: WALK_N }, (_, x) => x).filter(
        (x) =>
          (c.tin[x] as number) >= (c.tin[v] as number) &&
          (c.tin[x] as number) <= (c.tout[v] as number),
      );
      return [
        String(v),
        show(members),
        show(inSpan),
        show(members) === show(inSpan) ? "같다" : "다르다",
        String((c.tout[v] as number) - (c.tin[v] as number) + 1),
        String(members.length),
      ];
    });
    return table(
      [
        [
          "정점 v",
          "정의 그대로의 부분 트리",
          "구간 조건을 만족하는 정점",
          "판정",
          "구간 길이",
          "부분 트리 크기",
        ],
        ...rows,
      ],
      [0, 4, 5],
    ).join("\n");
  },

  /** ③④ 유도와 계수 — 걸음 수의 닫힌 형태를 규모에 넣는다. */
  mathScale: () => {
    /** 자리 `p` 에서 시작한 갱신이 고치는 칸 수. */
    const addSteps = (n: number, p: number): number => {
      let k = 0;
      for (let i = p + 1; i <= n; i += i & -i) k++;
      return k;
    };
    /** 자리 `p` 까지의 접두사 합이 읽는 칸 수. `p = -1` 이면 0 이다. */
    const askSteps = (p: number): number => {
      let k = 0;
      for (let i = p + 1; i > 0; i -= i & -i) k++;
      return k;
    };
    const rows = [8, 64, 512, 4_096, 100_000].map((n) => {
      let addWorst = 0;
      let askWorst = 0;
      for (let p = 0; p < n; p++) {
        addWorst = Math.max(addWorst, addSteps(n, p));
        askWorst = Math.max(askWorst, askSteps(p) + askSteps(p - 1));
      }
      const bound = Math.floor(Math.log2(n)) + 1;
      return [
        comma(n),
        String(bound),
        String(addWorst),
        String(3 + 2 * addWorst),
        String(askWorst),
        String(2 + askWorst),
        String(2 * bound + 3),
      ];
    });
    const bound = Math.floor(Math.log2(N_LIMIT)) + 1;
    return [
      ...table(
        [
          [
            "정점 N",
            "C(N) = ⌊log₂ N⌋ + 1",
            "갱신의 최대 걸음",
            "갱신 한 번의 최대 칸 접근",
            "질의의 최대 걸음",
            "질의 한 번의 최대 칸 접근",
            "상한 2C(N) + 3",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5, 6],
      ),
      "",
      `제약 규모 N = ${comma(N_LIMIT)} 에서 작업 ${comma(Q_LIMIT)} 번의 상한은`,
      ...captions(
        [
          [
            "질의마다 부분 트리를 다시 순회",
            `${comma(Q_LIMIT * (4 * N_LIMIT - 2))} 번`,
          ],
          ["이 절차", `${comma(Q_LIMIT * (2 * bound + 3))} 번`],
        ],
        "  ",
      ),
    ].join("\n");
  },

  /* ─────────────── invariant ─────────────── */

  /** ② 각 연산이 불변식을 지키는 것을 상태값으로 본다. */
  invariantHold: () => {
    const c = counted(
      WALK_N,
      WALK_EDGES,
      WALK_ROOT,
      WALK_VALUES,
      WALK_OPS,
      true,
    );
    const rows = c.logs.map((log, i) => {
      const members = subtreeOf(WALK_N, WALK_EDGES, WALK_ROOT, log.node);
      const values = [...WALK_VALUES];
      // 이 걸음까지의 갱신을 반영한 값
      for (let k = 0; k <= i; k++) {
        const op = WALK_OPS[k];
        if (op !== undefined && op.kind === "update")
          values[op.node] = op.value;
      }
      const bySum = members.reduce((s, x) => s + (values[x] as number), 0);
      return [
        `T${8 + i}`,
        log.kind === "update" ? "갱신" : "질의",
        String(log.node),
        show(members),
        String(bySum),
        log.answer === null ? "-" : String(log.answer),
        log.answer === null
          ? "이 걸음은 답을 안 낸다"
          : log.answer === bySum
            ? "지켜진다"
            : "깨진다",
      ];
    });
    return table(
      [
        [
          "걸음",
          "연산",
          "정점",
          "부분 트리",
          "정의대로 더한 값",
          "이 절차의 답",
          "판정",
        ],
        ...rows,
      ],
      [4, 5],
    ).join("\n");
  },

  /** ② 엣지 케이스 — 빈 자리에 가까운 입력들. */
  invariantEdge: () => {
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
      return [
        label,
        String(n),
        String(r),
        dash(c.tin),
        dash(c.tout),
        show(got),
      ];
    });
    return table(
      [["입력", "정점 수", "뿌리", "자리 tin", "구간 끝 tout", "답"], ...rows],
      [1, 2],
    ).join("\n");
  },

  /** ③ 불변식을 지키던 줄을 바꿔 본다. */
  mutantSelfOnly: () => {
    return [
      mutantTable(selfOnly, "구간 끝을 자기 자리로 둔 판", [
        [
          "질의·갱신·질의·질의",
          WALK_N,
          WALK_EDGES,
          WALK_ROOT,
          WALK_VALUES,
          WALK_OPS,
        ],
        [
          "잎만 묻는다",
          WALK_N,
          WALK_EDGES,
          WALK_ROOT,
          WALK_VALUES,
          [
            { kind: "query", node: 3 },
            { kind: "query", node: 5 },
          ],
        ],
        [
          "사슬 다섯의 뿌리",
          5,
          chain(5),
          0,
          [1, 2, 3, 4, 5],
          [{ kind: "query", node: 0 }],
        ],
      ]),
      "",
      "세 작업 목록이 모두 그 줄을 지나간다 — 생성자가 정점마다 한 번씩 실행하는 줄이다",
    ].join("\n");
  },

  /** ③ 구간의 시작을 한 칸 늦게 끊어 본다. */
  mutantDropSelf: () => {
    return [
      mutantTable(dropSelf, "시작 자리에서 끊은 판", [
        [
          "질의·갱신·질의·질의",
          WALK_N,
          WALK_EDGES,
          WALK_ROOT,
          WALK_VALUES,
          WALK_OPS,
        ],
        [
          "뿌리만 묻는다",
          WALK_N,
          WALK_EDGES,
          WALK_ROOT,
          WALK_VALUES,
          [{ kind: "query", node: 0 }],
        ],
        [
          "잎만 묻는다",
          WALK_N,
          WALK_EDGES,
          WALK_ROOT,
          WALK_VALUES,
          [
            { kind: "query", node: 3 },
            { kind: "query", node: 5 },
          ],
        ],
      ]),
      "",
      "세 작업 목록이 모두 그 줄을 지나간다 — 질의마다 실행하는 줄이다. 잎을 물으면 구간이",
      "자기 자리 하나뿐이라 자기 값이 빠지고 답이 0 이 된다",
    ].join("\n");
  },

  /* ─────────────── perf ─────────────── */

  /** 비용을 세는 과정 — 전개의 T# 를 인용해 센다. */
  perfDerive: () => {
    const c = counted(
      WALK_N,
      WALK_EDGES,
      WALK_ROOT,
      WALK_VALUES,
      WALK_OPS,
      true,
    );
    const skip = c.walk.filter((s) => s.kind === "건너뜀").length;
    const down = c.walk.filter((s) => s.kind === "자리").length;
    const close = c.walk.filter((s) => s.kind === "구간 끝").length;
    const addSteps = c.logs
      .filter((l) => l.kind === "update")
      .reduce((s, l) => s + l.hiPath.length, 0);
    const askSteps = c.logs
      .filter((l) => l.kind === "query")
      .reduce((s, l) => s + l.hiPath.length + l.loPath.length, 0);
    return [
      ...table(
        [
          ["무엇", "몇 번", "왜 그 수인가"],
          ["자리를 준 걸음", String(down), "정점마다 정확히 한 번"],
          ["건너뛴 걸음", String(skip), "이웃 목록에 든 부모 방향 항목 수"],
          ["구간 끝을 적은 걸음", String(close), "정점마다 정확히 한 번"],
          [
            "펜윅 트리를 만든 걸음",
            String(c.builds.filter((b) => b.inRange).length),
            `칸 ${WALK_N} 개 중 다음 칸이 범위 안인 것`,
          ],
          ["갱신이 고친 칸", String(addSteps), "T9 한 번"],
          ["질의가 읽은 칸", String(askSteps), "T8 · T10 · T11 세 번"],
        ],
        [1],
      ),
      "",
      ...captions([
        ["만들 때의 배열 칸 접근", `${comma(c.build)} 번`],
        ["작업 목록의 배열 칸 접근", `${comma(c.ops)} 번`],
        ["들고 있는 칸", `${comma(c.cells)} 칸 = 3N + (N + 1)`],
      ]),
    ].join("\n");
  },

  /** 케이스별 비용과 그 경계. */
  perfBounds: () => {
    const rows = [
      ["사슬", chain] as const,
      ["별", star] as const,
      ["완전 이진", binary] as const,
    ].map(([label, make]) => {
      const n = 4_096;
      const e = make(n);
      const v = vals(n);
      const o = mixedOps(n, 1_024);
      const c = counted(n, e, 0, v, o, false);
      const w = byWalking(n, e, 0, v, o);
      return [
        label,
        comma(n),
        comma(c.build),
        comma(c.ops),
        comma(w.ops),
        `${Math.round((w.ops / c.ops) * 10) / 10} 배`,
      ];
    });
    return [
      ...table(
        [
          [
            "트리 모양",
            "정점 N",
            "만들기 접근",
            "작업 접근",
            "다시 순회하는 방법",
            "몇 배",
          ],
          ...rows,
        ],
        [1, 2, 3, 4, 5],
      ),
      "",
      "이 절차의 작업 접근은 트리 모양이 바뀌어도 같은 자릿수다 — 구간의 길이가 아니라",
      "자리 번호의 이진 표기가 걸음 수를 정하기 때문이다",
    ].join("\n");
  },

  /** 최악을 만드는 입력. */
  perfWorst: () => {
    const n = 4_096;
    const shapes: [string, Edge[]][] = [
      ["사슬", chain(n)],
      ["별", star(n)],
      ["완전 이진", binary(n)],
    ];
    const v = vals(n);
    const rows = shapes.map(([label, e]) => {
      const c = counted(n, e, 0, v, [], false);
      let deepest = 0;
      const p = parents(n, e, 0);
      for (let x = 0; x < n; x++) {
        let d = 0;
        let cur = x;
        while ((p.parent[cur] as number) !== -1) {
          cur = p.parent[cur] as number;
          d++;
        }
        if (d > deepest) deepest = d;
      }
      const worstAsk = Array.from({ length: n }, (_, x) => x).reduce(
        (best, x) => {
          const one = counted(n, e, 0, v, [{ kind: "query", node: x }], false);
          return one.ops > best.ops ? { x, ops: one.ops } : best;
        },
        { x: 0, ops: 0 },
      );
      const worstSet = Array.from({ length: n }, (_, x) => x).reduce(
        (best, x) => {
          const one = counted(
            n,
            e,
            0,
            v,
            [{ kind: "update", node: x, value: 1 }],
            false,
          );
          return one.ops > best.ops ? { x, ops: one.ops } : best;
        },
        { x: 0, ops: 0 },
      );
      return [
        label,
        String(deepest),
        String(worstAsk.x),
        String(worstAsk.ops),
        String(worstSet.x),
        String(worstSet.ops),
        comma(c.build),
      ];
    });
    const worstLine = Array.from({ length: n }, (_, x) => x).reduce(
      (best, x) => {
        const one = counted(
          n,
          chain(n),
          0,
          v,
          [{ kind: "query", node: x }],
          false,
        );
        return one.ops > best.ops ? { x, ops: one.ops } : best;
      },
      { x: 0, ops: 0 },
    );
    return [
      ...table(
        [
          [
            "트리 모양",
            "가장 깊은 정점의 깊이",
            "가장 비싼 질의의 정점",
            "그 칸 접근",
            "가장 비싼 갱신의 정점",
            "그 칸 접근",
            "만들기 접근",
          ],
          ...rows,
        ],
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      ...captions([
        ["정점 N", comma(n)],
        [
          "사슬에서 가장 비싼 질의",
          `정점 ${worstLine.x} — 칸 접근 ${worstLine.ops} 번`,
        ],
        ["C(N)", String(Math.floor(Math.log2(n)) + 1)],
        ["상한 2C(N) + 3", String(2 * (Math.floor(Math.log2(n)) + 1) + 3)],
        [
          "제약 상한 사슬의 만들기 접근",
          `${comma(counted(N_LIMIT, chain(N_LIMIT), 0, vals(N_LIMIT), [], false).build)} 번`,
        ],
      ]),
      "",
      "깊이가 4,095 인 사슬에서도 질의 하나의 칸 접근이 상한 아래에 있다 — 걸음 수를 정하는",
      "것이 트리의 깊이가 아니라 자리 번호의 이진 표기이기 때문이다",
    ].join("\n");
  },

  /* ─────────────── selfcheck ─────────────── */

  /** 예측 문제의 답. */
  selfcheckAnswer: () => {
    const c = counted(
      WALK_N,
      WALK_EDGES,
      WALK_ROOT,
      WALK_VALUES,
      [
        { kind: "update", node: 3, value: 100 },
        { kind: "query", node: 1 },
        { kind: "query", node: 2 },
      ],
      true,
    );
    const rows = c.logs.map((log) => [
      log.kind === "update"
        ? `update(${log.node}, ${log.value as number})`
        : `querySubtree(${log.node})`,
      `자리 ${log.span[0]} 부터 ${log.span[1]} 까지`,
      log.hiPath.map((k) => `칸 ${k}`).join(" · "),
      log.loPath.length === 0
        ? "-"
        : log.loPath.map((k) => `칸 ${k}`).join(" · "),
      log.answer === null ? log.detail : `${log.detail} = ${log.answer}`,
    ]);
    return table([
      ["작업", "구간", "위쪽 칸", "아래쪽 칸", "결과"],
      ...rows,
    ]).join("\n");
  },
};
