/**
 * `ternarySearch-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 반복 한 바퀴의 `lo`·`hi`·`m1`·`m2`
 * 는 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록하고, 답은 정본이 낸다. 걸음 재생 패널의
 * 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `ternarySearch-guide.test.ts` 가 잰다.
 *
 * 이 편의 입력은 배열이 아니라 **함수와 실수 구간**이다. 그래서 칸 한 줄은 두 가지 중 하나다.
 * 개념 그림은 정수 자리 `x = 0 … 9` 에서 잰 함숫값을 칸에 적는다(정수 자리라 인덱스 줄이 곧 `x` 다).
 * 걸음 재생 패널은 한 번의 실행이 재는 자리 전부를 **크기 순으로** 칸에 늘어놓는다 — 칸의 값이 곧
 * 좌표라서 배열 무대의 `valueAxis` 를 쓴다. 칸 사이 간격은 실제 거리와 다르다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 을를, 이가 } from "../../../../tools/josa.ts";
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
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { ternarySearch } from "./ternarySearch-guide.ref.ts";

const REF = new URL("./ternarySearch-guide.ref.ts", import.meta.url).pathname;

type Fn = (x: number) => number;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 반복 한 바퀴 — 그 바퀴가 시작할 때의 후보 구간과 두 내부점, 두 함숫값. */
export interface Round {
  readonly lo: number;
  readonly hi: number;
  readonly third: number;
  readonly m1: number;
  readonly m2: number;
  readonly f1: number;
  readonly f2: number;
  /** `left` ① 왼쪽 점이 더 낮다(`hi = m2`) · `right` ② 오른쪽 점이 더 낮거나 같다(`lo = m1`). */
  readonly branch: "left" | "right";
}

export interface Trace {
  readonly rounds: readonly Round[];
  /** 반복이 끝난 뒤의 후보 구간. */
  readonly end: { readonly lo: number; readonly hi: number };
  /** 정본이 돌려준 값. 반복이 멈추지 않아 끊었으면 `NaN`. */
  readonly result: number;
  /** `f` 를 부른 횟수. */
  readonly calls: number;
  /** 바퀴가 `LIMIT` 을 넘어 끊었는가(ε = 0 처럼 끝나지 않는 입력). */
  readonly stopped: boolean;
}

/** 끝나지 않는 입력을 끊는 바퀴 수. 이 편이 다루는 입력은 전부 이보다 훨씬 적게 돈다. */
export const LIMIT = 4000;

/**
 * 두 내부점을 정하는 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히
 * 맞지 않으면 `loadMutant` 가 던진다. 반복의 상태를 손으로 다시 계산하면 「이 코드가 그렇게
 * 움직인다」가 검사되지 않는다.
 */
const probed = await loadMutant<{
  ternarySearch(f: Fn, lo: number, hi: number, epsilon: number): number;
}>(REF, {
  swap: [
    /^(\s*)const m2 = hi - third;$/,
    '$1const m2 = hi - third;\n$1const box = globalThis as any;\n$1box.__rounds.push({ lo, hi, third, m1, m2 });\n$1if (box.__rounds.length > box.__limit) throw new Error("STOP");',
  ],
});

