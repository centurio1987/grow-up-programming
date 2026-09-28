/**
 * `algo-guide-viz-01` — 알고리즘 가이드의 **시각화** style guide (KAN-057).
 *
 * `@centurio1987/bbangto-ui-visualization` 의 headless 컴포넌트가 이 foundation 을 CSS 변수로 받아
 * 칠을 얻는다. `~/resume/design/style-guide/resume.viz.tsx` 와 같은 모양이다.
 *
 * 다섯 부분이 어디에 있는가.
 *
 * | 부분 | 자리 | 상태 |
 * | --- | --- | --- |
 * | foundation | `foundations` · `foundationPresets`(밝은·어두운·흑백) · `extendedFoundations` | 임시 값(tokens.ts) — 시안이 오면 S12 에서 교체 |
 * | pattern | `patterns` — P1~P4(`src/_viz/patterns/`) | 섰다(S4~S6) |
 * | visual motif | `visualMotif` | 뼈대 — 시안이 오면 S12 에서 채운다 |
 * | component | `wrapperComponents` — LogBarChart(로그 척도 막대) | 섰다(S6) |
 * | guideline | `guidelines` | 그림 형식 선택 규칙(카드 전략 1) |
 *
 * 색 리터럴은 `tokens.ts` 에만 있다 — 여기서 hex 를 쓰지 않는다.
 */

import type {
  VisualizationFoundation,
  VizFoundationPreset,
  VizNodeSemanticStyle,
} from "@centurio1987/bbangto-ui-tokens";
import type { VisualizationStyleGuide } from "@centurio1987/bbangto-ui-visualization";
import { LogBarChart } from "../../src/_viz/components/LogBarChart";
import { ArrayStrip } from "../../src/_viz/patterns/ArrayStrip";
import { LevelTable } from "../../src/_viz/patterns/LevelTable";
import { RangeCover } from "../../src/_viz/patterns/RangeCover";
import { StepTrace } from "../../src/_viz/patterns/StepTrace";
import { type Colorway, DARK, FORM, LIGHT, MONO } from "./tokens";

/** 노드 시맨틱 하나 — 알고리즘 도식은 시맨틱 노드를 거의 안 쓰므로 표면 하나를 공유한다. */
const plain = (c: Colorway, glyph: string): VizNodeSemanticStyle => ({
  fill: c.page,
  keyline: c.ink,
  keylineWidth: FORM.borderWidth,
  tagColor: c.ink,
  glyph,
});

/** 색 한 벌에서 foundation 을 만든다. 조형(선·간격·서체)은 세 변형이 같다. */
function foundationFor(name: string, c: Colorway): VisualizationFoundation {
  return {
    name,
    canvas: { bg: c.page, grid: c.rule, gridUnit: 8 },
    // p1 강조(지금 보는 칸) · p2 겹침 · p3 조각 · p4 지난 것 · p5~p8 구조(표면·옅은 표면·선·잉크)
    palette: {
      p1: c.active,
      p2: c.frontier,
      p3: c.node,
      p4: c.visited,
      p5: c.page,
      p6: c.soft,
      p7: c.rule,
      p8: c.ink,
    },
    shape: { fill: c.page, stroke: c.ink, strokeWidth: FORM.borderWidth },
    node: {
      person: plain(c, "user"),
      external: { ...plain(c, "arrowOut"), dashed: true },
      container: plain(c, "stackedRect"),
      database: plain(c, "cylinder"),
      queue: plain(c, "bars"),
      decision: plain(c, "diamond"),
      process: plain(c, "process"),
    },
    edge: {
      stroke: c.ink,
      width: FORM.borderWidth,
      dashPattern: "",
      cornerRadius: FORM.radius,
      marker: {
        size: 8,
        arrow: c.ink,
        diamond: c.ink,
        circle: c.ink,
        cross: c.ink,
      },
    },
    c4: {
      l1: {
        borderWidth: FORM.borderWidth,
        bgTint: "transparent",
        labelColor: c.ink,
      },
      l2: {
        borderWidth: FORM.borderWidth,
        bgTint: "transparent",
        labelColor: c.ink,
      },
      l3: {
        borderWidth: FORM.borderWidth,
        bgTint: "transparent",
        labelColor: c.ink,
      },
    },
    boundary: {
      stroke: c.muted,
      width: FORM.borderWidth,
      dashPattern: FORM.dashOverlap,
      radius: FORM.radius,
      labelColor: c.muted,
    },
    typography: {
      titleFont: FORM.fontSans,
      monoFont: FORM.fontMono,
      labelFont: FORM.fontSans,
      titleWeight: 600,
      sizes: FORM.sizes,
    },
    iconStyle: "line",
    spacing: { nodePad: FORM.pad, laneGap: FORM.laneGap },
    // 정적 SVG 가 산출물이다 — 움직임을 두지 않는다.
    motion: { duration: "0ms", easing: "linear" },
  };
}

