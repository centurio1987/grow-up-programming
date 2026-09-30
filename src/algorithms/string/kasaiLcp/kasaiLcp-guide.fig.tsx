/**
 * `kasaiLcp-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 자리마다 적는 길이는 정본 소스에서
 * 기계로 만든 계측 사본(`logged`)이 기록한다. 자리 하나 안의 걸음(이웃 찾기 · 글자 비교 · 적기 · 넘기기)은
 * 같은 절차를 다시 쓴 `replay` 가 만들고, `trace` 가 자리마다 적은 값을 계측 기록과 대조한다. 걸음 재생
 * 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `kasaiLcp-guide.test.ts` 가 잰다.
 *
 * `replay` 는 계측이 없는 다시 쓰기라 변이를 중화한 실행(`check-proof` 가 두 번째로 부르는 실행)에서도
 * 값이 나온다. 중화 실행에서는 계측 사본이 정본 그대로라 기록이 비고 `trace` 가 던진다 — 그래서 판정
 * 줄(「같다」·「어긋난다」)이 있는 증명 블록은 `trace` 를 부르지 않는다.
 *
 * 비용은 원고 전체에서 **자료 접근** 하나로 센다 — 배열 칸을 읽거나 쓴 횟수와 문자열 글자를 읽은 횟수의
 * 합이다. 접미사 배열 편과 같은 기준이다. 칸을 잡으며 0 으로 채우는 일은 세지 않는다. 계수기(`count*`)는
 * 정본과 같은 줄 순서에 셈만 덧붙인 것이고, 부를 때마다 답을 정본이나 정의와 대조한다. 큰 입력에서는
 * 자리마다 기록을 남기지 않는다 — 기록이 걸음마다 배열을 베끼면 메모리가 모자란다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  CellStage,
  CellStageFilm,
  type StageFrame,
  type StageRow,
} from "../../../_viz/patterns/CellStage";
import { LayerBars } from "../../../_viz/patterns/LayerBars";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { suffixArray } from "../suffixArray/suffixArray-guide.ref.ts";
import { kasaiLcp } from "./kasaiLcp-guide.ref.ts";

const REF = new URL("./kasaiLcp-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 공용 값 ───────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 여섯 글자 안에서 여섯 갈래가 모두 실행되고(순위 배열 · 이웃 없음 · 이웃
 * 찾기 · 글자 비교 · 적기 · 하나 줄이기), 비교가 멈추는 두 까닭(글자가 다르다 · 문자열 끝을 넘었다)이 둘 다
 * 나온다. 이어받은 길이가 글자 비교를 통째로 없애는 자리도 둘 있다.
 */
export const WALK = "banana";

/** 과제 규모의 상한 — 접미사 배열 편과 같다. */
export const LIMIT = 100_000;

/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
export const OPS_PER_SEC = 1e8;

export const show = (xs: readonly (number | string)[]): string =>
  `[${xs.join(", ")}]`;
export const num = (x: number): string => x.toLocaleString("en-US");

const same = (x: readonly number[], y: readonly number[]): boolean =>
  x.length === y.length && x.every((v, k) => v === y[k]);

const SA_MEMO = new Map<string, number[]>();

/** 문자열의 접미사 배열 — 접미사 배열 편의 정본이 만든다. 같은 문자열은 한 번만 만든다. */
export function saOf(s: string): number[] {
  const hit = SA_MEMO.get(s);
  if (hit !== undefined) return hit;
  const sa = suffixArray(s);
  SA_MEMO.set(s, sa);
  return sa;
}

