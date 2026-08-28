/**
 * 자기증명 대조 — 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록을 **실제로 실행해** 맞춘다.
 *
 * ## 왜 이것이 이해 시험 자리에 오는가
 *
 * 이해 시험(`comprehension.sh`)은 외부 모델에게 본문을 주고 일곱을 되물었다. 2026-08-29
 * 유저가 **외부 모델 없이 간다**고 정했다. 모델이 하던 일 중 **값을 확인하던 몫**은 실행으로
 * 내릴 수 있다 — 모델은 값이 그럴듯하면 통과시키지만, 실행은 한 글자만 달라도 잡는다.
 *
 * 옮겨지지 않는 몫은 **산문이 실제로 설명하는가**이고 그것은 사람에게 남는다. 이 도구는 그
 * 자리를 대신하는 척하지 않는다 — `FEEDBACK.md` §3 이 그 목록이다.
 *
 * ## 규격
 *
 * 본문에 마커를 두고 바로 아래 펜스 블록을 둔다.
 *
 * ```md
 * <!--proof:mutant-i-inc-->
 *
 * ```text
 * (실행 결과)
 * ```
 * ```
 *
 * 사이드카 `<name>-guide.proof.ts` 가 그 id 로 블록 내용을 만든다.
 *
 * ```ts
 * import { quickSort } from "./quicksort-guide.ref.ts";
 * export const PROOFS: Record<string, () => string> = {
 *   "mutant-i-inc": () => …,
 * };
 * ```
 *
 * ## 무엇을 잡는가
 *
 * 1. 마커와 `PROOFS` 키가 **양방향으로** 맞는가(본문에만 있는 것 · 사이드카에만 있는 것 둘 다 실패)
 * 2. 마커 바로 아래가 펜스 블록인가
 * 3. 블록 내용이 실행 결과와 **글자 그대로** 같은가(줄 끝 공백과 끝의 빈 줄만 무시한다)
 * 4. 사이드카가 `<name>-guide.ref.ts` 를 **import 하는가** — 안 하면 값을 손으로 적어 넣고
 *    통과시킬 수 있다. 그러면 이 도구는 "본문과 사이드카가 같다" 만 재고 **실행을 안 잰다**.
 *
 * 4번이 이 도구의 판정력 전부다. 그것 없이는 대조가 자기 자신과의 대조가 된다.
 *
 * ```bash
 * bun run tools/check-proof.ts <guide.md>
 * ```
 *
 * 종료코드: 0 통과 · 1 위반 · 2 사용법 오류
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

/** 사이드카가 내보내는 것. 키는 본문 마커의 id 다. */
export type Proofs = Record<string, () => string>;

export interface ProofBlock {
  id: string;
  /** 마커가 있는 줄 번호(1부터). 어긋났을 때 사람이 찾아갈 자리다. */
  line: number;
  /** 펜스 안의 내용. 펜스 줄 자체는 뺀다. */
  body: string | null;
}

/** 줄 끝 공백과 끝의 빈 줄을 지운다. 그 둘은 편집기가 만들고 뜻이 없다. */
export function normalize(text: string): string {
  return text
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}

/**
 * 본문에서 `<!--proof:{id}-->` 와 그 **바로 아래 펜스**를 뽑는다.
 *
 * 마커와 펜스 사이의 빈 줄은 허용한다 — 마커를 펜스에 붙여 쓰면 P1(산문 연속)이 마커를
 * 문단으로 세기 때문이다. 빈 줄 아닌 것이 끼면 `body` 가 `null` 이고 그것이 위반이다.
 */
