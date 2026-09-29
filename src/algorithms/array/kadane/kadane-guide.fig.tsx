/**
 * `kadane-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 최댓값을 갱신하는 줄 뒤에 기록을
 * 끼운 계측 사본(`carryProbe`)을 정본 소스에서 기계로 만들고, 그 기록으로 칸마다의 `prev` · `best` 를
 * 얻는다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과
 * 같은지는 `kadane-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
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
import { kadane } from "./kadane-guide.ref.ts";

const REF = new URL("./kadane-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  kadane(A: number[]): number;
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 최댓값을 갱신하는 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 그 줄에 닿은 시점에는 `prev` 가 이미 칸 `i` 의 값으로 바뀌어 있으므로,
 * 기록 하나가 반복 한 바퀴가 끝난 상태다.
 */
const carryProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)best = Math\.max\(best, prev\);$/,
    "$1best = Math.max(best, prev);\n$1(globalThis as any).__carry.push({ i, prev, best });",
  ],
});

/** 반복 한 바퀴가 끝난 상태. 칸 0 은 반복 전에 정해지므로 `i = 0` 기록을 앞에 따로 둔다. */
export interface Round {
  readonly i: number;
  /** 새로 시작하는 갈래 — `A[i]` 하나. */
  readonly fresh: number;
  /** 이어 붙이는 갈래 — 직전 `prev` 에 `A[i]` 를 더한 값. 칸 0 에는 없다. */
  readonly joined: number | null;
  /** 이 바퀴가 끝난 뒤의 `prev` — 칸 `i` 에서 끝나는 최대합. */
  readonly prev: number;
  /** 이 바퀴가 끝난 뒤의 `best`. */
  readonly best: number;
  /** `prev` 를 만든 구간의 왼쪽 끝. 두 갈래가 같으면 새로 시작한 쪽(짧은 쪽)으로 센다. */
  readonly start: number;
  /** `best` 를 만든 구간. */
  readonly bestRange: readonly [number, number];
}

/** 칸 `r` 에서 끝나는 후보 `[l, r]` 의 합을 전부 — 정의를 그대로 센다. */
export function endingSums(A: readonly number[], r: number): number[] {
  const out: number[] = [];
  for (let l = 0; l <= r; l++) {
    let s = 0;
    for (let k = l; k <= r; k++) s += A[k] as number;
    out.push(s);
  }
  return out;
}

/** 칸 0 부터 칸 `r` 까지만 놓고 본 답 — 모든 `(l, r')` 쌍을 센다. */
export function bestUpTo(A: readonly number[], r: number): number {
  let best = A[0] as number;
  for (let rr = 0; rr <= r; rr++) {
    for (const s of endingSums(A, rr)) best = Math.max(best, s);
  }
  return best;
}

/**
 * 정본 한 번 호출의 기록. 답은 정본과 대조하고, 바퀴마다 `prev` 는 정의(칸 `i` 에서 끝나는 후보의
 * 최댓값)와, `best` 는 정의(칸 `i` 까지의 답)와 대조한다.
 */