/** 결정론적 입력 — mulberry32(씨앗 `0x9e3779b9`). 접미사 배열 편과 같은 생성식이다. */
export function makeText(n: number, sigma: number): string {
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

/** 피보나치 문자열 — `f(1) = b`, `f(2) = a`, `f(k) = f(k−1) + f(k−2)` 의 앞 `n` 글자. */
export function fibonacciWord(n: number): string {
  let a = "b";
  let b = "a";
  while (b.length < n) {
    const c = b + a;
    a = b;
    b = c;
  }
  return b.slice(0, n);
}

/** 본문이 쓰는 입력 모양 — 이름과 생성식. 접미사 배열 편의 「최악을 만드는 입력」과 같은 모양이다. */
export const SHAPES: readonly (readonly [string, (n: number) => string])[] = [
  ["전부 같은 글자", (n) => "a".repeat(n)],
  ["두 글자가 번갈아 나온다", (n) => "ab".repeat(Math.ceil(n / 2)).slice(0, n)],
  ["앞이 다 같고 끝만 다르다", (n) => `${"a".repeat(n - 1)}b`],
  [
    "여섯 글자가 되풀이된다",
    (n) => "abcabb".repeat(Math.ceil(n / 6)).slice(0, n),
  ],
  ["피보나치 문자열", fibonacciWord],
  ["무작위 두 글자", (n) => makeText(n, 2)],
  ["무작위 26 글자", (n) => makeText(n, 26)],
  [
    "글자가 오름차순으로 늘어선다",
    (n) => makeText(n, 26).split("").sort().join(""),
  ],
];

export const shape = (name: string, n: number): string => {
  const hit = SHAPES.find(([label]) => label === name);
  if (hit === undefined) throw new Error(`없는 입력 모양 — ${name}`);
  return hit[1](n);
};

/** 정의를 그대로 옮긴 답 — 이웃한 두 칸의 접미사를 앞에서부터 비교한다. 계측 없는 기준이다. */
export function byDefinition(s: string, sa: readonly number[]): number[] {
  const n = s.length;
  const out = new Array<number>(n).fill(0);
  for (let r = 0; r + 1 < n; r++) {
    const a = sa[r] as number;
    const b = sa[r + 1] as number;
    let t = 0;
    while (a + t < n && b + t < n && s[a + t] === s[b + t]) t++;
    out[r] = t;
  }
  return out;
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 자리 하나가 답을 적은 순간의 기록 — 계측 사본이 `lcp[rank[i]] = len;` 바로 뒤에서 남긴다. */
interface WriteLog {
  readonly i: number;
  readonly j: number;
  readonly k: number;
}

type Log = { __kasaiLog?: WriteLog[] };

const logged = await loadMutant<{
  kasaiLcp(s: string, sa: number[]): number[];
}>(REF, {
  swap: [
    /^(\s*)lcp\[rank\[i\] as number\] = len;$/,
    "$1lcp[rank[i] as number] = len;\n$1(globalThis as unknown as { __kasaiLog?: { i: number; j: number; k: number }[] }).__kasaiLog?.push({ i, j, k: len });",
  ],
});

/* ───────────────── 같은 절차 — 자리마다 기록하며 ───────────────── */

/** 자리 하나를 처리한 기록. */
export interface Row {
  readonly i: number;
  /** `rank[i]` — 이 자리의 접미사가 `sa` 의 몇 번째 칸인가. */
  readonly rank: number;
  /** 이웃이 시작하는 자리. 이웃이 없으면 `null`. */
  readonly j: number | null;
  /** 이 자리에 들어올 때의 `len`. */
  readonly kIn: number;
  /** 글자가 같아 `len` 을 늘린 횟수. */
  readonly eq: number;
  /** 글자가 달라 멈춘 비교 — 0 또는 1. */
  readonly ne: number;
  /** 왜 멈췄는가. 이웃이 없으면 `null`. */
  readonly stop: "differ" | "end" | null;
  /** 적은 길이 `h(i)`. 이웃이 없으면 `null`. */
  readonly h: number | null;
  /** 다음 자리로 넘긴 `len`. */
  readonly kOut: number;
}

export interface Replay {
  readonly s: string;
  readonly sa: readonly number[];
  readonly inv: readonly number[];
  readonly rows: readonly Row[];
  readonly lcp: readonly number[];
}

/**
 * 정본과 같은 절차를 자리마다 멈춰 기록한다. 계측이 없어 중화 실행에서도 값이 나온다. `drop` 은 적은 뒤에
 * `len` 에서 빼는 양이고 정본은 1 이다 — 1 이면 답을 정본과 대조한다. 0 은 「그대로 이어받기」 후보를 잰다.
 */
export function replay(
  s: string,
  sa: readonly number[] = saOf(s),
  drop = 1,
): Replay {
  const n = s.length;
  const lcp = new Array<number>(n).fill(0);
  const inv = new Array<number>(n).fill(0);
  for (let r = 0; r < n; r++) inv[sa[r] as number] = r;
  const rows: Row[] = [];
  let k = 0;
  for (let i = 0; i < n; i++) {
    const rank = inv[i] as number;
    const kIn = k;
    if (rank === n - 1) {
      k = 0;
      rows.push({
        i,
        rank,
        j: null,
        kIn,
        eq: 0,
        ne: 0,
        stop: null,
        h: null,
        kOut: 0,
      });
      continue;
    }
    const j = sa[rank + 1] as number;
    let eq = 0;
    let ne = 0;
    let stop: "differ" | "end" = "end";
    for (;;) {
      if (i + k >= n || j + k >= n) break;
      if (s[i + k] !== s[j + k]) {
        ne = 1;
        stop = "differ";
        break;
      }
      eq++;
      k++;
    }
    lcp[rank] = k;
    const h = k;
    if (k > 0) k = Math.max(0, k - drop);
    rows.push({ i, rank, j, kIn, eq, ne, stop, h, kOut: k });
  }
  if (drop === 1 && !same(lcp, kasaiLcp(s, [...sa]))) {
    throw new Error(`다시 쓴 절차가 정본과 다른 답을 냈다 — "${s}"`);
  }
  return { s, sa: [...sa], inv, rows, lcp };
}

/** `replay` 를 정본 계측 기록과 자리마다 대조한다. 어긋나면 다른 절차를 기록한 것이라 던진다. */
export function trace(s: string, sa: readonly number[] = saOf(s)): Replay {
  const r = replay(s, sa);
  const g = globalThis as unknown as Log;
  g.__kasaiLog = [];
  const byLog = logged.kasaiLcp(s, [...sa]);
  const log = g.__kasaiLog;
  g.__kasaiLog = undefined;
  const ref = kasaiLcp(s, [...sa]);
  if (!same(byLog, ref) || !same(r.lcp, ref)) {
    throw new Error(
      `계측 사본이나 다시 쓴 절차가 정본과 다른 답을 냈다 — "${s}"`,
    );
  }
  const wrote = r.rows.filter((row) => row.j !== null);
  if (log.length !== wrote.length) {
    throw new Error(
      `답을 적은 자리 수가 정본 기록과 다르다 — 기록 ${log.length} · 다시 쓴 절차 ${wrote.length}`,
    );
  }
  wrote.forEach((row, at) => {
    const e = log[at] as WriteLog;
    if (e.i !== row.i || e.j !== row.j || e.k !== row.h) {
      throw new Error(`자리 ${row.i} 의 기록이 정본과 다르다 — "${s}"`);
    }
  });
  return r;
}

let walkMemo: Replay | undefined;
/** 전개 입력의 기록 — 정본 계측과 대조한 것. */
export const walkRun = (): Replay => {
  walkMemo ??= trace(WALK);
  return walkMemo;
};

/* ───────────────────────── 계수기 ───────────────────────── */

/** 셈 한 벌 — 글자 비교 두 갈래와 자료 접근. */
export interface Cost {
  readonly lcp: number[];
  /** 글자가 같아 `len` 을 늘린 비교. */
  readonly eq: number;
  /** 글자가 달라 멈춘 비교. 문자열 끝이라 멈춘 자리는 글자를 안 읽는다. */
  readonly ne: number;
  /** 배열 칸 읽기 · 쓰기와 글자 읽기의 합. */
  readonly access: number;
}

/**
 * 길이 이어받기에 셈만 덧붙인 것 — 정본과 같은 줄 순서다. 칸 접근은 정본이 적은 대로 센다. `rank[sa[k]] = k`
 * 이 두 번(`sa` 읽기 · `rank` 쓰기), 자리마다 `rank[i]` 읽기 한 번, 이웃이 있으면 `sa[rank[i] + 1]` 이 두 번,
 * `lcp[rank[i]] = len` 이 두 번이다. 글자 비교 하나는 글자 둘을 읽는다.
 *
 * `drop` 은 적은 뒤에 `len` 에서 빼는 양이다. **정본은 `drop = 1`** 이고, `Infinity` 면 자리마다 0 에서 다시
 * 센다. 그 밖의 값은 아이디어 상세가 「하나만 줄이는 까닭」을 값으로 내는 데 쓴다.
 */
export function countKasai(s: string, sa: readonly number[], drop = 1): Cost {
  const n = s.length;
  const lcp = new Array<number>(n).fill(0);
  const inv = new Array<number>(n).fill(0);
  let access = 0;
  for (let r = 0; r < n; r++) {
    inv[sa[r] as number] = r;
    access += 2;
  }
  let eq = 0;
  let ne = 0;
  let k = 0;
  for (let i = 0; i < n; i++) {
    const rank = inv[i] as number;
    access++;
    if (rank === n - 1) {
      k = 0;
      continue;
    }
    const j = sa[rank + 1] as number;
    access += 2;
    for (;;) {
      if (i + k >= n || j + k >= n) break;
      access += 2;
      if (s[i + k] !== s[j + k]) {
        ne++;
        break;
      }
      eq++;
      k++;
    }
    lcp[rank] = k;
    access += 2;
    if (k > 0) k = Math.max(0, k - drop);
  }
  if (drop === 1 && !same(lcp, kasaiLcp(s, [...sa]))) {
    throw new Error("길이 이어받기 계수기와 정본의 답이 다르다");
  }
  return { lcp, eq, ne, access };
}

/**
 * 짝마다 처음부터 비교하는 방법 — 이웃한 두 칸 `sa[k]` · `sa[k+1]` 을 읽고(두 번), 글자를 비교하고(한 번에
 * 둘), `lcp[k]` 에 쓴다(한 번). 답은 정의와 같은지 대조한다.
 */
export function countPairwise(s: string, sa: readonly number[]): Cost {
  const n = s.length;
  const lcp = new Array<number>(n).fill(0);
  let access = 0;
  let eq = 0;
  let ne = 0;
  for (let r = 0; r + 1 < n; r++) {
    const a = sa[r] as number;
    const b = sa[r + 1] as number;
    access += 2;
    let t = 0;
    for (;;) {
      if (a + t >= n || b + t >= n) break;
      access += 2;
      if (s[a + t] !== s[b + t]) {
        ne++;
        break;
      }
      eq++;
      t++;
    }
    lcp[r] = t;
    access++;
  }
  if (!same(lcp, kasaiLcp(s, [...sa]))) {
    throw new Error("짝마다 비교하는 계수기와 정본의 답이 다르다");
  }
  return { lcp, eq, ne, access };
}

/**
 * 짝마다 처음부터 비교하는 방법의 셈을 **글자를 하나씩 읽지 않고** 낸다. 짝 `k` 의 비교는 같은 글자
 * `lcp[k]` 번과, 두 접미사가 다 남아 있으면 다른 글자 한 번이다. `lcp` 는 정본이 낸다. 전부 같은 글자
 * 10 만 개처럼 실제로 읽으면 50 억 번을 도는 입력에 쓴다. 작은 입력에서는 실제로 읽은 셈과 같은지 대조한다.
 */
export function pairwiseByLcp(s: string, sa: readonly number[]): Cost {
  const n = s.length;
  const lcp = kasaiLcp(s, [...sa]);
  let eq = 0;
  let ne = 0;
  for (let r = 0; r + 1 < n; r++) {
    const a = sa[r] as number;
    const b = sa[r + 1] as number;
    const t = lcp[r] as number;
    eq += t;
    if (a + t < n && b + t < n) ne++;
  }
  const access = 3 * (n - 1) + 2 * (eq + ne);
  if (n <= 2_000) {
    const real = countPairwise(s, sa);
    if (real.access !== access || real.eq !== eq || real.ne !== ne) {
      throw new Error(`닫은 셈이 실제로 읽은 셈과 다르다 — n = ${n}`);
    }
  }
  return { lcp, eq, ne, access };
}

/* ───────────────── 사다리 값 — 증명 블록과 그림이 같은 셈을 쓴다 ───────────────── */

export interface OriginCounts {
  readonly pairwiseAllSame: Cost;
  readonly freshAllSame: Cost;
  readonly kasaiAllSame: Cost;
  /** 줄이지 않고 그대로 이어받은 사본이 전개 입력에서 낸 답. */
  readonly keepWalk: readonly number[];
}

let originMemo: OriginCounts | undefined;
export function originCounts(): OriginCounts {
  if (originMemo !== undefined) return originMemo;
  const big = "a".repeat(LIMIT);
  const sa = saOf(big);
  const walkSa = saOf(WALK);
  originMemo = {
    pairwiseAllSame: pairwiseByLcp(big, sa),
    // 자리 순서로 가되 자리마다 0 에서 다시 세면 비교가 짝마다 세는 방법과 같다 — 짝이 같고 순서만 다르다.
    freshAllSame: freshByLcp(big, sa),
    kasaiAllSame: countKasai(big, sa),
    keepWalk: countKasai(WALK, walkSa, 0).lcp,
  };
  return originMemo;
}

/**
 * 자리 순서로 가되 자리마다 0 에서 다시 세는 방법의 셈을 글자를 읽지 않고 낸다. 자리 `i` 는 이웃과의
 * 짝 하나를 비교하므로 비교 수는 짝마다 세는 방법과 같고, 칸 접근은 길이 이어받기와 같은 줄 구조다.
 */
export function freshByLcp(s: string, sa: readonly number[]): Cost {
  const n = s.length;
  const p = pairwiseByLcp(s, sa);
  const access = 2 * n + 5 * (n - 1) + 1 + 2 * (p.eq + p.ne);
  if (n <= 2_000) {
    const real = countKasai(s, sa, Number.POSITIVE_INFINITY);
    if (real.access !== access || real.eq !== p.eq || real.ne !== p.ne) {
      throw new Error(`닫은 셈이 실제로 읽은 셈과 다르다 — n = ${n}`);
    }
  }
  return { lcp: p.lcp, eq: p.eq, ne: p.ne, access };
}

const seconds = (access: number): string =>
  `${num(Math.round(access / OPS_PER_SEC))} 초`;

function approaches(): Approach[] {
  const c = originCounts();
  const want = kasaiLcp(WALK, saOf(WALK));
  return [
    {
      name: "짝마다 처음부터 비교하기",
      idea: "sa 의 이웃한 두 칸을 꺼내 두 접미사를 앞에서부터 한 글자씩 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `전부 같은 글자에서 자료 접근 ${num(c.pairwiseAllSame.access)} 번 · ${seconds(c.pairwiseAllSame.access)}`,
          ok: false,
        },
      ],
      lesson: "앞 짝에서 같다고 확인한 글자를 뒤 짝이 처음부터 다시 읽는다",
    },
    {
      name: "문자열 자리 순서로 짝을 고르기",
      idea: "자리 i 를 0 부터 차례로 보며 그 접미사와 sa 에서 바로 뒤 칸의 접미사를 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `전부 같은 글자에서 자료 접근 ${num(c.freshAllSame.access)} 번 · ${seconds(c.freshAllSame.access)}`,
          ok: false,
        },
      ],
      lesson:
        "순서만 바꿔서는 비교가 줄지 않는다 — 다음 접미사는 이번 것에서 첫 글자만 뺀 것이다",
    },
    {
      name: "앞 자리의 길이를 그대로 이어받기",
      idea: "자리 i 에서 구한 길이 len 을 자리 i+1 의 비교 시작값으로 그대로 쓴다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `"${WALK}" 에서 ${show(c.keepWalk)} — 바른 답은 ${show(want)}`,
          ok: false,
        },
      ],
      lesson:
        "접미사가 한 글자 짧아졌으니 함께 가지는 앞부분도 한 글자 짧아진다",
    },
    {
      name: "앞 자리의 길이에서 하나 줄여 이어받기",
      idea: "자리 i 에서 구한 길이에서 1 을 뺀 값부터 자리 i+1 의 비교를 이어 간다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `전부 같은 글자에서 자료 접근 ${num(c.kasaiAllSame.access)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly kind: "init" | "place" | "done";
  /** 자리 걸음의 기록. */
  readonly row: Row | null;
  readonly title: string;
  readonly detail: string;
  /** 이 걸음이 끝난 뒤의 `lcp`. */
  readonly lcp: readonly number[];
  /** 이 걸음까지 한 글자 비교의 누적. */
  readonly compares: number;
}

