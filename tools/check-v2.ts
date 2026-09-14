/**
 * `algo-learn-guide` 골격 스캐너 — P1~P16, 그리고 번호가 안 붙은 둘.
 *
 * | 코드 | 무엇 |
 * | --- | --- |
 * | `SEC` | 어느 항목으로도 안 해소되는 헤딩. 여기서 걸리면 나머지 판정이 통째로 헛돈다 |
 * | `TBL` | 구분줄을 그렸는데 GFM 이 표를 안 세우는 자리 |
 *
 * 둘은 P 번호를 안 쓴다 — P 는 `SPEC.md` 의 규격 항목에 매인 번호이고, 이 둘은 규격 이전의
 * **문서가 문서로 서는가**를 본다.
 *
 * **기계로 셀 수 있는 것만** 잰다. 값이 실행 결과와 같은가는 `check-proof.ts` 가 보고, 산문이
 * 실제로 설명하는가(논증의 성립 · 반례의 타당성)는 사람이 본다 — `FEEDBACK.md` §3 이 그
 * 목록이다. 스캐너가 절반만 덮으면서 "잰다" 고 적으면 통과 표시가 실제보다 넓게 읽힌다 —
 * 이 저장소가 `check-guide-rhythm.ts:9-12` 에 이미 적어 둔 한계다.
 *
 * ```bash
 * bun run tools/check-v2.ts <guide.md>          # 한 편
 * bun run tools/check-v2.ts --json <guide.md>   # 기계 판독
 * ```
 *
 * 종료코드: 0 통과 · 1 위반 · 2 대상 없음/사용법
 */

import { basename, dirname, join } from "node:path";
import { headerDoc, parseContract } from "./contract-header.ts";
import { extract, GuideCoreError } from "./guide-core.ts";
import { kindOfOr } from "./guide-v2-targets.ts";
import { DIRECT_MEMORY, ESCALATION } from "./ord006-escalation.ts";
import {
  fences,
  first,
  type GuideKind,
  parseSections,
  pick,
  type Section,
} from "./section.ts";

