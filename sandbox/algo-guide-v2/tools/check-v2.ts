/**
 * `algo-learn-guide` 골격 스캐너 — P1~P10.
 *
 * **기계로 셀 수 있는 것만** 잰다. 의미 판정(용어 정의 유무 · 논증의 성립 · 반례의 타당성)은
 * 이해 시험 V1~V7 이 맡는다. 스캐너가 절반만 덮으면서 "잰다" 고 적으면 통과 표시가 실제보다
 * 넓게 읽힌다 — 이 저장소가 `check-guide-rhythm.ts:9-12` 에 이미 적어 둔 한계다.
 *
 * ```bash
 * bun run tools/check-v2.ts <guide.md>          # 한 편
 * bun run tools/check-v2.ts --json <guide.md>   # 기계 판독
 * ```
 *
 * 종료코드: 0 통과 · 1 위반 · 2 대상 없음/사용법
 */

import { basename, dirname, join } from "node:path";
import { fences, first, parseSections, pick, type Section } from "./section.ts";

export interface Finding {
  code: string;
  detail: string;
  where?: string;
}

/* ────────────────────────── 공통 계수 ────────────────────────── */

/**
 * "그림" 의 정의. **펜스와 `|` 표뿐이다.**
 *
 * 구 구현은 `<` 로 시작하는 줄도 끊는 것으로 셌다(MDX 컴포넌트 호출부였다). 새 골격에서
 * 그대로 두면 **`<!--check:c1-->` 마커가 그림이 된다.** 마커는 그림이 아니다.
 */
function isFigureLine(line: string, inFence: boolean): boolean {
  if (inFence) return true;
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|");
}

/** 산문 문단이 몇 개까지 연달아 오는가. 그림·표·빈 줄이 그 연속을 끊는다. */
function maxProseRun(body: string[]): number {
  let run = 0;
  let worst = 0;
  let fenced = false;
  let inParagraph = false;

  for (const line of body) {
    if (line.trimStart().startsWith("```")) {
      fenced = !fenced;
      // 펜스는 그림이므로 연속을 끊는다.
      run = 0;
      inParagraph = false;
      continue;
    }
    if (fenced) continue;

    if (line.trim() === "") {
      inParagraph = false;
      continue;
    }
    if (isFigureLine(line, false)) {
      run = 0;
      inParagraph = false;
      continue;
    }
    if (!inParagraph) {
      inParagraph = true;
      run += 1;
      worst = Math.max(worst, run);
    }
  }
  return worst;
}

/**
 * 그 절이 그림을 지고 있는가.
 *
 * `code.step` 의 코드 스니펫은 **세지 않는다.** repeat 절이라 스니펫이 절마다 있어서,
 * 코드를 그림으로 세면 그 절들에서 P1·P7 이 통째로 무력해진다.
 */
function hasFigure(section: Section): boolean {
  const blocks = fences(section.body);
  const drawable = blocks.filter((b) => {
    if (section.id !== "code.step") return true;
    // `text`·`ascii`·태그 없음만 그림으로 본다. 나머지는 코드다.
    return b.lang === "" || b.lang === "text" || b.lang === "ascii";
  });
  if (drawable.length > 0) return true;
  return section.body.some((l) => isFigureLine(l, false));
}

/** `T1` · `T12` 꼴 인용을 모은다. */
function traceRefs(body: string[]): Set<string> {
  const out = new Set<string>();
  for (const line of body) {
    for (const m of line.matchAll(/\bT(\d+)\b/g)) out.add(`T${m[1]}`);
  }
  return out;
}

/** 원문자 라벨 ①~⑳ 을 모은다. */
function circled(text: string): Set<string> {
  const out = new Set<string>();
  for (const ch of text) {
    if (ch >= "①" && ch <= "⑳") out.add(ch);
  }
  return out;
}

/* ────────────────────────── `.sim.ts` ────────────────────────── */

export interface SimModule {
  /** export 키 → 그 안의 정보 */
  entries: Map<string, { frames: number; result: string | null }>;
  /** 계약 위반 — 있으면 P3 은 통과가 아니라 **에러**다. */
  violations: string[];
}

/**
 * `.sim.ts` 를 정적으로 판다.
 *
 * **`steps` 는 인라인 배열 리터럴이어야 한다.** 실측: `steps: [...base, {t}]` 는 실제 3인데
 * 정적 계수가 **2로 센다.** 과소 계수는 P3(`trace` 단계 ≥ 프레임 수)을 지나 **얇은 trace 를
 * 통과시킨다** — 판정기가 판정을 못 하는 것보다 나쁘다. 그래서 위반은 경고가 아니라 에러다.
 */
