/**
 * `numberOfDisintersection-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 새 짝을 더하는 줄 뒤에 기록을 끼운
 * 계측 사본(`stopProbe`)을 정본 소스에서 기계로 만들고, 그 기록으로 멈춤마다의 `end` · `opened` ·
 * `count` 와 정렬한 두 배열을 얻는다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고,
 * `.sim.ts` 의 리터럴이 그것과 같은지는 `numberOfDisintersection-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
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
  type StageTone,
} from "../../../_viz/patterns/CellStage";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { countIntersectingDiscs } from "./numberOfDisintersection-guide.ref.ts";

const REF = new URL("./numberOfDisintersection-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  countIntersectingDiscs(A: number[], limit?: number): number;
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 새 짝을 더하는 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다.
 */
const stopProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)count \+= opened - \(i \+ 1\);$/,
    "$1count += opened - (i + 1);\n$1(globalThis as any).__stop.push({ i, end, opened, count, starts: [...starts], ends: [...ends] });",
  ],
});

/** 오른쪽 끝 하나에 멈춘 한 걸음의 기록. */
export interface Stop {
  readonly i: number;
  readonly end: number;
  /** 이 걸음을 마친 뒤 연 원판 수. */
  readonly opened: number;
  /** 이 걸음에 새로 연 원판 수. */
  readonly newly: number;
  /** 이 걸음에 더한 수 `opened − (i + 1)`. */
  readonly added: number;
  readonly count: number;
}

export interface Trace {
  readonly starts: readonly number[];
  readonly ends: readonly number[];
  readonly stops: readonly Stop[];
  readonly answer: number;
}

const startOf = (A: readonly number[], j: number): number =>
  j - (A[j] as number);
const endOf = (A: readonly number[], j: number): number => j + (A[j] as number);
const meets = (A: readonly number[], j: number, k: number): boolean =>
  Math.abs(j - k) <= (A[j] as number) + (A[k] as number);

/** 원판 번호를 오른쪽 끝 오름차순(끝이 같으면 번호 순)으로 — 끝 순서. */
export const byEnd = (A: readonly number[]): number[] =>
  A.map((_, j) => j).sort((x, y) => endOf(A, x) - endOf(A, y) || x - y);

/**
 * 정본 한 번 호출의 기록. 답은 정본과, 멈춤마다의 `opened` 와 `count` 는 정의(좌표와 쌍을 직접 센 값)와
 * 대조한다. 어긋나면 던진다 — 그림이 정본과 다른 것을 그리지 않게.
 */
