/**
 * `pollardRho-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림과 증명 블록과 걸음 재생 패널이 **같은 기록**을 쓴다. 기록은 `run` 이 만든다 — 정본과 같은 절차를
 * 따라가며 나머지 연산(`%`)을 실행한 만큼 세고, 걸음마다 두 자리의 값을 적는 사본이다. 정본은 걸음마다의
 * 값도 연산 수도 내보내지 않으므로 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답은 사본이
 * 아니라 정본이 진다** — `run` 은 매번 정본에 같은 입력을 다시 물어 답이 다르면 던진다.
 *
 * **세는 단위는 원고 전체에서 하나다.** 기본 연산은 나머지 연산 한 번이다 — 짝수 검사 `n % 2n`, 수열의
 * 한 칸 `(t * t + c) % n`, 유클리드 호제법의 `x % y` 가 각각 하나다. 곱셈 · 덧셈 · 뺄셈 · 비교는 세지 않는다.
 * 소수 판정 편(`millerRabin`) · 시행 나눗셈 편(`isPrimeTrial`) · 최대공약수 편(`gcd`)과 같은 단위이고, 소수
 * 판정이 쓴 몫은 그 편의 기록 사본(`run`)이 센 값을 그대로 받는다 — 두 편이 같은 절차를 부품으로 쓰므로
 * 같은 입력에서 같은 수가 나와야 한다.
 *
 * **무작위가 없다.** 시작값 2 와 첫 상수 1 이 정본에 박혀 있고, 실패하면 상수를 1 씩 올린다. 그래서 시드를
 * 고정할 자리가 없고, 같은 입력에서 늘 같은 값이 나온다.
 *
 * **큰 입력은 가벼운 판으로 잰다.** 규모를 훑는 표(걸음이 수만 번인 입력)는 `count` — 걸음 기록을 쌓지
 * 않고 셈만 하는 판 — 을 쓴다. 두 판이 같은 셈을 내는지는 증명 블록이 작은 입력에서 대조한다.
 *
 * **ρ 모양 그림의 좌표.** `NodeGraph` 는 정점 자리를 좌표로 받는다. 격자 단위를 1 픽셀로 두고(`unit`),
 * 마디의 칸은 원 위에, 꼬리의 칸은 원 아래 세로줄에 놓는다. 마디가 시작하는 칸이 원의 맨 아래에 서서
 * 꼬리가 그 칸으로 들어온다.
 */

