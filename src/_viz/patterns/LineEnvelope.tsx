/**
 * P11 직선 무리와 아래 껍질(LineEnvelope) — 평면 위에 직선 `y = m·x + b` 여럿을 긋고, 자리 `x` 마다 가장
 * 낮은 직선을 이은 꺾은선(아래 껍질)을 굵게 덧그린다(KAN-058 첫 편 `convexHullTrick`).
 *
 * 전하려는 것은 「어느 자리에서 어느 직선이 가장 낮은가, 어느 직선은 어디서도 가장 낮지 않은가」다. 표는
 * 자리 몇 개의 값만 보여 직선이 바뀌는 경계가 안 보이고, `NodeGraph` 의 기울어진 기준선은 정점 자리
 * 둘레만 그려 좌표 범위를 정할 수 없으며 선마다 상태를 가를 수 없다. 그래서 좌표 범위를 부르는 쪽이
 * 정하고, 직선마다 상태를 준다.
 *
 * - **직선** — 기본은 1.5px 잉크 실선이다. 상태 셋이 덧입는다 — 새로 씀(`focus`)은 2.5px 강조색,
 *   읽음(`read`)은 2px 잉크, 이번 걸음 밖(`out`, 버린 직선)은 1px 대시 흐린 선. 흑백에서도 굵기와 대시로
 *   갈린다. 이름은 직선이 그림 오른쪽(또는 위·아래)으로 나가는 자리 안쪽에 붙고, `labelX` 를 주면 그
 *   자리의 직선 위에 붙는다.
 * - **아래 껍질** — 부르는 쪽이 준 꺾은선 점을 3px 강조색 실선으로 잇는다. 점은 정본이 남긴 직선의
 *   이웃 교점에서 받는다 — 여기서 계산하지 않는다.
 * - **경계 표시** — `x` 가 일정한 대시 세로선과 가로축 아래 이름(예: 「X_0 = 0.5」).
 * - **짚은 점** — 채운 네모와 곁말(예: 질의 자리의 답).
 * - **구간 괄호** — 가로축 아래 한 줄에 `[from, to]` 를 괄호로 긋고 이름을 붙인다(예: 직선 하나가 가장
 *   낮은 자리의 범위). 좌표 범위 밖으로 나가는 끝은 범위 끝에서 자른다.
 *
 * 값은 계산하지 않는다. 직선을 그림 칸 안으로 자르는 기하 계산만 한다(`NodeGraph` 의 `clipLine` 과 같은
 * 일이다). 좌표 범위와 눈금, 아래 껍질의 꺾은 점은 부르는 쪽(`.fig.tsx`)이 정본 실행에서 받아 넘긴다.
 */

import { Canvas, estimateWidth } from "@centurio1987/bbangto-ui-visualization";
import { FORM } from "../../../design/viz/tokens";
import { LABEL_SIZE, text } from "./ArrayStrip";

/** 직선 상태 — 새로 씀 · 읽음 · 이번 걸음 밖. 적지 않으면 끝남(기본). */
export type EnvelopeLineState = "focus" | "read" | "out";

export interface EnvelopeLine {
  /** 기울기와 절편 — `y = m·x + b`. */
  readonly m: number;
  readonly b: number;
  /** 직선 이름(예: 「(-2, 0)」). */
  readonly label: string;
  readonly state?: EnvelopeLineState;
  /** 이름을 붙일 자리의 `x`. 없으면 직선이 그림 칸을 나가는 끝 안쪽이다. */
  readonly labelX?: number;
}

export interface EnvelopeMark {
  /** 세로선의 `x`. */
  readonly x: number;
  /** 가로축 아래에 적는 이름. */
  readonly label: string;
}

/** 가로축 아래에 긋는 구간 괄호 — 직선 하나가 가장 낮은 자리의 범위(담당 구간) 같은 것. */
export interface EnvelopeSpan {
  readonly from: number;
  readonly to: number;
  readonly label: string;
}

export interface EnvelopePoint {
  readonly x: number;
  readonly y: number;
  readonly label: string;
}

export interface LineEnvelopeProps {
  readonly title: string;
  /** 가로 · 세로 좌표 범위 `[작은 값, 큰 값]`. 직선은 이 칸 안에서 자른다. */
  readonly xRange: readonly [number, number];
  readonly yRange: readonly [number, number];
  readonly lines: readonly EnvelopeLine[];
  /** 아래 껍질의 꺾은 점 — `x` 오름차순. 없으면 긋지 않는다. */
  readonly envelope?: readonly { readonly x: number; readonly y: number }[];
  readonly marks?: readonly EnvelopeMark[];
  readonly points?: readonly EnvelopePoint[];
  /** 가로축 아래 구간 괄호 — 경계 표시 이름 줄 아래에 한 줄로 긋는다. */
  readonly spans?: readonly EnvelopeSpan[];
  /** 가로 · 세로 눈금. 없으면 범위 양 끝만. */
  readonly xTicks?: readonly number[];
  readonly yTicks?: readonly number[];
  /** 가로 한 단위 · 세로 한 단위의 픽셀. 기본 40 · 12. */
  readonly unitX?: number;
  readonly unitY?: number;
}

