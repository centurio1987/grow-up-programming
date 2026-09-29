/**
 * `bestTimeToBuyAndSellStock-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 최저가를 갱신하는 줄 뒤에 기록을 끼운
 * 계측 사본(`scanProbe`)을 정본 소스에서 기계로 만들고, 그 기록으로 날마다의 `minP` · `best` 를 얻는다.
 * 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과
 * 같은지는 `bestTimeToBuyAndSellStock-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
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
import { bestTimeToBuyAndSellStock } from "./bestTimeToBuyAndSellStock-guide.ref.ts";

const REF = new URL("./bestTimeToBuyAndSellStock-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  bestTimeToBuyAndSellStock(prices: number[]): number;
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 최저가를 갱신하는 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 그 줄에 닿은 시점에는 `best` 와 `minP` 가 둘 다 날 `i` 를 마친 값이므로,
 * 기록 하나가 반복 한 바퀴가 끝난 상태다.
 */
const scanProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)minP = Math\.min\(minP, price\);$/,
    "$1minP = Math.min(minP, price);\n$1(globalThis as any).__scan.push({ i, best, minP });",
  ],
});

/** 날 하나를 마친 상태. 날 0 은 반복 전에 정해지므로 `i = 0` 기록을 앞에 따로 둔다. */
export interface Round {
  readonly i: number;
  readonly price: number;
  /** 어제까지의 최저가 `m_{i−1}`. 날 0 에는 어제가 없다. */
  readonly minBefore: number | null;
  /** 그 최저가가 나온 날(같은 값이면 앞선 날). */
  readonly minBeforeDay: number | null;
  /** 오늘 파는 이익 `P[i] − m_{i−1}`. 날 0 에는 없다. */
  readonly gain: number | null;
  /** 이 바퀴가 끝난 뒤의 `best`. */
  readonly best: number;
  /** 이 바퀴가 끝난 뒤의 `minP` — 날 `i` 까지의 최저가 `m_i`. */
  readonly minP: number;
  /** `m_i` 가 나온 날. */
  readonly minDay: number;
  /** `best` 를 만든 거래 `[사는 날, 파는 날]`. 이익이 아직 0 이면 `null`(거래 없음). */
  readonly trade: readonly [number, number] | null;
}

/** 날 0 부터 날 `j` 까지만 놓고 본 답 — 모든 `(i, j')` 쌍을 센다. 정의를 그대로 옮긴 것이다. */
export function bestUpTo(P: readonly number[], j: number): number {
  let best = 0;
  for (let jj = 0; jj <= j; jj++) {
    for (let i = 0; i <= jj; i++) {
      best = Math.max(best, (P[jj] as number) - (P[i] as number));
    }
  }
  return best;
}

/**
 * 정본 한 번 호출의 기록. 답은 정본과 대조하고, 바퀴마다 `minP` 는 정의(날 `i` 까지의 최솟값)와,
 * `best` 는 정의(날 `i` 까지의 답)와 대조한다.
 */
