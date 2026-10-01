/**
 * `subarraySumEqualsK-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 개수 맵에 기록하는 줄 앞뒤로 기록을
 * 끼운 계측 사본(`scanProbe`)을 정본 소스에서 기계로 만들고, 그 기록으로 걸음마다의 누적합 · 찾는 키 ·
 * 찾은 개수 · 개수 맵을 얻는다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고,
 * `.sim.ts` 의 리터럴이 그것과 같은지는 `subarraySumEqualsK-guide.test.ts` 가 잰다.
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
import { keyValueRows } from "../../../_viz/patterns/KeyValueTable";
import {
  type ArrayOptions,
  type ArrayPiece,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { subarraySumEqualsK } from "./subarraySumEqualsK-guide.ref.ts";

const REF = new URL("./subarraySumEqualsK-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  subarraySumEqualsK(nums: number[], k: number): number;
}

type Entry = readonly [number, number];

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 개수 맵에 기록하는 줄 앞뒤로 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히
 * 맞지 않으면 `loadMutant` 가 던진다. 조회는 개수 맵을 바꾸지 않으므로, 기록 직전의 개수 맵이 곧
 * 조회가 본 개수 맵이다.
 */
const scanProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)seen\.set\(prefix, \(seen\.get\(prefix\) \?\? 0\) \+ 1\);$/,
    "$1const __before = [...seen.entries()];\n$1seen.set(prefix, (seen.get(prefix) ?? 0) + 1);\n$1(globalThis as any).__scan.push({ value, prefix, target: prefix - k, answer, before: __before, after: [...seen.entries()] });",
  ],
});

/** 원소 하나를 처리한 한 걸음의 기록. */
export interface Scan {
  /** 이번 원소의 인덱스 — 구간의 오른쪽 끝. */
  readonly r: number;
  readonly value: number;
  /** 이번 누적합 `P[r+1]`. */
  readonly prefix: number;
  /** 찾는 키 `prefix − k`. */
  readonly target: number;
  /** 개수 맵에서 찾은 개수(없으면 0). */
  readonly found: number;
  /** 이번 걸음을 마친 뒤의 answer. */
  readonly answer: number;
  /** 조회 · 기록 전의 개수 맵(키를 넣은 순서). */
  readonly before: readonly Entry[];
  /** 기록 뒤의 개수 맵. */
  readonly after: readonly Entry[];
}

export interface Trace {
  readonly scans: readonly Scan[];
  readonly answer: number;
  /** 루프에 들어가기 전의 개수 맵 — 빈 누적합 하나. */
  readonly seed: readonly Entry[];
}

/** 정의대로 센 누적합 `P[0..n]` — 앞 `j` 개 원소의 합. 계측 기록과 대조하는 데 쓴다. */
export function prefixes(nums: readonly number[]): number[] {
  const P = [0];
  for (const v of nums) P.push((P.at(-1) as number) + v);
  return P;
}

/** 합이 `k` 인 구간 `[l, r]` 전부 — 모든 구간을 직접 더해 찾는다(정의). */
export function answerRanges(
  nums: readonly number[],
  k: number,
): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let l = 0; l < nums.length; l++) {
    let s = 0;
    for (let r = l; r < nums.length; r++) {
      s += nums[r] as number;
      if (s === k) out.push([l, r]);
    }
  }
  return out;
}

/** 값이 `v` 인 칸이 `P[0..j−1]` 에 몇 개인가 — 정의대로 센다. */
const countBefore = (P: readonly number[], j: number, v: number): number =>
  P.slice(0, j).filter((x) => x === v).length;

/**
 * 정본 한 번 호출의 기록. 답은 정본과, 찾은 개수와 개수 맵은 정의(누적합을 직접 센 값)와 대조한다.
 * 어긋나면 던진다 — 그림이 정본과 다른 것을 그리지 않게.
 */