const MARK = 5;

/** 직선 `p + t·d` 를 사각형 안으로 자른 두 끝. 안 지나면 `null`. */
function clip(
  p: { x: number; y: number },
  d: { x: number; y: number },
  box: { x0: number; x1: number; y0: number; y1: number },
): [{ x: number; y: number }, { x: number; y: number }] | null {
  let lo = Number.NEGATIVE_INFINITY;
  let hi = Number.POSITIVE_INFINITY;
  for (const [p0, d0, a, b] of [
    [p.x, d.x, box.x0, box.x1],
    [p.y, d.y, box.y0, box.y1],
  ] as const) {
    if (d0 === 0) {
      if (p0 < a || p0 > b) return null;
      continue;
    }
    const t0 = (a - p0) / d0;
    const t1 = (b - p0) / d0;
    lo = Math.max(lo, Math.min(t0, t1));
    hi = Math.min(hi, Math.max(t0, t1));
  }
  if (!(lo < hi)) return null;
  return [
    { x: p.x + lo * d.x, y: p.y + lo * d.y },
    { x: p.x + hi * d.x, y: p.y + hi * d.y },
  ];
}

/** 선 모양 — 상태마다 굵기 · 대시 · 색이 갈린다. */
function lineStyle(state: EnvelopeLineState | undefined) {
  switch (state) {
    case "focus":
      return {
        stroke: "var(--bbangto-viz-ext-cell-focus-stroke)",
        strokeWidth: FORM.focusWidth,
      };
    case "read":
      return {
        stroke: "var(--bbangto-viz-ext-cell-read-stroke)",
        strokeWidth: FORM.pieceWidth,
      };
    case "out":
      return {
        stroke: "var(--bbangto-viz-ext-cell-border)",
        strokeWidth: FORM.borderWidth,
        strokeDasharray: FORM.dashOut,
      };
    default:
      return {
        stroke: "var(--bbangto-viz-ext-cell-read-stroke)",
        strokeWidth: FORM.readWidth,
      };
  }
}

const r1 = (v: number): number => Math.round(v * 10) / 10;

