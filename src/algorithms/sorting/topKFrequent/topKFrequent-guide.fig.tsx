/**
 * `topKFrequent-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 걸음(① 세기 · 빈도 버킷 만들기 ·
 * ② 담기 · ③④⑤ 큰 버킷부터 모으기)은 정본과 같은 절차를 걸음마다 기록하며 다시 실행한 `trace` 가
 * 만들고, 그 기록을 두 곳에서 대조한다 — 모은 답이 정본의 답과 같은가, 그리고 버킷 `f` 마다 담긴 값이
 * 입력을 따로 세어 얻은 「등장 횟수가 `f` 인 값」과 같은가. 걸음 재생 패널의 걸음(`simStepsFromRef`)도
 * 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는 `topKFrequent-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { topKFrequent } from "./topKFrequent-guide.ref.ts";

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK: readonly number[] = [4, 4, 4, 2, 2, 1, 1, 3, 5];
/** 그 배열에 거는 `k`. 한 버킷 안에서 답이 차는 자리가 생긴다. */
export const WALK_K = 3;

/** 과제 규모의 상한 — 배열 길이 `N`. */
export const BIG_N = 100_000;

/**
 * 규모를 키운 입력 — `.alt.ts` 와 **같은 생성식**이다. 값 `j` 의 등장 횟수를 `1 + (j mod 3)` 으로 두고
 * 이어 붙인 뒤, 자리를 `(7919 i) mod N` 으로 옮긴다. 난수를 쓰지 않으므로 시드가 없다.
 */
export function spread123(n: number): number[] {
  const flat: number[] = [];
  for (let j = 0; flat.length < n; j++) {
    const f = 1 + (j % 3);
    for (let t = 0; t < f && flat.length < n; t++) flat.push(j);
  }
  return Array.from({ length: n }, (_, i) => flat[(i * 7919) % n] as number);
}

let bigMemo: number[] | undefined;
export const BIG = (): number[] => {
  bigMemo ??= spread123(BIG_N);
  return bigMemo;
};