/**
 * 알고리즘 도식의 의미 토큰(`--bbangto-viz-ext-*`). 패턴은 이 이름만 부른다.
 * 흑백에서도 갈리도록 색과 선 모양을 짝으로 둔다(칸 상태 넷 · 조각 둘 · 걸음 셋).
 */
function extFor(c: Colorway): Record<string, string> {
  return {
    "--bbangto-viz-ext-cell-fill": c.page,
    "--bbangto-viz-ext-cell-stroke": c.ink,
    "--bbangto-viz-ext-cell-focus-fill": c.active,
    "--bbangto-viz-ext-cell-focus-width": String(FORM.focusWidth),
    "--bbangto-viz-ext-cell-overlap-fill": c.frontier,
    "--bbangto-viz-ext-cell-overlap-dash": FORM.dashOverlap,
    "--bbangto-viz-ext-cell-out-fill": c.soft,
    "--bbangto-viz-ext-cell-out-dash": FORM.dashOut,
    "--bbangto-viz-ext-index-color": c.muted,
    "--bbangto-viz-ext-piece-left": c.line1,
    "--bbangto-viz-ext-piece-right": c.line2,
    "--bbangto-viz-ext-query": c.ink,
    "--bbangto-viz-ext-step-current": c.line2,
    "--bbangto-viz-ext-step-done": c.visited,
    "--bbangto-viz-ext-step-todo": c.rule,
    "--bbangto-viz-ext-note-color": c.muted,
    "--bbangto-viz-ext-bar-fill": c.line1,
  };
}

const light = foundationFor("algo-guide-viz-01", LIGHT);

const presets: readonly VizFoundationPreset[] = [
  {
    key: "light",
    label: "밝은",
    foundations: light,
    extendedFoundations: extFor(LIGHT),
  },
  {
    key: "dark",
    label: "어두운",
    foundations: foundationFor("algo-guide-viz-01-dark", DARK),
    extendedFoundations: extFor(DARK),
  },
  {
    key: "mono",
    label: "흑백",
    foundations: foundationFor("algo-guide-viz-01-mono", MONO),
    extendedFoundations: extFor(MONO),
  },
];

/**
 * 그림 형식 선택 규칙 — 카드 전략 1. 「표·수식·도식이 될 것을 ASCII 로 그리지 않는다」가 요지다.
 * ASCII 를 금지하지 않는다(코드 옆 짧은 실행 결과처럼 등폭이 맞는 자리는 남는다).
 */
const guidelines: Record<string, Record<string, unknown>> = {
  formSelection: {
    summary: "내용이 무엇인가로 형식을 고른다. 도식은 공간 관계가 있을 때만.",
    rules: [
      { content: "비교·대응 목록, 값 표", form: "마크다운 표" },
      { content: "식 전개", form: "수식 블록(KaTeX)" },
      { content: "절차", form: "번호 목록 또는 ProcessSteps" },
      { content: "배열·구간·층의 공간 관계, 걸음 추적", form: "도식(P1~P4)" },
      { content: "규모별 수치", form: "표 + BarChart(로그 척도)" },
      { content: "변이 대조", form: "표" },
    ],
  },
  data: {
    summary:
      "그림에 들어가는 값은 손으로 적지 않는다 — .ref.ts 실행에서 받는다.",
  },
};

export const algoVizStyleGuide: VisualizationStyleGuide = {
  name: "algo-guide-viz-01",
  description:
    "알고리즘 학습 가이드의 도식 — 배열·구간·층·걸음(KAN-057, 임시 토큰)",
  foundations: light,
  extendedFoundations: extFor(LIGHT),
  foundationPresets: presets,
  defaultFoundationKey: "light",
  guidelines,
  visualMotif: {
    summary:
      "시안(claude-design) 대기 — S12 에서 채운다. 지금은 선 1.5 · 모서리 4 · 흑백은 대시로 구별.",
    components: {},
  },
  wrapperComponents: { LogBarChart },
  patterns: { ArrayStrip, RangeCover, LevelTable, StepTrace },
};