export function extractBlocks(text: string): ProofBlock[] {
  const lines = text.split("\n");
  const out: ProofBlock[] = [];
  for (const [index, line] of lines.entries()) {
    const m = /^<!--proof:([A-Za-z0-9_-]+)-->$/.exec(line.trim());
    if (m?.[1] === undefined) continue;
    const id = m[1];
    let i = index + 1;
    while (i < lines.length && lines[i]?.trim() === "") i++;
    const opener = lines[i] ?? "";
    if (!opener.trimStart().startsWith("```")) {
      out.push({ id, line: index + 1, body: null });
      continue;
    }
    const bodyLines: string[] = [];
    i++;
    while (
      i < lines.length &&
      !(lines[i] ?? "").trimStart().startsWith("```")
    ) {
      bodyLines.push(lines[i] ?? "");
      i++;
    }
    out.push({ id, line: index + 1, body: bodyLines.join("\n") });
  }
  return out;
}

export interface ProofFailure {
  id: string;
  line: number;
  kind:
    | "펜스 없음"
    | "사이드카에 없음"
    | "본문에 없음"
    | "값이 다르다"
    | "실행 실패";
  detail: string;
}

/** 첫 줄만 다른 것이 아니라 **어느 줄이** 다른지 짚는다. */
function firstDiff(want: string, got: string): string {
  const a = want.split("\n");
  const b = got.split("\n");
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return `${i + 1}번째 줄\n      본문: ${JSON.stringify(a[i] ?? "(없음)")}\n      실행: ${JSON.stringify(b[i] ?? "(없음)")}`;
    }
  }
  return "차이 없음";
}

export function compare(blocks: ProofBlock[], proofs: Proofs): ProofFailure[] {
  const fails: ProofFailure[] = [];
  const seen = new Set<string>();
  for (const b of blocks) {
    seen.add(b.id);
    if (b.body === null) {
      fails.push({
        id: b.id,
        line: b.line,
        kind: "펜스 없음",
        detail: "마커 바로 아래가 펜스 블록이어야 한다",
      });
      continue;
    }
    const make = proofs[b.id];
    if (make === undefined) {
      fails.push({
        id: b.id,
        line: b.line,
        kind: "사이드카에 없음",
        detail: "`.proof.ts` 의 PROOFS 에 같은 키를 두어라",
      });
      continue;
    }
    let got: string;
    try {
      got = make();
    } catch (e) {
      fails.push({
        id: b.id,
        line: b.line,
        kind: "실행 실패",
        detail: String(e),
      });
      continue;
    }
    const want = normalize(b.body);
    const have = normalize(got);
    if (want !== have) {
      fails.push({
        id: b.id,
        line: b.line,
        kind: "값이 다르다",
        detail: firstDiff(want, have),
      });
    }
  }
  for (const id of Object.keys(proofs)) {
    if (!seen.has(id)) {
      fails.push({
        id,
        line: 0,
        kind: "본문에 없음",
        detail:
          "쓰이지 않는 증명이다. 본문에 마커를 두거나 사이드카에서 지워라",
      });
    }
  }
  return fails;
}

/**
 * 사이드카가 정본 구현을 **실제로 부르는가**.
 *
 * 이 검사가 이 도구의 판정력 전부다. 값을 문자열로 적어 넣은 사이드카는 본문과 언제나
 * 일치하고, 그러면 대조가 자기 자신과의 대조가 된다.
 */