export function trace(P: readonly number[]): Round[] {
  const g = globalThis as unknown as {
    __scan: { i: number; best: number; minP: number }[];
  };
  g.__scan = [];
  const probed = scanProbe.bestTimeToBuyAndSellStock([...P]);
  const got = [...g.__scan];
  if (probed !== bestTimeToBuyAndSellStock([...P])) {
    throw new Error("계측 사본이 정본과 다른 답을 냈다");
  }
  if (got.length !== P.length - 1 || got.some((c, k) => c.i !== k + 1)) {
    throw new Error("반복의 바퀴 수가 날 수 − 1 과 다르다");
  }
  const first = P[0] as number;
  const rounds: Round[] = [
    {
      i: 0,
      price: first,
      minBefore: null,
      minBeforeDay: null,
      gain: null,
      best: 0,
      minP: first,
      minDay: 0,
      trade: null,
    },
  ];
  for (const c of got) {
    const before = rounds[rounds.length - 1] as Round;
    const price = P[c.i] as number;
    const gain = price - before.minP;
    const trade: readonly [number, number] | null =
      c.best > before.best ? [before.minDay, c.i] : before.trade;
    rounds.push({
      i: c.i,
      price,
      minBefore: before.minP,
      minBeforeDay: before.minDay,
      gain,
      best: c.best,
      minP: c.minP,
      minDay: price < before.minP ? c.i : before.minDay,
      trade,
    });
  }
  for (const r of rounds) {
    const head = P.slice(0, r.i + 1);
    if (r.minP !== Math.min(...head)) {
      throw new Error(`날 ${r.i} 의 minP ${r.minP} 이 정의와 다르다`);
    }
    if (P[r.minDay] !== r.minP) {
      throw new Error(`날 ${r.i} 의 최저가 날이 값과 맞지 않는다`);
    }
    if (r.best !== bestUpTo(P, r.i)) {
      throw new Error(`날 ${r.i} 의 best ${r.best} 이 정의와 다르다`);
    }
    if (
      r.trade !== null &&
      (P[r.trade[1]] as number) - (P[r.trade[0]] as number) !== r.best
    ) {
      throw new Error(`날 ${r.i} 의 거래가 best 와 맞지 않는다`);
    }
  }
  return rounds;
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/**
 * 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). 최저가가 두 번 내려가고(날 1 · 날 3), 최대
 * 이익이 두 번 커지며(날 2 · 날 4), 답이 마지막 날이 아니라 날 4 에서 만들어진다.
 */
export const WALK: readonly number[] = [7, 2, 5, 1, 6, 3];

/** 과제 규모 — 날 수의 상한. */
export const N_MAX = 100_000;

/** 과제 규모 — 가격의 상한. */
export const MAX_PRICE = 10_000;

export const num = (x: number): string => x.toLocaleString("en-US");

/** 단순 연산 1 초에 1 억 번 기준. */
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toLocaleString("en-US", { maximumSignificantDigits: 3 })} 초`;

/** `[3,4]` 꼴 — 인덱스 구간. */
export const span = (r: readonly [number, number]): string =>
  `[${r[0]},${r[1]}]`;

/** 거래 한 줄 — `날 3 에 사서 날 4 에 판다` 꼴. 거래가 없으면 「거래 없음」. */
export const tradeText = (t: readonly [number, number] | null): string =>
  t === null ? "거래 없음" : `날 ${t[0]} 에 사서 날 ${t[1]} 에 판다`;

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** 이 걸음이 보는 거래 `[사는 날, 파는 날]`. */
  readonly range: readonly [number, number];
  readonly rangeSide: string;
  readonly readP: readonly number[];
  /** 이 걸음이 끝난 뒤의 `m` 줄 — 날마다의 접두사 최솟값. 아직 안 정한 칸은 `null`. */
  readonly m: readonly (number | null)[];
  readonly readM: readonly number[];
  readonly writeM: readonly number[];
  /** 이 걸음이 끝난 뒤의 `best` 줄 — 날마다 그때까지의 최대 이익. */
  readonly best: readonly (number | null)[];
  readonly readBest: readonly number[];
  readonly writeBest: readonly number[];
  readonly trade: readonly [number, number] | null;
  readonly pointer: number;
  readonly calc: { readonly expr: string; readonly result: string };
}

/** 전개의 걸음 — 첫날 한 걸음 + 반복 `N − 1` 걸음 + 반복을 마치는 한 걸음. */
export function walkSteps(P: readonly number[] = WALK): Step[] {
  const rounds = trace(P);
  const n = P.length;
  const m: (number | null)[] = new Array<null>(n).fill(null);
  const best: (number | null)[] = new Array<null>(n).fill(null);
  const first = rounds[0] as Round;
  m[0] = first.minP;
  best[0] = first.best;
  const steps: Step[] = [
    {
      id: "T1",
      title: "i = 0 · ①",
      detail: `minP 를 P[0] = ${first.minP}${으로(first.minP)}, best 를 ${first.best}${으로(first.best)} 둡니다. 날 0 에 사서 날 0 에 팔면 이익이 ${first.best} 입니다.`,
      range: [0, 0],
      rangeSide: `이익 ${first.best}`,
      readP: [0],
      m: [...m],
      readM: [],
      writeM: [0],
      best: [...best],
      readBest: [],
      writeBest: [0],
      trade: first.trade,
      pointer: 0,
      calc: { expr: "minP = P[0]", result: String(first.minP) },
    },
  ];
  for (const r of rounds.slice(1)) {
    const before = rounds[r.i - 1] as Round;
    const minBefore = r.minBefore as number;
    const gain = r.gain as number;
    m[r.i] = r.minP;
    best[r.i] = r.best;
    const grew = r.best > before.best;
    const down = r.minP < minBefore;
    const label = grew
      ? "best 가 커짐"
      : down
        ? "minP 가 내려감"
        : "둘 다 그대로";
    const bestText = grew
      ? `best 는 ${before.best} 에서 ${r.best}${으로(r.best)} 커집니다(③).`
      : `best 는 ${r.best} 그대로입니다(③).`;
    const minText = down
      ? `오늘 가격 ${r.price}${이가(r.price)} 최저가보다 낮아 minP 가 ${minBefore} 에서 ${r.minP}${으로(r.minP)} 내려갑니다(④).`
      : `minP 는 ${r.minP} 그대로입니다(④).`;
    steps.push({
      id: `T${steps.length + 1}`,
      title: `i = ${r.i} · ${label}`,
      detail: `오늘 팔면 ${r.price} − ${minBefore} = ${gain} 입니다. ${bestText} ${minText}`,
      range: [r.minBeforeDay as number, r.i],
      rangeSide: `이익 ${gain}`,
      readP: [r.i],
      m: [...m],
      readM: [r.i - 1],
      writeM: [r.i],
      best: [...best],
      readBest: [r.i - 1],
      writeBest: grew ? [r.i] : [],
      trade: r.trade,
      pointer: r.i,
      calc: {
        expr: `max(${before.best}, ${r.price} − ${minBefore})`,
        result: String(r.best),
      },
    });
  }
  const last = rounds[rounds.length - 1] as Round;
  const lastTrade = last.trade ?? [0, 0];
  steps.push({
    id: `T${steps.length + 1}`,
    title: `i = ${n} · 반복 끝`,
    detail: `i = ${n}${josa(n, "이라", "라")} ② 의 조건 i < ${n}${이가(n)} 거짓입니다. 반복을 마치고 best = ${last.best}${을를(last.best)} 돌려줍니다. ${last.trade === null ? "거래를 하지 않은 이익입니다." : `날 ${last.trade[0]} 에 사서 날 ${last.trade[1]} 에 판 이익입니다.`}`,
    range: [lastTrade[0], lastTrade[1]],
    rangeSide: `이익 ${last.best}`,
    readP: [],
    m: [...m],
    readM: [],
    writeM: [],
    best: [...best],
    readBest: [n - 1],
    writeBest: [],
    trade: last.trade,
    pointer: n,
    calc: { expr: `${n} < ${n}`, result: "거짓" },
  });
  return steps;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "P",
  rangeLabel: "거래",
};

/** 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
function arrayStep(s: Step, P: readonly number[] = WALK): ArrayStep {
  return {
    array: [...P],
    range: [s.range[0], s.range[1]],
    rangeSide: s.rangeSide,
    read: [...s.readP],
    write: [],
    pointers: { i: s.pointer },
    calc: { ...s.calc },
    vars: null,
    layers: [
      {
        name: "m",
        values: [...s.m],
        read: [...s.readM],
        write: [...s.writeM],
      },
      {
        name: "best",
        values: [...s.best],
        read: [...s.readBest],
        write: [...s.writeBest],
        side: s.trade === null ? "거래 없음" : `거래 ${span(s.trade)}`,
      },
    ],
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `bestTimeToBuyAndSellStock-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    profitScan: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...arrayStep(s),
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 계측기 ───────────────── */

