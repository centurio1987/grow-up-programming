/**
 * `maximumProductSubarray-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 최댓값을 갱신하는 줄 뒤에 기록을
 * 끼운 계측 사본(`pairProbe`)을 정본 소스에서 기계로 만들고, 그 기록으로 칸마다의 `curMax` ·
 * `curMin` · `best` 와 후보 셋을 얻는다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서
 * 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는 `maximumProductSubarray-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  CellStage,
  CellStageFilm,
  type StageFrame,
  type StageRow,
} from "../../../_viz/patterns/CellStage";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { maximumProductSubarray } from "./maximumProductSubarray-guide.ref.ts";

const REF = new URL("./maximumProductSubarray-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  maximumProductSubarray(A: number[]): number;
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 최댓값을 갱신하는 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 그 줄에 닿은 시점에는 `curMax` · `curMin` 이 이미 칸 `i` 의 값으로
 * 바뀌어 있으므로, 기록 하나가 반복 한 바퀴가 끝난 상태다.
 */
const pairProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)best = Math\.max\(best, curMax\);$/,
    "$1best = Math.max(best, curMax);\n$1(globalThis as any).__pair.push({ i, x, grown, flipped, curMax, curMin, best });",
  ],
});

/** `-0` 을 `0` 으로 — `0 × (-1)` 이 `-0` 이라 그대로 적으면 「-0」이 찍힌다. */
const z = (v: number): number => (Object.is(v, -0) ? 0 : v);

/** 후보 셋 가운데 어느 것에서 왔는가. 값이 같으면 새로 시작 → 최댓값에 잇기 → 최솟값에 잇기 순으로 센다. */
export type Source = "fresh" | "grown" | "flipped";

/** 반복 한 바퀴가 끝난 상태. 칸 0 은 반복 전에 정해지므로 `i = 0` 기록을 앞에 따로 둔다. */
export interface Round {
  readonly i: number;
  /** `A[i]` — 새로 시작하는 후보. */
  readonly x: number;
  /** 직전 최댓값에 `A[i]` 를 곱한 후보. 칸 0 에는 없다. */
  readonly grown: number | null;
  /** 직전 최솟값에 `A[i]` 를 곱한 후보. 칸 0 에는 없다. */
  readonly flipped: number | null;
  /** 이 바퀴가 끝난 뒤의 `curMax` — 칸 `i` 에서 끝나는 최대곱. */
  readonly curMax: number;
  /** 이 바퀴가 끝난 뒤의 `curMin` — 칸 `i` 에서 끝나는 최소곱. */
  readonly curMin: number;
  readonly best: number;
  /** `curMax` 가 온 후보. 칸 0 은 `fresh`. */
  readonly maxFrom: Source;
  readonly minFrom: Source;
  /** `curMax` · `curMin` 을 만든 구간의 왼쪽 끝. */
  readonly maxStart: number;
  readonly minStart: number;
  /** `best` 를 만든 구간. */
  readonly bestRange: readonly [number, number];
}

/** 구간 `[l, r]` 의 곱 — 정의를 그대로 센다. */
export function productOf(A: readonly number[], l: number, r: number): number {
  let p = 1;
  for (let k = l; k <= r; k++) p *= A[k] as number;
  return z(p);
}

/** 칸 `r` 에서 끝나는 후보 `[l, r]` 의 곱을 왼쪽 끝 순으로 전부. */
export function endingProducts(A: readonly number[], r: number): number[] {
  const out: number[] = [];
  for (let l = 0; l <= r; l++) out.push(productOf(A, l, r));
  return out;
}

/** 칸 0 부터 칸 `r` 까지만 놓고 본 답 — 모든 `(l, r')` 쌍을 센다. */
export function bestUpTo(A: readonly number[], r: number): number {
  let best = A[0] as number;
  for (let rr = 0; rr <= r; rr++) {
    for (const p of endingProducts(A, rr)) best = Math.max(best, p);
  }
  return best;
}

/** 후보 셋에서 `pick` 과 같은 값을 낸 첫 후보. */
function sourceOf(
  pick: number,
  x: number,
  grown: number,
  flipped: number,
): Source {
  if (pick === x) return "fresh";
  if (pick === grown) return "grown";
  if (pick === flipped) return "flipped";
  throw new Error(`${pick} 이 후보 셋 어디에도 없다`);
}

