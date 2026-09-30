/**
 * `palindromePartitioningMinCut-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 판정 칸 하나를 정하는 자리와 컷 후보
 * 하나를 비교하는 자리마다 무엇을 읽었는지는 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록하고,
 * 답은 정본이 낸다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의
 * 리터럴이 그것과 같은지는 `palindromePartitioningMinCut-guide.test.ts` 가 잰다.
 *
 * 이 편은 DP 테이블이 둘이라 무대도 둘이다. 판정 DP 테이블 `pal` 은 칸 하나가 구간 하나라 「2 차원 표」
 * 무대(`tableStage`)에 줄 `i` · 열 `j` 로 그리고, 아래쪽 삼각형(`i > j`)은 구간이 아니라 「이번 걸음 밖」
 * 으로 둔다. 표 아래에는 문자열 줄을 둔다 — 열 `j` 와 글자 `s[j]` 가 짝이라 칸 `(i, j)` 가 맡는 구간이
 * 그 줄 위의 괄호로 보인다. 컷 DP 테이블 `cut` 은 칸 하나가 접두사 하나인 한 줄이라 「배열」 무대
 * (`arrayStage`)에 문자열 아래 층으로 쌓고, 그 위에 판정 DP 테이블의 열 `e` 한 줄(`pal[b][e]`)을 함께
 * 쌓는다 — 컷 칸 하나를 정할 때 읽는 판정 칸이 전부 그 열에 있다.
 *
 * 비용은 원고 전체에서 **기본 동작 수**로 센다 — 글자 두 개를 한 번 비교하는 일과 DP 테이블 칸 하나를
 * 한 번 읽는 일이 각각 하나다. 메모리는 **칸 수**로 센다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import {
  CellStage,
  CellStageFilm,
  type StageFrame,
  type StageRow,
} from "../../../_viz/patterns/CellStage";
import {
  type ArrayLayer,
  type ArrayOptions,
  type ArrayPiece,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import {
  type TableCell,
  type TableOptions,
  type TablePiece,
  type TableStep,
  tableStage,
} from "../../../_viz/player/tableStage";
import { palindromePartitioningMinCut } from "./palindromePartitioningMinCut-guide.ref.ts";

const REF = new URL(
  "./palindromePartitioningMinCut-guide.ref.ts",
  import.meta.url,
).pathname;

type Fn = { palindromePartitioningMinCut(s: string): number };

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 판정 칸 하나를 적은 직후에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 기록은 판정 DP 테이블(`pal`)을 가리키기만 하고, 칸의 값은 호출이
 * 끝난 뒤 읽는다. 칸은 한 번만 쓰이므로 끝난 뒤의 값이 곧 그 칸을 정한 순간의 값이다.
 */
const palProbe = await loadMutant<Fn>(REF, {
  swap: [
    /^(\s*)\(pal\[i\] as boolean\[\]\)\[j\] = s\[i\] === s\[j\] && inner;$/,
    "$1(pal[i] as boolean[])[j] = s[i] === s[j] && inner;\n$1(globalThis as any).__pal.push({ i, j, len, eq: s[i] === s[j], inner, pal });",
  ],
});

/** 컷 후보 하나를 비교하기 직전에 기록을 끼운 사본. 기록은 컷 DP 테이블(`cut`)을 가리키기만 한다. */
const cutProbe = await loadMutant<Fn>(REF, {
  swap: [
    /^(\s*)if \(candidate < best\) best = candidate;$/,
    "$1(globalThis as any).__cut.push({ e, b, candidate, before: best, cut });\n$1if (candidate < best) best = candidate;",
  ],
});

/**
 * 끝에서 두 DP 테이블을 받아 오는 가벼운 사본 — 칸마다 기록을 남기지 않는다. 글자 2,000 개짜리 입력에서
 * 칸마다 기록을 쌓으면 기록만 200 만 개라, 큰 입력의 셈은 이것으로 한다.
 */
const endProbe = await loadMutant<Fn>(REF, {
  swap: [
    /^(\s*)return cut\[n - 1\] as number;$/,
    "$1(globalThis as any).__end = { pal, cut };\n$1return cut[n - 1] as number;",
  ],
});

/** 판정 칸 하나를 정한 기록. */
export interface PalRec {
  readonly i: number;
  readonly j: number;
  readonly len: number;
  /** 양 끝 글자가 같은가 — `s[i] === s[j]`. */
  readonly eq: boolean;
  /** 안쪽 판정 — 길이 2 는 읽지 않고 참이다. */
  readonly inner: boolean;
  /** 적은 값. */
  readonly value: boolean;
}

/** 컷 DP 테이블을 채우는 동안의 한 걸음. */
export type CutRec =
  | {
      /** ③ 접두사 전체가 회문이라 후보를 세지 않는다. */
      readonly kind: "whole";
      readonly e: number;
    }
  | {
      /** 마지막 조각 `s[b…e]` 가 회문이 아니라 후보가 아니다. */
      readonly kind: "skip";
      readonly e: number;
      readonly b: number;
      /** 이 걸음 앞의 `best`. */
      readonly best: number;
    }
  | {
      readonly kind: "cand";
      readonly e: number;
      readonly b: number;
      /** 읽은 `cut[b−1]`. */
      readonly prev: number;
      /** `cut[b−1] + 1`. */
      readonly candidate: number;
      readonly before: number;
      readonly after: number;
      /** `less` ④ 지금까지의 최소보다 적다 · `notLess` ⑤ 적지 않다. */
      readonly branch: "less" | "notLess";
      /** 이 끝 자리의 마지막 후보인가 — 그 걸음이 끝나면 `cut[e]` 가 정해진다. */
      readonly last: boolean;
    };

export interface Trace {
  readonly s: string;
  readonly n: number;
  readonly pal: readonly (readonly boolean[])[];
  readonly palRecs: readonly PalRec[];
  readonly cutRecs: readonly CutRec[];
  readonly cut: readonly number[];
  readonly result: number;
}

const traceCache = new Map<string, Trace>();

/**
 * 정본 한 번 호출의 기록. 판정 칸은 정본이 적은 순서 그대로이고, 컷 후보는 정본이 비교한 순서 그대로다.
 * 후보가 아닌 시작 자리와 ③ 은 정본이 적은 판정 칸에서 읽는다 — 그 두 갈래는 `continue` 한 줄이라
 * 기록을 끼울 자리가 없고, 대신 후보 기록이 그 사이에 빠진 자리 없이 맞물리는지를 대조한다.
 */
