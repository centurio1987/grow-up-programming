/**
 * `subsetSum-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 칸 하나를 정하는 자리마다 무엇을
 * 읽었는지는 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록하고, 답은 정본이 낸다. 걸음 재생
 * 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `subsetSum-guide.test.ts` 가 잰다.
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
  type TableCell,
  type TableOptions,
  type TableStep,
  tableStage,
} from "../../../_viz/player/tableStage";
import { subsetSum } from "./subsetSum-guide.ref.ts";

const REF = new URL("./subsetSum-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 칸 하나를 정하기 직전에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 기록은 줄 두 개(`prev`·`cur`)를 가리키기만 하고, 값은 호출이 끝난
 * 뒤 읽는다. 칸은 한 번만 쓰이므로 끝난 뒤의 값이 곧 그 칸을 정한 순간의 값이다.
 */
const probed = await loadMutant<{
  subsetSum(nums: number[], target: number): boolean;
}>(REF, {
  swap: [
    /^(\s*)if \(t < a\) \{$/,
    "$1(globalThis as any).__cells.push({ i, t, a, prev, cur });\n$1if (t < a) {",
  ],
});

/**
 * 첫 칸을 정한 직후의 DP 테이블을 붙잡는 사본 — 역시 정본 소스에서 기계로 만든다. 그 순간의 사본
 * (`__init`)과 DP 테이블 자체(`__dp`)를 남기므로, 첫 줄을 깐 모습과 호출이 끝난 모습을 둘 다 정본의
 * 실행에서 받는다. 원소가 없어 칸을 하나도 정하지 않는 입력도 이 사본으로 DP 테이블을 본다.
 */
const probedTable = await loadMutant<{
  subsetSum(nums: number[], target: number): boolean;
}>(REF, {
  swap: [
    /^(\s*)\(dp\[0\] as boolean\[\]\)\[0\] = true;$/,
    "$1(dp[0] as boolean[])[0] = true;\n$1(globalThis as any).__init = dp.map((r) => [...r]);\n$1(globalThis as any).__dp = dp;",
  ],
});

/** 칸 하나를 정한 기록. */
export interface Cell {
  readonly i: number;
  readonly t: number;
  readonly a: number;
  /** `copy` ② 이 원소를 못 쓴다 · `or` ③ 안 고른 경우 또는 고른 경우. */
  readonly branch: "copy" | "or";
  readonly value: boolean;
  /** 읽은 칸과 그 값 — `copy` 는 윗 칸 하나, `or` 는 윗 칸과 윗 줄의 `a` 칸 왼쪽. */
  readonly reads: readonly {
    readonly at: TableCell;
    readonly value: boolean;
  }[];
}

export interface Trace {
  readonly cells: readonly Cell[];
  /** 호출이 끝난 뒤의 DP 테이블 전체(`dp[0]` 부터 `dp[n]` 까지). */
  readonly rows: readonly (readonly boolean[])[];
  /** 첫 칸을 정한 직후의 DP 테이블 — 아직 안 정한 줄은 `fill(false)` 가 둔 거짓이다. */
  readonly init: readonly (readonly boolean[])[];
  readonly result: boolean;
}

/** 정본 한 번 호출의 기록. 답은 정본과 대조하고, 칸마다 전이식이 실제로 성립했는지도 대조한다. */
export function trace(nums: readonly number[], target: number): Trace {
  const g = globalThis as unknown as {
    __init: boolean[][];
    __dp: boolean[][];
    __cells: {
      i: number;
      t: number;
      a: number;
      prev: boolean[];
      cur: boolean[];
    }[];
  };
  g.__cells = [];
  const result = probed.subsetSum([...nums], target);
  const want = subsetSum([...nums], target);
  if (result !== want) {
    throw new Error(
      `계측 사본이 정본과 다른 답을 냈다 — [${nums.join(", ")}] / ${target}: ${result} ≠ ${want}`,
    );
  }
  const raw = g.__cells;
  const n = nums.length;
  if (probedTable.subsetSum([...nums], target) !== want) {
    throw new Error("DP 테이블을 붙잡는 사본이 정본과 다른 답을 냈다");
  }
  const init = g.__init.map((r) => [...r]);
  const rows = g.__dp.map((r) => [...r]);
  // 두 사본은 따로 실행된다. 칸마다 적힌 값이 같은지 맞대어 둘이 같은 실행을 본 것인지 확인한다.
  for (const { i, t, cur } of raw) {
    if (cur[t] !== rows[i]?.[t]) {
      throw new Error(`두 사본의 dp[${i}][${t}] 가 다르다`);
    }
  }
  const cells: Cell[] = raw.map(({ i, t, a, prev, cur }) => {
    const value = cur[t] as boolean;
    const up = prev[t] as boolean;
    if (t < a) {
      if (value !== up) throw new Error(`dp[${i}][${t}] 가 윗 칸과 다르다`);
      return {
        i,
        t,
        a,
        branch: "copy",
        value,
        reads: [{ at: [i - 1, t], value: up }],
      };
    }
    const left = prev[t - a] as boolean;
    if (value !== (up || left)) {
      throw new Error(`dp[${i}][${t}] 가 두 칸의 「또는」과 다르다`);
    }
    return {
      i,
      t,
      a,
      branch: "or",
      value,
      reads: [
        { at: [i - 1, t], value: up },
        { at: [i - 1, t - a], value: left },
      ],
    };
  });
  // 칸을 정한 차례가 줄 → 합 오름차순인가. 아니면 걸음 번호가 코드의 차례와 어긋난다.
  cells.forEach((cell, k) => {
    const i = Math.floor(k / (target + 1)) + 1;
    const t = k % (target + 1);
    if (cell.i !== i || cell.t !== t) {
      throw new Error(`${k} 번째로 정한 칸이 dp[${i}][${t}] 가 아니다`);
    }
  });
  if ((rows[n]?.[target] ?? null) !== result) {
    throw new Error("오른쪽 아래 칸이 반환값과 다르다");
  }
  return { cells, rows, init, result };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const NUMS = [3, 34, 4, 12, 5, 2];
export const TARGET = 9;

/** 과제 규모 — 원소 수 `n`, 원소 값, 목표 합 `T` 의 위 끝. */
export const N_MAX = 1000;
export const A_MAX = 10_000;
export const T_MAX = 10_000;

/** 참/거짓을 본문 표기로 적는다. */
export const yn = (b: boolean): string => (b ? "참" : "거짓");

/**
 * 그림 칸에 적는 참/거짓 — 참만 글자로 적고 거짓은 「·」로 둔다. 칸 무대는 읽음 · 새로 씀 · 이번 걸음
 * 밖만 칠해서 「참」과 「거짓」을 같은 글자 칸으로 그리면 참인 칸이 눈에 안 띈다. `null`(아직 안 정한
 * 칸, 점선)과 섞이지 않게 거짓도 빈 값이 아니라 글자 하나를 둔다.
 */
export const mark = (b: boolean): string => (b ? "참" : "·");

/** `10011001` → `10,011,001`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
export const comma = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** `2^53` 을 넘는 값은 자릿수로 적는다 — `1.07e+301` → `1.07 × 10^301`. */
export const big = (n: bigint): string => {
  if (n <= 9_007_199_254_740_991n) return comma(n);
  const [m, e] = Number(n).toExponential(2).split("e+");
  return `${m} × 10^${e}`;
};

/** 한 줄에서 참인 열 — 그 줄에서 만들 수 있는 합의 모임이다. */
export const trueCols = (row: readonly (boolean | null)[]): number[] =>
  row.flatMap((v, t) => (v === true ? [t] : []));

/** `{0, 3, 4, 7}` 꼴. */
export const setText = (xs: readonly number[]): string => `{${xs.join(", ")}}`;

/** 줄 머리 — `i` 와 그 줄에서 새로 보는 원소 `a`. */
export const rowHead = (nums: readonly number[], i: number): string =>
  i === 0 ? "i=0" : `i=${i} · a=${nums[i - 1]}`;

/** 줄 곁말 — 그 줄에서 만들 수 있는 합. */
export const rowSums = (row: readonly boolean[]): string =>
  `합 ${trueCols(row).join(" ")}`;

/** 2 차원 표 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const TABLE_OPTIONS: TableOptions = {
  rowHeads: Array.from({ length: NUMS.length + 1 }, (_, i) => rowHead(NUMS, i)),
  colHeads: Array.from({ length: TARGET + 1 }, (_, t) => t),
  colLabel: "합 t",
};

/**
 * 합 하나만 상태로 두는 방식 — 한 줄짜리 배열을 **오름차순**으로 채운다. 정본과 다른 절차라 여기
 * 따로 적고, 본문은 이 방식이 정본과 **다른 값**을 낸다는 것을 보인다. 배열 `dp1[t]` 는 원소를 몇
 * 번이든 써서 합 `t` 를 만들 수 있는가다.
 */
export function oneRowAscending(
  nums: readonly number[],
  target: number,
): boolean[] {
  const dp = new Array<boolean>(target + 1).fill(false);
  dp[0] = true;
  for (const a of nums) {
    for (let t = a; t <= target; t++) if (dp[t - a]) dp[t] = true;
  }
  return dp;
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly step: TableStep;
}

/** 걸음 하나가 정한 칸 — 한 줄에서 같은 갈래로 정한 칸을 한 걸음에 묶는다. */
export interface Segment {
  readonly i: number;
  readonly a: number;
  readonly branch: "copy" | "or";
  readonly cells: readonly Cell[];
}

/** 칸 기록을 줄과 갈래로 묶는다. 한 줄은 ② 한 토막 뒤에 ③ 한 토막이다(`t < a` 가 앞쪽이다). */
export function segments(t: Trace): Segment[] {
  const out: Segment[] = [];
  for (const cell of t.cells) {
    const last = out.at(-1);
    if (last && last.i === cell.i && last.branch === cell.branch) {
      (last.cells as Cell[]).push(cell);
    } else {
      out.push({ i: cell.i, a: cell.a, branch: cell.branch, cells: [cell] });
    }
  }
  return out;
}

const cellName = ([r, c]: TableCell): string => `dp[${r}][${c}]`;
const span = (s: Segment): string => {
  const first = s.cells[0]?.t ?? 0;
  const last = s.cells.at(-1)?.t ?? 0;
  return first === last ? `t = ${first}` : `t = ${first} … ${last}`;
};

/** 걸음 전부 — 첫 줄을 까는 한 걸음 + 줄마다 갈래 토막 하나씩 + 답을 읽는 한 걸음. */
export function walkSteps(): Step[] {
  const t = trace(NUMS, TARGET);
  const n = NUMS.length;
  const rows: (string | null)[][] = t.init.map((row, i) =>
    i === 0 ? row.map(mark) : row.map(() => null),
  );
  const snapshot = () => rows.map((r) => [...r]);
  const steps: Step[] = [];
  let k = 1;
  const first = t.init[0] as readonly boolean[];
  steps.push({
    id: `T${k++}`,
    title: "dp[0][0] = 참 ①",
    detail: `DP 테이블을 ${n + 1} 줄 × ${TARGET + 1} 칸으로 만들고 거짓으로 채운 뒤 dp[0][0] 에 참을 둡니다. i=0 줄에서 참인 열은 ${setText(trueCols(first))} 입니다.`,
    step: {
      table: snapshot(),
      write: [[0, 0]],
      calc: { expr: "dp[0][0] =", result: yn(first[0] as boolean) },
    },
  });
  for (const seg of segments(t)) {
    const row = rows[seg.i] as (string | null)[];
    for (const cell of seg.cells) row[cell.t] = mark(cell.value);
    const reads: TableCell[] = [];
    for (const cell of seg.cells) {
      for (const r of cell.reads) {
        if (!reads.some(([x, y]) => x === r.at[0] && y === r.at[1])) {
          reads.push(r.at);
        }
      }
    }
    reads.sort((p, q) => p[1] - q[1]);
    const trues = seg.cells.filter((c) => c.value).map((c) => c.t);
    const fresh = seg.cells
      .filter((c) => c.value && c.reads[0]?.value === false)
      .map((c) => c.t);
    const first = seg.cells[0]?.t ?? 0;
    const last = seg.cells.at(-1)?.t ?? 0;
    const range = first === last ? `${first}` : `${first}…${last}`;
    const expr =
      seg.branch === "copy"
        ? `dp[${seg.i}][${range}] = dp[${seg.i - 1}][${range}] →`
        : `dp[${seg.i - 1}][t] 또는 dp[${seg.i - 1}][t−${seg.a}] (t = ${range}) →`;
    const result =
      trues.length === 0 ? "참인 열 없음" : `참인 열 ${trues.join(" ")}`;
    const detail =
      seg.branch === "copy"
        ? `a = ${seg.a} 이고 ${span(seg)} 에서 t < ${seg.a}${이가(seg.a)} 참이라 ② 윗 칸을 옮깁니다. 이 토막에서 참인 칸은 ${trues.length === 0 ? "없습니다" : `t = ${trues.join(" · ")} 입니다`}.`
        : `a = ${seg.a} 이고 ${span(seg)} 에서 t < ${seg.a}${이가(seg.a)} 거짓이라 ③ 윗 칸과 윗 줄 ${seg.a} 칸 왼쪽을 「또는」으로 잇습니다. 윗 칸은 거짓인데 ${seg.a} 칸 왼쪽이 참이라 새로 참이 된 칸은 ${fresh.length === 0 ? "없습니다" : `t = ${fresh.join(" · ")} 입니다`}.`;
    steps.push({
      id: `T${k++}`,
      title: `i=${seg.i} · ${span(seg)} ${seg.branch === "copy" ? "②" : "③"}`,
      detail,
      step: {
        table: snapshot(),
        read: reads,
        write: seg.cells.map((c) => [c.i, c.t] as TableCell),
        calc: { expr, result },
      },
    });
  }
  steps.push({
    id: `T${k++}`,
    title: `dp[${n}][${TARGET}] = ${yn(t.result)} 반환`,
    detail: `오른쪽 아래 칸 dp[${n}][${TARGET}] 를 읽어 돌려줍니다. 답은 ${yn(t.result)} 입니다.`,
    step: {
      table: snapshot(),
      read: [[n, TARGET]],
      calc: { expr: `dp[${n}][${TARGET}] =`, result: yn(t.result) },
    },
  });
  return steps;
}

/** 필름과 패널을 가르는 자리 — 앞쪽은 i=3 줄까지, 뒤쪽은 i=4 줄부터 답까지. */
export const SPLIT_ROW = 3;

export function walkParts(): { upper: Step[]; lower: Step[] } {
  const all = walkSteps();
  const t = trace(NUMS, TARGET);
  const segs = segments(t);
  const cut = 1 + segs.filter((s) => s.i <= SPLIT_ROW).length;
  return { upper: all.slice(0, cut), lower: all.slice(cut) };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `subsetSum-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const toStep = (s: Step) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...s.step,
  });
  const p = walkParts();
  return { upper: p.upper.map(toStep), lower: p.lower.map(toStep) };
}

const film = (steps: Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: tableStage(s.step, TABLE_OPTIONS),
  }));

/* ───────────────── 정적 한 장 ───────────────── */

/** 다 채운 DP 테이블 한 장 — 줄 곁말은 그 줄에서 만들 수 있는 합이다. */
function fullTable(extra: Partial<TableStep>): StageRow[] {
  const t = trace(NUMS, TARGET);
  return tableStage(
    {
      table: t.rows.map((r) => r.map(mark)),
      rowSide: t.rows.map((r) => rowSums(r)),
      ...extra,
    },
    TABLE_OPTIONS,
  );
}

/** 칸 하나를 정한 기록 — 본문이 짚는 칸을 기록에서 찾는다. */
export function cellOf(i: number, t: number): Cell {
  const cell = trace(NUMS, TARGET).cells.find((c) => c.i === i && c.t === t);
  if (!cell) throw new Error(`dp[${i}][${t}] 의 기록이 없다`);
  return cell;
}

function ruleFrame(i: number, t: number): StageFrame {
  const cell = cellOf(i, t);
  const [up, left] = cell.reads;
  const text =
    cell.branch === "copy"
      ? `${cellName([i, t])} = ${cellName(up?.at as TableCell)} = ${yn(cell.value)} — ${t} < ${cell.a} 라 윗 칸만 읽는다`
      : `${cellName([i, t])} = ${cellName(up?.at as TableCell)} 또는 ${cellName(left?.at as TableCell)} = ${yn(up?.value ?? false)} 또는 ${yn(left?.value ?? false)} = ${yn(cell.value)}`;
  return {
    id: cell.branch === "copy" ? "②" : "③",
    text,
    rows: fullTable({
      read: cell.reads.map((r) => r.at),
      write: [[i, t]],
    }),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

/** 과제 규모에서 부분집합 수 — `2^n`. */
export const subsetsAtMax = (): bigint => 2n ** BigInt(N_MAX);
/** 과제 규모에서 DP 테이블의 칸 수 — `(n+1)(T+1)`. */
export const cellsAtMax = (): number => (N_MAX + 1) * (T_MAX + 1);
/** 한 줄짜리 방식이 틀리는 입력. */
export const ONE_ROW_TARGET = 30;

function approaches(): Approach[] {
  const oneRow = oneRowAscending(NUMS, ONE_ROW_TARGET)[
    ONE_ROW_TARGET
  ] as boolean;
  const right = subsetSum(NUMS, ONE_ROW_TARGET);
  return [
    {
      name: "부분집합을 하나씩 만들어 보기",
      idea: "원소마다 고를지 말지를 정한 조합을 전부 만들고, 합이 목표와 같은 것을 찾는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `원소 ${comma(N_MAX)} 개면 부분집합 ${big(subsetsAtMax())} 개`,
          ok: false,
        },
      ],
      lesson:
        "합이 같은 부분집합은 앞으로 할 수 있는 일도 같다 — 합만 적어 두면 어떨까",
    },
    {
      name: "만들 수 있는 합 하나만 기억하기",
      idea: "합 t 를 만들 수 있는지를 한 줄에 적고, 원소를 차례로 넣어 본다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `[${NUMS.join(", ")}] / ${ONE_ROW_TARGET} 에서 정본은 ${yn(right)}, 이 방식은 ${yn(oneRow)}`,
          ok: false,
        },
        { label: "시간", value: `칸 ${comma(T_MAX + 1)} 개`, ok: true },
      ],
      lesson:
        "방금 넣은 원소를 같은 줄에서 또 쓴다 — 어느 원소까지 봤는지를 함께 적으면 어떨까",
    },
    {
      name: "원소를 하나씩 늘리는 DP 테이블",
      idea: "(몇 번째 원소까지 봤나, 합) 칸에 그 합을 만들 수 있는지 적는다",
      verdict: "keep",
      checks: [
        { label: "답", value: `${yn(right)} — 맞다`, ok: true },
        { label: "시간", value: `칸 ${comma(cellsAtMax())} 개`, ok: true },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 한 줄짜리 방식과 DP 테이블의 한 줄을 같은 격자에 놓는다 — 원소 하나만 넣은 뒤다. */
function oneRowContrast(): StageRow[] {
  const nums = NUMS.slice(0, 1);
  const one = oneRowAscending(nums, TARGET);
  const row = trace(nums, TARGET).rows[1] as readonly boolean[];
  const states: Partial<Record<number, CellState>> = {};
  one.forEach((v, t) => {
    if (v !== row[t]) states[t] = "read";
  });
  return [
    { kind: "index", label: "합 t", labels: one.map((_, t) => t) },
    {
      kind: "cells",
      label: `한 줄만 · ${nums[0]} 뒤`,
      values: one.map(mark),
      states,
      side: rowSums(one),
    },
    {
      kind: "cells",
      label: `DP 테이블 i=1`,
      values: row.map(mark),
      states,
      side: rowSums(row),
    },
  ];
}

/** 한 줄이 윗 줄에서 어떻게 나오는가 — 윗 줄, 윗 줄을 `a` 칸 옮긴 것, 둘의 「또는」. */
export function sumsetRows(i: number): {
  up: readonly boolean[];
  shifted: readonly boolean[];
  row: readonly boolean[];
  a: number;
} {
  const t = trace(NUMS, TARGET);
  const up = t.rows[i - 1] as readonly boolean[];
  const row = t.rows[i] as readonly boolean[];
  const a = NUMS[i - 1] as number;
  const shifted = up.map((_, x) => x - a >= 0 && (up[x - a] as boolean));
  row.forEach((v, x) => {
    if (v !== ((up[x] as boolean) || (shifted[x] as boolean))) {
      throw new Error(`dp[${i}][${x}] 가 윗 줄과 옮긴 줄의 「또는」이 아니다`);
    }
  });
  return { up, shifted, row, a };
}

function sumsetFigure(i: number): StageRow[] {
  const { up, shifted, row, a } = sumsetRows(i);
  const grow: Partial<Record<number, CellState>> = {};
  row.forEach((v, x) => {
    if (v && !up[x]) grow[x] = "focus";
  });
  return [
    { kind: "index", label: "합 t", labels: row.map((_, x) => x) },
    {
      kind: "cells",
      label: `i=${i - 1} 줄`,
      values: up.map(mark),
      side: rowSums(up),
    },
    {
      kind: "cells",
      label: `${a}${을를(a)} 더한 합`,
      values: shifted.map(mark),
      side: rowSums(shifted),
    },
    {
      kind: "cells",
      label: `i=${i} 줄`,
      values: row.map(mark),
      states: grow,
      side: rowSums(row),
    },
  ];
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-table": () => (
    <CellStage
      title={`subsetSum([${NUMS.join(", ")}], ${TARGET}) 의 DP 테이블 — 줄은 본 원소, 열은 합`}
      rows={fullTable({})}
      columns={TARGET + 1}
    />
  ),
  "concept-rule": () => {
    const f = ruleFrame(NUMS.length - 1, TARGET);
    return (
      <CellStage
        title={`dp[${NUMS.length - 1}][${TARGET}] 를 정하는 자리 — ${f.text}`}
        rows={f.rows}
        columns={TARGET + 1}
      />
    );
  },
  "origin-one-row": () => (
    <CellStage
      title={`원소 ${NUMS[0]} 하나만 넣은 뒤 — 한 줄만 기억한 배열과 DP 테이블의 i=1 줄`}
      rows={oneRowContrast()}
      columns={TARGET + 1}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`원소 ${comma(N_MAX)} 개 · 목표 합 ${comma(T_MAX)} 까지`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-read-cell": () => {
    const i = 3;
    const x = 7;
    const t = trace(NUMS, TARGET);
    const out: TableCell[] = [];
    t.rows.forEach((row, r) => {
      row.forEach((_, c) => {
        if (r !== i || c !== x) out.push([r, c]);
      });
    });
    return (
      <CellStage
        title={`dp[${i}][${x}] — 원소 ${NUMS.slice(0, i).join(" · ")} 만 써서 합 ${x}${을를(x)} 정확히 만들 수 있는가`}
        rows={fullTable({ write: [[i, x]], out })}
        columns={TARGET + 1}
      />
    );
  },
  "build-neighbors": () => (
    <CellStageFilm
      title="칸 하나가 읽는 이웃 — 윗 칸과, 윗 줄에서 a 칸 왼쪽"
      columns={TARGET + 1}
      frames={[ruleFrame(NUMS.length - 1, TARGET), ruleFrame(2, 5)]}
    />
  ),
  "walk-upper": () => {
    const s = walkParts().upper;
    return (
      <CellStageFilm
        title={`subsetSum([${NUMS.join(", ")}], ${TARGET}) — ${s[0]?.id}~${s.at(-1)?.id} · 첫 줄부터 i=${SPLIT_ROW} 줄까지`}
        columns={TARGET + 1}
        frames={film(s)}
      />
    );
  },
  "walk-lower": () => {
    const s = walkParts().lower;
    return (
      <CellStageFilm
        title={`subsetSum([${NUMS.join(", ")}], ${TARGET}) — ${s[0]?.id}~${s.at(-1)?.id} · i=${SPLIT_ROW + 1} 줄부터 답까지`}
        columns={TARGET + 1}
        frames={film(s)}
      />
    );
  },
  "related-sumset": () => {
    const i = NUMS.length - 1;
    const { a } = sumsetRows(i);
    return (
      <CellStage
        title={`i=${i} 줄 = i=${i - 1} 줄 또는 (i=${i - 1} 줄을 ${a} 칸 옮긴 것)`}
        rows={sumsetFigure(i)}
        columns={TARGET + 1}
      />
    );
  },
};
