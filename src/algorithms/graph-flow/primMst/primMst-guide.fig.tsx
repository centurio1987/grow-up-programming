/**
 * `primMst-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 최소 신장 트리의 합은 정본(`-guide.ref.ts`)이 낸 답이고,
 * 걸음마다의 트리 안 정점 · 우선순위 큐의 내용 · 고른 간선은 정본과 같은 절차에 기록만 덧붙인 사본
 * (`-guide.proof.ts` 의 `traced`)이 낸다. 그 사본이 정본과 같은 답을 내는지는 증명 사이드카가 읽힐 때
 * 스스로 확인한다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `primMst-guide.test.ts` 가 잰다.
 *
 * ## 그래프 무대를 프림에 쓰는 규약 — 앞의 두 편을 합친다
 *
 * 간선 규약은 `kruskalMst` 편(`kruskalMst-guide.fig.tsx` 머리 주석), 우선순위 큐 띠 규약은 `dijkstra`
 * 편(`dijkstra-guide.fig.tsx` 머리 주석)을 그대로 쓴다. 그 규약이 예고한 대로 띠만 우선순위 큐로 바꾼다.
 *
 * - **간선** — 가중치를 머리말로 늘 붙인다. 트리에 넣은 간선은 굵은 실선(`tree`), 지나간 후보로 버린
 *   항목이 온 간선은 대시(`back`)다. 이번 걸음에 트리에 넣은 간선은 새로 씀, 이번 걸음에 후보로 넣은
 *   간선과 버린 항목의 간선은 읽음이다. 무향 그래프라 화살촉이 없다.
 * - **정점** — 트리 안 정점은 「트리 · 키」(트리에 넣을 때 치른 값), 트리 밖이면서 큐에 항목이 있는
 *   정점은 「후보 · 키」(그 정점짜리 항목 중 가장 작은 키), 항목이 없는 정점은 아직(점선)이다. 이번
 *   걸음에 값이 바뀐 정점은 새로 씀, 지나간 후보로 꺼낸 정점은 읽음이다.
 * - **묶음** — 트리 안 정점 `S` 를 테 하나로 두르고 머리말을 「트리 안 S」로 단다. 경계 간선이 곧 이
 *   테를 가로지르는 간선이다. 이번 걸음에 정점이 늘었으면 강조 테다.
 * - **띠** — 무대 아래 두 줄이 우선순위 큐를 **꺼낼 차례대로** 늘어놓은 것이다(`dijkstra` 규약). 윗줄이
 *   정점, 아랫줄이 키이고 같은 칸 번호가 항목 하나다. 이번 걸음에 넣은 항목은 새로 씀, 지나간 후보
 *   (가리키는 정점이 이미 트리 안인 항목)는 이번 걸음 밖(대시 테)이다. 칸 수는 큐가 가장 커졌을 때에
 *   맞춰 고정한다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — `kruskalMst` 편과 같은 2 × 3 격자라 두 편의 그림이 같은
 * 모양이고, 간선 일곱이 격자의 가로 넷과 세로 셋에 맞아 선이 서로 건너지 않는다.
 */

import type { ReactElement } from "react";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
  type GraphStrip,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  CONCEPT_T,
  CUT_READ_T,
  comma,
  crossingOf,
  drainOrder,
  type Edge,
  edgeOf,
  INV_T,
  type Item,
  isStale,
  itemText,
  MST,
  members,
  originNumbers,
  type Step,
  staleEdgesAfter,
  stepAt,
  treeEdgesAfter,
  WALK,
  WALK_EDGES,
  WALK_N,
} from "./primMst-guide.proof.ts";
import { primMst } from "./primMst-guide.ref.ts";
import { primWalk } from "./primMst-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. 간선은 입력의 차례다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 1.5, y: 0 },
    { id: 1, x: 3, y: 0 },
    { id: 2, x: 3, y: 1.6 },
    { id: 3, x: 1.5, y: 1.6 },
    { id: 4, x: 0, y: 1.6 },
    { id: 5, x: 0, y: 0 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: false,
};

const ANSWER = primMst(WALK_N, WALK_EDGES);
const SLOTS = WALK.maxItems;
const inMst = (e: Edge): boolean =>
  MST.some(
    (m) => m[0] === Math.min(e[0], e[1]) && m[1] === Math.max(e[0], e[1]),
  );

/* ── 걸음 하나의 무대 ── */

