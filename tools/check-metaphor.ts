/**
 * 은유 스캐너 — **모든 문서와 사이드카 소스**에 건다.
 *
 * `check-v2.ts` 의 P2 는 가이드(`*-guide.md`)만 본다. 그래서 `SPEC.md` 에 남아 있던
 * "카드가 이긴다" 를 놓쳤고, 유저가 그것을 지적했다. 규칙이 문서 종류에 따라 갈리면
 * **안 걸리는 자리가 생기고, 그 자리가 다음 원고의 본보기가 된다.**
 *
 * 패턴은 `check-v2.ts` 의 `METAPHORS` 하나를 쓴다 — 정의가 두 곳에 있으면 갈라진다.
 *
 * ```bash
 * bun run tools/check-metaphor.ts SPEC.md pilot/**\/*.md
 * ```
 *
 * 종료코드: 0 통과 · 1 위반 · 2 대상 없음
 *
 * **인용은 예외다.** 유저 지적 원문을 보관하는 `feedback.md` 와 이력인 `JOURNAL.md` 는 통째로
 * 빼고, 다른 문서에서도 인용 블록(`>` 로 시작하는 줄)과 인라인 인용(`*"…"*`)은 검사하지
 * 않는다 — 거기 적힌 금지 표현은 글쓴이의 문장이 아니라 **자료**다. 인라인 인용은 **줄을
 * 통째로 빼지 않고 그 구간만 지운다** — 한 문단이 인용과 본문을 함께 담기 때문이다.
 *
 * ## 사이드카 `.ts` 도 본다 (2026-09-10 · `KAN-034.9` `S8`)
 *
 * `.md` 만 보는 동안 사이드카(`*-guide.{sim,ref,proof,test,alt}.ts`)의 주석·문자열에 남은
 * 은유는 **생성 블록을 타고 원고에 들어와서야** 잡혔다 — 들어오지 않는 것은 영영 안 잡힌다.
 * 실측(`KAN-034.7` 배치10): `sparseTableRangeMin` 사이드카에 14자리가 있었고 **그중 9자리가
 * `.md` 에 안 실린다.**
 *
 * 소스를 대상에 넣을 때 걸리는 것이 **코드에는 어미가 없다**는 것이다. `FEEDBACK.md` §4 가
 * 세운 「막을 것을 명사가 아니라 어미로 적는다」는 「돈」(화폐)·「돌」(석재) 같은 자연 서술이
 * 오탐이 되는 것을 막는 규칙인데, `cost`·`weight`·`cheap` 같은 **식별자에는 붙일 어미가
 * 없다.** 그래서 경계를 글자 종류가 아니라 **문법 위치**로 긋는다 — `maskSource` 가 소스를
 * 훑어 **주석 본문과 문자열 리터럴 안쪽만** 남기고 식별자·키워드·숫자·정규식 몸통은 공백으로
 * 지운다. 한글로 지은 식별자(`const 훑기 = 1`)도 같은 문이 막는다 — 글자로 갈랐으면 그것이
 * 새는 자리다.
 *
 * **`"` 의 뜻이 두 종류에서 뒤집힌다.** `.md` 에서 `"…"` 는 인용 표시라 지우지만, `.ts`
 * 에서 `"…"` 는 문자열 리터럴의 **경계**이고 그 안쪽이 독자가 읽는 글이다. 마스킹이 경계를
 * 먼저 걷어 내고 `stripQuotes` 는 **걷어 낸 뒤 남은 본문**에 건다 — 그러면 주석 안의
 * 인용(`*"…"*`)과 낫표(`「…」`)는 `.md` 와 똑같이 자료로 빠지고, 문자열 리터럴의 본문은
 * 검사 대상으로 남는다.
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { METAPHORS, stripQuotes } from "./check-v2.ts";

/** 원문 인용을 담는 문서. 여기서는 금지 표현이 자료다. */
const QUOTE_DOCS = new Set(["feedback.md", "JOURNAL.md"]);

