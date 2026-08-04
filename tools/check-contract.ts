/**
 * 계약 명세(`<name>.ts` 헤더 JSDoc)가 그 주변 산출물과 어긋나지 않는지 본다.
 *
 * 규약1이 명세를 헤더 한 곳으로 모았고 규약2가 스위트를 붙였지만, **셋은 여전히 서로 다른
 * 파일이다.** 헤더가 `add` 를 적고 스텁이 그 메서드를 안 두거나, 계약 표에 있는 연산이
 * 시나리오에 안 덮이면 그 행의 상한은 아무도 검사하지 않는다 — 그것이 ORD-006 이 고치려는
 * 결함 그 자체다. 하네스는 헤더 JSDoc 을 파싱하지 않으므로 이 대조를 할 수 없다.
 *
 * ```bash
 * bun run tools/check-contract.ts        # 계약을 적은 구조 전부
 * ```
 *
 * 규격의 정본은 `docs/ORD-006-conventions.md` §규약1·§규약2 다.
 */

import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Project, SyntaxKind } from "ts-morph";

const root = resolve(import.meta.dir, "..");
const SCAN_ROOT = "src/data-structures";

/**
 * 축3 시나리오 면제. 성장률을 잴 대상이 아닌 연산이다(§규약2 시나리오 규칙 2).
 * n 에 대해 반복 호출되지 않으므로 비용의 성장률이라는 것이 정의되지 않는다.
 */
const SCENARIO_EXEMPT = new Set(["constructor"]);

const GRADES = new Set(["basic", "invariant", "complexity", "concurrency"]);

interface Contract {
  /** 연산 계약 표의 행에서 뽑은 연산 이름. */
  ops: string[];
  grade: string | null;
  /** 여섯 항목 중 실제로 있는 것. */
  sections: string[];
}

const SECTION_ORDER = [
  "목적",
  "불변식",
  "연산 계약",
  "주입 정책",
  "검증 등급",
  "필요충분조건",
];

/** 파일 첫 JSDoc 블록의 본문. `*` 여백을 걷어 낸다. */
function headerDoc(source: string): string | null {
  const match = /^\s*\/\*\*([\s\S]*?)\*\//.exec(source);
  if (match?.[1] === undefined) return null;
  return match[1]
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, ""))
    .join("\n");
}

/**
 * 불변식 절의 번호 항목 수. 절이 「없다」면 0 이다.
 *
 * 세는 이유는 B2 가 놓친 것이 여기였기 때문이다(§규약1 「불변식 판별 절차」). 판별 자체는
 * 기계가 못 한다 — 관측 경로가 몇인지는 계약을 읽어야 안다. 이 게이트가 막는 것은 **개수
 * 표류**뿐이다. 헤더가 셋을 적고 스위트가 둘을 도는 상태를 조용히 지나가지 않게 한다.
 */
function invariantCount(doc: string): number {
  const marker = "**불변식.**";
  const start = doc.indexOf(marker);
  if (start < 0) return 0;
  const after = doc.slice(start + marker.length);
  const nextAt = SECTION_ORDER.map((section) => after.indexOf(`**${section}.**`))
    .filter((at) => at >= 0)
    .sort((a, b) => a - b)[0];
  const clause = nextAt === undefined ? after : after.slice(0, nextAt);
  return clause.split("\n").filter((line) => /^\d+\.\s/.test(line)).length;
}

