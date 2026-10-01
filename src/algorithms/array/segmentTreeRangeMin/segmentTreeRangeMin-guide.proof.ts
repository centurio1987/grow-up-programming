/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/segmentTreeRangeMin/segmentTreeRangeMin-guide.md
 *
 * **세는 사본이 여럿 있다.** 정본은 칸 접근 수도, 걸음마다의 상태도 내보내지 않으므로 그 자리를
 * 덧붙인 사본이 아니면 계수와 걸음을 낼 방법이 없다.
 *
 * - `traced` — 정본과 같은 절차에 걸음 기록을 덧붙인 판. 걸음마다 트리 전체와 답 목록을 베끼므로
 *   전개 입력처럼 작은 입력에만 쓴다. 큰 입력에 쓰면 메모리가 모자란다.
 * - `segCount` · `scanEachQuery` · `blockTable` · `sparseCount` · `visitCount` — 칸 접근 수나 노드
 *   수만 세는 가벼운 판. `N = 100,000` 같은 큰 입력은 이것만 쓴다.
 *
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 사본은 부를 때마다 자기 답을 정본과 맞대고, 어긋나면 던진다.
 *
 * **변이가 아무것도 안 바꾸는지 보는 검사는 중화 실행을 피해 간다.** `check-proof` 가 이 파일을 한 번 더
 * 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서 「변이가 답을 안 바꿨다」로
 * 던지면 중화 대조가 실행되지 않는다. 중화 여부는 변이 모듈의 함수가 정본과 같은 객체인가로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  segAccesses,
  sparseAccesses,
} from "./segmentTreeRangeMin-guide.alt.ts";
import {
  type SegOp,
  segmentTreeRangeMin,
} from "./segmentTreeRangeMin-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
export const num = (n: number): string => n.toLocaleString("en-US");

/** 소수 두 자리(천 단위 구분 포함). 나눗셈으로 나온 값에만 쓴다. */
const fixed2 = (x: number): string =>
  x.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** 겹치지 않는 가지가 돌려주는 값. 정본과 같다. 자릿수가 커서 표에는 이름으로 적는다. */
export const INF = Number.MAX_SAFE_INTEGER;
export const cell = (v: number | undefined): string =>
  v === undefined ? "—" : v === INF ? "INF" : String(v);

/** `[5 2 4 1 3]` 꼴 — 값 나열은 쉼표 없이 공백으로 적는다(L25). */
export const show = (xs: readonly number[]): string =>
  `[${xs.map((x) => cell(x)).join(" ")}]`;

/** `[0,4]` 꼴 — 인덱스 구간은 쉼표로 적는다(L25). */
export const range = (l: number, r: number): string => `[${l},${r}]`;

/** 괄호로 끝나는 말의 조사는 괄호 안 마지막 수의 읽기로 고른다(「[0,4] 가」). */
export const lastNum = (s: string): string =>
  /(-?\d[\d,]*)\D*$/.exec(s)?.[1] ?? s;

/** 단순 연산을 1 초에 1 억 번 한다고 잡은 시간. 본문 전체가 같은 기준을 쓴다. */
export const seconds = (ops: number): string =>
  ops / 1e8 < 0.01 ? "0.01 초 미만" : `${fixed2(ops / 1e8)} 초`;

/** 마크다운 표 한 벌. 머리줄은 열이 갈리는 축의 이름이다(L47). */
function md(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const line = (cells: string[]): string => `| ${cells.join(" | ")} |`;
  return [
    line(head),
    `| ${align.map((a) => (a === "r" ? "---:" : "---")).join(" | ")} |`,
    ...rows.map(line),
  ].join("\n");
}

/** 표 아래 문장까지 한 블록 — 문장 속 수도 실행이 낸 값이다(닫는 마커로 범위를 정한다). */
const withNote = (table: string, ...notes: string[]): string =>
  [table, "", ...notes].join("\n");

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 고정 입력. `concept`·`deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다. */
export const WALK: number[] = [5, 2, 4, 1, 3];

/** 그 배열에 거는 연산 다섯. 질의 넷과 갱신 하나이고 갱신이 가운데 있다. */
export const WALK_OPS: SegOp[] = [
  { type: "query", l: 0, r: 4 },
  { type: "query", l: 0, r: 2 },
  { type: "update", i: 3, v: 10 },
  { type: "query", l: 0, r: 4 },
  { type: "query", l: 3, r: 4 },
];

/** 연산 하나를 표에 적을 때의 이름. */
export const opName = (op: SegOp): string =>
  op.type === "query"
    ? `질의 ${range(op.l, op.r)}`
    : `갱신 i=${op.i} v=${op.v}`;

/** 질의만 골라 이름을 만든다 — 답 표의 왼쪽 열이다. */
const queryNames = (ops: SegOp[]): string[] =>
  ops.filter((o) => o.type === "query").map(opName);

/* ────────────────────── 트리의 모양 ────────────────────── */

export interface NodeInfo {
  node: number;
  s: number;
  e: number;
  value: number;
  depth: number;
}

/**
 * 노드 번호 · 담당 구간 · 값 · 깊이를 번호 순서로 모은다. 번호와 구간은 정본과 같은 규칙(뿌리 1,
 * 자식 `2·node` · `2·node+1`, `mid = ⌊(s+e)/2⌋`)으로 내고, 값은 정본에 그 구간을 물어 받는다.
 */
export function treeShape(A: number[]): NodeInfo[] {
  const N = A.length;
  const out: NodeInfo[] = [];
  function walk(n: number, s: number, e: number, d: number): void {
    const value = segmentTreeRangeMin(
      [...A],
      [{ type: "query", l: s, r: e }],
    )[0];
    out.push({ node: n, s, e, value: value ?? INF, depth: d });
    if (s === e) return;
    const mid = (s + e) >> 1;
    walk(2 * n, s, mid, d + 1);
    walk(2 * n + 1, mid + 1, e, d + 1);
  }
  walk(1, 0, N - 1, 0);
  return out.sort((x, y) => x.node - y.node);
}

export type Verdict = "disjoint" | "inside" | "split";

interface Visit {
  node: number;
  s: number;
  e: number;
  verdict: Verdict;
}

/** 질의 하나가 어느 노드에 들어가 어느 노드를 읽었는지. 답은 정본에 다시 묻는다. */
export function queryPath(
  A: number[],
  l: number,
  r: number,
): { entered: number; visits: Visit[]; read: number[]; answer: number } {
  const N = A.length;
  const shape = new Map(treeShape(A).map((x) => [x.node, x]));
  const read: number[] = [];
  const visits: Visit[] = [];
  function q(n: number, s: number, e: number): number {
    if (r < s || e < l) {
      visits.push({ node: n, s, e, verdict: "disjoint" });
      return INF;
    }
    if (l <= s && e <= r) {
      visits.push({ node: n, s, e, verdict: "inside" });
      read.push(n);
      return shape.get(n)?.value ?? INF;
    }
    visits.push({ node: n, s, e, verdict: "split" });
    const mid = (s + e) >> 1;
    return Math.min(q(2 * n, s, mid), q(2 * n + 1, mid + 1, e));
  }
  const answer = q(1, 0, N - 1);
  const want = segmentTreeRangeMin([...A], [{ type: "query", l, r }])[0];
  if (answer !== want) {
    throw new Error(`queryPath 가 정본과 다르다 — ${range(l, r)}`);
  }
  return { entered: visits.length, visits, read, answer };
}

/** 노드 번호의 최댓값과 트리의 최대 깊이. 값은 안 보므로 트리를 만들지 않는다. */
export function nodeExtent(N: number): { maxNode: number; depth: number } {
  let maxNode = 0;
  let depth = 0;
  function b(n: number, s: number, e: number, d: number): void {
    maxNode = Math.max(maxNode, n);
    depth = Math.max(depth, d);
    if (s === e) return;
    const mid = (s + e) >> 1;
    b(2 * n, s, mid, d + 1);
    b(2 * n + 1, mid + 1, e, d + 1);
  }
  b(1, 0, N - 1, 0);
  return { maxNode, depth };
}

/** 인덱스 `i` 를 담당 구간에 품은 노드의 수 — 뿌리에서 `i` 의 리프까지 내려가는 줄기의 길이다. */
export function pathLen(N: number, i: number): number {
  let s = 0;
  let e = N - 1;
  let c = 1;
  while (s !== e) {
    const mid = (s + e) >> 1;
    if (i <= mid) e = mid;
    else s = mid + 1;
    c++;
  }
  return c;
}

/** 한 질의가 방문 노드 수와 읽은 노드 수만 센다(큰 `N` 용 — 트리를 만들지 않는다). */
function visitCount(
  N: number,
  l: number,
  r: number,
): { entered: number; read: number } {
  let entered = 0;
  let read = 0;
  function walk(s: number, e: number): void {
    entered++;
    if (r < s || e < l) return;
    if (l <= s && e <= r) {
      read++;
      return;
    }
    const mid = (s + e) >> 1;
    walk(s, mid);
    walk(mid + 1, e);
  }
  walk(0, N - 1);
  return { entered, read };
}

/**
 * 모든 `(l, r)` 짝에서 진입 노드 수와 읽은 노드 수의 최댓값.
 *
 * 값은 세지 않으므로 트리를 만들지 않는다 — 짝이 `N(N+1)/2` 개라 짝마다 트리를 다시
 * 만들면 `N = 1,024` 에서 끝나지 않는다.
 */
function extremeQuery(N: number): {
  maxEntered: number;
  maxRead: number;
  at: [number, number];
  readAt: [number, number];
} {
  let maxEntered = 0;
  let maxRead = 0;
  let at: [number, number] = [0, 0];
  let readAt: [number, number] = [0, 0];
  for (let l = 0; l < N; l++) {
    for (let r = l; r < N; r++) {
      const c = visitCount(N, l, r);
      if (c.entered > maxEntered) {
        maxEntered = c.entered;
        at = [l, r];
      }
      if (c.read > maxRead) {
        maxRead = c.read;
        readAt = [l, r];
      }
    }
  }
  return { maxEntered, maxRead, at, readAt };
}

/* ────────────────────── 걸음 기록 — 작은 입력 전용 ────────────────────── */

export type TraceEvent =
  | {
      kind: "build";
      node: number;
      s: number;
      e: number;
      leaf: boolean;
      left: number;
      right: number;
      value: number;
    }
  | {
      kind: "visit";
      op: number;
      node: number;
      s: number;
      e: number;
      l: number;
      r: number;
      verdict: Verdict;
      value: number;
    }
  | {
      kind: "combine";
      op: number;
      node: number;
      s: number;
      e: number;
      l: number;
      r: number;
      left: number;
      right: number;
      value: number;
    }
  | {
      kind: "leaf";
      op: number;
      node: number;
      s: number;
      i: number;
      v: number;
      old: number;
    }
  | {
      kind: "pull";
      op: number;
      node: number;
      s: number;
      e: number;
      old: number;
      left: number;
      right: number;
      value: number;
    };

export interface TraceStep {
  readonly event: TraceEvent;
  /** 이 걸음이 끝난 뒤의 트리. 칸 번호가 노드 번호다. */
  readonly tree: readonly number[];
  /** 이 걸음이 끝난 뒤의 답 목록. */
  readonly answers: readonly number[];
}

/**
 * 정본과 같은 절차에 걸음 기록을 덧붙인 판. 부를 때마다 자기 답을 정본과 맞댄다.
 * 걸음마다 트리 전체를 베끼므로 작은 입력에만 쓴다.
 */
export function traced(
  A: number[],
  ops: SegOp[],
): { steps: TraceStep[]; out: number[] } {
  const N = A.length;
  const tree = new Array<number>(4 * N).fill(INF);
  const steps: TraceStep[] = [];
  const out: number[] = [];
  const push = (event: TraceEvent) =>
    steps.push({ event, tree: tree.slice(), answers: out.slice() });

  function build(n: number, s: number, e: number): void {
    if (s === e) {
      const value = A[s] ?? INF;
      tree[n] = value;
      push({
        kind: "build",
        node: n,
        s,
        e,
        leaf: true,
        left: INF,
        right: INF,
        value,
      });
      return;
    }
    const mid = (s + e) >> 1;
    build(2 * n, s, mid);
    build(2 * n + 1, mid + 1, e);
    const left = tree[2 * n] ?? INF;
    const right = tree[2 * n + 1] ?? INF;
    const value = Math.min(left, right);
    tree[n] = value;
    push({ kind: "build", node: n, s, e, leaf: false, left, right, value });
  }

  function update(
    op: number,
    n: number,
    s: number,
    e: number,
    i: number,
    v: number,
  ): void {
    if (s === e) {
      const old = tree[n] ?? INF;
      tree[n] = v;
      push({ kind: "leaf", op, node: n, s, i, v, old });
      return;
    }
    const mid = (s + e) >> 1;
    if (i <= mid) update(op, 2 * n, s, mid, i, v);
    else update(op, 2 * n + 1, mid + 1, e, i, v);
    const old = tree[n] ?? INF;
    const left = tree[2 * n] ?? INF;
    const right = tree[2 * n + 1] ?? INF;
    const value = Math.min(left, right);
    tree[n] = value;
    push({ kind: "pull", op, node: n, s, e, old, left, right, value });
  }

  function query(
    op: number,
    n: number,
    s: number,
    e: number,
    l: number,
    r: number,
  ): number {
    if (r < s || e < l) {
      push({
        kind: "visit",
        op,
        node: n,
        s,
        e,
        l,
        r,
        verdict: "disjoint",
        value: INF,
      });
      return INF;
    }
    if (l <= s && e <= r) {
      const value = tree[n] ?? INF;
      if (n === 1) out.push(value);
      push({
        kind: "visit",
        op,
        node: n,
        s,
        e,
        l,
        r,
        verdict: "inside",
        value,
      });
      return value;
    }
    push({
      kind: "visit",
      op,
      node: n,
      s,
      e,
      l,
      r,
      verdict: "split",
      value: INF,
    });
    const mid = (s + e) >> 1;
    const left = query(op, 2 * n, s, mid, l, r);
    const right = query(op, 2 * n + 1, mid + 1, e, l, r);
    const value = Math.min(left, right);
    if (n === 1) out.push(value);
    push({ kind: "combine", op, node: n, s, e, l, r, left, right, value });
    return value;
  }

  build(1, 0, N - 1);
  for (const [k, op] of ops.entries()) {
    if (op.type === "update") update(k, 1, 0, N - 1, op.i, op.v);
    else query(k, 1, 0, N - 1, op.l, op.r);
  }
  const want = segmentTreeRangeMin([...A], ops);
  if (JSON.stringify(out) !== JSON.stringify(want)) {
    throw new Error(`traced 가 정본과 다르다 — ${show(out)} 대 ${show(want)}`);
  }
  return { steps, out };
}

/** 전개 입력의 기록. 걸음 번호 `T1` 부터 이 차례대로 붙는다. */
export const WALK_TRACE = traced(WALK, WALK_OPS);

/** 기록의 `k` 번째(0 부터) 걸음 번호. */
export const stepOf = (k: number): string => `T${k + 1}`;

/** 조건을 만족하는 걸음 번호 목록 — 본문이 `T#` 로 가리키는 자리를 실행에서 고른다. */
export function stepsWhere(pred: (e: TraceEvent) => boolean): string[] {
  return WALK_TRACE.steps.flatMap((s, k) => (pred(s.event) ? [stepOf(k)] : []));
}

