/**
 * `longestSubarrayAtMostSum-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 바깥 반복 한 바퀴가 끝난 시점의
 * `r`·`l`·`windowSum`·`best` 는 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록하고, 답은 정본이
 * 낸다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과
 * 같은지는 `longestSubarrayAtMostSum-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import {
  CellStageFilm,
  type StageFrame,
} from "../../../_viz/patterns/CellStage";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { longestSubarrayAtMostSum } from "./longestSubarrayAtMostSum-guide.ref.ts";

const REF = new URL("./longestSubarrayAtMostSum-guide.ref.ts", import.meta.url)
  .pathname;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 바깥 반복 한 바퀴 — 오른쪽 끝 `r` 을 넓히고, 줄이고, 길이를 잰 뒤의 상태. */
export interface Round {
  readonly r: number;
  /** 이번에 더한 값 `nums[r]`. */
  readonly added: number;
  /** 더한 직후, 줄이기 전의 창의 합. */
  readonly before: number;
  /** 이번 바퀴에 창에서 뺀 칸의 인덱스(뺀 순서대로). */
  readonly removed: readonly number[];
  /** 줄인 뒤의 왼쪽 끝과 창의 합. */
  readonly l: number;
  readonly windowSum: number;
  /** 이 바퀴가 끝난 시점의 답 후보. */
  readonly best: number;
}

export interface Trace {
  readonly rounds: readonly Round[];
  readonly result: number;
}

/**
 * 길이를 답 후보로 삼는 한 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에
 * 정확히 맞지 않으면 `loadMutant` 가 던진다. 반복의 상태를 손으로 다시 계산하면 「이 코드가 그렇게
 * 움직인다」가 검사되지 않는다.
 */
const probed = await loadMutant<{
  longestSubarrayAtMostSum(nums: number[], S: number): number;
}>(REF, {
  swap: [
    /^(\s*)best = Math\.max\(best, r - l \+ 1\);$/,
    "$1best = Math.max(best, r - l + 1);\n$1(globalThis as any).__rounds.push({ r, l, windowSum, best });",
  ],
});

/** 정본 한 번 호출의 반복 기록. 답은 정본과 대조하고, 바퀴 사이의 합 변화도 대조한다. */
export function trace(nums: readonly number[], S: number): Trace {
  const g = globalThis as unknown as {
    __rounds: { r: number; l: number; windowSum: number; best: number }[];
  };
  g.__rounds = [];
  const result = probed.longestSubarrayAtMostSum([...nums], S);
  const want = longestSubarrayAtMostSum([...nums], S);
  if (result !== want) {
    throw new Error(
      `계측 사본이 정본과 다른 답을 냈다 — [${nums.join(" ")}] S ${S}: ${result} ≠ ${want}`,
    );
  }
  const rounds: Round[] = [];
  let prevL = 0;
  let prevSum = 0;
  for (const { r, l, windowSum, best } of g.__rounds) {
    const added = nums[r] as number;
    const removed = range(prevL, l - 1);
    const before = prevSum + added;
    // 줄인 뒤의 합은 더한 직후의 합에서 뺀 칸의 값을 뺀 것이어야 한다. 아니면 기록을 잘못 읽은 것이다.
    const after = removed.reduce((s, i) => s - (nums[i] as number), before);
    if (after !== windowSum) {
      throw new Error(`r = ${r} 에서 창의 합 ${windowSum} 이 기록과 다르다`);
    }
    rounds.push({ r, added, before, removed, l, windowSum, best });
    prevL = l;
    prevSum = windowSum;
  }
  if (rounds.length !== nums.length) {
    throw new Error("바깥 반복의 바퀴 수가 배열 길이와 다르다");
  }
  if ((rounds.at(-1)?.best ?? 0) !== result) {
    throw new Error("마지막 best 가 반환값과 다르다");
  }
  return { rounds, result };
}

/**
 * 정의 그대로 — 오른쪽 끝을 `r` 로 고정했을 때 합이 `S` 이하가 되는 가장 왼쪽 자리 `lo(r)`.
 * `l = r + 1`(빈 구간)은 합이 0 이라 언제나 후보다.
 */
export function loByDefinition(
  nums: readonly number[],
  S: number,
  r: number,
): number {
  for (let l = 0; l <= r + 1; l++) {
    let sum = 0;
    for (let k = l; k <= r; k++) sum += nums[k] as number;
    if (sum <= S) return l;
  }
  return r + 1;
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK: readonly number[] = [1, 2, 1, 0, 1, 1, 0];
export const WALK_S = 4;

export const range = (lo: number, hi: number): number[] =>
  Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);
