/**
 * `matrixChainMultiplication-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 후보 하나를 만드는 자리마다 무엇을
 * 읽었는지는 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록하고, 답은 정본이 낸다. 걸음 재생
 * 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `matrixChainMultiplication-guide.test.ts` 가 잰다.
 *
 * DP 테이블은 무대에서 줄 `i = 1 … n` · 열 `j = 1 … n` 의 `n × n` 으로 그린다. 정본은 첨자를 1 부터
 * 쓰려고 0 번 줄과 0 번 열을 비워 둔 `(n+1) × (n+1)` 을 잡는데, 비운 줄과 열은 아무 값도 뜻하지 않아
 * 그리지 않는다. 아래쪽 삼각형(`i > j`)은 구간이 아니라 쓰지 않는 칸이라 「이번 걸음 밖」(대시)으로
 * 둔다. 표 아래에는 행렬 줄을 둔다 — 열 `j` 와 행렬 `A_j` 가 짝이라, 칸 `(i, j)` 가 맡는 구간이 그
 * 줄 위의 괄호로 보인다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
import {
  type GraphEdge,
  type GraphNode,
  NodeGraph,
} from "../../../_viz/patterns/NodeGraph";
import {
  type TableCell,
  type TableOptions,
  type TablePiece,
  type TableStep,
  tableStage,
} from "../../../_viz/player/tableStage";
import { matrixChainMultiplication } from "./matrixChainMultiplication-guide.ref.ts";

const REF = new URL("./matrixChainMultiplication-guide.ref.ts", import.meta.url)
  .pathname;

type Fn = { matrixChainMultiplication(dims: number[]): number };

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 후보 하나를 비교하기 직전에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 기록은 DP 테이블(`dp`)을 가리키기만 하고, 칸의 값은 호출이 끝난 뒤
 * 읽는다. 칸은 한 번만 쓰이므로 끝난 뒤의 값이 곧 그 칸을 정한 순간의 값이다.
 */
const probed = await loadMutant<Fn>(REF, {
  swap: [
    /^(\s*)if \(cost < best\) best = cost;$/,
    "$1(globalThis as any).__cands.push({ i, j, k, left, right, join, cost, before: best, dp });\n$1if (cost < best) best = cost;",
  ],
});

/** 후보 하나를 만든 기록. 첨자는 정본과 같다(행렬 번호 1 부터). */
export interface Cand {
  readonly i: number;
  readonly j: number;
  readonly k: number;
  /** 구간 길이 `j − i + 1`. */
  readonly L: number;
  /** 왼쪽 조각 `dp[i][k]`. */
  readonly left: number;
  /** 오른쪽 조각 `dp[k+1][j]`. */
  readonly right: number;
  /** 합치는 비용 `p[i-1] · p[k] · p[j]`. */
  readonly join: number;
  readonly cost: number;
  /** 이 후보를 비교하기 전의 `best`. */
  readonly before: number;
  /** 비교한 뒤의 `best`. */
  readonly after: number;
  /** `less` ③ 지금까지의 최소보다 작다 · `notLess` ④ 작지 않다. */
  readonly branch: "less" | "notLess";
  /** 이 칸의 마지막 후보인가 — 그 걸음이 끝나면 `dp[i][j]` 가 정해진다. */
  readonly last: boolean;
}

export interface Trace {
  readonly p: readonly number[];
  readonly n: number;
  readonly cands: readonly Cand[];
  /** 호출이 끝난 뒤의 DP 테이블 전체(`dp[0]` 부터 `dp[n]` 까지, 0 번 줄·열은 비운 자리). */
  readonly dp: readonly (readonly number[])[];
  readonly result: number;
}

const traceCache = new Map<string, Trace>();

