/**
 * `kthSmallest-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 한 바퀴 안의 상태는 정본 소스에서
 * 기계로 만든 계측 사본 셋이 기록한다 — 기준값을 끝으로 옮긴 직후(`pivots`) · 비교 하나 직전(`cmps`) ·
 * 기준값을 제자리에 놓기 전후(`places`). 셋은 같은 입력에 따로 돌리고, 바퀴마다 구간이 서로 맞는지
 * 대조해 한 바퀴로 묶는다. 답은 정본이 낸다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서
 * 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는 `kthSmallest-guide.test.ts` 가 잰다.
 *
 * 큰 입력(칸 10 만 개)에서는 배열을 베끼는 기록 사본을 쓰지 않는다. 바퀴마다 구간의 칸 수만 적는
 * 가벼운 사본(`cost`)을 쓰고, 그 사본이 센 비교 횟수가 비교 줄에서 직접 센 수와 같은지는 작은
 * 입력에서 대조한다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
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
import { worstInput } from "./kthSmallest-guide.alt.ts";
import { kthSmallest } from "./kthSmallest-guide.ref.ts";

const REF = new URL("./kthSmallest-guide.ref.ts", import.meta.url).pathname;

type Selector = { kthSmallest(A: number[], k: number): number };

/* ───────────────────────── 정본 계측 ───────────────────────── */

interface PivotRec {
  readonly lo: number;
  readonly hi: number;
  readonly m: number;
  readonly A: number[];
}
interface CmpRec {
  readonly lo: number;
  readonly hi: number;
  readonly i: number;
  readonly j: number;
  readonly pivot: number;
  readonly A: number[];
}
interface PlaceRec {
  readonly lo: number;
  readonly hi: number;
  readonly i: number;
  readonly before: number[];
  after?: number[];
}

interface Log {
  pivots: PivotRec[];
  cmps: CmpRec[];
  places: PlaceRec[];
  cmpCount: number;
  sizes: number[];
}

const LOG = (): Log => (globalThis as unknown as { __kth: Log }).__kth;
const resetLog = (): void => {
  (globalThis as unknown as { __kth: Log }).__kth = {
    pivots: [],
    cmps: [],
    places: [],
    cmpCount: 0,
    sizes: [],
  };
};

const HOOK = "(globalThis as any).__kth";

/** 기준값을 끝으로 옮긴 직후 — 그 줄 바로 뒤에 구간 · 중앙 자리 · 배열을 적는다. */
const pivotProbe = await loadMutant<Selector>(REF, {
  swap: [
    /^(\s*)const pivot = A\[hi\] as number;$/,
    `$1const pivot = A[hi] as number;\n$1${HOOK}.pivots.push({ lo, hi, m, A: [...A] });`,
  ],
});

