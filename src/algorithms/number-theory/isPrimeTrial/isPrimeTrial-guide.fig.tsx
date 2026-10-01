/**
 * `isPrimeTrial-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)과 같은 절차를 실행해 받는다. 세는 사본이 둘이다.
 * `countRun` 은 나눗셈 횟수만 세는 가벼운 판이라 큰 입력(`10^12` 근방)에 쓰고, `traceRun` 은 걸음마다 무엇을
 * 나눴는지 남기는 판이라 전개 입력 같은 작은 입력에만 쓴다. 두 사본 다 답을 정본과 대조한다. 계측을 정본
 * 소스에서 `loadMutant` 로 만들지 않은 것은 `check-proof` 의 중화 실행이 `loadMutant` 를 정본 그대로 돌려주기
 * 때문이다 — 그때 계측이 비어 증명 블록이 거짓이 된다.
 *
 * 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `isPrimeTrial-guide.test.ts` 가 잰다. 증명 사이드카도 이 파일의 계측을 쓴다.
 */

import type { ReactElement } from "react";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
} from "../../../_viz/patterns/CellStage";
import { RangeCover } from "../../../_viz/patterns/RangeCover";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { isPrimeTrial } from "./isPrimeTrial-guide.ref.ts";

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력 — `deep.origin` · `deep.build` · `deep.walk` · `.sim.ts` 가 같은 것을 쓴다. */
export const WALK = 187;

/** 규모마다 그 아래 가장 큰 소수. 소수는 후보를 끝까지 쓰므로 이 절차의 최악 입력이다. */
export const LARGEST_PRIME_AT: Readonly<Record<string, number>> = {
  "10^3": 997,
  "10^4": 9_973,
  "10^6": 999_983,
  "10^9": 999_999_937,
  "10^12": 999_999_999_989,
};

/** 과제 규모 `10^12` 아래 가장 큰 소수 — 이 절차의 최악 입력이다. 근거는 본문 `deep.origin` ① 에 있다. */
export const WORST = LARGEST_PRIME_AT["10^12"] as number;

/** 1 초 예산 — 기본 연산 1 초에 1 억 번(체 편과 같다). */
export const OPS_PER_SECOND = 100_000_000;

export const num = (x: number): string => x.toLocaleString("en-US");
/** 예산 기준의 시간. 1 초가 안 되면 넷째 자리까지, 넘으면 둘째 자리까지 적는다. */
export const seconds = (ops: number): string => {
  const t = ops / OPS_PER_SECOND;
  const [whole, frac] = t.toFixed(t < 1 ? 4 : 2).split(".");
  return `${num(Number(whole))}.${frac} 초`;
};
export const yn = (b: boolean): string => (b ? "소수" : "소수 아님");

/** 사본의 답이 정본의 답과 같은지 확인한다. 다르면 다른 절차를 잰 것이다. */
export function assertSame(n: number, got: boolean): void {
  if (got !== isPrimeTrial(n)) {
    throw new Error(`사본과 정본의 답이 다르다 — n = ${n}`);
  }
}

/** 정의대로의 판정 — 2 부터 n − 1 까지 전부 나눠 본다. 작은 입력에만 쓴다. */
export function byDefinition(n: number): boolean {
  if (n < 2) return false;
  for (let d = 2; d < n; d++) if (n % d === 0) return false;
  return true;
}

/** 2 이상인 가장 작은 약수. 소수이거나 2 보다 작으면 `-1`. */
export function smallestFactor(n: number): number {
  if (n < 4) return -1;
  if (n % 2 === 0) return 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return d;
  return -1;
}

/* ───────────────────────── 세는 사본 ───────────────────────── */

export interface Counted {
  readonly prime: boolean;
  /** 나머지 연산 횟수 — 이 절차의 기본 연산이다(배열 칸을 읽고 쓰는 일이 없다). */
  readonly divisions: number;
  /** 루프 조건 `d * d <= n` 에서 계산한 `d * d` 가운데 가장 큰 값. 루프에 안 들어가면 0. */
  readonly maxSquare: number;
}

/** 정본과 같은 절차에 나눗셈 횟수만 덧붙인 가벼운 판. 큰 입력에 쓴다. 답은 정본과 대조한다. */
export function countRun(n: number): Counted {
  let divisions = 0;
  let maxSquare = 0;
  const done = (prime: boolean): Counted => {
    assertSame(n, prime);
    return { prime, divisions, maxSquare };
  };
  if (n < 2) return done(false);
  if (n === 2 || n === 3) return done(true);
  divisions++;
  if (n % 2 === 0) return done(false);
  divisions++;
  if (n % 3 === 0) return done(false);
  let d = 5;
  let step = 2;
  for (;;) {
    const sq = d * d;
    if (sq > maxSquare) maxSquare = sq;
    if (sq > n) return done(true);
    divisions++;
    if (n % d === 0) return done(false);
    d += step;
    step = 6 - step;
  }
}

