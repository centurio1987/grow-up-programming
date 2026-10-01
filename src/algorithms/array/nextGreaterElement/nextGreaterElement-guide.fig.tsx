/**
 * `nextGreaterElement-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림과 증명 블록에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 정본이 **무엇을 어떤 차례로
 * 읽었는가**는 입력 배열을 `Proxy` 로 감싸 기록한다 — 정본 소스를 바꾸지 않으므로 `check-proof` 가 변이를
 * 중화한 실행에서도 기록이 그대로 나온다. 정본이 `nums` 를 읽는 자리는 둘뿐이다 — 지금 값 `nums[i]` 와
 * 꼭대기의 값 `nums[top]`. 꼭대기는 언제나 `i` 보다 왼쪽이므로 읽은 칸 번호만으로 둘이 갈린다. 그 기록을
 * 다시 재생해 스택을 세우고, 재생한 답이 정본의 답과 다르면 던진다.
 *
 * 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `nextGreaterElement-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
  type ArrayLayer,
  type ArrayOptions,
  type ArrayStep,
  type ArrayStepStrip,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { nextGreaterElement } from "./nextGreaterElement-guide.ref.ts";

/* ───────────────────────── 고정 입력 ───────────────────────── */

/** 본문 전개가 쓰는 입력. `deep.origin`·`deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다. */
export const WALK: readonly number[] = [2, 1, 2, 4, 3];

/** 작은 입력으로는 계수가 안 갈리는 자리에서 쓰는 큰 입력. 난수를 쓰지 않는다 — `.alt.ts` 와 같은 식이다. */
export const BIG_N = 1024;
export const BIG: readonly number[] = Array.from(
  { length: BIG_N },
  (_, i) => (i * 7919) % 1009,
);

/** 과제 규모 — 배열 길이 `N` 의 상한. */
export const TASK_N = 100_000;
/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
export const OPS_PER_SECOND = 100_000_000;

export const num = (x: number): string => x.toLocaleString("en-US");
/** `[4 2 4 -1 -1]` 꼴 — 값 나열은 쉼표 없이 공백으로 적는다(L25). */
export const show = (xs: readonly (number | string)[]): string =>
  `[${xs.join(" ")}]`;
/** `0 · 2` 꼴의 자리 나열. */
export const dots = (xs: readonly number[]): string => xs.join(" · ");

/* ───────────────────────── 정본 실행 기록 ───────────────────────── */

/**
 * 정본이 한 일 하나. `cur` 는 지금 값 `nums[i]` 를 읽은 것, `cmp` 는 꼭대기 `top` 의 값을 읽어 지금 값과
 * 비교한 것(`pop` 이 참이면 꺼냈다), `push` 는 지금 자리를 넣은 것이다. `push` 는 읽기가 아니라서 기록에
 * 직접 남지 않는다 — 다음 `cur` 가 오거나 순회가 끝나는 자리에 넣고, 그렇게 재생한 스택의 꼭대기가
 * 정본이 실제로 읽은 칸과 다르면 던진다.
 */
export type Event =
  | { readonly kind: "cur"; readonly i: number }
  | {
      readonly kind: "cmp";
      readonly i: number;
      readonly top: number;
      readonly pop: boolean;
    }
  | { readonly kind: "push"; readonly i: number };

export interface Run {
  readonly result: number[];
  readonly events: readonly Event[];
}

/** 읽은 칸 번호를 차례로 모으는 감시 배열. */
function watched(
  nums: readonly number[],
  onRead: (k: number) => void,
): number[] {
  return new Proxy([...nums], {
    get(target, key, receiver) {
      if (typeof key === "string" && /^\d+$/.test(key)) onRead(Number(key));
      return Reflect.get(target, key, receiver);
    },
  });
}

