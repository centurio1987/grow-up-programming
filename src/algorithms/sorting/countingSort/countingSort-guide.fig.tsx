/**
 * `countingSort-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 걸음(① 칸 만들기 · ② 세기 ·
 * ③④ 읽어 이어 쓰기 · 반환)은 정본과 같은 절차를 걸음마다 기록하며 다시 실행한 `trace` 가 만들고,
 * 그 기록이 정본의 답과 맞는지 두 곳에서 대조한다 — 마지막 `out` 이 정본의 답과 같은가, 그리고
 * 기록한 `count` 의 칸마다 값이 정본의 답에 그 값이 나온 횟수와 같은가. 걸음 재생 패널의 걸음
 * (`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `countingSort-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { josa, 으로, 을를 } from "../../../../tools/josa.ts";
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
import {
  type ArrayOptions,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { countingSort } from "./countingSort-guide.ref.ts";

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK = [3, 1, 3, 0, 5, 1, 3];

/**
 * 값의 종류 수 — 정본의 `K` 와 같아야 한다. 정본은 그 값을 내보내지 않으므로 실행으로 확인한다.
 * 값 `K − 1` 은 자기 칸을 가져 그대로 나오고, 그 칸 수가 모자라면 값이 사라진다(짚고 가기).
 */
export const K = 1001;
if (countingSort([K - 1, 0]).join(" ") !== `0 ${K - 1}`) {
  throw new Error(`정본이 값 ${K - 1} 을 담지 못한다 — K 가 ${K} 가 아니다`);
}

/** 과제의 칸 수 상한. */
export const BIG = 100_000;

/** 난수를 쓰지 않는 생성식. `A[i] = (i × 37) mod 1001` 이라 값이 0 … 1000 에 고루 놓인다. */
export const spread = (n: number): number[] =>
  Array.from({ length: n }, (_, t) => (t * 37) % K);

export const num = (x: number): string => x.toLocaleString("en-US");
/** `[3 1 3 0 5 1 3]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
export const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;
const same = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((x, k) => x === b[k]);

/* ───────────────────────── 정본과 같은 절차의 걸음 기록 ───────────────────────── */

/** ② 한 걸음 — 인덱스 `i` 의 값 `v` 를 읽고 칸 `v` 를 `before` 에서 `after` 로 고쳤다. */
export interface CountStep {
  readonly i: number;
  readonly v: number;
  readonly before: number;
  readonly after: number;
  /** 이 걸음 뒤의 `count[0..shown−1]`. */
  readonly snapshot: readonly number[];
}

/** ③ 한 걸음 — 칸 `v` 를 읽어 `c` 번 이어 썼다. */
export interface ReadStep {
  readonly v: number;
  readonly c: number;
  /** 이 걸음 뒤의 `out`. */
  readonly out: readonly number[];
}

export interface Trace {
  readonly input: readonly number[];
  /** 그림에 싣는 칸 수 — 입력의 최댓값까지. 나머지 칸은 끝까지 0 이다. */
  readonly shown: number;
  readonly counts: readonly CountStep[];
  /** 칸 `0 … shown−1` 을 읽은 걸음. */
  readonly reads: readonly ReadStep[];
  /** 칸 `shown … K−1` 에서 ④ 가 실행된 횟수 — 0 이어야 한다. */
  readonly restWrites: number;
  readonly out: readonly number[];
}

/**
 * 정본과 같은 절차를 걸음마다 기록하며 실행한다. 정본의 답과 두 곳에서 대조한다 — 어긋나면 이
 * 기록에서 만든 표 · 그림 · 패널이 다른 절차를 잰 것이다.
 */
export function trace(A: readonly number[]): Trace {
  const shown = A.length === 0 ? 0 : Math.max(...A) + 1;
  const count = new Array<number>(K).fill(0);
  const counts: CountStep[] = [];
  A.forEach((v, i) => {
    const before = count[v] as number;
    count[v] = before + 1;
    counts.push({
      i,
      v,
      before,
      after: before + 1,
      snapshot: count.slice(0, shown),
    });
  });
  const out: number[] = [];
  const reads: ReadStep[] = [];
  let restWrites = 0;
  for (let v = 0; v < K; v++) {
    const c = count[v] as number;
    for (let t = c; t > 0; t--) out.push(v);
    if (v < shown) reads.push({ v, c, out: [...out] });
    else restWrites += c;
  }
  const want = countingSort([...A]);
  if (!same(out, want)) {
    throw new Error(`기록한 절차가 정본과 다른 답을 냈다 — ${show(A)}`);
  }
  for (let v = 0; v < K; v++) {
    const inAnswer = want.filter((x) => x === v).length;
    if (count[v] !== inAnswer) {
      throw new Error(`count[${v}] 가 정본의 답에 ${v} 가 나온 횟수와 다르다`);
    }
  }
  return { input: [...A], shown, counts, reads, restWrites, out };
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly stage: ArrayStep;
}