export function trace(s: string): Trace {
  const hit = traceCache.get(s);
  if (hit) return hit;
  const g = globalThis as unknown as {
    __pal: {
      i: number;
      j: number;
      len: number;
      eq: boolean;
      inner: boolean;
      pal: boolean[][];
    }[];
    __cut: {
      e: number;
      b: number;
      candidate: number;
      before: number;
      cut: number[];
    }[];
  };
  g.__pal = [];
  const a = palProbe.palindromePartitioningMinCut(s);
  const rawPal = g.__pal;
  g.__pal = [];
  g.__cut = [];
  const b = cutProbe.palindromePartitioningMinCut(s);
  const rawCut = g.__cut;
  g.__cut = [];
  const want = palindromePartitioningMinCut(s);
  if (a !== want || b !== want) {
    throw new Error(`계측 사본이 정본과 다른 답을 냈다 — "${s}"`);
  }
  const n = s.length;
  const pal: boolean[][] =
    n <= 1
      ? Array.from({ length: n }, () => [true])
      : ((rawPal[0]?.pal ?? [[true, false]]).map((r) => [...r]) as boolean[][]);
  if (n === 2 && rawPal.length !== 1) throw new Error("길이 2 칸 기록이 없다");
  const palRecs: PalRec[] = rawPal.map((r) => {
    const value = (pal[r.i] as boolean[])[r.j] as boolean;
    if (value !== (r.eq && r.inner)) {
      throw new Error(`pal[${r.i}][${r.j}] 이 양 끝과 안쪽의 곱과 다르다`);
    }
    if (
      r.len > 2 &&
      r.inner !== ((pal[r.i + 1] as boolean[])[r.j - 1] as boolean)
    ) {
      throw new Error(`pal[${r.i}][${r.j}] 이 읽은 안쪽 칸이 다르다`);
    }
    return { i: r.i, j: r.j, len: r.len, eq: r.eq, inner: r.inner, value };
  });
  // 판정 칸을 적은 차례가 길이 → 시작 자리 오름차순인가.
  const order: [number, number][] = [];
  for (let len = 2; len <= n; len++)
    for (let i = 0; i + len - 1 < n; i++) order.push([i, i + len - 1]);
  if (order.length !== palRecs.length) {
    throw new Error(
      `판정 칸 기록 ${palRecs.length} 개가 ${order.length} 와 다르다`,
    );
  }
  palRecs.forEach((r, t) => {
    const [i, j] = order[t] as [number, number];
    if (r.i !== i || r.j !== j)
      throw new Error(`${t} 번째 판정 칸이 [${i},${j}] 가 아니다`);
  });
  // 컷 걸음을 정본의 반복 차례대로 맞물린다.
  const cut = new Array<number>(n).fill(0);
  const cutRecs: CutRec[] = [];
  let q = 0;
  for (let e = 1; e < n; e++) {
    if ((pal[0] as boolean[])[e] as boolean) {
      cutRecs.push({ kind: "whole", e });
      cut[e] = 0;
      continue;
    }
    let best = Number.POSITIVE_INFINITY;
    for (let bb = 1; bb <= e; bb++) {
      if (!((pal[bb] as boolean[])[e] as boolean)) {
        cutRecs.push({ kind: "skip", e, b: bb, best });
        continue;
      }
      const r = rawCut[q++];
      if (!r || r.e !== e || r.b !== bb) {
        throw new Error(`컷 후보 기록이 e=${e} · b=${bb} 와 맞물리지 않는다`);
      }
      const prev = cut[bb - 1] as number;
      if (r.candidate !== prev + 1 || r.before !== best) {
        throw new Error(`e=${e} · b=${bb} 후보가 읽은 값이 다르다`);
      }
      const after = Math.min(best, r.candidate);
      cutRecs.push({
        kind: "cand",
        e,
        b: bb,
        prev,
        candidate: r.candidate,
        before: best,
        after,
        branch: r.candidate < best ? "less" : "notLess",
        last: bb === e,
      });
      best = after;
    }
    cut[e] = best;
  }
  if (q !== rawCut.length) throw new Error("남은 컷 후보 기록이 있다");
  const probeCut = rawCut[0]?.cut;
  if (probeCut?.some((v, t) => v !== cut[t])) {
    throw new Error("정본이 채운 컷 DP 테이블이 맞물린 값과 다르다");
  }
  if (n >= 2 && cut[n - 1] !== want)
    throw new Error("마지막 칸이 반환값과 다르다");
  const t: Trace = { s, n, pal, palRecs, cutRecs, cut, result: want };
  traceCache.set(s, t);
  return t;
}

/** 큰 입력 — 두 DP 테이블을 끝에서 받아 온다. 칸마다 기록을 남기지 않는다. */
export function finalTables(s: string): {
  pal: readonly (readonly boolean[])[];
  cut: readonly number[];
  result: number;
} {
  const g = globalThis as unknown as {
    __end?: { pal: boolean[][]; cut: number[] };
  };
  g.__end = undefined;
  const result = endProbe.palindromePartitioningMinCut(s);
  const end = g.__end as { pal: boolean[][]; cut: number[] } | undefined;
  g.__end = undefined;
  if (result !== palindromePartitioningMinCut(s)) {
    throw new Error(`가벼운 사본이 정본과 다른 답을 냈다 — 길이 ${s.length}`);
  }
  if (!end) return { pal: [], cut: s.length === 1 ? [0] : [], result };
  return { pal: end.pal, cut: end.cut, result };
}

/**
 * 정본이 실행하는 기본 동작 수 — 글자 비교와 칸 읽기를 자리마다 센다. 정본의 줄과 이렇게 짝이다.
 *
 * - 판정 칸 하나: `inner` 가 길이 3 이상이면 안쪽 칸을 한 번 읽고, `s[i] === s[j]` 가 비교 한 번이다.
 * - 끝 자리 `e` 하나: ③ 의 `pal[0][e]` 읽기 한 번. ③ 이 아니면 `b` 마다 `pal[b][e]` 읽기 한 번, 그 칸이
 *   참이면 `cut[b−1]` 읽기 한 번.
 * - 마지막 `cut[n−1]` 읽기 한 번. 글자가 하나 이하면 첫 줄이 돌려주므로 0 이다.
 */
export function opsOf(s: string): {
  pal: number;
  cut: number;
  read: number;
  total: number;
  compares: number;
  reads: number;
} {
  const n = s.length;
  if (n <= 1)
    return { pal: 0, cut: 0, read: 0, total: 0, compares: 0, reads: 0 };
  const { pal } = finalTables(s);
  let palOps = 0;
  let compares = 0;
  for (let len = 2; len <= n; len++) {
    const cells = n - len + 1;
    compares += cells;
    palOps += cells * (len === 2 ? 1 : 2);
  }
  let cutOps = 0;
  for (let e = 1; e < n; e++) {
    cutOps++;
    if ((pal[0] as boolean[])[e] as boolean) continue;
    for (let b = 1; b <= e; b++) {
      cutOps++;
      if ((pal[b] as boolean[])[e] as boolean) cutOps++;
    }
  }
  const total = palOps + cutOps + 1;
  return {
    pal: palOps,
    cut: cutOps,
    read: 1,
    total,
    compares,
    reads: total - compares,
  };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/**
 * 조사 — 앞말의 **마지막 글자나 숫자**에서 받침을 본다. 칸 이름 `cut[3]` 은 3 에서, 따옴표를 두른 조각
 * `"baab"` 은 끝 글자 b 에서 본다(글자 이름으로 읽는다 — `tools/josa.ts` 의 영문 한 글자 규칙).
 */
export const lastOf = (x: string | number): string => {
  const m = /([A-Za-z0-9])[^A-Za-z0-9]*$/.exec(String(x));
  return m ? (m[1] as string) : String(x);
};
export const jq = (x: string | number, 있음: string, 없음: string): string =>
  josa(lastOf(x), 있음, 없음);
export const 을를 = (x: string | number): string => jq(x, "을", "를");
export const 이가 = (x: string | number): string => jq(x, "이", "가");
export const 은는 = (x: string | number): string => jq(x, "은", "는");
export const 과와 = (x: string | number): string => jq(x, "과", "와");

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). 본문의 다른 자리도 이 문자열을 가리킨다. */
export const WALK = "abaab";
export const N = WALK.length;