const num = (x: number): string => x.toLocaleString("en-US");
export const sumOf = (nums: readonly number[], l: number, r: number): number =>
  range(l, r).reduce((s, i) => s + (nums[i] as number), 0);

/** 바퀴 하나가 지난 갈래 — 뺀 칸이 있으면 ① 뒤 ②, 없으면 ② 만. */
export const branchesOf = (r: Round): string =>
  r.removed.length > 0 ? "① 뒤 ②" : "②";

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** 이 걸음이 끝난 뒤의 창. 비었으면 `null`. */
  readonly window: readonly [number, number] | null;
  readonly l: number;
  readonly r?: number;
  /** 이번 걸음에 읽은 칸 — 뺀 칸과 더한 칸. */
  readonly read: readonly number[];
  readonly calc: { readonly expr: string; readonly result: string } | null;
  readonly best: number;
}

/** 전개의 걸음 — 루프 진입 전 한 걸음 + 바퀴마다 한 걸음. */
export function walkSteps(
  nums: readonly number[] = WALK,
  S: number = WALK_S,
): Step[] {
  const t = trace(nums, S);
  const steps: Step[] = [
    {
      id: "T1",
      title: "창 없음",
      detail:
        "루프에 들어가기 전입니다. 창이 비어 있고 windowSum = 0, best = 0 입니다.",
      window: null,
      l: 0,
      read: [],
      calc: null,
      best: 0,
    },
  ];
  let prevSum = 0;
  for (const [i, r] of t.rounds.entries()) {
    const cut = r.removed.map((k) => `nums[${k}] = ${nums[k]}`).join(", ");
    const verdict =
      r.removed.length > 0
        ? `${r.before} > ${S}${이가(S)} 참이라 ① ${cut}${을를(String(nums[r.removed.at(-1) as number]))} 빼고 l = ${r.l}${으로(r.l)} 옮깁니다.`
        : `${r.before} > ${S}${이가(S)} 거짓이라 줄이지 않습니다.`;
    const len = r.r - r.l + 1;
    steps.push({
      id: `T${i + 2}`,
      title: `r = ${r.r} · ${branchesOf(r)}`,
      detail: `nums[${r.r}] = ${r.added}${을를(String(r.added))} 더해 창의 합이 ${r.before} 입니다. ${verdict} 창의 길이 ${len}, best = ${r.best} 입니다.`,
      window: r.l <= r.r ? [r.l, r.r] : null,
      l: r.l,
      r: r.r,
      read: [...r.removed, r.r],
      calc: {
        expr: [
          `${prevSum} + ${r.added}`,
          ...r.removed.map((k) => `− ${nums[k]}`),
        ].join(" "),
        result: String(r.windowSum),
      },
      best: r.best,
    });
    prevSum = r.windowSum;
  }
  return steps;
}