export function parseSim(source: string): SimModule {
  const entries = new Map<string, { frames: number; result: string | null }>();
  const violations: string[] = [];

  // `export const <id> = {` … 를 중괄호 균형으로 잘라 낸다.
  const head = /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g;
  for (const m of source.matchAll(head)) {
    const id = m[1];
    if (id === undefined) continue;
    const start = (m.index ?? 0) + m[0].length - 1;
    const block = balanced(source, start);
    if (block === null) {
      violations.push(`${id}: 객체 리터럴이 닫히지 않았다`);
      continue;
    }

    const stepsIdx = block.search(/(^|[\s,{])steps\s*:/);
    if (stepsIdx < 0) {
      violations.push(`${id}: \`steps\` 가 없다`);
      continue;
    }
    const after = block.slice(block.indexOf(":", stepsIdx) + 1).trimStart();
    if (!after.startsWith("[")) {
      violations.push(
        `${id}: \`steps\` 가 인라인 배열 리터럴이 아니다(변수 참조·함수 호출 금지)`,
      );
      continue;
    }
    const arr = balanced(block, block.length - after.length);
    if (arr === null) {
      violations.push(`${id}: \`steps\` 배열이 닫히지 않았다`);
      continue;
    }
    if (/\.\.\./.test(arr)) {
      violations.push(
        `${id}: \`steps\` 에 spread 가 있다 — 정적 계수가 실제보다 적게 세어 얇은 trace 를 통과시킨다`,
      );
      continue;
    }

    entries.set(id, { frames: countTop(arr), result: pickResult(block) });
  }

  return { entries, violations };
}

/** `start` 위치의 여는 괄호와 짝이 맞는 지점까지를 돌려준다(문자열·주석은 건너뛴다). */
function balanced(text: string, start: number): string | null {
  const open = text[start];
  if (open === undefined) return null;
  const close = open === "{" ? "}" : open === "[" ? "]" : null;
  if (close === null) return null;

  let depth = 0;
  let quote: string | null = null;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === undefined) break;
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/** 배열 리터럴에서 **최상위** 원소 수를 센다. 중첩 객체 안의 쉼표는 안 센다. */
function countTop(arr: string): number {
  const inner = arr.slice(1, -1).trim();
  if (inner === "") return 0;
  let depth = 0;
  let quote: string | null = null;
  let count = 1;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === undefined) break;
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "{" || ch === "[" || ch === "(") depth++;
    else if (ch === "}" || ch === "]" || ch === ")") depth--;
    else if (ch === "," && depth === 0) count++;
  }
  // 후행 쉼표는 원소가 아니다.
  return inner.endsWith(",") ? count - 1 : count;
}

