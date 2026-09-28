/**
 * 알고리즘 가이드 시각화의 원시 토큰 — `algo.viz.tsx` 가 이 값에서만 파생한다.
 *
 * **claude-design 시안 방향 A 「중립 잇기」(KAN-057 S12, 유저 선택 2026-09-28).** 출처는 claude-design
 * 프로젝트 `610d30fc…` 의 `Viz Style Guide.dc.html` — `PAL.A` · `FONT.A` · `GEO.A` 와 5절 매핑 초안이다.
 * 지금 가이드의 흰 바탕·회색 잉크를 잇고, 시뮬 패널의 파랑·빨강·노랑을 한 단계 눌러 의미색 셋
 * (강조·현재 걸음·겹침)으로 쓴다. 밝은·어두운 두 벌은 대비를 잰 값이다 — 본문 글자 4.5:1,
 * 선·칸 경계 3:1 을 모두 넘는다(가장 빠듯한 곳도 기준의 1.2 배, S12 에서 다시 계산).
 *
 * 색 리터럴은 이 파일에만 둔다. 다른 파일에 hex 를 쓰지 않는다.
 */

/** 밝은 테마 — 시안 `PAL.A.light`. */
export const LIGHT = {
  page: "#ffffff",
  surface: "#ffffff",
  soft: "#f1f3f4",
  ink: "#202124",
  muted: "#5f6368",
  border: "#80868b",
  rule: "#dadce0",
  focus: "#1967d2",
  focusTint: "#e8f0fe",
  overlap: "#b06000",
  overlapTint: "#fef7e0",
  current: "#c5221f",
  currentTint: "#fce8e6",
  onCurrent: "#ffffff",
} as const;

/**
 * 어두운 테마 — 시안 `PAL.A.dark`. 밝은 쪽을 뒤집은 것이 아니라 대비를 다시 맞춘 것이다:
 * 칸은 캔버스보다 한 단계 뜬 채움, 경계선은 명도를 올리고, 의미색은 명도를 올리고 채도를 낮췄다.
 */
export const DARK = {
  page: "#14161a",
  surface: "#1c1f24",
  soft: "#23272d",
  ink: "#e8eaed",
  muted: "#a8adb3",
  border: "#737980",
  rule: "#3c4043",
  focus: "#8ab4f8",
  focusTint: "#1d2b44",
  overlap: "#f0b44c",
  overlapTint: "#2e2615",
  current: "#f28b82",
  currentTint: "#3a1f1e",
  onCurrent: "#14161a",
} as const;

/**
 * 흑백 인쇄용 — 시안에 없어서 이쪽이 정했다. 의미색을 전부 검정으로, 채움을 흰색으로 둔다.
 * 상태는 시안 규칙 2 대로 굵기·대시·해칭이 가른다 — 색이 빠져도 같은 그림이다.
 */
export const MONO = {
  page: "#ffffff",
  surface: "#ffffff",
  soft: "#eeeeee",
  ink: "#000000",
  muted: "#444444",
  border: "#444444",
  rule: "#bbbbbb",
  focus: "#000000",
  focusTint: "#ffffff",
  overlap: "#000000",
  overlapTint: "#ffffff",
  current: "#000000",
  currentTint: "#eeeeee",
  onCurrent: "#ffffff",
} as const;

export type Colorway = { readonly [K in keyof typeof LIGHT]: string };

/** 선·간격·서체 — 시안 `GEO.A` · 토큰 표. 색과 달리 세 변형이 공유한다. */
export const FORM = {
  /** 칸·배지 기본 테. */
  borderWidth: 1,
  /** 강조 칸 테. */
  focusWidth: 2.5,
  /** 겹침 칸 테. */
  overlapWidth: 1.5,
  /** 읽음 칸 테 — 걸음 재생 패널 시안(의뢰서 2) 상태 표의 「읽음」. */
  readWidth: 1.5,
  /** 괄호 — 질의 3 · 조각 2. */
  queryWidth: 3,
  pieceWidth: 2,
  /** 현재 걸음 배지 테. */
  currentWidth: 2,
  radius: 4,
  /** 칸 너비 · 높이(칸 16 개 이하). 시안은 24·32 칸에서 36×32 · 20×28 로 줄인다. */
  cellW: 56,
  cellH: 40,
  cellGap: 4,
  rowGap: 6,
  pad: 12,
  laneGap: 20,
  fontSans: '"Pretendard", "Apple SD Gothic Neo", -apple-system, sans-serif',
  fontMono: '"JetBrains Mono", "SFMono-Regular", Menlo, monospace',
  sizes: {
    title: "15px",
    label: "13px",
    tag: "11px",
    mono: "13px",
    cell: "15px",
    index: "11px",
  },
  /** 흑백에서도 갈리는 선 모양 — 시안 규칙 6(SVG 내보내기). */
  dashOut: "4 3",
  dashEmpty: "1 3",
  dashRight: "5 3",
  dashTodo: "3 2",
  /** 겹침 해칭 — 135° · 6px 간격 · 선 1.5. */
  hatchGap: 6,
  hatchWidth: 1.5,
} as const;