/** 걸음 범위 `T3\\~T6` 꼴 — 한 문단에 홑물결이 둘이면 GFM 이 취소선으로 읽어서 이스케이프한다. */
export const span = (ids: readonly string[]): string =>
  ids.length <= 1 ? (ids[0] ?? "—") : `${ids[0]}\\~${ids.at(-1)}`;

/** 연산 `op` 이 차지한 걸음 번호. */
export const stepsOfOp = (op: number): string[] =>
  stepsWhere((e) => e.kind !== "build" && e.op === op);

/* ────────────────────── 계측기 — 칸 접근 수 ────────────────────── */

/*
 * 세는 것은 **칸 접근 수**(읽기 + 쓰기)다. 원고 전체가 이 한 기준을 쓴다. 벽시계·처리량은
 * 실행마다 값이 달라 「본문의 수치가 실측과 같은가」를 정의할 수 없다.
 */

/** 묶음 없이 질의마다 구간을 직접 읽는 절차. 갱신은 칸 하나 쓰기. */
export function scanEachQuery(
  A: number[],
  ops: SegOp[],
): { out: number[]; reads: number; writes: number } {
  const a = A.slice();
  const out: number[] = [];
  let reads = 0;
  let writes = 0;
  for (const op of ops) {
    if (op.type === "update") {
      writes++;
      a[op.i] = op.v;
      continue;
    }
    let m = INF;
    for (let k = op.l; k <= op.r; k++) {
      reads++;
      m = Math.min(m, a[k] ?? INF);
    }
    out.push(m);
  }
  return { out, reads, writes };
}

interface Cost {
  out: number[];
  build: number;
  queryAcc: number;
  updateAcc: number;
  cells: number;
}

/** `B` 칸마다 최솟값 하나를 저장하는 한 층짜리 묶음. `B = 1` 이면 칸마다 한 묶음이다. */
export function blockTable(A: number[], ops: SegOp[], B: number): Cost {
  const N = A.length;
  const a = A.slice();
  const nb = Math.ceil(N / B);
  const bm = new Array<number>(nb).fill(INF);
  let acc = 0;
  for (let j = 0; j < nb; j++) {
    let m = INF;
    for (let k = j * B; k < Math.min(N, j * B + B); k++) {
      acc++;
      m = Math.min(m, a[k] ?? INF);
    }
    acc++;
    bm[j] = m;
  }
  const build = acc;
  let queryAcc = 0;
  let updateAcc = 0;
  const out: number[] = [];
  for (const op of ops) {
    const before = acc;
    if (op.type === "update") {
      acc++;
      a[op.i] = op.v;
      const j = Math.floor(op.i / B);
      let m = INF;
      for (let k = j * B; k < Math.min(N, j * B + B); k++) {
        acc++;
        m = Math.min(m, a[k] ?? INF);
      }
      acc++;
      bm[j] = m;
      updateAcc += acc - before;
      continue;
    }
    let m = INF;
    let k = op.l;
    while (k <= op.r) {
      if (k % B === 0 && k + B - 1 <= op.r) {
        acc++;
        m = Math.min(m, bm[k / B] ?? INF);
        k += B;
      } else {
        acc++;
        m = Math.min(m, a[k] ?? INF);
        k++;
      }
    }
    out.push(m);
    queryAcc += acc - before;
  }
  return { out, build, queryAcc, updateAcc, cells: nb };
}

/** 세그먼트 트리. 정본과 같은 절차이고 접근 계수만 덧붙였다. */
export function segCount(A: number[], ops: SegOp[]): Cost {
  const N = A.length;
  const tree = new Array<number>(4 * N).fill(INF);
  let acc = 0;
  const merge = (n: number): number => {
    acc += 2;
    return Math.min(tree[2 * n] ?? INF, tree[2 * n + 1] ?? INF);
  };
  function build(n: number, s: number, e: number): void {
    if (s === e) {
      acc += 2;
      tree[n] = A[s] ?? INF;
      return;
    }
    const mid = (s + e) >> 1;
    build(2 * n, s, mid);
    build(2 * n + 1, mid + 1, e);
    tree[n] = merge(n);
    acc++;
  }
  function upd(n: number, s: number, e: number, i: number, v: number): void {
    if (s === e) {
      acc++;
      tree[n] = v;
      return;
    }
    const mid = (s + e) >> 1;
    if (i <= mid) upd(2 * n, s, mid, i, v);
    else upd(2 * n + 1, mid + 1, e, i, v);
    tree[n] = merge(n);
    acc++;
  }
  function q(n: number, s: number, e: number, l: number, r: number): number {
    if (r < s || e < l) return INF;
    if (l <= s && e <= r) {
      acc++;
      return tree[n] ?? INF;
    }
    const mid = (s + e) >> 1;
    return Math.min(q(2 * n, s, mid, l, r), q(2 * n + 1, mid + 1, e, l, r));
  }
  build(1, 0, N - 1);
  const built = acc;
  let queryAcc = 0;
  let updateAcc = 0;
  const out: number[] = [];
  for (const op of ops) {
    const before = acc;
    if (op.type === "update") {
      upd(1, 0, N - 1, op.i, op.v);
      updateAcc += acc - before;
      continue;
    }
    out.push(q(1, 0, N - 1, op.l, op.r));
    queryAcc += acc - before;
  }
  return { out, build: built, queryAcc, updateAcc, cells: 4 * N };
}

/* ────────────────────── Sparse Table — 비교 상대 ────────────────────── */

/** Sparse Table 의 층 — 층 `k` 의 칸 `i` 는 `[i, i+2^k−1]` 의 최솟값이다. */
export function sparseLevels(A: number[]): number[][] {
  const st: number[][] = [A.slice()];
  for (let w = 2; w <= A.length; w *= 2) {
    const below = st.at(-1) as number[];
    st.push(
      Array.from({ length: A.length - w + 1 }, (_, i) =>
        Math.min(below[i] ?? INF, below[i + w / 2] ?? INF),
      ),
    );
  }
  return st;
}

/** 층 `k` 에서 인덱스 `i` 를 덮는 칸의 수. */
const coverIn = (N: number, k: number, i: number): number => {
  const w = 2 ** k;
  return Math.max(0, Math.min(i, N - w) - Math.max(0, i - w + 1) + 1);
};

/** 인덱스 `i` 를 덮는 Sparse Table 칸의 총수 — 갱신 하나가 다시 계산해야 하는 칸이다. */
export const sparseCoverOf = (N: number, i: number): number => {
  let c = 0;
  for (let k = 0; 2 ** k <= N; k++) c += coverIn(N, k, i);
  return c;
};

/** Sparse Table 의 칸 수. */
export const sparseCells = (N: number): number => {
  let c = 0;
  for (let w = 1; w <= N; w *= 2) c += N - w + 1;
  return c;
};

