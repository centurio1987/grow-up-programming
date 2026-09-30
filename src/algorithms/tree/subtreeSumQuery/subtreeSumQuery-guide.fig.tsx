/**
 * `subtreeSumQuery-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 들어간 자리 `tin` · 끝 자리 `tout` · 기저 배열 · 펜윅
 * 트리의 칸 · 걸음마다의 스택과 답은 정본과 같은 절차에 걸음 기록만 덧붙인 사본(`-guide.proof.ts`
 * 의 `RUN` · `WALK`)이 내고, 그 사본은 파일을 읽을 때 자기 답을 정본(`-guide.ref.ts`)과 맞댄다. 시도
 * 사다리의 수는 같은 파일의 세는 사본들이 낸다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `subtreeSumQuery-guide.test.ts` 가 잰다.
 *
 * **무대는 「그래프」다**(`stage: "graph"`). 전하려는 것이 「트리를 한 번 돌며 들어간 자리와 끝 자리를
 * 매기면, 부분트리가 기저 배열의 한 구간이 된다」라서, 트리 위의 정점과 그 정점이 받은 자리가 함께
 * 보여야 한다. 이웃 편 `heavyLightDecomposition` 과 같이 뿌리 0 에서 매단 트리를 `treeLayout` 으로
 * 놓고, 무대 아래 띠를 두 무리로 적는다 — 위 넷(정점 v · tin · tout · 스택)은 칸 차례가 **정점
 * 번호**이고, 그 아래 셋(자리 p · 그 자리의 정점 · 펜윅 트리)은 칸 차례가 **자리 번호**다. 펜윅 트리의
 * 칸 `k` 는 자리 `[k − (k & −k), k − 1]` 을 맡으므로 그 오른쪽 끝 자리 `k − 1` 아래에 적는다. 맨 아래가
 * 답 목록이다.
 *
 * 정점 안의 값은 그 정점의 지금 값(「값 5」)이고 끝까지 뜻을 바꾸지 않는다 — 갱신이 바꾸는 것이 이
 * 값이다. 간선에 방향이 없으므로 `directed: false` 다.
 */

import type { ReactElement } from "react";
import { 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type GraphEdge,
  type GraphStrip,
  NodeGraph,
  NodeGraphFilm,
  type NodeId,
  treeLayout,
} from "../../../_viz/patterns/NodeGraph";
import { type Range, RangeCover } from "../../../_viz/patterns/RangeCover";
import type { GraphLayout, GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  AT,
  allSubtrees,
  BASE,
  binary,
  breadthPositions,
  byWalking,
  CANDIDATES,
  candidateCells,
  chain,
  comma,
  isContiguous,
  list,
  type OpStep,
  RUN,
  SHAPE_N,
  SHAPE_ROUNDS,
  SUBS,
  span,
  stepDoing,
  stepMarks,
  stepOf,
  vals,
  WALK,
  WALK_EDGES,
  WALK_N,
  WALK_OPS,
  WALK_ROOT,
  WALK_VALUES,
  type WalkStep,
} from "./subtreeSumQuery-guide.proof.ts";
import { subtreeWalk } from "./subtreeSumQuery-guide.sim.ts";

const IDS = [...Array(WALK_N).keys()];
const PARENT: number[] = (() => {
  const p = IDS.map(() => -1);
  // 들어간 걸음의 부모가 곧 트리의 부모다.
  for (const s of WALK) {
    if (s.kind === "enter" && s.from !== null) p[s.v] = s.from;
  }
  return p;
})();

/** 뿌리 0 에서 매단 트리의 자리. 자식은 들어간 차례대로 왼쪽부터 놓는다. */
function place(): { id: number; x: number; y: number }[] {
  const children = new Map<NodeId, number[]>();
  for (const v of IDS) {
    children.set(
      v,
      IDS.filter((c) => PARENT[c] === v).sort(
        (a, b) => (RUN.tin[a] as number) - (RUN.tin[b] as number),
      ),
    );
  }
  const xy = treeLayout([WALK_ROOT], children);
  return IDS.map((v) => {
    const p = xy.get(v) as { x: number; y: number };
    return { id: v, x: p.x, y: p.y };
  });
}