/** 정본 한 번 호출의 기록. 답은 정본과 대조하고, 후보마다 전이식이 실제로 성립했는지도 대조한다. */
export function trace(p: readonly number[]): Trace {
  const key = p.join(",");
  const hit = traceCache.get(key);
  if (hit) return hit;
  const g = globalThis as unknown as {
    __cands: {
      i: number;
      j: number;
      k: number;
      left: number;
      right: number;
      join: number;
      cost: number;
      before: number;
      dp: number[][];
    }[];
  };
  g.__cands = [];
  const result = probed.matrixChainMultiplication([...p]);
  const want = matrixChainMultiplication([...p]);
  if (result !== want) {
    throw new Error(
      `계측 사본이 정본과 다른 답을 냈다 — [${p.join(", ")}]: ${result} ≠ ${want}`,
    );
  }
  const raw = g.__cands;
  g.__cands = [];
  const n = p.length - 1;
  const dp = raw[0]
    ? raw[0].dp.map((r) => [...r])
    : Array.from({ length: Math.max(n, 0) + 1 }, () =>
        new Array<number>(Math.max(n, 0) + 1).fill(0),
      );
  const cands: Cand[] = raw.map((r, t) => {
    const next = raw[t + 1];
    const last = !next || next.i !== r.i || next.j !== r.j;
    const after = Math.min(r.before, r.cost);
    if (r.left !== dp[r.i]?.[r.k] || r.right !== dp[r.k + 1]?.[r.j]) {
      throw new Error(`dp[${r.i}][${r.j}] 의 k=${r.k} 후보가 읽은 칸이 다르다`);
    }
    const join =
      (p[r.i - 1] as number) * (p[r.k] as number) * (p[r.j] as number);
    if (r.join !== join || r.cost !== r.left + r.right + r.join) {
      throw new Error(`dp[${r.i}][${r.j}] 의 k=${r.k} 후보 값이 다르다`);
    }
    if (last && after !== dp[r.i]?.[r.j]) {
      throw new Error(`dp[${r.i}][${r.j}] 가 마지막 best 와 다르다`);
    }
    return {
      i: r.i,
      j: r.j,
      k: r.k,
      L: r.j - r.i + 1,
      left: r.left,
      right: r.right,
      join: r.join,
      cost: r.cost,
      before: r.before,
      after,
      branch: r.cost < r.before ? "less" : "notLess",
      last,
    };
  });
  // 후보를 만든 차례가 길이 → 왼쪽 끝 → 가르는 자리 오름차순인가. 아니면 걸음 번호가 코드의 차례와 어긋난다.
  const order: [number, number, number][] = [];
  for (let L = 2; L <= n; L++)
    for (let i = 1; i + L - 1 <= n; i++)
      for (let k = i; k < i + L - 1; k++) order.push([i, i + L - 1, k]);
  if (order.length !== cands.length) {
    throw new Error(`후보 수 ${cands.length} 가 ${order.length} 와 다르다`);
  }
  cands.forEach((c, t) => {
    const [i, j, k] = order[t] as [number, number, number];
    if (c.i !== i || c.j !== j || c.k !== k) {
      throw new Error(`${t} 번째 후보가 dp[${i}][${j}] 의 k=${k} 가 아니다`);
    }
  });
  if (n >= 2 && dp[1]?.[n] !== result) {
    throw new Error("오른쪽 위 칸이 반환값과 다르다");
  }
  const t: Trace = { p: [...p], n, cands, dp, result };
  traceCache.set(key, t);
  return t;
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). 본문의 다른 자리도 이 배열을 가리킨다. */
export const WALK = [10, 30, 5, 60, 10];
export const N = WALK.length - 1;

/** 과제 규모 — 행렬 수 `n` 의 위 끝과 차원의 위 끝. */
export const N_MAX = 100;
export const DIM_MAX = 500;

/** 본문이 여러 자리에서 함께 거는 입력 묶음. */
export const SAMPLES: readonly (readonly number[])[] = [
  WALK,
  [10, 30, 5, 60],
  [10, 20, 30, 40, 30],
  [40, 20, 30, 10, 30],
  [2, 3, 4, 2, 5],
  [1, 2, 3, 4],
  [5, 5, 5, 5],
];

/** 행렬 `m` 개짜리 차원 배열 — 값을 고르지 않고 식 하나로 만든다(`(13t mod 50) + 1`). */
export const genDims = (m: number): number[] =>
  Array.from({ length: m + 1 }, (_, t) => ((t * 13) % 50) + 1);

/** `10011001` → `10,011,001`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
export const comma = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 값을 적는다 — 아직 후보가 없는 `best` 는 ∞. */
export const fmt = (v: number): string => (Number.isFinite(v) ? comma(v) : "∞");

/** 차원 배열을 본문 표기 그대로 — `[10, 30, 5, 60, 10]` 꼴. */
export const label = (p: readonly number[]): string => `[${p.join(", ")}]`;

/** 구간 이름 — `A1 … A3`, 행렬 하나면 `A2`. */
export const span = (i: number, j: number): string =>
  i === j ? `A${i}` : `A${i} … A${j}`;

/** 칸 이름 — `dp[1][3]`. */
export const cellName = (i: number, j: number): string => `dp[${i}][${j}]`;

/** 행렬 `A_t` 의 크기 — `10×30`. */
export const sizeOf = (p: readonly number[], t: number): string =>
  `${p[t - 1]}×${p[t]}`;

/** 합치는 비용을 식으로 — `10·30·60`. */
export const joinExpr = (
  p: readonly number[],
  i: number,
  k: number,
  j: number,
): string => `${p[i - 1]}·${p[k]}·${p[j]}`;

/** 2 차원 표 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const TABLE_OPTIONS: TableOptions = {
  rowHeads: Array.from({ length: N }, (_, r) => `i=${r + 1}`),
  colHeads: Array.from({ length: N }, (_, c) => c + 1),
  colLabel: "j",
  strip: {
    label: "행렬 A_j",
    values: Array.from({ length: N }, (_, c) => sizeOf(WALK, c + 1)),
    side: `p = ${label(WALK)}`,
  },
};

/** 무대 칸 `[줄, 열]` — 정본 첨자 `(i, j)` 에서 하나씩 뺀다. */
const at = (i: number, j: number): TableCell => [i - 1, j - 1];

/** 아래쪽 삼각형 — 구간이 아니라 쓰지 않는 칸. */
const LOWER: TableCell[] = (() => {
  const out: TableCell[] = [];
  for (let i = 1; i <= N; i++) for (let j = 1; j < i; j++) out.push(at(i, j));
  return out;
})();

