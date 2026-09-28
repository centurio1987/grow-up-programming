/**
 * P2 구간 덮기(RangeCover) — 배열 띠 아래에 구간 괄호를 두세 줄 두고, 여러 괄호가 함께 덮는 칸을
 * 「겹침」으로 표시한다(KAN-057). 지금 ASCII 의 `└───4 칸───┘` 줄을 대신한다.
 *
 * 괄호 종류 셋은 흑백에서도 갈린다 — 질의는 잉크 실선, 왼쪽 조각은 굵은 실선, 오른쪽 조각은 대시.
 * 겹침은 괄호 데이터에서 계산한다 — 손으로 적지 않는다.
 */

import { Canvas, estimateWidth } from "@centurio1987/bbangto-ui-visualization";
import { FORM } from "../../../design/viz/tokens";
import {
  CELL,
  CellRow,
  type CellState,
  cellX,
  gutterFor,
  INDEX_ROW,
  IndexRow,
  LABEL_SIZE,
  type StripRow,
} from "./ArrayStrip";

export type RangeTone = "query" | "left" | "right";

export interface Range {
  readonly from: number;
  readonly to: number;
  readonly tone: RangeTone;
  /** 괄호 오른쪽에 붙는 설명(예: 「2 층 칸 0 · 값 2」). */
  readonly note?: string;
}

export interface RangeCoverProps {
  readonly title: string;
  readonly row: StripRow;
  readonly ranges: readonly Range[];
  readonly indexLabel?: string;
}

const BRACKET_ROW = 26;
const TICK = 7;

const TONE: Record<RangeTone, { color: string; width: number; dash?: string }> =
  {
    query: { color: "var(--bbangto-viz-ext-query)", width: FORM.borderWidth },
    left: {
      color: "var(--bbangto-viz-ext-piece-left)",
      width: FORM.focusWidth,
    },
    right: {
      color: "var(--bbangto-viz-ext-piece-right)",
      width: FORM.focusWidth,
      dash: "6 3",
    },
  };

/** 조각(left·right)이 둘 이상 덮는 칸 = 겹침. 질의 괄호는 세지 않는다. */
export function overlapCells(ranges: readonly Range[]): number[] {
  const count = new Map<number, number>();
  for (const r of ranges) {
    if (r.tone === "query") continue;
    for (let i = r.from; i <= r.to; i++) count.set(i, (count.get(i) ?? 0) + 1);
  }
  return [...count]
    .filter(([, n]) => n > 1)
    .map(([i]) => i)
    .sort((a, b) => a - b);
}

export function RangeCover({
  title,
  row,
  ranges,
  indexLabel,
}: RangeCoverProps) {
  const gutter = gutterFor([row.label, indexLabel]);
  const states: Partial<Record<number, CellState>> = { ...(row.states ?? {}) };
  for (const i of overlapCells(ranges)) states[i] ??= "overlap";
  const cellsTop = FORM.pad + INDEX_ROW;
  const bracketsTop = cellsTop + CELL + FORM.pad;
  const count = row.values.length;
  const noteX = cellX(gutter, count) + FORM.pad;
  const longestNote = Math.max(
    0,
    ...ranges.map((r) => (r.note ? estimateWidth(r.note, LABEL_SIZE) : 0)),
  );
  const width = noteX + Math.ceil(longestNote) + FORM.pad;
  const height = bracketsTop + ranges.length * BRACKET_ROW + FORM.pad;
  return (
    <Canvas
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      title={title}
    >
      <IndexRow
        gutter={gutter}
        count={count}
        y={FORM.pad + INDEX_ROW / 2}
        label={indexLabel}
      />
      <CellRow gutter={gutter} row={{ ...row, states }} y={cellsTop} />
      {ranges.map((r, k) => {
        const tone = TONE[r.tone];
        const y = bracketsTop + k * BRACKET_ROW + TICK;
        const x1 = cellX(gutter, r.from) + 2;
        const x2 = cellX(gutter, r.to) + CELL - 2;
        return (
          <g
            key={`${r.tone}-${r.from}-${r.to}`}
            data-viz-range={r.tone}
            data-viz-from={r.from}
            data-viz-to={r.to}
          >
            <path
              d={`M ${x1} ${y - TICK} V ${y} H ${x2} V ${y - TICK}`}
              fill="none"
              style={{
                stroke: tone.color,
                strokeWidth: tone.width,
                ...(tone.dash ? { strokeDasharray: tone.dash } : {}),
              }}
            />
            {r.note ? (
              <text
                x={noteX}
                y={y}
                dominantBaseline="central"
                style={{
                  fill: "var(--bbangto-viz-ext-note-color)",
                  fontFamily: "var(--bbangto-viz-typography-title-font)",
                  fontSize: `${LABEL_SIZE}px`,
                }}
              >
                {r.note}
              </text>
            ) : null}
          </g>
        );
      })}
    </Canvas>
  );
}
