/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 잣대**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다
 * 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/graph/bridgesInGraph/bridgesInGraph-guide.alt.ts
 *
 * **잣대 둘의 세는 법을 여기서 못 박는다.**
 *
 * - **배열 칸 접근** — 배열의 한 칸을 읽거나 쓸 때마다 1. `push` 와 `pop` 도 한 칸이다.
 *   두 설계에 같은 규칙을 적용한다.
 * - **저장 칸** — 절차가 잡는 배열 칸의 최대 개수. 정본은 이웃 목록의 행 `2V` 와 그 안의 자리
 *   `4E`, `disc`·`low` `2V`, 호출 스택 셋의 최대 깊이 `3D` 를 더한 값이고, 경쟁 설계는 배열
 *   다섯 개 `5V` 다.
 *
 * **전개 입력을 그대로 쓰지 않은 이유**(L20). 전개 그래프는 정점 여섯 · 간선 여섯이라 간선
 * 수를 바꿀 자리가 없어 저장 칸이 뒤집히는 지점을 만들 수 없다. 전개 입력의 값도 함께 내고
 * (`전개 입력 · …`), 뒤집히는 자리를 보이는 데는 아래 `SWEEP` 을 쓴다. 그 사실은 본문 대조
 * 문단에도 적는다.
 *
 * **입력은 생성식으로 고정한다.** 정점 수를 `SWEEP_V = 1,024` 로 못 박고 간선 수만 늘린다.
 * `i` 번째 간선은 `[i mod 1024, ((i + 1) × 7919) mod 1024]` 이고 7919 는 1024 와 서로소인
 * 소수다. 한 번 정한 입력은 수치가 마음에 안 든다는 이유로 바꾸지 않는다(L20).
 *
 * **경쟁 설계는 매 실행마다 정본과 답을 대조한다.** 답이 다른 구현으로 잰 계수는 저울질이
 * 아니라 다른 문제의 값이다(2026-09-03 `digitDp` 가 세운 규칙).
 */

import { bridgesInGraph } from "./bridgesInGraph-guide.ref.ts";

export type Edge = [number, number];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 그래프. 정점 여섯 · 무향 간선 여섯. */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 1],
  [3, 4],
  [0, 5],
];

/** 간선 수 스윕의 정점 수. */
export const SWEEP_V = 1024;

/** 스윕 입력의 생성식 — `i` 번째 간선은 `[i mod V, ((i + 1) × 7919) mod V]` 다. */
export function sweepEdges(count: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < count; i++) {
    out.push([i % SWEEP_V, ((i + 1) * 7919) % SWEEP_V]);
  }
  return out;
}

/** 사슬 — 정점 `v` 개를 한 줄로 잇는다. 간선 목록은 왼쪽 끝부터 차례로 적는다. */
export function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < v - 1; i++) out.push([i, i + 1]);
  return out;
}

/**
 * 같은 사슬을 **간선 목록의 순서만 섞어** 적은 것. 시드는 `20260907` 로 고정한다.
 *
 * 그래프는 그대로이므로 답도 같다. 갈리는 것은 경쟁 설계가 덩어리를 어떤 차례로 잇는가이고,
 * 그것이 뿌리를 옮기는 비용을 정한다.
 */
export function shuffledChain(v: number): Edge[] {
  const out = chain(v);
  let seed = 20260907 | 0;
  const next = (): number => {
    seed ^= seed << 13;
    seed |= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed |= 0;
    return seed >>> 0;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = next() % (i + 1);
    const keep = out[i] as Edge;
    out[i] = out[j] as Edge;
    out[j] = keep;
  }
  return out;
}

/** 한 변이 `side` 인 격자. 상하·좌우로만 이어진다. */
export function grid(side: number): { n: number; edges: Edge[] } {
  const at = (r: number, c: number): number => r * side + c;
  const edges: Edge[] = [];
  for (let r = 0; r < side; r++) {
    for (let c = 0; c < side; c++) {
      if (r + 1 < side) edges.push([at(r, c), at(r + 1, c)]);
      if (c + 1 < side) edges.push([at(r, c), at(r, c + 1)]);
    }
  }
  return { n: side * side, edges };
}

/* ────────────────────────── 계수 ────────────────────────── */

export interface Count {
  /** 배열 칸 접근 — 읽기와 쓰기를 합쳐 센다. */
  ops: number;
  /** 저장 칸 — 잡는 배열 칸의 최대 개수. */
  cells: number;
  /** 사전순으로 정렬한 다리 목록. */
  answer: Edge[];
}

/**
 * 이 가이드의 절차 — 정본과 같은 절차에 계수만 붙였다.
 *
 * `bridgesInGraph-guide.ref.ts` 를 그대로 부를 수 없는 것은 그 파일에 계수가 없기 때문이고,
 * 그래서 `measure` 가 매 실행마다 정본의 답과 견준다.
 */
