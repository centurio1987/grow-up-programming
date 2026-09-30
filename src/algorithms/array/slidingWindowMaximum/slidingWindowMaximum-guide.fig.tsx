/**
 * `slidingWindowMaximum-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림과 증명 블록에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 정본이 **무엇을 어떤 차례로
 * 읽었는가**는 입력 배열을 `Proxy` 로 감싸 기록한다 — 정본 소스를 바꾸지 않으므로 `check-proof` 가 변이를
 * 중화한 실행에서도 기록이 그대로 나온다. 정본이 `nums` 를 읽는 자리는 셋이다 — 지금 값 `nums[i]`, 뒤 자리의
 * 값 `nums[back]`, 답을 적을 때 앞 자리의 값 `nums[front]`. 지금 값은 언제나 처음 읽는 칸이라 칸 번호로 갈리고,
 * 나머지 둘은 차례로 갈린다(뒤 자리와 비교하는 동안은 뒤, 넣은 뒤에는 앞). 그 기록을 재생해 단조 덱을 세우고,
 * 재생한 단조 덱의 뒤 · 앞이 정본이 읽은 칸과 다르거나 재생한 답이 정본의 답과 다르면 던진다.
 *
 * 앞에서 버리는 일(`cand[0] <= i - k`)은 `nums` 를 읽지 않아 기록에 직접 남지 않는다. 재생이 같은 규칙으로
 * 버리고, 그 뒤 정본이 읽은 앞 자리와 재생의 앞 자리가 같은지로 확인한다.
 *
 * 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `slidingWindowMaximum-guide.test.ts` 가 잰다.
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
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { slidingWindowMaximum } from "./slidingWindowMaximum-guide.ref.ts";

/* ───────────────────────── 고정 입력 ───────────────────────── */

/** 본문 전개가 쓰는 입력. `concept`·`deep.origin`·`deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다. */
export const WALK: readonly number[] = [1, 3, -1, -3, 5, 3, 6, 7];
export const WALK_K = 3;

/** 작은 입력으로는 계수가 안 갈리는 자리에서 쓰는 큰 입력. 난수를 쓰지 않는다 — `.alt.ts` 와 같은 식이다. */
export const BIG_N = 1024;
export const BIG: readonly number[] = Array.from(
  { length: BIG_N },
  (_, i) => (i * 2731) % 1201,
);
/** 같은 길이의 감소 수열 `nums[i] = N − i`. 단조 덱이 창 크기만큼 쌓이는 쪽이다. */
export const DOWN: readonly number[] = Array.from(
  { length: BIG_N },
  (_, i) => BIG_N - i,
);
/** 큰 입력에서 방법을 나란히 세는 창 크기. */
export const MID_K = 32;

/** 과제 규모 — 배열 길이 `N` 의 상한. */
export const TASK_N = 100_000;
/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
export const OPS_PER_SECOND = 100_000_000;

export const mixed = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => (i * 2731) % 1201);
export const decreasing = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => n - i);

export const num = (x: number): string => x.toLocaleString("en-US");
/** `[3 3 5 5 6 7]` 꼴 — 값 나열은 쉼표 없이 공백으로 적는다(L25). */
export const show = (xs: readonly (number | string)[]): string =>
  `[${xs.join(" ")}]`;
/** `1 · 2` 꼴의 자리 나열. */
export const dots = (xs: readonly number[]): string => xs.join(" · ");
/** `[1, 3, -1]` 꼴 — 코드 안의 배열 표기. */
export const code = (xs: readonly number[]): string => `[${xs.join(", ")}]`;
export const seconds = (ops: number): string =>
  `${(ops / OPS_PER_SECOND).toFixed(2)} 초`;

/** 오른쪽 끝이 `i` 인 창 — 창이 덜 찼으면 왼쪽 끝이 0 이다. */
export const windowOf = (i: number, k: number): [number, number] => [
  Math.max(0, i - k + 1),
  i,
];

/* ───────────────────────── 정본 실행 기록 ───────────────────────── */

/**
 * 정본이 한 일 하나. `cur` 는 지금 값을 읽은 것, `expire` 는 창 밖으로 나간 앞 자리를 버린 것, `cmp` 는 뒤
 * 자리의 값을 읽어 지금 값과 비교한 것(`pop` 이 참이면 뒤에서 버렸다), `push` 는 지금 자리를 넣은 것,
 * `answer` 는 앞 자리의 값을 읽어 답으로 적은 것이다.
 */
