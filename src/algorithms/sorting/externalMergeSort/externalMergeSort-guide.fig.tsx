/**
 * `externalMergeSort-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 걸음마다의 런 · 최소 힙 · 출력은 증명 사이드카의 `walk()` —
 * 정본 소스에 기록 줄만 끼운 사본(`기록판`)을 파일 위에서 실행한 것 — 이 내고, 시도 사다리의 수는 같은
 * 사이드카의 `과제_비교표()` 가 정렬 결과와 답을 맞댄 세는 사본으로 낸다. 걸음 재생 패널의 걸음
 * (`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `externalMergeSort-guide.test.ts` 가 잰다.
 *
 * ## 무대 두 벌
 *
 * 걸음 재생 패널은 배열 무대(`stage: "array"`) 두 벌이다. 런을 만드는 벌과 합치는 벌이 쌓는 구조가 달라서다.
 *
 * - **런 만들기(`runWalk`, T1~T4).** 윗줄이 입력 파일이고, 쥔 구간 「메모리」가 이번에 메모리로 읽어 들인
 *   값이다. 아래 조각 괄호(`pieces`)가 지금까지 적은 런의 자리이고, 그 아래 줄 「런 파일」이 적은 런의 값을
 *   입력의 같은 자리에 놓은 것이다. 런 `r` 은 입력의 `r` 번째 `M` 칸을 정렬한 것이라 자리가 겹치지 않는다.
 * - **합치기(`mergeWalk`, T5~T13).** 윗줄이 런 파일 셋을 이어 놓은 줄이다. 대시 칸은 이미 메모리로 읽어
 *   들인 값, ▲ 가 이번에 읽은 값이고, 조각 괄호가 런마다 아직 안 읽은 자리다(끝난 런은 괄호가 없다). 그 아래
 *   두 줄이 최소 힙을 **꺼낼 차례대로** 늘어놓은 띠다 — `dijkstra` 편이 세운 우선순위 큐 규약이고, 같은 편의
 *   이웃 `medianFromDataStream` 이 두 힙을 같은 방법으로 그린다. 첫 칸이 꼭대기이고 윗줄이 값, 아랫줄이 그
 *   값이 나온 런이다. 맨 아래 줄이 출력 파일이다.
 *
 * 누적 정수 입출력과 메모리에 든 정수는 무대의 어느 칸에도 속하지 않으므로 남는 변수에 둔다.
 */

