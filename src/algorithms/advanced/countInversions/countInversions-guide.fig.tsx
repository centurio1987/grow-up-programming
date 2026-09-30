/**
 * `countInversions-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림과 증명 블록이 같은 기록을 쓴다. 기록은 **정본과 같은 절차에 걸음 기록만 덧붙인 사본**
 * (`trace`)이 만들고, 그 사본이 낸 답은 정본(`-guide.ref.ts`)이 낸 답과 매번 대조한다. 합치기마다 센
 * 개수는 정의대로 센 교차 역순쌍 개수와도 대조한다 — 어긋나면 그림을 그리기 전에 던진다.
 *
 * 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만든다. `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `countInversions-guide.test.ts` 가 잰다. 필름(정적 그림)과 패널은 같은 무대 함수(`arrayStage`)로
 * 그린다.
 *
 * **큰 입력에는 기록 사본을 쓰지 않는다.** 기록 사본은 합치기마다 배열을 베끼므로 칸 10 만에서는
 * 메모리가 모자란다. 큰 입력의 계수는 `.alt.ts` 의 `합치며_세기`(값만 세는 가벼운 판)가 낸다.
 */

import type { ReactElement } from "react";
import { josa, 과와, 을를, 이가 } from "../../../../tools/josa.ts";
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
  type GraphEdge,
  type GraphNode,
  NodeGraph,
} from "../../../_viz/patterns/NodeGraph";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { 합치며_세기 } from "./countInversions-guide.alt.ts";
import { countInversions } from "./countInversions-guide.ref.ts";

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개가 쓰는 고정 입력. 답이 6 이고 갈래 다섯을 다 지나간다. */
export const WALK = [4, 1, 5, 2, 6, 3];

/** 과제 규모 — 칸 수 `N` 의 상한. */
export const N_MAX = 100_000;

/** 어림 시간의 기준 — 1 초에 배열 칸 접근 1 억 번. */
export const PER_SECOND = 100_000_000;

export const num = (x: number | bigint): string => x.toLocaleString("en-US");

/** 칸 접근 수를 어림 시간으로. 1 억 번에 1 초로 나눈다. */
export const seconds = (ops: number): string => {
  const s = ops / PER_SECOND;
  if (s >= 0.01) return `${s.toFixed(2)} 초`;
  return `${s.toFixed(4)} 초`;
};

/** 값 나열 — 대괄호를 쓴다. 자리 구간 `[lo,hi]` 와는 쉼표 유무로 갈린다. */
export const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;

/** 정의를 그대로 옮긴 두 겹 반복. 비교 횟수를 함께 낸다. */
export function byDefinition(arr: readonly number[]): {
  답: number;
  비교: number;
} {
  let 답 = 0;
  let 비교 = 0;
  for (let p = 0; p < arr.length; p++) {
    for (let q = p + 1; q < arr.length; q++) {
      비교++;
      if ((arr[p] as number) > (arr[q] as number)) 답++;
    }
  }
  return { 답, 비교 };
}

/** 역순쌍 전부 — 원래 배열의 자리 쌍 `(p, q)` 로. */
export function inversionPairs(arr: readonly number[]): [number, number][] {
  const out: [number, number][] = [];
  for (let p = 0; p < arr.length; p++) {
    for (let q = p + 1; q < arr.length; q++) {
      if ((arr[p] as number) > (arr[q] as number)) out.push([p, q]);
    }
  }
  return out;
}

/** 두 값 모임 사이의 교차 역순쌍 — 왼쪽에서 하나, 오른쪽에서 하나를 골라 왼쪽이 더 큰 짝의 수. */
export function crossByDefinition(
  L: readonly number[],
  R: readonly number[],
): number {
  let c = 0;
  for (const x of L) for (const y of R) if (x > y) c++;
  return c;
}

/* ───────────────────────── 걸음 기록 사본 ───────────────────────── */