/** 비교 하나 직전 — 그 순간의 `i` · `j` · 배열을 적는다. */
const cmpProbe = await loadMutant<Selector>(REF, {
  swap: [
    /^(\s*)if \(\(A\[j\] as number\) < pivot\) \{$/,
    `$1${HOOK}.cmps.push({ lo, hi, i, j, pivot, A: [...A] });\n$1if ((A[j] as number) < pivot) {`,
  ],
});

/** 비교 횟수만 세는 사본 — 비교 줄 바로 앞에서 센다. 배열을 베끼지 않는다. */
const cmpCounter = await loadMutant<Selector>(REF, {
  swap: [
    /^(\s*)if \(\(A\[j\] as number\) < pivot\) \{$/,
    `$1${HOOK}.cmpCount++;\n$1if ((A[j] as number) < pivot) {`,
  ],
});

/** 기준값을 두 구역 사이에 놓는 줄 — 그 줄의 앞뒤 배열을 적는다. */
const placeProbe = await loadMutant<Selector>(REF, {
  swap: [
    /^(\s*)\[A\[i\], A\[hi\]\] = \[A\[hi\] as number, A\[i\] as number\];$/,
    `$1${HOOK}.places.push({ lo, hi, i, before: [...A] });\n$1[A[i], A[hi]] = [A[hi] as number, A[i] as number];\n$1${HOOK}.places.at(-1).after = [...A];`,
  ],
});

/** 기준값의 자리를 고르는 줄. 가벼운 사본은 이 줄을 바꿔 바퀴마다 구간의 칸 수를 적는다. */
const PLACE_LINE = /^(\s*)const m = lo \+ Math\.floor\(\(hi - lo\) \/ 2\);$/;

/** 기준값을 고르는 자리 — 정본은 구간의 중앙이다. 나머지 둘은 「기준값을 고르는 까닭」이 쓴다. */
export type Place = "middle" | "first" | "last";
const PLACE_EXPR: Record<Place, string> = {
  middle: "lo + Math.floor((hi - lo) / 2)",
  first: "lo",
  last: "hi",
};

const costMutant = (place: Place) =>
  loadMutant<Selector>(REF, {
    swap: [
      PLACE_LINE,
      `$1${HOOK}.sizes.push(hi - lo + 1);\n$1const m = ${PLACE_EXPR[place]};`,
    ],
  });

const COST: Record<Place, Selector> = {
  middle: await costMutant("middle"),
  first: await costMutant("first"),
  last: await costMutant("last"),
};

/** 한 번 부른 결과 — 답 · 바퀴마다 구간의 칸 수 · 비교 횟수. */
export interface Cost {
  readonly out: number;
  readonly sizes: readonly number[];
  readonly comparisons: number;
}

/**
 * 가벼운 사본으로 한 번 부른다. 비교 횟수는 바퀴마다 `칸 수 − 1` 의 합이다 — 분할 루프가 `j` 를 `lo` 부터
 * `hi − 1` 까지 한 칸씩 옮기므로. 그 셈이 비교 줄에서 직접 센 수와 같은지는 `trace` 가 작은 입력마다
 * 대조한다. 답은 기준값 자리가 중앙이면 정본과, 다른 자리면 정렬한 줄과 대조한다.
 */
export function cost(
  A: readonly number[],
  k: number,
  place: Place = "middle",
): Cost {
  resetLog();
  const out = COST[place].kthSmallest([...A], k);
  const sizes = [...LOG().sizes];
  const want =
    place === "middle"
      ? kthSmallest([...A], k)
      : ([...A].sort((x, y) => x - y)[k - 1] as number);
  if (out !== want) {
    throw new Error(`가벼운 사본이 답 ${want} 대신 ${out} 을 냈다`);
  }
  const comparisons = sizes.reduce((s, n) => s + n - 1, 0);
  return { out, sizes, comparisons };
}

/** 비교 줄에서 직접 센 비교 횟수. 배열을 베끼지 않으므로 큰 입력에도 쓴다. */
export function countedComparisons(A: readonly number[], k: number): number {
  resetLog();
  const out = cmpCounter.kthSmallest([...A], k);
  if (out !== kthSmallest([...A], k)) {
    throw new Error("비교를 세는 사본이 정본과 다른 답을 냈다");
  }
  return LOG().cmpCount;
}

/** 비교 하나 — 그 순간의 두 구역 경계 `i` 와 읽은 자리 `j`. */
export interface Cmp {
  readonly j: number;
  readonly a: number;
  /** `A[j] < pivot` 이 참이라 ① 로 갔는가. */
  readonly less: boolean;
  readonly iBefore: number;
  readonly iAfter: number;
  /** 비교를 마친 뒤의 배열. */
  readonly after: readonly number[];
}

/** 바퀴 하나. */
export interface Round {
  readonly lo: number;
  readonly hi: number;
  readonly m: number;
  readonly pivot: number;
  /** 바퀴가 시작할 때의 배열. */
  readonly start: readonly number[];
  /** 기준값을 끝으로 옮긴 뒤의 배열. */
  readonly moved: readonly number[];
  readonly cmps: readonly Cmp[];
  /** 기준값이 자리 잡은 인덱스. */
  readonly p: number;
  /** 기준값을 제자리에 놓은 뒤의 배열. */
  readonly placed: readonly number[];
  /** ③ 자리가 같다 · ④ 목표가 앞 · ⑤ 목표가 뒤. */
  readonly branch: "found" | "left" | "right";
  /** 다음 바퀴가 받는 구간. 답을 찾았으면 없다. */
  readonly next: readonly [number, number] | null;
}

export interface Trace {
  readonly input: readonly number[];
  readonly k: number;
  readonly target: number;
  readonly rounds: readonly Round[];
  readonly result: number;
  /** 반복을 칸 하나 남은 구간으로 나왔으면 그 자리. 바퀴 안에서 답을 찾았으면 `null`. */
  readonly leftover: number | null;
}

/**
 * 정본 한 번 호출의 기록 — 사본 셋을 같은 입력에 돌려 바퀴마다 묶는다. 묶은 기록이 서로 맞는지
 * (구간 · 배열 · 갈래) 대조하고, 답은 정본과 대조한다. 배열을 베끼므로 작은 입력에만 쓴다.
 */
export function trace(A: readonly number[], k: number): Trace {
  resetLog();
  pivotProbe.kthSmallest([...A], k);
  const pivots = LOG().pivots;
  resetLog();
  cmpProbe.kthSmallest([...A], k);
  const cmps = LOG().cmps;
  resetLog();
  placeProbe.kthSmallest([...A], k);
  const places = LOG().places;
  const result = kthSmallest([...A], k);
  const target = k - 1;

  if (pivots.length !== places.length) {
    throw new Error("기준값 기록과 제자리 기록의 바퀴 수가 다르다");
  }
  const rounds: Round[] = [];
  let at = 0;
  let current = [...A];
  for (const [r, pv] of pivots.entries()) {
    const pl = places[r] as PlaceRec;
    if (pl.lo !== pv.lo || pl.hi !== pv.hi) {
      throw new Error(`바퀴 ${r + 1} 의 구간이 기록마다 다르다`);
    }
    const mine = cmps.slice(at, at + (pv.hi - pv.lo));
    at += pv.hi - pv.lo;
    if (mine.some((c) => c.lo !== pv.lo || c.hi !== pv.hi)) {
      throw new Error(`바퀴 ${r + 1} 의 비교 기록이 다른 구간에 속한다`);
    }
    const pivot = pv.A[pv.hi] as number;
    const list: Cmp[] = mine.map((c, t) => {
      const nextA = t + 1 < mine.length ? (mine[t + 1] as CmpRec).A : pl.before;
      const nextI = t + 1 < mine.length ? (mine[t + 1] as CmpRec).i : pl.i;
      const a = c.A[c.j] as number;
      const less = a < pivot;
      if (nextI !== c.i + (less ? 1 : 0)) {
        throw new Error(
          `바퀴 ${r + 1} 의 j = ${c.j} 에서 i 가 갈래와 다르게 움직였다`,
        );
      }
      return { j: c.j, a, less, iBefore: c.i, iAfter: nextI, after: nextA };
    });
    const p = pl.i;
    const placed = pl.after ?? [];
    const branch = p === target ? "found" : p > target ? "left" : "right";
    const nextPivot = pivots[r + 1];
    const next: [number, number] | null =
      branch === "found"
        ? null
        : branch === "left"
          ? [pv.lo, p - 1]
          : [p + 1, pv.hi];
    if (nextPivot !== undefined) {
      if (
        next === null ||
        nextPivot.lo !== next[0] ||
        nextPivot.hi !== next[1]
      ) {
        throw new Error(`바퀴 ${r + 2} 의 구간이 갈래 규칙과 다르다`);
      }
    }
    rounds.push({
      lo: pv.lo,
      hi: pv.hi,
      m: pv.m,
      pivot,
      start: current,
      moved: pv.A,
      cmps: list,
      p,
      placed,
      branch,
      next,
    });
    current = [...placed];
  }
  if (at !== cmps.length)
    throw new Error("바퀴에 묶이지 않은 비교 기록이 있다");
  const last = rounds.at(-1);
  const leftover =
    last === undefined
      ? 0
      : last.branch === "found"
        ? null
        : (last.next as [number, number])[0];
  if (last !== undefined && last.branch !== "found") {
    const nx = last.next as [number, number];
    if (nx[0] !== nx[1])
      throw new Error("반복이 칸 하나 남은 구간이 아닌 채로 끝났다");
  }
  const got =
    leftover === null
      ? (last as Round).placed[(last as Round).p]
      : current[leftover];
  if (got !== result) {
    throw new Error(
      `기록으로 되짚은 답 ${got} 이 정본의 답 ${result} 과 다르다`,
    );
  }
  // 가벼운 사본의 비교 셈이 비교 줄에서 센 수와 같은가 — 큰 입력에서 가벼운 사본을 믿는 근거다.
  if (cost(A, k).comparisons !== cmps.length) {
    throw new Error("가벼운 사본의 비교 셈이 비교 줄에서 센 수와 다르다");
  }
  return { input: [...A], k, target, rounds, result, leftover };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const A6 = [7, 10, 4, 3, 20, 15];
export const K = 4;

export const num = (x: number): string => x.toLocaleString("en-US");
/** `[7 10 4 3 20 15]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
export const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;
export const sorted = (xs: readonly number[]): number[] =>
  [...xs].sort((x, y) => x - y);

export const BRANCH_MARK = { found: "③", left: "④", right: "⑤" } as const;

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly stage: ArrayStep;
}

/** 분할 중인 두 구역 — 작은 쪽 `[lo, i−1]` · 크거나 같은 쪽 `[i, upto]`. 빈 구역은 싣지 않는다. */
function zones(lo: number, i: number, upto: number): ArrayPiece[] {
  const out: ArrayPiece[] = [];
  if (i - 1 >= lo) {
    out.push({ label: "작음", from: lo, to: i - 1, tone: "left" });
  }
  if (upto >= i) {
    out.push({ label: "이상", from: i, to: upto, tone: "right" });
  }
  return out;
}

/** 전개 한 벌 — 바퀴마다 「기준값을 끝으로」 · 비교 하나씩 · 「기준값을 제자리에」 · 「갈래」. */
export function walkSteps(t: Trace = trace(A6, K), from = 1): Step[] {
  const steps: Step[] = [];
  let n = from;
  let total = 0;
  for (const r of t.rounds) {
    const size = r.hi - r.lo + 1;
    steps.push({
      id: `T${n++}`,
      title: `기준값 ${r.pivot}${을를(r.pivot)} 끝으로`,
      detail: `구간 [${r.lo},${r.hi}] ${size} 칸의 중앙은 m = ${r.lo} + ⌊${r.hi - r.lo}/2⌋ = ${r.m} 이고 값은 ${r.pivot} 입니다. ${r.m === r.hi ? "중앙이 이미 끝 칸이라 자리가 그대로입니다." : `인덱스 ${r.m}${과와(r.m)} ${r.hi}${을를(r.hi)} 맞바꿔 기준값을 끝에 둡니다.`}`,
      stage: {
        array: [...r.moved],
        range: [r.lo, r.hi],
        read: [],
        write: r.m === r.hi ? [r.hi] : [r.m, r.hi],
        pointers: { m: r.m, hi: r.hi, target: t.target },
        calc: {
          expr: `${r.lo} + ⌊(${r.hi} − ${r.lo}) / 2⌋`,
          result: String(r.m),
        },
        vars: `비교 ${total} 번`,
      },
    });
    for (const c of r.cmps) {
      total++;
      const wrote = c.less ? [...new Set([c.iBefore, c.j])] : [];
      steps.push({
        id: `T${n++}`,
        title: `${c.a} < ${r.pivot} ${c.less ? "①" : "②"}`,
        detail: c.less
          ? `j = ${c.j} 의 ${c.a}${이가(c.a)} 기준값 ${r.pivot} 보다 작아 ① 입니다. ${c.iBefore === c.j ? `i = j = ${c.j}${josa(c.j, "이라", "라")} 자리는 그대로이고` : `인덱스 ${c.iBefore}${과와(c.iBefore)} ${c.j}${을를(c.j)} 맞바꾸고`} i 가 ${c.iBefore} 에서 ${c.iAfter}${으로(c.iAfter)} 늘어납니다.`
          : `j = ${c.j} 의 ${c.a}${은는(c.a)} 기준값 ${r.pivot} 보다 작지 않아 ② 입니다. 그대로 두고 j 만 나아갑니다.`,
        stage: {
          array: [...c.after],
          range: [r.lo, r.hi],
          read: c.less ? [] : [c.j],
          write: wrote,
          pointers: { i: c.iAfter, j: c.j, target: t.target },
          pieces: zones(r.lo, c.iAfter, c.j),
          calc: { expr: `${c.a} < ${r.pivot}`, result: c.less ? "참" : "거짓" },
          vars: `비교 ${total} 번`,
        },
      });
    }
    steps.push({
      id: `T${n++}`,
      title: `기준값 ${r.pivot} 의 자리 p = ${r.p}`,
      detail: `기준값보다 작은 값이 ${r.p - r.lo} 개라 i = ${r.p} 에서 루프가 끝났습니다. ${r.p === r.hi ? "i 가 이미 끝 칸이라 자리가 그대로이고" : `인덱스 ${r.p}${과와(r.p)} ${r.hi}${을를(r.hi)} 맞바꾸면`} 기준값 ${r.pivot}${이가(r.pivot)} 인덱스 ${r.p} 에 자리 잡습니다.`,
      stage: {
        array: [...r.placed],
        range: [r.lo, r.hi],
        read: [],
        write: r.p === r.hi ? [r.p] : [r.p, r.hi],
        pointers: { p: r.p, target: t.target },
        pieces: [
          ...zones(r.lo, r.p, r.p - 1),
          ...(r.p + 1 <= r.hi
            ? [
                {
                  label: "이상",
                  from: r.p + 1,
                  to: r.hi,
                  tone: "right" as const,
                },
              ]
            : []),
        ],
        calc: null,
        vars: `비교 ${total} 번`,
      },
    });
    const rel = r.branch === "found" ? "=" : r.branch === "left" ? ">" : "<";
    const nx = r.next;
    steps.push({
      id: `T${n++}`,
      title:
        nx === null
          ? `${r.p} = ${t.target} ③ 반환 ${r.placed[r.p]}`
          : `${r.p} ${rel} ${t.target} ${BRANCH_MARK[r.branch]} 다음 구간 [${nx[0]},${nx[1]}]`,
      detail:
        nx === null
          ? `p = ${r.p}${이가(r.p)} target = ${t.target}${과와(t.target)} 같아 ③ 입니다. A[${r.p}] = ${r.placed[r.p]}${을를(r.placed[r.p] as number)} 돌려줍니다.`
          : `p = ${r.p}${이가(r.p)} target = ${t.target} 보다 ${r.branch === "left" ? "커서 ④ 로 왼쪽" : "작아서 ⑤ 로 오른쪽"} [${nx[0]},${nx[1]}] ${nx[1] - nx[0] + 1} 칸만 남깁니다.`,
      stage: {
        array: [...r.placed],
        range: nx === null ? [r.lo, r.hi] : [nx[0], nx[1]],
        read: [],
        write: nx === null ? [r.p] : [],
        pointers: { p: r.p, target: t.target },
        calc: {
          expr: `${r.p} ${rel} ${t.target}`,
          result: BRANCH_MARK[r.branch],
        },
        vars: `비교 ${total} 번`,
      },
    });
  }
  return steps;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "구간",
};

const film = (steps: Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(s.stage, ARRAY_OPTIONS),
  }));

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `kthSmallest-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    select: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

/* ───────────────── 바퀴 한 장씩 — 구간이 줄어드는 모양 ───────────────── */

/** 바퀴마다 한 장 — 기준값을 제자리에 놓은 배열 위에 쥔 구간 · 확정된 자리 · 남기는 쪽을 그린다. */
function roundFrames(t: Trace): StageFrame[] {
  return t.rounds.map((r, idx) => {
    const nx = r.next;
    const pieces: ArrayPiece[] =
      nx === null
        ? []
        : [
            {
              label: "남김",
              from: nx[0],
              to: nx[1],
              tone: "left",
              text: `[${nx[0]},${nx[1]}]`,
            },
          ];
    const verdict =
      nx === null
        ? `p = target 이라 A[${r.p}] = ${r.placed[r.p]}${을를(r.placed[r.p] as number)} 돌려준다`
        : `p ${r.branch === "left" ? ">" : "<"} target 이라 [${nx[0]},${nx[1]}] ${nx[1] - nx[0] + 1} 칸만 남긴다`;
    return {
      id: `${idx + 1} 바퀴`,
      text: `구간 [${r.lo},${r.hi}] · 기준값 ${r.pivot} · p = ${r.p} — ${verdict}`,
      rows: arrayStage(
        {
          array: [...r.placed],
          range: [r.lo, r.hi],
          write: [r.p],
          pointers: { p: r.p, target: t.target },
          pieces,
        },
        ARRAY_OPTIONS,
      ),
    };
  });
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 ───────────────── */

/** 과제 규모 — 칸 `N` 개, 순번은 가운데. 단순 연산 1 초에 1 억 번 기준. */
export const N = 100_000;
export const MID_K = N / 2;
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toFixed(2)} 초`;

/**
 * 가장 단순한 방법 — 남은 값에서 가장 작은 것을 찾아 앞으로 빼내는 일을 `k` 번 되풀이한다. 비교 횟수를
 * 세고, 답은 정본과 대조한다.
 */
export function minRepeat(
  A: readonly number[],
  k: number,
): { out: number; comparisons: number } {
  const B = [...A];
  let comparisons = 0;
  for (let r = 0; r < k; r++) {
    let min = r;
    for (let t = r + 1; t < B.length; t++) {
      comparisons++;
      if ((B[t] as number) < (B[min] as number)) min = t;
    }
    [B[r], B[min]] = [B[min] as number, B[r] as number];
  }
  const out = B[k - 1] as number;
  if (out !== kthSmallest([...A], k))
    throw new Error("k 번 최솟값 찾기가 정본과 다른 답을 냈다");
  return { out, comparisons };
}

/** 칸 수 `n` 의 뒤섞인 입력 — 생성식 `A[i] = (i × 7919) mod 10,007`. 본문과 `.alt.ts` 가 같은 식을 쓴다. */
export const shuffled = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => (i * 7919) % 10_007);