import type { ReactElement } from "react";
import { josa, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import {
  CellStageFilm,
  type StageFrame,
} from "../../../_viz/patterns/CellStage";
import {
  type GraphEdge,
  type GraphGroup,
  type GraphNode,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import {
  candidateCount,
  countRun,
} from "../isPrimeTrial/isPrimeTrial-guide.fig.tsx";
import { run as millerRun } from "../millerRabin/millerRabin-guide.fig.tsx";
import { pollardRho } from "./pollardRho-guide.ref.ts";

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개가 쓰는 고정 입력. `8,051 = 83 × 97` 이다. */
export const WALK = 8_051n;

/** 전개 입력에서 먼저 되풀이되는 소인수 — 정본이 돌려주는 값이다. */
export const P = 97n;

/** 전개 입력의 다른 소인수. */
export const Q = 83n;

/** 정본의 시작값과 첫 상수. 정본과 같은지는 `run` 이 답을 대조해 드러낸다. */
export const X0 = 2n;
export const C0 = 1n;

/** 과제의 상한 — 소수 판정 편이 확정 판정을 내는 범위와 같다. */
export const LIMIT = 1n << 64n;

/** 흔한 채점 환경의 예산 — 기본 연산 1 초에 1 억 번. 소수 판정 편 · 시행 나눗셈 편과 같은 값이다. */
export const OPS_PER_SECOND = 100_000_000;

export const num = (n: number | bigint): string => n.toLocaleString("en-US");

/** 예산 기준의 시간 — 둘째 자리까지. */
export const seconds = (ops: number): string =>
  `${(ops / OPS_PER_SECOND).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} 초`;

/** 아래첨자 — `x₁₉` 꼴. */
export const sub = (i: number): string =>
  [...String(i)].map((c) => "₀₁₂₃₄₅₆₇₈₉"[Number(c)]).join("");

/** 세지 않는 최대공약수. 입력을 만들 때와 논증 칸을 채울 때 쓴다. */
export function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

/** 세지 않는 소수 판정 — 소수 판정 편의 기록 사본이 낸 답이다. */
export const isPrime = (n: bigint): boolean => n >= 2n && millerRun(n).answer;

/** `from` 이상에서 처음 나오는 소수. */
export function nextPrime(from: bigint): bigint {
  let x = from <= 2n ? 2n : from | 1n;
  while (!isPrime(x)) x += x === 2n ? 1n : 2n;
  return x;
}

/** `from` 이하에서 처음 나오는 소수. */
export function prevPrime(from: bigint): bigint {
  let x = (from - 1n) | 1n;
  while (!isPrime(x)) x -= 2n;
  return x;
}

/** 소인수를 오름차순으로. 작은 수에만 쓴다. */
export function factorize(n: bigint): bigint[] {
  const out: bigint[] = [];
  let x = n;
  for (let p = 2n; p * p <= x; p += p === 2n ? 1n : 2n) {
    while (x % p === 0n) {
      out.push(p);
      x /= p;
    }
  }
  if (x > 1n) out.push(x);
  return out;
}

/** 소인수를 곱으로 적는다. 소수면 「소수」. */
export const factorText = (n: bigint): string => {
  const f = factorize(n);
  return f.length === 1 ? "소수" : f.map(num).join(" × ");
};

/** 정의를 그대로 옮긴 약수 찾기 — 2 부터 차례로 나눠 첫 약수를 낸다. 답의 기준이 된다. */
export function trialDivision(n: bigint): bigint {
  if (n % 2n === 0n) return 2n;
  for (let d = 3n; d * d <= n; d += 2n) {
    if (n % d === 0n) return d;
  }
  return n;
}

/** `v` 의 제곱근을 내림한 정수. */
export function isqrt(v: bigint): bigint {
  if (v < 2n) return v;
  let x = v;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + v / x) / 2n;
  }
  return x;
}

/* ───────────────────────── 기록 사본 ───────────────────────── */

/** 로 루프 한 걸음의 기록. */
export interface Step {
  /** 이 라운드에서 몇 번째 걸음인가(1 부터). */
  readonly k: number;
  readonly x: bigint;
  readonly y: bigint;
  readonly diff: bigint;
  readonly d: bigint;
  /** 이 걸음의 최대공약수가 쓴 나머지 연산. */
  readonly gcdOps: number;
}

/** 상수 `c` 하나로 실행한 라운드. */
export interface Round {
  readonly c: bigint;
  readonly steps: readonly Step[];
  readonly d: bigint;
}

export type Exit = "짝수" | "소수" | "로";

export interface Run {
  readonly n: bigint;
  readonly answer: bigint;
  readonly exit: Exit;
  /** 소수 판정이 쓴 나머지 연산 — 소수 판정 편의 기록 사본이 센 값이다. */
  readonly primeOps: number;
  readonly rounds: readonly Round[];
  /** 로 루프 걸음 수의 합(라운드를 합친 값). */
  readonly iters: number;
  /** 유클리드 호제법의 나머지 연산 합. */
  readonly gcdOps: number;
  /** 전체 나머지 연산. */
  readonly ops: number;
}

/** 걸음 기록 없이 셈만 하는 가벼운 판의 결과. */
export type Count = Omit<Run, "rounds"> & { readonly roundCount: number };

/** 차의 최대공약수를 세면서 구한다. */
function gcdCounted(a: bigint, b: bigint): { g: bigint; ops: number } {
  let x = a;
  let y = b;
  let ops = 0;
  while (y !== 0n) {
    ops += 1;
    const t = x % y;
    x = y;
    y = t;
  }
  return { g: x, ops };
}

