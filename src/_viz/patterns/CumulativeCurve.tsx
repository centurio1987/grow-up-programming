/**
 * P10 누적 값 곡선(CumulativeCurve) — 가로의 양이 한 단위씩 늘 때 세로의 누적 값이 어떻게 쌓이는지를 점과
 * 선분으로 그리고, 선분마다 **그 한 단위가 더한 값**(증분)을 적는다(KAN-058 첫 편 `minCostMaxFlow`).
 *
 * 전하려는 것은 「한 단위 더 보내는 데 드는 값이 줄지 않는다(곡선이 볼록하다)」 같은 증분의 흐름이다.
 * 표는 누적 값과 차이를 숫자로만 보여 기울기가 커지는 모양이 안 보이고, 패키지 선 그래프는 증분을
 * 적을 자리가 없다. 그래서 선분 가운데에 `+3` 꼴의 증분을 붙이고, 부르는 쪽이 짚은 점(라운드가 끝난
 * 자리처럼 절차가 실제로 멈춘 점)을 채운 네모로, 나머지 점을 빈 동그라미로 그린다 — 흑백에서도 모양으로
 * 갈린다. 증분이 앞 선분보다 작아진 선분은 대시로 그려 「줄어든 자리」가 선 모양으로 보인다.
 *
 * 값은 계산하지 않는다 — 점의 좌표와 짚은 점은 부르는 쪽(`.fig.tsx`)이 정본 실행에서 받아 넘긴다. 증분은
 * 이웃한 두 점의 세로 값 차이라 여기서 뺄셈만 한다.
 */

import { Canvas, estimateWidth } from "@centurio1987/bbangto-ui-visualization";
import { FORM } from "../../../design/viz/tokens";
import { LABEL_SIZE, text } from "./ArrayStrip";

export interface CurvePoint {
  /** 가로 값 — 정수 단위로 늘어난다고 본다. */
  readonly x: number;
  /** 세로의 누적 값. */
  readonly y: number;
  /** 짚은 점의 곁말(예: 「라운드 1」). 있으면 채운 네모로 그린다. */
  readonly mark?: string;
}

export interface CumulativeCurveProps {
  readonly title: string;
  /** 가로 축 이름(예: 「유량 값」). */
  readonly xLabel: string;
  /** 세로 축 이름(예: 「최소 총비용」). */
  readonly yLabel: string;
  /** 가로 값 오름차순의 점. */
  readonly points: readonly CurvePoint[];
  /** 가로 한 단위의 픽셀. 기본 72. */
  readonly unitX?: number;
  /** 세로 영역의 픽셀 높이. 기본 240. */
  readonly plotH?: number;
}

const DOT = 4;
const MARK = 5;

/** 선분마다의 증분 — 이웃한 두 점의 세로 값 차이. */
export function increments(points: readonly CurvePoint[]): number[] {
  return points.slice(1).map((p, i) => p.y - (points[i] as CurvePoint).y);
}

