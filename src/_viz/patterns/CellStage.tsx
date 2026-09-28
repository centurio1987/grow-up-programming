/**
 * P7 칸 무대(CellStage) — 걸음 재생 패널의 무대. 알고리즘이 **쌓는 구조 전체**를 줄로 쌓고, 걸음마다
 * 칸의 상태만 바꾼다(KAN-057 검토 지적 6, claude-design 「Step Player」 시안).
 *
 * 지금까지의 패널은 입력 배열 칸 몇 개에 색을 칠하고 변수 목록을 나열했다. 유저 지적(2026-09-28):
 * *"알고리즘의 주요 개념들이 어떤 구조로 생겼고, 진행에 따라, 상태가 어떻게 바뀌는지 시각적으로 전혀
 * 정보가 없다."* 무대는 그 구조를 그린다 — 줄 넷을 한 격자에 쌓는다.
 *
 * - `index` 인덱스 눈금. `focus` 칸은 글자를 반전해 「새로 쓴 칸이 덮는 자리」를 보인다.
 * - `cells` 값 칸 한 줄(배열 · 층 · 답 목록). `level` 을 주면 머리에 층 라벨(P3 과 같은 모양)을 단다.
 * - `caret` 칸 아래 ▲ — 이번 걸음에 읽는 칸.
 * - `bracket` 구간 괄호 — 질의(위 3px) · 왼쪽 조각(아래 2px) · 오른쪽 조각(아래 2px 대시) ·
 *   새 칸이 덮는 구간(아래 2.5px 강조색).
 *
 * 줄마다 오른쪽 끝에 짧은 곁말(`side`)을 둔다(「채움 3 / 5」「= 2」). 칸·괄호·층 라벨·▲ 는 방향 A
 * 컴포넌트를 그대로 쓴다 — `ArrayStrip` 의 `CellRow`, `LevelTable` 의 `LevelTag`, `RangeCover` 와 같은
 * 괄호 규칙. 새 모양을 만들지 않는다(시안 의뢰서 2 의 확인 항목).
 *
 * 무대 높이는 줄 구성만으로 정해진다. 걸음마다 같은 줄 구성을 넘기면 높이가 바뀌지 않는다 — 곁말이나
 * ▲ 가 없는 걸음도 그 줄을 빈 채로 둔다(시안 규칙 5).
 *
 * `CellStageFilm` 은 JS 가 꺼진 화면과 md 의 정적 그림이다. 같은 무대를 걸음마다 한 장씩 위에서
 * 아래로 늘어놓고, 장마다 걸음 배지와 한 줄을 붙인다(시안 규칙 8).
 */

import { Canvas, vvar } from "@centurio1987/bbangto-ui-visualization";
import type { ReactElement } from "react";
import { FORM } from "../../../design/viz/tokens";
import {
  CELL_H,
  CELL_W,
  CellRow,
  type CellState,
  cellX,
  gutterFor,
  INDEX_ROW,
  text,
} from "./ArrayStrip";
import { LevelTag, levelSub } from "./LevelTable";

export type StageTone = "query" | "left" | "right" | "make";

export type StageRow =
  | {
      readonly kind: "index";
      readonly label?: string;
      /** 글자를 반전할 칸 — 새로 쓴 칸이 덮는 자리. */
      readonly focus?: readonly number[];
    }
  | {
      readonly kind: "cells";
      readonly label?: string;
      /** 층 번호. 주면 `label` 대신 층 라벨을 단다. */
      readonly level?: number;
      /** `null` 은 아직 쓰지 않은 칸 — 값 없이 그린다. */
      readonly values: readonly (number | string | null)[];
      readonly states?: Readonly<Partial<Record<number, CellState>>>;
      readonly side?: string;
    }
  | {
      readonly kind: "caret";
      readonly cells: readonly number[];
      readonly side?: string;
    }
  | {
      readonly kind: "bracket";
      readonly label?: string;
      readonly from: number;
      readonly to: number;
      readonly tone: StageTone;
      /** 괄호 안쪽 글자(예: 「[0,4] · 5 칸」). */
      readonly text?: string;
      readonly side?: string;
    };