/** 줄 곁말 — 그 줄에서 쓰는 칸 가운데 정한 칸 수. */
const sideOf = (rows: readonly (readonly (string | null)[])[]): string[] =>
  rows.map(
    (row, r) =>
      `채움 ${row.filter((v, c) => c >= r && v !== null).length} / ${N - r}`,
  );

/** 다 채운 DP 테이블(무대 값) — 아래쪽 삼각형은 비운다. */
export function fullValues(p: readonly number[] = WALK): (string | null)[][] {
  const t = trace(p);
  return Array.from({ length: t.n }, (_, r) =>
    Array.from({ length: t.n }, (_, c) =>
      c < r ? null : fmt(t.dp[r + 1]?.[c + 1] as number),
    ),
  );
}

/** 칸 `(i, j)` 가 고른 가르는 자리 — 가장 작은 후보를 처음 낸 `k`. */
export function splitOf(i: number, j: number, p: readonly number[] = WALK) {
  const t = trace(p);
  const mine = t.cands.filter((c) => c.i === i && c.j === j);
  const best = mine.find((c) => c.cost === t.dp[i]?.[j]);
  if (!best) throw new Error(`dp[${i}][${j}] 의 가르는 자리가 없다`);
  return best.k;
}

/** 칸 `(i, j)` 의 가장 적은 배치를 고른 자리에서 거슬러 만든다 — `((A1A2)(A3A4))` 꼴. */
export function parenOf(
  i: number,
  j: number,
  p: readonly number[] = WALK,
): string {
  if (i === j) return `A${i}`;
  const k = splitOf(i, j, p);
  return `(${parenOf(i, k, p)}${parenOf(k + 1, j, p)})`;
}

/* ───────────────── 정본과 다른 절차 — 본문이 정본과 값으로 대조한다 ───────────────── */

/** 아무것도 기억하지 않는 재귀. 호출 하나와 후보 하나마다 센다. */
export function naiveCount(p: readonly number[]): {
  calls: number;
  cands: number;
} {
  const n = p.length - 1;
  let calls = 0;
  let cands = 0;
  const solve = (i: number, j: number): number => {
    calls++;
    if (i >= j) return 0;
    let best = Number.POSITIVE_INFINITY;
    for (let k = i; k < j; k++) {
      cands++;
      const c =
        solve(i, k) +
        solve(k + 1, j) +
        (p[i - 1] as number) * (p[k] as number) * (p[j] as number);
      if (c < best) best = c;
    }
    return best;
  };
  solve(1, n);
  return { calls, cands };
}

/**
 * 위 재귀가 만드는 후보 수의 점화식 — 행렬 `m` 개짜리 구간 하나가 만드는 후보를 `F(m)` 이라 하면
 * `F(1) = 0`, `F(m) = (m − 1) + Σ_{q=1..m-1} (F(q) + F(m − q))`. 실제로 못 실행할 크기에서도 정확한
 * 값을 낸다. 작은 값에서 `naiveCount` 와 같은지 아래에서 본다.
 */
export function candsByRecurrence(n: number): bigint {
  const f = new Array<bigint>(n + 1).fill(0n);
  for (let m = 2; m <= n; m++) {
    let sum = BigInt(m - 1);
    for (let q = 1; q < m; q++) sum += (f[q] as bigint) + (f[m - q] as bigint);
    f[m] = sum;
  }
  return f[n] as bigint;
}

for (const m of [2, 3, 4, 5, 6, 8]) {
  if (BigInt(naiveCount(genDims(m)).cands) !== candsByRecurrence(m)) {
    throw new Error(`후보 수 점화식이 실제 재귀와 어긋난다 — 행렬 ${m} 개`);
  }
}

/** 재귀가 각 구간을 몇 번 다시 푸는가. `hit[i][j]` 에 센다. */
export function solvedPerInterval(p: readonly number[]): number[][] {
  const n = p.length - 1;
  const hit = Array.from({ length: n + 2 }, () =>
    new Array<number>(n + 2).fill(0),
  );
  const solve = (i: number, j: number): number => {
    (hit[i] as number[])[j] = ((hit[i] as number[])[j] as number) + 1;
    if (i >= j) return 0;
    let best = Number.POSITIVE_INFINITY;
    for (let k = i; k < j; k++) {
      const c =
        solve(i, k) +
        solve(k + 1, j) +
        (p[i - 1] as number) * (p[k] as number) * (p[j] as number);
      if (c < best) best = c;
    }
    return best;
  };
  solve(1, n);
  return hit;
}

export type SplitRule = "left" | "right" | "mid";