import type { ReactElement } from "react";
import { 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import {
  CellStage,
  CellStageFilm,
  type StageFrame,
  type StageRow,
} from "../../../_viz/patterns/CellStage";
import { RangeCover } from "../../../_viz/patterns/RangeCover";
import {
  type ArrayOptions,
  type ArrayPiece,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import {
  comma,
  type Entry,
  RUNS,
  WALK,
  WALK_M,
  walk,
  type 걸음,
  과제_비교표,
  꺼낼차례,
  나열,
  남은값,
  런자리,
} from "./externalMergeSort-guide.proof.ts";

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

/** 런 만들기 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const RUN_OPTIONS: ArrayOptions = {
  arrayName: "입력 파일",
  rangeLabel: "메모리",
};

/** 합치기 무대의 이름표. */
export const MERGE_OPTIONS: ArrayOptions = {
  arrayName: "런 파일",
  rangeLabel: "합치는 런",
};

const 자리 = 런자리(RUNS);
const 런줄 = RUNS.flat();
const 힙칸 = RUNS.length;

const 조각 = (r: number, from: number, to: number): ArrayPiece => ({
  label: `런 ${r}`,
  from,
  to,
  tone: r % 2 === 0 ? "left" : "right",
});

const 칸들 = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const 남는변수 = (s: 걸음): string =>
  `읽은 정수 ${s.읽은} · 적은 정수 ${s.적은} · 메모리 ${s.메모리} 개`;

/** 런 만들기 걸음 하나를 배열 무대의 걸음으로. */
function runStep(s: 걸음): ArrayStep {
  const i = s.runIndex;
  const range = i === null ? null : (자리[i] as [number, number]);
  const 런파일: (number | null)[] = WALK.map(() => null);
  for (const [k, r] of s.runs.entries()) {
    const [from] = 자리[k] as [number, number];
    r.forEach((v, j) => {
      런파일[from + j] = v;
    });
  }
  return {
    array: [...WALK],
    range,
    read: range === null ? [] : 칸들(range[0], range[1]),
    write: [],
    calc:
      range === null
        ? null
        : {
            expr: `sort(${WALK.slice(range[0], range[1] + 1).join(" ")})`,
            result: 나열(s.runs[i as number] as number[]),
          },
    vars: 남는변수(s),
    pieces: s.runs.map((_, k) => {
      const [from, to] = 자리[k] as [number, number];
      return 조각(k, from, to);
    }),
    layers: [
      {
        name: "런 파일",
        values: 런파일,
        read: [],
        write: range === null ? [] : 칸들(range[0], range[1]),
      },
    ],
  };
}

/** 꺼낼 차례 띠에서 이번에 올린 항목의 칸. */
function 올린칸(heap: readonly Entry[], pushed: readonly Entry[]): number[] {
  return pushed.flatMap((p) => {
    const at = heap.findIndex((e) => e.value === p.value && e.run === p.run);
    return at < 0 ? [] : [at];
  });
}

const 채운다 = <T,>(xs: readonly T[], n: number): (T | null)[] => [
  ...xs,
  ...Array.from({ length: Math.max(0, n - xs.length) }, () => null),
];

/** 합치기 걸음 하나를 배열 무대의 걸음으로. */
function mergeStep(s: 걸음): ArrayStep {
  const 읽은칸: number[] = [];
  const 새로읽은칸: number[] = [];
  const pieces: ArrayPiece[] = [];
  for (const [r, run] of s.runs.entries()) {
    const [from, to] = 자리[r] as [number, number];
    const taken = s.taken[r] ?? 0;
    for (let j = 0; j < taken; j++) 읽은칸.push(from + j);
    if (s.pushed.some((p) => p.run === r)) 새로읽은칸.push(from + taken - 1);
    if (taken < run.length) pieces.push(조각(r, from + taken, to));
  }
  const 남은 = 남은값(s).flat().length;
  const heapCells = 올린칸(s.heap, s.pushed);
  return {
    array: [...런줄],
    range: [0, 런줄.length - 1],
    rangeSide: `안 읽은 값 ${남은} 개`,
    read: 새로읽은칸,
    write: [],
    out: 읽은칸,
    calc:
      s.out === null
        ? null
        : {
            expr: `min(${s.before.map((e) => e.value).join(", ")})`,
            result: String(s.out.value),
          },
    vars: 남는변수(s),
    pieces,
    layers: [
      {
        name: "최소 힙 · 값",
        values: 채운다(
          s.heap.map((e) => e.value),
          힙칸,
        ),
        read: [],
        write: heapCells,
        side: `꺼낼 차례 · 크기 ${s.heap.length}`,
        caret: false,
      },
      {
        name: "최소 힙 · 런",
        values: 채운다(
          s.heap.map((e) => e.run),
          힙칸,
        ),
        read: [],
        write: heapCells,
        side: "값이 나온 런",
      },
      {
        name: "출력 파일",
        values: 채운다(s.output, 런줄.length),
        read: [],
        write: s.out === null ? [] : [s.output.length - 1],
      },
    ],
  };
}

/** 걸음 제목 — 한 일을 짧게. */
function 제목(s: 걸음): string {
  if (s.phase === "run") {
    if (s.runIndex === null) return "아직 아무것도 읽지 않았다";
    return s.full
      ? `런 ${s.runIndex}${을를(s.runIndex)} 적는다 ①`
      : `자투리 런 ${s.runIndex}${을를(s.runIndex)} 적는다 ②`;
  }
  if (s.out === null) return "런마다 첫 값을 올린다 ③";
  const next = s.pushed[0];
  return next === undefined
    ? `${s.out.value}${을를(s.out.value)} 적고 런 ${s.out.run}${이가(s.out.run)} 끝난다 ④`
    : `${s.out.value}${을를(s.out.value)} 적고 ${next.value}${을를(next.value)} 올린다 ④`;
}

/** 걸음 설명 — 조건 판정을 실제 값으로. */
function 설명(s: 걸음): string {
  if (s.phase === "run") {
    if (s.runIndex === null) {
      return `입력 파일에 정수가 ${WALK.length} 개 있고, 메모리에는 한 번에 ${WALK_M} 개까지 듭니다. 아직 런도 최소 힙도 없습니다.`;
    }
    const [from, to] = 자리[s.runIndex] as [number, number];
    const 모은 = WALK.slice(from, to + 1);
    const run = s.runs[s.runIndex] as number[];
    const 조건 = s.full
      ? `${모은.length} === ${WALK_M} 이 참이라 ①`
      : `${모은.length} === ${WALK_M} 은 거짓이지만 입력이 끝났고 값이 남아 ②`;
    return `${나열(모은)}${을를(나열(모은))} 메모리에 모았습니다. ${조건}, 정렬한 ${나열(run)}${을를(나열(run))} 런 파일 하나로 적습니다.`;
  }
  if (s.out === null) {
    return `런 ${s.runs.length} 개의 첫 값 ${s.pushed.map((e) => e.value).join(" · ")}${을를(s.pushed.at(-1)?.value ?? "")} 최소 힙에 올립니다. 메모리에 든 정수는 ${s.메모리} 개입니다.`;
  }
  const next = s.next ?? null;
  const 뒤 =
    next === null
      ? `런 ${s.out.run} 의 다음 값이 null 이라 올리지 않고, 최소 힙이 ${s.heap.length} 개로 줄어듭니다.`
      : `런 ${s.out.run} 에서 다음 값 ${next}${을를(next)} 읽어 최소 힙에 올립니다.`;
  return `꼭대기 ${s.out.value}${을를(s.out.value)} 꺼내 출력 파일에 적습니다. ${뒤}`;
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자 그대로
 * 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는 가이드 시험이 잰다.
 */
export function simStepsFromRef() {
  const ss = walk();
  return {
    runWalk: ss
      .filter((s) => s.phase === "run")
      .map((s) => ({
        title: `${s.id} ${제목(s)}`,
        text: 설명(s),
        ...runStep(s),
      })),
    mergeWalk: ss
      .filter((s) => s.phase === "merge")
      .map((s) => ({
        title: `${s.id} ${제목(s)}`,
        text: 설명(s),
        ...mergeStep(s),
      })),
  };
}

const film = (
  steps: readonly 걸음[],
  toStep: (s: 걸음) => ArrayStep,
  opts: ArrayOptions,
): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: 제목(s),
    rows: arrayStage(toStep(s), opts),
  }));

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

