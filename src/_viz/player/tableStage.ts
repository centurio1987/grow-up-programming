/**
 * 걸음 재생 패널의 무대 갈래 「2 차원 표」 — 행과 열 두 축으로 칸을 채우는 동적 계획법(동전 조합 ·
 * 배낭 · 편집 거리 · 최장 공통 부분 수열)의 걸음을 `CellStage` 줄로 옮긴다(KAN-058, SPEC §13 「다른
 * 갈래의 무대」의 2 차원 표 줄).
 *
 * 무대는 **처음부터 표 전체**를 그린다. 맨 위 줄이 열 머리(금액 · 둘째 문자열의 글자)이고, 그 아래로
 * 표의 줄마다 칸 한 줄을 쌓는다. 줄 머리(동전 · 첫째 문자열의 글자)는 칸 줄의 머리 라벨이다. 아직 안 쓴
 * 칸은 `null`(점선)이다. 걸음마다 바뀌는 것은 **쓰는 칸 하나와 그 칸이 읽는 이웃**뿐이고, 2 차원에서는
 * ▲ 줄을 두지 않고 읽음 테만 쓴다 — 칸 아래 ▲ 는 줄마다 한 줄씩 늘어나 표의 모양을 흐린다. 쓰는 칸의
 * 열 머리는 반전해 「지금 어느 열인가」를 보인다.
 *
 * 값은 `.sim.ts` 가 싣고, 그 값이 정본 실행과 같은지는 가이드의 시험이 잰다 — 여기서는 계산하지
 * 않고 **배치만** 한다. 줄 구성이 걸음마다 같아서 무대 높이가 바뀌지 않는다(시안 규칙 5).
 */

import type { CellState } from "../patterns/ArrayStrip";
import type { StageRow, StageTone } from "../patterns/CellStage";

/** 표의 칸 하나 — `[줄, 열]`. */
export type TableCell = readonly [number, number];

/**
 * 표 아래 입력 줄에 거는 괄호 하나. `from`·`to` 는 표의 열 번호다(입력 줄의 칸이 표의 열과 짝이다).
 * `query` 는 입력 줄 **위**에, 나머지는 입력 줄 **아래**에 선다(`CellStage` 의 괄호 규칙).
 */
export interface TablePiece {
  readonly label?: string;
  readonly from: number;
  readonly to: number;
  readonly tone: StageTone;
  readonly text?: string;
  readonly side?: string;
}

/**
 * 표 아래에 두는 입력 한 줄 — 표의 열마다 입력의 칸 하나가 짝인 경우(행렬 체인의 열 `j` 와 행렬
 * `A_j`). 걸음마다 같은 값을 적는다.
 */
export interface TableStrip {
  readonly label?: string;
  readonly values: readonly (number | string)[];
  readonly side?: string;
}

/** 걸음 하나. */
export interface TableStep {
  /** 이 걸음이 끝난 뒤의 표 전체. 줄마다 칸 수가 달라도 되고 열은 가장 긴 줄에 맞춘다(nQueens 의 판 4칸 + 비트 7칸). 아직 안 쓴 칸은 `null`. */
  readonly table: readonly (readonly (number | string | null)[])[];
  /** 이번에 쓰는 칸이 읽은 이웃 — 「읽음」. */
  readonly read?: readonly TableCell[];
  /** 이번에 쓴 칸 — 「새로 씀」. 보통 하나다. */
  readonly write?: readonly TableCell[];
  /** 이번 걸음이 보지 않는 칸 — 「이번 걸음 밖」(대시). 칸 하나가 어느 범위를 뜻하는지 보일 때 쓴다. */
  readonly out?: readonly TableCell[];
  /**
   * 값을 정하는 중인데 이번 걸음에는 아직 쓰지 않은 칸 — 칸은 그대로 두고 **열 머리만** 반전한다. 칸
   * 하나를 후보 여럿으로 정하는 편(행렬 체인)에서 마지막 후보 전의 걸음이 어느 칸의 후보인지 보인다.
   */
  readonly target?: readonly TableCell[];
  /** 표 아래 입력 줄(`TableOptions.strip`)에 거는 괄호 — 이번 칸이 맡는 구간과 그 구간을 가른 조각. */
  readonly pieces?: readonly TablePiece[];
  /**
   * 줄마다 곁말 — 없으면(또는 그 줄이 `null` 이면) 「채움 x / n」이다. 처음부터 값이 차 있는 줄이나,
   * 줄마다 적을 셈이 따로 있을 때 쓴다.
   */
  readonly rowSide?: readonly (string | null)[];
  /** 이번 걸음의 계산 한 줄 — 알약에 싣는다(예: `dp[1][2] + dp[2][0] = 1 + 1 =` · `2`). */
  readonly calc?: { readonly expr: string; readonly result: string } | null;
  /** 무대 어디에도 자리가 없는 값만. 없으면 `null`. */
  readonly vars?: string | null;
}

