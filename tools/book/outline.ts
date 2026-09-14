/**
 * PDF 문서 개요(뷰어 사이드바의 목차) — **본문 목차와 같은 구조**로 세운다.
 *
 * 크롬(152 실측)은 `Page.printToPDF` 에 `generateTaggedPDF` 와 `generateDocumentOutline` 을
 * 함께 주면 제목 요소로 개요를 만든다. 둘 중 태그 쪽이 빠지면 개요가 아예 안 생긴다.
 * 제목을 그대로 두면 개요가 본문 목차와 갈린다 — 장마다 `h1`~`h4` 가 스무 개 넘게 서고,
 * 목차의 묶음(「이진 탐색」)은 본문에 제목으로 없어서 개요에 안 나온다. 그래서 인쇄 직전에
 * 제목의 수준을 다시 매긴다. 실측한 크롬의 규칙은 넷이다.
 *
 * | 표기 | 개요에서 |
 * | --- | --- |
 * | `<h2 aria-level="4">` | 4 수준으로 선다(태그의 숫자보다 `aria-level` 이 이긴다) |
 * | `<h4 role="presentation">` | 빠진다 |
 * | `aria-label` | **무시한다** — 개요 이름은 글자 내용이다 |
 * | `display:none` · `height:0` · `opacity:0` · `clip-path` 로 숨긴 제목 | 빠진다 |
 *
 * 본문에 없는 제목(묶음 · 번호 붙은 장 이름)은 `position:absolute` 에 1px 투명 글자로 세운다
 * (`.bk-outline`). 위의 네 방법으로 숨기면 개요에서도 빠지고, 절대 위치라 조판을 밀지 않는다 —
 * top·left 를 안 주면 제자리(장 첫 쪽 맨 위)에 서므로 개요가 그 쪽을 가리킨다.
 *
 * 쪽수는 이 표기 **전의** 본문으로 잰다. 표기가 조판을 흔들면 합본 실측이 예측과 어긋나
 * 빌더가 실패하므로, 흔들지 않는다는 전제는 매 빌드가 확인한다.
 */

import type { Chapter, Part } from "./chapters.ts";
import { esc } from "./matter.ts";

/** 제목 태그 수준별로 개요 수준을 준다. `null` 이면 개요에서 뺀다. 안 적은 수준은 그대로. */
export type Levels = Partial<Record<1 | 2 | 3 | 4 | 5 | 6, number | null>>;

export function relevel(html: string, levels: Levels): string {
  return html.replace(/<h([1-6])\b/g, (m, n: string) => {
    const to = levels[Number(n) as keyof Levels];
    if (to === undefined) return m;
    return to === null ? `${m} role="presentation"` : `${m} aria-level="${to}"`;
  });
}

/** 본문에 없는 개요 항목. 보이지 않고 조판을 밀지 않는다. */
export function mark(level: number, label: string): string {
  return `<div class="bk-outline" role="heading" aria-level="${level}">${esc(label)}</div>`;
}

export const OUTLINE_CSS = `
.bk-outline {
  position: absolute; margin: 0; padding: 0;
  font-size: 1px; line-height: 1px; color: transparent; white-space: nowrap;
}
`;

/**
 * 장 첫 쪽 맨 위에 표기를 넣는다. 간지가 있으면 **간지 안쪽**이다 — 간지 앞(장 껍데기 바로
 * 안)에 두면 간지와 이름 붙은 쪽이 다른 상자가 먼저 서서, 표기만 실린 빈 쪽이 생길 수 있다.
 */
export function atChapterTop(
  html: string,
  marks: string[],
  id: string,
): string {
  const head =
    /<section class="bk-opener"[^>]*>/.exec(html) ??
    /<section class="bk-chapter"[^>]*>/.exec(html);
  if (head === null) {
    throw new Error(`${id}: 장 껍데기가 없어 개요 표기를 붙일 자리가 없다`);
  }
  const at = head.index + head[0].length;
  return `${html.slice(0, at)}\n${marks.join("\n")}${html.slice(at)}`;
}

/**
 * 한 권의 장들에 개요 표기를 한다. 수준은 목차(`matter.ts` 의 `toc`)와 같은 순서로 쌓는다 —
 * 부(권 안에 둘 이상일 때만) → 편(이름이 있을 때) → 묶음 → 「N. 장 제목」 → 파트 → 절.
 * 단계 제목(`h4`) 아래는 뺀다. 한 장에 열 개가 넘어 개요가 본문 목차보다 길어진다.
 */
export function outlineChapters(
  parts: Part[],
  bodies: Map<string, string>,
  titleOf: (c: Chapter) => string,
): Map<string, string> {
  const out = new Map<string, string>();
  const manyParts = parts.length > 1;

  for (const part of parts) {
    let partOpen = false;
    for (const vol of part.volumes) {
      let volOpen = false;
      for (const bundle of vol.bundles) {
        let bundleOpen = false;
        for (const ch of bundle.chapters) {
          const body = bodies.get(ch.id);
          if (body === undefined) continue;

          const marks: string[] = [];
          let depth = 0;
          if (manyParts) {
            depth++;
            if (!partOpen) marks.push(mark(depth, part.label));
            partOpen = true;
          }
          if (vol.label !== "") {
            depth++;
            if (!volOpen) marks.push(mark(depth, vol.label));
            volOpen = true;
          }
          if (bundle.label !== "") {
            depth++;
            if (!bundleOpen) marks.push(mark(depth, bundle.label));
            bundleOpen = true;
          }
          marks.push(mark(depth + 1, `${ch.number ?? 0}. ${titleOf(ch)}`));

          const leveled = relevel(body, {
            1: null, // 장 제목은 번호를 붙인 표기가 대신 선다
            2: depth + 2,
            3: depth + 3,
            4: null,
            5: null,
            6: null,
          });
          out.set(ch.id, atChapterTop(leveled, marks, ch.id));
        }
      }
    }
  }
  return out;
}
