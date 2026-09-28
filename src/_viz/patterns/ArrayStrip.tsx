/**
 * P1 배열 띠(ArrayStrip) — 인덱스 눈금 + 값 칸 한 줄. 알고리즘 도식의 바탕이다(KAN-057).
 *
 * 칸과 글자는 `rect`·`text` 로 직접 그리고, 색·선·서체는 전부 스타일 가이드의 CSS 변수로만 받는다
 * (`--bbangto-viz-ext-*` · `--bbangto-viz-typography-*`). 패키지의 `Node`·`NodeLabel` 을 안 쓰는 까닭은
 * 라벨의 세로 자리를 칸 가운데로 고정할 수 없어서다(S2 스파이크에서 값이 칸 위 경계에 붙었다).
 *
 * 칸 상태 넷은 흑백에서도 갈린다 — 강조는 굵은 선, 겹침은 대시, 범위 밖은 점선, 빈 칸은 채움 없음.
 */

import {
  Canvas,
  estimateWidth,
  vvar,
} from "@centurio1987/bbangto-ui-visualization";
import { FORM } from "../../../design/viz/tokens";

export type CellState = "focus" | "overlap" | "out" | "empty";

export interface StripRow {
  /** 줄 머리 라벨(예: 「A 의 값」, 「1 층」). 없으면 비운다. */
  readonly label?: string;
  readonly values: readonly (number | string)[];
  /** 칸 번호 → 상태. 적지 않은 칸은 기본이다. */
  readonly states?: Readonly<Partial<Record<number, CellState>>>;
  /** 이 줄이 몇 칸 밀려서 시작하는가(층별 표에서 쓴다). 기본 0. */
  readonly offset?: number;
}

export const LABEL_SIZE = 13;
export const INDEX_ROW = 22;
export const CELL = FORM.cell;
export const STEP = FORM.cell + FORM.cellGap;

/** 머리 라벨 칸 폭 — 가장 긴 라벨에 맞춘다. 라벨이 없으면 0. */
export function gutterFor(labels: readonly (string | undefined)[]): number {
  const w = Math.max(
    0,
    ...labels.map((l) => (l ? estimateWidth(l, LABEL_SIZE) : 0)),
  );
  return w > 0 ? Math.ceil(w) + FORM.pad : 0;
}

export const cellX = (gutter: number, i: number): number =>
  FORM.pad + gutter + i * STEP;

const text = (color: string, size = LABEL_SIZE, mono = false) => ({
  fill: `var(--bbangto-viz-ext-${color})`,
  fontFamily: mono
    ? vvar("typography", "mono", "font")
    : vvar("typography", "title", "font"),
  fontSize: `${size}px`,
});

function cellStyle(state: CellState | undefined) {
  const base = {
    fill: "var(--bbangto-viz-ext-cell-fill)",
    stroke: "var(--bbangto-viz-ext-cell-stroke)",
    strokeWidth: FORM.borderWidth,
  };
  switch (state) {
    case "focus":
      return {
        ...base,
        fill: "var(--bbangto-viz-ext-cell-focus-fill)",
        strokeWidth: "var(--bbangto-viz-ext-cell-focus-width)",
      };
    case "overlap":
      return {
        ...base,
        fill: "var(--bbangto-viz-ext-cell-overlap-fill)",
        strokeDasharray: "var(--bbangto-viz-ext-cell-overlap-dash)",
      };
    case "out":
      return {
        ...base,
        fill: "var(--bbangto-viz-ext-cell-out-fill)",
        strokeDasharray: "var(--bbangto-viz-ext-cell-out-dash)",
      };
    case "empty":
      return {
        ...base,
        fill: "none",
        strokeDasharray: "var(--bbangto-viz-ext-cell-out-dash)",
      };
    default:
      return base;
  }
}

/** 인덱스 눈금 한 줄. `y` 는 글자 가운데. */
export function IndexRow(props: {
  gutter: number;
  count: number;
  y: number;
  label?: string;
}) {
  const { gutter, count, y, label } = props;
  return (
    <g data-viz-role="index">
      {label ? (
        <text
          x={FORM.pad}
          y={y}
          dominantBaseline="central"
          style={text("index-color")}
        >
          {label}
        </text>
      ) : null}
      {Array.from({ length: count }, (_, n) => ({ at: n, id: `col-${n}` })).map(
        ({ at: i, id }) => (
          <text
            key={id}
            x={cellX(gutter, i) + CELL / 2}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            style={text("index-color", LABEL_SIZE, true)}
          >
            {i}
          </text>
        ),
      )}
    </g>
  );
}

/** 값 칸 한 줄. `y` 는 칸 윗변. */
export function CellRow(props: { gutter: number; row: StripRow; y: number }) {
  const { gutter, row, y } = props;
  const offset = row.offset ?? 0;
  return (
    <g data-viz-role="cells" data-viz-label={row.label}>
      {row.label ? (
        <text
          x={FORM.pad}
          y={y + CELL / 2}
          dominantBaseline="central"
          style={text("note-color")}
        >
          {row.label}
        </text>
      ) : null}
      {row.values
        .map((v, n) => ({ v, at: n, id: `cell-${n + offset}` }))
        .map(({ v, at: i, id }) => {
          const x = cellX(gutter, i + offset);
          const state = row.states?.[i];
          return (
            <g key={id} data-viz-cell={i} data-viz-state={state ?? "base"}>
              <rect
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={FORM.radius}
                style={cellStyle(state)}
              />
              <text
                x={x + CELL / 2}
                y={y + CELL / 2}
                textAnchor="middle"
                dominantBaseline="central"
                style={text("cell-stroke", 15, true)}
              >
                {String(v)}
              </text>
            </g>
          );
        })}
    </g>
  );
}

export interface ArrayStripProps {
  /** 그림 제목 — 화면 읽기 도구가 읽는다. */
  readonly title: string;
  readonly row: StripRow;
  /** 인덱스 눈금을 그릴지. 기본 true. */
  readonly showIndex?: boolean;
  readonly indexLabel?: string;
}

export function ArrayStrip({
  title,
  row,
  showIndex = true,
  indexLabel,
}: ArrayStripProps) {
  const gutter = gutterFor([row.label, indexLabel]);
  const count = row.values.length + (row.offset ?? 0);
  const top = FORM.pad + (showIndex ? INDEX_ROW : 0);
  const width = cellX(gutter, count) - FORM.cellGap + FORM.pad;
  const height = top + CELL + FORM.pad;
  return (
    <Canvas
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      title={title}
    >
      {showIndex ? (
        <IndexRow
          gutter={gutter}
          count={count}
          y={FORM.pad + INDEX_ROW / 2}
          label={indexLabel}
        />
      ) : null}
      <CellRow gutter={gutter} row={row} y={top} />
    </Canvas>
  );
}