export interface Counted {
  readonly answer: number;
  readonly subs: number;
  readonly cmps: number;
}

/**
 * 모든 `(i, j)` 쌍의 이익을 각각 만드는 방식. 정의를 그대로 옮긴 것이라 답의 기준이 되고, 쌍
 * 하나마다 뺄셈 한 번과 비교 한 번을 센다.
 */
export function byAllPairs(P: readonly number[]): Counted {
  let best = 0;
  let subs = 0;
  let cmps = 0;
  for (let i = 0; i < P.length; i++) {
    for (let j = i; j < P.length; j++) {
      subs++;
      const gain = (P[j] as number) - (P[i] as number);
      cmps++;
      best = Math.max(best, gain);
    }
  }
  return { answer: best, subs, cmps };
}

/**
 * 정본과 같은 절차에 계수만 덧붙인 것. 날 하나마다 뺄셈 한 번(오늘 파는 이익)과 비교 두 번(최대 이익
 * 갱신 · 최저가 갱신)이다. 답은 정본과 대조한다.
 */
export function byCarrying(P: readonly number[]): Counted {
  let minP = P[0] as number;
  let best = 0;
  let subs = 0;
  let cmps = 0;
  for (let i = 1; i < P.length; i++) {
    const price = P[i] as number;
    subs++;
    const gain = price - minP;
    cmps++;
    best = Math.max(best, gain);
    cmps++;
    minP = Math.min(minP, price);
  }
  if (best !== bestTimeToBuyAndSellStock([...P])) {
    throw new Error("계측기가 정본과 다른 답을 냈다");
  }
  return { answer: best, subs, cmps };
}

/**
 * 가장 단순한 후보 — **배열 전체의 최고가에서 전체의 최저가를 뺀다.** 날짜 순서를 안 보므로
 * 최저가가 최고가보다 뒤에 있어도 그 둘을 짝지어 버린다.
 */
export function globalGap(P: readonly number[]): number {
  let low = P[0] as number;
  let high = P[0] as number;
  for (const p of P) {
    low = Math.min(low, p);
    high = Math.max(high, p);
  }
  return Math.max(0, high - low);
}

/** 가격이 계속 내려가는 입력 — 순서를 안 보는 후보가 어긋나는 자리를 그림에 싣는다. */
export const FALLING: readonly number[] = [7, 6, 4, 3, 1];