/** 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const RUN_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "입력",
};

const MAP_KEY = "칸 v";
const MAP_VALUE = "count[v]";

/** 무대에 싣지 않는 칸 — 전부 0 이다. */
const restNote = (t: Trace): string => `칸 ${t.shown} … ${K - 1} 은 0`;

const entriesOf = (xs: readonly number[]) => xs.map((c, v) => [v, c] as const);

/** 걸음마다 — ① 칸 만들기 · ② 세기 · ③④ 읽어 이어 쓰기 · 칸이 0 인 나머지 · 반환. */
export function traceSteps(t: Trace): Step[] {
  const n = t.input.length;
  const range: [number, number] | null = n === 0 ? null : [0, n - 1];
  const zeros = new Array<number>(t.shown).fill(0);
  const blank = (k: number) =>
    Array.from({ length: n }, (_, j) => (j < k ? (t.out[j] as number) : null));
  const steps: Omit<Step, "id">[] = [];

  steps.push({
    title: `① count ${num(K)} 칸을 0 으로`,
    detail: `값의 종류가 ${num(K)} 가지라 count 를 ${num(K)} 칸으로 만들고 전부 0 으로 채웁니다. 입력은 아직 한 칸도 읽지 않았습니다.`,
    stage: {
      array: [...t.input],
      range,
      rangeSide: `읽음 0 / ${n}`,
      read: [],
      write: [],
      layers: [{ name: "out", values: blank(0) }],
      map: {
        keyLabel: MAP_KEY,
        valueLabel: MAP_VALUE,
        entries: entriesOf(zeros),
        slots: t.shown,
        write: zeros.map((_, v) => v),
        note: restNote(t),
      },
      calc: { expr: `new Array(${K}).fill(0)`, result: "합 0" },
      vars: null,
    },
  });

  for (const s of t.counts) {
    steps.push({
      title: `② i=${s.i} — 값 ${s.v}${을를(s.v)} 센다`,
      detail: `A[${s.i}] = ${s.v} 이므로 칸 ${s.v} 의 개수를 ${s.before} 에서 ${s.after}${으로(s.after)} 올립니다. 다른 값과 비교하지 않습니다.`,
      stage: {
        array: [...t.input],
        range,
        rangeSide: `읽음 ${s.i + 1} / ${n}`,
        read: [s.i],
        write: [],
        pointers: { i: s.i },
        layers: [{ name: "out", values: blank(0) }],
        map: {
          keyLabel: MAP_KEY,
          valueLabel: MAP_VALUE,
          entries: entriesOf(s.snapshot),
          slots: t.shown,
          write: [s.v],
          note: restNote(t),
        },
        calc: { expr: `count[${s.v}] + 1`, result: String(s.after) },
        vars: `합 ${s.i + 1}`,
      },
    });
  }

  const last = t.counts.at(-1)?.snapshot ?? zeros;
  let written = 0;
  for (const r of t.reads) {
    const from = written;
    written = r.out.length;
    const wrote = Array.from({ length: written - from }, (_, k) => from + k);
    steps.push({
      title: r.c === 0 ? `③ v=${r.v} — ④ 없음` : `③ v=${r.v} — ④ ${r.c} 번`,
      detail:
        r.c === 0
          ? `count[${r.v}] = 0 이라 t > 0 이 처음부터 거짓입니다. out 에 아무것도 쓰지 않습니다.`
          : `count[${r.v}] = ${r.c}${josa(r.c, "이라", "라")} ④ 가 ${r.c} 번 실행되어 out 에 ${r.v}${을를(r.v)} ${r.c} 번 이어 씁니다.`,
      stage: {
        array: [...t.input],
        range,
        rangeSide: `읽음 ${n} / ${n}`,
        read: [],
        write: [],
        layers: [{ name: "out", values: blank(written), write: wrote }],
        map: {
          keyLabel: MAP_KEY,
          valueLabel: MAP_VALUE,
          entries: entriesOf(last),
          slots: t.shown,
          read: [r.v],
          note: restNote(t),
        },
        calc: { expr: `count[${r.v}]`, result: `${r.c} 번` },
        vars: `out ${written} 칸`,
      },
    });
  }

  steps.push({
    title: `③ v=${t.shown} … ${K - 1} — ④ 없음`,
    detail: `남은 칸 ${num(K - t.shown)} 개는 모두 0 이라 ③ 은 실행되지만 ④ 는 한 번도 실행되지 않습니다. v = ${K} 에서 v < K 가 거짓이 되어 반복이 끝납니다.`,
    stage: {
      array: [...t.input],
      range,
      rangeSide: `읽음 ${n} / ${n}`,
      read: [],
      write: [],
      layers: [{ name: "out", values: blank(written) }],
      map: {
        keyLabel: MAP_KEY,
        valueLabel: MAP_VALUE,
        entries: entriesOf(last),
        slots: t.shown,
        note: `${restNote(t)} — ④ ${t.restWrites} 번`,
      },
      calc: { expr: `count[${t.shown}..${K - 1}]`, result: "모두 0" },
      vars: `out ${written} 칸`,
    },
  });

  steps.push({
    title: "반환",
    detail: `out = ${show(t.out)} 을 돌려줍니다. 입력 A 는 ${show(t.input)} 그대로입니다.`,
    stage: {
      array: [...t.input],
      range,
      rangeSide: `읽음 ${n} / ${n}`,
      read: [],
      write: [],
      layers: [{ name: "out", values: [...t.out] }],
      map: {
        keyLabel: MAP_KEY,
        valueLabel: MAP_VALUE,
        entries: entriesOf(last),
        slots: t.shown,
        note: restNote(t),
      },
      calc: { expr: "return out", result: show(t.out) },
      vars: `out ${t.out.length} 칸`,
    },
  });
  return steps.map((s, k) => ({ id: `T${k + 1}`, ...s }));
}

