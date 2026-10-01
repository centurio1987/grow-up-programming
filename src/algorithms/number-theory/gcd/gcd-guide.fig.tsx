/**
 * `gcd-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 나머지를 구하는 줄 뒤에 기록을 끼운
 * 계측 사본(`probed`)을 정본 소스에서 기계로 만들고, 그 기록으로 나눗셈마다의 `x` · `y` · `r` 을 얻는다.
 * 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `gcd-guide.test.ts` 가 잰다.
 *
 * **무대는 나머지 수열이다.** 칸 `k` 가 나머지 수열의 `k` 번째 항 `r_k` 이고, 이웃한 두 칸이 한 바퀴의
 * `(x, y)` 다. 괄호가 바퀴를 시작할 때의 쌍이고, 바퀴마다 새 나머지 한 칸이 오른쪽에 채워진다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
import { gcd } from "./gcd-guide.ref.ts";

const REF = new URL("./gcd-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 나머지를 구한 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지 않으면
 * `loadMutant` 가 던진다. 기록하는 때는 나머지를 구한 직후, 두 값을 옮기기 직전이다. 그래서 `x` · `y` 는
 * 바퀴를 시작할 때의 쌍이고 `r` 은 그 바퀴가 만든 나머지다.
 */
const probed = await loadMutant<{ gcd(a: bigint, b: bigint): bigint }>(REF, {
  swap: [
    /^(\s*)const r = x % y;$/,
    "$1const r = x % y;\n$1(globalThis as any).__divisions.push({ x, y, r });",
  ],
});

/** 나눗셈 한 번 — 바퀴 `k` 의 기록. */
export interface Division {
  /** 바퀴 번호. 0 부터 센다. 이 바퀴의 쌍은 나머지 수열의 칸 `k` · `k + 1` 이다. */
  readonly k: number;
  /** 바퀴를 시작할 때의 `x` — 나누어지는 수. */
  readonly x: bigint;
  /** 바퀴를 시작할 때의 `y` — 나누는 수. */
  readonly y: bigint;
  /** 몫. 정본은 몫을 쓰지 않으므로 `x / y` 로 따로 구하고 `x = q·y + r` 로 대조한다. */
  readonly q: bigint;
  /** 이 바퀴가 만든 나머지 — 나머지 수열의 칸 `k + 2`. */
  readonly r: bigint;
}

export interface Trace {
  /** 부호를 뗀 뒤의 두 값 — 나머지 수열의 칸 0 · 1. */
  readonly init: { readonly x: bigint; readonly y: bigint };
  readonly divisions: readonly Division[];
  /** 나머지 수열 전체 — `init.x`, `init.y`, 그리고 나눗셈마다 나온 나머지. */
  readonly chain: readonly bigint[];
  readonly answer: bigint;
}

const abs = (v: bigint): bigint => (v < 0n ? -v : v);

/**
 * 정본 한 번 호출의 기록. 답은 정본과 대조하고, 바퀴 사이의 값은 이렇게 대조한다 — 첫 바퀴의 쌍이 두
 * 입력의 절댓값인가, 다음 바퀴의 쌍이 앞 바퀴의 `(y, r)` 인가, `x = q·y + r` 이고 `0 ≤ r < y` 인가.
 * 어긋나면 던진다 — 그림이 정본과 다른 것을 그리지 않게.
 */
