/**
 * `sortArray-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 합치기 안의 비교 하나하나는 정본
 * 소스에서 기계로 만든 계측 사본(`recorded`)이 기록하고, 답은 정본이 낸다. 기록이 어느 칸 구간의
 * 합치기인지는 가르는 규칙(`mid = n >> 1`)으로 자리를 되짚어 맞추고, 되짚은 자리의 값이 기록된 두
 * 조각과 같은지 대조한다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts`
 * 의 리터럴이 그것과 같은지는 `sortArray-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
import {
  type ArrayOptions,
  type ArrayPiece,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { sortArray } from "./sortArray-guide.ref.ts";

const REF = new URL("./sortArray-guide.ref.ts", import.meta.url).pathname;

/** 머리 둘을 비교하는 그 한 줄. 계측은 이 줄에만 맞아야 한다. */
const COMPARE_LINE =
  /^(\s*)if \(\(L\[i\] as number\) <= \(R\[j\] as number\)\) \{$/;

type Sorter = { sortArray(A: number[]): number[] };

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 비교 한 번의 기록 — 그 순간의 두 조각 전체와 머리 자리. */
interface CmpRecord {
  readonly L: readonly number[];
  readonly R: readonly number[];
  readonly i: number;
  readonly j: number;
}

/**
 * 비교할 때마다 두 조각과 머리 자리를 기록하는 사본. **정본 소스에서 기계로 만든다** — 비교하는
 * 그 한 줄에 정확히 맞지 않으면 `loadMutant` 가 던진다. 조각을 복사해 두므로 작은 입력에만 쓴다.
 */
const recorded = await loadMutant<Sorter>(REF, {
  swap: [
    COMPARE_LINE,
    "$1if ((() => { (globalThis as unknown as { __cmpLog: { L: number[]; R: number[]; i: number; j: number }[] }).__cmpLog.push({ L: [...L], R: [...R], i, j }); return (L[i] as number) <= (R[j] as number); })()) {",
  ],
});

/** 비교 횟수만 세는 사본. 큰 입력(`N = 100,000`)에 쓴다. */
const counted = await loadMutant<Sorter>(REF, {
  swap: [
    COMPARE_LINE,
    "$1if ((() => { (globalThis as unknown as { __cmpCount: { n: number } }).__cmpCount.n++; return (L[i] as number) <= (R[j] as number); })()) {",
  ],
});

/** 합치기 함수를 밖으로 내놓은 사본 — 「이 방법이 기대는 전제」가 정렬 안 된 조각을 넣어 본다. */
const exported = await loadMutant<{
  merge(L: number[], R: number[]): number[];
}>(REF, {
  swap: [
    /^function merge\(L: number\[\], R: number\[\]\): number\[\] \{$/,
    "export function merge(L: number[], R: number[]): number[] {",
  ],
});

/** 정본의 합치기 — 조각 둘을 그대로 넣는다. */
export const mergeRef = (L: readonly number[], R: readonly number[]) =>
  exported.merge([...L], [...R]);

/** 정본 한 번 호출의 비교 횟수. 답은 정본과 대조한다. */
export function comparisons(A: readonly number[]): number {
  const g = globalThis as unknown as { __cmpCount: { n: number } };
  g.__cmpCount = { n: 0 };
  const got = counted.sortArray([...A]);
  const want = sortArray([...A]);
  if (got.length !== want.length || got.some((v, k) => v !== want[k])) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  return g.__cmpCount.n;
}

/** 합치기 안의 비교 하나 — 머리 둘과 어느 쪽을 꺼냈는가. */
export interface Cmp {
  readonly i: number;
  readonly j: number;
  readonly a: number;
  readonly b: number;
  /** `a <= b` 가 참이라 왼쪽(②)을 꺼냈는가. */
  readonly left: boolean;
}

/** 합치기 한 번. 칸 구간 `[lo, hi]` 를 `mid` 칸 · 나머지로 가른 두 조각을 합친 것이다. */
export interface MergeEvent {
  readonly kind: "merge";
  readonly lo: number;
  readonly hi: number;
  readonly mid: number;
  readonly depth: number;
  readonly L: readonly number[];
  readonly R: readonly number[];
  readonly cmps: readonly Cmp[];
  /** 반복이 끝난 뒤 이어 붙인 쪽 — `L` 이면 ④, `R` 이면 ⑤. */
  readonly tail: { readonly side: "L" | "R"; readonly values: number[] };
  readonly out: readonly number[];
  /** 이 합치기를 끝낸 뒤 배열 전체를 제자리에 놓고 본 모습. */
  readonly after: readonly number[];
}

/** 칸이 둘 이상인 부름 하나 — `mid` 에서 가른다. */
export interface SplitEvent {
  readonly kind: "split";
  readonly lo: number;
  readonly hi: number;
  readonly mid: number;
  readonly depth: number;
  readonly after: readonly number[];
}

export type SortEvent = SplitEvent | MergeEvent;

export interface Run {
  readonly input: readonly number[];
  readonly result: number[];
  readonly events: readonly SortEvent[];
  /** 칸이 하나 이하라 ① 로 돌아간 부름 수. */
  readonly bases: number;
  readonly comparisons: number;
}

const same = (x: readonly number[], y: readonly number[]): boolean =>
  x.length === y.length && x.every((v, k) => v === y[k]);

/**
 * 정본 한 번 호출의 기록. 비교 기록을 합치기 단위로 묶고(`i = j = 0` 이 새 합치기의 첫 비교다),
 * 가르는 규칙으로 되짚은 칸 구간의 값이 기록된 두 조각과 같은지 대조한다.
 */
export function run(A: readonly number[]): Run {
  const g = globalThis as unknown as { __cmpLog: CmpRecord[] };
  g.__cmpLog = [];
  const result = recorded.sortArray([...A]);
  if (!same(result, sortArray([...A]))) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  const log = g.__cmpLog;
  const groups: CmpRecord[][] = [];
  for (const c of log) {
    if (c.i === 0 && c.j === 0) groups.push([]);
    (groups.at(-1) as CmpRecord[]).push(c);
  }
  const merges = groups.map((grp) => {
    const first = grp[0] as CmpRecord;
    const L = [...first.L];
    const R = [...first.R];
    const cmps: Cmp[] = grp.map((c) => {
      const a = L[c.i] as number;
      const b = R[c.j] as number;
      return { i: c.i, j: c.j, a, b, left: a <= b };
    });
    // 다음 비교의 머리 자리가 앞 비교의 꺼낸 쪽과 맞아야 한다. 아니면 갈래를 잘못 읽은 것이다.
    for (let k = 1; k < cmps.length; k++) {
      const p = cmps[k - 1] as Cmp;
      const c = cmps[k] as Cmp;
      if (c.i !== p.i + (p.left ? 1 : 0) || c.j !== p.j + (p.left ? 0 : 1)) {
        throw new Error("비교 기록의 머리 자리가 앞 비교와 이어지지 않는다");
      }
    }
    const last = cmps.at(-1) as Cmp;
    const iEnd = last.i + (last.left ? 1 : 0);
    const jEnd = last.j + (last.left ? 0 : 1);
    const tail =
      iEnd < L.length
        ? { side: "L" as const, values: L.slice(iEnd) }
        : { side: "R" as const, values: R.slice(jEnd) };
    const out = [...cmps.map((c) => (c.left ? c.a : c.b)), ...tail.values];
    return { L, R, cmps, tail, out };
  });

  const cur = [...A];
  const events: SortEvent[] = [];
  let next = 0;
  let bases = 0;
  const rec = (lo: number, hi: number, depth: number): void => {
    const n = hi - lo + 1;
    if (n <= 1) {
      bases++;
      return;
    }
    const mid = n >> 1;
    events.push({ kind: "split", lo, hi, mid, depth, after: [...cur] });
    rec(lo, lo + mid - 1, depth + 1);
    rec(lo + mid, hi, depth + 1);
    const m = merges[next++];
    if (m === undefined) throw new Error("기록된 합치기가 모자란다");
    if (
      !same(m.L, cur.slice(lo, lo + mid)) ||
      !same(m.R, cur.slice(lo + mid, hi + 1))
    ) {
      throw new Error(`[${lo},${hi}] 의 두 조각이 기록된 합치기와 다르다`);
    }
    for (let k = 0; k < m.out.length; k++) cur[lo + k] = m.out[k] as number;
    events.push({ kind: "merge", lo, hi, mid, depth, ...m, after: [...cur] });
  };
  rec(0, A.length - 1, 0);
  if (next !== merges.length) throw new Error("기록된 합치기가 남는다");
  if (!same(cur, result)) throw new Error("되짚은 배열이 정본의 답과 다르다");
  return {
    input: [...A],
    result,
    events,
    bases,
    comparisons: log.length,
  };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const A6 = [5, 2, 4, 1, 2, 6];

/** 과제 규모 — 칸 수 `N`. 단순 연산 1 초에 1 억 번 기준으로 시간을 잰다. */
export const N = 100_000;
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toFixed(2)} 초`;
export const num = (x: number): string => x.toLocaleString("en-US");
export const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;

export const mergesOf = (r: Run): MergeEvent[] =>
  r.events.filter((e): e is MergeEvent => e.kind === "merge");
export const splitsOf = (r: Run): SplitEvent[] =>
  r.events.filter((e): e is SplitEvent => e.kind === "split");

/** 전개 입력의 마지막 합치기 — 「1. 정렬된 두 조각을 하나로 합친다」가 이 합치기를 한 걸음씩 본다. */
export const lastMerge = (): MergeEvent =>
  mergesOf(run(A6)).at(-1) as MergeEvent;

/** 합치기 한 번의 비교를 갈래와 함께 한 줄로 — `2 <= 1 거짓 → ③`. */
export const cmpText = (c: Cmp): string =>
  `${c.a} <= ${c.b} ${c.left ? "참 → ②" : "거짓 → ③"}`;

/* ───────────────── 비교를 세는 절차 — 가르는 자리만 바꾼다 ───────────────── */

/** 크기 `n` 인 조각을 왼쪽 몇 칸으로 가를 것인가. 오른쪽은 `n - p` 칸이다. */
export type Split = (n: number) => number;

export const SPLITS: [string, Split][] = [
  ["첫 칸", () => 1],
  ["1/4 지점", (n) => Math.max(1, Math.floor(n / 4))],
  ["한가운데", (n) => n >> 1],
];
export const HALVE = (SPLITS[2] as [string, Split])[1];
export const FIRST = (SPLITS[0] as [string, Split])[1];

/** 합치기 한 번 — 두 조각과 비교 횟수. */
export interface MergeCount {
  readonly L: number[];
  readonly R: number[];
  readonly out: number[];
  readonly count: number;
}

/**
 * 그 규칙으로 가르는 절차. 합치기는 정본과 같은 규칙(같으면 왼쪽)이고, 합치기마다 비교 횟수를
 * 남긴다. `한가운데` 규칙은 정본과 같은 값을 내야 한다 — 아래에서 순열 전수로 대조한다.
 */
export function sortWith(
  split: Split,
  A: readonly number[],
): { out: number[]; merges: MergeCount[]; count: number } {
  const merges: MergeCount[] = [];
  const rec = (xs: number[]): number[] => {
    if (xs.length <= 1) return xs.slice();
    const p = Math.min(Math.max(1, split(xs.length)), xs.length - 1);
    const L = rec(xs.slice(0, p));
    const R = rec(xs.slice(p));
    const out: number[] = [];
    let i = 0;
    let j = 0;
    let count = 0;
    while (i < L.length && j < R.length) {
      count++;
      if ((L[i] as number) <= (R[j] as number)) out.push(L[i++] as number);
      else out.push(R[j++] as number);
    }
    while (i < L.length) out.push(L[i++] as number);
    while (j < R.length) out.push(R[j++] as number);
    merges.push({ L, R, out, count });
    return out;
  };
  const out = rec([...A]);
  return { out, merges, count: merges.reduce((s, m) => s + m.count, 0) };
}

/**
 * 그 규칙으로 갈랐을 때의 **최악 비교 횟수**. 크기 `p`·`q` 인 두 조각을 합치는 데 드는 비교는
 * 많아야 `p + q - 1` 이라 전체 최악은 이 재귀로 닫힌다. 그 값이 실제로 나오는 입력은 `worstInput`
 * 이 만들고, 아래에서 순열 전수로 확인한다.
 */
export function worstCount(split: Split, n: number): number {
  // 작은 칸 수부터 차례로 채운다 — 한 칸씩 떼는 규칙은 재귀 깊이가 n 이라 호출 스택이 넘친다.
  const w = new Array<number>(Math.max(2, n + 1)).fill(0);
  for (let m = 2; m <= n; m++) {
    const p = Math.min(Math.max(1, split(m)), m - 1);
    w[m] = (w[p] as number) + (w[m - p] as number) + m - 1;
  }
  return w[n] as number;
}

/** 그 규칙에서 최악을 실제로 내는 입력. 정렬된 값을 거꾸로 두 조각에 번갈아 나눠 담는다. */
export function worstInput(split: Split, values: readonly number[]): number[] {
  const n = values.length;
  if (n <= 1) return [...values];
  const p = Math.min(Math.max(1, split(n)), n - 1);
  const left: number[] = [];
  const right: number[] = [];
  for (let t = n - 1; t >= 0; t--) {
    const toRight = (n - 1 - t) % 2 === 0;
    if (toRight && right.length < n - p) right.push(values[t] as number);
    else if (!toRight && left.length < p) left.push(values[t] as number);
    else if (right.length < n - p) right.push(values[t] as number);
    else left.push(values[t] as number);
  }
  left.reverse();
  right.reverse();
  return [...worstInput(split, left), ...worstInput(split, right)];
}

/** 길이 `n` 인 모든 순열. 전수 확인에만 쓴다. */
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

/** 닫힌 형태 `n⌈log₂ n⌉ − 2^⌈log₂ n⌉ + 1`. 「수식 정의와 유도」가 이 식을 낸다. */
export function closedForm(n: number): number {
  if (n <= 1) return 0;
  const k = Math.ceil(Math.log2(n));
  return n * k - 2 ** k + 1;
}

// 「한가운데」 규칙이 정본과 같은 비교 횟수를 내는가, 재귀로 닫은 최악이 순열 전수의 최댓값과 같은가,
// 만든 최악 입력이 그 최악을 실제로 내는가 — 칸 7 개까지 전부 확인한다. 어긋나면 아래 모든 표가
// 다른 절차를 잰 것이다.
for (let n = 1; n <= 7; n++) {
  const perms = permutations(n);
  for (const p of perms) {
    if (sortWith(HALVE, p).count !== comparisons(p)) {
      throw new Error(`「한가운데」 규칙이 정본과 어긋난다 — ${show(p)}`);
    }
  }
  for (const [name, split] of SPLITS) {
    const bound = worstCount(split, n);
    const seen = Math.max(...perms.map((p) => sortWith(split, p).count));
    if (bound !== seen) {
      throw new Error(
        `${name} — 닫은 최악 ${bound} 이 전수 최댓값 ${seen} 과 다르다`,
      );
    }
    if (
      sortWith(split, worstInput(split, [...Array(n).keys()])).count !== bound
    ) {
      throw new Error(
        `${name} — 만든 최악 입력이 최악을 내지 못한다 (n = ${n})`,
      );
    }
  }
}

/* ───────────────── 가장 단순한 방법 — 선택 정렬 ───────────────── */

/** 선택 정렬의 바퀴 하나 — 비교한 횟수, 찾은 최솟값, 바퀴가 끝난 배열. */
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
  if (!same(B, sortArray([...A])))
    throw new Error("선택 정렬이 정본과 다른 답을 냈다");
  return rounds;
}

/**
 * 선택 정렬의 비교 횟수 `n(n−1)/2`. 바퀴마다 남은 칸을 전부 비교하므로 입력의 값과 무관하다 — 칸 수
 * 1 부터 200 까지 두 가지 입력(오름차순 · 내림차순)으로 실제로 세어 식과 대조한다.
 */
export const selectionCount = (n: number): number => (n * (n - 1)) / 2;
for (let n = 1; n <= 200; n++) {
  for (const A of [
    Array.from({ length: n }, (_, i) => i),
    Array.from({ length: n }, (_, i) => n - i),
  ]) {
    const seen = selectionRounds(A).reduce((s, r) => s + r.compares, 0);
    if (seen !== selectionCount(n))
      throw new Error("선택 정렬 비교 횟수가 식과 다르다");
  }
}

/** `N = 100,000` 에서 세 방법의 비교 횟수. 병합 정렬은 최악 입력을 만들어 정본으로 실제로 센다. */
export function scaleCounts(): {
  selection: number;
  peel: number;
  merge: number;
} {
  const worst = worstInput(HALVE, [...Array(N).keys()]);
  const merge = comparisons(worst);
  if (merge !== worstCount(HALVE, N) || merge !== closedForm(N)) {
    throw new Error("N = 100,000 의 최악이 닫힌 형태와 다르다");
  }
  return {
    selection: selectionCount(N),
    peel: worstCount(FIRST, N),
    merge,
  };
}

let scaleMemo: ReturnType<typeof scaleCounts> | undefined;
export const scale = (): ReturnType<typeof scaleCounts> => {
  scaleMemo ??= scaleCounts();
  return scaleMemo;
};

function approaches(): Approach[] {
  const s = scale();
  return [
    {
      name: "선택 정렬",
      idea: "남은 칸 중 가장 작은 값을 찾아 맨 앞에 놓기를 되풀이한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `비교 ${num(s.selection)} 번 · ${secondsOf(s.selection)}`,
          ok: false,
        },
      ],
      lesson:
        "한 바퀴가 알아낸 순서를 다음 바퀴가 버린다 — 이미 오름차순인 조각을 합치면 어떨까",
    },
    {
      name: "한 칸씩 떼어 합치기",
      idea: "첫 칸을 떼고 나머지를 정렬한 뒤 둘을 합친다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `최악 비교 ${num(s.peel)} 번 · 선택 정렬과 같다`,
          ok: false,
        },
      ],
      lesson: "합치기가 칸 수마다 한 번씩 생긴다 — 조각을 반씩 가르면 어떨까",
    },
    {
      name: "반씩 갈라 합치기",
      idea: "가운데에서 가른 두 조각을 각각 정렬한 뒤 합친다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `최악 비교 ${num(s.merge)} 번 · ${secondsOf(s.merge)}`,
          ok: true,
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

/** 합치기 무대의 이름표 — 합치는 칸 여섯을 한 줄로 그린다. */
export const MERGE_OPTIONS: ArrayOptions = {
  arrayName: "칸",
  rangeLabel: "합치는 칸",
};

/** 전체 실행 무대의 이름표. */
export const RUN_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "부름",
};

/**
 * 합치기 한 번을 비교 하나씩 — 무대는 합치는 칸을 한 줄로 그리고, 왼쪽부터 `out` 에 담긴 값 · `L` 에
 * 남은 값 · `R` 에 남은 값을 차례로 놓는다. 새로 쓴 칸은 이번에 `out` 에 담은 칸, 읽은 칸은 그 값과
 * 비교했지만 남은 쪽 머리다.
 */
function mergeSteps(m: MergeEvent, from: number): Step[] {
  const size = m.L.length + m.R.length;
  const steps: Step[] = [];
  let n = from;
  const pieces = (at: number, i: number, j: number): ArrayPiece[] => {
    const out: ArrayPiece[] = [];
    const lLen = m.L.length - i;
    const rLen = m.R.length - j;
    if (lLen > 0) {
      out.push({
        label: "L",
        from: at,
        to: at + lLen - 1,
        tone: "left",
        text: `i = ${i}`,
      });
    }
    if (rLen > 0) {
      out.push({
        label: "R",
        from: at + lLen,
        to: at + lLen + rLen - 1,
        tone: "right",
        text: `j = ${j}`,
      });
    }
    return out;
  };
  m.cmps.forEach((c, t) => {
    const i = c.i + (c.left ? 1 : 0);
    const j = c.j + (c.left ? 0 : 1);
    const done = m.cmps.slice(0, t + 1).map((x) => (x.left ? x.a : x.b));
    const array = [...done, ...m.L.slice(i), ...m.R.slice(j)];
    const taken = c.left ? c.a : c.b;
    const other = c.left ? t + 1 + (m.L.length - i) : t + 1;
    steps.push({
      id: `T${n++}`,
      title: `${c.a} <= ${c.b} ${c.left ? "②" : "③"}`,
      detail: `L 의 머리 ${c.a}${과와(c.a)} R 의 머리 ${c.b}${을를(c.b)} 비교합니다. ${c.a} <= ${c.b}${이가(c.b)} ${c.left ? "참이라 ② 로 왼쪽" : "거짓이라 ③ 으로 오른쪽"} ${taken}${을를(taken)} out 에 담습니다.`,
      stage: {
        array,
        range: [0, size - 1],
        read: [other],
        write: [t],
        pieces: pieces(t + 1, i, j),
        calc: { expr: `${c.a} <= ${c.b}`, result: c.left ? "참" : "거짓" },
        vars: `비교 ${t + 1} 번`,
      },
    });
  });
  const k = m.cmps.length;
  const mark = m.tail.side === "L" ? "④" : "⑤";
  const emptied = m.tail.side === "L" ? "R" : "L";
  steps.push({
    id: `T${n++}`,
    title: `${mark} ${show(m.tail.values)} 잇기`,
    detail: `${emptied} 을 다 써서 반복이 끝납니다. ${mark} 가 ${m.tail.side} 에 남은 ${m.tail.values.join(" ")}${을를(m.tail.values.at(-1) as number)} 비교 없이 잇습니다.`,
    stage: {
      array: [...m.out],
      range: [0, size - 1],
      read: [],
      write: m.tail.values.map((_, x) => k + x),
      pieces: [],
      calc: null,
      vars: `비교 ${k} 번`,
    },
  });
  return steps;
}

/** 전체 실행 — 가르는 부름과 합치기를 부른 순서대로. 무대는 합친 조각을 제자리에 놓은 배열이다. */
function runSteps(r: Run, from: number): Step[] {
  let n = from;
  let total = 0;
  return r.events.map((e) => {
    const seg = r.input.length > 0 ? e.after.slice(e.lo, e.hi + 1) : [];
    if (e.kind === "split") {
      const left = e.after.slice(e.lo, e.lo + e.mid);
      const right = e.after.slice(e.lo + e.mid, e.hi + 1);
      const bases = [left, right].filter((p) => p.length === 1);
      const baseText =
        bases.length === 0
          ? ""
          : bases.length === 1
            ? ` ${show(bases[0] as number[])}${은는((bases[0] as number[])[0] as number)} 칸이 하나라 ① 로 그대로 돌아옵니다.`
            : ` ${show(left)}${과와(left[0] as number)} ${show(right)}${은는(right[0] as number)} 칸이 하나라 ① 로 그대로 돌아옵니다.`;
      return {
        id: `T${n++}`,
        title: `${show(seg)} 가르기`,
        detail: `sortArray(${show(seg)}) — 칸이 ${seg.length} 개라 ① 이 아닙니다. mid = ${e.mid}${josa(e.mid, "이라서", "라서")} ${show(left)}${과와(left.at(-1) as number)} ${show(right)}${으로(right.at(-1) as number)} 가릅니다.${baseText}`,
        stage: {
          array: [...e.after],
          range: [e.lo, e.hi],
          read: [],
          write: [],
          pieces: [
            { label: "왼쪽", from: e.lo, to: e.lo + e.mid - 1, tone: "left" },
            { label: "오른쪽", from: e.lo + e.mid, to: e.hi, tone: "right" },
          ],
          calc: { expr: `${seg.length} >> 1`, result: String(e.mid) },
          vars: `비교 누적 ${total} 번`,
        },
      };
    }
    total += e.cmps.length;
    const mark = e.tail.side === "L" ? "④" : "⑤";
    return {
      id: `T${n++}`,
      title: `${show(e.L)} + ${show(e.R)} 합치기`,
      detail: `${e.cmps.map(cmpText).join(", ")}. ${mark} 가 ${e.tail.values.join(" ")}${을를(e.tail.values.at(-1) as number)} 잇습니다. 결과는 ${show(e.out)} 입니다.`,
      stage: {
        array: [...e.after],
        range: [e.lo, e.hi],
        read: [],
        write: Array.from({ length: e.hi - e.lo + 1 }, (_, x) => e.lo + x),
        pieces: [],
        calc: { expr: `비교 ${e.cmps.length} 번`, result: show(e.out) },
        vars: `비교 누적 ${total} 번`,
      },
    };
  });
}

/** 걸음 셋 — 합치기 한 번(T1~) 과 전체 실행(그다음 번호부터). */
export const walkSteps = () => {
  const merge = mergeSteps(lastMerge(), 1);
  const whole = runSteps(run(A6), merge.length + 1);
  return { merge, whole };
};

const film = (steps: Step[], opts: ArrayOptions): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(s.stage, opts),
  }));

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `sortArray-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const toStep = (s: Step) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...s.stage,
  });
  const { merge, whole } = walkSteps();
  return { mergeHeads: merge.map(toStep), merge6: whole.map(toStep) };
}

