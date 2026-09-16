/**
 * 절 식별기 — `SPEC.md` §2 의 id↔헤딩 매핑을 코드로 옮긴 것.
 *
 * **구 스캐너를 못 쓰는 이유가 여기 있다.** `tools/check-guide-rhythm.ts` 의 `sectionBody` 는
 * **고정 헤딩 접두 일치 + 첫 매치 하나**다. 새 골격에는 `fixed:false` 인 절(`deep.build`)과
 * `repeat` 절(`deep.walk.step`, 최소 3벌)이 있어서, 접두로는 못 찾고 찾아도 첫 벌만 본다.
 * P4(분기 피복)·P7(그림 의무)이 그 자리에서 통째로 헛돈다.
 *
 * **어느 규칙으로도 안 잡히는 헤딩은 에러다.** 조용히 넘기면 그 절이 어느 판정에도 안 걸리고,
 * 화면에는 "통과" 로 뜬다 — 이 저장소가 이미 한 번 겪은 실패 모양이다.
 *
 * **골격이 둘이다.** 알고리즘은 `sandbox/algo-guide-v2/SPEC.md` §2, 자료구조는
 * `sandbox/ds-guide-v2/SPEC.md` §2 가 매핑의 정본이다. 뒤엣것은 앞엣것의 델타라 **표도
 * 델타로 짓는다** — 공통분을 한 벌만 두고 갈리는 것만 나눈다. 두 벌을 통째로 복제하면
 * 공통 항목을 한쪽만 고치는 날이 오고, 그날 갈린 쪽은 조용히 판정을 놓친다.
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

/**
 * 문구가 고정된 절. 헤딩 한 줄이 그대로 id 를 정한다.
 *
 * **`deep.*` 접두는 부모 관계를 뜻하지 않는다.** 2026-08-27 유저 지적으로 `## 아이디어 상세`
 * 컨테이너가 해체됐고, id 는 옛 이름 그대로 두었다 — 부모 관계의 정본은 `SPEC.md` §1 표의
 * parent 칸이고, id 를 재편하면 이 파일 밖 30여 곳이 함께 흔들린다. `deep.walk` 접두만 실제
 * 묶음을 뜻한다.
 *
 * **2026-08-28 유저 지시로 헤딩이 한 단씩 내려갔다.** 문서가 파트 둘로 갈리면서 `##` 은
 * 파트가 쓰고, 항목은 `###`, 항목의 하위 절은 `####` 가 됐다.
 */
/** 어느 골격의 문서인가. 매핑이 이것으로 갈린다. */
export type GuideKind = "algo" | "ds";

/** 두 골격이 같은 문구를 쓰는 절. */
const FIXED_COMMON: ReadonlyArray<readonly [string, string]> = [
  ["prereq", "### 시작하기 전에 — 이미 알고 있어야 하는 것"],
  ["concept", "### 전체 컨셉"],
  ["deep.math", "### 수식 정의와 유도"],
  ["purpose.real", "#### 실제로 쓰이는 곳"],
  ["purpose.alt", "#### 경쟁 설계와의 대조"],
  ["perf", "### 비용 계산"],
  ["perf.derive", "#### 비용을 세는 과정"],
  ["perf.bounds", "#### 케이스별 비용과 그 경계"],
  ["perf.worst", "#### 최악을 만드는 입력"],
  ["selfcheck", "### 스스로 점검하기"],
];

/** 알고리즘 고유 — 문장의 주어가 문제다. */
const FIXED_ALGO: ReadonlyArray<readonly [string, string]> = [
  ...FIXED_COMMON,
  ["purpose", "### 이 알고리즘이 최적의 솔루션인 경우"],
  ["purpose.fit", "#### 최적인 문제의 모양"],
  ["purpose.cue", "#### 문제에서 이것을 떠올리게 하는 단서"],
];

/**
 * 자료구조 고유 — **문장의 주어가 연산이다.**
 *
 * `purpose.cue` 가 가장 크게 갈린다. 알고리즘은 문제 지문의 신호를 묻는데, 자료구조 가이드는
 * 문제를 다루지 않는다(ORD-006 의 핵심 결정). 독자가 다음에 만나는 것은 문제 지문이 아니라
 * 자기 코드의 요구라, 단서를 **연산 조합**으로 적는다.
 *
 * `perf.escalation` 은 이 골격에만 있다. 신설이 아니라 이관이다 —
 * `docs/ORD-006-conventions.md:1175` 이 8단계 표의 6번 행으로 이미 갖고 있었다.
 */
