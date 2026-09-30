/**
 * `extendedEuclidean-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 몫을 구하는 줄 뒤에 기록을 끼운 계측
 * 사본(`probed`)을 정본 소스에서 기계로 만들고, 그 기록으로 나눗셈마다의 `r0` · `r1` · `s0` · `s1` · `t0` ·
 * `t1` · `q` 를 얻는다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의
 * 리터럴이 그것과 같은지는 `extendedEuclidean-guide.test.ts` 가 잰다.
 *
 * **무대는 앞 편 `gcd` 의 나머지 수열에 계수 두 줄을 더한 것이다.** 칸 `k` 가 나머지 수열의 `r_k` 이고,
 * 그 아래 `s` 줄 · `t` 줄의 칸 `k` 가 `r_k = A·s_k + B·t_k` 의 두 계수다(`A` · `B` 는 두 입력의 절댓값).
 * 괄호가 바퀴를 시작할 때의 이웃 두 칸 `(r0, r1)` 이고, 바퀴마다 세 줄에 새 칸 하나씩이 오른쪽에 채워진다.
 *
 * 기록은 나눗셈마다 수 일곱 개뿐이라 입력이 커도 걸음마다 무엇을 베끼지 않는다. 걸음마다 칸 줄 전체를
 * 복사하는 것은 전개 입력의 걸음(`walkSteps`)뿐이다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 을를, 이가 } from "../../../../tools/josa.ts";
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
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { extendedEuclidean } from "./extendedEuclidean-guide.ref.ts";

const REF = new URL("./extendedEuclidean-guide.ref.ts", import.meta.url)
  .pathname;

type Result = { g: bigint; x: bigint; y: bigint };

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 몫을 구한 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지 않으면
 * `loadMutant` 가 던진다. 기록하는 때는 몫을 구한 직후, 세 쌍을 옮기기 직전이다. 그래서 여섯 값은 바퀴를
 * 시작할 때의 이웃 두 칸이다.
 */
const probed = await loadMutant<{
  extendedEuclidean(a: bigint, b: bigint): Result;
}>(REF, {
  swap: [
    /^(\s*)const q = r0 \/ r1;$/,
    "$1const q = r0 / r1;\n$1(globalThis as any).__steps.push({ r0, r1, s0, s1, t0, t1, q });",
  ],
});

/** 나눗셈 한 번 — 바퀴 `k` 의 기록. */
export interface Division {
  /** 바퀴 번호. 0 부터 센다. 이 바퀴가 나누는 이웃 두 칸은 `k` · `k + 1` 이다. */
  readonly k: number;
  readonly r0: bigint;
  readonly r1: bigint;
  readonly s0: bigint;
  readonly s1: bigint;
  readonly t0: bigint;
  readonly t1: bigint;
  /** 몫 `⌊r0 / r1⌋`. */
  readonly q: bigint;
  /** 이 바퀴가 새로 채운 칸 `k + 2` 의 세 값. */
  readonly nr: bigint;
  readonly ns: bigint;
  readonly nt: bigint;
}

export interface Trace {
  readonly a: bigint;
  readonly b: bigint;
  /** 두 입력의 절댓값 — 나머지 수열의 칸 0 · 1. */
  readonly A: bigint;
  readonly B: bigint;
  readonly divisions: readonly Division[];
  /** 나머지 수열 전체 `r_0 … r_{N+1}`. 마지막 칸이 0 이다. */
  readonly chain: readonly bigint[];
  /** 계수 두 줄 — 칸 `k` 가 `r_k = A·s_k + B·t_k` 의 두 계수다. */
  readonly s: readonly bigint[];
  readonly t: readonly bigint[];
  /** 정본의 답. */
  readonly result: Result;
}

export const abs = (v: bigint): bigint => (v < 0n ? -v : v);

