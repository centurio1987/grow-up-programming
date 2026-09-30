/**
 * `mosAlgorithm-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림과 증명 블록에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다.
 *
 * - **창의 걸음** — 정본에 `Proxy` 로 감싼 배열을 넘겨, 창이 한 칸 옮길 때마다 읽는 `arr` 의 칸을
 *   차례대로 기록한다. 정본 소스에서 기계로 만든 계측 사본(`probed`)은 답을 적는 줄 바로 뒤에서 그
 *   순간의 창 · `count` · `distinct` 를 기록한다. 두 기록을 맞대어 걸음마다 무엇을 넣고 뺐는지 정하고,
 *   질의마다 셈 상태가 정본의 기록과 같은지 대조한다(`trace`).
 * - **정렬된 차례** — 정렬 바로 뒤에서 차례와 블록 크기를 기록하고 멈추는 계측 사본(`sortOnly`)이 낸다.
 *   큰 입력에서는 창을 실제로 옮기지 않고 이 차례에서 두 끝의 이동 칸만 센다(`moves`) — 걸음마다
 *   기록을 남기면 메모리가 모자란다. 두 셈이 같은지는 작은 입력에서 대조한다.
 *
 * 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과
 * 같은지는 `mosAlgorithm-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 을를, 이가 } from "../../../../tools/josa.ts";
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
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { mosAlgorithm } from "./mosAlgorithm-guide.ref.ts";

const REF = new URL("./mosAlgorithm-guide.ref.ts", import.meta.url).pathname;

type Query = [number, number];
/** 정본이 정렬하는 질의 한 벌 — 원래 자리 `i` 를 함께 든다. */
export interface Tagged {
  readonly l: number;
  readonly r: number;
  readonly i: number;
}

interface Hooks {
  answer?: (
    q: Tagged,
    curL: number,
    curR: number,
    distinct: number,
    count: [number, number][],
  ) => void;
  order?: (order: Tagged[], block: number) => void;
  stop?: boolean;
}
const hooks = (): { __mo?: Hooks } => globalThis as unknown as { __mo?: Hooks };

/**
 * 답을 적는 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지 않으면
 * `loadMutant` 가 던진다.
 */
const probed = await loadMutant<{ mosAlgorithm: typeof mosAlgorithm }>(REF, {
  swap: [
    /^(\s*)out\[q\.i\] = distinct;$/,
    "$1out[q.i] = distinct;\n$1(globalThis as any).__mo?.answer?.({ ...q }, curL, curR, distinct, [...count]);",
  ],
});

/** 정렬 바로 뒤에서 차례와 블록 크기를 기록하는 사본. `stop` 이면 창을 옮기지 않고 끝낸다. */
const sortOnly = await loadMutant<{ mosAlgorithm: typeof mosAlgorithm }>(REF, {
  swap: [
    /^(\s*)const count = new Map<number, number>\(\);$/,
    "$1(globalThis as any).__mo?.order?.(order.map((q) => ({ ...q })), block);\n$1if ((globalThis as any).__mo?.stop === true) return [];\n$1const count = new Map<number, number>();",
  ],
});

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 창의 끝을 한 칸 옮긴 일 하나. */
export type Branch = "L+" | "R+" | "L−" | "R−";
export interface Move {
  readonly branch: Branch;
  /** 넣거나 뺀 칸. */
  readonly k: number;
  readonly value: number;
  /** 옮기기 전과 뒤의 창. */
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
  /** 옮긴 뒤의 `count` 맵(키를 처음 넣은 순서)과 `distinct`. */
  readonly count: readonly (readonly [number, number])[];
  readonly distinct: number;
  /** 이 칸의 값 개수가 옮기기 전후에 어떻게 바뀌었나. */
  readonly before: number;
  readonly after: number;
}

export interface QueryRun {
  /** 처리 차례(0 부터). */
  readonly step: number;
  readonly q: Tagged;
  readonly moves: readonly Move[];
  /** 이 질의를 시작할 때의 창. */
  readonly start: readonly [number, number];
  readonly distinct: number;
  readonly count: readonly (readonly [number, number])[];
}