/** 정점이 지금 달고 있는 값 — 트리 안이면 넣을 때 치른 키, 밖이면 큐에 있는 가장 작은 키. */
function nodeValues(s: Step): (string | null)[] {
  const paid: (number | null)[] = Array.from({ length: WALK_N }, () => null);
  for (const x of WALK.steps) {
    if (x.kind === "join" && x.popped) paid[x.popped[0]] = x.popped[1];
    if (x.t === s.t) break;
  }
  return Array.from({ length: WALK_N }, (_, v) => {
    if (s.inTree[v] === true) return `트리 · ${paid[v]}`;
    const keys = s.heap.filter((x) => x[0] === v).map((x) => x[1]);
    return keys.length === 0 ? null : `후보 · ${Math.min(...keys)}`;
  });
}

/** 우선순위 큐의 띠 둘 — 꺼낼 차례대로. 넣은 항목은 새로 씀, 지나간 후보는 이번 걸음 밖. */
function queueStrips(s: Step, slots = SLOTS): GraphStrip[] {
  const order = drainOrder(s.heap);
  const pushed = new Set(s.pushed.map(itemText));
  const states: Partial<Record<number, CellState>> = {};
  order.forEach((x, i) => {
    if (isStale(s, x)) states[i] = "out";
    else if (pushed.has(itemText(x))) states[i] = "focus";
  });
  return [
    { label: "큐 · 정점", values: order.map(([v]) => v), states, slots },
    { label: "큐 · 키", values: order.map(([, k]) => k), states, slots },
  ];
}

/** 트리 안 정점의 테. 비었으면 자리만 잡는다. */
function treeGroup(s: Step, grew: boolean): GraphGroup[] {
  const m = members(s.inTree);
  return m.length === 0
    ? []
    : [{ members: m, label: "트리 안 S", ...(grew ? { state: "focus" } : {}) }];
}

function stage(i: number): GraphStep {
  const s = WALK.steps[i] as Step;
  const prev = i > 0 ? (WALK.steps[i - 1] as Step) : null;
  const now = nodeValues(s);
  const was = prev ? nodeValues(prev) : now.map(() => null);
  const tree = treeEdgesAfter(s.t);
  const stale = staleEdgesAfter(s.t);
  const popped = s.popped ? edgeOf(s.popped) : -1;
  const pushedEdges = new Set(
    s.pushed.map((x) => edgeOf(x)).filter((e) => e >= 0),
  );
  const nodes = now.map((value, v) => {
    if (value === null) return { value: "", state: "empty" as const };
    let state: CellState | undefined;
    if (s.kind === "stale" && s.popped?.[0] === v) state = "read";
    else if (value !== was[v]) state = "focus";
    return { value, ...(state ? { state } : {}) };
  });
  const edges = WALK_EDGES.map((e, k) => {
    const kind: GraphEdge["kind"] = tree.has(k)
      ? "tree"
      : stale.has(k)
        ? "back"
        : undefined;
    const state: GraphEdge["state"] =
      k === popped
        ? s.kind === "stale"
          ? "read"
          : "focus"
        : pushedEdges.has(k)
          ? "read"
          : undefined;
    return {
      ...(kind ? { kind } : {}),
      ...(state ? { state } : {}),
      label: String(e[2]),
    };
  });
  let calc: GraphStep["calc"];
  if (s.kind === "start") {
    calc = {
      expr: "pq.push(0, 0) →",
      result: `항목 ${itemText(s.pushed[0] as Item)}`,
    };
  } else if (s.done) {
    calc = { expr: `joined === ${WALK_N} →`, result: "참" };
  } else {
    const u = (s.popped as Item)[0];
    calc = {
      expr: `inTree[${u}] === true →`,
      result: s.kind === "stale" ? "참" : "거짓",
    };
  }
  return {
    nodes,
    edges,
    groups: treeGroup(
      s,
      prev !== null && members(s.inTree).length > members(prev.inTree).length,
    ),
    strips: queueStrips(s),
    calc,
    vars: `total = ${s.total} · joined = ${s.joined} / ${WALK_N}`,
  };
}

function stepTitle(s: Step): string {
  if (s.kind === "start") {
    return `${s.t} 시작값 — 큐에 ${itemText(s.pushed[0] as Item)}`;
  }
  const x = s.popped as Item;
  const got = `${s.t} 항목 ${itemText(x)}${을를(itemText(x))} 꺼낸다`;
  if (s.kind === "stale") return `${got} — 지나간 후보라 버린다`;
  if (s.done) return `${got} — 정점 ${x[0]}${을를(String(x[0]))} 넣어 다 찼다`;
  return `${got} — 정점 ${x[0]}${을를(String(x[0]))} 트리에 넣는다`;
}

