/**
 * `binarySearch-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 반복 한 바퀴의 `lo`·`hi`·`mid` 는
 * 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록하고, 답은 정본이 낸다. 걸음 재생 패널의
 * 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `binarySearch-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { binarySearch } from "./binarySearch-guide.ref.ts";

const REF = new URL("./binarySearch-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 반복 한 바퀴 — 그 바퀴가 시작할 때의 후보 구간과 읽은 칸. */
export interface Round {
  readonly lo: number;
  readonly hi: number;
  readonly mid: number;
  readonly value: number;
  /** 읽은 값과 target 의 관계 — `eq` ① 같다 · `lt` ② target 이 더 작다 · `gt` ③ target 이 더 크다. */
  readonly branch: "eq" | "lt" | "gt";
}

export interface Trace {
  readonly rounds: readonly Round[];
  readonly result: number;
  /** 반복이 끝난 뒤의 후보 구간. 답을 찾아 끝났으면 마지막 바퀴의 구간이다. */
  readonly end: { readonly lo: number; readonly hi: number };
}

/**
 * `mid` 를 정하는 한 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히
 * 맞지 않으면 `loadMutant` 가 던진다. 반복의 상태를 손으로 다시 계산하면 「이 코드가 그렇게
 * 움직인다」가 검사되지 않는다.
 */
const probed = await loadMutant<{
  binarySearch(A: number[], target: number): number;
}>(REF, {
  swap: [
    /^(\s*)const mid = lo \+ Math\.floor\(\(hi - lo\) \/ 2\);$/,
    "$1const mid = lo + Math.floor((hi - lo) / 2);\n$1(globalThis as any).__rounds.push({ lo, hi, mid });",
  ],
});

/** 정본 한 번 호출의 반복 기록. 답은 정본과 대조하고, 바퀴 사이의 구간 변화도 대조한다. */
export function trace(A: readonly number[], target: number): Trace {
  const g = globalThis as unknown as {
    __rounds: { lo: number; hi: number; mid: number }[];
  };
  g.__rounds = [];
  const result = probed.binarySearch([...A], target);
  const want = binarySearch([...A], target);
  if (result !== want) {
    throw new Error(
      `계측 사본이 정본과 다른 답을 냈다 — [${A.join(" ")}] target ${target}: ${result} ≠ ${want}`,
    );
  }
  const rounds: Round[] = g.__rounds.map(({ lo, hi, mid }) => {
    const value = A[mid] as number;
    const branch =
      value === target ? "eq" : target < value ? "lt" : ("gt" as const);
    return { lo, hi, mid, value, branch };
  });
  const after = (r: Round): { lo: number; hi: number } =>
    r.branch === "lt"
      ? { lo: r.lo, hi: r.mid - 1 }
      : r.branch === "gt"
        ? { lo: r.mid + 1, hi: r.hi }
        : { lo: r.lo, hi: r.hi };
  // 다음 바퀴가 기록한 구간이 앞 바퀴의 갱신 결과와 같아야 한다. 아니면 갈래를 잘못 읽은 것이다.
  for (let i = 1; i < rounds.length; i++) {
    const a = after(rounds[i - 1] as Round);
    const b = rounds[i] as Round;
    if (a.lo !== b.lo || a.hi !== b.hi) {
      throw new Error(`바퀴 ${i} 의 구간이 앞 바퀴의 갱신과 다르다`);
    }
  }
  const last = rounds.at(-1);
  const end =
    last === undefined ? { lo: 0, hi: A.length - 1 } : after(last as Round);
  if (result === -1 && end.lo <= end.hi) {
    throw new Error("-1 로 끝났는데 후보 구간이 비지 않았다");
  }
  return { rounds, result, end };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const A6 = [1, 3, 5, 7, 9, 11];
/** 전개가 찾는 값 둘 — 있는 값 7 과 없는 값 4. */
export const HIT = 7;
export const MISS = 4;

const num = (x: number): string => x.toLocaleString("en-US");
const range = (lo: number, hi: number): number[] =>
  Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);
