/**
 * `bestTimeToBuyAndSellStockK-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 정본 소스에서 계측 사본 둘을 기계로
 * 만든다 — 거래 상태의 시작값을 정한 줄 뒤에 기록을 끼운 `initProbe` 와, 매도 갱신 줄 뒤에 기록을 끼운
 * `stepProbe` 다. 그 기록으로 (날, 거래 번호) 하나마다의 `hold` · `free` 를 얻고, 거래 조합을 전부 세는
 * 정의(`freeDef` · `holdDef`)와 칸마다 대조한다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서
 * 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는 `bestTimeToBuyAndSellStockK-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import {
  CellStage,
  CellStageFilm,
  type StageFrame,
  type StageRow,
} from "../../../_viz/patterns/CellStage";
import {
  type GraphEdge,
  type GraphNode,
  NodeGraph,
} from "../../../_viz/patterns/NodeGraph";
import {
  type ArrayLayer,
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { bestTimeToBuyAndSellStockK } from "./bestTimeToBuyAndSellStockK-guide.ref.ts";

const REF = new URL(
  "./bestTimeToBuyAndSellStockK-guide.ref.ts",
  import.meta.url,
).pathname;

interface Impl {
  bestTimeToBuyAndSellStockK(k: number, prices: number[]): number;
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/**
 * 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). 이익이 나는 상승 구간이 셋인데 거래는 둘까지라
 * `k` 가 실제로 답을 제한하고, 한 번 거래의 최선을 둘로 쪼개야 두 번 거래의 최선이 나온다.
 */
export const WALK: readonly number[] = [2, 6, 3, 9, 5, 7];

/** 전개가 쓰는 거래 횟수 상한. */
export const WALK_K = 2;

/** 과제 규모 — 날 수 · 거래 횟수 · 가격의 상한. */
export const LIMIT_N = 1_000;
export const LIMIT_K = 100;
export const MAX_PRICE = 10_000;

export const num = (x: number): string => x.toLocaleString("en-US");

/** 도달할 수 없는 상태를 본문 · 패널과 같은 글자로 적는다. */
export const cell = (x: number): string => (Number.isFinite(x) ? num(x) : "-∞");

/** `[2 6 3]` 꼴 — 값의 나열이라 쉼표를 쓰지 않는다(인덱스 구간 `[a,b]` 와 가른다). */
export const show = (xs: readonly (number | string)[]): string =>
  `[${xs.join(" ")}]`;

/** 거래 하나 — 사는 날과 파는 날. 본문은 인덱스 구간 `[사는 날,파는 날]` 로 적는다. */
export interface Trade {
  readonly buy: number;
  readonly sell: number;
}

export const span = (t: Trade): string => `[${t.buy},${t.sell}]`;

/** 거래 상태 하나의 이름 — `free[0]` · `hold[1]` · `free[1]` … 순서가 곧 사고파는 길의 순서다. */
export interface StateName {
  readonly kind: "hold" | "free";
  readonly t: number;
  readonly name: string;
}

export function stateNames(k: number): StateName[] {
  const out: StateName[] = [{ kind: "free", t: 0, name: "free[0]" }];
  for (let t = 1; t <= k; t++) {
    out.push({ kind: "hold", t, name: `hold[${t}]` });
    out.push({ kind: "free", t, name: `free[${t}]` });
  }
  return out;
}

/* ───────────────────────── 정의 — 거래 조합을 전부 센다 ───────────────────────── */

export interface Best {
  readonly profit: number;
  readonly trades: readonly Trade[];
}

/**
 * 날 `0` 부터 날 `last` 까지 안에서 거래를 **최대 `t` 번** 했을 때의 최선. 사는 날 `b` 와 파는 날 `s` 를
 * `b < s` 로 고르고 다음 사는 날을 `s` 보다 뒤에서 고른다 — 파는 날과 다음 사는 날이 같은 두 거래는 하나로
 * 합쳐도 이익이 같으므로 이렇게 골라도 최선을 놓치지 않는다. 이익이 같으면 먼저 만난 조합을 남긴다.
 */
