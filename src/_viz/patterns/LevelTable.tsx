/**
 * P3 층별 표(LevelTable) — 층마다 칸 수가 줄어드는 표. 칸은 자기가 맡은 구간의 **시작 인덱스** 아래에
 * 놓인다(KAN-057). 지금 ASCII 의 「0 층 5 2 7 4 6 3 / 1 층 2 2 4 4 3 …」 줄을 대신한다.
 *
 * 층 라벨은 시안 방향 A(S12)의 컴포넌트 04 — 1px 테 안에 「k 층」, 아래 줄에 「칸 하나 = 2ᵏ 칸」.
 * 변형: `focus` 로 칸 하나를 고르면 그 칸이 읽은 아래층 두 칸을 선으로 잇는다(「2 층 칸 1 =
 * min(1 층 칸 1, 1 층 칸 3)」). 왼쪽 절반은 실선, 오른쪽 절반은 대시라 흑백에서도 갈린다(괄호와 같은 규칙).
 * 층의 값은 부르는 쪽이 정본 실행에서 받아 넘긴다 — 여기서 계산하지 않는다.
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
  text,
} from "./ArrayStrip";

export interface LevelFocus {
  /** 고른 칸의 층. 1 이상이어야 아래층이 있다. */
  readonly k: number;
  readonly i: number;
}

export interface LevelTableProps {
  readonly title: string;
  /** `levels[k][i]` = 층 k 의 칸 i. `levels[0]` 이 배열이다. */
  readonly levels: readonly (readonly number[])[];
  readonly focus?: LevelFocus;
  readonly indexLabel?: string;
}

const ROW_GAP = 18;
const TAG_H = 18;
const TAG_PAD = 7;
const SUB_SIZE = 11;

/** 층 라벨 — 「k 층 · 2^k 칸씩」. 그림 안 `data-viz-label` 과 화면 읽기 도구가 쓴다. */
export const levelLabel = (k: number): string => `${k} 층 · ${2 ** k} 칸씩`;
/** 층 라벨 아래 줄 — 시안 컴포넌트 04. */
export const levelSub = (k: number): string => `칸 하나 = ${2 ** k} 칸`;

/** 층 라벨 — 1px 잉크 테 안의 「k 층」과 그 아래 한 줄. `y` 는 칸 윗변. */
export function LevelTag({ k, y }: { k: number; y: number }) {
  const tag = `${k} 층`;
  // 패키지 `estimateWidth` 는 한글을 좁게 잡아 테가 글자에 붙었다(S12 실측) — 한글은 글자 크기만큼 센다.
  const w =
    Math.ceil(
      [...tag].reduce(
        (s, c) =>
          s +
          (/[가-힯]/.test(c)
            ? LABEL_SIZE
            : c === " "
              ? LABEL_SIZE * 0.3
              : estimateWidth(c, LABEL_SIZE)),
        0,
      ),
    ) +
    TAG_PAD * 2;
  return (
    <g data-viz-role="level-label">
      <rect
        x={FORM.pad}
        y={y + 1}
        width={w}
        height={TAG_H}
        rx={FORM.radius}
        style={{
          fill: "none",
          stroke: "var(--bbangto-viz-ext-level-border)",
          strokeWidth: FORM.borderWidth,
        }}
      />
      <text
        x={FORM.pad + TAG_PAD}
        y={y + 1 + TAG_H / 2}
        dominantBaseline="central"
        style={{ ...text("cell-text"), fontWeight: 600 }}
      >
        {tag}
      </text>
      <text
        x={FORM.pad}
        y={y + CELL_H - 7}
        dominantBaseline="central"
        style={text("note-color", SUB_SIZE)}
      >
        {levelSub(k)}
      </text>
    </g>
  );
}

export function LevelTable({
  title,
  levels,
  focus,
  indexLabel,
}: LevelTableProps) {
  const subs = levels.map((_, k) => levelSub(k));
  const gutter = gutterFor([...subs, indexLabel]);
  const count = levels[0]?.length ?? 0;
  const rowTop = (k: number) => FORM.pad + INDEX_ROW + k * (CELL_H + ROW_GAP);
  const width = cellX(gutter, count) - FORM.cellGap + FORM.pad;
  const height = rowTop(levels.length) - ROW_GAP + FORM.pad;

  const half = focus && focus.k > 0 ? 2 ** (focus.k - 1) : 0;
  const sources = focus && focus.k > 0 ? [focus.i, focus.i + half] : [];
  const stateOf = (k: number, i: number): CellState | undefined => {
    if (!focus) return undefined;
    if (k === focus.k && i === focus.i) return "focus";
    if (k === focus.k - 1 && sources.includes(i)) return "overlap";
    return undefined;
  };

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
      {levels.map((values, k) => {
        const states: Partial<Record<number, CellState>> = {};
        values.forEach((_, i) => {
          const s = stateOf(k, i);
          if (s) states[i] = s;
        });
        const label = levelLabel(k);
        return (
          <g key={label} data-viz-label={label}>
            <LevelTag k={k} y={rowTop(k)} />
            <CellRow gutter={gutter} row={{ values, states }} y={rowTop(k)} />
          </g>
        );
      })}
      {focus && focus.k > 0
        ? sources.map((src, side) => {
            const x1 = cellX(gutter, src) + CELL_W / 2;
            const y1 = rowTop(focus.k - 1) + CELL_H;
            const x2 =
              cellX(gutter, focus.i) + CELL_W / 2 + (side === 0 ? -6 : 6);
            const y2 = rowTop(focus.k);
            return (
              <path
                key={side === 0 ? "src-left" : "src-right"}
                data-viz-source={side === 0 ? "left" : "right"}
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                fill="none"
                style={{
                  stroke: "var(--bbangto-viz-ext-bracket)",
                  strokeWidth: FORM.pieceWidth,
                  ...(side === 1 ? { strokeDasharray: FORM.dashRight } : {}),
                }}
              />
            );
          })
        : null}
    </Canvas>
  );
}