/** 구간 하나를 정할 때 `k` 를 어느 자리 하나로 고정한 판. DP 테이블과 답을 돌려준다. */
export function fixedSplit(
  p: readonly number[],
  rule: SplitRule,
): { dp: number[][]; answer: number } {
  const n = p.length - 1;
  const dp = Array.from({ length: Math.max(n, 0) + 1 }, () =>
    new Array<number>(Math.max(n, 0) + 1).fill(0),
  );
  if (n <= 1) return { dp, answer: 0 };
  for (let L = 2; L <= n; L++) {
    for (let i = 1; i + L - 1 <= n; i++) {
      const j = i + L - 1;
      const k =
        rule === "left"
          ? i
          : rule === "right"
            ? j - 1
            : Math.floor((i + j) / 2);
      (dp[i] as number[])[j] =
        ((dp[i] as number[])[k] as number) +
        ((dp[k + 1] as number[])[j] as number) +
        (p[i - 1] as number) * (p[k] as number) * (p[j] as number);
    }
  }
  return { dp, answer: (dp[1] as number[])[n] as number };
}

export type FillOrder = "len" | "rowAsc" | "rowDesc" | "colAsc";

/**
 * 칸을 채우는 차례만 바꾼 판. `len` 이 정본과 같은 차례다. `filled` 는 칸마다 몇 번째로 정했는가
 * (대각선은 0), `reads` 는 칸마다 후보가 읽은 칸이 그때 이미 정해져 있었는가를 센다.
 */
export function fillByOrder(
  p: readonly number[],
  order: FillOrder,
): {
  dp: number[][];
  answer: number;
  filled: Map<string, number>;
  reads: { total: number; ready: number };
} {
  const n = p.length - 1;
  const dp = Array.from({ length: Math.max(n, 0) + 1 }, () =>
    new Array<number>(Math.max(n, 0) + 1).fill(0),
  );
  const filled = new Map<string, number>();
  for (let i = 1; i <= n; i++) filled.set(`${i},${i}`, 0);
  const reads = { total: 0, ready: 0 };
  let seq = 0;
  if (n <= 1) return { dp, answer: 0, filled, reads };
  const one = (i: number, j: number): void => {
    let best = Number.POSITIVE_INFINITY;
    for (let k = i; k < j; k++) {
      for (const key of [`${i},${k}`, `${k + 1},${j}`]) {
        reads.total++;
        if (filled.has(key)) reads.ready++;
      }
      const c =
        ((dp[i] as number[])[k] as number) +
        ((dp[k + 1] as number[])[j] as number) +
        (p[i - 1] as number) * (p[k] as number) * (p[j] as number);
      if (c < best) best = c;
    }
    (dp[i] as number[])[j] = best;
    filled.set(`${i},${j}`, ++seq);
  };
  if (order === "len") {
    for (let L = 2; L <= n; L++)
      for (let i = 1; i + L - 1 <= n; i++) one(i, i + L - 1);
  } else if (order === "rowAsc") {
    for (let i = 1; i <= n; i++) for (let j = i + 1; j <= n; j++) one(i, j);
  } else if (order === "rowDesc") {
    for (let i = n; i >= 1; i--) for (let j = i + 1; j <= n; j++) one(i, j);
  } else {
    for (let j = 2; j <= n; j++) for (let i = j - 1; i >= 1; i--) one(i, j);
  }
  return { dp, answer: (dp[1] as number[])[n] as number, filled, reads };
}

/** 이웃한 두 행렬 중 곱셈 비용이 가장 작은 쌍부터 없앤다. 같은 값이면 왼쪽 쌍이다. */
export function cheapestPairFirst(p: readonly number[]): {
  total: number;
  steps: { dims: number[]; at: number; cost: number; others: number[] }[];
} {
  const d = [...p];
  let total = 0;
  const steps: {
    dims: number[];
    at: number;
    cost: number;
    others: number[];
  }[] = [];
  while (d.length > 2) {
    let at = 1;
    let low = Number.POSITIVE_INFINITY;
    const all: number[] = [];
    for (let t = 1; t < d.length - 1; t++) {
      const c = (d[t - 1] as number) * (d[t] as number) * (d[t + 1] as number);
      all.push(c);
      if (c < low) {
        low = c;
        at = t;
      }
    }
    steps.push({ dims: [...d], at, cost: low, others: all });
    total += low;
    d.splice(at, 1);
  }
  return { total, steps };
}

/** 괄호 배치를 전수로 만든다. 작은 `n` 에서만 부른다. 배치 문자열과 결과 크기도 함께 낸다. */
export function enumerateParen(
  p: readonly number[],
  i: number,
  j: number,
): { expr: string; cost: number; k: number }[] {
  if (i === j) return [{ expr: `A${i}`, cost: 0, k: 0 }];
  const out: { expr: string; cost: number; k: number }[] = [];
  for (let k = i; k < j; k++) {
    for (const l of enumerateParen(p, i, k)) {
      for (const r of enumerateParen(p, k + 1, j)) {
        out.push({
          expr: `(${l.expr}${r.expr})`,
          cost:
            l.cost +
            r.cost +
            (p[i - 1] as number) * (p[k] as number) * (p[j] as number),
          k,
        });
      }
    }
  }
  return out;
}

/** 괄호 배치 수의 점화식 — `P(1) = 1`, `P(m) = Σ_{q=1..m-1} P(q)·P(m−q)`. */
export function parenByRecurrence(n: number): bigint {
  const f = new Array<bigint>(n + 1).fill(0n);
  f[1] = 1n;
  for (let m = 2; m <= n; m++) {
    let s = 0n;
    for (let q = 1; q < m; q++) s += (f[q] as bigint) * (f[m - q] as bigint);
    f[m] = s;
  }
  return f[n] as bigint;
}

