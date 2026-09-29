/**
 * `minMaxPair-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 비교 횟수가 이 편의 요점이라,
 * **정본을 고치지 않고** 비교를 센다 — 원소를 `valueOf` 가 불릴 때마다 자기 자리를 적는 값으로 바꿔
 * 정본에 넘기면, `<`·`>` 한 번이 두 원소의 `valueOf` 를 차례로 부르므로 적힌 자리를 둘씩 끊은 것이 곧
 * 정본이 실제로 한 비교의 목록이다(`measure`). 그 목록을 정본의 갈래 순서로 읽어(`decode`) 걸음 재생
 * 패널의 걸음(`simStepsFromRef`)과 그림을 만들고, 읽은 순서가 실제 목록과 한 자리라도 어긋나면 던진다.
 * `.sim.ts` 의 리터럴이 그것과 같은지는 `minMaxPair-guide.test.ts` 가 잰다.
 *
 * 비교하려고 세운 다른 방법(원소마다 두 번 비교 · 반으로 갈라 합치기 · 토너먼트)은 정본이 아니라
 * 이 파일에 적고, 같은 계측(`measure`)으로 센다.
 */

import type { ReactElement } from "react";
import { 과와, 으로, 은는, 이가 } from "../../../../tools/josa.ts";
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
  treeLayout,
} from "../../../_viz/patterns/NodeGraph";
import { RangeCover } from "../../../_viz/patterns/RangeCover";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { minMaxPair } from "./minMaxPair-guide.ref.ts";

/* ───────────────────────── 비교 계측 ───────────────────────── */

/** 원소 하나 — 비교에 쓰일 때마다(`valueOf`) 자기 자리를 적는다. */
export interface Tok {
  readonly at: number;
  readonly v: number;
  valueOf(): number;
}

let LOG: number[] = [];

const toks = (values: readonly number[]): Tok[] =>
  values.map((v, at) => ({
    at,
    v,
    valueOf() {
      LOG.push(at);
      return v;
    },
  }));

/** 비교 한 번 — 연산자의 왼쪽 원소 자리와 오른쪽 원소 자리. */
export type Cmp = readonly [number, number];

/**
 * `fn` 에 계측 원소를 넘겨 실행하고, 실제로 일어난 비교를 순서대로 돌려준다. 원소끼리의 비교만 세고,
 * 반복 조건(`i < n`)이나 홀짝 판정(`n % 2`)처럼 원소를 보지 않는 판정은 세지 않는다.
 */
export function measure<R>(
  values: readonly number[],
  fn: (xs: number[]) => R,
): { out: R; cmps: Cmp[]; toks: Tok[] } {
  LOG = [];
  const ts = toks(values);
  const out = fn(ts as unknown as number[]);
  if (LOG.length % 2 !== 0) {
    throw new Error(
      `원소를 읽은 횟수 ${LOG.length} 가 홀수다 — 비교가 아닌 곳에서 원소를 읽었다`,
    );
  }
  const cmps: Cmp[] = [];
  for (let k = 0; k < LOG.length; k += 2) {
    cmps.push([LOG[k] as number, LOG[k + 1] as number]);
  }
  return { out, cmps, toks: ts };
}

/** 비교 횟수만. */
export const countOf = (
  values: readonly number[],
  fn: (xs: number[]) => unknown,
): number => measure(values, fn).cmps.length;

/* ───────────────────────── 정본 실행을 갈래 순서로 읽기 ───────────────────────── */

/** 비교 한 번이 한 일 — 전개의 걸음 하나. */
export interface Event {
  /** `start` 짝수 길이의 시작 비교 ② · `pair` 쌍 안 비교 ③ · `min`·`max` 극값 비교 ④. */
  readonly kind: "start" | "pair" | "min" | "max";
  /** 연산자의 왼쪽·오른쪽 원소 자리. */
  readonly left: number;
  readonly right: number;
  /** 연산자 — 정본은 `hi > max` 한 곳만 `>` 이다. */
  readonly op: "<" | ">";
  readonly result: boolean;
  /** 쌍을 처리하는 동안의 `i`. 시작 비교에는 없다. */
  readonly i?: number;
  /** 쌍 안 비교가 가른 작은 쪽 · 큰 쪽 자리. */
  readonly loAt?: number;
  readonly hiAt?: number;
  /** 이 비교가 끝난 뒤 `min`·`max` 가 가리키는 원소 자리. */
  readonly minAt: number;
  readonly maxAt: number;
  /** 이 비교로 새로 후보에서 빠진 원소 자리. */
  readonly outOfMin: readonly number[];
  readonly outOfMax: readonly number[];
  /** 이 비교가 끝난 뒤의 두 후보 줄. 원소가 `SNAPSHOT_MAX` 개를 넘는 입력에서는 비워 둔다. */
  readonly minCand: readonly boolean[];
  readonly maxCand: readonly boolean[];
  /** 이 비교까지의 누적 비교 횟수. */
  readonly count: number;
}

