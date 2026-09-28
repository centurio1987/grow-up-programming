import { expect, test } from "bun:test";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { ROOT } from "./guide-v2-targets";
import { figDirOf, renderGuideFigs } from "./render-figs";

const PILOT = join(
  ROOT,
  "src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.md",
);

test("파일럿의 커밋된 SVG 가 사이드카·정본·토큰과 바이트까지 같다", async () => {
  expect(await renderGuideFigs(PILOT, true)).toEqual([]);
});

test("FIGS 에 없는 SVG 가 남으면 잡는다", async () => {
  const stale = join(figDirOf(PILOT), "zz-stale.svg");
  await Bun.write(stale, "<svg/>");
  try {
    const problems = await renderGuideFigs(PILOT, true);
    expect(problems.map((p) => p.id)).toEqual(["zz-stale"]);
  } finally {
    await rm(stale);
  }
});