/** 정본 한 번 호출의 기록 — 작은 입력용. 기록이 걸음마다 쌓이므로 큰 입력에는 `count` 를 쓴다. */
export function run(nums: readonly number[]): Run {
  const reads: number[] = [];
  const result = nextGreaterElement(watched(nums, (k) => reads.push(k)));
  const events: Event[] = [];
  const stack: number[] = [];
  const replay = new Array<number>(nums.length).fill(-1);
  let next = 0;
  let i = -1;
  for (const k of reads) {
    if (k === next) {
      if (i >= 0) {
        stack.push(i);
        events.push({ kind: "push", i });
      }
      i = k;
      next++;
      events.push({ kind: "cur", i });
      continue;
    }
    if (k !== stack.at(-1)) {
      throw new Error(
        `정본이 읽은 칸 ${k} 이 재생한 스택의 꼭대기 ${stack.at(-1)} 와 다르다`,
      );
    }
    const pop = (nums[k] as number) < (nums[i] as number);
    events.push({ kind: "cmp", i, top: k, pop });
    if (pop) {
      stack.pop();
      replay[k] = nums[i] as number;
    }
  }
  if (i >= 0) {
    stack.push(i);
    events.push({ kind: "push", i });
  }
  if (next !== nums.length || replay.join(",") !== result.join(",")) {
    throw new Error(
      `재생한 답 ${show(replay)} 이 정본의 답 ${show(result)} 과 다르다`,
    );
  }
  return { result, events };
}

/**
 * 한 번의 실행을 세는 가벼운 판 — 값만 센다(기록을 남기지 않는다). 세는 규칙은 `run` 과 같다.
 *
 * 칸 접근은 `nums` 읽기(감시 배열이 센다)에 코드가 하는 쓰기와 스택 읽기를 더한다 — 답 배열 초기화
 * `N` 번 · 꺼낸 자리의 답 쓰기 `P` 번 · 비교마다 꼭대기 읽기 한 번 · 자리 넣기 `N` 번.
 */
export interface Counts {
  readonly n: number;
  /** 비교한 횟수 — 꼭대기의 값을 읽어 지금 값과 비교한 횟수. `P + B` 다. */
  readonly cmp: number;
  /** 꺼낸 횟수 `P`. */
  readonly pops: number;
  /** 꼭대기가 남아 멈춘 걸음의 수 `B`. */
  readonly stops: number;
  /** 순회가 끝났을 때 스택에 남은 자리의 수 `S`. */
  readonly left: number;
  /** 스택이 가장 깊었을 때의 칸 수. */
  readonly peak: number;
  /** 칸 접근 수(읽기 + 쓰기). */
  readonly acc: number;
  readonly result: number[];
}

export function count(nums: readonly number[]): Counts {
  let next = 0;
  let i = -1;
  let depth = 0;
  let peak = 0;
  let cmp = 0;
  let pops = 0;
  let stops = 0;
  let reads = 0;
  const push = (): void => {
    depth++;
    if (depth > peak) peak = depth;
  };
  const result = nextGreaterElement(
    watched(nums, (k) => {
      reads++;
      if (k === next) {
        if (i >= 0) push();
        i = k;
        next++;
        return;
      }
      cmp++;
      if ((nums[k] as number) < (nums[i] as number)) {
        pops++;
        depth--;
      } else stops++;
    }),
  );
  if (i >= 0) push();
  const n = nums.length;
  if (reads !== n + cmp) throw new Error("읽은 칸 수가 N + 비교 횟수와 다르다");
  return {
    n,
    cmp,
    pops,
    stops,
    left: depth,
    peak,
    acc: n + reads + cmp + pops + n,
    result,
  };
}

/* ───────────────────────── 다른 방법 — 비교용 ───────────────────────── */

/**
 * 자리마다 오른쪽을 차례로 읽는 방법. 본문 `deep.origin` 의 코드와 같은 절차이고, 칸 접근을 같은
 * 규칙으로 센다 — 답 배열 초기화 `N` · `nums[i]` 읽기 · `nums[j]` 읽기 · 답 쓰기. 답은 정본과 대조한다.
 */
export function scanRight(nums: readonly number[]): {
  result: number[];
  acc: number;
  /** 자리마다 읽은 오른쪽 칸과 멈춘 칸(없으면 -1). */
  scans: { read: number[]; stop: number }[];
} {
  const n = nums.length;
  const result = new Array<number>(n).fill(-1);
  const keep = n <= 64;
  const scans: { read: number[]; stop: number }[] = [];
  let acc = n;
  for (let i = 0; i < n; i++) {
    acc++;
    const cur = nums[i] as number;
    const read: number[] = [];
    let stop = -1;
    for (let j = i + 1; j < n; j++) {
      acc++;
      if (keep) read.push(j);
      const v = nums[j] as number;
      if (v > cur) {
        acc++;
        result[i] = v;
        stop = j;
        break;
      }
    }
    if (keep) scans.push({ read, stop });
  }
  if (n <= 20_000 && result.join(",") !== count(nums).result.join(",")) {
    throw new Error("차례로 읽는 방법의 답이 정본과 다르다");
  }
  return { result, acc, scans };
}

