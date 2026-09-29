/**
 * `dfsTraversal-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 방문 차례 · 스택 · 구간은 정본과 같은 절차에 기록만 덧붙인
 * 사본(`-guide.proof.ts` 의 `traced`)이 내고, 그 사본은 부를 때마다 자기 답을 정본(`-guide.ref.ts`)과
 * 맞댄다. 시도 사다리의 수는 증명 사이드카가 작은 규모의 실행과 맞대어 확인한 식에서 받는다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `dfsTraversal-guide.test.ts` 가 잰다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 정점 0 에서 두 갈래가 아래로 갈리는 모양을 그대로 두고,
 * 간선이 없는 정점 5 는 오른쪽에 떨어뜨려 둔다.
 */

import type { ReactElement } from "react";
import { 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type EdgeKind,
  type GraphEdge,
  type GraphNode,
  type GraphStrip,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  chain,
  comma,
  type Edge,
  END_STEP,
  ladderNumbers,
  ownerName,
  type Pop,
  SEG_STEP,
  START,
  segments,
  show,
  star,
  stepOf,
  traced,
  WALK,
  WALK_EDGES,
  WALK_N,
} from "./dfsTraversal-guide.proof.ts";
import { dfsWalk } from "./dfsTraversal-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 1, y: 0 },
    { id: 1, x: 0, y: 1 },
    { id: 2, x: 2, y: 1 },
    { id: 3, x: 0, y: 2 },
    { id: 4, x: 2, y: 2 },
    { id: 5, x: 3.3, y: 1 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: false,
};

const rankText = (rank: number): string => `차례 ${rank}`;

/** 간선 번호 — 무향이라 두 방향 어느 쪽으로 물어도 같은 간선이다. */
const edgeIndex = (edges: readonly Edge[], a: number, b: number): number =>
  edges.findIndex(([u, v]) => (u === a && v === b) || (u === b && v === a));

/** 꺼내기 k 까지 정점을 처음 꺼내게 한 간선들 — 그림에서 굵은 실선(`tree`)으로 그린다. */
function treeEdges(pops: readonly Pop[], upTo: number): Set<number> {
  const out = new Set<number>();
  pops.forEach((p, k) => {
    if (k <= upTo && p.fresh && p.owner >= 0)
      out.add(edgeIndex(WALK_EDGES, p.owner, p.node));
  });
  return out;
}

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 실행과, 실행으로 확인한 식에서 ── */

