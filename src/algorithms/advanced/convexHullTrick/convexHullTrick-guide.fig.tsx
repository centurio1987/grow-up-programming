/**
 * `convexHullTrick-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 아래 껍질과 답은 정본(`-guide.ref.ts`)이 낸 것이고, 전개의
 * 걸음마다 읽고 빼고 넣은 칸은 정본과 같은 절차를 걸음마다 적은 사본(`-guide.proof.ts` 의 `walkSteps`)이
 * 낸다. 그 사본은 직선 하나를 넣을 때마다 정본의 `hull` 과, 질의마다 정본의 답과 스스로 대조한다.
 *
 * **직선과 아래 껍질은 평면 그림(`LineEnvelope`)으로 그린다.** 직선마다 상태를 주고(버린 직선은 대시),
 * 아래 껍질의 꺾은 점은 정본이 남긴 직선의 이웃 교점에서 받는다. **남은 직선의 목록은 스택 띠다** —
 * 아래 껍질은 뒤에서만 넣고 빼므로 칸 줄의 왼쪽이 바닥, 오른쪽이 꼭대기이고(`nextGreaterElement` 의 스택
 * 띠 약속), 비교한 두 칸은 읽음, 넣은 칸은 새로 씀이다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`simStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `convexHullTrick-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { 을를 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  CellStageFilm,
  type StageFrame,
  type StageRow,
} from "../../../_viz/patterns/CellStage";
import { LineEnvelope } from "../../../_viz/patterns/LineEnvelope";
import { NodeGraph } from "../../../_viz/patterns/NodeGraph";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { countHull, countScan } from "./convexHullTrick-guide.alt.ts";
import {
  brute,
  build,
  CHAIN,
  CONCEPT_X,
  convex,
  crossings,
  envelopePoints,
  hullText,
  ln,
  lowerChain,
  N_MAX,
  num,
  queriesOf,
  SMALL,
  SMALL_X,
  seconds,
  stepCall,
  stepText,
  WALK,
  type WalkStep,
  walkSteps,
} from "./convexHullTrick-guide.proof.ts";
import { evalAt, type Line } from "./convexHullTrick-guide.ref.ts";

/* ───────────────── 평면 그림의 공통 ───────────────── */

const X_TICKS = [-8, -6, -4, -2, 0, 2, 4, 6];
const Y_RANGE: [number, number] = [-12, 14];
const Y_TICKS = [-12, -8, -4, 0, 4, 8, 12];

/** 교점 좌표를 짧게 — 정수면 정수, 아니면 소수. */
const short = (v: number): string =>
  Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);

/** 이웃 교점 `X_k` 의 세로선 — 좌표 범위 안의 것만. */
const crossMarks = (h: readonly Line[]) =>
  crossings(h)
    .map((x, k) => ({ x, label: `X_${k} = ${short(x)}` }))
    .filter((m) => m.x > SMALL_X[0] && m.x < SMALL_X[1]);

/* ───────────────── 전개 — 걸음 재생 패널과 필름이 같은 기록을 쓴다 ───────────────── */

const STEPS = walkSteps();
/** 스택 띠의 칸 수 — 전개에서 아래 껍질이 가장 길었을 때. */
const SLOTS = Math.max(...STEPS.map((s) => s.after.length));

/** 칸 하나가 격자 두 칸 폭을 덮는다 — 직선 이름 `(-2, 0)` 이 기본 칸 폭에 안 들어간다. */
const SPAN = 2;

const pad = <T,>(xs: readonly T[], n: number): (T | null)[] =>
  Array.from({ length: n }, (_, i) => (i < xs.length ? (xs[i] as T) : null));

/** 입력 자리 — 전개 입력의 직선은 서로 다르다. */
const inputAt = (l: Line): number =>
  WALK.findIndex(([m, b]) => m === l.m && b === l.b);

/** 걸음 `upTo` 까지 버린 직선의 입력 자리 — 새 직선을 버렸거나(①) 꼭대기에서 뺐다(②·③). */
function droppedUpTo(upTo: number): number[] {
  const out: number[] = [];
  for (const s of STEPS.slice(0, upTo + 1)) {
    if (s.branch === "①" && s.line !== null) out.push(s.line);
    if (s.branch === "②" || s.branch === "③")
      out.push(inputAt(s.before.at(-1) as Line));
  }
  return out;
}