export interface RefRun {
  readonly values: readonly number[];
  readonly n: number;
  readonly odd: boolean;
  /** 시작값을 정한 직후의 `min`·`max` 자리와 첫 쌍의 `i`. */
  readonly startMinAt: number;
  readonly startMaxAt: number;
  readonly startI: number;
  readonly events: readonly Event[];
  /** 정본이 돌려준 두 원소의 자리와 값. */
  readonly minAt: number;
  readonly maxAt: number;
  readonly min: number;
  readonly max: number;
  /** 반복이 끝난 뒤의 `i`. */
  readonly endI: number;
  readonly cmps: readonly Cmp[];
}

/** 후보 줄을 걸음마다 복사해 두는 입력 크기의 상한 — 과제 규모에서는 복사가 n² 이 된다. */
const SNAPSHOT_MAX = 64;

const same = (c: Cmp | undefined, l: number, r: number): boolean =>
  c !== undefined && c[0] === l && c[1] === r;

/**
 * 정본을 한 번 실행하고, 실제 비교 목록을 정본의 갈래 순서(시작 비교 → 쌍마다 쌍 안 · `min` · `max`)로
 * 읽는다. 목록의 비교가 그 순서에 한 자리라도 안 맞으면 던진다 — 그러면 「이 코드가 이렇게 움직인다」가
 * 거짓이다. 후보 줄은 비교가 낸 참·거짓으로 빼 나간다. 끝에 남은 후보가 정본이 돌려준 원소와 다르면
 * 던진다.
 */
