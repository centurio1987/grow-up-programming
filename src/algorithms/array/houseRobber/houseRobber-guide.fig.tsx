/**
 * `houseRobber-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 두 값을 옮기는 줄 뒤에 기록을 끼운
 * 계측 사본(`carryProbe`)을 정본 소스에서 기계로 만들고, 그 기록으로 칸마다의 `prev` · `cur` 를 얻는다.
 * 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `houseRobber-guide.test.ts` 가 잰다. 증명 사이드카(`.proof.ts`)도 같은 기록을 쓴다.
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
  type GraphEdge,
  type GraphNode,
  NodeGraph,
} from "../../../_viz/patterns/NodeGraph";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { houseRobber } from "./houseRobber-guide.ref.ts";

const REF = new URL("./houseRobber-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  houseRobber(nums: number[]): number;
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * `cur` 를 새로 적는 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 그 줄에 닿은 시점에는 `prev` 와 `cur` 가 이미 한 칸씩 옮겨져 있으므로,
 * 기록 하나가 반복 한 바퀴가 끝난 상태다.
 */
const carryProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)cur = Math\.max\(skip, take\);$/,
    "$1cur = Math.max(skip, take);\n$1(globalThis as any).__carry.push({ i, skip, take, prev, cur });",
  ],
});

/** 칸 `0` 부터 칸 `i` 까지에서 이웃한 두 칸을 함께 담지 않는 선택을 전부 — 정의를 그대로 센다. */
export function admissible(i: number): number[][] {
  if (i < 0) return [[]];
  if (i === 0) return [[], [0]];
  return [...admissible(i - 1), ...admissible(i - 2).map((s) => [...s, i])];
}

/** 선택 하나의 합. */
export const sumOf = (A: readonly number[], s: readonly number[]): number =>
  s.reduce((t, k) => t + (A[k] as number), 0);

/** 정의로 센 `dp[i]` — 칸 0 부터 칸 `i` 까지의 선택 가운데 합이 가장 큰 것의 합. `dp[−1] = 0`. */
export function defined(A: readonly number[], i: number): number {
  let best = 0;
  for (const s of admissible(i)) best = Math.max(best, sumOf(A, s));
  return best;
}

/** 반복 한 바퀴가 끝난 상태. 칸 0 은 반복 전에 정해지므로 `i = 0` 기록을 앞에 따로 둔다. */
export interface Round {
  readonly i: number;
  /** 칸 `i` 를 건너뛴 답 — `dp[i−1]`. 칸 0 에는 없다. */
  readonly skip: number | null;
  /** 칸 `i` 를 고른 답 — `dp[i−2] + A[i]`. 칸 0 에는 없다. */
  readonly take: number | null;
  /** 이 바퀴가 끝난 뒤의 `prev` — `dp[i−1]`. */
  readonly prev: number;
  /** 이 바퀴가 끝난 뒤의 `cur` — `dp[i]`. */
  readonly cur: number;
  /** `cur` 를 만든 선택. 두 갈래가 같으면 건너뛴 쪽(칸 수가 적은 쪽)으로 센다. */
  readonly set: readonly number[];
}

/**
 * 정본 한 번 호출의 기록. 답은 정본과 대조하고, 바퀴마다 `cur` 는 정의로 센 `dp[i]` 와, `prev` 는
 * `dp[i−1]` 과, 선택의 합은 `cur` 와 대조한다. 빈 입력은 반복이 없어 빈 목록이다.
 */