/** `run` 과 `count` 가 함께 쓰는 몸통. `keep` 이 거짓이면 걸음을 쌓지 않는다. */
function walk(n: bigint, keep: boolean): Run & { readonly roundCount: number } {
  const check = (answer: bigint) => {
    if (answer !== pollardRho(n)) {
      throw new Error(`기록 사본이 정본과 다른 답을 냈다 — n = ${n}`);
    }
  };
  let ops = 1; // 짝수 검사 n % 2n
  if (n % 2n === 0n) {
    check(2n);
    return {
      n,
      answer: 2n,
      exit: "짝수",
      primeOps: 0,
      rounds: [],
      roundCount: 0,
      iters: 0,
      gcdOps: 0,
      ops,
    };
  }
  const prime = millerRun(n);
  const primeOps = prime.ops;
  ops += primeOps;
  if (prime.answer) {
    check(n);
    return {
      n,
      answer: n,
      exit: "소수",
      primeOps,
      rounds: [],
      roundCount: 0,
      iters: 0,
      gcdOps: 0,
      ops,
    };
  }
  const rounds: Round[] = [];
  let roundCount = 0;
  let iters = 0;
  let gcdOps = 0;
  for (let c = C0; ; c += 1n) {
    roundCount += 1;
    const f = (t: bigint): bigint => {
      ops += 1;
      return (t * t + c) % n;
    };
    let x = X0;
    let y = X0;
    let d = 1n;
    let k = 0;
    const steps: Step[] = [];
    while (d === 1n) {
      k += 1;
      iters += 1;
      x = f(x);
      y = f(f(y));
      const diff = x > y ? x - y : y - x;
      const g = gcdCounted(diff, n);
      d = g.g;
      ops += g.ops;
      gcdOps += g.ops;
      if (keep) steps.push({ k, x, y, diff, d, gcdOps: g.ops });
    }
    if (keep) rounds.push({ c, steps, d });
    if (d !== n) {
      check(d);
      return {
        n,
        answer: d,
        exit: "로",
        primeOps,
        rounds,
        roundCount,
        iters,
        gcdOps,
        ops,
      };
    }
  }
}

/** 정본과 같은 절차를 따라가며 걸음마다 기록한다. 작은 입력에만 쓴다. */
export function run(n: bigint): Run {
  const { roundCount: _, ...r } = walk(n, true);
  return r;
}

/** 걸음 기록 없이 셈만 하는 가벼운 판. 큰 입력에 쓴다. */
export function count(n: bigint): Count {
  const { rounds: _, ...r } = walk(n, false);
  return r;
}

/* ───────────────────────── 수열의 모양 ───────────────────────── */

/** 법 `m` 위의 수열 — 시작값 2, 상수 `c`. `length` 칸을 낸다. */
export function sequence(m: bigint, length: number, c: bigint = C0): bigint[] {
  const out: bigint[] = [X0 % m];
  while (out.length < length) {
    const t = out.at(-1) as bigint;
    out.push((t * t + c) % m);
  }
  return out;
}

export interface Shape {
  /** 꼬리의 칸 수 — 되풀이되지 않는 앞부분. */
  readonly mu: number;
  /** 마디의 칸 수 — 되풀이되는 부분. */
  readonly lambda: number;
  /** 서로 다른 값 전부(`mu + lambda` 칸) — 처음 나온 차례. */
  readonly values: readonly bigint[];
}

/**
 * 법 `m` 위 수열의 ρ 모양 — 값을 전부 기억해 두고 처음 되풀이되는 자리를 찾는다. 모양을 재는 자리라
 * 메모리를 써도 된다. 정본은 이렇게 기억하지 않는다.
 */
export function shape(m: bigint, c: bigint = C0): Shape {
  const seen = new Map<bigint, number>();
  const values: bigint[] = [];
  let x = X0 % m;
  for (let i = 0; ; i++) {
    const prev = seen.get(x);
    if (prev !== undefined) return { mu: prev, lambda: i - prev, values };
    seen.set(x, i);
    values.push(x);
    x = (x * x + c) % m;
  }
}