/** 합치기 안의 비교 한 번 — 비교하기 전의 `i` · `j` 와 그 값, 어느 쪽을 꺼냈는가, 더한 개수. */
export interface Cmp {
  readonly i: number;
  readonly j: number;
  readonly x: number;
  readonly y: number;
  /** `x <= y` 가 참이라 왼쪽을 꺼냈는가. */
  readonly left: boolean;
  /** 오른쪽을 꺼내며 더한 `mid − i + 1`. 왼쪽을 꺼냈으면 0. */
  readonly add: number;
  /** 이 비교가 `buffer` 에 적은 자리. */
  readonly k: number;
}

/** 합치기 한 번의 기록. */
export interface Merge {
  readonly lo: number;
  readonly mid: number;
  readonly hi: number;
  /** 재귀 깊이 — 가장 바깥 조각이 0 이다. */
  readonly depth: number;
  /** 합치기 전 `a` 전체. */
  readonly before: readonly number[];
  /** 합치기 전 두 조각의 값. 둘 다 오름차순이다. */
  readonly L: readonly number[];
  readonly R: readonly number[];
  readonly cmps: readonly Cmp[];
  /** 반복이 끝난 뒤 비교 없이 옮긴 쪽과 그 값. */
  readonly tail: { readonly side: "L" | "R"; readonly values: number[] };
  /** 합친 결과 — `buffer[lo..hi]`. */
  readonly out: readonly number[];
  /** 이 합치기가 센 개수. */
  readonly count: number;
  /** 제자리에 옮겨 적은 뒤 `a` 전체. */
  readonly after: readonly number[];
}

/** 부름 하나 — 칸이 하나 이하면 합치기가 없다. */
export interface Call {
  readonly lo: number;
  readonly hi: number;
  readonly depth: number;
  readonly left: number;
  readonly right: number;
  readonly cross: number;
  readonly total: number;
}

export interface Trace {
  readonly input: readonly number[];
  readonly answer: number;
  readonly merges: readonly Merge[];
  /** 칸 하나짜리 조각에서 곧바로 0 을 낸 부름의 수. */
  readonly bases: number;
  /** 부른 순서대로의 부름. 칸 하나짜리 부름도 싣는다. */
  readonly calls: readonly Call[];
}

/**
 * 정본과 같은 절차에 걸음 기록을 덧붙인 사본. 합치기마다 `a` 를 베끼므로 **작은 입력에만** 쓴다.
 * 답은 정본과, 합치기마다의 개수는 정의대로 센 교차 역순쌍과 대조한다.
 */
