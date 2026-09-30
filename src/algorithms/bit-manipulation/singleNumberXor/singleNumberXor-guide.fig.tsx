/**
 * `singleNumberXor-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 한 칸을 겹치는 줄 뒤에 기록을 끼운
 * 계측 사본(`stepProbe`)을 정본 소스에서 기계로 만들고, 그 기록으로 바퀴마다의 `i` · `acc` 를 얻는다.
 * 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과
 * 같은지는 `singleNumberXor-guide.test.ts` 가 잰다.
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
} from "../../../_viz/patterns/CellStage";
import {
  type ArrayLayer,
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { singleNumberXor } from "./singleNumberXor-guide.ref.ts";

const REF = new URL("./singleNumberXor-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  singleNumberXor(nums: number[]): number;
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 한 칸을 겹치는 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다.
 */
const stepProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)acc \^= nums\[i\] as number;$/,
    "$1acc ^= nums[i] as number;\n$1(globalThis as any).__fold.push({ i, acc });",
  ],
});

/** 바퀴 한 번의 기록. */
export interface FoldRec {
  readonly i: number;
  readonly v: number;
  readonly before: number;
  readonly after: number;
}

/** 정본 한 번 호출의 기록. 답과 걸음 수를 정본·정의와 대조한다. */
export function trace(nums: readonly number[]): {
  folds: FoldRec[];
  answer: number;
} {
  const g = globalThis as unknown as { __fold: { i: number; acc: number }[] };
  g.__fold = [];
  const probed = stepProbe.singleNumberXor([...nums]);
  const answer = singleNumberXor([...nums]);
  if (probed !== answer) throw new Error("계측 사본이 정본과 다른 답을 냈다");
  if (g.__fold.length !== nums.length)
    throw new Error("바퀴 수가 배열 길이와 다르다");
  let before = 0;
  const folds = g.__fold.map((r): FoldRec => {
    const rec = { i: r.i, v: nums[r.i] as number, before, after: r.acc };
    before = r.acc;
    return rec;
  });
  return { folds, answer };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK = [4, 1, 2, 1, 2];
/** 「아이디어를 떠올리는 과정」의 입력. */
const ORIGIN = [1, 2, 1, 2, 7];
/** 전개 입력을 그리는 비트 폭. */
const BITS = 3;
/** 과제 규모에 가장 가까운 홀수 길이. */
const BIG_N = 999_999;

const num = (x: number): string => x.toLocaleString("en-US");
const fixed2 = (x: number): string =>
  (Math.round(x * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const seconds = (ops: number): string => {
  const s = ops / 1e8;
  return s < 0.01 ? "0.01 초 미만" : `${fixed2(s)} 초`;
};
const bin = (v: number): string => `${v.toString(2).padStart(BITS, "0")}₂`;
const bitAt = (v: number, j: number): number => Math.floor(v / 2 ** j) % 2;
const show = (nums: readonly number[]): string => `[${nums.join(", ")}]`;

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

/** 짝을 반씩 떨어뜨린 배열 — `[1, …, h, 1, …, h, n]`. */
function spread(n: number): number[] {
  const h = (n - 1) / 2;
  const half = Array.from({ length: h }, (_, k) => k + 1);
  return [...half, ...half, n];
}

/** 원소마다 배열 전체를 다시 세는 방법의 칸 읽기. */
function rescanReads(nums: readonly number[]): number {
  let reads = 0;
  for (const target of nums) {
    reads++;
    let c = 0;
    for (const x of nums) {
      reads++;
      if (x === target) c++;
    }
    if (c % 2 === 1) return reads;
  }
  return reads;
}

/** 맵으로 세기 — 칸 접근과 키 수, 그리고 끝난 뒤의 맵. */
function countMap(nums: readonly number[]): {
  access: number;
  entries: [number, number][];
  odd: number;
} {
  let access = 0;
  const m = new Map<number, number>();
  for (const v of nums) {
    access += 3;
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  const entries = [...m];
  let odd = Number.NaN;
  for (const [v, c] of entries) {
    access++;
    if (c % 2 === 1) {
      odd = v;
      break;
    }
  }
  return { access, entries, odd };
}

/** 홀짝만 남기는 집합이 가장 컸을 때의 크기. */
function togglePeak(nums: readonly number[]): number {
  const s = new Set<number>();
  let peak = 0;
  for (const v of nums) {
    if (s.has(v)) s.delete(v);
    else s.add(v);
    peak = Math.max(peak, s.size);
  }
  return peak;
}

export function approaches(): Approach[] {
  // 작은 길이에서 실제로 센 읽기가 N(N + 1) 과 같은지 확인하고, 큰 길이는 식으로 적는다.
  for (const n of [5, 11, 101, 1_001]) {
    if (rescanReads(spread(n)) !== n * (n + 1))
      throw new Error(`다시 세기의 읽기가 N(N + 1) 과 다르다 — N=${n}`);
  }
  const big = spread(BIG_N);
  if (singleNumberXor(big) !== BIG_N) throw new Error("정본의 답이 다르다");
  const rescan = BIG_N * (BIG_N + 1);
  const map = countMap(big);
  const peak = togglePeak(big);
  const xorReads = trace(big).folds.length;
  return [
    {
      name: "값마다 다시 세기",
      idea: "칸마다 배열 전체를 다시 읽어 그 값의 등장 횟수가 홀수인지 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `칸 읽기 ${num(rescan)} 번 · ${seconds(rescan)}`,
          ok: false,
        },
      ],
      lesson:
        "같은 값을 몇 번이고 처음부터 다시 센다 — 한 번 읽으며 값마다 횟수를 적어 두면 어떨까",
    },
    {
      name: "맵으로 횟수 세기",
      idea: "값을 키로, 등장 횟수를 값으로 적고 끝에 횟수가 홀수인 키를 찾는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `칸 접근 ${num(map.access)} 번 · ${seconds(map.access)}`,
          ok: true,
        },
        {
          label: "칸",
          value: `키 ${num(map.entries.length)} 개 — 답에 쓰는 것은 횟수의 홀짝뿐`,
          ok: false,
        },
      ],
      lesson: "정확한 횟수를 적어 놓고 홀짝만 쓴다 — 홀짝만 남기면 어떨까",
    },
    {
      name: "홀짝만 남기는 집합",
      idea: "처음 본 값은 넣고 다시 본 값은 빼서, 끝에 남은 하나를 답으로 낸다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "칸",
          value: `짝이 반씩 떨어지면 집합이 ${num(peak)} 칸까지 커진다`,
          ok: false,
        },
      ],
      lesson:
        "여전히 값마다 칸을 잡는다 — 모든 값의 홀짝을 수 하나에 겹쳐 적으면 어떨까",
    },
    {
      name: "XOR 누적",
      idea: "acc 하나에 칸을 차례로 XOR 로 겹친다. 같은 값을 두 번 겹치면 지워진다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `칸 읽기 ${num(xorReads)} 번 · ${seconds(xorReads)}`,
          ok: true,
        },
        { label: "칸", value: "acc 하나 — 길이와 상관없다", ok: true },
      ],
    },
  ];
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** 이 걸음이 읽은 칸. 준비 걸음은 `-1`, 끝 걸음은 `N`. */
  readonly i: number;
  /** 이 걸음이 끝난 뒤의 acc. */
  readonly acc: number;
  readonly calc: { readonly expr: string; readonly result: string };
}

