/**
 * P2 구간 덮기(RangeCover) — 배열 띠 위아래에 구간 괄호를 두고, 여러 조각이 함께 덮는 칸을
 * 「겹침」으로 표시한다(KAN-057). 지금 ASCII 의 `└───4 칸───┘` 줄을 대신한다.
 *
 * 괄호는 시안 방향 A(S12)의 컴포넌트 03 을 따른다 — 질의는 칸 **위** ┌┐ 3px 실선, 왼쪽 조각은 칸
 * **아래** └┘ 2px 실선, 오른쪽 조각은 2px 대시. 셋이 한 그림에 나와도 자리·굵기·대시로 갈린다.
 * 겹침은 괄호 데이터에서 계산한다 — 손으로 적지 않는다. `annotation` 을 주면 가리키는 칸마다 ▲ 를
 * 두고 다음 줄에 한 줄 설명을 단다(컴포넌트 06, 옛 `└ …` 설명선을 대신한다).
 */

import { Canvas, estimateWidth } from "@centurio1987/bbangto-ui-visualization";
import { FORM } from "../../../design/viz/tokens";
import {
  CELL_H,
  CELL_W,
  CellRow,
  type CellState,
  cellX,
  gutterFor,
  INDEX_ROW,
  IndexRow,
  LABEL_SIZE,
  type StripRow,
  text,
} from "./ArrayStrip";

export type RangeTone = "query" | "left" | "right";

export interface Range {
  readonly from: number;
  readonly to: number;
  readonly tone: RangeTone;
  /** 괄호 오른쪽에 붙는 설명(예: 「2 층 칸 0 · 값 2」). */
  readonly note?: string;
}

export interface Annotation {
  /** ▲ 로 가리킬 칸 번호. */
  readonly cells: readonly number[];
  readonly text: string;
}

export interface RangeCoverProps {
  readonly title: string;
  readonly row: StripRow;
  readonly ranges: readonly Range[];
  readonly indexLabel?: string;
  readonly annotation?: Annotation;
}

const BRACKET_ROW = 26;
const TICK = 8;
const CARET_ROW = 14;
const NOTE_ROW = 20;

const TONE: Record<RangeTone, { width: number; dash?: string }> = {
  query: { width: FORM.queryWidth },
  left: { width: FORM.pieceWidth },
  right: { width: FORM.pieceWidth, dash: FORM.dashRight },
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
  annotation,
}: RangeCoverProps) {
  const gutter = gutterFor([row.label, indexLabel]);
  const states: Partial<Record<number, CellState>> = { ...(row.states ?? {}) };
  for (const i of overlapCells(ranges)) states[i] ??= "overlap";
  const above = ranges.filter((r) => r.tone === "query");
  const below = ranges.filter((r) => r.tone !== "query");
  const indexTop = FORM.pad + above.length * BRACKET_ROW;
  const cellsTop = indexTop + INDEX_ROW;
  const annTop = cellsTop + CELL_H + FORM.rowGap;
  const annH = annotation ? CARET_ROW + NOTE_ROW : 0;
  const bracketsTop = annTop + annH + FORM.rowGap;
  const count = row.values.length;
  const noteX = cellX(gutter, count) + FORM.pad;
  const longestNote = Math.max(
    0,
    ...ranges.map((r) => (r.note ? estimateWidth(r.note, LABEL_SIZE) : 0)),
  );
  const annRight = annotation
    ? cellX(gutter, Math.min(...annotation.cells)) +
      estimateWidth(annotation.text, LABEL_SIZE)
    : 0;
  const width = Math.ceil(Math.max(noteX + longestNote, annRight) + FORM.pad);
  const height = bracketsTop + below.length * BRACKET_ROW + FORM.pad;

  const bracket = (r: Range, y: number, up: boolean) => {
    const tone = TONE[r.tone];
    const x1 = cellX(gutter, r.from) + 2;
    const x2 = cellX(gutter, r.to) + CELL_W - 2;
    const tip = up ? y + TICK : y - TICK;
    return (
      <g
        key={`${r.tone}-${r.from}-${r.to}`}
        data-viz-range={r.tone}
        data-viz-from={r.from}
        data-viz-to={r.to}
      >
        <path
          d={`M ${x1} ${tip} V ${y} H ${x2} V ${tip}`}
          fill="none"
          style={{
            stroke: "var(--bbangto-viz-ext-bracket)",
            strokeWidth: tone.width,
            ...(tone.dash ? { strokeDasharray: tone.dash } : {}),
          }}
        />
        {r.note ? (
          <text
            x={noteX}
            y={y}
            dominantBaseline="central"
            style={text("note-color")}
          >
            {r.note}
          </text>
        ) : null}
      </g>
    );
  };

  return (
    <Canvas
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      title={title}
    >
      {above.map((r, k) =>
        bracket(r, FORM.pad + k * BRACKET_ROW + TICK / 2, true),
      )}
      <IndexRow
        gutter={gutter}
        count={count}
        y={indexTop + INDEX_ROW / 2}
        label={indexLabel}
      />
      <CellRow gutter={gutter} row={{ ...row, states }} y={cellsTop} />
      {annotation ? (
        <g data-viz-role="annotation">
          {annotation.cells.map((i) => (
            <text
              key={`caret-${i}`}
              x={cellX(gutter, i) + CELL_W / 2}
              y={annTop + CARET_ROW / 2}
              textAnchor="middle"
              dominantBaseline="central"
              style={text("caret", 10)}
            >
              ▲
            </text>
          ))}
          <text
            x={cellX(gutter, Math.min(...annotation.cells))}
            y={annTop + CARET_ROW + NOTE_ROW / 2}
            dominantBaseline="central"
            style={text("cell-text")}
          >
            {annotation.text}
          </text>
        </g>
      ) : null}
      {below.map((r, k) =>
        bracket(r, bracketsTop + k * BRACKET_ROW + TICK, false),
      )}
    </Canvas>
  );
}
