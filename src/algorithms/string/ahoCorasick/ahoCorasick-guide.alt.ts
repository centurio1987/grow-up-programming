/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 잣대**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * 「본문의 수치가 실측과 일치하는가」(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/string/ahoCorasick/ahoCorasick-guide.alt.ts
 *
 * **잣대는 원고 전체와 같다.**
 *
 * - **자료 접근** — 배열 칸을 읽거나 쓴 횟수와 문자열 글자를 읽은 횟수의 합. 칸을 잡으며 `-1` 이나 0 으로
 *   채우는 일과 반환 직전의 정렬은 세지 않는다(정렬은 두 설계가 같은 매칭 `z` 개에 똑같이 한다). 같은
 *   갈래의 접미사 배열 · 카사이 LCP · 가장 긴 회문 편과 같은 기준이다.
 * - **추가 칸** — 입력(텍스트 · 패턴) 밖에 절차가 잡는 배열 칸 가운데 동시에 살아 있는 것의 최댓값. 자동자는
 *   잡은 배열(용량 `cap` = 패턴 길이의 합 + 1 로 잡는다)을 끝까지 모두 들고 있으므로 그 합이고, 경쟁 설계는
 *   실패 함수를 한 벌씩만 들고 있으므로 가장 긴 패턴의 길이다. 반환 배열은 두 설계가 같으므로 세지 않는다.
 *
 * 계수기는 정본의 줄을 그대로 옮기고 줄마다 센다. 본문의 다른 절(「아이디어를 떠올리는 과정」 ·
 * 「비용 계산」)도 이 파일의 계수기를 부른다 — 원고 한 벌에 잣대가 하나다.
 *
 * 2026-09-30 전개(`KAN-058`)에서 잣대와 생성식을 바꿨다. 옛 잣대 「기본 연산」은 표 한 칸의 조회와 기록을
 * 묶어 세는 등 줄마다 셈이 달랐고, 같은 갈래의 편들이 쓰는 「자료 접근」 하나로 맞췄다. 무작위 입력의
 * 생성식도 같은 갈래의 편들과 같은 mulberry32(씨앗 `0x9e3779b9`)로 맞췄다(옛 생성식은 곱셈 합동식
 * `x ← 48271x mod 2147483647` · 시작값 `20250903`). 그 결과 순서가 뒤집히는 패턴 수가 39·40 에서 41·42 로
 * 옮겨 갔다 — 새 잣대가 패턴마다 실패 함수를 따로 쓰는 쪽에 조금 유리하다. 수치가 마음에 안 들어 바꾼
 * 것이 아니다.
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 텍스트 여섯 글자와 패턴 셋을 쓰는데, 패턴 길이의 합이
 * 9 라 패턴을 아홉 개보다 많이 만들 수 없다. 순서가 뒤집히는 자리는 패턴 수 42 다. 그래서 과제 규모의
 * 최댓값을 그대로 채운 입력을 쓴다 — 텍스트 100,000 글자, 패턴 길이의 합 100,000 이다.
 *
 * **두 설계가 같은 답을 내는지 매 실행마다 대조한다**(`verify`). 계수만 세고 답을 안 보면 「빠른데 틀린
 * 것」이 통과한다. 기준은 정본 `ahoCorasick-guide.ref.ts` 의 반환값이다.
 */

import { ahoCorasick, type Match } from "./ahoCorasick-guide.ref.ts";

const SIGMA = 26;

/** 텍스트 길이. 과제 규모의 최댓값이다. */
export const TEXT_LENGTH = 100_000;

/** 패턴 길이의 합. 과제 규모의 최댓값이다. */
export const PATTERN_TOTAL = 100_000;

/** 결정론적 난수 — mulberry32(씨앗 `0x9e3779b9`). 32비트 정수 연산만 써서 배정밀도 손실이 없다. */
export function makeText(n: number, sigma = SIGMA): string {
  let a = 0x9e3779b9;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    out.push(String.fromCharCode(97 + (((t ^ (t >>> 14)) >>> 0) % sigma)));
  }
  return out.join("");
}

/**
 * 길이 합 `total` 을 `k` 개로 똑같이 나눈 패턴. 텍스트에서 잘라 내므로 전부 적어도 한 번은 등장한다 —
 * 어느 설계도 매칭이 0 인 덕을 보지 않게 하려는 것이다. 자르는 자리는 `4099` 씩 건너뛴다.
 */
export function makePatterns(text: string, k: number, total: number): string[] {
  const length = Math.floor(total / k);
  const span = Math.max(1, text.length - length);
  return Array.from({ length: k }, (_, j) =>
    text.slice((j * 4099) % span, ((j * 4099) % span) + length),
  );
}

/* ─────────────── 아호–코라식 자동자 — 정본과 같은 절차에 자료 접근만 덧붙인다 ─────────────── */