export interface TableOptions {
  /** 줄 머리 — 표의 줄마다 하나(예: 「i=1 · 1원」 · 문자열의 글자). */
  readonly rowHeads: readonly string[];
  /** 열 머리 — 표의 열마다 하나(예: 금액 0 · 1 · 2 … · 문자열의 글자). */
  readonly colHeads: readonly (number | string)[];
  /** 열 머리 줄의 이름(예: 「금액 a」). */
  readonly colLabel?: string;
  /** 표 아래에 두는 입력 줄. 없으면 표만 그린다. */
  readonly strip?: TableStrip;
}

const has = (cells: readonly TableCell[] | undefined, r: number, c: number) =>
  (cells ?? []).some(([x, y]) => x === r && y === c);

const bracketOf = (p: TablePiece): StageRow => ({
  kind: "bracket",
  label: p.label,
  from: p.from,
  to: p.to,
  tone: p.tone,
  text: p.text,
  side: p.side,
});

/**
 * 걸음 하나의 무대 줄 — 열 머리 한 줄 + 표의 줄마다 칸 한 줄. 입력 줄(`strip`)이 있으면 그 아래에
 * `query` 괄호 · 입력 줄 · 조각 괄호를 차례로 더하고, 없으면 괄호만 표 아래에 더한다. 괄호가 없는
 * 걸음은 괄호 줄을 싣지 않는다 — 패널 높이는 가장 높은 걸음에 맞춰 고정된다.
 */
export function tableStage(s: TableStep, opts: TableOptions): StageRow[] {
  const writeCols = [
    ...new Set([...(s.write ?? []), ...(s.target ?? [])].map(([, c]) => c)),
  ];
  const rows: StageRow[] = [
    {
      kind: "index",
      label: opts.colLabel,
      labels: opts.colHeads,
      focus: writeCols,
    },
  ];
  s.table.forEach((values, r) => {
    const states: Partial<Record<number, CellState>> = {};
    values.forEach((_, c) => {
      if (has(s.write, r, c)) states[c] = "focus";
      else if (has(s.read, r, c)) states[c] = "read";
      else if (has(s.out, r, c)) states[c] = "out";
    });
    const filled = values.filter((v) => v !== null).length;
    rows.push({
      kind: "cells",
      label: opts.rowHeads[r],
      values,
      states,
      side: s.rowSide?.[r] ?? `채움 ${filled} / ${values.length}`,
    });
  });
  const pieces = s.pieces ?? [];
  if (opts.strip) {
    for (const p of pieces) if (p.tone === "query") rows.push(bracketOf(p));
    rows.push({
      kind: "cells",
      label: opts.strip.label,
      values: opts.strip.values,
      side: opts.strip.side,
    });
    for (const p of pieces) if (p.tone !== "query") rows.push(bracketOf(p));
  } else {
    for (const p of pieces) rows.push(bracketOf(p));
  }
  return rows;
}

/** 격자 칸 수 — 표의 열 수. */
export const tableColumns = (s: TableStep): number =>
  Math.max(0, ...s.table.map((row) => row.length));

export const tableCalc = (s: TableStep) => s.calc ?? null;
export const tableVars = (s: TableStep) => s.vars ?? null;
