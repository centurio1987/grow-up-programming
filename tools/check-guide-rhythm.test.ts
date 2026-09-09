/**
 * `tools/check-guide-rhythm.ts` 의 대상 집합 자기시험.
 *
 * 이 시험이 있는 이유는 **대상이 0 이 된 스캐너가 통과 표시를 계속 낸다**는 것이었다
 * (`KAN-034.8` `S9`). 알고리즘 트랙 111편이 v2 골격으로 넘어가면서 이 스캐너의 글롭
 * (`src/**\/*-guide.mdx`)에 걸리는 알고리즘 편이 0 이 됐는데, 출력은 그대로
 * 「래칫 baseline 69편 남음 (재집필 부채)」였다. 다음 사람이 그 수를 저장소 전체의 부채로
 * 읽는다 — 실제로는 자료구조 트랙 몫이다.
 *
 * 그래서 재는 것은 셋이다.
 *
 *   ① 이 스캐너가 알고리즘 편을 **하나도 안 본다** — 그 트랙에 `.mdx` 가 없다
 *   ② baseline 에 `src/algorithms` 행이 **하나도 없다**
 *   ③ 요약 줄이 **어느 트랙의 부채인지 말한다**
 *
 * ①②는 웨이브가 되돌아가는 것을 막고, ③은 그 사실이 화면에 남는 것을 막는다.
 * **`check-guide-rhythm.ts` 자체를 지우지 않는다** — 자료구조 트랙이 아직 쓴다.
 */

import { expect, test } from "bun:test";
import { resolve } from "node:path";
import { Glob } from "bun";

const root = resolve(import.meta.dir, "..");

test("알고리즘 트랙에는 이 스캐너가 볼 .mdx 가 없다", async () => {
  const seen: string[] = [];
  for await (const p of new Glob("src/algorithms/**/*-guide.mdx").scan(root)) {
    if (p.includes("_deprecated")) continue;
    seen.push(p);
  }
  expect(seen).toEqual([]);
});

test("baseline 에 src/algorithms 행이 없다", async () => {
  const text = await Bun.file(
    resolve(root, "tools/_baseline/guide-rhythm.tsv"),
  ).text();
  const rows = text
    .split("\n")
    .filter((l) => l.length > 0 && !l.startsWith("#"));
  expect(rows.filter((l) => l.startsWith("src/algorithms"))).toEqual([]);
  // 자료구조 트랙은 아직 부채가 있다 — 0 이 되면 그때 ORD-006 이 이 스캐너를 닫는다.
  expect(rows.length).toBeGreaterThan(0);
});

test("요약 줄이 어느 트랙의 부채인지 말한다", async () => {
  const run = Bun.spawn(["bun", "run", "tools/check-guide-rhythm.ts"], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out] = await Promise.all([
    new Response(run.stdout).text(),
    run.exited,
  ]);
  const line = out.split("\n").find((l) => l.startsWith("래칫 baseline "));
  expect(line).toBeDefined();
  // 트랙 이름이 그 줄에 있어야 한다. 없으면 그 수가 무엇의 부채인지 화면이 안 말한다.
  expect(line).toContain("data-structures");
  expect(line).not.toContain("src/algorithms");
});