export function CumulativeCurve({
  title,
  xLabel,
  yLabel,
  points,
  unitX = 72,
  plotH = 240,
}: CumulativeCurveProps) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(0, ...ys);
  const y1 = Math.max(...ys);
  const yTick = (v: number) => String(v);
  const left =
    FORM.pad +
    Math.max(
      estimateWidth(yLabel, LABEL_SIZE),
      ...ys.map((v) => estimateWidth(yTick(v), LABEL_SIZE)),
    ) +
    FORM.pad;
  const top = FORM.pad + LABEL_SIZE + FORM.pad;
  const plotW = (x1 - x0) * unitX;
  const markW = Math.max(
    0,
    ...points.map((p) => (p.mark ? estimateWidth(p.mark, LABEL_SIZE) : 0)),
  );
  const width = Math.ceil(
    left + plotW + FORM.pad / 2 + Math.max(markW, FORM.pad) + FORM.pad,
  );
  const bottom = top + plotH;
  const height = Math.ceil(bottom + FORM.pad + LABEL_SIZE * 2 + FORM.pad * 2);
  const px = (x: number) => left + (x - x0) * unitX;
  const py = (y: number) =>
    y1 === y0 ? bottom : bottom - ((y - y0) / (y1 - y0)) * plotH;
  const inc = increments(points);
  const axis = {
    stroke: "var(--bbangto-viz-ext-cell-border)",
    strokeWidth: FORM.borderWidth,
  };
  return (
    <Canvas
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      title={title}
    >
      <text x={FORM.pad} y={FORM.pad + LABEL_SIZE} style={text("note-color")}>
        {yLabel}
      </text>
      <line x1={left} y1={top} x2={left} y2={bottom} style={axis} />
      <line x1={left} y1={bottom} x2={left + plotW} y2={bottom} style={axis} />
      {points.map((p) => (
        <g key={`tick-${p.x}`} data-viz-tick={p.x}>
          <text
            x={px(p.x)}
            y={bottom + FORM.pad + LABEL_SIZE}
            textAnchor="middle"
            style={text("index-color", LABEL_SIZE, true)}
          >
            {p.x}
          </text>
          <text
            x={left - FORM.pad / 2}
            y={py(p.y)}
            textAnchor="end"
            dominantBaseline="central"
            style={text("index-color", LABEL_SIZE, true)}
          >
            {yTick(p.y)}
          </text>
        </g>
      ))}
      <text
        x={left + plotW / 2}
        y={bottom + FORM.pad * 2 + LABEL_SIZE * 2}
        textAnchor="middle"
        style={text("note-color")}
      >
        {xLabel}
      </text>
      {points.slice(1).map((p, i) => {
        const a = points[i] as CurvePoint;
        const d = inc[i] as number;
        const drop = i > 0 && d < (inc[i - 1] as number);
        const mx = (px(a.x) + px(p.x)) / 2;
        const my = (py(a.y) + py(p.y)) / 2;
        return (
          <g
            key={`seg-${p.x}`}
            data-viz-segment={i}
            data-viz-increment={d}
            data-viz-state={drop ? "drop" : "rise"}
          >
            <line
              x1={px(a.x)}
              y1={py(a.y)}
              x2={px(p.x)}
              y2={py(p.y)}
              style={{
                stroke: "var(--bbangto-viz-ext-cell-focus-stroke)",
                strokeWidth: FORM.pieceWidth,
                ...(drop ? { strokeDasharray: FORM.dashRight } : {}),
              }}
            />
            <text
              x={mx - FORM.pad / 2}
              y={my - FORM.pad / 2}
              textAnchor="end"
              style={text("cell-text", LABEL_SIZE, true)}
            >
              {`+${d}`}
            </text>
          </g>
        );
      })}
      {points.map((p) =>
        p.mark ? (
          <g key={`pt-${p.x}`} data-viz-point={p.x} data-viz-state="mark">
            <rect
              x={px(p.x) - MARK}
              y={py(p.y) - MARK}
              width={MARK * 2}
              height={MARK * 2}
              style={{
                fill: "var(--bbangto-viz-ext-cell-focus-stroke)",
                stroke: "var(--bbangto-viz-ext-cell-focus-stroke)",
                strokeWidth: FORM.borderWidth,
              }}
            />
            <text
              x={px(p.x) + FORM.pad / 2}
              y={py(p.y) + FORM.pad + LABEL_SIZE / 2}
              textAnchor="start"
              style={text("note-color")}
            >
              {p.mark}
            </text>
          </g>
        ) : (
          <g key={`pt-${p.x}`} data-viz-point={p.x} data-viz-state="pass">
            <circle
              cx={px(p.x)}
              cy={py(p.y)}
              r={DOT}
              style={{
                fill: "var(--bbangto-viz-ext-cell-fill)",
                stroke: "var(--bbangto-viz-ext-cell-focus-stroke)",
                strokeWidth: FORM.readWidth,
              }}
            />
          </g>
        ),
      )}
    </Canvas>
  );
}