/** `result:` 값을 문자열로 뽑는다. 없으면 `null`. */
function pickResult(block: string): string | null {
  const m = /(^|[\s,{])result\s*:\s*([^\n]+?)\s*,?\s*$/m.exec(block);
  if (!m || m[2] === undefined) return null;
  return m[2].replace(/^["'`]|["'`]$/g, "").trim();
}

/* ────────────────────────── 판정 ────────────────────────── */

/** 그림을 져야 하는 절. `deep.proof` 는 논증 절이라 뺀다(빈 상자가 된다). */
const FIGURE_REQUIRED = [
  "concept",
  "deep.build",
  "deep.trap",
  "code.step",
  "trace",
  "mistake",
  "perf.derive",
  "perf.worst",
] as const;

/**
 * voice 금지 문형 — **정규식으로 잡히는 넷만** 센다.
 *
 * `voice.json` 의 `forbid` 는 여덟인데 나머지 넷("친절 장치로 깊이 대체" 류)은 의미 판정이라
 * 기계가 못 센다. **`voice.md` 목록은 셋뿐이라 원본이 서로 안 맞는다** — `voice.json` 을
 * 정본으로 쓴다.
 */
const FORBIDDEN = [
  "성립해서",
  "임을 알 수 있습니다",
  "이를 반복 적용하면",
  "자명합니다",
];

export interface CheckInput {
  text: string;
  /** `<name>-guide.sim.ts` 원문. 없으면 P3·P6·P9 는 "미실행" 으로 보고한다. */
  sim?: string;
  /** `bench-alt.ts` 가 낸 결정론적 계수. 없으면 P10 은 "미실행". */
  bench?: Record<string, number>;
  /** 그림 의무 예외 부류. B3 판정 전에는 비어 있다. */
  figureExempt?: boolean;
  maxProseRun?: number;
}

export function check(input: CheckInput): Finding[] {
  const findings: Finding[] = [];
  const limit = input.maxProseRun ?? 2;
  const { sections, unresolved } = parseSections(input.text);

  // 절 식별에 실패하면 나머지 판정이 전부 헛돈다. 여기서 멈춘다.
  for (const u of unresolved) {
    findings.push({
      code: "SEC",
      where: `:${u.line}`,
      detail: `어느 항목으로도 해소되지 않는 헤딩 — ${u.heading}`,
    });
  }
  if (findings.length > 0) return findings;

  // ── P1 절 단위 최대 연속 산문 문단 ──
  for (const s of sections) {
    const run = maxProseRun(s.body);
    if (run > limit) {
      findings.push({
        code: "P1",
        where: `${s.id}:${s.line}`,
        detail: `연속 산문 문단 ${run} > ${limit}`,
      });
    }
  }

  // ── P2 voice 금지 문형 ──
  for (const [index, line] of input.text.split("\n").entries()) {
    for (const phrase of FORBIDDEN) {
      if (line.includes(phrase)) {
        findings.push({
          code: "P2",
          where: `:${index + 1}`,
          detail: `금지 문형 "${phrase}"`,
        });
      }
    }
  }

  const traceSection = first(sections, "trace");
  const traceLabels = traceSection ? traceRefs(traceSection.body) : new Set();

  // ── P3 trace 단계 수 ≥ 시뮬 프레임 수, 그리고 ≥ 6 ──
  const sim = input.sim === undefined ? null : parseSim(input.sim);
  if (sim) {
    for (const v of sim.violations) {
      findings.push({ code: "P3", detail: `.sim.ts 계약 위반 — ${v}` });
    }
  }
  if (traceSection) {
    if (traceLabels.size < 6) {
      findings.push({
        code: "P3",
        where: `trace:${traceSection.line}`,
        detail: `T# 단계 ${traceLabels.size} < 6`,
      });
    }
    if (sim && sim.violations.length === 0) {
      const frames = [...sim.entries.values()].reduce(
        (max, e) => Math.max(max, e.frames),
        0,
      );
      if (traceLabels.size < frames) {
        findings.push({
          code: "P3",
          where: `trace:${traceSection.line}`,
          detail: `T# 단계 ${traceLabels.size} < 시뮬 프레임 ${frames}`,
        });
      }
    }
  } else {
    findings.push({ code: "P3", detail: "`trace` 절이 없다" });
  }

  // ── P4 분기 피복 — code.step 의 원문자 라벨 ⊆ trace 가 밟은 라벨 ──
  const stepLabels = new Set<string>();
  for (const s of pick(sections, "code.step")) {
    for (const block of fences(s.body)) {
      for (const label of circled(block.lines.join("\n")))
        stepLabels.add(label);
    }
  }
  if (traceSection) {
    const traced = circled(traceSection.body.join("\n"));
    const missing = [...stepLabels].filter((l) => !traced.has(l));
    if (missing.length > 0) {
      findings.push({
        code: "P4",
        where: `trace:${traceSection.line}`,
        detail: `밟지 않은 분기 ${missing.join("")}`,
      });
    }
  }

  // ── P5 결속 — perf.derive · selfcheck 가 각각 T# 를 1개 이상 인용 ──
  for (const id of ["perf.derive", "selfcheck"]) {
    const s = first(sections, id);
    if (!s) {
      findings.push({ code: "P5", detail: `\`${id}\` 절이 없다` });
      continue;
    }
    const refs = traceRefs(s.body);
    if (refs.size === 0) {
      findings.push({
        code: "P5",
        where: `${id}:${s.line}`,
        detail: "`trace` 의 T# 를 하나도 인용하지 않는다",
      });
      continue;
    }
    const dangling = [...refs].filter((r) => !traceLabels.has(r));
    if (dangling.length > 0) {
      findings.push({
        code: "P5",
        where: `${id}:${s.line}`,
        detail: `\`trace\` 에 없는 단계를 가리킨다 — ${dangling.join("·")}`,
      });
    }
  }

  // ── P6 마커 id ↔ .sim.ts export 키, 그리고 마커 아래 펜스가 비지 않았는가 ──
  const markers = [
    ...input.text.matchAll(/<!--viz:([A-Za-z_$][\w$]*)-->/g),
  ].map((m) => m[1] as string);
  if (sim) {
    for (const id of markers) {
      if (!sim.entries.has(id)) {
        findings.push({
          code: "P6",
          detail: `마커 \`${id}\` 에 대응하는 export 가 없다`,
        });
      }
    }
    for (const id of sim.entries.keys()) {
      if (!markers.includes(id)) {
        findings.push({
          code: "P6",
          detail: `export \`${id}\` 를 가리키는 마커가 없다`,
        });
      }
    }
  }
  for (const id of markers) {
    const at = input.text.indexOf(`<!--viz:${id}-->`);
    const rest = input.text.slice(at);
    const fence = /```[a-z]*\n([\s\S]*?)```/.exec(rest);
    if (!fence || (fence[1] ?? "").trim() === "") {
      findings.push({
        code: "P6",
        detail: `마커 \`${id}\` 아래 ascii 펜스가 비어 있다`,
      });
    }
  }

  // ── P7 그림 의무 ──
  if (input.figureExempt !== true) {
    for (const id of FIGURE_REQUIRED) {
      const group = pick(sections, id);
      if (group.length === 0) {
        findings.push({ code: "P7", detail: `\`${id}\` 절이 없다` });
        continue;
      }
      // `code.step` 은 **절 전체 기준** 하나면 된다(벌마다가 아니다).
      if (!group.some(hasFigure)) {
        findings.push({
          code: "P7",
          where: `${id}:${group[0]?.line}`,
          detail: "그림이 없다",
        });
      }
    }
  }

  // ── P8 concept 이 뒤 절 헤딩·앵커를 참조하지 않는가 ──
  const concept = first(sections, "concept");
  if (concept) {
    const laterHeadings = sections
      .filter((s) => s.line > concept.line && s.level <= 3)
      .map((s) => s.heading.replace(/^#+\s*/, ""));
    const text = concept.body.join("\n");
    for (const heading of laterHeadings) {
      if (heading.length >= 4 && text.includes(heading)) {
        findings.push({
          code: "P8",
          where: `concept:${concept.line}`,
          detail: `뒤 절 헤딩을 참조한다 — "${heading}"`,
        });
      }
    }
    if (/\]\(#/.test(text)) {
      findings.push({
        code: "P8",
        where: `concept:${concept.line}`,
        detail: "문서 내 앵커 링크를 쓴다",
      });
    }
  }

  // ── P9 .sim.ts 의 result ↔ 본문 <!--result:{id}--> ──
  if (sim) {
    for (const [id, entry] of sim.entries) {
      const m = new RegExp(`<!--result:${id}=([^>]*)-->`).exec(input.text);
      if (!m) {
        findings.push({
          code: "P9",
          detail: `\`${id}\` 의 result 마커가 본문에 없다`,
        });
        continue;
      }
      if (entry.result === null) {
        findings.push({
          code: "P9",
          detail: `\`${id}\` 의 \`result\` 필드가 없다`,
        });
        continue;
      }
      const inBody = (m[1] ?? "").trim();
      if (norm(inBody) !== norm(entry.result)) {
        findings.push({
          code: "P9",
          detail: `\`${id}\` 결과 불일치 — 본문 "${inBody}" vs sim "${entry.result}"`,
        });
      }
    }
  }

  // ── P10 purpose.alt 의 수치가 bench 출력과 맞는가 ──
  const alt = first(sections, "purpose.alt");
  if (input.bench && alt) {
    const numbers = new Set(
      alt.body
        .join("\n")
        .match(/\d[\d,]*/g)
        ?.map((n) => n.replaceAll(",", "")) ?? [],
    );
    for (const [key, value] of Object.entries(input.bench)) {
      if (!numbers.has(String(value))) {
        findings.push({
          code: "P10",
          where: `purpose.alt:${alt.line}`,
          detail: `실측값이 본문에 없다 — ${key}=${value}`,
        });
      }
    }
  }

  return findings;
}

function norm(s: string): string {
  return s.replaceAll(/\s+/g, "").replaceAll(",", "");
}

/* ────────────────────────── CLI ────────────────────────── */

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const json = args.includes("--json");
  const target = args.find((a) => !a.startsWith("--"));
  if (target === undefined) {
    console.error("용법: bun run tools/check-v2.ts [--json] <guide.md>");
    process.exit(2);
  }

  const file = Bun.file(target);
  if (!(await file.exists())) {
    console.error(`대상이 없다: ${target}`);
    process.exit(2);
  }
  const text = await file.text();

  const stem = basename(target).replace(/\.md$/, "");
  const simPath = join(dirname(target), `${stem}.sim.ts`);
  const benchPath = join(dirname(target), `${stem}.bench.json`);
  const simFile = Bun.file(simPath);
  const benchFile = Bun.file(benchPath);

  const input: CheckInput = { text };
  if (await simFile.exists()) input.sim = await simFile.text();
  if (await benchFile.exists()) input.bench = await benchFile.json();

  const findings = check(input);

  if (json) {
    console.log(JSON.stringify({ target, findings }, null, 2));
  } else if (findings.length === 0) {
    console.log(`${target} — P1~P10 통과.`);
    if (input.sim === undefined) {
      console.log(
        "  (참고: `.sim.ts` 가 없어 P3 프레임 대조·P6·P9 는 실행되지 않았다)",
      );
    }
    if (input.bench === undefined) {
      console.log("  (참고: `.bench.json` 이 없어 P10 은 실행되지 않았다)");
    }
  } else {
    console.error(`${target} — 위반 ${findings.length}건.\n`);
    for (const f of findings) {
      console.error(`  [${f.code}] ${f.where ?? ""}`);
      console.error(`    ${f.detail}`);
    }
  }
  process.exit(findings.length === 0 ? 0 : 1);
}