/**
 * 정본 한 번 호출의 기록. 답은 정본과 대조하고, 바퀴마다 `curMax` · `curMin` 은 정의(칸 `i` 에서
 * 끝나는 후보의 최댓값 · 최솟값)와, `best` 는 정의(칸 `i` 까지의 답)와, 구간은 그 구간의 곱과 대조한다.
 */
export function trace(A: readonly number[]): Round[] {
  const g = globalThis as unknown as {
    __pair: {
      i: number;
      x: number;
      grown: number;
      flipped: number;
      curMax: number;
      curMin: number;
      best: number;
    }[];
  };
  g.__pair = [];
  const probed = pairProbe.maximumProductSubarray([...A]);
  const got = [...g.__pair];
  if (probed !== maximumProductSubarray([...A])) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  if (got.length !== A.length - 1 || got.some((c, k) => c.i !== k + 1)) {
    throw new Error("반복의 바퀴 수가 칸 수 − 1 과 다르다");
  }
  const first = A[0] as number;
  const rounds: Round[] = [
    {
      i: 0,
      x: first,
      grown: null,
      flipped: null,
      curMax: first,
      curMin: first,
      best: first,
      maxFrom: "fresh",
      minFrom: "fresh",
      maxStart: 0,
      minStart: 0,
      bestRange: [0, 0],
    },
  ];
  for (const c of got) {
    const before = rounds[rounds.length - 1] as Round;
    const grown = z(c.grown);
    const flipped = z(c.flipped);
    const curMax = z(c.curMax);
    const curMin = z(c.curMin);
    const maxFrom = sourceOf(curMax, c.x, grown, flipped);
    const minFrom = sourceOf(curMin, c.x, grown, flipped);
    const startOf = (s: Source): number =>
      s === "fresh" ? c.i : s === "grown" ? before.maxStart : before.minStart;
    const maxStart = startOf(maxFrom);
    const bestRange: readonly [number, number] =
      z(c.best) > before.best ? [maxStart, c.i] : before.bestRange;
    rounds.push({
      i: c.i,
      x: c.x,
      grown,
      flipped,
      curMax,
      curMin,
      best: z(c.best),
      maxFrom,
      minFrom,
      maxStart,
      minStart: startOf(minFrom),
      bestRange,
    });
  }
  for (const r of rounds) {
    const ending = endingProducts(A, r.i);
    if (r.curMax !== Math.max(...ending) || r.curMin !== Math.min(...ending)) {
      throw new Error(`칸 ${r.i} 의 curMax · curMin 이 정의와 다르다`);
    }
    if (
      productOf(A, r.maxStart, r.i) !== r.curMax ||
      productOf(A, r.minStart, r.i) !== r.curMin
    ) {
      throw new Error(`칸 ${r.i} 의 구간이 곱과 맞지 않는다`);
    }
    if (r.best !== bestUpTo(A, r.i)) {
      throw new Error(`칸 ${r.i} 의 best ${r.best} 이 정의와 다르다`);
    }
    if (productOf(A, r.bestRange[0], r.bestRange[1]) !== r.best) {
      throw new Error(`칸 ${r.i} 의 best 구간이 곱과 맞지 않는다`);
    }
  }
  return rounds;
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/**
 * 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). 음수 둘이 곱해져 양수가 되는 칸(2)과 0 을
 * 지나는 칸(4)이 있고, 답이 마지막 칸이 아니라 칸 3 에서 만들어진다.
 */
export const WALK: readonly number[] = [2, -3, -2, 4, 0, -1];

/** 과제 규모 — 배열 길이의 상한. */
export const N_MAX = 100_000;

/** 값의 절댓값 상한. */
export const V_MAX = 10;

export const num = (x: number): string =>
  Number.isFinite(x) ? z(x).toLocaleString("en-US") : String(x);

/** 단순 연산 1 초에 1 억 번 기준. */
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toLocaleString("en-US", { maximumSignificantDigits: 3 })} 초`;

/** `[0,3]` 꼴 — 인덱스 구간. */
export const span = (r: readonly [number, number]): string =>
  `[${r[0]},${r[1]}]`;

/** 음수를 괄호로 싼다 — `(-3) × (-2)`. */
export const paren = (x: number): string => (x < 0 ? `(${x})` : String(x));

/** 후보의 이름 — 본문 표와 걸음 설명이 같이 쓴다. */
export const SOURCE_NAME: Record<Source, string> = {
  fresh: "새로 시작",
  grown: "최댓값에 잇기",
  flipped: "최솟값에 잇기",
};

/**
 * 고른 값이 어느 후보에서 왔는지의 이름. 후보 여럿이 같은 값이면 하나를 골라 부르지 않고 같다고 적는다.
 */
export function fromName(r: Round, pick: "max" | "min"): string {
  if (r.grown === null || r.flipped === null) return SOURCE_NAME.fresh;
  const v = pick === "max" ? r.curMax : r.curMin;
  const same = [r.x, r.grown, r.flipped].filter((c) => c === v).length;
  if (same === 3) return "셋이 같음";
  if (same === 2 && r.x !== v) return "잇기 둘이 같음";
  return SOURCE_NAME[pick === "max" ? r.maxFrom : r.minFrom];
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** `curMax` 를 만든 구간. */
  readonly range: readonly [number, number];
  readonly readA: readonly number[];
  readonly mx: readonly (number | null)[];
  readonly mn: readonly (number | null)[];
  readonly best: readonly (number | null)[];
  readonly readPair: readonly number[];
  readonly writePair: readonly number[];
  readonly readBest: readonly number[];
  readonly writeBest: readonly number[];
  readonly mxRange: readonly [number, number];
  readonly mnRange: readonly [number, number];
  readonly bestRange: readonly [number, number];
  readonly pointer: number;
  readonly calc: { readonly expr: string; readonly result: string };
}

/** 전개의 걸음 — 첫 칸 한 걸음 + 반복 `N − 1` 걸음 + 반복을 마치는 한 걸음. */
export function walkSteps(A: readonly number[] = WALK): Step[] {
  const rounds = trace(A);
  const n = A.length;
  const mx: (number | null)[] = new Array<null>(n).fill(null);
  const mn: (number | null)[] = new Array<null>(n).fill(null);
  const best: (number | null)[] = new Array<null>(n).fill(null);
  const first = rounds[0] as Round;
  mx[0] = first.curMax;
  mn[0] = first.curMin;
  best[0] = first.best;
  const steps: Step[] = [
    {
      id: "T1",
      title: "i = 0 · ①",
      detail: `curMax · curMin · best 를 모두 A[0] = ${first.x}${으로(first.x)} 둡니다. 칸 0 에서 끝나는 부분 배열은 [0,0] 하나뿐입니다.`,
      range: [0, 0],
      readA: [0],
      mx: [...mx],
      mn: [...mn],
      best: [...best],
      readPair: [],
      writePair: [0],
      readBest: [],
      writeBest: [0],
      mxRange: [0, 0],
      mnRange: [0, 0],
      bestRange: first.bestRange,
      pointer: 0,
      calc: {
        expr: "curMax = curMin = best = A[0]",
        result: String(first.x),
      },
    },
  ];
  for (const r of rounds.slice(1)) {
    const before = rounds[r.i - 1] as Round;
    mx[r.i] = r.curMax;
    mn[r.i] = r.curMin;
    best[r.i] = r.best;
    const moved =
      r.best > before.best
        ? `best 는 ${before.best} 에서 ${r.best}${으로(r.best)} 커집니다.`
        : `best 는 ${r.best} 그대로입니다.`;
    steps.push({
      id: `T${steps.length + 1}`,
      title: `i = ${r.i} · A[i] = ${r.x}`,
      detail: `후보는 새로 시작 ${r.x}, 최댓값에 잇기 ${paren(before.curMax)} × ${paren(r.x)} = ${r.grown}, 최솟값에 잇기 ${paren(before.curMin)} × ${paren(r.x)} = ${r.flipped} 입니다. 가장 큰 ${r.curMax}${이가(r.curMax)} curMax(${fromName(r, "max")}), 가장 작은 ${r.curMin}${이가(r.curMin)} curMin(${fromName(r, "min")})이고, ${moved}`,
      range: [r.maxStart, r.i],
      readA: [r.i],
      mx: [...mx],
      mn: [...mn],
      best: [...best],
      readPair: [r.i - 1],
      writePair: [r.i],
      readBest: [r.i - 1],
      writeBest: r.best > before.best ? [r.i] : [],
      mxRange: [r.maxStart, r.i],
      mnRange: [r.minStart, r.i],
      bestRange: r.bestRange,
      pointer: r.i,
      calc: {
        expr: `후보 ${r.x} · ${r.grown} · ${r.flipped}`,
        result: `최대 ${r.curMax} · 최소 ${r.curMin}`,
      },
    });
  }
  const last = rounds[rounds.length - 1] as Round;
  steps.push({
    id: `T${steps.length + 1}`,
    title: `i = ${n} · 반복 끝`,
    detail: `i = ${n}${josa(n, "이라", "라")} ② 의 조건 i < ${n}${이가(n)} 거짓입니다. 반복을 마치고 best = ${last.best}${을를(last.best)} 돌려줍니다. 이 값을 만든 구간은 ${span(last.bestRange)} 입니다.`,
    range: [last.maxStart, last.i],
    readA: [],
    mx: [...mx],
    mn: [...mn],
    best: [...best],
    readPair: [],
    writePair: [],
    readBest: [n - 1],
    writeBest: [],
    mxRange: [last.maxStart, last.i],
    mnRange: [last.minStart, last.i],
    bestRange: last.bestRange,
    pointer: n,
    calc: { expr: `${n} < ${n}`, result: "거짓" },
  });
  return steps;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "curMax",
};

/** 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
function arrayStep(s: Step, A: readonly number[] = WALK): ArrayStep {
  return {
    array: [...A],
    range: [s.range[0], s.range[1]],
    read: [...s.readA],
    write: [],
    pointers: { i: s.pointer },
    calc: { ...s.calc },
    vars: null,
    layers: [
      {
        name: "mx",
        values: [...s.mx],
        read: [...s.readPair],
        write: [...s.writePair],
        side: `구간 ${span(s.mxRange)}`,
      },
      {
        name: "mn",
        values: [...s.mn],
        read: [...s.readPair],
        write: [...s.writePair],
        side: `구간 ${span(s.mnRange)}`,
      },
      {
        name: "best",
        values: [...s.best],
        read: [...s.readBest],
        write: [...s.writeBest],
        side: `구간 ${span(s.bestRange)}`,
      },
    ],
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `maximumProductSubarray-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    pair: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...arrayStep(s),
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 계측기 ───────────────── */

