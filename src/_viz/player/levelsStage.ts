/**
 * 걸음 재생 패널의 무대 갈래 「층」 — 배열 위에 층을 쌓는 구조(Sparse Table · 이진 올리기)의 걸음을
 * `CellStage` 줄로 옮긴다(KAN-057 검토 지적 6, claude-design 「Step Player」 시안 3절).
 *
 * 걸음 데이터의 필드는 시안 2절 「걸음 데이터에 필요한 필드」를 그대로 따른다. 쌓는 걸음은
 * `levels`(아직 안 쓴 칸은 `null`) · `read` · `write`, 답하는 걸음은 `query` · `level` · `lookup` ·
 * `pieces` · `overlap` · `answers` · `answerSlots` 다. 값은 `.sim.ts` 가 싣고, 그 값이 정본 실행과
 * 같은지는 가이드의 시험이 잰다 — 여기서는 계산하지 않고 **배치만** 한다.
 *
 * 줄 구성은 걸음마다 같다. 읽는 칸이 없는 층에도 ▲ 줄을 빈 채로 두어 무대 높이가 걸음 사이에
 * 바뀌지 않는다(시안 규칙 5).
 */

import type { CellState } from "../patterns/ArrayStrip";
import type { StageRow } from "../patterns/CellStage";

export interface LevelCell {
  readonly level: number;
  readonly index: number;
}

/** 쌓는 걸음 — 위층 칸 하나를 아래층 두 칸에서 만든다. */
export interface LevelsBuildStep {
  readonly levels: readonly (readonly (number | null)[])[];
  readonly read: readonly LevelCell[];
  readonly write: LevelCell & {
    readonly value: number;
    /** 새 칸이 덮는 배열 구간 `[a, b]`. */
    readonly covers: readonly [number, number];
  };
}

export interface LevelPiece extends LevelCell {
  readonly side: "left" | "right";
  readonly value: number;
  readonly covers: readonly [number, number];
}

/** 답하는 걸음 — 층 하나에서 두 조각을 읽고 작은 쪽을 답한다. */
export interface LevelsQueryStep {
  readonly levels: readonly (readonly number[])[];
  readonly query: readonly [number, number];
  readonly level: number;
  /** 층을 고른 계산 한 줄(예: `logTable[5] = 2`). */
  readonly lookup: string;
  readonly pieces: readonly LevelPiece[];
  readonly overlap: readonly number[];
  readonly answers: readonly number[];
  readonly answerSlots: number;
}

export type LevelsStep = LevelsBuildStep | LevelsQueryStep;

export const isQuery = (s: LevelsStep): s is LevelsQueryStep => "query" in s;

export interface LevelsOptions {
  /** 입력 배열 이름 — 「A 의 값」 줄 머리에 쓴다. */
  readonly arrayName?: string;
  /** 두 칸을 합치는 연산 이름 — 계산 알약에 쓴다(예: `min`). */
  readonly op: string;
}

const has = (cells: readonly LevelCell[], level: number, index: number) =>
  cells.some((c) => c.level === level && c.index === index);

const span = (a: number, b: number): number[] =>
  Array.from({ length: b - a + 1 }, (_, n) => a + n);

function buildRows(s: LevelsBuildStep): StageRow[] {
  const rows: StageRow[] = [
    {
      kind: "index",
      label: "인덱스",
      focus: span(s.write.covers[0], s.write.covers[1]),
    },
  ];
  const last = s.levels.length - 1;
  s.levels.forEach((values, k) => {
    const states: Partial<Record<number, CellState>> = {};
    values.forEach((_, i) => {
      if (k === s.write.level && i === s.write.index) states[i] = "focus";
      else if (has(s.read, k, i)) states[i] = "read";
    });
    const filled = values.filter((v) => v !== null).length;
    rows.push({
      kind: "cells",
      level: k,
      values,
      states,
      side:
        k === 0
          ? `입력 · 칸 ${values.length}`
          : `채움 ${filled} / ${values.length}`,
    });
    if (k === last) return;
    const reads = s.read.filter((c) => c.level === k).map((c) => c.index);
    const gap =
      reads.length === 2 ? Math.abs((reads[1] ?? 0) - (reads[0] ?? 0)) : 0;
    rows.push({
      kind: "caret",
      cells: reads,
      side:
        reads.length === 0
          ? undefined
          : gap <= 1
            ? "이번에 읽는 두 칸"
            : `이번에 읽는 두 칸 · ${gap} 칸 떨어짐`,
    });
  });
  rows.push({
    kind: "bracket",
    from: s.write.covers[0],
    to: s.write.covers[1],
    tone: "make",
    text: `새 칸이 덮는 [${s.write.covers[0]},${s.write.covers[1]}]`,
  });
  return rows;
}

