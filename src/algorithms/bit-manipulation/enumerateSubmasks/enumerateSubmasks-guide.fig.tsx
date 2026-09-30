/**
 * `enumerateSubmasks-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 걸음 값은 증명 사이드카의 `trace`
 * — 정본과 같은 절차에 기록만 덧붙이고, 담은 값의 열이 정본의 반환값과 같은지 부를 때마다 확인하는
 * 사본 — 에서 받는다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의
 * 리터럴이 그것과 같은지는 `enumerateSubmasks-guide.test.ts` 가 잰다.
 *
 * 칸 무대는 **자리 0 을 왼쪽에** 둔다 — 칸 `i` 가 자리 `i` 의 비트라서 이진 표기와 좌우가 거꾸로다.
 * 그래서 줄 곁말에 십진값과 이진 표기를 함께 적어 두 순서를 맞대 볼 수 있게 한다.
 */

import type { ReactElement } from "react";
import { josa, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
import {
  bitAt,
  bits,
  num,
  onePlaces,
  packed,
  popcount,
  type Round,
  trace,
  trickLoops,
  WALK,
  WALK_WIDTH,
} from "./enumerateSubmasks-guide.proof.ts";
import { enumerateSubmasks } from "./enumerateSubmasks-guide.ref.ts";

/** 자리 0 부터의 비트 — 무대의 칸 `i` 가 자리 `i` 다. */
const bitsLow = (v: number, w: number = WALK_WIDTH): (0 | 1)[] =>
  Array.from({ length: w }, (_, i) => bitAt(v, i));

/** 칸 번호 0 … w − 1. */
const places = (w: number = WALK_WIDTH): number[] =>
  Array.from({ length: w }, (_, i) => i);

/** 곁말 — 십진값과 이진 표기. */
const both = (v: number): string => `${v} = ${bits(v, WALK_WIDTH)}`;

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

/** 과제의 상한. */
const LIMIT = 2 ** 20;

/** 최하위 1 비트만 지우는 후보가 내는 값의 개수. */
function clearLowestCount(mask: number): number {
  let count = 1;
  for (let sub = mask; sub > 0; sub &= sub - 1) count++;
  return count;
}

export function approaches(): Approach[] {
  const right = enumerateSubmasks(WALK).length;
  const cand = clearLowestCount(WALK);
  return [
    {
      name: "정수를 하나씩 검사하기",
      idea: "mask 부터 1 까지 정수마다 (candidate & mask) === candidate 를 검사한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `mask = ${num(LIMIT)} 에서 정수 ${num(LIMIT)} 개를 검사해 서브마스크 ${enumerateSubmasks(LIMIT).length} 개를 낸다`,
          ok: false,
        },
      ],
      lesson:
        "mask 밖 자리를 켠 정수까지 만든다 — 서브마스크에서 다음 서브마스크로 바로 가면 어떨까",
    },
    {
      name: "최하위 1 비트만 지우기",
      idea: "sub & (sub - 1) 로 1 비트를 하나씩 지운다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `mask = ${WALK} 에서 ${cand} 개만 낸다 · 서브마스크는 ${right} 개`,
          ok: false,
        },
      ],
      lesson:
        "내린 자리 아래를 다시 채우지 못한다 — 1 을 빼서 아래를 채우고 mask 로 거르면 어떨까",
    },
    {
      name: "1 을 빼고 거르기",
      idea: "(sub - 1) & mask 로 sub 미만의 가장 큰 서브마스크로 간다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `바퀴가 2^k − 1 번 · mask = ${num(LIMIT)} 에서 ${num(trickLoops(LIMIT))} 번, ${num(LIMIT - 1)} 에서 ${num(trickLoops(LIMIT - 1))} 번`,
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
  readonly stage: ArrayStep;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "mask",
  rangeLabel: "자리내림",
};

const EMPTY = (): null[] => Array.from({ length: WALK_WIDTH }, () => null);

