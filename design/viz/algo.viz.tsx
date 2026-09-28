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
 * | foundation | `foundations` · `foundationPresets`(밝은·어두운·흑백) · `extendedFoundations` | 시안 방향 A(tokens.ts, S12) |
 * | pattern | `patterns` — P1~P7(`src/_viz/patterns/`) · 걸음 재생 패널 `src/_viz/player/` | 섰다(S4~S6 · S13 · 검토 지적 6·7) |
 * | visual motif | `visualMotif` | 시안 컴포넌트 여덟과 사용 규칙(S12) |
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
import { ApproachLadder } from "../../src/_viz/patterns/ApproachLadder";
import { ArrayStrip } from "../../src/_viz/patterns/ArrayStrip";
import { CellStage } from "../../src/_viz/patterns/CellStage";
import { LayerBars } from "../../src/_viz/patterns/LayerBars";
import { LevelTable } from "../../src/_viz/patterns/LevelTable";
import { RangeCover } from "../../src/_viz/patterns/RangeCover";
import { StepTrace } from "../../src/_viz/patterns/StepTrace";
import { type Colorway, DARK, FORM, LIGHT, MONO } from "./tokens";

/** 노드 시맨틱 하나 — 알고리즘 도식은 시맨틱 노드를 거의 안 쓰므로 표면 하나를 공유한다. */
const plain = (c: Colorway, glyph: string): VizNodeSemanticStyle => ({
  fill: c.surface,
  keyline: c.border,
  keylineWidth: FORM.borderWidth,
  tagColor: c.ink,
  glyph,
});