/** 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
function arrayStep(s: Step, nums: readonly number[] = WALK): ArrayStep {
  return {
    array: [...nums],
    range: s.window === null ? null : [s.window[0], s.window[1]],
    read: [...s.read],
    write: [],
    pointers: s.r === undefined ? { l: s.l } : { l: s.l, r: s.r },
    calc: s.calc === null ? null : { ...s.calc },
    vars: `best = ${s.best}`,
  };
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "nums",
  rangeLabel: "창",
};

const film = (steps: Step[], nums: readonly number[] = WALK): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: `${s.title}${s.calc === null ? "" : ` — 창의 합 ${s.calc.expr} = ${s.calc.result}`} · best = ${s.best}`,
    rows: arrayStage(arrayStep(s, nums), ARRAY_OPTIONS),
  }));

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `longestSubarrayAtMostSum-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    slide: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...arrayStep(s),
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

/** 과제 규모 — 배열 길이 상한. */
export const N_MAX = 100_000;
/** 단순 연산 1 초에 1 억 번 기준. */
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toLocaleString("en-US", { maximumSignificantDigits: 2 })} 초`;

/**
 * 가장 단순한 방법 — 시작점 `l` 마다 오른쪽 끝을 처음부터 다시 더한다. 비음의 정수라 합이 상한을
 * 넘은 뒤로는 더 늘려도 줄지 않으므로 그 자리에서 멈춘다. 세는 것은 **창의 합을 고치는 연산 수**다.
 */
export function restartEachStart(
  nums: readonly number[],
  S: number,
): {
  best: number;
  ops: number;
  perStart: { adds: number[]; over: boolean }[];
} {
  let best = 0;
  let ops = 0;
  const perStart: { adds: number[]; over: boolean }[] = [];
  for (let l = 0; l < nums.length; l++) {
    let sum = 0;
    const adds: number[] = [];
    let over = false;
    for (let r = l; r < nums.length; r++) {
      sum += nums[r] as number;
      ops++;
      adds.push(sum);
      if (sum > S) {
        over = true;
        break;
      }
      best = Math.max(best, r - l + 1);
    }
    perStart.push({ adds, over });
  }
  const want = longestSubarrayAtMostSum([...nums], S);
  if (best !== want) {
    throw new Error(
      `시작점마다 다시 더한 답 ${best} 이 정본 ${want} 과 다르다`,
    );
  }
  return { best, ops, perStart };
}

/**
 * 왼쪽 끝을 `K` 칸까지 되돌려 보는 절차. `K = 0` 이면 되돌리지 않고, 그것이 정본과 같은 절차다
 * (연산 수를 정본 계측과 대조한다). 세는 것은 창의 합을 고치는 연산 수(덧셈 + 뺄셈)다.
 */
export function rewindBy(
  nums: readonly number[],
  S: number,
  K: number,
): { best: number; ops: number } {
  let best = 0;
  let sum = 0;
  let l = 0;
  let ops = 0;
  for (let r = 0; r < nums.length; r++) {
    const back = Math.min(K, l);
    for (let t = 0; t < back; t++) {
      l--;
      sum += nums[l] as number;
      ops++;
    }
    sum += nums[r] as number;
    ops++;
    while (sum > S) {
      sum -= nums[l] as number;
      l++;
      ops++;
    }
    best = Math.max(best, r - l + 1);
  }
  const want = longestSubarrayAtMostSum([...nums], S);
  if (best !== want) {
    throw new Error(`되돌림 폭 ${K} 의 답 ${best} 이 정본 ${want} 과 다르다`);
  }
  return { best, ops };
}

/** 정본이 실제로 한 덧셈·뺄셈 수 — 계측 기록에서 센다. */
export function refOps(nums: readonly number[], S: number): number {
  const t = trace(nums, S);
  return t.rounds.reduce((n, r) => n + 1 + r.removed.length, 0);
}

export const zeros = (n: number): number[] => new Array<number>(n).fill(0);
export const ones = (n: number): number[] => new Array<number>(n).fill(1);

/**
 * 시작점마다 다시 더하는 방법의 최악 — 모든 원소가 0 이고 `S = 0` 이면 한 번도 멈추지 않아 쌍이
 * 전부 나온다. 실제로 세는 규모와, 세지 않고 닫힌 형태 `n(n+1)/2` 로만 내는 규모를 가른다.
 */
export const MEASURED_N = [1_000, 10_000] as const;
export function naiveWorst(n: number): { ops: number; measured: boolean } {
  const closed = (n * (n + 1)) / 2;
  if (!(MEASURED_N as readonly number[]).includes(n)) {
    return { ops: closed, measured: false };
  }
  const { ops } = restartEachStart(zeros(n), 0);
  if (ops !== closed) {
    throw new Error(
      `n = ${n} 에서 실측 ${ops} 이 n(n+1)/2 = ${closed} 과 다르다`,
    );
  }
  return { ops, measured: true };
}

/** 슬라이딩 윈도의 최악 — 모든 원소가 1 이고 `S = 0` 이면 매 바퀴 한 칸씩 뺀다. */
export const worstOps = (n: number): number => refOps(ones(n), 0);

function approaches(): Approach[] {
  const naive = restartEachStart(WALK, WALK_S);
  const rewound = rewindBy(WALK, WALK_S, WALK.length);
  const slide = refOps(WALK, WALK_S);
  const big = naiveWorst(N_MAX).ops;
  return [
    {
      name: "모든 구간 재기",
      idea: "시작점마다 오른쪽 끝을 처음부터 다시 늘리며 합을 더한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `맞다 · 일곱 칸 입력에서 덧셈 ${naive.ops} 번`,
          ok: true,
        },
        {
          label: "시간",
          value: `n = ${num(N_MAX)} 최악 덧셈 ${num(big)} 번 · ${secondsOf(big)}`,
          ok: false,
        },
      ],
      lesson:
        "옆 시작점이 이미 더한 칸을 다시 더한다 — 직전 합에서 빠진 칸만 빼면 어떨까",
    },
    {
      name: "직전 합을 고치되 왼쪽 끝은 처음부터",
      idea: "창의 합은 이어 쓰고, 오른쪽 끝을 넓힐 때마다 왼쪽 끝을 0 으로 되돌려 다시 줄인다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "연산",
          value: `일곱 칸 입력에서 덧셈·뺄셈 ${rewound.ops} 번`,
          ok: false,
        },
      ],
      lesson:
        "되돌린 칸을 다시 빼느라 연산이 는다 — 왼쪽 끝이 되돌아갈 자리가 실제로 있었나",
    },
    {
      name: "슬라이딩 윈도",
      idea: "오른쪽 끝을 한 칸씩 넓히고, 합이 S 를 넘는 동안만 왼쪽 끝을 옮긴다. 되돌리지 않는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "연산",
          value: `일곱 칸 입력에서 ${slide} 번 · n = ${num(N_MAX)} 최악 ${num(worstOps(N_MAX))} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 전체 컨셉에 그리는 창 둘 — `r = 3` 의 가장 긴 창과, 답이 된 창. */
