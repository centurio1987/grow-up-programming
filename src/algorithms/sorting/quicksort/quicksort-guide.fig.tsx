/**
 * `quicksort-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 정본의 걸음은 정본 소스에서 기계로
 * 만든 계측 사본 둘이 기록한다 — 부름이 시작할 때마다(`entered`), 비교할 때마다(`logged`). 걸음 전체
 * (기준값 옮기기 · 비교 · 기준값 놓기 · 즉시 반환)는 같은 절차를 다시 쓴 `quickWith` 가 만들고, 그
 * 부름과 비교가 계측 기록과 **하나하나** 같은지 대조한다. 기준값을 고르는 자리만 바꾼 절차(첫 원소 ·
 * 마지막 · 세 값의 중앙값)도 같은 `quickWith` 로 잰다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은
 * 걸음에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는 `quicksort-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import {
  CellStageFilm,
  type StageFrame,
} from "../../../_viz/patterns/CellStage";
import { type LayerBar, LayerBars } from "../../../_viz/patterns/LayerBars";
import { RangeCover } from "../../../_viz/patterns/RangeCover";
import {
  type ArrayOptions,
  type ArrayPiece,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { quickSort } from "./quicksort-guide.ref.ts";

const REF = new URL("./quicksort-guide.ref.ts", import.meta.url).pathname;

/** 기준값과 비교하는 그 한 줄. 계측은 이 줄에만 맞아야 한다. */
export const COMPARE_LINE = /^(\s*)if \(\(arr\[j\] as number\) < pivot\) \{$/;
/** 부름이 시작하자마자 원소 수를 보는 그 한 줄. */
const ENTRY_LINE = /^(\s*)if \(hi - lo < 1\) return;$/;

type Sorter = { quickSort(nums: number[]): number[] };

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 비교 한 번의 기록 — 그 순간의 배열 전체와 구간 · 경계 · 읽는 자리 · 기준값. */
interface CmpRecord {
  readonly arr: readonly number[];
  readonly lo: number;
  readonly hi: number;
  readonly i: number;
  readonly j: number;
  readonly pivot: number;
}

/** 부름 한 번의 기록 — 들어온 순간의 배열과 구간. */
interface CallRecord {
  readonly arr: readonly number[];
  readonly lo: number;
  readonly hi: number;
}

const logged = await loadMutant<Sorter>(REF, {
  swap: [
    COMPARE_LINE,
    "$1if ((() => { (globalThis as unknown as { __qsCmp: { arr: number[]; lo: number; hi: number; i: number; j: number; pivot: number }[] }).__qsCmp.push({ arr: [...arr], lo, hi, i, j, pivot }); return (arr[j] as number) < pivot; })()) {",
  ],
});

const entered = await loadMutant<Sorter>(REF, {
  swap: [
    ENTRY_LINE,
    "$1(globalThis as unknown as { __qsCall: { arr: number[]; lo: number; hi: number }[] }).__qsCall.push({ arr: [...arr], lo, hi }); if (hi - lo < 1) return;",
  ],
});

/** 비교 횟수만 세는 사본. 큰 입력(`n = 50,000`)에 쓴다. */
const counted = await loadMutant<Sorter>(REF, {
  swap: [
    COMPARE_LINE,
    "$1if ((() => { (globalThis as unknown as { __qsCount: { n: number } }).__qsCount.n++; return (arr[j] as number) < pivot; })()) {",
  ],
});

const same = (x: readonly number[], y: readonly number[]): boolean =>
  x.length === y.length && x.every((v, k) => v === y[k]);

/** 정본 한 번 호출의 비교 횟수. 답은 정본과 대조한다. */
export function comparisons(A: readonly number[]): number {
  const g = globalThis as unknown as { __qsCount: { n: number } };
  g.__qsCount = { n: 0 };
  const got = counted.quickSort([...A]);
  if (!same(got, quickSort([...A]))) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  return g.__qsCount.n;
}

/* ───────────────── 같은 절차 — 기준값을 고르는 자리만 바꿀 수 있게 ───────────────── */

/** 구간 `[lo, hi]` 에서 기준값으로 쓸 칸의 인덱스를 고른다. */
export type Choose = (arr: readonly number[], lo: number, hi: number) => number;

const mid = (lo: number, hi: number): number => lo + Math.floor((hi - lo) / 2);

/** 첫 칸 · 가운데 칸 · 끝 칸 세 값 중 가운데 값이 있는 칸. */
const median3: Choose = (arr, lo, hi) => {
  const m = mid(lo, hi);
  const pick = [lo, m, hi].sort(
    (x, y) => (arr[x] as number) - (arr[y] as number) || x - y,
  );
  return pick[1] as number;
};

export const CHOICES: readonly (readonly [string, Choose])[] = [
  ["첫 원소", (_arr, lo) => lo],
  ["중앙", (_arr, lo, hi) => mid(lo, hi)],
  ["마지막", (_arr, _lo, hi) => hi],
  ["세 값의 중앙값", median3],
];
export const FIRST = (CHOICES[0] as readonly [string, Choose])[1];
export const MIDDLE = (CHOICES[1] as readonly [string, Choose])[1];

/** 걸음 하나. 배열은 그 걸음을 마친 뒤의 모습이다. */
export type QsEvent =
  | {
      readonly kind: "enter";
      readonly lo: number;
      readonly hi: number;
      readonly depth: number;
      readonly pivotIdx: number;
      readonly arr: readonly number[];
    }
  | {
      readonly kind: "base";
      readonly lo: number;
      readonly hi: number;
      readonly depth: number;
      readonly arr: readonly number[];
    }
  | {
      readonly kind: "pivot";
      readonly lo: number;
      readonly hi: number;
      readonly pivotIdx: number;
      readonly pivot: number;
      readonly arr: readonly number[];
    }
  | {
      readonly kind: "cmp";
      readonly lo: number;
      readonly hi: number;
      readonly j: number;
      readonly a: number;
      readonly pivot: number;
      /** `a < pivot` 가 참이라 ① 로 갔는가. */
      readonly small: boolean;
      readonly iBefore: number;
      readonly iAfter: number;
      /** 비교하던 순간의 배열 — 계측 기록과 대조한다. */
      readonly before: readonly number[];
      readonly arr: readonly number[];
    }
  | {
      readonly kind: "place";
      readonly lo: number;
      readonly hi: number;
      readonly at: number;
      readonly pivot: number;
      readonly depth: number;
      readonly arr: readonly number[];
    };

/** 원소가 둘 이상인 부름 하나 — 가른 결과. */
export interface Call {
  readonly lo: number;
  readonly hi: number;
  readonly depth: number;
  readonly pivot: number;
  /** 기준값이 놓인 최종 자리. */
  readonly at: number;
  readonly compares: number;
}

export interface Trace {
  readonly input: readonly number[];
  readonly out: number[];
  readonly events: readonly QsEvent[];
  readonly calls: readonly Call[];
  readonly compares: number;
  /** 가장 깊이 내려간 부름의 깊이(맨 바깥 부름이 0). */
  readonly depth: number;
}

/**
 * 정본과 같은 절차를 걸음마다 기록하며 실행한다. `misfile` 을 주면 그 구간의 그 `j` 에서 비교 결과와
 * 상관없이 ① 로 간다 — 「스스로 점검하기」의 가정 하나를 실행하는 데만 쓴다.
 */
export function quickWith(
  choose: Choose,
  A: readonly number[],
  misfile?: { readonly lo: number; readonly hi: number; readonly j: number },
): Trace {
  const arr = [...A];
  const events: QsEvent[] = [];
  const calls: Call[] = [];
  let compares = 0;
  let deepest = 0;
  const swap = (x: number, y: number): void => {
    [arr[x], arr[y]] = [arr[y] as number, arr[x] as number];
  };
  const sort = (lo: number, hi: number, depth: number): void => {
    deepest = Math.max(deepest, depth);
    if (hi - lo < 1) {
      events.push({ kind: "base", lo, hi, depth, arr: [...arr] });
      return;
    }
    const pivotIdx = choose(arr, lo, hi);
    events.push({ kind: "enter", lo, hi, depth, pivotIdx, arr: [...arr] });
    swap(pivotIdx, hi);
    const pivot = arr[hi] as number;
    events.push({ kind: "pivot", lo, hi, pivotIdx, pivot, arr: [...arr] });
    let i = lo;
    let here = 0;
    for (let j = lo; j < hi; j++) {
      compares++;
      here++;
      const before = [...arr];
      const a = arr[j] as number;
      const forced =
        misfile !== undefined &&
        misfile.lo === lo &&
        misfile.hi === hi &&
        misfile.j === j;
      const small = forced || a < pivot;
      const iBefore = i;
      if (small) {
        swap(i, j);
        i++;
      }
      events.push({
        kind: "cmp",
        lo,
        hi,
        j,
        a,
        pivot,
        small,
        iBefore,
        iAfter: i,
        before,
        arr: [...arr],
      });
    }
    swap(i, hi);
    events.push({ kind: "place", lo, hi, at: i, pivot, depth, arr: [...arr] });
    calls.push({ lo, hi, depth, pivot, at: i, compares: here });
    sort(lo, i - 1, depth + 1);
    sort(i + 1, hi, depth + 1);
  };
  sort(0, arr.length - 1, 0);
  return {
    input: [...A],
    out: arr,
    events,
    calls,
    compares,
    depth: deepest,
  };
}

/**
 * 걸음을 남기지 않고 비교 횟수와 깊이만 세는 같은 절차 — 큰 입력에 쓴다. `quickWith` 와 같은 값을
 * 내는지 아래에서 전수로 대조한다.
 */
export function countWith(
  choose: Choose,
  A: readonly number[],
): { out: number[]; compares: number; depth: number } {
  const arr = [...A];
  let compares = 0;
  let deepest = 0;
  const sort = (lo: number, hi: number, depth: number): void => {
    deepest = Math.max(deepest, depth);
    if (hi - lo < 1) return;
    const p = choose(arr, lo, hi);
    [arr[p], arr[hi]] = [arr[hi] as number, arr[p] as number];
    const pivot = arr[hi] as number;
    let i = lo;
    for (let j = lo; j < hi; j++) {
      compares++;
      if ((arr[j] as number) < pivot) {
        [arr[i], arr[j]] = [arr[j] as number, arr[i] as number];
        i++;
      }
    }
    [arr[i], arr[hi]] = [arr[hi] as number, arr[i] as number];
    sort(lo, i - 1, depth + 1);
    sort(i + 1, hi, depth + 1);
  };
  sort(0, arr.length - 1, 0);
  return { out: arr, compares, depth: deepest };
}

/** 정본과 같은 절차(중앙 기준값)의 기록 — 계측 기록과 하나하나 대조한다. */
export function run(A: readonly number[]): Trace {
  const t = quickWith(MIDDLE, A);
  const g = globalThis as unknown as {
    __qsCmp: CmpRecord[];
    __qsCall: CallRecord[];
  };
  g.__qsCmp = [];
  const byCmp = logged.quickSort([...A]);
  const cmpLog = g.__qsCmp;
  g.__qsCall = [];
  const byCall = entered.quickSort([...A]);
  const callLog = g.__qsCall;
  const ref = quickSort([...A]);
  if (!same(byCmp, ref) || !same(byCall, ref) || !same(t.out, ref)) {
    throw new Error("계측 사본이나 다시 쓴 절차가 정본과 다른 답을 냈다");
  }
  const cmps = t.events.filter(
    (e): e is Extract<QsEvent, { kind: "cmp" }> => e.kind === "cmp",
  );
  if (cmps.length !== cmpLog.length) {
    throw new Error("비교 횟수가 정본 기록과 다르다");
  }
  cmps.forEach((e, k) => {
    const r = cmpLog[k] as CmpRecord;
    if (
      r.lo !== e.lo ||
      r.hi !== e.hi ||
      r.i !== e.iBefore ||
      r.j !== e.j ||
      r.pivot !== e.pivot ||
      !same(r.arr, e.before)
    ) {
      throw new Error(`${k + 1} 번째 비교가 정본 기록과 다르다`);
    }
  });
  const enters = t.events.filter(
    (e) => e.kind === "enter" || e.kind === "base",
  );
  if (enters.length !== callLog.length) {
    throw new Error("부름 횟수가 정본 기록과 다르다");
  }
  enters.forEach((e, k) => {
    const r = callLog[k] as CallRecord;
    const at = t.events.indexOf(e);
    const prev = at === 0 ? A : (t.events[at - 1] as QsEvent).arr;
    if (r.lo !== e.lo || r.hi !== e.hi || !same(r.arr, prev)) {
      throw new Error(`${k + 1} 번째 부름이 정본 기록과 다르다`);
    }
  });
  return t;
}

/** 길이 `n` 인 모든 순열(값 0 … n−1). 전수 확인에만 쓴다. */
export function permutations(n: number): number[][] {
  const out: number[][] = [];
  const used = new Array<boolean>(n).fill(false);
  const acc: number[] = [];
  const build = (): void => {
    if (acc.length === n) {
      out.push([...acc]);
      return;
    }
    for (let v = 0; v < n; v++) {
      if (used[v] === true) continue;
      used[v] = true;
      acc.push(v);
      build();
      acc.pop();
      used[v] = false;
    }
  };
  build();
  return out;
}

/** 값이 `0 … k−1` 인 길이 `n` 의 모든 배열 — 같은 값이 섞인 입력의 전수 확인에 쓴다. */
function tuples(n: number, k: number): number[][] {
  let out: number[][] = [[]];
  for (let t = 0; t < n; t++) {
    out = out.flatMap((xs) => Array.from({ length: k }, (_, v) => [...xs, v]));
  }
  return out;
}

// 다시 쓴 절차가 정본과 걸음 하나하나까지 같은가 — 칸 7 개까지의 모든 순열과, 값 세 가지로 만든 칸
// 6 개까지의 모든 배열(같은 값이 섞인 입력)에서 확인한다. 어긋나면 아래 모든 표와 그림이 다른 절차를
// 잰 것이다.
for (let n = 0; n <= 7; n++) for (const p of permutations(n)) run(p);
for (let n = 1; n <= 6; n++) for (const p of tuples(n, 3)) run(p);
// 가벼운 절차(`countWith`)가 기록하는 절차와 같은 값을 내는가 — 기준값 자리 넷 모두, 칸 6 개까지.
for (let n = 0; n <= 6; n++) {
  for (const p of permutations(n)) {
    for (const [name, choose] of CHOICES) {
      const a = quickWith(choose, p);
      const b = countWith(choose, p);
      if (
        !same(a.out, b.out) ||
        a.compares !== b.compares ||
        a.depth !== b.depth
      ) {
        throw new Error(`${name} — 가벼운 절차가 기록하는 절차와 다르다`);
      }
    }
  }
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const A4 = [5, 2, 3, 1];
/** 첫 분할에서 기준값을 끝으로 뺀 뒤의 배열 — 「먼저 알아 둘 개념」이 그 위에 구역을 그린다. */
export const afterPivot = (): readonly number[] =>
  (
    run(A4).events.find((e) => e.kind === "pivot") as Extract<
      QsEvent,
      { kind: "pivot" }
    >
  ).arr;

/** 과제 규모 — 칸 수 `n`. 단순 연산 1 초에 1 억 번 기준으로 시간을 잰다. */
export const N = 50_000;
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toFixed(2)} 초`;
export const num = (x: number): string => x.toLocaleString("en-US");
export const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;
export const sorted = (n: number): number[] => [...Array(n).keys()];

export const cmpsOf = (t: Trace) =>
  t.events.filter(
    (e): e is Extract<QsEvent, { kind: "cmp" }> => e.kind === "cmp",
  );

/* ───────────────── 가장 단순한 방법 — 선택 정렬(제자리) ───────────────── */

export interface SelectionRound {
  readonly compares: number;
  readonly min: number;
  readonly after: number[];
}

/** 본문에 싣는 선택 정렬을 그대로 실행하고 바퀴마다 기록한다. 답은 정본과 대조한다. */
export function selectionRounds(A: readonly number[]): SelectionRound[] {
  const B = [...A];
  const rounds: SelectionRound[] = [];
  for (let k = 0; k < B.length; k++) {
    let min = k;
    let compares = 0;
    for (let t = k + 1; t < B.length; t++) {
      compares++;
      if ((B[t] as number) < (B[min] as number)) min = t;
    }
    [B[k], B[min]] = [B[min] as number, B[k] as number];
    rounds.push({ compares, min: B[k] as number, after: [...B] });
  }
  if (!same(B, quickSort([...A]))) {
    throw new Error("선택 정렬이 정본과 다른 답을 냈다");
  }
  return rounds;
}

/** 선택 정렬의 비교 횟수 `n(n−1)/2` — 칸 1 개부터 200 개까지 두 입력으로 세어 대조한다. */
export const selectionCount = (n: number): number => (n * (n - 1)) / 2;
for (let n = 1; n <= 200; n++) {
  for (const A of [sorted(n), sorted(n).reverse()]) {
    const seen = selectionRounds(A).reduce((s, r) => s + r.compares, 0);
    if (seen !== selectionCount(n)) {
      throw new Error("선택 정렬 비교 횟수가 식과 다르다");
    }
  }
}

/* ───────────────── 앞 편의 병합 정렬 — 새로 잡는 칸 ───────────────── */

/**
 * 반씩 갈라 합치는 병합 정렬(앞 편 `sortArray` 의 절차)을 실행하며 비교 횟수와 **합치기가 새로 잡는
 * 칸 수**를 센다. 합치기 한 번은 두 조각의 칸 수만큼 새 배열을 잡는다. 답은 정본과 대조한다.
 */
export function mergeCounts(A: readonly number[]): {
  compares: number;
  cells: number;
  lastMerge: number;
} {
  let compares = 0;
  let cells = 0;
  let lastMerge = 0;
  const go = (xs: number[]): number[] => {
    if (xs.length <= 1) return xs.slice();
    const m = xs.length >> 1;
    const L = go(xs.slice(0, m));
    const R = go(xs.slice(m));
    const out: number[] = [];
    let i = 0;
    let j = 0;
    while (i < L.length && j < R.length) {
      compares++;
      if ((L[i] as number) <= (R[j] as number)) out.push(L[i++] as number);
      else out.push(R[j++] as number);
    }
    while (i < L.length) out.push(L[i++] as number);
    while (j < R.length) out.push(R[j++] as number);
    cells += out.length;
    lastMerge = out.length;
    return out;
  };
  const out = go([...A]);
  if (!same(out, quickSort([...A]))) {
    throw new Error("병합 정렬이 정본과 다른 답을 냈다");
  }
  return { compares, cells, lastMerge };
}

/* ───────────────── 최악을 만드는 입력 ───────────────── */

/**
 * 중앙 기준값의 최악 입력. 절차가 어느 칸을 기준값으로 고를지 미리 알고 있으므로, 그 칸에 **남은 값
 * 중 가장 작은 값**을 매 부름마다 준다. 그러면 비교가 한 번도 참이 되지 않아 `i` 가 `lo` 에 머물고,
 * 기준값이 구간 맨 앞으로 가서 오른쪽 구간만 한 칸 줄어 남는다. 칸이 아니라 **원래 자리 번호**를
 * 맞바꾸며 따라가면, 끝에 각 원래 자리가 받은 값이 곧 입력이다.
 */
export function killer(n: number): number[] {
  const ids = [...Array(n).keys()];
  const val = new Array<number>(n).fill(0);
  let next = 0;
  let lo = 0;
  const hi = n - 1;
  const swap = (x: number, y: number): void => {
    [ids[x], ids[y]] = [ids[y] as number, ids[x] as number];
  };
  while (hi - lo >= 1) {
    const m = mid(lo, hi);
    val[ids[m] as number] = next++;
    swap(m, hi); // 기준값을 끝으로 뺀다
    swap(lo, hi); // 작은 값이 없어 i = lo — 기준값이 맨 앞에 놓인다
    lo++;
  }
  if (n > 0) val[ids[lo] as number] = next;
  return val;
}

/** 칸 수 `n` 의 최악 비교 횟수 `n(n−1)/2`. */
export const worstCount = (n: number): number => (n * (n - 1)) / 2;

// 만든 최악 입력이 정본에서 실제로 n(n−1)/2 번을 내는가 — 칸 1 개부터 400 개까지 전부, 그리고 몇
// 크기를 더 센다. 첫 원소 기준값의 정렬된 입력도 같은 값을 내는지 같은 범위에서 확인한다.
for (let n = 1; n <= 400; n++) {
  if (comparisons(killer(n)) !== worstCount(n)) {
    throw new Error(`만든 최악 입력이 최악을 내지 못한다 (n = ${n})`);
  }
  if (quickWith(FIRST, sorted(n)).compares !== worstCount(n)) {
    throw new Error(`첫 원소 기준값의 정렬된 입력이 식과 다르다 (n = ${n})`);
  }
}
for (const n of [1_000, 2_000]) {
  if (comparisons(killer(n)) !== worstCount(n)) {
    throw new Error(`만든 최악 입력이 최악을 내지 못한다 (n = ${n})`);
  }
}

/** 규모 `n = 50,000` 의 값. 한쪽이 비는 갈림은 위에서 대조한 식으로 낸다. */
export function scaleCounts() {
  const merge = mergeCounts(sorted(N));
  const middle = countWith(MIDDLE, sorted(N));
  if (middle.compares !== comparisons(sorted(N))) {
    throw new Error("정렬된 입력의 비교 횟수가 정본과 다르다");
  }
  return {
    selection: selectionCount(N),
    mergeCompares: merge.compares,
    mergeCells: merge.cells,
    mergeLast: merge.lastMerge,
    firstSorted: worstCount(N),
    middleSorted: middle.compares,
    middleDepth: middle.depth,
    worst: worstCount(N),
    worstDepth: N - 1,
  };
}

let scaleMemo: ReturnType<typeof scaleCounts> | undefined;
export const scale = (): ReturnType<typeof scaleCounts> => {
  scaleMemo ??= scaleCounts();
  return scaleMemo;
};

/* ───────────────── 순열 전수 — 기준값 자리마다 ───────────────── */

export interface PermStats {
  readonly min: number;
  readonly max: number;
  readonly mean: number;
  readonly maxCount: number;
  readonly total: number;
  readonly firstMax: number[];
}

/** 칸 `n` 개의 모든 순열에서 비교 횟수의 최솟값 · 평균 · 최댓값과 최댓값을 내는 순열 수. */
export function permStats(choose: Choose, n: number): PermStats {
  let min = Number.POSITIVE_INFINITY;
  let max = -1;
  let sum = 0;
  let maxCount = 0;
  let firstMax: number[] = [];
  const perms = permutations(n);
  for (const p of perms) {
    const c =
      choose === MIDDLE ? comparisons(p) : countWith(choose, p).compares;
    sum += c;
    if (c < min) min = c;
    if (c > max) {
      max = c;
      maxCount = 0;
      firstMax = p;
    }
    if (c === max) maxCount++;
  }
  return {
    min,
    max,
    mean: sum / perms.length,
    maxCount,
    total: perms.length,
    firstMax,
  };
}

const statsMemo = new Map<Choose, PermStats>();
export const stats8 = (choose: Choose): PermStats => {
  const hit = statsMemo.get(choose);
  if (hit !== undefined) return hit;
  const s = permStats(choose, 8);
  statsMemo.set(choose, s);
  return s;
};

/* ───────────────── 선택 알고리즘 — 한쪽만 따라간다 ───────────────── */

/**
 * `k` 번째로 작은 값(0 부터)을 찾는다. 정본과 같은 분할을 하되 기준값의 자리가 `k` 가 아니면 `k` 가
 * 든 한쪽 구간만 다시 가른다. 비교 횟수를 함께 돌려주고, 답은 정본 정렬 결과의 `k` 번째와 대조한다.
 */
export function selectKth(
  A: readonly number[],
  k: number,
): {
  value: number;
  compares: number;
  steps: { lo: number; hi: number; at: number; pivot: number; side: string }[];
} {
  const arr = [...A];
  let lo = 0;
  let hi = arr.length - 1;
  let compares = 0;
  const steps: {
    lo: number;
    hi: number;
    at: number;
    pivot: number;
    side: string;
  }[] = [];
  while (lo < hi) {
    const p = mid(lo, hi);
    [arr[p], arr[hi]] = [arr[hi] as number, arr[p] as number];
    const pivot = arr[hi] as number;
    let i = lo;
    for (let j = lo; j < hi; j++) {
      compares++;
      if ((arr[j] as number) < pivot) {
        [arr[i], arr[j]] = [arr[j] as number, arr[i] as number];
        i++;
      }
    }
    [arr[i], arr[hi]] = [arr[hi] as number, arr[i] as number];
    const side = i === k ? "찾았다" : k < i ? "왼쪽" : "오른쪽";
    steps.push({ lo, hi, at: i, pivot, side });
    if (i === k) break;
    if (k < i) hi = i - 1;
    else lo = i + 1;
  }
  const value = arr[k] as number;
  if (value !== quickSort([...A])[k]) {
    throw new Error("선택 알고리즘이 정본 정렬과 다른 값을 냈다");
  }
  return { value, compares, steps };
}

/* ───────────────── 시도한 방법 ───────────────── */

function approaches(): Approach[] {
  const s = scale();
  return [
    {
      name: "선택 정렬",
      idea: "남은 칸 중 가장 작은 값을 찾아 맨 앞 칸과 맞바꾸기를 되풀이한다",
      verdict: "drop",
      checks: [
        { label: "새 칸", value: "0 칸", ok: true },
        {
          label: "비교",
          value: `${num(s.selection)} 번 · ${secondsOf(s.selection)}`,
          ok: false,
        },
      ],
      lesson: "한 바퀴가 자리 하나만 정한다 — 반씩 나눠 따로 정렬하면 어떨까",
    },
    {
      name: "병합 정렬(앞 편)",
      idea: "자리로 반씩 가른 두 조각을 각각 정렬한 뒤 새 배열에 합친다",
      verdict: "drop",
      checks: [
        {
          label: "새 칸",
          value: `합치기가 누적 ${num(s.mergeCells)} 칸`,
          ok: false,
        },
        {
          label: "비교",
          value: `정렬된 입력 ${num(s.mergeCompares)} 번`,
          ok: true,
        },
      ],
      lesson:
        "자리로 갈라서 합쳐야 한다 — 값으로 갈라 두면 합칠 일이 없지 않을까",
    },
    {
      name: "첫 원소 기준값으로 가르기",
      idea: "구간의 첫 값보다 작은 값을 왼쪽에 모으고, 그 값을 경계에 놓는다",
      verdict: "drop",
      checks: [
        { label: "새 칸", value: "0 칸", ok: true },
        {
          label: "비교",
          value: `정렬된 입력 ${num(s.firstSorted)} 번`,
          ok: false,
        },
      ],
      lesson: "정렬된 입력에서 한쪽이 매번 빈다 — 가운데 값을 고르면 어떨까",
    },
    {
      name: "가운데 기준값으로 제자리 분할",
      idea: "구간 가운데 칸의 값으로 같은 분할을 하고 양쪽을 되풀이한다",
      verdict: "keep",
      checks: [
        { label: "새 칸", value: "0 칸", ok: true },
        {
          label: "비교",
          value: `정렬된 입력 ${num(s.middleSorted)} 번 · ${secondsOf(s.middleSorted)}`,
          ok: true,
        },
        {
          label: "최악",
          value: `만든 입력 ${num(s.worst)} 번 — 막지 못한다`,
          ok: false,
        },
      ],
    },
  ];
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly stage: ArrayStep;
}

/** 전체 실행 무대의 이름표. */
export const RUN_OPTIONS: ArrayOptions = {
  arrayName: "arr",
  rangeLabel: "부름",
};

/** 분할 도중의 두 구역 — 작음 `[lo, i−1]` 과 큼 `[i, j]`. 빈 구역은 싣지 않는다. */
function regions(lo: number, i: number, j: number): ArrayPiece[] {
  const out: ArrayPiece[] = [];
  if (i - 1 >= lo)
    out.push({ label: "작음", from: lo, to: i - 1, tone: "left" });
  if (j >= i) out.push({ label: "큼", from: i, to: j, tone: "right" });
  return out;
}

/** 걸음마다 — 부름 · 기준값 옮기기 · 비교 · 기준값 놓기 · 즉시 반환. 무대 아래 줄은 확정된 칸이다. */
function traceSteps(t: Trace, from: number): Step[] {
  let n = from;
  let total = 0;
  const fixed: (number | null)[] = t.input.map(() => null);
  const layer = (write: number[]) => [
    { name: "확정", values: [...fixed], write },
  ];
  return t.events.map((e): Step => {
    const id = `T${n++}`;
    if (e.kind === "base") {
      const size = e.hi - e.lo + 1;
      const write: number[] = [];
      if (size === 1) {
        fixed[e.lo] = e.arr[e.lo] as number;
        write.push(e.lo);
      }
      const v = e.arr[e.lo] as number;
      return {
        id,
        title: `sort(${e.lo},${e.hi}) 즉시 반환`,
        detail: `hi - lo = ${e.hi - e.lo}${josa(e.hi - e.lo, "이", "가")} 1 보다 작아 즉시 반환합니다. ${
          size === 1
            ? `칸 ${e.lo} 의 값 ${v}${이가(v)} 그대로 제자리입니다.`
            : "구간이 비어 있습니다."
        }`,
        stage: {
          array: [...e.arr],
          range: size === 1 ? [e.lo, e.hi] : null,
          read: [],
          write: [],
          calc: { expr: `${e.hi} - ${e.lo}`, result: String(e.hi - e.lo) },
          vars: `비교 누적 ${total} 번`,
          layers: layer(write),
        },
      };
    }
    if (e.kind === "enter") {
      const v = e.arr[e.pivotIdx] as number;
      const half = Math.floor((e.hi - e.lo) / 2);
      return {
        id,
        title: `sort(${e.lo},${e.hi}) 시작`,
        detail: `hi - lo = ${e.hi - e.lo}${josa(e.hi - e.lo, "이라", "라")} 계속합니다. 가운데 칸은 pivotIdx = ${e.lo} + ⌊${e.hi - e.lo}/2⌋ = ${e.pivotIdx} 이고 그 값은 ${v} 입니다.`,
        stage: {
          array: [...e.arr],
          range: [e.lo, e.hi],
          read: [e.pivotIdx],
          write: [],
          calc: {
            expr: `${e.lo} + ⌊${e.hi - e.lo}/2⌋`,
            result: String(e.lo + half),
          },
          vars: `비교 누적 ${total} 번`,
          layers: layer([]),
        },
      };
    }
    if (e.kind === "pivot") {
      return {
        id,
        title: `기준값 ${e.pivot}${을를(e.pivot)} 끝으로`,
        detail:
          e.pivotIdx === e.hi
            ? `가운데 칸이 이미 끝 칸 ${e.hi} 입니다. 기준값은 ${e.pivot} 입니다.`
            : `인덱스 ${e.pivotIdx}${과와(e.pivotIdx)} ${e.hi}${을를(e.hi)} 맞바꿔 기준값 ${e.pivot}${을를(e.pivot)} hi = ${e.hi} 에 둡니다. i 는 lo = ${e.lo} 에서 시작합니다.`,
        stage: {
          array: [...e.arr],
          range: [e.lo, e.hi],
          read: [],
          write: e.pivotIdx === e.hi ? [e.hi] : [e.pivotIdx, e.hi],
          pointers: { i: e.lo },
          calc: { expr: "pivot", result: String(e.pivot) },
          vars: `비교 누적 ${total} 번`,
          layers: layer([]),
        },
      };
    }
    if (e.kind === "cmp") {
      total++;
      const verdict = e.small
        ? `참이라 ① 로 arr[${e.iBefore}]${과와(e.iBefore)} arr[${e.j}]${을를(e.j)} 맞바꾸고 i 를 ${e.iBefore} 에서 ${e.iAfter}${으로(e.iAfter)} 늘립니다.`
        : `거짓이라 ② 로 그대로 둡니다. i 는 ${e.iAfter} 그대로입니다.`;
      return {
        id,
        title: `j=${e.j} ${e.a} < ${e.pivot} ${e.small ? "①" : "②"}`,
        detail: `arr[${e.j}] = ${e.a}${과와(e.a)} 기준값 ${e.pivot}${을를(e.pivot)} 비교합니다. ${e.a} < ${e.pivot}${이가(e.pivot)} ${verdict}`,
        stage: {
          array: [...e.arr],
          range: [e.lo, e.hi],
          read: [e.j, e.hi],
          write: e.small
            ? [...new Set([e.iBefore, e.j])].sort((x, y) => x - y)
            : [],
          pieces: regions(e.lo, e.iAfter, e.j),
          pointers: { i: e.iAfter, j: e.j },
          calc: {
            expr: `${e.a} < ${e.pivot}`,
            result: e.small ? "참" : "거짓",
          },
          vars: `비교 누적 ${total} 번`,
          layers: layer([]),
        },
      };
    }
    // place
    fixed[e.at] = e.pivot;
    const pieces: ArrayPiece[] = [];
    if (e.at - 1 >= e.lo) {
      pieces.push({ label: "왼쪽", from: e.lo, to: e.at - 1, tone: "left" });
    }
    if (e.hi >= e.at + 1) {
      pieces.push({ label: "오른쪽", from: e.at + 1, to: e.hi, tone: "right" });
    }
    return {
      id,
      title: `기준값 ${e.pivot}${을를(e.pivot)} i=${e.at} 에`,
      detail: `루프가 끝났고 i = ${e.at} 입니다. arr[${e.at}]${과와(e.at)} arr[${e.hi}]${을를(e.hi)} 맞바꿔 기준값 ${e.pivot}${을를(e.pivot)} 인덱스 ${e.at} 에 놓습니다. 이 자리가 ${e.pivot} 의 최종 자리이고, 남은 일은 sort(${e.lo},${e.at - 1}) 과 sort(${e.at + 1},${e.hi}) 입니다.`,
      stage: {
        array: [...e.arr],
        range: [e.lo, e.hi],
        read: [],
        write: e.at === e.hi ? [e.hi] : [e.at, e.hi],
        pieces,
        pointers: { i: e.at },
        calc: null,
        vars: `비교 누적 ${total} 번`,
        layers: layer([e.at]),
      },
    };
  });
}

/** 전개 입력의 걸음 전부(T1 부터). */
export const walkSteps = (): Step[] => traceSteps(run(A4), 1);

const film = (steps: Step[], opts: ArrayOptions): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(s.stage, opts),
  }));

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `quicksort-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    partition: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

/* ───────────────── 부름 — 깊이마다 ───────────────── */

/** 깊이마다 부름 구간 막대. 원소가 하나인 부름도 싣는다(빈 구간은 칸이 없어 뺀다). */
function callBars(t: Trace): LayerBar[][] {
  const out: LayerBar[][] = [];
  for (const e of t.events) {
    if (e.kind !== "base" && e.kind !== "place") continue;
    if (e.kind === "base" && e.hi < e.lo) continue;
    const depth =
      e.kind === "base"
        ? e.depth
        : (t.calls.find((c) => c.lo === e.lo && c.hi === e.hi) as Call).depth;
    while (out.length <= depth) out.push([]);
    const call = t.calls.find((c) => c.lo === e.lo && c.hi === e.hi);
    (out[depth] as LayerBar[]).push({
      label: `[${e.lo},${e.hi}]`,
      from: e.lo,
      to: e.hi,
      note:
        call === undefined
          ? `깊이 ${depth} · 원소 하나`
          : `깊이 ${depth} · 기준값 ${call.pivot} · 비교 ${call.compares} 번`,
    });
  }
  return out.map((lv) => [...lv].sort((x, y) => x.from - y.from));
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-partition": () => {
    const t = run(A4);
    const first = t.calls[0] as Call;
    const place = t.events.find((e) => e.kind === "place") as Extract<
      QsEvent,
      { kind: "place" }
    >;
    return (
      <RangeCover
        title={`${show(A4)}${을를(A4.at(-1) as number)} 기준값 ${first.pivot} 로 한 번 가른 뒤`}
        row={{ label: "분할 뒤", values: [...place.arr] }}
        indexLabel="인덱스"
        ranges={[
          {
            from: first.lo,
            to: first.at - 1,
            tone: "left",
            note: `${first.pivot} 보다 작은 값`,
          },
          {
            from: first.at,
            to: first.at,
            tone: "query",
            note: `기준값 ${first.pivot} — 제자리`,
          },
          {
            from: first.at + 1,
            to: first.hi,
            tone: "right",
            note: `${first.pivot} 이상인 값`,
          },
        ]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`칸 ${num(N)} 개 · 새 배열 없이 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-regions": () => {
    const t = run(A4);
    const e = cmpsOf(t)[1] as Extract<QsEvent, { kind: "cmp" }>;
    const pieces: ArrayPiece[] = [
      ...regions(e.lo, e.iAfter, e.j),
      ...(e.j + 1 <= e.hi - 1
        ? [
            {
              label: "아직",
              from: e.j + 1,
              to: e.hi - 1,
              tone: "left" as const,
            },
          ]
        : []),
      { label: "기준값", from: e.hi, to: e.hi, tone: "right" },
    ];
    const frame: StageFrame = {
      id: `j=${e.j}`,
      text: `arr[${e.j}] 을 읽은 뒤 — i = ${e.iAfter}, j = ${e.j}`,
      rows: arrayStage(
        {
          array: [...e.arr],
          range: [e.lo, e.hi],
          read: [],
          write: [],
          pieces,
          pointers: { i: e.iAfter, j: e.j },
        },
        RUN_OPTIONS,
      ),
    };
    return (
      <CellStageFilm
        title={`분할 도중의 네 구역 — ${show(afterPivot())} 에서 기준값 ${e.pivot}`}
        columns={A4.length}
        frames={[frame]}
      />
    );
  },
  "build-calls-middle": () => {
    const t = run(sorted(8));
    return (
      <LayerBars
        title="정렬된 [0 1 2 3 4 5 6 7] — 가운데 칸을 기준값으로 고른 부름"
        values={sorted(8)}
        valuesLabel="입력"
        indexLabel="인덱스"
        groups={callBars(t)}
      />
    );
  },
  "build-calls-first": () => {
    const t = quickWith(FIRST, sorted(8));
    return (
      <LayerBars
        title="정렬된 [0 1 2 3 4 5 6 7] — 첫 칸을 기준값으로 고른 부름"
        values={sorted(8)}
        valuesLabel="입력"
        indexLabel="인덱스"
        groups={callBars(t)}
      />
    );
  },
  "walk-partition": () => {
    const steps = walkSteps();
    return (
      <CellStageFilm
        title={`quickSort([${A4.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={A4.length}
        frames={film(steps, RUN_OPTIONS)}
      />
    );
  },
};