/** 이항 계수 `C(a, b)`. */
export function binom(a: number, b: number): bigint {
  let r = 1n;
  for (let t = 0; t < b; t++) r = (r * BigInt(a - t)) / BigInt(t + 1);
  return r;
}

/** 닫힌 형태 — `C(2n−2, n−1) / n`. */
export const parenClosed = (n: number): bigint =>
  binom(2 * n - 2, n - 1) / BigInt(n);

// 점화식과 닫힌 형태가 어긋나면 「닫았다」가 거짓이다. 실행이 그것을 판정한다.
for (let n = 2; n <= 40; n++) {
  if (parenByRecurrence(n) !== parenClosed(n)) {
    throw new Error(`괄호 배치 수의 닫힌 형태가 점화식과 어긋난다 — n = ${n}`);
  }
}

/** DP 테이블이 만드는 후보의 총수 · 쓰는 칸 수 · 잡는 칸 수. */
export const candidates = (n: number): number => (n * n * n - n) / 6;
export const usedCells = (n: number): number => (n * (n + 1)) / 2;
export const tableCells = (n: number): number => (n + 1) * (n + 1);

// 후보 총수의 닫힌 형태를 정본이 실제로 만든 후보 수와 맞춰 둔다.
for (let n = 2; n <= 30; n++) {
  if (trace(genDims(n)).cands.length !== candidates(n)) {
    throw new Error(`후보 총수의 닫힌 형태가 실측과 어긋난다 — n = ${n}`);
  }
}

/** 자릿수가 21 을 넘으면 자리 수로 적는다 — `1.71 × 10^47` 꼴. */
export const big = (n: bigint): string => {
  const s = String(n);
  if (s.length <= 21) return comma(n);
  return `${s[0]}.${s.slice(1, 3)} × 10^${s.length - 1}`;
};

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly step: TableStep;
}

const MARK = { less: "③", notLess: "④" } as const;

/** 행렬 줄에 거는 괄호 셋 — 구간과 두 조각. */
function piecesOf(c: {
  i: number;
  j: number;
  k: number;
  left: number;
  right: number;
}): TablePiece[] {
  return [
    {
      label: "구간",
      from: c.i - 1,
      to: c.j - 1,
      tone: "query",
      text: span(c.i, c.j),
      side: cellName(c.i, c.j),
    },
    {
      label: "왼쪽",
      from: c.i - 1,
      to: c.k - 1,
      tone: "left",
      text: span(c.i, c.k),
      side: `${cellName(c.i, c.k)} = ${fmt(c.left)}`,
    },
    {
      label: "오른쪽",
      from: c.k,
      to: c.j - 1,
      tone: "right",
      text: span(c.k + 1, c.j),
      side: `${cellName(c.k + 1, c.j)} = ${fmt(c.right)}`,
    },
  ];
}

/** 후보 하나의 계산 한 줄. */
export const calcOf = (
  p: readonly number[],
  c: Cand,
): { expr: string; result: string } => ({
  expr: `${cellName(c.i, c.k)} + ${cellName(c.k + 1, c.j)} + ${joinExpr(p, c.i, c.k, c.j)} = ${fmt(c.left)} + ${fmt(c.right)} + ${fmt(c.join)} =`,
  result: fmt(c.cost),
});

/** 걸음 한 줄 설명. */
function detailOf(p: readonly number[], c: Cand): string {
  const whole = span(c.i, c.j);
  const join = fmt(c.join);
  const cost = fmt(c.cost);
  const before = fmt(c.before);
  const after = fmt(c.after);
  const head = `구간 ${whole}${을를(whole)} k = ${c.k} 에서 가릅니다. 왼쪽 조각 ${cellName(c.i, c.k)} = ${fmt(c.left)}, 오른쪽 조각 ${cellName(c.k + 1, c.j)} = ${fmt(c.right)}, 합치는 비용 ${joinExpr(p, c.i, c.k, c.j)} = ${join}${josa(join, "이라", "라")} 후보는 ${cost} 입니다.`;
  const cmp =
    c.branch === "less"
      ? `${cost} < ${before}${이가(before)} 참이라 ③ best 가 ${after}${이가(after)} 됩니다.`
      : `${cost} < ${before}${이가(before)} 거짓이라 ④ best 는 ${after} 그대로입니다.`;
  const end = c.last
    ? ` 후보를 다 만들었으니 ${cellName(c.i, c.j)} = ${after}${을를(after)} 적습니다.`
    : "";
  return `${head} ${cmp}${end}`;
}