export function trace(arr: readonly number[]): Trace {
  const N = arr.length;
  const merges: Merge[] = [];
  const calls: Call[] = [];
  let bases = 0;
  if (N <= 1) {
    const answer = countInversions([...arr]);
    if (answer !== 0) throw new Error("정본이 칸 하나 이하에서 0 을 안 냈다");
    return { input: [...arr], answer, merges, bases, calls };
  }
  const a = arr.slice();
  const buffer = new Array<number>(N);

  function merge(lo: number, mid: number, hi: number, depth: number): number {
    const before = a.slice();
    const L = a.slice(lo, mid + 1);
    const R = a.slice(mid + 1, hi + 1);
    const cmps: Cmp[] = [];
    let i = lo;
    let j = mid + 1;
    let k = lo;
    let count = 0;
    while (i <= mid && j <= hi) {
      const x = a[i] as number;
      const y = a[j] as number;
      if (x <= y) {
        cmps.push({ i, j, x, y, left: true, add: 0, k });
        buffer[k] = x;
        k++;
        i++;
      } else {
        const add = mid - i + 1;
        cmps.push({ i, j, x, y, left: false, add, k });
        count += add;
        buffer[k] = y;
        k++;
        j++;
      }
    }
    const tail =
      i <= mid
        ? { side: "L" as const, values: a.slice(i, mid + 1) }
        : { side: "R" as const, values: a.slice(j, hi + 1) };
    while (i <= mid) {
      buffer[k] = a[i] as number;
      k++;
      i++;
    }
    while (j <= hi) {
      buffer[k] = a[j] as number;
      k++;
      j++;
    }
    const out = buffer.slice(lo, hi + 1);
    for (let x = lo; x <= hi; x++) a[x] = buffer[x] as number;
    if (count !== crossByDefinition(L, R)) {
      throw new Error(`[${lo},${hi}] 에서 센 개수가 정의와 다르다`);
    }
    merges.push({
      lo,
      mid,
      hi,
      depth,
      before,
      L,
      R,
      cmps,
      tail,
      out,
      count,
      after: a.slice(),
    });
    return count;
  }

  function rec(lo: number, hi: number, depth: number): number {
    if (lo >= hi) {
      bases++;
      calls.push({ lo, hi, depth, left: 0, right: 0, cross: 0, total: 0 });
      return 0;
    }
    const at = calls.length;
    calls.push({ lo, hi, depth, left: 0, right: 0, cross: 0, total: 0 });
    const mid = (lo + hi) >> 1;
    const left = rec(lo, mid, depth + 1);
    const right = rec(mid + 1, hi, depth + 1);
    const cross = merge(lo, mid, hi, depth);
    const total = left + right + cross;
    calls[at] = { lo, hi, depth, left, right, cross, total };
    return total;
  }

  const answer = rec(0, N - 1, 0);
  if (answer !== countInversions([...arr])) {
    throw new Error(`기록 사본이 정본과 다른 답을 냈다 — ${show(arr)}`);
  }
  return { input: [...arr], answer, merges, bases, calls };
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

// 기록 사본이 정본과 같은 절차인가 — 칸 7 개까지의 모든 순열과 같은 값이 섞인 배열 몇 벌에서 답을
// 대조한다(`trace` 가 어긋나면 던진다). 어긋나면 아래 그림과 표가 전부 다른 절차를 그린 것이다.
for (let n = 0; n <= 7; n++) for (const p of permutations(n)) trace(p);
for (const arr of [
  [2, 2, 2, 2],
  [3, 1, 2, 3, 1],
  [-1, -3, 0, -2],
])
  trace(arr);

/* ───────────────── 합치기 한 번만 — 두 조각을 받아 센다 ───────────────── */

/**
 * 정본의 합치기와 같은 규칙으로 두 조각 `L` · `R` 을 합치며 센다. 정본의 합치기는 안쪽 함수라 밖에서
 * 부를 수 없어서 둔 사본이다 — 오름차순인 두 조각에서는 정의대로 센 교차 역순쌍과 같아야 하고, 아래에서
 * 작은 값 전수로 대조한다.
 */
export function mergeCount(
  L: readonly number[],
  R: readonly number[],
): {
  count: number;
  cmps: { x: number; y: number; left: boolean; add: number }[];
  tail: { side: "L" | "R"; values: number[] };
  out: number[];
} {
  const cmps: { x: number; y: number; left: boolean; add: number }[] = [];
  const out: number[] = [];
  let i = 0;
  let j = 0;
  let count = 0;
  while (i < L.length && j < R.length) {
    const x = L[i] as number;
    const y = R[j] as number;
    if (x <= y) {
      cmps.push({ x, y, left: true, add: 0 });
      out.push(x);
      i++;
    } else {
      const add = L.length - i;
      cmps.push({ x, y, left: false, add });
      count += add;
      out.push(y);
      j++;
    }
  }
  const tail =
    i < L.length
      ? { side: "L" as const, values: L.slice(i) }
      : { side: "R" as const, values: R.slice(j) };
  out.push(...tail.values);
  return { count, cmps, tail, out };
}

{
  // 값이 0~3 인 길이 1~3 의 오름차순 조각 둘을 전부 넣는다.
  const sorted: number[][] = [];
  const grow = (acc: number[], from: number): void => {
    if (acc.length > 0) sorted.push([...acc]);
    if (acc.length === 3) return;
    for (let v = from; v <= 3; v++) grow([...acc, v], v);
  };
  grow([], 0);
  for (const L of sorted) {
    for (const R of sorted) {
      if (mergeCount(L, R).count !== crossByDefinition(L, R)) {
        throw new Error(`합치기 사본이 ${show(L)} + ${show(R)} 에서 틀린다`);
      }
    }
  }
}

/* ───────────────── 비용 — 칸 접근으로 센다 ───────────────── */

/**
 * 합치기마다 왼쪽과 오른쪽에서 번갈아 꺼내지도록 만든 입력 — 비교가 가장 많은 입력이다. 만들고 싶은
 * 결과(오름차순)를 조각마다 짝수 번째와 홀수 번째로 갈라 내려가며 채운다.
 */
export function 번갈아_꺼내지는(N: number): number[] {
  const out = new Array<number>(N).fill(0);
  const build = (lo: number, hi: number, vals: number[]): void => {
    if (lo === hi) {
      out[lo] = vals[0] as number;
      return;
    }
    const mid = (lo + hi) >> 1;
    const left: number[] = [];
    const right: number[] = [];
    for (const [t, v] of vals.entries()) {
      if (t % 2 === 0) left.push(v);
      else right.push(v);
    }
    build(lo, mid, left);
    build(mid + 1, hi, right);
  };
  if (N > 0)
    build(
      0,
      N - 1,
      Array.from({ length: N }, (_, q) => q),
    );
  return out;
}

/**
 * 정의를 그대로 옮긴 방법과, 반으로 가르되 교차 쌍을 하나씩 비교하는 방법의 칸 접근. 두 방법 다 쌍
 * 하나를 비교할 때 두 칸을 읽고 그 밖에는 칸을 안 건드린다. 둘 다 `N(N−1)` 이 되는지 칸 1 개부터 200
 * 개까지 실제로 세어 확인한다.
 */
export function divideOnly(arr: readonly number[]): {
  답: number;
  비교: number;
} {
  let 답 = 0;
  let 비교 = 0;
  const rec = (lo: number, hi: number): void => {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    rec(lo, mid);
    rec(mid + 1, hi);
    for (let p = lo; p <= mid; p++) {
      for (let q = mid + 1; q <= hi; q++) {
        비교++;
        if ((arr[p] as number) > (arr[q] as number)) 답++;
      }
    }
  };
  rec(0, arr.length - 1);
  return { 답, 비교 };
}

export const pairsOf = (n: number): number => (n * (n - 1)) / 2;

for (let n = 1; n <= 200; n++) {
  const arr = Array.from({ length: n }, (_, q) => (q * 37) % 101);
  const d = byDefinition(arr);
  const v = divideOnly(arr);
  if (d.비교 !== pairsOf(n) || v.비교 !== pairsOf(n)) {
    throw new Error("쌍마다 한 번 비교한다는 식이 실측과 다르다");
  }
  if (d.답 !== countInversions(arr) || v.답 !== countInversions(arr)) {
    throw new Error("비교 방법이 정본과 다른 답을 냈다");
  }
}

/** 칸 10 만의 네 방법 — 정의대로 · 먼저 정렬 · 갈라서 하나씩 · 합치며 세기(최악 입력을 실제로 센다). */
export function scale(): {
  naive: number;
  divide: number;
  merge: number;
  mergeInput: string;
} {
  const worst = 번갈아_꺼내지는(N_MAX);
  const c = 합치며_세기(worst);
  if (c.답 !== countInversions(worst)) {
    throw new Error("칸 10 만에서 세는 사본이 정본과 다른 답을 냈다");
  }
  return {
    naive: 2 * pairsOf(N_MAX),
    divide: 2 * pairsOf(N_MAX),
    merge: c.칸접근,
    mergeInput: "비교가 가장 많은 입력",
  };
}

let scaleMemo: ReturnType<typeof scale> | undefined;
export const scaled = (): ReturnType<typeof scale> => {
  scaleMemo ??= scale();
  return scaleMemo;
};

function approaches(): Approach[] {
  const s = scaled();
  const sorted = WALK.slice().sort((x, y) => x - y);
  const answer = countInversions(WALK);
  const sortedAnswer = byDefinition(sorted).답;
  return [
    {
      name: "모든 쌍 비교하기",
      idea: "앞 자리와 뒤 자리를 하나씩 짝지어 전부 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `칸 접근 ${num(s.naive)} 번 · 어림 ${seconds(s.naive)}`,
          ok: false,
        },
      ],
      lesson: "쌍마다 비교 한 번이다 — 먼저 정렬해 두면 어떨까",
    },
    {
      name: "먼저 정렬하고 세기",
      idea: "값을 오름차순으로 놓은 다음 역순쌍을 센다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `${show(WALK)} 에서 ${num(answer)} 대신 ${num(sortedAnswer)}`,
          ok: false,
        },
      ],
      lesson:
        "정렬하면 세려던 자리 관계가 사라진다 — 반씩 갈라 따로 세면 어떨까",
    },
    {
      name: "반으로 갈라 하나씩 세기",
      idea: "조각 안은 재귀로 세고, 두 조각 사이의 쌍은 하나씩 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `칸 접근 ${num(s.divide)} 번 · 모든 쌍 비교하기와 같다`,
          ok: false,
        },
      ],
      lesson:
        "두 조각 사이의 쌍은 조각 안 순서와 무관하다 — 두 조각을 정렬해 두고 합치며 세면 어떨까",
    },
    {
      name: "합치며 세기",
      idea: "반으로 갈라 각각 정렬하며 세고, 합칠 때 오른쪽 값을 꺼내며 왼쪽에 남은 개수를 더한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `최악 칸 접근 ${num(s.merge)} 번 · 어림 ${seconds(s.merge)}`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** 이 걸음이 속한 조각. 준비 걸음은 `null`. */
  readonly seg: readonly [number, number] | null;
  /** 이 걸음에서 한 비교 수와 더한 개수, 걸음이 끝난 뒤의 누적. */
  readonly compares: number;
  readonly added: number;
  readonly total: number;
  readonly stage: ArrayStep;
}

