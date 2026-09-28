/**
 * P5 층 막대(LayerBars) — 층의 칸 하나를 한 줄로, 그 칸이 맡는 자리에만 배열 값을 놓는다(KAN-057 S13).
 * 지금 ASCII 의 「1 층 칸 0   5  2  ·  ·  ·  ·   [0,1] 의 최솟값 2」 줄을 대신한다.
 *
 * `LevelTable` 은 칸에 적힌 값만 보이고, 이 그림은 **칸이 어느 자리를 맡는가**를 보인다. 한 층의 칸이
 * 한 자리씩 밀려 가며 겹쳐 놓인다는 것이 요점이라, 맡지 않는 자리는 칸을 그리지 않고
 * 대신 점(`·`)만 찍는다 — 흑백에서도 빈자리로 갈리고, 본문의 「나머지 자리는 점으로」와도 맞는다.
 * 줄 오른쪽 끝의 말은 부르는 쪽이 정본 실행에서 받아 넘긴다.
 */

import { Canvas, estimateWidth } from "@centurio1987/bbangto-ui-visualization";
import { FORM } from "../../../design/viz/tokens";
import {
  CELL_H,
  CELL_W,
  CellRow,
  cellX,
  gutterFor,
  INDEX_ROW,
  IndexRow,
  LABEL_SIZE,
} from "./ArrayStrip";

export interface LayerBar {
  readonly label: string;
  /** 맡는 자리 — 인덱스 구간 `[from, to]`, 양끝 포함. */
  readonly from: number;
  readonly to: number;
  /** 줄 오른쪽 끝의 말(예: 「[0,1] 의 최솟값 2」). */
  readonly note?: string;
}

export interface LayerBarsProps {
  readonly title: string;
  /** 배열 값. 첫 줄에 그대로 놓는다. */
  readonly values: readonly number[];
  readonly valuesLabel?: string;
  readonly indexLabel?: string;
  /** 줄 묶음. 묶음 사이에는 한 줄만큼 띄운다(층이 바뀌는 자리). */
  readonly groups: readonly (readonly LayerBar[])[];
}

const ROW_GAP = 6;

export function LayerBars({
  title,
  values,
  valuesLabel = "A 의 값",
  indexLabel,
  groups,
}: LayerBarsProps) {
  const bars = groups.flat();
  const gutter = gutterFor([
    valuesLabel,
    indexLabel,
    ...bars.map((b) => b.label),
  ]);
  const count = values.length;
  const noteX = cellX(gutter, count) + FORM.pad;
  const longest = Math.max(
    0,
    ...bars.map((b) => (b.note ? estimateWidth(b.note, LABEL_SIZE) : 0)),
  );
  const rowH = CELL_H + ROW_GAP;
  const top = FORM.pad + INDEX_ROW;
  const tops: number[] = [];
  let y = top + rowH + FORM.laneGap;
  for (const [g, group] of groups.entries()) {
    if (g > 0) y += FORM.laneGap;
    for (const _ of group) {
      tops.push(y);
      y += rowH;
    }
  }
  const width = Math.ceil(noteX + longest + FORM.pad);
  const height = y - ROW_GAP + FORM.pad;
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
      <CellRow gutter={gutter} row={{ label: valuesLabel, values }} y={top} />
      {bars.map((b, n) => {
        const at = tops[n] as number;
        return (
          <g
            key={b.label}
            data-viz-bar={b.label}
            data-viz-from={b.from}
            data-viz-to={b.to}
          >
            <CellRow
              gutter={gutter}
              row={{
                label: b.label,
                values: values.slice(b.from, b.to + 1),
                offset: b.from,
              }}
              y={at}
            />
            {values
              .map((_, x) => ({ x, id: `dot-${x}` }))
              .map(({ x, id }) =>
                x >= b.from && x <= b.to ? null : (
                  <text
                    key={id}
                    x={cellX(gutter, x) + CELL_W / 2}
                    y={at + CELL_H / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                      fill: "var(--bbangto-viz-ext-index-color)",
                      fontSize: "15px",
                    }}
                  >
                    ·
                  </text>
                ),
              )}
            {b.note ? (
              <text
                x={noteX}
                y={at + CELL_H / 2}
                dominantBaseline="central"
                style={{
                  fill: "var(--bbangto-viz-ext-note-color)",
                  fontSize: `${LABEL_SIZE}px`,
                }}
              >
                {b.note}
              </text>
            ) : null}
          </g>
        );
      })}
    </Canvas>
  );
}