/**
 * 정본 한 번 호출의 기록. 답은 정본과 대조하고, 바퀴 사이의 값은 이렇게 대조한다 — 첫 바퀴의 두 칸이 두
 * 입력의 절댓값과 계수 `(1, 0)` · `(0, 1)` 인가, 다음 바퀴의 두 칸이 앞 바퀴의 둘째 칸과 새 칸인가,
 * `r0 = q·r1 + nr` 이고 `0 ≤ nr < r1` 인가. 어긋나면 던진다 — 그림이 정본과 다른 것을 그리지 않게.
 */
export function trace(a: bigint, b: bigint): Trace {
  const store = globalThis as unknown as {
    __steps: {
      r0: bigint;
      r1: bigint;
      s0: bigint;
      s1: bigint;
      t0: bigint;
      t1: bigint;
      q: bigint;
    }[];
  };
  store.__steps = [];
  const got = probed.extendedEuclidean(a, b);
  const result = extendedEuclidean(a, b);
  if (got.g !== result.g || got.x !== result.x || got.y !== result.y) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  const A = abs(a);
  const B = abs(b);
  const chain: bigint[] = [A, B];
  const s: bigint[] = [1n, 0n];
  const t: bigint[] = [0n, 1n];
  const divisions: Division[] = [];
  for (const [k, d] of store.__steps.entries()) {
    if (
      d.r0 !== chain[k] ||
      d.r1 !== chain[k + 1] ||
      d.s0 !== s[k] ||
      d.s1 !== s[k + 1] ||
      d.t0 !== t[k] ||
      d.t1 !== t[k + 1]
    ) {
      throw new Error(`바퀴 ${k} 의 두 칸이 앞 바퀴가 남긴 두 칸이 아니다`);
    }
    const nr = d.r0 - d.q * d.r1;
    if (nr < 0n || nr >= d.r1) {
      throw new Error(`바퀴 ${k} 가 0 ≤ r < r1 을 어긴다`);
    }
    const ns = d.s0 - d.q * d.s1;
    const nt = d.t0 - d.q * d.t1;
    divisions.push({ k, ...d, nr, ns, nt });
    chain.push(nr);
    s.push(ns);
    t.push(nt);
  }
  if (chain.at(-1) !== 0n) throw new Error("반복이 끝났는데 r1 이 0 이 아니다");
  const n = divisions.length;
  if ((chain[n] as bigint) !== result.g) {
    throw new Error("마지막 0 앞 칸이 정본의 g 와 다르다");
  }
  return { a, b, A, B, divisions, chain, s, t, result };
}