/**
 * 답을 기다리는 자리를 `keep` 개까지만 남기는 방법. 넘치면 **가장 오래된** 자리를 버린다 — 버린 자리는
 * 답을 못 받고 `-1` 로 남는다. `bottomUp` 이 참이면 꼭대기에서 멈추지 않고 남긴 자리를 **아래까지 전부**
 * 비교한다. 칸 접근은 정본과 같은 규칙으로 센다 — 남긴 자리마다 자리 읽기 한 번과 그 값 읽기 한 번.
 */
export function bounded(
  nums: readonly number[],
  keep: number,
  bottomUp: boolean,
): { result: number[]; acc: number; wrong: number } {
  const n = nums.length;
  const result = new Array<number>(n).fill(-1);
  let pending: number[] = [];
  let acc = n;
  for (let i = 0; i < n; i++) {
    acc++;
    const cur = nums[i] as number;
    const kept: number[] = [];
    for (let k = pending.length - 1; k >= 0; k--) {
      const j = pending[k] as number;
      acc += 2;
      if ((nums[j] as number) < cur) {
        acc++;
        result[j] = cur;
        continue;
      }
      if (!bottomUp) {
        kept.unshift(...pending.slice(0, k + 1));
        break;
      }
      kept.unshift(j);
    }
    pending = kept;
    acc++;
    pending.push(i);
    if (pending.length > keep) pending = pending.slice(pending.length - keep);
  }
  const want = count(nums);
  let wrong = 0;
  for (let i = 0; i < n; i++) if (result[i] !== want.result[i]) wrong++;
  if (!bottomUp && keep >= want.peak && acc !== want.acc) {
    throw new Error("다 남기는 방법의 접근 수가 정본과 다르다");
  }
  return { result, acc, wrong };
}

/** 틀린 자리가 0 이 되는 가장 작은 `keep`. */
export function leastKeep(nums: readonly number[]): number {
  for (let k = 1; k <= nums.length; k++) {
    if (bounded(nums, k, false).wrong === 0) return k;
  }
  return nums.length;
}

/** 감소 수열 `n − 1` 칸 뒤에 가장 큰 값 하나 — 기다리는 자리가 끝까지 쌓이는 입력. */
export const deepInput = (n: number): number[] => [
  ...Array.from({ length: n - 1 }, (_, i) => n - 1 - i),
  n,
];

/* ───────────── 걸음 — 필름 · 걸음 재생 패널 · 증명 표가 같은 기록을 쓴다 ───────────── */

export interface WalkStep {
  readonly id: string;
  /** `push` 스택이 비어 바로 넣음 · `stop` 꼭대기가 작지 않아 멈추고 넣음 · `pop` 꺼내고 답을 적음 · `end` 순회를 마침. */
  readonly kind: "push" | "stop" | "pop" | "end";
  readonly i: number;
  readonly top?: number;
  /** 이 걸음이 끝난 뒤의 스택(바닥 → 꼭대기)과 답 배열. */
  readonly stack: readonly number[];
  readonly result: readonly number[];
  readonly pushes: number;
  readonly pops: number;
  /** 같은 `i` 에서 이 걸음 앞에 꺼낸 것이 있었는가. */
  readonly afterPops: boolean;
}

export function walkOf(nums: readonly number[]): WalkStep[] {
  const { events } = run(nums);
  const steps: WalkStep[] = [];
  const stack: number[] = [];
  const result = new Array<number>(nums.length).fill(-1);
  let pushes = 0;
  let pops = 0;
  let stopTop: number | null = null;
  let poppedHere = false;
  const add = (s: Omit<WalkStep, "id" | "stack" | "result">): void => {
    steps.push({
      id: `T${steps.length + 1}`,
      ...s,
      stack: [...stack],
      result: [...result],
    });
  };
  for (const e of events) {
    if (e.kind === "cur") {
      poppedHere = false;
      continue;
    }
    if (e.kind === "cmp") {
      if (e.pop) {
        stack.pop();
        result[e.top] = nums[e.i] as number;
        pops++;
        add({
          kind: "pop",
          i: e.i,
          top: e.top,
          pushes,
          pops,
          afterPops: poppedHere,
        });
        poppedHere = true;
      } else stopTop = e.top;
      continue;
    }
    stack.push(e.i);
    pushes++;
    if (stopTop !== null) {
      add({
        kind: "stop",
        i: e.i,
        top: stopTop,
        pushes,
        pops,
        afterPops: poppedHere,
      });
    } else {
      add({ kind: "push", i: e.i, pushes, pops, afterPops: poppedHere });
    }
    stopTop = null;
  }
  add({ kind: "end", i: nums.length - 1, pushes, pops, afterPops: false });
  return steps;
}

