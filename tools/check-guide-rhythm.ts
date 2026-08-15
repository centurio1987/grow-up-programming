/**
 * 가이드의 전개 밀도와 절 간 결속을 센다 — 루브릭 V1(rhythm) · spec D2·D3 의 판정 근거.
 *
 * **왜 세는가.** 채점은 "본문에서 근거를 인용" 원칙으로 돌아가는데, 호흡(rhythm)은 문장에
 * 있는 것이 아니라 문장들 **사이**에 있어서 인용할 수 있는 대상이 아니다. 그래서 voice 의
 * `device`(목록이라 세어짐)만 채워지고 `rhythm`(산문이라 안 세어짐)은 비는 편향이 생겼다.
 * 실측: 176편 중 규칙 3 을 지키는 편이 0편이었다. 이 도구가 그 칸을 센다.
 *
 * **한계(반드시 함께 읽는다).** R1 은 **그림의 유무만** 잰다. 그 그림이 무엇을 보이는지는
 * 재지 않는다 — 2문단마다 빈 상자를 끼우면 R1 은 통과한다. 충분성은 이해 게이트 Q6 과
 * 절제 시험이 맡는다. R1 단독을 "설명이 좋다"의 근거로 쓰지 않는다.
 *
 * 검사 다섯. R3·R4 는 절 사이의 정합이라 국소 삽입으로는 못 채운다.
 *
 *   R1  절 단위 최대 연속 산문 문단 ≤ max-run(기본 2)
 *   R2  trace 절 단계 수 ≥ 시뮬 프레임 수, 그리고 ≥ 6
 *   R3  분기 피복 — impl 코드의 원문자 라벨 ⊆ trace 가 밟은 라벨
 *   R4  인용 결속 — clue · optcode 가 각각 trace 단계 번호(T#)를 1개 이상 인용
 *   R5  voice forbid 문형 부재
 *
 * 래칫: `tools/_baseline/guide-rhythm.tsv` 에 있는 편은 **baseline 보다 나빠지면** 실패한다.
 * baseline 에 없는 편(새 글)과 trace 절이 생긴 편은 즉시 전 기준을 적용한다.
 * 재집필이 끝나면 그 편의 baseline 행을 지운다 — 줄 수가 곧 남은 부채다.
 *
 * Usage:
 *   bun run tools/check-guide-rhythm.ts                 # 전수 검사
 *   bun run tools/check-guide-rhythm.ts <파일...>        # 지정 파일만
 *   bun run tools/check-guide-rhythm.ts --tsv           # TSV 로 출력(집계용)
 *   bun run tools/check-guide-rhythm.ts --write-baseline # 현재 값을 baseline 으로 기록
 *   bun run tools/check-guide-rhythm.ts --max-run 2     # R1 상한 덮어쓰기
 *
 * Exit: 0 통과 · 1 위반 · 2 대상 없음
 */

import { Glob } from "bun";

/**
 * R1 상한의 정본은 voice 의 `params.max_prose_run` 이다
 * (`~/.claude/authoring/voices/ppangtolab-teacher/voice.json`).
 * 여기 있는 값은 그 선언을 옮겨 적은 것이므로, voice 를 고치면 이 값도 함께 고친다.
 */
const DEFAULT_MAX_RUN = 2;

const TRACE_HEADING = "## 코드를 한 번 끝까지 굴려 보기";
const SECTION_IMPL = "## 아이디어를 코드로 옮기기";
const SECTION_CLUE = "## 더 빠르게 만들 단서 찾기";
const SECTION_OPTCODE = "## 최적화 코드";

/** voice `forbid` 의 논증 종료 문형. 이 표현이 나오면 그 자리가 생략된 단계다. */
const FORBIDDEN = [
  /성립해서/g,
  /임을 알 수 있습니다/g,
  /이를 반복 적용하면/g,
  /자명합니다/g,
];

/** 원문자 라벨 — impl 코드의 분기에 달고 trace 가 이 라벨로 어느 자리를 밟았는지 적는다. */
const CIRCLED = /[①②③④⑤⑥⑦⑧⑨⑩]/g;

type Finding = { code: string; message: string };