/** 비교 정렬이 줄 전체의 순서를 알아내는 데 드는 비교의 하한 `⌈log₂(n!)⌉` 을 반올림한 값. */
export function sortLowerBound(n: number): number {
  let lg = 0;
  for (let i = 2; i <= n; i++) lg += Math.log2(i);
  return Math.round(lg);
}

let naiveMemo: { comparisons: number } | undefined;
/** 칸 `N` 개 · 순번 `N/2` 에서 k 번 최솟값 찾기의 비교 횟수. 뒤섞인 입력에 실제로 센다. */
export const naiveAtScale = (): { comparisons: number } => {
  naiveMemo ??= { comparisons: minRepeat(shuffledLarge(), MID_K).comparisons };
  return naiveMemo;
};

/** 칸 `N` 개짜리 입력. 생성식은 `shuffled` 와 같지만 값이 겹치지 않게 법을 칸 수보다 큰 소수로 둔다. */
export const shuffledLarge = (): number[] =>
  Array.from({ length: N }, (_, i) => (i * 7919) % 100_003);

/** 자리 번호로 반을 잘라 목표 자리가 든 쪽만 보는 시도 — 잘라 낸 쪽에 답이 있는지 본다. */
export function halfCut(A: readonly number[], k: number) {
  const target = k - 1;
  const mid = Math.floor((A.length - 1) / 2);
  const keep: [number, number] =
    target <= mid ? [0, mid] : [mid + 1, A.length - 1];
  const answer = kthSmallest([...A], k);
  const kept = A.slice(keep[0], keep[1] + 1);
  const at = A.indexOf(answer);
  return { target, mid, keep, kept, answer, at, lost: !kept.includes(answer) };
}

