/**
 * `parametricBinarySearch-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 반복 한 바퀴의 `lo`·`hi`·`mid` 와
 * 탐욕 순회 한 칸의 `accSum`·`count` 는 정본 소스에서 기계로 만든 계측 사본이 기록하고, 판정과 답은
 * 정본이 낸다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이
 * 그것과 같은지는 `parametricBinarySearch-guide.test.ts` 가 잰다.
 *
 * 무대는 입력 배열 `A` 가 아니라 **답 후보값 줄**(`max(A)` 부터 `ΣA` 까지)이다. 칸의 값이 곧 좌표라서
 * 배열 무대를 `valueAxis` 로 쓴다 — 인덱스 줄이 없고 괄호가 값으로 적힌다.
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
  type StageTone,
} from "../../../_viz/patterns/CellStage";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import {
  feasible,
  parametricBinarySearch,
} from "./parametricBinarySearch-guide.ref.ts";

const REF = new URL("./parametricBinarySearch-guide.ref.ts", import.meta.url)
  .pathname;

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const A5 = [7, 2, 5, 10, 8];
export const K5 = 2;
/** 답이 후보 구간의 위 끝이 되는 둘째 입력 — 같은 배열을 한 묶음으로. */
export const K_UPPER = 1;

export const maxOf = (A: readonly number[]): number =>
  A.reduce((best, x) => (x > best ? x : best), 0);
export const sumOf = (A: readonly number[]): number =>
  A.reduce((acc, x) => acc + x, 0);
export const num = (x: number | bigint): string => x.toLocaleString("en-US");
/** `[7 2 5 10 8]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
export const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;
/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
export const secondsOf = (ops: number): string =>
  ops / 1e8 < 0.01
    ? "0.01 초 미만"
    : `${num(Math.round((ops / 1e8) * 100) / 100)} 초`;

const range = (lo: number, hi: number): number[] =>
  Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);

/** 전개 입력의 답 후보값 줄 — `max(A)` 부터 `ΣA` 까지. 칸 하나가 후보값 하나다. */
export const CAND = range(maxOf(A5), sumOf(A5));
const BASE = CAND[0] as number;
/** 후보값 → 무대의 칸 자리. */
const at = (m: number): number => m - BASE;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 반복 한 바퀴 — 그 바퀴가 시작할 때의 후보 구간과 판정한 후보값. */
export interface Round {
  readonly lo: number;
  readonly hi: number;
  readonly mid: number;
  /** 정본 `feasible` 이 낸 판정. */
  readonly ok: boolean;
  /** 탐욕 순회가 `mid` 에서 만든 묶음 수 `g(mid)`. */
  readonly groups: number;
}

export interface Trace {
  readonly rounds: readonly Round[];
  readonly result: number;
  /** 반복이 끝난 뒤의 후보 구간. */
  readonly end: { readonly lo: number; readonly hi: number };
}

/**
 * `mid` 를 정하는 한 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히
 * 맞지 않으면 `loadMutant` 가 던진다.
 */
const probed = await loadMutant<{
  parametricBinarySearch(A: number[], K: number): number;
}>(REF, {
  swap: [
    /^(\s*)const mid = lo \+ Math\.floor\(\(hi - lo\) \/ 2\);$/,
    "$1const mid = lo + Math.floor((hi - lo) / 2);\n$1(globalThis as any).__rounds.push({ lo, hi, mid });",
  ],
});

/**
 * 탐욕 순회의 `accSum += x;` 뒤에 기록을 끼운 사본. 한 칸을 넣은 직후의 `accSum`·`count` 가 남는다.
 */
const greedyProbed = await loadMutant<{
  feasible(A: number[], K: number, m: number): boolean;
}>(REF, {
  swap: [
    /^(\s*)accSum \+= x;$/,
    "$1accSum += x;\n$1(globalThis as any).__greedy.push({ x, accSum, count });",
  ],
});

