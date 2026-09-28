/**
 * 걸음 재생 패널 껍데기(머리 · 설명 · 조작부)의 CSS — 색은 `design/viz/tokens.ts` 에서만 받는다.
 * 무대 안의 SVG 는 스타일 가이드 Provider 가 칠하고, 여기는 그 바깥 HTML 만 칠한다.
 */

import { type Colorway, DARK, FORM, LIGHT } from "../../../design/viz/tokens";

const vars = (c: Colorway): string =>
  [
    `--gp-page: ${c.page}`,
    `--gp-surface: ${c.surface}`,
    `--gp-soft: ${c.soft}`,
    `--gp-ink: ${c.ink}`,
    `--gp-muted: ${c.muted}`,
    `--gp-border: ${c.border}`,
    `--gp-rule: ${c.rule}`,
    `--gp-current: ${c.current}`,
    `--gp-on-current: ${c.onCurrent}`,
  ].join("; ");

const R = `${FORM.radius}px`;

export const PLAYER_CSS = `
.gs-player { ${vars(LIGHT)}; }
@media (prefers-color-scheme: dark) { .gs-player { ${vars(DARK)}; } }
.gs-player { box-sizing: border-box; max-width: 720px; margin: 1.5rem 0; border: 1px solid var(--gp-border);
  border-radius: ${R}; background: var(--gp-page); color: var(--gp-ink); font-family: ${FORM.fontSans};
  outline-offset: 3px; }
.gs-player * { box-sizing: border-box; }
.gs-player-head { display: flex; flex-direction: column; gap: 10px; padding: 16px 20px 12px;
  border-bottom: 1px solid var(--gp-rule); }
.gs-player-title { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
.gs-player-title b { font-size: 15px; font-weight: 600; }
.gs-player-title span { font-size: 12px; color: var(--gp-muted); }
.gs-player-badges { display: flex; gap: 4px; flex-wrap: wrap; }
.gs-player-badge { min-width: 36px; height: 24px; padding: 0 6px; font-family: ${FORM.fontMono}; font-size: 11px;
  border-radius: ${R}; cursor: pointer; background: transparent; color: var(--gp-ink);
  border: 1px solid var(--gp-ink); font-weight: 400; }
.gs-player-badge[data-state="current"] { background: var(--gp-current); color: var(--gp-on-current);
  border: 2px solid var(--gp-current); font-weight: 700; }
.gs-player-badge[data-state="todo"] { color: var(--gp-muted); border: 1px dashed var(--gp-border); }
.gs-player-stage { padding: 8px 8px; overflow: auto hidden; border-bottom: 1px solid var(--gp-rule);
  background: var(--gp-page); }
.gs-player-stage svg { display: block; max-width: none; }
.gs-player-desc { height: 112px; padding: 14px 20px; display: flex; flex-direction: column; gap: 6px;
  border-bottom: 1px solid var(--gp-rule); overflow: hidden; }
.gs-player-desc-head { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.gs-player-desc-id { min-width: 36px; height: 22px; padding: 0 6px; display: inline-flex; align-items: center;
  justify-content: center; font-family: ${FORM.fontMono}; font-size: 11px; font-weight: 700; border-radius: ${R};
  background: var(--gp-current); color: var(--gp-on-current); }
.gs-player-desc-title { font-size: 14px; font-weight: 600; }
.gs-player-pill { display: inline-flex; gap: 5px; align-items: baseline; font-family: ${FORM.fontMono};
  font-size: 13px; font-variant-numeric: tabular-nums; border: 1px solid var(--gp-ink); border-radius: ${R};
  padding: 1px 8px; background: var(--gp-surface); }
.gs-player-pill b { font-weight: 700; }
.gs-player-desc p { margin: 0; font-size: 13.5px; line-height: 1.6; }
.gs-player-vars { padding: 8px 20px; display: flex; gap: 8px; font-size: 12px; color: var(--gp-muted);
  border-bottom: 1px solid var(--gp-rule); }
.gs-player-vars span { font-family: ${FORM.fontMono}; color: var(--gp-ink); }
.gs-player-vars em { font-style: normal; color: var(--gp-ink); }
.gs-player-ctrl { padding: 12px 20px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.gs-player-ctrl button { height: 32px; min-width: 36px; padding: 0 8px; border: 1px solid var(--gp-border);
  border-radius: ${R}; background: var(--gp-surface); color: var(--gp-ink); font: inherit; font-size: 13px;
  cursor: pointer; }
.gs-player-ctrl button:disabled { opacity: 0.4; cursor: default; }
.gs-player-ctrl button.gs-player-play { min-width: 72px; border-color: var(--gp-ink); background: var(--gp-ink);
  color: var(--gp-page); font-weight: 600; }
.gs-player-ctrl input[type="range"] { flex: 1; min-width: 120px; accent-color: var(--gp-ink); }
.gs-player-count { font-family: ${FORM.fontMono}; font-size: 12px; font-variant-numeric: tabular-nums;
  min-width: 44px; text-align: right; }
`;
