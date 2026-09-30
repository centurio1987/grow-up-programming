/**
 * `tspBitmask-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 칸을 살펴본 자리 · 전이 후보 · 복귀
 * 계산은 **정본 소스에서 기계로 만든 계측 사본**(`probe`)이 기록한다 — 정본의 줄 넷 뒤에 기록 호출만
 * 끼운 것이고, 끼울 줄이 정확히 하나씩이 아니면 이 파일을 읽을 때 던진다. 계측 사본의 답은 부를 때마다
 * 정본과 맞댄다.
 *
 * 증명 사이드카(`-guide.proof.ts`)의 변이도 이 계측 사본(`PROBE_PATH`)에서 `loadMutant` 로 만든다.
 * 그래야 변이가 낸 DP 테이블과 계수를 같은 기록으로 읽을 수 있고, 중화 실행에서는 계측 사본이 그대로
 * 돌아와 정본의 값이 나온다.
 *
 * 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과
 * 같은지는 `tspBitmask-guide.test.ts` 가 잰다.
 */

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ReactElement } from "react";
import { 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import {
  CellStage,
  CellStageFilm,
  type StageFrame,
  type StageRow,
} from "../../../_viz/patterns/CellStage";
import { NodeGraph } from "../../../_viz/patterns/NodeGraph";
import {
  type TableCell,
  type TableOptions,
  type TableStep,
  tableStage,
} from "../../../_viz/player/tableStage";
import { INF, tspBitmask } from "./tspBitmask-guide.ref.ts";

const REF = new URL("./tspBitmask-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 계측 사본 ───────────────────────── */

/** 계측 사본이 부르는 기록 자리. 없으면(`undefined`) 사본은 정본과 같이 돈다. */
export interface Hooks {
  start?(dp: Float64Array): void;
  outside?(mask: number, v: number): void;
  visit?(mask: number, v: number, cur: number): void;
  cand?(
    mask: number,
    v: number,
    u: number,
    cand: number,
    old: number,
    at: number,
  ): void;
  ret?(last: number, stored: number, back: number): void;
}

/**
 * 정본의 줄 다섯에 기록 호출을 끼운다. 줄마다 정확히 하나에 맞아야 한다 — 아니면 계측이 정본과 다른
 * 자리를 재게 된다. ⑤ 줄(이미 들른 도시)은 건드리지 않는다. 증명 사이드카의 변이 하나가 그 줄을
 * 지우므로, 계측 사본에서도 그 줄이 정본 그대로여야 변이가 한 줄에 맞는다.
 */
const PROBE_SWAPS: readonly [RegExp, string][] = [
  [
    /^(\s*)dp\[1 \* n \+ 0\] = 0;$/,
    "$1dp[1 * n + 0] = 0;\n$1const __h = (globalThis as any).__tspHooks;\n$1__h?.start?.(dp);",
  ],
  [
    /^(\s*)if \(\(mask & \(1 << v\)\) === 0\) continue;$/,
    "$1if ((mask & (1 << v)) === 0) {\n$1  __h?.outside?.(mask, v);\n$1  continue;\n$1}",
  ],
  [
    /^(\s*)const cur = dp\[mask \* n \+ v\] as number;$/,
    "$1const cur = dp[mask * n + v] as number;\n$1__h?.visit?.(mask, v, cur);",
  ],
  [
    /^(\s*)if \(cand < \(dp\[at\] as number\)\) dp\[at\] = cand;$/,
    "$1__h?.cand?.(mask, v, u, cand, dp[at] as number, at);\n$1if (cand < (dp[at] as number)) dp[at] = cand;",
  ],
  [
    /^(\s*)const cand = \(dp\[FULL \* n \+ last\] as number\) \+ \(back\[0\] as number\);$/,
    "$1const cand = (dp[FULL * n + last] as number) + (back[0] as number);\n$1__h?.ret?.(last, dp[FULL * n + last] as number, back[0] as number);",
  ],
];

function buildProbe(): string {
  const lines = readFileSync(REF, "utf8").split("\n");
  const out = lines.map((line) => {
    for (const [re, to] of PROBE_SWAPS) {
      if (re.test(line)) return line.replace(re, to);
    }
    return line;
  });
  for (const [re] of PROBE_SWAPS) {
    const hits = lines.filter((l) => re.test(l)).length;
    if (hits !== 1) {
      throw new Error(
        `계측 자리 ${re} 가 정본의 ${hits} 줄에 맞았다 — 한 줄이어야 한다`,
      );
    }
  }
  const dir = mkdtempSync(join(tmpdir(), "tsp-probe-"));
  const path = join(dir, "tspBitmask-guide.probe.ts");
  writeFileSync(path, out.join("\n"), "utf8");
  return path;
}

/** 계측 사본의 경로 — 증명 사이드카가 변이를 여기서 만든다. */
export const PROBE_PATH = buildProbe();

export interface Impl {
  tspBitmask(dist: number[][]): number;
}

/** 계측 사본. 기록 자리가 비어 있으면 정본과 같은 일을 한다. */
export const probe = (await import(PROBE_PATH)) as Impl;

function withHooks<T>(hooks: Hooks, f: () => T): T {
  const g = globalThis as { __tspHooks?: Hooks };
  g.__tspHooks = hooks;
  try {
    return f();
  } finally {
    g.__tspHooks = undefined;
  }
}

/** 칸 `(mask, v)` 를 살펴보고 ③ 을 지나간 한 번 — `cur` 가 그때 칸에 든 값이다. */
export interface Visit {
  readonly mask: number;
  readonly v: number;
  readonly cur: number;
}

/** 전이 후보 하나 — ⑤ 를 지나 ⑥ 의 비교에 이른 한 번. */
export interface Cand {
  readonly mask: number;
  readonly v: number;
  readonly u: number;
  /** 도착 칸의 방문 집합 — 계측이 넘긴 칸 번호 `at` 에서 되읽는다. */
  readonly next: number;
  readonly cand: number;
  /** 비교하기 직전 도착 칸에 든 값. */
  readonly old: number;
  /** ⑥ 이 참이었는가 — 값을 바꿨는가. */
  readonly kept: boolean;
}

/** 복귀 계산 한 번 — ⑦. */
export interface Ret {
  readonly last: number;
  readonly stored: number;
  readonly back: number;
  readonly total: number;
}

/** 한 번 호출의 기록. 도시가 적은 입력에만 쓴다 — 칸과 후보마다 객체를 하나씩 남긴다. */
export interface Run {
  readonly answer: number;
  readonly n: number;
  readonly full: number;
  /** ③ 이 참이었던 칸의 방문 집합 — 건너뛸 때마다 하나. */
  readonly outside: readonly number[];
  readonly visits: readonly Visit[];
  readonly cands: readonly Cand[];
  readonly rets: readonly Ret[];
  /** 출발 칸을 놓은 직후의 DP 테이블(한 줄로 편 것). */
  readonly init: readonly number[];
  /** 호출이 끝난 뒤의 DP 테이블. */
  readonly final: readonly number[];
}

/** 기록하며 부른다. `impl` 이 계측 사본이면 답을 정본과 맞댄다. 변이는 계측 사본에서 만든 모듈을 준다. */
export function record(dist: number[][], impl: Impl = probe): Run {
  const n = dist.length;
  const visits: Visit[] = [];
  const cands: Cand[] = [];
  const rets: Ret[] = [];
  const outside: number[] = [];
  let table: Float64Array | null = null;
  let init: number[] = [];
  const answer = withHooks(
    {
      start: (dp) => {
        table = dp;
        init = Array.from(dp);
      },
      outside: (mask) => {
        outside.push(mask);
      },
      visit: (mask, v, cur) => {
        visits.push({ mask, v, cur });
      },
      cand: (mask, v, u, cand, old, at) => {
        cands.push({
          mask,
          v,
          u,
          next: (at - u) / n,
          cand,
          old,
          kept: cand < old,
        });
      },
      ret: (last, stored, back) => {
        rets.push({ last, stored, back, total: stored + back });
      },
    },
    () => impl.tspBitmask(dist),
  );
  if (impl === probe && answer !== tspBitmask(dist)) {
    throw new Error(`계측 사본이 정본과 다른 답을 냈다 — ${answer}`);
  }
  if (table === null) throw new Error("DP 테이블을 붙잡지 못했다");
  const final = Array.from(table as Float64Array);
  return {
    answer,
    n,
    full: final.length / n - 1,
    outside,
    visits,
    cands,
    rets,
    init,
    final,
  };
}

/** 셈만 하는 가벼운 판 — 큰 입력에서 쓴다. 칸이나 후보마다 객체를 남기지 않는다. */
export interface Tally {
  readonly answer: number;
  /** ①② — DP 테이블을 잡고 출발 칸을 놓은 횟수. */
  readonly starts: number;
  readonly cells: number;
  /** ③ 이 참 — 위치가 방문 집합 밖이라 건너뛴 칸. */
  readonly outside: number;
  /** ③ 을 지나 칸의 값을 읽은 횟수. */
  readonly visits: number;
  /** ④ 가 참 — 값이 INF 라 건너뛴 칸. */
  readonly unreached: number;
  /** ③ · ④ 를 지나 후보를 살펴본 칸 — 값이 든 칸. */
  readonly live: number;
  /** ⑤ 를 지나 ⑥ 의 비교에 이른 후보 — 전이. */
  readonly transitions: number;
  /** ⑥ 이 참 — 값을 바꾼 횟수. */
  readonly updates: number;
  /** ⑦ — 복귀 비용을 더해 본 횟수. */
  readonly returns: number;
}

export function tally(dist: number[][], impl: Impl = probe): Tally {
  let cells = 0;
  let starts = 0;
  let outside = 0;
  let visits = 0;
  let unreached = 0;
  let transitions = 0;
  let updates = 0;
  let returns = 0;
  const answer = withHooks(
    {
      start: (dp) => {
        starts++;
        cells = dp.length;
      },
      outside: () => {
        outside++;
      },
      visit: (_m, _v, cur) => {
        visits++;
        if (cur === INF) unreached++;
      },
      cand: (_m, _v, _u, cand, old) => {
        transitions++;
        if (cand < old) updates++;
      },
      ret: () => {
        returns++;
      },
    },
    () => impl.tspBitmask(dist),
  );
  if (impl === probe && answer !== tspBitmask(dist)) {
    throw new Error(`셈하는 사본이 정본과 다른 답을 냈다 — ${answer}`);
  }
  return {
    answer,
    starts,
    cells,
    outside,
    visits,
    unreached,
    live: visits - unreached,
    transitions,
    updates,
    returns,
  };
}

/**
 * 이 글이 비용으로 세는 **기본 연산** — 칸 `(mask, v)` 하나를 살펴본 한 번(③ 에서 건너뛴 칸 포함) ·
 * 다음 도시 후보 `u` 하나를 살펴본 한 번(⑤ 에서 거른 후보 포함) · 복귀 비용을 더해 본 한 번. 값이 든
 * 칸마다 안쪽 반복이 `n` 번 돌므로 살펴본 후보는 `live × n` 이다.
 */
export const basicOps = (t: Tally, n: number): number =>
  t.outside + t.visits + t.live * n + t.returns;

/* ───────────────────────── 입력 ───────────────────────── */

/**
 * 본문 전개가 쓰는 거리 행렬. 도시 넷이고 답이 80 이다. 일곱 갈래를 한 입력에서 전부 실행하고,
 * 순서가 다른 두 접두 경로가 같은 칸으로 모이는 자리가 나오는 가장 작은 크기다.
 */
export const WALK: number[][] = [
  [0, 10, 15, 20],
  [10, 0, 35, 25],
  [15, 35, 0, 30],
  [20, 25, 30, 0],
];

/** 비대칭 거리 행렬. `dist[i][j] !== dist[j][i]` 인 자리를 담는다. */
export const ASYM3: number[][] = [
  [0, 1, 10],
  [10, 0, 1],
  [1, 10, 0],
];

/** 이미 들른 도시를 거르지 않으면 없는 지름길이 생기는 도시 넷짜리 행렬. 답이 10 이다. */
export const SHORTCUT4: number[][] = [
  [0, 4, 1, 6],
  [3, 0, 1, 3],
  [4, 2, 0, 1],
  [4, 6, 2, 0],
];

/** 접두 경로 둘이 같은 칸으로 모이는 자리를 보이는 도시 다섯짜리 행렬. */
export const MERGE5: number[][] = [
  [0, 4, 9, 7, 3],
  [6, 0, 2, 8, 5],
  [3, 7, 0, 1, 9],
  [8, 2, 6, 0, 4],
  [5, 9, 3, 2, 0],
];

/** 대각선만 0 이고 나머지가 전부 `w` 인 행렬. */
export function flat(n: number, w = 1): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : w)),
  );
}

