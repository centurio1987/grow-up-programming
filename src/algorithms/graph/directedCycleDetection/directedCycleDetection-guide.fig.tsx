/**
 * `directedCycleDetection-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 색 · cursor · 스택 · 간선 종류는 정본과 같은 절차에 기록만
 * 덧붙인 사본(`-guide.proof.ts` 의 `traced`)이 내고, 그 사본은 부를 때마다 자기 답을 정본(`-guide.ref.ts`)과
 * 맞댄다. 시도 사다리의 수도 증명 사이드카가 실행해서 낸 값을 받는다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `directedCycleDetection-guide.test.ts` 가 잰다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 사이클 0 → 2 → 5 → 0 을 왼쪽 아래 삼각형으로 모으고,
 * 0 → 1 → 3 → 4 갈래를 오른쪽 위로 뻗게 두었다.
 */

import type { ReactElement } from "react";
import { 을를, 이가 } from "../../../../tools/josa.ts";
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
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import { type GraphStep, graphScene } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  arrow,
  COLOR_NAME,
  type Color,
  chain,
  classify,
  comma,
  type EdgeKind as DfsEdgeKind,
  diamondChain,
  ladderNumbers,
  MOMENT,
  type Step,
  show,
  star,
  stepOf,
  traced,
  WALK,
  WALK_EDGES,
  WALK_N,
  WHITE,
  walkCycle,
} from "./directedCycleDetection-guide.proof.ts";
import { dfsColorWalk } from "./directedCycleDetection-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 0, y: 1 },
    { id: 1, x: 1, y: 0 },
    { id: 2, x: 1, y: 2 },
    { id: 3, x: 2, y: 1 },
    { id: 4, x: 3, y: 0 },
    { id: 5, x: 0, y: 2 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: true,
};

const E = WALK_EDGES.length;

/** 정점 안의 값 한 줄 — 색과 「확인한 간선 / 나가는 간선」. */
const nodeValue = (s: Step, v: number): string =>
  `${COLOR_NAME[s.color[v] as Color]} ${s.cursor[v]}/${(WALK.next[v] as number[]).length}`;

