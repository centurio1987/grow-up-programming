/**
 * `sparseTableRangeMin-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 층 `k` 의 칸 `i` 는 정본에
 * 구간 `[i, i+2^k−1]` 을 물은 답이고, 두 조각도 정본이 답을 내는 자리에서 계산한다. 걸음 그림
 * (`walk-*`)은 `.sim.ts` 프레임에서 받는다 — 프레임이 정본 실행과 같은지는 `src/_viz/patterns.test.tsx`
 * 와 SPEC §9 가 잰다.
 */

import type { ReactElement } from "react";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import { type LayerBar, LayerBars } from "../../../_viz/patterns/LayerBars";
import { LevelTable } from "../../../_viz/patterns/LevelTable";
import {
  overlapCells,
  type Range,
  RangeCover,
} from "../../../_viz/patterns/RangeCover";
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

/** 질의 괄호 하나 + 두 조각. 괄호 셋의 자리·굵기·대시는 시안 컴포넌트 03 이 정한다. */
function cover(l: number, r: number): Range[] {
  return [
    { from: l, to: r, tone: "query", note: `[${l},${r}] · ${r - l + 1} 칸` },
    ...pieces(l, r),
  ];
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

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 식과 정본 실행에서 ── */

const N = 100_000;
const num = (x: number): string => x.toLocaleString("en-US");
/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
const secondsOf = (ops: number): string => `${(ops / 1e8).toFixed(2)} 초`;
const K = Math.floor(Math.log2(N));
const stCells = (K + 1) * (N + 1) - (2 ** (K + 1) - 1);
const stBuild = K * (N + 1) - (2 ** (K + 1) - 2);
const pairCells = (N * (N + 1)) / 2;

/** 접두 최솟값 반례 — 두 칸 m[1] · m[5] 가 같은 두 배열에서 [2,5] 의 답이 갈린다. 답은 정본이 낸다. */
function prefixCounterexample(): string {
  const B = [5, 2, 7, 4, 6, 9];
  const a = sparseTableRangeMin(A, [[2, 5]])[0] as number;
  const b = sparseTableRangeMin(B, [[2, 5]])[0] as number;
  return `두 칸이 같은 배열 둘에서 [2,5] 의 답이 ${a} 과 ${b} 로 갈린다`;
}

function approaches(): Approach[] {
  return [
    {
      name: "질의마다 차례로 읽기",
      idea: "질의가 올 때마다 구간을 처음부터 끝까지 읽는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `비교 ${num(N * (N - 1))} 번 · ${secondsOf(N * (N - 1))}`,
          ok: false,
        },
        { label: "메모리", value: "더 적어 두는 칸이 없다", ok: true },
      ],
      lesson:
        "질의 하나가 구간 길이만큼 일한다 — 미리 적어 두고 두 칸만 읽으면 어떨까",
    },
    {
      name: "접두 최솟값 두 칸",
      idea: "앞에서부터 누적한 최솟값을 적어 두고, 두 칸으로 답한다",
      verdict: "drop",
      checks: [
        { label: "답", value: prefixCounterexample(), ok: false },
        { label: "시간", value: "질의 하나에 칸 두 개", ok: true },
        { label: "메모리", value: `${num(N)} 칸`, ok: true },
      ],
      lesson:
        "최솟값은 앞부분을 덜어 낼 수 없다 — 시작이 0 이 아닌 구간도 적어 두면 어떨까",
    },
    {
      name: "모든 구간의 답을 미리 적기",
      idea: "고를 수 있는 [l, r] 짝마다 답을 적어 둔다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `칸 ${num(pairCells)} 개를 채운다 · ${secondsOf(pairCells)}`,
          ok: false,
        },
        {
          label: "메모리",
          value: `8 바이트씩 ${((pairCells * 8) / 1e9).toFixed(0)} GB`,
          ok: false,
        },
      ],
      lesson:
        "적을 구간이 너무 많다 — 칸 수가 2 의 거듭제곱인 구간만 적고 둘로 덮으면 어떨까",
    },
    {
      name: "겹치는 두 조각으로 덮기",
      idea: "칸 수가 2ᵏ 인 구간만 적고, 질의는 그런 구간 둘로 덮는다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: "맞다 — 겹친 칸을 두 번 세도 최솟값은 그대로다",
          ok: true,
        },
        {
          label: "시간",
          value: `비교 ${num(stBuild + N)} 번 · ${secondsOf(stBuild + N)}`,
          ok: true,
        },
        {
          label: "메모리",
          value: `${num(stCells)} 칸 · 8 바이트씩 ${((stCells * 8) / 1024 / 1024).toFixed(2)} MiB`,
          ok: true,
        },
      ],
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
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`제약 n = q = ${num(N)} · 시간 1 초 · 메모리 256 MB(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
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
      ranges={cover(0, 5)}
      annotation={{
        cells: overlapCells(pieces(0, 5)),
        text: `겹친 칸 ${overlapCells(pieces(0, 5)).length} 개. 답은 ${minOf(0, 5)} 다`,
      }}
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
      ranges={cover(0, 4)}
      annotation={{
        cells: overlapCells(pieces(0, 4)),
        text: `인덱스 ${overlapCells(pieces(0, 4)).join(" · ")} 이 두 조각에 함께 들어 있다`,
      }}
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