/** 법 `m` 위에서 느린 자리와 빠른 자리가 처음 같아지는 걸음 — 정본과 같은 두 속도로 따로 실행한다. */
export function meetStep(m: bigint, c: bigint = C0): number {
  let x = X0 % m;
  let y = X0 % m;
  for (let k = 1; ; k++) {
    x = (x * x + c) % m;
    y = (y * y + c) % m;
    y = (y * y + c) % m;
    if (x === y) return k;
  }
}

/* ───────────────────────── 시행 나눗셈 ───────────────────────── */

/**
 * 시행 나눗셈 편의 절차로 `n` 의 약수를 찾을 때의 나눗셈 수. 그 편의 절차는 2 · 3 으로 나눈 뒤 6k±1 후보를
 * 5 부터 차례로 나눠 첫 약수에서 멈춘다. 가장 작은 소인수 `p` 가 5 이상이면 `p` 까지의 후보를 모두 나누므로
 * `2 + C(p)` 번이다(`C` 는 그 편의 닫힌 형태). `n < 2^53` 이면 그 편의 세는 판(`countRun`)을 실제로 돌려 맞춘다.
 */
export function trialOps(n: bigint): number {
  const p = factorize2(n);
  if (p < 5n)
    throw new Error(`가장 작은 소인수가 5 이상인 입력만 받는다 — ${n}`);
  const closed = 2 + candidateCount(Number(p));
  if (n < 1n << 53n) {
    const ran = countRun(Number(n)).divisions;
    if (ran !== closed) throw new Error(`닫힌 형태와 실행이 다르다 — ${n}`);
  }
  return closed;
}

/** 가장 작은 소인수 — 정본이 돌려주는 약수를 끝까지 갈라 얻는다. 큰 입력에도 쓴다. */
export function factorize2(n: bigint): bigint {
  if (isPrime(n)) return n;
  const d = pollardRho(n);
  const a = factorize2(d);
  const b = factorize2(n / d);
  return a < b ? a : b;
}

/** 두 소인수가 같은 자릿수인 입력 — `10^e` 위 첫 소수와 `10^e + 1,000` 위 첫 소수의 곱. */
export function balanced(e: number): { n: bigint; p: bigint; q: bigint } {
  const p = nextPrime(10n ** BigInt(e));
  const q = nextPrime(10n ** BigInt(e) + 1_000n);
  return { n: p * q, p, q };
}

/** 규모 `2^b` 아래에서 가장 작은 소인수가 가장 클 수 있는 입력 — `2^(b/2)` 아래 가장 큰 소수의 제곱. */
export function squareBelow(bits: number): { n: bigint; p: bigint } {
  const p = prevPrime(1n << BigInt(bits / 2));
  return { n: p * p, p };
}

/* ───────────────────────── 걸음 재생 패널 ───────────────────────── */

export interface WalkStep {
  readonly id: string;
  readonly branch: string;
  readonly title: string;
  readonly detail: string;
  readonly stage: ArrayStep;
}

export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: `x mod ${num(WALK)}`,
  rangeLabel: "만든 수열",
};

/**
 * 전개 입력의 걸음 — 무대는 수열 칸 `x_0 … x_2k` 이다. 칸 `i` 가 수열의 `i` 번째 값이고, 느린 자리 `x` 는
 * 칸 `k`, 빠른 자리 `y` 는 칸 `2k` 에 선다. 그 아래 두 줄은 같은 칸을 두 소인수로 줄인 값이다 — 코드는 이
 * 두 줄을 계산하지 않고, 최대공약수가 그 줄에서 일어난 일을 대신 알아챈다.
 */