export function trace(A: readonly number[]): Round[] {
  const g = globalThis as unknown as {
    __carry: { i: number; prev: number; best: number }[];
  };
  g.__carry = [];
  const probed = carryProbe.kadane([...A]);
  const got = [...g.__carry];
  if (probed !== kadane([...A])) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  if (got.length !== A.length - 1 || got.some((c, k) => c.i !== k + 1)) {
    throw new Error("반복의 바퀴 수가 칸 수 − 1 과 다르다");
  }
  const first = A[0] as number;
  const rounds: Round[] = [
    {
      i: 0,
      fresh: first,
      joined: null,
      prev: first,
      best: first,
      start: 0,
      bestRange: [0, 0],
    },
  ];
  for (const c of got) {
    const before = rounds[rounds.length - 1] as Round;
    const fresh = A[c.i] as number;
    const joined = before.prev + fresh;
    const start = fresh >= joined ? c.i : before.start;
    const bestRange: readonly [number, number] =
      c.best > before.best ? [start, c.i] : before.bestRange;
    rounds.push({
      i: c.i,
      fresh,
      joined,
      prev: c.prev,
      best: c.best,
      start,
      bestRange,
    });
  }
  for (const r of rounds) {
    const ending = endingSums(A, r.i);
    if (r.prev !== Math.max(...ending)) {
      throw new Error(`칸 ${r.i} 의 prev ${r.prev} 이 정의와 다르다`);
    }
    if (r.prev !== ending[r.start]) {
      throw new Error(`칸 ${r.i} 의 prev 구간이 합과 맞지 않는다`);
    }
    if (r.best !== bestUpTo(A, r.i)) {
      throw new Error(`칸 ${r.i} 의 best ${r.best} 이 정의와 다르다`);
    }
  }
  return rounds;
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/**
 * 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). 두 갈래가 다 나오고, 음수가 넷 섞여 있고,
 * 답이 마지막 칸이 아니라 칸 6 에서 만들어진다.
 */
export const WALK: readonly number[] = [-2, 1, -3, 4, -1, 2, 1, -5, 4];

/** 과제 규모 — 배열 길이의 상한. */
export const N_MAX = 100_000;

export const num = (x: number): string => x.toLocaleString("en-US");

/** 단순 연산 1 초에 1 억 번 기준. */
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toLocaleString("en-US", { maximumSignificantDigits: 3 })} 초`;

/** `[3,6]` 꼴 — 인덱스 구간. */
export const span = (r: readonly [number, number]): string =>
  `[${r[0]},${r[1]}]`;

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** `prev` 를 만든 구간. */
  readonly range: readonly [number, number];
  readonly readA: readonly number[];
  /** 이 걸음이 끝난 뒤의 `dp` 줄 — 칸마다 끝나는 최대합. 아직 안 정한 칸은 `null`. */
  readonly dp: readonly (number | null)[];
  readonly readDp: readonly number[];
  readonly writeDp: readonly number[];
  /** 이 걸음이 끝난 뒤의 `best` 줄 — 칸마다 그때까지의 최댓값. */
  readonly best: readonly (number | null)[];
  readonly readBest: readonly number[];
  readonly writeBest: readonly number[];
  readonly bestRange: readonly [number, number];
  readonly pointer: number;
  readonly calc: { readonly expr: string; readonly result: string };
}

const paren = (x: number): string => (x < 0 ? `(${x})` : String(x));

/** 전개의 걸음 — 첫 칸 한 걸음 + 반복 `N − 1` 걸음 + 반복을 마치는 한 걸음. */
export function walkSteps(A: readonly number[] = WALK): Step[] {
  const rounds = trace(A);
  const n = A.length;
  const dp: (number | null)[] = new Array<null>(n).fill(null);
  const best: (number | null)[] = new Array<null>(n).fill(null);
  const first = rounds[0] as Round;
  dp[0] = first.prev;
  best[0] = first.best;
  const steps: Step[] = [
    {
      id: "T1",
      title: "i = 0 · ①",
      detail: `prev 와 best 를 둘 다 A[0] = ${first.prev}${으로(first.prev)} 둡니다. 칸 0 에서 끝나는 부분 배열은 [0,0] 하나뿐입니다.`,
      range: [0, 0],
      readA: [0],
      dp: [...dp],
      readDp: [],
      writeDp: [0],
      best: [...best],
      readBest: [],
      writeBest: [0],
      bestRange: first.bestRange,
      pointer: 0,
      calc: { expr: "prev = best = A[0]", result: String(first.prev) },
    },
  ];
  for (const r of rounds.slice(1)) {
    const before = rounds[r.i - 1] as Round;
    dp[r.i] = r.prev;
    best[r.i] = r.best;
    const restart = r.start === r.i;
    const branch = restart ? "새로 시작" : "이어 붙이기";
    const moved =
      r.best > before.best
        ? `best 는 ${before.best} 에서 ${r.best}${으로(r.best)} 커집니다.`
        : `best 는 ${r.best} 그대로입니다.`;
    steps.push({
      id: `T${steps.length + 1}`,
      title: `i = ${r.i} · ${branch}`,
      detail: `새로 시작하면 ${r.fresh}, 이어 붙이면 ${paren(before.prev)} + ${paren(r.fresh)} = ${r.joined} 입니다. 큰 쪽 ${r.prev}${이가(r.prev)} 칸 ${r.i} 에서 끝나는 최대합이고(③ ${branch}), ${moved}`,
      range: [r.start, r.i],
      readA: [r.i],
      dp: [...dp],
      readDp: [r.i - 1],
      writeDp: [r.i],
      best: [...best],
      readBest: [r.i - 1],
      writeBest: r.best > before.best ? [r.i] : [],
      bestRange: r.bestRange,
      pointer: r.i,
      calc: {
        expr: `max(${r.fresh}, ${paren(before.prev)} + ${paren(r.fresh)})`,
        result: String(r.prev),
      },
    });
  }
  const last = rounds[rounds.length - 1] as Round;
  steps.push({
    id: `T${steps.length + 1}`,
    title: `i = ${n} · 반복 끝`,
    detail: `i = ${n}${josa(n, "이라", "라")} ② 의 조건 i < ${n}${이가(n)} 거짓입니다. 반복을 마치고 best = ${last.best}${을를(last.best)} 돌려줍니다. 이 값을 만든 구간은 ${span(last.bestRange)} 입니다.`,
    range: [last.start, last.i],
    readA: [],
    dp: [...dp],
    readDp: [],
    writeDp: [],
    best: [...best],
    readBest: [n - 1],
    writeBest: [],
    bestRange: last.bestRange,
    pointer: n,
    calc: { expr: `${n} < ${n}`, result: "거짓" },
  });
  return steps;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "prev",
};

/** 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
function arrayStep(s: Step, A: readonly number[] = WALK): ArrayStep {
  return {
    array: [...A],
    range: [s.range[0], s.range[1]],
    read: [...s.readA],
    write: [],
    pointers: { i: s.pointer },
    calc: { ...s.calc },
    vars: null,
    layers: [
      {
        name: "dp",
        values: [...s.dp],
        read: [...s.readDp],
        write: [...s.writeDp],
      },
      {
        name: "best",
        values: [...s.best],
        read: [...s.readBest],
        write: [...s.writeBest],
        side: `구간 ${span(s.bestRange)}`,
      },
    ],
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `kadane-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    carry: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...arrayStep(s),
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 계측기 ───────────────── */