export interface Trace {
  readonly block: number;
  readonly order: readonly Tagged[];
  readonly runs: readonly QueryRun[];
  readonly out: readonly number[];
}

/** 한 질의에서 네 갈래가 읽어야 하는 칸 — 정본의 네 `while` 이 이 차례로 읽는다. */
export function expectedReads(
  curL: number,
  curR: number,
  q: Tagged,
): { branch: Branch; k: number; to: [number, number] }[] {
  const out: { branch: Branch; k: number; to: [number, number] }[] = [];
  let L = curL;
  let R = curR;
  while (L > q.l) {
    L--;
    out.push({ branch: "L+", k: L, to: [L, R] });
  }
  while (R < q.r) {
    R++;
    out.push({ branch: "R+", k: R, to: [L, R] });
  }
  while (L < q.l) {
    out.push({ branch: "L−", k: L, to: [L + 1, R] });
    L++;
  }
  while (R > q.r) {
    out.push({ branch: "R−", k: R, to: [L, R - 1] });
    R--;
  }
  return out;
}

/** 정렬된 차례와 블록 크기 — 정본이 정렬만 하고 멈춘다. */
export function orderOf(
  arr: readonly number[],
  queries: readonly Query[],
): { order: Tagged[]; block: number } {
  const g = hooks();
  let got: { order: Tagged[]; block: number } | undefined;
  g.__mo = {
    stop: true,
    order: (order, block) => {
      got = { order, block };
    },
  };
  sortOnly.mosAlgorithm(
    [...arr],
    queries.map((q) => [q[0], q[1]]),
  );
  g.__mo = undefined;
  if (got === undefined) {
    // 질의가 없으면 정본이 정렬 전에 끝난다.
    return { order: [], block: Math.max(1, Math.floor(Math.sqrt(arr.length))) };
  }
  return got;
}

/**
 * 정본 한 번 호출의 걸음 기록. 읽은 칸은 `Proxy` 가, 질의마다의 셈 상태는 계측 사본이 기록한다.
 * 기록이 네 `while` 의 차례와 다르거나, 걸음을 이어 센 `count` 가 정본의 기록과 다르면 던진다.
 */
export function trace(
  arr: readonly number[],
  queries: readonly Query[],
): Trace {
  const reads: number[] = [];
  const proxy = new Proxy([...arr], {
    get(t, p, r) {
      if (typeof p === "string" && /^\d+$/.test(p)) reads.push(Number(p));
      return Reflect.get(t, p, r);
    },
  });
  const answers: {
    q: Tagged;
    curL: number;
    curR: number;
    distinct: number;
    count: [number, number][];
    at: number;
  }[] = [];
  const g = hooks();
  g.__mo = {
    answer: (q, curL, curR, distinct, count) => {
      answers.push({ q, curL, curR, distinct, count, at: reads.length });
    },
  };
  const out = probed.mosAlgorithm(
    proxy as number[],
    queries.map((q) => [q[0], q[1]]),
  );
  g.__mo = undefined;
  const want = mosAlgorithm(
    [...arr],
    queries.map((q) => [q[0], q[1]]),
  );
  if (JSON.stringify(out) !== JSON.stringify(want)) {
    throw new Error(`계측 사본이 정본과 다른 답을 냈다 — ${out} ≠ ${want}`);
  }
  const { order, block } = orderOf(arr, queries);

  const count = new Map<number, number>();
  let distinct = 0;
  let curL = 0;
  let curR = -1;
  let seen = 0;
  const runs: QueryRun[] = [];
  answers.forEach((a, step) => {
    const q = order[step];
    if (q === undefined || q.i !== a.q.i || q.l !== a.q.l || q.r !== a.q.r) {
      throw new Error(`차례 ${step} 의 질의가 정렬 기록과 다르다`);
    }
    const got = reads.slice(seen, a.at);
    seen = a.at;
    const plan = expectedReads(curL, curR, a.q);
    if (got.join(",") !== plan.map((p) => p.k).join(",")) {
      throw new Error(
        `차례 ${step} 에서 읽은 칸 ${got} 이 네 갈래의 차례와 다르다`,
      );
    }
    const start: [number, number] = [curL, curR];
    const moves: Move[] = plan.map((p) => {
      const value = arr[p.k] as number;
      const before = count.get(value) ?? 0;
      const after =
        p.branch === "L+" || p.branch === "R+" ? before + 1 : before - 1;
      count.set(value, after);
      if (after === 1 && before === 0) distinct++;
      if (after === 0 && before === 1) distinct--;
      const from: [number, number] = [curL, curR];
      [curL, curR] = p.to;
      return {
        branch: p.branch,
        k: p.k,
        value,
        from,
        to: p.to,
        count: [...count],
        distinct,
        before,
        after,
      };
    });
    if (
      curL !== a.curL ||
      curR !== a.curR ||
      distinct !== a.distinct ||
      JSON.stringify([...count]) !== JSON.stringify(a.count)
    ) {
      throw new Error(
        `차례 ${step} 에서 이어 센 셈 상태가 정본의 기록과 다르다`,
      );
    }
    runs.push({ step, q: a.q, moves, start, distinct, count: a.count });
  });
  if (seen !== reads.length) throw new Error("답을 적은 뒤에 읽은 칸이 있다");
  return { block, order, runs, out };
}