export function LineEnvelope({
  title,
  xRange,
  yRange,
  lines,
  envelope,
  marks = [],
  points = [],
  spans = [],
  xTicks,
  yTicks,
  unitX = 40,
  unitY = 12,
}: LineEnvelopeProps) {
  const [x0, x1] = xRange;
  const [y0, y1] = yRange;
  const xt = xTicks ?? [x0, x1];
  const yt = yTicks ?? [y0, y1];
  const tick = (v: number) => String(v);
  const left =
    FORM.pad +
    Math.max(...yt.map((v) => estimateWidth(tick(v), LABEL_SIZE))) +
    FORM.pad;
  const top = FORM.pad + LABEL_SIZE;
  const plotW = (x1 - x0) * unitX;
  const plotH = (y1 - y0) * unitY;
  const labelRoom = Math.max(
    FORM.pad,
    ...lines.map((l) => estimateWidth(l.label, 12) + FORM.pad),
  );
  const width = Math.ceil(left + plotW + labelRoom + FORM.pad);
  const bottom = top + plotH;
  const markRow = marks.length > 0 ? LABEL_SIZE + FORM.pad : 0;
  const spanRow = spans.length > 0 ? LABEL_SIZE + FORM.pad * 2 : 0;
  const height = Math.ceil(
    bottom + FORM.pad + LABEL_SIZE + markRow + spanRow + FORM.pad,
  );
  const spanY = bottom + FORM.pad + LABEL_SIZE + markRow + FORM.pad;
  const px = (x: number) => left + (x - x0) * unitX;
  const py = (y: number) => bottom - (y - y0) * unitY;
  const box = { x0: px(x0), x1: px(x1), y0: py(y1), y1: py(y0) };
  const axis = {
    stroke: "var(--bbangto-viz-ext-cell-border)",
    strokeWidth: FORM.borderWidth,
  };
  const halo = {
    paintOrder: "stroke" as const,
    stroke: "var(--bbangto-viz-ext-cell-fill)",
    strokeWidth: 4,
  };
  return (
    <Canvas
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      title={title}
    >
      <rect
        x={box.x0}
        y={box.y0}
        width={plotW}
        height={plotH}
        style={{ ...axis, fill: "none" }}
      />
      {y0 < 0 && y1 > 0 ? (
        <line
          x1={box.x0}
          y1={py(0)}
          x2={box.x1}
          y2={py(0)}
          style={{ ...axis, strokeDasharray: FORM.dashEmpty }}
        />
      ) : null}
      {x0 < 0 && x1 > 0 ? (
        <line
          x1={px(0)}
          y1={box.y0}
          x2={px(0)}
          y2={box.y1}
          style={{ ...axis, strokeDasharray: FORM.dashEmpty }}
        />
      ) : null}
      {xt.map((v) => (
        <text
          key={`xt-${v}`}
          data-viz-tick={`x${v}`}
          x={px(v)}
          y={bottom + FORM.pad + LABEL_SIZE / 2}
          textAnchor="middle"
          dominantBaseline="central"
          style={text("index-color", LABEL_SIZE, true)}
        >
          {tick(v)}
        </text>
      ))}
      {yt.map((v) => (
        <text
          key={`yt-${v}`}
          data-viz-tick={`y${v}`}
          x={left - FORM.pad / 2}
          y={py(v)}
          textAnchor="end"
          dominantBaseline="central"
          style={text("index-color", LABEL_SIZE, true)}
        >
          {tick(v)}
        </text>
      ))}
      {marks.map((k) => (
        <g key={`mk-${k.x}`} data-viz-mark={k.x}>
          <line
            x1={r1(px(k.x))}
            y1={box.y0}
            x2={r1(px(k.x))}
            y2={box.y1}
            style={{
              stroke: "var(--bbangto-viz-ext-bracket)",
              strokeWidth: FORM.borderWidth,
              strokeDasharray: FORM.dashRight,
            }}
          />
          <text
            x={r1(px(k.x))}
            y={bottom + FORM.pad + LABEL_SIZE + FORM.pad + LABEL_SIZE / 2}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ ...text("note-color", 12), fontWeight: 700 }}
          >
            {k.label}
          </text>
        </g>
      ))}
      {spans.map((sp) => {
        const a = r1(px(Math.max(sp.from, x0)) + 3);
        const b = r1(px(Math.min(sp.to, x1)) - 3);
        const bracket = {
          stroke: "var(--bbangto-viz-ext-bracket)",
          strokeWidth: FORM.pieceWidth,
        };
        return (
          <g key={`sp-${sp.from},${sp.to}`} data-viz-span={sp.label}>
            <line x1={a} y1={spanY} x2={b} y2={spanY} style={bracket} />
            <line x1={a} y1={spanY - 5} x2={a} y2={spanY} style={bracket} />
            <line x1={b} y1={spanY - 5} x2={b} y2={spanY} style={bracket} />
            <text
              x={r1((a + b) / 2)}
              y={spanY + FORM.pad}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ ...text("note-color", 12), fontWeight: 700 }}
            >
              {sp.label}
            </text>
          </g>
        );
      })}
      {lines.map((l, i) => {
        const seg = clip(
          { x: px(0), y: py(l.b) },
          { x: unitX, y: -l.m * unitY },
          box,
        );
        if (!seg) return null;
        const [s, e] = seg;
        const at =
          l.labelX !== undefined
            ? { x: px(l.labelX), y: py(l.m * l.labelX + l.b) }
            : e;
        return (
          <g
            key={`ln-${l.m},${l.b}`}
            data-viz-line={i}
            data-viz-state={l.state ?? "done"}
          >
            <path
              d={`M ${r1(s.x)} ${r1(s.y)} L ${r1(e.x)} ${r1(e.y)}`}
              style={lineStyle(l.state)}
            />
            <text
              x={r1(at.x + 4)}
              y={r1(at.y - 9)}
              textAnchor="start"
              dominantBaseline="central"
              style={{
                ...text(
                  l.state === "out" ? "cell-muted-text" : "cell-text",
                  12,
                ),
                fontWeight: l.state === "focus" ? 700 : 600,
                ...halo,
              }}
            >
              {l.label}
            </text>
          </g>
        );
      })}
      {envelope && envelope.length > 1 ? (
        <path
          data-viz-envelope={envelope.length}
          d={envelope
            .map(
              (p, i) => `${i === 0 ? "M" : "L"} ${r1(px(p.x))} ${r1(py(p.y))}`,
            )
            .join(" ")}
          style={{
            fill: "none",
            stroke: "var(--bbangto-viz-ext-cell-focus-stroke)",
            strokeWidth: FORM.queryWidth,
            strokeLinejoin: "round",
          }}
        />
      ) : null}
      {points.map((p) => (
        <g key={`pt-${p.x},${p.y}`} data-viz-point={p.x}>
          <rect
            x={r1(px(p.x) - MARK)}
            y={r1(py(p.y) - MARK)}
            width={MARK * 2}
            height={MARK * 2}
            style={{
              fill: "var(--bbangto-viz-ext-cell-focus-stroke)",
              stroke: "var(--bbangto-viz-ext-cell-focus-stroke)",
              strokeWidth: FORM.borderWidth,
            }}
          />
          <text
            x={r1(px(p.x) + MARK + 4)}
            y={r1(py(p.y) + LABEL_SIZE)}
            textAnchor="start"
            dominantBaseline="central"
            style={{ ...text("note-color", 12), fontWeight: 700, ...halo }}
          >
            {p.label}
          </text>
        </g>
      ))}
    </Canvas>
  );
}
