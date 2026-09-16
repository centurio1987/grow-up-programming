/**
 * 문서·코드에 적힌 `경로:줄번호` 인용이 **실재하는지**(존재 검사)와 **가리키던 내용이 그대로인지**
 * (표류 검사)를 검사한다.
 *
 * 이 도구가 있는 이유는 같은 결함이 두 배치 연속으로 났기 때문이다. B2 가 인용 오류 2건을
 * 잡고 "전수 검색했다"고 적었는데, 그 검색이 **전체 경로 형태만** 봤다. 파일 이름 없이
 * `` `:NN` `` 꼴 상대 인용은 패턴에 걸리지 않아 런북에 그대로 남았고 B3 에서 다시 나왔다 — 예시에
 * 진짜 수를 쓰면 이 문장이 인용이 된다. 사람이 도는 검색은 패턴을 빠뜨리고, 빠뜨린 것을 본인이 알 수 없다.
 *
 * **존재 검사 대상은 경로에 `/` 가 들어간 인용뿐이다.** 그것이 "따라가라고 적은 인용"의 집합이다.
 * `multiset.ts:25` 처럼 파일 이름만 있는 인용은 대개 지워진 파일의 옛 상태를 가리키는
 * 기록이므로(§규약1 의 표류 사례) 존재 검사에 넣지 않는다.
 *
 * **표류 검사(KAN-045-D2PK6T `S2`).** 존재 검사는 「그 줄이 있는가」만 본다 — 병합이 파일 앞에
 * 줄을 끼워 넣으면 인용은 내용이 있는 **남의 줄**을 가리키며 통과한다. 실제로 세 번 샜다.
 * 그래서 인용마다 **대상 줄 내용의 지문**을 대장(`tools/_baseline/citations.tsv`)에 적어 두고
 * 매번 대조한다. 규격의 정본은 `docs/ORD-006-conventions.md` 의 절 「인용 표류 게이트 규격」이고
 * **여기 적히지 않은 것을 이 파일이 새로 정하지 않는다.**
 *
 * **구멍 셋을 더 닫았다(KAN-047-394V9A `S2`).** ① 예외 E1 이 칸반 산출물을 통째로 뺀 탓에 카드
 * 문서의 **살아 있는 계획 절**까지 검사 밖이었다 — 이제 `KANBAN.cards/**` 는 「수행 내역」 절만
 * 예외이고, 카드가 쓸 수 있는 절 이름은 넷으로 고정이라 **모르는 `## ` 제목을 만나면 실패**한다
 * ② 범위 인용의 **끝 줄**이 빈 줄이면 대장에 행이 서지 않아 조용했다 — 존재 검사가 먼저 잡는다
 * ③ 콜론도 백틱도 없는 **산문 속 맨 줄 번호**는 인용으로 보이지 않는다 — 규약과 래칫으로 받는다.
 *
 * 실행:
 *   `bun run tools/check-citations.ts`            존재 + 표류 검사. exit 0 통과 · 1 실패
 *   `bun run tools/check-citations.ts --update`   대장을 지금 상태로 다시 쓴다
 *   `bun run tools/check-citations.ts --tsv`      대장을 stdout 으로 · 보류 전체 목록을 stderr 로 (파일에 쓰지 않는다)
 */

import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

/**
 * 인용을 찾아 볼 파일들.
 *
 * **B11 에서 둘을 넓혔다.** 그전에는 재집필한 구조를 한 줄씩 손으로 등록하는 목록이었고
 * `.mdx` 가 확장자에 없었다. 둘 다 조용한 구멍이다 — 등록을 빠뜨린 구조와 가이드 전부가
 * 검사 밖이었고, B7~B9 산출물 셋이 실제로 그 밖에 있었다. 목록을 `src/data-structures`
 * 하나로 바꾸면 재집필이 늘 때 아무도 손댈 것이 없다.
 */
const SCAN_GLOBS = [
  "docs",
  "tools",
  "src/algorithms",
  "src/data-structures",
  "rust",
  // 두 v2 명세가 여기 산다. 안 넣으면 **명세가 건 `경로:줄번호` 를 아무도 안 본다** —
  // ds SPEC 이 ORD-006 규약을 줄 번호로 인용하는데 그 줄이 밀려도 조용하다.
  "sandbox",
  // **KAN-047 이 넣었다.** 카드 문서의 「전략」·「실행 계획」·「검증」은 기록이 아니라 **살아 있는
  // 계획**이고, 그 인용이 밀리면 다음 사람이 잘못 읽는다. 기록인 「수행 내역」 절만 예외로 빠진다
  // (아래 `CARD_SECTIONS`). `KANBAN.batches` · `KANBAN.reviews` 는 통째 예외 그대로다.
  "KANBAN.cards",
];

const SCAN_EXTENSIONS = [".md", ".mdx", ".ts", ".rs"];

/**
 * 경로에 `/` 가 있는 인용만 잡는다. 앞의 문자 클래스가 백틱·괄호·공백을 끊어 준다.
 *
 * **`.rs` 가 KAN-024 에서 들어왔다.** 규약4 (가) 등급 구조의 정본이 Rust 에 있으므로
 * 문서와 계약이 그 파일을 줄 번호로 가리키기 시작했고, 확장자가 빠져 있으면 그 인용만
 * 검사 밖에 남는다 — B11 이 `.mdx` 에서 겪은 것과 같은 구멍이다.
 */
/**
 * **줄임표 경로는 인용이 아니다.** `at dijkstra (.../dijkstra.ts:43:22)` 처럼 스택 트레이스가
 * 앞을 잘라 적은 자리가 있고, 그것은 따라가라고 적은 인용이 아니라 **실행 로그의 사본**이다.
 * `src/algorithms` 를 검사 대상에 넣자마자 그런 자리 2건이 「가리키는 파일이 없다」로 떴다
 * (`dijkstra-analysis.md:445`·`:681`, 2026-08-29 실측).
 *
 * 둘로 막는다. 앞의 부정 전방탐색이 `...` 로 **시작하는** 것을 끊고, 뒤의 부정 후방탐색이
 * 경로 글자 한복판에서 다시 맞는 것을 막는다 — 앞엣것만 두면 엔진이 한 칸씩 밀며
 * `../dijkstra.ts` · `./dijkstra.ts` 로 다시 맞고, 그 둘은 실재하는 것처럼 보인다.
 * `..`(상위 디렉터리)는 그대로 인용으로 센다 — 점 **셋**부터가 줄임표다.
 */