/** 차례대로 처리할 때 두 끝이 옮긴 칸 수 — 창을 실제로 옮기지 않고 센다. */
export function moves(order: readonly { l: number; r: number }[]): {
  left: number;
  right: number;
  total: number;
} {
  let curL = 0;
  let curR = -1;
  let left = 0;
  let right = 0;
  for (const q of order) {
    left += Math.abs(curL - q.l);
    right += Math.abs(curR - q.r);
    curL = q.l;
    curR = q.r;
  }
  return { left, right, total: left + right };
}

/** 정본과 같은 키 `(⌊l/B⌋, r)` 로 정렬한다 — 블록 크기만 바꿔 볼 때 쓴다. */
export function blockOrder(queries: readonly Query[], B: number): Tagged[] {
  const blk = (l: number) => Math.floor(l / B);
  return queries
    .map(([l, r], i) => ({ l, r, i }))
    .sort((x, y) => (blk(x.l) !== blk(y.l) ? blk(x.l) - blk(y.l) : x.r - y.r));
}

/** 한 끝만 보는 정렬 — `l` 오름차순 · `r` 오름차순. 같으면 원래 자리 순서(안정 정렬). */
export const byL = (queries: readonly Query[]): Tagged[] =>
  queries.map(([l, r], i) => ({ l, r, i })).sort((x, y) => x.l - y.l);
export const byR = (queries: readonly Query[]): Tagged[] =>
  queries.map(([l, r], i) => ({ l, r, i })).sort((x, y) => x.r - y.r);
export const asGiven = (queries: readonly Query[]): Tagged[] =>
  queries.map(([l, r], i) => ({ l, r, i }));

/* ───────────────────────── 입력 ───────────────────────── */

/** 전개 입력 — 「수행으로 알아보는 알고리즘」과 같다. 질의 이름은 `Q0` 부터다. */
export const A5 = [1, 1, 2, 1, 3];
export const Q5: Query[] = [
  [0, 4],
  [0, 2],
  [2, 4],
  [1, 3],
  [2, 3],
];

/**
 * 정렬 기준을 가르는 입력 — 열여섯 칸에 질의 여덟. 이름은 `P0` 부터다. 이동 칸 수는 배열의 값과
 * 상관없으므로(값은 넣고 빼는 셈에만 쓰인다) 값은 `i mod 4` 로 둔다.
 */
export const A16 = Array.from({ length: 16 }, (_, i) => i % 4);
export const P8: Query[] = [
  [0, 15],
  [1, 4],
  [8, 12],
  [2, 9],
  [9, 14],
  [3, 6],
  [10, 11],
  [5, 13],
];

/** 과제 규모. */
export const N_TASK = 100_000;
export const SEED = 20260930;

/** 32 비트 선형 합동 생성기 — `s ← (1103515245·s + 12345) mod 2^32`, 값은 `⌊s / 256⌋`. */
export function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return s >>> 8;
  };
}

