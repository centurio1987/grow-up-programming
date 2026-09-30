/**
 * `longestIncreasingSubsequence-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 정본 소스에서 기계로 만든 계측 사본
 * 둘이 기록을 남긴다 — `probeCopy` 는 이진 탐색이 `mid` 를 정할 때마다 그 자리와 값을, `stepCopy` 는
 * 원소 하나를 다 처리할 때마다 찾은 자리와 꼬리 배열을 적는다. 걸음 재생 패널의 걸음
 * (`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `longestIncreasingSubsequence-guide.test.ts` 가 잰다. 증명 사이드카(`.proof.ts`)도 같은 기록을 쓴다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 을를, 이가 } from "../../../../tools/josa.ts";
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
import { longestIncreasingSubsequence } from "./longestIncreasingSubsequence-guide.ref.ts";

const REF = new URL(
  "./longestIncreasingSubsequence-guide.ref.ts",
  import.meta.url,
).pathname;

interface Impl {
  longestIncreasingSubsequence(A: number[]): number;
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** `mid` 를 정하는 줄 뒤에 기록을 끼운 사본 — 탐색 한 바퀴의 구간 · 읽은 자리 · 그 값. */
const probeCopy = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)const mid = \(lo \+ hi\) >> 1;$/,
    "$1const mid = (lo + hi) >> 1;\n$1(globalThis as any).__lisProbe.push({ lo, hi, mid, v: tails[mid], len: tails.length });",
  ],
});

/** 자리를 갈아 끼우는 줄 뒤에 기록을 끼운 사본 — 원소 하나를 다 처리한 뒤의 자리와 꼬리 배열. */
const stepCopy = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)else tails\[lo\] = x;$/,
    "$1else tails[lo] = x;\n$1(globalThis as any).__lisStep.push({ x, lo, tails: [...tails] });",
  ],
});

interface RawProbe {
  lo: number;
  hi: number;
  mid: number;
  v: number;
  len: number;
}

interface RawStep {
  x: number;
  lo: number;
  tails: number[];
}

/** 이진 탐색 한 바퀴. */
export interface Probe {
  readonly lo: number;
  readonly hi: number;
  readonly mid: number;
  /** 읽은 값 `tails[mid]`. */
  readonly v: number;
  /** `tails[mid] < x` 가 참인가 — 참이면 `lo = mid + 1`, 거짓이면 `hi = mid`. */
  readonly less: boolean;
}

/** 원소 하나를 처리한 기록. */
export interface Step {
  /** 입력에서 몇 번째 원소인가. */
  readonly i: number;
  readonly x: number;
  /** 처리하기 전의 꼬리 배열. */
  readonly before: readonly number[];
  readonly probes: readonly Probe[];
  /** 이진 탐색이 찾은 자리 — `x` 이상인 첫 칸. */
  readonly lo: number;
  /** 끝에 붙였는가(② ) — 아니면 갈아 끼웠다(③ ). */
  readonly grew: boolean;
  /** 처리한 뒤의 꼬리 배열. */
  readonly after: readonly number[];
}

/**
 * 정본 한 번 호출의 기록. 두 계측 사본의 답을 정본과 대조하고, 원소마다 탐색 기록을 가른 뒤, 그
 * 기록이 끝낸 자리와 꼬리 배열이 정본 규칙(붙이거나 갈아 끼운다)과 맞는지 대조한다.
 *
 * 탐색 기록은 원소마다 첫 바퀴가 `lo = 0, hi = 길이` 로 시작하고, 한 원소 안에서는 구간이 바퀴마다
 * 줄어 그 모양이 다시 나오지 않는다 — 그것으로 원소의 경계를 가른다. 꼬리 배열이 빈 첫 원소만
 * 바퀴가 없다.
 */
