/**
 * `maxFlow-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 최대 유량은 정본(`-guide.ref.ts`)이 낸 답이고, 걸음마다의
 * 레벨 · `iter` · 항목 14 개의 잔여 용량은 정본과 같은 절차에 적는 자리만 덧붙인 사본(`-guide.proof.ts` 의
 * `trace`)이 낸다. 그 사본이 정본과 같은 답을 내는지는 증명 사이드카가 읽힐 때 스스로 확인한다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `maxFlow-guide.test.ts` 가 잰다.
 *
 * **무대의 간선은 항목 14 개다.** 원래 간선 하나가 정방향 · 역방향 두 항목이 되므로 잔여 그래프를 그리려면
 * 둘을 다 그려야 한다. 정방향 항목은 실선이고 머리말이 「유량/용량」이다. 역방향 항목은 대시 선
 * (`kind: "back"`)이고 머리말이 잔여 용량 — 곧 되돌릴 수 있는 양이다. 잔여가 0 인 항목은 잔여 그래프에
 * 없으므로 흐린 선(`out`)으로 둔다. 두 항목은 같은 두 정점을 잇고 방향만 반대라, 자리(`LAYOUT`)에서
 * 둘 다 같은 만큼 휘게 해 두 선이 갈라지게 했다. 휘는 정도를 자리에 적어 두었으므로 역방향 항목이 흐린
 * 선이든 아니든 선의 모양이 걸음 사이에 바뀌지 않는다.
 *
 * 정점 좌표는 값이 아니라 배치다 — 소스 0 을 왼쪽, 싱크 5 를 오른쪽에 두고 위 갈래(1 · 4)와 아래
 * 갈래(3 · 2)를 갈라 놓았다.
 */

import type { ReactElement } from "react";
import { 으로, 은는, 을를 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type GraphEdge,
  type GraphNode,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  arcName,
  BRIDGE,
  C_MAX,
  comma,
  E_MAX,
  type Edge,
  headOf,
  isBack,
  ladderNumbers,
  levelArcs,
  NAME,
  R1_END,
  route,
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
} from "./maxFlow-guide.proof.ts";
import { maxFlow } from "./maxFlow-guide.ref.ts";
import { maxFlowWalk } from "./maxFlow-guide.sim.ts";

const E = WALK.length;
const S = WALK_TRACE.steps;
const LAST = S.at(-1) as Step;

/** 역방향 항목과 정방향 항목이 갈라지도록 둘 다 같은 만큼 휜다. */
const PAIR_BEND = 0.16;

const NODES = [
  { id: 0, x: 0, y: 1 },
  { id: 1, x: 1.5, y: 0 },
  { id: 2, x: 3, y: 2 },
  { id: 3, x: 1.5, y: 2 },
  { id: 4, x: 3, y: 0 },
  { id: 5, x: 4.5, y: 1 },
];

/** 무대의 자리 — 정점 여섯과 항목 14 개(정방향 일곱 다음에 역방향 일곱). */
export const LAYOUT = {
  nodes: NODES,
  edges: Array.from({ length: 2 * E }, (_, id) => ({
    from: tailOf(WALK, id),
    to: headOf(WALK, id),
    bend: PAIR_BEND,
  })),
};

/** 원래 간선만 그리는 그림의 간선 — 휘지 않는다. */
const plainEdges = (label: (k: number) => string | undefined): GraphEdge[] =>
  WALK.map(([from, to], k) => ({ from, to, label: label(k) }));

/** 항목 14 개를 그리는 그림의 간선 — 머리말은 잔여 용량, 잔여 0 이면 흐린 선. */
function residualEdges(s: Step): GraphEdge[] {
  return Array.from({ length: 2 * E }, (_, id) => {
    const r = s.res[id] as number;
    return {
      from: tailOf(WALK, id),
      to: headOf(WALK, id),
      bend: PAIR_BEND,
      ...(isBack(WALK, id) ? { kind: "back" as const } : {}),
      ...(r > 0 ? { label: String(r) } : { state: "out" as const }),
    };
  });
}

/* ── 「아이디어를 떠올리는 과정」의 시도 다섯 — 수치는 실행에서 ── */

