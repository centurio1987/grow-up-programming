/**
 * 가이드 본문 코드를 `_reference/` 정본에서 추출하고, 추출본과 가이드가 어긋나지 않는지 본다.
 *
 * 가이드가 코드를 복제하면 그 코드는 아무도 검사하지 않는다(불변 사실 11). 진단된 A급 결함이
 * 그 형태였다 — 가이드에 실린 코드와 실제로 도는 코드가 다른 복잡도를 주장했다. 그래서 가이드는
 * 코드를 **적지 않고 가리킨다.** 정본에 구간을 표시하고, 그 구간만 가이드로 옮긴다.
 *
 * 규격의 정본은 `docs/ORD-006-conventions.md` §규약3 이다.
 *
 * ```bash
 * bun run tools/guide-core.ts extract <정본.ts> [구간이름]   # 추출본을 stdout 으로
 * bun run tools/guide-core.ts check                          # 구간·펜스·구문·시뮬 전수 검사
 * ```
 *
 * `check` 가 시뮬레이션 호출까지 보는 이유는 그것도 **아무도 검사하지 않는 본문**이기
 * 때문이다. MDX 는 빌드 시점에 렌더되지 않으므로 `<AlgorithmSimulation>` 에 `view` 를
 * 빠뜨려도 조용히 커밋된다. B7 이 실제로 하나 빠뜨렸고, B8 에서 전수 검색으로 찾았다.
 */

import { mkdtempSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");

/** `// #region guide:core` 또는 `// #region guide:core/<이름>`. */
const REGION_START =
  /^\s*\/\/\s*#region\s+guide:core(?:\/([A-Za-z0-9_-]+))?\s*$/;
const REGION_END = /^\s*\/\/\s*#endregion\b/;

/** 가이드가 추출본을 싣는 자리. ` ```ts guide-core=<경로>[#<구간이름>] ` */
const FENCE_OPEN = /^```ts\s+guide-core=(\S+?)(?:#([A-Za-z0-9_-]+))?\s*$/;

export interface Region {
  /** 이름 없는 구간은 `""`. 한 파일에 여럿 있으면 등장 순서로 이어 붙인다. */
  name: string;
  /** 마커 줄을 뺀 본문. */
  lines: string[];
  /** 여는 마커의 1-기준 줄 번호. 오류 보고용. */
  at: number;
}

export class GuideCoreError extends Error {}

/**
 * 구간을 잘라 낸다. 중첩과 미종료는 오류다 — 구간 경계가 모호하면 무엇이 가이드에 실릴지
 * 사람이 읽어서 판정하게 되고, 그러면 규격이 규격이 아니다.
 */
export function parseRegions(source: string, where: string): Region[] {
  const lines = source.split("\n");
  const regions: Region[] = [];
  let open: Region | null = null;

  for (const [index, line] of lines.entries()) {
    const start = REGION_START.exec(line);
    if (start !== null) {
      if (open !== null) {
        throw new GuideCoreError(
          `${where}:${index + 1} — guide:core 구간이 중첩됐다(${open.at} 줄이 아직 안 닫혔다)`,
        );
      }
      open = { name: start[1] ?? "", lines: [], at: index + 1 };
      continue;
    }
    if (REGION_END.test(line)) {
      if (open === null) continue; // guide:core 와 무관한 #endregion 은 지나친다
      regions.push(open);
      open = null;
      continue;
    }
    if (open !== null) open.lines.push(line);
  }

  if (open !== null) {
    throw new GuideCoreError(
      `${where}:${open.at} — guide:core 구간이 닫히지 않았다`,
    );
  }

  const names = regions.map((region) => region.name);
  const duplicated = names.filter(
    (name, index) => name !== "" && names.indexOf(name) !== index,
  );
  if (duplicated.length > 0) {
    throw new GuideCoreError(
      `${where} — 구간 이름이 겹친다: ${[...new Set(duplicated)].join(", ")}`,
    );
  }
  return regions;
}

function isCommentLine(line: string): boolean {
  const text = line.trim();
  return (
    text.startsWith("//") ||
    text.startsWith("/*") ||
    text.startsWith("*") ||
    text.endsWith("*/")
  );
}

/**
 * 계측을 걷어낸다. `__cost` 는 계약이 아니라 정본의 의무이므로(§규약2) 독자가 볼 자리가 없다.
 *
 * 지우는 것은 `__cost` 가 나오는 줄과 **그 줄에 바로 붙은 위쪽 주석**이다. 주석까지 지우는
 * 이유는 계측 필드의 설명이 필드보다 먼저 오기 때문이다 — 줄만 지우면 설명만 남는다.
 */
export function stripInstrumentation(lines: string[]): string[] {
  const drop = new Set<number>();
  for (const [index, line] of lines.entries()) {
    if (!line.includes("__cost")) continue;
    drop.add(index);
    for (let back = index - 1; back >= 0; back--) {
      const previous = lines[back];
      if (previous === undefined || !isCommentLine(previous)) break;
      drop.add(back);
    }
  }
  return lines.filter((_, index) => !drop.has(index));
}

/** 구간의 공통 들여쓰기를 벗긴다. 클래스 안의 구간을 잘라도 왼쪽이 맞는다. */
export function dedent(lines: string[]): string[] {
  let common = Number.POSITIVE_INFINITY;
  for (const line of lines) {
    if (line.trim() === "") continue;
    const indent = line.length - line.trimStart().length;
    if (indent < common) common = indent;
  }
  if (!Number.isFinite(common) || common === 0) return lines;
  return lines.map((line) => (line.trim() === "" ? line : line.slice(common)));
}

/** 빈 줄이 둘 이상 이어지면 하나로 줄이고, 앞뒤 빈 줄을 없앤다. */
function tidy(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    if (line.trim() === "" && out[out.length - 1]?.trim() === "") continue;
    out.push(line);
  }
  while (out.length > 0 && out[0]?.trim() === "") out.shift();
  while (out.length > 0 && out[out.length - 1]?.trim() === "") out.pop();
  return out;
}

/**
 * 추출. 이름을 주면 그 구간만, 안 주면 파일의 전 구간을 등장 순서로 이어 붙인다.
 *
 * 순서가 등장 순서인 것도 규격이다. 가이드가 순서를 고르면 정본과 다른 이야기를 쓸 수 있고,
 * 그러면 추출이 복제와 다를 것이 없어진다.
 */
export function extract(source: string, where: string, name?: string): string {
  const regions = parseRegions(source, where);
  if (regions.length === 0) {
    throw new GuideCoreError(`${where} — guide:core 구간이 없다`);
  }

  const picked =
    name === undefined
      ? regions
      : regions.filter((region) => region.name === name);
  if (picked.length === 0) {
    throw new GuideCoreError(`${where} — \`${name}\` 구간이 없다`);
  }

  const chunks = picked.map((region) =>
    tidy(dedent(stripInstrumentation(region.lines))).join("\n"),
  );
  return chunks.filter((chunk) => chunk !== "").join("\n\n");
}