export type Event =
  | { readonly kind: "cur"; readonly i: number }
  | { readonly kind: "expire"; readonly i: number; readonly front: number }
  | {
      readonly kind: "cmp";
      readonly i: number;
      readonly back: number;
      readonly pop: boolean;
    }
  | { readonly kind: "push"; readonly i: number }
  | {
      readonly kind: "answer";
      readonly i: number;
      readonly front: number;
      readonly value: number;
    };

/**
 * 한 번의 실행을 센 값. 배열 접근은 `nums` 읽기 · 단조 덱 읽기와 쓰기 · 답 배열 쓰기를 각각 한 번으로 센다 —
 * 걸음마다 지금 값 읽기 1 · 앞 자리가 창 안인지 보기 1(단조 덱이 비면 없다) · 앞에서 버리기 1 · 뒤 자리와
 * 비교하기 2(뒤 자리 읽기와 그 값 읽기) · 뒤에서 버리기 1 · 넣기 1 · 답 적기 3(앞 자리 읽기 · 그 값 읽기 ·
 * 답 쓰기). 앞 · 뒤 어느 쪽에서 넣고 빼도 한 번이다(덱의 계약).
 */
export interface Counts {
  readonly n: number;
  readonly k: number;
  /** 뒤 자리와 비교한 횟수. `P + B` 다. */
  readonly cmp: number;
  /** 뒤에서 버린 횟수 `P`. */
  readonly pops: number;
  /** 앞에서 버린 횟수 `F`. */
  readonly expires: number;
  /** 뒤 자리가 남은 채로 멈춘 걸음의 수 `B`. */
  readonly stops: number;
  /** 앞 자리가 창 안인지 본 횟수 — 단조 덱이 비지 않은 걸음의 수. */
  readonly frontChecks: number;
  /** 단조 덱이 가장 길었을 때의 칸 수. */
  readonly peak: number;
  /** 순회가 끝났을 때 단조 덱에 남은 자리의 수. */
  readonly left: number;
  /** 앞에서 버릴 때 배열의 `shift` 가 실제로 옮긴 칸 수. 덱의 계약에는 안 들어간다. */
  readonly moved: number;
  /** 배열 접근 수(읽기 + 쓰기). */
  readonly acc: number;
  readonly result: number[];
}

/** 읽은 칸 번호를 차례로 알리는 감시 배열. */
function watched(
  nums: readonly number[],
  onRead: (p: number) => void,
): number[] {
  return new Proxy([...nums], {
    get(target, key, receiver) {
      if (typeof key === "string" && /^\d+$/.test(key)) onRead(Number(key));
      return Reflect.get(target, key, receiver);
    },
  });
}

/**
 * 정본의 읽기를 재생한다. `events` 가 있으면 한 일을 거기 쌓는다 — 작은 입력용이다. 큰 입력에는 `events`
 * 없이 불러 값만 센다(기록 사본이 걸음마다 쌓이면 메모리가 모자란다).
 */
