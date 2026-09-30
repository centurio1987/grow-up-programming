/**
 * `matrixPowerFibonacci-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 남은 지수를 한 칸 옮기는 줄 앞에 기록을
 * 끼운 계측 사본(`probed`)을 정본 소스에서 기계로 만들고, 그 기록으로 바퀴마다의 `e` · `acc` · `step` 을
 * 얻는다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과
 * 같은지는 `matrixPowerFibonacci-guide.test.ts` 가 잰다.
 *
 * **자리의 좌우.** `fastPower` 와 bit-manipulation 편(`binaryGap` · `lowestSetBit`)의 약속을 따른다. 정적
 * 그림(`CellStage`)은 이진 표기처럼 높은 자리를 왼쪽에 두고 인덱스 줄에 자리 번호를 적는다. 걸음 재생
 * 패널의 배열 무대는 칸 번호가 곧 자리 번호라 칸 `i` 가 자리 `i` 이고, 그래서 이진 표기와 좌우가 거꾸로다.
 *
 * **행렬은 칸 네 개.** 자리 하나에 2×2 행렬 하나가 딸리므로 비트 칸 하나가 격자 두 칸을 덮고(`span: 2`),
 * 그 아래에 행렬의 윗줄과 아랫줄을 칸 줄 둘로 쌓는다. 자리 `i` 의 행렬은 격자 칸 `2i` · `2i + 1` 에 선다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 은는, 을를 } from "../../../../tools/josa.ts";
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
import {
  IDENTITY,
  type Mat,
  matrixPowerFibonacci,
  multiply,
  TRANSITION,
} from "./matrixPowerFibonacci-guide.ref.ts";

const REF = new URL("./matrixPowerFibonacci-guide.ref.ts", import.meta.url)
  .pathname;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 남은 지수를 한 칸 옮기는 줄 앞에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히
 * 맞지 않으면 `loadMutant` 가 던진다. 기록하는 때는 이번 비트로 누적하고 자리의 거듭제곱을 제곱한 직후,
 * `e` 를 옮기기 직전이다. 그래서 `e` 는 바퀴를 시작할 때의 값이고 `acc` · `step` 은 바퀴를 마친 값이다.
 */
const probed = await loadMutant<{ matrixPowerFibonacci(n: bigint): bigint }>(
  REF,
  {
    swap: [
      /^(\s*)e >>= 1n;$/,
      "$1(globalThis as any).__rounds.push({ e, acc, step });\n$1e >>= 1n;",
    ],
  },
);

/** 바퀴 하나 — 지수의 자리 `i` 를 처리한 기록. 행렬 옆의 수는 그 행렬이 `M` 의 몇 제곱인가다. */
export interface Round {
  /** 자리 번호. 바퀴 번호와 같고 0 부터 센다. */
  readonly i: number;
  /** 바퀴를 시작할 때의 남은 지수. */
  readonly eIn: bigint;
  /** 이번에 읽은 비트 — `eIn` 의 최하위 비트. */
  readonly bit: 0 | 1;
  /** 바퀴를 시작할 때의 자리의 거듭제곱 — `M^(2^i)`. */
  readonly stepIn: Mat;
  readonly stepInPow: bigint;
  /** 바퀴를 시작할 때의 누적 행렬. */
  readonly accIn: Mat;
  readonly accInPow: bigint;
  /** 누적 뒤 `acc`. 비트가 0 이면 바퀴 시작의 값 그대로다. */
  readonly acc: Mat;
  readonly accPow: bigint;
  /** 제곱 뒤 자리의 거듭제곱 — `M^(2^(i+1))`. */
  readonly stepOut: Mat;
  readonly stepOutPow: bigint;
  /** 이 바퀴까지 한 행렬 곱 수(제곱 + 누적). */
  readonly muls: number;
}

export interface Trace {
  readonly n: bigint;
  readonly rounds: readonly Round[];
  readonly answer: bigint;
  /** 반복을 마친 누적 행렬. 비트가 없으면(`n = 0`) 단위행렬이다. */
  readonly final: Mat;
}