const FIXED_DS: ReadonlyArray<readonly [string, string]> = [
  ...FIXED_COMMON,
  ["purpose", "### 이 구조가 최적의 선택인 경우"],
  ["purpose.fit", "#### 최적인 요구의 모양"],
  ["purpose.cue", "#### 이 구조를 떠올리게 하는 연산 조합"],
  ["perf.escalation", "#### TypeScript 의 한계와 대체 언어"],
];

/**
 * 문구를 내용에 맞춰 짓는 절. 직무만 고정이라 패턴으로 잡는다.
 *
 * `deep.walk` 아래 셋의 순서가 중요하다 — `deep.walk.final` 과 `deep.walk.pause` 를 먼저
 * 시험해야 나머지가 잔여(`deep.walk.step`)로 떨어진다.
 */
const PATTERNED_COMMON: ReadonlyArray<readonly [string, RegExp]> = [
  ["title", /^# .+$/],
  ["part1", /^## 파트 1 — .+$/],
  ["part2", /^## 파트 2 — .+$/],
  // 2026-08-28 유저 지시로 생긴 **조건부** 절. 파트 1 의 마지막에 온다 — 본문이 이미 값으로
  // 보인 것에 이름을 붙이는 자리다. 없는 편이 정상이므로 여기서만 잡고 필수로 세지 않는다.
  ["related", /^### 알아 두면 좋은 개념 — .+$/],
  ["invariant", /^### 불변식 — .+$/],
  ["deep.walk.final", /^#### .*전체 코드$/],
  ["deep.walk.pause", /^#### 멈춤 — .+$/],
];

const PATTERNED_ALGO: ReadonlyArray<readonly [string, RegExp]> = [
  ...PATTERNED_COMMON,
  ["deep.build", /^### 아이디어 상세 — .+$/],
  ["deep.walk", /^### 수행으로 알아보는 알고리즘 — .+$/],
];

/**
 * 자료구조 고유.
 *
 * `deep.build` 가 「아이디어 상세」가 아니라 「설계 상세」인 것은 진입점이 문제 지문이 아니라
 * 계약이기 때문이다 — 그 절의 직무 ①이 문제를 **고정**하지 않고 이미 선 계약을 **읽는다**.
 */
const PATTERNED_DS: ReadonlyArray<readonly [string, RegExp]> = [
  ...PATTERNED_COMMON,
  ["deep.build", /^### 설계 상세 — .+$/],
  ["deep.walk", /^### 수행으로 알아보는 자료구조 — .+$/],
];

/**
 * `deep.walk.step` 은 **잔여**로 정한다.
 *
 * 정규식으로 이름을 강제하면 단계 이름을 그 편의 내용에 맞춰 짓지 못한다. 그래서
 * `deep.walk` 컨테이너(알고리즘은 `### 수행으로 알아보는 알고리즘 — …`, 자료구조는
 * `### 수행으로 알아보는 자료구조 — …`) 안의 `####` 중 `deep.walk.final`·`deep.walk.pause` 로
 * 해소되지 않은 전부를 순서대로 `deep.walk.step` 으로 본다.
 */
const WALK_CONTAINER = "deep.walk";

export interface ParseResult {
  sections: Section[];
  /** 어느 규칙으로도 안 잡힌 헤딩. 비어 있지 않으면 판정을 진행하지 않는다. */
  unresolved: { heading: string; line: number }[];
}

export function parseSections(text: string, kind: GuideKind): ParseResult {
  const FIXED = kind === "ds" ? FIXED_DS : FIXED_ALGO;
  const PATTERNED = kind === "ds" ? PATTERNED_DS : PATTERNED_ALGO;
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
  let insideWalk = false;

  for (const item of raw) {
    // 컨테이너를 벗어나면 잔여 규칙도 끝난다. `deep.walk` 는 `###` 이므로 경계가 level 3 이다.
    // 리셋이 설정보다 먼저라 `deep.walk` 자신은 아래에서 다시 true 가 된다.
    if (item.level <= 3) insideWalk = false;

    const fixed = FIXED.find(([, heading]) => heading === item.heading);
    if (fixed) {
      sections.push({ id: fixed[0], ...item });
      continue;
    }

    const patterned = PATTERNED.find(([, re]) => re.test(item.heading));
    if (patterned) {
      if (patterned[0] === WALK_CONTAINER) insideWalk = true;
      sections.push({ id: patterned[0], ...item });
      continue;
    }

    // 잔여 — `deep.walk` 컨테이너 안의 `####` 는 전부 `deep.walk.step` 이다.
    if (insideWalk && item.level === 4) {
      sections.push({ id: "deep.walk.step", ...item });
      continue;
    }

    unresolved.push({ heading: item.heading, line: item.line });
  }

  return { sections, unresolved };
}

/** 그 id 의 절 전부. `deep.walk.step` 처럼 반복되는 절은 순서대로 여럿이 나온다. */
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