/**
 * 변이 중화 실행(`check-proof` 가 사이드카를 두 번 부른다)에서는 `loadMutant` 가 정본을 그대로
 * 돌려주어 기록이 쌓이지 않는다. 그때만 같은 절차를 여기서 다시 밟아 기록을 만든다 — 그래야 중화
 * 실행에서 계측에 기댄 블록이 깨지지 않고, 두 실행이 갈리는 줄이 진짜 변이의 자리로만 남는다.
 */
const neutral = probed.parametricBinarySearch === parametricBinarySearch;

function replayRounds(
  A: number[],
  K: number,
): { lo: number; hi: number; mid: number }[] {
  const out: { lo: number; hi: number; mid: number }[] = [];
  let lo = maxOf(A);
  let hi = sumOf(A);
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    out.push({ lo, hi, mid });
    if (feasible(A, K, mid)) hi = mid - 1;
    else lo = mid + 1;
  }
  return out;
}

/** 정본 한 번 호출의 반복 기록. 답은 정본과 대조하고, 바퀴 사이의 구간 변화도 대조한다. */
export function trace(A: readonly number[], K: number): Trace {
  const g = globalThis as unknown as {
    __rounds: { lo: number; hi: number; mid: number }[];
  };
  g.__rounds = [];
  const result = probed.parametricBinarySearch([...A], K);
  const want = parametricBinarySearch([...A], K);
  if (result !== want) {
    throw new Error(
      `계측 사본이 정본과 다른 답을 냈다 — ${show(A.slice(0, 8))} K ${K}: ${result} ≠ ${want}`,
    );
  }
  const raw = neutral ? replayRounds([...A], K) : g.__rounds;
  const rounds: Round[] = raw.map(({ lo, hi, mid }) => ({
    lo,
    hi,
    mid,
    ok: feasible([...A], K, mid),
    groups: greedy(A, mid).count,
  }));
  const after = (r: Round) =>
    r.ok ? { lo: r.lo, hi: r.mid - 1 } : { lo: r.mid + 1, hi: r.hi };
  for (let i = 1; i < rounds.length; i++) {
    const a = after(rounds[i - 1] as Round);
    const b = rounds[i] as Round;
    if (a.lo !== b.lo || a.hi !== b.hi) {
      throw new Error(`바퀴 ${i} 의 구간이 앞 바퀴의 갱신과 다르다`);
    }
  }
  const last = rounds.at(-1);
  const end = last === undefined ? { lo: maxOf(A), hi: sumOf(A) } : after(last);
  if (end.lo <= end.hi || end.lo !== result) {
    throw new Error(
      "반복이 끝났는데 후보 구간이 비지 않았거나 lo 가 답이 아니다",
    );
  }
  return { rounds, result, end };
}

/** 탐욕 순회 한 칸 — 그 칸을 넣기 전과 넣은 뒤. */
export interface GreedyCell {
  readonly i: number;
  readonly x: number;
  /** 넣기 전 지금 묶음의 합. */
  readonly before: number;
  /** 이 칸에서 새 묶음을 시작했는가(갈래 ③). */
  readonly opened: boolean;
  readonly count: number;
  readonly accSum: number;
}

export interface Greedy {
  readonly cells: readonly GreedyCell[];
  /** 만든 묶음 수 `g(m)`. */
  readonly count: number;
  /** 묶음마다 인덱스 구간 `[from, to]` 과 합. */
  readonly groups: readonly { from: number; to: number; sum: number }[];
}

function replayGreedy(A: readonly number[], m: number) {
  const out: { x: number; accSum: number; count: number }[] = [];
  let count = 1;
  let accSum = 0;
  for (const x of A) {
    if (accSum + x > m) {
      count++;
      accSum = 0;
    }
    accSum += x;
    out.push({ x, accSum, count });
  }
  return out;
}

/**
 * 판정 함수 한 번의 탐욕 순회 기록. 묶음 수는 정본 `feasible` 로 대조한다 — 그 수의 묶음으로는
 * 참이고 하나 적으면 거짓이어야 한다.
 */