function approaches(): Approach[] {
  const t = 과제_비교표();
  const 배 = (a: number, b: number): string =>
    `${Math.round(a / b).toLocaleString("en-US")} 배`;
  return [
    {
      name: "전부 올려 정렬하기",
      idea: "파일을 통째로 배열 하나에 읽어 메모리에서 정렬하고 그대로 적는다",
      verdict: "drop",
      checks: [
        {
          label: "메모리",
          value: `정수 ${comma(t.전부_메모리)} 개 · 예산 M 의 ${배(t.전부_메모리, t.M)}`,
          ok: false,
        },
        {
          label: "정수 입출력",
          value: comma(t.전부_입출력),
          ok: true,
        },
      ],
      lesson:
        "메모리에 둘 수 있는 것은 M 개뿐이다 — M 개씩만 들고 파일을 여러 번 읽으면 어떨까",
    },
    {
      name: "반복 선택",
      idea: "바퀴마다 파일 전체를 읽어 아직 안 적은 값 가운데 가장 작은 M 개를 골라 적는다",
      verdict: "drop",
      checks: [
        { label: "메모리", value: `정수 ${comma(t.선택_메모리)} 개`, ok: true },
        {
          label: "정수 입출력",
          value: `${comma(t.선택_입출력)} — 바퀴 ${comma(t.R)} 번마다 파일 전체를 다시 읽는다`,
          ok: false,
        },
      ],
      lesson:
        "바퀴마다 같은 값을 다시 읽는다 — M 개씩 한 번만 읽어 정렬해 적어 두면 다음 값은 어디에 있을까",
    },
    {
      name: "런 + 맨 앞 모두 비교",
      idea: "M 개씩 정렬한 런을 적어 두고, 값마다 모든 런의 맨 앞을 비교해 가장 작은 것을 적는다",
      verdict: "drop",
      checks: [
        {
          label: "메모리 · 입출력",
          value: `정수 ${comma(t.런_메모리)} 개 · ${comma(t.런_입출력)}`,
          ok: true,
        },
        {
          label: "비교",
          value: `${comma(t.모두_비교)} 번 — 값 하나에 런 수만큼 비교한다`,
          ok: false,
        },
      ],
      lesson:
        "런의 맨 앞 R 개 가운데 최솟값만 필요하다 — 꺼낼 차례를 들고 있는 구조에 맡기면 어떨까",
    },
    {
      name: "런 + 최소 힙(k-way 병합)",
      idea: "런마다 맨 앞 하나씩을 최소 힙에 두고, 꼭대기를 적은 뒤 같은 런의 다음 값을 올린다",
      verdict: "keep",
      checks: [
        {
          label: "메모리 · 입출력",
          value: `정수 ${comma(t.런_메모리)} 개 · ${comma(t.런_입출력)}`,
          ok: true,
        },
        { label: "비교", value: `${comma(t.힙_비교)} 번`, ok: true },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-runs": () => {
    const heads = 자리.map(([from]) => from);
    const 첫힙 = 꺼낼차례(
      RUNS.map((r, i) => ({ value: r[0] as number, run: i })),
    );
    const 첫값 = 첫힙[0] as Entry;
    const rows: StageRow[] = [
      { kind: "index", label: "자리" },
      { kind: "cells", label: "입력 파일", values: WALK, states: {} },
      ...RUNS.map(
        (_, r): StageRow => ({
          kind: "bracket",
          label: `런 ${r}`,
          from: (자리[r] as [number, number])[0],
          to: (자리[r] as [number, number])[1],
          tone: r % 2 === 0 ? "left" : "right",
          text: `정렬 → ${나열(RUNS[r] as number[])}`,
        }),
      ),
      {
        kind: "cells",
        label: "런 파일",
        values: 런줄,
        states: Object.fromEntries(heads.map((h) => [h, "read"])),
      },
      { kind: "caret", cells: heads, side: "런마다 맨 앞" },
      {
        kind: "cells",
        label: "최소 힙",
        values: 첫힙.map((e) => e.value),
        states: { 0: "read" },
        side: "꺼낼 차례 · 첫 칸이 꼭대기",
      },
      {
        kind: "cells",
        label: "출력 파일",
        values: [첫값.value],
        states: { 0: "focus" },
        side: "첫 값",
      },
    ];
    return (
      <CellStage
        title={`메모리 ${WALK_M} 개로 런 ${RUNS.length} 개를 만들면 — 맨 앞 ${첫힙.map((e) => e.value).join(" · ")} 가운데 꼭대기 ${첫값.value}${이가(첫값.value)} 출력의 첫 값이다`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    const t = 과제_비교표();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`정수 N = ${comma(t.N)} 개 · 메모리 M = ${comma(t.M)} 개 · 메모리와 입출력은 식, 비교는 가벼운 판으로 실제로 센 값`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-runs-cover": () => (
    <RangeCover
      title={`런 ${RUNS.length} 개가 입력 ${WALK.length} 칸을 겹치지 않고 나눠 맡는다`}
      row={{ label: "입력 파일", values: WALK }}
      indexLabel="자리"
      ranges={RUNS.map((r, i) => {
        const [from, to] = 자리[i] as [number, number];
        return {
          from,
          to,
          tone: i % 2 === 0 ? "left" : "right",
          note: `런 ${i} · 정렬하면 ${나열(r)} · 맨 앞 ${r[0]}`,
        };
      })}
    />
  ),
  "walk-runs-film": () => {
    const steps = walk().filter((s) => s.phase === "run");
    return (
      <CellStageFilm
        title={`입력 ${WALK.join(" · ")}${을를(WALK.at(-1) as number)} 메모리 ${WALK_M} 개씩 런으로 적는다 — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={WALK.length}
        frames={film(steps, runStep, RUN_OPTIONS)}
      />
    );
  },
  "walk-merge-film": () => {
    const steps = walk().filter((s) => s.phase === "merge");
    return (
      <CellStageFilm
        title={`런 ${RUNS.length} 개를 최소 힙 하나로 합친다 — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={런줄.length}
        frames={film(steps, mergeStep, MERGE_OPTIONS)}
      />
    );
  },
};