export function bestSet(t: number, P: readonly number[], last: number): Best {
  let best: Best = { profit: 0, trades: [] };
  const picked: Trade[] = [];
  const walk = (start: number, left: number, acc: number): void => {
    if (acc > best.profit) best = { profit: acc, trades: [...picked] };
    if (left === 0) return;
    for (let b = start; b <= last; b++) {
      for (let s = b + 1; s <= last; s++) {
        picked.push({ buy: b, sell: s });
        walk(s + 1, left - 1, acc + (P[s] as number) - (P[b] as number));
        picked.pop();
      }
    }
  };
  walk(0, t, 0);
  return best;
}

/** `free[t]` 의 정의 — 날 `0` 부터 날 `j` 까지, 거래 `t` 번까지의 최대 이익. */
export const freeDef = (t: number, P: readonly number[], j: number): number =>
  bestSet(t, P, j).profit;

export interface HoldBest {
  /** (앞 거래 `t − 1` 번까지의 이익 − 산 값) 의 최댓값. 날이 없으면 `-∞`. */
  readonly value: number;
  /** 들고 있는 주식을 산 날. */
  readonly buy: number;
  /** 그 전에 판 거래들. */
  readonly trades: readonly Trade[];
}

/**
 * `hold[t]` 의 정의 — 날 `0` 부터 날 `j` 까지 안에서 `t` 번째로 사서 아직 들고 있는 방법들 가운데 가장 큰
 * (판 이익 − 산 값). 사는 날 `b` 를 고르면 그 앞은 날 `b` 까지 거래 `t − 1` 번의 최선이다 — 같은 날 팔고 다시
 * 사는 것이 되므로 `b` 까지를 쓴다. 값이 같으면 앞선 사는 날을 남긴다.
 */
export function holdBest(t: number, P: readonly number[], j: number): HoldBest {
  let out: HoldBest = { value: Number.NEGATIVE_INFINITY, buy: -1, trades: [] };
  for (let b = 0; b <= j; b++) {
    const before = bestSet(t - 1, P, b);
    const v = before.profit - (P[b] as number);
    if (v > out.value) out = { value: v, buy: b, trades: before.trades };
  }
  return out;
}

export const holdDef = (t: number, P: readonly number[], j: number): number =>
  holdBest(t, P, j).value;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 거래 상태의 시작값을 정한 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다.
 */
const initProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)const free = new Array<number>\(k \+ 1\)\.fill\(0\);$/,
    "$1const free = new Array<number>(k + 1).fill(0);\n$1(globalThis as any).__init = { hold: [...hold], free: [...free] };",
  ],
});

/** 매도 갱신 줄 뒤에 기록을 끼운 사본 — (날, 거래 번호) 하나를 마친 상태 전체를 남긴다. */
const stepProbe = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)free\[t\] = Math\.max\(free\[t\] as number, \(hold\[t\] as number\) \+ price\);$/,
    "$1free[t] = Math.max(free[t] as number, (hold[t] as number) + price);\n$1(globalThis as any).__steps.push({ t, price, hold: [...hold], free: [...free] });",
  ],
});

/** 거래 상태 전체 — 칸 번호가 거래 번호 `t` 다. */
export interface Snap {
  readonly hold: readonly number[];
  readonly free: readonly number[];
}

/** (날 `j`, 거래 번호 `t`) 하나에서 두 줄이 한 일. */
export interface Move {
  readonly t: number;
  /** 어제의 `hold[t]` — 오늘 사지 않는 쪽. */
  readonly holdStay: number;
  /** 오늘의 `free[t − 1]` — 같은 날 앞 번호가 방금 정한 값. */
  readonly freePrev: number;
  /** `freePrev − P[j]` — 오늘 사는 쪽. */
  readonly buy: number;
  readonly hold: number;
  /** 어제의 `free[t]` — 오늘 팔지 않는 쪽. */
  readonly freeStay: number;
  /** `hold + P[j]` — 오늘 파는 쪽. */
  readonly sell: number;
  readonly free: number;
}

export interface Day {
  readonly j: number;
  readonly price: number;
  readonly before: Snap;
  readonly after: Snap;
  readonly moves: readonly Move[];
}

export interface Trace {
  readonly k: number;
  readonly P: readonly number[];
  readonly init: Snap;
  readonly days: readonly Day[];
  readonly answer: number;
}

/**
 * 정본 한 번 호출의 기록. 답은 정본과 대조하고, 날마다 거래 상태의 모든 칸을 정의(`freeDef` · `holdDef`)와
 * 대조한다. 정의는 조합을 전부 세므로 작은 입력에만 쓴다.
 */