/** 과제 규모 — 글자 수 `n` 의 위 끝. */
export const N_MAX = 2000;

/** 본문이 여러 자리에서 함께 거는 입력 묶음. */
export const SAMPLES: readonly string[] = [
  WALK,
  "aab",
  "abcbm",
  "abacdc",
  "noonracecar",
  "abcde",
  "aaaaa",
];

/** 길이 `n` 짜리 — 글자가 전부 같은 문자열. */
export const same = (n: number): string => "a".repeat(n);

/** 길이 `n` 짜리 — 길이 2 이상 회문이 하나도 없는 문자열(`abcabc…`). */
export const noPal = (n: number): string =>
  Array.from({ length: n }, (_, t) => "abc"[t % 3] as string).join("");

/** 길이 `n` 짜리 — 곱셈 나머지로 고른 26 글자(`97 + 7919t mod 26`). */
export const mixed = (n: number): string =>
  Array.from({ length: n }, (_, t) =>
    String.fromCharCode(97 + ((t * 7919) % 26)),
  ).join("");

/** 길이 `n` 짜리 — 첫 글자만 다르고 나머지가 전부 같은 문자열(`baa…a`). */
export const headDiff = (n: number): string => `b${"a".repeat(n - 1)}`;

/** `10011001` → `10,011,001`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
export const comma = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 자릿수가 21 을 넘으면 자리 수로 적는다 — `5.74 × 10^601` 꼴. */
export const big = (n: bigint): string => {
  const s = String(n);
  if (s.length <= 21) return comma(n);
  return `${s[0]}.${s.slice(1, 3)} × 10^${s.length - 1}`;
};

/** 판정 값 — `T` · `F`. */
export const tf = (v: boolean): string => (v ? "T" : "F");

/** 문자열을 본문 표기 그대로 — `"abaab"`. */
export const q = (s: string): string => `"${s}"`;

/** 구간 `[i,j]` 의 부분 문자열을 따옴표째로. */
export const sub = (s: string, i: number, j: number): string =>
  q(s.slice(i, j + 1));

/** 값을 적는다 — 아직 후보가 없는 `best` 는 ∞. */
export const fmt = (v: number): string => (Number.isFinite(v) ? comma(v) : "∞");

/** 판정 칸 이름 — `pal[1][4]`. */
export const palName = (i: number, j: number): string => `pal[${i}][${j}]`;

/** 컷 칸 이름 — `cut[3]`. */
export const cutName = (e: number): string => `cut[${e}]`;

/**
 * 접두사 `s[0…e]` 를 컷 DP 테이블이 고른 대로 가른 조각 — 정본과 같은 규칙으로 거슬러 간다. ③ 이면
 * 통째로 한 조각이고, 아니면 `cut[e]` 를 처음 낸(가장 작은) 시작 자리 `b` 에서 마지막 조각을 뗀다.
 */
export function piecesOf(s: string, e: number): [number, number][] {
  const t = trace(s);
  if (e < 0) return [];
  if (e === 0 || ((t.pal[0] as boolean[])[e] as boolean)) return [[0, e]];
  const mine = t.cutRecs.filter(
    (r): r is Extract<CutRec, { kind: "cand" }> =>
      r.kind === "cand" && r.e === e,
  );
  const best = mine.find((r) => r.candidate === t.cut[e]);
  if (!best) throw new Error(`cut[${e}] 을 낸 후보가 없다`);
  return [...piecesOf(s, best.b - 1), [best.b, e]];
}

/** 조각을 본문 표기로 — `"a" | "baab"`. */
export const piecesText = (
  s: string,
  ps: readonly [number, number][],
): string => ps.map(([a, b]) => sub(s, a, b)).join(" | ");

/* ───────────────── 정본과 다른 절차 — 본문이 정본과 값으로 대조한다 ───────────────── */

/**
 * 가장 먼저 떠오르는 방법 — 마지막 조각을 하나씩 떼어 보고 남은 앞부분을 같은 방법으로 다시 푼다. 회문인지는
 * 물을 때마다 양 끝에서 안쪽으로 대조한다. 아무것도 기억하지 않는다. 기본 동작(글자 비교)을 센다.
 */
export function naiveSplit(s: string): { answer: number; ops: number } {
  let ops = 0;
  const isPal = (l: number, r: number): boolean => {
    let a = l;
    let z = r;
    while (a < z) {
      ops++;
      if (s[a] !== s[z]) return false;
      a++;
      z--;
    }
    return true;
  };
  const go = (e: number): number => {
    if (e < 0) return 0;
    let best = Number.POSITIVE_INFINITY;
    for (let b = 0; b <= e; b++) {
      if (isPal(b, e)) best = Math.min(best, go(b - 1) + 1);
    }
    return best;
  };
  const pieces = go(s.length - 1);
  return { answer: s.length === 0 ? 0 : pieces - 1, ops };
}

/** 조각이 전부 회문인 분할의 수 — 판정 DP 테이블을 읽어 전수로 센다. */
export function palindromicSplits(s: string): bigint {
  const { pal } = trace(s);
  const n = s.length;
  const memo = new Array<bigint>(n + 1).fill(-1n);
  const count = (start: number): bigint => {
    if (start === n) return 1n;
    if ((memo[start] as bigint) >= 0n) return memo[start] as bigint;
    let total = 0n;
    for (let end = start; end < n; end++) {
      if ((pal[start] as boolean[])[end] as boolean) total += count(end + 1);
    }
    memo[start] = total;
    return total;
  };
  return count(0);
}

/**
 * 마지막 조각으로 가르는 재귀 — 아무것도 기억하지 않는다. 끝 자리 `e` 의 접두사를 몇 번 푸는지와,
 * 풀 때 내려가는 갈래를 적는다. `hit[e + 1]` 이 끝 자리 `e` 를 푼 횟수이고 `hit[0]` 이 빈 접두사다.
 */
