/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/fftMultiply/fftMultiply-guide.md
 *
 * **부동소수는 그림과 검산에만 쓰고 판정 경로에 두지 않는다.** 이 편의 중간 값은 무리수라
 * 소수 셋째 자리에서 반올림해 적는데, 그 값으로는 아무것도 판정하지 않는다. 판정하는 값은
 * 셋뿐이다 — ① 반올림 뒤의 정수 계수 ② 정수로 세는 연산 수 ③ 큰 정수 곱 하나로 낸 정확한
 * 답과의 일치 여부. ③ 이 「정답」의 정의다(`exactConv`).
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 곱했는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  coeffs,
  exactConv,
  fftCost,
  flipLengths,
  karatsuba,
  karatsubaCost,
  LADDER,
} from "./fftMultiply-guide.alt.ts";
import { fftMultiply } from "./fftMultiply-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 두 계수 배열.
 *
 * 결과 길이가 5 라 패딩 길이가 8 이 되고, 그래서 재배치가 실제로 자리를 옮기며(길이 4 면
 * 한 짝뿐이다) 나비 연산이 세 바퀴 진다. 길이가 서로 달라 0 으로 채우는 칸도 생긴다.
 */
export const WALK_A = [3, 1, 4, 1];
export const WALK_B = [2, 5];

/** 제약 규모 — 원본 시험 파일의 가장 큰 입력이 `2^16 = 65,536` 이라 그것을 덮는 자리다. */
export const LIMIT = 100_000;

/* ────────────────────── 표를 그리는 도구 ────────────────────── */

/** 고정폭 화면에서 한글은 두 칸을 먹는다. 글자 수로 맞추면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `1,024` 꼴 — 본문 표기와 같다. */
const comma = (n: number): string => n.toLocaleString("en-US");

/** `[6, 17, 13]` 꼴 — 본문 표기와 같다. */
const show = (a: number[]): string => `[${a.join(", ")}]`;

/** 소수 셋째 자리에서 반올림한다. `-0` 은 `0` 으로 적는다. */
const round3 = (x: number): string => {
  const r = Math.round(x * 1000) / 1000;
  return Object.is(r, -0) ? "0" : String(r);
};

/** 배열 한 벌을 `3 1 4 1` 꼴로 적는다. 칸 사이는 한 칸이라 표의 열을 안 가른다. */
const row = (a: Float64Array | number[]): string =>
  Array.from(a).map(round3).join(" ");

/** 표 한 벌을 값에서 잰 폭에 맞춰 낸다. 첫 행이 머리줄이다. */
function table(rows: string[][], alignRight: number[] = []): string[] {
  const cols = rows[0]?.length ?? 0;
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((cell, c) =>
        alignRight.includes(c)
          ? padLeft(cell, widths[c] ?? 0)
          : padRight(cell, widths[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, ""),
  );
}

/** 캡션 줄 여럿을 이름 칸에 맞춰 낸다. */
function captions(rows: [string, string][], indent = ""): string[] {
  const w = Math.max(...rows.map(([k]) => width(k)));
  return rows.map(([k, v]) =>
    `${indent}${padRight(k, w)}  ${v}`.replace(/\s+$/, ""),
  );
}

/* ──────────────── 이 글의 절차 — 걸음을 기록하는 사본 ──────────────── */

export interface Snapshot {
  label: string;
  re: number[];
  im: number[];
}

/** 절차의 모든 중간 상태. 값은 정본이 쓰는 것과 같은 순서로 나온다. */
export interface Trace {
  size: number;
  resultLen: number;
  shots: Snapshot[];
  answer: number[];
}

function snap(label: string, re: Float64Array, im: Float64Array): Snapshot {
  return { label, re: Array.from(re), im: Array.from(im) };
}

/** 정본과 같은 절차에 기록하는 자리만 덧붙인 사본. */
export function traced(a: number[], b: number[]): Trace {
  const resultLen = a.length + b.length - 1;
  let size = 1;
  while (size < resultLen) size <<= 1;
  const shots: Snapshot[] = [];

  const aRe = new Float64Array(size);
  const aIm = new Float64Array(size);
  const bRe = new Float64Array(size);
  const bIm = new Float64Array(size);
  for (let i = 0; i < a.length; i++) aRe[i] = a[i] as number;
  for (let i = 0; i < b.length; i++) bRe[i] = b[i] as number;
  shots.push(snap("A 채움", aRe, aIm), snap("B 채움", bRe, bIm));

  const transform = (
    re: Float64Array,
    im: Float64Array,
    invert: boolean,
    tag: string,
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
    shots.push(snap(`${tag} 재배치`, re, im));
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
        }
      }
      shots.push(snap(`${tag} len ${len}`, re, im));
    }
    if (invert) {
      for (let i = 0; i < size; i++) {
        re[i] = (re[i] as number) / size;
        im[i] = (im[i] as number) / size;
      }
      shots.push(snap(`${tag} 나눗셈`, re, im));
    }
  };

  transform(aRe, aIm, false, "A");
  transform(bRe, bIm, false, "B");

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
  shots.push(snap("점별 곱", aRe, aIm));

  transform(aRe, aIm, true, "C");

  const answer = new Array<number>(resultLen);
  for (let i = 0; i < resultLen; i++) answer[i] = Math.round(aRe[i] as number);
  return { size, resultLen, shots, answer };
}

/** 기록 하나를 이름으로 찾는다. */
function at(t: Trace, label: string): Snapshot {
  const s = t.shots.find((x) => x.label === label);
  if (s === undefined) throw new Error(`그런 기록이 없다 — ${label}`);
  return s;
}

/* ──────────────── 정의를 그대로 옮긴 판 ──────────────── */

export interface Naive {
  out: number[];
  /** 계수 한 쌍을 곱한 횟수. */
  mul: number;
}

/** 이중 반복 — 곱셈 정의를 그대로 옮긴 것이다. */
export function naive(a: number[], b: number[]): Naive {
  if (a.length === 0 || b.length === 0) return { out: [], mul: 0 };
  const out = new Array<number>(a.length + b.length - 1).fill(0);
  let mul = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      mul++;
      out[i + j] = (out[i + j] as number) + (a[i] as number) * (b[j] as number);
    }
  }
  return { out, mul };
}