/** 걸음 하나의 계산 알약. */
function calcOf(s: WalkStep): { expr: string; result: string } {
  const tf = s.truth ? "참" : "거짓";
  switch (s.branch) {
    case "①":
      return { expr: s.cond, result: `${tf} · 새 직선을 버린다` };
    case "②":
      return { expr: s.cond, result: `${tf} · 꼭대기를 뺀다` };
    case "③":
      return { expr: `isCovered: ${s.cond}`, result: `${tf} · 꼭대기를 뺀다` };
    case "④":
      return s.read.length > 0
        ? { expr: `isCovered: ${s.cond}`, result: `${tf} · 뒤에 붙인다` }
        : { expr: s.cond, result: `${tf} · 뒤에 붙인다` };
    case "⑤":
      return { expr: s.cond, result: `${tf} · hi = ${s.nextHi}` };
    case "⑥":
      return { expr: s.cond, result: `${tf} · lo = ${s.nextLo}` };
    case "⑦":
      return { expr: `${s.lo} < ${s.hi}`, result: `거짓 · 답 ${s.answer}` };
  }
}

/**
 * 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로. 맨 위 줄은 등록할 직선을 입력 차례로 늘어놓은 것이고
 * (쥔 구간은 지금까지 읽은 직선, 버린 직선은 대시, 아직 읽지 않은 직선은 점선), 그 아래 스택 띠가 걸음 **뒤**의 아래 껍질, 맨 아래가
 * 질의 자리에서 아래 껍질의 값이다. 뺀 칸은 걸음 뒤에 없으므로 점선으로 남는다.
 */