/** 자리 `j` 가 바뀌었는가. */
const flipped = (a: number, b: number, j: number): boolean =>
  bitAt(a, j) !== bitAt(b, j);

export function walkSteps(nums: readonly number[] = WALK): Step[] {
  const t = trace(nums);
  const n = nums.length;
  const steps: Step[] = [
    {
      id: "T1",
      title: "준비",
      detail:
        "acc 를 항등원 0 으로 둡니다. 아직 아무 칸도 읽지 않았고, 0 을 겹친 값은 그 값 그대로라 첫 칸이 변형 없이 들어옵니다.",
      i: -1,
      acc: 0,
      calc: { expr: "acc = 0", result: bin(0) },
    },
  ];
  for (const f of t.folds) {
    const changes: string[] = [];
    for (let j = BITS - 1; j >= 0; j--) {
      if (flipped(f.before, f.after, j))
        changes.push(
          `자리 ${j}${이가(j)} ${bitAt(f.after, j) === 1 ? "켜집니다" : "꺼집니다"}`,
        );
    }
    const seen = nums.slice(0, f.i).includes(f.v);
    const why = seen
      ? `${f.v}${이가(f.v)} 두 번째로 나와 앞에서 켠 자리를 다시 끕니다`
      : `${f.v}${이가(f.v)} 처음 나와 그 값의 1 인 자리를 켭니다`;
    steps.push({
      id: `T${f.i + 2}`,
      title: `i = ${f.i} · ${f.v}${을를(f.v)} 겹친다`,
      detail: `${why}. ${changes.join(", ")}. acc 는 ${f.after} 입니다.`,
      i: f.i,
      acc: f.after,
      calc: {
        expr: `${bin(f.before)} ^ ${bin(f.v)}`,
        result: `${bin(f.after)} = ${f.after}`,
      },
    });
  }
  steps.push({
    id: `T${n + 2}`,
    title: `i = ${n} · 끝`,
    detail: `i 가 ${n}${이가(n)} 되어 i < N 이 거짓입니다. 짝수 번 나온 값의 자리는 모두 꺼졌고, 남은 acc ${t.answer}${을를(t.answer)} 돌려줍니다.`,
    i: n,
    acc: t.answer,
    calc: { expr: `${n} < ${n}`, result: `거짓 → ${t.answer} 반환` },
  });
  return steps;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "nums",
  rangeLabel: "읽은 칸",
};

