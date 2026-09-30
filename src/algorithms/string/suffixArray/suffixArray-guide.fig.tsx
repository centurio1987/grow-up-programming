/**
 * `suffixArray-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 바퀴 하나가 끝날 때의 접미사 배열과
 * 순위 배열은 정본 소스에서 기계로 만든 계측 사본(`logged`)이 기록한다. 바퀴 안의 걸음(쌍 만들기 · 뒤
 * 성분 정렬 · 앞 성분 정렬 · 순위 다시 매기기)은 같은 절차를 다시 쓴 `replay` 가 만들고, `trace` 가 그
 * 바퀴 끝 상태를 계측 기록과 **바퀴마다** 대조한다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은
 * 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는 `suffixArray-guide.test.ts` 가 잰다.
 *
 * `replay` 는 계측이 없는 다시 쓰기라 변이를 중화한 실행(`check-proof` 가 두 번째로 부르는 실행)에서도
 * 값이 나온다. 중화 실행에서는 계측 사본이 정본 그대로라 기록이 비고 `trace` 가 던진다 — 그래서 판정
 * 줄(「같다」·「어긋난다」)이 있는 증명 블록은 `trace` 를 부르지 않는다.
 *
 * 비용은 원고 전체에서 **자료 접근** 하나로 센다 — 배열 칸을 읽거나 쓴 횟수와 문자열 글자를 읽은
 * 횟수의 합이다. 비교 횟수만 세면 계수 정렬이 0 이 되고, 글자 읽기만 세면 순위 쌍 배가가 첫 바퀴 뒤로
 * 0 이 되어 두 방법을 같은 자로 잴 수 없다. 계수기(`counted*`)는 정본과 같은 절차에 셈만 덧붙인 것이고,
 * 부를 때마다 답을 정본과 대조한다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 이가 } from "../../../../tools/josa.ts";
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
import { LayerBars } from "../../../_viz/patterns/LayerBars";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { suffixArray } from "./suffixArray-guide.ref.ts";

const REF = new URL("./suffixArray-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 공용 값 ───────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 여섯 글자 안에서 다섯 갈래가 모두 실행되고(첫 순위 · 범위 밖 표시 · 정렬
 * 두 번 · 같은 쌍 유지 · 종료), 바퀴가 두 번이라 앞 바퀴의 순위를 재료로 쓰는 것이 값으로 보인다.
 */
export const WALK = "banana";

/** 과제 규모의 상한. */
export const LIMIT = 100_000;

/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
export const OPS_PER_SEC = 1e8;

export const show = (xs: readonly number[]): string => `[${xs.join(", ")}]`;
export const num = (x: number): string => x.toLocaleString("en-US");

const same = (x: readonly number[], y: readonly number[]): boolean =>
  x.length === y.length && x.every((v, k) => v === y[k]);

/** 계수기가 정본과 같은 답을 냈는가. 다르면 다른 절차를 잰 것이라 던진다. */
export function assertSame(s: string, got: readonly number[], who: string) {
  if (!same(got, suffixArray(s))) {
    throw new Error(`${who} 와 정본의 답이 다르다 — 계측이 다른 절차를 쟀다`);
  }
}

/** 결정론적 입력 — mulberry32(씨앗 `0x9e3779b9`). 32비트 정수 연산만 써서 배정밀도 손실이 없다. */
export function makeText(n: number, sigma: number): string {
  let a = 0x9e3779b9;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    out.push(String.fromCharCode(97 + (((t ^ (t >>> 14)) >>> 0) % sigma)));
  }
  return out.join("");
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 바퀴 하나가 끝난 시점의 기록 — 계측 사본이 `rank = next;` 바로 뒤에서 남긴다. */
interface RoundLog {
  readonly gap: number;
  readonly sa: number[];
  readonly rank: number[];
  readonly top: number;
}

type Log = { __saLog?: RoundLog[] };

const logged = await loadMutant<{ suffixArray(s: string): number[] }>(REF, {
  swap: [
    /^(\s*)rank = next;$/,
    "$1rank = next;\n$1(globalThis as unknown as { __saLog?: { gap: number; sa: number[]; rank: number[]; top: number }[] }).__saLog?.push({ gap, sa: [...sa], rank: [...next], top });",
  ],
});

/* ───────────────── 같은 절차 — 걸음을 기록하며 ───────────────── */

/** 이웃한 두 자리의 쌍을 비교한 한 번 — 순위 다시 매기기의 판정. */
export interface Judge {
  readonly j: number;
  readonly a: number;
  readonly b: number;
  readonly pa: readonly [number, number];
  readonly pb: readonly [number, number];
  readonly up: boolean;
  readonly top: number;
}