/** `dist[i][j] = ((i·7 + j·13) mod 90) + 1` — 규모를 늘릴 때 쓰는 생성식. */
export function line(n: number): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      i === j ? 0 : ((i * 7 + j * 13) % 90) + 1,
    ),
  );
}

/** 이웃한 번호끼리만 비용이 0 이고 나머지가 100 인 행렬. 비용 0 짜리 순회가 있어 답이 0 이다. */
export function zeroCycle(n: number): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 0;
      if ((i + 1) % n === j || (j + 1) % n === i) return 0;
      return 100;
    }),
  );
}

/** 과제 규모 — 도시 수와 거리의 위 끝. */
export const N_LIMIT = 20;
export const D_LIMIT = 1_000_000;
/** 과제의 메모리 예산 — 흔한 채점 환경의 256 MB 를 바이트로 적은 값(1 MB = 10^6 바이트). */
export const MEM_LIMIT = 256_000_000;
/** DP 테이블 칸 하나의 바이트 — 정본이 `Float64Array` 로 잡는다. */
export const CELL_BYTES = Float64Array.BYTES_PER_ELEMENT;

/* ───────────────────────── 표기 ───────────────────────── */

export const comma = (x: number | bigint): string => x.toLocaleString("en-US");

/** 방문 집합을 `n` 자리 이진수로 — 자리 `i` 가 도시 `i` 다. */
export const bits = (mask: number, n: number): string =>
  `${mask.toString(2).padStart(n, "0")}₂`;

