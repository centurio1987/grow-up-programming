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
 * 5. **변이가 낸 값인가, 그리고 어느 줄이 변이 때문에 갈리는가**(아래 「변이 중화 대조」).
 *
 * 4번이 값 대조의 판정력 전부다. 그것 없이는 대조가 자기 자신과의 대조가 된다.
 *
 * ## 변이 중화 대조 — 「어느 걸음에서 어긋나는가」를 실행이 낸다
 *
 * 1~4 는 블록의 **값**만 본다. 값이 맞으면 그 값에 이르는 서사가 통째로 거짓이어도 초록이다
 * (`FEEDBACK.md` §3 「논증」, 2026-09-04). W3 배치3 에서 `suffixArray` 의 멈춤이 둘째 바퀴를
 * 짚었는데 실제 어긋남은 첫 바퀴였고, `millerRabin` 의 변이 캡션·표·산문이 서로 다른 줄을
 * 가리켰다.
 *
 * 처방은 **정본과 변이를 나란히 실행해 처음 갈리는 자리를 실행이 내게 하는 것**이다. 여기서는
 * 사이드카를 **두 번** 부른다.
 *
 * - 한 번은 그대로 — 변이가 걸린 렌더링
 * - 한 번은 **중화한 채** — `loadMutant` 가 변이를 만들되 **적용하지 않고 정본을 돌려준다**
 *
 * 두 렌더링을 줄 단위로 대조하면 세 가지가 실행에서 나온다.
 *
 * | 무엇 | 뜻 |
 * | --- | --- |
 * | 중화하면 실행이 깨진다 | 사이드카가 스스로 「변이가 아무것도 안 바꿨다」로 실패한다. 잴 것이 없다 |
 * | 중화해도 한 글자도 안 바뀐다 | 변이가 그 블록의 값을 안 바꾼다. **그 자체는 위반이 아니다** |
 * | 달라지는 줄이 있다 | 그 줄들이 **정본과 변이가 갈리는 자리**이고, 첫 줄이 「처음 갈리는 자리」다 |
 *
 * 그것으로 하나를 잡는다 — **`갈림 자리가 다르다`**. 블록이 줄마다 「같다 / 어긋난다」로
 * 판정을 적었으면 그 판정이 **중화 대조가 낸 갈림 줄과 같아야 한다.** 두 값은 서로 다른
 * 경로에서 온다 — 앞엣것은 사이드카가 **자기가 고른 대상**을 견준 결과이고, 뒤엣것은 도구가
 * **블록 전체를 두 번 그려** 얻은 것이다. 사이드카가 견줄 대상을 잘못 고르면 판정 열은
 * 멀쩡한데 그 줄이 변이 때문에 갈리는 줄이 아니다.
 *
 * **「중화해도 안 바뀐다」를 위반으로 보지 않는 이유.** `deep.walk.pause` 는 *"이 문제에서는
 * 답이 안 틀린다"* 는 변이를 특히 담으라고 적혀 있다(`SPEC.md` §3 `deep.walk.pause`).
 * 그런 블록은 변이를 실제로 돌려도 값이 같다 — `primMst` 의 「시작 정점을 바꿔도 17」이
 * 그것이다. 그래서 판정을 적은 표만 잰다.
 *
 * 이 대조는 **실행 두 벌의 대조**이므로 산문을 읽지 않는다. 산문이 짚는 자리가 맞는지는
 * 그 산문이 인용하는 블록이 실행에 매여 있을 때만 뜻이 있고, 이 대조가 그 전제를 잰다.
 *
 * ## 변이 자리 대조 — 원고가 짚어 보인 줄 ↔ 실행이 바꾼 줄
 *
 * 멈춤·변이 절은 바꾼 줄을 `←` 로 짚어 보인다. **`loadMutant` 이 바꾼 줄은 실행이 기록해
 * 두므로**(`MUTATIONS`), 그 둘을 맞대면 「원고가 보이는 변이를 실행이 한 적이 있는가」가
 * 판정된다 — 없으면 그 아래 표는 다른 변이의 값이고, 값 대조는 그것을 못 본다.
 *
 * 좁게 본다. **정본에 그대로 있는 줄**은 안 본다(`←` 는 멀쩡한 줄에 주석을 다는 데도 쓰인다).
 * 변이·멈춤 증명 마커가 없는 절도 안 본다. 견줄 때는 타입 단언과 정본이 이름 붙인 리터럴
 * 상수를 펼친다 — 보는 것은 **이름이 아니라 자리**이고, 이름이 한 벌인지는 `L25`·`P12` 몫이다.
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
    | "실행 실패"
    | "갈림 자리가 다르다"
    | "변이 자리가 다르다";
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
 * `loadMutant` 가 실제로 만든 변이 하나.
 *
 * **손으로 적은 것이 아니라 실행이 남긴 것이다.** `loadMutant` 는 맞은 줄이 하나가 아니면
 * 던지므로 `line` 은 언제나 유일하고, 그 줄이 이 변이의 **어긋나는 첫 걸음**이다.
 */