const CITATION =
  /(?<![A-Za-z0-9_./-])(?!\.{3})([A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+\.(?:md|mdx|ts|tsx|rs|json|tsv)):(\d+)(?:-(\d+))?/g;

/**
 * **경로 없는 백틱 인용.** 백틱 한 쌍 안이 오직 `:숫자` 또는 `:숫자-숫자` 인 것만 센다.
 * 세 번 샌 자리 가운데 하나가 여기다 — 병합이 1,193 줄을 밀었을 때 이 꼴이 검사 밖이었다.
 */
const BARE_CITATION = /`:(\d+)(?:-(\d+))?`/g;

/**
 * **디렉터리 없는 `이름.확장자:줄` 꼴.** 경로로 잡히지 않아 닻이 서지 않는데, 그 줄의 경로
 * 없는 인용을 「자기」로 풀면 틀린다 — 규약이 이미 지목한 함정이다. 있으면 보류시킨다.
 */
const NAKED_NAME =
  /(?<![A-Za-z0-9_./-])(?!\.{3})[A-Za-z0-9_.-]+\.(?:md|mdx|ts|tsx|rs|json|tsv):\d+/;

/**
 * **닻과 인용 사이를 잇는 기호.** 공백 · 백틱 · 가운뎃점 · 쉼표 · 괄호 · 줄임표뿐이면 「붙임」이다.
 * 사이에 **말이 끼면 보류**다 — 같은 줄 앞 경로로 추정해 아홉 건을 잘못 옮겼다 되돌린 일이 있다.
 */
const CONNECTORS_ONLY = /^(?:[\s`·,()]|\.{3}|…)*$/u;

/** 대장. **경로를 플래그로 받지 않는다** — 받으면 CI 와 사람이 다른 파일을 본다. */
export const LEDGER_PATH = "tools/_baseline/citations.tsv";

/** 카드 문서가 사는 자리. 이 아래만 절 단위 예외를 받는다. */
const CARD_PREFIX = "KANBAN.cards/";

/**
 * **카드 문서의 절 이름은 넷뿐이다** — 스킬이 강제하는 골격이다. 그 밖의 `## ` 제목을 만나면
 * **실패**한다(아래 `cardExemptLines`). KAN-045 가 절 단위 예외를 배제한 까닭이 「절 경계 파싱이
 * 구조 변화에 검사 밖으로 샌다」였으므로, **새는 방향을 뒤집는 이 장치가 이 설계의 유일한 근거**다.
 * 모르는 절을 만나면 조용히 빠지는 것이 아니라 게이트가 붉어진다.
 */
const CARD_SECTIONS = ["전략", "실행 계획", "검증", "수행 내역"];

/** 카드 문서에서 예외로 남는 절 하나. 발행 시점의 사실을 적은 기록이다. */
const CARD_LOG_SECTION = "수행 내역";

/**
 * **예외 E1(KAN-047 이 좁혔다) — 출처가 `KANBAN.batches/**` · `KANBAN.reviews/**` 인 인용 전부.**
 * 배치 문서와 검토서는 **발행 시점의 사실**을 적은 기록이라, 대상이 뒤에 움직여도 고치면 기록이
 * 거짓이 된다. **카드 문서(`KANBAN.cards/**`)는 예외가 아니다** — 거기서는 「수행 내역」 절만
 * 빠진다(`CARD_SECTIONS`).
 */
const EXEMPT_SOURCE = (path: string) =>
  path.startsWith("KANBAN.") && !path.startsWith(CARD_PREFIX);

/**
 * **산문 속 맨 줄 번호.** 콜론도 백틱도 없이 「NNN 줄」처럼 적은 수는 인용으로 보이지 않아
 * 존재 검사도 표류 검사도 닿지 않는다. 일반 탐지는 흐리므로(문서가 적는 **크기**와 구별이
 * 안 된다) 규약과 **래칫**으로 받는다 — 지금 수를 기준선에 박고 **늘면 실패**한다.
 *
 * **세는 규칙.** ① 대상은 `docs/**` 의 `.md` 뿐이다 ② 앞이 글자·숫자·`:`·`.`·`-` 가 아닌 자리에서
 * 시작하는 **세 자리 이상**의 수가 공백 0 개 이상을 사이에 두고 `줄` 로 이어지는 것을 한 건으로
 * 센다 ③ **코드펜스 안은 세지 않는다**(예시와 로그 사본이다). 두 자리 이하를 빼는 것은 「축3」·
 * 「8 단계」 같은 산문의 작은 수를 피하기 위해서다.
 */
const NAKED_LINE_NUMBER = /(?<![0-9A-Za-z_:.-])\d{3,}\s*줄/gu;

/** 맨 줄 번호 래칫이 보는 자리. 산문 문서만이다. */
const NAKED_LINE_SCOPE = (path: string) =>
  path.startsWith("docs/") && path.endsWith(".md");

/**
 * **예외 E2 — 대상이 `KANBAN.reviews/**` 인 줄 인용.** 검토서는 재발행마다 통째로 밀려
 * 대장에 넣으면 발행마다 붉어지고, 사람은 반사적으로 `--update` 를 누른다 — 게이트를
 * 무력화하는 학습이다. 존재 검사에는 그대로 남고 **대장에만 넣지 않는다.**
 */
const EXEMPT_TARGET = (path: string) => path.startsWith("KANBAN.reviews/");

export type HeldCode = "detached" | "unresolved" | "naked-name";

export interface Problem {
  where: string;
  citation: string;
  detail: string;
}

/** 경로 없는 인용 가운데 대장에 넣지 않는 것. 실패가 아니라 래칫 대상이다. */
export interface Held {
  where: string;
  citation: string;
  code: HeldCode;
  /** 왜 그 코드인지 한 줄. */
  detail: string;
}

/** 대장 한 행. 앞 셋이 키, `fingerprint` 가 값, `flag` 는 표시(판정에 쓰이지 않는다). */
export interface Row {
  src: string;
  target: string;
  targetLine: number;
  fingerprint: string;
  flag: string;
}

/** 표류 메시지가 「무엇을 어떻게 해석해 여기까지 왔는가」를 함께 내기 위한 기록. */
export interface Origin {
  where: string;
  citation: string;
  how: string;
}

export interface Ratchet {
  bare: number;
  detached: number;
  unresolved: number;
  nakedName: number;
}

export type Counts = Ratchet & { attached: number; self: number };

export interface Scan {
  /** 존재 검사를 돈 경로 있는 인용 수. */
  checked: number;
  problems: Problem[];
  rows: Row[];
  held: Held[];
  origins: Map<string, Origin[]>;
  /** 칸반 밖 출처의 경로 없는 인용 계수. KAN-045 가 박은 기준선이 사는 칸이다. */
  counts: Counts;
  /**
   * **카드 문서 출처의 계수는 칸을 따로 쓴다.** 검사 집합이 넓어진 것을 옛 칸에 더하면
   * 기준선이 한 번 올라가고, 그 자리는 「래칫은 오를 수 있다」를 가르치는 자리가 된다.
   */
  cardCounts: Counts;
  /** 산문 속 맨 줄 번호 건수(`NAKED_LINE_SCOPE` 안). */
  nakedLine: number;
}

const rowKey = (src: string, target: string, targetLine: number) =>
  `${src}\t${target}\t${targetLine}`;

/**
 * **지문 정규화.** ① 행 끝 `\r` 를 뗀다 ② 모든 공백 연속을 스페이스 하나로 접는다
 * ③ 앞뒤 공백을 뗀다. 들여쓰기와 줄 안의 정렬은 내용이 아니다 — biome 의 재포맷과 표
 * 정렬이 지문을 흔들면 게이트가 서식 변화와 내용 변화를 가르지 못한다. 반대로 **대소문자와
 * 문장부호는 접지 않는다.** 그것은 내용이다.
 */
export function normalizeLine(raw: string): string {
  return raw.replace(/\r$/, "").replace(/\s+/gu, " ").trim();
}

/** SHA-256 을 UTF-8 바이트에 걸고 앞 12 자리. 빈 줄은 지문이 없다(행이 서지 않는다). */
export function fingerprintOf(raw: string): string | null {
  const text = normalizeLine(raw);
  if (text === "") return null;
  return new Bun.CryptoHasher("sha256").update(text).digest("hex").slice(0, 12);
}

async function collectFiles(
  root: string,
  relativeDir: string,
): Promise<string[]> {
  const absolute = join(root, relativeDir);
  const entries = await readdir(absolute, { withFileTypes: true }).catch(
    () => [],
  );
  const found: string[] = [];
  for (const entry of entries) {
    const child = join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      // `target` 은 cargo 의 빌드 산출물이다(gitignore). 훑으면 검사 시간이 통째로 거기 간다.
      if (entry.name === "node_modules" || entry.name === "target") continue;
      found.push(...(await collectFiles(root, child)));
    } else if (SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      found.push(child);
    }
  }
  return found;
}

interface PathHit {
  kind: "path";
  at: number;
  end: number;
  text: string;
  target: string;
  start: number;
  rangeEnd: number | undefined;
}

interface BareHit {
  kind: "bare";
  at: number;
  end: number;
  text: string;
  start: number;
  rangeEnd: number | undefined;
}

/** 한 줄에서 경로 인용을 뽑는다. **예외 E4**(`경로:줄:열`)는 여기서 끊는다. */
function pathHits(line: string): PathHit[] {
  const hits: PathHit[] = [];
  for (const match of line.matchAll(CITATION)) {
    const [text, target, startText, endText] = match;
    if (target === undefined || startText === undefined) continue;
    const at = match.index;
    const end = at + text.length;
    // E4 — 열 번호가 붙은 것은 실행 로그·컴파일러 진단의 사본이지 인용이 아니다.
    if (/^:\d/.test(line.slice(end))) continue;
    hits.push({
      kind: "path",
      at,
      end,
      text,
      target,
      start: Number(startText),
      rangeEnd: endText === undefined ? undefined : Number(endText),
    });
  }
  return hits;
}

function bareHits(line: string): BareHit[] {
  const hits: BareHit[] = [];
  for (const match of line.matchAll(BARE_CITATION)) {
    const [text, startText, endText] = match;
    if (startText === undefined) continue;
    hits.push({
      kind: "bare",
      at: match.index,
      end: match.index + text.length,
      text,
      start: Number(startText),
      rangeEnd: endText === undefined ? undefined : Number(endText),
    });
  }
  return hits;
}

/**
 * 카드 문서에서 **검사 밖으로 두는 줄**을 가른다 — 예외는 「수행 내역」 절 하나뿐이다.
 *
 * **모르는 `## ` 제목은 실패로 낸다.** 절 경계 파싱의 위험은 「구조가 바뀌면 조용히 검사 밖으로
 * 샌다」였다. 그 방향을 뒤집는다 — 아는 넷 말고 다른 제목을 만나면 그 절은 **검사 대상으로 두고**
 * (`inLog` 가 서지 않는다) 게이트는 붉어진다. 새 절을 진짜로 들이려면 규격과 이 목록을 함께 고친다.
 *
 * **코드펜스 안의 `## ` 줄은 제목이 아니다.** 카드가 제 골격을 예시로 인용하면 「전략」 절 안에
 * 펜스로 `## 수행 내역` 이 서고, 그것을 제목으로 읽으면 **그 뒤가 통째로 예외**가 된다 — 살아
 * 있는 계획이 조용히 검사 밖으로 빠지고 실패도 안 난다. 스킬의 절 파서(`parse_sections`)는 펜스를
 * 아는데 이쪽만 모르면 **같은 문서를 둘이 다르게 자르고 갈리는 방향이 「검사 안 함」**이라, 위
 * 문단이 세운 이 설계의 유일한 근거가 그 한 자리에서 깨진다. 토글은 `countNakedLineNumbers` 와 같다.
 */
function cardExemptLines(
  file: string,
  lines: string[],
  problems: Problem[],
): boolean[] {
  const exempt = new Array<boolean>(lines.length).fill(false);
  let inLog = false;
  let fenced = false;
  for (const [index, line] of lines.entries()) {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
    } else if (!fenced && line.startsWith("## ")) {
      const name = line.slice(3).trim();
      if (!CARD_SECTIONS.includes(name)) {
        problems.push({
          where: `${file}:${index + 1}`,
          citation: line.trim(),
          detail: `카드 문서의 절 이름은 ${CARD_SECTIONS.map((s) => `「${s}」`).join(" · ")} 넷뿐이다. 모르는 절은 검사 밖으로 빠지지 않는다 — 규격(인용 표류 게이트 규격)과 이 목록을 함께 고친다`,
        });
      }
      inLog = name === CARD_LOG_SECTION;
    }
    exempt[index] = inLog;
  }
  return exempt;
}

/** 산문 속 맨 줄 번호를 센다. 코드펜스 안은 세지 않는다(`NAKED_LINE_NUMBER` 의 세는 규칙). */
export function countNakedLineNumbers(lines: string[]): number {
  let fenced = false;
  let found = 0;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    found += (line.match(NAKED_LINE_NUMBER) ?? []).length;
  }
  return found;
}