function replay(nums: readonly number[], k: number, events?: Event[]): Counts {
  const dq: number[] = [];
  let next = 0;
  let i = -1;
  let phase: "idle" | "comparing" | "pushed" = "idle";
  let answered = false;
  let cmp = 0;
  let pops = 0;
  let expires = 0;
  let stops = 0;
  let frontChecks = 0;
  let pushes = 0;
  let peak = 0;
  let moved = 0;
  let reads = 0;
  const answers: number[] = [];
  const push = (): void => {
    dq.push(i);
    pushes++;
    if (dq.length > peak) peak = dq.length;
    events?.push({ kind: "push", i });
    phase = "pushed";
    answered = false;
  };
  const onRead = (p: number): void => {
    reads++;
    if (p === next) {
      if (phase === "comparing") {
        throw new Error(
          `자리 ${i} 를 넣기 전에 정본이 다음 자리 ${p} 를 읽었다`,
        );
      }
      if (phase === "pushed" && i >= k - 1 && !answered) {
        throw new Error(`자리 ${i} 에서 정본이 답을 적지 않았다`);
      }
      i = p;
      next++;
      events?.push({ kind: "cur", i });
      if (dq.length > 0) {
        frontChecks++;
        if ((dq[0] as number) <= i - k) {
          moved += dq.length - 1;
          const front = dq.shift() as number;
          expires++;
          events?.push({ kind: "expire", i, front });
        }
      }
      phase = "comparing";
      if (dq.length === 0) push();
      return;
    }
    if (phase === "comparing") {
      if (p !== dq.at(-1)) {
        throw new Error(
          `정본이 읽은 칸 ${p} 이 재생한 단조 덱의 뒤 ${dq.at(-1)} 와 다르다`,
        );
      }
      cmp++;
      const pop = (nums[p] as number) < (nums[i] as number);
      events?.push({ kind: "cmp", i, back: p, pop });
      if (pop) {
        dq.pop();
        pops++;
        if (dq.length === 0) push();
      } else {
        stops++;
        push();
      }
      return;
    }
    if (phase === "pushed" && i >= k - 1 && !answered && p === dq[0]) {
      answered = true;
      const value = nums[p] as number;
      answers.push(value);
      events?.push({ kind: "answer", i, front: p, value });
      return;
    }
    throw new Error(`정본이 읽은 칸 ${p} 을 재생이 설명하지 못한다`);
  };
  const result = slidingWindowMaximum(watched(nums, onRead), k);
  // `phase` 는 감시 배열의 콜백 안에서 바뀐다 — 타입 좁히기가 그것을 못 보므로 넓혀서 읽는다.
  const last = phase as "idle" | "comparing" | "pushed";
  if (last === "comparing" || (last === "pushed" && i >= k - 1 && !answered)) {
    throw new Error("정본이 마지막 자리를 끝내지 않았다");
  }
  const n = nums.length;
  if (next !== n || answers.join(",") !== result.join(",")) {
    throw new Error(
      `재생한 답 ${show(answers)} 이 정본의 답 ${show(result)} 과 다르다`,
    );
  }
  if (reads !== n + cmp + answers.length) {
    throw new Error("읽은 칸 수가 N + 비교 횟수 + 답의 수와 다르다");
  }
  return {
    n,
    k,
    cmp,
    pops,
    expires,
    stops,
    frontChecks,
    peak,
    left: dq.length,
    moved,
    acc:
      n + frontChecks + expires + 2 * cmp + pops + pushes + 3 * answers.length,
    result,
  };
}

/** 정본 한 번 호출의 기록 — 작은 입력용. */
export function run(
  nums: readonly number[],
  k: number,
): { result: number[]; events: Event[] } {
  const events: Event[] = [];
  const { result } = replay(nums, k, events);
  return { result, events };
}

/** 한 번의 실행을 세는 가벼운 판 — 값만 센다(기록을 남기지 않는다). */
export const count = (nums: readonly number[], k: number): Counts =>
  replay(nums, k);

/** 총식 `3N − 1 + F + 3P + 2B + 3(N − k + 1)` — 본문 「수식 정의와 유도」와 같은 식이다. */
export const formula = (c: Counts): number =>
  3 * c.n - 1 + c.expires + 3 * c.pops + 2 * c.stops + 3 * (c.n - c.k + 1);

/* ───────────────────────── 다른 방법 — 비교용 ───────────────────────── */

/** 창마다 최댓값 — 정의 그대로. */
export const windowMax = (xs: readonly number[], k: number): number[] =>
  Array.from({ length: xs.length - k + 1 }, (_, s) =>
    Math.max(...xs.slice(s, s + k)),
  );

/**
 * 창마다 `k` 칸을 처음부터 다시 읽는 방법. 본문 `deep.origin` 의 코드와 같은 절차이고, 배열 접근을 같은
 * 규칙으로 센다 — 창 하나에 `nums` 읽기 `k` 번과 답 쓰기 한 번. 답은 정본과 대조한다.
 */
export function rescanEvery(
  nums: readonly number[],
  k: number,
): { out: number[]; acc: number } {
  const n = nums.length;
  const out: number[] = [];
  let acc = 0;
  for (let s = 0; s + k <= n; s++) {
    acc++;
    let best = nums[s] as number;
    for (let j = s + 1; j < s + k; j++) {
      acc++;
      const v = nums[j] as number;
      if (v > best) best = v;
    }
    acc++;
    out.push(best);
  }
  if (n <= 20_000 && out.join(",") !== count(nums, k).result.join(",")) {
    throw new Error("창마다 다시 읽는 방법의 답이 정본과 다르다");
  }
  return { out, acc };
}

/** 창마다 다시 읽기의 배열 접근 — 입력과 무관하게 `(k + 1)(N − k + 1)` 이다. 작은 N 에서 실측과 대조한다. */
export const rescanFormula = (n: number, k: number): number =>
  (k + 1) * (n - k + 1);