/** 길이 `n` 으로 자른 순환 합성곱 — 넘치는 자리가 앞으로 되돌아온다. */
export function circular(a: number[], b: number[], n: number): number[] {
  const out = new Array<number>(n).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      const k = (i + j) % n;
      out[k] = (out[k] as number) + (a[i] as number) * (b[j] as number);
    }
  }
  return out;
}

/** 곱셈과 나눗셈을 센다. 덧뺄셈은 두 방식이 같은 자릿수라 곱셈만 본다. */
export interface PointCount {
  evalMul: number;
  interpMul: number;
}

/**
 * 점 `xs` 에서 호너 방식으로 평가한다. 곱셈은 계수 하나마다 한 번이다.
 *
 * 점을 아무렇게나 골랐을 때의 비용을 재는 자리라, 단위근을 쓰지 않는다.
 */
export function evaluateAll(
  c: number[],
  xs: number[],
  count: PointCount,
): number[] {
  return xs.map((x) => {
    let v = 0;
    for (let i = c.length - 1; i >= 0; i--) {
      if (i < c.length - 1) count.evalMul++;
      v = v * x + (c[i] as number);
    }
    return v;
  });
}

/**
 * 라그랑주 보간 — 점 `xs` 와 값 `ys` 에서 계수를 되찾는다.
 *
 * 기저 다항식을 하나씩 만들어 더한다. 곱셈은 기저 하나를 만들 때 점 수만큼, 그 기저에
 * 계수를 곱할 때 다시 점 수만큼이고, 나눗셈이 점마다 한 번이다.
 */
export function lagrange(
  xs: number[],
  ys: number[],
  count: PointCount,
): number[] {
  const n = xs.length;
  const out = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    // 분모 — 다른 점과의 차를 전부 곱한다.
    let denom = 1;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      count.interpMul++;
      denom *= (xs[i] as number) - (xs[j] as number);
    }
    // 분자 — (x − x_j) 를 차례로 곱해 계수 배열로 편다.
    const basis = new Array<number>(n).fill(0);
    basis[0] = 1;
    let deg = 0;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      for (let k = deg + 1; k > 0; k--) {
        count.interpMul++;
        basis[k] =
          (basis[k - 1] as number) - (xs[j] as number) * (basis[k] as number);
      }
      count.interpMul++;
      basis[0] = -(xs[j] as number) * (basis[0] as number);
      deg++;
    }
    count.interpMul++;
    const scale = (ys[i] as number) / denom;
    for (let k = 0; k < n; k++) {
      count.interpMul++;
      out[k] = (out[k] as number) + scale * (basis[k] as number);
    }
  }
  return out.map((v) => Math.round(v));
}

/** 다항식을 한 점에서 평가한다(호너). */
export function evalAt(c: number[], x: number): number {
  let v = 0;
  for (let i = c.length - 1; i >= 0; i--) v = v * x + (c[i] as number);
  return v;
}

/** 길이 `n` 짜리 이산 푸리에 변환을 정의 그대로 계산한다. 검산용이다. */
export function dftByDefinition(c: number[], n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    let re = 0;
    let im = 0;
    for (let j = 0; j < n; j++) {
      const ang = ((2 * Math.PI) / n) * j * k;
      re += (c[j] ?? 0) * Math.cos(ang);
      im += (c[j] ?? 0) * Math.sin(ang);
    }
    out.push([re, im]);
  }
  return out;
}

/* ──────────────── 회전 인자를 누적 곱으로 만든 판 ──────────────── */

/** 정본과 한 자리만 다르다 — 회전 인자를 자리마다 다시 부르지 않고 곱해 이어 간다. */
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
  for (let i = 0; i < resultLen; i++) out[i] = Math.round(aRe[i] as number);
  return out;
}

/* ──────────────── 정확한 답과 갈리는 자리 ──────────────── */