function parseContract(doc: string): Contract {
  const ops: string[] = [];
  for (const line of doc.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const [, first] = trimmed.split("|");
    if (first === undefined) continue;
    // 한 칸에 연산이 둘 이상 오는 자리가 있다(`min()` / `max()`).
    for (const found of first.matchAll(/`([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)) {
      const name = found[1];
      if (name !== undefined && !ops.includes(name)) ops.push(name);
    }
  }

  const grade = /\*\*검증 등급\.\*\*\s*`([a-z]+)`/.exec(doc)?.[1] ?? null;
  const sections = SECTION_ORDER.filter((name) => doc.includes(`**${name}.**`));
  return { ops, grade, sections };
}

/** 클래스의 공개 메서드 이름. private(`#`)·`__cost` 같은 계측은 세지 않는다. */
function publicMethods(path: string, project: Project): string[] {
  const file = project.addSourceFileAtPath(path);
  const names: string[] = [];
  for (const cls of file.getClasses()) {
    for (const member of cls.getMembers()) {
      if (member.getKind() === SyntaxKind.Constructor) {
        names.push("constructor");
        continue;
      }
      if (member.getKind() !== SyntaxKind.MethodDeclaration) continue;
      const name = member.asKind(SyntaxKind.MethodDeclaration)?.getName();
      if (name === undefined || name.startsWith("#")) continue;
      names.push(name);
    }
  }
  return names;
}

/**
 * 살아 있는 벽시계 단정의 수(불변 사실 7). 계약을 적은 구조에만 묻는다.
 *
 * 문자열 검색을 쓰지 않는 이유가 있다 — `stack.test.ts:8` 과 `multiset.test.ts:9` 는
 * *"벽시계 성능 테스트를 없앴다"* 를 **산문으로** 적고 있어서 `performance.now` 가 파일에
 * 남아 있다. grep 게이트였다면 그 둘이 거짓 양성이 된다. 구문 트리에서 실제 호출만 센다.
 *
 * 아직 재집필하지 않은 64종은 계약 표가 없어 이 게이트의 대상이 아니다. 재집필이 끝나
 * 계약이 붙는 순간 자동으로 대상이 된다.
 */
function wallClockCalls(path: string, project: Project): number {
  const file = project.addSourceFileAtPath(path);
  let found = 0;
  for (const call of file.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    if (call.getExpression().getText() === "performance.now") found += 1;
  }
  return found;
}

async function structureDirs(): Promise<string[]> {
  const found: string[] = [];
  const categories = await readdir(join(root, SCAN_ROOT), {
    withFileTypes: true,
  });
  for (const category of categories) {
    if (!category.isDirectory() || category.name.startsWith("_")) continue;
    const names = await readdir(join(root, SCAN_ROOT, category.name), {
      withFileTypes: true,
    });
    for (const name of names) {
      if (!name.isDirectory() || name.name.startsWith("_")) continue;
      found.push(join(SCAN_ROOT, category.name, name.name));
    }
  }
  return found.sort();
}

const problems: string[] = [];
const project = new Project({ skipAddingFilesFromTsConfig: true });
let checked = 0;

for (const dir of await structureDirs()) {
  const name = dir.split("/").pop() ?? "";
  const stubPath = join(root, dir, `${name}.ts`);
  const stub = Bun.file(stubPath);
  if (!(await stub.exists())) continue;

  const doc = headerDoc(await stub.text());
  if (doc === null) continue;
  const contract = parseContract(doc);
  // 계약 표가 없으면 아직 규약1로 옮겨지지 않은 구조다. 이 게이트의 대상이 아니다.
  if (contract.ops.length === 0) continue;
  checked++;

  const missing = SECTION_ORDER.filter((s) => !contract.sections.includes(s));
  if (missing.length > 0) {
    problems.push(
      `${dir}/${name}.ts — 명세 항목이 빠졌다: ${missing.join("·")}. ` +
        "빈 항목은 지우지 않고 「없다 + 이유」로 남긴다(§규약1)",
    );
  }
  if (contract.grade === null || !GRADES.has(contract.grade)) {
    problems.push(
      `${dir}/${name}.ts — 검증 등급을 읽지 못했다. \`**검증 등급.** \`<등급>\`\` 형태로 적는다`,
    );
  }

  // ① 벽시계. 축3이 자리를 가져갔으므로 계약을 적은 구조에는 남아 있으면 안 된다.
  const testPath = join(root, dir, `${name}.test.ts`);
  if (await Bun.file(testPath).exists()) {
    const walls = wallClockCalls(testPath, project);
    if (walls > 0) {
      problems.push(
        `${dir}/${name}.test.ts — 벽시계 단정이 ${walls}곳 살아 있다. ` +
          "고정 n 의 임계값은 복잡도 등급이 아니라 그 기계의 상수를 잰다(불변 사실 7). " +
          "자리는 축3이다",
      );
    }
  }

  // ② 명세 ↔ 스텁·정본. 계약 표의 연산이 실제로 그 자리에 있는가.
  const declared = contract.ops.filter((op) => op !== "constructor");
  for (const [label, path] of [
    ["스텁", stubPath],
    ["정본", join(root, dir, "_reference", `${name}.ts`)],
  ] as const) {
    if (!(await Bun.file(path).exists())) continue;
    const methods = new Set(publicMethods(path, project));
    const absent = declared.filter((op) => !methods.has(op));
    if (absent.length > 0) {
      problems.push(
        `${dir} — 계약 표에 있는 연산이 ${label}에 없다: ${absent.join("·")}`,
      );
    }
    const extra = [...methods].filter(
      (op) => op !== "constructor" && !contract.ops.includes(op),
    );
    if (extra.length > 0) {
      problems.push(
        `${dir} — ${label}에 계약 표에 없는 공개 연산이 있다: ${extra.join("·")}. ` +
          "계약에 없는 표면은 검사되지 않는다",
      );
    }
  }

  // ③ 명세 ↔ 계약 스위트. 등급이 같은가, 표의 각 행이 시나리오에 덮이는가.
  const contractPath = join(root, dir, `${name}.contract.ts`);
  if (!(await Bun.file(contractPath).exists())) continue;

  const module = (await import(contractPath)) as Record<string, unknown>;
  const spec = Object.values(module).find(
    (
      value,
    ): value is {
      grade: string;
      scenarios: { covers: string[] }[];
      invariants: unknown[];
    } =>
      typeof value === "object" &&
      value !== null &&
      "grade" in value &&
      "scenarios" in value &&
      "invariants" in value,
  );
  if (spec === undefined) {
    problems.push(`${dir}/${name}.contract.ts — ContractSpec 을 찾지 못했다`);
    continue;
  }

  if (spec.grade !== contract.grade) {
    problems.push(
      `${dir} — 검증 등급이 갈린다: 헤더 \`${contract.grade}\` / contract.ts \`${spec.grade}\``,
    );
  }

  const declaredInvariants = invariantCount(doc);
  if (declaredInvariants !== spec.invariants.length) {
    problems.push(
      `${dir} — 불변식 수가 갈린다: 헤더 ${declaredInvariants}개 / contract.ts ` +
        `${spec.invariants.length}개. 헤더가 정본이고 스위트는 옮긴 것이다(§규약1)`,
    );
  }

  const covered = new Set(spec.scenarios.flatMap((s) => s.covers));
  const uncovered = contract.ops.filter(
    (op) => !covered.has(op) && !SCENARIO_EXEMPT.has(op),
  );
  if (uncovered.length > 0) {
    problems.push(
      `${dir} — 계약 표의 행이 축3 시나리오에 덮이지 않는다: ${uncovered.join("·")}. ` +
        "덮이지 않은 행은 검사되지 않는 상한이다(§규약2 시나리오 규칙 1)",
    );
  }
  const stray = [...covered].filter((op) => !contract.ops.includes(op));
  if (stray.length > 0) {
    problems.push(
      `${dir} — 시나리오가 계약 표에 없는 연산을 덮는다고 적었다: ${stray.join("·")}`,
    );
  }
}

if (problems.length > 0) {
  console.error(
    `계약을 적은 구조 ${checked}종에서 ${problems.length}건이 어긋난다.\n`,
  );
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(
  `계약을 적은 구조 ${checked}종이 명세·스텁·정본·스위트 사이에서 일치한다.`,
);
