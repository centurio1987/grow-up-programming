/**
 * `fftMultiply-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 정본 소스에서 기록하는 줄 하나씩을 끼운
 * 계측 사본 셋을 기계로 만들고(`loadMutant`), 그 기록으로 바퀴마다의 배열 · 자리별 곱 · 나눗셈 뒤 값을
 * 얻는다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과
 * 같은지는 `fftMultiply-guide.test.ts` 가 잰다.
 *
 * **복소수는 `3+5.41i` 꼴로 한 칸에 적는다.** 실수부와 허수부를 소수 둘째 자리까지 반올림한 글자다(`cx`).
 * 읽으라고 적는 값이고 판정 경로에 없다 — 판정하는 값은 반올림 뒤의 정수 계수뿐이다. 한 칸에 복소수 하나가
 * 들어가도록 칸 하나를 격자 두 칸 폭으로 그린다(`span: 2`).
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 을를 } from "../../../../tools/josa.ts";
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
import { type LayerBar, LayerBars } from "../../../_viz/patterns/LayerBars";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { coeffs as coeffsLocal, fftCost } from "./fftMultiply-guide.alt.ts";
import { fftMultiply } from "./fftMultiply-guide.ref.ts";

const REF = new URL("./fftMultiply-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 정본 계측 ───────────────────────── */

type Hook = {
  __fft?: (tag: string, re: Float64Array, im: Float64Array) => void;
};
type Impl = { fftMultiply(a: number[], b: number[]): number[] };

/**
 * 블록 길이 반복의 조건 자리에 기록을 끼운 사본. 조건은 바퀴마다 한 번, 그리고 마지막에 거짓이 될 때 한 번
 * 더 평가되므로 **재배치 직후 · 바퀴마다 끝난 뒤** 의 배열이 차례로 남는다. 기록은 `invert` 로 방향을 가른다.
 */
const probeRounds = await loadMutant<Impl>(REF, {
  swap: [
    /for \(let len = 2; len <= size; len <<= 1\) \{/,
    'for (let len = 2; ((globalThis as any).__fft?.(invert ? "inv" : "fwd", re, im), len <= size); len <<= 1) {',
  ],
});

/** 역변환을 부르기 직전에 기록을 끼운 사본 — 자리마다 곱한 뒤의 배열이 남는다. */
const probeProduct = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)transform\(aRe, aIm, true\);$/,
    '$1(globalThis as any).__fft?.("product", aRe, aIm);\n$1transform(aRe, aIm, true);',
  ],
});

/** 반올림 배열을 잡기 직전에 기록을 끼운 사본 — 길이로 나눈 뒤의 배열이 남는다. */
const probeDivided = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)const out = new Array<number>\(resultLen\);$/,
    '$1(globalThis as any).__fft?.("divided", aRe, aIm);\n$1const out = new Array<number>(resultLen);',
  ],
});

export interface Shot {
  readonly re: readonly number[];
  readonly im: readonly number[];
}

export interface Trace {
  readonly a: readonly number[];
  readonly b: readonly number[];
  readonly resultLen: number;
  readonly size: number;
  /** 두 계수 배열을 패딩 길이로 편 것(허수부는 0). */
  readonly fillA: Shot;
  readonly fillB: Shot;
  /** 정방향 변환의 기록 — 재배치 직후, 그리고 블록 길이 2 · 4 · … · N 바퀴가 끝난 뒤. */
  readonly fwdA: readonly Shot[];
  readonly fwdB: readonly Shot[];
  /** 자리마다 복소수 곱을 한 뒤. */
  readonly product: Shot;
  /** 역변환의 기록 — 재배치 직후와 바퀴마다 끝난 뒤(나눗셈 전). */
  readonly inv: readonly Shot[];
  /** 길이로 나눈 뒤. */
  readonly divided: Shot;
  readonly answer: readonly number[];
}

function record(impl: Impl, a: number[], b: number[], tag: string): Shot[] {
  const shots: Shot[] = [];
  const g = globalThis as unknown as Hook;
  g.__fft = (t, re, im) => {
    if (t === tag) shots.push({ re: Array.from(re), im: Array.from(im) });
  };
  try {
    const got = impl.fftMultiply(a, b);
    const want = fftMultiply(a, b);
    if (got.length !== want.length || got.some((v, i) => v !== want[i])) {
      throw new Error("계측 사본이 정본과 다른 답을 냈다");
    }
  } finally {
    g.__fft = undefined;
  }
  return shots;
}

/** 자리 `i` 의 이진 표기(`bits` 자리)를 뒤집은 값. */
export function reverseBits(i: number, bits: number): number {
  let r = 0;
  for (let t = 0; t < bits; t++) r |= ((i >> t) & 1) << (bits - 1 - t);
  return r;
}

