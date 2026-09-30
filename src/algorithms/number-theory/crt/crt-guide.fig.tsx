/**
 * `crt-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 확장 유클리드를 부르는 줄 뒤에 기록을 끼운
 * 계측 사본(`probed`)을 정본 소스에서 기계로 만들고, 그 기록으로 합치기마다의 `m` · `r` · `diff` · `g` · `u` 와
 * 합치기 전의 누적 합동식 `(curR, curM)` 을 얻는다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서
 * 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는 `crt-guide.test.ts` 가 잰다.
 *
 * **무대는 입력 합동식의 줄이다.** 칸 `i` 가 `i` 번째 합동식이고, 법 줄 아래에 나머지 줄과 누적 합동식의 두 줄
 * (`curR` · `curM`)을 쌓는다. 누적 합동식 줄의 칸 `i` 는 합동식 `0 … i` 를 합친 결과다. 괄호가 지금까지 합친
 * 합동식이고, 합치기 한 번마다 두 줄에 칸이 하나씩 채워진다.
 *
 * 큰 입력은 `divisions` 가 맡는다 — 기록 없이 값 몇 개만 세는 사본이라 입력이 커도 걸음마다 무엇을 베끼지 않는다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를 } from "../../../../tools/josa.ts";
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
import { crt } from "./crt-guide.ref.ts";

const REF = new URL("./crt-guide.ref.ts", import.meta.url).pathname;

export type Answer = { x: bigint; M: bigint } | null;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 확장 유클리드를 부른 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지 않으면
 * `loadMutant` 가 던진다. 기록하는 때는 `g` · `u` 를 얻은 직후, 모순 판정 직전이다. 그래서 모순으로 멈추는
 * 합치기도 기록에 남고, `curR` · `curM` 은 합치기 전의 누적 합동식이다.
 */
const probed = await loadMutant<{
  crt(r: bigint[], m: bigint[]): Answer;
}>(REF, {
  swap: [
    /^(\s*)const \{ g, x: u \} = gcdWithCoefficient\(curM, m\);$/,
    "$1const { g, x: u } = gcdWithCoefficient(curM, m);\n$1(globalThis as any).__merges.push({ m, r, diff, g, u, curR, curM });",
  ],
});

/** `[0, m)` 로 맞춘 나머지 — 정본의 `mod` 와 같은 식이다. 기록을 대조하는 데만 쓴다. */
export const mod = (a: bigint, m: bigint): bigint => {
  const r = a % m;
  return r < 0n ? r + m : r;
};

/** 합치기 한 번 — `i` 번째 합동식을 그때까지의 누적 합동식과 합친 기록. */
export interface Merge {
  /** 합동식 번호. 1 부터(0 번은 첫 합동식이라 합치기가 없다). */
  readonly i: number;
  readonly m: bigint;
  /** `[0, m)` 로 맞춘 나머지. */
  readonly r: bigint;
  readonly diff: bigint;
  readonly g: bigint;
  readonly u: bigint;
  /** 합치기 전의 누적 합동식. */
  readonly curR: bigint;
  readonly curM: bigint;
  /** `diff` 를 `g` 가 나누는가 — 아니면 여기서 `null` 로 멈춘다. */
  readonly ok: boolean;
  /** 합친 뒤의 값. 모순이면 없다. */
  readonly unit?: bigint;
  readonly t?: bigint;
  readonly nextR?: bigint;
  readonly nextM?: bigint;
}

export interface Trace {
  readonly remainders: readonly bigint[];
  readonly moduli: readonly bigint[];
  /** 첫 합동식을 받은 누적 합동식. */
  readonly first: { readonly curR: bigint; readonly curM: bigint };
  readonly merges: readonly Merge[];
  readonly answer: Answer;
}

/**
 * 정본 한 번 호출의 기록. 답은 정본과 대조하고, 합치기 사이의 값은 이렇게 대조한다 — 다음 합치기가 기록한
 * 누적 합동식이 앞 합치기가 옮긴 값인가, 마지막 누적 합동식이 정본의 답인가. 어긋나면 던진다.
 */
