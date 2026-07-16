/**
 * ORD-004 재사용 자산 추출기 — LLM copy의 미세 오타·구문 파손을 배제한다.
 *
 * 구 가이드(보통 `_deprecated/<name>-guide.mdx`)에서 시뮬레이션 자산과 mermaid 블록을
 * **프로그래밍 방식으로 무손실 추출**한다. 신규 가이드 집필 시 본문(prose)은 sonnet이 쓰고,
 * sim/mermaid 원본 코드는 이 추출 결과를 그대로 주입한다.
 *
 * 추출 대상:
 *  - `export const <id> = …;`  (nums·steps 등 시뮬 데이터. 문자열/괄호를 인식하는 깊이 스캔)
 *  - `<AlgorithmSimulation … />`  (시뮬 호출부, 여러 줄 가능)
 *  - ```mermaid … ```  (다이어그램 블록, 0개 이상)
 *
 * 사용:
 *   bun run tools/ord004-extract-assets.ts <source.mdx>            # JSON 요약
 *   bun run tools/ord004-extract-assets.ts <source.mdx> --emit sim      # 시뮬 블록만(붙여넣기용)
 *   bun run tools/ord004-extract-assets.ts <source.mdx> --emit mermaid  # mermaid 블록만
 */

const [srcPath, ...rest] = process.argv.slice(2);
if (!srcPath) {
  console.error(
    "usage: bun run tools/ord004-extract-assets.ts <source.mdx> [--emit sim|mermaid]",
  );
  process.exit(1);
}
const emitIdx = rest.indexOf("--emit");
const emit = emitIdx >= 0 ? rest[emitIdx + 1] : null;

const src = await Bun.file(srcPath).text();

/** `export const` 문을 문자열·괄호 깊이를 인식하며 종결 `;`까지 통째로 추출. */
function extractExports(text: string): string[] {
  const out: string[] = [];
  const re = /^export const \w+\s*=/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const start = m.index;
    let i = re.lastIndex;
    let depth = 0;
    let str: string | null = null; // 현재 문자열 리터럴의 따옴표
    for (; i < text.length; i++) {
      const c = text[i];
      const prev = text[i - 1];
      if (str) {
        if (c === str && prev !== "\\") str = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        str = c;
        continue;
      }
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth--;
      else if (c === ";" && depth === 0) {
        i++;
        break;
      }
    }
    out.push(text.slice(start, i).trim());
    re.lastIndex = i;
  }
  return out;
}

/** `<AlgorithmSimulation … />` 호출부(여러 줄 가능)를 추출. */
function extractSimCall(text: string): string | null {
  const start = text.indexOf("<AlgorithmSimulation");
  if (start < 0) return null;
  const end = text.indexOf("/>", start);
  if (end < 0) return null;
  return text.slice(start, end + 2).trim();
}

/** ```mermaid … ``` 펜스 블록을 모두 추출(펜스 포함). */
function extractMermaid(text: string): string[] {
  const out: string[] = [];
  const re = /^```mermaid[ \t]*\n([\s\S]*?)^```[ \t]*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[0].trim());
  return out;
}

const exports = extractExports(src);
const simCall = extractSimCall(src);
const mermaid = extractMermaid(src);

if (emit === "sim") {
  if (!exports.length && !simCall) {
    console.error("no simulation assets found");
    process.exit(2);
  }
  console.log([...exports, simCall].filter(Boolean).join("\n\n"));
} else if (emit === "mermaid") {
  if (!mermaid.length) {
    console.error("no mermaid blocks found");
    process.exit(2);
  }
  console.log(mermaid.join("\n\n"));
} else {
  console.log(
    JSON.stringify(
      {
        source: srcPath,
        hasSim: Boolean(exports.length || simCall),
        exportCount: exports.length,
        exports,
        simCall,
        mermaidCount: mermaid.length,
        mermaid,
      },
      null,
      2,
    ),
  );
}
