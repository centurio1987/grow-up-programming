/**
 * `maxCounters-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 연산 하나를 처리하기 직전의 상태와
 * 마지막 채우기 직전의 상태를 남기는 계측 사본 둘(`opProbe` · `endProbe`)을 정본 소스에서 기계로 만들고,
 * 그 기록으로 걸음을 만든다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고,
 * `.sim.ts` 의 리터럴이 그것과 같은지는 `maxCounters-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 을를, 이가 } from "../../../../tools/josa.ts";
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
import { maxCounters } from "./maxCounters-guide.ref.ts";

const REF = new URL("./maxCounters-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  maxCounters(N: number, A: number[]): number[];
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 한 시점의 상태 — 저장값 배열과 두 수. */
export interface State {
  readonly counter: readonly number[];
  readonly base: number;
  readonly high: number;
}

/**
 * 연산 하나를 꺼낸 줄 뒤에 기록을 끼운 사본 — 그 연산을 처리하기 **직전**의 상태를 남긴다.
 * **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지 않으면 `loadMutant` 가 던진다.
 */
const opProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)const op = A\[k\] as number;$/,
    "$1const op = A[k] as number;\n$1(globalThis as any).__ops.push({ k, op, counter: [...counter], base, high });",
  ],
});

/** 마지막 채우기 반복 앞에 기록을 끼운 사본 — 연산을 다 처리한 뒤, 채우기 직전의 상태를 남긴다. */
const endProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)for \(let i = 0; i < N; i\+\+\) \{$/,
    "$1(globalThis as any).__end = { counter: [...counter], base, high };\n$1for (let i = 0; i < N; i++) {",
  ],
});

/** 연산 하나를 처리한 기록. */
export interface OpRecord {
  readonly k: number;
  readonly op: number;
  /** `max` 는 최대 맞추기(②), `inc` 는 증가(①). */
  readonly kind: "inc" | "max";
  readonly before: State;
  readonly after: State;
  /** 증가일 때만 — 가리킨 칸 · 그 칸의 저장값 · 출발값. */
  readonly i?: number;
  readonly stored?: number;
  readonly from?: number;
}

export interface Trace {
  readonly N: number;
  readonly A: readonly number[];
  readonly ops: readonly OpRecord[];
  /** 연산을 다 처리한 뒤, 마지막 채우기 직전. */
  readonly end: State;
  /** 마지막 채우기가 값을 적은 칸. */
  readonly filled: readonly number[];
  readonly result: readonly number[];
}

const same = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/** 참값 — 저장값과 바닥값 중 큰 쪽. */
export const realOf = (s: State): number[] =>
  s.counter.map((v) => (v < s.base ? s.base : v));

/**
 * 정본 한 번 호출의 기록. 두 계측 사본의 답을 정본과 대조하고, 연산 사이의 상태 변화가 두 갈래의
 * 규칙과 맞는지도 대조한다 — 어긋나면 기록을 잘못 읽은 것이다.
 */