export interface Counted {
  readonly answer: number;
  readonly adds: number;
  readonly cmps: number;
}

/**
 * 모든 `(l, r)` 쌍의 합을 각각 만드는 방식. 정의를 그대로 옮긴 것이라 답의 기준이 되고, 쌍 하나마다
 * 덧셈 한 번과 비교 한 번을 센다.
 */
export function byAllPairs(A: readonly number[]): Counted {
  let best = A[0] as number;
  let adds = 0;
  let cmps = 0;
  for (let l = 0; l < A.length; l++) {
    let s = 0;
    for (let r = l; r < A.length; r++) {
      adds++;
      s += A[r] as number;
      cmps++;
      best = Math.max(best, s);
    }
  }
  return { answer: best, adds, cmps };
}

/**
 * 정본과 같은 절차에 계수만 덧붙인 것. 칸 하나마다 덧셈 한 번(이어 붙이기)과 비교 두 번(갈래 고르기 ·
 * 최댓값 갱신)이다. 답은 정본과 대조한다.
 */
export function byCarrying(A: readonly number[]): Counted {
  let prev = A[0] as number;
  let best = A[0] as number;
  let adds = 0;
  let cmps = 0;
  for (let i = 1; i < A.length; i++) {
    adds++;
    const joined = prev + (A[i] as number);
    cmps++;
    prev = Math.max(A[i] as number, joined);
    cmps++;
    best = Math.max(best, prev);
  }
  if (best !== kadane([...A]))
    throw new Error("계측기가 정본과 다른 답을 냈다");
  return { answer: best, adds, cmps };
}