/**
 * 저장소 하나를 훑어 **존재 검사 결과 · 지금 시점의 대장 행 · 보류 목록**을 낸다.
 * `root` 를 받는 까닭은 자기시험이 임시 트리를 만들어 같은 코드를 돌리기 위해서다.
 */
export async function scanTree(root: string): Promise<Scan> {
  const lineCache = new Map<string, string[] | null>();
  async function linesOf(relativePath: string): Promise<string[] | null> {
    const cached = lineCache.get(relativePath);
    if (cached !== undefined) return cached;
    const file = Bun.file(join(root, relativePath));
    const value = (await file.exists())
      ? (await file.text()).split("\n")
      : null;
    lineCache.set(relativePath, value);
    return value;
  }

  const problems: Problem[] = [];
  const held: Held[] = [];
  const origins = new Map<string, Origin[]>();
  const rowByKey = new Map<string, Row>();
  const emptyCounts = (): Counts => ({
    bare: 0,
    detached: 0,
    unresolved: 0,
    nakedName: 0,
    attached: 0,
    self: 0,
  });
  const counts = emptyCounts();
  const cardCounts = emptyCounts();
  let checked = 0;
  let nakedLine = 0;

  /**
   * 대장 행 하나를 세운다. 지문이 없으면(빈 줄) 세우지 않는다 — 빈 줄의 지문은 모든 빈 줄과
   * 같아서 아무것도 지키지 않고, 그 자리는 존재 검사가 이미 실패로 낸다.
   * 대상 줄이 없으면 `false` 를 돌려 준다(경로 없는 인용의 `unresolved` 판정에 쓴다).
   */
  async function register(
    src: string,
    target: string,
    targetLine: number,
    origin: Origin,
  ): Promise<boolean> {
    const lines = await linesOf(target);
    if (lines === null) return false;
    if (targetLine < 1 || targetLine > lines.length) return false;
    const fingerprint = fingerprintOf(lines[targetLine - 1] ?? "");
    if (fingerprint === null) return false;
    if (EXEMPT_TARGET(target)) return true; // E2 — 존재는 참, 대장에는 넣지 않는다
    const key = rowKey(src, target, targetLine);
    // 키 중복은 한 행으로 합친다. 같은 대상 줄이므로 지문이 갈릴 일이 정의상 없다.
    if (!rowByKey.has(key))
      rowByKey.set(key, { src, target, targetLine, fingerprint, flag: "-" });
    const list = origins.get(key);
    if (list === undefined) origins.set(key, [origin]);
    else list.push(origin);
    return true;
  }

  /**
   * 반쪽만 풀린 범위 인용이 남긴 행을 거둔다. **그 인용이 남긴 자국만** 떼고, 같은 좌표를
   * 다른 인용이 이미 세워 두었으면 행은 그대로 둔다 — 남의 행을 지우면 대장이 한 줄 비고,
   * 비어 있는 자리는 병합이 밀어도 조용하다.
   */
  function unregister(src: string, target: string, targetLine: number) {
    const key = rowKey(src, target, targetLine);
    const list = origins.get(key);
    if (list === undefined) return;
    list.pop();
    if (list.length > 0) return;
    origins.delete(key);
    rowByKey.delete(key);
  }

  const files: string[] = [];
  for (const glob of SCAN_GLOBS)
    files.push(...(await collectFiles(root, glob)));
  files.sort();

  for (const file of files) {
    if (EXEMPT_SOURCE(file)) continue; // E1 — 배치 문서 · 검토서는 통째로
    const sourceLines = (await linesOf(file)) ?? [];
    const isCard = file.startsWith(CARD_PREFIX);
    // 카드 문서는 절을 안다 — 「수행 내역」만 예외이고, 모르는 절 제목은 **실패**다.
    const exemptLine = isCard
      ? cardExemptLines(file, sourceLines, problems)
      : null;
    const bucket = isCard ? cardCounts : counts;

    if (NAKED_LINE_SCOPE(file)) nakedLine += countNakedLineNumbers(sourceLines);

    for (const [index, line] of sourceLines.entries()) {
      if (exemptLine?.[index] === true) continue; // E1 — 카드의 「수행 내역」 절
      const paths = pathHits(line);
      const bares = bareHits(line);
      if (paths.length === 0 && bares.length === 0) continue;

      const where = `${file}:${index + 1}`;
      const lineHasNakedName = NAKED_NAME.test(line);

      // ── 존재 검사 — 경로 있는 인용. 지금 규칙을 그대로 산다.
      for (const hit of paths) {
        checked++;
        const targetLines = await linesOf(hit.target);
        if (targetLines === null) {
          problems.push({
            where,
            citation: hit.text,
            detail: "가리키는 파일이 없다",
          });
          continue;
        }
        const start = hit.start;
        const end = hit.rangeEnd ?? start;
        const total = targetLines.length;
        if (start < 1 || start > total || end > total) {
          problems.push({
            where,
            citation: hit.text,
            detail: `${hit.target} 는 ${total} 줄인데 ${start}${hit.rangeEnd === undefined ? "" : `-${end}`} 을 가리킨다`,
          });
          continue;
        }
        if ((targetLines[start - 1] ?? "").trim() === "") {
          problems.push({
            where,
            citation: hit.text,
            detail: `${hit.target}:${start} 이 빈 줄이다`,
          });
        }
        // **끝 줄도 본다(KAN-047).** 빈 줄은 지문이 없어 대장에 행이 서지 않으므로
        // (2 의 규칙), 끝이 빈 줄인 범위는 **존재 검사도 표류 검사도 조용했다** —
        // 대장에 없는 좌표는 밀려도 울 자리가 없다. 존재 검사가 먼저 잡게 한다.
        if (hit.rangeEnd !== undefined && end !== start) {
          if ((targetLines[end - 1] ?? "").trim() === "") {
            problems.push({
              where,
              citation: hit.text,
              detail: `범위의 끝 ${hit.target}:${end} 이 빈 줄이다 — 빈 줄은 대장에 서지 않아 밀려도 조용하다. 내용이 있는 줄까지로 범위를 줄인다`,
            });
          }
        }
      }

      // ── 해석 — 한 줄을 왼쪽에서 오른쪽으로 훑으며 닻을 든다. **같은 줄 증거만 쓴다.**
      //    앞 줄·앞 문단으로 거슬러 올라가지 않는다. 산문은 줄바꿈되고 줄바꿈 자리는 재포맷하면
      //    움직인다 — 문단을 거슬러 읽는 규칙은 재포맷 한 번에 해석이 통째로 바뀐다.
      //
      //    **「자기」의 조건은 「앞에 닻이 없다」이다**(규격 ③). 규격 표의 자기 행은
      //    「같은 줄에 경로 인용이 하나도 없고」로 적혀 있지만, 그 문장대로 읽으면 자기가
      //    80 건이 되어 규격이 같은 표에 실은 실측 259 와 맞지 않는다. 반면 보류 코드 표의
      //    `detached` 는 「같은 줄 **앞에** 닻이 있으나 붙임이 아니다」라고 적혀 있고, 그
      //    읽기로 재면 자기 256 · 보류 134(실측 134 와 일치)가 나온다. 둘이 어긋나므로
      //    **실측과 맞는 쪽**을 산다 — 규격도 「도구가 다시 낸 수가 맞다」고 적었다.
      const walk = [...paths, ...bares].sort((a, b) => a.at - b.at);
      let anchor: { target: string; end: number } | null = null;

      for (const hit of walk) {
        if (hit.kind === "path") {
          anchor = { target: hit.target, end: hit.end };
          const origin: Origin = {
            where,
            citation: hit.text,
            how: "경로",
          };
          // 범위 인용은 시작 줄과 끝 줄 **둘 다** 대장에 둔다 — 범위 안쪽에 줄이 끼면
          // 시작 지문은 그대로이고 끝 번호만 남의 줄로 간다. 난 사고는 전부 삽입이었다.
          await register(file, hit.target, hit.start, origin);
          if (hit.rangeEnd !== undefined && hit.rangeEnd !== hit.start)
            await register(file, hit.target, hit.rangeEnd, origin);
          continue;
        }

        bucket.bare++;
        const gap =
          anchor !== null && anchor.end <= hit.at
            ? line.slice(anchor.end, hit.at)
            : null;
        const attached =
          anchor !== null && gap !== null && CONNECTORS_ONLY.test(gap);

        let target: string;
        let how: string;
        if (attached && anchor !== null) {
          target = anchor.target;
          how = `붙임(닻 = \`${anchor.target}\`)`;
          // 붙임은 닻의 끝을 이어받아 다음 인용의 기준이 된다.
          anchor = { target: anchor.target, end: hit.end };
          bucket.attached++;
        } else if (anchor === null && !lineHasNakedName) {
          target = file;
          how = "자기";
          bucket.self++;
        } else {
          // 보류 — 나머지 전부. 대장에 넣지 않는다.
          const code: HeldCode = anchor !== null ? "detached" : "naked-name";
          bucket[code === "detached" ? "detached" : "nakedName"]++;
          held.push({
            where,
            citation: hit.text,
            code,
            detail:
              code === "detached"
                ? "같은 줄에 경로 인용이 있으나 붙임이 아니다(사이에 말이 끼었다)"
                : "같은 줄에 디렉터리 없는 `이름.확장자:줄` 꼴이 있어 자기 해석이 틀릴 수 있다",
          });
          continue;
        }

        const origin: Origin = { where, citation: hit.text, how };
        const okStart = await register(file, target, hit.start, origin);
        const okEnd =
          hit.rangeEnd === undefined || hit.rangeEnd === hit.start
            ? true
            : await register(file, target, hit.rangeEnd, origin);
        if (!okStart || !okEnd) {
          // 고른 해석으로 풀면 파일 밖이거나 빈 줄이다 — 이미 밀려 있거나, 지워진 파일의
          // 옛 상태를 적은 기록이다. 세운 행은 남겨 두면 반쪽이라 여기서 거둔다.
          if (okStart) unregister(file, target, hit.start);
          if (attached) bucket.attached--;
          else bucket.self--;
          bucket.unresolved++;
          held.push({
            where,
            citation: hit.text,
            code: "unresolved",
            detail: `${how} 으로 풀면 ${target}:${hit.start}${hit.rangeEnd === undefined ? "" : `-${hit.rangeEnd}`} 인데 그 줄이 없거나 비어 있다`,
          });
        }
      }
    }
  }

  const rows = [...rowByKey.values()].sort(compareRows);
  return {
    checked,
    problems,
    rows,
    held,
    origins,
    counts,
    cardCounts,
    nakedLine,
  };
}

