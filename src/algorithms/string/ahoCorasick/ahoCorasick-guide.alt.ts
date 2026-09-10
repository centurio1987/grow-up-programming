/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업 목록**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **기본
 * 연산 수**(텍스트·패턴 글자 읽기 + 표 한 칸 조회·기록 + 글자 견주기)와 **저장 칸**이다.
 * 벽시계·처리량은 실행마다 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts ahoCorasick-guide.alt.ts
 *
 * **두 설계가 같은 답을 내는지 매 실행마다 대조한다**(`verify`). 계수만 세고 답을 안 보면
 * 「빠른데 틀린 것」이 통과한다. 기준은 정본 `ahoCorasick-guide.ref.ts` 의 반환값이다.
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 텍스트 여섯 글자와 패턴 셋을 쓰는데,
 * 그 크기에서는 두 설계의 계수가 상수에 묻힌다. 그래서 제약이 정한 최댓값을 그대로 채운
 * 입력을 쓴다 — 텍스트 100,000 글자, 패턴 길이의 합 100,000 이다.
 *
 * **난수를 쓰지 않는다.** 텍스트는 아래 생성식 하나로 정해지고, 곱셈의 중간 항이
 * `2147483646 × 48271 ≈ 1.04 × 10^14` 로 배정밀도 정수 한계 `2^53 ≈ 9.01 × 10^15` 아래에 있다.
 * 한계를 넘으면 생성식이 문서에 적힌 것과 다른 수열을 내고, 그때 계수는 아무것도 재지 않는다.
 */

import { ahoCorasick, type Match } from "./ahoCorasick-guide.ref.ts";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const SIGMA = 26;
const codeOf = (ch: string): number => ch.charCodeAt(0) - 97;

/** 텍스트 길이. 제약이 정한 최댓값이다. */
export const TEXT_LENGTH = 100_000;

/** 패턴 길이의 합. 제약이 정한 최댓값이다. */
export const PATTERN_TOTAL = 100_000;

/** 생성식의 시작값. 이 수 하나가 텍스트 전체를 정한다. */
export const SEED = 20_250_903;

/**
 * `x <- (x × 48271) mod 2147483647` 로 다음 수를 만들고 그 나머지로 글자를 고른다.
 * 곱셈의 중간 항이 배정밀도 정수 한계 아래에 있는 것이 이 상수 조합을 고른 이유다.
 */
export function makeText(n: number): string {
  const out: string[] = [];
  let x = SEED;
  for (let i = 0; i < n; i++) {
    x = (x * 48271) % 2147483647;
    out.push(ALPHABET[x % SIGMA] as string);
  }
  return out.join("");
}

/**
 * 길이 합 `total` 을 `k` 개로 똑같이 나눈 패턴. 텍스트에서 잘라 내므로 전부 적어도 한 번은
 * 등장한다 — 어느 설계도 매칭이 0 인 덕을 보지 않게 하려는 것이다.
 */
export function makePatterns(text: string, k: number, total: number): string[] {
  const length = Math.floor(total / k);
  const span = Math.max(1, text.length - length);
  return Array.from({ length: k }, (_, j) =>
    text.slice((j * 4099) % span, ((j * 4099) % span) + length),
  );
}

/* ────────────────────── 설계 A — 패턴을 한 기계로 합친다 ────────────────────── */

/**
 * 정본과 같은 절차에 계수만 덧붙인 것. `표 한 칸을 읽거나 기록하는 것`과 `글자 하나를 읽는
 * 것`을 각각 1 로 센다.
 */
export function mergedCounts(
  text: string,
  patterns: readonly string[],
): { ops: number; cells: number; matches: Match[] } {
  let ops = 0;
  let cap = 1;
  for (const p of patterns) cap += p.length;

  const next = new Int32Array(cap * SIGMA).fill(-1);
  const link = new Int32Array(cap);
  const outLink = new Int32Array(cap).fill(-1);
  const depth = new Int32Array(cap);
  const endOf: number[][] = Array.from({ length: cap }, () => [] as number[]);
  let size = 1;

  for (let i = 0; i < patterns.length; i++) {
    let s = 0;
    for (const ch of patterns[i] as string) {
      ops += 2; // 패턴 글자 읽기 + 전이표 조회
      const c = codeOf(ch);
      if (next[s * SIGMA + c] === -1) {
        next[s * SIGMA + c] = size;
        depth[size] = (depth[s] as number) + 1;
        size += 1;
        ops += 1;
      }
      s = next[s * SIGMA + c] as number;
    }
    (endOf[s] as number[]).push(i);
    ops += 1;
  }

  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;
  for (let c = 0; c < SIGMA; c++) {
    ops += 1;
    const child = next[c] as number;
    if (child === -1) {
      next[c] = 0;
      ops += 1;
    } else {
      link[child] = 0;
      ops += 1;
      queue[tail] = child;
      tail += 1;
    }
  }
  while (head < tail) {
    const v = queue[head] as number;
    head += 1;
    const f = link[v] as number;
    outLink[v] = (endOf[f] as number[]).length > 0 ? f : (outLink[f] as number);
    ops += 2;
    for (let c = 0; c < SIGMA; c++) {
      ops += 3; // 이 칸 조회 + 실패 링크 쪽 칸 조회 + 기록
      const u = next[v * SIGMA + c] as number;
      if (u === -1) {
        next[v * SIGMA + c] = next[f * SIGMA + c] as number;
      } else {
        link[u] = next[f * SIGMA + c] as number;
        queue[tail] = u;
        tail += 1;
      }
    }
  }

  const matches: Match[] = [];
  let s = 0;
  for (let i = 0; i < text.length; i++) {
    ops += 2; // 텍스트 글자 읽기 + 전이표 조회
    s = next[s * SIGMA + codeOf(text[i] as string)] as number;
    for (let t = s; t !== -1; t = outLink[t] as number) {
      ops += 1;
      for (const p of endOf[t] as number[]) {
        matches.push({
          patternIndex: p,
          position: i - (depth[t] as number) + 1,
        });
      }
    }
  }
  matches.sort(
    (a, b) => a.position - b.position || a.patternIndex - b.patternIndex,
  );
  // 전이표 26S · 실패 링크 · 출력 링크 · 깊이 각각 S · 패턴 번호 목록 k.
  return { ops, cells: SIGMA * size + 3 * size + patterns.length, matches };
}