// ─── CLI ────────────────────────────────────────────────────────────────────

const SCAN_ROOTS = ["src/data-structures", "src/algorithms"];

async function collect(
  relativeDir: string,
  keep: (name: string) => boolean,
): Promise<string[]> {
  const entries = await readdir(join(root, relativeDir), {
    withFileTypes: true,
  }).catch(() => []);
  const found: string[] = [];
  for (const entry of entries) {
    const child = join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === "_deprecated" ||
        entry.name === "_scratch"
      ) {
        continue;
      }
      found.push(...(await collect(child, keep)));
    } else if (keep(entry.name)) {
      found.push(child);
    }
  }
  return found;
}

interface Fence {
  guide: string;
  at: number;
  target: string;
  name?: string;
  body: string;
}

/** 가이드에서 `guide-core` 펜스를 걷어 온다. */
export function parseFences(source: string, guide: string): Fence[] {
  const lines = source.split("\n");
  const fences: Fence[] = [];
  for (const [index, line] of lines.entries()) {
    const open = FENCE_OPEN.exec(line ?? "");
    if (open === null) continue;
    const target = open[1];
    if (target === undefined) continue;

    const body: string[] = [];
    let closed = false;
    for (let cursor = index + 1; cursor < lines.length; cursor++) {
      const next = lines[cursor];
      if (next === undefined) break;
      if (next.trimEnd() === "```") {
        closed = true;
        break;
      }
      body.push(next);
    }
    if (!closed) {
      throw new GuideCoreError(`${guide}:${index + 1} — 펜스가 닫히지 않았다`);
    }
    fences.push({
      guide,
      at: index + 1,
      target,
      name: open[2],
      body: body.join("\n"),
    });
  }
  return fences;
}

export interface SimCall {
  /** 1부터 세는 줄 번호. */
  at: number;
  /** 한 줄로 눕힌 호출문. 보고에 그대로 싣는다. */
  text: string;
  hasView: boolean;
}

/**
 * 가이드 본문의 `<AlgorithmSimulation>` 호출을 훑는다.
 *
 * `view` 는 어느 패널로 그릴지 고르는 값이고 **기본값이 없다.** 빠뜨리면 렌더 시점에
 * 시뮬레이션이 통째로 죽는데, MDX 는 빌드 때 렌더되지 않으므로 조용히 커밋된다.
 */