/**
 * **줄 순서는 결정론이어야 한다.** `src` · `target` 은 UTF-16 코드 단위 비교이고
 * (`localeCompare` 는 로캘·ICU 판본에 따라 갈려 같은 입력이 다른 파일을 낸다),
 * `target_line` 은 **수치** 오름차순이다(문자열로 정렬하면 `10` 이 `9` 앞에 선다).
 */
export function compareRows(a: Row, b: Row): number {
  if (a.src !== b.src) return a.src < b.src ? -1 : 1;
  if (a.target !== b.target) return a.target < b.target ? -1 : 1;
  return a.targetLine - b.targetLine;
}

export interface Ledger {
  rows: Map<string, Row>;
  /** 칸반 밖 출처의 보류 래칫. KAN-045 가 박은 줄이고 형식이 그대로다. */
  ratchet: Ratchet | null;
  /** 카드 문서 출처의 보류 래칫(KAN-047). */
  cardRatchet: Ratchet | null;
  /** 산문 속 맨 줄 번호 래칫(KAN-047). */
  nakedLine: number | null;
}

const RATCHET_LINE =
  /^#\s*bare\s+(\d+)\s+held\s+detached=(\d+)\s+unresolved=(\d+)\s+naked-name=(\d+)/;

/** 카드 출처 칸. 앞의 `cards` 때문에 위 정규식과 섞이지 않는다. */
const CARD_RATCHET_LINE =
  /^#\s*cards\s+bare=(\d+)\s+held\s+detached=(\d+)\s+unresolved=(\d+)\s+naked-name=(\d+)/;

