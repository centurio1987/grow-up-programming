/**
 * 알고리즘 가이드 시각화의 원시 토큰 — `algo.viz.tsx` 가 이 값에서만 파생한다.
 *
 * **임시 값이다(KAN-057 S3).** claude-design 시안(`brief.md`)이 오기 전까지 지금 가이드 HTML 의
 * 페이지 토큰(`tools/build-html.ts` 의 `PAGE_CSS` — `--gs-*` · `--guide-sim-*`)을 그대로 옮겨 쓴다.
 * 시안이 오면(S12) 이 파일의 값만 갈아 끼운다 — 패턴·렌더러는 여기 이름만 부르므로 손대지 않는다.
 *
 * 색 리터럴은 이 파일에만 둔다. 다른 파일에 hex 를 쓰지 않는다.
 */

/** 밝은 테마 — `PAGE_CSS` 의 `:root`. */
export const LIGHT = {
  page: "#ffffff",
  ink: "#202124",
  muted: "#5f6368",
  rule: "#dadce0",
  soft: "#f1f3f4",
  node: "#4285f4",
  active: "#ea4335",
  frontier: "#fbbc04",
  visited: "#9aa0a6",
  /** 선 강조 — 조각 괄호·현재 걸음. 칸 채움(node·active)과 따로 둔다: 흑백에서 채움은 흰색이어도 선은 검어야 한다. */
  line1: "#4285f4",
  line2: "#ea4335",
} as const;

/** 어두운 테마 — `PAGE_CSS` 의 `prefers-color-scheme: dark`. 없는 값은 밝은 쪽을 쓴다. */
export const DARK = {
  page: "#14161a",
  ink: "#e8eaed",
  muted: "#9aa0a6",
  rule: "#3c4043",
  soft: "#1f2226",
  node: LIGHT.node,
  active: LIGHT.active,
  frontier: LIGHT.frontier,
  visited: LIGHT.visited,
  line1: LIGHT.line1,
  line2: LIGHT.line2,
} as const;

/** 흑백 인쇄용 — 색 대신 명도와 선 모양으로 구별한다. */
export const MONO = {
  page: "#ffffff",
  ink: "#000000",
  muted: "#555555",
  rule: "#bbbbbb",
  soft: "#eeeeee",
  node: "#ffffff",
  active: "#ffffff",
  frontier: "#dddddd",
  visited: "#f5f5f5",
  line1: "#000000",
  line2: "#000000",
} as const;

export type Colorway = { readonly [K in keyof typeof LIGHT]: string };

/** 선·간격·서체. 색과 달리 세 변형이 공유한다. */
export const FORM = {
  borderWidth: 1.5,
  focusWidth: 3,
  radius: 4,
  cell: 44,
  cellGap: 4,
  pad: 12,
  laneGap: 20,
  fontSans: '-apple-system, "Pretendard", "Apple SD Gothic Neo", sans-serif',
  fontMono: '"SFMono-Regular", Menlo, monospace',
  sizes: { title: "14px", label: "13px", tag: "11px", mono: "13px" },
  /** 흑백에서도 갈리는 선 모양 — 겹침은 대시, 범위 밖은 점선. */
  dashOverlap: "5 3",
  dashOut: "2 3",
} as const;
