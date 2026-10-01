/**
 * `solutions-merge.ts` — main 의 스텁 되돌림을 solutions 로 병합해도 풀이가 남는가.
 *
 * 가짜 저장소 하나에 KAN-064 의 모양을 그대로 세운다 — 풀이가 main 에 새어 든 상태에서 main 이
 * 스텁으로 되돌리고, 한 파일은 경로까지 옮긴다. 도구 없이 병합하면 풀이가 사라지는 것을 먼저
 * 보이고(시험이 가정하는 사고가 실제로 난다는 증거), 도구를 거치면 남는 것, 그다음 병합에서도
 * 남는 것을 본다.
 */

import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";
import {
  isSolutionsOnly,
  mergeKeepingSolutions,
  solutionsOnlyFiles,
} from "./solutions-merge.ts";

const roots: string[] = [];
afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

const STUB =
  'export function f(): number {\n  throw new Error("Not implemented");\n}\n';
const SOLVED = "export function f(): number {\n  return 42;\n}\n";

/** 풀이가 main 에 새어 든 뒤 main 이 되돌린 저장소. solutions 가 체크아웃된 채로 돌려준다. */
async function fixture(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), "solutions-merge-"));
  roots.push(dir);
  const git = (...a: string[]) => $`git ${a}`.cwd(dir).quiet();
  await git("init", "-q", "-b", "main");
  await git("config", "user.email", "t@t");
  await git("config", "user.name", "t");
  await Bun.write(join(dir, "a/kept.ts"), SOLVED);
  await Bun.write(join(dir, "old/moved.ts"), SOLVED);
  await Bun.write(join(dir, "b/stub.ts"), STUB);
  await git("add", "-A");
  await git("commit", "-q", "-m", "누수된 상태");
  await git("branch", "solutions");
  // main: 되돌림 + 경로 이동 + 무관한 변경
  await Bun.write(join(dir, "a/kept.ts"), STUB);
  await git("rm", "-q", "old/moved.ts");
  await Bun.write(join(dir, "new/moved.ts"), STUB);
  await Bun.write(join(dir, "c/other.ts"), "export const x = 1;\n");
  await git("add", "-A");
  await git("commit", "-q", "-m", "스텁 되돌림");
  await git("switch", "-q", "solutions");
  return dir;
}

const read = (dir: string, p: string) => Bun.file(join(dir, p)).text();

test("도구 없이 병합하면 풀이가 스텁으로 덮인다", async () => {
  const dir = await fixture();
  await $`git merge -q --no-edit main`.cwd(dir).quiet();
  expect(await read(dir, "a/kept.ts")).toBe(STUB);
  expect(await read(dir, "new/moved.ts")).toBe(STUB);
});

test("도구를 거치면 풀이가 남고, 그다음 병합에서도 남는다", async () => {
  const dir = await fixture();
  const r = await mergeKeepingSolutions(dir, "main");
  expect(r.committed).toBe(true);
  expect(r.conflicts).toEqual([]);
  expect(r.plan.restored).toEqual([
    { path: "a/kept.ts" },
    { path: "new/moved.ts", from: "old/moved.ts" },
  ]);
  expect(await read(dir, "a/kept.ts")).toBe(SOLVED);
  expect(await read(dir, "new/moved.ts")).toBe(SOLVED);
  expect(await read(dir, "b/stub.ts")).toBe(STUB);
  expect(await read(dir, "c/other.ts")).toBe("export const x = 1;\n");

  // main 이 무관한 변경을 하나 더 얹은 뒤의 평범한 병합 — 되살릴 것이 없어야 한다
  await $`git switch -q main`.cwd(dir).quiet();
  await Bun.write(join(dir, "c/other.ts"), "export const x = 2;\n");
  await $`git commit -q -am 다음`.cwd(dir).quiet();
  await $`git switch -q solutions`.cwd(dir).quiet();
  await $`git merge -q --no-edit main`.cwd(dir).quiet();
  expect(await read(dir, "a/kept.ts")).toBe(SOLVED);
  expect(await read(dir, "new/moved.ts")).toBe(SOLVED);
  expect(await read(dir, "c/other.ts")).toBe("export const x = 2;\n");
});

const REPORT = "# f 분석 보고서\n\n풀이를 그대로 인용한다.\n";

/** 분석 보고서가 main 에 새어 든 뒤 main 이 지운 저장소(KAN-065). solutions 가 체크아웃된 채로. */
async function reportFixture(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), "solutions-merge-report-"));
  roots.push(dir);
  const git = (...a: string[]) => $`git ${a}`.cwd(dir).quiet();
  await git("init", "-q", "-b", "main");
  await git("config", "user.email", "t@t");
  await git("config", "user.name", "t");
  await Bun.write(join(dir, "a/f-analysis.md"), REPORT);
  await Bun.write(join(dir, "a/f-analysis/r02-2026-10-01-bugfix.md"), REPORT);
  await Bun.write(join(dir, "a/f-guide.md"), "# 가이드\n");
  await git("add", "-A");
  await git("commit", "-q", "-m", "누수된 상태");
  await git("branch", "solutions");
  await git("rm", "-q", "-r", "a/f-analysis.md", "a/f-analysis");
  await git("rm", "-q", "a/f-guide.md");
  await git("commit", "-q", "-m", "분석 문서 걷기");
  await git("switch", "-q", "solutions");
  return dir;
}

test("solutions 전용 파일 규칙은 분석 보고서와 재검토 폴더만 잡는다", () => {
  expect(isSolutionsOnly("src/a/x/x-analysis.md")).toBe(true);
  expect(isSolutionsOnly("x-analysis.md")).toBe(true);
  expect(isSolutionsOnly("src/a/x/x-analysis/r02-2026-10-01-bugfix.md")).toBe(
    true,
  );
  expect(isSolutionsOnly("src/a/x/x-guide.md")).toBe(false);
  expect(isSolutionsOnly("docs/analysis.md")).toBe(false);
  expect(isSolutionsOnly("tools/check-analysis.ts")).toBe(false);
});

test("main 이 지운 분석 보고서는 solutions 에 남고, main 이 지운 다른 파일은 지워진다", async () => {
  const dir = await reportFixture();
  const r = await mergeKeepingSolutions(dir, "main");
  expect(r.committed).toBe(true);
  expect(r.plan.restored).toEqual([
    { path: "a/f-analysis.md" },
    { path: "a/f-analysis/r02-2026-10-01-bugfix.md" },
  ]);
  expect(await read(dir, "a/f-analysis.md")).toBe(REPORT);
  expect(await read(dir, "a/f-analysis/r02-2026-10-01-bugfix.md")).toBe(REPORT);
  expect(await Bun.file(join(dir, "a/f-guide.md")).exists()).toBe(false);
  expect(await solutionsOnlyFiles(dir)).toEqual([
    "a/f-analysis.md",
    "a/f-analysis/r02-2026-10-01-bugfix.md",
  ]);
});

test("저장소: solutions 전용 파일이 main 에 없다", async () => {
  // solutions 체크아웃에서는 이 시험이 실패하는 것이 정상이다(스텁 누수 검사와 같다).
  expect(await solutionsOnlyFiles(process.cwd())).toEqual([]);
});
