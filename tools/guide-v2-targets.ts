/**
 * v2 골격 가이드의 **대상 집합 하나**.
 *
 * `check-v2` · `check-proof` · `check-metaphor` 가 각자 글롭을 들면 세 벌이 갈리고, 갈린
 * 쪽이 조용히 덜 검사한다. 정의를 여기 하나만 둔다.
 *
 * 대상은 두 트랙의 `**\/*-guide.md` 다 — v1 은 `.mdx` 라 자동으로 빠진다.
 * `_deprecated/`(이력 사본)와 `_scratch/`(습작)는 살아 있는 코드가 참조하지 않으므로 뺀다.
 *
 * **골격이 둘이라 `kindOf` 가 함께 산다.** 대상을 내는 자리와 그것이 어느 골격인지 판정하는
 * 자리가 갈리면, 판정 쪽이 글롭을 한 벌 더 들게 된다 — 이 파일이 막으려는 바로 그 모양이다.
 *
 * **`v2Guides()` 는 `string[]` 을 그대로 낸다.** 객체 배열로 바꾸면 호출부 넷
 * (`check-v2` · `check-proof` · `check-metaphor` · `build-html`)이 한 커밋에서 같이 움직여야
 * 하고, `tools/ci.ts` GATES 가 그 넷을 전부 `--all` 로 돌린다. 갈래가 필요한 쪽만 `kindOf` 를
 * 부르면 나머지는 안 바뀐다.
 */

import { basename, dirname, join, resolve } from "node:path";
import { Glob } from "bun";
import type { GuideKind } from "./section";

export const ROOT = resolve(import.meta.dir, "..");

/** 검사에서 빼는 자리. 루트 `tsconfig.json` 의 `exclude` 와 같은 기준이다. */
const SKIP = ["_deprecated/", "_scratch/"];

/** 골격별 대상 뿌리. **글롭을 여기 말고 다른 데 적지 않는다.** */
const ROOTS: ReadonlyArray<readonly [GuideKind, string]> = [
  ["algo", "src/algorithms/**/*-guide.md"],
  ["ds", "src/data-structures/**/*-guide.md"],
];

export async function v2Guides(): Promise<string[]> {
  const out: string[] = [];
  for (const [, pattern] of ROOTS) {
    for await (const path of new Glob(pattern).scan({ cwd: ROOT })) {
      if (SKIP.some((s) => path.includes(s))) continue;
      out.push(path);
    }
  }
  return out.sort();
}

/**
 * 그 가이드가 어느 골격인가.
 *
 * **경로로 판정한다.** 본문 헤딩으로 알아내려면 파일을 읽어야 하는데, 그 헤딩을 해석하는
 * 것이 바로 골격에 달린 일이라 순환이다. 트랙 디렉터리가 골격을 정한다는 것은 이 저장소의
 * 사실이고(`CLAUDE.md` 의 트랙 표), 그것이 바뀌면 이 함수도 함께 바뀐다.
 *
 * 대상 밖 경로에는 **던진다.** `"algo"` 로 넘기면 자료구조 편이 알고리즘 매핑으로 파싱돼
 * 헤딩 전부가 미해소로 떨어지고, 그 실패는 원인에서 멀리 떨어진 자리에서 드러난다.
 */
export function kindOf(path: string): GuideKind {
  // 절대 경로로도 불린다(`build-html --all` 이 그렇다). 뿌리를 **포함**으로 본다.
  const hit = ROOTS.find(([, pattern]) =>
    path.includes(pattern.slice(0, pattern.indexOf("**"))),
  );
  if (!hit) throw new Error(`v2 대상이 아닌 경로다: ${path}`);
  return hit[0];
}

/**
 * 두 트랙 밖 경로를 받는 자리를 위한 관대한 갈래.
 *
 * 빌더는 `tools/_fixtures/` 의 스모크 표본을, 판정기 시험은 `tools/_scratch/` 의 임시
 * 파일을 렌더·판정한다 — 둘 다 트랙 어디에도 없다.
 *
 * **폴백이 자료구조 편을 삼키지 않는다.** `kindOf` 는 트랙 안 경로를 확실히 잡으므로,
 * 폴백이 발동하는 것은 두 트랙 **밖**일 때뿐이다. 그 자리의 표본은 algo 골격으로 쓰여
 * 있고, ds 표본을 들일 때는 부르는 쪽이 갈래를 명시한다.
 */
export function kindOfOr(path: string, fallback: GuideKind): GuideKind {
  try {
    return kindOf(path);
  } catch {
    return fallback;
  }
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
    "sandbox/ds-guide-v2/SPEC.md",
  ];
  const partials: string[] = [];
  for (const [, pattern] of ROOTS) {
    const partialPattern = pattern.replace("-guide.md", "-guide.partial.md");
    for await (const path of new Glob(partialPattern).scan({ cwd: ROOT })) {
      if (SKIP.some((s) => path.includes(s))) continue;
      partials.push(path);
    }
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
 * v2 가이드의 **옆자리** 사이드카 전부. 글롭을 새로 적지 않고 `v2Guides()` 목록에서
 * 이름을 만들어 실재하는 것만 낸다 — 그래야 `_deprecated/`·`_scratch/` 제외 규칙이
 * 갈릴 자리가 없다.
 *
 * **자료구조 편에는 `.ref.ts` 가 없다.** 정본이 `_reference/<이름>.ts` 이고 그것이 이미 서
 * 있어서, 사이드카로 한 벌 더 두면 정본이 둘이 된다(`ds SPEC` `L43`). 실재하는 것만 내는
 * 방식이라 목록에서 저절로 빠지고, `SIDECAR_KINDS` 를 골격별로 가를 이유가 없다.
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