function approaches(): Approach[] {
  const n = ladderNumbers();
  return [
    {
      name: "간선 목록을 고를 때마다 다시 읽기",
      idea: "다음 정점을 고를 때마다 간선 전부를 읽어, 아직 안 간 가장 작은 이웃을 찾는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `사슬 V = ${comma(n.big)} 에서 끝점 읽기 ${comma(n.sweepReads)} 번 · ${n.seconds(n.sweepReads)}`,
          ok: false,
        },
      ],
      lesson:
        "읽은 끝점 대부분이 지금 정점과 상관없었다 — 정점마다 이웃 목록을 한 번 만들어 두자",
    },
    {
      name: "이웃 목록에서 고를 때마다 최솟값 찾기",
      idea: "이웃 목록은 정렬하지 않고, 고를 때마다 목록 전체를 읽어 아직 안 간 최솟값을 찾는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `별 V = ${comma(n.big)} 에서 목록 읽기 ${comma(n.minReads)} 번 · ${n.seconds(n.minReads)}`,
          ok: false,
        },
      ],
      lesson:
        "같은 목록을 고를 때마다 처음부터 다시 읽었다 — 한 번 정렬해 두고 앞에서부터 쓰자",
    },
    {
      name: "정렬한 목록을 작은 번호부터 스택에 넣기",
      idea: "목록을 오름차순으로 정렬하고, 아직 안 쓴 이웃을 스택에 넣어 두었다가 맨 위를 꺼낸다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `네 정점 그래프에서 ${n.wrongGot} — 정본은 ${n.wrongWant}`,
          ok: false,
        },
        {
          label: "시간",
          value: "목록마다 정렬 한 번 · 꺼내기 1 + 2E 번",
          ok: true,
        },
      ],
      lesson:
        "스택은 나중에 넣은 것이 먼저 나온다 — 작은 번호가 맨 위에 오게 거꾸로 넣자",
    },
    {
      name: "정렬한 목록을 큰 번호부터 스택에 넣기",
      idea: "목록을 오름차순으로 정렬하고, 뒤에서 앞으로 스택에 넣어 맨 위가 가장 작은 번호가 되게 한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `별 V = ${comma(n.big)} 에서 목록 읽기와 정렬 비교 ${comma(n.sortedReads)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const TOTAL = WALK.pops.length;
const STACK_SLOTS = Math.max(...WALK.pops.map((p) => p.stack.length), 1);

/** 걸음 하나의 무대. `k` 는 꺼내기 차례이고, −1 은 시작, `TOTAL` 은 끝이다. */
function stage(k: number): GraphStep {
  const p: Pop | undefined = k >= 0 && k < TOTAL ? WALK.pops[k] : undefined;
  const end = k >= TOTAL;
  const order = k < 0 ? [] : end ? WALK.order : (p as Pop).order;
  const nodes = Array.from({ length: WALK_N }, (_, v) => {
    const rank = order.indexOf(v);
    let state: CellState | undefined;
    if (p && v === p.node) state = p.fresh ? "focus" : "read";
    if (rank < 0)
      return end
        ? { value: "", state: "out" as const }
        : { value: "", state: "empty" as const };
    return { value: rankText(rank + 1), ...(state ? { state } : {}) };
  });
  const tree = treeEdges(WALK.pops, end ? TOTAL : k);
  const here = p && p.owner >= 0 ? edgeIndex(WALK_EDGES, p.owner, p.node) : -1;
  const edges = WALK_EDGES.map((_, i) => {
    const kind: EdgeKind | undefined = tree.has(i) ? "tree" : undefined;
    const state: GraphEdge["state"] =
      i === here ? ((p as Pop).fresh ? "focus" : "read") : undefined;
    return { ...(kind ? { kind } : {}), ...(state ? { state } : {}) };
  });
  const stackValues =
    k < 0 ? [START] : end ? [] : (p as Pop).stack.map((it) => it.v);
  const stackStates: Partial<Record<number, CellState>> = {};
  if (k < 0) stackStates[0] = "focus";
  else if (p?.fresh) {
    for (let i = 0; i < p.pushed.length; i++)
      stackStates[stackValues.length - 1 - i] = "focus";
  }
  const orderStates: Partial<Record<number, CellState>> = {};
  if (p?.fresh) orderStates[order.length - 1] = "focus";
  const calc: GraphStep["calc"] =
    k < 0
      ? { expr: "stack =", result: show([START]) }
      : end
        ? { expr: "stack.length > 0 →", result: "거짓" }
        : {
            expr: `visited[${(p as Pop).node}] →`,
            result: (p as Pop).fresh ? "거짓" : "참",
          };
  const strips: GraphStrip[] = [
    {
      label: "스택",
      values: stackValues,
      states: stackStates,
      slots: STACK_SLOTS,
    },
    {
      label: "order",
      values: [...order],
      states: orderStates,
      slots: WALK.order.length,
    },
  ];
  return {
    nodes,
    edges,
    strips,
    calc,
    vars: `꺼내기 ${k < 0 ? 0 : Math.min(k + 1, TOTAL)} / ${TOTAL}`,
  };
}

function stepTitle(k: number): string {
  if (k < 0) return `T1 시작 정점 ${START}${을를(START)} 스택에 넣는다`;
  if (k >= TOTAL) return `${END_STEP} 스택이 비어 끝난다`;
  const p = WALK.pops[k] as Pop;
  return `${stepOf(k)} 정점 ${p.node}${을를(p.node)} 꺼낸다 — ${p.fresh ? "처음 꺼낸다" : "이미 결과에 있다"}`;
}

/** 조사를 고를 때 읽는 앞말 — 닫는 괄호는 소리가 없으니 떼고 마지막 수를 읽는다. */
const said = (t: string): string => t.replace(/[\]})]+$/, "");