/** 전개 입력의 걸음 — 본문 · 필름 · 패널이 같은 번호를 쓴다. */
export const WALK_STEPS: readonly WalkStep[] = walkOf(WALK);

/** 스택 띠의 칸 수 — 전개에서 스택이 가장 깊었을 때(방향 그래프 편들의 스택 띠와 같은 약속). */
export const STACK_SLOTS = Math.max(...WALK_STEPS.map((s) => s.stack.length));

/**
 * 스택 띠 두 줄 — 자리 번호 줄(`stack`)과 그 자리의 값 줄. 바닥이 왼쪽, 꼭대기가 오른쪽이다. 칸 `k` 는 쌓인
 * 차례라 `nums` 의 인덱스와 짝이 아니므로 `layers` 가 아니라 `strips` 로 싣는다.
 */
export function stackStrips(
  nums: readonly number[],
  stack: readonly number[],
  marks: { read?: number[]; write?: number[] } = {},
  slots = STACK_SLOTS,
): ArrayStepStrip[] {
  const values = stack.map((p) => nums[p] as number);
  return [
    {
      label: "stack",
      values: [...stack],
      slots,
      read: marks.read ?? [],
      write: marks.write ?? [],
      side: stack.length === 0 ? "비었다" : `꼭대기 = 자리 ${stack.at(-1)}`,
    },
    {
      label: "stack 의 값",
      values,
      slots,
      read: marks.read ?? [],
      write: marks.write ?? [],
      side: values.length === 0 ? "비었다" : values.join(" ≥ "),
    },
  ];
}

/** 답 배열 줄 — 곁말은 답을 받은 자리 수다(처음부터 모든 칸이 -1 이라 「채움」이 늘 가득이다). */
export function resultLayer(
  result: readonly number[],
  answered: number,
  write: number[] = [],
): ArrayLayer {
  return {
    name: "result",
    values: [...result],
    write,
    caret: false,
    side: `답을 받은 자리 ${answered} / ${result.length}`,
  };
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. 쥔 구간은 이미 읽은 자리다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "nums",
  rangeLabel: "읽은 자리",
};

function stepTitle(s: WalkStep): string {
  const v = (p: number) => WALK[p] as number;
  switch (s.kind) {
    case "push":
      return `자리 ${s.i} 넣기`;
    case "stop":
      return `${v(s.top as number)} ≥ ${v(s.i)} · 멈추고 자리 ${s.i} 넣기`;
    case "pop":
      return `${v(s.top as number)} < ${v(s.i)} · 자리 ${s.top} 꺼내기`;
    case "end":
      return `남은 자리 ${dots(s.stack)}${은는(s.stack.at(-1) ?? "")} -1`;
  }
}

function stepText(s: WalkStep): string {
  const v = (p: number) => WALK[p] as number;
  switch (s.kind) {
    case "push":
      return s.afterPops
        ? `꺼낼 꼭대기가 더 없어 반복이 끝났습니다. 자리 ${s.i}${을를(s.i)} 넣습니다. 그 값은 ${v(s.i)} 입니다.`
        : `단조 스택이 비어 비교할 꼭대기가 없습니다. 자리 ${s.i}${을를(s.i)} 넣습니다. 그 값은 ${v(s.i)} 입니다.`;
    case "stop": {
      const t = s.top as number;
      return `꼭대기 자리 ${t} 의 값 ${v(t)}${은는(v(t))} 지금 값 ${v(s.i)} 보다 작지 않아 멈춥니다. 자리 ${s.i}${을를(s.i)} 넣습니다.`;
    }
    case "pop": {
      const t = s.top as number;
      return `꼭대기 자리 ${t} 의 값 ${v(t)}${이가(v(t))} 지금 값 ${v(s.i)} 보다 작아 꺼내고, result[${t}] 에 ${v(s.i)}${을를(v(s.i))} 적습니다.`;
    }
    case "end":
      return `순회가 끝났습니다. 단조 스택에 남은 자리 ${dots(s.stack)}${은는(s.stack.at(-1) ?? "")} 처음에 깐 -1 을 그대로 답으로 씁니다.`;
  }
}