/** 입력 트리의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT: GraphLayout = {
  nodes: place(),
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: false,
};

/** 간선 `e` 의 아래쪽(자식) 끝. */
const childOf = (e: number): number => {
  const [a, b] = WALK_EDGES[e] as [number, number];
  return PARENT[b] === a ? b : a;
};

/** 정점 `x` 와 `y` 를 잇는 간선의 차례. 없으면 -1. */
const edgeOf = (x: number, y: number): number =>
  WALK_EDGES.findIndex(
    ([a, b]) => (a === x && b === y) || (a === y && b === x),
  );

const MAX_STACK = Math.max(...WALK.map((s) => s.stack.length));
const QUERIES = WALK_OPS.filter((o) => o.kind === "query").length;

/** 띠 한 줄 — 아직 안 정한 칸(`-1` · `null`)은 점선으로 둔다. */
function strip(
  label: string,
  values: readonly (number | null)[],
  marks: Partial<Record<number, CellState>> = {},
): GraphStrip {
  const states: Partial<Record<number, CellState>> = {};
  values.forEach((x, i) => {
    if (x === null || x < 0) states[i] = "empty";
  });
  for (const [k, st] of Object.entries(marks)) states[Number(k)] = st;
  return {
    label,
    values: values.map((x) => (x === null || x < 0 ? "" : String(x))),
    states,
  };
}

interface Marks {
  tin?: Partial<Record<number, CellState>>;
  tout?: Partial<Record<number, CellState>>;
  stack?: Partial<Record<number, CellState>>;
  seat?: Partial<Record<number, CellState>>;
  tree?: Partial<Record<number, CellState>>;
  answer?: boolean;
}

/** 무대 아래 띠 — 정점 번호 무리 넷, 자리 번호 무리 셋, 답 목록. */
function strips(s: WalkStep, m: Marks): GraphStrip[] {
  const seats: (number | null)[] = IDS.map((p) => {
    const v = s.tin.indexOf(p);
    return v < 0 ? null : v;
  });
  const answerStates: Partial<Record<number, CellState>> = {};
  if (m.answer) answerStates[s.answers.length - 1] = "focus";
  return [
    { label: "정점 v", values: IDS },
    strip("tin", s.tin, m.tin),
    strip("tout", s.tout, m.tout),
    {
      label: "스택",
      values: [...s.stack],
      states: m.stack ?? {},
      slots: MAX_STACK,
    },
    { label: "자리 p", values: IDS },
    strip("그 자리의 정점", seats, m.seat),
    strip(
      "펜윅 트리 칸 p + 1",
      s.tree === null ? IDS.map(() => null) : s.tree.slice(1),
      m.tree,
    ),
    {
      label: "답 목록",
      values: [...s.answers],
      states: answerStates,
      slots: QUERIES,
    },
  ];
}