/**
 * 최댓값 **하나와 그 자리만** 기억하는 방법. 그 자리가 창을 벗어나면 창 전체를 다시 읽는다. 답은 맞는다 —
 * 갈리는 것은 다시 읽은 걸음의 수뿐이다. 배열 접근은 `nums` 읽기와 답 쓰기를 센다.
 */
export function keepOneOnly(
  nums: readonly number[],
  k: number,
): { out: number[]; acc: number; rescans: number } {
  const n = nums.length;
  const out: number[] = [];
  let acc = 0;
  let rescans = 0;
  let best = Number.NEGATIVE_INFINITY;
  let at = -1;
  for (let i = 0; i < n; i++) {
    acc++;
    const v = nums[i] as number;
    if (at <= i - k) {
      rescans++;
      best = Number.NEGATIVE_INFINITY;
      at = -1;
      for (let j = Math.max(0, i - k + 1); j <= i; j++) {
        acc++;
        const w = nums[j] as number;
        if (w > best) {
          best = w;
          at = j;
        }
      }
    } else if (v >= best) {
      best = v;
      at = i;
    }
    if (i >= k - 1) {
      acc++;
      out.push(best);
    }
  }
  if (out.join(",") !== count(nums, k).result.join(",")) {
    throw new Error("최댓값 하나만 기억하는 방법의 답이 정본과 다르다");
  }
  return { out, acc, rescans };
}

/**
 * 뒤에서만 버리는 단조 스택 — 정본에서 앞에서 버리는 줄만 뺀 절차다. 답은 바닥(맨 앞)의 값이다. 배열 접근은
 * 정본과 같은 규칙으로 센다(앞 자리를 보는 몫이 없다). 틀린 창의 수는 정본의 답과 맞대어 센다.
 */
export function stackOnly(
  nums: readonly number[],
  k: number,
): { out: number[]; acc: number; wrong: number; stack: number[][] } {
  const n = nums.length;
  const out: number[] = [];
  const st: number[] = [];
  const keep = n <= 64;
  const stack: number[][] = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc++;
    const cur = nums[i] as number;
    while (st.length > 0) {
      acc += 2;
      if ((nums[st.at(-1) as number] as number) >= cur) break;
      acc++;
      st.pop();
    }
    acc++;
    st.push(i);
    if (keep) stack.push([...st]);
    if (i >= k - 1) {
      acc += 3;
      out.push(nums[st[0] as number] as number);
    }
  }
  const want = count(nums, k).result;
  const wrong = out.filter((v, s) => v !== want[s]).length;
  return { out, acc, wrong, stack };
}

/* ───────────── 걸음 — 필름 · 걸음 재생 패널 · 증명 표가 같은 기록을 쓴다 ───────────── */

export interface WalkStep {
  readonly id: string;
  /**
   * `expire` 창 밖으로 나간 앞 자리를 버림 · `pop` 뒤 자리를 버림 · `push` 단조 덱이 비어 바로 넣음 ·
   * `stop` 뒤 자리가 지금 값보다 작지 않아 멈추고 넣음. 넣는 걸음은 창이 다 찼으면 답까지 적는다.
   */
  readonly kind: "expire" | "pop" | "push" | "stop";
  readonly i: number;
  /** `expire` 가 버린 앞 자리. */
  readonly front?: number;
  /** `pop` · `stop` 이 비교한 뒤 자리. */
  readonly back?: number;
  /** 넣는 걸음이 적은 답 — 앞 자리와 그 값. 창이 덜 찼으면 없다. */
  readonly answer?: { readonly front: number; readonly value: number };
  /** 이 걸음이 끝난 뒤의 단조 덱(앞 → 뒤)과 답 배열(아직 안 적은 칸은 `null`). */
  readonly dq: readonly number[];
  readonly result: readonly (number | null)[];
  readonly pushes: number;
  readonly pops: number;
  readonly expires: number;
  /** 같은 `i` 에서 이 걸음 앞에 뒤에서 버린 것이 있었는가. */
  readonly afterPops: boolean;
}

