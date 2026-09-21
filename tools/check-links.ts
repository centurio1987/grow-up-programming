/**
 * 문서 링크가 실재하는 파일을 가리키는지 보고, 파일을 지우거나 옮기기 전에 참조를 훑는다.
 *
 * ORD-006 은 `<name>-problem.md` 69종을 지우고 `hash/multiset` 을 `tree/` 로 옮겼다(B11).
 * 둘 다 링크를 조용히 깨뜨리는 작업이다 — 인덱스(`문제_가이드_목록.md`)·매니페스트
 * (`tools/ord004-manifest.json`)·스킬 문서가 각각 경로를 문자열로 들고 있기 때문이다.
 * 손으로 grep 하면 패턴을 빠뜨리고, 빠뜨린 것을 본인이 알 수 없다(인용 검사기와 같은 사유).
 *
 * ```bash
 * bun run tools/check-links.ts check              # 전 문서의 링크가 실재하는가
 * bun run tools/check-links.ts refs <경로|디렉터리>  # 이 경로를 가리키는 곳을 전부 찾는다
 * ```
 *
 * **리다이렉트 인프라는 만들지 않는다**(KAN-015). 외부 소비자가 없고 git 이력이 남으므로,
 * 지운 문서의 자리는 migration note 로 충분하다.
 */

import { readdir } from "node:fs/promises";
import { dirname, join, normalize, relative, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");

/** 링크를 걷어 볼 문서. 코드 안의 경로 문자열은 `refs` 가 따로 훑는다. */
const DOC_EXTENSIONS = [".md", ".mdx"];

/** `refs` 가 훑는 범위. 경로를 문자열로 들고 있을 수 있는 전부다. */
const REF_EXTENSIONS = [
  ".md",
  ".mdx",
  ".ts",
  ".tsx",
  ".json",
  ".sh",
  ".mjs",
  ".yml",
  ".yaml",
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "target",
  "_deprecated",
  "_scratch",
]);

/**
 * `verdicts/` 는 이해 시험의 **모델 응답 원문**이다. 모델이 본문의 마크다운 링크를 그대로
 * 인용하면 그 상대 경로가 `verdicts/` 기준으로 풀려 거의 확실히 깨진다 — 판정 근거일 뿐
 * 저장소의 문서가 아니므로 `check` 와 `refs` 양쪽에서 뺀다.
 *
 * **`SKIP_DIRS` 에 `sandbox` 를 넣지 않는 이유.** `walk` 를 `check` 와 `refs` 가 공유하므로
 * 통째로 빼면 둘이 함께 눈이 먼다. `SPEC.md`·`README.md` 의 링크는 검사해야 하고,
 * `refs` 는 `pilot/*.sim.ts`·`viz/` 를 봐야 한다 — 그쪽이 `#guide-sim` 의 최신 소비자다.
 * 스윕이 "이게 전부"라고 보고한 뒤 타입 검사가 잡는 것은 스윕이 제 일을 못 한 것이다(위 주석).
 */
const VERDICTS_PREFIX = "sandbox/algo-guide-v2/verdicts/";
const outsideVerdicts = (path: string): boolean =>
  !path.startsWith(VERDICTS_PREFIX);

/** `[본문](경로)` 의 경로. 각괄호 안의 중첩은 다루지 않는다 — 이 저장소에 없다. */
const MD_LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

/**
 * `./` · `../` 로 시작하는 경로 토큰. import 문·마크다운 링크·문자열 리터럴을 함께 잡는다.
 *
 * `refs` 가 전체 경로 문자열만 보면 이 꼴을 통째로 놓친다. B11 의 `hash/multiset` 이동에서
 * 실제로 놓쳤다 — `_contract/runContract.test.ts` 의 `../hash/multiset/…` import 둘이
 * 스윕 결과에 안 나왔고, 뒤늦게 `bunx tsc --noEmit` 이 잡았다. 스윕이 완전하다고 보고한
 * 뒤에 타입 검사가 잡는 것은 스윕이 제 일을 못 한 것이다.
 */
const RELATIVE_PATH = /\.{1,2}\/[A-Za-z0-9_.\-/]+/g;

