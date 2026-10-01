/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-guide.md
 *
 * **비용은 원고 전체가 후보 수 하나로 센다.** 가르는 자리 `j` 하나를 넣어
 * `prev[j] + cost[j+1][i]` 를 만들고 지금까지의 최솟값과 비교한 한 번이 1 이다. 대안 비교
 * 사이드카(`-guide.alt.ts`)도 같은 잣대를 쓴다.
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 계산했는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 표의 「답」 칸은 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수와 중간 상태만
 * 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **큰 규모에는 기록 없는 사본을 쓴다.** `record` 는 호출마다 이번 줄을 복사하므로 작은 입력에만
 * 쓴다(`n ≤ 64` 가 아니면 던진다). 계수만 필요한 자리는 `countedLite` 쪽이다 — 절차는 같고
 * 기록만 뺐다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  N as ALT_N,
  countAt,
  crossing,
  K_SHOWN,
  sweepK,
  분할정복,
  크누스,
} from "./divideAndConquerDp-guide.alt.ts";
import { divideAndConquerDp, INF } from "./divideAndConquerDp-guide.ref.ts";

/* ────────────────────────── 입력 ────────────────────────── */

/** `cost[i][j] = (a[i] + … + a[j])^2`. `i > j` 인 칸은 구간이 아니라 0 으로 둔다. */
export function buildCost(a: readonly number[]): number[][] {
  const n = a.length;
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++)
    prefix[i + 1] = (prefix[i] as number) + (a[i] as number);
  const cost: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  for (let i = 0; i < n; i++) {
    const row = cost[i] as number[];
    for (let j = i; j < n; j++) {
      const s = (prefix[j + 1] as number) - (prefix[i] as number);
      row[j] = s * s;
    }
  }
  return cost;
}

/**
 * 「전체 컨셉」과 「수행으로 알아보는 알고리즘」이 쓰는 입력 — 네 칸을 세 구역으로 나눈다.
 *
 * 일곱 갈래를 한 입력에서 전부 실행한다. `k = 3` 이라 줄 교체가 실제로 두 번 일어나고,
 * `mid = 0` 인 호출이 나와 후보가 하나도 없는 칸이 나온다.
 */
export const WALK_A = [1, 2, 3, 4];
export const WALK_K = 3;

/** `a = [1, 2, …, n]` — 「아이디어를 떠올리는 과정」과 「아이디어 상세」가 쓰는 입력의 모양. */
export const seq = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => i + 1);

/** 「아이디어를 떠올리는 과정」·「아이디어 상세」의 작은 입력 — 여덟 칸을 세 구역으로. */
export const SMALL_A = seq(8);
export const SMALL_K = 3;

/** 재귀가 후보 범위를 넘기는 모양을 한 줄 통째로 펼칠 때의 칸 수. */
export const REC_N = 16;

/** 값이 모두 같은 배열. 최적 가르는 자리가 고르게 퍼진다. */
export const flat = (n: number): number[] => new Array<number>(n).fill(1);

/** `a[i] = (i * 7 % 5) + 1` — `.alt.ts` 와 같은 생성식이다. */
export const line = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => ((i * 7) % 5) + 1);

/** 첫 칸만 크고 나머지가 1 인 배열. 최적 가르는 자리가 앞에 몰린다. */
export const head = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => (i === 0 ? 1000 : 1));

/**
 * **사각 부등식이 깨지는 비용 행렬.** 구간이 넓을수록 비용이 줄지 않고 `dp[2][i]` 도 `i` 를 따라
 * 줄지 않는데, 최적 가르는 자리는 뒤로 되돌아가고 범위를 좁힌 절차가 최솟값을 놓친다. 칸 0~9 의
 * 정수로 된 4 × 4 행렬을 준무작위로 만들어 그 셋을 다 만족하는 것을 고른 것이다.
 */
export const QI_BREAK: number[][] = [
  [0, 4, 8, 9],
  [0, 4, 8, 8],
  [0, 0, 1, 7],
  [0, 0, 0, 7],
];

/**
 * **사각 부등식은 만족하지만 후보 상한을 안 자르면 답이 갈리는 비용 행렬.** `i > j` 칸이 0 이라
 * `j ≥ mid` 인 후보가 「없는 구간을 0 에 묶는다」로 읽힌다.
 */
export const CAP_BREAK: number[][] = [
  [5, 3, 1, 8],
  [0, 9, 6, 8],
  [0, 0, 9, 0],
  [0, 0, 0, 11],
];

/** 과제 규모 — `n` 의 상한. `k` 의 상한은 `n` 이다. */
export const N_MAX = 2_000;
/** 후보 하나를 1 억 분의 1 초로 어림한다. */
export const PER_SEC = 100_000_000;
/** 비용 행렬 한 칸을 8 바이트 수로 적는다. */
const BYTES = 8;

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** `1961241` → `1,961,241`. */
export const num = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 코드의 `Number.POSITIVE_INFINITY` 를 본문 표기 `INF` 로 적는다. */
export const cell = (v: number): string => (v === INF ? "INF" : num(v));

/** 값 나열 `1 9 36 100` — 구간 표기 `[a,b]` 와 갈라 적는다(`L25`). */
export const show = (xs: readonly (number | null)[]): string =>
  xs.map((v) => (v === null ? "·" : cell(v))).join(" ");

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
export function md(
  head: readonly string[],
  rows: readonly (readonly string[])[],
  right: readonly number[] = [],
): string {
  const align = head.map((_, i) => (right.includes(i) ? "---:" : "---"));
  const row = (cells: readonly string[]) => `| ${cells.join(" | ")} |`;
  return [row(head), row(align), ...rows.map(row)].join("\n");
}

/** 초 — 후보 하나를 1 억 분의 1 초로. */
export const seconds = (count: number): string => {
  const s = count / PER_SEC;
  return `${s < 1 ? s.toFixed(2) : num(Math.round(s))} 초`;
};

/** 계층 하나의 후보 수에 대한 상한 `n ⌈log2(n+1)⌉ + 2n`. 「수식 정의와 유도」가 유도한다. */
export const layerBound = (n: number): number =>
  n * Math.ceil(Math.log2(n + 1)) + 2 * n;

/** 가르는 자리를 전부 계산하는 방법의 후보 수 `(k-1) n (n-1) / 2`. */
export const fullFormula = (n: number, k: number): number =>
  ((k - 1) * n * (n - 1)) / 2;

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** 후보 하나 — 가르는 자리 `j`, 만든 값, 그 값이 최솟값을 고쳤는가, 비교한 그때의 최솟값. */
export interface Cand {
  j: number;
  val: number;
  better: boolean;
  before: number;
}

/** 비지 않은 `solve` 한 번의 기록. */
export interface Call {
  layer: number;
  lo: number;
  hi: number;
  optLo: number;
  optHi: number;
  mid: number;
  upper: number;
  cands: Cand[];
  best: number;
  bestOpt: number;
  /** 재귀의 깊이. 줄마다의 첫 호출이 0 이다. */
  depth: number;
  /** 이 호출 바로 아래에서 빈 범위로 곧장 반환한 자식 호출의 `[lo, hi]`. */
  empties: [number, number][];
  /** 이 호출이 끝난 시점의 이번 줄. 아직 안 쓴 칸은 `null`. */
  after: (number | null)[];
}

export interface Recorded {
  answer: number;
  /** 줄 1..k 의 최종 값. */
  rows: number[][];
  /** 비지 않은 호출을 부른 차례대로. */
  calls: Call[];
  /** 빈 범위로 곧장 반환한 호출 수. */
  emptyCalls: number;
  /** 후보 수. */
  checks: number;
  /** 줄마다의 후보 수. 첫 원소가 줄 2 다. */
  perLayer: number[];
  /** 최솟값을 실제로 고친 횟수. */
  updates: number;
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본 — 작은 입력 전용. */
export function record(cost: number[][], k: number): Recorded {
  const n = cost.length;
  if (n > 64) throw new Error(`record 는 작은 입력 전용이다 — n = ${n}`);
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;
  const rows: number[][] = [prev.slice()];
  const calls: Call[] = [];
  let emptyCalls = 0;
  let checks = 0;
  let updates = 0;
  const perLayer: number[] = [];

  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);
    const written: (number | null)[] = new Array<number | null>(n).fill(null);
    let layerChecks = 0;

    /** 빈 범위면 `[lo, hi]` 를 돌려주고 아무것도 안 한다. */
    const solve = (
      lo: number,
      hi: number,
      optLo: number,
      optHi: number,
      depth: number,
    ): [number, number] | null => {
      if (lo > hi) {
        emptyCalls++;
        return [lo, hi];
      }
      const mid = (lo + hi) >> 1;
      let bestCost = INF;
      let bestOpt = optLo;
      const upper = Math.min(optHi, mid - 1);
      const cands: Cand[] = [];
      for (let j = optLo; j <= upper; j++) {
        checks++;
        layerChecks++;
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[mid] as number);
        const better = val < bestCost;
        cands.push({ j, val, better, before: bestCost });
        if (better) {
          bestCost = val;
          bestOpt = j;
          updates++;
        }
      }
      cur[mid] = bestCost;
      written[mid] = bestCost;
      const call: Call = {
        layer: g,
        lo,
        hi,
        optLo,
        optHi,
        mid,
        upper,
        cands,
        best: bestCost,
        bestOpt,
        depth,
        empties: [],
        after: written.slice(),
      };
      calls.push(call);
      const left = solve(lo, mid - 1, optLo, bestOpt, depth + 1);
      if (left) call.empties.push(left);
      const right = solve(mid + 1, hi, bestOpt, optHi, depth + 1);
      if (right) call.empties.push(right);
      return null;
    };

    solve(0, n - 1, 0, n - 2, 0);
    perLayer.push(layerChecks);
    rows.push(cur.slice());
    prev = cur;
  }

  return {
    answer: prev[n - 1] as number,
    rows,
    calls,
    emptyCalls,
    checks,
    perLayer,
    updates,
  };
}