export function arrayStep(s: WalkStep, index: number): ArrayStep {
  const upto = s.line ?? WALK.length - 1;
  const add = s.line !== null;
  const top = s.after.at(-1);
  const valuesAt =
    s.x === null
      ? pad([], SLOTS)
      : pad(
          s.after.map((l) => evalAt(l, s.x as number)),
          SLOTS,
        );
  const hullRead = add ? s.read.filter((k) => k < s.after.length) : [...s.read];
  return {
    array: WALK.map(ln),
    range: [0, upto],
    read: add ? [s.line as number] : [],
    write: [],
    out: droppedUpTo(index).filter((i) => i !== s.line),
    // 아직 읽지 않은 직선은 「아직」(점선) — 버린 직선(대시)과 가른다.
    later: WALK.map((_, i) => i).filter((i) => i > upto),
    layers: [
      {
        name: "hull",
        values: pad(s.after.map(ln), SLOTS),
        read: hullRead,
        write: [...s.write],
        side: add
          ? top === undefined
            ? "비었다"
            : `꼭대기 = ${ln(top)}`
          : s.branch === "⑦"
            ? `lo = hi = ${s.lo}`
            : `후보 [${s.lo},${s.hi}] · mid = ${s.mid}`,
        span: SPAN,
      },
      {
        name: "x 에서의 값",
        values: valuesAt,
        read: add ? [] : [...s.read],
        write: [],
        side: add ? "질의 전" : `x = ${s.x}`,
        span: SPAN,
      },
    ],
    calc: calcOf(s),
    vars: null,
    span: SPAN,
  };
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "등록",
  rangeLabel: "읽은 직선",
};

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본과 대조하는 기록에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `convexHullTrick-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return STEPS.map((s, i) => ({
    title: `${s.id} ${stepCall(s)} ${s.branch}`,
    text: stepText(s),
    ...arrayStep(s, i),
  }));
}

const walkFilm = (): StageFrame[] =>
  STEPS.map((s, i) => ({
    id: s.id,
    text: `${stepCall(s)} ${s.branch} — ${calcOf(s).expr} → ${calcOf(s).result}`,
    rows: arrayStage(arrayStep(s, i), ARRAY_OPTIONS),
  }));

/* ───────────────── 3단계 — 한 번의 등록이 여럿을 빼는 걸음 ───────────────── */

/** 연쇄 입력의 마지막 직선 — 이것 하나가 꼭대기를 연달아 뺀다. */
const NEW = CHAIN[CHAIN.length - 1] as [number, number];

function popFilm(): { frames: StageFrame[]; columns: number } {
  const steps = walkSteps(CHAIN, []).filter((s) => s.line === CHAIN.length - 1);
  const columns = Math.max(...steps.map((s) => s.before.length + 1));
  const frames = steps.map((s, i) => {
    const states: Partial<Record<number, CellState>> = {};
    for (const k of s.read) states[k] = "read";
    const shown = s.branch === "④" ? s.after : s.before;
    for (const k of s.write) states[k] = "focus";
    const rows: StageRow[] = [
      { kind: "index", label: "자리", focus: [...s.write], span: SPAN },
      {
        kind: "cells",
        label: "hull",
        values: pad(shown.map(ln), columns),
        states,
        span: SPAN,
        side:
          s.branch === "③"
            ? `${s.cond} → 참 · 꼭대기를 뺀다`
            : `${ln(NEW)}${을를(NEW[1])} 붙인다`,
      },
      { kind: "caret", cells: [...s.read], span: SPAN },
    ];
    return { id: `${i + 1}`, text: stepText(s, CHAIN), rows };
  });
  return { frames, columns: columns * SPAN };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

function approaches(): Approach[] {
  const naive = 5 * N_MAX * N_MAX + 2 * N_MAX;
  const c = countHull(convex(N_MAX), queriesOf(N_MAX));
  const total = c.addOps + c.queryOps;
  const best = SMALL.reduce((acc, l) => (l[1] < acc[1] ? l : acc));
  const x = SMALL_X[0];
  const small = countScan(SMALL, [x]);
  return [
    {
      name: "직선 전부 계산하기",
      idea: "질의마다 등록한 직선을 전부 계산해 가장 작은 값을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `기본 연산 ${num(naive)} 번(어림) · ${seconds(naive)}`,
          ok: false,
        },
      ],
      lesson:
        "작은 입력에서 직선 하나는 어느 자리에서도 가장 낮지 않았다 — 계산할 직선을 줄일 수 있지 않을까",
    },
    {
      name: "절편이 가장 작은 직선 하나만 남기기",
      idea: "x = 0 에서 가장 낮은 직선이 다른 자리에서도 가장 낮으리라고 본다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `x = ${x} 에서 ${best[0] * x + best[1]} · 실제 최솟값 ${small.answers[0]}`,
          ok: false,
        },
      ],
      lesson:
        "자리가 바뀌면 가장 낮은 직선도 바뀐다 — 직선마다 가장 낮은 자리의 구간을 보고, 그 구간이 빈 직선만 버리자",
    },
    {
      name: "담당 구간이 있는 직선만 전부 계산하기",
      idea: "어디서도 가장 낮지 않은 직선을 버리고 남은 직선만 계산한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `b = m² 이면 하나도 안 버려져 ${num(naive)} 번(어림) 그대로`,
          ok: false,
        },
      ],
      lesson:
        "남은 직선은 기울기 차례로 담당 구간이 이어진다 — 한 자리의 직선을 절반씩 좁혀 찾을 수 있다",
    },
    {
      name: "아래 껍질 이진 탐색",
      idea: "남은 직선을 기울기 차례로 두고, 질의 자리의 직선을 이진 탐색으로 찾는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `b = m² 에서 기본 연산 ${num(total)} 번(센 값) · ${seconds(total)}`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 「알아 두면 좋은 개념」 — 점 (m, b) 의 아래 사슬 ───────────────── */

/** 평면 한 칸의 픽셀 — 가로 · 세로가 같아야 사슬의 꺾임이 그림에서도 맞다. */
const PLANE_UNIT = { x: 72, y: 36 } as const;

function dualScene() {
  const chain = lowerChain(SMALL);
  const onChain = (p: [number, number]) =>
    chain.some((q) => q[0] === p[0] && q[1] === p[1]);
  const YMAX = Math.max(...SMALL.map((p) => p[1]));
  const nodes = SMALL.map((p, id) => ({
    id,
    x: p[0],
    y: (YMAX - p[1]) / 2,
    label: ln(p),
    value: onChain(p) ? "아래 사슬" : "사슬 밖",
    state: onChain(p) ? undefined : ("out" as const),
  }));
  const idOf = (p: [number, number]) =>
    SMALL.findIndex((q) => q[0] === p[0] && q[1] === p[1]);
  const edges = chain.slice(1).map((p, i) => ({
    from: idOf(chain[i] as [number, number]),
    to: idOf(p),
    kind: "tree" as const,
  }));
  return { nodes, edges };
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-envelope": () => {
    const h = build(SMALL).hull;
    const kept = (m: number, b: number) =>
      h.some((l) => l.m === m && l.b === b);
    const low = brute(SMALL, CONCEPT_X);
    return (
      <LineEnvelope
        title={`직선 ${SMALL.length} 개와 아래 껍질 — 대시 직선은 어느 자리에서도 가장 낮지 않다`}
        xRange={SMALL_X}
        yRange={Y_RANGE}
        xTicks={X_TICKS}
        yTicks={Y_TICKS}
        unitX={44}
        unitY={10}
        lines={SMALL.map(([m, b]) => ({
          m,
          b,
          label: kept(m, b) ? ln([m, b]) : `${ln([m, b])} 버림`,
          ...(kept(m, b) ? {} : { state: "out" as const, labelX: 2 }),
        }))}
        envelope={envelopePoints(h, SMALL_X[0], SMALL_X[1])}
        marks={crossMarks(h)}
        points={[{ x: CONCEPT_X, y: low, label: `x = ${CONCEPT_X} → ${low}` }]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`직선 ${num(N_MAX)} 개 · 질의 ${num(N_MAX)} 번 · 1 초(기본 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-cover": () => {
    const h = build(SMALL).hull;
    const cross = crossings(h);
    const mid = (k: number): number => {
      const lo = k === h.length - 1 ? SMALL_X[0] : (cross[k] as number);
      const hi = k === 0 ? SMALL_X[1] : (cross[k - 1] as number);
      return (lo + hi) / 2 - 1;
    };
    return (
      <LineEnvelope
        title="아래 껍질의 직선마다 담당 구간 — 자리가 뒤로 갈수록 담당 구간이 왼쪽으로 간다"
        xRange={SMALL_X}
        yRange={Y_RANGE}
        xTicks={X_TICKS}
        yTicks={Y_TICKS}
        unitX={44}
        unitY={10}
        lines={h.map((l, k) => ({
          m: l.m,
          b: l.b,
          label: `hull[${k}] ${ln(l)}`,
          labelX: mid(k),
        }))}
        envelope={envelopePoints(h, SMALL_X[0], SMALL_X[1])}
        marks={crossMarks(h)}
        spans={h.map((_, k) => ({
          from: k === h.length - 1 ? SMALL_X[0] : (cross[k] as number),
          to: k === 0 ? SMALL_X[1] : (cross[k - 1] as number),
          label: `hull[${k}]`,
        }))}
      />
    );
  },
  "build-pop-film": () => {
    const { frames, columns } = popFilm();
    return (
      <CellStageFilm
        title={`${ln(NEW)} 하나를 넣는 동안의 스택 띠 — 꼭대기는 오른쪽 끝`}
        columns={columns}
        frames={frames}
      />
    );
  },
  "walk-hull": () => {
    const film = walkFilm();
    const cols = Math.max(
      ...STEPS.map((s, i) => arrayColumns(arrayStep(s, i))),
    );
    return (
      <CellStageFilm
        title={`직선 ${WALK.length} 개를 넣고 세 자리를 묻는다 — ${film[0]?.id}~${film.at(-1)?.id} · 끝난 아래 껍질 ${hullText(STEPS.at(-1)?.after ?? [])}`}
        columns={cols}
        frames={film}
      />
    );
  },
  "related-dual": () => {
    const { nodes, edges } = dualScene();
    return (
      <NodeGraph
        title="직선 (m, b) 를 점으로 — 굵은 선이 점들의 아래 사슬이고 아래 껍질의 직선과 같다"
        directed={false}
        unit={PLANE_UNIT}
        nodes={nodes}
        edges={edges}
      />
    );
  },
};