function approaches(): Approach[] {
  const x = ladderNumbers();
  const walkFlow = maxFlow(WALK_N, WALK, WALK_SOURCE, WALK_SINK).flow;
  return [
    {
      name: "유량 배정 전수 조사",
      idea: "간선마다 0 부터 용량까지 넣어 보고, 조건을 지키는 배정 중 가장 큰 것을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `규모의 상한에서 배정 ${comma(x.bruteDigits)} 자리 가짓수`,
          ok: false,
        },
      ],
      lesson: "배정을 한꺼번에 고르지 말고 경로 하나씩 보내며 채워 가면 어떨까",
    },
    {
      name: "한 길씩 보내고 되돌리지 않기",
      idea: "소스에서 싱크로 가는 길을 찾아 병목만큼 보내고, 남은 용량을 줄인다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `${NAME.bridge}에서 ${x.greedy} — 답은 ${x.bridgeAnswer}`,
          ok: false,
        },
        { label: "시간", value: "경로 수만큼 탐색", ok: true },
      ],
      lesson:
        "앞서 보낸 것이 잘못일 수 있다 — 보낸 만큼 반대 방향 항목을 열어 두자",
    },
    {
      name: "되돌릴 자리를 두고 아무 경로나",
      idea: "보낸 만큼 반대 방향 잔여를 늘리고, 처음 찾은 경로에 보낸다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `부채꼴 가닥 ${x.fanK[0]} → ${x.fanK[1]} 에서 간선 검사 ${x.fanFf} 배 · 경로 고르는 순서가 경로 수를 정한다`,
          ok: false,
        },
      ],
      lesson: "순서를 규칙으로 정하자 — 간선 수가 가장 적은 경로부터",
    },
    {
      name: "경로마다 BFS 로 최단 경로",
      idea: "증가 경로 하나마다 BFS 를 다시 해 간선 수가 가장 적은 경로에 보낸다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `부채꼴 128 에서 BFS ${comma(x.fanEkBfs)} 번 · 가닥 32 배에 간선 검사 ${x.fanEk} 배`,
          ok: false,
        },
      ],
      lesson: "BFS 한 번이 매긴 거리로 경로를 여러 개 찾을 수 없을까",
    },
    {
      name: "레벨 그래프의 차단 유량",
      idea: "BFS 한 번으로 레벨을 매기고, 레벨이 한 칸씩 오르는 경로를 더 못 찾을 때까지 보낸다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `맞다 — ${NAME.walk}에서 ${walkFlow}`,
          ok: true,
        },
        {
          label: "시간",
          value: `부채꼴 128 에서 BFS ${comma(x.fanDnBfs)} 번 · 가닥 32 배에 간선 검사 ${x.fanDn} 배`,
          ok: true,
        },
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
    default:
      return `${t} 라운드 ${s.round} — 싱크에 레벨이 안 붙는다`;
  }
}

function stepText(s: Step, i: number): string {
  const before = S[i - 1];
  switch (s.kind) {
    case "build":
      return `간선 ${E} 개마다 정방향 항목(잔여 = 용량)과 역방향 항목(잔여 0)을 짝지어 넣습니다. 항목은 ${2 * E} 개이고 누적 유량은 0 입니다.`;
    case "bfs": {
      const back = s.found.filter((id) => isBack(WALK, id));
      return back.length === 0
        ? `잔여가 있는 항목만 지나며 소스에서의 최단 간선 수를 적습니다. 싱크의 레벨은 ${s.level[WALK_SINK]} 입니다.`
        : `잔여가 있는 항목만 지나며 레벨을 다시 적습니다. 역방향 항목 ${back.map((id) => arcName(WALK, id)).join(" · ")}${을를(String(headOf(WALK, back.at(-1) as number)))} 지나 정점 ${back.map((id) => headOf(WALK, id)).join(" · ")} 에 레벨이 붙고, 싱크의 레벨은 ${s.level[WALK_SINK]} 입니다.`;
    }
    case "path": {
      const caps = s.arcs.map((id) => before?.res[id] as number);
      const back = s.arcs.filter((id) => isBack(WALK, id));
      const head = `레벨이 한 칸씩 오르는 항목만 따라 싱크까지 갔습니다. 병목은 min(${caps.join(", ")}) = ${s.add} 이고, 지난 항목마다 잔여가 ${s.add} 줄고 짝의 잔여가 ${s.add} 늡니다.`;
      if (back.length === 0) return head;
      const id = back[0] as number;
      const [u, v] = [headOf(WALK, id), tailOf(WALK, id)];
      return `${head} ${arcName(WALK, id)}${은는(String(v))} 역방향 항목이라, 앞서 ${u}→${v}${으로(String(v))} 보낸 것 가운데 ${s.add}${을를(String(s.add))} 되돌린 것입니다.`;
    }
    case "exhaust":
      return `DFS 가 ${route(s.entered)} 까지 들어갔다가 더 내려갈 항목이 없어 0 을 올려보냅니다. 라운드 ${s.round} 의 차단 유량이 됐고, 누적 유량은 ${s.total} 입니다.`;
    default: {
      const reached = s.level.flatMap((l, v) => (l >= 0 ? [v] : []));
      return `싱크로 들어가는 항목의 잔여가 모두 0 이라 BFS 가 정점 ${reached.join(" · ")} 까지만 레벨을 적습니다. level[${WALK_SINK}] = -1 이라 반복을 끝내고 { flow: ${s.total} } 를 돌려줍니다.`;
    }
  }
}