/**
 * 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로. 칸 `c` 아래의 층 셋은 `nums[c]` 를 겹친 **뒤**의
 * acc 를 자리마다 적은 것이다 — 첫 걸음부터 칸을 모두 두고 아직 안 읽은 칸은 비운다. 이번 걸음에
 * 바뀐 자리만 새로 씀으로 칠하고, 끝 걸음은 돌려줄 마지막 칸을 읽음으로 칠한다.
 */
export function arrayStep(
  s: Step,
  steps: readonly Step[],
  nums: readonly number[] = WALK,
): ArrayStep {
  const n = nums.length;
  const done = Math.min(s.i, n - 1);
  const accAt = (c: number): number =>
    (steps.find((x) => x.i === c) as Step).acc;
  const layers: ArrayLayer[] = [2, 1, 0].map((j) => {
    const values = Array.from({ length: n }, (_, c) =>
      c <= done ? bitAt(accAt(c), j) : null,
    );
    const prev = s.i >= 1 && s.i < n ? accAt(s.i - 1) : 0;
    const write = s.i >= 0 && s.i < n && flipped(prev, s.acc, j) ? [s.i] : [];
    const read = s.i === n ? [n - 1] : [];
    return { name: `acc 자리 ${j}`, values, write, read };
  });
  return {
    array: [...nums],
    range: s.i < 0 ? null : [0, done],
    read: s.i >= 0 && s.i < n ? [s.i] : [],
    write: [],
    pointers: s.i < 0 ? {} : { i: s.i },
    calc: { ...s.calc },
    vars: null,
    layers,
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `singleNumberXor-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const steps = walkSteps();
  return {
    xorWalk: steps.map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...arrayStep(s, steps),
    })),
  };
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-columns": () => {
    const answer = singleNumberXor(WALK);
    const cols = [2, 1, 0];
    const rows: StageRow[] = [
      { kind: "index", label: "자리", labels: cols },
      ...WALK.map(
        (v, i): StageRow => ({
          kind: "cells",
          label: `nums[${i}] = ${v}`,
          values: cols.map((j) => bitAt(v, j)),
        }),
      ),
      {
        kind: "cells",
        label: "1 의 개수",
        values: cols.map((j) => WALK.filter((v) => bitAt(v, j) === 1).length),
      },
      {
        kind: "cells",
        label: "XOR 누적",
        values: cols.map((j) => bitAt(answer, j)),
        states: Object.fromEntries(
          cols.flatMap((j, c) =>
            bitAt(answer, j) === 1 ? [[c, "focus" as CellState]] : [],
          ),
        ),
        side: `= ${answer}`,
      },
    ];
    return (
      <CellStage
        title={`${show(WALK)} 를 자리별로 — 1 의 개수가 홀수인 자리만 XOR 누적에 1 로 남는다`}
        rows={rows}
        columns={cols.length}
      />
    );
  },
  "origin-count-map": () => {
    const m = countMap(ORIGIN);
    if (m.odd !== singleNumberXor(ORIGIN)) throw new Error("맵의 답이 다르다");
    const rows = arrayStage(
      {
        array: [...ORIGIN],
        range: [0, ORIGIN.length - 1],
        read: [],
        write: [],
        pointers: {},
        map: {
          keyLabel: "값",
          valueLabel: "센 횟수",
          entries: m.entries,
          read: [m.odd],
          note: `횟수가 홀수인 키 ${m.odd}`,
        },
      },
      ARRAY_OPTIONS,
    );
    return (
      <CellStage
        title={`${show(ORIGIN)} 를 다 읽은 뒤의 맵 — 값마다 정확한 횟수를 적었고, 답을 정한 것은 홀수인 횟수 하나`}
        rows={rows}
        columns={Math.max(ORIGIN.length, m.entries.length)}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`N = ${num(BIG_N)} · 짝을 반씩 떨어뜨린 배열 · 초당 단순 연산 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-bit-rows": () => {
    const answer = singleNumberXor(WALK);
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      { kind: "cells", label: "nums", values: [...WALK] },
      ...[2, 1, 0].map((j): StageRow => {
        const bits = WALK.map((v) => bitAt(v, j));
        const c = bits.filter((b) => b === 1).length;
        const states: Partial<Record<number, CellState>> = {};
        bits.forEach((b, i) => {
          if (b === 1) states[i] = "focus";
        });
        return {
          kind: "cells",
          label: `자리 ${j}`,
          values: bits,
          states,
          side: `1 이 ${c} 개 · ${c % 2 === 1 ? "홀수" : "짝수"} → 자리 ${j} = ${bitAt(answer, j)}`,
        };
      }),
    ];
    return (
      <CellStage
        title={`${show(WALK)} 를 자리마다 한 줄로 — 줄마다 1 의 개수의 홀짝이 XOR 누적의 그 자리`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "walk-xor": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.calc.expr} → ${s.calc.result}`,
      rows: arrayStage(arrayStep(s, steps), ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`singleNumberXor(${show(WALK)}) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(steps[0] as Step, steps))}
        frames={frames}
      />
    );
  },
};
