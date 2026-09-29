/**
 * `<name>-problem.md` 를 가이드 끝 실습 절로 옮긴다 — 2026-09-29 `KAN-060` `S6`·`S7` 일회성 도구.
 *
 * 유저 지시 원문은 *"guide 마지막에 문제를 만들어서 실습 항목으로 배치한다. 기존 problem.md는
 * 삭제한다"* 다. 문제 문서 119개는 전부 같은 여섯 절(한 줄 요약 · 스토리 · 함수 인터페이스 · 제약
 * 조건 · 문제 상세 · 예시)을 갖고 있어서, 헤딩을 두 단 내리면 `SPEC.md` §3 `practice` 규격이 된다.
 * 본문 문장은 한 글자도 바꾸지 않는다 — 옮기는 일과 고쳐 쓰는 일을 섞으면 무엇이 바뀌었는지
 * diff 로 못 가린다. 본문을 알고리즘 중심으로 고쳐 쓰는 것은 `KAN-058` 몫이다.
 *
 * 하는 일은 셋이다.
 *
 * 1. **옮기기** — 가이드가 있는 폴더의 문제 문서를 그 가이드 끝 `## 실습 — 직접 풀어 보기` 로.
 *    흡수(`--absorb <문제 폴더>=<가이드 폴더>[:<받는 쪽 파일 이름>]`)는 스텁·테스트를 가이드 폴더로
 *    옮긴 **뒤** 그 가이드의 실습에 둘째 문제로 더한다. 받는 폴더에 같은 이름의 스텁이 이미 있으면
 *    (`etc/kadane` → `array/kadane`) 옮기면서 붙인 새 이름을 `:` 뒤에 적는다.
 * 2. **지우기** — 옮긴 문제 문서.
 * 3. **링크 돌리기** — `src/algorithms/**` 의 마크다운 링크 `(…/<name>-problem.md)` 를 그 폴더의
 *    가이드로. 흡수된 문제는 받은 가이드의 실습 앵커로. 아직 옮기지 않은 문제(신규 가이드 대기)의
 *    링크는 건드리지 않는다 — 파일이 아직 있으므로 깨지지 않는다.
 *
 * ```bash
 * bun run tools/migrate-practice.ts --dry-run                 # 바꿀 것과 옮긴 뒤 P22 결과만 낸다
 * bun run tools/migrate-practice.ts                           # 가이드가 있는 폴더 전부
 * bun run tools/migrate-practice.ts --absorb etc/kadane=array/kadane:maxSubarraySum --only etc/kadane
 * ```
 *
 * **다시 돌려도 같다.** 실습 절이 이미 있는 가이드에는 같은 제목의 문제를 다시 붙이지 않고,
 * 문제 문서가 없으면 옮길 것이 없다.
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { check } from "./check-v2.ts";
import { PRACTICE_HEADING } from "./section.ts";

const ROOT = join(import.meta.dir, "..");
const ALGO = join(ROOT, "src/algorithms");

/** 실습 앵커 — GitHub 슬러그 규칙(문장부호를 지우고 공백을 `-` 로). */
export const PRACTICE_ANCHOR = "#실습--직접-풀어-보기";

/** `src/algorithms` 아래 문제 문서 전부(`_scratch` 제외). 경로는 저장소 기준이다. */
export function problemDocs(root = ALGO): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "_scratch" || e.name === "node_modules") continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith("-problem.md")) out.push(p);
    }
  };
  walk(root);
  return out.sort();
}

/**
 * 문제 문서 하나를 실습 문제 한 벌로 바꾼다. `#` 제목이 `###` 문제 이름이 되고 나머지 헤딩은
 * 두 단 내려간다. 펜스 안의 `#` 는 헤딩이 아니므로 두고, 첫 소절 앞에 풀 파일 줄을 끼운다.
 */
