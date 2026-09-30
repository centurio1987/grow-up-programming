/**
 * `binomialModP-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 정본 소스의 네 자리에 기록을 끼운 계측
 * 사본을 기계로 만들고(`loadMutant` — 줄 하나에 맞지 않으면 던진다), 그 기록으로 호출마다의 `n` · `k`,
 * 반복마다의 `num` · `den`, 역원 거듭제곱의 바퀴마다의 `e` · `b` · `inv` 를 얻는다. 걸음 재생 패널의 걸음
 * (`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `binomialModP-guide.test.ts` 가 잰다.
 *
 * **자리의 좌우.** number-theory 편 `fastPower` 의 약속을 따른다. 정적 그림(`CellStage`)은 `p` 진 표기처럼
 * 높은 자리를 왼쪽에 두고 인덱스 줄에 자리 번호를 적는다. 걸음 재생 패널의 배열 무대는 칸 번호가 곧 자리
 * 번호라 칸 `i` 가 자리 `i` 이고, 그래서 표기와 좌우가 거꾸로다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
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
import {
  type ArrayLayer,
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { binomialModP } from "./binomialModP-guide.ref.ts";

const REF = new URL("./binomialModP-guide.ref.ts", import.meta.url).pathname;

type Ref = { binomialModP(n: bigint, k: bigint, p: bigint): bigint };

/* ───────────────────────── 정본 계측 ───────────────────────── */

interface Tape {
  calls: { n: bigint; k: bigint }[];
  loop: { n: bigint; k: bigint; i: bigint; num: bigint; den: bigint }[];
  inv: { n: bigint; k: bigint; e: bigint; b: bigint; inv: bigint }[];
  end: {
    n: bigint;
    k: bigint;
    j: bigint;
    num: bigint;
    den: bigint;
    inv: bigint;
  }[];
}

const tape = (): Tape => (globalThis as unknown as { __bmp: Tape }).__bmp;

/** 호출마다 — 경계를 거르는 첫 줄 앞에서 그 호출의 `n` · `k` 를 적는다. */
const probedCalls = await loadMutant<Ref>(REF, {
  swap: [
    /^(\s*)if \(k < 0n \|\| k > n\) return 0n;$/,
    "$1(globalThis as any).__bmp.calls.push({ n, k });\n$&",
  ],
});

/** 반복마다 — 분모를 곱한 직후의 `num` · `den` 을 적는다. */
const probedLoop = await loadMutant<Ref>(REF, {
  swap: [
    /^(\s*)den = \(den \* \(i \+ 1n\)\) % p;$/,
    "$&\n$1(globalThis as any).__bmp.loop.push({ n, k, i, num, den });",
  ],
});

/** 역원 거듭제곱의 바퀴마다 — 지수를 한 칸 옮기기 직전의 `e` · `b` · `inv` 를 적는다. */
const probedInv = await loadMutant<Ref>(REF, {
  swap: [
    /^(\s*)e >>= 1n;$/,
    "$1(globalThis as any).__bmp.inv.push({ n, k, e, b, inv });\n$&",
  ],
});

/** 자리 하나를 끝낼 때 — 역원을 곱해 돌려주기 직전의 `j` · `num` · `den` · `inv` 를 적는다. */
const probedEnd = await loadMutant<Ref>(REF, {
  swap: [
    /^(\s*)return \(num \* inv\) % p;$/,
    "$1(globalThis as any).__bmp.end.push({ n, k, j, num, den, inv });\n$&",
  ],
});

/** 계측 사본 넷을 같은 입력에 한 번씩 부르고, 네 답이 정본과 같은지 확인한 뒤 기록을 돌려준다. */
function record(n: bigint, k: bigint, p: bigint): Tape {
  const g = globalThis as unknown as { __bmp: Tape };
  g.__bmp = { calls: [], loop: [], inv: [], end: [] };
  const want = binomialModP(n, k, p);
  for (const m of [probedCalls, probedLoop, probedInv, probedEnd]) {
    const got = m.binomialModP(n, k, p);
    if (got !== want) {
      throw new Error(`계측 사본이 정본과 다른 답을 냈다 — ${got} ≠ ${want}`);
    }
  }
  return tape();
}

