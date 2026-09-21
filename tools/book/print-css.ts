/**
 * 인쇄 CSS — 화면용 `PAGE_CSS` 위에 덧씌운다. **디자인의 정본은 Claude Design 의
 * 「쉽게 이해하는 알고리즘 디자인 템플릿」**(표지 · 목차 · 챕터 간지 · 본문 4쪽 · 뒤표지)이고,
 * 이 파일은 그 값을 모든 장에 걸리는 규칙으로 옮긴 것이다. 템플릿의 수치(mm · pt · 색)를
 * 그대로 쓴다 — 여기서 새로 고른 값은 주석에 이유를 단다.
 *
 * 종이가 화면과 다른 지점은 넷이다.
 *
 * 1. **스크롤이 없다.** 화면 CSS 는 표를 `display:block; overflow-x:auto` 로 둔다
 *    (`tools/build-html.ts`). 종이에서 그건 스크롤이 아니라 **잘림**이다.
 * 2. **어둠 모드가 없다.** `prefers-color-scheme: dark` 가 걸린 기계에서 인쇄하면
 *    검은 바탕이 그대로 찍힌다. 팔레트를 밝은 쪽으로 못박는다.
 * 3. **레일이 갈 곳이 없다.** `position: fixed` 는 종이에서 쪽마다 겹치거나 첫 쪽에만 남는다.
 *    목차가 그 일을 대신하므로 숨긴다.
 * 4. **쪽이 끊긴다.** 제목만 남고 본문이 넘어가는 자리(고아 제목)를 막아야 한다.
 *
 * **머리말 · 쪽번호는 CSS `@page` 여백 상자가 넣는다.** 크롬 131 부터 여백 상자를 구현한다
 * (152 실측). 이름 붙은 쪽(`page:`)으로 쪽마다 틀을 바꾼다 — 표지 · 챕터 간지 · 뒤표지는 여백 0 에
 * 머리말이 없고(`bk-full`), 목차는 「CONTENTS」, 장은 「EP. N」(`volume.ts` 가 장마다 규칙을 싣는다).
 * CDP 의 머리말 틀은 모든 쪽에 같은 것 하나라 이 구분을 못 한다.
 */

import { dirname } from "node:path";
import type { BookConfig } from "./config.ts";
import { REPO } from "./config.ts";

export const SANS = `'IBM Plex Sans KR', 'Helvetica Neue', Helvetica, sans-serif`;
export const MONO = `'IBM Plex Mono', 'IBM Plex Sans KR', monospace`;

/** 템플릿의 색. 본문은 흑백이고 색은 표식(`mark`) 하나뿐이다. */
export const INK = {
  ink: "#111111",
  sub: "#55554f",
  muted: "#6b6b66",
  faint: "#8a8a84",
  dead: "#6f6f6a",
  rule: "#d7d7d3",
  leader: "#b9b9b3",
  codeBg: "#f4f4f2",
  inlineBg: "#f0f0ed",
} as const;

/**
 * 쪽 틀(mm). 템플릿 본문 쪽은 사방 18 · 20mm 안에 머리말 줄(8.5pt × 1.7 + 3mm + 선 1px)을 두고
 * 9mm 띄워 본문을 시작한다 — 본문 위 여백은 18 + 5.1 + 3 + 0.3 + 9 ≈ 35.4mm 다.
 * 아래는 쪽번호 줄(9pt × 1.7 = 5.4mm)이 바닥에서 18mm 에 앉는다. 템플릿은 본문이 번호에
 * 붙어 끝나지만(flex:1) 흐르는 원고는 끝이 제각각이라 1.6mm 를 띄웠다(25mm).
 */
export const GEOMETRY = {
  sheet: { top: 18, bottom: 18, side: 20 },
  margin: { top: 35.4, bottom: 25, side: 20 },
} as const;