export function walkSteps(n: bigint = WALK): WalkStep[] {
  const r = run(n);
  const round = r.rounds[0];
  if (r.exit !== "로" || round === undefined || r.rounds.length !== 1) {
    throw new Error("전개 입력은 첫 상수 하나로 로 루프에서 답해야 한다");
  }
  const last = round.steps.length;
  const cells = sequence(n, 2 * last + 1);
  const len = cells.length;
  const shown = (upto: number) =>
    cells.map((v, i) => (i <= upto ? num(v) : null));
  const layer = (m: bigint, upto: number, read: number[], write: number[]) => ({
    name: `x mod ${num(m)}`,
    values: cells.map((v, i) => (i <= upto ? num(v % m) : null)),
    read,
    write,
  });
  const empty = Array.from({ length: len }, () => null);
  let ops = 0;
  const vars = (c: string) => `c = ${c} · 나머지 연산 ${num(ops)}`;
  const steps: WalkStep[] = [];

  ops += 1;
  steps.push({
    id: "T1",
    branch: "①",
    title: "짝수인가",
    detail: `${num(n)}${을를(num(n))} 2 로 나눈 나머지가 ${num(n % 2n)}${josa(num(n % 2n), "이라", "라")} 짝수가 아닙니다. 수열은 아직 한 칸도 만들지 않았습니다.`,
    stage: {
      array: empty,
      range: null,
      read: [],
      write: [],
      calc: { expr: `${num(n)} mod 2`, result: num(n % 2n) },
      vars: vars("—"),
      layers: [
        { name: `x mod ${num(P)}`, values: empty, read: [], write: [] },
        { name: `x mod ${num(Q)}`, values: empty, read: [], write: [] },
      ],
    },
  });

  ops += r.primeOps;
  steps.push({
    id: "T2",
    branch: "②",
    title: "소수인가",
    detail: `밑 열둘의 판정이 합성수라고 답합니다. 이 판정이 나머지 연산 ${num(r.primeOps)} 번을 씁니다.`,
    stage: {
      array: empty,
      range: null,
      read: [],
      write: [],
      calc: { expr: `소수 판정(${num(n)})`, result: "합성수" },
      vars: vars("—"),
      layers: [
        { name: `x mod ${num(P)}`, values: empty, read: [], write: [] },
        { name: `x mod ${num(Q)}`, values: empty, read: [], write: [] },
      ],
    },
  });

  steps.push({
    id: "T3",
    branch: "③④",
    title: "수열을 시작한다",
    detail: `상수 c = ${num(round.c)}${이가(num(round.c))} 수열 하나를 정합니다. 두 자리를 칸 0 의 ${num(X0)} 에 두고, d 는 계산하지 않고 1 로 둡니다.`,
    stage: {
      array: shown(0),
      range: [0, 0],
      read: [],
      write: [0],
      pointers: { x: 0, y: 0 },
      calc: {
        expr: `f(t) = (t² + ${num(round.c)}) mod ${num(n)}`,
        result: `x = y = ${num(X0)} · d = 1`,
      },
      vars: vars(num(round.c)),
      layers: [layer(P, 0, [], [0]), layer(Q, 0, [], [0])],
    },
  });

  for (const s of round.steps) {
    ops += 3 + s.gcdOps;
    const k = s.k;
    const done = s.d !== 1n;
    steps.push({
      id: `T${3 + k}`,
      branch: "⑤⑥",
      title: `${k} 걸음`,
      detail: done
        ? `x 는 칸 ${k}, y 는 칸 ${2 * k}${으로(String(2 * k))} 갑니다. 두 칸이 법 ${num(P)} 에서 같은 값 ${num(s.x % P)}${이가(num(s.x % P))} 되어 최대공약수가 ${num(s.d)}${을를(num(s.d))} 냅니다.`
        : `x 는 칸 ${k}, y 는 칸 ${2 * k}${으로(String(2 * k))} 갑니다. 두 칸의 차와 ${num(n)} 의 최대공약수가 1 이라 한 걸음 더 갑니다.`,
      stage: {
        array: shown(2 * k),
        range: [0, 2 * k],
        read: [k, 2 * k],
        write: [2 * k - 1, 2 * k],
        pointers: { x: k, y: 2 * k },
        calc: {
          expr: `gcd(|${num(s.x)} − ${num(s.y)}|, ${num(n)})`,
          result: num(s.d),
        },
        vars: vars(num(round.c)),
        layers: [
          layer(P, 2 * k, [k, 2 * k], [2 * k - 1, 2 * k]),
          layer(Q, 2 * k, [k, 2 * k], [2 * k - 1, 2 * k]),
        ],
      },
    });
  }

  const endStep = round.steps[last - 1] as Step;
  steps.push({
    id: `T${4 + last}`,
    branch: "⑦",
    title: "비자명한 약수를 돌려준다",
    detail: `d = ${num(r.answer)}${이가(num(r.answer))} 1 도 ${num(n)} 도 아니라 그대로 돌려줍니다. ${num(n)} ÷ ${num(r.answer)} = ${num(n / r.answer)} 입니다.`,
    stage: {
      array: shown(2 * last),
      range: [0, 2 * last],
      read: [],
      write: [],
      pointers: { x: endStep.k, y: 2 * endStep.k },
      calc: {
        expr: `${num(r.answer)} ≠ ${num(n)}`,
        result: `${num(r.answer)} 반환`,
      },
      vars: vars(num(round.c)),
      layers: [layer(P, 2 * last, [], []), layer(Q, 2 * last, [], [])],
    },
  });
  if (ops !== r.ops) {
    throw new Error(`걸음마다 더한 연산 ${ops} 과 기록의 ${r.ops} 이 다르다`);
  }
  return steps;
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 기록에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자 그대로 옮긴
 * 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는 `pollardRho-guide.test.ts` 가
 * 잰다.
 */
export function simStepsFromRef() {
  return walkSteps().map((s) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...s.stage,
  }));
}