export function greedy(A: readonly number[], m: number): Greedy {
  const g = globalThis as unknown as {
    __greedy: { x: number; accSum: number; count: number }[];
  };
  g.__greedy = [];
  greedyProbed.feasible([...A], A.length + 1, m);
  const raw = neutral ? replayGreedy(A, m) : g.__greedy;
  const cells: GreedyCell[] = raw.map((r, i) => {
    const prev = i === 0 ? { accSum: 0, count: 1 } : (raw[i - 1] as typeof r);
    const opened = r.count > prev.count;
    return {
      i,
      x: r.x,
      before: prev.accSum,
      opened,
      count: r.count,
      accSum: r.accSum,
    };
  });
  const count = cells.at(-1)?.count ?? 1;
  if (!feasible([...A], count, m)) {
    throw new Error(`탐욕 묶음 수 ${count} 로 정본 판정이 거짓이다 — m ${m}`);
  }
  if (count > 1 && m >= maxOf(A) && feasible([...A], count - 1, m)) {
    throw new Error(`묶음 수 ${count - 1} 로도 정본 판정이 참이다 — m ${m}`);
  }
  const groups: { from: number; to: number; sum: number }[] = [];
  for (const c of cells) {
    const last = groups.at(-1);
    if (last === undefined || c.opened) {
      groups.push({ from: c.i, to: c.i, sum: c.x });
    } else {
      last.to = c.i;
      last.sum += c.x;
    }
  }
  return { cells, count, groups };
}

/** 묶음을 `7 2 5 │ 10 8` 꼴로. */
export function groupsText(
  A: readonly number[],
  groups: readonly { from: number; to: number }[],
): string {
  return groups.map((gr) => A.slice(gr.from, gr.to + 1).join(" ")).join(" │ ");
}

/**
 * 묶음 합이 `m` 이하가 되게 나눌 때 필요한 최소 묶음 수 — **정본의 판정으로만** 구한다.
 * `K` 를 1 부터 올리며 처음 참이 되는 자리가 그 수다.
 */
export function minGroups(A: readonly number[], m: number): number {
  for (let k = 1; k <= A.length; k++) {
    if (feasible([...A], k, m)) return k;
  }
  return A.length + 1;
}

/* ───────────────────────── 나눔 전부 만들기 ───────────────────────── */

/** 칸 사이 자리에서 `K − 1` 곳을 고른 나눔 하나. `cuts` 는 새 묶음이 시작하는 인덱스들. */
export interface Split {
  readonly cuts: readonly number[];
  readonly sums: readonly number[];
  readonly max: number;
}

/** 나눔을 전부 만든다 — 가장 단순한 방법. */
export function allSplits(A: readonly number[], K: number): Split[] {
  const N = A.length;
  const out: Split[] = [];
  const choose = (start: number, left: number, cuts: number[]): void => {
    if (left === 0) {
      const sums: number[] = [];
      let prev = 0;
      for (const b of [...cuts, N]) {
        sums.push(sumOf(A.slice(prev, b)));
        prev = b;
      }
      out.push({ cuts: [...cuts], sums, max: Math.max(...sums) });
      return;
    }
    for (let i = start; i <= N - left; i++) {
      choose(i + 1, left - 1, [...cuts, i]);
    }
  };
  choose(1, K - 1, []);
  return out;
}

/** 나눔을 전부 만들어 낸 답. 음수가 섞인 배열에서도 정의대로 맞는 값이다. */
export const bruteAnswer = (A: readonly number[], K: number): number =>
  Math.min(...allSplits(A, K).map((s) => s.max));

/** `7 │ 2 5 10 8` 꼴. */
export function splitText(
  A: readonly number[],
  cuts: readonly number[],
): string {
  const parts: string[] = [];
  let prev = 0;
  for (const b of [...cuts, A.length]) {
    parts.push(A.slice(prev, b).join(" "));
    prev = b;
  }
  return parts.join(" │ ");
}

/** 이항계수 — 칸 사이 `n` 곳에서 `k` 곳을 고르는 가짓수. */
export function binom(n: number, k: number): bigint {
  let r = 1n;
  for (let i = 1; i <= k; i++) {
    r = (r * BigInt(n - k + i)) / BigInt(i);
  }
  return r;
}

