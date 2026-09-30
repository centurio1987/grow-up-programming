/**
 * 실습 스텁 테스트를 **정본에 물려** 돌린다 — 맞게 풀어도 시험이 실패하는 자리를 잡는다.
 *
 * 스텁 테스트(`<name>.test.ts`)는 학습자 스텁을 부르므로 그대로는 `Not implemented` 로
 * 떨어진다. 그래서 기대값이 틀려도 아무도 모른다 — 풀어 본 사람만 안다(KAN-058 전개 중
 * 모은 목록의 3-1 이 그렇게 모였다). 여기서는 테스트를 임시 폴더로 옮겨 `./<stub>` import 를
 * 같은 폴더의 `<name>-guide.ref.ts` 로 돌린 뒤 `bun test` 로 돌린다. 정본은 원고의 전체 코드와
 * 같다고 P16 이 대조하므로, 여기서 떨어지는 시험은 테스트 쪽 결함이거나 정본 결함이다.
 *
 * 실행: `bun run tools/practice-ref.ts` (실패 목록을 내고 실패가 있으면 exit 1).
 * 집행: `tools/practice-ref.test.ts` 가 `ci.ts` 의 `bun test tools` 단계에서 돈다.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** import 한 스텁 이름이 정본 export 와 다른데 계약이 같은 것. 스텁 테스트 경로 → 정본 export. */
export const ALIASES: Record<string, Record<string, string>> = {
  "src/algorithms/etc/numberOfDisintersection/numberOfDisintersection.test.ts":
    { solution: "countIntersectingDiscs" },
  "src/algorithms/array/kadane/maxSubarraySum.test.ts": {
    maxSubarraySum: "kadane",
  },
  "src/algorithms/array/bestTimeToBuyAndSellStock/maxProfit.test.ts": {
    maxProfit: "bestTimeToBuyAndSellStock",
  },
};

/** 정본이 없는 부속 문제. 한 폴더에 문제가 둘 이상인 편에서 가이드가 다루지 않는 쪽이다. */
export const NO_REFERENCE: Record<string, string> = {
  "src/algorithms/array/prefixSumRangeQuery/genomicRangeQuery.test.ts":
    "부속 문제 — 정본은 prefixSumRangeQuery 하나만 싣는다",
  "src/algorithms/array/prefixSumRangeQuery/tapeEquilibrium.test.ts":
    "부속 문제 — 정본은 prefixSumRangeQuery 하나만 싣는다",
};

export interface Failure {
  file: string;
  test: string;
}

export interface Result {
  files: number;
  tests: number;
  failures: Failure[];
  /** 불러오기에서 죽어 시험이 하나도 안 돈 파일. */
  loadErrors: string[];
  skipped: { file: string; reason: string }[];
}

/** 스텁 테스트 경로 목록(가이드 시험과 `_` 폴더는 뺀다). */
export function stubTests(root: string): string[] {
  return [
    ...new Bun.Glob("src/algorithms/**/*.test.ts").scanSync({ cwd: root }),
  ]
    .filter((t) => !t.includes("-guide.") && !t.includes("/_"))
    .sort();
}

/** 테스트 본문의 `./<stub>` import 를 정본 쪽으로 돌린다. 쓸 shim 이 있으면 함께 낸다. */
export function rewrite(
  root: string,
  file: string,
  src: string,
): { src: string; shim?: string } {
  const dir = file.slice(0, file.lastIndexOf("/"));
  const name = dir.slice(dir.lastIndexOf("/") + 1);
  const ref = join(root, dir, `${name}-guide.ref`);
  const alias = ALIASES[file];
  let shim: string | undefined;
  const out = src.replace(/from\s+"\.\/([^"]+)"/g, (_m, p: string) => {
    const base = p.replace(/\.ts$/, "");
    if (base.endsWith("-guide.ref")) return `from "${join(root, dir, base)}"`;
    if (alias) {
      shim = Object.entries(alias)
        .map(([as, from]) => `export { ${from} as ${as} } from "${ref}";`)
        .join("\n");
      return `from "./__shim"`;
    }
    return `from "${ref}"`;
  });
  return { src: out, shim };
}

/** junit 속성값의 엔티티를 푼다(시험 이름을 사람이 읽게). */
function decodeAttr(s: string): string {
  return s
    .replaceAll("&amp;gt;", ">")
    .replaceAll("&amp;lt;", "<")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

/** `files` 만 돌린다(생략하면 전부). 임시 폴더는 끝나면 지운다. */
export async function run(root: string, files?: string[]): Promise<Result> {
  const work = mkdtempSync(join(tmpdir(), "practice-ref-"));
  try {
    const skipped: Result["skipped"] = [];
    const mirrored = new Map<string, string>();
    for (const file of files ?? stubTests(root)) {
      const why = NO_REFERENCE[file];
      if (why) {
        skipped.push({ file, reason: why });
        continue;
      }
      const dir = file.slice(0, file.lastIndexOf("/"));
      const name = dir.slice(dir.lastIndexOf("/") + 1);
      if (!(await Bun.file(join(root, dir, `${name}-guide.ref.ts`)).exists())) {
        skipped.push({ file, reason: "정본(-guide.ref.ts) 없음" });
        continue;
      }
      const r = rewrite(root, file, await Bun.file(join(root, file)).text());
      const key = file.replaceAll("/", "__").replace(/\.test\.ts$/, "");
      await Bun.write(join(work, key, "t.test.ts"), r.src);
      if (r.shim) await Bun.write(join(work, key, "__shim.ts"), r.shim);
      mirrored.set(`${key}/t.test.ts`, file);
    }
    const xml = join(work, "report.xml");
    const proc = Bun.spawnSync(
      [
        "bun",
        "test",
        "--timeout",
        "20000",
        "--reporter=junit",
        `--reporter-outfile=${xml}`,
        work,
      ],
      { cwd: work, stdout: "pipe", stderr: "pipe" },
    );
    const report = (await Bun.file(xml).exists())
      ? await Bun.file(xml).text()
      : "";
    const seen = new Set<string>();
    const failures: Failure[] = [];
    let tests = 0;
    const caseRe =
      /<testcase name="([^"]*)"[^>]*?file="([^"]*)"[^>]*?(\/>|>([\s\S]*?)<\/testcase>)/g;
    for (const m of report.matchAll(caseRe)) {
      const file = mirrored.get(m[2] as string) ?? (m[2] as string);
      seen.add(file);
      tests++;
      if ((m[4] ?? "").includes("<failure"))
        failures.push({ file, test: decodeAttr(m[1] as string) });
    }
    const loadErrors = [...mirrored.values()].filter((f) => !seen.has(f));
    if (report === "" && proc.exitCode !== 0)
      loadErrors.push(
        `(bun test 실행 실패: ${proc.stderr.toString().slice(0, 400)})`,
      );
    return { files: mirrored.size, tests, failures, loadErrors, skipped };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  const root = process.cwd();
  const r = await run(root);
  console.log(
    `파일 ${r.files} · 시험 ${r.tests} · 실패 ${r.failures.length} · 불러오기 실패 ${r.loadErrors.length} · 건너뜀 ${r.skipped.length}`,
  );
  for (const f of r.failures) console.log(`실패  ${f.file} — ${f.test}`);
  for (const f of r.loadErrors) console.log(`불러오기 실패  ${f}`);
  for (const s of r.skipped) console.log(`건너뜀  ${s.file} — ${s.reason}`);
  if (r.failures.length + r.loadErrors.length > 0) process.exit(1);
}