/**
 * Sparse Table 에 갱신을 받게 한 판 — 원소를 덮는 칸만 층마다 다시 계산한다(표를 통째로 다시 쌓지
 * 않는다). 0 층 칸은 쓰기 1 번, 위층 칸은 아래층 두 칸 읽기와 쓰기 1 번이다. 질의는 두 칸 읽기다.
 * 실행하는 판(`run: true`)과 칸 수만 세는 판이 같은 값을 내는지 이 파일이 확인한다.
 */
function sparseCount(
  A: number[],
  ops: SegOp[],
  run: boolean,
): { build: number; queryAcc: number; updateAcc: number; out: number[] } {
  const N = A.length;
  let build = N * 2;
  for (let w = 2; w <= N; w *= 2) build += (N - w + 1) * 3;
  let queryAcc = 0;
  let updateAcc = 0;
  const out: number[] = [];
  const st = run ? sparseLevels(A) : [];
  for (const op of ops) {
    if (op.type === "query") {
      queryAcc += 2;
      if (run) {
        const k = 31 - Math.clz32(op.r - op.l + 1);
        const row = st[k] as number[];
        out.push(Math.min(row[op.l] ?? INF, row[op.r - 2 ** k + 1] ?? INF));
      }
      continue;
    }
    if (!run) {
      updateAcc += 1 + 3 * (sparseCoverOf(N, op.i) - 1);
      continue;
    }
    (st[0] as number[])[op.i] = op.v;
    updateAcc += 1;
    for (let k = 1; k < st.length; k++) {
      const w = 2 ** k;
      const row = st[k] as number[];
      const below = st[k - 1] as number[];
      for (let s = Math.max(0, op.i - w + 1); s <= Math.min(op.i, N - w); s++) {
        row[s] = Math.min(below[s] ?? INF, below[s + w / 2] ?? INF);
        updateAcc += 3;
      }
    }
  }
  return { build, queryAcc, updateAcc, out };
}

/* ────────────────────── 과제 규모의 작업 목록 ────────────────────── */

/**
 * `deep.origin` 이 방법들을 같은 목록으로 재는 작업 목록. 갱신과 질의를 번갈아 두고(`t` 가 짝수면
 * 갱신), 질의는 전부 `[1, N−2]` 다 — 양 끝을 한 칸씩 안으로 당긴 구간이라 방법마다 가장 많이 읽는
 * 모양에 가깝다. **난수를 쓰지 않으므로 시드가 없다** — 아래 생성식이 입력의 전부다.
 */
export function scaleInput(
  N: number,
  Q: number,
): { A: number[]; ops: SegOp[] } {
  const A = Array.from({ length: N }, (_, i) => (i * 37) % 101);
  const ops: SegOp[] = [];
  for (let t = 0; t < Q; t++) {
    if (t % 2 === 0) {
      ops.push({ type: "update", i: (t * 53) % N, v: ((t * 29) % 1000) - 500 });
    } else {
      ops.push({ type: "query", l: 1, r: N - 2 });
    }
  }
  return { A, ops };
}

/** 과제의 제약 규모. */
export const SCALE_N = 100_000;
export const SCALE_Q = 100_000;

/** 한 층 묶음의 크기 — `⌊√N⌋`. 질의가 읽는 묶음 수와 갱신이 다시 읽는 칸 수가 비슷해지는 자리다. */
const sqrtB = (N: number): number => Math.floor(Math.sqrt(N));

export interface ScaleRow {
  readonly name: string;
  readonly build: number;
  readonly query: number;
  readonly update: number;
  readonly cells: number;
  readonly how: "실행" | "식";
}

/**
 * 과제 규모에서 네 방법의 칸 접근 수. 차례로 읽기와 Sparse Table 은 실행하면 수십 초가 걸려서
 * 식으로 센다 — 같은 식이 `N = Q = 1,000` 에서 실행한 값과 같은지를 `checkFormulas` 가 확인한다.
 */
function scaleRows(N: number, Q: number, runAll: boolean): ScaleRow[] {
  const { A, ops } = scaleInput(N, Q);
  const want = segmentTreeRangeMin([...A], ops);
  const queries = ops.filter((o) => o.type === "query") as {
    type: "query";
    l: number;
    r: number;
  }[];
  const updates = ops.length - queries.length;
  let scan: { reads: number; writes: number };
  if (runAll) {
    const r = scanEachQuery(A, ops);
    if (JSON.stringify(r.out) !== JSON.stringify(want)) {
      throw new Error("scanEachQuery 가 정본과 다르다");
    }
    scan = r;
  } else {
    scan = {
      reads: queries.reduce((s, q) => s + (q.r - q.l + 1), 0),
      writes: updates,
    };
  }
  const sp = sparseCount(A, ops, runAll);
  if (runAll && JSON.stringify(sp.out) !== JSON.stringify(want)) {
    throw new Error("sparseCount 가 정본과 다르다");
  }
  const B = sqrtB(N);
  const blk = blockTable(A, ops, B);
  const seg = segCount(A, ops);
  if (JSON.stringify(seg.out) !== JSON.stringify(want)) {
    throw new Error("segCount 가 정본과 다르다");
  }
  if (JSON.stringify(blk.out) !== JSON.stringify(want)) {
    throw new Error("blockTable 가 정본과 다르다");
  }
  const how = runAll ? "실행" : "식";
  return [
    {
      name: "차례로 읽기",
      build: 0,
      query: scan.reads,
      update: scan.writes,
      cells: 0,
      how,
    },
    {
      name: "Sparse Table",
      build: sp.build,
      query: sp.queryAcc,
      update: sp.updateAcc,
      cells: sparseCells(N),
      how,
    },
    {
      name: `한 층 묶음 B=${B}`,
      build: blk.build,
      query: blk.queryAcc,
      update: blk.updateAcc,
      cells: blk.cells,
      how: "실행",
    },
    {
      name: "세그먼트 트리",
      build: seg.build,
      query: seg.queryAcc,
      update: seg.updateAcc,
      cells: seg.cells,
      how: "실행",
    },
  ];
}

/** 식으로 센 값이 실행한 값과 같은지 — 작은 규모에서 둘을 다 내서 맞댄다. 다르면 던진다. */
function checkFormulas(): void {
  const run = scaleRows(1_000, 1_000, true);
  const formula = scaleRows(1_000, 1_000, false);
  for (const [k, r] of run.entries()) {
    const f = formula[k] as ScaleRow;
    if (r.build !== f.build || r.query !== f.query || r.update !== f.update) {
      throw new Error(`${r.name} 의 식이 실행과 다르다`);
    }
  }
}
checkFormulas();

/** 과제 규모의 표 — 한 번만 센다(그림 사이드카도 같은 값을 쓴다). */
export const SCALE: readonly ScaleRow[] = scaleRows(SCALE_N, SCALE_Q, false);
export const total = (r: ScaleRow): number => r.build + r.query + r.update;

/* ────────────────────── 1,024 칸 작업 목록 — 묶음 크기 시험 ────────────────────── */

/**
 * 전개 입력(다섯 칸)은 묶음 크기를 갈라 보기에 너무 작다 — `B` 를 2 로만 잡아도 묶음이
 * 셋뿐이라 계수가 상수에 묻힌다. 그래서 같은 규칙으로 만든 1,024 칸 입력을 쓴다.
 * **난수를 쓰지 않으므로 시드가 없다** — 아래 생성식이 입력의 전부다.
 */
const BIG_N = 1024;
const BIG_A: number[] = Array.from({ length: BIG_N }, (_, i) => (i * 37) % 101);
const BIG_OPS: SegOp[] = ((): SegOp[] => {
  const ops: SegOp[] = [];
  for (let t = 0; t < 1024; t++) {
    if (t % 2 === 0) {
      ops.push({
        type: "update",
        i: (t * 53) % BIG_N,
        v: ((t * 29) % 1000) - 500,
      });
      continue;
    }
    const a = (t * 37) % BIG_N;
    const b = (t * 91) % BIG_N;
    ops.push({ type: "query", l: Math.min(a, b), r: Math.max(a, b) });
  }
  return ops;
})();

const BLOCK_SIZES = [1, 2, 4, 8, 16, 32, 64, 256, 1024];

/* ────────────────────── 접두 최솟값 ────────────────────── */

const prefixMins = (A: number[]): number[] => {
  const pm: number[] = [];
  let m = INF;
  for (const v of A) {
    m = Math.min(m, v);
    pm.push(m);
  }
  return pm;
};

const PREFIX_PROBES: [number, number][] = [
  [0, 4],
  [0, 2],
  [1, 3],
  [2, 2],
  [4, 4],
];

/** 접두 최솟값 표가 틀리는 첫 질의와 두 답. */
function prefixCounter(): { q: string; want: number; got: number } {
  const pm = prefixMins(WALK);
  for (const [l, r] of PREFIX_PROBES) {
    const want =
      segmentTreeRangeMin([...WALK], [{ type: "query", l, r }])[0] ?? INF;
    const got = pm[r] ?? INF;
    if (want !== got) return { q: range(l, r), want, got };
  }
  throw new Error("접두 최솟값 표가 모든 질의에서 맞았다 — 반례가 없다");
}

/** 시도 사다리(`origin-approaches`)가 쓰는 수. 전부 위의 실행과 식에서 온다. */
export function ladderNumbers() {
  const [scan, sp, blk, seg] = SCALE as [
    ScaleRow,
    ScaleRow,
    ScaleRow,
    ScaleRow,
  ];
  const b1 = blockTable(BIG_A, BIG_OPS, 1);
  const b32 = blockTable(BIG_A, BIG_OPS, 32);
  const mid = SCALE_N >> 1;
  return {
    N: SCALE_N,
    Q: SCALE_Q,
    scan: total(scan),
    sparse: total(sp),
    sparseCells: sp.cells,
    sparseCover: sparseCoverOf(SCALE_N, mid),
    block: total(blk),
    blockName: blk.name,
    blockCells: blk.cells,
    seg: total(seg),
    segCells: seg.cells,
    prefix: prefixCounter(),
    b1: { query: b1.queryAcc, update: b1.updateAcc },
    b32: { query: b32.queryAcc, update: b32.updateAcc },
  };
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  segmentTreeRangeMin(A: number[], ops: SegOp[]): number[];
}

const REF = new URL("./segmentTreeRangeMin-guide.ref.ts", import.meta.url)
  .pathname;

/** 통째로 들어가는지 재는 조건을 뒤집은 사본. 부등호의 방향만 다르다. */
const containFlipped = await loadMutant<Impl>(REF, {
  swap: [/l <= s && e <= r/, "s <= l && r <= e"],
});

/** 질의 구간의 오른쪽 끝을 하나 빼고 부르는 사본. 반개구간으로 읽은 것이다. */
const halfOpen = await loadMutant<Impl>(REF, {
  swap: [
    /query\(1, 0, N - 1, op\.l, op\.r\)/,
    "query(1, 0, N - 1, op.l, op.r - 1)",
  ],
});

/** 갱신의 상향 재계산 한 줄을 지운 사본. 불변식을 지키던 그 줄이다. */
const noPullUp = await loadMutant<Impl>(REF, { drop: /\/\/ ⑤/ });

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 함수가
 * **같은 객체**다. 그 상태에서 「변이가 답을 안 바꿨다」로 던지면 중화 대조가 실행되지 않는다.
 */
