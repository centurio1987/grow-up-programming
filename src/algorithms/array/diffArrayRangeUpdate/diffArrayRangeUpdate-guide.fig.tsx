/**
 * `diffArrayRangeUpdate-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 갱신을 경계 두 칸에 적는 줄과 결과
 * 배열에 적는 줄 뒤에 기록을 끼운 계측 사본 둘(`recordProbe` · `restoreProbe`)을 정본 소스에서 기계로
 * 만들고, 그 기록으로 차분 배열의 칸과 결과 배열의 칸을 얻는다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도
 * 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는 `diffArrayRangeUpdate-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
import { diffArrayRangeUpdate } from "./diffArrayRangeUpdate-guide.ref.ts";

const REF = new URL("./diffArrayRangeUpdate-guide.ref.ts", import.meta.url)
  .pathname;

export type Update = readonly [number, number, number];

interface Impl {
  diffArrayRangeUpdate(
    N: number,
    updates: Array<[number, number, number]>,
  ): number[];
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 취소 이벤트를 적는 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 갱신 하나를 적은 직후의 차분 배열 전체를 남긴다.
 */
const recordProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)D\[r \+ 1\] = \(D\[r \+ 1\] as number\) - v;$/,
    "$1D[r + 1] = (D[r + 1] as number) - v;\n$1(globalThis as any).__record.push({ l, r, v, D: [...D] });",
  ],
});

/** 결과 배열에 적는 줄 뒤에 기록을 끼운 사본. 읽은 차분 배열 칸과 그때의 누적값을 남긴다. */
const restoreProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)A\[i\] = running;$/,
    "$1A[i] = running;\n$1(globalThis as any).__restore.push({ i, d: D[i], running, D: [...D] });",
  ],
});

/**
 * 차분 배열을 `N` 칸으로 잡은 사본 — 「짚고 가기」가 보이는 변경이다. 기록이 끝난 뒤의 차분 배열을
 * 꺼내려고 그 배열을 전역에 걸어 둔다(같은 객체라 호출이 끝난 뒤 읽으면 기록 뒤의 모양이다).
 */
const shortProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)const D = new Array<number>\(N \+ 1\)\.fill\(0\);$/,
    "$1const D = new Array<number>(N).fill(0);\n$1(globalThis as any).__short = D;",
  ],
});

/** 기록 한 걸음 — `D[l] += v` · `D[r + 1] −= v` 를 마친 직후. */
export interface Record_ {
  readonly l: number;
  readonly r: number;
  readonly v: number;
  /** 그 갱신을 적은 직후의 차분 배열 전체. */
  readonly D: readonly number[];
}

/** 복원 한 걸음 — `running += D[i]` · `A[i] = running` 을 마친 직후. */
export interface Restore {
  readonly i: number;
  /** 읽은 칸 `D[i]` 의 값. */
  readonly d: number;
  /** 더한 뒤의 누적값 — 곧 `A[i]`. */
  readonly running: number;
}

export interface Trace {
  /** 기록이 끝난 차분 배열(`N + 1` 칸). */
  readonly D: readonly number[];
  readonly records: readonly Record_[];
  readonly restores: readonly Restore[];
  readonly result: readonly number[];
}

/** 정의를 그대로 옮긴 답 — 칸마다 그 칸을 덮는 갱신의 `v` 를 더한다. 계측과 대조하는 기준이다. */
export function byDefinition(N: number, updates: readonly Update[]): number[] {
  return Array.from({ length: N }, (_, i) =>
    updates.reduce((s, [l, r, v]) => (l <= i && i <= r ? s + v : s), 0),
  );
}

const copy = (updates: readonly Update[]): Array<[number, number, number]> =>
  updates.map((u) => [u[0], u[1], u[2]]);

/** 정본 한 번 호출의 기록. 답은 정본과, 칸은 정의(덮는 갱신의 합)와 대조한다. */
export function trace(N: number, updates: readonly Update[]): Trace {
  const g = globalThis as unknown as {
    __record: Record_[];
    __restore: (Restore & { D: number[] })[];
  };
  g.__record = [];
  g.__restore = [];
  recordProbe.diffArrayRangeUpdate(N, copy(updates));
  const records = [...g.__record];
  g.__record = [];
  g.__restore = [];
  const probed = restoreProbe.diffArrayRangeUpdate(N, copy(updates));
  const restores = g.__restore.map(({ i, d, running }) => ({ i, d, running }));
  const D = g.__restore[0]?.D ?? new Array<number>(N + 1).fill(0);
  const result = diffArrayRangeUpdate(N, copy(updates));
  if (JSON.stringify(probed) !== JSON.stringify(result)) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  if (records.length !== updates.length) {
    throw new Error("기록 반복의 걸음이 갱신 수와 다르다");
  }
  const last = records.at(-1)?.D;
  if (last !== undefined && JSON.stringify(last) !== JSON.stringify(D)) {
    throw new Error("기록이 끝난 차분 배열이 복원이 읽은 배열과 다르다");
  }
  if (JSON.stringify(result) !== JSON.stringify(byDefinition(N, updates))) {
    throw new Error("정본의 답이 정의(덮는 갱신의 합)와 다르다");
  }
  return { D, records, restores, result };
}

