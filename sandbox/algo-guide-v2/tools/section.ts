/**
 * 절 식별기 — `SPEC.md` §2 의 id↔헤딩 매핑을 코드로 옮긴 것.
 *
 * **구 스캐너를 못 쓰는 이유가 여기 있다.** `tools/check-guide-rhythm.ts` 의 `sectionBody` 는
 * **고정 헤딩 접두 일치 + 첫 매치 하나**다. 새 골격에는 `fixed:false` 인 절(`deep.build`)과
 * `repeat` 절(`code.step`, 최소 3벌)이 있어서, 접두로는 못 찾고 찾아도 첫 벌만 본다.
 * P4(분기 피복)·P7(그림 의무)이 그 자리에서 통째로 헛돈다.
 *
 * **어느 규칙으로도 안 잡히는 헤딩은 에러다.** 조용히 넘기면 그 절이 어느 판정에도 안 걸리고,
 * 화면에는 "통과" 로 뜬다 — 이 저장소가 이미 한 번 겪은 실패 모양이다.
 */

/** 한 절. `body` 는 헤딩 **다음 줄부터** 다음 헤딩 전까지다. */
export interface Section {
  id: string;
  heading: string;
  /** 파일에서 헤딩이 있던 줄 번호(1-based). 진단 메시지가 이걸 가리킨다. */
  line: number;
  level: number;
  body: string[];
}

/** 문구가 고정된 절. 헤딩 한 줄이 그대로 id 를 정한다. */
const FIXED: ReadonlyArray<readonly [string, string]> = [
  ["prereq", "## 시작하기 전에 — 이미 알고 있어야 하는 것"],
  ["concept", "## 전체 컨셉"],
  ["deep", "## 아이디어 상세"],
  ["deep.math", "### 수식 정의와 유도"],
  ["deep.proof", "### 왜 항상 옳은가"],
  ["deep.trap", "### 흔한 오해와 그것이 거짓인 이유"],
  ["deep.check", "### 이해 점검"],
  ["purpose", "## 이 알고리즘이 최적인 자리"],
  ["purpose.fit", "### 최적인 문제의 모양"],
  ["purpose.cue", "### 문제에서 이것을 떠올리게 하는 단서"],
  ["purpose.real", "### 실제로 쓰이는 곳"],
  ["purpose.alt", "### 경쟁 설계와의 대조"],
  ["code", "## 코드로 옮기기"],
  ["code.pseudo", "### 수도 코드로 본 전체"],
  ["code.final", "### 완성 코드"],
  ["trace", "## 한 입력으로 끝까지 굴려 보기"],
  ["perf", "## 비용 계산"],
  ["perf.derive", "### 비용을 세는 과정"],
  ["perf.bounds", "### 케이스별 비용과 그 경계"],
  ["perf.worst", "### 최악을 만드는 입력"],
  ["mistake", "## 한 곳을 바꿔 보면"],
  ["selfcheck", "## 스스로 점검하기"],
];

/** 문구를 내용에 맞춰 짓는 절. 직무만 고정이라 패턴으로 잡는다. */
const PATTERNED: ReadonlyArray<readonly [string, RegExp]> = [
  ["title", /^# .+$/],
  ["deep.build", /^### .+ — 생각이 닿는 경로$/],
];

/**
 * `code.step` 은 **잔여**로 정한다.
 *
 * 정규식으로 이름을 강제하면 단계 이름을 알고리즘에 맞춰 짓지 못한다. 그래서
 * `## 코드로 옮기기` 안의 `###` 중 `code.pseudo`·`code.final` 로 해소되지 않은 전부를
 * 순서대로 `code.step` 으로 본다.
 */
const CODE_CONTAINER = "code";

export interface ParseResult {
  sections: Section[];
  /** 어느 규칙으로도 안 잡힌 헤딩. 비어 있지 않으면 판정을 진행하지 않는다. */
  unresolved: { heading: string; line: number }[];
}

export function parseSections(text: string): ParseResult {
  const lines = text.split("\n");
  const raw: {
    heading: string;
    line: number;
    level: number;
    body: string[];
  }[] = [];
  let current: (typeof raw)[number] | null = null;
  let fenced = false;

  for (const [index, line] of lines.entries()) {
    // 펜스 안의 `#` 는 헤딩이 아니다. ascii 도식과 셸 주석이 그 모양으로 나온다.
    if (line.trimStart().startsWith("```")) fenced = !fenced;
    const match = fenced ? null : /^(#{1,6}) /.exec(line);
    if (match) {
      current = {
        heading: line.trim(),
        line: index + 1,
        level: match[1]?.length ?? 1,
        body: [],
      };
      raw.push(current);
      continue;
    }
    current?.body.push(line);
  }

  const sections: Section[] = [];
  const unresolved: { heading: string; line: number }[] = [];
  let insideCode = false;

  for (const item of raw) {
    // 컨테이너를 벗어나면 잔여 규칙도 끝난다.
    if (item.level <= 2) insideCode = false;

    const fixed = FIXED.find(([, heading]) => heading === item.heading);
    if (fixed) {
      if (fixed[0] === CODE_CONTAINER) insideCode = true;
      sections.push({ id: fixed[0], ...item });
      continue;
    }

    const patterned = PATTERNED.find(([, re]) => re.test(item.heading));
    if (patterned) {
      sections.push({ id: patterned[0], ...item });
      continue;
    }

    // 잔여 — `## 코드로 옮기기` 안의 `###` 는 전부 `code.step` 이다.
    if (insideCode && item.level === 3) {
      sections.push({ id: "code.step", ...item });
      continue;
    }

    unresolved.push({ heading: item.heading, line: item.line });
  }

  return { sections, unresolved };
}

/** 그 id 의 절 전부. `code.step` 처럼 반복되는 절은 순서대로 여럿이 나온다. */
export function pick(sections: Section[], id: string): Section[] {
  return sections.filter((s) => s.id === id);
}

/** 그 id 의 첫 절. 없으면 `undefined`. */
export function first(sections: Section[], id: string): Section | undefined {
  return sections.find((s) => s.id === id);
}

/**
 * 절 본문에서 펜스 블록만 뽑는다. 여는 줄의 언어 태그를 함께 돌려준다.
 *
 * P1(연속 산문)·P4(분기 라벨)·P7(그림 의무)이 전부 이것을 쓴다 — "그림"과 "코드"를
 * 가르는 자리가 한 곳이어야 정의가 갈라지지 않는다.
 */
export function fences(body: string[]): { lang: string; lines: string[] }[] {
  const out: { lang: string; lines: string[] }[] = [];
  let open: { lang: string; lines: string[] } | null = null;
  for (const line of body) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("```")) {
      if (open) {
        out.push(open);
        open = null;
      } else {
        open = { lang: trimmed.slice(3).trim(), lines: [] };
      }
      continue;
    }
    open?.lines.push(line);
  }
  // 닫히지 않은 펜스도 버리지 않는다 — 버리면 그림이 하나 사라진 것으로 오판된다.
  if (open) out.push(open);
  return out;
}
