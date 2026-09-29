/**
 * `prefixSumRangeQuery-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 누적합 배열을 채우는 줄과 질의를
 * 답하는 줄 뒤에 기록을 끼운 계측 사본 둘(`fillProbe` · `answerProbe`)을 정본 소스에서 기계로 만들고,
 * 그 기록으로 칸의 값과 답을 얻는다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고,
 * `.sim.ts` 의 리터럴이 그것과 같은지는 `prefixSumRangeQuery-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 을를 } from "../../../../tools/josa.ts";
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
import { prefixSumRangeQuery } from "./prefixSumRangeQuery-guide.ref.ts";

const REF = new URL("./prefixSumRangeQuery-guide.ref.ts", import.meta.url)
  .pathname;

type Query = readonly [number, number];

interface Impl {
  prefixSumRangeQuery(A: number[], queries: Array<[number, number]>): number[];
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 누적합 배열을 채우는 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히
 * 맞지 않으면 `loadMutant` 가 던진다. 칸의 값을 손으로 다시 더하면 「이 코드가 그렇게 채운다」가
 * 검사되지 않는다.
 */
const fillProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)P\[i \+ 1\] = \(P\[i\] as number\) \+ \(A\[i\] as number\);$/,
    "$1P[i + 1] = (P[i] as number) + (A[i] as number);\n$1(globalThis as any).__fill.push({ i, read: P[i], value: P[i + 1] });",
  ],
});

/** 질의를 답하는 줄 뒤에 기록을 끼운 사본. 읽은 두 칸의 값과 답을 남긴다. */
const answerProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)result\.push\(\(P\[r \+ 1\] as number\) - \(P\[l\] as number\)\);$/,
    "$1result.push((P[r + 1] as number) - (P[l] as number));\n$1(globalThis as any).__answer.push({ l, r, right: P[r + 1], left: P[l], value: result[result.length - 1] });",
  ],
});

/** 채우기 한 걸음 — `P[i + 1] = P[i] + A[i]`. */
export interface Fill {
  readonly i: number;
  /** 읽은 칸 `P[i]` 의 값. */
  readonly read: number;
  /** 쓴 칸 `P[i + 1]` 의 값. */
  readonly value: number;
}

/** 답하기 한 걸음 — `P[r + 1] − P[l]`. */
export interface Answer {
  readonly l: number;
  readonly r: number;
  readonly right: number;
  readonly left: number;
  readonly value: number;
}

export interface Trace {
  /** 채운 누적합 배열 전체(`P[0]` 포함). */
  readonly P: readonly number[];
  readonly fills: readonly Fill[];
  readonly answers: readonly Answer[];
  readonly result: readonly number[];
}

/** 정본 한 번 호출의 기록. 답은 정본과 대조하고, 칸은 정의(앞 `i` 칸의 합)와 대조한다. */
export function trace(A: readonly number[], queries: readonly Query[]): Trace {
  const g = globalThis as unknown as { __fill: Fill[]; __answer: Answer[] };
  const qs = () => queries.map((q) => [q[0], q[1]] as [number, number]);
  g.__fill = [];
  g.__answer = [];
  fillProbe.prefixSumRangeQuery([...A], qs());
  const fills = [...g.__fill];
  g.__fill = [];
  g.__answer = [];
  const probed = answerProbe.prefixSumRangeQuery([...A], qs());
  const answers = [...g.__answer];
  const result = prefixSumRangeQuery([...A], qs());
  if (JSON.stringify(probed) !== JSON.stringify(result)) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  if (fills.length !== A.length || fills.some((f, i) => f.i !== i)) {
    throw new Error("채우기 반복의 걸음이 배열 길이와 다르다");
  }
  const P = [0, ...fills.map((f) => f.value)];
  // 칸마다 정의(앞 `i` 칸의 합)와 대조한다. 합은 여기서 따로 한 칸씩 쌓는다.
  let running = 0;
  P.forEach((v, i) => {
    if (i > 0) running += A[i - 1] as number;
    if (v !== running) {
      throw new Error(`P[${i}] = ${v} 이 앞 ${i} 칸의 합과 다르다`);
    }
  });
  // 답은 정본과 대조하고, 구간 길이의 합이 작으면 정의(구간을 직접 더한 값)와도 대조한다.
  const span = queries.reduce((s, [l, r]) => s + r - l + 1, 0);
  answers.forEach((a, k) => {
    const byDef = span <= 5_000_000 ? sumOf(A, a.l, a.r) : a.value;
    if (a.value !== result[k] || a.value !== byDef) {
      throw new Error(`질의 [${a.l},${a.r}] 의 기록이 정본·정의와 다르다`);
    }
  });
  return { P, fills, answers, result };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK: readonly number[] = [3, 1, 4, 1, 5, 9];

/** 그 입력에 거는 질의 다섯 — 양끝이 안쪽 · 배열 전체 · 한 칸 · 왼쪽 끝 0 · 오른쪽 끝 마지막. */
export const WALK_Q: readonly Query[] = [
  [1, 3],
  [0, 5],
  [4, 4],
  [0, 2],
  [2, 5],
];

export const range = (lo: number, hi: number): number[] =>
  Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);