export interface Counted {
  readonly answer: number;
  readonly muls: number;
  readonly cmps: number;
}

/**
 * 모든 `(l, r)` 쌍의 곱을 각각 만드는 방식. 정의를 그대로 옮긴 것이라 답의 기준이 되고, 쌍 하나마다
 * 곱셈 한 번과 비교 한 번을 센다.
 */
export function byAllPairs(A: readonly number[]): Counted {
  let best = A[0] as number;
  let muls = 0;
  let cmps = 0;
  for (let l = 0; l < A.length; l++) {
    let p = 1;
    for (let r = l; r < A.length; r++) {
      muls++;
      p *= A[r] as number;
      cmps++;
      best = Math.max(best, p);
    }
  }
  return { answer: z(best), muls, cmps };
}

/**
 * 정본과 같은 절차에 계수만 덧붙인 것. 칸 하나마다 곱셈 두 번(이어 붙이는 후보 둘)과 비교 다섯 번
 * (셋 중 가장 큰 것 둘 · 셋 중 가장 작은 것 둘 · 최댓값 갱신 하나)이다. 답은 정본과 대조한다.
 */
export function byCarrying(A: readonly number[]): Counted {
  let curMax = A[0] as number;
  let curMin = A[0] as number;
  let best = A[0] as number;
  let muls = 0;
  let cmps = 0;
  for (let i = 1; i < A.length; i++) {
    const x = A[i] as number;
    muls += 2;
    const grown = curMax * x;
    const flipped = curMin * x;
    cmps += 2;
    curMax = Math.max(x, grown, flipped);
    cmps += 2;
    curMin = Math.min(x, grown, flipped);
    cmps += 1;
    best = Math.max(best, curMax);
  }
  if (!Object.is(z(best), z(maximumProductSubarray([...A])))) {
    throw new Error("계측기가 정본과 다른 답을 냈다");
  }
  return { answer: z(best), muls, cmps };
}

