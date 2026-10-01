/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 바퀴마다의 배열 · 자리별 곱 · 나눗셈 뒤 값은 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측
 * 사본)에서 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/fftMultiply/fftMultiply-guide.md
 *
 * **부동소수는 그림과 검산에만 쓰고 판정 경로에 두지 않는다.** 중간 값은 무리수라 소수 둘째 자리까지
 * 반올림해 적는데(`cx`), 그 값으로는 아무것도 판정하지 않는다. 판정하는 값은 셋뿐이다 — ① 반올림 뒤의
 * 정수 계수 ② 정수로 세는 연산 수 ③ 큰 정수 곱 하나로 낸 정확한 답과의 일치 여부(`exactConv`).
 *
 * **비용은 원고 전체에서 한 기준으로 센다** — 기본 연산(실수 곱 · 덧셈 · 뺄셈 · 나눗셈 한 번)과 삼각함수
 * 호출(`Math.cos` · `Math.sin` 한 번)을 따로 세고, 합칠 때는 「연산 전부」라 부른다. 정의 그대로 곱하는
 * 방법은 계수 한 쌍마다 곱 하나와 누적 덧셈 하나라 기본 연산 2 번이다(`.alt.ts` 의 `schoolbook` 과 같다).
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가 이 파일을
 * 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서 「변이가 답을 안
 * 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이 모듈의 함수가 정본과 **같은
 * 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  coeffs,
  exactConv,
  fftCost,
  flipLengths,
  karatsuba,
  karatsubaCost,
  LADDER,
  LONG_LEN,
  SHORT_LEN,
  TINY_LEN,
} from "./fftMultiply-guide.alt.ts";
import {
  cells,
  cx,
  distinct,
  LIMIT,
  log2,
  mul,
  naiveConv,
  naiveOps,
  num,
  PER_SECOND,
  POINT_ROUTE_LENS,
  POINT_SETS,
  pointRoute,
  r2,
  reverseBits,
  root,
  type Shot,
  squareChain,
  swapPairs,
  WALK_A,
  WALK_B,
  walk,
} from "./fftMultiply-guide.fig.tsx";
import { fftMultiply } from "./fftMultiply-guide.ref.ts";