/** 방문 집합을 도시 번호의 모음으로 — `{0,1,3}`. */
export function setName(mask: number, n: number): string {
  const xs: number[] = [];
  for (let i = 0; i < n; i++) if ((mask & (1 << i)) !== 0) xs.push(i);
  return `{${xs.join(",")}}`;
}

/** 코드의 `Number.POSITIVE_INFINITY` 를 본문 표기 `INF` 로. */
export const val = (x: number): string => (x === INF ? "INF" : comma(x));

/** 칸 이름 — `dp[1011₂][3]`. */
export const cellName = (mask: number, v: number, n: number): string =>
  `dp[${bits(mask, n)}][${v}]`;

/* ───────────────────────── 순서를 전부 만드는 방법 ───────────────────────── */

/** 도시 0 을 맨 앞에 두고 나머지 순서를 깊이 우선으로 전부 만든다. 같은 기본 연산으로 센다. */
export function enumerate(dist: number[][]): {
  answer: number;
  /** 들어간 호출(접두 경로) 수. */
  nodes: number;
  /** 완성한 순서 수 — `(n-1)!`. */
  tours: number;
  ops: number;
  best: number[];
  /** 도시가 다섯 이하일 때만 채운다 — 순서마다 구간 비용. */
  detail: { order: number[]; legs: number[]; total: number }[];
} {
  const n = dist.length;
  let nodes = 0;
  let tours = 0;
  let ops = 0;
  let answer = INF;
  let best: number[] = [0, 0];
  const detail: { order: number[]; legs: number[]; total: number }[] = [];
  const used = new Array<boolean>(n).fill(false);
  used[0] = true;
  const path = [0];
  const legs: number[] = [];
  const go = (at: number, cost: number): void => {
    nodes++;
    ops++;
    if (path.length === n) {
      tours++;
      ops++;
      const back = (dist[at] as number[])[0] as number;
      const total = cost + back;
      if (n <= 5) {
        detail.push({ order: [...path, 0], legs: [...legs, back], total });
      }
      if (total < answer) {
        answer = total;
        best = [...path, 0];
      }
      return;
    }
    const row = dist[at] as number[];
    for (let u = 1; u < n; u++) {
      ops++;
      if (used[u] === true) continue;
      used[u] = true;
      path.push(u);
      legs.push(row[u] as number);
      go(u, cost + (row[u] as number));
      legs.pop();
      path.pop();
      used[u] = false;
    }
  };
  go(0, 0);
  return { answer, nodes, tours, ops, best, detail };
}