export function trace(remainders: bigint[], moduli: bigint[]): Trace {
  const store = globalThis as unknown as {
    __merges: {
      m: bigint;
      r: bigint;
      diff: bigint;
      g: bigint;
      u: bigint;
      curR: bigint;
      curM: bigint;
    }[];
  };
  store.__merges = [];
  const got = probed.crt([...remainders], [...moduli]);
  const answer = crt([...remainders], [...moduli]);
  const same =
    got === null || answer === null
      ? got === answer
      : got.x === answer.x && got.M === answer.M;
  if (!same) throw new Error("계측 사본이 정본과 다른 답을 냈다");
  const m0 = moduli[0] as bigint;
  const first = { curR: mod(remainders[0] as bigint, m0), curM: m0 };
  const merges: Merge[] = [];
  let curR = first.curR;
  let curM = first.curM;
  for (const [n, rec] of store.__merges.entries()) {
    if (rec.curR !== curR || rec.curM !== curM) {
      throw new Error(
        `합치기 ${n + 1} 의 누적 합동식이 앞 합치기의 결과가 아니다`,
      );
    }
    const ok = rec.diff % rec.g === 0n;
    if (!ok) {
      merges.push({ i: n + 1, ...rec, ok });
      break;
    }
    const unit = rec.m / rec.g;
    const t = mod((rec.diff / rec.g) * rec.u, unit);
    const nextR = rec.curR + rec.curM * t;
    const nextM = rec.curM * unit;
    if (mod(nextR, rec.m) !== rec.r || mod(nextR, rec.curM) !== rec.curR) {
      throw new Error(
        `합치기 ${n + 1} 의 결과가 두 합동식을 함께 만족하지 않는다`,
      );
    }
    merges.push({ i: n + 1, ...rec, ok, unit, t, nextR, nextM });
    curR = nextR;
    curM = nextM;
  }
  const last = merges.at(-1);
  if (last !== undefined && !last.ok) {
    if (answer !== null) throw new Error("모순으로 멈췄는데 정본이 답을 냈다");
  } else if (answer === null || answer.x !== curR || answer.M !== curM) {
    throw new Error("마지막 누적 합동식이 정본의 답과 다르다");
  }
  return { remainders, moduli, first, merges, answer };
}

/* ───────────────────────── 나눗셈 세기 ───────────────────────── */

/**
 * 정본과 같은 절차에 **나눗셈 횟수**만 세는 자리를 덧붙인 사본. `/` 나 `%` 한 번을 하나로 센다 — 나머지를
 * `[0, m)` 로 맞추는 `mod` 도 `%` 한 번이다. 기록을 남기지 않아 큰 입력에도 쓴다. 답은 정본과 대조한다.
 */