/** 이항계수의 십진 자릿수 — 값이 너무 커서 로그의 합으로 센다. */
export function binomDigits(n: number, k: number): number {
  let l = 0;
  for (let i = 1; i <= k; i++) l += Math.log10(n - k + i) - Math.log10(i);
  return Math.floor(l) + 1;
}

/* ───────────────────────── 걸음 ───────────────────────── */

const MARK = { true: "①", false: "②" } as const;

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly lo: number;
  readonly hi: number;
  /** 이번에 판정한(또는 판정할) 후보값. */
  readonly mid?: number;
  /** 반복이 끝나 돌려준 값. */
  readonly found?: number;
  readonly calc?: { readonly expr: string; readonly result: string };
  readonly probes: number;
}

/** 첫째 벌 — 초기화 한 걸음 + 바퀴마다 「가운데 계산」·「판정」 두 걸음 + 끝나는 한 걸음. */
function hitSteps(from: number): Step[] {
  const t = trace(A5, K5);
  const steps: Step[] = [];
  let n = from;
  const first = t.rounds[0] as Round;
  steps.push({
    id: `T${n++}`,
    title: `후보 [${first.lo},${first.hi}]`,
    detail: `후보 구간을 답이 놓일 수 있는 값 전체로 잡습니다. lo = max(A) = ${first.lo}, hi = ΣA = ${first.hi}, 후보값 ${first.hi - first.lo + 1} 개입니다.`,
    lo: first.lo,
    hi: first.hi,
    probes: 0,
  });
  let probes = 0;
  for (const r of t.rounds) {
    steps.push({
      id: `T${n++}`,
      title: `mid = ${r.mid}`,
      detail: `${r.lo} <= ${r.hi}${이가(r.hi)} 참이라 반복에 들어갑니다. mid = ${r.lo} + ⌊${r.hi - r.lo}/2⌋ = ${r.mid} 입니다.`,
      lo: r.lo,
      hi: r.hi,
      mid: r.mid,
      calc: { expr: `${r.lo} + ⌊${r.hi - r.lo}/2⌋`, result: String(r.mid) },
      probes,
    });
    probes++;
    const next = r.ok
      ? { lo: r.lo, hi: r.mid - 1 }
      : { lo: r.mid + 1, hi: r.hi };
    const gr = greedy(A5, r.mid);
    const verdict = r.ok
      ? `${r.groups} <= ${K5}${이가(K5)} 참이라 ① hi = ${next.hi} 입니다.`
      : `${r.groups} <= ${K5}${이가(K5)} 거짓이라 ② lo = ${next.lo} 입니다.`;
    steps.push({
      id: `T${n++}`,
      title: `판정 ${r.mid} ${MARK[String(r.ok) as "true" | "false"]}`,
      detail: `탐욕 순회가 ${groupsText(A5, gr.groups)} 로 묶음 ${r.groups} 개를 만듭니다. ${verdict}`,
      lo: next.lo,
      hi: next.hi,
      mid: r.mid,
      calc: { expr: `g(${r.mid})`, result: String(r.groups) },
      probes,
    });
  }
  steps.push({
    id: `T${n++}`,
    title: `lo = ${t.end.lo} > hi = ${t.end.hi}`,
    detail: `lo <= hi 가 거짓이라 반복이 끝나고 lo = ${t.result}${을를(t.result)} 돌려줍니다.`,
    lo: t.end.lo,
    hi: t.end.hi,
    found: t.result,
    probes,
  });
  return steps;
}