export function trace(k: number, P: readonly number[]): Trace {
  const g = globalThis as unknown as {
    __init?: Snap;
    __steps: {
      t: number;
      price: number;
      hold: number[];
      free: number[];
    }[];
  };
  g.__init = undefined;
  g.__steps = [];
  const want = bestTimeToBuyAndSellStockK(k, [...P]);
  if (initProbe.bestTimeToBuyAndSellStockK(k, [...P]) !== want) {
    throw new Error("시작값 계측 사본이 정본과 다른 답을 냈다");
  }
  const init = g.__init as Snap | undefined;
  if (init === undefined) throw new Error("시작값 기록이 없다");
  g.__steps = [];
  if (stepProbe.bestTimeToBuyAndSellStockK(k, [...P]) !== want) {
    throw new Error("갱신 계측 사본이 정본과 다른 답을 냈다");
  }
  const steps = [...g.__steps];
  if (steps.length !== P.length * k) {
    throw new Error("갱신 기록 수가 N × k 와 다르다");
  }
  const days: Day[] = [];
  let before: Snap = init;
  for (let j = 0; j < P.length; j++) {
    const price = P[j] as number;
    const moves: Move[] = [];
    let after: Snap = before;
    for (let t = 1; t <= k; t++) {
      const s = steps[j * k + t - 1];
      if (s === undefined || s.t !== t || s.price !== price) {
        throw new Error(
          `날 ${j} · 거래 번호 ${t} 의 기록이 자리와 맞지 않는다`,
        );
      }
      const freePrev =
        t === 1
          ? (before.free[0] as number)
          : (steps[j * k + t - 2]?.free[t - 1] as number);
      const holdStay = before.hold[t] as number;
      const buy = freePrev - price;
      const hold = s.hold[t] as number;
      const freeStay = before.free[t] as number;
      const sell = hold + price;
      const free = s.free[t] as number;
      if (
        hold !== Math.max(holdStay, buy) ||
        free !== Math.max(freeStay, sell)
      ) {
        throw new Error(
          `날 ${j} · 거래 번호 ${t} 의 갱신이 두 후보의 최댓값이 아니다`,
        );
      }
      moves.push({ t, holdStay, freePrev, buy, hold, freeStay, sell, free });
      after = { hold: [...s.hold], free: [...s.free] };
    }
    for (let t = 1; t <= k; t++) {
      if (after.free[t] !== freeDef(t, P, j)) {
        throw new Error(`날 ${j} 의 free[${t}] 이 정의와 다르다`);
      }
      if (after.hold[t] !== holdDef(t, P, j)) {
        throw new Error(`날 ${j} 의 hold[${t}] 이 정의와 다르다`);
      }
    }
    days.push({ j, price, before, after, moves });
    before = after;
  }
  const answer = (before.free[k] as number) ?? 0;
  if (answer !== want)
    throw new Error("기록의 마지막 free[k] 가 정본의 답과 다르다");
  return { k, P, init, days, answer };
}

/** 상태 하나의 값 — `Snap` 에서 이름으로 꺼낸다. */
export const stateValue = (s: Snap, n: StateName): number =>
  (n.kind === "hold" ? s.hold[n.t] : s.free[n.t]) as number;

/* ───────────────────────── 계측기 — 비용 ───────────────────────── */

export interface Counted {
  readonly answer: number;
  /** 덧셈·뺄셈 횟수. */
  readonly adds: number;
  /** 비교 횟수. */
  readonly cmps: number;
  /** 만든 거래 조합의 수(조합 열거에만 있다). */
  readonly sets: number;
}

/** 모든 거래 조합을 만든다 — 조합 하나마다 비교 한 번, 거래 하나를 붙일 때마다 뺄셈 하나와 덧셈 하나. */
export function byEnumerating(k: number, P: readonly number[]): Counted {
  const n = P.length;
  let best = 0;
  let adds = 0;
  let cmps = 0;
  let sets = 0;
  const walk = (start: number, left: number, acc: number): void => {
    sets++;
    cmps++;
    best = Math.max(best, acc);
    if (left === 0) return;
    for (let b = start; b < n; b++) {
      for (let s = b + 1; s < n; s++) {
        adds += 2;
        walk(s + 1, left - 1, acc + (P[s] as number) - (P[b] as number));
      }
    }
  };
  walk(0, k, 0);
  if (best !== bestTimeToBuyAndSellStockK(k, [...P])) {
    throw new Error("조합 열거가 정본과 다른 답을 냈다");
  }
  return { answer: best, adds, cmps, sets };
}