/** 바퀴 하나. */
export interface Round {
  /** 몇 번째 바퀴인가(1 부터). */
  readonly n: number;
  readonly gap: number;
  /** 바퀴를 시작할 때의 순위 배열 — 길이 `gap` 조각의 순위. */
  readonly rank: readonly number[];
  /** 자리마다의 뒤 성분 `back(i)`. */
  readonly backs: readonly number[];
  /** 바퀴를 시작할 때의 `span`. */
  readonly span: number;
  /** 바퀴를 시작할 때의 접미사 배열. */
  readonly saIn: readonly number[];
  /** 뒤 성분으로 정렬한 뒤. */
  readonly saBack: readonly number[];
  /** 앞 성분으로 다시 정렬한 뒤. */
  readonly saFront: readonly number[];
  readonly judges: readonly Judge[];
  /** 바퀴가 끝난 뒤의 순위 배열 — 길이 `2·gap` 조각의 순위. */
  readonly next: readonly number[];
  readonly spanOut: number;
}

export interface Replay {
  readonly s: string;
  /** 길이 1 조각의 순위 — 글자 코드. */
  readonly rank0: readonly number[];
  readonly rounds: readonly Round[];
  readonly sa: readonly number[];
}

/** 정본의 `countingSortBy` 와 같은 안정 계수 정렬. */
function stableBy(
  order: readonly number[],
  key: (i: number) => number,
  span: number,
): number[] {
  const count = new Array<number>(span).fill(0);
  for (const i of order) count[key(i)] = (count[key(i)] as number) + 1;
  for (let v = 1; v < span; v++) {
    count[v] = (count[v] as number) + (count[v - 1] as number);
  }
  const out = new Array<number>(order.length).fill(0);
  for (let p = order.length - 1; p >= 0; p--) {
    const i = order[p] as number;
    const k = key(i);
    count[k] = (count[k] as number) - 1;
    out[count[k] as number] = i;
  }
  return out;
}

/** 정본과 같은 절차를 바퀴마다 멈춰 기록한다. 계측이 없어 중화 실행에서도 값이 나온다. */
export function replay(s: string): Replay {
  const n = s.length;
  let sa = Array.from({ length: n }, (_, i) => i);
  let rank = Array.from({ length: n }, (_, i) => s.charCodeAt(i));
  const rank0 = [...rank];
  let span = 128;
  const rounds: Round[] = [];
  for (let gap = 1; gap < n; gap *= 2) {
    const cur = rank;
    const front = (i: number): number => cur[i] as number;
    const back = (i: number): number =>
      i + gap < n ? (cur[i + gap] as number) + 1 : 0;
    const saIn = [...sa];
    const saBack = stableBy(saIn, back, span + 1);
    const saFront = stableBy(saBack, front, span + 1);
    sa = saFront;
    const next = new Array<number>(n).fill(0);
    let top = 0;
    const judges: Judge[] = [];
    for (let j = 1; j < n; j++) {
      const a = sa[j - 1] as number;
      const b = sa[j] as number;
      const up = front(a) !== front(b) || back(a) !== back(b);
      if (up) top++;
      next[b] = top;
      judges.push({
        j,
        a,
        b,
        pa: [front(a), back(a)],
        pb: [front(b), back(b)],
        up,
        top,
      });
    }
    rounds.push({
      n: rounds.length + 1,
      gap,
      rank: [...cur],
      backs: Array.from({ length: n }, (_, i) => back(i)),
      span,
      saIn,
      saBack,
      saFront,
      judges,
      next: [...next],
      spanOut: top + 1,
    });
    rank = next;
    span = top + 1;
    if (span === n) break;
  }
  return { s, rank0, rounds, sa };
}

/** `replay` 를 정본 계측 기록과 바퀴마다 대조한다. 어긋나면 다른 절차를 기록한 것이라 던진다. */
export function trace(s: string): Replay {
  const r = replay(s);
  const g = globalThis as unknown as Log;
  g.__saLog = [];
  const byLog = logged.suffixArray(s);
  const log = g.__saLog;
  g.__saLog = undefined;
  const ref = suffixArray(s);
  if (!same(byLog, ref) || !same(r.sa, ref)) {
    throw new Error(
      `계측 사본이나 다시 쓴 절차가 정본과 다른 답을 냈다 — "${s}"`,
    );
  }
  if (log.length !== r.rounds.length) {
    throw new Error(
      `바퀴 수가 정본 기록과 다르다 — 기록 ${log.length} · 다시 쓴 절차 ${r.rounds.length}`,
    );
  }
  r.rounds.forEach((round, k) => {
    const e = log[k] as RoundLog;
    if (
      e.gap !== round.gap ||
      !same(e.sa, round.saFront) ||
      !same(e.rank, round.next) ||
      e.top + 1 !== round.spanOut
    ) {
      throw new Error(`${k + 1} 번째 바퀴가 정본 기록과 다르다 — "${s}"`);
    }
  });
  return r;
}