export function trace(a: bigint, b: bigint): Trace {
  const g = globalThis as unknown as {
    __divisions: { x: bigint; y: bigint; r: bigint }[];
  };
  g.__divisions = [];
  const got = probed.gcd(a, b);
  const answer = gcd(a, b);
  if (got !== answer) {
    throw new Error(`계측 사본이 정본과 다른 답을 냈다 — ${got} ≠ ${answer}`);
  }
  const init = { x: abs(a), y: abs(b) };
  const chain: bigint[] = [init.x, init.y];
  const divisions: Division[] = [];
  let x = init.x;
  let y = init.y;
  for (const [k, d] of g.__divisions.entries()) {
    if (d.x !== x || d.y !== y) {
      throw new Error(`바퀴 ${k} 의 쌍이 앞 바퀴의 (y, r) 이 아니다`);
    }
    const q = d.x / d.y;
    if (d.x !== q * d.y + d.r || d.r < 0n || d.r >= d.y) {
      throw new Error(`바퀴 ${k} 가 x = q·y + r, 0 ≤ r < y 를 어긴다`);
    }
    divisions.push({ k, x: d.x, y: d.y, q, r: d.r });
    chain.push(d.r);
    x = d.y;
    y = d.r;
  }
  if (y !== 0n) throw new Error("반복이 끝났는데 y 가 0 이 아니다");
  if (x !== answer) throw new Error("마지막 x 가 답과 다르다");
  return { init, divisions, chain, answer };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK_A = -273n;
export const WALK_B = 441n;

/** 과제 규모 — 두 수의 절댓값의 상한과, 수치 반박에 쓰는 처리 속도(단순 연산 1 초에 1 억 번). */
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

/** 과제 규모 안에서 가장 큰 이웃 피보나치 쌍의 번호 `k` — `F(k) ≤ LIMIT < F(k + 1)`. */
export const WORST_K = (() => {
  let k = 1;
  while (fib(k + 1) <= LIMIT) k++;
  return k;
})();

/** 두 수를 둘 다 나누는 수 전부. 작은 수에만 쓴다(1 부터 큰 쪽까지 하나씩 본다). */
export function commonDivisors(x: bigint, y: bigint): bigint[] {
  const top = x > y ? x : y;
  const out: bigint[] = [];
  for (let d = 1n; d <= top; d++) if (x % d === 0n && y % d === 0n) out.push(d);
  return out;
}

export const setText = (s: readonly bigint[]): string =>
  `{${s.map(String).join(", ")}}`;

/**
 * 뺄셈만 쓰는 후보의 뺄셈 횟수를 **몫의 합으로** 센다. 큰 쪽에서 작은 쪽을 빼는 일을 되풀이하면 한
 * 바퀴의 몫 `q` 만큼 뺄셈을 한 뒤 정본의 다음 쌍과 같은 쌍에 이르므로, 몫을 다 더한 값이 뺄셈 횟수다.
 * 뺄셈을 실제로 되풀이하는 판(`subtractLoop`)과 작은 입력에서 같은지는 증명 블록이 대조한다 — 큰
 * 입력은 되풀이하면 끝나지 않으므로 이 값만 센다.
 */
export const subtractCount = (a: bigint, b: bigint): bigint =>
  trace(a, b).divisions.reduce((s, d) => s + d.q, 0n);

/** 뺄셈을 실제로 되풀이하는 판. 두 수가 다 0 이 아닌 동안 큰 쪽에서 작은 쪽을 뺀다. */
export function subtractLoop(
  a: bigint,
  b: bigint,
): { answer: bigint; steps: number; pairs: [bigint, bigint][] } {
  let x = abs(a);
  let y = abs(b);
  const pairs: [bigint, bigint][] = [[x, y]];
  let steps = 0;
  while (x !== 0n && y !== 0n) {
    steps += 1;
    if (x > y) x -= y;
    else y -= x;
    pairs.push([x, y]);
  }
  return { answer: x === 0n ? y : x, steps, pairs };
}

/** 1 부터 작은 쪽까지 전부 나눠 보는 방법의 나눗셈 횟수 — 후보 하나에 두 번이다. */
export const bruteCount = (a: bigint, b: bigint): bigint => {
  const x = abs(a);
  const y = abs(b);
  if (x === 0n || y === 0n) return 0n;
  return 2n * (x < y ? x : y);
};

let walkMemo: Trace | undefined;
/** 전개 입력의 기록. 그림 · 증명 · 패널이 같은 기록을 쓴다. */
export const walk = (): Trace => {
  walkMemo ??= trace(WALK_A, WALK_B);
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
  arrayName: "나머지 수열",
  rangeLabel: "(x, y)",
};

/**
 * 전개 입력의 걸음 — 부호를 떼는 걸음(T1) · 바퀴마다 한 걸음 · 반복을 끝내는 한 걸음.
 *
 * 무대는 나머지 수열 전체의 칸을 첫 걸음부터 둔다(칸 `k` 가 `r_k`, 아직 안 구한 칸은 빈칸). 괄호 `(x, y)` 가
 * 바퀴를 시작할 때의 쌍이고, ▲ 가 이번에 나눈 두 칸이다. 새로 쓴 칸이 이번 바퀴의 나머지다. 쌍의 공약수
 * 집합을 값 줄 곁말에 적는다 — 이 편의 불변식이 「쌍이 바뀌어도 그 집합은 그대로」다.
 */
export function walkSteps(): Step[] {
  const t = walk();
  const n = t.chain.length;
  const cells: (number | null)[] = Array.from({ length: n }, () => null);
  cells[0] = Number(t.init.x);
  cells[1] = Number(t.init.y);
  const common = (x: bigint, y: bigint) =>
    `공약수 ${setText(commonDivisors(x, y))}`;
  const steps: Step[] = [];
  steps.push({
    id: "T1",
    title: "부호를 뗀다",
    detail: `a = ${WALK_A}${이가(String(WALK_A))} 음수라 x 를 절댓값 ${t.init.x}${으로(String(t.init.x))} 둡니다. b = ${WALK_B}${은는(String(WALK_B))} 이미 양수라 y 가 ${t.init.y} 그대로입니다. 이 두 값이 나머지 수열의 첫 두 칸입니다.`,
    stage: {
      array: [...cells],
      range: [0, 1],
      rangeSide: common(t.init.x, t.init.y),
      read: [],
      write: [0, 1],
      pointers: { x: 0, y: 1 },
      calc: {
        expr: `|${WALK_A}| · |${WALK_B}|`,
        result: `x = ${t.init.x} · y = ${t.init.y}`,
      },
      vars: "나눗셈 0",
    },
  });
  for (const d of t.divisions) {
    cells[d.k + 2] = Number(d.r);
    const next = `다음 쌍은 (${d.y}, ${d.r}) 입니다`;
    const how =
      d.q === 0n
        ? `x 가 y 보다 작아 몫이 0 이고 나머지가 x 자신인 ${d.r} 입니다. ${next} — 두 값이 뒤바뀌었습니다`
        : d.r === 0n
          ? `몫 ${d.q}, 나머지 ${d.r} 입니다. 나머지가 0 이 나왔고, ${next}`
          : `몫 ${d.q}, 나머지 ${d.r} 입니다. ${next}`;
    steps.push({
      id: `T${d.k + 2}`,
      title: `${d.x} = ${d.q} × ${d.y} + ${d.r}`,
      detail: `${d.x}${을를(String(d.x))} ${d.y}${으로(String(d.y))} 나눕니다. ${how}.`,
      stage: {
        array: [...cells],
        range: [d.k, d.k + 1],
        rangeSide: common(d.x, d.y),
        read: [d.k, d.k + 1],
        write: [d.k + 2],
        pointers: { x: d.k, y: d.k + 1 },
        calc: { expr: `${d.x} mod ${d.y}`, result: `${d.r}` },
        vars: `나눗셈 ${d.k + 1}`,
      },
    });
  }
  const last = t.divisions.length;
  steps.push({
    id: `T${last + 2}`,
    title: "y = 0 · 반환",
    detail: `y 가 0 이라 반복 조건이 거짓입니다. 반복을 끝내고 x = ${t.answer}${을를(String(t.answer))} 돌려줍니다. (${t.answer}, 0) 의 공약수 집합은 ${t.answer} 의 약수 전체이고, 그중 가장 큰 것이 ${t.answer} 입니다.`,
    stage: {
      array: [...cells],
      range: [last, last + 1],
      rangeSide: common(t.answer, 0n),
      read: [last, last + 1],
      write: [],
      pointers: { x: last, y: last + 1 },
      calc: { expr: "y = 0", result: `반복 끝 → ${t.answer} 반환` },
      vars: `나눗셈 ${last}`,
    },
  });
  return steps;
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `gcd-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    gcdWalk: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

function approaches(): Approach[] {
  const t = walk();
  const worstA = fib(WORST_K);
  const worstB = fib(WORST_K - 1);
  const bruteWorst = bruteCount(LIMIT, LIMIT - 1n);
  const bruteYears = bruteWorst / PER_SECOND / YEAR_SECONDS;
  const subOne = subtractCount(1n, LIMIT);
  const subYears = subOne / PER_SECOND / YEAR_SECONDS;
  const worstDivisions = trace(worstA, worstB).divisions.length;
  return [
    {
      name: "1 부터 전부 나눠 보기",
      idea: "1 부터 작은 쪽까지 모든 수로 두 수를 나눠 보고, 둘 다 나누는 가장 큰 수를 남긴다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `작은 쪽이 10^18 언저리면 나눗셈 ${num(bruteWorst)} 번 · 약 ${num(bruteYears)} 년`,
          ok: false,
        },
      ],
      lesson:
        "후보를 작은 쪽의 값만큼 본다 — 약수를 찾지 말고, 공약수 집합을 그대로 둔 채 두 수를 줄인다",
    },
    {
      name: "큰 쪽에서 작은 쪽 빼기",
      idea: "두 수가 다 0 이 아닌 동안 큰 쪽에서 작은 쪽을 뺀다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `1 과 10^18 이면 뺄셈 ${num(subOne)} 번 · 약 ${num(subYears)} 년`,
          ok: false,
        },
      ],
      lesson:
        "같은 수를 몫만큼 되풀이해 뺀다 — 그 되풀이의 결과가 나머지 한 번이다",
    },
    {
      name: "유클리드 호제법",
      idea: "(x, y) 를 (y, x mod y) 로 바꾸는 일을 y 가 0 이 될 때까지 되풀이한다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `gcd(${WALK_A}, ${WALK_B}) 에서 ${t.answer}`,
          ok: true,
        },
        {
          label: "시간",
          value: `두 수가 10^18 이하면 나눗셈 많아야 ${worstDivisions} 번`,
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

export const FIGS: Record<string, () => ReactElement> = {
  /** 전체 컨셉 — 두 수의 약수를 값 순서로 늘어놓고 둘 다 나누는 칸을 짚는다. */
  "concept-divisors": () => {
    const t = walk();
    const x = t.init.x;
    const y = t.init.y;
    const all = [
      ...new Set([...commonDivisors(x, x), ...commonDivisors(y, y)]),
    ].sort((p, q) => (p < q ? -1 : p > q ? 1 : 0));
    const common = commonDivisors(x, y);
    const at = (d: bigint) => all.indexOf(d);
    const states: Partial<Record<number, CellState>> = {};
    for (const d of common) states[at(d)] = "read";
    states[at(t.answer)] = "focus";
    const row = (v: bigint): StageRow => ({
      kind: "cells",
      label: `${v} 의 약수`,
      values: all.map((d) => (v % d === 0n ? String(d) : null)),
      states,
      side: `${commonDivisors(v, v).length} 개`,
    });
    return (
      <CellStage
        title={`${x}${과와(String(x))} ${y} 의 약수 — 둘 다 나누는 ${common.join(" · ")} 가운데 가장 큰 ${t.answer}${이가(String(t.answer))} 최대공약수`}
        columns={all.length}
        rows={[
          row(x),
          row(y),
          {
            kind: "caret",
            cells: common.map(at),
            side: `공약수 ${common.length} 개 · 가장 큰 것 ${t.answer}`,
          },
        ]}
      />
    );
  },

  /** 전체 컨셉 — 나머지 수열. 이웃한 두 칸이 한 걸음의 쌍이고, 모든 쌍의 공약수 집합이 같다. */
  "concept-chain": () => {
    const t = walk();
    const n = t.chain.length;
    const last = t.divisions.length;
    const qs: (string | null)[] = Array.from({ length: n }, (_, k) => {
      const d = t.divisions[k];
      return d === undefined ? null : String(d.q);
    });
    const sets = t.chain
      .slice(0, n - 1)
      .map((v, k) => setText(commonDivisors(v, t.chain[k + 1] as bigint)));
    const same = sets.every((s) => s === sets[0]);
    if (!same) throw new Error("쌍마다 공약수 집합이 다르다");
    return (
      <CellStage
        title={`gcd(${WALK_A}, ${WALK_B}) 의 나머지 수열 — 이웃한 두 칸이 한 걸음의 (x, y) 이고, ${n - 1} 쌍 모두 공약수가 ${sets[0]}`}
        columns={n}
        rows={[
          {
            kind: "index",
            label: "칸",
            labels: t.chain.map((_, k) => rName(k)),
          },
          {
            kind: "cells",
            label: "나머지 수열",
            values: t.chain.map(String),
            states: { [n - 1]: "focus" },
            side: `칸 ${n} 개 · 마지막이 0`,
          },
          {
            kind: "cells",
            label: "몫",
            values: qs,
            side: `나눗셈 ${last} 번`,
          },
          {
            kind: "bracket",
            label: "처음 쌍",
            from: 0,
            to: 1,
            tone: "query",
            text: `(${t.chain[0]}, ${t.chain[1]})`,
          },
          {
            kind: "bracket",
            label: "마지막 쌍",
            from: n - 2,
            to: n - 1,
            tone: "left",
            text: `(${t.chain[n - 2]}, 0) → ${t.answer}`,
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

  "walk-run": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.stage.calc?.expr} → ${s.stage.calc?.result}`,
      rows: arrayStage(s.stage, ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`gcd(${WALK_A}n, ${WALK_B}n) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns((steps[0] as Step).stage)}
        frames={frames}
      />
    );
  },

  /** 최악을 만드는 입력 — 이웃 피보나치 쌍은 몫이 전부 1 이라 수열이 가장 길다. */
  "worst-fib": () => {
    const k = 12;
    const fibPair = trace(fib(k), fib(k - 1));
    const other = trace(fib(k), 100n);
    const n = Math.max(fibPair.chain.length, other.chain.length);
    const qRow = (t: Trace): (string | null)[] =>
      Array.from({ length: n }, (_, i) => {
        const d = t.divisions[i];
        return d === undefined ? null : String(d.q);
      });
    const cells = (t: Trace): (string | null)[] =>
      Array.from({ length: n }, (_, i) => {
        const v = t.chain[i];
        return v === undefined ? null : String(v);
      });
    const ones = (t: Trace) => t.divisions.filter((d) => d.q === 1n).length;
    return (
      <CellStage
        title={`나머지 수열 둘 — 이웃 피보나치 쌍 (${fib(k)}, ${fib(k - 1)}) 은 몫이 거의 전부 1 이라 칸이 가장 많다`}
        columns={n}
        rows={[
          {
            kind: "index",
            label: "칸",
            labels: cells(fibPair).map((_, i) => rName(i)),
          },
          {
            kind: "cells",
            label: `${fib(k)} · ${fib(k - 1)}`,
            values: cells(fibPair),
            side: `나눗셈 ${fibPair.divisions.length} 번`,
          },
          {
            kind: "cells",
            label: "몫",
            values: qRow(fibPair),
            side: `몫 1 이 ${ones(fibPair)} 번`,
          },
          {
            kind: "cells",
            label: `${fib(k)} · 100`,
            values: cells(other),
            side: `나눗셈 ${other.divisions.length} 번`,
          },
          {
            kind: "cells",
            label: "몫",
            values: qRow(other),
            side: `몫 1 이 ${ones(other)} 번`,
          },
        ]}
      />
    );
  },
};