const 중화됨 = noPullUp.segmentTreeRangeMin === segmentTreeRangeMin;

/** 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. 중화 실행에서는 건너뛴다. */
function assertBreaks(rows: { bare: string; mutated: string }[]): void {
  if (중화됨) return;
  if (rows.every((r) => r.bare === r.mutated)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 정본과 변이를 같은 연산 목록에 걸고 답을 나란히 적는다. */
function compareRows(
  A: number[],
  ops: SegOp[],
  mutated: Impl,
): { name: string; bare: string; mutated: string }[] {
  const a = segmentTreeRangeMin([...A], ops);
  const b = mutated.segmentTreeRangeMin([...A], ops);
  return queryNames(ops).map((name, i) => ({
    name,
    bare: cell(a[i]),
    mutated: cell(b[i]),
  }));
}

/** 변이 표 한 벌 — 줄마다 「같다 / 어긋난다」를 적는다(`check-proof` 가 그 판정을 중화 대조와 맞댄다). */
function mutantTable(
  rows: { name: string; bare: string; mutated: string }[],
  label: string,
): string {
  return md(
    ["질의", "바른 코드", label, "판정"],
    rows.map((r) => [
      r.name,
      r.bare,
      r.mutated,
      r.bare === r.mutated ? "같다" : "어긋난다",
    ]),
    ["l", "r", "r", "l"],
  );
}

export const VERDICT_NAME: Record<Verdict, string> = {
  disjoint: "겹치지 않는다",
  inside: "통째로 들어간다",
  split: "걸쳐 있다",
};

export const MARK: Record<Verdict, string> = {
  disjoint: "①",
  inside: "②",
  split: "③",
};

/** 걸음 하나를 이벤트 종류로 좁힌다 — 표를 만드는 자리에서 쓴다. */
type Of<K extends TraceEvent["kind"]> = Extract<TraceEvent, { kind: K }>;

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 같은 질의를 세그먼트 트리와 Sparse Table 이 몇 조각으로 덮는가. */
  "concept-compare": () => {
    const st = sparseLevels(WALK);
    const shape = new Map(treeShape(WALK).map((x) => [x.node, x]));
    const probes: [number, number][] = [
      [0, 4],
      [0, 2],
      [1, 3],
      [3, 4],
    ];
    const rows = probes.map(([l, r]) => {
      const p = queryPath(WALK, l, r);
      const k = 31 - Math.clz32(r - l + 1);
      const w = 2 ** k;
      const overlap = l + w - (r - w + 1);
      const lv = st[k] as number[];
      const sAns = Math.min(lv[l] ?? INF, lv[r - w + 1] ?? INF);
      if (sAns !== p.answer) throw new Error("Sparse Table 답이 정본과 다르다");
      return [
        range(l, r),
        p.read
          .map((n) => {
            const x = shape.get(n) as NodeInfo;
            return range(x.s, x.e);
          })
          .join(" "),
        String(p.read.length),
        `${range(l, l + w - 1)} ${range(r - w + 1, r)}`,
        String(overlap),
        cell(p.answer),
      ];
    });
    return md(
      [
        "질의",
        "세그먼트 트리의 조각",
        "조각 수",
        "Sparse Table 의 조각",
        "겹친 칸",
        "답",
      ],
      rows,
      ["l", "l", "r", "l", "r", "r"],
    );
  },

  /** `concept` — 원소 하나를 고치면 두 구조에서 바뀌는 칸이 몇 개인가. */
  "concept-update": () => {
    const i = 3;
    const v = 10;
    const after = WALK.slice();
    after[i] = v;
    const t0 = treeShape(WALK);
    const t1 = treeShape(after);
    const changed = t0.filter((x, k) => x.value !== t1[k]?.value);
    const s0 = sparseLevels(WALK).flat();
    const s1 = sparseLevels(after).flat();
    const changedCells = s0.filter((x, k) => x !== s1[k]).length;
    const onPath = t0.filter((x) => x.s <= i && i <= x.e);
    return withNote(
      md(
        ["구조", "칸 수", `인덱스 ${i}${을를(i)} 덮는 칸`, "값이 바뀐 칸"],
        [
          [
            "세그먼트 트리",
            String(t0.length),
            String(onPath.length),
            String(changed.length),
          ],
          [
            "Sparse Table",
            String(s0.length),
            String(sparseCoverOf(WALK.length, i)),
            String(changedCells),
          ],
        ],
        ["l", "r", "r", "r"],
      ),
      `A[${i}]${을를(i)} ${WALK[i]} 에서 ${v}${으로(v)} 고쳤습니다. 세그먼트 트리에서 값이 바뀐 노드는 ${changed.map((x) => `노드${x.node}`).join(" · ")} 입니다.`,
    );
  },

  /** `prereq` — 이 글이 다루는 물음과 Sparse Table 이 다루는 물음. */
  "prereq-scope": () => {
    const q1 = segmentTreeRangeMin(
      [...WALK],
      [{ type: "query", l: 0, r: 2 }],
    )[0];
    const q2 = segmentTreeRangeMin(
      [...WALK],
      [
        { type: "update", i: 3, v: 10 },
        { type: "query", l: 0, r: 4 },
      ],
    )[0];
    return md(
      ["물음", "답", "세그먼트 트리", "Sparse Table"],
      [
        ["구간 [0,2] 의 최솟값", cell(q1), "답한다", "답한다"],
        [
          "A[3] 을 10 으로 고친 뒤 [0,4] 의 최솟값",
          cell(q2),
          "답한다",
          "층을 다시 계산해야 답한다",
        ],
      ],
      ["l", "r", "l", "l"],
    );
  },

  /** `deep.origin` ② — 차례로 읽으면 과제 규모에서 몇 번을 읽는가. */
  "cost-scan": () => {
    const formulaOf = (n: number): number => (n / 2) * (n - 2) + n / 2;
    const rows = [1_000, 10_000].map((n) => {
      const { A, ops } = scaleInput(n, n);
      const r = scanEachQuery(A, ops);
      if (r.reads + r.writes !== formulaOf(n)) {
        throw new Error("식이 실행과 다르다");
      }
      return [
        num(n),
        num(r.reads + r.writes),
        num(formulaOf(n)),
        seconds(formulaOf(n)),
      ];
    });
    rows.push([
      num(SCALE_N),
      "(실행하지 않음)",
      num(formulaOf(SCALE_N)),
      seconds(formulaOf(SCALE_N)),
    ]);
    return md(
      ["N = Q", "칸 접근(실측)", "(Q/2)(N−2) + Q/2", "초당 1 억 번 기준"],
      rows,
      ["r", "r", "r", "r"],
    );
  },

  /** `deep.origin` ③ — 접두 최솟값 표로 답해 보면 어느 질의가 맞고 어느 질의가 틀리는가. */
  "prefix-min-fails": () => {
    const pm = prefixMins(WALK);
    const rows = PREFIX_PROBES.map(([l, r]) => {
      const bare = segmentTreeRangeMin([...WALK], [{ type: "query", l, r }])[0];
      const guess = pm[r];
      return [
        range(l, r),
        cell(bare),
        `m[${r}] = ${cell(guess)}`,
        bare === guess ? "같다" : "다르다",
      ];
    });
    return withNote(
      md(["질의", "정본의 답", "접두 최솟값 표의 답", "판정"], rows, [
        "l",
        "r",
        "l",
        "l",
      ]),
      `배열 ${show(WALK)} 의 접두 최솟값 표는 m = ${show(pm)} 입니다.`,
    );
  },

  /** `deep.origin` ③ — Sparse Table 에서 원소 하나를 덮는 칸이 규모에 따라 몇 개인가. */
  "origin-sparse-update": () => {
    const rows = [5, 1_000, SCALE_N].map((N) => {
      const i = N >> 1;
      return [
        num(N),
        num(i),
        num(sparseCells(N)),
        num(sparseCoverOf(N, i)),
        String(pathLen(N, i)),
      ];
    });
    return withNote(
      md(
        [
          "N",
          "고치는 자리 i",
          "Sparse Table 칸 수",
          "i 를 덮는 칸",
          "세그먼트 트리에서 i 를 품는 노드",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "고치는 자리는 가운데 인덱스 ⌊N/2⌋ 입니다.",
    );
  },

  /** `deep.origin` ④ — 묶음이 없을 때와 한 층 묶었을 때의 실제 계수. */
  "cost-two-ways": () => {
    const b1 = blockTable(BIG_A, BIG_OPS, 1);
    const b32 = blockTable(BIG_A, BIG_OPS, 32);
    const want = segmentTreeRangeMin([...BIG_A], BIG_OPS);
    if (
      JSON.stringify(b1.out) !== JSON.stringify(want) ||
      JSON.stringify(b32.out) !== JSON.stringify(want)
    ) {
      throw new Error("묶음 판이 정본과 다르다 — 대조가 성립하지 않는다");
    }
    const row = (name: string, r: Cost) => [
      name,
      num(r.build),
      num(r.queryAcc),
      num(r.updateAcc),
      num(r.build + r.queryAcc + r.updateAcc),
      num(r.cells),
    ];
    return withNote(
      md(
        ["묶음 크기", "미리 만들기", "질의", "갱신", "합", "추가 칸"],
        [row("B=1", b1), row("B=32", b32)],
        ["l", "r", "r", "r", "r", "r"],
      ),
      `두 묶음 크기의 답은 정본과 같습니다. 질의는 ${num(b1.queryAcc)} 에서 ${num(b32.queryAcc)}${으로(num(b32.queryAcc))} 줄고, 갱신은 ${num(b1.updateAcc)} 에서 ${num(b32.updateAcc)}${으로(num(b32.updateAcc))} 늘었습니다.`,
    );
  },

  /** `deep.origin` ⑤ — 과제 규모에서 방법 넷의 칸 접근 수. */
  "origin-scale": () => {
    const rows = SCALE.map((r) => [
      r.name,
      num(r.build),
      num(r.query),
      num(r.update),
      num(total(r)),
      seconds(total(r)),
      r.how,
    ]);
    return withNote(
      md(
        [
          "방법",
          "미리 만들기",
          "질의",
          "갱신",
          "합",
          "초당 1 억 번 기준",
          "센 방법",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "l"],
      ),
      `N = Q = ${num(SCALE_N)} 이고 갱신과 질의가 ${num(SCALE_Q / 2)} 개씩입니다. 「식」 줄은 같은 식이 N = Q = 1,000 에서 실행한 값과 같은 것을 확인하고 식으로 셌습니다.`,
    );
  },

  /** `deep.build` (c) — 노드 번호 하나에서 담당 구간과 값까지 따라간다. */
  "node-read": () => {
    const target = 5;
    const shape = new Map(treeShape(WALK).map((x) => [x.node, x]));
    const path: number[] = [];
    for (let n = target; n >= 1; n = Math.floor(n / 2)) path.unshift(n);
    const rows = path.map((n, k) => {
      const x = shape.get(n) as NodeInfo;
      const next = path[k + 1];
      const mid = (x.s + x.e) >> 1;
      let go: string;
      if (next === undefined) {
        go = `s = e 라 리프, 값은 A[${x.s}] = ${cell(x.value)}`;
      } else if (next === 2 * n) {
        go = `mid = ${mid}, 왼쪽 자식 2·${n} = ${next} 가 ${range(x.s, mid)} 를 맡는다`;
      } else {
        go = `mid = ${mid}, 오른쪽 자식 2·${n}+1 = ${next} 가 ${range(mid + 1, x.e)} 를 맡는다`;
      }
      return [`노드${n}`, range(x.s, x.e), go];
    });
    return md(["노드", "담당 구간", "다음"], rows, ["l", "l", "l"]);
  },

  /** `deep.build` (d) — 같은 깊이의 노드는 겹치지 않고, 부모는 자식 둘의 구간을 합친 것이다. */
  "node-depths": () => {
    const shape = treeShape(WALK);
    const maxD = Math.max(...shape.map((x) => x.depth));
    const rows: string[][] = [];
    for (let d = 0; d <= maxD; d++) {
      const at = shape.filter((x) => x.depth === d);
      const idx = at.flatMap((x) =>
        Array.from({ length: x.e - x.s + 1 }, (_, t) => x.s + t),
      );
      rows.push([
        `깊이 ${d}`,
        at.map((x) => `노드${x.node} ${range(x.s, x.e)}`).join(" · "),
        String(idx.length),
        String(idx.length - new Set(idx).size),
      ]);
    }
    const byNode = new Map(shape.map((x) => [x.node, x]));
    const parents = shape.filter((x) => x.s !== x.e);
    const glued = parents.filter((p) => {
      const a = byNode.get(2 * p.node) as NodeInfo;
      const b = byNode.get(2 * p.node + 1) as NodeInfo;
      return a.s === p.s && a.e + 1 === b.s && b.e === p.e;
    }).length;
    return withNote(
      md(
        ["깊이", "노드와 담당 구간", "맡은 인덱스 수", "두 번 맡은 인덱스"],
        rows,
        ["l", "l", "r", "r"],
      ),
      `자식이 있는 노드 ${parents.length} 개 가운데 ${glued} 개에서, 왼쪽 자식의 구간 바로 뒤에 오른쪽 자식의 구간이 이어지고 둘을 합치면 부모의 구간입니다.`,
    );
  },

  /** `deep.build` (e) — Sparse Table 의 층과 세그먼트 트리의 노드를 같은 배열 크기에서 센다. */
  "node-vs-layers": () => {
    const rows = [5, 1_000].map((N) => {
      const ex = extremeQuery(N);
      return [
        num(N),
        num(2 * N - 1),
        num(sparseCells(N)),
        String(pathLen(N, N >> 1)),
        num(sparseCoverOf(N, N >> 1)),
        String(ex.maxRead),
      ];
    });
    return withNote(
      md(
        [
          "N",
          "세그먼트 트리 노드",
          "Sparse Table 칸",
          "가운데 원소를 품는 노드",
          "가운데 원소를 덮는 칸",
          "질의 하나가 읽는 노드(최대)",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "가운데 원소는 인덱스 ⌊N/2⌋ 이고, 「최대」는 모든 (l, r) 짝을 다 넣어 잰 값입니다. Sparse Table 이 질의 하나에 읽는 칸은 늘 2 개입니다.",
    );
  },

  /** `deep.build` 1단계 — 정의를 실제 입력의 노드 아홉에 적용한 결과. */
  "tree-build": () => {
    const shape = treeShape(WALK);
    return md(
      ["노드", "담당 구간", "깊이", "자식", "값"],
      shape.map((x) => [
        `노드${x.node}`,
        range(x.s, x.e),
        String(x.depth),
        x.s === x.e
          ? "없음 (리프)"
          : `노드${2 * x.node} · 노드${2 * x.node + 1}`,
        cell(x.value),
      ]),
      ["l", "l", "r", "l", "r"],
    );
  },

  /** `deep.build` 2단계 — 값을 채우는 차례. 재귀가 돌아오는 순서다. */
  "build-order": () => {
    const rows = WALK_TRACE.steps
      .filter((s) => s.event.kind === "build")
      .map((s, k) => {
        const e = s.event as Of<"build">;
        return [
          String(k + 1),
          `노드${e.node} ${range(e.s, e.e)}`,
          e.leaf
            ? `A[${e.s}] = ${cell(e.value)}`
            : `min(노드${2 * e.node}, 노드${2 * e.node + 1}) = min(${cell(e.left)}, ${cell(e.right)})`,
          cell(e.value),
        ];
      });
    return md(["차례", "채우는 노드", "읽은 값", "쓴 값"], rows, [
      "r",
      "l",
      "l",
      "r",
    ]);
  },

  /** `deep.build` 3단계 — 질의가 노드에 맞을 때와 안 맞을 때 무엇이 달라지는가. */
  "range-split": () => {
    const probes: [number, number][] = [
      [0, 4],
      [0, 2],
      [1, 3],
    ];
    const shape = new Map(treeShape(WALK).map((x) => [x.node, x]));
    const rows = probes.map(([l, r]) => {
      const p = queryPath(WALK, l, r);
      return [
        range(l, r),
        String(p.entered),
        String(p.read.length),
        p.read
          .map((n) => {
            const x = shape.get(n) as NodeInfo;
            return `노드${n} ${range(x.s, x.e)}`;
          })
          .join(" · "),
        cell(p.answer),
      ];
    });
    return md(["질의", "방문 노드", "읽은 노드", "읽은 자리", "답"], rows, [
      "l",
      "r",
      "r",
      "l",
      "r",
    ]);
  },

  /** `deep.build` 3단계 — 질의 [1,3] 이 방문 노드마다의 판정. */
  "split-13": () => {
    const p = queryPath(WALK, 1, 3);
    const shape = new Map(treeShape(WALK).map((x) => [x.node, x]));
    const rows = p.visits.map((v, k) => {
      const val = cell(shape.get(v.node)?.value);
      const act =
        v.verdict === "inside"
          ? `${val}${을를(val)} 돌려준다`
          : v.verdict === "disjoint"
            ? "INF 를 돌려준다"
            : "자식 둘에게 묻는다";
      return [
        String(k + 1),
        `노드${v.node} ${range(v.s, v.e)}`,
        `${VERDICT_NAME[v.verdict]} ${MARK[v.verdict]}`,
        act,
      ];
    });
    return withNote(
      md(["차례", "노드", "판정", "하는 일"], rows, ["r", "l", "l", "l"]),
      `노드 ${p.entered} 개에 들어갔고 그중 ${p.read.length} 개를 읽었습니다. 답은 ${cell(p.answer)} 입니다.`,
    );
  },

  /** `deep.build` 5단계 — 갱신 하나가 지나가는 줄기. */
  "update-path": () => {
    const rows = WALK_TRACE.steps.flatMap((s) => {
      const e = s.event;
      if (e.kind === "leaf") {
        return [
          [
            `노드${e.node} ${range(e.s, e.s)}`,
            cell(e.old),
            "새 값을 그대로 쓴다",
            cell(e.v),
          ],
        ];
      }
      if (e.kind === "pull") {
        return [
          [
            `노드${e.node} ${range(e.s, e.e)}`,
            cell(e.old),
            `min(노드${2 * e.node}, 노드${2 * e.node + 1}) = min(${cell(e.left)}, ${cell(e.right)})`,
            cell(e.value),
          ],
        ];
      }
      return [];
    });
    return md(["노드", "옛 값", "다시 계산", "새 값"], rows, [
      "l",
      "r",
      "l",
      "r",
    ]);
  },

  /** `deep.build` 5단계 — 값이 커지는 갱신에서 형제를 안 보면 무엇이 틀리는가. */
  "update-grow": () => {
    // 조상의 옛 값과 새 값만 비교하는 판 — 형제를 다시 읽지 않는다. 정본과 견줄 대상으로만 쓴다.
    const shortcut = (A: number[], ops: SegOp[]): number[] => {
      const N = A.length;
      const tree = new Array<number>(4 * N).fill(INF);
      const b = (n: number, s: number, e: number): void => {
        if (s === e) {
          tree[n] = A[s] ?? INF;
          return;
        }
        const m = (s + e) >> 1;
        b(2 * n, s, m);
        b(2 * n + 1, m + 1, e);
        tree[n] = Math.min(tree[2 * n] ?? INF, tree[2 * n + 1] ?? INF);
      };
      const u = (n: number, s: number, e: number, i: number, v: number) => {
        if (s === e) {
          tree[n] = v;
          return;
        }
        const m = (s + e) >> 1;
        if (i <= m) u(2 * n, s, m, i, v);
        else u(2 * n + 1, m + 1, e, i, v);
        tree[n] = Math.min(tree[n] ?? INF, v);
      };
      const q = (
        n: number,
        s: number,
        e: number,
        l: number,
        r: number,
      ): number => {
        if (r < s || e < l) return INF;
        if (l <= s && e <= r) return tree[n] ?? INF;
        const m = (s + e) >> 1;
        return Math.min(q(2 * n, s, m, l, r), q(2 * n + 1, m + 1, e, l, r));
      };
      b(1, 0, N - 1);
      const out: number[] = [];
      for (const op of ops) {
        if (op.type === "update") u(1, 0, N - 1, op.i, op.v);
        else out.push(q(1, 0, N - 1, op.l, op.r));
      }
      return out;
    };
    const cases: [string, number][] = [
      ["작아진다", 0],
      ["커진다", 10],
    ];
    const rows = cases.map(([name, v]) => {
      const ops: SegOp[] = [
        { type: "update", i: 3, v },
        { type: "query", l: 0, r: 4 },
      ];
      const a = segmentTreeRangeMin([...WALK], ops)[0];
      const b = shortcut([...WALK], ops)[0];
      return [
        `A[3] 을 ${WALK[3]} 에서 ${v}${으로(v)} — ${name}`,
        cell(a),
        cell(b),
        a === b ? "같다" : "다르다",
      ];
    });
    return withNote(
      md(
        [
          "갱신 뒤 질의 [0,4]",
          "형제까지 다시 읽는 정본",
          "옛 값과 새 값만 비교한 판",
          "판정",
        ],
        rows,
        ["l", "r", "r", "l"],
      ),
      "옛 값과 새 값만 비교한 판은 조상마다 min(옛 값, 새 값) 을 적습니다.",
    );
  },

  /** `deep.build` 설계 선택 — 묶음 크기를 여러 값으로 두고 잰 총 접근 수. */
  "cost-block": () => {
    const blocks = BLOCK_SIZES.map((B) => ({
      B,
      r: blockTable(BIG_A, BIG_OPS, B),
    }));
    const rows = blocks.map(({ B, r }) => [
      `한 층 묶음 B=${B}`,
      num(r.build),
      num(r.queryAcc),
      num(r.updateAcc),
      num(r.build + r.queryAcc + r.updateAcc),
      num(r.cells),
    ]);
    const t = segCount(BIG_A, BIG_OPS);
    const tSum = t.build + t.queryAcc + t.updateAcc;
    rows.push([
      "세그먼트 트리",
      num(t.build),
      num(t.queryAcc),
      num(t.updateAcc),
      num(tSum),
      num(t.cells),
    ]);
    const sum = (r: Cost) => r.build + r.queryAcc + r.updateAcc;
    const best = blocks.reduce((a, b) => (sum(b.r) < sum(a.r) ? b : a));
    return withNote(
      md(["방법", "미리 만들기", "질의", "갱신", "합", "추가 칸"], rows, [
        "l",
        "r",
        "r",
        "r",
        "r",
        "r",
      ]),
      `한 층 묶음은 B=${best.B} 에서 합이 ${num(sum(best.r))}${으로(num(sum(best.r)))} 가장 적고, 세그먼트 트리는 ${num(tSum)} 입니다.`,
    );
  },

  /** `deep.walk` 도입 — 끝까지 쓸 고정 입력. */
  "walk-input": () => {
    const out = segmentTreeRangeMin([...WALK], WALK_OPS);
    return [
      `const A = [${WALK.join(", ")}];`,
      "const ops: SegOp[] = [",
      ...WALK_OPS.map((op) =>
        op.type === "query"
          ? `  { type: "query", l: ${op.l}, r: ${op.r} },`
          : `  { type: "update", i: ${op.i}, v: ${op.v} },`,
      ),
      "];",
      `// 이 절이 끝나면 [${out.join(", ")}]${이가(out.at(-1) ?? 0)} 나와야 한다`,
    ].join("\n");
  },

  /** `deep.walk` 1 — 뿌리 번호를 0 과 1 로 두었을 때의 자식 번호. */
  "walk-root": () => {
    const rows = [0, 1].map((root) => {
      const kids = [2 * root, 2 * root + 1];
      return [
        String(root),
        `${kids[0]} · ${kids[1]}`,
        kids.includes(root)
          ? "왼쪽 자식이 자기 자신이다"
          : "번호가 겹치는 자리가 없다",
      ];
    });
    return md(["뿌리 번호", "자식 번호 2·node · 2·node+1", "결과"], rows, [
      "r",
      "l",
      "l",
    ]);
  },

  /** `deep.walk` 3 — 질의 [0,2] 에 질의 조각만 실행한 결과. */
  "walk-query-02": () => {
    const op = WALK_OPS.findIndex(
      (o) => o.type === "query" && o.l === 0 && o.r === 2,
    );
    const rows = WALK_TRACE.steps.flatMap((s, k) => {
      const e = s.event;
      if (e.kind === "visit" && e.op === op) {
        return [
          [
            stepOf(k),
            `노드${e.node} ${range(e.s, e.e)}`,
            `${VERDICT_NAME[e.verdict]} ${MARK[e.verdict]}`,
            e.verdict === "split" ? "자식 둘에게 묻는다" : cell(e.value),
          ],
        ];
      }
      if (e.kind === "combine" && e.op === op) {
        return [
          [
            stepOf(k),
            `노드${e.node} ${range(e.s, e.e)}`,
            "두 답을 합친다 ③",
            `min(${cell(e.left)}, ${cell(e.right)}) = ${cell(e.value)}`,
          ],
        ];
      }
      return [];
    });
    return md(["걸음", "노드", "판정", "돌려준 값"], rows, [
      "l",
      "l",
      "l",
      "l",
    ]);
  },

  /** `deep.walk.pause` — 통째로 들어가는지 재는 조건을 뒤집으면 어느 질의가 살아남는가. */
  "pause-contain-flip": () => {
    const rows = compareRows(WALK, WALK_OPS, containFlipped);
    assertBreaks(rows);
    return mutantTable(rows, "조건을 뒤집은 코드");
  },

  /** `deep.walk.pause` — 뿌리에서 두 조건을 실제 값으로 판정한다. */
  "pause-contain-cond": () => {
    const probes: [number, number][] = [
      [0, 4],
      [0, 2],
    ];
    const s = 0;
    const e = WALK.length - 1;
    const rows = probes.flatMap(([l, r]) => [
      [
        range(l, r),
        "l <= s && e <= r",
        `${l} <= ${s} && ${e} <= ${r}`,
        l <= s && e <= r ? "참" : "거짓",
      ],
      [
        range(l, r),
        "s <= l && r <= e",
        `${s} <= ${l} && ${r} <= ${e}`,
        s <= l && r <= e ? "참" : "거짓",
      ],
    ]);
    return md(["질의", "조건", `뿌리 ${range(s, e)} 에서`, "결과"], rows, [
      "l",
      "l",
      "l",
      "l",
    ]);
  },

  /** `deep.walk` 4 — 갱신 조각만 실행한 결과. */
  "walk-update": () => {
    const op = WALK_OPS.findIndex((o) => o.type === "update");
    const u = WALK_OPS[op] as { type: "update"; i: number; v: number };
    const down = treeShape(WALK)
      .filter((x) => x.s <= u.i && u.i <= x.e && x.s !== x.e)
      .map((x) => {
        const mid = (x.s + x.e) >> 1;
        return [
          "내려가는 길",
          `노드${x.node} ${range(x.s, x.e)}`,
          `mid = ${mid}, i = ${u.i} ${u.i <= mid ? "<=" : ">"} ${mid}`,
          u.i <= mid ? "왼쪽 자식으로" : "오른쪽 자식으로",
        ];
      });
    const up = WALK_TRACE.steps.flatMap((s, k) => {
      const e = s.event;
      if (e.kind === "leaf" && e.op === op) {
        return [
          [
            stepOf(k),
            `노드${e.node} ${range(e.s, e.s)}`,
            "s = e 라 리프 ④",
            `tree[${e.node}] = ${cell(e.v)}, 옛 값 ${cell(e.old)}`,
          ],
        ];
      }
      if (e.kind === "pull" && e.op === op) {
        return [
          [
            stepOf(k),
            `노드${e.node} ${range(e.s, e.e)}`,
            "상향 재계산 ⑤",
            `min(${cell(e.left)}, ${cell(e.right)}) = ${cell(e.value)}, 옛 값 ${cell(e.old)}`,
          ],
        ];
      }
      return [];
    });
    return md(
      ["걸음", "노드", "판정", "하는 일"],
      [...down, ...up],
      ["l", "l", "l", "l"],
    );
  },

  /** `deep.walk` 5 — 연산 다섯의 걸음마다 조건을 실제 값으로 판정한다. */
  "walk-trace": () => {
    const rows = WALK_TRACE.steps.flatMap((s, k) => {
      const e = s.event;
      if (e.kind === "build") return [];
      const op = opName(WALK_OPS[e.op] as SegOp);
      const at = (s: number, en: number) => `노드${e.node} ${range(s, en)}`;
      if (e.kind === "visit") {
        // 표 칸 안이라 `||` 대신 「또는」으로 적는다 — 세로줄이 표의 칸 경계가 된다.
        const gap = `${e.r} < ${e.s} 또는 ${e.e} < ${e.l}`;
        const inside = `${e.l} <= ${e.s} 그리고 ${e.e} <= ${e.r}`;
        const cond =
          e.verdict === "disjoint"
            ? `${gap} 참`
            : e.verdict === "inside"
              ? `${gap} 거짓, ${inside} 참`
              : `${gap} 거짓, ${inside} 거짓`;
        return [
          [
            stepOf(k),
            op,
            at(e.s, e.e),
            cond,
            e.verdict === "split" ? "자식 둘에게" : cell(e.value),
            MARK[e.verdict],
          ],
        ];
      }
      if (e.kind === "combine") {
        return [
          [
            stepOf(k),
            op,
            at(e.s, e.e),
            "자식 둘이 답했다",
            `min(${cell(e.left)}, ${cell(e.right)}) = ${cell(e.value)}`,
            "③",
          ],
        ];
      }
      if (e.kind === "leaf") {
        return [
          [
            stepOf(k),
            op,
            at(e.s, e.s),
            `${e.s} = ${e.s} 참`,
            `tree[${e.node}] = ${cell(e.v)}`,
            "④",
          ],
        ];
      }
      return [
        [
          stepOf(k),
          op,
          at(e.s, e.e),
          `${e.s} = ${e.e} 거짓`,
          `min(${cell(e.left)}, ${cell(e.right)}) = ${cell(e.value)}`,
          "⑤",
        ],
      ];
    });
    return md(["걸음", "연산", "노드", "조건 판정", "결과", "분기"], rows, [
      "l",
      "l",
      "l",
      "l",
      "l",
      "l",
    ]);
  },

  /** `deep.walk` 5 — 분기마다 실행된 걸음. */
  "walk-branches": () => {
    const groups: [string, string, (e: TraceEvent) => boolean][] = [
      [
        "①",
        "겹치지 않는다",
        (e) => e.kind === "visit" && e.verdict === "disjoint",
      ],
      [
        "②",
        "통째로 들어간다",
        (e) => e.kind === "visit" && e.verdict === "inside",
      ],
      [
        "③",
        "걸쳐 있다 · 두 답을 합친다",
        (e) =>
          (e.kind === "visit" && e.verdict === "split") || e.kind === "combine",
      ],
      ["④", "리프에 새 값을 쓴다", (e) => e.kind === "leaf"],
      ["⑤", "상향 재계산", (e) => e.kind === "pull"],
    ];
    const rows = groups.map(([m, name, pred]) => {
      const ids = stepsWhere(pred);
      return [m, name, ids.join(" "), String(ids.length)];
    });
    return withNote(
      md(["분기", "하는 일", "걸음", "횟수"], rows, ["l", "l", "l", "r"]),
      `반환값은 결과 목록의 마지막 상태인 ${show(WALK_TRACE.out)} 입니다.`,
    );
  },

  /** `deep.walk.pause` — 오른쪽 끝을 하나 빼면 어느 질의가 살아남는가. */
  "pause-half-open": () => {
    const rows = compareRows(WALK, WALK_OPS, halfOpen);
    const single: SegOp[] = [{ type: "query", l: 2, r: 2 }];
    const singleRow = compareRows(WALK, single, halfOpen)[0];
    if (singleRow !== undefined) rows.push(singleRow);
    assertBreaks(rows);
    return mutantTable(rows, "오른쪽 끝을 뺀 코드");
  },

  /** `deep.walk.final` — 전체 코드를 경계 입력에 부른 결과. */
  "final-calls": () => {
    const calls: [string, number[], SegOp[]][] = [
      ["segmentTreeRangeMin([5, 2, 4, 1, 3], 위 다섯 연산)", WALK, WALK_OPS],
      ["segmentTreeRangeMin([1, 2, 3], [])", [1, 2, 3], []],
      [
        "segmentTreeRangeMin([5], 질의 [0,0] · 갱신 i=0 v=99 · 질의 [0,0])",
        [5],
        [
          { type: "query", l: 0, r: 0 },
          { type: "update", i: 0, v: 99 },
          { type: "query", l: 0, r: 0 },
        ],
      ],
    ];
    const width = (s: string): number =>
      [...s].reduce((n, c) => n + (/[가-힯]/.test(c) ? 2 : 1), 0);
    const w = Math.max(...calls.map(([c]) => width(c)));
    return calls
      .map(
        ([c, A, ops]) =>
          `${c}${" ".repeat(w - width(c))}   →  [${segmentTreeRangeMin([...A], ops).join(", ")}]`,
      )
      .join("\n");
  },

  /** `related` — 결합 법칙과 항등원이 이 글의 어느 값에서 쓰였는가. */
  "related-monoid": () => {
    const [a, b, c] = WALK as [number, number, number];
    const leftFirst = Math.min(Math.min(a, b), c);
    const rightFirst = Math.min(a, Math.min(b, c));
    const idRows = WALK_TRACE.steps.flatMap((s, k) => {
      const e = s.event;
      if (e.kind !== "combine") return [];
      return [
        [
          "항등원",
          `${stepOf(k)} 노드${e.node} 에서 두 답을 합친다`,
          `min(${cell(e.left)}, ${cell(e.right)}) = ${cell(e.value)}`,
        ],
      ];
    });
    return md(
      ["성질", "쓰인 자리", "값"],
      [
        [
          "결합 법칙",
          "노드2 = min(노드4, 노드5) 이고 노드4 = min(A[0], A[1])",
          `min(min(${a}, ${b}), ${c}) = ${leftFirst} · min(${a}, min(${b}, ${c})) = ${rightFirst}`,
        ],
        ...idRows,
      ],
      ["l", "l", "l"],
    );
  },

  /** `purpose.fit` — 연산이 몇 개일 때 트리를 만드는 값을 갚는가. */
  "fit-boundary": () => {
    const N = SCALE_N;
    const D = Math.ceil(Math.log2(N));
    const build = 5 * N - 3;
    const { A } = scaleInput(N, 0);
    if (segCount(A, []).build !== build) {
      throw new Error("5N − 3 이 실측과 다르다");
    }
    const perOp = 3 * D + 1;
    return withNote(
      md(
        ["경우", "차례로 읽기", "세그먼트 트리(만들기 + 연산의 상한)"],
        [
          ["질의 1 개, 구간 10 칸", "10", num(build + 2 * D)],
          [
            `연산 ${num(SCALE_Q)} 개`,
            `최악 ${num(SCALE_Q * N)}`,
            num(build + SCALE_Q * perOp),
          ],
        ],
        ["l", "r", "r"],
      ),
      `N = ${num(N)} 에서 트리를 만드는 데 ${num(build)} 번(5N − 3, 실측과 같다)이고, 연산 하나는 최악 ${perOp} 번(3⌈log₂N⌉ + 1)으로 셌습니다.`,
    );
  },

  /** `purpose.alt` — 실측 두 표. 「적은 쪽」 열의 차이와 배수를 `.alt.ts` 계수에서 계산한다(SPEC §14 `L51`). */
  "alt-counts": () => {
    type Role = "gap" | "flip" | "ratio" | "ahead";
    // 한글로 끝나면 조사를 붙여 쓰고(「트리가」), 로마자로 끝나면 띄운다(「Table 이」).
    const subj = (w: string): string =>
      /[가-힣]$/.test(w) ? `${w}${이가(w).trim()}` : `${w}${이가(w)}`;
    const row = (name: string, q: number, u: number, role: Role): string[] => {
      const s = segAccesses(q, u);
      const p = sparseAccesses(q, u);
      const segWins = s < p;
      const [lo, hi] = segWins ? [s, p] : [p, s];
      const who = segWins ? "세그먼트 트리" : "Sparse Table";
      const note =
        role === "gap"
          ? `${subj(who)} ${num(hi - lo)} 번 적습니다`
          : role === "flip"
            ? "**여기서 순서가 뒤집힙니다**"
            : role === "ahead"
              ? `${subj(who)} 앞섭니다`
              : `${subj(who)} ${f1(hi / lo)} 배 적습니다`;
      return [
        name,
        segWins ? `**${num(s)}**` : num(s),
        segWins ? num(p) : `**${num(p)}**`,
        note,
      ];
    };
    const f1 = (x: number): string =>
      x >= 100
        ? num(Math.round(x))
        : x.toLocaleString("en-US", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          });
    const head = (c: string) => [c, "세그먼트 트리", "Sparse Table", "적은 쪽"];
    const L: ("l" | "r")[] = ["l", "l", "l", "l"];
    return [
      md(
        head("갱신 0 회"),
        [
          row("질의 3,515 개", 3_515, 0, "gap"),
          row("질의 3,516 개", 3_516, 0, "flip"),
          row("질의 4,096 개", 4_096, 0, "ratio"),
          row("질의 10,000 개", 10_000, 0, "ratio"),
        ],
        L,
      ),
      "",
      "**갱신이 하나라도 섞이면 순서가 반대로 갑니다.**",
      "",
      md(
        head("질의 4,096 개"),
        [
          row("갱신 0 회", 4_096, 0, "ahead"),
          row("갱신 1 회", 4_096, 1, "flip"),
          row("갱신 1,024 회", 4_096, 1_024, "ratio"),
        ],
        L,
      ),
    ].join("\n");
  },

  /** `purpose.alt` — 순서가 뒤집히는 자리를 비용 항으로 가른다. */
  "alt-boundary": () => {
    const segB = segAccesses(0, 0);
    const spB = sparseAccesses(0, 0);
    const gap = spB - segB;
    // 질의 하나의 평균 — 앞에서부터 q 개를 처리한 평균이라 q 에 따라 조금 다르다.
    const avg = (q: number) => ({
      seg: (segAccesses(q, 0) - segB) / q,
      sp: (sparseAccesses(q, 0) - spB) / q,
    });
    const qs = [3_515, 4_096];
    const [near, far] = qs.map(avg) as [
      { seg: number; sp: number },
      { seg: number; sp: number },
    ];
    // 평균끼리의 차이가 소수 둘째 자리에서 안 갈려서 넷째 자리까지 적는다.
    const f4 = (x: number): string =>
      x.toLocaleString("en-US", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      });
    const q = 4_096;
    const segU = segAccesses(q, 1) - segAccesses(q, 0);
    const spU = sparseAccesses(q, 1) - sparseAccesses(q, 0);
    return withNote(
      md(
        [
          "비용(칸 접근 수)",
          "세그먼트 트리",
          "Sparse Table",
          "Sparse Table − 세그먼트 트리",
        ],
        [
          ["만들기", num(segB), num(spB), num(gap)],
          ...qs.map((n, k) => {
            const a = k === 0 ? near : far;
            return [
              `질의 하나 평균(질의 ${num(n)} 개)`,
              f4(a.seg),
              f4(a.sp),
              f4(a.sp - a.seg),
            ];
          }),
          ["갱신 하나", num(segU), num(spU), num(spU - segU)],
        ],
        ["l", "r", "r", "r"],
      ),
      `Sparse Table 은 만들기에서 ${num(gap)} 번을 더 쓰고 질의 하나에서 평균 ${f4(far.seg - far.sp)} 번(질의 ${num(qs[1] as number)} 개) 또는 ${f4(near.seg - near.sp)} 번(질의 ${num(qs[0] as number)} 개)을 덜 씁니다. 만들기의 차이를 그 둘로 나누면 ${fixed2(gap / (far.seg - far.sp))}${과와(fixed2(gap / (far.seg - far.sp)))} ${fixed2(gap / (near.seg - near.sp))} 입니다.`,
    );
  },

  /** `deep.math` 검산 — 정의를 전개 입력에 넣는다. */
  "math-check": () => {
    const shape = new Map(treeShape(WALK).map((x) => [x.node, x]));
    const rows = [1, 2, 4, 8].map((n) => {
      const x = shape.get(n) as NodeInfo;
      const mid = (x.s + x.e) >> 1;
      return [
        `node = ${n}`,
        range(x.s, x.e),
        x.s === x.e ? "s = e" : `⌊(${x.s}+${x.e})/2⌋ = ${mid}`,
        x.s === x.e
          ? "없음 (리프)"
          : `${range(x.s, mid)} · ${range(mid + 1, x.e)}`,
        x.s === x.e
          ? `A[${x.s}] = ${cell(x.value)}`
          : `min(${WALK.slice(x.s, x.e + 1).join(", ")}) = ${cell(x.value)}`,
      ];
    });
    return md(["노드", "[s, e]", "mid", "자식의 구간", "tree[node]"], rows, [
      "l",
      "l",
      "l",
      "l",
      "l",
    ]);
  },

  /** `deep.math` — 같은 깊이의 노드가 배열을 나누는 모습. */
  "math-depth": () => {
    const shape = treeShape(WALK);
    const maxD = Math.max(...shape.map((x) => x.depth));
    const rows: string[][] = [];
    for (let d = 1; d <= maxD; d++) {
      const at = shape.filter((x) => x.depth === d);
      rows.push([
        `깊이 ${d}`,
        at.map((x) => range(x.s, x.e)).join(" · "),
        at
          .map((x) =>
            Array.from({ length: x.e - x.s + 1 }, (_, t) => x.s + t).join(" "),
          )
          .join(" · "),
      ]);
    }
    return md(["깊이", "노드의 담당 구간", "맡는 인덱스"], rows, [
      "l",
      "l",
      "l",
    ]);
  },

  /** `deep.math` — 진입 노드 수의 상한과 실측의 대조. */
  "visit-bound": () => {
    const rows = [5, 8, 16, 64, 256, 1024].map((N) => {
      const D = Math.ceil(Math.log2(N));
      const x = extremeQuery(N);
      return [
        num(N),
        String(D),
        String(4 * D - 1),
        String(x.maxEntered),
        range(x.at[0], x.at[1]),
        String(2 * D),
        String(x.maxRead),
      ];
    });
    return md(
      [
        "N",
        "D",
        "상한 4D−1",
        "실측 최대 진입",
        "그 짝",
        "상한 2D",
        "실측 최대 읽기",
      ],
      rows,
      ["r", "r", "r", "r", "l", "r", "r"],
    );
  },

  /** `deep.math` 계수 — 과제 규모에서 읽기 상한. */
  "math-scale": () => {
    const N = SCALE_N;
    const D = Math.ceil(Math.log2(N));
    const R = 2 * D;
    return withNote(
      md(
        ["방법", "질의 하나의 읽기", `질의 ${num(SCALE_Q)} 개`],
        [
          ["구간을 직접 읽기(최악)", num(N), num(SCALE_Q * N)],
          ["세그먼트 트리(상한 2D)", String(R), num(SCALE_Q * R)],
        ],
        ["l", "r", "r"],
      ),
      `N = ${num(N)} 이면 D = ${D} 이고, 두 합의 비는 약 ${num(Math.round(N / R))} 배입니다.`,
    );
  },

  /** `deep.math` — 노드 번호가 어디까지 커지는가. */
  "node-index": () => {
    const rows = [5, 6, 10, 16, 100, 1_000, 100_000].map((N) => {
      const D = Math.ceil(Math.log2(N));
      const x = nodeExtent(N);
      return [
        num(N),
        String(D),
        String(x.depth),
        num(x.maxNode),
        num(2 ** (D + 1)),
        num(2 * N),
        num(4 * N),
        x.maxNode < 2 * N ? "충분" : "모자람",
      ];
    });
    let short = 0;
    for (let N = 1; N <= 200; N++) {
      if (nodeExtent(N).maxNode >= 2 * N) short++;
    }
    return withNote(
      md(
        [
          "N",
          "D",
          "실측 최대 깊이",
          "실측 최대 번호",
          "2^(D+1)",
          "2N",
          "4N",
          "2N 칸",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r", "r", "l"],
      ),
      `N 이 1 부터 200 까지인 경우 가운데 2N 칸으로 모자란 것이 ${short} 개입니다.`,
    );
  },

  /** `invariant` ② — 연산이 끝난 시점과 갱신 중간에 불변식을 노드마다 대조한다. */
  "invariant-check": () => {
    const steps = WALK_TRACE.steps;
    const rows = steps.flatMap((s, k) => {
      const e = s.event;
      const next = steps[k + 1]?.event;
      const ends =
        e.kind === "build"
          ? next === undefined || next.kind !== "build"
          : next === undefined || next.kind === "build" || next.op !== e.op;
      if (!ends && e.kind !== "leaf") return [];
      // 그 시점의 배열 — 입력에 그때까지의 갱신을 적용한 것. 값은 정본에 다시 묻는다(`treeShape`).
      const upTo = e.kind === "build" ? -1 : e.op;
      const a = WALK.slice();
      for (const [j, op] of WALK_OPS.entries()) {
        if (j <= upTo && op.type === "update") a[op.i] = op.v;
      }
      const shape = treeShape(a);
      const bad = shape.filter((x) => s.tree[x.node] !== x.value);
      const when =
        e.kind === "build"
          ? "트리를 다 채운 뒤"
          : e.kind === "leaf"
            ? `${opName(WALK_OPS[e.op] as SegOp)} 에서 리프만 쓴 순간`
            : `${opName(WALK_OPS[e.op] as SegOp)}${이가(lastNum(opName(WALK_OPS[e.op] as SegOp)))} 끝난 뒤`;
      return [
        [
          stepOf(k),
          when,
          String(shape.length),
          String(bad.length),
          bad.map((x) => `노드${x.node}`).join(" · ") || "없음",
        ],
      ];
    });
    return md(
      ["걸음", "시점", "확인한 노드", "어긋난 노드", "어긋난 자리"],
      rows,
      ["l", "l", "r", "r", "l"],
    );
  },

  /** `invariant` ② — 경계 입력에서 정본의 답과 정의로 직접 계산한 값. */
  "invariant-edges": () => {
    const cases: [string, number[], SegOp[]][] = [
      ["연산 목록이 빔", [1, 2, 3], []],
      ["갱신만 있음", [1, 2, 3], [{ type: "update", i: 0, v: 999 }]],
      [
        "원소 하나",
        [5],
        [
          { type: "query", l: 0, r: 0 },
          { type: "update", i: 0, v: 99 },
          { type: "query", l: 0, r: 0 },
        ],
      ],
      ["한 칸짜리 질의", [5, 3, 7, 1, 9], [{ type: "query", l: 2, r: 2 }]],
      [
        "음수로 갱신",
        [1, 2, 3],
        [
          { type: "update", i: 1, v: -1000 },
          { type: "query", l: 0, r: 2 },
        ],
      ],
      [
        "전부 같은 값으로 갱신",
        [10, 20, 30],
        [
          { type: "update", i: 0, v: 7 },
          { type: "update", i: 1, v: 7 },
          { type: "update", i: 2, v: 7 },
          { type: "query", l: 0, r: 2 },
        ],
      ],
      [
        "값이 커지는 갱신",
        [5, 3, 7, 1, 9],
        [
          { type: "query", l: 0, r: 4 },
          { type: "update", i: 3, v: 100 },
          { type: "query", l: 0, r: 4 },
        ],
      ],
    ];
    const rows = cases.map(([name, A, ops]) => {
      const got = segmentTreeRangeMin([...A], ops);
      const a = A.slice();
      const want: number[] = [];
      for (const op of ops) {
        if (op.type === "update") a[op.i] = op.v;
        else want.push(Math.min(...a.slice(op.l, op.r + 1)));
      }
      return [
        name,
        show(A),
        ops.map(opName).join(" · ") || "없음",
        show(got),
        JSON.stringify(got) === JSON.stringify(want) ? "같다" : "다르다",
      ];
    });
    return md(["경계", "배열", "연산", "답", "정의로 직접 계산한 값과"], rows, [
      "l",
      "l",
      "l",
      "l",
      "l",
    ]);
  },

  /** `invariant` ③ — 불변식을 지키던 줄을 지우면 무엇이 나오는가. */
  "mutant-no-pullup": () => {
    const rows = compareRows(WALK, WALK_OPS, noPullUp);
    assertBreaks(rows);
    return mutantTable(rows, "상향 재계산을 지운 코드");
  },

  /** `perf.derive` — 전개가 실제로 몇 번 접근했는가. */
  "walk-cost": () => {
    const t = segCount(WALK, WALK_OPS);
    const bare = scanEachQuery(WALK, WALK_OPS);
    const buildIds = stepsWhere((e) => e.kind === "build");
    const qOps = WALK_OPS.flatMap((o, k) => (o.type === "query" ? [k] : []));
    const uOps = WALK_OPS.flatMap((o, k) => (o.type === "update" ? [k] : []));
    return withNote(
      md(
        ["갈래", "걸음", "칸 접근"],
        [
          ["트리를 채운다", span(buildIds), num(t.build)],
          [
            `질의 ${qOps.length} 개`,
            qOps.map((k) => span(stepsOfOp(k))).join(" · "),
            num(t.queryAcc),
          ],
          [
            `갱신 ${uOps.length} 개`,
            uOps.map((k) => span(stepsOfOp(k))).join(" · "),
            num(t.updateAcc),
          ],
          ["합", "", num(t.build + t.queryAcc + t.updateAcc)],
        ],
        ["l", "l", "r"],
      ),
      `같은 연산 목록을 차례로 읽기로 처리하면 ${num(bare.reads + bare.writes)} 번입니다.`,
    );
  },

  /** `perf.derive` — 세 갈래의 식을 전개 입력에 넣은 값과 실측. */
  "perf-formula": () => {
    const N = WALK.length;
    const D = Math.ceil(Math.log2(N));
    const t = segCount(WALK, WALK_OPS);
    const reads = WALK_OPS.flatMap((o) =>
      o.type === "query" ? [queryPath(WALK, o.l, o.r).read.length] : [],
    );
    return md(
      ["갈래", "식", `N = ${N}, D = ${D} 을 넣은 값`, "전개에서 잰 값"],
      [
        [
          "트리 채우기",
          "리프 N 개 × 2 + 내부 N−1 개 × 3 = 5N − 3",
          String(5 * N - 3),
          String(t.build),
        ],
        [
          "질의 하나",
          "읽은 노드 수 ≤ 2D",
          `${2 * D} 이하`,
          `질의 ${reads.length} 개에 ${reads.join(" · ")}`,
        ],
        [
          "갱신 하나",
          "리프 쓰기 1 + 조상 D 개 × 3 = 3D + 1 이하",
          `${3 * D + 1} 이하`,
          String(t.updateAcc),
        ],
      ],
      ["l", "l", "r", "l"],
    );
  },

  /** `perf.bounds` — 질의의 모양만 바꿨을 때 최선과 최악. */
  "perf-best-worst": () => {
    const N = 1024;
    const full = visitCount(N, 0, N - 1);
    const inner = visitCount(N, 1, N - 2);
    return md(
      ["질의", "구간의 칸 수", "읽은 노드"],
      [
        [range(0, N - 1), num(N), String(full.read)],
        [range(1, N - 2), num(N - 2), String(inner.read)],
      ],
      ["l", "r", "r"],
    );
  },

  /** `perf.worst` — 질의의 모양이 비용을 어떻게 바꾸는가. */
  "worst-shape": () => {
    const N = 1024;
    const x = extremeQuery(N);
    const shapes: [string, number, number][] = [
      ["배열 전체", 0, N - 1],
      ["왼쪽 절반", 0, N / 2 - 1],
      ["한 칸", 500, 500],
      ["방문 노드가 최대인 짝", x.at[0], x.at[1]],
      ["읽은 노드가 최대인 짝", x.readAt[0], x.readAt[1]],
    ];
    const rows = shapes.map(([name, l, r]) => {
      const p = visitCount(N, l, r);
      return [
        name,
        range(l, r),
        num(r - l + 1),
        String(p.entered),
        String(p.read),
      ];
    });
    return md(
      ["질의의 모양", "구간", "구간의 칸 수", "방문 노드", "읽은 노드"],
      rows,
      ["l", "l", "r", "r", "r"],
    );
  },

  /** `perf.worst` — 과제 규모에서 최악의 모양으로 채운 작업 목록. */
  "worst-scale": () => {
    const seg = SCALE[3] as ScaleRow;
    const one = visitCount(SCALE_N, 1, SCALE_N - 2);
    return withNote(
      md(
        ["항목", "칸 접근 또는 방문 노드"],
        [
          ["질의 하나가 방문 노드", String(one.entered)],
          ["질의 하나가 읽은 노드", String(one.read)],
          ["미리 만들기", num(seg.build)],
          [`질의 ${num(SCALE_Q / 2)} 개`, num(seg.query)],
          [`갱신 ${num(SCALE_Q / 2)} 개`, num(seg.update)],
          ["합", num(total(seg))],
        ],
        ["l", "r"],
      ),
      `N = Q = ${num(SCALE_N)} 에 질의를 전부 [1, N−2] 로 둔 작업 목록입니다. 합 ${num(total(seg))} 번은 초당 1 억 번 기준으로 ${seconds(total(seg))} 입니다.`,
    );
  },

  /** `selfcheck` — 구간이 짧은 질의가 노드를 더 만진 자리. */
  "check-short": () => {
    const seen = new Set<string>();
    const rows = WALK_OPS.flatMap((o, k) => {
      if (o.type !== "query") return [];
      const key = range(o.l, o.r);
      if (!(key === "[0,4]" || key === "[3,4]") || seen.has(key)) return [];
      seen.add(key);
      const entered = WALK_TRACE.steps.filter(
        (s) => s.event.kind === "visit" && s.event.op === k,
      ).length;
      return [
        [span(stepsOfOp(k)), key, String(o.r - o.l + 1), String(entered)],
      ];
    });
    return md(["걸음", "질의", "구간의 칸 수", "방문 노드"], rows, [
      "l",
      "l",
      "r",
      "r",
    ]);
  },

  /** `selfcheck` 답 — 질의 구간이 어느 노드의 담당 구간과 같은가. */
  "check-match": () => {
    const shape = treeShape(WALK);
    const probes: [number, number][] = [
      [0, 4],
      [0, 2],
      [3, 4],
      [1, 3],
    ];
    const rows = probes.map(([l, r]) => {
      const same = shape.find((x) => x.s === l && x.e === r);
      return [
        range(l, r),
        same ? `노드${same.node}` : "없음",
        same ? String(same.depth) : "—",
        String(queryPath(WALK, l, r).entered),
      ];
    });
    return md(
      ["질의", "담당 구간이 같은 노드", "그 노드의 깊이", "방문 노드"],
      rows,
      ["l", "l", "r", "r"],
    );
  },
};
