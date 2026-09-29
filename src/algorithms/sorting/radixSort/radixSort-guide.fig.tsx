/**
 * `radixSort-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 정본의 걸음은 정본 소스에서 기계로
 * 만든 계측 사본(`logged`)이 기록한다 — `dst` 에 값을 하나 놓을 때마다 그 순간의 자리 크기 · 읽은
 * 자리 · 값 · 놓은 칸을 남긴다. 걸음 전체(최댓값 · 세기 · 누적합 · 놓기 · 맞바꾸기 · 반환)는 같은
 * 절차를 다시 쓴 `trace` 가 만들고, 그 놓기가 계측 기록과 **하나하나** 같은지 대조한다. 걸음 재생
 * 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `radixSort-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 을를, 이가 } from "../../../../tools/josa.ts";
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
import { keyValueRows } from "../../../_viz/patterns/KeyValueTable";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { radixSort } from "./radixSort-guide.ref.ts";

const REF = new URL("./radixSort-guide.ref.ts", import.meta.url).pathname;

/** 자리 하나가 담는 값의 가짓수. 정본의 `BASE` 와 같아야 한다 — 아래에서 정본 실행과 대조한다. */
export const BASE = 256;

/** `dst` 에 값을 놓는 그 한 줄. 계측은 이 줄에만 맞아야 한다. */
export const WRITE_LINE = /^(\s*)dst\[count\[dig\] as number\] = x;$/;
/** 뒤에서 앞으로 놓는 반복의 머리줄 — 같은 자리 값의 앞뒤를 지키던 줄이다. */
export const PLACE_LINE =
  /^(\s*)for \(let i = src\.length - 1; i >= 0; i--\) \{$/;

export type Sorter = { radixSort(A: number[]): number[] };

/* ───────────────────────── 정본 계측 ───────────────────────── */

interface PutRecord {
  readonly place: number;
  readonly i: number;
  readonly x: number;
  readonly dig: number;
  readonly pos: number;
}

type Log = { __rxPut: PutRecord[] };

const logged = await loadMutant<Sorter>(REF, {
  swap: [
    WRITE_LINE,
    "$1(globalThis as unknown as { __rxPut: { place: number; i: number; x: number; dig: number; pos: number }[] }).__rxPut.push({ place, i, x, dig, pos: count[dig] as number }); dst[count[dig] as number] = x;",
  ],
});

export const same = (x: readonly number[], y: readonly number[]): boolean =>
  x.length === y.length && x.every((v, k) => v === y[k]);

/* ───────────────── 같은 절차 — 걸음을 기록하며 ───────────────── */

/** 놓기 한 번. */
export interface Put {
  readonly i: number;
  readonly x: number;
  readonly dig: number;
  /** 줄이기 전의 `count[dig]`. */
  readonly before: number;
  /** 놓은 칸 — 줄인 뒤의 `count[dig]`. */
  readonly pos: number;
  /** 놓은 뒤의 `dst`. 아직 안 놓은 칸은 `null`. */
  readonly dst: readonly (number | null)[];
}

/** 바퀴 하나. */
export interface Round {
  /** 몇 번째 바퀴인가(1 부터). */
  readonly n: number;
  /** 지금 보는 자리의 크기 `place`. */
  readonly place: number;
  /** 자리 번호 — 0 이 가장 낮은 자리. */
  readonly p: number;
  /** 바퀴를 시작할 때의 `src`. */
  readonly src: readonly number[];
  /** `src` 칸마다의 자리 값. */
  readonly digits: readonly number[];
  /** 이 바퀴에 나온 자리 값(오름차순)과 그 개수. */
  readonly count: readonly (readonly [number, number])[];
  /** 누적합으로 덮은 뒤의 `count[d]`(나온 자리 값만). */
  readonly prefix: readonly (readonly [number, number])[];
  /** 놓기 — 뒤에서 앞으로 읽은 순서. */
  readonly puts: readonly Put[];
  /** 바퀴를 마친 `dst` — 다음 바퀴의 `src`. */
  readonly out: readonly number[];
}

export interface Trace {
  readonly input: readonly number[];
  readonly max: number;
  readonly rounds: readonly Round[];
  /** 반복이 끝날 때 거짓이 된 자리 크기 — 바퀴가 없으면 1. */
  readonly stopPlace: number;
  readonly out: number[];
}

export const digitOf = (x: number, place: number, base = BASE): number =>
  Math.floor(x / place) % base;

/**
 * 정본과 같은 절차를 바퀴마다 기록하며 실행한다. `base` 를 주면 자리 하나의 가짓수만 바꾼
 * 절차이고(정본은 256 으로 고정), `forward` 면 놓기를 앞에서 뒤로 읽은 절차다 — 둘 다 본문의 비교에만
 * 쓴다. 기본값 그대로의 기록은 `run` 이 정본 계측과 대조한다.
 */
export function trace(
  A: readonly number[],
  opts: { base?: number; forward?: boolean } = {},
): Trace {
  const base = opts.base ?? BASE;
  let src = [...A];
  let max = 0;
  for (const x of src) if (x > max) max = x;
  const rounds: Round[] = [];
  let place = 1;
  for (let p = 0; Math.floor(max / place) > 0; p++, place *= base) {
    const digits = src.map((x) => digitOf(x, place, base));
    const count = new Array<number>(base).fill(0);
    for (const d of digits) count[d] = (count[d] as number) + 1;
    const seen = [...new Set(digits)].sort((a, b) => a - b);
    const counted = seen.map((d) => [d, count[d] as number] as const);
    for (let d = 1; d < base; d++) {
      count[d] = (count[d] as number) + (count[d - 1] as number);
    }
    const prefix = seen.map((d) => [d, count[d] as number] as const);
    const dst: (number | null)[] = new Array<number | null>(src.length).fill(
      null,
    );
    const puts: Put[] = [];
    const order = src.map((_, k) => k);
    if (!opts.forward) order.reverse();
    for (const i of order) {
      const x = src[i] as number;
      const dig = digits[i] as number;
      const before = count[dig] as number;
      count[dig] = before - 1;
      dst[before - 1] = x;
      puts.push({ i, x, dig, before, pos: before - 1, dst: [...dst] });
    }
    const out = dst.map((v) => v as number);
    rounds.push({
      n: p + 1,
      place,
      p,
      src: [...src],
      digits,
      count: counted,
      prefix,
      puts,
      out,
    });
    src = out;
  }
  return { input: [...A], max, rounds, stopPlace: place, out: src };
}

/** 정본과 같은 절차의 기록 — 계측 기록과 놓기 하나하나를 대조한다. */
export function run(A: readonly number[]): Trace {
  const t = trace(A);
  const g = globalThis as unknown as Log;
  g.__rxPut = [];
  const byLog = logged.radixSort([...A]);
  const log = g.__rxPut;
  const ref = radixSort([...A]);
  if (!same(byLog, ref) || !same(t.out, ref)) {
    throw new Error("계측 사본이나 다시 쓴 절차가 정본과 다른 답을 냈다");
  }
  const puts = t.rounds.flatMap((r) => r.puts.map((u) => ({ r, u })));
  if (puts.length !== log.length) {
    throw new Error("놓기 횟수가 정본 기록과 다르다");
  }
  puts.forEach(({ r, u }, k) => {
    const e = log[k] as PutRecord;
    if (
      e.place !== r.place ||
      e.i !== u.i ||
      e.x !== u.x ||
      e.dig !== u.dig ||
      e.pos !== u.pos
    ) {
      throw new Error(`${k + 1} 번째 놓기가 정본 기록과 다르다`);
    }
  });
  return t;
}

/** 같은 다중집합의 서로 다른 배치 전부. */
export function arrangements(multiset: readonly number[]): number[][] {
  const out: number[][] = [];
  const rest = [...multiset].sort((a, b) => a - b);
  const acc: number[] = [];
  const used = new Array<boolean>(rest.length).fill(false);
  const build = (): void => {
    if (acc.length === rest.length) {
      out.push([...acc]);
      return;
    }
    let last: number | null = null;
    for (let t = 0; t < rest.length; t++) {
      if (used[t] === true) continue;
      const v = rest[t] as number;
      if (last === v) continue;
      last = v;
      used[t] = true;
      acc.push(v);
      build();
      acc.pop();
      used[t] = false;
    }
  };
  build();
  return out;
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK = [513, 45, 258, 2, 66, 90, 301];

/** 저장소 시험이 쓰는 입출력 케이스 중 난수가 없는 것. */
export const REPO_CASES: number[][] = [
  [170, 45, 75, 90, 802, 24, 2, 66],
  [1, 10, 100, 1000],
  [5, 4, 3, 2, 1],
  [12, 12, 1, 1, 100, 100],
  [0, 10, 0, 1],
  [321, 213, 132, 123],
  [12345],
  [1_000_000_000, 0, 999_999_999, 1],
  [],
  [0, 0, 0],
  [7, 7, 7],
];

// 다시 쓴 절차가 정본과 놓기 하나하나까지 같은가 — 저장소 케이스와, 전개 입력의 배치 전부(5,040
// 가지)에서 확인한다. 어긋나면 아래 모든 표와 그림이 다른 절차를 잰 것이다.
for (const A of [WALK, ...REPO_CASES]) run(A);
for (const A of arrangements(WALK)) run(A);

export const num = (x: number): string => x.toLocaleString("en-US");
export const show = (xs: readonly (number | null)[]): string =>
  `[${xs.map((v) => (v === null ? "_" : String(v))).join(" ")}]`;
export const list = (xs: readonly number[]): string => xs.join(" ");

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly stage: ArrayStep;
}

/** 전체 실행 무대의 이름표. */
export const RUN_OPTIONS: ArrayOptions = {
  arrayName: "src",
  rangeLabel: "읽는 쪽",
};

/** `count` 줄의 자리 수 — 한 바퀴에 나온 자리 값 가짓수 중 가장 큰 것. */
const slotsOf = (t: Trace): number =>
  Math.max(0, ...t.rounds.map((r) => r.count.length));

const MAP_KEY = "자리 값";
const MAP_VALUE = "count";

/** 나온 자리 값 말고 `count` 의 나머지 칸 — 전부 0 이다. */
const restNote = (r: Round): string => `나머지 ${BASE - r.count.length} 칸은 0`;

/** 걸음마다 — 최댓값 · (바퀴마다) 세기 · 누적합 · 놓기 · 맞바꾸기 · 반환. */
export function traceSteps(t: Trace): Step[] {
  const n = t.input.length;
  const all = [...Array(n).keys()];
  const blank = new Array<null>(n).fill(null);
  const slots = slotsOf(t);
  const d = t.rounds.length;
  const steps: Omit<Step, "id">[] = [];
  steps.push({
    title: `최댓값 ${t.max} — 바퀴 ${d} 번`,
    detail: `src 의 ${n} 칸을 한 번씩 읽어 최댓값 ${t.max}${을를(t.max)} 찾습니다. ${t.max}${이가(t.max)} 256 진법으로 ${d} 자리라 바퀴가 ${d} 번입니다.`,
    stage: {
      array: [...t.input],
      range: n === 0 ? null : [0, n - 1],
      rangeSide: `바퀴 수 ${d}`,
      read: all,
      write: [],
      layers: [
        { name: "자리 값", values: blank },
        { name: "dst", values: blank },
      ],
      map: {
        keyLabel: MAP_KEY,
        valueLabel: MAP_VALUE,
        entries: [],
        slots,
        note: "아직 없음",
      },
      calc: { expr: "max", result: String(t.max) },
      vars: null,
    },
  });
  for (const r of t.rounds) {
    const head = `바퀴 ${r.n}`;
    const side = `${head} · place = ${num(r.place)}`;
    const digitRow = { name: `자리 ${r.p}`, values: [...r.digits] };
    steps.push({
      title: `${head} — 자리 ${r.p} 의 값을 센다`,
      detail: `⌊${t.max} / ${num(r.place)}⌋ > 0 이 참이라 바퀴를 시작합니다. 자리 값은 ⌊x / ${num(r.place)}⌋ mod 256 이고, 값 ${n} 개의 자리 ${r.p}${이가(r.p)} ${list(r.digits)} 입니다. 자리 값마다 개수를 count 에 적습니다.`,
      stage: {
        array: [...r.src],
        range: [0, n - 1],
        rangeSide: side,
        read: all,
        write: [],
        layers: [
          { ...digitRow, write: all },
          { name: "dst", values: blank },
        ],
        map: {
          keyLabel: MAP_KEY,
          valueLabel: MAP_VALUE,
          entries: r.count.map(([k, v]) => [k, v] as const),
          slots,
          write: r.count.map(([k]) => k),
          note: restNote(r),
        },
        calc: { expr: `개수`, result: list(r.count.map(([, v]) => v)) },
        vars: null,
      },
    });
    steps.push({
      title: `${head} — 누적합으로 통의 끝을 정한다`,
      detail: `count 를 왼쪽부터 누적합으로 덮습니다. count[d] 가 자리 값이 d 이하인 원소의 개수가 되고, 자리 값 d 의 통은 dst 의 칸 count[d] − 1 에서 끝납니다.`,
      stage: {
        array: [...r.src],
        range: [0, n - 1],
        rangeSide: side,
        read: [],
        write: [],
        layers: [digitRow, { name: "dst", values: blank }],
        map: {
          keyLabel: MAP_KEY,
          valueLabel: MAP_VALUE,
          entries: r.prefix.map(([k, v]) => [k, v] as const),
          slots,
          write: r.prefix
            .filter(([k, v]) => r.count.find(([c]) => c === k)?.[1] !== v)
            .map(([k]) => k),
          note: restNote(r),
        },
        calc: { expr: "누적합", result: list(r.prefix.map(([, v]) => v)) },
        vars: null,
      },
    });
    const cur = new Map(r.prefix.map(([k, v]) => [k, v]));
    for (const u of r.puts) {
      cur.set(u.dig, u.pos);
      steps.push({
        title: `${head} — i=${u.i} 값 ${u.x}${을를(u.x)} 칸 ${u.pos} 에`,
        detail: `src[${u.i}] = ${u.x} 의 자리 ${r.p}${이가(r.p)} ${u.dig} 입니다. count[${u.dig}]${을를(u.dig)} ${u.before} 에서 ${u.pos}${으로(u.pos)} 줄이고 dst 의 칸 ${u.pos} 에 ${u.x}${을를(u.x)} 놓습니다.`,
        stage: {
          array: [...r.src],
          range: [0, n - 1],
          rangeSide: side,
          read: [u.i],
          write: [],
          pointers: { i: u.i },
          layers: [
            { ...digitRow, read: [u.i] },
            { name: "dst", values: [...u.dst], write: [u.pos] },
          ],
          map: {
            keyLabel: MAP_KEY,
            valueLabel: MAP_VALUE,
            entries: [...cur.entries()].map(([k, v]) => [k, v] as const),
            slots,
            read: [u.dig],
            write: [u.dig],
            note: restNote(r),
          },
          calc: { expr: `count[${u.dig}] − 1`, result: String(u.pos) },
          vars: null,
        },
      });
    }
    const next = t.rounds[r.n] as Round | undefined;
    steps.push({
      title: `${head} 끝 — src 와 dst 를 맞바꾼다`,
      detail: `dst 가 ${show(r.out)}${으로(r.out.at(-1) ?? 0)} 찼고, 자리 ${r.p} 기준 오름차순입니다. 두 배열의 역할을 맞바꿔 ${next === undefined ? "방금 쓴 배열이 반환할 쪽이 됩니다" : "다음 바퀴가 이 배열을 읽습니다"}. place 는 ${num(r.place * BASE)}${이가(num(r.place * BASE))} 됩니다.`,
      stage: {
        array: [...r.out],
        range: [0, n - 1],
        rangeSide: `${head} 끝`,
        read: [],
        write: all,
        layers: [
          {
            name: `자리 ${r.p}`,
            values: r.out.map((x) => digitOf(x, r.place)),
          },
          { name: "dst", values: blank },
        ],
        map: {
          keyLabel: MAP_KEY,
          valueLabel: MAP_VALUE,
          entries: [...cur.entries()].map(([k, v]) => [k, v] as const),
          slots,
          note: restNote(r),
        },
        calc: { expr: "[src, dst] = [dst, src]", result: "맞바꿈" },
        vars: null,
      },
    });
  }
  steps.push({
    title: "반환 — 바퀴가 끝났다",
    detail: `place = ${num(t.stopPlace)} 에서 ⌊${t.max} / ${num(t.stopPlace)}⌋ = 0 이라 반복이 끝납니다. src 가 ${show(t.out)} 이고, 입력 A 는 ${show(t.input)} 그대로입니다.`,
    stage: {
      array: [...t.out],
      range: n === 0 ? null : [0, n - 1],
      rangeSide: "반환",
      read: [],
      write: [],
      layers: [
        { name: "자리 값", values: blank },
        { name: "dst", values: blank },
      ],
      map: {
        keyLabel: MAP_KEY,
        valueLabel: MAP_VALUE,
        entries: [],
        slots,
        note: "없음",
      },
      calc: {
        expr: `⌊${t.max} / ${num(t.stopPlace)}⌋ > 0`,
        result: "거짓",
      },
      vars: null,
    },
  });
  return steps.map((s, k) => ({ id: `T${k + 1}`, ...s }));
}

/** 전개 입력의 걸음 전부(T1 부터). */
export const walkSteps = (): Step[] => traceSteps(run(WALK));

const film = (steps: readonly Step[], opts: ArrayOptions): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(s.stage, opts),
  }));

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `radixSort-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    walk7: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...s.stage,
    })),
  };
}

/* ───────────────── 시도한 방법 — 수는 증명 사이드카가 쓰는 식과 같은 곳에서 ───────────────── */

/** 과제 규모 — 칸 수 `N` 과 값의 상한. */
export const BIG = 100_000;
export const MAX_VALUE = 1_000_000_000;
/** 난수 없는 생성식. `A[i] = (i × 999,983) mod (10^9 + 1)`. `.alt.ts` 와 같은 식이다. */
export const spread = (n: number): number[] =>
  Array.from({ length: n }, (_, t) => (t * 999_983) % (MAX_VALUE + 1));

/** 모든 쌍 비교의 횟수 `N(N−1)/2`. 작은 `N` 에서 실행과 같음은 증명 사이드카가 확인한다. */
export const pairs = (n: number): number => (n * (n - 1)) / 2;
/** 배열 접근의 닫힌 형태 `4N + d(7N + 4B − 3)`. 실행과 같음은 증명 사이드카가 확인한다. */
export const accessOf = (n: number, base: number, d: number): number =>
  4 * n + d * (7 * n + 4 * base - 3);
/** 최댓값을 `base` 진법으로 적은 자릿수 — 바퀴 수. */
export function passCount(max: number, base: number = BASE): number {
  let d = 0;
  for (let place = 1; Math.floor(max / place) > 0; place *= base) d++;
  return d;
}
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toFixed(0)} 초`;