export const num = (x: number): string => x.toLocaleString("en-US");
/** `[4 4 4 2 2 1 1 3 5]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
export const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;

/** 등장 횟수 맵 — 값을 처음 본 순서로 항목이 쌓인다(정본의 `freq` 와 같은 순서). */
export function freqOf(A: readonly number[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const v of A) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

/* ───────────────── 정본과 같은 절차의 걸음 기록 ───────────────── */

/** ① 한 걸음 — 인덱스 `i` 의 값 `v` 를 읽고 `freq[v]` 를 `before` 에서 `after` 로 올렸다. */
export interface CountRec {
  readonly i: number;
  readonly v: number;
  readonly before: number;
  readonly after: number;
  /** 이 걸음 뒤의 맵 항목 — 처음 넣은 순서. */
  readonly entries: readonly (readonly [number, number])[];
}

/** ② 한 걸음 — 값 `v` 를 버킷 `f` 에 담았다. */
export interface PlaceRec {
  readonly v: number;
  readonly f: number;
  /** 이 걸음 뒤의 빈도 버킷 전부. */
  readonly buckets: readonly (readonly number[])[];
}

/** ③ 버킷 하나를 본 기록 — 그 버킷의 값 중 답에 담은 것과, 안쪽에서 ⑤ 로 끝냈는가. */
export interface VisitRec {
  readonly f: number;
  readonly bucket: readonly number[];
  readonly took: readonly number[];
  readonly stopInside: boolean;
}

export interface Trace {
  readonly A: readonly number[];
  readonly k: number;
  readonly n: number;
  readonly counts: readonly CountRec[];
  readonly places: readonly PlaceRec[];
  readonly visits: readonly VisitRec[];
  /** 반복이 끝났을 때의 `f` — 바깥 조건이 거짓이 된 자리. */
  readonly endF: number;
  readonly result: readonly number[];
}

/**
 * 정본과 같은 절차를 걸음마다 기록하며 실행한다. 정본의 답과, 입력을 따로 세어 얻은 버킷 내용과
 * 대조한다 — 어긋나면 이 기록에서 만든 표 · 그림 · 패널이 다른 절차를 잰 것이다.
 */
export function trace(A: readonly number[], k: number): Trace {
  const n = A.length;
  const freq = new Map<number, number>();
  const counts: CountRec[] = [];
  A.forEach((v, i) => {
    const before = freq.get(v) ?? 0;
    freq.set(v, before + 1);
    counts.push({ i, v, before, after: before + 1, entries: [...freq] });
  });
  const slot: number[][] = Array.from({ length: n + 1 }, () => []);
  const places: PlaceRec[] = [];
  for (const [v, f] of freq) {
    slot[f]?.push(v);
    places.push({ v, f, buckets: slot.map((b) => [...b]) });
  }
  const result: number[] = [];
  const visits: VisitRec[] = [];
  let f = n;
  for (; f >= 1 && result.length < k; f--) {
    const bucket = slot[f] ?? [];
    const took: number[] = [];
    let stopInside = false;
    for (const v of bucket) {
      result.push(v);
      took.push(v);
      if (result.length === k) {
        stopInside = true;
        break;
      }
    }
    visits.push({ f, bucket: [...bucket], took, stopInside });
  }
  const want = topKFrequent([...A], k);
  if (show(result) !== show(want)) {
    throw new Error(
      `기록한 절차가 정본과 다른 답을 냈다 — ${show(A)} · k=${k}`,
    );
  }
  // 버킷 f 에 담긴 값이 「A 를 따로 세어 등장 횟수가 f 인 값」과 같아야 한다.
  const firstSeen = [...new Set(A)];
  for (let g = 0; g <= n; g++) {
    const expect = firstSeen.filter(
      (v) => A.filter((x) => x === v).length === g,
    );
    if (show(slot[g] ?? []) !== show(expect)) {
      throw new Error(`버킷 ${g} 의 내용이 따로 센 값과 다르다 — ${show(A)}`);
    }
  }
  return { A, k, n, counts, places, visits, endF: f, result };
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly stage: ArrayStep;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const RUN_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "입력",
};

const MAP_KEY = "값 v";
const MAP_VALUE = "freq";
/** 빈도 버킷 한 칸의 글자 — 담긴 값의 목록. 빈 목록은 `[]` 다. */
export const cellOf = (b: readonly number[]): string => show(b);

/** 전개의 걸음 전부 — ① 세기 · 버킷 만들기 · ② 담기 · ③④⑤ 모으기 · 끝. */
export function traceSteps(t: Trace): Step[] {
  const n = t.n;
  const m = t.counts.at(-1)?.entries.length ?? 0;
  const noBuckets = new Array<null>(n + 1).fill(null);
  const answer = (got: number) =>
    Array.from({ length: t.k }, (_, j) =>
      j < got ? (t.result[j] as number) : null,
    );
  const filledOf = (bs: readonly (readonly number[])[]) =>
    bs.filter((b) => b.length > 0).length;
  const bucketSide = (bs: readonly (readonly number[])[]) =>
    `값 든 버킷 ${filledOf(bs)} / ${n + 1}`;
  const steps: Omit<Step, "id">[] = [];

  for (const c of t.counts) {
    steps.push({
      title: `① A[${c.i}] = ${c.v} — freq ${c.before} → ${c.after}`,
      detail:
        c.before === 0
          ? `값 ${c.v}${은는(c.v)} 처음 봅니다. freq.get(${c.v}) 가 없어 0 에서 시작해 1 로 둡니다.`
          : `값 ${c.v}${은는(c.v)} 이미 있습니다. 앞에 센 ${c.before} 에 1 을 더해 ${c.after}${으로(c.after)} 고칩니다.`,
      stage: {
        array: [...t.A],
        range: [0, n - 1],
        rangeSide: `읽음 ${c.i + 1} / ${n}`,
        read: [c.i],
        write: [],
        pointers: { i: c.i },
        layers: [
          { name: "버킷", values: noBuckets, side: "만들기 전" },
          { name: "답", values: answer(0) },
        ],
        map: {
          keyLabel: MAP_KEY,
          valueLabel: MAP_VALUE,
          entries: c.entries.map(([v, f]) => [v, f] as const),
          slots: m,
          write: [c.v],
          note: c.before === 0 ? `${c.v} 새 항목` : `${c.v} 있음`,
        },
        calc: { expr: `(freq.get(${c.v}) ?? 0) + 1`, result: String(c.after) },
        vars: null,
      },
    });
  }

  const finalEntries = (t.counts.at(-1)?.entries ?? []).map(
    ([v, f]) => [v, f] as const,
  );
  const empty = Array.from({ length: n + 1 }, () => [] as number[]);
  steps.push({
    title: `빈도 버킷 ${n + 1} 개를 만든다`,
    detail: `등장 횟수는 1 이상 ${n} 이하입니다. 버킷 번호 0 부터 ${n} 까지 ${n + 1} 개를 빈 목록으로 만듭니다.`,
    stage: {
      array: [...t.A],
      range: null,
      rangeSide: "세기 끝",
      read: [],
      write: [],
      layers: [
        {
          name: "버킷",
          values: empty.map(cellOf),
          write: empty.map((_, f) => f),
          side: bucketSide(empty),
        },
        { name: "답", values: answer(0) },
      ],
      map: {
        keyLabel: MAP_KEY,
        valueLabel: MAP_VALUE,
        entries: finalEntries,
        slots: m,
        note: `항목 ${m} 개`,
      },
      calc: {
        expr: `Array.from({ length: ${n + 1} }, () => [])`,
        result: `버킷 0 … ${n}`,
      },
      vars: null,
    },
  });

  for (const p of t.places) {
    steps.push({
      title: `② 값 ${p.v}${을를(p.v)} 버킷 ${p.f} 에 담는다`,
      detail: `freq 에서 값 ${p.v} 의 등장 횟수 ${p.f}${을를(p.f)} 읽어, 그 수를 버킷 번호로 씁니다. 버킷 ${p.f} 의 목록은 이제 ${cellOf(p.buckets[p.f] ?? [])} 입니다.`,
      stage: {
        array: [...t.A],
        range: null,
        rangeSide: "세기 끝",
        read: [],
        write: [],
        layers: [
          {
            name: "버킷",
            values: p.buckets.map(cellOf),
            write: [p.f],
            side: bucketSide(p.buckets),
          },
          { name: "답", values: answer(0) },
        ],
        map: {
          keyLabel: MAP_KEY,
          valueLabel: MAP_VALUE,
          entries: finalEntries,
          slots: m,
          read: [p.v],
          note: `freq[${p.v}] = ${p.f}`,
        },
        calc: {
          expr: `slot[${p.f}].push(${p.v})`,
          result: cellOf(p.buckets[p.f] ?? []),
        },
        vars: null,
      },
    });
  }

  const buckets = t.places.at(-1)?.buckets ?? empty;
  const layerBuckets = (read: number[]) => ({
    name: "버킷",
    values: buckets.map(cellOf),
    read,
    side: bucketSide(buckets),
  });
  const collectMap = {
    keyLabel: MAP_KEY,
    valueLabel: MAP_VALUE,
    entries: finalEntries,
    slots: m,
    note: `항목 ${m} 개`,
  };
  let got = 0;
  let run: VisitRec[] = [];
  const flushRun = () => {
    if (run.length === 0) return;
    const hi = (run[0] as VisitRec).f;
    const lo = (run.at(-1) as VisitRec).f;
    steps.push({
      title: `③ 버킷 ${hi} … ${lo}${은는(lo)} 비었다`,
      detail: `버킷 번호를 ${hi} 부터 하나씩 내립니다. 버킷 ${run.length} 개가 빈 목록이라 안쪽 반복이 한 번도 실행되지 않고, 답은 ${got} 개 그대로입니다.`,
      stage: {
        array: [...t.A],
        range: null,
        rangeSide: "세기 끝",
        read: [],
        write: [],
        layers: [
          layerBuckets(run.map((r) => r.f)),
          { name: "답", values: answer(got) },
        ],
        map: collectMap,
        calc: { expr: `slot[${hi}] … slot[${lo}]`, result: "모두 빈 목록" },
        vars: `f = ${hi} … ${lo}`,
      },
    });
    run = [];
  };
  for (const vis of t.visits) {
    if (vis.took.length === 0) {
      run.push(vis);
      continue;
    }
    flushRun();
    vis.took.forEach((v, j) => {
      got++;
      const last = vis.stopInside && j === vis.took.length - 1;
      steps.push({
        title: last
          ? `⑤ 버킷 ${vis.f} 의 값 ${v} 에서 답이 찬다`
          : `④ 버킷 ${vis.f} 의 값 ${v}${을를(v)} 답에 담는다`,
        detail: last
          ? `값 ${v}${을를(v)} 담자 답이 ${got} 개가 됐습니다. ${got} === ${t.k}${이가(t.k)} 참이라 버킷 ${vis.f} 안에서 멈춥니다.`
          : `버킷 ${vis.f} 의 값 ${v}${을를(v)} 답에 담습니다. ${got} === ${t.k}${이가(t.k)} 거짓이라 계속합니다.`,
        stage: {
          array: [...t.A],
          range: null,
          rangeSide: "세기 끝",
          read: [],
          write: [],
          layers: [
            layerBuckets([vis.f]),
            { name: "답", values: answer(got), write: [got - 1] },
          ],
          map: collectMap,
          calc: {
            expr: "result.length === k",
            result: `${got} === ${t.k} ${last ? "참" : "거짓"}`,
          },
          vars: `f = ${vis.f}`,
        },
      });
    });
  }
  flushRun();
  steps.push({
    title: `③ 바깥 조건이 거짓 — 끝`,
    detail:
      got >= t.k
        ? `f 를 ${t.endF} 로 내린 뒤 바깥 조건을 봅니다. ${got} < ${t.k}${이가(t.k)} 거짓이라 버킷 ${t.endF} 부터는 보지 않고 답 ${show(t.result)}${을를(t.result.at(-1) ?? "")} 돌려줍니다.`
        : `f 가 ${t.endF}${이가(t.endF)} 되어 f >= 1 이 거짓입니다. 답 ${show(t.result)}${을를(t.result.at(-1) ?? "")} 돌려줍니다.`,
    stage: {
      array: [...t.A],
      range: null,
      rangeSide: "세기 끝",
      read: [],
      write: [],
      layers: [layerBuckets([]), { name: "답", values: answer(got) }],
      map: collectMap,
      calc: {
        expr: "f >= 1 && result.length < k",
        result: `${t.endF} >= 1 && ${got} < ${t.k} → 거짓`,
      },
      vars: `f = ${t.endF}`,
    },
  });
  return steps.map((s, j) => ({ id: `T${j + 1}`, ...s }));
}

/** 본문 전개의 걸음 — 필름 · 표 · 패널이 같은 번호를 쓴다. */
export const walkSteps = (): Step[] => traceSteps(trace(WALK, WALK_K));

/** 걸음을 두 벌로 가른다 — 버킷을 만드는 벌(① · 만들기 · ②)과 모으는 벌(③④⑤). */
export function splitSteps(steps: readonly Step[]): {
  build: Step[];
  collect: Step[];
} {
  const cut = steps.findIndex((s) => /^[③④⑤]/.test(s.title));
  return { build: steps.slice(0, cut), collect: steps.slice(cut) };
}

const film = (steps: readonly Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(s.stage, RUN_OPTIONS),
  }));