/** 자동자 계수기의 결과. 무리마다 나눠 센다(「비용 계산」이 무리별로 인용한다). */
export interface AhoCount {
  /** 자료 접근의 합. */
  readonly access: number;
  /** 패턴을 트라이에 담는 무리. */
  readonly insert: number;
  /** 실패 링크 · 출력 링크 · 전이표를 채우는 무리. */
  readonly fill: number;
  /** 텍스트를 읽으며 매칭을 거두는 무리. */
  readonly scan: number;
  /** 출력 링크 사슬에서 들른 노드의 수(글자마다 서 있는 노드 하나를 포함한다). */
  readonly visits: number;
  /** 실패 링크가 가리키는 노드에서 패턴이 안 끝나 그 노드의 출력 링크를 읽은 노드의 수. */
  readonly inheritOut: number;
  /** 추가 칸 — 잡는 배열 칸의 합. 모두 끝까지 살아 있다. */
  readonly cells: number;
  /** 노드 수. 뿌리를 포함한다. */
  readonly nodes: number;
  /** 뿌리의 자식 수. */
  readonly rootChildren: number;
  readonly matches: Match[];
}

/**
 * 정본 `buildAutomaton` · `ahoCorasick` 의 줄을 그대로 옮기고 줄마다 자료 접근을 센다. 배열 칸 하나를
 * 읽거나 쓰면 1, 문자열 글자 하나를 읽으면 1 이다. `patterns[i]` 를 꺼내는 것도 배열 칸 읽기다.
 */
export function countAho(text: string, patterns: readonly string[]): AhoCount {
  let access = 0;
  let cap = 1;
  for (const p of patterns) cap += p.length;

  const next = new Int32Array(cap * SIGMA).fill(-1);
  const link = new Int32Array(cap);
  const outLink = new Int32Array(cap).fill(-1);
  const depth = new Int32Array(cap);
  const endOf: number[][] = Array.from({ length: cap }, () => [] as number[]);
  let size = 1;

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i] as string;
    access += 1; // patterns[i]
    if (pattern.length === 0) continue;
    let s = 0;
    for (const ch of pattern) {
      access += 1; // 패턴 글자
      const c = ch.charCodeAt(0) - 97;
      access += 1; // next[s][c] 가 비었는가
      if (next[s * SIGMA + c] === -1) {
        next[s * SIGMA + c] = size;
        depth[size] = (depth[s] as number) + 1;
        size += 1;
        access += 3; // next 쓰기 · depth[s] 읽기 · depth 쓰기
      }
      access += 1; // s = next[s][c]
      s = next[s * SIGMA + c] as number;
    }
    access += 1; // endOf[s] 에 번호 쓰기
    (endOf[s] as number[]).push(i);
  }
  const insert = access;

  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;
  let rootChildren = 0;
  for (let c = 0; c < SIGMA; c++) {
    access += 1; // next[c]
    const child = next[c] as number;
    if (child === -1) {
      next[c] = 0;
      access += 1;
    } else {
      link[child] = 0;
      queue[tail] = child;
      tail += 1;
      access += 2;
      rootChildren += 1;
    }
  }
  let inheritOut = 0;
  while (head < tail) {
    const v = queue[head] as number;
    head += 1;
    const f = link[v] as number;
    access += 2; // queue[head] · link[v]
    access += 1; // endOf[f]
    if ((endOf[f] as number[]).length > 0) {
      outLink[v] = f;
    } else {
      access += 1; // outLink[f]
      inheritOut += 1;
      outLink[v] = outLink[f] as number;
    }
    access += 1; // outLink[v] 쓰기
    for (let c = 0; c < SIGMA; c++) {
      access += 1; // next[v][c]
      const u = next[v * SIGMA + c] as number;
      if (u === -1) {
        access += 2; // next[f][c] 읽기 · next[v][c] 쓰기
        next[v * SIGMA + c] = next[f * SIGMA + c] as number;
      } else {
        access += 3; // next[f][c] 읽기 · link[u] 쓰기 · queue 쓰기
        link[u] = next[f * SIGMA + c] as number;
        queue[tail] = u;
        tail += 1;
      }
    }
  }
  const fill = access - insert;

  const matches: Match[] = [];
  let visits = 0;
  let s = 0;
  for (let pos = 0; pos < text.length; pos++) {
    access += 2; // 텍스트 글자 · next[s][c]
    s = next[s * SIGMA + text.charCodeAt(pos) - 97] as number;
    for (let t = s; t !== -1; t = outLink[t] as number) {
      visits += 1;
      access += 1; // endOf[t]
      for (const i of endOf[t] as number[]) {
        access += 3; // 번호 읽기 · depth[t] 읽기 · 매칭 쓰기
        matches.push({
          patternIndex: i,
          position: pos - (depth[t] as number) + 1,
        });
      }
      access += 1; // outLink[t]
    }
  }
  matches.sort(
    (a, b) => a.position - b.position || a.patternIndex - b.patternIndex,
  );
  // 전이표 Σ·cap · 실패 링크 · 출력 링크 · 깊이 · 끝 목록 각각 cap · 큐 V · 끝 목록에 든 번호 k.
  const cells = next.length + 4 * cap + size + patterns.length;
  return {
    access,
    insert,
    fill,
    scan: access - insert - fill,
    visits,
    inheritOut,
    cells,
    nodes: size,
    rootChildren,
    matches,
  };
}