const NAKED_LINE_RATCHET = /^#\s*naked-line\s+(\d+)/;

const readRatchet = (match: RegExpExecArray): Ratchet => ({
  bare: Number(match[1]),
  detached: Number(match[2]),
  unresolved: Number(match[3]),
  nakedName: Number(match[4]),
});

export function parseLedger(text: string): Ledger {
  const rows = new Map<string, Row>();
  let ratchet: Ratchet | null = null;
  let cardRatchet: Ratchet | null = null;
  let nakedLine: number | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\r$/, "");
    if (line.trim() === "") continue;
    if (line.startsWith("#")) {
      const match = RATCHET_LINE.exec(line);
      if (match) ratchet = readRatchet(match);
      const cardMatch = CARD_RATCHET_LINE.exec(line);
      if (cardMatch) cardRatchet = readRatchet(cardMatch);
      const nakedMatch = NAKED_LINE_RATCHET.exec(line);
      if (nakedMatch) nakedLine = Number(nakedMatch[1]);
      continue;
    }
    const [src, target, targetLine, fingerprint, flag] = line.split("\t");
    if (
      src === undefined ||
      target === undefined ||
      targetLine === undefined ||
      fingerprint === undefined
    )
      continue;
    rows.set(rowKey(src, target, Number(targetLine)), {
      src,
      target,
      targetLine: Number(targetLine),
      fingerprint,
      flag: flag ?? "-",
    });
  }
  return { rows, ratchet, cardRatchet, nakedLine };
}