/** 바퀴 하나의 무대 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
function roundStage(r: Round, mask: number): ArrayStep {
  const below = places(r.p + 1);
  return {
    array: bitsLow(mask),
    range: [0, r.p],
    read: [],
    write: [],
    pointers: {},
    calc: {
      expr: `(${r.sub} − 1) & ${mask}`,
      result: `${r.borrowed} & ${mask} = ${r.next}`,
    },
    vars: `subMasks = [${r.subMasks.join(", ")}]`,
    layers: [
      {
        name: "sub",
        values: bitsLow(r.sub),
        read: [r.p],
        side: both(r.sub),
      },
      {
        name: "borrowed",
        values: bitsLow(r.borrowed),
        write: below,
        side: both(r.borrowed),
      },
      {
        name: "next",
        values: bitsLow(r.next),
        write: r.cleared,
        side: both(r.next),
      },
    ],
  };
}

export function walkSteps(mask: number = WALK): Step[] {
  const t = trace(mask);
  const init: Step = {
    id: "T1",
    title: `sub = ${mask}`,
    detail: `mask ${mask}${을를(mask)} 결과의 첫 칸에 담고 sub 를 ${mask}${으로(mask)} 둡니다. 아직 바퀴에 들어가지 않았습니다.`,
    stage: {
      array: bitsLow(mask),
      range: null,
      read: [],
      write: [],
      pointers: {},
      calc: { expr: "subMasks = [mask]", result: `sub = ${mask}` },
      vars: `subMasks = [${mask}]`,
      layers: [
        {
          name: "sub",
          values: bitsLow(mask),
          write: places(),
          side: both(mask),
        },
        { name: "borrowed", values: EMPTY() },
        { name: "next", values: EMPTY() },
      ],
    },
  };
  const rounds = t.rounds.map((r): Step => {
    const fill =
      r.p === 0
        ? "최하위 1 비트가 자리 0 이라 1 을 빼면 그 자리만 0 이 됩니다."
        : `최하위 1 비트가 자리 ${r.p}${josa(r.p, "이라", "라")} 1 을 빼면 그 자리가 0 이 되고 ${r.p === 1 ? "자리 0" : `자리 0 ~ ${r.p - 1}`}${이가(r.p - 1)} 1 이 됩니다.`;
    const cut =
      r.cleared.length === 0
        ? `${r.borrowed}${은는(r.borrowed)} 이미 mask 안이라 AND 가 지우는 자리가 없습니다.`
        : `mask 에 없는 자리 ${r.cleared.join(" · ")}${을를(r.cleared.at(-1) as number)} AND 가 지워 ${r.next}${이가(r.next)} 남습니다.`;
    return {
      id: `T${r.t}`,
      title: `sub = ${r.sub}`,
      detail: `${fill} ${cut}`,
      stage: roundStage(r, mask),
    };
  });
  const end: Step = {
    id: `T${t.endT}`,
    title: "sub = 0",
    detail: `sub 가 0 이라 0 > 0 이 거짓입니다. 바퀴 ${t.rounds.length} 번으로 담은 값 ${t.answer.length} 개를 돌려줍니다.`,
    stage: {
      array: bitsLow(mask),
      range: null,
      read: [],
      write: [],
      pointers: {},
      calc: { expr: "0 > 0", result: "거짓 → subMasks 를 돌려준다" },
      vars: `subMasks = [${t.answer.join(", ")}]`,
      layers: [
        { name: "sub", values: bitsLow(0), read: places(), side: both(0) },
        { name: "borrowed", values: EMPTY() },
        { name: "next", values: EMPTY() },
      ],
    },
  };
  return [init, ...rounds, end];
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `enumerateSubmasks-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    submaskWalk: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-submasks": () => {
    const subs = enumerateSubmasks(WALK);
    const holes = places().filter((i) => bitAt(WALK, i) === 0);
    const out: Partial<Record<number, CellState>> = {};
    for (const i of holes) out[i] = "out";
    const rows: StageRow[] = [
      { kind: "index", label: "자리" },
      {
        kind: "cells",
        label: "mask",
        values: bitsLow(WALK),
        states: out,
        side: both(WALK),
      },
      ...subs.map(
        (s): StageRow => ({
          kind: "cells",
          label: String(s),
          values: bitsLow(s),
          states: out,
          side: bits(s, WALK_WIDTH),
        }),
      ),
    ];
    return (
      <CellStage
        title={`mask = ${bits(WALK, WALK_WIDTH)} 의 서브마스크 ${subs.length} 개 — 칸 i 가 자리 i, mask 에 없는 자리 ${holes.join(" · ")}${은는(holes.at(-1) as number)} 모두 0`}
        rows={rows}
        columns={WALK_WIDTH}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`0 ≤ mask ≤ ${num(LIMIT)} · 1 비트 개수 k 가 작은 마스크도 섞여 들어온다`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-counter": () => {
    const subs = enumerateSubmasks(WALK);
    const ones = onePlaces(WALK);
    const k = popcount(WALK);
    const rows: StageRow[] = [
      {
        kind: "index",
        label: "자리",
        labels: ones,
      },
      ...subs.map(
        (s, j): StageRow => ({
          kind: "cells",
          label: String(s),
          values: ones.map((i) => bitAt(s, i)),
          // 앞 줄과 비트가 달라진 칸 — 1 씩 줄어드는 셈에서 바뀐 자리다.
          states: Object.fromEntries(
            ones.flatMap((i, c) =>
              j > 0 && bitAt(s, i) !== bitAt(subs[j - 1] as number, i)
                ? [[c, "focus" as CellState]]
                : [],
            ),
          ),
          side: `떼어 읽은 값 ${packed(s, WALK)} = ${bits(packed(s, WALK), k)}`,
        }),
      ),
    ];
    return (
      <CellStage
        title={`mask 의 1 자리 ${ones.join(" · ")} 만 떼어 놓으면 서브마스크가 ${packed(subs[0] as number, WALK)} 부터 0 까지 1 씩 줄어드는 ${k} 자리 수다`}
        rows={rows}
        columns={ones.length}
      />
    );
  },
  "walk-submasks": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.stage.calc?.expr} → ${s.stage.calc?.result}`,
      rows: arrayStage(s.stage, ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`enumerateSubmasks(${WALK}) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns((steps[0] as Step).stage)}
        frames={frames}
      />
    );
  },
};