/* ───────────────────────── ρ 모양 그림 ───────────────────────── */

/** 원 위 칸 사이의 거리(픽셀) — 정점 네모가 66 × 44 이고 값이 네 자리면 넓어져 이만큼 띄워야 안 겹친다. */
const RING_GAP = 118;
/** 꼬리 칸 사이의 세로 거리(픽셀). */
const TAIL_GAP = 72;

/**
 * 법 `m` 위 수열의 ρ 모양을 정점과 간선으로 놓는다. `id` 머리에 `prefix` 를 붙여 한 그림에 둘을 놓을 수
 * 있게 한다. 정점 이름은 값, 값 줄은 그 값이 나오는 자리(`x₁ · x₄`)다. `upto` 까지의 자리를 적는다.
 */
function rhoScene(
  m: bigint,
  prefix: string,
  left: number,
  upto: number,
): { nodes: GraphNode[]; edges: GraphEdge[]; members: string[]; s: Shape } {
  const s = shape(m);
  const seq = sequence(m, upto + 1);
  const where = (v: bigint) =>
    seq
      .map((w, i) => (w === v ? `x${sub(i)}` : ""))
      .filter((t) => t !== "")
      .join(" · ");
  const lam = s.lambda;
  const radius = Math.max(
    RING_GAP / (2 * Math.sin(Math.PI / lam)),
    RING_GAP / 1.8,
  );
  const cx = left + radius;
  const cy = radius;
  const nodes: GraphNode[] = [];
  const id = (i: number) => `${prefix}${i}`;
  // 마디 — 칸 mu 가 원의 맨 아래, 그다음 칸들이 시계 반대 방향으로 돈다(화면에서는 오른쪽 위로).
  for (let j = 0; j < lam; j++) {
    const i = s.mu + j;
    const angle = Math.PI / 2 - (2 * Math.PI * j) / lam;
    nodes.push({
      id: id(i),
      x: Math.round(cx + radius * Math.cos(angle)),
      y: Math.round(cy + radius * Math.sin(angle)),
      label: num(s.values[i] as bigint),
      value: where(s.values[i] as bigint),
    });
  }
  // 꼬리 — 칸 mu − 1 이 원 바로 아래, 칸 0 이 맨 아래.
  for (let i = s.mu - 1; i >= 0; i--) {
    nodes.push({
      id: id(i),
      x: Math.round(cx),
      y: Math.round(cy + radius + TAIL_GAP * (s.mu - i)),
      label: num(s.values[i] as bigint),
      value: where(s.values[i] as bigint),
    });
  }
  const edges: GraphEdge[] = [];
  for (let i = 0; i < s.mu + lam - 1; i++) {
    edges.push({ from: id(i), to: id(i + 1), kind: "plain" });
  }
  // 마디의 끝에서 마디의 처음으로 — 되풀이가 시작되는 간선이다.
  edges.push({
    from: id(s.mu + lam - 1),
    to: id(s.mu),
    kind: "back",
    label: "되풀이",
  });
  return { nodes, edges, members: nodes.map((n) => String(n.id)), s };
}