/**
 * **머리 주석은 다섯 줄이다.** 열 이름 · 갱신 방법 · 래칫 세 칸(칸반 밖 출처 · 카드 출처 ·
 * 맨 줄 번호). 칸을 가르는 까닭은 검사 집합이 넓어진 것을 옛 칸에 **더하면 기준선이 한 번
 * 올라가고**, 그러면 「래칫은 오를 수 있다」를 가르치는 자리가 되기 때문이다.
 */
export function renderLedger(rows: Row[], scan: Scan): string {
  const counts = scan.counts;
  const cards = scan.cardCounts;
  const head = [
    "# src\ttarget\ttarget_line\tfingerprint\tflag",
    "# 갱신: bun run tools/check-citations.ts --update  (대장 = 지금 인용 집합. 손으로 고치지 않는다)",
    `# bare ${counts.bare} held detached=${counts.detached} unresolved=${counts.unresolved} naked-name=${counts.nakedName}`,
    `# cards bare=${cards.bare} held detached=${cards.detached} unresolved=${cards.unresolved} naked-name=${cards.nakedName}`,
    `# naked-line ${scan.nakedLine}`,
  ];
  const body = rows.map(
    (r) =>
      `${r.src}\t${r.target}\t${r.targetLine}\t${r.fingerprint}\t${r.flag}`,
  );
  return `${[...head, ...body].join("\n")}\n`;
}

/** `flag` 는 키가 같은 행에서 보존한다 — `S3` 이 남긴 `drift` 표시가 갱신마다 날아가면 뜻이 없다. */
export function carryFlags(rows: Row[], previous: Ledger | null): Row[] {
  if (previous === null) return rows;
  return rows.map((row) => {
    const old = previous.rows.get(rowKey(row.src, row.target, row.targetLine));
    return old === undefined ? row : { ...row, flag: old.flag };
  });
}

export interface Drift {
  kind: "missing" | "orphan" | "mismatch";
  row: Row;
  ledgerFingerprint?: string;
}

/** **대장은 지금 인용 집합과 정확히 일치해야 한다.** 셋 다 실패다. */
export function compareToLedger(rows: Row[], ledger: Ledger): Drift[] {
  const drifts: Drift[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const key = rowKey(row.src, row.target, row.targetLine);
    seen.add(key);
    const old = ledger.rows.get(key);
    if (old === undefined) {
      drifts.push({ kind: "missing", row });
      continue;
    }
    if (old.fingerprint !== row.fingerprint)
      drifts.push({
        kind: "mismatch",
        row,
        ledgerFingerprint: old.fingerprint,
      });
  }
  for (const [key, row] of ledger.rows)
    if (!seen.has(key)) drifts.push({ kind: "orphan", row });
  return drifts;
}

/** 보류 래칫 — 어느 수든 늘면 실패한다. 없으면 보류는 조용히 자라는 쓰레기통이 된다. */
export function ratchetBreaches(
  now: Ratchet,
  base: Ratchet,
  prefix = "",
): string[] {
  const rows: [string, number, number][] = [
    ["bare(경로 없는 인용 전체)", now.bare, base.bare],
    ["detached", now.detached, base.detached],
    ["unresolved", now.unresolved, base.unresolved],
    ["naked-name", now.nakedName, base.nakedName],
  ];
  return rows
    .filter(([, current, baseline]) => current > baseline)
    .map(
      ([label, current, baseline]) =>
        `${prefix}${label} 이 ${baseline} → ${current} 로 늘었다`,
    );
}

