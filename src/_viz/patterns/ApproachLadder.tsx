/**
 * P6 시도 사다리(ApproachLadder) — 「무엇을 해 봤고, 무엇에 막혔고, 그래서 무엇을 해 봤고, 무엇이
 * 남았는가」를 한 장에 보인다(KAN-057 검토 지적 7 재작업).
 *
 * 아이디어를 떠올리는 과정은 시도와 실패의 **흐름**이다. 그것을 표 한 장에 누르면 행이 나란히 놓여
 * 앞 시도의 실패가 다음 시도를 낳았다는 인과가 사라진다(유저 지적 2026-09-28: *"무슨 방법을 시도해
 * 봤고, 무슨 문제가 있었으며, 무슨 방법이 남았다라는 의도를 표현하기에 시각화가 너무나 빈약하다"*).
 *
 * 한 장의 구성 — 위에서 아래로:
 * - 번호 붙은 **시도 카드**. 방법 이름 · 아이디어 한 줄 · 기준마다 통과(✓)와 실패(✕)와 그 수치.
 * - 카드 사이 **다음 시도로 가는 까닭** 한 줄. 앞 카드의 실패에서 무엇을 배웠는지다.
 * - 판정 꼬리표 — 버린 카드는 대시 테와 흐린 제목, 남은 카드는 굵은 강조 테와 옅은 채움. 흑백에서도
 *   테 모양(대시 · 굵은 실선)과 ✓ · ✕ 표시로 갈린다(시안 방향 A 규칙 2).
 *
 * 수치는 부르는 쪽이 정본 실행과 식에서 계산해 넘긴다 — 여기서 계산하지 않는다.
 */

import { Canvas, vvar } from "@centurio1987/bbangto-ui-visualization";
import { FORM } from "../../../design/viz/tokens";

export interface ApproachCheck {
  /** 기준 이름(예: 「답」「시간」「메모리」). */
  readonly label: string;
  /** 그 기준의 결과(예: 「비교 약 100 억 번 · 100 초」). */
  readonly value: string;
  /** 통과면 true, 실패면 false, 따질 것이 없으면 null. */
  readonly ok: boolean | null;
}

export interface Approach {
  readonly name: string;
  readonly idea: string;
  readonly verdict: "drop" | "keep";
  readonly checks: readonly ApproachCheck[];
  /** 이 시도에서 다음 시도로 넘어간 까닭. 마지막 카드에는 없다. */
  readonly lesson?: string;
}

export interface ApproachLadderProps {
  readonly title: string;
  /** 맨 위 한 줄 — 기준이 서는 조건(예: 「제약 n = q = 100,000 · 1 초 · 256 MB」). */
  readonly constraint?: string;
  readonly steps: readonly Approach[];
  readonly width?: number;
}

const NAME_SIZE = 15;
const TEXT_SIZE = 13;
const ROW = 22;
const HEAD = 48;
const LESSON = 34;
const RAIL = 40;
const LABEL_W = 64;

/** 글자 폭 — 한글은 글자 크기만큼, 나머지는 0.58 배로 센다(패키지 추정은 한글을 좁게 잡는다). */
const widthOf = (s: string, size: number): number =>
  [...s].reduce(
    (w, c) => w + (/[ᄀ-ᇿ㄰-㆏가-힯一-鿿]/.test(c) ? size : size * 0.58),
    0,
  );

const font = (mono = false) =>
  mono
    ? vvar("typography", "mono", "font")
    : vvar("typography", "title", "font");