/**
 * 사이드카 다섯 갈래. `X-guide.md` 옆에 `X-guide.<갈래>.ts` 로 선다.
 *
 * **대상 집합을 글롭으로 새로 적지 않는다** — `guide-v2-targets.ts` 의 `v2Guides()` 가 이미
 * 111편을 정하고 `_deprecated/`·`_scratch/` 를 뺀다. 여기서는 그 목록의 **옆자리**를 볼
 * 뿐이라 제외 규칙이 갈릴 자리가 없다.
 */
import { SIDECAR_KINDS } from "./guide-v2-targets.ts";

const SIDECAR_RE = new RegExp(`-guide\\.(?:${SIDECAR_KINDS.join("|")})\\.ts$`);

/** 사이드카 파일 이름인가. `<이름>-guide.<갈래>.ts` 만 참이다. */
export const isSidecar = (file: string): boolean => SIDECAR_RE.test(file);

/**
 * **`.md` 와 사이드카 `.ts` 만 본다.** 다른 소스(`tools/*.ts`)에는 이 스캐너의 패턴 자체가
 * 들어 있어서, 대상에 넣으면 스캐너가 자기 정의를 위반으로 보고한다. 그래서 `.ts` 는
 * **이름이 사이드카인 것만** 받는다 — 손으로 경로를 넘겨도 이 문이 막는다.
 */
const isTarget = (file: string): boolean =>
  file.endsWith(".md") || isSidecar(file);

export interface MetaphorHit {
  file: string;
  line: number;
  found: string;
  label: string;
  text: string;
  /** 소스에서 나온 자리면 어느 갈래인가. 문서는 값이 없다. */
  kind?: "comment" | "string";
  /** 참이면 경고다 — 판정(종료코드)에 안 들어간다. `SEVERITY` 에 근거가 있다. */
  warn?: true;
}

/**
 * **펜스 안도 본다.** ascii 그림의 설명 문구도 독자가 읽는 글이다. 실제로 `여기서 터진다` 가
 * 그림 안에 있었다. 코드 블록의 식별자는 영문이라 이 패턴에 걸리지 않는다.
 *
 * 이름이 사이드카면 `scanCode` 로 넘긴다 — 부르는 쪽이 종류를 가르지 않게 한다.
 */