/** 걸음 하나의 무대 — 정점의 `level / iter`, 항목 14 개의 상태와 머리말, 큐와 DFS 가 지난 정점. */
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
    else if (r === 0) state = "out";
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
  return {
    nodes,
    edges,
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
        : `라운드 ${s.round} · 누적 유량 ${s.total}`,
  };
}

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

/** 레벨 그래프 한 장 — 남긴 항목은 강조한 선, 잔여는 있지만 뺀 항목은 흐린 선, 잔여 0 인 항목은 안 그린다. */
function levelScene(s: Step): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const kept = new Set(levelArcs(WALK, s));
  const edges: GraphEdge[] = [];
  for (let id = 0; id < 2 * E; id++) {
    const r = s.res[id] as number;
    if (r === 0) continue;
    edges.push({
      from: tailOf(WALK, id),
      to: headOf(WALK, id),
      bend: PAIR_BEND,
      ...(isBack(WALK, id) ? { kind: "back" as const } : {}),
      label: String(r),
      state: kept.has(id) ? ("focus" as const) : ("out" as const),
    });
  }
  return {
    nodes: NODES.map((n) => ({ ...n, value: `레벨 ${s.level[n.id]}` })),
    edges,
  };
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
      edges={plainEdges((k) => String((WALK[k] as Edge)[2]))}
    />
  ),
  "concept-maxflow": () => (
    <NodeGraph
      title="최대 유량 한 벌 — 간선 옆 수는 유량/용량, 굵은 선은 용량만큼 찬 간선"
      nodes={NODES}
      edges={WALK.map(([from, to, c], k) => ({
        from,
        to,
        label: `${LAST.flow[k]}/${c}`,
        ...(LAST.flow[k] === c ? { kind: "tree" as const } : {}),
      }))}
    />
  ),
  "concept-residual": () => {
    const s = S.find((x) => x.kind === "path") as Step;
    return (
      <NodeGraph
        title={`경로 ${route(s.path)} 에 ${s.add}${을를(String(s.add))} 보낸 뒤 — 간선 옆 수는 잔여 용량, 대시 선은 역방향 항목`}
        nodes={NODES}
        edges={residualEdges(s)}
      />
    );
  },
  "concept-levels": () => {
    const s = S.find((x) => x.kind === "bfs") as Step;
    const kept = new Set(levelArcs(WALK, s));
    return (
      <NodeGraph
        title="라운드 1 의 레벨 — 정점 안의 수는 소스에서의 최단 간선 수"
        nodes={NODES.map((n) => ({ ...n, value: `레벨 ${s.level[n.id]}` }))}
        edges={plainEdges(() => undefined).map((e, k) => ({
          ...e,
          ...(kept.has(k)
            ? { kind: "tree" as const }
            : { state: "out" as const }),
        }))}
      />
    );
  },
  "origin-bridge": () => (
    <NodeGraph
      title={`${NAME.bridge} — 용량은 모두 1, 소스 0 · 싱크 3`}
      nodes={[
        { id: 0, x: 0, y: 1 },
        { id: 1, x: 1.5, y: 0 },
        { id: 2, x: 1.5, y: 2 },
        { id: 3, x: 3, y: 1 },
      ]}
      edges={BRIDGE.map(([from, to, c]) => ({ from, to, label: String(c) }))}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 다섯 — 넷은 버렸고 하나가 남았다"
        constraint={`규모 V = ${comma(V_MAX)} · E = ${comma(E_MAX)} · 용량 ${comma(C_MAX)} 이하`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-residual": () => {
    const s = S[R1_END] as Step;
    return (
      <NodeGraph
        title="라운드 1 이 끝난 잔여 그래프 — 간선 옆 수는 잔여 용량, 대시 선은 역방향 항목, 흐린 선은 잔여 0"
        nodes={NODES}
        edges={residualEdges(s)}
      />
    );
  },
  "build-levels": () => {
    const picks = S.flatMap((s, i) => (s.kind === "bfs" ? [i] : []));
    return (
      <NodeGraphFilm
        title="라운드마다의 레벨 그래프 — 강조한 선이 남긴 항목(대시 선은 역방향), 흐린 선은 잔여는 있지만 뺀 항목"
        frames={picks.map((i) => {
          const s = S[i] as Step;
          return {
            id: tOf(i),
            text: `라운드 ${s.round} — 싱크의 레벨 ${s.level[WALK_SINK]}`,
            scene: levelScene(s),
          };
        })}
      />
    );
  },
  "build-bfs-tree": () => {
    const s = S.find((x) => x.kind === "bfs") as Step;
    const tree = new Set(s.found);
    return (
      <NodeGraph
        title="라운드 1 의 BFS 트리 — 굵은 선이 레벨을 적게 한 간선, 흐린 선은 레벨 그래프에만 있는 간선"
        nodes={NODES.map((n) => ({ ...n, value: `레벨 ${s.level[n.id]}` }))}
        edges={plainEdges(() => undefined).map((e, k) => ({
          ...e,
          ...(tree.has(k)
            ? { kind: "tree" as const }
            : { state: "out" as const }),
        }))}
      />
    );
  },
  "walk-film": () => <Film spec={maxFlowWalk as unknown as PlayerSpec} />,
  "related-mincut": () => {
    const inS = LAST.level.flatMap((l, v) => (l >= 0 ? [v] : []));
    const tSide = NODES.map((n) => n.id).filter((v) => !inS.includes(v));
    return (
      <NodeGraph
        title="마지막 BFS 가 가른 컷 — 굵은 선이 경계 간선, 간선 옆 수는 유량/용량"
        nodes={NODES}
        groups={[
          { members: inS, label: `소스 쪽 {${inS.join(", ")}}` },
          { members: tSide, label: `싱크 쪽 {${tSide.join(", ")}}` },
        ]}
        edges={WALK.map(([from, to, c], k) => {
          const cross = inS.includes(from) && !inS.includes(to);
          return {
            from,
            to,
            label: `${LAST.flow[k]}/${c}`,
            ...(cross
              ? { kind: "tree" as const, state: "focus" as const }
              : {}),
          };
        })}
      />
    );
  },
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
  "alt-stair": () => (
    <NodeGraph
      title="대조에 쓴 계단 — 싱크로 가는 간선마다 용량 1 짜리 평행 간선이 w 개, 굵은 선은 넉넉한 용량의 사슬"
      nodes={[
        { id: 0, x: 0, y: 1.4, label: "0 (소스)" },
        { id: 1, x: 1, y: 1.4 },
        { id: 2, x: 2, y: 1.4 },
        { id: 3, x: 3, y: 1.4, label: "…" },
        { id: 4, x: 1.5, y: 0, label: "20 (싱크)" },
      ]}
      edges={[
        { from: 0, to: 4, label: "1 × w" },
        { from: 1, to: 4, label: "1 × w" },
        { from: 2, to: 4, label: "1 × w" },
        { from: 3, to: 4, label: "1 × w" },
        { from: 0, to: 1, kind: "tree" },
        { from: 1, to: 2, kind: "tree" },
        { from: 2, to: 3, kind: "tree" },
      ]}
    />
  ),
};