/** 걸음 하나의 무대. */
function stage(i: number): GraphStep {
  const s = WALK[i] as WalkStep;
  const nodeState: Partial<Record<number, CellState>> = {};
  const edgeState: Partial<Record<number, GraphEdge["state"]>> = {};
  const m: Marks = {};
  const entered = (v: number) => (s.tin[v] as number) >= 0;

  if (s.kind === "prep") {
    for (const v of IDS) nodeState[v] = "empty";
    for (const e of WALK_EDGES.keys()) edgeState[e] = "out";
  } else if (s.kind === "enter" || s.kind === "exit") {
    for (const v of IDS) if (!entered(v)) nodeState[v] = "empty";
    for (const e of WALK_EDGES.keys()) {
      if (!entered(childOf(e))) edgeState[e] = "out";
    }
    for (const [v, w] of s.skipped) {
      const e = edgeOf(v, w);
      if (e >= 0) edgeState[e] = "read";
    }
    nodeState[s.v] = "focus";
    if (s.kind === "enter") {
      if (s.from !== null) edgeState[edgeOf(s.from, s.v)] = "focus";
      m.tin = { [s.v]: "focus" };
      m.stack = { [s.stack.length - 1]: "focus" };
      m.seat = { [s.tin[s.v] as number]: "focus" };
    } else {
      m.tout = { [s.v]: "focus" };
      m.tin = { [s.v]: "read" };
    }
  } else if (s.kind === "build") {
    m.tree = Object.fromEntries(IDS.map((p) => [p, "focus"]));
    m.seat = Object.fromEntries(IDS.map((p) => [p, "read"]));
  } else if (s.kind === "update") {
    const log = s.log as OpStep;
    nodeState[s.v] = "focus";
    m.tin = { [s.v]: "read" };
    m.seat = { [log.span[0]]: "read" };
    m.tree = Object.fromEntries(log.hiPath.map((k) => [k - 1, "focus"]));
  } else {
    const log = s.log as OpStep;
    const sub = new Set(SUBS[s.v] as number[]);
    for (const v of IDS) nodeState[v] = sub.has(v) ? "read" : "out";
    for (const [e, [a, b]] of WALK_EDGES.entries()) {
      if (!(sub.has(a) && sub.has(b))) edgeState[e] = "out";
    }
    m.tin = { [s.v]: "read" };
    m.tout = { [s.v]: "read" };
    const seat: Partial<Record<number, CellState>> = {};
    for (const p of IDS) {
      seat[p] = p >= log.span[0] && p <= log.span[1] ? "read" : "out";
    }
    m.seat = seat;
    m.tree = Object.fromEntries(
      [...log.hiPath, ...log.loPath].map((k) => [k - 1, "read"]),
    );
    m.answer = true;
  }

  return {
    nodes: IDS.map((v) => {
      const st = nodeState[v];
      return { value: `값 ${s.values[v]}`, ...(st ? { state: st } : {}) };
    }),
    edges: WALK_EDGES.map((_, e) => {
      const st = edgeState[e];
      return st ? { state: st } : {};
    }),
    strips: strips(s, m),
    calc: stageCalc(s),
    vars:
      s.op === undefined
        ? `timer = ${s.timer}`
        : `연산 ${s.op + 1} / ${WALK_OPS.length}`,
  };
}

function stageCalc(s: WalkStep): GraphStep["calc"] {
  if (s.kind === "prep") {
    return {
      expr: "near 목록 길이의 합 =",
      result: `${2 * WALK_EDGES.length} = 간선 ${WALK_EDGES.length} 개 × 2`,
    };
  }
  if (s.kind === "enter") {
    const p = s.tin[s.v] as number;
    return { expr: `tin[${s.v}] = timer =`, result: `${p} → timer ${s.timer}` };
  }
  if (s.kind === "exit") {
    return {
      expr: `tout[${s.v}] = timer − 1 =`,
      result: `${s.timer} − 1 = ${s.tout[s.v]}`,
    };
  }
  if (s.kind === "build") {
    return { expr: "기저 배열 =", result: list(BASE) };
  }
  const log = s.log as OpStep;
  if (s.kind === "update") {
    return {
      expr: `delta = ${log.value} − ${log.before} =`,
      result: `${log.delta} → ${log.hiPath.map((k) => `칸 ${k}`).join(" · ")}`,
    };
  }
  return {
    expr: `prefix(${log.span[1]}) − prefix(${log.span[0] - 1}) =`,
    result: `${log.hiSum} − ${log.loSum} = ${log.answer}`,
  };
}

function stepTitle(i: number): string {
  return `${stepOf(i)} ${stepDoing(i)} ${stepMarks(i).join(" ")}`;
}