/**
 * 보류 래칫 두 칸을 함께 본다.
 *
 * **머리 주석에 없는 칸은 「올랐다」가 아니다.** 규격이 검사 집합을 넓혀 칸이 새로 생기면 옛
 * 대장에는 그 줄이 없고, 그때 한 번은 지금 값이 기준선으로 앉는다(다음 `--update`). 앉은 뒤에는
 * 다른 칸과 똑같이 **오르면 실패**다. 칸을 지워 되돌리는 길은 대장을 손으로 고치는 것뿐이고,
 * 그것은 이미 금지되어 있다(규격 6 「대장을 손으로 고치지 않는다」).
 */
export function heldBreaches(scan: Scan, ledger: Ledger | null): string[] {
  if (ledger === null) return [];
  const breaches: string[] = [];
  if (ledger.ratchet !== null)
    breaches.push(...ratchetBreaches(scan.counts, ledger.ratchet));
  if (ledger.cardRatchet !== null)
    breaches.push(
      ...ratchetBreaches(scan.cardCounts, ledger.cardRatchet, "카드 "),
    );
  return breaches;
}

/** 맨 줄 번호 래칫 — 늘면 실패한다. 줄이는 일은 이 게이트가 시키지 않는다. */
export function nakedLineBreach(
  scan: Scan,
  ledger: Ledger | null,
): string | null {
  if (ledger === null || ledger.nakedLine === null) return null;
  if (scan.nakedLine <= ledger.nakedLine) return null;
  return `산문 속 맨 줄 번호가 ${ledger.nakedLine} → ${scan.nakedLine} 로 늘었다`;
}

export type Mode = "check" | "update" | "tsv";

export interface RunResult {
  code: number;
  out: string[];
  err: string[];
}

/** 보류 전체 목록. `--tsv` 만 낸다 — 게이트는 요약 한 줄로 줄인다. */
function heldLines(scan: Scan): string[] {
  return scan.held.map(
    (item) => `  ${item.where}  \`${item.citation}\`  ${item.code}`,
  );
}

function describeOrigins(scan: Scan, row: Row): string[] {
  const list = scan.origins.get(rowKey(row.src, row.target, row.targetLine));
  if (list === undefined || list.length === 0) return [];
  return list.map((o) => `      ${o.where}  \`${o.citation}\`  해석: ${o.how}`);
}