export function 이가이드의절차(n: number, edges: Edge[]): Count {
  let ops = 0;
  const to: number[][] = Array.from({ length: n }, () => []);
  const via: number[][] = Array.from({ length: n }, () => []);
  ops += 2 * n;
  for (let e = 0; e < edges.length; e++) {
    const pair = edges[e] as Edge;
    ops += 1;
    const [u, v] = pair;
    (to[u] as number[]).push(v);
    (via[u] as number[]).push(e);
    (to[v] as number[]).push(u);
    (via[v] as number[]).push(e);
    ops += 8;
  }

  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  ops += 2 * n;
  const found: Edge[] = [];
  let timer = 0;

  const stackV: number[] = [];
  const stackI: number[] = [];
  const stackE: number[] = [];
  let deepest = 0;
  const enter = (v: number, edge: number): void => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    stackV.push(v);
    stackI.push(0);
    stackE.push(edge);
    ops += 5;
    if (stackV.length > deepest) deepest = stackV.length;
  };

  for (let root = 0; root < n; root++) {
    ops += 1;
    if (disc[root] !== -1) continue;
    enter(root, -1);

    while (stackV.length > 0) {
      const v = stackV[stackV.length - 1] as number;
      const i = stackI[stackI.length - 1] as number;
      const nbrs = to[v] as number[];
      ops += 3;

      if (i < nbrs.length) {
        stackI[stackI.length - 1] = i + 1;
        const w = nbrs[i] as number;
        const e = (via[v] as number[])[i] as number;
        const parentEdge = stackE[stackE.length - 1] as number;
        ops += 5;
        if (e === parentEdge) continue;
        if (disc[w] === -1) {
          ops += 1;
          enter(w, e);
        } else {
          ops += 1;
          low[v] = Math.min(low[v] as number, disc[w] as number);
          ops += 3;
        }
        continue;
      }

      stackV.pop();
      stackI.pop();
      const edge = stackE.pop() as number;
      ops += 3;
      if (edge !== -1) {
        const p = stackV[stackV.length - 1] as number;
        ops += 1;
        low[p] = Math.min(low[p] as number, low[v] as number);
        ops += 3;
        const child = low[v] as number;
        const parent = disc[p] as number;
        ops += 2;
        if (child > parent) {
          found.push(p < v ? [p, v] : [v, p]);
          ops += 1;
        }
      }
    }
  }

  found.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return { ops, cells: 4 * n + 4 * edges.length + 3 * deepest, answer: found };
}

/**
 * 경쟁 설계 — **간선을 하나씩 더하며 다리를 유지하는 서로소 집합 판**.
 *
 * 서로소 집합 둘을 든다. `bc` 는 「지금까지 받은 간선만으로 두 정점 사이에 서로 다른 길이
 * 둘 이상 있는가」로 정점을 묶고, `cc` 는 연결 성분을 묶는다. `par` 는 `bc` 의 대표들이
 * 이루는 나무의 부모 자리이고, 그 나무의 간선 하나가 곧 다리 하나다.
 *
 * 간선 `(u, v)` 를 더할 때 갈래가 셋이다.
 *
 * 1. `bc` 대표가 같다 — 이미 길이 둘 이상이라 아무것도 안 바뀐다.
 * 2. `cc` 대표가 다르다 — 두 덩어리가 처음 이어진다. 작은 쪽 나무의 뿌리를 옮겨 붙이고
 *    다리 수를 하나 올린다.
 * 3. 그 밖 — 나무 위에서 두 대표의 공통 조상을 찾아 그 사이 정점을 전부 한 무리로 합치고,
 *    합친 만큼 다리 수를 내린다.
 *
 * 마지막에 간선 목록을 한 번 읽어 `bc` 대표가 다른 간선을 모으면 그것이 다리 목록이다.
 */
class 증분서로소집합 {
  ops = 0;
  bridges = 0;
  private readonly bc: number[];
  private readonly cc: number[];
  private readonly size: number[];
  private readonly par: number[];
  private readonly mark: number[];
  private stamp = 0;
  readonly n: number;

  constructor(n: number) {
    this.n = n;
    this.bc = Array.from({ length: n }, (_, i) => i);
    this.cc = Array.from({ length: n }, (_, i) => i);
    this.size = Array.from({ length: n }, () => 1);
    this.par = Array.from({ length: n }, () => -1);
    this.mark = Array.from({ length: n }, () => 0);
    this.ops += 5 * n;
  }

  private root(dsu: number[], x: number): number {
    for (;;) {
      const p = dsu[x] as number;
      this.ops += 1;
      if (p === x) return x;
      const g = dsu[p] as number;
      dsu[x] = g;
      this.ops += 2;
      x = g;
    }
  }