export const log2 = (n: number): number => Math.round(Math.log2(n));

const pad = (c: readonly number[], size: number): Shot => ({
  re: Array.from({ length: size }, (_, i) => c[i] ?? 0),
  im: Array.from({ length: size }, () => 0),
});

/**
 * 정본 한 번 호출의 기록. 답은 정본과 대조하고, 기록끼리는 이렇게 대조한다 — 정방향 · 역방향 기록이 각각
 * 바퀴 수 + 1 벌인가, 재배치 직후의 칸 `i` 가 채운 배열의 칸 `rev(i)` 인가, 나눗셈 뒤 값이 마지막 바퀴의 값을
 * 길이로 나눈 것인가. 어긋나면 던진다 — 그림이 정본과 다른 것을 그리지 않게.
 */
export function trace(a: number[], b: number[]): Trace {
  const answer = fftMultiply(a, b);
  const fwd = record(probeRounds, a, b, "fwd");
  const inv = record(probeRounds, a, b, "inv");
  const [product] = record(probeProduct, a, b, "product");
  const [divided] = record(probeDivided, a, b, "divided");
  if (product === undefined || divided === undefined) {
    throw new Error("자리별 곱이나 나눗셈 뒤의 기록이 없다");
  }
  const resultLen = a.length + b.length - 1;
  const size = product.re.length;
  const rounds = log2(size);
  if (fwd.length !== 2 * (rounds + 1) || inv.length !== rounds + 1) {
    throw new Error(
      `기록 수가 바퀴 수와 맞지 않는다 — ${fwd.length} · ${inv.length}`,
    );
  }
  const fwdA = fwd.slice(0, rounds + 1);
  const fwdB = fwd.slice(rounds + 1);
  const fillA = pad(a, size);
  const fillB = pad(b, size);
  for (const [fill, first] of [
    [fillA, fwdA[0]],
    [fillB, fwdB[0]],
  ] as const) {
    for (let i = 0; i < size; i++) {
      if (first?.re[i] !== fill.re[reverseBits(i, rounds)]) {
        throw new Error(`재배치 직후 칸 ${i} 가 뒤집은 자리의 값이 아니다`);
      }
    }
  }
  const last = inv.at(-1) as Shot;
  for (let i = 0; i < size; i++) {
    if (
      Math.abs((last.re[i] as number) / size - (divided.re[i] as number)) > 1e-9
    ) {
      throw new Error(`칸 ${i} 의 나눗셈 뒤 값이 길이로 나눈 값이 아니다`);
    }
  }
  return {
    a,
    b,
    resultLen,
    size,
    fillA,
    fillB,
    fwdA,
    fwdB,
    product,
    inv,
    divided,
    answer,
  };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK_A = [3, 1, 4, 1];
export const WALK_B = [2, 5];

/** 과제 규모 — 두 배열의 길이 상한과, 수치 반박에 쓰는 처리 속도(단순 연산 1 초에 1 억 번). */
export const LIMIT = 100_000;
export const PER_SECOND = 100_000_000;

export const num = (n: number | bigint): string => n.toLocaleString("en-US");

/** 소수 둘째 자리까지 반올림한 글자. `-0` 은 `0` 으로 적는다. */
export const r2 = (x: number): string => {
  const v = Math.round(x * 100) / 100;
  return Object.is(v, -0) || v === 0 ? "0" : String(v);
};

/** 복소수 한 칸 — `3+5.41i` 꼴. 허수부가 0 이면 실수부만, 실수부가 0 이면 허수부만 적는다. */
export function cx(re: number, im: number): string {
  const rs = r2(re);
  const is = r2(im);
  if (is === "0") return rs;
  const mag = is.startsWith("-") ? is.slice(1) : is;
  const unit = mag === "1" ? "i" : `${mag}i`;
  if (rs === "0") return is.startsWith("-") ? `-${unit}` : unit;
  return `${rs}${is.startsWith("-") ? "-" : "+"}${unit}`;
}

/** 기록 한 벌을 칸 글자 배열로. */
export const cells = (s: Shot): string[] =>
  s.re.map((re, i) => cx(re, s.im[i] as number));

/** 회전 인자 `ω^k` — 각도 `2πk/N` 인 단위원 위의 점. */
export const root = (k: number, n: number): [number, number] => [
  Math.cos((2 * Math.PI * k) / n),
  Math.sin((2 * Math.PI * k) / n),
];

/** 복소수 곱. */
export const mul = (
  [ar, ai]: readonly [number, number],
  [br, bi]: readonly [number, number],
): [number, number] => [ar * br - ai * bi, ar * bi + ai * br];

let walkMemo: Trace | undefined;
/** 전개 입력의 기록. 그림 · 증명 · 패널이 같은 기록을 쓴다. */
export const walk = (): Trace => {
  walkMemo ??= trace(WALK_A, WALK_B);
  return walkMemo;
};

/** 재배치가 맞바꾼 짝 — `i < rev(i)` 인 자리마다 한 짝. */
export const swapPairs = (size: number): [number, number][] => {
  const bits = log2(size);
  const out: [number, number][] = [];
  for (let i = 0; i < size; i++) {
    const j = reverseBits(i, bits);
    if (i < j) out.push([i, j]);
  }
  return out;
};

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly stage: ArrayStep;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "aRe · aIm",
  rangeLabel: "변환 길이 N",
};