/** 걸음 하나 — 정본의 갈래 ①~⑤ 가운데 어디를 지났는가. */
export type Event =
  | { readonly kind: "small"; readonly n: number }
  | {
      readonly kind: "pre";
      readonly mod2: number;
      readonly mod3: number;
    }
  | {
      readonly kind: "cond";
      readonly d: number;
      readonly step: number;
      readonly square: number;
      readonly holds: boolean;
    }
  | {
      readonly kind: "divide";
      readonly d: number;
      readonly step: number;
      readonly mod: number;
      /** 약수가 아니면 다음 후보, 약수면 `null`. */
      readonly next: number | null;
    };

export interface Trace {
  readonly events: readonly Event[];
  readonly prime: boolean;
  /** 나눠 본 수를 나눈 차례대로 — 사전 판정의 2 · 3 을 포함한다. */
  readonly divided: readonly number[];
}

/**
 * 정본과 같은 절차를 따라가며 걸음마다 무엇을 판정하고 나눴는지 남긴다. 작은 입력에만 쓴다 — 걸음마다
 * 기록을 남기므로 큰 입력은 `countRun` 으로 센다. 답은 정본과 대조한다.
 */
export function traceRun(n: number): Trace {
  const events: Event[] = [];
  const divided: number[] = [];
  const done = (prime: boolean): Trace => {
    assertSame(n, prime);
    return { events, prime, divided };
  };
  events.push({ kind: "small", n });
  if (n < 2) return done(false);
  if (n === 2 || n === 3) return done(true);
  divided.push(2, 3);
  events.push({ kind: "pre", mod2: n % 2, mod3: n % 3 });
  if (n % 2 === 0 || n % 3 === 0) return done(false);
  let d = 5;
  let step = 2;
  for (;;) {
    const square = d * d;
    const holds = square <= n;
    events.push({ kind: "cond", d, step, square, holds });
    if (!holds) return done(true);
    divided.push(d);
    const mod = n % d;
    events.push({
      kind: "divide",
      d,
      step,
      mod,
      next: mod === 0 ? null : d + step,
    });
    if (mod === 0) return done(false);
    d += step;
    step = 6 - step;
  }
}

/* ───────────────────────── 후보를 만드는 여러 판 ───────────────────────── */

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** 바퀴 `M` 을 나누는 소수 — 사전 판정에서 한 번씩 나눠 본다. `M = 1` 이면 없다. */
export function wheelPrimes(M: number): number[] {
  const out: number[] = [];
  let x = M;
  for (let p = 2; p <= x; p++) {
    if (x % p !== 0) continue;
    out.push(p);
    while (x % p === 0) x /= p;
  }
  return out;
}

/** 한 주기 `1 … M` 에서 `M` 과 서로소인 나머지 — 후보로 남는 자리다. */
export function wheelResidues(M: number): number[] {
  const out: number[] = [];
  for (let r = 1; r <= M; r++) if (gcd(r, M) === 1) out.push(r);
  return out;
}

/**
 * 바퀴 `M` 으로 후보를 만들어 `√n` 까지 나눠 볼 때의 나눗셈 횟수. `M` 의 소수를 먼저 한 번씩 나누고, 그
 * 뒤로는 가장 큰 그 소수보다 큰 수 가운데 `M` 과 서로소인 것만 차례로 나눈다. `M = 1` 이면 2 부터 전부,
 * `M = 2` 면 2 다음에 홀수 전부, `M = 6` 이면 정본과 같은 절차다. 답은 정본과 대조한다.
 */
export function wheelRun(n: number, M: number): Counted {
  const primes = wheelPrimes(M);
  let divisions = 0;
  const done = (prime: boolean): Counted => {
    assertSame(n, prime);
    return { prime, divisions, maxSquare: 0 };
  };
  if (n < 2) return done(false);
  if (primes.includes(n)) return done(true);
  for (const p of primes) {
    divisions++;
    if (n % p === 0) return done(false);
  }
  for (let d = (primes.at(-1) ?? 1) + 1; d * d <= n; d++) {
    if (gcd(d, M) !== 1) continue;
    divisions++;
    if (n % d === 0) return done(false);
  }
  return done(true);
}