function approaches(msdWrong: number, msdTotal: number): Approach[] {
  const naive = pairs(BIG);
  const wideCells = MAX_VALUE + 1;
  const mine = accessOf(BIG, BASE, passCount(MAX_VALUE));
  return [
    {
      name: "모든 쌍 비교하기",
      idea: "두 자리를 모두 짝지어, 앞이 더 크면 맞바꾼다",
      verdict: "drop",
      checks: [
        {
          label: "비교",
          value: `${num(naive)} 번 · ${secondsOf(naive)}`,
          ok: false,
        },
      ],
      lesson: "비교 없이 값으로 바로 자리를 찾으면 어떨까",
    },
    {
      name: "값을 칸 번호로 쓰는 계수 정렬",
      idea: "값 v 를 count 의 칸 v 에 세고, 칸을 차례로 읽는다",
      verdict: "drop",
      checks: [
        { label: "비교", value: "0 번", ok: true },
        {
          label: "메모리",
          value: `칸 ${num(wideCells)} 개 · 8 바이트씩 ${((wideCells * 8) / 1e9).toFixed(1)} GB`,
          ok: false,
        },
      ],
      lesson: "키가 너무 넓다 — 값을 자리로 쪼개 키를 좁히면 어떨까",
    },
    {
      name: "자리마다 계수 정렬, 높은 자리부터",
      idea: "256 진법 자리마다 한 바퀴씩, 가장 높은 자리부터 정렬한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `시험한 ${msdTotal} 벌 중 ${msdWrong} 벌이 틀린다`,
          ok: false,
        },
      ],
      lesson: "마지막 바퀴의 자리가 순서를 정한다 — 낮은 자리부터 하면 어떨까",
    },
    {
      name: "자리마다 안정 계수 정렬, 낮은 자리부터",
      idea: "자리 값이 같으면 앞 바퀴의 앞뒤를 그대로 두고, 낮은 자리부터 정렬한다",
      verdict: "keep",
      checks: [
        { label: "답", value: `시험한 ${msdTotal} 벌 모두 맞는다`, ok: true },
        {
          label: "접근",
          value: `배열 접근 ${num(mine)} 번 · 비교 0 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 값 줄 · 자리 1 줄 · 자리 0 줄. `mark` 에 든 자리 줄은 곁말로 「오름차순」을 단다. */
function digitRows(
  values: readonly number[],
  mark: number | null,
  name: string,
): StageRow[] {
  const cols = [1, 0];
  return [
    { kind: "index", label: "인덱스" },
    { kind: "cells", label: name, values: [...values] },
    ...cols.map(
      (p): StageRow => ({
        kind: "cells",
        label: `자리 ${p}`,
        values: values.map((x) => digitOf(x, BASE ** p)),
        side: mark === p ? "오름차순" : undefined,
      }),
    ),
  ];
}

/** 높은 자리부터 되풀이한 후보. 마지막 바퀴가 자리 0 이다. */
export function msdRepeat(A: readonly number[], base = BASE): number[] {
  const t = trace(A, { base });
  const places = t.rounds.map((r) => r.place).reverse();
  let src = [...A];
  for (const place of places) {
    const count = new Array<number>(base).fill(0);
    for (const x of src) {
      const dg = digitOf(x, place, base);
      count[dg] = (count[dg] as number) + 1;
    }
    for (let dg = 1; dg < base; dg++) {
      count[dg] = (count[dg] as number) + (count[dg - 1] as number);
    }
    const dst = new Array<number>(src.length).fill(0);
    for (let i = src.length - 1; i >= 0; i--) {
      const x = src[i] as number;
      const dg = digitOf(x, place, base);
      count[dg] = (count[dg] as number) - 1;
      dst[count[dg] as number] = x;
    }
    src = dst;
  }
  return src;
}

export const MSD_CASES: number[][] = [
  WALK,
  [170, 45, 75, 90, 802, 24, 2, 66],
  [321, 213, 132, 123],
  [12, 12, 1, 1, 100, 100],
  [0, 10, 0, 1],
];

/** 높은 자리부터 되풀이한 후보가 틀린 입력 수. 증명 사이드카가 같은 입력을 표로 낸다. */
export function msdWrongCount(): { msdWrong: number; msdTotal: number } {
  const wrong = MSD_CASES.filter(
    (A) => !same(msdRepeat(A), radixSort([...A])),
  ).length;
  for (const A of MSD_CASES) {
    const want = [...A].sort((x, y) => x - y);
    if (!same(radixSort([...A]), want)) {
      throw new Error("낮은 자리부터 한 정본이 시험 입력에서 틀렸다");
    }
  }
  return { msdWrong: wrong, msdTotal: MSD_CASES.length };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-digits": () => (
    <CellStage
      title={`${show(WALK)} 의 값마다 256 진법 자리 둘`}
      rows={digitRows(WALK, null, "A")}
      columns={WALK.length}
    />
  ),
  "concept-passes": () => {
    const t = run(WALK);
    const frames: StageFrame[] = [
      { id: "처음", text: "입력 그대로", rows: digitRows(WALK, null, "src") },
      ...t.rounds.map((r) => ({
        id: `바퀴 ${r.n}`,
        text: `자리 ${r.p} 로 안정 정렬한 뒤`,
        rows: digitRows(r.out, r.p, "src"),
      })),
    ];
    return (
      <CellStageFilm
        title={`${show(WALK)} — 자리 0 바퀴 다음 자리 1 바퀴`}
        columns={WALK.length}
        frames={frames}
      />
    );
  },
  "origin-approaches": () => {
    const v = msdWrongCount();
    const steps = approaches(v.msdWrong, v.msdTotal);
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`칸 ${num(BIG)} 개 · 값 0 이상 10^9 이하 · 1 초 · 256 MB(흔한 채점 환경의 예산)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-buckets": () => {
    const t = run(WALK);
    const r = t.rounds[0] as Round;
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      { kind: "cells", label: "dst", values: [...r.out] },
      {
        kind: "cells",
        label: `자리 ${r.p}`,
        values: r.out.map((x) => digitOf(x, r.place)),
      },
      ...r.prefix.map(([d, end], k): StageRow => {
        const start = k === 0 ? 0 : (r.prefix[k - 1] as [number, number])[1];
        return {
          kind: "bracket",
          label: `통 ${d}`,
          from: start,
          to: end - 1,
          tone: k % 2 === 0 ? "left" : "right",
          text: `[${start},${end - 1}]`,
        };
      }),
      ...keyValueRows({
        keyLabel: MAP_KEY,
        valueLabel: "누적 count",
        entries: r.prefix.map(([k, v]) => [k, v] as const),
        note: restNote(r),
      }),
    ];
    return (
      <CellStage
        title={`바퀴 1 — 자리 0 의 값마다 통 하나, 끝은 누적 count − 1`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "walk-radix": () => {
    const steps = walkSteps();
    return (
      <CellStageFilm
        title={`radixSort([${WALK.join(", ")}]) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={WALK.length}
        frames={film(steps, RUN_OPTIONS)}
      />
    );
  },
};