  findB(x: number): number {
    return this.root(this.bc, x);
  }

  private findC(x: number): number {
    return this.root(this.cc, x);
  }

  /** 나무의 뿌리를 `v` 쪽으로 옮긴다. 부모 자리를 거슬러 뒤집는 것이 전부다. */
  private reroot(v: number): void {
    let at = this.findB(v);
    let child = -1;
    while (at !== -1) {
      const up = this.par[at] as number;
      this.ops += 1;
      const next = up === -1 ? -1 : this.findB(up);
      this.par[at] = child;
      this.ops += 1;
      child = at;
      at = next;
    }
  }

  add(u: number, v: number): void {
    if (this.findB(u) === this.findB(v)) return;
    const ru = this.findC(u);
    const rv = this.findC(v);
    if (ru !== rv) {
      const su = this.size[ru] as number;
      const sv = this.size[rv] as number;
      this.ops += 2;
      if (su < sv) {
        this.reroot(u);
        this.par[this.findB(u)] = this.findB(v);
        this.cc[ru] = rv;
        this.size[rv] = sv + su;
      } else {
        this.reroot(v);
        this.par[this.findB(v)] = this.findB(u);
        this.cc[rv] = ru;
        this.size[ru] = su + sv;
      }
      this.ops += 3;
      this.bridges++;
      return;
    }
    const a = this.findB(u);
    const b = this.findB(v);
    this.stamp++;
    let x = a;
    let y = b;
    let meet = -1;
    for (;;) {
      if (x !== -1) {
        const seen = this.mark[x] as number;
        this.ops += 1;
        if (seen === this.stamp) {
          meet = x;
          break;
        }
        this.mark[x] = this.stamp;
        const up = this.par[x] as number;
        this.ops += 2;
        x = up === -1 ? -1 : this.findB(up);
      }
      if (y !== -1) {
        const seen = this.mark[y] as number;
        this.ops += 1;
        if (seen === this.stamp) {
          meet = y;
          break;
        }
        this.mark[y] = this.stamp;
        const up = this.par[y] as number;
        this.ops += 2;
        y = up === -1 ? -1 : this.findB(up);
      }
      if (x === -1 && y === -1) {
        throw new Error("같은 성분인데 공통 조상이 없다 — 나무가 깨졌다");
      }
    }
    for (const from of [a, b]) {
      let at = this.findB(from);
      while (at !== meet) {
        const up = this.par[at] as number;
        this.ops += 1;
        const next = this.findB(up);
        this.bc[at] = meet;
        this.ops += 1;
        this.bridges--;
        at = next;
      }
    }
  }

  list(edges: Edge[]): Edge[] {
    const out: Edge[] = [];
    for (const pair of edges) {
      this.ops += 1;
      const [u, v] = pair;
      if (this.findB(u) !== this.findB(v)) out.push(u < v ? [u, v] : [v, u]);
    }
    out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return out;
  }

  cells(): number {
    return 5 * this.n;
  }
}

export function 증분판(n: number, edges: Edge[]): Count {
  const state = new 증분서로소집합(n);
  for (const pair of edges) {
    state.ops += 1;
    state.add(pair[0], pair[1]);
  }
  const answer = state.list(edges);
  return { ops: state.ops, cells: state.cells(), answer };
}

/* ─────────────── 간선을 더할 때마다 묻는 작업 목록 ─────────────── */

/** 질의 자리 — 간선 목록을 `q` 등분한 자리에서 「지금 다리가 몇 개인가」를 묻는다. */
export function askAt(total: number, q: number): number[] {
  const out: number[] = [];
  for (let j = 1; j <= q; j++)
    out.push(Math.max(1, Math.ceil((total * j) / q)));
  return out;
}

/** 정본은 묻는 자리마다 그 시점까지의 간선으로 절차를 처음부터 실행한다. */
export function 이절차의온라인(n: number, edges: Edge[], q: number): Count {
  let ops = 0;
  const counts: number[] = [];
  for (const at of askAt(edges.length, q)) {
    const run = 이가이드의절차(n, edges.slice(0, at));
    ops += run.ops;
    counts.push(run.answer.length);
  }
  const last = 이가이드의절차(n, edges);
  ANSWER_COUNTS.set("이 가이드의 절차", counts.join(","));
  return { ops: ops + last.ops, cells: last.cells, answer: last.answer };
}

/** 경쟁 설계는 갱신하며 세어 둔 값을 한 칸 읽어 답한다. */
export function 증분판의온라인(n: number, edges: Edge[], q: number): Count {
  const state = new 증분서로소집합(n);
  const at = new Set(askAt(edges.length, q));
  const counts: number[] = [];
  for (let i = 0; i < edges.length; i++) {
    const pair = edges[i] as Edge;
    state.ops += 1;
    state.add(pair[0], pair[1]);
    if (at.has(i + 1)) {
      counts.push(state.bridges);
      state.ops += 1;
    }
  }
  const answer = state.list(edges);
  ANSWER_COUNTS.set("증분 서로소 집합 판", counts.join(","));
  return { ops: state.ops, cells: state.cells(), answer };
}