let walkMemo: Replay | undefined;
/** 전개 입력의 기록 — 정본 계측과 대조한 것. */
export const walkRun = (): Replay => {
  walkMemo ??= trace(WALK);
  return walkMemo;
};

/** 길이 `len` 조각을 자리 `i` 에서 잘라 낸다. 문자열 끝을 넘으면 남은 만큼만이다. */
export const piece = (s: string, i: number, len: number): string =>
  s.slice(i, i + len);

/* ───────────────────────── 계수기 ───────────────────────── */

let access = 0;

const rd = (a: number[], i: number): number => {
  access++;
  return a[i] as number;
};

const wr = (a: number[], i: number, v: number): void => {
  access++;
  a[i] = v;
};

/** 셈을 덧붙인 안정 계수 정렬 — 정본의 `countingSortBy` 와 같은 줄 순서다. */
function countedSort(
  order: number[],
  key: (i: number) => number,
  k: number,
): number[] {
  const count = new Array<number>(k).fill(0);
  for (let p = 0; p < order.length; p++) {
    const v = key(rd(order, p));
    wr(count, v, rd(count, v) + 1);
  }
  for (let v = 1; v < k; v++) wr(count, v, rd(count, v) + rd(count, v - 1));
  const out = new Array<number>(order.length).fill(0);
  for (let p = order.length - 1; p >= 0; p--) {
    const i = rd(order, p);
    const v = key(i);
    wr(count, v, rd(count, v) - 1);
    wr(out, rd(count, v), i);
  }
  return out;
}

export interface Counted {
  readonly sa: number[];
  readonly access: number;
  readonly rounds: number;
  /** 바퀴마다의 자료 접근. */
  readonly perRound: number[];
  /** 동시에 잡혀 있는 칸의 최댓값. */
  readonly cells: number;
  /** 첫 순위를 매기는 데 든 자료 접근. */
  readonly first: number;
}

/** 정본과 같은 절차에 자료 접근 셈만 덧붙인 것. 답은 정본과 대조한다. */
export function countedDoubling(s: string): Counted {
  access = 0;
  const n = s.length;
  let sa = Array.from({ length: n }, (_, i) => i);
  let rank = Array.from({ length: n }, (_, i) => s.charCodeAt(i));
  let span = 128;
  let rounds = 0;
  let cells = 2 * n;
  const perRound: number[] = [];
  // 첫 순위를 매길 때 글자를 n 번 읽는다.
  access += n;
  let mark = access;
  const first = access;
  for (let gap = 1; gap < n; gap *= 2) {
    rounds++;
    const front = (i: number): number => rd(rank, i);
    const back = (i: number): number =>
      i + gap < n ? rd(rank, i + gap) + 1 : 0;
    cells = Math.max(cells, 3 * n + span + 1);
    for (const key of [back, front]) sa = countedSort(sa, key, span + 1);
    const next = new Array<number>(n).fill(0);
    let top = 0;
    for (let j = 1; j < n; j++) {
      const a = rd(sa, j - 1);
      const b = rd(sa, j);
      if (front(a) !== front(b) || back(a) !== back(b)) top++;
      wr(next, b, top);
    }
    rank = next;
    span = top + 1;
    perRound.push(access - mark);
    mark = access;
    if (span === n) break;
  }
  assertSame(s, sa, "순위 쌍 배가 계수기");
  return { sa, access, rounds, perRound, cells, first };
}

/**
 * 합치기 정렬로 자리 번호를 늘어놓는다. 엔진의 `sort` 는 구현마다 비교 순서가 달라 셈이 결정론이
 * 아니다. `compare` 는 비교 한 번이 읽은 글자 수의 자료 접근을 돌려준다.
 */