export function prefixSolves(s: string): {
  hit: number[];
  branches: { e: number; b: number; rest: number }[];
} {
  const { pal } = trace(s);
  const n = s.length;
  const hit = new Array<number>(n + 1).fill(0);
  const branches: { e: number; b: number; rest: number }[] = [];
  const go = (e: number, first: boolean): number => {
    hit[e + 1] = (hit[e + 1] as number) + 1;
    if (e < 0) return 0;
    let best = Number.POSITIVE_INFINITY;
    for (let b = 0; b <= e; b++) {
      if ((pal[b] as boolean[])[e] as boolean) {
        if (first) branches.push({ e, b, rest: b - 1 });
        best = Math.min(best, go(b - 1, false) + 1);
      }
    }
    return best;
  };
  go(n - 1, true);
  // 갈래는 끝 자리마다 처음 푼 한 번만 적는다 — 같은 끝 자리를 두 번째로 풀 때 내려가는 갈래는 같다.
  const seen = new Set<number>();
  const firstBranches: { e: number; b: number; rest: number }[] = [];
  const walk = (e: number): void => {
    if (e < 0 || seen.has(e)) return;
    seen.add(e);
    for (let b = e; b >= 0; b--) {
      if ((pal[b] as boolean[])[e] as boolean)
        firstBranches.push({ e, b, rest: b - 1 });
    }
    for (let b = e; b >= 0; b--) {
      if ((pal[b] as boolean[])[e] as boolean) walk(b - 1);
    }
  };
  walk(n - 1);
  return { hit, branches: firstBranches };
}

/**
 * 접두사마다 한 칸은 두되 회문인지는 물을 때마다 양 끝에서 대조하는 판. 기본 동작(글자 비교 · 컷 칸
 * 읽기)을 센다. 마지막 조각의 시작 자리 `b` 를 0 부터 끝 자리까지 본다.
 */
export function judgeEveryTime(s: string): { answer: number; ops: number } {
  const n = s.length;
  if (n <= 1) return { answer: 0, ops: 0 };
  let ops = 0;
  const cut = new Array<number>(n).fill(0);
  for (let e = 1; e < n; e++) {
    let best = Number.POSITIVE_INFINITY;
    for (let b = 0; b <= e; b++) {
      let l = b;
      let r = e;
      let ok = true;
      while (l < r) {
        ops++;
        if (s[l] !== s[r]) {
          ok = false;
          break;
        }
        l++;
        r--;
      }
      if (!ok) continue;
      let prev = -1;
      if (b > 0) {
        ops++;
        prev = cut[b - 1] as number;
      }
      best = Math.min(best, prev + 1);
    }
    cut[e] = best;
  }
  ops++;
  return { answer: cut[n - 1] as number, ops };
}

export type FillOrder = "len" | "rowAsc" | "rowDesc" | "colAsc";

/**
 * 판정 DP 테이블을 채우는 차례만 바꾼 판. `len` 이 정본과 같은 차례다. 컷 DP 테이블은 정본과 같게
 * 채운다. `reads` 는 판정 칸이 안쪽 칸을 읽을 때 그 칸이 이미 정해져 있었는가를 센다.
 */
export function fillByOrder(
  s: string,
  order: FillOrder,
): {
  pal: boolean[][];
  answer: number;
  reads: { total: number; ready: number };
  innerAt: Map<string, boolean>;
} {
  const n = s.length;
  const pal = Array.from({ length: n }, () =>
    new Array<boolean>(n).fill(false),
  );
  const done = new Set<string>();
  const innerAt = new Map<string, boolean>();
  for (let i = 0; i < n; i++) {
    (pal[i] as boolean[])[i] = true;
    done.add(`${i},${i}`);
  }
  const reads = { total: 0, ready: 0 };
  const one = (i: number, j: number): void => {
    const len = j - i + 1;
    let inner = true;
    if (len > 2) {
      reads.total++;
      if (done.has(`${i + 1},${j - 1}`)) reads.ready++;
      inner = (pal[i + 1] as boolean[])[j - 1] as boolean;
      innerAt.set(`${i},${j}`, inner);
    }
    (pal[i] as boolean[])[j] = s[i] === s[j] && inner;
    done.add(`${i},${j}`);
  };
  if (order === "len") {
    for (let len = 2; len <= n; len++)
      for (let i = 0; i + len - 1 < n; i++) one(i, i + len - 1);
  } else if (order === "rowAsc") {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) one(i, j);
  } else if (order === "rowDesc") {
    for (let i = n - 1; i >= 0; i--) for (let j = i + 1; j < n; j++) one(i, j);
  } else {
    for (let j = 1; j < n; j++) for (let i = j - 1; i >= 0; i--) one(i, j);
  }
  if (n <= 1) return { pal, answer: 0, reads, innerAt };
  const cut = new Array<number>(n).fill(0);
  for (let e = 1; e < n; e++) {
    if ((pal[0] as boolean[])[e] as boolean) continue;
    let best = Number.POSITIVE_INFINITY;
    for (let b = 1; b <= e; b++) {
      if (!((pal[b] as boolean[])[e] as boolean)) continue;
      const candidate = (cut[b - 1] as number) + 1;
      if (candidate < best) best = candidate;
    }
    cut[e] = best;
  }
  return { pal, answer: cut[n - 1] as number, reads, innerAt };
}

/**
 * 구간마다 최소 컷을 적는 2 차원 표 — 행렬 체인과 같은 모양의 판. `M[i][j]` 는 `s[i…j]` 를 회문 조각으로만
 * 자를 때의 최소 컷 수이고, 구간이 회문이면 0, 아니면 가르는 자리 `k` 마다 `M[i][k] + 1 + M[k+1][j]` 의
 * 최소다. 판정은 정본의 판정 DP 테이블을 읽는다. 후보(`k` 하나)를 센다.
 */
export function intervalCut(s: string): { M: number[][]; cands: number } {
  const { pal } = trace(s);
  const n = s.length;
  const M = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  let cands = 0;
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      if ((pal[i] as boolean[])[j] as boolean) continue;
      let best = Number.POSITIVE_INFINITY;
      for (let k = i; k < j; k++) {
        cands++;
        const c =
          ((M[i] as number[])[k] as number) +
          1 +
          ((M[k + 1] as number[])[j] as number);
        if (c < best) best = c;
      }
      (M[i] as number[])[j] = best;
    }
  }
  return { M, cands };
}

/** 컷 DP 테이블이 후보를 비교한 횟수(③ 이 아닌 끝 자리에서 회문인 마지막 조각 수). */
export const candCount = (s: string): number =>
  trace(s).cutRecs.filter((r) => r.kind === "cand").length;

/* ───────────────── 무대 — 판정 DP 테이블(2 차원 표) ───────────────── */

