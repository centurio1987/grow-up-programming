/**
 * `purpose.alt`(경쟁 설계와의 대조)의 수치 — L13.
 *
 * 경쟁 설계는 **카라추바 곱셈**이다. 같은 문제(정수 계수 다항식의 곱)를 풀고, 부동소수를 한
 * 번도 쓰지 않으며, 길이가 짧을 때는 이 글의 절차보다 연산이 적다.
 *
 * 재는 것은 셋이다.
 *
 * | 계수 | 무엇 |
 * | --- | --- |
 * | 기본 연산 | 계수 한 쌍에 대한 곱·덧셈·뺄셈 각 1 회. 두 설계가 같은 단위를 쓴다 |
 * | 삼각함수 호출 | `Math.cos`·`Math.sin` 호출 수. 카라추바는 0 이다 |
 * | 정확했던 마지막 계수 상한 | 계수 사다리를 올리며 정답과 처음 갈리기 직전의 상한 |
 *
 * **두 설계의 답을 매 실행에서 정본과 대조한다**(`검산()`). 계수만 세고 답을 안 맞추면 그
 * 수치는 아무것도 재지 않는다 — 특히 이 편은 부동소수를 쓰므로, 답이 갈리는 규모에서 잰
 * 연산 수는 「같은 문제를 푼 두 설계」의 수치가 아니게 된다.
 *
 * **길이별 비용만 세는 사본을 함께 둔다.** 우열이 뒤집히는 길이를 찾으려면 길이 하나마다
 * 곱을 실제로 만들어야 하는데 그것이 너무 비싸다. 그래서 재귀 구조만 따라가며 연산을 세는
 * 사본을 두고, **그 사본이 실제로 곱을 만드는 판과 같은 수를 내는지**를 `검산()` 이
 * 길이 여섯에서 확인한다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/number-theory/fftMultiply/fftMultiply-guide.alt.ts
 */
import { fftMultiply } from "./fftMultiply-guide.ref.ts";

/* ────────────────────────── 공통 입력 ────────────────────────── */

/** 계수 생성식 — 선형 합동 생성기 하나로 `[0, cap]` 을 고르게 지난다. */
export function coeffs(n: number, cap: number, salt: number): number[] {
  let seed = (20260906 + salt * 7919) & 0x7fffffff;
  return Array.from({ length: n }, () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return Math.floor((seed / 0x80000000) * (cap + 1));
  });
}

/** 대조에 쓰는 계수 상한. 두 설계 다 이 상한에서는 정답을 낸다. */
export const CAP = 1000;

/** 카라추바가 정의 그대로 곱는 자리로 내려가는 길이. */
export const CUT = 32;

/** 기본 연산과 삼각함수 호출을 따로 센다. */
export interface Counter {
  ops: number;
  trig: number;
  cells: number;
}

const blank = (): Counter => ({ ops: 0, trig: 0, cells: 0 });

/* ────────────────── 이 글의 절차 — 세는 사본 ────────────────── */

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
export function fftCounted(a: number[], b: number[], c: Counter): number[] {
  if (a.length === 0 || b.length === 0) return [];
  const resultLen = a.length + b.length - 1;
  let size = 1;
  while (size < resultLen) size <<= 1;

  const aRe = new Float64Array(size);
  const aIm = new Float64Array(size);
  const bRe = new Float64Array(size);
  const bIm = new Float64Array(size);
  c.cells += 4 * size;
  for (let i = 0; i < a.length; i++) aRe[i] = a[i] as number;
  for (let i = 0; i < b.length; i++) bRe[i] = b[i] as number;

  const transform = (
    re: Float64Array,
    im: Float64Array,
    invert: boolean,
  ): void => {
    for (let i = 1, j = 0; i < size; i++) {
      let bit = size >> 1;
      for (; (j & bit) !== 0; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        const sr = re[i] as number;
        re[i] = re[j] as number;
        re[j] = sr;
        const si = im[i] as number;
        im[i] = im[j] as number;
        im[j] = si;
      }
    }
    for (let len = 2; len <= size; len <<= 1) {
      const half = len >> 1;
      const ang = ((2 * Math.PI) / len) * (invert ? -1 : 1);
      for (let start = 0; start < size; start += len) {
        for (let j = 0; j < half; j++) {
          c.trig += 2;
          c.ops += 1; // ang * j
          const wRe = Math.cos(ang * j);
          const wIm = Math.sin(ang * j);
          const top = start + j;
          const bot = top + half;
          const uRe = re[top] as number;
          const uIm = im[top] as number;
          c.ops += 6; // 회전 인자를 곱하는 복소수 곱 한 번
          const vRe = (re[bot] as number) * wRe - (im[bot] as number) * wIm;
          const vIm = (re[bot] as number) * wIm + (im[bot] as number) * wRe;
          c.ops += 4; // 위쪽 둘과 아래쪽 둘
          re[top] = uRe + vRe;
          im[top] = uIm + vIm;
          re[bot] = uRe - vRe;
          im[bot] = uIm - vIm;
        }
      }
    }
    if (invert) {
      c.ops += 2 * size;
      for (let i = 0; i < size; i++) {
        re[i] = (re[i] as number) / size;
        im[i] = (im[i] as number) / size;
      }
    }
  };

  transform(aRe, aIm, false);
  transform(bRe, bIm, false);

  c.ops += 6 * size;
  for (let i = 0; i < size; i++) {
    const mulRe =
      (aRe[i] as number) * (bRe[i] as number) -
      (aIm[i] as number) * (bIm[i] as number);
    const mulIm =
      (aRe[i] as number) * (bIm[i] as number) +
      (aIm[i] as number) * (bRe[i] as number);
    aRe[i] = mulRe;
    aIm[i] = mulIm;
  }

  transform(aRe, aIm, true);

  c.cells += resultLen;
  const out = new Array<number>(resultLen);
  for (let i = 0; i < resultLen; i++) out[i] = Math.round(aRe[i] as number);
  return out;
}