export function trace(A: readonly number[]): Step[] {
  const g = globalThis as unknown as {
    __lisProbe: RawProbe[];
    __lisStep: RawStep[];
  };
  g.__lisProbe = [];
  g.__lisStep = [];
  const want = longestIncreasingSubsequence([...A]);
  const a1 = probeCopy.longestIncreasingSubsequence([...A]);
  const a2 = stepCopy.longestIncreasingSubsequence([...A]);
  if (a1 !== want || a2 !== want) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  const probes = [...g.__lisProbe];
  const raws = [...g.__lisStep];
  if (raws.length !== A.length) {
    throw new Error("원소 수와 처리 기록 수가 다르다");
  }
  const steps: Step[] = [];
  let p = 0;
  let before: number[] = [];
  for (const [i, raw] of raws.entries()) {
    const x = A[i] as number;
    if (raw.x !== x) throw new Error(`원소 ${i} 의 기록이 입력과 다르다`);
    const mine: Probe[] = [];
    while (before.length > 0 && p < probes.length) {
      const r = probes[p] as RawProbe;
      const starts = r.lo === 0 && r.hi === r.len;
      if (mine.length > 0 && starts) break;
      if (mine.length === 0 && !(starts && r.len === before.length)) {
        throw new Error(
          `원소 ${i} 의 첫 바퀴가 [0, ${before.length}) 이 아니다`,
        );
      }
      mine.push({ lo: r.lo, hi: r.hi, mid: r.mid, v: r.v, less: r.v < x });
      p++;
    }
    // 바퀴 기록으로 구간을 다시 좁혀 끝난 자리가 정본의 자리와 같은지 본다.
    let lo = 0;
    let hi = before.length;
    for (const pr of mine) {
      if (pr.lo !== lo || pr.hi !== hi) {
        throw new Error(`원소 ${i} 의 탐색 구간이 앞 바퀴의 갱신과 다르다`);
      }
      if (pr.less) lo = pr.mid + 1;
      else hi = pr.mid;
    }
    if (lo !== hi || lo !== raw.lo) {
      throw new Error(`원소 ${i} 의 자리가 탐색 기록과 다르다`);
    }
    const grew = raw.lo === before.length;
    const expected = [...before];
    expected[raw.lo] = x;
    if (JSON.stringify(expected) !== JSON.stringify(raw.tails)) {
      throw new Error(`원소 ${i} 뒤의 꼬리 배열이 규칙과 다르다`);
    }
    steps.push({
      i,
      x,
      before,
      probes: mine,
      lo: raw.lo,
      grew,
      after: [...raw.tails],
    });
    before = [...raw.tails];
  }
  if (p !== probes.length) throw new Error("가르지 못한 탐색 기록이 남았다");
  if (before.length !== want) throw new Error("꼬리 배열의 길이가 답과 다르다");
  return steps;
}

/**
 * 탐색 바퀴 수만 센다 — 원소가 많은 입력에서 꼬리 배열을 원소마다 복사하지 않으려고 따로 둔다.
 * 답은 정본과 대조한다.
 */
export function probeCount(A: readonly number[]): number {
  const g = globalThis as unknown as { __lisProbe: RawProbe[] };
  g.__lisProbe = [];
  const got = probeCopy.longestIncreasingSubsequence(A as number[]);
  if (got !== longestIncreasingSubsequence(A as number[])) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  const n = g.__lisProbe.length;
  g.__lisProbe = [];
  return n;
}