export function trace(A: readonly number[]): Round[] {
  if (A.length === 0) return [];
  const g = globalThis as unknown as {
    __carry: {
      i: number;
      skip: number;
      take: number;
      prev: number;
      cur: number;
    }[];
  };
  g.__carry = [];
  const probed = carryProbe.houseRobber([...A]);
  const got = [...g.__carry];
  if (probed !== houseRobber([...A])) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  if (got.length !== A.length - 1 || got.some((c, k) => c.i !== k + 1)) {
    throw new Error("반복의 바퀴 수가 칸 수 − 1 과 다르다");
  }
  const first = A[0] as number;
  const rounds: Round[] = [
    { i: 0, skip: null, take: null, prev: 0, cur: first, set: [0] },
  ];
  for (const c of got) {
    const back2 = c.i >= 2 ? (rounds[c.i - 2] as Round).set : [];
    const back1 = (rounds[c.i - 1] as Round).set;
    const set = c.take > c.skip ? [...back2, c.i] : [...back1];
    rounds.push({
      i: c.i,
      skip: c.skip,
      take: c.take,
      prev: c.prev,
      cur: c.cur,
      set,
    });
  }
  if (A.length <= 16) {
    for (const r of rounds) {
      if (r.cur !== defined(A, r.i)) {
        throw new Error(`칸 ${r.i} 의 cur ${r.cur} 이 정의와 다르다`);
      }
      if (r.prev !== defined(A, r.i - 1)) {
        throw new Error(`칸 ${r.i} 의 prev ${r.prev} 이 정의와 다르다`);
      }
      if (sumOf(A, r.set) !== r.cur) {
        throw new Error(`칸 ${r.i} 의 선택이 cur 와 맞지 않는다`);
      }
    }
  }
  return rounds;
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/**
 * 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). 두 갈래가 다 나오고(고르는 쪽 넷 · 건너뛰는 쪽
 * 하나), 답이 고른 칸이 이어지지 않은 셋이며, 건너뛰는 걸음에서 `cur` 는 그대로인데 `prev` 는 바뀐다.
 */
export const WALK: readonly number[] = [2, 7, 9, 3, 1, 5];

/** 과제 규모 — 배열 길이의 상한. */
export const N_MAX = 100_000;

/** 칸 값의 상한. */
export const CASH_MAX = 10_000;

export const num = (x: number): string => x.toLocaleString("en-US");

/** `[2 7 9]` 꼴 — 값의 나열이라 쉼표를 쓰지 않는다(인덱스 구간 `[a,b]` 와 가른다). */
export const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;

/** 선택 `{0, 2, 5}` 꼴. 빈 선택은 `{}`. */
export const setText = (s: readonly number[]): string =>
  s.length === 0 ? "{}" : `{${s.join(", ")}}`;

/** 칸 하나를 두 칸 넘게 거르며 고르는 후보 — 짝수 번째 칸의 합과 홀수 번째 칸의 합 중 큰 쪽. */
export function byAlternating(A: readonly number[]): number {
  let even = 0;
  let odd = 0;
  for (let i = 0; i < A.length; i++) {
    if (i % 2 === 0) even += A[i] as number;
    else odd += A[i] as number;
  }
  return Math.max(even, odd);
}

/** 값이 큰 칸부터 고르되 옆 칸이 이미 골라졌으면 건너뛰는 후보. 같은 값이면 앞 칸부터. */
export function byGreedy(A: readonly number[]): number {
  const order = A.map((v, i) => [v, i] as [number, number]).sort(
    (a, b) => b[0] - a[0] || a[1] - b[1],
  );
  const taken = new Array<boolean>(A.length).fill(false);
  let sum = 0;
  for (const [v, i] of order) {
    if (taken[i - 1] === true || taken[i + 1] === true) continue;
    taken[i] = true;
    sum += v;
  }
  return sum;
}

/** 두 후보가 어긋나는 입력 — 떠올리는 과정의 그림과 표가 같이 쓴다. */
export const ALTERNATING_BREAK: readonly number[] = [2, 1, 1, 2];
export const GREEDY_BREAK: readonly number[] = [4, 5, 4];

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** 지금까지 놓고 본 칸 `[0, i]`. */
  readonly range: readonly [number, number];
  readonly readA: readonly number[];
  /** 이 걸음이 끝난 뒤의 `dp` 줄 — 칸마다의 최대 합. 아직 안 정한 칸은 `null`. */
  readonly dp: readonly (number | null)[];
  readonly readDp: readonly number[];
  readonly writeDp: readonly number[];
  /** `cur` 를 만든 선택 — 고른 칸은 그 값, 놓고 본 칸 가운데 안 고른 칸은 「·」, 아직 안 본 칸은 `null`. */
  readonly pick: readonly (number | string | null)[];
  readonly writePick: readonly number[];
  readonly pickSide: string;
  readonly pointer: number;
  readonly calc: { readonly expr: string; readonly result: string };
  readonly vars: string | null;
}

function pickRow(
  A: readonly number[],
  upto: number,
  set: readonly number[],
): (number | string | null)[] {
  return A.map((v, k) => (k > upto ? null : set.includes(k) ? v : "·"));
}