const BRANCH_MARK = { eq: "①", lt: "②", gt: "③" } as const;

/** 후보 구간 밖의 칸 — 이미 답이 아니라고 정해진 칸이다. */
function outside(n: number, lo: number, hi: number): number[] {
  return range(0, n - 1).filter((i) => i < lo || i > hi);
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** 이 걸음이 끝난 뒤의 후보 구간. */
  readonly lo: number;
  readonly hi: number;
  /** 이 걸음에 읽은 칸. */
  readonly mid?: number;
  /** 답을 찾은 칸. */
  readonly found?: number;
}

/** 있는 값을 찾는 벌 — 초기화 한 걸음 + 바퀴마다 「가운데 계산」·「비교」 두 걸음. */
function hitSteps(from: number): Step[] {
  const t = trace(A6, HIT);
  const steps: Step[] = [];
  let n = from;
  const first = t.rounds[0] as Round;
  steps.push({
    id: `T${n++}`,
    title: `후보 [${first.lo},${first.hi}]`,
    detail: `후보 구간을 배열 전체로 잡습니다. lo = ${first.lo}, hi = ${first.hi}, 후보 ${first.hi - first.lo + 1} 개입니다.`,
    lo: first.lo,
    hi: first.hi,
  });
  for (const r of t.rounds) {
    steps.push({
      id: `T${n++}`,
      title: `mid = ${r.mid}`,
      detail: `${r.lo} <= ${r.hi}${이가(r.hi)} 참이라 반복에 들어갑니다. mid = ${r.lo} + ⌊${r.hi - r.lo}/2⌋ = ${r.mid} 입니다.`,
      lo: r.lo,
      hi: r.hi,
      mid: r.mid,
    });
    const next =
      r.branch === "lt"
        ? { lo: r.lo, hi: r.mid - 1 }
        : r.branch === "gt"
          ? { lo: r.mid + 1, hi: r.hi }
          : { lo: r.lo, hi: r.hi };
    const verdict =
      r.branch === "eq"
        ? `${r.value} === ${HIT}${이가(HIT)} 참이라 ① ${r.mid}${을를(String(r.mid))} 돌려줍니다.`
        : r.branch === "lt"
          ? `${r.value} === ${HIT}${은는(HIT)} 거짓, ${HIT} < ${r.value}${은는(r.value)} 참이라 ② hi = ${next.hi} 입니다.`
          : `${r.value} === ${HIT}${은는(HIT)} 거짓, ${HIT} < ${r.value} 도 거짓이라 ③ lo = ${next.lo} 입니다.`;
    steps.push({
      id: `T${n++}`,
      title: `A[${r.mid}] = ${r.value} ${BRANCH_MARK[r.branch]}`,
      detail: `A[${r.mid}] = ${r.value}${을를(String(r.value))} 읽습니다. ${verdict}`,
      lo: next.lo,
      hi: next.hi,
      mid: r.mid,
      ...(r.branch === "eq" ? { found: r.mid } : {}),
    });
  }
  return steps;
}