/** 기록 없이 계수만 내는 사본. 큰 규모는 이쪽을 쓴다. */
export function countedLite(
  cost: number[][],
  k: number,
): { answer: number; checks: number; calls: number; perLayer: number[] } {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;
  let checks = 0;
  let calls = 0;
  const perLayer: number[] = [];

  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);
    const before = checks;
    const solve = (
      lo: number,
      hi: number,
      optLo: number,
      optHi: number,
    ): void => {
      calls++;
      if (lo > hi) return;
      const mid = (lo + hi) >> 1;
      let bestCost = INF;
      let bestOpt = optLo;
      const upper = Math.min(optHi, mid - 1);
      for (let j = optLo; j <= upper; j++) {
        checks++;
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[mid] as number);
        if (val < bestCost) {
          bestCost = val;
          bestOpt = j;
        }
      }
      cur[mid] = bestCost;
      solve(lo, mid - 1, optLo, bestOpt);
      solve(mid + 1, hi, bestOpt, optHi);
    };
    solve(0, n - 1, 0, n - 2);
    perLayer.push(checks - before);
    prev = cur;
  }
  return { answer: prev[n - 1] as number, checks, calls, perLayer };
}

/**
 * 가운데 대신 다른 자리를 먼저 채우는 판 — 「가운데 칸을 먼저 채우는 까닭」의 설계 시험.
 * `pick(lo, hi)` 가 먼저 채울 칸을 고른다. 나머지는 정본과 같다.
 */
export function countedPivot(
  cost: number[][],
  k: number,
  pick: (lo: number, hi: number) => number,
): { answer: number; checks: number; depth: number } {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;
  let checks = 0;
  let depth = 0;
  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);
    const solve = (
      lo: number,
      hi: number,
      optLo: number,
      optHi: number,
      d: number,
    ): void => {
      if (lo > hi) return;
      depth = Math.max(depth, d);
      const mid = pick(lo, hi);
      let bestCost = INF;
      let bestOpt = optLo;
      const upper = Math.min(optHi, mid - 1);
      for (let j = optLo; j <= upper; j++) {
        checks++;
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[mid] as number);
        if (val < bestCost) {
          bestCost = val;
          bestOpt = j;
        }
      }
      cur[mid] = bestCost;
      solve(lo, mid - 1, optLo, bestOpt, d + 1);
      solve(mid + 1, hi, bestOpt, optHi, d + 1);
    };
    solve(0, n - 1, 0, n - 2, 1);
    prev = cur;
  }
  return { answer: prev[n - 1] as number, checks, depth };
}

/** 먼저 채울 칸을 고르는 규칙 셋 — 왼쪽 끝 · 4 분의 1 자리 · 가운데. */
export const PIVOTS: [string, (lo: number, hi: number) => number][] = [
  ["왼쪽 끝", (lo) => lo],
  ["4 분의 1 자리", (lo, hi) => lo + ((hi - lo) >> 2)],
  ["가운데", (lo, hi) => (lo + hi) >> 1],
];

/** 가르는 자리를 전부 계산하는 방법. 최적 가르는 자리도 함께 적는다(없으면 -1). */
export function fullScan(
  cost: number[][],
  k: number,
): { answer: number; checks: number; rows: number[][]; opts: number[][] } {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;
  const rows: number[][] = [prev.slice()];
  const opts: number[][] = [];
  let checks = 0;

  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);
    const opt: number[] = new Array<number>(n).fill(-1);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < i; j++) {
        checks++;
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[i] as number);
        if (val < (cur[i] as number)) {
          cur[i] = val;
          opt[i] = j;
        }
      }
    }
    rows.push(cur.slice());
    opts.push(opt);
    prev = cur;
  }
  return { answer: prev[n - 1] as number, checks, rows, opts };
}

/**
 * 하한만 옮기는 방법 — `i` 를 왼쪽에서 오른쪽으로 채우되 `j` 를 직전 칸의 최적 가르는
 * 자리에서 시작한다. 단조성의 절반(하한)만 쓰고 상한은 그대로 `i - 1` 이다.
 */
export function sweep(
  cost: number[][],
  k: number,
): { answer: number; checks: number; ranges: [number, number][][] } {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;
  let checks = 0;
  const ranges: [number, number][][] = [];
  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);
    const r: [number, number][] = [];
    let low = 0;
    for (let i = 0; i < n; i++) {
      let bestOpt = low;
      r.push([low, i - 1]);
      for (let j = low; j <= i - 1; j++) {
        checks++;
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[i] as number);
        if (val < (cur[i] as number)) {
          cur[i] = val;
          bestOpt = j;
        }
      }
      low = bestOpt;
    }
    ranges.push(r);
    prev = cur;
  }
  return { answer: prev[n - 1] as number, checks, ranges };
}

/** 사각 부등식을 지표 넷의 모든 조합에서 확인한다. */
export function quadrangle(cost: number[][]): {
  tested: number;
  broken: [number, number, number, number][];
} {
  const n = cost.length;
  let tested = 0;
  const broken: [number, number, number, number][] = [];
  for (let a = 0; a < n; a++)
    for (let b = a; b < n; b++)
      for (let c = b; c < n; c++)
        for (let d = c; d < n; d++) {
          tested++;
          const lhs =
            ((cost[a] as number[])[c] as number) +
            ((cost[b] as number[])[d] as number);
          const rhs =
            ((cost[a] as number[])[d] as number) +
            ((cost[b] as number[])[c] as number);
          if (lhs > rhs) broken.push([a, b, c, d]);
        }
  return { tested, broken };
}

/** 분할을 전부 만들어 비용 합이 가장 작은 것을 고른다. 작은 입력에서만 부른다. */
export function partitions(
  cost: number[][],
  k: number,
): { count: number; best: number; all: { cuts: number[]; parts: number[] }[] } {
  const n = cost.length;
  const all: { cuts: number[]; parts: number[] }[] = [];
  const walk = (start: number, left: number, cuts: number[]): void => {
    if (left === 1) {
      const ends = [...cuts, n - 1];
      let from = 0;
      const parts = ends.map((end) => {
        const v = (cost[from] as number[])[end] as number;
        from = end + 1;
        return v;
      });
      all.push({ cuts: ends, parts });
      return;
    }
    for (let end = start; end <= n - left; end++)
      walk(end + 1, left - 1, [...cuts, end]);
  };
  walk(0, k, []);
  const best = Math.min(...all.map((p) => p.parts.reduce((s, v) => s + v, 0)));
  return { count: all.length, best, all };
}

/** `C(a, b)` 의 자릿수. 배열에 안 들어가는 규모에서는 자릿수만 낸다. */
export function chooseDigits(a: number, b: number): number {
  let log10 = 0;
  for (let i = 1; i <= b; i++) log10 += Math.log10(a - b + i) - Math.log10(i);
  return Math.floor(log10) + 1;
}

/** `C(a, b)` — 작은 값에서만 부른다. */
function choose(a: number, b: number): number {
  if (b < 0 || b > a) return 0;
  let out = 1;
  for (let i = 1; i <= b; i++) out = (out * (a - b + i)) / i;
  return Math.round(out);
}

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  const inputs: [number[][], number][] = [
    [buildCost(WALK_A), WALK_K],
    [buildCost(SMALL_A), SMALL_K],
    [buildCost(flat(8)), 3],
    [buildCost(line(16)), 4],
    [buildCost(head(9)), 2],
    [CAP_BREAK, 2],
  ];
  for (const [cost, k] of inputs) {
    const want = divideAndConquerDp(cost, k);
    if (record(cost, k).answer !== want)
      throw new Error("기록하는 사본이 정본과 다른 답을 낸다");
    if (countedLite(cost, k).answer !== want)
      throw new Error("기록 없는 사본이 정본과 다른 답을 낸다");
    if (fullScan(cost, k).answer !== want)
      throw new Error("전부 계산하는 사본이 정본과 다른 답을 낸다");
    if (sweep(cost, k).answer !== want)
      throw new Error("하한만 옮기는 사본이 정본과 다른 답을 낸다");
    for (const [name, pick] of PIVOTS)
      if (countedPivot(cost, k, pick).answer !== want)
        throw new Error(`${name} 판이 정본과 다른 답을 낸다`);
  }
}
자기대조();

/* ────────────────────────── 전개의 걸음 ────────────────────────── */

export type Branch = "①" | "②" | "③" | "④" | "⑤" | "⑥" | "⑦";

/** 전개의 걸음 하나. `T1` 부터 `T12` 까지. */
export interface WalkStep {
  id: string;
  kind: "base" | "call" | "swap" | "return";
  /** 이 걸음이 채우거나 다룬 줄 번호 `g`. */
  layer: number;
  call: Call | null;
  /** 걸음이 끝난 뒤의 DP 테이블 — 줄 1..k, 아직 안 쓴 칸은 `null`. */
  table: (number | null)[][];
  /** 이 걸음에서 실행된 갈래. */
  branches: Branch[];
}