export async function run(root: string, mode: Mode): Promise<RunResult> {
  const out: string[] = [];
  const err: string[] = [];
  const scan = await scanTree(root);

  // ── 존재 검사가 먼저다. 가리킬 곳이 없는 인용을 대장에 굳히면 게이트가 그것을 정상으로
  //    학습한다. 실패하면 **아무것도 쓰지 않고** 1 로 끝낸다.
  if (scan.problems.length > 0) {
    err.push(
      `인용 ${scan.checked}건 중 ${scan.problems.length}건이 어긋난다.\n`,
    );
    for (const problem of scan.problems) {
      err.push(`  ${problem.where}`);
      err.push(`    인용: ${problem.citation}`);
      err.push(`    문제: ${problem.detail}`);
    }
    err.push(
      "\n줄 번호가 바뀐 것이면 인용을 고치고, 가리킬 곳이 없어진 것이면 인용을 지운다.",
    );
    if (mode === "update")
      err.push("존재 검사가 실패해 대장을 쓰지 않았다. 인용을 먼저 고친다.");
    return { code: 1, out, err };
  }

  const ledgerFile = Bun.file(join(root, LEDGER_PATH));
  const previous = (await ledgerFile.exists())
    ? parseLedger(await ledgerFile.text())
    : null;
  const rows = carryFlags(scan.rows, previous);

  if (mode === "tsv") {
    out.push(...renderLedger(rows, scan).trimEnd().split("\n"));
    err.push(
      `대장 ${rows.length}행 · 인용 ${scan.checked}건 · 경로 없는 인용 ${scan.counts.bare + scan.cardCounts.bare}건(붙임 ${scan.counts.attached + scan.cardCounts.attached} · 자기 ${scan.counts.self + scan.cardCounts.self} · 보류 ${scan.held.length}) · 맨 줄 번호 ${scan.nakedLine}건.`,
    );
    // **보류 전체 목록은 여기로 낸다.** 게이트(`check`)는 요약 한 줄만 내고 통과시키므로,
    // 목록을 읽을 자리가 하나는 있어야 한다 — 없으면 「목록으로 내고 통과시킨다」가 글자만 남는다.
    err.push(...heldLines(scan));
    return { code: 0, out, err };
  }

  if (mode === "update") {
    // ── 래칫도 **쓰기 전에** 본다. 존재 검사와 같은 규율이다.
    //
    //    검토(2026-09-16)가 재현한 구멍이 여기였다 — 경로 없는 인용을 하나 더한 편집에서
    //    `check` 는 1 로 울지만, 이어서 돌린 `--update` 가 머리 주석의 수를 **올려 쓰고**
    //    다음 `check` 를 통과시켰다. 경고 한 줄도 없었다. 새 인용마다 `--update` 가
    //    따라붙으므로(규격 운용 소절 「마찰」) 그 자리는 예외가 아니라 일상 경로다.
    //    규약상 래칫이 정당하게 오르는 사례는 없다 — 늘리지 않고 인용을 쓰는 길이
    //    「경로를 적는 것」 하나뿐이기 때문이다. 그래서 오르면 **아무것도 쓰지 않고 1**.
    //    **내려가는 것은 막지 않는다** — 고쳐서 줄어드는 것이 정상 경로다.
    const rising = heldBreaches(scan, previous);
    const nakedRise = nakedLineBreach(scan, previous);
    if (nakedRise !== null) rising.push(nakedRise);
    if (rising.length > 0) {
      err.push(
        "보류 래칫이 올라 대장을 쓰지 않았다 — 경로 없는 인용도 맨 줄 번호도 늘리지 않는다.\n",
      );
      for (const breach of rising) err.push(`  ${breach}`);
      err.push(
        "\n수를 늘리지 않고 인용을 쓰는 길은 하나뿐이다 — **경로를 적는 것.**",
      );
      err.push(
        `인용을 고치고 다시 돌린다. 어느 자리가 보류인지는 \`--tsv\` 가 전수로 낸다(지금 ${scan.held.length}건).`,
      );
      return { code: 1, out, err };
    }

    await Bun.write(join(root, LEDGER_PATH), renderLedger(rows, scan));
    out.push(
      `대장 갱신: ${rows.length}행 → ${LEDGER_PATH} (인용 ${scan.checked}건 · 경로 없는 인용 ${scan.counts.bare + scan.cardCounts.bare}건 · 보류 ${scan.held.length} · 맨 줄 번호 ${scan.nakedLine})`,
    );
    return { code: 0, out, err };
  }

  out.push(
    `인용 ${scan.checked}건 전부 실재하는 비어 있지 않은 줄을 가리킨다.`,
  );

  // ── 보류는 실패가 아니다. **요약 한 줄**로 내고 통과시킨다.
  //
  //    전에는 여기서 보류를 전부 찍었다. 지금 실물이 134 건이라 `ci.ts gates` 가 도는 화면이
  //    **한 단계의 목록으로 덮였다** — 열세 단계 가운데 하나가 로그의 대부분을 먹으면 다른
  //    단계가 무엇을 말했는지 아무도 안 읽고, 안 읽는 로그는 꺼진 게이트와 같다. 목록 자체는
  //    `--tsv` 가 그대로 낸다(규격 3 「보류는 목록으로 내고 통과시킨다」가 사는 자리).
  if (scan.held.length > 0) {
    out.push(
      `경로 없는 인용 ${scan.counts.bare}건 — 붙임 ${scan.counts.attached} · 자기 ${scan.counts.self} · 보류 ${scan.held.length}(detached ${scan.counts.detached} · unresolved ${scan.counts.unresolved} · naked-name ${scan.counts.nakedName}). 보류는 대장 밖이다 — 전체 목록은 \`--tsv\`.`,
    );
  }
  if (scan.cardCounts.bare > 0) {
    out.push(
      `카드 문서(「수행 내역」 절 제외) 경로 없는 인용 ${scan.cardCounts.bare}건 — 붙임 ${scan.cardCounts.attached} · 자기 ${scan.cardCounts.self} · 보류 ${scan.cardCounts.detached + scan.cardCounts.unresolved + scan.cardCounts.nakedName}.`,
    );
  }

  if (previous === null) {
    out.push(
      `대장 ${LEDGER_PATH} 가 없어 표류 검사를 건너뛴다 — \`--update\` 로 만든다(지금 상태라면 ${rows.length}행).`,
    );
    return { code: 0, out, err };
  }

  const drifts = compareToLedger(scan.rows, previous);
  const breaches = heldBreaches(scan, previous);
  const nakedRise = nakedLineBreach(scan, previous);

  if (drifts.length === 0 && breaches.length === 0 && nakedRise === null) {
    out.push(
      `대장 ${previous.rows.size}행과 지문이 모두 일치한다 — 인용이 가리키던 내용이 그대로다.`,
    );
    return { code: 0, out, err };
  }

  if (drifts.length > 0) {
    err.push(
      `대장과 어긋나는 자리 ${drifts.length}건. 이 줄이 말하는 것은 하나다 — **그 자리에 있던 내용이 지금 거기 없다.**\n`,
    );
    for (const drift of drifts) {
      const { row } = drift;
      const label =
        drift.kind === "missing"
          ? "대장에 없는 인용"
          : drift.kind === "orphan"
            ? "인용이 사라진 대장 행"
            : "지문이 다르다";
      err.push(`  [${label}] ${row.src} → ${row.target}:${row.targetLine}`);
      if (drift.kind === "mismatch")
        err.push(
          `      대장 ${drift.ledgerFingerprint} ≠ 지금 ${row.fingerprint}`,
        );
      err.push(...describeOrigins(scan, row));
    }
    err.push(
      "\n대상이 정당히 움직였거나 내용만 바뀐 것이면 대조하고 `--update`.",
    );
    err.push(
      "인용이 밀린 것이면 **인용을 먼저 고치고** 그다음 `--update` 로 새 좌표를 등록한다.",
    );
    err.push(
      "해석이 「자기」라고 적혀 있는데 산문이 남의 파일을 말하고 있으면, 할 일은 `--update` 가 아니라 **경로를 적어 인용을 고치는 것**이다.",
    );
  }

  if (breaches.length > 0) {
    err.push(`\n보류 래칫이 깨졌다 — 경로 없는 인용은 늘리지 않는다.`);
    for (const breach of breaches) err.push(`  ${breach}`);
    err.push(
      "수를 늘리지 않고 인용을 쓰는 길은 하나뿐이다 — **경로를 적는 것.**",
    );
  }

  // ── 맨 줄 번호는 따로 운다. 보류와 사유도 고치는 길도 다르다 — 보류는 「경로를 적는 것」이고
  //    이쪽은 「줄을 가리키는 수를 인용 꼴로 적는 것」이다. 한 덩이로 내면 둘이 섞인다.
  if (nakedRise !== null) {
    err.push(`\n맨 줄 번호 래칫이 깨졌다 — ${nakedRise}.`);
    err.push(
      "줄을 가리킬 때는 `경로:줄` 또는 백틱 인용으로 적는다. 그래야 존재 검사와 표류 검사가 닿는다.",
    );
  }

  return { code: 1, out, err };
}

function parseMode(argv: string[]): Mode | null {
  const flags = argv.filter((a) => a.startsWith("--"));
  if (flags.length === 0) return "check";
  if (flags.length > 1) return null;
  if (flags[0] === "--update") return "update";
  if (flags[0] === "--tsv") return "tsv";
  return null;
}

if (import.meta.main) {
  const mode = parseMode(process.argv.slice(2));
  if (mode === null) {
    console.error(
      "사용법: bun run tools/check-citations.ts [--update | --tsv]",
    );
    process.exit(2);
  }
  const result = await run(resolve(import.meta.dir, ".."), mode);
  for (const line of result.out) console.log(line);
  for (const line of result.err) console.error(line);
  process.exit(result.code);
}