/**
 * 전개 입력의 걸음 열둘.
 *
 * 무대의 첫 줄은 코드의 `aRe · aIm` 이다 — 칸 `i` 에 `aRe[i] + aIm[i]·i` 를 복소수 한 칸으로 적는다. 앞의 여섯
 * 걸음은 A 를 값 표현으로 옮기고, T8 부터 같은 배열이 곱 다항식 C 를 담는다(코드가 제자리에서 고쳐 쓴다). 그
 * 아래 `bRe · bIm` 줄이 B 이고, 맨 아래 「반환」 줄이 답의 칸 L 개다. 바뀐 칸은 새로 씀, 읽기만 한 칸은 읽음이다.
 */
export function walkSteps(): Step[] {
  const t = walk();
  const n = t.size;
  const rounds = log2(n);
  const all = Array.from({ length: n }, (_, i) => i);
  const blankN = Array.from({ length: n }, () => null);
  const blankL = Array.from({ length: t.resultLen }, () => null);
  const aRow = (s: Shot | null) => (s === null ? [...blankN] : cells(s));
  const layers = (
    b: Shot | null,
    out: readonly (string | null)[],
    opts: { bWrite?: number[]; bRead?: number[]; outWrite?: number[] } = {},
  ) => [
    {
      name: "bRe · bIm",
      values: b === null ? [...blankN] : cells(b),
      write: opts.bWrite ?? [],
      read: opts.bRead ?? [],
      span: 2,
    },
    {
      name: "반환",
      values: [...out],
      write: opts.outWrite ?? [],
      span: 2,
    },
  ];
  const base = { range: [0, n - 1] as [number, number], pointers: {}, span: 2 };
  const pairs = swapPairs(n);
  const moved = pairs.flat().sort((x, y) => x - y);
  const pairText = pairs.map(([i, j]) => `${i} ↔ ${j}`).join(" · ");
  const steps: Step[] = [];
  let butterflies = 0;

  let size = 1;
  const doublings: number[] = [size];
  while (size < t.resultLen) {
    size <<= 1;
    doublings.push(size);
  }
  steps.push({
    id: "T1",
    title: "길이 정하기",
    detail: `두 배열 다 비어 있지 않습니다. 결과 길이 L 은 ${t.a.length} + ${t.b.length} − 1 = ${t.resultLen} 이고, size 를 ${doublings.join(" → ")}${으로(String(n))} 두 배씩 늘려 ${t.resultLen} 이상인 가장 작은 2 의 거듭제곱 ${n}${을를(String(n))} 얻습니다. 배열 넷은 아직 잡지 않았습니다.`,
    stage: {
      ...base,
      array: [...blankN],
      rangeSide: `N = ${n}`,
      write: [],
      read: [],
      calc: {
        expr: `${t.a.length} + ${t.b.length} − 1 = ${t.resultLen}`,
        result: `N = ${n}`,
      },
      vars: "나비 0",
      layers: layers(null, blankL),
    },
  });
  steps.push({
    id: "T2",
    title: "계수 채우기",
    detail: `길이 ${n} 짜리 배열 넷을 잡고 a 를 aRe 에, b 를 bRe 에 앞에서부터 옮깁니다. 남는 칸과 허수부는 모두 0 입니다.`,
    stage: {
      ...base,
      array: aRow(t.fillA),
      rangeSide: `N = ${n}`,
      write: all,
      read: [],
      calc: { expr: `a → aRe · b → bRe`, result: "허수부 0" },
      vars: "나비 0",
      layers: layers(t.fillB, blankL, { bWrite: all }),
    },
  });
  steps.push({
    id: "T3",
    title: "A 재배치",
    detail: `자리 i 의 값을 i 의 이진 표기 ${rounds} 자리를 뒤집은 자리로 옮깁니다. 맞바뀌는 짝은 ${pairText} 이고 나머지 자리는 뒤집어도 제자리입니다.`,
    stage: {
      ...base,
      array: aRow(t.fwdA[0] as Shot),
      rangeSide: `N = ${n}`,
      write: moved,
      read: [],
      calc: { expr: pairText, result: `맞바꾼 짝 ${pairs.length}` },
      vars: "나비 0",
      layers: layers(t.fillB, blankL),
    },
  });
  for (let r = 1; r <= rounds; r++) {
    const len = 1 << r;
    const half = len >> 1;
    const before = t.fwdA[r - 1] as Shot;
    const after = t.fwdA[r] as Shot;
    const j = half - 1;
    const u: [number, number] = [
      before.re[j] as number,
      before.im[j] as number,
    ];
    const v: [number, number] = [
      before.re[j + half] as number,
      before.im[j + half] as number,
    ];
    const w = root(j, len);
    butterflies += n / 2;
    steps.push({
      id: `T${3 + r}`,
      title: `A 블록 길이 ${len}`,
      detail: `배열을 ${len} 칸 블록 ${n / len} 개로 끊고, 블록마다 앞 절반의 칸 k 와 뒤 절반의 칸 k + ${half}${을를(String(half))} 짝지어 나비 연산을 합니다. 블록 0 의 마지막 짝은 u = ${cx(...u)}, v = ${cx(...v)}, 회전 인자 ω^${j} = ${cx(...w)} 로 ${cx(after.re[j] as number, after.im[j] as number)}${과와(cx(after.re[j] as number, after.im[j] as number))} ${cx(after.re[j + half] as number, after.im[j + half] as number)}${을를(cx(after.re[j + half] as number, after.im[j + half] as number))} 냅니다.`,
      stage: {
        ...base,
        array: aRow(after),
        rangeSide: `블록 길이 ${len} · 블록 ${n / len} 개`,
        write: all,
        read: [],
        calc: {
          expr: `${cx(...u)} ± (${cx(...w)})·(${cx(...v)})`,
          result: `${cx(after.re[j] as number, after.im[j] as number)} · ${cx(after.re[j + half] as number, after.im[j + half] as number)}`,
        },
        vars: `나비 ${butterflies}`,
        layers: layers(t.fillB, blankL),
      },
    });
  }
  butterflies += (n / 2) * rounds;
  const bDone = t.fwdB.at(-1) as Shot;
  steps.push({
    id: `T${4 + rounds}`,
    title: `B 도 같은 ${rounds} 바퀴`,
    detail: `B 에 같은 재배치와 블록 길이 ${Array.from({ length: rounds }, (_, r) => 1 << (r + 1)).join(" · ")} 바퀴를 한 번에 합니다. 끝나면 bRe · bIm 이 B 를 단위근 ${n} 개에서 평가한 값입니다.`,
    stage: {
      ...base,
      array: aRow(t.fwdA.at(-1) as Shot),
      rangeSide: `N = ${n}`,
      write: [],
      read: [],
      calc: {
        expr: `재배치 → 바퀴 ${rounds}`,
        result: `나비 ${(n / 2) * rounds}`,
      },
      vars: `나비 ${butterflies}`,
      layers: layers(bDone, blankL, { bWrite: all }),
    },
  });
  const aDone = t.fwdA.at(-1) as Shot;
  const k1: [number, number] = [aDone.re[1] as number, aDone.im[1] as number];
  const b1: [number, number] = [bDone.re[1] as number, bDone.im[1] as number];
  steps.push({
    id: `T${5 + rounds}`,
    title: "자리마다 곱",
    detail: `같은 자리의 두 복소수를 한 번씩 곱해 aRe · aIm 에 씁니다. 이제 이 배열이 곱 다항식 C 를 단위근 ${n} 개에서 평가한 값입니다. 자리 1 은 ${cx(...k1)}${과와(cx(...k1))} ${cx(...b1)} 의 곱입니다.`,
    stage: {
      ...base,
      array: aRow(t.product),
      rangeSide: `N = ${n}`,
      write: all,
      read: [],
      calc: {
        expr: `(${cx(...k1)})·(${cx(...b1)})`,
        result: cx(t.product.re[1] as number, t.product.im[1] as number),
      },
      vars: `나비 ${butterflies}`,
      layers: layers(bDone, blankL, { bRead: all }),
    },
  });
  steps.push({
    id: `T${6 + rounds}`,
    title: "역방향 재배치",
    detail: `역변환도 같은 재배치로 시작합니다. 맞바뀌는 짝은 정방향과 같은 ${pairText} 입니다.`,
    stage: {
      ...base,
      array: aRow(t.inv[0] as Shot),
      rangeSide: `N = ${n}`,
      write: moved,
      read: [],
      calc: { expr: pairText, result: `맞바꾼 짝 ${pairs.length}` },
      vars: `나비 ${butterflies}`,
      layers: layers(bDone, blankL),
    },
  });
  butterflies += (n / 2) * rounds;
  const invDone = t.inv.at(-1) as Shot;
  steps.push({
    id: `T${7 + rounds}`,
    title: `역방향 ${rounds} 바퀴`,
    detail: `각도의 부호만 뒤집어 같은 나비 연산을 블록 길이 ${Array.from({ length: rounds }, (_, r) => 1 << (r + 1)).join(" · ")}${으로(String(n))} 합니다. 허수부가 모두 0 근방으로 모이고 실수부에 계수의 ${n} 배가 남습니다.`,
    stage: {
      ...base,
      array: aRow(invDone),
      rangeSide: `N = ${n}`,
      write: all,
      read: [],
      calc: { expr: "각도 × (−1)", result: `나비 ${(n / 2) * rounds}` },
      vars: `나비 ${butterflies}`,
      layers: layers(bDone, blankL),
    },
  });
  steps.push({
    id: `T${8 + rounds}`,
    title: `${n}${으로(String(n))} 나누기`,
    detail: `배열 전체를 길이 ${n}${으로(String(n))} 한 번 나눕니다. 나눗셈은 역변환의 끝에서 이 한 번뿐입니다.`,
    stage: {
      ...base,
      array: aRow(t.divided),
      rangeSide: `N = ${n}`,
      write: all,
      read: [],
      calc: {
        expr: `${r2(invDone.re[1] as number)} ÷ ${n}`,
        result: r2(t.divided.re[1] as number),
      },
      vars: `나비 ${butterflies}`,
      layers: layers(bDone, blankL),
    },
  });
  // 반올림 차이가 가장 큰 자리를 알약에 싣는다 — 정수에서 떨어진 값이 실제로 있다는 것을 보인다.
  let worst = 0;
  for (let i = 0; i < t.resultLen; i++) {
    const gap = (x: number) => Math.abs(x - Math.round(x));
    if (gap(t.divided.re[i] as number) > gap(t.divided.re[worst] as number))
      worst = i;
  }
  const outs = t.answer.map(String);
  steps.push({
    id: `T${9 + rounds}`,
    title: "반올림해 돌려주기",
    detail: `앞 ${t.resultLen} 칸의 실수부를 반올림해 반환 배열에 씁니다. 자리 ${worst} 의 값이 ${String(t.divided.re[worst])}${으로(String(t.divided.re[worst]))} 정수에서 가장 멀리 떨어져 있고, 반올림이 그 차이를 지웁니다.`,
    stage: {
      ...base,
      array: aRow(t.divided),
      rangeSide: `N = ${n}`,
      write: [],
      read: Array.from({ length: t.resultLen }, (_, i) => i),
      calc: {
        expr: `Math.round(${String(t.divided.re[worst])})`,
        result: String(t.answer[worst]),
      },
      vars: `나비 ${butterflies}`,
      layers: layers(bDone, outs, {
        outWrite: Array.from({ length: t.resultLen }, (_, i) => i),
      }),
    },
  });
  return steps;
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자 그대로
 * 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는 `fftMultiply-guide.test.ts`
 * 가 잰다.
 */
export function simStepsFromRef() {
  return {
    fftWalk: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

/** 서로 다른 복소수의 개수 — 부동소수 오차를 지우려고 소수 아홉째 자리에서 맞춘다. */
export function distinct(points: readonly [number, number][]): number {
  const key = ([re, im]: readonly [number, number]) =>
    `${Math.round(re * 1e9)}/${Math.round(im * 1e9)}`;
  return new Set(points.map(key)).size;
}

/** 점 묶음을 제곱해 나가며 서로 다른 값의 개수를 센다 — 처음 · 1 번 · 2 번 · 3 번 제곱한 뒤. */
export function squareChain(points: readonly [number, number][]): number[] {
  const out: number[] = [];
  let cur = [...points];
  for (let t = 0; t <= 3; t++) {
    out.push(distinct(cur));
    cur = cur.map((p) => mul(p, p));
  }
  return out;
}

/** 시도에 쓰는 점 묶음 셋 — 모두 여덟 점이다. */
export const POINT_SETS: { name: string; points: [number, number][] }[] = [
  {
    name: "실수 0 부터 7 까지",
    points: Array.from({ length: 8 }, (_, k) => [k, 0] as [number, number]),
  },
  {
    name: "실수 ±1 · ±2 · ±3 · ±4",
    points: [1, 2, 3, 4].flatMap((x) => [
      [x, 0] as [number, number],
      [-x, 0] as [number, number],
    ]),
  },
  {
    name: "8 등분 단위근",
    points: Array.from({ length: 8 }, (_, k) => root(k, 8)),
  },
];

/** 정의 그대로 곱하는 방법의 기본 연산 — 계수 한 쌍마다 곱 하나와 누적 덧셈 하나. */
export const naiveOps = (n: number, m: number): number => 2 * n * m;

/* ───────────── 아무 점에서 평가하고 보간하는 길 — 기본 연산을 센다 ───────────── */

/** 점 `xs` 에서 호너 방식으로 평가한다. 계수 하나를 더 넣을 때마다 곱 하나와 덧셈 하나다. */
export function hornerAll(
  c: readonly number[],
  xs: readonly number[],
  count: { ops: number },
): number[] {
  return xs.map((x) => {
    let v = c[c.length - 1] ?? 0;
    for (let i = c.length - 2; i >= 0; i--) {
      count.ops += 2;
      v = v * x + (c[i] as number);
    }
    return v;
  });
}

/**
 * 라그랑주 보간 — 점 `xs` 와 값 `ys` 에서 계수를 되찾는다. 기저 다항식 `Π (x − x_j)` 를 계수 배열로 펴고
 * 분모로 나눠 더한다. 곱 · 덧셈 · 뺄셈 · 나눗셈을 하나씩 센다.
 */
export function lagrangeAll(
  xs: readonly number[],
  ys: readonly number[],
  count: { ops: number },
): number[] {
  const n = xs.length;
  const out = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let denom = 1;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      count.ops += 2; // 뺄셈 하나와 곱 하나
      denom *= (xs[i] as number) - (xs[j] as number);
    }
    const basis = new Array<number>(n).fill(0);
    basis[0] = 1;
    let deg = 0;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      for (let k = deg + 1; k > 0; k--) {
        count.ops += 2; // 곱 하나와 뺄셈 하나
        basis[k] =
          (basis[k - 1] as number) - (xs[j] as number) * (basis[k] as number);
      }
      count.ops += 1;
      basis[0] = -(xs[j] as number) * (basis[0] as number);
      deg++;
    }
    count.ops += 1;
    const scale = (ys[i] as number) / denom;
    for (let k = 0; k < n; k++) {
      count.ops += 2; // 곱 하나와 덧셈 하나
      out[k] = (out[k] as number) + scale * (basis[k] as number);
    }
  }
  return out.map((v) => {
    const r = Math.round(v);
    return r === 0 ? 0 : r;
  });
}