function stepText(s: Step): string {
  if (s.kind === "start") {
    return `간선 목록을 이웃 목록으로 바꾸고, 정점 0 을 키 0 짜리 항목으로 우선순위 큐에 넣습니다. 트리에 든 정점은 아직 없고 total 은 0 입니다.`;
  }
  const x = s.popped as Item;
  if (s.kind === "stale") {
    const v = String(x[0]);
    return `정점 ${v}${은는(v)} 이미 트리 안입니다. 이 항목은 정점 ${v}${이가(v)} 더 가벼운 간선으로 들어가기 전에 넣어 둔 지나간 후보라, 이웃을 보지 않고 버립니다.`;
  }
  const v = String(x[0]);
  const k = String(x[1]);
  const t = String(s.total);
  const head = `정점 ${v}${은는(v)} 트리 밖이라 트리에 넣고 total 에 키 ${k}${을를(k)} 더해 ${t}${이가(t)} 됩니다.`;
  if (s.done) {
    const left = s.heap.map(itemText).join(" ");
    return `${head} 정점 ${WALK_N} 개가 다 차 ${t}${을를(t)} 돌려주고, 큐에 남은 ${left}${은는(left)} 꺼내지 않습니다.`;
  }
  const pushed =
    s.pushed.length === 0
      ? "트리 밖 이웃이 없어 넣을 후보가 없습니다."
      : `트리 밖 이웃을 항목 ${s.pushed.map(itemText).join(" · ")}${으로(s.pushed.map(itemText).join(" · "))} 넣습니다.`;
  return `${head} ${pushed}`;
}

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return WALK.steps.map((s, i) => ({
    title: stepTitle(s),
    text: stepText(s),
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

/* ── 정적 그림 ── */

const plainNodes = (): GraphNode[] => LAYOUT.nodes.map((n) => ({ ...n }));

const inputEdges = (): GraphEdge[] =>
  WALK_EDGES.map(([from, to, w]) => ({ from, to, label: String(w) }));

/**
 * 트리 안 정점 `S` 와 경계 간선을 한 장에 — 트리에 넣은 간선은 굵게, 경계 간선은 읽음, 그중 가장
 * 가벼운 것은 새로 씀, 양 끝이 다 밖인 간선은 흐리게.
 */
function cutScene(s: Step): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  groups: GraphGroup[];
} {
  const cross = crossingOf(s.inTree);
  const best = cross.reduce((a, b) =>
    (WALK_EDGES[b] as Edge)[2] < (WALK_EDGES[a] as Edge)[2] ? b : a,
  );
  const tree = treeEdgesAfter(s.t);
  return {
    nodes: LAYOUT.nodes.map((n) => ({
      ...n,
      value: s.inTree[n.id] === true ? "트리 안" : "트리 밖",
      ...(s.inTree[n.id] === true ? {} : { state: "empty" as const }),
    })),
    edges: WALK_EDGES.map(([from, to, w], k) => {
      const crossing = cross.includes(k);
      const inside = s.inTree[from] === true && s.inTree[to] === true;
      return {
        from,
        to,
        label: String(w),
        ...(tree.has(k) ? { kind: "tree" as const } : {}),
        ...(k === best
          ? { state: "focus" as const }
          : crossing
            ? { state: "read" as const }
            : inside
              ? {}
              : { state: "out" as const }),
      };
    }),
    groups: [{ members: members(s.inTree), label: "트리 안 S" }],
  };
}

function approaches(): Approach[] {
  const o = originNumbers();
  return [
    {
      name: "신장 트리를 전부 만들기",
      idea: "간선 E 개에서 V − 1 개를 고르는 부분집합을 전부 만들어 신장 트리인 것 중 가장 가벼운 것을 남긴다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `완전 그래프 V = ${o.treeV} 에서 신장 트리만 ${o.treeCount} 개 · ${o.treeTime}`,
          ok: false,
        },
      ],
      lesson:
        "트리를 통째로 고르면 가짓수가 폭발한다 — 정점을 하나씩 붙이며 경계 간선 중 가장 가벼운 것을 고르자",
    },
    {
      name: "경계 간선을 매번 다시 찾기",
      idea: "정점을 하나 붙일 때마다 간선 목록 전부를 읽어 경계 간선 중 가장 가벼운 것을 찾는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `완전 그래프 40 정점에서 ${comma(o.aComplete)} 번 — 정점마다 하나 들고 있는 방식의 ${Math.round(o.aComplete / o.bComplete)} 배`,
          ok: false,
        },
      ],
      lesson:
        "이미 본 간선을 걸음마다 다시 읽는다 — 정점을 넣을 때 그 정점의 간선만 보고 후보를 들고 있자",
    },
    {
      name: "정점마다 가장 가벼운 간선 하나 들고 있기",
      idea: "트리 밖 정점마다 트리와 잇는 가장 가벼운 간선 하나를 배열에 적고, 걸음마다 트리 밖 정점을 전부 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `한 줄로 이은 100 정점에서 ${comma(o.bPath)} 번 — 우선순위 큐는 ${comma(o.qPath)} 번`,
          ok: false,
        },
      ],
      lesson:
        "간선은 한 번씩 보지만 걸음마다 정점을 전부 본다 — 가장 작은 후보를 바로 내주는 저장소가 필요하다",
    },
    {
      name: "경계 간선을 우선순위 큐에 담아 가장 가벼운 것부터 꺼내기",
      idea: "새로 넣은 정점의 트리 밖 이웃을 항목으로 넣고, 키가 가장 작은 항목을 꺼내 그 정점이 아직 밖이면 트리에 넣는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `간선마다 항목이 많아야 하나 — 완전 그래프 40 정점에서는 ${comma(o.qComplete)} 번으로 정점마다 하나 들고 있는 방식보다 많다`,
          ok: null,
        },
      ],
    },
  ];
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-graph": () => (
    <NodeGraph
      title="전개 입력 — 정점 여섯 · 간선 일곱, 간선 옆 수는 가중치"
      nodes={plainNodes()}
      edges={inputEdges()}
      directed={false}
    />
  ),
  "concept-mst": () => (
    <NodeGraph
      title={`최소 신장 트리 — 굵은 간선 ${MST.length} 개, 가중치 합 ${ANSWER}`}
      nodes={plainNodes()}
      edges={WALK_EDGES.map((e) => ({
        from: e[0],
        to: e[1],
        label: String(e[2]),
        ...(inMst(e) ? { kind: "tree" as const } : { state: "out" as const }),
      }))}
      directed={false}
    />
  ),
  "concept-cut": () => {
    const s = stepAt(CONCEPT_T);
    return (
      <NodeGraph
        title={`트리 안 정점이 ${members(s.inTree).join(" · ")} 일 때 — 테를 가로지르는 간선이 경계 간선, 아래 두 줄은 우선순위 큐를 꺼낼 차례대로`}
        {...cutScene(s)}
        strips={queueStrips(s).map(({ states: _, ...x }) => x)}
        directed={false}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint="규모 V ≤ 10,000 · E ≤ V(V − 1)/2 · 단순 연산 1 초에 1 억 번 기준"
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-cut": () => {
    const s = stepAt(CUT_READ_T);
    return (
      <NodeGraph
        title={`${s.t}${이가(s.t)} 끝난 뒤 — 테 안이 트리 안 정점, 테를 가로지르는 간선이 경계 간선`}
        {...cutScene(s)}
        directed={false}
      />
    );
  },
  "build-queue": () => {
    const s = stepAt("T5");
    const next = drainOrder(s.heap)[0] as Item;
    return (
      <NodeGraph
        title={`${s.t}${이가(s.t)} 끝난 뒤 — 큐 맨 앞 ${itemText(next)}${은는(itemText(next))} 정점 ${next[0]}${이가(String(next[0]))} 이미 트리 안이라 지나간 후보`}
        nodes={LAYOUT.nodes.map((n, v) => {
          const value = nodeValues(s)[v];
          return value === null
            ? { ...n, value: "", state: "empty" as const }
            : { ...n, value };
        })}
        edges={WALK_EDGES.map(([from, to, w], k) => ({
          from,
          to,
          label: String(w),
          ...(treeEdgesAfter(s.t).has(k) ? { kind: "tree" as const } : {}),
        }))}
        groups={treeGroup(s, false)}
        strips={queueStrips(s)}
        directed={false}
      />
    );
  },
  "walk-film": () => <Film spec={primWalk as unknown as PlayerSpec} />,
  "invariant-cut": () => {
    const s = stepAt(INV_T);
    const prev = WALK.steps[WALK.steps.indexOf(s) - 1] as Step;
    return (
      <NodeGraph
        title={`${s.t} 직전 — 테를 가로지르는 경계 간선 중 가장 가벼운 것을 꺼낸다`}
        {...cutScene(prev)}
        directed={false}
      />
    );
  },
};