/** 색 한 벌에서 foundation 을 만든다. 조형(선·간격·서체)은 세 변형이 같다. */
function foundationFor(name: string, c: Colorway): VisualizationFoundation {
  return {
    name,
    canvas: { bg: c.page, grid: c.rule, gridUnit: 4 },
    // 시안 5절 매핑 그대로 — p1 강조 · p2 겹침 · p3 현재 걸음 · p4 버림(의미 어휘),
    // p5 칸 채움 · p6 보조 채움 · p7 칸 경계 · p8 잉크(구조 어휘).
    palette: {
      p1: c.focus,
      p2: c.overlap,
      p3: c.current,
      p4: c.muted,
      p5: c.surface,
      p6: c.soft,
      p7: c.border,
      p8: c.ink,
    },
    shape: {
      fill: c.surface,
      stroke: c.border,
      strokeWidth: FORM.borderWidth,
    },
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
      dashPattern: FORM.dashOut,
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
 * 색만 여기 있다 — 굵기·대시·해칭은 `FORM` 이 쥐고 세 변형이 공유한다(시안 규칙 2 「색은 덧칠이다」).
 */
function extFor(c: Colorway): Record<string, string> {
  return {
    "--bbangto-viz-ext-cell-fill": c.surface,
    "--bbangto-viz-ext-cell-border": c.border,
    "--bbangto-viz-ext-cell-text": c.ink,
    "--bbangto-viz-ext-cell-muted-text": c.muted,
    "--bbangto-viz-ext-cell-focus-fill": c.focusTint,
    "--bbangto-viz-ext-cell-focus-stroke": c.focus,
    "--bbangto-viz-ext-cell-overlap-fill": c.overlapTint,
    "--bbangto-viz-ext-cell-overlap-stroke": c.overlap,
    "--bbangto-viz-ext-cell-read-fill": c.soft,
    "--bbangto-viz-ext-cell-read-stroke": c.ink,
    "--bbangto-viz-ext-index-focus-fill": c.ink,
    "--bbangto-viz-ext-index-focus-text": c.page,
    "--bbangto-viz-ext-bracket-make": c.focus,
    "--bbangto-viz-ext-index-color": c.muted,
    "--bbangto-viz-ext-bracket": c.ink,
    "--bbangto-viz-ext-cover": c.muted,
    "--bbangto-viz-ext-caret": c.ink,
    "--bbangto-viz-ext-level-border": c.ink,
    "--bbangto-viz-ext-step-current-fill": c.current,
    "--bbangto-viz-ext-step-current-text": c.onCurrent,
    "--bbangto-viz-ext-step-past": c.ink,
    "--bbangto-viz-ext-step-todo": c.border,
    "--bbangto-viz-ext-note-color": c.muted,
    "--bbangto-viz-ext-bar-fill": c.focus,
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
 * 시각화 고르기 — 정본은 `sandbox/algo-guide-v2/SPEC.md` §12(`L46`). 여기는 그 요지와 출발점 표다.
 * 형식에서 출발하지 않고 **전하려는 것**에서 출발한다. 맞는 패턴이 없으면 패턴부터 만든다
 * (유저 지시 2026-09-28 — 「표에 끼워 맞추지 말라」).
 */
const guidelines: Record<string, Record<string, unknown>> = {
  formSelection: {
    summary:
      "그림 자리마다 독자가 알아야 할 것을 한 문장으로 정하고, 그것을 가장 잘 보이는 시각화를 고른다. 표에 끼워 맞추지 않는다. 맞는 패턴이 없으면 패턴부터 만들어 적용한다.",
    rules: [
      { intent: "여러 대상을 같은 기준으로 나란히 비교", visual: "표" },
      {
        intent: "해 본 방법 → 막힌 자리 → 다음 시도 → 남은 방법",
        visual: "ApproachLadder",
      },
      {
        intent: "배열·구간·층의 공간 관계, 구조의 생김새",
        visual: "ArrayStrip · RangeCover · LevelTable · LayerBars",
      },
      {
        intent: "걸음마다 구조의 상태 변화",
        visual:
          "걸음 재생 패널(StepPlayer) · 무대 CellStage · 한 줄 요약은 StepTrace",
      },
      { intent: "규모의 차이", visual: "LogBarChart + 정확한 수" },
      { intent: "식의 전개", visual: "수식 블록" },
      { intent: "절차", visual: "번호 목록 · ProcessSteps" },
      {
        intent: "위에 없는 것",
        visual: "패턴부터 만든다(SPEC §12 「패턴을 더하는 법」)",
      },
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
    "알고리즘 학습 가이드의 도식 — 배열·구간·층·걸음(KAN-057, 시안 방향 A)",
  foundations: light,
  extendedFoundations: extFor(LIGHT),
  foundationPresets: presets,
  defaultFoundationKey: "light",
  guidelines,
  visualMotif: {
    summary:
      "시안 방향 A 「중립 잇기」 — 흰 바탕·회색 잉크 위에 의미색 셋(강조 파랑·겹침 황토·현재 걸음 빨강). 모든 상태는 굵기·대시·해칭으로 먼저 갈리고 색은 그 위에 얹는다.",
    components: {
      cell: {
        description: "칸(배열 원소) — 상태 다섯",
        specs: [
          "기본 1px 경계 · 채움 surface",
          "강조 2.5px 강조색 + 옅은 채움 + 굵은 값",
          "겹침 1.5px + 135° 해칭 + 굵은 값",
          "범위 밖 1px 대시 4 3 · 흐린 값",
          "빈 칸 1px 점선 1 3 · 값 없음",
        ],
      },
      indexRuler: {
        description: "인덱스 눈금",
        specs: ["등폭 11px", "0 부터", "칸 가운데 정렬"],
      },
      rangeBracket: {
        description: "구간 괄호 — 셋이 함께 나와도 자리·굵기·대시로 갈린다",
        specs: [
          "질의 = 칸 위 ┌┐ 3px 실선",
          "왼쪽 조각 = 칸 아래 └┘ 2px 실선",
          "오른쪽 조각 = 2px 대시 5 3",
          "덮는 구간 = 1px 흐린 선",
        ],
      },
      levelLabel: {
        description: "층 라벨",
        specs: ["1px 테 안에 「k 층」", "아래 줄 「칸 하나 = 2ᵏ 칸」"],
      },
      valueMark: {
        description: "값 표지",
        specs: [
          "칸 값 = 등폭 15px",
          "계산 값 = 잉크 테 알약, 결과만 굵게",
          "음수는 U+2212",
        ],
      },
      annotation: {
        description: "주석 — 옛 「└ …」 설명선을 대신한다",
        specs: [
          "가리키는 칸마다 ▲ 를 칸 가운데 아래",
          "다음 줄에 한 줄 설명",
          "한 그림에 둘까지",
        ],
      },
      stepBadge: {
        description: "걸음 배지",
        specs: [
          "현재 = 채움 + 2px",
          "지난 = 1px 실선",
          "아직 = 1px 대시 3 2, 흐린 글자",
        ],
      },
      costBar: {
        description: "비용 막대",
        specs: [
          "단일 계열 채움",
          "값은 원래 수로 오른쪽",
          "로그 척도 눈금은 10 의 지수",
        ],
      },
    },
  },
  wrapperComponents: { LogBarChart },
  patterns: {
    ArrayStrip,
    RangeCover,
    LevelTable,
    StepTrace,
    LayerBars,
    ApproachLadder,
    CellStage,
  },
};
