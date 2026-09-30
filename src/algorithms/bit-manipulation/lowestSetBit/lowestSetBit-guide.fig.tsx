/**
 * `lowestSetBit-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 정본은 `x & -x` 한 줄이라 뒤집은 값과
 * 자리올림을 내보내지 않으므로, 증명 사이드카의 `addOne`(`~x` 에 1 을 자리마다 더하는 사본)이 걸음 값을
 * 내고 그 결과가 정본의 `-x` · 답과 같은지를 그 자리에서 확인한다. 걸음 재생 패널의 걸음
 * (`simStepsFromRef`)도 같은 걸음에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `lowestSetBit-guide.test.ts` 가 잰다.
 *
 * **자리의 좌우.** 정적 그림(`CellStage`)은 이진 표기처럼 높은 자리를 왼쪽에 둔다(인덱스 줄에 자리 번호를
 * 적는다). 걸음 재생 패널의 배열 무대는 칸 번호가 곧 자리 번호라 칸 `j` 가 자리 `j` 이고, 그래서 이진
 * 표기와 좌우가 거꾸로다 — 같은 갈래의 `binaryGap` 과 같은 약속이다.
 */

import type { ReactElement } from "react";
import { josa, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
  type ArrayLayer,
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import {
  addOne,
  bin,
  bitAt,
  CALLS,
  INT32_MIN,
  nu,
  num,
  opsOf,
  REF_OPS,
  scanOps,
  seconds,
  W,
  WALK,
  WIDTH,
  walkPlan,
} from "./lowestSetBit-guide.proof.ts";
import { lowestSetBit } from "./lowestSetBit-guide.ref.ts";

export { WALK };

/** 높은 자리부터의 비트 — 정적 그림의 칸 `c` 가 자리 `W - 1 - c` 다. */
const bitsHigh = (v: number): number[] =>
  Array.from({ length: W }, (_, c) => bitAt(v, W - 1 - c));

/** 낮은 자리부터의 비트 — 배열 무대의 칸 `j` 가 자리 `j` 다. */
const bitsLow = (v: number): number[] =>
  Array.from({ length: W }, (_, j) => bitAt(v, j));

/** 자리 `j` 가 정적 그림에서 서는 칸. */
const colOf = (j: number): number => W - 1 - j;

/** 정적 그림의 인덱스 줄 — 자리 번호를 높은 것부터 적는다. */
const HIGH_INDEX: StageRow = {
  kind: "index",
  label: "자리",
  labels: Array.from({ length: W }, (_, c) => W - 1 - c),
};

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, k) => from + k);

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