/** 최댓값 하나만 이어받는 후보 — 합의 절차(`kadane`)를 곱에 그대로 옮긴 것이다. */
export function maxOnly(A: readonly number[]): number {
  let cur = A[0] as number;
  let best = A[0] as number;
  for (let i = 1; i < A.length; i++) {
    const x = A[i] as number;
    cur = Math.max(x, cur * x);
    best = Math.max(best, cur);
  }
  return z(best);
}

/** 최댓값만 이어받을 때 칸마다의 기록 — 이어받은 값과 버린 값. */
export function maxOnlyTrace(
  A: readonly number[],
): { i: number; x: number; kept: number; dropped: number | null }[] {
  let cur = A[0] as number;
  const out: { i: number; x: number; kept: number; dropped: number | null }[] =
    [{ i: 0, x: A[0] as number, kept: cur, dropped: null }];
  for (let i = 1; i < A.length; i++) {
    const x = A[i] as number;
    const joined = z(cur * x);
    const kept = Math.max(x, joined);
    out.push({ i, x, kept, dropped: kept === x ? joined : x });
    cur = kept;
  }
  return out;
}

/** 최댓값만 이어받는 후보가 틀리는 입력 — 그림과 표가 같이 쓴다. */
export const MAX_ONLY_BREAK: readonly number[] = [3, -2, -5];