/** 크롬이 읽는 CSS 문자열 리터럴. */
export function cssString(s: string): string {
  return `"${s.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

/**
 * IBM Plex Sans KR · Mono 를 `file://` 로 싣는다. 인라인(base64)하지 않는 이유는 크기다 —
 * 한글 서체는 유니코드 구간별로 수백 조각이고, 조각을 전부 문자열로 넣으면 편마다 재는 인쇄가
 * 수 MB 짜리 CSS 를 매번 읽는다. 크롬은 쓰인 구간만 불러와 PDF 에도 쓰인 글자만 싣는다.
 */
export async function fontCss(): Promise<string> {
  const faces = async (pkg: string, weights: number[]) => {
    const dir = dirname(
      Bun.resolveSync(`@fontsource/${pkg}/package.json`, REPO),
    );
    const css = await Promise.all(
      weights.map((w) => Bun.file(`${dir}/${w}.css`).text()),
    );
    // woff2 만 남긴다 — 크롬은 woff2 를 읽으므로 woff 는 받지 않는다.
    return css
      .join("\n")
      .replace(
        /src:\s*url\(\.\/files\/([^)]+\.woff2)\)\s*format\('woff2'\)[^;]*;/g,
        (_m, f: string) =>
          `src: url("file://${dir}/files/${f}") format("woff2");`,
      );
  };
  return [
    await faces("ibm-plex-sans-kr", [400, 500, 700]),
    await faces("ibm-plex-mono", [400, 500, 600]),
  ].join("\n");
}

/**
 * @param head 머리말 왼쪽 문구(`쉽게 이해하는 알고리즘 · 초급`). 챕터 간지도 같은 문구를 쓴다.
 */