/** 2 부터 `n − 1` 까지 전부 나눌 때의 나눗셈 횟수 — **실행하지 않고 센다**. 소수면 `n − 2` 번이다. */
export function naiveDivisions(n: number): number {
  const f = smallestFactor(n);
  return f === -1 ? n - 2 : f - 1;
}

/** `naiveDivisions` 가 실제로 나눠 본 횟수와 어긋나는 입력의 개수 — `n = 4 … 3,000` 전수. */
export function naiveMismatches(): number {
  let bad = 0;
  for (let n = 4; n <= 3_000; n++) {
    let real = 0;
    for (let d = 2; d < n; d++) {
      real++;
      if (n % d === 0) break;
    }
    if (real !== naiveDivisions(n)) bad++;
  }
  return bad;
}

/** 후보 개수의 닫힌 형태 — `x` 이하의 `6k±1` 후보 수(5 부터 센다). 본문 「수식 정의와 유도」의 `C(x)`. */
export function candidateCount(x: number): number {
  return Math.floor((x + 1) / 6) + Math.floor((x - 1) / 6);
}

/** 정본과 같은 걸음 폭으로 `x` 이하의 후보를 실제로 만든다. */
export function candidatesUpTo(x: number): number[] {
  const out: number[] = [];
  let d = 5;
  let step = 2;
  while (d <= x) {
    out.push(d);
    d += step;
    step = 6 - step;
  }
  return out;
}

const memo = new Map<string, unknown>();
/** 큰 입력의 계수는 한 번만 잰다 — 그림과 증명 블록이 같은 값을 여러 번 쓴다. */
export function once<T>(key: string, make: () => T): T {
  if (!memo.has(key)) memo.set(key, make());
  return memo.get(key) as T;
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

/** 후보 가운데 2 나 3 의 배수(2 · 3 자신은 빼고)를 나눈 횟수 — 결과가 이미 정해진 나눗셈이다. */
export function wastedOnTwoThree(n: number, M: number): number {
  const root = Math.floor(Math.sqrt(n));
  let wasted = 0;
  const primes = wheelPrimes(M);
  for (let d = (primes.at(-1) ?? 1) + 1; d <= root; d++) {
    if (gcd(d, M) !== 1) continue;
    if (d > 3 && (d % 2 === 0 || d % 3 === 0)) wasted++;
  }
  return wasted;
}

/** 과제 규모의 최악 입력에서 네 시도의 계수. 답은 넷 다 정본과 대조한다. */
export function approachCounts() {
  return once("approaches", () => ({
    naive: naiveDivisions(WORST),
    root: wheelRun(WORST, 1).divisions,
    rootWasted: wastedOnTwoThree(WORST, 1),
    odd: wheelRun(WORST, 2).divisions,
    oddWasted: wastedOnTwoThree(WORST, 2),
    wheel: countRun(WORST).divisions,
    wheelWasted: wastedOnTwoThree(WORST, 6),
  }));
}

function approaches(): Approach[] {
  const c = approachCounts();
  const fits = (ops: number) => ops <= OPS_PER_SECOND;
  const time = (ops: number) => ({
    label: "시간",
    value: `나눗셈 ${num(ops)} 번 · ${seconds(ops)}`,
    ok: fits(ops),
  });
  const waste = (count: number) => ({
    label: "2 · 3 의 배수 후보",
    value: `${num(count)} 번`,
    ok: count === 0,
  });
  return [
    {
      name: "2 부터 n − 1 까지 전부",
      idea: "소수의 정의 그대로 n 보다 작은 수로 전부 나눠 본다",
      verdict: "drop",
      checks: [{ label: "답", value: "맞다", ok: true }, time(c.naive)],
      lesson: "합성수의 작은 약수는 √n 을 넘지 않는다 — √n 에서 멈추면 어떨까",
    },
    {
      name: "√n 까지 전부",
      idea: "2 부터 ⌊√n⌋ 까지의 수로 전부 나눠 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        time(c.root),
        waste(c.rootWasted),
      ],
      lesson:
        "2 가 안 나누면 짝수도 안 나눈다 — 2 다음에는 홀수만 나누면 어떨까",
    },
    {
      name: "√n 까지 홀수만",
      idea: "2 를 한 번 나눠 본 뒤 3 · 5 · 7 · … 만 나눠 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        time(c.odd),
        waste(c.oddWasted),
      ],
      lesson: "3 이 안 나누면 3 의 배수도 안 나눈다 — 3 의 배수도 빼면 어떨까",
    },
    {
      name: "√n 까지 6k±1 만",
      idea: "2 와 3 을 나눠 본 뒤 5 · 7 · 11 · 13 · … 만 나눠 본다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        time(c.wheel),
        waste(c.wheelWasted),
      ],
    },
  ];
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly stage: ArrayStep;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. 칸의 값이 곧 수라 인덱스 줄을 뺀다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "수 d",
  rangeLabel: "⌊√n⌋ 까지",
  valueAxis: true,
};

