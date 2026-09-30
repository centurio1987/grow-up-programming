/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 판정 칸 하나 · 컷 후보 하나를 만든 자리의 기록은 그림 사이드카의 `trace`(정본 소스에서 기계로 만든
 * 계측 사본)에서 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 * 비용은 원고 전체에서 **기본 동작 수**로 센다 — 글자 두 개를 한 번 비교하는 일과 DP 테이블 칸 하나를
 * 한 번 읽는 일이 각각 하나다(`opsOf`). 메모리는 **칸 수**로 센다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/palindromePartitioningMinCut/palindromePartitioningMinCut-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로 } from "../../../../tools/josa.ts";
import {
  big,
  candCount,
  comma,
  cutName,
  type FillOrder,
  fillByOrder,
  finalTables,
  fmt,
  headDiff,
  intervalCut,
  judgeEveryTime,
  lastOf,
  mixed,
  N,
  N_MAX,
  naiveSplit,
  noPal,
  opsOf,
  palindromicSplits,
  palName,
  piecesOf,
  piecesText,
  prefixSolves,
  q,
  SAMPLES,
  same,
  sub,
  tf,
  trace,
  WALK,
  walkSteps,
  은는,
  을를,
  이가,
} from "./palindromePartitioningMinCut-guide.fig.tsx";
import { palindromePartitioningMinCut } from "./palindromePartitioningMinCut-guide.ref.ts";

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 열 폭을 내용에서 잰 뒤 글자 표를 만든다. 첫 열은 왼쪽, 나머지는 오른쪽 정렬이다. */
function table(head: string[], rows: string[][]): string {
  const w = head.map((h, i) =>
    Math.max(width(h), ...rows.map((r) => width(r[i] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((c, i) =>
        i === 0 ? pad(c, w[0] as number) : padL(c, w[i] as number),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/** 열을 모두 왼쪽에 맞춘 글자 줄 — 칸 사이를 두 칸 띄운다. */
function lines(rows: string[][]): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const w = Array.from({ length: cols }, (_, i) =>
    Math.max(...rows.map((r) => width(r[i] ?? ""))),
  );
  return rows
    .map((r) =>
      r
        .map((c, i) => pad(c, w[i] as number))
        .join("  ")
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(head: string[], rows: string[][], right: number[] = []): string {
  const sep = head.map((_, i) => (right.includes(i) ? "---:" : "---"));
  // 칸 안의 `|`(조각 사이의 구분)는 표의 칸 경계로 읽히지 않게 `\|` 로 적는다.
  const line = (cells: string[]) =>
    `| ${cells.map((c) => c.replace(/\|/g, "\\|")).join(" | ")} |`;
  return [line(head), line(sep), ...rows.map(line)].join("\n");
}

/** 표 아래 문장까지 한 블록으로 — 닫는 마커는 본문에 있다. */
const withNote = (body: string, note: string): string => `${body}\n\n${note}`;

const call = (s: string): number => palindromePartitioningMinCut(s);

/** 배수를 소수 한 자리로 — `333.6`. */
const ratio = (a: number, b: number): string => (a / b).toFixed(1);

/** 판정 값. */
const palOf = (s: string, i: number, j: number): boolean =>
  (trace(s).pal[i] as boolean[])[j] as boolean;

/* ──────────────── 판정 DP 테이블이 주어졌을 때 컷 DP 테이블을 채우는 판 ──────────────── */

/**
 * 판정 DP 테이블 하나를 받아 정본과 같은 규칙으로 컷 DP 테이블을 채운다. 짚고 가기의 변형들이 판정
 * DP 테이블을 다르게 만든 뒤 여기로 넘긴다. `fromZero` 면 ③ 을 빼고 시작 자리를 0 부터 센다 —
 * `cut[-1]` 을 읽어 `undefined + 1 = NaN` 이 된다.
 */
function cutWith(
  pal: readonly (readonly boolean[])[],
  fromZero = false,
): { cut: number[]; answer: number } {
  const n = pal.length;
  if (n <= 1) return { cut: n === 1 ? [0] : [], answer: 0 };
  const cut = new Array<number>(n).fill(0);
  for (let e = 1; e < n; e++) {
    if (!fromZero && ((pal[0] as boolean[])[e] as boolean)) continue;
    let best = Number.POSITIVE_INFINITY;
    for (let b = fromZero ? 0 : 1; b <= e; b++) {
      if (!((pal[b] as boolean[])[e] as boolean)) continue;
      // `cut[-1]` 은 배열에 없는 자리라 `undefined` 이고, 더하면 NaN 이다 — 코드에 옮긴 그대로 둔다.
      const candidate = (cut[b - 1] as number) + 1;
      if (candidate < best) best = candidate;
    }
    cut[e] = best;
  }
  return { cut, answer: cut[n - 1] as number };
}

/** 컷 DP 테이블을 거슬러 조각을 만든다 — 같은 최소면 앞선 시작 자리. */
function splitWith(
  s: string,
  pal: readonly (readonly boolean[])[],
  cut: readonly number[],
  e: number,
): [number, number][] {
  if (e < 0) return [];
  if ((pal[0] as boolean[])[e] as boolean) return [[0, e]];
  for (let b = 1; b <= e; b++) {
    if (
      ((pal[b] as boolean[])[e] as boolean) &&
      (cut[b - 1] as number) + 1 === cut[e]
    ) {
      return [...splitWith(s, pal, cut, b - 1), [b, e]];
    }
  }
  throw new Error(`cut[${e}] 을 거슬러 갈 자리가 없다`);
}

/** 길이 2 구간도 안쪽을 판정 DP 테이블에서 읽은 판 — 안쪽이 `[i+1, i]` 라 아래쪽 삼각형의 거짓이다. */
function palWithoutLenTwoGuard(s: string): boolean[][] {
  const n = s.length;
  const pal = Array.from({ length: n }, () =>
    new Array<boolean>(n).fill(false),
  );
  for (let i = 0; i < n; i++) (pal[i] as boolean[])[i] = true;
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      (pal[i] as boolean[])[j] =
        s[i] === s[j] && ((pal[i + 1] as boolean[])[j - 1] as boolean);
    }
  }
  return pal;
}

/** 왼쪽부터 가장 긴 회문 조각을 떼는 판. 뗀 조각을 함께 돌려준다. */
function longestPieceFirst(s: string): {
  answer: number;
  pieces: [number, number][];
} {
  const n = s.length;
  if (n === 0) return { answer: 0, pieces: [] };
  const { pal } = trace(s);
  let start = 0;
  const pieces: [number, number][] = [];
  while (start < n) {
    let end = n - 1;
    while (!((pal[start] as boolean[])[end] as boolean)) end--;
    pieces.push([start, end]);
    start = end + 1;
  }
  return { answer: pieces.length - 1, pieces };
}

/** 컷 DP 테이블을 끝 자리 내림차순으로 채운 판 — 불변식 깨뜨리기의 값을 걸음으로 푸는 데 쓴다. */
function backwardSteps(s: string): {
  cut: number[];
  first: {
    e: number;
    reads: { b: number; prev: number; cand: number }[];
  } | null;
} {
  const n = s.length;
  const { pal } = trace(s);
  const cut = new Array<number>(n).fill(0);
  let first: {
    e: number;
    reads: { b: number; prev: number; cand: number }[];
  } | null = null;
  for (let e = n - 1; e >= 1; e--) {
    if ((pal[0] as boolean[])[e] as boolean) continue;
    let best = Number.POSITIVE_INFINITY;
    const reads: { b: number; prev: number; cand: number }[] = [];
    for (let b = 1; b <= e; b++) {
      if (!((pal[b] as boolean[])[e] as boolean)) continue;
      const cand = (cut[b - 1] as number) + 1;
      reads.push({ b, prev: cut[b - 1] as number, cand });
      if (cand < best) best = cand;
    }
    cut[e] = best;
    if (first === null) first = { e, reads };
  }
  return { cut, first };
}

/** 접두사를 한 글자 늘렸을 때 컷 수가 얼마나 오르내리는가. */
function cutSteps(s: string): number[] {
  const out: number[] = [];
  let prev = call(s.slice(0, 1));
  for (let e = 1; e < s.length; e++) {
    const now = call(s.slice(0, e + 1));
    out.push(now - prev);
    prev = now;
  }
  return out;
}

/** 회문 부분문자열의 개수 — 판정 DP 테이블의 참인 칸 수. 큰 입력은 칸마다 기록을 남기지 않는 사본으로 센다. */
function palindromeCount(s: string): number {
  return countTrue(s.length <= 64 ? trace(s).pal : finalTables(s).pal);
}

function countTrue(pal: readonly (readonly boolean[])[]): number {
  let count = 0;
  for (let i = 0; i < pal.length; i++)
    for (let j = i; j < pal.length; j++)
      if ((pal[i] as boolean[])[j] as boolean) count++;
  return count;
}

/** 길이 2·3 회문이 하나도 없는가 — 답이 `n − 1` 이 되는 조건의 판정식. */
function noShortPalindrome(s: string): boolean {
  for (let t = 0; t + 1 < s.length; t++) if (s[t] === s[t + 1]) return false;
  for (let t = 0; t + 2 < s.length; t++) if (s[t] === s[t + 2]) return false;
  return true;
}

/** 알파벳 `abc` 로 만든 길이 `len` 문자열 전부. */
function allStrings(len: number): string[] {
  const out: string[] = [];
  const walk = (cur: string): void => {
    if (cur.length === len) {
      out.push(cur);
      return;
    }
    for (const c of "abc") walk(cur + c);
  };
  walk("");
  return out;
}

/** 접두사 `s[0…e]` 를 회문 조각으로만 자르는 방법 전부 — 조각의 시작 자리 목록. */
function splitsOf(s: string): number[][] {
  const n = s.length;
  const valid: number[][] = [];
  const walk = (starts: number[], pos: number): void => {
    if (pos === n) {
      valid.push(starts);
      return;
    }
    for (let end = pos; end < n; end++) {
      if (palOf(s, pos, end)) walk([...starts, pos], end + 1);
    }
  };
  walk([], 0);
  valid.sort((a, b) => a.length - b.length);
  return valid;
}

/** 시작 자리 목록이 만드는 조각. */
const piecesFromStarts = (s: string, d: readonly number[]): string =>
  d
    .map((b, k) =>
      q(s.slice(b, k + 1 < d.length ? (d[k + 1] as number) : s.length)),
    )
    .join(" | ");

// 조건과 실제 답이 어긋나면 `deep.math` 의 유도가 거짓이다. 실행이 그것을 판정한다.
for (const cur of allStrings(7)) {
  if (noShortPalindrome(cur) !== (call(cur) === cur.length - 1)) {
    throw new Error(`답이 n − 1 이 되는 조건이 실제와 어긋난다 — "${cur}"`);
  }
}

// 회문 개수의 상·하한이 어긋나면 그 유도도 거짓이다.
for (let n = 1; n <= 40; n++) {
  const hi = (n * (n + 1)) / 2;
  if (palindromeCount(same(n)) !== hi || palindromeCount(noPal(n)) !== n) {
    throw new Error(`회문 개수의 상·하한이 실측과 어긋난다 — n = ${n}`);
  }
}

// 「글자가 다 같으면 모든 분할이 회문 분할」과 「회문이 없으면 회문 분할이 하나」도 실측으로 못 박는다.
// 이 둘이 서면 큰 `n` 의 값을 `2^(n−1)` 로 적을 수 있다.
for (let n = 1; n <= 30; n++) {
  if (palindromicSplits(same(n)) !== 2n ** BigInt(n - 1)) {
    throw new Error(
      `글자가 다 같을 때의 회문 분할 수가 2^(n−1) 이 아니다 — n = ${n}`,
    );
  }
  if (palindromicSplits(noPal(n)) !== 1n) {
    throw new Error(`회문이 없을 때의 회문 분할 수가 1 이 아니다 — n = ${n}`);
  }
}

/** 기본 동작 수의 닫힌 형태 — 아래 끝(글자가 다 같다)과 위 끝(첫 글자만 다르다). */
const opsLow = (n: number): number => (n <= 1 ? 0 : n * n - n + 1);
const opsHigh = (n: number): number => (n <= 1 ? 0 : 2 * n * n - 2 * n + 1);

// 닫힌 형태가 실측과 어긋나면 「닫았다」가 거짓이다. 알파벳 3 종 전수로 판정한다.
for (let n = 2; n <= 7; n++) {
  const all = allStrings(n).map((x) => opsOf(x).total);
  if (Math.min(...all) !== opsLow(n) || Math.max(...all) !== opsHigh(n)) {
    throw new Error(`기본 동작 수의 닫힌 형태가 전수와 어긋난다 — n = ${n}`);
  }
  if (
    opsOf(same(n)).total !== opsLow(n) ||
    opsOf(headDiff(n)).total !== opsHigh(n)
  ) {
    throw new Error(`기본 동작 수의 등호 입력이 어긋난다 — n = ${n}`);
  }
}

// 가장 먼저 떠오르는 재귀와 물을 때마다 대조하는 판이 정본과 같은 답을 내는가.
for (const s of [...SAMPLES, "abba", "racecar", mixed(12), same(9)]) {
  if (
    naiveSplit(s).answer !== call(s) ||
    judgeEveryTime(s).answer !== call(s)
  ) {
    throw new Error(`비교하는 판이 정본과 다른 답을 냈다 — "${s}"`);
  }
}

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 불변식의 「읽는 칸이 이미 정해져 있다」를 지키던 줄 — 컷 DP 테이블을 끝 자리 오름차순으로 도는
 * 반복문 — 을 내림차순으로 바꾼 사본. 정본 소스에서 기계로 만든다.
 * 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const 뒤에서부터채우기 = await loadMutant<{
  palindromePartitioningMinCut(s: string): number;
}>(
  new URL("./palindromePartitioningMinCut-guide.ref.ts", import.meta.url)
    .pathname,
  {
    swap: [
      /for \(let e = 1; e < n; e\+\+\) \{/,
      "for (let e = n - 1; e >= 1; e--) {",
    ],
  },
);

const 변이표 = [WALK, "aab", "abcde", "abcbm", "aaaaa", "a"];

/** 중화 실행이면 변이 모듈의 함수가 정본과 같은 객체다 — 그때는 「달라진다」 자기검사를 건너뛴다. */
const 중화 =
  뒤에서부터채우기.palindromePartitioningMinCut ===
  palindromePartitioningMinCut;

if (!중화) {
  // 하나도 안 달라지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
  if (
    변이표.every(
      (s) => call(s) === 뒤에서부터채우기.palindromePartitioningMinCut(s),
    )
  ) {
    throw new Error(
      "뒤에서부터 채우는 변이가 어느 입력에서도 답을 바꾸지 못했다 — 「달라진다」가 거짓이다",
    );
  }
  // 변이가 답을 그대로 두는 입력이 실제로 있다는 것도 본문의 주장이다.
  if (
    변이표.every(
      (s) => call(s) !== 뒤에서부터채우기.palindromePartitioningMinCut(s),
    )
  ) {
    throw new Error(
      "변이가 모든 입력에서 답을 바꿨다 — 「안 갈린다」가 거짓이다",
    );
  }
  // 걸음으로 푼 판이 변이와 같은 답을 내는가 — 본문이 그 판으로 변이의 걸음을 보인다.
  for (const s of 변이표.filter((x) => x.length > 1)) {
    if (
      backwardSteps(s).cut[s.length - 1] !==
      뒤에서부터채우기.palindromePartitioningMinCut(s)
    ) {
      throw new Error(`뒤에서부터 채운 판이 변이와 다르다 — "${s}"`);
    }
  }
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /* ── 전체 컨셉 ── */

  "concept-splits": () => {
    const s = "aab";
    const n = s.length;
    const rows: string[][] = [];
    let valid = 0;
    let bestCuts = Number.POSITIVE_INFINITY;
    let bestText = "";
    for (let mask = 0; mask < 2 ** (n - 1); mask++) {
      const pieces: [number, number][] = [];
      let start = 0;
      for (let t = 0; t < n - 1; t++) {
        if (mask & (1 << t)) {
          pieces.push([start, t]);
          start = t + 1;
        }
      }
      pieces.push([start, n - 1]);
      const bad = pieces.filter(([a, b]) => !palOf(s, a, b));
      const text = pieces.map(([a, b]) => sub(s, a, b)).join(" | ");
      if (bad.length === 0) {
        valid++;
        if (pieces.length - 1 < bestCuts) {
          bestCuts = pieces.length - 1;
          bestText = text;
        }
      }
      rows.push([
        text,
        String(pieces.length - 1),
        bad.length === 0
          ? "없음"
          : bad.map(([a, b]) => sub(s, a, b)).join(" · "),
      ]);
    }
    rows.sort((a, b) => Number(a[1]) - Number(b[1]));
    return withNote(
      md(["조각", "컷 수", "회문이 아닌 조각"], rows, [1]),
      `자르는 방법 ${rows.length} 가지 가운데 조각이 전부 회문인 것은 ${valid} 가지이고, 그중 컷이 가장 적은 ${bestText} 의 ${bestCuts} 회가 답입니다. 정본 palindromePartitioningMinCut(${q(s)}) 도 ${call(s)}${을를(call(s))} 냅니다.`,
    );
  },

  "concept-size": () =>
    table(
      [
        "글자 수 n",
        "자르는 방법 2^(n−1)",
        "판정 DP 테이블 칸 n(n+1)/2",
        "컷 DP 테이블 칸 n",
      ],
      [N, N_MAX].map((n) => [
        comma(n),
        big(2n ** BigInt(n - 1)),
        comma((n * (n + 1)) / 2),
        comma(n),
      ]),
    ),

  /* ── 아이디어를 떠올리는 과정 ── */

  "origin-naive": () => {
    const ns = [2, 4, 8, 12, 16];
    const rows = ns.map((n) => [
      comma(n),
      comma(palindromicSplits(same(n))),
      comma(naiveSplit(same(n)).ops),
      comma(naiveSplit(noPal(n)).ops),
      comma(opsOf(same(n)).total),
    ]);
    const top = opsOf(same(N_MAX)).total;
    const splits = 2n ** BigInt(N_MAX - 1);
    rows.push([
      comma(N_MAX),
      big(splits),
      "세지 못했다",
      "세지 못했다",
      comma(top),
    ]);
    const last = ns.at(-1) as number;
    return withNote(
      md(
        [
          "글자 수",
          "회문 분할 수 · 같은 글자",
          "재귀의 기본 동작 · 같은 글자",
          "재귀의 기본 동작 · 회문 없음",
          "두 DP 테이블의 기본 동작 · 같은 글자",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      `글자 ${last} 개까지는 재귀를 실제로 실행해 세었습니다. 글자가 다 같은 ${comma(N_MAX)} 글자에서 조각이 전부 회문인 분할은 ${String(splits).length} 자리 수이고, 두 DP 테이블의 기본 동작은 ${comma(top)} 번입니다.`,
    );
  },

  "origin-branches": () => {
    const { branches } = prefixSolves(WALK);
    const seen = new Set<number>();
    const rows: string[][] = [];
    let lastE = -2;
    for (const x of branches) {
      const piece = sub(WALK, x.b, x.e);
      const rest = x.rest >= 0 ? `앞부분은 끝 자리 ${x.rest}` : "앞부분이 없다";
      const again =
        x.rest >= 0 && seen.has(x.rest)
          ? `← 끝 자리 ${x.rest}${을를(x.rest)} 또 푼다`
          : "";
      if (x.rest >= 0) seen.add(x.rest);
      rows.push([
        x.e === lastE ? "" : `끝 자리 ${x.e} 에서`,
        `조각 ${piece}${을를(piece)} 뗀다`,
        "→",
        rest,
        again,
      ]);
      lastE = x.e;
    }
    return [
      `${q(WALK)} 에서 마지막 조각을 고르는 갈래 — 회문인 조각만 뗄 수 있다`,
      "",
      lines(rows)
        .split("\n")
        .map((l) => `  ${l}`)
        .join("\n"),
    ].join("\n");
  },

  "origin-repeat": () => {
    const a = prefixSolves(WALK).hit;
    const z = prefixSolves(same(N)).hit;
    const rows: string[][] = [
      ["빈 접두사", comma(a[0] as number), comma(z[0] as number), "1"],
    ];
    for (let e = 0; e < N; e++) {
      rows.push([
        `e=${e} ${sub(WALK, 0, e)}`,
        comma(a[e + 1] as number),
        comma(z[e + 1] as number),
        "1",
      ]);
    }
    const sum = (x: number[]): number => x.reduce((p, r) => p + r, 0);
    rows.push(["합계", comma(sum(a)), comma(sum(z)), comma(N + 1)]);
    return withNote(
      md(
        [
          "접두사",
          `${q(WALK)} 에서 푼 횟수`,
          `${q(same(N))} 에서 푼 횟수`,
          "끝 자리마다 한 번",
        ],
        rows,
        [1, 2, 3],
      ),
      `끝 자리 0 의 접두사를 ${q(WALK)} 에서 ${a[1]} 번, ${q(same(N))} 에서 ${z[1]} 번 풉니다. 끝 자리마다 한 번만 정하면 빈 접두사까지 ${N + 1} 번입니다.`,
    );
  },

  "origin-judge": () => {
    const ns = [8, 32, 128, 512, N_MAX];
    const rows = ns.map((n) => [
      comma(n),
      comma(opsOf(same(n)).total),
      comma(judgeEveryTime(same(n)).ops),
      comma(opsOf(mixed(n)).total),
      comma(judgeEveryTime(mixed(n)).ops),
    ]);
    const a = judgeEveryTime(same(N_MAX)).ops;
    const b = opsOf(same(N_MAX)).total;
    const c = judgeEveryTime(mixed(N_MAX)).ops;
    const d = opsOf(mixed(N_MAX)).total;
    return withNote(
      md(
        [
          "글자 수",
          "두 DP 테이블 · 같은 글자",
          "물을 때마다 대조 · 같은 글자",
          "두 DP 테이블 · 26 글자 섞기",
          "물을 때마다 대조 · 26 글자 섞기",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      `글자가 다 같은 ${comma(N_MAX)} 글자에서 물을 때마다 대조하는 판은 두 DP 테이블의 ${ratio(a, b)} 배입니다. 26 글자를 섞은 ${comma(N_MAX)} 글자에서는 ${ratio(c, d)} 배라 ${c < d ? "오히려 적습니다" : "더 많습니다"}.`,
    );
  },

  "origin-fill-order": () => {
    const inputs = SAMPLES.slice(0, 5);
    const orders: [string, FillOrder][] = [
      ["길이가 짧은 구간부터", "len"],
      ["i 를 0 부터 · j 를 i 부터", "rowAsc"],
    ];
    const rows = orders.map(([name, order]) => [
      name,
      ...inputs.map((s) => comma(fillByOrder(s, order).answer)),
    ]);
    const bigger = inputs.filter(
      (s) => fillByOrder(s, "rowAsc").answer > call(s),
    ).length;
    const smaller = inputs.filter(
      (s) => fillByOrder(s, "rowAsc").answer < call(s),
    ).length;
    if (smaller !== 0) throw new Error("줄 차례가 최소보다 작은 답을 냈다");
    return withNote(
      md(["채우는 차례", ...inputs.map(q)], rows, [1, 2, 3, 4, 5]),
      `i 를 0 부터 채운 판은 입력 ${inputs.length} 개 가운데 ${bigger} 개에서 최소보다 큰 값을 냈고, 최소보다 작은 값을 낸 입력은 ${smaller} 개입니다.`,
    );
  },

  "origin-fill-why": () => {
    const s = "noonracecar";
    const i = 0;
    const j = 3;
    const row = fillByOrder(s, "rowAsc");
    const len = fillByOrder(s, "len");
    return [
      `${q(s)} 의 ${palName(i, j)} ${sub(s, i, j)}${이가(sub(s, i, j))} 읽는 안쪽 칸 ${palName(i + 1, j - 1)} ${sub(s, i + 1, j - 1)}`,
      "",
      table(
        ["채우는 차례", `읽을 때 ${palName(i + 1, j - 1)}`, palName(i, j)],
        [
          [
            "i 를 0 부터 채우면",
            tf(row.innerAt.get(`${i},${j}`) as boolean),
            tf((row.pal[i] as boolean[])[j] as boolean),
          ],
          [
            "길이가 짧은 쪽부터",
            tf(len.innerAt.get(`${i},${j}`) as boolean),
            tf((len.pal[i] as boolean[])[j] as boolean),
          ],
        ],
      ),
      `  └ ${palName(i + 1, j - 1)}${은는(palName(i + 1, j - 1))} ${palName(i, j)} 보다 아래 줄이라 줄 차례로는 나중에 정해진다`,
    ].join("\n");
  },

  /* ── 아이디어 상세 — 판정 DP 테이블 ── */

  "build-pal-cells": () => {
    const rows: string[][] = [];
    let ok = 0;
    for (let len = 1; len <= N; len++)
      for (let i = 0; i + len - 1 < N; i++) {
        const j = i + len - 1;
        const piece = WALK.slice(i, j + 1);
        const rev = [...piece].reverse().join("");
        const v = palOf(WALK, i, j);
        if (v === (rev === piece)) ok++;
        rows.push([palName(i, j), `[${i},${j}]`, q(piece), q(rev), tf(v)]);
      }
    return withNote(
      md(["칸", "구간", "부분 문자열", "뒤집은 문자열", "칸의 값"], rows),
      `${rows.length} 칸 가운데 ${ok} 칸에서 칸의 값과, 부분 문자열을 뒤집어 비교한 결과가 같습니다.`,
    );
  },

  "build-pal-read-one": () => {
    const cells: [number, number][] = [
      [1, N - 1],
      [0, 2],
      [0, 3],
    ];
    const t = trace(WALK);
    const rows = cells.map(([i, j]) => [
      palName(i, j),
      `[${i},${j}]`,
      sub(WALK, i, j),
      `'${WALK[i]}' ${WALK[i] === WALK[j] ? "=" : "≠"} '${WALK[j]}'`,
      j - i + 1 > 2
        ? `${palName(i + 1, j - 1)} = ${tf((t.pal[i + 1] as boolean[])[j - 1] as boolean)}`
        : "없음",
      tf((t.pal[i] as boolean[])[j] as boolean),
    ]);
    const [fi, fj] = cells[2] as [number, number];
    return withNote(
      md(["칸", "구간", "부분 문자열", "양 끝", "안쪽 칸", "값"], rows),
      `${palName(fi, fj)}${은는(palName(fi, fj))} 양 끝이 '${WALK[fi]}' 로 같은데 안쪽 ${palName(fi + 1, fj - 1)}${이가(palName(fi + 1, fj - 1))} ${tf((t.pal[fi + 1] as boolean[])[fj - 1] as boolean)} 라 ${tf((t.pal[fi] as boolean[])[fj] as boolean)} 입니다.`,
    );
  },

  "build-pal-diagonal-count": () => {
    const rows: string[][] = [];
    let total = 0;
    for (let len = 1; len <= N; len++) {
      const cells: string[] = [];
      let trues = 0;
      for (let i = 0; i + len - 1 < N; i++) {
        cells.push(palName(i, i + len - 1));
        if (palOf(WALK, i, i + len - 1)) trues++;
      }
      total += cells.length;
      rows.push([
        `len = ${len}`,
        String(cells.length),
        String(trues),
        cells.join(" · "),
      ]);
    }
    rows.push([
      "합계",
      String(total),
      String(countTrue(trace(WALK).pal)),
      `n(n+1)/2 = ${(N * (N + 1)) / 2}`,
    ]);
    return table(["구간 길이", "칸 수 n−len+1", "참인 칸", "칸"], rows);
  },

  "build-pal-contrast": () => {
    const bad = fillByOrder(WALK, "rowAsc").pal;
    const rows: string[][] = [];
    let wrongToFalse = 0;
    for (let i = 0; i < N; i++)
      for (let j = i; j < N; j++) {
        const good = palOf(WALK, i, j);
        const b = (bad[i] as boolean[])[j] as boolean;
        if (good !== b) {
          rows.push([palName(i, j), sub(WALK, i, j), tf(good), tf(b)]);
          if (good && !b) wrongToFalse++;
        }
      }
    const cells = (N * (N + 1)) / 2;
    return withNote(
      md(["칸", "부분 문자열", "구간 길이 차례", "i 를 0 부터 채운 판"], rows),
      `쓰는 칸 ${cells} 개 가운데 ${rows.length} 칸의 값이 서로 다르고, 그 ${rows.length} 칸 가운데 ${wrongToFalse} 칸은 참이어야 할 칸이 거짓으로 적혔습니다.`,
    );
  },

  "build-pal-why": () => {
    const inputs = [WALK, noPal(N), same(N)];
    const rows = inputs.map((s) => {
      const t = trace(s);
      const read = new Set<string>();
      for (const r of t.cutRecs) {
        read.add(`0,${r.e}`);
        if (r.kind !== "whole") read.add(`${r.b},${r.e}`);
      }
      const unread: string[] = [];
      for (let i = 0; i < N; i++)
        for (let j = i; j < N; j++)
          if (!read.has(`${i},${j}`)) unread.push(palName(i, j));
      return [
        q(s),
        String(read.size),
        String((N * (N + 1)) / 2),
        unread.join(" · "),
      ];
    });
    const np = rows[1] as string[];
    return withNote(
      md(
        [
          "입력",
          "컷 DP 테이블이 읽은 판정 칸",
          "판정 DP 테이블의 칸",
          "안 읽은 칸",
        ],
        rows,
        [1, 2],
      ),
      `회문이 없는 ${np[0]} 에서는 판정 칸 ${np[2]} 개 가운데 ${np[1]} 개를 읽었고, 안 읽은 칸은 ${np[3]} 입니다.`,
    );
  },

  /* ── 아이디어 상세 — 컷 DP 테이블 ── */

  "build-cut-read-one": () => {
    const t = trace(WALK);
    const es = [1, 3, 4];
    const rows = es.map((e) => {
      const ps = piecesOf(WALK, e);
      return [
        cutName(e),
        sub(WALK, 0, e),
        piecesText(WALK, ps),
        String(ps.length),
        String(t.cut[e]),
      ];
    });
    const vals = new Set(es.map((e) => t.cut[e]));
    const v = [...vals][0] as number;
    if (vals.size !== 1) throw new Error("세 칸의 값이 같지 않다");
    return withNote(
      md(["칸", "접두사", "고른 조각", "조각 수", "값"], rows, [3, 4]),
      `세 칸의 값이 모두 ${v} 이지만 맡은 접두사가 다르고, 그 값을 낸 조각도 다릅니다.`,
    );
  },

  "build-cut-reads": () => {
    const t = trace(WALK);
    const rows: string[][] = [];
    let allBefore = true;
    let reads = 0;
    for (let e = 1; e < N; e++) {
      if (palOf(WALK, 0, e)) {
        rows.push([
          `e=${e}`,
          `접두사 전체 ${sub(WALK, 0, e)}`,
          "없음",
          String(t.cut[e]),
        ]);
        continue;
      }
      const bs: number[] = [];
      for (let b = 1; b <= e; b++) if (palOf(WALK, b, e)) bs.push(b);
      for (const b of bs) {
        reads++;
        if (!(b - 1 < e)) allBefore = false;
      }
      rows.push([
        `e=${e}`,
        bs.map((b) => sub(WALK, b, e)).join(" · "),
        bs.map((b) => cutName(b - 1)).join(" · "),
        String(t.cut[e]),
      ]);
    }
    if (!allBefore) throw new Error("앞보다 뒤의 컷 칸을 읽었다");
    return withNote(
      md(["끝 자리", "회문인 마지막 조각", "읽는 컷 칸", "cut[e]"], rows, [3]),
      `읽은 컷 칸 ${reads} 개가 전부 그 끝 자리보다 앞 칸입니다.`,
    );
  },

  "build-cut-interval": () => {
    const t = trace(WALK);
    const { M, cands } = intervalCut(WALK);
    const rows = Array.from({ length: N }, (_, e) => [
      `e=${e}`,
      sub(WALK, 0, e),
      String((M[0] as number[])[e]),
      String(t.cut[e]),
    ]);
    const same_ = rows.filter((r) => r[2] === r[3]).length;
    const n = N_MAX;
    return withNote(
      md(
        ["끝 자리", "접두사", "2 차원 표의 첫 줄", "컷 DP 테이블"],
        rows,
        [2, 3],
      ),
      `${N} 칸 가운데 ${same_} 칸에서 두 값이 같습니다. 2 차원 표는 칸 ${(N * (N + 1)) / 2} 개를 채우며 후보 ${cands} 개를 만들었고, 컷 DP 테이블은 칸 ${N} 개를 채우며 후보 ${candCount(WALK)} 개를 비교했습니다. 글자 ${comma(n)} 개면 2 차원 표의 후보가 많아야 (n³ − n)/6 = ${comma((n ** 3 - n) / 6)} 개이고, 컷 DP 테이블의 후보는 많아야 n(n − 1)/2 = ${comma((n * (n - 1)) / 2)} 개입니다.`,
    );
  },

  /* ── 아이디어 상세 — 단계 ── */

  "build-size": () => {
    const t = trace(WALK);
    const rows = [N, N_MAX].map((n) => [
      comma(n),
      `${comma(n)} × ${comma(n)} = ${comma(n * n)}`,
      comma((n * (n + 1)) / 2),
      comma(n),
      comma(n),
    ]);
    return withNote(
      md(
        [
          "글자 수 n",
          "판정 DP 테이블이 잡는 칸 n²",
          "쓰는 칸 n(n+1)/2",
          "대각선 칸 n",
          "컷 DP 테이블 칸 n",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `전개 입력에서 정본이 만든 판정 DP 테이블은 ${t.pal.length} 줄 × ${(t.pal[0] as boolean[]).length} 칸이고, 그중 쓰는 칸이 ${(N * (N + 1)) / 2} 개입니다. 컷 DP 테이블은 칸 ${t.cut.length} 개입니다. 글자 ${comma(N_MAX)} 개에서 칸 하나를 8 바이트로 잡아도 판정 DP 테이블은 ${comma(N_MAX * N_MAX * 8)} 바이트입니다.`,
    );
  },

  "build-pal-cases": () => {
    const t = trace(WALK);
    type Case = [string, (i: number, j: number) => boolean];
    const cases: Case[] = [
      ["길이 1", (i, j) => i === j],
      ["길이 2 · 양 끝이 같다", (i, j) => j - i === 1 && WALK[i] === WALK[j]],
      ["길이 2 · 양 끝이 다르다", (i, j) => j - i === 1 && WALK[i] !== WALK[j]],
      [
        "길이 3 이상 · 양 끝이 같고 안쪽이 T",
        (i, j) =>
          j - i >= 2 && WALK[i] === WALK[j] && palOf(WALK, i + 1, j - 1),
      ],
      [
        "길이 3 이상 · 양 끝이 같고 안쪽이 F",
        (i, j) =>
          j - i >= 2 && WALK[i] === WALK[j] && !palOf(WALK, i + 1, j - 1),
      ],
      [
        "길이 3 이상 · 양 끝이 다르다",
        (i, j) => j - i >= 2 && WALK[i] !== WALK[j],
      ],
    ];
    const rows = cases.map(([name, ok]) => {
      for (let len = 1; len <= N; len++)
        for (let i = 0; i + len - 1 < N; i++) {
          const j = i + len - 1;
          if (!ok(i, j)) continue;
          return [
            name,
            palName(i, j),
            sub(WALK, i, j),
            len === 1
              ? "—"
              : `'${WALK[i]}' ${WALK[i] === WALK[j] ? "=" : "≠"} '${WALK[j]}'`,
            len <= 2
              ? "읽지 않는다"
              : `${palName(i + 1, j - 1)} = ${tf((t.pal[i + 1] as boolean[])[j - 1] as boolean)}`,
            tf((t.pal[i] as boolean[])[j] as boolean),
          ];
        }
      throw new Error(`전개 입력에 「${name}」 칸이 없다`);
    });
    return withNote(
      md(["갈래", "칸", "부분 문자열", "양 끝", "안쪽 칸", "값"], rows),
      `갈래 ${rows.length} 가지가 모두 전개 입력 ${q(WALK)} 안에 있습니다.`,
    );
  },

  "build-pal-fill-order": () => {
    const t = trace(WALK);
    const at = new Map<string, number>();
    t.palRecs.forEach((r, x) => {
      at.set(`${r.i},${r.j}`, x + 1);
    });
    let reads = 0;
    let ready = 0;
    const rows = t.palRecs.map((r, x) => {
      let read = "읽지 않는다";
      if (r.len > 2) {
        reads++;
        const key = `${r.i + 1},${r.j - 1}`;
        const when =
          r.i + 1 === r.j - 1 ? 0 : (at.get(key) ?? Number.POSITIVE_INFINITY);
        if (when < x + 1) ready++;
        read = `${palName(r.i + 1, r.j - 1)} (${when === 0 ? "대각선" : `${when} 번째`})`;
      }
      return [`${x + 1} 번째`, palName(r.i, r.j), String(r.len), read];
    });
    return withNote(
      md(
        ["정한 차례", "칸", "길이", "읽은 안쪽 칸 (그 칸을 정한 차례)"],
        rows,
        [2],
      ),
      `안쪽 칸을 읽은 칸 ${reads} 개 가운데 ${ready} 개가 읽을 때 그 안쪽 칸이 이미 정해져 있었습니다.`,
    );
  },

  "build-cut-candidates": () => {
    const t = trace(WALK);
    const e = N - 1;
    const rows: string[][] = [
      [
        "b = 0",
        `${sub(WALK, 0, e)} (접두사 전체)`,
        tf(palOf(WALK, 0, e)),
        "없음",
        "—",
        palOf(WALK, 0, e) ? "0 (③)" : "—",
      ],
    ];
    const cands: { b: number; v: number }[] = [];
    for (let b = 1; b <= e; b++) {
      const ok = palOf(WALK, b, e);
      const v = (t.cut[b - 1] as number) + 1;
      if (ok) cands.push({ b, v });
      rows.push([
        `b = ${b}`,
        sub(WALK, b, e),
        tf(ok),
        sub(WALK, 0, b - 1),
        ok ? `${cutName(b - 1)} = ${t.cut[b - 1]}` : "—",
        ok ? String(v) : "—",
      ]);
    }
    const best = cands.reduce((a, c) => (c.v < a.v ? c : a));
    return withNote(
      md(
        [
          "시작 자리",
          "마지막 조각",
          `pal[b][${e}]`,
          "앞부분",
          "읽는 컷 칸",
          "후보",
        ],
        rows,
        [5],
      ),
      `후보는 ${cands.length} 개이고, 가장 작은 후보는 b = ${best.b} 의 ${best.v} 입니다. ${cutName(e)} = ${t.cut[e]} 입니다.`,
    );
  },

  "build-cut-order": () => {
    const t = trace(WALK);
    let reads = 0;
    let ready = 0;
    const rows: string[][] = [];
    for (let e = 1; e < N; e++) {
      const mine = t.cutRecs.filter((r) => r.e === e);
      if (mine[0]?.kind === "whole") {
        rows.push([`${e} 번째`, cutName(e), "없음 (접두사 전체가 회문)"]);
        continue;
      }
      const got = mine
        .filter(
          (r): r is Extract<typeof r, { kind: "cand" }> => r.kind === "cand",
        )
        .map((r) => {
          reads++;
          const when = r.b - 1;
          if (when < e) ready++;
          return `${cutName(r.b - 1)} (${when === 0 ? "깔 때" : `${when} 번째`})`;
        });
      rows.push([`${e} 번째`, cutName(e), got.join(" · ")]);
    }
    return withNote(
      md(["정한 차례", "칸", "읽은 컷 칸 (그 칸을 정한 차례)"], rows),
      `읽은 컷 칸 ${reads} 개 가운데 ${ready} 개가 지금 칸보다 먼저 정해져 있었습니다.`,
    );
  },

  "build-answer": () => {
    const t = trace(WALK);
    const rows = Array.from({ length: N }, (_, e) => {
      const p = WALK.slice(0, e + 1);
      return [
        cutName(e),
        String(t.cut[e]),
        `palindromePartitioningMinCut(${q(p)})`,
        String(call(p)),
      ];
    });
    const ok = rows.filter((r) => r[1] === r[3]).length;
    return withNote(
      md(["칸", "칸의 값", "그 접두사만 따로 호출", "반환값"], rows, [1, 3]),
      `${N} 칸 가운데 ${ok} 칸에서 칸의 값과, 그 접두사만 넘긴 호출의 답이 같습니다.`,
    );
  },

  "build-premise": () => {
    const t = trace(WALK);
    const all = splitsOf(WALK);
    const groups = new Map<number, number[][]>();
    for (const d of all) {
      const b = d.at(-1) as number;
      groups.set(b, [...(groups.get(b) ?? []), d]);
    }
    const rows: string[][] = [];
    let ok = 0;
    for (const b of [...groups.keys()].sort((x, y) => x - y)) {
      const ds = groups.get(b) as number[][];
      const least = Math.min(...ds.map((d) => d.length - 1));
      const viaCut = b === 0 ? 0 : (t.cut[b - 1] as number) + 1;
      if (least === viaCut) ok++;
      rows.push([
        `b = ${b}`,
        ds.map((d) => piecesFromStarts(WALK, d)).join(" · "),
        ds.map((d) => String(d.length - 1)).join(" · "),
        b === 0 ? "0 (앞부분 없음)" : `${cutName(b - 1)} + 1 = ${viaCut}`,
      ]);
    }
    return withNote(
      md(
        [
          "마지막 조각의 시작 자리",
          "그 무리의 분할",
          "컷 수",
          "앞부분의 최소 + 1",
        ],
        rows,
      ),
      `분할 ${all.length} 가지는 무리 ${groups.size} 개 중 꼭 하나에 들고, 무리 ${groups.size} 개 가운데 ${ok} 개에서 무리 안의 가장 적은 컷 수가 오른쪽 열의 값과 같습니다.`,
    );
  },

  "build-orders": () => {
    const inputs = [WALK, "noonracecar", "abacdc"];
    const orders: [string, FillOrder][] = [
      ["구간 길이가 짧은 칸부터", "len"],
      ["i 를 n−1 부터 · j 를 i 부터", "rowDesc"],
      ["j 를 1 부터 · i 를 j−1 부터 거꾸로", "colAsc"],
      ["i 를 0 부터 · j 를 i 부터", "rowAsc"],
    ];
    const rows = orders.map(([name, order]) => {
      const r = fillByOrder(WALK, order).reads;
      return [
        name,
        ...inputs.map((s) => comma(fillByOrder(s, order).answer)),
        `${r.ready} / ${r.total}`,
      ];
    });
    const good = orders.filter(([, o]) => {
      const r = fillByOrder(WALK, o).reads;
      return (
        r.ready === r.total &&
        inputs.every((s) => fillByOrder(s, o).answer === call(s))
      );
    }).length;
    return withNote(
      md(
        [
          "채우는 차례",
          ...inputs.map(q),
          `읽을 때 정해져 있던 안쪽 칸 (${q(WALK)})`,
        ],
        rows,
        [1, 2, 3, 4],
      ),
      `차례 ${orders.length} 가지 가운데 ${good} 가지는 안쪽 칸이 늘 먼저 정해져 있고, 세 입력의 답도 정본과 같습니다.`,
    );
  },

  /* ── 수행으로 알아보는 알고리즘 ── */

  "walk-input": () => {
    const ps = piecesOf(WALK, N - 1);
    return `const s = ${q(WALK)};\n// 이 절이 끝나면 ${call(WALK)} 이 나와야 한다 — ${piecesText(WALK, ps)}`;
  },

  "walk-input-why": () => {
    const t = trace(WALK);
    const lens = new Set<number>();
    for (let i = 0; i < N; i++)
      for (let j = i; j < N; j++) if (palOf(WALK, i, j)) lens.add(j - i + 1);
    const wholes: string[] = [];
    for (let e = 0; e < N; e++)
      if (palOf(WALK, 0, e)) wholes.push(sub(WALK, 0, e));
    const candsOf = (e: number) =>
      t.cutRecs
        .filter(
          (r): r is Extract<typeof r, { kind: "cand" }> =>
            r.kind === "cand" && r.e === e,
        )
        .map((r) => r.candidate);
    const c3 = candsOf(3);
    const c4 = candsOf(4);
    const lowered = (c3.at(-1) as number) < Math.min(...c3.slice(0, -1));
    const unchanged = (c4.at(-1) as number) > Math.min(...c4.slice(0, -1));
    if (!lowered || !unchanged)
      throw new Error("전개 입력을 고른 까닭이 실행과 어긋난다");
    return withNote(
      md(
        ["자리", "값"],
        [
          ["회문인 구간의 길이", [...lens].sort((a, b) => a - b).join(" · ")],
          ["통째로 회문인 접두사", wholes.join(" · ")],
          [`${cutName(3)} 의 후보`, c3.join(" · ")],
          [`${cutName(4)} 의 후보`, c4.join(" · ")],
        ],
      ),
      `${cutName(3)} 에서는 마지막 후보 ${c3.at(-1)}${이가(c3.at(-1) as number)} 앞 후보보다 작아 최소를 낮추고, ${cutName(4)} 에서는 마지막 후보 ${c4.at(-1)}${이가(c4.at(-1) as number)} 앞 후보보다 커서 최소를 못 바꿉니다.`,
    );
  },

  "walk-init": () => {
    const head = ["", ...Array.from({ length: N }, (_, j) => `j=${j}`)];
    const rows = Array.from({ length: N }, (_, i) => [
      `i=${i}  ${WALK[i]}`,
      ...Array.from({ length: N }, (_, j) =>
        j < i ? "-" : j === i ? "T" : ".",
      ),
    ]);
    const callRow = (s: string, why: string) => [
      `palindromePartitioningMinCut(${q(s)})`,
      "→",
      String(call(s)),
      why,
    ];
    return [
      table(head, rows),
      "        -  = i > j 라 구간이 아니다",
      "        .  = 아직 안 정했다 (거짓으로 깔려 있다)",
      "",
      lines([
        callRow("", "글자 0 개 — ① 이 바로 돌려준다"),
        callRow("a", "글자 1 개 — ① 이 바로 돌려준다"),
      ]),
    ].join("\n");
  },

  "walk-pal-order": () => {
    const rows: string[] = [];
    for (let len = 2; len <= N; len++) {
      const cells: string[] = [];
      for (let i = 0; i + len - 1 < N; i++) cells.push(palName(i, i + len - 1));
      rows.push(`len = ${len}   ${cells.join(" → ")}`);
    }
    return [
      ...rows,
      "  └ 길이 len 인 칸을 다 정한 뒤에 길이 len+1 로 간다",
    ].join("\n");
  },

  "pause-inner": () => {
    const rows = SAMPLES.map((s) => [
      q(s),
      comma(call(s)),
      comma(cutWith(palWithoutLenTwoGuard(s)).answer),
    ]);
    const same_ = rows.filter((r) => r[1] === r[2]).length;
    return withNote(
      md(
        ["입력", "바른 코드", "길이 2 도 안쪽을 판정 DP 테이블에서 읽은 코드"],
        rows,
        [1, 2],
      ),
      `${rows.length} 입력 가운데 ${same_} 입력에서 두 값이 같습니다.`,
    );
  },

  "pause-inner-walk": () => {
    const s = "noonracecar";
    const good = trace(s).pal;
    const bad = palWithoutLenTwoGuard(s);
    const lost: string[][] = [];
    for (let len = 2; len <= s.length; len++)
      for (let i = 0; i + len - 1 < s.length; i++) {
        const j = i + len - 1;
        if (
          ((good[i] as boolean[])[j] as boolean) &&
          !((bad[i] as boolean[])[j] as boolean)
        ) {
          lost.push([sub(s, i, j), `길이 ${len}`]);
        }
      }
    const kept: string[] = [];
    for (let len = 3; len <= s.length; len++)
      for (let i = 0; i + len - 1 < s.length; i++) {
        const j = i + len - 1;
        if ((bad[i] as boolean[])[j] as boolean) kept.push(sub(s, i, j));
      }
    const goodCut = cutWith(good);
    const badCut = cutWith(bad);
    return [
      `${q(s)} 에서 사라지는 회문 조각`,
      "",
      lines(lost)
        .split("\n")
        .map((l) => `  ${l}`)
        .join("\n"),
      "",
      `  남는 길이 3 이상 회문  ${kept.join(" · ")}`,
      "",
      lines([
        [
          "  바른 코드",
          piecesText(s, splitWith(s, good, goodCut.cut, s.length - 1)),
          `컷 ${goodCut.answer} 회`,
        ],
        [
          "  바뀐 코드",
          piecesText(s, splitWith(s, bad, badCut.cut, s.length - 1)),
          `컷 ${badCut.answer} 회`,
        ],
      ]),
    ].join("\n");
  },

  "pause-inner-cell": () => {
    const s0 = WALK;
    let at: [number, number] | null = null;
    for (let i = 0; i + 1 < s0.length; i++)
      if (s0[i] === s0[i + 1]) at = at ?? [i, i + 1];
    if (!at) throw new Error("전개 입력에 길이 2 회문이 없다");
    const [i, j] = at;
    const bad = palWithoutLenTwoGuard(s0);
    return [
      `${palName(i, j)} ${sub(s0, i, j)}${을를(sub(s0, i, j))} 안쪽까지 판정 DP 테이블에서 읽어 정하면`,
      "",
      lines([
        [
          "  양 끝",
          `s[${i}]='${s0[i]}' 와 s[${j}]='${s0[j]}' 가 같다`,
          "→",
          "여기까지는 맞다",
        ],
        [
          "  안쪽",
          `${palName(i + 1, j - 1)} — 아래쪽 삼각형이라 거짓`,
          "→",
          `${palName(i, j)} = ${tf((bad[i] as boolean[])[j] as boolean)}`,
        ],
      ]),
      `  └ ${sub(s0, i, j)}${을를(sub(s0, i, j))} 회문이 아니라고 적었다`,
    ].join("\n");
  },

  "walk-cut-first": () => {
    const t = trace(WALK);
    const out: string[] = [];
    for (let e = 1; e <= 2; e++) {
      const pre = sub(WALK, 0, e);
      if (palOf(WALK, 0, e)) {
        out.push(
          `e=${e}   접두사 ${pad(pre, 8)} ${palName(0, e)} = T  →  ③ 후보를 하나도 안 센다   ${cutName(e)} = ${t.cut[e]}`,
        );
        continue;
      }
      out.push(
        `e=${e}   접두사 ${pad(pre, 8)} ${palName(0, e)} = F  →  후보를 센다`,
      );
      for (let b = 1; b <= e; b++) {
        const ok = palOf(WALK, b, e);
        out.push(
          ok
            ? `      b=${b}  마지막 조각 ${sub(WALK, b, e)}   ${palName(b, e)} = T   ${cutName(b - 1)} + 1 = ${(t.cut[b - 1] as number) + 1}`
            : `      b=${b}  마지막 조각 ${sub(WALK, b, e)}   ${palName(b, e)} = F   후보가 아니다`,
        );
      }
      out.push(`      ${cutName(e)} = ${t.cut[e]}`);
    }
    const shown = t.cut.map((v, e) => (e <= 2 ? String(v) : "·"));
    const [c1, c2] = [t.cut[1] as number, t.cut[2] as number];
    if (!(c2 < c1)) throw new Error("cut[2] 가 cut[1] 보다 작지 않다");
    return [
      ...out,
      "",
      `cut = [${shown.join(", ")}]`,
      `        └ ${cutName(2)}${이가(cutName(2))} ${cutName(1)} 보다 작다 — 이 DP 테이블은 오르기만 하지 않는다`,
    ].join("\n");
  },

  "pause-zero": () => {
    const rows = SAMPLES.map((s) => [
      q(s),
      comma(call(s)),
      comma(cutWith(trace(s).pal, true).answer),
    ]);
    const same_ = rows.filter((r) => r[1] === r[2]).length;
    return withNote(
      md(
        ["입력", "바른 코드", "③ 을 빼고 시작 자리를 0 부터 센 코드"],
        rows,
        [1, 2],
      ),
      `${rows.length} 입력 가운데 ${same_} 입력에서 두 값이 같습니다.`,
    );
  },

  "pause-zero-walk": () => {
    const s = same(N);
    const { cut } = cutWith(trace(s).pal, true);
    const e = N - 1;
    const rows: string[][] = [];
    for (let b = 0; b <= 2; b++) {
      const prev = b === 0 ? "cut[-1]" : cutName(b - 1);
      const v = b === 0 ? Number.NaN : (cut[b - 1] as number) + 1;
      rows.push([
        `  b=${b}`,
        `마지막 조각 ${sub(s, b, e)}`,
        palOf(s, b, e) ? "회문이다" : "회문이 아니다",
        `${prev} + 1 = ${Number.isNaN(v) ? "NaN" : v}`,
      ]);
    }
    const good = trace(WALK).cut;
    const bad = cutWith(trace(WALK).pal, true).cut;
    const wrong = good
      .map((v, x) => (v !== bad[x] ? x : -1))
      .filter((x) => x >= 0);
    return [
      `${q(s)} 에서 ${cutName(e)} 를 정할 때`,
      "",
      lines(rows),
      `       └ 0 을 낼 수 있는 후보는 b=0 하나뿐인데 NaN 이 되어 비교에서 버려진다`,
      "",
      `전개 입력 ${q(WALK)} 의 컷 DP 테이블`,
      "",
      `  바른 코드   cut = [${good.join(", ")}]`,
      `  바뀐 코드   cut = [${bad.join(", ")}]`,
      `  └ 값이 다른 칸 ${wrong.map(cutName).join(" · ")} — 마지막 칸이 그 칸들을 안 읽어서 답만 ${bad[N - 1]} 로 남았다`,
    ].join("\n");
  },

  "walk-branch": () => {
    const t = trace(WALK);
    const out: string[] = [];
    for (let e = 3; e < N; e++) {
      out.push(
        `  e=${e}   접두사 ${sub(WALK, 0, e)}   ${palName(0, e)} = ${tf(palOf(WALK, 0, e))}`,
      );
      for (const r of t.cutRecs.filter((x) => x.e === e)) {
        if (r.kind === "whole") continue;
        if (r.kind === "skip") {
          out.push(
            `        b=${r.b}   ${pad(sub(WALK, r.b, r.e), 7)} ${palName(r.b, r.e)} = F   후보가 아니다`,
          );
          continue;
        }
        out.push(
          `        b=${r.b}   ${pad(sub(WALK, r.b, r.e), 7)} ${palName(r.b, r.e)} = T   ${cutName(r.b - 1)} + 1 = ${r.candidate}   ${r.branch === "less" ? "④" : "⑤"}  best ${fmt(r.before)} → ${fmt(r.after)}`,
        );
      }
      out.push(`        → ${cutName(e)} = ${t.cut[e]}`);
      out.push("");
    }
    return out.join("\n").replace(/\n+$/, "");
  },

  "pause-greedy": () => {
    const rows = SAMPLES.map((s) => [
      q(s),
      comma(longestPieceFirst(s).answer),
      comma(call(s)),
    ]);
    const same_ = rows.filter((r) => r[1] === r[2]).length;
    return withNote(
      md(["입력", "가장 긴 회문 조각부터 뗀 판", "최소"], rows, [1, 2]),
      `${rows.length} 입력 가운데 ${same_} 입력에서 두 값이 같습니다.`,
    );
  },

  "pause-greedy-walk": () => {
    const g = longestPieceFirst(WALK);
    const out: string[] = [`${q(WALK)} 에서 가장 긴 회문 조각부터 떼면`, ""];
    const steps = g.pieces.map(([a, b], x) => {
      const rest = WALK.slice(b + 1);
      return [
        `  ${x + 1})`,
        `남은 ${q(WALK.slice(a))}`,
        `왼쪽 끝의 가장 긴 회문 ${sub(WALK, a, b)}`,
        "→ 뗀다",
        rest ? `남은 것은 ${q(rest)}` : "남은 것이 없다",
      ];
    });
    out.push(lines(steps));
    out.push(
      `     조각 ${g.pieces.length} 개 ${piecesText(WALK, g.pieces)} → 컷 ${g.answer} 회`,
    );
    const best = piecesOf(WALK, N - 1);
    out.push("", `최소는 ${piecesText(WALK, best)}`);
    out.push(`  조각 ${best.length} 개 → 컷 ${call(WALK)} 회`);
    const [fa, fb] = best[0] as [number, number];
    const [ga, gb] = g.pieces[0] as [number, number];
    out.push(
      `     └ 첫 조각을 ${sub(WALK, ga, gb)} 에서 ${sub(WALK, fa, fb)}${으로q(sub(WALK, fa, fb))} 줄였더니 남은 ${q(WALK.slice(fb + 1))}${이가(q(WALK.slice(fb + 1)))} 통째로 회문이 됐다`,
    );
    return out.join("\n");
  },

  "walk-trace": () => {
    const steps = walkSteps();
    const t = trace(WALK);
    const count = {
      one: WALK.length <= 1 ? 1 : 0,
      two: 0,
      three: 0,
      four: 0,
      five: 0,
      skip: 0,
    };
    const rows: string[][] = [];
    steps.forEach((s, x) => {
      if (x === 0) {
        count.two += N;
        rows.push([
          s.id,
          `대각선 ${N} 칸`,
          "첫 걸음 → ②",
          "—",
          "pal[i][i] = T",
        ]);
        return;
      }
      if (x <= t.palRecs.length) {
        const r = t.palRecs[x - 1] as (typeof t.palRecs)[number];
        const cond =
          r.len === 2
            ? `'${WALK[r.i]}' ${r.eq ? "=" : "≠"} '${WALK[r.j]}' **${r.eq ? "참" : "거짓"}**`
            : `'${WALK[r.i]}' ${r.eq ? "=" : "≠"} '${WALK[r.j]}' **${r.eq ? "참" : "거짓"}** · 안쪽 ${palName(r.i + 1, r.j - 1)} = ${tf(r.inner)}`;
        rows.push([
          s.id,
          `${palName(r.i, r.j)} ${sub(WALK, r.i, r.j)}`,
          cond,
          `len = ${r.len}`,
          `${palName(r.i, r.j)} = ${tf(r.value)}`,
        ]);
        return;
      }
      if (x === t.palRecs.length + 1) {
        rows.push([s.id, "컷 DP 테이블 깔기", "—", "—", `${cutName(0)} = 0`]);
        return;
      }
      if (x === steps.length - 1) {
        rows.push([s.id, cutName(N - 1), "읽기", "—", `${t.result} 반환`]);
        return;
      }
      const r = t.cutRecs[
        x - t.palRecs.length - 2
      ] as (typeof t.cutRecs)[number];
      if (r.kind === "whole") {
        count.three++;
        rows.push([
          s.id,
          `e=${r.e}`,
          `${palName(0, r.e)} = T **참** → ③`,
          "—",
          `${cutName(r.e)} = 0`,
        ]);
        return;
      }
      if (r.kind === "skip") {
        count.skip++;
        rows.push([
          s.id,
          `e=${r.e} · b=${r.b}`,
          `${palName(r.b, r.e)} = F → 후보가 아니다`,
          "—",
          `best ${fmt(r.best)}`,
        ]);
        return;
      }
      if (r.branch === "less") count.four++;
      else count.five++;
      rows.push([
        s.id,
        `e=${r.e} · b=${r.b}`,
        `\`${r.candidate} < ${fmt(r.before)}\` **${r.branch === "less" ? "참" : "거짓"}** → ${r.branch === "less" ? "④" : "⑤"}`,
        `${cutName(r.b - 1)} + 1 = ${r.prev} + 1 = ${r.candidate}`,
        r.last ? `${cutName(r.e)} = ${r.after}` : `best ${fmt(r.after)}`,
      ]);
    });
    return withNote(
      md(["단계", "칸 · 자리", "조건 판정", "계산", "남긴 값"], rows),
      `① 은 이 입력에서 ${count.one} 번, ② 는 대각선 ${count.two} 칸, ③ 은 ${count.three} 번, ④ 는 ${count.four} 번, ⑤ 는 ${count.five} 번 실행됐고, 후보가 아닌 시작 자리는 ${count.skip} 번 나왔습니다. 반환값은 ${t.result} 입니다.`,
    );
  },

  "final-run": () => {
    const 목록 = [
      ...SAMPLES,
      "abba",
      "aba",
      "ab",
      "a",
      "",
      "abbaabaabbba",
      "abaca",
    ];
    const 이름 = 목록.map((s) => `palindromePartitioningMinCut(${q(s)})`);
    const 폭 = Math.max(...이름.map((x) => x.length));
    return 목록
      .map((s, t) => `${pad(이름[t] as string, 폭)}  →  ${call(s)}`)
      .join("\n");
  },

  /* ── 알아 두면 좋은 개념 ── */

  "center-chains": () => {
    const rows: string[][] = [];
    for (let c = 0; c <= 2 * (N - 1); c++) {
      const spot =
        c % 2 === 0
          ? `글자 ${c / 2}`
          : `글자 ${(c - 1) / 2}·${(c + 1) / 2} 사이`;
      const list: string[] = [];
      for (let i = N - 1; i >= 0; i--) {
        const j = c - i;
        if (j < i || j >= N) continue;
        if (palOf(WALK, i, j)) list.push(`[${i},${j}] ${sub(WALK, i, j)}`);
      }
      rows.push([
        String(c),
        spot,
        list.length === 0 ? "없다" : list.join(" ⊂ "),
      ]);
    }
    return `${table(["i+j", "중심이 놓인 자리", "그 중심의 회문 구간"], rows)}\n\n중심 ${2 * N - 1} 개 · 회문 ${palindromeCount(WALK)} 개`;
  },

  "center-map": () => {
    const letters = [...WALK].join("   ");
    const nums = Array.from({ length: 2 * N - 1 }, (_, c) => String(c)).join(
      " ",
    );
    const marks = [...WALK].map(() => "↑").join("   ");
    const grow: string[] = [];
    for (let c = 0; c <= 2 * (N - 1); c++) {
      const chain: [number, number][] = [];
      for (let i = N - 1; i >= 0; i--) {
        const j = c - i;
        if (j < i || j >= N) continue;
        if (palOf(WALK, i, j)) chain.push([i, j]);
      }
      if (chain.length >= 2) {
        const [a, b] = chain[0] as [number, number];
        const [x, y] = chain[1] as [number, number];
        grow.push(
          `  중심 ${c} 에서 바깥으로 한 칸  →  [${a},${b}] 이 [${x},${y}] 로 자란다`,
        );
      }
    }
    return [
      `${q(WALK)} 의 중심 ${2 * N - 1} 개                 글자 ${N} 개 + 사이 ${N - 1} 개`,
      "",
      `  ${letters}`,
      `  ${nums}      ← i + j 로 매긴 중심 번호`,
      `  ${marks}`,
      "  글자 위 (홀수 길이)      사이 (짝수 길이)는 그 사이 번호다",
      "",
      ...grow,
    ].join("\n");
  },

  /* ── 이 알고리즘이 최적의 솔루션인 경우 ── */

  "purpose-scale": () =>
    table(
      [
        "글자 수 n",
        "판정 DP 테이블이 잡는 칸 n²",
        "기본 동작 상한 2n²−2n+1",
        "초당 1 억 번일 때",
      ],
      [N_MAX, 100_000].map((n) => [
        comma(n),
        comma(n * n),
        comma(opsHigh(n)),
        `${(opsHigh(n) / 1e8).toFixed(2)} 초`,
      ]),
    ),

  "paper-pl": () => {
    const 목록: [string, number][] = [
      ["abaab", 2],
      ["abaca", 3],
      ["abbaabaabbba", 3],
    ];
    return table(
      ["문자열", "논문이 적은 PL(S)", "이 글의 코드가 낸 컷 수", "컷 수 + 1"],
      목록.map(([s, pl]) => [
        q(s),
        String(pl),
        String(call(s)),
        String(call(s) + 1),
      ]),
    );
  },

  /* ── 수식 정의와 유도 ── */

  "math-p": () => {
    const cells: string[] = [];
    const words: string[] = [];
    for (let i = 0; i < N; i++)
      for (let j = i; j < N; j++)
        if (palOf(WALK, i, j)) {
          cells.push(`(${i},${j})`);
          words.push(WALK.slice(i, j + 1));
        }
    const w = cells.map((c, x) =>
      Math.max(c.length, (words[x] as string).length),
    );
    return [
      `${q(WALK)} 의 P(s) — 파트 1 의 판정 DP 테이블에서 T 였던 칸 ${cells.length} 개가 그대로 원소다`,
      "",
      `  ${cells.map((c, x) => c.padEnd(w[x] as number)).join("  ")}`,
      `  ${words.map((c, x) => c.padEnd(w[x] as number)).join("  ")}`,
    ]
      .join("\n")
      .replace(/ +$/gm, "");
  },

  "math-read-d": () => {
    const d = [0, 1];
    return [
      `시작 자리 목록을 읽는 법 — ${q(WALK)} 을 (${d.join(", ")}) 로 자르면`,
      "",
      `  목록 d = (${d.join(", ")})      조각의 시작 자리가 ${d.join(" 과 ")} 이다`,
      `  조각                 s[0…0] = ${sub(WALK, 0, 0)}  ·  s[1…${N - 1}] = ${sub(WALK, 1, N - 1)}`,
      `  |d| = ${d.length} 이므로       컷은 |d| − 1 = ${d.length - 1} 회`,
    ].join("\n");
  },

  "math-d4": () => {
    const valid = splitsOf(WALK);
    const rows = valid.map((d) => [
      `(${d.join(",")})`,
      piecesFromStarts(WALK, d),
      String(d.length),
      String(d.length - 1),
    ]);
    const least = Math.min(...valid.map((d) => d.length - 1));
    return `${table(["조각의 시작 자리 목록", "그것이 만드는 조각", "조각 수", "컷 수"], rows)}\n\n원소 ${valid.length} 개 · C(${N - 1}) = ${least} · 파트 1 의 ${cutName(N - 1)} = ${call(WALK)}`;
  },

  "math-check-c": () => {
    const e = N - 1;
    const t = trace(WALK);
    const bs: number[] = [];
    for (let b = 0; b <= e; b++) if (palOf(WALK, b, e)) bs.push(b);
    const all = Array.from({ length: e + 1 }, (_, b) => `C(${b - 1}) + 1`);
    const kept = bs.map((b) => `C(${b - 1}) + 1`);
    const vals = bs.map((b) => (b === 0 ? 0 : (t.cut[b - 1] as number) + 1));
    const dropped = Array.from({ length: e + 1 }, (_, b) => b).filter(
      (b) => !bs.includes(b),
    );
    return [
      `e = ${e} 로 검산한다`,
      "",
      lines([
        [`  C(${e})`, "=", `min( ${all.join(" , ")} )`, `후보는 b = 0 … ${e}`],
        [
          "",
          "=",
          `min( ${kept.join(" , ")} )`,
          `${dropped.map((b) => `(${b},${e})`).join(" · ")} ∉ P(s) 라 빠진다`,
        ],
        ["", "=", `min( ${vals.join(" , ")} )`, ""],
        ["", "=", String(Math.min(...vals)), `파트 1 의 ${cutName(e)} 와 같다`],
      ]),
    ].join("\n");
  },

  "pal-count": () =>
    table(
      [
        "글자 수",
        "하한 n",
        "회문이 없을 때",
        "26 글자를 섞을 때",
        "글자가 다 같을 때",
        "상한 n(n+1)/2",
      ],
      [5, 8, 16, 64, N_MAX].map((n) => [
        comma(n),
        comma(n),
        comma(palindromeCount(noPal(n))),
        comma(palindromeCount(mixed(n))),
        comma(palindromeCount(same(n))),
        comma((n * (n + 1)) / 2),
      ]),
    ),

  "edge-condition": () => {
    const all = allStrings(7);
    const matched = all.filter(
      (s) => noShortPalindrome(s) === (call(s) === s.length - 1),
    ).length;
    const extreme = all.filter((s) => call(s) === s.length - 1).length;
    return table(
      ["무엇", "값"],
      [
        ["글자 7 개 · 알파벳 3 글자 전수", comma(all.length)],
        ["답이 6 인 문자열", comma(extreme)],
        ["판정식과 실제 답이 같은 문자열", comma(matched)],
        ["어긋난 문자열", comma(all.length - matched)],
      ],
    );
  },

  "edge-six": () => {
    const hits = allStrings(7).filter((s) => call(s) === s.length - 1);
    const heads = new Set(hits.map((s) => s.slice(0, 3)));
    return [
      `글자 3 종 · 길이 7 에서 답이 6 인 문자열 ${hits.length} 개`,
      "",
      `  ${hits.join("  ")}`,
      "",
      `  앞 세 글자  ${[...heads].join(" · ")}   — 서로 다른 ${heads.size} 가지이고 세 글자가 모두 다르다`,
      "  네 번째부터는 바로 앞 글자와도, 두 칸 앞 글자와도 달라야 해서 남는 글자가 하나뿐이다",
    ].join("\n");
  },

  "math-ops-check": () =>
    table(
      ["글자 수 n", "전수의 최소", "n² − n + 1", "전수의 최대", "2n² − 2n + 1"],
      [2, 3, 4, 5, 6, 7].map((n) => {
        const all = allStrings(n).map((x) => opsOf(x).total);
        return [
          String(n),
          comma(Math.min(...all)),
          comma(opsLow(n)),
          comma(Math.max(...all)),
          comma(opsHigh(n)),
        ];
      }),
    ),

  "math-scale": () => {
    const n = N_MAX;
    const splits = 2n ** BigInt(n - 1);
    return table(
      ["무엇", "값"],
      [
        ["자르는 자리를 전부 시험할 때의 분할 수 2^(n−1)", big(splits)],
        ["그 값의 자릿수", comma(String(splits).length)],
        ["판정 DP 테이블이 쓰는 칸 수 n(n+1)/2", comma((n * (n + 1)) / 2)],
        ["기본 동작 수의 하한 n² − n + 1", comma(opsLow(n))],
        ["기본 동작 수의 상한 2n² − 2n + 1", comma(opsHigh(n))],
        [
          "분할 수가 그 상한의 몇 배인가 — 그 배수의 자릿수",
          comma(String(splits / BigInt(opsHigh(n))).length),
        ],
      ],
    );
  },

  /* ── 불변식 ── */

  "invariant-reads": () => {
    const t = trace(WALK);
    const e = N - 1;
    const rows: string[][] = [];
    const read: number[] = [];
    for (let b = 1; b <= e; b++) {
      const ok = palOf(WALK, b, e);
      if (ok) read.push(b - 1);
      rows.push([
        `  b=${b}`,
        `${palName(b, e)} = ${tf(ok)}`,
        ok ? `${cutName(b - 1)} = ${t.cut[b - 1]}` : "",
        ok ? `→  후보 ${(t.cut[b - 1] as number) + 1}` : "→  후보가 아니다",
      ]);
    }
    return [
      `e=${e}${을를(e)} 정하는 동안 읽은 자리를 전부 적으면`,
      "",
      lines(rows),
      `          └ 읽은 컷 칸이 ${read.join(" 과 ")} 뿐이고 둘 다 ${e} 보다 앞이라 이미 정해져 있다`,
    ].join("\n");
  },

  "invariant-edges": () => {
    const inputs: [string, string][] = [
      ["", "빈 문자열"],
      ["a", "글자 하나"],
      ["ab", "길이 2 · 회문이 아니다"],
      ["aa", "길이 2 · 회문이다"],
      [same(N), "글자가 전부 같다"],
      ["abcde", "길이 2 이상 회문이 없다"],
    ];
    const rows = inputs.map(([s, what]) => {
      if (s.length <= 1)
        return [
          `${q(s)} (${what})`,
          "첫 분기 n <= 1 이 먼저 돌려준다",
          String(call(s)),
        ];
      const t = trace(s);
      const whole = t.cutRecs.filter((r) => r.kind === "whole").length;
      const cands = t.cutRecs.filter((r) => r.kind === "cand").length;
      return [
        `${q(s)} (${what})`,
        `컷 칸 ${s.length - 1} 개를 정한다 · 접두사 전체가 회문 ${whole} 번 · 후보 ${cands} 개`,
        String(call(s)),
      ];
    });
    const allSame = trace(same(N)).cutRecs.filter(
      (r) => r.kind === "cand",
    ).length;
    const noP = trace("abcde").cutRecs.filter((r) => r.kind === "cand");
    const onlyLast = noP.every((r) => r.kind === "cand" && r.b === r.e);
    if (!onlyLast)
      throw new Error("회문이 없는 입력에서 마지막 한 글자 말고도 후보가 있다");
    return withNote(
      md(["입력", "DP 테이블에서 일어나는 일", "반환값"], rows, [2]),
      `${q(same(N))} 는 후보를 ${allSame} 번 비교하고, ${q("abcde")} 는 끝 자리마다 후보가 마지막 한 글자 하나뿐이라 후보 ${noP.length} 개를 비교합니다.`,
    );
  },

  "mutant-backward": () =>
    table(
      ["입력", "바른 코드", "컷 DP 테이블을 뒤에서부터 채운 코드"],
      변이표.map((s) => [
        q(s),
        comma(call(s)),
        comma(뒤에서부터채우기.palindromePartitioningMinCut(s)),
      ]),
    ),

  "invariant-mutant-walk": () => {
    const s = "abcde";
    const { first } = backwardSteps(s);
    if (first === null)
      throw new Error("뒤에서부터 채운 판이 한 칸도 정하지 않았다");
    const good = trace(s).cut;
    const r = first.reads.at(-1) as { b: number; prev: number; cand: number };
    const truth = (good[r.b - 1] as number) + 1;
    return [
      `${q(s)} 에서 ${cutName(first.e)} 를 가장 먼저 정하면`,
      "",
      `  b=${r.b}   마지막 조각 ${sub(s, r.b, first.e)}${이가(sub(s, r.b, first.e))} 회문이다   ${cutName(r.b - 1)}${은는(cutName(r.b - 1))} 아직 ${r.prev}   →  후보 ${r.cand}`,
      `        바른 차례라면 ${cutName(r.b - 1)} = ${good[r.b - 1]} 이므로 후보가 ${truth} 여야 한다`,
      `          └ 앞 ${r.b} 글자를 공짜로 자른 셈이다`,
    ].join("\n");
  },

  /* ── 비용 계산 ── */

  "perf-derive": () => {
    const steps = walkSteps();
    const t = trace(WALK);
    const ids = (f: (x: number) => boolean) =>
      steps.filter((_, x) => f(x)).map((s) => s.id);
    const palBase = 1;
    const len2 = t.palRecs.filter((r) => r.len === 2).length;
    const len3 = t.palRecs.length - len2;
    const cutBase = palBase + t.palRecs.length + 1;
    const recAt = (x: number) =>
      t.cutRecs[x - cutBase] as (typeof t.cutRecs)[number] | undefined;
    const inCut = (x: number) => x >= cutBase && x < cutBase + t.cutRecs.length;
    // ③ 검사 — 끝 자리마다 그 끝 자리의 첫 걸음.
    const firstOfE = (x: number) =>
      inCut(x) && (x === cutBase || recAt(x - 1)?.e !== recAt(x)?.e);
    const wholeReads = t.n - 1;
    const palReads = t.cutRecs.filter((r) => r.kind !== "whole").length;
    const cutReads = t.cutRecs.filter((r) => r.kind === "cand").length;
    const ops = opsOf(WALK);
    const sum = len2 + 2 * len3 + wholeReads + palReads + cutReads + 1;
    if (sum !== ops.total)
      throw new Error(`자리별 합 ${sum} 이 opsOf ${ops.total} 와 다르다`);
    const rows = [
      [
        "판정 칸 · 길이 2",
        `칸 ${len2} 개 × 비교 1`,
        String(len2),
        joinIds(ids((x) => x >= 1 && x <= len2)),
      ],
      [
        "판정 칸 · 길이 3 이상",
        `칸 ${len3} 개 × (비교 1 + 안쪽 칸 읽기 1)`,
        String(2 * len3),
        joinIds(ids((x) => x > len2 && x <= t.palRecs.length)),
      ],
      [
        "③ 검사",
        `끝 자리 ${wholeReads} 곳 × pal[0][e] 읽기 1`,
        String(wholeReads),
        joinIds(ids(firstOfE)),
      ],
      [
        "마지막 조각 판정",
        `시작 자리 ${palReads} 곳 × pal[b][e] 읽기 1`,
        String(palReads),
        joinIds(ids((x) => inCut(x) && recAt(x)?.kind !== "whole")),
      ],
      [
        "앞부분 컷 칸",
        `후보 ${cutReads} 개 × cut[b−1] 읽기 1`,
        String(cutReads),
        joinIds(ids((x) => inCut(x) && recAt(x)?.kind === "cand")),
      ],
      ["답 읽기", "cut[n−1] 읽기 1", "1", steps.at(-1)?.id ?? ""],
      ["합계", "", String(ops.total), ""],
    ];
    const n = N_MAX;
    return withNote(
      md(["자리", "세는 법", "기본 동작", "걸음"], rows, [2]),
      `글자 ${comma(n)} 개면 판정 DP 테이블 쪽이 입력과 무관하게 (n−1)² = ${comma(opsOf(same(n)).pal)} 번이고, 컷 DP 테이블 쪽은 입력에 따라 ${comma(opsOf(same(n)).cut)} 번에서 ${comma(opsOf(headDiff(n)).cut)} 번까지 갈립니다. 두 DP 테이블이 잡는 칸은 n² + n = ${comma(n * n + n)} 개입니다.`,
    );
  },

  "worst-fill": () => {
    const n = N_MAX;
    const 입력: [string, string][] = [
      ["글자가 전부 같다", same(n)],
      ["두 글자를 번갈아 쓴다", "ab".repeat(n / 2)],
      ["길이 2 이상 회문이 없다", noPal(n)],
      ["26 글자를 곱셈 나머지로 섞는다", mixed(n)],
      ["앞 절반만 같은 글자다", same(n / 2) + noPal(n / 2)],
      ["첫 글자만 다르다", headDiff(n)],
    ];
    const rows = 입력.map(([이름, s]) => {
      const o = opsOf(s);
      return [이름, comma(call(s)), comma(o.pal), comma(o.cut), comma(o.total)];
    });
    const pals = new Set(rows.map((r) => r[2]));
    const worst = 입력.reduce((a, c) =>
      opsOf(c[1]).cut > opsOf(a[1]).cut ? c : a,
    );
    return withNote(
      md(
        ["입력 (글자 2,000 개)", "답", "판정 DP 테이블", "컷 DP 테이블", "합"],
        rows,
        [1, 2, 3, 4],
      ),
      `판정 DP 테이블 열은 여섯 입력이 ${pals.size === 1 ? "모두" : "서로 달리"} ${[...pals][0]} 번이고, 컷 DP 테이블 열이 가장 큰 것은 「${worst[0]}」 입력의 ${comma(opsOf(worst[1]).cut)} 번입니다.`,
    );
  },

  "worst-why": () => {
    const s = headDiff(6);
    const n = s.length;
    const rows: string[][] = [];
    for (let e = 1; e < n; e++) {
      let palR = 0;
      let cutR = 0;
      for (let b = 1; b <= e; b++) {
        palR++;
        if (palOf(s, b, e)) cutR++;
      }
      rows.push([
        `  e=${e}`,
        `접두사 ${sub(s, 0, e)}`,
        `${palName(0, e)} = ${tf(palOf(s, 0, e))}`,
        `pal[b][${e}] 읽기 ${palR}`,
        `cut 읽기 ${cutR}`,
      ]);
    }
    return [
      `${q(s)} 에서 끝 자리마다 읽는 칸`,
      "",
      lines(rows),
      "  └ 접두사는 첫 글자 때문에 한 번도 회문이 아니고, s[b…e] 는 b ≥ 1 이면 전부 회문이라 cut 도 빠짐없이 읽는다",
    ].join("\n");
  },

  /* ── 스스로 점검하기 ── */

  "selfcheck-q": () => {
    const steps = walkSteps();
    const t = trace(WALK);
    const at = (e: number) =>
      steps.find(
        (s) =>
          s.stage === "array" &&
          s.title.startsWith(`e=${e} `) &&
          (s.title.includes("③") || s.title.includes(`b=${e} `)),
      )?.id ?? "";
    const d = (t.cut[2] as number) - (t.cut[1] as number);
    return [
      `${at(1)} :  ${cutName(1)} = ${cutName(0)} + 1 = ${t.cut[1]}     접두사 ${sub(WALK, 0, 1)}`,
      `${at(2)} :  ${cutName(2)} = ${t.cut[2]}                  접두사 ${sub(WALK, 0, 2)} — 통째로 회문이다`,
      `       ${cutName(2)} − ${cutName(1)} = ${d}        이 차이가 얼마까지 벌어질 수 있는가 = ?`,
    ].join("\n");
  },

  "cut-step": () => {
    const 목록 = [
      WALK,
      "abcba",
      "abcddcba",
      "abcdefggfedcba",
      "aaaaaaaa",
      noPal(12),
      mixed(40),
      same(40),
    ];
    const rows = 목록.map((s) => {
      const st = cutSteps(s);
      const short =
        s.length <= 14 ? q(s) : `"${s.slice(0, 11)}…" (${s.length} 글자)`;
      return [
        short,
        s.length <= 14
          ? st.map((x) => (x >= 0 ? `+${x}` : String(x))).join(" ")
          : "…",
        String(Math.min(...st)),
        String(Math.max(...st)),
      ];
    });
    let 최소 = 0;
    let 최대 = 0;
    for (let len = 2; len <= 9; len++)
      for (const cur of allStrings(len)) {
        const st = cutSteps(cur);
        최소 = Math.min(최소, ...st);
        최대 = Math.max(최대, ...st);
      }
    rows.push([
      "알파벳 3 종 · 길이 9 이하 전수",
      "…",
      String(최소),
      String(최대),
    ]);
    return table(
      ["문자열", "cut[e] − cut[e−1]", "가장 작은 차이", "가장 큰 차이"],
      rows,
    );
  },
};

/** 걸음 목록을 줄여 적는다 — 이어진 번호는 `T2~T5`. */
function joinIds(ids: string[]): string {
  const nums = ids.map((x) => Number(x.slice(1)));
  const out: string[] = [];
  let a = 0;
  while (a < nums.length) {
    let b = a;
    while (
      b + 1 < nums.length &&
      (nums[b + 1] as number) === (nums[b] as number) + 1
    )
      b++;
    out.push(b > a ? `T${nums[a]}~T${nums[b]}` : `T${nums[a]}`);
    a = b + 1;
  }
  return out.join(" · ");
}

/** 「 으로」·「 로」 — 따옴표를 두른 조각의 끝 글자에서 본다. */
const 으로q = (x: string): string => 으로(lastOf(x));