/** 무대의 이름표 — 정본의 사본 `a` 를 한 줄로 그린다. */
export const WALK_OPTIONS: ArrayOptions = {
  arrayName: "a",
  rangeLabel: "합치는 조각",
};

const empty = (n: number): (number | null)[] =>
  new Array<number | null>(n).fill(null);

/** `buffer` 줄 — 이번 합치기가 적은 칸만 값을 싣고 나머지는 아직 안 쓴 칸으로 둔다. */
function bufferRow(
  n: number,
  written: readonly [number, number][],
  write: readonly number[],
): ArrayStep["layers"] {
  const values = empty(n);
  for (const [k, v] of written) values[k] = v;
  return [{ name: "buffer", values, write: [...write] }];
}

/** 조각 괄호 둘 — 왼쪽 `[lo, mid]` 와 오른쪽 `[mid+1, hi]`. */
const halves = (
  m: Merge,
  iText?: string,
  jText?: string,
): ArrayStep["pieces"] => [
  {
    label: "왼쪽",
    from: m.lo,
    to: m.mid,
    tone: "left",
    ...(iText === undefined ? {} : { text: iText }),
  },
  {
    label: "오른쪽",
    from: m.mid + 1,
    to: m.hi,
    tone: "right",
    ...(jText === undefined ? {} : { text: jText }),
  },
];