/** 담기를 마친 뒤의 빈도 버킷 — 패널의 반환값 글자와 본문 결과 마커가 같이 쓴다. */
export function bucketsResult(t: Trace): string {
  const b = t.places.at(-1)?.buckets ?? [];
  return b
    .map((x, f) => ({ x, f }))
    .filter(({ x }) => x.length > 0)
    .reverse()
    .map(({ x, f }) => `slot[${f}] = ${cellOf(x)}`)
    .join(" · ");
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행과 대조한 기록에서 만든다. `.sim.ts` 의 `steps` 는
 * 이 결과를 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이
 * 같은지는 `topKFrequent-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const toStep = (s: Step) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...s.stage,
  });
  const { build, collect } = splitSteps(walkSteps());
  return { build: build.map(toStep), collect: collect.map(toStep) };
}

/* ───────────────── 기본 연산 — 원고 전체가 같은 기준으로 센다 ───────────────── */

/**
 * 기본 연산은 **맵 연산 하나 · 배열 칸 읽기나 쓰기 하나 · 두 수의 비교 하나**를 각각 1 로 센다.
 * 「아이디어를 떠올리는 과정」 · 「비용 계산」 · `.alt.ts` 가 모두 이 기준이다.
 *
 * 빈도 버킷 — 정본과 같은 절차. 세기 2N(맵 읽기 + 쓰기) · 버킷 만들기 N+1 · 담기 2M(버킷 읽기 +
 * 담기) · 버킷 하나를 볼 때마다 2(버킷 읽기 + 바깥 조건) · 값을 하나 담을 때마다 2(담기 + 개수 비교).
 * 메모리는 추가 칸(입력과 빈도 맵 밖에 동시에 들고 있는 칸) — 버킷 N+1 개와 버킷에 담긴 값 M 개다.
 */
export function bucketCost(
  A: readonly number[],
  k: number,
): {
  out: number[];
  count: number;
  make: number;
  place: number;
  descend: number;
  visited: number;
  taken: number;
  ops: number;
  freqCompares: number;
  cells: number;
  m: number;
} {
  const n = A.length;
  let count = 0;
  const freq = new Map<number, number>();
  for (const v of A) {
    count += 2;
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }
  const slot: number[][] = Array.from({ length: n + 1 }, () => []);
  const make = n + 1;
  let place = 0;
  for (const [v, f] of freq) {
    place += 2;
    slot[f]?.push(v);
  }
  let descend = 0;
  let visited = 0;
  let taken = 0;
  const out: number[] = [];
  for (let f = n; f >= 1 && out.length < k; f--) {
    descend += 2;
    visited++;
    for (const v of slot[f] ?? []) {
      descend += 2;
      taken++;
      out.push(v);
      if (out.length === k) break;
    }
  }
  if (show(out) !== show(topKFrequent([...A], k))) {
    throw new Error("빈도 버킷 계측이 정본과 다른 답을 냈다");
  }
  return {
    out,
    count,
    make,
    place,
    descend,
    visited,
    taken,
    ops: count + make + place + descend,
    freqCompares: 0,
    cells: n + 1 + freq.size,
    m: freq.size,
  };
}

/**
 * 값마다 배열 전체를 다시 세는 방법 — 칸 `i` 를 읽고(1), 칸 `j` 마다 읽고 비교한다(2). 등장 횟수를
 * 구하는 데까지만 센다. 그 뒤에 순서를 정하는 일은 더 든다.
 */
export function rescanCost(A: readonly number[]): number {
  const n = A.length;
  let ops = 0;
  for (let i = 0; i < n; i++) {
    ops += 1;
    const target = A[i] as number;
    let c = 0;
    for (let j = 0; j < n; j++) {
      ops += 2;
      if (A[j] === target) c++;
    }
    if (c < 1) throw new Error("자기 자신도 못 셌다");
  }
  return ops;
}
/** 칸 수 `n` 에서 값마다 다시 세는 방법의 기본 연산 — `rescanCost` 가 작은 `n` 에서 같음을 확인한 식. */
export const rescanFormula = (n: number): number => n + 2 * n * n;

/**
 * 맵에 세고 항목 전부를 등장 횟수 내림차순으로 줄 세우는 방법 — 아래서 위로 합치는 병합 정렬이라
 * 비교 횟수가 결정론적이다. 세기 2N · 항목 옮기기 2M(맵 읽기 + 배열 쓰기) · 합치기 한 걸음 4(두 칸
 * 읽기 + 비교 + 쓰기) · 남은 칸 옮기기 2 · 답 담기 2k. 추가 칸은 항목 배열과 합칠 때 쓰는 버퍼 2M 이다.
 */
export function sortAllCost(
  A: readonly number[],
  k: number,
): { out: number[]; ops: number; freqCompares: number; cells: number } {
  const freq = freqOf(A);
  let ops = 2 * A.length;
  let src: [number, number][] = [];
  for (const e of freq) {
    ops += 2;
    src.push(e);
  }
  const m = src.length;
  let dst: [number, number][] = new Array(m);
  let compares = 0;
  for (let width = 1; width < m; width *= 2) {
    for (let lo = 0; lo < m; lo += 2 * width) {
      const mid = Math.min(lo + width, m);
      const hi = Math.min(lo + 2 * width, m);
      let i = lo;
      let j = mid;
      let o = lo;
      while (i < mid && j < hi) {
        ops += 4;
        compares++;
        const a = src[i] as [number, number];
        const b = src[j] as [number, number];
        if (a[1] >= b[1]) {
          dst[o++] = a;
          i++;
        } else {
          dst[o++] = b;
          j++;
        }
      }
      while (i < mid) {
        ops += 2;
        dst[o++] = src[i++] as [number, number];
      }
      while (j < hi) {
        ops += 2;
        dst[o++] = src[j++] as [number, number];
      }
    }
    [src, dst] = [dst, src];
  }
  const out: number[] = [];
  for (let t = 0; t < k; t++) {
    ops += 2;
    out.push((src[t] as [number, number])[0]);
  }
  // 동률의 순서는 정해지지 않으므로 답에 든 값들의 등장 횟수 모음으로 대조한다.
  const want = topKFrequent([...A], k)
    .map((v) => freq.get(v))
    .join(" ");
  if (out.map((v) => freq.get(v)).join(" ") !== want) {
    throw new Error("전부 줄 세우기가 정본과 다른 등장 횟수를 답했다");
  }
  return { out, ops, freqCompares: compares, cells: 2 * m };
}

/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toFixed(2)} 초`;

/** 흔한 채점 환경의 메모리 예산 — 256 MB. */
export const BUDGET_BYTES = 256 * 1024 * 1024;
/** 값의 범위 −10^9 … 10^9 를 칸 번호로 쓸 때의 칸 수. */
export const VALUE_CELLS = 2 * 10 ** 9 + 1;

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

function approaches(): Approach[] {
  const A = BIG();
  const rescan = rescanFormula(BIG_N);
  const sorted = sortAllCost(A, 10);
  const bucket = bucketCost(A, 10);
  return [
    {
      name: "값마다 배열 전체를 다시 세기",
      idea: "칸 하나를 읽을 때마다 배열 전체를 읽어 그 값이 몇 번 나오는지 센다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `세기만 기본 연산 ${num(rescan)} 번 · ${secondsOf(rescan)}`,
          ok: false,
        },
      ],
      lesson:
        "같은 값을 몇 번이고 다시 센다 — 한 번 센 것을 맵에 들고 있으면 된다",
    },
    {
      name: "맵에 세고 전부 줄 세우기",
      idea: "맵에 한 번 센 뒤 항목 M 개를 등장 횟수 내림차순으로 정렬해 앞의 k 개를 낸다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `기본 연산 ${num(sorted.ops)} 번 · 예산 안`,
          ok: true,
        },
        {
          label: "비교",
          value: `등장 횟수끼리 ${num(sorted.freqCompares)} 번 · M 이 늘면 M log M 으로 는다`,
          ok: null,
        },
      ],
      lesson:
        "순서를 비교로 정한다 — 계수 정렬처럼 수를 칸 번호로 쓰면 순서가 칸의 자리로 정해진다",
    },
    {
      name: "값을 칸 번호로 쓰기",
      idea: "계수 정렬처럼 값 v 를 칸 번호로 두고 그 칸에 등장 횟수를 적는다",
      verdict: "drop",
      checks: [
        {
          label: "메모리",
          value: `칸 ${num(VALUE_CELLS)} 개 · 칸당 4 바이트여도 ${num(VALUE_CELLS * 4)} 바이트`,
          ok: false,
        },
      ],
      lesson: "값의 범위가 넓다 — 범위가 좁은 다른 수를 칸 번호로 쓸 수 없을까",
    },
    {
      name: "등장 횟수를 칸 번호로 쓰기",
      idea: "등장 횟수 f 를 버킷 번호로 두고 버킷 f 에 그 횟수인 값을 담는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `기본 연산 ${num(bucket.ops)} 번 · 등장 횟수끼리 비교 0 번`,
          ok: true,
        },
        {
          label: "메모리",
          value: `추가 칸 ${num(bucket.cells)} 개`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 버킷 번호 줄 — 칸 `f` 에 `f` 를 적는다. 빈도 버킷 줄 바로 위에 둔다. */
const bucketIndexRow = (n: number): StageRow => ({
  kind: "cells",
  label: "버킷 번호 f",
  values: Array.from({ length: n + 1 }, (_, f) => f),
});

/** A 의 인덱스 눈금 — A 보다 긴 격자에서 A 밖의 칸은 비워 둔다. */
const aIndexRow = (n: number, columns: number): StageRow => ({
  kind: "index",
  label: "인덱스 i",
  labels: Array.from({ length: columns }, (_, i) => (i < n ? i : "")),
});

/** 전체 컨셉 — A · freq · 빈도 버킷 · 답을 한 장에. */
function conceptRows(t: Trace): StageRow[] {
  const entries = t.counts.at(-1)?.entries ?? [];
  const buckets = t.places.at(-1)?.buckets ?? [];
  return [
    aIndexRow(t.n, t.n + 1),
    { kind: "cells", label: "A", values: [...t.A], side: `N = ${t.n}` },
    {
      kind: "cells",
      label: "값 v",
      values: entries.map(([v]) => v),
      side: `서로 다른 값 ${entries.length} 개`,
    },
    {
      kind: "cells",
      label: "freq",
      values: entries.map(([, f]) => f),
      side: `합 ${entries.reduce((s, [, f]) => s + f, 0)}`,
    },
    bucketIndexRow(t.n),
    {
      kind: "cells",
      label: "빈도 버킷",
      values: buckets.map(cellOf),
      side: `버킷 ${t.n + 1} 개`,
    },
    {
      kind: "cells",
      label: `답 k = ${t.k}`,
      values: [...t.result],
      side: "큰 버킷부터",
    },
  ];
}

/** 버킷 하나가 A 의 어느 칸을 맡는가 — 값이 든 버킷마다 한 장. */
function coverFrames(t: Trace): StageFrame[] {
  const buckets = t.places.at(-1)?.buckets ?? [];
  const frames: StageFrame[] = [];
  for (let f = t.n; f >= 0; f--) {
    const b = buckets[f] ?? [];
    if (b.length === 0) continue;
    const states: Partial<Record<number, CellState>> = {};
    const cells: number[] = [];
    t.A.forEach((v, i) => {
      if (b.includes(v)) {
        states[i] = "read";
        cells.push(i);
      }
    });
    const bucketStates: Partial<Record<number, CellState>> = { [f]: "focus" };
    frames.push({
      id: `버킷 ${f}`,
      text: `버킷 ${f} = ${cellOf(b)} — A 의 인덱스 ${cells.join(" · ")}`,
      rows: [
        aIndexRow(t.n, t.n + 1),
        {
          kind: "cells",
          label: "A",
          values: [...t.A],
          states,
          side: `${cells.length} 칸 = ${f} × ${b.length}`,
        },
        { kind: "caret", cells },
        bucketIndexRow(t.n),
        {
          kind: "cells",
          label: "빈도 버킷",
          values: buckets.map(cellOf),
          states: bucketStates,
        },
      ],
    });
  }
  return frames;
}

/** 헷갈리기 쉬운 모양 — 값을 칸 번호로 쓴 `count` 와 등장 횟수를 칸 번호로 쓴 빈도 버킷. */
function contrastRows(t: Trace): StageRow[] {
  const top = Math.max(...t.A);
  const count = Array.from(
    { length: top + 1 },
    (_, v) => t.A.filter((x) => x === v).length,
  );
  const buckets = t.places.at(-1)?.buckets ?? [];
  return [
    {
      kind: "cells",
      label: "칸 번호 = 값 v",
      values: count.map((_, v) => v),
    },
    {
      kind: "cells",
      label: "count[v]",
      values: count,
      side: `칸 ${count.length} 개 = 가장 큰 값 + 1`,
    },
    {
      kind: "cells",
      label: "칸 번호 = 횟수 f",
      values: buckets.map((_, f) => f),
    },
    {
      kind: "cells",
      label: "빈도 버킷",
      values: buckets.map(cellOf),
      side: `칸 ${buckets.length} 개 = N + 1`,
    },
  ];
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-buckets": () => {
    const t = trace(WALK, WALK_K);
    return (
      <CellStage
        title={`${show(WALK)} 을 한 번 세고, 값을 등장 횟수 번 버킷에 담아, 큰 버킷부터 ${WALK_K} 개를 모은다`}
        rows={conceptRows(t)}
        columns={t.n + 1}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 막힌 자리에서 다음 방법이 나왔다"
        constraint={`배열 길이 ${num(BIG_N)} · 값 −10^9 이상 10^9 이하 · 1 초 · 256 MB(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-bucket-cover": () => {
    const t = trace(WALK, WALK_K);
    return (
      <CellStageFilm
        title="값이 든 버킷마다 — 버킷 f 의 값은 A 에서 정확히 f 칸씩을 맡는다"
        columns={t.n + 1}
        frames={coverFrames(t)}
      />
    );
  },
  "build-contrast": () => {
    const t = trace(WALK, WALK_K);
    return (
      <CellStage
        title="같은 입력 — 값을 칸 번호로 쓴 count 와 등장 횟수를 칸 번호로 쓴 빈도 버킷"
        rows={contrastRows(t)}
        columns={t.n + 1}
      />
    );
  },
  "walk-build": () => {
    const { build } = splitSteps(walkSteps());
    return (
      <CellStageFilm
        title={`topKFrequent(${show(WALK)}, ${WALK_K}) — ${build[0]?.id}~${build.at(-1)?.id}`}
        columns={WALK.length + 1}
        frames={film(build)}
      />
    );
  },
  "walk-collect": () => {
    const { collect } = splitSteps(walkSteps());
    return (
      <CellStageFilm
        title={`topKFrequent(${show(WALK)}, ${WALK_K}) — ${collect[0]?.id}~${collect.at(-1)?.id}`}
        columns={WALK.length + 1}
        frames={film(collect)}
      />
    );
  },
};