/** 걸음 `k` 까지 확인한 간선의 모양 — 내려간 간선은 굵은 실선, 회색으로 간 간선은 대시. */
function edgeKinds(k: number): Map<number, EdgeKind> {
  const out = new Map<number, EdgeKind>();
  WALK.steps.forEach((s, j) => {
    if (j > k || s.edge < 0) return;
    out.set(
      s.edge,
      s.kind === "descend" ? "tree" : s.kind === "back" ? "back" : "plain",
    );
  });
  return out;
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const STACK_SLOTS = Math.max(...WALK.steps.map((s) => s.stack.length), 1);

/** 걸음 하나의 무대. `k` 는 기록의 걸음 차례다. */
function stage(k: number): GraphStep {
  const s = WALK.steps[k] as Step;
  const nodes = s.color.map((c, v) => {
    let state: CellState | undefined;
    if (s.kind === "start" && v === s.u) state = "focus";
    else if (s.kind === "finish" && v === s.u) state = "focus";
    else if (s.v >= 0 && v === s.v)
      state = s.kind === "descend" ? "focus" : "read";
    else if (s.v >= 0 && v === s.u) state = "read";
    else if (c === WHITE) state = "empty";
    return { value: nodeValue(s, v), ...(state ? { state } : {}) };
  });
  const kinds = edgeKinds(k);
  const edges = WALK_EDGES.map((_, i) => {
    const kind = kinds.get(i);
    const state: GraphEdge["state"] =
      i === s.edge ? "focus" : kind === undefined ? "out" : undefined;
    return {
      ...(kind && kind !== "plain" ? { kind } : {}),
      ...(state ? { state } : {}),
    };
  });
  const stackStates: Partial<Record<number, CellState>> = {};
  if (s.kind === "start" || s.kind === "descend") {
    stackStates[s.stack.length - 1] = "focus";
  } else if (s.stack.length > 0) stackStates[s.stack.length - 1] = "read";
  const calc: GraphStep["calc"] =
    s.kind === "start"
      ? { expr: `color[${s.u}] →`, result: "흰색 · 회색으로 칠한다" }
      : s.kind === "finish"
        ? {
            expr: `cursor[${s.u}] === next[${s.u}].length →`,
            result: "참",
          }
        : {
            expr: `color[${s.v}] →`,
            result: COLOR_NAME[s.seen as Color],
          };
  return {
    nodes,
    edges,
    strips: [
      {
        label: "스택",
        values: [...s.stack],
        states: stackStates,
        slots: STACK_SLOTS,
      },
    ],
    calc,
    vars: `확인한 간선 ${s.checked} / ${E}`,
  };
}

function stepTitle(k: number): string {
  const s = WALK.steps[k] as Step;
  const id = stepOf(k);
  switch (s.kind) {
    case "start":
      return `${id} 정점 ${s.u}${을를(s.u)} 회색으로 칠하고 스택에 넣는다`;
    case "descend":
      return `${id} 간선 ${arrow([s.u, s.v])} — ${s.v}${이가(s.v)} 흰색이라 내려간다 ②`;
    case "skip":
      return `${id} 간선 ${arrow([s.u, s.v])} — ${s.v}${이가(s.v)} 검은색이라 넘어간다 ③`;
    case "back":
      return `${id} 간선 ${arrow([s.u, s.v])} — ${s.v}${이가(s.v)} 회색이라 사이클이다 ①`;
    case "finish":
      return `${id} 정점 ${s.u} 의 목록을 다 봤다 — 검은색으로 칠해 뺀다 ④`;
  }
}

function stepText(k: number): string {
  const s = WALK.steps[k] as Step;
  switch (s.kind) {
    case "start":
      return `바깥 반복이 흰색 정점 ${s.u}${을를(s.u)} 잡았습니다. 회색으로 칠하고 스택에 넣어 경로를 ${show(s.stack)} 로 시작합니다.`;
    case "descend":
      return `꼭대기 ${s.u} 의 cursor 가 가리킨 간선을 확인했습니다. ${s.v}${이가(s.v)} 흰색이라 회색으로 칠하고 스택에 넣습니다. 지금 경로는 ${show(s.stack)} 입니다.`;
    case "skip":
      return `꼭대기 ${s.u} 의 cursor 가 가리킨 간선을 확인했습니다. ${s.v}${이가(s.v)} 검은색이라 이미 끝난 정점입니다. 아무것도 하지 않고 다음 간선으로 넘어갑니다.`;
    case "back":
      return `꼭대기 ${s.u} 의 cursor 가 가리킨 간선을 확인했습니다. ${s.v}${이가(s.v)} 회색, 곧 지금 경로 ${show(s.stack)} 위의 정점이라 되돌아온 것입니다. true 를 반환합니다.`;
    case "finish":
      return `꼭대기 ${s.u} 의 cursor 가 목록 길이와 같아 나가는 간선을 다 확인했습니다. 검은색으로 칠하고 스택에서 빼면 지금 경로는 ${show(s.stack)} 입니다.`;
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
function moment(k: number, title: string): ReactElement {
  const scene = graphScene(stage(k), { layout: LAYOUT });
  return <NodeGraph title={title} {...scene} />;
}

/* ── 「아이디어를 떠올리는 과정」의 시도 셋 — 수치는 실행에서 ── */

function approaches(): Approach[] {
  const n = ladderNumbers();
  return [
    {
      name: "지금 경로에만 표시하고 경로를 전부 따라가기",
      idea: "경로 위 정점에 표시를 두고, 되돌아 나올 때 지운다. 표시한 정점을 다시 만나면 사이클",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `다이아몬드 16 개(정점 ${n.d16Vertices})에서 간선 ${comma(n.d16Steps)} 번 · 이을 수 있는 최대 ${comma(n.maxDiamonds)} 개면 경로 수가 ${comma(n.maxDigits)} 자리`,
          ok: false,
        },
      ],
      lesson:
        "같은 정점 아래를 경로마다 다시 따라갔다 — 끝난 정점에 표시를 남기자",
    },
    {
      name: "「본 적 있음」 표시 하나",
      idea: "한 번 본 정점에 표시를 남기고 지우지 않는다. 표시한 정점을 다시 만나면 사이클",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `마름모에서 ${n.diamondTwo} — 정본은 ${n.diamondRef}`,
          ok: false,
        },
        { label: "시간", value: "간선마다 한 번", ok: true },
      ],
      lesson:
        "합쳐지는 갈래를 되돌아온 것으로 읽었다 — 「지금 경로 위」와 「끝났다」를 가르자",
    },
    {
      name: "삼색 표시 — 흰색 · 회색 · 검은색",
      idea: "지금 경로 위는 회색, 끝난 정점은 검은색. 회색 정점으로 가는 간선만 사이클",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `다이아몬드 16 개에서 간선 ${comma(n.d16Checks)} 번 — 간선마다 한 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 정적 그림들 ── */

/** 전개 입력과 그 안의 사이클 — 사이클을 이루는 간선만 강조한다. */
function conceptGraph(): ReactElement {
  const cyc = walkCycle();
  const onCycle = new Set(
    cyc.map((v, i) => `${v}->${cyc[(i + 1) % cyc.length]}`),
  );
  return (
    <NodeGraph
      title={`전개 입력 — 강조한 간선 ${cyc.length} 개가 사이클 ${[...cyc, cyc[0]].join(" → ")}`}
      directed
      nodes={LAYOUT.nodes.map((n) =>
        cyc.includes(n.id) ? { ...n, state: "read" as const } : n,
      )}
      edges={WALK_EDGES.map(([from, to]) => ({
        from,
        to,
        ...(onCycle.has(`${from}->${to}`) ? { state: "focus" as const } : {}),
      }))}
    />
  );
}

/** 다이아몬드 둘을 이은 그래프 — 정점 안의 수는 정점 0 에서 그 정점까지 가는 경로의 수. */
function originDiamonds(): ReactElement {
  const { n, edges } = diamondChain(2);
  const paths: number[] = Array.from({ length: n }, (_, v) =>
    v === 0 ? 1 : 0,
  );
  // 간선이 작은 번호에서 큰 번호로만 가므로 번호 차례로 더하면 경로 수가 나온다.
  for (const [u, v] of [...edges].sort((a, b) => a[0] - b[0])) {
    paths[v] = (paths[v] as number) + (paths[u] as number);
  }
  const at = (v: number) => {
    const r = v % 3;
    const col = Math.floor(v / 3) * 2 + (r === 0 ? 0 : 1);
    return { x: col, y: r === 0 ? 1 : r === 1 ? 0 : 2 };
  };
  return (
    <NodeGraph
      title={`다이아몬드 둘을 이은 그래프 — 정점 안의 수는 정점 0 에서 오는 경로의 수`}
      directed
      nodes={paths.map((p, v) => ({ id: v, ...at(v), value: `경로 ${p}` }))}
      edges={edges.map(([from, to]) => ({ from, to }))}
    />
  );
}

/** 알아 두면 좋은 개념 — 끝까지 가른 간선 종류를 선 모양과 이름으로. */
const KIND_SHAPE: Record<DfsEdgeKind, EdgeKind> = {
  "나무 간선": "tree",
  "되돌아가는 간선": "back",
  "순방향 간선": "forward",
  "교차 간선": "cross",
};

function relatedEdgeKinds(): ReactElement {
  const kinds = classify(WALK_N, WALK_EDGES);
  return (
    <NodeGraph
      title="전개 입력의 간선 여덟 — 굵은 실선이 나무 간선이고 나머지 셋은 이름을 붙였다"
      directed
      nodes={LAYOUT.nodes}
      edges={WALK_EDGES.map(([from, to], i) => {
        const k = kinds.get(i) as DfsEdgeKind;
        return {
          from,
          to,
          kind: KIND_SHAPE[k],
          ...(k === "나무 간선" ? {} : { label: k.replace(" 간선", "") }),
        };
      })}
    />
  );
}

/** 최악을 만드는 두 모양을 정점 여섯으로 줄여 — 정점 안의 수는 스택에 들어갈 때의 깊이. */
function worstShapes(): ReactElement {
  const v = 6;
  const runs = [
    { key: "c", label: "사슬", edges: chain(v) },
    { key: "s", label: "별 모양", edges: star(v) },
  ].map((r) => {
    const t = traced(v, r.edges);
    const depth = Array.from({ length: v }, () => 0);
    let peak: number[] = [];
    for (const s of t.steps) {
      if (s.kind === "start") depth[s.u] = s.stack.length;
      if (s.kind === "descend") depth[s.v] = s.stack.length;
      if (s.stack.length > peak.length) peak = [...s.stack];
    }
    return { ...r, depth, peak };
  });
  const place: Record<string, (i: number) => { x: number; y: number }> = {
    c: (i) => ({ x: i, y: 0 }),
    s: (i) => (i === 0 ? { x: 2.5, y: 1.4 } : { x: i - 0.5, y: 2.6 }),
  };
  const nodes: GraphNode[] = runs.flatMap((r) =>
    r.depth.map((d, i) => ({
      id: `${r.key}${i}`,
      label: String(i),
      ...(place[r.key] as (i: number) => { x: number; y: number })(i),
      value: `깊이 ${d}`,
    })),
  );
  const edges: GraphEdge[] = runs.flatMap((r) =>
    r.edges.map(([a, b]) => ({ from: `${r.key}${a}`, to: `${r.key}${b}` })),
  );
  return (
    <NodeGraph
      title="정점 여섯으로 줄여 그린 두 모양 — 정점 안의 수는 스택에 들어갈 때의 깊이"
      directed
      nodes={nodes}
      edges={edges}
      groups={runs.map((r) => ({
        members: nodes
          .filter((n) => String(n.id).startsWith(r.key))
          .map((n) => n.id),
        label: r.label,
      }))}
      strips={runs.map((r) => ({
        label: `${r.label} · 스택이 가장 깊을 때`,
        values: r.peak,
      }))}
    />
  );
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-graph": conceptGraph,
  "concept-colors": () =>
    moment(
      WALK.steps.length - 1,
      `${stepOf(WALK.steps.length - 1)} — 회색 정점이 지금 경로이고, 간선 하나가 그 위로 되돌아온다`,
    ),
  "origin-diamonds": originDiamonds,
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`규모 V ≤ ${comma(100_000)} · E ≤ ${comma(100_000)} · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-colors": () =>
    moment(
      MOMENT,
      `${stepOf(MOMENT)} 직후 — 흰색 · 회색 · 검은색이 다 있는 순간`,
    ),
  "walk-film": () => <Film spec={dfsColorWalk as unknown as PlayerSpec} />,
  "related-edge-kinds": relatedEdgeKinds,
  "worst-shapes": worstShapes,
};
