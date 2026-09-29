/**
 * `coinChangeWays-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 칸 하나를 정하는 자리마다 무엇을
 * 읽었는지는 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록하고, 답은 정본이 낸다. 걸음 재생
 * 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `coinChangeWays-guide.test.ts` 가 잰다.
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
import { coinChangeWays } from "./coinChangeWays-guide.ref.ts";

const REF = new URL("./coinChangeWays-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 칸 하나를 정하기 직전에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 기록은 줄 두 개(`prev`·`cur`)를 가리키기만 하고, 값은 호출이 끝난
 * 뒤 읽는다. 칸은 한 번만 쓰이므로 끝난 뒤의 값이 곧 그 칸을 정한 순간의 값이다.
 */
const probed = await loadMutant<{
  coinChangeWays(coins: number[], amount: number): number;
}>(REF, {
  swap: [
    /^(\s*)if \(a < c\) \{$/,
    "$1(globalThis as any).__cells.push({ i, a, c, prev, cur });\n$1if (a < c) {",
  ],
});

/**
 * 첫 칸을 정한 직후의 DP 테이블을 붙잡는 사본 — 역시 정본 소스에서 기계로 만든다. 그 순간의 사본
 * (`__init`)과 DP 테이블 자체(`__dp`)를 남기므로, 첫 줄을 깐 모습과 호출이 끝난 모습을 둘 다 정본의
 * 실행에서 받는다. 동전이 없어 칸을 하나도 정하지 않는 입력도 이 사본으로 DP 테이블을 본다.
 */
const probedTable = await loadMutant<{
  coinChangeWays(coins: number[], amount: number): number;
}>(REF, {
  swap: [
    /^(\s*)\(dp\[0\] as number\[\]\)\[0\] = 1;$/,
    "$1(dp[0] as number[])[0] = 1;\n$1(globalThis as any).__init = dp.map((r) => [...r]);\n$1(globalThis as any).__dp = dp;",
  ],
});

/** 칸 하나를 정한 기록. */
export interface Cell {
  readonly i: number;
  readonly a: number;
  readonly c: number;
  /** `copy` ② 이 동전을 못 쓴다 · `add` ③ 안 쓴 것 + 적어도 한 개 쓴 것. */
  readonly branch: "copy" | "add";
  readonly value: number;
  /** 읽은 칸과 그 값 — `copy` 는 윗 칸 하나, `add` 는 윗 칸과 같은 줄의 `c` 칸 왼쪽. */
  readonly reads: readonly { readonly at: TableCell; readonly value: number }[];
}

export interface Trace {
  readonly cells: readonly Cell[];
  /** 호출이 끝난 뒤의 DP 테이블 전체(`dp[0]` 부터 `dp[n]` 까지). */
  readonly rows: readonly (readonly number[])[];
  /** 첫 칸을 정한 직후의 DP 테이블 — 아직 안 정한 줄은 `fill(0)` 이 둔 0 이다. */
  readonly init: readonly (readonly number[])[];
  readonly result: number;
}

/** 정본 한 번 호출의 기록. 답은 정본과 대조하고, 칸마다 전이식이 실제로 성립했는지도 대조한다. */
export function trace(coins: readonly number[], amount: number): Trace {
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
  const result = probed.coinChangeWays([...coins], amount);
  const want = coinChangeWays([...coins], amount);
  if (result !== want) {
    throw new Error(
      `계측 사본이 정본과 다른 답을 냈다 — [${coins.join(", ")}] / ${amount}: ${result} ≠ ${want}`,
    );
  }
  const raw = g.__cells;
  const n = coins.length;
  if (probedTable.coinChangeWays([...coins], amount) !== want) {
    throw new Error("DP 테이블을 붙잡는 사본이 정본과 다른 답을 냈다");
  }
  const init = g.__init.map((r) => [...r]);
  const rows = g.__dp.map((r) => [...r]);
  // 두 사본은 따로 실행된다. 칸마다 적힌 값이 같은지 맞대어 둘이 같은 실행을 본 것인지 확인한다.
  for (const { i, a, cur } of raw) {
    if (cur[a] !== rows[i]?.[a]) {
      throw new Error(`두 사본의 dp[${i}][${a}] 가 다르다`);
    }
  }
  const cells: Cell[] = raw.map(({ i, a, c, prev, cur }) => {
    const value = cur[a] as number;
    if (a < c) {
      const up = prev[a] as number;
      if (value !== up) throw new Error(`dp[${i}][${a}] 가 윗 칸과 다르다`);
      return {
        i,
        a,
        c,
        branch: "copy",
        value,
        reads: [{ at: [i - 1, a], value: up }],
      };
    }
    const up = prev[a] as number;
    const left = cur[a - c] as number;
    if (value !== up + left) {
      throw new Error(`dp[${i}][${a}] 가 두 칸의 합과 다르다`);
    }
    return {
      i,
      a,
      c,
      branch: "add",
      value,
      reads: [
        { at: [i - 1, a], value: up },
        { at: [i, a - c], value: left },
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
  if ((rows[n]?.[amount] ?? -1) !== result) {
    throw new Error("오른쪽 아래 칸이 반환값과 다르다");
  }
  return { cells, rows, init, result };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const COINS = [1, 2, 5];
export const AMOUNT = 5;

const num = (x: number): string => x.toLocaleString("en-US");

/** 줄 머리 — `i` 와 그 줄에서 새로 넣는 동전 `c`. */
export const rowHead = (coins: readonly number[], i: number): string =>
  i === 0 ? "i=0" : `i=${i} · c=${coins[i - 1]}`;

/** 줄 곁말 — 그 줄에서 쓸 수 있는 동전. */
export const rowUses = (coins: readonly number[], i: number): string =>
  i === 0 ? "쓸 동전 없음" : `쓸 동전 ${coins.slice(0, i).join(" · ")}`;

/** 2 차원 표 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const TABLE_OPTIONS: TableOptions = {
  rowHeads: Array.from({ length: COINS.length + 1 }, (_, i) =>
    rowHead(COINS, i),
  ),
  colHeads: Array.from({ length: AMOUNT + 1 }, (_, a) => a),
  colLabel: "금액 a",
};

/**
 * 금액 하나만 상태로 두는 방식 — 금액을 바깥 루프에 둔다. 정본과 다른 절차라 여기 따로 적고, 본문은
 * 이 방식이 정본과 **다른 값**을 낸다는 것을 보인다. 배열 `dp1[a]` 는 금액 `a` 를 만드는 나열의 수다.
 */
export function amountOuter(
  coins: readonly number[],
  amount: number,
): number[] {
  const dp = new Array<number>(amount + 1).fill(0);
  dp[0] = 1;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (a >= c) dp[a] = (dp[a] as number) + (dp[a - c] as number);
    }
  }
  return dp;
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly step: TableStep;
}

const cellName = ([r, c]: TableCell): string => `dp[${r}][${c}]`;

/** 걸음 전부 — 첫 줄을 까는 한 걸음 + 칸마다 한 걸음 + 답을 읽는 한 걸음. */
export function walkSteps(): Step[] {
  const t = trace(COINS, AMOUNT);
  const n = COINS.length;
  // 첫 걸음의 DP 테이블 — i=0 줄은 첫 칸을 정한 직후 그대로이고, 나머지 줄은 아직 안 정한 칸이다.
  const rows: (number | null)[][] = t.init.map((row, i) =>
    i === 0 ? [...row] : row.map(() => null),
  );
  const snapshot = () => rows.map((r) => [...r]);
  const steps: Step[] = [];
  let k = 1;
  const first = t.init[0] as readonly number[];
  steps.push({
    id: `T${k++}`,
    title: "dp[0][0] = 1 ①",
    detail: `DP 테이블을 ${n + 1} 줄 × ${AMOUNT + 1} 칸으로 만들고 0 으로 채운 뒤 dp[0][0] 에 ${first[0]}${을를(String(first[0]))} 둡니다. i=0 줄은 [${first.join(" ")}] 입니다.`,
    step: {
      table: snapshot(),
      write: [[0, 0]],
      calc: { expr: "dp[0][0] =", result: String(first[0]) },
    },
  });
  for (const cell of t.cells) {
    const row = rows[cell.i] as (number | null)[];
    row[cell.a] = cell.value;
    const reads = cell.reads.map((r) => r.at);
    const [up, left] = cell.reads;
    const expr =
      cell.branch === "copy"
        ? `${cellName(up?.at as TableCell)} =`
        : `${cellName(up?.at as TableCell)} + ${cellName(left?.at as TableCell)} = ${up?.value} + ${left?.value} =`;
    const detail =
      cell.branch === "copy"
        ? `c = ${cell.c} 이고 ${cell.a} < ${cell.c}${이가(cell.c)} 참이라 ② 윗 칸을 옮깁니다. ${cellName([cell.i, cell.a])} = ${cellName(up?.at as TableCell)} = ${cell.value} 입니다.`
        : `c = ${cell.c} 이고 ${cell.a} < ${cell.c}${이가(cell.c)} 거짓이라 ③ 윗 칸과 같은 줄 ${cell.c} 칸 왼쪽을 더합니다. ${cellName([cell.i, cell.a])} = ${up?.value} + ${left?.value} = ${cell.value} 입니다.`;
    steps.push({
      id: `T${k++}`,
      title: `${cellName([cell.i, cell.a])} = ${cell.value} ${cell.branch === "copy" ? "②" : "③"}`,
      detail,
      step: {
        table: snapshot(),
        read: reads,
        write: [[cell.i, cell.a]],
        calc: { expr, result: String(cell.value) },
      },
    });
  }
  steps.push({
    id: `T${k++}`,
    title: `dp[${n}][${AMOUNT}] = ${t.result} 반환`,
    detail: `오른쪽 아래 칸 dp[${n}][${AMOUNT}] 를 읽어 ${t.result}${을를(String(t.result))} 돌려줍니다.`,
    step: {
      table: snapshot(),
      read: [[n, AMOUNT]],
      calc: { expr: `dp[${n}][${AMOUNT}] =`, result: String(t.result) },
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
 * `coinChangeWays-guide.test.ts` 가 잰다.
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

/** 다 채운 DP 테이블 한 장 — 줄 곁말은 그 줄에서 쓸 수 있는 동전이다. */
function fullTable(extra: Partial<TableStep>): StageRow[] {
  const t = trace(COINS, AMOUNT);
  return tableStage(
    {
      table: t.rows.map((r) => [...r]),
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
  const [up, left] = cell.reads;
  const text =
    cell.branch === "copy"
      ? `${cellName([i, a])} = ${cellName(up?.at as TableCell)} = ${cell.value} — ${a} < ${cell.c} 라 윗 칸만 읽는다`
      : `${cellName([i, a])} = ${cellName(up?.at as TableCell)} + ${cellName(left?.at as TableCell)} = ${up?.value} + ${left?.value} = ${cell.value}`;
  return {
    id: cell.branch === "copy" ? "②" : "③",
    text,
    rows: fullTable({
      read: cell.reads.map((r) => r.at),
      write: [[i, a]],
    }),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

/** 과제 규모 — 동전 종류 `n` 과 금액 `A` 의 위 끝. */
export const N_MAX = 100;
export const A_MAX = 10_000;
export const upTo = (k: number): number[] =>
  Array.from({ length: k }, (_, i) => i + 1);

/** 2^53 을 넘는 값은 자릿수로 적는다 — `2.27e+91` → `2.27 × 10^91`. */
export const big = (n: number): string => {
  if (n <= Number.MAX_SAFE_INTEGER) return num(n);
  const [m, e] = n.toExponential(2).split("e+");
  return `${m} × 10^${e}`;
};

function approaches(): Approach[] {
  const leaves = coinChangeWays(upTo(N_MAX), A_MAX);
  const small = coinChangeWays(COINS, AMOUNT);
  const byAmount = amountOuter(COINS, AMOUNT)[AMOUNT] as number;
  const cells = (N_MAX + 1) * (A_MAX + 1);
  return [
    {
      name: "조합을 하나씩 만들어 세기",
      idea: "종류마다 몇 개 쓸지 0 개부터 끝까지 시도하고, 금액이 딱 맞는 경우를 센다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `만드는 조합이 곧 답 — 동전 1 … ${N_MAX} · 금액 ${num(A_MAX)} 에서 ${big(leaves)} 개`,
          ok: false,
        },
      ],
      lesson:
        "같은 (i, 남은 금액) 을 여러 길에서 다시 묻는다 — 그 답을 적어 두면 어떨까",
    },
    {
      name: "금액 하나만 기억하기",
      idea: "금액 a 를 만드는 수를 한 칸에 적고, 동전을 차례로 넣어 본다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `[${COINS.join(", ")}] 로 ${AMOUNT}${을를(String(AMOUNT))} 만드는 수가 ${small}${이가(small)} 아니라 ${byAmount}`,
          ok: false,
        },
        { label: "시간", value: `칸 ${num(A_MAX + 1)} 개`, ok: true },
      ],
      lesson:
        "넣은 차례가 다르면 다른 것으로 센다 — 어느 종류까지 썼는지를 함께 적으면 어떨까",
    },
    {
      name: "동전 종류를 하나씩 늘리는 DP 테이블",
      idea: "(몇 번째 종류까지 넣었나, 금액) 칸에 조합의 수를 적는다",
      verdict: "keep",
      checks: [
        { label: "답", value: `${small} — 맞다`, ok: true },
        { label: "시간", value: `칸 ${num(cells)} 개`, ok: true },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-table": () => (
    <CellStage
      title={`coinChangeWays([${COINS.join(", ")}], ${AMOUNT}) 의 DP 테이블 — 줄은 넣은 동전, 열은 금액`}
      rows={fullTable({})}
      columns={AMOUNT + 1}
    />
  ),
  "concept-rule": () => {
    const f = ruleFrame(COINS.length, AMOUNT);
    return (
      <CellStage
        title={`dp[${COINS.length}][${AMOUNT}] 을 정하는 자리 — ${f.text}`}
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
        constraint={`동전 종류 ${N_MAX} 개 · 금액 ${num(A_MAX)} 까지`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-read-cell": () => {
    const i = 2;
    const a = 4;
    const t = trace(COINS, AMOUNT);
    const out: TableCell[] = [];
    t.rows.forEach((row, r) => {
      row.forEach((_, c) => {
        if (r !== i || c !== a) out.push([r, c]);
      });
    });
    return (
      <CellStage
        title={`dp[${i}][${a}] — 동전 ${COINS.slice(0, i).join(" · ")} 만 써서 금액 ${a}${을를(String(a))} 만드는 조합의 수`}
        rows={fullTable({ write: [[i, a]], out })}
        columns={AMOUNT + 1}
      />
    );
  },
  "build-neighbors": () => (
    <CellStageFilm
      title="칸 하나가 읽는 이웃 — 윗 칸과, 같은 줄에서 c 칸 왼쪽"
      columns={AMOUNT + 1}
      frames={[ruleFrame(2, 4), ruleFrame(3, 4)]}
    />
  ),
  "build-contrast": () => {
    const byAmount = amountOuter(COINS, AMOUNT);
    const last = trace(COINS, AMOUNT).rows[COINS.length] as readonly number[];
    const states: Partial<Record<number, CellState>> = {};
    byAmount.forEach((v, a) => {
      if (v !== last[a]) states[a] = "read";
    });
    const rows: StageRow[] = [
      {
        kind: "index",
        label: "금액 a",
        labels: byAmount.map((_, a) => a),
      },
      {
        kind: "cells",
        label: "금액만 기억",
        values: byAmount,
        states,
        side: "넣은 차례까지 센 수",
      },
      {
        kind: "cells",
        label: `DP 테이블 i=${COINS.length}`,
        values: last,
        states,
        side: "조합의 수",
      },
    ];
    return (
      <CellStage
        title={`같은 동전 [${COINS.join(", ")}] — 금액 한 줄짜리 표와 DP 테이블의 마지막 줄`}
        rows={rows}
        columns={AMOUNT + 1}
      />
    );
  },
  "walk-row1": () => {
    const s = walkParts().row1;
    return (
      <CellStageFilm
        title={`coinChangeWays([${COINS.join(", ")}], ${AMOUNT}) — ${s[0]?.id}~${s.at(-1)?.id} · 첫 줄과 i=1 줄`}
        columns={AMOUNT + 1}
        frames={film(s)}
      />
    );
  },
  "walk-row2": () => {
    const s = walkParts().row2;
    return (
      <CellStageFilm
        title={`coinChangeWays([${COINS.join(", ")}], ${AMOUNT}) — ${s[0]?.id}~${s.at(-1)?.id} · i=2 줄`}
        columns={AMOUNT + 1}
        frames={film(s)}
      />
    );
  },
  "walk-row3": () => {
    const s = walkParts().row3;
    return (
      <CellStageFilm
        title={`coinChangeWays([${COINS.join(", ")}], ${AMOUNT}) — ${s[0]?.id}~${s.at(-1)?.id} · i=3 줄과 답`}
        columns={AMOUNT + 1}
        frames={film(s)}
      />
    );
  },
};