export function trace(nums: readonly number[], k: number): Trace {
  const g = globalThis as unknown as {
    __scan: Omit<Scan, "r" | "found">[];
  };
  g.__scan = [];
  const probed = scanProbe.subarraySumEqualsK([...nums], k);
  const raw = [...g.__scan];
  const answer = subarraySumEqualsK([...nums], k);
  if (probed !== answer) throw new Error("계측 사본이 정본과 다른 답을 냈다");
  if (raw.length !== nums.length) {
    throw new Error("기록한 걸음 수가 원소 수와 다르다");
  }
  const P = prefixes(nums);
  let last = 0;
  const scans = raw.map((s, r): Scan => {
    const found = s.answer - last;
    last = s.answer;
    const j = r + 1;
    if (s.prefix !== P[j]) throw new Error(`P[${j}] 가 정의와 다르다`);
    if (found !== countBefore(P, j, (P[j] as number) - k)) {
      throw new Error(`r = ${r} 에서 찾은 개수가 정의와 다르다`);
    }
    const byDef = new Map<number, number>();
    for (const v of P.slice(0, j + 1)) byDef.set(v, (byDef.get(v) ?? 0) + 1);
    if (JSON.stringify([...byDef]) !== JSON.stringify(s.after)) {
      throw new Error(`r = ${r} 뒤의 개수 맵이 정의와 다르다`);
    }
    return { ...s, r, found };
  });
  if (answer !== answerRanges(nums, k).length) {
    throw new Error("정본의 답이 모든 구간을 직접 더해 센 개수와 다르다");
  }
  const seed = scans[0]?.before ?? [[0, 1] as const];
  return { scans, answer, seed };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK: readonly number[] = [3, 4, 7, 2, -3, 1, 4, 2];
export const WALK_K = 7;

/** 과제 규모 — 배열 길이의 상한. */
export const N_MAX = 100_000;
/** 단순 연산 1 초에 1 억 번 기준. */
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toLocaleString("en-US", { maximumSignificantDigits: 3 })} 초`;
export const num = (x: number): string => x.toLocaleString("en-US");
/** 모든 구간의 수 `n(n+1)/2`. */
export const rangeCount = (n: number): number => (n * (n + 1)) / 2;
/** 개수 맵의 기본 연산 — 걸음마다 조회 하나 · 읽기 하나 · 쓰기 하나, 시작할 때 쓰기 하나. */
export const mapOps = (n: number): number => 3 * n + 1;

/** `{0: 1, 3: 1}` 꼴 — 개수 맵을 적는 한 가지 표기. */
export const showMap = (entries: readonly Entry[]): string =>
  `{${entries.map(([key, v]) => `${key}: ${v}`).join(", ")}}`;

/**
 * 이번 걸음이 찾은 구간 — 앞 칸 `i` 의 누적합이 찾는 키와 같으면 구간 `[i, r]` 의 합이 `k` 다.
 * 누적합은 정의대로 센다(`prefixes`). 찾은 개수와 수가 같은지는 `trace` 가 이미 대조했다.
 */
export function foundRanges(
  nums: readonly number[],
  s: Scan,
): Array<[number, number]> {
  const P = prefixes(nums);
  return P.slice(0, s.r + 1).flatMap((v, i) =>
    v === s.target ? [[i, s.r] as [number, number]] : [],
  );
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** 지금까지 더한 앞부분 `[0, r]`. 준비 걸음이면 `null`. */
  readonly range: readonly [number, number] | null;
  readonly readA: readonly number[];
  readonly prefix: number;
  /** 이번 걸음이 찾은 구간들. */
  readonly found: readonly (readonly [number, number])[];
  /** 이 걸음이 끝난 뒤의 개수 맵. */
  readonly map: readonly Entry[];
  readonly readKeys: readonly number[];
  readonly writeKeys: readonly number[];
  readonly note: string;
  readonly answer: number;
  readonly calc: { readonly expr: string; readonly result: string };
}

/** 전개의 걸음 — 빈 누적합을 적는 한 걸음 + 원소마다 한 걸음. */
export function walkSteps(
  nums: readonly number[] = WALK,
  k: number = WALK_K,
): Step[] {
  const t = trace(nums, k);
  const steps: Step[] = [
    {
      id: "T1",
      title: "seen.set(0, 1)",
      detail:
        "개수 맵에 빈 누적합 0 을 한 번 적습니다. 원소를 하나도 더하지 않은 누적합 P[0] 입니다.",
      range: null,
      readA: [],
      prefix: 0,
      found: [],
      map: t.seed,
      readKeys: [],
      writeKeys: [0],
      note: "",
      answer: 0,
      calc: { expr: "seen[0]", result: "1" },
    },
  ];
  for (const s of t.scans) {
    const old = s.before.find(([key]) => key === s.prefix)?.[1] ?? 0;
    const lookup =
      s.found > 0
        ? `찾는 키 ${s.target}${이가(s.target)} 개수 맵에 ${s.found} 번 있어 answer 가 ${s.answer}${이가(s.answer)} 됩니다.`
        : `찾는 키 ${s.target}${이가(s.target)} 개수 맵에 없어 answer 는 ${s.answer} 그대로입니다.`;
    const record =
      old === 0
        ? `키 ${s.prefix}${을를(s.prefix)} 개수 1 로 새로 넣습니다.`
        : `키 ${s.prefix} 의 개수를 ${old} 에서 ${old + 1}${으로(old + 1)} 늘립니다.`;
    steps.push({
      id: `T${steps.length + 1}`,
      title: `r = ${s.r}`,
      detail: `nums[${s.r}] = ${s.value}${을를(s.value)} 더해 누적합이 ${s.prefix} 입니다. ${lookup} ${record}`,
      range: [0, s.r],
      readA: [s.r],
      prefix: s.prefix,
      found: foundRanges(nums, s),
      map: s.after,
      readKeys: s.found > 0 ? [s.target] : [],
      writeKeys: [s.prefix],
      note:
        s.found > 0
          ? `찾는 키 ${s.target} · 개수 ${s.found}`
          : `찾는 키 ${s.target} · 없음`,
      answer: s.answer,
      calc: {
        expr: `seen.get(${s.prefix} − ${k})`,
        result: String(s.found > 0 ? s.found : "없음 → 0"),
      },
    });
  }
  return steps;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "nums",
  rangeLabel: "앞부분",
};

/** 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
export function arrayStep(
  s: Step,
  slots: number,
  nums: readonly number[] = WALK,
): ArrayStep {
  const pieces: ArrayPiece[] = s.found.map(([l, r]) => ({
    label: "찾은 구간",
    from: l,
    to: r,
    tone: "left",
    text: `[${l},${r}]`,
  }));
  return {
    array: [...nums],
    range: s.range === null ? null : [s.range[0], s.range[1]],
    read: [...s.readA],
    write: [],
    calc: { ...s.calc },
    vars: `answer = ${s.answer}`,
    rangeSide: `누적합 ${s.prefix}`,
    pieces,
    map: {
      keyLabel: "seen 키",
      valueLabel: "개수",
      entries: s.map.map(([key, v]) => [key, v] as const),
      slots,
      read: [...s.readKeys],
      write: [...s.writeKeys],
      note: s.note,
    },
  };
}

/** 개수 맵이 가장 커졌을 때의 키 수 — 무대가 첫 걸음부터 잡는 자리 수. */
const slotsOf = (steps: readonly Step[]): number =>
  Math.max(...steps.map((s) => s.map.length));

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `subarraySumEqualsK-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const steps = walkSteps();
  const slots = slotsOf(steps);
  return {
    scan: steps.map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...arrayStep(s, slots),
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

/** 창의 두 끝을 오른쪽으로만 옮기며 합이 `k` 인 창을 센다 — 원소가 음수가 아닐 때의 방법. */
export function windowCount(nums: readonly number[], k: number): number {
  let l = 0;
  let sum = 0;
  let count = 0;
  for (let r = 0; r < nums.length; r++) {
    sum += nums[r] as number;
    while (sum > k && l <= r) {
      sum -= nums[l] as number;
      l++;
    }
    if (sum === k && l <= r) count++;
  }
  return count;
}

/**
 * 누적합을 정렬해 차이가 `k` 인 값의 짝을 순서 없이 센다 — 어느 쪽이 앞이었는지가 사라지므로
 * `P[i] − P[j] = k` 인 짝(구간이 아니다)까지 세어진다.
 */
export function countIgnoringOrder(nums: readonly number[], k: number): number {
  const P = [...prefixes(nums)].sort((a, b) => a - b);
  let count = 0;
  for (let i = 0; i < P.length; i++) {
    for (let j = i + 1; j < P.length; j++) {
      const d = (P[j] as number) - (P[i] as number);
      if (d === k || -d === k) count++;
    }
  }
  return count;
}

/** 「창」 후보가 틀리는 입력 — 음수가 섞인 전개 입력. */
export const NEG_CASE: readonly [readonly number[], number] = [WALK, WALK_K];
/** 「순서 없이 세기」 후보가 틀리는 가장 작은 입력. */
export const ORDER_CASE: readonly [readonly number[], number] = [[5, -5, 5], 5];

function approaches(): Approach[] {
  const bigRanges = rangeCount(N_MAX);
  const [negNums, negK] = NEG_CASE;
  const [ordNums, ordK] = ORDER_CASE;
  const right = (nums: readonly number[], k: number) =>
    subarraySumEqualsK([...nums], k);
  return [
    {
      name: "모든 구간 더하기",
      idea: "왼쪽 끝마다 오른쪽 끝을 늘려 가며 합을 재고, k 와 같으면 센다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = ${num(N_MAX)} 에서 구간 ${num(bigRanges)} 개 · ${secondsOf(bigRanges)}`,
          ok: false,
        },
      ],
      lesson:
        "같은 앞부분을 다시 더한다 — 창의 두 끝을 오른쪽으로만 옮기면 어떨까",
    },
    {
      name: "창의 두 끝을 오른쪽으로만",
      idea: "합이 k 를 넘으면 왼쪽 끝을 당겨 창을 줄이고, 합이 k 인 창을 센다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `음수가 섞인 [${negNums.join(" ")}] 에서 ${windowCount(negNums, negK)} 개 · 실제 ${right(negNums, negK)} 개`,
          ok: false,
        },
      ],
      lesson:
        "음수가 있으면 줄인 창이 다시 답이 된다 — 누적합의 짝을 한꺼번에 세면 어떨까",
    },
    {
      name: "누적합의 짝을 순서 없이 세기",
      idea: "누적합을 정렬해 차이가 k 인 값의 짝을 센다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `[${ordNums.join(" ")}] 에서 ${countIgnoringOrder(ordNums, ordK)} 개 · 실제 ${right(ordNums, ordK)} 개`,
          ok: false,
        },
      ],
      lesson:
        "뒤 칸이 더 작은 짝까지 센다 — 앞 칸만 담은 채 오른쪽으로 가면 어떨까",
    },
    {
      name: "누적합 짝 세기",
      idea: "지나온 누적합의 개수를 개수 맵에 두고, 칸마다 P[j] − k 가 몇 번 나왔는지 묻는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다 · 음수가 섞여도 같다", ok: true },
        {
          label: "시간",
          value: `n = ${num(N_MAX)} 에서 맵 연산 ${num(mapOps(N_MAX))} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 인덱스 · nums · 누적합 세 줄 — 누적합 칸 `j` 는 nums 의 앞 `j` 개 합이라 칸이 하나 많다. */
function prefixRows(
  nums: readonly number[],
  readP: readonly number[],
  pSide: string,
): StageRow[] {
  const P = prefixes(nums);
  const states: Partial<Record<number, CellState>> = {};
  for (const j of readP) states[j] = "read";
  return [
    { kind: "index", label: "인덱스" },
    { kind: "cells", label: "nums", values: [...nums] },
    { kind: "cells", label: "P", values: P, states, side: pSide },
    { kind: "caret", cells: [...readP] },
  ];
}

/** 「전체 컨셉」이 멈춰 세우는 걸음 — 누적합이 두 번째로 14 가 되는 원소. */
export const CONCEPT_R = 5;

export const FIGS: Record<string, () => ReactElement> = {
  "concept-lookup": () => {
    const t = trace(WALK, WALK_K);
    const s = t.scans[CONCEPT_R] as Scan;
    const j = s.r + 1;
    const ranges = foundRanges(WALK, s);
    const lefts = ranges.map(([l]) => l);
    const rows: StageRow[] = [
      ...ranges.map(
        ([l, r]): StageRow => ({
          kind: "bracket",
          label: "구간",
          from: l,
          to: r,
          tone: "query",
          text: `[${l},${r}] 합 ${WALK_K}`,
        }),
      ),
      ...prefixRows(WALK, [...lefts, j], `P[${j}] − ${WALK_K} = ${s.target}`),
      ...keyValueRows({
        keyLabel: "seen 키",
        valueLabel: "개수",
        entries: s.before,
        read: [s.target],
        note: `찾는 키 ${s.target} · 개수 ${s.found}`,
      }),
    ];
    return (
      <CellStage
        title={`칸 ${j} 에서 개수 맵에 ${s.target}${을를(s.target)} 묻는다 — 찾은 개수가 곧 합이 ${WALK_K} 인 구간의 개수`}
        rows={rows}
        columns={WALK.length + 1}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`n 최대 ${num(N_MAX)} · 원소에 음수가 섞인다 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-map-whole": () => {
    const t = trace(WALK, WALK_K);
    const P = prefixes(WALK);
    const last = t.scans.at(-1) as Scan;
    // 개수가 가장 큰 키 — 같은 누적합이 여러 칸에 나온 자리.
    const [key, count] = [...last.after].sort(
      (a, b) => b[1] - a[1],
    )[0] as Entry;
    const cells = P.flatMap((v, j) => (v === key ? [j] : []));
    const rows: StageRow[] = [
      ...prefixRows(WALK, cells, `칸 ${cells.join(" · ")} 의 값이 ${key}`),
      ...keyValueRows({
        keyLabel: "seen 키",
        valueLabel: "개수",
        entries: last.after,
        read: [key],
        note: `키 ${key} · 개수 ${count}`,
      }),
    ];
    return (
      <CellStage
        title={`누적합 ${P.length} 칸과, 그 값을 센 개수 맵 — 키 ${last.after.length} 개`}
        rows={rows}
        columns={P.length}
      />
    );
  },
  "walk-scan": () => {
    const steps = walkSteps();
    const slots = slotsOf(steps);
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.calc.expr} = ${s.calc.result}`,
      rows: arrayStage(arrayStep(s, slots), ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`subarraySumEqualsK([${WALK.join(", ")}], ${WALK_K}) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(steps[0] as Step, slots))}
        frames={frames}
      />
    );
  },
};
