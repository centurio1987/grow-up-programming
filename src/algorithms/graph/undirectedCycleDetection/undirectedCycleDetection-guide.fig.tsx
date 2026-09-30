/**
 * `undirectedCycleDetection-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 표시 · 부모 · 스택 · from · 나무 간선은 정본과 같은 절차에
 * 기록만 덧붙인 사본(`-guide.proof.ts` 의 `traced`)이 내고, 그 사본은 부를 때마다 자기 답을 정본
 * (`-guide.ref.ts`)과 맞댄다. 시도 사다리의 수도 증명 사이드카가 실행해서 낸 값을 받는다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `undirectedCycleDetection-guide.test.ts` 가 잰다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 한 줄 0 · 1 · 2 를 왼쪽에 가로로, 삼각형 3 · 4 · 5 를
 * 오른쪽에 둔다. 부모는 정점 안의 값(「부모 3」)으로 적는다 — 칸 상태(새로 씀 · 읽음)는 걸음의 강조가
 * 쓰므로 부모를 상태로 칠하지 않는다. 간선에 방향이 없으므로 `directed: false` 다.
 */

import type { ReactElement } from "react";
import { 은는, 을를 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type EdgeKind,
  type GraphEdge,
  type GraphGroup,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import { type GraphStep, graphScene } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  comma,
  edgeName,
  foundStep,
  ladderNumbers,
  MOMENT,
  NO_PARENT,
  type Step,
  show,
  stepOf,
  WALK,
  WALK_EDGES,
  walkCycle,
  walkTreeEdges,
} from "./undirectedCycleDetection-guide.proof.ts";
import { undirectedWalk } from "./undirectedCycleDetection-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 0, y: 0.6 },
    { id: 1, x: 1, y: 0.6 },
    { id: 2, x: 2, y: 0.6 },
    { id: 3, x: 3.6, y: 0 },
    { id: 4, x: 3.1, y: 1.2 },
    { id: 5, x: 4.1, y: 1.2 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: false,
};

const TWO_E = 2 * WALK_EDGES.length;

/** 정점 안의 값 한 줄 — 부모. 표시하지 않은 정점은 비운다. */
const nodeValue = (s: Step, v: number): string => {
  const p = s.par[v] ?? null;
  if (p === null) return "";
  return p === NO_PARENT ? "부모 없음" : `부모 ${p}`;
};

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const STACK_SLOTS = Math.max(...WALK.steps.map((s) => s.stack.length), 1);

/** 걸음 하나의 무대. `k` 는 기록의 걸음 차례다. */
function stage(k: number): GraphStep {
  const s = WALK.steps[k] as Step;
  const tree = new Set(s.treeEdge.filter((e) => e >= 0));
  const found = foundStep(WALK);
  const closing =
    found >= 0 && found <= k ? (WALK.steps[found] as Step).edge : -1;
  const nodes = s.visited.map((b, v) => {
    let state: CellState | undefined;
    if (s.kind === "start" && v === s.u) state = "focus";
    else if (s.kind === "mark" && v === s.v) state = "focus";
    else if (s.kind !== "start" && (v === s.u || v === s.v)) state = "read";
    else if (!b) state = "empty";
    return { value: nodeValue(s, v), ...(state ? { state } : {}) };
  });
  const edges = WALK_EDGES.map((_, i) => {
    const kind: EdgeKind | undefined = tree.has(i)
      ? "tree"
      : i === closing
        ? "back"
        : undefined;
    let state: GraphEdge["state"];
    if (i === s.edge) state = s.kind === "skip" ? "read" : "focus";
    else if (kind === undefined) state = "out";
    return { ...(kind ? { kind } : {}), ...(state ? { state } : {}) };
  });
  const pushed: Partial<Record<number, CellState>> = {};
  if (s.kind === "start" || s.kind === "mark") {
    pushed[s.stack.length - 1] = "focus";
  }
  const calc: GraphStep["calc"] =
    s.kind === "start"
      ? { expr: `visited[${s.u}] →`, result: "거짓 · 시작한다" }
      : s.kind === "skip"
        ? { expr: `${s.v} === parent(${s.parent}) →`, result: "참" }
        : { expr: `visited[${s.v}] →`, result: s.seen ? "참" : "거짓" };
  return {
    nodes,
    edges,
    strips: [
      {
        label: "stack",
        values: [...s.stack],
        states: pushed,
        slots: STACK_SLOTS,
      },
      {
        label: "from",
        values: [...s.from],
        states: pushed,
        slots: STACK_SLOTS,
      },
    ],
    calc,
    vars: `확인한 이웃 항목 ${s.checked} / ${TWO_E}`,
  };
}