export interface Finding {
  code: string;
  detail: string;
  where?: string;
  /**
   * **위반이 아니라 경고다.** 판정(`bad`)에 안 들어가고 화면에만 뜬다.
   *
   * 넓힌 규칙이 한꺼번에 수십 편을 빨갛게 만들면 다른 편을 닫는 세션이 자기 것이 아닌
   * 빨강을 본다 — `check-proof.ts` 가 2026-09-05 에 같은 이유로 경고 자리를 세웠다.
   * 경고는 **고친 뒤 위반으로 올린다.**
   */
  warn?: true;
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
export function maxProseRun(body: string[]): number {
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
 * **`deep.walk` 아래 절들의 코드 스니펫은 세지 않는다.** 전개는 소절마다 코드를 싣는 절이라,
 * 코드를 그림으로 세면 그 절들에서 P1·P7 이 통째로 무력해진다.
 */
const CODE_HEAVY = new Set([
  "deep.walk.step",
  "deep.walk.pause",
  "deep.walk.final",
]);

export function hasFigure(section: Section): boolean {
  const blocks = fences(section.body);
  const drawable = blocks.filter((b) => {
    if (!CODE_HEAVY.has(section.id)) return true;
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

/** `.sim.ts` 의 export 하나. */
export interface SimEntry {
  frames: number;
  result: string | null;
  /**
   * 프레임 제목을 **차례 그대로**. 없는 프레임은 `null` 이다.
   *
   * 제목 머리의 `T#` 가 그 프레임이 원고의 **어느 걸음**인지를 말한다. 수만 세면 자리는
   * 안 보인다 — `framePlacement` 가 그 자리를 잰다.
   */
  titles: (string | null)[];
}

export interface SimModule {
  /** export 키 → 그 안의 정보 */
  entries: Map<string, SimEntry>;
  /** 계약 위반 — 있으면 P3 은 통과가 아니라 **에러**다. */
  violations: string[];
}

/**
 * `.sim.ts` 를 정적으로 판다.
 *
 * **`steps` 는 인라인 배열 리터럴이어야 한다.** 실측: `steps: [...base, {t}]` 는 실제 3인데
 * 정적 계수가 **2로 센다.** 과소 계수는 P3(전개 T# ≥ 프레임 수)을 지나 **얇은 전개를
 * 통과시킨다** — 판정기가 판정을 못 하는 것보다 나쁘다. 그래서 위반은 경고가 아니라 에러다.
 */
export function parseSim(source: string): SimModule {
  const entries = new Map<string, SimEntry>();
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
        `${id}: \`steps\` 에 spread 가 있다 — 정적 계수가 실제보다 적게 세어 얇은 전개를 통과시킨다`,
      );
      continue;
    }

    const steps = topElements(arr);
    entries.set(id, {
      frames: steps.length,
      result: pickResult(block),
      titles: steps.map(frameTitle),
    });
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

/**
 * 배열 리터럴을 **최상위** 원소 문자열로 가른다. 중첩 객체 안의 쉼표는 안 가른다.
 *
 * 계수(`frames`)와 제목 읽기가 **같은 가르기**를 쓴다 — 둘이 따로 세면 「프레임 12개인데
 * 제목은 11개」 같은 자리에서 어느 쪽이 맞는지 판정기가 스스로 모른다.
 */
function topElements(arr: string): string[] {
  const inner = arr.slice(1, -1).trim();
  if (inner === "") return [];
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
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
    else if (ch === "," && depth === 0) {
      out.push(inner.slice(start, i));
      start = i + 1;
    }
  }
  // 후행 쉼표 뒤의 빈 조각은 원소가 아니다.
  const tail = inner.slice(start);
  if (tail.trim() !== "") out.push(tail);
  return out;
}

/**
 * 프레임 객체의 `title`. 없으면 `null`.
 *
 * **그 객체의 바로 아래 필드만 본다.** 정규식 첫 매치로 잡으면 `entries` · `nodes` 안에
 * 같은 이름의 필드가 생기는 날 걸음 자리를 엉뚱한 문자열에서 읽는다 — 그리고 그런 오독은
 * 화면에 「통과」로 뜬다.
 */
function frameTitle(element: string): string | null {
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < element.length; i++) {
    const ch = element[i];
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
    if (ch === "{" || ch === "[" || ch === "(") {
      depth++;
      continue;
    }
    if (ch === "}" || ch === "]" || ch === ")") {
      depth--;
      continue;
    }
    if (depth !== 1 || ch !== "t") continue;
    if (/[\w$]/.test(element[i - 1] ?? "")) continue;
    const m = /^title\s*:\s*["'`]/.exec(element.slice(i));
    if (m === null) continue;
    return readString(element, i + m[0].length - 1);
  }
  return null;
}

/** `at` 의 따옴표로 시작하는 문자열 리터럴의 내용. 안 닫히면 `null`. */
function readString(text: string, at: number): string | null {
  const q = text[at];
  if (q === undefined) return null;
  let out = "";
  for (let i = at + 1; i < text.length; i++) {
    const ch = text[i];
    if (ch === undefined) return null;
    if (ch === "\\") {
      out += text[i + 1] ?? "";
      i++;
      continue;
    }
    if (ch === q) return out;
    out += ch;
  }
  return null;
}

/** `result:` 값을 문자열로 뽑는다. 없으면 `null`. */
function pickResult(block: string): string | null {
  const m = /(^|[\s,{])result\s*:\s*([^\n]+?)\s*,?\s*$/m.exec(block);
  if (!m || m[2] === undefined) return null;
  return m[2].replace(/^["'`]|["'`]$/g, "").trim();
}

/* ──────────────── 프레임이 앉은 걸음 자리 — P3 ──────────────── */

/**
 * 프레임 제목이 가리키는 **걸음 구간**. `T7` 은 `[7,7]`, `T5~T6` 과 `T5~6` 은 `[5,6]` 이다.
 * 머리에 `T#` 가 없으면 `null`.
 *
 * **구간을 뜻하는 것은 물결표뿐이다.** 줄표(`—`)는 제목에서 자리와 설명을 가르는 자리에
 * 쓰인다 — `singleNumberXor` 의 `"T2 — 4 를 겹쳐 자리 2 가 켜진다"` 를 구간으로 읽으면
 * `[2,4]` 가 되고, 다음 프레임 `"T3 — 1 을…"` 이 `[3,1]` 이라 **거꾸로 겹친 것으로** 잡힌다.
 * 실제로 첫 판에서 그 편이 「오름차순이 아니다」로 걸렸고, 걸린 것은 원고가 아니라 이 regex
 * 였다.
 */
export function stepSpan(title: string): [number, number] | null {
  const m = /^T(\d+)(?:\s*[~〜]\s*T?(\d+))?(?![\w.])/.exec(title.trim());
  if (m?.[1] === undefined) return null;
  const from = Number(m[1]);
  const to = m[2] === undefined ? from : Number(m[2]);
  return [from, to];
}

/**
 * P3 — **프레임이 원고의 어느 걸음에 앉았는가.**
 *
 * 옛 P3 은 「`T#` 수 ≥ 프레임 수」 하나였다. **그것은 수만 센다** — 프레임 열둘이 원고의
 * 열넷 중 어느 열둘인지, 그중 원고에 없는 걸음을 가리키는 것이 있는지, 차례가 거꾸로인지를
 * 전부 못 본다. `maxBipartiteMatching` 이 열넷 중 열둘을 그리면서 옛 P3 을 그냥 지나갔다.
 *
 * **판정 세기가 둘이다.**
 *
 * | 무엇 | 왜 그 세기인가 | 심각도 |
 * | --- | --- | --- |
 * | 원고에 없는 걸음을 가리킨다 · 어느 걸음인지 제목이 안 밝힌다 · 차례가 거꾸로다 | 패널이 가리키는 자리를 독자가 원고에서 **못 찾는다.** 판단이 낄 데가 없다 | **위반** |
 * | 원고의 걸음을 안 그린다 | 안 그린 것이 곧 `viz` 를 손으로 고른 흔적이다. 111편에서 27편이라 한꺼번에 빨개진다 | 경고 |
 *
 * 경고 자리를 둔 근거는 `Finding.warn` 이 적은 그대로다 — **고친 뒤 위반으로 올린다.**
 * 그 고침의 방법이 `SPEC.md` §9 의 「`viz` 아래 걸음 표는 `.sim.ts` 에서 만든다」다.
 *
 * **피복은 「사이 구멍」이 아니라 원고 걸음 전부다.** 첫 판은 첫 프레임과 마지막 프레임
 * 사이만 봤는데, 그러면 `mosAlgorithm` 에서 `"T0"` 을 `"준비 — "` 로 고치자 **T1·T2 가
 * 경고에서 조용히 빠졌다** — 상관없는 자리를 고쳤더니 검사 범위가 줄어든 것이고, 그런 규칙은
 * 규칙이 아니다. export 를 여럿 둔 편(`prefixSumRangeQuery` 의 `build`·`answer`)은 **합집합**
 * 으로 덮으므로 늦게 시작하는 export 가 그 자체로 걸리지는 않는다.
 *
 * **번호가 붙기 전의 머리 프레임은 준비 프레임으로 본다.** `kthSmallest` 의 `"시작"` 이
 * 그것이고, 원고가 준비를 걸음으로 세지 않은 편에서 정당한 모양이다. 다만 **번호가 한 번
 * 붙은 뒤로는** 제목 없는 프레임이 위반이다 — 그 자리는 자리를 안 밝힌 것이지 준비가 아니다.
 *
 * @param walk `deep.walk` 가 실제로 인용한 걸음 번호
 */
export function framePlacement(
  sim: SimModule,
  walk: Set<number>,
  where: string,
): Finding[] {
  const findings: Finding[] = [];

  // 편 하나가 export 를 여럿 둘 수 있다(`prefixSumRangeQuery` 의 `build`·`answer`).
  // 건너뛴 걸음은 **다른 export 가 덮었으면 건너뛴 것이 아니다.**
  const covered = new Set<number>();
  for (const entry of sim.entries.values()) {
    for (const title of entry.titles) {
      const span = title === null ? null : stepSpan(title);
      if (span === null) continue;
      for (let n = span[0]; n <= span[1]; n++) covered.add(n);
    }
  }

  for (const [id, entry] of sim.entries) {
    const spans = entry.titles.map((t) => (t === null ? null : stepSpan(t)));
    const first = spans.findIndex((s) => s !== null);
    if (first < 0) {
      findings.push({
        code: "P3",
        where,
        detail: `\`${id}\` 의 프레임 제목이 걸음(\`T#\`)을 하나도 안 밝힌다 — 어느 프레임이 원고의 어느 걸음인지 대조할 수 없다`,
      });
      continue;
    }

    for (let i = first + 1; i < spans.length; i++) {
      if (spans[i] !== null) continue;
      findings.push({
        code: "P3",
        where,
        detail: `\`${id}\` 의 ${i + 1} 번째 프레임 "${entry.titles[i] ?? ""}" 이 어느 걸음인지 안 밝힌다 — 제목을 \`T#\` 로 연다`,
      });
    }

    const numbered = spans.filter((s): s is [number, number] => s !== null);
    const stray = [
      ...new Set(
        numbered.flatMap(([from, to]) => {
          const out: number[] = [];
          for (let n = from; n <= to; n++) if (!walk.has(n)) out.push(n);
          return out;
        }),
      ),
    ];
    if (stray.length > 0) {
      findings.push({
        code: "P3",
        where,
        detail: `\`${id}\` 의 프레임이 \`deep.walk\` 에 없는 걸음을 가리킨다 — ${stray.map((n) => `T${n}`).join("·")}`,
      });
    }

    for (let i = 1; i < numbered.length; i++) {
      const prev = numbered[i - 1] as [number, number];
      const cur = numbered[i] as [number, number];
      if (cur[0] > prev[1]) continue;
      findings.push({
        code: "P3",
        where,
        detail: `\`${id}\` 의 프레임 차례가 걸음 차례와 다르다 — T${prev[0]} 다음이 T${cur[0]} 다`,
      });
    }
  }

  // **피복은 편 단위로 한 번만 낸다.** export 마다 내면 같은 구멍이 두 줄로 뜨고, 그러면
  // 「어느 export 가 덜 그렸는가」로 읽힌다 — 구멍은 편에 하나다.
  const skipped = [...walk]
    .filter((n) => !covered.has(n))
    .sort((a, b) => a - b);
  if (skipped.length > 0) {
    findings.push({
      code: "P3",
      warn: true,
      where,
      detail: `\`.sim.ts\` 가 \`deep.walk\` 의 걸음을 안 그린다 — ${skipped.map((n) => `T${n}`).join("·")}. \`viz\` 아래 표를 \`.sim.ts\` 에서 만들면 자리가 갈릴 데가 없다(\`SPEC.md\` §9)`,
    });
  }

  return findings;
}

/* ────────────────────────── 판정 ────────────────────────── */

/**
 * 그림을 져야 하는 절.
 *
 * **2026-08-28 유저 지시로 `deep.proof`(정확성 논증)가 없어지고 `invariant`(불변식)가 그
 * 자리에 왔다.** 옛 `deep.proof` 는 그림 의무에서 빠져 있었다 — 논증에 억지로 도식을 넣으면
 * 빈 상자가 된다는 이유였다. `invariant` 는 다르다. 무엇이 매 단계 참으로 남는지를 **상태값
 * 으로** 보이는 절이고, 흡수한 `mistake` 의 직무(한 곳을 바꿔 잘못된 결과값을 보이기)도
 * 실행 결과 대조를 요구한다. 둘 다 그림이 있어야 성립한다.
 */
const FIGURE_REQUIRED = [
  "concept",
  "deep.build",
  "deep.walk.step",
  "deep.walk.pause",
  "invariant",
  "perf.derive",
  "perf.worst",
] as const;

/**
 * **있으면** 그림과 코드를 둘 다 져야 하는 절 — 2026-08-25 유저 지적으로 생겼다.
 *
 * *"아이디어 상세는 모든 과정과 과정 설명을 위한 ascii art, code를 친절하게 제공해야 한다"*.
 * `deep.math` 가 정의와 수식만 늘어놓고 **그 정의로 알고리즘이 도는 모습을 안 보인** 것이
 * 지적의 실체였다.
 *
 * `FIGURE_REQUIRED` 에 넣지 않는 이유는 `deep.math` 가 **조건부 절**이기 때문이다(`SPEC.md` §8).
 * 거기 넣으면 절이 없는 편에서 "절이 없다" 로 오탐한다. 여기서는 **있을 때만** 검사한다.
 *
 * 코드의 정의: `text`·`ascii`·태그 없음은 그림이지 코드가 아니다. 언어 태그가 붙은 펜스만 센다.
 */
const CONDITIONAL_FIGURE_AND_CODE = ["deep.math"] as const;

/**
 * **있으면 그림만** 져야 하는 절 — 2026-08-28 유저 지시로 생긴 `related`(알아 두면 좋은 개념).
 *
 * > *"추가적으로 알면 좋은 개념이 존재 할때만 선택적으로 part1 마지막에 포함해라."*
 *
 * 코드를 요구하지 않는 것은 이 절의 직무 때문이다 — **본문이 이미 값으로 보인 것에 이름을
 * 붙이는 자리**라 새 코드를 실을 곳이 아니다. 그림은 요구한다. 이름만 붙이고 끝나면 독자가
 * 그 이름을 다시 만났을 때 무엇이었는지 알아보지 못한다(`SPEC.md` `L35`).
 */
const CONDITIONAL_FIGURE_ONLY = ["related"] as const;

/**
 * **폐기된 항목이 소절 이름으로 되살아나는 것을 막는다.**
 *
 * 2026-08-25 3차 개정에서 `deep.trap`·`code`·`trace` 를 없앴는데, 첫 반영은 그 셋을
 * **`####` 소절로 옮겨 담기만** 했다. 헤딩만 한 단 내려간 것이라 문서에는 옛 항목이 그대로
 * 살아 있었고, 유저가 그것을 "지시 무시" 로 다시 지적했다. **이름이 남으면 직무도 남는다** —
 * 그러니 이름을 기계가 센다.
 *
 * `전체 코드` 는 예외다. R4 지시가 *"전개 과정의 마지막에는 전체 코드를 보여준다"* 로 그
 * 자리를 못 박았으므로 `deep.walk.final` 의 정당한 이름이다.
 */
const RETIRED_HEADING_WORDS = [
  "한 입력으로 끝까지",
  "굴려 보기",
  "굴려보기",
  "완성 코드",
  "수도 코드",
  "흔한 오해",
  "코드로 옮기기",
  // 2026-08-28 개정 — 제거·개명된 항목. 「전개」와 「최적인 자리」는 개명이라 옛 문구가
  // 통째로 돌아오는 것만 잡는다(부제 안의 낱말 "전개" 는 대상이 아니다).
  "정확성 논증",
  "이해 점검",
  "한 곳을 바꿔 보면",
  "## 전개 — ",
  "최적인 자리",
];

/**
 * **헤딩에 존댓말 종결을 쓰지 않는다** — 2026-08-28 유저 지적.
 *
 * > *"질의를 다시 정렬한다는 생각에 닿고, 코드가 도는 것까지 봅니다는 의미를 알 수 없는
 * > 표현이다"*
 *
 * `voice.md` 규칙 1 의 주석이 이미 막고 있던 것이다 — *"말 붙이는 어조는 본문에서 쓰고,
 * 소제목은 그 절이 무엇을 보이는지 그대로 적는다"*. 그 주석은 「컨테이너의 해부」에서
 * F5 위반 3건을 낳고 쓰였는데 **강제 지점이 없어서** 여기서 또 나왔다.
 *
 * `SPEC.md` §6 의 `L32` 다.
 *
 * **반말 평서 종결은 대상이 아니다.** 이 저장소의 헤딩 관례가 그것이다 —
 * `#### 2. 구역 크기를 정한다`·`### … 창 하나로 다섯 질의를 답한다`. 금지하는 것은 본문
 * 어조를 소제목으로 승격시키는 존댓말 종결 하나다.
 *
 * **이 검사가 못 잡는 것을 적어 둔다.** 지적의 「의미를 알 수 없다」는 어조만의 문제가
 * 아니었다 — "생각에 닿고" 라는 표현 자체가 모호했다. 그것은 의미 판정이라 기계로 세지
 * 않는다. `FEEDBACK.md` §3(사람이 봐야 하는 것)에 둔다.
 */
const HONORIFIC_HEADING =
  // **`니다` 로 잡는다.** 처음에는 `습니다|ㅂ니다` 로 적었다가 "봅니다" 를 놓쳤다 — 한글은
  // 받침이 음절에 붙으므로 `ㅂ니다` 라는 문자열은 어디에도 나오지 않는다(`봅` 은 한 글자다).
  // `니다` 로 끝나는 반말 종결은 없어서 오탐도 생기지 않는다.
  /(니다|해요|예요|에요|어요|아요|여요|까요|거예요|죠)\s*[.?!]?\s*$/;

/**
 * voice 금지 문형 — **기계로 잡히는 것만** 센다.
 *
 * `voice.json` 의 `forbid` 는 여덟인데 그중 넷("친절 장치로 깊이 대체" 류)은 의미 판정이라
 * 기계가 못 센다. **`voice.md` 목록은 셋뿐이라 원본이 서로 안 맞는다** — `voice.json` 을
 * 정본으로 쓴다.
 *
 * 마지막 항은 2026-08-25 유저 지적이다 — *"서다란 표현은 원래 사용법 이외의 은유적 표현으로
 * 사용하지 마라"*. 걸린 자리는 두 편의 「수식 정의와 유도」 도입부였다 — `mosAlgorithm` 의
 * "이렇게 서고", `quicksort` 의 "아래처럼 서고"(둘 다 고쳤다). **문자열 목록에 두면 "여기서 고르면" 같은
 * 정상 문장을 때린다** — 지시어나 주격 조사가 앞에 붙은 자리만 잡는 정규식으로 둔다.
 */
const FORBIDDEN: (string | RegExp)[] = [
  "성립해서",
  "임을 알 수 있습니다",
  "이를 반복 적용하면",
  "자명합니다",
];

/**
 * **은유 금지** — 2026-08-26 유저 지시.
 *
 * > *"은유 쓰지 마라. 싸다 비싸다, 지다 이기다, 서다 이런 은유 금지다. 최대한 단의적 표현만
 * > 사용해라. 보편적으로 자주 사용하는 표현과 단어를 최우선적으로 고려해라"*
 *
 * 다른 영역의 어휘로 추상 개념을 말하면 독자가 그 어휘의 원래 뜻과 옮겨진 뜻 사이에서 한 번 더
 * 해석해야 한다. 비용은 "비용이 크다", 우열은 "더 적다", 성립은 "성립한다" 로 적는다.
 *
 * **2026-08-28 유저가 기준을 다시 못박았다** — *"단의적 표현 우선, 실제로 자주 사용되는 표현
 * 우선을 기준으로 집필해야 한다"*. 은유가 아니어도 **뜻이 여럿인 말**이면 같은 부담을 준다.
 * 그 회차에 「돌다」(실행) 하나가 한 편에서 18곳이었다 — "도는 코드" · "돌린 결과" ·
 * "루프가 돈다". 여기 넣는 것은 **반복해서 나온 다의어**이고, 나머지는 `SPEC.md` §6 `L33`
 * 의 원칙으로 두고 사람이 본다. 목록을 넓히면 집필이 어휘 회피에 묶인다.
 *
 * **정의하고 쓰는 용어는 대상이 아니다.** 「창」·「구역」처럼 본문에서 정의한 이름은 그대로
 * 쓴다. 여기서 잡는 것은 정의 없이 비유로 쓴 서술어다.
 */
export const METAPHORS: { re: RegExp; label: string }[] = [
  {
    // **어미를 하나씩 적지 않는다.** 활용형 누락이 여덟 번 재발했고 마지막이 86 자리였다
    // (2026-09-04 전수 감사). 받침 앞까지만 적고, 받침·축약이 **음절을 바꾸는 꼴**만 따로
    // 적는다(`무너지`→`무너진다`). 앞이 한글이면 제외해 `감싸다` 오탐을 막는다.
    //
    // **어간화로도 안 닫히는 부류가 하나 남아 있었다(2026-09-05, 여섯째 재발).** 모음·ㄹ
    // 어간에 관형 `-ㄴ` 이나 미래 `-ㄹ` 이 붙으면 **음절이 합쳐져 어간 글자가 사라진다** —
    // `싸-`+`-ㄴ` = 「싼」, `싸-`+`-ㄹ` = 「쌀」. 어미를 어간으로 바꾼 것으로는 못 잡는다.
    // 아래 여섯 부류에 그 꼴을 더했고, **뒤 제한은 합쳐진 꼴에만 건다** — 그룹 전체에 걸면
    // 「싸게」가 안 잡힌다(넓히다 실제로 회귀 시험 넷을 빨갛게 만든 자리다).
    //
    // **「서다」의 관형형 「선」·「설」은 안 넓혔다.** 한자어 접두 「선-」(선수·선택·선형)과
    // 구별할 결정론적 방법이 없어 넓히면 오탐이 누락보다 커진다. 그 몫은 `SPEC.md` §6
    // `L33` 으로 남겨 사람이 본다.
    // **아홉째 재발(2026-09-09, `KAN-034.7` 검토 5항 반려).** 접두가 붙은 꼴이 리터럴과
    // 뒤보기 **사이**로 빠졌다 — 「비싼」은 앞 글자 「비」가 한글이라 뒤보기가 실패하고,
    // 리터럴 `비싸` 는 「비싸」로 시작하는 꼴만 잡아 「비싼」·「비쌉니다」·「비쌌」·「비쌀」이
    // 전부 통과했다. 살아 있는 원고 10자리가 그 상태였고 **스캐너 넷이 다 초록이었다** —
    // 브라우저로 원고를 열어 본 자리에서 사람 눈에 걸렸다. 접두를 묶고 활용형을 함께 적어
    // 닫는다. 실제 가격을 말하는 서술은 이 저장소 원고에 없어 오탐 위험이 작다.
    re: /(?<![가-힣])(?:싸|쌌|쌉)|(?<![가-힣])(?:싼|쌀)(?![가-힣])|(?:비|값)(?:싸|싼|쌉|쌌|쌀)/,
    label: '비용을 값으로 말한 은유 — "비용이 작다/크다" 로',
  },
  {
    // 어간 `이기` 는 계사 「…이기도」와 **같은 글자**라 목적격 조사 뒤에서만 본다.
    //
    // **`지는 쪽` 에는 앞 제외가 필요하다(2026-09-05).** 뒤보기가 없으면 `-지다` 로 끝나는
    // **모든 동사 어간 + 「쪽」**을 때린다 — 「가까워지는 쪽」·「멀어지는 쪽」·「작아지는 쪽」.
    // `treeRerooting` 집필에서 셋이 걸렸고, 거리·크기의 증감을 말하는 편이면 어디서나
    // 재발한다. 같은 규칙의 다른 갈래는 전부 이 뒤보기를 갖고 있었고 이 갈래만 없었다.
    re: /(?<=[을를]\s)(?:이기|이길)|이긴|이겼|이겨|승자|패자|(?<![가-힣])지는\s*쪽|겨루|겨룬|겨뤄/,
    label: '우열을 승부로 말한 은유 — "더 적다/우선한다" 로',
  },
  {
    // **읽는 뜻이 넷인 다의어다**(2026-09-10 `KAN-034.9` `S5`). 이 저장소 원고에서 같은
    // 글자가 ① 우열에서 뒤진다(「2.7 배 밀립니다」) ② 자리가 한 칸 옮겨진다(「뒤가 통째로
    // 밀린다」) ③ 시간이 뒤로 미뤄진다(「충돌이 뒤로 밀린다」) ④ 시간 단위(「100밀리초」)
    // 넷으로 읽힌다. `L33` 이 말하는 「독자가 한 번 더 해석해야 하는 말」의 표본이다.
    //
    // **능동형 `밀다` 는 이미 이동 갈래가 잡고 있었고 피동형만 빠져 있었다.** 그래서 우열과
    // 자리 이동 둘 다 이 한 줄로 닫고, 라벨에 두 고쳐 쓰기를 함께 적는다 — 갈래를 나눠 놓으면
    // 「한 칸씩 밀린다」에 「더 적다」라는 엉뚱한 처방이 붙는다.
    //
    // **어간 `밀리` 를 그대로 두지 않는다.** 「밀리초」·「비밀리에」와 글자가 같다. 「서다」가
    // 한 음절이라 어미 쪽을 적은 것과 같은 자리다 — **명사는 끝이 없고 어미는 닫힌 집합**이라
    // 어간 뒤에 올 수 있는 어미를 적는다. 음절이 합쳐지는 꼴(`밀리`+`-어` = 「밀려」,
    // +`-ㄴ` = 「밀린」, +`-ㄹ` = 「밀릴」, +`-ㅂ니다` = 「밀립니다」)은 따로 적는다.
    re: /밀리[고다며면지는기]|밀[려린릴렸립]/,
    label:
      '우열·자리 이동을 「밀리다」 로 말한 다의어 — "열세다/더 크다" 또는 "한 칸 옮겨진다" 로',
  },
  {
    // `서` 는 한 음절이라 뒤가 열려 있으면 「서로」·「서른」·「서버」를 때린다. 명사는 끝이
    // 없고 **어미는 닫힌 집합**이라, 어간 뒤에 올 수 있는 어미 쪽을 적는다.
    //
    // **관형형 「선」·「설」과 「서는데」는 안 넓혔다**(2026-09-10 `KAN-034.9` `S5` 재확인).
    // 게이트를 떼고 전수를 재니 문서 43자리가 걸리는데 그중 16이 「서지 사항」·「서지 정보」
    // (書誌)이고 6은 「앞서는데」다 — 「서는데」를 홀로 쓴 자리는 **0** 이다. 넓히면 잡는 것이
    // 없고 오탐만 는다. 그 몫은 `SPEC.md` §6 `L33` 으로 남겨 사람이 본다.
    re: /(?:이렇게|이처럼|아래처럼|다음처럼|위처럼|아래와 같이|[이가]\s)\s*(?:서[고며는면기서지야게라요]|서\s있|선다|섭니다|섰)/,
    label: "성립을 '서다' 로 말한 은유 — \"성립한다/만들어진다\" 로",
  },
  {
    // 어간 — 「터졌다」·「죽는」·「새는」이 샜다. 앞이 한글이면 제외한다.
    re: /무너|터[지진져질졌]|(?<![가-힣])(?:죽[는고어을면었은]|샌다|샌\s|샐(?![가-힣])|새[어는고]|샜)/,
    label: '실패를 다른 영역 어휘로 말한 은유 — "성립하지 않는다/실패한다" 로',
  },
  {
    re: /밟/,
    label: "실행을 '밟다' 로 말한 은유 — \"실행한다/거친다\" 로",
  },
  {
    // 어간 `돌리`·`돌려` — 「돌려」·「돌리는」·「돌린」·「돌면」이 샜다. **`돌려주다`(반환)와
    // `되돌리다`(자리 되돌리기)는 살려 둔다** — 앞은 표준 번역어라 뒤 음절로, 뒤는 이 문서가
    // 정의해 쓰는 이동 서술이라 `되-` 로 뺀다(`되돌아가다` 와 같은 부류다).
    //
    // **`돌아-` 는 안 넓혔다**(2026-09-10 `KAN-034.9` `S5` 실측). 전수로 84자리 · 35편인데
    // 실행을 뜻하는 자리는 하나뿐이고 나머지는 재귀에서 돌아오기 · 제자리로 돌아오는 사이클 ·
    // 출발점으로 돌아오는 투어 · 반시계로 돌아간 방향 · 앞 절로 돌아가기다. 자리 이동은 이
    // 규칙의 대상이 아니므로 넓히면 오탐이 98% 다.
    //
    // **회전을 뜻하는 「돌려」 4자리도 안 뺐다**(같은 실측). 목적어가 「순서」·「번호」인 꼴을
    // 빼자는 후보가 있었으나, ① `FEEDBACK.md` §4 의 「막을 것을 명사가 아니라 어미로 적는다」
    // 를 어긴다 ② 4자리 중 둘(「뒤집거나 돌려도」·「스물여섯을 돌려 쓴다」)은 그 예외로도 안
    // 빠진다 ③ 「순서를 돌려 본다」는 실행을 뜻하는 자리라 예외가 곧 구멍이 된다. 넷은 전부
    // 사이드카라 경고이지 위반이 아니다.
    re: /(?<![가-힣])(?:도는|돈다|돕니다|돌[면고지])|(?<!되)돌[리린릴]|(?<!되)돌려(?![주준줍줘줬줄])/,
    label: "실행을 '돌다' 로 말한 다의어 — \"동작한다/실행한다/반복한다\" 로",
  },
  {
    re: /훑/, // 어간 — 「훑었습니다」가 샜다(활용형 누락 다섯째)
    label: "순회를 '훑다' 로 말한 은유 — \"순회한다/차례로 읽는다\" 로",
  },
  {
    // 어간 — 「물러서다」·「밀어내다」·「밀고」·「흘러」가 샜다.
    re: /흐[르른릅]|흐를|흘러|(?<![가-힣])(?:물러|밀[어며고면]|민다|밉니다|놀[고다])|(?<![가-힣])(?:미는|노는)(?![가-힣])|논다/,
    label: '이동을 다른 영역 어휘로 말한 은유 — "이동한다/옮긴다" 로',
  },
  {
    // 어간 — 「드러나다」와 「한눈에 …다」가 샜다. `한눈에` 는 뒤를 안 막는다.
    re: /눈에\s*보[인이였]|드러[나난났날]|한눈에/,
    label: '이해를 시각으로 말한 은유 — "확인할 수 있다/확인된다" 로',
  },
  {
    // 어간 `얹`·`되짚`·`걸어 보`·`들고 다니` — 「…에 걸어」 18 · 「얹은」 12 · 「들고 다니는」
    // 7 이 샜다. `에 걸` 을 통째로 두면 「에 걸쳐」(범위)까지 걸리므로 뒤 한 글자를 막는다.
    re: /들고\s*다[니닌]|에\s*걸[면어고]|걸어\s*보|얹|되짚/,
    label:
      '적용·보관을 다른 영역 어휘로 말한 은유 — "적용한다/유지한다/거슬러 확인한다" 로',
  },
  {
    // **`닿다`(도달) 는 `SPEC.md` §6 `L33` 이 이름을 댄 다의어다.** 목록에 넣는 기준은
    // 「원고에서 반복해서 나왔는가」이고(L33), 파일럿 원고에서 4곳이었다 — `quicksort` 둘 ·
    // `knapsack01` 둘. 같이 이름이 오른 `짚다`·`잡히다` 는 각각 1곳·0곳이라 넣지 않았다.
    // 목록을 넓히면 집필이 어휘 회피에 묶인다는 것이 같은 규칙의 다른 절반이다.
    //
    // **앞이 한글이면 제외한다.** `맞닿` 이 그대로 걸린다.
    re: /(?<![가-힣])닿/,
    label: "도달을 '닿다' 로 말한 다의어 — \"도달한다/이른다\" 로",
  },
];

/**
 * 인용 구간을 지운다 — **큰따옴표 `"…"` 와 낫표 `「…」` 둘 다.**
 *
 * 인용 안의 금지 표현은 글쓴이의 문장이 아니라 **자료**다. 낫표를 함께 지우는 것은
 * 2026-08-28 `닿다` 를 목록에 넣으면서 필요해졌다 — 이 저장소는 규칙 정의와 옛 문구 인용을
 * 낫표로 적어서(`SPEC.md` §6 의 `L33` 표가 「닿다」를 예시로 든다), 낫표를 안 지우면
 * **규칙 정의 자체가 자기 규칙 위반으로 보고된다.** 본문에서 정의하고 쓰는 이름(「창」·
 * 「구역」)이 대상이 아니라는 `METAPHORS` 주석의 방침과도 같은 자리다.
 *
 * `openDouble` 이 참이면 줄 첫머리가 이미 큰따옴표 인용 안이다 — 인라인 인용은 줄을
 * 넘어간다(`SURVEY.md:50-51`). 낫표는 줄 안에서 닫히지 않으면 줄 끝까지 지운다.
 *
 * ## 이어받은 인용은 **그 줄에서 닫힐 때만** 인정한다 (2026-09-10 `KAN-034.9` `S5`)
 *
 * 부르는 쪽은 `"` 개수가 홀수인 줄마다 상태를 뒤집어 다음 줄로 넘긴다. 그래서 **짝이 안 맞는
 * `"` 하나가 그 뒤 모든 줄을 인용으로 만들어** 판정을 통째로 밀어 버렸다 — 걸려야 할 은유가
 * 조용히 0건이 된다. `check-metaphor` 도 같은 함수를 쓰므로 두 도구가 함께 걸렸다.
 *
 * 막는 법은 **이어받기를 한 줄로 가두는 것**이다. 이어받은 줄에 닫는 `"` 가 없으면 그 줄은
 * 인용이 아니다 — 인라인 인용은 이어지는 줄에서 닫히기 때문이다(`SURVEY.md:50-51` 이 그
 * 모양이다). 실측으로 고른 값이다: 111편 + 규격 문서 + 사이드카 전수에서 **이어받기를 통째로
 * 껐을 때 새로 걸리는 자리가 `SURVEY.md:51` 하나뿐**이었고, 그 한 줄이 바로 닫는 `"` 를 가진
 * 줄이다. 곧 이 조건은 **지켜야 할 자리를 전부 지키면서** 폭주만 없앤다.
 */
export function stripQuotes(line: string, openDouble: boolean): string {
  let out = "";
  // 이어받은 인용은 이 줄이 닫을 때만 산다. 닫는 `"` 가 없으면 글쓴이의 문장으로 본다.
  let inDouble = openDouble && line.includes('"');
  let inCorner = false;
  for (const ch of line) {
    if (ch === '"') {
      inDouble = !inDouble;
      out += " ";
      continue;
    }
    if (ch === "「") {
      inCorner = true;
      out += " ";
      continue;
    }
    if (ch === "」") {
      inCorner = false;
      out += " ";
      continue;
    }
    out += inDouble || inCorner ? " " : ch;
  }
  return out;
}

/**
 * **표기 혼용** — 2026-08-26 유저 지적.
 *
 * > *"[0,1]에서 시작한다면서 왜 아래 창은 [1,1]에서 시작해서 [1,3]으로 끝나냐"*
 *
 * `창 [0,1]` 은 **인덱스 구간**이고 `창 [1 1]` 은 **그 구간의 값**인데, 같은 대괄호로 적어서
 * 독자가 같은 것을 가리키는 줄로 읽었다. 한 문서에서 같은 대상을 두 표기로 적지 않는다.
 *
 * 규칙: 구간은 `[a,b]`(쉼표), 값은 대괄호 없이 나열하거나 「값」 이라고 밝혀 적는다.
 */
const NOTATION = [
  {
    re: /(창|구간|구역|범위)\s*`?\[\s*\d+(\s+\d+)+\s*\]/,
    label:
      "구간을 가리키는 말에 값 나열을 붙였다 — 구간은 `[a,b]`(쉼표), 값은 「값 1 1 2」 로",
  },
];

/**
 * **라벨 좌표 표기 정합** — 2026-08-27 유저 지적.
 *
 * > *"L272에서 정의한 쿼리 키가 뒤에 나오는 쿼리 키와 다르게 나타난다. 이를 포함해서 전개
 * > 과정에서 정합성이 무너지지 않도록 보장해라"*
 *
 * 「수식 정의와 유도」가 정렬 결과를 `Q3(0,3)`(키 값)로 적고 전개 절이 같은 자리를
 * `Q3[1,3]`(구간)로 적었다. 라벨은 같은데 숫자가 달라, 독자는 뒤에서 키가 바뀐 것으로 읽는다.
 * 라인 단위인 `NOTATION` 으로는 못 잡는다 — **두 표기가 200줄 떨어져 있기 때문**이다.
 *
 * 규칙 둘. 한 문서에서 ① 같은 라벨에 대괄호와 소괄호를 섞지 않고 ② 같은 라벨에 서로 다른
 * 좌표를 붙이지 않는다. 두 벌을 나란히 보여야 하면 라벨에 붙이지 말고 칸을 나눈다.
 *
 * **좌표쌍만 본다.** `[5 2 3 1]`(값 나열)이나 `L10(그림 의무)`(규칙 참조)는 대상이 아니다 —
 * 쉼표로 갈린 두 정수여야 걸린다.
 */
const LABEL_PAIR =
  /\b([A-Z][A-Za-z]?\d+) *(\[ *-?\d+ *, *-?\d+ *\]|\( *-?\d+ *, *-?\d+ *\))/g;

export function labelPairNotation(text: string): Finding[] {
  /** 라벨 → (정규화한 표기 → 처음 나온 줄). */
  const seen = new Map<string, Map<string, number>>();
  for (const [index, line] of text.split("\n").entries()) {
    for (const hit of line.matchAll(LABEL_PAIR)) {
      const label = hit[1];
      const pair = hit[2];
      if (label === undefined || pair === undefined) continue;
      const norm = pair.replace(/ /g, "");
      const bucket = seen.get(label) ?? new Map<string, number>();
      if (!bucket.has(norm)) bucket.set(norm, index + 1);
      seen.set(label, bucket);
    }
  }

  const findings: Finding[] = [];
  for (const [label, bucket] of seen) {
    if (bucket.size < 2) continue;
    const forms = [...bucket.entries()];
    const shapes = new Set(
      forms.map(([f]) => (f.startsWith("[") ? "[]" : "()")),
    );
    const mixed = shapes.size > 1;
    const shown = forms
      .map(([f, line]) => `${label}${f}(:${line})`)
      .join(" ≠ ");
    findings.push({
      code: "P2",
      where: `:${forms[1]?.[1] ?? forms[0]?.[1] ?? 0}`,
      detail: mixed
        ? `라벨 표기 혼용 — ${shown}. 한 라벨에 대괄호와 소괄호를 섞지 않는다`
        : `라벨 좌표 불일치 — ${shown}. 같은 라벨에 다른 좌표를 붙이지 않는다`,
    });
  }
  return findings;
}

/* ────────────────────── 기호 규약 — P11·P12·P13 ────────────────────── */

/**
 * `| 기호 | … |` 헤더로 시작하는 표. `deep.build` ① 의 기호표와 `deep.math` 의 기호표가
 * 같은 꼴이라 둘 다 걸린다.
 *
 * **기호 이름은 표기를 벗겨 비교한다** — 같은 `n` 이 파트 1 에서는 `` `n` ``, `deep.math`
 * 에서는 `$n$` 으로 적힌다. 한 칸에 둘을 적는 관례(`` `l` · `r` ``)도 갈라 담는다.
 */
export interface SymbolTable {
  line: number;
  symbols: string[];
  rows: { raw: string; gloss: string }[];
}

/** `` `n` `` · `$n$` · `$w_i$` 에서 표기를 벗긴다. */
function bareSymbol(cell: string): string[] {
  const out: string[] = [];
  for (const m of cell.matchAll(/`([^`]+)`|\$([^$]+)\$/g)) {
    const t = (m[1] ?? m[2] ?? "").trim();
    if (t !== "") out.push(t);
  }
  return out.length > 0 ? out : [cell.trim()].filter((t) => t !== "");
}

export function symbolTables(text: string): SymbolTable[] {
  const lines = text.split("\n");
  const tables: SymbolTable[] = [];
  for (const [index, line] of lines.entries()) {
    if (!/^\|\s*기호\s*\|/.test(line)) continue;
    const rows: { raw: string; gloss: string }[] = [];
    const symbols: string[] = [];
    for (let j = index + 2; j < lines.length; j++) {
      const row = lines[j];
      if (row === undefined || !row.startsWith("|")) break;
      const cells = row
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      const raw = cells[0] ?? "";
      rows.push({ raw, gloss: cells.slice(1).join(" ") });
      symbols.push(...bareSymbol(raw));
    }
    tables.push({ line: index + 1, symbols, rows });
  }
  return tables;
}

/** 「기호는 여섯」 의 수사. 아라비아 숫자도 받는다. */
const COUNT_WORDS: Record<string, number> = {
  하나: 1,
  둘: 2,
  셋: 3,
  넷: 4,
  다섯: 5,
  여섯: 6,
  일곱: 7,
  여덟: 8,
  아홉: 9,
  열: 10,
};

/**
 * P11 (`L38`) — **기호를 몇 개 쓴다고 적었으면 표가 그만큼이어야 한다.**
 *
 * §3 이 사람에게 맡겨 둔 「그 절이 쓰는 기호가 전부 앞에서 정의됐는가」 중 실행으로 내릴 수
 * 있는 몫이다. 전수인지는 못 잰다 — 파생 기호는 처음 쓰는 그 자리에서 정의하는 것이 규격이라
 * (`SPEC` `L21`: "그 자리 또는 앞에서"), 표 밖의 기호를 위반으로 세면 규칙이 원고와
 * 어긋난다(`mosAlgorithm` 의 `B`·`blk`, `quicksort` 의 `p`·`k` 가 그 자리다).
 *
 * 잴 수 있는 것은 **선언과 표가 어긋나는 것**이다. 기호를 하나 더 쓰기로 하고 표에만 넣으면
 * 「여섯」 이 남아 독자가 세다가 멈춘다. 선언이 없으면 미실행이다.
 */
export function symbolCountDeclaration(text: string): Finding[] {
  const tables = symbolTables(text);
  const head = tables[0];
  if (head === undefined) return [];

  const findings: Finding[] = [];
  for (const [index, line] of text.split("\n").entries()) {
    const hit =
      /기호는\s*([가-힣]+|\d+)\s*(?:개)?(?:이에요|예요|입니다|이다|다)/.exec(
        line,
      );
    if (hit === null) continue;
    const word = hit[1] ?? "";
    const want = /^\d+$/.test(word) ? Number(word) : COUNT_WORDS[word];
    if (want === undefined) continue;
    if (want !== head.rows.length) {
      findings.push({
        code: "P11",
        where: `:${index + 1}`,
        detail: `기호 개수 선언과 표가 어긋난다 — 본문 「${word}」 ≠ 기호표 ${head.rows.length}행(:${head.line})`,
      });
    }
    break; // 선언은 기호표 하나당 한 번이다. 첫 줄만 본다
  }
  return findings;
}

/**
 * P12 (`L39`) — **식 ↔ 코드 이름의 대응을 밝혔으면 그 이름이 코드에 실재해야 한다.**
 *
 * §3 의 「같은 값의 코드 식별자가 한 벌인가 — 식 `B` ↔ 코드 `block` 의 대응을 한 자리에서
 * 밝혔는가」 중 실행 몫이다. **대응을 밝혔는가는 안 잰다** — 밝힐 자리가 있는 편과 없는 편이
 * 갈리고(`babyStepGiantStep` 은 식과 코드가 같은 이름이라 밝힐 것이 없다), 있어야 한다고
 * 세면 없는 편이 문장을 끼워 넣는 쪽으로 간다(R19-1 이 그 실패다).
 *
 * 잴 수 있는 것은 **밝힌 이름이 실제로 그 이름인가**다. 코드를 고치면서 산문의 대응을 안
 * 고치면 그 한 줄이 조용히 거짓이 된다.
 */
/**
 * **다음 줄이 `코드에서` 와 한 문장인가.** 아니면 `false` 다.
 *
 * 한 줄을 더 보는 것은 문장이 줄바꿈으로 이어지는 관례 때문인데, **줄바꿈이 곧 문장의
 * 이어짐은 아니다.** 마크다운에서 다음 줄이 새 구조 단위로 시작하면 그것은 별개 항목이고,
 * 거기 있는 이름은 `코드에서` 가 지목한 이름이 아니다.
 *
 * 실측(2026-09-10 `KAN-034.9` `S2` · `B5`, 배치9·10·11 에서 세 번 났다) — 기호표의 한 행이
 * 「… 코드에서는 \`blockSize\`」 로 끝나면 **다음 행의 첫 칸**이 그 문장에 딸려 들어갔다.
 * 표에 코드 대응을 적는 관행 자체가 그래서 막혔다.
 */
export function continuesSentence(next: string | undefined): boolean {
  if (next === undefined) return false;
  const t = next.trim();
  if (t === "") return false; // 빈 줄이 문단을 끊는다
  if (t.startsWith("|")) return false; // 표의 다음 행
  if (t.startsWith("#")) return false; // 헤딩
  if (t.startsWith("```") || t.startsWith("~~~")) return false; // 펜스
  if (t.startsWith(">")) return false; // 인용
  if (/^([-*+]|\d+\.)\s/.test(t)) return false; // 목록의 다음 항목
  return true;
}

/**
 * `코드에서` 가 지목하는 범위. **표 행 안에서는 그 칸을 넘지 않는다** — 옆 칸은 다른 열이라
 * 같은 문장이 아니다.
 */
function mappingSpan(lines: string[], index: number, at: number): string {
  const line = lines[index] ?? "";
  if (isFigureLine(line, false)) {
    const rest = line.slice(at);
    const bar = rest.indexOf("|");
    return bar < 0 ? rest : rest.slice(0, bar);
  }
  const next = lines[index + 1];
  return continuesSentence(next)
    ? `${line.slice(at)}\n${next}`
    : line.slice(at);
}

/**
 * 본문이 내미는 수의 집합. `P10` 이 `.bench.json` 실측값을 여기서 찾는다.
 *
 * **음수를 읽는다**(2026-09-10 `KAN-034.9` `S2` · `B6`). 예전 정규식은 부호 자리를 아예 안 두어
 * 계수가 음수인 편은 본문에 그대로 적어도 「실측값이 본문에 없다」로 걸렸다 —
 * `expectedValueDp` 가 계수를 둘로 갈라 적은 것이 그 우회의 흔적이다.
 *
 * **뺄셈은 음수가 아니다.** `n-1` 의 `-1` 을 음수로 읽으면 본문에 없는 값이 있는 것이 되어
 * 위반을 놓친다. 그래서 `-` 앞이 단어 문자·닫는 괄호·닫는 대괄호면 부호로 안 센다.
 */
export function bodyNumbers(text: string): Set<string> {
  const out = new Set<string>();
  for (const m of text.matchAll(/(?<![\w)\]])-?\d[\d,]*/g)) {
    out.add(m[0].replaceAll(",", ""));
  }
  return out;
}

export function codeNameMapping(text: string): Finding[] {
  const lines = text.split("\n");

  // 대상은 실제 코드 펜스뿐이다. `text` 펜스는 그림이라 식별자의 실재를 못 증언한다.
  const code: string[] = [];
  let fence: string | null = null;
  for (const line of lines) {
    const open = /^\s*```(\w*)/.exec(line);
    if (open !== null) {
      if (fence === null) fence = open[1] ?? "";
      else fence = null;
      continue;
    }
    if (fence === "ts" || fence === "js" || fence === "tsx") code.push(line);
  }
  const codeText = code.join("\n");

  const findings: Finding[] = [];
  for (const [index, line] of lines.entries()) {
    const at = line.indexOf("코드에서");
    if (at < 0) continue;
    const span = mappingSpan(lines, index, at);
    const named = new Set<string>();
    for (const m of span.matchAll(/`([A-Za-z_][A-Za-z0-9_]*)`/g)) {
      if (m[1] !== undefined) named.add(m[1]);
    }
    for (const name of named) {
      if (new RegExp(`\\b${name}\\b`).test(codeText)) continue;
      findings.push({
        code: "P12",
        where: `:${index + 1}`,
        detail: `코드 이름 대응이 코드에 없다 — 「코드에서는 \`${name}\`」 이라 적었지만 코드 펜스에 \`${name}\` 이 없다`,
      });
    }
  }
  return findings;
}

/**
 * P13 (`L40`) — **이름을 정의한 뒤 그 정의식으로 되풀어 쓰지 않는다.**
 *
 * §3 의 「정의한 이름(`blk`)을 뒤 절이 그대로 쓰는가, 정의식(`⌊l/B⌋`)으로 풀어 다시 적지
 * 않았는가」다. 이름을 세워 놓고 뒤에서 식을 다시 펴면 독자는 그 둘이 같은 것인지 매번
 * 대조해야 한다.
 *
 * **디스플레이 수식에서 `\operatorname{…}(…) = …` 꼴로 정의한 것만 본다.** 정의로 읽히는
 * 꼴을 좁게 잡아야 산문의 우연한 일치를 안 잡는다. 검산은 값을 넣는 자리라 식이 아니라 수가
 * 오므로 여기 안 걸린다.
 */
function normalizeMath(s: string): string {
  return s
    .replaceAll(/\\left|\\right|\\!|\\,|;|\\:|\\quad|\\qquad|\\ /g, "")
    .replaceAll(/\s+/g, "");
}

export function definitionRestated(text: string): Finding[] {
  const findings: Finding[] = [];
  // 디스플레이 수식 블록을 위치와 함께 걷는다.
  for (const block of text.matchAll(/\$\$([\s\S]*?)\$\$/g)) {
    const body = block[1] ?? "";
    const start = block.index ?? 0;
    for (const def of body.matchAll(
      /\\operatorname\{(\w+)\}\s*\([^)]*\)[\s]*(?:\\[;,:!])*[\s]*=[\s]*(?:\\[;,:!])*[\s]*(.+?)(?:\\qquad|\\quad|$)/gm,
    )) {
      const name = def[1] ?? "";
      const rhs = normalizeMath(def[2] ?? "");
      // 한 토막짜리 우변은 정의라기보다 치환이라 오탐이 된다.
      if (rhs.length < 8) continue;
      const after = normalizeMath(text.slice(start + (block[0]?.length ?? 0)));
      if (!after.includes(rhs)) continue;
      const line = text.slice(0, start).split("\n").length;
      findings.push({
        code: "P13",
        where: `:${line}`,
        detail: `정의식을 뒤에서 되풀어 썼다 — \`${name}\` 으로 이름을 세웠으면 그 이름으로 쓴다`,
      });
    }
  }
  return findings;
}

/* ─────────── 원고 ↔ 정본 대조 — P16 ─────────── */

/**
 * 주석을 걷는다 — 블록(`/* … *\/`)도 줄(`//`)도.
 *
 * **문자열·템플릿 안의 `//` 를 주석으로 보면 코드가 잘린다.** 그래서 정규식이 아니라 문자
 * 단위로 훑는다. 원고 코드는 정본의 JSDoc 을 짧은 인라인 주석으로 바꾼 사본이라(`convexHull`),
 * 주석을 남긴 채 대조하면 그 차이가 전부 위반이 된다 — 이 검사가 보려는 것은 **코드**다.
 */
export function stripComments(src: string): string {
  let out = "";
  let quote: string | null = null;
  let i = 0;
  while (i < src.length) {
    const c = src[i] as string;
    const d = src[i + 1] ?? "";
    if (quote !== null) {
      out += c;
      if (c === "\\") {
        out += d;
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === "/" && d === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && d === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    out += c;
    i++;
  }
  return out;
}

/** 주석을 걷고 빈 줄을 접는다. 남는 것이 코드의 줄 모양이다. */
export function normalizeCode(src: string): string {
  return stripComments(src)
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== "")
    .join("\n")
    .trim();
}

/**
 * ds 정본에서 **「전체 코드」로 대조할 코드**를 뽑는다 — `guide:core` 구간 **전부**를 등장 순서로.
 *
 * 처음에는 `class` 이름 구간 하나만 뽑았다(`KAN-035` `S3`). 파일럿 첫 편 `linear/deque` 에서
 * 그 가정이 실측과 어긋난 것이 드러났다 — ds 정본 35편 중 **7편은 이름 없는 구간**이라 `class`
 * 구간이 아예 없고, **20편은 `types` 구간을 따로** 두어 `class` 만 뽑으면 원고의 전체 코드가
 * 타입 선언만큼 길다고 판정된다. 「전체 코드」는 정본이 가이드에 내놓은 구간 전부이므로, 구간
 * 이름을 고르지 않는다. 가이드의 펜스도 `#이름` 없이 파일 전체를 가리킨다(`ds SPEC` `L43`).
 */
export function dsReferenceCode(source: string, where: string): string {
  return extract(source, where);
}

/**
 * P16 (`L9`) — **원고의 전체 코드가 정본(`.ref.ts`)과 같은가.**
 *
 * `SPEC.md` 가 「`<name>-guide.ref.ts` 에서 옮긴다」고 정한 자리인데 **지금까지 어떤 도구도
 * 그 둘을 대조하지 않았다.** 그래서 정본을 린터가 고치면 원고에 실린 전체 코드가 조용히
 * 낡는다 — 스캐너 넷이 전부 초록이고 손으로 `diff` 해야만 잡힌다(`pointInPolygon` 에서 다섯
 * 자리, W3 배치3).
 *
 * **주석은 걷고 대조한다.** 원고는 정본의 JSDoc 을 짧은 인라인 주석으로 바꾼 사본이라,
 * 주석을 남기면 정상인 편이 전부 걸린다. 걷고 나면 남는 것은 코드의 줄 모양이고 그것이
 * 린터가 바꾸는 자리다.
 *
 * 정본이 없으면 **미실행**이다. 값을 지어내 판정을 흉내내지 않는다.
 */
export function finalCodeMatchesRef(
  sections: Section[],
  ref: string,
): Finding[] {
  const finals = pick(sections, "deep.walk.final");
  if (finals.length === 0) return [];
  const code: string[] = [];
  for (const sec of finals) {
    for (const block of fences(sec.body)) {
      // 정보 문자열의 **첫 낱말**이 언어다. ds 원고는 `ts guide-core=<정본>` 으로 추출 출처를
      // 함께 적으므로, 문자열 전체를 `ts` 와 견주면 ds 의 전체 코드가 「펜스 없음」으로 걸린다.
      const lang = block.lang.split(/\s+/)[0];
      if (lang === "ts" || lang === "typescript") {
        code.push(block.lines.join("\n"));
      }
    }
  }
  if (code.length === 0) {
    return [
      {
        code: "P16",
        detail:
          "`deep.walk.final` 에 `ts` 코드 펜스가 없다 — 정본과 대조할 것이 없다",
      },
    ];
  }
  const got = normalizeCode(code.join("\n"));
  const want = normalizeCode(ref);
  if (got === want) return [];

  const a = got.split("\n");
  const b = want.split("\n");
  let at = 0;
  while (at < a.length && at < b.length && a[at] === b[at]) at++;
  const mine = a[at];
  const theirs = b[at];
  const where =
    mine === undefined
      ? `정본에는 ${b.length - a.length} 줄이 더 있다 — 첫 줄은 \`${theirs}\``
      : theirs === undefined
        ? `원고에 ${a.length - b.length} 줄이 더 있다 — 첫 줄은 \`${mine}\``
        : `${at + 1} 번째 줄부터 갈린다 — 원고 \`${mine}\` · 정본 \`${theirs}\``;
  return [
    {
      code: "P16",
      detail: `전체 코드가 정본(\`.ref.ts\`)과 다르다. ${where}. 정본에 \`biome check --write\` 를 먼저 돌리고 그 결과를 옮긴다`,
    },
  ];
}

/* ──────────────── 자료구조 전용 — P17 · P18 · P19 ──────────────── */

/**
 * **P17 — 연산 피복**(`ds SPEC` `L41`).
 *
 * 자료구조는 연산이 복수라, 알고리즘처럼 절차 하나를 굴리는 것으로 끝나지 않는다. 계약
 * 헤더의 연산 표에 있는 연산이 전개에서 한 번도 안 다뤄지면 독자는 그 연산을 모른 채
 * 나간다. 요청서가 분량을 면제한 자리가 정확히 여기다.
 *
 * **이 검사는 이름의 등장만 본다.** 그 연산을 실제로 굴렸는가 · 묶은 근거가 옳은가는
 * 사람이 본다 — 기계가 하는 척하지 않는다(`algo SPEC` §0 과 같은 태도).
 */
export function operationCoverage(
  sections: Section[],
  ops: string[],
): Finding[] {
  const steps = pick(sections, "deep.walk.step");
  if (steps.length === 0 || ops.length === 0) return [];
  const hay = steps.map((s) => `${s.heading}\n${s.body.join("\n")}`).join("\n");
  const absent = ops.filter((op) => !new RegExp(`\\b${op}\\b`).test(hay));
  if (absent.length === 0) return [];
  return [
    {
      code: "P17",
      detail: `계약 표의 연산이 전개에 한 번도 안 나온다: ${absent.join("·")}. 묶어서 다뤘으면 그 벌의 첫 문장에 묶은 근거를 적고 연산 이름을 함께 쓴다`,
    },
  ];
}

/**
 * **P18 — 계약 표를 복사하지 않는다**(`ds SPEC` `L42`).
 *
 * 계약의 정본은 `<name>.ts` 헤더 한 곳이고, 가이드는 조건이 아니라 **조건의 이유**를 쓴다.
 * 표를 옮겨 적으면 정본이 둘이 되고, 갈라진 자리에서 가이드가 코드보다 낙관적인 복잡도를
 * 주장한 것이 이 트랙을 한 번 재설계하게 만든 결함이다.
 *
 * **판정은 「한 표 안에 계약 연산이 과반 + 상한 표기」다.** 연산 하나의 비용을 표로 따지는
 * 것은 `perf.bounds` 의 정당한 직무라(`L7` 이 케이스와 경계를 두 축으로 가르라고 한다),
 * 그것과 가르는 신호가 **목록성**이다. 작은 계약에서 오탐이 나지 않게 최소 3개를 함께 건다.
 */
export function noContractTableCopy(
  sections: Section[],
  ops: string[],
): Finding[] {
  if (ops.length === 0) return [];
  const need = Math.max(3, Math.ceil(ops.length / 2));
  const out: Finding[] = [];
  for (const sec of sections) {
    let rows: string[] = [];
    for (const line of sec.body) {
      const trimmed = line.trim();
      if (trimmed.startsWith("|")) {
        rows.push(trimmed);
        continue;
      }
      out.push(...judgeTable(sec, rows, ops, need));
      rows = [];
    }
    out.push(...judgeTable(sec, rows, ops, need));
  }
  return out;
}

function judgeTable(
  sec: Section,
  rows: string[],
  ops: string[],
  need: number,
): Finding[] {
  if (rows.length === 0) return [];
  const table = rows.join("\n");
  if (!/O\(/.test(table)) return [];
  const hit = ops.filter((op) => new RegExp(`\\b${op}\\b`).test(table));
  if (hit.length < need) return [];
  return [
    {
      code: "P18",
      detail: `${sec.heading}(${sec.line}줄) — 계약 표를 옮겨 적었다(연산 ${hit.length}개 + 상한 표기가 한 표에 있다). 정본은 \`<name>.ts\` 헤더 한 곳이고, 여기서는 조건이 아니라 **조건의 이유**를 쓴다`,
    },
  ];
}

/**
 * **P19 — 에스컬레이션 절은 규약4 등급이 켠다**(`ds SPEC` `L45`).
 *
 * 조건이 판단이 아니라 **이미 확정된 등급**이므로 집필자가 고르지 않는다
 * (`docs/ORD-006-conventions.md:1253-1280`). 그래서 양방향으로 잰다 — (가)·(나)인데 절이
 * 없어도 위반이고, (-)인데 절이 있어도 위반이다. 조건부 절 규약이 「있으면 더 좋다」가
 * 아니라 「없으면 빼라」인 것과 같은 자리다.
 */
export function escalationSection(
  sections: Section[],
  grade: "req" | "opt" | "-",
): Finding[] {
  const has = pick(sections, "perf.escalation").length > 0;
  const should = grade !== "-";
  if (has === should) return [];
  return [
    {
      code: "P19",
      detail: should
        ? `규약4 등급이 ${grade === "req" ? "(가)" : "(나)"} 인데 \`perf.escalation\` 절이 없다 — 등급이 절을 켠다(집필자가 고르지 않는다)`
        : "규약4 등급이 (-) 인데 `perf.escalation` 절이 있다 — (-) 면 절 자체를 생략한다",
    },
  ];
}

/**
 * **P20 — 메모리를 직접 다뤄야 이득이 생기는 구조는 전개에 Rust 구현을 싣는다**(`ds SPEC` `L47`).
 *
 * P19 와 같은 모양이다. 싣는지는 집필자가 고르지 않고 `tools/ord006-escalation.ts` 의
 * `DIRECT_MEMORY` 가 정한다. 그래서 양방향으로 잰다 — 집합에 든 구조의 `deep.walk` 에
 * `rust guide-core=` 추출 펜스가 없어도 위반이고, 집합 밖 구조의 `deep.walk` 에 `rust` 펜스가
 * 있어도 위반이다. 추출 펜스만 인정하는 것은 그 코드를 `guide-core check` 와 `cargo test` 가
 * 검증하기 때문이다.
 *
 * **(가)는 판정하지 않는다.** 정본이 Rust 에 있어 전개의 코드가 Rust 인 것이 정상이다.
 */
export function directMemoryRust(
  sections: Section[],
  directMemory: boolean,
  grade: "req" | "opt" | "-",
): Finding[] {
  if (grade === "req") return [];
  const walk = sections.filter((s) => s.id.startsWith("deep.walk"));
  const langs = walk.flatMap((s) => fences(s.body).map((b) => b.lang));
  const anyRust = langs.some((lang) => lang.split(/\s+/)[0] === "rust");
  const extracted = langs.some((lang) => /^rust\s+guide-core=\S/.test(lang));
  if (directMemory && !extracted) {
    return [
      {
        code: "P20",
        detail:
          "메모리를 직접 다뤄야 이득이 생기는 구조(`DIRECT_MEMORY`)인데 `deep.walk` 에 `rust guide-core=` 펜스가 없다 — Rust 구현을 `rust/structures/src/` 에 두고 추출해 싣는다",
      },
    ];
  }
  if (!directMemory && anyRust) {
    return [
      {
        code: "P20",
        detail:
          "`DIRECT_MEMORY` 에 없는 구조의 `deep.walk` 에 `rust` 펜스가 있다 — Rust 서술은 메모리를 직접 다뤄야 이득이 생기는 구조에 한한다",
      },
    ];
  }
  return [];
}

/* ──────────────── 블록 열 정렬 — P15 ──────────────── */

/**
 * 화면에 찍히는 폭. **CJK 를 2 로 센다.**
 *
 * `.length` 로 세면 한글이 든 칸에서 열이 어긋나고, 그것이 `isPrimeTrial` 네 블록에서 최대
 * 3 칸 어긋난 원인이었다(배치11).
 */
export function displayWidth(s: string): number {
  let n = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    n +=
      (c >= 0x1100 && c <= 0x115f) ||
      (c >= 0x2e80 && c <= 0xa4cf && c !== 0x303f) ||
      (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xfe30 && c <= 0xfe6f) ||
      (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6) ||
      (c >= 0x20000 && c <= 0x3fffd)
        ? 2
        : 1;
  }
  return n;
}

/** 한 줄의 필드 — **2 칸 이상 공백**이 열을 가른다. 1 칸 공백은 필드 안이다. */
export interface Cell {
  start: number;
  end: number;
  text: string;
}

export function cells(line: string): Cell[] {
  const out: Cell[] = [];
  for (const m of line.matchAll(/\S(?:(?!\s{2})[\s\S])*/g)) {
    const i = m.index ?? 0;
    out.push({
      start: displayWidth(line.slice(0, i)),
      end: displayWidth(line.slice(0, i + m[0].length)),
      text: m[0],
    });
  }
  return out;
}

/** `^` 와 공백만으로 된 칸. 그 자체가 자리를 나르는 눈금이라 열 정렬 대상이 아니다. */
function isTick(text: string): boolean {
  return /^[\^\s]+$/.test(text);
}

/** 펜스 하나. `generated` 는 **바로 위에 `<!--proof:-->` 가 있는가** 다. */
export interface AlignFence {
  /** 여는 백틱 줄의 1 기준 줄 번호. */
  line: number;
  generated: boolean;
  body: string[];
}

/**
 * 열 정렬을 잴 펜스를 모은다.
 *
 * **생성 블록**(`<!--proof:-->` 바로 아래)은 언어를 안 가린다 — 사이드카가 그린 것이라
 * 무엇을 붙였든 기계가 그린 표다. **손 펜스는 `text` 만 본다** — 코드 펜스의 들여쓰기는
 * 열이 아니라 문법이라, 거기서 열을 재면 재는 것이 없는 자리를 재게 된다.
 */
export function alignFences(text: string): AlignFence[] {
  const lines = text.split("\n");
  const out: AlignFence[] = [];
  let marker = -1;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? "";
    if (/^<!--proof:[A-Za-z0-9_-]+-->$/.test(raw.trim())) {
      marker = i;
      continue;
    }
    const head = raw.trimStart();
    if (!head.startsWith("```")) continue;
    const lang = head.slice(3).trim();
    const open = i;
    const body: string[] = [];
    i++;
    while (
      i < lines.length &&
      !(lines[i] ?? "").trimStart().startsWith("```")
    ) {
      body.push(lines[i] ?? "");
      i++;
    }
    // 마커와 여는 펜스 사이에 빈 줄만 있으면 그 펜스가 마커의 것이다.
    let j = marker + 1;
    while (j < open && (lines[j] ?? "").trim() === "") j++;
    const generated = marker >= 0 && j === open;
    if (!generated && lang !== "text") continue;
    out.push({ line: open + 1, generated, body });
  }
  return out;
}

/**
 * P15 — **블록이 그린 열이 맞는가.**
 *
 * `FEEDBACK.md` §3 의 「생성 블록이 그린 눈금·괄호가 표의 열과 맞는가」에서 왔고,
 * **2026-09-10 에 손으로 그린 `text` 펜스까지 넓혔다**(`KAN-034.9` `S3`). 넓힌 근거는
 * 일곱 배치가 낸 실물이다 — `articulationPoints` 12건 · `floydWarshall` 14자리 ·
 * `closestPairOfPoints` 5건(배치6) · `fftMultiply` 6곳 · `suffixAutomaton` 3곳 ·
 * `maxBipartiteMatching` 3곳(배치7) · `externalMergeSort` 7건(배치11). 워커 여덟이
 * 배치마다 검사기를 새로 짜서 잡던 자리다.
 *
 * **자리마다 판정 세기가 다르고, 세기가 곧 심각도다.**
 *
 * | 어디 | 무엇을 요구하는가 | 심각도 |
 * | --- | --- | --- |
 * | 생성 블록 · 세 줄 이상 덩어리 | 어긋나면 그대로 | **위반** |
 * | 생성 블록 · 두 줄 덩어리 | 어긋나면 그대로 | 경고 |
 * | 손 펜스 | **맞추려 한 흔적이 있는 열만** · 첫 열은 안 본다 | 경고 |
 *
 * **두 줄을 위반으로 안 세는 이유**는 실측이다. 두 줄로는 격자와 짝을 못 가른다 —
 * 넓힌 첫날 111편에서 생성 블록의 두 줄 덩어리가 18자리 걸렸는데 **눈으로 보니 13이
 * 오탐**이었다. `요약 항목  값` 처럼 2 칸으로 가르기만 한 짝, `A 의 값   [1 2 3 4 5]` /
 * `인덱스     0 1 2 3 4` 처럼 대괄호 한 칸 때문에 시작이 갈린 자리, 그리고 나무 그림이다.
 * 세 줄부터는 값이 셋이라 격자인지 아닌지가 자기 안에서 드러난다.
 *
 * 다섯을 일부러 안 본다.
 *
 * 1. **칸이 하나뿐인 줄** — 열이라는 것이 없다. 빈 줄과 함께 그런 줄이 덩어리를 끊는다.
 * 2. **`^` 눈금 칸** — 줄마다 다른 자리를 가리키는 것이 그 칸의 일이다.
 * 3. **머리줄이 데이터보다 길어 혼자 삐져나온 것** — `sa[k]` 같은 열 이름이 그렇다.
 *    **다만 첫 줄이면 무조건 빼 주지는 않는다**(2026-09-10 에 좁혔다) — 첫 줄이 데이터인
 *    표에서 그 면제가 어긋남을 통째로 가렸다. 지금은 **데이터 칸보다 넓고 그 열 자리에
 *    겹쳐 있을 때만** 머리줄로 본다.
 * 4. **손 펜스의 첫 열** — 들여쓰기가 중첩의 뜻인 그림(의사코드·나무)이 거기 산다.
 * 5. **손 펜스에서 구분 폭이 줄마다 같은 열** — 맞추려고 띄운 것이 아니라 가르려고 띄운 것이다.
 *
 * **판정은 열마다 「전부 왼쪽이 맞거나 전부 오른쪽이 맞거나」다.** 좌측 정렬과 우측 정렬을
 * 둘 다 인정해야 수를 오른쪽으로 맞춘 표가 안 걸린다.
 */
export function generatedBlockAlignment(text: string): Finding[] {
  return alignmentFindings(text).filter((f) => f.warn === undefined);
}

/**
 * **위반이 아니라 경고인 자리.** 손 펜스 전부와 생성 블록의 두 줄 덩어리다.
 *
 * 넓힌 첫날 111편 전수에서 **62편 · 151자리**가 나왔다(손 펜스 133 · 생성 블록 두 줄 18).
 * 한꺼번에 빨개지면 다른 편을 닫는
 * 세션이 자기 것이 아닌 빨강을 본다 — `check-proof.ts` 의 「중화 대조를 못 잰 자리」가
 * 2026-09-05 에 같은 이유로 경고로 섰다. **그 편들을 고친 뒤 위반으로 올린다.**
 */
export function alignmentWarnings(text: string): Finding[] {
  return alignmentFindings(text).filter((f) => f.warn === true);
}

const HAND: AlignPolicy = { firstColumn: false, intent: true };

function alignmentFindings(text: string): Finding[] {
  const findings: Finding[] = [];
  for (const fence of alignFences(text)) {
    const bad = misalignedColumns(
      fence.body,
      fence.generated ? undefined : HAND,
    );
    // 펜스 하나에 한 줄만 낸다 — 화면이 한 블록으로 덮이지 않게. 위반이 있으면 그것을 낸다.
    const worst = bad.find((b) => fence.generated && b.rows >= 3) ?? bad[0];
    if (worst === undefined) continue;
    const violation = fence.generated && worst.rows >= 3;
    findings.push({
      code: "P15",
      ...(violation ? {} : { warn: true as const }),
      where: `:${fence.line + 1 + worst.row}`,
      detail: `${fence.generated ? "생성 블록" : "손으로 그린 `text` 펜스"}의 ${worst.column + 1} 번째 열이 어긋난다 — 왼쪽 ${worst.starts.join("·")} · 오른쪽 ${worst.ends.join("·")}. 값에서 폭을 재서 그린다(CJK 는 2 칸)`,
    });
  }
  return findings;
}

interface Misaligned {
  column: number;
  starts: number[];
  ends: number[];
  /** 덩어리에서 처음 빗나간 줄. 펜스 몸통 기준 0 부터 센다. */
  row: number;
  /** 그 덩어리가 몇 줄인가. 두 줄과 세 줄의 심각도가 다르다. */
  rows: number;
}

/** 판정을 얼마나 조이는가. 생성 블록과 손 펜스가 다르다. */
export interface AlignPolicy {
  /** 첫 열을 판정하는가. 손 펜스에서는 들여쓰기가 중첩의 뜻이라 안 본다. */
  firstColumn: boolean;
  /** 「맞추려 한 흔적」이 있는 열만 보는가. */
  intent: boolean;
}

/** 몸통의 한 줄 — 칸과 **몸통 안 줄 번호**. 줄 번호가 있어야 어긋난 줄을 짚을 수 있다. */
interface Ruled {
  cells: Cell[];
  at: number;
}

/**
 * 블록 하나에서 어긋난 열 — **덩어리마다 처음 하나씩.**
 *
 * 덩어리는 **칸이 둘 이상인 줄의 연속**이고 빈 줄·한 칸짜리 줄이 그것을 끊는다.
 * **하한은 두 줄이다**(2026-09-10 에 셋에서 내렸다) — 두 줄짜리 표가 실제로 있었고,
 * 셋을 요구하는 동안 그 자리가 전부 샜다. 두 줄과 세 줄은 **심각도가 갈리므로**
 * 덩어리 크기를 함께 돌려준다.
 */
export function misalignedColumns(
  body: string[],
  policy: AlignPolicy = { firstColumn: true, intent: false },
): Misaligned[] {
  const found: Misaligned[] = [];
  let run: Ruled[] = [];
  const chunks: Ruled[][] = [];
  for (const [at, line] of body.entries()) {
    const c = cells(line);
    if (c.length >= 2) run.push({ cells: c, at });
    else {
      if (run.length >= 2) chunks.push(run);
      run = [];
    }
  }
  if (run.length >= 2) chunks.push(run);

  for (const chunk of chunks) {
    // 칸 수가 가장 흔한 줄만 한 표로 본다. 그 밖은 캡션이거나 다른 모양이다.
    const tally = new Map<number, number>();
    for (const r of chunk)
      tally.set(r.cells.length, (tally.get(r.cells.length) ?? 0) + 1);
    let width = 0;
    let best = 0;
    for (const [n, c] of tally) {
      if (c > best) {
        best = c;
        width = n;
      }
    }
    const ruled = chunk.filter((r) => r.cells.length === width);
    if (ruled.length < 2) continue;
    const rows = ruled.map((r) => r.cells);

    for (let c = policy.firstColumn ? 0 : 1; c < width; c++) {
      if (rows.some((r) => isTick((r[c] as Cell).text))) continue;
      if (aligned(rows, c)) continue;
      if (headerOverhang(rows, c)) continue;
      if (policy.intent && !alignmentIntended(rows, c, width)) continue;
      found.push({
        column: c,
        starts: [...new Set(rows.map((r) => (r[c] as Cell).start))].sort(
          (a, b) => a - b,
        ),
        ends: [...new Set(rows.map((r) => (r[c] as Cell).end))].sort(
          (a, b) => a - b,
        ),
        row: (ruled[strayRow(rows, c)] as Ruled).at,
        rows: rows.length,
      });
      break;
    }
  }
  return found;
}

/** 그 열이 왼쪽으로 맞거나 오른쪽으로 맞는가. 줄이 둘 미만이면 잴 것이 없다. */
function aligned(rows: Cell[][], c: number): boolean {
  if (rows.length < 2) return true;
  const starts = new Set(rows.map((r) => (r[c] as Cell).start));
  const ends = new Set(rows.map((r) => (r[c] as Cell).end));
  return starts.size === 1 || ends.size === 1;
}

/**
 * 머리줄 하나가 데이터보다 길어 혼자 삐져나온 것인가.
 *
 * 예전에는 **첫 줄을 빼고 다시 재서 맞으면 통과**시켰다. 그것이 「첫 줄이 데이터인 표」의
 * 어긋남을 통째로 가렸다 — 세 줄짜리 표에서 첫 줄만 밀려 있으면 나머지 둘은 당연히 맞는다.
 * 지금은 셋을 다 요구한다.
 *
 * 1. 첫 줄을 빼면 그 열이 맞는다.
 * 2. 첫 줄의 칸이 **어느 데이터 칸보다도 넓다** — 열 이름이 길어서 삐져나온 것이라야 한다.
 * 3. 첫 줄의 칸이 **데이터 열 자리에 겹쳐 있다** — 옆으로 비켜 앉은 것은 머리줄이 아니다.
 */
function headerOverhang(rows: Cell[][], c: number): boolean {
  if (rows.length < 3) return false;
  if (!aligned(rows.slice(1), c)) return false;
  const head = rows[0]?.[c];
  if (head === undefined) return false;
  const rest = rows.slice(1).map((r) => r[c] as Cell);
  if (head.end - head.start <= Math.max(...rest.map((x) => x.end - x.start)))
    return false;
  const lo = Math.min(...rest.map((x) => x.start));
  const hi = Math.max(...rest.map((x) => x.end));
  return head.start < hi && head.end > lo;
}

/**
 * 손 펜스에서 **그 열을 맞추려 한 흔적**이 있는가. 둘을 함께 요구한다.
 *
 * 1. **구분 폭이 줄마다 다르다.** 전부 같으면 띄운 것이 아니라 **가른 것**이다 —
 *    `"이 조건" "그 조건" ← 설명` 처럼 2 칸으로 항목만 가른 목록이 원고에 흔하고,
 *    그것을 격자로 읽으면 규칙이 원고에 없는 의도를 요구하게 된다.
 * 2. **나머지 열은 다 맞는데 이 열만, 그것도 한 줄만 빗나간다.** 독자가 「격자가 깨졌다」로
 *    읽는 것이 이 모양이다. 아예 한 번도 안 맞는 열은 격자가 아니라 자유 문단이다.
 *
 * 이 문을 안 달면 111편 전수에서 294자리가 나오고 그중 대부분이 「맞출 생각이 없던 자리」다.
 * 달면 133자리가 되고, 앞 배치들이 손으로 짠 검사기가 잡아 고친 편들(`articulationPoints`·
 * `floydWarshall`·`closestPairOfPoints`·`fftMultiply`·`suffixAutomaton`·`externalMergeSort`·
 * `countInversions`)이 **전부 0** 이다 — 같은 것을 재고 있다는 대조다.
 */
function alignmentIntended(rows: Cell[][], c: number, width: number): boolean {
  // 첫 열의 「구분 폭」은 들여쓰기 그 자체다.
  const gaps = rows.map((r) =>
    c === 0
      ? (r[0] as Cell).start
      : (r[c] as Cell).start - (r[c - 1] as Cell).end,
  );
  if (new Set(gaps).size === 1) return false;
  if (rows.length < 3) return false;
  if (strayCount(rows, c) !== 1) return false;
  for (let k = 0; k < width; k++) {
    if (k === c) continue;
    if (rows.some((r) => isTick((r[k] as Cell).text))) continue;
    if (!aligned(rows, k)) return false;
  }
  return true;
}

/** 그 열에서 다수와 다른 자리에 있는 줄이 몇이나 되는가. 왼쪽·오른쪽 중 적은 쪽으로 센다. */
function strayCount(rows: Cell[][], c: number): number {
  const most = (v: number[]): number => {
    const m = new Map<number, number>();
    for (const x of v) m.set(x, (m.get(x) ?? 0) + 1);
    return Math.max(...m.values());
  };
  const starts = rows.map((r) => (r[c] as Cell).start);
  const ends = rows.map((r) => (r[c] as Cell).end);
  return Math.min(rows.length - most(starts), rows.length - most(ends));
}

/** 그 열에서 처음 다수와 어긋난 줄. 다수가 없으면(전부 제각각) 첫 줄을 짚는다. */
function strayRow(rows: Cell[][], c: number): number {
  const tally = (v: number[]): Map<number, number> => {
    const m = new Map<number, number>();
    for (const x of v) m.set(x, (m.get(x) ?? 0) + 1);
    return m;
  };
  const starts = rows.map((r) => (r[c] as Cell).start);
  const ends = rows.map((r) => (r[c] as Cell).end);
  const ts = tally(starts);
  const te = tally(ends);
  const bs = Math.max(...ts.values());
  const be = Math.max(...te.values());
  if (bs === 1 && be === 1) return 0;
  const [values, best] = bs >= be ? [starts, bs] : [ends, be];
  const table = bs >= be ? ts : te;
  const at = values.findIndex((v) => (table.get(v) ?? 0) !== best);
  return at === -1 ? 0 : at;
}

/* ──────────────── GFM 표 구분줄 — TBL ──────────────── */

/**
 * 한 줄이 GFM 표의 몇 칸인가. **`\|` 는 칸을 안 가른다**(그 자리는 세로줄 글자다).
 *
 * 앞뒤의 세로줄은 울타리라 칸이 아니다 — `| a | b |` 는 두 칸이다.
 */
export function rowCells(line: string): number {
  let body = line.trim();
  if (body.startsWith("|")) body = body.slice(1);
  if (body.endsWith("|") && !body.endsWith("\\|")) body = body.slice(0, -1);
  let count = 1;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "\\") {
      i++;
      continue;
    }
    if (body[i] === "|") count++;
  }
  return count;
}

