/**
 * `millerRabin-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림과 증명 블록과 걸음 재생 패널이 **같은 기록**을 쓴다. 기록은 `run` 이 만든다 — 정본과 같은 절차를
 * 따라가며 나머지 연산(`%`)을 실행한 만큼 세고, 밑마다 제곱 수열의 값을 적는 사본이다. 정본은 걸음마다의
 * 값도 연산 수도 내보내지 않으므로 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답은 사본이
 * 아니라 정본이 진다** — `run` 은 매번 정본에 같은 입력을 다시 물어 답이 다르면 던진다.
 *
 * **세는 단위는 원고 전체에서 하나다.** 기본 연산은 나머지 연산 한 번이다 — 사전 나눗셈 `n % a`, 이진
 * 거듭제곱이 시작할 때의 `1n % mod` · `base % mod`, 모듈러 곱셈 `(x * y) % n` 이 각각 하나다. 곱셈 · 비교 ·
 * 비트 연산은 세지 않는다. 시행 나눗셈 편(`isPrimeTrial`)과 같은 단위이고, 이진 거듭제곱 편(`fastPower`)의
 * 「모듈러 곱셈 한 번」이 여기서는 나머지 연산 한 번이다.
 *
 * **자리의 좌우.** 정적 그림(`CellStage`)은 `fastPower` 편의 약속대로 이진 표기처럼 높은 자리를 왼쪽에 둔다.
 * 걸음 재생 패널의 배열 무대는 칸이 밑 목록의 자리다.
 *
 * **큰 입력은 가벼운 판으로 잰다.** 규모를 훑는 표는 `opsSmall`(`number` 로 세는 판, `n < 2^26`)이나
 * `run` 의 연산 수만 쓰고, 걸음 기록을 쌓지 않는다.
 */

import type { ReactElement } from "react";
import { 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
import { candidateCount } from "../isPrimeTrial/isPrimeTrial-guide.fig.tsx";
import { millerRabin } from "./millerRabin-guide.ref.ts";

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 밑 목록 — 정본과 같다. 정본의 목록과 같은지는 `run` 이 답을 대조해 드러낸다. */
export const BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

/** 본문 전개가 쓰는 고정 입력. `49,141 = 157 × 313` 이다. */
export const WALK = 49_141n;

/** 계약의 상한. */
export const LIMIT = 1n << 64n;

/** 카마이클 수 가운데 가장 작은 것 — 전체 컨셉과 「아이디어를 떠올리는 과정」이 쓴다. */
export const CARMICHAEL = 561n;

/** 흔한 채점 환경의 예산 — 기본 연산 1 초에 1 억 번. 시행 나눗셈 편과 같은 값이다. */
export const OPS_PER_SECOND = 100_000_000;

export const num = (n: number | bigint): string => n.toLocaleString("en-US");

export const yn = (b: boolean): string => (b ? "소수" : "소수 아님");

export const bitsOf = (x: bigint): number => x.toString(2).length;

export const onesOf = (x: bigint): number =>
  [...x.toString(2)].filter((c) => c === "1").length;

/** 이진 거듭제곱 한 번의 모듈러 곱셈 수 — 비트마다 제곱 하나, 1 인 비트마다 곱 하나(`fastPower` 편). */
export const multsOf = (e: bigint): number =>
  e === 0n ? 0 : bitsOf(e) + onesOf(e);

/** `n - 1` 을 홀수 `d` 와 2 의 개수 `s` 로 가른다. */
export function split(n: bigint): { d: bigint; s: number } {
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s += 1;
  }
  return { d, s };
}

/** 정의대로의 거듭제곱 — 그림과 표가 수열의 값을 따로 맞춰 볼 때 쓴다. 연산을 세지 않는다. */
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n % mod;
  let b = base % mod;
  let e = exp;
  while (e > 0n) {
    if ((e & 1n) === 1n) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}