/** 꼬리 배열 `tails` 앞에 `x` 가 올 때의 탐색 — 증가하는 `tails` 를 그대로 넣으면 정본이 그 배열을 만든다. */
export function searchOn(tails: readonly number[], x: number): Step {
  const s = trace([...tails, x]);
  const last = s.at(-1) as Step;
  if (JSON.stringify(last.before) !== JSON.stringify(tails)) {
    throw new Error("증가하지 않는 배열을 넣었다");
  }
  return last;
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/**
 * 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). 끝에 붙이는 갈래와 갈아 끼우는 갈래가 각각
 * 네 번씩 실행되고, 마지막 원소 18 이 101 자리를 갈아 끼워 답을 안 바꾸는 갱신까지 나온다.
 */
export const WALK: readonly number[] = [10, 9, 2, 5, 3, 7, 101, 18];

/** 과제 규모 — 원소 수의 상한. */
export const N_MAX = 100_000;

/** 비교 비용을 대어 보는 규모 — 칸마다 앞을 전부 보는 방법을 실제로 끝까지 실행할 수 있는 크기. */
export const N_MID = 20_000;

export const num = (x: number): string => x.toLocaleString("en-US");

/** `[2 5 3]` 꼴 — 값의 나열이라 쉼표를 쓰지 않는다(인덱스 구간 `[a,b]` 와 가른다). */
export const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;

/** 초당 1 억 번 기준의 시간. */
export const secondsOf = (ops: number): string => {
  const s = ops / 1e8;
  return s >= 10 ? `${num(Math.round(s))} 초` : `${s.toFixed(2)} 초`;
};

/** 결정론적 입력 — 난수가 아니라 식이라 몇 번을 실행해도 같은 배열이 나온다. */
export type Shape = "무작위" | "증가" | "감소" | "같은 값";
export const SHAPES: readonly Shape[] = ["무작위", "증가", "감소", "같은 값"];

export function gen(n: number, mode: Shape): number[] {
  const out: number[] = [];
  let seed = 12_345;
  for (let i = 0; i < n; i++) {
    if (mode === "증가") out.push(i);
    else if (mode === "감소") out.push(n - i);
    else if (mode === "같은 값") out.push(7);
    else {
      seed = (seed * 1_103_515_245 + 12_345) & 0x7fff_ffff;
      out.push(seed % (2 * n));
    }
  }
  return out;
}

/* ───────────────── 다른 절차 — 답은 정본과 대조한다 ───────────────── */

/** 부분 수열을 전부 만들어 증가하는지 본다. `checked` 는 검사한 원소 수. */
export function bruteForce(A: readonly number[]): {
  best: number;
  tried: number;
  checked: number;
  increasing: number;
} {
  const n = A.length;
  let best = 0;
  let tried = 0;
  let checked = 0;
  let increasing = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    tried++;
    let last = Number.NEGATIVE_INFINITY;
    let len = 0;
    let ok = true;
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) === 0) continue;
      checked++;
      if ((A[i] as number) <= last) {
        ok = false;
        break;
      }
      last = A[i] as number;
      len++;
    }
    if (ok && len > 0) increasing++;
    if (ok && len > best) best = len;
  }
  if (best !== longestIncreasingSubsequence([...A])) {
    throw new Error("부분 수열을 다 만든 답이 정본과 다르다");
  }
  return { best, tried, checked, increasing };
}

/**
 * 칸마다 「그 칸에서 끝나는 가장 긴 증가 부분 수열의 길이」`dp[i]` 를 앞을 전부 보며 채운다.
 * `pairs` 는 `A[j] < A[i]` 를 비교한 횟수, `parent[i]` 는 `dp[i]` 를 만든 앞 칸(없으면 -1)이다.
 */
export function squareDp(A: readonly number[]): {
  dp: number[];
  parent: number[];
  pairs: number;
  best: number;
} {
  const n = A.length;
  const dp: number[] = new Array<number>(n).fill(1);
  const parent: number[] = new Array<number>(n).fill(-1);
  let pairs = 0;
  let best = n === 0 ? 0 : 1;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      pairs++;
      if (
        (A[j] as number) < (A[i] as number) &&
        (dp[j] as number) + 1 > (dp[i] as number)
      ) {
        dp[i] = (dp[j] as number) + 1;
        parent[i] = j;
      }
    }
    if ((dp[i] as number) > best) best = dp[i] as number;
  }
  if (best !== longestIncreasingSubsequence([...A])) {
    throw new Error("칸마다 앞을 본 답이 정본과 다르다");
  }
  return { dp, parent, pairs, best };
}

/** `dp` 가 `k` 인 칸에서 끝나는 증가 부분 수열 하나의 칸 번호 — `parent` 를 거슬러 모은다. */
export function chainTo(parent: readonly number[], end: number): number[] {
  const out: number[] = [];
  for (let at = end; at >= 0; at = parent[at] as number) out.unshift(at);
  return out;
}

/** 가장 단순한 후보 — 앞에서부터 읽으며 마지막으로 고른 값보다 크면 고른다. */
export function greedyChain(A: readonly number[]): number {
  let last = Number.NEGATIVE_INFINITY;
  let count = 0;
  for (const x of A) {
    if (x > last) {
      count++;
      last = x;
    }
  }
  return count;
}

