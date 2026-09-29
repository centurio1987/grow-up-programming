/**
 * `dijkstra-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 거리 · 확정 · 우선순위 큐의 내용은 정본과 같은 절차에
 * 기록만 덧붙인 사본(`-guide.proof.ts` 의 `record`)이 내고, 그 사본은 부를 때마다 자기 답을 정본
 * (`-guide.ref.ts`)과 맞댄다. 시도 사다리의 수는 증명 사이드카가 작은 규모의 실행과 맞대어 확인한
 * 식에서 받는다.
 *
 * ## 우선순위 큐를 무대에 보이는 법 — 이 편이 세운다(KAN-058)
 *
 * 이 편에서 독자가 우선순위 큐에서 알아야 할 것은 **다음에 무엇이 나오는가**와 **같은 정점의 옛
 * 항목이 함께 들어 있다**는 것 둘이다. 힙의 트리 모양은 그 둘 어느 것에도 필요하지 않다 — 트리
 * 모양은 「왜 꺼내기가 `log` 번의 비교로 끝나는가」의 답이고, 그것은 본문 「수행으로 알아보는
 * 알고리즘」 2. 가 배열 순서의 작은 실행으로 따로 보인다. 그래서 새 패턴·무대를 만들지 않고 그래프
 * 무대의 **띠 둘**(`strips`)로 그린다(SPEC §12 「시각화 고르기」 · §13 그래프 줄).
 *
 * - 띠는 큐에 든 항목을 **꺼낼 차례대로** 늘어놓는다. 배열에 놓인 순서가 아니다 — 힙 사본을 하나 떠서
 *   비울 때까지 꺼낸 차례(`drainOrder`)라, 키가 같은 두 항목의 앞뒤도 실제로 꺼낼 차례와 같다. 첫 칸이
 *   곧 다음 걸음에 꺼낼 항목이다.
 * - 윗줄이 정점, 아랫줄이 키다. 같은 칸 번호가 한 항목 `(정점, 키)` 이다.
 * - 이번 걸음에 넣은 항목은 새로 씀(`focus`), 이미 뒤처진 기록(키가 그 정점의 `dist` 보다 큰 항목)은
 *   이번 걸음 밖(`out`, 대시 테 · 흐린 글자)이다. 칸 수는 큐가 가장 커졌을 때에 맞춰 고정한다.
 *
 * 뒤에 오는 `primMst` · `medianFromDataStream` · `topKFrequent` 도 「꺼낼 차례」가 요점이면 이 띠를
 * 그대로 쓴다. 힙의 **모양 자체**(부모·자식 비교와 맞바꿈)가 요점인 편이 나오면 그때 SPEC §13 힙 줄의
 * 무대를 따로 세운다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 정점 0 을 왼쪽에 두고, 간선이 없는 정점 5 는 오른쪽
 * 아래에 떨어뜨려 둔다. 간선 옆 수는 가중치다.
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
  type GraphStrip,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  comma,
  drainOrder,
  isStale,
  item,
  num,
  originNumbers,
  pathOf,
  type Step,
  show,
  WALK,
  WALK_EDGES,
  WALK_SRC,
} from "./dijkstra-guide.proof.ts";
import { dijkstraWalk } from "./dijkstra-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 0, y: 1 },
    { id: 1, x: 1.3, y: 0 },
    { id: 2, x: 1.3, y: 2 },
    { id: 3, x: 2.6, y: 1 },
    { id: 4, x: 3.9, y: 0 },
    { id: 5, x: 3.9, y: 2 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: true,
};

const INF = Number.POSITIVE_INFINITY;

/** 확정한 정점은 「거리」, 아직 줄어들 수 있는 정점은 「후보」. */
const nodeValue = (s: Step, v: number): string =>
  `${s.settled[v] ? "거리" : "후보"} ${num(s.dist[v] as number)}`;