export function importsRef(proofSource: string, refBase: string): boolean {
  return new RegExp(
    `from\\s+["'][^"']*${refBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
  ).test(proofSource);
}

/**
 * 변이를 **정본 소스에서 기계로** 만든다.
 *
 * 손으로 베낀 사본을 쓰면 「한 곳만 바꿨다」가 검사되지 않는다 — 사본이 정본과 다른 자리를
 * 더 갖고 있어도 아무도 모른다. 여기서는 `.ref.ts` 원문을 읽어 **그 자리 하나**를 지우거나
 * 바꾸고, 맞은 줄이 정확히 하나가 아니면 던진다.
 *
 * 잘라낸 소스는 임시 디렉터리에 `.ts` 로 두고 그대로 import 한다. Bun 이 TypeScript 를
 * 그냥 읽으므로 트랜스파일 단계가 없다 — `data:` URL 은 Bun 의 변환이 CommonJS 로 나와
 * 이름 있는 export 가 사라진다(실측).
 */
export async function loadMutant<T>(
  refPath: string,
  mutation: { drop?: RegExp; swap?: [RegExp, string] },
): Promise<T> {
  const lines = readFileSync(refPath, "utf8").split("\n");
  let hits = 0;
  const out: string[] = [];
  for (const line of lines) {
    if (mutation.drop?.test(line) === true) {
      hits++;
      continue;
    }
    if (mutation.swap?.[0].test(line) === true) {
      hits++;
      out.push(line.replace(mutation.swap[0], mutation.swap[1]));
      continue;
    }
    out.push(line);
  }
  if (hits !== 1) {
    throw new Error(
      `변이가 ${hits} 줄에 맞았다 — 한 줄이어야 한다. 「한 곳 바꿨다」가 거짓이 된다`,
    );
  }
  const dir = mkdtempSync(join(tmpdir(), "algo-proof-"));
  const path = join(dir, `${basename(refPath)}`);
  writeFileSync(path, out.join("\n"), "utf8");
  return (await import(path)) as T;
}

export interface RunResult {
  guide: string;
  blocks: number;
  failures: ProofFailure[];
  /** 사이드카가 없다 — 마커도 없으면 통과, 마커가 있으면 위반이다. */
  sidecarMissing: boolean;
  refNotImported: boolean;
}

export async function run(guidePath: string): Promise<RunResult> {
  const text = readFileSync(guidePath, "utf8");
  const blocks = extractBlocks(text);
  const dir = dirname(guidePath);
  const stem = basename(guidePath).replace(/\.md$/, "");
  // 동적 import 는 **절대 경로**여야 한다 — 상대 경로는 이 파일 기준으로 풀린다.
  const proofPath = resolve(join(dir, `${stem}.proof.ts`));
  const refBase = `${stem}.ref`;

  if (!existsSync(proofPath)) {
    return {
      guide: guidePath,
      blocks: blocks.length,
      failures: blocks.map((b) => ({
        id: b.id,
        line: b.line,
        kind: "사이드카에 없음" as const,
        detail: `${stem}.proof.ts 가 없다`,
      })),
      sidecarMissing: true,
      refNotImported: false,
    };
  }

  const mod = (await import(proofPath)) as { PROOFS?: Proofs };
  const proofs = mod.PROOFS ?? {};
  const refNotImported = !importsRef(readFileSync(proofPath, "utf8"), refBase);
  return {
    guide: guidePath,
    blocks: blocks.length,
    failures: compare(blocks, proofs),
    sidecarMissing: false,
    refNotImported,
  };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  // `--require` 는 증명 블록이 **하나도 없는 편**을 위반으로 본다. 편별 완료 기준이 쓴다.
  const require1 = argv.includes("--require");
  const files = argv.filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    console.error(
      "대상이 없다. 사용: bun run tools/check-proof.ts [--require] <guide.md>",
    );
    process.exit(2);
  }
  let bad = 0;
  for (const f of files) {
    const r = await run(f);
    if (r.refNotImported) {
      console.log(
        `${f} — 사이드카가 .ref.ts 를 import 하지 않는다. 값이 실행에서 왔는지 잴 수 없다.`,
      );
      bad++;
    }
    for (const x of r.failures) {
      console.log(`${f}:${x.line}  [${x.id}] ${x.kind}`);
      console.log(`    ${x.detail}`);
      bad++;
    }
    if (r.failures.length === 0 && !r.refNotImported) {
      // **0개를 「전부 일치」로 적지 않는다.** 아무것도 안 잰 것이 통과로 읽히면 게이트가
      // 거짓말을 한다 — 증명 블록 없는 편이 107 중 대다수인 동안 특히 그렇다.
      if (r.blocks === 0) {
        console.log(`${f} — 증명 블록 없음. 이 편은 아무것도 재지 않았다.`);
        if (require1) bad++;
      } else {
        console.log(`${f} — 증명 ${r.blocks}개 전부 실행과 일치.`);
      }
    }
  }
  process.exit(bad === 0 ? 0 : 1);
}
