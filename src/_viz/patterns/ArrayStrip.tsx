/**
 * P1 배열 띠(ArrayStrip) — 인덱스 눈금 + 값 칸 한 줄. 알고리즘 도식의 바탕이다(KAN-057).
 *
 * 칸과 글자는 `rect`·`text` 로 직접 그리고, 색은 전부 스타일 가이드의 CSS 변수로만 받는다
 * (`--bbangto-viz-ext-*` · `--bbangto-viz-typography-*`). 패키지의 `Node`·`NodeLabel` 을 안 쓰는 까닭은
 * 라벨의 세로 자리를 칸 가운데로 고정할 수 없어서다(S2 스파이크에서 값이 칸 위 경계에 붙었다).
 *
 * 칸 상태는 시안 방향 A(S12)의 컴포넌트 01 을 따른다. 흑백에서도 갈린다 — 강조는 2.5px 테와 굵은
 * 값, 읽음은 1.5px 잉크 테와 옅은 채움, 겹침은 1.5px 테와 135° 해칭과 굵은 값, 범위 밖은 대시 테와
 * 흐린 값, 빈 칸은 점선 테.
 */

import {
  Canvas,
  estimateWidth,
  vvar,
} from "@centurio1987/bbangto-ui-visualization";
import { useId } from "react";
import { FORM } from "../../../design/viz/tokens";

/**
 * 칸 상태. `read` 는 걸음 재생 패널 시안(의뢰서 2)의 「읽음」 — 이번 걸음에 읽은 칸이다.
 * 강조(`focus`)가 「새로 씀」을 맡고, 적지 않은 칸이 「끝남」이다.
 */
export type CellState = "focus" | "read" | "overlap" | "out" | "empty";

export interface StripRow {
  /** 줄 머리 라벨(예: 「A 의 값」, 「1 층」). 없으면 비운다. */
  readonly label?: string;
  readonly values: readonly (number | string)[];
  /** 칸 번호 → 상태. 적지 않은 칸은 기본이다. */
  readonly states?: Readonly<Partial<Record<number, CellState>>>;
  /** 이 줄이 몇 칸 밀려서 시작하는가(층별 표에서 쓴다). 기본 0. */
  readonly offset?: number;
  /**
   * 값 칸 하나가 격자 몇 칸의 폭을 차지하는가. 기본 1. 칸 `i` 는 격자 칸 `(i + offset) · span` 부터
   * `span` 칸을 덮는다 — 값 하나 아래에 그 값에 딸린 여러 칸짜리 구조(2×2 행렬의 두 열)를 쌓을 때 쓴다.
   */
  readonly span?: number;
}

export const LABEL_SIZE = 13;
export const INDEX_ROW = 22;
export const CELL_W = FORM.cellW;
export const CELL_H = FORM.cellH;
export const STEP = FORM.cellW + FORM.cellGap;

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

/** 격자 칸 `span` 개를 덮는 칸의 폭. `span` 이 1 이면 `CELL_W` 다. */
export const spanWidth = (span: number): number =>
  span === 1 ? CELL_W : span * STEP - FORM.cellGap;

export const text = (color: string, size = LABEL_SIZE, mono = false) => ({
  fill: `var(--bbangto-viz-ext-${color})`,
  fontFamily: mono
    ? vvar("typography", "mono", "font")
    : vvar("typography", "title", "font"),
  fontSize: `${size}px`,
});

/** 칸 테와 채움 — 상태마다 굵기·대시가 갈린다. `NodeGraph` 의 정점도 같은 모양을 쓴다. */
export function cellStyle(state: CellState | undefined) {
  const base = {
    fill: "var(--bbangto-viz-ext-cell-fill)",
    stroke: "var(--bbangto-viz-ext-cell-border)",
    strokeWidth: FORM.borderWidth,
  };
  switch (state) {
    case "focus":
      return {
        fill: "var(--bbangto-viz-ext-cell-focus-fill)",
        stroke: "var(--bbangto-viz-ext-cell-focus-stroke)",
        strokeWidth: FORM.focusWidth,
      };
    case "read":
      return {
        fill: "var(--bbangto-viz-ext-cell-read-fill)",
        stroke: "var(--bbangto-viz-ext-cell-read-stroke)",
        strokeWidth: FORM.readWidth,
      };
    case "overlap":
      return {
        fill: "var(--bbangto-viz-ext-cell-overlap-fill)",
        stroke: "var(--bbangto-viz-ext-cell-overlap-stroke)",
        strokeWidth: FORM.overlapWidth,
      };
    case "out":
      return { ...base, fill: "none", strokeDasharray: FORM.dashOut };
    case "empty":
      return { ...base, fill: "none", strokeDasharray: FORM.dashEmpty };
    default:
      return base;
  }
}

/** 값 글자 — 강조·겹침은 굵게, 읽음은 조금 굵게, 범위 밖·빈 칸은 흐리게. */
function valueStyle(state: CellState | undefined) {
  const dim = state === "out" || state === "empty";
  return {
    ...text(dim ? "cell-muted-text" : "cell-text", 15, true),
    fontWeight:
      state === "focus" || state === "overlap"
        ? 700
        : state === "read"
          ? 600
          : 400,
  };
}

/** 겹침 해칭 — 135°, 간격 6, 선 1.5(시안 규칙 6). 칸 줄마다 id 가 달라야 한 문서에 여럿 들어간다. */
function Hatch({ id }: { id: string }) {
  const g = FORM.hatchGap;
  return (
    <defs>
      <pattern
        id={id}
        width={g}
        height={g}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(135)"
      >
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={g}
          style={{
            stroke: "var(--bbangto-viz-ext-cell-overlap-stroke)",
            strokeWidth: FORM.hatchWidth,
          }}
        />
      </pattern>
    </defs>
  );
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
            x={cellX(gutter, i) + CELL_W / 2}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            style={text("index-color", 11, true)}
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
  const span = row.span ?? 1;
  const w = spanWidth(span);
  const hatchId = `hatch-${useId().replace(/[^A-Za-z0-9_-]/g, "")}`;
  const states = row.states ?? {};
  const hasOverlap = Object.values(states).includes("overlap");
  return (
    <g data-viz-role="cells" data-viz-label={row.label}>
      {hasOverlap ? <Hatch id={hatchId} /> : null}
      {row.label ? (
        <text
          x={FORM.pad}
          y={y + CELL_H / 2}
          dominantBaseline="central"
          style={{ ...text("cell-text"), fontWeight: 500 }}
        >
          {row.label}
        </text>
      ) : null}
      {row.values
        .map((v, n) => ({ v, at: n, id: `cell-${n + offset}` }))
        .map(({ v, at: i, id }) => {
          const x = cellX(gutter, (i + offset) * span);
          const state = states[i];
          return (
            <g key={id} data-viz-cell={i} data-viz-state={state ?? "base"}>
              <rect
                x={x}
                y={y}
                width={w}
                height={CELL_H}
                rx={FORM.radius}
                style={cellStyle(state)}
              />
              {state === "overlap" ? (
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={CELL_H}
                  rx={FORM.radius}
                  fill={`url(#${hatchId})`}
                  style={{ stroke: "none" }}
                />
              ) : null}
              <text
                x={x + w / 2}
                y={y + CELL_H / 2}
                textAnchor="middle"
                dominantBaseline="central"
                style={valueStyle(state)}
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
  const height = top + CELL_H + FORM.pad;
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