export function ApproachLadder({
  title,
  constraint,
  steps,
  width = 680,
}: ApproachLadderProps) {
  const cardX = FORM.pad + RAIL;
  const cardW = width - cardX - FORM.pad;
  const cardH = (a: Approach) => HEAD + a.checks.length * ROW + FORM.pad;
  const top0 = FORM.pad + (constraint ? 26 : 0);
  const tops: number[] = [];
  let y = top0;
  for (const s of steps) {
    tops.push(y);
    y += cardH(s) + (s.lesson ? LESSON : FORM.rowGap);
  }
  const height = y - FORM.rowGap + FORM.pad;
  const railX = FORM.pad + RAIL / 2 - 4;

  return (
    <Canvas
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      title={title}
    >
      {constraint ? (
        <text
          x={cardX}
          y={FORM.pad + 9}
          dominantBaseline="central"
          style={{
            fill: "var(--bbangto-viz-ext-note-color)",
            fontFamily: font(),
            fontSize: `${TEXT_SIZE}px`,
          }}
        >
          {constraint}
        </text>
      ) : null}
      {/* 번호를 잇는 세로 줄 — 시도가 차례로 이어졌다는 흐름 */}
      <path
        d={`M ${railX} ${(tops[0] ?? 0) + 20} V ${(tops.at(-1) ?? 0) + 20}`}
        style={{
          stroke: "var(--bbangto-viz-ext-cell-border)",
          strokeWidth: FORM.borderWidth,
        }}
      />
      {steps.map((s, n) => {
        const top = tops[n] as number;
        const h = cardH(s);
        const keep = s.verdict === "keep";
        const tag = keep ? "남음" : "버림";
        const tagW = widthOf(tag, 12) + 16;
        return (
          <g
            key={s.name}
            data-viz-approach={n + 1}
            data-viz-verdict={s.verdict}
          >
            <circle
              cx={railX}
              cy={top + 20}
              r={12}
              style={{
                fill: keep
                  ? "var(--bbangto-viz-ext-cell-focus-stroke)"
                  : "var(--bbangto-viz-ext-cell-fill)",
                stroke: keep
                  ? "var(--bbangto-viz-ext-cell-focus-stroke)"
                  : "var(--bbangto-viz-ext-cell-border)",
                strokeWidth: FORM.borderWidth,
              }}
            />
            <text
              x={railX}
              y={top + 20}
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fill: keep
                  ? "var(--bbangto-viz-ext-step-current-text)"
                  : "var(--bbangto-viz-ext-cell-text)",
                fontFamily: font(true),
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {n + 1}
            </text>
            <rect
              x={cardX}
              y={top}
              width={cardW}
              height={h}
              rx={FORM.radius}
              style={
                keep
                  ? {
                      fill: "var(--bbangto-viz-ext-cell-focus-fill)",
                      stroke: "var(--bbangto-viz-ext-cell-focus-stroke)",
                      strokeWidth: FORM.focusWidth,
                    }
                  : {
                      fill: "var(--bbangto-viz-ext-cell-fill)",
                      stroke: "var(--bbangto-viz-ext-cell-border)",
                      strokeWidth: FORM.borderWidth,
                      strokeDasharray: FORM.dashOut,
                    }
              }
            />
            <text
              x={cardX + 14}
              y={top + 20}
              dominantBaseline="central"
              style={{
                fill: "var(--bbangto-viz-ext-cell-text)",
                fontFamily: font(),
                fontSize: `${NAME_SIZE}px`,
                fontWeight: 700,
              }}
            >
              {s.name}
            </text>
            {/* 판정 꼬리표 — 버림은 대시 테, 남음은 잉크 채움(시안 표 목업과 같다) */}
            <rect
              x={cardX + cardW - 12 - tagW}
              y={top + 9}
              width={tagW}
              height={22}
              rx={FORM.radius}
              style={
                keep
                  ? {
                      fill: "var(--bbangto-viz-ext-cell-text)",
                      stroke: "var(--bbangto-viz-ext-cell-text)",
                      strokeWidth: FORM.borderWidth,
                    }
                  : {
                      fill: "none",
                      stroke: "var(--bbangto-viz-ext-cell-border)",
                      strokeWidth: FORM.borderWidth,
                      strokeDasharray: FORM.dashOut,
                    }
              }
            />
            <text
              x={cardX + cardW - 12 - tagW / 2}
              y={top + 20}
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fill: keep
                  ? "var(--bbangto-viz-ext-cell-fill)"
                  : "var(--bbangto-viz-ext-cell-muted-text)",
                fontFamily: font(),
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {tag}
            </text>
            <text
              x={cardX + 14}
              y={top + 38}
              dominantBaseline="central"
              style={{
                fill: "var(--bbangto-viz-ext-note-color)",
                fontFamily: font(),
                fontSize: `${TEXT_SIZE}px`,
              }}
            >
              {s.idea}
            </text>
            {s.checks.map((c, k) => {
              const cy = top + HEAD + k * ROW + ROW / 2;
              const mark = c.ok === null ? "–" : c.ok ? "✓" : "✕";
              return (
                <g
                  key={c.label}
                  data-viz-check={c.label}
                  data-viz-ok={c.ok === null ? "none" : String(c.ok)}
                >
                  <text
                    x={cardX + 20}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                      fill: "var(--bbangto-viz-ext-cell-text)",
                      fontFamily: font(),
                      fontSize: "14px",
                      fontWeight: 700,
                    }}
                  >
                    {mark}
                  </text>
                  <text
                    x={cardX + 34}
                    y={cy}
                    dominantBaseline="central"
                    style={{
                      fill: "var(--bbangto-viz-ext-note-color)",
                      fontFamily: font(),
                      fontSize: `${TEXT_SIZE}px`,
                    }}
                  >
                    {c.label}
                  </text>
                  <text
                    x={cardX + 34 + LABEL_W}
                    y={cy}
                    dominantBaseline="central"
                    style={{
                      fill: "var(--bbangto-viz-ext-cell-text)",
                      fontFamily: font(),
                      fontSize: `${TEXT_SIZE}px`,
                      fontWeight: c.ok === false ? 700 : 400,
                    }}
                  >
                    {c.value}
                  </text>
                </g>
              );
            })}
            {s.lesson ? (
              <text
                x={cardX + 14}
                y={top + h + LESSON / 2}
                dominantBaseline="central"
                style={{
                  fill: "var(--bbangto-viz-ext-cell-text)",
                  fontFamily: font(),
                  fontSize: `${TEXT_SIZE}px`,
                }}
              >
                {`↓ ${s.lesson}`}
              </text>
            ) : null}
          </g>
        );
      })}
    </Canvas>
  );
}

/** 카드가 들어갈 최소 폭 — 가장 긴 줄에 맞춘다. 부르는 쪽이 `width` 를 정할 때 쓴다. */
export function approachLadderWidth(steps: readonly Approach[]): number {
  const longest = Math.max(
    0,
    ...steps.flatMap((s) => [
      widthOf(s.name, NAME_SIZE) + 90,
      widthOf(s.idea, TEXT_SIZE),
      widthOf(`↓ ${s.lesson ?? ""}`, TEXT_SIZE),
      ...s.checks.map((c) => 20 + LABEL_W + widthOf(c.value, TEXT_SIZE)),
    ]),
  );
  return Math.ceil(FORM.pad * 2 + RAIL + 28 + longest);
}