export function approaches(): Approach[] {
  const worst = scanOps(INT32_MIN) * CALLS;
  const x = WALK;
  const clear = x & (x - 1);
  const fixed = x ^ (x & (x - 1));
  const ans = lowestSetBit(x);
  if (fixed !== ans) throw new Error("지운 값을 덜어 낸 값이 정본과 다르다");
  return [
    {
      name: "자리마다 검사",
      idea: "자리 0 부터 차례로 1 인지 보고, 처음 만난 자리의 값을 돌려준다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `p = 31 만 N 번 — 기본 연산 ${num(worst)} 번 · ${seconds(worst)}`,
          ok: false,
        },
      ],
      lesson:
        "자리 p 아래가 0 이라는 것을 한 자리씩 확인한다 — 그 구간을 한 번에 건드리는 산술이 있을까",
    },
    {
      name: "x & (x - 1)",
      idea: "1 을 빼면 자리 p 와 그 아래가 한꺼번에 뒤집힌다. 그것을 x 와 AND 한다",
      verdict: "drop",
      checks: [
        { label: "연산", value: `${opsOf("x & (x - 1)")} 번`, ok: true },
        {
          label: "답",
          value: `x = ${x} 에서 ${clear} — 자리 p 를 지운 값이다`,
          ok: false,
        },
      ],
      lesson: "남길 자리를 지웠다 — 지운 값을 x 에서 덜어 내면 어떨까",
    },
    {
      name: "x ^ (x & (x - 1))",
      idea: "자리 p 를 지운 값을 x 와 XOR 해서 지워진 자리 하나만 되살린다",
      verdict: "drop",
      checks: [
        { label: "답", value: `x = ${x} 에서 ${fixed} — 맞다`, ok: true },
        {
          label: "연산",
          value: `${opsOf("x ^ (x & (x - 1))")} 번 — 연산이 하나 더 든다`,
          ok: false,
        },
      ],
      lesson:
        "x - 1 이 그대로 둔 위 자리까지 뒤집어 두면 AND 하나로 끝난다 — 그 값이 ~(x - 1) = -x 다",
    },
    {
      name: "x & -x",
      idea: "-x 는 자리 p 와 그 아래가 x 와 같고 위가 반대다. x 와 AND 하면 자리 p 만 남는다",
      verdict: "keep",
      checks: [
        { label: "답", value: `x = ${x} 에서 ${ans} — 맞다`, ok: true },
        {
          label: "연산",
          value: `${REF_OPS} 번 · N 번이면 ${seconds(REF_OPS * CALLS)}`,
          ok: true,
        },
        { label: "칸", value: "입력 밖에 잡는 칸이 없다", ok: true },
      ],
    },
  ];
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly calc: { readonly expr: string; readonly result: string };
  readonly stage: ArrayStep;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "x",
  rangeLabel: "보는 자리",
};