/** 역원 거듭제곱의 바퀴 하나 — `fastPower` 편의 바퀴와 같은 모양이다. */
export interface InvRound {
  /** 바퀴를 시작할 때의 남은 지수. */
  readonly e: bigint;
  /** 이번에 읽은 비트. */
  readonly bit: 0 | 1;
  /** 바퀴를 시작할 때의 밑. */
  readonly bIn: bigint;
  /** 누적 뒤 `inv`. */
  readonly inv: bigint;
  /** 제곱 뒤 밑. */
  readonly bOut: bigint;
}

/** 호출 하나. `n ≥ p` 면 자리를 떼는 호출이고, 아니면 자리 하나를 푸는 호출이다. */
export type Call =
  | {
      readonly kind: "split";
      readonly n: bigint;
      readonly k: bigint;
      /** 떼어 낸 가장 낮은 자리의 호출. */
      readonly low: Call;
      /** 남은 자리의 호출. */
      readonly high: Call;
      readonly value: bigint;
      /** 이 호출이 맡는 가장 낮은 자리의 번호. */
      readonly place: number;
    }
  | {
      readonly kind: "edge";
      readonly n: bigint;
      readonly k: bigint;
      /** 어느 경계에 걸렸는가 — 범위 밖이면 0, 양 끝이면 1 을 돌려준다. */
      readonly edge: "out" | "zero" | "full";
      readonly value: bigint;
      readonly place: number;
    }
  | {
      readonly kind: "loop";
      readonly n: bigint;
      readonly k: bigint;
      readonly j: bigint;
      /** 반복마다 곱한 뒤의 `num` · `den`. */
      readonly rounds: readonly {
        readonly i: bigint;
        readonly num: bigint;
        readonly den: bigint;
      }[];
      readonly num: bigint;
      readonly den: bigint;
      readonly inv: bigint;
      readonly invRounds: readonly InvRound[];
      readonly value: bigint;
      readonly place: number;
    };

export interface Trace {
  readonly n: bigint;
  readonly k: bigint;
  readonly p: bigint;
  readonly root: Call;
  readonly answer: bigint;
  /** 호출을 들어간 순서로. */
  readonly order: readonly Call[];
  /** 자리 번호마다 그 자리를 푼 호출(낮은 자리부터). */
  readonly digits: readonly Call[];
}

/**
 * 정본 한 번 호출의 기록을 호출 나무로 묶는다. 호출이 들어간 순서가 곧 정본의 재귀 순서다 — 자리를 떼는
 * 호출 다음에 낮은 자리의 호출이, 그다음에 남은 자리의 호출이 온다. 호출마다의 답은 정본에 다시 묻고,
 * 반복 기록과 역원 기록은 같은 `(n, k)` 의 것을 들어간 순서대로 붙인다. 어긋나면 던진다.
 */