/** 길이만 받아 같은 수를 세는 사본. 곱을 만들지 않아 길이 스윕에 쓸 수 있다. */
export function fftCost(n: number, m: number): Counter {
  const c = blank();
  if (n === 0 || m === 0) return c;
  const resultLen = n + m - 1;
  let size = 1;
  while (size < resultLen) size <<= 1;
  let levels = 0;
  for (let len = 2; len <= size; len <<= 1) levels++;
  const butterflies = (size / 2) * levels;
  // 정방향 둘 + 역방향 하나
  c.trig = 3 * 2 * butterflies;
  c.ops = 3 * 11 * butterflies + 2 * size + 6 * size;
  c.cells = 4 * size + resultLen;
  return c;
}

/* ────────────────── 경쟁 설계 — 카라추바 ────────────────── */

function schoolbook(a: number[], b: number[], c: Counter): number[] {
  const out = new Array<number>(a.length + b.length - 1).fill(0);
  c.cells += out.length;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      c.ops += 2; // 곱 하나와 누적 덧셈 하나
      out[i + j] = (out[i + j] as number) + (a[i] as number) * (b[j] as number);
    }
  }
  return out;
}

function addPoly(a: number[], b: number[], c: Counter): number[] {
  const out = new Array<number>(Math.max(a.length, b.length)).fill(0);
  c.cells += out.length;
  for (let i = 0; i < out.length; i++) {
    c.ops += 1;
    out[i] = (a[i] ?? 0) + (b[i] ?? 0);
  }
  return out;
}

/** 카라추바 — 세 번의 절반 곱으로 네 번을 대신한다. */
export function karatsuba(a: number[], b: number[], c: Counter): number[] {
  if (a.length === 0 || b.length === 0) return [];
  if (a.length <= CUT || b.length <= CUT) return schoolbook(a, b, c);

  const half = Math.max(a.length, b.length) >> 1;
  const aLow = a.slice(0, Math.min(half, a.length));
  const aHigh = a.slice(Math.min(half, a.length));
  const bLow = b.slice(0, Math.min(half, b.length));
  const bHigh = b.slice(Math.min(half, b.length));
  c.cells += a.length + b.length;

  const z0 = karatsuba(aLow, bLow, c);
  const z2 = karatsuba(aHigh, bHigh, c);
  const sumA = addPoly(aLow, aHigh, c);
  const sumB = addPoly(bLow, bHigh, c);
  const mid = karatsuba(sumA, sumB, c);
  for (let i = 0; i < mid.length; i++) {
    c.ops += 2;
    mid[i] = (mid[i] as number) - (z0[i] ?? 0) - (z2[i] ?? 0);
  }

  const out = new Array<number>(a.length + b.length - 1).fill(0);
  c.cells += out.length;
  for (let i = 0; i < z0.length; i++) {
    c.ops += 1;
    out[i] = (out[i] as number) + (z0[i] as number);
  }
  for (let i = 0; i < mid.length; i++) {
    c.ops += 1;
    out[i + half] = (out[i + half] as number) + (mid[i] as number);
  }
  for (let i = 0; i < z2.length; i++) {
    c.ops += 1;
    out[i + 2 * half] = (out[i + 2 * half] as number) + (z2[i] as number);
  }
  return out;
}