/** 정의를 그대로 옮긴 곱. 답의 기준이다. */
export function naiveConv(
  a: readonly number[],
  b: readonly number[],
): number[] {
  if (a.length === 0 || b.length === 0) return [];
  const out = new Array<number>(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      out[i + j] = (out[i + j] as number) + (a[i] as number) * (b[j] as number);
    }
  }
  return out;
}

/** 재는 길이 넷 — 두 배열 다 이 길이다. */
export const POINT_ROUTE_LENS = [4, 16, 64, 128];

/** 길이 `n` 두 배열을 점 0 · 1 · … · 2n − 2 에서 평가하고 보간해 곱한다. */
export function pointRoute(n: number): {
  points: number;
  evalOps: number;
  interpOps: number;
  same: boolean;
} {
  const a = coeffsLocal(n, 9, 1);
  const b = coeffsLocal(n, 9, 2);
  const L = 2 * n - 1;
  const xs = Array.from({ length: L }, (_, k) => k);
  const ev = { ops: 0 };
  const av = hornerAll(a, xs, ev);
  const bv = hornerAll(b, xs, ev);
  const cv = av.map((v, k) => v * (bv[k] as number));
  const ip = { ops: L };
  const got = lagrangeAll(xs, cv, ip);
  const want = naiveConv(a, b);
  return {
    points: L,
    evalOps: ev.ops,
    interpOps: ip.ops,
    same: got.length === want.length && got.every((v, i) => v === want[i]),
  };
}