/**
 * 규모를 재는 입력 — 길이 `n` 배열(값은 0 이상 999 이하)과 질의 `q` 개. 질의는 두 자리를 뽑아
 * 작은 쪽을 왼쪽 끝으로 둔다. 시드를 고정해 실행마다 같은 입력이 나온다.
 */
export function makeInput(
  n: number,
  q: number,
  seed = SEED,
): { arr: number[]; queries: Query[] } {
  const next = lcg(seed);
  const arr = Array.from({ length: n }, () => next() % 1000);
  const queries: Query[] = Array.from({ length: q }, () => {
    const a = next() % n;
    const b = next() % n;
    return [Math.min(a, b), Math.max(a, b)];
  });
  return { arr, queries };
}

const memo = new Map<string, unknown>();
function once<T>(key: string, make: () => T): T {
  if (!memo.has(key)) memo.set(key, make());
  return memo.get(key) as T;
}

/** 과제 규모의 입력(n = q = 100,000). */
export const taskInput = () => once("task", () => makeInput(N_TASK, N_TASK));

/** 질의마다 처음부터 새로 세는 방법 — 셈 연산 수(집합에 넣은 횟수)와 답. */
export function naive(
  arr: readonly number[],
  queries: readonly Query[],
): { ops: number; out: number[] } {
  let ops = 0;
  const out = queries.map(([l, r]) => {
    const seen = new Set<number>();
    for (let k = l; k <= r; k++) {
      seen.add(arr[k] as number);
      ops++;
    }
    return seen.size;
  });
  return { ops, out };
}

/** Σ(r − l + 1) — 새로 세는 방법의 셈 연산 수를 식으로 낸다. */
export const naiveByFormula = (queries: readonly Query[]): number =>
  queries.reduce((s, [l, r]) => s + (r - l + 1), 0);

/**
 * 과제 규모에서 여러 방법의 셈 연산 수. 블록 순서는 정본이 정렬한 차례에서 센다.
 * 새로 세는 방법은 Σ(r − l + 1) 이다 — 그 식이 실제 실행과 같은지는 n = q = 1,000 · 10,000 에서 잰다.
 */
export const taskCounts = () =>
  once("taskCounts", () => {
    const { arr, queries } = taskInput();
    const ref = orderOf(arr, queries);
    return {
      naive: naiveByFormula(queries),
      given: moves(asGiven(queries)),
      byL: moves(byL(queries)),
      byR: moves(byR(queries)),
      block: moves(ref.order),
      B: ref.block,
    };
  });

/* ───────────────────────── 상한과 최악 ───────────────────────── */

/** 블록 수 `K = ⌈n / B⌉`. */
export const blocksOf = (n: number, B: number): number => Math.ceil(n / B);

/**
 * 두 끝이 옮기는 칸 수의 상한 — 「수식 정의와 유도」의 식이다.
 * 왼쪽 끝 `q(B − 1) + (K − 1)B`, 오른쪽 끝 `K(2n − KB)`.
 */
export function bound(
  n: number,
  q: number,
  B: number,
): { left: number; right: number; total: number } {
  const K = blocksOf(n, B);
  const left = q * (B - 1) + (K - 1) * B;
  const right = K * (2 * n - K * B);
  return { left, right, total: left + right };
}

/**
 * 블록 크기 `B` 에서 상한을 거의 채우는 질의 목록. 질의를 블록마다 고르게 나누고, 한 블록 안에서는
 * 왼쪽 끝을 블록의 첫 칸과 끝 칸에 번갈아 두며 오른쪽 끝은 블록 끝에서 배열 끝까지 고르게 늘린다.
 * 블록이 바뀌면 오른쪽 끝은 배열 끝에서 다음 블록 끝으로 되돌아온다.
 */
export function worstInput(n: number, q: number, B: number): Query[] {
  const K = blocksOf(n, B);
  const out: Query[] = [];
  for (let t = 0; t < q; t++) {
    const b = Math.floor((t * K) / q);
    const first = Math.ceil((b * q) / K);
    const last = Math.ceil(((b + 1) * q) / K) - 1;
    const k = last - first + 1;
    const j = t - first;
    const lo = b * B;
    const hi = Math.min(n - 1, lo + B - 1);
    const l = j % 2 === 0 ? lo : hi;
    const r = k <= 1 ? n - 1 : hi + Math.floor((j * (n - 1 - hi)) / (k - 1));
    out.push([l, r]);
  }
  return out;
}

