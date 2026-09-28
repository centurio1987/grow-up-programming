/**
 * P3 층별 표(LevelTable) — 층마다 칸 수가 줄어드는 표. 칸은 자기가 맡은 구간의 **시작 인덱스** 아래에
 * 놓인다(KAN-057). 지금 ASCII 의 「0 층 5 2 7 4 6 3 / 1 층 2 2 4 4 3 …」 줄을 대신한다.
 *
 * 변형: `focus` 로 칸 하나를 고르면 그 칸이 읽은 아래층 두 칸을 선으로 잇는다(「2 층 칸 1 =
 * min(1 층 칸 1, 1 층 칸 3)」). 왼쪽 절반은 실선, 오른쪽 절반은 대시라 흑백에서도 갈린다.
 * 층의 값은 부르는 쪽이 정본 실행에서 받아 넘긴다 — 여기서 계산하지 않는다.
 */

import { Canvas } from "@centurio1987/bbangto-ui-visualization";
import { FORM } from "../../../design/viz/tokens";
import {
  CELL,
  CellRow,
  type CellState,
  cellX,
  gutterFor,
  INDEX_ROW,
  IndexRow,
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

/** 층 라벨 — 「k 층 · 2^k 칸씩」. 라벨이 칸 수를 말해 준다. */
export const levelLabel = (k: number): string => `${k} 층 · ${2 ** k} 칸씩`;

export function LevelTable({
  title,
  levels,
  focus,
  indexLabel,
}: LevelTableProps) {
  const labels = levels.map((_, k) => levelLabel(k));
  const gutter = gutterFor([...labels, indexLabel]);
  const count = levels[0]?.length ?? 0;
  const rowTop = (k: number) => FORM.pad + INDEX_ROW + k * (CELL + ROW_GAP);
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
        return (
          <CellRow
            key={labels[k]}
            gutter={gutter}
            row={{ label: labels[k], values, states }}
            y={rowTop(k)}
          />
        );
      })}
      {focus && focus.k > 0
        ? sources.map((src, side) => {
            const x1 = cellX(gutter, src) + CELL / 2;
            const y1 = rowTop(focus.k - 1) + CELL;
            const x2 =
              cellX(gutter, focus.i) + CELL / 2 + (side === 0 ? -6 : 6);
            const y2 = rowTop(focus.k);
            return (
              <path
                key={side === 0 ? "src-left" : "src-right"}
                data-viz-source={side === 0 ? "left" : "right"}
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                fill="none"
                style={{
                  stroke: `var(--bbangto-viz-ext-piece-${side === 0 ? "left" : "right"})`,
                  strokeWidth: FORM.focusWidth - 1,
                  ...(side === 1 ? { strokeDasharray: "6 3" } : {}),
                }}
              />
            );
          })
        : null}
    </Canvas>
  );
}