/** `(n-1)!` */
export function tourCount(n: number): bigint {
  let out = 1n;
  for (let i = 2n; i <= BigInt(n - 1); i++) out *= i;
  return out;
}

/** 순서를 만드는 방법이 들어가는 호출 수 — `Σ_{d=0}^{n-1} (n-1)!/(n-1-d)!`. */
export function enumerateNodes(n: number): bigint {
  const m = BigInt(n - 1);
  let term = 1n;
  let sum = 1n;
  for (let d = 1n; d <= m; d++) {
    term *= m - d + 1n;
    sum += term;
  }
  return sum;
}

/**
 * 순서를 만드는 방법의 기본 연산 — 호출마다 한 번 · 잎이 아닌 호출마다 후보 `n-1` 번 · 잎마다 복귀
 * 한 번. `enumerate` 의 셈과 같은지는 증명 사이드카가 잰다.
 */
export function enumerateOps(n: number): bigint {
  const nodes = enumerateNodes(n);
  const tours = tourCount(n);
  return nodes + (nodes - tours) * BigInt(n - 1) + tours;
}

/** 값이 드는 칸의 수 — 출발 칸 하나 + 도시 0 을 담은 방문 집합마다 도시 0 이 아닌 위치 하나씩. */
export const liveStates = (n: number): number =>
  n === 1 ? 1 : 1 + (n - 1) * 2 ** (n - 2);

/** 전이의 수 — `(n-1) + (n-1)(n-2)·2^(n-3)`. */
export const transitionCount = (n: number): number =>
  n < 2 ? 0 : n - 1 + (n - 1) * (n - 2) * 2 ** (n - 3);

/** DP 테이블의 칸 수 — `2^n · n`. */
export const cellCount = (n: number): number => 2 ** n * n;

/** DP 테이블 방법의 기본 연산 — 칸 `(2^n − 1)·n` · 후보 `live·n` · 복귀 `n`. */
export const dpOps = (n: number): number =>
  (2 ** n - 1) * n + liveStates(n) * n + n;

/* ───────────────────────── 들른 집합만 남기는 판 ───────────────────────── */

/**
 * 지금 도시를 빼고 방문 집합만 칸으로 삼은 판. 다음 이동 비용 `dist[v][u]` 의 `v` 가 없으므로 집합
 * 안의 도시 중 가장 싼 출발을 쓴다 — 「지금 도시를 빼면 무엇을 잃는가」를 값으로 보이는 자리다.
 */
export function maskOnly(dist: number[][]): number {
  const n = dist.length;
  const FULL = (1 << n) - 1;
  const dp = new Float64Array(FULL + 1).fill(INF);
  dp[1] = 0;
  for (let mask = 1; mask <= FULL; mask++) {
    const cur = dp[mask] as number;
    if (cur === INF) continue;
    for (let u = 0; u < n; u++) {
      if ((mask & (1 << u)) !== 0) continue;
      let cheapest = INF;
      for (let v = 0; v < n; v++) {
        if ((mask & (1 << v)) === 0) continue;
        const e = (dist[v] as number[])[u] as number;
        if (e < cheapest) cheapest = e;
      }
      const next = mask | (1 << u);
      if (cur + cheapest < (dp[next] as number)) dp[next] = cur + cheapest;
    }
  }
  let back = INF;
  for (let v = 1; v < n; v++) {
    const e = (dist[v] as number[])[0] as number;
    if (e < back) back = e;
  }
  return n === 1 ? 0 : (dp[FULL] as number) + back;
}