/** 없는 값을 찾는 벌 — 바퀴마다 한 걸음 + 반복이 끝나는 한 걸음. */
function missSteps(from: number): Step[] {
  const t = trace(A6, MISS);
  const steps: Step[] = [];
  let n = from;
  for (const r of t.rounds) {
    const next =
      r.branch === "lt"
        ? { lo: r.lo, hi: r.mid - 1 }
        : { lo: r.mid + 1, hi: r.hi };
    const cond =
      r.branch === "lt"
        ? `${MISS} < ${r.value}${이가(r.value)} 참이라 ② hi = ${next.hi}`
        : `${MISS} < ${r.value}${이가(r.value)} 거짓이라 ③ lo = ${next.lo}`;
    steps.push({
      id: `T${n++}`,
      title: `후보 [${r.lo},${r.hi}] · A[${r.mid}] = ${r.value} ${BRANCH_MARK[r.branch]}`,
      detail: `mid = ${r.mid}, A[${r.mid}] = ${r.value}${을를(String(r.value))} 읽습니다. ${cond} 입니다. 후보가 ${Math.max(0, next.hi - next.lo + 1)} 개 남습니다.`,
      lo: next.lo,
      hi: next.hi,
      mid: r.mid,
    });
  }
  steps.push({
    id: `T${n++}`,
    title: `lo = ${t.end.lo} > hi = ${t.end.hi}`,
    detail: `lo <= hi 가 거짓이라 반복이 끝나고 ${t.result}${을를(String(t.result))} 돌려줍니다.`,
    lo: t.end.lo,
    hi: t.end.hi,
  });
  return steps;
}

/**
 * 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다.
 * 쥔 구간은 후보 구간이고(비면 `null`), 읽은 칸은 이번에 본 `mid`, 새로 쓴 칸은 찾은 답이다.
 */
function arrayStep(s: Step): ArrayStep {
  return {
    array: [...A6],
    range: s.lo <= s.hi ? [s.lo, s.hi] : null,
    read: s.mid !== undefined && s.found === undefined ? [s.mid] : [],
    write: s.found !== undefined ? [s.found] : [],
    pointers:
      s.found !== undefined
        ? { mid: s.found }
        : s.mid === undefined
          ? { lo: s.lo, hi: s.hi }
          : { lo: s.lo, mid: s.mid, hi: s.hi },
  };
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "후보",
};

const film = (steps: Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
  }));

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `binarySearch-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const toStep = (s: Step) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...arrayStep(s),
  });
  const hit = hitSteps(1);
  const miss = missSteps(hit.length + 1);
  return { probe: hit.map(toStep), miss: miss.map(toStep) };
}

/** 본문이 인용하는 걸음 수 — 필름과 표가 같은 번호를 쓴다. */
export const walkSteps = () => {
  const hit = hitSteps(1);
  return { hit, miss: missSteps(hit.length + 1) };
};

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

/** 과제 규모 — 길이 `N` 배열에 조회 `Q` 번. 배열은 `A[i] = 2i` 로 만든다. */
export const N = 1_000_000;
export const Q = 1_000;
/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toFixed(2)} 초`;

/** 선형 탐색 — 정렬을 쓰지 않는다. 읽은 칸 수를 센다. */
export function linearReads(A: readonly number[], target: number): number {
  let reads = 0;
  for (let k = 0; k < A.length; k++) {
    reads++;
    if (A[k] === target) return reads;
  }
  return reads;
}

/** 남은 후보의 첫 칸을 읽는 절차 — 정렬을 쓴다. 갱신 규칙은 정본과 같다. */
export function firstCellReads(A: readonly number[], target: number): number {
  let lo = 0;
  let hi = A.length - 1;
  let reads = 0;
  while (lo <= hi) {
    const mid = lo;
    reads++;
    if (A[mid] === target) return reads;
    if (target < (A[mid] as number)) hi = mid - 1;
    else lo = mid + 1;
  }
  return reads;
}

/**
 * 길이 `N` 배열 `A[i] = 2i` 에서 세 절차의 최악 읽은 칸. 가운데를 읽는 쪽은 정본 계측으로
 * 배열 안팎의 값 전부(`-1 … 2N`)를 넣어 센다. 나머지 둘은 읽은 칸이 후보 수를 넘지 못하므로
 * (한 번 읽을 때마다 후보가 1 개 이상 준다) 가장 큰 값보다 큰 `target` 이 `N` 번으로 최악이다.
 */