const same = (A: Mat, B: Mat): boolean =>
  A[0][0] === B[0][0] &&
  A[0][1] === B[0][1] &&
  A[1][0] === B[1][0] &&
  A[1][1] === B[1][1];

/**
 * 정본 한 번 호출의 기록. 답은 정본과 대조하고, 바퀴 사이의 값은 이렇게 대조한다 — 다음 바퀴의 `e` 가 앞
 * 바퀴의 `e` 를 한 칸 옮긴 값인가, 제곱 뒤 행렬이 바퀴 시작의 행렬을 제곱한 것인가, 비트가 1 인 바퀴만
 * `acc` 가 바뀌었는가. 어긋나면 던진다 — 그림이 정본과 다른 것을 그리지 않게. 행렬마다 `M` 의 몇 제곱인지는
 * 기록한 행렬을 세지 않고 걸음 수를 따라 더해 얻는다(`acc` 는 켜진 자리의 `2^i` 를 더하고, `step` 은
 * 바퀴마다 두 배다).
 */
export function trace(n: bigint): Trace {
  const g = globalThis as unknown as {
    __rounds: { e: bigint; acc: Mat; step: Mat }[];
  };
  g.__rounds = [];
  const got = probed.matrixPowerFibonacci(n);
  const answer = matrixPowerFibonacci(n);
  if (got !== answer) {
    throw new Error(`계측 사본이 정본과 다른 답을 냈다 — ${got} ≠ ${answer}`);
  }
  const raw = [...g.__rounds];
  const rounds: Round[] = [];
  let stepIn: Mat = TRANSITION;
  let stepInPow = 1n;
  let accIn: Mat = IDENTITY;
  let accInPow = 0n;
  let eIn = n;
  let muls = 0;
  for (const [i, r] of raw.entries()) {
    if (r.e !== eIn)
      throw new Error(`자리 ${i} 의 e 가 앞 바퀴와 이어지지 않는다`);
    const bit = (r.e & 1n) === 1n ? 1 : 0;
    if (!same(r.step, multiply(stepIn, stepIn))) {
      throw new Error(
        `자리 ${i} 의 제곱 뒤 행렬이 바퀴 시작의 행렬의 제곱이 아니다`,
      );
    }
    const want = bit === 1 ? multiply(accIn, stepIn) : accIn;
    if (!same(r.acc, want)) throw new Error(`자리 ${i} 의 acc 가 어긋난다`);
    muls += 1 + bit;
    const accPow = accInPow + (bit === 1 ? stepInPow : 0n);
    rounds.push({
      i,
      eIn: r.e,
      bit,
      stepIn,
      stepInPow,
      accIn,
      accInPow,
      acc: r.acc,
      accPow,
      stepOut: r.step,
      stepOutPow: stepInPow * 2n,
      muls,
    });
    stepIn = r.step;
    stepInPow *= 2n;
    accIn = r.acc;
    accInPow = accPow;
    eIn = r.e >> 1n;
  }
  if (eIn !== 0n) throw new Error("반복이 끝났는데 남은 지수가 0 이 아니다");
  if (accInPow !== n) throw new Error("마지막 acc 의 걸음 수가 n 과 다르다");
  if (accIn[0][1] !== answer)
    throw new Error("마지막 acc 의 오른쪽 위 칸이 답과 다르다");
  return { n, rounds, answer, final: accIn };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK_N = 10n;

/** 과제 규모 — 항 번호의 상한과, 수치 반박에 쓰는 처리 속도(단순 연산 1 초에 1 억 번). */
export const LIMIT = 10n ** 18n;
export const PER_SECOND = 100_000_000n;

export const num = (n: number | bigint): string => n.toLocaleString("en-US");

/** 이진 표기 — `1010₂` 꼴. */
export const bin = (n: bigint): string => `${n.toString(2)}₂`;

export const bitLength = (n: bigint): number =>
  n === 0n ? 0 : n.toString(2).length;

export const oneBits = (n: bigint): number =>
  n === 0n ? 0 : [...n.toString(2)].filter((c) => c === "1").length;

/** 낮은 자리부터의 비트 — 배열 무대의 칸 `i` 가 자리 `i` 다. */
export const bitsLow = (n: bigint): (0 | 1)[] =>
  [...n.toString(2)].reverse().map((c) => (c === "1" ? 1 : 0));

/** 행렬을 본문과 같은 표기로 적는다 — `[[좌상,우상],[좌하,우하]]`. */
export const show = (A: Mat): string =>
  `[[${A[0][0]},${A[0][1]}],[${A[1][0]},${A[1][1]}]]`;

/** `M^k` 를 `M^k` 로 적는다. */
export const pow = (k: bigint | number): string => `M^${k}`;

let walkMemo: Trace | undefined;
/** 전개 입력의 기록. 그림 · 증명 · 패널이 같은 기록을 쓴다. */
export const walk = (): Trace => {
  walkMemo ??= trace(WALK_N);
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
  arrayName: "n 의 비트",
  rangeLabel: "남은 e",
};

/** 행렬 여럿을 격자 칸 줄 둘로 편다 — 행렬 `k` 가 칸 `2k` · `2k + 1` 에 선다. 아직 없는 행렬은 `null`. */
function matrixRows(
  mats: readonly (Mat | null)[],
): [(string | null)[], (string | null)[]] {
  const top: (string | null)[] = [];
  const bottom: (string | null)[] = [];
  for (const A of mats) {
    top.push(
      A === null ? null : String(A[0][0]),
      A === null ? null : String(A[0][1]),
    );
    bottom.push(
      A === null ? null : String(A[1][0]),
      A === null ? null : String(A[1][1]),
    );
  }
  return [top, bottom];
}

/** 자리 `k` 의 행렬이 덮는 격자 칸 둘. */
const band = (k: number): number[] => [2 * k, 2 * k + 1];

/** 행렬 둘(윗줄 · 아랫줄)의 칸 줄. 윗줄에는 ▲ 줄을 두지 않는다 — 행렬 하나가 두 줄로 갈라져 보인다. */
function matrixLayers(
  name: string,
  mats: readonly (Mat | null)[],
  marks: { read?: number[]; write?: number[] },
  topSide: string,
): ArrayLayer[] {
  const [top, bottom] = matrixRows(mats);
  const filled = mats.filter((A) => A !== null).length;
  const read = (marks.read ?? []).flatMap(band);
  const write = (marks.write ?? []).flatMap(band);
  return [
    { name, values: top, read, write, side: topSide, caret: false },
    {
      name: "",
      values: bottom,
      read,
      write,
      side: `행렬 ${filled} / ${mats.length}`,
    },
  ];
}

/**
 * 전개 입력의 걸음 — 반복문 앞 한 걸음(T1) · 바퀴마다 한 걸음 · 반복을 끝내는 한 걸음.
 *
 * 무대는 `n` 의 비트를 자리마다 한 칸에 둔다(칸 `i` 가 자리 `i`, 칸 하나가 격자 두 칸을 덮는다). 괄호
 * 「남은 e」는 바퀴를 시작할 때 `e` 에 남은 자리이고, ▲ 는 이번에 읽은 비트다. 그 아래 두 행렬 줄이 이
 * 알고리즘이 쌓는 값이다 — `step` 의 자리 `i` 는 자리 `i` 의 거듭제곱 `M^(2^i)`(바퀴 `i` 를 시작할 때의
 * 행렬), `acc` 의 자리 `i` 는 바퀴 `i` 를 마친 누적 행렬이다. `step` 은 행렬이 하나 더 있다 — 마지막 바퀴가
 * 만든 행렬이 들어가는 자리다.
 */
export function walkSteps(): Step[] {
  const t = walk();
  const bits = bitsLow(WALK_N);
  const b = bits.length;
  const steps: Mat[] = [TRANSITION];
  const accs: Mat[] = [];
  const stepMats = (): (Mat | null)[] =>
    Array.from({ length: b + 1 }, (_, k) => steps[k] ?? null);
  const accMats = (): (Mat | null)[] =>
    Array.from({ length: b }, (_, k) => accs[k] ?? null);
  const out: Step[] = [];
  out.push({
    id: "T1",
    title: "반복문 앞",
    detail: `acc 를 단위행렬 ${pow(0)}${으로(pow(0))}, step 을 전이 행렬 ${pow(1)}${으로(pow(1))}, e 를 ${WALK_N}${으로(String(WALK_N))} 둡니다. step 이 자리 0 의 거듭제곱입니다.`,
    stage: {
      array: [...bits],
      span: 2,
      range: [0, b - 1],
      rangeSide: `e = ${WALK_N}`,
      read: [],
      write: [],
      pointers: {},
      calc: { expr: "step = TRANSITION", result: pow(1) },
      vars: "행렬 곱 0",
      layers: [
        ...matrixLayers("step", stepMats(), { write: [0] }, `step = ${pow(1)}`),
        ...matrixLayers("acc", accMats(), {}, `acc = ${pow(0)}`),
      ],
    },
  });
  for (const r of t.rounds) {
    steps.push(r.stepOut);
    accs.push(r.acc);
    const accText =
      r.bit === 1
        ? `비트가 1 이라 acc 에 step = ${pow(r.stepInPow)}${을를(pow(r.stepInPow))} 곱해 ${pow(r.accPow)}${으로(pow(r.accPow))} 둡니다`
        : `비트가 0 이라 acc 는 ${pow(r.accPow)} 그대로입니다`;
    const accRead = r.bit === 1 && r.i > 0 ? [r.i - 1] : [];
    out.push({
      id: `T${r.i + 2}`,
      title: `자리 ${r.i} · 비트 ${r.bit}`,
      detail: `e = ${r.eIn} = ${bin(r.eIn)} 의 최하위 비트를 읽습니다. ${accText}. 그다음 step 을 제곱해 자리 ${r.i + 1} 의 거듭제곱 ${pow(r.stepOutPow)}${을를(pow(r.stepOutPow))} 만들고, e 를 한 칸 옮겨 ${r.eIn >> 1n}${으로(String(r.eIn >> 1n))} 둡니다.`,
      stage: {
        array: [...bits],
        span: 2,
        range: [r.i, b - 1],
        rangeSide: `e = ${r.eIn}`,
        read: [r.i],
        write: [],
        pointers: { i: r.i },
        calc:
          r.bit === 1
            ? {
                expr: `${pow(r.accInPow)} · ${pow(r.stepInPow)} =`,
                result: pow(r.accPow),
              }
            : { expr: `${r.eIn} & 1 = 0`, result: "누적 건너뜀" },
        vars: `행렬 곱 ${r.muls}`,
        layers: [
          ...matrixLayers(
            "step",
            stepMats(),
            { read: [r.i], write: [r.i + 1] },
            `step = ${pow(r.stepOutPow)}`,
          ),
          ...matrixLayers(
            "acc",
            accMats(),
            { read: accRead, write: r.bit === 1 ? [r.i] : [] },
            `acc = ${pow(r.accPow)}`,
          ),
        ],
      },
    });
  }
  const last = t.rounds.at(-1) as Round;
  out.push({
    id: `T${t.rounds.length + 2}`,
    title: "e = 0 · 반환",
    detail: `e 가 0 이라 e > 0 이 거짓입니다. 반복을 끝내고 acc = ${pow(last.accPow)} 의 오른쪽 위 칸 ${t.answer}${을를(String(t.answer))} 돌려줍니다. 마지막 바퀴가 만든 step = ${pow(last.stepOutPow)}${은는(pow(last.stepOutPow))} 쓰이지 않습니다.`,
    stage: {
      array: [...bits],
      span: 2,
      range: null,
      rangeSide: "e = 0",
      read: [],
      write: [],
      pointers: {},
      calc: { expr: "acc[0][1] =", result: `${t.answer}` },
      vars: `행렬 곱 ${last.muls}`,
      layers: [
        ...matrixLayers(
          "step",
          stepMats(),
          {},
          `step = ${pow(last.stepOutPow)}`,
        ),
        ...matrixLayers(
          "acc",
          accMats(),
          { read: [last.i] },
          `acc = ${pow(last.accPow)}`,
        ),
      ],
    },
  });
  return out;
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `matrixPowerFibonacci-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    powMatrix: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

/** 정의를 그대로 옮긴 답 — 두 항을 들고 한 걸음씩 더한다. 덧셈 횟수를 함께 센다. */
export function byAddition(n: bigint): { value: bigint; adds: bigint } {
  let prev = 0n;
  let curr = 1n;
  let adds = 0n;
  for (let k = 0n; k < n; k++) {
    const next = prev + curr;
    adds++;
    prev = curr;
    curr = next;
  }
  return { value: prev, adds };
}

/**
 * 행렬 곱 한 번이 칸에 하는 연산 수 — 정본의 `multiply` 를 칸 값에 붙인 셈과 함께 한 번 부른다. 칸 값을
 * 감싸지 않고, 같은 식을 곱셈 · 덧셈 자리마다 세는 사본으로 센다.
 */
export function opsPerMatMul(): { mul: number; add: number } {
  let mul = 0;
  let add = 0;
  const m = (x: bigint, y: bigint) => {
    mul++;
    return x * y;
  };
  const a = (x: bigint, y: bigint) => {
    add++;
    return x + y;
  };
  const A = TRANSITION;
  const B = TRANSITION;
  const C: Mat = [
    [
      a(m(A[0][0], B[0][0]), m(A[0][1], B[1][0])),
      a(m(A[0][0], B[0][1]), m(A[0][1], B[1][1])),
    ],
    [
      a(m(A[1][0], B[0][0]), m(A[1][1], B[1][0])),
      a(m(A[1][0], B[0][1]), m(A[1][1], B[1][1])),
    ],
  ];
  if (!same(C, multiply(A, B)))
    throw new Error("셈을 붙인 사본이 정본의 multiply 와 다르다");
  return { mul, add };
}

/** 정본의 행렬 곱 횟수. 바퀴마다 제곱 하나, 1 인 비트마다 누적 하나다 — 값만 세는 가벼운 판. */
export const matMuls = (n: bigint): number => bitLength(n) + oneBits(n);

/** 정본의 연산 횟수 — 행렬 곱 한 번이 곱셈과 덧셈 `opsPerMatMul()` 이다. */
export const matrixOps = (n: bigint): number => {
  const o = opsPerMatMul();
  return (o.mul + o.add) * matMuls(n);
};

/** 전이 행렬을 한 번씩 **차례로** 곱하는 후보 — `M` 을 `n` 번 곱한다. 행렬 곱 횟수를 함께 센다. */
export function repeatedMatrix(n: bigint): { value: bigint; muls: bigint } {
  let acc: Mat = IDENTITY;
  let muls = 0n;
  for (let k = 0n; k < n; k++) {
    acc = multiply(acc, TRANSITION);
    muls++;
  }
  return { value: acc[0][1], muls };
}

/** 칸마다 따로 `n` 제곱하는 후보 — 행렬 곱이 아니라 칸끼리의 거듭제곱이다. */
export const elementwise = (n: bigint): Mat => [
  [TRANSITION[0][0] ** n, TRANSITION[0][1] ** n],
  [TRANSITION[1][0] ** n, TRANSITION[1][1] ** n],
];

const YEAR_SECONDS = 31_536_000n;

function approaches(): Approach[] {
  const t = walk();
  const o = opsPerMatMul();
  const per = o.mul + o.add;
  const years = LIMIT / PER_SECOND / YEAR_SECONDS;
  const el = elementwise(WALK_N);
  const rep = repeatedMatrix(WALK_N);
  return [
    {
      name: "한 걸음씩 더하기",
      idea: "두 항을 들고 앞의 두 항을 더해 한 걸음씩 옮긴다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = 10^18 이면 덧셈 ${num(LIMIT)} 번 · 약 ${num(years)} 년`,
          ok: false,
        },
      ],
      lesson:
        "걸음 하나가 늘 같은 계수의 곱과 합이다 — 그 계수를 행렬 하나에 담으면 걸음끼리 곱할 수 있다",
    },
    {
      name: "전이 행렬을 차례로 곱하기",
      idea: "단위행렬에 전이 행렬 M 을 n 번 곱한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `n = ${WALK_N} 에서 ${rep.value} · 정본도 ${t.answer}`,
          ok: true,
        },
        {
          label: "시간",
          value: `행렬 곱 n 번 · 연산 ${per}n 번 — 한 걸음씩 더하기의 ${per} 배`,
          ok: false,
        },
      ],
      lesson:
        "걸음을 하나씩 곱하면 행렬로 적은 값이 없다 — 행렬끼리 곱하면 걸음 수가 더해진다",
    },
    {
      name: "칸마다 거듭제곱하기",
      idea: "M 의 네 칸을 각각 n 제곱한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `n = ${WALK_N} 에서 ${show(el)} 의 오른쪽 위 ${el[0][1]} · 정본은 ${t.answer}`,
          ok: false,
        },
      ],
      lesson:
        "행렬 곱은 칸끼리의 곱이 아니다 — 행렬의 거듭제곱은 행렬 곱으로 만들어야 한다",
    },
    {
      name: "행렬 거듭제곱",
      idea: "M 에 이진 거듭제곱을 건다 — 자리마다 M^(2^i) 를 제곱으로 만들고 켜진 자리의 것만 acc 에 곱한다",
      verdict: "keep",
      checks: [
        { label: "답", value: `n = ${WALK_N} 에서 ${t.answer}`, ok: true },
        {
          label: "시간",
          value: `n = 10^18 이면 행렬 곱 ${matMuls(LIMIT)} 번 · 연산 ${num(matrixOps(LIMIT))} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 정적 그림의 격자 ───────────────────────── */

/** 정적 그림의 인덱스 줄 — 자리 번호를 높은 것부터 적는다(묶음 `c` 가 자리 `w − 1 − c`). */
const indexRow = (w: number, span = 1): StageRow => ({
  kind: "index",
  label: "자리",
  labels: Array.from({ length: w }, (_, c) => w - 1 - c),
  ...(span === 1 ? {} : { span }),
});

/** 낮은 자리부터의 배열을 정적 그림의 칸 순서(높은 자리부터)로 뒤집는다. */
const high = <T,>(low: readonly T[]): T[] => [...low].reverse();

/** 행렬 칸 줄 둘의 상태 — 묶음 `c` 의 상태를 그 묶음의 두 칸에 편다. */
const bandStates = (
  byBand: Partial<Record<number, CellState>>,
): Partial<Record<number, CellState>> => {
  const out: Partial<Record<number, CellState>> = {};
  for (const [c, s] of Object.entries(byBand)) {
    const k = Number(c);
    out[2 * k] = s;
    out[2 * k + 1] = s;
  }
  return out;
};

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  /** 전체 컨셉 — 한 걸음은 수열 위의 두 칸 창을 한 칸 옮기는 것이다. */
  "concept-step": () => {
    const k = 4;
    const count = 12;
    const values = Array.from({ length: count }, (_, i) =>
      String(matrixPowerFibonacci(BigInt(i))),
    );
    const next = matrixPowerFibonacci(BigInt(k + 1));
    return (
      <CellStage
        title={`한 걸음 — 상태 (F(${k}), F(${k - 1})) 에 전이 행렬 M 을 곱하면 (F(${k + 1}), F(${k})) 다`}
        columns={count}
        rows={[
          { kind: "index", label: "k" },
          {
            kind: "cells",
            label: "F(k)",
            values,
            states: { [k - 1]: "read", [k]: "read", [k + 1]: "focus" },
            side: `F(${k + 1}) = ${values[k]} + ${values[k - 1]} = ${next}`,
          },
          {
            kind: "bracket",
            label: "상태",
            from: k - 1,
            to: k,
            tone: "left",
            text: `(F(${k}), F(${k - 1}))`,
          },
          {
            kind: "bracket",
            label: "M 을 곱한 뒤",
            from: k,
            to: k + 1,
            tone: "right",
            text: `(F(${k + 1}), F(${k}))`,
          },
        ]}
      />
    );
  },
  /** 전체 컨셉 — 켜진 자리의 거듭제곱만 곱하면 M^10 이다. */
  "concept-bits": () => {
    const t = walk();
    const bits = bitsLow(WALK_N);
    const b = bits.length;
    const on = bits.flatMap((x, i) => (x === 1 ? [i] : []));
    const col = (i: number) => b - 1 - i;
    const offStates: Partial<Record<number, CellState>> = {};
    const onStates: Partial<Record<number, CellState>> = {};
    for (let i = 0; i < b; i++) {
      if (bits[i] === 1) onStates[col(i)] = "read";
      else offStates[col(i)] = "out";
    }
    const [top, bottom] = matrixRows(high(t.rounds.map((r) => r.stepIn)));
    const chosen = on.map((i) => 2 ** i);
    return (
      <CellStage
        title={`${WALK_N} = ${high(chosen).join(" + ")} — 켜진 자리의 거듭제곱만 곱하면 ${pow(WALK_N)}`}
        columns={2 * b}
        rows={[
          indexRow(b, 2),
          {
            kind: "cells",
            label: `${WALK_N} 의 비트`,
            values: high(bits),
            states: onStates,
            side: bin(WALK_N),
            span: 2,
          },
          { kind: "caret", cells: on.map(col), side: "켜진 자리", span: 2 },
          {
            kind: "cells",
            label: "2^i",
            values: high(bits.map((_, i) => 2 ** i)),
            states: { ...offStates },
            side: `켜진 칸의 합 ${chosen.reduce((x, y) => x + y, 0)}`,
            span: 2,
          },
          {
            kind: "cells",
            label: "M^(2^i)",
            values: top,
            states: bandStates(offStates),
          },
          {
            kind: "cells",
            values: bottom,
            states: bandStates(offStates),
            side: `켜진 행렬의 곱 → ${pow(WALK_N)}`,
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
        constraint={`항 번호 n ≤ 10^18 · 1 초(단순 연산 1 초에 ${num(PER_SECOND)} 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  /** 먼저 알아 둘 개념 — M^k 의 네 칸이 수열의 이웃한 세 항을 맡는다. */
  "build-read": () => {
    const k = 4;
    const count = 12;
    const values = Array.from({ length: count }, (_, i) =>
      String(matrixPowerFibonacci(BigInt(i))),
    );
    let P: Mat = IDENTITY;
    for (let j = 0; j < k; j++) P = multiply(P, TRANSITION);
    return (
      <CellStage
        title={`${pow(k)} = ${show(P)} — 네 칸이 F(${k + 1}) · F(${k}) · F(${k}) · F(${k - 1}) 이다`}
        columns={count}
        rows={[
          { kind: "index", label: "k" },
          {
            kind: "cells",
            label: "F(k)",
            values,
            states: { [k - 1]: "read", [k]: "focus", [k + 1]: "read" },
          },
          {
            kind: "caret",
            cells: [k - 1, k, k + 1],
            side: `${pow(k)} 의 칸 ${P[0][0]} · ${P[0][1]} · ${P[1][0]} · ${P[1][1]}`,
          },
          {
            kind: "bracket",
            label: `${pow(k)} 이 맡는 항`,
            from: k - 1,
            to: k + 1,
            tone: "make",
            text: `F(${k - 1}) ~ F(${k + 1})`,
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
        title={`matrixPowerFibonacci(${WALK_N}n) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns((steps[0] as Step).stage)}
        frames={frames}
      />
    );
  },
};