/** 정본 한 번 호출의 반복 기록. 답은 정본과 대조하고, 바퀴 사이의 구간 변화도 대조한다. */
export function trace(f: Fn, lo: number, hi: number, eps: number): Trace {
  const g = globalThis as unknown as {
    __rounds: {
      lo: number;
      hi: number;
      third: number;
      m1: number;
      m2: number;
    }[];
    __limit: number;
  };
  g.__rounds = [];
  g.__limit = LIMIT;
  let calls = 0;
  const counted: Fn = (x) => {
    calls++;
    return f(x);
  };
  let result = Number.NaN;
  let stopped = false;
  try {
    result = probed.ternarySearch(counted, lo, hi, eps);
  } catch (e) {
    if (!(e instanceof Error) || e.message !== "STOP") throw e;
    stopped = true;
  }
  const rounds: Round[] = g.__rounds.map((r) => {
    const f1 = f(r.m1);
    const f2 = f(r.m2);
    return { ...r, f1, f2, branch: f1 < f2 ? "left" : ("right" as const) };
  });
  if (stopped) rounds.pop();
  const after = (r: Round) =>
    r.branch === "left" ? { lo: r.lo, hi: r.m2 } : { lo: r.m1, hi: r.hi };
  for (let i = 1; i < rounds.length; i++) {
    const a = after(rounds[i - 1] as Round);
    const b = rounds[i] as Round;
    if (a.lo !== b.lo || a.hi !== b.hi) {
      throw new Error(`바퀴 ${i} 의 구간이 앞 바퀴의 갱신과 다르다`);
    }
  }
  const last = rounds.at(-1);
  const end = last === undefined ? { lo, hi } : after(last);
  if (!stopped) {
    const want = ternarySearch(f, lo, hi, eps);
    if (result !== want) {
      throw new Error(
        `계측 사본이 정본과 다른 답을 냈다 — ${result} ≠ ${want}`,
      );
    }
    if (result !== (end.lo + end.hi) / 2) {
      throw new Error("반환값이 마지막 구간의 중점이 아니다");
    }
  }
  return { rounds, end, result, calls, stopped };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 전개 입력 — 「수행으로 알아보는 알고리즘」과 같다. 최솟점은 `x = 2` 다. */
export const F: Fn = (x) => (x - 2) ** 2;
export const LO = 0;
export const HI = 9;
export const EPS_WALK = 1;
/** 개념 그림이 칸에 적는 자리 — 정수 `x = 0 … 9`. 인덱스 줄이 곧 `x` 다. */
export const XS = Array.from({ length: 10 }, (_, i) => i);

/** 한 자리만 재서는 갈리지 않는 짝 — `(x-6)²` 은 `x = 4` 에서 `(x-2)²` 와 같은 값을 낸다. */
export const G6: Fn = (x) => (x - 6) ** 2;
/** 봉우리가 둘인 함수 — 가장 낮은 자리는 `x = 1`, 두 번째로 낮은 자리는 `x = 7`. */
export const TWO: Fn = (x) => Math.min((x - 1) ** 2, (x - 7) ** 2 + 1);

/** 소수 셋째 자리까지 — 본문 표와 패널이 같은 모양을 쓴다. 정수는 그대로 적는다. */
export const d3 = (x: number): string =>
  Number.isInteger(x) ? String(x) : x.toFixed(3);
/** 칸에 적는 수 — 정수면 그대로, 아니면 셋째 자리까지. */
export const cell3 = (x: number): number => Number(x.toFixed(3));
export const num = (x: number): string => x.toLocaleString("en-US");
const BRANCH_MARK = { left: "①", right: "②" } as const;

/** 단봉 함수의 최솟점을 촘촘한 자리에서 직접 찾는다 — 정본과 무관한 대조용. */
export function argminByGrid(f: Fn, lo: number, hi: number, step: number) {
  let best = lo;
  for (let k = 0; lo + k * step <= hi + 1e-12; k++) {
    const x = lo + k * step;
    if (f(x) < f(best)) best = x;
  }
  return best;
}

/** 걸음 입력의 최솟점 — 정본을 조여서 받는다(본문의 「최솟점 2」). */
export const STAR = Math.round(ternarySearch(F, LO, HI, 1e-9) * 1e6) / 1e6;

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** 이 걸음이 끝난 뒤의 후보 구간. */
  readonly lo: number;
  readonly hi: number;
  /** 이 걸음에 잰 두 내부점. */
  readonly m?: readonly [number, number];
  readonly calc: { expr: string; result: string } | null;
  readonly calls: number;
}