export function scan(file: string, source: string): MetaphorHit[] {
  if (isSidecar(file)) return scanCode(file, source);
  const out: MetaphorHit[] = [];
  // 인라인 인용은 **줄을 넘어간다** — `*"후보 …\n… 첫째"*` 처럼 두 줄에 걸친 것이 실제로
  // 있었다(`SURVEY.md:50-51`). 줄마다 따로 지우면 그 뒷줄이 본문으로 보인다. 그래서 `"`
  // 개수로 상태를 이어 간다.
  let inQuote = false;
  for (const [index, line] of source.split("\n").entries()) {
    if (line.trimStart().startsWith("```")) continue;
    // 인용 블록(`>`)은 원문 보관이다. 지적 원문과 "이렇게 쓰면 안 된다" 는 예시가 여기 든다.
    if (line.trimStart().startsWith(">")) continue;
    const outside = stripQuotes(line, inQuote);
    // 이 줄의 `"` 가 홀수 개면 인용이 다음 줄로 이어진다.
    if ((line.match(/"/g)?.length ?? 0) % 2 === 1) inQuote = !inQuote;
    for (const { re, label } of METAPHORS) {
      const hit = re.exec(outside);
      if (hit === null) continue;
      out.push({
        file,
        line: index + 1,
        found: hit[0],
        label,
        text: line.trim(),
      });
    }
  }
  return out;
}

/** 소스를 갈래별로 지운 결과. 두 마스크는 줄 수도 줄 길이도 원본과 같다. */
export interface SourceMasks {
  /** 주석 본문만 남고 나머지는 공백. */
  comment: string[];
  /** 문자열·템플릿 리터럴 **안쪽**만 남고 나머지는 공백(경계 따옴표도 지운다). */
  string: string[];
}

/** 정규식 앞에 올 수 있는 낱말 — 뒤의 `/` 는 나눗셈이 아니다. */
const REGEX_PRECEDING = new Set([
  "return",
  "case",
  "typeof",
  "in",
  "of",
  "new",
  "delete",
  "void",
  "instanceof",
  "do",
  "else",
  "yield",
  "await",
]);

type Mode = "code" | "line" | "block" | "sq" | "dq" | "tpl";

/**
 * 소스에서 **산문이 있는 자리만** 남긴다 — 주석 본문과 문자열 리터럴 안쪽.
 *
 * **자리를 유지한 채 지운다**(줄 길이가 같다). 두 리터럴이 붙어 있을 때
 * (`["질의", "칸 수"]`) 잘라서 이어 붙이면 없던 글자 이음매가 생기고, 그 이음매가 은유
 * 패턴에 걸린다 — 「…에 서」 + 「는 …」 이 「에 서는」 이 되는 꼴이다.
 *
 * **정규식 리터럴은 코드다.** `/` 를 나눗셈과 가르는 것은 앞의 유효 문자로 판정하고, 닫는
 * `/` 를 그 줄 안에서 못 찾으면 **나눗셈으로 되돌린다** — 정규식 리터럴은 줄을 못 넘으므로
 * 이 되돌리기가 오판의 파급을 그 줄 안에 가둔다.
 */
export function maskSource(source: string): SourceMasks {
  const lines = source.split("\n");
  const comment = lines.map((l) => Array.from({ length: l.length }, () => " "));
  const str = lines.map((l) => Array.from({ length: l.length }, () => " "));

  // 템플릿 리터럴이 `${}` 로 코드를 품고 그 코드가 다시 템플릿을 품는다. 스택으로 센다.
  const stack: { mode: Mode; depth: number }[] = [{ mode: "code", depth: 0 }];
  const top = (): { mode: Mode; depth: number } =>
    stack[stack.length - 1] as { mode: Mode; depth: number };
  /** 마지막으로 지나간 코드 글자 — 정규식·나눗셈 판정에 쓴다. */
  let lastCode = "";
  /** 마지막으로 지나간 코드 낱말 — 키워드 판정에 쓴다. */
  let lastWord = "";
  let row = 0;
  let col = 0;

  const put = (kind: "comment" | "string", ch: string): void => {
    const target = kind === "comment" ? comment : str;
    (target[row] as string[])[col] = ch;
  };

  for (let i = 0; i < source.length; i++) {
    const ch = source[i] as string;
    const next = source[i + 1] ?? "";
    if (ch === "\n") {
      row++;
      col = 0;
      // 한 줄 주석과 안 닫힌 리터럴은 줄 끝에서 끝난다.
      if (top().mode === "line" || top().mode === "sq" || top().mode === "dq")
        stack.pop();
      continue;
    }
    // **줄바꿈은 절대 건너뛰지 않는다** — 건너뛰면 `row` 가 어긋나 그 뒤 자리가 전부 밀린다.
    const advance = (n: number): void => {
      if (source.slice(i + 1, i + 1 + n).includes("\n")) return;
      i += n;
      col += n;
    };

    switch (top().mode) {
      case "line":
        put("comment", ch);
        break;
      case "block":
        if (ch === "*" && next === "/") {
          stack.pop();
          advance(1);
          break;
        }
        put("comment", ch);
        break;
      case "sq":
      case "dq": {
        const quote = top().mode === "sq" ? "'" : '"';
        if (ch === "\\") {
          advance(1); // 이스케이프는 산문이 아니다 — 두 글자 다 공백으로 둔다.
          break;
        }
        if (ch === quote) {
          stack.pop();
          break;
        }
        put("string", ch);
        break;
      }
      case "tpl":
        if (ch === "\\") {
          advance(1);
          break;
        }
        if (ch === "`") {
          stack.pop();
          break;
        }
        if (ch === "$" && next === "{") {
          stack.push({ mode: "code", depth: 0 });
          advance(1);
          break;
        }
        put("string", ch);
        break;
      case "code": {
        if (ch === "/" && next === "/") {
          stack.push({ mode: "line", depth: 0 });
          advance(1);
          break;
        }
        if (ch === "/" && next === "*") {
          stack.push({ mode: "block", depth: 0 });
          advance(1);
          break;
        }
        if (ch === '"' || ch === "'") {
          stack.push({ mode: ch === '"' ? "dq" : "sq", depth: 0 });
          lastCode = ch;
          lastWord = "";
          break;
        }
        if (ch === "`") {
          stack.push({ mode: "tpl", depth: 0 });
          lastCode = ch;
          lastWord = "";
          break;
        }
        if (ch === "{") {
          top().depth++;
          lastCode = ch;
          lastWord = "";
          break;
        }
        if (ch === "}") {
          if (top().depth === 0 && stack.length > 1) stack.pop();
          else if (top().depth > 0) top().depth--;
          lastCode = ch;
          lastWord = "";
          break;
        }
        if (ch === "/") {
          const division =
            /[\w$)\]]/.test(lastCode) && !REGEX_PRECEDING.has(lastWord);
          if (!division) {
            const end = regexEnd(source, i);
            if (end !== -1) {
              advance(end - i); // 몸통은 코드다 — 마스크에 안 넣는다.
              lastCode = "/";
              lastWord = "";
              break;
            }
            // 줄 안에서 안 닫혔다 — 정규식이 아니다. 나눗셈으로 되돌린다.
          }
          lastCode = ch;
          lastWord = "";
          break;
        }
        if (!/\s/.test(ch)) {
          lastCode = ch;
          lastWord = /[\w$]/.test(ch) ? lastWord + ch : "";
        }
        break;
      }
    }
    col++;
  }
  return {
    comment: comment.map((r) => r.join("")),
    string: str.map((r) => r.join("")),
  };
}

/**
 * `source[start]` 가 `/` 일 때 정규식 리터럴이 닫히는 `/` 의 인덱스. 그 줄에서 안 닫히면
 * `-1` — 정규식 리터럴은 줄을 못 넘는다.
 */
function regexEnd(source: string, start: number): number {
  let inClass = false;
  for (let i = start + 1; i < source.length; i++) {
    const ch = source[i] as string;
    if (ch === "\n") return -1;
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === "[") inClass = true;
    else if (ch === "]") inClass = false;
    else if (ch === "/" && !inClass) return i;
  }
  return -1;
}