export function printCss(cfg: BookConfig, head: string): string {
  const { paper, mark } = cfg.design;
  const m = GEOMETRY.margin;
  const run = `font-family: ${SANS}; font-size: 8.5pt; font-weight: 500; line-height: 1.7;
    letter-spacing: .22em; color: ${INK.muted};`;
  const ruled = `vertical-align: bottom; margin-bottom: 9mm; padding-bottom: 3mm;
    border-bottom: 1px solid ${INK.ink};`;
  return `
/* ── 팔레트 못박기 (어둠 모드 무력화) ───────────────────────── */
:root {
  --gs-page: ${paper}; --gs-ink: ${INK.ink}; --gs-muted: ${INK.muted};
  --gs-rule: ${INK.rule}; --gs-soft: ${INK.codeBg};
  --guide-sim-text: ${INK.ink}; --guide-sim-bg: #ffffff; --guide-sim-line: ${INK.rule};
  --bk-mark: ${mark};
  --bk-run: ${cssString(head)};
}

/* ── 쪽 틀 ──────────────────────────────────────────────── */
@page {
  size: ${cfg.page.format};
  margin: ${m.top}mm ${m.side}mm ${m.bottom}mm;
  @top-left { content: ${cssString(head)}; ${run} ${ruled} white-space: nowrap; }
  @top-center { content: ""; ${ruled} }
  @top-right { content: ""; ${run} ${ruled} text-align: right; white-space: nowrap; }
  @bottom-center {
    content: counter(page); font-family: ${MONO}; font-size: 9pt; line-height: 1.7;
    color: ${INK.muted}; vertical-align: bottom; padding-bottom: ${GEOMETRY.sheet.bottom}mm;
  }
}
@page bk-toc { @top-right { content: "CONTENTS"; } }
@page bk-back { @top-right { content: "COLOPHON"; } }
/* 표지 · 챕터 간지 · 뒤표지 — 한 쪽이 곧 디자인이다. 여백도 머리말도 없다. */
@page bk-full {
  margin: 0;
  @top-left { content: none; } @top-center { content: none; }
  @top-right { content: none; } @bottom-center { content: none; }
}

/* ── 지면 ───────────────────────────────────────────────── */
html, body { background: ${paper}; }
body {
  font-family: ${SANS}; font-size: 10.5pt; line-height: 1.7; color: ${INK.ink};
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
main { max-width: none; margin: 0; padding: 0; }
.gs-rail { display: none !important; }
/* 템플릿의 문서 틀(doc-page)이 기본으로 거는 줄바꿈 — 제목은 줄 길이를 고르게, 문단은 끝 줄에
 * 한 글자만 남기지 않게. 명시도 0 이라 따로 적은 값이 이긴다. */
:where(h1, h2, h3, h4, h5, h6) { text-wrap: balance; }
:where(p, li, blockquote, figcaption) { text-wrap: pretty; }
/* 제목과 한 쪽짜리 틀(표지 · 간지 · 뒤표지 · 목차 항목)은 낱말 중간에서 끊지 않는다. 템플릿은 예시
 * 제목이 한 줄 폭에 맞아 드러나지 않았지만, 실제 제목에서 「용/량별」처럼 갈렸다. 본문 문단은
 * 템플릿대로 둔다 — 좁은 표 칸에서 낱말째 넘기면 칸이 비어 보인다. */
h1, h2, h3, h4, h5, h6, .bk-opener, .bk-cover, .bk-bc, .bk-toc-list a, .bk-toc-lede {
  word-break: keep-all; overflow-wrap: anywhere;
}
a { color: ${INK.ink}; text-decoration: none; }

/* ── 쪽 나눔 ────────────────────────────────────────────── */
.bk-chapter, .bk-toc, .bk-back, .bk-backcover { break-before: page; page-break-before: always; }
.bk-cover { break-before: auto; }
.bk-toc { page: bk-toc; }
.bk-back { page: bk-back; }
h1, h2, h3, h4, h5, h6 { break-after: avoid; page-break-after: avoid; break-inside: avoid; }
p, li { orphans: 2; widows: 2; }
pre.gs-ascii, blockquote, details.gs-check { break-inside: avoid; }
figure, .gs-mount { break-inside: avoid; }

/* ── 제목 ───────────────────────────────────────────────── */
h2 {
  font-size: 14pt; font-weight: 700; line-height: 1.4; letter-spacing: -.01em;
  margin: 10mm 0 6mm; padding: 0 0 2.5mm; border: 0; border-bottom: 2px solid ${INK.ink};
}
.bk-opener + h2 { margin-top: 0; }
h3 { font-size: 12pt; font-weight: 700; line-height: 1.45; margin: 7mm 0 3mm; }
/* 템플릿은 단계 제목(「3. 칸 하나를 세 갈래로 정한다」)을 절 제목과 같은 12pt 로 그렸다.
 * 원고에서는 절 아래 단계라 한 단 낮춘다 — 같은 크기면 절과 단계의 위계가 지면에서 사라진다. */
h4 { font-size: 11pt; font-weight: 700; line-height: 1.5; margin: 5.5mm 0 2.5mm; }

/* ── 본문 ───────────────────────────────────────────────── */
p { margin: 0 0 3.5mm; }
strong, b { font-weight: 700; }
:not(pre) > code {
  font-family: ${MONO}; font-size: .895em; background: ${INK.inlineBg};
  padding: .4mm 1.4mm; border-radius: 0;
}
blockquote {
  margin: 0 0 6mm; padding: 0 0 0 6mm; border-left: 2px solid ${INK.ink}; color: ${INK.ink};
}
blockquote > :last-child { margin-bottom: 0; }
blockquote code, blockquote :not(pre) > code { background: transparent; padding: 0; }
ul { list-style: none; margin: 0 0 5mm; padding: 0; }
ul > li { position: relative; margin: 0 0 2.2mm; padding-left: 5.5mm; line-height: 1.65; }
ul > li::before { content: "—"; position: absolute; left: 0; top: 0; }
ol { margin: 0 0 6mm; padding: 0 0 0 7mm; }
ol > li { margin: 0 0 2.5mm; }
li > p { margin: 0; }
.bk-chapter a[href^="#"] { border-bottom: 1px solid ${INK.ink}; }

/* ── 책 안으로 못 들어온 상호 참조 ───────────────────────── */
.bk-xref-dead, .bk-xref-dead::after { color: ${INK.dead}; }
.bk-xref-dead::after { content: " (미수록)"; }
/* 다른 권에 실린 장 — 링크 대신 실린 자리를 적는다(volume.ts) */
.bk-xref-other::after {
  content: " (" attr(data-where) ")"; font-size: 9pt; font-weight: 500;
  letter-spacing: .06em; color: ${INK.muted};
}

/* ── 표 — 종이에는 스크롤이 없다 ─────────────────────────── */
table {
  display: table; table-layout: fixed; width: 100%; overflow: visible;
  border-collapse: collapse; font-size: 10pt; line-height: 1.45; margin: 0 0 7mm;
}
thead { display: table-header-group; }
tr { break-inside: avoid; }
th, td {
  border: 0; padding: 2.4mm 2mm; text-align: left; vertical-align: top;
  overflow-wrap: anywhere; word-break: break-word;
}
th { font-weight: 700; border-bottom: 2px solid ${INK.ink}; }
td { border-bottom: 1px solid ${INK.rule}; }

/* ── 코드 — 흑백. 예약어는 굵게, 주석은 옅게 ─────────────── */
pre.shiki, pre.gs-ascii {
  font-family: ${MONO}; font-size: 9pt; line-height: 1.6; border-radius: 0;
  border: 0; margin: 0 0 6mm; padding: 5mm; background: ${INK.codeBg} !important;
}
pre.shiki > code, pre.gs-ascii > code {
  font: inherit; background: none; padding: 0; white-space: pre-wrap; overflow-wrap: anywhere;
}
.shiki span { background: transparent !important; color: ${INK.ink} !important; }
.shiki span[style*="color:#d73a49" i] { font-weight: 600; }
.shiki span[style*="color:#6a737d" i] { color: ${INK.faint} !important; }
/* 도식은 줄 맞춤이 내용이다 — 접지 않고, 넘치면 인쇄 직전에 글자를 줄여 맞춘다(build-book.ts 의 FIT_JS) */
pre.shiki[data-language="text"] > code, pre.gs-ascii, pre.gs-ascii > code { white-space: pre; }
pre.bk-fit-wrap > code, pre.gs-ascii.bk-fit-wrap { white-space: pre-wrap !important; overflow-wrap: anywhere; }
figure.bk-code { margin: 0 0 6mm; border-top: 2px solid ${INK.ink}; break-inside: auto; }
figure.bk-code > pre.shiki { margin: 0; padding: 4.5mm 5mm; }
.bk-code-head {
  display: flex; justify-content: space-between; align-items: center; padding: 2.4mm 0;
  font-size: 8.5pt; font-weight: 500; line-height: 1.5; letter-spacing: .2em; color: ${INK.muted};
  border-bottom: 1px solid ${INK.rule}; break-after: avoid;
}
.bk-code-lang { font-family: ${MONO}; letter-spacing: .04em; color: ${INK.ink}; }

/* ── 시뮬레이션 대체 그림 ───────────────────────────────── */
.gs-mount { position: relative; margin: 0 0 7mm; border: 1px solid ${INK.ink}; }
.gs-mount::before {
  content: "시뮬레이션"; display: block; padding: 2.4mm 5mm; border-bottom: 1px solid ${INK.ink};
  font-size: 8.5pt; font-weight: 500; line-height: 1.5; letter-spacing: .02em; color: ${INK.ink};
}
.gs-mount::after {
  content: "SCREEN: INTERACTIVE"; position: absolute; top: 2.4mm; right: 5mm;
  font-size: 8.5pt; font-weight: 500; line-height: 1.5; letter-spacing: .2em; color: ${INK.muted};
}
.gs-mount > pre.gs-ascii { margin: 0; background: none !important; overflow: hidden; }

/* ── 짚고 가기 — 흔한 실수를 짚는 자리. 책에서 색이 들어가는 곳 ──── */
.bk-stop { margin: 5.5mm 0 7mm; padding: 0 0 0 5mm; border-left: 3px solid var(--bk-mark); }
.bk-stop::before {
  content: "STOP"; display: block; margin-bottom: 1.5mm; font-size: 8.5pt; font-weight: 500;
  line-height: 1.5; letter-spacing: .22em; color: var(--bk-mark);
}
.bk-stop > h4 { font-size: 11.5pt; margin: 0 0 2mm; }
.bk-stop p { font-size: 10.2pt; }
.bk-stop > :last-child { margin-bottom: 0; }

/* ── 스스로 점검하기 답 ─────────────────────────────────── */
.bk-chapter { counter-reset: bk-answer; }
details.gs-check {
  margin: 0 0 7mm; padding: 3.5mm 0 0; border: 0; border-top: 1px solid ${INK.ink};
  border-radius: 0; counter-increment: bk-answer;
}
details.gs-check > summary {
  display: block; list-style: none; margin: 0 0 2.5mm; font-size: 8.5pt; font-weight: 500;
  line-height: 1.5; letter-spacing: .22em; color: ${INK.muted};
}
details.gs-check > summary::-webkit-details-marker { display: none; }
details.gs-check > summary::before { content: "ANSWER " counter(bk-answer) " — "; }
details.gs-check p { font-size: 10.2pt; }
details.gs-check > :last-child { margin-bottom: 0; }

/* ── 챕터 간지 ──────────────────────────────────────────── */
.bk-opener {
  page: bk-full; position: relative; height: 297mm; overflow: hidden; background: #ffffff;
}
.bk-opener-run {
  position: absolute; left: 20mm; right: 20mm; top: 18mm; display: flex;
  justify-content: space-between; align-items: baseline; padding-bottom: 3mm;
  border-bottom: 1px solid ${INK.ink}; ${run}
}
.bk-opener-run::before { content: var(--bk-run); }
.bk-opener-no {
  position: absolute; left: -10mm; top: 52mm; font-size: 300pt; font-weight: 700;
  line-height: .74; letter-spacing: -.08em; color: ${INK.ink};
}
/* 템플릿은 아래 58mm 에 붙인 고정 배치다. 제목과 파트 요약이 긴 장에서 위의 큰 번호를 덮지 않게,
 * 모자라면 아래 여백(58mm → 30mm)부터 내준다 — 뒤의 빈 상자가 줄어드는 몫이 그것이다. */
.bk-opener-col {
  position: absolute; left: 20mm; right: 20mm; top: 136mm; bottom: 30mm;
  display: flex; flex-direction: column; justify-content: flex-end;
}
.bk-opener-col::after { content: ""; flex: 0 1 28mm; }
.bk-opener-col > * { flex: none; }
.bk-opener .bk-kicker {
  margin: 0; font-size: 9pt; font-weight: 500; line-height: 1.7; letter-spacing: .22em;
  color: ${INK.muted};
}
.bk-opener h1 {
  margin: 5mm 0 0; max-width: 150mm; font-size: 24pt; font-weight: 700; line-height: 1.35;
  letter-spacing: -.02em; border: 0; padding: 0;
}
.bk-opener-rule { margin-top: 8mm; width: 30mm; height: 2px; background: ${INK.ink}; }
.bk-opener-parts {
  margin-top: 9mm; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8mm;
}
.bk-opener-parts > div { border-top: 1px solid ${INK.rule}; padding-top: 3.5mm; }
.bk-opener-part { margin: 0; font-size: 10.5pt; font-weight: 700; line-height: 1.5; }
.bk-opener-lede { margin: 2.5mm 0 0; font-size: 9.5pt; line-height: 1.7; color: ${INK.sub}; }
.bk-opener-foot {
  position: absolute; left: 20mm; right: 20mm; bottom: 22mm; display: flex;
  justify-content: space-between; align-items: center; padding-top: 3mm;
  border-top: 1px solid ${INK.ink}; font-size: 8.5pt; font-weight: 500; line-height: 1.7;
  letter-spacing: .2em; color: ${INK.sub};
}
.bk-folio { font-family: ${MONO}; letter-spacing: 0; color: ${INK.muted}; }

/* ── 표지 ───────────────────────────────────────────────── */
.bk-cover { page: bk-full; position: relative; height: 297mm; overflow: hidden; background: #ffffff; }
.bk-cover-no {
  position: absolute; left: -16mm; top: 38mm; font-size: 400pt; font-weight: 700;
  line-height: .74; letter-spacing: -.08em;
}
.bk-cover-rule { position: absolute; left: 106mm; top: 0; bottom: 0; width: 1px; background: ${INK.ink}; }
.bk-cover-title {
  position: absolute; left: 116mm; top: 28mm; margin: 0; writing-mode: vertical-rl;
  text-orientation: upright; font-size: 30pt; font-weight: 700; line-height: 1.05; letter-spacing: -.01em;
}
.bk-cover-range {
  position: absolute; left: 140mm; bottom: 22mm; margin: 0; writing-mode: vertical-rl;
  text-orientation: upright; font-size: 12pt; line-height: 1.5; color: ${INK.sub};
}
.bk-cover-vol {
  position: absolute; left: 158mm; top: 28mm; margin: 0; writing-mode: vertical-rl;
  font-size: 10pt; font-weight: 500; line-height: 1.7; letter-spacing: .24em;
}
.bk-cover-series { position: absolute; left: 20mm; bottom: 18mm; display: flex; align-items: center; gap: 4mm; }
.bk-label { font-size: 8.5pt; font-weight: 500; line-height: 1.7; letter-spacing: .24em; color: ${INK.muted}; }
.bk-mark { display: inline-block; width: 9mm; height: 3mm; background: var(--bk-mark); }

/* ── 목차 ───────────────────────────────────────────────── */
.bk-toc-head { display: flex; align-items: baseline; gap: 6mm; margin: 3mm 0 2mm; }
.bk-toc h1 {
  margin: 0; padding: 0; border: 0; font-size: 26pt; font-weight: 700; line-height: 1.2;
  letter-spacing: -.02em;
}
.bk-toc-meta { font-size: 9pt; font-weight: 500; letter-spacing: .22em; color: ${INK.muted}; }
.bk-toc-lede { margin: 0 0 9mm; font-size: 10pt; line-height: 1.7; color: ${INK.sub}; }
.bk-toc-part { margin: 9mm 0 5mm; font-size: 14pt; font-weight: 700; line-height: 1.4; break-after: avoid; }
.bk-toc-volume { margin: 8mm 0 4mm; font-size: 12pt; font-weight: 700; line-height: 1.45; break-after: avoid; }
.bk-toc-group { margin: 0 0 7mm; }
.bk-toc-bundle {
  display: flex; align-items: baseline; gap: 4mm; margin: 0 0 3.5mm; padding-bottom: 2mm;
  border-bottom: 1px solid ${INK.ink}; font-size: 11pt; font-weight: 700; line-height: 1.5;
  break-after: avoid;
}
.bk-toc-count {
  margin-left: auto; font-size: 8.5pt; font-weight: 500; letter-spacing: .2em; color: ${INK.muted};
}
.bk-toc-list { list-style: none; margin: 0; padding: 0; }
.bk-toc-list li {
  display: flex; align-items: baseline; gap: 4mm; margin: 0 0 2.6mm; padding: 0;
  font-size: 10.5pt; line-height: 1.45; break-inside: avoid;
}
.bk-toc-list li::before { content: none; }
.bk-toc-no { flex: none; width: 7mm; font-family: ${MONO}; font-size: 9.5pt; color: ${INK.muted}; }
.bk-toc-list a { flex: 1; color: ${INK.ink}; }
.bk-toc-dots { flex: 0 0 8mm; align-self: flex-end; border-bottom: 1px dotted ${INK.leader}; }
.bk-toc-page { font-family: ${MONO}; font-size: 9.5pt; font-weight: 500; color: ${INK.ink}; }
.bk-toc-end {
  display: flex; justify-content: space-between; margin-top: 2mm; padding-top: 3mm;
  border-top: 1px solid ${INK.ink}; font-size: 9pt; color: ${INK.sub}; break-inside: avoid;
}
.bk-toc-end .bk-toc-page { color: ${INK.sub}; font-weight: 400; }

/* ── 마무리 ─────────────────────────────────────────────── */
.bk-back > h1 {
  margin: 3mm 0 9mm; font-size: 26pt; font-weight: 700; line-height: 1.2; letter-spacing: -.02em;
}
.bk-back > h2:first-of-type { margin-top: 0; }
.bk-colophon table { font-size: 9pt; }
.bk-colophon code { font-size: .85em; }
.bk-colophon .bk-kicker { font-size: 8.5pt; letter-spacing: .1em; color: ${INK.muted}; }

/* ── 뒤표지 ─────────────────────────────────────────────── */
.bk-backcover { page: bk-full; position: relative; height: 297mm; overflow: hidden; background: #ffffff; }
.bk-bc {
  height: 100%; box-sizing: border-box; padding: 20mm; display: flex; flex-direction: column;
  position: relative; overflow: hidden;
}
.bk-bc-headline {
  margin: 0; max-width: 140mm; font-size: 18pt; font-weight: 700; line-height: 1.45; letter-spacing: -.02em;
}
.bk-bc-lede { margin: 5mm 0 0; max-width: 132mm; font-size: 10.5pt; line-height: 1.75; color: ${INK.sub}; }
.bk-bc-series { margin-top: 12mm; display: flex; flex-direction: column; font-size: 10.5pt; line-height: 1.5; }
.bk-bc-series > div { display: flex; gap: 5mm; padding: 3.4mm 0; border-top: 1px solid ${INK.rule}; }
.bk-bc-series > div:first-child { border-top-color: ${INK.ink}; }
.bk-bc-series > div:last-child { border-bottom: 1px solid ${INK.ink}; }
.bk-bc-vol { width: 16mm; font-family: ${MONO}; }
.bk-bc-label { width: 16mm; font-weight: 700; }
.bk-bc-blurb { flex: 1; }
.bk-bc-size { font-family: ${MONO}; font-size: 9.5pt; }
.bk-bc-facts {
  margin-top: 9mm; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6mm;
  font-size: 9.5pt; line-height: 1.65;
}
.bk-bc-facts .bk-label { letter-spacing: .22em; }
.bk-bc-facts .bk-label + div { margin-top: 1.5mm; }
.bk-bc-ghost {
  position: absolute; right: -6mm; bottom: 52mm; font-size: 190pt; font-weight: 700;
  line-height: .72; letter-spacing: -.08em; color: ${INK.inlineBg};
}
.bk-bc-foot {
  margin-top: auto; position: relative; display: flex; justify-content: space-between;
  align-items: flex-end; gap: 8mm;
}
.bk-bc-title { font-size: 13pt; font-weight: 700; letter-spacing: -.01em; }
.bk-bc-mark { display: flex; align-items: center; gap: 4mm; margin-top: 2.5mm; }
.bk-bc-isbn { text-align: center; }
.bk-bc-isbn > div + div { margin-top: 2mm; font-family: ${MONO}; font-size: 9pt; }
`;
}