export interface Mutation {
  /** 변이를 뜬 정본 파일의 절대 경로. */
  refPath: string;
  /** 바뀐 줄 번호(1부터). */
  line: number;
  /** 바뀌기 전의 그 줄. */
  before: string;
  /** 바뀐 뒤의 그 줄. `drop` 이면 `null` — 줄이 통째로 사라진다. */
  after: string | null;
}

/**
 * 이 프로세스에서 만들어진 변이 전부. 사이드카를 import 하면 채워진다.
 *
 * 사이드카는 `loadMutant` 를 **모듈 최상위에서** 부르므로, import 한 시점의 이 배열이
 * 그 편이 실제로 실행한 변이 목록이다. 여러 편을 잇달아 돌 때는 import 전후의 길이를
 * 잘라 편별로 가른다(`run`).
 */
export const MUTATIONS: Mutation[] = [];

/**
 * 켜면 `loadMutant` 가 변이를 **만들되 적용하지 않는다** — 정본을 그대로 돌려준다.
 *
 * 사이드카는 이 값을 모른다. 도구가 같은 사이드카를 두 번 부르며 이것만 바꿔, 블록의 어느
 * 줄이 **변이 때문에** 달라지는지를 실행에서 얻는다.
 */
let neutralized = false;

/** 중화 여부를 바꾼다. 도구 내부에서만 쓴다. */
export function setNeutralized(on: boolean): void {
  neutralized = on;
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
 *
 * 만든 변이는 `MUTATIONS` 에 남긴다. **바꾼 자리를 실행이 기록해 두는 것**이고, 그것이
 * 「어느 걸음에서 어긋나는가」를 원고와 대조하는 근거가 된다.
 */
export async function loadMutant<T>(
  refPath: string,
  mutation: { drop?: RegExp; swap?: [RegExp, string] },
): Promise<T> {
  const lines = readFileSync(refPath, "utf8").split("\n");
  let hits = 0;
  let at = 0;
  let before = "";
  let after: string | null = null;
  const out: string[] = [];
  for (const [index, line] of lines.entries()) {
    if (mutation.drop?.test(line) === true) {
      hits++;
      at = index + 1;
      before = line;
      after = null;
      continue;
    }
    if (mutation.swap?.[0].test(line) === true) {
      hits++;
      at = index + 1;
      before = line;
      after = line.replace(mutation.swap[0], mutation.swap[1]);
      out.push(after);
      continue;
    }
    out.push(line);
  }
  if (hits !== 1) {
    throw new Error(
      `변이가 ${hits} 줄에 맞았다 — 한 줄이어야 한다. 「한 곳 바꿨다」가 거짓이 된다`,
    );
  }
  // 중화 — 변이가 맞은 줄이 하나인 것까지 검사하고, **적용은 하지 않는다.**
  // 등록부에는 넣지 않는다. 같은 변이가 두 번 실린 것처럼 보이면 안 된다.
  if (neutralized) return (await import(resolve(refPath))) as T;
  MUTATIONS.push({ refPath: resolve(refPath), line: at, before, after });
  const dir = mkdtempSync(join(tmpdir(), "algo-proof-"));
  const path = join(dir, `${basename(refPath)}`);
  writeFileSync(path, out.join("\n"), "utf8");
  return (await import(path)) as T;
}

/* ───────────────── 변이 중화 대조 — 「어느 걸음에서 어긋나는가」 ───────────────── */

/** 블록이 줄마다 적은 판정. 「어긋난다」쪽 낱말과 「같다」가 한 줄에 하나만 있어야 센다. */
const DIVERGE_WORD = /어긋난다|갈린다|다르다|틀리다|틀린다/;
const SAME_WORD = /같다/;

/**
 * 칸 맞춤 공백을 지운다.
 *
 * 표의 열 폭은 **값에서 계산된다.** 변이를 중화하면 한 칸의 값 길이가 달라지면서 표 전체의
 * 들여쓰기가 따라 움직이므로, 공백을 그대로 두고 견주면 모든 줄이 「달라졌다」로 나온다.
 */
function slim(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

/**
 * 블록이 줄마다 적어 둔 판정을 읽는다.
 *
 * 이 값은 **사이드카가 실행해서 적은 것**이다(정본이 낸 답과 변이가 낸 답을 견준 결과).
 * 중화 대조가 낸 갈림 줄과 맞는지 보는 것이 「같은 것을 두 경로로 재는」 자리다.
 */
export function verdictLines(
  body: string,
): { line: number; diverges: boolean }[] {
  const out: { line: number; diverges: boolean }[] = [];
  for (const [index, raw] of body.split("\n").entries()) {
    const l = raw.trim();
    // **캡션이 시작되면 거기서 멈춘다.** `└` 아래 줄은 표 전체를 말하는 산문이고, 그것이
    // 줄바꿈으로 이어지면 들여쓰기만 남아 행과 구분이 안 된다. 실제로 `singleNumberXor`
    // 와 `trie` 에서 캡션의 둘째 줄이 행으로 세어져 거짓 위반이 났다.
    if (/^[└├│]/.test(l)) break;
    if (l === "" || /^[─—·]/.test(l)) continue;
    const a = DIVERGE_WORD.test(l);
    const b = SAME_WORD.test(l);
    if (a === b) continue;
    out.push({ line: index + 1, diverges: a });
  }
  return out;
}

/** 블록 하나를 중화 대조한 결과. */
export interface Divergence {
  id: string;
  /** 중화하면 실행이 깨진다 — 사이드카가 스스로 「변이가 아무것도 안 바꿨다」로 실패한다. */
  breaks: boolean;
  /** 변이 때문에 달라지는 줄 번호(1부터). 첫 항목이 **처음 갈리는 자리**다. */
  lines: number[];
  /**
   * 어느 쪽 실행이 던졌는가. `neutral` 이면 **이 편의 중화 대조가 안 돈 것**이다 —
   * 사이드카가 「변이가 아무것도 안 바꿨다」 자기검사를 모듈 최상위나 블록 안에서 하고
   * 있고, 중화 실행에서는 그 검사가 무조건 터진다. 안 잰 것이 통과로 읽히면 안 되므로
   * `run()` 이 그것을 모아 경고로 낸다(2026-09-05 `S11`).
   */
  brokeOn: "normal" | "neutral" | null;
}

/**
 * 이 블록이 중화 대조를 받을 자리인가 — **줄마다 판정이 붙은 표**만 잰다.
 *
 * 판정이 없는 블록은 견줄 것이 없다. 「변이를 중화해도 값이 안 바뀐다」를 그 자체로 위반이라
 * 볼 수 없기 때문이다 — `deep.walk.pause` 는 **답이 안 틀리는 변이**를 특히 담으라고 적혀
 * 있고(`SPEC.md` §3), 그런 블록은 변이를 실제로 돌려도 값이 같다.
 */
export function needsDivergence(body: string | null): boolean {
  return body !== null && verdictLines(body).length >= 2;
}

/**
 * 변이가 걸린 렌더링과 중화한 렌더링을 줄 단위로 견준다.
 *
 * 어느 한쪽이 던지면 `breaks` 다 — 중화 쪽이 던지는 것은 사이드카가 「변이가 아무것도 안
 * 바꿨다」로 스스로 실패한 것이고, 그 블록이 변이에 매여 있다는 증거다.
 */
export function divergence(
  id: string,
  normal: () => string,
  neutral: () => string,
): Divergence {
  let a: string;
  let b: string;
  try {
    a = normalize(normal());
  } catch {
    return { id, breaks: true, brokeOn: "normal", lines: [] };
  }
  try {
    b = normalize(neutral());
  } catch {
    return { id, breaks: true, brokeOn: "neutral", lines: [] };
  }
  const x = a.split("\n");
  const y = b.split("\n");
  const lines: number[] = [];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (slim(x[i] ?? "") !== slim(y[i] ?? "")) lines.push(i + 1);
  }
  return { id, breaks: false, brokeOn: null, lines };
}

/** 중화 대조 결과를 블록의 판정과 맞춘다. */
export function judgeDivergence(
  block: ProofBlock,
  d: Divergence,
): ProofFailure[] {
  const fails: ProofFailure[] = [];
  if (block.body === null) return fails;
  if (d.breaks || d.lines.length === 0) return fails;
  const changed = new Set(d.lines);
  const said = verdictLines(block.body);
  const wrong = said.filter((v) => v.diverges !== changed.has(v.line));
  if (wrong.length > 0) {
    const first = d.lines[0] ?? 0;
    fails.push({
      id: block.id,
      line: block.line,
      kind: "갈림 자리가 다르다",
      detail: [
        `실행이 낸 갈림 줄(블록 안 줄 번호) ${d.lines.join(", ")} — 처음 갈리는 자리는 ${first} 번째 줄`,
        `블록이 적은 판정과 어긋나는 줄: ${wrong
          .map((v) => `${v.line}(${v.diverges ? "어긋난다" : "같다"})`)
          .join(", ")}`,
      ].join("\n      "),
    });
  }
  return fails;
}

/* ─────────── 변이 자리 대조 — 원고가 짚어 보인 줄 ↔ 실행이 바꾼 줄 ─────────── */

/**
 * 코드 한 줄에서 **뜻 없는 차이**를 걷어 낸다 — 공백 · 줄 끝 주석 · 타입 단언 · 그 단언이
 * 끼워 넣은 괄호 · 정본이 이름 붙인 상수.
 *
 * 상수를 펼치는 이유는 원고가 `WHITE` 를 `0` 으로 적는 자리가 있기 때문이다. 이름이 한
 * 벌인지는 `L25`·`P12` 가 보는 몫이고, 여기서 보는 것은 **어느 줄인가**다.
 */
export function codeSkeleton(
  line: string,
  consts: Map<string, string>,
): string {
  let s = line.replace(/\/\/.*$/, "").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [name, value] of consts) {
    s = s.replace(new RegExp(`\\b${name}\\b`, "g"), value);
  }
  return s
    .replace(/\s+as\s+[A-Za-z_$][\w$<>[\]|.,\s]*?(?=[),;:\]}]|$)/g, "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/** 정본이 최상위에 이름 붙인 리터럴 상수. `const WHITE = 0;` 꼴만 본다. */
