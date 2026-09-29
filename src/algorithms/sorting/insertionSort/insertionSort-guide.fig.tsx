/**
 * `insertionSort-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 정본의 걸음은 정본 소스에서 기계로
 * 만든 계측 사본 둘이 기록한다 — 비교할 때마다(`logged`), 키를 넣을 때마다(`placed`). 걸음 전체
 * (복사 · 키 뽑기 · 비교와 옮기기 · 넣기 · 반환)는 같은 절차를 다시 쓴 `trace` 가 만들고, 그 비교와
 * 넣기가 계측 기록과 **하나하나** 같은지 대조한다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은
 * 걸음에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는 `insertionSort-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import {
  CellStageFilm,
  type StageFrame,
} from "../../../_viz/patterns/CellStage";
import { RangeCover } from "../../../_viz/patterns/RangeCover";
import {
  type ArrayOptions,
  type ArrayPiece,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { insertionSort } from "./insertionSort-guide.ref.ts";

const REF = new URL("./insertionSort-guide.ref.ts", import.meta.url).pathname;

/** 두 값을 비교하는 그 한 줄. 계측과 변이는 이 줄에만 맞아야 한다. */
export const COMPARE_LINE =
  /^(\s*)while \(j >= 0 && \(B\[j\] as number\) > key\) \{$/;
/** 큰 값을 오른쪽으로 옮기는 그 한 줄. */
export const SHIFT_LINE = /^(\s*)B\[j \+ 1\] = B\[j\] as number;$/;
/** 멈춘 자리에 키를 넣는 그 한 줄 — 불변식을 지키던 줄이다. */
export const INSERT_LINE = /^(\s*)B\[j \+ 1\] = key;$/;

export type Sorter = { insertionSort(A: number[]): number[] };

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 비교 한 번 · 넣기 한 번의 기록 — 그 순간의 배열 전체와 `i` · `j` · `key`. */
interface Record4 {
  readonly arr: readonly number[];
  readonly i: number;
  readonly j: number;
  readonly key: number;
}

type Log = { __insCmp: Record4[]; __insPut: Record4[] };
type Tally = { __insN: { c: number; s: number } };

const logged = await loadMutant<Sorter>(REF, {
  swap: [
    COMPARE_LINE,
    "$1while (j >= 0 && (() => { (globalThis as unknown as { __insCmp: { arr: number[]; i: number; j: number; key: number }[] }).__insCmp.push({ arr: [...B], i, j, key }); return (B[j] as number) > key; })()) {",
  ],
});

const placed = await loadMutant<Sorter>(REF, {
  swap: [
    INSERT_LINE,
    "$1(globalThis as unknown as { __insPut: { arr: number[]; i: number; j: number; key: number }[] }).__insPut.push({ arr: [...B], i, j, key }); B[j + 1] = key;",
  ],
});

/** 비교 횟수만 세는 사본. 큰 입력에 쓴다. */
const countedCmp = await loadMutant<Sorter>(REF, {
  swap: [
    COMPARE_LINE,
    "$1while (j >= 0 && (() => { (globalThis as unknown as { __insN: { c: number; s: number } }).__insN.c++; return (B[j] as number) > key; })()) {",
  ],
});

/** 이동 횟수만 세는 사본. 옮기는 그 한 줄 앞에 계수만 끼운다. */
const countedShift = await loadMutant<Sorter>(REF, {
  swap: [
    SHIFT_LINE,
    "$1{ (globalThis as unknown as { __insN: { c: number; s: number } }).__insN.s++; B[j + 1] = B[j] as number; }",
  ],
});

export const same = (x: readonly number[], y: readonly number[]): boolean =>
  x.length === y.length && x.every((v, k) => v === y[k]);

/** 정본 한 번 호출의 비교 · 이동 횟수. 답은 정본과 대조한다. */
export function measure(A: readonly number[]): {
  compares: number;
  shifts: number;
} {
  const want = insertionSort([...A]);
  const g = globalThis as unknown as Tally;
  g.__insN = { c: 0, s: 0 };
  const a = countedCmp.insertionSort([...A]);
  const compares = g.__insN.c;
  g.__insN = { c: 0, s: 0 };
  const b = countedShift.insertionSort([...A]);
  const shifts = g.__insN.s;
  if (!same(a, want) || !same(b, want)) {
    throw new Error("계측한 사본이 정본과 다른 답을 냈다");
  }
  return { compares, shifts };
}

/* ───────────────── 같은 절차 — 걸음을 기록하며 ───────────────── */

/** 걸음 하나. 배열은 그 걸음을 마친 뒤의 모습이다. */
export type InsEvent =
  | { readonly kind: "copy"; readonly arr: readonly number[] }
  | {
      readonly kind: "lift";
      readonly i: number;
      readonly key: number;
      readonly arr: readonly number[];
    }
  | {
      readonly kind: "cmp";
      readonly i: number;
      readonly j: number;
      readonly key: number;
      /** 비교한 값 `B[j]`. */
      readonly a: number;
      /** `B[j] > key` 가 참이라 ③ 으로 옮겼는가. */
      readonly big: boolean;
      /** 비교하던 순간의 배열 — 계측 기록과 대조한다. */
      readonly before: readonly number[];
      readonly arr: readonly number[];
    }
  | {
      readonly kind: "place";
      readonly i: number;
      /** 키가 들어간 자리 `j + 1`. */
      readonly at: number;
      readonly key: number;
      /** `j = -1` 로 멈췄는가(구역의 왼쪽 끝을 지났다). */
      readonly edge: boolean;
      readonly before: readonly number[];
      readonly arr: readonly number[];
    }
  | { readonly kind: "done"; readonly arr: readonly number[] };

/** 바깥 반복 한 바퀴의 요약. */
export interface Round {
  readonly i: number;
  readonly key: number;
  readonly compares: number;
  readonly shifts: number;
  readonly at: number;
  readonly edge: boolean;
  /** 바퀴를 시작할 때의 배열. */
  readonly start: readonly number[];
  /** 바퀴를 마친 뒤의 배열. */
  readonly end: readonly number[];
}

export interface Trace {
  readonly input: readonly number[];
  readonly out: number[];
  readonly events: readonly InsEvent[];
  readonly rounds: readonly Round[];
  readonly compares: number;
  readonly shifts: number;
}

/**
 * 정본과 같은 절차를 걸음마다 기록하며 실행한다. `variant` 를 주면 한 곳을 바꾼 절차가 된다 —
 * `backwards` 는 옮기는 줄을 `B[j] = B[j + 1]` 로, `noInsert` 는 넣는 줄을 지운 것이다. 그 둘은
 * 짚고 가기와 불변식 절이 변이의 걸음을 보이는 데만 쓴다.
 */
export function trace(
  A: readonly number[],
  variant?: "backwards" | "noInsert",
): Trace {
  const B = [...A];
  const events: InsEvent[] = [{ kind: "copy", arr: [...B] }];
  const rounds: Round[] = [];
  let compares = 0;
  let shifts = 0;
  for (let i = 1; i < B.length; i++) {
    const start = [...B];
    const key = B[i] as number;
    events.push({ kind: "lift", i, key, arr: [...B] });
    let j = i - 1;
    let here = 0;
    let moved = 0;
    while (j >= 0) {
      const before = [...B];
      const a = B[j] as number;
      compares++;
      here++;
      const big = a > key;
      if (big) {
        if (variant === "backwards") B[j] = B[j + 1] as number;
        else B[j + 1] = a;
        shifts++;
        moved++;
      }
      events.push({ kind: "cmp", i, j, key, a, big, before, arr: [...B] });
      if (!big) break;
      j--;
    }
    const before = [...B];
    if (variant !== "noInsert") B[j + 1] = key;
    events.push({
      kind: "place",
      i,
      at: j + 1,
      key,
      edge: j < 0,
      before,
      arr: [...B],
    });
    rounds.push({
      i,
      key,
      compares: here,
      shifts: moved,
      at: j + 1,
      edge: j < 0,
      start,
      end: [...B],
    });
  }
  events.push({ kind: "done", arr: [...B] });
  return { input: [...A], out: B, events, rounds, compares, shifts };
}

/** 정본과 같은 절차의 기록 — 계측 기록과 하나하나 대조한다. */
export function run(A: readonly number[]): Trace {
  const t = trace(A);
  const g = globalThis as unknown as Log;
  g.__insCmp = [];
  const byCmp = logged.insertionSort([...A]);
  const cmpLog = g.__insCmp;
  g.__insPut = [];
  const byPut = placed.insertionSort([...A]);
  const putLog = g.__insPut;
  const ref = insertionSort([...A]);
  if (!same(byCmp, ref) || !same(byPut, ref) || !same(t.out, ref)) {
    throw new Error("계측 사본이나 다시 쓴 절차가 정본과 다른 답을 냈다");
  }
  const cmps = t.events.filter(
    (e): e is Extract<InsEvent, { kind: "cmp" }> => e.kind === "cmp",
  );
  if (cmps.length !== cmpLog.length) {
    throw new Error("비교 횟수가 정본 기록과 다르다");
  }
  cmps.forEach((e, k) => {
    const r = cmpLog[k] as Record4;
    if (
      r.i !== e.i ||
      r.j !== e.j ||
      r.key !== e.key ||
      !same(r.arr, e.before)
    ) {
      throw new Error(`${k + 1} 번째 비교가 정본 기록과 다르다`);
    }
  });
  const puts = t.events.filter(
    (e): e is Extract<InsEvent, { kind: "place" }> => e.kind === "place",
  );
  if (puts.length !== putLog.length) {
    throw new Error("넣기 횟수가 정본 기록과 다르다");
  }
  puts.forEach((e, k) => {
    const r = putLog[k] as Record4;
    if (
      r.i !== e.i ||
      r.j + 1 !== e.at ||
      r.key !== e.key ||
      !same(r.arr, e.before)
    ) {
      throw new Error(`${k + 1} 번째 넣기가 정본 기록과 다르다`);
    }
  });
  const m = measure(A);
  if (m.compares !== t.compares || m.shifts !== t.shifts) {
    throw new Error("세는 사본의 횟수가 기록과 다르다");
  }
  return t;
}

/** 길이 `n` 인 모든 순열(값 0 … n−1). 전수 확인에만 쓴다. */
export function permutations(n: number): number[][] {
  const out: number[][] = [];
  const used = new Array<boolean>(n).fill(false);
  const acc: number[] = [];
  const build = (): void => {
    if (acc.length === n) {
      out.push([...acc]);
      return;
    }
    for (let v = 0; v < n; v++) {
      if (used[v] === true) continue;
      used[v] = true;
      acc.push(v);
      build();
      acc.pop();
      used[v] = false;
    }
  };
  build();
  return out;
}

/** 값이 `0 … k−1` 인 길이 `n` 의 모든 배열 — 같은 값이 섞인 입력의 전수 확인에 쓴다. */
export function tuples(n: number, k: number): number[][] {
  let out: number[][] = [[]];
  for (let t = 0; t < n; t++) {
    out = out.flatMap((xs) => Array.from({ length: k }, (_, v) => [...xs, v]));
  }
  return out;
}

// 다시 쓴 절차가 정본과 걸음 하나하나까지 같은가 — 칸 7 개까지의 모든 순열과, 값 세 가지로 만든 칸
// 6 개까지의 모든 배열(같은 값이 섞인 입력)에서 확인한다. 어긋나면 아래 모든 표와 그림이 다른 절차를
// 잰 것이다.
for (let n = 0; n <= 7; n++) for (const p of permutations(n)) run(p);
for (let n = 1; n <= 6; n++) for (const p of tuples(n, 3)) run(p);

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const SIX = [5, 2, 4, 6, 1, 3];
/** 과제 규모 — 칸 수 `N`. 단순 연산 1 초에 1 억 번 기준으로 시간을 잰다. */
export const BIG = 100_000;
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toFixed(2)} 초`;
export const num = (x: number): string => x.toLocaleString("en-US");
export const show = (xs: readonly (number | null)[]): string =>
  `[${xs.map((v) => (v === null ? "_" : String(v))).join(" ")}]`;
export const range = (n: number): number[] => [...Array(n).keys()];
export const reversed = (n: number): number[] => range(n).reverse();

/** `A[t] = t` 로 두고 `t = 0, gap, 2·gap, …` 에서 이웃 두 칸을 맞바꾼다. 역순쌍이 맞바꾼 쌍의 수다. */
export function swapEvery(n: number, gap: number): number[] {
  const out = range(n);
  for (let t = 0; t + 1 < n; t += gap) {
    const tmp = out[t] as number;
    out[t] = out[t + 1] as number;
    out[t + 1] = tmp;
  }
  return out;
}

/** `A[t] = t` 로 두고 서로 떨어진 이웃 쌍 `k` 개(`t = 0, 2, 4, …`)를 맞바꾼다. */
export function withSwaps(n: number, k: number): number[] {
  const out = range(n);
  for (let s = 0; s < k; s++) {
    const t = 2 * s;
    const tmp = out[t] as number;
    out[t] = out[t + 1] as number;
    out[t + 1] = tmp;
  }
  return out;
}

/** 역순쌍 개수 — `p < q` 이고 `A[p] > A[q]` 인 쌍의 수. 정의를 그대로 센다. */
export function inversions(A: readonly number[]): number {
  let count = 0;
  for (let p = 0; p < A.length; p++) {
    for (let q = p + 1; q < A.length; q++) {
      if ((A[p] as number) > (A[q] as number)) count++;
    }
  }
  return count;
}

/** `N(N−1)/2` — 모든 쌍의 수. */
export const pairs = (n: number): number => (n * (n - 1)) / 2;

/* ───────────────── 가장 단순한 방법 — 모든 쌍을 비교해 맞바꾸기 ───────────────── */

export interface NaiveRound {
  readonly p: number;
  readonly compares: number;
  readonly swaps: number;
  readonly after: readonly number[];
  /** 이 바퀴가 비교한 값의 짝 — 작은 값이 앞이다. */
  readonly compared: readonly (readonly [number, number])[];
}

/** 본문에 싣는 `sortNaive` 를 그대로 실행하고 바퀴마다 기록한다. 답은 정본과 대조한다. */
export function naiveRounds(A: readonly number[]): NaiveRound[] {
  const B = [...A];
  const rounds: NaiveRound[] = [];
  for (let p = 0; p < B.length; p++) {
    let compares = 0;
    let swaps = 0;
    const compared: [number, number][] = [];
    for (let q = p + 1; q < B.length; q++) {
      compares++;
      const x = B[p] as number;
      const y = B[q] as number;
      compared.push(x < y ? [x, y] : [y, x]);
      if (x > y) {
        B[p] = y;
        B[q] = x;
        swaps++;
      }
    }
    rounds.push({ p, compares, swaps, after: [...B], compared });
  }
  if (!same(B, insertionSort([...A]))) {
    throw new Error("모든 쌍을 비교하는 방법이 정본과 다른 답을 냈다");
  }
  return rounds;
}

export const naiveCompares = (A: readonly number[]): number =>
  naiveRounds(A).reduce((s, r) => s + r.compares, 0);

// 모든 쌍을 비교하는 방법의 비교 횟수가 입력과 무관하게 `N(N−1)/2` 인가 — 칸 1 개부터 200 개까지 세 입력.
for (let n = 1; n <= 200; n++) {
  for (const A of [range(n), reversed(n), withSwaps(n, n >> 2)]) {
    if (naiveCompares(A) !== pairs(n)) {
      throw new Error("모든 쌍 비교의 횟수가 식과 다르다");
    }
  }
}

/* ───────────────── 자리를 왼쪽 끝에서부터 찾는 후보 ───────────────── */

/**
 * 정렬된 구역의 **앞에서부터** 보며 `key` 보다 큰 첫 값을 만나면 거기가 자리다. 답은 정본과 같고
 * 이동 횟수도 같다 — 갈리는 것은 비교다. `log` 를 주면 비교마다 `[값, 참인가]` 를 적는다.
 */
export function leftScan(
  A: readonly number[],
  log?: { i: number; out: [number, boolean][] },
): { out: number[]; compares: number; shifts: number } {
  const B = [...A];
  let compares = 0;
  let shifts = 0;
  for (let i = 1; i < B.length; i++) {
    const key = B[i] as number;
    let p = 0;
    while (p < i) {
      compares++;
      const big = (B[p] as number) > key;
      if (log?.i === i) log.out.push([B[p] as number, big]);
      if (big) break;
      p++;
    }
    for (let q = i; q > p; q--) {
      B[q] = B[q - 1] as number;
      shifts++;
    }
    B[p] = key;
  }
  if (!same(B, insertionSort([...A]))) {
    throw new Error("왼쪽 끝부터 찾는 후보가 정본과 다른 답을 냈다");
  }
  return { out: B, compares, shifts };
}

// 왼쪽 끝부터 찾는 후보가 정렬된 입력에서 `N(N−1)/2` 번을 비교하는가 — 칸 1 개부터 400 개까지.
for (let n = 1; n <= 400; n++) {
  if (leftScan(range(n)).compares !== pairs(n)) {
    throw new Error("왼쪽 끝부터 찾기의 정렬된 입력 비교가 식과 다르다");
  }
}

// 정본이 역순 입력에서 `N(N−1)/2` 번을 비교하고 옮기는가 — 칸 1 개부터 400 개까지와 두 크기.
for (const n of [...range(401).slice(1), 1_000, 2_000]) {
  const m = measure(reversed(n));
  if (m.compares !== pairs(n) || m.shifts !== pairs(n)) {
    throw new Error(`역순 입력의 비교 · 이동이 식과 다르다 (n = ${n})`);
  }
}

/** 규모 `N = 100,000` 의 값. 역순 입력과 정렬된 입력의 왼쪽 끝부터 찾기는 위에서 대조한 식으로 낸다. */
export function scaleCounts() {
  const nearly = swapEvery(BIG, 100);
  const sortedM = measure(range(BIG));
  const nearlyM = measure(nearly);
  return {
    naive: pairs(BIG),
    leftSorted: pairs(BIG),
    sorted: sortedM,
    nearly: nearlyM,
    nearlyInv: inversions10(nearly),
    nearlySwaps: Math.ceil((BIG - 1) / 100),
    worst: pairs(BIG),
  };
}

/**
 * 큰 입력의 역순쌍 — 정의대로 세면 `N²` 이라 못 센다. 맞바꾼 쌍이 서로 떨어져 있을 때만 쓰는 셈이고,
 * 그 입력인지(이웃 칸만 뒤바뀌었는지)를 먼저 확인한다.
 */
function inversions10(A: readonly number[]): number {
  let count = 0;
  for (let t = 0; t < A.length; t++) {
    const v = A[t] as number;
    if (Math.abs(v - t) > 1) throw new Error("이웃 칸만 뒤바뀐 입력이 아니다");
    if (v === t + 1) count++;
  }
  return count;
}

let scaleMemo: ReturnType<typeof scaleCounts> | undefined;
export const scale = (): ReturnType<typeof scaleCounts> => {
  scaleMemo ??= scaleCounts();
  return scaleMemo;
};

/* ───────────────── 시도한 방법 ───────────────── */

function approaches(): Approach[] {
  const s = scale();
  return [
    {
      name: "모든 쌍 비교하기",
      idea: "두 자리를 모두 짝지어, 앞이 더 크면 맞바꾼다",
      verdict: "drop",
      checks: [
        {
          label: "비교",
          value: `거의 정렬된 입력도 ${num(s.naive)} 번 · ${secondsOf(s.naive)}`,
          ok: false,
        },
      ],
      lesson:
        "한 바퀴가 알아낸 순서를 다음 바퀴가 다시 비교한다 — 앞부분을 정렬된 채로 두면 어떨까",
    },
    {
      name: "정렬된 구역에 왼쪽 끝부터 자리 찾기",
      idea: "앞부분을 오름차순으로 두고, 다음 값의 자리를 구역 앞에서부터 찾는다",
      verdict: "drop",
      checks: [
        {
          label: "비교",
          value: `이미 정렬된 입력 ${num(s.leftSorted)} 번 · ${secondsOf(s.leftSorted)}`,
          ok: false,
        },
      ],
      lesson:
        "제자리에 가까운 값도 구역 전체를 지나간다 — 오른쪽 끝부터 보면 어떨까",
    },
    {
      name: "정렬된 구역에 오른쪽 끝부터 옮기며 넣기",
      idea: "구역 오른쪽 끝부터 다음 값보다 큰 값을 한 칸씩 옮기고, 멈춘 자리에 넣는다",
      verdict: "keep",
      checks: [
        {
          label: "비교",
          value: `거의 정렬된 입력 ${num(s.nearly.compares)} 번 · ${secondsOf(s.nearly.compares)}`,
          ok: true,
        },
        {
          label: "최악",
          value: `역순 입력 ${num(s.worst)} 번 — 막지 못한다`,
          ok: false,
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
  readonly stage: ArrayStep;
}

/** 전체 실행 무대의 이름표. */
export const RUN_OPTIONS: ArrayOptions = {
  arrayName: "B",
  rangeLabel: "구역",
};

/** 바퀴 도중의 조각 — 빈 칸 왼쪽의 값 · 빈 칸(키가 들어갈 자리) · 빈 칸 오른쪽으로 옮긴 값. */
function roundPieces(i: number, hole: number, key: number): ArrayPiece[] {
  const out: ArrayPiece[] = [];
  if (hole - 1 >= 0)
    out.push({ label: "왼쪽", from: 0, to: hole - 1, tone: "left" });
  out.push({
    label: "빈 칸",
    from: hole,
    to: hole,
    tone: "right",
    text: `key ${key}`,
  });
  if (i >= hole + 1) {
    out.push({ label: "옮긴 값", from: hole + 1, to: i, tone: "left" });
  }
  return out;
}

/** 걸음마다 — 복사 · 키 뽑기 · 비교(참이면 옮기기) · 넣기 · 반환. */
export function traceSteps(t: Trace, from: number): Step[] {
  let n = from;
  let compares = 0;
  let shifts = 0;
  const count = () => `비교 누적 ${compares} 번 · 이동 누적 ${shifts} 번`;
  const size = t.input.length;
  return t.events.map((e): Step => {
    const id = `T${n++}`;
    if (e.kind === "copy") {
      return {
        id,
        title: "복사하고 한 칸짜리 구역을 둔다",
        detail: `B 는 A 와 값이 같은 새 배열입니다. 칸이 하나뿐인 B[0..0] 은 값 ${e.arr[0]} 하나라 이미 오름차순이고, 이것이 첫 정렬된 구역입니다.`,
        stage: {
          array: [...e.arr],
          range: size === 0 ? null : [0, 0],
          read: [],
          write: [],
          calc: null,
          vars: count(),
        },
      };
    }
    if (e.kind === "lift") {
      return {
        id,
        title: `i=${e.i} key = ${e.key}${을를(e.key)} 뽑는다`,
        detail: `i = ${e.i} < ${size}${josa(size, "이라", "라")} 한 바퀴를 실행합니다. B[${e.i}] 의 값 ${e.key}${을를(e.key)} key 에 담아 두면 그 칸은 덮어써도 되는 빈 칸이 됩니다. j 는 ${e.i - 1} 에서 시작합니다.`,
        stage: {
          array: [...e.arr],
          range: [0, e.i],
          read: [e.i],
          write: [],
          pieces: roundPieces(e.i, e.i, e.key),
          pointers: { i: e.i, j: e.i - 1 },
          calc: { expr: `key ← B[${e.i}]`, result: String(e.key) },
          vars: count(),
        },
      };
    }
    if (e.kind === "cmp") {
      compares++;
      if (e.big) shifts++;
      const hole = e.big ? e.j : e.j + 1;
      return {
        id,
        title: `j=${e.j} ${e.a} > ${e.key} ${e.big ? "참 ③" : "거짓"}`,
        detail: e.big
          ? `B[${e.j}] = ${e.a}${이가(e.a)} key ${e.key} 보다 커서 ③ 으로 B[${e.j + 1}] 에 옮겨 적습니다. 빈 칸이 인덱스 ${e.j}${으로(e.j)} 옵니다.`
          : `B[${e.j}] = ${e.a}${이가(e.a)} key ${e.key} 보다 크지 않아 반복을 멈춥니다. 빈 칸은 인덱스 ${e.j + 1} 에 있습니다.`,
        stage: {
          array: [...e.arr],
          range: [0, e.i],
          read: [e.j],
          write: e.big ? [e.j + 1] : [],
          pieces: roundPieces(e.i, hole, e.key),
          pointers: { i: e.i, j: e.j },
          calc: { expr: `${e.a} > ${e.key}`, result: e.big ? "참" : "거짓" },
          vars: count(),
        },
      };
    }
    if (e.kind === "place") {
      return {
        id,
        title: `B[${e.at}] ← ${e.key} ④`,
        detail: e.edge
          ? `j = -1 이라 j >= 0 이 거짓이고 반복이 끝났습니다. ④ 로 빈 칸 B[0] 에 key ${e.key}${을를(e.key)} 넣어 구역이 ${e.i + 1} 칸이 됩니다.`
          : `④ 로 빈 칸 B[${e.at}] 에 key ${e.key}${을를(e.key)} 넣어 구역이 ${e.i + 1} 칸이 됩니다.`,
        stage: {
          array: [...e.arr],
          range: [0, e.i],
          read: [],
          write: [e.at],
          pointers: { i: e.i, j: e.at - 1 },
          calc: e.edge
            ? { expr: "-1 >= 0", result: "거짓" }
            : { expr: `B[${e.at}] ← key`, result: String(e.key) },
          vars: count(),
        },
      };
    }
    return {
      id,
      title: "B 를 돌려준다",
      detail: `i = ${Math.max(size, 1)} < ${size}${이가(size)} 거짓이라 바깥 반복이 끝났습니다. 구역이 배열 전체이고, 입력 A 는 ${show(t.input)} 그대로입니다.`,
      stage: {
        array: [...e.arr],
        range: size === 0 ? null : [0, size - 1],
        read: [],
        write: [],
        calc: {
          expr: `${Math.max(size, 1)} < ${size}`,
          result: "거짓",
        },
        vars: count(),
      },
    };
  });
}

/** 전개 입력의 걸음 전부(T1 부터). */
export const walkSteps = (): Step[] => traceSteps(run(SIX), 1);

const film = (steps: readonly Step[], opts: ArrayOptions): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(s.stage, opts),
  }));

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `insertionSort-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    walk6: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 전체 컨셉 — 이미 오름차순인 네 칸에 1 을 넣는 한 바퀴. */
export const CONCEPT_INPUT = [2, 4, 5, 6, 1];

