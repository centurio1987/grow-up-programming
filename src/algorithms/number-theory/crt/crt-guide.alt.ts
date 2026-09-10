/**
 * `purpose.alt`(경쟁 설계와의 대조)의 수치 — L13.
 *
 * 경쟁 설계는 **한 번에 합치는 판**이다. 법의 곱 `M` 을 먼저 만들고 조건마다
 * `M_i = M / m_i` 와 그 역원 `y_i` 를 구해 `x = Σ r_i · M_i · y_i mod M` 로 답을 낸다.
 * 이 글의 절차와 같은 문제를 풀고 같은 값을 내지만, **법이 쌍마다 서로소일 때만** 그렇다 —
 * `M_i` 가 `m_i` 로 나누어떨어지면 역원이 없다.
 *
 * 재는 것은 셋이다.
 *
 * | 계수 | 무엇 |
 * | --- | --- |
 * | 기본 연산 | `bigint` 산술 호출 수(곱·나눗셈·나머지·덧셈·뺄셈 각 1). 호출 하나의 고정 비용을 잰다 |
 * | 자릿수 일 | 덧셈·뺄셈은 큰 쪽 자릿수, 곱셈·나눗셈은 두 자릿수의 곱을 더한 값. 교과서식 긴 셈의 비용이 그 값에 비례한다 |
 * | 저장 자릿수 | 동시에 들고 있는 `bigint` 의 십진 자릿수 합의 최댓값 |
 *
 * **두 설계의 답을 매 실행에서 정본과 대조한다**(`검산()`). 계수만 세고 답을 안 맞추면 그
 * 수치는 아무것도 재지 않는다 — 특히 경쟁 설계는 법이 서로소가 아니면 답을 못 내므로, 그
 * 경우까지 섞어 잰 계수는 「같은 문제를 푼 두 설계」의 수치가 아니게 된다.
 *
 * **작업 목록이 축이다.** 같은 법 목록으로 나머지 벡터를 `q` 개 푸는 작업이고, 경쟁 설계는
 * 법 목록에만 달린 것(`M`·`M_i·y_i`)을 한 번만 만들어 둔다. `q` 를 늘리면 우열이 뒤집히고,
 * 뒤집히는 자리는 상수로 적지 않고 `뒤집히는_자리()` 가 실행 시점에 스윕해서 낸다.
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
  ops: number;
  work: number;
  cells: number;
}

const blank = (): Counter => ({ ops: 0, work: 0, cells: 0 });

const digits = (v: bigint): number => (v < 0n ? -v : v).toString().length;

/** 덧셈·뺄셈 — 자릿수에 비례한다. */
function addOp(c: Counter, a: bigint, b: bigint): void {
  c.ops += 1;
  c.work += Math.max(digits(a), digits(b));
}

/** 곱셈·나눗셈·나머지 — 교과서식 긴 셈은 두 피연산자 자릿수의 곱에 비례한다. */
function mulOp(c: Counter, a: bigint, b: bigint): void {
  c.ops += 1;
  c.work += digits(a) * digits(b);
}

/* ────────────── 이 글의 절차 — 세는 사본 ────────────── */