/** 본문 전개의 걸음 — 필름 · 표 · 패널이 같은 번호를 쓴다. */
export const walkSteps = (): Step[] => traceSteps(trace(WALK));

const film = (steps: readonly Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(s.stage, RUN_OPTIONS),
  }));

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행과 대조한 기록에서 만든다. `.sim.ts` 의 `steps` 는
 * 이 결과를 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이
 * 같은지는 `countingSort-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    walk7: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

/** 모든 쌍 비교의 비교 횟수 — 증명 사이드카가 작은 칸 수에서 실행과 같음을 확인한 식이다. */
export const allPairs = (n: number): number => (n * (n - 1)) / 2;

/** 값 `v` 마다 입력 전체를 다시 읽어 세는 후보의 칸 접근 — 초기화 K · 값마다 N 번 읽기와 한 번 쓰기. */
export function rescanAccess(A: readonly number[], k = K): number {
  let access = k;
  for (let v = 0; v < k; v++) {
    for (let i = 0; i < A.length; i++) access += 1;
    access += 1;
  }
  return access;
}

/** 정본 절차의 칸 접근 — 초기화 K · 원소마다 세 번 · 칸마다 한 번 읽기 · 결과 N 번 쓰기. */
export function countingAccess(A: readonly number[], k = K): number {
  let access = k;
  const count = new Array<number>(k).fill(0);
  for (const v of A) {
    access += 3;
    count[v] = (count[v] as number) + 1;
  }
  for (let v = 0; v < k; v++) {
    access += 1;
    access += count[v] as number;
  }
  return access;
}

/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toFixed(2)} 초`;

function approaches(): Approach[] {
  const A = spread(BIG);
  const pairs = allPairs(BIG);
  const rescan = rescanAccess(A);
  const mine = countingAccess(A);
  return [
    {
      name: "모든 쌍 비교하기",
      idea: "두 칸을 골라 앞이 크면 맞바꾸는 일을 모든 쌍에 한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `비교 ${num(pairs)} 번 · ${secondsOf(pairs)}`,
          ok: false,
        },
      ],
      lesson:
        "답을 정하는 것은 값마다의 개수다 — 순서를 비교로 만들지 말고 개수를 세면 어떨까",
    },
    {
      name: "값마다 입력을 다시 읽어 세기",
      idea: "값 v 하나마다 입력 전체를 읽어 v 가 몇 개인지 센다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `칸 접근 ${num(rescan)} 번 · ${secondsOf(rescan)} · 예산을 다 쓴다`,
          ok: false,
        },
      ],
      lesson:
        "값 하나를 읽을 때 그 값의 칸을 바로 찾을 수 있으면 입력을 한 번만 읽어도 된다",
    },
    {
      name: "값을 칸 번호로 써서 한 번에 세기",
      idea: "값 v 를 그대로 count 의 칸 번호로 써서 읽는 자리에서 개수를 올린다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `칸 접근 ${num(mine)} 번 · 비교 0 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 전체 컨셉 — 입력 · count(칸 0 … 최댓값) · out 을 한 장에. */
function conceptRows(t: Trace): StageRow[] {
  const last = t.counts.at(-1)?.snapshot ?? [];
  return [
    { kind: "index", label: "인덱스 i" },
    {
      kind: "cells",
      label: "A",
      values: [...t.input],
      side: `N = ${t.input.length}`,
    },
    {
      kind: "cells",
      label: "칸 번호 v",
      values: last.map((_, v) => v),
    },
    {
      kind: "cells",
      label: "count[v]",
      values: [...last],
      side: `${restNote(t)} · 합 ${last.reduce((a, b) => a + b, 0)}`,
    },
    { kind: "cells", label: "out", values: [...t.out], side: "칸 번호 순서로" },
  ];
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-count": () => {
    const t = trace(WALK);
    return (
      <CellStage
        title={`${show(WALK)} 을 한 번 읽어 count 를 채우고, 칸 번호 순서로 읽어 out 을 쓴다`}
        rows={conceptRows(t)}
        columns={WALK.length}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`칸 ${num(BIG)} 개 · 값 0 이상 ${K - 1} 이하의 정수 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "walk-count": () => {
    const steps = walkSteps();
    return (
      <CellStageFilm
        title={`countingSort([${WALK.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={WALK.length}
        frames={film(steps)}
      />
    );
  },
};
