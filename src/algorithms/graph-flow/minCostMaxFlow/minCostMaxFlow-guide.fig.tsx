/**
 * `minCostMaxFlow-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 답은 정본(`-guide.ref.ts`)이 낸 것이고, 걸음마다의 dist ·
 * 항목 10 개의 잔여 용량은 정본과 같은 절차에 적는 자리만 덧붙인 사본(`-guide.proof.ts` 의 `traceWalk`)이
 * 낸다. 그 사본이 정본과 같은 답을 내는지는 증명 사이드카가 읽힐 때 스스로 확인한다. 최대 유량을 만드는
 * 배정 둘과 유량 값마다의 최소 총비용은 같은 사이드카의 전수 조사가 낸다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `minCostMaxFlow-guide.test.ts` 가 잰다.
 *
 * **무대 약속은 `maxFlow` 편의 그래프 무대를 그대로 따르고 머리말에 단위 비용 하나를 더한다.** 무대의 간선은
 * 항목 10 개다(정방향 다섯 다음에 역방향 다섯). 정방향 항목은 실선이고 머리말이 「유량/용량 · 단위 비용」,
 * 역방향 항목은 대시 선(`kind: "back"`)이고 머리말이 「잔여 용량 · 단위 비용」이다 — 역방향의 단위 비용은
 * 음수다. 잔여가 0 인 항목은 잔여 그래프에 없으므로 흐린 선(`out`)으로 두고, 역방향이면 머리말도 뺀다. 두
 * 항목은 같은 두 정점을 잇고 방향만 반대라, 자리(`LAYOUT`)에서 둘 다 같은 만큼 휘게 했다(`bend` 고정 —
 * 걸음 사이에 선 모양이 안 바뀐다). 무대의 일반형은 그대로다 — 머리말은 원래 자유로운 짧은 말이다.
 *
 * 정점 좌표는 값이 아니라 배치다 — 소스 0 을 왼쪽, 싱크 3 을 오른쪽에 두고 가운데 둘을 위(1)와
 * 아래(2)로 갈랐다.
 */