/** 정본과 같은 절차에 계수만 덧붙인 것 — (날, 거래 번호) 하나마다 덧셈·뺄셈 둘과 비교 둘. */
export function byStates(k: number, P: readonly number[]): Counted {
  const hold = new Array<number>(k + 1).fill(Number.NEGATIVE_INFINITY);
  const free = new Array<number>(k + 1).fill(0);
  let adds = 0;
  let cmps = 0;
  for (const price of P) {
    for (let t = 1; t <= k; t++) {
      adds++;
      cmps++;
      hold[t] = Math.max(hold[t] as number, (free[t - 1] as number) - price);
      adds++;
      cmps++;
      free[t] = Math.max(free[t] as number, (hold[t] as number) + price);
    }
  }
  if (free[k] !== bestTimeToBuyAndSellStockK(k, [...P])) {
    throw new Error("계측기가 정본과 다른 답을 냈다");
  }
  return { answer: free[k] as number, adds, cmps, sets: 0 };
}

/** 거래를 최대 `k` 번 하는 조합의 수 — `Σ_{t=0..k} C(N, 2t)`. 자릿수가 커서 `BigInt` 로 센다. */
export function setCount(n: number, k: number): bigint {
  const choose = (a: bigint, r: bigint): bigint => {
    if (r < 0n || r > a) return 0n;
    let out = 1n;
    for (let i = 0n; i < r; i++) out = (out * (a - i)) / (i + 1n);
    return out;
  };
  let s = 0n;
  for (let t = 0; t <= k; t++) s += choose(BigInt(n), BigInt(2 * t));
  return s;
}

