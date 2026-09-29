/**
 * `bfsShortestPath-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 거리와 꺼낸 차례는 정본과 같은 절차에 기록만 덧붙인
 * 사본(`-guide.proof.ts` 의 `traced`)이 내고, 그 사본은 부를 때마다 자기 답을 정본(`-guide.ref.ts`)과
 * 맞댄다. 시도 사다리의 수는 증명 사이드카가 작은 규모의 실행과 맞대어 확인한 식에서 받는다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `bfsShortestPath-guide.test.ts` 가 잰다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 정점 0~4 를 오각형으로 놓아 사이클이 한눈에 보이게 하고,
 * 간선이 없는 정점 5 는 오른쪽 아래에 떨어뜨려 둔다. 「거리 층」 그림은 좌표를 손으로 두지 않고 실행이
 * 낸 거리(세로)와 꺼낸 차례(가로)에서 낸다.
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
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  type Check,
  comma,
  END_STEP,
  ladderNumbers,
  layerOf,
  SOURCE,
  show,
  stepOf,
  WALK,
  WALK_EDGES,
  WALK_N,
} from "./bfsShortestPath-guide.proof.ts";
import { bfsShortestPath } from "./bfsShortestPath-guide.ref.ts";
import { bfsWalk } from "./bfsShortestPath-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 1.5, y: 0 },
    { id: 1, x: 3, y: 1 },
    { id: 2, x: 2.45, y: 2.5 },
    { id: 3, x: 0.55, y: 2.5 },
    { id: 4, x: 0, y: 1 },
    { id: 5, x: 4.3, y: 2.5 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: false,
};

const distText = (d: number): string => (d === -1 ? "거리 -1" : `거리 ${d}`);

/** 간선 번호 — 무향이라 두 방향 어느 쪽으로 물어도 같은 간선이다. */
const edgeIndex = (a: number, b: number): number =>
  WALK_EDGES.findIndex(
    ([u, v]) => (u === a && v === b) || (u === b && v === a),
  );

/** 이웃 검사 k 까지 정점을 처음 만나게 한 간선들 — 그림에서 굵은 실선(`tree`)으로 그린다. */
function discoveryEdges(upTo: number): Set<number> {
  const out = new Set<number>();
  WALK.checks.forEach((c, k) => {
    if (k <= upTo && c.fresh) out.add(edgeIndex(c.node, c.next));
  });
  return out;
}

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 실행과, 실행으로 확인한 식에서 ── */