/* ───────────────────────── 그림 ───────────────────────── */

export const num = (x: number): string => x.toLocaleString("en-US");
export const SECONDS_PER_OP = 1e8;
export const seconds = (ops: number): string => {
  const s = ops / SECONDS_PER_OP;
  return s < 0.01 ? "0.01 초 미만" : `${s.toFixed(2)} 초`;
};

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "arr",
  rangeLabel: "창",
};

/** 전개 입력의 질의 이름. */
export const qName = (i: number) => `Q${i}`;
export const pName = (i: number) => `P${i}`;
const show = (xs: readonly number[]) => xs.join(" ");

const CALL = {
  "L+": "add",
  "R+": "add",
  "L−": "remove",
  "R−": "remove",
} as const;
const SAY = {
  "L+": "왼쪽으로 넓힙니다",
  "R+": "오른쪽으로 넓힙니다",
  "L−": "왼쪽에서 좁힙니다",
  "R−": "오른쪽에서 좁힙니다",
} as const;

/** 걸음 하나 — 한 칸 옮김이거나, 질의 하나를 끝내고 답을 적는 일이다. */
export interface WalkStep {
  readonly id: string;
  readonly kind: "move" | "record";
  readonly run: QueryRun;
  readonly move?: Move;
  /** 이 걸음 뒤의 창과 셈 상태. */
  readonly window: readonly [number, number];
  readonly count: readonly (readonly [number, number])[];
  readonly distinct: number;
  /** 이 걸음 뒤의 답 목록(원래 자리, 아직 안 적은 자리는 `null`). */
  readonly out: readonly (number | null)[];
}

/** 전개 입력의 걸음 전부 — T1 부터 번호를 붙인다. */
export function walkSteps(): WalkStep[] {
  return once("walkSteps", () => {
    const t = trace(A5, Q5);
    const steps: WalkStep[] = [];
    const out: (number | null)[] = Q5.map(() => null);
    let n = 1;
    for (const run of t.runs) {
      for (const m of run.moves) {
        steps.push({
          id: `T${n++}`,
          kind: "move",
          run,
          move: m,
          window: m.to,
          count: m.count,
          distinct: m.distinct,
          out: [...out],
        });
      }
      out[run.q.i] = run.distinct;
      const last = run.moves.at(-1);
      steps.push({
        id: `T${n++}`,
        kind: "record",
        run,
        window: last === undefined ? run.start : last.to,
        count: run.count,
        distinct: run.distinct,
        out: [...out],
      });
    }
    return steps;
  });
}

const winText = (w: readonly [number, number]) =>
  w[0] > w[1] ? "빈 창" : `[${w[0]},${w[1]}]`;

/** 걸음 제목과 설명 — 패널과 증명 표가 같은 문장을 쓴다. */
export function stepTitle(s: WalkStep): string {
  const qn = `${qName(s.run.q.i)}[${s.run.q.l},${s.run.q.r}]`;
  if (s.kind === "record") return `${s.id} ${qn} 답 기록`;
  const m = s.move as Move;
  return `${s.id} ${m.branch} ${CALL[m.branch]}(${m.value})`;
}

export function stepText(s: WalkStep): string {
  const qn = `${qName(s.run.q.i)}[${s.run.q.l},${s.run.q.r}]`;
  if (s.kind === "record") {
    return `창이 ${qName(s.run.q.i)} 의 구간 [${s.run.q.l},${s.run.q.r}]${과와(s.run.q.r)} 같아졌습니다. out[${s.run.q.i}] = ${s.distinct}${을를(s.distinct)} 적습니다.`;
  }
  const m = s.move as Move;
  const edge =
    m.before === 0 && m.after === 1
      ? `0 → 1 이라 distinct 가 ${s.distinct}${이가(s.distinct)} 됩니다.`
      : m.before === 1 && m.after === 0
        ? `1 → 0 이라 distinct 가 ${s.distinct}${이가(s.distinct)} 됩니다.`
        : `${m.before} → ${m.after}${josa(m.after, "이라", "라")} distinct 는 ${s.distinct} 그대로입니다.`;
  return `${qn} 에 맞추려고 창을 ${SAY[m.branch]}. arr[${m.k}] = ${m.value}${을를(m.value)} ${CALL[m.branch] === "add" ? "넣고" : "빼고"}, count[${m.value}]${이가(m.value)} ${edge}`;
}