const SEPARATOR = /^ {0,3}\|(?:\s*:?-{2,}:?\s*\|)+\s*$/;

/**
 * TBL — **구분줄을 그렸는데 표가 안 서는 자리.**
 *
 * `build-html` 이 배치2 에서 「원고 표 칸 수 ↔ 렌더된 `<td>`·`<th>` 수」를 대조하게 됐다.
 * 그 대조가 **원리적으로 못 보는 손상이 하나 있다.** 머리줄 칸 수와 구분줄 칸 수가 다르면
 * GFM 이 표를 **아예 안 세운다** — 세 줄이 통째로 한 문단으로 흐르고, mdast 에도 hast 에도
 * `table` 이 없어서 칸 수 대조가 **0 대 0 으로 일치**한다. 손상은 이쪽이 훨씬 큰데(표가
 * 통째로 사라진다) 통과로 뜬다.
 *
 * 칸 수가 갈리는 가장 흔한 길은 **머리줄 칸 안의 세로줄**이다. `| 값 \| 없음 | 뜻 |` 처럼
 * 가려 쓰면 두 칸이지만, 가리지 않으면 세 칸이 되어 `| --- | --- |` 와 어긋난다.
 *
 * 그래서 구분줄 **모양**을 먼저 찾고, 그 자리가 표로 설 수 있는가를 GFM 의 규칙 그대로
 * 되묻는다 — 바로 위가 머리줄인가, 그 칸 수가 같은가. 펜스 안은 안 본다(그림이다).
 *
 * 111편 전수에서 **0건**이다. 고칠 원고가 없고 세우는 것은 강제 지점뿐이라 경고가 아니라
 * 처음부터 위반이다.
 */