/* ────────────────────── 설계 B — 패턴마다 KMP 를 따로 ────────────────────── */

/**
 * 패턴 하나마다 실패 함수를 만들고 텍스트를 처음부터 다시 대조한다. 표를 한 벌만 들고
 * 있으면 되므로 저장 칸은 가장 긴 패턴의 길이다.
 */
export function perPatternKmpCounts(
  text: string,
  patterns: readonly string[],
): { ops: number; cells: number; matches: Match[] } {
  let ops = 0;
  let cells = 0;
  const matches: Match[] = [];

  for (const [index, pattern] of patterns.entries()) {
    const m = pattern.length;
    if (m === 0) continue;
    cells = Math.max(cells, m);

    const fail = new Int32Array(m);
    let k = 0;
    for (let i = 1; i < m; i++) {
      ops += 1; // 패턴 글자 읽기
      while (k > 0 && pattern[i] !== pattern[k]) {
        ops += 2; // 견주기 + 실패 함수 조회
        k = fail[k - 1] as number;
      }
      ops += 2; // 견주기 + 기록
      if (pattern[i] === pattern[k]) k += 1;
      fail[i] = k;
    }

    let j = 0;
    for (let i = 0; i < text.length; i++) {
      ops += 1; // 텍스트 글자 읽기
      while (j > 0 && text[i] !== pattern[j]) {
        ops += 2; // 견주기 + 실패 함수 조회
        j = fail[j - 1] as number;
      }
      ops += 1; // 견주기
      if (text[i] === pattern[j]) j += 1;
      if (j === m) {
        matches.push({ patternIndex: index, position: i - m + 1 });
        ops += 1;
        j = fail[j - 1] as number;
      }
    }
  }
  matches.sort(
    (a, b) => a.position - b.position || a.patternIndex - b.patternIndex,
  );
  return { ops, cells, matches };
}

/* ────────────────────────── 작업 목록 ────────────────────────── */

/** 대조에 쓰는 패턴 개수 넷. 40 이 순서가 뒤집히는 자리다. */
export const PATTERN_COUNTS = [1, 39, 40, 1000] as const;

const TEXT = makeText(TEXT_LENGTH);

const same = (a: readonly Match[], b: readonly Match[]): boolean =>
  a.length === b.length &&
  a.every(
    (x, i) =>
      x.patternIndex === (b[i] as Match).patternIndex &&
      x.position === (b[i] as Match).position,
  );

/**
 * 두 설계가 정본과 같은 답을 내는지 확인한다. 계수만 세고 답을 안 보면 「빠른데 틀린 것」이
 * 대조를 통과한다.
 */
function verify(
  patterns: string[],
  got: readonly Match[],
  design: string,
): void {
  const want = ahoCorasick(TEXT, patterns);
  if (!same(got, want)) {
    throw new Error(
      `${design} 가 정본과 다른 답을 냈다 — 매칭 ${got.length} 대 ${want.length}`,
    );
  }
}

export const cases = {
  "패턴을 한 기계로 합치기": () => {
    const out: Record<string, number> = {};
    for (const k of PATTERN_COUNTS) {
      const patterns = makePatterns(TEXT, k, PATTERN_TOTAL);
      const r = mergedCounts(TEXT, patterns);
      verify(patterns, r.matches, "패턴을 한 기계로 합치기");
      out[`패턴 ${k} 개 · 기본 연산`] = r.ops;
      if (k === 1 || k === 1000) out[`패턴 ${k} 개 · 저장 칸`] = r.cells;
    }
    return out;
  },
  "패턴마다 KMP 를 따로": () => {
    const out: Record<string, number> = {};
    for (const k of PATTERN_COUNTS) {
      const patterns = makePatterns(TEXT, k, PATTERN_TOTAL);
      const r = perPatternKmpCounts(TEXT, patterns);
      verify(patterns, r.matches, "패턴마다 KMP 를 따로");
      out[`패턴 ${k} 개 · 기본 연산`] = r.ops;
      if (k === 1 || k === 1000) out[`패턴 ${k} 개 · 저장 칸`] = r.cells;
    }
    return out;
  },
};