export function divisions(
  remainders: bigint[],
  moduli: bigint[],
): { count: number; gcdSteps: number[]; answer: Answer } {
  let count = 0;
  const gcdSteps: number[] = [];
  const md = (a: bigint, m: bigint): bigint => {
    count++;
    return mod(a, m);
  };
  const ext = (a: bigint, b: bigint): { g: bigint; x: bigint } => {
    let r0 = a;
    let r1 = b;
    let s0 = 1n;
    let s1 = 0n;
    let steps = 0;
    while (r1 !== 0n) {
      steps++;
      const q = r0 / r1;
      [r0, r1] = [r1, r0 - q * r1];
      [s0, s1] = [s1, s0 - q * s1];
    }
    count += steps;
    gcdSteps.push(steps);
    return { g: r0, x: s0 };
  };
  const merge = (): Answer => {
    let curM = moduli[0] as bigint;
    let curR = md(remainders[0] as bigint, curM);
    for (let i = 1; i < moduli.length; i++) {
      const m = moduli[i] as bigint;
      const r = md(remainders[i] as bigint, m);
      const diff = r - curR;
      const { g, x: u } = ext(curM, m);
      count++;
      if (diff % g !== 0n) return null;
      count++;
      const unit = m / g;
      count++;
      const t = md((diff / g) * u, unit);
      curR = curR + curM * t;
      curM = curM * unit;
    }
    return { x: curR, M: curM };
  };
  const answer = merge();
  const truth = crt([...remainders], [...moduli]);
  const same =
    truth === null || answer === null
      ? truth === answer
      : truth.x === answer.x && truth.M === answer.M;
  if (!same) throw new Error("세는 사본이 정본과 다른 답을 냈다");
  return { count, gcdSteps, answer };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK_R = [2n, 3n, 2n];
export const WALK_M = [3n, 5n, 7n];

/** 과제 규모 — 법 하나의 상한과 처리 속도(단순 연산 1 초에 1 억 번). */
export const LIMIT = 10n ** 18n;
export const PER_SECOND = 100_000_000n;
export const YEAR_SECONDS = 31_536_000n;

export const num = (n: number | bigint): string => n.toLocaleString("en-US");

let walkMemo: Trace | undefined;
/** 전개 입력의 기록. 그림 · 증명 · 패널이 같은 기록을 쓴다. */
export const walk = (): Trace => {
  walkMemo ??= trace(WALK_R, WALK_M);
  return walkMemo;
};

/* ───────────────── 가장 단순한 방법 — 후보를 차례로 만들어 보기 ───────────────── */

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b));
export const lcmAll = (ms: readonly bigint[]): bigint =>
  ms.reduce((acc, m) => (acc / gcd(acc, m)) * m, 1n);

/**
 * 가장 단순한 방법 — 한 합동식의 법 간격으로 후보를 작은 것부터 만들며 나머지 합동식을 확인한다. 본문
 * 「아이디어를 떠올리는 과정」의 `byListing` 과 같은 절차다. **실제로 끝까지 만든다** — 작은 입력에만 쓴다.
 * `base` 를 주면 그 합동식을 기준으로 삼는다(기본은 첫 합동식).
 *
 * 나눗셈은 정본과 같은 기준으로 센다 — 나머지를 `[0, m)` 로 맞추는 `%` · 주기 `M` 을 구하는 유클리드 호제법의
 * `%` 와 `/` · 후보마다 나머지를 확인하는 `%`. 답은 정본과 대조한다.
 */