function stepText(i: number): string {
  const s = WALK[i] as WalkStep;
  if (s.kind === "prep") {
    return `간선 ${WALK_EDGES.length} 개를 양쪽 정점의 이웃 목록에 한 번씩 넣고, tin · tout 을 비워 둔 채 값을 복사했습니다. 아직 어느 정점에도 들어가지 않아 정점을 점선으로, 간선을 흐리게 그립니다.`;
  }
  const skipped =
    s.skipped.length === 0
      ? ""
      : `이웃 목록에서 ${s.skipped.map(([, w]) => w).join(" · ")}${을를(s.skipped.at(-1)?.[1] ?? 0)} 먼저 읽었는데 이미 자리를 받은 부모라 건너뛰었습니다. `;
  if (s.kind === "enter") {
    const p = s.tin[s.v] as number;
    if (s.from === null) {
      return `뿌리 ${s.v} 에 들어가 첫 자리 ${p}${을를(p)} 주고 스택에 담았습니다. timer 는 다음에 줄 자리 ${s.timer}${을를(s.timer)} 가리킵니다.`;
    }
    return `${skipped}정점 ${s.from} 의 이웃 ${s.v}${이가(s.v)} 아직 자리가 없어 자리 ${p}${을를(p)} 주고 스택에 담았습니다.`;
  }
  if (s.kind === "exit") {
    const q = s.tout[s.v] as number;
    return `${skipped}정점 ${s.v} 의 이웃을 다 읽었습니다. 그사이 자리를 받은 정점은 모두 이 정점의 자손이라, 마지막으로 준 자리 ${q}${이가(q)} 끝 자리가 됩니다. 구간 ${span(s.tin[s.v] as number, q)}${이가(q)} 이 정점의 부분트리입니다.`;
  }
  if (s.kind === "build") {
    return `자리 p 에 앉은 정점의 값을 펜윅 트리 칸 p + 1 에 적고, 칸마다 다음 칸에 한 번씩 더해 펜윅 트리를 세웠습니다. 준비는 여기서 끝나고, 트리를 다시 순회하지 않습니다.`;
  }
  const log = s.log as OpStep;
  if (s.kind === "update") {
    return `정점 ${log.node} 의 값을 ${log.before} 에서 ${log.value}${으로(log.value as number)} 바꿨습니다. 펜윅 트리는 더하기만 받으므로 차이 ${log.delta}${을를(log.delta)} 자리 ${log.span[0]}${을를(log.span[0])} 맡는 칸 ${log.hiPath.length} 개에 더합니다. tin · tout 은 그대로입니다.`;
  }
  return `정점 ${log.node} 의 부분트리는 자리 ${span(log.span[0], log.span[1])} 입니다. 끝 자리까지의 합 ${log.hiSum} 에서 시작 앞까지의 합 ${log.loSum}${을를(log.loSum)} 빼 답 ${log.answer}${을를(log.answer as number)} 냅니다. 트리를 순회하지 않고 펜윅 트리 칸 ${log.hiPath.length + log.loPath.length} 개만 읽었습니다.`;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): ({
  title: string;
  text: string;
} & GraphStep)[] {
  return WALK.map((_, i) => ({
    title: stepTitle(i),
    text: stepText(i),
    ...stage(i),
  }));
}

/** 걸음 재생 패널의 정적 그림 — 패널과 같은 무대를 걸음마다 한 장씩. */
function Film({ spec }: { spec: PlayerSpec }) {
  return (
    <NodeGraphFilm
      title={spec.title}
      frames={playerFrames(spec).map((f) => ({
        id: f.id,
        text: f.calc ? `${f.title} · ${f.calc.expr} ${f.calc.result}` : f.title,
        scene: f.scene ?? { nodes: [], edges: [] },
      }))}
    />
  );
}

/* ── 정적 그림 — 걸음 재생 패널 밖 ── */

const LAYOUT_EDGES = WALK_EDGES.map(([from, to]) => ({ from, to }));

/** `concept` — 전개 입력. 정점 안은 그 정점의 값. */
function conceptTree(): ReactElement {
  return (
    <NodeGraph
      title={`이 글이 끝까지 쓰는 트리 — 정점 ${WALK_N} · 간선 ${WALK_EDGES.length} · 뿌리 ${WALK_ROOT}, 정점 안은 그 정점의 값`}
      directed={false}
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: `값 ${WALK_VALUES[n.id as number]}`,
      }))}
      edges={LAYOUT_EDGES}
    />
  );
}

/** 정점 `x` 의 부분트리를 트리와 자리 띠에 함께 칠한 그림. */
function subtreeOnStrip(x: number, title: string): ReactElement {
  const sub = new Set(SUBS[x] as number[]);
  const a = RUN.tin[x] as number;
  const b = RUN.tout[x] as number;
  const mark = (): Partial<Record<number, CellState>> => {
    const st: Partial<Record<number, CellState>> = {};
    for (const p of IDS) st[p] = p >= a && p <= b ? "read" : "out";
    st[a] = "focus";
    return st;
  };
  return (
    <NodeGraph
      title={title}
      directed={false}
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: span(
          RUN.tin[n.id as number] as number,
          RUN.tout[n.id as number] as number,
        ),
        ...(n.id === x
          ? { state: "focus" as const }
          : sub.has(n.id as number)
            ? { state: "read" as const }
            : { state: "out" as const }),
      }))}
      edges={LAYOUT_EDGES.map((e) => ({
        ...e,
        ...(sub.has(e.from) && sub.has(e.to)
          ? { state: "focus" as const }
          : {}),
      }))}
      strips={[
        { label: "자리 p", values: IDS },
        { label: "그 자리의 정점", values: AT, states: mark() },
        { label: "기저 배열", values: BASE, states: mark() },
      ]}
    />
  );
}