export interface CellStageProps {
  readonly title: string;
  readonly rows: readonly StageRow[];
  /** 격자의 칸 수 — 보통 입력 배열의 길이. */
  readonly columns: number;
}

const CARET_ROW = 16;
const BRACKET_ROW = 30;
const TICK = 8;
const SIDE_SIZE = 13;
const BRACKET_TEXT = 12;

const TONE: Record<
  StageTone,
  { width: number; dash?: string; color: string; up: boolean }
> = {
  query: { width: FORM.queryWidth, color: "bracket", up: true },
  left: { width: FORM.pieceWidth, color: "bracket", up: false },
  right: {
    width: FORM.pieceWidth,
    dash: FORM.dashRight,
    color: "bracket",
    up: false,
  },
  make: { width: FORM.focusWidth, color: "bracket-make", up: false },
};

/** 글자 폭 — 한글은 글자 크기만큼, 나머지는 0.58 배로 센다(패키지 추정은 한글을 좁게 잡는다). */
const widthOf = (s: string, size: number): number =>
  [...s].reduce(
    (w, c) => w + (/[ᄀ-ᇿ㄰-㆏가-힯一-鿿]/.test(c) ? size : size * 0.58),
    0,
  );

const heightOf = (row: StageRow): number => {
  switch (row.kind) {
    case "index":
      return INDEX_ROW;
    case "cells":
      return CELL_H;
    case "caret":
      return CARET_ROW;
    default:
      return BRACKET_ROW;
  }
};

/** 줄 구성으로 정해지는 격자 치수. 같은 줄 구성이면 걸음이 달라도 같은 값이다. */
function layout(rows: readonly StageRow[], columns: number) {
  const labels = rows.flatMap((r) => {
    if (r.kind === "cells" && r.level !== undefined) return [levelSub(r.level)];
    return "label" in r && r.label ? [r.label] : [];
  });
  const gutter = gutterFor(labels);
  const sideX = cellX(gutter, columns) - FORM.cellGap + FORM.pad;
  const tops: number[] = [];
  let y = 0;
  for (const r of rows) {
    tops.push(y);
    y += heightOf(r) + FORM.rowGap;
  }
  return { gutter, sideX, tops, height: y - FORM.rowGap };
}

/** 곁말까지 들어가는 폭. 필름은 모든 장의 곁말 중 가장 긴 것에 맞춘다. */
function widthFor(
  rows: readonly StageRow[],
  sideX: number,
  gutter: number,
): number {
  const side = Math.max(
    0,
    ...rows.map((r) =>
      "side" in r && r.side ? widthOf(r.side, SIDE_SIZE) + FORM.pad : 0,
    ),
  );
  const bracket = Math.max(
    0,
    ...rows.map((r) =>
      r.kind === "bracket" && r.text
        ? cellX(gutter, r.from) + widthOf(r.text, BRACKET_TEXT)
        : 0,
    ),
  );
  return Math.ceil(Math.max(sideX + side, bracket) + FORM.pad);
}

function Side({ x, y, value }: { x: number; y: number; value?: string }) {
  if (!value) return null;
  return (
    <text
      x={x}
      y={y}
      dominantBaseline="central"
      style={text("note-color", SIDE_SIZE)}
    >
      {value}
    </text>
  );
}

function RowLabel({ y, label }: { y: number; label?: string }) {
  if (!label) return null;
  return (
    <text
      x={FORM.pad}
      y={y}
      dominantBaseline="central"
      style={{ ...text("cell-text"), fontWeight: 500 }}
    >
      {label}
    </text>
  );
}

