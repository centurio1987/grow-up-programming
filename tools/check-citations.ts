/**
 * 문서·코드에 적힌 `경로:줄번호` 인용이 실제로 가리키는 곳이 있는지 검사한다.
 *
 * 이 도구가 있는 이유는 같은 결함이 두 배치 연속으로 났기 때문이다. B2 가 인용 오류 2건을
 * 잡고 "전수 검색했다"고 적었는데, 그 검색이 **전체 경로 형태만** 봤다. 파일 이름 없이
 * `` `:82` `` 로 적힌 상대 인용은 패턴에 걸리지 않아 런북에 그대로 남았고 B3 에서 다시 나왔다.
 * 사람이 도는 검색은 패턴을 빠뜨리고, 빠뜨린 것을 본인이 알 수 없다.
 *
 * **검사 대상은 경로에 `/` 가 들어간 인용뿐이다.** 그것이 "따라가라고 적은 인용"의 집합이다.
 * `multiset.ts:25` 처럼 파일 이름만 있는 인용은 대개 지워진 파일의 옛 상태를 가리키는
 * 기록이므로(§규약1 의 표류 사례) 해석하지 않는다. 상대 인용을 쓰지 않는 것이 규칙이고,
 * 이 도구는 그 규칙을 지킨 인용만 검증한다.
 *
 * 실행: `bun run tools/check-citations.ts`
 */

import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");

/**
 * 인용을 찾아 볼 파일들.
 *
 * **B11 에서 둘을 넓혔다.** 그전에는 재집필한 구조를 한 줄씩 손으로 등록하는 목록이었고
 * `.mdx` 가 확장자에 없었다. 둘 다 조용한 구멍이다 — 등록을 빠뜨린 구조와 가이드 전부가
 * 검사 밖이었고, B7~B9 산출물 셋이 실제로 그 밖에 있었다. 목록을 `src/data-structures`
 * 하나로 바꾸면 재집필이 늘 때 아무도 손댈 것이 없다.
 */
const SCAN_GLOBS = ["docs", "tools", "src/data-structures"];

const SCAN_EXTENSIONS = [".md", ".mdx", ".ts"];

/** 경로에 `/` 가 있는 인용만 잡는다. 앞의 문자 클래스가 백틱·괄호·공백을 끊어 준다. */
const CITATION =
  /([A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+\.(?:md|mdx|ts|tsx|json|tsv)):(\d+)(?:-(\d+))?/g;

interface Problem {
  where: string;
  citation: string;
  detail: string;
}

async function collectFiles(relativeDir: string): Promise<string[]> {
  const absolute = join(root, relativeDir);
  const entries = await readdir(absolute, { withFileTypes: true }).catch(
    () => [],
  );
  const found: string[] = [];
  for (const entry of entries) {
    const child = join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      found.push(...(await collectFiles(child)));
    } else if (SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      found.push(child);
    }
  }
  return found;
}

const lineCache = new Map<string, string[] | null>();

async function linesOf(relativePath: string): Promise<string[] | null> {
  const cached = lineCache.get(relativePath);
  if (cached !== undefined) return cached;
  const file = Bun.file(join(root, relativePath));
  const value = (await file.exists()) ? (await file.text()).split("\n") : null;
  lineCache.set(relativePath, value);
  return value;
}

const problems: Problem[] = [];
let checked = 0;

const files: string[] = [];
for (const glob of SCAN_GLOBS) files.push(...(await collectFiles(glob)));

for (const file of files) {
  const text = await Bun.file(join(root, file)).text();
  const sourceLines = text.split("\n");

  for (const [index, line] of sourceLines.entries()) {
    CITATION.lastIndex = 0;
    for (const match of line.matchAll(CITATION)) {
      const [citation, target, startText, endText] = match;
      if (target === undefined || startText === undefined) continue;

      const where = `${file}:${index + 1}`;
      checked++;

      const targetLines = await linesOf(target);
      if (targetLines === null) {
        problems.push({ where, citation, detail: "가리키는 파일이 없다" });
        continue;
      }

      const start = Number(startText);
      const end = endText === undefined ? start : Number(endText);
      const total = targetLines.length;

      if (start < 1 || start > total || end > total) {
        problems.push({
          where,
          citation,
          detail: `${target} 는 ${total} 줄인데 ${start}${endText ? `-${end}` : ""} 을 가리킨다`,
        });
        continue;
      }
      if ((targetLines[start - 1] ?? "").trim() === "") {
        problems.push({
          where,
          citation,
          detail: `${target}:${start} 이 빈 줄이다`,
        });
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`인용 ${checked}건 중 ${problems.length}건이 어긋난다.\n`);
  for (const problem of problems) {
    console.error(`  ${problem.where}`);
    console.error(`    인용: ${problem.citation}`);
    console.error(`    문제: ${problem.detail}`);
  }
  console.error(
    "\n줄 번호가 바뀐 것이면 인용을 고치고, 가리킬 곳이 없어진 것이면 인용을 지운다.",
  );
  process.exit(1);
}

console.log(`인용 ${checked}건 전부 실재하는 비어 있지 않은 줄을 가리킨다.`);
