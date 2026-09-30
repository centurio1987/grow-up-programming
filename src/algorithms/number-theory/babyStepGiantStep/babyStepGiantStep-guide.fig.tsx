/**
 * `babyStepGiantStep-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 정본 소스에서 기계로 만든 계측
 * 사본 넷이 한 호출의 네 자리를 기록한다 — 조각 크기를 구하는 뉴턴법(`sqrtProbe`), 아기 걸음 표에
 * 적는 줄(`babyProbe`), 보폭을 구하는 반복 제곱(`powerProbe`), 큰 걸음이 아기 걸음 표를 찾는 줄
 * (`giantProbe`). 네 사본은 각자 호출 전체를 끝까지 실행하고, 답이 정본과 같은지 대조한다.
 * 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과
 * 같은지는 `babyStepGiantStep-guide.test.ts` 가 잰다.
 *
 * 곱셈은 **모듈러 곱셈 횟수**(곱한 뒤 법으로 줄이는 곱셈 한 번을 하나로 센다)로 센다. 아기 걸음은
 * 한 바퀴에 한 번, 반복 제곱은 한 바퀴에 제곱 한 번과 지수 비트가 1 이면 한 번 더, 큰 걸음은 한
 * 바퀴에 한 번이다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 을를, 이가 } from "../../../../tools/josa.ts";
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
import { keyValueRows } from "../../../_viz/patterns/KeyValueTable";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import {
  babyStepGiantStep,
  ceilSqrt,
  power,
} from "./babyStepGiantStep-guide.ref.ts";

const REF = new URL("./babyStepGiantStep-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  babyStepGiantStep(a: bigint, b: bigint, m: bigint): bigint;
  ceilSqrt(m: bigint): bigint;
}

type Hook = Record<string, ((...xs: bigint[]) => void) | undefined>;
const hook = (): Hook =>
  ((globalThis as unknown as { __bsgs?: Hook }).__bsgs ??= {});

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 뉴턴법 한 바퀴 — `x = y;` 뒤에서 새 `x` 를 기록한다. */
const sqrtProbe = await loadMutant<Impl>(REF, {
  swap: [/^(\s*)x = y;$/, "$1x = y;\n$1(globalThis as any).__bsgs?.sqrt?.(x);"],
});

/** 아기 걸음 한 바퀴 — 아기 걸음 표에 적은 값과 `j`. */
const babyProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)table\.set\(baby, j\);$/,
    "$1table.set(baby, j);\n$1(globalThis as any).__bsgs?.baby?.(baby, j);",
  ],
});

/** 반복 제곱 한 바퀴 — 지수를 반으로 줄이기 직전의 `e` · `b` · `result`. */
const powerProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)e \/= 2n;$/,
    "$1(globalThis as any).__bsgs?.power?.(e, b, result);\n$1e /= 2n;",
  ],
});

/** 큰 걸음 한 바퀴 — `i` · `giant` · 아기 걸음 표에서 찾은 `j`(없으면 -1) · `n` · `stride`. */
const giantProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)const j = table\.get\(giant\);$/,
    "$1const j = table.get(giant);\n$1(globalThis as any).__bsgs?.giant?.(i, giant, j ?? -1n, n, stride);",
  ],
});

/** 뉴턴법이 지나간 `x` — 계측 사본의 `ceilSqrt` 를 부르고 답은 정본과 대조한다. */
export function sqrtPath(m: bigint): { path: bigint[]; result: bigint } {
  const h = hook();
  const path: bigint[] = [m];
  h.sqrt = (x) => {
    path.push(x as bigint);
  };
  const result = sqrtProbe.ceilSqrt(m);
  h.sqrt = undefined;
  if (result !== ceilSqrt(m)) throw new Error("뉴턴법 사본이 정본과 다르다");
  return { path, result };
}

export interface Round {
  readonly e: bigint;
  /** 이 바퀴에 제곱한 뒤의 밑. */
  readonly b: bigint;
  /** 이 바퀴가 끝난 누적값. */
  readonly result: bigint;
  /** 이 바퀴의 곱셈 — 제곱 하나에 비트가 1 이면 하나 더. */
  readonly mul: number;
}

export interface Giant {
  readonly i: bigint;
  readonly giant: bigint;
  /** 아기 걸음 표에서 찾은 `j`. 없으면 `null`. */
  readonly j: bigint | null;
}

