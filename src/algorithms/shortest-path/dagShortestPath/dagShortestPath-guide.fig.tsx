/**
 * `dagShortestPath-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 진입 차수 · 위상 순서 · 거리는 정본과 같은 절차에 기록만
 * 덧붙인 사본(`-guide.proof.ts` 의 `record`)이 내고, 그 사본은 부를 때마다 자기 답을 정본
 * (`-guide.ref.ts`)과 맞댄다. 시도 사다리의 수는 증명 사이드카가 작은 규모의 실행과 맞대어 확인한 식에서
 * 받는다.
 *
 * ## 위상 순서를 무대에 보이는 법
 *
 * 이 편에서 독자가 알아야 할 것은 **정점의 차례가 올 때 그 정점으로 들어오는 간선이 이미 다
 * 완화됐다**는 것이다. 위상 순서 자체는 그래프 무대 아래 띠 하나(`strips`)로 그린다 — 새 패턴·무대를
 * 만들지 않는다(SPEC §12 「시각화 고르기」 · §13 그래프 줄).
 *
 * - 정점 안의 값은 위상 순서를 만드는 걸음(T1~T3)에서 진입 차수, 시작값을 적은 뒤(T4~)에는 거리다.
 *   차례가 지난 정점은 「거리」, 아직 차례가 안 온 정점은 「후보」로 적어 차례가 값을 굳히는 것을 보인다.
 * - 이번 걸음에 꺼낸 정점은 읽음, 값이 바뀐 정점은 새로 씀, 아직 값이 없는 정점은 아직(점선)이다.
 * - 굵은 실선은 지금 그 정점의 거리를 낸 간선이다. 건너뛴 정점의 간선은 이번 걸음 밖(흐린 선)이다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다. 정점 0 · 1 · 3 을 세모로 놓고 정점 2 를 그 안에 두어 간선이
 * 서로 가로지르지 않게 했다 — 네 정점 사이에 간선이 여섯이라 한 줄이나 두 줄로 놓으면 `0→3` 이 `1→2`
 * 와 가운데에서 포개진다. 간선이 모두 오른쪽이나 아래로 흐르고, 위상 순서의 차례는 띠가 보인다.
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
  comma,
  dots,
  num,
  originNumbers,
  plus,
  type Step,
  show,
  turnOf,
  WALK,
  WALK_DIST,
  WALK_EDGES,
  WALK_N,
  WALK_ORDER,
  WALK_SRC,
} from "./dagShortestPath-guide.proof.ts";
import { dagWalk } from "./dagShortestPath-guide.sim.ts";

const INF = Number.POSITIVE_INFINITY;

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 1.2, y: 2 },
    { id: 1, x: 2.4, y: 0.4 },
    { id: 2, x: 2.4, y: 1.45 },
    { id: 3, x: 3.6, y: 2 },
    { id: 4, x: 0, y: 1.2 },
    { id: 5, x: 0, y: 0.4 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: true,
};

const TOTAL_RELAX = WALK.reduce((a, s) => a + s.relax.length, 0);

/** 정점 `v` 의 차례가 걸음 `i` 까지 왔는가(그 걸음 포함). */
const turned = (v: number, i: number): boolean => WALK.indexOf(turnOf(v)) <= i;

/** 간선 번호 `e` 가 지금 정점의 거리를 낸 간선인가 — 굵은 실선으로 그린다. */
const isTree = (s: Step, e: number): boolean => {
  const [, v] = WALK_EDGES[e] as [number, number, number];
  return s.pred[v] === e;
};

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 ── */