/* ───────────────────────── 들른 도시 수를 줄로 두는 판 ───────────────────────── */

/**
 * 줄을 방문 집합이 아니라 **움직인 횟수 `k`** 로 둔 판 — `dp[k][v]` 는 도시 0 에서 `k` 번 움직여 `v` 에
 * 있는 가장 작은 비용이다. 어느 도시를 들렀는지 모르므로 같은 도시를 다시 들르는 것을 막지 못한다.
 * 「먼저 알아 둘 개념」의 (e) 가 이 모양을 DP 테이블과 같은 입력에 그려 비교한다.
 */
export function countRows(dist: number[][]): {
  rows: number[][];
  answer: number;
  walk: number[];
} {
  const n = dist.length;
  const rows: number[][] = [
    Array.from({ length: n }, (_, v) => (v === 0 ? 0 : INF)),
  ];
  const from: number[][] = [new Array<number>(n).fill(-1)];
  for (let k = 1; k < n; k++) {
    const prev = rows[k - 1] as number[];
    const row = new Array<number>(n).fill(INF);
    const src = new Array<number>(n).fill(-1);
    for (let u = 0; u < n; u++) {
      for (let v = 0; v < n; v++) {
        if (v === u || prev[v] === INF) continue;
        const c = (prev[v] as number) + ((dist[v] as number[])[u] as number);
        if (c < (row[u] as number)) {
          row[u] = c;
          src[u] = v;
        }
      }
    }
    rows.push(row);
    from.push(src);
  }
  let answer = INF;
  let end = 0;
  const lastRow = rows[n - 1] as number[];
  for (let v = 0; v < n; v++) {
    if (n > 1 && v === 0) continue;
    const c = (lastRow[v] as number) + ((dist[v] as number[])[0] as number);
    if (c < answer) {
      answer = c;
      end = v;
    }
  }
  const walk = [end];
  let at = end;
  for (let k = n - 1; k >= 1; k--) {
    at = (from[k] as number[])[at] as number;
    walk.unshift(at);
  }
  return { rows, answer: n === 1 ? 0 : answer, walk: [...walk, 0] };
}

/* ───────────────────────── 걸음 ───────────────────────── */

export const WALK_N = WALK.length;
export const WALK_FULL = (1 << WALK_N) - 1;

/** 전개 입력의 기록 — 그림 · 패널 · 증명이 같은 한 벌을 쓴다. */
export const REC = record(WALK);

/** 한 줄로 편 DP 테이블을 줄마다 가른다. INF 는 아직 경로가 없는 칸이라 `null`(점선)로 둔다. */
export function toTable(
  flatDp: readonly number[],
  n: number,
): (number | null)[][] {
  return Array.from({ length: flatDp.length / n }, (_, m) =>
    Array.from({ length: n }, (_, v) => {
      const x = flatDp[m * n + v] as number;
      return x === INF ? null : x;
    }),
  );
}

/** ③ 이 늘 건너뛰는 칸 — 방문 집합 0 의 줄 전부와 위치가 방문 집합 밖인 칸. */
export function outCells(n: number): TableCell[] {
  const out: TableCell[] = [];
  for (let m = 0; m < 1 << n; m++) {
    for (let v = 0; v < n; v++) {
      if (m === 0 || (m & (1 << v)) === 0) out.push([m, v]);
    }
  }
  return out;
}

/** 줄 곁말 — 값이 든 칸 수를 방문 집합 안의 위치 수로 나눠 적는다. */
export function rowSides(
  table: readonly (readonly (number | null)[])[],
): string[] {
  const n = table[0]?.length ?? 0;
  return table.map((row, m) => {
    if (m === 0) return "쓰지 않는 줄";
    if ((m & 1) === 0) return "도시 0 없음";
    let inside = 0;
    let filled = 0;
    for (let v = 0; v < n; v++) {
      if ((m & (1 << v)) === 0) continue;
      inside++;
      if (row[v] !== null) filled++;
    }
    return `채움 ${filled} / ${inside}`;
  });
}

export const TABLE_OPTIONS: TableOptions = {
  rowHeads: Array.from(
    { length: WALK_FULL + 1 },
    (_, m) => `${bits(m, WALK_N)} ${setName(m, WALK_N)}`,
  ),
  colHeads: Array.from({ length: WALK_N }, (_, v) => v),
  colLabel: "지금 도시 v",
};

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly step: TableStep;
}

const list = (xs: readonly number[]): string => xs.join(" · ");