function queryRows(s: LevelsQueryStep, arrayName: string): StageRow[] {
  const [l, r] = s.query;
  const n = r - l + 1;
  const left = s.pieces.find((p) => p.side === "left");
  const right = s.pieces.find((p) => p.side === "right");
  const same = left !== undefined && right?.index === left.index;
  const array = s.levels[0] ?? [];
  const arrayStates: Partial<Record<number, CellState>> = {};
  array.forEach((_, i) => {
    if (i < l || i > r) arrayStates[i] = "out";
    else if (s.overlap.includes(i)) arrayStates[i] = "overlap";
  });
  const rows: StageRow[] = [
    {
      kind: "bracket",
      label: "질의",
      from: l,
      to: r,
      tone: "query",
      text: `[${l},${r}] · ${n} 칸`,
    },
    { kind: "index", label: "인덱스" },
    {
      kind: "cells",
      label: `${arrayName} 의 값`,
      values: array,
      states: arrayStates,
      side: `겹친 칸 ${s.overlap.length} 개`,
    },
  ];
  for (const p of [left, right]) {
    if (!p) continue;
    rows.push({
      kind: "bracket",
      label: p.side === "left" ? "왼쪽 조각" : "오른쪽 조각",
      from: p.covers[0],
      to: p.covers[1],
      tone: p.side,
      text: `${p.level} 층 칸 ${p.index}`,
      side:
        p.side === "right" && same
          ? `= ${p.value} · 왼쪽과 같은 칸`
          : `= ${p.value}`,
    });
  }
  s.levels.forEach((values, k) => {
    const chosen = k === s.level;
    const states: Partial<Record<number, CellState>> = {};
    if (chosen) for (const p of s.pieces) states[p.index] = "read";
    rows.push({
      kind: "cells",
      level: k,
      values,
      states,
      side: chosen ? `고른 층 · ${s.lookup}` : undefined,
    });
    rows.push({
      kind: "caret",
      cells: chosen ? s.pieces.map((p) => p.index) : [],
      side: chosen
        ? same
          ? "두 조각이 같은 칸"
          : "이번에 읽는 두 칸"
        : undefined,
    });
  });
  const slots = Array.from(
    { length: s.answerSlots },
    (_, i) => s.answers[i] ?? null,
  );
  const answerStates: Partial<Record<number, CellState>> = {};
  if (s.answers.length > 0) answerStates[s.answers.length - 1] = "focus";
  rows.push({
    kind: "cells",
    label: "답 목록",
    values: slots,
    states: answerStates,
    side: `답 ${s.answers.length} / ${s.answerSlots}`,
  });
  return rows;
}

/** 걸음 하나의 무대 줄. */
export function levelsStage(s: LevelsStep, opts: LevelsOptions): StageRow[] {
  return isQuery(s) ? queryRows(s, opts.arrayName ?? "배열") : buildRows(s);
}

/** 격자 칸 수 — 입력 배열의 길이. */
export const levelsColumns = (s: LevelsStep): number =>
  s.levels[0]?.length ?? 0;

/** 설명 줄의 계산 알약 — `min(5, 2) =` 과 `2`. */
export function levelsCalc(
  s: LevelsStep,
  opts: LevelsOptions,
): { expr: string; result: string } {
  if (isQuery(s)) {
    const args = s.pieces.map((p) => p.value);
    return {
      expr: `${opts.op}(${args.join(", ")}) =`,
      result: String(s.answers.at(-1) ?? ""),
    };
  }
  const args = s.read.map((c) => s.levels[c.level]?.[c.index] ?? "");
  return {
    expr: `${opts.op}(${args.join(", ")}) =`,
    result: String(s.write.value),
  };
}

/**
 * 남는 변수 — 무대에 자리가 없는 값만(시안 4절 「변수 목록에 남기는 기준」). 쌓는 걸음은 전체
 * 진행(채운 칸 / 전체 칸), 답하는 걸음은 모든 값이 무대에 있어 없다.
 */
export function levelsVars(s: LevelsStep): string | null {
  if (isQuery(s)) return null;
  const upper = s.levels.slice(1);
  const filled = upper.flat().filter((v) => v !== null).length;
  const total = upper.flat().length;
  return `채운 칸 ${filled} / ${total}`;
}