export function tableSeparators(text: string): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split("\n");
  let fenced = false;
  for (const [index, raw] of lines.entries()) {
    if (raw.trimStart().startsWith("```")) {
      fenced = !fenced;
      continue;
    }
    if (fenced || !SEPARATOR.test(raw)) continue;

    const head = lines[index - 1];
    const where = `:${index + 1}`;
    if (head === undefined || head.trim() === "") {
      findings.push({
        code: "TBL",
        where,
        detail:
          "구분줄 위가 머리줄이 아니다 — 표가 안 서고 이 줄이 글자 그대로 찍힌다",
      });
      continue;
    }
    const want = rowCells(raw);
    const got = rowCells(head);
    if (got === want) continue;
    findings.push({
      code: "TBL",
      where,
      detail: `머리줄 ${got} 칸 · 구분줄 ${want} 칸 — 칸 수가 다르면 GFM 이 표를 **아예 안 세운다.** 칸 안의 세로줄은 \`\\|\` 로 가린다`,
    });
  }
  return findings;
}

/**
 * 【걷어냈다 — 2026-08-28 유저 지시】 L28·L29(`criterionOrder`) · L30·L31(`coreConcept`).
 *
 * > *"내용이나 의미, 설득력에 대한 게이트는 걷어 낸다. 자연스러운 표현처럼 기준이 분명하고
 * > 독립적 개선이 가능하고 알고리즘에 대한 정합성과 같이 결정론적 체크가 가능한 게이트만
 * > 남긴다"*
 *
 * 네 검사는 **특정 문장이 있는가**를 정규식으로 물었다 — 「묶는 것은 … 정확 …」 꼴,
 * 「이 값은 … 대신하는 것이 아니다」 꼴. 통과 조건이 문장의 존재라서, 글은 그 문장을 그대로
 * 끼워 넣는 쪽으로 갔다. 유저가 같은 날 그 결과를 지적했다 — *"내가 피드백 한 내용을 대답
 * 하듯이 내용을 작성하지 말아라. 사람이 알아보기 힘든 문장으로 점점 바뀌어 가고 있다"*.
 *
 * 여기 남은 것은 **표기·구조·수치 정합**뿐이다. 무엇을 썼는지가 아니라 **어떻게 적었는지**를
 * 본다. 판정 기준이 글쓴이의 의도 해석에 기대면 그 검사는 여기 두지 않는다.
 */
