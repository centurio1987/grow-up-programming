/**
 * `topologicalSort-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 진입 차수와 꺼낸 차례는 정본과 같은 절차에 기록만 덧붙인
 * 사본(`-guide.proof.ts` 의 `traced`)이 내고, 그 사본은 부를 때마다 자기 답을 정본(`-guide.ref.ts`)과
 * 맞댄다. 시도 사다리의 수는 증명 사이드카가 작은 규모의 실행과 맞대어 확인한 식에서 받는다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `topologicalSort-guide.test.ts` 가 잰다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 처음 후보 5 와 4 를 맨 위에, 그 아래 줄에 2 와 0 을, 맨 아래
 * 줄에 3 과 1 을 둬서 간선이 모두 아래나 옆으로 흐르게 했다. 「한 줄로 놓은 답」 그림은 좌표를 손으로 두지
 * 않고 정본이 낸 순서에서 낸다.
 */

import type { ReactElement } from "react";
import { 과와, 을를 } from "../../../../tools/josa.ts";
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
  chain,
  comma,
  END_STEP,
  ladderNumbers,
  type Pop,
  show,
  star,
  stepOf,
  traced,
  WALK,
  WALK_EDGES,
  WALK_N,
} from "./topologicalSort-guide.proof.ts";
import { topologicalSort } from "./topologicalSort-guide.ref.ts";
import { topoWalk } from "./topologicalSort-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 1.2, y: 1.3 },
    { id: 1, x: 2.4, y: 2.6 },
    { id: 2, x: 0, y: 1.3 },
    { id: 3, x: 0, y: 2.6 },
    { id: 4, x: 2.4, y: 0 },
    { id: 5, x: 0, y: 0 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
};

const ANSWER = topologicalSort(WALK_N, WALK_EDGES) as number[];
const inText = (d: number): string => `진입 ${d}`;

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 실행과, 실행으로 확인한 식에서 ── */