export const sumOf = (A: readonly number[], l: number, r: number): number =>
  range(l, r).reduce((s, i) => s + (A[i] as number), 0);
const num = (x: number): string => x.toLocaleString("en-US");

/** 과제 규모 — 배열 길이와 질의 수의 상한. */
export const N_MAX = 100_000;
/** 정수 하나를 담는 바이트. */
export const BYTES = 8;
/** 메모리 예산(바이트) — 256 MB. */
export const BUDGET = 256 * 1024 * 1024;
/** 단순 연산 1 초에 1 억 번 기준. */
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toLocaleString("en-US", { maximumSignificantDigits: 3 })} 초`;

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** 이번 걸음이 다루는 `A` 의 구간 — 채우기면 새 칸이 덮는 앞부분, 답하기면 질의. */
  readonly range: readonly [number, number] | null;
  readonly readA: readonly number[];
  /** 이 걸음이 끝난 뒤의 누적합 배열. 아직 안 쓴 칸은 `null`. */
  readonly P: readonly (number | null)[];
  readonly readP: readonly number[];
  readonly writeP: readonly number[];
  /** 이 걸음이 끝난 뒤의 답 목록. */
  readonly answers: readonly (number | null)[];
  readonly writeAnswer: readonly number[];
  readonly calc: { readonly expr: string; readonly result: string };
  /** 갈래 — 채우기 ① · 답하기 ② · 루프 전. */
  readonly branch: "①" | "②" | null;
}

/** 전개의 걸음 — 첫 칸 한 걸음 + 채우기 `n` 걸음 + 답하기 `q` 걸음. */
export function walkSteps(
  A: readonly number[] = WALK,
  queries: readonly Query[] = WALK_Q,
): Step[] {
  const t = trace(A, queries);
  const n = A.length;
  const P: (number | null)[] = [0, ...new Array<null>(n).fill(null)];
  const answers: (number | null)[] = new Array<null>(queries.length).fill(null);
  const steps: Step[] = [
    {
      id: "T1",
      title: "P[0] = 0",
      detail: `누적합 배열을 ${n + 1} 칸으로 잡고 첫 칸에 빈 구간의 합 0 을 넣습니다. 나머지 칸은 아직 비어 있습니다.`,
      range: null,
      readA: [],
      P: [...P],
      readP: [],
      writeP: [0],
      answers: [...answers],
      writeAnswer: [],
      calc: { expr: "P[0] = 0", result: "0" },
      branch: null,
    },
  ];
  for (const f of t.fills) {
    P[f.i + 1] = f.value;
    steps.push({
      id: `T${steps.length + 1}`,
      title: `i = ${f.i} · ①`,
      detail: `P[${f.i}] = ${f.read} 에 A[${f.i}] = ${A[f.i]}${을를(A[f.i] as number)} 더해 P[${f.i + 1}] = ${f.value}${을를(f.value)} 씁니다. 앞 ${f.i + 1} 칸 [0,${f.i}] 의 합입니다.`,
      range: [0, f.i],
      readA: [f.i],
      P: [...P],
      readP: [f.i],
      writeP: [f.i + 1],
      answers: [...answers],
      writeAnswer: [],
      calc: {
        expr: `P[${f.i}] + A[${f.i}] = ${f.read} + ${A[f.i]}`,
        result: String(f.value),
      },
      branch: "①",
    });
  }
  for (const [k, a] of t.answers.entries()) {
    answers[k] = a.value;
    steps.push({
      id: `T${steps.length + 1}`,
      title: `[${a.l},${a.r}] · ②`,
      detail: `질의 [${a.l},${a.r}] 입니다. P[${a.r + 1}] = ${a.right} 에서 P[${a.l}] = ${a.left}${을를(a.left)} 빼서 ${a.value}${을를(a.value)} 답 목록 칸 ${k} 에 씁니다. 구간은 ${a.r - a.l + 1} 칸이고 읽은 칸은 둘입니다.`,
      range: [a.l, a.r],
      readA: [],
      P: [...P],
      readP: [a.l, a.r + 1],
      writeP: [],
      answers: [...answers],
      writeAnswer: [k],
      calc: {
        expr: `P[${a.r + 1}] − P[${a.l}] = ${a.right} − ${a.left}`,
        result: String(a.value),
      },
      branch: "②",
    });
  }
  return steps;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "구간",
};

/** 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
function arrayStep(s: Step, A: readonly number[] = WALK): ArrayStep {
  return {
    array: [...A],
    range: s.range === null ? null : [s.range[0], s.range[1]],
    read: [...s.readA],
    write: [],
    calc: { ...s.calc },
    vars: null,
    layers: [
      { name: "P", values: [...s.P], read: [...s.readP], write: [...s.writeP] },
      { name: "답", values: [...s.answers], write: [...s.writeAnswer] },
    ],
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `prefixSumRangeQuery-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    walk: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...arrayStep(s),
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