/** `concept` — 정점 1 의 부분트리가 기저 배열의 한 구간이다. */
function conceptFlat(): ReactElement {
  const x = 1;
  const a = RUN.tin[x] as number;
  const b = RUN.tout[x] as number;
  const sub = [...(SUBS[x] as number[])].sort((p, q) => p - q);
  const sum = BASE.slice(a, b + 1).reduce((s, v) => s + v, 0);
  return subtreeOnStrip(
    x,
    `정점 안은 [tin,tout] — 정점 ${x} 의 부분트리 ${sub.join(" · ")}${이가(sub.at(-1) as number)} 기저 배열의 자리 ${span(a, b)}${을를(b)} 차지하고, 그 합이 ${sum} 이다`,
  );
}

/** `deep.origin` — 시도 사다리. */
function approaches(): Approach[] {
  const V = 100_000;
  const per = byWalking(V, chain(V), 0, vals(V), [
    { kind: "query", node: 0 },
  ]).ops;
  const n = 1_023;
  const e = binary(n);
  const subs = allSubtrees(n, e, 0);
  const bfs = breadthPositions(n, e, 0);
  const okB = subs.filter((s) => isContiguous(bfs, s)).length;
  const cells = CANDIDATES.map(([label, run]) => ({
    label,
    ...candidateCells(run),
  }));
  const line = cells[0] as (typeof cells)[number];
  const pre = cells[1] as (typeof cells)[number];
  const fen = cells[2] as (typeof cells)[number];
  return [
    {
      name: "질의마다 부분트리 다시 순회하기",
      idea: "질의를 받으면 그 정점에서 아래로 순회하며 값을 더한다",
      verdict: "drop",
      checks: [
        { label: "준비", value: "부모만", ok: true },
        {
          label: "시간",
          value: `사슬 ${comma(V)} 정점 · 질의 ${comma(V)} 개에서 배열 칸 ${comma(per * V)}`,
          ok: false,
        },
      ],
      lesson:
        "부분트리 모음은 안 바뀌니, 배열의 이어진 자리에 한 번 늘어놓으면 된다",
    },
    {
      name: "너비 우선으로 자리 매기기",
      idea: "뿌리에서 층마다 차례로 자리를 주고, 부분트리를 그 자리들의 합으로 낸다",
      verdict: "drop",
      checks: [
        {
          label: "구간",
          value: `완전 이진 트리 ${comma(n)} 정점에서 부분트리가 이어진 정점 ${comma(okB)} 개`,
          ok: false,
        },
      ],
      lesson:
        "한 정점의 자손을 다 끝내고 다음 형제로 가는 차례라야 부분트리가 이어진다",
    },
    {
      name: "들어간 차례로 편 뒤 구간을 매번 다 더하기",
      idea: "깊이 우선으로 들어간 차례대로 자리를 주고, 질의마다 구간을 처음부터 더한다",
      verdict: "drop",
      checks: [
        { label: "구간", value: "모든 부분트리가 구간 하나", ok: true },
        {
          label: "질의",
          value: `사슬 ${comma(SHAPE_N)} 정점 · 질의 ${comma(SHAPE_ROUNDS)} 번에 배열 칸 ${comma(line.queries)}`,
          ok: false,
        },
      ],
      lesson: "구간 합을 구간 길이와 상관없이 답하는 구조가 필요하다",
    },
    {
      name: "앞에서부터의 합 배열",
      idea: "자리마다 그 앞까지의 합을 적어 두고, 구간 합을 칸 둘의 차로 낸다",
      verdict: "drop",
      checks: [
        {
          label: "질의",
          value: `질의 ${comma(SHAPE_ROUNDS)} 번에 배열 칸 ${comma(pre.queries)}`,
          ok: true,
        },
        {
          label: "갱신",
          value: `갱신 ${comma(SHAPE_ROUNDS)} 번에 배열 칸 ${comma(pre.updates)}`,
          ok: false,
        },
      ],
      lesson: "갱신과 질의를 둘 다 로그 번의 칸으로 받아야 한다",
    },
    {
      name: "오일러 투어와 펜윅 트리",
      idea: "들어간 차례로 편 기저 배열 위에 펜윅 트리를 세운다",
      verdict: "keep",
      checks: [
        {
          label: "둘 다",
          value: `같은 두 목록에서 갱신 ${comma(fen.updates)} · 질의 ${comma(fen.queries)}`,
          ok: true,
        },
      ],
    },
  ];
}