/** 걸음 전부 — 대각선을 까는 한 걸음 + 후보마다 한 걸음 + 답을 읽는 한 걸음. */
export function walkSteps(): Step[] {
  const t = trace(WALK);
  const rows: (string | null)[][] = Array.from({ length: N }, (_, r) =>
    Array.from({ length: N }, (_, c) => (c === r ? "0" : null)),
  );
  const snapshot = () => rows.map((r) => [...r]);
  const steps: Step[] = [];
  let k = 1;
  const diag = Array.from({ length: N }, (_, r) => at(r + 1, r + 1));
  steps.push({
    id: `T${k++}`,
    title: "대각선 dp[i][i] = 0 ②",
    detail: `DP 테이블을 ${N + 1} × ${N + 1}${으로(String(N + 1))} 만들고 0 으로 채웁니다. 대각선 ${cellName(1, 1)} … ${cellName(N, N)}${은는(cellName(N, N))} 행렬 하나짜리 구간이라 곱셈이 없고, 깔아 둔 0 이 그대로 그 칸의 값입니다.`,
    step: {
      table: snapshot(),
      write: diag,
      out: LOWER,
      rowSide: sideOf(rows),
      calc: { expr: "dp[i][i] =", result: "0" },
    },
  });
  for (const c of t.cands) {
    if (c.last) (rows[c.i - 1] as (string | null)[])[c.j - 1] = fmt(c.after);
    steps.push({
      id: `T${k++}`,
      title: `${cellName(c.i, c.j)} · k=${c.k} → ${fmt(c.cost)} ${MARK[c.branch]}`,
      detail: detailOf(WALK, c),
      step: {
        table: snapshot(),
        read: [at(c.i, c.k), at(c.k + 1, c.j)],
        ...(c.last ? { write: [at(c.i, c.j)] } : { target: [at(c.i, c.j)] }),
        out: LOWER,
        rowSide: sideOf(rows),
        pieces: piecesOf(c),
        calc: calcOf(WALK, c),
        vars: `L = ${c.L} · best ${fmt(c.before)} → ${fmt(c.after)}`,
      },
    });
  }
  const last = t.dp[1]?.[N] as number;
  steps.push({
    id: `T${k++}`,
    title: `${cellName(1, N)} = ${fmt(last)} 반환`,
    detail: `행렬 전부를 덮는 구간은 ${span(1, N)} 하나이고, 그 칸이 오른쪽 위 ${cellName(1, N)} 입니다. 값 ${fmt(last)}${을를(fmt(last))} 돌려줍니다.`,
    step: {
      table: snapshot(),
      read: [at(1, N)],
      out: LOWER,
      rowSide: sideOf(rows),
      pieces: [
        {
          label: "구간",
          from: 0,
          to: N - 1,
          tone: "query",
          text: span(1, N),
          side: cellName(1, N),
        },
      ],
      calc: { expr: `${cellName(1, N)} =`, result: fmt(last) },
    },
  });
  return steps;
}