/** 판정 DP 테이블 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const TABLE_OPTIONS: TableOptions = {
  rowHeads: Array.from({ length: N }, (_, r) => `i=${r} · ${WALK[r]}`),
  colHeads: Array.from({ length: N }, (_, c) => c),
  colLabel: "j",
  strip: {
    label: "s",
    values: [...WALK],
    side: `s = ${q(WALK)}`,
  },
};

/** 아래쪽 삼각형 — 구간이 아니라 쓰지 않는 칸. */
const LOWER: TableCell[] = (() => {
  const out: TableCell[] = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < i; j++) out.push([i, j]);
  return out;
})();

/** 줄 곁말 — 그 줄에서 쓰는 칸 가운데 정한 칸 수. */
const palSide = (rows: readonly (readonly (string | null)[])[]): string[] =>
  rows.map(
    (row, r) =>
      `채움 ${row.filter((v, c) => c >= r && v !== null).length} / ${N - r}`,
  );

/** 다 채운 판정 DP 테이블(무대 값) — 아래쪽 삼각형은 비운다. */
export function palValues(s: string = WALK): (string | null)[][] {
  const t = trace(s);
  return Array.from({ length: t.n }, (_, r) =>
    Array.from({ length: t.n }, (_, c) =>
      c < r ? null : tf((t.pal[r] as boolean[])[c] as boolean),
    ),
  );
}

/** 판정 칸 `(i, j)` 가 맡는 구간과 안쪽 — 문자열 줄에 거는 괄호. */
function palPieces(s: string, i: number, j: number): TablePiece[] {
  const t = trace(s);
  const out: TablePiece[] = [
    {
      label: "구간",
      from: i,
      to: j,
      tone: "query",
      text: sub(s, i, j),
      side: palName(i, j),
    },
  ];
  if (j - i + 1 > 2) {
    out.push({
      label: "안쪽",
      from: i + 1,
      to: j - 1,
      tone: "left",
      text: sub(s, i + 1, j - 1),
      side: `${palName(i + 1, j - 1)} = ${tf((t.pal[i + 1] as boolean[])[j - 1] as boolean)}`,
    });
  }
  return out;
}

/** 판정 칸 하나의 계산 한 줄. */
export function palCalc(
  s: string,
  r: PalRec,
): { expr: string; result: string } {
  const ends = `'${s[r.i]}' ${r.eq ? "=" : "≠"} '${s[r.j]}'`;
  const inner =
    r.len > 2 ? ` 이고 ${palName(r.i + 1, r.j - 1)} = ${tf(r.inner)}` : "";
  return { expr: `${ends}${inner} →`, result: tf(r.value) };
}

/** 판정 칸 하나의 한 줄 설명. */
function palDetail(s: string, r: PalRec): string {
  const piece = sub(s, r.i, r.j);
  const head = `구간 [${r.i},${r.j}] ${piece}${을를(piece)} 정합니다. 양 끝 s[${r.i}] = '${s[r.i]}'${과와(s[r.i] as string)} s[${r.j}] = '${s[r.j]}'${이가(s[r.j] as string)} ${r.eq ? "같습니다" : "다릅니다"}.`;
  const inner =
    r.len === 2
      ? " 길이 2 라 안쪽이 빈 구간이고 안쪽 칸을 읽지 않습니다."
      : ` 안쪽 ${palName(r.i + 1, r.j - 1)} ${sub(s, r.i + 1, r.j - 1)}${은는(sub(s, r.i + 1, r.j - 1))} ${tf(r.inner)} 입니다.`;
  return `${head}${inner} ${palName(r.i, r.j)} = ${tf(r.value)}${을를(tf(r.value))} 적습니다.`;
}

/* ───────────────── 무대 — 컷 DP 테이블(배열) ───────────────── */

export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "s",
  rangeLabel: "접두사",
};

/** 판정 DP 테이블의 열 `e` 한 줄 — `pal[b][e]` 를 `b` 자리에 놓는다. `b > e` 는 구간이 아니다. */
function palColumn(
  s: string,
  e: number,
  read: readonly number[] = [],
): ArrayLayer {
  const t = trace(s);
  return {
    name: "pal[b][e]",
    values: Array.from({ length: t.n }, (_, b) =>
      b <= e ? tf((t.pal[b] as boolean[])[e] as boolean) : "-",
    ),
    read,
    side: `e = ${e} 열`,
  };
}

/** 컷 DP 테이블 한 줄. */
function cutLayer(
  values: readonly (number | null)[],
  read: readonly number[] = [],
  write: readonly number[] = [],
): ArrayLayer {
  return { name: "cut", values, read, write };
}