/** 걸음 전부 — 출발 칸을 놓는 T1 · 방문 집합마다 한 걸음 · 복귀 계산 한 걸음. */
export function walkSteps(): Step[] {
  const n = WALK_N;
  const FULL = WALK_FULL;
  const OUT = outCells(n);
  const cur = [...REC.init];
  const steps: Step[] = [];
  let k = 1;
  const snap = () => toTable(cur, n);
  const seed = cellName(1, 0, n);
  const t0 = snap();
  steps.push({
    id: `T${k++}`,
    title: "출발 칸 놓기",
    detail: `DP 테이블을 ${FULL + 1} 줄 × ${n} 칸으로 잡아 모두 INF 로 채우고, 도시 0 만 들러 도시 0 에 있는 칸 ${seed} 에 ${val(cur[1 * n] as number)}${을를(val(cur[1 * n] as number))} 적습니다.`,
    step: {
      table: t0,
      write: [[1, 0]],
      out: OUT,
      rowSide: rowSides(t0),
      calc: { expr: `${seed} =`, result: val(cur[1 * n + 0] as number) },
    },
  });
  for (let mask = 1; mask <= FULL; mask++) {
    const b = bits(mask, n);
    const vs = REC.visits.filter((x) => x.mask === mask);
    const cs = REC.cands.filter((x) => x.mask === mask);
    const live = vs.filter((x) => x.cur !== INF);
    const writes: TableCell[] = [];
    const says: string[] = [];
    for (const c of cs) {
      const at = c.next * n + c.u;
      if (cur[at] !== c.old)
        throw new Error("기록한 옛 값이 되짚은 DP 테이블과 다르다");
      const src = vs.find((x) => x.v === c.v)?.cur ?? INF;
      const edge = (WALK[c.v] as number[])[c.u] as number;
      if (src + edge !== c.cand)
        throw new Error("전이 후보가 칸 값 + 이동 비용과 다르다");
      const got = val(c.cand);
      const head = `${cellName(mask, c.v, n)} + dist[${c.v}][${c.u}] = ${val(src)} + ${edge} = ${got}${이가(got)} ${cellName(c.next, c.u, n)} 의 ${val(c.old)} 보다`;
      if (c.kept) {
        cur[at] = c.cand;
        if (!writes.some(([r, q]) => r === c.next && q === c.u))
          writes.push([c.next, c.u]);
        says.push(`${head} 작아 적습니다.`);
      } else {
        says.push(`${head} 작지 않아 적지 않습니다.`);
      }
    }
    const table = snap();
    let title: string;
    let detail: string;
    if ((mask & 1) === 0) {
      title = `줄 ${b} — 도시 0 없음`;
      const where = list(vs.map((x) => x.v));
      const all = vs.length > 1 ? " 모두" : "";
      detail = `줄 ${b} 에는 도시 0 이 없어 방문 집합 안의 위치 ${where} 의 칸이${all} INF 입니다. ④ 가 건너뛰어 전이가 없습니다.`;
    } else if (cs.length === 0) {
      title = `줄 ${b} — 갈 도시 없음`;
      detail = `줄 ${b} 의 값 든 칸 v = ${list(live.map((x) => x.v))} 에서 아직 안 간 도시가 없어, ⑤ 가 후보 ${live.length * n} 개를 모두 거릅니다.`;
    } else {
      const kept = cs.filter((c) => c.kept).length;
      title = `줄 ${b} — 전이 ${cs.length} 개`;
      detail = `값 든 칸 v = ${list(live.map((x) => x.v))} 에서 아직 안 간 도시로 전이 ${cs.length} 개를 만듭니다. ${says.join(" ")}`;
      steps.push({
        id: `T${k++}`,
        title,
        detail,
        step: {
          table,
          read: live.map((x) => [mask, x.v] as TableCell),
          write: writes,
          out: OUT,
          rowSide: rowSides(table),
          calc: {
            expr: `전이 ${cs.length} 개 중 값을 바꾼 것`,
            result: `${kept} 개`,
          },
        },
      });
      continue;
    }
    steps.push({
      id: `T${k++}`,
      title,
      detail,
      step: {
        table,
        read: live.map((x) => [mask, x.v] as TableCell),
        out: OUT,
        rowSide: rowSides(table),
        calc: null,
      },
    });
  }
  const table = snap();
  const totals = REC.rets.map((r) => r.total);
  const best = Math.min(...totals);
  steps.push({
    id: `T${k++}`,
    title: `답 = ${val(REC.answer)}`,
    detail: `모든 도시를 들른 줄 ${bits(FULL, n)} 의 칸마다 도시 0 으로 돌아오는 비용을 더합니다. ${REC.rets
      .map(
        (r) =>
          `${cellName(FULL, r.last, n)} + dist[${r.last}][0] = ${val(r.stored)} + ${r.back} = ${val(r.total)}`,
      )
      .join(" · ")} 이고, 가장 작은 ${val(best)}${이가(val(best))} 답입니다.`,
    step: {
      table,
      read: REC.rets.map((r) => [FULL, r.last] as TableCell),
      out: OUT,
      rowSide: rowSides(table),
      calc: { expr: `min(${totals.map(val).join(", ")}) =`, result: val(best) },
    },
  });
  if (best !== REC.answer)
    throw new Error("복귀 계산의 최솟값이 반환값과 다르다");
  return steps;
}