export interface CheckInput {
  text: string;
  /**
   * 어느 골격인가. **기본은 `algo` 다** — 시험 72벌이 전부 알고리즘 골격 텍스트를 직접
   * 넘기고, 그것들이 매번 갈래를 적게 하면 새 시험이 늘 때 빠뜨릴 자리가 생긴다.
   * **실제 파일을 읽는 `checkOne` 은 `kindOf(target)` 으로 반드시 채운다** — 거기서 빠지면
   * 자료구조 편이 알고리즘 매핑으로 파싱된다.
   */
  kind?: GuideKind;
  /** `<name>-guide.sim.ts` 원문. 없으면 P3·P6·P9 는 "미실행" 으로 보고한다. */
  sim?: string;
  /** `bench-alt.ts` 가 낸 결정론적 계수. 없으면 P10 은 "미실행". */
  bench?: Record<string, number>;
  /**
   * 정본 코드. algo 는 `<name>-guide.ref.ts` 원문이고, **ds 는
   * `_reference/<name>.ts` 의 `#region guide:core` 추출본**이다(`ds SPEC` `L43`).
   * algo 에서 없으면 P16 은 "미실행" 이지만 **ds 에서 없으면 위반**이다 — 정본이 이미 서
   * 있어야 하는 트랙이라, 없는 것을 미실행으로 넘기면 안 잰 것이 통과로 읽힌다.
   */
  ref?: string;
  /**
   * 계약 헤더(`<name>.ts` JSDoc)의 연산 표에서 뽑은 연산 이름. ds 전용이고 P17·P18 이 쓴다.
   * 파서는 `check-contract.ts` 의 것을 그대로 쓴다 — 연산 목록의 정본이 한 곳이어야 한다.
   */
  contractOps?: string[];
  /**
   * 규약4 에스컬레이션 등급. `req`=(가) · `opt`=(나) · `-`=(-). ds 전용이고 P19 가 쓴다.
   * 정본은 `tools/ord006-inventory.ts` 의 `ESCALATION` 이다.
   */
  escalation?: "req" | "opt" | "-";
  /**
   * 메모리를 직접 다뤄야 이득이 생기는 구조인가. ds 전용이고 P20 이 쓴다.
   * 정본은 `tools/ord006-escalation.ts` 의 `DIRECT_MEMORY` 다.
   */
  directMemory?: boolean;
  maxProseRun?: number;
}