/** 전개의 걸음 — 빈 입력 검사와 시작값 한 걸음 + 반복 `N − 1` 걸음 + 반복을 마치는 한 걸음. */
export function walkSteps(A: readonly number[] = WALK): Step[] {
  const rounds = trace(A);
  const n = A.length;
  const dp: (number | null)[] = new Array<null>(n).fill(null);
  const first = rounds[0] as Round;
  dp[0] = first.cur;
  const steps: Step[] = [
    {
      id: "T1",
      title: "i = 0 · ① ②",
      detail: `칸이 ${n} 개라 ① 의 조건 nums.length === 0 이 거짓입니다. prev 를 0 으로, cur 를 A[0] = ${first.cur}${으로(first.cur)} 둡니다.`,
      range: [0, 0],
      readA: [0],
      dp: [...dp],
      readDp: [],
      writeDp: [0],
      pick: pickRow(A, 0, first.set),
      writePick: [0],
      pickSide: `${setText(first.set)} · 합 ${first.cur}`,
      pointer: 0,
      calc: { expr: "cur = A[0]", result: String(first.cur) },
      vars: "prev = 0",
    },
  ];
  for (const r of rounds.slice(1)) {
    const before = rounds[r.i - 1] as Round;
    dp[r.i] = r.cur;
    const skip = r.skip as number;
    const take = r.take as number;
    const took = take > skip;
    const branch = took ? "고른다" : "건너뛴다";
    const moved = took
      ? `고른 쪽이 커서 cur 가 ${r.cur}${이가(r.cur)} 되고`
      : `건너뛴 쪽이 커서 cur 는 ${r.cur} 그대로이고`;
    steps.push({
      id: `T${steps.length + 1}`,
      title: `i = ${r.i} · 칸 ${r.i}${을를(r.i)} ${branch}`,
      detail: `건너뛴 답은 cur = ${skip} 이고, 고른 답은 prev ${before.prev} 에 A[${r.i}] = ${A[r.i]}${을를(A[r.i] as number)} 더한 ${take} 입니다. ${moved}, prev 는 옛 cur ${before.cur}${을를(before.cur)} 받습니다.`,
      range: [0, r.i],
      readA: [r.i],
      dp: [...dp],
      readDp: r.i >= 2 ? [r.i - 2, r.i - 1] : [r.i - 1],
      writeDp: [r.i],
      pick: pickRow(A, r.i, r.set),
      writePick: took ? [r.i] : [],
      pickSide: `${setText(r.set)} · 합 ${r.cur}`,
      pointer: r.i,
      calc: {
        expr: `max(${skip}, ${before.prev} + ${A[r.i]})`,
        result: String(r.cur),
      },
      vars: null,
    });
  }
  const last = rounds[rounds.length - 1] as Round;
  steps.push({
    id: `T${steps.length + 1}`,
    title: `i = ${n} · 반복 끝`,
    detail: `i = ${n}${josa(n, "이라", "라")} ③ 의 조건 i < ${n}${이가(n)} 거짓입니다. 반복을 마치고 cur = ${last.cur}${을를(last.cur)} 돌려줍니다. 이 값을 만든 선택은 ${setText(last.set)} 입니다.`,
    range: [0, n - 1],
    readA: [],
    dp: [...dp],
    readDp: [n - 1],
    writeDp: [],
    pick: pickRow(A, n - 1, last.set),
    writePick: [],
    pickSide: `${setText(last.set)} · 합 ${last.cur}`,
    pointer: n,
    calc: { expr: `${n} < ${n}`, result: "거짓" },
    vars: null,
  });
  return steps;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "놓고 본 칸",
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
    vars: s.vars,
    layers: [
      {
        name: "dp",
        values: [...s.dp],
        read: [...s.readDp],
        write: [...s.writeDp],
      },
      {
        name: "고른 칸",
        values: [...s.pick],
        read: [],
        write: [...s.writePick],
        side: s.pickSide,
      },
    ],
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `houseRobber-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    rob: walkSteps().map((s) => ({
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
 * 부분집합을 전부 만들어 이웃이 섞인 것을 버리는 방식. 정의를 그대로 옮긴 것이라 답의 기준이 되고,
 * 덧셈과 비교를 함께 센다.
 */
export function byAllSubsets(A: readonly number[]): Counted {
  const n = A.length;
  let best = 0;
  let adds = 0;
  let cmps = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let sum = 0;
    let ok = true;
    for (let i = 0; i < n; i++) {
      cmps++; // 이 칸을 골랐는가
      if ((mask & (1 << i)) === 0) continue;
      if (i > 0) {
        cmps++; // 옆 칸도 골랐는가
        if ((mask & (1 << (i - 1))) !== 0) ok = false;
      }
      adds++;
      sum += A[i] as number;
    }
    cmps++; // 지금까지의 최댓값과 비교하기
    if (ok) best = Math.max(best, sum);
  }
  if (best !== houseRobber([...A])) {
    throw new Error("계측기가 정본과 다른 답을 냈다");
  }
  return { answer: best, adds, cmps };
}

/**
 * 정본과 같은 절차에 계수만 덧붙인 것. 칸 하나마다 덧셈 한 번(고른 답 만들기)과 비교 한 번(두 답 중
 * 큰 쪽 고르기)이다. 답은 정본과 대조한다.
 */
export function byCarrying(A: readonly number[]): Counted {
  let adds = 0;
  let cmps = 0;
  if (A.length === 0) return { answer: 0, adds, cmps };
  let prev = 0;
  let cur = A[0] as number;
  for (let i = 1; i < A.length; i++) {
    const skip = cur;
    adds++;
    const take = prev + (A[i] as number);
    prev = cur;
    cmps++;
    cur = Math.max(skip, take);
  }
  if (cur !== houseRobber([...A])) {
    throw new Error("계측기가 정본과 다른 답을 냈다");
  }
  return { answer: cur, adds, cmps };
}

/** 큰 수의 자릿수. */
export const digits = (v: bigint): number => v.toString().length;

function approaches(): Approach[] {
  const all = byAllSubsets(WALK);
  const carry = byCarrying(WALK);
  const bigDigits = digits(BigInt(N_MAX) * 2n ** BigInt(N_MAX));
  const bigCarry = 2 * (N_MAX - 1);
  const alt = byAlternating(ALTERNATING_BREAK);
  const altRight = houseRobber([...ALTERNATING_BREAK]);
  const greedy = byGreedy(GREEDY_BREAK);
  const greedyRight = houseRobber([...GREEDY_BREAK]);
  return [
    {
      name: "부분집합 다 만들기",
      idea: "칸마다 고른다 · 안 고른다를 정한 선택을 모두 만들고, 이웃이 섞인 것을 버린 뒤 최댓값을 고른다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `맞다 · 여섯 칸 입력에서 기본 연산 ${num(all.adds + all.cmps)} 번`,
          ok: true,
        },
        {
          label: "시간",
          value: `N = ${num(N_MAX)} 이면 기본 연산이 ${num(bigDigits)} 자리 수`,
          ok: false,
        },
      ],
      lesson:
        "앞 칸 몇 개까지의 답을 묻는 같은 물음이 되풀이된다 — 한 번에 하나씩 답을 적어 두면 어떨까",
    },
    {
      name: "한 칸 걸러 고르기",
      idea: "짝수 번째 칸만 고른 합과 홀수 번째 칸만 고른 합 중 큰 쪽을 답으로 한다",
      verdict: "drop",
      checks: [
        { label: "시간", value: "칸마다 덧셈 하나", ok: true },
        {
          label: "답",
          value: `${show(ALTERNATING_BREAK)} 에서 ${alt} · 정답은 ${altRight}`,
          ok: false,
        },
      ],
      lesson:
        "두 칸 넘게 걸러 고르는 선택을 버린다 — 거르는 폭을 정하지 않으면 어떨까",
    },
    {
      name: "큰 값부터 고르기",
      idea: "값이 큰 칸부터 보면서 양옆이 비어 있을 때만 고른다",
      verdict: "drop",
      checks: [
        { label: "시간", value: "정렬 한 번과 칸마다 비교 둘", ok: true },
        {
          label: "답",
          value: `${show(GREEDY_BREAK)} 에서 ${greedy} · 정답은 ${greedyRight}`,
          ok: false,
        },
      ],
      lesson:
        "한 번 고른 칸을 되돌리지 못한다 — 칸마다 고른 경우와 건너뛴 경우를 둘 다 들고 가면 어떨까",
    },
    {
      name: "두 값 이어받기",
      idea: "칸 i 까지의 최대 합을 건너뛴 답(한 칸 앞)과 고른 답(두 칸 앞 + A[i]) 중 큰 쪽으로 정하고, 마지막 두 칸의 값만 들고 간다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `맞다 · 여섯 칸 입력에서 기본 연산 ${num(carry.adds + carry.cmps)} 번`,
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

/** 「먼저 알아 둘 개념」 (b) 가 선택을 모두 그리는 칸. */
export const CANDIDATE_END = 3;

/** 「먼저 알아 둘 개념」 (d) 가 그리는 칸 셋 — 고른다 · 건너뛴다 · 고른다. */
export const NEIGHBOR_CELLS: readonly number[] = [2, 3, 5];

/** 선택 하나를 한 줄로 — 고른 칸만 값을 진하게, 놓고 본 칸 가운데 안 고른 칸은 흐리게, 그 뒤는 비운다. */
function selectionRow(
  label: string,
  set: readonly number[],
  upto: number,
  side: string,
  strong: boolean,
): StageRow {
  const states: Partial<Record<number, CellState>> = {};
  const values = WALK.map((v, k) => (k > upto ? null : v));
  WALK.forEach((_, k) => {
    if (k > upto) return;
    states[k] = set.includes(k) ? (strong ? "focus" : "read") : "out";
  });
  return { kind: "cells", label, values, states, side };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-rows": () => {
    const rounds = trace(WALK);
    const last = rounds[rounds.length - 1] as Round;
    const answer: Partial<Record<number, CellState>> = {};
    for (const k of last.set) answer[k] = "read";
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      {
        kind: "cells",
        label: "A",
        values: [...WALK],
        states: answer,
        side: `고른 칸 ${setText(last.set)}`,
      },
      {
        kind: "cells",
        label: "dp",
        values: rounds.map((r) => r.cur),
        states: { [WALK.length - 1]: "focus" },
        side: "칸 i 까지의 최대 합",
      },
    ];
    return (
      <CellStage
        title={`A = [${WALK.join(", ")}] 와 칸마다의 최대 합 dp — 마지막 칸 dp[${WALK.length - 1}] = ${last.cur} 이 답`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`N 최대 ${num(N_MAX)} · 1 초(단순 연산 1 초에 1 억 번 기준) · 빈 선택도 후보다`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-candidates": () => {
    const r = CANDIDATE_END;
    const sets = admissible(r);
    const sums = sets.map((s) => sumOf(WALK, s));
    const top = Math.max(...sums);
    const at = sums.indexOf(top);
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      {
        kind: "cells",
        label: "A",
        values: WALK.map((v, k) => (k > r ? null : v)),
        side: `칸 0 부터 칸 ${r} 까지`,
      },
    ];
    sets.forEach((s, k) => {
      rows.push(
        selectionRow(
          setText(s),
          s,
          r,
          k === at ? `합 ${sums[k]} · 가장 크다` : `합 ${sums[k]}`,
          k === at,
        ),
      );
    });
    return (
      <CellStage
        title={`칸 ${r} 까지의 선택 ${sets.length} 가지 — 가장 큰 합 ${top} 이 dp[${r}]`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "build-neighbors": () => {
    const rounds = trace(WALK);
    const frames: StageFrame[] = NEIGHBOR_CELLS.map((i) => {
      const r = rounds[i] as Round;
      const b1 = rounds[i - 1] as Round;
      const b2 = i >= 2 ? (rounds[i - 2] as Round) : null;
      const took = (r.take as number) > (r.skip as number);
      const rows: StageRow[] = [
        { kind: "index", label: "인덱스" },
        {
          kind: "cells",
          label: "A",
          values: WALK.map((v, k) => (k > i ? null : v)),
          states: { [i]: "read" },
        },
        selectionRow(
          `dp[${i - 2}]`,
          b2?.set ?? [],
          i - 2,
          `합 ${b2?.cur ?? 0} · 칸 ${i} 를 더하면 ${r.take}`,
          false,
        ),
        selectionRow(
          `dp[${i - 1}]`,
          b1.set,
          i - 1,
          `합 ${b1.cur} · 그대로 쓰면 ${r.skip}`,
          false,
        ),
        selectionRow(
          `dp[${i}]`,
          r.set,
          i,
          `합 ${r.cur} · ${took ? "고른 쪽" : "건너뛴 쪽"}`,
          true,
        ),
      ];
      return {
        id: `i = ${i}`,
        text: `건너뛴 답 dp[${i - 1}] = ${r.skip} · 고른 답 dp[${i - 2}] + A[${i}] = ${r.take} → dp[${i}] = ${r.cur}`,
        rows,
      };
    });
    return (
      <CellStageFilm
        title="이웃한 칸의 최대 합 — dp[i] 의 선택은 dp[i−1] 의 선택이거나 dp[i−2] 의 선택에 칸 i 를 더한 것"
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
        title={`houseRobber([${WALK.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(steps[0] as Step))}
        frames={frames}
      />
    );
  },
  "related-path": () => {
    const rounds = trace(WALK);
    const last = rounds[rounds.length - 1] as Round;
    const nodes: GraphNode[] = WALK.map((v, k) => ({
      id: k,
      x: k,
      y: 0,
      label: `칸 ${k}`,
      value: `A = ${v}`,
      state: last.set.includes(k) ? "focus" : undefined,
    }));
    const edges: GraphEdge[] = WALK.slice(1).map((_, k) => ({
      from: k,
      to: k + 1,
    }));
    return (
      <NodeGraph
        title={`칸을 점으로, 함께 못 고르는 두 칸을 선으로 — 강조한 점 ${setText(last.set)} 이 합 ${last.cur} 의 선택`}
        nodes={nodes}
        edges={edges}
        directed={false}
        unit={{ x: 96, y: 84 }}
      />
    );
  },
};