type Report = {
  file: string;
  name: string;
  maxProseRun: number;
  worstSection: string;
  traceSteps: number;
  simFrames: number;
  branchTotal: number;
  branchCovered: number;
  citeClue: number;
  citeOptcode: number;
  forbidHits: number;
  hasTrace: boolean;
  findings: Finding[];
};

/** 문서를 헤딩 단위로 자른다. 헤딩이 없으면 전체를 한 절로 본다. */
function splitSections(lines: string[]): { heading: string; body: string[] }[] {
  const out: { heading: string; body: string[] }[] = [];
  let cur = { heading: "(머리말)", body: [] as string[] };
  let inFence = false;
  for (const line of lines) {
    if (line.trimStart().startsWith("```")) inFence = !inFence;
    if (!inFence && /^#{2,4} /.test(line)) {
      out.push(cur);
      cur = { heading: line.trim(), body: [] };
      continue;
    }
    cur.body.push(line);
  }
  out.push(cur);
  return out;
}

/**
 * 그림 없이 연속으로 놓인 산문 문단의 최대 개수.
 *
 * **끊는 것**: 펜스 코드블록 · 표 · 시뮬 컴포넌트. 이 셋만 "그림"이다.
 * **안 끊는 것**: `$$…$$` 디스플레이 수식 · 인용 블록 · 불릿.
 *   수식이 끊게 두면 정의를 연달아 쓰고 그 사이를 수식으로 메워 통과할 수 있는데,
 *   그것이 voice 금지 목록의 "예시 없는 정의 연쇄" 바로 그 형태다.
 *   불릿·인용은 문단으로도 세지 않는다(중립).
 */
function maxProseRun(body: string[]): number {
  let run = 0;
  let worst = 0;
  let inFence = false;
  let inParagraph = false;
  let declDepth = 0;
  for (const line of body) {
    const s = line.trim();
    if (s.startsWith("```")) {
      inFence = !inFence;
      if (inFence) run = 0; // 그림이 나왔다 — 연속이 끊긴다
      inParagraph = false;
      continue;
    }
    if (inFence) continue;
    if (!s) {
      inParagraph = false;
      continue;
    }
    if (s.startsWith("|")) {
      run = 0; // 표도 그림으로 친다
      inParagraph = false;
      continue;
    }
    if (s.startsWith("<")) {
      run = 0; // 시뮬 컴포넌트 호출부
      inParagraph = false;
      continue;
    }
    // MDX 선언(`export const steps = [...]`, `import ...`)은 산문이 아니다.
    // 시뮬 데이터가 산문 문단으로 세어지면 `실행 시각화` 절이 통째로 거짓 양성이 된다.
    if (declDepth > 0 || /^(export|import)\b/.test(s)) {
      declDepth += (s.match(/[[{(]/g) ?? []).length;
      declDepth -= (s.match(/[\]})]/g) ?? []).length;
      if (declDepth < 0) declDepth = 0;
      inParagraph = false;
      continue;
    }
    if (/^[-*>]|^\d+\.|^\$\$/.test(s)) {
      inParagraph = false; // 중립 — 세지도 않고 끊지도 않는다
      continue;
    }
    if (!inParagraph) {
      inParagraph = true;
      run += 1;
      if (run > worst) worst = run;
    }
  }
  return worst;
}

function sectionBody(
  sections: { heading: string; body: string[] }[],
  headingPrefix: string,
): string[] | null {
  const hit = sections.find((s) => s.heading.startsWith(headingPrefix));
  return hit ? hit.body : null;
}

/** 펜스 코드블록 안쪽만 모은다 — 분기 라벨은 코드 주석에 있다. */
function fencedCode(body: string[]): string {
  const out: string[] = [];
  let inFence = false;
  for (const line of body) {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) out.push(line);
  }
  return out.join("\n");
}

function uniqueMatches(text: string, re: RegExp): Set<string> {
  return new Set(text.match(re) ?? []);
}