/* ───────────────── 층 — 가르며 내려간 조각을 층마다 ───────────────── */

/** 층마다 조각. 칸이 하나인 조각도 싣는다(합치기가 없는 조각이다). */
export function levels(r: Run): { depth: number; lo: number; hi: number }[][] {
  const out: { depth: number; lo: number; hi: number }[][] = [];
  const put = (depth: number, lo: number, hi: number) => {
    while (out.length <= depth) out.push([]);
    (out[depth] as { depth: number; lo: number; hi: number }[]).push({
      depth,
      lo,
      hi,
    });
  };
  const rec = (lo: number, hi: number, depth: number): void => {
    put(depth, lo, hi);
    const n = hi - lo + 1;
    if (n <= 1) return;
    const mid = n >> 1;
    rec(lo, lo + mid - 1, depth + 1);
    rec(lo + mid, hi, depth + 1);
  };
  if (r.input.length > 0) rec(0, r.input.length - 1, 0);
  // 되짚은 조각이 정본 기록의 합치기와 같은 자리인지 — 칸이 둘 이상인 조각은 모두 합치기가 있다.
  const merges = mergesOf(r);
  for (const lv of out) {
    for (const p of lv) {
      if (
        p.hi > p.lo &&
        !merges.some(
          (m) => m.lo === p.lo && m.hi === p.hi && m.depth === p.depth,
        )
      ) {
        throw new Error(`[${p.lo},${p.hi}] 의 합치기가 기록에 없다`);
      }
    }
  }
  return out;
}