function approaches(): Approach[] {
  const pairs = byAllPairs(WALK);
  const carry = byCarrying(WALK);
  const bigPairs = N_MAX * (N_MAX + 1);
  const bigCarry = 7 * (N_MAX - 1);
  const wrong = maxOnly(MAX_ONLY_BREAK);
  const right = maximumProductSubarray([...MAX_ONLY_BREAK]);
  return [
    {
      name: "모든 쌍 곱하기",
      idea: "왼쪽 끝 l 과 오른쪽 끝 r 을 모두 골라 곱을 만들고, 그중 최댓값을 고른다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `맞다 · 여섯 칸 입력에서 기본 연산 ${num(pairs.muls + pairs.cmps)} 번`,
          ok: true,
        },
        {
          label: "시간",
          value: `N = ${num(N_MAX)} 이면 기본 연산 ${num(bigPairs)} 번 · ${secondsOf(bigPairs)}`,
          ok: false,
        },
      ],
      lesson:
        "같은 칸에서 끝나는 후보를 처음부터 다시 곱한다 — 합에서처럼 직전 칸의 최댓값을 이어 쓰면 어떨까",
    },
    {
      name: "최댓값 하나만 이어받기",
      idea: "칸 i 에서 끝나는 곱의 최댓값을 A[i] 와 직전 최댓값 × A[i] 중 큰 쪽으로 정한다",
      verdict: "drop",
      checks: [
        { label: "시간", value: "칸마다 곱셈 하나와 비교 둘", ok: true },
        {
          label: "답",
          value: `[${MAX_ONLY_BREAK.join(" ")}] 에서 ${wrong} · 정답은 ${right}`,
          ok: false,
        },
      ],
      lesson:
        "음수를 곱하면 버린 가장 작은 곱이 가장 큰 곱이 된다 — 최솟값도 함께 이어받으면 어떨까",
    },
    {
      name: "최댓값과 최솟값을 함께 이어받기",
      idea: "칸 i 에서 끝나는 곱의 최댓값과 최솟값을 같은 후보 셋에서 정하고, 지나온 최댓값을 따로 든다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `맞다 · 여섯 칸 입력에서 기본 연산 ${num(carry.muls + carry.cmps)} 번`,
          ok: true,
        },
        {
          label: "시간",
          value: `N = ${num(N_MAX)} 이면 기본 연산 ${num(bigCarry)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 칸 `i` 에서 끝나는 후보를 모두 그리는 그림의 칸 — 「먼저 알아 둘 개념」 (b) · (c). */
export const CANDIDATE_END = 3;

/** 「먼저 알아 둘 개념」 (d) 가 그리는 칸 — 음수 · 양수 · 0 을 곱하는 자리. */
export const FLIP_CELLS: readonly number[] = [2, 3, 4];

export const FIGS: Record<string, () => ReactElement> = {
  "concept-rows": () => {
    const rounds = trace(WALK);
    const last = rounds[rounds.length - 1] as Round;
    const [from, to] = last.bestRange;
    const answer: Partial<Record<number, CellState>> = {};
    for (let k = from; k <= to; k++) answer[k] = "read";
    const rows: StageRow[] = [
      {
        kind: "bracket",
        label: "답",
        from,
        to,
        tone: "query",
        text: `${span(last.bestRange)} · 곱 ${last.best}`,
      },
      { kind: "index", label: "인덱스" },
      { kind: "cells", label: "A", values: [...WALK], states: answer },
      {
        kind: "cells",
        label: "mx",
        values: rounds.map((r) => r.curMax),
        states: { [to]: "focus" },
        side: "칸 i 에서 끝나는 최대곱",
      },
      {
        kind: "cells",
        label: "mn",
        values: rounds.map((r) => r.curMin),
        side: "칸 i 에서 끝나는 최소곱",
      },
      {
        kind: "cells",
        label: "best",
        values: rounds.map((r) => r.best),
        side: "칸 i 까지의 최댓값",
      },
    ];
    return (
      <CellStage
        title={`A = [${WALK.join(", ")}] 과 칸마다 끝나는 최대곱 mx · 최소곱 mn · 그때까지의 최댓값 best`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`N 최대 ${num(N_MAX)} · 1 초(단순 연산 1 초에 1 억 번 기준) · 빈 부분 배열은 후보가 아니다`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-candidates": () => {
    const r = CANDIDATE_END;
    const prods = endingProducts(WALK, r);
    const top = Math.max(...prods);
    const low = Math.min(...prods);
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      { kind: "cells", label: "A", values: [...WALK], states: { [r]: "read" } },
      { kind: "caret", cells: [r], side: `오른쪽 끝 = ${r}` },
    ];
    prods.forEach((p, l) => {
      rows.push({
        kind: "bracket",
        label: `l = ${l}`,
        from: l,
        to: r,
        tone: p === top ? "make" : p === low ? "right" : "left",
        text: `곱 ${p}`,
        side: p === top ? "가장 크다" : p === low ? "가장 작다" : undefined,
      });
    });
    const at = (v: number): (number | null)[] =>
      WALK.map((_, k) => (k === r ? v : null));
    rows.push(
      {
        kind: "cells",
        label: "mx",
        values: at(top),
        states: { [r]: "focus" },
        side: `mx[${r}] = ${top}`,
      },
      {
        kind: "cells",
        label: "mn",
        values: at(low),
        states: { [r]: "focus" },
        side: `mn[${r}] = ${low}`,
      },
    );
    return (
      <CellStage
        title={`칸 ${r} 에서 끝나는 후보 ${prods.length} 개 — 가장 큰 곱이 mx[${r}], 가장 작은 곱이 mn[${r}]`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "build-flip": () => {
    const rounds = trace(WALK);
    const frames: StageFrame[] = FLIP_CELLS.map((i) => {
      const r = rounds[i] as Round;
      const before = rounds[i - 1] as Round;
      const upTo = (pick: (x: Round) => number): (number | null)[] =>
        WALK.map((_, k) => (k <= i ? pick(rounds[k] as Round) : null));
      const rows: StageRow[] = [
        { kind: "index", label: "인덱스" },
        {
          kind: "cells",
          label: "A",
          values: [...WALK],
          states: { [i]: "read" },
        },
        {
          kind: "bracket",
          label: `mx[${i - 1}]`,
          from: before.maxStart,
          to: i - 1,
          tone: "left",
          text: `곱 ${before.curMax}`,
        },
        {
          kind: "bracket",
          label: `mn[${i - 1}]`,
          from: before.minStart,
          to: i - 1,
          tone: "right",
          text: `곱 ${before.curMin}`,
        },
        {
          kind: "bracket",
          label: `mx[${i}]`,
          from: r.maxStart,
          to: i,
          tone: "make",
          text: `곱 ${r.curMax}`,
          side: fromName(r, "max"),
        },
        {
          kind: "bracket",
          label: `mn[${i}]`,
          from: r.minStart,
          to: i,
          tone: "make",
          text: `곱 ${r.curMin}`,
          side: fromName(r, "min"),
        },
        {
          kind: "cells",
          label: "mx",
          values: upTo((x) => x.curMax),
          states: { [i - 1]: "read", [i]: "focus" },
        },
        {
          kind: "cells",
          label: "mn",
          values: upTo((x) => x.curMin),
          states: { [i - 1]: "read", [i]: "focus" },
        },
      ];
      return {
        id: `i = ${i}`,
        text: `A[${i}] = ${r.x} · 후보 ${r.x} · ${r.grown} · ${r.flipped} → mx[${i}] = ${r.curMax} (${fromName(r, "max")}) · mn[${i}] = ${r.curMin} (${fromName(r, "min")})`,
        rows,
      };
    });
    return (
      <CellStageFilm
        title="이웃한 두 칸의 구간 — 음수를 곱하면 mx 는 직전 mn 의 구간에서 온다"
        columns={WALK.length}
        frames={frames}
      />
    );
  },
  "walk-pair": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.calc.expr} → ${s.calc.result}`,
      rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`maximumProductSubarray([${WALK.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(steps[0] as Step))}
        frames={frames}
      />
    );
  },
};
