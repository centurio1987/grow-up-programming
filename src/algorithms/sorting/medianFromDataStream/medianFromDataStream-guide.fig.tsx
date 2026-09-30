/**
 * `medianFromDataStream-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 두 힙의 내용은 증명 사이드카의 `walk()` — 정본
 * `MedianFinder` 의 두 힙 객체에 기록만 붙여 실행한 것 — 이 내고, 시도 사다리의 수는 같은 사이드카의
 * `scale()` 이 정본과 답을 맞댄 세는 사본으로 낸다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은
 * 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는 `medianFromDataStream-guide.test.ts` 가 잰다.
 *
 * ## 두 힙을 무대에 보이는 법
 *
 * 이 편에서 독자가 두 힙에서 알아야 할 것은 **두 힙의 크기가 어떻게 맞춰지는가**와 **두 꼭대기가 무엇인가**
 * 둘이다. 힙의 트리 모양(부모·자식 비교와 맞바꿈)은 그 둘 어느 것에도 필요하지 않으므로, `dijkstra` 편이
 * 세운 우선순위 큐 규약대로 힙의 내용을 **꺼낼 차례대로** 늘어놓은 띠로 그린다. 그래프가 없는 편이라 띠는
 * 배열 무대(`stage: "array"`)의 입력 흐름 줄 아래 `layers` 두 줄이다.
 *
 * - 윗줄은 입력 흐름이다. 쥔 구간 「들어온 수」가 지금까지 넣은 수이고, ▲ 가 이번 걸음에 넣는 수다.
 * - 아래 두 줄이 작은 쪽(최대 힙 `low`)과 큰 쪽(최소 힙 `high`)이다. 첫 칸이 곧 꼭대기다. 칸 수는 두 힙이
 *   가장 커졌을 때에 맞춰 고정하고, 빈 칸은 점선이다. 곁말은 힙의 크기다.
 * - 이번 걸음에 새로 들어온 값은 새로 씀, `findMedian` 이 읽은 두 꼭대기는 읽음(▲)이다.
 *
 * 힙 배열에 **실제로 놓인 순서**(정렬되지 않은 순서)는 본문 「먼저 알아 둘 개념」의 표와 「수행으로
 * 알아보는 알고리즘」 1. 의 짧은 실행이 따로 보인다.
 */