async function walk(
  relativeDir: string,
  extensions: readonly string[],
): Promise<string[]> {
  const entries = await readdir(join(root, relativeDir || "."), {
    withFileTypes: true,
  }).catch(() => []);
  const found: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".claude") continue;
    const child = relativeDir ? join(relativeDir, entry.name) : entry.name;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      found.push(...(await walk(child, extensions)));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      found.push(child);
    }
  }
  return found;
}

/** 저장소 밖을 가리키거나 앵커뿐인 링크는 검사 대상이 아니다. */
function isLocal(target: string): boolean {
  if (target.startsWith("#")) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return false;
  return true;
}

interface Problem {
  where: string;
  target: string;
  detail: string;
}

async function check(): Promise<number> {
  const docs = (await walk("", DOC_EXTENSIONS)).filter(outsideVerdicts);
  const problems: Problem[] = [];
  let checked = 0;

  for (const doc of docs) {
    const text = await Bun.file(join(root, doc)).text();
    let fenced = false;
    let commented = false;
    for (const [index, rawLine] of text.split("\n").entries()) {
      if (rawLine.trimStart().startsWith("```")) {
        fenced = !fenced;
        continue;
      }
      // 코드 블록·인라인 코드 안의 `[a](b)` 는 링크가 아니다. ascii 도식과 LaTeX 아래첨자가
      // 그 모양으로 나온다 — 걸러 내지 않으면 오탐이 진짜 깨진 링크를 덮는다.
      if (fenced) continue;

      // HTML 주석도 마찬가지다. 캔버스의 집필 지시가 예시 경로를 담고 있는데, 그 경로는
      // 캔버스가 아니라 **산출물 위치**를 기준으로 적혀 있어 여기서 풀리지 않는다.
      const opened = rawLine.includes("<!--");
      const closed = rawLine.includes("-->");
      if (commented) {
        if (closed) commented = false;
        continue;
      }
      if (opened && !closed) {
        commented = true;
        continue;
      }
      const line = rawLine
        .replaceAll(/<!--.*?-->/g, "")
        .replaceAll(/`[^`]*`/g, "");

      MD_LINK.lastIndex = 0;
      for (const match of line.matchAll(MD_LINK)) {
        const raw = match[1];
        if (raw === undefined || !isLocal(raw)) continue;

        const [pathPart] = raw.split("#");
        if (pathPart === undefined || pathPart === "") continue;
        // 경로처럼 생긴 것만 본다. MDX 안의 JS 문자열이 `[2,6](+4)` 꼴을 만들어 내는데,
        // 그것은 링크가 아니라 서술이다(인용 검사기가 `/` 있는 인용만 보는 것과 같은 규칙).
        if (!pathPart.includes("/") && !/\.[a-z]{2,4}$/i.test(pathPart))
          continue;

        checked++;
        const decoded = decodeURIComponent(pathPart);
        // v2 자료구조 원고(`-guide.md`)는 걷힐 옛 가이드(`-guide.mdx`)를 가리키지 않는다 —
        // 2026-09-21 유저 지적(파일럿 3편이 stack·binarySearchTree·doublyLinkedList·
        // dynamicArray 의 .mdx 를 선수 지식 링크로 들고 있었다). 대상 편이 `-guide.md` 로
        // 서기 전에는 구조 이름만 적고, 선 뒤에 링크를 건다. 알고리즘 원고가 ds .mdx 를
        // 가리키는 것은 여기서 잡지 않는다 — 그 .mdx 를 지울 때 위 실재 검사가 잡는다.
        if (
          /^src\/data-structures\/.*-guide\.md$/.test(doc) &&
          decoded.endsWith("-guide.mdx")
        ) {
          problems.push({
            where: `${doc}:${index + 1}`,
            target: raw,
            detail:
              "v2 원고가 걷힐 옛 가이드(.mdx)를 가리킨다 — 링크를 걷고 구조 이름만 적는다. 그 편이 -guide.md 로 서면 그때 건다",
          });
          continue;
        }
        const absolute = normalize(join(root, dirname(doc), decoded));
        if (!(await Bun.file(absolute).exists())) {
          // 디렉터리 링크는 `Bun.file().exists()` 가 false 를 준다. 따로 본다.
          const asDir = await readdir(absolute).then(
            () => true,
            () => false,
          );
          if (asDir) continue;
          problems.push({
            where: `${doc}:${index + 1}`,
            target: raw,
            detail: `가리키는 곳이 없다 (${relative(root, absolute)})`,
          });
        }
      }
    }
  }

  if (problems.length > 0) {
    console.error(`링크 ${checked}건 중 ${problems.length}건이 깨졌다.\n`);
    for (const problem of problems) {
      console.error(`  ${problem.where}`);
      console.error(`    링크: ${problem.target}`);
      console.error(`    문제: ${problem.detail}`);
    }
    return 1;
  }

  console.log(`링크 ${checked}건 전부 실재하는 파일을 가리킨다.`);
  return 0;
}

/**
 * 주어진 경로를 가리키는 곳을 전부 찾는다. 지우거나 옮기기 **전에** 돌린다.
 *
 * 디렉터리를 주면 그 아래 전부를 대상으로 삼는다. 판정은 둘이다.
 *
 * 1. **문자열 포함** — 링크 문법을 가리지 않아야 JSON 값이나 셸 인자에 박힌 경로도 걸린다.
 * 2. **상대 경로 해석** — `./`·`../` 토큰을 그 파일의 위치 기준으로 풀어 대상과 맞춰 본다.
 *    확장자를 뗀 import(`../tree/multiset/multiset.contract`)도 같은 자리로 본다.
 */
async function refs(targets: string[]): Promise<number> {
  if (targets.length === 0) {
    console.error(
      "용법: bun run tools/check-links.ts refs <경로|디렉터리> ...",
    );
    return 2;
  }

  const needles: string[] = [];
  for (const target of targets) {
    const clean = target.replace(/^\.\//, "").replace(/\/$/, "");
    const asDir = await readdir(join(root, clean)).then(
      () => true,
      () => false,
    );
    if (asDir) {
      const inside = await walk(clean, REF_EXTENSIONS);
      needles.push(clean, ...inside);
    } else {
      needles.push(clean);
    }
  }

  const sources = (await walk("", REF_EXTENSIONS)).filter(outsideVerdicts);
  const hits = new Map<string, string[]>();

  const seen = new Set<string>();
  const record = (needle: string, source: string, index: number): void => {
    const where = `${source}:${index + 1}`;
    if (seen.has(`${needle} ${where}`)) return;
    seen.add(`${needle} ${where}`);
    const list = hits.get(needle) ?? [];
    list.push(where);
    hits.set(needle, list);
  };

  for (const source of sources) {
    const text = await Bun.file(join(root, source)).text();
    const lines = text.split("\n");
    for (const needle of needles) {
      if (!text.includes(needle)) continue;
      // 자기 자신을 세지 않는다.
      if (source === needle) continue;
      for (const [index, line] of lines.entries()) {
        if (!line.includes(needle)) continue;
        record(needle, source, index);
      }
    }

    if (!text.includes("./")) continue;
    const dir = dirname(source);
    for (const [index, line] of lines.entries()) {
      for (const match of line.matchAll(RELATIVE_PATH)) {
        const resolved = relative(root, resolve(root, dir, match[0]));
        // 저장소 밖으로 나가는 토큰은 대상이 아니다.
        if (resolved.startsWith("..")) continue;
        for (const needle of needles) {
          if (source === needle) continue;
          const same =
            resolved === needle ||
            // 확장자를 뗀 import.
            needle.startsWith(`${resolved}.`) ||
            // 대상 디렉터리 안을 가리키는 경로.
            resolved.startsWith(`${needle}/`);
          if (same) record(needle, source, index);
        }
      }
    }
  }

  if (hits.size === 0) {
    console.log(
      `대상 ${needles.length}개를 가리키는 곳이 없다. 지우거나 옮겨도 깨질 링크가 없다.`,
    );
    return 0;
  }

  console.log(`대상 ${needles.length}개 중 ${hits.size}개가 참조되고 있다.\n`);
  for (const [needle, places] of [...hits].sort()) {
    console.log(`  ${needle}`);
    for (const place of places) console.log(`    ${place}`);
  }
  console.log(
    "\n지우거나 옮기기 전에 위 자리를 함께 고친다. 리다이렉트는 만들지 않는다 — " +
      "migration note 로 끝낸다(KAN-015).",
  );
  return 0;
}

const [command, ...rest] = Bun.argv.slice(2);
if (command === "check") process.exit(await check());
else if (command === "refs") process.exit(await refs(rest));
else {
  console.error("용법: bun run tools/check-links.ts <check|refs> ...");
  process.exit(2);
}