/** 방식 A — 질의마다 구간을 직접 더한다. 세는 것은 덧셈 수다. */
export function addEachQuery(
  A: readonly number[],
  queries: readonly Query[],
): { answers: number[]; perQuery: number[]; adds: number } {
  const answers: number[] = [];
  const perQuery: number[] = [];
  let adds = 0;
  for (const [l, r] of queries) {
    let s = 0;
    let count = 0;
    for (let k = l; k <= r; k++) {
      s += A[k] as number;
      count++;
    }
    adds += count;
    answers.push(s);
    perQuery.push(count);
  }
  return { answers, perQuery, adds };
}

/**
 * 누적합 배열을 쓰는 절차의 연산 수 — 채우기 덧셈과 질의 뺄셈. 정본 계측 기록에서 센다(채운 칸 하나에
 * 덧셈 하나, 답 하나에 뺄셈 하나).
 */
export function prefixOps(
  A: readonly number[],
  queries: readonly Query[],
): { adds: number; subs: number } {
  const t = trace(A, queries);
  return { adds: t.fills.length, subs: t.answers.length };
}

/** 질의의 답을 모든 `(l, r)` 짝마다 미리 담으면 칸이 몇 개인가 — 짝의 수 `n(n+1)/2`. */
export const allPairs = (n: number): number => (n * (n + 1)) / 2;