function approaches(pointCost: {
  len: number;
  ops: number;
  naive: number;
  firstWrong: number;
}): Approach[] {
  const t = walk();
  const naive = naiveOps(LIMIT, LIMIT);
  const fft = fftCost(LIMIT, LIMIT);
  const chains = POINT_SETS.map((s) => squareChain(s.points));
  return [
    {
      name: "계수 짝마다 곱하기",
      idea: "자리 i 의 값과 자리 j 의 값을 곱해 자리 i + j 에 더한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = m = ${num(LIMIT)} 이면 기본 연산 ${num(naive)} 번 · ${num(naive / PER_SECOND)} 초`,
          ok: false,
        },
      ],
      lesson: "곱의 값은 점마다 곱 한 번이면 나온다 — 값 표현으로 옮겨 본다",
    },
    {
      name: "점 0 · 1 · 2 … 에서 평가하고 보간하기",
      idea: "두 다항식을 L 개 점에서 평가해 자리마다 곱하고, 라그랑주 보간으로 계수를 되찾는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `길이 ${pointCost.firstWrong} 부터 되찾은 계수가 어긋난다`,
          ok: false,
        },
        {
          label: "시간",
          value: `길이 ${pointCost.len} 에서 기본 연산 ${num(pointCost.ops)} 번 · 정의 그대로 ${num(pointCost.naive)} 번`,
          ok: false,
        },
      ],
      lesson:
        "점 사이에 관계가 없으면 평가를 나눠 쓸 수 없다 — 제곱하면 가짓수가 반으로 주는 점이 필요하다",
    },
    {
      name: "실수 ± 쌍에서 평가하기",
      idea: "x 와 −x 를 짝지어 A(x) = E(x²) + x·O(x²) 로 한 번에 두 점을 낸다",
      verdict: "drop",
      checks: [
        {
          label: "가짓수",
          value: `제곱해 나가면 ${(chains[1] as number[]).join(" → ")} — 한 번만 반으로 준다`,
          ok: false,
        },
      ],
      lesson:
        "실수의 제곱은 음수가 아니라 다시 ± 쌍이 되지 않는다 — 단위원 위의 복소수로 간다",
    },
    {
      name: "N 등분 단위근에서 반씩 가르기 — FFT",
      idea: "제곱할 때마다 가짓수가 반으로 주는 점에서 평가해, 크기 N 의 평가를 N/2 짜리 둘로 가른다",
      verdict: "keep",
      checks: [
        {
          label: "가짓수",
          value: `제곱해 나가면 ${(chains[2] as number[]).join(" → ")}`,
          ok: true,
        },
        {
          label: "답",
          value: `전개 입력에서 [${t.answer.join(", ")}]`,
          ok: true,
        },
        {
          label: "시간",
          value: `n = m = ${num(LIMIT)} 이면 연산 ${num(fft.ops + fft.trig)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 복소수 한 칸이 격자 두 칸이다. */
const W = 2;

const idxRow = (n: number, label: string): StageRow => ({
  kind: "index",
  label,
  span: W,
  labels: Array.from({ length: n }, (_, i) => i),
});

/** 패딩으로 채운 칸(원래 배열 밖)을 대시로 그린다. */
const padStates = (
  len: number,
  size: number,
): Partial<Record<number, CellState>> => {
  const s: Partial<Record<number, CellState>> = {};
  for (let i = len; i < size; i++) s[i] = "out";
  return s;
};

export const FIGS: Record<string, () => ReactElement> = {
  /** 전체 컨셉 — 계수를 단위근에서의 값으로 옮기고, 자리마다 곱하고, 계수로 되돌린다. */
  "concept-roundtrip": () => {
    const t = walk();
    const n = t.size;
    const angles = Array.from({ length: n }, (_, k) => `${(360 / n) * k}°`);
    const cOut = Array.from({ length: n }, (_, i) =>
      i < t.resultLen ? String(t.answer[i]) : r2(t.divided.re[i] as number),
    );
    return (
      <CellStage
        title={`계수 → 단위근 ${n} 개에서의 값 → 자리마다 곱 → 계수 [${t.answer.join(", ")}]`}
        columns={n * W}
        rows={[
          idxRow(n, "자리 k"),
          {
            kind: "cells",
            label: "a",
            span: W,
            values: t.fillA.re.map(String),
            states: padStates(t.a.length, n),
            side: `계수 ${t.a.length} 개 · 나머지는 0`,
          },
          {
            kind: "cells",
            label: "b",
            span: W,
            values: t.fillB.re.map(String),
            states: padStates(t.b.length, n),
            side: `계수 ${t.b.length} 개 · 나머지는 0`,
          },
          {
            kind: "cells",
            label: "ω^k 의 각도",
            span: W,
            values: angles,
            side: `단위원을 ${n} 등분한 점`,
          },
          {
            kind: "cells",
            label: "A(ω^k)",
            span: W,
            values: cells(t.fwdA.at(-1) as Shot),
            side: "평가 — FFT",
          },
          {
            kind: "cells",
            label: "B(ω^k)",
            span: W,
            values: cells(t.fwdB.at(-1) as Shot),
            side: "평가 — FFT",
          },
          {
            kind: "cells",
            label: "A·B",
            span: W,
            values: cells(t.product),
            states: Object.fromEntries(
              Array.from({ length: n }, (_, i) => [i, "read" as CellState]),
            ),
            side: `자리마다 곱 ${n} 번`,
          },
          {
            kind: "cells",
            label: "c",
            span: W,
            values: cOut,
            states: {
              ...Object.fromEntries(
                Array.from({ length: t.resultLen }, (_, i) => [
                  i,
                  "focus" as CellState,
                ]),
              ),
              ...padStates(t.resultLen, n),
            },
            side: `역변환 → 앞 ${t.resultLen} 칸`,
          },
        ]}
      />
    );
  },
  "origin-approaches": () => {
    const lens = POINT_ROUTE_LENS.map((len) => ({ len, ...pointRoute(len) }));
    const wrong = lens.find((r) => !r.same);
    const big = lens.at(-1);
    if (wrong === undefined || big === undefined) {
      throw new Error(
        "점 0 · 1 · 2 … 로 되찾은 계수가 어느 길이에서도 안 어긋났다",
      );
    }
    const steps = approaches({
      len: big.len,
      ops: big.evalOps + big.interpOps,
      naive: naiveOps(big.len, big.len),
      firstWrong: wrong.len,
    });
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`n, m ≤ ${num(LIMIT)} · 1 초(단순 연산 1 초에 ${num(PER_SECOND)} 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  /** 먼저 알아 둘 개념 — 8 등분 단위근. 제곱하면 4 등분 점으로, 반 바퀴 떨어진 점은 부호만 다르다. */
  "build-roots": () => {
    const n = 8;
    const pick = 3;
    const pts = Array.from({ length: n }, (_, k) => root(k, n));
    const sq = pts.map((p) => mul(p, p));
    return (
      <CellStage
        title={`${n} 등분 단위근 ω^k — 제곱하면 ${n / 2} 등분 점으로 겹치고, ω^(k+${n / 2}) 는 −ω^k 다`}
        columns={n * W}
        rows={[
          idxRow(n, "k"),
          {
            kind: "cells",
            label: "각도",
            span: W,
            values: Array.from({ length: n }, (_, k) => `${(360 / n) * k}°`),
            states: { [pick]: "read" },
          },
          {
            kind: "cells",
            label: "ω^k",
            span: W,
            values: pts.map((p) => cx(...p)),
            states: { [pick]: "read", [pick + n / 2]: "read" },
            side: `ω^${pick + n / 2} = −ω^${pick}`,
          },
          {
            kind: "caret",
            span: W,
            cells: [pick, pick + n / 2],
            side: "반 바퀴 차이 — 부호만 다르다",
          },
          {
            kind: "cells",
            label: "(ω^k)²",
            span: W,
            values: sq.map((p) => cx(...p)),
            states: { [pick]: "focus", [pick + n / 2]: "focus" },
            side: `서로 다른 값 ${distinct(sq)} 개`,
          },
        ]}
      />
    );
  },
  /** 4단계 — 재배치한 배열 위에서 블록 길이를 두 배씩 늘려 가며 합친다. */
  "build-layers": () => {
    const t = walk();
    const n = t.size;
    const bits = log2(n);
    const reordered = (t.fwdA[0] as Shot).re.map(String);
    const groups: LayerBar[][] = [];
    for (let len = 2; len <= n; len <<= 1) {
      const stride = n / len;
      const sBits = log2(stride);
      const group: LayerBar[] = [];
      for (let blk = 0; blk * len < n; blk++) {
        const residue = reverseBits(blk, sBits);
        const members = Array.from(
          { length: len },
          (_, q) => residue + q * stride,
        );
        group.push({
          label: `len ${len} 블록 ${blk}`,
          from: blk * len,
          to: blk * len + len - 1,
          note: `원래 자리 ${members.join(" ")} 의 변환`,
        });
      }
      groups.push(group);
    }
    if (bits < 1) throw new Error("바퀴가 없다");
    return (
      <LayerBars
        title={`재배치한 A 위의 블록 — 블록 길이가 2 · 4 · ${n}${으로(String(n))} 두 배가 될 때마다 이웃 블록 둘이 하나로 합쳐진다`}
        values={reordered}
        valuesLabel="재배치 뒤 aRe"
        indexLabel="칸"
        groups={groups}
      />
    );
  },
  "walk-run": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.stage.calc?.expr} → ${s.stage.calc?.result}`,
      rows: arrayStage(s.stage, ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`fftMultiply([${WALK_A.join(", ")}], [${WALK_B.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns((steps[0] as Step).stage)}
        frames={frames}
      />
    );
  },
};