/** 걸음 제목 — 자리 걸음은 그 자리에서 일어난 일로 짓는다. */
function placeTitle(r: Row): string {
  if (r.j === null) return `자리 ${r.i} — 이웃이 없다`;
  if (r.eq > 0) return `자리 ${r.i} — 글자 ${r.eq} 개가 같아 길이 ${r.h}`;
  if (r.kIn > 0)
    return `자리 ${r.i} — 이어받은 ${r.kIn}${이가(r.kIn)} 그대로 길이`;
  return `자리 ${r.i} — 첫 글자부터 다르다`;
}

function placeDetail(s: string, r: Row, n: number): string {
  if (r.j === null) {
    return `rank[${r.i}] = ${r.rank}${이가(r.rank)} n − 1 = ${n - 1}${과와(n - 1)} 같아 sa 의 마지막 칸입니다. 비교할 이웃이 없어 답을 적지 않고 len 을 0 으로 둡니다.`;
  }
  const h = r.h as number;
  const a = s[r.i + h] as string;
  const b = s[r.j + h] as string;
  const shorter = Math.max(r.i, r.j);
  const stop =
    r.stop === "differ"
      ? `s[${r.i + h}] = ${a}${과와(a)} s[${r.j + h}] = ${b}${이가(b)} 달라 멈춥니다.`
      : `자리 ${shorter} 의 접미사가 ${h} 글자에서 끝나 멈춥니다.`;
  const from =
    r.kIn > 0
      ? `이어받은 len = ${r.kIn} 에서 비교를 시작합니다.`
      : "len = 0 에서 비교를 시작합니다.";
  const grew =
    r.eq > 0 ? ` 같은 글자 ${r.eq} 개로 len 이 ${h}${이가(h)} 됐고,` : "";
  return `rank[${r.i}] = ${r.rank}${josa(r.rank, "이라", "라")} 이웃은 sa[${r.rank + 1}] = ${r.j} 입니다. ${from}${grew} ${stop} lcp[${r.rank}] = ${h}${을를(h)} 적고 len = ${r.kOut}${을를(r.kOut)} 넘깁니다.`;
}

