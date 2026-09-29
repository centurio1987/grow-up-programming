/**
 * `binaryGap-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 한 자리 내리는 줄 앞에 기록을 끼운
 * 계측 사본(`stepProbe`)을 정본 소스에서 기계로 만들고, 그 기록으로 반복마다의 `i` · `x` · `last` ·
 * `best` 를 얻는다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의
 * 리터럴이 그것과 같은지는 `binaryGap-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 을를, 이가 } from "../../../../tools/josa.ts";
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
  type ArrayPiece,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { binaryGap } from "./binaryGap-guide.ref.ts";

const REF = new URL("./binaryGap-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  binaryGap(n: number): number;
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 한 자리 내리는 줄 앞에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 기록하는 때는 이번 자리를 읽고 `last` · `best` 를 고친 직후, `x` 를
 * 내리기 직전이다.
 */
const stepProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)x >>>= 1;$/,
    "$1(globalThis as any).__iter.push({ i, x, last, best });\n$1x >>>= 1;",
  ],
});

/** 자리 하나를 읽은 반복 한 번의 기록. */
export interface Iter {
  readonly i: number;
  /** 이 반복이 읽은 `x` — `n >>> i`. */
  readonly x: number;
  readonly bit: 0 | 1;
  /** 이 반복을 시작할 때의 `last`. */
  readonly lastBefore: number;
  readonly last: number;
  /** ① 로 잰 값. 재지 않았으면 `null`. */
  readonly measured: number | null;
  readonly best: number;
}

/** 자리 `p` 의 비트 — 정의대로 문자열에서 읽는다. */
const bitAt = (n: number, p: number): 0 | 1 => {
  const s = n.toString(2);
  return s[s.length - 1 - p] === "1" ? 1 : 0;
};

/** 정의대로 센 가장 긴 binary gap — 자리 0 ~ `upto` 만 떼어 본 수에서. */
function gapByDefinition(n: number, upto: number): number {
  const ones: number[] = [];
  for (let p = 0; p <= upto; p++) if (bitAt(n, p) === 1) ones.push(p);
  let best = 0;
  for (let k = 1; k < ones.length; k++) {
    best = Math.max(best, (ones[k] as number) - (ones[k - 1] as number) - 1);
  }
  return best;
}

/**
 * 정본 한 번 호출의 기록. 답은 정본과, 반복마다의 `last` · `best` 는 정의(자리 0 ~ `i` 를 직접 센 값)와
 * 대조한다. 어긋나면 던진다 — 그림이 정본과 다른 것을 그리지 않게.
 */