/** 가장 단순한 후보 — 누적이 음수가 되면 0 으로 끊고 다시 시작한다. */
export function resetAtZero(A: readonly number[]): number {
  let s = 0;
  let best = 0;
  for (const x of A) {
    s = Math.max(0, s + x);
    best = Math.max(best, s);
  }
  return best;
}

/** 값이 전부 음수인 입력 — 0 으로 끊는 후보가 어긋나는 자리를 그림에 싣는다. */
export const ALL_NEGATIVE: readonly number[] = [-3, -1, -4, -2];

function approaches(): Approach[] {
  const pairs = byAllPairs(WALK);
  const carry = byCarrying(WALK);
  const bigPairs = N_MAX * (N_MAX + 1);
  const bigCarry = 3 * (N_MAX - 1);
  const zero = resetAtZero(ALL_NEGATIVE);
  const right = kadane([...ALL_NEGATIVE]);
  return [
    {
      name: "모든 쌍 만들기",
      idea: "왼쪽 끝 l 과 오른쪽 끝 r 을 모두 골라 합을 만들고, 그중 최댓값을 고른다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `맞다 · 아홉 칸 입력에서 기본 연산 ${num(pairs.adds + pairs.cmps)} 번`,
          ok: true,
        },
        {
          label: "시간",
          value: `N = ${num(N_MAX)} 이면 기본 연산 ${num(bigPairs)} 번 · ${secondsOf(bigPairs)}`,
          ok: false,
        },
      ],
      lesson:
        "같은 칸에서 끝나는 후보를 처음부터 다시 더한다 — 앞 칸의 결과를 이어 쓰면 어떨까",
    },
    {
      name: "음수가 되면 0 으로 끊기",
      idea: "누적 합에 값을 하나씩 더하다가 음수가 되면 0 으로 되돌리고 다시 시작한다",
      verdict: "drop",
      checks: [
        { label: "시간", value: "칸마다 덧셈 하나와 비교 둘", ok: true },
        {
          label: "답",
          value: `[${ALL_NEGATIVE.join(" ")}] 에서 ${zero} · 정답은 ${right}`,
          ok: false,
        },
      ],
      lesson:
        "0 은 아무 칸도 안 고른 합이다 — 끊는 자리를 그 칸의 값으로 잡으면 어떨까",
    },
    {
      name: "칸마다 이어받기",
      idea: "칸 i 에서 끝나는 최대합을 직전 칸의 값에서 두 갈래 중 큰 쪽으로 정하고, 지나온 값의 최댓값을 따로 든다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `맞다 · 아홉 칸 입력에서 기본 연산 ${num(carry.adds + carry.cmps)} 번`,
          ok: true,
        },
        {
          label: "시간",
          value: `N = ${num(N_MAX)} 이면 기본 연산 ${num(bigCarry)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 칸 `i` 에서 끝나는 후보를 모두 그리는 그림의 칸 — 「먼저 알아 둘 개념」 (b). */
export const CANDIDATE_END = 6;

/** 「먼저 알아 둘 개념」 (d) 와 2단계가 그리는 칸 셋 — 새로 시작 · 음수여도 이어 붙임 · 이어 붙임. */
export const EXTEND_CELLS: readonly number[] = [3, 4, 6];

export const FIGS: Record<string, () => ReactElement> = {
  "concept-rows": () => {
    const rounds = trace(WALK);
    const last = rounds[rounds.length - 1] as Round;
    const [from, to] = last.bestRange;
    const answer: Partial<Record<number, CellState>> = {};
    for (let k = from; k <= to; k++) answer[k] = "read";
    const rows: StageRow[] = [
      {
        kind: "bracket",
        label: "답",
        from,
        to,
        tone: "query",
        text: `${span(last.bestRange)} · 합 ${last.best}`,
      },
      { kind: "index", label: "인덱스" },
      { kind: "cells", label: "A", values: [...WALK], states: answer },
      {
        kind: "cells",
        label: "dp",
        values: rounds.map((r) => r.prev),
        states: { [to]: "focus" },
        side: "칸 i 에서 끝나는 최대합",
      },
      {
        kind: "cells",
        label: "best",
        values: rounds.map((r) => r.best),
        side: "칸 i 까지의 최댓값",
      },
    ];
    return (
      <CellStage
        title={`A = [${WALK.join(", ")}] 과 칸마다 끝나는 최대합 dp · 그때까지의 최댓값 best`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`N 최대 ${num(N_MAX)} · 1 초(단순 연산 1 초에 1 억 번 기준) · 빈 부분 배열은 후보가 아니다`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-candidates": () => {
    const r = CANDIDATE_END;
    const sums = endingSums(WALK, r);
    const top = Math.max(...sums);
    const at = sums.indexOf(top);
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      { kind: "cells", label: "A", values: [...WALK], states: { [r]: "read" } },
      { kind: "caret", cells: [r], side: `오른쪽 끝 = ${r}` },
    ];
    sums.forEach((s, l) => {
      rows.push({
        kind: "bracket",
        label: `l = ${l}`,
        from: l,
        to: r,
        tone: l === at ? "make" : "left",
        text: `합 ${s}`,
        side: l === at ? "가장 크다" : undefined,
      });
    });
    const dp: (number | null)[] = WALK.map(() => null);
    dp[r] = top;
    rows.push({
      kind: "cells",
      label: "dp",
      values: dp,
      states: { [r]: "focus" },
      side: `dp[${r}] = ${top}`,
    });
    return (
      <CellStage
        title={`칸 ${r} 에서 끝나는 후보 ${sums.length} 개 — 가장 큰 합이 dp[${r}]`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "build-extend": () => {
    const rounds = trace(WALK);
    const frames: StageFrame[] = EXTEND_CELLS.map((i) => {
      const r = rounds[i] as Round;
      const before = rounds[i - 1] as Round;
      const dp: (number | null)[] = WALK.map((_, k) =>
        k <= i ? (rounds[k] as Round).prev : null,
      );
      const restart = r.start === i;
      const rows: StageRow[] = [
        { kind: "index", label: "인덱스" },
        {
          kind: "cells",
          label: "A",
          values: [...WALK],
          states: { [i]: "read" },
        },
        {
          kind: "bracket",
          label: `dp[${i - 1}]`,
          from: before.start,
          to: i - 1,
          tone: "left",
          text: `합 ${before.prev}`,
        },
        {
          kind: "bracket",
          label: `dp[${i}]`,
          from: r.start,
          to: i,
          tone: "make",
          text: `합 ${r.prev}`,
        },
        {
          kind: "cells",
          label: "dp",
          values: dp,
          states: { [i - 1]: "read", [i]: "focus" },
          side: restart ? "새로 시작" : "이어 붙이기",
        },
        { kind: "caret", cells: [i - 1] },
      ];
      return {
        id: `i = ${i}`,
        text: `A[${i}] = ${r.fresh} · dp[${i - 1}] = ${before.prev} → 새로 시작 ${r.fresh} · 이어 붙이기 ${r.joined} → dp[${i}] = ${r.prev}`,
        rows,
      };
    });
    return (
      <CellStageFilm
        title="이웃한 두 칸의 최대합 구간 — dp[i] 의 구간은 dp[i−1] 의 구간에 칸 i 를 붙이거나 칸 i 하나다"
        columns={WALK.length}
        frames={frames}
      />
    );
  },
  "walk-carry": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.calc.expr} = ${s.calc.result}`,
      rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`kadane([${WALK.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(steps[0] as Step))}
        frames={frames}
      />
    );
  },
};