/** 차분 배열을 `N` 칸으로 잡은 사본의 한 번 호출 — 답과, 기록이 끝난 뒤의 차분 배열. */
export function shortRun(
  N: number,
  updates: readonly Update[],
): { A: number[]; D: number[] } {
  const g = globalThis as unknown as { __short: number[] };
  const A = shortProbe.diffArrayRangeUpdate(N, copy(updates));
  return { A, D: [...g.__short] };
}

/** 결과 배열 `A` 의 차분 배열 — 앞과 뒤에 0 칸이 하나씩 있다고 보고 이웃한 두 칸의 차를 적는다. */
export function diffOf(A: readonly number[]): number[] {
  return Array.from(
    { length: A.length + 1 },
    (_, j) => (A[j] ?? 0) - (j === 0 ? 0 : (A[j - 1] as number)),
  );
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK_N = 7;
/** 그 입력의 갱신 셋 — 서로 겹치고, 하나는 음수이고, 마지막 갱신의 오른쪽 끝이 `N − 1` 이다. */
export const WALK_U: readonly Update[] = [
  [1, 3, 2],
  [0, 2, -1],
  [5, 6, 3],
];

export const showUpdate = ([l, r, v]: Update): string => `(${l},${r},${v})`;
const num = (x: number): string => x.toLocaleString("en-US");
const signed = (x: number): string => (x > 0 ? `+${x}` : String(x));

/** 과제 규모 — 배열 길이와 갱신 수의 상한. */
export const N_MAX = 100_000;
/** 단순 연산 1 초에 1 억 번 기준. */
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toLocaleString("en-US", { maximumSignificantDigits: 3 })} 초`;

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** 이번 걸음이 다루는 결과 배열의 구간 — 기록이면 갱신이 덮는 구간, 복원이면 누적한 앞부분. */
  readonly range: readonly [number, number] | null;
  /** 이 걸음이 끝난 뒤의 결과 배열. 아직 안 쓴 칸은 `null`. */
  readonly A: readonly (number | null)[];
  readonly writeA: readonly number[];
  /** 이 걸음이 끝난 뒤의 차분 배열. */
  readonly D: readonly number[];
  readonly readD: readonly number[];
  readonly writeD: readonly number[];
  readonly calc: { readonly expr: string; readonly result: string };
  /** 갈래 — 기록 ①②③ · 복원 ④ · 루프 전. */
  readonly branch: "①②③" | "④" | null;
}

/** 전개의 걸음 — 차분 배열을 잡는 한 걸음 + 기록 `Q` 걸음 + 복원 `N` 걸음. */
export function walkSteps(
  N: number = WALK_N,
  updates: readonly Update[] = WALK_U,
): Step[] {
  const t = trace(N, updates);
  const A: (number | null)[] = new Array<null>(N).fill(null);
  const zero = new Array<number>(N + 1).fill(0);
  const steps: Step[] = [
    {
      id: "T1",
      title: "D 를 0 으로",
      detail: `차분 배열 D 를 ${N + 1} 칸의 0 으로 잡습니다. 결과 배열 A 는 아직 없습니다.`,
      range: null,
      A: [...A],
      writeA: [],
      D: zero,
      readD: [],
      writeD: zero.map((_, j) => j),
      calc: { expr: `N + 1 = ${N} + 1`, result: `${N + 1} 칸` },
      branch: null,
    },
  ];
  for (const rec of t.records) {
    const { l, r, v } = rec;
    steps.push({
      id: `T${steps.length + 1}`,
      title: `${showUpdate([l, r, v])} · ①②③`,
      detail: `갱신 ${showUpdate([l, r, v])} 는 구간 [${l},${r}] 의 ${r - l + 1} 칸을 덮습니다. D[${l}] 에 ${v}${을를(v)} 더하고 D[${r + 1}] 에서 ${v}${을를(v)} 뺍니다. A 는 건드리지 않습니다.`,
      range: [l, r],
      A: [...A],
      writeA: [],
      D: [...rec.D],
      readD: [],
      writeD: [l, r + 1],
      calc: {
        expr: `D[${l}] += ${v} · D[${r + 1}] −= ${v}`,
        result: `D[${l}] = ${rec.D[l]} · D[${r + 1}] = ${rec.D[r + 1]}`,
      },
      branch: "①②③",
    });
  }
  let prev = 0;
  for (const s of t.restores) {
    A[s.i] = s.running;
    steps.push({
      id: `T${steps.length + 1}`,
      title: `i = ${s.i} · ④`,
      detail: `running = ${prev} 에 D[${s.i}] = ${s.d}${을를(s.d)} 더해 ${s.running}${이가(s.running)} 되고, 그 값을 A[${s.i}] 에 씁니다. D 의 앞 ${s.i + 1} 칸 [0,${s.i}] 을 더한 값입니다.`,
      range: [0, s.i],
      A: [...A],
      writeA: [s.i],
      D: [...t.D],
      readD: [s.i],
      writeD: [],
      calc: {
        expr: `running + D[${s.i}] = ${prev} + ${s.d < 0 ? `(${s.d})` : s.d}`,
        result: String(s.running),
      },
      branch: "④",
    });
    prev = s.running;
  }
  return steps;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "구간",
};

/** 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
function arrayStep(s: Step): ArrayStep {
  return {
    array: [...s.A],
    range: s.range === null ? null : [s.range[0], s.range[1]],
    read: [],
    write: [...s.writeA],
    calc: { ...s.calc },
    vars: null,
    layers: [
      { name: "D", values: [...s.D], read: [...s.readD], write: [...s.writeD] },
    ],
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `diffArrayRangeUpdate-guide.test.ts` 가 잰다.
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

/** 방식 A — 갱신마다 구간을 차례로 고친다. 세는 것은 고친 칸 수다. */
export function scanEach(
  N: number,
  updates: readonly Update[],
): { A: number[]; perUpdate: number[]; cells: number } {
  const A = new Array<number>(N).fill(0);
  const perUpdate: number[] = [];
  let cells = 0;
  for (const [l, r, v] of updates) {
    let count = 0;
    for (let i = l; i <= r; i++) {
      A[i] = (A[i] as number) + v;
      count++;
    }
    cells += count;
    perUpdate.push(count);
  }
  return { A, perUpdate, cells };
}

/**
 * 가장 단순한 후보 — 시작 칸에만 `+v` 를 적고 취소를 적지 않는다. 정본에서 한 줄을 지운 사본이라
 * **정본 소스에서 기계로 만든다**.
 */
const startOnlyProbe = await loadMutant<Impl>(REF, {
  drop: /^\s*D\[r \+ 1\] = \(D\[r \+ 1\] as number\) - v;$/,
});

/** 시작 칸에만 적는 후보의 답. */
export const startOnly = (N: number, updates: readonly Update[]): number[] =>
  startOnlyProbe.diffArrayRangeUpdate(N, copy(updates));

/** 칸마다 다른 값의 개수 — 「어긋난 칸」을 값으로 적는 자리에서 쓴다. */
export const mismatches = (
  a: readonly number[],
  b: readonly number[],
): number =>
  Array.from({ length: Math.max(a.length, b.length) }).filter(
    (_, i) => a[i] !== b[i],
  ).length;

function approaches(): Approach[] {
  const scan = scanEach(WALK_N, WALK_U);
  const bare = trace(WALK_N, WALK_U).result;
  const only = startOnly(WALK_N, WALK_U);
  const big = N_MAX * N_MAX;
  return [
    {
      name: "갱신마다 구간 고치기",
      idea: "갱신이 오면 그 구간의 칸을 왼쪽 끝부터 오른쪽 끝까지 하나씩 고친다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `맞다 · 일곱 칸 입력의 갱신 셋에서 고친 칸 ${scan.cells} 개`,
          ok: true,
        },
        {
          label: "시간",
          value: `N = Q = ${num(N_MAX)} 최악 ${num(big)} 칸 · ${secondsOf(big)}`,
          ok: false,
        },
      ],
      lesson:
        "칸의 최종 값은 덮은 v 의 합뿐이다 — 구간의 시작 칸에만 적어 두면 어떨까",
    },
    {
      name: "시작 칸에만 적기",
      idea: "갱신마다 D[l] 에 v 를 더하고, 끝에 앞에서부터 누적한다",
      verdict: "drop",
      checks: [
        { label: "시간", value: "갱신 하나에 칸 1 개", ok: true },
        {
          label: "답",
          value: `틀린다 · 일곱 칸 중 ${mismatches(bare, only)} 칸이 어긋난다`,
          ok: false,
        },
      ],
      lesson:
        "더한 값이 배열 끝까지 이어진다 — 구간이 끝난 다음 칸에서 취소하면 어떨까",
    },
    {
      name: "차분 배열",
      idea: "갱신마다 D[l] 에 v 를 더하고 D[r+1] 에서 v 를 뺀 뒤, 끝에 앞에서부터 누적한다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `맞다 · 고친 칸 ${2 * WALK_U.length} 개와 누적 ${WALK_N} 번`,
          ok: true,
        },
        {
          label: "비용",
          value: `N = Q = ${num(N_MAX)} 에서 기록 ${num(2 * N_MAX)} 칸과 누적 ${num(N_MAX)} 번 · 칸 ${num(N_MAX + 1)} 개`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 인덱스 · `A` · `D` 세 줄 — 차분 배열이 결과 배열과 어떻게 줄을 맞추는지. */
function plainRows(
  A: readonly number[],
  D: readonly number[],
  sideD: string,
): StageRow[] {
  const states: Partial<Record<number, CellState>> = {};
  D.forEach((d, j) => {
    if (d !== 0) states[j] = "read";
  });
  return [
    { kind: "index", label: "인덱스" },
    { kind: "cells", label: "A", values: [...A], side: `칸 ${A.length} 개` },
    { kind: "cells", label: "D", values: [...D], states, side: sideD },
    {
      kind: "caret",
      cells: D.map((d, j) => (d !== 0 ? j : -1)).filter((j) => j >= 0),
    },
  ];
}

/** 「전체 컨셉」이 먼저 보이는 갱신 하나 — 전개 입력의 첫 갱신. */
export const CONCEPT_U: Update = WALK_U[0] as Update;

export const FIGS: Record<string, () => ReactElement> = {
  "concept-diff": () => {
    const [l, r, v] = CONCEPT_U;
    const one = trace(WALK_N, [CONCEPT_U]);
    const all = trace(WALK_N, WALK_U);
    return (
      <CellStageFilm
        title={`N = ${WALK_N} 의 결과 배열 A 와 차분 배열 D`}
        columns={WALK_N + 1}
        frames={[
          {
            id: showUpdate(CONCEPT_U),
            text: `구간 [${l},${r}] 에 ${v}${을를(v)} 더하면 A 는 ${r - l + 1} 칸이 바뀌고 D 는 D[${l}] · D[${r + 1}] 두 칸만 바뀐다`,
            rows: arrayStage(
              {
                array: [...one.result],
                range: [l, r],
                write: [],
                layers: [{ name: "D", values: [...one.D], write: [l, r + 1] }],
              },
              ARRAY_OPTIONS,
            ),
          },
          {
            id: "모두",
            text: `${WALK_U.map(showUpdate).join(" · ")} 를 모두 적은 D — 앞에서부터 누적하면 A 가 된다`,
            rows: plainRows(
              all.result,
              all.D,
              `칸 ${all.D.length} 개 · 0 이 아닌 칸 ${all.D.filter((d) => d !== 0).length} 개`,
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
        constraint={`N · Q 최대 ${num(N_MAX)} · 1 초(단순 연산 1 초에 1 억 번 기준) · 256 MB`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-cover": () => {
    const t = trace(WALK_N, WALK_U);
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      { kind: "cells", label: "A", values: [...t.result] },
    ];
    t.D.forEach((d, j) => {
      if (d === 0 || j >= WALK_N) return;
      rows.push({
        kind: "bracket",
        label: `D[${j}]`,
        from: j,
        to: WALK_N - 1,
        tone: d > 0 ? "left" : "right",
        text: `${signed(d)}${이가(d)} 칸 ${j} 부터 끝까지`,
      });
    });
    const last = t.D[WALK_N] as number;
    rows.push({
      kind: "cells",
      label: "D",
      values: [...t.D],
      side: `D[${WALK_N}] = ${last}${은는(last)} 더해지는 칸이 없다`,
    });
    return (
      <CellStage
        title="차분 배열의 칸마다 값이 더해지는 자리"
        rows={rows}
        columns={t.D.length}
      />
    );
  },
  "build-overlap": () => {
    const t = trace(WALK_N, WALK_U);
    const rows: StageRow[] = [{ kind: "index", label: "인덱스" }];
    for (const u of WALK_U) {
      const own = trace(WALK_N, [u]).D;
      const states: Partial<Record<number, CellState>> = {
        [u[0]]: "focus",
        [u[1] + 1]: "focus",
      };
      rows.push({
        kind: "cells",
        label: showUpdate(u),
        values: [...own],
        states,
        side: `D[${u[0]}] ${signed(u[2])} · D[${u[1] + 1}] ${signed(-u[2])}`,
      });
    }
    rows.push({
      kind: "cells",
      label: "D",
      values: [...t.D],
      side: "칸마다 세 줄을 더한 값",
    });
    return (
      <CellStage
        title="갱신 셋이 저마다 적은 두 칸과, 그것을 칸마다 더한 차분 배열"
        rows={rows}
        columns={t.D.length}
      />
    );
  },
  "walk-run": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.calc.expr} → ${s.calc.result}`,
      rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`diffArrayRangeUpdate(${WALK_N}, 갱신 ${WALK_U.length} 개) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(steps[0] as Step))}
        frames={frames}
      />
    );
  },
};
