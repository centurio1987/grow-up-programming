/**
 * 그림 사이드카 → SVG (KAN-057). 도식을 손으로 그리지 않고, 값은 정본 실행에서 받는다.
 *
 * ## 규약
 *
 * 가이드 `<stem>-guide.md` 옆의 `<stem>-guide.fig.tsx` 가 그림을 정의한다.
 *
 * ```ts
 * export const FIGS: Record<string, () => ReactElement> = { "concept-levels": () => <LevelTable … /> };
 * ```
 *
 * - 값은 `<stem>-guide.ref.ts` 를 실행해 받는다 — 손으로 적은 층·답을 그리면 그림만 옛말을 한다.
 * - 본문은 `<!--fig:<id>-->` 마커 다음 줄에 `![설명](./figs/<id>.svg)` 로 그림을 건다(S8).
 * - 산출은 가이드 옆 `figs/<id>.svg` 이고 **커밋한다** — md(GitHub 미리보기)가 그 파일을 그대로 보인다.
 *
 * ## 쓰는 법
 *
 * ```bash
 * bun run tools/render-figs.ts            # 전부 다시 뽑는다
 * bun run tools/render-figs.ts --check    # 커밋본과 바이트 대조 — 다르거나 없거나 남으면 1
 * bun run tools/render-figs.ts <가이드.md …>
 * ```
 *
 * 대조가 바이트 단위인 것이 이 도구의 요점이다. 렌더는 결정론적이라(`src/_viz/render.tsx`)
 * 같은 사이드카·같은 정본·같은 토큰이면 같은 바이트가 나온다. 그러니 셋 중 하나라도 바뀌었는데
 * SVG 를 다시 뽑지 않았으면 여기서 걸린다(KAN-057 S2 에서 원격 CI 도 재렌더 대조로 정했다).
 */

import { readdir } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative } from "node:path";
import type { ReactElement } from "react";
import { renderToSvg } from "../src/_viz/render";
import { kindOf, ROOT, v2Guides } from "./guide-v2-targets";

export type Figs = Record<string, () => ReactElement>;

export interface FigProblem {
  readonly guide: string;
  readonly id?: string;
  readonly detail: string;
}

export const FIG_ID = /^[a-z][a-z0-9-]*$/;

export const figSidecarOf = (guide: string): string =>
  guide.replace(/-guide\.md$/, "-guide.fig.tsx");
export const figDirOf = (guide: string): string => join(dirname(guide), "figs");

/** 가이드 하나의 그림을 뽑는다. `check` 면 쓰지 않고 커밋본과 대조만 한다. */
export async function renderGuideFigs(
  guide: string,
  check: boolean,
): Promise<FigProblem[]> {
  const sidecar = figSidecarOf(guide);
  if (!(await Bun.file(sidecar).exists())) return [];
  const rel = relative(ROOT, guide);
  const mod = (await import(sidecar)) as { FIGS?: Figs };
  const figs = mod.FIGS;
  if (!figs)
    return [
      { guide: rel, detail: `${basename(sidecar)} 가 FIGS 를 내보내지 않는다` },
    ];

  const problems: FigProblem[] = [];
  const dir = figDirOf(guide);
  for (const [id, make] of Object.entries(figs)) {
    if (!FIG_ID.test(id)) {
      problems.push({
        guide: rel,
        id,
        detail: "그림 id 는 소문자·숫자·하이픈이다",
      });
      continue;
    }
    const svg = await renderToSvg(make(), `fig-${id}`);
    const out = join(dir, `${id}.svg`);
    if (check) {
      const file = Bun.file(out);
      if (!(await file.exists()))
        problems.push({ guide: rel, id, detail: "SVG 가 없다 — 다시 뽑아라" });
      else if ((await file.text()) !== svg)
        problems.push({
          guide: rel,
          id,
          detail: "SVG 가 사이드카·정본·토큰과 다르다 — 다시 뽑아라",
        });
    } else {
      await Bun.write(out, svg);
    }
  }

  // FIGS 에 없는 SVG 가 남아 있으면 낡은 그림이다.
  const names = await readdir(dir).catch(() => [] as string[]);
  for (const name of names) {
    if (!name.endsWith(".svg")) continue;
    const id = name.slice(0, -4);
    if (!(id in figs))
      problems.push({
        guide: rel,
        id,
        detail: "FIGS 에 없는 SVG 가 남아 있다 — 지워라",
      });
  }
  return problems;
}

async function main(argv: string[]): Promise<number> {
  const check = argv.includes("--check");
  const named = argv
    .filter((a) => !a.startsWith("--"))
    .map((a) => join(ROOT, a));
  // v2Guides 는 저장소 기준 상대 경로를 준다 — 동적 import 가 이 파일 기준으로 풀지 않게 절대 경로로.
  const guides =
    named.length > 0
      ? named
      : (await v2Guides())
          .filter((g) => kindOf(g) === "algo")
          .map((g) => (isAbsolute(g) ? g : join(ROOT, g)));
  const problems: FigProblem[] = [];
  let withFigs = 0;
  for (const guide of guides) {
    if (await Bun.file(figSidecarOf(guide)).exists()) withFigs++;
    problems.push(...(await renderGuideFigs(guide, check)));
  }
  for (const p of problems)
    console.error(`${p.guide}${p.id ? ` [${p.id}]` : ""} — ${p.detail}`);
  if (problems.length > 0) return 1;
  console.log(
    `${check ? "대조" : "렌더"} 통과 — 그림 사이드카가 있는 가이드 ${withFigs}편 / 대상 ${guides.length}편.`,
  );
  return 0;
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