export function parseSimCalls(source: string): SimCall[] {
  const calls: SimCall[] = [];
  for (const match of source.matchAll(/<AlgorithmSimulation\b[\s\S]*?\/>/g)) {
    calls.push({
      at: source.slice(0, match.index).split("\n").length,
      text: match[0]
        .split("\n")
        .map((line) => line.trim())
        .join(" "),
      hasView: /\bview\s*=/.test(match[0]),
    });
  }
  return calls;
}

async function main(): Promise<void> {
  const [command, ...rest] = Bun.argv.slice(2);

  if (command === "extract") {
    const [target, name] = rest;
    if (target === undefined) {
      console.error(
        "용법: bun run tools/guide-core.ts extract <정본.ts> [구간이름]",
      );
      process.exit(2);
    }
    const source = await Bun.file(join(root, target)).text();
    console.log(extract(source, target, name));
    return;
  }

  if (command !== "check") {
    console.error("용법: bun run tools/guide-core.ts <extract|check> ...");
    process.exit(2);
  }

  const problems: string[] = [];

  const references: string[] = [];
  for (const scanRoot of SCAN_ROOTS) {
    references.push(
      ...(await collect(scanRoot, (name) => name.endsWith(".ts"))),
    );
  }
  const marked = new Map<string, string>();
  for (const file of references.filter((path) =>
    path.includes("/_reference/"),
  )) {
    const source = await Bun.file(join(root, file)).text();
    try {
      const regions = parseRegions(source, file);
      if (regions.length === 0) {
        problems.push(`${file} — 정본에 guide:core 구간이 없다`);
        continue;
      }
      marked.set(file, extract(source, file));
    } catch (error) {
      problems.push(
        error instanceof GuideCoreError ? error.message : String(error),
      );
    }
  }

  let fenceCount = 0;
  let simCount = 0;
  const guides: string[] = [];
  for (const scanRoot of SCAN_ROOTS) {
    guides.push(
      ...(await collect(scanRoot, (name) => name.endsWith("-guide.mdx"))),
    );
  }
  for (const guide of guides) {
    const source = await Bun.file(join(root, guide)).text();

    for (const call of parseSimCalls(source)) {
      simCount++;
      if (call.hasView) continue;
      problems.push(
        `${guide}:${call.at} — <AlgorithmSimulation> 에 view prop 이 없다: ${call.text}. ` +
          "뷰를 못 고르면 렌더 시점에 시뮬레이션이 통째로 죽는다",
      );
    }

    let fences: Fence[];
    try {
      fences = parseFences(source, guide);
    } catch (error) {
      problems.push(
        error instanceof GuideCoreError ? error.message : String(error),
      );
      continue;
    }
    for (const fence of fences) {
      fenceCount++;
      const file = Bun.file(join(root, fence.target));
      if (!(await file.exists())) {
        problems.push(
          `${guide}:${fence.at} — 가리키는 정본이 없다: ${fence.target}`,
        );
        continue;
      }
      try {
        const expected = extract(await file.text(), fence.target, fence.name);
        if (expected.trimEnd() !== fence.body.trimEnd()) {
          problems.push(
            `${guide}:${fence.at} — 본문이 ${fence.target} 추출본과 다르다`,
          );
        }
      } catch (error) {
        problems.push(
          `${guide}:${fence.at} — ${error instanceof GuideCoreError ? error.message : String(error)}`,
        );
      }
    }
  }

  // 추출본은 그 자체로 타입 검사를 통과해야 한다. 구간이 타입 선언을 빠뜨리면 여기서 걸린다.
  if (marked.size > 0) {
    const dir = mkdtempSync(join(tmpdir(), "guide-core-"));
    const written: string[] = [];
    for (const [file, code] of marked) {
      const flat = join(dir, file.replaceAll("/", "__"));
      await Bun.write(flat, `${code}\n`);
      written.push(flat);
    }
    const tsc = Bun.spawnSync([
      "bunx",
      "tsc",
      "--noEmit",
      "--strict",
      "--target",
      "esnext",
      "--module",
      "esnext",
      "--moduleResolution",
      "bundler",
      "--noUncheckedIndexedAccess",
      // 앰비언트 타입을 끌어오지 않는다. 추출본은 그 자체로 닫혀 있어야 한다.
      "--typeRoots",
      dir,
      ...written,
    ]);
    if (tsc.exitCode !== 0) {
      problems.push(
        `추출본이 타입 검사를 통과하지 못한다:\n${new TextDecoder().decode(tsc.stdout)}`,
      );
    }
  }

  if (problems.length > 0) {
    console.error(`guide:core 검사에서 ${problems.length}건이 어긋난다.\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  console.log(
    `정본 ${marked.size}개의 guide:core 구간이 타입 검사를 통과하고, ` +
      `가이드 펜스 ${fenceCount}건이 추출본과 일치한다. ` +
      `시뮬레이션 호출 ${simCount}건에 view 가 붙어 있다.`,
  );
}

if (import.meta.main) await main();
