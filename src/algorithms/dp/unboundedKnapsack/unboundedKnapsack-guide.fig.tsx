/**
 * `unboundedKnapsack-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 칸 하나를 정하는 자리마다 무엇을
 * 읽었는지는 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록하고, 답은 정본이 낸다. 걸음 재생
 * 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `unboundedKnapsack-guide.test.ts` 가 잰다.
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
import { unboundedKnapsack } from "./unboundedKnapsack-guide.ref.ts";

const REF = new URL("./unboundedKnapsack-guide.ref.ts", import.meta.url)
  .pathname;

type Fn = { unboundedKnapsack(coins: number[], amount: number): number };

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 칸 하나를 정하기 직전에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 기록은 줄 두 개(`prev`·`cur`)를 가리키기만 하고, 값은 호출이 끝난
 * 뒤 읽는다. 칸은 한 번만 쓰이므로 끝난 뒤의 값이 곧 그 칸을 정한 순간의 값이다.
 */
const probed = await loadMutant<Fn>(REF, {
  swap: [
    /^(\s*)if \(a < c\) \{$/,
    "$1(globalThis as any).__cells.push({ i, a, c, prev, cur });\n$1if (a < c) {",
  ],
});

/**
 * 첫 칸을 정한 직후의 DP 테이블을 붙잡는 사본 — 역시 정본 소스에서 기계로 만든다. 그 순간의 사본
 * (`__init`)과 DP 테이블 자체(`__dp`)를 남기므로, 첫 줄을 깐 모습과 호출이 끝난 모습을 둘 다 정본의
 * 실행에서 받는다.
 */
const probedTable = await loadMutant<Fn>(REF, {
  swap: [
    /^(\s*)\(dp\[0\] as number\[\]\)\[0\] = 0;$/,
    "$1(dp[0] as number[])[0] = 0;\n$1(globalThis as any).__init = dp.map((r) => [...r]);\n$1(globalThis as any).__dp = dp;",
  ],
});

/** 칸 하나를 정한 기록. */
export interface Cell {
  readonly i: number;
  readonly a: number;
  readonly c: number;
  /** `copy` ② 이 액면가를 못 쓴다 · `skip` ③ 안 쓰는 쪽이 작거나 같다 · `take` ④ 한 개 더 쓰는 쪽이 작다. */
  readonly branch: "copy" | "skip" | "take";
  readonly value: number;
  /** 윗 칸 `dp[i-1][a]` 의 값. */
  readonly up: number;
  /** 한 개 더 쓰는 후보 `dp[i][a-c] + 1` — `copy` 면 없다. */
  readonly take: number | null;
  /** 읽은 칸 — `copy` 는 윗 칸 하나, 나머지는 윗 칸과 같은 줄의 `c` 칸 왼쪽. */
  readonly reads: readonly TableCell[];
}

export interface Trace {
  readonly cells: readonly Cell[];
  /** 호출이 끝난 뒤의 DP 테이블 전체(`dp[0]` 부터 `dp[n]` 까지). */
  readonly rows: readonly (readonly number[])[];
  /** 첫 칸을 정한 직후의 DP 테이블 — 아직 안 정한 줄은 `fill(Infinity)` 가 둔 ∞ 다. */
  readonly init: readonly (readonly number[])[];
  readonly result: number;
}

const traceCache = new Map<string, Trace>();

/** 정본 한 번 호출의 기록. 답은 정본과 대조하고, 칸마다 전이식이 실제로 성립했는지도 대조한다. */
export function trace(coins: readonly number[], amount: number): Trace {
  const key = `${coins.join(",")}/${amount}`;
  const hit = traceCache.get(key);
  if (hit) return hit;
  const g = globalThis as unknown as {
    __init: number[][];
    __dp: number[][];
    __cells: {
      i: number;
      a: number;
      c: number;
      prev: number[];
      cur: number[];
    }[];
  };
  g.__cells = [];
  const result = probed.unboundedKnapsack([...coins], amount);
  const want = unboundedKnapsack([...coins], amount);
  if (result !== want) {
    throw new Error(
      `계측 사본이 정본과 다른 답을 냈다 — [${coins.join(", ")}] / ${amount}: ${result} ≠ ${want}`,
    );
  }
  const raw = g.__cells;
  g.__cells = [];
  const n = coins.length;
  if (probedTable.unboundedKnapsack([...coins], amount) !== want) {
    throw new Error("DP 테이블을 붙잡는 사본이 정본과 다른 답을 냈다");
  }
  const init = g.__init.map((r) => [...r]);
  const rows = g.__dp.map((r) => [...r]);
  for (const { i, a, cur } of raw) {
    if (cur[a] !== rows[i]?.[a]) {
      throw new Error(`두 사본의 dp[${i}][${a}] 가 다르다`);
    }
  }
  const cells: Cell[] = raw.map(({ i, a, c, prev, cur }) => {
    const value = cur[a] as number;
    const up = prev[a] as number;
    if (a < c) {
      if (value !== up) throw new Error(`dp[${i}][${a}] 가 윗 칸과 다르다`);
      return {
        i,
        a,
        c,
        branch: "copy",
        value,
        up,
        take: null,
        reads: [[i - 1, a]],
      };
    }
    const take = (cur[a - c] as number) + 1;
    if (value !== Math.min(up, take)) {
      throw new Error(`dp[${i}][${a}] 가 두 후보 중 작은 쪽이 아니다`);
    }
    return {
      i,
      a,
      c,
      branch: up <= take ? "skip" : "take",
      value,
      up,
      take,
      reads: [
        [i - 1, a],
        [i, a - c],
      ],
    };
  });
  // 칸을 정한 차례가 줄 → 금액 오름차순인가. 아니면 걸음 번호가 코드의 차례와 어긋난다.
  cells.forEach((cell, k) => {
    const i = Math.floor(k / (amount + 1)) + 1;
    const a = k % (amount + 1);
    if (cell.i !== i || cell.a !== a) {
      throw new Error(`${k} 번째로 정한 칸이 dp[${i}][${a}] 가 아니다`);
    }
  });
  const last = rows[n]?.[amount] as number;
  if ((Number.isFinite(last) ? last : -1) !== result) {
    throw new Error("오른쪽 아래 칸이 반환값과 다르다");
  }
  const t: Trace = { cells, rows, init, result };
  traceCache.set(key, t);
  return t;
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const COINS = [3, 4, 1];
export const AMOUNT = 6;

/** 과제 규모 — 액면가 종류 `n` 과 금액 `A` 의 위 끝. */
export const N_MAX = 100;
export const A_MAX = 10_000;

/** `10011001` → `10,011,001`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
export const comma = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 칸 값을 적는다 — 못 만드는 칸은 ∞. */
export const fmt = (v: number): string => (Number.isFinite(v) ? comma(v) : "∞");

/** 반환값을 적는다 — 못 만들면 `-1` 그대로다. */
export const show = (v: number): string => comma(v);

/** 줄 머리 — `i` 와 그 줄에서 새로 여는 액면가 `c`. */
export const rowHead = (coins: readonly number[], i: number): string =>
  i === 0 ? "i=0" : `i=${i} · c=${coins[i - 1]}`;

/** 줄 곁말 — 그 줄에서 쓸 수 있는 액면가. */
export const rowUses = (coins: readonly number[], i: number): string =>
  i === 0 ? "쓸 액면가 없음" : `쓸 액면가 ${coins.slice(0, i).join(" · ")}`;

/** 2 차원 표 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const TABLE_OPTIONS: TableOptions = {
  rowHeads: Array.from({ length: COINS.length + 1 }, (_, i) =>
    rowHead(COINS, i),
  ),
  colHeads: Array.from({ length: AMOUNT + 1 }, (_, a) => a),
  colLabel: "금액 a",
};

/** DP 테이블의 줄을 무대 값으로 — ∞ 는 글자로 적는다. */
const cellsOf = (row: readonly number[]): string[] => row.map(fmt);

/* ───────────────── 정본과 다른 절차 — 본문이 정본과 값으로 대조한다 ───────────────── */

/** 아무것도 기억하지 않는 재귀. 호출 하나마다 1 을 센다. */
export function naiveCalls(coins: readonly number[], amount: number): number {
  let calls = 0;
  const solve = (rest: number): number => {
    calls++;
    if (rest === 0) return 0;
    if (rest < 0) return Number.POSITIVE_INFINITY;
    let best = Number.POSITIVE_INFINITY;
    for (const c of coins) {
      const sub = solve(rest - c);
      if (sub + 1 < best) best = sub + 1;
    }
    return best;
  };
  solve(amount);
  return calls;
}

/**
 * 위 재귀의 호출 수를 세는 점화식 — `C(a) = 1 + Σ_c C(a − c)`, `a < 0` 이면 `C = 1`.
 * 실제로 못 돌릴 크기에서도 정확한 값을 낸다. 작은 값에서 `naiveCalls` 와 같은지 여기서 확인한다.
 */
export function callsByRecurrence(
  coins: readonly number[],
  amount: number,
): bigint {
  const c = new Array<bigint>(amount + 1).fill(0n);
  c[0] = 1n;
  for (let a = 1; a <= amount; a++) {
    let sum = 1n;
    for (const coin of coins)
      sum += a - coin >= 0 ? (c[a - coin] as bigint) : 1n;
    c[a] = sum;
  }
  return c[amount] as bigint;
}

for (const a of [6, 10, 15, 20]) {
  if (BigInt(naiveCalls(COINS, a)) !== callsByRecurrence(COINS, a)) {
    throw new Error(`점화식이 실제 호출 수와 어긋난다 — 금액 ${a}`);
  }
}

/** 자릿수가 21 을 넘으면 자리 수로 적는다 — `1.91 × 10^2090` 꼴. */
export const big = (n: bigint): string => {
  const s = String(n);
  if (s.length <= 21) return comma(n);
  return `${s[0]}.${s.slice(1, 3)} × 10^${s.length - 1}`;
};

/**
 * 층 없이 금액 한 줄만 두고, 금액을 바깥 루프에 둔다. `ascending` 이 거짓이면 금액을 큰 쪽부터
 * 정한다 — 「아이디어를 떠올리는 과정」이 시험하는 후보다.
 */
export function amountOuter(
  coins: readonly number[],
  amount: number,
  ascending: boolean,
): number {
  const dp = new Array<number>(amount + 1).fill(Number.POSITIVE_INFINITY);
  dp[0] = 0;
  const step = (a: number): void => {
    for (const c of coins) {
      if (a < c) continue;
      const take = (dp[a - c] as number) + 1;
      if (take < (dp[a] as number)) dp[a] = take;
    }
  };
  if (ascending) for (let a = 1; a <= amount; a++) step(a);
  else for (let a = amount; a >= 1; a--) step(a);
  const best = dp[amount] as number;
  return Number.isFinite(best) ? best : -1;
}

/**
 * 한 줄만 두고 액면가를 바깥 루프에 둔다 — 정본의 두 줄을 한 줄로 접은 판. `dir` 이 `"up"` 이면 금액을
 * 작은 쪽부터, `"down"` 이면 큰 쪽부터 채운다. `frames` 는 `filmCoin` 번째 액면가를 처리하는 동안 칸
 * 하나를 쓸 때마다의 줄이다.
 */
export function oneRow(
  coins: readonly number[],
  amount: number,
  dir: "up" | "down",
  filmCoin = 0,
): {
  best: number[];
  before: number[];
  frames: { a: number; row: number[]; value: number; read: number }[];
} {
  const best = new Array<number>(amount + 1).fill(Number.POSITIVE_INFINITY);
  best[0] = 0;
  let before = [...best];
  let frames: { a: number; row: number[]; value: number; read: number }[] = [];
  coins.forEach((c, k) => {
    const last = k === filmCoin;
    if (last) before = [...best];
    const as: number[] = [];
    if (dir === "up") for (let a = c; a <= amount; a++) as.push(a);
    else for (let a = amount; a >= c; a--) as.push(a);
    const fs: typeof frames = [];
    for (const a of as) {
      const read = best[a - c] as number;
      best[a] = Math.min(best[a] as number, read + 1);
      fs.push({ a, row: [...best], value: best[a] as number, read });
    }
    if (last) frames = fs;
  });
  return { best, before, frames };
}

/** 한 줄 판의 답 — 못 만들면 `-1`. */
export const oneRowAnswer = (
  coins: readonly number[],
  amount: number,
  dir: "up" | "down",
): number => {
  const v = oneRow(coins, amount, dir).best[amount] as number;
  return Number.isFinite(v) ? v : -1;
};

/**
 * `a - c` 를 **윗 줄에서** 읽는 사본 — 정본 소스의 그 한 줄에서 `cur` 를 `prev` 로 바꿔 기계로 만든다.
 * 각 액면가를 한 개까지만 쓰는 0/1 배낭 모양이 되고, 본문은 그 줄을 정본의 줄과 칸마다 대조한다.
 * 칸을 보려고 첫 칸을 정한 직후의 DP 테이블을 붙잡는 기록도 함께 끼운다.
 */
const aboveRow = await loadMutant<Fn>(REF, {
  swap: [
    /^(\s*)const take = \(cur\[a - c\] as number\) \+ 1;(.*)$/,
    "$1const take = (prev[a - c] as number) + 1;$2\n$1(globalThis as any).__above = dp;",
  ],
});

/** 윗 줄에서 읽은 판의 DP 테이블과 답. */
export function aboveRowTable(
  coins: readonly number[],
  amount: number,
): { rows: number[][]; result: number } {
  const g = globalThis as unknown as { __above?: number[][] };
  g.__above = undefined;
  const result = aboveRow.unboundedKnapsack([...coins], amount);
  const rows = (g.__above ?? []).map((r) => [...r]);
  return { rows, result };
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly step: TableStep;
}

const cellName = ([r, c]: TableCell): string => `dp[${r}][${c}]`;

const MARK = { copy: "②", skip: "③", take: "④" } as const;

/** 칸 하나를 정한 계산 한 줄. */
const calcOf = (cell: Cell): { expr: string; result: string } => {
  const [up, left] = cell.reads;
  if (cell.branch === "copy") {
    return {
      expr: `${cellName(up as TableCell)} =`,
      result: fmt(cell.value),
    };
  }
  const leftVal = (cell.take as number) - 1;
  return {
    expr: `min(${cellName(up as TableCell)}, ${cellName(left as TableCell)} + 1) = min(${fmt(cell.up)}, ${fmt(leftVal)} + 1) =`,
    result: fmt(cell.value),
  };
};

/** 걸음 한 줄 설명. */
const detailOf = (cell: Cell): string => {
  const [up, left] = cell.reads;
  const head = `c = ${cell.c} 이고 ${cell.a} < ${cell.c}${이가(String(cell.c))}`;
  if (cell.branch === "copy") {
    return `${head} 참이라 ② 윗 칸을 옮깁니다. ${cellName([cell.i, cell.a])} = ${cellName(up as TableCell)} = ${fmt(cell.value)} 입니다.`;
  }
  const leftVal = (cell.take as number) - 1;
  const both = `안 쓰면 ${cellName(up as TableCell)} = ${fmt(cell.up)}, 한 개 더 쓰면 ${cellName(left as TableCell)} + 1 = ${fmt(leftVal)} + 1 = ${fmt(cell.take as number)}`;
  const pick =
    cell.branch === "skip"
      ? "③ 안 쓰는 쪽이 작거나 같습니다"
      : "④ 한 개 더 쓰는 쪽이 작습니다";
  return `${head} 거짓이라 두 후보를 비교합니다. ${both} 이고 ${pick}. ${cellName([cell.i, cell.a])} = ${fmt(cell.value)} 입니다.`;
};

/** 걸음 전부 — 첫 줄을 까는 한 걸음 + 칸마다 한 걸음 + 답을 읽는 한 걸음. */
export function walkSteps(): Step[] {
  const t = trace(COINS, AMOUNT);
  const n = COINS.length;
  const rows: (string | null)[][] = t.init.map((row, i) =>
    i === 0 ? cellsOf(row) : row.map(() => null),
  );
  const snapshot = () => rows.map((r) => [...r]);
  const steps: Step[] = [];
  let k = 1;
  const first = t.init[0] as readonly number[];
  steps.push({
    id: `T${k++}`,
    title: "dp[0][0] = 0 ①",
    detail: `DP 테이블을 ${n + 1} 줄 × ${AMOUNT + 1} 칸으로 만들고 ∞ 로 채운 뒤 dp[0][0] 에 ${first[0]}${을를(String(first[0]))} 둡니다. i=0 줄은 [${cellsOf(first).join(" ")}] 입니다.`,
    step: {
      table: snapshot(),
      write: [[0, 0]],
      calc: { expr: "dp[0][0] =", result: fmt(first[0] as number) },
    },
  });
  for (const cell of t.cells) {
    const row = rows[cell.i] as (string | null)[];
    row[cell.a] = fmt(cell.value);
    steps.push({
      id: `T${k++}`,
      title: `${cellName([cell.i, cell.a])} = ${fmt(cell.value)} ${MARK[cell.branch]}`,
      detail: detailOf(cell),
      step: {
        table: snapshot(),
        read: cell.reads,
        write: [[cell.i, cell.a]],
        calc: calcOf(cell),
      },
    });
  }
  const last = t.rows[n]?.[AMOUNT] as number;
  steps.push({
    id: `T${k++}`,
    title: `dp[${n}][${AMOUNT}] = ${fmt(last)} → ${show(t.result)} 반환`,
    detail: `오른쪽 아래 칸 dp[${n}][${AMOUNT}] 의 값을 읽습니다. 값 ${fmt(last)}${Number.isFinite(last) ? `${은는(fmt(last))} 유한하니 그대로` : " 이라 -1 로 바꿔"} ${show(t.result)}${을를(show(t.result))} 돌려줍니다.`,
    step: {
      table: snapshot(),
      read: [[n, AMOUNT]],
      calc: { expr: `dp[${n}][${AMOUNT}] =`, result: fmt(last) },
    },
  });
  return steps;
}

/** 필름과 패널을 가르는 자리 — 첫 줄을 까는 걸음은 1 번째 필름에, 답을 읽는 걸음은 마지막 필름에. */
export function walkParts(): { row1: Step[]; row2: Step[]; row3: Step[] } {
  const all = walkSteps();
  const width = AMOUNT + 1;
  return {
    row1: all.slice(0, 1 + width),
    row2: all.slice(1 + width, 1 + 2 * width),
    row3: all.slice(1 + 2 * width),
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `unboundedKnapsack-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const toStep = (s: Step) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...s.step,
  });
  const p = walkParts();
  return {
    row1: p.row1.map(toStep),
    row2: p.row2.map(toStep),
    row3: p.row3.map(toStep),
  };
}

const film = (steps: Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: tableStage(s.step, TABLE_OPTIONS),
  }));

/* ───────────────── 정적 한 장 ───────────────── */

/** 다 채운 DP 테이블 한 장 — 줄 곁말은 그 줄에서 쓸 수 있는 액면가다. */
function fullTable(extra: Partial<TableStep>): StageRow[] {
  const t = trace(COINS, AMOUNT);
  return tableStage(
    {
      table: t.rows.map(cellsOf),
      rowSide: t.rows.map((_, i) => rowUses(COINS, i)),
      ...extra,
    },
    TABLE_OPTIONS,
  );
}

/** 칸 하나를 정한 기록 — 본문이 짚는 칸을 기록에서 찾는다. */
export function cellOf(i: number, a: number): Cell {
  const cell = trace(COINS, AMOUNT).cells.find((c) => c.i === i && c.a === a);
  if (!cell) throw new Error(`dp[${i}][${a}] 의 기록이 없다`);
  return cell;
}

function ruleFrame(i: number, a: number): StageFrame {
  const cell = cellOf(i, a);
  const { expr, result } = calcOf(cell);
  const why =
    cell.branch === "copy" ? ` — ${a} < ${cell.c} 라 윗 칸만 읽는다` : "";
  return {
    id: MARK[cell.branch],
    text: `${cellName([i, a])} = ${expr.replace(/ =$/, "")} = ${result}${why}`,
    rows: fullTable({ read: cell.reads, write: [[i, a]] }),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

function approaches(): Approach[] {
  const calls = callsByRecurrence(COINS, A_MAX);
  const small = unboundedKnapsack(COINS, AMOUNT);
  const down = amountOuter(COINS, AMOUNT, false);
  return [
    {
      name: "동전을 하나씩 놓아 보는 재귀",
      idea: "남은 금액에서 액면가마다 한 번씩 갈라 내려가고, 가장 적은 개수를 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `액면가 [${COINS.join(", ")}] · 금액 ${comma(A_MAX)} 에서 호출 ${big(calls)} 번`,
          ok: false,
        },
      ],
      lesson:
        "남은 금액이 같으면 앞으로 할 일이 같다 — 금액마다 답을 한 번만 적어 두면 어떨까",
    },
    {
      name: "금액마다 한 칸 · 큰 금액부터",
      idea: "금액 a 의 최소 개수를 한 칸에 적고, 큰 금액부터 정한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `[${COINS.join(", ")}] 로 ${AMOUNT}${을를(String(AMOUNT))} 만드는 최소가 ${small}${이가(String(small))} 아니라 ${show(down)}`,
          ok: false,
        },
        { label: "시간", value: `칸 ${comma(A_MAX + 1)} 개`, ok: true },
      ],
      lesson:
        "읽는 칸 a - c 는 늘 a 보다 왼쪽이다 — 작은 금액부터 정하고, 액면가를 한 줄에 하나씩 넣으면 어떨까",
    },
    {
      name: "액면가를 하나씩 늘리는 DP 테이블",
      idea: "(연 액면가 수, 금액) 칸에 최소 개수를 적고, 줄마다 작은 금액부터 채운다",
      verdict: "keep",
      checks: [
        { label: "답", value: `${small} — 맞다`, ok: true },
        {
          label: "시간",
          value: `칸 ${comma((N_MAX + 1) * (A_MAX + 1))} 개`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 「짚고 가기」의 한 줄 ───────────────── */

/** 한 줄 판이 첫 액면가를 처리하는 동안의 줄 — 이번에 쓴 칸과 읽은 칸. */
function oneRowFilm(dir: "up" | "down", pick: readonly number[]): StageFrame[] {
  const r = oneRow(COINS, AMOUNT, dir, 0);
  const c = COINS[0] as number;
  return pick.map((a) => {
    const k = r.frames.findIndex((x) => x.a === a);
    const f = r.frames[k];
    if (!f) throw new Error(`a=${a} 걸음이 없다`);
    const states: Partial<Record<number, CellState>> = {};
    states[a - c] = "read";
    states[a] = "focus";
    // 읽은 왼쪽 칸이 이번 액면가를 이미 반영했는가 — 같은 처리의 앞 걸음에서 쓴 칸이면 그렇다.
    const leftDone = r.frames.slice(0, k).some((x) => x.a === a - c);
    const rows: StageRow[] = [
      {
        kind: "index",
        label: "금액 a",
        labels: f.row.map((_, x) => x),
        focus: [a],
      },
      {
        kind: "cells",
        label: "best",
        values: cellsOf(f.row),
        states,
        side: leftDone
          ? `best[${a - c}] 는 ${c}${을를(String(c))} 이미 쓴 값`
          : `best[${a - c}] 는 ${c}${을를(String(c))} 아직 안 쓴 값`,
      },
    ];
    return {
      id: `a=${a}`,
      text: `best[${a}] = min(best[${a}], best[${a - c}] + 1) = min(${fmt(r.before[a] as number)}, ${fmt(f.read)} + 1) = ${fmt(f.value)}`,
      rows,
    };
  });
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-table": () => (
    <CellStage
      title={`unboundedKnapsack([${COINS.join(", ")}], ${AMOUNT}) 의 DP 테이블 — 줄은 연 액면가, 열은 금액`}
      rows={fullTable({})}
      columns={AMOUNT + 1}
    />
  ),
  "concept-rule": () => {
    const f = ruleFrame(1, AMOUNT);
    return (
      <CellStage
        title={`dp[1][${AMOUNT}] 을 정하는 자리 — ${f.text}`}
        rows={f.rows}
        columns={AMOUNT + 1}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`액면가 종류 ${N_MAX} 개 · 금액 ${comma(A_MAX)} 까지`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-read-cell": () => {
    const i = 2;
    const a = AMOUNT;
    const t = trace(COINS, AMOUNT);
    const out: TableCell[] = [];
    t.rows.forEach((row, r) => {
      row.forEach((_, c) => {
        if (r !== i || c !== a) out.push([r, c]);
      });
    });
    return (
      <CellStage
        title={`dp[${i}][${a}] — 액면가 ${COINS.slice(0, i).join(" · ")} 만 몇 개든 써서 금액 ${a}${을를(String(a))} 만드는 최소 개수`}
        rows={fullTable({ write: [[i, a]], out })}
        columns={AMOUNT + 1}
      />
    );
  },
  "build-neighbors": () => (
    <CellStageFilm
      title="칸 하나가 읽는 이웃 — 윗 칸과, 같은 줄에서 c 칸 왼쪽"
      columns={AMOUNT + 1}
      frames={[ruleFrame(2, 3), ruleFrame(1, AMOUNT), ruleFrame(3, AMOUNT)]}
    />
  ),
  "build-contrast": () => {
    const n = COINS.length;
    const mine = trace(COINS, AMOUNT).rows[n] as readonly number[];
    const other = aboveRowTable(COINS, AMOUNT).rows[n] ?? [];
    const states: Partial<Record<number, CellState>> = {};
    mine.forEach((v, a) => {
      if (v !== other[a]) states[a] = "read";
    });
    const rows: StageRow[] = [
      { kind: "index", label: "금액 a", labels: mine.map((_, a) => a) },
      {
        kind: "cells",
        label: `같은 줄에서 i=${n}`,
        values: cellsOf(mine),
        states,
        side: "몇 개든",
      },
      {
        kind: "cells",
        label: `윗 줄에서 i=${n}`,
        values: cellsOf(other),
        states,
        side: "한 개까지",
      },
    ];
    return (
      <CellStage
        title={`같은 액면가 [${COINS.join(", ")}] — a - c 를 같은 줄에서 읽은 DP 테이블과 윗 줄에서 읽은 판의 마지막 줄`}
        rows={rows}
        columns={AMOUNT + 1}
      />
    );
  },
  "walk-row1": () => {
    const s = walkParts().row1;
    return (
      <CellStageFilm
        title={`unboundedKnapsack([${COINS.join(", ")}], ${AMOUNT}) — ${s[0]?.id}~${s.at(-1)?.id} · 첫 줄과 i=1 줄`}
        columns={AMOUNT + 1}
        frames={film(s)}
      />
    );
  },
  "walk-row2": () => {
    const s = walkParts().row2;
    return (
      <CellStageFilm
        title={`unboundedKnapsack([${COINS.join(", ")}], ${AMOUNT}) — ${s[0]?.id}~${s.at(-1)?.id} · i=2 줄`}
        columns={AMOUNT + 1}
        frames={film(s)}
      />
    );
  },
  "walk-row3": () => {
    const s = walkParts().row3;
    return (
      <CellStageFilm
        title={`unboundedKnapsack([${COINS.join(", ")}], ${AMOUNT}) — ${s[0]?.id}~${s.at(-1)?.id} · i=3 줄과 답`}
        columns={AMOUNT + 1}
        frames={film(s)}
      />
    );
  },
  "pause-one-row-up": () => (
    <CellStageFilm
      title={`한 줄을 작은 금액부터 채울 때 — 첫 액면가 ${COINS[0]}`}
      columns={AMOUNT + 1}
      frames={oneRowFilm("up", [3, 6])}
    />
  ),
  "pause-one-row-down": () => (
    <CellStageFilm
      title={`한 줄을 큰 금액부터 채울 때 — 첫 액면가 ${COINS[0]}`}
      columns={AMOUNT + 1}
      frames={oneRowFilm("down", [6, 3])}
    />
  ),
};