function approaches(): Approach[] {
  const naive = naiveAtScale().comparisons;
  const lower = sortLowerBound(N);
  const cut = halfCut(A6, K);
  const t = trace(A6, K);
  return [
    {
      name: "k 번 최솟값 찾기",
      idea: "남은 값에서 가장 작은 것을 찾아 빼내는 일을 k 번 되풀이한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `k = ${num(MID_K)} 에서 비교 ${num(naive)} 번 · ${secondsOf(naive)}`,
          ok: false,
        },
      ],
      lesson: "순서를 전부 알아내면 어떨까 — 정렬하고 k 번째를 읽는다",
    },
    {
      name: "정렬하고 k 번째 읽기",
      idea: "배열 전체를 정렬한 뒤 A[k − 1] 을 읽는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `비교 하한 ${num(lower)} 번 · 1 초 안`,
          ok: true,
        },
        {
          label: "낭비",
          value: `자리 하나에 필요한 ${num(N - 1)} 번의 ${(lower / (N - 1)).toFixed(1)} 배`,
          ok: false,
        },
      ],
      lesson:
        "자리 하나만 확정하는 순회가 있다 — 그 자리로 한쪽만 남길 수 있을까",
    },
    {
      name: "자리 번호로 반 자르기",
      idea: "구간을 칸 수로 반 잘라 목표 자리가 든 쪽만 본다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `${show(A6)} 에서 남긴 쪽 ${show(cut.kept)} 에 답 ${cut.answer}${이가(cut.answer)} 없다`,
          ok: false,
        },
      ],
      lesson:
        "배열이 정렬돼 있지 않으면 자리 번호가 값의 순위를 말하지 않는다 — 자르기 전에 자리 하나를 확정해야 한다",
    },
    {
      name: "기준값으로 가르고 한쪽만 남기기",
      idea: "기준값 하나의 자리를 확정하고, 목표 자리가 든 쪽만 이어서 가른다",
      verdict: "keep",
      checks: [
        { label: "답", value: `${show(A6)} 에서 ${t.result}`, ok: true },
        {
          label: "시간",
          value: `칸 ${num(N)} 개 뒤섞인 입력 · k = ${num(MID_K)} 에서 비교 ${num(cost(shuffledLarge(), MID_K).comparisons)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/** 가장 고른 갈림 — 목표가 든 쪽이 매번 `⌊n/2⌋` 칸이다. */
export const evenSplit = (n: number): number =>
  n <= 1 ? 0 : n - 1 + evenSplit(Math.floor(n / 2));

/* ───────────────────────── 최악 입력 ───────────────────────── */

export { worstInput };

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-rounds": () => {
    const t = trace(A6, K);
    return (
      <CellStageFilm
        title={`kthSmallest(${show(A6)}, ${K}) — 바퀴마다 자리 하나가 정해지고 목표가 든 쪽만 남는다`}
        columns={A6.length}
        frames={roundFrames(t)}
      />
    );
  },
  "origin-half-cut": () => {
    const c = halfCut(A6, K);
    const states: Partial<Record<number, CellState>> = {};
    for (let i = 0; i < A6.length; i++) {
      if (i < c.keep[0] || i > c.keep[1]) states[i] = "out";
    }
    return (
      <RangeCover
        title={`칸 수로 반 자르면 target = ${c.target} 이 든 쪽 [${c.keep[0]},${c.keep[1]}] 만 남는다`}
        row={{ label: "A 의 값", values: A6, states }}
        indexLabel="인덱스"
        ranges={[
          {
            from: c.keep[0],
            to: c.keep[1],
            tone: "query",
            note: `남긴 쪽 ${show(c.kept)}`,
          },
        ]}
        annotation={{
          cells: [c.at],
          text: `답 ${c.answer}${은는(c.answer)} 인덱스 ${c.at} 에 있어 버린 쪽에 들었다`,
        }}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`칸 ${num(N)} 개 · 순번은 가운데 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-partition": () => {
    const r = trace(A6, K).rounds[0] as Round;
    const states: Partial<Record<number, CellState>> = { [r.p]: "focus" };
    return (
      <RangeCover
        title={`기준값 ${r.pivot}${으로(r.pivot)} 한 번 가른 뒤 — 작은 쪽 · 기준값 · 크거나 같은 쪽`}
        row={{ label: "A 의 값", values: [...r.placed], states }}
        indexLabel="인덱스"
        ranges={[
          ...(r.p - 1 >= r.lo
            ? [
                {
                  from: r.lo,
                  to: r.p - 1,
                  tone: "left" as const,
                  note: `${r.pivot} 보다 작은 값 ${r.p - r.lo} 개`,
                },
              ]
            : []),
          ...(r.p + 1 <= r.hi
            ? [
                {
                  from: r.p + 1,
                  to: r.hi,
                  tone: "right" as const,
                  note: `${r.pivot} 이상인 값 ${r.hi - r.p} 개 · 순서는 정해지지 않았다`,
                },
              ]
            : []),
        ]}
        annotation={{
          cells: [r.p],
          text: `기준값 ${r.pivot}${은는(r.pivot)} 인덱스 ${r.p} — 정렬한 줄에서도 이 자리다`,
        }}
      />
    );
  },
  "build-discard": () => {
    const t = trace(A6, K);
    const r = t.rounds[0] as Round;
    const nx = r.next as [number, number];
    const states: Partial<Record<number, CellState>> = {};
    for (let i = 0; i < A6.length; i++) {
      if (i < nx[0] || i > nx[1]) states[i] = "out";
    }
    return (
      <RangeCover
        title={`왼쪽 [${r.lo},${r.p}] 를 버려도 target = ${t.target} 은 그대로 인덱스 ${t.target} 을 가리킨다`}
        row={{ label: "A 의 값", values: [...r.placed], states }}
        indexLabel="인덱스"
        ranges={[
          {
            from: nx[0],
            to: nx[1],
            tone: "query",
            note: `남긴 구간 [${nx[0]},${nx[1]}]`,
          },
        ]}
        annotation={{
          cells: [t.target],
          text: `target = ${t.target} — 번호는 배열 전체 기준이라 버린 칸 수만큼 당기지 않는다`,
        }}
      />
    );
  },
  "walk-select": () => (
    <CellStageFilm
      title={`kthSmallest(${show(A6)}, ${K}) — T1~T${walkSteps().length}`}
      columns={A6.length}
      frames={film(walkSteps())}
    />
  ),
  "invariant-range": () => {
    const t = trace(A6, K);
    const r = t.rounds[1] as Round;
    const states: Partial<Record<number, CellState>> = {};
    for (let i = 0; i < A6.length; i++) {
      if (i < r.lo || i > r.hi) states[i] = "out";
    }
    const s = sorted(A6);
    return (
      <RangeCover
        title="바퀴가 시작할 때 — 목표 자리는 남은 구간 안에 있고, 구간 밖의 칸은 답이 아니다"
        row={{ label: "A 의 값", values: [...r.start], states }}
        indexLabel="인덱스"
        ranges={[
          {
            from: r.lo,
            to: r.hi,
            tone: "query",
            note: `2 바퀴가 받은 구간 [${r.lo},${r.hi}]`,
          },
        ]}
        annotation={{
          cells: [t.target],
          text: `target = ${t.target} · 정렬한 줄의 이 자리 값 ${s[t.target]}${이가(s[t.target] as number)} 구간 안에 있다`,
        }}
      />
    );
  },
  "worst-rounds": () => {
    const n = 8;
    const A = worstInput(n);
    const t = trace(A, n);
    return (
      <CellStageFilm
        title={`worstInput(${n}) 에 k = ${n} — 기준값이 매번 구간의 최솟값이라 구간이 한 칸씩만 준다`}
        columns={n}
        frames={roundFrames(t)}
      />
    );
  },
};
