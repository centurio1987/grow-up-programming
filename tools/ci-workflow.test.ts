/**
 * `tools/ci.ts` 의 모드가 GitHub 워크플로에서 하나도 빠짐없이 불리는지 검사한다.
 *
 * 워크플로는 `all` 이 아니라 모드를 낱개로 부른다(모드마다 판정 여부가 달라서다). 그래서
 * `ci.ts` 에 모드를 새로 가르면 워크플로에도 단계를 더해야 하는데, 안 더해도 아무것도
 * 실패하지 않는다 — 로컬 `all` 은 새 모드를 돌고 CI 는 조용히 건너뛴다. KAN-026 `S24` 가
 * `trials` 를 `self` 에서 갈랐을 때 실제로 그렇게 빠졌다.
 *
 * `ci.ts` 는 불러오는 순간 모드를 실행하므로 import 하지 않고 소스의 `MODES` 표를 읽는다.
 */

import { expect, test } from "bun:test";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");

async function modesInCi(): Promise<string[]> {
  const source = await Bun.file(resolve(root, "tools/ci.ts")).text();
  const table = source.match(/const MODES[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (table === null) throw new Error("tools/ci.ts 에서 MODES 표를 찾지 못했다");
  const body = table[1] ?? "";
  return [...body.matchAll(/^\s*([a-z]+):/gm)]
    .map((match) => match[1] ?? "")
    .filter((name) => name !== "" && name !== "all");
}

test("ci.ts 의 모드(all 제외)는 전부 워크플로가 부른다", async () => {
  const modes = await modesInCi();
  expect(modes.length).toBeGreaterThan(0);
  const workflow = await Bun.file(
    resolve(root, ".github/workflows/ci.yml"),
  ).text();
  const called = new Set(
    [...workflow.matchAll(/bun run tools\/ci\.ts ([a-z]+)(?![\w-])/g)].map(
      (match) => match[1],
    ),
  );
  const missing = modes.filter((mode) => !called.has(mode));
  expect(missing).toEqual([]);
});