/** 거래 한 번일 때의 상태 — 지금까지의 최저가 하나만 들고 가는 후보. `k` 를 보지 않는다. */
export function lowestOnly(P: readonly number[]): number {
  let low = P[0] as number;
  let best = 0;
  for (const p of P) {
    best = Math.max(best, p - low);
    low = Math.min(low, p);
  }
  return best;
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface WalkStep {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly step: ArrayStep;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "P",
  rangeLabel: "읽은 날",
};

/** 날 `j` 까지 채운 줄 — 뒤의 칸은 `null`(아직). 도달할 수 없는 값은 `-∞` 글자로 싣는다. */
function layerValues(
  tr: Trace,
  n: StateName,
  upTo: number,
): (number | string | null)[] {
  return tr.P.map((_, d) => {
    if (d > upTo) return null;
    const v = stateValue((tr.days[d] as Day).after, n);
    return Number.isFinite(v) ? v : "-∞";
  });
}

/** 바뀐 상태를 적는 한 줄 — 「hold[2] 가 1 에서 2 로 올라갑니다(④).」 */
function changeText(
  n: StateName,
  from: number,
  to: number,
  how: string,
  first: boolean,
): string {
  const label = n.kind === "hold" ? "④" : "⑤";
  return `${n.name}${은는(n.t)} ${how}${이가(cell(to))} ${first ? "시작값" : "어제 값"} ${cell(from)} 보다 커서 ${cell(to)}${으로(cell(to))} 올라갑니다(${label}).`;
}

/** 전개의 걸음 — 시작값 한 걸음 + 날마다 한 걸음 + 반복을 마치는 한 걸음. */
export function walkSteps(
  k: number = WALK_K,
  P: readonly number[] = WALK,
): WalkStep[] {
  const tr = trace(k, P);
  const names = stateNames(k);
  const n = P.length;
  const top = `free[${k}]`;
  const steps: WalkStep[] = [];
  const initNames = names.filter((s) => s.t > 0 || s.kind === "free");
  steps.push({
    id: "T1",
    title: "시작 · ①",
    detail: `거래 상태를 시작값으로 둡니다. hold 는 칸마다 ${cell(tr.init.hold[1] ?? Number.NEGATIVE_INFINITY)}, free 는 칸마다 ${cell(tr.init.free[0] as number)} 입니다. 아직 읽은 날이 없습니다.`,
    step: {
      array: [...P],
      range: null,
      read: [],
      write: [],
      calc: {
        expr: `hold[t] = ${cell(tr.init.hold[1] ?? Number.NEGATIVE_INFINITY)} · free[t] =`,
        result: cell(tr.init.free[0] as number),
      },
      vars: null,
      layers: initNames.map(
        (s): ArrayLayer => ({
          name: s.name,
          values: P.map(() => null),
          read: [],
          write: [],
          side:
            s.t === 0
              ? `늘 ${cell(tr.init.free[0] as number)}`
              : `시작값 ${cell(stateValue(tr.init, s))}`,
        }),
      ),
    },
  });
  for (const day of tr.days) {
    const j = day.j;
    const changed = names.filter(
      (s) => s.t > 0 && stateValue(day.before, s) !== stateValue(day.after, s),
    );
    const texts = changed.map((s) => {
      const m = day.moves[s.t - 1] as Move;
      return s.kind === "hold"
        ? changeText(
            s,
            m.holdStay,
            m.hold,
            `오늘 사는 쪽 ${cell(m.freePrev)} − ${day.price} = ${cell(m.buy)}`,
            j === 0,
          )
        : changeText(
            s,
            m.freeStay,
            m.free,
            `오늘 파는 쪽 ${cell(m.hold)} + ${day.price} = ${cell(m.sell)}`,
            j === 0,
          );
    });
    const last = day.moves[k - 1] as Move;
    steps.push({
      id: `T${steps.length + 1}`,
      title: `j = ${j} · P[j] = ${day.price} · ${changed.length === 0 ? "바뀐 상태 없음" : `${changed.map((s) => s.name).join(" · ")} 바뀜`}`,
      detail:
        changed.length === 0
          ? `오늘 사는 쪽도 파는 쪽도 어제 값보다 크지 않아 거래 상태가 하나도 안 바뀝니다. ${top}${은는(k)} ${cell(last.free)} 그대로입니다.`
          : `${texts.join(" ")} 나머지 상태는 어제 값 그대로입니다.`,
      step: {
        array: [...P],
        range: [0, j],
        read: [j],
        write: [],
        pointers: { j },
        calc: {
          expr: `${top} = max(${cell(last.freeStay)}, ${cell(last.hold)} + ${day.price}) =`,
          result: cell(last.free),
        },
        vars: null,
        layers: initNames.map((s): ArrayLayer => {
          const was =
            j === 0 ? stateValue(tr.init, s) : stateValue(day.before, s);
          const now = stateValue(day.after, s);
          return {
            name: s.name,
            values: layerValues(tr, s, j),
            read: s.t === 0 ? [j] : j > 0 ? [j - 1] : [],
            write: s.t === 0 ? [] : [j],
            side:
              s.t === 0
                ? `늘 ${cell(now)}`
                : was === now
                  ? `${cell(now)} 그대로`
                  : `${cell(was)} → ${cell(now)}`,
          };
        }),
      },
    });
  }
  const answer = tr.answer;
  steps.push({
    id: `T${steps.length + 1}`,
    title: `j = ${n} · 반복 끝`,
    detail: `j = ${n}${josa(n, "이라", "라")} 읽을 날이 남지 않아 ② 가 거짓입니다. 마지막 칸 ${top} = ${cell(answer)}${을를(cell(answer))} 돌려줍니다.`,
    step: {
      array: [...P],
      range: [0, n - 1],
      read: [],
      write: [],
      pointers: { j: n },
      calc: { expr: `${top} =`, result: cell(answer) },
      vars: null,
      layers: initNames.map(
        (s): ArrayLayer => ({
          name: s.name,
          values: layerValues(tr, s, n - 1),
          read: s.name === top ? [n - 1] : [],
          write: [],
          side: s.name === top ? `답 ${cell(answer)}` : undefined,
        }),
      ),
    },
  });
  return steps;
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자 그대로
 * 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `bestTimeToBuyAndSellStockK-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    tradeScan: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.step,
    })),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 사다리 ───────────────── */

/** 단순 연산 1 초에 1 억 번 기준. */
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toLocaleString("en-US", { maximumSignificantDigits: 3 })} 초`;

function approaches(): Approach[] {
  const all = byEnumerating(WALK_K, WALK);
  const states = byStates(WALK_K, WALK);
  const digits = setCount(LIMIT_N, LIMIT_K).toString().length;
  const bigStates = 4 * LIMIT_N * LIMIT_K;
  const low = lowestOnly(WALK);
  const right = bestTimeToBuyAndSellStockK(WALK_K, [...WALK]);
  return [
    {
      name: "모든 거래 조합 만들기",
      idea: "겹치지 않는 사고파는 짝의 목록을 모두 만들어 이익을 더하고, 그중 최댓값을 고른다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `맞다 · 여섯 날 입력에서 기본 연산 ${num(all.adds + all.cmps)} 번`,
          ok: true,
        },
        {
          label: "시간",
          value: `N = ${num(LIMIT_N)} · k = ${num(LIMIT_K)} 이면 조합이 ${num(digits)} 자리 수`,
          ok: false,
        },
      ],
      lesson:
        "첫 거래가 같은 조합들이 그 이익을 매번 다시 센다 — 앞쪽은 이익 하나로 줄일 수 있지 않을까",
    },
    {
      name: "최저가 하나 이어받기",
      idea: "거래 한 번일 때처럼 지금까지의 최저가 하나를 들고, 오늘 파는 이익의 최댓값을 낸다",
      verdict: "drop",
      checks: [
        { label: "시간", value: "날마다 기본 연산 셋", ok: true },
        {
          label: "답",
          value: `k = ${WALK_K} · ${show(WALK)} 에서 ${low} · 정답은 ${right}`,
          ok: false,
        },
      ],
      lesson:
        "몇 번째 거래인지를 담지 못해 두 번째 거래를 시작할 자리가 없다 — 거래 번호를 상태에 넣으면 어떨까",
    },
    {
      name: "거래 상태 이어받기",
      idea: "거래 번호 t 와 보유 여부로 가른 상태 2k + 1 개를 들고, 날마다 그 값을 한 번씩 갱신한다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `맞다 · 여섯 날 입력에서 기본 연산 ${num(states.adds + states.cmps)} 번`,
          ok: true,
        },
        {
          label: "시간",
          value: `N = ${num(LIMIT_N)} · k = ${num(LIMIT_K)} 이면 기본 연산 ${num(bigStates)} 번 · ${secondsOf(bigStates)}`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 날 3 — 「이웃한 상태끼리의 관계」 그림이 보는 날. 두 상태가 파는 쪽으로 커지고 둘은 그대로다. */
export const RELATION_DAY = 3;

/** 「입력 위에 놓은 그림」과 「하나를 읽는 법」이 보는 날. */
export const WITNESS_DAY = WALK.length - 1;

export const FIGS: Record<string, () => ReactElement> = {
  "concept-trades": () => {
    const last = WALK.length - 1;
    const one = bestSet(1, WALK, last);
    const two = bestSet(WALK_K, WALK, last);
    const rows: StageRow[] = [
      { kind: "index", label: "날" },
      { kind: "cells", label: "P", values: [...WALK] },
    ];
    for (const [i, t] of one.trades.entries()) {
      rows.push({
        kind: "bracket",
        label: i === 0 ? "k = 1" : undefined,
        from: t.buy,
        to: t.sell,
        tone: "query",
        text: `이익 ${(WALK[t.sell] as number) - (WALK[t.buy] as number)}`,
        side: i === one.trades.length - 1 ? `합 ${one.profit}` : undefined,
      });
    }
    for (const [i, t] of two.trades.entries()) {
      rows.push({
        kind: "bracket",
        label: i === 0 ? `k = ${WALK_K}` : undefined,
        from: t.buy,
        to: t.sell,
        tone: i % 2 === 0 ? "left" : "right",
        text: `이익 ${(WALK[t.sell] as number) - (WALK[t.buy] as number)}`,
        side: i === two.trades.length - 1 ? `합 ${two.profit}` : undefined,
      });
    }
    return (
      <CellStage
        title={`P = [${WALK.join(", ")}] 에서 거래 한 번과 두 번까지의 최선`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "concept-grid": () => {
    const tr = trace(WALK_K, WALK);
    const last = WALK.length - 1;
    const rows: StageRow[] = [
      { kind: "index", label: "날" },
      { kind: "cells", label: "P", values: [...WALK] },
    ];
    for (const s of stateNames(WALK_K)) {
      rows.push({
        kind: "cells",
        label: s.name,
        values: tr.days.map((d) => cell(stateValue(d.after, s))),
        states:
          s.kind === "free" && s.t === WALK_K ? { [last]: "focus" } : undefined,
        side:
          s.t === 0
            ? `늘 ${cell(stateValue(tr.init, s))}`
            : `시작값 ${cell(stateValue(tr.init, s))}`,
      });
    }
    return (
      <CellStage
        title={`k = ${WALK_K} · P = [${WALK.join(", ")}] 에서 날 j 를 읽은 뒤의 거래 상태`}
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
        constraint={`N 최대 ${num(LIMIT_N)} · k 최대 ${num(LIMIT_K)} · 1 초(단순 연산 1 초에 1 억 번 기준) · 앞 거래를 팔아야 다음 거래를 산다`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-witness": () => {
    const j = WITNESS_DAY;
    const rows: StageRow[] = [
      { kind: "index", label: "날" },
      { kind: "cells", label: "P", values: [...WALK] },
    ];
    for (const s of stateNames(WALK_K)) {
      if (s.t === 0) continue;
      if (s.kind === "free") {
        const b = bestSet(s.t, WALK, j);
        for (const [i, t] of b.trades.entries()) {
          rows.push({
            kind: "bracket",
            label: i === 0 ? s.name : undefined,
            from: t.buy,
            to: t.sell,
            tone: "left",
            text: `판 거래 · 이익 ${(WALK[t.sell] as number) - (WALK[t.buy] as number)}`,
            side: i === b.trades.length - 1 ? `= ${cell(b.profit)}` : undefined,
          });
        }
      } else {
        const h = holdBest(s.t, WALK, j);
        for (const [i, t] of h.trades.entries()) {
          rows.push({
            kind: "bracket",
            label: i === 0 ? s.name : undefined,
            from: t.buy,
            to: t.sell,
            tone: "left",
            text: `판 거래 · 이익 ${(WALK[t.sell] as number) - (WALK[t.buy] as number)}`,
          });
        }
        rows.push({
          kind: "bracket",
          label: h.trades.length === 0 ? s.name : undefined,
          from: h.buy,
          to: j,
          tone: "right",
          text: `날 ${h.buy} 에 사서 들고 있다 · −${WALK[h.buy]}`,
          side: `= ${cell(h.value)}`,
        });
      }
    }
    return (
      <CellStage
        title={`날 ${j} 까지 읽은 뒤 거래 상태마다 그 값을 만든 거래`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "build-relation": () => {
    const tr = trace(WALK_K, WALK);
    const day = tr.days[RELATION_DAY] as Day;
    const names = stateNames(WALK_K);
    const nodes: GraphNode[] = names.map((s, x) => {
      const was = stateValue(day.before, s);
      const now = stateValue(day.after, s);
      return {
        id: s.name,
        x,
        y: 0,
        value:
          was === now ? `${cell(now)} 그대로` : `${cell(was)} → ${cell(now)}`,
        state: was === now ? undefined : "focus",
      };
    });
    const edges: GraphEdge[] = [];
    for (const s of names) {
      if (s.t === 0) continue;
      const m = day.moves[s.t - 1] as Move;
      const moved =
        s.kind === "hold" ? m.hold !== m.holdStay : m.free !== m.freeStay;
      const from = s.kind === "hold" ? `free[${s.t - 1}]` : `hold[${s.t}]`;
      edges.push({
        from,
        to: s.name,
        label: s.kind === "hold" ? `− ${day.price}` : `+ ${day.price}`,
        state: moved ? "focus" : "out",
      });
      edges.push({
        from: s.name,
        to: s.name,
        label: "어제 값",
        state: moved ? "out" : "focus",
      });
    }
    return (
      <NodeGraph
        title={`날 ${RELATION_DAY} (P[j] = ${day.price}) — 상태마다 어제 값과 앞 상태에서 오는 값 중 큰 쪽`}
        nodes={nodes}
        edges={edges}
        unit={{ x: 132, y: 84 }}
      />
    );
  },
  "walk-scan": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.step.calc?.expr} ${s.step.calc?.result}`,
      rows: arrayStage(s.step, ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`bestTimeToBuyAndSellStockK(${WALK_K}, [${WALK.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns((steps[0] as WalkStep).step)}
        frames={frames}
      />
    );
  },
};