import type { ReactElement } from "react";
import { 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
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
import { RangeCover } from "../../../_viz/patterns/RangeCover";
import {
  type ArrayLayer,
  type ArrayOptions,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import {
  ADDS,
  CALLS,
  comma,
  highOrder,
  lowOrder,
  ONE_VALUE_ADD,
  ONE_VALUE_CASES,
  type Pair,
  runRecorded,
  scale,
  seconds,
  sorted,
  trueMedian,
  WALK,
  type WalkStep,
  walk,
} from "./medianFromDataStream-guide.proof.ts";

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "들어오는 수",
  rangeLabel: "들어온 수",
};

/** 두 힙 띠의 칸 수 — 걸음이 끝났을 때 두 힙이 가장 커진 크기. */
const SLOTS = Math.max(
  ...walk().map((s) => Math.max(s.low.length, s.high.length)),
);

/** `order` 가운데 `before` 에 없던 값의 칸 — 이번 걸음에 새로 들어온 값이다(같은 값은 개수로 센다). */
function added(order: readonly number[], before: readonly number[]): number[] {
  const left = new Map<number, number>();
  for (const v of before) left.set(v, (left.get(v) ?? 0) + 1);
  const out: number[] = [];
  order.forEach((v, i) => {
    const n = left.get(v) ?? 0;
    if (n > 0) left.set(v, n - 1);
    else out.push(i);
  });
  return out;
}

/** 힙 띠 한 줄 — 꺼낼 차례대로, 빈 칸은 `null`. */
function heapLayer(
  name: string,
  kind: string,
  order: readonly number[],
  before: readonly number[],
  asked: boolean,
): ArrayLayer {
  return {
    name,
    values: [
      ...order,
      ...Array.from({ length: SLOTS - order.length }, () => null),
    ],
    read: asked && order.length > 0 ? [0] : [],
    write: added(order, before),
    side: `${kind} · 크기 ${order.length}`,
  };
}

/** 답을 만드는 계산 한 줄 — 알약. */
function calcOf(s: WalkStep): ArrayStep["calc"] {
  if (s.median === null) return null;
  const low = lowOrder(s);
  const high = highOrder(s);
  return s.low.length === s.high.length
    ? { expr: `(${low[0]} + ${high[0]}) / 2`, result: String(s.median) }
    : { expr: "작은 쪽 꼭대기", result: String(s.median) };
}

/** 걸음 하나를 배열 무대의 걸음으로. */
function arrayStep(s: WalkStep): ArrayStep {
  const asked = s.median !== null;
  return {
    array: [...WALK],
    range: s.n > 0 ? [0, s.n - 1] : null,
    read: s.current === null ? [] : [s.current],
    write: [],
    calc: calcOf(s),
    vars: null,
    layers: [
      heapLayer(
        "작은 쪽 low",
        "최대 힙",
        lowOrder(s),
        lowOrder(s.before),
        asked,
      ),
      heapLayer(
        "큰 쪽 high",
        "최소 힙",
        highOrder(s),
        highOrder(s.before),
        asked,
      ),
    ],
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자 그대로
 * 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는 가이드 시험이 잰다.
 */
export function simStepsFromRef() {
  return {
    medianWalk: walk().map((s) => ({
      title: `${s.id} ${s.did}`,
      text: s.text,
      ...arrayStep(s),
    })),
  };
}

const film = (steps: readonly WalkStep[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.moveBack === null ? s.did : `${s.did} — ${s.branch}`,
    rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
  }));

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

function approaches(): Approach[] {
  const s = scale();
  const [a, b] = ONE_VALUE_CASES as [readonly number[], readonly number[]];
  const na = trueMedian([...a, ONE_VALUE_ADD]);
  const nb = trueMedian([...b, ONE_VALUE_ADD]);
  return [
    {
      name: "물어볼 때마다 전부 정렬하기",
      idea: "넣은 수를 배열 끝에 붙여 두고, 물을 때마다 전부 정렬해 가운데를 읽는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `비교와 칸 쓰기 ${comma(s.sortBound)} 번 이하 · ${seconds(s.sortBound)}`,
          ok: false,
        },
      ],
      lesson:
        "정렬이 만든 순서 가운데 답이 읽는 것은 한두 자리다 — 순서를 처음부터 다시 만들지 않으면 어떨까",
    },
    {
      name: "정렬된 자리에 끼워 넣기",
      idea: "배열을 정렬된 채로 두고, 새 수만 이분 탐색으로 자리를 찾아 끼워 넣는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `실측 ${comma(s.keepSorted)} 번 · ${seconds(s.keepSorted)} — 대부분이 뒤의 값을 한 칸씩 옮긴 칸 쓰기`,
          ok: false,
        },
      ],
      lesson:
        "남은 비용은 가운데가 아닌 자리의 순서를 지키는 일이다 — 가운데 값 하나만 들고 있으면 어떨까",
    },
    {
      name: "중앙값 하나만 들고 있기",
      idea: "지금의 중앙값 하나를 변수에 두고, 새 수가 오면 그 둘로 새 중앙값을 적는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `옛 중앙값 ${trueMedian(a)}${과와(trueMedian(a))} 새 수 ${ONE_VALUE_ADD}${이가(ONE_VALUE_ADD)} 같아도 새 중앙값이 ${na} · ${nb}${으로(nb)} 갈린다`,
          ok: false,
        },
        { label: "시간", value: "넣기 · 묻기 한 번에 칸 하나", ok: null },
      ],
      lesson:
        "가운데 자리가 옮겨 가면 그 옆의 값이 필요하다 — 가운데 둘레의 값을 바로 꺼낼 수 있게 두면 어떨까",
    },
    {
      name: "두 힙",
      idea: "작은 쪽 절반을 최대 힙에, 큰 쪽 절반을 최소 힙에 담고 두 꼭대기로 답한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `비교와 칸 쓰기 ${comma(s.heapBound)} 번 이하 · ${seconds(s.heapBound)}`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 두 힙을 정렬한 수열 위에 ───────────────── */

/** 수열을 다 넣은 뒤의 두 힙과 정렬한 수열. */
function halvesOf(values: readonly number[]): {
  s: number[];
  end: Pair;
  k: number;
} {
  const { adds } = runRecorded(values);
  const end = (adds.at(-1) as (typeof adds)[number]).end;
  return { s: sorted(values), end, k: end.low.length };
}

/** 정렬한 수열 한 줄 + 두 절반의 괄호 — 개념 그림과 불변식 필름이 같이 쓴다. */
function halvesRows(values: readonly number[]): StageRow[] {
  const { s, end, k } = halvesOf(values);
  const low = lowOrder(end);
  const high = highOrder(end);
  const rows: StageRow[] = [
    { kind: "index", label: "정렬한 자리" },
    {
      kind: "cells",
      label: "정렬하면",
      values: s,
      states: {},
    },
    {
      kind: "bracket",
      label: "작은 쪽",
      from: 0,
      to: k - 1,
      tone: "left",
      text: `${k} 칸 · 꼭대기 ${low[0]}`,
    },
  ];
  if (high.length > 0) {
    rows.push({
      kind: "bracket",
      label: "큰 쪽",
      from: k,
      to: s.length - 1,
      tone: "right",
      text: `${high.length} 칸 · 꼭대기 ${high[0]}`,
    });
  }
  return rows;
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-halves": () => {
    const { s, end, k } = halvesOf(WALK);
    const low = lowOrder(end);
    const high = highOrder(end);
    return (
      <RangeCover
        title={`${WALK.join(" · ")}${을를(WALK.at(-1) as number)} 넣은 뒤 — 정렬하면 두 절반이 가운데에서 맞닿는다`}
        row={{ label: "정렬하면", values: s }}
        indexLabel="정렬한 자리"
        ranges={[
          {
            from: 0,
            to: k - 1,
            tone: "left",
            note: `작은 쪽 ${k} 개 · 최댓값 ${low[0]}`,
          },
          {
            from: k,
            to: s.length - 1,
            tone: "right",
            note: `큰 쪽 ${high.length} 개 · 최솟값 ${high[0]}`,
          },
        ]}
        annotation={{
          cells: [k - 1, k],
          text: `두 절반이 맞닿는 두 칸 — 중앙값 ${trueMedian(WALK)}${을를(trueMedian(WALK))} 여기서 읽는다`,
        }}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`호출 ${comma(CALLS)} 번(넣기 ${comma(ADDS)} · 묻기 ${comma(ADDS)}) · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-two-heaps": () => {
    const { end } = halvesOf(WALK);
    const low = lowOrder(end);
    const high = highOrder(end);
    const rows: StageRow[] = [
      ...halvesRows(WALK),
      {
        kind: "cells",
        label: "작은 쪽 low",
        values: low,
        states: { 0: "read" },
        side: "최대 힙 · 꺼낼 차례",
      },
      { kind: "caret", cells: [0], side: "꼭대기" },
      {
        kind: "cells",
        label: "큰 쪽 high",
        values: high,
        states: { 0: "read" },
        side: "최소 힙 · 꺼낼 차례",
      },
      { kind: "caret", cells: [0], side: "꼭대기" },
    ];
    return (
      <CellStage
        title="두 힙 — 정렬한 수열의 앞 절반과 뒤 절반, 첫 칸이 꼭대기"
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "walk-median": () => {
    const steps = walk();
    return (
      <CellStageFilm
        title={`${WALK.join(" · ")}${을를(WALK.at(-1) as number)} 차례로 넣으며 묻는다 — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={WALK.length}
        frames={film(steps)}
      />
    );
  },
  "invariant-boundary": () => {
    const frames: StageFrame[] = WALK.map((_, i) => {
      const values = WALK.slice(0, i + 1);
      const { end, k } = halvesOf(values);
      const low = lowOrder(end);
      const high = highOrder(end);
      const rel =
        high.length === 0
          ? "큰 쪽이 비어 있다"
          : `두 꼭대기 ${low[0]} ≤ ${high[0]}`;
      return {
        id: `N=${i + 1}`,
        text: `작은 쪽 ${k} 칸 · 큰 쪽 ${high.length} 칸 · ${rel}`,
        rows: halvesRows(values),
      };
    });
    return (
      <CellStageFilm
        title="addNum 이 끝날 때마다 — 두 절반의 경계가 정렬한 수열의 가운데에 놓인다"
        columns={WALK.length}
        frames={frames}
      />
    );
  },
};