function approaches(): Approach[] {
  const direct = addEachQuery(WALK, WALK_Q);
  const ops = prefixOps(WALK, WALK_Q);
  const bigDirect = N_MAX * N_MAX;
  const bigCells = allPairs(N_MAX);
  const gb = (bigCells * BYTES) / 1e9;
  return [
    {
      name: "질의마다 직접 더하기",
      idea: "질의가 오면 그 구간을 왼쪽 끝부터 오른쪽 끝까지 더한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `맞다 · 여섯 칸 입력의 질의 다섯에서 덧셈 ${direct.adds} 번`,
          ok: true,
        },
        {
          label: "시간",
          value: `n = q = ${num(N_MAX)} 최악 덧셈 ${num(bigDirect)} 번 · ${secondsOf(bigDirect)}`,
          ok: false,
        },
      ],
      lesson:
        "겹치는 질의가 같은 칸을 다시 더한다 — 답을 미리 다 적어 두면 어떨까",
    },
    {
      name: "모든 답을 미리 담기",
      idea: "모든 (l, r) 짝의 구간 합을 미리 계산해 두고 질의마다 한 칸을 읽는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다 · 질의마다 한 칸", ok: true },
        {
          label: "메모리",
          value: `n = ${num(N_MAX)} 이면 칸 ${num(bigCells)} 개 · ${num(gb)} GB`,
          ok: false,
        },
      ],
      lesson:
        "짝이 n² 규모로 늘었다 — 왼쪽 끝을 0 으로 고정한 합만 담으면 어떨까",
    },
    {
      name: "누적합 배열",
      idea: "왼쪽 끝을 0 으로 고정한 합을 n + 1 칸에 담고, 질의마다 두 칸의 차로 답한다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `맞다 · 덧셈 ${ops.adds} 번과 뺄셈 ${ops.subs} 번`,
          ok: true,
        },
        {
          label: "시간 · 메모리",
          value: `n = q = ${num(N_MAX)} 에서 연산 ${num(2 * N_MAX)} 번 · 칸 ${num(N_MAX + 1)} 개`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 인덱스 · `A` · `P` 세 줄 — 누적합 배열이 입력 배열과 어떻게 줄을 맞추는지. */
function plainRows(P: readonly number[], readP: readonly number[] = []) {
  const states: Partial<Record<number, CellState>> = {};
  for (const i of readP) states[i] = "read";
  const rows: StageRow[] = [
    { kind: "index", label: "인덱스" },
    {
      kind: "cells",
      label: "A",
      values: [...WALK],
      side: `칸 ${WALK.length} 개`,
    },
    {
      kind: "cells",
      label: "P",
      values: [...P],
      states,
      side: `칸 ${P.length} 개`,
    },
    { kind: "caret", cells: [...readP] },
  ];
  return rows;
}

/** 전체 컨셉의 질의 — 양 끝이 배열 안쪽인 첫 질의. */
export const CONCEPT_Q: Query = WALK_Q[0] as Query;
/** 「아이디어 상세」 3단계가 그리는 질의 — 오른쪽 끝이 배열의 마지막인 질의. */
export const CANCEL_Q: Query = WALK_Q[4] as Query;

export const FIGS: Record<string, () => ReactElement> = {
  "concept-prefix": () => {
    const t = trace(WALK, WALK_Q);
    const [l, r] = CONCEPT_Q;
    const a = t.answers[0] as Answer;
    return (
      <CellStageFilm
        title={`A = [${WALK.join(", ")}] 과 누적합 배열 P`}
        columns={WALK.length + 1}
        frames={[
          {
            id: "P",
            text: `P 의 칸 i 는 A 의 앞 i 칸의 합 — 칸이 ${t.P.length} 개로 A 보다 하나 많다`,
            rows: plainRows(t.P),
          },
          {
            id: `[${l},${r}]`,
            text: `구간 [${l},${r}] 의 합 = P[${r + 1}] − P[${l}] = ${a.right} − ${a.left} = ${a.value}`,
            rows: arrayStage(
              {
                array: [...WALK],
                range: [l, r],
                layers: [{ name: "P", values: [...t.P], read: [l, r + 1] }],
              },
              ARRAY_OPTIONS,
            ),
          },
        ]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`n · q 최대 ${num(N_MAX)} · 1 초(단순 연산 1 초에 1 억 번 기준) · 256 MB`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "concept-cover": () => {
    const t = trace(WALK, WALK_Q);
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      { kind: "cells", label: "A", values: [...WALK] },
    ];
    for (let k = 1; k < t.P.length; k++) {
      rows.push({
        kind: "bracket",
        label: `P[${k}]`,
        from: 0,
        to: k - 1,
        tone: "left",
        text: `앞 ${k} 칸 = ${t.P[k]}`,
      });
    }
    rows.push({
      kind: "cells",
      label: "P",
      values: [...t.P],
      side: "P[0] = 0 은 앞 0 칸 — 덮는 칸이 없다",
    });
    return (
      <CellStage
        title="누적합 배열의 칸마다 덮는 앞부분"
        rows={rows}
        columns={t.P.length}
      />
    );
  },
  "build-cancel": () => {
    const t = trace(WALK, WALK_Q);
    const [l, r] = CANCEL_Q;
    const a = t.answers.find((x) => x.l === l && x.r === r) as Answer;
    const states: Partial<Record<number, CellState>> = {};
    for (const i of range(0, l - 1)) states[i] = "overlap";
    const pStates: Partial<Record<number, CellState>> = {
      [l]: "read",
      [r + 1]: "read",
    };
    const rows: StageRow[] = [
      {
        kind: "bracket",
        label: "질의",
        from: l,
        to: r,
        tone: "query",
        text: `[${l},${r}] = ${a.value}`,
      },
      { kind: "index", label: "인덱스" },
      {
        kind: "cells",
        label: "A",
        values: [...WALK],
        states,
        side: `두 칸이 함께 덮는 칸 ${l} 개`,
      },
      {
        kind: "bracket",
        label: `P[${r + 1}]`,
        from: 0,
        to: r,
        tone: "left",
        text: `앞 ${r + 1} 칸 = ${a.right}`,
      },
      {
        kind: "bracket",
        label: `P[${l}]`,
        from: 0,
        to: l - 1,
        tone: "right",
        text: `앞 ${l} 칸 = ${a.left}`,
      },
      {
        kind: "cells",
        label: "P",
        values: [...t.P],
        states: pStates,
        side: `${a.right} − ${a.left} = ${a.value}`,
      },
      { kind: "caret", cells: [l, r + 1] },
    ];
    return (
      <CellStage
        title={`질의 [${l},${r}] — 두 칸이 함께 덮는 앞부분이 뺄셈에서 지워진다`}
        rows={rows}
        columns={t.P.length}
      />
    );
  },
  "walk-run": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.calc.expr} = ${s.calc.result}`,
      rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`prefixSumRangeQuery([${WALK.join(", ")}], 질의 ${WALK_Q.length} 개) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(steps[0] as Step))}
        frames={frames}
      />
    );
  },
};
