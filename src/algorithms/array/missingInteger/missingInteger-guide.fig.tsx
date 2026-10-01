/**
 * `missingInteger-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 테이블을 만드는 줄을, 입력 배열 `A` 와
 * 테이블 `seen` 을 기록하는 겉싸개(Proxy)로 감싼 계측 사본(`accessProbe`)을 정본 소스에서 기계로 만들고,
 * 그 기록 — `A` 의 칸을 읽은 순서와 `seen` 의 칸을 읽고 쓴 순서 — 에서 걸음을 얻는다. 걸음 재생 패널의
 * 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `missingInteger-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 을를, 이가 } from "../../../../tools/josa.ts";
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
import { BIG, tableRun } from "./missingInteger-guide.alt.ts";
import { missingInteger } from "./missingInteger-guide.ref.ts";

const REF = new URL("./missingInteger-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  missingInteger(A: number[]): number;
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 배열 하나의 칸 접근 — 숫자 이름의 읽기와 쓰기만 적는다(`length` 등은 적지 않는다). */
interface Access {
  readonly on: "A" | "seen";
  readonly op: "get" | "set";
  readonly i: number;
  readonly v: unknown;
}

const g = globalThis as unknown as {
  __access: Access[];
  __wrap: <T extends object>(target: T, on: "A" | "seen") => T;
};
g.__access = [];
g.__wrap = (target, on) =>
  new Proxy(target, {
    get(t, key, r) {
      const v = Reflect.get(t, key, r);
      if (typeof key === "string" && /^\d+$/.test(key)) {
        g.__access.push({ on, op: "get", i: Number(key), v });
      }
      return v;
    },
    set(t, key, v, r) {
      if (typeof key === "string" && /^\d+$/.test(key)) {
        g.__access.push({ on, op: "set", i: Number(key), v });
      }
      return Reflect.set(t, key, v, r);
    },
  });

/**
 * 테이블을 만드는 줄을 바꾼 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지 않으면
 * `loadMutant` 가 던진다. 입력 `A` 와 새 테이블을 겉싸개로 감쌀 뿐 값은 그대로라, 답은 정본과 같아야
 * 한다(`trace` 가 대조한다). 테이블을 거짓으로 채우는 일은 감싸기 전에 끝나므로 기록에 들지 않는다.
 */
const accessProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)const seen = new Array<boolean>\(n \+ 1\)\.fill\(false\);$/,
    '$1A = (globalThis as any).__wrap(A, "A");\n$1const seen = (globalThis as any).__wrap(new Array<boolean>(n + 1).fill(false), "seen");',
  ],
});

/** 한 걸음의 기록. */
export type Event =
  | { readonly kind: "make"; readonly size: number }
  | {
      readonly kind: "mark";
      /** 읽은 배열의 자리. */
      readonly i: number;
      readonly x: number;
      /** 표시했으면 그 칸, 건너뛰었으면 `null`. */
      readonly cell: number | null;
    }
  | { readonly kind: "find"; readonly x: number; readonly value: boolean }
  | { readonly kind: "end"; readonly answer: number };

export interface Run {
  readonly A: readonly number[];
  readonly events: readonly Event[];
  readonly answer: number;
  /** 걸음마다 그 걸음이 끝난 뒤의 테이블(칸 0 … n). */
  readonly tables: readonly (readonly boolean[])[];
}

/** 정의대로 만든 테이블 — 칸 `x` 는 `x` 가 `A` 에 있으면 참(칸 0 은 거짓). */
function tableByDefinition(A: readonly number[]): boolean[] {
  return Array.from(
    { length: A.length + 1 },
    (_, x) => x >= 1 && A.includes(x),
  );
}

/**
 * 정본 한 번 호출의 기록. 답은 정본과, 표시를 마친 테이블은 정의와 대조한다. 어긋나면 던진다 —
 * 그림이 정본과 다른 것을 그리지 않게.
 */