/**
 * 길이마다 끝값 하나를 두되 **처음 만든 것을 그대로 둔다.** 길이는 끝값 목록을 차례로 읽어 찾는다 — `x` 보다
 * 작은 끝값을 가진 가장 긴 길이. 원소마다의 끝값 목록을 함께 돌려준다.
 */
export function firstEnds(A: readonly number[]): {
  best: number;
  states: number[][];
} {
  const ends: number[] = [];
  const states: number[][] = [];
  for (const x of A) {
    let len = 0;
    for (let k = ends.length; k >= 1; k--) {
      if ((ends[k - 1] as number) < x) {
        len = k;
        break;
      }
    }
    if (len === ends.length) ends.push(x);
    states.push([...ends]);
  }
  return { best: ends.length, states };
}

/**
 * 꼬리 배열에서 `x` 이상인 첫 칸을 **앞에서부터 차례로 읽어** 찾는 절차 — 이진 탐색 자리만 바꾼 것이다.
 * `cmps` 는 `tails[j] < x` 를 비교한 횟수.
 */
export function linearTails(A: readonly number[]): {
  best: number;
  cmps: number;
} {
  const tails: number[] = [];
  let cmps = 0;
  for (const x of A) {
    let j = 0;
    while (j < tails.length) {
      cmps++;
      if ((tails[j] as number) < x) j++;
      else break;
    }
    if (j === tails.length) tails.push(x);
    else tails[j] = x;
  }
  if (tails.length !== longestIncreasingSubsequence([...A])) {
    throw new Error("앞에서부터 차례로 읽은 답이 정본과 다르다");
  }
  return { best: tails.length, cmps };
}