/** 나눗셈 횟수만 필요할 때 — 정본과 같은 나머지 수열을 값 둘로만 따라간다. */
export function divisionCount(a: bigint, b: bigint): number {
  let r0 = abs(a);
  let r1 = abs(b);
  let n = 0;
  while (r1 !== 0n) {
    [r0, r1] = [r1, r0 % r1];
    n += 1;
  }
  return n;
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK_A = -510n;
export const WALK_B = 183n;

/** 과제 규모 — 앞 편 `gcd` 와 같은 두 수의 절댓값의 상한과, 처리 속도(단순 연산 1 초에 1 억 번). */
export const LIMIT = 10n ** 18n;
export const PER_SECOND = 100_000_000n;
export const YEAR_SECONDS = 31_536_000n;

export const num = (n: number | bigint): string => n.toLocaleString("en-US");

/** 피보나치 수 — `F(0) = 0`, `F(1) = 1`. */
export function fib(k: number): bigint {
  let a = 0n;
  let b = 1n;
  for (let i = 0; i < k; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return a;
}

/** 펠 수 — 몫이 전부 2 인 입력을 만든다. `P(0) = 1`, `P(1) = 2`, `P(k+1) = 2·P(k) + P(k-1)`. */
export function pell(k: number): bigint {
  let a = 1n;
  let b = 2n;
  if (k === 0) return a;
  for (let i = 1; i < k; i++) {
    const next = 2n * b + a;
    a = b;
    b = next;
  }
  return b;
}

/** 과제 규모 안에서 가장 큰 이웃 피보나치 쌍의 번호 `k` — `F(k) ≤ LIMIT < F(k + 1)`. */
export const WORST_K = (() => {
  let k = 1;
  while (fib(k + 1) <= LIMIT) k++;
  return k;
})();

/** 과제 규모 안에서 가장 큰 이웃 펠 쌍의 번호 `k` — `P(k) ≤ LIMIT < P(k + 1)`. */
export const PELL_K = (() => {
  let k = 1;
  while (pell(k + 1) <= LIMIT) k++;
  return k;
})();

let walkMemo: Trace | undefined;
/** 전개 입력의 기록. 그림 · 증명 · 패널이 같은 기록을 쓴다. */
export const walk = (): Trace => {
  walkMemo ??= trace(WALK_A, WALK_B);
  return walkMemo;
};

/* ───────────────── 가장 단순한 방법 — x 를 대입해 찾기 ───────────────── */

/** 대입 순서 `0, 1, -1, 2, -2, …` 의 `i` 번째(0 부터) 후보. */
const candidate = (i: number): bigint =>
  i === 0 ? 0n : i % 2 === 1 ? BigInt((i + 1) / 2) : -BigInt(i / 2);

/**
 * `g` 를 구해 두고 `x` 를 `0, 1, -1, 2, -2, …` 로 대입해, `g − a·x` 가 `b` 로 나누어떨어지는 첫 후보에서
 * 멈춘다. 후보 하나에 나머지 연산 한 번이다. **실제로 끝까지 대입한다** — 작은 입력에만 쓴다.
 * `b = 0` 이면 나눌 수가 없으므로 부르지 않는다.
 */
export function searchRun(a: bigint, b: bigint): { x: bigint; tries: number } {
  if (b === 0n) throw new Error("b 가 0 이면 대입 탐색을 쓸 수 없다");
  const { g } = extendedEuclidean(a, b);
  for (let i = 0; ; i++) {
    const x = candidate(i);
    if ((g - a * x) % b === 0n) return { x, tries: i + 1 };
  }
}

/**
 * 대입 탐색이 몇 번째 후보에서 멈추는가를 **대입하지 않고** 센다 — 큰 입력은 끝까지 대입하면 끝나지 않는다.
 * `a·x + b·y = g` 의 `x` 는 정본의 `x` 에서 `|b| / g` 씩 옮긴 값이 전부이므로, 그중 절댓값이 가장 작은 것
 * (같으면 양수)이 대입 순서에서 처음 나오는 해다. 작은 입력에서 `searchRun` 과 같은지는 증명 블록이 대조한다.
 */
export function searchCount(
  a: bigint,
  b: bigint,
): { x: bigint; tries: bigint } {
  const { g, x } = extendedEuclidean(a, b);
  const m = abs(b) / g;
  const up = ((x % m) + m) % m;
  const down = up - m;
  const best = abs(down) < up ? down : up;
  const tries = best === 0n ? 1n : best > 0n ? 2n * best : 2n * -best + 1n;
  return { x: best, tries };
}

/* ───────────────── 몫을 적어 두었다가 거슬러 대입하기 ───────────────── */

/** 거슬러 대입하는 판의 한 걸음 — `g = u·r_k + v·r_{k+1}` 을 만족하는 `(u, v)`. */
export interface BackRow {
  readonly k: number;
  readonly u: bigint;
  readonly v: bigint;
}

/**
 * 나머지 수열을 한 번 만들며 몫을 모두 적어 두고, 끝에서부터 `g = u·r_k + v·r_{k+1}` 의 `(u, v)` 를 한
 * 칸씩 앞으로 옮긴다. 맨 끝은 `r_{N+1} = 0` 이라 `(1, 0)` 이고, 앞으로 한 칸은 `r_{k+2} = r_k − q_k·r_{k+1}`
 * 을 넣어 `(v, u − q_k·v)` 다. 부호는 마지막에 붙인다. 적어 둔 몫과 칸 전부를 기록으로 돌려준다.
 */
export function backSubstitute(
  a: bigint,
  b: bigint,
): { rows: BackRow[]; quotients: bigint[]; result: Result } {
  const t = trace(a, b);
  const quotients = t.divisions.map((d) => d.q);
  const n = quotients.length;
  let u = 1n;
  let v = 0n;
  const rows: BackRow[] = [{ k: n, u, v }];
  for (let k = n - 1; k >= 0; k--) {
    const q = quotients[k] as bigint;
    [u, v] = [v, u - q * v];
    rows.push({ k, u, v });
  }
  const g = t.chain[n] as bigint;
  const result: Result =
    g === 0n
      ? { g: 0n, x: 0n, y: 0n }
      : { g, x: (a < 0n ? -1n : 1n) * u, y: (b < 0n ? -1n : 1n) * v };
  return { rows, quotients, result };
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly stage: ArrayStep;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "나머지 수열",
  rangeLabel: "(r0, r1)",
};

/** 음수는 괄호로 싼다 — `183 × (-2)`. */
const par = (v: bigint): string => (v < 0n ? `(${v})` : String(v));

/**
 * 전개 입력의 걸음 — 처음 값을 정하는 걸음(T1) · 바퀴마다 한 걸음 · 반복을 끝내고 부호를 붙이는 한 걸음.
 *
 * 무대는 나머지 수열과 계수 두 줄의 칸을 첫 걸음부터 모두 둔다(아직 안 채운 칸은 빈칸). 괄호 `(r0, r1)` 가
 * 바퀴를 시작할 때의 이웃 두 칸이고, ▲ 가 이번에 읽은 두 칸이다. 새로 쓴 칸이 이번 바퀴의 나머지와 그 두
 * 계수다. 값 줄 곁말은 채운 칸 가운데 `A·s + B·t = r` 이 맞는 칸의 수다 — 이 편의 불변식이 그것이다.
 */
export function walkSteps(): Step[] {
  const tr = walk();
  const n = tr.chain.length;
  const blank = (): (number | null)[] => Array.from({ length: n }, () => null);
  const cells = blank();
  const sRow = blank();
  const tRow = blank();
  const fill = (k: number) => {
    cells[k] = Number(tr.chain[k]);
    sRow[k] = Number(tr.s[k]);
    tRow[k] = Number(tr.t[k]);
  };
  const side = () => {
    let filled = 0;
    let ok = 0;
    for (let k = 0; k < n; k++) {
      if (cells[k] === null) continue;
      filled += 1;
      const r = tr.chain[k] as bigint;
      if (tr.A * (tr.s[k] as bigint) + tr.B * (tr.t[k] as bigint) === r)
        ok += 1;
    }
    return `${tr.A}·s + ${tr.B}·t = r 인 칸 ${ok} / ${filled}`;
  };
  const layers = (read: number[], write: number[]) => [
    { name: "s 줄", values: [...sRow], read, write },
    { name: "t 줄", values: [...tRow], read, write },
  ];
  const steps: Step[] = [];
  fill(0);
  fill(1);
  steps.push({
    id: "T1",
    title: "부호를 떼고 첫 두 칸을 정한다",
    detail: `a = ${WALK_A}${이가(String(WALK_A))} 음수라 부호 -1 을 따로 적어 두고 r0 를 절댓값 ${tr.A}${으로(String(tr.A))} 둡니다. b = ${WALK_B}${이가(String(WALK_B))} 양수라 r1 은 ${tr.B} 그대로입니다. ${tr.A} = ${tr.A} × 1 + ${tr.B} × 0 이고 ${tr.B} = ${tr.A} × 0 + ${tr.B} × 1 이라, 첫 두 칸의 계수가 (1, 0) 과 (0, 1) 입니다.`,
    stage: {
      array: [...cells],
      range: [0, 1],
      rangeSide: side(),
      read: [],
      write: [0, 1],
      pointers: { r0: 0, r1: 1 },
      calc: {
        expr: `|${WALK_A}| · |${WALK_B}|`,
        result: `r0 = ${tr.A} · r1 = ${tr.B}`,
      },
      vars: "나눗셈 0",
      layers: layers([], [0, 1]),
    },
  });
  for (const d of tr.divisions) {
    fill(d.k + 2);
    const last =
      d.nr === 0n ? ` 나머지가 0 이 나왔으니 이 바퀴가 마지막입니다.` : "";
    steps.push({
      id: `T${d.k + 2}`,
      title: `${d.r0} = ${d.q} × ${d.r1} + ${d.nr}`,
      detail: `${d.r0}${을를(String(d.r0))} ${d.r1}${으로(String(d.r1))} 나눈 몫이 ${d.q}, 나머지가 ${d.nr} 입니다. 같은 몫으로 s 는 ${d.s0} - ${d.q} × ${par(d.s1)} = ${d.ns}, t 는 ${d.t0} - ${d.q} × ${par(d.t1)} = ${d.nt}${이가(String(d.nt))} 되어 새 칸이 ${tr.A} × ${par(d.ns)} + ${tr.B} × ${par(d.nt)} = ${tr.A * d.ns + tr.B * d.nt} 입니다.${last}`,
      stage: {
        array: [...cells],
        range: [d.k, d.k + 1],
        rangeSide: side(),
        read: [d.k, d.k + 1],
        write: [d.k + 2],
        pointers: { r0: d.k, r1: d.k + 1 },
        calc: { expr: `q = ${d.r0} / ${d.r1}`, result: `${d.q}` },
        vars: `나눗셈 ${d.k + 1}`,
        layers: layers([d.k, d.k + 1], [d.k + 2]),
      },
    });
  }
  const last = tr.divisions.length;
  const { g, x, y } = tr.result;
  const s0 = tr.s[last] as bigint;
  const t0 = tr.t[last] as bigint;
  const signA = WALK_A < 0n ? -1n : 1n;
  const signB = WALK_B < 0n ? -1n : 1n;
  steps.push({
    id: `T${last + 2}`,
    title: "r1 = 0 · 부호를 붙여 반환",
    detail: `r1 이 0 이라 반복 조건이 거짓입니다. r0 = ${g}${이가(String(g))} g 이고, 그 칸의 계수 s = ${s0}, t = ${t0} 에 입력의 부호를 붙여 x = ${signA} × ${par(s0)} = ${x}, y = ${signB} × ${par(t0)} = ${y}${을를(String(y))} 돌려줍니다.`,
    stage: {
      array: [...cells],
      range: [last, last + 1],
      rangeSide: side(),
      read: [last, last + 1],
      write: [],
      pointers: { r0: last, r1: last + 1 },
      calc: { expr: "r1 = 0", result: `g = ${g} · x = ${x} · y = ${y}` },
      vars: `나눗셈 ${last}`,
      layers: layers([last], []),
    },
  });
  return steps;
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `extendedEuclidean-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    eeaWalk: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

function approaches(): Approach[] {
  const tr = walk();
  const worstA = fib(WORST_K);
  const worstB = fib(WORST_K - 1);
  const search = searchCount(worstA, worstB);
  const worstN = divisionCount(worstA, worstB);
  const searchDivisions = search.tries + BigInt(worstN);
  const years = Math.round(
    Number(searchDivisions) / Number(PER_SECOND) / Number(YEAR_SECONDS),
  );
  return [
    {
      name: "x 를 대입해 찾기",
      idea: "g 를 먼저 구하고 x 를 0, 1, -1, 2, -2, … 로 대입해 g − a·x 가 b 로 나누어떨어질 때 멈춘다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `F(${WORST_K}) · F(${WORST_K - 1}) 이면 나눗셈 ${num(searchDivisions)} 번 · 약 ${num(years)} 년`,
          ok: false,
        },
      ],
      lesson:
        "후보 수가 |x| 를, 곧 입력의 값을 따라간다 — g 를 만든 나눗셈 N 번이 계수의 재료를 이미 쥐고 있다",
    },
    {
      name: "몫을 적어 두고 거슬러 대입하기",
      idea: "나머지 수열을 만들며 몫을 다 적어 두고, 끝의 g 부터 앞 칸의 식을 차례로 대입해 거슬러 올라간다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `나눗셈 N 번 · F(${WORST_K}) · F(${WORST_K - 1}) 이면 ${worstN} 번`,
          ok: true,
        },
        {
          label: "방향",
          value: `몫을 끝에서부터 쓰려고 수열을 두 번 지나간다 · 몫 ${worstN} 개를 적어 둔다`,
          ok: false,
        },
      ],
      lesson:
        "대입은 앞에서 뒤로도 된다 — 칸마다 계수를 붙여 두면 몫을 얻은 그 바퀴에서 새 칸의 계수까지 정해진다",
    },
    {
      name: "확장 유클리드 호제법",
      idea: "나머지 수열의 칸마다 A·s + B·t 의 두 계수를 함께 적고, 새 칸의 계수를 그 칸의 몫으로 앞 두 칸에서 만든다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `(${WALK_A}, ${WALK_B}) 에서 g = ${tr.result.g} · x = ${tr.result.x} · y = ${tr.result.y}`,
          ok: true,
        },
        {
          label: "시간",
          value: `나눗셈 N 번 한 벌 · 두 수가 10^18 이하면 많아야 ${worstN} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 나머지 수열의 칸 이름 — `r₀` · `r₁` … */
const SUB = "₀₁₂₃₄₅₆₇₈₉";
export const rName = (k: number): string =>
  `r${[...String(k)].map((c) => SUB[Number(c)]).join("")}`;

/** 한 기록의 나머지 수열 · 몫 · 계수 두 줄을 칸 무대 줄로. `states` 는 네 줄에 함께 건다. */
function chainRows(
  tr: Trace,
  states: Partial<Record<number, CellState>>,
  columns: number,
  label = "나머지 수열",
): StageRow[] {
  const pad = (vs: readonly bigint[]): (string | null)[] =>
    Array.from({ length: columns }, (_, i) => {
      const v = vs[i];
      return v === undefined ? null : String(v);
    });
  const qs: (string | null)[] = Array.from({ length: columns }, (_, k) => {
    const d = tr.divisions[k];
    return d === undefined ? null : String(d.q);
  });
  return [
    {
      kind: "cells",
      label,
      values: pad(tr.chain),
      states,
      side: `칸 ${tr.chain.length} 개 · 마지막이 0`,
    },
    {
      kind: "cells",
      label: "몫",
      values: qs,
      side: `나눗셈 ${tr.divisions.length} 번`,
    },
    {
      kind: "cells",
      label: "s 줄",
      values: pad(tr.s),
      states,
      side: `${tr.A} 의 계수`,
    },
    {
      kind: "cells",
      label: "t 줄",
      values: pad(tr.t),
      states,
      side: `${tr.B} 의 계수`,
    },
  ];
}

export const FIGS: Record<string, () => ReactElement> = {
  /** 전체 컨셉 — 나머지 수열 아래 계수 두 줄. 칸마다 A·s + B·t 가 그 칸의 값이고, 0 앞 칸이 답이다. */
  "concept-chain": () => {
    const tr = walk();
    const n = tr.chain.length;
    const last = tr.divisions.length;
    for (let k = 0; k < n; k++) {
      const v = tr.A * (tr.s[k] as bigint) + tr.B * (tr.t[k] as bigint);
      if (v !== tr.chain[k])
        throw new Error(`칸 ${k} 의 계수가 칸 값을 안 만든다`);
    }
    return (
      <CellStage
        title={`extendedEuclidean(${WALK_A}n, ${WALK_B}n) — 칸 ${n} 개 모두 ${tr.A} × s + ${tr.B} × t 가 나머지 수열의 값이고, 0 앞 칸 ${rName(last)} 의 계수가 답이다`}
        columns={n}
        rows={[
          {
            kind: "index",
            label: "칸",
            labels: tr.chain.map((_, k) => rName(k)),
          },
          ...chainRows(tr, { [last]: "focus" }, n),
          {
            kind: "bracket",
            label: "답",
            from: last,
            to: last,
            tone: "left",
            text: `g = ${tr.result.g}`,
          },
        ]}
      />
    );
  },

  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`두 수의 절댓값 ≤ 10^18 · 1 초(단순 연산 1 초에 ${num(PER_SECOND)} 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },

  /** 먼저 알아 둘 개념 — 칸 하나의 계수를 바로 앞 두 칸과 그 몫에서 만든다. */
  "build-neighbors": () => {
    const tr = walk();
    const n = tr.chain.length;
    const d = tr.divisions[2];
    if (d === undefined) throw new Error("셋째 바퀴가 없다");
    const states: Partial<Record<number, CellState>> = {
      [d.k]: "read",
      [d.k + 1]: "read",
      [d.k + 2]: "focus",
    };
    for (let k = d.k + 3; k < n; k++) states[k] = "out";
    for (let k = 0; k < d.k; k++) states[k] = "out";
    return (
      <CellStage
        title={`칸 ${rName(d.k + 2)} 는 앞 두 칸 ${rName(d.k)} · ${rName(d.k + 1)} 에서 몫 ${d.q} 로 — 세 줄 모두 (앞 칸) − ${d.q} × (바로 앞 칸)`}
        columns={n}
        rows={[
          {
            kind: "index",
            label: "칸",
            labels: tr.chain.map((_, k) => rName(k)),
            focus: [d.k + 2],
          },
          ...chainRows(tr, states, n),
          {
            kind: "caret",
            cells: [d.k, d.k + 1],
            side: `q = ${d.r0} / ${d.r1} = ${d.q}`,
          },
          {
            kind: "bracket",
            label: "읽는 두 칸",
            from: d.k,
            to: d.k + 1,
            tone: "query",
            text: `(${d.r0}, ${d.r1})`,
          },
          {
            kind: "bracket",
            label: "새 칸",
            from: d.k + 2,
            to: d.k + 2,
            tone: "left",
            text: `${d.nr} · ${d.ns} · ${d.nt}`,
          },
        ]}
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
        title={`extendedEuclidean(${WALK_A}n, ${WALK_B}n) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns((steps[0] as Step).stage)}
        frames={frames}
      />
    );
  },

  /** 최악을 만드는 입력 — 이웃 피보나치 쌍은 몫이 거의 전부 1 이라 칸이 가장 많고 계수도 가장 커진다. */
  "worst-fib": () => {
    const k = 12;
    const fibPair = trace(fib(k), fib(k - 1));
    const other = trace(fib(k), 100n);
    const n = Math.max(fibPair.chain.length, other.chain.length);
    const top = (tr: Trace) => {
      const last = tr.divisions.length;
      return { [last]: "focus" } as Partial<Record<number, CellState>>;
    };
    return (
      <CellStage
        title={`나머지 수열 둘 — 이웃 피보나치 쌍 (${fib(k)}, ${fib(k - 1)}) 은 몫이 거의 전부 1 이라 칸이 가장 많고, 0 앞 칸의 계수도 더 크다`}
        columns={n}
        rows={[
          {
            kind: "index",
            label: "칸",
            labels: Array.from({ length: n }, (_, i) => rName(i)),
          },
          ...chainRows(fibPair, top(fibPair), n, `${fib(k)} · ${fib(k - 1)}`),
          ...chainRows(other, top(other), n, `${fib(k)} · 100`),
        ]}
      />
    );
  },
};
