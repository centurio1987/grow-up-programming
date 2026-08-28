/**
 * v2 골격 가이드의 **대상 집합 하나**.
 *
 * `check-v2` · `check-proof` · `check-metaphor` 가 각자 글롭을 들면 세 벌이 갈리고, 갈린
 * 쪽이 조용히 덜 검사한다. 정의를 여기 하나만 둔다.
 *
 * 대상은 `src/algorithms/**\/*-guide.md` 다 — v1 은 `.mdx` 라 자동으로 빠진다.
 * `_deprecated/`(이력 사본)와 `_scratch/`(습작)는 살아 있는 코드가 참조하지 않으므로 뺀다.
 */

import { resolve } from "node:path";
import { Glob } from "bun";

export const ROOT = resolve(import.meta.dir, "..");

/** 검사에서 빼는 자리. 루트 `tsconfig.json` 의 `exclude` 와 같은 기준이다. */
const SKIP = ["_deprecated/", "_scratch/"];

export async function v2Guides(): Promise<string[]> {
  const glob = new Glob("src/algorithms/**/*-guide.md");
  const out: string[] = [];
  for await (const path of glob.scan({ cwd: ROOT })) {
    if (SKIP.some((s) => path.includes(s))) continue;
    out.push(path);
  }
  return out.sort();
}

/**
 * 은유 스캐너가 보는 문서 — 가이드에 더해 **규격과 이력을 뺀 산문 전체**다.
 * 규칙을 적는 자리가 그 규칙에 걸리면 표기를 맞추지 대상에서 빼지 않는다(`L24`).
 */
export async function v2Docs(): Promise<string[]> {
  const guides = await v2Guides();
  const specs = [
    "sandbox/algo-guide-v2/SPEC.md",
    "sandbox/algo-guide-v2/FEEDBACK.md",
    "sandbox/algo-guide-v2/README.md",
    "sandbox/algo-guide-v2/SURVEY.md",
  ];
  const partials: string[] = [];
  const glob = new Glob("src/algorithms/**/*-guide.partial.md");
  for await (const path of glob.scan({ cwd: ROOT })) {
    if (SKIP.some((s) => path.includes(s))) continue;
    partials.push(path);
  }
  return [...specs, ...guides, ...partials.sort()];
}