const cells = (lo: number, hi: number): number[] =>
  Array.from({ length: hi - lo + 1 }, (_, x) => lo + x);

/** 비교 한 번을 한 줄로 — `4 <= 2 거짓 → 오른쪽, 2 를 더한다`. */
export const cmpText = (c: Cmp, mid: number): string =>
  c.left
    ? `${c.x} <= ${c.y} 참 → 왼쪽 ${c.x}`
    : `${c.x} <= ${c.y} 거짓 → 오른쪽 ${c.y}, mid − i + 1 = ${mid} − ${c.i} + 1 = ${c.add}`;

/**
 * 전개 입력의 걸음 전부. 준비 한 걸음, 앞 합치기 넷은 합치기 하나를 한 걸음으로, 마지막 합치기는 비교
 * 하나를 한 걸음으로 싣고, 남은 값을 옮겨 제자리에 적는 것을 마지막 한 걸음으로 둔다.
 */
export function walkSteps(): Step[] {
  const t = trace(WALK);
  const n = WALK.length;
  const steps: Step[] = [];
  let id = 1;
  let total = 0;
  steps.push({
    id: `T${id++}`,
    title: "사본과 버퍼 잡기",
    detail: `칸이 ${n} 개라 N <= 1 이 거짓입니다. 입력의 사본 a 와 칸 ${n} 개짜리 buffer 를 한 번 잡습니다. 누적 개수는 0 입니다.`,
    seg: null,
    compares: 0,
    added: 0,
    total: 0,
    stage: {
      array: [...WALK],
      range: [0, n - 1],
      read: [],
      write: cells(0, n - 1),
      pieces: [],
      layers: bufferRow(n, [], []),
      calc: { expr: `${n} <= 1`, result: "거짓" },
      vars: "누적 0",
    },
  });
  const last = t.merges.at(-1) as Merge;
  for (const m of t.merges) {
    if (m !== last) {
      total += m.count;
      const adds = m.cmps.filter((c) => !c.left);
      const tailText = `${m.tail.side === "L" ? "왼쪽" : "오른쪽"}에 남은 ${m.tail.values.join(" ")}${을를(m.tail.values.at(-1) as number)} 그대로 옮기고`;
      steps.push({
        id: `T${id++}`,
        title: `조각 [${m.lo},${m.hi}] 합치기`,
        detail: `${show(m.L)}${과와(m.L.at(-1) as number)} ${show(m.R)}${을를(m.R.at(-1) as number)} 합칩니다. ${m.cmps.map((c) => cmpText(c, m.mid)).join(", ")}. ${tailText} 제자리에 적으면 ${show(m.out)} 입니다. 이 합치기가 센 개수는 ${m.count}${josa(m.count, "이고", "고")} 누적은 ${total} 입니다.`,
        seg: [m.lo, m.hi],
        compares: m.cmps.length,
        added: m.count,
        total,
        stage: {
          array: [...m.after],
          range: [m.lo, m.hi],
          read: [],
          write: cells(m.lo, m.hi),
          pieces: halves(m),
          layers: bufferRow(
            n,
            m.out.map((v, x) => [m.lo + x, v] as [number, number]),
            [],
          ),
          calc:
            adds.length === 0
              ? { expr: "오른쪽을 꺼낸 적 없음", result: "+0" }
              : {
                  expr: adds
                    .map((c) => `${m.mid} − ${c.i} + 1`)
                    .join(" 그리고 "),
                  result: `+${m.count}`,
                },
          vars: `누적 ${total}`,
        },
      });
      continue;
    }
    // 마지막 합치기 — 비교 하나를 한 걸음으로.
    const written: [number, number][] = [];
    let partial = total;
    for (const c of m.cmps) {
      written.push([c.k, c.left ? c.x : c.y]);
      partial += c.add;
      steps.push({
        id: `T${id++}`,
        title: `${c.x} <= ${c.y} ${c.left ? "왼쪽" : `오른쪽 +${c.add}`}`,
        detail: c.left
          ? `a[${c.i}] = ${c.x}${과와(c.x)} a[${c.j}] = ${c.y}${을를(c.y)} 비교합니다. ${c.x} <= ${c.y}${이가(c.y)} 참이라 왼쪽 ${c.x}${을를(c.x)} buffer[${c.k}] 에 적습니다. 더하는 개수는 없고 누적은 ${partial} 입니다.`
          : `a[${c.i}] = ${c.x}${과와(c.x)} a[${c.j}] = ${c.y}${을를(c.y)} 비교합니다. ${c.x} <= ${c.y}${이가(c.y)} 거짓이라 오른쪽 ${c.y}${을를(c.y)} buffer[${c.k}] 에 적고, 왼쪽에 남은 mid − i + 1 = ${m.mid} − ${c.i} + 1 = ${c.add} 개를 한 번에 더합니다. 누적은 ${partial} 입니다.`,
        seg: [m.lo, m.hi],
        compares: 1,
        added: c.add,
        total: partial,
        stage: {
          array: [...m.before],
          range: [m.lo, m.hi],
          read: [c.i, c.j],
          write: [],
          pieces: halves(m, `i = ${c.i}`, `j = ${c.j}`),
          layers: bufferRow(n, written, [c.k]),
          calc: c.left
            ? { expr: `${c.x} <= ${c.y}`, result: "참" }
            : {
                expr: `${c.x} <= ${c.y} 거짓 · ${m.mid} − ${c.i} + 1`,
                result: `+${c.add}`,
              },
          vars: `누적 ${partial}`,
        },
      });
    }
    total = partial;
    const k0 = m.lo + m.cmps.length;
    const tailCells = m.tail.values.map((_, x) => k0 + x);
    steps.push({
      id: `T${id++}`,
      title: "남은 값 옮기고 제자리에 적기",
      detail: `${m.tail.side === "L" ? "오른쪽" : "왼쪽"} 조각이 비어 반복이 끝납니다. ${m.tail.side === "L" ? "왼쪽" : "오른쪽"}에 남은 ${m.tail.values.join(" ")}${을를(m.tail.values.at(-1) as number)} 비교 없이 buffer 에 옮기고, buffer 의 칸 [${m.lo},${m.hi}] 를 a 에 옮겨 적으면 ${show(m.after)} 입니다. 더 셀 것이 없어 누적 ${total}${이가(total)} 반환값입니다.`,
      seg: [m.lo, m.hi],
      compares: 0,
      added: 0,
      total,
      stage: {
        array: [...m.after],
        range: [m.lo, m.hi],
        read: [],
        write: cells(m.lo, m.hi),
        pieces: [],
        layers: bufferRow(
          n,
          m.out.map((v, x) => [m.lo + x, v] as [number, number]),
          tailCells,
        ),
        calc: { expr: "더하는 개수", result: "+0" },
        vars: `누적 ${total}`,
      },
    });
  }
  if (total !== t.answer) throw new Error("걸음의 누적이 답과 다르다");
  return steps;
}

