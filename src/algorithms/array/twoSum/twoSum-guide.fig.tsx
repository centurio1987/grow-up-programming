/**
 * `twoSum-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 해시 맵을 조회하는 줄 뒤에 기록을
 * 끼운 계측 사본(`lookProbe`)을 정본 소스에서 기계로 만들고, 그 기록으로 걸음마다의 보수 · 조회 결과 ·
 * 조회 직전 해시 맵을 얻는다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고,
 * `.sim.ts` 의 리터럴이 그것과 같은지는 `twoSum-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { counted } from "./twoSum-guide.alt.ts";
import { twoSum } from "./twoSum-guide.ref.ts";

const REF = new URL("./twoSum-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  twoSum(nums: number[], target: number): [number, number];
}

type Entry = readonly [number, number];

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 해시 맵을 조회하는 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 조회는 해시 맵을 바꾸지 않으므로 기록한 해시 맵이 곧 조회가 본
 * 해시 맵이다.
 */
const lookProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)const i = seen\.get\(target - x\);$/,
    "$1const i = seen.get(target - x);\n$1(globalThis as any).__look.push({ j, x, want: target - x, found: i, before: [...seen.entries()] });",
  ],
});

/** 원소 하나를 본 한 걸음의 기록. */
export interface Look {
  readonly j: number;
  readonly x: number;
  /** 보수 `target − x`. */
  readonly want: number;
  /** 조회 결과. 없으면 `undefined`. */
  readonly found: number | undefined;
  /** 조회할 때의 해시 맵(키를 넣은 순서). */
  readonly before: readonly Entry[];
  /** 걸음이 끝난 뒤의 해시 맵. 짝을 찾은 걸음이면 `before` 와 같다. */
  readonly after: readonly Entry[];
}

export interface Trace {
  readonly looks: readonly Look[];
  readonly answer: [number, number];
}

/** 정의대로 만든 해시 맵 — `nums[0..j−1]` 의 값마다 그 값이 마지막으로 나온 인덱스. */
function mapByDefinition(nums: readonly number[], j: number): Entry[] {
  const m = new Map<number, number>();
  for (let k = 0; k < j; k++) m.set(nums[k] as number, k);
  return [...m.entries()];
}

/**
 * 정본 한 번 호출의 기록. 답은 정본과, 조회 직전 해시 맵은 정의(앞 원소를 직접 적은 맵)와 대조한다.
 * 어긋나면 던진다 — 그림이 정본과 다른 것을 그리지 않게.
 */
