/**
 * 인쇄 CSS — 화면용 `PAGE_CSS` 위에 덧씌운다. **덮어쓰는 것만 적는다.**
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
 * 쪽번호와 머리말은 여기 없다 — CSS `@page` 여백 상자를 크롬이 지원하지 않아서
 * CDP `Page.printToPDF` 의 `headerTemplate`/`footerTemplate` 이 맡는다(`chrome.ts`).
 */

import type { BookConfig } from "./config.ts";

export function printCss(_cfg: BookConfig): string {
  return `
/* ── 팔레트 못박기 (어둠 모드 무력화) ───────────────────────── */
:root {
  --gs-page: #ffffff; --gs-ink: #1a1a1a; --gs-muted: #5f6368;
  --gs-rule: #d0d3d6; --gs-soft: #f4f5f7;
  --guide-sim-text: #1a1a1a; --guide-sim-bg: #ffffff; --guide-sim-line: #d0d3d6;
}
.shiki, .shiki span { color: var(--shiki-light) !important; background: var(--gs-soft) !important; }

/* ── 지면 ───────────────────────────────────────────────── */
html, body { background: #ffffff; }
body {
  font-size: 10.5pt; line-height: 1.68;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
main { max-width: none; margin: 0; padding: 0; }
.gs-rail { display: none !important; }

/* ── 쪽 나눔 ────────────────────────────────────────────── */
.bk-chapter, .bk-toc, .bk-back { break-before: page; page-break-before: always; }
.bk-cover { break-before: auto; }
h1, h2, h3, h4, h5, h6 { break-after: avoid; page-break-after: avoid; break-inside: avoid; }
p, li { orphans: 2; widows: 2; }
pre.gs-ascii, blockquote, details.gs-check { break-inside: avoid; }
figure, .gs-mount { break-inside: avoid; }

/* ── 표 — 종이에는 스크롤이 없다 ─────────────────────────── */
table {
  display: table; table-layout: fixed; width: 100%;
  font-size: .86em; overflow: visible;
}
thead { display: table-header-group; }
tr { break-inside: avoid; }
th, td { overflow-wrap: anywhere; word-break: break-word; padding: .38rem .5rem; vertical-align: top; }

/* ── 코드 — 넘치면 줄바꿈하되 아스키 그림은 그대로 둔다 ──────── */
pre { font-size: .82em; padding: .7rem .8rem; }
pre > code { white-space: pre-wrap; overflow-wrap: anywhere; }
pre.gs-ascii > code, pre.gs-ascii { white-space: pre; overflow: hidden; }

/* ── 제목 크기 (지면 기준으로 낮춘다) ────────────────────── */
h1 { font-size: 1.55rem; margin: 0 0 1.2rem; }
h2 { font-size: 1.2rem; margin: 1.8rem 0 .7rem; padding-top: .8rem; }
h3 { font-size: 1.05rem; margin: 1.3rem 0 .5rem; }
h4 { font-size: .97rem; margin: 1rem 0 .4rem; }

/* ── 챕터 머리 ──────────────────────────────────────────── */
.bk-chapter-head { margin-bottom: 1.4rem; }
.bk-kicker {
  margin: 0 0 .2rem; font-size: .78rem; letter-spacing: .04em;
  color: var(--gs-muted); text-transform: none;
}
.bk-chapter-no {
  margin: 0 0 .6rem; font-size: .95rem; font-weight: 600; color: var(--gs-ink);
}

/* ── 책 안으로 못 들어온 상호 참조 ───────────────────────── */
.bk-xref-dead { color: var(--gs-muted); }
.bk-xref-dead::after { content: " (미수록)"; font-size: .8em; color: var(--gs-muted); }
/* 다른 권에 실린 장 — 링크 대신 실린 자리를 적는다(volume.ts) */
.bk-xref-other::after { content: " (" attr(data-where) ")"; font-size: .8em; color: var(--gs-muted); }

/* ── 표지 ───────────────────────────────────────────────── */
.bk-cover { display: flex; flex-direction: column; justify-content: center; min-height: 88vh; }
.bk-cover-rule { width: 3.5rem; border-top: 3px solid var(--gs-ink); margin: 0 0 1.6rem; }
.bk-cover h1 { font-size: 2.6rem; line-height: 1.25; margin: 0 0 .8rem; }
.bk-cover .bk-volume { font-size: 1.9rem; font-weight: 700; margin: 0 0 .4rem; }
.bk-cover .bk-blurb { font-size: 1.05rem; margin: 0 0 1.4rem; }
.bk-cover .bk-sub { font-size: 1.1rem; color: var(--gs-muted); margin: 0 0 3rem; }
.bk-cover dl { margin: 0; font-size: .92rem; line-height: 1.9; }
.bk-cover dt { color: var(--gs-muted); display: inline-block; width: 5.5rem; }
.bk-cover dd { display: inline; margin: 0; }
.bk-cover dd::after { content: ""; display: block; }

/* ── 목차 ───────────────────────────────────────────────── */
.bk-toc h2 { border-top: none; padding-top: 0; }
.bk-toc-part { margin: 1.6rem 0 .6rem; font-size: 1.1rem; font-weight: 700; }
.bk-toc-volume { margin: .9rem 0 .3rem; font-size: .95rem; font-weight: 600; color: var(--gs-muted); }
.bk-toc-bundle { margin: .5rem 0 .15rem; font-size: .88rem; font-weight: 600; }
.bk-toc-list { list-style: none; margin: 0; padding: 0; }
.bk-toc-list li {
  display: flex; align-items: baseline; gap: .4rem;
  font-size: .86rem; line-height: 1.75; break-inside: avoid;
}
.bk-toc-list a { color: var(--gs-ink); text-decoration: none; }
.bk-toc-no { color: var(--gs-muted); min-width: 2.2rem; text-align: right; }
.bk-toc-dots { flex: 1; border-bottom: 1px dotted var(--gs-rule); transform: translateY(-.22rem); }
.bk-toc-page { color: var(--gs-muted); font-variant-numeric: tabular-nums; }

/* ── 마무리 ─────────────────────────────────────────────── */
.bk-colophon table { font-size: .78em; }
.bk-colophon code { font-size: .85em; }
`;
}