function StageRowView(props: {
  row: StageRow;
  y: number;
  gutter: number;
  sideX: number;
  columns: number;
}) {
  const { row, y, gutter, sideX, columns } = props;
  const mid = y + heightOf(row) / 2;
  switch (row.kind) {
    case "index": {
      const focus = new Set(row.focus ?? []);
      return (
        <g data-viz-role="index">
          <RowLabel y={mid} label={row.label} />
          {Array.from({ length: columns }, (_, n) => ({
            at: n,
            id: `i-${n}`,
          })).map(({ at: i, id }) => (
            <g key={id} data-viz-index={i} data-viz-focus={focus.has(i)}>
              {focus.has(i) ? (
                <rect
                  x={cellX(gutter, i)}
                  y={mid - 9}
                  width={CELL_W}
                  height={18}
                  rx={FORM.radius}
                  style={{ fill: "var(--bbangto-viz-ext-index-focus-fill)" }}
                />
              ) : null}
              <text
                x={cellX(gutter, i) + CELL_W / 2}
                y={mid}
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  ...text(
                    focus.has(i) ? "index-focus-text" : "index-color",
                    11,
                    true,
                  ),
                  fontWeight: focus.has(i) ? 700 : 400,
                }}
              >
                {i}
              </text>
            </g>
          ))}
        </g>
      );
    }
    case "cells": {
      const states: Partial<Record<number, CellState>> = {
        ...(row.states ?? {}),
      };
      row.values.forEach((v, i) => {
        if (v === null) states[i] ??= "empty";
      });
      return (
        <g data-viz-role="stage-cells" data-viz-level={row.level}>
          {row.level !== undefined ? <LevelTag k={row.level} y={y} /> : null}
          <CellRow
            gutter={gutter}
            y={y}
            row={{
              label: row.level === undefined ? row.label : undefined,
              values: row.values.map((v) => (v === null ? "" : v)),
              states,
            }}
          />
          <Side x={sideX} y={mid} value={row.side} />
        </g>
      );
    }
    case "caret":
      return (
        <g data-viz-role="caret" data-viz-cells={row.cells.join(",")}>
          {[...new Set(row.cells)].map((i) => (
            <text
              key={`c-${i}`}
              x={cellX(gutter, i) + CELL_W / 2}
              y={mid}
              textAnchor="middle"
              dominantBaseline="central"
              style={text("caret", 10)}
            >
              ▲
            </text>
          ))}
          <Side x={sideX} y={mid} value={row.side} />
        </g>
      );
    default: {
      const tone = TONE[row.tone];
      const x1 = cellX(gutter, row.from) + 2;
      const x2 = cellX(gutter, row.to) + CELL_W - 2;
      // 질의는 칸 **위**라 가로줄이 아래에 있고 끝이 아래로 내려간다. 조각·새 칸은 칸 **아래**라
      // 끝이 위로 올라가고 글자가 가로줄 밑에 온다(RangeCover 와 같은 규칙).
      const line = tone.up ? y + BRACKET_ROW - TICK : y + TICK;
      const tip = tone.up ? y + BRACKET_ROW : y;
      const textY = tone.up ? y + 8 : y + BRACKET_ROW - 7;
      return (
        <g
          data-viz-range={row.tone}
          data-viz-from={row.from}
          data-viz-to={row.to}
        >
          <RowLabel y={mid} label={row.label} />
          <path
            d={`M ${x1} ${tip} V ${line} H ${x2} V ${tip}`}
            fill="none"
            style={{
              stroke: `var(--bbangto-viz-ext-${tone.color})`,
              strokeWidth: tone.width,
              ...(tone.dash ? { strokeDasharray: tone.dash } : {}),
            }}
          />
          {row.text ? (
            <text
              x={(x1 + x2) / 2}
              y={textY}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ ...text("cell-text", BRACKET_TEXT), fontWeight: 600 }}
            >
              {row.text}
            </text>
          ) : null}
          <Side x={sideX} y={mid} value={row.side} />
        </g>
      );
    }
  }
}

function StageBody(props: {
  rows: readonly StageRow[];
  columns: number;
  top: number;
  grid: ReturnType<typeof layout>;
}) {
  const { rows, columns, top, grid } = props;
  return (
    <>
      {rows.map((row, n) => (
        <StageRowView
          // 줄 구성은 걸음 사이에 바뀌지 않으므로 자리 번호가 곧 줄의 이름이다.
          // biome-ignore lint/suspicious/noArrayIndexKey: 줄 구성이 고정이라 자리 번호가 안정적이다
          key={n}
          row={row}
          y={top + (grid.tops[n] as number)}
          gutter={grid.gutter}
          sideX={grid.sideX}
          columns={columns}
        />
      ))}
    </>
  );
}

