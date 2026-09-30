/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업**에 두 설계를 세우고 **결정론적 계수**만 센다. 벽시계·처리량은
 * 실행마다 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-guide.alt.ts
 *
 * **경쟁 설계는 크누스 최적화다.** 같은 전제(사각 부등식) 아래서 최적 가르는 자리가 칸을 따라서도,
 * 줄을 따라서도 줄지 않는다는 것(`opt(g-1, i) ≤ opt(g, i) ≤ opt(g, i+1)`)을 써서, 칸 `i` 의 후보를
 * 이웃 두 값 사이로 가둔다. 줄 안에서 칸을 뒤에서부터 채운다. 가르는 자리를 전부 계산하는 방법은
 * 「아이디어를 떠올리는 과정」이 이미 반박한 단순한 방법이라 여기 세우지 않는다(SPEC §3
 * `purpose.alt` — 열등한 상대를 세우지 않는다).
 *
 * **잣대는 원고 전체와 같은 후보 수다.** 가르는 자리 하나를 넣어 `prev[j] + cost[j+1][i]` 를
 * 만들고 지금까지의 최솟값과 비교한 한 번이 1 이다. 저장 칸은 설계가 새로 잡는 칸 수다 — 비용
 * 행렬 `n × n` 은 입력이라 두 설계 모두 세지 않는다.
 *
 * **두 설계가 매 실행마다 같은 답을 내는지 먼저 확인한다**(`확인()`). 답이 다른 구현으로 잰
 * 계수는 저울질이 아니라 다른 문제의 값이다 — 정본(`.ref.ts`)의 반환값을 두 설계와 대조한다.
 *
 * **입력은 생성식으로 고정한다.** 배열은 `a = [1, 2, …, n]`(「아이디어를 떠올리는 과정」이 과제 규모에서
 * 쓰는 것과 같은 모양), 비용은 구간 합의 제곱, 칸 수는 `n = 2,000`(과제 규모의 상한)이고 **구역 수 `k` 만
 * 바꾼다.** 전개 입력(칸 넷)은 두 설계의 순서가 갈리는 `k` 를 보이기에 너무 작아서, 전개 입력의 값은 따로
 * 한 줄 남긴다(L20).
 *
 * **입력을 바꾼 이력(KAN-058, 2026-09-30).** 옛 판은 경쟁 설계가 「가르는 자리를 전부 계산하는 방법」이었고
 * 배열이 `a[i] = (i * 7 % 5) + 1`, 구역 수 `k = 3` 고정에 칸 수를 바꿨다. 경쟁 설계를 크누스 최적화로 바꾸며
 * 갈리는 축이 칸 수가 아니라 구역 수가 되어, 과제 규모의 칸 수에 원고 본문과 같은 배열을 쓴다.
 */

import { divideAndConquerDp, INF } from "./divideAndConquerDp-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 배열과 구역 수. */
export const WALK_A = [1, 2, 3, 4];
export const WALK_K = 3;

/** 칸 수 — 과제 규모의 상한. `k` 하나만 바꾸려고 고정한다. */
export const N = 2_000;