function mergeSortBy(
  n: number,
  compare: (a: number, b: number) => { less: boolean; cost: number },
): { order: number[]; cost: number } {
  let cost = 0;
  let cur = Array.from({ length: n }, (_, i) => i);
  let buf = new Array<number>(n).fill(0);
  for (let w = 1; w < n; w *= 2) {
    for (let lo = 0; lo < n; lo += 2 * w) {
      const mid = Math.min(lo + w, n);
      const hi = Math.min(lo + 2 * w, n);
      let p = lo;
      let q = mid;
      for (let k = lo; k < hi; k++) {
        cost += 2; // 옮길 값을 읽고 쓴다
        if (p < mid && q < hi) {
          const c = compare(cur[q] as number, cur[p] as number);
          cost += c.cost;
          if (c.less) {
            buf[k] = cur[q] as number;
            q++;
          } else {
            buf[k] = cur[p] as number;
            p++;
          }
        } else if (p < mid) {
          buf[k] = cur[p] as number;
          p++;
        } else {
          buf[k] = cur[q] as number;
          q++;
        }
      }
    }
    const t = cur;
    cur = buf;
    buf = t;
  }
  return { order: cur, cost };
}

/** 두 접미사를 글자로 비교한다. 글자 한 쌍을 읽을 때마다 자료 접근 2 번이다. */
export function compareByChars(
  s: string,
  a: number,
  b: number,
): { less: boolean; cost: number } {
  const n = s.length;
  let k = 0;
  let cost = 0;
  while (a + k < n && b + k < n) {
    cost += 2;
    if (s[a + k] !== s[b + k]) {
      return { less: (s[a + k] as string) < (s[b + k] as string), cost };
    }
    k++;
  }
  return { less: n - a < n - b, cost };
}

/** 시작 자리끼리 글자로 비교하는 정렬. 답은 정본과 대조한다. */
export function countedNaive(s: string): { sa: number[]; access: number } {
  const r = mergeSortBy(s.length, (a, b) => compareByChars(s, a, b));
  assertSame(s, r.order, "글자 비교 정렬");
  return { sa: r.order, access: r.cost };
}

/**
 * 전부 같은 글자일 때 글자 비교 정렬의 자료 접근을 **글자를 하나씩 읽지 않고** 낸다. `a` 만 있으면 두
 * 접미사의 비교는 짧은 쪽 길이만큼 글자를 읽고 끝나므로 비교 하나의 셈이 `2·min(n−a, n−b)` 로 닫힌다.
 * 작은 `n` 에서는 실제로 읽은 셈과 같은지 대조한다.
 */
export function naiveCostAllSame(n: number): number {
  const r = mergeSortBy(n, (a, b) => ({
    less: n - a < n - b,
    cost: 2 * Math.min(n - a, n - b),
  }));
  if (n <= 2000) {
    const real = countedNaive("a".repeat(n));
    if (real.access !== r.cost) {
      throw new Error(`닫힌 셈이 실제로 읽은 셈과 다르다 — n = ${n}`);
    }
  }
  return r.cost;
}

/**
 * 한 바퀴에 조각을 `m` 배로 늘리는 일반형. 키가 성분 `m` 개라 바퀴마다 계수 정렬이 `m` 번이고, 판정도
 * `m` 개 값을 비교한다. `m = 2` 면 정본과 같은 셈이 나와야 한다.
 */
export function generalized(
  s: string,
  m: number,
): { sa: number[]; access: number; rounds: number } {
  access = 0;
  const n = s.length;
  let sa = Array.from({ length: n }, (_, i) => i);
  let rank = Array.from({ length: n }, (_, i) => s.charCodeAt(i));
  access += n;
  let span = 128;
  let rounds = 0;
  for (let len = 1; len < n; len *= m) {
    rounds++;
    const offs = Array.from({ length: m }, (_, t) => t * len);
    const keyOf = (t: number) => (i: number) => {
      const o = offs[t] as number;
      if (o === 0) return rd(rank, i);
      return i + o < n ? rd(rank, i + o) + 1 : 0;
    };
    for (let t = m - 1; t >= 0; t--) sa = countedSort(sa, keyOf(t), span + 1);
    const next = new Array<number>(n).fill(0);
    let top = 0;
    for (let j = 1; j < n; j++) {
      const a = rd(sa, j - 1);
      const b = rd(sa, j);
      let differ = false;
      for (let t = 0; t < m && !differ; t++) {
        if (keyOf(t)(a) !== keyOf(t)(b)) differ = true;
      }
      if (differ) top++;
      wr(next, b, top);
    }
    rank = next;
    span = top + 1;
    if (span === n) break;
  }
  assertSame(s, sa, `x${m} 일반형`);
  return { sa, access, rounds };
}

/**
 * 한 바퀴에 조각을 **한 글자씩** 늘리는 절차 — 쌍 (길이 `L` 순위, 자리 `i + L` 의 글자) 로 길이 `L + 1`
 * 순위를 만든다. 뒤 성분이 글자 코드라 계수 정렬의 칸은 `max(span, 128) + 1` 이다.
 */