/** 시행 나눗셈으로 소수인지 — `number` 범위의 두 번째 판정기다. */
export function isPrimeByTrial(n: number): boolean {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

/** 가장 작은 소인수. 소수이거나 2 보다 작으면 `-1`. */
export function leastFactor(n: number): number {
  if (n < 4) return -1;
  if (n % 2 === 0) return 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return d;
  return -1;
}

/* ───────────────────────── 기록 ───────────────────────── */

/** 밑 하나의 강한 판정 기록. */
export interface BaseRun {
  readonly a: bigint;
  /** 계산한 제곱 수열 — `x[0] = a^d`, 그 뒤로 제곱할 때마다 하나씩. */
  readonly x: readonly bigint[];
  /** 첫 값이 1 이나 `n − 1` 이라 통과 · 제곱 루프가 `n − 1` 을 찾아 통과 · 증인. */
  readonly verdict: "first" | "loop" | "witness";
  /** 이 밑의 거듭제곱(`modPow`)이 쓴 기본 연산. */
  readonly powOps: number;
  /** 이 밑의 제곱 루프가 쓴 기본 연산. */
  readonly loopOps: number;
}

export type Stop = "small" | "equal" | "divided" | "witness" | "all";

export interface Run {
  readonly n: bigint;
  readonly answer: boolean;
  readonly stop: Stop;
  /** 사전 나눗셈의 나머지 — 밑 목록 순서. `n === a` 로 끝난 밑은 넣지 않는다. */
  readonly rems: readonly bigint[];
  /** 사전 나눗셈이 끝난 밑의 자리(0 부터). 끝까지 갔으면 `-1`. */
  readonly stopAt: number;
  readonly d: bigint;
  readonly s: number;
  readonly bases: readonly BaseRun[];
  /** 사전 나눗셈이 쓴 기본 연산. */
  readonly preOps: number;
  /** 전체 기본 연산. */
  readonly ops: number;
}

/**
 * 정본과 같은 절차를 따라가며 기록한다. 답은 정본에 다시 물어 대조하고 다르면 던진다.
 *
 * `bases` 로 밑 목록을 바꿀 수 있다 — 설계 선택 절이 밑 개수를 바꿔 보는 자리에서만 쓰고, 그때는 정본과
 * 답이 달라도 되므로 대조를 건너뛴다.
 */
export function run(n: bigint, bases: readonly bigint[] = BASES): Run {
  const custom = bases !== BASES;
  let ops = 0;
  const rems: bigint[] = [];
  const done = (
    answer: boolean,
    stop: Stop,
    stopAt: number,
    d: bigint,
    s: number,
    runs: BaseRun[],
    preOps: number,
  ): Run => {
    if (!custom && answer !== millerRabin(n)) {
      throw new Error(`기록 사본이 정본과 다른 답을 냈다 — n = ${n}`);
    }
    return {
      n,
      answer,
      stop,
      rems,
      stopAt,
      d,
      s,
      bases: runs,
      preOps,
      ops,
    };
  };
  if (n < 2n) return done(false, "small", -1, 0n, 0, [], 0);
  for (const [i, a] of bases.entries()) {
    if (n === a) return done(true, "equal", i, 0n, 0, [], ops);
    ops += 1;
    const r = n % a;
    rems.push(r);
    if (r === 0n) return done(false, "divided", i, 0n, 0, [], ops);
  }
  const preOps = ops;
  const { d, s } = split(n);
  const runs: BaseRun[] = [];
  for (const a of bases) {
    const before = ops;
    // 이진 거듭제곱 — `1n % n` 과 `a % n` 이 한 번씩, 그 뒤로 모듈러 곱셈마다 한 번.
    ops += 2;
    let result = 1n % n;
    let b = a % n;
    let e = d;
    while (e > 0n) {
      if ((e & 1n) === 1n) {
        ops += 1;
        result = (result * b) % n;
      }
      ops += 1;
      b = (b * b) % n;
      e >>= 1n;
    }
    const powOps = ops - before;
    let x = result;
    const xs = [x];
    if (x === 1n || x === n - 1n) {
      runs.push({ a, x: xs, verdict: "first", powOps, loopOps: 0 });
      continue;
    }
    let witness = true;
    for (let i = 1; i < s; i++) {
      ops += 1;
      x = (x * x) % n;
      xs.push(x);
      if (x === n - 1n) {
        witness = false;
        break;
      }
    }
    const loopOps = ops - before - powOps;
    runs.push({
      a,
      x: xs,
      verdict: witness ? "witness" : "loop",
      powOps,
      loopOps,
    });
    if (witness) return done(false, "witness", -1, d, s, runs, preOps);
  }
  return done(true, "all", -1, d, s, runs, preOps);
}

/**
 * 연산 수만 세는 가벼운 판 — `number` 로 계산한다. 곱이 `2^53` 안쪽이어야 하므로 `n < 2^26` 에서만 쓴다.
 * 규모를 훑는 표(수십만 입력)가 쓰고, 같은 값이 나오는지는 증명 블록이 `run` 과 대조한다.
 */
export function opsSmall(n: number): { ops: number; prime: boolean } {
  if (n >= 2 ** 26) throw new Error(`opsSmall 은 2^26 미만만 받는다 — ${n}`);
  let ops = 0;
  if (n < 2) return { ops, prime: false };
  for (const big of BASES) {
    const a = Number(big);
    if (n === a) return { ops, prime: true };
    ops += 1;
    if (n % a === 0) return { ops, prime: false };
  }
  let d = n - 1;
  let s = 0;
  while (d % 2 === 0) {
    d /= 2;
    s += 1;
  }
  for (const big of BASES) {
    const a = Number(big);
    ops += 2;
    let result = 1 % n;
    let b = a % n;
    let e = d;
    while (e > 0) {
      if (e % 2 === 1) {
        ops += 1;
        result = (result * b) % n;
      }
      ops += 1;
      b = (b * b) % n;
      e = Math.floor(e / 2);
    }
    let x = result;
    if (x === 1 || x === n - 1) continue;
    let witness = true;
    for (let i = 1; i < s; i++) {
      ops += 1;
      x = (x * x) % n;
      if (x === n - 1) {
        witness = false;
        break;
      }
    }
    if (witness) return { ops, prime: false };
  }
  return { ops, prime: true };
}

/** 한 밑의 강한 판정 — 설계 선택과 스윕이 쓴다. 연산을 세지 않는다. */
export function strongPasses(n: bigint, a: bigint): boolean {
  const { d, s } = split(n);
  let x = modPow(a, d, n);
  if (x === 1n || x === n - 1n) return true;
  for (let i = 1; i < s; i++) {
    x = (x * x) % n;
    if (x === n - 1n) return true;
  }
  return false;
}

/** 제곱 수열 전체 — `a^d` 부터 `a^(n−1)` 까지 `s + 1` 개. 코드가 계산하지 않는 끝 값까지 적는다. */
export function fullSequence(n: bigint, a: bigint): bigint[] {
  const { d, s } = split(n);
  const out = [modPow(a, d, n)];
  for (let r = 1; r <= s; r++) {
    const last = out[r - 1] as bigint;
    out.push((last * last) % n);
  }
  return out;
}

/* ───────────────────────── 시행 나눗셈 ───────────────────────── */

/**
 * 시행 나눗셈 편의 절차가 소수 `n` 하나에 쓰는 나눗셈 — `n % 2` · `n % 3` 두 번에 `⌊√n⌋` 이하의 `6k±1` 후보
 * 수를 더한다. 후보 수는 그 편의 닫힌 형태 `candidateCount` 를 쓴다(그 편 「수식 정의와 유도」). 실행 판과
 * 같은지는 증명 블록이 그 편의 세는 판과 대조한다.
 */
export const trialOpsForPrime = (n: bigint): number =>
  2 + candidateCount(Number(isqrt(n)));

/** `n` 의 정수 제곱근. */
export function isqrt(n: bigint): bigint {
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

/** `limit` 이하에서 가장 큰 소수. 정본으로 판정한다. */
export function largestPrimeAtMost(limit: bigint): bigint {
  let x = limit % 2n === 0n ? limit - 1n : limit;
  while (!millerRabin(x)) x -= 2n;
  return x;
}

/* ───────────────────────── 걸음 — 필름과 걸음 재생 패널 ───────────────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly stage: ArrayStep;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "밑 a",
  rangeLabel: "남은 밑",
};

const REM_LAYER = "n mod a";
const xLayerName = (r: number): string =>
  r === 0 ? "x₀ = a^d" : `x${"₀₁₂₃₄₅₆₇₈₉"[r]} = x${"₀₁₂₃₄₅₆₇₈₉"[r - 1]}²`;

/**
 * 전개 입력의 걸음 — `n < 2` 검사(T1) · 사전 나눗셈(T2) · `n − 1` 가르기(T3) · 밑마다 첫 값과 제곱 한 번씩.
 *
 * 무대는 밑 목록 열둘을 칸 하나씩 둔다. 괄호 「남은 밑」은 아직 판정을 내지 않은 밑이고 ▲ 는 이번에 보는
 * 밑이다. 그 아래 줄들이 이 알고리즘이 쌓는 값이다 — 줄 `n mod a` 는 사전 나눗셈의 나머지, 줄 `x₀` 이하는
 * 밑마다의 제곱 수열이다. 끝까지 빈 칸으로 남는 밑은 판정이 도중에 끝나 보지 않은 밑이다.
 */
export function walkSteps(n: bigint = WALK): Step[] {
  const t = run(n);
  if (t.stop !== "witness" && t.stop !== "all") {
    throw new Error("전개 입력은 밑 판정까지 내려가는 수여야 한다");
  }
  const k = BASES.length;
  const array = BASES.map((a) => String(a));
  const empty = (): (string | null)[] => Array.from({ length: k }, () => null);
  const remRow = empty();
  const xRows = Array.from({ length: Math.max(1, t.s) }, empty);
  const layers = (
    read: Record<string, number[]> = {},
    write: Record<string, number[]> = {},
  ) => [
    {
      name: REM_LAYER,
      values: [...remRow],
      read: read[REM_LAYER] ?? [],
      write: write[REM_LAYER] ?? [],
    },
    ...xRows.map((row, r) => ({
      name: xLayerName(r),
      values: [...row],
      read: read[xLayerName(r)] ?? [],
      write: write[xLayerName(r)] ?? [],
    })),
  ];
  const nn = num(n);
  const steps: Step[] = [];
  let ops = 0;
  const vars = (withDS: boolean) =>
    withDS
      ? `d = ${num(t.d)} · s = ${t.s} · 나머지 연산 ${ops}`
      : `나머지 연산 ${ops}`;
  steps.push({
    id: "T1",
    title: "n < 2 검사",
    detail: `${nn}${은는(nn)} 2 이상이라 n < 2 가 거짓입니다. 나머지 연산은 아직 한 번도 하지 않았습니다.`,
    stage: {
      array,
      range: [0, k - 1],
      read: [],
      write: [],
      calc: { expr: `${nn} < 2`, result: "거짓" },
      vars: vars(false),
      layers: layers(),
    },
  });
  t.rems.forEach((r, i) => {
    remRow[i] = String(r);
  });
  ops = t.preOps;
  const zero = t.rems.filter((r) => r === 0n).length;
  steps.push({
    id: "T2",
    title: "밑 목록으로 나눠 보기",
    detail: `${nn}${을를(nn)} 밑 열둘로 한 번씩 나눕니다. 나머지가 0 인 밑이 ${zero} 개라 여기서 답하지 않고, ${nn} 의 소인수는 전부 ${BASES.at(-1)} 보다 큽니다.`,
    stage: {
      array,
      range: [0, k - 1],
      read: BASES.map((_, i) => i),
      write: [],
      calc: {
        expr: `${nn} mod ${BASES[0]} … ${BASES.at(-1)}`,
        result: `0 인 칸 ${zero} 개`,
      },
      vars: vars(false),
      layers: layers({}, { [REM_LAYER]: BASES.map((_, i) => i) }),
    },
  });
  steps.push({
    id: "T3",
    title: "n − 1 가르기",
    detail: `n − 1 = ${num(n - 1n)}${을를(num(n - 1n))} 2 로 ${t.s} 번 나누면 홀수 ${num(t.d)}${이가(num(t.d))} 됩니다. d = ${num(t.d)}, s = ${t.s} 입니다.`,
    stage: {
      array,
      range: [0, k - 1],
      read: [],
      write: [],
      calc: {
        expr: `${num(n - 1n)} = ${num(t.d)} × 2^${t.s}`,
        result: `d = ${num(t.d)} · s = ${t.s}`,
      },
      vars: vars(true),
      layers: layers(),
    },
  });
  for (const [i, b] of t.bases.entries()) {
    const first = b.x[0] as bigint;
    xRows[0] = xRows[0] ?? empty();
    (xRows[0] as (string | null)[])[i] = num(first);
    ops += b.powOps;
    const passFirst = b.verdict === "first";
    steps.push({
      id: `T${steps.length + 1}`,
      title: `밑 ${b.a} 의 첫 값`,
      detail: `x₀ = ${b.a}^${num(t.d)} mod ${nn} = ${num(first)} 입니다. ${
        passFirst
          ? "1 이나 n − 1 이라 이 밑은 여기서 통과합니다."
          : "1 도 n − 1 도 아니라 제곱 루프로 내려갑니다."
      } 이 거듭제곱 하나가 나머지 연산 ${b.powOps} 번입니다.`,
      stage: {
        array,
        range: [i, k - 1],
        read: [i],
        write: [],
        calc: {
          expr: `${b.a}^${num(t.d)} mod ${nn}`,
          result: num(first),
        },
        vars: vars(true),
        layers: layers({}, { [xLayerName(0)]: [i] }),
      },
    });
    for (let r = 1; r < b.x.length; r++) {
      const prev = b.x[r - 1] as bigint;
      const cur = b.x[r] as bigint;
      (xRows[r] as (string | null)[])[i] = num(cur);
      ops += 1;
      const found = cur === n - 1n;
      steps.push({
        id: `T${steps.length + 1}`,
        title: `밑 ${b.a}${을를(String(b.a))} 제곱`,
        detail: `${num(prev)}² mod ${nn} = ${num(cur)} 입니다. ${
          found
            ? "n − 1 이라 이 밑은 통과하고 다음 밑으로 갑니다."
            : "n − 1 이 아닙니다."
        }`,
        stage: {
          array,
          range: [i, k - 1],
          read: [i],
          write: [],
          calc: {
            expr: `${num(prev)}² mod ${nn}`,
            result: found ? `${num(cur)} = n − 1` : num(cur),
          },
          vars: vars(true),
          layers: layers(
            { [xLayerName(r - 1)]: [i] },
            { [xLayerName(r)]: [i] },
          ),
        },
      });
    }
    if (b.verdict === "witness") {
      const seq = b.x.map(num).join(" → ");
      steps.push({
        id: `T${steps.length + 1}`,
        title: `밑 ${b.a}${이가(String(b.a))} 증인`,
        detail: `제곱 수열 ${seq}${이가(seq)} n − 1 을 한 번도 거치지 않고 끝났습니다. 밑 ${b.a}${이가(String(b.a))} 증인이라 남은 밑 ${k - 1 - i} 개는 보지 않고 false 를 돌려줍니다.`,
        stage: {
          array,
          range: [i, k - 1],
          read: [],
          write: [i],
          calc: { expr: `${seq} · n − 1 없음`, result: "증인 → false" },
          vars: vars(true),
          layers: layers({ [xLayerName(b.x.length - 1)]: [i] }),
        },
      });
    }
  }
  if (t.stop === "all") {
    steps.push({
      id: `T${steps.length + 1}`,
      title: "밑 열둘이 모두 통과",
      detail: "증인이 없어 true 를 돌려줍니다.",
      stage: {
        array,
        range: null,
        read: [],
        write: [],
        calc: { expr: "증인 0 개", result: "true" },
        vars: vars(true),
        layers: layers(),
      },
    });
  }
  return steps;
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 기록에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자 그대로 옮긴
 * 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는 `millerRabin-guide.test.ts` 가
 * 잰다.
 */
export function simStepsFromRef() {
  return walkSteps().map((s) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...s.stage,
  }));
}

/* ───────────────────────── 제곱 수열 그림 ───────────────────────── */

/**
 * `n − 1` 의 비트 위에 제곱 수열을 놓은 무대. 높은 자리를 왼쪽에 둔다(`fastPower` 편의 약속). 수열의 `r`
 * 번째 값 `x_r = a^(d·2^r)` 은 비트 자리 `s − r` 의 칸에 선다 — 그 칸과 그 왼쪽의 비트가 적는 수가 곧
 * `x_r` 의 지수다. 그래서 제곱할 때마다 지수가 한 칸씩 오른쪽으로 늘고, 끝 칸의 지수가 `n − 1` 이다.
 */
function sequenceRows(
  n: bigint,
  bases: readonly bigint[],
  mark: (a: bigint, r: number, seq: readonly bigint[]) => CellState | undefined,
): { rows: StageRow[]; columns: number } {
  const { d, s } = split(n);
  const bits = (n - 1n).toString(2).split("");
  const w = bits.length;
  const col = (bit: number) => w - 1 - bit;
  const blank = (): (string | null)[] => Array.from({ length: w }, () => null);
  const expRow = blank();
  for (let r = 0; r <= s; r++) {
    expRow[col(s - r)] = num((n - 1n) >> BigInt(s - r));
  }
  const rows: StageRow[] = [
    {
      kind: "index",
      label: "자리",
      labels: Array.from({ length: w }, (_, c) => w - 1 - c),
    },
    {
      kind: "bracket",
      label: "d",
      from: 0,
      to: col(s),
      tone: "query",
      text: `d = ${num(d)}`,
    },
    {
      kind: "cells",
      label: "n − 1 의 비트",
      values: bits,
      side: `n − 1 = ${num(n - 1n)}`,
    },
    {
      kind: "bracket",
      label: "2^s",
      from: col(s - 1),
      to: col(0),
      tone: "left",
      text: `s = ${s}`,
    },
    {
      kind: "cells",
      label: "지수",
      values: expRow,
      side: "그 칸까지의 비트가 적는 수",
    },
  ];
  for (const a of bases) {
    const seq = fullSequence(n, a);
    const row = blank();
    const states: Partial<Record<number, CellState>> = {};
    seq.forEach((x, r) => {
      row[col(s - r)] = num(x);
      const st = mark(a, r, seq);
      if (st) states[col(s - r)] = st;
    });
    const firstOne = seq.indexOf(1n);
    const before = firstOne > 0 ? seq[firstOne - 1] : undefined;
    rows.push({
      kind: "cells",
      label: `a = ${a}`,
      values: row,
      states,
      side:
        firstOne === 0
          ? "첫 값부터 1"
          : before === undefined
            ? "1 이 나오지 않는다"
            : `1 직전 ${num(before)}${before === n - 1n ? " = n − 1" : " ≠ n − 1"}`,
    });
  }
  return { rows, columns: w };
}

/** 1 이 처음 나오는 자리와 그 직전 자리를 읽음으로 표시한다. */
const markFirstOne = (_a: bigint, r: number, seq: readonly bigint[]) => {
  const firstOne = seq.indexOf(1n);
  return firstOne > 0 && (r === firstOne || r === firstOne - 1)
    ? ("read" as const)
    : undefined;
};

/* ───────────────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────────────── */

/** 페르마 판정 — `a^(n−1) mod n` 이 1 이면 통과. */
export const fermatPasses = (n: bigint, a: bigint): boolean =>
  modPow(a, n - 1n, n) === 1n;

/** 밑 2 의 페르마 판정을 통과하는 가장 작은 홀 합성수. */
export function firstFermatLiar(): bigint {
  for (let n = 9n; ; n += 2n) {
    if (!isPrimeByTrial(Number(n)) && fermatPasses(n, 2n)) return n;
  }
}

/** 서로소인 밑 가운데 페르마 판정 · 강한 판정을 통과하는 수. */
export function coprimeCounts(n: bigint): {
  coprime: number;
  fermat: number;
  strong: number;
} {
  const g = (x: bigint, y: bigint): bigint => (y === 0n ? x : g(y, x % y));
  let coprime = 0;
  let fermat = 0;
  let strong = 0;
  for (let a = 2n; a < n - 1n; a++) {
    if (g(a, n) !== 1n) continue;
    coprime += 1;
    if (fermatPasses(n, a)) fermat += 1;
    if (strongPasses(n, a)) strong += 1;
  }
  return { coprime, fermat, strong };
}

function approaches(): Approach[] {
  const top = largestPrimeAtMost(LIMIT - 1n);
  const trial = trialOpsForPrime(top);
  const liar = firstFermatLiar();
  const c = coprimeCounts(CARMICHAEL);
  const seq = fullSequence(CARMICHAEL, 2n);
  const firstOne = seq.indexOf(1n);
  const before = seq[firstOne - 1] as bigint;
  const ours = run(top);
  return [
    {
      name: "시행 나눗셈",
      idea: "2 · 3 과 √n 이하의 6k±1 후보로 차례로 나눠 약수를 찾는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `2^64 아래 가장 큰 소수에서 나눗셈 ${num(trial)} 번 · ${(trial / OPS_PER_SECOND).toFixed(1)} 초`,
          ok: false,
        },
      ],
      lesson: "약수를 찾는 한 √n 을 따라간다 — 소수만 갖는 성질을 확인한다",
    },
    {
      name: "밑 2 의 페르마 판정",
      idea: "2^(n−1) mod n 이 1 이 아니면 합성수, 1 이면 소수라고 답한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `${num(liar)}${을를(num(liar))} 소수라고 답한다 · ${num(liar)} = ${leastFactor(Number(liar))} × ${Number(liar) / leastFactor(Number(liar))}`,
          ok: false,
        },
        { label: "시간", value: "거듭제곱 한 번", ok: true },
      ],
      lesson: "밑 하나는 속는다 — 밑을 여럿 쓴다",
    },
    {
      name: "밑 여럿의 페르마 판정",
      idea: "서로 다른 밑마다 a^(n−1) mod n 을 보고 하나라도 1 이 아니면 합성수",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `561 과 서로소인 밑 ${c.coprime} 개가 전부 통과한다(통과 ${c.fermat} 개)`,
          ok: false,
        },
        { label: "시간", value: "밑마다 거듭제곱 한 번", ok: true },
      ],
      lesson: `a^(n−1) 하나만 보면 놓친다 — 1 직전 값 ${num(before)}${이가(num(before))} 합성수를 드러낸다`,
    },
    {
      name: "밑 열둘의 강한 판정",
      idea: "밑마다 제곱 수열을 만들어 1 직전 값이 n − 1 인지 본다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `561 에서 서로소인 밑 ${c.coprime} 개 중 ${c.strong} 개만 통과 · 밑 2 가 증인`,
          ok: true,
        },
        {
          label: "시간",
          value: `2^64 아래 가장 큰 소수에서 나머지 연산 ${num(ours.ops)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  /** 전체 컨셉 — 561 의 밑 2 제곱 수열. 1 직전 값이 560 이 아니다. */
  "concept-sequence": () => {
    const { rows, columns } = sequenceRows(CARMICHAEL, [2n], markFirstOne);
    const seq = fullSequence(CARMICHAEL, 2n);
    const firstOne = seq.indexOf(1n);
    return (
      <CellStage
        title={`561 의 밑 2 제곱 수열 — 1 직전 값이 ${num(seq[firstOne - 1] as bigint)} 이라 560 이 아니다`}
        columns={columns}
        rows={rows}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`0 ≤ n < 2^64 · 1 초(기본 연산 1 초에 ${num(OPS_PER_SECOND)} 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  /** 먼저 알아 둘 개념 — 전개 입력 49,141 의 제곱 수열 둘을 `n − 1` 의 비트 위에 놓는다. */
  "build-sequence": () => {
    const { rows, columns } = sequenceRows(WALK, [2n, 3n], markFirstOne);
    return (
      <CellStage
        title="49,141 의 제곱 수열 — x_r 은 비트 자리 s − r 의 칸에 서고, 그 칸까지의 비트가 지수다"
        columns={columns}
        rows={rows}
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
        title={`millerRabin(${WALK}n) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns((steps[0] as Step).stage)}
        frames={frames}
      />
    );
  },
};