function approaches(): Approach[] {
  const o = originNumbers();
  return [
    {
      name: "경로를 전부 나열하기",
      idea: "시작 정점에서 나가는 경로를 전부 만들어 도착 정점마다 가장 작은 비용을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `다이아몬드 사슬 V = ${comma(o.bigKV)} 에서 경로 조각 수가 ${comma(o.fragDigits)} 자리 수`,
          ok: false,
        },
      ],
      lesson:
        "갈래가 만날 때마다 뒤의 계산이 되풀이된다 — 경로가 아니라 정점마다 거리 하나를 들고 고쳐 가자",
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
        "라운드 수가 간선이 적힌 순서에 달렸다 — 정점을 볼 순서를 정해 간선을 한 번씩만 읽자",
    },
    {
      name: "번호가 작은 정점부터 한 번씩 보기",
      idea: "정점 0 부터 차례로 꺼내 그 정점의 나가는 간선을 한 번씩 완화한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `번호를 거스르는 넷에서 ${o.numberBack} — 정답은 ${o.backAnswer}`,
          ok: false,
        },
        { label: "시간", value: "완화 시도가 간선 수 이하", ok: true },
      ],
      lesson:
        "정점을 볼 때 들어오는 간선의 꼬리가 아직 안 끝났다 — 꼬리가 늘 먼저 오는 순서가 필요하다",
    },
    {
      name: "위상 순서대로 한 번씩 완화하기",
      idea: "모든 간선이 왼쪽에서 오른쪽으로 가게 정점을 늘어놓고, 그 차례로 나가는 간선을 한 번씩 완화한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "두 입력 모두 맞다", ok: true },
        {
          label: "시간",
          value: `전개 입력에서 완화 시도 ${o.walkTries} 번 — 간선 수 이하`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 걸음 하나의 정점. */
function stageNodes(i: number): GraphStep["nodes"] {
  const s = WALK[i] as Step;
  const last = i === WALK.length - 1;
  const improved = new Set(s.relax.filter((r) => r.improved).map((r) => r.v));
  return Array.from({ length: WALK_N }, (_, v) => {
    if (s.dist === null) {
      const state: CellState | undefined =
        s.kind === "build" || s.pushed.includes(v) ? "focus" : undefined;
      return {
        value: `진입 ${s.indegree[v]}`,
        ...(state ? { state } : {}),
      };
    }
    const d = s.dist[v] as number;
    if (d === INF) {
      if (v === s.u) return { value: "Infinity", state: "read" as const };
      return last
        ? { value: "Infinity", state: "out" as const }
        : { value: "", state: "empty" as const };
    }
    let state: CellState | undefined;
    if (s.kind === "start" && v === WALK_SRC) state = "focus";
    else if (improved.has(v)) state = "focus";
    else if (v === s.u) state = "read";
    return {
      value: `${turned(v, i) ? "거리" : "후보"} ${num(d)}`,
      ...(state ? { state } : {}),
    };
  });
}

/** 걸음 하나의 간선. */
function stageEdges(i: number): GraphStep["edges"] {
  const s = WALK[i] as Step;
  return WALK_EDGES.map(([u, v, w], e) => {
    const kind: EdgeKind | undefined = isTree(s, e) ? "tree" : undefined;
    let state: GraphEdge["state"];
    if (s.kind === "build" || s.kind === "order") state = "read";
    else if (s.kind === "skip" && u === s.u) state = "out";
    else {
      const r = s.relax.find((x) => x.u === u && x.v === v && x.w === w);
      if (r) state = r.improved ? "focus" : "read";
    }
    return {
      ...(kind ? { kind } : {}),
      ...(state ? { state } : {}),
      label: String(w),
    };
  });
}

/** 무대 아래 위상 순서의 띠. */
function stageStrip(i: number): GraphStep["strips"] {
  const s = WALK[i] as Step;
  const states: Partial<Record<number, CellState>> = {};
  if (s.kind === "seeds" || s.kind === "order") {
    for (const v of s.pushed) states[s.order.indexOf(v)] = "focus";
  } else if (s.u !== null) {
    states[s.order.indexOf(s.u)] = "read";
  }
  return [{ label: "위상 순서", values: [...s.order], states, slots: WALK_N }];
}

function stageCalc(i: number): GraphStep["calc"] {
  const s = WALK[i] as Step;
  switch (s.kind) {
    case "build":
      return {
        expr: `간선 ${WALK_EDGES.length} 개 → 진입 차수의 합`,
        result: String(s.indegree.reduce((a, b) => a + b, 0)),
      };
    case "seeds":
      return { expr: "indegree[v] === 0 →", result: dots(s.pushed) };
    case "order":
      return { expr: "order.length →", result: String(s.order.length) };
    case "start":
      return { expr: `dist[${WALK_SRC}] =`, result: "0" };
    case "skip":
      return { expr: `dist[${s.u}] === Infinity →`, result: "건너뛴다" };
    default:
      return s.relax.length === 0
        ? { expr: `adj[${s.u}] →`, result: "비어 있다" }
        : {
            expr: `${s.relax.map((r) => plus(r.d, r.w)).join(" · ")} =`,
            result: s.relax.map((r) => String(r.nd)).join(" · "),
          };
  }
}

function stageVars(i: number): string | null {
  const s = WALK[i] as Step;
  if (s.dist === null || s.kind === "start") return null;
  const done = WALK.slice(0, i + 1).reduce((a, x) => a + x.relax.length, 0);
  return `완화 시도 ${done} / ${TOTAL_RELAX}`;
}

function stepTitle(i: number): string {
  const s = WALK[i] as Step;
  const u = s.u as number;
  switch (s.kind) {
    case "build":
      return `${s.t} 간선 ${WALK_EDGES.length} 개를 adj 와 indegree 로 옮긴다`;
    case "seeds":
      return `${s.t} 진입 차수가 0 인 ${dots(s.pushed)}${을를(s.pushed.at(-1) ?? 0)} 앞자리에 놓는다`;
    case "order":
      return `${s.t} 위상 순서를 끝까지 채운다`;
    case "start":
      return `${s.t} 시작값 — dist[${WALK_SRC}] = 0`;
    case "skip":
      return `${s.t} 정점 ${u} — 갈 길이 없어 건너뛴다`;
    default:
      return s.relax.length === 0
        ? `${s.t} 정점 ${u} — 나가는 간선이 없다`
        : `${s.t} 정점 ${u} 의 간선 ${s.relax.length} 개를 완화한다`;
  }
}

function stepText(i: number): string {
  const s = WALK[i] as Step;
  const u = s.u as number;
  switch (s.kind) {
    case "build":
      return `간선마다 꼬리의 이웃 목록에 한 칸을 넣고 머리의 진입 차수를 하나 올립니다. 진입 차수는 차례로 ${show(s.indegree)} 입니다.`;
    case "seeds":
      return `진입 차수가 0 인 정점은 ${dots(s.pushed)} 입니다. 번호가 작은 것부터 위상 순서의 앞자리에 놓으면 위상 순서는 ${show(s.order)} 에서 시작합니다.`;
    case "order": {
      const appended = s.pops.flatMap((p) =>
        p.decs.filter((d) => d.pushed).map((d) => `${p.u} 뒤에 ${d.v}`),
      );
      return `앞에서부터 꺼내며 나가는 간선의 머리마다 진입 차수를 하나씩 내리고, 0 이 된 정점을 뒤에 붙입니다(${dots(appended)}). 위상 순서는 ${show(s.order)} 입니다.`;
    }
    case "start":
      return `dist[${WALK_SRC}] 에 0 을 적고 나머지는 Infinity 로 둡니다. 이제 위상 순서의 앞자리부터 정점을 하나씩 봅니다.`;
    case "skip":
      return `dist[${u}] 가 Infinity 라 정점 ${u} 까지 가는 길이 아직 없습니다. 나가는 간선을 보지 않고 건너뜁니다.`;
    default: {
      if (s.relax.length === 0) {
        return `정점 ${u} 은 나가는 간선이 없어 할 일이 없습니다. 위상 순서를 다 읽었으니 반환값은 ${show(WALK_DIST)} 입니다.`;
      }
      const parts = s.relax.map((r) => {
        const nd = String(r.nd);
        if (!r.improved) {
          return `${r.u}→${r.v} 는 ${plus(r.d, r.w)} = ${nd}${이가(nd)} 적혀 있던 ${num(r.before)} 보다 작지 않아 그대로 둡니다.`;
        }
        return r.before === INF
          ? `${r.u}→${r.v} 는 ${plus(r.d, r.w)} = ${nd}${을를(nd)} 처음 적습니다.`
          : `${r.u}→${r.v} 는 ${plus(r.d, r.w)} = ${nd}${이가(nd)} 적혀 있던 ${num(r.before)} 보다 작아 고칩니다.`;
      });
      return [
        `정점 ${u} 의 차례입니다. 들어오는 간선을 이미 다 봤으니 dist[${u}] = ${num((s.dist as readonly number[])[u] as number)}${이가(num((s.dist as readonly number[])[u] as number))} 이 정점의 거리입니다.`,
        ...parts,
      ].join(" ");
    }
  }
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return WALK.map((_, i) => {
    const vars = stageVars(i);
    return {
      title: stepTitle(i),
      text: stepText(i),
      nodes: stageNodes(i),
      edges: stageEdges(i),
      strips: stageStrip(i),
      calc: stageCalc(i),
      vars,
    };
  });
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
    const d = WALK_DIST[n.id] as number;
    return d === INF
      ? { ...n, value: "Infinity", state: "out" as const }
      : { ...n, value: `거리 ${num(d)}` };
  });
}