export function countedPlusOne(s: string): { access: number; rounds: number } {
  access = 0;
  const n = s.length;
  let sa = Array.from({ length: n }, (_, i) => i);
  let rank = Array.from({ length: n }, (_, i) => s.charCodeAt(i));
  access += n;
  let span = 128;
  let rounds = 0;
  for (let len = 1; len < n; len++) {
    rounds++;
    const front = (i: number): number => rd(rank, i);
    const back = (i: number): number => {
      if (i + len >= n) return 0;
      access++; // 글자 하나를 읽는다
      return s.charCodeAt(i + len) + 1;
    };
    sa = countedSort(sa, back, 129);
    sa = countedSort(sa, front, span + 1);
    const next = new Array<number>(n).fill(0);
    let top = 0;
    for (let j = 1; j < n; j++) {
      const a = rd(sa, j - 1);
      const b = rd(sa, j);
      if (front(a) !== front(b) || back(a) !== back(b)) top++;
      wr(next, b, top);
    }
    rank = next;
    span = top + 1;
    if (span === n) break;
  }
  assertSame(s, sa, "한 글자씩 늘리는 절차");
  return { access, rounds };
}

/* ───────────────── 사다리 값 — 증명 블록과 그림이 같은 셈을 쓴다 ───────────────── */

/** 한 글자씩 늘리는 절차는 과제 상한에서 끝나지 않아 같은 모양의 작은 규모로 잰다. */
export const PLUS_ONE_N = 2_000;

export interface OriginCounts {
  /** 접미사를 전부 잘라 담을 때의 글자 수 `n(n+1)/2`. */
  readonly sliceChars: number;
  /** 글자 하나를 1 바이트로 잡은 메모리(MB). */
  readonly sliceMb: number;
  readonly naiveAllSame: number;
  readonly doubleAllSame: Counted;
  readonly doubleRandom: Counted;
  readonly plusOne: { access: number; rounds: number };
  readonly plusOneDouble: Counted;
  readonly firstLeft: number;
}

let originMemo: OriginCounts | undefined;
export function originCounts(): OriginCounts {
  if (originMemo !== undefined) return originMemo;
  const sliceChars = (LIMIT * (LIMIT + 1)) / 2;
  const codes = [...WALK].map((c) => c.charCodeAt(0));
  const firstLeft = codes.filter(
    (c) => codes.filter((d) => d === c).length > 1,
  ).length;
  originMemo = {
    sliceChars,
    sliceMb: Math.round(sliceChars / 1024 / 1024),
    naiveAllSame: naiveCostAllSame(LIMIT),
    doubleAllSame: countedDoubling("a".repeat(LIMIT)),
    doubleRandom: countedDoubling(makeText(LIMIT, 26)),
    plusOne: countedPlusOne("a".repeat(PLUS_ONE_N)),
    plusOneDouble: countedDoubling("a".repeat(PLUS_ONE_N)),
    firstLeft,
  };
  return originMemo;
}

