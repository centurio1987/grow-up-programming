/**
 * `meetInTheMiddleSubsetSum-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 부분집합 합 목록은 정본의
 * `subsetSums` 가 만들고, 이진 탐색이 읽은 칸은 정본 소스에서 기계로 만든 계측 사본(`probed`)이
 * 기록한다. 그 기록이 증명 사이드카의 `queryRecord` 와 같은지는 이 파일을 읽을 때 잰다 — 다르면
 * 그림과 본문 표가 서로 다른 실행을 보이는 것이다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은
 * 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는 `meetInTheMiddleSubsetSum-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
import { RangeCover } from "../../../_viz/patterns/RangeCover";
import {
  type ArrayLayer,
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import {
  cellCount,
  comma,
  N_LIMIT,
  naiveOps,
  opsBound,
  queryRecord,
  seconds,
  WALK,
  WALK_TARGET,
} from "./meetInTheMiddleSubsetSum-guide.proof.ts";
import {
  meetInTheMiddleSubsetSum,
  subsetSums,
} from "./meetInTheMiddleSubsetSum-guide.ref.ts";

const REF = new URL("./meetInTheMiddleSubsetSum-guide.ref.ts", import.meta.url)
  .pathname;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 이진 탐색이 가운데 칸을 읽는 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에
 * 정확히 맞지 않으면 `loadMutant` 가 던진다.
 */
const probed = await loadMutant<{
  meetInTheMiddleSubsetSum(nums: number[], target: number): boolean;
}>(REF, {
  swap: [
    /^(\s*)const v = sorted\[mid\] as number;$/,
    "$1const v = sorted[mid] as number;\n$1(globalThis as any).__probes.push({ lo, hi, mid, v, value });",
  ],
});

interface RefProbe {
  readonly lo: number;
  readonly hi: number;
  readonly mid: number;
  readonly v: number;
  readonly value: number;
}

/** 정본 한 번 호출에서 이진 탐색이 읽은 칸 전부. 답은 정본과 대조한다. */
function traceRef(nums: number[], target: number): RefProbe[] {
  const g = globalThis as unknown as { __probes: RefProbe[] };
  g.__probes = [];
  const got = probed.meetInTheMiddleSubsetSum([...nums], target);
  if (got !== meetInTheMiddleSubsetSum([...nums], target)) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  return g.__probes;
}

const MID = WALK.length >> 1;
const LIST_A = [...subsetSums(WALK, 0, MID)];
const LIST_B = [...subsetSums(WALK, MID, WALK.length)];
const SORTED_B = (() => {
  const b = subsetSums(WALK, MID, WALK.length);
  b.sort();
  return [...b];
})();
const REC = queryRecord(WALK, WALK_TARGET);