export function decode(values: readonly number[]): RefRun {
  if (values.length === 0) throw new Error("빈 배열은 이 절차의 입력이 아니다");
  const { out, cmps, toks: ts } = measure(values, (xs) => minMaxPair(xs));
  const v = (at: number): number => values[at] as number;
  const n = values.length;
  const minCand = values.map(() => true);
  const maxCand = values.map(() => true);
  const events: Event[] = [];
  const keep = n <= SNAPSHOT_MAX;
  let k = 0;
  let minAt: number;
  let maxAt: number;
  let i: number;

  const take = (
    base: Omit<
      Event,
      "outOfMin" | "outOfMax" | "minCand" | "maxCand" | "count"
    >,
    dropMin: number | null,
    dropMax: number | null,
  ): void => {
    const outOfMin: number[] = [];
    const outOfMax: number[] = [];
    if (dropMin !== null && minCand[dropMin]) {
      minCand[dropMin] = false;
      outOfMin.push(dropMin);
    }
    if (dropMax !== null && maxCand[dropMax]) {
      maxCand[dropMax] = false;
      outOfMax.push(dropMax);
    }
    events.push({
      ...base,
      outOfMin,
      outOfMax,
      minCand: keep ? [...minCand] : [],
      maxCand: keep ? [...maxCand] : [],
      count: events.length + 1,
    });
  };

  if (n % 2 === 1) {
    minAt = 0;
    maxAt = 0;
    i = 1;
  } else {
    if (!same(cmps[k], 0, 1))
      throw new Error("첫 비교가 A[0] < A[1] 이 아니다");
    k++;
    const less = v(0) < v(1);
    minAt = less ? 0 : 1;
    maxAt = less ? 1 : 0;
    i = 2;
    take(
      { kind: "start", left: 0, right: 1, op: "<", result: less, minAt, maxAt },
      maxAt,
      minAt,
    );
  }
  const startMinAt = minAt;
  const startMaxAt = maxAt;
  const startI = i;

  for (; i < n; i += 2) {
    if (!same(cmps[k], i, i + 1)) {
      throw new Error(`쌍 안 비교가 A[${i}] < A[${i + 1}] 가 아니다`);
    }
    k++;
    const less = v(i) < v(i + 1);
    const loAt = less ? i : i + 1;
    const hiAt = less ? i + 1 : i;
    take(
      {
        kind: "pair",
        left: i,
        right: i + 1,
        op: "<",
        result: less,
        i,
        loAt,
        hiAt,
        minAt,
        maxAt,
      },
      hiAt,
      loAt,
    );

    if (!same(cmps[k], loAt, minAt))
      throw new Error(`i = ${i} 에서 lo < min 이 아니다`);
    k++;
    const lower = v(loAt) < v(minAt);
    const oldMin = minAt;
    if (lower) minAt = loAt;
    take(
      {
        kind: "min",
        left: loAt,
        right: oldMin,
        op: "<",
        result: lower,
        i,
        loAt,
        hiAt,
        minAt,
        maxAt,
      },
      lower ? oldMin : loAt,
      null,
    );

    if (!same(cmps[k], hiAt, maxAt))
      throw new Error(`i = ${i} 에서 hi > max 가 아니다`);
    k++;
    const higher = v(hiAt) > v(maxAt);
    const oldMax = maxAt;
    if (higher) maxAt = hiAt;
    take(
      {
        kind: "max",
        left: hiAt,
        right: oldMax,
        op: ">",
        result: higher,
        i,
        loAt,
        hiAt,
        minAt,
        maxAt,
      },
      null,
      higher ? oldMax : hiAt,
    );
  }

  if (k !== cmps.length)
    throw new Error(`비교 ${cmps.length} 번 중 ${k} 번만 읽었다`);
  const got = out as unknown as { min: Tok; max: Tok };
  if (got.min !== ts[minAt] || got.max !== ts[maxAt]) {
    throw new Error("정본이 돌려준 원소가 갈래 순서로 읽은 min·max 와 다르다");
  }
  const left = (c: boolean[]) => c.flatMap((b, at) => (b ? [at] : []));
  if (
    left(minCand).join() !== String(minAt) ||
    left(maxCand).join() !== String(maxAt)
  ) {
    throw new Error("끝에 남은 후보가 정본의 답과 다르다");
  }
  return {
    values,
    n,
    odd: n % 2 === 1,
    startMinAt,
    startMaxAt,
    startI,
    events,
    minAt,
    maxAt,
    min: v(minAt),
    max: v(maxAt),
    endI: i,
    cmps,
  };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 전개(「수행으로 알아보는 알고리즘」)가 끝까지 쓰는 입력. 길이가 짝수라 시작 비교 갈래가 실행된다. */
export const A8 = [3, 1, 4, 1, 5, 9, 2, 6];
/** 「아이디어를 떠올리는 과정」이 쓰는 작은 입력. */
export const B6 = [3, 1, 4, 1, 5, 9];
/** 과제 규모의 상단. 값은 비교 횟수를 바꾸지 않는다 — 길이만 정한다. */
export const BIG_N = 100_000;
export const BIG = Array.from({ length: BIG_N }, (_, i) => (i * 37) % 9973);

export const num = (x: number): string => x.toLocaleString("en-US");
export const show = (xs: readonly number[]): string => `[${xs.join(", ")}]`;
/** 식 `⌈3n/2⌉ − 2`. */
export const formula = (n: number): number => Math.ceil((3 * n) / 2) - 2;

/* ───────────────────────── 비교하려고 세운 다른 방법 ───────────────────────── */

/** 최솟값을 구하는 반복과 최댓값을 구하는 반복을 따로 쓴다. 배열을 두 번 지나간다. */
export function twoLoops(arr: number[]): { min: number; max: number } {
  const n = arr.length;
  let min = arr[0] as number;
  for (let i = 1; i < n; i++) {
    const x = arr[i] as number;
    if (x < min) min = x;
  }
  let max = arr[0] as number;
  for (let i = 1; i < n; i++) {
    const x = arr[i] as number;
    if (x > max) max = x;
  }
  return { min, max };
}

/** 한 번 지나가면서 원소마다 `min` 과 한 번, `max` 와 한 번 비교한다. */
export function oneLoop(arr: number[]): { min: number; max: number } {
  const n = arr.length;
  const first = arr[0] as number;
  let min = first;
  let max = first;
  for (let i = 1; i < n; i++) {
    const x = arr[i] as number;
    if (x < min) min = x;
    if (x > max) max = x;
  }
  return { min, max };
}

/** 반으로 갈라 두 조각의 최솟값·최댓값을 구하고, 두 최솟값끼리 · 두 최댓값끼리 비교해 합친다. */
export function halves(arr: number[]): { min: number; max: number } {
  const go = (lo: number, hi: number): { min: number; max: number } => {
    if (lo === hi) return { min: arr[lo] as number, max: arr[lo] as number };
    if (hi === lo + 1) {
      const a = arr[lo] as number;
      const b = arr[hi] as number;
      return a < b ? { min: a, max: b } : { min: b, max: a };
    }
    const mid = lo + Math.floor((hi - lo) / 2);
    const l = go(lo, mid);
    const r = go(mid + 1, hi);
    return {
      min: l.min < r.min ? l.min : r.min,
      max: l.max > r.max ? l.max : r.max,
    };
  };
  return go(0, arr.length - 1);
}

/** 반으로 갈라 합치기가 만드는 조각 — 조각마다 그 자리에서 쓴 비교 횟수. */
export interface Piece {
  readonly lo: number;
  readonly hi: number;
  readonly own: number;
  readonly kids: readonly Piece[];
}

/** 조각 나무. 조각마다 쓴 비교는 계측으로 센다 — 조각 안의 비교가 늘어난 만큼이다. */
export function halvesTree(values: readonly number[]): Piece {
  const go = (lo: number, hi: number): Piece => {
    if (lo === hi) return { lo, hi, own: 0, kids: [] };
    if (hi === lo + 1) {
      const own = countOf(values.slice(lo, hi + 1), halves);
      return { lo, hi, own, kids: [] };
    }
    const mid = lo + Math.floor((hi - lo) / 2);
    const kids = [go(lo, mid), go(mid + 1, hi)];
    const total = countOf(values.slice(lo, hi + 1), halves);
    const inKids = kids.reduce((s, c) => s + sum(c), 0);
    return { lo, hi, own: total - inKids, kids };
  };
  return go(0, values.length - 1);
}

export const sum = (p: Piece): number =>
  p.own + p.kids.reduce((s, c) => s + sum(c), 0);

/**
 * 토너먼트 — 원소를 둘씩 짝지어 큰 쪽만 다음 회전으로 올리기를 하나가 남을 때까지 되풀이한다.
 * 가장 큰 값과 직접 비교된 원소를 적어 두었다가, 그중 가장 큰 값을 두 번째로 큰 값으로 낸다.
 */
export function tournament(arr: number[]): {
  rounds: number[][];
  winner: number;
  beaten: number[];
  second: number;
} {
  const n = arr.length;
  let alive = Array.from({ length: n }, (_, i) => i);
  const beat = new Map<number, number[]>(alive.map((i) => [i, []]));
  const rounds: number[][] = [alive];
  while (alive.length > 1) {
    const next: number[] = [];
    for (let j = 0; j < alive.length; j += 2) {
      const x = alive[j] as number;
      const y = alive[j + 1];
      if (y === undefined) {
        next.push(x);
        continue;
      }
      const w = (arr[x] as number) > (arr[y] as number) ? x : y;
      const l = w === x ? y : x;
      beat.get(w)?.push(l);
      next.push(w);
    }
    alive = next;
    rounds.push(alive);
  }
  const winner = alive[0] as number;
  const beaten = beat.get(winner) ?? [];
  let second = beaten[0] as number;
  for (const b of beaten.slice(1))
    if ((arr[b] as number) > (arr[second] as number)) second = b;
  return { rounds, winner, beaten, second };
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

const MARK = { start: "②", pair: "③", min: "④", max: "④" } as const;

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly stage: ArrayStep;
}

/** 두 후보 줄 — 후보에서 빠진 칸은 「빠짐」으로 적는다. */
function candidateLayers(
  values: readonly number[],
  minCand: readonly boolean[],
  maxCand: readonly boolean[],
  outOfMin: readonly number[],
  outOfMax: readonly number[],
) {
  const row = (cand: readonly boolean[]) =>
    values.map((x, at) => (cand[at] ? x : "빠짐"));
  const left = (cand: readonly boolean[]) => cand.filter(Boolean).length;
  return [
    {
      name: "최솟값 후보",
      values: row(minCand),
      read: [],
      write: [...outOfMin],
      side: `남은 후보 ${left(minCand)} 칸`,
    },
    {
      name: "최댓값 후보",
      values: row(maxCand),
      read: [],
      write: [...outOfMax],
      side: `남은 후보 ${left(maxCand)} 칸`,
    },
  ];
}

const sorted = (xs: readonly number[]) => [...xs].sort((a, b) => a - b);

/** 정본 실행 한 번을 걸음으로 — 비교 한 번이 걸음 하나이고, 마지막에 반복이 끝나는 걸음 하나. */
export function walkSteps(run: RefRun, from = 1): Step[] {
  const vals = run.values;
  const v = (at: number) => vals[at] as number;
  const steps: Step[] = [];
  let seen = run.odd ? 0 : -1;
  for (const e of run.events) {
    seen = Math.max(seen, e.left, e.right);
    const id = `T${from + steps.length}`;
    const expr = (() => {
      switch (e.kind) {
        case "start":
          return `A[0] = ${v(0)} < A[1] = ${v(1)}`;
        case "pair":
          return `A[${e.left}] = ${v(e.left)} < A[${e.right}] = ${v(e.right)}`;
        case "min":
          return `lo = ${v(e.left)} < min = ${v(e.right)}`;
        case "max":
          return `hi = ${v(e.left)} > max = ${v(e.right)}`;
      }
    })();
    const verdict = e.result ? "참" : "거짓";
    const outs = [
      ...e.outOfMin.map(
        (at) => `A[${at}] = ${v(at)}${이가(v(at))} 최솟값 후보에서`,
      ),
      ...e.outOfMax.map(
        (at) => `A[${at}] = ${v(at)}${이가(v(at))} 최댓값 후보에서`,
      ),
    ];
    const dropped = outs.length === 0 ? "" : ` ${outs.join(", ")} 빠집니다.`;
    const title = (() => {
      switch (e.kind) {
        case "start":
          return `시작 · A[0]${과와("A[0]")} A[1] ${MARK.start}`;
        case "pair":
          return `쌍 (${v(e.left)}, ${v(e.right)}) ${MARK.pair}`;
        case "min":
          return `lo = ${v(e.left)}${과와(v(e.left))} min = ${v(e.right)} ${MARK.min}`;
        case "max":
          return `hi = ${v(e.left)}${과와(v(e.left))} max = ${v(e.right)} ${MARK.max}`;
      }
    })();
    const detail = (() => {
      switch (e.kind) {
        case "start":
          return `길이 ${run.n}${이가(run.n)} 짝수라 첫 두 원소를 한 번 비교합니다. ${expr}${은는(v(e.right))} ${verdict}이라 min = ${v(e.minAt)}, max = ${v(e.maxAt)} 입니다.${dropped}`;
        case "pair":
          return `${expr}${은는(v(e.right))} ${verdict}이라 작은 쪽 lo = ${v(e.loAt as number)}, 큰 쪽 hi = ${v(e.hiAt as number)} 입니다.${dropped}`;
        case "min":
          return `${expr}${은는(v(e.right))} ${verdict}이라 ${e.result ? `min 이 ${v(e.minAt)}${으로(v(e.minAt))} 바뀝니다` : `min = ${v(e.minAt)} 그대로입니다`}.${dropped}`;
        case "max":
          return `${expr}${은는(v(e.right))} ${verdict}이라 ${e.result ? `max 가 ${v(e.maxAt)}${으로(v(e.maxAt))} 바뀝니다` : `max = ${v(e.maxAt)} 그대로입니다`}.${dropped}`;
      }
    })();
    const pieces =
      e.loAt === undefined || e.hiAt === undefined
        ? []
        : [
            {
              label: "lo",
              from: e.loAt,
              to: e.loAt,
              tone: "left" as const,
              text: `A[${e.loAt}]`,
            },
            {
              label: "hi",
              from: e.hiAt,
              to: e.hiAt,
              tone: "right" as const,
              text: `A[${e.hiAt}]`,
            },
          ];
    steps.push({
      id,
      title,
      detail,
      stage: {
        array: [...vals],
        range: [0, seen],
        read: sorted([e.left, e.right]),
        write: [],
        pointers: e.i === undefined ? {} : { i: e.i },
        calc: { expr, result: verdict },
        vars: `min = ${v(e.minAt)} · max = ${v(e.maxAt)} · 비교 ${e.count} 번`,
        pieces,
        layers: candidateLayers(
          vals,
          e.minCand,
          e.maxCand,
          e.outOfMin,
          e.outOfMax,
        ),
      },
    });
  }
  const last = run.events.at(-1);
  const minCand = last?.minCand ?? vals.map(() => true);
  const maxCand = last?.maxCand ?? vals.map(() => true);
  steps.push({
    id: `T${from + steps.length}`,
    title: `i = ${run.endI} · 종료`,
    detail: `i = ${run.endI}${이가(run.endI)} n = ${run.n}${과와(run.n)} 같아 반복이 끝납니다. 두 후보 줄에 한 칸씩 남았고, { min: ${run.min}, max: ${run.max} } 를 돌려줍니다.`,
    stage: {
      array: [...vals],
      range: [0, run.n - 1],
      read: [],
      write: [],
      pointers: { i: run.endI },
      calc: null,
      vars: `min = ${run.min} · max = ${run.max} · 비교 ${run.events.length} 번`,
      pieces: [],
      layers: candidateLayers(vals, minCand, maxCand, [], []),
    },
  });
  return steps;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "읽은 칸",
};

const film = (steps: Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(s.stage, ARRAY_OPTIONS),
  }));