/** 전개 입력의 걸음 — T1 순위 배열, 자리마다 한 걸음, 마지막에 답을 돌려준다. */
export function walkSteps(): Step[] {
  const r = walkRun();
  const n = WALK.length;
  const steps: Step[] = [];
  let t = 1;
  const lcp = new Array<number>(n).fill(0);
  let compares = 0;
  steps.push({
    id: `T${t++}`,
    kind: "init",
    row: null,
    title: "순위 배열을 만든다",
    detail: `sa 를 한 번 지나며 rank[sa[k]] = k 를 적습니다. rank = ${show(r.inv)} 입니다. lcp 는 칸마다 0 으로 채워 두었고 len 은 0 에서 시작합니다.`,
    lcp: [...lcp],
    compares,
  });
  for (const row of r.rows) {
    if (row.h !== null) lcp[row.rank] = row.h;
    compares += row.eq + row.ne;
    steps.push({
      id: `T${t++}`,
      kind: "place",
      row,
      title: placeTitle(row),
      detail: placeDetail(WALK, row, n),
      lcp: [...lcp],
      compares,
    });
  }
  steps.push({
    id: `T${t++}`,
    kind: "done",
    row: null,
    title: "답을 돌려준다",
    detail: `자리 ${n} 개를 다 처리했습니다. 글자 비교는 ${compares} 번이고 lcp = ${show(lcp)} 입니다. 이웃이 없는 칸 ${n - 1}${은는(n - 1)} 처음 잡은 0 그대로입니다.`,
    lcp: [...lcp],
    compares,
  });
  return steps;
}