// 계측 사본의 기록과 증명 사이드카의 기록이 칸 하나까지 같은지 본다.
{
  const ref = traceRef(WALK, WALK_TARGET);
  const mine = REC.queries.flatMap((q) =>
    q.probes.map((p) => ({ lo: p.from[0], hi: p.from[1], mid: p.mid })),
  );
  const a = ref.map((p) => `${p.lo},${p.hi},${p.mid}`).join(" ");
  const b = mine.map((p) => `${p.lo},${p.hi},${p.mid}`).join(" ");
  if (a !== b) {
    throw new Error(`정본 계측과 증명 사이드카의 기록이 다르다 — ${a} ≠ ${b}`);
  }
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface WalkStep extends ArrayStep {
  readonly id: string;
  readonly head: string;
  readonly text: string;
}

const filled = (xs: readonly number[], upto: number): (number | null)[] =>
  xs.map((x, j) => (j < upto ? x : null));
const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

function layer(
  name: string,
  values: readonly (number | null)[],
  extra: Partial<ArrayLayer> = {},
): ArrayLayer {
  return { name, values, ...extra };
}

/** 전개 입력의 걸음 T1~T12. 부분집합 합 목록은 정본이, 읽은 칸은 정본 계측이 낸다. */
function walkSteps(): WalkStep[] {
  const steps: WalkStep[] = [];
  const noneA = filled(LIST_A, 0);
  const noneB = filled(LIST_B, 0);
  const front = WALK.slice(0, MID);
  const back = WALK.slice(MID);
  steps.push({
    id: "T1",
    head: "앞 무리 · 뒤 무리",
    text: `원소가 ${WALK.length} 개라 ⑥ mid = ${WALK.length} >> 1 = ${MID} 입니다. 앞 무리는 칸 [0,${MID - 1}] 의 ${front.join(" · ")}, 뒤 무리는 칸 [${MID},${WALK.length - 1}] 의 ${back.join(" · ")} 입니다.`,
    array: [...WALK],
    range: [0, WALK.length - 1],
    rangeSide: `원소 ${WALK.length} 개`,
    pieces: [
      {
        label: "앞 무리",
        from: 0,
        to: MID - 1,
        tone: "left",
        text: `[0,${MID - 1}]`,
      },
      {
        label: "뒤 무리",
        from: MID,
        to: WALK.length - 1,
        tone: "right",
        text: `[${MID},${WALK.length - 1}]`,
      },
    ],
    layers: [layer("sumsA", noneA), layer("sumsB", noneB)],
    calc: { expr: `${WALK.length} >> 1`, result: String(MID) },
  });
  let size = 1;
  for (let i = 0; i < MID; i++) {
    const a = WALK[i] as number;
    const read = range(0, size - 1);
    const write = range(size, 2 * size - 1);
    const now = [...subsetSums(WALK, 0, i + 1)];
    steps.push({
      id: `T${2 + i}`,
      head: `앞 무리에 ${a}`,
      text: `${i === 0 ? `① sumsA ${LIST_A.length} 칸을 잡으면 칸 0 에 공집합의 합 0 이 있습니다. ` : ""}② 칸 ${read.join(" · ")} 의 값에 ${a}${을를(a)} 더해 칸 ${write.join(" · ")} 에 적습니다. 채운 칸이 ${size} 칸에서 ${2 * size} 칸이 됩니다.`,
      array: [...WALK],
      range: [0, MID - 1],
      rangeSide: `앞 무리 ${MID} 개`,
      read: [i],
      layers: [
        layer("sumsA", filled(LIST_A, now.length), { read, write }),
        layer("sumsB", noneB),
      ],
      calc: {
        expr: read.map((j) => `${now[j]} + ${a}`).join(" · "),
        result: write.map((j) => String(now[j])).join(" · "),
      },
    });
    size <<= 1;
  }
  steps.push({
    id: `T${2 + MID}`,
    head: "sumsB 만들기",
    text: `① sumsB ${LIST_B.length} 칸을 잡고 ② 같은 방법으로 ${back.join(" · ")}${을를(back[back.length - 1] as number)} 차례로 더합니다. 덧셈 ${LIST_B.length - 1} 번으로 칸 1 부터 ${LIST_B.length - 1} 까지가 찹니다.`,
    array: [...WALK],
    range: [MID, WALK.length - 1],
    rangeSide: `뒤 무리 ${WALK.length - MID} 개`,
    read: range(MID, WALK.length - 1),
    layers: [
      layer("sumsA", LIST_A),
      layer("sumsB", LIST_B, { write: range(1, LIST_B.length - 1) }),
    ],
  });
  const moved = SORTED_B.flatMap((v, j) => (v === LIST_B[j] ? [] : [j]));
  steps.push({
    id: `T${3 + MID}`,
    head: "sumsB 정렬",
    text: `⑦ sumsB 를 오름차순으로 정렬합니다. 값이 바뀐 칸은 ${moved.join(" · ")} 이고, sumsA 는 그대로 둡니다. 원소는 이제 쓰지 않습니다.`,
    array: [...WALK],
    range: null,
    rangeSide: "이제 쓰지 않음",
    layers: [
      layer("sumsA", LIST_A),
      layer("sumsB", SORTED_B, { write: moved }),
    ],
  });
  const ref = traceRef(WALK, WALK_TARGET);
  let at = 0;
  const mark = (v: number, need: number): string =>
    v === need ? "③" : v < need ? "④" : "⑤";
  for (const [qi, q] of REC.queries.entries()) {
    const probes = ref.slice(at, at + q.probes.length);
    at += q.probes.length;
    const reads = probes.map((p) => p.mid);
    const lines = probes.map((p) => {
      const m = mark(p.v, q.need);
      const cond =
        m === "③"
          ? `${p.v} === ${q.need}${이가(q.need)} 참`
          : `${p.v} < ${q.need}${이가(q.need)} ${m === "④" ? "참" : "거짓"}`;
      return `칸 ${p.mid} 의 ${p.v} — ${cond} → ${m}`;
    });
    const last = q.probes[q.probes.length - 1];
    const end = q.found
      ? "찾는 값이 있습니다"
      : `lo = ${last?.lo} > hi = ${last?.hi}${josa(last?.hi ?? 0, "이라", "라")} 후보 구간이 비었습니다`;
    steps.push({
      id: `T${4 + MID + qi}`,
      head: `sA = ${q.sA} · need = ${q.need}`,
      text: `⑧ 앞 무리 칸 ${q.index} 의 합 ${q.sA} 에 모자란 값 need = ${WALK_TARGET} − ${q.sA} = ${q.need}${을를(q.need)} 묻습니다. ${lines.join(", ")}. ${end}.`,
      array: [...WALK],
      range: null,
      rangeSide: "이제 쓰지 않음",
      layers: [
        layer("sumsA", LIST_A, {
          read: [q.index],
          side: `질의 ${qi + 1} / ${LIST_A.length}`,
        }),
        layer("sumsB", SORTED_B, {
          read: q.found ? reads.slice(0, -1) : reads,
          write: q.found ? reads.slice(-1) : [],
          side: `읽은 칸 ${reads.join(" → ")}`,
          // 마지막 비교를 시작할 때의 후보 구간 — 적중이면 찾은 칸이 그 안에 있고, 아니면 이 구간이 비었다.
          range: {
            label: "마지막 후보",
            from: last?.from[0] ?? 0,
            to: last?.from[1] ?? 0,
          },
        }),
      ],
      calc: {
        expr: `need = ${WALK_TARGET} − ${q.sA}`,
        result: String(q.need),
      },
    });
  }
  const hit = REC.queries[REC.queries.length - 1];
  const hitAt = hit?.probes[hit.probes.length - 1]?.mid ?? -1;
  const skipped = LIST_A.slice((hit?.index ?? 0) + 1);
  steps.push({
    id: `T${4 + MID + REC.queries.length}`,
    head: `${REC.answer} 반환`,
    text: `앞 무리의 합 ${hit?.sA}${과와(hit?.sA ?? 0)} 뒤 무리의 합 ${hit?.need}${이가(hit?.need ?? 0)} 만나 ${WALK_TARGET} 입니다. 반환값은 ${REC.answer} 이고, 앞 무리의 합 ${skipped.join(" · ")}${은는(skipped[skipped.length - 1] ?? "")} 묻지 않습니다.`,
    array: [...WALK],
    range: null,
    rangeSide: "이제 쓰지 않음",
    layers: [
      layer("sumsA", LIST_A, { read: [hit?.index ?? -1] }),
      layer("sumsB", SORTED_B, { read: [hitAt] }),
    ],
    calc: {
      expr: `${hit?.sA} + ${hit?.need}`,
      result: String((hit?.sA ?? 0) + (hit?.need ?? 0)),
    },
  });
  return steps;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "nums",
  rangeLabel: "무리",
};

const stepOnly = (s: WalkStep): ArrayStep => {
  const { id: _id, head: _head, text: _text, ...rest } = s;
  return rest;
};

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `meetInTheMiddleSubsetSum-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return walkSteps().map((s) => ({
    title: `${s.id} ${s.head}`,
    text: s.text,
    ...stepOnly(s),
  }));
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

function approaches(): Approach[] {
  const k = N_LIMIT >> 1;
  const big = naiveOps(N_LIMIT);
  const pairs = 2 ** k * 2 ** (N_LIMIT - k);
  const bound = opsBound(N_LIMIT, k);
  return [
    {
      name: "부분집합을 하나씩 만들어 보기",
      idea: "2^n 개의 부분집합마다 합을 처음부터 더해 목표와 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `원소 ${N_LIMIT} 개에 기본 연산 ${comma(big)} 번 · 어림 ${seconds(big)}`,
          ok: false,
        },
      ],
      lesson:
        "앞 원소의 고르는 법이 같은 부분집합끼리 같은 합을 되풀이해 더한다 — 원소를 두 무리로 가르면 어떨까",
    },
    {
      name: "두 무리로 갈라 짝을 전부 보기",
      idea: "두 무리의 부분집합 합 목록을 만들고 앞 칸 · 뒤 칸의 짝마다 합을 목표와 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `원소 ${N_LIMIT} 개에 짝 ${comma(pairs)} 개 · 부분집합 수와 같다`,
          ok: false,
        },
      ],
      lesson:
        "앞 칸마다 필요한 것은 모자란 값 하나가 뒤 무리의 부분집합 합 목록에 있는가뿐이다 — 그 목록을 정렬해 두면 어떨까",
    },
    {
      name: "뒤 무리의 부분집합 합 목록을 정렬해 두고 모자란 값을 이진 탐색으로 묻기",
      idea: "sumsA 의 합 sA 마다 target − sA 가 정렬한 sumsB 에 있는지 이진 탐색한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `원소 ${N_LIMIT} 개에 기본 연산 상한 ${comma(bound)} 번 · 어림 ${seconds(bound)}`,
          ok: true,
        },
        {
          label: "메모리",
          value: `칸 ${comma(cellCount(N_LIMIT, k))} 개`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 부분집합 합 목록의 생김새 ───────────────── */

const bits = (j: number, m: number): string => j.toString(2).padStart(m, "0");

function listRows(): StageRow[] {
  const group = WALK.slice(0, MID);
  return [
    {
      kind: "index",
      label: "칸 번호(이진수)",
      labels: LIST_A.map((_, j) => bits(j, MID)),
    },
    // 원소마다 한 줄 — 그 칸의 부분집합이 이 원소를 골랐으면 값을, 안 골랐으면 빈칸을 적는다.
    ...group.map(
      (x, i): StageRow => ({
        kind: "cells",
        label: `${i} 번째 원소 ${x}`,
        values: LIST_A.map((_, j) => ((j >> i) & 1 ? x : "")),
        side: `고른 칸 ${LIST_A.filter((_, j) => (j >> i) & 1).length} 개`,
      }),
    ),
    {
      kind: "cells",
      label: "sumsA",
      values: LIST_A,
      states: { 5: "focus" },
      side: `칸 ${LIST_A.length} 개`,
    },
  ];
}

function doublingFrames(): StageFrame[] {
  const frames: StageFrame[] = [];
  let size = 1;
  for (let i = 0; i < MID; i++) {
    const a = WALK[i] as number;
    const now = [...subsetSums(WALK, 0, i + 1)];
    const states: Partial<Record<number, CellState>> = {};
    for (const j of range(0, size - 1)) states[j] = "read";
    for (const j of range(size, 2 * size - 1)) states[j] = "focus";
    frames.push({
      id: `원소 ${a}`,
      text: `칸 [0,${size - 1}] 의 값에 ${a}${을를(a)} 더해 칸 [${size},${2 * size - 1}] 에 적는다`,
      rows: [
        { kind: "index", label: "칸" },
        {
          kind: "cells",
          label: "sumsA",
          values: filled(now, now.length).concat(
            new Array<null>(LIST_A.length - now.length).fill(null),
          ),
          states,
          side: `채움 ${2 * size} / ${LIST_A.length}`,
        },
        { kind: "caret", cells: range(0, size - 1) },
      ],
    });
    size <<= 1;
  }
  return frames;
}

/* ───────────────────────── 그림 ───────────────────────── */

const WALK_OPTIONS = ARRAY_OPTIONS;

export const FIGS: Record<string, () => ReactElement> = {
  "concept-lists": () => {
    const hit = REC.queries[REC.queries.length - 1];
    const at = hit?.probes[hit.probes.length - 1]?.mid ?? -1;
    const step: ArrayStep = {
      array: [...WALK],
      range: [0, WALK.length - 1],
      rangeSide: `원소 ${WALK.length} 개`,
      pieces: [
        { label: "앞 무리", from: 0, to: MID - 1, tone: "left" },
        { label: "뒤 무리", from: MID, to: WALK.length - 1, tone: "right" },
      ],
      layers: [
        layer("sumsA", LIST_A, {
          read: [hit?.index ?? -1],
          side: "앞 무리의 부분집합 합 목록",
        }),
        layer("sumsB", SORTED_B, {
          write: [at],
          side: "뒤 무리의 부분집합 합 목록을 정렬한 것",
        }),
      ],
    };
    return (
      <CellStage
        title={`sumsA 칸 ${hit?.index} 의 ${hit?.sA}${과와(hit?.sA ?? 0)} sumsB 칸 ${at} 의 ${hit?.need}${이가(hit?.need ?? 0)} 만나 ${WALK_TARGET}${이가(WALK_TARGET)} 된다`}
        rows={arrayStage(step, WALK_OPTIONS)}
        columns={arrayColumns(step)}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`원소 ${N_LIMIT} 개 · 기본 연산 1 초에 1 억 번 어림 · 256 MB`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-list": () => (
    <CellStage
      title={`앞 무리 [${WALK.slice(0, MID).join(", ")}] 의 부분집합 합 목록 — 칸 번호의 1 인 자리가 고른 원소다`}
      rows={listRows()}
      columns={LIST_A.length}
    />
  ),
  "build-doubling": () => (
    <CellStageFilm
      title="원소 하나를 더할 때마다 부분집합 합 목록이 두 배가 된다"
      columns={LIST_A.length}
      frames={doublingFrames()}
    />
  ),
  "walk-mitm": () => {
    const steps = walkSteps();
    return (
      <CellStageFilm
        title={`meetInTheMiddleSubsetSum([${WALK.join(", ")}], ${WALK_TARGET}) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={Math.max(...steps.map(arrayColumns))}
        frames={steps.map((s) => ({
          id: s.id,
          text: s.head,
          rows: arrayStage(s, WALK_OPTIONS),
        }))}
      />
    );
  },
  "invariant-range": () => {
    const hit = REC.queries[REC.queries.length - 1];
    const p = hit?.probes[0];
    const lo = p?.lo ?? 0;
    const hi = p?.hi ?? 0;
    const states: Partial<Record<number, CellState>> = {};
    const outside = SORTED_B.flatMap((_, j) => (j < lo || j > hi ? [j] : []));
    for (const j of outside) states[j] = "out";
    return (
      <RangeCover
        title={`need = ${hit?.need} 의 첫 비교 뒤 — 좁힌 후보 구간 밖에는 ${hit?.need}${이가(hit?.need ?? 0)} 없다`}
        row={{ label: "정렬한 sumsB", values: SORTED_B, states }}
        indexLabel="칸"
        ranges={[
          {
            from: lo,
            to: hi,
            tone: "query",
            note: `후보 구간 [${lo},${hi}] · ${hi - lo + 1} 칸`,
          },
        ]}
        annotation={{
          cells: outside,
          text: `칸 ${p?.mid} 부터 오른쪽은 모두 ${p?.value} 이상이라 ${hit?.need}${이가(hit?.need ?? 0)} 없다`,
        }}
      />
    );
  },
};
