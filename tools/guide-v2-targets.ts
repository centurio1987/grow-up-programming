/**
 * v2 골격 가이드의 **대상 집합 하나**.
 *
 * `check-v2` · `check-proof` · `check-metaphor` 가 각자 글롭을 들면 세 벌이 갈리고, 갈린
 * 쪽이 조용히 덜 검사한다. 정의를 여기 하나만 둔다.
 *
 * 대상은 `src/algorithms/**\/*-guide.md` 다 — v1 은 `.mdx` 라 자동으로 빠진다.
 * `_deprecated/`(이력 사본)와 `_scratch/`(습작)는 살아 있는 코드가 참조하지 않으므로 뺀다.
 */

import { basename, dirname, join, resolve } from "node:path";
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

/**
 * 사이드카 갈래. **`check-metaphor` 안에 있던 것을 여기로 올렸다**(2026-09-10 `KAN-034.9`
 * 배치3) — 이 파일 머리가 「각자 글롭을 들면 갈린다」고 적어 둔 그 모양이 사이드카 쪽에서
 * 다시 생기고 있었다.
 */
export const SIDECAR_KINDS = ["sim", "ref", "proof", "test", "alt"] as const;

/**
 * v2 가이드 111편의 **옆자리** 사이드카 전부. 글롭을 새로 적지 않고 `v2Guides()` 목록에서
 * 이름을 만들어 실재하는 것만 낸다 — 그래야 `_deprecated/`·`_scratch/` 제외 규칙이
 * 갈릴 자리가 없다.
 */
export async function v2Sidecars(): Promise<string[]> {
  const out: string[] = [];
  for (const guide of await v2Guides()) {
    const stem = basename(guide).replace(/\.md$/, "");
    for (const kind of SIDECAR_KINDS) {
      const path = join(dirname(guide), `${stem}.${kind}.ts`);
      if (await Bun.file(join(ROOT, path)).exists()) out.push(path);
    }
  }
  return out;
}