/** 앞부분 `[0, b−1]` 과 마지막 조각 `[b, e]` — 쥔 접두사 아래에 거는 괄호. */
function cutPieces(s: string, e: number, b: number): ArrayPiece[] {
  const out: ArrayPiece[] = [];
  if (b > 0) {
    out.push({
      label: "앞부분",
      from: 0,
      to: b - 1,
      tone: "left",
      text: sub(s, 0, b - 1),
    });
  }
  out.push({
    label: "마지막 조각",
    from: b,
    to: e,
    tone: "right",
    text: sub(s, b, e),
  });
  return out;
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export type Step =
  | {
      readonly id: string;
      readonly title: string;
      readonly detail: string;
      readonly stage: "table";
      readonly step: TableStep;
    }
  | {
      readonly id: string;
      readonly title: string;
      readonly detail: string;
      readonly stage: "array";
      readonly step: ArrayStep;
    };

const MARK = { less: "④", notLess: "⑤" } as const;

/** 걸음 전부 — 대각선 · 판정 칸마다 · 컷 DP 테이블 깔기 · 컷 걸음마다 · 답 읽기. */
export function walkSteps(s: string = WALK): Step[] {
  const t = trace(s);
  const n = t.n;
  const rows: (string | null)[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => (c === r ? "T" : null)),
  );
  const snapshot = () => rows.map((r) => [...r]);
  const steps: Step[] = [];
  let k = 1;
  const diag: TableCell[] = Array.from({ length: n }, (_, r) => [r, r]);
  steps.push({
    id: `T${k++}`,
    title: "대각선 pal[i][i] = T ②",
    detail: `판정 DP 테이블을 ${n} × ${n}${josa(String(n), "으로", "로")} 만들고 거짓으로 채운 뒤 대각선 ${palName(0, 0)} … ${palName(n - 1, n - 1)}${을를(palName(n - 1, n - 1))} 참으로 바꿉니다. 길이 1 구간은 글자 하나라 언제나 회문입니다.`,
    stage: "table",
    step: {
      table: snapshot(),
      write: diag,
      out: LOWER,
      rowSide: palSide(rows),
      calc: { expr: "pal[i][i] =", result: "T" },
      vars: "len = 1",
    },
  });
  for (const r of t.palRecs) {
    (rows[r.i] as (string | null)[])[r.j] = tf(r.value);
    steps.push({
      id: `T${k++}`,
      title: `${palName(r.i, r.j)} ${sub(s, r.i, r.j)} = ${tf(r.value)}`,
      detail: palDetail(s, r),
      stage: "table",
      step: {
        table: snapshot(),
        read: r.len > 2 ? [[r.i + 1, r.j - 1]] : [],
        write: [[r.i, r.j]],
        out: LOWER,
        rowSide: palSide(rows),
        pieces: palPieces(s, r.i, r.j),
        calc: palCalc(s, r),
        vars: `len = ${r.len}`,
      },
    });
  }
  const cut: (number | null)[] = Array.from({ length: n }, (_, e) =>
    e === 0 ? 0 : null,
  );
  const array = [...s];
  steps.push({
    id: `T${k++}`,
    title: "cut[0] = 0",
    detail: `판정 DP 테이블이 다 찼습니다. 컷 DP 테이블을 칸 ${n} 개로 만들고 0 으로 채웁니다. ${cutName(0)}${은는(cutName(0))} 글자 하나짜리 접두사 ${sub(s, 0, 0)} 라 자를 자리가 없어, 깔아 둔 0 이 그대로 그 칸의 값입니다.`,
    stage: "array",
    step: {
      array,
      range: [0, 0],
      layers: [palColumn(s, 0), cutLayer([...cut], [], [0])],
      calc: { expr: `${cutName(0)} =`, result: "0" },
      vars: null,
    },
  });
  for (const r of t.cutRecs) {
    const pre = sub(s, 0, r.e);
    if (r.kind === "whole") {
      cut[r.e] = 0;
      steps.push({
        id: `T${k++}`,
        title: `e=${r.e} · 접두사 ${pre}${이가(pre)} 통째로 회문 ③`,
        detail: `${palName(0, r.e)} = T 라 접두사 ${pre}${이가(pre)} 통째로 회문입니다. ③ 후보를 하나도 세지 않고 ${cutName(r.e)} = 0 을 적습니다.`,
        stage: "array",
        step: {
          array,
          range: [0, r.e],
          pieces: cutPieces(s, r.e, 0),
          layers: [palColumn(s, r.e, [0]), cutLayer([...cut], [], [r.e])],
          calc: { expr: `${palName(0, r.e)} =`, result: "T" },
          vars: null,
        },
      });
      continue;
    }
    if (r.kind === "skip") {
      const piece = sub(s, r.b, r.e);
      steps.push({
        id: `T${k++}`,
        title: `e=${r.e} · b=${r.b} · ${piece}${은는(piece)} 회문이 아니다`,
        detail: `${palName(0, r.e)} = F 라 후보를 셉니다. 마지막 조각 ${piece} 의 ${palName(r.b, r.e)} = F 라 후보가 아니고, best 는 ${fmt(r.best)} 그대로입니다.`,
        stage: "array",
        step: {
          array,
          range: [0, r.e],
          pieces: cutPieces(s, r.e, r.b),
          layers: [palColumn(s, r.e, [r.b]), cutLayer([...cut])],
          calc: { expr: `${palName(r.b, r.e)} =`, result: "F" },
          vars: `best ${fmt(r.best)}`,
        },
      });
      continue;
    }
    if (r.last) cut[r.e] = r.after;
    const piece = sub(s, r.b, r.e);
    const cmp =
      r.branch === "less"
        ? `${r.candidate} < ${fmt(r.before)}${이가(fmt(r.before))} 참이라 ④ best 가 ${r.after}${이가(r.after)} 됩니다.`
        : `${r.candidate} < ${fmt(r.before)}${이가(fmt(r.before))} 거짓이라 ⑤ best 는 ${r.after} 그대로입니다.`;
    const end = r.last
      ? ` 시작 자리를 다 봤으니 ${cutName(r.e)} = ${r.after}${을를(r.after)} 적습니다.`
      : "";
    steps.push({
      id: `T${k++}`,
      title: `e=${r.e} · b=${r.b} · ${cutName(r.b - 1)} + 1 = ${r.candidate} ${MARK[r.branch]}`,
      detail: `마지막 조각 ${piece} 의 ${palName(r.b, r.e)} = T 라 후보입니다. 앞부분 ${sub(s, 0, r.b - 1)} 의 ${cutName(r.b - 1)} = ${r.prev} 에 컷 하나를 더해 후보는 ${r.candidate} 입니다. ${cmp}${end}`,
      stage: "array",
      step: {
        array,
        range: [0, r.e],
        pieces: cutPieces(s, r.e, r.b),
        layers: [
          palColumn(s, r.e, [r.b]),
          cutLayer([...cut], [r.b - 1], r.last ? [r.e] : []),
        ],
        calc: {
          expr: `${cutName(r.b - 1)} + 1 = ${r.prev} + 1 =`,
          result: String(r.candidate),
        },
        vars: `best ${fmt(r.before)} → ${fmt(r.after)}`,
      },
    });
  }
  const last = t.result;
  steps.push({
    id: `T${k++}`,
    title: `${cutName(n - 1)} = ${last} 반환`,
    detail: `문자열 전체가 접두사 ${sub(s, 0, n - 1)} 이고 그 칸이 ${cutName(n - 1)} 입니다. 값 ${last}${을를(last)} 돌려줍니다.`,
    stage: "array",
    step: {
      array,
      range: [0, n - 1],
      layers: [palColumn(s, n - 1), cutLayer([...cut], [n - 1])],
      calc: { expr: `${cutName(n - 1)} =`, result: String(last) },
      vars: null,
    },
  });
  return steps;
}

/**
 * 필름과 패널을 가르는 자리 — 판정 DP 테이블은 대각선과 길이 2 · 그 뒤로, 컷 DP 테이블은 마지막 끝 자리
 * 앞 · 마지막 끝 자리와 답으로.
 */
