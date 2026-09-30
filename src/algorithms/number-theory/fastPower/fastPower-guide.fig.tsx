/**
 * `fastPower-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 지수를 한 칸 옮기는 줄 앞에 기록을 끼운
 * 계측 사본(`probed`)을 정본 소스에서 기계로 만들고, 그 기록으로 바퀴마다의 `e` · `b` · `result` 를 얻는다.
 * 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `fastPower-guide.test.ts` 가 잰다.
 *
 * **자리의 좌우.** bit-manipulation 편(`binaryGap` · `lowestSetBit` · `singleNumberXor`)의 약속을 따른다.
 * 정적 그림(`CellStage`)은 이진 표기처럼 높은 자리를 왼쪽에 두고 인덱스 줄에 자리 번호를 적는다. 걸음 재생
 * 패널의 배열 무대는 칸 번호가 곧 자리 번호라 칸 `i` 가 자리 `i` 이고, 그래서 이진 표기와 좌우가 거꾸로다.
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
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { fastPower } from "./fastPower-guide.ref.ts";

const REF = new URL("./fastPower-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 지수를 한 칸 옮기는 줄 앞에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 기록하는 때는 이번 비트로 누적하고 밑을 제곱한 직후, `e` 를 옮기기
 * 직전이다. 그래서 `e` 는 바퀴를 시작할 때의 값이고 `b` · `result` 는 바퀴를 마친 값이다.
 */
const probed = await loadMutant<{
  fastPower(base: bigint, exp: bigint, mod: bigint): bigint;
}>(REF, {
  swap: [
    /^(\s*)e >>= 1n;$/,
    "$1(globalThis as any).__rounds.push({ e, b, result });\n$1e >>= 1n;",
  ],
});

/** 바퀴 하나 — 지수의 자리 `i` 를 처리한 기록. */
export interface Round {
  /** 자리 번호. 바퀴 번호와 같고 0 부터 센다. */
  readonly i: number;
  /** 바퀴를 시작할 때의 남은 지수. */
  readonly eIn: bigint;
  /** 이번에 읽은 비트 — `eIn` 의 최하위 비트. */
  readonly bit: 0 | 1;
  /** 바퀴를 시작할 때의 밑 — 자리 `i` 의 거듭제곱 `base^(2^i) mod mod`. */
  readonly bIn: bigint;
  /** 누적 뒤 `result`. 비트가 0 이면 바퀴 시작의 값 그대로다. */
  readonly result: bigint;
  /** 제곱 뒤 밑 — 자리 `i + 1` 의 거듭제곱. */
  readonly bOut: bigint;
  /** 이 바퀴까지 한 모듈러 곱셈 수(제곱 + 누적). */
  readonly mults: number;
}

export interface Trace {
  /** 반복문에 들어가기 전의 두 값. */
  readonly init: { readonly result: bigint; readonly b: bigint };
  readonly rounds: readonly Round[];
  readonly answer: bigint;
}

/**
 * 정본 한 번 호출의 기록. 답은 정본과 대조하고, 바퀴 사이의 값은 이렇게 대조한다 — 다음 바퀴의 `e` 가 앞
 * 바퀴의 `e` 를 한 칸 옮긴 값인가, 제곱 뒤 밑이 바퀴 시작의 밑을 제곱해 줄인 값인가, 비트가 1 인 바퀴만
 * `result` 가 바뀌었는가. 어긋나면 던진다 — 그림이 정본과 다른 것을 그리지 않게.
 */