/* ─────────────── 경쟁 설계 — 패턴마다 실패 함수를 따로 ─────────────── */

/**
 * 패턴 하나마다 실패 함수를 만들고 텍스트를 처음부터 다시 대조한다(`findAllOccurrences` 가이드의
 * 절차를 패턴 수만큼 부른다). 실패 함수를 한 벌만 들고 있으면 되므로 추가 칸은 가장 긴 패턴의 길이다.
 */
export function countKmpEach(
  text: string,
  patterns: readonly string[],
): { access: number; cells: number; matches: Match[] } {
  let access = 0;
  let cells = 0;
  const matches: Match[] = [];
  for (const [index, pattern] of patterns.entries()) {
    access += 1; // patterns[i]
    const m = pattern.length;
    if (m === 0) continue;
    cells = Math.max(cells, m);
    const fail = new Int32Array(m);
    let k = 0;
    for (let i = 1; i < m; i++) {
      while (k > 0) {
        access += 2; // pattern[i] · pattern[k]
        if (pattern[i] === pattern[k]) break;
        access += 1; // fail[k - 1]
        k = fail[k - 1] as number;
      }
      access += 2; // pattern[i] · pattern[k]
      if (pattern[i] === pattern[k]) k += 1;
      access += 1; // fail[i] 쓰기
      fail[i] = k;
    }
    let j = 0;
    for (let i = 0; i < text.length; i++) {
      while (j > 0) {
        access += 2; // text[i] · pattern[j]
        if (text[i] === pattern[j]) break;
        access += 1; // fail[j - 1]
        j = fail[j - 1] as number;
      }
      access += 2; // text[i] · pattern[j]
      if (text[i] === pattern[j]) j += 1;
      if (j === m) {
        access += 2; // 매칭 쓰기 · fail[j - 1]
        matches.push({ patternIndex: index, position: i - m + 1 });
        j = fail[j - 1] as number;
      }
    }
  }
  matches.sort(
    (a, b) => a.position - b.position || a.patternIndex - b.patternIndex,
  );
  return { access, cells, matches };
}

/* ────────────────────────── 작업 목록 ────────────────────────── */

/** 대조에 쓰는 패턴 수 넷. 41 과 42 사이가 순서가 뒤집히는 자리다. */
export const PATTERN_COUNTS = [1, 41, 42, 1000] as const;

/** 대조에 쓰는 텍스트 — mulberry32 로 만든 소문자 26 글자짜리. */
export const TEXT = makeText(TEXT_LENGTH);

const same = (a: readonly Match[], b: readonly Match[]): boolean =>
  a.length === b.length &&
  a.every(
    (x, i) =>
      x.patternIndex === (b[i] as Match).patternIndex &&
      x.position === (b[i] as Match).position,
  );

/**
 * 계수기가 정본과 같은 답을 내는지 확인한다. 계수만 세고 답을 안 보면 「빠른데 틀린 것」이 대조를
 * 통과한다.
 */
export function verify(
  text: string,
  patterns: readonly string[],
  got: readonly Match[],
  design: string,
): void {
  const want = ahoCorasick(text, [...patterns]);
  if (!same(got, want)) {
    throw new Error(
      `${design} 가 정본과 다른 답을 냈다 — 매칭 ${got.length} 대 ${want.length}`,
    );
  }
}

export const cases = {
  "아호–코라식 자동자": () => {
    const out: Record<string, number> = {};
    for (const k of PATTERN_COUNTS) {
      const patterns = makePatterns(TEXT, k, PATTERN_TOTAL);
      const r = countAho(TEXT, patterns);
      verify(TEXT, patterns, r.matches, "아호–코라식 자동자");
      out[`패턴 ${k} 개 · 자료 접근`] = r.access;
      if (k === 1 || k === 1000) out[`패턴 ${k} 개 · 추가 칸`] = r.cells;
    }
    return out;
  },
  "패턴마다 실패 함수": () => {
    const out: Record<string, number> = {};
    for (const k of PATTERN_COUNTS) {
      const patterns = makePatterns(TEXT, k, PATTERN_TOTAL);
      const r = countKmpEach(TEXT, patterns);
      verify(TEXT, patterns, r.matches, "패턴마다 실패 함수");
      out[`패턴 ${k} 개 · 자료 접근`] = r.access;
      if (k === 1 || k === 1000) out[`패턴 ${k} 개 · 추가 칸`] = r.cells;
    }
    return out;
  },
};
