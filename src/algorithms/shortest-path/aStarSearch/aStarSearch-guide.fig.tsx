/**
 * `aStarSearch-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 비용 · 확장 · 우선순위 큐의 내용은 정본과 같은 절차에
 * 기록만 덧붙인 사본(`-guide.proof.ts` 의 `record`)이 내고, 그 사본은 부를 때마다 자기 답을 정본
 * (`-guide.ref.ts`)과 맞댄다. 격자 그림의 확장 차례는 수만 세는 사본(`gridExpansion`)이 낸다. 시도
 * 사다리의 수는 증명 사이드카의 `originNumbers` 에서 받는다.
 *
 * ## 그래프 무대 — 다익스트라 편의 규약을 그대로 따른다
 *
 * 우선순위 큐는 그래프 무대 아래 **띠 둘**(「큐 · 정점」「큐 · 키」)로, 큐에 든 항목을 **꺼낼 차례대로**
 * 늘어놓는다(`dijkstra-guide.fig.tsx` 머리 주석). 이번 걸음에 넣은 항목은 새로 씀, 뒤처진 기록은 이번
 * 걸음 밖이다. 이 편에서 다른 것은 키가 비용이 아니라 **비용 + 추정**이라는 것 하나다.
 *
 * - 정점의 이름 칸에 **추정 `h`** 를 함께 적는다(「4 · h 5」). `h` 는 정점마다 고정이라 걸음 사이에 안
 *   바뀌고, 이름과 같은 자리에 두면 「키 = 아래 값 + 이름 옆 값」을 정점 하나에서 읽을 수 있다.
 * - 정점 안의 값은 **비용 `g`**(지금까지 찾은 가장 작은 비용)다. 아직 값이 없으면 빈 점선 정점이다.
 * - 목표를 꺼내 끝난 걸음에서 한 번도 확장하지 않은 정점은 이번 걸음 밖(대시 테)으로 그린다.
 *
 * 정점 좌표(`LAYOUT`)는 전개 입력의 좌표 그대로다(위아래만 뒤집었다). 추정이 그 좌표의 맨해튼 거리라,
 * 그림의 자리가 곧 추정의 근거다.
 */

import type { ReactElement } from "react";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import { CellStage, type StageRow } from "../../../_viz/patterns/CellStage";
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
  comma,
  drainOrder,
  gridExpansion,
  isStale,
  item,
  num,
  OVER_AT,
  OVER_VALUE,
  originNumbers,
  overH,
  record,
  type Step,
  WALK,
  WALK_EDGES,
  WALK_GOAL,
  WALK_N,
  WALK_SRC,
  WALK_TO_GOAL,
  WALK_XY,
  walkH,
} from "./aStarSearch-guide.proof.ts";
import { aStarWalk } from "./aStarSearch-guide.sim.ts";

const INF = Number.POSITIVE_INFINITY;

/** 좌표의 가장 큰 y — 그림은 위아래를 뒤집어 목표 쪽 줄이 아래에 오게 한다. */
const TOP = Math.max(...WALK_XY.map(([, y]) => y));

/** 정점 이름 — 번호와 추정. */
const nameOf = (v: number, h: (v: number) => number = walkH): string =>
  `${v} · h ${h(v)}`;

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: WALK_XY.map(([x, y], id) => ({
    id,
    x,
    y: TOP - y,
    label: nameOf(id),
  })),
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: true,
  unit: { x: 104, y: 64 },
};

/** 우선순위 큐의 띠 둘 — 꺼낼 차례대로. 새로 넣은 항목은 새로 씀, 뒤처진 기록은 이번 걸음 밖. */
function queueStrips(s: Step, slots: number): GraphStrip[] {
  const order = drainOrder(s.heap);
  const pushed = new Set(s.pushed.map(item));
  const states: Partial<Record<number, CellState>> = {};
  order.forEach((x, i) => {
    if (isStale(s, x)) states[i] = "out";
    else if (pushed.has(item(x))) states[i] = "focus";
  });
  return [
    { label: "큐 · 정점", values: order.map(([v]) => v), states, slots },
    { label: "큐 · 키", values: order.map(([, , f]) => f), states, slots },
  ];
}

const SLOTS = Math.max(...WALK.map((s) => s.heap.length));
const EXPAND_TOTAL = WALK.filter((s) => s.kind === "expand").length;