function analyze(file: string, text: string, maxRun: number): Report {
  const lines = text.split("\n");
  const sections = splitSections(lines);
  const name = file.split("/").slice(-2, -1)[0] ?? file;

  // ── R1: 절 단위 최대 연속 산문 문단 ──
  let maxRunSeen = 0;
  let worstSection = "";
  for (const s of sections) {
    const r = maxProseRun(s.body);
    if (r > maxRunSeen) {
      maxRunSeen = r;
      worstSection = s.heading;
    }
  }

  const traceBody = sectionBody(sections, TRACE_HEADING);
  const hasTrace = traceBody !== null;
  const traceText = traceBody?.join("\n") ?? "";

  // ── R2: trace 단계 수 vs 시뮬 프레임 수 ──
  const traceSteps = uniqueMatches(traceText, /\bT\d+\b/g).size;
  const simFrames = (text.match(/^\s*\{\s*$/gm) ?? []).length
    ? (text.match(/^\s{4}title:/gm) ?? []).length
    : (text.match(/\btitle:\s*["']/g) ?? []).length;

  // ── R3: 분기 피복 ──
  const implBody = sectionBody(sections, SECTION_IMPL);
  const implLabels = implBody
    ? uniqueMatches(fencedCode(implBody), CIRCLED)
    : new Set<string>();
  const traceLabels = uniqueMatches(traceText, CIRCLED);
  const covered = [...implLabels].filter((l) => traceLabels.has(l));

  // ── R4: 인용 결속 ──
  const clueBody = sectionBody(sections, SECTION_CLUE);
  const optBody = sectionBody(sections, SECTION_OPTCODE);
  const citeClue = clueBody
    ? uniqueMatches(clueBody.join("\n"), /\bT\d+\b/g).size
    : 0;
  const citeOptcode = optBody
    ? uniqueMatches(optBody.join("\n"), /\bT\d+\b/g).size
    : 0;

  // ── R5: forbid 문형 ──
  let forbidHits = 0;
  for (const re of FORBIDDEN) forbidHits += (text.match(re) ?? []).length;

  const findings: Finding[] = [];
  if (maxRunSeen > maxRun) {
    findings.push({
      code: "R1",
      message: `그림 없이 산문 ${maxRunSeen}문단 연속 (상한 ${maxRun}) — ${worstSection}`,
    });
  }
  if (hasTrace) {
    if (traceSteps < 6) {
      findings.push({
        code: "R2",
        message: `trace 단계가 ${traceSteps}개 — 6개 미만이면 굴린 것이 아니다`,
      });
    } else if (simFrames > 0 && traceSteps < simFrames) {
      findings.push({
        code: "R2",
        message: `trace 단계 ${traceSteps}개 < 시뮬 프레임 ${simFrames}개 — 시뮬보다 거칠다`,
      });
    }
    if (implLabels.size === 0) {
      findings.push({
        code: "R3",
        message:
          "impl 코드에 원문자 분기 라벨(①②③)이 없다 — trace 가 지목할 수단이 없다",
      });
    } else if (covered.length < implLabels.size) {
      const missing = [...implLabels].filter((l) => !traceLabels.has(l));
      findings.push({
        code: "R3",
        message: `분기 ${missing.join("")} 이 trace 에 한 번도 안 나온다 (${covered.length}/${implLabels.size})`,
      });
    }
    if (clueBody && citeClue === 0) {
      findings.push({
        code: "R4",
        message:
          "clue 절이 trace 단계 번호(T#)를 하나도 인용하지 않는다 — 관찰이 아니라 결론이다",
      });
    }
    if (optBody && citeOptcode === 0) {
      findings.push({
        code: "R4",
        message: "optcode 절이 trace 단계 번호(T#)를 하나도 인용하지 않는다",
      });
    }
  }
  if (forbidHits > 0) {
    findings.push({
      code: "R5",
      message: `voice forbid 문형 ${forbidHits}건 — 그 자리가 생략된 단계다`,
    });
  }

  return {
    file,
    name,
    maxProseRun: maxRunSeen,
    worstSection,
    traceSteps,
    simFrames,
    branchTotal: implLabels.size,
    branchCovered: covered.length,
    citeClue,
    citeOptcode,
    forbidHits,
    hasTrace,
    findings,
  };
}

const BASELINE_PATH = "tools/_baseline/guide-rhythm.tsv";

type Baseline = { run: number; forbid: number };

async function readBaseline(): Promise<Map<string, Baseline>> {
  const f = Bun.file(BASELINE_PATH);
  if (!(await f.exists())) return new Map();
  const out = new Map<string, Baseline>();
  for (const line of (await f.text()).split("\n")) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [file, run, forbid] = line.split("\t");
    if (file && run) {
      out.set(file, { run: Number(run), forbid: Number(forbid ?? 0) });
    }
  }
  return out;
}

async function main() {
  const argv = Bun.argv.slice(2);
  const tsv = argv.includes("--tsv");
  const writeBaseline = argv.includes("--write-baseline");
  const maxRunIdx = argv.indexOf("--max-run");
  const maxRun =
    maxRunIdx >= 0
      ? Number(argv[maxRunIdx + 1] ?? DEFAULT_MAX_RUN)
      : DEFAULT_MAX_RUN;
  const explicit = argv.filter(
    (a, i) => !a.startsWith("--") && !(maxRunIdx >= 0 && i === maxRunIdx + 1),
  );

  let files: string[];
  if (explicit.length > 0) {
    files = explicit;
  } else {
    files = [];
    for await (const p of new Glob("src/**/*-guide.mdx").scan(".")) {
      if (p.includes("_deprecated")) continue;
      files.push(p);
    }
    files.sort();
  }

  if (files.length === 0) {
    console.error("대상 가이드가 없다.");
    process.exit(2);
  }

  const reports: Report[] = [];
  for (const file of files) {
    const text = await Bun.file(file).text();
    reports.push(analyze(file, text, maxRun));
  }

  if (writeBaseline) {
    const rows = [
      "# file\tmax_prose_run\tforbid_hits — 래칫 기준선. 이보다 나빠지면 실패한다.",
      "# 재집필이 끝난 편은 이 파일에서 행을 지운다. 줄 수가 곧 남은 부채다.",
      "# forbid_hits 가 0 이 아닌 행은 voice 규칙 8 위반이 남아 있다는 뜻이다 — 재집필 때 펼쳐 쓴다.",
      ...reports.map((r) => `${r.file}\t${r.maxProseRun}\t${r.forbidHits}`),
    ];
    await Bun.write(BASELINE_PATH, `${rows.join("\n")}\n`);
    console.log(`baseline 기록: ${reports.length}편 → ${BASELINE_PATH}`);
    return;
  }

  if (tsv) {
    console.log(
      "file\tmax_prose_run\ttrace_steps\tsim_frames\tbranch_cover\tcite_clue\tcite_optcode\tforbid_hits",
    );
    for (const r of reports) {
      console.log(
        [
          r.file,
          r.maxProseRun,
          r.traceSteps,
          r.simFrames,
          `${r.branchCovered}/${r.branchTotal}`,
          r.citeClue,
          r.citeOptcode,
          r.forbidHits,
        ].join("\t"),
      );
    }
    return;
  }

  const baseline = await readBaseline();
  let failed = 0;

  for (const r of reports) {
    const base = baseline.get(r.file);
    // 래칫: baseline 에 있고 trace 절이 아직 없는 편은 "나빠지지 않았는가"만 본다.
    // trace 절이 생긴 편은 재집필된 것이므로 즉시 전 기준으로 넘어간다.
    const ratcheted = base !== undefined && !r.hasTrace;
    const findings = ratcheted
      ? r.findings.filter((f) => {
          if (f.code === "R1") return r.maxProseRun > base.run;
          if (f.code === "R5") return r.forbidHits > base.forbid;
          return true;
        })
      : r.findings;

    if (findings.length === 0) continue;
    failed += 1;
    console.log(`\n✗ ${r.file}`);
    if (ratcheted)
      console.log(`  (래칫 기준 ${base}문단 — trace 절이 없는 기존 편)`);
    for (const f of findings) console.log(`  ${f.code}  ${f.message}`);
  }

  const total = reports.length;
  const withTrace = reports.filter((r) => r.hasTrace).length;
  console.log(
    `\n${total}편 검사 — trace 절 있음 ${withTrace}편 · 위반 ${failed}편 · 통과 ${total - failed}편`,
  );
  if (baseline.size > 0) {
    console.log(`래칫 baseline ${baseline.size}편 남음 (재집필 부채)`);
  }
  if (failed > 0) {
    console.log(
      "\nR1 은 그림의 유무만 잰다 — 통과가 곧 설명이 좋다는 뜻은 아니다(Q6·절제 시험이 그것을 맡는다).",
    );
  }
  process.exit(failed > 0 ? 1 : 0);
}

await main();