function approaches(): Approach[] {
  const c = originCounts();
  return [
    {
      name: "접미사를 잘라 문자열로 정렬하기",
      idea: "접미사 n 개를 실제 문자열로 잘라 내어 문자열 정렬에 넣는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "메모리",
          value: `잘라 낸 글자만 ${num(c.sliceMb)} MB`,
          ok: false,
        },
      ],
      lesson: "자르지 않고 시작 자리만 들고 비교하면 어떨까",
    },
    {
      name: "시작 자리끼리 글자로 비교하기",
      idea: "자리 번호를 정렬하되, 두 자리를 비교할 때마다 글자를 앞에서부터 읽는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `전부 같은 글자에서 자료 접근 ${num(c.naiveAllSame)} 번 · ${num(Math.round(c.naiveAllSame / OPS_PER_SEC))} 초`,
          ok: false,
        },
      ],
      lesson:
        "공통 앞부분을 비교할 때마다 다시 읽는다 — 읽은 결과를 순위로 적어 두면 어떨까",
    },
    {
      name: "첫 글자의 순위로 한 번 가르기",
      idea: "첫 글자를 순위로 적고, 그 순위로 자리를 늘어놓는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `"${WALK}" 의 ${WALK.length} 자리 중 ${c.firstLeft} 자리가 같은 순위로 남는다`,
          ok: false,
        },
      ],
      lesson:
        "둘째 글자부터는 자리 i+1 의 순서다 — 그 순위를 뒤에 이어 붙이면 된다",
    },
    {
      name: "한 바퀴에 한 글자씩 늘리기",
      idea: "쌍 (길이 L 조각의 순위, 자리 i+L 의 글자) 로 길이 L+1 조각의 순위를 만든다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `전부 같은 글자 ${num(PLUS_ONE_N)} 개에서 바퀴 ${num(c.plusOne.rounds)} 번 · 자료 접근 ${num(c.plusOne.access)} 번`,
          ok: false,
        },
      ],
      lesson:
        "뒤 조각도 이미 순위를 아는 길이 L 조각이다 — 두 순위를 이으면 L 이 두 배가 된다",
    },
    {
      name: "한 바퀴에 조각 길이를 두 배로 늘리기",
      idea: "쌍 (rank[i], rank[i+L]) 을 계수 정렬 두 번으로 늘어놓아 길이 2L 조각의 순위를 만든다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `전부 같은 글자에서 바퀴 ${c.doubleAllSame.rounds} 번 · 자료 접근 ${num(c.doubleAllSame.access)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

type Kind = "init" | "pair" | "back" | "front" | "rerank";

export interface Step {
  readonly id: string;
  readonly kind: Kind;
  /** 바퀴 번호(첫 순위 걸음은 0). */
  readonly round: number;
  readonly gap: number;
  readonly title: string;
  readonly detail: string;
  /** 이 걸음이 끝난 뒤의 접미사 배열. */
  readonly sa: readonly number[];
  /** 이 걸음이 끝난 뒤의 `span`. */
  readonly span: number;
}

const 으로n = (x: number): string => 으로(String(x));

/** 전개 입력의 걸음 — T1 첫 순위, 바퀴마다 쌍 · 뒤 정렬 · 앞 정렬 · 다시 매기기. */
export function walkSteps(): Step[] {
  const r = walkRun();
  const n = WALK.length;
  const steps: Step[] = [];
  let t = 1;
  const codes = [...new Set(WALK)]
    .sort()
    .map((c) => `${c} = ${c.charCodeAt(0)}`)
    .join(", ");
  steps.push({
    id: `T${t++}`,
    kind: "init",
    round: 0,
    gap: 0,
    title: "첫 순위를 글자 코드로",
    detail: `길이 1 조각의 순위를 글자 코드로 둡니다. ${codes}${josa(codes, "이라", "라")} 대소가 사전순과 같습니다. sa 는 자리 번호 그대로입니다.`,
    sa: Array.from({ length: n }, (_, i) => i),
    span: 128,
  });
  for (const round of r.rounds) {
    const g = round.gap;
    const out = round.backs
      .map((_, i) => (i + g >= n ? i : -1))
      .filter((i) => i >= 0);
    steps.push({
      id: `T${t++}`,
      kind: "pair",
      round: round.n,
      gap: g,
      title: `gap = ${g} · 쌍 만들기`,
      detail: `자리마다 앞 성분 rank[i] 와 뒤 성분 rank[i+${g}] + 1 을 잇습니다. 자리 ${out.join(" · ")}${은는(out.join(" · "))} i+${g}${이가(g)} 문자열 끝을 넘어 뒤 성분이 0 입니다.`,
      sa: [...round.saIn],
      span: round.span,
    });
    steps.push({
      id: `T${t++}`,
      kind: "back",
      round: round.n,
      gap: g,
      title: `gap = ${g} · 뒤 성분으로 정렬`,
      detail: `뒤 성분으로 안정 정렬합니다. sa 가 ${show(round.saBack)}${이가(show(round.saBack))} 됩니다.`,
      sa: [...round.saBack],
      span: round.span,
    });
    steps.push({
      id: `T${t++}`,
      kind: "front",
      round: round.n,
      gap: g,
      title: `gap = ${g} · 앞 성분으로 정렬`,
      detail: `그 줄을 앞 성분으로 다시 안정 정렬합니다. sa 가 ${show(round.saFront)}${이가(show(round.saFront))} 됩니다.`,
      sa: [...round.saFront],
      span: round.span,
    });
    const kept = round.judges.filter((j) => !j.up).length;
    const stop = round.spanOut === n;
    steps.push({
      id: `T${t++}`,
      kind: "rerank",
      round: round.n,
      gap: g,
      title: `gap = ${g} · 순위 다시 매기기`,
      detail: `이웃한 두 자리의 쌍이 다를 때만 순위를 올립니다. 같은 쌍이 ${kept} 곳이라 span = ${round.spanOut}${josa(round.spanOut, "이고", "고")}, ${
        stop
          ? `n = ${n}${과와(n)} 같아 멈춥니다.`
          : `n = ${n} 보다 작아 gap 을 ${2 * g}${으로n(2 * g)} 올립니다.`
      }`,
      sa: [...round.saFront],
      span: round.spanOut,
    });
  }
  return steps;
}

/** 층 이름 — `길이 2 순위`. */
export const levelName = (k: number): string => `길이 ${2 ** k} 순위`;

/** 걸음 재생 패널과 필름이 뒤 성분의 예로 짚는 자리. */
const EXAMPLE = 1;

/**
 * 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로. 값 줄은 문자열 `s` 의 글자이고, 그 아래에 길이마다
 * 순위 배열 한 층과 이번 바퀴의 뒤 성분 줄을 쌓는다. 접미사 배열 `sa` 는 칸 번호가 사전순 자리 `k` 라
 * 문자열 자리와 같은 눈금에 두지 않고, 키 줄 `k` · 값 줄 `sa[k]` 로 맨 아래에 둔다.
 */
function arrayStep(steps: readonly Step[], at: number): ArrayStep {
  const s = steps[at] as Step;
  const prev = at > 0 ? (steps[at - 1] as Step) : null;
  const n = WALK.length;
  const r = walkRun();
  const all = Array.from({ length: n }, (_, i) => i);
  const round = s.round > 0 ? (r.rounds[s.round - 1] as Round) : null;
  const layers = Array.from({ length: r.rounds.length + 1 }, (_, k) => {
    // 층 k 는 k 번째 바퀴의 다시 매기기 걸음부터 채워져 있다.
    const filled =
      k === 0 || s.round > k || (s.round === k && s.kind === "rerank");
    const values =
      k === 0 ? r.rank0 : filled ? (r.rounds[k - 1] as Round).next : null;
    const isFront = round !== null && k === s.round - 1;
    const read =
      isFront &&
      (s.kind === "pair" || s.kind === "front" || s.kind === "rerank")
        ? all
        : [];
    const write =
      (s.kind === "init" && k === 0) || (s.kind === "rerank" && k === s.round)
        ? all
        : [];
    return {
      name: levelName(k),
      values: values === null ? all.map(() => null) : [...values],
      read,
      write,
    };
  });
  const backRow = {
    name: "뒤 성분",
    values: round === null ? all.map(() => null) : [...round.backs],
    read: s.kind === "back" || s.kind === "rerank" ? all : [],
    write: s.kind === "pair" ? all : [],
    side: round === null ? "아직 없음" : `gap = ${round.gap}`,
  };
  const changed =
    prev === null ? all : all.filter((k) => s.sa[k] !== prev.sa[k]);
  const saWrite =
    s.kind === "init" || s.kind === "back" || s.kind === "front" ? changed : [];
  const pieces =
    s.kind === "pair" && round !== null
      ? [
          {
            label: "앞 조각",
            from: EXAMPLE,
            to: Math.min(EXAMPLE + round.gap - 1, n - 1),
            tone: "left" as const,
            text: `자리 ${EXAMPLE} 의 앞 성분 ${round.rank[EXAMPLE]}`,
          },
          ...(EXAMPLE + round.gap < n
            ? [
                {
                  label: "뒤 조각",
                  from: EXAMPLE + round.gap,
                  to: Math.min(EXAMPLE + 2 * round.gap - 1, n - 1),
                  tone: "right" as const,
                  text: `뒤 성분 ${round.rank[EXAMPLE + round.gap]} + 1`,
                },
              ]
            : []),
        ]
      : [];
  const calc =
    s.kind === "rerank"
      ? { expr: "span = top + 1", result: String(s.span) }
      : s.kind === "pair" && round !== null
        ? {
            expr: `자리 ${EXAMPLE} 의 쌍`,
            result: `(${round.rank[EXAMPLE]}, ${round.backs[EXAMPLE]})`,
          }
        : null;
  const note =
    s.kind === "rerank"
      ? "이웃한 두 칸의 쌍을 비교한다"
      : s.kind === "init"
        ? "자리 번호 그대로"
        : undefined;
  return {
    array: [...WALK],
    range: [0, n - 1],
    rangeSide:
      s.kind === "init" ? "글자를 읽는다" : `gap = ${s.gap} · span = ${s.span}`,
    read: s.kind === "init" ? all : [],
    write: [],
    layers: [...layers, backRow],
    ...(pieces.length > 0 ? { pieces } : {}),
    map: {
      keyLabel: "k",
      valueLabel: "sa[k]",
      entries: s.sa.map((v, k) => [k, v] as const),
      slots: n,
      read: s.kind === "rerank" ? all : [],
      write: saWrite,
      ...(note === undefined ? {} : { note }),
    },
    calc,
    vars: null,
  };
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "s",
  rangeLabel: "문자열",
};

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `suffixArray-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const steps = walkSteps();
  return steps.map((s, at) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...arrayStep(steps, at),
  }));
}

function film(): StageFrame[] {
  const steps = walkSteps();
  return steps.map((s, at) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(arrayStep(steps, at), ARRAY_OPTIONS),
  }));
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 순위 배열 한 층을 조각 막대로 — 자리마다 그 자리의 길이 `len` 조각이 덮는 칸과 순위. */
function rankBars(len: number, rank: readonly number[]) {
  return [...WALK].map((_, i) => {
    const p = piece(WALK, i, len);
    return {
      label: `자리 ${i}`,
      from: i,
      to: i + p.length - 1,
      note: `${p} · 순위 ${rank[i]}`,
    };
  });
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-suffixes": () => {
    const sa = suffixArray(WALK);
    const n = WALK.length;
    return (
      <LayerBars
        title={`"${WALK}" 의 접미사 배열 — 사전순 k 번째 접미사가 문자열의 어느 자리를 덮는가`}
        values={[...WALK]}
        valuesLabel="s"
        indexLabel="자리"
        groups={[
          sa.map((i, k) => ({
            label: `sa[${k}] = ${i}`,
            from: i,
            to: n - 1,
            note: WALK.slice(i),
          })),
        ]}
      />
    );
  },
  "concept-rank2": () => {
    const next = (walkRun().rounds[0] as Round).next;
    return (
      <LayerBars
        title="길이 2 조각의 순위 배열 — 자리마다 두 글자를 잘라 사전순 종류 번호를 적는다"
        values={[...WALK]}
        valuesLabel="s"
        indexLabel="자리"
        groups={[rankBars(2, next)]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 다섯 — 넷은 버렸고 하나가 남았다"
        constraint={`문자열 길이 ${num(LIMIT)} 이하 · 소문자 · 1 초 · 256 MB(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-levels": () => {
    const r = walkRun();
    const lv: (readonly number[])[] = [r.rank0, ...r.rounds.map((x) => x.next)];
    const rows: StageRow[] = [
      { kind: "index", label: "자리" },
      { kind: "cells", label: "s", values: [...WALK] },
      ...lv.map(
        (values, k): StageRow => ({
          kind: "cells",
          label: levelName(k),
          values: [...values],
          side: `조각 ${new Set(values).size} 종류`,
        }),
      ),
    ];
    return (
      <CellStage
        title={`"${WALK}" 의 순위 배열 ${lv.length} 층 — 층이 오를수록 조각 길이가 두 배가 된다`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "build-pair": () => {
    const round = walkRun().rounds[1] as Round;
    const i = EXAMPLE;
    const g = round.gap;
    const read: Partial<Record<number, CellState>> = {
      [i]: "read",
      [i + g]: "read",
    };
    const made: Partial<Record<number, CellState>> = { [i]: "focus" };
    const rows: StageRow[] = [
      { kind: "index", label: "자리", focus: [i] },
      { kind: "cells", label: "s", values: [...WALK] },
      {
        kind: "bracket",
        label: "앞 조각",
        from: i,
        to: i + g - 1,
        tone: "left",
        text: piece(WALK, i, g),
      },
      {
        kind: "bracket",
        label: "뒤 조각",
        from: i + g,
        to: i + 2 * g - 1,
        tone: "right",
        text: piece(WALK, i + g, g),
      },
      {
        kind: "cells",
        label: levelName(1),
        values: [...round.rank],
        states: read,
        side: `rank[${i}] = ${round.rank[i]} · rank[${i + g}] = ${round.rank[i + g]}`,
      },
      { kind: "caret", cells: [i, i + g] },
      {
        kind: "cells",
        label: levelName(2),
        values: [...round.next],
        states: made,
        side: `쌍 (${round.rank[i]}, ${round.backs[i]}) → 순위 ${round.next[i]}`,
      },
    ];
    return (
      <CellStage
        title={`길이 ${2 * g} 조각 ${piece(WALK, i, 2 * g)} 의 순위는 길이 ${g} 층의 두 칸이 정한다`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "walk-doubling": () => {
    const frames = film();
    return (
      <CellStageFilm
        title={`suffixArray("${WALK}") — ${frames[0]?.id}~${frames.at(-1)?.id}`}
        columns={WALK.length}
        frames={frames}
      />
    );
  },
};