export function walkOf(nums: readonly number[], k: number): WalkStep[] {
  const { events } = run(nums, k);
  const steps: WalkStep[] = [];
  const dq: number[] = [];
  const result: (number | null)[] = new Array(nums.length - k + 1).fill(null);
  let pushes = 0;
  let pops = 0;
  let expires = 0;
  let stopBack: number | null = null;
  let poppedHere = false;
  const add = (
    s: Omit<
      WalkStep,
      "id" | "dq" | "result" | "pushes" | "pops" | "expires" | "afterPops"
    >,
    after = poppedHere,
  ): void => {
    steps.push({
      id: `T${steps.length + 1}`,
      ...s,
      dq: [...dq],
      result: [...result],
      pushes,
      pops,
      expires,
      afterPops: after,
    });
  };
  for (const [n, e] of events.entries()) {
    if (e.kind === "cur") {
      poppedHere = false;
      stopBack = null;
      continue;
    }
    if (e.kind === "expire") {
      dq.shift();
      expires++;
      add({ kind: "expire", i: e.i, front: e.front });
      continue;
    }
    if (e.kind === "cmp") {
      if (e.pop) {
        dq.pop();
        pops++;
        add({ kind: "pop", i: e.i, back: e.back });
        poppedHere = true;
      } else stopBack = e.back;
      continue;
    }
    if (e.kind === "answer") continue;
    dq.push(e.i);
    pushes++;
    const ans = events[n + 1];
    const answer =
      ans?.kind === "answer"
        ? { front: ans.front, value: ans.value }
        : undefined;
    if (answer) result[e.i - k + 1] = answer.value;
    if (stopBack !== null) {
      add({
        kind: "stop",
        i: e.i,
        back: stopBack,
        ...(answer ? { answer } : {}),
      });
    } else {
      add({ kind: "push", i: e.i, ...(answer ? { answer } : {}) });
    }
  }
  return steps;
}

/** 전개 입력의 걸음 — 본문 · 필름 · 패널이 같은 번호를 쓴다. */
export const WALK_STEPS: readonly WalkStep[] = walkOf(WALK, WALK_K);

/** 단조 덱 띠의 칸 수 — 전개에서 단조 덱이 가장 길었을 때(스택 띠와 같은 약속). */
export const DQ_SLOTS = Math.max(...WALK_STEPS.map((s) => s.dq.length));

/** 자리 `i` 의 처리를 마친 뒤(넣기와 답 적기까지 끝난 뒤)의 걸음. */
export const afterRead = (i: number): WalkStep =>
  [...WALK_STEPS]
    .reverse()
    .find(
      (s) => (s.kind === "push" || s.kind === "stop") && s.i === i,
    ) as WalkStep;

const pad = <T,>(xs: readonly T[], slots: number): (T | null)[] =>
  Array.from({ length: slots }, (_, p) => xs[p] ?? null);

/**
 * 단조 덱 띠 두 줄 — 자리 번호 줄(`cand`)과 그 자리의 값 줄. 스택 띠(`nextGreaterElement`)와 같은 약속으로
 * 그린다 — 칸 수를 전개에서 가장 길었을 때로 고정하고, 넣은 칸은 새로 씀, 비교한 칸은 읽음이다. 스택의 바닥
 * 자리에 **앞**이 오고(왼쪽 끝), 꼭대기 자리에 **뒤**가 온다(오른쪽 끝). 곁말이 앞과 뒤를 이름으로 적는다.
 */
export function dequeLayers(
  nums: readonly number[],
  dq: readonly number[],
  marks: { read?: number[]; write?: number[] } = {},
  slots = DQ_SLOTS,
): ArrayLayer[] {
  const values = dq.map((p) => nums[p] as number);
  return [
    {
      name: "cand",
      values: pad(dq, slots),
      read: marks.read ?? [],
      write: marks.write ?? [],
      caret: false,
      side:
        dq.length === 0
          ? "비었다"
          : `앞 = 자리 ${dq[0]} · 뒤 = 자리 ${dq.at(-1)}`,
    },
    {
      name: "cand 의 값",
      values: pad(values, slots),
      read: marks.read ?? [],
      write: marks.write ?? [],
      caret: false,
      side: values.length === 0 ? "비었다" : values.join(" ≥ "),
    },
  ];
}

/** 답 배열 줄 — 칸 `j` 가 왼쪽 끝이 `j` 인 창의 답이라, 그 창의 왼쪽 끝 칸 아래에 선다. */
export function resultLayer(
  result: readonly (number | null)[],
  write: number[] = [],
): ArrayLayer {
  return { name: "result", values: [...result], write, caret: false };
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. 쥔 구간은 창이다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "nums",
  rangeLabel: "창",
};