export const FIGS: Record<string, () => ReactElement> = {
  "concept-insert": () => {
    const t = run(CONCEPT_INPUT);
    const last = t.rounds.at(-1) as Round;
    const steps = traceSteps(t, 1).filter((_, k) => {
      const e = t.events[k] as InsEvent;
      return (
        e.kind !== "copy" && e.kind !== "done" && "i" in e && e.i === last.i
      );
    });
    const frames = steps.map((s, k) => ({
      id: String(k + 1),
      text: s.title.replace(/ [③④]$/, ""),
      rows: arrayStage(
        { ...s.stage, vars: null, calc: null },
        { arrayName: "B", rangeLabel: "구역" },
      ),
    }));
    return (
      <CellStageFilm
        title={`오름차순인 ${show(last.start.slice(0, last.i))} 에 ${last.key}${을를(last.key)} 넣는다`}
        columns={CONCEPT_INPUT.length}
        frames={frames}
      />
    );
  },
  "concept-grow": () => {
    const t = run(SIX);
    const frames: StageFrame[] = [
      {
        id: "처음",
        text: `구역 [${SIX[0]}] — 칸 하나는 그대로 오름차순이다`,
        rows: arrayStage(
          { array: [...SIX], range: [0, 0], read: [], write: [] },
          { arrayName: "B", rangeLabel: "정렬된 구역" },
        ),
      },
      ...t.rounds.map((r) => ({
        id: `i=${r.i}`,
        text: `${r.key}${을를(r.key)} 넣었다 — 구역 ${r.i + 1} 칸`,
        rows: arrayStage(
          { array: [...r.end], range: [0, r.i], read: [], write: [r.at] },
          { arrayName: "B", rangeLabel: "정렬된 구역" },
        ),
      })),
    ];
    return (
      <CellStageFilm
        title={`${show(SIX)} — 정렬된 구역이 한 칸씩 는다`}
        columns={SIX.length}
        frames={frames}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`칸 ${num(BIG)} 개 · 거의 정렬된 입력이 흔하다 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "invariant-split": () => {
    const t = run(SIX);
    const r = t.rounds.find((x) => x.i === 4) as Round;
    return (
      <RangeCover
        title={`i = ${r.i} 바퀴를 시작할 때의 B`}
        row={{ label: "B", values: [...r.start] }}
        indexLabel="인덱스"
        ranges={[
          {
            from: 0,
            to: r.i - 1,
            tone: "left",
            note: `오름차순 · 값은 A[0..${r.i - 1}] 과 같은 모음`,
          },
          {
            from: r.i,
            to: SIX.length - 1,
            tone: "right",
            note: `A[${r.i}..${SIX.length - 1}] 그대로`,
          },
        ]}
      />
    );
  },
  "walk-insert": () => {
    const steps = walkSteps();
    return (
      <CellStageFilm
        title={`insertionSort([${SIX.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={SIX.length}
        frames={film(steps, RUN_OPTIONS)}
      />
    );
  },
};