export function trace(n: number): { iters: Iter[]; answer: number } {
  const g = globalThis as unknown as {
    __iter: { i: number; x: number; last: number; best: number }[];
  };
  g.__iter = [];
  const probed = stepProbe.binaryGap(n);
  const raw = [...g.__iter];
  const answer = binaryGap(n);
  if (probed !== answer) throw new Error("계측 사본이 정본과 다른 답을 냈다");
  if (raw.length !== n.toString(2).length) {
    throw new Error("반복 수가 이진 자리 수와 다르다");
  }
  let lastBefore = -1;
  let bestBefore = 0;
  const iters = raw.map((r): Iter => {
    const bit = bitAt(n, r.i);
    if (r.x !== Math.floor(n / 2 ** r.i)) {
      throw new Error(`자리 ${r.i} 의 x 가 n 을 ${r.i} 자리 내린 값과 다르다`);
    }
    const highest = [...Array(r.i + 1).keys()]
      .filter((p) => bitAt(n, p) === 1)
      .at(-1);
    if (r.last !== (highest ?? -1)) {
      throw new Error(`자리 ${r.i} 의 last 가 정의와 다르다`);
    }
    if (r.best !== gapByDefinition(n, r.i)) {
      throw new Error(`자리 ${r.i} 의 best 가 정의와 다르다`);
    }
    const measured = bit === 1 && lastBefore >= 0 ? r.i - lastBefore - 1 : null;
    const it: Iter = {
      i: r.i,
      x: r.x,
      bit,
      lastBefore,
      last: r.last,
      measured,
      best: r.best,
    };
    lastBefore = r.last;
    bestBefore = r.best;
    return it;
  });
  if (bestBefore !== answer) throw new Error("마지막 best 가 답과 다르다");
  return { iters, answer };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK = 322;

/** 과제의 값 상한과 호출 횟수. */
const MAX_N = 2_147_483_647;
const CALLS = 1_000_000;

const num = (x: number): string => x.toLocaleString("en-US");
const fixed2 = (x: number): string =>
  (Math.round(x * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const bin = (x: number): string => `${x.toString(2)}₂`;

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

/** 1 인 두 자리를 모두 짝짓고 사이를 전부 읽는 방법의 읽기 수 — 문자열 그대로 센다. */
function pairReadsDirect(n: number): number {
  const bits = n.toString(2);
  let reads = 0;
  for (let a = 0; a < bits.length; a++) {
    for (let b = a + 1; b < bits.length; b++) {
      if (bits[a] !== "1" || bits[b] !== "1") continue;
      reads += b - a - 1;
    }
  }
  return reads;
}

/**
 * 같은 읽기 수를 1 자리만으로 — 1 쌍 `(p, q)` 마다 `q − p − 1`. 자리를 한 번 돌며 앞의 1 개수와 자리 합을
 * 들고 가서 수 하나를 `L` 번에 센다(백만 개를 세야 해서 `pairReadsDirect` 대신 쓴다).
 */
function pairReadsFast(n: number): number {
  let reads = 0;
  let count = 0;
  let sum = 0;
  let x = n;
  for (let p = 0; x !== 0; p++) {
    if (x % 2 === 1) {
      reads += count * (p - 1) - sum;
      count++;
      sum += p;
    }
    x = Math.floor(x / 2);
  }
  return reads;
}

/** 가장 긴 0 의 연속 — 1 로 잘라 가장 긴 조각. */
const longestZeroRun = (n: number): number =>
  Math.max(
    ...n
      .toString(2)
      .split("1")
      .map((s) => s.length),
  );

export function approaches(): Approach[] {
  for (const n of [WALK, 9, 529, 1_041, 6, MAX_N, 2 ** 30 + 1]) {
    if (pairReadsFast(n) !== pairReadsDirect(n)) {
      throw new Error(`${n} 에서 두 셈이 다르다`);
    }
  }
  const from = MAX_N - CALLS + 1;
  let pairReads = 0;
  let scanReads = 0;
  for (let n = from; n <= MAX_N; n++) {
    pairReads += pairReadsFast(n);
    scanReads += n.toString(2).length;
  }
  // 한 번 읽기의 읽기 수는 정본의 반복 수다 — 이진 자리 수와 같은지 몇 수에서 계측으로 확인한다.
  for (const n of [from, WALK, MAX_N]) {
    if (trace(n).iters.length !== n.toString(2).length) {
      throw new Error(`${n} 에서 반복 수가 자리 수와 다르다`);
    }
  }
  // 가장 긴 0 의 연속이 정의와 갈리는 가장 작은 수.
  let miss = 1;
  while (longestZeroRun(miss) === binaryGap(miss)) miss++;
  const range = `${num(from)} ~ ${num(MAX_N)}`;
  return [
    {
      name: "1 인 두 자리 모두 짝짓기",
      idea: "이진 문자열에서 1 인 두 자리를 모두 짝짓고, 사이를 전부 읽어 0 뿐인지 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `${range}${을를(MAX_N)} 부르면 사이 읽기 ${num(pairReads)} 번 · ${fixed2(pairReads / 1e8)} 초`,
          ok: false,
        },
      ],
      lesson:
        "이웃하지 않은 쌍까지 읽는다 — 사이를 셀 것 없이 가장 긴 0 의 연속을 세면 어떨까",
    },
    {
      name: "가장 긴 0 의 연속",
      idea: "이진 문자열을 1 로 잘라 가장 긴 조각의 길이를 잰다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `${miss} = ${bin(miss)} 에서 ${longestZeroRun(miss)} · 실제 ${binaryGap(miss)}`,
          ok: false,
        },
      ],
      lesson:
        "닫히지 않은 0 을 센다 — 직전 1 의 자리를 기억하며 이웃한 두 1 만 재면 어떨까",
    },
    {
      name: "직전 1 자리를 기억하는 한 번 읽기",
      idea: "낮은 자리부터 한 자리씩 읽고, 1 을 만나면 i − last − 1 을 재어 가장 큰 것을 남긴다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `${range}${을를(MAX_N)} 부르면 자리 읽기 ${num(scanReads)} 번 · ${fixed2(scanReads / 1e8)} 초`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly iter: Iter;
  readonly calc: { readonly expr: string; readonly result: string };
}

export function walkSteps(n: number = WALK): Step[] {
  const t = trace(n);
  return t.iters.map((it, k): Step => {
    const read = `자리 ${it.i} 에서 x = ${bin(it.x)} 의 가장 낮은 자리 ${it.bit}${을를(it.bit)} 읽습니다.`;
    let rest: string;
    let calc: Step["calc"];
    if (it.bit === 0) {
      rest = "0 이라 한 칸 내리기만 합니다.";
      calc = { expr: `${it.x} & 1`, result: "0 → 내리기만" };
    } else if (it.measured === null) {
      rest = `직전 1 이 없어(last = ${it.lastBefore}) 재지 않고 last = ${it.i} 로 둡니다.`;
      calc = {
        expr: `${it.lastBefore} >= 0`,
        result: `거짓 → last = ${it.i}`,
      };
    } else {
      const kept =
        it.best === it.measured
          ? "best 가 됩니다"
          : "best 보다 작아 best 는 그대로입니다";
      rest = `직전 1 의 자리 ${it.lastBefore}${과와(it.lastBefore)}의 사이에 0 이 ${it.measured} 개라 ${kept}. last = ${it.i} 로 둡니다.`;
      calc = {
        expr: `max(${t.iters[k - 1]?.best ?? 0}, ${it.i} − ${it.lastBefore} − 1)`,
        result: String(it.best),
      };
    }
    return {
      id: `T${k + 1}`,
      title: `i = ${it.i}`,
      detail: `${read} ${rest}`,
      iter: it,
      calc,
    };
  });
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "자리 i 의 비트",
  rangeLabel: "읽은 자리",
};

/** 자리 0 부터의 비트 — 무대의 칸 `i` 가 자리 `i` 다(이진 표기와 좌우가 거꾸로다). */
const bitsLow = (n: number): (0 | 1)[] =>
  Array.from({ length: n.toString(2).length }, (_, p) => bitAt(n, p));

/** 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
export function arrayStep(s: Step, n: number = WALK): ArrayStep {
  const it = s.iter;
  const pieces: ArrayPiece[] =
    it.measured !== null && it.measured > 0
      ? [
          {
            label: "잰 0 구간",
            from: it.lastBefore + 1,
            to: it.i - 1,
            tone: "left",
            text: `${it.measured} 개`,
          },
        ]
      : [];
  return {
    array: bitsLow(n),
    range: [0, it.i],
    read: [it.i],
    write: it.bit === 1 ? [it.i] : [],
    pointers: it.last >= 0 ? { last: it.last } : {},
    calc: { ...s.calc },
    vars: `best = ${it.best}`,
    pieces,
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `binaryGap-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    scan: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...arrayStep(s),
    })),
  };
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 1 이 있는 자리를 낮은 자리부터 — 정의대로. */
const onePositions = (n: number): number[] =>
  bitsLow(n).flatMap((b, p) => (b === 1 ? [p] : []));

export const FIGS: Record<string, () => ReactElement> = {
  "concept-bits": () => {
    const L = WALK.toString(2).length;
    // 이진 표기 그대로 높은 자리를 왼쪽에 둔다 — 열 c 가 자리 L − 1 − c 다.
    const col = (p: number): number => L - 1 - p;
    const ones = onePositions(WALK);
    const gaps = ones.slice(1).map((q, k) => ({
      lo: ones[k] as number,
      hi: q,
      len: q - (ones[k] as number) - 1,
    }));
    const answer = binaryGap(WALK);
    const lowest = ones[0] as number;
    const states: Partial<Record<number, CellState>> = {};
    for (const p of ones) states[col(p)] = "focus";
    const rows: StageRow[] = [
      {
        kind: "index",
        label: "자리",
        labels: Array.from({ length: L }, (_, c) => L - 1 - c),
      },
      {
        kind: "cells",
        label: "비트",
        values: Array.from({ length: L }, (_, c) => bitAt(WALK, L - 1 - c)),
        states,
        side: `${WALK} = ${bin(WALK)}`,
      },
      ...gaps
        .filter((gp) => gp.len > 0)
        .map(
          (gp): StageRow => ({
            kind: "bracket",
            label: gp.len === answer ? "가장 긴 binary gap" : "binary gap",
            from: col(gp.hi - 1),
            to: col(gp.lo + 1),
            tone: gp.len === answer ? "left" : "right",
            text: `${gp.lo}${과와(gp.lo)} ${gp.hi} 사이 · ${gp.len} 개`,
          }),
        ),
      ...(lowest > 0
        ? [
            {
              kind: "bracket",
              label: "닫히지 않은 0",
              from: col(lowest - 1),
              to: col(0),
              tone: "right",
              text: lowest === 1 ? "자리 0" : `자리 0 ~ ${lowest - 1}`,
            } as const,
          ]
        : []),
    ];
    return (
      <CellStage
        title={`${WALK} = ${bin(WALK)} — 양쪽이 1 로 닫힌 0 구간 가운데 가장 긴 것이 ${answer}`}
        rows={rows}
        columns={L}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`1 ≤ n ≤ ${num(MAX_N)} · 호출 ${num(CALLS)} 번을 1 초에(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "concept-shift": () => {
    const t = trace(WALK);
    const L = WALK.toString(2).length;
    // 줄마다 그 반복의 x 를 오른쪽에 붙여 적는다 — 맨 오른쪽 칸이 이번에 읽는 가장 낮은 자리다.
    const shiftRow = (x: number, i: number): StageRow => {
      const s = x === 0 ? "" : x.toString(2);
      const values: (number | null)[] = Array.from({ length: L }, (_, c) => {
        const k = c - (L - s.length);
        return k < 0 ? null : Number(s[k]);
      });
      const states: Partial<Record<number, CellState>> =
        x === 0 ? {} : { [L - 1]: "read" };
      return {
        kind: "cells",
        label: `i = ${i}`,
        values,
        states,
        side: x === 0 ? "x = 0 · 멈춤" : `x = ${x} · x & 1 = ${x & 1}`,
      };
    };
    const rows: StageRow[] = [
      ...t.iters.map((it) => shiftRow(it.x, it.i)),
      shiftRow(0, t.iters.length),
    ];
    return (
      <CellStage
        title={`${WALK} 를 한 칸씩 내린다 — 맨 오른쪽 칸이 i 번째로 읽는 자리 i 의 비트`}
        rows={rows}
        columns={L}
      />
    );
  },
  "walk-scan": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.calc.expr} → ${s.calc.result}`,
      rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`binaryGap(${WALK}) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(steps[0] as Step))}
        frames={frames}
      />
    );
  },
  "invariant-open": () => {
    // 아래가 1 로 닫혔지만 위가 아직 안 닫힌 0 이 가장 길게 쌓인 자리 — 새 0 이 아직 binary gap 이
    // 아니라는 것이 드러난다.
    const steps = walkSteps();
    const open = (s: Step): number =>
      s.iter.last >= 0 ? s.iter.i - s.iter.last : 0;
    const s = steps.reduce((a, b) => (open(b) > open(a) ? b : a));
    const it = s.iter;
    const base = arrayStep(s);
    const rows = arrayStage(
      {
        ...base,
        pieces: [
          {
            label: "위가 안 닫힌 0",
            from: it.last + 1,
            to: it.i,
            tone: "right",
            text: `${open(s)} 개`,
          },
        ],
      },
      ARRAY_OPTIONS,
    );
    return (
      <CellStage
        title={`자리 ${it.i} 를 읽은 뒤 — last ${it.last}${이가(it.last)} 자리 0 ~ ${it.i} 의 가장 높은 1 이고, 위가 안 닫힌 0 은 아직 재지 않아 best = ${it.best}`}
        rows={rows}
        columns={arrayColumns(base)}
      />
    );
  },
};