function modCounted(c: Counter, a: bigint, m: bigint): bigint {
  mulOp(c, a, m);
  const r = a % m;
  if (r < 0n) {
    addOp(c, r, m);
    return r + m;
  }
  return r;
}

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
    mulOp(c, r0, r1);
    const q = r0 / r1;
    mulOp(c, q, r1);
    addOp(c, r0, r1);
    const nr = r0 - q * r1;
    mulOp(c, q, s1);
    addOp(c, s0, s1);
    const ns = s0 - q * s1;
    r0 = r1;
    r1 = nr;
    s0 = s1;
    s1 = ns;
  }
  return { g: r0, x: s0 };
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
export function mergeCounted(
  remainders: bigint[],
  moduli: bigint[],
  c: Counter,
): { x: bigint; M: bigint } | null {
  let curM = moduli[0] as bigint;
  let curR = modCounted(c, remainders[0] as bigint, curM);
  let live = digits(curM) + digits(curR);
  for (let i = 1; i < moduli.length; i++) {
    const m = moduli[i] as bigint;
    const r = modCounted(c, remainders[i] as bigint, m);
    addOp(c, r, curR);
    const diff = r - curR;
    const { g, x: u } = gcdCounted(c, curM, m);
    mulOp(c, diff, g);
    if (diff % g !== 0n) return null;
    mulOp(c, m, g);
    const unit = m / g;
    mulOp(c, diff, g);
    mulOp(c, diff, u);
    const t = modCounted(c, (diff / g) * u, unit);
    mulOp(c, curM, t);
    addOp(c, curR, curM);
    curR = curR + curM * t;
    mulOp(c, curM, unit);
    curM = curM * unit;
    live = Math.max(live, digits(curM) + digits(curR));
  }
  c.cells = Math.max(c.cells, live);
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
  for (const m of moduli) {
    mulOp(c, M, m);
    M = M * m;
  }
  const coefficients: bigint[] = [];
  for (const m of moduli) {
    mulOp(c, M, m);
    const Mi = M / m;
    const base = modCounted(c, Mi, m);
    const { g, x: y } = gcdCounted(c, base, m);
    if (g !== 1n) return null;
    const yi = modCounted(c, y, m);
    mulOp(c, Mi, yi);
    coefficients.push(modCounted(c, Mi * yi, M));
  }
  c.cells = Math.max(
    c.cells,
    digits(M) + coefficients.reduce((s, v) => s + digits(v), 0),
  );
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
    const coefficient = pre.coefficients[i] as bigint;
    mulOp(c, r, coefficient);
    addOp(c, x, pre.M);
    x = x + r * coefficient;
  }
  return modCounted(c, x, pre.M);
}

/* ────────────────────────── 작업 목록 ────────────────────────── */

export interface Totals {
  merge: Counter;
  oneShot: Counter;
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
  return { merge, oneShot };
}

/** 그 축에서 경쟁 설계가 처음 앞서는 질의 수. 스윕이라 상수를 손으로 적지 않는다. */
export function 뒤집히는_자리(key: "ops" | "work", limit = 64): number {
  for (let q = 1; q <= limit; q++) {
    const { merge, oneShot } = totals(q);
    if (oneShot[key] < merge[key]) return q;
  }
  throw new Error(`질의 ${limit} 회까지 ${key} 축이 안 뒤집혔다`);
}

/* ────────────────────────── 계수 표 ────────────────────────── */

const one = totals(1);
const seven = totals(7);
const eight = totals(8);
const sixtyFour = totals(64);

export const cases = {
  정본: () => ({
    "질의 1 회 기본 연산": one.merge.ops,
    "질의 1 회 자릿수 일": one.merge.work,
    "질의 7 회 자릿수 일": seven.merge.work,
    "질의 8 회 자릿수 일": eight.merge.work,
    "질의 64 회 기본 연산": sixtyFour.merge.ops,
    "질의 64 회 자릿수 일": sixtyFour.merge.work,
    "저장 자릿수": one.merge.cells,
  }),
  "한 번에 합치는 판": () => ({
    "질의 1 회 기본 연산": one.oneShot.ops,
    "질의 1 회 자릿수 일": one.oneShot.work,
    "질의 7 회 자릿수 일": seven.oneShot.work,
    "질의 8 회 자릿수 일": eight.oneShot.work,
    "질의 64 회 기본 연산": sixtyFour.oneShot.ops,
    "질의 64 회 자릿수 일": sixtyFour.oneShot.work,
    "저장 자릿수": one.oneShot.cells,
  }),
  "뒤집히는 자리": () => ({
    "기본 연산 축의 질의 수": 뒤집히는_자리("ops"),
    "자릿수 일 축의 질의 수": 뒤집히는_자리("work"),
  }),
};
