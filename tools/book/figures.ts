/**
 * 인쇄 그림 측정 — 그림(`figure.gs-fig`)이 **한 쪽 본문 상자 안에 한 벌씩** 들어가는가.
 *
 * 그림은 쪽 안에서 가를 수 없는 단위다. SVG 한 장 안의 쪽 나눔 자리는 CSS 로 정하지 못해서,
 * 본문 상자보다 긴 그림은 두 가지로 깨진다(KAN-059 파일럿 실측 — 고급 권 823·832쪽).
 * 틀(`.gs-mount`)이 `break-inside: avoid` 라 다음 쪽으로 밀리며 **머리 줄만 있는 빈 쪽**을 남기고,
 * 그림 자체는 쪽 경계에서 **걸음 칸 한가운데가 잘린다**.
 *
 * 재는 단위는 **그림 안의 SVG 한 장**이다 — 쪽이 넘어갈 수 있는 자리는 SVG 와 SVG 사이뿐이다.
 * 걸음 필름(`CellStageFilm`)은 원래 한 장이지만 책이 걸음 칸마다 한 장으로 가르므로
 * (`fragment.ts`), 가른 뒤에는 칸 하나가 한 단위가 된다. 안 갈랐으면 필름 전체가 한 단위라
 * 그대로 높이 초과로 잡힌다 — 이 검사가 가르기의 성패를 잰다.
 *
 * 브라우저는 **잰 값만** 낸다(`build-book.ts` 의 `FIT_JS` → `window.bkFigs`). 판정은 여기서 한다 —
 * 크롬 없이 시험할 수 있어야 해서다.
 */

import type { BookConfig } from "./config.ts";
import { GEOMETRY } from "./print-css.ts";

/** 브라우저가 잰 그림 하나. 치수는 SVG 사용자 단위(= 확대 1배일 때의 CSS px)다. */
export interface FigMeasure {
  /** `data-fig` — `figs/{id}.svg` 의 이름. */
  fig: string;
  /** 시뮬레이션 틀(`.gs-mount`) 안에 있는가. 틀은 테두리와 머리 줄만큼 자리를 먹는다. */
  mounted: boolean;
  /** 그림 안의 SVG 한 장씩. 치수는 viewBox 폭·높이, `step` 은 가른 걸음 칸의 표지다. */
  units: FigUnit[];
}

export interface FigUnit {
  step: string | null;
  w: number;
  h: number;
}

/** 본문 상자(CSS px). */
export interface ContentBox {
  w: number;
  h: number;
}

const PAPER_MM: Record<BookConfig["page"]["format"], { w: number; h: number }> =
  {
    A4: { w: 210, h: 297 },
    Letter: { w: 215.9, h: 279.4 },
  };

const PX_PER_MM = 96 / 25.4;

/**
 * 시뮬레이션 틀의 머리 줄 높이(px) — `print-css.ts` 의 `.gs-mount::before`
 * (위아래 2.4mm + 8.5pt × 1.5 줄 + 선 1px)와 틀 위 테두리 1px. 첫 덩어리가 이것과 한 쪽에 선다.
 */
export const MOUNT_HEAD_PX = Math.ceil(
  4.8 * PX_PER_MM + ((8.5 * 96) / 72) * 1.5 + 2,
);

/** 틀 좌우 테두리 — 그림이 쓸 수 있는 폭이 그만큼 준다. */
const MOUNT_SIDE_PX = 2;

/** 쪽 규격과 여백(`GEOMETRY.margin`)에서 낸 본문 상자. */
export function contentBox(format: BookConfig["page"]["format"]): ContentBox {
  const paper = PAPER_MM[format];
  const m = GEOMETRY.margin;
  return {
    w: (paper.w - m.side * 2) * PX_PER_MM,
    h: (paper.h - m.top - m.bottom) * PX_PER_MM,
  };
}

export interface FigVerdict {
  fig: string;
  /** 본문 폭에 맞춰 줄어드는 배율(가장 많이 줄어드는 SVG 기준). 1 이면 제 크기로 찍힌다. */
  scale: number;
  /** 폭이 본문 폭을 넘어 줄어드는가. 위반은 아니다 — 수로 알린다. */
  widthOver: boolean;
  /** 쪽에 안 들어가는 덩어리. 비었으면 통과다. */
  tooTall: Array<{ step: string | null; h: number; limit: number }>;
}

/** 그림 하나를 판정한다. 찍히는 높이는 폭 배율을 곱한 값이다(`max-width: 100%; height: auto`). */
export function judgeFig(m: FigMeasure, box: ContentBox): FigVerdict {
  const avail = box.w - (m.mounted ? MOUNT_SIDE_PX : 0);
  const scaleOf = (u: FigUnit) => (u.w > avail ? avail / u.w : 1);
  const scale = Math.min(1, ...m.units.map(scaleOf));
  const tooTall: FigVerdict["tooTall"] = [];
  m.units.forEach((u, n) => {
    const limit = box.h - (m.mounted && n === 0 ? MOUNT_HEAD_PX : 0);
    const h = u.h * scaleOf(u);
    if (h > limit) {
      tooTall.push({
        step: u.step,
        h: Math.round(h),
        limit: Math.round(limit),
      });
    }
  });
  return { fig: m.fig, scale, widthOver: scale < 1, tooTall };
}

/** 조판 규약 위반 줄(`finish` 가 찍는 형식). 높이 초과만 위반이다. */
export function figureViolations(
  chapterId: string,
  figs: readonly FigMeasure[],
  box: ContentBox,
): string[] {
  const out: string[] = [];
  for (const m of figs) {
    const v = judgeFig(m, box);
    for (const t of v.tooTall) {
      out.push(
        `${chapterId}: 그림 ${m.fig}${t.step === null ? "" : ` 칸 ${t.step}`} 높이 초과 — ` +
          `${t.h}px > 본문 ${t.limit}px (배율 ${v.scale.toFixed(2)})`,
      );
    }
  }
  return out;
}

/** 폭 때문에 줄어 찍히는 그림 — 위반이 아니라 알림이다. */
export function figureShrinks(
  chapterId: string,
  figs: readonly FigMeasure[],
  box: ContentBox,
): string[] {
  return figs
    .map((m) => judgeFig(m, box))
    .filter((v) => v.widthOver)
    .map(
      (v) =>
        `${chapterId}: 그림 ${v.fig} 폭이 본문을 넘어 ${v.scale.toFixed(2)}배로 줄어 찍힌다`,
    );
}

/**
 * 브라우저 쪽 측정 — `FIT_JS` 끝에 붙는다. 잰 값만 `window.bkFigs` 에 둔다.
 * SVG 안에 든 SVG(중첩)는 세지 않는다 — 그림 바로 아래 층만 쪽 나눔 단위다.
 */
export const MEASURE_FIGS_JS = `window.bkFigs = [...document.querySelectorAll("figure.gs-fig")].map((fig) => ({
    fig: fig.getAttribute("data-fig") || "",
    mounted: fig.closest(".gs-mount") !== null,
    units: [...fig.querySelectorAll("svg")].filter((s) => s.parentElement.closest("svg") === null).map((s) => {
      const vb = s.viewBox.baseVal;
      return {
        step: s.getAttribute("data-bk-step"),
        w: vb && vb.width > 0 ? vb.width : s.width.baseVal.value,
        h: vb && vb.height > 0 ? vb.height : s.height.baseVal.value,
      };
    }),
  }));`;