/** 전개 입력의 걸음 — T1 준비 + 바퀴마다 한 걸음 + 반복이 끝나는 한 걸음. */
export function walkSteps(): Step[] {
  const t = trace(F, LO, HI, EPS_WALK);
  const steps: Step[] = [];
  let n = 1;
  steps.push({
    id: `T${n++}`,
    title: `후보 [${LO},${HI}]`,
    detail: `후보 구간을 입력 구간 그대로 잡습니다. 길이 ${HI - LO} > ${EPS_WALK}${josa(EPS_WALK, "이라", "라")} 반복에 들어갑니다.`,
    lo: LO,
    hi: HI,
    calc: { expr: `${HI} - ${LO} > ${EPS_WALK}`, result: "참" },
    calls: 0,
  });
  let calls = 0;
  for (const r of t.rounds) {
    calls += 2;
    const next =
      r.branch === "left" ? { lo: r.lo, hi: r.m2 } : { lo: r.m1, hi: r.hi };
    const same = d3(r.f1) === d3(r.f2);
    const cmp = r.branch === "left" ? "<" : same ? "=" : ">";
    const verdict =
      r.branch === "left"
        ? `① 오른쪽 3분의 1 을 빼 hi = ${d3(next.hi)} 입니다`
        : `② 왼쪽 3분의 1 을 빼 lo = ${d3(next.lo)} 입니다`;
    const tie = same
      ? " 두 값이 소수 셋째 자리까지 같고, 마지막 자리에서 f(m1) 이 작습니다."
      : "";
    steps.push({
      id: `T${n++}`,
      title: `m1 = ${d3(r.m1)} · m2 = ${d3(r.m2)} ${BRANCH_MARK[r.branch]}`,
      detail: `후보 [${d3(r.lo)},${d3(r.hi)}] 에서 구간을 셋으로 나눈 두 자리를 잽니다. f(m1) = ${d3(r.f1)}, f(m2) = ${d3(r.f2)} 입니다.${tie} ${verdict}.`,
      lo: next.lo,
      hi: next.hi,
      m: [r.m1, r.m2],
      calc: {
        expr: "f(m1) < f(m2)",
        result: `${d3(r.f1)} ${cmp} ${d3(r.f2)}, ${r.branch === "left" ? "참" : "거짓"}`,
      },
      calls,
    });
  }
  const L = t.end.hi - t.end.lo;
  steps.push({
    id: `T${n++}`,
    title: `길이 ${d3(L)} ≤ ${EPS_WALK}`,
    detail: `hi - lo > ${EPS_WALK}${이가(EPS_WALK)} 거짓이라 반복이 끝나고 중점 ${d3(t.result)}${을를(d3(t.result))} 돌려줍니다.`,
    lo: t.end.lo,
    hi: t.end.hi,
    calc: {
      expr: `(${d3(t.end.lo)} + ${d3(t.end.hi)}) / 2`,
      result: d3(t.result),
    },
    calls,
  });
  if (calls !== t.calls) throw new Error("걸음이 센 f 호출이 실행과 다르다");
  return steps;
}

/** 한 번의 실행이 재는 자리 전부 — 크기 순. 패널의 칸 줄이다. */
export function walkAxis(): number[] {
  const t = trace(F, LO, HI, EPS_WALK);
  const xs = new Set<number>([LO, HI]);
  for (const r of t.rounds) {
    xs.add(r.m1);
    xs.add(r.m2);
  }
  return [...xs].sort((a, b) => a - b);
}

/**
 * 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다.
 * 칸 줄은 이 실행이 재는 자리 전부이고, 아직 재지 않은 자리는 빈 칸(`null`)이다. 쥔 구간은 후보
 * 구간, 이번 바퀴에 잰 두 자리가 읽은 칸이자 새로 쓴 칸이다.
 */