function stepTitle(k: number): string {
  const s = WALK.steps[k] as Step;
  const id = stepOf(k);
  switch (s.kind) {
    case "start":
      return `${id} 정점 ${s.u}${을를(s.u)} 표시하고 스택에 넣는다`;
    case "mark":
      return `${id} ${s.u} 의 이웃 ${s.v} — 표시가 없어 표시하고 넣는다 ③`;
    case "skip":
      return `${id} ${s.u} 의 이웃 ${s.v} — 부모라 건너뛴다 ①`;
    case "found":
      return `${id} ${s.u} 의 이웃 ${s.v} — 이미 표시돼 있어 사이클이다 ②`;
  }
}

function stepText(k: number): string {
  const s = WALK.steps[k] as Step;
  switch (s.kind) {
    case "start":
      return `바깥 반복이 표시 없는 정점 ${s.u}${을를(s.u)} 잡았습니다. 표시하고 스택에 넣고, 짝지은 from 에는 부모가 없다는 뜻으로 -1 을 넣습니다.`;
    case "mark":
      return `${s.u}${을를(s.u)} 꺼내 이웃 ${s.v}${을를(s.v)} 봤습니다. 부모가 아니고 표시도 없으니 표시하고 스택에 넣고, from 에는 ${s.u}${을를(s.u)} 넣습니다. 이제 ${s.v} 의 부모는 ${s.u} 입니다.`;
    case "skip":
      return `${s.u} 의 이웃 ${s.v}${은는(s.v)} ${s.u}${을를(s.u)} 표시하게 한 부모입니다. 방금 지나온 나무 간선을 반대쪽에서 읽은 것이라 건너뜁니다.`;
    case "found":
      return `${s.u} 의 이웃 ${s.v}${은는(s.v)} 부모 ${s.parent} 가 아닌데 이미 표시돼 있습니다. 나무 간선을 따라 ${s.v} 까지 가는 길이 따로 있으니 사이클입니다. true 를 반환합니다.`;
  }
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return WALK.steps.map((_, k) => ({
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

/** 걸음 하나를 정적 그림 한 장으로 — 패널 무대와 같은 장면이다. */
function moment(
  k: number,
  title: string,
  groups?: readonly GraphGroup[],
): ReactElement {
  const step = stage(k);
  const scene = graphScene(groups ? { ...step, groups } : step, {
    layout: LAYOUT,
  });
  return <NodeGraph title={title} {...scene} />;
}

/** 걸음 `k` 에서 탐색 트리마다 묶음 하나 — 시작 정점과 그 자손. */
function treeGroups(k: number): GraphGroup[] {
  const s = WALK.steps[k] as Step;
  const rootOf = (v: number): number => {
    let cur = v;
    while ((s.par[cur] ?? NO_PARENT) !== NO_PARENT) cur = s.par[cur] as number;
    return cur;
  };
  const roots = s.visited.flatMap((b, v) =>
    b && s.par[v] === NO_PARENT ? [v] : [],
  );
  return roots.map((r) => ({
    members: s.visited.flatMap((b, v) => (b && rootOf(v) === r ? [v] : [])),
    label: `정점 ${r} 의 탐색 트리`,
  }));
}

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 실행에서 ── */

function approaches(): Approach[] {
  const n = ladderNumbers();
  return [
    {
      name: "간선을 하나씩 지워 보기",
      idea: "간선마다 그 간선만 빼고 두 끝이 아직 이어져 있는지 그래프를 처음부터 순회한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `한 줄 1,000 정점에서 이웃 ${comma(n.naiveLine)} 번 · 규모 상한이면 ${comma(n.naiveCap)} 번`,
          ok: false,
        },
      ],
      lesson:
        "같은 연결 관계를 간선마다 다시 확인했다 — 표시를 한 벌만 두고 한 번만 순회하자",
    },
    {
      name: "표시된 이웃을 만나면 사이클",
      idea: "표시를 한 벌 두고 한 번 순회하다가, 이미 표시된 이웃이 나오면 사이클이라고 답한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `간선 하나 [0,1] 에서 ${n.noSkipOne} — 정본은 ${n.oneRef}`,
          ok: false,
        },
        {
          label: "시간",
          value: `한 줄 1,000 정점에서 이웃 ${comma(n.sweepLine)} 번`,
          ok: true,
        },
      ],
      lesson:
        "방금 지나온 간선을 되돌아 읽은 것을 사이클로 셌다 — 무엇을 건너뛸지 정하자",
    },
    {
      name: "표시된 이웃은 전부 건너뛰기",
      idea: "되돌아 읽기를 없애려고 표시된 이웃을 모두 건너뛴다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `삼각형에서 ${n.skipAllTriangle} — 정본은 ${n.triangleRef}`,
          ok: false,
        },
        { label: "시간", value: "이웃 항목마다 한 번", ok: true },
      ],
      lesson:
        "사이클을 닫는 간선까지 함께 건너뛰었다 — 지나온 이웃 하나만 빼자",
    },
    {
      name: "부모 건너뛰기 탐색",
      idea: "정점마다 자기를 표시하게 한 이웃(부모)을 기억하고, 그 하나만 건너뛴다. 나머지 표시된 이웃은 사이클",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `전개 입력에서 이웃 항목 ${n.walkChecked} 개 확인 · 많아야 2E = ${n.walkTwoE}`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 정적 그림들 ── */

/** 전개 입력과 그 안의 사이클 — 사이클을 이루는 간선만 강조한다. */
function conceptGraph(): ReactElement {
  const raw = walkCycle();
  const at = raw.indexOf(Math.min(...raw));
  const cyc = [...raw.slice(at), ...raw.slice(0, at)];
  const onCycle = (a: number, b: number) =>
    cyc.some(
      (v, i) =>
        (v === a && cyc[(i + 1) % cyc.length] === b) ||
        (v === b && cyc[(i + 1) % cyc.length] === a),
    );
  return (
    <NodeGraph
      title={`전개 입력 — 강조한 간선 ${cyc.length} 개가 사이클 ${[...cyc, cyc[0]].join(" → ")}`}
      directed={false}
      nodes={LAYOUT.nodes.map((n) =>
        cyc.includes(n.id) ? { ...n, state: "read" as const } : n,
      )}
      edges={WALK_EDGES.map(([from, to]) => ({
        from,
        to,
        ...(onCycle(from, to) ? { state: "focus" as const } : {}),
      }))}
    />
  );
}

/** 알아 두면 좋은 개념 — 끝까지 가른 나무 간선과 여분 간선. */
function relatedExtra(): ReactElement {
  const isTree = walkTreeEdges();
  const extra = isTree.filter((t) => !t).length;
  return (
    <NodeGraph
      title={`전개 입력의 간선 ${WALK_EDGES.length} 개 — 굵은 실선이 나무 간선 ${WALK_EDGES.length - extra} 개, 대시가 여분 간선 ${extra} 개`}
      directed={false}
      nodes={LAYOUT.nodes}
      edges={WALK_EDGES.map(([from, to], i) => ({
        from,
        to,
        kind: isTree[i] ? ("tree" as const) : ("back" as const),
        ...(isTree[i] ? {} : { label: "여분" }),
      }))}
    />
  );
}

const last = WALK.steps.length - 1;
const lastStep = WALK.steps[last] as Step;

export const FIGS: Record<string, () => ReactElement> = {
  "concept-graph": conceptGraph,
  "concept-tree": () =>
    moment(
      last,
      `${stepOf(last)} — 굵은 실선이 나무 간선, 강조한 대시 간선 ${edgeName(WALK_EDGES[lastStep.edge] as [number, number])} — 표시된 두 정점을 다시 잇는다`,
    ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`규모 V ≤ ${comma(100_000)} · E ≤ ${comma(100_000)} · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-tree": () =>
    moment(
      MOMENT,
      `${stepOf(MOMENT)} 직후 — 탐색 트리 둘, 스택 ${show((WALK.steps[MOMENT] as Step).stack)}`,
      treeGroups(MOMENT),
    ),
  "walk-film": () => <Film spec={undirectedWalk as unknown as PlayerSpec} />,
  "related-extra": relatedExtra,
};
