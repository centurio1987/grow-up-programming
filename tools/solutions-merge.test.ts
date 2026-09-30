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
import { mergeKeepingSolutions } from "./solutions-merge.ts";

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
