/**
 * `minCut-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 컷 용량은 정본(`-guide.ref.ts`)이 낸 답이고, 걸음마다의
 * 레벨 · `iter` · 항목 18 개의 잔여 용량은 정본과 같은 절차에 적는 자리만 덧붙인 사본(`-guide.proof.ts` 의
 * `trace`)이 낸다. 그 사본이 정본과 같은 답을 내는지는 증명 사이드카가 읽힐 때 스스로 확인한다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `minCut-guide.test.ts` 가 잰다.
 *
 * **무대 약속은 `maxFlow` 편과 같다.** 무대의 간선은 항목 18 개(정방향 아홉 다음에 역방향 아홉)이고,
 * 정방향 항목은 실선에 머리말 「유량/용량」, 역방향 항목은 대시 선(`kind: "back"`)에 머리말 잔여 용량,
 * 잔여 0 인 항목은 흐린 선(`out`)이다. 짝지은 두 항목은 자리(`LAYOUT`)에서 같은 만큼 휘게 해 두 선이
 * 갈라진다(`bend` 고정). 이 편에서 더한 것은 마지막 두 걸음의 **정점 묶음**(소스 쪽 · 싱크 쪽)과, 컷을
 * 더하는 걸음에서 강조한 건너가는 간선이다.
 *
 * 정점 좌표는 값이 아니라 배치다 — 소스 0 을 왼쪽, 싱크 6 을 오른쪽 끝에 두고 위 갈래(1 · 4)와 아래
 * 갈래(3)를 갈라 놓고, 세 갈래가 모이는 정점 2 를 가운데에 두었다. `maxFlow` 편의 정점 여섯 배치에 싱크 앞 정점 5 와 싱크 6 을 이었다.
 */