/** 필름과 패널을 가르는 자리 — 구간 길이마다 한 벌. 대각선은 첫 벌에, 답을 읽는 걸음은 마지막 벌에. */
export function walkParts(): { len2: Step[]; len3: Step[]; len4: Step[] } {
  const all = walkSteps();
  const t = trace(WALK);
  const count = (L: number) => t.cands.filter((c) => c.L === L).length;
  const a = 1 + count(2);
  const b = a + count(3);
  return { len2: all.slice(0, a), len3: all.slice(a, b), len4: all.slice(b) };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `matrixChainMultiplication-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const toStep = (s: Step) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...s.step,
  });
  const parts = walkParts();
  return {
    len2: parts.len2.map(toStep),
    len3: parts.len3.map(toStep),
    len4: parts.len4.map(toStep),
  };
}

/** 패널 `result` — 벌마다 그 벌에서 정한 칸의 값, 마지막 벌은 반환값. */
export function simResults(): { len2: string; len3: string; len4: string } {
  const t = trace(WALK);
  const of = (L: number) =>
    `[${t.cands
      .filter((c) => c.L === L && c.last)
      .map((c) => c.after)
      .join(", ")}]`;
  return { len2: of(2), len3: of(3), len4: String(t.result) };
}

const film = (steps: Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: tableStage(s.step, TABLE_OPTIONS),
  }));

/* ───────────────── 정적 한 장 ───────────────── */

/** 다 채운 DP 테이블 한 장. 줄 곁말은 그 줄의 구간이 어디서 시작하는가다. */
function fullTable(extra: Partial<TableStep>): StageRow[] {
  return tableStage(
    {
      table: fullValues(),
      out: LOWER,
      rowSide: Array.from({ length: N }, (_, r) => `A${r + 1} 에서 시작`),
      ...extra,
    },
    TABLE_OPTIONS,
  );
}

/** 칸 `(i, j)` 의 후보 하나를 한 장으로 — 본문의 개념 그림이 쓴다. */
function candFrame(i: number, j: number, k: number): StageFrame {
  const c = trace(WALK).cands.find((x) => x.i === i && x.j === j && x.k === k);
  if (!c) throw new Error(`dp[${i}][${j}] 의 k=${k} 후보 기록이 없다`);
  const { expr, result } = calcOf(WALK, c);
  return {
    id: `k=${k}`,
    text: `${expr} ${result}`,
    rows: fullTable({
      read: [at(i, k), at(k + 1, j)],
      write: [at(i, j)],
      pieces: piecesOf(c),
    }),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

function approaches(): Approach[] {
  const worst = SAMPLES[3] as readonly number[];
  const right = fixedSplit(worst, "right").answer;
  const best = matrixChainMultiplication([...worst]);
  const row = fillByOrder(WALK, "rowAsc").answer;
  const ans = matrixChainMultiplication([...WALK]);
  return [
    {
      name: "가르는 자리를 전부 시험하는 재귀",
      idea: "구간을 k 마다 두 조각으로 가르고, 두 조각을 같은 방법으로 다시 푼다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `행렬 ${N_MAX} 개에서 후보 ${big(candsByRecurrence(N_MAX))} 개`,
          ok: false,
        },
      ],
      lesson:
        "두 끝이 같은 구간은 어디서 내려왔든 답이 같다 — 구간마다 값을 한 번만 적어 두면 어떨까",
    },
    {
      name: "구간마다 한 칸 · 가르는 자리 하나로 고정",
      idea: "칸 (i, j) 를 k = j − 1 한 자리에서만 갈라 정한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `${label(worst)} 의 최소가 ${comma(best)}${이가(comma(best))} 아니라 ${comma(right)}`,
          ok: false,
        },
        {
          label: "시간",
          value: `후보 ${comma(usedCells(N_MAX) - N_MAX)} 개`,
          ok: true,
        },
      ],
      lesson:
        "한 구간의 마지막 곱셈은 j − i 가지뿐이다 — k 를 전부 시험하되, 읽는 칸이 먼저 정해져 있으려면 차례가 필요하다",
    },
    {
      name: "구간마다 한 칸 · 줄 차례로 채우기",
      idea: "k 를 전부 시험하고, 칸은 i 를 1 부터 · j 를 i 부터 채운다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `${label(WALK)} 의 최소가 ${comma(ans)}${이가(comma(ans))} 아니라 ${comma(row)}`,
          ok: false,
        },
        {
          label: "시간",
          value: `후보 ${comma(candidates(N_MAX))} 개`,
          ok: true,
        },
      ],
      lesson:
        "칸이 읽는 두 조각은 언제나 더 짧은 구간이다 — 짧은 구간부터 채우면 어떨까",
    },
    {
      name: "구간 길이 차례로 채우는 DP 테이블",
      idea: "(i, j) 칸에 최소 곱셈 횟수를 적고, 구간 길이가 짧은 칸부터 k 를 전부 시험해 채운다",
      verdict: "keep",
      checks: [
        { label: "답", value: `${comma(ans)} — 맞다`, ok: true },
        {
          label: "시간",
          value: `후보 ${comma(candidates(N_MAX))} 개`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 「알아 두면 좋은 개념」의 다각형 ───────────────── */

/** 고른 자리마다 삼각형 하나 — `(v_{i-1}, v_k, v_j)`. */
export function triangles(
  p: readonly number[] = WALK,
): { i: number; j: number; k: number; weight: number }[] {
  const out: { i: number; j: number; k: number; weight: number }[] = [];
  const walk = (i: number, j: number) => {
    if (i >= j) return;
    const k = splitOf(i, j, p);
    out.push({
      i,
      j,
      k,
      weight: (p[i - 1] as number) * (p[k] as number) * (p[j] as number),
    });
    walk(i, k);
    walk(k + 1, j);
  };
  walk(1, p.length - 1);
  return out;
}

function polygon(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const n = WALK.length;
  // 꼭짓점을 정다각형 둘레에 놓는다 — v0 이 왼쪽 아래이고, 번호 차례로 둘레를 따라 놓인다.
  const nodes: GraphNode[] = WALK.map((v, t) => {
    const a = Math.PI / 2 + Math.PI / n + (2 * Math.PI * t) / n;
    return {
      id: `v${t}`,
      x: Math.round(Math.cos(a) * 1.4 * 100) / 100,
      y: Math.round(Math.sin(a) * 1.2 * 100) / 100,
      label: `v${t}`,
      value: `p=${v}`,
    };
  });
  const edges: GraphEdge[] = [];
  for (let t = 1; t < n; t++) {
    edges.push({
      from: `v${t - 1}`,
      to: `v${t}`,
      kind: "plain",
      label: `A${t}`,
    });
  }
  edges.push({ from: "v0", to: `v${n - 1}`, kind: "plain", label: "결과" });
  for (const tri of triangles()) {
    // 삼각형의 세 변 가운데 다각형의 변이 아닌 것이 자르는 선이다.
    for (const [a, b] of [
      [tri.i - 1, tri.k],
      [tri.k, tri.j],
    ] as [number, number][]) {
      if (b - a >= 2 && !(a === 0 && b === n - 1)) {
        if (!edges.some((e) => e.from === `v${a}` && e.to === `v${b}`)) {
          edges.push({
            from: `v${a}`,
            to: `v${b}`,
            kind: "tree",
            state: "focus",
          });
        }
      }
    }
  }
  return { nodes, edges };
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-table": () => (
    <CellStage
      title={`matrixChainMultiplication(${label(WALK)}) 의 DP 테이블 — 칸 (i, j) 는 구간 A_i … A_j`}
      rows={fullTable({})}
      columns={N}
    />
  ),
  "concept-rule": () => (
    <CellStageFilm
      title={`${cellName(1, N)} 을 정하는 자리 — 가르는 자리 k 마다 두 칸을 읽는다`}
      columns={N}
      frames={Array.from({ length: N - 1 }, (_, t) => candFrame(1, N, t + 1))}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`행렬 ${N_MAX} 개까지 · 차원 ${DIM_MAX} 이하`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-read-cell": () => {
    const i = 2;
    const j = N;
    const k = splitOf(i, j);
    const c = trace(WALK).cands.find(
      (x) => x.i === i && x.j === j && x.k === k,
    ) as Cand;
    const out: TableCell[] = [];
    for (let r = 1; r <= N; r++)
      for (let q = 1; q <= N; q++) if (r !== i || q !== j) out.push(at(r, q));
    return (
      <CellStage
        title={`${cellName(i, j)} — 구간 ${span(i, j)} 을 하나로 곱하는 최소 곱셈 횟수`}
        rows={fullTable({ write: [at(i, j)], out, pieces: piecesOf(c) })}
        columns={N}
      />
    );
  },
  "build-neighbors": () => {
    const read: TableCell[] = [];
    for (let k = 1; k < N; k++) read.push(at(1, k), at(k + 1, N));
    return (
      <CellStage
        title={`${cellName(1, N)} 이 읽는 칸 — 같은 줄 왼쪽 셋과 같은 열 아래 셋`}
        rows={fullTable({
          write: [at(1, N)],
          read,
          pieces: [
            {
              label: "구간",
              from: 0,
              to: N - 1,
              tone: "query",
              text: span(1, N),
              side: cellName(1, N),
            },
          ],
        })}
        columns={N}
      />
    );
  },
  "build-diagonals": () => (
    <CellStageFilm
      title="대각선 하나가 구간 길이 하나 — 길이 L 인 칸은 n − L + 1 개"
      columns={N}
      frames={Array.from({ length: N }, (_, t) => {
        const L = t + 1;
        const cells: TableCell[] = [];
        for (let i = 1; i + L - 1 <= N; i++) cells.push(at(i, i + L - 1));
        return {
          id: `L=${L}`,
          text: `구간 길이 ${L} · 칸 ${cells.length} 개 · ${cells
            .map(([r, c]) => span(r + 1, c + 1))
            .join(" · ")}`,
          rows: fullTable({ write: cells }),
        };
      })}
    />
  ),
  "build-contrast": () => {
    const good = fullValues();
    const bad = fillByOrder(WALK, "rowAsc").dp;
    const read: TableCell[] = [];
    const badValues = good.map((row, r) =>
      row.map((v, c) => {
        if (v === null) return null;
        const w = fmt(bad[r + 1]?.[c + 1] as number);
        if (w !== v) read.push([r, c]);
        return w;
      }),
    );
    const frames: StageFrame[] = [
      {
        id: "길이",
        text: "구간 길이가 짧은 칸부터 채운 DP 테이블",
        rows: tableStage(
          {
            table: good,
            out: LOWER,
            read,
            rowSide: good.map(() => ""),
          },
          { ...TABLE_OPTIONS, strip: undefined },
        ),
      },
      {
        id: "줄",
        text: "i 를 1 부터 · j 를 i 부터 채운 판 — 진한 테가 앞 장과 값이 다른 칸",
        rows: tableStage(
          {
            table: badValues,
            out: LOWER,
            read,
            rowSide: good.map(() => ""),
          },
          { ...TABLE_OPTIONS, strip: undefined },
        ),
      },
    ];
    return (
      <CellStageFilm
        title={`같은 입력 ${label(WALK)} — 채우는 차례만 바꾼 두 DP 테이블`}
        columns={N}
        frames={frames}
      />
    );
  },
  "walk-len2": () => {
    const s = walkParts().len2;
    return (
      <CellStageFilm
        title={`matrixChainMultiplication(${label(WALK)}) — ${s[0]?.id}~${s.at(-1)?.id} · 대각선과 구간 길이 2`}
        columns={N}
        frames={film(s)}
      />
    );
  },
  "walk-len3": () => {
    const s = walkParts().len3;
    return (
      <CellStageFilm
        title={`matrixChainMultiplication(${label(WALK)}) — ${s[0]?.id}~${s.at(-1)?.id} · 구간 길이 3`}
        columns={N}
        frames={film(s)}
      />
    );
  },
  "walk-len4": () => {
    const s = walkParts().len4;
    return (
      <CellStageFilm
        title={`matrixChainMultiplication(${label(WALK)}) — ${s[0]?.id}~${s.at(-1)?.id} · 구간 길이 4 와 답`}
        columns={N}
        frames={film(s)}
      />
    );
  },
  "related-polygon": () => {
    const { nodes, edges } = polygon();
    return (
      <NodeGraph
        title={`차원 배열 ${label(WALK)} 을 꼭짓점 다섯의 볼록 다각형으로 — 굵은 선이 DP 테이블이 고른 자르는 선`}
        nodes={nodes}
        edges={edges}
        directed={false}
      />
    );
  },
};
