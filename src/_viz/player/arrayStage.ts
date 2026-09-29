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
 * 않고 **배치만** 한다. 배열에서 만드는 구조가 한두 줄이면(누적합 배열 · 답 목록) `layers` 로 괄호
 * 아래에 쌓는다. 층이 거듭제곱으로 쌓이는 구조(Sparse Table)는 「층」 무대를 쓴다. 키로 찾는 해시 맵은
 * `map` 으로 맨 아래에 키 줄 · 값 줄을 쌓는다(패턴 `KeyValueTable`).
 */

import type { CellState } from "../patterns/ArrayStrip";
import type { StageRow } from "../patterns/CellStage";
import {
  type KeyValueData,
  keyValueColumns,
  keyValueRows,
} from "../patterns/KeyValueTable";

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
  /**
   * 값 줄 곁말 — 없으면 「{쥔 구간 이름} {칸 수} 칸」이다. 쥔 구간이 칸 수로 세어지지 않는 무대에서
   * 쓴다. 삼진 탐색의 후보는 실수 구간이라 칸 줄은 잰 자리를 늘어놓은 것일 뿐이고, 괄호 안의 칸 수는
   * 후보의 크기가 아니다 — 그때 곁말에 구간 길이(「길이 2.667」)를 적는다.
   */
  readonly rangeSide?: string;
  /**
   * 배열에서 만드는 구조 — 입력 배열과 괄호 아래에 한 줄씩 쌓는다(SPEC §13 배열 줄 「배열에서 만드는
   * 구조가 있으면 그 구조를 층으로 아래에 쌓는다」). 누적합 배열 `P` 나 답 목록처럼 걸음마다 칸이
   * 채워지는 줄이다. 첫 걸음부터 칸을 모두 두고 아직 안 쓴 칸은 `null`(점선)로 둔다. 없으면 입력 배열
   * 하나만 그린다.
   */
  readonly layers?: readonly ArrayLayer[];
  /**
   * 쥔 구간 안의 조각 — 쥔 구간 괄호 아래에 조각마다 괄호 줄을 하나씩 더한다. 병합 정렬이 가르는 두
   * 조각이나 합치는 동안 두 조각에 남은 값처럼, 한 구간을 이웃한 조각으로 나눠 보일 때 쓴다. 비어 있는
   * 조각은 싣지 않는다. 없으면 쥔 구간 괄호 하나만 그린다.
   */
  readonly pieces?: readonly ArrayPiece[];
  /**
   * 알고리즘이 드는 해시 맵 하나 — 쌓은 줄 아래에 키 줄 · 값 줄 · ▲ 줄로 더한다(패턴 `KeyValueTable`).
   * 누적합의 개수를 세는 맵처럼 키로 찾는 구조라, 열은 키를 넣은 순서이고 인덱스와 짝짓지 않는다.
   * 첫 걸음부터 `slots` 로 자리를 모두 잡아 두면 아직 안 넣은 자리는 점선이다. 없으면 그리지 않는다.
   */
  readonly map?: KeyValueData;
}

/** 쥔 구간 안의 조각 하나 — 왼쪽 조각은 실선, 오른쪽 조각은 대시 괄호다(`CellStage` 의 괄호 규칙). */
export interface ArrayPiece {
  /** 괄호 머리 이름(예: 「왼쪽」 · `L`). */
  readonly label: string;
  /** 조각 `[from, to]`(양 끝 포함). */
  readonly from: number;
  readonly to: number;
  readonly tone: "left" | "right";
  /** 괄호 안쪽 글자. 없으면 `[from,to]`. */
  readonly text?: string;
}

/**
 * 배열에서 만드는 구조 한 줄. 칸 `i` 는 격자의 `i` 번째 자리 — 입력 배열의 인덱스 `i` 와 같은 열 — 에
 * 선다. 줄의 길이가 입력 배열과 달라도 된다(누적합 배열은 `n + 1` 칸).
 */
export interface ArrayLayer {
  /** 줄 머리 이름(예: `P` · 「답」). */
  readonly name: string;
  /** 줄의 칸 전부. 아직 쓰지 않은 칸은 `null`. */
  readonly values: readonly (number | string | null)[];
  /** 이번에 읽은 칸 — ▲ 와 「읽음」. */
  readonly read?: readonly number[];
  /** 이번에 새로 쓴 칸 — 「새로 씀」. */
  readonly write?: readonly number[];
}