function approaches(): Approach[] {
  const n = ladderNumbers();
  return [
    {
      name: "순열 전수 검사",
      idea: "정점의 나열을 전부 만들어, 모든 간선의 방향을 지키는 것이 나올 때까지 하나씩 검사한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `V = ${comma(n.big)} 이면 나열의 수 V! 만 ${comma(n.digits)} 자리`,
          ok: false,
        },
      ],
      lesson:
        "나열을 통째로 고르지 말고 한 자리씩 정하자 — 맨 앞에는 들어오는 간선이 없는 정점을 놓는다",
    },
    {
      name: "간선 목록을 자리마다 다시 읽기",
      idea: "자리 하나를 정할 때마다 간선 목록 전체를 읽어, 아직 안 뺀 정점에서 오는 간선이 없는 정점을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `사슬 V = ${comma(n.big)} 에서 원소 ${comma(n.scanEdges)} 개 · ${n.seconds(n.scanEdges)}`,
          ok: false,
        },
      ],
      lesson:
        "자리마다 간선 E 개를 다시 읽는다 — 정점마다 진입 차수를 한 번 세어 두고 뺄 때 줄이자",
    },
    {
      name: "진입 차수 배열을 매 바퀴 읽기",
      idea: "진입 차수를 세어 두고, 자리마다 배열을 앞에서부터 읽어 0 인 정점을 찾는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `사슬 V = ${comma(n.big)} 에서 원소 ${comma(n.scanArray)} 개 · ${n.seconds(n.scanArray)}`,
          ok: false,
        },
      ],
      lesson:
        "진입 차수가 0 이 되는 때는 그 값을 줄이는 순간뿐이다 — 그 자리에서 담아 두자",
    },
    {
      name: "0 이 되는 순간 큐에 담기",
      idea: "진입 차수가 0 인 정점을 큐에 담고, 꺼낼 때마다 나가는 간선의 머리를 줄여 0 이 되면 담는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `사슬 V = ${comma(n.big)} 에서 원소 ${comma(n.queue)} 개 · ${n.seconds(n.queue)}`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const E = WALK_EDGES.length;

/** `k` 번째 꺼내기까지 줄인 간선 — 꺼낸 정점에서 나가는 간선 전부다. */
const removedBefore = (order: readonly number[]) =>
  new Set(
    WALK_EDGES.flatMap(([u], i) => (order.includes(u) ? [i] : [])) as number[],
  );

/** 걸음 하나의 무대. `k` 는 꺼내기 차례이고, −1 은 준비, 꺼내기 수와 같으면 끝이다. */
function stage(k: number): GraphStep {
  const total = WALK.pops.length;
  const p: Pop | undefined = WALK.pops[k];
  const end = k >= total;
  const prevOrder = k <= 0 ? [] : ((WALK.pops[k - 1] as Pop).order ?? []);
  const deg = k < 0 ? WALK.start : end ? WALK.indegree : (p as Pop).indegree;
  const order = k < 0 ? [] : end ? WALK.order : (p as Pop).order;
  const queue = k < 0 ? WALK.seeds : end ? WALK.queue : (p as Pop).queue;
  const head = k < 0 ? 0 : end ? WALK.queue.length : (p as Pop).head;
  const changed = new Set(!end && p ? p.decs.map((d) => d.v) : []);
  const nodes = deg.map((d, v) => {
    let state: CellState | undefined;
    if (end || prevOrder.includes(v)) state = "out";
    else if (k < 0 && WALK.seeds.includes(v)) state = "focus";
    else if (p && v === p.u) state = "read";
    else if (changed.has(v)) state = "focus";
    return { value: inText(d), ...(state ? { state } : {}) };
  });
  const gone = removedBefore(prevOrder);
  const now = new Set(
    !end && p
      ? WALK_EDGES.flatMap(([u], i) => (u === p.u ? [i] : []))
      : ([] as number[]),
  );
  const edges = WALK_EDGES.map((_, i) => {
    const state: GraphEdge["state"] = end
      ? "out"
      : now.has(i)
        ? "read"
        : gone.has(i)
          ? "out"
          : undefined;
    return state ? { state } : {};
  });
  const qStates: Partial<Record<number, CellState>> = {};
  queue.forEach((_, i) => {
    if (end || i < head - 1) qStates[i] = "out";
    else if (i === head - 1 && k >= 0) qStates[i] = "read";
  });
  if (k < 0) {
    for (let i = 0; i < queue.length; i++) qStates[i] = "focus";
  } else if (!end && p) {
    const pushed = p.decs.filter((d) => d.pushed).length;
    for (let i = queue.length - pushed; i < queue.length; i++)
      qStates[i] = "focus";
  }
  const oStates: Partial<Record<number, CellState>> =
    !end && k >= 0 ? { [order.length - 1]: "focus" } : {};
  const decs = !end && p ? p.decs : [];
  const calc: GraphStep["calc"] =
    k < 0
      ? { expr: "진입 차수가 0 인 정점 →", result: WALK.seeds.join(" · ") }
      : end
        ? {
            expr: `order.length === n → ${order.length} === ${WALK_N} →`,
            result: order.length === WALK_N ? "참" : "거짓",
          }
        : decs.length === 0
          ? {
              expr: `next[${(p as Pop).u}] =`,
              result: show(WALK.next[(p as Pop).u] as number[]),
            }
          : {
              expr: decs
                .map((d, i) =>
                  i < decs.length - 1
                    ? `indegree[${d.v}] = ${d.before} − 1 = ${d.after}`
                    : `indegree[${d.v}] = ${d.before} − 1 =`,
                )
                .join(" · "),
              result: String((decs.at(-1) as { after: number }).after),
            };
  const done =
    k < 0
      ? 0
      : WALK.pops.slice(0, k + 1).reduce((s, x) => s + x.decs.length, 0);
  return {
    nodes,
    edges,
    strips: [
      {
        label: "큐",
        values: [...queue],
        states: qStates,
        slots: WALK_N,
      },
      {
        label: "order",
        values: [...order],
        states: oStates,
        slots: WALK_N,
      },
    ],
    calc,
    vars: `head = ${head} · 줄인 간선 ${end ? E : done} / ${E}`,
  };
}

function stepTitle(k: number): string {
  if (k < 0) return "T1 진입 차수를 세고 0 인 정점을 담는다";
  if (k >= WALK.pops.length) return `${END_STEP} 큐가 비어 끝난다`;
  const p = WALK.pops[k] as Pop;
  return `${stepOf(k)} 정점 ${p.u}${을를(p.u)} 꺼낸다`;
}

function stepText(k: number): string {
  if (k < 0)
    return `간선 ${E} 개를 한 번씩 읽어 정점마다 진입 차수를 셉니다. 진입 차수가 0 인 정점 ${WALK.seeds.join(" · ")}${을를(WALK.seeds.at(-1) ?? 0)} 번호 순서로 큐에 담습니다.`;
  if (k >= WALK.pops.length)
    return `head 가 큐 길이 ${WALK.queue.length} 에 이르러 꺼낼 정점이 없습니다. order 에 정점 ${WALK.order.length} 개가 다 들어갔으니 ${show(WALK.order)}${을를(WALK.order.at(-1) ?? 0)} 돌려줍니다.`;
  const p = WALK.pops[k] as Pop;
  if (p.decs.length === 0)
    return `정점 ${p.u}${을를(p.u)} order 뒤에 붙입니다. 나가는 간선이 없어 줄일 진입 차수가 없습니다.`;
  const zero = p.decs.filter((d) => d.pushed).map((d) => d.v);
  const left = p.decs.filter((d) => !d.pushed).map((d) => d.v);
  const parts = [
    `정점 ${p.u}${을를(p.u)} order 뒤에 붙이고, 나가는 간선의 머리 ${p.decs.map((d) => d.v).join(" · ")} 의 진입 차수를 하나씩 줄입니다.`,
  ];
  if (zero.length > 0)
    parts.push(
      `${zero.join(" · ")} 의 진입 차수가 0 이 되어 그 자리에서 큐 뒤에 담습니다.`,
    );
  if (left.length > 0)
    parts.push(
      `${left.join(" · ")} 의 진입 차수는 아직 0 이 아니라 담지 않습니다.`,
    );
  return parts.join(" ");
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return Array.from({ length: WALK.pops.length + 2 }, (_, i) => i - 1).map(
    (k) => ({ title: stepTitle(k), text: stepText(k), ...stage(k) }),
  );
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

/**
 * 답을 왼쪽에서 오른쪽으로 놓은 배치 — 가로 자리는 정본이 낸 순서다. 한 줄에 다 놓으면 먼 간선이 가운데
 * 정점을 뚫고 지나가서, 자리를 두 줄로 번갈아 놓는다(짝수 자리는 위, 홀수 자리는 아래).
 */
function orderLine(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = ANSWER.map((v, i) => ({
    id: v,
    x: i,
    y: (i % 2) * 1.2,
    value: `자리 ${i}`,
  })).sort((a, b) => a.id - b.id);
  return { nodes, edges: LAYOUT.edges };
}

/** 최악을 만드는 두 모양을 정점 여섯으로 줄여 한 장에 — 별은 위, 사슬은 아래. 진입 차수는 실행이 낸다. */
function worstShapes(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const v = 6;
  const s = traced(v, star(v));
  const c = traced(v, chain(v));
  const around = [
    { x: 2, y: 0 },
    { x: 0, y: 1.2 },
    { x: 1, y: 1.2 },
    { x: 2, y: 1.2 },
    { x: 3, y: 1.2 },
    { x: 4, y: 1.2 },
  ];
  const nodes: GraphNode[] = [
    ...s.start.map((d, i) => {
      const p = around[i] as { x: number; y: number };
      return {
        id: `s${i}`,
        label: String(i),
        x: p.x,
        y: p.y,
        value: inText(d),
      };
    }),
    ...c.start.map((d, i) => ({
      id: `c${i}`,
      label: String(i),
      x: i * 0.8,
      y: 3,
      value: inText(d),
    })),
  ];
  const edges: GraphEdge[] = [
    ...star(v).map(([a, b]) => ({ from: `s${a}`, to: `s${b}` })),
    ...chain(v).map(([a, b]) => ({ from: `c${a}`, to: `c${b}` })),
  ];
  return { nodes, edges };
}

/** T3 이 끝난 뒤의 모습 — 결과에 넣은 정점과 그 간선은 흐리게. */
const T3 = WALK.pops[1] as Pop;

function afterT3Nodes(): GraphNode[] {
  return LAYOUT.nodes.map((n) => {
    const d = T3.indegree[n.id] as number;
    const state: CellState | undefined = T3.order.includes(n.id)
      ? "out"
      : T3.decs.some((x) => x.v === n.id && x.pushed)
        ? "focus"
        : undefined;
    return { ...n, value: inText(d), ...(state ? { state } : {}) };
  });
}

function afterT3Edges(): GraphEdge[] {
  const gone = removedBefore(T3.order);
  return LAYOUT.edges.map((e, i) =>
    gone.has(i) ? { ...e, state: "out" as const } : e,
  );
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-graph": () => (
    <NodeGraph
      title={`정점 ${WALK_N} 개 · 간선 ${E} 개 — 간선 u→v 는 u 가 v 보다 먼저라는 제약`}
      nodes={LAYOUT.nodes}
      edges={LAYOUT.edges}
    />
  ),
  "concept-order": () => {
    const g = orderLine();
    return (
      <NodeGraph
        title={`답 하나 ${show(ANSWER)}${을를(ANSWER.at(-1) ?? 0)} 왼쪽부터 놓으면 간선이 모두 오른쪽을 향한다`}
        unit={{ x: 104, y: 84 }}
        nodes={g.nodes}
        edges={g.edges}
      />
    );
  },
  "concept-indegree": () => (
    <NodeGraph
      title="정점 안의 수는 진입 차수 — 그 정점으로 들어오는 간선의 수"
      nodes={LAYOUT.nodes.map((n) => {
        const d = WALK.start[n.id] as number;
        return {
          ...n,
          value: inText(d),
          ...(d === 0 ? { state: "focus" as const } : {}),
        };
      })}
      edges={LAYOUT.edges}
    />
  ),
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
  "build-remove": () => (
    <NodeGraph
      title={`${stepOf(1)} 뒤 — 결과에 넣은 정점 ${T3.order.join(" · ")}${과와(T3.order.at(-1) ?? 0)} 그 간선을 지운 셈 친다`}
      nodes={afterT3Nodes()}
      edges={afterT3Edges()}
      strips={[
        {
          label: "큐",
          values: [...T3.queue.slice(T3.head)],
          states: Object.fromEntries(
            T3.queue.slice(T3.head).map((_, i) => [i, "focus" as const]),
          ),
          slots: WALK_N,
        },
        { label: "order", values: [...T3.order], slots: WALK_N },
      ]}
    />
  ),
  "walk-topo": () => <Film spec={topoWalk as unknown as PlayerSpec} />,
  "invariant-state": () => (
    <NodeGraph
      title={`${stepOf(1)} 뒤 — order 밖 정점의 진입 차수는 order 밖에서 오는 간선의 수`}
      nodes={afterT3Nodes().map((n) =>
        n.state === "focus" ? { ...n, state: undefined } : n,
      )}
      edges={afterT3Edges()}
      groups={[
        {
          members: LAYOUT.nodes
            .filter((n) => !T3.order.includes(n.id))
            .map((n) => n.id),
          label: "order 밖",
        },
      ]}
      strips={[{ label: "order", values: [...T3.order], slots: WALK_N }]}
    />
  ),
  "worst-shapes": () => {
    const g = worstShapes();
    return (
      <NodeGraph
        title="정점 여섯으로 줄여 그린 두 모양 — 정점 안의 수는 진입 차수"
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
};