/** 정본과 같은 절차를 걸음으로 나눈다. 반환값이 정본과 같은지 스스로 확인한다. */
export function walkSteps(
  a: readonly number[] = WALK_A,
  k: number = WALK_K,
): WalkStep[] {
  const cost = buildCost(a);
  const r = record(cost, k);
  const n = a.length;
  if (r.answer !== divideAndConquerDp(cost, k))
    throw new Error("걸음 기록이 정본과 다른 답을 낸다");
  const table: (number | null)[][] = Array.from({ length: k }, () =>
    new Array<number | null>(n).fill(null),
  );
  table[0] = (r.rows[0] as number[]).slice();
  const snap = () => table.map((row) => row.slice());
  const out: WalkStep[] = [];
  let t = 1;
  out.push({
    id: `T${t++}`,
    kind: "base",
    layer: 1,
    call: null,
    table: snap(),
    branches: ["①"],
  });
  for (let g = 2; g <= k; g++) {
    const calls = r.calls.filter((c) => c.layer === g);
    for (const [ci, c] of calls.entries()) {
      table[g - 1] = c.after.slice();
      const branches: Branch[] = [];
      if (ci === 0) branches.push("②");
      branches.push("④");
      if (c.cands.some((x) => x.better)) branches.push("⑤");
      branches.push("⑥");
      if (c.empties.length > 0) branches.push("③");
      out.push({
        id: `T${t++}`,
        kind: "call",
        layer: g,
        call: c,
        table: snap(),
        branches,
      });
    }
    out.push({
      id: `T${t++}`,
      kind: "swap",
      layer: g,
      call: null,
      table: snap(),
      branches: ["⑦"],
    });
  }
  out.push({
    id: `T${t}`,
    kind: "return",
    layer: k,
    call: null,
    table: snap(),
    branches: [],
  });
  return out;
}

/** 호출 표기 `solve(0, 3, 0, 2)`. */
export const callName = (c: {
  lo: number;
  hi: number;
  optLo: number;
  optHi: number;
}): string => `solve(${c.lo}, ${c.hi}, ${c.optLo}, ${c.optHi})`;

/** 후보 범위 표기 — 비면 「없음」까지 적는다. */
export const rangeName = (c: Call): string =>
  c.upper < c.optLo
    ? `[${c.optLo},${c.upper}] — 없음`
    : `[${c.optLo},${c.upper}]`;

/** 걸음 하나의 조건 판정 — 분기 조건의 참 · 거짓을 실제 값으로. */
export function stepConditions(s: WalkStep, n: number): string {
  if (s.kind === "base")
    return `dp[1][i] = cost[0][i] 를 i = 0 … ${n - 1} 에 적는다`;
  if (s.kind === "swap")
    return `prev = cur — 줄 ${s.layer}${이가(s.layer)} 이전 줄이 된다`;
  if (s.kind === "return") {
    const v = cell((s.table[s.layer - 1] as number[])[n - 1] as number);
    return `prev[${n - 1}] = ${v}${을를(v)} 돌려준다`;
  }
  const c = s.call as Call;
  const parts: string[] = [];
  parts.push(`\`${c.lo} > ${c.hi}\` 거짓`);
  parts.push(
    `upper = min(${c.optHi}, ${c.mid - 1}) = ${c.upper}${c.upper < c.optLo ? " · 후보 없음" : ""}`,
  );
  for (const x of c.cands)
    parts.push(
      `j=${x.j}: \`${cell(x.val)} < ${cell(x.before)}\` ${x.better ? "참" : "거짓"}`,
    );
  for (const [lo, hi] of c.empties)
    parts.push(`자식 solve(${lo}, ${hi}, …): \`${lo} > ${hi}\` 참 ③`);
  return parts.join(" · ");
}

/** 걸음 하나가 한 일 한 줄. */
export function stepTitle(s: WalkStep): string {
  switch (s.kind) {
    case "base":
      return "줄 1 을 채운다";
    case "swap":
      return `줄 ${s.layer}${을를(s.layer)} 이전 줄로 삼는다`;
    case "return":
      return "마지막 칸을 돌려준다";
    default: {
      const c = s.call as Call;
      return `줄 ${c.layer} · ${callName(c)} · 칸 ${c.mid}`;
    }
  }
}

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./divideAndConquerDp-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  divideAndConquerDp(cost: number[][], k: number): number;
}

/** 후보 상한을 `mid - 1` 로 자르는 줄을 `optHi` 로 바꾼 사본. */
const noCap = await loadMutant<Impl>(REF, {
  swap: [/const upper = Math\.min\(optHi, mid - 1\);/, "const upper = optHi;"],
});

/** 줄마다 새 배열을 만드는 줄을 이전 줄 배열로 바꾼 사본. */
const sharedRow = await loadMutant<Impl>(REF, {
  swap: [
    /const cur: number\[\] = new Array<number>\(n\)\.fill\(INF\);/,
    "const cur: number[] = prev;",
  ],
});

/** **불변식을 지키던 줄** 하나 — 줄을 교체하는 줄을 뺀 사본. */
const noRoll = await loadMutant<Impl>(REF, { drop: /prev = cur;/ });

const MUTANT_CASES: { label: string; cost: number[][]; k: number }[] = [
  { label: "전개 입력", cost: buildCost(WALK_A), k: WALK_K },
  { label: "값이 모두 같은 배열", cost: buildCost(flat(5)), k: 3 },
  { label: "다른 비용 행렬", cost: CAP_BREAK, k: 2 },
];

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = noCap.divideAndConquerDp === divideAndConquerDp;

// 하나도 갈리지 않으면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  for (const [label, impl] of [
    ["상한을 안 자른 판", noCap],
    ["줄 배열을 함께 쓴 판", sharedRow],
    ["줄을 안 바꾼 판", noRoll],
  ] as [string, Impl][]) {
    if (
      MUTANT_CASES.every(
        (c) =>
          divideAndConquerDp(c.cost, c.k) ===
          impl.divideAndConquerDp(c.cost, c.k),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/**
 * 상한을 안 자른 판의 DP 테이블과 호출. 정본과 같은 절차에서 그 한 줄만 바꾼 사본이다. 변이 모듈은
 * 반환값 하나만 내므로 중간 상태를 볼 수 없다. 이 사본이 변이 모듈과 같은 답을 내는지는 아래에서
 * 확인한다.
 */
export function recordNoCap(
  cost: number[][],
  k: number,
): { answer: number; rows: number[][]; calls: Call[] } {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;
  const rows: number[][] = [prev.slice()];
  const calls: Call[] = [];
  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);
    const solve = (
      lo: number,
      hi: number,
      optLo: number,
      optHi: number,
      depth: number,
    ): void => {
      if (lo > hi) return;
      const mid = (lo + hi) >> 1;
      let bestCost = INF;
      let bestOpt = optLo;
      const upper = optHi;
      const cands: Cand[] = [];
      for (let j = optLo; j <= upper; j++) {
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[mid] as number);
        const better = val < bestCost;
        cands.push({ j, val, better, before: bestCost });
        if (better) {
          bestCost = val;
          bestOpt = j;
        }
      }
      cur[mid] = bestCost;
      calls.push({
        layer: g,
        lo,
        hi,
        optLo,
        optHi,
        mid,
        upper,
        cands,
        best: bestCost,
        bestOpt,
        depth,
        empties: [],
        after: [],
      });
      solve(lo, mid - 1, optLo, bestOpt, depth + 1);
      solve(mid + 1, hi, bestOpt, optHi, depth + 1);
    };
    solve(0, n - 1, 0, n - 2, 0);
    rows.push(cur.slice());
    prev = cur;
  }
  return { answer: prev[n - 1] as number, rows, calls };
}

/**
 * 줄 배열을 새로 만들지 않고 이전 줄 배열을 그대로 쓰는 판. 걸음마다의 배열을 남긴다. 이 사본이
 * 그 변이와 같은 답을 내는지는 아래에서 확인한다.
 */
export function recordSharedRow(
  cost: number[][],
  k: number,
): { answer: number; steps: number[][] } {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;
  const steps: number[][] = [prev.slice()];
  for (let g = 2; g <= k; g++) {
    const cur: number[] = prev;
    const solve = (
      lo: number,
      hi: number,
      optLo: number,
      optHi: number,
    ): void => {
      if (lo > hi) return;
      const mid = (lo + hi) >> 1;
      let bestCost = INF;
      let bestOpt = optLo;
      const upper = Math.min(optHi, mid - 1);
      for (let j = optLo; j <= upper; j++) {
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[mid] as number);
        if (val < bestCost) {
          bestCost = val;
          bestOpt = j;
        }
      }
      cur[mid] = bestCost;
      steps.push(cur.slice());
      solve(lo, mid - 1, optLo, bestOpt);
      solve(mid + 1, hi, bestOpt, optHi);
    };
    solve(0, n - 1, 0, n - 2);
    steps.push(cur.slice());
    prev = cur;
  }
  return { answer: prev[n - 1] as number, steps };
}

if (!중화됨) {
  for (const c of MUTANT_CASES) {
    if (
      recordNoCap(c.cost, c.k).answer !== noCap.divideAndConquerDp(c.cost, c.k)
    )
      throw new Error(
        "상한을 안 자른 사본이 같은 이름의 변이와 다른 답을 낸다",
      );
    if (
      recordSharedRow(c.cost, c.k).answer !==
      sharedRow.divideAndConquerDp(c.cost, c.k)
    )
      throw new Error(
        "줄 배열을 함께 쓴 사본이 같은 이름의 변이와 다른 답을 낸다",
      );
  }
}

/** 변이 하나를 입력 셋에 돌려 정본과 나란히 놓는다. */
function mutantTable(impl: Impl, name: string): string {
  const rows = MUTANT_CASES.map((c) => {
    const want = divideAndConquerDp(c.cost, c.k);
    const got = impl.divideAndConquerDp(c.cost, c.k);
    return [
      c.label,
      String(c.k),
      cell(want),
      cell(got),
      want === got ? "같다" : "다르다",
    ];
  });
  return md(["입력", "k", "정본", name, "판정"], rows, [1, 2, 3]);
}

/* ────────────────────────── 큰 규모 — 한 번만 잰다 ────────────────────────── */