export function walkParts(): {
  palShort: Step[];
  palLong: Step[];
  cutFirst: Step[];
  cutLast: Step[];
} {
  const all = walkSteps();
  const t = trace(WALK);
  const a = 1 + t.palRecs.filter((r) => r.len === 2).length;
  const b = 1 + t.palRecs.length;
  const c = b + 1 + t.cutRecs.filter((r) => r.e < t.n - 1).length;
  return {
    palShort: all.slice(0, a),
    palLong: all.slice(a, b),
    cutFirst: all.slice(b, c),
    cutLast: all.slice(c),
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `palindromePartitioningMinCut-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const toStep = (s: Step) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...s.step,
  });
  const parts = walkParts();
  return {
    palShort: parts.palShort.map(toStep),
    palLong: parts.palLong.map(toStep),
    cutFirst: parts.cutFirst.map(toStep),
    cutLast: parts.cutLast.map(toStep),
  };
}

/** 패널 `result` — 판정 벌은 그 벌에서 정한 칸의 값, 앞 컷 벌은 그때까지의 컷 칸, 마지막 벌은 반환값. */
export function simResults(): {
  palShort: string;
  palLong: string;
  cutFirst: string;
  cutLast: string;
} {
  const t = trace(WALK);
  const pal = (f: (r: PalRec) => boolean) =>
    `[${t.palRecs
      .filter(f)
      .map((r) => tf(r.value))
      .join(", ")}]`;
  return {
    palShort: pal((r) => r.len === 2),
    palLong: pal((r) => r.len > 2),
    cutFirst: `[${t.cut.slice(0, t.n - 1).join(", ")}]`,
    cutLast: String(t.result),
  };
}

const film = (steps: Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows:
      s.stage === "table"
        ? tableStage(s.step, TABLE_OPTIONS)
        : arrayStage(s.step, ARRAY_OPTIONS),
  }));

/* ───────────────── 정적 한 장 ───────────────── */

/** 다 채운 판정 DP 테이블 한 장. 줄 곁말은 그 줄의 참인 칸 수다. */
function fullPal(extra: Partial<TableStep>, s: string = WALK): StageRow[] {
  const values = palValues(s);
  return tableStage(
    {
      table: values,
      out: LOWER,
      rowSide: values.map(
        (row) => `참 ${row.filter((v) => v === "T").length} 칸`,
      ),
      ...extra,
    },
    TABLE_OPTIONS,
  );
}

/** 다 채운 컷 DP 테이블 한 장. */
function fullCut(extra: Partial<ArrayStep>): StageRow[] {
  const t = trace(WALK);
  return arrayStage(
    {
      array: [...WALK],
      range: [0, N - 1],
      layers: [cutLayer([...t.cut])],
      ...extra,
    },
    ARRAY_OPTIONS,
  );
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

function approaches(): Approach[] {
  const naive = naiveSplit(same(20)).ops;
  const every = judgeEveryTime(same(N_MAX)).ops;
  const dpOps = opsOf(same(N_MAX)).total;
  const sample = "noonracecar";
  const row = fillByOrder(sample, "rowAsc").answer;
  const ans = palindromePartitioningMinCut(sample);
  const worstOps = opsOf(headDiff(N_MAX)).total;
  return [
    {
      name: "자를 자리를 전부 시험하는 재귀",
      idea: "첫 조각을 하나씩 떼어 보고, 나머지를 같은 방법으로 다시 푼다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `글자가 다 같은 20 글자에서 기본 동작 ${comma(naive)} 번 · ${comma(N_MAX)} 글자면 분할 ${big(2n ** BigInt(N_MAX - 1))} 가지`,
          ok: false,
        },
      ],
      lesson:
        "끝 자리가 같은 접두사는 어디서 내려왔든 답이 같다 — 접두사마다 값을 한 번만 적어 두면 어떨까",
    },
    {
      name: "접두사마다 한 칸 · 회문은 물을 때마다 대조",
      idea: "cut[e] 를 끝 자리 차례로 적고, s[b…e] 가 회문인지는 그때마다 양 끝에서 대조한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `글자가 다 같은 ${comma(N_MAX)} 글자에서 기본 동작 ${comma(every)} 번`,
          ok: false,
        },
      ],
      lesson:
        "같은 구간이 회문인지를 여러 후보가 다시 묻는다 — 구간마다 판정을 한 번만 적어 두면 어떨까",
    },
    {
      name: "판정 DP 테이블 · 줄 차례로 채우기",
      idea: "pal[i][j] 를 i 를 0 부터 · j 를 i 부터 채운 뒤 컷 DP 테이블이 읽는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `${q(sample)} 의 최소가 ${ans}${이가(ans)} 아니라 ${row}`,
          ok: false,
        },
        {
          label: "시간",
          value: `글자가 다 같은 ${comma(N_MAX)} 글자에서 기본 동작 ${comma(dpOps)} 번`,
          ok: true,
        },
      ],
      lesson:
        "판정 칸이 읽는 안쪽 칸은 언제나 더 짧은 구간이다 — 짧은 구간부터 채우면 어떨까",
    },
    {
      name: "구간 길이 차례의 판정 DP 테이블 + 끝 자리 차례의 컷 DP 테이블",
      idea: "판정 DP 테이블을 구간 길이가 짧은 칸부터 다 채운 뒤, 컷 DP 테이블을 끝 자리 차례로 채운다",
      verdict: "keep",
      checks: [
        { label: "답", value: `${ans} — 맞다`, ok: true },
        {
          label: "시간",
          value: `${comma(N_MAX)} 글자에서 기본 동작 많아야 ${comma(worstOps)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-cut": () => {
    const t = trace(WALK);
    return (
      <CellStage
        title={`palindromePartitioningMinCut(${q(WALK)}) 의 컷 DP 테이블 — 칸 e 는 접두사 s[0…e]`}
        rows={fullCut({
          layers: [
            {
              name: "cut",
              values: [...t.cut],
              write: [N - 1],
              side: `답 ${cutName(N - 1)}`,
            },
          ],
        })}
        columns={N}
      />
    );
  },
  "concept-pal": () => (
    <CellStage
      title={`palindromePartitioningMinCut(${q(WALK)}) 의 판정 DP 테이블 — 칸 (i, j) 는 구간 s[i…j]`}
      rows={fullPal({})}
      columns={N}
    />
  ),
  "concept-rule": () => {
    const t = trace(WALK);
    const e = N - 1;
    const frames: StageFrame[] = [];
    frames.push({
      id: "b=0",
      text: `${palName(0, e)} = ${tf((t.pal[0] as boolean[])[e] as boolean)} — 접두사 ${sub(WALK, 0, e)}${이가(sub(WALK, 0, e))} 통째로 회문인가`,
      rows: fullCut({
        pieces: cutPieces(WALK, e, 0),
        layers: [palColumn(WALK, e, [0]), cutLayer([...t.cut], [], [e])],
      }),
    });
    for (let b = 1; b <= e; b++) {
      const ok = (t.pal[b] as boolean[])[e] as boolean;
      frames.push({
        id: `b=${b}`,
        text: ok
          ? `${palName(b, e)} = T · ${cutName(b - 1)} + 1 = ${(t.cut[b - 1] as number) + 1}`
          : `${palName(b, e)} = F — 마지막 조각 ${sub(WALK, b, e)}${이가(sub(WALK, b, e))} 회문이 아니라 후보가 아니다`,
        rows: fullCut({
          pieces: cutPieces(WALK, e, b),
          layers: [
            palColumn(WALK, e, [b]),
            cutLayer([...t.cut], ok ? [b - 1] : [], [e]),
          ],
        }),
      });
    }
    return (
      <CellStageFilm
        title={`${cutName(e)} 를 정하는 자리 — 마지막 조각의 시작 자리 b 마다 판정 칸 하나와 컷 칸 하나를 읽는다`}
        columns={N}
        frames={frames}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`글자 ${comma(N_MAX)} 개까지 · 영문 소문자`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-pal-read": () => {
    const i = 1;
    const j = N - 1;
    const out: TableCell[] = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (!(r === i && c === j) && !(r === i + 1 && c === j - 1))
          out.push([r, c]);
    return (
      <CellStage
        title={`${palName(i, j)} — 구간 [${i},${j}] ${sub(WALK, i, j)} 가 회문인가`}
        rows={fullPal({
          write: [[i, j]],
          read: [[i + 1, j - 1]],
          out,
          pieces: palPieces(WALK, i, j),
        })}
        columns={N}
      />
    );
  },
  "build-pal-diagonals": () => (
    <CellStageFilm
      title="대각선 하나가 구간 길이 하나 — 길이 len 인 칸은 n − len + 1 개"
      columns={N}
      frames={Array.from({ length: N }, (_, t) => {
        const len = t + 1;
        const cells: TableCell[] = [];
        for (let i = 0; i + len - 1 < N; i++) cells.push([i, i + len - 1]);
        const trues = cells.filter(
          ([i, j]) => (trace(WALK).pal[i] as boolean[])[j] as boolean,
        );
        return {
          id: `len=${len}`,
          text: `구간 길이 ${len} · 칸 ${cells.length} 개 · 참 ${trues.length} 칸`,
          rows: fullPal({ write: cells }),
        };
      })}
    />
  ),
  "build-pal-contrast": () => {
    const good = palValues();
    const bad = fillByOrder(WALK, "rowAsc").pal;
    const read: TableCell[] = [];
    const badValues = good.map((row, r) =>
      row.map((v, c) => {
        if (v === null) return null;
        const w = tf((bad[r] as boolean[])[c] as boolean);
        if (w !== v) read.push([r, c]);
        return w;
      }),
    );
    const opts = { ...TABLE_OPTIONS, strip: undefined };
    const frames: StageFrame[] = [
      {
        id: "길이",
        text: "구간 길이가 짧은 칸부터 채운 판정 DP 테이블",
        rows: tableStage(
          { table: good, out: LOWER, read, rowSide: good.map(() => "") },
          opts,
        ),
      },
      {
        id: "줄",
        text: "i 를 0 부터 · j 를 i 부터 채운 판 — 진한 테가 앞 장과 값이 다른 칸",
        rows: tableStage(
          { table: badValues, out: LOWER, read, rowSide: good.map(() => "") },
          opts,
        ),
      },
    ];
    return (
      <CellStageFilm
        title={`같은 입력 ${q(WALK)} — 채우는 차례만 바꾼 두 판정 DP 테이블`}
        columns={N}
        frames={frames}
      />
    );
  },
  "build-cut-prefixes": () => {
    const t = trace(WALK);
    return (
      <CellStageFilm
        title={`컷 DP 테이블의 칸 다섯 — 칸 e 는 접두사 s[0…e] 를 가장 적게 자른 컷 수`}
        columns={N}
        frames={Array.from({ length: N }, (_, e) => {
          const ps = piecesOf(WALK, e);
          return {
            id: `e=${e}`,
            text: `${cutName(e)} = ${t.cut[e]} · ${piecesText(WALK, ps)}`,
            rows: arrayStage(
              {
                array: [...WALK],
                range: [0, e],
                pieces: ps.map(([a, b], x) => ({
                  label: `조각 ${x + 1}`,
                  from: a,
                  to: b,
                  tone: x % 2 === 0 ? "left" : "right",
                  text: sub(WALK, a, b),
                })),
                layers: [cutLayer([...t.cut], [], [e])],
              },
              ARRAY_OPTIONS,
            ),
          };
        })}
      />
    );
  },
  "build-cut-reads": () => {
    const t = trace(WALK);
    return (
      <CellStageFilm
        title="컷 칸 하나가 읽는 칸 — 판정 DP 테이블의 열 e 와, 회문인 마지막 조각 앞의 컷 칸"
        columns={N}
        frames={Array.from({ length: N - 1 }, (_, x) => {
          const e = x + 1;
          const whole = (t.pal[0] as boolean[])[e] as boolean;
          const bs: number[] = [];
          if (!whole)
            for (let b = 1; b <= e; b++)
              if ((t.pal[b] as boolean[])[e] as boolean) bs.push(b);
          return {
            id: `e=${e}`,
            text: whole
              ? `${palName(0, e)} = T — 컷 칸을 하나도 안 읽는다`
              : `읽는 컷 칸 ${bs.map((b) => cutName(b - 1)).join(" · ")}`,
            rows: arrayStage(
              {
                array: [...WALK],
                range: [0, e],
                layers: [
                  palColumn(
                    WALK,
                    e,
                    whole ? [0] : Array.from({ length: e + 1 }, (_, b) => b),
                  ),
                  cutLayer(
                    [...t.cut],
                    bs.map((b) => b - 1),
                    [e],
                  ),
                ],
              },
              ARRAY_OPTIONS,
            ),
          };
        })}
      />
    );
  },
  "build-cut-interval": () => {
    const { M } = intervalCut(WALK);
    const t = trace(WALK);
    const values = M.map((row, r) =>
      row.map((v, c) => (c < r ? null : String(v))),
    );
    return (
      <CellStage
        title="구간마다 최소 컷을 적은 2 차원 표 — 첫 줄이 컷 DP 테이블과 같다"
        rows={tableStage(
          {
            table: values,
            out: LOWER,
            write: Array.from({ length: N }, (_, c) => [0, c] as TableCell),
            rowSide: values.map((_, r) => `s[${r}…] 에서 시작`),
          },
          {
            ...TABLE_OPTIONS,
            strip: {
              label: "cut",
              values: [...t.cut],
              side: "컷 DP 테이블",
            },
          },
        )}
        columns={N}
      />
    );
  },
  "walk-pal-short": () => {
    const s = walkParts().palShort;
    return (
      <CellStageFilm
        title={`palindromePartitioningMinCut(${q(WALK)}) — ${s[0]?.id}~${s.at(-1)?.id} · 대각선과 구간 길이 2`}
        columns={N}
        frames={film(s)}
      />
    );
  },
  "walk-pal-long": () => {
    const s = walkParts().palLong;
    return (
      <CellStageFilm
        title={`palindromePartitioningMinCut(${q(WALK)}) — ${s[0]?.id}~${s.at(-1)?.id} · 구간 길이 3 부터 ${N} 까지`}
        columns={N}
        frames={film(s)}
      />
    );
  },
  "walk-cut-first": () => {
    const s = walkParts().cutFirst;
    return (
      <CellStageFilm
        title={`palindromePartitioningMinCut(${q(WALK)}) — ${s[0]?.id}~${s.at(-1)?.id} · 컷 DP 테이블의 끝 자리 0 부터 ${N - 2} 까지`}
        columns={N}
        frames={film(s)}
      />
    );
  },
  "walk-cut-last": () => {
    const s = walkParts().cutLast;
    return (
      <CellStageFilm
        title={`palindromePartitioningMinCut(${q(WALK)}) — ${s[0]?.id}~${s.at(-1)?.id} · 끝 자리 ${N - 1} 과 답`}
        columns={N}
        frames={film(s)}
      />
    );
  },
};