export function trace(A: readonly number[]): Run {
  g.__access = [];
  const probed = accessProbe.missingInteger([...A]);
  const log = [...g.__access];
  const answer = missingInteger([...A]);
  if (probed !== answer) throw new Error("계측 사본이 정본과 다른 답을 냈다");
  const n = A.length;
  const table = new Array<boolean>(n + 1).fill(false);
  const events: Event[] = [{ kind: "make", size: n + 1 }];
  const tables: boolean[][] = [[...table]];
  for (let k = 0; k < log.length; k++) {
    const a = log[k] as Access;
    if (a.on === "A" && a.op === "get") {
      const next = log[k + 1];
      const wrote = next?.on === "seen" && next.op === "set";
      if (wrote) {
        table[next.i] = true;
        k++;
      }
      events.push({
        kind: "mark",
        i: a.i,
        x: a.v as number,
        cell: wrote ? next.i : null,
      });
    } else if (a.on === "seen" && a.op === "get") {
      events.push({ kind: "find", x: a.i, value: a.v as boolean });
    } else {
      throw new Error("표시 걸음 밖에서 테이블을 썼다");
    }
    tables.push([...table]);
  }
  const marks = events.filter((e) => e.kind === "mark").length;
  if (marks !== n) throw new Error("원소를 읽은 걸음 수가 n 과 다르다");
  if (JSON.stringify(table) !== JSON.stringify(tableByDefinition(A))) {
    throw new Error("표시를 마친 테이블이 정의와 다르다");
  }
  const last = events.at(-1);
  if (last?.kind !== "find" || last.value) {
    events.push({ kind: "end", answer });
    tables.push([...table]);
  }
  return { A, events, answer, tables };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력 둘(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK: readonly number[] = [4, -1, 9, 1, 1, 2];
export const FULL: readonly number[] = [1, 2, 3];

/** 과제 규모 — 배열 길이의 상한과 값의 범위. */
export const N_MAX = 100_000;
const VALUE_MAX = 1_000_000;

const num = (x: number): string => x.toLocaleString("en-US");
const fixed2 = (x: number): string =>
  (Math.round(x * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const tf = (b: boolean): string => (b ? "참" : "거짓");

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

/** 1 부터 차례로, 배열 전체를 읽어 그 수가 있는지 본다 — 비교 수를 센다. */
function naiveCompares(A: readonly number[]): number {
  let compares = 0;
  for (let x = 1; ; x++) {
    let found = false;
    for (const v of A) {
      compares++;
      if (v === x) {
        found = true;
        break;
      }
    }
    if (!found) return compares;
  }
}

export function approaches(): Approach[] {
  // 1 … n 이 다 든 배열이 가장 오래 걸린다. 비교 수는 식 n(n+1)/2 + n 으로 적되, 식이 실측과 같은지
  // 작은 규모에서 확인한다.
  const naive = (n: number): number => (n * (n + 1)) / 2 + n;
  for (const n of [6, 1_000]) {
    const A = Array.from({ length: n }, (_, k) => k + 1);
    if (naiveCompares(A) !== naive(n)) {
      throw new Error(`n = ${n} 에서 차례로 찾기의 비교 수가 식과 다르다`);
    }
  }
  const rangeCells = VALUE_MAX + 1;
  const wideCells = 1_000_000_000 + 1;
  const big = tableRun([...BIG]);
  if (big.answer !== missingInteger([...BIG])) {
    throw new Error("세는 사본이 큰 입력에서 정본과 다르다");
  }
  return [
    {
      name: "1 부터 차례로 찾기",
      idea: "x = 1 부터, 배열 전체를 읽어 x 가 있으면 x 를 올린다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = ${num(N_MAX)} 에서 비교 ${num(naive(N_MAX))} 번 · ${fixed2(naive(N_MAX) / 1e8)} 초`,
          ok: false,
        },
      ],
      lesson:
        "물음마다 배열 전체를 읽는다 — 정렬해 두고 앞에서부터 읽으면 어떨까",
    },
    {
      name: "정렬하고 읽기",
      idea: "배열을 정렬한 뒤, 찾는 수를 1 에서 올리며 앞에서부터 읽는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        { label: "시간", value: "비교 n log n 규모 · 예산 안", ok: true },
      ],
      lesson:
        "쓰지 않는 값의 순서까지 정한다 — 순서를 버리고 있는지만 칸에 적으면 어떨까",
    },
    {
      name: "값의 범위만큼 칸을 둔 테이블",
      idea: "칸 1 … 최댓값을 두고, 값 x 를 읽으면 칸 x 에 표시한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "메모리",
          value: `값이 ±10^6 이면 칸 ${num(rangeCells)} 개, ±10^9 이면 ${num(wideCells)} 개 · 칸당 1 바이트로 ${fixed2(wideCells / 1e9)} GB`,
          ok: false,
        },
      ],
      lesson:
        "칸 수가 값의 범위를 따라간다 — 답이 n + 1 이하이니 칸 n 개만 두면 어떨까",
    },
    {
      name: "칸 n 개짜리 직접 주소 테이블",
      idea: "1 ≤ x ≤ n 인 값만 칸 x 에 표시하고, 칸 1 부터 처음 빈 칸을 답한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = ${num(N_MAX)} 에서 칸 접근 ${num(big.accesses)} 번`,
          ok: true,
        },
        {
          label: "메모리",
          value: `칸 ${num(big.cells)} 개`,
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
  readonly event: Event;
  /** 이 걸음이 끝난 뒤의 테이블. */
  readonly table: readonly boolean[];
  readonly calc: { readonly expr: string; readonly result: string };
}

/** 전개의 걸음 — 입력 하나. 번호는 `start` 부터 붙인다. */
export function walkSteps(A: readonly number[], start: number): Step[] {
  const run = trace(A);
  const n = A.length;
  return run.events.map((e, k): Step => {
    const id = `T${start + k}`;
    const table = run.tables[k] as boolean[];
    switch (e.kind) {
      case "make":
        return {
          id,
          title: "만들기",
          detail: `칸 0 … ${n}${을를(n)} 모두 거짓으로 둡니다. 칸 0 은 쓰지 않습니다.`,
          event: e,
          table,
          calc: {
            expr: `new Array(${e.size}).fill(false)`,
            result: `칸 ${e.size} 개`,
          },
        };
      case "mark": {
        const lo = e.x >= 1;
        const cond = lo ? `${e.x} >= 1 && ${e.x} <= ${n}` : `${e.x} >= 1`;
        const why = !lo
          ? `1 보다 작아 칸이 없으니 건너뜁니다.`
          : e.cell === null
            ? `${n} 보다 커서 칸이 없으니 건너뜁니다.`
            : (run.tables[k - 1] as boolean[])[e.cell]
              ? `칸 ${e.cell} 에 이미 참이 있어 같은 칸을 다시 참으로 씁니다.`
              : `칸 ${e.cell} 에 참을 씁니다.`;
        return {
          id,
          title: `표시 x = ${e.x}`,
          detail: `A[${e.i}] = ${e.x}${을를(e.x)} 읽습니다. ${why}`,
          event: e,
          table,
          calc: {
            expr: cond,
            result:
              e.cell === null ? "거짓 → 건너뜀" : `참 → seen[${e.cell}] = true`,
          },
        };
      }
      case "find":
        return {
          id,
          title: `찾기 칸 ${e.x}`,
          detail: e.value
            ? `칸 ${e.x}${이가(e.x)} 참이라 다음 칸으로 갑니다.`
            : `칸 ${e.x}${이가(e.x)} 거짓이라 ${e.x}${을를(e.x)} 답으로 돌려줍니다.`,
          event: e,
          table,
          calc: {
            expr: `!seen[${e.x}]`,
            result: e.value ? "거짓 → 다음 칸" : `참 → 답 ${e.x}`,
          },
        };
      default:
        return {
          id,
          title: "끝",
          detail: `칸 1 … ${n} 이 모두 참이라 루프를 빠져나와 ${e.answer}${을를(e.answer)} 돌려줍니다.`,
          event: e,
          table,
          calc: {
            expr: `${n + 1} <= ${n}`,
            result: `거짓 → n + 1 = ${e.answer}`,
          },
        };
    }
  });
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "읽은 값",
};

/** 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
export function arrayStep(s: Step, A: readonly number[]): ArrayStep {
  const e = s.event;
  const n = A.length;
  const range: [number, number] | null =
    e.kind === "make" ? null : e.kind === "mark" ? [0, e.i] : [0, n - 1];
  const write =
    e.kind === "make"
      ? s.table.map((_, x) => x)
      : e.kind === "mark" && e.cell !== null
        ? [e.cell]
        : [];
  const trues = s.table.filter((b, x) => x >= 1 && b).length;
  return {
    array: [...A],
    range,
    read: e.kind === "mark" ? [e.i] : [],
    write: [],
    calc: { ...s.calc },
    vars: null,
    layers: [
      {
        name: "seen",
        values: s.table.map(tf),
        read: e.kind === "find" ? [e.x] : [],
        write,
        side: `칸 1 … ${n} 중 참 ${trues} 칸`,
      },
    ],
  };
}

/** 두 입력의 걸음 — 앞 입력의 걸음 번호를 이어서 붙인다. */
export function allSteps(): { markA: Step[]; fullB: Step[] } {
  const markA = walkSteps(WALK, 1);
  const fullB = walkSteps(FULL, markA.length + 1);
  return { markA, fullB };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `missingInteger-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const { markA, fullB } = allSteps();
  const panel = (steps: readonly Step[], A: readonly number[]) =>
    steps.map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...arrayStep(s, A),
    }));
  return { markA: panel(markA, WALK), fullB: panel(fullB, FULL) };
}

/* ───────────────────────── 그림 ───────────────────────── */

function film(steps: readonly Step[], A: readonly number[]): ReactElement {
  const frames: StageFrame[] = steps.map((s) => ({
    id: s.id,
    text: `${s.title} — ${s.calc.expr} → ${s.calc.result}`,
    rows: arrayStage(arrayStep(s, A), ARRAY_OPTIONS),
  }));
  return (
    <CellStageFilm
      title={`missingInteger([${A.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
      columns={arrayColumns(arrayStep(steps[0] as Step, A))}
      frames={frames}
    />
  );
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-marks": () => {
    const run = trace(WALK);
    const n = WALK.length;
    const table = run.tables.at(-1) as boolean[];
    // 표시를 마친 테이블 — 찾기 걸음은 테이블을 바꾸지 않는다.
    const aStates: Partial<Record<number, CellState>> = {};
    for (const e of run.events) {
      if (e.kind === "mark" && e.cell === null) aStates[e.i] = "out";
    }
    const seenStates: Partial<Record<number, CellState>> = { 0: "out" };
    const kept = run.events.flatMap((e) =>
      e.kind === "mark" && e.cell !== null ? [e.cell] : [],
    );
    for (const x of kept) seenStates[x] = "focus";
    seenStates[run.answer] = "read";
    const rows: StageRow[] = [
      { kind: "index", label: "자리 · 칸" },
      {
        kind: "cells",
        label: "A",
        values: [...WALK],
        states: aStates,
        side: `칸이 없는 값 ${Object.keys(aStates).length} 개`,
      },
      {
        kind: "cells",
        label: "seen",
        values: table.map(tf),
        states: seenStates,
        side: `칸 1 … ${n}`,
      },
      {
        kind: "caret",
        cells: [run.answer],
        side: `처음 거짓인 칸 ${run.answer} = 답`,
      },
    ];
    return (
      <CellStage
        title={`값 x 를 칸 x 에 표시한다 — 칸 1 … ${n} 가운데 처음 거짓인 칸 ${run.answer}${이가(run.answer)} 답`}
        rows={rows}
        columns={n + 1}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`n 최대 ${num(N_MAX)} · 값 −10^6 이상 10^6 이하 · 1 초 · 256 MB(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "walk-mark-a": () => film(allSteps().markA, WALK),
  "walk-full-b": () => film(allSteps().fullB, FULL),
  "invariant-cells": () => {
    const run = trace(WALK);
    const n = WALK.length;
    const table = run.tables.at(-1) as boolean[];
    const cells = Array.from({ length: n }, (_, k) => k + 1);
    const seenStates: Partial<Record<number, CellState>> = {};
    const hasStates: Partial<Record<number, CellState>> = {};
    for (let k = 0; k < run.answer - 1; k++) {
      seenStates[k] = "read";
      hasStates[k] = "read";
    }
    return (
      <CellStage
        title={`표시를 마친 뒤 — 칸 x 의 참거짓이 「x 가 A 에 있다」와 같고, 칸 ${run.answer}${을를(run.answer)} 읽을 때 앞 칸은 모두 참`}
        rows={[
          { kind: "index", label: "칸 x", labels: cells },
          {
            kind: "cells",
            label: "seen[x]",
            values: cells.map((x) => tf(table[x] as boolean)),
            states: seenStates,
          },
          {
            kind: "cells",
            label: "A 에 x",
            values: cells.map((x) => tf(WALK.includes(x))),
            states: hasStates,
            side: "정의로 센 값",
          },
          {
            kind: "caret",
            cells: [run.answer - 1],
            side: `찾기가 칸 ${run.answer} 에서 멈춘다`,
          },
        ]}
        columns={n}
      />
    );
  },
};