/** 간선 u→v 가 지금 거리를 낸 간선인가 — 굵은 실선(`tree`)으로 그린다. */
const isTree = (s: Step, [u, v]: readonly [number, number, number]): boolean =>
  s.pred[v] === u;

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
    {
      label: "큐 · 정점",
      values: order.map(([v]) => v),
      states,
      slots,
    },
    {
      label: "큐 · 키",
      values: order.map(([, k]) => k),
      states,
      slots,
    },
  ];
}

const SLOTS = Math.max(...WALK.map((s) => s.heap.length));
const TOTAL_RELAX = WALK.reduce((a, s) => a + s.relax.length, 0);

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 ── */

function approaches(): Approach[] {
  const o = originNumbers();
  return [
    {
      name: "경로를 전부 나열하기",
      idea: "시작 정점에서 나가는 단순 경로를 전부 만들어 도착 정점마다 가장 작은 비용을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `다이아몬드 사슬 V = ${comma(o.bigKV)} 에서 경로 수가 ${comma(o.pathDigits)} 자리 수`,
          ok: false,
        },
      ],
      lesson:
        "경로는 간선 수보다 훨씬 빨리 늘어난다 — 경로가 아니라 정점마다 거리 하나를 들고 고쳐 가자",
    },
    {
      name: "간선 목록을 라운드마다 다시 읽기",
      idea: "간선 전부를 읽어 dist[u] + w 가 더 작으면 dist[v] 를 고치고, 고칠 것이 없을 때까지 되풀이한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `거꾸로 놓은 사슬 V = ${comma(o.bigV)} 에서 간선 읽기 ${comma(o.roundReads)} 번 · ${o.roundSec}`,
          ok: false,
        },
      ],
      lesson:
        "값이 다 정해진 정점의 간선까지 라운드마다 다시 읽는다 — 정점을 한 번씩 확정하고 그 간선만 읽자",
    },
    {
      name: "먼저 넣은 것 먼저 꺼내기 — 너비 우선 탐색의 큐",
      idea: "거리를 고친 정점을 큐 뒤에 넣고 앞에서 꺼내 그 간선을 완화한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `지름길 64 에서 완화 시도 ${comma(o.fifoChecks)} 번 — 간선 ${comma(o.shortcutE)} 개보다 많다`,
          ok: false,
        },
      ],
      lesson:
        "먼저 꺼낸 정점의 거리가 뒤에 더 작아져 그 정점을 다시 꺼낸다 — 거리가 가장 작은 것부터 꺼내자",
    },
    {
      name: "거리가 가장 작은 것부터 꺼내 확정하기",
      idea: "우선순위 큐에서 키가 가장 작은 항목을 꺼내 그 정점을 확정하고, 그 정점의 간선만 완화한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: "완화 시도가 세 그래프 모두 간선 수 E 와 같다",
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 걸음 하나의 무대. */
function stage(i: number): GraphStep {
  const s = WALK[i] as Step;
  const improved = new Set(s.relax.filter((r) => r.improved).map((r) => r.v));
  const nodes = s.dist.map((d, v) => {
    if (d === INF) {
      return s.kind === "end"
        ? { value: "Infinity", state: "out" as const }
        : { value: "", state: "empty" as const };
    }
    let state: CellState | undefined;
    if (s.kind === "start" && v === WALK_SRC) state = "focus";
    else if (improved.has(v)) state = "focus";
    else if (s.popped && v === s.popped[0]) state = "read";
    return { value: nodeValue(s, v), ...(state ? { state } : {}) };
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
  const done = WALK.slice(0, i + 1).reduce((a, x) => a + x.relax.length, 0);
  let calc: GraphStep["calc"];
  if (s.kind === "start") calc = { expr: `dist[${WALK_SRC}] =`, result: "0" };
  else if (s.kind === "end") calc = { expr: "pq.size() > 0 →", result: "거짓" };
  else {
    const [u, d] = s.popped as [number, number];
    const du = (WALK[i - 1] as Step).dist[u] as number;
    calc =
      s.kind === "stale"
        ? { expr: `${d} > dist[${u}] = ${num(du)} →`, result: "버린다" }
        : { expr: `${d} = dist[${u}] →`, result: "확정" };
  }
  return {
    nodes,
    edges,
    strips: queueStrips(s, SLOTS),
    calc,
    vars: `완화 시도 ${done} / ${TOTAL_RELAX}`,
  };
}

function stepTitle(i: number): string {
  const s = WALK[i] as Step;
  if (s.kind === "start") return `${s.t} 시작값 — 큐에 ${item([WALK_SRC, 0])}`;
  if (s.kind === "end") return `${s.t} 큐가 비어 끝난다`;
  const p = s.popped as [number, number];
  const who = `정점 ${p[0]}${을를(String(p[0]))}`;
  return s.kind === "stale"
    ? `${s.t} ${who} 다시 꺼낸다 — 키 ${p[1]}`
    : `${s.t} ${who} 꺼낸다 — 키 ${p[1]}`;
}

function stepText(i: number): string {
  const s = WALK[i] as Step;
  if (s.kind === "start") {
    return `dist[${WALK_SRC}] 에 0 을 적고 나머지는 Infinity 로 둡니다. 우선순위 큐에는 항목 ${item([WALK_SRC, 0])} 하나가 들어갑니다.`;
  }
  if (s.kind === "end") {
    const out = s.dist
      .map((d, v) => ({ d, v }))
      .filter((x) => x.d === INF)
      .map((x) => x.v);
    return `큐가 비어 반복이 끝납니다. 한 번도 큐에 안 들어간 정점 ${out.join(" · ")} 의 거리는 Infinity 로 남고, 반환값은 ${show(s.dist)} 입니다.`;
  }
  const [u, d] = s.popped as [number, number];
  const du = (WALK[i - 1] as Step).dist[u] as number;
  if (s.kind === "stale") {
    return `키 ${d}${이가(String(d))} 지금 적힌 dist[${u}] = ${num(du)} 보다 큽니다. 더 작은 값으로 고치기 전에 넣어 둔 뒤처진 기록이라, 이웃을 하나도 보지 않고 버립니다.`;
  }
  const parts = s.relax.map((r) => {
    const nd = String(r.nd);
    if (!r.improved) {
      return `${r.u}→${r.v} 는 ${r.d} + ${r.w} = ${nd} 가 적혀 있던 ${num(r.before)} 보다 작지 않아 그대로 둡니다.`;
    }
    return r.before === INF
      ? `${r.u}→${r.v} 는 ${r.d} + ${r.w} = ${nd}${이가(nd)} 처음 적히고 큐에 ${item([r.v, r.nd])}${을를(item([r.v, r.nd]))} 넣습니다.`
      : `${r.u}→${r.v} 는 ${r.d} + ${r.w} = ${nd}${이가(nd)} 적혀 있던 ${num(r.before)} 보다 작아 고치고 큐에 ${item([r.v, r.nd])}${을를(item([r.v, r.nd]))} 넣습니다.`;
  });
  return [
    `키 ${d}${이가(String(d))} dist[${u}] 와 같아 정점 ${u}${을를(String(u))} 확정합니다.`,
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

/* ── 정적 그림들 ── */

const END = WALK.at(-1) as Step;

/** 최종 거리를 정점 안에 적은 정점들. 도달하지 못한 정점은 이번 걸음 밖. */
function finalNodes(): GraphNode[] {
  return LAYOUT.nodes.map((n) => {
    const d = END.dist[n.id] as number;
    return d === INF
      ? { ...n, value: "Infinity", state: "out" as const }
      : { ...n, value: `거리 ${num(d)}` };
  });
}

/** 확정한 차례 — 확정한 걸음의 꺼낸 정점을 차례대로. */
function settleOrder(): [number, number][] {
  return WALK.filter((s) => s.kind === "settle").map(
    (s) => s.popped as [number, number],
  );
}

/** 정점 4 까지의 최단 경로가 지나는 간선의 번호. */
function pathEdges(to: number): Set<number> {
  const p = pathOf(END.pred, to);
  const out = new Set<number>();
  for (let i = 0; i + 1 < p.length; i++) {
    out.add(WALK_EDGES.findIndex(([u, v]) => u === p[i] && v === p[i + 1]));
  }
  return out;
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-graph": () => (
    <NodeGraph
      title="전개 입력 — 간선 옆 수는 가중치, 정점 안의 수는 정점 0 에서의 최단 거리"
      nodes={finalNodes()}
      edges={WALK_EDGES.map((e) => ({
        from: e[0],
        to: e[1],
        label: String(e[2]),
        ...(isTree(END, e) ? { kind: "tree" as const } : {}),
      }))}
      strips={[
        { label: "확정한 차례", values: settleOrder().map(([v]) => v) },
        { label: "그 거리", values: settleOrder().map(([, d]) => d) },
      ]}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    const o = originNumbers();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`규모 V ≤ ${comma(o.bigV)} · E ≤ 200,000 · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-relax": () => {
    const byEdge = new Map<
      string,
      { d: number; w: number; nd: number; improved: boolean }
    >();
    for (const s of WALK) {
      for (const r of s.relax) byEdge.set(`${r.u}-${r.v}`, r);
    }
    return (
      <NodeGraph
        title="간선마다 한 번씩 완화한 값 dist[u] + w — 흐린 간선은 값을 못 줄였다"
        nodes={finalNodes()}
        edges={WALK_EDGES.map(([from, to]) => {
          const r = byEdge.get(`${from}-${to}`);
          return {
            from,
            to,
            ...(r
              ? {
                  label: `${r.d} + ${r.w} = ${r.nd}`,
                  ...(r.improved ? {} : { state: "out" as const }),
                }
              : {}),
          };
        })}
      />
    );
  },
  "build-settle": () => {
    const at = WALK.findIndex(
      (s) =>
        s.kind === "settle" &&
        s.relax.some((r) => r.improved && r.before !== INF),
    );
    const s = WALK[at] as Step;
    const next = drainOrder(s.heap)[0] as [number, number];
    const strips = queueStrips(s, SLOTS).map((x) => ({
      ...x,
      states: { ...(x.states ?? {}), 0: "read" as const },
    }));
    return (
      <NodeGraph
        title={`${s.t}${이가(s.t)} 끝난 뒤 — 큐 맨 앞 ${item(next)} 의 키가 남은 키 중 가장 작다`}
        nodes={LAYOUT.nodes.map((n) => {
          const d = s.dist[n.id] as number;
          if (d === INF) return { ...n, value: "", state: "empty" as const };
          return {
            ...n,
            value: nodeValue(s, n.id),
            ...(n.id === next[0] ? { state: "read" as const } : {}),
          };
        })}
        edges={WALK_EDGES.map((e) => ({
          from: e[0],
          to: e[1],
          label: String(e[2]),
          ...(isTree(s, e) ? { kind: "tree" as const } : {}),
        }))}
        strips={strips}
      />
    );
  },
  "walk-dijkstra": () => <Film spec={dijkstraWalk as unknown as PlayerSpec} />,
  "related-prefix": () => {
    const on = pathEdges(4);
    return (
      <NodeGraph
        title="정점 4 까지의 최단 경로 — 굵은 간선이 그 경로, 앞부분마다 끝 정점의 거리와 같다"
        nodes={finalNodes()}
        edges={WALK_EDGES.map(([from, to, w], i) => ({
          from,
          to,
          label: String(w),
          ...(on.has(i)
            ? { kind: "tree" as const, state: "focus" as const }
            : { state: "out" as const }),
        }))}
      />
    );
  },
};