/** 무대 아래 줄의 이름 — 나눠 본 수마다 `n mod d` 를 적는다. 정본은 이 값을 모아 두지 않는다. */
export const MOD_LAYER = "n mod d";

/** 후보가 아닌 수(2 · 3 의 배수)의 칸 표시. 그 칸은 끝까지 나누지 않는다. */
export const NOT_CANDIDATE = "—";

/**
 * 입력 `n` 의 걸음 전부. 무대의 줄은 2 부터 `⌊√n⌋` 까지의 수이고, 수 `m` 은 칸 `m − 2` 에 선다. 후보가 아닌 수
 * (2 · 3 자신을 뺀 2 · 3 의 배수)는 걸음마다 윗줄과 「n mod d」 줄 모두에서 「이번 걸음 밖」으로 둔다. 번호는
 * T1 부터 붙인다.
 */
export function walkSteps(n: number = WALK): Step[] {
  const tr = traceRun(n);
  const root = Math.floor(Math.sqrt(n));
  const numbers = Array.from({ length: root - 1 }, (_, k) => k + 2);
  const at = (m: number): number => m - 2;
  const skipped = numbers.filter((m) => m > 3 && (m % 2 === 0 || m % 3 === 0));
  const mods: (number | string | null)[] = numbers.map((m) =>
    skipped.includes(m) ? NOT_CANDIDATE : null,
  );
  let divisions = 0;
  const steps: Step[] = [];
  let t = 0;
  for (const e of tr.events) {
    let title: string;
    let text: string;
    let read: number[] = [];
    let write: number[] = [];
    let calc: ArrayStep["calc"] = null;
    let pointers: Record<string, number> | undefined;
    let vars: string | null = null;
    if (e.kind === "small") {
      title = "n < 2 와 n = 2 · 3 을 본다";
      text = `${n}${은는(n)} 2 보다 작지 않고 2 도 3 도 아니라서 ①과 ②가 둘 다 거짓입니다. 아직 한 번도 나누지 않았습니다.`;
      calc = { expr: `${n} < 2`, result: "거짓" };
    } else if (e.kind === "pre") {
      mods[at(2)] = e.mod2;
      mods[at(3)] = e.mod3;
      divisions += 2;
      read = [at(2), at(3)];
      write = [at(2), at(3)];
      title = "2 와 3 으로 나눠 본다";
      text = `③이 ${n}${을를(n)} 2 와 3 으로 나눕니다. 나머지가 ${e.mod2}${과와(e.mod2)} ${e.mod3}${josa(e.mod3, "이라", "라")} 둘 다 약수가 아니고, 후보가 아닌 칸은 이 두 나눗셈이 대신 답했습니다.`;
      calc = {
        expr: `${n} mod 2 · ${n} mod 3`,
        result: `${e.mod2} · ${e.mod3}`,
      };
    } else if (e.kind === "cond") {
      read = [at(e.d)];
      pointers = { d: e.d };
      vars = `step = ${e.step}`;
      title = `d = ${e.d} · ${e.square} ${e.holds ? "≤" : ">"} ${n}`;
      text = e.holds
        ? `루프 조건 d × d ≤ n 이 ${e.square} ≤ ${n}${으로(n)} 참이라 후보 ${e.d}${을를(e.d)} 나눠 봅니다.`
        : `루프 조건 d × d ≤ n 이 ${e.square} > ${n}${으로(n)} 거짓이라 루프가 끝납니다.`;
      calc = {
        expr: `${e.d} × ${e.d}`,
        result: `${e.square} ${e.holds ? "≤" : ">"} ${n}`,
      };
    } else {
      mods[at(e.d)] = e.mod;
      divisions++;
      read = [at(e.d)];
      write = [at(e.d)];
      pointers = { d: e.d };
      vars = `step = ${e.step}`;
      title =
        e.next === null
          ? `${n} mod ${e.d} = 0 · 약수를 찾았다`
          : `${n} mod ${e.d} = ${e.mod} · 다음 후보 ${e.next}`;
      text =
        e.next === null
          ? `나머지가 0 이라 ${e.d}${이가(e.d)} 약수입니다. ${n}${은는(n)} 소수가 아니고 false 를 돌려줍니다.`
          : `나머지가 ${e.mod}${josa(e.mod, "이라", "라")} ${e.d}${은는(e.d)} 약수가 아닙니다. d 에 step ${e.step}${을를(e.step)} 더해 다음 후보는 ${e.next} 입니다.`;
      calc = { expr: `${n} mod ${e.d}`, result: `${e.mod}` };
    }
    steps.push({
      id: `T${++t}`,
      title,
      text,
      stage: {
        array: numbers,
        range: [0, numbers.length - 1],
        out: skipped.map(at),
        read,
        write: [],
        ...(pointers ? { pointers } : {}),
        calc,
        vars,
        rangeSide: `√${n} = ${Math.sqrt(n).toFixed(2)}`,
        layers: [
          {
            name: MOD_LAYER,
            values: [...mods],
            write,
            // 후보가 아닌 수는 이 줄에서도 윗줄처럼 「이번 걸음 밖」이다.
            out: skipped.map(at),
            side: `나눗셈 ${divisions} 번`,
          },
        ],
      },
    });
  }
  return steps;
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 걸음 기록에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자 그대로
 * 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `isPrimeTrial-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return walkSteps().map((s) => ({
    title: `${s.id} ${s.title}`,
    text: s.text,
    ...s.stage,
  }));
}

const film = (steps: readonly Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(s.stage, ARRAY_OPTIONS),
  }));

const columnsOf = (steps: readonly Step[]): number =>
  Math.max(...steps.map((s) => arrayColumns(s.stage)));

/* ───────────────────────── 그림 ───────────────────────── */

/** 전체 컨셉 그림의 수 줄 — 2 부터 187 의 큰 약수 17 까지. */
function conceptPairs(): ReactElement {
  const f = smallestFactor(WALK);
  const big = WALK / f;
  const root = Math.floor(Math.sqrt(WALK));
  const values = Array.from({ length: big - 1 }, (_, k) => k + 2);
  const at = (m: number) => m - 2;
  const states: Partial<Record<number, CellState>> = {};
  for (const m of values) if (m > root) states[at(m)] = "out";
  states[at(f)] = "focus";
  states[at(big)] = "read";
  return (
    <RangeCover
      title={`${WALK} = ${f} × ${big} — 작은 약수 ${f}${은는(f)} ⌊√${WALK}⌋ = ${root} 안에 있다`}
      row={{ label: "수", values, states }}
      ranges={[
        {
          from: 0,
          to: at(root),
          tone: "query",
          note: `2 부터 ⌊√${WALK}⌋ = ${root} 까지`,
        },
      ]}
      indexLabel="칸"
      annotation={{
        cells: [at(f), at(big)],
        text: `${WALK} = ${f} × ${big}`,
      }}
    />
  );
}

/** 6 으로 나눈 나머지가 1 · 5 인 수만 후보로 남는 모양 — 5 부터 30 까지. */
function wheelSix(): ReactElement {
  const values = Array.from({ length: 26 }, (_, k) => k + 5);
  const residues = new Set(wheelResidues(6));
  const states: Partial<Record<number, CellState>> = {};
  values.forEach((m, i) => {
    if (!residues.has(m % 6)) states[i] = "out";
  });
  const cands = new Set(candidatesUpTo(30));
  const gaps = values.map((m) => {
    if (!cands.has(m) || m === 5) return "";
    const prev = [...cands].filter((c) => c < m).at(-1) as number;
    return `+${m - prev}`;
  });
  const candidateCells = values
    .map((m, i) => (cands.has(m) ? i : -1))
    .filter((i) => i >= 0);
  return (
    <CellStage
      title="5 부터 30 까지 — 6 으로 나눈 나머지가 1 · 5 인 수만 후보로 남는다"
      columns={values.length}
      rows={[
        { kind: "cells", label: "수", values, states },
        {
          kind: "cells",
          label: "6 으로 나눈 나머지",
          values: values.map((m) => m % 6),
          states,
        },
        { kind: "caret", cells: candidateCells, side: "후보" },
        {
          kind: "cells",
          label: "앞 후보와의 간격",
          values: gaps,
          states,
        },
      ]}
    />
  );
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-pairs": conceptPairs,
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`n = ${num(WORST)}(10^12 아래 가장 큰 소수) · 1 초(기본 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-wheel": wheelSix,
  "walk-trial": () => {
    const steps = walkSteps();
    return (
      <CellStageFilm
        title={`isPrimeTrial(${WALK}) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={columnsOf(steps)}
        frames={film(steps)}
      />
    );
  },
};