import type { ReactElement } from "react";
import { 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import { CumulativeCurve } from "../../../_viz/patterns/CumulativeCurve";
import {
  type GraphEdge,
  type GraphNode,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  A_MAX,
  arcName,
  BEFORE_BACK,
  BEST_BY_VALUE,
  C_MAX,
  costOf,
  E_MAX,
  flowOf,
  headOf,
  isBack,
  ladderNumbers,
  list,
  MAX_FLOWS,
  NAME,
  num,
  pairOf,
  pushIndex,
  route,
  type Step,
  tailOf,
  tOf,
  V_MAX,
  WALK,
  WALK_N,
  WALK_SINK,
  WALK_SOURCE,
  WALK_TRACE,
} from "./minCostMaxFlow-guide.proof.ts";
import { minCostMaxFlow } from "./minCostMaxFlow-guide.ref.ts";
import { mcmfWalk } from "./minCostMaxFlow-guide.sim.ts";

const E = WALK.length;
const S = WALK_TRACE.steps;

/** 역방향 항목과 정방향 항목이 갈라지도록 둘 다 같은 만큼 휜다. */
const PAIR_BEND = 0.16;

const NODES = [
  { id: 0, x: 0, y: 1.2 },
  { id: 1, x: 2, y: 0 },
  { id: 2, x: 2, y: 2.4 },
  { id: 3, x: 4, y: 1.2 },
];

/** 무대의 자리 — 정점 넷과 항목 10 개(정방향 다섯 다음에 역방향 다섯). */
export const LAYOUT = {
  nodes: NODES,
  edges: Array.from({ length: 2 * E }, (_, id) => ({
    from: tailOf(WALK, id),
    to: headOf(WALK, id),
    bend: PAIR_BEND,
  })),
};

/** 항목 10 개를 그리는 그림의 간선 — 머리말은 「잔여 · 단위 비용」, 잔여 0 이면 흐린 선. */
function residualEdges(s: Step): GraphEdge[] {
  return Array.from({ length: 2 * E }, (_, id) => {
    const r = s.res[id] as number;
    return {
      from: tailOf(WALK, id),
      to: headOf(WALK, id),
      bend: PAIR_BEND,
      ...(isBack(WALK, id) ? { kind: "back" as const } : {}),
      ...(r > 0
        ? { label: `${r} · ${num(costOf(WALK, id))}` }
        : { state: "out" as const }),
    };
  });
}

/* ── 「아이디어를 떠올리는 과정」의 시도 다섯 — 수치는 실행에서 ── */

function approaches(): Approach[] {
  const x = ladderNumbers();
  return [
    {
      name: "유량 배정 전수 조사",
      idea: "간선마다 0 부터 용량까지 넣어 보고, 조건을 지키는 배정 중 유량이 최대이고 총비용이 가장 작은 것을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `규모의 상한에서 배정 ${num(x.bruteDigits)} 자리 가짓수`,
          ok: false,
        },
      ],
      lesson: "배정을 한꺼번에 고르지 말고 증가 경로를 하나씩 보내며 채우자",
    },
    {
      name: "최대 유량 절차 그대로",
      idea: "단위 비용을 안 보고 잔여 그래프에서 아무 증가 경로나 찾아 병목만큼 보낸다",
      verdict: "drop",
      checks: [
        { label: "최대 유량", value: `맞다 — ${x.anyFlow}`, ok: true },
        {
          label: "총비용",
          value: `${NAME.walk}에서 ${x.anyCost} — 최솟값은 ${x.best}`,
          ok: false,
        },
      ],
      lesson: "경로 비용이 가장 작은 증가 경로부터 보내자",
    },
    {
      name: "비용이 가장 작은 경로를 정방향 항목만으로",
      idea: "단위 비용 합이 가장 작은 경로를 원래 간선 방향으로만 찾아 보낸다",
      verdict: "drop",
      checks: [
        {
          label: "최대 유량",
          value: `${NAME.walk}에서 ${x.fwdFlow} — 최대는 ${x.maxValue}`,
          ok: false,
        },
      ],
      lesson: "되돌릴 자리가 있어야 한다 — 역방향 항목에도 단위 비용을 달자",
    },
    {
      name: "역방향 항목에 같은 부호의 비용",
      idea: "역방향 항목도 원래 간선의 단위 비용 a 를 그대로 단다",
      verdict: "drop",
      checks: [
        { label: "최대 유량", value: "맞다", ok: true },
        {
          label: "총비용",
          value: `${NAME.walk}에서 ${x.sameCost} — 최솟값은 ${x.best}`,
          ok: false,
        },
      ],
      lesson: "되돌린 한 단위는 치른 비용을 되돌려 받아야 한다 — −a 를 달자",
    },
    {
      name: "최소 비용 증가 경로",
      idea: "역방향 항목에 −a 를 달고, 음수 비용을 받는 최단 경로 절차로 경로 비용이 가장 작은 증가 경로를 찾아 보낸다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `맞다 — { flow: ${x.answer.flow}, cost: ${x.answer.cost} }`,
          ok: true,
        },
        {
          label: "시간",
          value: "라운드마다 최단 경로 한 번",
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const fmtD = (d: number): string => `d ${num(d)}`;

function stepTitle(s: Step, i: number): string {
  const t = tOf(i);
  const p = num(s.push);
  switch (s.kind) {
    case "build":
      return `${t} 잔여 그래프를 만든다`;
    case "find":
      return `${t} 라운드 ${s.round} — SPFA 로 경로 비용이 가장 작은 증가 경로를 찾는다`;
    case "push":
      return `${t} 라운드 ${s.round} — ${route(s.path)} 에 ${p}${을를(p)} 보낸다`;
    default:
      return `${t} 라운드 ${s.round} — 싱크에 이르는 증가 경로가 없다`;
  }
}

function stepText(s: Step, i: number): string {
  const before = S[i - 1];
  switch (s.kind) {
    case "build":
      return `간선 ${E} 개마다 정방향 항목(잔여 = 용량, 단위 비용 a)과 역방향 항목(잔여 0, 단위 비용 −a)을 짝지어 넣습니다. 항목은 ${2 * E} 개이고 누적 유량과 누적 총비용은 0 입니다.`;
    case "find": {
      const back = s.arcs.filter((id) => isBack(WALK, id));
      const head = `SPFA 가 잔여가 있는 항목만 지나며 dist = ${list(s.dist)}${을를(num(s.dist.at(-1) as number))} 적습니다. 싱크의 값 ${num(s.pathCost)}${이가(num(s.pathCost))} 이 증가 경로로 한 단위를 보낼 때의 경로 비용입니다.`;
      if (back.length === 0) return head;
      const id = back[0] as number;
      return `${head} 역방향 항목 ${arcName(WALK, id)} 의 단위 비용 ${num(costOf(WALK, id))}${이가(num(costOf(WALK, id)))} 더해져 정점 ${headOf(WALK, id)} 의 값이 ${num(s.dist[headOf(WALK, id)] as number)} 입니다.`;
    }
    case "push": {
      const caps = s.arcs.map((id) => num(before?.res[id] as number));
      return `병목은 min(${caps.join(", ")}) = ${num(s.push)} 입니다. 지난 항목마다 잔여가 ${num(s.push)} 줄고 짝의 잔여가 ${num(s.push)} 늘며, 총비용에 ${num(s.push)} × ${num(s.pathCost)} = ${num(s.push * s.pathCost)}${이가(num(s.push * s.pathCost))} 더해집니다.`;
    }
    default:
      return `소스에서 나가는 정방향 항목의 잔여가 모두 0 이라 SPFA 가 소스 하나만 꺼내고 끝납니다. d(${WALK_SINK}) = ∞ 라 반복을 끝내고 { flow: ${s.flow}, cost: ${s.cost} } 를 돌려줍니다.`;
  }
}

/** 걸음 하나의 무대 — 정점의 dist, 항목 10 개의 상태와 머리말, 증가 경로의 정점. */
function stepStage(s: Step, i: number): GraphStep {
  const focusArc = new Set<number>();
  const readArc = new Set<number>();
  const focusV = new Set<number>();
  const readV = new Set<number>();
  if (s.kind === "find") {
    for (const id of s.arcs) readArc.add(id);
    s.dist.forEach((d, v) => {
      if (d !== Number.POSITIVE_INFINITY) focusV.add(v);
    });
  } else if (s.kind === "push") {
    for (const id of s.arcs) {
      focusArc.add(id);
      focusArc.add(pairOf(WALK, id));
    }
    for (const v of s.path) readV.add(v);
  } else if (s.kind === "end") {
    focusV.add(WALK_SOURCE);
  }
  const nodes = s.dist.map((d, v) => {
    if (s.kind === "build") return { value: "", state: "empty" as const };
    let state: CellState | undefined;
    if (d === Number.POSITIVE_INFINITY) state = "out";
    else if (focusV.has(v)) state = "focus";
    else if (readV.has(v)) state = "read";
    return { value: fmtD(d), ...(state ? { state } : {}) };
  });
  const edges = Array.from({ length: 2 * E }, (_, id) => {
    const r = s.res[id] as number;
    const back = isBack(WALK, id);
    const a = num(costOf(WALK, id));
    const label = back
      ? r > 0
        ? `${r} · ${a}`
        : undefined
      : `${flowOf(s, id)}/${(WALK[id] as [number, number, number, number])[2]} · ${a}`;
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
  if (s.kind === "find")
    calc = { expr: `d(${WALK_SINK}) =`, result: num(s.pathCost) };
  else if (s.kind === "push") {
    const caps = s.arcs.map((id) => num((S[i - 1] as Step).res[id] as number));
    calc = { expr: `min(${caps.join(", ")}) =`, result: num(s.push) };
  } else if (s.kind === "end")
    calc = { expr: `d(${WALK_SINK}) =`, result: "∞" };
  return {
    nodes,
    edges,
    strips: [
      {
        label: "증가 경로",
        values: s.kind === "find" || s.kind === "push" ? [...s.path] : [],
        slots: WALK_N,
      },
    ],
    calc,
    vars:
      s.kind === "build"
        ? "누적 유량 0 · 누적 총비용 0"
        : `라운드 ${s.round} · 누적 유량 ${s.flow} · 누적 총비용 ${s.cost}`,
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
    ...stepStage(s, i),
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

/** 원래 간선만 그리는 그림의 정점 — 소스와 싱크에 이름을 붙인다. */
const namedNodes: GraphNode[] = NODES.map((n) => ({
  ...n,
  ...(n.id === WALK_SOURCE
    ? { value: "소스" }
    : n.id === WALK_SINK
      ? { value: "싱크" }
      : {}),
}));

/**
 * 유량 값마다의 최소 총비용 곡선 — 세로 값은 전수 조사가 낸 최솟값, 짚은 점은 라운드가 끝난 유량 값과 그 라운드다.
 * 짚은 점의 누적 총비용이 전수 조사의 최솟값과 같은지는 증명 블록 `marginal` 이 잰다.
 */
function CostCurve() {
  const ends = new Map<number, number>();
  for (const s of S) if (s.kind === "push") ends.set(s.flow, s.round);
  return (
    <CumulativeCurve
      title={`${NAME.walk} — 유량 값마다의 최소 총비용, 선분 위 수는 한 단위 더 보내는 값, 네모는 라운드가 끝난 자리`}
      xLabel="유량 값"
      yLabel="최소 총비용"
      points={BEST_BY_VALUE.map((y, x) => {
        const r = ends.get(x);
        return {
          x,
          y,
          ...(x === 0 ? { mark: "시작" } : r ? { mark: `라운드 ${r}` } : {}),
        };
      })}
    />
  );
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-network": () => (
    <NodeGraph
      title={`${NAME.walk} — 간선 옆 수는 용량 · 단위 비용`}
      nodes={namedNodes}
      edges={WALK.map(([from, to, c, a]) => ({
        from,
        to,
        label: `${c} · ${a}`,
      }))}
    />
  ),
  "concept-two-flows": () => (
    <NodeGraphFilm
      title="유량 6 을 만드는 배정 둘 — 간선 옆 수는 유량/용량 · 단위 비용, 굵은 선은 용량만큼 찬 간선, 흐린 선은 유량 0"
      frames={MAX_FLOWS.map((m, j) => ({
        id: `배정 ${j + 1}`,
        text: `총비용 ${num(m.cost)}`,
        scene: {
          nodes: namedNodes,
          edges: WALK.map(([from, to, c, a], k) => {
            const f = m.f[k] as number;
            return {
              from,
              to,
              label: `${f}/${c} · ${a}`,
              ...(f === c
                ? { kind: "tree" as const }
                : f === 0
                  ? { state: "out" as const }
                  : {}),
            };
          }),
        },
      }))}
    />
  ),
  "concept-residual": () => {
    const s = S[pushIndex(1)] as Step;
    return (
      <NodeGraph
        title={`경로 ${route(s.path)} 에 ${s.push}${을를(String(s.push))} 보낸 뒤의 잔여 그래프 — 간선 옆 수는 잔여 용량 · 단위 비용, 대시 선은 역방향 항목, 흐린 선은 잔여 0`}
        nodes={NODES}
        edges={residualEdges(s)}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 다섯 — 넷은 버렸고 하나가 남았다"
        constraint={`규모 V = ${num(V_MAX)} · E = ${num(E_MAX)} · 용량 ${num(C_MAX)} · 단위 비용 ${num(A_MAX)} 이하`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-residual": () => {
    const s = S[BEFORE_BACK] as Step;
    return (
      <NodeGraph
        title={`${tOf(BEFORE_BACK)} 이 끝난 잔여 그래프 — 간선 옆 수는 잔여 용량 · 단위 비용, 대시 선은 역방향 항목, 흐린 선은 잔여 0`}
        nodes={NODES}
        edges={residualEdges(s)}
      />
    );
  },
  "walk-film": () => <Film spec={mcmfWalk as unknown as PlayerSpec} />,
  "related-curve": () => <CostCurve />,
};

/** 시험이 정본의 답을 직접 다시 묻는다 — 그림 사이드카가 정본을 불렀는지 확인하는 자리. */
export const WALK_ANSWER = minCostMaxFlow(WALK_N, WALK, WALK_SOURCE, WALK_SINK);