/** 간선 u→v 가 지금 비용을 낸 간선인가 — 굵은 실선(`tree`)으로 그린다. */
const isTree = (s: Step, [u, v]: readonly [number, number, number]): boolean =>
  s.pred[v] === u;

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 걸음 하나의 무대. */
function stage(i: number): GraphStep {
  const s = WALK[i] as Step;
  const improved = new Set(s.relax.filter((r) => r.improved).map((r) => r.v));
  const nodes = s.g.map((g, v) => {
    if (g === INF) return { value: "", state: "empty" as const };
    let state: CellState | undefined;
    if (s.kind === "start" && v === WALK_SRC) state = "focus";
    else if (improved.has(v)) state = "focus";
    else if (s.popped && v === s.popped[0]) state = "read";
    else if (s.kind === "goal" && !s.expanded[v]) state = "out";
    return { value: `g ${num(g)}`, ...(state ? { state } : {}) };
  });
  const edges = WALK_EDGES.map((e) => {
    const [u, v, w] = e;
    const r = s.relax.find((x) => x.u === u && x.v === v);
    const kind: EdgeKind | undefined = isTree(s, e) ? "tree" : undefined;
    const state: GraphEdge["state"] = r
      ? r.improved
        ? "focus"
        : "read"
      : undefined;
    return {
      ...(kind ? { kind } : {}),
      ...(state ? { state } : {}),
      label: String(w),
    };
  });
  let calc: GraphStep["calc"];
  if (s.kind === "start") {
    calc = {
      expr: `키 = 0 + h(${WALK_SRC}) =`,
      result: String(walkH(WALK_SRC)),
    };
  } else {
    const [u, gu] = s.popped as [number, number, number];
    const before = (WALK[i - 1] as Step).g[u] as number;
    calc =
      s.kind === "goal"
        ? { expr: `${u} === goal →`, result: `${num(gu)} 반환` }
        : s.kind === "stale"
          ? { expr: `${gu} > g[${u}] = ${num(before)} →`, result: "버린다" }
          : { expr: `${gu} = g[${u}] →`, result: "확장" };
  }
  const done = WALK.slice(0, i + 1).filter((x) => x.kind === "expand").length;
  return {
    nodes,
    edges,
    strips: queueStrips(s, SLOTS),
    calc,
    vars: `확장한 정점 ${done} / ${EXPAND_TOTAL}`,
  };
}

function stepTitle(i: number): string {
  const s = WALK[i] as Step;
  if (s.kind === "start")
    return `${s.t} 시작값 — 큐에 ${item(s.pushed[0] as [number, number, number])}`;
  const [u, , f] = s.popped as [number, number, number];
  const who = `정점 ${u}${을를(u)}`;
  if (s.kind === "goal") return `${s.t} 목표 ${who} 꺼낸다 — 키 ${f}`;
  if (s.kind === "stale") return `${s.t} ${who} 다시 꺼낸다 — 키 ${f}`;
  return `${s.t} ${who} 꺼낸다 — 키 ${f}`;
}