export function scaleCounts(): {
  linear: number;
  first: number;
  middle: number;
} {
  const A = Array.from({ length: N }, (_, i) => 2 * i);
  const beyond = 2 * N;
  const linear = linearReads(A, beyond);
  const first = firstCellReads(A, beyond);
  // 값 2 백만 개를 넣으므로 `trace` 처럼 호출마다 배열을 복사하지 않는다. 계측 사본을 그대로
  // 부르고, 답은 정의(`A[i] = 2i`)와 대조한다.
  const g = globalThis as unknown as { __rounds: unknown[] };
  let middle = 0;
  for (let t = -1; t <= beyond; t++) {
    g.__rounds = [];
    const got = probed.binarySearch(A, t);
    const want = t >= 0 && t < beyond && t % 2 === 0 ? t / 2 : -1;
    if (got !== want) throw new Error(`N = ${N} 에서 ${t} 의 답이 ${got} 이다`);
    middle = Math.max(middle, g.__rounds.length);
  }
  return { linear, first, middle };
}

let scaleMemo: ReturnType<typeof scaleCounts> | undefined;
export const scale = (): ReturnType<typeof scaleCounts> => {
  scaleMemo ??= scaleCounts();
  return scaleMemo;
};

function approaches(): Approach[] {
  const s = scale();
  return [
    {
      name: "왼쪽부터 하나씩 확인하기",
      idea: "칸을 왼쪽부터 읽으며 target 과 같은지만 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `조회 ${num(Q)} 번에 비교 ${num(s.linear * Q)} 번 · ${secondsOf(s.linear * Q)}`,
          ok: false,
        },
      ],
      lesson:
        "한 번 읽고 그 칸 하나만 뺀다 — 정렬돼 있다는 것을 쓰면 더 뺄 수 있지 않을까",
    },
    {
      name: "남은 후보의 첫 칸 읽기",
      idea: "정렬을 써서, 읽은 값이 작으면 그 칸까지 왼쪽을 모두 뺀다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `조회 하나에 최악 ${num(s.first)} 번 · 선형 탐색과 같다`,
          ok: false,
        },
      ],
      lesson:
        "첫 칸은 왼쪽에 칸이 없어 더 빠지는 것이 없다 — 안쪽 칸을 읽으면 어떨까",
    },
    {
      name: "가운데 칸 읽기",
      idea: "후보의 가운데를 읽고, 답일 수 없는 쪽 절반을 통째로 뺀다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `조회 하나에 최악 ${num(s.middle)} 번 · ${num(Q)} 번에 ${num(s.middle * Q)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 한 칸을 읽고 빠지는 칸 ───────────────── */

/**
 * 후보가 배열 전체일 때 칸 `k` 하나를 읽으면 어느 칸이 빠지는가 — 정렬 조건만으로 정한다.
 * 읽은 값이 target 보다 작으면 그 칸까지 왼쪽 전부, 크면 그 칸부터 오른쪽 전부가 빠진다.
 * 빠진 칸 어디에도 target 이 없는지는 정본의 답으로 확인한다.
 */
export function oneRead(k: number, target: number) {
  const value = A6[k] as number;
  const removed =
    value < target
      ? range(0, k)
      : value > target
        ? range(k, A6.length - 1)
        : [];
  const answer = binarySearch([...A6], target);
  if (removed.includes(answer)) {
    throw new Error(`빠진 칸에 답 ${answer} 이 들어 있다 — 칸 ${k}`);
  }
  return { k, value, removed };
}

export const ONE_READS = [0, 4, 1] as const;

function oneReadFrames(): StageFrame[] {
  return ONE_READS.map((k) => {
    const r = oneRead(k, HIT);
    const states: Partial<Record<number, CellState>> = {};
    for (const i of r.removed) states[i] = "out";
    states[k] = "read";
    const sign = r.value < HIT ? "<" : ">";
    return {
      id: `A[${k}]`,
      text: `A[${k}] = ${r.value} ${sign} ${HIT} → 인덱스 ${r.removed.join(" · ")}${을를(String(r.removed.at(-1)))} 뺀다`,
      rows: [
        { kind: "index", label: "인덱스" },
        {
          kind: "cells",
          label: "A",
          values: A6,
          states,
          side: `빼는 칸 ${r.removed.length} 개`,
        },
        { kind: "caret", cells: [k] },
      ],
    };
  });
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-first-read": () => {
    const r = oneRead(2, HIT);
    const states: Partial<Record<number, CellState>> = {};
    for (const i of r.removed) states[i] = "out";
    const lo = Math.max(...r.removed) + 1;
    const hi = A6.length - 1;
    return (
      <RangeCover
        title={`가운데 A[2] = ${r.value}${을를(String(r.value))} 읽으면 후보가 ${A6.length} 칸에서 ${hi - lo + 1} 칸이 된다`}
        row={{ label: "A 의 값", values: A6, states }}
        indexLabel="인덱스"
        ranges={[
          {
            from: lo,
            to: hi,
            tone: "query",
            note: `남은 후보 [${lo},${hi}] · ${hi - lo + 1} 칸`,
          },
        ]}
        annotation={{
          cells: [2],
          text: `A[2] = ${r.value} < ${HIT} — 인덱스 ${r.removed.join(" · ")} 에는 ${HIT} 이 없다`,
        }}
      />
    );
  },
  "origin-one-read": () => (
    <CellStageFilm
      title={`후보가 배열 전체일 때 칸 하나를 읽고 빼는 칸 — target = ${HIT}`}
      columns={A6.length}
      frames={oneReadFrames()}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`길이 ${num(N)} 배열에 조회 ${num(Q)} 번 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-candidates": () => {
    const t = trace(A6, HIT);
    const r = t.rounds[1] as Round;
    const states: Partial<Record<number, CellState>> = {};
    for (const i of outside(A6.length, r.lo, r.hi)) states[i] = "out";
    return (
      <RangeCover
        title={`후보 구간 [lo, hi] = [${r.lo},${r.hi}] — 두 인덱스로 후보 전체를 적는다`}
        row={{ label: "A 의 값", values: A6, states }}
        indexLabel="인덱스"
        ranges={[
          {
            from: r.lo,
            to: r.hi,
            tone: "query",
            note: `lo = ${r.lo}, hi = ${r.hi} · 후보 ${r.hi - r.lo + 1} 개`,
          },
        ]}
        annotation={{
          cells: outside(A6.length, r.lo, r.hi),
          text: "대시 칸은 이미 답이 아니라고 정해진 칸이다",
        }}
      />
    );
  },
  "walk-probe": () => (
    <CellStageFilm
      title={`binarySearch([${A6.join(", ")}], ${HIT}) — T1~T7`}
      columns={A6.length}
      frames={film(walkSteps().hit)}
    />
  ),
  "walk-miss": () => {
    const { miss } = walkSteps();
    return (
      <CellStageFilm
        title={`binarySearch([${A6.join(", ")}], ${MISS}) — ${miss[0]?.id}~${miss.at(-1)?.id}`}
        columns={A6.length}
        frames={film(miss)}
      />
    );
  },
  "invariant-range": () => {
    const t = trace(A6, HIT);
    const r = t.rounds[1] as Round;
    const states: Partial<Record<number, CellState>> = {};
    for (const i of outside(A6.length, r.lo, r.hi)) states[i] = "out";
    return (
      <RangeCover
        title="반복이 한 바퀴를 시작할 때 — target 은 후보 구간 밖에 없다"
        row={{ label: "A 의 값", values: A6, states }}
        indexLabel="인덱스"
        ranges={[
          {
            from: r.lo,
            to: r.hi,
            tone: "query",
            note: `후보 [${r.lo},${r.hi}] · T4 가 시작할 때`,
          },
        ]}
        annotation={{
          cells: outside(A6.length, r.lo, r.hi),
          text: `이미 뺀 칸 — ${HIT} 이 여기 없다는 것이 매 바퀴 참이다`,
        }}
      />
    );
  },
};
