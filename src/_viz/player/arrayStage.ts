/**
 * 걸음 재생 패널의 무대 갈래 「배열」 — 입력 배열 하나 위에서 구간을 쥐고 좁히거나 옮기는 알고리즘
 * (이진 탐색 · 투 포인터 · 슬라이딩 윈도)의 걸음을 `CellStage` 줄로 옮긴다(KAN-058 S12, SPEC §13
 * 「다른 갈래의 무대」의 배열·구간 줄).
 *
 * 무대는 **배열 전체**를 첫 걸음부터 그린다. 걸음마다 바뀌는 것은 쥔 구간(괄호) · 이번에 읽은 칸(▲) ·
 * 새로 쓴 칸 · 값뿐이다. 쥔 구간 밖의 칸은 「이번 걸음 밖」(대시)으로 그린다. 무대 높이는 패널이
 * 모든 걸음 중 가장 큰 무대로 고정하므로, 구간이 비어 괄호 줄이 빠진 걸음에서도 흔들리지 않는다
 * (시안 규칙 5).
 *
 * 값은 `.sim.ts` 가 싣고, 그 값이 정본 실행과 같은지는 가이드의 시험이 잰다 — 여기서는 계산하지
 * 않고 **배치만** 한다. 배열에서 만드는 구조를 층으로 쌓는 편은 「층」 무대를 쓴다.
 */

import type { CellState } from "../patterns/ArrayStrip";
import type { StageRow } from "../patterns/CellStage";

/** 걸음 하나. */
export interface ArrayStep {
  /** 이 걸음의 배열 전체. 값을 바꾸는 알고리즘(정렬 등)은 걸음마다 달라진다. `null` 은 빈 칸. */
  readonly array: readonly (number | string | null)[];
  /** 쥔 구간 `[from, to]`(양 끝 포함). 빈 구간이면 `null` — 모든 칸이 이번 걸음 밖이다. */
  readonly range: readonly [number, number] | null;
  /** 이번에 읽은 칸 — ▲ 와 「읽음」. */
  readonly read?: readonly number[];
  /** 이번에 새로 쓴 칸 — 「새로 씀」. 답으로 찾은 칸도 여기 둔다. */
  readonly write?: readonly number[];
  /** ▲ 줄 옆에 적는 포인터 이름과 자리(예: `{ lo: 3, mid: 4, hi: 5 }`). */
  readonly pointers?: Readonly<Record<string, number>>;
  /** 이번 걸음의 계산 한 줄 — 알약에 싣는다. */
  readonly calc?: { readonly expr: string; readonly result: string } | null;
  /** 무대 어디에도 자리가 없는 값만(누적 셈 등). 없으면 `null`. */
  readonly vars?: string | null;
}

export interface ArrayOptions {
  /** 입력 배열 이름 — 값 줄 머리에 쓴다(기본 `A`). */
  readonly arrayName?: string;
  /** 쥔 구간의 이름 — 괄호 머리에 쓴다(예: 「후보」 · 「창」). */
  readonly rangeLabel: string;
}

/** 걸음 하나의 무대 줄 — 인덱스 · 값 · ▲ · 쥔 구간 괄호. */
export function arrayStage(s: ArrayStep, opts: ArrayOptions): StageRow[] {
  const states: Partial<Record<number, CellState>> = {};
  s.array.forEach((_, i) => {
    if (s.range === null || i < s.range[0] || i > s.range[1]) states[i] = "out";
  });
  for (const i of s.read ?? []) states[i] = "read";
  for (const i of s.write ?? []) states[i] = "focus";
  const held = s.range === null ? 0 : s.range[1] - s.range[0] + 1;
  const pointers = Object.entries(s.pointers ?? {})
    .map(([name, at]) => `${name} = ${at}`)
    .join(" · ");
  const rows: StageRow[] = [
    { kind: "index", label: "인덱스", focus: s.write },
    {
      kind: "cells",
      label: opts.arrayName ?? "A",
      values: s.array,
      states,
      side: `${opts.rangeLabel} ${held} 칸`,
    },
    {
      kind: "caret",
      cells: s.read ?? [],
      side: pointers === "" ? undefined : pointers,
    },
  ];
  // 구간이 비면(`lo > hi`) 괄호 줄을 뺀다. 모든 칸이 이미 대시라 빈 구간이 무대에 보인다.
  if (s.range !== null) {
    rows.push({
      kind: "bracket",
      label: opts.rangeLabel,
      from: s.range[0],
      to: s.range[1],
      tone: "query",
      text: `[${s.range[0]},${s.range[1]}]`,
    });
  }
  return rows;
}

/** 격자 칸 수 — 배열의 길이. */
export const arrayColumns = (s: ArrayStep): number => s.array.length;

export const arrayCalc = (s: ArrayStep) => s.calc ?? null;
export const arrayVars = (s: ArrayStep) => s.vars ?? null;