let walkMemo: RefRun | undefined;
/** 전개 입력의 정본 실행 — 그림과 증명 블록이 같은 기록을 쓴다. */
export const walkRun = (): RefRun => {
  walkMemo ??= decode(A8);
  return walkMemo;
};

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `minMaxPair-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    pairwalk: walkSteps(walkRun()).map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

/* ───────────────── 정적 그림의 무대 줄 ───────────────── */

/** 후보 두 줄을 입력 위에 — 개념 그림과 「먼저 알아 둘 개념」 그림이 쓴다. */
function candidateRows(
  values: readonly number[],
  minCand: readonly boolean[],
  maxCand: readonly boolean[],
  focus: { min: readonly number[]; max: readonly number[] } = {
    min: [],
    max: [],
  },
  read: readonly number[] = [],
): StageRow[] {
  const states = (cand: readonly boolean[], f: readonly number[]) => {
    const s: Partial<Record<number, CellState>> = {};
    cand.forEach((b, at) => {
      if (!b) s[at] = "out";
    });
    for (const at of f) s[at] = "focus";
    return s;
  };
  const readStates: Partial<Record<number, CellState>> = {};
  for (const at of read) readStates[at] = "read";
  const left = (cand: readonly boolean[]) => cand.filter(Boolean).length;
  return [
    { kind: "index", label: "인덱스" },
    { kind: "cells", label: "A", values, states: readStates },
    { kind: "caret", cells: read },
    {
      kind: "cells",
      label: "최솟값 후보",
      values: values.map((x, at) => (minCand[at] ? x : "빠짐")),
      states: states(minCand, focus.min),
      side: `남은 후보 ${left(minCand)} 칸`,
    },
    {
      kind: "cells",
      label: "최댓값 후보",
      values: values.map((x, at) => (maxCand[at] ? x : "빠짐")),
      states: states(maxCand, focus.max),
      side: `남은 후보 ${left(maxCand)} 칸`,
    },
  ];
}

/** 개념 그림의 세 장 — 비교 전 · 첫 쌍까지 · 끝. */
export function conceptFrames(): StageFrame[] {
  const run = walkRun();
  const all = A8.map(() => true);
  const firstPair = run.events.findIndex((e) => e.kind === "max");
  const mid = run.events[firstPair] as Event;
  const end = run.events.at(-1) as Event;
  return [
    {
      id: "처음",
      text: "비교 전 — 여덟 원소가 모두 두 후보다",
      rows: candidateRows(A8, all, all),
    },
    {
      id: `${mid.count} 번`,
      text: `비교 ${mid.count} 번 뒤 — 앞 네 원소에서 후보가 빠졌다`,
      rows: candidateRows(
        A8,
        mid.minCand,
        mid.maxCand,
        { min: [], max: [] },
        [0, 1, 2, 3],
      ),
    },
    {
      id: `${end.count} 번`,
      text: `비교 ${end.count} 번 뒤 — 두 줄에 한 칸씩 남았다`,
      rows: candidateRows(A8, end.minCand, end.maxCand, {
        min: [run.minAt],
        max: [run.maxAt],
      }),
    },
  ];
}

/* ───────────────── 「아이디어를 떠올리는 과정」 ───────────────── */

function halvesNodes(values: readonly number[], prefix: string) {
  const tree = halvesTree(values);
  const nodes: { id: string; label: string; value: string; size: number }[] =
    [];
  const edges: GraphEdge[] = [];
  const children = new Map<string, string[]>();
  const id = (p: Piece) => `${prefix}${p.lo}-${p.hi}`;
  const visit = (p: Piece) => {
    nodes.push({
      id: id(p),
      label: `[${p.lo},${p.hi}]`,
      value: `비교 ${p.own}`,
      size: p.hi - p.lo + 1,
    });
    children.set(
      id(p),
      p.kids.map((c) => id(c)),
    );
    for (const c of p.kids) {
      edges.push({ from: id(p), to: id(c), kind: "plain" });
      visit(c);
    }
  };
  visit(tree);
  return { tree, nodes, edges, children, root: id(tree) };
}

/** 세 방법의 비교 횟수 — 사다리 그림과 증명 블록이 같이 쓴다. */
export function approachCounts() {
  const ref = (xs: number[]) => minMaxPair(xs);
  return [B6, A8, BIG].map((values) => ({
    n: values.length,
    oneLoop: countOf(values, oneLoop),
    halves: countOf(values, halves),
    pairs: countOf(values, ref),
  }));
}

function approaches(): Approach[] {
  const [six, eight, big] = approachCounts() as [
    ReturnType<typeof approachCounts>[number],
    ReturnType<typeof approachCounts>[number],
    ReturnType<typeof approachCounts>[number],
  ];
  return [
    {
      name: "원소마다 두 번 비교하기",
      idea: "원소 하나를 min 과 한 번, max 와 한 번 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "비교",
          value: `n = ${num(big.n)} 에서 ${num(big.oneLoop)} 번 · 원소마다 2 번`,
          ok: false,
        },
      ],
      lesson:
        "원소 하나가 받는 두 비교는 함께 참일 수 없다 — 둘 중 하나를 미리 거를 수 없을까",
    },
    {
      name: "반으로 갈라 합치기",
      idea: "두 조각의 min·max 를 구해 두 번 비교로 합친다. 두 칸 조각은 비교 한 번으로 min 과 max 가 함께 나온다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "비교",
          value: `n = ${eight.n} 에서 ${eight.halves} 번이지만 n = ${six.n} 에서 ${six.halves} 번 · 세 칸 조각이 생기면 는다`,
          ok: false,
        },
      ],
      lesson:
        "두 칸 조각은 비교 한 번으로 두 극값을 낸다 — 처음부터 둘씩 짝지으면 어떨까",
    },
    {
      name: "짝지어 비교하기",
      idea: "두 원소를 먼저 비교해 작은 쪽은 min 과, 큰 쪽은 max 와만 비교한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "비교",
          value: `n = ${six.n} 에서 ${six.pairs} 번 · n = ${eight.n} 에서 ${eight.pairs} 번 · n = ${num(big.n)} 에서 ${num(big.pairs)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-candidates": () => (
    <CellStageFilm
      title={`${show(A8)} 의 두 후보 줄 — 비교가 후보를 뺀다`}
      columns={A8.length}
      frames={conceptFrames()}
    />
  ),
  "origin-halves": () => {
    const six = halvesNodes(B6, "a");
    const eight = halvesNodes(A8, "b");
    const xy = treeLayout(
      [six.root, eight.root],
      new Map([...six.children, ...eight.children]),
    );
    const nodes: GraphNode[] = [...six.nodes, ...eight.nodes].map((d) => {
      const p = xy.get(d.id) as { x: number; y: number };
      return {
        id: d.id,
        x: p.x * 0.9,
        y: p.y,
        label: d.label,
        value: d.value,
        ...(d.size === 3 ? { state: "read" as const } : {}),
      };
    });
    return (
      <NodeGraph
        title={`반으로 갈라 합치기 — 길이 ${B6.length} 은 비교 ${sum(six.tree)} 번, 길이 ${A8.length} 은 비교 ${sum(eight.tree)} 번`}
        nodes={nodes}
        edges={[...six.edges, ...eight.edges]}
        groups={[
          {
            members: six.nodes.map((d) => d.id),
            label: `길이 ${B6.length} · 비교 ${sum(six.tree)} 번`,
          },
          {
            members: eight.nodes.map((d) => d.id),
            label: `길이 ${A8.length} · 비교 ${sum(eight.tree)} 번`,
          },
        ]}
        directed={false}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`길이 n 배열의 최솟값과 최댓값 · n 은 ${num(BIG_N)} 까지 · 비용은 원소끼리 비교한 횟수`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-candidates": () => {
    const run = decode(B6);
    const e = run.events.find((x) => x.kind === "max") as Event;
    const read = Array.from({ length: (e.i as number) + 2 }, (_, at) => at);
    return (
      <CellStage
        title={`${show(B6)} 에서 비교 ${e.count} 번 뒤의 두 후보 줄 — 앞 ${read.length} 원소에서는 한 줄에 한 칸씩 남았다`}
        columns={B6.length}
        rows={candidateRows(
          B6,
          e.minCand,
          e.maxCand,
          { min: [e.minAt], max: [e.maxAt] },
          read,
        )}
      />
    );
  },
  "walk-pairs": () => (
    <CellStageFilm
      title={`minMaxPair(${show(A8)}) — T1~T${walkSteps(walkRun()).length}`}
      columns={A8.length}
      frames={film(walkSteps(walkRun()))}
    />
  ),
  "invariant-prefix": () => {
    const run = walkRun();
    const e = run.events.find((x) => x.kind === "max") as Event;
    const i = (e.i as number) + 2;
    const states: Partial<Record<number, CellState>> = {};
    for (let at = i; at < A8.length; at++) states[at] = "out";
    return (
      <RangeCover
        title={`쌍 하나를 끝낸 직후(i = ${i}) — min 과 max 는 앞 ${i} 칸의 두 극값이다`}
        row={{ label: "A 의 값", values: A8, states }}
        indexLabel="인덱스"
        ranges={[
          {
            from: 0,
            to: i - 1,
            tone: "query",
            note: `앞 ${i} 칸 · min = ${A8[e.minAt]} · max = ${A8[e.maxAt]}`,
          },
        ]}
        annotation={{
          cells: sorted([e.minAt, e.maxAt]),
          text: `min 은 A[${e.minAt}], max 는 A[${e.maxAt}] — 대시 칸은 아직 안 읽었다`,
        }}
      />
    );
  },
  "related-tournament": () => {
    const t = tournament([...A8]);
    const children = new Map<string, string[]>();
    const nodes: {
      id: string;
      label: string;
      value: string;
      at: number;
      r: number;
    }[] = [];
    const edges: GraphEdge[] = [];
    // 회전 r 의 j 번째 자리 = 그 회전에 남은 원소. 위 회전의 자리는 아래 회전의 두 자리를 잇는다.
    const top = t.rounds.length - 1;
    t.rounds.forEach((alive, r) => {
      alive.forEach((at, j) => {
        const id = `r${r}-${j}`;
        nodes.push({
          id,
          label: String(A8[at]),
          value: r === 0 ? `A[${at}]` : `${r} 회전`,
          at,
          r,
        });
        if (r > 0) {
          const below = [`r${r - 1}-${2 * j}`, `r${r - 1}-${2 * j + 1}`].filter(
            (c) =>
              (t.rounds[r - 1] as number[])[Number(c.split("-")[1])] !==
              undefined,
          );
          children.set(id, below);
          for (const c of below) edges.push({ from: id, to: c, kind: "plain" });
        }
      });
    });
    const xy = treeLayout([`r${top}-0`], children);
    const graphNodes: GraphNode[] = nodes.map((d) => {
      const p = xy.get(d.id) as { x: number; y: number };
      const beaten = d.r === 0 && t.beaten.includes(d.at);
      return {
        id: d.id,
        x: p.x * 0.8,
        y: p.y,
        label: d.label,
        value: d.value,
        ...(d.r === top
          ? { state: "focus" as const }
          : beaten
            ? { state: "read" as const }
            : {}),
      };
    });
    return (
      <NodeGraph
        title={`토너먼트 — 가장 큰 값 ${A8[t.winner]}${과와(A8[t.winner] as number)} 직접 비교된 원소 ${t.beaten.length} 개 중에 두 번째로 큰 값 ${A8[t.second]} 이 있다`}
        nodes={graphNodes}
        edges={edges}
        directed={false}
      />
    );
  },
};