/** 인내심 정렬의 더미 — 원소를 정본이 찾은 자리 번호의 더미에 쌓는다. */
export function piles(A: readonly number[]): number[][] {
  const out: number[][] = [];
  for (const s of trace(A)) {
    if (s.lo === out.length) out.push([]);
    (out[s.lo] as number[]).push(s.x);
  }
  return out;
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface WalkStep {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly step: Step;
  /** 이 걸음까지 누적한 탐색 비교 수. */
  readonly total: number;
}

/** 탐색 한 바퀴를 문장 한 조각으로 — `mid = 0 에서 10 < 9 가 거짓이라 hi = 0`. */
export function probeText(pr: Probe, x: number): string {
  return pr.less
    ? `mid = ${pr.mid} 에서 ${pr.v} < ${x}${이가(x)} 참이라 lo = ${pr.mid + 1}`
    : `mid = ${pr.mid} 에서 ${pr.v} < ${x}${이가(x)} 거짓이라 hi = ${pr.mid}`;
}

/** 걸음 하나의 갈래 문장. */
export function branchText(s: Step): string {
  const len = s.before.length;
  return s.grew
    ? `자리 ${s.lo}${이가(s.lo)} 끝(길이 ${len})이라 ② ${s.x}${을를(s.x)} 끝에 붙입니다. 길이가 ${len + 1}${이가(len + 1)} 됩니다.`
    : `자리 ${s.lo}${이가(s.lo)} 끝(길이 ${len})이 아니라 ③ tails[${s.lo}]${을를(s.lo)} ${s.before[s.lo]} 에서 ${s.x}${으로(s.x)} 바꿉니다. 길이는 ${len} 그대로입니다.`;
}

export function walkSteps(A: readonly number[] = WALK): WalkStep[] {
  const steps = trace(A);
  let total = 0;
  return steps.map((s, k) => {
    total += s.probes.length;
    const search =
      s.probes.length === 0
        ? `꼬리 배열이 비어 lo = hi = 0 이고, 반복 조건 0 < 0 이 거짓이라 탐색을 한 번도 안 합니다.`
        : `${s.probes.map((pr) => probeText(pr, s.x)).join(", ")} 입니다.`;
    const tail =
      k === steps.length - 1
        ? ` 원소를 다 읽었으니 ④ 꼬리 배열의 길이 ${s.after.length}${을를(s.after.length)} 돌려줍니다.`
        : "";
    return {
      id: `T${k + 1}`,
      title: `x = ${s.x} · ${s.grew ? "② 끝에 붙인다" : `③ 자리 ${s.lo}${을를(s.lo)} 갈아 끼운다`}`,
      detail: `${search} ${branchText(s)}${tail}`,
      step: s,
      total,
    };
  });
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "읽은 원소",
};

/** 꼬리 배열의 칸 수 — 첫 걸음부터 끝 모양을 두려고 끝난 뒤의 길이로 잡는다. */
const slotsOf = (A: readonly number[]): number =>
  longestIncreasingSubsequence([...A]);

/**
 * 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다.
 * 쥔 구간은 지금까지 읽은 원소 `[0, i]`, 조각 괄호는 이 원소가 들어갈 수 있는 꼬리 배열의 자리
 * `[0, 길이]`(끝 바로 뒤 칸까지)이고, 그 아래 줄이 꼬리 배열이다. 꼬리 배열 줄의 읽은 칸은 탐색이 읽은
 * `mid`, 새로 쓴 칸은 찾은 자리다.
 */
function arrayStep(w: WalkStep, A: readonly number[] = WALK): ArrayStep {
  const s = w.step;
  const slots = slotsOf(A);
  const values: (number | null)[] = Array.from(
    { length: slots },
    (_, k) => s.after[k] ?? null,
  );
  return {
    array: [...A],
    range: [0, s.i],
    read: [s.i],
    write: [],
    pointers: { i: s.i },
    pieces: [
      {
        label: "자리 후보",
        from: 0,
        to: s.before.length,
        tone: "left",
      },
    ],
    calc: {
      expr: `lowerBound(${show(s.before)}, ${s.x})`,
      result: String(s.lo),
    },
    vars: `비교 누적 ${w.total} 번`,
    layers: [
      {
        name: "꼬리 배열",
        values,
        read: s.probes.map((pr) => pr.mid).filter((m) => m !== s.lo),
        write: [s.lo],
      },
    ],
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `longestIncreasingSubsequence-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    lisWalk: walkSteps().map((w) => ({
      title: `${w.id} ${w.title}`,
      text: w.detail,
      ...arrayStep(w),
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 ───────────────── */

/** 두 번째 후보를 반박하는 입력 — 길이 2 의 끝값을 5 로 두느냐 3 으로 두느냐가 답을 가른다. */
export const FIRST_BREAK: readonly number[] = [2, 5, 3, 4];

/** 큰 수의 자릿수. */
export const digits = (v: bigint): number => v.toString().length;

/** 증가 수열 `N_MAX` 개의 탐색 비교 수 — 한 번만 센다. */
let worstMemo: number | undefined;
export const worstProbes = (): number => {
  worstMemo ??= probeCount(gen(N_MAX, "증가"));
  return worstMemo;
};

function approaches(): Approach[] {
  const brute = bruteForce(WALK);
  const pairsBig = (N_MAX * (N_MAX - 1)) / 2;
  const greedy = greedyChain(WALK);
  const right = longestIncreasingSubsequence([...WALK]);
  const first = firstEnds(FIRST_BREAK).best;
  const firstRight = longestIncreasingSubsequence([...FIRST_BREAK]);
  return [
    {
      name: "부분 수열 다 만들기",
      idea: "원소마다 고른다 · 안 고른다를 정한 부분 수열을 모두 만들고, 증가하는 것 가운데 가장 긴 것을 고른다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `맞다 · 여덟 원소에서 ${num(brute.tried)} 가지를 만든다`,
          ok: true,
        },
        {
          label: "시간",
          value: `N = ${num(N_MAX)} 이면 가짓수가 ${num(digits(2n ** BigInt(N_MAX)))} 자리 수`,
          ok: false,
        },
      ],
      lesson:
        "같은 원소에서 끝나는 부분 수열을 몇 번이고 다시 만든다 — 원소마다 그 원소에서 끝나는 답을 한 번씩만 적어 두면 어떨까",
    },
    {
      name: "칸마다 앞을 전부 보기",
      idea: "dp[i] 를 A[i] 보다 작은 앞 칸의 dp 가운데 가장 큰 것에 1 을 더해 정한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `N = ${num(N_MAX)} 이면 비교 ${num(pairsBig)} 번 · ${secondsOf(pairsBig)}`,
          ok: false,
        },
      ],
      lesson:
        "앞 칸을 전부 보지만 답을 정하는 것은 길이마다 가장 작은 끝값 하나다 — 길이마다 끝값 하나만 들고 가면 어떨까",
    },
    {
      name: "앞에서부터 붙이기",
      idea: "앞에서부터 읽으며 마지막으로 고른 값보다 크면 고른다",
      verdict: "drop",
      checks: [
        { label: "시간", value: "원소마다 비교 한 번", ok: true },
        {
          label: "답",
          value: `${show(WALK)} 에서 ${greedy} · 정답은 ${right}`,
          ok: false,
        },
      ],
      lesson:
        "먼저 고른 큰 값이 뒤의 작은 값을 막는다 — 길이마다 끝값을 따로 두면 어떨까",
    },
    {
      name: "길이마다 처음 만든 끝값",
      idea: "길이마다 끝값 하나를 두되, 한 번 정한 끝값은 바꾸지 않는다",
      verdict: "drop",
      checks: [
        { label: "시간", value: "끝값 목록을 훑는 만큼", ok: null },
        {
          label: "답",
          value: `${show(FIRST_BREAK)} 에서 ${first} · 정답은 ${firstRight}`,
          ok: false,
        },
      ],
      lesson:
        "같은 길이를 더 작은 값으로 끝낼 수 있는데도 큰 끝값을 들고 간다 — 가장 작은 끝값으로 바꾸면 어떨까",
    },
    {
      name: "길이마다 가장 작은 끝값",
      idea: "길이마다 그 길이의 증가 부분 수열이 끝날 수 있는 가장 작은 값을 두고, 원소마다 그 목록에서 자리를 찾아 붙이거나 갈아 끼운다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `N = ${num(N_MAX)} 이면 이진 탐색 비교가 최악 ${num(worstProbes())} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 「불변식」 그림이 멈춰 보는 걸음 — T5 직후(원소 다섯을 읽었다). */
export const INVARIANT_AT = 4;

/** 칸마다 길이 줄 하나 — `dp` 가 `k` 인 칸에만 값을 두고, 그중 가장 작은 칸을 강조한다. */
function lengthRows(A: readonly number[], upto: number): StageRow[] {
  const prefix = A.slice(0, upto + 1);
  const { dp } = squareDp(prefix);
  const top = Math.max(0, ...dp);
  const rows: StageRow[] = [];
  for (let k = 1; k <= top; k++) {
    const cells = prefix.map((v, i) => (dp[i] === k ? v : null));
    const present = cells.filter((v): v is number => v !== null);
    const least = Math.min(...present);
    const states: Partial<Record<number, CellState>> = {};
    cells.forEach((v, i) => {
      if (v === null) return;
      states[i] = v === least ? "focus" : "read";
    });
    rows.push({
      kind: "cells",
      label: `길이 ${k}`,
      values: A.map((_, i) => (i <= upto ? (cells[i] ?? null) : null)),
      states,
      side: `가장 작은 끝값 ${least} → tails[${k - 1}]`,
    });
  }
  return rows;
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-tails": () => {
    const steps = trace(WALK);
    const tails = (steps.at(-1) as Step).after;
    const { dp, parent } = squareDp(WALK);
    const end = dp.indexOf(Math.max(...dp));
    const chain = chainTo(parent, end);
    const states: Partial<Record<number, CellState>> = {};
    for (const i of chain) states[i] = "read";
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      {
        kind: "cells",
        label: "A",
        values: [...WALK],
        states,
        side: `증가 부분 수열 ${show(chain.map((i) => WALK[i] as number))}`,
      },
      {
        kind: "index",
        label: "k",
        labels: WALK.map((_, k) => (k < tails.length ? k : "")),
      },
      {
        kind: "cells",
        label: "꼬리 배열",
        values: WALK.map((_, k) => tails[k] ?? null),
        states: { [tails.length - 1]: "focus" },
        side: `길이 ${tails.length} = 답`,
      },
    ];
    return (
      <CellStage
        title={`A = [${WALK.join(", ")}] 와 꼬리 배열 — tails[k] 는 길이 k+1 의 가장 작은 끝값`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 다섯 — 넷은 버렸고 하나가 남았다"
        constraint={`원소 N 최대 ${num(N_MAX)} · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-lengths": () => {
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      { kind: "cells", label: "A", values: [...WALK] },
      ...lengthRows(WALK, WALK.length - 1),
    ];
    return (
      <CellStage
        title="길이마다 그 길이로 끝날 수 있는 원소 — 가장 작은 것이 꼬리 배열의 한 칸"
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "build-confuse": () => {
    const { dp } = squareDp(WALK);
    const tails = (trace(WALK).at(-1) as Step).after;
    const frames: StageFrame[] = [
      {
        id: "dp",
        text: "칸마다 — dp[i] 는 칸 i 에서 끝나는 가장 긴 길이",
        rows: [
          { kind: "index", label: "i" },
          { kind: "cells", label: "A", values: [...WALK] },
          {
            kind: "cells",
            label: "dp",
            values: dp,
            side: `${dp.length} 칸`,
          },
        ],
      },
      {
        id: "tails",
        text: "길이마다 — tails[k] 는 길이 k+1 의 가장 작은 끝값",
        rows: [
          {
            kind: "index",
            label: "k",
            labels: WALK.map((_, k) => (k < tails.length ? k : "")),
          },
          {
            kind: "cells",
            label: "꼬리 배열",
            values: WALK.map((_, k) => tails[k] ?? null),
            side: `${tails.length} 칸`,
          },
        ],
      },
    ];
    return (
      <CellStageFilm
        title="같은 입력의 두 줄 — dp 는 칸이 첨자이고, 꼬리 배열은 길이가 첨자다"
        columns={WALK.length}
        frames={frames}
      />
    );
  },
  "walk-lis": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((w) => {
      const s = arrayStep(w);
      return {
        id: w.id,
        text: `${w.title} — ${s.calc?.expr} = ${s.calc?.result}`,
        rows: arrayStage(s, ARRAY_OPTIONS),
      };
    });
    const first = steps[0] as WalkStep;
    return (
      <CellStageFilm
        title={`longestIncreasingSubsequence([${WALK.join(", ")}]) — ${first.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(first))}
        frames={frames}
      />
    );
  },
  "invariant-t5": () => {
    const at = INVARIANT_AT;
    const s = trace(WALK)[at] as Step;
    const states: Partial<Record<number, CellState>> = {};
    WALK.forEach((_, i) => {
      if (i > at) states[i] = "out";
    });
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      {
        kind: "cells",
        label: "A",
        values: [...WALK],
        states,
        side: `읽은 원소 ${at + 1} 개`,
      },
      ...lengthRows(WALK, at),
      {
        kind: "index",
        label: "k",
        labels: WALK.map((_, k) => (k < s.after.length ? k : "")),
      },
      {
        kind: "cells",
        label: "꼬리 배열",
        values: WALK.map((_, k) => s.after[k] ?? null),
        side: `길이 ${s.after.length}`,
      },
    ];
    return (
      <CellStage
        title={`T${at + 1} 직후 — 꼬리 배열 ${show(s.after)} 의 칸마다 읽은 원소 가운데 그 길이의 가장 작은 끝값`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "related-piles": () => {
    const ps = piles(WALK);
    const height = Math.max(...ps.map((p) => p.length));
    const rows: StageRow[] = [
      {
        kind: "index",
        label: "더미",
        labels: ps.map((_, k) => `${k + 1}`),
      },
    ];
    for (let d = 0; d < height; d++) {
      rows.push({
        kind: "cells",
        label: `${d + 1} 번째 카드`,
        values: ps.map((p) => p[d] ?? null),
      });
    }
    const tops = ps.map((p) => p.at(-1) as number);
    rows.push({
      kind: "cells",
      label: "맨 위 카드",
      values: tops,
      states: Object.fromEntries(tops.map((_, k) => [k, "focus"])),
      side: `= 꼬리 배열 · 더미 ${ps.length} 개`,
    });
    return (
      <CellStage
        title={`A = [${WALK.join(", ")}] 를 카드로 놓은 더미 — 아래로 갈수록 나중에 놓은 카드`}
        rows={rows}
        columns={ps.length}
      />
    );
  },
};