function approaches(): Approach[] {
  const pairs = byAllPairs(WALK);
  const carry = byCarrying(WALK);
  const bigPairs = N_MAX * (N_MAX + 1);
  const bigCarry = 3 * (N_MAX - 1);
  const gap = globalGap(FALLING);
  const right = bestTimeToBuyAndSellStock([...FALLING]);
  return [
    {
      name: "모든 쌍 만들기",
      idea: "사는 날 i 와 파는 날 j 를 모두 골라 이익을 만들고, 그중 최댓값을 고른다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `맞다 · 여섯 날 입력에서 기본 연산 ${num(pairs.subs + pairs.cmps)} 번`,
          ok: true,
        },
        {
          label: "시간",
          value: `N = ${num(N_MAX)} 이면 기본 연산 ${num(bigPairs)} 번 · ${secondsOf(bigPairs)}`,
          ok: false,
        },
      ],
      lesson:
        "파는 날마다 앞쪽 가격을 처음부터 다시 읽는다 — 앞쪽에서 필요한 것은 최솟값 하나가 아닐까",
    },
    {
      name: "전체 최고가 − 전체 최저가",
      idea: "배열 전체의 가장 높은 가격에서 가장 낮은 가격을 뺀다",
      verdict: "drop",
      checks: [
        { label: "시간", value: "날마다 비교 둘", ok: true },
        {
          label: "답",
          value: `[${FALLING.join(" ")}] 에서 ${gap} · 정답은 ${right}`,
          ok: false,
        },
      ],
      lesson:
        "최저가가 최고가보다 뒤에 있으면 짝지을 수 없다 — 파는 날마다 그 앞쪽만의 최저가를 쓰면 어떨까",
    },
    {
      name: "날마다 이어받기",
      idea: "어제까지의 최저가를 한 날씩 넘겨받아 오늘 파는 이익을 재고, 지나온 이익의 최댓값을 따로 든다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `맞다 · 여섯 날 입력에서 기본 연산 ${num(carry.subs + carry.cmps)} 번`,
          ok: true,
        },
        {
          label: "시간",
          value: `N = ${num(N_MAX)} 이면 기본 연산 ${num(bigCarry)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-rows": () => {
    const rounds = trace(WALK);
    const last = rounds[rounds.length - 1] as Round;
    const [buy, sell] = last.trade ?? [0, 0];
    const rows: StageRow[] = [
      {
        kind: "bracket",
        label: "답",
        from: buy,
        to: sell,
        tone: "query",
        text: `날 ${buy} 에 사서 날 ${sell} 에 판다 · 이익 ${last.best}`,
      },
      { kind: "index", label: "날" },
      {
        kind: "cells",
        label: "P",
        values: [...WALK],
        states: { [buy]: "read", [sell]: "read" },
      },
      {
        kind: "cells",
        label: "m",
        values: rounds.map((r) => r.minP),
        side: "날 j 까지의 최저가",
      },
      {
        kind: "cells",
        label: "이익",
        values: rounds.map((r) => (r.gain === null ? "—" : r.gain)),
        states: { [sell]: "focus" },
        side: "P[j] − 어제까지의 최저가",
      },
      {
        kind: "cells",
        label: "best",
        values: rounds.map((r) => r.best),
        side: "날 j 까지의 최대 이익",
      },
    ];
    return (
      <CellStage
        title={`P = [${WALK.join(", ")}] 과 날마다의 접두사 최솟값 m · 오늘 파는 이익 · 그때까지의 최대 이익 best`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`N 최대 ${num(N_MAX)} · 1 초(단순 연산 1 초에 1 억 번 기준) · 사는 날은 파는 날보다 뒤일 수 없다`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-prefix": () => {
    const rounds = trace(WALK);
    const rows: StageRow[] = [
      { kind: "index", label: "날" },
      { kind: "cells", label: "P", values: [...WALK] },
    ];
    for (const r of rounds) {
      rows.push({
        kind: "bracket",
        label: `m_${r.i}`,
        from: 0,
        to: r.i,
        tone: r.minDay === r.i ? "make" : "left",
        text: `최솟값 ${r.minP} · 날 ${r.minDay}`,
        side: r.minDay === r.i && r.i > 0 ? "내려감" : undefined,
      });
    }
    const low: Partial<Record<number, CellState>> = {};
    for (const r of rounds) if (r.minDay === r.i) low[r.i] = "focus";
    rows.push({
      kind: "cells",
      label: "m",
      values: rounds.map((r) => r.minP),
      states: low,
      side: "접두사 최솟값",
    });
    return (
      <CellStage
        title="날 0 부터 날 j 까지의 조각과 그 최솟값 — 접두사 최솟값 m_j"
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "walk-scan": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.calc.expr} = ${s.calc.result}`,
      rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`bestTimeToBuyAndSellStock([${WALK.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(steps[0] as Step))}
        frames={frames}
      />
    );
  },
};
