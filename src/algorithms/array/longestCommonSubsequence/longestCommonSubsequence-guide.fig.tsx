/**
 * `longestCommonSubsequence-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 칸 하나를 정하는 자리마다 무엇을
 * 읽었는지는 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록하고, 답은 정본이 낸다. 걸음 재생
 * 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `longestCommonSubsequence-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 을를, 이가 } from "../../../../tools/josa.ts";
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
import { longestCommonSubsequence } from "./longestCommonSubsequence-guide.ref.ts";

const REF = new URL("./longestCommonSubsequence-guide.ref.ts", import.meta.url)
  .pathname;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 칸 하나를 정하기 직전에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 기록은 줄 두 개(`prev`·`cur`)를 가리키기만 하고, 값은 호출이 끝난
 * 뒤 읽는다. 칸은 한 번만 쓰이고 `prev` 는 그 뒤로 바뀌지 않으므로 끝난 뒤의 값이 곧 그 순간의 값이다.
 */
const probed = await loadMutant<{
  longestCommonSubsequence(s: string, t: string): number;
}>(REF, {
  swap: [
    /^(\s*)if \(s\[i - 1\] === t\[j - 1\]\) \{$/,
    "$1(globalThis as any).__cells.push({ i, j, prev, cur });\n$1if (s[i - 1] === t[j - 1]) {",
  ],
});

/**
 * DP 테이블을 깐 직후의 모습과 호출이 끝난 모습을 붙잡는 사본 — 역시 정본 소스에서 기계로 만든다.
 * 한쪽이 빈 문자열이라 칸을 하나도 정하지 않는 입력도 이 사본으로 DP 테이블을 본다.
 */
const probedTable = await loadMutant<{
  longestCommonSubsequence(s: string, t: string): number;
}>(REF, {
  swap: [
    /^(\s*)for \(let i = 1; i <= n; i\+\+\) \{$/,
    "$1(globalThis as any).__init = dp.map((r) => [...r]);\n$1(globalThis as any).__dp = dp;\n$1for (let i = 1; i <= n; i++) {",
  ],
});

/** 칸 하나를 정한 갈래 — ③ 마지막 글자가 같다 · ④ 다르다. */
export type Branch = "same" | "diff";

export const BRANCH_MARK: Record<Branch, string> = {
  same: "③",
  diff: "④",
};

/** 칸 하나를 정한 기록. */
export interface Cell {
  readonly i: number;
  readonly j: number;
  /** 이 칸이 비교한 두 글자 `s[i-1]` · `t[j-1]`. */
  readonly a: string;
  readonly b: string;
  readonly branch: Branch;
  readonly value: number;
  /** 왼쪽 위 `dp[i-1][j-1]`. */
  readonly diag: number;
  /** 위 `dp[i-1][j]`. */
  readonly up: number;
  /** 왼쪽 `dp[i][j-1]`. */
  readonly left: number;
  /** 읽은 칸 — ③ 은 왼쪽 위 하나, ④ 는 위와 왼쪽. */
  readonly reads: readonly TableCell[];
}

export interface Trace {
  readonly cells: readonly Cell[];
  /** 호출이 끝난 뒤의 DP 테이블 전체(`dp[0]` 부터 `dp[n]` 까지). */
  readonly rows: readonly (readonly number[])[];
  /** DP 테이블을 깐 직후 — 모든 칸이 `fill` 이 둔 0 이다. */
  readonly init: readonly (readonly number[])[];
  readonly result: number;
}

/** 정본 한 번 호출의 기록. 답은 정본과 대조하고, 칸마다 전이식이 실제로 성립했는지도 대조한다. */
export function trace(s: string, t: string): Trace {
  const g = globalThis as unknown as {
    __init: number[][];
    __dp: number[][];
    __cells: { i: number; j: number; prev: number[]; cur: number[] }[];
  };
  g.__cells = [];
  const result = probed.longestCommonSubsequence(s, t);
  const want = longestCommonSubsequence(s, t);
  if (result !== want) {
    throw new Error(
      `계측 사본이 정본과 다른 답을 냈다 — "${s}" · "${t}": ${result} ≠ ${want}`,
    );
  }
  const raw = g.__cells;
  if (probedTable.longestCommonSubsequence(s, t) !== want) {
    throw new Error("DP 테이블을 붙잡는 사본이 정본과 다른 답을 냈다");
  }
  const init = g.__init.map((r) => [...r]);
  const rows = g.__dp.map((r) => [...r]);
  const cells: Cell[] = raw.map(({ i, j, prev, cur }) => {
    const value = cur[j] as number;
    if (value !== rows[i]?.[j]) {
      throw new Error(`두 사본의 dp[${i}][${j}] 가 다르다`);
    }
    const a = s[i - 1] as string;
    const b = t[j - 1] as string;
    const diag = prev[j - 1] as number;
    const up = prev[j] as number;
    const left = cur[j - 1] as number;
    const branch: Branch = a === b ? "same" : "diff";
    const want = branch === "same" ? diag + 1 : Math.max(up, left);
    if (value !== want) {
      throw new Error(`dp[${i}][${j}] 가 전이식과 다르다`);
    }
    return {
      i,
      j,
      a,
      b,
      branch,
      value,
      diag,
      up,
      left,
      reads:
        branch === "same"
          ? [[i - 1, j - 1]]
          : [
              [i - 1, j],
              [i, j - 1],
            ],
    };
  });
  // 칸을 정한 차례가 줄 → 열 오름차순인가. 아니면 걸음 번호가 코드의 차례와 어긋난다.
  cells.forEach((cell, k) => {
    const i = Math.floor(k / t.length) + 1;
    const j = (k % t.length) + 1;
    if (cell.i !== i || cell.j !== j) {
      throw new Error(`${k} 번째로 정한 칸이 dp[${i}][${j}] 가 아니다`);
    }
  });
  if ((rows[s.length]?.[t.length] ?? -1) !== result) {
    throw new Error("오른쪽 아래 칸이 반환값과 다르다");
  }
  return { cells, rows, init, result };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const S = "abcde";
export const T = "ace";

/** 과제 규모 — 두 문자열 길이의 위 끝. */
export const LIMIT = 1000;

const num = (x: number): string => x.toLocaleString("en-US");

/** 줄 머리 — `i` 와 그 줄에서 새로 보는 `s` 의 글자. */
export const rowHead = (s: string, i: number): string =>
  i === 0 ? "i=0 · ∅" : `i=${i} · ${s[i - 1]}`;

/** 열 머리 — 그 열에서 새로 보는 `t` 의 글자. `j=0` 열은 빈 접두어다. */
export const colHead = (t: string, j: number): string =>
  j === 0 ? "∅" : (t[j - 1] as string);

/** 2 차원 표 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const TABLE_OPTIONS: TableOptions = {
  rowHeads: Array.from({ length: S.length + 1 }, (_, i) => rowHead(S, i)),
  colHeads: Array.from({ length: T.length + 1 }, (_, j) => colHead(T, j)),
  colLabel: "t 의 글자",
};

/** 줄 곁말 — 그 줄까지 본 `s` 의 앞부분. */
const rowSeen = (i: number): string =>
  i === 0 ? "s 를 안 봤다" : `s 의 앞 "${S.slice(0, i)}"`;

const cellName = ([r, c]: TableCell): string => `dp[${r}][${c}]`;

/** 칸 하나를 정한 기록 — 본문이 짚는 칸을 기록에서 찾는다. */
export function cellOf(i: number, j: number): Cell {
  const cell = trace(S, T).cells.find((x) => x.i === i && x.j === j);
  if (!cell) throw new Error(`dp[${i}][${j}] 의 기록이 없다`);
  return cell;
}

/** 걸음 하나의 계산 한 줄과 설명 — 필름·패널·본문 표가 같이 쓴다. */
export function cellText(cell: Cell): { expr: string; detail: string } {
  const at = cellName([cell.i, cell.j]);
  const diag = cellName([cell.i - 1, cell.j - 1]);
  const up = cellName([cell.i - 1, cell.j]);
  const left = cellName([cell.i, cell.j - 1]);
  const cmp = `s[${cell.i - 1}] = '${cell.a}' 와 t[${cell.j - 1}] = '${cell.b}'`;
  if (cell.branch === "same") {
    return {
      expr: `${diag} + 1 = ${cell.diag} + 1 =`,
      detail: `${cmp} 가 같아 ③ 입니다. 왼쪽 위 ${diag} = ${cell.diag} 에 1 을 더해 ${at} = ${cell.value} 입니다.`,
    };
  }
  return {
    expr: `max(${up}, ${left}) = max(${cell.up}, ${cell.left}) =`,
    detail: `${cmp} 가 달라 ④ 입니다. 위 ${up} = ${cell.up}${과와(String(cell.up))} 왼쪽 ${left} = ${cell.left} 중 큰 쪽을 이어받아 ${at} = ${cell.value} 입니다.`,
  };
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly step: TableStep;
}

/** 걸음 전부 — 테두리를 까는 한 걸음 + 칸마다 한 걸음 + 답을 읽는 한 걸음. */
export function walkSteps(): Step[] {
  const tr = trace(S, T);
  const n = S.length;
  const m = T.length;
  const rows: (number | null)[][] = tr.init.map((row, i) =>
    row.map((v, j) => (i === 0 || j === 0 ? v : null)),
  );
  const snapshot = () => rows.map((r) => [...r]);
  const border: TableCell[] = [];
  for (let j = 0; j <= m; j++) border.push([0, j]);
  for (let i = 1; i <= n; i++) border.push([i, 0]);
  const steps: Step[] = [];
  let k = 1;
  steps.push({
    id: `T${k++}`,
    title: "테두리 = 0",
    detail: `DP 테이블을 ${n + 1} 줄 × ${m + 1} 칸으로 깔고 0 으로 채웁니다. 0 번째 줄은 s 가 빈 문자열, 0 번째 열은 t 가 빈 문자열인 자리라 그 ${border.length} 칸은 정의에서 바로 ${tr.init[0]?.[0]} 입니다.`,
    step: {
      table: snapshot(),
      write: border,
      calc: { expr: "dp[0][j] = dp[i][0] =", result: String(tr.init[0]?.[0]) },
    },
  });
  for (const cell of tr.cells) {
    const row = rows[cell.i] as (number | null)[];
    row[cell.j] = cell.value;
    const { expr, detail } = cellText(cell);
    steps.push({
      id: `T${k++}`,
      title: `${cellName([cell.i, cell.j])} = ${cell.value} ${BRANCH_MARK[cell.branch]}`,
      detail,
      step: {
        table: snapshot(),
        read: cell.reads,
        write: [[cell.i, cell.j]],
        calc: { expr, result: String(cell.value) },
      },
    });
  }
  steps.push({
    id: `T${k++}`,
    title: `dp[${n}][${m}] = ${tr.result} 반환`,
    detail: `오른쪽 아래 칸 dp[${n}][${m}] 를 읽어 ${tr.result}${을를(String(tr.result))} 돌려줍니다.`,
    step: {
      table: snapshot(),
      read: [[n, m]],
      calc: { expr: `dp[${n}][${m}] =`, result: String(tr.result) },
    },
  });
  return steps;
}

/**
 * 필름과 패널을 가르는 자리 — 테두리 걸음과 i=1 · i=2 줄, i=3 · i=4 줄, i=5 줄과 답을 읽는 걸음.
 * 한 벌에 모으면 정적 필름이 열일곱 장이라 줄 둘씩 가른다.
 */
export function walkParts(): { row12: Step[]; row34: Step[]; row5: Step[] } {
  const all = walkSteps();
  const width = T.length;
  return {
    row12: all.slice(0, 1 + 2 * width),
    row34: all.slice(1 + 2 * width, 1 + 4 * width),
    row5: all.slice(1 + 4 * width),
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `longestCommonSubsequence-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const toStep = (s: Step) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...s.step,
  });
  const p = walkParts();
  return {
    row12: p.row12.map(toStep),
    row34: p.row34.map(toStep),
    row5: p.row5.map(toStep),
  };
}

const film = (steps: Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: tableStage(s.step, TABLE_OPTIONS),
  }));

/* ───────────────── 정적 한 장 ───────────────── */

/** 다 채운 DP 테이블 한 장 — 줄 곁말은 그 줄까지 본 `s` 의 앞부분이다. */
function fullTable(extra: Partial<TableStep>): StageRow[] {
  const tr = trace(S, T);
  return tableStage(
    {
      table: tr.rows.map((r) => [...r]),
      rowSide: tr.rows.map((_, i) => rowSeen(i)),
      ...extra,
    },
    TABLE_OPTIONS,
  );
}

function ruleFrame(i: number, j: number): StageFrame {
  const cell = cellOf(i, j);
  const { expr } = cellText(cell);
  return {
    id: `${BRANCH_MARK[cell.branch]} ${i},${j}`,
    text: `${cellName([i, j])} — '${cell.a}' 와 '${cell.b}' 가 ${cell.branch === "same" ? "같다" : "다르다"} · ${expr} ${cell.value}`,
    rows: fullTable({ read: cell.reads, write: [[i, j]] }),
  };
}

/* ───────────────── 답을 거슬러 따라가기 ───────────────── */

/** 거슬러 가는 걸음 하나 — 지금 선 칸과 그 칸에서 고른 방향. */
export interface BackStep {
  readonly i: number;
  readonly j: number;
  /** `diag` 는 마지막 글자가 같아 그 글자를 고르고 왼쪽 위로, `up`·`left` 는 한쪽 글자를 버린다. */
  readonly move: "diag" | "up" | "left" | "end";
  /** 지금까지 고른 글자 — 뒤에서부터 모으므로 앞에 붙인다. */
  readonly picked: string;
}

/**
 * 다 채운 DP 테이블을 오른쪽 아래에서 거슬러 따라가며 고른 글자를 찾는다. 정본은 길이만 돌려주므로 이
 * 걸음은 정본의 DP 테이블(`trace` 가 붙잡은 것)을 읽기만 하고 새 값을 만들지 않는다. 위와 왼쪽이 같으면
 * 위로 간다. 모은 글자의 길이가 정본의 답과 다르면 던진다.
 */
export function traceBack(s: string, t: string): BackStep[] {
  const { rows, result } = trace(s, t);
  const at = (i: number, j: number) => rows[i]?.[j] as number;
  const out: BackStep[] = [];
  let i = s.length;
  let j = t.length;
  let picked = "";
  while (i > 0 && j > 0) {
    if (s[i - 1] === t[j - 1]) {
      out.push({ i, j, move: "diag", picked });
      picked = (s[i - 1] as string) + picked;
      i--;
      j--;
    } else if (at(i - 1, j) >= at(i, j - 1)) {
      out.push({ i, j, move: "up", picked });
      i--;
    } else {
      out.push({ i, j, move: "left", picked });
      j--;
    }
  }
  out.push({ i, j, move: "end", picked });
  if (picked.length !== result) {
    throw new Error(
      `거슬러 모은 글자 "${picked}" 의 길이가 답 ${result} 와 다르다`,
    );
  }
  return out;
}

const MOVE_TEXT: Record<BackStep["move"], string> = {
  diag: "글자가 같다 → 고르고 왼쪽 위로",
  up: "글자가 다르다 · 위가 크거나 같다 → 위로",
  left: "글자가 다르다 · 왼쪽이 크다 → 왼쪽으로",
  end: "테두리에 이르렀다 → 끝",
};

function backFilm(): StageFrame[] {
  const path = traceBack(S, T);
  return path.map((p, k) => ({
    id: `${k + 1}`,
    text: `${cellName([p.i, p.j])} — ${MOVE_TEXT[p.move]}`,
    rows: fullTable({
      read: path.slice(0, k).map((q) => [q.i, q.j] as TableCell),
      write: [[p.i, p.j]],
      rowSide: trace(S, T).rows.map((_, r) =>
        r === 0 ? `지나온 칸 ${k} · 고른 글자 "${p.picked}"` : rowSeen(r),
      ),
    }),
  }));
}

/* ───────────────── 「짚고 가기」의 한 줄 ───────────────── */

/**
 * 줄 하나로 줄이면서 **왼쪽 칸을 왼쪽 위 대신 쓴** 방식 — 정본과 다른 절차라 여기 따로 적는다.
 * 두 줄이 함께 바뀌는 구조 변경이라 `loadMutant`(한 줄 치환)로는 만들 수 없다. `frames` 는
 * `filmRow` 번째 줄을 채우는 동안 칸 하나를 쓸 때마다의 줄이다.
 */
export function rollingWrong(
  s: string,
  t: string,
  filmRow = s.length,
): {
  answer: number;
  row: number[];
  before: number[];
  frames: { j: number; row: number[] }[];
} {
  const m = t.length;
  const dp = new Array<number>(m + 1).fill(0);
  let before = [...dp];
  let frames: { j: number; row: number[] }[] = [];
  for (let i = 1; i <= s.length; i++) {
    if (i === filmRow) before = [...dp];
    const fs: { j: number; row: number[] }[] = [];
    for (let j = 1; j <= m; j++) {
      dp[j] =
        s[i - 1] === t[j - 1]
          ? (dp[j - 1] as number) + 1
          : Math.max(dp[j] as number, dp[j - 1] as number);
      fs.push({ j, row: [...dp] });
    }
    if (i === filmRow) frames = fs;
  }
  return { answer: dp[m] as number, row: [...dp], before, frames };
}

/** 줄 하나로 줄이면서 틀리는 입력 — 본문 「짚고 가기」가 쓴다. */
export const ROLL_S = "bab";
export const ROLL_T = "aaaa";

function rollingFilm(): StageFrame[] {
  const filmRow = [...ROLL_S].indexOf("a") + 1;
  const r = rollingWrong(ROLL_S, ROLL_T, filmRow);
  return r.frames.map((f) => {
    const states: Partial<Record<number, CellState>> = {};
    const same = ROLL_S[filmRow - 1] === ROLL_T[f.j - 1];
    if (same) states[f.j - 1] = "read";
    else {
      states[f.j] = "read";
      states[f.j - 1] = "read";
    }
    states[f.j] = "focus";
    const rows: StageRow[] = [
      {
        kind: "index",
        label: "t 의 글자",
        labels: f.row.map((_, j) => colHead(ROLL_T, j)),
        focus: [f.j],
      },
      {
        kind: "cells",
        label: `dp · i=${filmRow}`,
        values: f.row,
        states,
        side:
          f.j > 1
            ? `dp[${f.j - 1}] 는 이번 줄에서 이미 덮은 값`
            : `dp[${f.j - 1}] 는 테두리 0`,
      },
    ];
    return {
      id: `j=${f.j}`,
      text: `dp[${f.j}] = dp[${f.j - 1}] + 1 = ${f.row[f.j - 1]} + 1 = ${f.row[f.j]} (윗 줄 값은 ${r.before[f.j]})`,
      rows,
    };
  });
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 ───────────────── */

/** 글자 개수만 세어 겹치는 만큼 더한다 — 순서를 안 본다. */
export function byFrequency(s: string, t: string): number {
  const count = (x: string): Map<string, number> => {
    const out = new Map<string, number>();
    for (const ch of x) out.set(ch, (out.get(ch) ?? 0) + 1);
    return out;
  };
  const a = count(s);
  const b = count(t);
  let sum = 0;
  for (const [ch, k] of a) sum += Math.min(k, b.get(ch) ?? 0);
  return sum;
}

/** 왼쪽부터 붙일 수 있는 대로 붙인다 — 한 번 붙이면 되돌아가지 않는다. */
export function byGreedyLeft(s: string, t: string): number {
  let at = 0;
  let taken = 0;
  for (const ch of s) {
    const found = t.indexOf(ch, at);
    if (found < 0) continue;
    taken++;
    at = found + 1;
  }
  return taken;
}

/** 기억 없이 그대로 부르는 재귀. 호출 횟수와 상태마다 불린 횟수를 센다. */
export function byPlainRecursion(
  s: string,
  t: string,
): { answer: number; calls: number; perState: Map<string, number> } {
  let calls = 0;
  const perState = new Map<string, number>();
  const f = (i: number, j: number): number => {
    calls++;
    const key = `${i},${j}`;
    perState.set(key, (perState.get(key) ?? 0) + 1);
    if (i === 0 || j === 0) return 0;
    if (s[i - 1] === t[j - 1]) return f(i - 1, j - 1) + 1;
    return Math.max(f(i - 1, j), f(i, j - 1));
  };
  const answer = f(s.length, t.length);
  return { answer, calls, perState };
}

/** 이항계수. 기억 없는 재귀의 호출 수를 닫힌 형태로 낼 때 쓴다. */
export function binom(a: number, b: number): bigint {
  let out = 1n;
  for (let k = 0; k < b; k++) out = (out * BigInt(a - k)) / BigInt(k + 1);
  return out;
}

/** 자릿수. 과제 규모의 값이 화면에 안 들어갈 때 쓴다. */
export const digits = (n: bigint): number => n.toString().length;

/** 반례 둘 — 글자 개수만 세는 방식과 왼쪽부터 붙이는 방식이 틀리는 입력. */
export const FREQ_CASE: [string, string] = ["ab", "ba"];
export const GREEDY_CASE: [string, string] = ["cab", "abc"];

function approaches(): Approach[] {
  const cand = digits(2n ** BigInt(LIMIT));
  const calls = digits(2n * binom(2 * LIMIT, LIMIT) - 1n);
  const cells = (LIMIT + 1) * (LIMIT + 1);
  const [fs, ft] = FREQ_CASE;
  const [gs, gt] = GREEDY_CASE;
  const freqRight = longestCommonSubsequence(fs, ft);
  const greedyRight = longestCommonSubsequence(gs, gt);
  return [
    {
      name: "부분 수열을 전부 만들어 보기",
      idea: "s 의 부분 수열을 하나씩 만들어 t 의 부분 수열인지 확인하고 가장 긴 것을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `길이 ${num(LIMIT)} 이면 후보 ${cand} 자리 수`,
          ok: false,
        },
      ],
      lesson: "후보를 만들지 않고 글자만 세면 어떨까",
    },
    {
      name: "겹치는 글자 개수 세기",
      idea: "글자마다 두 문자열에 나온 횟수의 작은 쪽을 더한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `"${fs}" 와 "${ft}" 에서 ${freqRight}${이가(String(freqRight))} 아니라 ${byFrequency(fs, ft)} — 순서를 안 봤다`,
          ok: false,
        },
        { label: "시간", value: "두 문자열을 한 번씩", ok: true },
      ],
      lesson: "순서를 지키며 왼쪽부터 붙이면 어떨까",
    },
    {
      name: "왼쪽부터 붙이기",
      idea: "s 를 앞에서부터 읽으며 t 에서 아직 안 쓴 가장 왼쪽 같은 글자에 붙인다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `"${gs}" 와 "${gt}" 에서 ${greedyRight}${이가(String(greedyRight))} 아니라 ${byGreedyLeft(gs, gt)} — 버려야 할 글자를 붙였다`,
          ok: false,
        },
        { label: "시간", value: "두 문자열을 한 번씩", ok: true },
      ],
      lesson: "붙일지 버릴지를 둘 다 해 보면 어떨까 — 마지막 글자로 나눈다",
    },
    {
      name: "마지막 글자로 줄이는 재귀",
      idea: "마지막 두 글자가 같으면 둘 다 떼고 +1, 다르면 한쪽을 뗀 두 답 중 큰 쪽",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `공통 글자가 없는 길이 ${num(LIMIT)} 쌍이면 호출 ${calls} 자리 수`,
          ok: false,
        },
      ],
      lesson: "같은 (i, j) 를 거듭 부른다 — 답을 칸에 적어 두면 어떨까",
    },
    {
      name: "접두어 쌍 DP 테이블",
      idea: "(s 의 앞 i 글자, t 의 앞 j 글자) 칸마다 답을 적는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        { label: "시간", value: `칸 ${num(cells)} 개`, ok: true },
      ],
    },
  ];
}

/* ───────────────── 전체 컨셉의 고른 자리 ───────────────── */

/** 거슬러 따라가며 찾은 글자가 `s`·`t` 에서 몇 번째 자리였는가 — 전체 컨셉의 그림이 쓴다. */
export function pickedPositions(): { s: number[]; t: number[]; word: string } {
  const path = traceBack(S, T).filter((p) => p.move === "diag");
  const s = path.map((p) => p.i - 1).reverse();
  const t = path.map((p) => p.j - 1).reverse();
  const word = s.map((k) => S[k]).join("");
  return { s, t, word };
}

function pickRows(): StageRow[] {
  const p = pickedPositions();
  const mark = (ks: number[]) =>
    Object.fromEntries(ks.map((k) => [k, "focus" as CellState]));
  return [
    { kind: "index", label: "자리" },
    {
      kind: "cells",
      label: "s",
      values: [...S],
      states: mark(p.s),
      side: `고른 자리 ${p.s.join(" · ")}`,
    },
    {
      kind: "cells",
      label: "t",
      values: [...T],
      states: mark(p.t),
      side: `고른 자리 ${p.t.join(" · ")}`,
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

const COLS = T.length + 1;

export const FIGS: Record<string, () => ReactElement> = {
  "concept-pick": () => {
    const p = pickedPositions();
    return (
      <CellStage
        title={`s = "${S}" 와 t = "${T}" 에서 같은 "${p.word}" 를 고른 자리`}
        rows={pickRows()}
        columns={S.length}
      />
    );
  },
  "concept-table": () => (
    <CellStage
      title={`longestCommonSubsequence("${S}", "${T}") 의 DP 테이블 — 줄은 s 의 글자, 열은 t 의 글자`}
      rows={fullTable({})}
      columns={COLS}
    />
  ),
  "concept-rule": () => (
    <CellStageFilm
      title="칸 하나가 읽는 자리 — 글자가 같으면 왼쪽 위, 다르면 위와 왼쪽"
      columns={COLS}
      frames={[ruleFrame(3, 2), ruleFrame(4, 2)]}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 다섯 — 넷은 버렸고 하나가 남았다"
        constraint={`두 문자열 길이 ${num(LIMIT)} 까지`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-read-cell": () => {
    const i = 3;
    const j = 2;
    const tr = trace(S, T);
    const out: TableCell[] = [];
    tr.rows.forEach((row, r) => {
      row.forEach((_, c) => {
        if (r !== i || c !== j) out.push([r, c]);
      });
    });
    return (
      <CellStage
        title={`dp[${i}][${j}] — s 의 앞 "${S.slice(0, i)}" 와 t 의 앞 "${T.slice(0, j)}" 만 놓고 본 답`}
        rows={fullTable({ write: [[i, j]], out })}
        columns={COLS}
      />
    );
  },
  "build-reads": () => (
    <CellStageFilm
      title="칸 하나를 정하는 세 모양 — 같은 글자 · 다른 글자에서 왼쪽이 큰 칸 · 위가 큰 칸"
      columns={COLS}
      frames={[ruleFrame(3, 2), ruleFrame(1, 2), ruleFrame(4, 2)]}
    />
  ),
  "build-trace-back": () => (
    <CellStageFilm
      title={`dp[${S.length}][${T.length}] 에서 거슬러 따라가기 — 대각선으로 간 칸의 글자가 답을 이룬다`}
      columns={COLS}
      frames={backFilm()}
    />
  ),
  "walk-row12": () => {
    const s = walkParts().row12;
    return (
      <CellStageFilm
        title={`longestCommonSubsequence — ${s[0]?.id}~${s.at(-1)?.id} · 테두리와 i=1 · i=2 줄`}
        columns={COLS}
        frames={film(s)}
      />
    );
  },
  "walk-row34": () => {
    const s = walkParts().row34;
    return (
      <CellStageFilm
        title={`longestCommonSubsequence — ${s[0]?.id}~${s.at(-1)?.id} · i=3 · i=4 줄`}
        columns={COLS}
        frames={film(s)}
      />
    );
  },
  "walk-row5": () => {
    const s = walkParts().row5;
    return (
      <CellStageFilm
        title={`longestCommonSubsequence — ${s[0]?.id}~${s.at(-1)?.id} · i=5 줄과 답`}
        columns={COLS}
        frames={film(s)}
      />
    );
  },
  "pause-rolling": () => (
    <CellStageFilm
      title={`줄 하나로 줄이고 왼쪽 칸을 왼쪽 위로 쓸 때 — "${ROLL_S}" 와 "${ROLL_T}" 의 'a' 줄`}
      columns={ROLL_T.length + 1}
      frames={rollingFilm()}
    />
  ),
};