export function trace(N: number, A: readonly number[]): Trace {
  const g = globalThis as unknown as {
    __ops: {
      k: number;
      op: number;
      counter: number[];
      base: number;
      high: number;
    }[];
    __end: State | undefined;
  };
  const want = maxCounters(N, [...A]);
  g.__ops = [];
  const a = opProbe.maxCounters(N, [...A]);
  const befores = g.__ops;
  g.__end = undefined;
  const b = endProbe.maxCounters(N, [...A]);
  const end = g.__end as State | undefined;
  if (!same(a, want) || !same(b, want) || end === undefined) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  if (befores.length !== A.length) {
    throw new Error(`연산 ${A.length} 개 중 ${befores.length} 개만 기록됐다`);
  }
  const ops: OpRecord[] = befores.map((r, n) => {
    const before: State = { counter: r.counter, base: r.base, high: r.high };
    const next = befores[n + 1];
    const after: State =
      next === undefined
        ? end
        : { counter: next.counter, base: next.base, high: next.high };
    if (r.op === N + 1) {
      if (after.base !== before.high || !same(after.counter, before.counter)) {
        throw new Error(`k=${r.k} 최대 맞추기의 상태 변화가 규칙과 다르다`);
      }
      return { k: r.k, op: r.op, kind: "max", before, after };
    }
    const i = r.op - 1;
    const stored = before.counter[i] as number;
    const from = stored < before.base ? before.base : stored;
    if (after.counter[i] !== from + 1 || after.base !== before.base) {
      throw new Error(`k=${r.k} 증가의 상태 변화가 규칙과 다르다`);
    }
    return { k: r.k, op: r.op, kind: "inc", before, after, i, stored, from };
  });
  const filled = end.counter.flatMap((v, i) => (v < end.base ? [i] : []));
  if (!same(realOf(end), want)) {
    throw new Error("채우기 직전의 참값이 정본의 답과 다르다");
  }
  return { N, A, ops, end, filled, result: want };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력 — `deep.origin` · `deep.build` · `deep.walk` · `.sim.ts` 가 같은 것을 쓴다. */
export const WALK_N = 5;
export const WALK: readonly number[] = [3, 4, 4, 6, 1, 4, 4];

/** 과제 규모의 끝 — `N` 과 `M` 이 둘 다 이 값까지 온다. */
export const N_MAX = 100_000;

export const num = (x: number): string => x.toLocaleString("en-US");
/** `[3 2 2 4 2]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
export const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;

/** 초당 1 억 번 기준의 시간(본문과 같다). */
export const secondsOf = (ops: number): string => {
  const s = ops / 1e8;
  return `${s >= 1 ? num(Math.round(s)) : s.toFixed(s < 0.01 ? 3 : 2)} 초`;
};

/** 즉시 채우기 — 최대 맞추기마다 카운터 `N` 칸을 그 자리에서 적는다. 칸 쓰기를 센다. */
export function eager(N: number, A: readonly number[]) {
  const c = new Array<number>(N).fill(0);
  let max = 0;
  let writes = 0;
  const snapshots: number[][] = [];
  for (const op of A) {
    if (op === N + 1) {
      for (let i = 0; i < N; i++) {
        c[i] = max;
        writes++;
      }
    } else {
      const i = op - 1;
      c[i] = (c[i] as number) + 1;
      writes++;
      if ((c[i] as number) > max) max = c[i] as number;
    }
    snapshots.push([...c]);
  }
  return { out: c, writes, snapshots };
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly step: ArrayStep;
}

const stale = (s: State): number[] =>
  s.counter.flatMap((v, i) => (v < s.base ? [i] : []));

const changed = (a: readonly number[], b: readonly number[]): number[] =>
  b.flatMap((v, i) => (v !== a[i] ? [i] : []));

/** 무대의 층 둘 — 저장값 `counter` 와 참값. */
function layers(
  s: State,
  counter: { read?: number[]; write?: number[] },
  realWrite: number[],
) {
  return [
    {
      name: "counter",
      values: [...s.counter],
      read: counter.read ?? [],
      write: counter.write ?? [],
      side: `옛 값 ${stale(s).length} 칸`,
    },
    {
      name: "참값",
      values: realOf(s),
      read: [],
      write: realWrite,
      side: `base = ${s.base}`,
    },
  ];
}

const vars = (s: State): string => `high = ${s.high}`;

/** 전개 입력의 걸음 전부 — 시작 T1, 연산마다 한 걸음, 마지막 채우기 한 걸음. */
export function walkSteps(): Step[] {
  const t = trace(WALK_N, WALK);
  const A = [...t.A];
  const steps: Step[] = [];
  let n = 1;
  const first = (t.ops[0] as OpRecord).before;
  steps.push({
    id: `T${n++}`,
    title: "시작",
    detail: `연산을 하나도 처리하지 않은 상태입니다. 카운터 ${t.N} 칸이 모두 0 이고 base 와 high 도 0 입니다.`,
    step: {
      array: A,
      range: null,
      read: [],
      write: [],
      calc: null,
      vars: vars(first),
      layers: layers(first, {}, []),
    },
  });
  for (const r of t.ops) {
    const id = `T${n++}`;
    const realChanged = changed(realOf(r.before), realOf(r.after));
    if (r.kind === "max") {
      const moved = realChanged.length;
      steps.push({
        id,
        title: `k=${r.k} · A[k]=${r.op} ②`,
        detail: `A[k] = ${r.op}${이가(r.op)} N + 1 이라 최대 맞추기입니다. counter 는 그대로 두고 base 를 high 인 ${r.after.base}${으로(r.after.base)} 옮깁니다. 참값이 ${moved} 칸에서 바뀝니다.`,
        step: {
          array: A,
          range: [0, r.k],
          read: [r.k],
          write: [],
          pointers: { k: r.k },
          calc: { expr: "base = high", result: String(r.after.base) },
          vars: vars(r.after),
          layers: layers(r.after, {}, realChanged),
        },
      });
      continue;
    }
    const i = r.i as number;
    const stored = r.stored as number;
    const from = r.from as number;
    const cond =
      stored < r.before.base
        ? `저장값 ${stored}${이가(stored)} base ${r.before.base} 보다 작아 base 에서 출발합니다`
        : `저장값 ${stored}${이가(stored)} base ${r.before.base} 보다 작지 않아 저장값에서 출발합니다`;
    const raised =
      r.after.high > r.before.high
        ? ` high 가 ${r.after.high}${으로(r.after.high)} 오릅니다.`
        : "";
    steps.push({
      id,
      title: `k=${r.k} · A[k]=${r.op} ①`,
      detail: `${r.op} 번 카운터(i = ${i})를 증가시킵니다. ${cond}. counter[${i}] = ${from + 1} 입니다.${raised}`,
      step: {
        array: A,
        range: [0, r.k],
        read: [r.k],
        write: [],
        pointers: { k: r.k },
        calc: {
          expr: `max(${stored}, ${r.before.base}) + 1`,
          result: String(from + 1),
        },
        vars: vars(r.after),
        layers: layers(r.after, { read: [i], write: [i] }, realChanged),
      },
    });
  }
  const done: State = {
    counter: [...t.result],
    base: t.end.base,
    high: t.end.high,
  };
  steps.push({
    id: `T${n++}`,
    title: "마지막 채우기 ③",
    detail: `base ${t.end.base} 에 못 미치는 ${t.filled.length} 칸에만 ${t.end.base}${을를(t.end.base)} 적습니다. 저장값과 참값이 모든 칸에서 같아집니다.`,
    step: {
      array: A,
      range: [0, A.length - 1],
      read: [],
      write: [],
      calc: {
        expr: `counter[i] < ${t.end.base} 인 칸`,
        result: `${t.filled.length} 칸에 ${t.end.base}`,
      },
      vars: vars(done),
      layers: layers(done, { write: [...t.filled] }, []),
    },
  });
  return steps;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "처리한 연산",
};

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `maxCounters-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    counters: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.step,
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

/** 최대 맞추기를 전부 건너뛰고 마지막에 끝까지의 최댓값으로 채운다 — 가장 단순한 후보. */
export function skipAll(N: number, A: readonly number[]): number[] {
  const c = new Array<number>(N).fill(0);
  let max = 0;
  let sawMax = false;
  for (const op of A) {
    if (op === N + 1) {
      sawMax = true;
      continue;
    }
    const i = op - 1;
    c[i] = (c[i] as number) + 1;
    if ((c[i] as number) > max) max = c[i] as number;
  }
  return sawMax ? c.map(() => max) : c;
}

/** 즉시 채우기의 최악 — 연산이 전부 최대 맞추기다. */
export const eagerWorst = (n: number): number[] =>
  new Array<number>(n).fill(n + 1);

function approaches(): Approach[] {
  const big = N_MAX * N_MAX;
  const want = maxCounters(WALK_N, [...WALK]);
  const skip = skipAll(WALK_N, WALK);
  return [
    {
      name: "즉시 전체 채우기",
      idea: "최대 맞추기를 만날 때마다 카운터 N 칸을 그 자리에서 적는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `N = M = ${num(N_MAX)} 이면 칸 쓰기 ${num(big)} 번 · ${secondsOf(big)}`,
          ok: false,
        },
      ],
      lesson:
        "최대 맞추기 직후에는 모든 칸이 같은 값이다 — 칸마다 따로 적을 까닭이 없다",
    },
    {
      name: "최대 맞추기를 건너뛰고 끝에 한 번 채우기",
      idea: "최대 맞추기는 무시하고, 연산이 끝나면 끝까지의 최댓값으로 모든 칸을 채운다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `${show(skip)} — 정답은 ${show(want)}`,
          ok: false,
        },
        { label: "시간", value: "칸 쓰기 M + N 이하", ok: true },
      ],
      lesson:
        "최대 맞추기가 정하는 값은 그 순간의 최댓값이다 — 값과 함께 그 시점을 지켜야 한다",
    },
    {
      name: "바닥값 하나로 미루기",
      idea: "최대 맞추기는 그 순간의 최댓값을 수 하나로 적고, 칸은 쓸 때와 마지막에만 맞춘다",
      verdict: "keep",
      checks: [
        { label: "답", value: `${show(want)} — 맞다`, ok: true },
        {
          label: "시간",
          value: `N = M = ${num(N_MAX)} 이면 칸 쓰기 ${num(2 * N_MAX - 2)} 번 이하`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 저장값 줄과 참값 줄 — 저장값이 바닥값보다 작은 칸은 대시(옛 값)로 그린다. */
function baseRows(s: State, realFocus: readonly number[] = []): StageRow[] {
  const staleStates: Partial<Record<number, CellState>> = {};
  for (const i of stale(s)) staleStates[i] = "out";
  const realStates: Partial<Record<number, CellState>> = {};
  for (const i of realFocus) realStates[i] = "focus";
  return [
    { kind: "index", label: "카운터 i" },
    {
      kind: "cells",
      label: "counter",
      values: s.counter,
      states: staleStates,
      side: `옛 값 ${stale(s).length} 칸`,
    },
    {
      kind: "cells",
      label: "참값",
      values: realOf(s),
      states: realStates,
      side: `base = ${s.base}`,
    },
  ];
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-base": () => {
    const t = trace(WALK_N, WALK);
    const maxOp = t.ops.find((r) => r.kind === "max") as OpRecord;
    const moved = changed(realOf(maxOp.before), realOf(maxOp.after));
    const frames: StageFrame[] = [
      {
        id: `k=${maxOp.k - 1}`,
        text: `A[${maxOp.k - 1}] 까지 처리한 뒤 — base = ${maxOp.before.base}`,
        rows: baseRows(maxOp.before),
      },
      {
        id: `k=${maxOp.k}`,
        text: `A[${maxOp.k}] = ${maxOp.op} 최대 맞추기 뒤 — counter 는 그대로, base 만 ${maxOp.after.base}`,
        rows: baseRows(maxOp.after, moved),
      },
    ];
    return (
      <CellStageFilm
        title={`최대 맞추기 한 번 — counter 는 한 칸도 안 바뀌고 참값은 ${moved.length} 칸이 바뀐다`}
        columns={t.N}
        frames={frames}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`N 과 M 은 각각 ${num(N_MAX)} 이하 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-base-rows": () => {
    const t = trace(WALK_N, WALK);
    return (
      <CellStage
        title={`일곱 연산을 처리한 뒤 — 대시 칸은 저장값이 base = ${t.end.base} 보다 작은 옛 값이다`}
        rows={baseRows(t.end)}
        columns={t.N}
      />
    );
  },
  "walk-run": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: s.title,
      rows: arrayStage(s.step, ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`maxCounters(${WALK_N}, [${WALK.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(steps[0]?.step as ArrayStep)}
        frames={frames}
      />
    );
  },
};

/** 저장값이 바닥값보다 작은 칸 — 증명 사이드카가 같은 규칙을 쓴다. */
export const staleOf = stale;
