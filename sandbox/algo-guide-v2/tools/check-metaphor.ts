/**
 * 은유 스캐너 — **모든 문서**에 건다.
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
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { METAPHORS, stripQuotes } from "./check-v2.ts";

/** 원문 인용을 담는 문서. 여기서는 금지 표현이 자료다. */
const QUOTE_DOCS = new Set(["feedback.md", "JOURNAL.md"]);

/**
 * **`.md` 만 본다.** 소스(`.ts`)에는 이 스캐너의 패턴 자체가 들어 있어서, 대상에 넣으면
 * 스캐너가 자기 정의를 위반으로 보고한다. 소스 주석과 출력 메시지는 사람이 본다.
 */
const isDoc = (file: string): boolean => file.endsWith(".md");

export interface MetaphorHit {
  file: string;
  line: number;
  found: string;
  label: string;
  text: string;
}

/**
 * **펜스 안도 본다.** ascii 그림의 설명 문구도 독자가 읽는 글이다. 실제로 `여기서 터진다` 가
 * 그림 안에 있었다. 코드 블록의 식별자는 영문이라 이 패턴에 걸리지 않는다.
 */
export function scan(file: string, source: string): MetaphorHit[] {
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

if (import.meta.main) {
  const files = process.argv
    .slice(2)
    .filter((f) => isDoc(f) && !QUOTE_DOCS.has(basename(f)));
  if (files.length === 0) {
    console.error(
      "대상 문서가 없다. 사용: bun run tools/check-metaphor.ts <파일...>",
    );
    process.exit(2);
  }
  const hits = files.flatMap((f) => scan(f, readFileSync(f, "utf8")));
  if (hits.length === 0) {
    console.log(`문서 ${files.length}편에 은유 표현이 없다.`);
    process.exit(0);
  }
  for (const h of hits) {
    console.log(`${h.file}:${h.line}  "${h.found}"  ${h.label}`);
    console.log(`    ${h.text.slice(0, 100)}`);
  }
  console.error(`\n은유 ${hits.length}건.`);
  process.exit(1);
}