/**
 * 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로. 값 줄은 문자열 `s` 의 글자이고, 그 아래에 순위 배열
 * `rank` 한 줄을 쌓는다 — 둘 다 칸 번호가 문자열 자리다. 접미사 배열 `sa` 와 LCP 배열 `lcp` 는 칸 번호가
 * 사전순 자리 `k` 라 문자열 자리와 같은 눈금에 두지 않고, 키 줄 `k` · 값 줄 `sa[k]` · 더한 줄 `lcp[k]` 로
 * 맨 아래에 둔다. 자리 걸음의 두 괄호는 자리 `i` 와 이웃 `j` 에서 시작해 함께 가진 앞부분이다.
 */
function arrayStep(step: Step): ArrayStep {
  const r = walkRun();
  const n = WALK.length;
  const all = Array.from({ length: n }, (_, i) => i);
  const row = step.row;
  const writable = n - 1;
  const wroteSoFar =
    step.kind === "init"
      ? 0
      : step.kind === "done"
        ? r.rows.filter((x) => x.j !== null).length
        : r.rows.filter((x) => x.i <= (row as Row).i && x.j !== null).length;
  const read: number[] = [];
  if (row !== null && row.j !== null) {
    const h = row.h as number;
    const last = row.stop === "differ" ? h : h - 1;
    for (let t = row.kIn; t <= last; t++) read.push(row.i + t, row.j + t);
  }
  const pieces =
    row !== null && row.j !== null && (row.h as number) > 0
      ? [
          {
            label: `자리 ${row.i}`,
            from: row.i,
            to: row.i + (row.h as number) - 1,
            tone: "left" as const,
            text: WALK.slice(row.i, row.i + (row.h as number)),
          },
          {
            label: `이웃 ${row.j}`,
            from: row.j,
            to: row.j + (row.h as number) - 1,
            tone: "right" as const,
            text: WALK.slice(row.j, row.j + (row.h as number)),
          },
        ]
      : [];
  const calc =
    row === null
      ? step.kind === "done"
        ? { expr: "돌려줄 lcp", result: show(step.lcp) }
        : null
      : row.j === null
        ? { expr: `rank[${row.i}] = ${row.rank} = n − 1`, result: "이웃 없음" }
        : {
            expr: `lcp[rank[${row.i}]] = lcp[${row.rank}]`,
            result: `${row.h}`,
          };
  return {
    array: [...WALK],
    range: [0, n - 1],
    rangeSide:
      row === null
        ? step.kind === "init"
          ? "sa 를 한 번 지난다"
          : "자리를 다 처리했다"
        : `들어올 때 len = ${row.kIn} · 넘기는 len = ${row.kOut}`,
    read: [...new Set(read)].sort((x, y) => x - y),
    write: [],
    ...(row === null
      ? {}
      : { pointers: row.j === null ? { i: row.i } : { i: row.i, j: row.j } }),
    layers: [
      {
        name: "rank",
        values: [...r.inv],
        read: row === null ? [] : [row.i],
        write: step.kind === "init" ? all : [],
        side: "자리 → sa 의 칸",
      },
    ],
    ...(pieces.length > 0 ? { pieces } : {}),
    map: {
      keyLabel: "k",
      valueLabel: "sa[k]",
      entries: r.sa.map((v, k) => [k, v] as const),
      slots: n,
      read:
        step.kind === "init"
          ? all
          : row !== null && row.j !== null
            ? [row.rank + 1]
            : [],
      extra: [
        {
          label: "lcp[k]",
          values: [...step.lcp],
          write: row !== null && row.j !== null ? [row.rank] : [],
          side: `적은 칸 ${wroteSoFar} / ${writable}`,
        },
      ],
    },
    calc,
    vars: `글자 비교 누적 ${step.compares} 번`,
  };
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "s",
  rangeLabel: "문자열",
};

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `kasaiLcp-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return walkSteps().map((s) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...arrayStep(s),
  }));
}

function film(): StageFrame[] {
  return walkSteps().map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
  }));
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 사전순으로 늘어놓은 접미사를 앞을 맞춰 한 줄씩 — 다음 줄과 함께 가진 앞부분을 겹침으로 칠한다. */
function sortedRows(s: string): StageRow[] {
  const n = s.length;
  const sa = saOf(s);
  const lcp = kasaiLcp(s, [...sa]);
  const rows: StageRow[] = [{ kind: "index", label: "앞에서 몇째 글자" }];
  sa.forEach((p, k) => {
    const suf = s.slice(p);
    const states: Partial<Record<number, CellState>> = {};
    for (let t = suf.length; t < n; t++) states[t] = "out";
    const L = lcp[k] as number;
    for (let t = 0; t < L; t++) states[t] = "overlap";
    rows.push({
      kind: "cells",
      label: `sa[${k}] = ${p}`,
      values: Array.from({ length: n }, (_, t) => suf[t] ?? null),
      states,
      side:
        k === n - 1
          ? `lcp[${k}] = ${L} · 다음 줄이 없다`
          : `lcp[${k}] = ${L} · 다음 줄과 ${L} 글자`,
    });
  });
  return rows;
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-lcp": () => (
    <CellStage
      title={`"${WALK}" 의 LCP 배열 — 사전순으로 이웃한 두 접미사가 앞에서부터 함께 가지는 글자 수`}
      rows={sortedRows(WALK)}
      columns={WALK.length}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`문자열 길이 ${num(LIMIT)} 이하 · 소문자 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-lcp-text": () => {
    const r = walkRun();
    const n = WALK.length;
    const groups = r.sa.slice(0, n - 1).map((a, k) => {
      const b = r.sa[k + 1] as number;
      const L = r.lcp[k] as number;
      const len = Math.max(L, 1);
      const note =
        L === 0
          ? `첫 글자 ${WALK[a]} · ${WALK[b]}${이가(WALK[b] as string)} 다르다 · lcp[${k}] = 0`
          : `${WALK.slice(a, a + L)} · lcp[${k}] = ${L}`;
      return [
        {
          label: `lcp[${k}] 의 앞 · 자리 ${a}`,
          from: a,
          to: a + len - 1,
          note,
        },
        { label: `lcp[${k}] 의 뒤 · 자리 ${b}`, from: b, to: b + len - 1 },
      ];
    });
    return (
      <LayerBars
        title="LCP 배열의 칸 하나가 문자열에서 잇는 두 조각 — 두 조각의 시작 자리는 서로 멀 수 있다"
        values={[...WALK]}
        valuesLabel="s"
        indexLabel="자리"
        groups={groups}
      />
    );
  },
  "build-carry": () => {
    const r = walkRun();
    const n = WALK.length;
    const rows: StageRow[] = [
      { kind: "index", label: "자리" },
      { kind: "cells", label: "s", values: [...WALK] },
    ];
    for (const row of r.rows) {
      const states: Partial<Record<number, CellState>> = {};
      const values: (string | null)[] = Array.from({ length: n }, () => null);
      for (let p = 0; p < n; p++) states[p] = "out";
      const h = row.h ?? 0;
      for (let t = 0; t < h; t++) {
        const p = row.i + t;
        values[p] = WALK[p] as string;
        states[p] = t < row.kIn ? "overlap" : "focus";
      }
      rows.push({
        kind: "cells",
        label: `자리 ${row.i}`,
        values,
        states,
        side:
          row.j === null
            ? "이웃이 없다 · len 을 0 으로"
            : `이웃 ${row.j} · 이어받은 ${row.kIn} · h = ${h}`,
      });
    }
    return (
      <CellStage
        title={`"${WALK}" 의 자리마다 이웃과 함께 가진 앞부분 — 빗금은 이어받아 다시 안 읽은 칸, 굵은 칸은 새로 비교한 칸`}
        rows={rows}
        columns={n}
      />
    );
  },
  "walk-kasai": () => {
    const frames = film();
    return (
      <CellStageFilm
        title={`kasaiLcp("${WALK}", ${show(saOf(WALK))}) — ${frames[0]?.id}~${frames.at(-1)?.id}`}
        columns={WALK.length}
        frames={frames}
      />
    );
  },
};