/** 둘째 벌(`K = 1`) — 바퀴마다 한 걸음 + 끝나는 한 걸음. */
function upperSteps(from: number): Step[] {
  const t = trace(A5, K_UPPER);
  const steps: Step[] = [];
  let n = from;
  let probes = 0;
  for (const r of t.rounds) {
    probes++;
    const next = r.ok
      ? { lo: r.lo, hi: r.mid - 1 }
      : { lo: r.mid + 1, hi: r.hi };
    const verdict = r.ok
      ? `${r.groups} <= ${K_UPPER}${이가(K_UPPER)} 참이라 ① hi = ${next.hi}`
      : `${r.groups} <= ${K_UPPER}${이가(K_UPPER)} 거짓이라 ② lo = ${next.lo}`;
    steps.push({
      id: `T${n++}`,
      title: `후보 [${r.lo},${r.hi}] · 판정 ${r.mid} ${MARK[String(r.ok) as "true" | "false"]}`,
      detail: `mid = ${r.mid} 입니다. 탐욕 순회가 묶음 ${r.groups} 개를 만듭니다. ${verdict} 입니다.`,
      lo: next.lo,
      hi: next.hi,
      mid: r.mid,
      calc: { expr: `g(${r.mid})`, result: String(r.groups) },
      probes,
    });
  }
  steps.push({
    id: `T${n++}`,
    title: `lo = ${t.end.lo} > hi = ${t.end.hi}`,
    detail: `lo <= hi 가 거짓이라 반복이 끝나고 lo = ${t.result}${을를(t.result)} 돌려줍니다.`,
    lo: t.end.lo,
    hi: t.end.hi,
    found: t.result,
    probes,
  });
  return steps;
}

/**
 * 걸음 하나를 배열 무대의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. 쥔 구간은 후보
 * 구간이고(비면 `null`), 읽은 칸은 이번에 판정한 후보값, 새로 쓴 칸은 돌려준 답이다.
 */
function arrayStep(s: Step): ArrayStep {
  return {
    array: [...CAND],
    range: s.lo <= s.hi ? [at(s.lo), at(s.hi)] : null,
    read: s.mid !== undefined ? [at(s.mid)] : [],
    write: s.found !== undefined ? [at(s.found)] : [],
    pointers:
      s.mid === undefined
        ? { lo: s.lo, hi: s.hi }
        : { lo: s.lo, mid: s.mid, hi: s.hi },
    calc: s.calc ?? null,
    vars: `판정 ${s.probes} 번`,
  };
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "후보값 m",
  rangeLabel: "후보",
  valueAxis: true,
};