function approaches(): Approach[] {
  const n = ladderNumbers();
  return [
    {
      name: "간선 목록을 라운드마다 다시 읽기",
      idea: "라운드마다 간선 전부를 읽어, 한쪽 끝만 거리가 있으면 다른 쪽을 채운다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `사슬 V = ${comma(n.big)} 에서 이웃 검사 ${comma(n.sweepTouches)} 번 · ${n.seconds(n.sweepTouches)}`,
          ok: false,
        },
      ],
      lesson:
        "새 거리를 만드는 간선은 거리가 막 정해진 정점에 붙은 것뿐이다 — 그 정점을 대기 목록에 모아 이웃만 보자",
    },
    {
      name: "대기 목록에서 나중 넣은 것 먼저",
      idea: "거리가 정해진 정점을 대기 목록에 모으고, 가장 나중에 넣은 것을 꺼내 이웃을 본다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `정점 ${n.lifoVertex} 에 거리 ${n.lifoGot}${을를(String(n.lifoGot))} 적는다 — 정본은 ${n.lifoWant}`,
          ok: false,
        },
        { label: "시간", value: "이웃 검사 2E 번", ok: true },
      ],
      lesson:
        "거리가 작은 정점이 대기 목록에 남았는데 큰 정점을 먼저 꺼냈다 — 거리가 작은 것부터 꺼내야 한다",
    },
    {
      name: "대기 목록에서 거리가 가장 작은 것 먼저",
      idea: "꺼낼 때마다 대기 목록을 차례로 읽어 거리가 가장 작은 정점을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `별 V = ${comma(n.big)} 에서 고를 때의 비교 ${comma(n.minCompares)} 번 · ${n.seconds(n.minCompares)}`,
          ok: false,
        },
      ],
      lesson:
        "거리 k 인 정점을 꺼내며 넣는 정점은 모두 거리 k + 1 이다 — 넣은 차례가 곧 거리 순서다",
    },
    {
      name: "먼저 넣은 것 먼저 — 큐",
      idea: "대기 목록을 큐로 쓴다. 앞에서 꺼내고, 처음 만난 이웃만 거리를 적어 뒤에 넣는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `이웃 검사 2E 번 · 사슬 V = ${comma(n.big)} 에서 ${comma(n.queueTouches)} 번, 고를 때의 비교 0`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const TOTAL = WALK.checks.length;

/** 걸음 하나의 무대. `k` 는 이웃 검사 차례이고, −1 은 시작, `TOTAL` 은 끝이다. */
function stage(k: number): GraphStep {
  const c: Check | undefined = WALK.checks[k];
  const start = Array.from({ length: WALK_N }, () => -1);
  start[SOURCE] = 0;
  const dist = k < 0 ? start : k >= TOTAL ? WALK.dist : (c as Check).dist;
  const end = k >= TOTAL;
  const nodes = dist.map((d, v) => {
    let state: CellState | undefined;
    if (k < 0 && v === SOURCE) state = "focus";
    else if (c && !end && v === c.next) state = c.fresh ? "focus" : "read";
    else if (c && !end && v === c.node) state = "read";
    if (d === -1)
      return end
        ? { value: distText(d), state: "out" as const }
        : { value: "", state: "empty" as const };
    return { value: distText(d), ...(state ? { state } : {}) };
  });
  const tree = discoveryEdges(end ? TOTAL : k);
  const here = c && !end ? edgeIndex(c.node, c.next) : -1;
  const edges = WALK_EDGES.map((_, i) => {
    const kind: EdgeKind | undefined = tree.has(i) ? "tree" : undefined;
    const state: GraphEdge["state"] =
      i === here ? ((c as Check).fresh ? "focus" : "read") : undefined;
    return { ...(kind ? { kind } : {}), ...(state ? { state } : {}) };
  });
  const queue = k < 0 ? [SOURCE] : end ? WALK.queue : (c as Check).queue;
  const head = k < 0 ? 0 : end ? WALK.queue.length : (c as Check).head;
  const states: Partial<Record<number, CellState>> = {};
  queue.forEach((_, i) => {
    if (end || i < head - 1) states[i] = "out";
    else if (i === head - 1) states[i] = "read";
  });
  if (k < 0) states[0] = "focus";
  else if (c && !end && c.fresh) states[queue.length - 1] = "focus";
  const calc: GraphStep["calc"] =
    k < 0
      ? { expr: `dist[${SOURCE}] =`, result: "0" }
      : end
        ? { expr: "head < queue.length →", result: "거짓" }
        : (c as Check).fresh
          ? {
              expr: `dist[${(c as Check).next}] = dist[${(c as Check).node}] + 1 =`,
              result: String((c as Check).dist[(c as Check).next]),
            }
          : { expr: `dist[${(c as Check).next}] !== -1 →`, result: "참" };
  return {
    nodes,
    edges,
    strips: [
      {
        label: "큐",
        values: [...queue],
        states,
        slots: WALK.queue.length,
      },
    ],
    calc,
    vars: `이웃 검사 ${k < 0 ? 0 : Math.min(k + 1, TOTAL)} / ${TOTAL}`,
  };
}

function stepTitle(k: number): string {
  if (k < 0) return `T1 출발 정점 ${SOURCE}${을를(String(SOURCE))} 큐에 넣는다`;
  if (k >= TOTAL) return `${END_STEP} 큐가 비어 끝난다`;
  const c = WALK.checks[k] as Check;
  return `${stepOf(k)} 정점 ${c.node} 의 이웃 ${c.next} — ${c.fresh ? "처음 만난다" : "이미 거리가 있다"}`;
}

function stepText(k: number): string {
  if (k < 0)
    return `dist[${SOURCE}] 에 0 을 적고 정점 ${SOURCE}${을를(String(SOURCE))} 큐에 넣습니다. 나머지 정점은 아직 거리가 없습니다.`;
  if (k >= TOTAL) {
    const out = WALK.dist
      .map((d, v) => ({ d, v }))
      .filter((x) => x.d === -1)
      .map((x) => x.v);
    return `head 가 큐 길이 ${WALK.queue.length} 에 이르러 꺼낼 정점이 없습니다. 큐에 한 번도 안 들어간 정점 ${out.join(" · ")} 의 거리는 -1 로 남고, 반환값은 ${show(WALK.dist)} 입니다.`;
  }
  const c = WALK.checks[k] as Check;
  const d = c.dist[c.node] as number;
  return c.fresh
    ? `dist[${c.next}] 가 -1 이라 처음 만나는 정점입니다. 꺼낸 정점 ${c.node} 의 거리 ${d} 에 1 을 더해 적고 큐 뒤에 넣습니다.`
    : `dist[${c.next}] 에 이미 ${c.before}${이가(String(c.before))} 적혀 있습니다. 지금 온 길은 ${d + 1} 이라 더 짧지 않으니 그대로 둡니다.`;
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

/** 거리 층 배치 — 세로는 실행이 낸 거리, 가로는 같은 층 안에서 꺼낸 차례. 도달하지 못한 정점은 오른쪽 끝. */
function layeredNodes(): GraphNode[] {
  const byLayer = new Map<number, number[]>();
  for (const v of WALK.queue) {
    const d = WALK.dist[v] as number;
    byLayer.set(d, [...(byLayer.get(d) ?? []), v]);
  }
  const widest = Math.max(...[...byLayer.values()].map((l) => l.length));
  const nodes: GraphNode[] = [];
  for (const [d, list] of byLayer) {
    const offset = (widest - list.length) / 2;
    list.forEach((v, i) => {
      nodes.push({ id: v, x: (offset + i) * 1.6, y: d, value: distText(d) });
    });
  }
  const out = WALK.dist.map((d, v) => ({ d, v })).filter((x) => x.d === -1);
  out.forEach((x, i) => {
    nodes.push({
      id: x.v,
      x: widest * 1.6 + 0.6,
      y: 1 + i,
      value: distText(-1),
      state: "out",
    });
  });
  return nodes.sort((a, b) => Number(a.id) - Number(b.id));
}

function layerGroups() {
  const byLayer = new Map<number, number[]>();
  WALK.dist.forEach((d, v) => {
    byLayer.set(d, [...(byLayer.get(d) ?? []), v]);
  });
  return [...byLayer.entries()]
    .sort((a, b) => (a[0] === -1 ? 1 : b[0] === -1 ? -1 : a[0] - b[0]))
    .map(([d, members]) => ({
      members,
      label: d === -1 ? "층 밖" : `층 ${d}`,
    }));
}

/** 최악을 만드는 두 모양을 정점 여섯으로 줄여 한 장에 — 별은 위, 사슬은 아래. 거리는 정본이 낸다. */
function worstShapes(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const v = 6;
  const star: [number, number][] = Array.from(
    { length: v - 1 },
    (_, i) => [0, i + 1] as [number, number],
  );
  const chain: [number, number][] = Array.from(
    { length: v - 1 },
    (_, i) => [i, i + 1] as [number, number],
  );
  const ds = bfsShortestPath(v, star, 0);
  const dc = bfsShortestPath(v, chain, 0);
  const around = [
    { x: 1, y: 0 },
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1.3 },
    { x: 2, y: 1.3 },
    { x: 1, y: 1.6 },
  ];
  const nodes: GraphNode[] = [
    ...ds.map((d, i) => {
      const p =
        i === 0 ? { x: 1, y: 0.75 } : (around[i] as { x: number; y: number });
      return {
        id: `s${i}`,
        label: String(i),
        x: p.x,
        y: p.y,
        value: distText(d),
      };
    }),
    ...dc.map((d, i) => ({
      id: `c${i}`,
      label: String(i),
      x: i,
      y: 3,
      value: distText(d),
    })),
  ];
  const edges: GraphEdge[] = [
    ...star.map(([a, b]) => ({ from: `s${a}`, to: `s${b}` })),
    ...chain.map(([a, b]) => ({ from: `c${a}`, to: `c${b}` })),
  ];
  return { nodes, edges };
}

export const FIGS: Record<string, () => ReactElement> = {
  "worst-shapes": () => {
    const g = worstShapes();
    return (
      <NodeGraph
        title="정점 여섯으로 줄여 그린 두 모양 — 정점 안의 수는 정점 0 에서의 거리"
        directed={false}
        nodes={g.nodes}
        edges={g.edges}
        groups={[
          {
            members: g.nodes
              .filter((n) => String(n.id).startsWith("s"))
              .map((n) => n.id),
            label: "별 모양",
          },
          {
            members: g.nodes
              .filter((n) => String(n.id).startsWith("c"))
              .map((n) => n.id),
            label: "사슬",
          },
        ]}
      />
    );
  },
  "concept-distance": () => {
    const order = WALK.queue;
    return (
      <NodeGraph
        title="전개 입력 — 정점 안의 수는 출발 정점 0 에서의 거리"
        directed={false}
        nodes={LAYOUT.nodes.map((n) => ({
          ...n,
          value: distText(WALK.dist[n.id] as number),
          ...(WALK.dist[n.id] === -1 ? { state: "out" as const } : {}),
        }))}
        edges={LAYOUT.edges}
        strips={[
          { label: "꺼낸 차례", values: [...order] },
          {
            label: "그 거리",
            values: order.map((v) => WALK.dist[v] as number),
          },
        ]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    const n = ladderNumbers();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`제약 V = E = ${comma(n.big)} · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-revisit": () => {
    const k = WALK.checks.findIndex(
      (c) => !c.fresh && (c.dist[c.node] as number) === c.before,
    );
    const c = WALK.checks[k] as Check;
    const come = (c.dist[c.node] as number) + 1;
    const here = edgeIndex(c.node, c.next);
    return (
      <NodeGraph
        title={`${stepOf(k)} — 정점 ${c.node}${을를(String(c.node))} 꺼내 이웃 ${c.next}${을를(String(c.next))} 볼 때`}
        directed={false}
        nodes={LAYOUT.nodes.map((n) => {
          const d = c.dist[n.id] as number;
          const state: CellState | undefined =
            n.id === c.node || n.id === c.next
              ? "read"
              : d === -1
                ? "out"
                : undefined;
          return { ...n, value: distText(d), ...(state ? { state } : {}) };
        })}
        edges={WALK_EDGES.map(([from, to], i) => ({
          from,
          to,
          ...(i === here
            ? {
                state: "read" as const,
                label: `지금 온 길 ${come} · 적힌 값 ${c.before}`,
              }
            : { state: "out" as const }),
        }))}
      />
    );
  },
  "walk-bfs": () => <Film spec={bfsWalk as unknown as PlayerSpec} />,
  "related-layers": () => (
    <NodeGraph
      title="거리 층 — 세로가 거리, 같은 층 안의 간선은 강조"
      directed={false}
      unit={{ x: 104, y: 96 }}
      nodes={layeredNodes()}
      edges={WALK_EDGES.map(([from, to]) => ({
        from,
        to,
        ...(layerOf(from, to) === "같은 층 안"
          ? { state: "focus" as const, label: "같은 층 안" }
          : {}),
      }))}
      groups={layerGroups()}
    />
  ),
};