export interface ArrayOptions {
  /** 입력 배열 이름 — 값 줄 머리에 쓴다(기본 `A`). */
  readonly arrayName?: string;
  /** 쥔 구간의 이름 — 괄호 머리에 쓴다(예: 「후보」 · 「창」). */
  readonly rangeLabel: string;
  /**
   * 칸의 값이 곧 좌표인 줄이면 `true` — 파라메트릭 이진 탐색의 답 후보값 줄(10 · 11 · … · 32)처럼
   * 칸 자리보다 칸의 값으로 구간을 부르는 무대다. 인덱스 줄을 빼고, 괄호 글자를 인덱스 대신 양 끝
   * 칸의 값으로 적는다(`[10,32]`). 기본은 `false` — 인덱스 줄을 두고 괄호도 인덱스로 적는다.
   */
  readonly valueAxis?: boolean;
}

/** 걸음 하나의 무대 줄 — 인덱스(값이 좌표인 줄이면 뺀다) · 값 · ▲ · 쥔 구간 괄호. */
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
    ...(opts.valueAxis
      ? []
      : [{ kind: "index", label: "인덱스", focus: s.write } as const]),
    {
      kind: "cells",
      label: opts.arrayName ?? "A",
      values: s.array,
      states,
      side: s.rangeSide ?? `${opts.rangeLabel} ${held} 칸`,
    },
    {
      kind: "caret",
      cells: s.read ?? [],
      side: pointers === "" ? undefined : pointers,
    },
  ];
  // 구간이 비면(`lo > hi`) 괄호 줄을 뺀다. 모든 칸이 이미 대시라 빈 구간이 무대에 보인다.
  if (s.range !== null) {
    const [from, to] = s.range;
    const text = opts.valueAxis
      ? `[${s.array[from]},${s.array[to]}]`
      : `[${from},${to}]`;
    rows.push({
      kind: "bracket",
      label: opts.rangeLabel,
      from,
      to,
      tone: "query",
      text,
    });
  }
  // 쥔 구간 안의 조각은 쥔 구간 괄호 바로 아래에 조각마다 한 줄씩 괄호를 단다.
  for (const p of s.pieces ?? []) {
    rows.push({
      kind: "bracket",
      label: p.label,
      from: p.from,
      to: p.to,
      tone: p.tone,
      text: p.text ?? `[${p.from},${p.to}]`,
    });
  }
  // 배열에서 만드는 구조는 괄호 아래에 줄마다 값 칸과 ▲ 를 쌓는다. 곁말은 채운 칸 수다(SPEC §13
  // 「층마다 채움 x / n」). 읽는 칸이 없는 걸음에도 ▲ 줄을 빈 채로 두어 줄 구성이 걸음마다 같다.
  for (const layer of s.layers ?? []) {
    const layerStates: Partial<Record<number, CellState>> = {};
    for (const i of layer.read ?? []) layerStates[i] = "read";
    for (const i of layer.write ?? []) layerStates[i] = "focus";
    const filled = layer.values.filter((v) => v !== null).length;
    rows.push(
      {
        kind: "cells",
        label: layer.name,
        values: layer.values,
        states: layerStates,
        side: `채움 ${filled} / ${layer.values.length}`,
      },
      { kind: "caret", cells: layer.read ?? [] },
    );
  }
  // 해시 맵은 맨 아래에 키 줄 · 값 줄 · ▲ 줄로 쌓는다. 자리 수가 걸음마다 같으면 무대도 같다.
  if (s.map) rows.push(...keyValueRows(s.map));
  return rows;
}

/** 격자 칸 수 — 배열과 그 아래 쌓은 줄(해시 맵 포함) 가운데 가장 긴 것의 길이. */
export const arrayColumns = (s: ArrayStep): number =>
  Math.max(
    s.array.length,
    ...(s.layers ?? []).map((l) => l.values.length),
    s.map ? keyValueColumns(s.map) : 0,
  );

export const arrayCalc = (s: ArrayStep) => s.calc ?? null;
export const arrayVars = (s: ArrayStep) => s.vars ?? null;