/** 온라인 작업 목록에서 두 설계가 답한 「그때그때의 다리 개수」. 서로 같아야 한다. */
const ANSWER_COUNTS = new Map<string, string>();

/* ────────────────────────── 하네스 ────────────────────────── */

/** 계측본이 정본과 같은 답을 냈는지 매 실행마다 확인한다. */
export function measure(
  run: (n: number, edges: Edge[]) => Count,
  n: number,
  edges: Edge[],
): Count {
  const got = run(n, edges);
  const want = bridgesInGraph(n, edges);
  if (JSON.stringify(got.answer) !== JSON.stringify(want)) {
    throw new Error(
      `계측본이 정본과 다른 답을 냈다 — ${JSON.stringify(got.answer)} vs ${JSON.stringify(want)}`,
    );
  }
  return got;
}

/** 저장 칸의 순서가 처음 뒤집히는 간선 수. */
export function storageFlip(): number {
  for (let e = 0; e <= 4 * SWEEP_V; e++) {
    const edges = sweepEdges(e);
    const mine = measure(이가이드의절차, SWEEP_V, edges);
    const rival = measure(증분판, SWEEP_V, edges);
    if (mine.cells > rival.cells) return e;
  }
  throw new Error("간선을 4V 까지 늘려도 저장 칸의 순서가 안 뒤집힌다");
}

/** 저장 칸에서 이 절차가 **마지막으로** 앞선 간선 수. */
export function lastAhead(): number {
  let last = -1;
  for (let e = 0; e <= 4 * SWEEP_V; e++) {
    const edges = sweepEdges(e);
    const mine = measure(이가이드의절차, SWEEP_V, edges);
    const rival = measure(증분판, SWEEP_V, edges);
    if (mine.cells < rival.cells) last = e;
  }
  return last;
}

const FLIP = storageFlip();
const LAST = lastAhead();
if (LAST < 0 || FLIP <= LAST) {
  throw new Error("저장 칸 축에서 순서가 뒤집히는 자리를 못 찾았다");
}

const GRID = grid(32);
const ONLINE_Q = 32;

function 재기(
  offline: (n: number, edges: Edge[]) => Count,
  online: (n: number, edges: Edge[], q: number) => Count,
): Record<string, number> {
  const walk = measure(offline, WALK_N, WALK_EDGES);
  const before = measure(offline, SWEEP_V, sweepEdges(LAST));
  const after = measure(offline, SWEEP_V, sweepEdges(FLIP));
  const wide = measure(offline, SWEEP_V, sweepEdges(4 * SWEEP_V));
  const small = measure(offline, 1024, chain(1024));
  const large = measure(offline, 65536, chain(65536));
  const smallMixed = measure(offline, 1024, shuffledChain(1024));
  const largeMixed = measure(offline, 65536, shuffledChain(65536));
  const asked = online(GRID.n, GRID.edges, ONLINE_Q);
  return {
    "전개 입력 · 배열 칸 접근": walk.ops,
    "전개 입력 · 저장 칸": walk.cells,
    [`간선 ${LAST} · 저장 칸`]: before.cells,
    [`간선 ${FLIP} · 저장 칸`]: after.cells,
    "간선 4,096 · 배열 칸 접근": wide.ops,
    "간선 4,096 · 저장 칸": wide.cells,
    "사슬 1,024 · 배열 칸 접근": small.ops,
    "사슬 65,536 · 배열 칸 접근": large.ops,
    "섞은 사슬 1,024 · 배열 칸 접근": smallMixed.ops,
    "섞은 사슬 65,536 · 배열 칸 접근": largeMixed.ops,
    "격자 32×32 · 질의 32 회 · 배열 칸 접근": asked.ops,
  };
}

export const cases = {
  "이 가이드의 절차": () => 재기(이가이드의절차, 이절차의온라인),
  "증분 서로소 집합 판": () => {
    const out = 재기(증분판, 증분판의온라인);
    const mine = ANSWER_COUNTS.get("이 가이드의 절차");
    const rival = ANSWER_COUNTS.get("증분 서로소 집합 판");
    if (mine === undefined || mine !== rival) {
      throw new Error(
        `온라인 작업 목록에서 두 설계가 답한 다리 개수가 다르다 — ${mine} vs ${rival}`,
      );
    }
    return out;
  },
  경계: () => ({
    "저장 칸이 처음 뒤집히는 간선 수": FLIP,
    "이 절차의 저장 칸이 마지막으로 적은 간선 수": LAST,
  }),
};