/** 길이만 받아 같은 수를 세는 사본. */
export function karatsubaCost(n: number, m: number): Counter {
  const c = blank();
  const rec = (la: number, lb: number): number => {
    if (la === 0 || lb === 0) return 0;
    if (la <= CUT || lb <= CUT) {
      c.ops += 2 * la * lb;
      c.cells += la + lb - 1;
      return la + lb - 1;
    }
    const half = Math.max(la, lb) >> 1;
    const aLow = Math.min(half, la);
    const aHigh = la - aLow;
    const bLow = Math.min(half, lb);
    const bHigh = lb - bLow;
    c.cells += la + lb;
    rec(aLow, bLow);
    rec(aHigh, bHigh);
    const sa = Math.max(aLow, aHigh);
    const sb = Math.max(bLow, bHigh);
    c.ops += sa + sb;
    c.cells += sa + sb;
    const midLen = rec(sa, sb);
    c.ops += 2 * midLen;
    c.cells += la + lb - 1;
    c.ops +=
      (aLow === 0 || bLow === 0 ? 0 : aLow + bLow - 1) +
      midLen +
      (aHigh === 0 || bHigh === 0 ? 0 : aHigh + bHigh - 1);
    return la + lb - 1;
  };
  rec(n, m);
  return c;
}

/* ────────────────── 정확한 답 — 큰 정수 곱 한 번 ────────────────── */

/**
 * 자리 하나를 `2^bits` 로 잡아 두 다항식을 정수 하나씩으로 묶고 한 번 곱해 되푼다.
 *
 * 곱한 뒤 자리마다 잘라 내면 그것이 계수다 — 자리 하나가 넘치지 않는 한 정확하다. 큰 정수
 * 곱셈은 부동소수를 쓰지 않으므로 이것이 판정의 기준이 된다.
 */
export function exactConv(a: number[], b: number[], bits: bigint): bigint[] {
  const mask = (1n << bits) - 1n;
  let packedA = 0n;
  for (let i = a.length - 1; i >= 0; i--) {
    packedA = (packedA << bits) | BigInt(a[i] as number);
  }
  let packedB = 0n;
  for (let i = b.length - 1; i >= 0; i--) {
    packedB = (packedB << bits) | BigInt(b[i] as number);
  }
  let product = packedA * packedB;
  const out: bigint[] = [];
  for (let k = 0; k < a.length + b.length - 1; k++) {
    out.push(product & mask);
    product >>= bits;
  }
  return out;
}

/** 계수 사다리 — `1 · 1.5 · 2 · 3 · 5 · 7` 을 10 배씩 올린다. */
export const LADDER: number[] = [];
for (let k = 3; k <= 8; k++) {
  for (const m of [1, 1.5, 2, 3, 5, 7]) LADDER.push(Math.round(m * 10 ** k));
}

/** 그 설계가 길이 `n` 에서 정답을 내는 마지막 계수 상한. */
export function lastExactCap(
  design: (a: number[], b: number[]) => number[],
  n: number,
): number {
  let last = 0;
  for (const cap of LADDER) {
    const a = coeffs(n, cap, 1);
    const b = coeffs(n, cap, 2);
    const got = design(a, b);
    const want = exactConv(a, b, 96n);
    let same = true;
    for (let k = 0; k < want.length; k++) {
      if (BigInt(got[k] as number) !== (want[k] as bigint)) {
        same = false;
        break;
      }
    }
    if (!same) return last;
    last = cap;
  }
  return last;
}

/* ────────────────── 우열이 뒤집히는 길이 ────────────────── */

/**
 * 길이를 1 씩 올리며 두 설계의 기본 연산과 삼각함수 호출의 합을 견준다.
 *
 * 이 글의 절차는 패딩 길이가 2 배로 뛸 때만 비용이 뛰므로 **길이의 함수로 계단꼴**이고,
 * 카라추바는 길이에 따라 매끄럽게 늘어난다. 그래서 우열이 한 번만 갈리지 않는다.
 */