const v = (p: number): number => WALK[p] as number;

function answerText(s: WalkStep): string {
  if (!s.answer) return " 창이 아직 덜 차서 답은 적지 않습니다.";
  const [a, b] = windowOf(s.i, WALK_K);
  return ` 창 [${a},${b}] 의 칸이 다 찼으니 앞 자리 ${s.answer.front} 의 값 ${s.answer.value}${을를(s.answer.value)} 답으로 적습니다.`;
}

function stepTitle(s: WalkStep): string {
  switch (s.kind) {
    case "expire":
      return `자리 ${s.front}${이가(s.front as number)} 창 밖 · 앞에서 버리기`;
    case "pop":
      return `${v(s.back as number)} < ${v(s.i)} · 뒤 자리 ${s.back} 버리기`;
    case "stop":
      return `${v(s.back as number)} ≥ ${v(s.i)} · 멈추고 자리 ${s.i} 넣기${s.answer ? ` · 답 ${s.answer.value}` : ""}`;
    case "push":
      return `자리 ${s.i} 넣기${s.answer ? ` · 답 ${s.answer.value}` : ""}`;
  }
}

function stepText(s: WalkStep): string {
  switch (s.kind) {
    case "expire": {
      const [a] = windowOf(s.i, WALK_K);
      return `자리 ${s.i}${을를(s.i)} 오른쪽 끝으로 하는 창의 왼쪽 끝은 ${a} 입니다. 앞 자리 ${s.front}${은는(s.front as number)} 창 밖이라 앞에서 버립니다.`;
    }
    case "pop": {
      const t = s.back as number;
      return `뒤 자리 ${t} 의 값 ${v(t)}${이가(v(t))} 지금 값 ${v(s.i)} 보다 작아 뒤에서 버립니다.`;
    }
    case "stop": {
      const t = s.back as number;
      return `뒤 자리 ${t} 의 값 ${v(t)}${은는(v(t))} 지금 값 ${v(s.i)} 보다 작지 않아 멈추고, 자리 ${s.i}${을를(s.i)} 뒤에 넣습니다.${answerText(s)}`;
    }
    case "push":
      return s.afterPops
        ? `버릴 뒤 자리가 더 없어 단조 덱이 비었습니다. 자리 ${s.i}${을를(s.i)} 넣습니다.${answerText(s)}`
        : `단조 덱이 비어 비교할 뒤 자리가 없습니다. 자리 ${s.i}${을를(s.i)} 넣습니다.${answerText(s)}`;
  }
}

function stepCalc(s: WalkStep): ArrayStep["calc"] {
  switch (s.kind) {
    case "expire":
      return {
        expr: `cand[0] <= i - k → ${s.front} <= ${s.i - WALK_K}`,
        result: "참 · 앞에서 버린다",
      };
    case "pop":
      return {
        expr: `nums[${s.back}] < nums[${s.i}] → ${v(s.back as number)} < ${v(s.i)}`,
        result: "참 · 뒤에서 버린다",
      };
    case "stop":
      return {
        expr: `nums[${s.back}] < nums[${s.i}] → ${v(s.back as number)} < ${v(s.i)}`,
        result: "거짓 · 멈춘다",
      };
    case "push":
      return { expr: "cand.length > 0", result: "거짓 · 넣는다" };
  }
}

/** 걸음 하나를 배열 무대의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
export function arrayStep(s: WalkStep): ArrayStep {
  const last = s.dq.length - 1;
  const read = new Set<number>();
  const pointers: Record<string, number> = {};
  if (s.kind === "expire") {
    read.add(s.front as number);
    pointers.front = s.front as number;
  } else {
    read.add(s.i);
    if (s.back !== undefined) {
      read.add(s.back);
      pointers.back = s.back;
    }
    if (s.answer) {
      read.add(s.answer.front);
      pointers.front = s.answer.front;
    }
  }
  pointers.i = s.i;
  const pushed = s.kind === "push" || s.kind === "stop";
  return {
    array: [...WALK],
    range: windowOf(s.i, WALK_K),
    read: [...read].sort((a, b) => a - b),
    write: [],
    pointers,
    calc: stepCalc(s),
    vars: `넣기 ${s.pushes} · 뒤에서 버림 ${s.pops} · 앞에서 버림 ${s.expires}`,
    layers: [
      resultLayer(s.result, s.answer ? [s.i - WALK_K + 1] : []),
      ...dequeLayers(WALK, s.dq, {
        read: s.kind === "stop" ? [last - 1] : [],
        write: pushed ? [last] : [],
      }),
    ],
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자 그대로
 * 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `slidingWindowMaximum-guide.test.ts` 가 잰다.
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

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

/** 과제 규모에서 창마다 다시 읽기를 잴 창 크기 — `N` 의 10 분의 1. */
export const TASK_K = TASK_N / 10;

