/**
 * `purpose.alt`(경쟁 설계와의 대조)의 수치 — L13.
 *
 * 경쟁 설계는 **한 번에 합치는 판**이다. 법의 곱 `M` 을 먼저 만들고 합동식마다 `M_i = M / m_i` 와 그 역원
 * `y_i` 를 구해 `x = Σ r_i · M_i · y_i mod M` 로 답을 낸다. 이 글의 절차(합동식 합치기)와 같은 과제를 풀고 같은
 * 값을 내지만, **법이 쌍마다 서로소일 때만** 그렇다 — `M_i` 가 `m_i` 와 서로소가 아니면 역원이 없다.
 *
 * 재는 것은 둘이고, 본문 전체와 같은 기준이다.
 *
 * | 계수 | 무엇 |
 * | --- | --- |
 * | 나눗셈 | `/` 나 `%` 한 번을 하나로 센다. 나머지를 `[0, m)` 로 맞추는 `mod` 도 `%` 한 번이다 |
 * | 들고 있는 값 | 질의와 질의 사이에 남겨 두는 `bigint` 의 개수 |
 *
 * **두 설계의 답을 매 실행에서 정본과 대조한다.** 계수만 세고 답을 안 맞추면 그 수치는 아무것도 재지 않는다 —
 * 특히 경쟁 설계는 법이 서로소가 아니면 답을 못 내므로, 그 경우까지 섞어 잰 계수는 「같은 과제를 푼 두 설계」의
 * 수치가 아니게 된다.
 *
 * **작업 목록이 축이다.** 같은 법 목록으로 나머지 벡터를 `q` 개 푸는 작업이고, 경쟁 설계는 법 목록에만 달린 것
 * (`M` · `M_i·y_i`)을 한 번만 만들어 둔다. `q` 를 늘리면 우열이 뒤집히고, 뒤집히는 자리는 상수로 적지 않고
 * `뒤집히는_자리()` 가 실행 시점에 스윕해서 낸다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/number-theory/crt/crt-guide.alt.ts
 */
import { crt } from "./crt-guide.ref.ts";

/* ────────────────────────── 공통 입력 ────────────────────────── */

/** 법 여덟. 10 자리 소수를 1,000,000,007 부터 순서대로 골랐다. */
export const MODULI: bigint[] = [
  1_000_000_007n,
  1_000_000_009n,
  1_000_000_021n,
  1_000_000_033n,
  1_000_000_087n,
  1_000_000_093n,
  1_000_000_097n,
  1_000_000_103n,
];

/** 나머지 벡터 생성식 — 선형 합동 생성기 하나로 만든다. 시드는 고정이다. */
export function vectors(count: number): bigint[][] {
  let seed = 20_260_908n;
  const out: bigint[][] = [];
  for (let i = 0; i < count; i++) {
    out.push(
      MODULI.map((m) => {
        seed =
          (seed * 6_364_136_223_846_793_005n + 1_442_695_040_888_963_407n) &
          0xffff_ffff_ffff_ffffn;
        return seed % m;
      }),
    );
  }
  return out;
}

/* ────────────────────────── 계수 ────────────────────────── */

export interface Counter {
  divisions: number;
}

const blank = (): Counter => ({ divisions: 0 });

function modCounted(c: Counter, a: bigint, m: bigint): bigint {
  c.divisions += 1;
  const r = a % m;
  return r < 0n ? r + m : r;
}

/** 정본의 `gcdWithCoefficient` 와 같은 절차 — 바퀴마다 몫 `/` 한 번. */
function gcdCounted(
  c: Counter,
  a: bigint,
  b: bigint,
): { g: bigint; x: bigint } {
  let r0 = a;
  let r1 = b;
  let s0 = 1n;
  let s1 = 0n;
  while (r1 !== 0n) {
    c.divisions += 1;
    const q = r0 / r1;
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
  }
  return { g: r0, x: s0 };
}

/* ────────────── 이 글의 절차(합동식 합치기) — 세는 사본 ────────────── */

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
export function mergeCounted(
  remainders: bigint[],
  moduli: bigint[],
  c: Counter,
): { x: bigint; M: bigint } | null {
  let curM = moduli[0] as bigint;
  let curR = modCounted(c, remainders[0] as bigint, curM);
  for (let i = 1; i < moduli.length; i++) {
    const m = moduli[i] as bigint;
    const r = modCounted(c, remainders[i] as bigint, m);
    const diff = r - curR;
    const { g, x: u } = gcdCounted(c, curM, m);
    c.divisions += 1;
    if (diff % g !== 0n) return null;
    c.divisions += 2;
    const unit = m / g;
    const t = modCounted(c, (diff / g) * u, unit);
    curR = curR + curM * t;
    curM = curM * unit;
  }
  return { x: curR, M: curM };
}