let scaleCache: { dc: number; calls: number } | null = null;
/** 과제 규모 `n = k = 2,000` 에서 분할 정복 최적화의 후보 수. */
export function atScale(): { dc: number; calls: number } {
  if (scaleCache === null) {
    const lite = countedLite(buildCost(seq(N_MAX)), N_MAX);
    scaleCache = { dc: lite.checks, calls: lite.calls };
  }
  return scaleCache;
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

const WALK_COST = buildCost(WALK_A);
const SMALL_COST = buildCost(SMALL_A);

/** 칸 `(g, i)` 의 후보 전부 — 이전 줄은 전부 계산한 DP 테이블에서. */
export function candidatesOf(
  cost: number[][],
  k: number,
  g: number,
  i: number,
): { j: number; left: number; right: number; val: number }[] {
  const prev = fullScan(cost, k).rows[g - 2] as number[];
  const out: { j: number; left: number; right: number; val: number }[] = [];
  for (let j = 0; j < i; j++) {
    const left = prev[j] as number;
    const right = (cost[j + 1] as number[])[i] as number;
    out.push({ j, left, right, val: left + right });
  }
  return out;
}

/** 최적 가르는 자리 표기 — 없으면 「없음」. */
const optName = (v: number): string => (v < 0 ? "없음" : String(v));

export const PROOFS: Record<string, () => string> = {
  /** 「전체 컨셉」 — 네 칸을 세 구역으로 나누는 방법 전부. */
  "concept-parts": () => {
    const p = partitions(WALK_COST, WALK_K);
    const rows = p.all.map((x) => {
      let from = 0;
      const spans = x.cuts.map((end) => {
        const s = `[${from},${end}]`;
        from = end + 1;
        return s;
      });
      const sum = x.parts.reduce((s, v) => s + v, 0);
      return [spans.join(" "), x.parts.map(num).join(" + "), num(sum)];
    });
    const want = divideAndConquerDp(WALK_COST, WALK_K);
    return `${md(["구역 셋", "구역마다의 비용", "합"], rows, [2])}

나누는 방법 ${p.count} 가지 가운데 가장 작은 합은 ${num(p.best)}${josa(num(p.best), "이고", "고")}, 정본 divideAndConquerDp 도 ${num(want)}${을를(num(want))} 돌려줍니다.`;
  },

  /** 「전체 컨셉」 — 칸 dp[2][3] 을 가르는 자리마다 계산한다. */
  "concept-cell": () => {
    const cands = candidatesOf(WALK_COST, WALK_K, 2, 3);
    const best = Math.min(...cands.map((c) => c.val));
    const rows = cands.map((c) => [
      `j = ${c.j}`,
      `앞 구역 [0,${c.j}] · 마지막 구역 [${c.j + 1},3]`,
      `${num(c.left)} + ${num(c.right)}`,
      num(c.val),
    ]);
    const opt = cands.find((c) => c.val === best)?.j as number;
    return `${md(["가르는 자리", "나뉜 모양", "dp[1][j] + cost[j+1][3]", "값"], rows, [3])}

가장 작은 값은 ${num(best)}${josa(num(best), "이고", "고")} 그 값을 만든 가르는 자리는 j = ${opt} 입니다.`;
  },

  /** 「아이디어를 떠올리는 과정」 — 규모에 맞춘 메모리. */
  "origin-budget": () => {
    const rows = [500, 1_000, N_MAX, 5_000].map((n) => [
      num(n),
      num(n * n),
      `${num((n * n * BYTES) / 1_000_000)} MB`,
    ]);
    return md(["n", "비용 행렬의 칸", "칸마다 8 바이트"], rows, [0, 1, 2]);
  },

  /** 「아이디어를 떠올리는 과정」 — 분할을 전부 만드는 방법. */
  "origin-partitions": () => {
    const rows: string[][] = [];
    for (const [n, k] of [
      [4, 3],
      [8, 3],
      [12, 4],
    ] as [number, number][]) {
      const p = partitions(buildCost(seq(n)), k);
      if (p.count !== choose(n - 1, k - 1))
        throw new Error("분할의 개수가 C(n-1, k-1) 과 다르다");
      if (p.best !== divideAndConquerDp(buildCost(seq(n)), k))
        throw new Error("분할 전부의 최솟값이 정본과 다르다");
      rows.push([num(n), num(k), num(p.count), "센 값"]);
    }
    const half = N_MAX / 2;
    rows.push([
      num(N_MAX),
      num(half),
      `${num(chooseDigits(N_MAX - 1, half - 1))} 자리 수`,
      "식 — C(n−1, k−1)",
    ]);
    return `${md(["n", "k", "분할의 개수", "출처"], rows, [0, 1, 2])}

센 값 세 줄은 C(n−1, k−1) 과 같고, 세 줄 모두 가장 작은 합이 정본의 답과 같습니다.`;
  },

  /** 「아이디어를 떠올리는 과정」 — 가르는 자리를 전부 계산하는 방법의 후보 수. */
  "origin-naive": () => {
    const rows: string[][] = [];
    for (const [n, k] of [
      [8, 3],
      [64, 64],
      [256, 256],
    ] as [number, number][]) {
      const f = fullScan(buildCost(seq(n)), k);
      if (f.checks !== fullFormula(n, k))
        throw new Error("센 후보 수가 식과 다르다");
      rows.push([num(n), num(k), num(f.checks), "센 값", seconds(f.checks)]);
    }
    const big = fullFormula(N_MAX, N_MAX);
    rows.push([
      num(N_MAX),
      num(N_MAX),
      num(big),
      "어림 — (k−1)·n(n−1)/2",
      seconds(big),
    ]);
    return `${md(["n", "k", "후보 수", "출처", "시간(초당 1 억 개)"], rows, [0, 1, 2, 4])}

위 세 줄은 실제로 센 값이고, 세 줄 모두 (k−1)·n(n−1)/2 와 같습니다. 마지막 줄은 그 식에 n = k = ${num(N_MAX)}${을를(num(N_MAX))} 넣어 늘린 어림입니다.`;
  },

  /** 「아이디어를 떠올리는 과정」 — 작은 입력의 최적 가르는 자리. */
  "origin-opt": () => {
    const f = fullScan(SMALL_COST, SMALL_K);
    const idx = SMALL_A.map((_, i) => String(i));
    const rows = f.opts.map((o, g) => [`opt(${g + 2}, i)`, ...o.map(optName)]);
    return `${md(
      ["칸 i", ...idx],
      rows,
      idx.map((_, i) => i + 1),
    )}

a = [${SMALL_A.join(", ")}]${을를(String(SMALL_A.at(-1)))} k = ${SMALL_K} 구역으로 나눌 때입니다. 「없음」은 구역 수보다 칸이 적어 만들 수 없는 칸입니다.`;
  },

  /** 「아이디어를 떠올리는 과정」 — 같은 입력을 두 방식으로: 칸마다 후보 범위. */
  "origin-two": () => {
    const f = fullScan(SMALL_COST, SMALL_K);
    const s = sweep(SMALL_COST, SMALL_K);
    const opt2 = f.opts[0] as number[];
    const r2 = s.ranges[0] as [number, number][];
    const rows = SMALL_A.map((_, i) => {
      const [lo, hi] = r2[i] as [number, number];
      return [
        String(i),
        i === 0 ? "없음" : `[0,${i - 1}] · ${i} 개`,
        hi < lo ? "없음" : `[${lo},${hi}] · ${hi - lo + 1} 개`,
        optName(opt2[i] as number),
      ];
    });
    const fullLayer = (SMALL_A.length * (SMALL_A.length - 1)) / 2;
    const sweepLayer = r2.reduce(
      (t, [lo, hi]) => t + Math.max(0, hi - lo + 1),
      0,
    );
    return `${md(["칸 i", "전부 계산하는 후보", "하한을 옮긴 후보", "opt(2, i)"], rows)}

줄 2 하나에서 전부 계산하면 후보 ${fullLayer} 개, 하한을 직전 칸의 최적 가르는 자리로 옮기면 ${sweepLayer} 개입니다. 줄 둘을 합하면 ${f.checks} 개와 ${s.checks} 개입니다.`;
  },

  /** 「아이디어를 떠올리는 과정」 — 하한만 옮기는 방법을 규모를 키워 잰다. */
  "origin-sweep": () => {
    const shapes: [string, (n: number) => number[]][] = [
      ["a = [1, 2, …, n]", seq],
      ["첫 칸만 큰 배열", head],
    ];
    const rows = shapes.flatMap(([label, gen]) =>
      [64, 256].map((n) => {
        const cost = buildCost(gen(n));
        const full = fullScan(cost, 3).checks;
        const sw = sweep(cost, 3).checks;
        const dc = countedLite(cost, 3).checks;
        return [
          label,
          num(n),
          num(full),
          num(sw),
          `${Math.round((sw / full) * 100)} %`,
          num(dc),
        ];
      }),
    );
    const h = fullScan(buildCost(head(64)), 3).opts[0] as number[];
    const tail = h.slice(-8);
    return `${md(["입력", "n", "전부 계산", "하한만 옮기기", "전부 계산에 대한 비", "가운데 칸부터"], rows, [1, 2, 3, 4, 5])}

세 방법 모두 k = 3 입니다. 첫 칸만 큰 배열에서 n = 64 일 때 opt(2, i) 의 마지막 여덟 칸은 ${tail.join(" ")} 입니다.`;
  },

  /** 「아이디어를 떠올리는 과정」 — 과제 규모에서 두 방법. */
  "origin-scale": () => {
    const big = fullFormula(N_MAX, N_MAX);
    const { dc } = atScale();
    return `${md(
      ["방법", "후보 수", "출처", "시간(초당 1 억 개)"],
      [
        [
          "가르는 자리 전부 계산",
          num(big),
          "어림 — (k−1)·n(n−1)/2",
          seconds(big),
        ],
        ["가운데 칸부터 채우기", num(dc), "센 값", seconds(dc)],
      ],
      [1, 3],
    )}

a = [1, 2, …, ${num(N_MAX)}]${을를(num(N_MAX))} k = ${num(N_MAX)} 구역으로 나눈 값입니다. 두 수의 비는 ${num(Math.round(big / dc))} 배입니다.`;
  },

  /** 「아이디어 상세」 — 최적 가르는 자리가 입력의 어느 자리를 가르는가. */
  "build-opt-cells": () => {
    const f = fullScan(SMALL_COST, SMALL_K);
    const opt2 = f.opts[0] as number[];
    const dp2 = f.rows[1] as number[];
    const rows = SMALL_A.map((_, i) => {
      const o = opt2[i] as number;
      return o < 0
        ? [String(i), "없음", "—", "—", cell(dp2[i] as number)]
        : [
            String(i),
            String(o),
            `[0,${o}]`,
            `[${o + 1},${i}]`,
            cell(dp2[i] as number),
          ];
    });
    return md(
      ["칸 i", "opt(2, i)", "앞 구역", "마지막 구역", "dp[2][i]"],
      rows,
      [4],
    );
  },

  /** 「아이디어 상세」 — 칸 하나를 읽는 법. dp[2][5]. */
  "build-opt-read": () => {
    const cands = candidatesOf(SMALL_COST, SMALL_K, 2, 5);
    const best = Math.min(...cands.map((c) => c.val));
    const opt = cands.find((c) => c.val === best)?.j as number;
    const rows = cands.map((c) => [
      `j = ${c.j}`,
      `${num(c.left)} + ${num(c.right)}`,
      num(c.val),
      c.val === best ? "가장 작다" : "",
    ]);
    return `${md(["가르는 자리", "dp[1][j] + cost[j+1][5]", "값", "비교"], rows, [2])}

dp[2][5] = ${num(best)}${josa(num(best), "이고", "고")} opt(2, 5) = ${opt} 입니다. 마지막 구역은 [${opt + 1},5] 이고 앞 구역은 [0,${opt}] 입니다.`;
  },

  /** 「아이디어 상세」 — 이웃 칸의 최적 가르는 자리. */
  "build-opt-neighbors": () => {
    const f = fullScan(SMALL_COST, SMALL_K);
    const rows: string[][] = [];
    let pairs = 0;
    let back = 0;
    for (const [gi, o] of f.opts.entries()) {
      for (let i = 1; i < o.length; i++) {
        const a = o[i - 1] as number;
        const b = o[i] as number;
        if (a < 0) continue;
        pairs++;
        if (b < a) back++;
      }
      const steps: string[] = [];
      for (let i = 1; i < o.length; i++) {
        const a = o[i - 1] as number;
        if (a < 0) continue;
        steps.push(`${(o[i] as number) - a}`);
      }
      rows.push([`줄 ${gi + 2}`, o.map(optName).join(" "), steps.join(" ")]);
    }
    return `${md(["줄", "opt(g, i) — i = 0 부터", "이웃 칸으로 갈 때 늘어난 만큼"], rows)}

이웃한 두 칸 ${pairs} 쌍 가운데 최적 가르는 자리가 앞으로 되돌아간 쌍은 ${back} 개입니다.`;
  },

  /** 「아이디어 상세」 — 값이 커지는 것과 자리가 뒤로 가는 것은 다르다. */
  "build-opt-contrast": () => {
    const mono = (xs: number[]): string => {
      const v = xs.filter((x) => x >= 0 && x !== INF);
      for (let i = 1; i < v.length; i++)
        if ((v[i] as number) < (v[i - 1] as number)) return "되돌아간다";
      return "줄지 않는다";
    };
    const rows: string[][] = [];
    for (const [label, cost] of [
      [`a = [${SMALL_A.join(", ")}] 의 제곱 비용`, SMALL_COST],
      ["사각 부등식이 깨지는 행렬", QI_BREAK],
    ] as [string, number[][]][]) {
      const f = fullScan(cost, 2);
      const dp2 = f.rows[1] as number[];
      const o = f.opts[0] as number[];
      rows.push([
        label,
        show(dp2),
        mono(dp2),
        o.map(optName).join(" "),
        mono(o),
      ]);
    }
    return md(["비용 행렬", "dp[2][i]", "값", "opt(2, i)", "자리"], rows);
  },

  /** 「아이디어 상세」 1단계 — 좁힌 후보 범위에서도 같은 칸이 나온다. */
  "build-range-cell": () => {
    const f = fullScan(SMALL_COST, SMALL_K);
    const o = f.opts[0] as number[];
    const prev = f.rows[0] as number[];
    const i = 5;
    const run = (lo: number, hi: number) => {
      let best = INF;
      let at = lo;
      for (let j = lo; j <= hi; j++) {
        const v =
          (prev[j] as number) + ((SMALL_COST[j + 1] as number[])[i] as number);
        if (v < best) {
          best = v;
          at = j;
        }
      }
      return { best, at, count: Math.max(0, hi - lo + 1) };
    };
    const ranges: [string, number, number][] = [
      ["전부", 0, i - 1],
      [`opt(2, 4) = ${o[4]} 부터`, o[4] as number, i - 1],
      [`opt(2, 6) = ${o[6]} 까지`, 0, o[6] as number],
      ["두 칸 사이", o[4] as number, o[6] as number],
    ];
    const rows = ranges.map(([name, lo, hi]) => {
      const r = run(lo, hi);
      return [
        name,
        `[${lo},${hi}]`,
        String(r.count),
        num(r.best),
        String(r.at),
      ];
    });
    return md(
      ["후보 범위", "가르는 자리", "후보 수", "칸의 값", "찾은 자리"],
      rows,
      [2, 3, 4],
    );
  },

  /** 「아이디어 상세」 2단계 — 줄 2 의 첫 호출. */
  "build-first-call": () => {
    const r = record(SMALL_COST, SMALL_K);
    const c = r.calls[0] as Call;
    const rows = c.cands.map((x) => [
      `j = ${x.j}`,
      num(x.val),
      x.better
        ? `${cell(x.val)} < ${cell(x.before)} 참`
        : `${cell(x.val)} < ${cell(x.before)} 거짓`,
    ]);
    const leftHi = c.mid - 1;
    const rightLo = c.mid + 1;
    return `${callName(c)} 의 가운데 칸은 ${c.mid} 입니다. 후보 범위의 하한은 넘겨받은 ${c.optLo}, 상한은 min(${c.optHi}, ${c.mid - 1}) = ${c.upper}${josa(c.upper, "이라", "라")} 후보 범위가 [${c.optLo},${c.upper}] 입니다.

${md(["가르는 자리", `dp[1][j] + cost[j+1][${c.mid}]`, "최솟값과의 비교"], rows, [1])}

칸 ${c.mid} 의 값은 ${num(c.best)}, 찾은 자리는 ${c.bestOpt} 입니다. 왼쪽 칸 [${c.lo},${leftHi}]${은는(leftHi)} 후보를 [${c.optLo},${c.bestOpt}]${으로(c.bestOpt)}, 오른쪽 칸 [${rightLo},${c.hi}]${은는(c.hi)} [${c.bestOpt},${c.optHi}]${으로(c.optHi)} 넘겨받습니다.`;
  },

  /** 「아이디어 상세」 3단계 — 줄 하나의 호출 전부. */
  "build-recursion": () => {
    const cost = buildCost(seq(REC_N));
    const r = record(cost, 2);
    const rows = r.calls.map((c) => [
      String(c.depth),
      callName(c),
      String(c.mid),
      c.upper < c.optLo ? "없음" : `[${c.optLo},${c.upper}]`,
      String(c.cands.length),
      String(c.bestOpt),
    ]);
    const full = fullScan(cost, 2).checks;
    return `${md(["깊이", "호출", "가운데 칸", "후보 범위", "후보 수", "찾은 자리"], rows, [0, 2, 4, 5])}

a = [1, 2, …, ${REC_N}] 의 줄 2 입니다. 후보 수 합계는 ${r.checks}${josa(r.checks, "이고", "고")}, 빈 범위로 곧장 돌아온 호출이 ${r.emptyCalls} 번입니다. 같은 줄을 전부 계산하면 ${full} 개입니다.`;
  },

  /** 「아이디어 상세」 3단계 — 깊이마다 후보 수를 더한다. */
  "build-depth": () => {
    const cost = buildCost(seq(REC_N));
    const r = record(cost, 2);
    const byDepth = new Map<number, { calls: number; sum: number }>();
    for (const c of r.calls) {
      const e = byDepth.get(c.depth) ?? { calls: 0, sum: 0 };
      e.calls++;
      e.sum += c.cands.length;
      byDepth.set(c.depth, e);
    }
    const rows = [...byDepth.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([d, e]) => [String(d), String(e.calls), String(e.sum)]);
    return md(["깊이", "호출 수", "후보 수 합"], rows, [0, 1, 2]);
  },

  /** 「아이디어 상세」 4단계 — 줄마다 이전 줄을 읽어 이번 줄을 채운다. */
  "build-layers": () => {
    const r = record(SMALL_COST, SMALL_K);
    const rows = r.rows.map((row, g) => [
      `줄 ${g + 1}`,
      g === 0 ? "cost[0][i] 를 옮긴다" : `줄 ${g}`,
      show(row),
      g === 0 ? "0" : String(r.perLayer[g - 1]),
    ]);
    return `${md(["채운 줄", "읽은 줄", "값", "후보 수"], rows, [3])}

돌려주는 값은 줄 ${SMALL_K} 의 마지막 칸 ${cell(r.answer)}${josa(cell(r.answer), "이고", "고")}, 정본도 ${cell(divideAndConquerDp(SMALL_COST, SMALL_K))}${을를(cell(divideAndConquerDp(SMALL_COST, SMALL_K)))} 돌려줍니다.`;
  },

  /** 「이 방법이 기대는 전제」 — 이 글이 쓰는 비용 행렬이 사각 부등식을 만족하는가. */
  "build-premise-quad": () => {
    const inputs: [string, number[][]][] = [
      ["전개 입력 (n = 4)", WALK_COST],
      [`a = [1, 2, …, 8] (n = 8)`, SMALL_COST],
      [`a = [1, 2, …, ${REC_N}] (n = ${REC_N})`, buildCost(seq(REC_N))],
      ["첫 칸만 큰 배열 (n = 9)", buildCost(head(9))],
      ["사각 부등식이 깨지는 행렬 (n = 4)", QI_BREAK],
    ];
    const rows = inputs.map(([label, cost]) => {
      const q = quadrangle(cost);
      return [
        label,
        num(q.tested),
        num(q.broken.length),
        q.broken.length === 0 ? "—" : (q.broken[0] as number[]).join(", "),
      ];
    });
    return md(
      ["비용 행렬", "확인한 지표 조합", "어긴 조합", "첫 위반 (a, b, c, d)"],
      rows,
      [1, 2],
    );
  },

  /** 「이 방법이 기대는 전제」 — 사각 부등식이 깨지면 이 절차는 최솟값을 놓친다. */
  "build-premise-break": () => {
    const f = fullScan(QI_BREAK, 2);
    const o = f.opts[0] as number[];
    const r = record(QI_BREAK, 2);
    const dc = divideAndConquerDp(QI_BREAK, 2);
    const cands = candidatesOf(QI_BREAK, 2, 2, 3);
    const best = Math.min(...cands.map((c) => c.val));
    const call3 = r.calls.find((c) => c.mid === 3) as Call;
    const rows = cands.map((c) => [
      `j = ${c.j}`,
      `${num(c.left)} + ${num(c.right)}`,
      num(c.val),
      c.j >= call3.optLo && c.j <= call3.upper ? "넣는다" : "범위 밖",
    ]);
    const q = quadrangle(QI_BREAK);
    const [a, b, c, d] = q.broken[0] as [number, number, number, number];
    const at = (x: number, y: number) => (QI_BREAK[x] as number[])[y] as number;
    return `opt(2, i) 는 i = 0 부터 ${o.map(optName).join(" ")} 입니다. 칸 3 을 채우는 호출 ${callName(call3)} 의 후보 범위는 [${call3.optLo},${call3.upper}] 입니다.

${md(["가르는 자리", "dp[1][j] + cost[j+1][3]", "값", "분할 정복 최적화"], rows, [2])}

가장 작은 값은 ${num(best)} 인데 분할 정복 최적화는 ${num(dc)}${을를(num(dc))} 돌려줍니다. 지표 조합 ${num(q.tested)} 개 가운데 사각 부등식을 어긴 것이 ${num(q.broken.length)} 개이고, 첫 조합 (${a}, ${b}, ${c}, ${d}) 에서는 cost[${a}][${c}] + cost[${b}][${d}] = ${at(a, c)} + ${at(b, d)} = ${at(a, c) + at(b, d)}${이가(at(a, c) + at(b, d))} cost[${a}][${d}] + cost[${b}][${c}] = ${at(a, d)} + ${at(b, c)} = ${at(a, d) + at(b, c)} 보다 큽니다.`;
  },

  /** 「가운데 칸을 먼저 채우는 까닭」 — 먼저 채울 칸을 셋으로 시험한다. */
  "build-pivot": () => {
    const rows: string[][] = [];
    for (const [label, gen] of [
      ["a = [1, 2, …, n]", seq],
      ["첫 칸만 큰 배열", head],
    ] as [string, (n: number) => number[]][]) {
      for (const n of [64, 256]) {
        const cost = buildCost(gen(n));
        const want = divideAndConquerDp(cost, 3);
        const cells = PIVOTS.map(([, pick]) => {
          const r = countedPivot(cost, 3, pick);
          if (r.answer !== want) throw new Error("판이 정본과 다른 답을 낸다");
          return `${num(r.checks)} · 깊이 ${r.depth}`;
        });
        rows.push([label, num(n), ...cells]);
      }
    }
    const sw = sweep(buildCost(head(256)), 3).checks;
    const left = countedPivot(buildCost(head(256)), 3, (lo) => lo).checks;
    return `${md(["입력", "n", ...PIVOTS.map(([name]) => `${name} · 후보 수 · 재귀 깊이`)], rows, [1])}

셋 다 k = 3 이고 답은 정본과 같습니다. 첫 칸만 큰 배열에서 n = 256 일 때 왼쪽 끝부터 채우는 판의 후보 수는 ${num(left)}, 하한만 옮기는 방법은 ${num(sw)} 입니다.`;
  },

  /** 전개 — 끝까지 쓸 입력. */
  "walk-input": () => {
    const want = divideAndConquerDp(WALK_COST, WALK_K);
    return `const a = [${WALK_A.join(", ")}];
const cost = buildCost(a); // cost[i][j] = (a[i] + … + a[j])^2
const k = ${WALK_K};
// 이 절이 끝나면 ${want}${이가(want)} 나와야 한다`;
  },

  /** 전개 1 — 줄 1. */
  "walk-base": () => {
    const s = walkSteps()[0] as WalkStep;
    const row = s.table[0] as number[];
    const last = WALK_A.length - 1;
    return md(
      ["T1 뒤의 줄", "값", "뜻"],
      [
        ["prev", show(row), `dp[1][0] … dp[1][${last}]`],
        [
          "a",
          WALK_A.join(" "),
          `prev[${last}] = (${WALK_A.join(" + ")})² = ${num(row[last] as number)}`,
        ],
      ],
    );
  },

  /** 전개 2 — 줄 2 의 첫 호출 T2. */
  "walk-first": () => {
    const s = walkSteps()[1] as WalkStep;
    const c = s.call as Call;
    const lines = [
      `${s.id} — ${callName(c)}`,
      `  가운데 칸  mid = (${c.lo} + ${c.hi}) >> 1 = ${c.mid}`,
      `  후보 상한  min(${c.optHi}, ${c.mid - 1}) = ${c.upper}`,
      `  후보 범위  [${c.optLo},${c.upper}]`,
      ...c.cands.map(
        (x) =>
          `  j = ${x.j}      prev[${x.j}] + cost[${x.j + 1}][${c.mid}] = ${cell(x.val)}`,
      ),
      "",
      `  cur[${c.mid}] = ${cell(c.best)} · bestOpt = ${c.bestOpt}`,
    ];
    return lines.join("\n");
  },

  /** 짚고 가기 — 후보 상한을 안 자르면. */
  "pause-cap": () => mutantTable(noCap, "상한을 안 자른 판"),

  /** 짚고 가기 — 답이 같은 입력에서도 DP 테이블은 갈린다. */
  "pause-cap-rows": () => {
    const a = record(WALK_COST, WALK_K).rows;
    const b = recordNoCap(WALK_COST, WALK_K).rows;
    const rows = a.map((r, g) => [
      `줄 ${g + 1}`,
      show(r),
      show(b[g] as number[]),
    ]);
    return md(["줄", "정본", "상한을 안 자른 사본"], rows);
  },

  /** 짚고 가기 — 답까지 갈리는 입력에서 무엇이 다른가. */
  "pause-cap-trace": () => {
    const a = record(CAP_BREAK, 2).calls;
    const b = recordNoCap(CAP_BREAK, 2).calls;
    const row = (c: Call): string[] => [
      callName(c),
      String(c.mid),
      c.upper < c.optLo ? "없음" : `[${c.optLo},${c.upper}]`,
      c.cands.length === 0
        ? "없음"
        : c.cands.map((x) => `j=${x.j}: ${cell(x.val)}`).join(" · "),
      cell(c.best),
      c.cands.length === 0 ? "—" : String(c.bestOpt),
    ];
    const head = [
      "호출",
      "가운데 칸",
      "후보 범위",
      "후보 값",
      "채운 값",
      "찾은 자리",
    ];
    return `정본의 호출입니다.

${md(head, a.map(row), [1])}

상한을 안 자른 사본의 호출입니다.

${md(head, b.map(row), [1])}`;
  },

  /** 전개 3 — 오른쪽 절반의 두 호출. */
  "walk-right": () => {
    const steps = walkSteps().filter(
      (s) => s.kind === "call" && s.layer === 2 && (s.call as Call).mid >= 2,
    );
    const lines: string[] = [];
    for (const s of steps) {
      const c = s.call as Call;
      lines.push(
        `${s.id}  ${callName(c)}   mid = ${c.mid}   상한 min(${c.optHi}, ${c.mid - 1}) = ${c.upper}   후보 [${c.optLo},${c.upper}]`,
      );
      for (const x of c.cands)
        lines.push(
          `      j = ${x.j}   prev[${x.j}] + cost[${x.j + 1}][${c.mid}] = ${cell(x.val)}`,
        );
      lines.push(
        `      cur[${c.mid}] = ${cell(c.best)} · bestOpt = ${c.bestOpt}`,
      );
    }
    const [first, second] = steps as [WalkStep, WalkStep];
    lines.push(
      "",
      `${second.id} 의 하한 ${(second.call as Call).optLo}${이가((second.call as Call).optLo)} ${first.id} 의 bestOpt 다. j = ${(first.call as Call).optLo}${은는((first.call as Call).optLo)} 넣지 않는다`,
    );
    return lines.join("\n");
  },

  /** 짚고 가기 — 줄 배열을 함께 쓰면. */
  "pause-shared": () => mutantTable(sharedRow, "줄 배열을 함께 쓴 판"),

  /** 짚고 가기 — 줄 배열을 함께 쓰면 걸음마다 배열이 어떻게 되는가. */
  "pause-shared-trace": () => {
    const shared = recordSharedRow(WALK_COST, WALK_K).steps;
    const steps = walkSteps().slice(0, -1);
    if (shared.length !== steps.length)
      throw new Error("함께 쓴 사본의 걸음 수가 전개와 다르다");
    const rows = steps.map((s, i) => [
      `${s.id} ${stepTitle(s)}`,
      show(shared[i] as number[]),
      (s.table[s.layer - 1] as (number | null)[])
        .map((v) => (v === null ? "·" : cell(v)))
        .join(" "),
    ]);
    const answer = recordSharedRow(WALK_COST, WALK_K).answer;
    return `${md(["걸음", "한 배열을 함께 쓴 사본", "정본의 그 줄"], rows)}

한 배열을 함께 쓴 사본은 ${cell(answer)}${을를(cell(answer))} 돌려주고 정본은 ${cell(divideAndConquerDp(WALK_COST, WALK_K))}${을를(cell(divideAndConquerDp(WALK_COST, WALK_K)))} 돌려줍니다. 「·」 는 그 걸음까지 아직 안 쓴 칸입니다.`;
  },

  /** 전개 4 — 열두 걸음의 조건 판정. */
  "walk-trace": () => {
    const steps = walkSteps();
    const n = WALK_A.length;
    const rows = steps.map((s) => [
      s.id,
      stepTitle(s),
      s.branches.join(""),
      stepConditions(s, n),
      (s.table[s.layer - 1] as (number | null)[])
        .map((v) => (v === null ? "·" : cell(v)))
        .join(" "),
    ]);
    const seen = new Set(steps.flatMap((s) => s.branches));
    const r = record(WALK_COST, WALK_K);
    return `${md(["걸음", "한 일", "갈래", "조건 판정", "걸음 뒤 그 줄"], rows)}

갈래 ${[...seen].sort().join("")} 이 모두 한 번 이상 나왔습니다. 후보 수 ${r.checks} · 비지 않은 호출 ${r.calls.length} 번 · 빈 호출 ${r.emptyCalls} 번이고, 반환값은 ${cell(r.answer)} 입니다.`;
  },

  /** 전개 4 — 호출마다 넣은 후보와 남은 값. */
  "walk-candidates": () => {
    const r = record(WALK_COST, WALK_K);
    const rows = r.calls.map((c) => [
      String(c.layer),
      String(c.mid),
      c.upper < c.optLo ? "없음" : `[${c.optLo},${c.upper}]`,
      c.cands.length === 0
        ? "없음"
        : c.cands.map((x) => `j=${x.j}: ${cell(x.val)}`).join(" · "),
      cell(c.best),
      c.cands.length === 0 ? "—" : String(c.bestOpt),
    ]);
    return md(
      ["줄", "가운데 칸", "후보 범위", "후보 값", "채운 값", "bestOpt"],
      rows,
      [0, 1],
    );
  },

  /** 전개 5 — 여러 입력에 실행한 결과. */
  "final-calls": () => {
    const cases: [string, number[][], number][] = [
      ["a = [1, 2, 3, 4] · k = 3", WALK_COST, 3],
      ["a = [1, 2, 3, 4] · k = 1", WALK_COST, 1],
      ["a = [1, 2, 3, 4] · k = 4", WALK_COST, 4],
      ["a = [5, 10, 15] · k = 3", buildCost([5, 10, 15]), 3],
      ["cost = [[7]] · k = 1", [[7]], 1],
      [`a = [1, 2, …, 8] · k = 3`, SMALL_COST, 3],
    ];
    const rows = cases.map(([label, cost, k]) => [
      label,
      cell(divideAndConquerDp(cost, k)),
      cell(fullScan(cost, k).answer),
    ]);
    return md(
      ["입력", "divideAndConquerDp", "가르는 자리 전부 계산"],
      rows,
      [1, 2],
    );
  },

  /** 알아 두면 좋은 개념 — 행마다 최솟값의 자리. */
  "related-rows": () => {
    const f = fullScan(SMALL_COST, SMALL_K);
    const o = f.opts[0] as number[];
    const rows = SMALL_A.map((_, i) => {
      const cands = candidatesOf(SMALL_COST, SMALL_K, 2, i);
      return [
        `i = ${i}`,
        cands.length === 0 ? "없음" : cands.map((c) => num(c.val)).join(" "),
        optName(o[i] as number),
      ];
    });
    return md(["행", "M[i][j] — j = 0 부터", "최솟값의 자리"], rows);
  },

  /** 경쟁 설계와의 대조 — 두 설계를 같은 입력에서. */
  "alt-table": () => {
    const sw = sweepK();
    const walk = buildCost(WALK_A);
    const row = (
      name: string,
      sums: readonly number[],
      cells: number,
      run: typeof 분할정복,
    ): string[] => [
      name,
      num(run(walk, WALK_K).perLayer.reduce((t, v) => t + v, 0)),
      ...K_SHOWN.map((k) => num(countAt(sums, k))),
      num(cells),
    ];
    return md(
      [
        "설계",
        "전개 입력 · 후보 수",
        ...K_SHOWN.map((k) => `k = ${num(k)} · 후보 수`),
        "추가 칸",
      ],
      [
        row("분할 정복 최적화 (이 가이드)", sw.dc, sw.dcCells, 분할정복),
        row("크누스 최적화", sw.kn, sw.knCells, 크누스),
      ],
      [1, 2, 3, 4, 5, 6],
    );
  },

  /** 경쟁 설계와의 대조 — 구역 수를 바꿔 가며 어느 쪽이 적은가. */
  "alt-flip": () => {
    const sw = sweepK();
    const { last, first } = crossing();
    const ks = [2, 10, 50, 100, last, first, 500, 1_000, ALT_N];
    const rows = ks.map((k) => {
      const a = countAt(sw.dc, k);
      const b = countAt(sw.kn, k);
      return [
        num(k),
        num(a),
        num(b),
        a < b ? "분할 정복 최적화" : "크누스 최적화",
      ];
    });
    return `${md(["구역 수 k", "분할 정복 최적화 · 후보 수", "크누스 최적화 · 후보 수", "적은 쪽"], rows, [0, 1, 2])}

a = [1, 2, …, ${num(ALT_N)}] 입니다. k = 2 부터 ${num(ALT_N)} 까지 모두 재면 분할 정복 최적화가 적은 마지막 k 가 ${num(last)}, 크누스 최적화가 적은 첫 k 가 ${num(first)}${josa(num(first), "이고", "고")}, 그 뒤로 다시 뒤집히지 않습니다.`;
  },

  /** 「수식 정의와 유도」 — 정의를 칸 하나에 넣는다. */
  "math-check": () => {
    const cands = candidatesOf(WALK_COST, WALK_K, 2, 3);
    const best = Math.min(...cands.map((c) => c.val));
    const lines = cands.map(
      (c) =>
        `  j = ${c.j}   dp[1][${c.j}] + cost[${c.j + 1}][3] = ${num(c.left)} + ${num(c.right)} = ${num(c.val)}${c.val === best ? "   ← 최솟값" : ""}`,
    );
    const opt = cands.find((c) => c.val === best)?.j as number;
    return `정의를 전개 입력의 칸 하나에 넣는다 — dp[2][3]

${lines.join("\n")}

  dp[2][3] = ${num(best)}${josa(num(best), "이고", "고")} opt(2, 3) = ${opt}${josa(opt, "이다", "다")}`;
  },

  /** 「수식 정의와 유도」 — 좁힌 절차와 전부 계산이 같은 DP 테이블을 만드는가. */
  "math-table": () => {
    const r = record(WALK_COST, WALK_K);
    const f = fullScan(WALK_COST, WALK_K);
    const rows = r.rows.map((row, g) => [
      `dp[${g + 1}]`,
      show(row),
      show(f.rows[g] as number[]),
      row.every((v, i) => v === ((f.rows[g] as number[])[i] as number))
        ? "같다"
        : "다르다",
    ]);
    return `${md(["줄", "분할 정복 최적화", "가르는 자리 전부 계산", "판정"], rows)}

줄마다의 후보 수는 ${r.perLayer.map((v, i) => `줄 ${i + 2}: ${v}`).join(" · ")}${으로(String(r.perLayer.at(-1)))} 합계 ${r.checks}${josa(r.checks, "이고", "고")}, 전부 계산하면 ${f.checks} 입니다.`;
  },

  /** 「수식 정의와 유도」 — 깊이마다의 후보 수 합이 n + 2^d 를 넘지 않는가. */
  "math-depth": () => {
    const rows = [16, 64, 256].flatMap((n) => {
      const r = recordLiteDepth(buildCost(flat(n)));
      return [...r.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([d, sum]) => [
          num(n),
          String(d),
          num(sum),
          num(n + 2 ** d),
          sum <= n + 2 ** d ? "넘지 않는다" : "넘는다",
        ]);
    });
    return `${md(["n", "깊이 d", "그 깊이의 후보 수 합", "n + 2^d", "판정"], rows, [0, 1, 2, 3])}

값이 모두 같은 배열의 줄 2 입니다. 줄 하나의 상한 n⌈log₂(n+1)⌉ + 2n 은 n = 16 에서 ${num(layerBound(16))} · 64 에서 ${num(layerBound(64))} · 256 에서 ${num(layerBound(256))} 입니다.`;
  },

  /** 「수식 정의와 유도」 — 닫힌 형태에 과제 규모를 넣는다. */
  "math-scale": () => {
    const rows = [250, 500, 1_000, N_MAX].map((n) => {
      const first = countedLite(buildCost(seq(n)), 2).perLayer[0] as number;
      const bound = layerBound(n);
      return [num(n), num(first), num(bound), (first / bound).toFixed(3)];
    });
    const total = (N_MAX - 1) * layerBound(N_MAX);
    const full = fullFormula(N_MAX, N_MAX);
    return `${md(["n", "줄 하나의 후보 수", "n⌈log₂(n+1)⌉ + 2n", "그 비"], rows, [0, 1, 2, 3])}

a = [1, 2, …, n] 의 줄 2 를 센 값입니다. n = k = ${num(N_MAX)} 에서 상한 (k−1)(n⌈log₂(n+1)⌉ + 2n) 은 ${num(total)}${josa(num(total), "이고", "고")} 전부 계산하는 (k−1)·n(n−1)/2 는 ${num(full)}${josa(num(full), "이라", "라")} ${num(Math.round(full / total))} 배입니다. 같은 규모에서 실제로 센 후보 수는 ${num(atScale().dc)} 입니다.`;
  },

  /** 불변식 — 호출마다 진짜 최적 가르는 자리가 넘긴 범위 안에 있는가. */
  "invariant-watch": () => {
    const r = record(WALK_COST, WALK_K);
    const f = fullScan(WALK_COST, WALK_K);
    const rows = r.calls.map((c) => {
      const opt = (f.opts[c.layer - 2] as number[])[c.mid] as number;
      const inside = opt < 0 || (opt >= c.optLo && opt <= c.optHi);
      return [
        callName(c),
        String(c.layer),
        String(c.mid),
        optName(opt),
        `[${c.optLo},${c.optHi}]`,
        inside ? "지킨다" : "깨진다",
      ];
    });
    return md(
      ["호출", "줄", "가운데 칸", "진짜 opt", "넘긴 범위", "불변식"],
      rows,
      [1, 2, 3],
    );
  },

  /** 불변식 — 경계 입력. */
  "invariant-edges": () => {
    const cases: [string, number[][], number][] = [
      ["칸 하나, 구역 하나", buildCost([7]), 1],
      ["구역이 하나", WALK_COST, 1],
      ["구역 수가 칸 수와 같다", WALK_COST, 4],
      ["값이 모두 같은 배열", buildCost(flat(5)), 3],
      ["첫 칸만 큰 배열", buildCost(head(5)), 2],
      ["비용이 전부 0", buildCost([0, 0, 0, 0]), 2],
    ];
    const rows = cases.map(([label, cost, k]) => {
      const r = record(cost, k);
      return [
        label,
        String(cost.length),
        String(k),
        cell(divideAndConquerDp(cost, k)),
        cell(fullScan(cost, k).answer),
        num(r.checks),
        num(r.calls.length + r.emptyCalls),
      ];
    });
    return md(
      ["입력", "n", "k", "반환값", "전부 계산한 답", "후보 수", "호출"],
      rows,
      [1, 2, 3, 4, 5, 6],
    );
  },

  /** 불변식 — 줄 교체를 빼면. */
  "mutant-no-roll": () => mutantTable(noRoll, "줄을 안 바꾼 판"),

  /** 불변식 — 줄 교체를 빼면 줄 3 이 무엇을 읽는가. */
  "invariant-no-roll-rows": () => {
    const r = record(WALK_COST, WALK_K);
    const layer1 = r.rows[0] as number[];
    const layer2 = r.rows[1] as number[];
    return md(
      ["줄 3 을 채울 때", "prev 가 담은 것"],
      [
        ["정본", `줄 2 — ${show(layer2)}`],
        ["prev = cur 를 지운 판", `줄 1 — ${show(layer1)}`],
      ],
    );
  },

  /** 비용 — 전개의 걸음마다 후보 수. */
  "perf-walk": () => {
    const steps = walkSteps();
    let acc = 0;
    const rows = steps.map((s) => {
      const c = s.call;
      const here = c === null ? 0 : c.cands.length;
      acc += here;
      return [
        s.id,
        c === null ? "—" : `칸 ${c.mid}`,
        c === null
          ? "—"
          : c.upper < c.optLo
            ? "없음"
            : `[${c.optLo},${c.upper}]`,
        String(here),
        String(acc),
      ];
    });
    const r = record(WALK_COST, WALK_K);
    return `${md(["걸음", "채운 칸", "후보 범위", "이 걸음의 후보 수", "누적"], rows, [3, 4])}

비지 않은 호출 ${r.calls.length} 번 · 빈 호출 ${r.emptyCalls} 번 · 후보 수 ${r.checks} 입니다.`;
  },

  /** 비용 — 호출 수가 줄마다 2n + 1 인가. */
  "perf-calls": () => {
    const rows: string[][] = [];
    for (const [label, a, k] of [
      ["전개 입력", WALK_A, WALK_K],
      ["a = [1, 2, …, 8]", SMALL_A, SMALL_K],
      [`a = [1, 2, …, ${REC_N}]`, seq(REC_N), 4],
      ["값이 모두 같은 배열", flat(64), 5],
    ] as [string, number[], number][]) {
      const n = a.length;
      const lite = countedLite(buildCost(a), k);
      rows.push([
        label,
        num(n),
        num(k),
        num(lite.calls),
        num((k - 1) * (2 * n + 1)),
        num(lite.checks),
      ]);
    }
    return md(
      ["입력", "n", "k", "센 호출 수", "(k−1)(2n+1)", "후보 수"],
      rows,
      [1, 2, 3, 4, 5],
    );
  },

  /** 비용 — 배열 모양별 관측. */
  "perf-observed": () => {
    const rows = (
      [
        ["값이 모두 같은 배열", flat],
        ["a = [1, 2, …, n]", seq],
        ["생성식 배열", line],
        ["첫 칸만 큰 배열", head],
      ] as [string, (n: number) => number[]][]
    ).flatMap(([label, gen]) =>
      [128, 512].map((n) => {
        const first = countedLite(buildCost(gen(n)), 2).perLayer[0] as number;
        return [
          label,
          num(n),
          num(first),
          (first / n).toFixed(2),
          Math.log2(n).toFixed(0),
          num((n * (n - 1)) / 2),
        ];
      }),
    );
    return md(
      [
        "배열",
        "n",
        "줄 하나의 후보 수",
        "그 값 / n",
        "log₂ n",
        "전부 계산한 후보 수",
      ],
      rows,
      [1, 2, 3, 4, 5],
    );
  },

  /** 최악 — 어느 모양이 후보를 가장 많이 만드는가. */
  "perf-worst-shape": () => {
    const n = 256;
    const shapes: [string, number[]][] = [
      ["값이 모두 같은 배열", flat(n)],
      ["a = [1, 2, …, n]", seq(n)],
      ["생성식 배열", line(n)],
      ["첫 칸만 큰 배열", head(n)],
      ["마지막 칸만 큰 배열", head(n).slice().reverse()],
    ];
    const rows = shapes.map(([label, a]) => {
      const l8 = countedLite(buildCost(a), 8);
      return [label, num(Math.max(...l8.perLayer)), num(l8.checks)];
    });
    let lo = Number.POSITIVE_INFINITY;
    let hi = 0;
    for (let at = 0; at < n; at++) {
      const a = Array.from({ length: n }, (_, i) => (i === at ? 1000 : 1));
      const first = countedLite(buildCost(a), 2).perLayer[0] as number;
      lo = Math.min(lo, first);
      hi = Math.max(hi, first);
    }
    return `${md(["배열 (n = 256)", "줄 하나의 최대 (k = 8)", "k = 8 합계"], rows, [1, 2])}

한 칸만 큰 배열을 큰 값의 자리마다 ${num(n)} 벌 만들어 재면 줄 하나의 후보 수가 최소 ${num(lo)} · 최대 ${num(hi)} 입니다. 상한 n⌈log₂(n+1)⌉ + 2n 은 ${num(layerBound(n))}${josa(num(layerBound(n)), "이고", "고")}, 같은 규모를 k = 8 로 전부 계산하면 ${num(fullFormula(n, 8))} 입니다.`;
  },

  /** 최악 — 규모를 4 배씩 늘려 상한에 대한 비를 잰다. */
  "perf-worst-growth": () => {
    const rows = [32, 128, 512, 2_048].map((n) => {
      const checks = countedLite(buildCost(head(n)), 2).perLayer[0] as number;
      const bound = layerBound(n);
      return [
        num(n),
        num(checks),
        num(bound),
        (checks / bound).toFixed(3),
        num((n * (n - 1)) / 2),
      ];
    });
    return `${md(["n", "줄 하나의 후보 수", "n⌈log₂(n+1)⌉ + 2n", "그 비", "전부 계산한 후보 수"], rows, [0, 1, 2, 3, 4])}

첫 칸만 큰 배열의 줄 2 입니다.`;
  },

  /** 스스로 점검하기 — T5 가 넣지 않은 j = 0. */
  "check-lower": () => {
    const cands = candidatesOf(WALK_COST, WALK_K, 2, 3);
    const best = Math.min(...cands.map((c) => c.val));
    const lines = cands.map(
      (c) =>
        `  j = ${c.j}   dp[1][${c.j}] + cost[${c.j + 1}][3] = ${num(c.left)} + ${num(c.right)} = ${num(c.val)}${c.val === best ? "   ← 채운 값" : ""}`,
    );
    const zero = cands[0] as { val: number };
    const one = cands[1] as { val: number };
    return `j = 0 을 실제로 넣어 보면

${lines.join("\n")}

${num(zero.val)}${이가(num(zero.val))} ${num(one.val)} 보다 크다`;
  },
};

/** 깊이마다의 후보 수 합 — 줄 2 하나. 기록 없는 사본과 같은 절차에 깊이만 센다. */
function recordLiteDepth(cost: number[][]): Map<number, number> {
  const n = cost.length;
  const prev = (cost[0] as number[]).slice();
  const sums = new Map<number, number>();
  const solve = (
    lo: number,
    hi: number,
    optLo: number,
    optHi: number,
    d: number,
  ): void => {
    if (lo > hi) return;
    const mid = (lo + hi) >> 1;
    let bestCost = INF;
    let bestOpt = optLo;
    const upper = Math.min(optHi, mid - 1);
    for (let j = optLo; j <= upper; j++) {
      sums.set(d, (sums.get(d) ?? 0) + 1);
      const val =
        (prev[j] as number) + ((cost[j + 1] as number[])[mid] as number);
      if (val < bestCost) {
        bestCost = val;
        bestOpt = j;
      }
    }
    if (!sums.has(d)) sums.set(d, 0);
    solve(lo, mid - 1, optLo, bestOpt, d + 1);
    solve(mid + 1, hi, bestOpt, optHi, d + 1);
  };
  solve(0, n - 1, 0, n - 2, 0);
  return sums;
}