import type { ReactElement } from "react";
import { 과와, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type GraphEdge,
  type GraphGroup,
  type GraphNode,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import { maxFlow } from "../maxFlow/maxFlow-guide.ref.ts";
import {
  arcName,
  bruteForce,
  C_MAX,
  comma,
  cutOf,
  E_MAX,
  type Edge,
  headOf,
  isBack,
  kindsOf,
  NAME,
  route,
  SIDE,
  type Step,
  stair,
  tailOf,
  tOf,
  V_MAX,
  WALK,
  WALK_N,
  WALK_SINK,
  WALK_SOURCE,
  WALK_TRACE,
} from "./minCut-guide.proof.ts";
import { minCut } from "./minCut-guide.ref.ts";
import { minCutWalk } from "./minCut-guide.sim.ts";

const E = WALK.length;
const S = WALK_TRACE.steps;
const END = S.find((s) => s.kind === "end") as Step;

/** 역방향 항목과 정방향 항목이 갈라지도록 둘 다 같은 만큼 휜다. */
const PAIR_BEND = 0.16;

/**
 * 간선 `5 → 3` 은 곧게 그으면 정점 2 에 붙어 지나므로 둘 다 아래로 더 휘게 한다. 방향이 반대인 역방향 항목은
 * 휘는 쪽 부호를 뒤집어야 같은 아래쪽으로 휘고, 휘는 정도를 조금 줄여 두 선이 갈라지게 했다.
 */
const LONG = WALK.findIndex(([u, v]) => u === 5 && v === 3);
const LONG_BEND = 0.22;
const LONG_BACK_BEND = -0.08;
const bendOf = (id: number): number =>
  id === LONG
    ? LONG_BEND
    : id === LONG + WALK.length
      ? LONG_BACK_BEND
      : PAIR_BEND;

const NODES = [
  { id: 0, x: 0, y: 1 },
  { id: 1, x: 1.5, y: 0 },
  { id: 2, x: 3, y: 1 },
  { id: 3, x: 1.5, y: 2 },
  { id: 4, x: 3, y: 0 },
  { id: 5, x: 4.5, y: 1 },
  { id: 6, x: 6, y: 1 },
];

/** 무대의 자리 — 정점 일곱과 항목 18 개(정방향 아홉 다음에 역방향 아홉). */
export const LAYOUT = {
  nodes: NODES,
  edges: Array.from({ length: 2 * E }, (_, id) => ({
    from: tailOf(WALK, id),
    to: headOf(WALK, id),
    bend: bendOf(id),
  })),
};

const ALL = NODES.map((n) => n.id);

/** 두 무리 — 소스 쪽 · 싱크 쪽. */
const sideGroups = (sSide: readonly number[]): GraphGroup[] => {
  const tSide = ALL.filter((v) => !sSide.includes(v));
  return [
    { members: sSide, label: `소스 쪽 {${sSide.join(", ")}}` },
    { members: tSide, label: `싱크 쪽 {${tSide.join(", ")}}` },
  ];
};

/** 원래 간선만 그리는 그림의 간선 — 건너가는 간선은 굵게 강조, 들어오는 간선은 대시 선. */
function cutEdges(sSide: readonly number[]): GraphEdge[] {
  const k = kindsOf(WALK, sSide);
  return WALK.map(([from, to, c], i) => ({
    from,
    to,
    ...(i === LONG ? { bend: LONG_BEND } : {}),
    label: String(c),
    ...(k.cross.includes(i)
      ? { kind: "tree" as const, state: "focus" as const }
      : k.back.includes(i)
        ? { kind: "back" as const }
        : {}),
  }));
}

/** 항목 18 개를 그리는 그림의 간선 — 머리말은 잔여 용량, 잔여 0 이면 흐린 선. */
function residualEdges(s: Step): GraphEdge[] {
  return Array.from({ length: 2 * E }, (_, id) => {
    const r = s.res[id] as number;
    return {
      from: tailOf(WALK, id),
      to: headOf(WALK, id),
      bend: bendOf(id),
      ...(isBack(WALK, id) ? { kind: "back" as const } : {}),
      ...(r > 0 ? { label: String(r) } : { state: "out" as const }),
    };
  });
}

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 실행에서 ── */

function approaches(): Approach[] {
  const b = bruteForce(WALK_N, WALK, WALK_SOURCE, WALK_SINK);
  const digits = Math.floor((V_MAX - 2) * Math.log10(2)) + 1;
  const flow = maxFlow(WALK_N, WALK, WALK_SOURCE, WALK_SINK).flow;
  const onlySource = cutOf(WALK, [WALK_SOURCE]);
  const last = S.at(-1) as Step;
  const sat = WALK.filter(([, , c], k) => c > 0 && last.res[k] === 0).reduce(
    (a, e) => a + e[2],
    0,
  );
  const cut = minCut(WALK_N, WALK, WALK_SOURCE, WALK_SINK).cut;
  return [
    {
      name: "분할 전수 조사",
      idea: "소스와 싱크를 뺀 정점마다 어느 무리에 둘지 다 정해 보고 컷 용량이 가장 작은 것을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: `맞다 — ${NAME.walk}에서 ${b.best}`, ok: true },
        {
          label: "시간",
          value: `규모의 상한에서 분할 ${comma(digits)} 자리 가짓수`,
          ok: false,
        },
      ],
      lesson: `가장 작은 컷 용량이 최대 유량 ${flow}${과와(flow)} 같다 — 유량과 같은 컷을 곧바로 지목할 수 없을까`,
    },
    {
      name: "소스 하나를 소스 쪽으로",
      idea: "소스만 소스 쪽에 두고 나머지를 다 싱크 쪽에 둔다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `${NAME.walk}에서 ${onlySource} — 답은 ${cut}`,
          ok: false,
        },
        { label: "시간", value: "원래 간선 한 번 순회", ok: true },
      ],
      lesson: "무리의 경계가 어디에 서는지는 유량을 보내 봐야 안다",
    },
    {
      name: "포화된 간선 모으기",
      idea: "유량을 다 보낸 뒤 용량만큼 찬 간선의 용량을 모두 더한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `${NAME.walk}에서 ${sat} — 답은 ${cut}`,
          ok: false,
        },
        { label: "시간", value: "유량 계산 + 원래 간선 한 번 순회", ok: true },
      ],
      lesson: "찬 간선이 다 경계에 있지는 않다 — 경계를 정점 쪽에서 정하자",
    },
    {
      name: "유량이 멈춘 잔여 그래프의 경계",
      idea: "유량을 더 보낼 수 없을 때 잔여 그래프에서 소스가 도달하는 정점을 소스 쪽으로 두고, 건너가는 간선의 용량을 더한다",
      verdict: "keep",
      checks: [
        { label: "답", value: `맞다 — ${NAME.walk}에서 ${cut}`, ok: true },
        { label: "시간", value: "유량 계산 + 원래 간선 한 번 순회", ok: true },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const pairOf = (id: number) => (id < E ? id + E : id - E);

function stepTitle(s: Step, i: number): string {
  const t = tOf(i);
  switch (s.kind) {
    case "build":
      return `${t} 잔여 그래프를 만든다`;
    case "bfs":
      return `${t} 라운드 ${s.round} — BFS 로 레벨을 매긴다`;
    case "path":
      return `${t} 경로 ${route(s.path)} 에 ${s.add}${을를(String(s.add))} 보낸다`;
    case "exhaust":
      return `${t} 라운드 ${s.round} — 더 보낼 경로가 없다`;
    case "end":
      return `${t} 라운드 ${s.round} — 싱크에 레벨이 안 붙는다`;
    default:
      return `${t} 건너가는 원래 간선의 용량을 더한다`;
  }
}

function stepText(s: Step, i: number): string {
  const before = S[i - 1];
  switch (s.kind) {
    case "build":
      return `간선 ${E} 개마다 정방향 항목(잔여 = 용량)과 역방향 항목(잔여 0)을 짝지어 넣습니다. 원래 간선 목록은 컷을 더할 때 쓰려고 그대로 둡니다.`;
    case "bfs": {
      const back = s.found.filter((id) => isBack(WALK, id));
      return back.length === 0
        ? `잔여가 있는 항목만 지나며 소스에서의 최단 간선 수를 적습니다. 싱크의 레벨은 ${s.level[WALK_SINK]} 입니다.`
        : `잔여가 있는 항목만 지나며 레벨을 다시 적습니다. 역방향 항목 ${back.map((id) => arcName(WALK, id)).join(" · ")}${을를(arcName(WALK, back.at(-1) as number))} 지나 정점 ${back.map((id) => headOf(WALK, id)).join(" · ")} 에 레벨이 붙고, 싱크의 레벨은 ${s.level[WALK_SINK]} 입니다.`;
    }
    case "path": {
      const caps = s.arcs.map((id) => before?.res[id] as number);
      const back = s.arcs.filter((id) => isBack(WALK, id));
      const head = `레벨이 한 칸씩 오르는 항목만 따라 싱크까지 갔습니다. 병목은 min(${caps.join(", ")}) = ${s.add} 이고, 누적 유량은 ${s.total} 입니다.`;
      if (back.length === 0) return head;
      return `${head} 역방향 항목 ${back.map((id) => arcName(WALK, id)).join(" · ")}${을를(arcName(WALK, back.at(-1) as number))} 지나 앞서 보낸 유량 일부를 되돌렸습니다.`;
    }
    case "exhaust":
      return `DFS 가 ${route(s.entered)} 까지 들어갔다가 더 내려갈 항목이 없어 0 을 올려보냅니다. 라운드 ${s.round}${이가(s.round)} 끝났고 누적 유량은 ${s.total} 입니다.`;
    case "end":
      return `BFS 가 정점 ${SIDE.join(" · ")} 까지만 레벨을 적고 싱크에는 적지 못합니다. 반복을 끝내되 이 level 을 버리지 않습니다 — 레벨이 붙은 정점이 소스 쪽 무리입니다.`;
    default: {
      const parts = s.crossed.map((k) => (WALK[k] as Edge)[2]);
      return `원래 간선 ${E} 개 중 소스 쪽에서 싱크 쪽으로 건너가는 ${s.crossed.map((k) => arcName(WALK, k)).join(" · ")} 의 용량만 더합니다. ${parts.join(" + ")} = ${s.cut} 이고 누적 유량 ${s.total}${과와(s.total)} 같습니다.`;
    }
  }
}

/** 걸음 하나의 무대 — 정점의 `level / iter`, 항목 18 개의 상태와 머리말, 큐와 DFS 가 지난 정점. */
function stepStage(s: Step): GraphStep {
  const focusArc = new Set<number>();
  const readArc = new Set<number>();
  const focusV = new Set<number>();
  const readV = new Set<number>();
  switch (s.kind) {
    case "bfs":
    case "end":
      for (const id of s.found) readArc.add(id);
      s.level.forEach((l, v) => {
        if (l >= 0) focusV.add(v);
      });
      break;
    case "path":
      for (const id of s.arcs) {
        focusArc.add(id);
        focusArc.add(pairOf(id));
      }
      for (const id of s.read) readArc.add(id);
      for (const v of s.path) readV.add(v);
      break;
    case "exhaust":
      for (const id of s.read) readArc.add(id);
      for (const v of s.entered) readV.add(v);
      break;
    case "cut":
      for (const k of s.crossed) focusArc.add(k);
      break;
    default:
      break;
  }
  const nodes = s.level.map((l, v) => {
    if (s.kind === "build") return { value: "", state: "empty" as const };
    const value = `${l < 0 ? "-" : l} / ${s.iter[v]}`;
    let state: CellState | undefined;
    if (l < 0) state = "out";
    else if (focusV.has(v)) state = "focus";
    else if (readV.has(v)) state = "read";
    return { value, ...(state ? { state } : {}) };
  });
  const edges = Array.from({ length: 2 * E }, (_, id) => {
    const r = s.res[id] as number;
    const back = isBack(WALK, id);
    const label = back
      ? r > 0
        ? String(r)
        : undefined
      : `${s.flow[id]}/${(WALK[id] as Edge)[2]}`;
    let state: GraphEdge["state"];
    if (focusArc.has(id)) state = "focus";
    else if (readArc.has(id)) state = "read";
    else if (r === 0 || (s.kind === "cut" && back)) state = "out";
    return {
      ...(back ? { kind: "back" as const } : {}),
      ...(state ? { state } : {}),
      ...(label !== undefined ? { label } : {}),
    };
  });
  let calc: GraphStep["calc"] = null;
  if (s.kind === "bfs" || s.kind === "end")
    calc = {
      expr: `level[${WALK_SINK}] =`,
      result: String(s.level[WALK_SINK]),
    };
  else if (s.kind === "path") {
    const i = S.indexOf(s);
    const caps = s.arcs.map((id) => (S[i - 1] as Step).res[id] as number);
    calc = { expr: `min(${caps.join(", ")}) =`, result: String(s.add) };
  } else if (s.kind === "exhaust")
    calc = { expr: `dfs(${WALK_SOURCE}, ∞) =`, result: "0" };
  else if (s.kind === "cut")
    calc = {
      expr: `cut = ${s.crossed.map((k) => (WALK[k] as Edge)[2]).join(" + ")} =`,
      result: String(s.cut),
    };
  return {
    nodes,
    edges,
    ...(s.kind === "end" || s.kind === "cut"
      ? { groups: sideGroups(sideOfStep(s)) }
      : {}),
    strips: [
      {
        label: "큐",
        values: s.kind === "bfs" || s.kind === "end" ? s.queue : [],
        slots: WALK_N,
      },
      {
        label: "DFS 가 지난 정점",
        values: s.kind === "path" || s.kind === "exhaust" ? s.entered : [],
        slots: WALK_N,
      },
    ],
    calc,
    vars:
      s.kind === "build"
        ? "누적 유량 0"
        : s.kind === "cut"
          ? `누적 유량 ${s.total} · cut ${s.cut}`
          : `라운드 ${s.round} · 누적 유량 ${s.total}`,
  };
}

const sideOfStep = (s: Step): number[] =>
  s.level.flatMap((l, v) => (l >= 0 ? [v] : []));

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차를 실행해 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return S.map((s, i) => ({
    title: stepTitle(s, i),
    text: stepText(s, i),
    ...stepStage(s),
  }));
}

/** 걸음 재생 패널의 정적 그림 — 패널과 같은 무대를 걸음마다 한 장씩. */
function Film({ spec }: { spec: PlayerSpec }) {
  const frames = playerFrames(spec);
  return (
    <NodeGraphFilm
      title={spec.title}
      frames={frames.map((f) => ({
        id: f.id,
        text: f.calc ? `${f.title} · ${f.calc.expr} ${f.calc.result}` : f.title,
        scene: f.scene ?? { nodes: [], edges: [] },
      }))}
    />
  );
}

/** 계단 그래프 m = 4 — 사슬은 가로로, 싱크는 위 가운데에. */
function stairScene(m: number): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const s = stair(m);
  const nodes: GraphNode[] = Array.from({ length: s.n }, (_, v) =>
    v === s.sink
      ? { id: v, x: (m - 1) / 2, y: 0, label: `${v} (싱크)` }
      : {
          id: v,
          x: v,
          y: 1.4,
          ...(v === 0 ? { label: "0 (소스)" } : {}),
        },
  );
  const edges: GraphEdge[] = s.edges.map(([from, to, c]) => ({
    from,
    to,
    label: String(c),
    ...(to === s.sink ? {} : { kind: "tree" as const }),
  }));
  return { nodes, edges };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-network": () => (
    <NodeGraph
      title={`${NAME.walk} — 간선 옆 수는 용량`}
      nodes={NODES.map((n) => ({
        ...n,
        ...(n.id === WALK_SOURCE
          ? { value: "소스" }
          : n.id === WALK_SINK
            ? { value: "싱크" }
            : {}),
      }))}
      edges={WALK.map(([from, to, c], i) => ({
        from,
        to,
        ...(i === LONG ? { bend: LONG_BEND } : {}),
        label: String(c),
      }))}
    />
  ),
  "concept-cut": () => (
    <NodeGraph
      title={`분할 하나 — 굵은 선이 소스 쪽에서 싱크 쪽으로 건너가는 간선, 대시 선은 거꾸로 들어오는 간선, 간선 옆 수는 용량`}
      nodes={NODES}
      groups={sideGroups(SIDE)}
      edges={cutEdges(SIDE)}
    />
  ),
  "concept-reach": () => (
    <NodeGraph
      title="유량을 다 보낸 잔여 그래프 — 간선 옆 수는 잔여 용량, 대시 선은 역방향 항목, 흐린 선은 잔여 0"
      nodes={NODES.map((n) => ({
        ...n,
        ...(SIDE.includes(n.id) ? {} : { state: "out" as const }),
      }))}
      groups={sideGroups(SIDE)}
      edges={residualEdges(END)}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`규모 V = ${comma(V_MAX)} · E = ${comma(E_MAX)} · 용량 ${comma(C_MAX)} 이하`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-cuts": () => {
    const picks = [[WALK_SOURCE], SIDE, [...SIDE, 5]];
    return (
      <NodeGraphFilm
        title="같은 입력 위의 분할 셋 — 굵은 선이 건너가는 간선, 대시 선은 거꾸로 들어오는 간선"
        frames={picks.map((sSide, i) => ({
          id: `분할 ${i + 1}`,
          text: `소스 쪽 {${sSide.join(", ")}} · 컷 용량 ${cutOf(WALK, sSide)}`,
          scene: {
            nodes: NODES,
            groups: sideGroups(sSide),
            edges: cutEdges(sSide),
          },
        }))}
      />
    );
  },
  "walk-film": () => <Film spec={minCutWalk as unknown as PlayerSpec} />,
  "worst-stair": () => {
    const m = 4;
    const g = stairScene(m);
    return (
      <NodeGraph
        title={`계단 그래프 m = ${m} — 소스에서 싱크까지 간선 수가 1 · 2 · 3 · 4 인 경로가 하나씩, 굵은 선이 사슬`}
        nodes={g.nodes}
        edges={g.edges}
      />
    );
  },
};