export function flipLengths(upTo: number): number[] {
  const flips: number[] = [];
  let previous: string | null = null;
  for (let n = 2; n <= upTo; n++) {
    const f = fftCost(n, n);
    const k = karatsubaCost(n, n);
    const who = f.ops + f.trig < k.ops ? "fft" : "kara";
    if (previous !== null && who !== previous) flips.push(n);
    previous = who;
  }
  return flips;
}

/* ────────────────────────── 검산 ────────────────────────── */

const same = (a: number[], b: number[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * 매 실행에서 확인하는 것 둘.
 *
 * 1. 두 설계와 세는 사본이 **정본과 같은 답**을 낸다. 답이 갈리면 아래 계수는 같은 문제를
 *    푼 두 설계의 수치가 아니다.
 * 2. 길이만 세는 사본이 **곱을 실제로 만드는 판과 같은 수**를 낸다.
 */
function 검산(): void {
  for (const n of [1, 2, 33, 64, 100, 257]) {
    const a = coeffs(n, CAP, 1);
    const b = coeffs(n, CAP, 2);
    const want = fftMultiply(a, b);

    const cf = blank();
    if (!same(fftCounted(a, b, cf), want)) {
      throw new Error(`세는 사본이 정본과 다른 답을 낸다 — 길이 ${n}`);
    }
    const ck = blank();
    if (!same(karatsuba(a, b, ck), want)) {
      throw new Error(`카라추바가 정본과 다른 답을 낸다 — 길이 ${n}`);
    }

    const fc = fftCost(n, n);
    if (fc.ops !== cf.ops || fc.trig !== cf.trig || fc.cells !== cf.cells) {
      throw new Error(`길이만 세는 사본이 다른 수를 낸다(이 글) — 길이 ${n}`);
    }
    const kc = karatsubaCost(n, n);
    if (kc.ops !== ck.ops || kc.cells !== ck.cells) {
      throw new Error(
        `길이만 세는 사본이 다른 수를 낸다(카라추바) — 길이 ${n}`,
      );
    }
  }
  if (fftMultiply([], [1]).length !== 0) {
    throw new Error("빈 입력 계약이 깨졌다");
  }
}
검산();

/* ────────────────────────── 계수 ────────────────────────── */

/** 우열이 뒤집히는 길이를 찾을 범위. 마지막 뒤집힘 뒤로 두 배 넘게 더 본다. */
export const FLIP_UP_TO = 8192;

/** 대조에 쓰는 길이 셋. 전개 입력(길이 4 와 2)은 두 설계가 갈리기 전이라 따로 잡았다. */
export const SHORT_LEN = 512;
export const LONG_LEN = 1024;
export const TINY_LEN = 64;

export const cases: Record<string, () => Record<string, number>> = {
  "이 글의 절차": () => {
    const flips = flipLengths(FLIP_UP_TO);
    return {
      "길이 512 기본 연산": fftCost(SHORT_LEN, SHORT_LEN).ops,
      "길이 512 삼각함수 호출": fftCost(SHORT_LEN, SHORT_LEN).trig,
      "길이 1024 기본 연산": fftCost(LONG_LEN, LONG_LEN).ops,
      "길이 1024 삼각함수 호출": fftCost(LONG_LEN, LONG_LEN).trig,
      "길이 1024 새로 잡는 칸": fftCost(LONG_LEN, LONG_LEN).cells,
      "길이 64 에서 정확했던 마지막 계수 상한": lastExactCap(
        (a, b) => fftMultiply(a, b),
        TINY_LEN,
      ),
      "길이 1024 에서 정확했던 마지막 계수 상한": lastExactCap(
        (a, b) => fftMultiply(a, b),
        LONG_LEN,
      ),
      "우열이 갈리는 길이의 개수": flips.length,
      "마지막으로 우열이 갈리는 길이": flips[flips.length - 1] ?? 0,
    };
  },
  카라추바: () => {
    const run = (a: number[], b: number[]): number[] =>
      karatsuba(a, b, blank());
    return {
      "길이 512 기본 연산": karatsubaCost(SHORT_LEN, SHORT_LEN).ops,
      "길이 512 삼각함수 호출": 0,
      "길이 1024 기본 연산": karatsubaCost(LONG_LEN, LONG_LEN).ops,
      "길이 1024 삼각함수 호출": 0,
      "길이 1024 새로 잡는 칸": karatsubaCost(LONG_LEN, LONG_LEN).cells,
      "길이 64 에서 정확했던 마지막 계수 상한": lastExactCap(run, TINY_LEN),
      "길이 1024 에서 정확했던 마지막 계수 상한": lastExactCap(run, LONG_LEN),
    };
  },
};