/* ────────────── 경쟁 설계 — 한 번에 합치는 판 ────────────── */

export interface Prepared {
  M: bigint;
  coefficients: bigint[];
}

/** 법 목록에만 달린 것을 만들어 둔다. 법이 쌍마다 서로소가 아니면 `null` 이다. */
export function prepare(moduli: bigint[], c: Counter): Prepared | null {
  let M = 1n;
  for (const m of moduli) M = M * m;
  const coefficients: bigint[] = [];
  for (const m of moduli) {
    c.divisions += 1;
    const Mi = M / m;
    const base = modCounted(c, Mi, m);
    const { g, x: y } = gcdCounted(c, base, m);
    if (g !== 1n) return null;
    const yi = modCounted(c, y, m);
    coefficients.push(modCounted(c, Mi * yi, M));
  }
  return { M, coefficients };
}

/** 나머지 벡터 하나를 푼다. 미리 만들어 둔 것을 그대로 쓴다. */
export function solvePrepared(
  remainders: bigint[],
  moduli: bigint[],
  pre: Prepared,
  c: Counter,
): bigint {
  let x = 0n;
  for (let i = 0; i < moduli.length; i++) {
    const r = modCounted(c, remainders[i] as bigint, moduli[i] as bigint);
    x = x + r * (pre.coefficients[i] as bigint);
  }
  return modCounted(c, x, pre.M);
}

/** 질의와 질의 사이에 남겨 두는 값의 개수 — 경쟁 설계는 `M` 과 계수 `k` 개다. */
export const heldBetween = (pre: Prepared): number =>
  1 + pre.coefficients.length;

/* ────────────────────────── 작업 목록 ────────────────────────── */

export interface Totals {
  merge: Counter;
  oneShot: Counter;
  /** 질의 사이에 들고 있는 값 — 합동식 합치기는 질의마다 새로 시작하므로 0 이다. */
  held: { merge: number; oneShot: number };
}

/** 나머지 벡터 `q` 개를 두 설계로 각각 처리한 총계. 답은 매번 정본과 대조한다. */
export function totals(q: number): Totals {
  const merge = blank();
  const oneShot = blank();
  const pre = prepare(MODULI, oneShot);
  if (pre === null) throw new Error("법 목록이 쌍마다 서로소가 아니다");
  for (const v of vectors(q)) {
    const truth = crt(v, MODULI);
    const mine = mergeCounted(v, MODULI, merge);
    const theirs = solvePrepared(v, MODULI, pre, oneShot);
    if (truth === null || mine === null) {
      throw new Error(
        "정본이 해가 없다고 답했다 — 법이 서로소인데 그럴 수 없다",
      );
    }
    if (mine.x !== truth.x || mine.M !== truth.M) {
      throw new Error("세는 사본이 정본과 다른 답을 냈다");
    }
    if (theirs !== truth.x) {
      throw new Error("경쟁 설계가 정본과 다른 답을 냈다");
    }
  }
  return { merge, oneShot, held: { merge: 0, oneShot: heldBetween(pre) } };
}

/** 경쟁 설계가 처음 앞서는 질의 수. 스윕이라 상수를 손으로 적지 않는다. */
export function 뒤집히는_자리(limit = 64): number {
  for (let q = 1; q <= limit; q++) {
    const { merge, oneShot } = totals(q);
    if (oneShot.divisions < merge.divisions) return q;
  }
  throw new Error(`질의 ${limit} 회까지 안 뒤집혔다`);
}

/* ────────────────────────── 계수 표 ────────────────────────── */

/** 본문 표가 싣는 질의 수. */
export const QUERY_COUNTS = [1, 2, 8, 64] as const;

const runs: Totals[] = QUERY_COUNTS.map((q) => totals(q));

const byDesign = (pick: (t: Totals) => number): Record<string, number> =>
  Object.fromEntries(
    QUERY_COUNTS.map((q, i) => [
      `질의 ${q} 회 나눗셈`,
      pick(runs[i] as Totals),
    ]),
  );

export const cases = {
  "합동식 합치기": () => ({
    ...byDesign((t) => t.merge.divisions),
    "질의 사이에 들고 있는 값": (runs[0] as Totals).held.merge,
  }),
  "한 번에 합치는 판": () => ({
    ...byDesign((t) => t.oneShot.divisions),
    "질의 사이에 들고 있는 값": (runs[0] as Totals).held.oneShot,
  }),
  "뒤집히는 자리": () => ({
    "질의 수": 뒤집히는_자리(),
  }),
};