function stepCalc(s: WalkStep): ArrayStep["calc"] {
  const v = (p: number) => WALK[p] as number;
  switch (s.kind) {
    case "push":
      return { expr: "stack.length > 0", result: "거짓 · 넣는다" };
    case "stop":
      return {
        expr: `nums[${s.top}] < nums[${s.i}] → ${v(s.top as number)} < ${v(s.i)}`,
        result: "거짓 · 멈춘다",
      };
    case "pop":
      return {
        expr: `nums[${s.top}] < nums[${s.i}] → ${v(s.top as number)} < ${v(s.i)}`,
        result: "참 · 꺼낸다",
      };
    case "end":
      return null;
  }
}

/** 걸음 하나를 배열 무대의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
export function arrayStep(s: WalkStep): ArrayStep {
  const n = WALK.length;
  const topSlot = s.stack.length - 1;
  const readTop = s.kind === "stop" ? [topSlot - 1] : [];
  const wrote = s.kind === "stop" || s.kind === "push" ? [topSlot] : [];
  const reached = s.kind === "end" ? n - 1 : s.i;
  return {
    array: [...WALK],
    range: [0, reached],
    read:
      s.kind === "end"
        ? []
        : s.top === undefined
          ? [s.i]
          : [s.top, s.i].sort((a, b) => a - b),
    write: [],
    pointers:
      s.kind === "end"
        ? {}
        : s.top === undefined
          ? { i: s.i }
          : { top: s.top, i: s.i },
    calc: stepCalc(s),
    vars: `넣기 ${s.pushes} · 꺼내기 ${s.pops}`,
    layers: [
      resultLayer(s.result, s.pops, s.kind === "pop" ? [s.top as number] : []),
    ],
    strips: stackStrips(WALK, s.stack, { read: readTop, write: wrote }),
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자 그대로
 * 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `nextGreaterElement-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return WALK_STEPS.map((s) => ({
    title: `${s.id} ${stepTitle(s)}`,
    text: stepText(s),
    ...arrayStep(s),
  }));
}

const filmOf = (steps: readonly WalkStep[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: stepTitle(s),
    rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
  }));

/** 자리 `i` 까지 처리를 마친 뒤(넣기까지 끝난 뒤)의 걸음. */
export const afterRead = (i: number): WalkStep =>
  [...WALK_STEPS]
    .reverse()
    .find((s) => s.kind !== "end" && s.i === i) as WalkStep;

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

/** 과제 규모에서 차례로 읽는 방법의 최악 — 감소 수열에서 식 `2N + N(N−1)/2` 로 낸다. 식은 작은 N 에서 실측과 대조한다. */
export const naiveWorst = (n: number): number => 2 * n + (n * (n - 1)) / 2;
export const stackBest = (n: number): number => 5 * n - 2;
export const decreasing = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => n - i);

for (const n of [1_000, 2_000]) {
  if (scanRight(decreasing(n)).acc !== naiveWorst(n)) {
    throw new Error(`N = ${n} 감소 수열에서 차례로 읽기의 실측이 식과 다르다`);
  }
  if (count(decreasing(n)).acc !== stackBest(n)) {
    throw new Error(`N = ${n} 감소 수열에서 정본의 실측이 5N − 2 와 다르다`);
  }
}

export const seconds = (ops: number): string =>
  `${(ops / OPS_PER_SECOND).toFixed(2)} 초`;