/** 필름과 패널을 가르는 자리 — 걸음 열일곱을 여섯 · 여섯 · 다섯으로. */
export function walkParts(): { walk1: Step[]; walk2: Step[]; walk3: Step[] } {
  const all = walkSteps();
  return {
    walk1: all.slice(0, 6),
    walk2: all.slice(6, 12),
    walk3: all.slice(12),
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `tspBitmask-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const toStep = (s: Step) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...s.step,
  });
  const p = walkParts();
  return {
    walk1: p.walk1.map(toStep),
    walk2: p.walk2.map(toStep),
    walk3: p.walk3.map(toStep),
  };
}

const film = (steps: Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.step.calc
      ? `${s.title} · ${s.step.calc.expr} ${s.step.calc.result}`
      : s.title,
    rows: tableStage(s.step, TABLE_OPTIONS),
  }));

/* ───────────────────────── 정적 한 장 ───────────────────────── */

/** 다 채운 DP 테이블 한 장. */
function fullTable(extra: Partial<TableStep>): StageRow[] {
  const table = toTable(REC.final, WALK_N);
  return tableStage(
    { table, out: outCells(WALK_N), rowSide: rowSides(table), ...extra },
    TABLE_OPTIONS,
  );
}

/** 칸 `(mask, v)` 에 들어온 전이 후보 — 본문이 짚는 칸의 값이 어디서 왔는가. */
export function candsInto(mask: number, v: number): Cand[] {
  return REC.cands.filter((c) => c.next === mask && c.u === v);
}

/** (b)·(c) 가 짚는 칸 — 모든 도시를 들르고 도시 2 에 있는 칸. */
export const READ_MASK = WALK_FULL;
export const READ_V = 2;

/* ───────────────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────────────── */

function approaches(): Approach[] {
  const naive = enumerateOps(N_LIMIT);
  const walkAnswer = tspBitmask(WALK);
  const gap = maskOnly(WALK);
  return [
    {
      name: "방문 순서를 전부 만들기",
      idea: "도시 0 을 맨 앞에 두고 나머지 도시의 순서를 전부 만들어 순회 비용을 잰다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `도시 ${N_LIMIT} 개면 기본 연산이 ${naive.toString().length} 자리 수`,
          ok: false,
        },
      ],
      lesson:
        "순서만 다른 접두 경로가 같은 일을 되풀이한다 — 들른 도시가 같은 것을 합치면 어떨까",
    },
    {
      name: "들른 도시 집합만 남기기",
      idea: "방문 집합마다 칸 하나에 가장 작은 비용을 적는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `전개 입력에서 ${walkAnswer}${이가(String(walkAnswer))} 아니라 ${gap} — 이어지지 않는 구간을 골랐다`,
          ok: false,
        },
        { label: "시간", value: `칸 ${comma(2 ** N_LIMIT)} 개`, ok: true },
      ],
      lesson: "지금 어느 도시에 있는지를 함께 적으면 어떨까",
    },
    {
      name: "(들른 도시 집합, 지금 도시) DP 테이블",
      idea: "방문 집합과 지금 도시의 쌍마다 칸 하나에 가장 작은 접두 경로 비용을 적는다",
      verdict: "keep",
      checks: [
        { label: "답", value: `전개 입력에서 ${walkAnswer} — 맞다`, ok: true },
        {
          label: "시간",
          value: `도시 ${N_LIMIT} 개면 기본 연산 ${comma(dpOps(N_LIMIT))}`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 도시 넷의 자리 — 비용이 가장 작은 순회가 네모의 테두리를 한 바퀴 돌도록 놓는다(값이 아니라 배치다). */
const SPOT: Record<number, { x: number; y: number }> = {
  0: { x: 0, y: 0 },
  1: { x: 2.2, y: 0 },
  3: { x: 2.2, y: 1.6 },
  2: { x: 0, y: 1.6 },
};

function conceptTour(): ReactElement {
  const e = enumerate(WALK);
  const tour = new Set<string>();
  for (let i = 0; i + 1 < e.best.length; i++) {
    const a = e.best[i] as number;
    const b = e.best[i + 1] as number;
    tour.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
  }
  const edges = [];
  for (let a = 0; a < WALK_N; a++) {
    for (let b = a + 1; b < WALK_N; b++) {
      const on = tour.has(`${a}-${b}`);
      edges.push({
        from: a,
        to: b,
        label: String((WALK[a] as number[])[b]),
        // 순회 밖의 두 대각선은 가운데에서 엇갈리므로 조금 휘어 비용 글자가 겹치지 않게 한다.
        ...(on
          ? { kind: "tree" as const }
          : { state: "out" as const, bend: 0.12 }),
      });
    }
  }
  return (
    <NodeGraph
      title={`도시 넷과 비용이 가장 작은 순회 ${e.best.join(" → ")} — 비용 합 ${e.answer}`}
      directed={false}
      nodes={Array.from({ length: WALK_N }, (_, v) => ({
        id: v,
        ...(SPOT[v] as { x: number; y: number }),
        label: `도시 ${v}`,
        ...(v === 0 ? { value: "출발 · 도착" } : {}),
      }))}
      edges={edges}
    />
  );
}

function mergeFilm(): StageFrame[] {
  const cs = candsInto(READ_MASK, READ_V);
  const cur = [...REC.init];
  const frames: StageFrame[] = [];
  for (const c of REC.cands) {
    const at = c.next * WALK_N + c.u;
    const mine = cs.includes(c);
    if (mine) {
      if (c.kept) cur[at] = c.cand;
      const table = toTable(cur, WALK_N);
      frames.push({
        id: `v=${c.v}`,
        text: `${cellName(c.mask, c.v, WALK_N)} + dist[${c.v}][${c.u}] = ${val(c.cand)} — ${c.kept ? `${val(c.old)} 보다 작아 적는다` : `${val(c.old)} 보다 작지 않다`}`,
        rows: tableStage(
          {
            table,
            read: [[c.mask, c.v]],
            write: c.kept ? [[c.next, c.u]] : [],
            target: c.kept ? [] : [[c.next, c.u]],
            out: outCells(WALK_N),
            rowSide: rowSides(table),
          },
          TABLE_OPTIONS,
        ),
      });
    } else if (c.kept) {
      cur[at] = c.cand;
    }
  }
  return frames;
}

function contrastRows(): StageRow[] {
  const r = countRows(WALK);
  const table = r.rows.map((row) => row.map((x) => (x === INF ? null : x)));
  return tableStage(
    { table, rowSide: r.rows.map(() => "") },
    {
      rowHeads: r.rows.map((_, k) => `k=${k} 번 움직임`),
      colHeads: Array.from({ length: WALK_N }, (_, v) => v),
      colLabel: "지금 도시 v",
    },
  );
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-tour": conceptTour,
  "concept-table": () => (
    <CellStage
      title="tspBitmask(전개 입력) 의 DP 테이블 — 줄은 들른 도시 집합, 열은 지금 도시"
      rows={fullTable({})}
      columns={WALK_N}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`도시 ${N_LIMIT} 개까지 · 1 초 · 256 MB`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-read-cell": () => {
    const out: TableCell[] = [];
    for (let m = 0; m <= WALK_FULL; m++) {
      for (let v = 0; v < WALK_N; v++) {
        if (m !== READ_MASK || v !== READ_V) out.push([m, v]);
      }
    }
    return (
      <CellStage
        title={`${cellName(READ_MASK, READ_V, WALK_N)} — 들른 도시가 ${setName(READ_MASK, WALK_N)} 이고 지금 도시가 ${READ_V} 인 접두 경로의 가장 작은 비용`}
        rows={fullTable({ write: [[READ_MASK, READ_V]], out })}
        columns={WALK_N}
      />
    );
  },
  "build-relation": () => {
    const cs = candsInto(READ_MASK, READ_V);
    return (
      <CellStage
        title={`${cellName(READ_MASK, READ_V, WALK_N)} 이 읽는 칸 — 도시 ${READ_V} 를 끈 줄 ${bits(cs[0]?.mask ?? 0, WALK_N)} 의 값 든 칸`}
        rows={fullTable({
          read: cs.map((c) => [c.mask, c.v] as TableCell),
          write: [[READ_MASK, READ_V]],
        })}
        columns={WALK_N}
      />
    );
  },
  "build-contrast": () => {
    const r = countRows(WALK);
    return (
      <CellStage
        title={`줄을 움직인 횟수로 둔 판 — 같은 입력에서 답이 ${r.answer} (${r.walk.join(" → ")})`}
        rows={contrastRows()}
        columns={WALK_N}
      />
    );
  },
  "build-merge": () => (
    <CellStageFilm
      title={`같은 칸 ${cellName(READ_MASK, READ_V, WALK_N)} 에 두 전이가 온다 — 작은 쪽만 남는다`}
      columns={WALK_N}
      frames={mergeFilm()}
    />
  ),
  "walk-part1": () => {
    const s = walkParts().walk1;
    return (
      <CellStageFilm
        title={`tspBitmask(전개 입력) — ${s[0]?.id}~${s.at(-1)?.id}`}
        columns={WALK_N}
        frames={film(s)}
      />
    );
  },
  "walk-part2": () => {
    const s = walkParts().walk2;
    return (
      <CellStageFilm
        title={`tspBitmask(전개 입력) — ${s[0]?.id}~${s.at(-1)?.id}`}
        columns={WALK_N}
        frames={film(s)}
      />
    );
  },
  "walk-part3": () => {
    const s = walkParts().walk3;
    return (
      <CellStageFilm
        title={`tspBitmask(전개 입력) — ${s[0]?.id}~${s.at(-1)?.id}`}
        columns={WALK_N}
        frames={film(s)}
      />
    );
  },
};