/** 걸음 하나를 배열 무대의 걸음으로 — 패널과 정적 필름이 같은 값을 쓴다. */
export function arrayStep(s: WalkStep): ArrayStep {
  const [L, R] = s.window;
  const m = s.move;
  const keys = s.count.map(([k]) => k);
  return {
    array: [...A5],
    range: L > R ? null : [L, R],
    read: m === undefined ? [] : [m.k],
    write: [],
    pointers: { curL: L, curR: R },
    pieces: [
      {
        label: qName(s.run.q.i),
        from: s.run.q.l,
        to: s.run.q.r,
        tone: "right",
        text: `[${s.run.q.l},${s.run.q.r}]`,
      },
    ],
    layers: [
      {
        name: "out",
        values: [...s.out],
        write: s.kind === "record" ? [s.run.q.i] : [],
      },
    ],
    map: {
      keyLabel: "값 v",
      valueLabel: "count[v]",
      entries: s.count.map(([k, c]) => [k, c] as const),
      slots: 3,
      read: [],
      write: m === undefined ? [] : keys.filter((k) => k === m.value),
    },
    calc:
      m === undefined
        ? null
        : {
            expr: `count[${m.value}] ${m.before} → ${m.after}`,
            result: `distinct ${s.distinct}`,
          },
    vars: `distinct = ${s.distinct}`,
  };
}