export function byListing(
  remainders: bigint[],
  moduli: bigint[],
  base = 0,
): { tried: number; checks: number; divisions: number; found: bigint | null } {
  let divisions = 0;
  const gcdCounted = (a: bigint, b: bigint): bigint => {
    while (b !== 0n) {
      divisions++;
      [a, b] = [b, a % b];
    }
    return a;
  };
  let M = 1n;
  for (const m of moduli) {
    const g = gcdCounted(M, m);
    divisions++;
    M = (M / g) * m;
  }
  const want = remainders.map((r, i) => {
    divisions++;
    return mod(r, moduli[i] as bigint);
  });
  const mb = moduli[base] as bigint;
  let tried = 0;
  let checks = 0;
  let found: bigint | null = null;
  for (let x = want[base] as bigint; x < M; x += mb) {
    tried++;
    let ok = true;
    for (let i = 0; i < moduli.length; i++) {
      if (i === base) continue;
      checks++;
      divisions++;
      if (x % (moduli[i] as bigint) !== want[i]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      found = x;
      break;
    }
  }
  const truth = crt([...remainders], [...moduli]);
  if (
    (truth === null) !== (found === null) ||
    (truth !== null && truth.x !== found)
  ) {
    throw new Error("후보 만들기가 정본과 다른 답을 냈다");
  }
  return { tried, checks, divisions, found };
}

/** 앞에서부터 `count` 개의 소수. */
export function primes(count: number): bigint[] {
  const out: bigint[] = [];
  for (let n = 2n; out.length < count; n++) {
    let ok = true;
    for (let d = 2n; d * d <= n; d++) {
      if (n % d === 0n) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(n);
  }
  return out;
}

/** 과제 규모의 법 둘 — `10^18` 과 그 바로 아래 수. 서로소다. */
export const BIG_PAIR: [bigint, bigint] = [LIMIT, LIMIT - 1n];

/** `초당 1 억 번` 으로 걸리는 시간을 사람이 읽는 단위로. */
export function duration(ops: bigint): string {
  const s = ops / PER_SECOND;
  if (ops < PER_SECOND) return "1 초 미만";
  if (s < 60n) return `${num(s)} 초`;
  if (s < 3_600n) return `${num(s / 60n)} 분`;
  if (s < 86_400n) return `${num(s / 3_600n)} 시간`;
  if (s < YEAR_SECONDS) return `${num(s / 86_400n)} 일`;
  return `${num(s / YEAR_SECONDS)} 년`;
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
  arrayName: "법 m",
  rangeLabel: "합친 합동식",
};

/** 음수는 괄호로 싼다 — `(-6) × 1`. */
const par = (v: bigint): string => (v < 0n ? `(${v})` : String(v));

/**
 * 전개 입력의 걸음 — 첫 합동식을 받는 걸음(T1) · 합치기마다 세 걸음(모순 판정 · `t` 풀기 · 누적 합동식 늘리기)
 * · 답을 내는 걸음. 합치기가 두 번이라 여덟 걸음이다.
 *
 * 무대는 법 줄 · 나머지 줄 · 누적 합동식 두 줄을 첫 걸음부터 모두 둔다(아직 안 채운 칸은 빈칸). 괄호가 지금까지
 * 합친 합동식이고, ▲ 가 이번에 읽은 칸, 새로 쓴 칸이 이번 합치기의 결과다.
 */
export function walkSteps(): Step[] {
  const tr = walk();
  const k = tr.moduli.length;
  const moduli = tr.moduli.map(Number);
  const rs = tr.remainders.map((r, i) =>
    Number(mod(r, tr.moduli[i] as bigint)),
  );
  const curR: (number | null)[] = Array.from({ length: k }, () => null);
  const curM: (number | null)[] = Array.from({ length: k }, () => null);
  let count = 0;
  const layers = (
    readR: number[],
    readCur: number[],
    writeCur: number[],
  ): ArrayStep["layers"] => [
    { name: "나머지 r", values: [...rs], read: readR, side: "입력" },
    { name: "curR", values: [...curR], read: readCur, write: writeCur },
    { name: "curM", values: [...curM], read: readCur, write: writeCur },
  ];
  const steps: Step[] = [];
  curR[0] = Number(tr.first.curR);
  curM[0] = Number(tr.first.curM);
  count += 1;
  steps.push({
    id: "T1",
    title: "첫 합동식을 누적 합동식으로 받는다",
    detail: `첫 합동식은 x ≡ ${tr.remainders[0]} (mod ${tr.moduli[0]}) 입니다. 나머지 ${tr.remainders[0]}${을를(tr.remainders[0] as bigint)} [0, ${tr.moduli[0]}) 안으로 맞춘 값이 ${tr.first.curR}${josa(tr.first.curR, "이라", "라")} 누적 합동식을 (curR, curM) = (${tr.first.curR}, ${tr.first.curM}) 으로 둡니다.`,
    stage: {
      array: [...moduli],
      range: [0, 0],
      read: [0],
      write: [],
      pointers: { i: 0 },
      calc: {
        expr: `mod(${tr.remainders[0]}, ${tr.moduli[0]})`,
        result: `${tr.first.curR}`,
      },
      vars: `나눗셈 ${count}`,
      layers: layers([0], [], [0]),
    },
  });
  let n = 2;
  for (const g of tr.merges) {
    const i = g.i;
    const gcdCount = divisions([g.curR, g.r], [g.curM, g.m])
      .gcdSteps[0] as number;
    count += 1 + gcdCount + 1;
    steps.push({
      id: `T${n++}`,
      title: `diff = ${g.diff} · g = ${g.g}`,
      detail: `새 합동식은 x ≡ ${g.r} (mod ${g.m}) 입니다. 나머지 차는 diff = ${g.r} - ${g.curR} = ${g.diff} 이고, 확장 유클리드 호제법이 g = gcd(${g.curM}, ${g.m}) = ${g.g}${과와(g.g)} 계수 u = ${g.u}${을를(g.u)} 냅니다. ${g.diff}${을를(g.diff)} ${g.g}${으로(g.g)} 나눈 나머지가 ${g.diff % g.g}${josa(g.diff % g.g, "이라", "라")} ${g.ok ? "모순이 아닙니다" : "모순입니다"}.`,
      stage: {
        array: [...moduli],
        range: [0, i - 1],
        read: [i],
        write: [],
        pointers: { i },
        calc: {
          expr: `diff % g = ${par(g.diff)} % ${g.g}`,
          result: `${g.diff % g.g}`,
        },
        vars: `g = ${g.g} · u = ${g.u} · 나눗셈 ${count}`,
        layers: layers([i], [i - 1], []),
      },
    });
    if (!g.ok) break;
    const unit = g.unit as bigint;
    const t = g.t as bigint;
    count += 3;
    steps.push({
      id: `T${n++}`,
      title: `t = ${t}`,
      detail: `unit = ${g.m} / ${g.g} = ${unit} 이고 diff / g = ${g.diff / g.g} 입니다. t = mod(${par(g.diff / g.g)} × ${g.u}, ${unit}) = ${t}${josa(t, "이라", "라")} curR 을 curM = ${g.curM} 씩 ${t} 번 옮기면 새 합동식까지 맞습니다.`,
      stage: {
        array: [...moduli],
        range: [0, i - 1],
        read: [i],
        write: [],
        pointers: { i },
        calc: {
          expr: `t = mod(${par(g.diff / g.g)} × ${g.u}, ${unit})`,
          result: `${t}`,
        },
        vars: `unit = ${unit} · 나눗셈 ${count}`,
        layers: layers([i], [i - 1], []),
      },
    });
    curR[i] = Number(g.nextR);
    curM[i] = Number(g.nextM);
    steps.push({
      id: `T${n++}`,
      title: `x ≡ ${g.nextR} (mod ${g.nextM})`,
      detail: `curR = ${g.curR} + ${g.curM} × ${t} = ${g.nextR} 이고 curM = ${g.curM} × ${unit} = ${g.nextM} 입니다. 합동식 ${i + 1} 개가 x ≡ ${g.nextR} (mod ${g.nextM}) 하나가 됐습니다.`,
      stage: {
        array: [...moduli],
        range: [0, i],
        read: [],
        write: [i],
        pointers: { i },
        calc: {
          expr: `curR = ${g.curR} + ${g.curM} × ${t}`,
          result: `${g.nextR}`,
        },
        vars: `나눗셈 ${count}`,
        layers: layers([], [i - 1], [i]),
      },
    });
  }
  const ans = tr.answer;
  steps.push({
    id: `T${n}`,
    title: ans === null ? "null 반환" : `{ x: ${ans.x}, M: ${ans.M} } 반환`,
    detail:
      ans === null
        ? "모순이라 null 을 냅니다."
        : `읽을 합동식이 없어 반복이 끝납니다. 누적 합동식 x ≡ ${ans.x} (mod ${ans.M}) 의 두 값을 { x, M } 으로 그대로 냅니다. 나눗셈은 모두 ${count} 번입니다.`,
    stage: {
      array: [...moduli],
      range: [0, k - 1],
      read: [],
      write: [],
      pointers: { i: k },
      calc:
        ans === null
          ? null
          : { expr: "{ x: curR, M: curM }", result: `{ ${ans.x}, ${ans.M} }` },
      vars: `나눗셈 ${count}`,
      layers: layers([], [k - 1], []),
    },
  });
  const total = divisions([...WALK_R], [...WALK_M]).count;
  if (count !== total) {
    throw new Error(
      `걸음이 센 나눗셈 ${count} 이 세는 사본의 ${total} 과 다르다`,
    );
  }
  return steps;
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자 그대로 옮긴
 * 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는 `crt-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    crtWalk: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

const film = (steps: readonly Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(s.stage, ARRAY_OPTIONS),
  }));

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

function approaches(): Approach[] {
  const naive = byListing([...WALK_R], [...WALK_M]);
  const largest = byListing([...WALK_R], [...WALK_M], WALK_M.length - 1);
  const [a, b] = BIG_PAIR;
  const bigM = lcmAll(BIG_PAIR);
  const merged = divisions([a - 1n, b - 1n], [a, b]).count;
  return [
    {
      name: "후보를 차례로 만들어 보기",
      idea: "첫 합동식을 만족하는 값을 작은 것부터 만들며 나머지 합동식을 확인한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `맞다 · 전개 입력에서 후보 ${naive.tried} 개`,
          ok: true,
        },
        {
          label: "시간",
          value: `법 둘이 10^18 규모면 후보 ${num(bigM / a)} 개 · ${duration(bigM / a)}`,
          ok: false,
        },
      ],
      lesson:
        "후보 수가 주기 M 을 기준 법으로 나눈 값이다 — 기준을 바꾸면 줄어들까",
    },
    {
      name: "가장 큰 법을 기준으로 삼기",
      idea: "후보를 가장 큰 법의 간격으로 만든다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `맞다 · 전개 입력에서 후보 ${largest.tried} 개`,
          ok: true,
        },
        {
          label: "시간",
          value:
            "후보 수가 나머지 법들의 곱이라 합동식이 늘 때마다 곱으로 는다",
          ok: false,
        },
      ],
      lesson:
        "후보를 만드는 한 줄어드는 것은 상수배다 — 두 합동식이 정하는 옮길 횟수 t 를 바로 풀 수 없을까",
    },
    {
      name: "역원으로 t 풀기",
      idea: "curM·t ≡ diff (mod m) 을 curM 의 역원을 곱해 한 번에 푼다",
      verdict: "drop",
      checks: [
        { label: "서로소인 법", value: "곱셈 한 번으로 t 가 나온다", ok: true },
        {
          label: "서로소가 아닌 법",
          value: "역원이 없어 [6, 9] 에서 멈춘다",
          ok: false,
        },
      ],
      lesson: "두 법이 겹치는 몫 g 로 먼저 나누면 역원이 다시 생기지 않을까",
    },
    {
      name: "합동식 합치기",
      idea: "g 가 diff 를 나누는지로 모순을 가르고, g 로 나눈 뒤 t 를 풀어 합동식 둘을 하나로 줄인다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다 · 모순이면 null", ok: true },
        {
          label: "시간",
          value: `10^18 규모 법 둘에서 나눗셈 ${num(merged)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 두 합동식을 함께 만족하는 수 ───────────────── */

/** 수직선 `0 … span-1` 에서 두 합동식의 나머지 줄과 함께 만족하는 칸. */
export function pairLine(
  span: number,
  a: [bigint, bigint],
  b: [bigint, bigint],
): { both: number[] } {
  const both: number[] = [];
  for (let x = 0; x < span; x++) {
    if (BigInt(x) % a[1] === a[0] && BigInt(x) % b[1] === b[0]) {
      both.push(x);
    }
  }
  const got = crt([a[0], b[0]], [a[1], b[1]]);
  if (got === null || both[0] !== Number(got.x)) {
    throw new Error("수직선의 첫 칸이 정본의 답이 아니다");
  }
  return { both };
}

/** 전체 컨셉의 수직선 — 전개 입력의 첫 두 합동식. */
export const CONCEPT_SPAN = 24;

function conceptRows(): StageRow[] {
  const a: [bigint, bigint] = [WALK_R[0] as bigint, WALK_M[0] as bigint];
  const b: [bigint, bigint] = [WALK_R[1] as bigint, WALK_M[1] as bigint];
  const { both } = pairLine(CONCEPT_SPAN, a, b);
  const xs = Array.from({ length: CONCEPT_SPAN }, (_, x) => x);
  const row = ([r, m]: [bigint, bigint]): {
    values: number[];
    states: Partial<Record<number, CellState>>;
  } => {
    const states: Partial<Record<number, CellState>> = {};
    for (const x of xs) if (BigInt(x) % m !== r) states[x] = "out";
    for (const x of both) states[x] = "focus";
    return { values: xs.map((x) => Number(BigInt(x) % m)), states };
  };
  const ra = row(a);
  const rb = row(b);
  const first = both[0] as number;
  const second = both[1] as number;
  return [
    { kind: "index", label: "x", focus: both },
    {
      kind: "cells",
      label: `x mod ${a[1]}`,
      values: ra.values,
      states: ra.states,
      side: `${a[0]} 인 칸 ${xs.filter((x) => BigInt(x) % a[1] === a[0]).length} 개`,
    },
    {
      kind: "cells",
      label: `x mod ${b[1]}`,
      values: rb.values,
      states: rb.states,
      side: `${b[0]} 인 칸 ${xs.filter((x) => BigInt(x) % b[1] === b[0]).length} 개`,
    },
    { kind: "caret", cells: both, side: `둘 다 맞는 x = ${both.join(" · ")}` },
    {
      kind: "bracket",
      label: "간격",
      from: first,
      to: second,
      tone: "query",
      text: `${first} 에서 ${second} 까지 ${second - first}`,
    },
  ];
}

/* ───────────────── 누적 합동식 — 전개 입력 위의 모양 ───────────────── */

function cumulativeRows(): StageRow[] {
  const tr = walk();
  const k = tr.moduli.length;
  const curR = [tr.first.curR, ...tr.merges.map((g) => g.nextR as bigint)];
  const curM = [tr.first.curM, ...tr.merges.map((g) => g.nextM as bigint)];
  const rows: StageRow[] = [
    { kind: "index", label: "합동식 번호" },
    { kind: "cells", label: "법 m", values: tr.moduli.map(Number) },
    {
      kind: "cells",
      label: "나머지 r",
      values: tr.remainders.map(Number),
    },
    {
      kind: "cells",
      label: "curR",
      values: curR.map(Number),
      side: "누적 합동식의 나머지",
    },
    {
      kind: "cells",
      label: "curM",
      values: curM.map(Number),
      side: "누적 합동식의 법",
    },
  ];
  for (let i = 0; i < k; i++) {
    rows.push({
      kind: "bracket",
      label: `칸 ${i}`,
      from: 0,
      to: i,
      tone: "left",
      text: `x ≡ ${curR[i]} (mod ${curM[i]})`,
    });
  }
  return rows;
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-pair": () => (
    <CellStage
      title={`x ≡ ${WALK_R[0]} (mod ${WALK_M[0]}) 과 x ≡ ${WALK_R[1]} (mod ${WALK_M[1]}) 를 함께 만족하는 x — 0 부터 ${CONCEPT_SPAN - 1} 까지`}
      columns={CONCEPT_SPAN}
      rows={conceptRows()}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`법 하나 ${num(LIMIT)} 이하 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-cumulative": () => (
    <CellStage
      title={`전개 입력의 누적 합동식 셋 — 칸 i 는 합동식 0 … i 를 합친 것이다`}
      columns={WALK_M.length}
      rows={cumulativeRows()}
    />
  ),
  "walk-merge": () => {
    const steps = walkSteps();
    return (
      <CellStageFilm
        title={`crt([${WALK_R.join(", ")}], [${WALK_M.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={Math.max(...steps.map((s) => arrayColumns(s.stage)))}
        frames={film(steps)}
      />
    );
  },
};

/** 본문 인용용 — 전개 걸음의 수와 이름. */
export const walkIds = (): string[] => walkSteps().map((s) => s.id);