/** 무대 한 장. 너비·높이는 `cellStageSize` 와 같다. */
export function CellStage({ title, rows, columns }: CellStageProps) {
  const grid = layout(rows, columns);
  const width = widthFor(rows, grid.sideX, grid.gutter);
  const height = grid.height + FORM.pad * 2;
  return (
    <Canvas
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      title={title}
    >
      <StageBody rows={rows} columns={columns} top={FORM.pad} grid={grid} />
    </Canvas>
  );
}

/**
 * 걸음들의 무대를 모두 담는 크기 — 패널이 무대 자리를 첫 걸음 전에 고정할 때 쓴다(시안 규칙 5).
 * 줄 구성이 같아도 곁말 길이는 걸음마다 다르므로 너비는 가장 넓은 걸음에 맞춘다.
 */
export function cellStageSize(
  frames: readonly (readonly StageRow[])[],
  columns: number,
): { width: number; height: number } {
  let width = 0;
  let height = 0;
  for (const rows of frames) {
    const grid = layout(rows, columns);
    width = Math.max(width, widthFor(rows, grid.sideX, grid.gutter));
    height = Math.max(height, grid.height + FORM.pad * 2);
  }
  return { width, height };
}

export interface StageFrame {
  /** 걸음 표지 — `T3` 처럼 본문의 걸음 번호와 글자 그대로 같다. */
  readonly id: string;
  readonly text: string;
  readonly rows: readonly StageRow[];
}

export interface CellStageFilmProps {
  readonly title: string;
  readonly frames: readonly StageFrame[];
  readonly columns: number;
}

const HEAD = 30;
const BADGE_W = 40;
const BADGE_H = 22;
const FRAME_GAP = 20;

/** 정적 그림 — 걸음마다 배지 + 한 줄 + 무대 한 장을 위에서 아래로. */
export function CellStageFilm({
  title,
  frames,
  columns,
}: CellStageFilmProps): ReactElement {
  const grids = frames.map((f) => layout(f.rows, columns));
  const heads = frames.map(
    (f) => FORM.pad + BADGE_W + FORM.pad + widthOf(f.text, SIDE_SIZE),
  );
  const width = Math.ceil(
    Math.max(
      ...frames.map((f, n) => {
        const g = grids[n] as ReturnType<typeof layout>;
        return widthFor(f.rows, g.sideX, g.gutter);
      }),
      ...heads.map((h) => h + FORM.pad),
    ),
  );
  const tops: number[] = [];
  let y = FORM.pad;
  for (const g of grids) {
    tops.push(y);
    y += HEAD + g.height + FRAME_GAP;
  }
  const height = y - FRAME_GAP + FORM.pad;
  return (
    <Canvas
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      title={title}
    >
      {frames.map((f, n) => {
        const top = tops[n] as number;
        const grid = grids[n] as ReturnType<typeof layout>;
        return (
          <g key={f.id} data-viz-step={f.id}>
            {n > 0 ? (
              <path
                d={`M ${FORM.pad} ${top - FRAME_GAP / 2} H ${width - FORM.pad}`}
                style={{
                  stroke: "var(--bbangto-viz-ext-step-todo)",
                  strokeWidth: FORM.borderWidth,
                }}
              />
            ) : null}
            <rect
              x={FORM.pad}
              y={top}
              width={BADGE_W}
              height={BADGE_H}
              rx={FORM.radius}
              style={{
                fill: "var(--bbangto-viz-ext-step-current-fill)",
                stroke: "var(--bbangto-viz-ext-step-current-fill)",
                strokeWidth: FORM.currentWidth,
              }}
            />
            <text
              x={FORM.pad + BADGE_W / 2}
              y={top + BADGE_H / 2}
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fill: "var(--bbangto-viz-ext-step-current-text)",
                fontFamily: vvar("typography", "mono", "font"),
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {f.id}
            </text>
            <text
              x={FORM.pad + BADGE_W + FORM.pad}
              y={top + BADGE_H / 2}
              dominantBaseline="central"
              style={{ ...text("cell-text", SIDE_SIZE), fontWeight: 600 }}
            >
              {f.text}
            </text>
            <StageBody
              rows={f.rows}
              columns={columns}
              top={top + HEAD}
              grid={grid}
            />
          </g>
        );
      })}
    </Canvas>
  );
}