export function literalConsts(refSource: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of refSource.split("\n")) {
    const m = /^const ([A-Z][A-Z0-9_]*) = (-?\d+n?|"[^"]*"|'[^']*');$/.exec(
      line.trim(),
    );
    if (m?.[1] !== undefined && m[2] !== undefined) out.set(m[1], m[2]);
  }
  return out;
}

/**
 * 원고가 「이렇게 바꾸면」으로 **짚어 보인 줄**이 실행한 변이와 같은가.
 *
 * 멈춤·변이 절은 바꾼 줄을 `←` 로 짚어 보인다. 그 줄이 정본에 없는 줄이면 그것은 「바꾼 판」
 * 조각이고, **그 편이 실제로 실행한 변이의 줄이어야 한다.** 아니면 원고가 실행한 적 없는
 * 변이를 보이는 것이고, 그 아래 표는 다른 변이의 값이다 — 값 대조는 그것을 못 본다.
 *
 * 정본에 있는 줄은 건드리지 않는다. `←` 는 멀쩡한 줄에 주석을 다는 데도 쓰인다.
 */
export function mutantSiteFailures(
  text: string,
  refSource: string,
  mutations: Mutation[],
): ProofFailure[] {
  const consts = literalConsts(refSource);
  const skel = (l: string): string => codeSkeleton(l, consts);
  const inRef = new Set(refSource.split("\n").map(skel));
  inRef.delete("");
  const executed = new Set<string>();
  for (const m of mutations) {
    executed.add(skel(m.before));
    if (m.after !== null)
      for (const l of m.after.split("\n")) executed.add(skel(l));
  }
  executed.delete("");

  const lines = text.split("\n");
  const heads: number[] = [];
  for (const [i, l] of lines.entries()) if (/^#{2,4} /.test(l)) heads.push(i);
  /** 그 줄을 감싼 절에 변이·멈춤 증명 마커가 있는가. */
  const inMutantSection = (at: number): boolean => {
    let top = 0;
    for (const h of heads) {
      if (h <= at) top = h;
      else break;
    }
    const next = heads.find((h) => h > at) ?? lines.length;
    return /<!--proof:(mutant|pause)/i.test(lines.slice(top, next).join("\n"));
  };

  const fails: ProofFailure[] = [];
  let inTs = false;
  for (const [i, raw] of lines.entries()) {
    if (raw.trimStart().startsWith("```")) {
      inTs = /^```(ts|typescript)\b/.test(raw.trimStart());
      continue;
    }
    if (!inTs || !raw.includes("←")) continue;
    const s = skel(raw);
    if (s === "" || inRef.has(s)) continue;
    if (!inMutantSection(i)) continue;
    if (executed.has(s)) continue;
    fails.push({
      id: "(변이 조각)",
      line: i + 1,
      kind: "변이 자리가 다르다",
      detail: [
        `원고가 짚은 줄: ${raw.trim()}`,
        `이 편이 실행한 변이: ${
          mutations.length === 0
            ? "없다"
            : mutations
                .map((m) => `${m.line}행 → ${(m.after ?? "(지움)").trim()}`)
                .join(" · ")
        }`,
      ].join("\n      "),
    });
  }
  return fails;
}

/**
 * 중화 대조를 **못 잰** 자리. 위반이 아니라 **경고**다(2026-09-05 `S11`).
 *
 * 위반으로 올리지 않는 이유는 이 검사가 선 날 78 개 블록이 이 상태였기 때문이다 — 한꺼번에
 * 빨개지면 그동안 다른 편을 닫는 세션이 자기 것이 아닌 빨강을 본다. 교정은 별도 work 이고,
 * **위반으로 올리는 시점은 그 교정이 끝난 뒤**다.
 */
export interface NeutralSkip {
  /** `module` — 편 전체가 안 돌았다. `blocks` — 그 블록들만 안 돌았다. */
  reason: "module" | "blocks";
  ids: string[];
}

export interface RunResult {
  guide: string;
  blocks: number;
  failures: ProofFailure[];
  /** 중화 대조를 못 잰 자리. 없으면 `null`. */
  neutralSkipped: NeutralSkip | null;
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
      neutralSkipped: null,
    };
  }

  // 이 편이 실제로 만든 변이만 잘라 낸다 — 등록부는 프로세스 전체가 함께 쓴다.
  const before = MUTATIONS.length;
  const mod = (await import(proofPath)) as { PROOFS?: Proofs };
  const mutations = MUTATIONS.slice(before);
  const proofs = mod.PROOFS ?? {};
  const refNotImported = !importsRef(readFileSync(proofPath, "utf8"), refBase);
  // 블록 하나를 두 번 실행하지 않는다 — 값 대조와 중화 대조가 같은 결과를 나눠 쓴다.
  const memo = memoize(proofs);
  const failures = compare(blocks, memo);
  const div = await divergenceFailures(blocks, proofPath, memo);
  failures.push(...div.failures);
  const refPath = resolve(join(dir, `${stem}.ref.ts`));
  if (existsSync(refPath)) {
    failures.push(
      ...mutantSiteFailures(text, readFileSync(refPath, "utf8"), mutations),
    );
  }
  return {
    guide: guidePath,
    blocks: blocks.length,
    failures,
    sidecarMissing: false,
    refNotImported,
    neutralSkipped: div.skip,
  };
}

/** 같은 키를 두 번 부르면 앞의 결과(값이든 던진 것이든)를 그대로 돌려준다. */
function memoize(proofs: Proofs): Proofs {
  const seen = new Map<string, { value?: string; error?: unknown }>();
  const out: Proofs = {};
  for (const key of Object.keys(proofs)) {
    out[key] = () => {
      const hit = seen.get(key);
      if (hit !== undefined) {
        if ("error" in hit) throw hit.error;
        return hit.value as string;
      }
      try {
        const value = (proofs[key] as () => string)();
        seen.set(key, { value });
        return value;
      } catch (e) {
        seen.set(key, { error: e });
        throw e;
      }
    };
  }
  return out;
}

/**
 * 중화 대조 — 사이드카를 **변이를 끈 채** 한 번 더 불러 갈림 줄을 실행에서 얻는다.
 *
 * 잴 자리가 없으면 다시 부르지 않는다. 사이드카를 다시 부르는 값이 싸지 않다(모듈 최상위의
 * 계측이 다시 돈다) — 변이를 내세운 블록이나 줄마다 판정을 적은 표가 있는 편만 잰다.
 *
 * 다시 부르는 길은 **질의 문자열**이다. 같은 경로를 그냥 다시 import 하면 모듈 캐시가 돌아와
 * 최상위의 `loadMutant` 가 다시 실행되지 않는다(실측).
 */
async function divergenceFailures(
  blocks: ProofBlock[],
  proofPath: string,
  normal: Proofs,
): Promise<{ failures: ProofFailure[]; skip: NeutralSkip | null }> {
  const targets = blocks.filter((b) => needsDivergence(b.body));
  if (targets.length === 0) return { failures: [], skip: null };
  setNeutralized(true);
  let neutral: Proofs;
  try {
    const mod = (await import(`${proofPath}?neutral=1`)) as {
      PROOFS?: Proofs;
    };
    neutral = mod.PROOFS ?? {};
  } catch {
    // **여기서 조용히 넘어가면 안 된다.** 사이드카가 모듈 최상위에서 자기검사로 던지면
    // 중화 실행이 무조건 터지고, 그러면 이 편의 중화 대조가 **한 곳도 안 돈다.** 화면은
    // 초록인데 검사는 한 번도 실행되지 않는 상태다 — 「검사하지 않는 검사」다.
    return {
      failures: [],
      skip: { reason: "module", ids: targets.map((b) => b.id) },
    };
  } finally {
    setNeutralized(false);
  }
  const out: ProofFailure[] = [];
  const unmeasured: string[] = [];
  for (const b of targets) {
    const a = normal[b.id];
    const c = neutral[b.id];
    if (a === undefined || c === undefined) continue;
    const d = divergence(b.id, a, c);
    if (d.brokeOn === "neutral") unmeasured.push(b.id);
    out.push(...judgeDivergence(b, d));
  }
  return {
    failures: out,
    skip: unmeasured.length > 0 ? { reason: "blocks", ids: unmeasured } : null,
  };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  // `--require` 는 증명 블록이 **하나도 없는 편**을 위반으로 본다. 편별 완료 기준이 쓴다.
  const require1 = argv.includes("--require");
  // `--all` 의 대상 집합은 `guide-v2-targets.ts` 하나가 정한다(글롭을 여기 적지 않는다).
  const files = argv.includes("--all")
    ? await (await import("./guide-v2-targets.ts")).v2Guides()
    : argv.filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    if (argv.includes("--all")) {
      console.log("v2 가이드가 아직 없다 — 잰 것이 없다.");
      process.exit(0);
    }
    console.error(
      "대상이 없다. 사용: bun run tools/check-proof.ts [--require] [--all] <guide.md>",
    );
    process.exit(2);
  }
  let bad = 0;
  // 경고 집계 — 안 잰 것이 통과로 읽히지 않게 끝에 한 줄로 낸다.
  let skipped = 0;
  let skippedGuides = 0;
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
    // **경고이지 위반이 아니다** — `bad` 를 안 늘린다(`NeutralSkip` 주석의 사유).
    if (r.neutralSkipped !== null) {
      const s = r.neutralSkipped;
      skipped += s.ids.length;
      skippedGuides++;
      const why =
        s.reason === "module"
          ? "사이드카가 모듈 최상위에서 던진다 — 이 편은 한 곳도 안 쟀다"
          : "그 블록들이 중화 실행에서 던진다";
      console.log(
        `${f} — 경고: 중화 대조를 ${s.ids.length}개 블록에서 못 쟀다(${why}). ` +
          `비키는 법은 중화 여부를 값에서 알아내(변이 모듈의 함수가 정본과 같은 객체인가) ` +
          `자기검사만 건너뛰는 것이다. 안 쟀다는 것은 통과가 아니다.`,
      );
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
  if (skipped > 0) {
    console.log(
      `\n경고 — 중화 대조를 못 잰 블록 ${skipped}개 (${skippedGuides}편). ` +
        `그 자리에서는 「어느 걸음에서 어긋나는가」가 검사되지 않는다. ` +
        `지금은 경고이고, 그 편들을 고친 뒤 위반으로 올린다.`,
    );
  }
  process.exit(bad === 0 ? 0 : 1);
}
