/**
 * `knapsack01-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 칸 하나를 정하는 자리마다 무엇을
 * 읽었는지는 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록하고, 답은 정본이 낸다. 걸음 재생
 * 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `knapsack01-guide.test.ts` 가 잰다.
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
import { knapsack01 } from "./knapsack01-guide.ref.ts";

const REF = new URL("./knapsack01-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 칸 하나를 정하기 직전에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 기록은 줄 두 개(`prev`·`cur`)를 가리키기만 하고, 값은 호출이 끝난
 * 뒤 읽는다. 칸은 한 번만 쓰이고 `prev` 는 그 뒤로 바뀌지 않으므로 끝난 뒤의 값이 곧 그 순간의 값이다.
 */
const probed = await loadMutant<{
  knapsack01(weights: number[], values: number[], W: number): number;
}>(REF, {
  swap: [
    /^(\s*)if \(c < w\) \{$/,
    "$1(globalThis as any).__cells.push({ i, c, w, v, prev, cur });\n$1if (c < w) {",
  ],
});

/**
 * 첫 줄을 깐 직후의 DP 테이블을 붙잡는 사본 — 역시 정본 소스에서 기계로 만든다. 그 순간의 사본
 * (`__init`)과 DP 테이블 자체(`__dp`)를 남기므로, 첫 줄을 깐 모습과 호출이 끝난 모습을 둘 다 정본의
 * 실행에서 받는다. 물건이 없어 칸을 하나도 정하지 않는 입력도 이 사본으로 DP 테이블을 본다.
 */
const probedTable = await loadMutant<{
  knapsack01(weights: number[], values: number[], W: number): number;
}>(REF, {
  swap: [
    /^(\s*)for \(let i = 1; i <= n; i\+\+\) \{$/,
    "$1(globalThis as any).__init = dp.map((r) => [...r]);\n$1(globalThis as any).__dp = dp;\n$1for (let i = 1; i <= n; i++) {",
  ],
});

/** 칸 하나를 정한 갈래 — ① 못 담는다 · ② 두고 가는 쪽 · ③ 담는 쪽. */
export type Branch = "cant" | "skip" | "take";

export const BRANCH_MARK: Record<Branch, string> = {
  cant: "①",
  skip: "②",
  take: "③",
};

/** 칸 하나를 정한 기록. */
export interface Cell {
  readonly i: number;
  readonly c: number;
  readonly w: number;
  readonly v: number;
  readonly branch: Branch;
  readonly value: number;
  /** 두고 간 값 `prev[c]`. */
  readonly skip: number;
  /** 담은 값 `prev[c - w] + v` — 못 담는 칸은 `null`. */
  readonly take: number | null;
  /** 읽은 칸 — ① 은 윗 칸 하나, ②·③ 은 윗 칸과 윗 줄에서 `w` 칸 왼쪽. */
  readonly reads: readonly TableCell[];
}

export interface Trace {
  readonly cells: readonly Cell[];
  /** 호출이 끝난 뒤의 DP 테이블 전체(`dp[0]` 부터 `dp[n]` 까지). */
  readonly rows: readonly (readonly number[])[];
  /** 첫 줄을 깐 직후의 DP 테이블 — 모든 칸이 `fill` 이 둔 0 이다. */
  readonly init: readonly (readonly number[])[];
  readonly result: number;
}

/** 정본 한 번 호출의 기록. 답은 정본과 대조하고, 칸마다 전이식이 실제로 성립했는지도 대조한다. */
export function trace(
  weights: readonly number[],
  values: readonly number[],
  W: number,
): Trace {
  const g = globalThis as unknown as {
    __init: number[][];
    __dp: number[][];
    __cells: {
      i: number;
      c: number;
      w: number;
      v: number;
      prev: number[];
      cur: number[];
    }[];
  };
  g.__cells = [];
  const result = probed.knapsack01([...weights], [...values], W);
  const want = knapsack01([...weights], [...values], W);
  if (result !== want) {
    throw new Error(
      `계측 사본이 정본과 다른 답을 냈다 — [${weights.join(", ")}] / ${W}: ${result} ≠ ${want}`,
    );
  }
  const raw = g.__cells;
  if (probedTable.knapsack01([...weights], [...values], W) !== want) {
    throw new Error("DP 테이블을 붙잡는 사본이 정본과 다른 답을 냈다");
  }
  const init = g.__init.map((r) => [...r]);
  const rows = g.__dp.map((r) => [...r]);
  for (const { i, c, cur } of raw) {
    if (cur[c] !== rows[i]?.[c]) {
      throw new Error(`두 사본의 dp[${i}][${c}] 가 다르다`);
    }
  }
  const cells: Cell[] = raw.map(({ i, c, w, v, prev, cur }) => {
    const value = cur[c] as number;
    const skip = prev[c] as number;
    if (c < w) {
      if (value !== skip) throw new Error(`dp[${i}][${c}] 가 윗 칸과 다르다`);
      return {
        i,
        c,
        w,
        v,
        branch: "cant",
        value,
        skip,
        take: null,
        reads: [[i - 1, c]],
      };
    }
    const take = (prev[c - w] as number) + v;
    const branch: Branch = skip >= take ? "skip" : "take";
    if (value !== Math.max(skip, take)) {
      throw new Error(`dp[${i}][${c}] 가 두 후보의 큰 쪽과 다르다`);
    }
    return {
      i,
      c,
      w,
      v,
      branch,
      value,
      skip,
      take,
      reads: [
        [i - 1, c],
        [i - 1, c - w],
      ],
    };
  });
  // 칸을 정한 차례가 줄 → 용량 오름차순인가. 아니면 걸음 번호가 코드의 차례와 어긋난다.
  cells.forEach((cell, k) => {
    const i = Math.floor(k / (W + 1)) + 1;
    const c = k % (W + 1);
    if (cell.i !== i || cell.c !== c) {
      throw new Error(`${k} 번째로 정한 칸이 dp[${i}][${c}] 가 아니다`);
    }
  });
  if ((rows[weights.length]?.[W] ?? -1) !== result) {
    throw new Error("오른쪽 아래 칸이 반환값과 다르다");
  }
  return { cells, rows, init, result };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WEIGHTS = [1, 3, 4, 5];
export const VALUES = [1, 4, 5, 7];
export const CAP = 7;

const num = (x: number): string => x.toLocaleString("en-US");

/** 물건 하나의 이름 — `무게 3 · 가치 4`. */
export const itemName = (k: number): string =>
  `무게 ${WEIGHTS[k]} · 가치 ${VALUES[k]}`;

/** 줄 머리 — `i` 와 그 줄에서 새로 보는 물건. */
export const rowHead = (i: number): string =>
  i === 0 ? "i=0" : `i=${i} · w${WEIGHTS[i - 1]} v${VALUES[i - 1]}`;

/** 줄 곁말 — 그 줄에서 고를 수 있는 물건의 무게. */
export const rowUses = (i: number): string =>
  i === 0 ? "고를 물건 없음" : `무게 ${WEIGHTS.slice(0, i).join(" · ")}`;

/** 2 차원 표 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const TABLE_OPTIONS: TableOptions = {
  rowHeads: Array.from({ length: WEIGHTS.length + 1 }, (_, i) => rowHead(i)),
  colHeads: Array.from({ length: CAP + 1 }, (_, c) => c),
  colLabel: "용량 c",
};

/**
 * 한 줄만 두는 방식 — 줄 하나 `best[c]` 를 물건마다 다시 쓴다. `dir` 이 `"up"` 이면 용량을 작은 쪽부터,
 * `"down"` 이면 큰 쪽부터 채운다. 정본과 다른 절차라 여기 따로 적고, 본문은 이 방식이 정본과 **같은지
 * 다른지**를 값으로 보인다. `frames` 는 `filmItem` 번째 물건을 처리하는 동안 칸 하나를 쓸 때마다의 줄이다.
 */
export function oneRow(
  weights: readonly number[],
  values: readonly number[],
  W: number,
  dir: "up" | "down",
  filmItem = weights.length - 1,
): {
  best: number[];
  /** `filmItem` 번째 물건을 보기 직전의 줄. */
  before: number[];
  frames: { c: number; reads: number[]; row: number[]; value: number }[];
} {
  const best = new Array<number>(W + 1).fill(0);
  let before: number[] = [...best];
  let frames: { c: number; reads: number[]; row: number[]; value: number }[] =
    [];
  weights.forEach((w, k) => {
    const v = values[k] as number;
    const last = k === filmItem;
    if (last) before = [...best];
    const cs: number[] = [];
    if (dir === "up") for (let c = w; c <= W; c++) cs.push(c);
    else for (let c = W; c >= w; c--) cs.push(c);
    const fs: typeof frames = [];
    for (const c of cs) {
      best[c] = Math.max(best[c] as number, (best[c - w] as number) + v);
      fs.push({
        c,
        reads: [c - w, c],
        row: [...best],
        value: best[c] as number,
      });
    }
    if (last) frames = fs;
  });
  return { best, before, frames };
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly step: TableStep;
}

const cellName = ([r, c]: TableCell): string => `dp[${r}][${c}]`;

/** 걸음 하나의 계산 한 줄과 설명 — 필름·패널·본문 표가 같이 쓴다. */
export function cellText(cell: Cell): {
  expr: string;
  detail: string;
} {
  const at = cellName([cell.i, cell.c]);
  const up = cellName([cell.i - 1, cell.c]);
  if (cell.branch === "cant") {
    return {
      expr: `${up} =`,
      detail: `w = ${cell.w} 이고 ${cell.c} < ${cell.w}${이가(String(cell.w))} 참이라 ① 못 담습니다. ${at} = ${up} = ${cell.value} 입니다.`,
    };
  }
  const left = cellName([cell.i - 1, cell.c - cell.w]);
  const cmp = `${cell.skip} >= ${cell.take}`;
  return {
    expr: `max(${up}, ${left} + ${cell.v}) = max(${cell.skip}, ${cell.take}) =`,
    detail:
      cell.branch === "skip"
        ? `w = ${cell.w} 이고 ${cell.c} < ${cell.w}${이가(String(cell.w))} 거짓이라 두 후보를 비교합니다. 두고 가면 ${cell.skip}, 담으면 ${left} + ${cell.v} = ${cell.take} 이고 ${cmp}${이가(String(cell.take))} 참이라 ② 두고 갑니다. ${at} = ${cell.value} 입니다.`
        : `w = ${cell.w} 이고 ${cell.c} < ${cell.w}${이가(String(cell.w))} 거짓이라 두 후보를 비교합니다. 두고 가면 ${cell.skip}, 담으면 ${left} + ${cell.v} = ${cell.take} 이고 ${cmp}${이가(String(cell.take))} 거짓이라 ③ 담습니다. ${at} = ${cell.value} 입니다.`,
  };
}

/** 걸음 전부 — 첫 줄을 까는 한 걸음 + 칸마다 한 걸음 + 답을 읽는 한 걸음. */
export function walkSteps(): Step[] {
  const t = trace(WEIGHTS, VALUES, CAP);
  const n = WEIGHTS.length;
  const rows: (number | null)[][] = t.init.map((row, i) =>
    i === 0 ? [...row] : row.map(() => null),
  );
  const snapshot = () => rows.map((r) => [...r]);
  const steps: Step[] = [];
  let k = 1;
  const first = t.init[0] as readonly number[];
  steps.push({
    id: `T${k++}`,
    title: "i=0 줄 = 0",
    detail: `DP 테이블을 ${n + 1} 줄 × ${CAP + 1} 칸으로 만들고 0 으로 채웁니다. 고를 물건이 없는 i=0 줄은 [${first.join(" ")}] 입니다.`,
    step: {
      table: snapshot(),
      write: first.map((_, c) => [0, c] as TableCell),
      calc: { expr: "dp[0][c] =", result: String(first[0]) },
    },
  });
  for (const cell of t.cells) {
    const row = rows[cell.i] as (number | null)[];
    row[cell.c] = cell.value;
    const { expr, detail } = cellText(cell);
    steps.push({
      id: `T${k++}`,
      title: `${cellName([cell.i, cell.c])} = ${cell.value} ${BRANCH_MARK[cell.branch]}`,
      detail,
      step: {
        table: snapshot(),
        read: cell.reads,
        write: [[cell.i, cell.c]],
        calc: { expr, result: String(cell.value) },
      },
    });
  }
  steps.push({
    id: `T${k++}`,
    title: `dp[${n}][${CAP}] = ${t.result} 반환`,
    detail: `오른쪽 아래 칸 dp[${n}][${CAP}] 를 읽어 ${t.result}${을를(String(t.result))} 돌려줍니다.`,
    step: {
      table: snapshot(),
      read: [[n, CAP]],
      calc: { expr: `dp[${n}][${CAP}] =`, result: String(t.result) },
    },
  });
  return steps;
}

/** 필름과 패널을 가르는 자리 — 첫 줄을 까는 걸음은 1 번째 벌에, 답을 읽는 걸음은 마지막 벌에. */
export function walkParts(): {
  row1: Step[];
  row2: Step[];
  row3: Step[];
  row4: Step[];
} {
  const all = walkSteps();
  const width = CAP + 1;
  return {
    row1: all.slice(0, 1 + width),
    row2: all.slice(1 + width, 1 + 2 * width),
    row3: all.slice(1 + 2 * width, 1 + 3 * width),
    row4: all.slice(1 + 3 * width),
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `knapsack01-guide.test.ts` 가 잰다.
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
    row4: p.row4.map(toStep),
  };
}

const film = (steps: Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: tableStage(s.step, TABLE_OPTIONS),
  }));

/* ───────────────── 정적 한 장 ───────────────── */

/** 다 채운 DP 테이블 한 장 — 줄 곁말은 그 줄에서 고를 수 있는 물건의 무게다. */
function fullTable(extra: Partial<TableStep>): StageRow[] {
  const t = trace(WEIGHTS, VALUES, CAP);
  return tableStage(
    {
      table: t.rows.map((r) => [...r]),
      rowSide: t.rows.map((_, i) => rowUses(i)),
      ...extra,
    },
    TABLE_OPTIONS,
  );
}

/** 칸 하나를 정한 기록 — 본문이 짚는 칸을 기록에서 찾는다. */
export function cellOf(i: number, c: number): Cell {
  const cell = trace(WEIGHTS, VALUES, CAP).cells.find(
    (x) => x.i === i && x.c === c,
  );
  if (!cell) throw new Error(`dp[${i}][${c}] 의 기록이 없다`);
  return cell;
}

function ruleFrame(i: number, c: number): StageFrame {
  const cell = cellOf(i, c);
  const { expr } = cellText(cell);
  return {
    id: BRANCH_MARK[cell.branch],
    text: `${cellName([i, c])} = ${expr} ${cell.value}`,
    rows: fullTable({ read: cell.reads, write: [[i, c]] }),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

/** 과제 규모 — 물건 수 `n` 과 용량 `W` 의 위 끝. */
export const N_MAX = 100;
export const W_MAX = 10_000;

/** 무게 합만 기억하는 방식이 틀리는 용량 — 본문 「떠올리는 과정」과 「짚고 가기」가 같이 쓴다. */
export const CAP_WIDE = 10;

function approaches(): Approach[] {
  const subsets = 2 ** N_MAX;
  const small = knapsack01(WEIGHTS, VALUES, CAP_WIDE);
  const byWeight = oneRow(WEIGHTS, VALUES, CAP_WIDE, "up").best[
    CAP_WIDE
  ] as number;
  const cells = (N_MAX + 1) * (W_MAX + 1);
  const [m, e] = subsets.toExponential(2).split("e+");
  return [
    {
      name: "조합을 전부 만들어 보기",
      idea: "물건마다 담는다 · 두고 간다를 모두 정해 보고, 무게 합이 W 이하인 것 중 가치 합이 가장 큰 것을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `물건 ${N_MAX} 개면 조합 2^${N_MAX} ≈ ${m} × 10^${e} 가지`,
          ok: false,
        },
      ],
      lesson:
        "앞부분이 같은 조합을 다시 센다 — 무게 합이 같은 것을 한 항목으로 합치면 어떨까",
    },
    {
      name: "무게 합 하나만 기억하기",
      idea: "용량 c 마다 칸 하나에 최대 가치를 적고, 물건을 차례로 넣어 본다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `용량 ${CAP_WIDE} 에서 ${small}${이가(String(small))} 아니라 ${byWeight} — 한 물건을 두 번 담았다`,
          ok: false,
        },
        { label: "시간", value: `칸 ${num(W_MAX + 1)} 개`, ok: true },
      ],
      lesson: "몇 번째 물건까지 봤는지를 함께 적으면 어떨까",
    },
    {
      name: "물건을 하나씩 늘리는 DP 테이블",
      idea: "(본 물건 수 i, 용량 c) 칸에 최대 가치를 적는다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `용량 ${CAP_WIDE} 에서 ${small} — 맞다`,
          ok: true,
        },
        { label: "시간", value: `칸 ${num(cells)} 개`, ok: true },
      ],
    },
  ];
}