function approaches(): Approach[] {
  const naive = naiveWorst(TASK_N);
  const one = bounded(BIG, 1, false);
  const least = leastKeep(BIG);
  const leastDeep = leastKeep(deepInput(BIG_N));
  const all = bounded(BIG, BIG_N, true);
  const naiveBig = scanRight(BIG);
  const stack = count(BIG);
  return [
    {
      name: "자리마다 오른쪽을 차례로 읽기",
      idea: "자리 i 의 오른쪽을 i + 1 부터 읽어 처음 더 큰 값에서 멈춘다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `N = ${num(TASK_N)} 감소 수열에서 칸 접근 ${num(naive)} 번 · ${seconds(naive)}`,
          ok: false,
        },
      ],
      lesson:
        "같은 값을 여러 자리가 따로 읽는다 — 답을 기다리는 자리를 남겨 두고 값 하나로 한꺼번에 끝낼 수 없을까",
    },
    {
      name: "기다리는 자리를 몇 개까지만 남기기",
      idea: "남길 자리 수에 상한을 두고, 넘치면 가장 오래된 자리를 버린다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `하나만 남기면 ${num(BIG_N)} 칸 중 ${num(one.wrong)} 자리가 틀린다`,
          ok: false,
        },
        {
          label: "상한",
          value: `틀린 자리가 0 이 되는 상한이 입력마다 ${least} · ${num(leastDeep)} 으로 갈린다`,
          ok: false,
        },
      ],
      lesson:
        "버린 자리는 답을 영영 못 받는다 — 기다리는 자리는 전부 남겨야 한다",
    },
    {
      name: "다 남기고 아래까지 비교하기",
      idea: "기다리는 자리를 전부 남기고, 지금 값을 그 자리 전부와 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `${num(BIG_N)} 칸에서 칸 접근 ${num(all.acc)} 번 · 차례로 읽기의 ${num(naiveBig.acc)} 번${all.acc > naiveBig.acc ? "보다 많다" : "과 같은 규모"}`,
          ok: false,
        },
      ],
      lesson:
        "꼭대기가 지금 값보다 작지 않으면 그 아래를 볼 필요가 없지 않을까",
    },
    {
      name: "다 남기고 꼭대기에서 멈추기",
      idea: "기다리는 자리를 스택에 두고, 꼭대기가 지금 값보다 작지 않으면 멈춘다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `${num(BIG_N)} 칸에서 칸 접근 ${num(stack.acc)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 자리 `i` 까지 읽은 뒤의 무대 줄 — 걸음 표지 없이 그 순간의 상태만 그린다. */
function momentStep(
  s: WalkStep,
  marks: { read?: number[]; answered?: number[] } = {},
): ArrayStep {
  return {
    array: [...WALK],
    range: [0, s.i],
    read: marks.read ?? [],
    write: [],
    layers: [resultLayer(s.result, s.pops, marks.answered ?? [])],
    strips: stackStrips(WALK, s.stack),
  };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-one-read": () => {
    const before = afterRead(2);
    const after = afterRead(3);
    const got = after.result
      .map((v, p) => ({ v, p }))
      .filter(({ v, p }) => v !== before.result[p])
      .map(({ p }) => p);
    const v3 = WALK[3] as number;
    const frames: StageFrame[] = [
      {
        id: "전",
        text: `자리 2 까지 읽은 뒤 — 답을 기다리는 자리 ${dots(before.stack)}`,
        rows: arrayStage(momentStep(before), ARRAY_OPTIONS),
      },
      {
        id: "후",
        text: `자리 3 의 ${v3}${을를(v3)} 읽은 뒤 — 자리 ${dots(got)}${이가(got.at(-1) ?? "")} 한꺼번에 답 ${v3}${을를(v3)} 받는다`,
        rows: arrayStage(
          momentStep(after, { read: [3], answered: got }),
          ARRAY_OPTIONS,
        ),
      },
    ];
    return (
      <CellStageFilm
        title={`값 ${v3} 하나를 읽는 순간 답 ${got.length} 개가 정해진다`}
        columns={WALK.length}
        frames={frames}
      />
    );
  },
  "concept-stack": () => {
    const frames: StageFrame[] = WALK.map((v, i) => {
      const s = afterRead(i);
      const popped = WALK_STEPS.filter(
        (t) => t.kind === "pop" && t.i === i,
      ).map((t) => t.top as number);
      return {
        id: `i=${i}`,
        text:
          popped.length === 0
            ? `값 ${v} 인 자리 ${i}${을를(i)} 넣었다 — 꺼낸 자리 없음`
            : `자리 ${dots(popped)}${을를(popped.at(-1) ?? "")} 꺼내고 값 ${v} 인 자리 ${i}${을를(i)} 넣었다`,
        rows: arrayStage(
          {
            ...momentStep(s),
            layers: [],
            strips: stackStrips(WALK, s.stack, {
              write: [s.stack.length - 1],
            }),
          },
          ARRAY_OPTIONS,
        ),
      };
    });
    return (
      <CellStageFilm
        title={`nums = ${show(WALK)} 를 읽을 때마다의 단조 스택`}
        columns={WALK.length}
        frames={frames}
      />
    );
  },
  "origin-scan": () => {
    const { scans } = scanRight(WALK);
    const frames: StageFrame[] = scans.map(({ read, stop }, i) => {
      const first = read[0];
      const last = read.at(-1);
      const text =
        read.length === 0
          ? `자리 ${i} — 오른쪽에 읽을 칸이 없다`
          : stop === -1
            ? `자리 ${i} — 자리 ${dots(read)}${을를(read.at(-1) ?? "")} 읽고 못 찾는다 · ${read.length} 칸`
            : `자리 ${i} — 자리 ${dots(read)}${을를(read.at(-1) ?? "")} 읽고 ${WALK[stop]} 에서 멈춘다 · ${read.length} 칸`;
      return {
        id: `i=${i}`,
        text,
        rows: arrayStage(
          {
            array: [...WALK],
            range:
              first === undefined || last === undefined ? null : [first, last],
            read: stop === -1 ? [] : [stop],
            write: [],
            pointers: stop === -1 ? { i } : { i, j: stop },
          },
          { arrayName: "nums", rangeLabel: "읽은 칸" },
        ),
      };
    });
    return (
      <CellStageFilm
        title="자리마다 오른쪽을 차례로 읽으면 — 같은 칸을 여러 자리가 다시 읽는다"
        columns={WALK.length}
        frames={frames}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`배열 길이 N ≤ ${num(TASK_N)} · 1 초(단순 연산 1 초에 1 억 번 기준) · 비용은 칸 접근 수`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-on-input": () => {
    const s = afterRead(2);
    const states: Partial<Record<number, CellState>> = {};
    WALK.forEach((_, p) => {
      if (p > s.i) states[p] = "empty";
      else if (!s.stack.includes(p)) states[p] = "out";
    });
    const strips = stackStrips(WALK, s.stack);
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      {
        kind: "cells",
        label: "nums",
        values: [...WALK],
        states,
        side: `읽은 자리 ${s.i + 1} 칸`,
      },
      ...strips.map(
        (t): StageRow => ({
          kind: "cells",
          label: t.label,
          values: Array.from(
            { length: STACK_SLOTS },
            (_, k) => t.values[k] ?? null,
          ),
          side: t.side,
        }),
      ),
    ];
    return (
      <CellStage
        title={`자리 ${s.i} 까지 읽은 뒤의 단조 스택 — 칸마다 nums 의 한 자리를 가리킨다`}
        columns={WALK.length}
        rows={rows}
      />
    );
  },
  "walk-film": () => (
    <CellStageFilm
      title={`nextGreaterElement(${show(WALK).replace(/ /g, ", ")}) — T1~T${WALK_STEPS.length}`}
      columns={arrayColumns(arrayStep(WALK_STEPS[0] as WalkStep))}
      frames={filmOf(WALK_STEPS)}
    />
  ),
  "related-intervals": () => {
    const ids = WALK_STEPS.map((s) => s.id);
    const rows: StageRow[] = [
      { kind: "index", label: "걸음", labels: ids },
      ...WALK.map((_, p): StageRow => {
        const from = WALK_STEPS.findIndex(
          (s) => (s.kind === "push" || s.kind === "stop") && s.i === p,
        );
        const out = WALK_STEPS.findIndex(
          (s) => s.kind === "pop" && s.top === p,
        );
        const to = out === -1 ? ids.length - 1 : out;
        return {
          kind: "bracket",
          label: `자리 ${p}`,
          from,
          to,
          tone: out === -1 ? "right" : "left",
          text: out === -1 ? `${ids[from]}~ 끝까지` : `${ids[from]}~${ids[to]}`,
        };
      }),
    ];
    return (
      <CellStage
        title="자리마다 답을 기다린 구간 — 포개지거나 떨어져 있고, 절반만 걸치는 짝이 없다"
        columns={ids.length}
        rows={rows}
      />
    );
  },
};