export function check(input: CheckInput): Finding[] {
  const findings: Finding[] = [];
  const limit = input.maxProseRun ?? 2;
  const kind = input.kind ?? "algo";
  const { sections, unresolved } = parseSections(input.text, kind);

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
  // 은유만 인용 구간을 뺀 문장을 본다. 절 제목을 낫표로 인용하는 자리(「멈춤 — …」)와
  // 지적 원문을 큰따옴표로 옮긴 자리가 글쓴이의 문장으로 집계되면, 인용을 지우는 쪽으로
  // 원고가 움직인다. 금지 문형·표기 혼용은 인용 안에서도 그대로 본다 — 그쪽은 인용이든
  // 아니든 독자가 읽는 표기다.
  let inQuote = false;
  for (const [index, line] of input.text.split("\n").entries()) {
    const outside = stripQuotes(line, inQuote);
    if ((line.match(/"/g)?.length ?? 0) % 2 === 1) inQuote = !inQuote;
    for (const phrase of FORBIDDEN) {
      if (typeof phrase !== "string" || !line.includes(phrase)) continue;
      findings.push({
        code: "P2",
        where: `:${index + 1}`,
        detail: `금지 문형 "${phrase}"`,
      });
    }
    for (const { re, label } of METAPHORS) {
      const hit = re.exec(outside);
      if (hit === null) continue;
      findings.push({
        code: "P2",
        where: `:${index + 1}`,
        detail: `은유 ("${hit[0]}") — ${label}`,
      });
    }
    for (const { re, label } of NOTATION) {
      const hit = re.exec(line);
      if (hit === null) continue;
      findings.push({
        code: "P2",
        where: `:${index + 1}`,
        detail: `표기 혼용 ("${hit[0]}") — ${label}`,
      });
    }
  }

  // 문서 전체를 봐야 하는 표기 검사. 두 표기가 절을 건너뛰어 떨어져 있어도 잡는다.
  findings.push(...labelPairNotation(input.text));

  // `deep.walk` 는 컨테이너이고 T# 는 그 아래 소절에 흩어져 있다. 합쳐서 본다.
  const walkSections = sections.filter((s) => s.id.startsWith("deep.walk"));
  const walkHead = first(sections, "deep.walk");
  const walkBody = walkSections.flatMap((s) => s.body);
  const traceLabels = walkHead ? traceRefs(walkBody) : new Set<string>();

  // ── P3 전개의 T# 단계 수 ≥ 시뮬 프레임 수, 그리고 ≥ 6 ──
  const sim = input.sim === undefined ? null : parseSim(input.sim);
  if (sim) {
    for (const v of sim.violations) {
      findings.push({ code: "P3", detail: `.sim.ts 계약 위반 — ${v}` });
    }
  }
  if (walkHead) {
    if (traceLabels.size < 6) {
      findings.push({
        code: "P3",
        where: `deep.walk:${walkHead.line}`,
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
          where: `deep.walk:${walkHead.line}`,
          detail: `T# 단계 ${traceLabels.size} < 시뮬 프레임 ${frames}`,
        });
      }
      // 수를 세는 것만으로는 **어떤 걸음을 골랐는지**가 안 보인다. 자리를 맞댄다.
      findings.push(
        ...framePlacement(
          sim,
          new Set([...traceLabels].map((l) => Number(l.slice(1)))),
          `deep.walk:${walkHead.line}`,
        ),
      );
    }
  } else {
    findings.push({ code: "P3", detail: "`deep.walk`(전개) 절이 없다" });
  }

  // ── P3b 전개의 뼈대 — 단계 ≥ 3 · 멈춤 ≥ 1 · 전체 코드 1 ──
  //
  // **멈춤이 이 절의 핵심이다**(2026-08-25 유저 지적). *"알고리즘 전개 과정에서 간과하거나
  // 오해할 수 있는 지점은 반드시 멈춰서 설명하고 넘어가야 한다"*. 옛 `deep.trap` 이 절 하나로
  // 몰아 두던 것을 **전개 흐름 안 제자리로** 흩은 것이라, 없으면 그 직무가 통째로 사라진다.
  if (walkHead) {
    const steps = pick(sections, "deep.walk.step").length;
    const pauses = pick(sections, "deep.walk.pause").length;
    const finals = pick(sections, "deep.walk.final").length;
    if (steps < 3) {
      findings.push({
        code: "P3",
        where: `deep.walk:${walkHead.line}`,
        detail: `전개 단계 ${steps} < 3`,
      });
    }
    if (pauses < 1) {
      findings.push({
        code: "P3",
        where: `deep.walk:${walkHead.line}`,
        detail: "`### 멈춤 — …` 소절이 없다",
      });
    }
    if (finals !== 1) {
      findings.push({
        code: "P3",
        where: `deep.walk:${walkHead.line}`,
        detail: `전체 코드 소절이 ${finals} 개다 (1 이어야 한다)`,
      });
    }
  }

  // ── P3c 폐기된 항목 이름이 헤딩으로 되살아났는가 ──
  for (const sec of sections) {
    for (const word of RETIRED_HEADING_WORDS) {
      if (!sec.heading.includes(word)) continue;
      findings.push({
        code: "P3",
        where: `${sec.id}:${sec.line}`,
        detail: `폐기된 항목 이름이 헤딩에 남았다 — "${word}"`,
      });
    }
  }

  // ── P3d 헤딩에 존댓말 종결이 올라왔는가 ──
  for (const sec of sections) {
    const hit = HONORIFIC_HEADING.exec(sec.heading);
    if (hit === null) continue;
    findings.push({
      code: "P2",
      where: `${sec.id}:${sec.line}`,
      detail: `헤딩에 존댓말 종결이 올라왔다 — "${hit[0].trim()}". 본문 어조를 소제목으로 승격시키지 않는다(voice 규칙 1)`,
    });
  }

  // ── P4 분기 피복 — 전체 코드의 원문자 라벨 ⊆ 전개가 실행한 라벨 ──
  const stepLabels = new Set<string>();
  for (const s of pick(sections, "deep.walk.final")) {
    for (const block of fences(s.body)) {
      for (const label of circled(block.lines.join("\n")))
        stepLabels.add(label);
    }
  }
  if (walkHead) {
    // **전체 코드 절은 빼고 센다.** 라벨은 거기 적혀 있으므로, 포함하면 자기가 자기를 실행한
    // 것으로 세어 P4 가 통째로 무력해진다.
    const traced = circled(
      walkSections
        .filter((sec) => sec.id !== "deep.walk.final")
        .flatMap((sec) => sec.body)
        .join("\n"),
    );
    const missing = [...stepLabels].filter((l) => !traced.has(l));
    if (missing.length > 0) {
      findings.push({
        code: "P4",
        where: `deep.walk:${walkHead.line}`,
        detail: `실행하지 않은 분기 ${missing.join("")}`,
      });
    }
  }

  // ── P14 `invariant` 절의 원문자 라벨 금지 ──
  //
  // `SPEC.md:566` 이 그 자리에서 금지한다 — 사유는 `deep.walk` 이 같은 토큰을 쓰므로 절
  // 경계가 오염된다는 것이다. **P4 는 이것을 못 잡는다**: 라벨을 `deep.walk.final` 의 코드
  // 펜스에서만 모으므로 다른 절의 원문자는 스캐너 넷을 전부 초록으로 지나갔다. 전수 스윕에서
  // `invariant` 절이 있는 81편 중 21편이 그 상태였고 총 186개였다(2026-09-04, `S1` 에서 교정).
  //
  // **금지 범위는 절 전체다.** `SPEC.md` 의 그 줄은 문면상 걸음 ③ 의 하위 항목이지만, 원문자를
  // 안 쓰는 60편은 걸음 ③ 만이 아니라 절 전체에서 0 이었다 — 문면이 아니라 그 60편이 판정
  // 근거다. 대신 부르는 법도 그 60편에서 나온다: 갈래를 **하는 일의 이름이나 조건식**으로
  // 부른다(`millerRabin` 의 「첫 값 검사 `x === 1n || x === n - 1n`」이 그 형태다).
  //
  // **파트 1 의 원문자는 정당하다.** 이 검사는 `invariant` 절만 본다 — 넓히면 P4 가 재는
  // 분기 피복이 통째로 없어진다.
  for (const sec of pick(sections, "invariant")) {
    const labels = [...circled(sec.body.join("\n"))].sort();
    if (labels.length > 0) {
      findings.push({
        code: "P14",
        where: `invariant:${sec.line}`,
        detail: `원문자 라벨 ${labels.join("")} — 이 절은 갈래를 하는 일의 이름이나 조건식으로 부른다(\`SPEC.md:566\`)`,
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
        detail: "`deep.walk`(전개) 의 T# 를 하나도 인용하지 않는다",
      });
      continue;
    }
    const dangling = [...refs].filter((r) => !traceLabels.has(r));
    if (dangling.length > 0) {
      findings.push({
        code: "P5",
        where: `${id}:${s.line}`,
        detail: `\`deep.walk\` 에 없는 단계를 가리킨다 — ${dangling.join("·")}`,
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
  //
  // **예외 스위치를 두지 않는다.** 4판까지 "그림이 성립하지 않는 부류" 를 위한 `figureExempt`
  // 를 열어 뒀는데, S8 이 그 가설을 실물로 시험해 거짓임을 확인했다(`SURVEY.md`).
  // 없는 예외를 코드에 남겨 두면 다음 사람이 그 문으로 나간다.
  for (const id of FIGURE_REQUIRED) {
    const group = pick(sections, id);
    if (group.length === 0) {
      findings.push({ code: "P7", detail: `\`${id}\` 절이 없다` });
      continue;
    }
    // `deep.walk.step` 처럼 반복되는 절은 **절 전체 기준** 하나면 된다(벌마다가 아니다).
    if (!group.some(hasFigure)) {
      findings.push({
        code: "P7",
        where: `${id}:${group[0]?.line}`,
        detail: "그림이 없다",
      });
    }
  }

  // ── P7b 조건부 절의 그림·코드 의무 — 정의만 늘어놓는 절을 막는다 ──
  for (const id of CONDITIONAL_FIGURE_AND_CODE) {
    const group = pick(sections, id);
    if (group.length === 0) continue; // 없어도 되는 절이다
    if (!group.some(hasFigure)) {
      findings.push({
        code: "P7",
        where: `${id}:${group[0]?.line}`,
        detail: "그림이 없다",
      });
    }
    const hasCode = group.some((sec) =>
      fences(sec.body).some(
        (b) => b.lang !== "" && b.lang !== "text" && b.lang !== "ascii",
      ),
    );
    if (!hasCode) {
      findings.push({
        code: "P7",
        where: `${id}:${group[0]?.line}`,
        detail:
          "코드 펜스가 없다 — 정의로 알고리즘이 도는 모습을 보이지 않았다",
      });
    }
  }

  // ── P7c 조건부 절의 그림 의무 — 이름만 붙이고 끝나는 절을 막는다 ──
  for (const id of CONDITIONAL_FIGURE_ONLY) {
    const group = pick(sections, id);
    if (group.length === 0) continue; // 없어도 되는 절이다
    if (!group.some(hasFigure)) {
      findings.push({
        code: "P7",
        where: `${id}:${group[0]?.line}`,
        detail:
          "그림이 없다 — 본문의 어느 값이 그 개념이었는지를 도식이나 표로 짚지 않았다",
      });
    }
  }

  // ── P8 concept 이 뒤 절 헤딩·앵커를 참조하지 않는가 ──
  const concept = first(sections, "concept");
  if (concept) {
    const laterHeadings = sections
      // 파트 도입으로 헤딩이 한 단 내려갔다 — 항목은 `###`, 항목의 하위 절은 `####` 다.
      .filter((s) => s.line > concept.line && s.level <= 4)
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

  // ── P8b `related` 가 파트 1 의 마지막에 있는가 ──
  //
  // **자리를 유저가 지정했다**(2026-08-28) — *"part1 마지막에 포함해라"*. 이 절의 직무가
  // 「파트 1 이 세운 것에 이름을 붙이고 파트 2 로 넘긴다」라서 자리가 곧 직무다. 파트 2 로
  // 넘어가면 적용 조건·비용을 따지는 흐름 한가운데 개념 소개가 끼어든다.
  //
  // 스캐너가 순서를 강제하지 않는다는 방침의 예외다(`SPEC.md` §1). P8 과 같은 「위치」
  // 판정이고, 지시가 자리를 명시한 절이라 여기 둔다.
  const related = first(sections, "related");
  const part2 = first(sections, "part2");
  if (related && part2 && related.line > part2.line) {
    findings.push({
      code: "P8",
      where: `related:${related.line}`,
      detail: `\`related\` 가 파트 2 뒤에 있다(파트 2 는 :${part2.line}) — 파트 1 의 마지막에 온다`,
    });
  }
  if (related) {
    const walk = first(sections, "deep.walk");
    if (walk && related.line < walk.line) {
      findings.push({
        code: "P8",
        where: `related:${related.line}`,
        detail:
          "`related` 가 `deep.walk` 앞에 있다 — 파트 1 이 동작까지 보인 **뒤**에 이름을 붙인다",
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
  //
  // **`purpose.alt` 는 2026-08-28 부로 조건부다**(`SPEC.md` `L34`) — 조건에 따라 채택이
  // 갈리는 경쟁 설계가 있을 때만 싣는다. 그래서 절이 없는 것 자체는 위반이 아니다.
  //
  // 다만 **실측값만 남고 싣는 절이 없는 상태**는 잡는다. `.bench.json` 은 `.alt.ts` 를
  // 실행해야 생기므로, 그 파일이 있는데 절이 없으면 「대조를 뺀 것」인지 「싣는 것을 잊은
  // 것」인지 다음 사람이 구분할 수 없다. 빼기로 했으면 두 파일도 함께 지운다.
  const alt = first(sections, "purpose.alt");
  if (input.bench && !alt) {
    findings.push({
      code: "P10",
      detail: `\`purpose.alt\` 절이 없는데 실측값이 ${Object.keys(input.bench).length}개 남아 있다 — 대조를 빼기로 했으면 \`.alt.ts\`·\`.bench.json\` 도 지운다`,
    });
  }
  if (input.bench && alt) {
    const numbers = bodyNumbers(alt.body.join("\n"));
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

  // ── P11·P12·P13 기호 규약 ──
  //
  // 셋 다 `FEEDBACK.md` §3 이 사람에게 맡겨 뒀던 줄에서 **실행으로 내릴 수 있는 몫만**
  // 떼어 온 것이다. 못 내린 몫은 §3 에 그대로 남는다 — 좁힌 자리를 각 함수의 주석이 적는다.
  findings.push(...symbolCountDeclaration(input.text));
  findings.push(...codeNameMapping(input.text));
  findings.push(...definitionRestated(input.text));

  // ── P15 생성 블록 열 정렬 ──
  findings.push(...generatedBlockAlignment(input.text));

  // ── TBL 구분줄을 그렸는데 표가 안 서는 자리 ──
  findings.push(...tableSeparators(input.text));

  // ── P16 원고의 전체 코드 ↔ 정본 ──
  if (input.contractOps !== undefined) {
    findings.push(...operationCoverage(sections, input.contractOps));
    findings.push(...noContractTableCopy(sections, input.contractOps));
  }
  if (input.escalation !== undefined) {
    findings.push(...escalationSection(sections, input.escalation));
    if (input.directMemory !== undefined) {
      findings.push(
        ...directMemoryRust(sections, input.directMemory, input.escalation),
      );
    }
  }
  if (input.ref !== undefined) {
    findings.push(...finalCodeMatchesRef(sections, input.ref));
  }

  // **경고는 판정이 아니다.** `checkWarnings` 가 같은 것을 걸러 화면으로 보낸다.
  return findings.filter((f) => f.warn === undefined);
}

/**
 * 판정(`check`)에 안 들어가고 **화면에만 뜨는** 자리.
 *
 * 두 갈래가 여기 모인다 — P15 의 손 펜스·두 줄 덩어리와, P3 의 「걸음을 건너뛴 프레임」이다.
 * 화면으로 보내는 자리를 하나로 두는 이유는 `checkOne` 이 경고 출처마다 따로 부르면
 * **새 경고가 늘 때 안 불리는 것이 생기고, 그건 잡았는데 아무도 안 보는 자리**가 되기
 * 때문이다. 실제로 P15 가 일곱 배치를 그렇게 샜다.
 */
export function checkWarnings(input: CheckInput): Finding[] {
  const out: Finding[] = alignmentWarnings(input.text);

  const { sections, unresolved } = parseSections(
    input.text,
    input.kind ?? "algo",
  );
  if (unresolved.length > 0 || input.sim === undefined) return out;
  const walkHead = first(sections, "deep.walk");
  if (!walkHead) return out;
  const sim = parseSim(input.sim);
  if (sim.violations.length > 0) return out;
  const labels = traceRefs(
    sections.filter((s) => s.id.startsWith("deep.walk")).flatMap((s) => s.body),
  );
  out.push(
    ...framePlacement(
      sim,
      new Set([...labels].map((l) => Number(l.slice(1)))),
      `deep.walk:${walkHead.line}`,
    ).filter((f) => f.warn === true),
  );
  return out;
}

function norm(s: string): string {
  return s.replaceAll(/\s+/g, "").replaceAll(",", "");
}

/* ────────────────────────── CLI ────────────────────────── */

/** 파일 하나를 재고 위반 수를 돌려준다. `--all` 이 편마다 이것을 부른다. */
/**
 * 편 하나를 잰다. **단일 대상 CLI 도 이 함수를 지난다** — 예전에는 `import.meta.main`
 * 안에 같은 일이 한 벌 더 적혀 있었고, 그쪽만 `.ref.ts` 를 안 실은 채
 * 「P1~P16 통과」를 찍었다(`KAN-034.9` `A1`). 같은 일을 두 자리에 적으면 한쪽만
 * 갱신되므로, 실을 것이 늘어도 고칠 자리는 여기 하나다.
 *
 * `notes` 는 **사이드카가 없어 건너뛴 검사**를 화면에 적을지다. 단일 대상이면 켜고
 * `--all` 이면 끈다 — 111편 × 세 줄이면 통과 화면이 안내로 덮인다(`--all` 은 대신
 * 끝에서 편 수로 요약한다).
 */
async function checkOne(
  target: string,
  json: boolean,
  notes = false,
): Promise<{ bad: number; missing: string[]; warnings: number }> {
  const file = Bun.file(target);
  if (!(await file.exists())) {
    console.error(`대상이 없다: ${target}`);
    return { bad: 1, missing: [], warnings: 0 };
  }
  const text = await file.text();
  const stem = basename(target).replace(/\.md$/, "");
  const dir = dirname(target);
  // **골격은 경로가 정한다.** 여기서 빠뜨리면 자료구조 편이 알고리즘 매핑으로 파싱되고,
  // 그 실패는 원인에서 멀리 떨어진 자리에서 드러난다. 두 트랙 **밖**(시험용 임시 파일)만
  // `algo` 로 떨어지고, 트랙 안 경로는 `kindOf` 가 확실히 잡는다.
  const kind = kindOfOr(target, "algo");
  const input: CheckInput = { text, kind };
  const simFile = Bun.file(join(dir, `${stem}.sim.ts`));
  const benchFile = Bun.file(join(dir, `${stem}.bench.json`));
  if (await simFile.exists()) input.sim = await simFile.text();
  if (await benchFile.exists()) input.bench = await benchFile.json();

  const missing: string[] = [];
  const dsProblems: string[] = [];

  if (kind === "ds") {
    // ds 의 정본은 `_reference/<name>.ts` 이고 **이미 서 있어야 한다**(`ds SPEC` `L43`).
    // 사이드카 `.ref.ts` 를 두지 않으므로 algo 의 「없으면 미실행」을 그대로 쓰면
    // **안 잰 것이 통과로 읽힌다** — 여기서는 부재가 위반이다.
    const name = stem.replace(/-guide$/, "");
    const refPath = join(dir, "_reference", `${name}.ts`);
    const refFile = Bun.file(refPath);
    if (await refFile.exists()) {
      try {
        input.ref = dsReferenceCode(await refFile.text(), refPath);
      } catch (error) {
        dsProblems.push(
          error instanceof GuideCoreError
            ? `P16 — ${error.message}`
            : `P16 — 정본 추출이 실패했다: ${String(error)}`,
        );
      }
    } else {
      dsProblems.push(`P16 — 정본이 없다: ${refPath}`);
    }

    // 연산 목록과 등급의 정본을 그대로 읽는다. 원고 판정기가 표를 다시 파싱하면 파서가 갈린다.
    const stubFile = Bun.file(join(dir, `${name}.ts`));
    if (await stubFile.exists()) {
      const doc = headerDoc(await stubFile.text());
      if (doc !== null) input.contractOps = parseContract(doc).ops;
    }
    if (input.contractOps === undefined) missing.push("contract");

    const key = dir.replace(/^.*src\/data-structures\//, "");
    input.escalation = ESCALATION[key] ?? "-";
    input.directMemory = DIRECT_MEMORY.has(key);
  } else {
    const refFile = Bun.file(join(dir, `${stem}.ref.ts`));
    if (await refFile.exists()) input.ref = await refFile.text();
    if (input.ref === undefined) missing.push("ref");
  }

  // 없어서 **건너뛴** 것이지 통과한 것이 아니다. 같은 자리에서 세어 두면
  // 새 사이드카가 늘 때 안내를 빠뜨릴 자리가 없다.
  if (input.sim === undefined) missing.push("sim");
  if (input.bench === undefined) missing.push("bench");

  const findings: Finding[] = [
    ...dsProblems.map((detail) => ({ code: "P16", detail })),
    ...check(input),
  ];
  // **경고는 판정에 안 들어간다.** 화면에는 뜨고 `--json` 에도 실린다 — 안 뜨면 넓힌
  // 규칙이 잡은 자리를 아무도 못 보고, 위반으로 세면 53편이 한꺼번에 빨개진다.
  const warnings = checkWarnings(input);
  if (json) {
    console.log(
      JSON.stringify({ target, findings, warnings, missing }, null, 2),
    );
  } else if (findings.length === 0) {
    console.log(`${target} — P1~P16 통과.`);
    if (notes) for (const line of skipNotes(missing)) console.log(`  ${line}`);
  } else {
    console.error(`${target} — 위반 ${findings.length}건.`);
    for (const f of findings) {
      console.error(`  [${f.code}] ${f.where ?? ""}`);
      console.error(`    ${f.detail}`);
    }
    if (notes)
      for (const line of skipNotes(missing)) console.error(`  ${line}`);
  }
  // 단일 대상이면 그 자리에서 적고, `--all` 은 끝에서 편 수로 요약한다.
  if (!json && notes && warnings.length > 0) {
    console.log(`  경고 ${warnings.length}건 — 열 정렬 · 걸음 자리.`);
    for (const w of warnings)
      console.log(`  [${w.code}] ${w.where}  ${w.detail}`);
  }
  return {
    bad: findings.length === 0 ? 0 : 1,
    missing,
    warnings: warnings.length,
  };
}

/** 사이드카가 없어 건너뛴 검사를 사람이 읽는 줄로. 없는 것이 없으면 빈 배열이다. */
export function skipNotes(missing: string[]): string[] {
  const has = new Set(missing);
  const out: string[] = [];
  if (has.has("sim"))
    out.push(
      "(참고: `.sim.ts` 가 없어 P3 프레임 대조·P6·P9 는 실행되지 않았다)",
    );
  if (has.has("bench"))
    out.push("(참고: `.bench.json` 이 없어 P10 은 실행되지 않았다)");
  if (has.has("ref"))
    out.push("(참고: `.ref.ts` 가 없어 P16 정본 대조는 실행되지 않았다)");
  if (has.has("contract"))
    out.push(
      "(참고: 계약 헤더를 못 읽어 P17 연산 피복·P18 계약 표 복사는 실행되지 않았다)",
    );
  return out;
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const json = args.includes("--json");

  // **`--all` 은 대상 집합을 손으로 적지 않는다.** CI 가 글롭을 인자로 펴서 넘기면
  // 그 글롭이 ci.ts 안에 굳고, 새 편이 늘 때 아무도 그 자리를 안 고친다.
  if (args.includes("--all")) {
    const { v2Guides } = await import("./guide-v2-targets.ts");
    const targets = await v2Guides();
    if (targets.length === 0) {
      console.log("v2 가이드가 아직 없다 — 잰 것이 없다.");
      process.exit(0);
    }
    let bad = 0;
    let warned = 0;
    let warnedGuides = 0;
    const skipped = new Map<string, number>();
    for (const t of targets) {
      const r = await checkOne(t, json);
      bad += r.bad;
      warned += r.warnings;
      if (r.warnings > 0) warnedGuides++;
      for (const m of r.missing) skipped.set(m, (skipped.get(m) ?? 0) + 1);
    }
    // 편마다 안내를 찍으면 111편 × 세 줄이라 통과 화면이 안내로 덮인다. 대신
    // **편 수로 한 번** 적는다 — 0 이면 아무 줄도 안 나오는 것이 정상이다.
    if (!json && skipped.size > 0) {
      const order = ["sim", "bench", "ref"];
      const parts = order
        .filter((k) => skipped.has(k))
        .map((k) => `${k} ${skipped.get(k)}편`);
      console.log(`\n사이드카가 없어 건너뛴 검사 — ${parts.join(" · ")}`);
    }
    // **경고는 판정에 안 들어간다.** 그래도 편 수를 적는다 — 안 적으면 「잡았는데 아무도
    // 안 본 자리」가 되고, 그것이 이 규칙이 일곱 배치를 샌 방식이다.
    if (!json && warned > 0) {
      console.log(
        `\n경고 — 열이 어긋나거나 걸음을 건너뛴 자리 ${warned}건 (${warnedGuides}편). ` +
          `\`--json\` 의 \`warnings\` 나 편별 실행으로 자리를 본다. ` +
          `지금은 경고이고, 그 편들을 고친 뒤 위반으로 올린다.`,
      );
    }
    process.exit(bad === 0 ? 0 : 1);
  }

  const target = args.find((a) => !a.startsWith("--"));
  if (target === undefined) {
    console.error(
      "용법: bun run tools/check-v2.ts [--json] <guide.md> | --all",
    );
    process.exit(2);
  }

  // 대상이 없는 것은 **용법 오류**라 위반(1)이 아니라 2 다. 그 판정만 여기서 하고
  // 나머지는 `--all` 과 같은 함수를 지난다.
  if (!(await Bun.file(target).exists())) {
    console.error(`대상이 없다: ${target}`);
    process.exit(2);
  }
  const { bad } = await checkOne(target, json, true);
  process.exit(bad === 0 ? 0 : 1);
}