/* ───────────────── 「짚고 가기」의 한 줄 ───────────────── */

/** 한 줄 방식이 첫 물건을 처리하는 동안의 줄 — 이번에 쓴 칸과 읽은 칸. */
function oneRowFilm(dir: "up" | "down", pick: readonly number[]): StageFrame[] {
  const r = oneRow(WEIGHTS, VALUES, CAP, dir, 0);
  const w = WEIGHTS[0] as number;
  const v = VALUES[0] as number;
  return pick.map((c) => {
    const k = r.frames.findIndex((x) => x.c === c);
    const f = r.frames[k];
    if (!f) throw new Error(`c=${c} 걸음이 없다`);
    const states: Partial<Record<number, CellState>> = {};
    for (const x of f.reads) states[x] = "read";
    states[c] = "focus";
    // 읽은 왼쪽 칸이 이번 물건을 이미 반영했는가 — 같은 처리의 앞 걸음에서 쓴 칸이면 그렇다.
    const leftDone = r.frames.slice(0, k).some((x) => x.c === c - w);
    const rows: StageRow[] = [
      {
        kind: "index",
        label: "용량 c",
        labels: f.row.map((_, x) => x),
        focus: [c],
      },
      {
        kind: "cells",
        label: "best",
        values: f.row,
        states,
        side: leftDone
          ? `best[${c - w}] 는 이 물건을 이미 담은 값`
          : `best[${c - w}] 는 이 물건을 아직 안 본 값`,
      },
    ];
    // 한 번의 처리에서 칸마다 한 번만 쓰므로 쓰기 전 값은 처리 전 줄의 값이고, 읽은 왼쪽 칸은 쓴 칸과
    // 다른 자리라(무게 ≥ 1) 쓴 뒤의 줄에서 읽어도 같다.
    return {
      id: `c=${c}`,
      text: `best[${c}] = max(best[${c}], best[${c - w}] + ${v}) = max(${r.before[c]}, ${f.row[c - w]} + ${v}) = ${f.value}`,
      rows,
    };
  });
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-table": () => (
    <CellStage
      title={`knapsack01([${WEIGHTS.join(", ")}], [${VALUES.join(", ")}], ${CAP}) 의 DP 테이블 — 줄은 본 물건 수, 열은 용량`}
      rows={fullTable({})}
      columns={CAP + 1}
    />
  ),
  "concept-rule": () => {
    const f = ruleFrame(3, CAP);
    return (
      <CellStage
        title={`dp[3][${CAP}] 을 정하는 자리 — ${f.text}`}
        rows={f.rows}
        columns={CAP + 1}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`물건 ${N_MAX} 개 · 용량 ${num(W_MAX)} 까지`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-read-cell": () => {
    const i = 2;
    const c = 4;
    const t = trace(WEIGHTS, VALUES, CAP);
    const out: TableCell[] = [];
    t.rows.forEach((row, r) => {
      row.forEach((_, k) => {
        if (r !== i || k !== c) out.push([r, k]);
      });
    });
    return (
      <CellStage
        title={`dp[${i}][${c}] — 무게 ${WEIGHTS.slice(0, i).join(" · ")} 인 물건만 골라 용량 ${c} 로 얻는 최대 가치`}
        rows={fullTable({ write: [[i, c]], out })}
        columns={CAP + 1}
      />
    );
  },
  "build-reads": () => (
    <CellStageFilm
      title="칸 하나가 읽는 두 칸 — 윗 칸과, 윗 줄에서 무게만큼 왼쪽"
      columns={CAP + 1}
      frames={[ruleFrame(3, 2), ruleFrame(3, 4), ruleFrame(3, CAP)]}
    />
  ),
  "walk-row1": () => {
    const s = walkParts().row1;
    return (
      <CellStageFilm
        title={`knapsack01 — ${s[0]?.id}~${s.at(-1)?.id} · 첫 줄과 i=1 줄`}
        columns={CAP + 1}
        frames={film(s)}
      />
    );
  },
  "walk-row2": () => {
    const s = walkParts().row2;
    return (
      <CellStageFilm
        title={`knapsack01 — ${s[0]?.id}~${s.at(-1)?.id} · i=2 줄`}
        columns={CAP + 1}
        frames={film(s)}
      />
    );
  },
  "walk-row3": () => {
    const s = walkParts().row3;
    return (
      <CellStageFilm
        title={`knapsack01 — ${s[0]?.id}~${s.at(-1)?.id} · i=3 줄`}
        columns={CAP + 1}
        frames={film(s)}
      />
    );
  },
  "walk-row4": () => {
    const s = walkParts().row4;
    return (
      <CellStageFilm
        title={`knapsack01 — ${s[0]?.id}~${s.at(-1)?.id} · i=4 줄과 답`}
        columns={CAP + 1}
        frames={film(s)}
      />
    );
  },
  "pause-one-row-up": () => (
    <CellStageFilm
      title={`한 줄을 작은 용량부터 채울 때 — 첫 물건(${itemName(0)})`}
      columns={CAP + 1}
      frames={oneRowFilm("up", [1, 2])}
    />
  ),
  "pause-one-row-down": () => (
    <CellStageFilm
      title={`한 줄을 큰 용량부터 채울 때 — 첫 물건(${itemName(0)})`}
      columns={CAP + 1}
      frames={oneRowFilm("down", [2, 1])}
    />
  ),
};