function levelBars(
  note: (p: { lo: number; hi: number }, m: MergeEvent | undefined) => string,
): LayerBar[][] {
  const r = run(A6);
  const merges = mergesOf(r);
  return levels(r).map((lv) =>
    lv.map((p) => {
      const m = merges.find((x) => x.lo === p.lo && x.hi === p.hi);
      return {
        label: `[${p.lo},${p.hi}]`,
        from: p.lo,
        to: p.hi,
        note: `${lvName(lv)} · ${note(p, m)}`,
      };
    }),
  );
}

const lvName = (lv: { depth: number }[]): string =>
  `${(lv[0] as { depth: number }).depth} 층`;

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-levels": () => (
    <LayerBars
      title={`${show(A6)}${을를(A6.at(-1) as number)} 가르며 내려간 조각과, 합치며 올라올 때 각 조각이 되는 모습`}
      values={A6}
      valuesLabel="A 의 값"
      indexLabel="인덱스"
      groups={levelBars((_p, m) =>
        m === undefined ? "칸 하나 — 그대로 돌아온다" : `합치면 ${show(m.out)}`,
      )}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`칸 ${num(N)} 개 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-levels": () => (
    <LayerBars
      title="층마다 조각 — 한 층의 조각은 서로 겹치지 않고 합쳐서 여섯 칸 전부다"
      values={A6}
      valuesLabel="A 의 값"
      indexLabel="인덱스"
      groups={levelBars((p, m) =>
        m === undefined
          ? "합치기 없음"
          : `비교 ${m.cmps.length} 번 · 상한 ${p.hi - p.lo}`,
      )}
    />
  ),
  "walk-merge-heads": () => {
    const { merge } = walkSteps();
    const m = lastMerge();
    return (
      <CellStageFilm
        title={`merge(${show(m.L)}, ${show(m.R)}) — ${merge[0]?.id}~${merge.at(-1)?.id}`}
        columns={m.out.length}
        frames={film(merge, MERGE_OPTIONS)}
      />
    );
  },
  "walk-merge6": () => {
    const { whole } = walkSteps();
    return (
      <CellStageFilm
        title={`sortArray([${A6.join(", ")}]) — ${whole[0]?.id}~${whole.at(-1)?.id}`}
        columns={A6.length}
        frames={film(whole, RUN_OPTIONS)}
      />
    );
  },
};