export function toPractice(
  problem: string,
  stub: string,
  suite: string,
  suitePath: string,
): { title: string; block: string } {
  const lines = problem.replace(/\s+$/, "").split("\n");
  let fenced = false;
  const moved = lines.map((line) => {
    if (line.trimStart().startsWith("```")) fenced = !fenced;
    if (!fenced && /^#{1,4} /.test(line)) return `##${line}`;
    return line;
  });
  const head = moved[0] ?? "";
  if (!head.startsWith("### ")) throw new Error(`제목 줄이 없다: ${head}`);
  const title = head.slice(4).trim();
  const runLine = `풀 파일: [\`${stub}\`](./${stub}) · 테스트: [\`${suite}\`](./${suite}) · 실행: \`bun test ${suitePath}\``;
  const { rest, meta } = liftGrade(splitDisplayMath(moved.slice(1)));
  return {
    title,
    block: [`### ${title}`, "", runLine, ...meta, ...rest].join("\n"),
  };
}

/**
 * 여러 줄 디스플레이 수식의 `$$` 를 제 줄로 뗀다. 문제 문서 다섯이 `$$\text{…} = \begin{cases}` 로
 * 열고 `\end{cases}$$` 로 닫았는데, 렌더러(remark-math)는 닫는 `$$` 가 제 줄에 있어야 닫힘으로 읽는다.
 * 못 닫힌 수식이 뒤따르는 `#### 예시` 헤딩을 삼켜 `build-html` 이 헤딩 수 어긋남으로 잡았다
 * (2026-09-29 `S6`). 한 줄에서 열고 닫는 수식(`$$…$$`)과 펜스 안은 건드리지 않는다.
 */
export function splitDisplayMath(lines: string[]): string[] {
  const out: string[] = [];
  let fenced = false;
  let open = false;
  for (const line of lines) {
    if (line.trimStart().startsWith("```")) fenced = !fenced;
    if (fenced) {
      out.push(line);
      continue;
    }
    const t = line.trim();
    if (
      !open &&
      t.startsWith("$$") &&
      t !== "$$" &&
      !(t.length > 4 && t.endsWith("$$"))
    ) {
      out.push("$$", t.slice(2));
      open = true;
      continue;
    }
    if (open && t.endsWith("$$")) {
      const body = t.slice(0, -2);
      if (body !== "") out.push(body);
      out.push("$$");
      open = false;
      continue;
    }
    if (t === "$$") open = !open;
    out.push(line);
  }
  return out;
}

/**
 * 문제 문서 119개 중 하나(`kthSmallest`)만 여섯 절 밖에 `## 중요도 · 난이도` 표를 갖는다. 규격의
 * 소절은 여섯이므로(P22) 절로 두지 않고, **값은 버리지 않고** 풀 파일 줄 아래 한 줄로 올린다 —
 * 그 값은 저장소의 다른 목록 어디에도 없다(2026-09-29 확인).
 */
export function liftGrade(lines: string[]): { rest: string[]; meta: string[] } {
  const at = lines.findIndex((l) => l.trim() === "#### 중요도 · 난이도");
  if (at < 0) return { rest: lines, meta: [] };
  const end = lines.findIndex((l, i) => i > at && l.startsWith("#### "));
  const block = lines.slice(at + 1, end < 0 ? lines.length : end);
  const cells = block
    .filter((l) => /^\|\s*(중요도|난이도)\s*\|/.test(l))
    .map((l) => l.split("|").map((c) => c.trim()))
    .map((c) => `${c[1]} ${c[2]}`);
  const rest = [...lines.slice(0, at), ...(end < 0 ? [] : lines.slice(end))];
  return { rest, meta: ["", cells.join(" · ")] };
}

/** 가이드 끝에 실습 문제를 붙인다. 절이 없으면 절부터. 같은 제목이 이미 있으면 멈춘다. */
export function appendPractice(
  guide: string,
  title: string,
  block: string,
): string {
  // 같은 제목이 이미 있으면 **멈춘다**. 한때 조용히 건너뛰어, 흡수한 문제가 받는 쪽 문제와 제목이
  // 같던 kadane 에서 문제 서술이 통째로 빠진 채 원본이 지워졌다(2026-09-30 발견). 제목을 가려
  // 다시 부른다.
  if (guide.split("\n").some((l) => l.trim() === `### ${title}`)) {
    throw new Error(`실습에 같은 제목의 문제가 이미 있다: ${title}`);
  }
  const base = guide.replace(/\s+$/, "");
  const hasSection = guide
    .split("\n")
    .some((l) => l.trim() === PRACTICE_HEADING);
  const intro = hasSection
    ? []
    : [
        "",
        PRACTICE_HEADING,
        "",
        "이 글의 알고리즘으로 풀어 볼 문제입니다. 스텁을 채운 뒤 테스트로 확인하세요.",
      ];
  return `${[base, ...intro, "", block].join("\n")}\n`;
}

/** 링크 대상 `(…/<name>-problem.md)` 를 돌린다. `map` 은 문제 폴더(ALGO 기준) → 새 대상(ALGO 기준). */
export function retarget(
  text: string,
  fromFile: string,
  map: Map<string, string>,
): { text: string; count: number } {
  let count = 0;
  const out = text.replace(
    /\]\(([^)\s#]*?)([A-Za-z0-9_]+)-problem\.md\)/g,
    (whole, prefix: string, name: string) => {
      const abs = join(dirname(fromFile), `${prefix}${name}-problem.md`);
      const key = relative(ALGO, dirname(abs));
      const target = map.get(key);
      if (target === undefined) return whole;
      count++;
      let rel = relative(dirname(fromFile), join(ALGO, target));
      if (!rel.startsWith(".")) rel = `./${rel}`;
      return `](${rel})`;
    },
  );
  return { text: out, count };
}

/** `src/algorithms` 아래 마크다운 전부(`_scratch` 제외). */
function markdownFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "_scratch" || e.name === "node_modules") continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".md")) out.push(p);
    }
  };
  walk(ALGO);
  return out;
}