export function trace(A: readonly number[]): Trace {
  const g = globalThis as unknown as {
    __stop: {
      i: number;
      end: number;
      opened: number;
      count: number;
      starts: number[];
      ends: number[];
    }[];
  };
  g.__stop = [];
  const probed = stopProbe.countIntersectingDiscs([...A]);
  const raw = [...g.__stop];
  const answer = countIntersectingDiscs([...A]);
  if (probed !== answer) throw new Error("계측 사본이 정본과 다른 답을 냈다");
  if (raw.length !== A.length) throw new Error("멈춘 수가 원판 수와 다르다");
  const order = byEnd(A);
  let prev = 0;
  let before = 0;
  const stops = raw.map((s): Stop => {
    const started = A.filter((_, j) => startOf(A, j) <= s.end).length;
    if (s.opened !== started) {
      throw new Error(`멈춤 ${s.i} 의 opened 가 정의와 다르다`);
    }
    const lead = new Set(order.slice(0, s.i + 1));
    let pairs = 0;
    for (let j = 0; j < A.length; j++) {
      for (let k = j + 1; k < A.length; k++) {
        if (meets(A, j, k) && (lead.has(j) || lead.has(k))) pairs++;
      }
    }
    if (s.count !== pairs) {
      throw new Error(`멈춤 ${s.i} 의 count 가 정의와 다르다`);
    }
    const stop: Stop = {
      i: s.i,
      end: s.end,
      opened: s.opened,
      newly: s.opened - prev,
      added: s.count - before,
      count: s.count,
    };
    prev = s.opened;
    before = s.count;
    return stop;
  });
  const first = raw[0];
  return {
    starts: first?.starts ?? [],
    ends: first?.ends ?? [],
    stops,
    answer,
  };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK: readonly number[] = [1, 5, 2, 1, 4, 0];

/** 과제 규모 — 원판 수의 상한. */
export const N_MAX = 100_000;

const num = (x: number): string => x.toLocaleString("en-US");
const fixed2 = (x: number): string =>
  (Math.round(x * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** 결정론적 생성식 — `A[j] = (37j + 11) mod m`(증명 사이드카와 같은 식). */
const gen = (n: number, m: number): number[] =>
  Array.from({ length: n }, (_, j) => (37 * j + 11) % m);

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

/** 모든 쌍을 대조한 횟수 — 상한을 주면 쌍 수가 그것을 넘는 순간 멈춘다. */
function pairChecks(A: readonly number[], stopAt: number): number {
  let count = 0;
  let checks = 0;
  for (let j = 0; j < A.length; j++) {
    for (let k = j + 1; k < A.length; k++) {
      checks++;
      if (meets(A, j, k)) count++;
      if (count > stopAt) return checks;
    }
  }
  return checks;
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본 — 정렬 비교와 여는 비교의 수. */
function sweepCounts(A: readonly number[]): {
  answer: number;
  sort: number;
  open: number;
} {
  const n = A.length;
  let sort = 0;
  const cmp = (a: number, b: number): number => {
    sort++;
    return a - b;
  };
  const starts = A.map((r, j) => j - r).sort(cmp);
  const ends = A.map((r, j) => j + r).sort(cmp);
  let count = 0;
  let opened = 0;
  let open = 0;
  for (let i = 0; i < n; i++) {
    const end = ends[i] as number;
    while (opened < n) {
      open++;
      if ((starts[opened] as number) > end) break;
      opened++;
    }
    count += opened - (i + 1);
  }
  return { answer: count, sort, open };
}

export function approaches(): Approach[] {
  const pairs = (n: number): number => (n * (n - 1)) / 2;
  const limit = 10_000_000;
  // 식 n(n−1)/2 가 실측과 같은지, 반지름이 전부 0 이면 상한에서 한 번도 멈추지 않는지 작은 규모에서 확인한다.
  const zeros = new Array<number>(5_000).fill(0);
  if (pairChecks(zeros, limit) !== pairs(zeros.length)) {
    throw new Error("반지름이 전부 0 인 입력이 상한에서 멈췄다");
  }
  // 원판마다 「시작이 내 끝 이하」인 원판 수를 그대로 더한 값.
  const rawSum = WALK.reduce(
    (s, _, j) =>
      s + WALK.filter((_, k) => startOf(WALK, k) <= endOf(WALK, j)).length,
    0,
  );
  const answer = countIntersectingDiscs([...WALK]);
  const big = gen(N_MAX, 50);
  const sw = sweepCounts(big);
  if (sw.answer !== countIntersectingDiscs([...big])) {
    throw new Error("세는 사본이 큰 입력에서 정본과 다르다");
  }
  return [
    {
      name: "모든 쌍 대조",
      idea: "두 원판 j < k 마다 k − j ≤ A[j] + A[k] 인지 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = ${num(N_MAX)} 에서 대조 ${num(pairs(N_MAX))} 번 · ${fixed2(pairs(N_MAX) / 1e8)} 초`,
          ok: false,
        },
      ],
      lesson: "쌍을 하나씩 본다 — 상한을 넘는 순간 멈추면 어떨까",
    },
    {
      name: "모든 쌍 대조 + 상한에서 멈춤",
      idea: "세다가 쌍 수가 limit 을 넘으면 바로 −1 을 돌려준다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `반지름이 전부 0 이면 한 번도 멈추지 않아 대조 ${num(pairs(N_MAX))} 번`,
          ok: false,
        },
      ],
      lesson:
        "답이 큰 입력만 빨라진다 — 쌍 대신 「시작이 내 끝 이하인 원판」의 개수를 세면 어떨까",
    },
    {
      name: "원판마다 「시작이 내 끝 이하」 개수",
      idea: "원판마다 왼쪽 끝이 자기 오른쪽 끝 이하인 원판 수를 센다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `전개 입력에서 개수를 그대로 더하면 ${rawSum} · 실제 ${answer}`,
          ok: false,
        },
      ],
      lesson:
        "자신과 먼저 닫힌 원판이 섞인다 — 오른쪽 끝 순서로 멈추며 i + 1 을 빼면 어떨까",
    },
    {
      name: "오른쪽 끝 순서 스윕 라인",
      idea: "두 끝을 따로 정렬하고, 오른쪽 끝마다 opened − (i + 1) 을 더한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `생성식 n = ${num(N_MAX)} 에서 정렬 비교 ${num(sw.sort)} 번 + 여는 비교 ${num(sw.open)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 수직선 그림 ───────────────────────── */

/** 수직선의 눈금 — 가장 작은 왼쪽 끝부터 가장 큰 오른쪽 끝까지. */
function axis(A: readonly number[]): { lo: number; xs: number[] } {
  const lo = Math.min(...A.map((_, j) => startOf(A, j)));
  const hi = Math.max(...A.map((_, j) => endOf(A, j)));
  return { lo, xs: Array.from({ length: hi - lo + 1 }, (_, t) => lo + t) };
}

/** 원판 하나의 괄호 줄. */
function discRow(
  A: readonly number[],
  j: number,
  lo: number,
  tone: StageTone,
  label: string,
): StageRow {
  const s = startOf(A, j);
  const e = endOf(A, j);
  return {
    kind: "bracket",
    label,
    from: s - lo,
    to: e - lo,
    tone,
    text: `[${s},${e}]`,
  };
}

/**
 * 멈춤 `i` 를 수직선 위에 — 먼저 닫힌 원판은 대시, 지금 닫히는 원판은 강조, 아직 안 닫힌 연 원판은
 * 실선이다. 아직 시작하지 않은 원판은 그리지 않고 곁말에 적는다.
 */
function stopStage(i: number): {
  title: string;
  rows: StageRow[];
  columns: number;
} {
  const t = trace(WALK);
  const s = t.stops[i] as Stop;
  const order = byEnd(WALK);
  const { lo, xs } = axis(WALK);
  const closed = order.slice(0, i);
  const self = order[i] as number;
  const waiting = order.slice(i + 1).filter((j) => startOf(WALK, j) <= s.end);
  const later = order.filter((j) => startOf(WALK, j) > s.end);
  const rows: StageRow[] = [
    { kind: "index", label: "좌표", labels: xs },
    ...closed.map((j) => discRow(WALK, j, lo, "right", `원판 ${j} 닫힘`)),
    discRow(WALK, self, lo, "make", `원판 ${self} 지금`),
    ...waiting.map((j) => discRow(WALK, j, lo, "left", `원판 ${j} 짝`)),
    {
      kind: "caret",
      cells: [s.end - lo],
      side:
        later.length === 0
          ? `기준점 x = ${s.end}`
          : `기준점 x = ${s.end} · 아직 시작 안 한 원판 ${later.join(" · ")}`,
    },
  ];
  return {
    title: `멈춤 ${i} — 연 원판 ${s.opened} 개에서 먼저 닫힌 ${i} 개와 자신을 빼면 새 짝 ${s.added} 개, count = ${s.count}`,
    rows,
    columns: xs.length,
  };
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

/** 「수행으로 알아보는 알고리즘」의 걸음 번호 — 정렬 둘(T1 · T2) 다음부터 멈춤이 시작된다. */
const FIRST_STOP = 3;

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** 정렬 걸음이면 정렬한 배열의 이름, 멈춤 걸음이면 그 멈춤. */
  readonly what: "starts" | "ends" | Stop;
  readonly calc: { readonly expr: string; readonly result: string };
}

const list = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

export function walkSteps(A: readonly number[] = WALK): Step[] {
  const t = trace(A);
  // 정렬하기 전의 두 끝 — 원판 번호 순. 정렬한 결과는 정본 실행에서 받는다.
  const rawStarts = A.map((_, j) => startOf(A, j));
  const rawEnds = A.map((_, j) => endOf(A, j));
  const sorts: Step[] = [
    {
      id: "T1",
      title: "starts 정렬",
      detail: `원판마다 왼쪽 끝 j − A[j] 를 모은 ${list(rawStarts)}${을를(rawStarts.at(-1) as number)} 오름차순으로 정렬합니다.`,
      what: "starts",
      calc: { expr: `sort(${list(rawStarts)})`, result: list(t.starts) },
    },
    {
      id: "T2",
      title: "ends 정렬",
      detail: `원판마다 오른쪽 끝 j + A[j] 를 모은 ${list(rawEnds)}${을를(rawEnds.at(-1) as number)} 오름차순으로 정렬합니다.`,
      what: "ends",
      calc: { expr: `sort(${list(rawEnds)})`, result: list(t.ends) },
    },
  ];
  const stops = t.stops.map((s): Step => {
    const open =
      s.newly === 0
        ? `${s.end} 이하에서 새로 시작한 원판이 없어 opened 는 ${s.opened} 그대로입니다.`
        : `${s.end} 이하에서 시작한 원판을 ${s.newly} 개 더 열어 opened = ${s.opened} 입니다.`;
    return {
      id: `T${FIRST_STOP + s.i}`,
      title: `i = ${s.i} · end = ${s.end}`,
      detail: `ends[${s.i}] = ${s.end} 에 멈춥니다. ${open} 먼저 닫힌 ${s.i} 개와 자신을 빼 ${s.added}${을를(s.added)} 더하니 count 가 ${s.count}${이가(s.count)} 됩니다.`,
      what: s,
      calc: {
        expr: `count += ${s.opened} − (${s.i} + 1)`,
        result: String(s.count),
      },
    };
  });
  return [...sorts, ...stops];
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "starts",
  rangeLabel: "연 원판",
};

/** 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
export function arrayStep(s: Step, A: readonly number[] = WALK): ArrayStep {
  const t = trace(A);
  const all = t.starts.map((_, k) => k);
  if (s.what === "starts" || s.what === "ends") {
    const sortedEnds = s.what === "ends";
    return {
      array: [...t.starts],
      range: null,
      read: [],
      write: sortedEnds ? [] : all,
      pointers: {},
      calc: { ...s.calc },
      vars: null,
      layers: [
        {
          name: "ends",
          values: sortedEnds ? [...t.ends] : t.ends.map(() => null),
          read: [],
          write: sortedEnds ? all : [],
          side: sortedEnds ? "정렬했다" : "아직 정렬 전",
        },
      ],
    };
  }
  const { i, opened, newly } = s.what;
  const fresh = Array.from({ length: newly }, (_, k) => opened - newly + k);
  return {
    array: [...t.starts],
    range: opened === 0 ? null : [0, opened - 1],
    read: fresh,
    write: [],
    pointers: { opened },
    calc: { ...s.calc },
    vars: null,
    layers: [
      {
        name: "ends",
        values: [...t.ends],
        read: [i],
        write: [],
        side: `멈춤 i = ${i} · 먼저 닫힌 ${i} 개`,
      },
    ],
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `numberOfDisintersection-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    sweep: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...arrayStep(s),
    })),
  };
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-sweep": () => {
    const t = trace(WALK);
    const { lo, xs } = axis(WALK);
    const stopsAt = [...new Set(t.ends)];
    return (
      <CellStage
        title={`원판 ${WALK.length} 개를 수직선의 구간으로 — 기준점은 오른쪽 끝 ${stopsAt.length} 자리에서 멈춘다`}
        rows={[
          { kind: "index", label: "좌표", labels: xs },
          ...WALK.map((_, j) => discRow(WALK, j, lo, "left", `원판 ${j}`)),
          {
            kind: "caret",
            cells: stopsAt.map((x) => x - lo),
            side: "오른쪽 끝 — 기준점이 멈추는 자리",
          },
        ]}
        columns={xs.length}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`n 최대 ${num(N_MAX)} · 반지름 0 이상 2,147,483,647 이하 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "concept-stop-one": () => {
    const f = stopStage(1);
    return <CellStage title={f.title} rows={f.rows} columns={f.columns} />;
  },
  "walk-sweep": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.calc.expr} = ${s.calc.result}`,
      rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`countIntersectingDiscs([${WALK.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(steps[0] as Step))}
        frames={frames}
      />
    );
  },
  "invariant-stop": () => {
    // 새로 연 원판이 없는데도 짝을 더하는 멈춤 — opened 가 이전 멈춤에서 이어진다는 것이 드러나는 자리.
    const t = trace(WALK);
    const at = t.stops.find((s) => s.newly === 0 && s.added > 0);
    if (at === undefined)
      throw new Error("새로 연 원판 없이 짝을 더한 멈춤이 없다");
    const f = stopStage(at.i);
    return <CellStage title={f.title} rows={f.rows} columns={f.columns} />;
  },
};