const REF = new URL("./fftMultiply-guide.ref.ts", import.meta.url).pathname;

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (c: string[]) => `| ${c.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 화면 폭 — 한글은 두 칸으로 센다(`check-v2` 의 `displayWidth` 와 같은 셈). */
const widthOf = (t: string): number =>
  [...t].reduce((w, ch) => {
    const c = ch.codePointAt(0) ?? 0;
    return (
      w +
      ((c >= 0x1100 && c <= 0x115f) ||
      (c >= 0x2e80 && c <= 0xa4cf) ||
      (c >= 0xac00 && c <= 0xd7a3)
        ? 2
        : 1)
    );
  }, 0);

/** 이름 칸과 값 칸 두 열 — 이름을 화면 폭으로 맞춰 값 칸이 한 줄에 선다. */
function kv(rows: [string, string][], indent = "  "): string[] {
  const w = Math.max(...rows.map(([k]) => widthOf(k)));
  return rows.map(
    ([k, v]) => `${indent}${k}${" ".repeat(w - widthOf(k))}  ${v}`,
  );
}

/** `[6, 17, 13]` 꼴 — 본문 표기와 같다. */
const show = (a: readonly number[]): string => `[${a.join(", ")}]`;

const same = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

const TWO53 = 2 ** 53;

/** 다항식을 `3 + x + 4x² + x³` 꼴로. */
function poly(c: readonly number[]): string {
  const sup = (k: number) =>
    [...String(k)].map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]).join("");
  const terms = c.flatMap((v, k) => {
    if (v === 0) return [];
    const coef = k > 0 && v === 1 ? "" : String(v);
    const x = k === 0 ? "" : k === 1 ? "x" : `x${sup(k)}`;
    return [`${coef}${x}`];
  });
  return terms.join(" + ");
}

/** 길이 `n` 짜리 이산 푸리에 변환을 정의 그대로 계산한다. 검산용이다. */
export function dftByDefinition(
  c: readonly number[],
  n: number,
): [number, number][] {
  const out: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    let re = 0;
    let im = 0;
    for (let j = 0; j < n; j++) {
      const [wr, wi] = root(j * k, n);
      re += (c[j] ?? 0) * wr;
      im += (c[j] ?? 0) * wi;
    }
    out.push([re, im]);
  }
  return out;
}

const close = (x: number, y: number) => Math.abs(x - y) < 1e-9;

/** 길이 `n` 으로 자른 순환 합성곱 — 정의 그대로. 넘치는 자리가 앞으로 되돌아온다. */
function circular(
  a: readonly number[],
  b: readonly number[],
  n: number,
): number[] {
  const out = new Array<number>(n).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      const k = (i + j) % n;
      out[k] = (out[k] as number) + (a[i] as number) * (b[j] as number);
    }
  }
  return out;
}

/* ──────────────── 회전 인자를 누적 곱으로 만든 판 ──────────────── */

/**
 * 정본과 회전 인자를 만드는 자리만 다르다 — 자리마다 `Math.cos`·`Math.sin` 을 다시 부르지 않고, 바퀴마다
 * 한 번 구한 `ω` 를 곱해 이어 간다. 여러 줄이 함께 바뀌어 `loadMutant`(한 줄 치환)로 만들 수 없으므로 여기
 * 적고, 작은 입력에서 정본과 같은 답을 내는지 아래 `자기대조()` 가 확인한다.
 */
export function driftMultiply(a: number[], b: number[]): number[] {
  if (a.length === 0 || b.length === 0) return [];
  const resultLen = a.length + b.length - 1;
  let size = 1;
  while (size < resultLen) size <<= 1;
  const aRe = new Float64Array(size);
  const aIm = new Float64Array(size);
  const bRe = new Float64Array(size);
  const bIm = new Float64Array(size);
  for (let i = 0; i < a.length; i++) aRe[i] = a[i] as number;
  for (let i = 0; i < b.length; i++) bRe[i] = b[i] as number;
  const transform = (re: Float64Array, im: Float64Array, invert: boolean) => {
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
      const stepRe = Math.cos(ang);
      const stepIm = Math.sin(ang);
      for (let start = 0; start < size; start += len) {
        let wRe = 1;
        let wIm = 0;
        for (let j = 0; j < half; j++) {
          const top = start + j;
          const bot = top + half;
          const uRe = re[top] as number;
          const uIm = im[top] as number;
          const vRe = (re[bot] as number) * wRe - (im[bot] as number) * wIm;
          const vIm = (re[bot] as number) * wIm + (im[bot] as number) * wRe;
          re[top] = uRe + vRe;
          im[top] = uIm + vIm;
          re[bot] = uRe - vRe;
          im[bot] = uIm - vIm;
          const nextRe = wRe * stepRe - wIm * stepIm;
          wIm = wRe * stepIm + wIm * stepRe;
          wRe = nextRe;
        }
      }
    }
    if (invert) {
      for (let i = 0; i < size; i++) {
        re[i] = (re[i] as number) / size;
        im[i] = (im[i] as number) / size;
      }
    }
  };
  transform(aRe, aIm, false);
  transform(bRe, bIm, false);
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
  const out = new Array<number>(resultLen);
  for (let i = 0; i < resultLen; i++) {
    const r = Math.round(aRe[i] as number);
    out[i] = r === 0 ? 0 : r;
  }
  return out;
}

/**
 * 나눗셈을 바퀴마다 2 로 하는 판 — 스스로 점검하기의 예측 문제가 묻는 판이다. 역변환의 바퀴 안에서 위아래
 * 두 칸을 2 로 나누고, 끝의 나눗셈을 뺀다. 두 줄이 함께 바뀌어 `loadMutant` 로 만들 수 없으므로 여기 적는다.
 * 나눗셈 횟수를 함께 센다.
 */
export function divideEachRound(
  a: number[],
  b: number[],
): { out: number[]; divides: number } {
  if (a.length === 0 || b.length === 0) return { out: [], divides: 0 };
  const resultLen = a.length + b.length - 1;
  let size = 1;
  while (size < resultLen) size <<= 1;
  let divides = 0;
  const aRe = new Float64Array(size);
  const aIm = new Float64Array(size);
  const bRe = new Float64Array(size);
  const bIm = new Float64Array(size);
  for (let i = 0; i < a.length; i++) aRe[i] = a[i] as number;
  for (let i = 0; i < b.length; i++) bRe[i] = b[i] as number;
  const transform = (re: Float64Array, im: Float64Array, invert: boolean) => {
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
          const wRe = Math.cos(ang * j);
          const wIm = Math.sin(ang * j);
          const top = start + j;
          const bot = top + half;
          const uRe = re[top] as number;
          const uIm = im[top] as number;
          const vRe = (re[bot] as number) * wRe - (im[bot] as number) * wIm;
          const vIm = (re[bot] as number) * wIm + (im[bot] as number) * wRe;
          re[top] = uRe + vRe;
          im[top] = uIm + vIm;
          re[bot] = uRe - vRe;
          im[bot] = uIm - vIm;
          if (invert) {
            // 끝의 나눗셈 대신 바퀴마다 위아래 두 칸을 2 로 나눈다.
            re[top] = (re[top] as number) / 2;
            im[top] = (im[top] as number) / 2;
            re[bot] = (re[bot] as number) / 2;
            im[bot] = (im[bot] as number) / 2;
            divides += 4;
          }
        }
      }
    }
  };
  transform(aRe, aIm, false);
  transform(bRe, bIm, false);
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
  const out = new Array<number>(resultLen);
  for (let i = 0; i < resultLen; i++) {
    const r = Math.round(aRe[i] as number);
    out[i] = r === 0 ? 0 : r;
  }
  return { out, divides };
}

/* ──────────────── 정확한 답과 갈리는 자리 ──────────────── */

/** 그 판이 길이 `n` 에서 정답을 내는 마지막 계수 상한과 처음 갈리는 상한 · 그때의 가장 큰 참값. */
function firstMismatch(
  design: (a: number[], b: number[]) => number[],
  n: number,
): { last: number; first: number; peak: bigint; lastPeak: bigint } {
  let last = 0;
  let lastPeak = 0n;
  for (const cap of LADDER) {
    const a = coeffs(n, cap, 1);
    const b = coeffs(n, cap, 2);
    const got = design(a, b);
    const want = exactConv(a, b, 96n);
    let ok = true;
    for (let k = 0; k < want.length; k++) {
      if (BigInt(got[k] as number) !== (want[k] as bigint)) {
        ok = false;
        break;
      }
    }
    const peak = want.reduce((m, x) => (x > m ? x : m), 0n);
    if (!ok) return { last, first: cap, peak, lastPeak };
    last = cap;
    lastPeak = peak;
  }
  return { last, first: 0, peak: 0n, lastPeak };
}

/* ────────────────────────── 자기대조 ────────────────────────── */

const 자기대조_입력: [string, number[], number[]][] = [
  ["전개 입력", WALK_A, WALK_B],
  ["길이 1 과 1", [7], [6]],
  ["길이 2 와 2", [1, 2], [3, 4]],
  ["음수 계수", [1, -1], [1, 1]],
  ["0 계수", [1, 0, 1], [1, 1]],
  ["길이 5 와 3", [1, 2, 3, 4, 5], [6, 7, 8]],
  ["길이 33 과 17", coeffs(33, 50, 3), coeffs(17, 50, 4)],
];

/** 사본들이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  for (const [label, a, b] of 자기대조_입력) {
    const want = fftMultiply(a, b);
    if (!same(naiveConv(a, b), want)) {
      throw new Error(`정의를 옮긴 판이 정본과 다른 답을 낸다 — ${label}`);
    }
    if (!same(circular(a, b, a.length + b.length - 1), want)) {
      throw new Error(`순환 합성곱이 결과 길이에서 선형과 다르다 — ${label}`);
    }
    if (!same(driftMultiply(a, b), want)) {
      throw new Error(`누적 곱 판이 이 규모에서 다른 답을 낸다 — ${label}`);
    }
    if (!same(divideEachRound(a, b).out, want)) {
      throw new Error(
        `바퀴마다 나눈 판이 이 규모에서 다른 답을 낸다 — ${label}`,
      );
    }
  }
  if (fftMultiply([], [1, 2]).length !== 0) throw new Error("빈 입력 계약");
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  fftMultiply: (a: number[], b: number[]) => number[];
}

/** 재배치 조건을 「두 자리가 다르면」으로 넓힌 판 — 같은 짝을 두 번 맞바꾼다. */
const swapTwice = await loadMutant<Impl>(REF, {
  swap: [/if \(i < j\) \{/, "if (i !== j) {"],
});

/** 각도의 부호를 정방향으로 고정한 판 — 역변환이 정방향 변환이 된다. */
const noSign = await loadMutant<Impl>(REF, {
  swap: [
    /const ang = \(\(2 \* Math\.PI\) \/ len\) \* \(invert \? -1 : 1\);/,
    "const ang = (2 * Math.PI) / len;",
  ],
});

/** 역변환 끝의 실수부 나눗셈을 뺀 판 — 계수가 패딩 길이배로 나온다. */
const noDivide = await loadMutant<Impl>(REF, {
  drop: /re\[i\] = \(re\[i\] as number\) \/ size;/,
});

/** 나비의 아래쪽 칸을 방금 덮어쓴 위쪽 칸에서 읽는 판 — 불변식을 지키던 줄이다. */
const clobber = await loadMutant<Impl>(REF, {
  swap: [/re\[bot\] = uRe - vRe;/, "re[bot] = (re[top] as number) - vRe;"],
});

/** 반올림 결과를 그대로 담은 판 — 계수 0 자리에 부호가 붙은 0 이 남는다. */
const keepSign = await loadMutant<Impl>(REF, {
  swap: [/out\[i\] = rounded === 0 \? 0 : rounded;/, "out[i] = rounded;"],
});

/** 빈 입력을 거르는 줄을 뺀 판 — 빈 배열 대신 0 이 늘어선 배열이 나온다. */
const noGuard = await loadMutant<Impl>(REF, {
  drop: /if \(a\.length === 0 \|\| b\.length === 0\) return \[\];/,
});

/**
 * 패딩 길이를 절반으로 잡은 판 — 결과 길이보다 짧은 변환이 무엇을 계산하는지 본다. 반환 배열의 앞
 * `size` 칸이 그 변환의 결과이고, 그 뒤 칸은 배열 밖을 읽어 `NaN` 이다.
 */
const halfPad = await loadMutant<Impl>(REF, {
  swap: [
    /const size = padLength\(resultLen\);/,
    "const size = padLength(resultLen) / 2;",
  ],
});

/** 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않으면 두 함수가 같은 객체다. */
const 중화됨 = swapTwice.fftMultiply === fftMultiply;

const 갈리는_변이: {
  label: string;
  impl: Impl;
  cases: [number[], number[]][];
}[] = [
  { label: "재배치를 두 번 한 판", impl: swapTwice, cases: [[WALK_A, WALK_B]] },
  { label: "각도 부호를 고정한 판", impl: noSign, cases: [[WALK_A, WALK_B]] },
  { label: "나눗셈을 뺀 판", impl: noDivide, cases: [[WALK_A, WALK_B]] },
  { label: "위쪽 칸을 되읽은 판", impl: clobber, cases: [[WALK_A, WALK_B]] },
  { label: "빈 입력 가드를 뺀 판", impl: noGuard, cases: [[[], [1, 2, 3]]] },
];

/** 아주 작은 음수를 반올림한 값 — 부호가 붙은 0 이다. */
const NEG_ZERO = Math.round(-1e-16);

/** `-0` 의 부호가 보이게 적는다. 기본 문자열 변환은 그 부호를 지운다. */
const signed = (v: number): string => (Object.is(v, -0) ? "-0" : String(v));

/** 부호까지 같은가. `-0` 과 `0` 을 다른 값으로 본다. */
const sameSigned = (a: number[], b: number[]): boolean =>
  a.length === b.length && a.every((x, i) => Object.is(x, b[i]));

/** 계수 0 이 나오는 입력을 생성식으로 만든다. */
function zeroMaking(rounds: number): [string, number[], number[]][] {
  let seed = 20260906;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  const out: [string, number[], number[]][] = [];
  for (let t = 0; t < rounds; t++) {
    const n = 1 + (next() % 24);
    const m = 1 + (next() % 24);
    const a = Array.from({ length: n }, () => (next() % 41) - 20);
    const b = Array.from({ length: m }, () => (next() % 41) - 20);
    if (fftMultiply(a, b).some((v) => v === 0))
      out.push([`길이 ${n} · ${m}`, a, b]);
  }
  return out;
}

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  for (const { label, impl, cases } of 갈리는_변이) {
    if (
      cases.every(([a, b]) => same(fftMultiply(a, b), impl.fftMultiply(a, b)))
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
  const zeros = zeroMaking(200);
  if (
    zeros.every(([, a, b]) =>
      sameSigned(fftMultiply(a, b), keepSign.fftMultiply(a, b)),
    )
  ) {
    throw new Error(
      "반올림을 그대로 담은 변이가 어느 입력에서도 답을 바꾸지 못했다",
    );
  }
}

/** 변이 하나를 입력 여럿에 걸어 정본과 나란히 놓는다. */
function mutantTable(
  impl: Impl,
  name: string,
  cases: [string, number[], number[]][],
): string {
  const rows = cases.map(([label, a, b]) => {
    const want = show(fftMultiply(a, b));
    let got: string;
    try {
      got = show(impl.fftMultiply(a, b));
    } catch (error) {
      got = (error as Error).name;
    }
    return [label, want, got, want === got ? "같다" : "어긋난다"];
  });
  return md(["입력", "정본", name, "판정"], rows);
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

const W = walk();
const ANSWER = fftMultiply(WALK_A, WALK_B);
const N = W.size;
const ROUNDS = log2(N);
const HALF = N / 2;

/** 계수 짝을 자리마다 모은 합 — `c₂ = 1·5 + 4·2` 꼴. */
function pairSums(a: readonly number[], b: readonly number[]): string[][] {
  const out: string[][] = [];
  for (let k = 0; k < a.length + b.length - 1; k++) {
    const terms: string[] = [];
    for (let i = 0; i < a.length; i++) {
      const j = k - i;
      if (j >= 0 && j < b.length) terms.push(`${a[i]}·${b[j]}`);
    }
    out.push([`c${k}`, terms.join(" + "), String(naiveConv(a, b)[k])]);
  }
  return out;
}

const ALL_COSTS = (n: number) => {
  const c = fftCost(n, n);
  return c.ops + c.trig;
};

export const PROOFS: Record<string, () => string> = {
  /* ─────────────── concept ─────────────── */

  conceptTask: () => {
    const rows = pairSums(WALK_A, WALK_B);
    return [
      `fftMultiply([${WALK_A.join(", ")}], [${WALK_B.join(", ")}])`,
      `  A = ${poly(WALK_A)} · B = ${poly(WALK_B)}`,
      ...rows.map(([c, t, v]) => `  ${c} = ${t} = ${v}`),
      `  반환 ${show(ANSWER)} · 길이 ${WALK_A.length} + ${WALK_B.length} − 1 = ${ANSWER.length}`,
    ].join("\n");
  },

  conceptCost: () => {
    const lens = [4, 1_024, LIMIT];
    const rows = lens.map((n) => [
      num(n),
      num(naiveOps(n, n)),
      num(ALL_COSTS(n)),
    ]);
    const small = lens.find((n) => ALL_COSTS(n) > naiveOps(n, n));
    return [
      md(
        ["길이 n = m", "정의 그대로 — 기본 연산", "FFT — 연산 전부"],
        rows,
        [0, 1, 2],
      ),
      "",
      `길이 ${num(LIMIT)} 에서 ${num(naiveOps(LIMIT, LIMIT))} 번이 ${num(ALL_COSTS(LIMIT))} 번으로 줄었고, 길이 ${num(small ?? 0)} 처럼 짧은 입력에서는 FFT 가 더 많이 씁니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.origin ─────────────── */

  costNaive: () => {
    const lens = [WALK_A.length, 1_000, 10_000, LIMIT];
    const rows = lens.map((n) => {
      const ops = naiveOps(n, n);
      return [
        num(n),
        num(ops),
        `${(ops / PER_SECOND).toLocaleString("en-US", { maximumFractionDigits: 8 })} 초`,
      ];
    });
    const sec = naiveOps(LIMIT, LIMIT) / PER_SECOND;
    return [
      md(
        ["길이 n = m", "기본 연산", "초당 1 억 번일 때 시간"],
        rows,
        [0, 1, 2],
      ),
      "",
      `마지막 줄의 ${num(sec)} 초는 1 초 예산의 ${num(sec)} 배입니다.`,
    ].join("\n");
  },

  pointValue: () => {
    const xs = Array.from({ length: ANSWER.length }, (_, x) => x);
    const ev = (c: readonly number[], x: number) =>
      c.reduceRight((v, ci) => v * x + ci, 0);
    const rows = xs.map((x) => [
      String(x),
      num(ev(WALK_A, x)),
      num(ev(WALK_B, x)),
      num(ev(WALK_A, x) * ev(WALK_B, x)),
      num(ev(ANSWER, x)),
    ]);
    const allSame = xs.every(
      (x) => ev(WALK_A, x) * ev(WALK_B, x) === ev(ANSWER, x),
    );
    const pairs = WALK_A.length * WALK_B.length;
    return [
      md(
        ["점 x", "A(x)", "B(x)", "A(x) × B(x)", "C(x)"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `점 ${xs.length} 개에서 A(x) × B(x) 와 C(x) 가 ${allSame ? "모두 같습니다" : "다른 줄이 있습니다"}. 곱셈은 점마다 한 번씩 ${xs.length} 번이고, 계수 짝마다 곱하면 ${pairs} 번입니다.`,
    ].join("\n");
  },

  pointCost: () => {
    const rs = POINT_ROUTE_LENS.map((n) => ({ n, ...pointRoute(n) }));
    const rows = rs.map((r) => [
      num(r.n),
      num(r.points),
      num(r.evalOps),
      num(r.interpOps),
      num(naiveOps(r.n, r.n)),
      r.same ? "같다" : "어긋난다",
    ]);
    const wrong = rs.find((r) => !r.same);
    const big = rs.at(-1) as (typeof rs)[number];
    const ratio = Math.round(
      (big.evalOps + big.interpOps) / naiveOps(big.n, big.n),
    );
    return [
      md(
        [
          "길이 n = m",
          "점의 수",
          "평가 — 호너",
          "보간 — 라그랑주",
          "정의대로 곱하기",
          "되찾은 계수",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `세 비용 열은 모두 기본 연산이고, 계수는 생성식으로 만든 0 부터 9 까지의 정수입니다. 길이 ${num(wrong?.n ?? 0)} 부터 되찾은 계수가 정의 그대로 곱한 값과 어긋나고, 길이 ${num(big.n)} 에서 평가와 보간을 합친 기본 연산이 정의 그대로의 약 ${num(ratio)} 배입니다.`,
    ].join("\n");
  },

  pointBasis: () => {
    // 점 0 · 1 · … · L − 1 의 라그랑주 기저 Π (x − j) 의 계수를 큰 정수로 정확히 편다.
    const n = POINT_ROUTE_LENS.find((len) => !pointRoute(len).same) ?? 0;
    const L = 2 * n - 1;
    let peak = 0n;
    for (let i = 0; i < L; i++) {
      let basis: bigint[] = [1n];
      for (let j = 0; j < L; j++) {
        if (j === i) continue;
        const next = new Array<bigint>(basis.length + 1).fill(0n);
        for (let k = 0; k < basis.length; k++) {
          next[k + 1] = (next[k + 1] as bigint) + (basis[k] as bigint);
          next[k] = (next[k] as bigint) - BigInt(j) * (basis[k] as bigint);
        }
        basis = next;
      }
      for (const c of basis) {
        const abs = c < 0n ? -c : c;
        if (abs > peak) peak = abs;
      }
    }
    return [
      `길이 ${n} — 점 ${L} 개의 라그랑주 기저`,
      ...kv([
        ["기저 계수의 가장 큰 절댓값", peak.toLocaleString("en-US")],
        ["배정밀도가 정수를 오차 없이 담는 한계 2^53", num(TWO53)],
        ["한계를 넘는가", peak > BigInt(TWO53) ? "넘는다" : "안 넘는다"],
      ]),
    ].join("\n");
  },

  pmSplit: () => {
    // A(x) = E(x²) + x·O(x²) — 짝수 자리와 홀수 자리 계수로 가른다.
    const even = WALK_A.filter((_, i) => i % 2 === 0);
    const odd = WALK_A.filter((_, i) => i % 2 === 1);
    const ev = (c: readonly number[], x: number) =>
      c.reduceRight((v, ci) => v * x + ci, 0);
    const rows = [1, 2].map((x) => {
      const e = ev(even, x * x);
      const o = ev(odd, x * x);
      return [
        String(x),
        num(x * x),
        num(e),
        num(o),
        num(e + x * o),
        num(ev(WALK_A, x)),
        num(e - x * o),
        num(ev(WALK_A, -x)),
      ];
    });
    const ok = rows.every((r) => r[4] === r[5] && r[6] === r[7]);
    return [
      md(
        ["x", "x²", "E(x²)", "O(x²)", "E + x·O", "A(x)", "E − x·O", "A(−x)"],
        rows,
        [0, 1, 2, 3, 4, 5, 6, 7],
      ),
      "",
      `E 는 짝수 자리 계수 ${show(even)}, O 는 홀수 자리 계수 ${show(odd)} 입니다. 두 줄 모두 E + x·O 가 A(x) 와, E − x·O 가 A(−x) 와 ${ok ? "같습니다" : "다릅니다"}.`,
    ].join("\n");
  },

  squareChain: () => {
    const rows = POINT_SETS.map((s) => [
      s.name,
      ...squareChain(s.points).map(String),
    ]);
    const halving = POINT_SETS.filter((s) => {
      const c = squareChain(s.points);
      return c.every((v, t) => t === 0 || v * 2 === c[t - 1]);
    }).map((s) => s.name);
    const last = squareChain(
      (POINT_SETS.at(-1) as (typeof POINT_SETS)[number]).points,
    );
    return [
      md(
        ["점 여덟 개", "처음", "1 번 제곱", "2 번 제곱", "3 번 제곱"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `제곱할 때마다 서로 다른 값이 반으로 주는 묶음은 ${halving.join(" · ")} 하나이고, ${last.length - 1} 번 만에 ${last.at(-1)} 개가 됩니다. 실수 ± 쌍은 첫 제곱에서만 반으로 줍니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.build — 먼저 알아 둘 개념 ─────────────── */

  rootsRead: () => {
    const k = 3;
    const [re, im] = root(k, 8);
    const deg = (360 / 8) * k;
    return [
      `ω^${k} — N = 8 이고 k = ${k}`,
      ...kv([
        ["각도", `${k} × 360° / 8 = ${deg}°`],
        ["실수부", `cos ${deg}° = ${r2(re)}`],
        ["허수부", `sin ${deg}° = ${r2(im)}`],
        ["값", cx(re, im)],
      ]),
    ].join("\n");
  },

  rootsRelations: () => {
    const n = 8;
    const rows = Array.from({ length: n / 2 }, (_, k) => {
      const w = root(k, n);
      const far = root(k + n / 2, n);
      const sq = mul(w, w);
      const farSq = mul(far, far);
      const nu = root(k, n / 2);
      return [
        String(k),
        cx(...w),
        cx(...far),
        cx(w[0] + far[0], w[1] + far[1]),
        cx(...sq),
        cx(...farSq),
        cx(...nu),
      ];
    });
    const ok = rows.every(
      (r) => r[3] === "0" && r[4] === r[5] && r[5] === r[6],
    );
    return [
      md(
        [
          "k",
          "ω^k",
          "ω^(k+4)",
          "둘의 합",
          "(ω^k)²",
          "(ω^(k+4))²",
          "4 등분 단위근 ν^k",
        ],
        rows,
        [0],
      ),
      "",
      `${rows.length} 줄 ${ok ? "모두" : "중 일부만"} ω^k 와 ω^(k+4) 의 합이 0 이고, 두 점의 제곱이 같으며, 그 값이 4 등분 단위근 ν^k 입니다.`,
    ].join("\n");
  },

  rootsUneven: () => {
    const n = 8;
    const angle = (step: number, k: number) => (step * k) % 360;
    const rows = Array.from({ length: n }, (_, k) => [
      String(k),
      `${angle(45, k)}°`,
      `${angle(45, 2 * k)}°`,
      `${angle(40, k)}°`,
      `${angle(40, 2 * k)}°`,
    ]);
    const d45 = distinct(
      Array.from({ length: n }, (_, k) => mul(root(k, n), root(k, n))),
    );
    const at40 = (k: number): [number, number] => [
      Math.cos((40 * k * Math.PI) / 180),
      Math.sin((40 * k * Math.PI) / 180),
    ];
    const d40 = distinct(
      Array.from({ length: n }, (_, k) => mul(at40(k), at40(k))),
    );
    return [
      md(["k", "45° 간격", "제곱하면", "40° 간격", "제곱하면"], rows, [0]),
      "",
      `제곱한 뒤 서로 다른 점은 45° 간격이 ${d45} 개, 40° 간격이 ${d40} 개입니다. 둘 다 단위원 위의 여덟 점인데, 한 바퀴를 똑같이 여덟으로 나눈 쪽만 제곱해서 겹칩니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.build — 단계 ─────────────── */

  stage1Wrap: () => {
    const linear = naiveConv(WALK_A, WALK_B);
    const short = N / 2;
    const byRef = halfPad.fftMultiply(WALK_A, WALK_B).slice(0, short);
    const byDef = circular(WALK_A, WALK_B, short);
    if (!중화됨 && !same(byRef, byDef)) {
      throw new Error("패딩을 절반으로 잡은 판이 순환 합성곱과 다르다");
    }
    const rows = Array.from({ length: short }, (_, k) => {
      const back = linear
        .map((v, i) => [v, i] as const)
        .filter(([, i]) => i % short === k && i !== k)
        .map(([v]) => v);
      return [
        String(k),
        num(linear[k] as number),
        num(byDef[k] as number),
        linear[k] === byDef[k] ? "같다" : "어긋난다",
        back.length === 0 ? "없다" : `${linear[k]} + ${back.join(" + ")}`,
      ];
    });
    const over = linear.slice(short);
    return [
      md(
        ["자리 k", "선형 곱", `길이 ${short} 변환의 결과`, "판정", "더해진 것"],
        rows,
        [0, 1, 2],
      ),
      "",
      `결과 길이는 ${linear.length} 인데 변환 길이가 ${short} 라, 넘치는 자리 ${short} 의 값 ${over.join(" · ")}${이가(over.join(" · "))} 자리 ${short}${을를(String(short))} ${short}${으로(String(short))} 나눈 나머지인 자리 0 에 더해졌습니다. 가운데 열은 정의대로 센 순환 합성곱이고, 패딩 길이를 절반으로 줄인 정본 변이의 앞 ${short} 칸과 같습니다.`,
    ].join("\n");
  },

  stage2Split: () => {
    const half = W.fwdA[ROUNDS - 1] as Shot;
    const full = W.fwdA[ROUNDS] as Shot;
    const even = WALK_A.filter((_, i) => i % 2 === 0);
    const odd = WALK_A.filter((_, i) => i % 2 === 1);
    const de = dftByDefinition(even, HALF);
    const dO = dftByDefinition(odd, HALF);
    let ok = true;
    const rows = Array.from({ length: HALF }, (_, k) => {
      const u: [number, number] = [half.re[k] as number, half.im[k] as number];
      const o: [number, number] = [
        half.re[k + HALF] as number,
        half.im[k + HALF] as number,
      ];
      const v = mul(root(k, N), o);
      const plus: [number, number] = [u[0] + v[0], u[1] + v[1]];
      const minus: [number, number] = [u[0] - v[0], u[1] - v[1]];
      const f0: [number, number] = [full.re[k] as number, full.im[k] as number];
      const f1: [number, number] = [
        full.re[k + HALF] as number,
        full.im[k + HALF] as number,
      ];
      const [dek, dok] = [de[k] as [number, number], dO[k] as [number, number]];
      if (
        !close(plus[0], f0[0]) ||
        !close(plus[1], f0[1]) ||
        !close(minus[0], f1[0]) ||
        !close(minus[1], f1[1]) ||
        !close(u[0], dek[0]) ||
        !close(u[1], dek[1]) ||
        !close(o[0], dok[0]) ||
        !close(o[1], dok[1])
      ) {
        ok = false;
      }
      return [
        String(k),
        cx(...u),
        cx(...o),
        cx(...v),
        cx(...plus),
        cx(...f0),
        cx(...minus),
        cx(...f1),
      ];
    });
    return [
      md(
        [
          "k",
          "E 의 변환 u",
          "O 의 변환",
          "ω^k × O 의 변환 = v",
          "u + v",
          "A 의 변환 k",
          "u − v",
          `A 의 변환 k + ${HALF}`,
        ],
        rows,
        [0],
      ),
      "",
      `E 는 짝수 자리 계수 ${show(even)}, O 는 홀수 자리 계수 ${show(odd)} 이고, 둘의 변환은 길이 ${HALF} 짜리입니다. ${rows.length} 줄 ${ok ? "모두" : "중 일부만"} u + v 가 A 의 변환 앞 절반, u − v 가 뒤 절반과 같습니다(반올림 전 값의 차가 1e-9 미만).`,
    ].join("\n");
  },

  stage3Count: () => {
    const rows = [2, 4, 8, 16, 1_024].map((n) => {
      const levels = log2(n);
      return [
        num(n),
        String(levels),
        num(n / 2),
        num((n / 2) * levels),
        num(n * n),
      ];
    });
    return [
      md(
        [
          "변환 길이 N",
          "가르는 층",
          "층마다 나비",
          "나비 전부",
          "정의 그대로의 복소수 곱",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `길이 ${num(1_024)} 에서 나비가 ${num((1_024 / 2) * log2(1_024))} 개이고, 정의 그대로 모든 자리에서 평가하면 복소수 곱이 ${num(1_024 * 1_024)} 번입니다.`,
    ].join("\n");
  },

  stage4Bits: () => {
    const first = W.fwdA[0] as Shot;
    const rows = Array.from({ length: N }, (_, i) => {
      const j = reverseBits(i, ROUNDS);
      return [
        String(i),
        i.toString(2).padStart(ROUNDS, "0"),
        j.toString(2).padStart(ROUNDS, "0"),
        String(j),
        String(first.re[i]),
      ];
    });
    const pairs = swapPairs(N);
    return [
      md(
        ["칸 i", "i 의 이진", "뒤집은 이진", "가져오는 자리", "재배치 뒤 aRe"],
        rows,
        [0, 3, 4],
      ),
      "",
      `맞바뀌는 짝은 ${pairs.map(([i, j]) => `${i} ↔ ${j}`).join(" · ")}${으로(String(pairs.at(-1)?.[1]))} ${pairs.length} 개이고, 나머지 ${N - 2 * pairs.length} 칸은 뒤집어도 제자리입니다.`,
    ].join("\n");
  },

  stage5Inverse: () => {
    const last = W.inv.at(-1) as Shot;
    const rows = Array.from({ length: N }, (_, k) => [
      String(k),
      cx(W.product.re[k] as number, W.product.im[k] as number),
      cx(last.re[k] as number, last.im[k] as number),
      cx(W.divided.re[k] as number, W.divided.im[k] as number),
      k < ANSWER.length ? String(naiveConv(WALK_A, WALK_B)[k]) : "0",
    ]);
    return [
      md(
        ["자리 k", "A·B", "역방향 바퀴 뒤", `÷ ${N}`, "정의 그대로 c"],
        rows,
        [0],
      ),
      "",
      `역방향 바퀴를 마치면 앞 ${ANSWER.length} 칸의 실수부가 계수의 ${N} 배이고, ${N}${으로(N)} 나누면 정의 그대로 곱한 계수와 같아집니다.`,
    ].join("\n");
  },

  designPad: () => {
    const rows = [8, 16, 32, 64, 128].map((size) => {
      const padA = Array.from({ length: size }, (_, i) => WALK_A[i] ?? 0);
      const padB = Array.from({ length: size }, (_, i) => WALK_B[i] ?? 0);
      const got = fftMultiply(padA, padB).slice(0, ANSWER.length);
      const levels = log2(size);
      return [
        num(size),
        String(levels),
        num(3 * (size / 2) * levels),
        show(got),
        same(got, ANSWER) ? "같다" : "어긋난다",
      ];
    });
    return [
      md(
        [
          "패딩 길이 N",
          "바퀴",
          "변환 셋의 나비",
          `앞 ${ANSWER.length} 칸`,
          "판정",
        ],
        rows,
        [0, 1, 2],
      ),
      "",
      `${rows.length} 가지 패딩 길이 ${rows.every((r) => r[4] === "같다") ? "모두" : "중 일부만"} 답이 같고 나비만 늘어납니다. 결과 길이 ${ANSWER.length} 이상인 2 의 거듭제곱 중 가장 작은 것이 ${N} 입니다.`,
    ].join("\n");
  },

  designTwiddle: () => {
    const rows = [32, 128, 512, 2_048].map((n) => {
      const a = firstMismatch((x, y) => fftMultiply(x, y), n);
      const b = firstMismatch(driftMultiply, n);
      return [
        num(n),
        num(a.last),
        num(b.last),
        a.last === b.last ? "같다" : "어긋난다",
      ];
    });
    return [
      md(
        ["길이 n = m", "자리마다 다시 구한 판", "누적 곱으로 이은 판", "판정"],
        rows,
        [0, 1, 2],
      ),
      "",
      "두 열은 정답을 낸 마지막 계수 상한입니다. 두 판은 회전 인자를 만드는 방법만 다르고, 누적 곱으로 이은 판이 네 길이 모두에서 더 작은 계수부터 갈립니다.",
    ].join("\n");
  },

  /* ─────────────── deep.walk ─────────────── */

  walkLengths: () => {
    const resultLen = WALK_A.length + WALK_B.length - 1;
    const doubling: string[] = [];
    let size = 1;
    while (size < resultLen) {
      doubling.push(`${size} < ${resultLen} 참 → ${size << 1}`);
      size <<= 1;
    }
    doubling.push(`${size} < ${resultLen} 거짓 → 멈춤`);
    return [
      `T1 — a.length = ${WALK_A.length}, b.length = ${WALK_B.length}`,
      ...kv([
        [
          "① 빈 입력 가드",
          `${WALK_A.length} === 0 || ${WALK_B.length} === 0 → 거짓, 계속`,
        ],
        ["resultLen", `${WALK_A.length} + ${WALK_B.length} − 1 = ${resultLen}`],
        ["size", doubling.join(" · ")],
        ["L 과 N", `L = ${resultLen}, N = ${size}`],
      ]),
    ].join("\n");
  },

  walkFill: () => {
    const rows = [
      ["aRe", ...W.fillA.re.map(String)],
      ["aIm", ...W.fillA.im.map(String)],
      ["bRe", ...W.fillB.re.map(String)],
      ["bIm", ...W.fillB.im.map(String)],
    ];
    return md(
      ["배열", ...Array.from({ length: N }, (_, i) => `칸 ${i}`)],
      rows,
      Array.from({ length: N }, (_, i) => i + 1),
    );
  },

  walkReorder: () => {
    const pairs = swapPairs(N);
    return [
      "T3 이 끝난 시점",
      ...kv([
        ["aRe", (W.fwdA[0] as Shot).re.join(" ")],
        ["aIm", (W.fwdA[0] as Shot).im.join(" ")],
        ["맞바꾼 짝", pairs.map(([i, j]) => `${i} ↔ ${j}`).join(" · ")],
      ]),
    ].join("\n");
  },

  pauseSwap: () =>
    [
      mutantTable(swapTwice, "두 자리가 다르면 맞바꾼 판", [
        ["길이 4 · 2 — 패딩 8", WALK_A, WALK_B],
        ["길이 2 · 2 — 패딩 4", [1, 2], [3, 4]],
        ["길이 2 · 1 — 패딩 2", [1, 2], [3]],
        ["길이 1 · 1 — 패딩 1", [7], [6]],
      ]),
      "",
      "패딩 길이가 2 인 줄은 그 조건을 실제로 지나가지만 자리 1 을 뒤집어도 자리 1 이라 두 판 모두 맞바꾸지 않고, 패딩 길이가 1 인 줄은 재배치 반복에 들어가지도 않습니다.",
    ].join("\n"),

  walkRounds: () => {
    const rows = [
      ...W.fwdA
        .slice(1)
        .map((s, r) => [`T${4 + r}`, `A · 블록 길이 ${2 << r}`, ...cells(s)]),
      [`T${4 + ROUNDS}`, "B · 세 바퀴 뒤", ...cells(W.fwdB.at(-1) as Shot)],
    ];
    const halfShot = W.fwdA[ROUNDS - 1] as Shot;
    const even = dftByDefinition(
      WALK_A.filter((_, i) => i % 2 === 0),
      HALF,
    );
    const odd = dftByDefinition(
      WALK_A.filter((_, i) => i % 2 === 1),
      HALF,
    );
    const ok = Array.from({ length: HALF }, (_, k) => k).every(
      (k) =>
        close(halfShot.re[k] as number, (even[k] as [number, number])[0]) &&
        close(
          halfShot.re[k + HALF] as number,
          (odd[k] as [number, number])[0],
        ) &&
        close(halfShot.im[k] as number, (even[k] as [number, number])[1]) &&
        close(halfShot.im[k + HALF] as number, (odd[k] as [number, number])[1]),
    );
    return [
      md(
        ["걸음", "무엇", ...Array.from({ length: N }, (_, i) => `칸 ${i}`)],
        rows,
      ),
      "",
      `T${3 + ROUNDS - 1} 의 앞 ${HALF} 칸은 짝수 자리 계수의 변환, 뒤 ${HALF} 칸은 홀수 자리 계수의 변환과 ${ok ? "같습니다" : "다릅니다"}. T${3 + ROUNDS} 의 여덟 칸이 A 를 단위근 ${N} 개에서 평가한 값입니다.`,
    ].join("\n");
  },

  walkProduct: () => {
    const a = W.fwdA.at(-1) as Shot;
    const b = W.fwdB.at(-1) as Shot;
    const rows = Array.from({ length: N }, (_, k) => [
      String(k),
      cx(a.re[k] as number, a.im[k] as number),
      cx(b.re[k] as number, b.im[k] as number),
      cx(W.product.re[k] as number, W.product.im[k] as number),
    ]);
    return [
      md(["자리 k", "A 의 값", "B 의 값", "곱"], rows, [0]),
      "",
      `자리 0 은 허수부가 둘 다 0 이라 ${r2(a.re[0] as number)} × ${r2(b.re[0] as number)} = ${r2(W.product.re[0] as number)} 입니다. 복소수 곱 한 번이 기본 연산 6 번이라 ${N} 자리에서 ${6 * N} 번입니다.`,
    ].join("\n");
  },

  walkInverse: () => {
    const rows = [
      [`T${6 + ROUNDS}`, "재배치", ...cells(W.inv[0] as Shot)],
      ...W.inv
        .slice(1)
        .map((s, r) => [`T${7 + ROUNDS}`, `블록 길이 ${2 << r}`, ...cells(s)]),
      [`T${8 + ROUNDS}`, `÷ ${N}`, ...cells(W.divided)],
    ];
    return md(
      ["걸음", "무엇", ...Array.from({ length: N }, (_, i) => `칸 ${i}`)],
      rows,
    );
  },

  pauseSign: () =>
    [
      mutantTable(noSign, "각도 부호를 고정한 판", [
        ["길이 4 · 2 — 패딩 8", WALK_A, WALK_B],
        ["길이 2 · 2 — 패딩 4", [1, 2], [3, 4]],
        ["길이 3 · 3 — 패딩 8", [1, 2, 3], [4, 5, 6]],
      ]),
      "",
      `첫 줄에서 자리 0 은 그대로이고, 자리 k 에는 원래 자리 ${N} − k 의 값이 와 있습니다. 전개 입력은 자리 ${ANSWER.length} 부터 ${N - 1} 까지가 0 이라 가운데가 0 으로 채워졌습니다.`,
    ].join("\n"),

  pauseDivide: () => {
    const got = noDivide.fftMultiply(WALK_A, WALK_B);
    const rows = ANSWER.map((v, k) => [
      String(k),
      num(v),
      num(got[k] as number),
      `${num(v)} × ${N} = ${num(v * N)}`,
      v === got[k] ? "같다" : "어긋난다",
    ]);
    return [
      md(
        ["자리 k", "정본", "나눗셈을 뺀 판", "정본 × 패딩 길이", "판정"],
        rows,
        [0, 1, 2],
      ),
      "",
      `${rows.length} 자리 ${ANSWER.every((v, k) => got[k] === v * N) ? "모두" : "중 일부만"} 정확히 ${N} 배입니다.`,
    ].join("\n");
  },

  walkRound: () => {
    const rows = Array.from({ length: ANSWER.length }, (_, k) => [
      String(k),
      String(W.divided.re[k]),
      String(ANSWER[k]),
      W.divided.re[k] === ANSWER[k] ? "정수 그대로" : "반올림이 고쳤다",
    ]);
    return [
      md(["자리 k", "나눗셈 뒤 실수부", "반올림", "차이"], rows, [0, 2]),
      "",
      same(ANSWER, naiveConv(WALK_A, WALK_B))
        ? `반환과 정의 그대로 센 값이 둘 다 ${show(ANSWER)} 입니다.`
        : `반환 ${show(ANSWER)} 이 정의 그대로 센 값 ${show(naiveConv(WALK_A, WALK_B))} 과 다릅니다.`,
    ].join("\n");
  },

  pauseNegzero: () => {
    const rounds = 200;
    const zeros = zeroMaking(rounds);
    const differing = zeros.filter(
      ([, a, b]) => !sameSigned(fftMultiply(a, b), keepSign.fftMultiply(a, b)),
    );
    const rows = differing.slice(0, 5).map(([label, a, b]) => {
      const want = fftMultiply(a, b);
      const got = keepSign.fftMultiply(a, b);
      const where = want.findIndex((v, i) => !Object.is(v, got[i]));
      return [
        label,
        String(want.length),
        String(where),
        signed(want[where] as number),
        signed(got[where] as number),
        sameSigned(want, got) ? "같다" : "어긋난다",
      ];
    });
    return [
      md(
        [
          "입력",
          "결과 길이",
          "처음 갈리는 자리",
          "정본의 그 값",
          "반올림을 그대로 담은 판",
          "판정",
        ],
        rows,
        [1, 2],
      ),
      "",
      `생성식으로 만든 입력 ${rounds} 벌 가운데 계수 0 이 나온 것이 ${zeros.length} 벌이고, 그중 ${differing.length} 벌에서 부호까지 갈렸습니다. Math.round(-1e-16) 은 ${signed(NEG_ZERO)} 이고, 이 값과 0 을 === 로 비교하면 ${NEG_ZERO === 0 ? "같다고" : "다르다고"} 나오지만 Object.is 로는 ${Object.is(NEG_ZERO, 0) ? "같다고" : "다르다고"} 나옵니다.`,
    ].join("\n");
  },

  pauseRound: () => {
    const lens = [8, 32, 128, 512, 2_048];
    const found = lens.map((n) =>
      firstMismatch((a, b) => fftMultiply(a, b), n),
    );
    const rows = lens.map((n, i) => {
      const m = found[i] as ReturnType<typeof firstMismatch>;
      let size = 1;
      while (size < 2 * n - 1) size <<= 1;
      return [
        num(n),
        num(size),
        num(m.last),
        m.lastPeak.toLocaleString("en-US"),
        num(m.first),
        m.peak.toLocaleString("en-US"),
      ];
    });
    const peaks = found.map((m) => m.peak);
    const low = peaks.reduce((x, y) => (y < x ? y : x));
    const high = peaks.reduce((x, y) => (y > x ? y : x));
    const lastPeaks = found.map((m) => m.lastPeak);
    const lastHigh = lastPeaks.reduce((x, y) => (y > x ? y : x));
    return [
      md(
        [
          "길이 n = m",
          "패딩 길이",
          "정답을 낸 마지막 상한",
          "그때 가장 큰 참값",
          "처음 갈리는 상한",
          "그때 가장 큰 참값",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `계수 상한은 ${LADDER.slice(0, 6).map(num).join(" · ")}${을를(num(LADDER[5] ?? 0))} 10 배씩 올려 ${num(LADDER.at(-1) ?? 0)} 까지 가는 사다리입니다. 처음 갈린 자리의 가장 큰 참값은 ${low.toLocaleString("en-US")} 부터 ${high.toLocaleString("en-US")} 까지이고, 배정밀도가 정수를 오차 없이 담는 한계 2^53 = ${num(TWO53)} 보다 작습니다. 마지막으로 정답을 낸 자리의 가장 큰 참값은 ${lastHigh.toLocaleString("en-US")} 이하였습니다.`,
    ].join("\n");
  },

  walkTrace: () => {
    const resultLen = ANSWER.length;
    const sizes: number[] = [];
    for (let s = 1; s < resultLen; s <<= 1) sizes.push(s);
    const pairs = swapPairs(N);
    const trueAt = pairs.map(([i]) => i);
    const falseAt = Array.from({ length: N - 1 }, (_, i) => i + 1).filter(
      (i) => !trueAt.includes(i),
    );
    const lens = Array.from({ length: ROUNDS }, (_, r) => 2 << r);
    const zeroOut = ANSWER.filter((v) => v === 0).length;
    const rows = [
      [
        "T1",
        "①",
        `두 길이가 ${WALK_A.length} · ${WALK_B.length}${josa(String(WALK_B.length), "이라", "라")} a.length === 0 또는 b.length === 0 이 거짓 · size < ${resultLen}${이가(String(resultLen))} ${sizes.join(" · ")} 에서 참, ${N} 에서 거짓`,
      ],
      ["T2", "②", `aRe 에 ${WALK_A.length} 칸, bRe 에 ${WALK_B.length} 칸`],
      [
        "T3",
        "③",
        `i < j 가 i = ${trueAt.join(" · ")} 에서 참, i = ${falseAt.join(" · ")} 에서 거짓`,
      ],
      [
        `T4 ~ T${3 + ROUNDS}`,
        "④",
        `len ≤ ${N}${이가(String(N))} len = ${lens.join(" · ")} 에서 참, ${N * 2} 에서 거짓 · invert 거짓`,
      ],
      [`T${4 + ROUNDS}`, "③ ④", "B 에 같은 재배치와 바퀴"],
      [`T${5 + ROUNDS}`, "⑤", `${N} 자리`],
      [`T${6 + ROUNDS}`, "③", `i < j 가 i = ${trueAt.join(" · ")} 에서 참`],
      [`T${7 + ROUNDS}`, "④", "invert 참 — 각도에 −1 이 붙는다"],
      [`T${8 + ROUNDS}`, "⑥", `invert 참 — ${N} 칸을 나눈다`],
      [
        `T${9 + ROUNDS}`,
        "⑦",
        `rounded === 0 이 ${resultLen} 칸 중 ${zeroOut} 칸에서 참 — 앞의 값 그대로 담는다`,
      ],
    ];
    return [
      md(["걸음", "갈래", "조건과 그 값"], rows),
      "",
      `변환은 세 번 불렸고 한 변환의 나비는 ${(N / 2) * ROUNDS} 개입니다. 반환은 ${show(ANSWER)} 입니다.`,
    ].join("\n");
  },

  finalCalls: () => {
    const calls: [number[], number[]][] = [
      [WALK_A, WALK_B],
      [
        [1, 2],
        [1, 3],
      ],
      [
        [1, 0, 1],
        [1, 1],
      ],
      [
        [1, -1],
        [1, 1],
      ],
      [[], [1, 2, 3]],
      [[7], [6]],
    ];
    const lines = calls.map(([a, b]) => [
      `fftMultiply(${show(a)}, ${show(b)})`,
      show(fftMultiply(a, b)),
    ]);
    const w = Math.max(...lines.map(([l]) => (l as string).length));
    return [
      ...lines.map(([l, r]) => `${(l as string).padEnd(w)}  → ${r}`),
    ].join("\n");
  },

  relatedValues: () => {
    const a = W.fwdA.at(-1) as Shot;
    return [
      ...kv(
        [
          ["변환", `${show(WALK_A)} → ${cells(a).join(" · ")}`],
          ["옮긴 뒤의 연산", `자리마다 B 의 값과 곱 ${N} 번`],
          ["역변환", `→ ${show(ANSWER)}`],
        ],
        "",
      ),
    ].join("\n");
  },

  /* ─────────────── part 2 ─────────────── */

  fitShapes: () => {
    const shapes: [string, number, number, number][] = [
      ["길이 100,000 씩 · 계수 1,000 이하", LIMIT, LIMIT, 1_000],
      ["길이 100,000 과 3 · 계수 1,000 이하", LIMIT, 3, 1_000],
      ["길이 100,000 씩 · 계수 10,000,000 이하", LIMIT, LIMIT, 10_000_000],
    ];
    const rows = shapes.map(([label, n, m, cap]) => {
      const f = fftCost(n, m);
      const bound = BigInt(Math.min(n, m)) * BigInt(cap) * BigInt(cap);
      return [
        label,
        num(naiveOps(n, m)),
        num(f.ops + f.trig),
        bound.toLocaleString("en-US"),
        naiveOps(n, m) < f.ops + f.trig ? "정의 그대로" : "FFT",
        bound < BigInt(TWO53) ? "상한이 작다" : "상한이 크다",
      ];
    });
    return [
      md(
        [
          "모양",
          "정의 그대로 — 기본 연산",
          "FFT — 연산 전부",
          "참값의 상한 min(n, m)·M²",
          "적은 쪽",
          "상한과 2^53",
        ],
        rows,
        [1, 2, 3],
      ),
      "",
      "참값의 상한은 곱의 한 자리에 모이는 짝이 min(n, m) 개 이하이고 짝 하나가 M² 이하라서 나오는 식입니다.",
    ].join("\n");
  },

  altCounts: () => {
    const rows = [SHORT_LEN, LONG_LEN].flatMap((n) => {
      const f = fftCost(n, n);
      const k = karatsubaCost(n, n);
      return [
        [num(n), "기본 연산", num(f.ops), num(k.ops)],
        [num(n), "삼각함수 호출", num(f.trig), "0"],
        [num(n), "연산 전부", num(f.ops + f.trig), num(k.ops)],
        [num(n), "할당 칸", num(f.cells), num(k.cells)],
      ];
    });
    const kara = (a: number[], b: number[]) =>
      karatsuba(a, b, { ops: 0, trig: 0, cells: 0 });
    const tf = firstMismatch((a, b) => fftMultiply(a, b), TINY_LEN).last;
    const tk = firstMismatch(kara, TINY_LEN).last;
    const lf = firstMismatch((a, b) => fftMultiply(a, b), LONG_LEN).last;
    const lk = firstMismatch(kara, LONG_LEN).last;
    return [
      md(["길이 n = m", "계수", "FFT", "카라추바"], rows, [0, 2, 3]),
      "",
      `정답을 낸 마지막 계수 상한은 길이 ${TINY_LEN} 에서 FFT ${num(tf)} · 카라추바 ${num(tk)}, 길이 ${num(LONG_LEN)} 에서 FFT ${num(lf)} · 카라추바 ${num(lk)} 입니다.`,
    ].join("\n");
  },

  altAxes: () => {
    const fs = fftCost(SHORT_LEN, SHORT_LEN);
    const ks = karatsubaCost(SHORT_LEN, SHORT_LEN);
    const fl = fftCost(LONG_LEN, LONG_LEN);
    const kl = karatsubaCost(LONG_LEN, LONG_LEN);
    const kara = (a: number[], b: number[]) =>
      karatsuba(a, b, { ops: 0, trig: 0, cells: 0 });
    const tf = firstMismatch((a, b) => fftMultiply(a, b), TINY_LEN).last;
    const tk = firstMismatch(kara, TINY_LEN).last;
    const lf = firstMismatch((a, b) => fftMultiply(a, b), LONG_LEN).last;
    const lk = firstMismatch(kara, LONG_LEN).last;
    const less = (f: number, k: number) => (f < k ? "FFT" : "카라추바");
    const more = (f: number, k: number) => (f > k ? "FFT" : "카라추바");
    const rows = [
      [
        `길이 ${SHORT_LEN} · 연산 전부`,
        num(fs.ops + fs.trig),
        num(ks.ops),
        less(fs.ops + fs.trig, ks.ops),
      ],
      [
        `길이 ${num(LONG_LEN)} · 연산 전부`,
        num(fl.ops + fl.trig),
        num(kl.ops),
        less(fl.ops + fl.trig, kl.ops),
      ],
      [
        `길이 ${num(LONG_LEN)} · 할당 칸`,
        num(fl.cells),
        num(kl.cells),
        less(fl.cells, kl.cells),
      ],
      [
        `길이 ${TINY_LEN} · 정답을 낸 계수 상한`,
        num(tf),
        num(tk),
        more(tf, tk),
      ],
      [
        `길이 ${num(LONG_LEN)} · 정답을 낸 계수 상한`,
        num(lf),
        num(lk),
        more(lf, lk),
      ],
    ];
    return md(["축", "FFT", "카라추바", "나은 쪽"], rows, [1, 2]);
  },

  altFlips: () => {
    const upTo = 8_192;
    const flips = flipLengths(upTo);
    const rows = flips.map((n) => {
      const before = fftCost(n - 1, n - 1);
      const after = fftCost(n, n);
      const kBefore = karatsubaCost(n - 1, n - 1);
      const kAfter = karatsubaCost(n, n);
      return [
        num(n),
        num(before.ops + before.trig),
        num(kBefore.ops),
        num(after.ops + after.trig),
        num(kAfter.ops),
        after.ops + after.trig < kAfter.ops ? "FFT" : "카라추바",
      ];
    });
    return [
      md(
        [
          "길이",
          "한 칸 앞 — FFT",
          "한 칸 앞 — 카라추바",
          "그 길이 — FFT",
          "그 길이 — 카라추바",
          "그 길이에서 적은 쪽",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `길이 2 부터 ${num(upTo)} 까지 재면 적은 쪽이 ${flips.length} 곳에서 바뀌고, 마지막으로 바뀌는 자리는 ${num(flips.at(-1) ?? 0)} 입니다.`,
    ].join("\n");
  },

  mathHand: () => {
    const k = 1;
    const terms = WALK_A.map((c, j) => {
      const w = root(j * k, N);
      return [`${c} · ω^${j}`, cx(c * w[0], c * w[1])];
    });
    const sum = WALK_A.reduce<[number, number]>(
      (acc, c, j) => {
        const w = root(j * k, N);
        return [acc[0] + c * w[0], acc[1] + c * w[1]];
      },
      [0, 0],
    );
    return [
      `DFT(a)[${k}] — N = ${N}, a = ${show(WALK_A)} 뒤는 0`,
      ...terms.map(([l, v]) => `  ${l} = ${v}`),
      `  합 = ${cx(...sum)}`,
    ].join("\n");
  },

  mathCheck: () => {
    const def = dftByDefinition(WALK_A, N);
    const got = W.fwdA.at(-1) as Shot;
    const rows = def.map(([re, im], k) => [
      String(k),
      cx(re, im),
      cx(got.re[k] as number, got.im[k] as number),
      close(re, got.re[k] as number) && close(im, got.im[k] as number)
        ? "같다"
        : "어긋난다",
    ]);
    return [
      md(["k", "정의대로 계산한 값", "FFT 가 낸 값", "판정"], rows, [0]),
      "",
      `판정은 반올림 전 값의 차가 1e-9 보다 작은가로 했습니다. 정의 그대로 계산하면 실수 곱이 자리 짝마다 둘씩 ${2 * N * N} 번이고, FFT 는 나비 ${(N / 2) * ROUNDS} 개로 같은 값을 냈습니다.`,
    ].join("\n");
  },

  mathOrtho: () => {
    const rows = Array.from({ length: N }, (_, d) => {
      const sum = Array.from({ length: N }, (_, k) => root(k * d, N)).reduce<
        [number, number]
      >((acc, w) => [acc[0] + w[0], acc[1] + w[1]], [0, 0]);
      return [String(d), cx(...sum)];
    });
    const nonZero = rows.filter((r) => r[1] !== "0").map((r) => r[0]);
    return [
      md(["d", `ω^(k·d) 를 k = 0 … ${N - 1} 에서 더한 값`], rows, [0]),
      "",
      `합이 0 이 아닌 d 는 ${nonZero.join(" · ")} 하나이고 그때 합이 ${N} 입니다. 나머지 ${N - nonZero.length} 개에서는 소수 둘째 자리까지 0 입니다.`,
    ].join("\n");
  },

  mathRecur: () => {
    const F = new Map<number, number>([[1, 0]]);
    const rows: string[][] = [];
    for (let n = 1; n <= 32; n <<= 1) {
      if (n > 1) F.set(n, 2 * (F.get(n / 2) as number) + n / 2);
      const closed = (n / 2) * log2(n);
      rows.push([
        num(n),
        num(F.get(n) as number),
        num(closed),
        F.get(n) === closed ? "같다" : "어긋난다",
      ]);
    }
    return md(
      ["N", "F(N) — 점화식", "(N/2) · log₂ N", "판정"],
      rows,
      [0, 1, 2],
    );
  },

  mathScale: () => {
    const rows = [1_000, 10_000, LIMIT].map((n) => {
      let size = 1;
      while (size < 2 * n - 1) size <<= 1;
      const levels = log2(size);
      const cost = fftCost(n, n);
      const closed = 33 * (size / 2) * levels + 8 * size;
      const closedTrig = 3 * size * levels;
      return [
        num(n),
        num(size),
        String(levels),
        num(closed),
        num(cost.ops),
        num(closedTrig),
        num(cost.trig),
        closed === cost.ops && closedTrig === cost.trig ? "같다" : "어긋난다",
      ];
    });
    const f = fftCost(LIMIT, LIMIT);
    const all = f.ops + f.trig;
    return [
      md(
        [
          "길이 n = m",
          "패딩 길이 N",
          "log2 N",
          "기본 연산 — 식",
          "기본 연산 — 실측",
          "삼각함수 — 식",
          "삼각함수 — 실측",
          "판정",
        ],
        rows,
        [0, 1, 2, 3, 4, 5, 6],
      ),
      "",
      `과제 규모 ${num(LIMIT)} 에서 FFT 의 연산 전부는 ${num(all)} 번이고, 정의 그대로의 기본 연산 ${num(naiveOps(LIMIT, LIMIT))} 번의 약 ${num(Math.round(naiveOps(LIMIT, LIMIT) / all))} 분의 1 입니다.`,
    ].join("\n");
  },

  /* ─────────────── invariant ─────────────── */

  invBlocks: () => {
    const rows: string[][] = [];
    let ok = 0;
    for (let r = 0; r <= ROUNDS; r++) {
      const len = 1 << r;
      const shot = W.fwdA[Math.max(0, r)] as Shot;
      // len 1 은 재배치 직후(fwdA[0]), len 2^r 은 r 번째 바퀴 뒤(fwdA[r]).
      const stride = N / len;
      const sBits = log2(stride);
      for (let blk = 0; blk * len < N; blk++) {
        const start = blk * len;
        const residue = reverseBits(blk, sBits);
        const members = Array.from(
          { length: len },
          (_, t) => residue + t * stride,
        );
        const sub = members.map((j) => WALK_A[j] ?? 0);
        const want = dftByDefinition(sub, len);
        const good = want.every(
          ([re, im], k) =>
            close(re, shot.re[start + k] as number) &&
            close(im, shot.im[start + k] as number),
        );
        if (good) ok++;
        rows.push([
          String(len),
          `${start}..${start + len - 1}`,
          members.join(" "),
          sub.join(" "),
          cells({
            re: shot.re.slice(start, start + len),
            im: shot.im.slice(start, start + len),
          }).join(" · "),
          good ? "같다" : "어긋난다",
        ]);
      }
    }
    return [
      md(
        [
          "블록 길이",
          "칸",
          "맡은 원래 자리",
          "그 자리의 계수",
          "블록의 값",
          "판정",
        ],
        rows,
        [0],
      ),
      "",
      `판정은 맡은 자리의 계수만 모아 정의 그대로 변환한 값과 블록의 값을 비교한 것이고, ${rows.length} 블록 중 ${ok} 블록이 같습니다.`,
    ].join("\n");
  },

  invEdges: () => {
    const cases: [string, number[], number[]][] = [
      ["앞이 빈 배열", [], [1, 2, 3]],
      ["뒤가 빈 배열", [1, 2, 3], []],
      ["둘 다 길이 1", [7], [6]],
      ["0 하나씩", [0], [0]],
      ["0 계수가 낀 경우", [1, 0, 1], [1, 1]],
      ["음수 계수", [1, -1], [1, 1]],
      ["결과 길이가 패딩과 같은 경우", [1, 2, 3], [4, 5]],
      ["계수가 큰 경우", [1000], [1000]],
    ];
    const rows = cases.map(([label, a, b]) => {
      const got = fftMultiply(a, b);
      const empty = a.length === 0 || b.length === 0;
      const resultLen = a.length + b.length - 1;
      let size = 1;
      while (size < resultLen) size <<= 1;
      return [
        label,
        `${show(a)} × ${show(b)}`,
        empty ? "없다" : String(resultLen),
        empty ? "없다" : String(size),
        show(got),
        same(got, naiveConv(a, b)) ? "같다" : "어긋난다",
      ];
    });
    return [
      md(
        ["경우", "입력", "결과 길이", "패딩 길이", "반환", "정의와 비교"],
        rows,
        [2, 3],
      ),
      "",
      `${rows.length} 경우 ${rows.every((r) => r[5] === "같다") ? "모두" : "중 일부만"} 정의 그대로 곱한 값과 같습니다. 빈 배열은 패딩 길이를 정하기 전에 돌아 나오므로 결과 길이와 패딩 길이가 없습니다.`,
    ].join("\n");
  },

  invGuard: () =>
    mutantTable(noGuard, "가드를 뺀 판", [
      ["앞이 빈 배열", [], [1, 2, 3]],
      ["뒤가 빈 배열", [1, 2, 3], []],
      ["둘 다 길이 1", [7], [6]],
    ]),

  invMutant: () => {
    const got = clobber.fftMultiply(WALK_A, WALK_B);
    const rows = ANSWER.map((v, k) => [
      String(k),
      num(v),
      num(got[k] as number),
      v === got[k] ? "같다" : "어긋난다",
    ]);
    return [
      md(["자리 k", "정본", "위쪽 칸을 되읽은 판", "판정"], rows, [0, 1, 2]),
      "",
      "입력을 바꿔 가며 같은 변이를 걸면 이렇습니다.",
      "",
      mutantTable(clobber, "위쪽 칸을 되읽은 판", [
        ["길이 4 · 2 — 패딩 8", WALK_A, WALK_B],
        ["길이 2 · 2 — 패딩 4", [1, 2], [3, 4]],
        ["값이 전부 0 — 패딩 2", [0, 0], [0]],
        ["길이 1 · 1 — 패딩 1", [7], [6]],
      ]),
      "",
      "값이 전부 0 인 줄은 나비 연산을 실제로 지나가지만 더하고 뺄 값이 0 이라 같고, 패딩 길이가 1 인 줄은 나비 연산까지 가지 않습니다.",
    ].join("\n");
  },

  /* ─────────────── perf ─────────────── */

  perfFormula: () => {
    const rows = [2, 4, 8, 16, 1_024].map((n) => {
      const cost = fftCost(n, n);
      let size = 1;
      while (size < 2 * n - 1) size <<= 1;
      const levels = log2(size);
      const butterflies = (size / 2) * levels;
      return [
        num(n),
        num(size),
        String(levels),
        num(3 * butterflies),
        num(cost.ops),
        num(cost.trig),
        3 * 11 * butterflies + 8 * size === cost.ops &&
        6 * butterflies === cost.trig
          ? "같다"
          : "어긋난다",
      ];
    });
    return md(
      [
        "길이 n = m",
        "패딩 길이 N",
        "바퀴",
        "변환 셋의 나비",
        "기본 연산",
        "삼각함수",
        "식과 비교",
      ],
      rows,
      [0, 1, 2, 3, 4, 5],
    );
  },

  perfWorst: () => {
    const rows = [512, 513, 1_024, 1_025, 2_048, 2_049].map((n) => {
      let size = 1;
      while (size < 2 * n - 1) size <<= 1;
      return [num(n), num(2 * n - 1), num(size), num(ALL_COSTS(n))];
    });
    const a = ALL_COSTS(1_024);
    const b = ALL_COSTS(1_025);
    return [
      md(
        ["길이 n = m", "결과 길이", "패딩 길이", "연산 전부"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `길이가 ${num(1_024)} 에서 ${num(1_025)}${으로(num(1_025))} 한 칸 늘면 연산 전부가 ${num(a)} 번에서 ${num(b)} 번으로 ${Math.round((b / a) * 100) / 100} 배가 됩니다.`,
    ].join("\n");
  },

  /* ─────────────── selfcheck ─────────────── */

  checkPad: () => {
    const cases: [number, number][] = [
      [WALK_A.length, WALK_B.length],
      [5, 5],
      [513, 512],
      [1_000, 1_000],
    ];
    const rows = cases.map(([n, m]) => {
      const resultLen = n + m - 1;
      let size = 1;
      while (size < resultLen) size <<= 1;
      const levels = log2(size);
      return [
        `${num(n)} × ${num(m)}`,
        num(resultLen),
        num(size),
        String(levels),
        num((size / 2) * levels),
      ];
    });
    return md(
      ["두 길이", "결과 길이", "패딩 길이", "바퀴", "변환 하나의 나비"],
      rows,
      [1, 2, 3, 4],
    );
  },

  checkDivide: () => {
    const cases: [string, number[], number[]][] = [
      ["전개 입력", WALK_A, WALK_B],
      ["길이 5 · 3", [1, 2, 3, 4, 5], [6, 7, 8]],
      ["길이 33 · 17", coeffs(33, 50, 3), coeffs(17, 50, 4)],
    ];
    const rows = cases.map(([label, a, b]) => {
      const want = fftMultiply(a, b);
      const got = divideEachRound(a, b);
      let size = 1;
      while (size < a.length + b.length - 1) size <<= 1;
      return [
        label,
        same(want, got.out) ? "같다" : "어긋난다",
        num(2 * size),
        num(got.divides),
      ];
    });
    return [
      md(
        ["입력", "답", "끝에서 한 번 — 나눗셈", "바퀴마다 — 나눗셈"],
        rows,
        [2, 3],
      ),
      "",
      `전개 입력에서 나눗셈이 ${num(2 * N)} 번에서 ${num(divideEachRound(WALK_A, WALK_B).divides)} 번으로 늘었습니다.`,
    ].join("\n");
  },
};