const film = (steps: readonly WalkStep[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: stepTitle(s).slice(s.id.length + 1),
    rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
  }));

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `mosAlgorithm-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    window: walkSteps().map((s) => ({
      title: stepTitle(s),
      text: stepText(s),
      ...arrayStep(s),
    })),
  };
}

/* ───────── 전체 컨셉의 두 창 ───────── */

/** 창 [0,2] 를 세어 둔 상태와, 거기서 [1,3] 으로 옮긴 뒤 — 전개 입력의 T3 · T6 과 같다. */
export function conceptFrames(): StageFrame[] {
  const steps = walkSteps();
  const pick = (id: string) => steps.find((s) => s.id === id) as WalkStep;
  const a = pick("T3");
  const b = pick("T6");
  const frame = (
    s: WalkStep,
    text: string,
    read: number[] = [],
  ): StageFrame => ({
    id: winText(s.window),
    text,
    rows: arrayStage(
      {
        array: [...A5],
        range: [s.window[0], s.window[1]],
        read,
        pointers: { curL: s.window[0], curR: s.window[1] },
        map: {
          keyLabel: "값 v",
          valueLabel: "count[v]",
          entries: s.count.map(([k, c]) => [k, c] as const),
          slots: 3,
        },
      },
      ARRAY_OPTIONS,
    ),
  });
  const movedCells = steps
    .filter((s) => s.kind === "move" && s.run.q.i === b.run.q.i)
    .map((s) => (s.move as Move).k);
  const moved = movedCells.length;
  return [
    frame(a, `창 ${winText(a.window)} — 서로 다른 값 ${a.distinct} 개`),
    frame(
      b,
      `창 ${winText(b.window)} — 두 끝을 ${moved} 칸 옮겨 서로 다른 값 ${b.distinct} 개`,
      movedCells,
    ),
  ];
}

/* ───────── 블록 순서를 입력 위에 ───────── */

/** 블록 순서의 그림 — 블록 괄호와, 정렬된 차례대로 질의 괄호를 쌓는다. */
function blockOrderRows(): StageRow[] {
  const t = trace(A5, Q5);
  const B = t.block;
  const blocks = Math.ceil(A5.length / B);
  const rows: StageRow[] = [
    { kind: "index", label: "l · r" },
    {
      kind: "cells",
      label: "blk(l)",
      values: A5.map((_, l) => Math.floor(l / B)),
      side: `B = ${B}`,
    },
  ];
  for (let b = 0; b < blocks; b++) {
    const from = b * B;
    const to = Math.min(A5.length - 1, from + B - 1);
    rows.push({
      kind: "bracket",
      label: `블록 ${b}`,
      from,
      to,
      tone: "make",
      text: `[${from},${to}]`,
    });
  }
  t.order.forEach((q, step) => {
    rows.push({
      kind: "bracket",
      label: `${step + 1}. ${qName(q.i)}`,
      from: q.l,
      to: q.r,
      tone: Math.floor(q.l / B) % 2 === 0 ? "left" : "right",
      text: `[${q.l},${q.r}]`,
      side: `(${Math.floor(q.l / B)}, ${q.r})`,
    });
  });
  return rows;
}

/* ───────── 시도한 방법 ───────── */

function approaches(): Approach[] {
  const c = taskCounts();
  const time = (ops: number) => `셈 연산 ${num(ops)} 번 · ${seconds(ops)}`;
  return [
    {
      name: "질의마다 새로 세기",
      idea: "질의마다 구간을 처음부터 읽어 집합에 넣는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        { label: "시간", value: time(c.naive), ok: false },
      ],
      lesson: "겹치는 칸을 다시 읽는다 — 앞 질의에서 센 것을 이어받으면 어떨까",
    },
    {
      name: "창 이어받기 · 받은 순서",
      idea: "창을 버리지 않고 두 끝만 다음 질의로 옮긴다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        { label: "시간", value: time(c.given.total), ok: false },
      ],
      lesson:
        "두 끝이 배열 앞뒤로 오간다 — 질의를 늘어놓는 순서를 바꾸면 어떨까",
    },
    {
      name: "l 오름차순으로 정렬",
      idea: "왼쪽 끝이 작은 질의부터 처리한다",
      verdict: "drop",
      checks: [
        { label: "curL", value: `${num(c.byL.left)} 칸 · 한 방향`, ok: true },
        { label: "curR", value: `${num(c.byL.right)} 칸`, ok: false },
      ],
      lesson: "curL 은 한 방향인데 curR 이 오르내린다 — 반대로 하면 어떨까",
    },
    {
      name: "r 오름차순으로 정렬",
      idea: "오른쪽 끝이 작은 질의부터 처리한다",
      verdict: "drop",
      checks: [
        { label: "curL", value: `${num(c.byR.left)} 칸`, ok: false },
        { label: "curR", value: `${num(c.byR.right)} 칸 · 한 방향`, ok: true },
      ],
      lesson: `한쪽을 한 방향으로 만들면 다른 쪽이 오르내린다 — l 이 조금 다른 질의를 한데 모으면 어떨까`,
    },
    {
      name: "블록 순서로 정렬",
      idea: `l 을 B = ${c.B} 칸씩 묶은 블록 번호로 모으고, 같은 블록 안에서 r 오름차순`,
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        { label: "시간", value: time(c.block.total), ok: true },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-window": () => (
    <CellStageFilm
      title={`arr = [${A5.join(", ")}] — 창 [0,2] 에서 [1,3] 으로`}
      columns={A5.length}
      frames={conceptFrames()}
    />
  ),
  "build-block-order": () => (
    <CellStage
      title={`질의 다섯을 블록 순서로 — 블록 크기 B = ${trace(A5, Q5).block}`}
      columns={A5.length}
      rows={blockOrderRows()}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title={`시도한 방법 다섯 — 넷은 버렸고 하나가 남았다`}
        constraint={`n = q = ${num(N_TASK)} · 1 초(셈 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "walk-window": () => {
    const steps = walkSteps();
    return (
      <CellStageFilm
        title={`mosAlgorithm([${A5.join(", ")}], 질의 다섯) — T1~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(steps[0] as WalkStep))}
        frames={film(steps)}
      />
    );
  },
};

export { show, winText };
