/**
 * P4 걸음 추적(StepTrace) — `T#` 걸음마다 무엇을 읽고 무엇을 썼는지 한 줄씩(KAN-057).
 * 지금 ASCII 의 「들어올 때 l=0 r=4 / 층 번호 logTable[5] = 2 / …」 블록과 viz 폴백 표를 대신한다.
 *
 * 걸음 상태 셋은 흑백에서도 갈린다 — 지난 걸음은 옅은 채움, 현재 걸음은 굵은 테두리, 아직 안 간
 * 걸음은 점선. 걸음의 내용은 부르는 쪽이 `.sim.ts` 프레임·정본 실행에서 받아 넘긴다.
 */

import { Canvas, vvar } from "@centurio1987/bbangto-ui-visualization";
import { FORM } from "../../../design/viz/tokens";

export interface TraceStep {
  /** 걸음 표지 — `T3` 처럼 본문의 걸음 번호와 글자 그대로 같다. */
  readonly id: string;
  /** 그 걸음이 한 일 한 줄(예: `st[1][0] = min(5, 2) = 2`). */
  readonly text: string;
}

export interface StepTraceProps {
  readonly title: string;
  readonly steps: readonly TraceStep[];
  /** 현재 걸음의 id. 없으면 모든 걸음을 지난 걸음으로 그린다. */
  readonly current?: string;
}

const ROW = 30;
const BADGE_W = 40;
const BADGE_H = 22;
const TEXT_SIZE = 13;

type StepState = "done" | "current" | "todo";

/**
 * 등폭 글자 폭. 패키지 `estimateWidth` 는 등폭에서 한글도 라틴 한 글자 폭으로 잡아, 한글이 섞인
 * 걸음 줄(「겹친 칸 3」)의 끝이 잘렸다(S13 실측). 한글·한자는 글자 크기만큼, 나머지는 0.62 배로 센다.
 */
const monoWidth = (s: string): number =>
  [...s].reduce(
    (w, c) => w + (/[ᄀ-ᇿ㄰-㆏가-힯一-鿿]/.test(c) ? TEXT_SIZE : TEXT_SIZE * 0.62),
    0,
  );

function badgeStyle(state: StepState) {
  switch (state) {
    case "current":
      return {
        fill: "var(--bbangto-viz-ext-cell-fill)",
        stroke: "var(--bbangto-viz-ext-step-current)",
        strokeWidth: FORM.focusWidth,
      };
    case "todo":
      return {
        fill: "none",
        stroke: "var(--bbangto-viz-ext-step-todo)",
        strokeWidth: FORM.borderWidth,
        strokeDasharray: "var(--bbangto-viz-ext-cell-out-dash)",
      };
    default:
      return {
        fill: "var(--bbangto-viz-ext-cell-out-fill)",
        stroke: "var(--bbangto-viz-ext-step-done)",
        strokeWidth: FORM.borderWidth,
      };
  }
}

export function StepTrace({ title, steps, current }: StepTraceProps) {
  const at =
    current === undefined
      ? steps.length
      : steps.findIndex((s) => s.id === current);
  const stateOf = (k: number): StepState =>
    k < at ? "done" : k === at ? "current" : "todo";
  const textX = FORM.pad + BADGE_W + FORM.pad;
  const longest = Math.max(0, ...steps.map((s) => monoWidth(s.text)));
  const width = Math.ceil(textX + longest + FORM.pad);
  const height = FORM.pad * 2 + steps.length * ROW - (ROW - BADGE_H);
  return (
    <Canvas
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      title={title}
    >
      {steps.map((s, k) => {
        const y = FORM.pad + k * ROW;
        const state = stateOf(k);
        return (
          <g key={s.id} data-viz-step={s.id} data-viz-state={state}>
            <rect
              x={FORM.pad}
              y={y}
              width={BADGE_W}
              height={BADGE_H}
              rx={BADGE_H / 2}
              style={badgeStyle(state)}
            />
            <text
              x={FORM.pad + BADGE_W / 2}
              y={y + BADGE_H / 2}
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fill: "var(--bbangto-viz-ext-cell-stroke)",
                fontFamily: vvar("typography", "mono", "font"),
                fontSize: "12px",
                fontWeight: state === "current" ? 700 : 400,
              }}
            >
              {s.id}
            </text>
            <text
              x={textX}
              y={y + BADGE_H / 2}
              dominantBaseline="central"
              style={{
                fill:
                  state === "todo"
                    ? "var(--bbangto-viz-ext-note-color)"
                    : "var(--bbangto-viz-ext-cell-stroke)",
                fontFamily: vvar("typography", "mono", "font"),
                fontSize: `${TEXT_SIZE}px`,
              }}
            >
              {s.text}
            </text>
          </g>
        );
      })}
    </Canvas>
  );
}