function arrayStep(s: Step, seen: ReadonlySet<number>): ArrayStep {
  const axis = walkAxis();
  const at = (x: number): number => {
    const i = axis.indexOf(x);
    if (i < 0) throw new Error(`자리 ${x} 가 칸 줄에 없다`);
    return i;
  };
  const probe = s.m === undefined ? [] : [at(s.m[0]), at(s.m[1])];
  return {
    array: axis.map((x) => (seen.has(x) ? cell3(x) : null)),
    range: [at(s.lo), at(s.hi)],
    read: probe,
    write: probe,
    pointers:
      s.m === undefined
        ? { lo: cell3(s.lo), hi: cell3(s.hi) }
        : {
            lo: cell3(s.lo),
            m1: cell3(s.m[0]),
            m2: cell3(s.m[1]),
            hi: cell3(s.hi),
          },
    calc: s.calc,
    vars: `f 호출 ${s.calls} 번`,
    rangeSide: `길이 ${d3(s.hi - s.lo)}`,
  };
}

/** 걸음마다 그때까지 잰 자리 — 처음에는 두 끝뿐이다. */
function arraySteps(): { step: Step; array: ArrayStep }[] {
  const seen = new Set<number>([LO, HI]);
  return walkSteps().map((s) => {
    if (s.m) {
      seen.add(s.m[0]);
      seen.add(s.m[1]);
    }
    return { step: s, array: arrayStep(s, new Set(seen)) };
  });
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "재는 자리 x",
  rangeLabel: "후보",
  valueAxis: true,
};

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `ternarySearch-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    narrow: arraySteps().map(({ step, array }) => ({
      title: `${step.id} ${step.title}`,
      text: step.detail,
      ...array,
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

/** 과제 규모의 끝 — 구간 길이 최대와 허용 오차 최소. */
export const L_MAX = 2_000_000;
export const EPS_MIN = 1e-9;
/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
export const OPS_PER_SEC = 1e8;

/** 격자 탐색 — 구간을 `ε` 간격으로 끊어 전부 잰다. 단봉을 쓰지 않는다. */
export function gridSearch(
  f: Fn,
  lo: number,
  hi: number,
  epsilon: number,
): { x: number; calls: number } {
  const n = Math.ceil((hi - lo) / epsilon);
  let calls = 1;
  let bestX = lo;
  let bestF = f(lo);
  for (let k = 1; k <= n; k++) {
    const x = lo + (k * (hi - lo)) / n;
    const fx = f(x);
    calls++;
    if (fx < bestF) {
      bestF = fx;
      bestX = x;
    }
  }
  return { x: bestX, calls };
}

/**
 * 격자 탐색이 부르는 횟수 `⌈L/ε⌉ + 1`. 과제 규모(2 천조 번)는 실행할 수 없으므로 식으로 내고,
 * 그 식이 실제 실행과 같은지는 작은 규모에서 확인한다.
 */
export const gridCalls = (L: number, eps: number): number =>
  Math.ceil(L / eps) + 1;
for (const [L, eps] of [
  [9, 1e-3],
  [9, 1e-5],
] as const) {
  const real = gridSearch(F, 0, L, eps).calls;
  if (real !== gridCalls(L, eps)) {
    throw new Error(`격자 탐색의 호출 수 식이 실행과 다르다 — ${real}`);
  }
}

function approaches(): Approach[] {
  const grid = gridCalls(L_MAX, EPS_MIN);
  const days = grid / OPS_PER_SEC / 86_400;
  const ts = trace(F, -L_MAX / 2, L_MAX / 2, EPS_MIN);
  return [
    {
      name: "격자 전부 재기",
      idea: "구간을 ε 간격으로 끊어 모든 자리에서 f 를 재고 가장 작은 곳을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "오차 ε 안이다", ok: true },
        {
          label: "시간",
          value: `f 호출 약 ${(grid / 1e15).toFixed(0)} × 10^15 번 · 약 ${days.toFixed(0)} 일`,
          ok: false,
        },
      ],
      lesson:
        "잰 값끼리 비교만 하고 「여기엔 없다」를 말하지 않는다 — 단봉을 쓰면?",
    },
    {
      name: "한 자리만 재기",
      idea: "가운데 한 자리에서 f 를 재고 한쪽을 뺀다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `같은 값 ${F(4)}${이가(F(4))} 나오는 두 함수가 서로 다른 쪽에 최솟점을 둔다`,
          ok: false,
        },
        { label: "시간", value: "—", ok: null },
      ],
      lesson:
        "값 하나로는 최솟점이 어느 쪽인지 갈리지 않는다 — 두 자리를 재면?",
    },
    {
      name: "두 자리를 재고 바깥 3분의 1 빼기",
      idea: "구간을 셋으로 나눈 두 자리의 값을 비교해 최솟점이 없는 바깥 3분의 1 을 뺀다",
      verdict: "keep",
      checks: [
        { label: "답", value: "오차 ε/2 안이다", ok: true },
        {
          label: "시간",
          value: `f 호출 ${num(ts.calls)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 칸 그림 도우미 ───────────────────────── */

const samples = (f: Fn): number[] => XS.map((x) => f(x));
const idx = (label = "x"): StageRow => ({ kind: "index", label });

/** 두 칸 사이 차이 `f(x+1) − f(x)` — 마지막 자리는 다음 칸이 없어 비운다. */
export const diffs = (f: Fn): number[] =>
  XS.slice(0, -1).map((x) => f(x + 1) - f(x));

/** 차이의 부호가 바뀐 횟수. 단봉이면 한 번이다. */
export const signChanges = (ds: readonly number[]): number => {
  let n = 0;
  for (let i = 1; i < ds.length; i++) {
    if (Math.sign(ds[i] as number) !== Math.sign(ds[i - 1] as number)) n++;
  }
  return n;
};

/** 칸의 음수 구간 · 양수 구간 — 부호가 한 번 바뀌는 차이 줄에서. */
function signRuns(ds: readonly number[]): {
  neg: [number, number];
  pos: [number, number];
} {
  const firstPos = ds.findIndex((d) => d > 0);
  if (firstPos <= 0 || signChanges(ds) !== 1) {
    throw new Error("차이의 부호가 한 번만 바뀌는 줄이 아니다");
  }
  return { neg: [0, firstPos - 1], pos: [firstPos, ds.length - 1] };
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-unimodal": () => {
    const fs = samples(F);
    const star = XS.indexOf(STAR);
    return (
      <CellStage
        title={`f(x) = (x-2)² 를 x = 0 … 9 에서 잰 값 — 최솟점 ${STAR} 왼쪽은 줄고 오른쪽은 는다`}
        columns={XS.length}
        rows={[
          idx(),
          {
            kind: "cells",
            label: "f(x)",
            values: fs,
            states: { [star]: "focus" },
            side: `최솟점 x = ${STAR}`,
          },
          {
            kind: "bracket",
            label: "줄어든다",
            from: 0,
            to: star,
            tone: "left",
          },
          {
            kind: "bracket",
            label: "늘어난다",
            from: star,
            to: XS.length - 1,
            tone: "right",
          },
        ]}
      />
    );
  },
  "concept-two-probes": () => {
    const r = trace(F, LO, HI, EPS_WALK).rounds[0] as Round;
    const states: Partial<Record<number, CellState>> = {};
    for (const x of XS) if (x > r.m2) states[x] = "out";
    states[r.m1] = "read";
    states[r.m2] = "read";
    return (
      <CellStage
        title={`m1 = ${r.m1} 과 m2 = ${r.m2} 에서 재면 m2 오른쪽이 후보에서 빠진다`}
        columns={XS.length}
        rows={[
          idx(),
          { kind: "cells", label: "f(x)", values: samples(F), states },
          {
            kind: "caret",
            cells: [r.m1, r.m2],
            side: `f(${r.m1}) = ${r.f1} < f(${r.m2}) = ${r.f2}`,
          },
          {
            kind: "bracket",
            label: "후보",
            from: LO,
            to: r.m2,
            tone: "query",
            text: `[${LO},${r.m2}]`,
            side: `길이 ${HI - LO} → ${r.m2 - LO}`,
          },
        ]}
      />
    );
  },
  "origin-probes": () => {
    const one = 4;
    if (F(one) !== G6(one)) throw new Error("한 자리 그림의 두 값이 같지 않다");
    const r = trace(F, LO, HI, EPS_WALK).rounds[0] as Round;
    const [m1, m2] = [r.m1, r.m2];
    const read = (cells: number[]): Partial<Record<number, CellState>> =>
      Object.fromEntries(cells.map((c) => [c, "read" as CellState]));
    const starF = STAR;
    const starG = Math.round(ternarySearch(G6, LO, HI, 1e-9) * 1e6) / 1e6;
    const side = (f: Fn, star: number) =>
      f(m1) < f(m2)
        ? `f(${m1}) < f(${m2}) → 최솟점 ${star} 는 ${m2} 이하`
        : `f(${m1}) > f(${m2}) → 최솟점 ${star} 는 ${m1} 이상`;
    const frames: StageFrame[] = [
      {
        id: `x=${one}`,
        text: `한 자리 — 두 함수가 x = ${one} 에서 같은 값 ${F(one)}${을를(F(one))} 낸다`,
        rows: [
          idx(),
          {
            kind: "cells",
            label: "(x-2)²",
            values: samples(F),
            states: read([one]),
            side: `최솟점 ${starF} · 왼쪽`,
          },
          {
            kind: "cells",
            label: "(x-6)²",
            values: samples(G6),
            states: read([one]),
            side: `최솟점 ${starG} · 오른쪽`,
          },
          { kind: "caret", cells: [one] },
        ],
      },
      {
        id: `${m1}·${m2}`,
        text: `두 자리 — x = ${m1} · ${m2} 의 두 값을 비교하면 두 함수가 갈린다`,
        rows: [
          idx(),
          {
            kind: "cells",
            label: "(x-2)²",
            values: samples(F),
            states: read([m1, m2]),
            side: side(F, starF),
          },
          {
            kind: "cells",
            label: "(x-6)²",
            values: samples(G6),
            states: read([m1, m2]),
            side: side(G6, starG),
          },
          { kind: "caret", cells: [m1, m2] },
        ],
      },
    ];
    return (
      <CellStageFilm
        title="한 자리의 값으로는 갈리지 않고, 두 자리의 값을 비교하면 갈린다"
        columns={XS.length}
        frames={frames}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`구간 길이 ${num(L_MAX)} · ε = 10^-9 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-unimodal": () => {
    const star = XS.indexOf(STAR);
    const side = XS.map((x) =>
      x < STAR ? "왼쪽" : x === STAR ? "최솟점" : "오른쪽",
    );
    return (
      <CellStage
        title={`(x-2)² 를 x = 0 … 9 에서 잰 값과, 그 자리가 최솟점 ${STAR} 의 어느 쪽인가`}
        columns={XS.length}
        rows={[
          idx(),
          {
            kind: "cells",
            label: "f(x)",
            values: samples(F),
            states: { [star]: "focus" },
          },
          {
            kind: "cells",
            label: "자리",
            values: side,
            states: { [star]: "focus" },
          },
        ]}
      />
    );
  },
  "build-unimodal-steps": () => {
    const ds = diffs(F);
    const run = signRuns(ds);
    return (
      <CellStage
        title="이웃한 두 자리의 차이 f(x+1) − f(x) — 음수가 이어지다 한 번 양수로 바뀐다"
        columns={XS.length}
        rows={[
          idx(),
          { kind: "cells", label: "f(x)", values: samples(F) },
          {
            kind: "cells",
            label: "f(x+1) − f(x)",
            values: [...ds, ""],
            side: `부호가 바뀐 횟수 ${signChanges(ds)}`,
          },
          {
            kind: "bracket",
            label: "음수",
            from: run.neg[0],
            to: run.neg[1],
            tone: "left",
          },
          {
            kind: "bracket",
            label: "양수",
            from: run.pos[0],
            to: run.pos[1],
            tone: "right",
          },
        ]}
      />
    );
  },
  "build-two-valleys": () => {
    const r = trace(F, LO, HI, EPS_WALK).rounds[0] as Round;
    const [m1, m2] = [r.m1, r.m2];
    const read = { [m1]: "read", [m2]: "read" } as Partial<
      Record<number, CellState>
    >;
    const cmp = (f: Fn) =>
      `f(${m1}) = ${f(m1)} ${f(m1) < f(m2) ? "<" : ">"} f(${m2}) = ${f(m2)}`;
    return (
      <CellStage
        title="봉우리가 하나인 함수와 둘인 함수 — 같은 두 자리를 재면 무엇이 갈리는가"
        columns={XS.length}
        rows={[
          idx(),
          {
            kind: "cells",
            label: "(x-2)²",
            values: samples(F),
            states: read,
            side: cmp(F),
          },
          {
            kind: "cells",
            label: "g(x)",
            values: samples(TWO),
            states: read,
            side: cmp(TWO),
          },
          {
            kind: "cells",
            label: "g 의 차이",
            values: [...diffs(TWO), ""],
            side: `부호가 바뀐 횟수 ${signChanges(diffs(TWO))}`,
          },
          { kind: "caret", cells: [m1, m2] },
        ]}
      />
    );
  },
  "build-candidates": () => (
    <CellStage
      title={`후보 구간 [lo, hi] = [${LO},${HI}] — 두 실수로 후보 전체를 적는다`}
      columns={XS.length}
      rows={[
        idx(),
        { kind: "cells", label: "f(x)", values: samples(F) },
        {
          kind: "bracket",
          label: "후보",
          from: LO,
          to: HI,
          tone: "query",
          text: `lo = ${LO} · hi = ${HI}`,
          side: `길이 L = ${HI - LO}`,
        },
      ]}
    />
  ),
  "walk-narrow": () => {
    const frames: StageFrame[] = arraySteps().map(({ step, array }) => ({
      id: step.id,
      text: step.calc
        ? `${step.title} · ${step.calc.expr} → ${step.calc.result}`
        : step.title,
      rows: arrayStage(array, ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`ternarySearch((x) => (x - 2) ** 2, ${LO}, ${HI}, ${EPS_WALK}) — T1~T${frames.length}`}
        columns={walkAxis().length}
        frames={frames}
      />
    );
  },
  "invariant-range": () => {
    const t = trace(F, LO, HI, EPS_WALK);
    const r = t.rounds[2] as Round;
    if (!Number.isInteger(r.lo) || !Number.isInteger(r.hi)) {
      throw new Error("불변식 그림의 구간이 정수 자리에 서지 않는다");
    }
    const states: Partial<Record<number, CellState>> = {};
    for (const x of XS) if (x < r.lo || x > r.hi) states[x] = "out";
    states[STAR] = "focus";
    return (
      <CellStage
        title="반복이 한 바퀴를 시작할 때 — 최솟점은 후보 구간 밖에 없다"
        columns={XS.length}
        rows={[
          idx(),
          { kind: "cells", label: "f(x)", values: samples(F), states },
          {
            kind: "bracket",
            label: "후보",
            from: r.lo,
            to: r.hi,
            tone: "query",
            text: `[${r.lo},${r.hi}]`,
            side: `T4 가 시작할 때 · 최솟점 ${STAR} 는 안에 있다`,
          },
        ]}
      />
    );
  },
};