export function trace(nums: readonly number[], target: number): Trace {
  const g = globalThis as unknown as {
    __look: Omit<Look, "after">[];
  };
  g.__look = [];
  const probed = lookProbe.twoSum([...nums], target);
  const raw = [...g.__look];
  const answer = twoSum([...nums], target);
  if (probed.join() !== answer.join()) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  if (raw.length !== answer[1] + 1) {
    throw new Error("조회한 걸음 수가 짝의 뒤 인덱스 + 1 과 다르다");
  }
  const looks = raw.map((s, n): Look => {
    const same = JSON.stringify(mapByDefinition(nums, s.j));
    if (JSON.stringify(s.before) !== same) {
      throw new Error(`j = ${s.j} 에서 조회 직전 해시 맵이 정의와 다르다`);
    }
    const next = raw[n + 1];
    return { ...s, after: next === undefined ? s.before : next.before };
  });
  return { looks, answer };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK: readonly number[] = [5, 8, 3, 8, 12, 2];
export const WALK_T = 10;

/** 과제 규모 — 배열 길이의 상한과 값의 범위. */
export const N_MAX = 100_000;
const VALUE_MIN = -1_000_000_000;
const VALUE_MAX = 1_000_000_000;

const num = (x: number): string => x.toLocaleString("en-US");
const fixed2 = (x: number): string =>
  (Math.round(x * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
/** 단순 연산 1 초에 1 억 번 기준. */
const secondsOf = (ops: number): string => `${fixed2(ops / 1e8)} 초`;

const showMap = (entries: readonly Entry[]): string =>
  entries.length === 0
    ? "비어 있음"
    : entries.map(([k, v]) => `${k}→${v}`).join(" · ");

/**
 * 짝이 맨 끝 두 자리에만 있는 입력(증명 사이드카의 최악 입력과 같은 식). 앞 `n−2` 칸은 짝수,
 * 끝 두 칸은 `2n+1` 과 `2n`, 목표 합은 `4n+1` 이다.
 */
function worstInput(n: number): { nums: number[]; target: number } {
  const nums = Array.from({ length: n - 2 }, (_, k) => 2 * k);
  nums.push(2 * n + 1, 2 * n);
  return { nums, target: 4 * n + 1 };
}

/** 이중 반복의 비교 수 — 뒤 원소마다 앞 원소를 차례로 더해 본다. */
function pairCompares(nums: readonly number[], target: number): number {
  let cmp = 0;
  for (let j = 0; j < nums.length; j++) {
    for (let i = 0; i < j; i++) {
      cmp++;
      if ((nums[i] as number) + (nums[j] as number) === target) return cmp;
    }
  }
  return cmp;
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

export function approaches(): Approach[] {
  // 이중 반복의 비교 수는 식 n(n−1)/2 로 적되, 식이 실측과 같은지 작은 규모에서 확인한다.
  const pairs = (n: number): number => (n * (n - 1)) / 2;
  for (const n of [6, 1_000]) {
    const w = worstInput(n);
    if (pairCompares(w.nums, w.target) !== pairs(n)) {
      throw new Error(`n = ${n} 에서 이중 반복의 비교 수가 식과 다르다`);
    }
  }
  const cells = VALUE_MAX - VALUE_MIN + 1;
  const big = worstInput(N_MAX);
  const c = counted(big.nums, big.target);
  return [
    {
      name: "모든 짝 맞춰 보기",
      idea: "뒤 원소마다 앞 원소를 처음부터 하나씩 더해 target 과 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = ${num(N_MAX)} 에서 비교 ${num(pairs(N_MAX))} 번 · ${secondsOf(pairs(N_MAX))}`,
          ok: false,
        },
      ],
      lesson:
        "안쪽 반복은 보수 하나를 찾고 있다 — 앞 원소를 값으로 바로 찾게 적어 두면 어떨까",
    },
    {
      name: "값을 칸 번호로 쓰는 배열",
      idea: "pos[v] 에 값 v 의 인덱스를 적고, 보수의 칸 하나만 읽는다",
      verdict: "drop",
      checks: [
        { label: "시간", value: "원소마다 칸 하나를 읽는다", ok: true },
        {
          label: "메모리",
          value: `값이 −10^9 이상 10^9 이하면 칸 ${num(cells)} 개 · ${fixed2((cells * 8) / 1024 ** 3)} GiB`,
          ok: false,
        },
      ],
      lesson:
        "칸 수가 원소 수가 아니라 값의 범위로 정해진다 — 적어 둔 원소 수만큼만 칸을 쓰면 어떨까",
    },
    {
      name: "해시 맵에서 보수 조회",
      idea: "지나온 원소를 값 → 인덱스로 해시 맵에 적고, 원소마다 보수를 한 번 조회한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = ${num(N_MAX)} 에서 해시 맵 연산 ${num(c.gets + c.sets)} 번`,
          ok: true,
        },
        {
          label: "메모리",
          value: `해시 맵 항목 ${num(c.size)} 개`,
          ok: true,
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
  readonly look: Look;
  readonly calc: { readonly expr: string; readonly result: string };
}

/** 전개의 걸음 — 원소마다 한 걸음. */
export function walkSteps(
  nums: readonly number[] = WALK,
  target: number = WALK_T,
): Step[] {
  const t = trace(nums, target);
  return t.looks.map((s, n): Step => {
    const hit = s.found !== undefined;
    const old = s.before.find(([k]) => k === s.x)?.[1];
    const record =
      old === undefined
        ? `키 ${s.x}${을를(s.x)} 인덱스 ${s.j}${으로(s.j)} 새로 적습니다.`
        : `키 ${s.x} 의 인덱스를 ${old} 에서 ${s.j}${으로(s.j)} 바꿉니다.`;
    const detail = hit
      ? `nums[${s.j}] = ${s.x} 의 보수 ${s.want}${이가(s.want)} 해시 맵에 있어 인덱스 ${s.found}${이가(s.found as number)} 나옵니다. [${s.found}, ${s.j}]${을를(s.j)} 돌려줍니다.`
      : `nums[${s.j}] = ${s.x} 의 보수 ${s.want}${이가(s.want)} 해시 맵에 없습니다. ${record}`;
    return {
      id: `T${n + 1}`,
      title: `j = ${s.j}`,
      detail,
      look: s,
      calc: {
        expr: `seen.get(${target} − ${s.x})`,
        result: hit ? String(s.found) : "undefined",
      },
    };
  });
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "nums",
  rangeLabel: "본 원소",
};

/** 해시 맵이 가장 커졌을 때의 키 수 — 무대가 첫 걸음부터 잡는 자리 수. */
const slotsOf = (steps: readonly Step[]): number =>
  Math.max(...steps.map((s) => s.look.after.length));

/** 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
export function arrayStep(
  s: Step,
  slots: number,
  nums: readonly number[] = WALK,
): ArrayStep {
  const { j, x, want, found, after } = s.look;
  const hit = found !== undefined;
  return {
    array: [...nums],
    range: [0, j],
    read: [j],
    write: hit ? [found, j] : [],
    calc: { ...s.calc },
    vars: null,
    map: {
      keyLabel: "seen 키",
      valueLabel: "인덱스",
      entries: after.map(([k, v]) => [k, v] as const),
      slots,
      read: hit ? [want] : [],
      write: hit ? [] : [x],
      note: hit
        ? `찾는 키 ${want} · 인덱스 ${found}`
        : `찾는 키 ${want} · 없음`,
    },
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `twoSum-guide.test.ts` 가 잰다.
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

/* ───────────────────────── 그림 ───────────────────────── */

/** 인덱스 · nums · 보수 세 줄. */
function complementRows(
  nums: readonly number[],
  target: number,
  readNums: readonly number[],
  readWant: readonly number[],
): StageRow[] {
  const numStates: Partial<Record<number, CellState>> = {};
  for (const k of readNums) numStates[k] = "read";
  const wantStates: Partial<Record<number, CellState>> = {};
  for (const k of readWant) wantStates[k] = "read";
  return [
    { kind: "index", label: "인덱스" },
    { kind: "cells", label: "nums", values: [...nums], states: numStates },
    {
      kind: "cells",
      label: "보수",
      values: nums.map((x) => target - x),
      states: wantStates,
      side: `${target} − x`,
    },
    { kind: "caret", cells: [...readNums] },
  ];
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-complement": () => {
    const t = trace(WALK, WALK_T);
    const last = t.looks.at(-1) as Look;
    // 마지막 원소의 보수와 같은 값이 앞에 놓인 칸 전부.
    const same = WALK.slice(0, last.j).flatMap((v, k) =>
      v === last.want ? [k] : [],
    );
    return (
      <CellStage
        title={`원소마다 보수가 하나로 정해진다 — 인덱스 ${last.j} 의 보수 ${last.want} 는 앞의 칸 ${same.join(" · ")} 에 있다`}
        rows={complementRows(WALK, WALK_T, same, [last.j])}
        columns={WALK.length}
      />
    );
  },
  "concept-lookup": () => {
    const t = trace(WALK, WALK_T);
    const last = t.looks.at(-1) as Look;
    const numStates: Partial<Record<number, CellState>> = { [last.j]: "read" };
    for (let k = last.j + 1; k < WALK.length; k++) numStates[k] = "out";
    const rows: StageRow[] = [
      {
        kind: "bracket",
        label: "해시 맵에 적은 원소",
        from: 0,
        to: last.j - 1,
        tone: "query",
        text: `[0,${last.j - 1}]`,
      },
      { kind: "index", label: "인덱스" },
      { kind: "cells", label: "nums", values: [...WALK], states: numStates },
      { kind: "caret", cells: [last.j], side: `보수 ${last.want}` },
      ...keyValueRows({
        keyLabel: "seen 키",
        valueLabel: "인덱스",
        entries: last.before,
        read: [last.want],
        note: `찾는 키 ${last.want} · 인덱스 ${last.found}`,
      }),
    ];
    return (
      <CellStage
        title={`인덱스 ${last.j} 에서 보수 ${last.want}${을를(last.want)} 조회한다 — 해시 맵에는 앞 원소만 들어 있다`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`n 최대 ${num(N_MAX)} · 값 −10^9 이상 10^9 이하 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-map-final": () => {
    const t = trace(WALK, WALK_T);
    const last = t.looks.at(-1) as Look;
    // 같은 값이 두 번 이상 나온 키 — 나중 인덱스가 남는 자리.
    const dupKey = last.before.find(
      ([k]) => WALK.slice(0, last.j).filter((v) => v === k).length > 1,
    );
    if (dupKey === undefined) throw new Error("전개 입력에 같은 값이 없다");
    const [key, idx] = dupKey;
    const cells = WALK.slice(0, last.j).flatMap((v, k) =>
      v === key ? [k] : [],
    );
    const numStates: Partial<Record<number, CellState>> = {};
    for (const k of cells) numStates[k] = "read";
    for (let k = last.j; k < WALK.length; k++) numStates[k] = "out";
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      {
        kind: "cells",
        label: "nums",
        values: [...WALK],
        states: numStates,
        side: `값 ${key}${은는(key)} 칸 ${cells.join(" · ")}`,
      },
      { kind: "caret", cells },
      ...keyValueRows({
        keyLabel: "seen 키",
        valueLabel: "인덱스",
        entries: last.before,
        write: [key],
        note: `키 ${key} 에는 나중 인덱스 ${idx}`,
      }),
    ];
    return (
      <CellStage
        title={`짝을 찾은 순간의 해시 맵 — 키는 원소의 값, 값은 그 값이 마지막으로 나온 인덱스(${showMap(last.before)})`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "walk-loop": () => {
    const t = trace(WALK, WALK_T);
    return (
      <CellStage
        title={`원소마다 걸음 하나 — T1~T${t.looks.length}`}
        rows={[
          {
            kind: "index",
            label: "걸음",
            labels: t.looks.map((_, n) => `T${n + 1}`),
          },
          { kind: "index", label: "j" },
          {
            kind: "cells",
            label: "x",
            values: t.looks.map((s) => s.x),
          },
        ]}
        columns={t.looks.length}
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
        title={`twoSum([${WALK.join(", ")}], ${WALK_T}) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(steps[0] as Step, slots))}
        frames={frames}
      />
    );
  },
  "invariant-prefix": () => {
    const t = trace(WALK, WALK_T);
    // 덮어쓴 뒤 처음 조회하는 걸음 — 키마다 「마지막 인덱스」가 드러나는 자리.
    const s = t.looks.find((_, n) => {
      const prev = t.looks[n - 1];
      return prev?.before.some(([k]) => k === prev.x) === true;
    });
    if (s === undefined) throw new Error("덮어쓴 걸음이 없다");
    const numStates: Partial<Record<number, CellState>> = { [s.j]: "read" };
    for (let k = s.j + 1; k < WALK.length; k++) numStates[k] = "out";
    const rows: StageRow[] = [
      {
        kind: "bracket",
        label: "앞 원소",
        from: 0,
        to: s.j - 1,
        tone: "query",
        text: `nums[0..${s.j - 1}]`,
      },
      { kind: "index", label: "인덱스" },
      { kind: "cells", label: "nums", values: [...WALK], states: numStates },
      { kind: "caret", cells: [s.j], side: `j = ${s.j} · 조회 직전` },
      ...keyValueRows({
        keyLabel: "seen 키",
        valueLabel: "인덱스",
        entries: s.before,
        note: `키 ${s.before.length} 개 = 앞 원소의 서로 다른 값 ${new Set(WALK.slice(0, s.j)).size} 개`,
      }),
    ];
    return (
      <CellStage
        title={`j = ${s.j} 를 조회하기 직전 — 키는 nums[0..${s.j - 1}] 의 값 전부, 값은 그 값의 마지막 인덱스`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
};