export function trace(base: bigint, exp: bigint, mod: bigint): Trace {
  const g = globalThis as unknown as {
    __rounds: { e: bigint; b: bigint; result: bigint }[];
  };
  g.__rounds = [];
  const got = probed.fastPower(base, exp, mod);
  const answer = fastPower(base, exp, mod);
  if (got !== answer) {
    throw new Error(`계측 사본이 정본과 다른 답을 냈다 — ${got} ≠ ${answer}`);
  }
  const raw = [...g.__rounds];
  // 반복문 앞의 두 값은 정의대로 둔다. 첫 바퀴의 기록이 이 값에서 나왔는지 아래에서 확인한다.
  const init = { result: 1n % mod, b: ((base % mod) + mod) % mod };
  const rounds: Round[] = [];
  let bIn = init.b;
  let before = init.result;
  let eIn = exp;
  let mults = 0;
  for (const [i, r] of raw.entries()) {
    if (r.e !== eIn)
      throw new Error(`자리 ${i} 의 e 가 앞 바퀴와 이어지지 않는다`);
    const bit = (r.e & 1n) === 1n ? 1 : 0;
    if (r.b !== (bIn * bIn) % mod) {
      throw new Error(
        `자리 ${i} 의 제곱 뒤 밑이 바퀴 시작의 밑의 제곱이 아니다`,
      );
    }
    const want = bit === 1 ? (before * bIn) % mod : before;
    if (r.result !== want) throw new Error(`자리 ${i} 의 result 가 어긋난다`);
    mults += 1 + bit;
    rounds.push({
      i,
      eIn: r.e,
      bit,
      bIn,
      result: r.result,
      bOut: r.b,
      mults,
    });
    bIn = r.b;
    before = r.result;
    eIn = r.e >> 1n;
  }
  if (eIn !== 0n) throw new Error("반복이 끝났는데 남은 지수가 0 이 아니다");
  if (before !== answer) throw new Error("마지막 result 가 답과 다르다");
  return { init, rounds, answer };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK_BASE = 3n;
export const WALK_EXP = 26n;
export const WALK_MOD = 1000n;

/** 과제 규모 — 지수의 상한과, 수치 반박에 쓰는 처리 속도(단순 연산 1 초에 1 억 번). */
export const LIMIT = 10n ** 18n;
export const PER_SECOND = 100_000_000n;

export const num = (n: number | bigint): string => n.toLocaleString("en-US");

/** 이진 표기 — `11010₂` 꼴. */
export const bin = (n: bigint): string => `${n.toString(2)}₂`;

export const bitLength = (n: bigint): number =>
  n === 0n ? 0 : n.toString(2).length;

export const oneBits = (n: bigint): number =>
  [...n.toString(2)].filter((c) => c === "1").length;

/** 낮은 자리부터의 비트 — 배열 무대의 칸 `i` 가 자리 `i` 다. */
export const bitsLow = (n: bigint): (0 | 1)[] =>
  [...n.toString(2)].reverse().map((c) => (c === "1" ? 1 : 0));

let walkMemo: Trace | undefined;
/** 전개 입력의 기록. 그림 · 증명 · 패널이 같은 기록을 쓴다. */
export const walk = (): Trace => {
  walkMemo ??= trace(WALK_BASE, WALK_EXP, WALK_MOD);
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
  arrayName: "exp 의 비트",
  rangeLabel: "남은 e",
};

/**
 * 전개 입력의 걸음 — 반복문 앞 한 걸음(T1) · 바퀴마다 한 걸음 · 반복을 끝내는 한 걸음.
 *
 * 무대는 지수의 비트를 자리마다 한 칸에 둔다(칸 `i` 가 자리 `i`). 괄호 「남은 e」는 바퀴를 시작할 때 `e` 에
 * 남은 자리이고, ▲ 는 이번에 읽은 비트다. 그 아래 두 줄이 이 알고리즘이 쌓는 값이다 — 줄 `b` 의 칸 `i` 는
 * 자리 `i` 의 거듭제곱(바퀴 `i` 를 시작할 때의 밑), 줄 `result` 의 칸 `i` 는 바퀴 `i` 를 마친 누적값이다.
 * 줄 `b` 는 칸이 하나 더 있다 — 마지막 바퀴가 만든 밑이 들어가는 자리다.
 */
export function walkSteps(): Step[] {
  const t = walk();
  const bits = bitsLow(WALK_EXP);
  const n = bits.length;
  const bRow: (string | null)[] = Array.from({ length: n + 1 }, () => null);
  const rRow: (string | null)[] = Array.from({ length: n }, () => null);
  bRow[0] = String(t.init.b);
  const steps: Step[] = [];
  steps.push({
    id: "T1",
    title: "반복문 앞",
    detail: `result 를 1 % ${WALK_MOD} = ${t.init.result}${으로(String(t.init.result))}, b 를 ${WALK_BASE}${을를(String(WALK_BASE))} 법 안으로 옮긴 ${t.init.b}${으로(String(t.init.b))}, e 를 ${WALK_EXP}${으로(String(WALK_EXP))} 둡니다. b 가 자리 0 의 거듭제곱입니다.`,
    stage: {
      array: [...bits],
      range: [0, n - 1],
      rangeSide: `e = ${WALK_EXP}`,
      read: [],
      write: [],
      pointers: {},
      calc: {
        expr: `((${WALK_BASE} % ${WALK_MOD}) + ${WALK_MOD}) % ${WALK_MOD}`,
        result: `b = ${t.init.b}`,
      },
      vars: "모듈러 곱셈 0",
      layers: [
        { name: "b", values: [...bRow], write: [0] },
        {
          name: "result",
          values: [...rRow],
          side: `result = ${t.init.result}`,
        },
      ],
    },
  });
  for (const r of t.rounds) {
    bRow[r.i + 1] = String(r.bOut);
    rRow[r.i] = String(r.result);
    const acc =
      r.bit === 1
        ? `비트가 1 이라 result 에 b = ${r.bIn}${을를(String(r.bIn))} 곱해 ${r.result}${으로(String(r.result))} 둡니다`
        : `비트가 0 이라 result 는 ${r.result} 그대로입니다`;
    steps.push({
      id: `T${r.i + 2}`,
      title: `자리 ${r.i} · 비트 ${r.bit}`,
      detail: `e = ${r.eIn} = ${bin(r.eIn)} 의 최하위 비트를 읽습니다. ${acc}. 그다음 b 를 제곱해 자리 ${r.i + 1} 의 거듭제곱 ${r.bOut}${을를(String(r.bOut))} 만들고, e 를 한 칸 옮겨 ${r.eIn >> 1n}${으로(String(r.eIn >> 1n))} 둡니다.`,
      stage: {
        array: [...bits],
        range: [r.i, n - 1],
        rangeSide: `e = ${r.eIn}`,
        read: [r.i],
        write: [],
        pointers: { i: r.i },
        calc:
          r.bit === 1
            ? {
                expr: `${t.rounds[r.i - 1]?.result ?? t.init.result} · ${r.bIn} mod ${WALK_MOD}`,
                result: `${r.result}`,
              }
            : { expr: `${r.eIn} & 1 = 0`, result: "누적 건너뜀" },
        vars: `모듈러 곱셈 ${r.mults}`,
        layers: [
          { name: "b", values: [...bRow], read: [r.i], write: [r.i + 1] },
          {
            name: "result",
            values: [...rRow],
            write: r.bit === 1 ? [r.i] : [],
            side: `result = ${r.result}`,
          },
        ],
      },
    });
  }
  const last = t.rounds.at(-1) as Round;
  steps.push({
    id: `T${t.rounds.length + 2}`,
    title: "e = 0 · 반환",
    detail: `e 가 0 이라 e > 0 이 거짓입니다. 반복을 끝내고 result ${t.answer}${을를(String(t.answer))} 돌려줍니다. 마지막 바퀴가 만든 b = ${last.bOut}${은는(String(last.bOut))} 쓰이지 않습니다.`,
    stage: {
      array: [...bits],
      range: null,
      rangeSide: "e = 0",
      read: [],
      write: [],
      pointers: {},
      calc: { expr: "0 > 0", result: `거짓 → ${t.answer} 반환` },
      vars: `모듈러 곱셈 ${last.mults}`,
      layers: [
        { name: "b", values: [...bRow] },
        {
          name: "result",
          values: [...rRow],
          read: [last.i],
          side: `result = ${t.answer}`,
        },
      ],
    },
  });
  return steps;
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `fastPower-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    powBits: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

/**
 * 홀수 보정 없이 **제곱만 되풀이하는 후보.** 지수 이하의 가장 큰 2 의 거듭제곱까지만 간다. 그 지수를
 * 함께 돌려준다.
 */
export function squaringOnly(
  base: bigint,
  exp: bigint,
  mod: bigint,
): { value: bigint; reached: bigint } {
  if (exp === 0n) return { value: 1n % mod, reached: 0n };
  let b = ((base % mod) + mod) % mod;
  let reached = 1n;
  while (reached * 2n <= exp) {
    b = (b * b) % mod;
    reached *= 2n;
  }
  return { value: b, reached };
}

/** 이진 거듭제곱의 모듈러 곱셈 수 — 계측 사본의 기록에서 센다. */
export const binaryMults = (exp: bigint): number =>
  trace(WALK_BASE, exp, 1_000_000_007n).rounds.at(-1)?.mults ?? 0;

const YEAR_SECONDS = 31_536_000n;

function approaches(): Approach[] {
  const t = walk();
  const sq = squaringOnly(WALK_BASE, WALK_EXP, WALK_MOD);
  const years = LIMIT / PER_SECOND / YEAR_SECONDS;
  return [
    {
      name: "밑을 차례로 곱하기",
      idea: "result 에 밑을 exp 번 곱하고 곱할 때마다 법으로 줄인다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `exp = 10^18 이면 곱셈 ${num(LIMIT)} 번 · 약 ${num(years)} 년`,
          ok: false,
        },
      ],
      lesson:
        "곱셈 한 번이 지수를 1 만 올린다 — 제곱하면 곱셈 한 번에 지수가 두 배가 된다",
    },
    {
      name: "제곱만 되풀이하기",
      idea: "밑을 제곱하고 또 제곱해 지수를 1 · 2 · 4 · 8 … 로 올린다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `3^26 mod 1000 에서 ${sq.value} · 정본은 ${t.answer} · 실제로 구한 지수 ${sq.reached}`,
          ok: false,
        },
        {
          label: "시간",
          value: `곱셈 ${bitLength(WALK_EXP) - 1} 번`,
          ok: true,
        },
      ],
      lesson:
        "지수가 2 의 거듭제곱에만 간다 — 사이의 지수는 이진 표현의 켜진 자리를 모아 곱하면 된다",
    },
    {
      name: "이진 거듭제곱",
      idea: "자리마다 밑을 제곱하고, 지수의 비트가 1 인 자리의 거듭제곱만 result 에 곱한다",
      verdict: "keep",
      checks: [
        { label: "답", value: `3^26 mod 1000 에서 ${t.answer}`, ok: true },
        {
          label: "시간",
          value: `exp = 10^18 이면 곱셈 ${binaryMults(LIMIT)} 번`,
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
  /** 전체 컨셉 — 지수의 켜진 자리만 골라 그 자리의 거듭제곱을 곱한다. */
  "concept-bits": () => {
    const t = walk();
    const bits = bitsLow(WALK_EXP);
    const n = bits.length;
    const on = bits.flatMap((b, i) => (b === 1 ? [i] : []));
    const col = (i: number) => n - 1 - i;
    const offStates: Partial<Record<number, CellState>> = {};
    const onStates: Partial<Record<number, CellState>> = {};
    for (let i = 0; i < n; i++) {
      if (bits[i] === 1) onStates[col(i)] = "read";
      else offStates[col(i)] = "out";
    }
    const powers = t.rounds.map((r) => String(r.bIn));
    const chosen = on.map((i) => 2 ** i);
    return (
      <CellStage
        title={`${WALK_EXP} = ${high(chosen).join(" + ")} — 켜진 자리의 거듭제곱만 곱하면 ${WALK_BASE}^${WALK_EXP} mod ${WALK_MOD} = ${t.answer}`}
        columns={n}
        rows={[
          indexRow(n),
          {
            kind: "cells",
            label: `${WALK_EXP} 의 비트`,
            values: high(bits),
            states: onStates,
            side: bin(WALK_EXP),
          },
          { kind: "caret", cells: on.map(col), side: "켜진 자리" },
          {
            kind: "cells",
            label: "2^i",
            values: high(bits.map((_, i) => 2 ** i)),
            states: { ...offStates },
            side: `켜진 칸의 합 ${chosen.reduce((a, b) => a + b, 0)}`,
          },
          {
            kind: "cells",
            label: `${WALK_BASE}^(2^i) mod ${WALK_MOD}`,
            values: high(powers),
            states: { ...offStates },
            side: `켜진 칸의 곱 → ${t.answer}`,
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
        constraint={`지수 exp ≤ 10^18 · 1 초(단순 연산 1 초에 ${num(PER_SECOND)} 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  /** 먼저 알아 둘 개념 — 자리의 거듭제곱 줄. 이웃 칸은 제곱 한 번으로 이어진다. */
  "build-powers": () => {
    const t = walk();
    const n = t.rounds.length + 1;
    const powers = [
      ...t.rounds.map((r) => String(r.bIn)),
      String(t.rounds.at(-1)?.bOut),
    ];
    const exps = Array.from({ length: n }, (_, i) => String(2 ** i));
    const pick = 3;
    const col = (i: number) => n - 1 - i;
    return (
      <CellStage
        title={`자리 i 의 거듭제곱 ${WALK_BASE}^(2^i) mod ${WALK_MOD} — 왼쪽 칸은 오른쪽 이웃을 제곱한 값`}
        columns={n}
        rows={[
          indexRow(n),
          {
            kind: "cells",
            label: "지수 2^i",
            values: high(exps),
            states: { [col(pick)]: "read" },
          },
          {
            kind: "cells",
            label: "거듭제곱",
            values: high(powers),
            states: { [col(pick)]: "read", [col(pick - 1)]: "read" },
            side: `자리 ${pick} = 자리 ${pick - 1} 의 제곱`,
          },
          {
            kind: "caret",
            cells: [col(pick), col(pick - 1)],
            side: `${powers[pick - 1]}² mod ${WALK_MOD} = ${powers[pick]}`,
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
        title={`fastPower(${WALK_BASE}n, ${WALK_EXP}n, ${WALK_MOD}n) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns((steps[0] as Step).stage)}
        frames={frames}
      />
    );
  },
};