/** `a = [1, 2, …, n]`. */
export function seq(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

/** `cost[i][j] = (a[i] + … + a[j])^2`. 사각 부등식을 만족하는 전형 예시다. */
export function buildCost(a: number[]): number[][] {
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

/* ────────────────────────── 두 설계 ────────────────────────── */

export interface Run {
  /** 줄마다의 후보 수. 첫 원소가 줄 2 다 — 앞에서부터 더하면 `k` 마다의 합이 나온다. */
  perLayer: number[];
  cells: number;
  answer: number;
}

/**
 * 이 가이드의 절차. 정본(`divideAndConquerDp-guide.ref.ts`)과 같고 세는 자리만 덧붙였다.
 * `저장 칸` 은 이전 줄과 이번 줄 배열, 그리고 재귀가 가장 깊었을 때의 호출 틀 수를 더한 것이다.
 */
export function 분할정복(cost: number[][], k: number): Run {
  const n = cost.length;
  const base = cost[0] as number[];
  let prev: number[] = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = base[i] as number;
  const perLayer: number[] = [];
  let peak = 0;

  for (let g = 2; g <= k; g++) {
    const cur: number[] = new Array<number>(n).fill(INF);
    let count = 0;
    const solve = (
      lo: number,
      hi: number,
      optLo: number,
      optHi: number,
      depth: number,
    ): void => {
      peak = Math.max(peak, depth);
      if (lo > hi) return;
      const mid = (lo + hi) >> 1;
      let bestCost = INF;
      let bestOpt = optLo;
      const upper = Math.min(optHi, mid - 1);
      for (let j = optLo; j <= upper; j++) {
        count++;
        const row = cost[j + 1] as number[];
        const val = (prev[j] as number) + (row[mid] as number);
        if (val < bestCost) {
          bestCost = val;
          bestOpt = j;
        }
      }
      cur[mid] = bestCost;
      solve(lo, mid - 1, optLo, bestOpt, depth + 1);
      solve(mid + 1, hi, bestOpt, optHi, depth + 1);
    };
    solve(0, n - 1, 0, n - 2, 1);
    perLayer.push(count);
    prev = cur;
  }
  return { perLayer, cells: 2 * n + peak, answer: prev[n - 1] as number };
}

/**
 * 경쟁 설계 — **크누스 최적화.** 칸 `i` 의 후보를 `[opt(g-1, i), opt(g, i+1)]` 로 가둔다. 앞은 이전
 * 줄에서, 뒤는 같은 줄의 오른쪽 이웃에서 오므로 줄 안에서 칸을 **뒤에서부터** 채운다. 줄 하나의 후보
 * 수는 입력에 따라 크게 갈리지만, 줄 `k` 개를 모두 더하면 대각선마다 합이 이어 붙어(망원합) 전체가
 * `n²` 규모에 머문다.
 *
 * `저장 칸` 은 이전 줄 · 이번 줄 배열에, 이전 줄 · 이번 줄의 최적 가르는 자리 배열을 더한 것이다. 재귀가
 * 없어 호출 틀이 없다.
 */
export function 크누스(cost: number[][], k: number): Run {
  const n = cost.length;
  let prev = (cost[0] as number[]).slice();
  let optPrev = new Array<number>(n).fill(0);
  const perLayer: number[] = [];
  for (let g = 2; g <= k; g++) {
    const cur = new Array<number>(n).fill(INF);
    const opt = new Array<number>(n).fill(0);
    let count = 0;
    for (let i = n - 1; i >= 0; i--) {
      // 구역 수보다 칸이 적으면 만들 수 없는 칸이다. 뒤 칸의 상한으로만 쓰이므로 i - 1 을 둔다.
      if (i < g - 1) {
        opt[i] = Math.max(0, i - 1);
        continue;
      }
      const lo = Math.max(optPrev[i] as number, g - 2);
      const hi = Math.min(i === n - 1 ? n - 2 : (opt[i + 1] as number), i - 1);
      let best = INF;
      let found = lo;
      for (let j = lo; j <= hi; j++) {
        count++;
        const val =
          (prev[j] as number) + ((cost[j + 1] as number[])[i] as number);
        if (val < best) {
          best = val;
          found = j;
        }
      }
      cur[i] = best;
      opt[i] = found;
    }
    perLayer.push(count);
    prev = cur;
    optPrev = opt;
  }
  return { perLayer, cells: 4 * n, answer: prev[n - 1] as number };
}

/* ────────────────────────── 대조 ────────────────────────── */

/** 두 설계가 **정본과 같은 답**을 내는지 확인한다. 다르면 대조가 성립하지 않는다. */
function 확인(): void {
  const inputs: [number[], number][] = [[WALK_A, WALK_K]];
  for (const n of [1, 2, 5, 9, 16, 40])
    for (const k of [1, 2, 3, n]) if (k <= n) inputs.push([seq(n), k]);
  // 준무작위 배열 — 값 0 … 9, 칸 1 … 12, 구역 수 전부.
  let seed = 7;
  const rnd = (): number => {
    seed = (seed * 48_271) % 2_147_483_647;
    return seed;
  };
  for (let t = 0; t < 200; t++) {
    const n = 1 + (rnd() % 12);
    const a = Array.from({ length: n }, () => rnd() % 10);
    for (let k = 1; k <= n; k++) inputs.push([a, k]);
  }
  for (const [a, k] of inputs) {
    const cost = buildCost(a);
    const want = divideAndConquerDp(cost, k);
    const x = 분할정복(cost, k);
    const y = 크누스(cost, k);
    if (x.answer !== want)
      throw new Error(
        `세는 사본이 정본과 다른 답을 낸다 — ${x.answer} vs ${want}`,
      );
    if (y.answer !== want)
      throw new Error(
        `크누스 최적화가 정본과 다른 답을 낸다 — ${y.answer} vs ${want}`,
      );
  }
}
확인();

/** 앞에서부터 더한 합 — `k` 개 구역일 때의 후보 수는 `sums[k - 2]`. */
const prefixSums = (xs: readonly number[]): number[] => {
  const out: number[] = [];
  let acc = 0;
  for (const x of xs) {
    acc += x;
    out.push(acc);
  }
  return out;
};

interface Sweep {
  dc: number[];
  kn: number[];
  dcCells: number;
  knCells: number;
}

let cache: Sweep | null = null;

/** `n = 2,000`, `k = 2,000` 을 한 번 돌리면 줄마다의 후보 수가 나오고, 그 합이 `k` 마다의 값이다. */
export function sweepK(): Sweep {
  if (cache === null) {
    const cost = buildCost(seq(N));
    const x = 분할정복(cost, N);
    const y = 크누스(cost, N);
    if (x.answer !== y.answer) throw new Error("두 설계의 답이 다르다");
    cache = {
      dc: prefixSums(x.perLayer),
      kn: prefixSums(y.perLayer),
      dcCells: x.cells,
      knCells: y.cells,
    };
  }
  return cache;
}

/** `k` 개 구역일 때의 후보 수. */
export const countAt = (sums: readonly number[], k: number): number =>
  k < 2 ? 0 : (sums[k - 2] as number);

/**
 * `k` 를 늘려 가며 순서가 뒤집히는 자리를 찾는다. `last` 는 분할 정복 최적화가 아직 적은 마지막
 * `k`, `first` 는 크누스 최적화가 처음으로 적어지는 `k` 다. 뒤집혔다가 되돌아오면 경계를 한
 * 자리로 말할 수 없으므로 던진다.
 */
export function crossing(): { last: number; first: number } {
  const { dc, kn } = sweepK();
  let first = -1;
  for (let k = 2; k <= N; k++) {
    const dcFewer = countAt(dc, k) < countAt(kn, k);
    if (!dcFewer && first < 0) first = k;
    if (dcFewer && first >= 0)
      throw new Error(`k = ${first} 에서 뒤집혔다가 k = ${k} 에서 되돌아온다`);
  }
  if (first <= 2)
    throw new Error("k 를 늘려도 순서가 뒤집히지 않거나 처음부터 뒤집혀 있다");
  return { last: first - 1, first };
}

const CROSS = crossing();

/** 표에 싣는 구역 수 — 가장 작은 k, 뒤집히기 직전과 직후, 과제 규모의 상한. */
export const K_SHOWN = [2, CROSS.last, CROSS.first, N];

function 재기(
  run: (cost: number[][], k: number) => Run,
  sums: readonly number[],
  cells: number,
): Record<string, number> {
  const walk = run(buildCost(WALK_A), WALK_K);
  const out: Record<string, number> = {
    "전개 입력 · 후보 수": walk.perLayer.reduce((s, v) => s + v, 0),
  };
  for (const k of K_SHOWN) out[`k = ${k} · 후보 수`] = countAt(sums, k);
  out["저장 칸"] = cells;
  return out;
}

export const cases = {
  "분할 정복 최적화 (이 가이드)": () =>
    재기(분할정복, sweepK().dc, sweepK().dcCells),
  "크누스 최적화": () => 재기(크누스, sweepK().kn, sweepK().knCells),
  경계: () => ({
    "분할 정복 최적화가 적은 마지막 k": CROSS.last,
    "크누스 최적화가 적은 첫 k": CROSS.first,
  }),
};