/** ρ 모양 여럿을 옆으로 늘어놓은 장면. */
function rhoRow(mods: readonly bigint[], upto: (m: bigint) => number) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const groups: GraphGroup[] = [];
  let left = 0;
  for (const [k, m] of mods.entries()) {
    const r = rhoScene(m, `m${k}-`, left, upto(m));
    nodes.push(...r.nodes);
    edges.push(...r.edges);
    groups.push({
      members: r.members,
      label: `법 ${num(m)} — 꼬리 ${r.s.mu} 칸 · 마디 ${r.s.lambda} 칸`,
    });
    const right = Math.max(...r.nodes.map((n) => n.x));
    left = right + 170;
  }
  return { nodes, edges, groups, unit: { x: 1, y: 1 } };
}

/** 느린 자리와 빠른 자리를 법 `m` 의 ρ 위에 놓은 필름 — `k = 0` 부터 두 자리가 처음 만나는 걸음까지. */
function floydFrames(m: bigint) {
  const meet = meetStep(m);
  const base = rhoScene(m, "f-", 0, 0);
  const s = base.s;
  // 칸 i 가 ρ 의 어느 정점인가 — 마디 안이면 되풀이를 접는다.
  const nodeOf = (i: number) => (i < s.mu ? i : s.mu + ((i - s.mu) % s.lambda));
  const frames = [];
  for (let k = 0; k <= meet; k++) {
    const xi = nodeOf(k);
    const yi = nodeOf(2 * k);
    const seq = sequence(m, 2 * k + 1);
    const xv = seq[k] as bigint;
    const yv = seq[2 * k] as bigint;
    const nodes = base.nodes.map((node) => {
      const i = Number(String(node.id).slice(2));
      const here = [i === xi ? "x" : "", i === yi ? "y" : ""]
        .filter((t) => t !== "")
        .join(" · ");
      return {
        ...node,
        value: here,
        state:
          i === xi && i === yi
            ? ("focus" as const)
            : i === xi || i === yi
              ? ("read" as const)
              : undefined,
      };
    });
    frames.push({
      id: `k = ${k}`,
      text:
        k === 0
          ? `x = y = x${sub(0)} = ${num(xv)} 에서 출발한다`
          : `x = x${sub(k)} = ${num(xv)} · y = x${sub(2 * k)} = ${num(yv)}${xv === yv ? " — 같은 칸이다" : ""}`,
      scene: {
        nodes,
        edges: base.edges,
        groups: [],
        unit: { x: 1, y: 1 },
      },
    });
  }
  return frames;
}

/* ───────────────────────── 시도 사다리 ───────────────────────── */

export interface PairsRun {
  /** 모은 수열 값의 개수. */
  readonly values: number;
  /** 최대공약수를 본 쌍의 수. */
  readonly pairs: number;
  /** 나머지 연산 — 수열 한 칸에 하나, 최대공약수의 나머지마다 하나. */
  readonly ops: number;
  readonly d: bigint;
}

/**
 * 「값을 모아 쌍마다 최대공약수」 판 — 수열 값을 한 칸씩 늘리며, 새 값과 앞의 모든 값의 차를 `n` 과
 * 최대공약수로 본다. 1 도 `n` 도 아닌 값이 처음 나오면 멈춘다. 첫 상수 하나만 쓰고, 짝수 · 소수는 받지 않는다.
 */
export function pairsRun(n: bigint): PairsRun {
  const xs: bigint[] = [X0];
  let pairs = 0;
  let ops = 0;
  for (;;) {
    const t = xs.at(-1) as bigint;
    ops += 1;
    const v = (t * t + C0) % n;
    for (const w of xs) {
      pairs += 1;
      const g = gcdCounted(v > w ? v - w : w - v, n);
      ops += g.ops;
      if (g.g !== 1n && g.g !== n) {
        return { values: xs.length + 1, pairs, ops, d: g.g };
      }
    }
    xs.push(v);
  }
}