export interface Trace {
  readonly a: bigint;
  readonly b: bigint;
  readonly m: bigint;
  readonly A: bigint;
  readonly B: bigint;
  readonly answer: bigint;
  /** 뉴턴법이 지나간 `x`(첫 값 `m` 포함). 표를 만들기 전에 끝났으면 빈 목록. */
  readonly sqrt: readonly bigint[];
  readonly n: bigint | null;
  /** 아기 걸음 — 적은 순서의 `[값, j]`. */
  readonly baby: readonly (readonly [bigint, bigint])[];
  readonly power: readonly Round[];
  readonly stride: bigint | null;
  readonly giant: readonly Giant[];
  readonly mul: { baby: number; power: number; giant: number; total: number };
  /** 끝났을 때 아기 걸음 표의 칸 수. */
  readonly cells: number;
}

const norm = (v: bigint, m: bigint): bigint => ((v % m) + m) % m;

/**
 * 정본 한 번 호출의 기록 — 네 계측 사본을 차례로 실행한다. `light` 면 걸음을 모으지 않고 수만
 * 센다(큰 입력에서 기록 사본이 걸음마다 목록을 늘리지 않게).
 */
export function trace(a: bigint, b: bigint, m: bigint, light = false): Trace {
  const h = hook();
  const answer = babyStepGiantStep(a, b, m);
  const check = (who: string, got: bigint) => {
    if (got !== answer) {
      throw new Error(
        `${who} 사본이 정본과 다른 답을 냈다 — (${a}, ${b}, ${m}): ${got} ≠ ${answer}`,
      );
    }
  };
  const sqrt: bigint[] = [];
  h.sqrt = (x) => {
    sqrt.push(x as bigint);
  };
  check("뉴턴법", sqrtProbe.babyStepGiantStep(a, b, m));
  h.sqrt = undefined;

  const baby: [bigint, bigint][] = [];
  let babyCount = 0;
  const cellsSeen = new Set<bigint>();
  h.baby = (v, j) => {
    babyCount++;
    cellsSeen.add(v as bigint);
    if (!light) baby.push([v as bigint, j as bigint]);
  };
  check("아기 걸음", babyProbe.babyStepGiantStep(a, b, m));
  h.baby = undefined;

  const power: Round[] = [];
  let powerMul = 0;
  h.power = (e, bb, result) => {
    const mul = 1 + ((e as bigint) % 2n === 1n ? 1 : 0);
    powerMul += mul;
    power.push({
      e: e as bigint,
      b: bb as bigint,
      result: result as bigint,
      mul,
    });
  };
  check("반복 제곱", powerProbe.babyStepGiantStep(a, b, m));
  h.power = undefined;

  const giant: Giant[] = [];
  let giantCount = 0;
  let n: bigint | null = null;
  let stride: bigint | null = null;
  h.giant = (i, g, j, nn, s) => {
    giantCount++;
    n = nn as bigint;
    stride = s as bigint;
    if (!light || (j as bigint) >= 0n) {
      giant.push({
        i: i as bigint,
        giant: g as bigint,
        j: (j as bigint) < 0n ? null : (j as bigint),
      });
    }
  };
  check("큰 걸음", giantProbe.babyStepGiantStep(a, b, m));
  h.giant = undefined;

  const A = m === 1n ? 0n : norm(a, m);
  const B = m === 1n ? 0n : norm(b, m);
  const nn = babyCount > 0 ? ceilSqrt(m) : null;
  if (babyCount > 0 && nn !== BigInt(babyCount)) {
    throw new Error("아기 걸음 수가 ⌈√m⌉ 과 다르다");
  }
  const sqrtPath = babyCount > 0 && m >= 2n ? [m, ...sqrt] : [];
  const giantN = n as bigint | null;
  return {
    a,
    b,
    m,
    A,
    B,
    answer,
    sqrt: sqrtPath,
    n: nn ?? giantN,
    baby,
    power: babyCount > 0 ? power : [],
    stride,
    giant,
    mul: {
      baby: babyCount,
      power: babyCount > 0 ? powerMul : 0,
      giant: giantCount,
      total: babyCount + (babyCount > 0 ? powerMul : 0) + giantCount,
    },
    cells: cellsSeen.size,
  };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK = { a: 5n, b: 33n, m: 58n } as const;
/** 아기 걸음 표에 같은 값이 다시 나오는 입력 — `3` 의 거듭제곱이 법 13 에서 세 값만 돈다. */
export const DUP = { a: 3n, b: 3n, m: 13n } as const;
/** 과제 규모의 법 — 흔히 쓰는 소수 1,000,000,007. */
export const BIG_M = 1_000_000_007n;
/** 과제 규모에서 쓰는 밑. */
export const BIG_A = 5n;
/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
export const secondsOf = (ops: bigint | number): string =>
  `${(Number(ops) / 1e8).toFixed(Number(ops) < 1e6 ? 8 : 2)} 초`;
export const num = (x: bigint | number): string =>
  BigInt(x).toLocaleString("en-US");

/** 정의대로 푸는 선형 탐색 — `x` 를 0 부터 올리며 `a^x` 를 만든다. 곱셈 수를 센다. */
export function linearLog(
  a: bigint,
  b: bigint,
  m: bigint,
): { x: bigint; mul: bigint } {
  const A = norm(a, m);
  const B = norm(b, m);
  let v = 1n % m;
  let mul = 0n;
  for (let x = 0n; x < m; x++) {
    if (v === B) return { x, mul };
    v = (v * A) % m;
    mul++;
  }
  return { x: -1n, mul };
}

/**
 * 선형 탐색의 곱셈 수를 **돌리지 않고** 센다. 반복은 `x` 번째 바퀴에서 답을 보면 곱셈 `x` 번에서
 * 멈추고, 끝까지 못 보면 `x < m` 인 `m` 바퀴를 다 돈다. 답은 정본에서 받는다. 작은 법에서는
 * `linearLog` 를 실제로 돌려 이 셈과 같은지 대조한다.
 */
export function linearMulByShape(a: bigint, b: bigint, m: bigint): bigint {
  const x = babyStepGiantStep(a, b, m);
  const mul = x === -1n ? m : x;
  if (m <= 100_000n) {
    const run = linearLog(a, b, m);
    if (run.x !== x || run.mul !== mul) {
      throw new Error(`선형 탐색의 셈이 실행과 다르다 — (${a}, ${b}, ${m})`);
    }
  }
  return mul;
}

/** 반복 제곱의 곱셈 수 — 정본 `power` 와 같은 절차를 세며 돌리고, 값은 정본과 대조한다. */
export function countedPower(
  base: bigint,
  exp: bigint,
  m: bigint,
): { value: bigint; mul: number } {
  let result = 1n;
  let b = base % m;
  let e = exp;
  let mul = 0;
  while (e > 0n) {
    if (e % 2n === 1n) {
      result = (result * b) % m;
      mul++;
    }
    b = (b * b) % m;
    mul++;
    e /= 2n;
  }
  if (result !== power(base, exp, m))
    throw new Error("반복 제곱이 정본과 다르다");
  return { value: result, mul };
}

/**
 * 조각 크기 `n` 을 마음대로 고르는 판 — 아기 걸음 `n` 칸, 큰 걸음 `⌈m/n⌉` 번. 정본은 `n = ⌈√m⌉`
 * 이라 큰 걸음도 `n` 번이다. 답은 정본과 대조한다.
 */
export function withN(
  a: bigint,
  b: bigint,
  m: bigint,
  n: bigint,
): { x: bigint; baby: number; power: number; giant: number; total: number } {
  const A = norm(a, m);
  const B = norm(b, m);
  const done = (x: bigint, baby: number, pw: number, giant: number) => {
    if (x !== babyStepGiantStep(a, b, m)) {
      throw new Error(
        `n = ${n} 판이 정본과 다른 답을 냈다 — (${a}, ${b}, ${m})`,
      );
    }
    return { x, baby, power: pw, giant, total: baby + pw + giant };
  };
  if (B === 1n) return done(0n, 0, 0, 0);
  const table = new Map<bigint, bigint>();
  let baby = B;
  let babyMul = 0;
  for (let j = 0n; j < n; j++) {
    table.set(baby, j);
    baby = (baby * A) % m;
    babyMul++;
  }
  const { value: stride, mul: pw } = countedPower(A, n, m);
  const rounds = (m + n - 1n) / n;
  let giant = 1n;
  let giantMul = 0;
  for (let i = 1n; i <= rounds; i++) {
    giant = (giant * stride) % m;
    giantMul++;
    const j = table.get(giant);
    if (j !== undefined) return done(i * n - j, babyMul, pw, giantMul);
  }
  return done(-1n, babyMul, pw, giantMul);
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly giants: readonly (bigint | null)[];
  readonly range: readonly [number, number] | null;
  readonly giantWrite: readonly number[];
  readonly pointer?: number;
  readonly entries: readonly (readonly [bigint, bigint])[];
  readonly mapRead: readonly bigint[];
  readonly mapWrite: readonly bigint[];
  readonly note?: string;
  readonly calc: { readonly expr: string; readonly result: string };
  readonly vars: string;
}

/** 아기 걸음 표를 적은 순서 그대로 쌓는다 — 같은 값이면 자리는 그대로 두고 `j` 만 바꾼다. */
function tableAfter(
  baby: readonly (readonly [bigint, bigint])[],
  upto: number,
): [bigint, bigint][] {
  const m = new Map<bigint, bigint>();
  for (const [v, j] of baby.slice(0, upto)) m.set(v, j);
  return [...m.entries()];
}

/** 전개 입력 한 호출의 걸음 — 조각 크기 한 걸음, 아기 걸음 `n` 걸음, 보폭 한 걸음, 큰 걸음마다 한 걸음. */
export function walkSteps(
  input: { a: bigint; b: bigint; m: bigint } = WALK,
): Step[] {
  const t = trace(input.a, input.b, input.m);
  const n = t.n as bigint;
  const nn = Number(n);
  const giants: (bigint | null)[] = new Array(nn + 1).fill(null);
  const steps: Step[] = [];
  let k = 1;
  let mul = 0;
  const mulText = () => `n = ${n} · 곱셈 ${mul} 번`;
  steps.push({
    id: `T${k++}`,
    title: `n = ${n}`,
    detail: `a = ${t.A}, b = ${t.B}${josa(String(t.B), "이고", "고")} b 가 1 이 아니라 아기 걸음 표를 만듭니다. 조각 크기는 n = ⌈√${t.m}⌉ = ${n} 입니다.`,
    giants: [...giants],
    range: null,
    giantWrite: [],
    entries: [],
    mapRead: [],
    mapWrite: [],
    calc: { expr: `⌈√${t.m}⌉`, result: String(n) },
    vars: mulText(),
  });
  t.baby.forEach(([v, j], idx) => {
    mul++;
    const before = tableAfter(t.baby, idx);
    const had = before.find(([key]) => key === v);
    const prev =
      idx === 0 ? null : (t.baby[idx - 1] as readonly [bigint, bigint]);
    steps.push({
      id: `T${k++}`,
      title: `j = ${j} · ${v}`,
      detail:
        had === undefined
          ? `b·a^${j} = ${v}${을를(String(v))} 아기 걸음 표에 적습니다. 값 ${v} 의 j 는 ${j} 입니다.`
          : `b·a^${j} = ${v}${이가(String(v))} 이미 j = ${had[1]} 로 적혀 있어 j = ${j} 로 덮어씁니다.`,
      giants: [...giants],
      range: null,
      giantWrite: [],
      entries: tableAfter(t.baby, idx + 1),
      mapRead: [],
      mapWrite: [v],
      calc:
        prev === null
          ? { expr: `b mod ${t.m}`, result: String(v) }
          : { expr: `${prev[0]} · ${t.A} mod ${t.m}`, result: String(v) },
      vars: mulText(),
    });
  });
  const entries = tableAfter(t.baby, t.baby.length);
  const powerMul = t.mul.power;
  mul += powerMul;
  giants[0] = 1n;
  steps.push({
    id: `T${k++}`,
    title: `stride = ${t.stride}`,
    detail: `보폭 stride = ${t.A}^${n} mod ${t.m} = ${t.stride}${을를(String(t.stride))} 반복 제곱으로 구합니다(곱셈 ${powerMul} 번). 큰 걸음은 a^0 = 1 에서 출발합니다.`,
    giants: [...giants],
    range: [0, 0],
    giantWrite: [0],
    pointer: 0,
    entries,
    mapRead: [],
    mapWrite: [],
    calc: { expr: `${t.A}^${n} mod ${t.m}`, result: String(t.stride) },
    vars: mulText(),
  });
  for (const g of t.giant) {
    mul++;
    const i = Number(g.i);
    const prev = giants[i - 1] as bigint;
    giants[i] = g.giant;
    const found = g.j !== null;
    const x = found ? g.i * n - (g.j as bigint) : null;
    steps.push({
      id: `T${k++}`,
      title: `i = ${g.i} · ${g.giant} ${found ? "①" : "②"}`,
      detail: found
        ? `giant = ${g.giant}${이가(String(g.giant))} 아기 걸음 표에 j = ${g.j} 로 있습니다. ① x = ${g.i}·${n} − ${g.j} = ${x}${을를(String(x))} 돌려줍니다.`
        : `giant = ${g.giant}${이가(String(g.giant))} 아기 걸음 표에 없습니다. ② i 를 하나 늘립니다.`,
      giants: [...giants],
      range: [0, i],
      giantWrite: [i],
      pointer: i,
      entries,
      mapRead: found ? [g.giant] : [],
      mapWrite: [],
      note: found
        ? `찾는 값 ${g.giant} · j = ${g.j}`
        : `찾는 값 ${g.giant} · 없음`,
      calc: {
        expr: `${prev} · ${t.stride} mod ${t.m}`,
        result: String(g.giant),
      },
      vars: found ? `x = ${x} · 곱셈 ${mul} 번` : mulText(),
    });
  }
  return steps;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "a^(i·n)",
  rangeLabel: "지난 큰 걸음",
};

/** 걸음 하나를 배열 무대의 걸음으로 — 칸 번호가 큰 걸음 번호 `i` 이고, 맨 아래가 아기 걸음 표다. */
function arrayStep(s: Step, slots: number): ArrayStep {
  return {
    array: s.giants.map((v) => (v === null ? null : Number(v))),
    range: s.range,
    read: [],
    write: [...s.giantWrite],
    pointers: s.pointer === undefined ? {} : { i: s.pointer },
    map: {
      keyLabel: "b·a^j",
      valueLabel: "j",
      entries: s.entries.map(([v, j]) => [Number(v), Number(j)] as const),
      slots,
      read: s.mapRead.map(Number),
      write: s.mapWrite.map(Number),
      ...(s.note === undefined ? {} : { note: s.note }),
    },
  };
}

const slotsOf = (steps: readonly Step[]): number =>
  Math.max(...steps.map((s) => s.entries.length));

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `babyStepGiantStep-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const steps = walkSteps();
  const slots = slotsOf(steps);
  return {
    walk: steps.map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...arrayStep(s, slots),
      calc: s.calc,
      vars: s.vars,
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

export interface Scale {
  /** 입력 `b = a^(m−2) mod m` — 가장 작은 해가 `m − 2` 로 구간 끝에 있다. */
  readonly b: bigint;
  readonly x: bigint;
  /** 선형 탐색의 곱셈 — 반복 구조에서 센 값(`x` 번). */
  readonly linear: bigint;
  /** 같은 입력에서 정본이 실제로 한 곱셈. */
  readonly bsgs: number;
  readonly n: bigint;
  readonly cells: number;
}

let scaleMemo: Scale | undefined;
/** 과제 규모 `m = 1,000,000,007` 에서 해가 구간 끝에 있는 입력을 넣는다. */
export function scale(): Scale {
  if (scaleMemo) return scaleMemo;
  const b = power(BIG_A, BIG_M - 2n, BIG_M);
  const t = trace(BIG_A, b, BIG_M, true);
  if (power(BIG_A, t.answer, BIG_M) !== b) throw new Error("검산이 어긋난다");
  scaleMemo = {
    b,
    x: t.answer,
    linear: linearMulByShape(BIG_A, b, BIG_M),
    bsgs: t.mul.total,
    n: t.n as bigint,
    cells: t.cells,
  };
  return scaleMemo;
}

function approaches(): Approach[] {
  const s = scale();
  return [
    {
      name: "지수를 하나씩 올려 보기",
      idea: "x = 0, 1, 2, … 에서 a^x 를 만들어 b 와 같은지 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `최악 곱셈 ${num(s.linear)} 번 · ${secondsOf(s.linear)}`,
          ok: false,
        },
      ],
      lesson: "만든 값을 버리지 않고 적어 두면 어떨까",
    },
    {
      name: "모든 a^x 를 적어 두기",
      idea: "x < m 인 a^x 를 전부 해시 맵에 적고 b 를 한 번 찾는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `적는 데만 곱셈 ${num(BIG_M)} 번 · 선형 탐색과 같다`,
          ok: false,
        },
      ],
      lesson: "지수를 둘로 갈라 한쪽만 적으면 적는 양이 줄지 않을까",
    },
    {
      name: "지수를 두 조각으로 가르기",
      idea: "x = i·n − j 로 적고 j 쪽 n 개만 적어 둔 뒤, i 를 올리며 찾는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `최악 곱셈 ${num(s.bsgs)} 번 · ${secondsOf(s.bsgs)}`,
          ok: true,
        },
        {
          label: "메모리",
          value: `아기 걸음 표 ${num(s.cells)} 칸`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 조각 ───────────────────────── */

/** 지수 격자 — 큰 걸음 `i` 한 줄에 `x = (i−1)·n + 1 … i·n`, 열은 `j = n−1 … 0`. */
function gridRows(n: number, m: number, mark: number): StageRow[] {
  const rows: StageRow[] = [
    {
      kind: "index",
      label: "j",
      labels: Array.from({ length: n }, (_, c) => n - 1 - c),
    },
  ];
  for (let i = 1; i <= n; i++) {
    const values = Array.from({ length: n }, (_, c) => (i - 1) * n + 1 + c);
    const states: Partial<Record<number, CellState>> = {};
    values.forEach((x, c) => {
      if (x >= m) states[c] = "out";
      if (x === mark) states[c] = "focus";
    });
    const over = values.filter((x) => x >= m).length;
    rows.push({
      kind: "cells",
      label: `i = ${i}`,
      values,
      states,
      side:
        over > 0
          ? `x ≥ ${m} 인 칸 ${over} 개`
          : `x = ${values[0]} … ${values.at(-1)}`,
    });
  }
  return rows;
}

const babyRows = (t: Trace): StageRow[] => [
  { kind: "index", label: "j" },
  {
    kind: "cells",
    label: "b·a^j",
    values: t.baby.map(([v]) => Number(v)),
  },
];

export const FIGS: Record<string, () => ReactElement> = {
  "concept-grid": () => {
    const t = trace(WALK.a, WALK.b, WALK.m);
    const n = Number(t.n);
    return (
      <CellStage
        title={`지수 x 를 큰 걸음 i 줄 · 아기 걸음 j 칸에 놓는다 — x = i·n − j, n = ${n}`}
        rows={gridRows(n, Number(WALK.m), Number(t.answer))}
        columns={n}
      />
    );
  },
  "concept-table": () => {
    const t = trace(WALK.a, WALK.b, WALK.m);
    const hit = t.giant.find((g) => g.j !== null) as Giant;
    return (
      <CellStage
        title={`아기 걸음 표 — b·a^j 를 키로, j 를 값으로 적는다 (a = ${WALK.a}, b = ${WALK.b}, m = ${WALK.m})`}
        rows={[
          ...babyRows(t),
          ...keyValueRows({
            keyLabel: "키 b·a^j",
            valueLabel: "값 j",
            entries: tableAfter(t.baby, t.baby.length).map(
              ([v, j]) => [Number(v), Number(j)] as const,
            ),
            read: [Number(hit.giant)],
            note: `큰 걸음 i = ${hit.i} 가 내민 ${hit.giant} → j = ${hit.j}`,
          }),
        ]}
        columns={Number(t.n)}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`m = ${num(BIG_M)} · a = ${BIG_A} · 해가 구간 끝에 있는 입력 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-dup": () => {
    const t = trace(DUP.a, DUP.b, DUP.m);
    const dupKeys = t.baby
      .map(([v]) => v)
      .filter((v, i, xs) => xs.indexOf(v) !== i);
    const states: Partial<Record<number, CellState>> = {};
    t.baby.forEach(([v], i) => {
      if (dupKeys.includes(v)) states[i] = "read";
    });
    const final = tableAfter(t.baby, t.baby.length);
    return (
      <CellStage
        title={`같은 값이 다시 나오면 j 를 덮어쓴다 — a = ${DUP.a}, b = ${DUP.b}, m = ${DUP.m}, n = ${t.n}`}
        rows={[
          { kind: "index", label: "j" },
          {
            kind: "cells",
            label: "b·a^j",
            values: t.baby.map(([v]) => Number(v)),
            states,
          },
          { kind: "caret", cells: Object.keys(states).map(Number) },
          ...keyValueRows({
            keyLabel: "키 b·a^j",
            valueLabel: "값 j",
            entries: final.map(([v, j]) => [Number(v), Number(j)] as const),
            write: dupKeys.map(Number),
            note: dupKeys
              .map(
                (v) =>
                  `키 ${v} 는 j = ${t.baby
                    .filter(([w]) => w === v)
                    .map(([, j]) => j)
                    .join(" → ")}`,
              )
              .join(" · "),
          }),
        ]}
        columns={Number(t.n)}
      />
    );
  },
  "walk-trace": () => {
    const steps = walkSteps();
    const slots = slotsOf(steps);
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.calc.expr} = ${s.calc.result}`,
      rows: arrayStage(arrayStep(s, slots), ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`babyStepGiantStep(${WALK.a}n, ${WALK.b}n, ${WALK.m}n) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(steps[0] as Step, slots))}
        frames={frames}
      />
    );
  },
  "related-meet": () => {
    const t = trace(WALK.a, WALK.b, WALK.m);
    const n = Number(t.n);
    const stride = t.stride as bigint;
    // 큰 걸음 줄은 i = 1 … n 전부를 그린다 — 정본은 i = 2 에서 멈췄으므로 남은 값은 보폭을 곱해 잇는다.
    const giants: number[] = [];
    let g = 1n;
    for (let i = 1; i <= n; i++) {
      g = (g * stride) % WALK.m;
      giants.push(Number(g));
    }
    const hit = t.giant.find((x) => x.j !== null) as Giant;
    if (giants[Number(hit.i) - 1] !== Number(hit.giant)) {
      throw new Error("큰 걸음 줄이 정본의 기록과 다르다");
    }
    const babies = t.baby.map(([v]) => Number(v));
    const meet = Number(hit.giant);
    return (
      <CellStage
        title={`두 쪽에서 n = ${n} 개씩 만든 값이 ${meet} 에서 만난다`}
        rows={[
          {
            kind: "index",
            label: "i",
            labels: Array.from({ length: n }, (_, c) => c + 1),
          },
          {
            kind: "cells",
            label: "a^(i·n)",
            values: giants,
            states: { [Number(hit.i) - 1]: "focus" },
            side: "큰 걸음 쪽",
          },
          {
            kind: "cells",
            label: "b·a^j",
            values: babies,
            states: { [Number(hit.j)]: "focus" },
            side: "아기 걸음 쪽",
          },
          {
            kind: "index",
            label: "j",
          },
        ]}
        columns={n}
      />
    );
  },
  "invariant-blocks": () => {
    const t = trace(WALK.a, WALK.b, WALK.m);
    const n = Number(t.n);
    const hit = t.giant.find((g) => g.j !== null) as Giant;
    const last = Number(hit.i);
    const rows: StageRow[] = [
      {
        kind: "index",
        label: "j",
        labels: Array.from({ length: n }, (_, c) => n - 1 - c),
      },
    ];
    for (let i = 1; i <= last; i++) {
      const values = Array.from({ length: n }, (_, c) => (i - 1) * n + 1 + c);
      const states: Partial<Record<number, CellState>> = {};
      values.forEach((x, c) => {
        if (i < last) states[c] = "out";
        if (x === Number(t.answer)) states[c] = "focus";
      });
      rows.push({
        kind: "cells",
        label: `i = ${i}`,
        values,
        states,
        side:
          i < last
            ? `giant ${t.giant[i - 1]?.giant} 없음 → 해 없음`
            : `giant ${hit.giant} → j = ${hit.j}`,
      });
    }
    return (
      <CellStage
        title="큰 걸음 하나가 x 를 n 칸씩 통째로 확인한다 — 먼저 끝난 줄에는 해가 없다"
        rows={rows}
        columns={n}
      />
    );
  },
};