export function conceptWindows(): { l: number; r: number; sum: number }[] {
  const t = trace(WALK, WALK_S);
  const at3 = t.rounds[3] as Round;
  const answer = t.rounds.find((r) => r.r - r.l + 1 === t.result) as Round;
  return [at3, answer].map((r) => ({
    l: r.l,
    r: r.r,
    sum: sumOf(WALK, r.l, r.r),
  }));
}

/** 줄이기가 처음 일어나는 바퀴 — 「아이디어 상세」 3단계의 전·후 그림. */
export function firstShrink(): Round {
  const t = trace(WALK, WALK_S);
  const r = t.rounds.find((x) => x.removed.length > 0);
  if (r === undefined)
    throw new Error("전개 입력에서 창이 한 번도 줄지 않았다");
  return r;
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-window": () => {
    const ws = conceptWindows();
    return (
      <CellStageFilm
        title={`nums = [${WALK.join(", ")}], S = ${WALK_S} — 합이 ${WALK_S} 이하인 창 둘`}
        columns={WALK.length}
        frames={ws.map((w) => ({
          id: `[${w.l},${w.r}]`,
          text: `창 [${w.l},${w.r}] — 합 ${w.sum} ≤ ${WALK_S}, 길이 ${w.r - w.l + 1}`,
          rows: arrayStage(
            {
              array: [...WALK],
              range: [w.l, w.r],
              pointers: { l: w.l, r: w.r },
            },
            ARRAY_OPTIONS,
          ),
        }))}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`배열 길이 최대 ${num(N_MAX)} · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-shrink": () => {
    const r = firstShrink();
    const before: ArrayStep = {
      array: [...WALK],
      range: [r.removed[0] as number, r.r],
      read: [r.r],
      pointers: { l: r.removed[0] as number, r: r.r },
    };
    const after: ArrayStep = {
      array: [...WALK],
      range: r.l <= r.r ? [r.l, r.r] : null,
      read: [...r.removed],
      pointers: { l: r.l, r: r.r },
    };
    return (
      <CellStageFilm
        title={`r = ${r.r} — 넓힌 직후와 줄인 뒤`}
        columns={WALK.length}
        frames={[
          {
            id: "넓힌 직후",
            text: `nums[${r.r}] = ${r.added}${을를(String(r.added))} 더해 창의 합 ${r.before} > ${WALK_S}`,
            rows: arrayStage(before, ARRAY_OPTIONS),
          },
          {
            id: "줄인 뒤",
            text: `${r.removed.map((k) => `nums[${k}] = ${WALK[k]}`).join(", ")}${을를(String(WALK[r.removed.at(-1) as number]))} 빼서 창의 합 ${r.windowSum} ≤ ${WALK_S}`,
            rows: arrayStage(after, ARRAY_OPTIONS),
          },
        ]}
      />
    );
  },
  "walk-slide": () => {
    const steps = walkSteps();
    return (
      <CellStageFilm
        title={`longestSubarrayAtMostSum([${WALK.join(", ")}], ${WALK_S}) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={WALK.length}
        frames={film(steps)}
      />
    );
  },
};