/** `deep.build` (b) — 정점 여섯의 구간 전부를 자리 띠 위에 놓는다. */
function buildEuler(): ReactElement {
  const order = [...IDS].sort(
    (a, b) =>
      (RUN.tout[b] as number) -
        (RUN.tin[b] as number) -
        ((RUN.tout[a] as number) - (RUN.tin[a] as number)) ||
      (RUN.tin[a] as number) - (RUN.tin[b] as number),
  );
  const ranges: Range[] = order.map((v) => ({
    from: RUN.tin[v] as number,
    to: RUN.tout[v] as number,
    tone: "query",
    note: `정점 ${v} · [tin,tout] = ${span(RUN.tin[v] as number, RUN.tout[v] as number)}`,
  }));
  return (
    <RangeCover
      title="정점마다의 구간 [tin,tout] — 괄호 하나가 그 정점의 부분트리가 차지하는 자리다"
      indexLabel="자리 p"
      row={{ label: "그 자리의 정점", values: AT }}
      ranges={ranges}
    />
  );
}

/** `deep.build` (c) — 정점 2 하나를 번호에서 자리와 값까지 따라 읽는다. */
function buildRead(): ReactElement {
  const x = 2;
  const a = RUN.tin[x] as number;
  const b = RUN.tout[x] as number;
  return subtreeOnStrip(
    x,
    `정점 ${x} 읽기 — tin[${x}] = ${a} · tout[${x}] = ${b} 라 자리 ${span(a, b)}${이가(b)} 부분트리이고, 그 자리의 정점은 ${AT.slice(a, b + 1).join(" · ")}, 값의 합은 ${BASE.slice(a, b + 1).reduce((s, v) => s + v, 0)} 이다`,
  );
}

/** `related` — 들어감을 여는 괄호, 나옴을 닫는 괄호로 적은 사건 줄. */
function relatedParens(): ReactElement {
  const events = RUN.walk.filter((e) => e.kind !== "건너뜀");
  const labels = events.map((e) =>
    e.kind === "자리" ? `${e.w ?? e.v}(` : `${e.v})`,
  );
  const openAt = new Map<number, number>();
  const closeAt = new Map<number, number>();
  events.forEach((e, i) => {
    if (e.kind === "자리") openAt.set(e.w ?? e.v, i);
    else closeAt.set(e.v, i);
  });
  const ranges: Range[] = [...IDS]
    .sort(
      (a, b) =>
        (closeAt.get(b) as number) -
          (openAt.get(b) as number) -
          ((closeAt.get(a) as number) - (openAt.get(a) as number)) ||
        (openAt.get(a) as number) - (openAt.get(b) as number),
    )
    .map((v) => ({
      from: openAt.get(v) as number,
      to: closeAt.get(v) as number,
      tone: "query" as const,
      note: `정점 ${v}`,
    }));
  return (
    <RangeCover
      title="들어감을 여는 괄호, 나옴을 닫는 괄호로 적은 사건 줄 — 두 괄호 짝은 포개지거나 떨어져 있다"
      indexLabel="사건 차례"
      row={{ label: "사건", values: labels }}
      ranges={ranges}
    />
  );
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-tree": conceptTree,
  "concept-flat": conceptFlat,
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 다섯 — 넷은 버렸고 하나가 남았다"
        constraint={`규모 N ≤ ${comma(100_000)} · 연산 ≤ ${comma(100_000)} · 1 초에 배열 칸 1 억 개`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-euler": buildEuler,
  "build-read": buildRead,
  "walk-film": () => <Film spec={subtreeWalk as unknown as PlayerSpec} />,
  "related-parens": relatedParens,
};

/** 원고가 쓰는 반환값 문자열 — 패널의 `result` 와 같다. */
export const WALK_RESULT = list(RUN.answers);