/** JSDoc 의 줄머리 장식 `*` 은 글이 아니다. 자리는 유지한 채 공백으로 바꾼다. */
const stripJsdocGutter = (line: string): string =>
  line.replace(/^(\s*)\*(\s?)/, (_m, a: string, b: string) => `${a} ${b}`);

/**
 * 사이드카 `.ts` 를 본다 — **주석 본문과 문자열 리터럴 안쪽만.**
 *
 * 마스킹을 지난 뒤로는 `.md` 와 같은 규칙이다: 펜스 표시줄과 인용 블록(`>`)을 빼고,
 * `stripQuotes` 로 인라인 인용과 낫표를 지운 나머지를 본다. **두 갈래를 따로 훑는다** —
 * 인용이 줄을 넘는 상태(`inQuote`)가 주석과 문자열 사이에서 섞이면 안 된다.
 */
export function scanCode(file: string, source: string): MetaphorHit[] {
  const lines = source.split("\n");
  const masks = maskSource(source);
  const out: MetaphorHit[] = [];
  for (const kind of ["comment", "string"] as const) {
    let inQuote = false;
    for (const [index, masked] of masks[kind].entries()) {
      const body = kind === "comment" ? stripJsdocGutter(masked) : masked;
      if (body.trim() === "") continue;
      if (body.trimStart().startsWith("```")) continue;
      if (body.trimStart().startsWith(">")) continue;
      const outside = stripQuotes(body, inQuote);
      if ((body.match(/"/g)?.length ?? 0) % 2 === 1) inQuote = !inQuote;
      for (const { re, label } of METAPHORS) {
        const hit = re.exec(outside);
        if (hit === null) continue;
        out.push({
          file,
          line: index + 1,
          found: hit[0],
          label,
          text: (lines[index] as string).trim(),
          kind,
          warn: true,
        });
      }
    }
  }
  return out.sort((a, b) => a.line - b.line);
}

/**
 * **심각도 — 사이드카는 경고, 문서는 위반.**
 *
 * 근거는 실측이다. 111편의 사이드카 526개 전수에서 은유가 **77편 · 파일 111 · 177자리**다.
 * **오탐이라서 경고인 것이 아니다** — 표본 30자리를 손으로 가르니 28 이 실제 부채였다(오탐
 * 둘은 회전을 뜻하는 「돌려」다). 한꺼번에 위반으로 내면 다른 편을 닫는 세션이 **자기 것이
 * 아닌 빨강**을 보고, 그것이 `check-proof` 의 「중화 대조를 못 잰 자리」(82블록·32편)와
 * `P15` 의 열 정렬(151자리·62편)이 같은 이유로 경고로 선 자리다. 그 사다리가 관행이다.
 *
 * **문서(`.md`)는 그대로 위반이다** — 지금 0 이고, 경고로 내리면 서 있던 문이 열린다.
 *
 * 승격 경로: 177자리를 고친 뒤 `scanCode` 의 `warn` 을 떼면 사이드카도 위반이 된다.
 */
export const SEVERITY = "사이드카는 경고 · 문서는 위반" as const;

/** `--all` 의 대상 — 문서(`v2Docs`)에 사이드카 다섯 갈래를 더한다. */
export async function allTargets(): Promise<string[]> {
  const targets = await import("./guide-v2-targets.ts");
  return [...(await targets.v2Docs()), ...(await targets.v2Sidecars())];
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  // `--all` 은 규격 문서 + v2 가이드 + 사이드카 전부다. 집합은 `guide-v2-targets.ts` 가 정한다.
  const raw = argv.includes("--all")
    ? await allTargets()
    : argv.filter((a) => !a.startsWith("--"));
  const files = raw.filter((f) => isTarget(f) && !QUOTE_DOCS.has(basename(f)));
  if (files.length === 0) {
    console.error(
      "대상 문서가 없다. 사용: bun run tools/check-metaphor.ts [--all] <파일...>",
    );
    process.exit(2);
  }
  const hits = files.flatMap((f) => scan(f, readFileSync(f, "utf8")));
  const bad = hits.filter((h) => h.warn === undefined);
  const warned = hits.filter((h) => h.warn === true);
  const show = (h: MetaphorHit): void => {
    const where = h.kind === undefined ? "" : ` [${h.kind}]`;
    console.log(`${h.file}:${h.line}  "${h.found}"${where}  ${h.label}`);
    console.log(`    ${h.text.slice(0, 100)}`);
  };
  for (const h of bad) show(h);
  // **경고도 자리를 적는다.** 수만 적으면 「잡았는데 아무도 안 본 자리」가 되고, 그것이 이
  // 규칙이 `.md` 밖에서 열 배치를 샌 방식이다.
  if (warned.length > 0) {
    // **편과 파일을 갈라 적는다.** 한 편이 사이드카 다섯을 갖고 있어서 파일 수를 편 수로
    // 읽으면 부채 규모가 다섯 배로 보인다.
    const files_ = new Set(warned.map((h) => h.file));
    const editions = new Set(
      [...files_].map((f) => f.replace(/-guide\.\w+\.ts$/, "")),
    );
    console.log(
      `\n경고 — 사이드카 은유 ${warned.length}자리 ` +
        `(${editions.size}편 · 파일 ${files_.size}).`,
    );
    for (const h of warned) show(h);
    console.log(
      "\n지금은 경고이고, 그 편들을 고친 뒤 위반으로 올린다. " +
        "판정(종료코드)에는 안 들어간다.",
    );
  }
  if (bad.length === 0) {
    console.log(`\n대상 ${files.length}개에 은유 위반이 없다.`);
    process.exit(0);
  }
  console.error(`\n은유 ${bad.length}건.`);
  process.exit(1);
}