const weightEdges = (): GraphEdge[] =>
  LAYOUT.edges.map((e, i) => ({
    ...e,
    label: String((WALK_EDGES[i] as [number, number, number])[2]),
  }));

export const FIGS: Record<string, () => ReactElement> = {
  "concept-graph": () => (
    <NodeGraph
      title="전개 입력 — 간선 옆 수는 가중치, 정점 안의 수는 정점 0 에서의 최단 거리"
      nodes={finalNodes()}
      edges={weightEdges().map((e, i) =>
        isTree(END, i) ? { ...e, kind: "tree" as const } : e,
      )}
    />
  ),
  "concept-order": () => (
    <NodeGraph
      title={`위상 순서 ${show(WALK_ORDER)} — 정점을 그 자리에 놓으면 간선이 모두 오른쪽을 향한다`}
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: `자리 ${WALK_ORDER.indexOf(n.id)}`,
      }))}
      edges={weightEdges()}
      strips={[{ label: "위상 순서", values: [...WALK_ORDER] }]}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    const o = originNumbers();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`규모 V ≤ ${comma(o.bigV)} · E ≤ ${comma(o.bigE)} · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-turn": () => {
    const turn = turnOf(3);
    const at = WALK.indexOf(turn);
    const before = WALK[at - 1] as Step;
    const dist = before.dist as readonly number[];
    return (
      <NodeGraph
        title={`${before.t}${이가(before.t)} 끝난 뒤 — 정점 3 의 차례가 오기 전에 들어오는 간선 ${WALK_EDGES.filter(([, v]) => v === 3).length} 개를 모두 완화했다`}
        nodes={LAYOUT.nodes.map((n) => {
          const d = dist[n.id] as number;
          if (d === INF) return { ...n, value: "", state: "empty" as const };
          return n.id === 3
            ? { ...n, value: `후보 ${num(d)}`, state: "read" as const }
            : { ...n, value: `거리 ${num(d)}` };
        })}
        edges={weightEdges().map((e, i) => {
          const into = (WALK_EDGES[i] as [number, number, number])[1] === 3;
          return {
            ...e,
            ...(isTree(before, i) ? { kind: "tree" as const } : {}),
            state: into ? ("read" as const) : ("out" as const),
          };
        })}
        strips={[
          {
            label: "위상 순서",
            values: [...WALK_ORDER],
            states: { [WALK_ORDER.indexOf(3)]: "read" },
          },
        ]}
      />
    );
  },
  "walk-dag": () => <Film spec={dagWalk as unknown as PlayerSpec} />,
};