interface Plan {
  problem: string;
  guide: string;
  stub: string;
  suite: string;
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const dry = args.includes("--dry-run");
  const absorb = new Map<string, string>();
  const rename = new Map<string, string>();
  const only = new Set<string>();
  for (const [i, a] of args.entries()) {
    if (a === "--absorb") {
      const [from, spec] = (args[i + 1] ?? "").split("=");
      const [to, as] = (spec ?? "").split(":");
      if (!from || !to)
        throw new Error("--absorb <문제 폴더>=<가이드 폴더>[:<파일 이름>]");
      absorb.set(from, to);
      if (as) rename.set(from, as);
    }
    if (a === "--only") only.add(args[i + 1] ?? "");
  }

  const plans: Plan[] = [];
  const skipped: string[] = [];
  for (const problem of problemDocs()) {
    const dir = dirname(problem);
    const key = relative(ALGO, dir);
    if (only.size > 0 && !only.has(key)) continue;
    const name =
      rename.get(key) ?? basename(problem).replace(/-problem\.md$/, "");
    const hostKey = absorb.get(key) ?? key;
    const hostDir = join(ALGO, hostKey);
    const hostName = basename(hostDir);
    const guide = join(hostDir, `${hostName}-guide.md`);
    if (!existsSync(guide)) {
      skipped.push(`${key} — 가이드가 없다(신규 가이드 대기)`);
      continue;
    }
    // 스텁·테스트는 **받는 폴더에** 있어야 한다. 흡수는 S7 이 먼저 옮겨 둔다.
    const stubFile = readdirSync(hostDir).find((f) => f === `${name}.ts`);
    const suiteFile = readdirSync(hostDir).find((f) => f === `${name}.test.ts`);
    if (!stubFile || !suiteFile) {
      skipped.push(
        `${key} — 받는 폴더(${hostKey})에 ${name}.ts·${name}.test.ts 가 없다`,
      );
      continue;
    }
    plans.push({ problem, guide, stub: stubFile, suite: suiteFile });
  }

  // 링크 지도 — 옮기는 문제 폴더 → 받는 가이드(흡수면 실습 앵커까지).
  const map = new Map<string, string>();
  for (const p of plans) {
    const key = relative(ALGO, dirname(p.problem));
    const guideRel = relative(ALGO, p.guide);
    map.set(key, absorb.has(key) ? `${guideRel}${PRACTICE_ANCHOR}` : guideRel);
  }

  // 가이드마다 붙일 문제를 모은다 — 흡수로 한 가이드가 문제 둘을 받을 수 있다. 자기 문제가 먼저다.
  const byGuide = new Map<string, Plan[]>();
  for (const p of plans) {
    const list = byGuide.get(p.guide) ?? [];
    list.push(p);
    byGuide.set(p.guide, list);
  }
  const edited = new Map<string, string>();
  for (const [guide, list] of byGuide) {
    list.sort(
      (a, b) =>
        Number(dirname(a.problem) !== dirname(guide)) -
        Number(dirname(b.problem) !== dirname(guide)),
    );
    let text = edited.get(guide) ?? readFileSync(guide, "utf8");
    for (const p of list) {
      const suitePath = relative(ROOT, join(dirname(guide), p.suite));
      const { title, block } = toPractice(
        readFileSync(p.problem, "utf8"),
        p.stub,
        p.suite,
        suitePath,
      );
      text = appendPractice(text, title, block);
    }
    edited.set(guide, text);
  }

  let links = 0;
  const linkFiles: string[] = [];
  for (const file of markdownFiles()) {
    const before = edited.get(file) ?? readFileSync(file, "utf8");
    const r = retarget(before, file, map);
    if (r.count > 0) {
      links += r.count;
      linkFiles.push(relative(ROOT, file));
      edited.set(file, r.text);
    }
  }

  // 옮긴 뒤의 가이드를 P22 로 잰다 — 파일을 쓰기 전에 구조가 규격을 지키는지 본다.
  let bad = 0;
  for (const guide of byGuide.keys()) {
    const text = edited.get(guide) ?? "";
    const findings = check({ text, kind: "algo" }).filter(
      (f) => f.code === "P22" || f.code === "SEC",
    );
    if (findings.length > 0) {
      bad++;
      console.error(`${relative(ROOT, guide)} — P22 ${findings.length}건`);
      for (const f of findings)
        console.error(`  [${f.code}] ${f.where ?? ""} ${f.detail}`);
    }
  }

  console.log(
    `옮길 문제 ${plans.length}개 → 가이드 ${byGuide.size}편 · 돌릴 링크 ${links}개(${linkFiles.length}개 파일) · 옮긴 뒤 P22 위반 ${bad}편`,
  );
  for (const s of skipped) console.log(`  건너뜀  ${s}`);
  if (dry || bad > 0) {
    if (bad > 0) console.error("P22 위반이 있어 아무것도 쓰지 않았다.");
    process.exit(bad > 0 ? 1 : 0);
  }
  for (const [file, text] of edited) writeFileSync(file, text);
  for (const p of plans) rmSync(p.problem);
  console.log(
    `썼다 — 가이드·링크 ${edited.size}개 파일, 지운 문제 문서 ${plans.length}개.`,
  );
}
