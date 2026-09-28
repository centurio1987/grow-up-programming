/**
 * `sparseTableRangeMin-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 층 `k` 의 칸 `i` 는 정본에
 * 구간 `[i, i+2^k−1]` 을 물은 답이고, 두 조각도 정본이 답을 내는 자리에서 계산한다. 걸음 그림
 * (`walk-*`)은 `.sim.ts` 프레임에서 받는다 — 프레임이 정본 실행과 같은지는 `src/_viz/patterns.test.tsx`
 * 와 SPEC §9 가 잰다.
 */

import type { ReactElement } from "react";
import { type LayerBar, LayerBars } from "../../../_viz/patterns/LayerBars";
import { LevelTable } from "../../../_viz/patterns/LevelTable";
import { type Range, RangeCover } from "../../../_viz/patterns/RangeCover";
import { StepTrace, type TraceStep } from "../../../_viz/patterns/StepTrace";
import { sparseTableRangeMin } from "./sparseTableRangeMin-guide.ref.ts";
import { answer, build } from "./sparseTableRangeMin-guide.sim.ts";

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
const A = [5, 2, 7, 4, 6, 3];

const minOf = (l: number, r: number): number =>
  sparseTableRangeMin(A, [[l, r]])[0] as number;

/** 층 k 의 칸 i = 구간 [i, i+2^k−1] 의 최솟값 — 정본에 물어서 채운다. */
function levels(): number[][] {
  const out: number[][] = [];
  for (let w = 1; w <= A.length; w *= 2) {
    out.push(
      Array.from({ length: A.length - w + 1 }, (_, i) => minOf(i, i + w - 1)),
    );
  }
  return out;
}

/** 층 k 의 칸마다 한 줄 — 맡는 자리와 「[l,r] 의 최솟값 v」. */
function layerBars(k: number): LayerBar[] {
  const w = 2 ** k;
  if (k === 0)
    return [
      {
        label: "0 층",
        from: 0,
        to: A.length - 1,
        note: "칸 하나가 한 자리를 맡는다 · 배열 그대로",
      },
    ];
  return Array.from({ length: A.length - w + 1 }, (_, i) => ({
    label: `${k} 층 칸 ${i}`,
    from: i,
    to: i + w - 1,
    note: `[${i},${i + w - 1}] 의 최솟값 ${minOf(i, i + w - 1)}`,
  }));
}

/** 질의 [l,r] 의 두 조각 — 2^k ≤ 칸 수 인 가장 큰 k. 조각 값도 정본에 묻는다. */
function pieces(l: number, r: number): Range[] {
  const len = r - l + 1;
  let k = 0;
  while (2 ** (k + 1) <= len) k++;
  const w = 2 ** k;
  const right = r - w + 1;
  return [
    {
      from: l,
      to: l + w - 1,
      tone: "left",
      note: `${k} 층의 칸 ${l}, 값 ${minOf(l, l + w - 1)}`,
    },
    {
      from: right,
      to: r,
      tone: "right",
      note: `${k} 층의 칸 ${right}, 값 ${minOf(right, r)}`,
    },
  ];
}

type Frame = {
  title: string;
  entries: readonly { label: string; value: number }[];
};
const val = (f: Frame, label: string): number =>
  f.entries.find((e) => e.label === label)?.value as number;
const idOf = (f: Frame): string => f.title.split(" ")[0] as string;

/** `T3 k=1 i=0` → 「1 층 칸 0 · min(5, 2) = 2 · 채운 칸 1」. */
const buildStep = (f: Frame): TraceStep => {
  const [, k, i] = f.title.match(/k=(\d+) i=(\d+)/) ?? [];
  const a = val(f, "아래층 왼쪽 값");
  const b = val(f, "아래층 오른쪽 값");
  return {
    id: idOf(f),
    text: `${k} 층 칸 ${i} · min(${a}, ${b}) = ${val(f, "새 칸의 값")} · 채운 칸 ${val(f, "채운 칸 수")}`,
  };
};

/** `T11 질의 l=0 r=4` → 「[0,4] · 층 2 · min(2, 2) = 2 · 겹친 칸 3」. */
const answerStep = (f: Frame): TraceStep => {
  const [, l, r] = (f.title.match(/l=(\d+) r=(\d+)/) ?? []).map(Number);
  const k = val(f, "층 k");
  const len = (r as number) - (l as number) + 1;
  return {
    id: idOf(f),
    text: `[${l},${r}] · 층 ${k} · min(${val(f, "왼쪽 조각의 값")}, ${val(f, "오른쪽 조각의 값")}) = ${val(f, "구간의 최솟값")} · 겹친 칸 ${2 * 2 ** k - len}`,
  };
};

export const FIGS: Record<string, () => ReactElement> = {
  "concept-layer-one": () => (
    <LayerBars
      title="1 층의 칸 다섯 — 칸마다 두 자리를 맡는다"
      values={A}
      indexLabel="인덱스"
      groups={[layerBars(1)]}
    />
  ),
  "concept-levels": () => (
    <LevelTable
      title="Sparse Table 세 층 — A = [5, 2, 7, 4, 6, 3]"
      levels={levels()}
      indexLabel="인덱스"
    />
  ),
  "concept-cover": () => (
    <RangeCover
      title="구간 [0,5] 를 4 칸짜리 조각 둘로 덮기"
      row={{ label: "A 의 값", values: A }}
      indexLabel="인덱스"
      ranges={pieces(0, 5)}
    />
  ),
  "build-layer-bars": () => (
    <LayerBars
      title="세 층의 칸 — 칸마다 맡는 자리"
      values={A}
      indexLabel="인덱스"
      groups={[layerBars(0), layerBars(1), layerBars(2)]}
    />
  ),
  "build-fill-cell": () => (
    <LevelTable
      title="2 층 칸 1 은 1 층 칸 1 과 칸 3 에서 나온다"
      levels={levels()}
      focus={{ k: 2, i: 1 }}
      indexLabel="인덱스"
    />
  ),
  "build-cover-04": () => (
    <RangeCover
      title="구간 [0,4] 를 4 칸짜리 조각 둘로 덮기"
      row={{ label: "A 의 값", values: A }}
      indexLabel="인덱스"
      ranges={pieces(0, 4)}
    />
  ),
  "walk-build": () => (
    <StepTrace
      title={build.title}
      steps={(build.steps as unknown as Frame[]).map(buildStep)}
    />
  ),
  "walk-answer": () => (
    <StepTrace
      title={answer.title}
      steps={(answer.steps as unknown as Frame[]).map(answerStep)}
    />
  ),
};