/** 그 판이 길이 `n` 에서 정답을 내는 마지막 계수 상한과 처음 갈리는 상한. */
export function firstMismatch(
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

const same = (a: number[], b: number[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

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
    if (!same(traced(a, b).answer, want)) {
      throw new Error(`기록하는 사본이 정본과 다른 답을 낸다 — ${label}`);
    }
    if (!same(naive(a, b).out, want)) {
      throw new Error(`정의를 옮긴 판이 정본과 다른 답을 낸다 — ${label}`);
    }
    const n = a.length + b.length - 1;
    if (!same(circular(a, b, n), want)) {
      throw new Error(`순환 합성곱이 길이 ${n} 에서 선형과 다르다 — ${label}`);
    }
    if (!same(driftMultiply(a, b), want)) {
      throw new Error(`누적 곱 판이 이 규모에서 다른 답을 낸다 — ${label}`);
    }
    const exact = exactConv(
      a.map((x) => x + 1000),
      b.map((x) => x + 1000),
      96n,
    );
    const got = fftMultiply(
      a.map((x) => x + 1000),
      b.map((x) => x + 1000),
    );
    for (let k = 0; k < exact.length; k++) {
      if (BigInt(got[k] as number) !== (exact[k] as bigint)) {
        throw new Error(`큰 정수 곱이 정본과 다른 답을 낸다 — ${label}`);
      }
    }
  }
  if (fftMultiply([], [1, 2]).length !== 0) throw new Error("빈 입력 계약");
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./fftMultiply-guide.ref.ts", import.meta.url).pathname;

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
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
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

/** `-0` 의 부호가 보이게 적는다. 기본 문자열 변환은 그 부호를 지운다. */
const signed = (v: number): string => (Object.is(v, -0) ? "-0" : String(v));

/** 부호까지 같은가. `-0` 과 `0` 을 다른 값으로 본다. */
const sameSigned = (a: number[], b: number[]): boolean =>
  a.length === b.length && a.every((x, i) => Object.is(x, b[i]));

/** 계수 0 이 나오는 입력을 생성식으로 만든다. */
export function zeroMaking(rounds: number): [string, number[], number[]][] {
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
    if (fftMultiply(a, b).some((v) => v === 0)) {
      out.push([`길이 ${n} · ${m}`, a, b]);
    }
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
    const got = show(impl.fftMultiply(a, b));
    return [label, want, got, want === got ? "같다" : "어긋난다"];
  });
  return table([["입력", "정본", name, "판정"], ...rows]).join("\n");
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

const WALK = traced(WALK_A, WALK_B);
const ANSWER = fftMultiply(WALK_A, WALK_B);

export const PROOFS: Record<string, () => string> = {
  /* ─────────────── deep.build ─────────────── */

  /** ② 정의를 그대로 옮긴 판이 어느 규모에서 감당이 안 되는가. */
  "naive-scale": () => {
    const rows = [4, 64, 1024, 10_000, LIMIT].map((n) => {
      const cost = fftCost(n, n);
      const mul = n * n;
      return [
        comma(n),
        comma(mul),
        comma(cost.ops + cost.trig),
        `${Math.round((mul / (cost.ops + cost.trig)) * 100) / 100} 배`,
      ];
    });
    const walk = naive(WALK_A, WALK_B);
    return [
      ...table(
        [
          [
            "길이 n = m",
            "정의 그대로 — 곱셈",
            "이 글의 절차 — 연산 전부",
            "앞을 뒤로 나눈 값",
          ],
          ...rows,
        ],
        [0, 1, 2, 3],
      ),
      "",
      "└ 「정의 그대로 — 곱셈」 칸은 계수 한 쌍을 곱한 횟수이고, 「이 글의 절차 — 연산",
      "  전부」 칸은 곱셈·덧셈·뺄셈과 삼각함수 호출을 합한 수다. 두 칸의 단위는 같다 —",
      "  실수 두 개를 다루는 연산 한 번이다. 짧은 길이에서는 이 글의 절차가 더 많이 쓴다",
      "",
      ...captions(
        [
          ["전개 입력에서 정의 그대로 곱한 횟수", `${walk.mul} 번`],
          ["그때의 답", show(walk.out)],
          [
            `제약 규모 n = m = ${comma(LIMIT)} 에서 정의 그대로`,
            `${comma(LIMIT * LIMIT)} 번`,
          ],
        ],
        "  ",
      ),
    ].join("\n");
  },

  /** ③ 값 표현으로 옮기면 곱셈이 자리마다 한 번이 된다. */
  "point-value": () => {
    const xs = [0, 1, 2, 3, 4];
    const rows = xs.map((x) => [
      String(x),
      comma(evalAt(WALK_A, x)),
      comma(evalAt(WALK_B, x)),
      comma(evalAt(WALK_A, x) * evalAt(WALK_B, x)),
      comma(evalAt(ANSWER, x)),
    ]);
    return [
      ...table(
        [["점 x", "A(x)", "B(x)", "A(x) × B(x)", "C(x)"], ...rows],
        [0, 1, 2, 3, 4],
      ),
      "",
      `└ 「A(x) × B(x)」 칸은 두 값을 그냥 곱한 것이고 「C(x)」 칸은 답 ${show(ANSWER)} 의`,
      `  그 점에서의 값이다. 잰 점이 ${xs.length} 개이고 두 칸이 줄마다 같으므로, 이 값들이`,
      `  차수 ${ANSWER.length - 1} 이하인 다항식 하나를 유일하게 정한다`,
    ].join("\n");
  },

  /** ③ 그런데 아무 점이나 고르면 평가와 보간이 다시 비싸진다. */
  "point-cost": () => {
    const rows = [4, 16, 64, 128].map((n) => {
      const N = 2 * n - 1;
      const a = coeffs(n, 9, 1);
      const b = coeffs(n, 9, 2);
      const xs = Array.from({ length: N }, (_, k) => k);
      const count: PointCount = { evalMul: 0, interpMul: 0 };
      const av = evaluateAll(a, xs, count);
      const bv = evaluateAll(b, xs, count);
      const cv = av.map((v, k) => v * (bv[k] as number));
      const got = lagrange(xs, cv, count);
      const want = naive(a, b).out;
      return [
        comma(n),
        comma(N),
        comma(count.evalMul),
        comma(count.interpMul),
        comma(n * n),
        same(got, want) ? "같다" : "어긋난다",
      ];
    });
    return [
      ...table(
        [
          [
            "길이 n = m",
            "점의 수",
            "평가 — 호너",
            "보간 — 라그랑주",
            "정의 그대로",
            "되찾은 계수",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      ...captions(
        [
          ["점", "0 · 1 · 2 · … 를 점의 수만큼"],
          ["세는 단위", "실수 곱셈과 나눗셈 한 번"],
          ["계수", "생성식으로 만든 0 부터 9 까지의 정수"],
        ],
        "  ",
      ),
      "",
      "└ 점을 아무렇게나 고르면 「평가 — 호너」 칸만으로도 「정의 그대로」 칸과 같은",
      "  자릿수이고 「보간 — 라그랑주」 칸은 그보다 훨씬 크다. 「되찾은 계수」 칸은 보간이",
      "  낸 계수가 정의 그대로 곱한 값과 같은지인데, 점을 0 부터 차례로 고르면 기저",
      "  다항식의 계수가 30 자리를 넘어서 배정밀도가 그것을 못 담는다. 값 표현으로 옮기는",
      "  것만으로는 비용도 정확성도 얻는 것이 없다",
    ].join("\n");
  },

  /** ⑤ 단위근을 고르면 크기 8 짜리 평가가 크기 4 짜리 둘로 갈린다. */
  "root-split": () => {
    const even = [WALK_A[0] as number, WALK_A[2] as number];
    const odd = [WALK_A[1] as number, WALK_A[3] as number];
    const half = at(WALK, "A len 4");
    const full = at(WALK, "A len 8");
    const rows = [0, 1, 2, 3].map((k) => [
      String(k),
      `${round3(half.re[k] as number)} ${round3(half.im[k] as number)}`,
      `${round3(half.re[k + 4] as number)} ${round3(half.im[k + 4] as number)}`,
      `${round3(full.re[k] as number)} ${round3(full.im[k] as number)}`,
      `${round3(full.re[k + 4] as number)} ${round3(full.im[k + 4] as number)}`,
    ]);
    return [
      ...table(
        [
          [
            "k",
            "짝수 자리 넷의 변환",
            "홀수 자리 넷의 변환",
            "전체 변환 k",
            "전체 변환 k+4",
          ],
          ...rows,
        ],
        [0],
      ),
      "",
      ...captions(
        [
          ["짝수 자리만 모은 계수", show(even)],
          ["홀수 자리만 모은 계수", show(odd)],
        ],
        "  ",
      ),
      "",
      "└ 각 칸은 실수부와 허수부를 한 칸에 적은 것이고 소수 셋째 자리에서 반올림했다.",
      "  「전체 변환 k」 칸과 「전체 변환 k+4」 칸이 왼쪽 두 칸의 같은 재료로 만들어진다 —",
      "  앞쪽은 더한 것이고 뒤쪽은 뺀 것이다. 큰 평가 하나가 절반짜리 둘로 갈렸다",
    ].join("\n");
  },

  /** ⑥ 패딩 길이를 필요보다 크게 잡으면 답은 같고 나비 연산만 는다. */
  "size-sweep": () => {
    const rows = [8, 16, 32, 64, 128].map((N) => {
      let levels = 0;
      for (let len = 2; len <= N; len <<= 1) levels++;
      const pad = Array.from({ length: N }, (_, i) => WALK_A[i] ?? 0);
      const padB = Array.from({ length: N }, (_, i) => WALK_B[i] ?? 0);
      const got = fftMultiply(pad, padB).slice(0, WALK.resultLen);
      return [
        comma(N),
        String(levels),
        comma((N / 2) * levels),
        show(got),
        same(got, ANSWER) ? "같다" : "어긋난다",
      ];
    });
    return [
      ...table(
        [["패딩 길이 N", "바퀴 수", "나비 연산", "앞 5 칸", "판정"], ...rows],
        [0, 1, 2],
      ),
      "",
      ...captions(
        [
          ["잰 패딩 길이", `${rows.length} 가지`],
          ["답이 같은 줄", `${rows.filter((r) => r[4] === "같다").length} 줄`],
          ["결과 길이", String(WALK.resultLen)],
          ["고르는 값", String(WALK.size)],
        ],
        "  ",
      ),
      "",
      "└ 답은 모든 줄이 같고 나비 연산만 는다. 그래서 결과 길이 이상인 2 의 거듭제곱 중",
      "  가장 작은 것을 고른다",
    ].join("\n");
  },

  /* ─────────────── deep.walk ─────────────── */

  /** 전개가 지나는 열두 걸음의 실제 값. */
  "walk-trace": () => {
    const pick: [string, string][] = [
      ["T2", "A 채움"],
      ["T3", "A 재배치"],
      ["T4", "A len 2"],
      ["T5", "A len 4"],
      ["T6", "A len 8"],
      ["T7", "B len 8"],
      ["T8", "점별 곱"],
      ["T9", "C len 2"],
      ["T10", "C len 8"],
      ["T11", "C 나눗셈"],
    ];
    const rows = pick.map(([t, label]) => {
      const s = at(WALK, label);
      return [t, s.label, row(s.re), row(s.im)];
    });
    return [
      ...table([["걸음", "무엇", "실수부", "허수부"], ...rows]),
      "",
      ...captions(
        [
          ["T1 결과 길이", String(WALK.resultLen)],
          ["T1 패딩 길이", String(WALK.size)],
          ["T12 반환", show(WALK.answer)],
          ["정의를 그대로 센 값", show(naive(WALK_A, WALK_B).out)],
        ],
        "  ",
      ),
      "",
      "└ 표의 값은 소수 셋째 자리에서 반올림해 적었다. 판정 대상은 「T12 반환」과",
      "  「정의를 그대로 센 값」의 정수 계수뿐이다",
    ].join("\n");
  },

  /** 갈래 일곱이 어느 걸음에서 실행됐는가. */
  "walk-branch": () => {
    const rows: string[][] = [
      ["①", "빈 입력 가드", "T1", "거짓 — 둘 다 길이가 1 이상이다"],
      [
        "②",
        "계수를 실수부에 채움",
        "T2",
        `${WALK_A.length} 칸과 ${WALK_B.length} 칸`,
      ],
      ["③", "비트 역순 재배치", "T3 · T7 · T9", "맞바꾼 짝 2 개씩"],
      ["④", "나비 연산", "T4 · T5 · T6 · T7 · T9 · T10", "변환당 12 개"],
      ["⑤", "자리별 복소수 곱", "T8", `${WALK.size} 번`],
      ["⑥", "역변환의 나눗셈", "T11", `${WALK.size} 칸에 나눗셈 한 번씩`],
      ["⑦", "앞 칸 반올림", "T12", `${WALK.resultLen} 칸`],
    ];
    let swaps = 0;
    for (let i = 1, j = 0; i < WALK.size; i++) {
      let bit = WALK.size >> 1;
      for (; (j & bit) !== 0; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) swaps++;
    }
    let levels = 0;
    for (let len = 2; len <= WALK.size; len <<= 1) levels++;
    return [
      ...table([["갈래", "하는 일", "실행한 걸음", "그 걸음에서"], ...rows]),
      "",
      ...captions(
        [
          ["한 변환이 맞바꾼 짝", `${swaps} 개`],
          ["한 변환의 바퀴 수", `${levels} 개`],
          ["한 변환의 나비 연산", `${(WALK.size / 2) * levels} 개`],
          ["변환을 부른 횟수", "3 번"],
        ],
        "  ",
      ),
    ].join("\n");
  },

  /** 멈춤 — 재배치 조건을 넓히면 같은 짝을 두 번 맞바꾼다. */
  "pause-swap": () => {
    const swapped: string[][] = [];
    for (let i = 1, j = 0; i < 8; i++) {
      let bit = 8 >> 1;
      for (; (j & bit) !== 0; bit >>= 1) j ^= bit;
      j ^= bit;
      swapped.push([
        String(i),
        i.toString(2).padStart(3, "0"),
        String(j),
        j.toString(2).padStart(3, "0"),
        i < j ? "맞바꾼다" : "지나간다",
      ]);
    }
    return [
      ...table(
        [["자리 i", "이진", "뒤집은 j", "이진", "i < j 일 때"], ...swapped],
        [0, 2],
      ),
      "",
      mutantTable(swapTwice, "두 자리가 다르면 맞바꾼 판", [
        ["길이 4 · 2 — 패딩 8", WALK_A, WALK_B],
        ["길이 2 · 2 — 패딩 4", [1, 2], [3, 4]],
        ["길이 2 · 1 — 패딩 2", [1, 2], [3]],
        ["길이 1 · 1 — 패딩 1", [7], [6]],
      ]),
      "",
      "└ 패딩 길이가 2 인 줄은 그 조건을 실제로 지나간다 — 자리 1 을 뒤집으면 자리 1 이라",
      "  두 판 다 맞바꾸지 않는다. 패딩 길이가 1 인 줄은 그 조건까지 가지도 못한다. 맞바꿀",
      "  짝이 생기는 순간부터 갈리는데, 조건을 넓히면 같은 짝을 i 쪽에서 한 번, j 쪽에서",
      "  또 한 번 맞바꿔 재배치가 통째로 없던 일이 된다",
    ].join("\n");
  },

  /** 멈춤 — 패딩을 결과 길이보다 짧게 잡으면 넘치는 자리가 앞으로 되돌아온다. */
  "pause-wrap": () => {
    const linear = naive(WALK_A, WALK_B).out;
    const wrapped = circular(WALK_A, WALK_B, 4);
    const rows = [0, 1, 2, 3].map((k) => [
      String(k),
      comma(linear[k] as number),
      comma(wrapped[k] as number),
      linear[k] === wrapped[k] ? "같다" : "어긋난다",
      k === 0 ? `${linear[0]} + ${linear[4]}` : "그대로",
    ]);
    return [
      ...table(
        [
          [
            "자리 k",
            "길이 8 — 선형",
            "길이 4 — 순환",
            "판정",
            "순환이 더한 것",
          ],
          ...rows,
        ],
        [0, 1, 2],
      ),
      "",
      ...captions(
        [
          ["결과 길이", String(WALK.resultLen)],
          ["넘치는 자리", `자리 4 의 값 ${linear[4]}`],
          ["그 값이 되돌아온 자리", "자리 0"],
        ],
        "  ",
      ),
    ].join("\n");
  },

  /** 멈춤 — 역변환의 각도 부호를 안 뒤집으면 정방향 변환을 한 번 더 한 것이 된다. */
  "pause-sign": () => {
    return [
      mutantTable(noSign, "각도 부호를 고정한 판", [
        ["길이 4 · 2 — 패딩 8", WALK_A, WALK_B],
        ["길이 2 · 2 — 패딩 4", [1, 2], [3, 4]],
        ["길이 3 · 3 — 패딩 8", [1, 2, 3], [4, 5, 6]],
      ]),
      "",
      ...captions(
        [
          ["정본이 낸 답", show(ANSWER)],
          ["각도 부호를 고정한 판", show(noSign.fftMultiply(WALK_A, WALK_B))],
          ["패딩 길이", String(WALK.size)],
        ],
        "  ",
      ),
      "",
      `└ 자리 0 은 그대로이고 자리 k 에는 원래 자리 ${WALK.size} - k 의 값이 와 있다. 패딩된`,
      "  뒤쪽 칸이 전부 0 이라 가운데가 0 으로 채워졌다. 정방향 변환을 두 번 하면 자리가",
      "  그렇게 뒤집힌다",
    ].join("\n");
  },

  /** 멈춤 — 마지막 나눗셈을 빼면 계수가 패딩 길이배로 나온다. */
  "pause-divide": () => {
    const got = noDivide.fftMultiply(WALK_A, WALK_B);
    const rows = ANSWER.map((v, k) => [
      String(k),
      comma(v),
      comma(got[k] as number),
      `${comma(v)} × ${WALK.size}`,
      v === got[k] ? "같다" : "어긋난다",
    ]);
    return [
      ...table(
        [
          ["자리 k", "정본", "나눗셈을 뺀 판", "정본 × 패딩 길이", "판정"],
          ...rows,
        ],
        [0, 1, 2],
      ),
      "",
      ...captions([["패딩 길이", String(WALK.size)]], "  "),
    ].join("\n");
  },

  /** 멈춤 — 반올림이 정답을 되살리는 자리는 어디까지인가. */
  "pause-round": () => {
    const lens = [8, 32, 128, 512, 2048];
    const found = lens.map((n) =>
      firstMismatch((a, b) => fftMultiply(a, b), n),
    );
    const rows = lens.map((n, i) => {
      const m = found[i] as {
        last: number;
        first: number;
        peak: bigint;
        lastPeak: bigint;
      };
      let size = 1;
      while (size < 2 * n - 1) size <<= 1;
      return [
        comma(n),
        comma(size),
        comma(m.last),
        m.lastPeak.toLocaleString("en-US"),
        comma(m.first),
        m.peak.toLocaleString("en-US"),
      ];
    });
    const peaks = found.map((m) => m.peak);
    const low = peaks.reduce((x, y) => (y < x ? y : x));
    const high = peaks.reduce((x, y) => (y > x ? y : x));
    return [
      ...table(
        [
          [
            "길이 n = m",
            "패딩 길이",
            "정답을 낸 마지막 상한",
            "그때 가장 큰 참값",
            "처음 갈리는 상한",
            "그때 가장 큰 참값",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      ...captions(
        [
          ["계수 사다리", `${LADDER.slice(0, 6).map(comma).join(" · ")} · …`],
          ["사다리의 마지막 칸", comma(LADDER[LADDER.length - 1] ?? 0)],
          ["잰 길이", `${lens.length} 가지`],
          ["갈리는 자리의 참값 — 가장 작은 것", low.toLocaleString("en-US")],
          ["갈리는 자리의 참값 — 가장 큰 것", high.toLocaleString("en-US")],
          ["배정밀도가 정수를 오차 없이 담는 한계", comma(2 ** 53)],
        ],
        "  ",
      ),
      "",
      "└ 계수는 생성식으로 만든 것이고 두 배열 다 길이가 n 이다. 「처음 갈리는 상한」 은",
      "  사다리에서 정답과 처음 달라진 칸이고 그 왼쪽 두 칸이 마지막으로 정답을 낸",
      "  자리다. 갈리는 자리의 참값은 어느 길이에서나 배정밀도 한계보다 한 자리쯤",
      "  아래에 모여 있다",
    ].join("\n");
  },

  /** 멈춤 — 반올림 결과를 그대로 담으면 계수 0 자리에 부호가 붙은 0 이 남는다. */
  "pause-negzero": () => {
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
      ...table(
        [
          [
            "입력",
            "결과 길이",
            "처음 갈리는 자리",
            "정본의 그 값",
            "반올림을 그대로 담은 판",
            "판정",
          ],
          ...rows,
        ],
        [1, 2],
      ),
      "",
      ...captions(
        [
          ["잰 입력", `${rounds} 벌`],
          ["계수 0 이 나온 입력", `${zeros.length} 벌`],
          ["부호까지 갈린 입력", `${differing.length} 벌`],
          [
            "Math.round(-1e-16)",
            Object.is(Math.round(-1e-16), -0) ? "-0" : "0",
          ],
          [
            "부호 있는 0 을 0 과 산술로 견주면",
            Object.is(-0, 0) ? "차이가 있다" : "차이가 없다",
          ],
        ],
        "  ",
      ),
      "",
      "└ 두 값은 산술로는 같지만 `Object.is` 로는 다르고, `toEqual` 로 대조하는 시험은",
      "  그 차이를 잡는다. 계수 0 은 흔한 값이라 이 자리는 자주 지나간다",
    ].join("\n");
  },

  /** 멈춤 — 회전 인자를 누적 곱으로 만들면 갈리는 자리가 앞당겨진다. */
  "pause-drift": () => {
    const rows = [32, 128, 512, 2048].map((n) => {
      const a = firstMismatch((x, y) => fftMultiply(x, y), n);
      const b = firstMismatch(driftMultiply, n);
      return [
        comma(n),
        comma(a.last),
        comma(b.last),
        a.last === b.last ? "같다" : "어긋난다",
      ];
    });
    return [
      ...table(
        [
          [
            "길이 n = m",
            "자리마다 다시 부른 판",
            "누적 곱으로 이은 판",
            "판정",
          ],
          ...rows,
        ],
        [0, 1, 2],
      ),
      "",
      "└ 두 판은 회전 인자를 만드는 방법만 다르다. 누적 곱은 자리마다 오차를 이어받아",
      "  같은 길이에서 더 작은 계수부터 갈린다",
    ].join("\n");
  },

  /* ─────────────── purpose.alt ─────────────── */

  /** 경쟁 설계와 같은 입력에서 나란히 잰 계수. */
  "alt-counts": () => {
    const rows = [512, 1024].flatMap((n) => {
      const f = fftCost(n, n);
      const k = karatsubaCost(n, n);
      return [
        [comma(n), "기본 연산", comma(f.ops), comma(k.ops)],
        [comma(n), "삼각함수 호출", comma(f.trig), "0"],
        [comma(n), "둘의 합", comma(f.ops + f.trig), comma(k.ops)],
        [comma(n), "새로 잡는 칸", comma(f.cells), comma(k.cells)],
      ];
    });
    const tiny = 64;
    const long = 1024;
    return [
      ...table(
        [["길이 n = m", "무엇", "이 글의 절차", "카라추바"], ...rows],
        [0, 2, 3],
      ),
      "",
      ...captions(
        [
          [
            `길이 ${tiny} 에서 정답을 낸 마지막 계수 상한`,
            `이 글의 절차 ${comma(firstMismatch((a, b) => fftMultiply(a, b), tiny).last)} · 카라추바 ${comma(
              firstMismatch(
                (a, b) => karatsuba(a, b, { ops: 0, trig: 0, cells: 0 }),
                tiny,
              ).last,
            )}`,
          ],
          [
            `길이 ${comma(long)} 에서 정답을 낸 마지막 계수 상한`,
            `이 글의 절차 ${comma(firstMismatch((a, b) => fftMultiply(a, b), long).last)} · 카라추바 ${comma(
              firstMismatch(
                (a, b) => karatsuba(a, b, { ops: 0, trig: 0, cells: 0 }),
                long,
              ).last,
            )}`,
          ],
        ],
        "  ",
      ),
      "",
      "└ 두 설계에 같은 생성식 입력을 넣었다. 「둘의 합」 줄과 두 캡션 줄에서 앞서는",
      "  쪽이 길이에 따라 갈린다",
    ].join("\n");
  },

  /** 길이를 1 씩 올릴 때 우열이 뒤집히는 자리. */
  "alt-flips": () => {
    const flips = flipLengths(8192);
    const rows = flips.map((n) => {
      const before = fftCost(n - 1, n - 1);
      const after = fftCost(n, n);
      const kBefore = karatsubaCost(n - 1, n - 1);
      const kAfter = karatsubaCost(n, n);
      const who =
        after.ops + after.trig < kAfter.ops ? "이 글의 절차" : "카라추바";
      return [
        comma(n),
        comma(before.ops + before.trig),
        comma(kBefore.ops),
        comma(after.ops + after.trig),
        comma(kAfter.ops),
        who,
      ];
    });
    return [
      ...table(
        [
          [
            "길이",
            "직전 — 이 글",
            "직전 — 카라추바",
            "그 길이 — 이 글",
            "그 길이 — 카라추바",
            "그 길이에서 앞서는 쪽",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      ...captions(
        [
          ["잰 길이 범위", `2 부터 ${comma(8192)} 까지`],
          ["우열이 갈리는 자리", `${flips.length} 곳`],
          ["마지막으로 갈리는 자리", comma(flips[flips.length - 1] ?? 0)],
        ],
        "  ",
      ),
      "",
      "└ 이 글의 절차는 패딩 길이가 2 배로 뛸 때만 비용이 뛰므로 길이의 계단꼴이고,",
      "  카라추바는 매끄럽게 는다. 그래서 우열이 한 번만 갈리지 않는다",
    ].join("\n");
  },

  /* ─────────────── deep.math ─────────────── */

  /** 정의를 그대로 계산한 값과 절차가 낸 값의 대조. */
  "math-check": () => {
    const def = dftByDefinition(WALK_A, 8);
    const got = at(WALK, "A len 8");
    const rows = def.map(([re, im], k) => [
      String(k),
      `${round3(re)} ${round3(im)}`,
      `${round3(got.re[k] as number)} ${round3(got.im[k] as number)}`,
      Math.abs(re - (got.re[k] as number)) < 1e-9 &&
      Math.abs(im - (got.im[k] as number)) < 1e-9
        ? "같다"
        : "어긋난다",
    ]);
    return [
      ...table([["k", "정의 그대로", "절차가 낸 값", "판정"], ...rows], [0]),
      "",
      ...captions(
        [
          ["변환 길이 N", String(WALK.size)],
          [
            "정의를 그대로 계산할 때의 실수 곱",
            `${WALK.size * WALK.size * 2} 번 — 자리 짝마다 둘씩`,
          ],
          ["절차가 든 나비 연산", `${(WALK.size / 2) * 3} 개`],
        ],
        "  ",
      ),
      "",
      "└ 두 칸은 실수부와 허수부를 나란히 적은 것이고 소수 셋째 자리에서 반올림했다.",
      "  판정은 반올림 전 값의 차가 1e-9 보다 작은가로 했다",
    ].join("\n");
  },

  /** 제약 규모에 식을 넣어 낸 계수. */
  "math-scale": () => {
    const rows = [1_000, 10_000, LIMIT].map((n) => {
      const resultLen = 2 * n - 1;
      let size = 1;
      while (size < resultLen) size <<= 1;
      let levels = 0;
      for (let len = 2; len <= size; len <<= 1) levels++;
      const cost = fftCost(n, n);
      const closed = 33 * ((size / 2) * levels) + 8 * size;
      const closedTrig = 3 * size * levels;
      return [
        comma(n),
        comma(size),
        String(levels),
        comma(closed),
        comma(cost.ops),
        comma(closedTrig),
        comma(cost.trig),
        closed === cost.ops && closedTrig === cost.trig ? "같다" : "어긋난다",
      ];
    });
    return [
      ...table(
        [
          [
            "길이 n = m",
            "패딩 길이 N",
            "log2 N",
            "기본 연산 — 닫힌 형태",
            "기본 연산 — 실측",
            "삼각함수 — 닫힌 형태",
            "삼각함수 — 실측",
            "판정",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5, 6],
      ),
      "",
      ...captions(
        [
          ["기본 연산의 닫힌 형태", "33 × (N/2) × log2 N + 8N"],
          ["삼각함수 호출의 닫힌 형태", "3N × log2 N"],
          [
            `제약 규모 ${comma(LIMIT)} 에서 정의 그대로`,
            `${comma(LIMIT * LIMIT)} 번`,
          ],
          [
            `제약 규모 ${comma(LIMIT)} 에서 이 글의 절차`,
            `${comma(fftCost(LIMIT, LIMIT).ops)} 번`,
          ],
          [
            "몇 배",
            `${comma(Math.round((LIMIT * LIMIT) / fftCost(LIMIT, LIMIT).ops))} 배`,
          ],
        ],
        "  ",
      ),
    ].join("\n");
  },

  /* ─────────────── invariant ─────────────── */

  /** 바퀴마다 각 블록이 그 자리들의 변환을 담고 있는가. */
  "inv-blocks": () => {
    const size = WALK.size;
    const rows: string[][] = [];
    for (const len of [1, 2, 4, 8]) {
      const shot = len === 1 ? at(WALK, "A 재배치") : at(WALK, `A len ${len}`);
      const stride = size / len;
      let bits = 0;
      for (let x = stride; x > 1; x >>= 1) bits++;
      for (let b = 0; b * len < size; b++) {
        const start = b * len;
        // 블록 번호를 비트 역순으로 읽은 값이 이 블록이 맡은 나머지다.
        let residue = 0;
        for (let t = 0; t < bits; t++) {
          residue |= ((b >> t) & 1) << (bits - 1 - t);
        }
        const members = Array.from(
          { length: len },
          (_, t) => residue + t * stride,
        );
        const sub = members.map((j) => WALK_A[j] ?? 0);
        const want = dftByDefinition(sub, len);
        let ok = true;
        for (let k = 0; k < len; k++) {
          const [re, im] = want[k] as [number, number];
          if (
            Math.abs(re - (shot.re[start + k] as number)) > 1e-9 ||
            Math.abs(im - (shot.im[start + k] as number)) > 1e-9
          ) {
            ok = false;
          }
        }
        rows.push([
          String(len),
          `${start}..${start + len - 1}`,
          `[${members.join(" ")}]`,
          `[${sub.join(" ")}]`,
          row(shot.re.slice(start, start + len)),
          ok ? "같다" : "어긋난다",
        ]);
      }
    }
    return [
      ...table(
        [
          [
            "블록 길이",
            "칸",
            "담당하는 자리",
            "그 자리의 계수",
            "실수부",
            "판정",
          ],
          ...rows,
        ],
        [0],
      ),
      "",
      "└ 「담당하는 자리」 칸은 원래 배열에서 N/len 칸마다 하나씩 고른 자리이고, 어느",
      "  나머지에서 시작하는지는 블록 번호를 비트 역순으로 읽은 값이 정한다. 판정은 그",
      "  자리들만 모은 부분열을 정의 그대로 변환한 값과 견준 것이다",
    ].join("\n");
  },

  /** 경계에 있는 입력에서 계약이 지켜지는가. */
  "inv-edges": () => {
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
      const want = naive(a, b).out;
      const empty = a.length === 0 || b.length === 0;
      const resultLen = a.length + b.length - 1;
      let size = 1;
      while (size < resultLen) size <<= 1;
      return [
        label,
        `${show(a)} × ${show(b)}`,
        empty ? "-" : String(resultLen),
        empty ? "-" : String(size),
        show(got),
        same(got, want) ? "같다" : "어긋난다",
      ];
    });
    return [
      ...table(
        [["경우", "입력", "결과 길이", "패딩 길이", "반환", "정의와"], ...rows],
        [2, 3],
      ),
      "",
      "└ 빈 배열이 들어오면 패딩 길이를 정하기 전에 되돌아 나오므로 잴 것이 없다",
    ].join("\n");
  },

  /** 불변식을 지키던 줄을 바꾸면 무엇이 어떻게 갈리는가. */
  "inv-mutant": () => {
    const got = clobber.fftMultiply(WALK_A, WALK_B);
    const rows = ANSWER.map((v, k) => [
      String(k),
      comma(v),
      comma(got[k] as number),
      v === got[k] ? "같다" : "어긋난다",
    ]);
    return [
      ...table(
        [["자리 k", "정본", "위쪽 칸을 되읽은 판", "판정"], ...rows],
        [0, 1, 2],
      ),
      "",
      mutantTable(clobber, "위쪽 칸을 되읽은 판", [
        ["길이 4 · 2 — 패딩 8", WALK_A, WALK_B],
        ["길이 2 · 2 — 패딩 4", [1, 2], [3, 4]],
        ["값이 전부 0 — 패딩 2", [0, 0], [0]],
        ["길이 1 · 1 — 패딩 1", [7], [6]],
      ]),
      "",
      "└ 값이 전부 0 인 줄은 나비 연산을 실제로 지나간다 — 더하고 뺄 값이 0 이라 덮어쓴",
      "  값을 되읽어도 결과가 같다. 패딩 길이가 1 인 줄은 나비 연산까지 가지도 못한다.",
      "  0 이 아닌 값이 하나라도 있으면 위쪽 칸이 먼저 덮이고 아래쪽 칸이 그 덮인 값을 읽는다",
    ].join("\n");
  },

  /** 빈 입력을 거르는 줄을 빼면 계약이 어떻게 깨지는가. */
  "inv-guard": () => {
    const cases: [string, number[], number[]][] = [
      ["앞이 빈 배열", [], [1, 2, 3]],
      ["뒤가 빈 배열", [1, 2, 3], []],
      ["둘 다 길이 1", [7], [6]],
    ];
    const rows = cases.map(([label, a, b]) => {
      const want = show(fftMultiply(a, b));
      let got: string;
      try {
        got = show(noGuard.fftMultiply(a, b));
      } catch (error) {
        got = `${(error as Error).name}`;
      }
      return [label, want, got, want === got ? "같다" : "어긋난다"];
    });
    return table([["입력", "정본", "가드를 뺀 판", "판정"], ...rows]).join(
      "\n",
    );
  },

  /* ─────────────── perf ─────────────── */

  /** 세는 과정이 닫힌 형태와 맞는가. */
  "perf-formula": () => {
    const rows = [2, 4, 8, 16, 1024].map((n) => {
      const cost = fftCost(n, n);
      let size = 1;
      while (size < 2 * n - 1) size <<= 1;
      let levels = 0;
      for (let len = 2; len <= size; len <<= 1) levels++;
      const butterflies = (size / 2) * levels;
      return [
        comma(n),
        comma(size),
        String(levels),
        comma(3 * butterflies),
        comma(cost.ops),
        comma(cost.trig),
        comma(3 * 11 * butterflies + 8 * size) === comma(cost.ops)
          ? "같다"
          : "어긋난다",
      ];
    });
    return [
      ...table(
        [
          [
            "길이 n = m",
            "패딩 길이 N",
            "바퀴",
            "나비 연산 전부",
            "기본 연산",
            "삼각함수",
            "닫힌 형태와",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      ...captions(
        [
          ["나비 하나가 쓰는 기본 연산", "11 번"],
          ["나비 하나가 부르는 삼각함수", "2 번"],
          ["변환을 부르는 횟수", "3 번"],
          ["나비 밖의 기본 연산", "8N 번 — 자리별 곱 6N 과 나눗셈 2N"],
        ],
        "  ",
      ),
    ].join("\n");
  },

  /** 길이가 한 칸 늘 때 비용이 뛰는 자리. */
  "perf-worst": () => {
    const rows = [512, 513, 1024, 1025, 2048, 2049].map((n) => {
      const cost = fftCost(n, n);
      let size = 1;
      while (size < 2 * n - 1) size <<= 1;
      return [
        comma(n),
        comma(2 * n - 1),
        comma(size),
        comma(cost.ops + cost.trig),
      ];
    });
    const a = fftCost(1024, 1024);
    const b = fftCost(1025, 1025);
    return [
      ...table(
        [["길이 n = m", "결과 길이", "패딩 길이", "연산 전부"], ...rows],
        [0, 1, 2, 3],
      ),
      "",
      ...captions(
        [
          ["길이 1,024 에서", `${comma(a.ops + a.trig)} 번`],
          ["길이 1,025 에서", `${comma(b.ops + b.trig)} 번`],
          [
            "몇 배",
            `${Math.round(((b.ops + b.trig) / (a.ops + a.trig)) * 100) / 100} 배`,
          ],
        ],
        "  ",
      ),
      "",
      "└ 결과 길이가 2 의 거듭제곱을 한 칸 넘는 자리에서 패딩 길이가 두 배로 뛴다.",
      "  값이 무엇이든 길이만으로 정해지므로 최악과 최선이 같은 입력이 따로 없다",
    ].join("\n");
  },

  /* ─────────────── selfcheck ─────────────── */

  /** 예측 문제의 답. */
  "check-pad": () => {
    const cases: [number, number][] = [
      [4, 2],
      [5, 5],
      [8, 1],
      [513, 512],
      [1000, 1000],
    ];
    const rows = cases.map(([n, m]) => {
      const resultLen = n + m - 1;
      let size = 1;
      while (size < resultLen) size <<= 1;
      let levels = 0;
      for (let len = 2; len <= size; len <<= 1) levels++;
      return [
        `${comma(n)} × ${comma(m)}`,
        comma(resultLen),
        comma(size),
        String(levels),
        comma((size / 2) * levels),
      ];
    });
    return table(
      [
        ["두 길이", "결과 길이", "패딩 길이", "바퀴", "변환 하나의 나비"],
        ...rows,
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },
};