function stepText(k: number): string {
  if (k < 0)
    return `스택에 시작 정점 ${START} 하나만 넣습니다. 결과 배열은 비어 있고, 방문 표시는 꺼낼 때 합니다.`;
  if (k >= TOTAL) {
    const out = Array.from({ length: WALK_N }, (_, v) => v).filter(
      (v) => !WALK.order.includes(v),
    );
    return `스택이 비어 반복이 끝납니다. 스택에 한 번도 안 들어간 정점 ${out.join(" · ")} 는 결과에 없고, 반환값은 ${show(WALK.order)} 입니다.`;
  }
  const p = WALK.pops[k] as Pop;
  const from =
    p.owner < 0 ? "시작 정점" : `정점 ${p.owner}${이가(p.owner)} 넣은 정점`;
  const list = show(WALK.adj[p.node] as number[]);
  return p.fresh
    ? `${from} ${p.node}${을를(p.node)} 처음 꺼냈습니다. 결과에 넣고, 이웃 목록 ${list}${을를(said(list))} 큰 번호부터 스택에 넣습니다.`
    : `${from} ${p.node}${은는(p.node)} 이미 결과에 있습니다. 아무것도 넣지 않고 버립니다.`;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return Array.from({ length: TOTAL + 2 }, (_, i) => i - 1).map((k) => ({
    title: stepTitle(k),
    text: stepText(k),
    ...stage(k),
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

/* ── 정적 그림들 ── */

/** 전개 입력 위의 방문 차례 — 정점 안의 수는 결과에서의 자리, 굵은 실선은 처음 꺼내게 한 간선. */
function conceptOrder(): ReactElement {
  const tree = treeEdges(WALK.pops, TOTAL);
  return (
    <NodeGraph
      title="전개 입력 — 정점 안의 수는 처음 방문한 차례"
      directed={false}
      nodes={LAYOUT.nodes.map((n) => {
        const rank = WALK.order.indexOf(n.id);
        return rank < 0
          ? { ...n, value: "결과에 없음", state: "out" as const }
          : { ...n, value: rankText(rank + 1) };
      })}
      edges={WALK_EDGES.map(([from, to], i) => ({
        from,
        to,
        ...(tree.has(i) ? { kind: "tree" as const } : {}),
      }))}
      strips={[{ label: "방문 순서", values: [...WALK.order] }]}
    />
  );
}

/** 먼저 알아 둘 개념 — 한 시점의 스택을 넣은 정점별 구간으로 끊어 그래프 아래에 쌓는다. */
function buildSegments(): ReactElement {
  const p = WALK.pops[SEG_STEP] as Pop;
  const segs = segments(p.stack);
  const topOwner = segs.at(-1)?.owner;
  const owners = new Set(segs.map((s) => s.owner));
  return (
    <NodeGraph
      title={`${stepOf(SEG_STEP)} 직후 — 넣은 정점별 구간으로 끊은 스택, 위 띠가 맨 위 구간`}
      directed={false}
      nodes={LAYOUT.nodes.map((n) => {
        const rank = p.order.indexOf(n.id);
        const state: CellState | undefined =
          n.id === topOwner ? "focus" : owners.has(n.id) ? "read" : undefined;
        if (rank < 0) return { ...n, value: "", state: "empty" as const };
        return { ...n, value: rankText(rank + 1), ...(state ? { state } : {}) };
      })}
      edges={WALK_EDGES.map(([from, to]) => {
        const seg = segs.find(
          (s) =>
            (s.owner === from && s.values.includes(to)) ||
            (s.owner === to && s.values.includes(from)),
        );
        return {
          from,
          to,
          ...(seg
            ? {
                state:
                  seg.owner === topOwner
                    ? ("focus" as const)
                    : ("read" as const),
              }
            : {}),
        };
      })}
      strips={[...segs].reverse().map((s, i) => ({
        label: `${i === 0 ? "맨 위 · " : ""}${ownerName(s.owner)}${이가(s.owner)} 넣은 구간`,
        values: s.values,
      }))}
    />
  );
}

/** 최악을 만드는 두 모양을 정점 여섯으로 줄여 — 정점 안의 수는 깊이, 띠는 스택이 가장 컸을 때. */
function worstShapes(): ReactElement {
  const v = 6;
  const s = traced(v, star(v), 0);
  const c = traced(v, chain(v), 0);
  const peak = (run: ReturnType<typeof traced>) =>
    run.pops.reduce(
      (best, p) =>
        p.stack.length > best.length ? p.stack.map((i) => i.v) : best,
      [] as number[],
    );
  const around = [
    { x: 1, y: 0.75 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1.5 },
    { x: 2, y: 1.5 },
  ];
  const nodes: GraphNode[] = [
    ...s.depth.map((d, i) => ({
      id: `s${i}`,
      label: String(i),
      ...(around[i] as { x: number; y: number }),
      value: `깊이 ${d}`,
    })),
    ...c.depth.map((d, i) => ({
      id: `c${i}`,
      label: String(i),
      x: i,
      y: 3.2,
      value: `깊이 ${d}`,
    })),
  ];
  const edges: GraphEdge[] = [
    ...star(v).map(([a, b]) => ({ from: `s${a}`, to: `s${b}` })),
    ...chain(v).map(([a, b]) => ({ from: `c${a}`, to: `c${b}` })),
  ];
  return (
    <NodeGraph
      title="정점 여섯으로 줄여 그린 두 모양 — 정점 안의 수는 결과에 넣을 때의 깊이"
      directed={false}
      nodes={nodes}
      edges={edges}
      groups={[
        { members: nodes.slice(0, v).map((n) => n.id), label: "별 모양" },
        { members: nodes.slice(v).map((n) => n.id), label: "사슬" },
      ]}
      strips={[
        { label: "별 모양 · 스택이 가장 클 때", values: peak(s) },
        { label: "사슬 · 스택이 가장 클 때", values: peak(c) },
      ]}
    />
  );
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-order": conceptOrder,
  "origin-approaches": () => {
    const steps = approaches();
    const n = ladderNumbers();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`규모 V = E = ${comma(n.big)} · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-segments": buildSegments,
  "walk-dfs": () => <Film spec={dfsWalk as unknown as PlayerSpec} />,
  "worst-shapes": worstShapes,
};