export function walkSteps(x: number = WALK): Step[] {
  const plan = walkPlan(x);
  const add = addOne(x);
  const p = plan.p as number;
  const F = plan.flipped;
  const N = plan.negated;
  const A = plan.answer;
  const all = range(0, W - 1);
  const flipRow = bitsLow(F);
  const negRow = bitsLow(N);
  const andRow = bitsLow(A);
  let flipVals: (number | null)[] = Array(W).fill(null);
  const negVals: (number | null)[] = Array(W).fill(null);
  let andVals: (number | null)[] = Array(W).fill(null);
  const ones = range(0, W - 1).filter((j) => bitAt(x, j) === 1);
  const out: Step[] = [];
  const layers = (
    reads: [number[], number[], number[]],
    writes: [number[], number[], number[]],
  ): ArrayLayer[] => [
    { name: "~x", values: [...flipVals], read: reads[0], write: writes[0] },
    { name: "-x", values: [...negVals], read: reads[1], write: writes[1] },
    { name: "x & -x", values: [...andVals], read: reads[2], write: writes[2] },
  ];
  for (const s of plan.steps) {
    if (s.kind === "input") {
      out.push({
        id: s.id,
        title: `x = ${x}${을를(x)} 받는다`,
        detail: `x 의 아래 여덟 자리를 칸에 놓습니다. 칸 j 가 자리 j 라 이진 표기(${bin(x)})와 좌우가 거꾸로입니다. 1 인 자리는 자리 ${ones.join(" · ")} 이고, 최하위 1 비트는 자리 ${p} 입니다.`,
        calc: { expr: "x", result: `${x} = ${bin(x)}` },
        stage: {
          array: bitsLow(x),
          range: [0, W - 1],
          read: [],
          write: [],
          pointers: {},
          calc: { expr: "x", result: `${x} = ${bin(x)}` },
          vars: null,
          layers: layers([[], [], []], [[], [], []]),
        },
      });
      continue;
    }
    if (s.kind === "flip") {
      flipVals = [...flipRow];
      const calc = { expr: `~${x}`, result: `${F}` };
      out.push({
        id: s.id,
        title: "① 모든 자리를 뒤집는다",
        detail: `x 의 모든 자리를 뒤집어 ~x = ${F}${을를(F)} 만듭니다. 자리 ${p} 아래가 전부 1 이 되고 자리 ${p}${이가(p)} 0 이 됩니다. 그리지 않은 위 24 자리는 전부 ${bitAt(F, WIDTH - 1)} 입니다.`,
        calc,
        stage: {
          array: bitsLow(x),
          range: [0, W - 1],
          read: all,
          write: [],
          pointers: {},
          calc,
          vars: null,
          layers: layers([[], [], []], [all, [], []]),
        },
      });
      continue;
    }
    if (s.kind === "carry" && s.rec) {
      const r = s.rec;
      negVals[r.j] = r.out;
      const calc = {
        expr: `${r.flipBit} + ${r.carryIn}`,
        result: `${r.out}, 자리올림 ${r.carryOut}`,
      };
      const detail =
        r.carryOut === 1
          ? `자리 ${r.j} 의 ~x 비트 ${r.flipBit} 에 자리올림 ${r.carryIn}${을를(r.carryIn)} 더하면 ${r.flipBit + r.carryIn}${josa(r.flipBit + r.carryIn, "이라", "라")} 그 자리는 ${r.out}${이가(r.out)} 되고 자리올림 1 을 위로 넘깁니다.`
          : `자리 ${r.j} 의 ~x 비트 ${r.flipBit} 에 자리올림 ${r.carryIn}${을를(r.carryIn)} 더하면 ${r.flipBit + r.carryIn}${josa(r.flipBit + r.carryIn, "이라", "라")} 그 자리가 ${r.out}${이가(r.out)} 되고, 넘길 자리올림이 없어 여기서 멈춥니다. 자리 ${r.j}${은는(r.j)} x 의 최하위 1 비트 자리입니다.`;
      out.push({
        id: s.id,
        title: `② 자리 ${r.j} 에 1 을 더한다`,
        detail,
        calc,
        stage: {
          array: bitsLow(x),
          range: [0, r.j],
          rangeSide: `자리올림이 닿은 자리 ${r.j + 1} 칸`,
          read: [],
          write: [],
          pointers: { j: r.j },
          calc,
          vars: `자리올림 ${r.carryOut}`,
          layers: layers([[r.j], [], []], [[], [r.j], []]),
        },
      });
      continue;
    }
    if (s.kind === "rest") {
      const from = s.j as number;
      const rest = range(from, W - 1);
      for (const j of rest) negVals[j] = negRow[j] as number;
      if (add.recs.slice(from).some((r) => r.out !== r.flipBit))
        throw new Error("자리올림이 멈춘 뒤 자리가 바뀌었다");
      const calc = {
        expr: "자리올림 0",
        result: `자리 ${from} ~ ${WIDTH - 1} 은 ~x 그대로`,
      };
      out.push({
        id: s.id,
        title: `② 자리 ${from} 부터 위는 그대로 둔다`,
        detail: `자리올림이 0 이라 자리 ${from} 부터 위는 더할 것이 없어 ~x 의 비트가 그대로 -x 로 내려옵니다. 모은 값은 -x = ${N} 입니다.`,
        calc,
        stage: {
          array: bitsLow(x),
          range: [from, W - 1],
          rangeSide: `자리올림이 없는 자리 ${W - from} 칸`,
          read: [],
          write: [],
          pointers: {},
          calc,
          vars: "자리올림 0",
          layers: layers([rest, [], []], [[], rest, []]),
        },
      });
      continue;
    }
    if (s.kind === "and") {
      andVals = [...andRow];
      const both = range(0, W - 1).filter(
        (j) => bitAt(x, j) === 1 && bitAt(N, j) === 1,
      );
      const calc = { expr: `${x} & ${N}`, result: `${A}` };
      out.push({
        id: s.id,
        title: "③ x 와 -x 를 AND 한다",
        detail: `x 와 -x 를 자리마다 AND 합니다. 함께 1 인 자리는 자리 ${both.join(" · ")} 하나이고, 나머지 자리는 0 입니다.`,
        calc,
        stage: {
          array: bitsLow(x),
          range: [0, W - 1],
          read: all,
          write: [],
          pointers: {},
          calc,
          vars: null,
          layers: layers([[], all, []], [[], [], all]),
        },
      });
      continue;
    }
    const calc = { expr: "반환", result: `${A} = 2^${p}` };
    out.push({
      id: s.id,
      title: "③ 값을 돌려준다",
      detail: `자리 ${p} 하나만 남은 값 ${A}${을를(A)} 돌려줍니다.`,
      calc,
      stage: {
        array: bitsLow(x),
        range: [0, W - 1],
        read: [],
        write: [],
        pointers: { p },
        calc,
        vars: null,
        layers: layers([[], [], [p]], [[], [], []]),
      },
    });
  }
  if ((out.at(-1) as Step).calc.result !== `${lowestSetBit(x)} = 2^${p}`)
    throw new Error("마지막 걸음의 값이 정본의 답과 다르다");
  return out;
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `lowestSetBit-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    lowbitWalk: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-bits": () => {
    const x = WALK;
    const p = nu(x) as number;
    const r = lowestSetBit(x);
    const focus: Partial<Record<number, CellState>> = { [colOf(p)]: "focus" };
    const read: Partial<Record<number, CellState>> = { [colOf(p)]: "read" };
    const ones = range(0, W - 1)
      .filter((j) => bitAt(x, j) === 1)
      .reverse();
    const rows: StageRow[] = [
      HIGH_INDEX,
      {
        kind: "cells",
        label: `x = ${x}`,
        values: bitsHigh(x),
        states: read,
        side: `1 인 자리 ${ones.join(" · ")}`,
      },
      {
        kind: "cells",
        label: `~x = ${~x}`,
        values: bitsHigh(~x),
        side: "모든 자리를 뒤집은 값",
      },
      {
        kind: "cells",
        label: `-x = ${-x}`,
        values: bitsHigh(-x),
        states: read,
        side: "~x 에 1 을 더한 값",
      },
      {
        kind: "cells",
        label: `x & -x = ${r}`,
        values: bitsHigh(r),
        states: focus,
        side: `함께 1 인 자리 ${p} 하나`,
      },
    ];
    return (
      <CellStage
        title={`x = ${x} 의 아래 여덟 자리 — x 와 -x 가 함께 1 인 자리는 최하위 1 비트 자리 ${p} 하나`}
        rows={rows}
        columns={W}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`호출 N = ${num(CALLS)} 번 · 초당 단순 연산 1 억 번 기준 · 32 비트 정수`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-regions": () => {
    const x = WALK;
    const p = nu(x) as number;
    const rows: StageRow[] = [
      HIGH_INDEX,
      { kind: "cells", label: `x = ${x}`, values: bitsHigh(x) },
      {
        kind: "cells",
        label: `-x = ${-x}`,
        values: bitsHigh(-x),
        states: { [colOf(p)]: "focus" },
      },
      {
        kind: "bracket",
        label: "자리 p 위",
        from: colOf(W - 1),
        to: colOf(p + 1),
        tone: "right",
        text: "x 의 반대",
      },
      {
        kind: "bracket",
        label: "자리 p",
        from: colOf(p),
        to: colOf(p),
        tone: "make",
        text: "1",
      },
      {
        kind: "bracket",
        label: "자리 p 아래",
        from: colOf(p - 1),
        to: colOf(0),
        tone: "left",
        text: "0",
      },
    ];
    for (let j = 0; j < W; j++) {
      const want = j < p ? 0 : j === p ? 1 : 1 - bitAt(x, j);
      if (bitAt(-x, j) !== want)
        throw new Error(`자리 ${j} 가 세 구간 규칙을 어긴다`);
    }
    return (
      <CellStage
        title={`x = ${x} 에서 -x 의 세 구간 — 최하위 1 비트 자리 p = ${p} 를 경계로`}
        rows={rows}
        columns={W}
      />
    );
  },
  "walk-lowbit": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.calc.expr} → ${s.calc.result}`,
      rows: arrayStage(s.stage, ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`lowestSetBit(${WALK}) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns((steps[0] as Step).stage)}
        frames={frames}
      />
    );
  },
};