const film = (steps: Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
  }));

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `parametricBinarySearch-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const toStep = (s: Step) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...arrayStep(s),
  });
  const { hit, upper } = walkSteps();
  return { probe: hit.map(toStep), upper: upper.map(toStep) };
}

/** 본문이 인용하는 걸음 — 필름과 표가 같은 번호를 쓴다. */
export const walkSteps = () => {
  const hit = hitSteps(1);
  return { hit, upper: upperSteps(hit.length + 1) };
};

/* ───────────────── 「아이디어를 떠올리는 과정」 ───────────────── */

/** 과제 규모 — 칸 `N`, 값 상한, 묶음 수. */
export const N_MAX = 100_000;
export const V_MAX = 1_000_000;

/** 큰 입력 — 저장소 테스트가 쓰는 것과 같은 생성식이다. */
export const BIG = Array.from({ length: N_MAX }, (_, i) => (i * 37) % V_MAX);
export const BIG_K = 100;

/** 1 씩 올리며 판정하면 답에 이를 때까지 판정한 횟수 — 아래 끝부터 답까지의 값 수다. */
export const oneByOne = (A: readonly number[], K: number): number =>
  parametricBinarySearch([...A], K) - maxOf(A) + 1;
/** 후보값 개수 `S = ΣA − max(A) + 1`. */
export const span = (A: readonly number[]): number => sumOf(A) - maxOf(A) + 1;

/**
 * 동적 계획법이 분할점을 시험하는 횟수 — `.alt.ts` 의 세 겹 반복(`j` · `i` · `k`)을 그대로 센
 * 식이다. `j` 번째 줄에서 `i = j … N` 이 각각 `i − j + 1` 번씩 시험한다.
 */
export function dpSteps(N: number, K: number): number {
  let steps = 0;
  for (let j = 1; j <= K; j++) {
    const m = N - j + 1;
    steps += (m * (m + 1)) / 2;
  }
  return steps;
}

let scaleMemo: { big: number; bigOneByOne: number } | undefined;
/** 큰 입력에서 반씩 접는 판정 횟수와 1 씩 올리는 판정 횟수. */
export const bigCounts = () => {
  scaleMemo ??= {
    big: trace(BIG, BIG_K).rounds.length,
    bigOneByOne: oneByOne(BIG, BIG_K),
  };
  return scaleMemo;
};

function approaches(): Approach[] {
  const all = binom(N_MAX - 1, N_MAX / 2 - 1);
  const digits = binomDigits(N_MAX - 1, N_MAX / 2 - 1);
  if (all <= 0n) throw new Error("가짓수가 0 이다");
  const dp = dpSteps(N_MAX, N_MAX);
  const { big, bigOneByOne } = bigCounts();
  return [
    {
      name: "나눔 전부 만들기",
      idea: "칸 사이에서 K − 1 곳을 고르는 나눔을 모두 만들고 최댓값이 가장 작은 것을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `N = ${num(N_MAX)}, K = ${num(N_MAX / 2)} 이면 가짓수가 ${num(digits)} 자리 수`,
          ok: false,
        },
      ],
      lesson:
        "나눔을 만들어야 최댓값이 나온다 — 나눔을 겹치지 않게 모아 세면 어떨까",
    },
    {
      name: "표로 채우기(동적 계획법)",
      idea: "앞 i 칸을 j 묶음으로 나눈 최적값을 표에 적고, 분할점을 전부 시험한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `N = K = ${num(N_MAX)} 이면 분할점 시험 ${num(dp)} 번 · ${num(Math.round((dp / 1e8 / 86_400) * 10) / 10)} 일`,
          ok: false,
        },
      ],
      lesson:
        "여전히 나눔을 직접 만든다 — 값 m 하나를 놓고 「되는가」만 물으면 어떨까",
    },
    {
      name: "후보값을 1 씩 올리며 판정",
      idea: "max(A) 부터 1 씩 올리며 「묶음 합이 m 이하가 되게 K 개 이하로 나눌 수 있는가」를 묻는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `N = ${num(N_MAX)} 입력에서 판정 ${num(bigOneByOne)} 번`,
          ok: false,
        },
      ],
      lesson:
        "판정 한 번이 경계 한쪽 전체를 정해 준다 — 한가운데를 물으면 어떨까",
    },
    {
      name: "후보 구간의 한가운데를 판정",
      idea: "답이 놓일 수 있는 값을 후보 구간으로 두고, 한가운데를 판정해 절반을 뺀다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `같은 입력에서 판정 ${num(big)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 무대 줄 도우미 ───────────────────────── */

const INDEX: StageRow = { kind: "index", label: "인덱스" };
const aRow = (
  states?: Partial<Record<number, CellState>>,
  side?: string,
): StageRow => ({
  kind: "cells",
  label: "A",
  values: A5,
  states,
  side,
});

/** 묶음마다 괄호 한 줄 — 이웃한 묶음은 실선·대시로 번갈아 가른다. */
function groupBrackets(
  groups: readonly { from: number; to: number; sum: number }[],
  label: string,
  tones: readonly [StageTone, StageTone] = ["left", "right"],
): StageRow[] {
  return groups.map((gr, k) => ({
    kind: "bracket",
    label: k === 0 ? label : undefined,
    from: gr.from,
    to: gr.to,
    tone: tones[k % 2] as StageTone,
    text: `합 ${gr.sum}`,
  }));
}

/** 후보값 줄 한 줄. */
const candRow = (
  label: string,
  values: readonly (number | string)[],
  states?: Partial<Record<number, CellState>>,
  side?: string,
): StageRow => ({ kind: "cells", label, values, states, side });

const verdicts = (K: number): string[] =>
  CAND.map((m) => (feasible([...A5], K, m) ? "참" : "거짓"));

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-splits": () => {
    const splits = allSplits(A5, K5);
    const best = Math.min(...splits.map((s) => s.max));
    if (best !== parametricBinarySearch([...A5], K5)) {
      throw new Error("나눔을 전부 만든 답이 정본과 다르다");
    }
    const frames: StageFrame[] = splits.map((s, k) => {
      const groups = s.sums.map((sum, g) => ({
        from: g === 0 ? 0 : (s.cuts[g - 1] as number),
        to: g === s.cuts.length ? A5.length - 1 : (s.cuts[g] as number) - 1,
        sum,
      }));
      return {
        id: `나눔 ${k + 1}`,
        text: `${splitText(A5, s.cuts)} — 최댓값 ${s.max}${s.max === best ? " · 가장 작다" : ""}`,
        rows: [
          INDEX,
          aRow(undefined, `최댓값 ${s.max}`),
          ...groupBrackets(groups, "묶음"),
        ],
      };
    });
    return (
      <CellStageFilm
        title={`A = ${show(A5)} 를 두 묶음으로 나누는 ${splits.length} 가지 — 최댓값이 가장 작은 것은 ${best}`}
        columns={A5.length}
        frames={frames}
      />
    );
  },
  "concept-judge": () => {
    const frames: StageFrame[] = [18, 17].map((m) => {
      const gr = greedy(A5, m);
      const ok = feasible([...A5], K5, m);
      return {
        id: `m = ${m}`,
        text: `왼쪽부터 이어 붙이면 묶음 ${gr.count} 개 — ${gr.count} ≤ ${K5}${이가(K5)} ${ok ? "참" : "거짓"}`,
        rows: [
          INDEX,
          aRow(undefined, `판정 ${ok ? "참" : "거짓"}`),
          ...groupBrackets(gr.groups, "묶음"),
        ],
      };
    });
    return (
      <CellStageFilm
        title={`판정 함수 — 「묶음 합이 m 이하가 되게 ${K5} 개 이하로 나눌 수 있는가」를 m = 18 · 17 에 묻는다`}
        columns={A5.length}
        frames={frames}
      />
    );
  },
  "concept-verdict-line": () => {
    const v = verdicts(K5);
    const first = v.indexOf("참");
    const answer = parametricBinarySearch([...A5], K5);
    if (CAND[first] !== answer)
      throw new Error("처음 참이 되는 값이 답이 아니다");
    return (
      <CellStage
        title={`후보값 ${CAND[0]} 부터 ${CAND.at(-1)} 까지의 판정 — 거짓이 이어지다가 ${answer} 에서 참으로 한 번 바뀐다`}
        columns={CAND.length}
        rows={[
          candRow("후보값 m", CAND),
          candRow("판정", v, { [first]: "focus" }),
          {
            kind: "caret",
            cells: [first],
            side: `답 ${answer} — 처음 참이 되는 값`,
          },
          {
            kind: "bracket",
            label: "거짓",
            from: 0,
            to: first - 1,
            tone: "left",
            text: `${first} 개`,
          },
          {
            kind: "bracket",
            label: "참",
            from: first,
            to: CAND.length - 1,
            tone: "right",
            text: `${CAND.length - first} 개`,
          },
        ]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`N ≤ ${num(N_MAX)} · A[i] ≤ ${num(V_MAX)} · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-verdict-rows": () => {
    const g = CAND.map((m) => minGroups(A5, m));
    const v = verdicts(K5);
    return (
      <CellStage
        title={`후보값마다 최소 묶음 수 g(m) 과 판정 g(m) ≤ ${K5}`}
        columns={CAND.length}
        rows={[
          candRow("후보값 m", CAND),
          candRow("g(m)", g),
          candRow(`g(m) ≤ ${K5}`, v, { [v.indexOf("참")]: "focus" }),
        ]}
      />
    );
  },
  "build-exact-vs-atmost": () => {
    const answer = parametricBinarySearch([...A5], K5);
    const v = verdicts(K5);
    const exact = CAND.map((m) => (m === answer ? "예" : "아니오"));
    const probe = trace(A5, K5).rounds[0] as Round;
    return (
      <CellStage
        title={`같은 후보값 줄에 두 물음 — 「답이 m 이하인가」와 「답이 m 인가」`}
        columns={CAND.length}
        rows={[
          candRow("후보값 m", CAND, { [at(probe.mid)]: "read" }),
          {
            kind: "caret",
            cells: [at(probe.mid)],
            side: `처음 읽는 값 ${probe.mid}`,
          },
          candRow("m 이하인가", v),
          candRow("m 인가", exact, { [at(answer)]: "focus" }),
        ]}
      />
    );
  },
  "build-candidates": () => {
    const lo = maxOf(A5);
    const hi = sumOf(A5);
    return (
      <CellStage
        title={`후보 구간 [max(A), ΣA] = [${lo},${hi}] — 답이 놓일 수 있는 값 전체`}
        columns={CAND.length}
        rows={[
          candRow("후보값 m", CAND),
          {
            kind: "bracket",
            label: "후보",
            from: at(lo),
            to: at(hi),
            tone: "query",
            text: `[${lo},${hi}] · ${hi - lo + 1} 개`,
          },
        ]}
      />
    );
  },
  "build-greedy-ahead": () => {
    const m = 18;
    const gr = greedy(A5, m);
    const other = OTHER_SPLIT;
    return (
      <CellStage
        title={`m = ${m} — 탐욕이 만든 묶음과 다른 나눔의 묶음`}
        columns={A5.length}
        rows={[
          INDEX,
          aRow(),
          ...groupBrackets(gr.groups, "탐욕", ["left", "left"]),
          ...groupBrackets(other, "다른 나눔", ["right", "right"]),
        ]}
      />
    );
  },
  "walk-probe": () => {
    const { hit } = walkSteps();
    return (
      <CellStageFilm
        title={`parametricBinarySearch([${A5.join(", ")}], ${K5}) — ${hit[0]?.id}~${hit.at(-1)?.id}`}
        columns={CAND.length}
        frames={film(hit)}
      />
    );
  },
  "walk-upper": () => {
    const { upper } = walkSteps();
    return (
      <CellStageFilm
        title={`parametricBinarySearch([${A5.join(", ")}], ${K_UPPER}) — ${upper[0]?.id}~${upper.at(-1)?.id}`}
        columns={CAND.length}
        frames={film(upper)}
      />
    );
  },
  "invariant-zones": () => {
    const t = trace(A5, K5);
    // 답이 후보 구간 밖(hi + 1)에 있는 첫 바퀴 — 불변식의 오른쪽 끝이 hi 가 아니라 hi + 1 인 까닭.
    const r = t.rounds.find((x) => x.hi < t.result) as Round;
    const states: Partial<Record<number, CellState>> = {};
    for (const m of CAND) if (m < r.lo || m > r.hi) states[at(m)] = "out";
    return (
      <CellStage
        title={`바퀴가 시작할 때 — lo = ${r.lo}, hi = ${r.hi}, 답 ${t.result} 은 lo 이상 hi + 1 이하`}
        columns={CAND.length}
        rows={[
          candRow("후보값 m", CAND, states),
          {
            kind: "caret",
            cells: [at(t.result)],
            side: `답 ${t.result} = hi + 1`,
          },
          {
            kind: "bracket",
            label: "거짓",
            from: 0,
            to: at(r.lo) - 1,
            tone: "left",
            text: "거짓으로 정해졌다",
          },
          {
            kind: "bracket",
            label: "후보",
            from: at(r.lo),
            to: at(r.hi),
            tone: "query",
            text: `[${r.lo},${r.hi}]`,
          },
          {
            kind: "bracket",
            label: "참",
            from: at(r.hi) + 1,
            to: CAND.length - 1,
            tone: "right",
            text: "참으로 정해졌다",
          },
        ]}
      />
    );
  },
};

/**
 * 탐욕과 나란히 놓는 「다른 나눔」 — `m = 18` 에서도 묶음 합이 모두 18 이하인 세 묶음 나눔.
 * 값은 배열에서 잘라 합을 낸다.
 */
export const OTHER_SPLIT: readonly { from: number; to: number; sum: number }[] =
  [
    [0, 1],
    [2, 3],
    [4, 4],
  ].map(([from, to]) => ({
    from: from as number,
    to: to as number,
    sum: sumOf(A5.slice(from, (to as number) + 1)),
  }));