function approaches(): Approach[] {
  const worst = squareBelow(64);
  const trial = trialOps(worst.n);
  const mid = balanced(5);
  const pairs = pairsRun(mid.n);
  const trialMid = trialOps(mid.n);
  const ours = count(worst.n);
  const oursMid = count(mid.n);
  return [
    {
      name: "시행 나눗셈",
      idea: "2 · 3 과 6k±1 후보로 차례로 나눠 첫 약수를 찾는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `2^64 아래에서 가장 작은 소인수가 가장 큰 입력에서 나눗셈 ${num(trial)} 번 · ${seconds(trial)}`,
          ok: false,
        },
      ],
      lesson: "약수를 하나씩 시험하는 한 가장 작은 소인수 p 까지 간다",
    },
    {
      name: "값을 모아 쌍마다 최대공약수",
      idea: "수열 값을 모으며 두 값의 차와 n 의 최대공약수를 쌍마다 본다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: "법 p 에서 같은 두 값이 나오면 p 의 배수가 나온다",
          ok: true,
        },
        {
          label: "시간",
          value: `두 소인수가 10^5 근방이면 값 ${num(pairs.values)} 개 · 쌍 ${num(pairs.pairs)} 개 · 나머지 연산 ${num(pairs.ops)} 번 · 시행 나눗셈 ${num(trialMid)} 번보다 많다`,
          ok: false,
        },
      ],
      lesson:
        "값의 수는 줄었지만 쌍의 수가 그 제곱이다 — 볼 쌍을 걸음마다 하나로 줄인다",
    },
    {
      name: "두 걸음 차이의 최대공약수",
      idea: "느린 자리 x_k 와 빠른 자리 x_2k 의 차만 걸음마다 본다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value:
            "한 번 겹친 수열은 그 뒤로 계속 겹쳐 두 자리가 언젠가 같은 칸에 놓인다",
          ok: true,
        },
        {
          label: "시간",
          value: `10^5 근방 두 소인수에서 나머지 연산 ${num(oursMid.ops)} 번 · 2^64 아래에서 ${num(ours.ops)} 번 · ${seconds(ours.ops)}`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  /** 전체 컨셉 — 같은 수열을 법 97 과 법 8,051 로 읽은 ρ 모양 둘. */
  "concept-rho": () => {
    const sp = shape(P);
    const sn = shape(WALK);
    const scene = rhoRow([P, WALK], (m) => shape(m).mu + shape(m).lambda);
    return (
      <NodeGraph
        title={`같은 수열을 두 법으로 읽은 모양 — 법 ${num(P)} 에서는 x${sub(sp.mu + sp.lambda)}, 법 ${num(WALK)} 에서는 x${sub(sn.mu + sn.lambda)} 에서 처음 되풀이된다`}
        {...scene}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`2 ≤ n < 2^64 · 1 초(기본 연산 1 초에 ${num(OPS_PER_SECOND)} 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  /** 먼저 알아 둘 개념 — 전개 입력의 두 소인수로 읽은 ρ 모양. 값 줄은 전개가 만드는 x₀ … x₆ 의 자리다. */
  "build-rho": () => {
    const scene = rhoRow([P, Q], (m) =>
      Math.max(6, shape(m).mu + shape(m).lambda),
    );
    return (
      <NodeGraph
        title={`8,051 의 두 소인수로 읽은 수열 — 법 ${num(P)} 과 법 ${num(Q)} 의 ρ 모양`}
        {...scene}
      />
    );
  },
  /** 3단계 — 법 97 의 ρ 위에서 느린 자리와 빠른 자리가 처음 같은 칸에 서는 걸음까지. */
  "build-floyd": () => (
    <NodeGraphFilm
      title={`법 ${num(P)} 의 ρ 위에서 두 자리 — k = ${meetStep(P)} 에서 같은 칸에 놓인다`}
      frames={floydFrames(P)}
    />
  ),
  "walk-run": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.stage.calc?.expr} → ${s.stage.calc?.result}`,
      rows: arrayStage(s.stage, ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`pollardRho(${WALK}n) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns((steps[0] as WalkStep).stage)}
        frames={frames}
      />
    );
  },
};