export function trace(n: bigint, k: bigint, p: bigint): Trace {
  const t = record(n, k, p);
  const order: Call[] = [];
  const digits: Call[] = [];
  let at = 0;
  let loopAt = 0;
  let invAt = 0;
  let endAt = 0;
  const same = (a: { n: bigint; k: bigint }, b: bigint, c: bigint) =>
    a.n === b && a.k === c;
  const build = (place: number): Call => {
    const c = t.calls[at++];
    if (c === undefined) throw new Error("호출 기록이 모자란다");
    const value = binomialModP(c.n, c.k, p);
    if (c.k < 0n || c.k > c.n || c.k === 0n || c.k === c.n) {
      const edge = c.k < 0n || c.k > c.n ? "out" : c.k === 0n ? "zero" : "full";
      const call: Call = { kind: "edge", n: c.n, k: c.k, edge, value, place };
      order.push(call);
      digits[place] = call;
      return call;
    }
    if (c.n >= p) {
      const slot = order.length;
      order.push(undefined as unknown as Call);
      const low = build(place);
      const high = build(place + 1);
      if ((low.value * high.value) % p !== value) {
        throw new Error("두 자리의 답을 곱한 값이 정본과 다르다");
      }
      const call: Call = {
        kind: "split",
        n: c.n,
        k: c.k,
        low,
        high,
        value,
        place,
      };
      order[slot] = call;
      return call;
    }
    const rounds: { i: bigint; num: bigint; den: bigint }[] = [];
    while (loopAt < t.loop.length) {
      const r = t.loop[loopAt] as Tape["loop"][number];
      if (!same(r, c.n, c.k)) break;
      rounds.push({ i: r.i, num: r.num, den: r.den });
      loopAt++;
    }
    const invRounds: InvRound[] = [];
    const end = t.end[endAt++];
    if (end === undefined || !same(end, c.n, c.k)) {
      throw new Error("자리를 끝내는 기록이 호출과 짝이 맞지 않는다");
    }
    let bIn = end.den;
    let acc = 1n;
    while (invAt < t.inv.length) {
      const r = t.inv[invAt] as Tape["inv"][number];
      if (!same(r, c.n, c.k)) break;
      const bit = (r.e & 1n) === 1n ? 1 : 0;
      if (r.b !== (bIn * bIn) % p)
        throw new Error("역원 바퀴의 밑이 이어지지 않는다");
      const want = bit === 1 ? (acc * bIn) % p : acc;
      if (r.inv !== want) throw new Error("역원 바퀴의 누적이 어긋난다");
      invRounds.push({ e: r.e, bit, bIn, inv: r.inv, bOut: r.b });
      acc = r.inv;
      bIn = r.b;
      invAt++;
    }
    if (acc !== end.inv) throw new Error("역원 바퀴의 끝이 기록과 다르다");
    if ((end.num * end.inv) % p !== value) {
      throw new Error("num · inv 가 정본의 답과 다르다");
    }
    if (BigInt(rounds.length) !== end.j)
      throw new Error("반복 횟수가 j 와 다르다");
    const call: Call = {
      kind: "loop",
      n: c.n,
      k: c.k,
      j: end.j,
      rounds,
      num: end.num,
      den: end.den,
      inv: end.inv,
      invRounds,
      value,
      place,
    };
    order.push(call);
    digits[place] = call;
    return call;
  };
  const root = build(0);
  if (at !== t.calls.length) throw new Error("쓰이지 않은 호출 기록이 있다");
  if (loopAt !== t.loop.length || invAt !== t.inv.length) {
    throw new Error("쓰이지 않은 반복 기록이 있다");
  }
  return { n, k, p, root, answer: root.value, order, digits };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK_N = 34n;
export const WALK_K = 20n;
export const WALK_P = 7n;

/** 과제 규모 — `n` 의 상한과 기본 법. */
export const LIMIT_N = 100_000n;
export const BIG_P = 1_000_000_007n;

export const num = (n: number | bigint): string => n.toLocaleString("en-US");

/** `p` 진 자릿수를 낮은 자리부터. 0 이면 자리 하나 `[0]` 이다. */
export function digitsOf(v: bigint, p: bigint): bigint[] {
  const out: bigint[] = [];
  let x = v;
  while (x > 0n) {
    out.push(x % p);
    x /= p;
  }
  return out.length > 0 ? out : [0n];
}

/** 정의대로의 이항 계수 — 나머지를 쓰지 않고 큰 정수로 그대로 계산한다. */
export function exactBinomial(n: bigint, k: bigint): bigint {
  if (k < 0n || k > n) return 0n;
  const j = n - k < k ? n - k : k;
  let r = 1n;
  for (let i = 0n; i < j; i++) r = (r * (n - i)) / (i + 1n);
  return r;
}

/** 곱해서 법으로 줄이면 1 이 되는 수를 1 부터 차례로 찾는다. 없으면 `null`. */
export function inverseBySearch(a: bigint, p: bigint): bigint | null {
  for (let x = 1n; x < p; x++) if ((a * x) % p === 1n) return x;
  return null;
}

/** 이진 거듭제곱의 모듈러 곱셈 수 — 지수 `p − 2` 의 비트 수와 1 인 비트 수의 합(`fastPower` 편). */
export function fermatMults(p: bigint): number {
  let e = p - 2n;
  let m = 0;
  while (e > 0n) {
    if ((e & 1n) === 1n) m++;
    m++;
    e >>= 1n;
  }
  return m;
}

/**
 * 한 번의 호출이 한 모듈러 곱셈 수 — 반복 한 번에 둘(`num` · `den`), 역원 거듭제곱의 바퀴마다 하나나 둘
 * (`fastPower` 편의 셈과 같다), 자리를 끝내는 곱셈 하나, 두 자리의 답을 잇는 곱셈 하나다.
 */
export function multsOf(t: Trace): number {
  let m = 0;
  for (const c of t.order) {
    if (c.kind === "split") m += 1;
    if (c.kind === "loop") {
      m += 2 * c.rounds.length + 1;
      for (const r of c.invRounds) m += 1 + r.bit;
    }
  }
  return m;
}

let walkMemo: Trace | undefined;
/** 전개 입력의 기록. 그림 · 증명 · 패널이 같은 기록을 쓴다. */
export const walk = (): Trace => {
  walkMemo ??= trace(WALK_N, WALK_K, WALK_P);
  return walkMemo;
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
  arrayName: "n 의 자리",
  rangeLabel: "푸는 자리",
};

const s = (v: bigint | number): string => String(v);

/**
 * 전개 입력의 걸음. 호출 나무를 정본이 들어간 순서로 걷는다 — 자리를 떼는 호출은 들어갈 때 한 걸음 ·
 * 두 자리의 답을 곱할 때 한 걸음, 경계로 끝나는 호출은 한 걸음, 반복하는 호출은 `j` 를 정하는 걸음 ·
 * 반복마다 한 걸음 · 역원을 곱하는 한 걸음이다.
 *
 * 무대는 `n` 의 `p` 진 자릿수를 자리마다 한 칸에 둔다(칸 `i` 가 자리 `i`). 괄호 「푸는 자리」가 지금 호출이
 * 맡은 자리들이고, 그 아래 다섯 줄이 이 알고리즘이 자리마다 쌓는 값이다 — `k` 의 자릿수, 반복이 모은
 * `num` · `den`, 역원 `inv`, 그 자리의 답. 경계로 끝나 반복하지 않은 자리의 `num` · `den` · `inv` 는 「—」다.
 */
export function walkSteps(t: Trace = walk()): Step[] {
  const d = t.digits.length;
  const p = t.p;
  const nDigits = digitsOf(t.n, p);
  const kDigits = digitsOf(t.k, p);
  const kRow: (string | null)[] = Array.from({ length: d }, (_, i) =>
    s(kDigits[i] ?? 0n),
  );
  const numRow: (string | null)[] = Array.from({ length: d }, () => null);
  const denRow: (string | null)[] = Array.from({ length: d }, () => null);
  const invRow: (string | null)[] = Array.from({ length: d }, () => null);
  const ansRow: (string | null)[] = Array.from({ length: d }, () => null);
  let mults = 0;
  const steps: Step[] = [];
  const layers = (
    read: Partial<Record<"k" | "num" | "den" | "inv" | "ans", number[]>>,
    write: Partial<Record<"k" | "num" | "den" | "inv" | "ans", number[]>>,
  ): ArrayLayer[] => [
    { name: "k 의 자리", values: [...kRow], read: read.k, write: write.k },
    { name: "num", values: [...numRow], read: read.num, write: write.num },
    { name: "den", values: [...denRow], read: read.den, write: write.den },
    { name: "inv", values: [...invRow], read: read.inv, write: write.inv },
    {
      name: "자리의 답",
      values: [...ansRow],
      read: read.ans,
      write: write.ans,
    },
  ];
  const clean = (l: ArrayLayer[]): ArrayLayer[] =>
    l.map((x) => {
      const out: {
        name: string;
        values: readonly (string | number | null)[];
        read?: readonly number[];
        write?: readonly number[];
      } = { name: x.name, values: x.values };
      if (x.read !== undefined) out.read = x.read;
      if (x.write !== undefined) out.write = x.write;
      return out;
    });
  const push = (
    title: string,
    detail: string,
    stage: Omit<ArrayStep, "array" | "layers"> & {
      read?: number[];
      lr?: Partial<Record<"k" | "num" | "den" | "inv" | "ans", number[]>>;
      lw?: Partial<Record<"k" | "num" | "den" | "inv" | "ans", number[]>>;
    },
  ) => {
    const { lr, lw, ...rest } = stage;
    steps.push({
      id: `T${steps.length + 1}`,
      title,
      detail,
      stage: {
        array: nDigits.map((v) => Number(v)),
        ...rest,
        vars: `모듈러 곱셈 ${mults}`,
        layers: clean(layers(lr ?? {}, lw ?? {})),
      },
    });
  };
  const walkCall = (c: Call): void => {
    const range: [number, number] =
      c.kind === "split" ? [c.place, d - 1] : [c.place, c.place];
    if (c.kind === "split") {
      const lo = c.low;
      const hi = c.high;
      push(
        `자리 ${c.place}${을를(s(c.place))} 떼어 낸다`,
        `n = ${c.n}${이가(s(c.n))} p = ${p} 이상이라 자리를 가릅니다. ${c.n} = ${c.n / p} · ${p} + ${c.n % p}, ${c.k} = ${c.k / p} · ${p} + ${c.k % p} 이라, 가장 낮은 자리는 (${lo.n}, ${lo.k}) 이고 남은 자리는 (${hi.n}, ${hi.k}) 입니다.`,
        {
          range,
          read: [c.place],
          pointers: {},
          calc: {
            expr: `${c.n} % ${p} · ${c.k} % ${p}`,
            result: `(${lo.n}, ${lo.k})`,
          },
          lr: { k: [c.place] },
        },
      );
      walkCall(lo);
      walkCall(hi);
      mults += 1;
      push(
        "두 자리의 답을 곱한다",
        `낮은 자리의 답 ${lo.value}${과와(s(lo.value))} 남은 자리의 답 ${hi.value}${을를(s(hi.value))} 곱해 법 ${p}${으로(s(p))} 줄입니다. ${c.value}${이가(s(c.value))} C(${c.n}, ${c.k}) 를 ${p}${으로(s(p))} 나눈 나머지입니다.`,
        {
          range,
          read: [],
          pointers: {},
          calc: {
            expr: `${lo.value} · ${hi.value} mod ${p}`,
            result: `${c.value}`,
          },
          lr: {
            ans: Array.from({ length: d - c.place }, (_, i) => c.place + i),
          },
        },
      );
      return;
    }
    if (c.kind === "edge") {
      numRow[c.place] = "—";
      denRow[c.place] = "—";
      invRow[c.place] = "—";
      ansRow[c.place] = s(c.value);
      const cond =
        c.edge === "out"
          ? `k = ${c.k}${이가(s(c.k))} 0 과 n = ${c.n} 사이 밖이라`
          : c.edge === "zero"
            ? "k === 0 이 참이라"
            : `k === n 이 참이라(${c.k} = ${c.n})`;
      push(
        `자리 ${c.place} · 경계`,
        `이 자리는 (${c.n}, ${c.k}) 입니다. ${cond} 반복에 들어가지 않고 ${c.value}${을를(s(c.value))} 돌려줍니다.`,
        {
          range,
          read: [c.place],
          pointers: {},
          calc: {
            expr:
              c.edge === "out"
                ? `${c.k} > ${c.n}`
                : c.edge === "zero"
                  ? "k === 0"
                  : `${c.k} === ${c.n}`,
            result: `${c.value} 반환`,
          },
          lr: { k: [c.place] },
          lw: {
            num: [c.place],
            den: [c.place],
            inv: [c.place],
            ans: [c.place],
          },
        },
      );
      return;
    }
    numRow[c.place] = "1";
    denRow[c.place] = "1";
    push(
      `자리 ${c.place} · j 를 정한다`,
      `이 자리는 (${c.n}, ${c.k}) 입니다. n = ${c.n}${이가(s(c.n))} p = ${p} 보다 작아 반복으로 갑니다. n − k = ${c.n - c.k}${과와(s(c.n - c.k))} k = ${c.k} 중 작은 쪽이 ${c.j} 라 반복을 ${c.j} 번 합니다. num 과 den 을 1 에서 시작합니다.`,
      {
        range,
        read: [c.place],
        pointers: {},
        calc: {
          expr: `min(${c.n} − ${c.k}, ${c.k})`,
          result: `j = ${c.j}`,
        },
        lr: { k: [c.place] },
        lw: { num: [c.place], den: [c.place] },
      },
    );
    let prevNum = 1n;
    let prevDen = 1n;
    for (const r of c.rounds) {
      numRow[c.place] = s(r.num);
      denRow[c.place] = s(r.den);
      mults += 2;
      push(
        `자리 ${c.place} · 반복 i = ${r.i}`,
        `num 에 n − i = ${c.n - r.i}${을를(s(c.n - r.i))} 곱해 법으로 줄이면 ${r.num} 이고, den 에 i + 1 = ${r.i + 1n}${을를(s(r.i + 1n))} 곱해 줄이면 ${r.den} 입니다.`,
        {
          range,
          read: [c.place],
          pointers: {},
          calc: {
            expr: `${prevNum} · ${c.n - r.i} mod ${p} · ${prevDen} · ${r.i + 1n} mod ${p}`,
            result: `num = ${r.num} · den = ${r.den}`,
          },
          lw: { num: [c.place], den: [c.place] },
        },
      );
      prevNum = r.num;
      prevDen = r.den;
    }
    invRow[c.place] = s(c.inv);
    ansRow[c.place] = s(c.value);
    mults += c.invRounds.reduce((m, r) => m + 1 + r.bit, 0) + 1;
    push(
      `자리 ${c.place} · 역원을 곱한다`,
      `den = ${c.den} 의 역원을 이진 거듭제곱으로 ${c.den}^${p - 2n} mod ${p} 로 구하면 ${c.inv} 입니다. ${c.den} · ${c.inv} mod ${p} = ${(c.den * c.inv) % p} 이고, 이 자리의 답은 ${c.num} · ${c.inv} mod ${p} = ${c.value} 입니다.`,
      {
        range,
        read: [c.place],
        pointers: {},
        calc: {
          expr: `${c.den}^${p - 2n} mod ${p} = ${c.inv} · ${c.num} · ${c.inv} mod ${p}`,
          result: `${c.value}`,
        },
        lr: { num: [c.place], den: [c.place] },
        lw: { inv: [c.place], ans: [c.place] },
      },
    );
  };
  walkCall(t.root);
  return steps;
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `binomialModP-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    lucasWalk: walkSteps().map((st) => ({
      title: `${st.id} ${st.title}`,
      text: st.detail,
      ...st.stage,
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

/** 나머지로 줄여 모은 `num` · `den` 과 둘의 정수 나눗셈 몫. 반복만 하고 역원은 안 쓴다. */
export function divideInstead(
  n: bigint,
  k: bigint,
  p: bigint,
): { num: bigint; den: bigint; value: bigint | null } {
  const j = n - k < k ? n - k : k;
  let numAcc = 1n;
  let den = 1n;
  for (let i = 0n; i < j; i++) {
    numAcc = (numAcc * (n - i)) % p;
    den = (den * (i + 1n)) % p;
  }
  return { num: numAcc, den, value: den === 0n ? null : (numAcc / den) % p };
}

/** 자리를 안 떼고 역원 곱셈만 하는 판 — 정본의 자릿수 분기를 걷어 낸 변이로 만든다. */
export const noSplit = await loadMutant<Ref>(REF, {
  swap: [/^ {2}if \(n >= p\) \{$/, "  if (false) {"],
});

/** `n = 100,000` 의 정의대로 값의 십진 자릿수 — 값을 만들지 않고 로그 합으로 센다. */
export function binomialDigits(n: number, k: number): number {
  const j = Math.min(k, n - k);
  let acc = 0;
  for (let i = 0; i < j; i++) acc += Math.log10(n - i) - Math.log10(i + 1);
  return Math.floor(acc) + 1;
}

function approaches(): Approach[] {
  const t = walk();
  const big = Number(LIMIT_N);
  const div = divideInstead(4n, 2n, WALK_P);
  const lucasC = [15n, 7n, 7n] as const;
  const plain = noSplit.binomialModP(...lucasC);
  const truth = binomialModP(...lucasC);
  return [
    {
      name: "정의대로 큰 정수로 계산하기",
      idea: "C(n, k) 를 큰 정수 그대로 만든 뒤 마지막에 p 로 나눈 나머지를 낸다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "크기",
          value: `n = ${num(big)} 이면 C(n, n/2) 가 ${num(binomialDigits(big, big / 2))} 자리`,
          ok: false,
        },
      ],
      lesson:
        "곱할 때마다 나머지만 남기면 중간값이 늘 p 미만이다 — 나눗셈만 남는다",
    },
    {
      name: "나머지로 줄이고 정수로 나누기",
      idea: "num · den 을 법 안에서 모은 뒤 num / den 을 정수 나눗셈으로 구한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `C(4, 2) mod 7 에서 ${div.num} / ${div.den} = ${div.value} · 참값은 ${binomialModP(4n, 2n, WALK_P)}`,
          ok: false,
        },
      ],
      lesson:
        "나머지는 나누어떨어짐을 지킨다는 보장이 없다 — 나누는 대신 곱해서 1 이 되는 수를 곱한다",
    },
    {
      name: "역원 곱하기 · 자리를 안 가르기",
      idea: "den 의 모듈러 역원을 num 에 곱한다",
      verdict: "drop",
      checks: [
        {
          label: "n 이 p 미만",
          value: "C(4, 2) mod 7 에서 6 · 맞다",
          ok: true,
        },
        {
          label: "n ≥ p",
          value: `C(15, 7) mod 7 에서 ${plain} · 참값은 ${truth}`,
          ok: false,
        },
      ],
      lesson:
        "n ≥ p 면 인수에 p 의 배수가 들어가 den 이 0 이 된다 — 0 에는 역원이 없다",
    },
    {
      name: "뤼카 정리와 페르마 역원",
      idea: "n · k 를 p 진 자릿수로 갈라 자리마다 역원으로 구하고 곱한다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `C(15, 7) mod 7 에서 ${truth} · C(34, 20) mod 7 에서 ${t.answer}`,
          ok: true,
        },
        {
          label: "크기",
          value: "들고 있는 값이 늘 p 미만",
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 정적 그림의 격자 ───────────────────────── */

/** 정적 그림의 인덱스 줄 — 자리 번호를 높은 것부터 적는다(칸 `c` 가 자리 `w − 1 − c`). */
const indexRow = (w: number): StageRow => ({
  kind: "index",
  label: "자리",
  labels: Array.from({ length: w }, (_, c) => w - 1 - c),
});

/** 낮은 자리부터의 배열을 정적 그림의 칸 순서(높은 자리부터)로 뒤집는다. */
const high = <T,>(low: readonly T[]): T[] => [...low].reverse();

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  /** 전체 컨셉 — 7 진 자릿수마다 이항 계수를 구해 곱하면 답이다. */
  "concept-digits": () => {
    const t = walk();
    const w = t.digits.length;
    const nd = digitsOf(t.n, t.p);
    const kd = digitsOf(t.k, t.p);
    const per = t.digits.map((c) => c.value);
    return (
      <CellStage
        title={`C(${t.n}, ${t.k}) mod ${t.p} = ${t.answer} — ${t.p} 진 자릿수마다 이항 계수를 구해 곱한다`}
        columns={w}
        rows={[
          indexRow(w),
          {
            kind: "cells",
            label: `n = ${t.n}`,
            values: high(nd.map(s)),
            side: `${high(nd).join("")} (${t.p} 진)`,
          },
          {
            kind: "cells",
            label: `k = ${t.k}`,
            values: high(kd.map(s)),
            side: `${high(kd).join("")} (${t.p} 진)`,
          },
          {
            kind: "cells",
            label: "C(n_i, k_i)",
            values: high(per.map(s)),
            side: `곱 ${per.join(" · ")} mod ${t.p} = ${t.answer}`,
          },
        ]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`n ≤ ${num(LIMIT_N)} · 법은 소수 · 답은 C(n, k) mod p`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  /** 먼저 알아 둘 개념 — 법 7 에서 1 부터 6 까지의 역원. */
  "build-inverse": () => {
    const p = WALK_P;
    const as = Array.from({ length: Number(p) - 1 }, (_, i) => BigInt(i + 1));
    const inv = as.map((a) => inverseBySearch(a, p) ?? 0n);
    const pick = 1; // a = 2
    return (
      <CellStage
        title={`법 ${p} 의 모듈러 역원 — 곱해서 ${p} 로 나눈 나머지가 1 이 되는 짝`}
        columns={as.length}
        rows={[
          {
            kind: "cells",
            label: "a",
            values: as.map(s),
            states: { [pick]: "read" },
          },
          {
            kind: "cells",
            label: "a 의 역원",
            values: inv.map(s),
            states: { [pick]: "read" },
          },
          {
            kind: "caret",
            cells: [pick],
            side: `${as[pick]} · ${inv[pick]} = ${(as[pick] as bigint) * (inv[pick] as bigint)}`,
          },
          {
            kind: "cells",
            label: "a · 역원",
            values: as.map((a, i) => s(a * (inv[i] as bigint))),
          },
          {
            kind: "cells",
            label: `mod ${p}`,
            values: as.map((a, i) => s((a * (inv[i] as bigint)) % p)),
            side: "여섯 칸 모두 1",
          },
        ]}
      />
    );
  },
  /** 먼저 알아 둘 개념 — 7 진 자릿수 한 자리가 입력의 어느 몫을 맡는가. */
  "build-digits": () => {
    const t = walk();
    const w = t.digits.length;
    const nd = digitsOf(t.n, t.p);
    const kd = digitsOf(t.k, t.p);
    const place = high(
      Array.from({ length: w }, (_, i) => s(t.p ** BigInt(i))),
    );
    const nPart = high(nd.map((v, i) => s(v * t.p ** BigInt(i))));
    const kPart = high(kd.map((v, i) => s(v * t.p ** BigInt(i))));
    return (
      <CellStage
        title={`${t.n} 과 ${t.k} 를 ${t.p} 진 자릿수로 — 자리 i 의 값은 늘 ${t.p} 미만이다`}
        columns={w}
        rows={[
          indexRow(w),
          { kind: "cells", label: "자리의 크기 7^i", values: place },
          {
            kind: "cells",
            label: "n 의 자리",
            values: high(nd.map(s)),
            states: { 0: "read" },
          },
          {
            kind: "cells",
            label: "몫",
            values: nPart,
            side: `${nPart.join(" + ")} = ${t.n}`,
          },
          {
            kind: "cells",
            label: "k 의 자리",
            values: high(kd.map(s)),
            states: { 0: "read" },
          },
          {
            kind: "cells",
            label: "몫",
            values: kPart,
            side: `${kPart.join(" + ")} = ${t.k}`,
          },
        ]}
      />
    );
  },
  /** 먼저 알아 둘 개념 — 자리를 안 가르면 인수에 7 의 배수가 들고, 가르면 안 든다. */
  "build-factors": () => {
    const t = walk();
    const p = t.p;
    const j = t.n - t.k < t.k ? t.n - t.k : t.k;
    const numF = Array.from({ length: Number(j) }, (_, i) => t.n - BigInt(i));
    const denF = Array.from({ length: Number(j) }, (_, i) => BigInt(i + 1));
    const mark = (xs: bigint[]) => {
      const st: Partial<Record<number, CellState>> = {};
      xs.forEach((x, i) => {
        if (x % p === 0n) st[i] = "read";
      });
      return st;
    };
    const loopDigit = t.digits.find((c) => c.kind === "loop");
    if (loopDigit?.kind !== "loop") throw new Error("반복하는 자리가 없다");
    const dn = loopDigit.rounds.map((r) => s(loopDigit.n - r.i));
    const dd = loopDigit.rounds.map((r) => s(r.i + 1n));
    const multiples = (xs: bigint[]) =>
      xs.flatMap((x, i) => (x % p === 0n ? [i] : []));
    return (
      <CellStage
        title={`C(${t.n}, ${t.k}) 의 인수 — 자리를 안 가르면 ${p} 의 배수가 들고, 가른 자리에는 없다`}
        columns={numF.length}
        rows={[
          {
            kind: "cells",
            label: "안 가른 분자",
            values: numF.map(s),
            states: mark(numF),
          },
          {
            kind: "caret",
            cells: multiples(numF),
            side: `${p} 의 배수 ${multiples(numF).length} 개`,
          },
          {
            kind: "cells",
            label: "안 가른 분모",
            values: denF.map(s),
            states: mark(denF),
          },
          {
            kind: "caret",
            cells: multiples(denF),
            side: `${p} 의 배수 ${multiples(denF).length} 개`,
          },
          {
            kind: "cells",
            label: `자리 ${loopDigit.place} 의 분자`,
            values: dn,
            side: `(${loopDigit.n}, ${loopDigit.k}) · ${p} 의 배수 0 개`,
          },
          {
            kind: "cells",
            label: `자리 ${loopDigit.place} 의 분모`,
            values: dd,
            side: `${p} 의 배수 0 개`,
          },
        ]}
      />
    );
  },
  "walk-run": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((st) => ({
      id: st.id,
      text: `${st.title} — ${st.stage.calc?.expr} → ${st.stage.calc?.result}`,
      rows: arrayStage(st.stage, ARRAY_OPTIONS),
    }));
    const t = walk();
    return (
      <CellStageFilm
        title={`binomialModP(${t.n}n, ${t.k}n, ${t.p}n) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns((steps[0] as Step).stage)}
        frames={frames}
      />
    );
  },
};