const film = (steps: readonly Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(s.stage, WALK_OPTIONS),
  }));

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본과 대조한 기록에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `countInversions-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    invWalk: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

/* ───────────────── 교차 역순쌍 — 합치기마다 ───────────────── */

/** 합치기 `m` 이 세는 역순쌍 — 원래 배열의 자리 `(p, q)` 로 `lo ≤ p ≤ mid < q ≤ hi` 인 것. */
export function crossPairs(
  arr: readonly number[],
  m: { lo: number; mid: number; hi: number },
): [number, number][] {
  return inversionPairs(arr).filter(
    ([p, q]) => m.lo <= p && p <= m.mid && m.mid < q && q <= m.hi,
  );
}

/** 층마다 조각. 칸 하나짜리 조각도 싣는다. */
export function levelsOf(t: Trace): Call[][] {
  const out: Call[][] = [];
  for (const c of t.calls) {
    while (out.length <= c.depth) out.push([]);
    (out[c.depth] as Call[]).push(c);
  }
  for (const lv of out) lv.sort((x, y) => x.lo - y.lo);
  return out;
}

const pairText = (ps: readonly [number, number][]): string =>
  ps.length === 0 ? "없음" : ps.map(([p, q]) => `(${p},${q})`).join(" ");

function crossBars(): LayerBar[][] {
  const t = trace(WALK);
  return levelsOf(t).map((lv) =>
    lv.map((c) => {
      const m = t.merges.find((x) => x.lo === c.lo && x.hi === c.hi);
      const ps = m === undefined ? [] : crossPairs(WALK, m);
      if (m !== undefined && ps.length !== m.count) {
        throw new Error(
          `[${c.lo},${c.hi}] 의 교차 역순쌍 수가 센 개수와 다르다`,
        );
      }
      return {
        label: `[${c.lo},${c.hi}]`,
        from: c.lo,
        to: c.hi,
        note:
          m === undefined
            ? `${c.depth} 층 · 칸 하나 — 합치기 없음`
            : `${c.depth} 층 · 교차 역순쌍 ${pairText(ps)}`,
      };
    }),
  );
}

/* ───────────────── 역순쌍을 평면 위의 점으로 ───────────────── */

const PLANE_UNIT = { x: 90, y: 46 } as const;

function pairsPlane(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const top = Math.max(...WALK);
  const nodes: GraphNode[] = WALK.map((v, k) => ({
    id: k,
    x: k,
    y: top - v,
    label: String(v),
    value: `자리 ${k}`,
  }));
  const ps = inversionPairs(WALK);
  if (ps.length !== countInversions(WALK)) {
    throw new Error("평면 그림의 쌍 수가 정본의 답과 다르다");
  }
  const edges: GraphEdge[] = ps.map(([p, q]) => ({
    from: p,
    to: q,
    state: "focus",
    bend: 0,
  }));
  return { nodes, edges };
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 「전체 컨셉」의 한 장 — 마지막 합치기에서 오른쪽 값을 처음 꺼내는 비교. */
export const conceptStep = (): Step => {
  const s = walkSteps().find(
    (x) =>
      x.seg !== null && x.seg[1] - x.seg[0] + 1 === WALK.length && x.added > 1,
  );
  if (s === undefined) throw new Error("여러 쌍을 한 번에 더하는 걸음이 없다");
  return s;
};

export const FIGS: Record<string, () => ReactElement> = {
  "concept-pairs": () => {
    const { nodes, edges } = pairsPlane();
    return (
      <NodeGraph
        title={`${show(WALK)} 의 칸을 (자리, 값) 에 놓은 점 — 오른쪽 아래로 내려가는 선 ${edges.length} 개가 역순쌍이다`}
        directed={false}
        unit={PLANE_UNIT}
        nodes={nodes}
        edges={edges}
      />
    );
  },
  "concept-one-compare": () => {
    const s = conceptStep();
    return (
      <CellStageFilm
        title={`정렬된 두 조각에서 비교 한 번 — 오른쪽 값을 꺼내며 왼쪽에 남은 ${s.added} 개를 한꺼번에 센다`}
        columns={WALK.length}
        frames={[
          {
            id: "보기",
            text: s.title,
            rows: arrayStage(s.stage, WALK_OPTIONS),
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
        constraint={`칸 ${num(N_MAX)} 개 · 1 초(1 초에 칸 접근 1 억 번으로 어림)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-cross": () => (
    <LayerBars
      title={`${show(WALK)} 을 가른 조각마다, 그 조각의 합치기가 세는 교차 역순쌍`}
      values={WALK}
      valuesLabel="A 의 값"
      indexLabel="자리"
      groups={crossBars()}
    />
  ),
  "walk-run": () => {
    const steps = walkSteps();
    return (
      <CellStageFilm
        title={`countInversions([${WALK.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={WALK.length}
        frames={film(steps)}
      />
    );
  },
};