function stepText(i: number): string {
  const s = WALK[i] as Step;
  if (s.kind === "start") {
    const f = walkH(WALK_SRC);
    return `g[${WALK_SRC}] 에 0 을 적고 나머지는 Infinity 로 둡니다. 시작 정점의 키는 비용 0 에 추정 ${f}${을를(f)} 더한 ${f} 이고, 우선순위 큐에는 항목 ${item(s.pushed[0] as [number, number, number])} 하나가 들어갑니다.`;
  }
  const [u, gu, f] = s.popped as [number, number, number];
  const before = (WALK[i - 1] as Step).g[u] as number;
  if (s.kind === "goal") {
    const left = drainOrder(s.heap);
    const never = WALK_XY.map((_, v) => v).filter(
      (v) => v !== WALK_GOAL && !s.expanded[v],
    );
    return `꺼낸 정점 ${u}${이가(u)} 목표라 그 항목의 비용 ${num(gu)}${을를(num(gu))} 돌려줍니다. 큐에 남은 항목은 ${left.map(item).join(" ")} 이고, 정점 ${never.join(" · ")}${은는(never.at(-1) ?? "")} 한 번도 확장하지 않았습니다.`;
  }
  if (s.kind === "stale") {
    return `항목의 비용 ${gu}${이가(gu)} 지금 적힌 g[${u}] = ${num(before)} 보다 큽니다. 더 작은 값으로 고치기 전에 넣어 둔 뒤처진 기록이라, 이웃을 하나도 보지 않고 버립니다.`;
  }
  const parts = s.relax.map((r) => {
    const h = walkH(r.v);
    if (!r.improved) {
      return `간선 ${r.u}→${r.v}${은는(r.v)} ${r.gu} + ${r.w} = ${r.ng}${이가(r.ng)} 적혀 있던 ${num(r.before)} 보다 작지 않아 그대로 둡니다.`;
    }
    const verb =
      r.before === INF
        ? "처음 적히고"
        : `적혀 있던 ${num(r.before)} 보다 작아 고치고`;
    return `간선 ${r.u}→${r.v}${은는(r.v)} ${r.gu} + ${r.w} = ${r.ng}${이가(r.ng)} ${verb}, 키 ${r.ng} + ${h} = ${r.key}${으로(r.key)} ${item([r.v, r.ng, r.key])}${을를(r.key)} 넣습니다.`;
  });
  return [
    `키 ${f}${으로(f)} 나온 항목의 비용 ${gu}${이가(gu)} 지금 적힌 g[${u}] 의 값과 같아 정점 ${u}${을를(u)} 확장합니다.`,
    ...parts,
  ].join(" ");
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
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

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 ── */

function approaches(): Approach[] {
  const o = originNumbers();
  return [
    {
      name: "경로를 전부 나열하기",
      idea: "시작에서 목표로 가는 단순 경로를 전부 만들어 비용이 가장 작은 것을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `정점 ${o.bruteV} 개 완전 그래프에서 경로 ${comma(o.brutePaths)} 개 · ${o.bruteSec}`,
          ok: false,
        },
      ],
      lesson:
        "경로는 정점보다 훨씬 빨리 늘어난다 — 경로가 아니라 정점마다 비용 하나를 들고 고쳐 가자",
    },
    {
      name: "비용이 가장 작은 정점부터 꺼내기 — 다익스트라",
      idea: "우선순위 큐에서 비용 g 가 가장 작은 항목을 꺼내 그 정점의 간선을 완화한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "일",
          value: `격자 ${o.bigSide}×${o.bigSide} 에서 정점 ${comma(o.bigN)} 개 중 ${comma(o.zeroExpands)} 개를 확장`,
          ok: false,
        },
      ],
      lesson:
        "꺼내는 차례에 목표가 어디 있는지가 없다 — 목표까지 남은 몫을 순서에 넣자",
    },
    {
      name: "목표까지의 추정만 키로 쓰기",
      idea: "우선순위 큐의 키를 추정 h 하나로 두어 목표에 가까워 보이는 정점부터 꺼낸다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `전개 입력에서 ${o.walkAnswer} 대신 ${o.greedyAnswer}`,
          ok: false,
        },
      ],
      lesson: "지나온 비용을 버리면 최소를 못 지킨다 — 비용과 추정을 더하자",
    },
    {
      name: "비용과 추정을 더한 값을 키로 쓰기",
      idea: "키를 g + h 로 두고, 목표를 처음 꺼낼 때 그 항목의 비용을 답으로 돌려준다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: "맞다 — 추정이 실제 최소 비용을 넘지 않을 때",
          ok: true,
        },
        {
          label: "일",
          value: `같은 격자에서 ${comma(o.withExpands)} 개를 확장`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 정적 그림들 ── */

const END = WALK.at(-1) as Step;

/** 전개 입력의 정점 — 이름은 번호와 추정, 값은 주어진 비용 배열. */
function walkNodes(
  g: readonly number[],
  h: (v: number) => number = walkH,
  state: (v: number) => CellState | undefined = () => undefined,
): GraphNode[] {
  return LAYOUT.nodes.map((n) => {
    const d = g[n.id] as number;
    const st = state(n.id);
    return {
      ...n,
      label: nameOf(n.id, h),
      value: d === INF ? "" : `g ${num(d)}`,
      ...(d === INF ? { state: "empty" as const } : st ? { state: st } : {}),
    };
  });
}

/** 가중치를 단 간선. `tree` 에 든 간선은 굵은 실선. */
function walkEdges(pred: readonly number[]): GraphEdge[] {
  return WALK_EDGES.map((e) => ({
    from: e[0],
    to: e[1],
    label: String(e[2]),
    ...(pred[e[1]] === e[0] ? { kind: "tree" as const } : {}),
  }));
}

/** 확장한 정점의 차례. */
const expandOrder = (steps: readonly Step[]): number[] =>
  steps
    .filter((s) => s.kind === "expand")
    .map((s) => (s.popped as [number, number, number])[0]);

/** 격자 한 판 — 확장한 정점에는 그 차례를, 목표에는 「목표」를 적는다. */
function gridBlock(
  k: number,
  order: readonly number[],
  goal: number,
  name: string,
): StageRow[] {
  const at = new Map(order.map((v, i) => [v, i + 1] as const));
  const rows: StageRow[] = [
    {
      kind: "bracket",
      label: name,
      from: 0,
      to: k - 1,
      tone: "query",
      text: `확장 ${comma(order.length)} 개`,
    },
  ];
  for (let r = 0; r < k; r++) {
    const values: string[] = [];
    const states: Partial<Record<number, CellState>> = {};
    for (let c = 0; c < k; c++) {
      const v = r * k + c;
      if (v === goal) {
        values.push("목표");
        states[c] = "focus";
      } else if (at.has(v)) {
        values.push(String(at.get(v)));
      } else {
        values.push("");
        states[c] = "out";
      }
    }
    rows.push({ kind: "cells", label: `${r} 행`, values, states });
  }
  return rows;
}

const GRID_SIDE = 8;

export const FIGS: Record<string, () => ReactElement> = {
  "concept-graph": () => {
    const zero = record(WALK_N, WALK_EDGES, WALK_SRC, WALK_GOAL, () => 0);
    const mine = expandOrder(WALK);
    const theirs = expandOrder(zero);
    const slots = Math.max(mine.length, theirs.length);
    return (
      <NodeGraph
        title="전개 입력 — 간선 옆 수는 가중치, 이름 옆 h 는 목표 6 까지의 추정, 정점 안 g 는 끝났을 때의 비용"
        nodes={walkNodes(END.g, walkH, (v) =>
          END.expanded[v] || v === WALK_GOAL ? undefined : "out",
        )}
        edges={walkEdges(END.pred)}
        strips={[
          { label: "키 g + h 로 확장한 차례", values: mine, slots },
          { label: "키 g 로 확장한 차례", values: theirs, slots },
        ]}
        unit={LAYOUT.unit}
      />
    );
  },
  "concept-grid": () => {
    const x = gridExpansion(GRID_SIDE);
    return (
      <CellStage
        title={`격자 ${GRID_SIDE}×${GRID_SIDE} — 왼쪽 위에서 오른쪽 아래 목표로, 칸의 수는 확장한 차례, 빈 칸은 한 번도 확장하지 않은 정점`}
        columns={GRID_SIDE}
        rows={[
          { kind: "index", label: "열" },
          ...gridBlock(GRID_SIDE, x.withH.order, x.goal, "키 g + h"),
          ...gridBlock(GRID_SIDE, x.zero.order, x.goal, "키 g"),
        ]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    const o = originNumbers();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`규모 V ≤ ${comma(o.vLimit)} · E ≤ ${comma(o.eLimit)} · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-admissible": () => {
    return (
      <NodeGraph
        title="정점마다의 추정 h 와 목표까지의 실제 최소 비용 d — 모든 정점에서 h ≤ d"
        nodes={LAYOUT.nodes.map((n) => {
          const d = WALK_TO_GOAL[n.id] as number;
          return {
            ...n,
            value: `d ${num(d)}`,
            ...(d === INF ? { state: "out" as const } : {}),
          };
        })}
        edges={WALK_EDGES.map(([from, to, w]) => ({
          from,
          to,
          label: String(w),
        }))}
        unit={LAYOUT.unit}
      />
    );
  },
  "build-over": () => {
    const over = record(WALK_N, WALK_EDGES, WALK_SRC, WALK_GOAL, overH);
    const end = over.at(-1) as Step;
    return (
      <NodeGraph
        title={`정점 ${OVER_AT} 의 추정만 ${OVER_VALUE} 로 부풀린 판 — 굵은 간선이 비용을 낸 간선, 목표의 g 가 답`}
        nodes={walkNodes(end.g, overH, (v) =>
          v === OVER_AT
            ? "focus"
            : end.expanded[v] || v === WALK_GOAL
              ? undefined
              : "out",
        )}
        edges={walkEdges(end.pred)}
        strips={[
          {
            label: "확장한 차례",
            values: expandOrder(over),
          },
        ]}
        unit={LAYOUT.unit}
      />
    );
  },
  "build-queue": () => {
    const s = WALK[1] as Step;
    const next = drainOrder(s.heap)[0] as [number, number, number];
    const strips = queueStrips(s, SLOTS).map((x) => ({
      ...x,
      states: { ...(x.states ?? {}), 0: "read" as const },
    }));
    return (
      <NodeGraph
        title={`${s.t}${이가(s.t)} 끝난 뒤 — 큐 맨 앞은 비용이 가장 작은 정점이 아니라 키가 가장 작은 정점 ${next[0]}`}
        nodes={walkNodes(s.g, walkH, (v) =>
          v === next[0] ? "read" : undefined,
        )}
        edges={walkEdges(s.pred)}
        strips={strips}
        unit={LAYOUT.unit}
      />
    );
  },
  "walk-astar": () => <Film spec={aStarWalk as unknown as PlayerSpec} />,
};