for (const [n, k] of [
  [1_000, 100],
  [2_000, 500],
] as const) {
  if (rescanEvery(mixed(n), k).acc !== rescanFormula(n, k)) {
    throw new Error(`N = ${n} · k = ${k} 에서 다시 읽기의 실측이 식과 다르다`);
  }
}

function approaches(): Approach[] {
  const naive = rescanFormula(TASK_N, TASK_K);
  const one = keepOneOnly(DOWN, MID_K);
  const reOne = rescanEvery(DOWN, MID_K);
  const st = stackOnly(BIG, MID_K);
  const dq = count(BIG, MID_K);
  return [
    {
      name: "창마다 k 칸을 다시 읽기",
      idea: "창 하나마다 그 안의 k 칸을 처음부터 읽어 가장 큰 값을 찾는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `N = ${num(TASK_N)} · k = ${num(TASK_K)} 에서 배열 접근 ${num(naive)} 번 · ${seconds(naive)}`,
          ok: false,
        },
      ],
      lesson:
        "이웃한 두 창은 k − 1 칸을 함께 쓴다 — 창이 옮겨 갈 때 바뀐 것만 반영할 수 없을까",
    },
    {
      name: "최댓값 하나와 그 자리만 기억하기",
      idea: "들어온 값이 더 크면 바꾸고, 기억한 자리가 창을 벗어나면 창을 다시 읽는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `감소 수열 ${num(BIG_N)} 칸 · k = ${MID_K} 에서 배열 접근 ${num(one.acc)} 번 · 다시 읽기의 ${num(reOne.acc)} 번보다 많다`,
          ok: false,
        },
      ],
      lesson:
        "기억한 답이 창을 벗어날 때 다음 답을 이미 알고 있어야 한다 — 답이 될 수 있는 자리를 모두 남기면 어떨까",
    },
    {
      name: "뒤에서만 버리는 단조 스택",
      idea: "지금 값보다 작은 자리를 뒤에서 버리고, 맨 앞(바닥)의 값을 답으로 적는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `${num(BIG_N)} 칸 · k = ${MID_K} 에서 창 ${num(BIG_N - MID_K + 1)} 개 중 ${num(st.wrong)} 개가 틀린다`,
          ok: false,
        },
        {
          label: "까닭",
          value: "창 밖으로 나간 자리가 맨 앞에 남아 지난 창의 최댓값을 낸다",
          ok: false,
        },
      ],
      lesson: "창 밖으로 나간 자리를 맨 앞에서도 빼야 한다",
    },
    {
      name: "앞에서도 빼는 단조 덱",
      idea: "뒤에서 작은 자리를 버리고, 창 밖으로 나간 자리를 앞에서 버린다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `${num(BIG_N)} 칸 · k = ${MID_K} 에서 배열 접근 ${num(dq.acc)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 자리 `i` 까지 처리한 뒤의 무대 — 걸음 표지 없이 그 순간의 상태만 그린다. */
function momentStep(s: WalkStep, withResult: boolean): ArrayStep {
  return {
    array: [...WALK],
    range: windowOf(s.i, WALK_K),
    read: s.answer ? [s.answer.front] : [],
    write: [],
    layers: [
      ...(withResult
        ? [resultLayer(s.result, s.answer ? [s.i - WALK_K + 1] : [])]
        : []),
      ...dequeLayers(WALK, s.dq, { write: [s.dq.length - 1] }),
    ],
  };
}

/** 창 하나의 최댓값 자리 — 같은 값이 둘이면 오른쪽 자리. */
const argmaxIn = (xs: readonly number[], a: number, b: number): number => {
  let at = a;
  for (let p = a; p <= b; p++)
    if ((xs[p] as number) >= (xs[at] as number)) at = p;
  return at;
};

export const FIGS: Record<string, () => ReactElement> = {
  "concept-windows": () => {
    const answers = windowMax(WALK, WALK_K);
    const frames: StageFrame[] = answers.map((m, s) => {
      const b = s + WALK_K - 1;
      return {
        id: `창 ${s + 1}`,
        text: `창 [${s},${b}] — 최댓값 ${m}`,
        rows: arrayStage(
          {
            array: [...WALK],
            range: [s, b],
            read: [argmaxIn(WALK, s, b)],
            write: [],
          },
          ARRAY_OPTIONS,
        ),
      };
    });
    return (
      <CellStageFilm
        title={`nums = ${show(WALK)} · k = ${WALK_K} — 창 ${answers.length} 개의 최댓값`}
        columns={WALK.length}
        frames={frames}
      />
    );
  },
  "concept-deque": () => {
    const frames: StageFrame[] = WALK.map((x, i) => {
      const s = afterRead(i);
      const here = WALK_STEPS.filter((t) => t.i === i);
      const fronts = here
        .filter((t) => t.kind === "expire")
        .map((t) => t.front as number);
      const backs = here
        .filter((t) => t.kind === "pop")
        .map((t) => t.back as number);
      const parts: string[] = [];
      if (fronts.length > 0) parts.push(`앞에서 자리 ${dots(fronts)}`);
      if (backs.length > 0) parts.push(`뒤에서 자리 ${dots(backs)}`);
      const dropped =
        parts.length === 0 ? "버린 자리 없음" : `${parts.join(" · ")} 버림`;
      const ans = s.answer ? ` · 답 ${s.answer.value}` : " · 창이 덜 찼다";
      return {
        id: `i=${i}`,
        text: `값 ${x} 인 자리 ${i} 넣음 — ${dropped}${ans}`,
        rows: arrayStage(momentStep(s, true), ARRAY_OPTIONS),
      };
    });
    return (
      <CellStageFilm
        title={`nums = ${show(WALK)} · k = ${WALK_K} 를 읽을 때마다의 단조 덱`}
        columns={WALK.length}
        frames={frames}
      />
    );
  },
  "origin-rescan": () => {
    const answers = windowMax(WALK, WALK_K);
    const frames: StageFrame[] = answers.map((m, s) => {
      const b = s + WALK_K - 1;
      const cells = Array.from({ length: WALK_K }, (_, j) => s + j);
      return {
        id: `창 ${s + 1}`,
        text: `창 [${s},${b}] — 자리 ${dots(cells)}${을를(b)} 읽어 최댓값 ${m}`,
        rows: arrayStage(
          { array: [...WALK], range: [s, b], read: cells, write: [] },
          { arrayName: "nums", rangeLabel: "읽은 칸" },
        ),
      };
    });
    return (
      <CellStageFilm
        title="창마다 k 칸을 다시 읽으면 — 이웃한 창이 함께 쓰는 칸을 창마다 다시 읽는다"
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
        constraint={`배열 길이 N ≤ ${num(TASK_N)} · 창 크기 k ≤ N · 1 초(단순 연산 1 초에 1 억 번 기준) · 비용은 배열 접근 수`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-on-input": () => {
    const s = afterRead(5);
    const [a, b] = windowOf(s.i, WALK_K);
    const states: Partial<Record<number, CellState>> = {};
    WALK.forEach((_, p) => {
      if (p > s.i) states[p] = "empty";
      else if (!s.dq.includes(p)) states[p] = "out";
    });
    const layers = dequeLayers(WALK, s.dq);
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      {
        kind: "cells",
        label: "nums",
        values: [...WALK],
        states,
        side: `읽은 자리 ${s.i + 1} 칸`,
      },
      {
        kind: "bracket",
        label: "창",
        from: a,
        to: b,
        tone: "query",
        text: `[${a},${b}]`,
      },
      ...layers.map(
        (l): StageRow => ({
          kind: "cells",
          label: l.name,
          values: l.values,
          side: l.side,
        }),
      ),
    ];
    return (
      <CellStage
        title={`자리 ${s.i} 까지 읽은 뒤의 단조 덱 — 칸마다 창 안의 한 자리를 가리킨다`}
        columns={WALK.length}
        rows={rows}
      />
    );
  },
  "walk-film": () => (
    <CellStageFilm
      title={`slidingWindowMaximum(${code(WALK)}, ${WALK_K}) — T1~T${WALK_STEPS.length}`}
      columns={arrayColumns(arrayStep(WALK_STEPS[0] as WalkStep))}
      frames={filmOf(WALK_STEPS)}
    />
  ),
};
